---
title: "RichEditor"
description: "Der Rich-Text-Editor von nsh/base: Dokumente, die durch das Schema der App definiert werden, Befehle, Plugins, Verlauf, Tastaturbelegungen, Eingaberegeln und Markdown, nach der Architektur von ProseMirror, mit dem Zustand in Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor` ist ein Rich-Text-Editor, der nach der Architektur von ProseMirror gebaut ist. Die App legt mit einem Schema fest, woraus ein Dokument besteht (Absätze, Überschriften, Listen, Mentions, beliebige Node- und Mark-Typen, die sie braucht), und der Editor hält jedes Dokument gegenüber diesem Schema gültig. Änderungen sind Steps, die zu Transaktionen gruppiert werden. Dadurch lassen sie sich rückgängig machen, bilden Positionen ab und werden als JSON übertragen. Verhalten kommt von Plugins (History, Keymaps, Input Rules, Markdown-Kürzel und den eigenen der App). Befehle sind Werte, die eine Toolbar ausführt und abfragt. Zustand, Befehle und Plugins des Editors laufen in Rust: Tippen, Tastenbelegungen und Input Rules warten nie auf JS, und die App liest den Zustand als JSON, wenn sie ihn anfordert.

Ein Editor besteht aus zwei Teilen: der Session (`createRichEditor`), die den Zustand besitzt und vom Code der App gesteuert wird, und der View (`<RichEditor editor={…} />`), die die Session nativ rendert und die Eingaben der Plattform in Transaktionen umwandelt. Mehrere Views können eine Session anzeigen.

Der Kern des Editors ist ein Rust-Port von [ProseMirror](https://prosemirror.net) von Marijn Haverbeke, und seine Erweiterungsschicht folgt [Tiptap](https://tiptap.dev): Datenstrukturen, Befehle und Namen wurden übernommen, und damit auch das, was man von beiden kennt. Beide stehen unter der MIT-Lizenz, und ihre Lizenzen gelten für das, was von ihnen portiert wurde.

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

Ohne `schema` verwendet ein Editor das Starter-Schema (`starterSchema()`). Ohne `plugins` erhält er das Starter-Kit (`starterKit()`: die Input Rules und Tastenbelegungen des Starters, die Basis-Tastenbelegungen und die History). Ein leeres `plugins`-Array erzeugt einen Editor ganz ohne Plugins.

## Styling

Der Editor zeichnet das Dokument im Look der App: `classes` und `styles` gestalten seine Teile (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker` und für Tabellen `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`) sowie seine Nodes nach Typ (`nodes: { heading: "text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). Die Items von Listen, deren Node-Spec `extra.listMarker` auf `"bullet"` oder `"ordered"` setzt (die Listen des Starter-Schemas), zeigen im Part `listMarker` einen Marker: `•`, `◦`, `▪` je nach Tiefe oder Zahlen ab dem `start` der Liste. Der Marker steht vor dem Item, im Einzug der Liste (`pl-6` an der Liste, so wie ein Browser `ul` einrückt).

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

Der Part `content` ist die Box des Dokuments innerhalb der Scroll-View des Editors: Sein Padding (`content: "px-6 py-5"`) ist der Raum um den Text, und die Bildlaufleiste verläuft am eigenen Rand des Editors. Zieht man eine Auswahl über den oberen oder unteren Rand des Editors hinaus, scrollt das Dokument mit, umso schneller, je weiter der Zeiger entfernt ist.

### Bubble Menu

`bubbleMenu` ist das Bubble Menu von Tiptap: der Inhalt der App, der neben der Auswahl angezeigt wird, standardmäßig darüber (`bubbleMenuPlacement`, auf die andere Seite wechselnd, wo kein Platz ist) in einem Abstand von `bubbleMenuOffset` Punkten (8), in einem Overlay, das dem Text beim Scrollen folgt. Die App übergibt es, solange sie es angezeigt haben möchte, abhängig vom Zustand der Session:

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

Ein Link-Menü bearbeitet den Link unter dem Cursor mit `chain([extendMarkRange("link"), command("setLink", { href })])` und entfernt ihn mit `command("unsetLink")` nach demselben `extendMarkRange`.

## Schemas

`defineSchema(spec)` liest ein Schema in der Form von ProseMirror und wirft einen Fehler, der benennt, was daran falsch ist. Node-Typen geben ihren `content` an (einen Content-Ausdruck: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), ihre `group`, ob sie `inline` oder ein `atom` sind, die `marks`, die sie erlauben, und ihre `attrs` mit Standardwerten und Validierung (`"string"`, `"number"`, `"boolean"`). Der erste Block-Typ ist der Standardtyp: das, was Enter erzeugt und was erforderlichen Inhalt füllt. Schlüssel, die eine Spec nicht kennt, bleiben als zusätzliche Daten des Typs erhalten, für Frameworks, die auf dem Editor aufbauen.

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

Ein `RichSchema` liest und schreibt Dokumente: `parse(content, format?)` (standardmäßig Klartext, `"markdown"` oder JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (standardmäßig Markdown, `"text"`, `"json"`) und `check(doc)`, das das Dokument mit ausgefüllten Attribut-Standardwerten zurückgibt. `nodes`, `marks` und `topNode` nennen seine Typen. Markdown wird auf die Namen des Starter-Schemas abgebildet (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`).

<a id="commands"></a>

## Befehle

Ein Befehl ist ein Wert: `toggleMark("bold")` erzeugt ein Objekt, das die App aufbewahrt, an Tasten bindet und an den Editor übergibt. `editor.run(command)` führt ihn aus und gibt zurück, ob er angewendet wurde. `editor.can(command)` fragt an, ohne etwas zu ändern, womit eine Toolbar ihre Buttons aktiviert. `editor.isActive(name, attrs?)` gibt an, ob eine Mark oder ein Node an der Auswahl aktiv ist (`isActive("heading", { level: 2 })`).

| Befehl | Was er tut |
| --- | --- |
| `toggleMark(name, attrs?)` | Fügt die Mark zur Auswahl hinzu oder entfernt sie, wo sie vorhanden ist; an einem Cursor für den als Nächstes getippten Text |
| `setMark(name, attrs?)` / `unsetMark(name)` | Fügt eine Mark hinzu oder entfernt sie |
| `setBlockType(name, attrs?)` | Macht die ausgewählten Textblöcke zu einem Typ (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | Umschließt die ausgewählten Blöcke mit einem Node (einem Zitat) / hebt sie aus ihrem Parent heraus |
| `wrapInList(name, attrs?)` | Umschließt die ausgewählten Blöcke mit einer Liste |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | Teilt Listen-Items, rückt sie ein oder rückt sie aus |
| `undo()` / `redo()` | Macht eine Änderung rückgängig oder stellt sie wieder her (mit `history()`) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | Wählt aus |
| `insertText(text)`, `insertContent(content, format?)` | Fügt Text oder Inhalt über der Auswahl ein |
| `setNodeAttribute(pos, attr, value)` | Setzt ein Attribut des Nodes an einer Position, als eine rückgängig machbare Änderung |
| `command(name)` | Ein Befehl ohne Parameter über seinen Namen: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | Führt Befehle nacheinander als eine Transaktion aus (ein Undo-Schritt); wird nur angewendet, wenn jeder einzelne angewendet wird |
| `first(commands)` | Führt den ersten Befehl aus, der angewendet werden kann |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## Die Session

| Member | Was es ist |
| --- | --- |
| `state`, `doc`, `selection` | Der Zustand, das Dokument und die Auswahl als JSON, beim Lesen erzeugt |
| `revision` | Wie viele Transaktionen der Zustand angewendet hat |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | Was eine UI über den Editor anzeigt |
| `setContent(content, format?)` | Ersetzt das Dokument, als eine rückgängig machbare Änderung |
| `insertContent(content, format?)` | Fügt Inhalt über der Auswahl ein |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | Das Dokument in einem Format |
| `dispatch(tr)` | Wendet eine als JSON übergebene Transaktion an (ihre Steps gegen das aktuelle Dokument) |
| `on(event, listener)` | Ruft `listener` mit der Payload jedes `event` auf, im nächsten Durchlauf von JS: `revision` (`{ revision }`, nach jeder Änderung, aus jeder Quelle), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`. Gibt eine Funktion zurück, die das beendet; ein Listener, der während des Renderns einer Komponente hinzugefügt wird, endet mit der Komponente |
| `focus()`, `blur()` | Verschiebt den Tastaturfokus zu den Views, die den Editor anzeigen, oder von ihnen weg |

Positionen werden gezählt wie in ProseMirror: Ein Text zählt seine UTF-16-Codeeinheiten, ein Leaf-Node eins, ein Node mit Inhalt seine beiden Grenzen. Alles, was Änderungen überdauern muss, behält eine ID in den Attributen eines Nodes oder in einer Mark. Eine Positionsabfrage (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) wirft einen `RangeError` für eine Position außerhalb des Dokuments (`0` bis `doc.content.size`), wie es ProseMirrors `resolve` tut, und antwortet mit `null`, wo nichts vorhanden ist (`nodeAt` am Ende eines Nodes, `coordsAtPos`, wenn keine View den Editor anzeigt). `run` und `can` werfen einen `TypeError` für einen Befehl, Node- oder Mark-Typ, den der Editor nicht kennt.

<a id="taking-over-transactions"></a>

### Transaktionen übernehmen

`editor.dispatchTransaction = (tr) => { … }` lässt die App jede Transaktion selbst committen: Der Handler erhält jede einzelne als JSON und committet sie mit `editor.applyTransaction(tr)` oder verwirft sie. Kollaboration, Logging und Transaktionen, die die Prüfungen der App durchlaufen müssen, nutzen dies; `null` gibt das Committen an den Editor zurück. Der Handler hört Tippen im nächsten Durchlauf von JS, und das Dokument ändert sich, wenn er committet.

## Extensions

Extensions stammen von Tiptap: Jede bringt gemeinsam ihren Node- oder Mark-Typ, ihre Tastenbelegungen, Input und Paste Rules, Plugins und benannte Befehle mit, und ein aus Extensions erzeugter Editor bezieht daraus sein Schema, seine Keymap, seine Rules und seine Befehlstabelle. Die integrierten sind Klassen, die wie bei Tiptap benannt sind und unverändert oder konfiguriert verwendet werden:

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

`StarterKit` bringt `Document`, `Paragraph`, den Text-Node, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (Tiptaps `Image`), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (Tiptaps `Link`), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (Tiptaps `TextStyle`), `TextAlign`, `History`, `TrailingNode`, `Typography` und `ListKeymap`. Eine Option mit dem Namen einer dieser Extensions, die auf `false` gesetzt ist, lässt sie weg, ein Objekt konfiguriert sie (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`). Die `configure(options)` und `extend({...})` jeder Klasse erzeugen eine `RichExtension`, die `name`, `type`, `priority` und `options` hat. Jeder Editor erhält außerdem die Core-Keymap (Enter, Backspace, Delete, Alles auswählen).

Jede Extension fügt Tiptaps Befehle hinzu, die `command(name, args)` ausführt: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign` sowie die unten beschriebenen Befehle für Links, Zeichenzählung und Suggestions.

Die Listen-Toggles arbeiten auf ganzen Listen, wie die Listen-Buttons einer Textverarbeitung: `toggleOrderedList` in einer Aufzählungsliste nummeriert sie auf jeder Ebene, verschachtelte Listen eingeschlossen, und der Toggle einer Liste nimmt die ausgewählten Blöcke aus jeder Liste um sie herum heraus.

Die Reihenfolge von `extensions` ist ihre Priorität bei Gleichrangigkeit: Eine später aufgeführte Extension bindet ihre Tasten vor den davor aufgeführten; `priority` (standardmäßig 100) ordnet sie andernfalls. Mit `extensions` kommen die `plugins` eines Editors nach den Plugins der Extensions.

<a id="the-apps-extensions"></a>

### Die Extensions der App

`defineExtension` erzeugt eine. Ihre Funktionen laufen einmal, wenn ein Editor mit ihr erzeugt wird, mit den Optionen der Extension, und geben Daten zurück: Befehle, Rules und Plugins, wie die oben genannten Factories sie erzeugen.

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

`node` oder `mark` (in der Form von `defineSchema`) macht sie zu einer Node- oder Mark-Extension; `addGlobalAttributes` fügt anderen Typen Attribute hinzu; `addProseMirrorPlugins` gibt Plugins zurück, einschließlich `RichEditorPlugin`s; `addPasteRules` gibt `textRule`- und `markRule`-Rules für eingefügten Text zurück. Das `extend({...})` einer integrierten Klasse ersetzt die Teile, die sie liefert: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

Die Crate einer App registriert in Rust geschriebene Extensions über ihr UI-Set, und JS bezieht sie über den Namen:

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

`richExtension(name, options)` findet außerdem jede integrierte Extension über ihren Namen (`"text"`, `"bold"`, ...).

## Plugins

| Factory | Was sie hinzufügt |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | Undo-History; Änderungen innerhalb von `newGroupDelay` Millisekunden (500) werden gemeinsam rückgängig gemacht |
| `keymap(bindings)` | Befehle nach Tastenname: `"Mod-b"` (Cmd auf Apple-Plattformen, sonst Ctrl), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, Alles auswählen und die Texteditier-Tasten der Plattform |
| `starterKeymap()` | Die Belegungen des Starter-Schemas: Marks, Überschriften, Listen, Codeblöcke, Hard Breaks |
| `inputRules(rules)` | Vor dem Cursor getippter Text, der zu einer Rule passt, wird zu dem, was die Rule erzeugt; Backspace direkt danach macht das rückgängig |
| `markdown(options?)` | Markdown beim Tippen, Markdown-Einfügen und Markdown-Kopieren (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | Die Input Rules und Belegungen des Starters, die Basisbelegungen und die History |

Die Stelle eines Plugins in der Liste ist seine Priorität: Keymaps und Input Rules weiter vorn in der Liste behandeln eine Taste oder einen Text zuerst. Input Rules stammen aus `markdownRules()` (Überschriften, Zitate, Listen, Code Fences, Trennlinien, die gängigen Marks), `typographyRules()` (typografische Anführungszeichen, Auslassungspunkte, Geviertstrich), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` und `textblockRule(match, node)`. Das `match` einer Rule ist ein regulärer Ausdruck, der auf `$` endet und gegen den Text vor dem Cursor geprüft wird.

<a id="the-apps-plugins"></a>

### Die Plugins der App

`new RichEditorPlugin(key)` erzeugt ein Plugin, dessen Verhalten das der App ist, festgelegt durch verkettete Aufrufe:

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

- `captureKeys(keys, handler)`: Solange `capturing` wahr ist, verbraucht der Editor diese Tasten und teilt `handler` direkt danach mit, welche gedrückt wurde; die Tastatur bleibt so schnell wie ohne Plugin.
- `editor.setDecorations(key, decorations)`: Inline-Attribute, Node-Attribute und Widgets, die die View über das Dokument zeichnet, ohne es zu verändern. Sie folgen jeder Änderung, bis sie erneut gesetzt werden.
- `filterTransaction(hook)` und `appendTransaction(hook)` sehen die Transaktionen, die die eigenen Aufrufe der App (`run`, `dispatch`, `setContent`, …) in diesem Aufruf erzeugen: `filterTransaction` darf eine verwerfen, `appendTransaction` darf eine weitere zurückgeben, die mit angewendet wird. `on("revision", …)` hört jede Änderung, auch das Tippen.
<a id="links-character-counts-and-suggestions"></a>

## Links, Zeichenzählung und Vorschläge

Drei Plugins bringen das Verhalten von Tiptaps Link, CharacterCount und Suggestion mit, alles nativ:

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

- `link(options?)`: Eine URL, die vor einem Leerzeichen oder der Eingabetaste getippt wird, wird zu einem Link, ebenso die URLs in eingefügtem Text (`autolink`);
  eine über eine Auswahl eingefügte URL verlinkt die Auswahl (`linkOnPaste`); ein Tipp auf einen Link bei gedrückter Mod-Taste oder bei schreibgeschütztem
  Editor öffnet ihn über die URL-Verarbeitung der App (`openOnClick`); `enableClickSelection` markiert bei einem Tipp den
  gesamten Link. URLs werden mit oder ohne Protokoll erkannt (`nsh.dev`, `https://nsh.dev/docs`, E-Mail-Adressen), und das Protokoll, das ein einfacher Host erhält, ist `defaultProtocol` (`http`). Links akzeptieren die Protokolle `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` sowie die in `protocols`, sodass
  `setLink({ href })`, `toggleLink(attrs?)` und Autolinking Skripte (`javascript:`) und Data-URLs ausschließen.
  `unsetLink()` entfernt den Link um die Auswahl.
- `characterCount(options?)`: `editor.characters(mode?)` zählt die Zeichen des Textes (`"textSize"`, UTF-16-Einheiten wie
  `length` in JS) oder die Positionen des Dokuments (`"nodeSize"`); `editor.words()` zählt dessen Wörter (Unicode-Wortgrenzen). Mit `limit` werden Änderungen, die darüber hinausgehen würden, abgelehnt, und eingefügte Inhalte werden auf das gekürzt, was hineinpasst;
  ein erstes Dokument über dem Limit wird gekürzt (`autoTrim`). `setCharacterLimit(limit)` ändert das Limit und
  `editor.characterLimit` liest es aus.
- `suggestion(options?)`: verfolgt einen Auslöser (`char`, standardmäßig `@`), der vor dem Cursor getippt wird. `allowSpaces` erlaubt Leerzeichen in der
  Abfrage, `allowedPrefixes` listet auf, was dem Auslöser vorangehen darf (standardmäßig ein Leerzeichen; `anyPrefix` erlaubt
  alles), `startOfLine` verlangt ihn am Zeilenanfang (ein `/`-Befehlsmenü). `editor.suggestion(key)` liefert
  `{ active, range, query, text, lastKey, keyCount }`; der aktive Bereich trägt das `decorationClass` der App (und
  `decorationEmptyClass`, solange die Abfrage leer ist). Solange ein Vorschlag aktiv ist, gehören die Tasten in `captureKeys` der Liste
  der App: Der Editor übernimmt sie und hält die zuletzt gedrückte im Zustand fest, und Escape verwirft den
  Vorschlag (`exitSuggestion(key)` ebenfalls). `replaceSuggestion(content, key?)` ersetzt den Auslöser und die Abfrage
  durch Text oder JSON-Inhalt.
- `withMention(schema, { name?, char? })` fügt Tiptaps Mention-Node hinzu: ein Inline-Atom mit `id`, `label` und seinem
  Auslöser, im Text als `@label` und in HTML als `<span data-type="mention">` geschrieben. `insertMention(range, id, label?)`
  ersetzt den Bereich eines Vorschlags durch eine Erwähnung und ein Leerzeichen.

Das Popup gehört der App: Es liest den Zustand des Vorschlags, positioniert sich bei `coordsAtPos(range.from)` und zeichnet die
Einträge auf seine eigene Weise.

<a id="tables"></a>

## Tabellen

`TableKit` bringt Tiptaps Tabellen mit: `RichTable` (Tiptaps `Table`), `RichTableRow`, `RichTableHeader` und
`RichTableCell`. Es wird neben `StarterKit` hinzugefügt:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

Die Tabelle akzeptiert die Optionen `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) und `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` lässt eine
Erweiterung weg. Zellen enthalten Blöcke und haben `colspan`, `rowspan` und `colwidth` (eine Breite in Punkt pro Spalte, die sie
überspannen); Zeilen haben ein `height`.

Tab und Shift-Tab wechseln zwischen Zellen, und Tab in der letzten Zelle fügt eine Zeile hinzu. Pfeiltasten am Rand einer Zelle gehen zur
nächsten Zelle weiter; Shift mit einem Pfeil oder ein Ziehen über Zellen markiert ein Rechteck aus Zellen (eine Auswahl vom Typ
`"cell"`, deren `anchor` und `head` die Positionen vor ihrer ersten und letzten Zelle sind). Backspace und Delete leeren
die ausgewählten Zellen und löschen die Tabelle, wenn alle ihre Zellen ausgewählt sind.

Im Editor ist eine Tabelle ein Raster aus ihren Zellen: Jede Spalte ist so breit wie die `colwidth` ihrer Zellen, Spalten ohne eine solche
teilen sich den Platz (mindestens `cellMinWidth` breit), jede Zeile ist mindestens so hoch wie ihr `height`. Ihr Aussehen geht vom Theme aus: ein
1 Punkt starkes `border`-Raster, Kopfzellen auf `muted`, Zellen mit Innenabstand und jede ausgewählte Zelle unter dem Part `selectedCell` in
der Auswahlfarbe. `classes.nodes` (`table`, `tableCell`, `tableHeader`) und die Parts gestalten
all das um. Auf und Ab in der ersten oder letzten Zeile einer Zelle wechseln zur Zelle darüber oder darunter.

Solange das Dokument bearbeitet werden kann:

- Auf Desktops lassen sich die Größen jeder Spalte über ihren rechten Rand und jeder Zeile über ihren unteren Rand ändern: Der Zeiger zeigt den
  Resize-Cursor und die `tableResizeHandle`-Linie, die Tabelle folgt dem Ziehen, und das Loslassen setzt `colwidth` oder
  `height` in einem Schritt, den Rückgängig zurücknimmt. `resizable: false` schaltet dies ab, `lastColumnResizable: false` behält die
  Breite der letzten Spalte bei.
- Die Tabelle, in der die Auswahl liegt, zeigt Griffe (`tableGrip`) an ihrem oberen Rand über jeder Spalte und an ihrem linken Rand
  neben jeder Zeile. Ein Druck darauf wählt diese Spalte oder Zeile aus; auf Desktops zeigt das Ziehen, wo sie abgelegt wird
  (`tableDropIndicator`), und verschiebt sie beim Loslassen dorthin.

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

Die Befehle, jeweils ein Helper von `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (standardmäßig 3 × 3 mit Kopfzeile) und `deleteTable()`.
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`.
- `mergeCells()`, `splitCell()` und `mergeOrSplit()`.
- `toggleHeaderRow()`, `toggleHeaderColumn()` und `toggleHeaderCell()`.
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` und `fixTables()`, das Tabellen mit fehlenden oder überlappenden Zellen repariert.
- `moveTableRow({ from, to, select })` und `moveTableColumn({ from, to, select })` verschieben eine Zeile oder Spalte, zusammen
  mit den Zeilen oder Spalten, die ihre verbundenen Zellen überspannen; `setColumnWidth({ col, width })` und
  `setRowHeight({ row, height })` legen deren Größe fest (`null` passt sie an ihren Inhalt an). Diese akzeptieren `table`, die Position
  vor einer Tabelle, um auf eine andere Tabelle als die der Auswahl zu wirken.

Tabellen werden aus HTML gelesen und in HTML geschrieben (`<table>` mit `<th>` / `<td>`, `colspan`, `rowspan` und `data-colwidth`) sowie
in Markdown: Eine Tabelle mit einer Kopfzeile, deren Zellen jeweils einen Absatz enthalten, ist eine GFM-Pipe-Tabelle, und jede andere Tabelle wird
als ihr HTML geschrieben, das sich identisch zurücklesen lässt. In reinem Text ist eine Zeile eine Textzeile aus ihren durch Tabs getrennten Zellen.
