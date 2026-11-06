---
title: "TextView"
description: "Le composant TextView : Markdown, HTML ou document composé de blocs, affiché avec du texte et des vues natifs, stylé élément par élément, pour les réponses de chat IA, les articles et les pages d'aide."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` affiche un document écrit en Markdown, en HTML ou sous forme de blocs construits par l'app : titres, paragraphes, emphase, liens, listes et listes de tâches, citations et alertes GitHub, code, tableaux, images, formules, notes de bas de page et blocs repliables. Il est conçu pour les réponses des modèles d'IA dans un chat : la réponse arrive en flux sous forme de Markdown, et chaque fragment affiche le texte avec sa mise en forme en place. L'analyse se fait en Rust, et le document est dessiné avec des éléments [`Text`](./text.md) et des vues.

Il gère son propre comportement et fournit sa propre typographie de lecture : texte de 15 pt avec des lignes généreuses de 25,5 pt, titres en semi-gras avec de l'espace au-dessus, liens soulignés dans la couleur `primary` du thème, code dans `font-mono` du thème dans une boîte bordée et arrondie, tableaux quadrillés de tous côtés avec une ligne d'en-tête teintée, citations avec un trait sur le côté et alertes sous forme de boîtes teintées avec une icône aux couleurs des alertes de GitHub. Ses couleurs sont les jetons du thème (`foreground`, `muted-foreground`, `border`, `muted`, `primary`, et `destructive` pour une mise en garde), de sorte qu'un thème et l'apparence sombre l'atteignent. Chaque partie reprend les styles de l'app par-dessus ces valeurs par défaut : `classes` et `styles` en TSX, styles typés par partie (`TextViewParts`) en Rust. Rust en crée un avec `nsh_base::text_view()`, TSX avec `<TextView>` depuis `nsh/base`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view, theme};
use nsh_core::prelude::*;

const README: &str = "# Release notes

**Faster lists** and a new `TextView`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with `TextViewParts`.";

fn release_notes() -> impl IntoElement {
    scroll().flex_1().child(
        text_view()
            .markdown(README)
            .on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| log::info!("open {url}"))
            .p_5()
            .text_base()
            .text_color(theme().foreground),
    )
}
```

```tsx tabs
import { mount, Scroll } from "nsh";
import { TextView } from "nsh/base";

const README = `# Release notes

**Faster lists** and a new \`TextView\`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with \`classes\`.`;

function App() {
  return (
    <Scroll class="flex-1" contentClass="p-5">
      <TextView
        markdown={README}
        class="text-base text-neutral-900 dark:text-neutral-100"
        classes={{
          heading1: "text-3xl",
          code: "rounded bg-neutral-100 dark:bg-neutral-800",
          link: "text-blue-600",
          alertTip: "border-l-4 border-green-600 pl-3",
        }}
        onLinkPress={({ url }) => console.log("open", url)}
      />
    </Scroll>
  );
}

mount(App);
```

En Rust, `text_view()` en crée un comme `view()` crée une vue : un setter par prop (`.markdown(..)`, `.options(..)`, `.selectable(..)`), une closure par fonction de rendu (`.render_image(|image| ..)`), un écouteur par événement (`.on_link_press(..)`) et les méthodes de style typées pour sa racine (`.p_5()`, `.text_color(..)`), dont les styles de texte sont transmis à chaque partie.

<a id="built-on-text"></a>

## Construit sur Text

`TextView` est fait d'éléments [`Text`](./text.md), et son texte se comporte exactement comme le décrit la page Text. Chaque paragraphe, titre, cellule de tableau et bloc de code est un `Text` natif : un bloc qui se met en page, passe à la ligne, suit l'échelle de police et, avec `selectable`, se sélectionne et se copie. Le gras, l'emphase, le barré et les autres marques en ligne sont ses [spans](./text.md#spans) ; le code en ligne est un span avec un [arrière-plan de span](./text.md#span-backgrounds), de sorte que `code: "rounded bg-neutral-100"` lui donne un arrière-plan arrondi ; les liens sont des [spans pressables](./text.md#links) ; les images et les nœuds personnalisés en ligne sont des [attachements en ligne](./text.md#inline-views-and-images). Les styles de texte de la racine sont transmis à chaque partie, comme les [styles de texte](./text.md#text-styles) passent d'un `Text` à ses spans.

Avec `selectable`, tout le document se sélectionne d'un seul tenant, comme une page web : un glissement (ou, sur écran tactile, un appui long puis les poignées) va d'un paragraphe, élément de liste, cellule ou bloc de code au suivant, et Copier récupère le texte de tous. Un `selectable` `TextView` se sélectionne de façon autonome ; à l'intérieur d'une [vue sélectionnable](./text-selection.md), sa sélection se prolonge aussi dans les textes et autres `TextView` alentour.

Ce que `TextView` ajoute, c'est tout le reste : la lecture de Markdown, de HTML ou d'un document en blocs, les vues autour des textes (listes, citations, tableaux, blocs de code, blocs repliables, notes de bas de page), le streaming, les styles par partie, les fonctions de rendu et les extensions.

<a id="the-document"></a>

## Le document

Le contenu est l'une de trois props, lues dans cet ordre :

- **`markdown`** : CommonMark avec les ajouts de GitHub (tableaux, listes de tâches, texte barré, liens automatiques, notes de bas de page, alertes), formules (`$…$` et `$$…$$`) et HTML dans le Markdown.
- **`html`** : du HTML tel qu'un lecteur l'affiche. Le texte, la structure et la mise en forme en ligne passent ; les scripts, styles, contrôles de formulaire et éléments masqués restent exclus. Un fragment ou une page entière fonctionnent (une page affiche son body).
- **`document`** : blocs que l'app construit ou conserve : objets simples en TSX, `nsh_base::text_view::Document` en Rust ([Le modèle de document](#the-document-model)).

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{Block, Document, Inline};
use nsh_core::prelude::*;

fn shipping() -> impl IntoElement {
    text_view().html(r#"<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>"#)
}

fn total() -> impl IntoElement {
    text_view().document(Document::new(vec![
        Block::Heading { level: 2, content: vec![Inline::text("Total")], anchor: None },
        Block::paragraph(vec![Inline::Strong { content: vec![Inline::text("$42.00")] }]),
    ]))
}
```

```tsx tabs
<TextView html={`<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>`} />

<TextView document={{
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Total" }] },
    { type: "paragraph", content: [{ type: "strong", content: [{ type: "text", text: "$42.00" }] }] },
  ],
}} />
```

`TextView` grandit avec son contenu. Placez-le dans un [`Scroll`](./scroll.md) (ou une ligne d'un [`List`](./list.md)) pour les longs documents.

<a id="styling-the-parts"></a>

## Styliser les parties

`class` et `style` stylisent la racine, une colonne de blocs ; les styles de texte définis ici (couleur, taille, police) sont transmis à chaque partie. La racine est aussi la partie `root` : `styles.root` accepte des styles de texte avec leurs types (`style` est typé comme celui d'une vue), et `classes.root` des classes. `classes` accepte des classes Tailwind par partie et `styles` des styles en ligne par partie. Les classes d'une partie viennent après ses propres styles par défaut, elles l'emportent donc ; ses `styles` l'emportent sur ses classes. En Rust, les parties acceptent des styles typés : `TextViewParts` donne à chaque `TextViewPart` une fonction qui affine son style, pour chaque `TextView` situé sous la vue qui le fournit ([Styles de partie typés](#typed-part-styles)), et la racine accepte les méthodes de style. Les hauteurs de ligne des valeurs par défaut sont définies en points : une classe qui change la taille d'une partie définit aussi sa hauteur de ligne (c'est le cas des classes `text-*` de Tailwind).

```rust tabs
use nsh_base::{TextViewPart, TextViewParts, text_view, theme};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading, |s| s.text_color(rgb(0x0a0a0a)))
            .part(TextViewPart::Heading2, |s| s.text_xl().mt_2())
            .part(TextViewPart::Blockquote, |s| {
                s.border_l(px(2.0)).border_color(rgb(0xd4d4d4)).pl_3().text_color(rgb(0x525252))
            })
            .part(TextViewPart::CodeBlock, |s| s.rounded_lg().bg(rgb(0xf5f5f5)))
            .part(TextViewPart::CodeBlockHeader, |s| s.px_3().pt_2())
            .part(TextViewPart::CodeBlockCode, |s| s.p_3().text_size(px(13.0)))
            .part(TextViewPart::Table, |s| s.rounded_lg().border_1().border_color(rgb(0xe5e5e5)))
            .part(TextViewPart::TableHead, |s| s.bg(rgb(0xfafafa)))
            .part(TextViewPart::TableCell, |s| {
                s.px_3().py_2().border_t_1().border_color(rgb(0xe5e5e5))
            })
            .part(TextViewPart::TaskMarkerChecked, |s| s.text_color(rgb(0x16a34a)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
    text_view()
        .markdown(move || markdown.get())
        .gap_3()
        .text_size(px(15.0))
        .line_height(px(24.0))
        .text_color(rgb(0x262626))
        .font_family("Inter")
}
```

```tsx tabs
<TextView
  markdown={reply()}
  class="gap-3 text-[15px] leading-6 text-neutral-800"
  classes={{
    heading: "text-neutral-950",
    heading2: "text-xl mt-2",
    blockquote: "border-l-2 border-neutral-300 pl-3 text-neutral-600",
    codeBlock: "rounded-lg bg-neutral-100",
    codeBlockHeader: "px-3 pt-2",
    codeBlockCode: "p-3 text-[13px]",
    table: "rounded-lg border border-neutral-200",
    tableHead: "bg-neutral-50",
    tableCell: "px-3 py-2 border-t border-neutral-200",
    taskMarkerChecked: "text-green-600",
  }}
  styles={{ root: { fontFamily: "Inter" }, link: { color: "#2563eb" } }}
/>
```

Certains nœuds sont composés de plusieurs parties, appliquées dans l'ordre : un titre de niveau 2 est `heading` puis `heading2` ; une alerte est `blockquote`, `alert`, puis son type (`alertNote`, ...) ; un marqueur de tâche est `listMarker`, `taskMarker`, puis `taskMarkerChecked` une fois terminée ; la ligne d'en-tête est `tableRow` puis `tableHead`, et ses cellules `tableCell` puis `tableHeaderCell`.

| Partie | Rust | Ce que c'est |
|---|---|---|
| `root` | `Root` | La vue de texte elle-même, une colonne de ses blocs ; les styles de texte définis ici sont transmis à chaque partie. |
| `paragraph` | `Paragraph` | Chaque paragraphe. |
| `heading` | `Heading` | Chaque titre, avant la partie de son niveau. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | Titres de ce niveau (27, 20, 17, puis 15 pt, semi-gras). |
| `blockquote` | `Blockquote` | Citations et alertes : une colonne de leurs blocs avec un trait sur le côté. |
| `alert` | `Alert` | Chaque alerte (`> [!NOTE]`), après `blockquote` : une boîte teintée, une ligne composée de son icône et de ses blocs. |
| `alertNote`, `alertTip`, `alertImportant`, `alertWarning`, `alertCaution` | `AlertNote`, `AlertTip`, `AlertImportant`, `AlertWarning`, `AlertCaution` | Alertes de ce type. |
| `alertIcon` | `AlertIcon` | L'icône d'une alerte : un anneau avec un glyphe de la couleur de l'alerte. |
| `list` | `List` | Chaque liste : une colonne de ses éléments. |
| `orderedList`, `unorderedList` | `OrderedList`, `UnorderedList` | Listes numérotées et à puces, après `list`. |
| `listItem` | `ListItem` | Chaque élément : une ligne composée de son marqueur et de ses blocs. |
| `listMarker` | `ListMarker` | Le marqueur d'un élément (`•`, `◦`, `▪` selon la profondeur, ou `1.`), aligné à droite dans le retrait avant l'élément. |
| `taskMarker` | `TaskMarker` | Le marqueur d'une tâche : une case dessinée comme une vue, remplie d'un `✓` une fois terminée ; après `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | Le marqueur d'une tâche terminée, après `taskMarker`. |
| `listItemContent` | `ListItemContent` | La colonne des blocs d'un élément. |
| `codeBlock` | `CodeBlock` | Blocs de code : une boîte bordée et arrondie contenant le code, avec l'en-tête au-dessus. |
| `codeBlockHeader` | `CodeBlockHeader` | La ligne des actions d'un bloc de code (`codeBlockActions`), flottant sur son coin supérieur droit. |
| `codeBlockScroll` | `CodeBlockScroll` | La vue défilante horizontale autour du code d'un bloc de code. |
| `codeBlockCode` | `CodeBlockCode` | Le code d'un bloc de code (monospace, tel qu'écrit). |
| `code` | `Code` | Code dans du texte (monospace, sur un arrière-plan arrondi). |
| `keyboard` | `Keyboard` | Touches (`<kbd>`, comme du code). |
| `strong` | `Strong` | Texte en gras (semi-gras). |
| `emphasis` | `Emphasis` | Texte en emphase (italique). |
| `strikethrough` | `Strikethrough` | Texte barré. |
| `underline` | `Underline` | Texte souligné (`<u>`, `<ins>`). |
| `highlight` | `Highlight` | Texte surligné (`<mark>`, sur un jaune arrondi). |
| `superscript`, `subscript` | `Superscript`, `Subscript` | Exposant et indice (plus petits). |
| `link` | `Link` | Liens (dans la couleur `primary` du thème, soulignés). |
| `image` | `Image` | Images. |
| `math` | `Math` | Formules dans du texte, composées lorsqu'il n'y a pas de `renderMath`. |
| `mathBlock` | `MathBlock` | Blocs de formule, composés et centrés lorsqu'il n'y a pas de `renderMath`. |
| `table` | `Table` | Tableaux : le contenu de `renderTableActions`, puis la vue défilante des cellules. |
| `tableScroll` | `TableScroll` | La vue défilante horizontale des cellules d'un tableau : les colonnes s'ajustent à leur contenu lorsqu'il y a de la place, passent à la ligne jusqu'à un plancher lorsque la vue est plus étroite, et au-delà le tableau défile. |
| `tableRow` | `TableRow` | Chaque ligne d'un tableau : une vue derrière ses cellules, pour les arrière-plans et les bordures (les styles de texte vont sur `tableCell`). |
| `tableHead` | `TableHead` | La ligne d'en-tête, après `tableRow`. |
| `tableCell` | `TableCell` | Chaque cellule. |
| `tableHeaderCell` | `TableHeaderCell` | Les cellules de la ligne d'en-tête (plus petites, atténuées), après `tableCell`. |
| `rule` | `Rule` | Séparateurs thématiques : un trait dessiné comme une bordure supérieure. |
| `details` | `Details` | Blocs repliables (`<details>`). |
| `summary` | `Summary` | Le résumé d'un bloc repliable ; un appui l'ouvre et le ferme. |
| `summaryMarker` | `SummaryMarker` | Le marqueur d'un résumé (`▸`, `▾`). |
| `footnotes` | `Footnotes` | Les notes de bas de page après les blocs : une colonne. |
| `footnote` | `Footnote` | Une note de bas de page : une ligne composée de son numéro et de ses blocs. |
| `footnoteLabel` | `FootnoteLabel` | Le numéro d'une note de bas de page. |
| `footnoteReference` | `FootnoteReference` | Une référence à une note de bas de page dans du texte (son numéro, plus petit). |
| `custom` | `Custom` | Nœuds personnalisés affichés comme leur contenu (lorsqu'aucune fonction de rendu ne les affiche). |

<a id="streaming-ai-replies"></a>

## Streaming des réponses d'IA

Passez la réponse au fur et à mesure qu'elle grandit, avec `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` en Rust). La fin d'un texte encore en cours d'arrivée laisse souvent une syntaxe ouverte (`**bold`, `` `code ``, `[a link](htt`, a table whose header just arrived) ; le streaming l'affiche telle qu'elle sera une fois fermée, de sorte que le lecteur ne voit jamais de `**` ou `[` égarés. Les blocs sont conservés par position : les blocs complets gardent leurs vues, et seul le bloc en cours d'écriture est refait, si bien qu'une longue réponse reste peu coûteuse à mettre à jour.

`streamingCaret` suit la fin du document : en ligne à la fin du dernier texte, partout où se termine le dernier bloc (un paragraphe, un élément de liste, un bloc de code, la dernière cellule d'un tableau), sinon sur une ligne à part après le dernier bloc (un filet, le contenu d'une fonction de rendu). Retirez-le quand la réponse est terminée.

```rust tabs
use nsh_base::{MarkdownOptions, text_view};
use nsh_core::prelude::*;

/// A reply the app appends to as chunks arrive, with `done` set at the end.
fn reply(text: Signal<SharedString>, done: Signal<bool>) -> impl IntoElement {
    text_view()
        .markdown(move || text.get())
        .options(move || MarkdownOptions { streaming: !done.get(), ..Default::default() })
        .streaming_caret(when(
            move || !done.get(),
            || view().ml_0p5().h_4().w_2().rounded_sm().bg(rgb(0xa3a3a3)),
        ))
}
```

```tsx tabs
import { signal, View } from "nsh";
import { TextView } from "nsh/base";

function Reply(props: { stream: AsyncIterable<string> }) {
  const text = signal("");
  const done = signal(false);
  (async () => {
    for await (const chunk of props.stream) text.update((t) => t + chunk);
    done.set(true);
  })();
  return (
    <TextView
      markdown={text()}
      options={{ streaming: !done() }}
      streamingCaret={done() ? undefined : <View class="ml-0.5 h-4 w-2 rounded-sm bg-neutral-400" />}
    />
  );
}
```

Le caret est une vue propre à l'app, il peut donc clignoter ou pulser avec l'[API d'animation de `nsh`](../modules/nsh.md#animation), et les nouveaux blocs peuvent apparaître en fondu avec les animations de l'app.

<a id="links"></a>

## Liens

Les liens sont des [spans pressables](./text.md#links). Un appui sur l'un d'eux appelle `onLinkPress` avec `{ url }` ; l'app décide de ce qu'elle ouvre (une page à elle, un [`WebView`](./web-view.md), un défilement vers un titre). Les titres ont des ancres (celles de GitHub : `## Getting started` donne `#getting-started`), un lien vers `#getting-started` arrive donc sous cette chaîne, et une référence de note de bas de page arrive sous la forme `#footnote-<label>`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view};
use nsh_core::prelude::*;

fn doc(markdown: &'static str) -> impl IntoElement {
    text_view().markdown(markdown).on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| {
        match url.strip_prefix('#') {
            Some(anchor) => scroll_to_anchor(anchor),
            None => open_web(url),
        }
    })
}
```

```tsx tabs
<TextView
  markdown={doc}
  onLinkPress={({ url }) => {
    if (url.startsWith("#")) scrollToAnchor(url.slice(1));
    else nav.push({ name: "web", url });
  }}
/>
```

`scroll_to_anchor` et `open_web` (`scrollToAnchor` et `nav` en TSX) représentent les propres fonctions de l'app.

Avec `links="open"`, un appui sur un lien vers un autre site ou une autre app (une URL avec un schéma : `https:`, `mailto:`, ...) l'ouvre aussi en dehors de l'app avec [`openUrl`](../modules/nsh.md#openurl), sous la capacité `openUrl` de l'app, après que `onLinkPress` l'a signalé ; les ancres du document (`#…`) sont seulement signalées. La valeur par défaut, `"report"`, n'ouvre rien.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## Fonctions de rendu

Les fonctions de rendu placent le contenu propre à l'app dans le document. Chacune prend la valeur d'une partie et renvoie son contenu (JSX en TSX, un élément en Rust) ; une partie conserve ce qui a été rendu pour elle tant que sa valeur reste la même, de sorte que pendant le streaming seule la partie en cours d'écriture est rendue à nouveau.

| Prop | Rust | Valeur | Remplace ou ajoute |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | Remplace un bloc de code (votre propre coloration syntaxique). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | L'icône d'une action de bloc de code propre à l'app (`codeBlockActions`) ; le bouton qui l'entoure est celui de `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | Ajoute du contenu au-dessus d'un tableau (copie, export). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | Remplace une formule : `{ tex, display }`, `display` pour un bloc `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | Remplace une image (`{ src, alt, title }`) : votre propre chargement, dimensionnement, une visionneuse à l'appui. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | Affiche un nœud personnalisé, selon son `name` ([Extensions Markdown](#markdown-extensions)). |

Les blocs de code portent des actions sur leur coin supérieur droit, toutes dessinées de la même façon : des boutons fantômes dont l'arrière-plan apparaît au survol ou à l'appui, visibles lorsqu'un pointeur est sur le bloc sur ordinateur et toujours visibles sur écran tactile. `copy` est intégré : il copie le code et affiche une coche un instant. Les autres actions sont celles de l'app : `renderCodeBlockAction` dessine leur icône et `onCodeBlockAction` signale leurs appuis (y compris `copy` intégré, après avoir copié). `copy` écrit dans le presse-papiers comme le fait `Clipboard`, il nécessite donc la capacité `clipboard` de l'app (`nsh.json`).

```rust tabs
use nsh_base::{TextViewCodeAction, TextViewCodeActionEvent, text_view};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .code_block_actions(vec![
            TextViewCodeAction::new("copy").with_label("Copy code"),
            TextViewCodeAction::new("run").with_label("Run"),
        ])
        .render_code_block_action(|_action: &TextViewCodeAction| text("▶").text_xs())
        .on_code_block_action(|event: &TextViewCodeActionEvent| {
            if event.id == "run" {
                run(&event.code.code);
            }
        })
}
```

```tsx tabs
import { Text } from "nsh";
import { TextView } from "nsh/base";

<TextView
  markdown={reply()}
  codeBlockActions={[
    { id: "copy", label: "Copy code" },
    { id: "run", label: "Run" },
  ]}
  renderCodeBlockAction={(action) => <Text class="text-xs">▶</Text>}
  onCodeBlockAction={({ id, code }) => id === "run" && run(code.code)}
/>
```

Les blocs de code sont colorés d'emblée : pour un langage nommé sur la clôture (`ts`, `tsx`, `rust`, `python`, `bash`, `json`, `toml`, `yaml`, `diff` et environ deux cents autres), le code s'affiche dans la palette de code d'Allsum, claire ou sombre selon l'apparence ; un bloc sans langage s'affiche en texte brut. Une app qui a sa propre coloration affiche son code avec `renderCodeBlock`, depuis son propre composant ou l'un de son crate Rust ; une vue Rust donne à `TextView` son colorateur avec [`CodeHighlighter`](#syntax-highlighting). Voici du code avec la coloration propre à l'app, et une image qui occupe toute la largeur :

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{CodeBlock, Image};
use nsh_base::TextViewMath;
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .render_code_block(|code: &CodeBlock| highlighted(code.language.clone(), code.code.clone()))
        .render_image(|img: &Image| {
            image(img.src.clone())
                .label(img.alt.clone())
                .aspect_ratio(16.0 / 9.0)
                .w_full()
                .rounded_lg()
        })
        .render_math(|math: &TextViewMath| math_view(math.tex.to_string(), math.display))
}
```

```tsx tabs
import { Image, View } from "nsh";

<TextView
  markdown={reply()}
  renderCodeBlock={(code) => <Highlighted language={code.language} code={code.code} />}
  renderImage={(image) => (
    <Image src={image.src} accessibilityLabel={image.alt} class="aspect-video w-full rounded-lg" />
  )}
  renderMath={(math) => <MathView tex={math.tex} display={math.display} />}
/>
```

`Highlighted` et `MathView` (`highlighted` et `math_view` en Rust) représentent les propres composants de l'app (un colorateur, un moteur de rendu de formules, ou un composant de son crate Rust). Sans `renderMath`, `TextView` compose lui-même une formule (parties `math` et `mathBlock`) avec la prise en charge TeX et les polices de KaTeX, dans la couleur du texte, à l'identique sur toutes les plateformes ; le TeX qu'il ne sait pas lire s'affiche sous forme de source en monospace.
<a id="markdown-extensions"></a>

## Extensions Markdown

`extensions` transforme la syntaxe propre à l'app en nœuds personnalisés, que `renderCustom` affiche. Chaque extension a un `name` (le `name` des nœuds qu'elle produit) et l'un des quatre types de syntaxe :

| Type | Rust | Correspond à | Le nœud |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | Une expression régulière dans le texte (syntaxe `regex` de Rust), hors du code et des liens | En ligne ; `text` est la correspondance, `attributes` ses groupes : `"1"`, `"2"`, … et les groupes nommés par leur nom |
| `language` | `MarkdownExtension::language(name, language)` | Blocs de code délimités de ce langage (```` ```chart ````) | A block; `text` is the code, `attributes.meta` le reste de la chaîne d'information |
| `tag` | `MarkdownExtension::tag(name, tag)` | Éléments HTML ou MDX de cette balise, quelle que soit la casse (`<Callout kind="tip">`) | Ses attributs, son contenu analysé : `children` (blocs) pour un élément sur ses propres lignes, `content` (en ligne) au sein du texte |
| `container` | `MarkdownExtension::container(name, container)` | Conteneurs `:::name` … `:::` | Un bloc du Markdown à l'intérieur (`children`) ; `:::note[Heads up]` donne `attributes.label`, `{key=value}` les autres attributs |

````rust tabs
use nsh_base::text_view::{CustomNode, Document};
use nsh_base::{MarkdownExtension, text_view};
use nsh_core::prelude::*;

const MESSAGE: &str = r#"Thanks @ada! Here are the numbers:

```chart
12, 19, 7, 25
```

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::"#;

fn custom(node: &CustomNode) -> AnyElement {
    match node.name.as_str() {
        "mention" => text(node.text.clone())
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x2563eb))
            .into_element(),
        "chart" => bar_chart(node.text.split(',').filter_map(|v| v.trim().parse().ok()).collect())
            .into_element(),
        "callout" => view()
            .rounded_lg()
            .bg(rgb(0xfffbeb))
            .p_3()
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
        _ => view()
            .gap_1()
            .border_l(px(4.0))
            .border_color(rgb(0x3b82f6))
            .pl_3()
            .child(
                text(node.attributes.get("label").cloned().unwrap_or_else(|| "Note".into()))
                    .font_weight(FontWeight::SEMIBOLD),
            )
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
    }
}

fn message() -> impl IntoElement {
    text_view()
        .markdown(MESSAGE)
        .extensions(vec![
            MarkdownExtension::pattern("mention", r"@(\w+)"),
            MarkdownExtension::language("chart", "chart"),
            MarkdownExtension::tag("callout", "callout"),
            MarkdownExtension::container("note", "note"),
        ])
        .render_custom(custom)
}
````

````tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";
import type { MarkdownExtension, TextViewCustomNode } from "nsh/base";

const extensions: MarkdownExtension[] = [
  { name: "mention", pattern: "@(\\w+)" },
  { name: "chart", language: "chart" },
  { name: "callout", tag: "callout" },
  { name: "note", container: "note" },
];

const message = `Thanks @ada! Here are the numbers:

\`\`\`chart
12, 19, 7, 25
\`\`\`

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::`;

function Custom(props: { node: TextViewCustomNode }) {
  const node = props.node;
  switch (node.name) {
    case "mention":
      return <Text class="font-semibold text-blue-600">{node.text}</Text>;
    case "chart":
      return <BarChart values={node.text!.split(",").map(Number)} />;
    case "callout":
      return (
        <View class="rounded-lg bg-amber-50 p-3">
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
    default:
      return (
        <View class="gap-1 border-l-4 border-blue-500 pl-3">
          <Text class="font-semibold">{node.attributes?.label ?? "Note"}</Text>
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
  }
}

<TextView markdown={message} extensions={extensions} renderCustom={(node) => <Custom node={node} />} />;
````

`BarChart` (`bar_chart` en Rust) représente le graphique propre à l'app. Le groupe du motif de mention se trouve dans `node.attributes?.["1"]` (`node.attributes["1"]` en Rust : `ada`) et la correspondance entière dans `node.text` (`@ada`). Un nœud personnalisé sans fonction de rendu affiche son contenu.
Une vue renvoyée pour un nœud en ligne (une pastille) se place dans sa ligne selon son propre `verticalAlign` : `align-middle` (`verticalAlign: "middle"`) la centre sur le texte, et sa ligne conserve le `lineHeight` du paragraphe, sauf si la vue est plus haute.

### Options

`options` choisit la syntaxe Markdown lue en plus de celle de CommonMark et de GitHub ; en Rust, c'est un `MarkdownOptions` avec les mêmes champs (`MarkdownOptions { streaming: true, ..Default::default() }`) :

| Clé | Type | Par défaut | Description |
|---|---|---|---|
| `math` | `boolean` | `true` | Formules : `$…$` dans le texte, blocs `$$…$$`. |
| `html` | `boolean` | `true` | Le HTML dans le Markdown est lu comme le lit la prop `html` ; `false` l'affiche comme du texte. |
| `alerts` | `boolean` | `true` | Les alertes de GitHub : `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | Le front matter YAML (`---` … `---` en premier) devient un nœud personnalisé `frontmatter` dont `text` est le YAML. |
| `mdx` | `boolean` | `false` | MDX : les éléments JSX sont des nœuds personnalisés nommés d'après leur balise, `{expressions}` des nœuds personnalisés `expression` ; le HTML brut est alors lu comme du texte. |
| `streaming` | `boolean` | `false` | Le texte est encore en cours d'arrivée : la syntaxe que sa fin laisse ouverte s'affiche comme si elle était fermée. |

<a id="the-document-model"></a>

## Le modèle de document

La prop `document` et les valeurs des fonctions de rendu sont des objets simples, chaque nœud étant étiqueté par son `type`. Les types proviennent de `nsh/base` : `TextViewDocument`, `TextViewBlock`, `TextViewInline`, `TextViewCodeBlock`, `TextViewTable`,
`TextViewListItem`, `TextViewImage`, `TextViewFootnote`, `TextViewAlert` et `TextViewCustomNode`. En Rust, ce sont
les types de `nsh_base::text_view` (`Document`, `Block`, `Inline`, `CodeBlock`, `Table`, `ListItem`, `Image`,
`Footnote`, `Alert`, `CustomNode`) : `Block` et `Inline` sont des enums dont les variantes sont les types ci-dessous en PascalCase
(`Block::Heading { level, content, anchor }`, `Inline::Strong { content }`), avec les mêmes champs en snake case.

| Bloc `type` | Champs |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6), `content`, `anchor?` |
| `blockquote` | `children`, `alert?` (`"note"`, `"tip"`, `"important"`, `"warning"`, `"caution"`) |
| `list` | `ordered?`, `start?`, `loose?`, `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`, `meta?`, `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`, `"left"`, `"center"`, `"right"` par colonne), `head` (cellules), `rows?` (lignes de cellules) ; une cellule est `{ content }` |
| `rule` | |
| `details` | `open?`, `summary` (en ligne), `children` |
| `custom` | `name`, `attributes?`, `text?`, `data?`, `children?`, `content?` |

| Élément en ligne `type` | Champs |
|---|---|
| `text` | `text` |
| `strong`, `emphasis`, `strikethrough`, `underline`, `highlight`, `superscript`, `subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`, `title?`, `content` |
| `image` | `src`, `alt?`, `title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`, `index` |
| `custom` | comme le bloc |

Un document possède aussi `footnotes?` : `{ label, index, children }`, affichées après les blocs dans l'ordre de leur première
référence. Une app peut stocker des réponses sous forme de documents, les construire à partir de ses propres données, ou y mêler des nœuds personnalisés que
`renderCustom` affiche.

<a id="parsing-and-plain-text"></a>

### Analyse et texte brut

`TextView` lit aussi des documents sans les afficher, de façon synchrone :

| Fonction | Rust | Renvoie |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | Le `TextViewDocument` que la prop `markdown` afficherait. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | Le `TextViewDocument` que la prop `html` afficherait. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`, `Document::plain_text()` | Le texte du document sans balisage : blocs séparés par des lignes vides, éléments de liste et lignes de tableau par des sauts de ligne, cellules par des tabulations. |

Un bouton de copie pour toute une réponse :

```rust tabs
use nsh_base::{TextView, button};
use nsh_core::prelude::*;

fn copy_reply(reply: Signal<SharedString>) -> impl IntoElement {
    button()
        .on_press(move || {
            let document = TextView::parse(reply.get().to_string(), None, None);
            set_clipboard(TextView::plain_text(document));
        })
        .child(text("Copy"))
}
```

```tsx tabs
<Button onPress={() => Clipboard.writeText(TextView.plainText(TextView.parse(reply())))}>
  <Text>Copy</Text>
</Button>
```

Une app peut aussi analyser une seule fois et conserver le document (`document={doc}`), ou le modifier avant de l'afficher.

<a id="in-rust"></a>

## En Rust

Les vues Rust utilisent le même composant de la crate `nsh-base`, avec les exemples ci-dessus dans leurs onglets Rust. Trois choses sont propres à Rust : le surligneur de l'app, les styles typés par partie et les plugins Markdown, chacun fourni à tous les `TextView` situés sous une vue avec `provide_context`. Les types de document se trouvent sous `nsh_base::text_view`, où `Parser` lit aussi
des documents avec des plugins (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### Coloration syntaxique

`TextView` colore le code avec syntect dans la palette de code d'Allsum (fonctionnalité `highlight` de `nsh-base`, activée par défaut) ;
un gros bloc s'affiche d'abord en texte brut et prend ses couleurs une fois qu'un thread d'arrière-plan l'a coloré.
`CodeHighlighter` est le surligneur de l'app qui le remplace, fourni à tous les `TextView` situés sous une vue avec `provide_context`.
Il reçoit chaque bloc de code et renvoie les styles de plages d'octets de son code (dans l'ordre, sans chevauchement ; ce qu'elles omettent
reste en texte brut) ; `TextView` affiche le code sous forme de spans avec ces styles, dans son bloc de code habituel (en-tête, actions,
vue défilante, parties). Le surligneur peut être n'importe quoi qui transforme du code en plages stylées : `tree-sitter`, syntect avec
un thème propre à l'app, ...

```rust
use std::ops::Range;

use nsh_base::{CodeHighlighter, text_view::CodeBlock};
use nsh_core::{element::StyleRefinement, prelude::*};

/// The app's highlighter (here with syntect, set up once by the app).
fn highlight(code: &CodeBlock) -> Vec<(Range<usize>, StyleRefinement)> {
    my_syntect::ranges(code.language.as_deref(), &code.code)
        .map(|(range, color, bold)| {
            let style = StyleRefinement::default().text_color(color);
            (range, if bold { style.font_weight(FontWeight::BOLD) } else { style })
        })
        .collect()
}

fn chat() -> impl IntoElement {
    provide_context(CodeHighlighter::new(highlight));
    view().child(messages())
}
```

`my_syntect::ranges` représente la glue de l'app vers son surligneur et `messages` la vue de la conversation propre à l'app.
`renderCodeBlock`, lorsqu'il est fourni, affiche le bloc de code à la place de tout cela.

<a id="typed-part-styles"></a>

### Styles typés par partie

`TextViewParts` style les parties avec des styles typés plutôt que des chaînes de classes, pour les vues Rust : chaque `TextViewPart` (un par
partie du [tableau ci-dessus](#styling-the-parts)) reçoit une fonction qui affine son `StyleRefinement`. Fournis avec
`provide_context`, ils s'appliquent à tous les `TextView` situés en dessous, avant son `classes` et son `styles` ; les couleurs de thème lues dans ces styles
suivent l'apparence claire et sombre.

```rust
use nsh_base::{TextViewPart, TextViewParts, theme};
use nsh_core::prelude::*;

fn chat_parts() {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading1, |s| s.text_2xl().font_weight(FontWeight::BOLD))
            .part(TextViewPart::Code, |s| s.bg(theme().muted).rounded(px(4.0)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
}
```

<a id="markdown-plugins"></a>

### Plugins Markdown

Un `MarkdownPlugin` lit une syntaxe Markdown en Rust : il reçoit chaque nœud de l'arbre syntaxique (le `mdast` de markdown-rs) avant
que l'analyseur ne le lise, et renvoie un contenu de bloc ou en ligne qui lui est propre, généralement un `CustomNode` ; il peut aussi afficher les
nœuds personnalisés qu'il crée. Une vue fournit des plugins à tous les `TextView` situés en dessous :

```rust
use nsh_base::text_view::{mdast, CustomNode, Inline, MarkdownPlugin, MarkdownPlugins, ParseContext};
use nsh_core::prelude::*;

struct Tickers;

impl MarkdownPlugin for Tickers {
    fn name(&self) -> &str {
        "tickers"
    }

    /// `$AAPL` in inline code becomes a ticker node.
    fn inline(&self, node: &mdast::Node, _cx: &mut ParseContext<'_>) -> Option<Inline> {
        let mdast::Node::InlineCode(code) = node else { return None };
        let symbol = code.value.strip_prefix('$')?;
        Some(Inline::Custom(CustomNode::new("ticker").with_text(symbol)))
    }

    fn render(&self, node: &CustomNode) -> Option<AnyElement> {
        (node.name == "ticker").then(|| text(node.text.clone()).font_weight(FontWeight::BOLD).into_element())
    }
}

fn chat() -> impl IntoElement {
    provide_context(MarkdownPlugins::new().with(Tickers));
    view().child(messages())
}
```

Le `render` d'un plugin vient en premier, puis `renderCustom`, puis le contenu du nœud. `configure` active davantage de
syntaxe de markdown-rs, et `ParseContext` lit les enfants d'un nœud comme le fait l'analyseur.

## Props

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | Le document en Markdown. |
| `html` | `.html(..)` | `string` | | Le document en HTML, quand `markdown` n'est pas fourni. |
| `document` | `.document(..)` | `TextViewDocument` | | Le document sous forme de blocs, quand ni `markdown` ni `html` n'est fourni. |
| `options` | `.options(..)` | `MarkdownOptions` | toutes les valeurs par défaut | La syntaxe Markdown lue ([Options](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | La syntaxe propre à l'app, en nœuds personnalisés ([Extensions Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | Classes Tailwind par partie. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | Styles en ligne par partie (chacun un `StyleProp<TextStyle>`), appliqués par-dessus les classes. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | Le document est sélectionnable d'un seul tenant : une sélection traverse ses paragraphes, titres, cellules et blocs de code ([Sélection de texte](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | Ce que fait un appui sur un lien : le signale (`onLinkPress`) et, avec `"open"`, ouvre aussi hors de l'app un lien vers un autre site ou une autre app ([Liens](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | Les blocs de code affichent leur indicateur de défilement horizontal. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | Les tableaux affichent leur indicateur de défilement horizontal. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | Affiché à la fin du document : en ligne après le dernier texte, sinon sur sa propre ligne. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | Affiche les nœuds personnalisés. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | Affiche les blocs de code. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | Les actions dans le coin supérieur droit de chaque bloc de code : `{ id: "copy" }` intégrées, les autres propres à l'app. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | L'icône d'une action propre à l'app. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | Contenu au-dessus de chaque tableau. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | Affiche les formules. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | Affiche les images. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | | La racine, une colonne de blocs ; ses styles de texte se transmettent à chaque partie (styles de texte typés : `styles.root`). |

En Rust, les classes et les styles par partie sont `TextViewClasses` et `TextViewStyles` ; une vue Rust style généralement les
parties avec [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | Un lien a été pressé : `{ url }` : son URL, `#anchor` pour un titre, `#footnote-<label>` pour une note de bas de page. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | Une action d'un bloc de code a été pressée (après que `copy` a copié). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | Une image qui n'est pas dans un lien a été pressée : `{ image }`, pour que l'app l'affiche en plus grand (une visionneuse zoomable qui lui est propre). |

<a id="accessibility"></a>

## Accessibilité

Les lecteurs d'écran lisent le document dans l'ordre, texte par texte. `TextView` donne leurs rôles aux structures : les titres sont
des en-têtes, les liens sont des liens (leur titre sert d'indice), les marqueurs de tâche sont des cases à cocher avec leur état coché, le
résumé d'un bloc repliable est un bouton qui indique s'il est déplié, et les images sont lues à partir de leur texte alternatif.

<a id="related"></a>

## Voir aussi

- [Text](./text.md) : l'élément qu'est chaque texte de `TextView`, avec ses spans, liens, pièces jointes en ligne et sa sélection.
- [Sélection de texte](./text-selection.md) : une seule sélection à travers plusieurs `TextView` et textes.
- [`nsh/base`](../modules/nsh-base.md) : les autres composants de base.
- [Styling](../docs/styling.md) et [Tailwind](../docs/tailwind.md).
