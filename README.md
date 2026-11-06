# NSH website translations

Machine translations of the [Native Shell](https://nsh.dev) documentation and home page, for
every language other than English and Chinese. Those two live in
[longbridge/nsh](https://github.com/longbridge/nsh) and are written by hand; a
change there never has to touch this repository.

- `<code>/docs`, `<code>/elements`, `<code>/modules`: the translated pages.
- `<code>/home.json`: the home page (nsh.dev/`<code>`), `{ "source_hash", "strings" }`, its
  `strings` in the keys of NSH's `website/src/home/en.json`.
- `<code>/ui.json`: the strings around them.
- `locales.json`: the languages, each a BCP 47 `code` and the language's own `name`,
  in the order nsh.dev's language menu lists them after English and Simplified Chinese
  (most read first: Traditional Chinese, `zh-HK`, leads);
  `"dir": "rtl"` marks one written right to left (Arabic), which nsh.dev lays out
  mirrored. To add a language, add a line here and its `ui.json`.

## How it runs

`.github/workflows/translate.yml` runs daily and on demand. It takes the English
pages of NSH's latest release, and the home page's words from NSH's `main` (the
home page is built from `main`), and translates what changed since its source
hash, so a day with no change calls no model. The home page's words are one JSON
object, answered in the same keys and lists; numbers, commands and code stay in
NSH's `Home.astro`. Code, HTML, link targets and callout
markers are masked first, and a page's leading `# Title` is written back from
its translated frontmatter title. An answer that loses or repeats a masked part
or changes the headings is sent back to the model with what it got wrong, then
asked for once more from scratch; after that the page keeps its previous
translation.

The nsh.dev build reads this repository, for the latest release only. A page with
no translation shows the English, not indexed.

It needs the `TRANSLATE_API_KEY` secret and the `TRANSLATE_API_URL` and
`TRANSLATE_MODEL` variables (any OpenAI-compatible endpoint); without the model
variable it does nothing. With the optional `NSH_WEBSITE_TOKEN` secret (allowed to
run workflows on longbridge/nsh) a change publishes right away; without it, the
change waits for the next nsh.dev build.

## Korean

The first 14 Korean pages (`ko/docs`, `ko/elements/index.md`, `ko/modules/index.md`)
are the hand translation by [@andongmin94](https://github.com/andongmin94) from
[longbridge/nsh#948](https://github.com/longbridge/nsh/pull/948), adjusted to NSH
v0.4.0's pages. Like any page here, each is retranslated once its English changes.

## Corrections

Pages here are generated and overwritten, so please do not send translation pull
requests: a wrong or awkward term is welcome as an issue, and a fix to the meaning
belongs in the English page.
