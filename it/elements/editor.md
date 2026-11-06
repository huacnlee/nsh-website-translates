---
title: "Editor"
description: "Il componente Editor: un editor di codice con evidenziazione della sintassi, numeri di riga, più cursori, riduzione del codice (folding), a capo automatico (soft wrap), trova e sostituisci, diagnostica e decorazioni, e le scorciatoie da tastiera degli editor di codice."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# Editor

`Editor` è un editor di codice: evidenziazione della sintassi per più di cinquanta linguaggi, numeri di riga, più cursori, folding,
a capo automatico, trova e sostituisci, diagnostica e decorazioni, con i tasti degli editor di codice (spostare e duplicare righe,
commenti, indentazione, parentesi e virgolette che si chiudono mentre si digita). Gestisce file di qualsiasi lunghezza: vengono create solo le righe
in vista, e l'evidenziazione segue ogni modifica riga per riga, quindi un file lungo scorre e si digita come uno
corto. La digitazione passa dall'input della piattaforma, quindi i metodi di input (pinyin, kana, tasti morti) e le tastiere
virtuali funzionano come in qualsiasi campo di testo.

L'editor possiede il comportamento e ha un aspetto proprio costruito con i token del tema: il `font-mono` del tema a
13pt in righe da 20pt, i numeri di riga in `muted-foreground`, una tenue fascia `muted` dietro le righe con un cursore, le selezioni
in una tinta di `primary`, le guide di indentazione in `border` e i colori di sintassi integrati che usano i blocchi di codice di [`TextView`](./text-view.md),
in chiaro e in scuro. Ogni parte prende gli stili dell'app al posto di questi valori predefiniti (`classes` e `styles`).
Rust ne crea uno con `nsh_base::editor()`, TSX con `<Editor>` da `nsh/base`.

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

L'editor riempie il riquadro che l'app gli assegna (`flex-1`, un'altezza) e scorre il proprio testo al suo interno: in verticale sempre,
in orizzontale quando le righe sono più lunghe del riquadro, oppure per nulla con `softWrap`, dove le righe lunghe vanno a capo
alla larghezza dell'editor.

<a id="the-text"></a>

## Il testo

- **Controllato**: passa `value` e impostalo di nuovo in `onChange`, che riporta l'intero nuovo testo. Un `value` che l'app
  modifica (un file caricato, l'output di un formatter) sostituisce il testo come un'unica modifica che l'annullamento può revocare, e i cursori e
  i fold lontani da ciò che è cambiato restano dove sono.
- **Non controllato**: passa `defaultValue` e leggi il testo da `onChange` o da `value()` del ref.

Gli a capo sono `\n`: `\r\n` e `\r` in un testo in ingresso diventano `\n`.

<a id="languages"></a>

## Linguaggi

`language` indica il linguaggio tramite nome, alias, estensione o nome di file, con qualsiasi combinazione di maiuscole e minuscole: `"rust"`, `"rs"`,
`"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Determina l'evidenziazione, il commento che
`mod+/` attiva o disattiva, le parentesi che si abbinano e fanno indentare, le coppie che la digitazione chiude, i caratteri di cui sono fatte le parole e
l'indentazione predefinita: quattro spazi, due per i linguaggi web (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...), tabulazioni
per Go e i Makefile. `tabSize` e `hardTabs` impostano l'indentazione per ogni linguaggio. Qualsiasi altro nome è testo semplice,
a meno che l'app non lo abbia registrato ([linguaggi propri](#your-own-languages)).

I linguaggi: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C,
Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown,
YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R,
Julia, Nix, Terraform, Protocol Buffers, GraphQL e Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Linguaggi propri

Il codice Rust insegna più linguaggi agli editor di un'app e evidenzia qualsiasi linguaggio con un evidenziatore dedicato (una
grammatica tree-sitter, un parser dell'app). `register_language` registra un `EditorLanguage`: il suo nome, gli alias,
le estensioni e i nomi di file, e le sue regole di editing (commenti, parentesi, le coppie che la digitazione chiude, caratteri delle parole,
indentazione), con `syntax` che indica una grammatica integrata con cui evidenziarlo. `register_highlighter` assegna a un linguaggio,
integrato o registrato, l'evidenziatore dell'app: un tipo che implementa `EditorHighlighter`, che riceve ogni modifica (righe,
byte e posizioni, come le prendono le modifiche di tree-sitter) e restituisce i token di ogni riga (`EditorToken`, oppure una
capture di tree-sitter o uno scope TextMate tramite `EditorToken::from_scope`) entro un budget di tempo, fuori dal thread della UI. L'editor conserva
i token, li sposta insieme al testo mentre viene modificato e richiede di nuovo le righe in vista, come fa con l'evidenziatore
integrato. `language` trova per primi i linguaggi registrati, per nome, alias, estensione o percorso, sia negli editor sia nelle
viste diff.

Ogni motore mantiene i propri linguaggi. Un'app Rust li registra nella sua radice prima di montare i propri editor; il crate di un'app
li registra per l'app TSX nel setup del suo insieme di UI, che ogni motore che esegue l'app chiama per primo.

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

## Modifica

L'editor funziona come gli editor di codice:

- **Più cursori.** Alt-click (Option-click) aggiunge un cursore, `mod+d` seleziona la successiva occorrenza della selezione,
  `mod+shift+l` tutte, e i tasti di aggiunta cursore ne aggiungono uno sulla riga sopra o sotto. Digitare, eliminare, spostarsi e
  ogni comando agiscono su ciascuno; Escape torna a uno solo. `undoSelection` (`cmd+u`, `ctrl+u`) torna alle
  selezioni precedenti l'ultimo spostamento.
- **Le selezioni si estendono** per unità con `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`): la parola, il contenuto di una
  stringa e la stringa, il contenuto di una coppia di parentesi e la coppia, la riga, il testo; `shrinkSelection`
  torna indietro allo stesso modo. `splitSelectionIntoLines` (`shift+alt+i`) trasforma una selezione su più righe in una
  selezione per riga.
- **Indentazione.** Una nuova riga mantiene l'indentazione della riga e aggiunge un livello dopo una parentesi di apertura (`:` di Python,
  `do` di Ruby, ...); Invio tra una coppia di parentesi mette quella di chiusura su una riga propria. Tab e Shift+Tab indentano
  e deindentano le righe selezionate; Backspace negli spazi iniziali torna al precedente punto di indentazione. `autoIndent` disattiva
  questo comportamento.
- **Parentesi e virgolette** si chiudono mentre si digita, racchiudono una selezione e scavalcano quella di chiusura quando viene digitata
  di nuovo (`autoClose`). La parentesi al cursore e la sua compagna sono cerchiate.
- **Annulla** revoca intere sequenze di digitazione: una parola, un'eliminazione, un comando. Uno spostamento o una pressione avvia un nuovo passo.
- **Folding.** Una riga seguita da righe più indentate le nasconde con il marcatore nella gutter: `⌄` per ripiegare,
  `›` e il `⋯` dopo la riga per espandere. Un cursore che si sposta in un fold lo apre ([Folding](#folding)).
- **Pressioni.** Con un puntatore, un clic posiziona il cursore, un doppio clic seleziona una parola, un triplo clic una riga,
  Shift-click estende la selezione e un trascinamento seleziona in base a ciò che ha selezionato il clic. Un trascinamento Alt+Shift
  (Option+Shift; anche Control+Alt su Linux) seleziona un blocco: una selezione per riga, tra le stesse colonne, che
  proseguono oltre la fine delle righe corte. Sugli schermi touch un tocco posiziona il cursore, un doppio tocco o una pressione prolungata seleziona
  la parola sotto il dito, e le maniglie alle estremità di quella selezione spostano ciascun estremo mentre un dito le trascina (il
  testo intorno continua a scorrere).
- **Appunti.** Copia e taglia senza selezione prendono le righe intere dei cursori, e queste vengono incollate
  come righe intere sopra la riga del cursore.

`readOnly` mantiene il testo così com'è mentre è ancora selezionato, cercato e copiato.

<a id="keys"></a>

## Tasti

I tasti dell'editor funzionano finché ha il focus; gli altri input mantengono i propri. `mod` è Command su macOS e iOS e Control
altrove (le sequenze di tasti di `keymap`).

| Tasti (macOS) | Tasti (Windows, Linux) | Comando |
|---|---|---|
| Frecce, con Shift per selezionare | Frecce, con Shift per selezionare | Sposta per carattere e riga |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Sposta per parola |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | Il primo carattere non vuoto della riga (poi il suo inizio) / la fine della riga |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | L'inizio / la fine del testo |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Una pagina su / giù |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Elimina una parola a sinistra / a destra |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Elimina fino all'inizio / alla fine della riga |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Annulla / ripeti |
| `cmd+a` | `ctrl+a` | Seleziona tutto |
| `cmd+l` | `ctrl+l` | Seleziona la riga (di nuovo: anche la successiva) |
| `cmd+d` | `ctrl+d` | Seleziona la successiva occorrenza |
| `cmd+shift+l` | `ctrl+shift+l` | Seleziona ogni occorrenza |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Aggiungi un cursore sopra / sotto |
| `escape` | `escape` | Torna a una sola selezione |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Sposta le righe su / giù |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Duplica le righe in su / in giù |
| `cmd+shift+k` | `ctrl+shift+k` | Elimina le righe |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Una nuova riga sotto / sopra |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Indenta / deindenta |
| `cmd+/` | `ctrl+/` | Attiva o disattiva il commento di riga |
| `cmd+shift+\` | `ctrl+shift+\` | Vai alla parentesi corrispondente |
| `ctrl+j` | `ctrl+j` | Unisci le righe |
| `ctrl+t` | | Scambia i caratteri attorno al cursore |
| `ctrl+alt+left` / `ctrl+alt+right`, con Shift per selezionare | | Sposta per parte di parola (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Attiva o disattiva il commento a blocco |
| `shift+alt+i` | `shift+alt+i` | Dividi la selezione in righe |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Espandi / riduci la selezione |
| `cmd+u` | `ctrl+u` | Torna alle selezioni precedenti |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Trova la corrispondenza successiva / precedente |
| `cmd+e` | | Trova la selezione (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Ripiega / espandi la riga del cursore |
| `f12` | `f12` | Vai alla definizione al cursore (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Azioni di codice sulla selezione (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Copia / taglia / incolla |

macOS e iOS hanno anche i tasti di testo di Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` per spostarsi, `ctrl+h` / `ctrl+d`
per eliminare.

I comandi senza tasti predefiniti, e quelli propri dell'app, prendono i tasti che l'app associa con
[`keymap`](../modules/nsh.md#keymap), eseguendoli tramite `run` del ref:

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

## Trova e sostituisci

`search` è ciò che si cerca: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. Le sue corrispondenze sono evidenziate, quella su cui si trova
la selezione in modo più marcato, e `onSearchChange` riporta `{ result }`, un `{ count, current, error }`: quante corrispondenze ci sono, su quale si trova
la selezione (da 0) e perché un'espressione regolare non è valida. `findNext` e `findPrevious` selezionano la
corrispondenza successiva e precedente, ricominciando da capo al termine; `replace(text)` sostituisce la corrispondenza corrente e seleziona la successiva, e
`replaceAll(text)` sostituisce ogni corrispondenza come un'unica modifica e restituisce `{ count }`, cioè quante. La sostituzione di un'espressione regolare fa riferimento ai
suoi gruppi come `$1` e `${name}`.

`inSelection` cerca solo dentro ciò che era selezionato quando è stato attivato (le righe dei cursori se non c'era nulla): l'ambito
resta finché resta attivo, attraverso le modifiche, mentre la selezione si sposta da una corrispondenza all'altra. `findWithSelection` (`cmd+e` su
macOS) riporta il testo selezionato, o la parola al cursore, con `onFindWithSelection`, perché la barra di ricerca lo prenda come
query.

La barra di ricerca è quella dell'app:

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

<a id="diagnostics"></a>

## Diagnostica

`diagnostics` segna i problemi che un language server o un linter segnala: una sottile sottolineatura ondulata sotto ogni intervallo nel colore della
sua gravità (`error`, `warning`, `info`, `hint`). Le posizioni sono righe e colonne UTF-16 da 0, come quelle di un language server, quindi
le sue diagnostiche passano così come arrivano. I segni restano sul loro testo mentre l'utente digita, finché l'app non passa
quelli nuovi; mostrare i messaggi (un elenco, una hover card sulla riga) spetta all'app.

Una diagnostica porta anche il resto di `Diagnostic` di un language server. I suoi `tags` disegnano il testo come fanno i client di linguaggio:
il codice `unnecessary` (una variabile inutilizzata, codice irraggiungibile) è sbiadito e il codice `deprecated` barrato, nelle
parti `unnecessaryText` e `deprecatedText`; un suggerimento con un tag appare solo nel suo testo. `codeDescription.href` è la
pagina che descrive il suo codice (quella di una regola di lint), e `relatedInformation` elenca gli altri punti che ne parlano
(`{ location: { uri?, range }, message }`): l'hover passa entrambi all'app, che li mostra nella sua hover card e
apre la pagina. Un language server invia i tag come numeri (`1`, `2`); l'editor ne accetta i nomi.

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

<a id="decorations"></a>

## Decorazioni

`decorations` applicano stili a intervalli scelti dall'app: evidenziazione semantica da un language server, l'istruzione in esecuzione, le
righe modificate da una revisione. `class` e `style` di una decorazione stilano il suo testo; `lineClass` e `lineStyle` stilano le righe
delle sue linee, dietro il testo. Come le diagnostiche, restano sul loro testo attraverso le modifiche finché l'app non ne imposta di nuove.

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

### Segni nella grondaia e nel righello di panoramica

Il `gutter` di una decorazione mette un segno in una striscia prima dei numeri di riga, accanto a ogni riga coperta dal suo intervallo: le righe aggiunte o modificate da un diff del controllo di versione, oppure un breakpoint (un intervallo vuoto copre la sua riga, come con `lineClass`). Con `placement: "before"` è una linea attraverso la striscia al confine prima dell'inizio dell'intervallo, dove sono state eliminate delle righe. La striscia è larga `gutterDecorationsWidth` punti (3 per impostazione predefinita) e resta finché una decorazione ha un segno nella grondaia, così il testo mantiene la sua posizione mentre i segni vanno e vengono. Un intervallo all'interno di un blocco ripiegato segna la riga del blocco.

Il `overviewRuler` di una decorazione mette un segno sul righello di panoramica, la striscia lungo il bordo destro dell'editor, larga 14 punti (quanto una barra di scorrimento; la parte `overviewRuler` imposta un'altra larghezza), che mappa l'intero testo sulla sua altezza, come fa Monaco. Un segno è alto almeno 6 punti e occupa un `lane` del righello: `left`, `center` (il valore predefinito), `right` o `full`. Il righello è visibile finché una decorazione ha un segno al suo interno.

Ogni segno assume `class` e `style` dell'app, ed è disegnato con il colore di primo piano in assenza di questi. Entrambi seguono le modifiche come l'intervallo della decorazione; una modifica che elimina un intervallo segnato ne lascia uno vuoto dove si trovava.

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

### Evidenziazione personalizzata

Il `token` di una decorazione colora il suo testo come l'evidenziazione integrata colora quel tipo di token (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), al posto di ciò che l'evidenziatore integrato ha trovato in quel punto: l'evidenziatore dell'app (i token semantici di un language server, un parser proprio) mappa i propri token su questi e ottiene i colori dell'editor in chiaro e scuro. Vince il token della decorazione più interna; `class` e `style` si applicano sopra di esso. `highlighting={false}` disattiva l'evidenziatore integrato, così i token dell'app colorano il testo da soli, mentre `language` continua a decidere commenti, parentesi e indentazione.

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

<a id="folding"></a>

## Ripiegamento

I blocchi ripiegabili iniziano dove le righe sono indentate più in profondità della riga precedente. `foldRanges` fornisce all'editor gli intervalli propri dell'app (`{ startLine, endLine }`, la forma degli intervalli di ripiegamento di un language server, che vengono passati così come arrivano): la riga `startLine` mostra il blocco e le righe successive fino a `endLine` vengono ripiegate. Restano sulle loro righe attraverso le modifiche finché l'app non ne passa di nuovi.

I blocchi sono annidati: ripiegare un blocco mantiene ripiegati i blocchi al suo interno, quindi riaprendolo li si vede com'erano. `foldRecursive` ripiega un blocco e ogni blocco al suo interno, `unfoldRecursive` li riapre tutti, `foldLevel(n)` ripiega ogni blocco al livello di annidamento `n`, e `foldSelection` (o `foldRange(range)`) ripiega delle righe qualsiasi, ovunque inizino i blocchi. `onFoldChange` riporta gli intervalli ripiegati dopo ogni modifica, e `folds()` / `setFolds(ranges)` li leggono e li ripristinano, per conservarli insieme al file.

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

## Breakpoint e menu contestuali

Una pressione su un numero di riga riporta `onLineNumberPress({ line })`, il punto per un breakpoint che l'app disegna come decorazione. Il pulsante secondario (clic destro, Control-clic su Mac) riporta `onContextMenu({ position, x, y })`: la posizione nel testo sotto il puntatore e il punto nella vista radice, dove l'app apre il proprio menu. Sui touch screen anche una pressione prolungata, un doppio tocco, una maniglia rilasciata e un tocco sulla selezione lo riportano, con `selection`: il riquadro della selezione nella vista radice (`{ x, y, width, height }`), e `x` / `y` al suo centro in alto, per il menu di modifica.

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

## Funzioni del linguaggio

Suggerimenti, informazioni al passaggio del mouse, vai alla definizione e azioni di codice provengono dal language server dell'app. L'editor disegna da sé l'elenco di completamento, il completamento inline e il collegamento alla definizione, con i relativi tasti; per il resto fornisce all'app i momenti e i luoghi, e l'app disegna i propri popup (un [`Overlay`](./overlay.md) ancorato a un `pageBounds`).

<a id="completion"></a>

### Completamento

Con `completion`, l'editor chiede all'app dei suggerimenti e li mostra come elenco sotto la parola che si sta digitando (sopra di essa vicino al fondo della finestra):

- Digitare una lettera, una cifra o `_` alla fine di una parola effettua la richiesta con `onCompletionRequest(event)`, trigger `"typing"`: `event` ha il suo `id`, il `offset` e `position` del cursore, la `query` (la parola digitata finora) e l'offset `queryStart` da cui inizia. Ciascuno di `completionTriggerCharacters` (`["."]`, `["::", "<"]`) effettua la richiesta con una query vuota dopo di sé, trigger `"character"` (e `character`), e `showCompletions()` o `run("showCompletions")` la effettua al cursore, trigger `"invoked"`.
- L'app risponde con `presentCompletions(event.id, items)`. Ogni elemento ha la forma di un `CompletionItem` di language server: `label`, e opzionalmente `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` e `range`. Viene mostrata la risposta all'ultima richiesta; una precedente, o una relativa a una parola che il cursore ha lasciato, viene messa da parte.
- Continuare a digitare filtra l'elenco sul posto: la query corrisponde al `filterText` di ciascun elemento (altrimenti alla sua label) come lettere in ordine, senza distinzione tra maiuscole e minuscole, prima le parole che iniziano con la query, poi le corrispondenze più vicine, quindi per `sortText`. Le lettere corrispondenti risaltano. Passa `incomplete: true` (`presentCompletions(id, items, true)`) perché l'editor chieda di nuovo mentre si continua a digitare.
- Su e Giù (e Control+P / Control+N) scorrono l'elenco, Pagina su e Pagina giù di una pagina, Invio e Tab accettano, Esc lo chiude. Il puntatore segna un elemento e un clic (un tocco sui touch screen) lo accetta. Il `documentation` dell'elemento selezionato appare accanto all'elenco.
- Accettare sostituisce il `range` dell'elemento (altrimenti la query) con il suo `insertText` (altrimenti la sua label), come un unico passo che l'annullamento può revocare, al cursore e a ogni altro cursore con lo stesso testo davanti, e riporta `onCompletionAccept({ item })`.
- L'elenco si chiude quando il cursore lascia la parola, su uno spazio o altra punteggiatura, quando l'editor perde il focus e quando il cursore esce dall'area visibile scorrendo.

Una pausa nella digitazione (`inlineCompletionDelay`, 300 ms per impostazione predefinita) senza alcun elenco visibile richiede un completamento inline: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` mostra `text` al cursore in un colore attenuato, Tab lo inserisce, ed Esc, una modifica o uno spostamento lo cancellano.

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

### Hover e pressioni

- `onHover(event)`: il mouse si ferma su un carattere senza alcun pulsante premuto (desktop e web; un trascinamento seleziona il testo). `event` ha il suo `position`, il suo `offset` UTF-16, il `range` della sua parola, il `pagePosition` del puntatore, il `pageBounds` della parola, i `modifiers` premuti e i `diagnostics` presenti in quel punto, i cui messaggi vengono mostrati dall'app. Spostarsi su un'altra parola riporta subito il successivo hover.
- `onHoverEnd()`: il mouse ha lasciato la parola o l'editor, oppure il testo è cambiato o è scorso sotto di esso.
- `onTextPress(event)`: un carattere è stato premuto, dopo che l'editor ha posizionato il proprio cursore: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` e `rangeBounds(range)`: dove si trovano il cursore e un intervallo, `{ bounds, pageBounds }` (nell'editor e nella vista radice): lì si apre un popup dell'app.

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

### Vai alla definizione e azioni di codice

Tenere premuto Mod (Command su macOS e iOS, Control altrove) trasforma le parole sotto il mouse in collegamenti, come negli editor di codice:

- Con Mod premuto su una parola (premuto mentre il mouse è fermo lì, oppure il mouse spostato lì con Mod già premuto), l'editor effettua la richiesta con `onDefinitionRequest(event)`, trigger `"hover"`: `event` ha il suo `id`, il `position` e `offset` del carattere, e il `range` della parola. Rispondi con `presentDefinitionLink(event.id, range)` quando il language server trova una definizione: l'intervallo viene sottolineato (la parte `definitionLink`) e il puntatore diventa una mano su di esso. Il collegamento scompare quando Mod viene rilasciato, il mouse lo lascia o il testo cambia o scorre, oppure con `hideDefinitionLink()`. Viene mostrata la risposta all'ultima richiesta; una precedente viene messa da parte.
- Un clic con Mod su una parola effettua la richiesta con trigger `"press"`; sul collegamento il cursore resta dov'è. F12 (`goToDefinition`, `run("goToDefinition")`) la effettua per la parola al cursore, trigger `"key"`. L'app va alla definizione: `revealPosition` e `setSelections` per una nello stesso testo, la propria navigazione per un altro file.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) riporta `onCodeActionRequest({ range, position, bounds })`: la selezione primaria (prima l'inizio), il cursore e il suo riquadro. L'app chiede le azioni al proprio language server, mostra il suo menu in `bounds.pageBounds` (un [`Menu`](./menu.md) o un `Overlay`), e applica le modifiche di quella scelta con `edit(edits)`.

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

## Dimensioni e scorrimento

Con `minRows` e / o `maxRows` l'editor cresce con il suo testo: è alto quanto le sue righe, almeno `minRows` di esse, e da `maxRows` in poi il suo testo scorre, come in una finestra di messaggio o in una cella di un notebook. Altrimenti è l'app a dimensionarlo, e `scrollBeyondLastLine` permette al testo di scorrere oltre l'ultima riga: fino a una schermata (`true`, il valore predefinito), per niente (`false`) o per un numero di righe. Mentre il cursore si sposta, `cursorSurroundingLines` righe restano visibili intorno ad esso. Trascinare una selezione oltre i bordi dell'editor continua a scorrere, più velocemente quanto più il puntatore si allontana.

`showWhitespaces` mostra un `·` per ogni spazio e un `→` per ogni tabulazione (la parte `whitespace`), e `rulers` disegna una linea a ciascuna delle sue colonne (la parte `ruler`), come guide della lunghezza di una riga.

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

## Metodi

`ref={editor}` fornisce i metodi dell'editor (`EditorRef`), per i pulsanti, i menu e i tasti dell'app. I metodi che restituiscono un valore (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...) ne restituiscono in JS una `Promise`, quindi usa `await` su di essi: `const text = await editor.value()`. Un metodo a cui viene data una riga oltre il testo (`fold`, `scrollToLine`, `goToLine`, ...) non cambia nulla e registra un avviso con il nome del metodo e la riga.

| Metodo | Descrizione |
|---|---|
| `focus()`, `blur()` | Prende il focus, o lo cede. |
| `value()` | `Promise<string>`: il testo. |
| `setValue(value)` | Sostituisce il testo, come una modifica che l'annullamento può revocare. |
| `insert(text)` | Digita `text` a ogni selezione, così com'è (le parentesi non si chiudono). |
| `edit(edits)` | Applica le sostituzioni `{ range, text }` (intervalli del testo corrente; una che si sovrappone a una precedente viene saltata) come un unico passo che l'annullamento può revocare; le selezioni si spostano con il testo intorno ad esse. Le azioni di codice e le modifiche di formattazione vanno qui. |
| `selections()` | `Promise<EditorSelection[]>`: ogni selezione, `{ anchor, head }`, con la primaria (la più recente) per ultima. |
| `setSelections(selections)` | Imposta le selezioni (l'ultima è la primaria) e fa scorrere la primaria nell'area visibile. |
| `run(command)` | Esegue un comando, come farebbero i suoi tasti ([Comandi](#commands)). |
| `replace(text)` | Sostituisce la corrispondenza corrente e seleziona la successiva. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: sostituisce ogni corrispondenza come un'unica modifica; `{ count }`, quante sono. |
| `fold(line)`, `unfold(line)` | Ripiega le righe sotto la riga `line` (da 0), oppure la riapre. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Ripiega il blocco sulla riga `line` e ogni blocco al suo interno, oppure li riapre tutti. |
| `foldLevel(level)` | Ripiega ogni blocco al livello di annidamento `level` (1: il più esterno). |
| `foldRange(range)` | Ripiega le righe di `range` (`{ startLine, endLine }`), ovunque inizino i blocchi. |
| `folds()` | `Promise<EditorFoldRange[]>`: gli intervalli ripiegati, compresi quelli annidati. |
| `setFolds(folds)` | Ripiega esattamente `folds`. |
| `scrollToLine(line)` | Fa scorrere la riga `line` nell'area visibile, riaprendo ciò che la nasconde. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: se c'è una modifica da annullare, o da ripetere. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: il riquadro del cursore primario, `{ bounds, pageBounds }`, nell'editor (con il suo scorrimento applicato) e nella vista radice; `null` prima che l'editor sia stato disposto. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: i riquadri di `range`, uno per ogni riga che copre. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: di quanto è scorso il testo; lo fa scorrere fino a `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: il testo mostrato dal viewport, dall'inizio della sua prima riga alla fine della sua ultima riga. |
| `selectedText()` | `Promise<string>`: il testo della selezione primaria. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: tra offset UTF-16 di `value()` e posizioni. |
| `revealPosition(position, center)` | Fa scorrere `position` nell'area visibile, riaprendo ciò che lo nasconde; al centro con `center`. |
| `goToLine(line)` | Mette il cursore all'inizio della riga `line` (da 0) e la fa scorrere al centro. |
| `showCompletions()` | Chiede i completamenti al cursore, con la parola che lo precede come query ([Completamento](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Risponde alla richiesta di completamento `id`: l'elenco mostra `items`, filtrato da ciò che è stato digitato da allora; con `incomplete`, continuare a digitare effettua una nuova richiesta. Nessun elemento chiude l'elenco. |
| `hideCompletions()` | Chiude l'elenco di completamento. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Risponde alla richiesta di completamento inline `id` con `text`, mostrato al cursore; lo cancella. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Risponde alla richiesta di definizione `id` (trigger `"hover"`): `range` viene sottolineato come collegamento ([Vai alla definizione](#go-to-definition-and-code-actions)); lo nasconde. |

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

### Comandi

`run` accetta i comandi dell'editor per nome (`EditorCommand`):

| Comandi | Cosa fanno |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Spostano i cursori. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Estendono le selezioni. |
| `moveToMatchingBracket` | Vai alla parentesi corrispondente a quella sul cursore. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Selezionano. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Spostano o estendono per parte di parola (gobbe del camelCase, parti dello snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Spostano o estendono fino alla riga vuota prima o dopo il paragrafo. |
| `expandSelection`, `shrinkSelection` | Ampliano le selezioni di un'unità, o le riducono. |
| `undoSelection`, `redoSelection` | Tornano alle selezioni precedenti l'ultimo spostamento, o avanzano di nuovo. |
| `splitSelectionIntoLines` | Una selezione per ogni riga di ciascuna selezione. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Aggiungono un cursore; tornano a una sola selezione. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Eliminano. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Righe, indentazione e commenti. |
| `sortLinesAscending`, `sortLinesDescending` | Ordinano le righe selezionate (tutte le righe se c'è solo un cursore). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Cambiano maiuscole e minuscole delle selezioni (con un cursore: la sua parola). |
| `trimTrailingWhitespace` | Rimuove gli spazi finali di ogni riga. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Riorganizzano. |
| `undo`, `redo` | Annullano e ripetono. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Ripiegano alla riga del cursore, o tutto. |
| `foldRecursive`, `unfoldRecursive` | Ripiegano il blocco del cursore e ogni blocco al suo interno, o li espandono. |
| `foldSelection` | Ripiega le righe di ogni selezione che ne copre più di una. |
| `findNext`, `findPrevious` | Selezionano la corrispondenza successiva o precedente di `search`. |
| `findWithSelection` | Segnala il testo selezionato alla barra di ricerca (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | Gli appunti. |
| `showCompletions` | Richiede i completamenti sul cursore ([Completamento](#completion)). |
| `goToDefinition` | Richiede la definizione della parola sul cursore (`onDefinitionRequest`, trigger `"key"`). |
| `showCodeActions` | Richiede le azioni di codice sulla selezione (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Stile delle parti

`class` e `style` definiscono lo stile del riquadro dell'editor. `classes` accetta classi Tailwind per parte e `styles` stili inline per parte; le classi di una parte vengono dopo i suoi stili predefiniti, quindi prevalgono, e i suoi `styles` prevalgono sulle classi. Il font si imposta con `fontFamily`, `fontSize` e `lineHeight`, con cui l'editor misura il proprio testo.

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

| Parte | Cos'è | Predefinito |
|---|---|---|
| `gutter` | La colonna dei numeri di riga e dei marcatori di ripiegamento | 12pt prima dei numeri, 4pt dopo i marcatori |
| `lineNumber` | Ogni numero di riga | Allineato a destra, `muted-foreground` |
| `activeLineNumber` | I numeri delle righe con un cursore, dopo `lineNumber` | `foreground` |
| `foldMarker` | Il marcatore di una riga in cui inizia un ripiegamento | `⌄`, `›` se ripiegato, `muted-foreground` |
| `overviewRuler` | Il righello di panoramica lungo il bordo destro, finché una decorazione vi ha un segno | nessuno |
| `content` | L'area di testo accanto alla gutter | 4pt prima del testo |
| `line` | Ogni riga di testo | |
| `activeLine` | Dietro le righe con un cursore, sotto gli indicatori di scorrimento | `muted`, tenue |
| `selection` | Dietro il testo selezionato | Una tinta di `primary` |
| `caret` | I cursori | Larghi 2pt, `foreground`, lampeggianti |
| `composition` | Il testo che un input method sta componendo | Sottolineato |
| `searchMatch` | Le corrispondenze di `search` | Ambra traslucido |
| `currentSearchMatch` | La corrispondenza su cui si trova la selezione, dopo `searchMatch` | Ambra più intenso |
| `matchingBracket` | La parentesi sul cursore e la sua corrispondente | Un bordo di 1pt |
| `indentGuide` | Una guida per livello di indentazione | Una linea di 1pt di `border` |
| `foldPlaceholder` | Ciò che una riga ripiegata mostra dopo il suo testo | ` ⋯ `, `muted-foreground` |
| `placeholder` | Mostrato mentre il testo è vuoto | `muted-foreground` |
| `diagnosticError` | La linea sotto un errore | `destructive` |
| `diagnosticWarning` | La linea sotto un avviso | Ambra |
| `diagnosticInfo` | La linea sotto un'informazione | Blu |
| `diagnosticHint` | La linea sotto un suggerimento | `muted-foreground` |
| `unnecessaryText` | Il testo di una diagnostica `unnecessary` | `muted-foreground` |
| `deprecatedText` | Il testo di una diagnostica `deprecated` | Barrato |
| `whitespace` | I segni di spazi e tabulazioni (`showWhitespaces`) | `·` e `→`, `muted-foreground` al 60 % |
| `ruler` | Le linee di `rulers` | Una linea da 1 punto di `border` |
| `selectionHandle` | I pomelli delle maniglie alle estremità di una selezione touch | Un punto di 10pt di `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | Il pomello dell'inizio (sopra la sua riga) e quello della fine (sotto), dopo `selectionHandle` | |
| `completionMenu` | Il riquadro della lista di completamento | `popover`, `border` da 1pt, angoli arrotondati, un'ombra |
| `completionItem` | Ogni elemento della lista | L'altezza di una riga, 8pt di padding |
| `selectedCompletionItem` | L'elemento selezionato, dopo `completionItem` | `accent` |
| `completionMatch` | Le lettere di un'etichetta che corrispondono alla query | Semibold, `primary` |
| `completionDetail` | Il dettaglio di un elemento, dopo la sua etichetta | Allineato a destra, `muted-foreground` |
| `completionKind` | Il tipo di un elemento, prima della sua etichetta | Un nome breve (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | La documentazione dell'elemento selezionato, accanto alla lista | Come `completionMenu`, larga al massimo 320pt |
| `inlineCompletion` | Il completamento inline sul cursore | `muted-foreground` |
| `definitionLink` | La sottolineatura del link alla definizione | Una linea di 1pt di `primary` sotto il testo |

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Il testo, controllato dall'app (reimpostalo da `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | Il testo iniziale, quando l'editor gestisce il proprio. |
| `language` | `.language(..)` | `string` | testo semplice | Nome, alias, estensione o nome file di un linguaggio ([Linguaggi](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Mostrato mentre il testo è vuoto. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | Il testo può essere selezionato e copiato, non modificato. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Prende il focus quando compare. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | I numeri di riga della gutter. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Le righe lunghe vanno a capo alla larghezza dell'editor. |
| `tabSize` | `.tab_size(..)` | `number` | quello del linguaggio | Le colonne di una tabulazione e di un livello di indentazione. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | quello del linguaggio | Indenta con tabulazioni. |
| `folding` | `.folding(..)` | `boolean` | `true` | Le righe indentate si ripiegano con i marcatori della gutter. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | per indentazione | Dove iniziano i ripiegamenti, decisi dall'app ([Ripiegamento](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | L'evidenziazione della sintassi integrata ([Evidenziazione personalizzata](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Parentesi e virgolette si chiudono mentre vengono digitate. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Una nuova riga mantiene l'indentazione e indenta dopo una parentesi aperta. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | Le righe con un cursore sono evidenziate. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | Le guide di indentazione. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | Il testo scorre oltre l'ultima riga: fino a una schermata (`true`), per nulla (`false`) o di tante righe. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` del tema | Il font in cui il testo viene disegnato e misurato. |
| `fontSize` | `.font_size(..)` | `number` | `13` | La dimensione del font, in punti. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | L'altezza di una riga, in punti. |
| `search` | `.search(..)` | `EditorSearch` | | Cosa cercare ([Trova e sostituisci](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Problemi da segnalare ([Diagnostica](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Intervalli che l'app stilizza ([Decorazioni](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | La larghezza della striscia dei segni delle decorazioni nella gutter, in punti. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Classi Tailwind per parte. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Stili inline per parte, sopra le classi. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Come gli screen reader chiamano l'editor. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Spazi e tabulazioni compaiono come `·` e `→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Colonne in cui tracciare una linea verticale. |
| `minRows` | `.min_rows(..)` | `number` | | L'editor cresce con il testo a partire da questo numero di righe ([Dimensioni e scorrimento](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | L'editor cresce con il testo fino a questo numero di righe, poi scorre. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | Le righe mantenute in vista sopra e sotto il cursore. |
| `completion` | `.completion(..)` | `boolean` | `false` | L'editor richiede suggerimenti e li mostra come lista ([Completamento](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | Cos'altro richiede completamenti durante la digitazione. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Millisecondi di pausa nella digitazione prima che venga richiesto un completamento inline. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | | Il riquadro dell'editor. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | Il testo è cambiato: `{ value }`, l'intero nuovo testo. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | Le selezioni sono cambiate: `{ selections }`, tutte, la primaria per ultima. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | L'editor ha preso o perso il focus. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | Le corrispondenze della ricerca sono cambiate: `{ result }`, un `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | È stato premuto un numero di riga: `{ line }`, la riga, a partire da 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | È stato premuto il pulsante secondario sul testo, o un tocco ha selezionato del testo: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | Il mouse si ferma su un carattere ([Funzionalità del linguaggio](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | L'hover è terminato. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | È stato premuto un carattere: con la sua parola, i modificatori e i clic. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` è stato eseguito: `{ query }`, il testo per la query della barra di ricerca. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Gli intervalli ripiegati sono cambiati: `{ folds }`, tutti, compresi quelli annidati. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | L'editor richiede completamenti: `{ id, offset, position, query, queryStart, trigger, character? }` ([Completamento](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Un elemento è stato accettato e inserito: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | La digitazione si è fermata: `{ id, offset, position }`, per un completamento inline. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | L'editor richiede una definizione: `{ id, position, offset, range, trigger }` ([Vai alla definizione](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | L'utente ha richiesto le azioni di codice: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Accessibilità

Gli screen reader chiamano l'editor con il suo `accessibilityLabel`; il suo focus è quello di un campo di testo, quindi i servizi di testo della piattaforma (input method, dettatura, tastiere virtuali) funzionano al suo interno.

<a id="related"></a>

## Correlati

- [TextView](./text-view.md): documenti Markdown e HTML, i cui blocchi di codice condividono i colori di sintassi dell'editor.
- [DiffView](./diff-view.md): le modifiche tra due testi, con i colori di sintassi dell'editor.
- [Input](./input.md): campi di testo a riga singola e multiriga con la modifica nativa della piattaforma.
- [`keymap`](../modules/nsh.md#keymap): i tasti dell'app per i comandi dell'editor.
- [`nsh/base`](../modules/nsh-base.md): gli altri componenti di base.
