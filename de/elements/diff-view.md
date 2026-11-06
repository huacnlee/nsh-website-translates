---
title: "DiffView"
description: "Die DiffView-Komponente: die Änderungen zwischen zwei Texten oder eines Patches, nebeneinander oder vereinheitlicht dargestellt, mit hervorgehobenen geänderten Wörtern innerhalb von Zeilen, unveränderten Zeilen, die zu aufklappbaren Trennlinien zusammengefasst werden, Syntaxhervorhebung, weichem Zeilenumbruch, Aktionen pro Änderung, Zeilenauswahl und Review-Anmerkungen."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---


# DiffView

`DiffView` zeigt die Änderungen zwischen zwei Texten, wie es Code-Review-Tools tun: nebeneinander, links der alte und rechts der neue Text mit ausgerichteten Zeilen, oder unified, die gelöschten Zeilen über den hinzugefügten. Innerhalb einer geänderten Zeile werden die geänderten Wörter hervorgehoben, die unveränderten Zeilen zwischen Änderungen werden zu aufklappbaren Trennzeilen zusammengeklappt, und der Text wird in den Syntaxfarben des [`Editor`](./editor.md) hervorgehoben. Die Komponente zeigt zwei Texte (`oldValue` und `newValue`) oder die Dateien eines Unified Diffs (`patch`: die von `git diff`, eines Pull Requests), jede unter ihrem Header. Sie ist für das Review von Änderungen gemacht, darunter die vorgeschlagenen Änderungen einer KI: Die Aktionen der App an jeder Änderung übernehmen sie oder verwerfen sie. Nur die sichtbaren Zeilen werden erzeugt, sodass eine lange Datei so flüssig scrollt wie eine kurze.

`DiffView` verantwortet das Verhalten und bringt ein eigenes Erscheinungsbild mit, das aus den Tokens des Themes aufgebaut ist: die `font-mono` des Themes mit 13pt in 20pt hohen Zeilen, Zeilennummern in `muted-foreground`, hinzugefügte Zeilen grün und gelöschte rot getönt, die geänderten Wörter in einer stärkeren Tönung, ein Balken am Rand der Gutter bei jeder geänderten Zeile und Trennzeilen auf `muted`. Jeder Teil übernimmt die Styles der App anstelle dieser Standardwerte (`classes` und `styles`). In Rust erzeugt man eine Instanz mit `nsh_base::diff_view()`, in TSX mit `<DiffView>` aus `nsh/base`.

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

Die Ansicht füllt die Box, die die App ihr gibt (`flex-1`, eine Höhe), und scrollt darin: vertikal durch die Zeilen und seitwärts bis zur längsten Zeile, wobei beide Seiten einer Split-Ansicht gemeinsam scrollen. Mit `softWrap` werden lange Zeilen an der Breite der Seite umbrochen, und eine Split-Zeile ist so hoch wie ihre höhere Seite, sodass die Seiten ausgerichtet bleiben.

<a id="two-texts-or-a-patch"></a>

## Zwei Texte oder ein Patch

- **Zwei Texte**: `oldValue` und `newValue`. Die Zeilen werden unverändert verglichen, ein hinzugefügter oder entfernter abschließender Zeilenumbruch ist also eine Änderung, wie git es zeigt.
- **Ein Patch**: `patch`, ein Unified Diff einer oder mehrerer Dateien (`git diff`, `git format-patch`, `diff -u`; Umbenennungen, Modi, neue, gelöschte und binäre Dateien sowie eine vorangestellte Commit-Nachricht werden so gelesen, wie git sie schreibt). Die Ansicht zeigt die Zeilen der Hunks, nummeriert wie in der Datei, jeden Hunk unter einer Trennzeile mit seinem Header (der Funktion, in der er liegt), und jede Datei eines Patches mit mehreren Dateien unter einem eigenen Header ([Dateien eines Patches](#files-of-a-patch)). Der Pfad jeder Datei bestimmt ihre Sprache, wenn `language` nicht gesetzt ist.

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

`language` benennt die Sprache wie bei `Editor`: einen Namen, einen Alias, eine Erweiterung oder einen Dateinamen (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## Dateien eines Patches

Ein Patch mit mehreren Dateien zeigt jede Datei unter einer Header-Zeile: standardmäßig ihren Pfad (`old → new` bei Umbenennung), die Anzahl ihrer hinzugefügten und gelöschten Zeilen und `▾`. Drücken auf den Header klappt die Datei auf ihren Header zusammen (`▸`) oder wieder auf. `renderFileHeader` zeichnet die Header auf die Art der App (und zeigt auch über einem Patch mit nur einer Datei einen) und übergibt ihnen die Datei (`DiffFile`): `index`, `path`, `oldPath` (umbenannt oder kopiert von), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (der Patch zeigt keine Zeilen davon), `added`, `deleted`, `hunks`, `firstHunk` und `collapsed`. Der Header der App ruft `toggleFile(path)` der Ref auf; `collapseFile` und `expandFile` legen den Zustand fest, und jede Änderung wird mit `onFileToggle({ file })` gemeldet. Eine eingeklappte Datei bleibt eingeklappt, solange ein neues `patch` sie noch enthält.

Änderungen werden dateiübergreifend der Reihe nach gezählt: Die Änderungen einer Datei liegen in `firstHunk` bis `firstHunk + hunks - 1`, die `goToHunk`, `renderHunkActions` und `hunks()` verwenden (bei einem `DiffHunk` ist `file` der Index seiner Datei, und seine Zeilen zählen in dieser Datei), und `stats()` summiert die Änderungen aller Dateien. `goToHunk` klappt zuvor eine eingeklappte Datei auf.

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

## Layout und Änderungen innerhalb von Zeilen

`layout` ist `"split"` (Standard: nebeneinander, jede gelöschte Zeile neben der ähnlichsten hinzugefügten Zeile) oder `"unified"` (eine Spalte, die gelöschten Zeilen einer Änderung über ihren hinzugefügten Zeilen, mit beiden Zeilennummern). `inline` legt fest, was innerhalb einer geänderten Zeile hervorgehoben wird:

| `inline` | Was hervorgehoben wird |
|---|---|
| `"wordAlt"` (Standard) | Die geänderten Wörter, verbunden, wenn sie ein Zeichen auseinanderliegen, sodass eine geänderte Phrase als eine gelesen wird |
| `"word"` | Jedes geänderte Wort |
| `"char"` | Jedes geänderte Zeichen |
| `"none"` | Nichts: nur die Tönung der Zeilen |

Wörter sind Folgen aus Buchstaben, Ziffern und `_`; jedes CJK-Zeichen, jedes Kana und jede Hangul-Silbe ist ein eigenes Wort, sodass ein geändertes Zeichen in einem Satz nur sich selbst markiert. Eine Zeile, die sich fast vollständig geändert hat, zeigt nur ihre Tönung.

`indicators` markiert geänderte Zeilen neben ihren Nummern: `"bars"` (Standard, ein Balken am Rand der Gutter), `"classic"` (`+` und `−` vor dem Text) oder `"none"`. `background={false}` lässt die geänderten Zeilen ungetönt, und `lineNumbers={false}` blendet die Nummern aus.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Eingeklappte Zeilen

Um jede Änderung werden `contextLines` unveränderte Zeilen angezeigt (standardmäßig 3); die unveränderten Zeilen zwischen Änderungen sowie vor der ersten und nach der letzten werden zu einer Trennzeile zusammengeklappt, die angibt, wie viele Zeilen sie verbirgt. Drücken zeigt sie alle. `expandAll` zeigt jede Zeile; `expand`, `expandAll()` und `collapseAll()` der Ref blenden sie aus der App ein und klappen sie wieder zusammen.

`renderSeparator` zeichnet die Trennzeilen auf die Art der App. Es erhält die Trennzeile (`DiffSeparator`): `gap`, den Index des eingeklappten Abschnitts (0 vor der ersten Änderung, `i` zwischen den Änderungen `i - 1` und `i`), `lines`, wie viele Zeilen sie verbirgt, `first` und `last`, und bei einem Patch den `header` des Hunks. `expand(gap, direction, lines)` zeigt `"all"` ihre Zeilen (Standard) oder `lines` (Standard 20) `"up"`, direkt über der Änderung unter der Trennzeile, oder `"down"`, direkt unter der Änderung darüber. Die erste Trennzeile klappt nach oben auf und die letzte nach unten.

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

## Änderungen übernehmen und verwerfen

`renderHunkActions` setzt die Aktionen der App oben rechts an jede sichtbare Änderung und übergibt ihnen die Änderung (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, Zeilen ab 0, und `file`, der Index ihrer Datei bei einem Patch). Sie rufen die Ref auf: `revertHunk(index)` setzt die alten Zeilen der Änderung zurück in den neuen Text, `acceptHunk(index)` macht ihre neuen Zeilen zum alten Text. Die Ansicht zeigt das Ergebnis sofort und meldet beide Texte mit `onChange({ change })` (`{ oldValue, newValue }`), die die App als Props setzt. Die Änderung einer KI Stück für Stück zu übernehmen oder zu verwerfen geht so:

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

Hier ist der alte Text die Datei, wie sie ist: Eine Änderung zu übernehmen wendet sie auf die Datei an (`onApply`), sie zu verwerfen nimmt sie aus dem Vorschlag heraus. Eine Ansicht mit einem `patch` zeigt Ausschnitte der Dateien, und ihre Änderungen bleiben, wie sie sind.

<a id="methods"></a>

## Methoden

`ref={diff}` liefert die Methoden der Ansicht (`DiffViewRef`). Methoden, die einen Wert zurückgeben (`hunks()`, `stats()`), geben in JS ein `Promise` davon zurück, man muss also mit `await` darauf warten: `const changes = await diff.hunks()`. Für Zähler, die auf dem Bildschirm angezeigt werden, meldet `onStatsChange` sie bei Änderungen. Eine Methode, der eine Änderung, eine Trennzeile oder eine Datei übergeben wird, die der Diff nicht hat, ändert nichts und protokolliert eine Warnung mit dem Namen der Methode und dem Wert.

| Methode | Beschreibung |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: die Änderungen, der Reihe nach. |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, die hinzugefügten und gelöschten Zeilen und die Anzahl der Änderungen. |
| `goToHunk(index)` | Scrollt Änderung `index` in den sichtbaren Bereich, ihre erste Zeile ganz oben. |
| `revertHunk(index)` | Setzt die alten Zeilen von Änderung `index` zurück in den neuen Text und meldet die Texte (`onChange`). |
| `acceptHunk(index)` | Macht die neuen Zeilen von Änderung `index` zum alten Text und meldet die Texte (`onChange`). |
| `expand(gap, direction?, lines?)` | Zeigt die Zeilen, die Trennzeile `gap` verbirgt: `"all"` (Standard) oder `lines` (Standard 20) `"up"` oder `"down"`. |
| `expandAll()` | Zeigt jede unveränderte Zeile. |
| `collapseAll()` | Klappt die unveränderten Zeilen wieder zusammen. |
| `nextHunk()` | `Promise<number \| null>`: scrollt die nächste Änderung nach oben und gibt ihren Index zurück (nach der letzten die erste). |
| `previousHunk()` | `Promise<number \| null>`: scrollt die vorherige Änderung nach oben und gibt ihren Index zurück (vor der ersten die letzte). |
| `currentHunk()` | `Promise<number \| null>`: die Änderung, zu der zuletzt gegangen wurde, solange die Ansicht dort bleibt, sonst die oben in der Ansicht oder die erste sichtbare. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: die an den Zeilennummern ausgewählten Zeilen. |
| `setSelectedLines(range)` | Wählt Zeilen einer Seite aus (`null`: keine), ohne `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>`: der Text der ausgewählten Zeilen. |
| `files()` | `Promise<DiffFile[]>`: die Dateien des Patches, der Reihe nach, mit ihren Zählern (keine bei zwei Texten). |
| `scrollToFile(path)` | Scrollt den Header der Datei bei `path` nach oben. |
| `collapseFile(path)` | Zeigt nur den Header der Datei bei `path`. |
| `expandFile(path)` | Zeigt die Zeilen der Datei bei `path` wieder. |
| `toggleFile(path)` | Klappt die Datei bei `path` zusammen oder klappt sie auf, wenn sie zusammengeklappt ist. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: wo jede Änderung in den Zeilen liegt, der Reihe nach ([Eine Übersichtsleiste](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: wie weit die Zeilen gescrollt sind (`x` ist 0). |
| `setScrollOffset(offset)` | Scrollt die Zeilen sofort zu `offset.y`, so weit sie gehen, wie ein Thumb dem Zeiger folgt, der ihn zieht. |

`nextHunk()` und `previousHunk()` setzen bei der Änderung fort, zu der sie gegangen sind, solange die Ansicht dort bleibt, und andernfalls vom Anfang der Ansicht aus, sodass eine Änderung nahe dem Ende, die nicht nach oben scrollen kann, trotzdem zählt. Schaltflächen für die nächste und vorherige Änderung, mit den Zählern aus `onStatsChange`:

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

## Eine Übersichtsleiste

`onScroll({ offset, contentSize, size })` meldet, wo die Zeilen sind, mit den Schlüsseln von [`Scroll`](./scroll.md): `offset.y`, wie weit sie gescrollt sind (die Zeilen scrollen vertikal, so breit wie die Ansicht, und die Seiten seitwärts für sich: `offset.x` ist 0), `contentSize`, die Größe aller Zeilen zusammen, und `size`, die des Viewports. Es feuert, sobald die Ansicht gelayoutet ist, und erneut, wann immer sich einer dieser Werte ändert: beim Scrollen der Zeilen, bei Größenänderung der Ansicht und wenn sich die Höhe der Zeilen ändert (andere Texte, `layout`, `softWrap`, eine auf- oder zugeklappte Datei oder Trennzeile, eine gelayoutete Annotation). `hunkBounds()` gibt an, wo jede Änderung in den Zeilen liegt (`DiffHunkBounds`: `{ index, bounds }`, `bounds` von der Oberkante ihrer ersten Zeile bis zur Unterkante ihrer letzten, mit den Annotationen darunter, über die Ansicht hinweg), und zwar die der angezeigten Änderungen: Die Änderungen einer eingeklappten Datei haben keine Zeilen. `onHunkBoundsChange({ hunkBounds })` liefert dieselbe Liste, sobald die Ansicht gelayoutet ist, und erneut, wann immer sich eine Änderung verschiebt oder ihre Größe ändert, auch wenn die Zeilen ihre Höhe behalten (eine geänderte Zeile wird zu einer anderen): Ein Lineal zeichnet seine Markierungen daraus, statt sie bei `onScroll` zu lesen. `scrollOffset()` liest, wie weit die Zeilen gescrollt sind, und `setScrollOffset({ x, y })` scrollt die Zeilen sofort zu `y`, sodass ein gezogener Thumb dem Zeiger im selben Frame folgt.

Zusammen ergeben sie eine Übersichtsleiste neben der Ansicht, wie Code-Editoren sie haben: eine Markierung für jede Änderung, einen Thumb über den sichtbaren Zeilen und ein Drücken oder Ziehen, das dorthin scrollt. Hier ist die Leiste so hoch wie die Ansicht:

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

Der `index` einer Markierung ist der der Änderung in `hunks()`, deren `oldLines` und `newLines` eine hinzugefügte Änderung (keine alten Zeilen) von einer gelöschten (keine neuen Zeilen) unterscheiden, um die Markierung einzufärben.

<a id="review-comments"></a>

## Review-Kommentare

Die Zeilennummern wählen Zeilen einer Seite aus: Ein Druck wählt eine Zeile aus, ein Shift-Druck erweitert die Auswahl bis dorthin, und Ziehen mit der Maus über die Nummern wählt die überfahrenen Zeilen aus. `onLineSelectionChange` meldet die Zeilen als `range` (`DiffLineRange`: `{ side, start, end }`, Zeilen ab 0, `null` für keine), und ein Druck auf eine Nummer meldet außerdem `onLineNumberPress({ line })` (`{ side, line }`). Die Ref liest die Auswahl (`selectedLines()`, `selectedText()`) und setzt sie.

`annotations` setzt den Inhalt der App unter Zeilen: Jede `{ id, side, line }` wird von `renderAnnotation` über die Seite ihrer Zeile gezeichnet (über die ganze Ansicht bei unified), so hoch, wie sie sich layoutet, und wird angezeigt, solange ihre Zeile angezeigt wird. `renderAddAnnotation` ist das Steuerelement der App zum Hinzufügen, rechts von der Gutter der Zeile, über der sich der Zeiger befindet, und der zuletzt ausgewählten Zeile; es erhält die ausgewählten Zeilen, wenn seine Zeile eine davon ist, sonst diese Zeile.

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

## Die Teile stylen

`class` und `style` stylen die Box der View. `classes` nimmt Tailwind-Klassen pro Part und `styles` Inline-Styles pro Part;
die Klassen eines Parts stehen nach dessen eigenen Default-Styles, sodass sie Vorrang haben, und dessen `styles` haben Vorrang vor seinen Klassen. Die Schrift wird
mit `fontFamily`, `fontSize` und `lineHeight` festgelegt.

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

| Part | Was es ist | Default |
|---|---|---|
| `side` | Jede Seite (split) oder die eine Spalte (unified) | Eine `border`-Linie zwischen den Seiten |
| `gutter` | Die Zeilennummern und Indikatoren einer Seite | |
| `lineNumber` | Jede Zeilennummer | Rechtsbündig, `muted-foreground` |
| `lineNumberAdded` | Die Nummern hinzugefügter Zeilen, nach `lineNumber` | |
| `lineNumberDeleted` | Die Nummern gelöschter Zeilen, nach `lineNumber` | |
| `content` | Der Text einer Seite, neben ihrem Gutter | 8pt vor und nach dem Text |
| `line` | Jede Zeile einer Seite | |
| `lineAdded` | Die Zeilen hinzugefügter Zeilen, nach `line` | Ein grüner Farbton |
| `lineDeleted` | Die Zeilen gelöschter Zeilen, nach `line` | Ein roter Farbton |
| `filler` | Die leere Hälfte einer Split-Zeile neben einer Zeile, die der anderen Seite fehlt | Eine dezente `muted`-Füllung |
| `wordAdded` | Die geänderten Wörter innerhalb einer hinzugefügten Zeile | Ein kräftigeres Grün |
| `wordDeleted` | Die geänderten Wörter innerhalb einer gelöschten Zeile | Ein kräftigeres Rot |
| `indicatorAdded` | Der Balken (`"bars"`) oder `+` (`"classic"`) einer hinzugefügten Zeile | Grün, 3pt breit |
| `indicatorDeleted` | Der Balken oder `−` einer gelöschten Zeile | Rot, 3pt breit |
| `separator` | Ein Trenner eingeklappter Zeilen oder der Hunk-Header eines Patches | `⋯` und die Anzahl auf `muted` |
| `hunkActions` | Die Box der Aktionen der App bei einer Änderung | Oben rechts bei der Änderung |
| `lineSelected` | Über den Zeilen der ausgewählten Zeilen ihrer Seite | Die Auswahlfarbe des Themes (wie die Auswahlen des `Editor`) |
| `annotation` | Die Box einer Annotation, unter ihrer Zeile | Über die Seite ihrer Zeile |
| `addAnnotation` | Die Box des Add-Controls, so breit wie das Gutter und eine Zeile hoch | Das Control an ihrem rechten Rand |
| `fileHeader` | Der Header einer Datei eines Patches | Der Pfad und die Anzahl auf `secondary`, eine `border`-Linie darunter |

## Props

| Prop | Rust | Typ | Default | Beschreibung |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | Der alte Text. |
| `newValue` | `.new_value(..)` | `string` | | Der neue Text. |
| `patch` | `.patch(..)` | `string` | | Ein Unified Diff einer oder mehrerer Dateien, der angezeigt wird, wenn `oldValue` und `newValue` nicht gesetzt sind. |
| `language` | `.language(..)` | `string` | Klartext (bei einem Patch: die Sprache jeder Datei) | Name, Alias, Erweiterung oder Dateiname einer Sprache. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Nebeneinander oder in einer Spalte. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | Was innerhalb geänderter Zeilen hervorgehoben wird. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | Wie geänderte Zeilen neben ihren Nummern markiert werden. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Unveränderte Zeilen, die um jede Änderung herum angezeigt werden. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Jede unveränderte Zeile wird angezeigt. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Die Zeilennummern. |
| `background` | `.background(..)` | `boolean` | `true` | Geänderte Zeilen werden eingefärbt. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` des Themes | Die Schrift des Textes. |
| `fontSize` | `.font_size(..)` | `number` | `13` | Die Schriftgröße in Punkt. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | Die Höhe einer Zeile in Punkt. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Zeichnet die Trenner eingeklappter Zeilen. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | Die Aktionen der App bei jeder Änderung. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Lange Zeilen werden an der Breite der Seite umbrochen. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | Der Inhalt der App unter Zeilen: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Zeichnet eine Annotation unter ihrer Zeile. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | Das Control der App zum Hinzufügen einer Annotation, neben der Zeile unter dem Mauszeiger und der zuletzt ausgewählten. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Zeichnet den Header jeder Datei eines Patches, eine Zeile hoch. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Tailwind-Klassen pro Part. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Inline-Styles pro Part, vor den Klassen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | | Die Box der View. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Eine Änderung wurde übernommen oder rückgängig gemacht: `{ change }`, die Texte jetzt (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Eine Zeilennummer wurde gedrückt: `{ line }`, ein `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | Die ausgewählten Zeilen haben sich geändert: `{ range }`, ein `{ side, start, end }` oder `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | Die Anzahlen haben sich geändert: `{ stats }`, ein `{ added, deleted, hunks }`. Es wird einmal ausgelöst, wenn die View erstellt wird, und erneut jedes Mal, wenn der Diff der Texte andere Anzahlen ergibt, etwa für eine Zeile „+8 −8 · 5 changes". |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Eine Datei des Patches wurde eingeklappt oder ausgeklappt (ihr Header oder die Ref): `{ file }`, der `DiffFile` jetzt. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | Die Zeilen wurden gescrollt, oder ihre Größe oder die des Viewports hat sich geändert: `{ offset, contentSize, size }`, wie bei einem `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` in Rust). Es wird einmal ausgelöst, sobald die View gelayoutet ist, und erneut, wenn sich eines davon ändert. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | Wo die Änderungen in den Zeilen liegen, hat sich geändert: `{ hunkBounds }`, die Liste, die `hunkBounds()` liefert. Es wird einmal ausgelöst, sobald die View gelayoutet ist, und erneut, wenn eine Änderung sich verschiebt oder ihre Größe ändert, egal ob die Zeilenhöhe gleich bleibt oder nicht, etwa für die Markierungen eines Overview Rulers. |

<a id="related"></a>

## Verwandte Themen

- [Editor](./editor.md): der Code-Editor, dessen Syntaxfarben und Sprachen `DiffView` verwendet.
- [TextView](./text-view.md): Dokumente aus Markdown und HTML, für den Text rund um ein Review.
- [`nsh/base`](../modules/nsh-base.md): die anderen Basiskomponenten.
