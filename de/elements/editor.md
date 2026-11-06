---
title: "Editor"
description: "Die Editor-Komponente: ein Code-Editor mit Syntaxhervorhebung, Zeilennummern, mehreren Carets, Code-Faltung, Soft Wrap, Suchen und Ersetzen, Diagnosen und Dekorationen sowie den Tastenkürzeln von Code-Editoren."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---


# Editor

`Editor` ist ein Code-Editor: Syntaxhervorhebung für mehr als fünfzig Sprachen, Zeilennummern, mehrere Carets, Folding, Soft Wrap, Suchen und Ersetzen, Diagnostics und Decorations, dazu die Tastenkürzel von Code-Editoren (Zeilen verschieben und duplizieren, Kommentare, Einrückung, Klammern und Anführungszeichen, die sich beim Tippen schließen). Er verarbeitet Dateien beliebiger Länge: Nur die sichtbaren Zeilen werden erzeugt, und die Hervorhebung folgt jeder Änderung Zeile für Zeile. So scrollt und tippt sich eine lange Datei genauso flüssig wie eine kurze. Die Eingabe läuft über die Texteingabe der Plattform, sodass Eingabemethoden (Pinyin, Kana, Dead Keys) und Soft-Tastaturen funktionieren wie in jedem Textfeld.

Der Editor übernimmt das Verhalten und bringt ein eigenes Erscheinungsbild mit, das aus den Tokens des Themes aufgebaut ist: die `font-mono` des Themes mit 13pt in Zeilen von 20pt, Zeilennummern in `muted-foreground`, ein schwaches `muted`-Band hinter den Zeilen mit einem Caret, Auswahlen in einem Farbton von `primary`, Einrückungslinien in `border` und die eingebauten Syntaxfarben, die auch die Codeblöcke von [`TextView`](./text-view.md) verwenden, jeweils hell und dunkel. Jeder Teil übernimmt anstelle dieser Standardwerte die Styles der App (`classes` und `styles`). Rust erzeugt einen Editor mit `nsh_base::editor()`, TSX mit `<Editor>` aus `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

Der Editor füllt die Box, die ihm die App gibt (`flex-1`, eine Höhe), und scrollt seinen Text darin: vertikal immer, seitwärts, wenn Zeilen länger sind als die Box, oder gar nicht mit `softWrap`. In diesem Fall werden lange Zeilen an der Breite des Editors umbrochen.

<a id="the-text"></a>

## Der Text

- **Controlled**: Übergib `value` und setze ihn erneut in `onChange`, das den gesamten neuen Text meldet. Ein `value`, den die App ändert (eine geladene Datei, die Ausgabe eines Formatters), ersetzt den Text als eine einzelne Änderung, die Undo zurücknehmen kann. Carets und Folds abseits der Änderung bleiben, wo sie sind.
- **Uncontrolled**: Übergib `defaultValue` und lies den Text aus `onChange` oder aus dem `value()` der Ref.

Zeilenumbrüche sind `\n`: `\r\n` und `\r` in einem eingehenden Text werden zu `\n`.

<a id="languages"></a>

## Sprachen

`language` benennt die Sprache über ihren Namen, einen Alias, eine Dateiendung oder einen Dateinamen, unabhängig von der Groß- und Kleinschreibung: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Es bestimmt die Hervorhebung, den Kommentar, den `mod+/` umschaltet, die Klammern, die zusammenpassen und einrücken, die Paare, die beim Tippen geschlossen werden, die Zeichen, aus denen Wörter bestehen, und die Standardeinrückung: vier Leerzeichen, zwei für Websprachen (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...), Tabs für Go und Makefiles. `tabSize` und `hardTabs` legen die Einrückung für alle Sprachen fest. Jeder andere Name ist Plain Text, es sei denn, die App hat ihn registriert ([eigene Sprachen](#your-own-languages)).

Die Sprachen: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL und Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Eigene Sprachen

Rust-Code bringt den Editoren einer App weitere Sprachen bei und hebt jede Sprache mit einem eigenen Highlighter hervor (eine tree-sitter-Grammatik, ein Parser der App). `register_language` registriert ein `EditorLanguage`: seinen Namen, Aliase, Dateiendungen und Dateinamen sowie seine Bearbeitungsregeln (Kommentare, Klammern, die beim Tippen geschlossenen Paare, Wortzeichen, Einrückung). `syntax` benennt dabei eine eingebaute Grammatik, mit der hervorgehoben wird. `register_highlighter` gibt einer Sprache, ob eingebaut oder registriert, den Highlighter der App: einen Typ, der `EditorHighlighter` implementiert, jede Änderung mitbekommt (Zeilen, Bytes und Positionen, so wie tree-sitter-Edits sie erwarten) und die Tokens jeder Zeile (`EditorToken`, oder eine tree-sitter-Capture bzw. einen TextMate-Scope über `EditorToken::from_scope`) innerhalb eines Zeitbudgets liefert, außerhalb des UI-Threads. Der Editor behält die Tokens, verschiebt sie bei Änderungen mit dem Text und fragt die sichtbaren Zeilen erneut an, genau wie beim eingebauten Highlighter. `language` findet die registrierten Sprachen zuerst, über Name, Alias, Endung oder Pfad, in Editoren und Diff-Views gleichermaßen.

Jede Engine verwaltet ihre eigenen Sprachen. Eine Rust-App registriert sie in ihrer Root, bevor sie ihre Editoren mountet; das Crate einer App registriert sie für die TSX-App im Setup ihres UI-Sets, das jede Engine, die die App ausführt, zuerst aufruft.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## Bearbeiten

Der Editor arbeitet wie Code-Editoren:

- **Mehrere Carets.** Alt-Klick (Option-Klick) fügt ein Caret hinzu, `mod+d` wählt das nächste Vorkommen der Auswahl aus, `mod+shift+l` alle Vorkommen, und die Tasten zum Hinzufügen eines Carets setzen eines in die Zeile darüber oder darunter. Tippen, Löschen, Bewegen und jeder Befehl wirken an jedem Caret; Escape geht zurück zu einem einzigen. `undoSelection` (`cmd+u`, `ctrl+u`) geht zu den Auswahlen vor der letzten Bewegung zurück.
- **Auswahlen wachsen** schrittweise mit `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`): das Wort, der Inhalt eines Strings und der String selbst, der Inhalt eines Klammerpaars und das Paar, die Zeile, der Text. `shrinkSelection` geht denselben Weg zurück. `splitSelectionIntoLines` (`shift+alt+i`) macht aus einer Auswahl über mehrere Zeilen eine Auswahl pro Zeile.
- **Einrückung.** Eine neue Zeile übernimmt die Einrückung der Zeile und fügt nach einer öffnenden Klammer eine Ebene hinzu (Pythons `:`, Rubys `do`, ...); Enter zwischen einem Klammerpaar setzt die schließende Klammer in eine eigene Zeile. Tab und Shift+Tab rücken die ausgewählten Zeilen ein und aus; Backspace in führenden Leerzeichen springt zurück zum vorherigen Einrückungsstopp. `autoIndent` schaltet dieses Verhalten ab.
- **Klammern und Anführungszeichen** schließen sich beim Tippen, umschließen eine Auswahl und werden übersprungen, wenn das schließende Zeichen erneut getippt wird (`autoClose`). Die Klammer am Caret und ihr Gegenstück werden umrandet.
- **Undo** nimmt ganze Eingabeabschnitte zurück: ein Wort, eine Löschung, einen Befehl. Eine Bewegung oder ein Klick beginnt einen neuen Schritt.
- **Folding.** Eine Zeile, auf die tiefer eingerückte Zeilen folgen, klappt diese mit dem Marker im Gutter weg: `⌄` zum Einklappen, `›` und das `⋯` nach der Zeile zum Ausklappen. Ein Caret, der in einen eingeklappten Bereich wandert, öffnet ihn ([Folding](#folding)).
- **Zeigereingaben.** Mit einem Zeiger setzt ein Klick das Caret, ein Doppelklick wählt ein Wort, ein Dreifachklick eine Zeile, Shift-Klick erweitert die Auswahl, und ein Ziehen wählt nach der Einheit, die der Klick ausgewählt hat. Ein Ziehen mit Alt+Shift (Option+Shift; unter Linux auch Control+Alt) wählt einen Block: eine Auswahl pro Zeile zwischen denselben Spalten, die über das Ende kurzer Zeilen hinaus fortgesetzt werden. Auf Touchscreens setzt ein Tippen das Caret, ein doppeltes Tippen oder langes Drücken wählt das Wort unter dem Finger, und Griffe an den Enden dieser Auswahl verschieben jedes Ende, während ein Finger sie zieht (der Text um sie herum scrollt weiterhin).
- **Zwischenablage.** Kopieren und Ausschneiden ohne Auswahl nehmen die ganzen Zeilen der Carets, und diese werden als ganze Zeilen oberhalb der Zeile des Carets wieder eingefügt.

`readOnly` belässt den Text, wie er ist, wobei er weiterhin auswählbar, durchsuchbar und kopierbar bleibt.

<a id="keys"></a>

## Tasten

Die Tasten des Editors wirken, solange er den Fokus hat; andere Eingabefelder behalten ihre eigenen. `mod` ist Command unter macOS und iOS und sonst Control (Tastenanschläge von `keymap`).

| Tasten (macOS) | Tasten (Windows, Linux) | Befehl |
|---|---|---|
| Pfeiltasten, mit Shift zum Auswählen | Pfeiltasten, mit Shift zum Auswählen | Nach Zeichen und Zeile bewegen |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Nach Wort bewegen |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | Erstes nicht leeres Zeichen der Zeile (dann ihr Anfang) / Ende der Zeile |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | Anfang / Ende des Textes |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Eine Seite nach oben / unten |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Wort links / rechts löschen |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Bis zum Zeilenanfang / Zeilenende löschen |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Rückgängig / Wiederholen |
| `cmd+a` | `ctrl+a` | Alles auswählen |
| `cmd+l` | `ctrl+l` | Zeile auswählen (erneut: auch die nächste) |
| `cmd+d` | `ctrl+d` | Nächstes Vorkommen auswählen |
| `cmd+shift+l` | `ctrl+shift+l` | Jedes Vorkommen auswählen |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Caret darüber / darunter hinzufügen |
| `escape` | `escape` | Zurück zu einer Auswahl |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Zeilen nach oben / unten verschieben |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Zeilen nach oben / unten duplizieren |
| `cmd+shift+k` | `ctrl+shift+k` | Zeilen löschen |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Neue Zeile darunter / darüber |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Einrücken / Ausrücken |
| `cmd+/` | `ctrl+/` | Zeilenkommentar umschalten |
| `cmd+shift+\` | `ctrl+shift+\` | Zur passenden Klammer springen |
| `ctrl+j` | `ctrl+j` | Zeilen verbinden |
| `ctrl+t` | | Zeichen um das Caret vertauschen |
| `ctrl+alt+left` / `ctrl+alt+right`, mit Shift zum Auswählen | | Nach Wortteil bewegen (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Blockkommentar umschalten |
| `shift+alt+i` | `shift+alt+i` | Auswahl in Zeilen aufteilen |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Auswahl erweitern / verkleinern |
| `cmd+u` | `ctrl+u` | Zurück zu den vorherigen Auswahlen |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Nächsten / vorherigen Treffer suchen |
| `cmd+e` | | Auswahl suchen (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Zeile des Carets einklappen / ausklappen |
| `f12` | `f12` | Zur Definition am Caret springen (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Code Actions an der Auswahl (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Kopieren / Ausschneiden / Einfügen |

macOS und iOS haben zusätzlich die Texttasten von Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` bewegen, `ctrl+h` / `ctrl+d` löschen.

Die Befehle ohne Standardtasten und die eigenen Befehle der App verwenden die Tasten, die die App mit [`keymap`](../modules/nsh.md#keymap) bindet, und werden über das `run` der Ref ausgeführt:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## Suchen und Ersetzen

`search` ist das, was gefunden werden soll: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. Seine Treffer werden hervorgehoben, der Treffer, auf dem die Auswahl steht, stärker. `onSearchChange` meldet `{ result }`, ein `{ count, current, error }`: wie viele Treffer es gibt, auf welchem die Auswahl steht (ab 0) und warum ein regulärer Ausdruck ungültig ist. `findNext` und `findPrevious` wählen den nächsten und den vorherigen Treffer aus und springen am Ende wieder an den Anfang; `replace(text)` ersetzt den aktuellen Treffer und wählt den nächsten aus, und `replaceAll(text)` ersetzt jeden Treffer als eine Änderung und gibt `{ count }` zurück, die Anzahl. Die Ersetzung eines regulären Ausdrucks verweist auf dessen Gruppen als `$1` und `${name}`.

`inSelection` sucht nur innerhalb dessen, was beim Einschalten ausgewählt war (die Zeilen der Carets, wenn nichts ausgewählt war): Der Bereich bleibt bestehen, solange es eingeschaltet ist, auch über Änderungen hinweg, während die Auswahl von Treffer zu Treffer wandert. `findWithSelection` (`cmd+e` unter macOS) meldet mit `onFindWithSelection` den ausgewählten Text oder das Wort am Caret, damit die Suchleiste ihn als Suchbegriff übernehmen kann.

Die Suchleiste stammt von der App selbst:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

## Diagnostics

`diagnostics` markiert die Probleme, die ein Language Server oder ein Linter meldet: eine dünne Wellenlinie unter jedem Bereich in der Farbe seiner Severity (`error`, `warning`, `info`, `hint`). Positionen sind Zeilen und UTF-16-Spalten ab 0, wie bei einem Language Server, sodass dessen Diagnostics unverändert durchgereicht werden können. Die Markierungen bleiben beim Tippen an ihrem Text, bis die App neue übergibt; die Meldungen anzuzeigen (eine Liste, eine Hover-Karte an der Zeile) ist Sache der App.

Eine Diagnostic trägt auch den Rest des `Diagnostic` eines Language Servers. Ihre `tags` zeichnen ihren Text so, wie Language Clients es tun: `unnecessary`-Code (eine unbenutzte Variable, unerreichbarer Code) wird abgeblendet und `deprecated`-Code durchgestrichen, jeweils in den Teilen `unnecessaryText` und `deprecatedText`; ein Hint mit einem Tag wird nur durch seinen Text dargestellt. `codeDescription.href` ist die Seite, die ihren Code beschreibt (den einer Lint-Regel), und `relatedInformation` listet die weiteren Stellen auf, die darüber informieren (`{ location: { uri?, range }, message }`): Der Hover übergibt beides an die App, die sie in ihrer Hover-Karte anzeigt und die Seite öffnet. Ein Language Server sendet Tags als Zahlen (`1`, `2`); der Editor übernimmt deren Namen.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

## Decorations

`decorations` stylen Bereiche, die die App wählt: semantische Hervorhebung von einem Language Server, die gerade ausgeführte Anweisung, die Zeilen, die ein Review geändert hat. `class` und `style` stylen den Text einer Decoration; `lineClass` und `lineStyle` stylen die Zeilen ihrer Bereiche, hinter dem Text. Wie Diagnostics bleiben sie bei Änderungen an ihrem Text, bis die App neue setzt.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### Markierungen im Gutter und im Overview Ruler

Das `gutter` einer Dekoration setzt eine Markierung in einen Streifen vor den Zeilennummern, neben jede Zeile, die ihr Bereich abdeckt: die Zeilen, die ein Versionskontroll-Diff hinzugefügt oder geändert hat, oder einen Breakpoint (ein leerer Bereich deckt seine Zeile ab, wie bei `lineClass`). Mit `placement: "before"` ist es eine Linie quer über den Streifen an der Grenze vor dem Anfang des Bereichs, an der Zeilen gelöscht wurden. Der Streifen ist `gutterDecorationsWidth` Punkte breit (standardmäßig 3) und bleibt bestehen, solange eine Dekoration eine Gutter-Markierung hat, damit der Text seinen Platz behält, wenn Markierungen kommen und gehen. Ein Bereich innerhalb einer Faltung markiert die Zeile der Faltung.

Das `overviewRuler` einer Dekoration setzt eine Markierung auf den Overview Ruler, den Streifen am rechten Rand des Editors, 14 Punkte breit (wie eine Bildlaufleiste; mit dem Teil `overviewRuler` lässt sich eine andere Breite einstellen), der den gesamten Text auf seine Höhe abbildet, wie bei Monaco. Eine Markierung ist mindestens 6 Punkte hoch und belegt einen `lane` des Lineals: `left`, `center` (Standard), `right` oder `full`. Das Lineal wird angezeigt, solange eine Dekoration dort eine Markierung hat.

Jede Markierung übernimmt `class` und `style` der App; ohne diese wird sie in der Vordergrundfarbe gezeichnet. Beide folgen Änderungen wie der Bereich der Dekoration; eine Änderung, die einen markierten Bereich löscht, hinterlässt an dessen Stelle einen leeren.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### Eigenes Highlighting

Das `token` einer Dekoration färbt ihren Text so, wie das eingebaute Highlighting diese Art von Token färbt (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), anstelle dessen, was der eingebaute Highlighter dort gefunden hat: Der eigene Highlighter der App (die Semantic Tokens eines Language Servers, ein eigener Parser) bildet seine Token auf diese ab und erhält die Farben des Editors in Hell und Dunkel. Die innerste Dekoration gewinnt; `class` und `style` gelten darüber. `highlighting={false}` schaltet den eingebauten Highlighter ab, sodass allein die Token der App den Text färben, während `language` weiterhin Kommentare, Klammern und Einrückung bestimmt.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

## Folding

Faltungen beginnen dort, wo Zeilen tiefer eingerückt sind als die Zeile davor. `foldRanges` gibt dem Editor stattdessen die eigenen Bereiche der App (`{ startLine, endLine }`, die Form der Folding Ranges eines Language Servers, die unverändert durchgereicht werden): Zeile `startLine` zeigt die Faltung, und die Zeilen danach bis `endLine` werden eingeklappt. Sie bleiben bei Änderungen an ihren Zeilen, bis die App neue übergibt.

Faltungen sind verschachtelt: Beim Falten eines Blocks bleiben die Faltungen darin gefaltet, sodass das Entfalten des Blocks sie so zeigt, wie sie waren. `foldRecursive` faltet einen Block und jeden Block darin, `unfoldRecursive` entfaltet sie alle, `foldLevel(n)` faltet jeden Block auf Verschachtelungsebene `n`, und `foldSelection` (oder `foldRange(range)`) faltet beliebige Zeilen, unabhängig davon, wo Faltungen beginnen. `onFoldChange` meldet nach jeder Änderung die gefalteten Bereiche, und `folds()` / `setFolds(ranges)` lesen und stellen sie wieder her, um sie mit der Datei aufzubewahren.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Breakpoints und Kontextmenüs

Ein Klick auf eine Zeilennummer meldet `onLineNumberPress({ line })`, den Ort für einen Breakpoint, den die App als Dekoration zeichnet. Die sekundäre Taste (ein Rechtsklick, auf dem Mac Control-Klick) meldet `onContextMenu({ position, x, y })`: die Position im Text unter dem Zeiger und den Punkt in der Root View, an dem die App ihr eigenes Menü öffnet. Auf Touchscreens melden es auch ein langer Druck, ein Doppeltipp, ein losgelassener Griff und ein Tipp auf die Auswahl, mit `selection`: dem Rahmen der Auswahl in der Root View (`{ x, y, width, height }`) und `x` / `y` an deren oberer Mitte, für das Bearbeitungsmenü.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## Sprachfunktionen

Vorschläge, Hover-Informationen, Gehe zu Definition und Code Actions kommen vom Language Server der App. Der Editor zeichnet die Vervollständigungsliste, die Inline-Vervollständigung und den Definitionslink selbst, samt ihren Tastenkürzeln; für den Rest gibt er der App die Zeitpunkte und die Orte, und die App zeichnet ihre Popups (ein [`Overlay`](./overlay.md), verankert an einem `pageBounds`).

### Completion

Mit `completion` fragt der Editor die App nach Vorschlägen und zeigt sie als Liste unter dem Wort an, das gerade getippt wird (darüber, wenn es nahe am unteren Fensterrand ist):

- Das Tippen eines Buchstabens, einer Ziffer oder von `_` am Ende eines Wortes fragt mit `onCompletionRequest(event)` an, Trigger `"typing"`: `event` hat sein `id`, das `offset` und `position` des Carets, die `query` (das bisher getippte Wort) und den Offset `queryStart`, an dem es beginnt. Jedes von `completionTriggerCharacters` (`["."]`, `["::", "<"]`) fragt danach mit leerer Query an, Trigger `"character"` (und der `character`), und `showCompletions()` oder `run("showCompletions")` fragt am Caret an, Trigger `"invoked"`.
- Die App antwortet mit `presentCompletions(event.id, items)`. Jeder Eintrag hat die Form eines `CompletionItem` des Language Servers: `label` und optional `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` und `range`. Die Antwort auf die letzte Anfrage wird angezeigt; eine frühere oder eine für ein Wort, das der Caret verlassen hat, wird beiseitegelegt.
- Weiteres Tippen filtert die Liste an Ort und Stelle: Die Query passt auf das `filterText` jedes Eintrags (sonst auf sein Label) als Buchstaben in Reihenfolge, ohne Beachtung der Groß- und Kleinschreibung, zuerst Wörter, die mit der Query beginnen, dann die engsten Treffer, dann nach `sortText`. Die passenden Buchstaben werden hervorgehoben. Mit `incomplete: true` (`presentCompletions(id, items, true)`) fragt der Editor beim Weitertippen erneut an.
- Pfeil nach oben und unten (und Control+P / Control+N) bewegen sich durch die Liste, Bild auf und Bild ab seitenweise, Enter und Tab übernehmen, Escape schließt sie. Der Zeiger markiert einen Eintrag, und ein Klick (auf Touchscreens ein Tipp) übernimmt ihn. Das `documentation` des gewählten Eintrags wird neben der Liste angezeigt.
- Das Übernehmen ersetzt das `range` des Eintrags (sonst die Query) durch sein `insertText` (sonst sein Label), als ein Schritt, den Undo zurücknimmt, am Caret und an jedem anderen Caret mit demselben Text davor, und meldet `onCompletionAccept({ item })`.
- Die Liste schließt sich, wenn der Caret das Wort verlässt, bei einem Leerzeichen oder anderer Interpunktion, wenn der Editor den Fokus verliert und wenn der Caret aus dem sichtbaren Bereich scrollt.

Eine Tipppause (`inlineCompletionDelay`, standardmäßig 300 ms) ohne sichtbare Liste fragt eine Inline-Vervollständigung an: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` zeigt `text` am Caret in gedämpfter Farbe an, Tab fügt sie ein, und Escape, eine Änderung oder eine Bewegung löscht sie.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Hovers und Klicks

- `onHover(event)`: Die Maus verweilt über einem Zeichen, ohne dass eine Taste gedrückt ist (Desktops und Web; ein Ziehen markiert Text). `event` hat sein `position`, seinen UTF-16-`offset`, den `range` seines Wortes, die `pagePosition` des Zeigers, die `pageBounds` des Wortes, die gehaltenen `modifiers` und die `diagnostics` dort, deren Meldungen die App anzeigt. Der Wechsel zu einem anderen Wort meldet sofort den nächsten Hover.
- `onHoverEnd()`: Die Maus hat das Wort oder den Editor verlassen, oder der Text hat sich geändert oder ist darunter gescrollt.
- `onTextPress(event)`: Ein Zeichen wurde gedrückt, nachdem der Editor seinen Caret gesetzt hat: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` und `rangeBounds(range)`: wo der Caret und ein Bereich sind, `{ bounds, pageBounds }` (im Editor und in der Root View): Dort öffnet sich ein Popup der App.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Gehe zu Definition und Code Actions

Das Halten von Mod (Command unter macOS und iOS, sonst Control) macht die Wörter unter der Maus zu Links, wie in Code-Editoren:

- Wird Mod über einem Wort gehalten (gedrückt, während die Maus dort verweilt, oder die Maus wurde mit gehaltener Taste dorthin bewegt), fragt der Editor mit `onDefinitionRequest(event)` an, Trigger `"hover"`: `event` hat sein `id`, den `position` und `offset` des Zeichens und den `range` des Wortes. Antworten Sie mit `presentDefinitionLink(event.id, range)`, wenn der Language Server eine Definition findet: Der Bereich wird unterstrichen (der Teil `definitionLink`), und der Zeiger wird darüber zur Hand. Der Link verschwindet, wenn Mod losgelassen wird, die Maus ihn verlässt oder der Text sich ändert oder scrollt, oder mit `hideDefinitionLink()`. Die Antwort auf die letzte Anfrage wird angezeigt; eine frühere wird beiseitegelegt.
- Ein Mod-Klick auf ein Wort fragt mit Trigger `"press"` an; auf dem Link bleibt der Caret, wo er ist. F12 (`goToDefinition`, `run("goToDefinition")`) fragt nach dem Wort am Caret, Trigger `"key"`. Die App springt zur Definition: `revealPosition` und `setSelections` für eine im selben Text, ihre eigene Navigation für eine andere Datei.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) meldet `onCodeActionRequest({ range, position, bounds })`: die primäre Auswahl (Anfang zuerst), den Caret und seinen Rahmen. Die App fragt ihren Language Server nach Aktionen, zeigt ihr Menü bei `bounds.pageBounds` (ein [`Menu`](./menu.md) oder ein `Overlay`) und wendet die Änderungen der gewählten Aktion mit `edit(edits)` an.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## Größe und Scrollen

Mit `minRows` und / oder `maxRows` wächst der Editor mit seinem Text: Er ist so hoch wie seine Zeilen, mindestens `minRows` davon, und ab `maxRows` scrollt sein Text, wie bei einer Meldungsbox oder einer Zelle eines Notebooks. Andernfalls legt die App seine Größe fest, und `scrollBeyondLastLine` lässt den Text über seine letzte Zeile hinaus scrollen: bis zu einem Bildschirm (`true`, der Standard), gar nicht (`false`) oder um eine Anzahl von Zeilen. Wenn sich der Caret bewegt, bleiben `cursorSurroundingLines` Zeilen um ihn herum sichtbar. Das Ziehen einer Auswahl über die Ränder des Editors hinaus scrollt weiter, umso schneller, je weiter der Zeiger hinausgeht.

`showWhitespaces` zeigt für jedes Leerzeichen ein `·` und für jeden Tabulator ein `→` (der Teil `whitespace`), und `rulers` zeichnet in jeder seiner Spalten eine Linie (der Teil `ruler`), als Hilfslinien für die Länge einer Zeile.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## Methoden

`ref={editor}` liefert die Methoden des Editors (`EditorRef`), für die Schaltflächen, Menüs und Tastenkürzel der App. Methoden, die einen Wert zurückgeben (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...), geben in JS ein `Promise` davon zurück, also `await` Sie sie: `const text = await editor.value()`. Eine Methode, der eine Zeile hinter dem Text übergeben wird (`fold`, `scrollToLine`, `goToLine`, ...), ändert nichts und protokolliert eine Warnung mit dem Namen der Methode und der Zeile.

| Methode | Beschreibung |
|---|---|
| `focus()`, `blur()` | Übernimmt den Fokus oder gibt ihn ab. |
| `value()` | `Promise<string>`: der Text. |
| `setValue(value)` | Ersetzt den Text, als Änderung, die Undo zurücknimmt. |
| `insert(text)` | Tippt `text` an jeder Auswahl, unverändert (Klammern werden nicht geschlossen). |
| `edit(edits)` | Wendet `{ range, text }` Ersetzungen an (Bereiche des aktuellen Textes; eine, die sich mit einer früheren überschneidet, wird übersprungen) als ein Schritt, den Undo zurücknimmt; die Auswahlen bewegen sich mit dem Text um sie herum. Code Actions und Formatierungsänderungen gehören hierher. |
| `selections()` | `Promise<EditorSelection[]>`: jede Auswahl, `{ anchor, head }`, die primäre (neueste) zuletzt. |
| `setSelections(selections)` | Setzt die Auswahlen (die letzte ist primär) und scrollt die primäre in den sichtbaren Bereich. |
| `run(command)` | Führt einen Befehl aus, wie es seine Tastenkürzel täten ([Commands](#commands)). |
| `replace(text)` | Ersetzt den aktuellen Treffer und wählt den nächsten aus. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: ersetzt jeden Treffer als eine Änderung; `{ count }`, wie viele. |
| `fold(line)`, `unfold(line)` | Faltet die Zeilen unter Zeile `line` (ab 0) oder entfaltet sie. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Faltet die Faltung in Zeile `line` und jede Faltung darin oder entfaltet sie alle. |
| `foldLevel(level)` | Faltet jede Faltung auf Verschachtelungsebene `level` (1: die äußerste). |
| `foldRange(range)` | Faltet die Zeilen von `range` (`{ startLine, endLine }`), unabhängig davon, wo Faltungen beginnen. |
| `folds()` | `Promise<EditorFoldRange[]>`: die gefalteten Bereiche, einschließlich verschachtelter. |
| `setFolds(folds)` | Faltet genau `folds`. |
| `scrollToLine(line)` | Scrollt Zeile `line` in den sichtbaren Bereich und entfaltet, was sie verdeckt. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: ob es eine Änderung gibt, die zurückgenommen oder wiederholt werden kann. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: der Rahmen des primären Carets, `{ bounds, pageBounds }`, im Editor (mit angewendetem Scrollen) und in der Root View; `null`, bevor der Editor ein Layout erhalten hat. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: die Rahmen von `range`, einer pro Zeile, die er abdeckt. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: wie weit der Text gescrollt ist; scrollt ihn auf `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: der Text, den der Viewport zeigt, vom Anfang seiner ersten Zeile bis zum Ende seiner letzten. |
| `selectedText()` | `Promise<string>`: der Text der primären Auswahl. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: zwischen UTF-16-Offsets von `value()` und Positionen. |
| `revealPosition(position, center)` | Scrollt `position` in den sichtbaren Bereich und entfaltet, was ihn verdeckt; mit `center` in die Mitte. |
| `goToLine(line)` | Setzt den Caret an den Anfang von Zeile `line` (ab 0) und scrollt ihn in die Mitte. |
| `showCompletions()` | Fragt am Caret nach Vervollständigungen, das Wort davor ist die Query ([Completion](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Beantwortet Vervollständigungsanfrage `id`: Die Liste zeigt `items`, gefiltert nach dem, was seitdem getippt wurde; mit `incomplete` fragt weiteres Tippen erneut an. Keine Einträge schließen die Liste. |
| `hideCompletions()` | Schließt die Vervollständigungsliste. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Beantwortet Inline-Vervollständigungsanfrage `id` mit `text`, am Caret angezeigt; löscht sie. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Beantwortet Definitionsanfrage `id` (Trigger `"hover"`): `range` wird als Link unterstrichen ([Go to definition](#go-to-definition-and-code-actions)); blendet ihn aus. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### Befehle

`run` nimmt die Befehle des Editors über ihren Namen entgegen (`EditorCommand`):

| Befehle | Funktion |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Bewegen die Carets. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Erweitern die Auswahlen. |
| `moveToMatchingBracket` | Springt zur Klammer, die zu der am Caret passt. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Auswählen. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Bewegen oder erweitern um einen Wortteil (camelCase-Abschnitte, snake_case-Teile). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Bewegen oder erweitern bis zur Leerzeile vor oder nach dem Absatz. |
| `expandSelection`, `shrinkSelection` | Vergrößern die Auswahlen um eine Einheit oder verkleinern sie wieder. |
| `undoSelection`, `redoSelection` | Zurück zu den Auswahlen vor der letzten Bewegung oder wieder vor. |
| `splitSelectionIntoLines` | Eine Auswahl pro Zeile jeder Auswahl. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Fügen ein Caret hinzu; zurück zu einer einzelnen Auswahl. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Löschen. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Zeilen, Einrückung und Kommentare. |
| `sortLinesAscending`, `sortLinesDescending` | Sortieren die ausgewählten Zeilen (bei einem bloßen Caret jede Zeile). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Ändern die Groß- und Kleinschreibung der Auswahlen (bei einem Caret: dessen Wort). |
| `trimTrailingWhitespace` | Entfernt die Leerzeichen am Ende jeder Zeile. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Umordnen. |
| `undo`, `redo` | Rückgängig machen und wiederholen. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Falten die Zeile am Caret oder alles. |
| `foldRecursive`, `unfoldRecursive` | Falten den Bereich am Caret samt allen darin liegenden Bereichen oder klappen sie wieder auf. |
| `foldSelection` | Faltet die Zeilen jeder Auswahl, die sich über mehrere Zeilen erstreckt. |
| `findNext`, `findPrevious` | Wählen den nächsten oder vorherigen Treffer von `search` aus. |
| `findWithSelection` | Meldet den ausgewählten Text für die Suchleiste (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | Die Zwischenablage. |
| `showCompletions` | Fragt Vervollständigungen am Caret an ([Vervollständigung](#completion)). |
| `goToDefinition` | Fragt die Definition des Worts am Caret an (`onDefinitionRequest`, Auslöser `"key"`). |
| `showCodeActions` | Fragt die Code-Aktionen an der Auswahl an (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Die Teile gestalten

`class` und `style` gestalten die Box des Editors. `classes` nimmt Tailwind-Klassen pro Teil entgegen und `styles` Inline-Styles pro Teil; die Klassen eines Teils stehen nach dessen eigenen Standardstilen und setzen sich daher durch, und seine `styles` setzen sich gegenüber seinen Klassen durch. Die Schrift wird mit `fontFamily`, `fontSize` und `lineHeight` festgelegt; der Editor misst seinen Text damit.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| Teil | Was es ist | Standard |
|---|---|---|
| `gutter` | Die Spalte mit Zeilennummern und Falt-Markierungen | 12pt vor den Nummern, 4pt nach den Markierungen |
| `lineNumber` | Jede Zeilennummer | Rechtsbündig, `muted-foreground` |
| `activeLineNumber` | Die Nummern der Zeilen mit einem Caret, nach `lineNumber` | `foreground` |
| `foldMarker` | Die Markierung einer Zeile, in der ein Faltbereich beginnt | `⌄`, `›` gefaltet, `muted-foreground` |
| `overviewRuler` | Das Übersichtslineal am rechten Rand, solange dort eine Dekoration eine Markierung hat | keine |
| `content` | Der Textbereich neben dem Gutter | 4pt vor dem Text |
| `line` | Jede Anzeigezeile | |
| `activeLine` | Hinter den Anzeigezeilen der Zeilen mit einem Caret, unter den Scroll-Indikatoren | `muted`, dezent |
| `selection` | Hinter ausgewähltem Text | Ein Farbton von `primary` |
| `caret` | Die Carets | 2pt breit, `foreground`, blinkend |
| `composition` | Der Text, den eine Eingabemethode gerade zusammensetzt | Unterstrichen |
| `searchMatch` | Die Treffer von `search` | Durchscheinendes Bernstein |
| `currentSearchMatch` | Der Treffer, auf dem die Auswahl liegt, nach `searchMatch` | Kräftigeres Bernstein |
| `matchingBracket` | Die Klammer am Caret und ihr Gegenstück | Ein 1pt-Rahmen |
| `indentGuide` | Eine Führungslinie pro Einrückungsebene | Eine 1pt-Linie in `border` |
| `foldPlaceholder` | Was eine gefaltete Zeile nach ihrem Text anzeigt | ` ⋯ `, `muted-foreground` |
| `placeholder` | Wird angezeigt, solange der Text leer ist | `muted-foreground` |
| `diagnosticError` | Die Linie unter einem Fehler | `destructive` |
| `diagnosticWarning` | Die Linie unter einer Warnung | Bernstein |
| `diagnosticInfo` | Die Linie unter einer Information | Blau |
| `diagnosticHint` | Die Linie unter einem Hinweis | `muted-foreground` |
| `unnecessaryText` | Der Text einer `unnecessary`-Diagnose | `muted-foreground` |
| `deprecatedText` | Der Text einer `deprecated`-Diagnose | Durchgestrichen |
| `whitespace` | Die Markierungen für Leerzeichen und Tabs (`showWhitespaces`) | `·` und `→`, `muted-foreground` bei 60 % |
| `ruler` | Die Linien von `rulers` | Eine 1-Punkt-Linie in `border` |
| `selectionHandle` | Die Knöpfe der Griffe an den Enden einer Touch-Auswahl | Ein 10pt-Punkt in `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | Der Knopf des Anfangs (über dessen Zeile) und der des Endes (darunter), nach `selectionHandle` | |
| `completionMenu` | Die Box der Vervollständigungsliste | `popover`, ein 1pt-`border`, abgerundet, ein Schatten |
| `completionItem` | Jeder Eintrag der Liste | Die Höhe einer Zeile, 8pt Innenabstand |
| `selectedCompletionItem` | Der ausgewählte Eintrag, nach `completionItem` | `accent` |
| `completionMatch` | Die Buchstaben einer Bezeichnung, auf die die Suchanfrage passte | Halbfett, `primary` |
| `completionDetail` | Das Detail eines Eintrags, nach seiner Bezeichnung | Rechtsbündig, `muted-foreground` |
| `completionKind` | Die Art eines Eintrags, vor seiner Bezeichnung | Ein Kurzname (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | Die Dokumentation des ausgewählten Eintrags, neben der Liste | Wie `completionMenu`, höchstens 320pt breit |
| `inlineCompletion` | Die Inline-Vervollständigung am Caret | `muted-foreground` |
| `definitionLink` | Die Unterstreichung des Definitionslinks | Eine 1pt-Linie in `primary` unter dem Text |

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Der Text, von der App gesteuert (aus `onChange` erneut setzen). |
| `defaultValue` | `.default_value(..)` | `string` | | Der Anfangstext, wenn der Editor seinen Text selbst verwaltet. |
| `language` | `.language(..)` | `string` | Klartext | Name, Alias, Erweiterung oder Dateiname einer Sprache ([Sprachen](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Wird angezeigt, solange der Text leer ist. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | Der Text kann ausgewählt und kopiert, aber nicht geändert werden. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Erhält den Fokus, sobald er erscheint. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Die Zeilennummern des Gutters. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Lange Zeilen werden an der Breite des Editors umbrochen. |
| `tabSize` | `.tab_size(..)` | `number` | die der Sprache | Die Spalten eines Tabs und einer Einrückungsebene. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | die der Sprache | Rückt mit Tabs ein. |
| `folding` | `.folding(..)` | `boolean` | `true` | Eingerückte Zeilen lassen sich mit den Markierungen des Gutters falten. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | nach Einrückung | Wo Faltbereiche beginnen, von der App festgelegt ([Falten](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | Die integrierte Syntaxhervorhebung ([Eigene Hervorhebung](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Klammern und Anführungszeichen werden beim Tippen geschlossen. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Eine neue Zeile behält die Einrückung und rückt nach einer öffnenden Klammer ein. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | Die Anzeigezeilen der Zeilen mit einem Caret werden hervorgehoben. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | Die Einrückungslinien. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | Der Text scrollt über die letzte Zeile hinaus: bis zu einem Bildschirm (`true`), gar nicht (`false`) oder um so viele Anzeigezeilen. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` des Themes | Die Schrift, in der der Text gezeichnet und gemessen wird. |
| `fontSize` | `.font_size(..)` | `number` | `13` | Die Schriftgröße in Punkt. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | Die Höhe einer Anzeigezeile in Punkt. |
| `search` | `.search(..)` | `EditorSearch` | | Wonach gesucht wird ([Suchen und Ersetzen](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Zu markierende Probleme ([Diagnose](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Bereiche, die die App gestaltet ([Dekorationen](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | Die Breite des Streifens im Gutter für die Markierungen der Dekorationen, in Punkt. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Tailwind-Klassen pro Teil. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Inline-Styles pro Teil, vorrangig vor den Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Wie Screenreader den Editor bezeichnen. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Leerzeichen und Tabs werden als `·` und `→` angezeigt. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Spalten, an denen eine senkrechte Linie gezeichnet wird. |
| `minRows` | `.min_rows(..)` | `number` | | Der Editor wächst ab dieser Anzahl Anzeigezeilen mit seinem Text ([Größe und Scrollen](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | Der Editor wächst mit seinem Text bis zu dieser Anzahl Anzeigezeilen und scrollt dann. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | Die Anzeigezeilen, die über und unter dem Caret sichtbar bleiben. |
| `completion` | `.completion(..)` | `boolean` | `false` | Der Editor fragt Vorschläge an und zeigt sie als Liste an ([Vervollständigung](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | Was beim Tippen sonst noch Vervollständigungen anfordert. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Millisekunden Tipppause, bevor eine Inline-Vervollständigung angefragt wird. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | | Die Box des Editors. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | Der Text hat sich geändert: `{ value }`, der gesamte neue Text. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | Die Auswahlen haben sich geändert: `{ selections }`, alle, die primäre zuletzt. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | Der Editor hat den Fokus erhalten bzw. verloren. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | Die Treffer der Suche haben sich geändert: `{ result }`, ein `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | Eine Zeilennummer wurde gedrückt: `{ line }`, die Zeile, ab 0 gezählt. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | Die sekundäre Maustaste wurde über dem Text gedrückt, oder eine Berührung hat Text ausgewählt: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | Die Maus verweilt über einem Zeichen ([Sprachfunktionen](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | Das Hovern ist beendet. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | Ein Zeichen wurde gedrückt: mit seinem Wort, den Modifikatoren und den Klicks. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` wurde ausgeführt: `{ query }`, der Text für die Suchanfrage der Suchleiste. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Die gefalteten Bereiche haben sich geändert: `{ folds }`, alle, einschließlich verschachtelter. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | Der Editor fragt Vervollständigungen an: `{ id, offset, position, query, queryStart, trigger, character? }` ([Vervollständigung](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Ein Eintrag wurde übernommen und eingefügt: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | Das Tippen pausierte: `{ id, offset, position }`, für eine Inline-Vervollständigung. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | Der Editor fragt eine Definition an: `{ id, position, offset, range, trigger }` ([Zu Definition springen](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | Der Nutzer hat Code-Aktionen angefordert: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Barrierefreiheit

Screenreader bezeichnen den Editor mit seinem `accessibilityLabel`; sein Fokus entspricht dem eines Texteingabefelds, sodass die Textdienste der Plattform (Eingabemethoden, Diktat, Bildschirmtastaturen) darin funktionieren.

<a id="related"></a>

## Verwandte Themen

- [TextView](./text-view.md): Dokumente aus Markdown und HTML, deren Codeblöcke die Syntaxfarben des Editors teilen.
- [DiffView](./diff-view.md): Die Änderungen zwischen zwei Texten, in den Syntaxfarben des Editors.
- [Input](./input.md): Einzeilige und mehrzeilige Textfelder mit der plattformeigenen Bearbeitung.
- [`keymap`](../modules/nsh.md#keymap): Die Tastenbelegungen der App für die Befehle des Editors.
- [`nsh/base`](../modules/nsh-base.md): Die anderen Basiskomponenten.
