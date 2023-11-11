import {readFileSync, writeFileSync} from 'node:fs'
import {globSync} from 'glob'
import {renumberLinks} from './mdrenum'

let files = process.argv.slice(2)

if (files[0] === "--stdin") {
  const updated = renumberLinks(readFileSync(process.stdin.fd).toString())
  process.stdout.write(updated)
  process.exit()
}

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
  const content = readFileSync(file).toString()
  const updated = renumberLinks(content)

  if (content !== updated) {
    console.error(`Links in ${file} are not in order`)
    failed = true

    if (fix) {
      writeFileSync(file, updated)
    }
  }
})

if (failed) {
  process.exit(1)
}
