---
title: "RichEditor"
description: "L'éditeur de texte enrichi de nsh/base : documents définis par le schéma de l'application, commandes, plugins, historique, raccourcis clavier, règles de saisie et Markdown, selon l'architecture de ProseMirror, avec son état en Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---

# RichEditor

`RichEditor` est un éditeur de texte riche construit sur l'architecture de ProseMirror. L'app définit de quoi un document est composé avec un schéma (paragraphes, titres, listes, mentions, tous les types de nœuds et de marques dont elle a besoin), et l'éditeur maintient chaque document valide vis-à-vis de ce schéma. Les modifications sont des étapes (steps) regroupées en transactions, de sorte qu'elles s'annulent, mappent les positions et circulent en JSON ; le comportement vient des plugins (historique, keymaps, input rules, raccourcis Markdown, ceux de l'app) ; les commandes sont des valeurs qu'une barre d'outils exécute et interroge. L'état de l'éditeur, ses commandes et ses plugins s'exécutent en Rust : la saisie, les raccourcis clavier et les input rules n'attendent jamais le JS, et l'app lit l'état en JSON quand elle le demande.

Un éditeur a deux parties : la session (`createRichEditor`), qui possède l'état et que pilote le code de l'app, et la vue (`<RichEditor editor={…} />`), qui affiche la session nativement et transforme les entrées de la plateforme en transactions. Plusieurs vues peuvent afficher une même session.

Le noyau de l'éditeur est un portage en Rust de [ProseMirror](https://prosemirror.net) par Marijn Haverbeke, et sa couche d'extensions suit [Tiptap](https://tiptap.dev) : leurs structures de données, leurs commandes et leurs noms sont repris, et ce que vous en savez aussi. Les deux sont sous licence MIT, et leurs licences s'appliquent à ce qui en est porté.

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

Sans `schema`, un éditeur utilise le schéma de départ (`starterSchema()`) ; sans `plugins`, il reçoit le kit de départ (`starterKit()` : les input rules et les raccourcis clavier du schéma de départ, les raccourcis de base et l'historique). Un tableau `plugins` vide donne un éditeur sans aucun plugin.

<a id="styling"></a>

## Style

L'éditeur dessine le document avec l'apparence de l'app : `classes` et `styles` stylent ses parties (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker`, et pour les tableaux `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`), ses nœuds par type (`nodes: { heading: "text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Les éléments des listes dont la spec de nœud définit `extra.listMarker` à `"bullet"` ou `"ordered"` (les listes du schéma de départ) affichent un marqueur dans la partie `listMarker` : `•`, `◦`, `▪` selon la profondeur, ou des numéros à partir du `start` de la liste, placé avant l'élément, dans l'indentation de la liste (`pl-6` sur la liste, comme un navigateur indente `ul`).

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

La partie `content` est la boîte du document à l'intérieur de la vue défilante de l'éditeur : son padding (`content: "px-6 py-5"`) est l'espace autour du texte, et la barre de défilement longe le bord de l'éditeur lui-même. Un glissement qui sélectionne au-delà du haut ou du bas de l'éditeur fait défiler le document, d'autant plus vite que le pointeur s'éloigne.

### Bubble menu

`bubbleMenu` est le bubble menu de Tiptap : le contenu de l'app affiché à côté de la sélection, au-dessus par défaut (`bubbleMenuPlacement`, passant de l'autre côté s'il n'y a pas de place) à `bubbleMenuOffset` points (8), dans un overlay qui suit le texte pendant le défilement. L'app le passe tant qu'elle veut l'afficher, à partir de l'état de la session :

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

Un menu de lien modifie le lien sous le curseur avec `chain([extendMarkRange("link"), command("setLink", { href })])` et le supprime avec `command("unsetLink")` après le même `extendMarkRange`.

<a id="schemas"></a>

## Schémas

`defineSchema(spec)` lit un schéma au format de ProseMirror et lève une erreur indiquant ce qui ne va pas. Les types de nœuds nomment leur `content` (une expression de contenu : `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), leur `group`, s'ils sont `inline` ou un `atom`, les `marks` qu'ils autorisent et leurs `attrs` avec valeurs par défaut et validation (`"string"`, `"number"`, `"boolean"`). Le premier type de bloc est celui par défaut : ce que crée Entrée et ce qui remplit le contenu requis. Les clés qu'une spec ne connaît pas sont conservées comme données supplémentaires du type, pour les frameworks construits sur l'éditeur.

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

Un `RichSchema` lit et écrit des documents : `parse(content, format?)` (texte brut par défaut, `"markdown"`, ou JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (Markdown par défaut, `"text"`, `"json"`) et `check(doc)`, qui renvoie le document avec les valeurs par défaut de ses attributs renseignées. `nodes`, `marks` et `topNode` nomment ses types. Le Markdown correspond aux noms du schéma de départ (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

<a id="commands"></a>

## Commandes

Une commande est une valeur : `toggleMark("bold")` crée un objet que l'app conserve, associe à des touches et passe à l'éditeur. `editor.run(command)` l'exécute et renvoie si elle s'est appliquée ; `editor.can(command)` pose la question sans rien modifier, ce qui permet à une barre d'outils d'activer ses boutons. `editor.isActive(name, attrs?)` indique si une marque ou un nœud est actif à la sélection (`isActive("heading", { level: 2 })`).

| Commande | Rôle |
| --- | --- |
| `toggleMark(name, attrs?)` | Ajoute la marque à la sélection, ou la retire là où elle est présente ; avec un curseur, pour le texte saisi ensuite |
| `setMark(name, attrs?)` / `unsetMark(name)` | Ajoute ou retire une marque |
| `setBlockType(name, attrs?)` | Convertit les blocs de texte sélectionnés en un type donné (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Enveloppe les blocs sélectionnés dans un nœud (une citation) / les sort de leur parent |
| `wrapInList(name, attrs?)` | Enveloppe les blocs sélectionnés dans une liste |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Scinde, indente ou désindente des éléments de liste |
| `undo()` / `redo()` | Annule ou rétablit une modification (avec `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Sélectionne |
| `insertText(text)`, `insertContent(content, format?)` | Insère du texte ou du contenu sur la sélection |
| `setNodeAttribute(pos, attr, value)` | Définit un attribut du nœud à une position, en une seule modification annulable |
| `command(name)` | Une commande sans paramètre, désignée par son nom : `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Exécute des commandes l'une après l'autre en une seule transaction (une étape d'annulation) ; ne s'applique que si chacune s'applique |
| `first(commands)` | Exécute la première commande qui s'applique |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## La session

| Membre | Description |
| --- | --- |
| `state`, `doc`, `selection` | L'état, le document et la sélection en JSON, produits à la lecture |
| `revision` | Nombre de transactions que l'état a appliquées |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | Ce qu'une UI affiche de l'éditeur |
| `setContent(content, format?)` | Remplace le document, en une seule modification annulable |
| `insertContent(content, format?)` | Insère du contenu sur la sélection |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | Le document dans un format donné |
| `dispatch(tr)` | Applique une transaction donnée en JSON (ses steps appliqués au document courant) |
| `on(event, listener)` | Appelle `listener` avec la charge utile de chaque `event`, au prochain tour de JS : `revision` (`{ revision }`, après chaque modification, quelle qu'en soit la source), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Renvoie une fonction qui l'arrête ; un écouteur ajouté pendant le rendu d'un composant s'arrête avec le composant |
| `focus()`, `blur()` | Déplace le focus clavier vers les vues qui affichent l'éditeur, ou hors de celles-ci |

Les positions se comptent comme dans ProseMirror : un texte compte ses unités de code UTF-16, un nœud feuille en compte une, un nœud avec contenu ses deux frontières. Tout ce qui doit survivre aux modifications garde un id dans les attributs d'un nœud ou d'une marque. Une requête de position (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) lève une `RangeError` pour une position hors du document (`0` à `doc.content.size`), comme le `resolve` de ProseMirror, et répond `null` là où il n'y a rien (`nodeAt` à la fin d'un nœud, `coordsAtPos` sans vue affichant l'éditeur). `run` et `can` lèvent une `TypeError` pour une commande, un type de nœud ou un type de marque que l'éditeur ne connaît pas.

<a id="taking-over-transactions"></a>

### Prendre le contrôle des transactions

`editor.dispatchTransaction = (tr) => { … }` fait valider chaque transaction par l'app elle-même : le gestionnaire reçoit chacune en JSON et la valide avec `editor.applyTransaction(tr)`, ou l'abandonne. La collaboration, la journalisation et les transactions qui doivent passer les contrôles de l'app l'utilisent ; `null` rend la validation à l'éditeur. Le gestionnaire entend la saisie au prochain tour de JS, et le document change quand il valide.

## Extensions

Les extensions sont celles de Tiptap : chacune apporte ensemble son type de nœud ou de marque, ses raccourcis clavier, ses input rules et paste rules, ses plugins et ses commandes nommées, et un éditeur construit à partir d'extensions en tire son schéma, son keymap, ses règles et sa table de commandes. Les extensions intégrées sont des classes nommées comme celles de Tiptap, utilisées telles quelles ou configurées :

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` apporte `Document`, `Paragraph`, le nœud text, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (le `Image` de Tiptap), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (le `Link` de Tiptap), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (le `TextStyle` de Tiptap), `TextAlign`, `History`, `TrailingNode`, `Typography` et `ListKeymap`. Une option portant le nom de l'une d'elles, définie à `false`, l'omet ; un objet la configure (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). Le `configure(options)` et le `extend({...})` de chaque classe produisent un `RichExtension`, qui a `name`, `type`, `priority` et `options`. Chaque éditeur reçoit aussi le keymap de base (Entrée, Retour arrière, Suppr, tout sélectionner).

Chaque extension ajoute les commandes de Tiptap, que `command(name, args)` exécute : `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, ainsi que les commandes de lien, de comptage de caractères et de suggestion ci-dessous.

Les bascules de liste agissent sur des listes entières, comme les boutons de liste d'un traitement de texte : `toggleOrderedList` dans une liste à puces la numérote à tous les niveaux, listes imbriquées comprises, et la bascule propre à une liste sort les blocs sélectionnés de toutes les listes qui les entourent.

L'ordre des `extensions` fixe leur priorité à égalité : une extension listée plus tard associe ses touches avant celles qui la précèdent ; `priority` (100 par défaut) les classe autrement. Avec `extensions`, les `plugins` d'un éditeur viennent après les plugins des extensions.

<a id="the-apps-extensions"></a>

### Les extensions de l'app

`defineExtension` en crée une. Ses fonctions s'exécutent une fois, quand un éditeur est créé avec elle, avec les options de l'extension, et renvoient des données : commandes, règles et plugins tels que les produisent les factories ci-dessus.

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` ou `mark` (sous la forme de `defineSchema`) en fait une extension de nœud ou de marque ; `addGlobalAttributes` ajoute des attributs à d'autres types ; `addProseMirrorPlugins` renvoie des plugins, `RichEditorPlugin` compris ; `addPasteRules` renvoie des règles `textRule` et `markRule` pour le texte collé. Le `extend({...})` d'une classe intégrée remplace les parties qu'elle fournit : `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

Le crate d'une app enregistre des extensions écrites en Rust via son jeu d'UI, et JS les prend par leur nom :

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` trouve aussi chaque extension intégrée par son nom (`"text"`, `"bold"`, ...).

## Plugins

| Factory | Ce qu'elle ajoute |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | Historique d'annulation ; les modifications faites à moins de `newGroupDelay` millisecondes d'intervalle (500) s'annulent ensemble |
| `keymap(bindings)` | Commandes par nom de touche : `"Mod-b"` (Cmd sur les plateformes Apple, Ctrl ailleurs), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Entrée, Retour arrière, Suppr, tout sélectionner et les touches d'édition de texte de la plateforme |
| `starterKeymap()` | Les raccourcis du schéma de départ : marques, titres, listes, blocs de code, sauts de ligne forcés |
| `inputRules(rules)` | Le texte saisi avant le curseur qui correspond à une règle devient ce que la règle produit ; Retour arrière juste après l'annule |
| `markdown(options?)` | Markdown à la saisie, collage Markdown et copie Markdown (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | Les input rules et raccourcis du schéma de départ, les raccourcis de base et l'historique |

La place d'un plugin dans la liste est sa priorité : les keymaps et input rules placés plus tôt traitent une touche ou un texte en premier. Les input rules viennent de `markdownRules()` (titres, citations, listes, blocs de code, règles, marques courantes), `typographyRules()` (guillemets typographiques, points de suspension, tiret cadratin), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` et `textblockRule(match, node)`. Le `match` d'une règle est une expression régulière se terminant par `$`, appliquée au texte situé avant le curseur.

<a id="the-apps-plugins"></a>

### Les plugins de l'app

`new RichEditorPlugin(key)` crée un plugin dont le comportement est celui de l'app, défini par des appels chaînés :

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)` : tant que `capturing` est vrai, l'éditeur consomme ces touches et indique à `handler` laquelle a été pressée, juste après ; le clavier reste aussi rapide que sans plugin.
- `editor.setDecorations(key, decorations)` : attributs inline, attributs de nœud et widgets que la vue dessine par-dessus le document sans le modifier. Ils suivent chaque modification jusqu'à ce qu'on les redéfinisse.
- `filterTransaction(hook)` et `appendTransaction(hook)` voient les transactions que font les appels propres de l'app (`run`, `dispatch`, `setContent`, …) dans cet appel : `filterTransaction` peut en abandonner une, `appendTransaction` peut en renvoyer une de plus à appliquer avec elle. `on("revision", …)` entend chaque modification, saisie comprise.
<a id="links-character-counts-and-suggestions"></a>

## Liens, décomptes de caractères et suggestions

Trois plugins portent les comportements Link, CharacterCount et Suggestion de Tiptap, tous natifs :

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)` : une URL saisie avant une espace ou Entrée devient un lien, tout comme les URL d'un texte collé (`autolink`) ;
  une URL collée sur une sélection transforme celle-ci en lien (`linkOnPaste`) ; un appui sur un lien avec Mod maintenu, ou lorsque
  l'éditeur est en lecture seule, l'ouvre via la gestion des URL de l'app (`openOnClick`) ; `enableClickSelection` sélectionne
  tout le lien lors d'un appui. Les URL sont détectées avec ou sans protocole (`nsh.dev`, `https://nsh.dev/docs`, adresses
  e-mail), et le protocole attribué à un hôte nu est `defaultProtocol` (`http`). Les liens acceptent les protocoles `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` ainsi que ceux de `protocols`, de sorte que
  `setLink({ href })`, `toggleLink(attrs?)` et l'autolink excluent les scripts (`javascript:`) et les URL de données.
  `unsetLink()` supprime le lien autour de la sélection.
- `characterCount(options?)` : `editor.characters(mode?)` compte les caractères du texte (`"textSize"`, unités UTF-16 comme
  `length` de JS) ou les positions du document (`"nodeSize"`) ; `editor.words()` compte ses mots (limites de mots
  Unicode). Avec `limit`, les modifications qui le dépasseraient sont refusées et le contenu collé est tronqué à ce qui tient ;
  un premier document au-delà de la limite est tronqué (`autoTrim`). `setCharacterLimit(limit)` modifie la limite et
  `editor.characterLimit` la lit.
- `suggestion(options?)` : suit un déclencheur (`char`, `@` par défaut) saisi avant le curseur. `allowSpaces` permet à la
  requête de contenir des espaces, `allowedPrefixes` liste ce qui peut précéder le déclencheur (une espace par défaut ; `anyPrefix` accepte
  n'importe quoi), `startOfLine` l'exige en début de ligne (un menu de commandes `/`). `editor.suggestion(key)` donne
  `{ active, range, query, text, lastKey, keyCount }` ; la plage active porte le `decorationClass` de l'app (et
  `decorationEmptyClass` tant que la requête est vide). Tant qu'une suggestion est active, les touches de `captureKeys` appartiennent
  à la liste de l'app : l'éditeur les capture et enregistre la dernière dans l'état, et Échap ferme la
  suggestion (`exitSuggestion(key)` aussi). `replaceSuggestion(content, key?)` remplace le déclencheur et la requête
  par du texte ou du contenu JSON.
- `withMention(schema, { name?, char? })` ajoute le nœud mention de Tiptap : un atome en ligne avec `id`, `label` et son
  déclencheur, écrit `@label` dans le texte et `<span data-type="mention">` en HTML. `insertMention(range, id, label?)`
  remplace la plage d'une suggestion par une mention suivie d'une espace.

La fenêtre contextuelle appartient à l'app : elle lit l'état de la suggestion, se place à `coordsAtPos(range.from)` et dessine les
éléments à sa façon.

<a id="tables"></a>

## Tableaux

`TableKit` apporte les tableaux de Tiptap : `RichTable` (`Table` de Tiptap), `RichTableRow`, `RichTableHeader` et
`RichTableCell`. Il s'ajoute à côté de `StarterKit` :

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

Le tableau accepte les options `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) et `HTMLAttributes` ; `TableKit.configure({ tableHeader: false })` exclut une
extension. Les cellules contiennent des blocs et ont `colspan`, `rowspan` et `colwidth` (une largeur en points pour chaque colonne
couverte) ; les lignes ont un `height`.

Tab et Maj-Tab déplacent entre les cellules, et Tab dans la dernière cellule ajoute une ligne. Les flèches au bord d'une cellule passent à la
cellule suivante ; Maj avec une flèche, ou un glissement sur plusieurs cellules, sélectionne un rectangle de cellules (une sélection de type
`"cell"`, dont `anchor` et `head` sont les positions avant sa première et sa dernière cellule). Retour arrière et Suppr vident
les cellules sélectionnées, et suppriment le tableau lorsque toutes ses cellules sont sélectionnées.

Dans l'éditeur, un tableau est une grille de ses cellules : chaque colonne est aussi large que les `colwidth` de ses cellules, les colonnes sans largeur
se partageant la place restante (avec au moins `cellMinWidth` de large), chaque ligne ayant au moins sa `height`. Son apparence part du thème : une
grille `border` de 1 point, des cellules d'en-tête sur `muted`, des cellules avec marge intérieure, et chaque cellule sélectionnée sous la partie `selectedCell` dans
la couleur de sélection. `classes.nodes` (`table`, `tableCell`, `tableHeader`) et les parties permettent de tout restyler.
Haut et Bas sur la première ou la dernière ligne d'une cellule mènent à la cellule au-dessus ou en dessous.

Tant que le document est modifiable :

- Sur ordinateur, la bordure droite de chaque colonne et la bordure inférieure de chaque ligne permettent de les redimensionner : le pointeur affiche le
  curseur de redimensionnement et la ligne `tableResizeHandle`, le tableau suit le glissement, et le relâchement définit `colwidth` ou
  `height` en une seule étape que l'annulation peut défaire. `resizable: false` désactive ce comportement, `lastColumnResizable: false` conserve la
  largeur de la dernière colonne.
- Le tableau contenant la sélection affiche des poignées (`tableGrip`) sur sa bordure supérieure au-dessus de chaque colonne et sur sa bordure gauche
  à côté de chaque ligne. Appuyer sur l'une d'elles sélectionne cette colonne ou cette ligne ; la faire glisser sur ordinateur montre où elle sera déposée
  (`tableDropIndicator`) et l'y déplace au relâchement.

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

Les commandes, chacune étant un assistant de `nsh/base` :

- `insertTable({ rows, cols, withHeaderRow })` (3 × 3 avec une ligne d'en-tête par défaut) et `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` et `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` et `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` et `fixTables()`, qui répare les tableaux dont des cellules sont manquantes ou se chevauchent.
- `moveTableRow({ from, to, select })` et `moveTableColumn({ from, to, select })` déplacent une ligne ou une colonne, avec
  les lignes ou colonnes couvertes par ses cellules fusionnées ; `setColumnWidth({ col, width })` et
  `setRowHeight({ row, height })` les dimensionnent (`null` les ajuste à leur contenu). Elles acceptent `table`, la position
  avant un tableau, pour agir sur un tableau autre que celui de la sélection.

Les tableaux se lisent et s'écrivent en HTML (`<table>` avec `<th>` / `<td>`, `colspan`, `rowspan` et `data-colwidth`) et en
Markdown : un tableau avec une ligne d'en-tête dont les cellules contiennent chacune un paragraphe est un tableau GFM à barres verticales, et tout autre tableau est
écrit en HTML, qui se relit à l'identique. En texte brut, une ligne est une ligne de texte dont les cellules sont séparées par des tabulations.
