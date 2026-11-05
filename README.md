# NSH website translations

Machine translations of the [Native Shell](https://nsh.dev) documentation, for
every language other than English and Chinese. Those two live in
[longbridge/nsh](https://github.com/longbridge/nsh) and are written by hand; a
change there never has to touch this repository.

- `<code>/docs`, `<code>/elements`, `<code>/modules`: the translated pages.
- `<code>/ui.json`: the strings around them.
- `locales.json`: the languages, each a BCP 47 `code` and the language's own `name`;
  `"dir": "rtl"` marks one written right to left (Arabic), which nsh.dev lays out
  mirrored. To add a language, add a line here and its `ui.json`.

## How it runs

`.github/workflows/translate.yml` runs daily and on demand. It takes the English
pages of NSH's latest release and translates the pages whose source hash changed,
so a day with no release calls no model. Code, HTML, link targets and callout
markers are masked first; an answer that loses one or changes the headings is
retried once, then that page keeps its previous translation.

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
