import {fromMarkdown} from 'mdast-util-from-markdown'
import {Definition, LinkReference, Node, Parent, Root} from 'mdast'
import invariant from 'tiny-invariant'

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

    return parent.children.reduce(function (links, child) {
      return links.concat(findNodes(child))
    }, [] as LinkNode[])
  }

  return []
}

function dupDefinitions(nodes: LinkNode[]): boolean {
  let refMap: RefMap = {}
  let dup = false

  nodes.forEach(function (node) {
    if (node.type === 'definition') {
      if (refMap[node.identifier] !== undefined) {
        dup = true
      }

      refMap[node.identifier] = 0
    }
  })

  return dup
}

function buildRefMap(nodes: LinkNode[]): RefMap {
  let index = 1
  let refMap: RefMap = {}

  nodes.forEach(function (node) {
    if (
      node.type === 'linkReference' &&
      refMap[node.identifier] === undefined
    ) {
      refMap[node.identifier] = index++
    }
  })

  nodes.forEach(function (node) {
    if (node.type === 'definition' && refMap[node.identifier] === undefined) {
      refMap[node.identifier] = index++
    }
  })

  return refMap
}

function updateLinkNumbers(
  nodes: LinkNode[],
  refMap: RefMap,
  content: string
): string {
  let offset = 0

  return nodes.reduce(function (str, node) {
    invariant(
      node.position !== undefined &&
        node.position.start.offset !== undefined &&
        node.position.end.offset !== undefined,
      'Expected node to have position with offsets'
    )

    const start = node.position.start.offset + offset
    const end = node.position.end.offset + offset
    const nodeContent = str.substring(start, end)
    let matcher = new RegExp(`\\[${node.identifier}\\]$`)

    if (node.type === 'definition') {
      matcher = new RegExp(`^\\[${node.identifier}\\]`)
    }

    const updatedContent = nodeContent.replace(
      matcher,
      `[${refMap[node.identifier]}]`
    )
    offset += updatedContent.length - nodeContent.length

    return str.substring(0, start) + updatedContent + str.substring(end)
  }, content)
}

function findDefinitionGroups(tree: Root): Definition[][] {
  let groups: Definition[][] = []
  let current: Definition[] = []

  tree.children.forEach(function (node) {
    if (node.type == 'definition' && node.identifier.match(/^\d+$/)) {
      current.push(node)
    } else if (current.length > 0) {
      groups.push(current)
      current = []
    }
  })

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
}

function sortDefinitions(content: string): string {
  const tree = fromMarkdown(content)
  const groups = findDefinitionGroups(tree)
  let newContent = content
  let offset = 0

  groups.forEach(function (group) {
    const sorted = group.slice(0).sort(function (d1, d2) {
      return Number(d1.identifier) - Number(d2.identifier)
    })

    for (let i = 0; i < group.length; i++) {
      const oldDef = group[i]
      const newDef = sorted[i]

      invariant(
        oldDef.position !== undefined &&
          oldDef.position.start.offset !== undefined &&
          oldDef.position.end.offset !== undefined,
        'Expected node to have position with offsets'
      )

      invariant(
        newDef.position !== undefined &&
          newDef.position.start.offset !== undefined &&
          newDef.position.end.offset !== undefined,
        'Expected node to have position with offsets'
      )

      const oldDefStr = content.substring(
        oldDef.position.start.offset,
        oldDef.position.end.offset
      )

      const newDefStr = content.substring(
        newDef.position.start.offset,
        newDef.position.end.offset
      )

      const start = oldDef.position.start.offset + offset
      const end = oldDef.position.end.offset + offset

      newContent =
        newContent.substring(0, start) + newDefStr + newContent.substring(end)
      offset += newDefStr.length - oldDefStr.length
    }
  })

  return newContent
}

export function renumberLinks(content: string): [string, string | null] {
  const nodes = findNodes(fromMarkdown(content))

  if (process.env.DEBUG !== undefined) {
    console.log(nodes)
  }

  if (dupDefinitions(nodes)) {
    return ['', 'duplicate definition detected']
  }

  const refMap = buildRefMap(nodes)
  const updated = updateLinkNumbers(nodes, refMap, content)

  if (nodes.length !== findNodes(fromMarkdown(updated)).length) {
    return ['', 'undefined link detected']
  }

  return [sortDefinitions(updated), null]
}
