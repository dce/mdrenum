import {fixDocument} from './mdrenum'

let TEST_CASES = [
	[
		`[A link][2].

		[2]: https://google.com`,
		`[A link][1].

		[1]: https://google.com`,
	],
	[
		`A [link][2]. Another [link][1].

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`A [link][1]. Another [link][2].

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		`[A link][2][Another link][1]

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`[A link][1][Another link][2]

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		`[A link][2][Another link][3][A third link][1]

		[2]: https://google.com
		[3]: https://askjeeves.com
		[1]: https://yahoo.com`,
		`[A link][1][Another link][2][A third link][3]

		[1]: https://google.com
		[2]: https://askjeeves.com
		[3]: https://yahoo.com`,
	],
	[
		`[A link][2][Another [link]][3][A third link][1]

		[2]: https://google.com
		[3]: https://askjeeves.com
		[1]: https://yahoo.com`,
		`[A link][1][Another [link]][2][A third link][3]

		[1]: https://google.com
		[2]: https://askjeeves.com
		[3]: https://yahoo.com`,
	],
	[
		`[A link][2] _[Another link][1]._

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`[A link][1] _[Another link][2]._

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		`[A link][2]_[Another link][1]._

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`[A link][1]_[Another link][2]._

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		`A [_link_][2]. Another [link][1].

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`A [_link_][1]. Another [link][2].

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		"A [link][2]. Another [link][1].\n" +
			"\n" +
			"```ruby\n" +
			"foo = arr[1]\n" +
			"```\n" +
			"\n" +
			"[2]: https://google.com\n" +
			"[1]: https://yahoo.com\n",
		"A [link][1]. Another [link][2].\n" +
			"\n" +
			"```ruby\n" +
			"foo = arr[1]\n" +
			"```\n" +
			"\n" +
			"[1]: https://google.com\n" +
			"[2]: https://yahoo.com\n",
	],
	[
		`A [link][2]. Another [link][1].

			foo = arr[1]

		[2]: https://google.com
		[1]: https://yahoo.com`,
		`A [link][1]. Another [link][2].

			foo = arr[1]

		[1]: https://google.com
		[2]: https://yahoo.com`,
	],
	[
		`A [link][2]. Another [link][3].

		[2]: https://google.com
		[3]: https://yahoo.com

		* [A link list][1]

		[1]: https://altavista.com`,
		`A [link][1]. Another [link][2].

		[1]: https://google.com
		[2]: https://yahoo.com

		* [A link list][3]

		[3]: https://altavista.com`,
	],
]

function trim(content: string): string {
  return content.replace(/\n\t\t/g, '\n')
}

for (let i = 0; i < TEST_CASES.length; i++) {
  test(`Case #${i+1}`, () => {
    let expected = trim(TEST_CASES[i][1])
    let actual = fixDocument(trim(TEST_CASES[i][0]))

    expect(actual).toBe(expected)
  })
}
