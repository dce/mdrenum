import {Command} from 'commander'
import {readFileSync, writeFileSync} from 'node:fs'
import {globSync} from 'glob'
import {renumberLinks} from './mdrenum.ts'

function processStdin() {
  const content = readFileSync(process.stdin.fd).toString()
  const [updated, error] = renumberLinks(content)

  if (error === null) {
    process.stdout.write(updated)
  } else {
    process.stdout.write(content)
  }
}

function processFiles(files: string[], fix: boolean): boolean {
  let success = true

  files.forEach(function (file) {
    const content = readFileSync(file).toString()
    const [updated, error] = renumberLinks(content)

    if (error !== null) {
      console.error(`Error in ${file}: ${error}`)
      success = false
    } else if (content !== updated) {
      console.error(`Links in ${file} are not in order`)
      success = false

      if (fix) {
        writeFileSync(file, updated)
      }
    }
  })

  return success
}

let program = new Command()

program
  .argument(
    '[files...]',
    'files to scan (default: .md files in current directory + subdirectories)'
  )
  .option('-s, --stdin', 'read content from STDIN, write to STDOUT', false)
  .option('-f, --fix', 'update files to put links in sequential order', false)
  .action(function (files, opts) {
    if (opts.stdin) {
      processStdin()
      process.exit()
    }

    if (files.length === 0) {
      files = globSync('**/*.md')
    }

    if (processFiles(files, opts.fix) === false) {
      process.exit(1)
    }
  })
  .parse()
