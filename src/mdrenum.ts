import fs from 'node:fs'
import {globSync} from 'glob'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {Node, Parent, LinkReference, Definition} from 'mdast'

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

  return nodes.reduce(
    function (dict, link) {
      if (!dict[link.identifier]) {
        dict[link.identifier] = index
        index++
      }

      return dict
    },
    {}
  )
}

function updateContent(nodes: LinkNode[], refMap: RefMap, content: string): string {
  let offset = 0

  return nodes.reduce(
    function(str, node) {
      if (node.position == undefined) {
        return str
      }

      let start = node.position.start.offset
      let end = node.position.end.offset

      if (start == undefined || end == undefined) {
        return str
      }

      start += offset
      end += offset

      let nodeContent = str.substring(start, end)
      let matcher = new RegExp(`\\[${node.identifier}\\]$`)

      if (node.type == "definition") {
        matcher = new RegExp(`^\\[${node.identifier}\\]`)
      }

      let updatedContent = nodeContent.replace(matcher, `[${refMap[node.identifier]}]`)

      offset += updatedContent.length - nodeContent.length

      return str.substring(0, start) + updatedContent + str.substring(end)
    },
    content
  )
}

let files = process.argv.slice(2)
let fix = false
let failed = false

if (files[0] === "--fix") {
  fix = true
  files.shift()
}

if (files.length === 0) {
  files = globSync('**/*.md')
}

files.forEach(function(file) {
  const content= fs.readFileSync(file).toString()
  const tree = fromMarkdown(content)

  const nodes = findNodes(tree)
  const refMap = buildRefMap(nodes)
  const updated = updateContent(nodes, refMap, content)

  if (content !== updated) {
    console.error(`Links in ${file} are not in order`)
    failed = true

    if (fix) {
      fs.writeFileSync(file, updated)
    }
  }
})

if (failed) {
  process.exit(1)
}
