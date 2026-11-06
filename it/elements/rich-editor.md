---
title: "RichEditor"
description: "L'editor di testo ricco di nsh/base: documenti definiti dallo schema dell'app, comandi, plugin, cronologia, keymap, input rules e Markdown, secondo l'architettura di ProseMirror, con il proprio stato in Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---

# RichEditor

`RichEditor` è un editor di testo ricco costruito secondo l'architettura di ProseMirror. L'app definisce di cosa è fatto un documento con uno schema (paragrafi, titoli, liste, menzioni, qualsiasi tipo di nodo e mark serva), e l'editor mantiene ogni documento valido rispetto ad esso. Le modifiche sono step raggruppati in transazioni, quindi si possono annullare, mappano le posizioni e viaggiano come JSON; il comportamento viene dai plugin (cronologia, keymap, input rule, scorciatoie Markdown, quelli dell'app); i comandi sono valori che una toolbar esegue e interroga. Lo stato dell'editor, i suoi comandi e i suoi plugin girano in Rust: digitazione, associazioni di tasti e input rule non aspettano mai JS, e l'app legge lo stato come JSON quando lo richiede.

Un editor ha due parti: la sessione (`createRichEditor`), che possiede lo stato e che il codice dell'app pilota, e la vista (`<RichEditor editor={…} />`), che renderizza la sessione in modo nativo e trasforma l'input della piattaforma in transazioni. Più viste possono mostrare una stessa sessione.

Il kernel dell'editor è un port in Rust di [ProseMirror](https://prosemirror.net) di Marijn Haverbeke, e il suo livello di estensioni segue [Tiptap](https://tiptap.dev): le loro strutture dati, i comandi e i nomi vengono mantenuti, e con essi ciò che già conosci di entrambi. Entrambi sono rilasciati con licenza MIT, e le loro licenze si applicano a ciò che ne è stato portato.

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

Senza `schema` un editor usa lo schema starter (`starterSchema()`); senza `plugins` ottiene lo starter kit (`starterKit()`: le input rule e le associazioni di tasti dello starter, le associazioni di tasti di base e la cronologia). Un array `plugins` vuoto crea un editor senza alcun plugin.

<a id="styling"></a>

## Stile

L'editor disegna il documento con l'aspetto dell'app: `classes` e `styles` stilizzano le sue parti (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker`, e per le tabelle `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`), i suoi nodi per tipo (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Gli elementi delle liste il cui node spec imposta `extra.listMarker` su `"bullet"` o `"ordered"` (le liste dello schema starter) mostrano un marcatore nella parte `listMarker`: `•`, `◦`, `▪` in base alla profondità, oppure numeri a partire da `start` della lista, posizionato prima dell'elemento, nel rientro della lista (`pl-6` sulla lista, come un browser rientra `ul`).

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

La parte `content` è il riquadro del documento all'interno della scroll view dell'editor: il suo padding (`content: "px-6 py-5"`) è lo spazio attorno al testo, e la barra di scorrimento corre lungo il bordo dell'editor stesso. Un trascinamento che seleziona oltre il bordo superiore o inferiore dell'editor fa scorrere il documento, tanto più velocemente quanto più il puntatore si allontana.

### Bubble menu

`bubbleMenu` è il bubble menu di Tiptap: il contenuto dell'app mostrato accanto alla selezione, per impostazione predefinita sopra di essa (`bubbleMenuPlacement`, passando sull'altro lato dove non c'è spazio) a `bubbleMenuOffset` punti (8), in un overlay che segue il testo mentre scorre. L'app lo passa finché vuole che sia mostrato, a partire dallo stato della sessione:

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

Un menu per i link modifica il link sotto il cursore con `chain([extendMarkRange("link"), command("setLink", { href })])` e lo rimuove con `command("unsetLink")` dopo lo stesso `extendMarkRange`.

<a id="schemas"></a>

## Schemi

`defineSchema(spec)` legge uno schema nella forma di ProseMirror e lancia un errore indicando cosa c'è di sbagliato. I tipi di nodo indicano il proprio `content` (un'espressione di contenuto: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), il proprio `group`, se sono `inline` o un `atom`, i `marks` che ammettono e i propri `attrs` con valori predefiniti e validazione (`"string"`, `"number"`, `"boolean"`). Il primo tipo di blocco è quello predefinito: ciò che crea Invio e ciò che riempie il contenuto obbligatorio. Le chiavi che una spec non riconosce vengono conservate come dati extra del tipo, per i framework costruiti sopra l'editor.

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

Un `RichSchema` legge e scrive documenti: `parse(content, format?)` (testo semplice per impostazione predefinita, `"markdown"`, oppure JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (Markdown per impostazione predefinita, `"text"`, `"json"`) e `check(doc)`, che restituisce il documento con i valori predefiniti degli attributi compilati. `nodes`, `marks` e `topNode` ne nominano i tipi. Il Markdown corrisponde ai nomi dello schema starter (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

<a id="commands"></a>

## Comandi

Un comando è un valore: `toggleMark("bold")` crea un oggetto che l'app conserva, associa ai tasti e passa all'editor. `editor.run(command)` lo esegue e restituisce se è stato applicato; `editor.can(command)` lo interroga senza modificare nulla, ed è così che una toolbar abilita i propri pulsanti. `editor.isActive(name, attrs?)` indica se un mark o un nodo è attivo sulla selezione (`isActive("heading", { level: 2 })`).

| Comando | Cosa fa |
| --- | --- |
| `toggleMark(name, attrs?)` | Aggiunge il mark alla selezione, o lo rimuove dove è presente; con un cursore, vale per il testo digitato successivamente |
| `setMark(name, attrs?)` / `unsetMark(name)` | Aggiunge o rimuove un mark |
| `setBlockType(name, attrs?)` | Trasforma i textblock selezionati in un tipo (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Racchiude i blocchi selezionati in un nodo (una citazione) / li estrae dal loro genitore |
| `wrapInList(name, attrs?)` | Racchiude i blocchi selezionati in una lista |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Divide, indenta o riduce il rientro degli elementi di lista |
| `undo()` / `redo()` | Annulla o ripristina una modifica (con `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Seleziona |
| `insertText(text)`, `insertContent(content, format?)` | Inserisce testo o contenuto sulla selezione |
| `setNodeAttribute(pos, attr, value)` | Imposta un attributo del nodo in una posizione, come un'unica modifica annullabile |
| `command(name)` | Un comando senza parametri, per nome: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Esegue i comandi uno dopo l'altro come un'unica transazione (un solo passo di annullamento); si applica solo se ogni comando si applica |
| `first(commands)` | Esegue il primo comando che si applica |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## La sessione

| Membro | Cos'è |
| --- | --- |
| `state`, `doc`, `selection` | Lo stato, il documento e la selezione come JSON, creati al momento della lettura |
| `revision` | Quante transazioni ha applicato lo stato |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | Ciò che una UI mostra dell'editor |
| `setContent(content, format?)` | Sostituisce il documento, come un'unica modifica annullabile |
| `insertContent(content, format?)` | Inserisce contenuto sulla selezione |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | Il documento in un formato |
| `dispatch(tr)` | Applica una transazione data come JSON (i suoi step rispetto al documento corrente) |
| `on(event, listener)` | Chiama `listener` con il payload di ogni `event`, nel turno successivo di JS: `revision` (`{ revision }`, dopo ogni modifica, da qualsiasi sorgente), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Restituisce una funzione che lo interrompe; un listener aggiunto mentre un componente viene renderizzato si interrompe con il componente |
| `focus()`, `blur()` | Sposta il focus della tastiera verso o dalle viste che mostrano l'editor |

Le posizioni si contano come in ProseMirror: un testo conta le sue unità di codice UTF-16, un nodo foglia uno, un nodo con contenuto i suoi due confini. Tutto ciò che deve sopravvivere alle modifiche conserva un id negli attributi di un nodo o in un mark. Una query di posizione (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) lancia un `RangeError` per una posizione fuori dal documento (`0` a `doc.content.size`), come fa `resolve` di ProseMirror, e risponde `null` dove non c'è nulla (`nodeAt` alla fine di un nodo, `coordsAtPos` senza alcuna vista che mostri l'editor). `run` e `can` lanciano un `TypeError` per un comando, un nodo o un tipo di mark che l'editor non conosce.

<a id="taking-over-transactions"></a>

### Assumere il controllo delle transazioni

`editor.dispatchTransaction = (tr) => { … }` fa sì che sia l'app a eseguire il commit di ogni transazione: il gestore riceve ciascuna transazione come JSON e ne esegue il commit con `editor.applyTransaction(tr)`, oppure la scarta. Collaborazione, logging e transazioni che devono superare i controlli dell'app lo usano; `null` restituisce il commit all'editor. Il gestore sente la digitazione nel turno successivo di JS, e il documento cambia quando esegue il commit.

<a id="extensions"></a>

## Estensioni

Le estensioni sono quelle di Tiptap: ciascuna porta insieme il proprio tipo di nodo o di mark, le proprie associazioni di tasti, le input rule e le paste rule, i plugin e i comandi con nome, e un editor creato da estensioni ottiene da esse il proprio schema, la keymap, le regole e la tabella dei comandi. Quelle integrate sono classi con i nomi di Tiptap, usate così come sono o configurate:

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

`StarterKit` porta `Document`, `Paragraph`, il nodo text, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (`Image` di Tiptap), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (`Link` di Tiptap), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (`TextStyle` di Tiptap), `TextAlign`, `History`, `TrailingNode`, `Typography` e `ListKeymap`. Un'opzione con il nome di una di esse impostata su `false` la esclude, un oggetto la configura (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). `configure(options)` e `extend({...})` di ciascuna classe creano un `RichExtension`, che ha `name`, `type`, `priority` e `options`. Ogni editor ottiene inoltre la keymap di base (Invio, Backspace, Canc, seleziona tutto).

Ogni estensione aggiunge i comandi di Tiptap, che `command(name, args)` esegue: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, e i comandi per link, conteggio dei caratteri e suggerimenti riportati più sotto.

I toggle delle liste operano su liste intere, come i pulsanti di lista di un word processor: `toggleOrderedList` in una lista puntata la numera a ogni livello, comprese le liste annidate, e il toggle di una lista toglie i blocchi selezionati da ogni lista che li circonda.

L'ordine di `extensions` è la loro priorità a parità di livello: un'estensione elencata dopo associa i propri tasti prima di quelle che la precedono; `priority` (100 per impostazione predefinita) le ordina altrimenti. Con `extensions`, i `plugins` di un editor vengono dopo i plugin delle estensioni.

<a id="the-apps-extensions"></a>

### Le estensioni dell'app

`defineExtension` ne crea una. Le sue funzioni vengono eseguite una volta, quando viene creato un editor con essa, con le opzioni dell'estensione, e restituiscono dati: comandi, regole e plugin così come li creano le factory descritte sopra.

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

`node` o `mark` (nella forma di `defineSchema`) la rende un'estensione di nodo o di mark; `addGlobalAttributes` aggiunge attributi ad altri tipi; `addProseMirrorPlugins` restituisce plugin, compresi i `RichEditorPlugin`; `addPasteRules` restituisce regole `textRule` e `markRule` per il testo incollato. `extend({...})` di una classe integrata sostituisce le parti che essa fornisce: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

Il crate di un'app registra le estensioni scritte in Rust tramite il proprio UI set, e JS le prende per nome:

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

`richExtension(name, options)` trova anche ogni estensione integrata per nome (`"text"`, `"bold"`, ...).

<a id="plugins"></a>

## Plugin

| Factory | Cosa aggiunge |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | Cronologia di annullamento; le modifiche entro `newGroupDelay` millisecondi (500) si annullano insieme |
| `keymap(bindings)` | Comandi per nome del tasto: `"Mod-b"` (Cmd sulle piattaforme Apple, Ctrl altrove), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Invio, Backspace, Canc, seleziona tutto e i tasti di modifica del testo della piattaforma |
| `starterKeymap()` | Le associazioni dello schema starter: mark, titoli, liste, blocchi di codice, hard break |
| `inputRules(rules)` | Il testo digitato prima del cursore che corrisponde a una regola diventa ciò che la regola produce; Backspace subito dopo lo annulla |
| `markdown(options?)` | Markdown durante la digitazione, incolla Markdown e copia Markdown (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | Le input rule e le associazioni dello starter, le associazioni di base e la cronologia |

La posizione di un plugin nell'elenco è la sua priorità: le keymap e le input rule che compaiono prima nell'elenco gestiscono per prime un tasto o un testo. Le input rule provengono da `markdownRules()` (titoli, citazioni, liste, code fence, regole, i mark più comuni), `typographyRules()` (virgolette tipografiche, puntini di sospensione, trattino lungo), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` e `textblockRule(match, node)`. Il `match` di una regola è un'espressione regolare che termina con `$`, confrontata con il testo prima del cursore.

<a id="the-apps-plugins"></a>

### I plugin dell'app

`new RichEditorPlugin(key)` crea un plugin il cui comportamento è quello dell'app, impostato con chiamate concatenate:

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

- `captureKeys(keys, handler)`: finché `capturing` è true l'editor consuma questi tasti e comunica a `handler` quale è stato premuto, subito dopo; la tastiera resta rapida come senza alcun plugin.
- `editor.setDecorations(key, decorations)`: attributi inline, attributi di nodo e widget che la vista disegna sopra il documento senza modificarlo. Seguono ogni modifica finché non vengono impostati di nuovo.
- `filterTransaction(hook)` e `appendTransaction(hook)` vedono le transazioni prodotte dalle chiamate dell'app stessa (`run`, `dispatch`, `setContent`, …) in quella chiamata: `filterTransaction` può scartarne una, `appendTransaction` può restituirne una in più da applicare insieme. `on("revision", …)` sente ogni modifica, digitazione compresa.
<a id="links-character-counts-and-suggestions"></a>

## Link, conteggio dei caratteri e suggerimenti

Tre plugin offrono il comportamento di Link, CharacterCount e Suggestion di Tiptap, tutto in modo nativo:

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

- `link(options?)`: un URL digitato prima di uno spazio o di Invio diventa un link, così come gli URL nel testo incollato (`autolink`);
  un URL incollato su una selezione trasforma la selezione in un link (`linkOnPaste`); la pressione su un link con Mod premuto, o quando l'
  editor è in sola lettura, lo apre tramite la gestione degli URL dell'app (`openOnClick`); `enableClickSelection` seleziona l'intero
  link alla pressione. Gli URL vengono riconosciuti con o senza protocollo (`nsh.dev`, `https://nsh.dev/docs`, indirizzi
  e-mail), e il protocollo assegnato a un host senza protocollo è `defaultProtocol` (`http`). I link accettano i protocolli `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` e quelli in `protocols`, quindi
  `setLink({ href })`, `toggleLink(attrs?)` e l'autolinking escludono gli script (`javascript:`) e gli URL di tipo data.
  `unsetLink()` rimuove il link attorno alla selezione.
- `characterCount(options?)`: `editor.characters(mode?)` conta i caratteri del testo (`"textSize"`, unità UTF-16 come
  `length` di JS) oppure le posizioni del documento (`"nodeSize"`); `editor.words()` ne conta le parole (confini di parola
  Unicode). Con `limit`, le modifiche che supererebbero il limite vengono rifiutate e il contenuto incollato viene troncato a ciò che entra;
  un primo documento oltre il limite viene troncato (`autoTrim`). `setCharacterLimit(limit)` modifica il limite e
  `editor.characterLimit` lo legge.
- `suggestion(options?)`: segue un trigger (`char`, per impostazione predefinita `@`) digitato prima del cursore. `allowSpaces` consente alla
  query di contenere spazi, `allowedPrefixes` elenca ciò che può precedere il trigger (per impostazione predefinita uno spazio; `anyPrefix` accetta
  qualsiasi cosa), `startOfLine` lo richiede all'inizio della riga (un menu di comandi `/`). `editor.suggestion(key)` restituisce
  `{ active, range, query, text, lastKey, keyCount }`; l'intervallo attivo contiene il `decorationClass` dell'app (e
  `decorationEmptyClass` finché la query è vuota). Mentre un suggerimento è attivo, i tasti in `captureKeys` appartengono
  all'elenco dell'app: l'editor li intercetta e registra l'ultimo nello stato, ed Esc chiude il
  suggerimento (lo fa anche `exitSuggestion(key)`). `replaceSuggestion(content, key?)` sostituisce il trigger e la query
  con testo o contenuto JSON.
- `withMention(schema, { name?, char? })` aggiunge il nodo mention di Tiptap: un atomo inline con `id`, `label` e il relativo
  trigger, scritto come `@label` nel testo e come `<span data-type="mention">` in HTML. `insertMention(range, id, label?)`
  sostituisce l'intervallo di un suggerimento con una mention e uno spazio.

Il popup appartiene all'app: legge lo stato del suggerimento, si posiziona in `coordsAtPos(range.from)` e disegna gli
elementi a modo suo.

<a id="tables"></a>

## Tabelle

`TableKit` offre le tabelle di Tiptap: `RichTable` (`Table` di Tiptap), `RichTableRow`, `RichTableHeader` e
`RichTableCell`. Viene aggiunto accanto a `StarterKit`:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

La tabella accetta le opzioni `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) e `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` esclude una
singola estensione. Le celle contengono blocchi e hanno `colspan`, `rowspan` e `colwidth` (una larghezza in punti per ciascuna colonna che
occupano); le righe hanno un `height`.

Tab e Maiusc-Tab si spostano tra le celle, e Tab nell'ultima cella aggiunge una riga. I tasti freccia al bordo di una cella passano alla
cella successiva; Maiusc con una freccia, o un trascinamento sulle celle, seleziona un rettangolo di celle (una selezione di tipo
`"cell"`, i cui `anchor` e `head` sono le posizioni prima della prima e dell'ultima cella). Backspace e Canc
svuotano le celle selezionate ed eliminano la tabella quando tutte le sue celle sono selezionate.

Nell'editor una tabella è una griglia delle sue celle: ogni colonna è larga quanto il `colwidth` delle sue celle, mentre le colonne prive di tale valore
si dividono lo spazio (con una larghezza minima di `cellMinWidth`), e ogni riga è alta almeno quanto il suo `height`. Il suo aspetto parte dal tema: una
griglia `border` da 1 punto, celle di intestazione su `muted`, celle con padding, e ogni cella selezionata sotto la parte `selectedCell` nel
colore della selezione. `classes.nodes` (`table`, `tableCell`, `tableHeader`) e le parti ridefiniscono
lo stile di tutto questo. Su e Giù sulla prima o sull'ultima riga di una cella portano alla cella sopra o sotto.

Quando il documento è modificabile:

- Sui desktop, il bordo destro di ogni colonna e il bordo inferiore di ogni riga le ridimensionano: il puntatore mostra il
  cursore di ridimensionamento e la linea `tableResizeHandle`, la tabella segue il trascinamento, e il rilascio imposta `colwidth` o
  `height` in un unico passaggio che l'annullamento ripristina. `resizable: false` disattiva questa funzione, `lastColumnResizable: false` mantiene la
  larghezza dell'ultima colonna.
- La tabella in cui si trova la selezione mostra dei grip (`tableGrip`) sul bordo superiore sopra ogni colonna e sul bordo sinistro
  accanto a ogni riga. Premendone uno si seleziona quella colonna o riga; trascinandolo sui desktop si mostra dove verrà rilasciata
  (`tableDropIndicator`) e al rilascio la si sposta lì.

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

I comandi, ciascuno un helper di `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (3 × 3 con una riga di intestazione per impostazione predefinita) e `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` e `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` e `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` e `fixTables()`, che ripara le tabelle con celle mancanti o sovrapposte.
- `moveTableRow({ from, to, select })` e `moveTableColumn({ from, to, select })` spostano una riga o una colonna, insieme
  alle righe o alle colonne occupate dalle sue celle unite; `setColumnWidth({ col, width })` e
  `setRowHeight({ row, height })` le dimensionano (`null` le dimensiona in base al contenuto). Accettano `table`, la posizione
  prima di una tabella, per agire su una tabella diversa da quella della selezione.

Le tabelle vengono lette e scritte in HTML (`<table>` con `<th>` / `<td>`, `colspan`, `rowspan` e `data-colwidth`) e
in Markdown: una tabella con una riga di intestazione le cui celle contengono ciascuna un solo paragrafo è una tabella GFM a pipe, e ogni altra tabella viene
scritta come HTML, che viene riletto in modo identico. Nel testo semplice una riga è una linea delle sue celle separate da tabulazioni.
