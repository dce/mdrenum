import fs from 'node:fs/promises'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {Node, Parent, LinkReference} from 'mdast'

const doc = await fs.readFile('test.md')
const tree = fromMarkdown(doc)
const content = doc.toString()

let findLinks = function(node: Node): LinkReference[] {
  if (node.type === 'linkReference') {
    return [node as LinkReference]
  }

  if ('children' in node) {
    const parent = node as Parent

    return parent.children.reduce(
      function(links, child) { return links.concat(findLinks(child)) },
      [] as LinkReference[]
    )
  }

  return []
}

findLinks(tree).forEach(function(link) {
  console.log(link)

  if (link.position && link.position.start.offset && link.position.end.offset) {
    console.log(content.substring(link.position.start.offset, link.position.end.offset))
  }
})
