import {readFileSync, writeFileSync} from 'node:fs'
import {globSync} from 'glob'
import {renumberLinks} from './mdrenum.ts'

let files = process.argv.slice(2)

if (files[0] === "--stdin") {
  const content = readFileSync(process.stdin.fd).toString()
  const [updated, error] = renumberLinks(content)

  if (error === null) {
    process.stdout.write(updated)
  } else {
    process.stdout.write(content)
  }

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
  const [updated, error] = renumberLinks(content)

  if (error !== null) {
    console.error(`Error in ${file}: ${error}`)
    failed = true
  } else if (content !== updated) {
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
