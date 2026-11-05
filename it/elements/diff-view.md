---
title: "DiffView"
description: "Il componente DiffView: le modifiche tra due testi o di una patch, affiancate o unificate, con evidenziazione delle parole modificate all'interno delle righe, righe invariate compresse in separatori espandibili, evidenziazione della sintassi, a capo automatico, azioni per singola modifica, selezione delle righe e annotazioni di revisione."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` mostra le modifiche tra due testi come negli strumenti di code review: affiancati (side by side), con il testo vecchio a sinistra e quello nuovo a destra, con le righe allineate, oppure unificati, con le righe eliminate sopra quelle aggiunte. All'interno di una riga modificata le parole cambiate sono evidenziate, le righe invariate tra una modifica e l'altra si comprimono in separatori espandibili e il testo è evidenziato con i colori di sintassi del [`Editor`](./editor.md). Mostra due testi (`oldValue` e `newValue`) oppure i file di un unified diff (`patch`: quello di `git diff`, di una pull request), ciascuno sotto la propria intestazione, ed è pensato per rivedere modifiche, comprese quelle proposte da un'AI: le azioni dell'app su ogni modifica la mantengono o la annullano. Vengono create solo le righe visibili, quindi un file lungo scorre come uno breve.

`DiffView` gestisce il comportamento e ha un aspetto proprio, costruito con i token del tema: il `font-mono` del tema a 13pt in righe da 20pt, i numeri di riga in `muted-foreground`, le righe aggiunte con tinta verde e quelle eliminate con tinta rossa, le parole modificate con una tinta più intensa, una barra al bordo della gutter di ogni riga modificata e i separatori su `muted`. Ogni parte accetta gli stili dell'app al posto di questi valori predefiniti (`classes` e `styles`). Rust ne crea uno con `nsh_base::diff_view()`, TSX con `<DiffView>` da `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

La vista riempie il riquadro che l'app le assegna (`flex-1`, un'altezza) e scorre al suo interno: in verticale attraverso le righe e in orizzontale fino alla riga più lunga, con i due lati di una vista affiancata che scorrono insieme. Con `softWrap` le righe lunghe vanno a capo alla larghezza del lato, e una riga affiancata è alta quanto il suo lato più alto, così i lati restano allineati.

<a id="two-texts-or-a-patch"></a>

## Due testi o una patch

- **Due testi**: `oldValue` e `newValue`. Le righe sono confrontate così come sono, quindi un'interruzione di riga finale aggiunta o rimossa è una modifica, come mostra git.
- **Una patch**: `patch`, un unified diff di uno o più file (`git diff`, `git format-patch`, `diff -u`; rinominazioni, modalità, file nuovi, eliminati e binari, e un messaggio di commit che li precede, letti come li scrive git). La vista mostra le righe dei suoi hunk, numerate come nel file, ciascun hunk sotto un separatore con la propria intestazione (la funzione in cui si trova), e ciascun file, se sono più di uno, sotto un'intestazione propria ([File di una patch](#files-of-a-patch)). Il percorso di ogni file indica il suo linguaggio quando `language` non è impostato.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` indica il linguaggio come fa il `Editor`: un nome, un alias, un'estensione o un nome di file (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## File di una patch

Una patch di più file mostra ogni file sotto una riga di intestazione: per impostazione predefinita il suo percorso (`old → new` se rinominato), il numero di righe aggiunte ed eliminate e `▾`, e una pressione su di essa comprime il file alla sua sola intestazione (`▸`) oppure lo espande. `renderFileHeader` disegna le intestazioni a modo dell'app (e ne mostra una anche sopra una patch di un solo file), ricevendo il file (`DiffFile`): `index`, `path`, `oldPath` (rinominato o copiato da), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (la patch non mostra righe di questo file), `added`, `deleted`, `hunks`, `firstHunk` e `collapsed`. L'intestazione dell'app chiama il `toggleFile(path)` del ref; `collapseFile` e `expandFile` impostano lo stato, e ogni cambiamento viene notificato con `onFileToggle({ file })`. Un file compresso resta compresso finché un nuovo `patch` lo contiene ancora.

Le modifiche si contano tra i file, in ordine: le modifiche di un file sono `firstHunk` a `firstHunk + hunks - 1`, che `goToHunk`, `renderHunkActions` e `hunks()` utilizzano (il `file` di un `DiffHunk` è l'indice del suo file e le sue righe si contano in quel file), e `stats()` somma quelle di ogni file. `goToHunk` espande prima un file compresso.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## Layout e modifiche inline

`layout` è `"split"` (il valore predefinito: affiancato, con ogni riga eliminata accanto alla riga aggiunta più simile) oppure `"unified"` (una colonna, con le righe eliminate di una modifica sopra le sue righe aggiunte, con entrambi i numeri di riga). `inline` stabilisce che cosa viene evidenziato all'interno di una riga modificata:

| `inline` | Cosa viene evidenziato |
|---|---|
| `"wordAlt"` (predefinito) | Le parole cambiate, unite quando distano un solo carattere, così una frase modificata si legge come una sola |
| `"word"` | Ogni parola cambiata |
| `"char"` | Ogni carattere cambiato |
| `"none"` | Niente: solo le tinte delle righe |

Le parole sono sequenze di lettere, cifre e `_`; ogni carattere CJK, kana e sillaba hangul è una parola a sé, quindi un carattere modificato in una frase segna solo se stesso. Una riga modificata quasi per intero mostra solo la propria tinta.

`indicators` segna le righe modificate accanto ai loro numeri: `"bars"` (il valore predefinito, una barra al bordo della gutter), `"classic"` (`+` e `−` prima del testo) oppure `"none"`. `background={false}` lascia le righe modificate senza tinta, e `lineNumbers={false}` nasconde i numeri.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Righe compresse

Attorno a ogni modifica sono visibili `contextLines` righe invariate (3 per impostazione predefinita); le righe invariate tra una modifica e l'altra, e quelle prima della prima e dopo l'ultima, si comprimono in un separatore che indica quante righe nasconde. Premendolo, le mostra tutte. `expandAll` mostra ogni riga; `expand`, `expandAll()` e `collapseAll()` del ref le rivelano e le comprimono dall'app.

`renderSeparator` disegna i separatori a modo dell'app. Riceve il separatore (`DiffSeparator`): `gap`, l'indice della sequenza compressa (0 prima della prima modifica, `i` tra le modifiche `i - 1` e `i`), `lines`, quante righe nasconde, `first` e `last`, e per una patch l'`header` dell'hunk. `expand(gap, direction, lines)` mostra `"all"` le sue righe (il valore predefinito), oppure `lines` (predefinito 20) `"up"`, appena sopra la modifica che segue il separatore, oppure `"down"`, appena sotto la modifica che lo precede. Il primo separatore si espande verso l'alto e l'ultimo verso il basso.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## Mantenere e annullare le modifiche

`renderHunkActions` mette le azioni dell'app in alto a destra di ogni modifica visibile, ricevendo la modifica (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, righe a partire da 0, e `file`, l'indice del suo file in una patch). Chiamano il ref: `revertHunk(index)` rimette le vecchie righe della modifica nel nuovo testo, `acceptHunk(index)` rende le nuove righe della modifica quelle del vecchio testo. La vista mostra subito il risultato e notifica entrambi i testi con `onChange({ change })` (`{ oldValue, newValue }`), che l'app imposta come prop. Mantenere o annullare la modifica di un'AI una alla volta si fa così:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

Qui il vecchio testo è il file così com'è: mantenere una modifica la applica al file (`onApply`), annullarla la toglie dalla proposta. Una vista che mostra un `patch` mostra estratti dei file, e le sue modifiche restano come sono.

<a id="methods"></a>

## Metodi

`ref={diff}` fornisce i metodi della vista (`DiffViewRef`). I metodi che restituiscono un valore (`hunks()`, `stats()`) in JS ne restituiscono una `Promise`, quindi usa `await` su di essi: `const changes = await diff.hunks()`. Per i conteggi mostrati a schermo, `onStatsChange` li notifica man mano che cambiano. Un metodo a cui si passa una modifica, un separatore o un file che il diff non ha non cambia nulla e registra un avviso con il nome del metodo e il valore.

| Metodo | Descrizione |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: le modifiche, in ordine. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, le righe aggiunte ed eliminate e il numero di modifiche. |
| `goToHunk(index)` | Porta in vista la modifica `index`, con la sua prima riga in alto. |
| `revertHunk(index)` | Rimette le vecchie righe della modifica `index` nel nuovo testo e notifica i testi (`onChange`). |
| `acceptHunk(index)` | Rende le nuove righe della modifica `index` quelle del vecchio testo e notifica i testi (`onChange`). |
| `expand(gap, direction?, lines?)` | Mostra le righe che il separatore `gap` nasconde: `"all"` (predefinito), oppure `lines` (predefinito 20) `"up"` o `"down"`. |
| `expandAll()` | Mostra ogni riga invariata. |
| `collapseAll()` | Comprime di nuovo le righe invariate. |
| `nextHunk()` | `Promise<number \| null>`: porta in alto la modifica successiva e ne restituisce l'indice (dopo l'ultima, la prima). |
| `previousHunk()` | `Promise<number \| null>`: porta in alto la modifica precedente e ne restituisce l'indice (prima della prima, l'ultima). |
| `currentHunk()` | `Promise<number \| null>`: l'ultima modifica raggiunta finché la vista resta lì, altrimenti quella in cima alla vista o la prima visibile. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: le righe selezionate sui numeri di riga. |
| `setSelectedLines(range)` | Seleziona righe di un lato (`null`: nessuna), senza `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: il testo delle righe selezionate. |
| `files()` | `Promise<DiffFile[]>`: i file della patch, in ordine, con i loro conteggi (nessuno per due testi). |
| `scrollToFile(path)` | Porta in alto l'intestazione del file in `path`. |
| `collapseFile(path)` | Mostra solo l'intestazione del file in `path`. |
| `expandFile(path)` | Mostra di nuovo le righe del file in `path`. |
| `toggleFile(path)` | Comprime il file in `path`, oppure lo espande se è compresso. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: dove si trova ogni modifica tra le righe, in ordine ([Un righello di panoramica](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: di quanto sono scorse le righe (`x` è 0). |
| `setScrollOffset(offset)` | Fa scorrere subito le righe a `offset.y`, fin dove arrivano, come un cursore che segue il puntatore che lo trascina. |

`nextHunk()` e `previousHunk()` proseguono dalla modifica a cui sono andati finché la vista resta lì, altrimenti dalla cima della vista, così una modifica vicina alla fine che non può scorrere fino in alto conta comunque. Pulsanti per la modifica successiva e precedente, con i conteggi da `onStatsChange`:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## Un righello di panoramica

`onScroll({ offset, contentSize, size })` notifica dove si trovano le righe, con le chiavi di quelle di un [`Scroll`](./scroll.md): `offset.y`, di quanto sono scorse (le righe scorrono in verticale, larghe quanto la vista, e i lati scorrono in orizzontale per conto proprio: `offset.x` è 0), `contentSize`, la dimensione di tutte le righe insieme, e `size`, quella del viewport. Scatta una volta che la vista è stata impaginata e di nuovo ogni volta che uno di questi valori cambia: quando le righe scorrono, quando la vista viene ridimensionata e quando le righe cambiano altezza (altri testi, `layout`, `softWrap`, un file o un separatore espanso o compresso, un'annotazione impaginata). `hunkBounds()` indica dove si trova ogni modifica tra le righe (`DiffHunkBounds`: `{ index, bounds }`, `bounds` dalla cima della sua prima riga al fondo dell'ultima, con le annotazioni sotto, per tutta la larghezza della vista), cioè le modifiche che si vedono: quelle di un file compresso non hanno righe. `onHunkBoundsChange({ hunkBounds })` fornisce lo stesso elenco una volta che la vista è stata impaginata e di nuovo ogni volta che una modifica si sposta o cambia dimensione, anche quando le righe mantengono la loro altezza (una riga modificata che ne diventa un'altra): un righello disegna i propri segni a partire da esso, anziché leggerli su `onScroll`. `scrollOffset()` legge di quanto sono scorse le righe, e `setScrollOffset({ x, y })` fa scorrere subito le righe a `y`, così un cursore trascinato segue il puntatore nello stesso frame.

Insieme formano un righello di panoramica accanto alla vista, come negli editor di codice: un segno per ogni modifica, un cursore sulle righe visibili e una pressione o un trascinamento che scorre fin lì. Qui il righello è alto quanto la vista:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

Il `index` di un segno è quello della modifica in `hunks()`, i cui `oldLines` e `newLines` distinguono una modifica aggiunta (senza vecchie righe) da una eliminata (senza nuove righe), per colorare il segno.

<a id="review-comments"></a>

## Commenti di revisione

I numeri di riga selezionano righe di un lato: una pressione ne seleziona una, una pressione con Shift estende la selezione fino a essa, e trascinare il mouse sui numeri seleziona quelli su cui passa. `onLineSelectionChange` notifica le righe come `range` (`DiffLineRange`: `{ side, start, end }`, righe a partire da 0, `null` per nessuna), e la pressione su un numero notifica anche `onLineNumberPress({ line })` (`{ side, line }`). Il ref legge la selezione (`selectedLines()`, `selectedText()`) e la imposta.

`annotations` mette il contenuto dell'app sotto le righe: ogni `{ id, side, line }` è disegnata da `renderAnnotation` su tutta la larghezza del lato della sua riga (l'intera vista se unificata), alta quanto risulta dall'impaginazione, e resta visibile finché lo è la sua riga. `renderAddAnnotation` è il controllo dell'app per aggiungerne una, a destra della gutter della riga su cui si trova il puntatore e dell'ultima riga selezionata; riceve le righe selezionate quando la sua riga è una di esse, altrimenti quella riga.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## Stile delle parti

`class` e `style` stilizzano il box della vista. `classes` accetta classi Tailwind per parte e `styles` stili inline per parte; le classi di una parte vengono dopo i suoi stili predefiniti, quindi prevalgono, e i suoi `styles` prevalgono sulle sue classi. Il font si imposta con `fontFamily`, `fontSize` e `lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| Parte | Che cos'è | Predefinito |
|---|---|---|
| `side` | Ogni lato (split) o la colonna unica (unified) | Una linea `border` tra i lati |
| `gutter` | I numeri di riga e gli indicatori di un lato | |
| `lineNumber` | Ogni numero di riga | Allineato a destra, `muted-foreground` |
| `lineNumberAdded` | I numeri delle linee aggiunte, dopo `lineNumber` | |
| `lineNumberDeleted` | I numeri delle linee eliminate, dopo `lineNumber` | |
| `content` | Il testo di un lato, accanto al suo gutter | 8pt prima e dopo il testo |
| `line` | Ogni riga di un lato | |
| `lineAdded` | Le righe delle linee aggiunte, dopo `line` | Una tinta verde |
| `lineDeleted` | Le righe delle linee eliminate, dopo `line` | Una tinta rossa |
| `filler` | La metà vuota di una riga split accanto a una linea che l'altro lato non ha | Un riempimento `muted` tenue |
| `wordAdded` | Le parole modificate all'interno di una linea aggiunta | Un verde più intenso |
| `wordDeleted` | Le parole modificate all'interno di una linea eliminata | Un rosso più intenso |
| `indicatorAdded` | La barra di una linea aggiunta (`"bars"`) o `+` (`"classic"`) | Verde, larga 3pt |
| `indicatorDeleted` | La barra di una linea eliminata o `−` | Rossa, larga 3pt |
| `separator` | Un separatore di linee compresse, o l'intestazione di un hunk di una patch | `⋯` e il conteggio su `muted` |
| `hunkActions` | Il box delle azioni dell'app su una modifica | In alto a destra della modifica |
| `lineSelected` | Sopra le righe selezionate del loro lato | Il colore di selezione del tema (come le selezioni di `Editor`) |
| `annotation` | Il box di un'annotazione, sotto la sua linea | Per tutta la larghezza del lato della sua linea |
| `addAnnotation` | Il box del controllo di aggiunta, largo quanto il gutter e alto una linea | Il controllo alla sua destra |
| `fileHeader` | L'intestazione di un file di una patch | Il percorso e i conteggi su `secondary`, una linea `border` sotto |

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | Il testo vecchio. |
| `newValue` | `.new_value(..)` | `string` | | Il testo nuovo. |
| `patch` | `.patch(..)` | `string` | | Un unified diff di uno o più file, mostrato quando `oldValue` e `newValue` non sono impostati. |
| `language` | `.language(..)` | `string` | testo semplice (una patch: quello di ogni file) | Il nome, l'alias, l'estensione o il nome file di un linguaggio. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Affiancato o a colonna unica. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | Che cosa viene evidenziato all'interno delle linee modificate. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | Come le linee modificate vengono contrassegnate accanto ai loro numeri. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Linee non modificate mostrate attorno a ogni modifica. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Tutte le linee non modificate vengono mostrate. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | I numeri di riga. |
| `background` | `.background(..)` | `boolean` | `true` | Le linee modificate hanno una tinta. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` del tema | Il font del testo. |
| `fontSize` | `.font_size(..)` | `number` | `13` | La dimensione del font, in punti. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | L'altezza di una riga, in punti. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Disegna i separatori delle linee compresse. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | Le azioni dell'app su ogni modifica. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Le linee lunghe vanno a capo alla larghezza del lato. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | Il contenuto dell'app sotto le linee: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Disegna un'annotazione sotto la sua linea. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | Il controllo dell'app per aggiungere un'annotazione, accanto alla linea sotto il puntatore e all'ultima selezionata. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Disegna l'intestazione di ogni file di una patch, alta una riga. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Classi Tailwind per parte. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Stili inline per parte, sopra le classi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | | Il box della vista. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Una modifica è stata mantenuta o annullata: `{ change }`, i testi attuali (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Un numero di riga è stato premuto: `{ line }`, un `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | Le linee selezionate sono cambiate: `{ range }`, un `{ side, start, end }` o `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | I conteggi sono cambiati: `{ stats }`, un `{ added, deleted, hunks }`. Viene emesso una volta quando la vista viene creata e di nuovo ogni volta che i testi vengono confrontati con conteggi diversi, per una riga "+8 −8 · 5 changes". |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Un file della patch è stato compresso o espanso (la sua intestazione, o il ref): `{ file }`, il `DiffFile` attuale. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | Le righe sono scorse, oppure le righe o il viewport hanno cambiato dimensione: `{ offset, contentSize, size }`, come quello di un `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` in Rust). Viene emesso una volta che la vista è stata impaginata e di nuovo quando uno di essi cambia. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | La posizione delle modifiche nelle righe è cambiata: `{ hunkBounds }`, l'elenco restituito da `hunkBounds()`. Viene emesso una volta che la vista è stata impaginata e di nuovo quando una modifica si sposta o cambia dimensione, che l'altezza delle righe sia rimasta invariata o meno, per i segnalini di un overview ruler. |

<a id="related"></a>

## Correlati

- [Editor](./editor.md): l'editor di codice di cui `DiffView` usa i colori della sintassi e i linguaggi.
- [TextView](./text-view.md): documenti in Markdown e HTML, per il testo attorno a una review.
- [`nsh/base`](../modules/nsh-base.md): gli altri componenti di base.
