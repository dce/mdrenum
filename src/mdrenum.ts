import {fromMarkdown} from 'mdast-util-from-markdown'
import {Definition, LinkReference, Node, Parent} from 'mdast'

interface RefMap {
  [index: string]: number
}

type LinkNode = LinkReference | Definition

function findNodes(node: Node): LinkNode[] {
  if (node.type === 'linkReference' || node.type === 'definition') {
    const linkNode = node as LinkNode

    if (linkNode.identifier.match(/^\d+$/)) {
      return [linkNode]
    }
  }

  if ('children' in node) {
    const parent = node as Parent

    return parent.children.reduce(
      function(links, child) { return links.concat(findNodes(child)) },
      [] as LinkNode[]
    )
  }

  return []
}

function buildRefMap(nodes: LinkNode[]): RefMap {
  let index = 1
  let refMap: RefMap = {}

  nodes.forEach(
    function (node) {
      if (node.type === 'linkReference' && refMap[node.identifier] === undefined) {
        refMap[node.identifier] = index++
      }
    }
  )

  nodes.forEach(
    function (node) {
      if (node.type === 'definition' && refMap[node.identifier] === undefined ) {
        refMap[node.identifier] = index++
      }
    }
  )

  return refMap
}

function updateContent(nodes: LinkNode[], refMap: RefMap, content: string): string {
  let offset = 0

  return nodes.reduce(
    function(str, node) {
      if (node.position === undefined) {
        return str
      }

      let start = node.position.start.offset
      let end = node.position.end.offset

      if (start === undefined || end === undefined) {
        return str
      }

      start += offset
      end += offset

      const nodeContent = str.substring(start, end)
      let matcher = new RegExp(`\\[${node.identifier}\\]$`)

      if (node.type === "definition") {
        matcher = new RegExp(`^\\[${node.identifier}\\]`)
      }

      const updatedContent = nodeContent.replace(matcher, `[${refMap[node.identifier]}]`)

      offset += updatedContent.length - nodeContent.length

      return str.substring(0, start) + updatedContent + str.substring(end)
    },
    content
  )
}

export function fixDocument(content: string): string {
  const tree = fromMarkdown(content)
  const nodes = findNodes(tree)
  const refMap = buildRefMap(nodes)
  return updateContent(nodes, refMap, content)
}
