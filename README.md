# mdrenum

Keep numbered, reference-style Markdown links in sequential order. If you have a document like this:

```markdown
Here's a [link][1].

[1]: https://link-a.com

Here's another [link][2].

[2]: https://link-b.com
````

And you add a new link at the beginning, like this:

```markdown
Here's a [new link][3]. Here's a [link][1].

[1]: https://link-a.com
[3]: https://link-c.com

Here's another [link][2].

[2]: https://link-b.com
````

The result of running `mdrenum --fix` will be:

```markdown
Here's a [new link][1]. Here's a [link][2].

[1]: https://link-c.com
[2]: https://link-a.com

Here's another [link][3].

[3]: https://link-b.com
```

## Usage

```
Usage: mdrenum [options] [files...]

Arguments:
  files        files to scan (default: .md files in current directory + subdirectories)

Options:
  -s, --stdin  read content from STDIN, write to STDOUT (default: false)
  -f, --fix    update files to put links in sequential order (default: false)
  -h, --help   display help for command
```

## Caveats

* If renumbering the links causes a previously-undefined reference to gain a valid reference, `mdrenum` will report an error and won't update the file.
* If `mdrenum` encounters multiple definitions with the same identifier, it will report an error and won't update the file.
* Order is determined by the position of links; definitions that don't have any associated links will be numbered after all definitions that have links.
* This tool has been extensively tested, but the author is not responsible for any lost work that results from its use. Please keep backups and report any issues you encounter.

---

## Building

We use [Bun][1] to compile a standalone executable. The version is specified in `.tool-versions`. Compile the program with `bun run build`. The resulting executable will be `bin/mdrenum`, which you can copy to a directory on `$PATH`.

[1]: https://bun.sh/

## Testing

Tests live in `src/mdrenum.test.ts`. Run them with `bun test`.

## Editor Integration

### [Helix][2]

To instruct Helix to automatically renumber links on save, add the following to `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "markdown"
auto-format = true
formatter = { command = "mdrenum" , args = ["--stdin"] }
```

[2]: https://helix-editor.com/

---

All credit to the [unified collective][3] for creating [`mdast`][4], which is doing most of the heavy lifting here.

[3]: https://unifiedjs.com/
[4]: https://github.com/syntax-tree/mdast
