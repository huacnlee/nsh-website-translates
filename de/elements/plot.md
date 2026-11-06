---
title: "Plot"
description: "Die Komponente Plot aus nsh/base/plot, ihre Marks Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey und Treemap sowie ihre PlotAxis und PlotLabel: Diagramme, die nativ aus den Zeilen der App gezeichnet werden, mit den Skalen der Achsen und ihren Beschriftungen, Texten an Datenpunkten, der Zeile, Zelle oder dem Segment unter dem Zeiger, Bewegung und ohne eigenes Erscheinungsbild."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Ein Plot ist der Rahmen eines Diagramms: die Zeilen an Daten, die er zeigt, die Skalen seiner x- und y-Achse, der Zeiger darüber und dessen Bewegung. Seine Marks zeichnen, was er enthält: ein `Line` durch eine Serie, ein `Area` zwischen einer Serie und einer Basislinie, ein `Bar` pro Zeile in den Bändern einer Band-Skala, ein `Rule` pro Zeile von einem Anfang bis zu einem Ende (der Docht einer Kerze), ein `Dot` pro Zeile, wo sich zwei ihrer Werte treffen (die Punkte eines Streudiagramms, die Blasen eines Blasendiagramms), ein `Cell` pro Zeile in den Bändern zweier Kategorien, eingefärbt nach seinem Wert (eine Heatmap), ein `Grid` aus Linien quer darüber, ein `Pie` aus den Anteilen der Zeilen (ein Donut mit einem Loch), ein `Arc` zwischen zwei Winkeln und ein `RadialLine` um den Mittelpunkt, mit den Ringen und Speichen eines `RadialGrid` dahinter (ein Radar), ein `Sankey` aus Flüssen zwischen den Zeilen und ein `Treemap` aus verschachtelten Rechtecken, wobei die Fläche jedes Blatts seinem Wert entspricht (eine Market Map); ein `PlotAxis` beschriftet einen Rand mit den Ticks seiner Skala, und ein `PlotLabel` schreibt Texte an Punkte der Skalen. Jeder Mark ist ein Canvas, das den Plot ausfüllt und nativ aus den Zeilen gezeichnet wird: Die Zeilen der App werden einmal gelesen, wenn sie sie setzt, und dann in Rust skaliert, aufgezeichnet und gezeichnet, sodass ein Diagramm mit tausend Punkten kein JS pro Punkt ausführt. Auch der Zeiger wird in Rust verfolgt: Die Cross Line, die Punkte und der Tooltip des Hovers bewegen sich und blenden auf dem Animator der Plattform ein und aus, und die App erfährt nur von einer neuen Zeile, mehr nicht. Das Aussehen bestimmt die App: Marks malen mit den Paint-Properties von CSS für SVG-Formen (`stroke-*`, `fill-*`), `currentColor`, wo keine gesetzt ist; eine Fläche oder ein Balken zeigt innerhalb ihrer Form einen Hintergrund (einen Verlauf, `bg-linear-*`), und die Teile des Hovers (darunter der Punkt jedes Marks) sowie die Beschriftungen, Tick-Marken und Linien der Achsen gestaltet und befüllt die App.

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` und `PlotLabel` stammen aus `nsh/base/plot`, einem eigenen Modul von [`nsh/base`](../modules/nsh-base.md) (in Rust `nsh_base::plot`). In TypeScript sind die Props eines Plots generisch über den Typ seiner Zeilen: Feldnamen werden dagegen geprüft, und eine Funktion einer Zeile erhält den Typ der Zeile. In Rust erzeugt `plot()` einen Plot mit einem Setter pro Prop, die Zeilen sind ein `Rows` (Spalten von Zahlen nach Schlüssel), die Werte ein `RowAccessor` (ein Schlüssel oder eine Funktion des Zeilenindex), und die Marks nehmen die typisierten Paint-Methoden entgegen (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`).

## Plot

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (erforderlich) | Die Zeilen, ein Objekt pro Punkt. Die Marks lesen ihre Werte einmal, wenn die App die Zeilen setzt; eine Zeile ohne Wert (ein Feld, das keine Zahl ist, `null`) wird übersprungen. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | der Index der Zeile | Was eine Zeile bei einer `linear`-x-Skala entlang der x-Achse platziert. Eine `point`-Skala platziert die Zeilen der Reihe nach. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | keiner | Was die Marks zeichnen, sofern sie nicht ihren eigenen Wert angeben. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | Wie die x-Achse Zeilen platziert: `point` (der Reihe nach, gleichmäßig vom linken zum rechten Rand; eine einzelne Zeile in der Mitte), `linear` mit einer optionalen `domain` oder `band` (ein Band pro Zeile, für Balken, [Bar](#bar); oder ein Band pro Kategorie, für Zellen, [Cell](#cell)). Mit einer `band`-y-Skala ist der Standard `linear`, für querliegende Balken. `reverse: true` lässt sie vom rechten Rand aus laufen ([Umgekehrte Skalen](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | Wie die y-Achse Werte platziert: der kleinste Wert der Domain am unteren Rand, der größte am oberen. Ohne `domain` gilt der Umfang dessen, was die Marks zeichnen. `band` legt ein Band pro Zeile vom oberen Rand abwärts an, für querliegende Balken. `reverse: true` lässt sie andersherum laufen: der kleinste Wert am oberen Rand, die Zeilen vom unteren Rand aufwärts ([Umgekehrte Skalen](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | keine | Eine zweite y-Skala, `{ type: "linear", domain?, reverse? }`, für die Marks, die sie angeben (`scale="y2"`): die rechte Skala eines Diagramms mit zwei Achsen ([Duale Achsen](#dual-axes)). Ohne `domain` gilt der Umfang der Werte darauf. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | Solange keine der beiden y-Skalen eine Domain angibt und auf beiden Marks liegen, werden beide auf dieselben runden Schritte erweitert, sodass ihre Ticks auf denselben Linien liegen ([Duale Achsen](#dual-axes)). `false` belässt jeder Skala den Umfang ihrer Werte. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | Der Plot folgt dem Zeiger und der Tastatur: Er meldet die Zeile darunter und zeigt die Teile des Hovers, und er ist ein Tab-Stopp, dessen Pfeiltasten den Hover bewegen ([Tastatur](#keyboard)). `false` zeichnet nur die Marks (eine Sparkline in einer Liste), und Klicks darauf gehen an die umgebenden Views. Ob der Plot die Tastatur überhaupt anbietet, wird beim Erstellen festgelegt. |
| `motion` | `.motion(..)` | `PlotMotion` | keine | Das Timing des Appear, das Ein- und Ausblenden des Hovers und die Feder, auf der der Hover gleitet, wenn die Tasten ihn bewegen (siehe unten). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | keiner | Aktiviert das Appear: Die Marks werden eingezeichnet, wenn der Plot erstmals angezeigt wird, und erneut, sobald sich dieser Wert ändert (ein anderes Symbol, ein anderer Zeitraum). Innerhalb eines [`PlotAppearScope`](#plotappearscope) wird eine Generation, die dort abgeschlossen wurde, sofort vollständig angezeigt. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader über das Diagramm sagen: was es zeigt und was hervorsticht. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | keiner | Was Screenreader als seinen Wert hören: die Worte der App für die Zeile unter dem Zeiger. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Die Cross Line: eine View, so hoch wie der Plot, zentriert auf der Zeile unter dem Zeiger. Bei einer Band-Skala liegt sie im Band der Zeile und ist so breit wie das Band (bei einer Band-y-Skala quer über den Plot). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Die Punkte des Hovers: eine View pro `Line`, `Area` und `RadialLine`, zentriert auf ihrem Punkt bei der Zeile unter dem Zeiger; die eines `Dot` ist so groß wie sein Punkt unter dem Zeiger. `hoverDotClass` / `hoverDotStyle` eines Marks ersetzen sie für seinen eigenen Punkt. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | keiner | Der Tooltip der App, platziert durch `tooltipPlacement` und mit der Cross Line bewegt und ein- und ausgeblendet. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | Wohin der Tooltip kommt: an den oberen Rand des Plots, zentriert auf der Cross Line; oder neben den Zeiger, auf die Seite der Cross Line zur Mitte des Plots hin und in der oberen Hälfte unter den Zeiger, in der unteren darüber. Am oberen Rand bleibt er zwischen dem linken und dem rechten Rand des Plots (sein Abstand vom oberen Rand ist Sache der App: ein Tag unter dem Plot nimmt die Höhe des Plots und mehr); neben dem Zeiger bleibt er innerhalb des Plots. Mit der Tastatur kommt er neben den Punkt der ersten Linie oder Fläche bei der Zeile (die Mitte des Bands eines Balkens, die Mitte des Segments eines Kreisdiagramms). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | Der Abstand zwischen dem Tooltip und dem, was ihn platziert: der obere Rand bei `"top"`, die Cross Line und der Zeiger bei `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | keine | Die Farben der Marks: nach den Kategorien, die ihr `color` liest, wie bei d3s `scaleOrdinal` (`{ type: "ordinal", domain?, range, unknown? }`, [Farben nach Kategorie](#colors-by-category)), oder nach den Zahlen, die das `value` eines `Cell` liest, entlang einer Rampe, wie bei d3s `scaleSequential` und `scaleDiverging` (`{ type: "sequential" \| "diverging", … }`, [Farben entlang einer Rampe](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | keine | Die Marks, der Reihe nach übereinander gezeichnet, und alles, was die App darüberlegt. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Größe und Aussehen des Plots; die Marks erben seine Paint-Properties, so wie CSS sie vererbt. Die Klassen `focus:` / `focus-visible:` und `focusStyle` zeichnen seinen Fokusring. |

| Event | Rust | Payload | Zeitpunkt |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | Der Zeiger kam über eine andere Zeile: der Index der Zeile, die ihm entlang der x-Achse am nächsten liegt (entlang der y-Achse, wenn nur sie Bänder hat), des Segments des [pie](#pie-and-arc) darunter, des [dot](#dot), dessen Mittelpunkt ihm am nächsten liegt, der [cell](#cell) darunter (über der Lücke zwischen zwei Zellen die nähere) oder der Zeile einer [radial line](#radialline-and-radialgrid), die ihm nach Winkel am nächsten liegt; `null`, sobald er den Plot verlässt (über einem Pie seine Segmente; über einer Radial Line ihr äußerer Radius). |

`Scale` is `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
Die `domain` einer Skala ist der Umfang ihrer beiden Werte, in beliebiger Reihenfolge; eine Domain aus einem Wert setzt ihn in die Mitte. Die `domain` einer `band`-Skala sind die Kategorien ihrer Bänder, der Reihe nach ([Cell](#cell)); ihre anderen Optionen stehen unter [Bar](#bar).

Eine Funktion einer Zeile (`y={(d) => d.high - d.low}`) wird einmal pro Zeile aufgerufen, wenn sich die Zeilen oder die Funktion ändern, im nächsten Turn, nie während der Plot zeichnet oder dem Zeiger folgt: Halte sie pur (dieselbe Zeile, dieselbe Zahl). Ein Feldname wird ganz ohne JS gelesen.

<a id="reversed-scales"></a>

### Umgekehrte Skalen

`reverse: true` lässt eine Skala von ihrem anderen Rand aus laufen, so wie die Skalen von visx `reverse` und die von d3 einen rückwärts geschriebenen Range annehmen. Auf der x-Achse liegt die erste Zeile oder der kleinste Wert der Domain am rechten Rand; auf der y-Achse liegt der kleinste Wert der Domain am oberen Rand, und die Zeilen laufen vom unteren Rand aufwärts. Alles, was auf der Skala platziert wird, folgt ihr: die Marks, die Basis der Balken und die Richtung, in die sie wachsen, die Basislinie einer Fläche, die Gitterlinien, die `PlotAxis`-Ticks, die Zeile, die der Hover findet, die Pfeiltasten ([Tastatur](#keyboard)) und die Übergänge zu einer neuen Domain. Balken hängen bei einer umgekehrten `linear`-y-Skala vom oberen Rand herab, und querliegende Balken wachsen bei einer umgekehrten `linear`-x-Skala vom rechten Rand nach links:

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

Beim Appear des Plots werden Linien und Flächen von dem Rand aus eingezeichnet, an dem die x-Skala beginnt, bei einer umgekehrten also vom rechten.

<a id="dual-axes"></a>

### Duale Achsen

<!-- demo: el-plot-dual -->

Ein Plot hat eine zweite y-Skala für Werte anderer Einheiten: Volumen neben einem Preis, Umsatz neben einer Marge. Jeder Teil, der Werte entlang y platziert, nimmt `scale` an: `"y"` (der Standard, die `yScale` des Plots) oder `"y2"` (seine `y2Scale`). Eine `PlotAxis` rechts beschriftet sie mit `scale="y2"`:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

Die Domain jeder Skala gehört ihr allein: die `domain` der App oder der Umfang der Werte darauf, und jede wechselt mit `motion.update` zu einer neuen. Solange keine der beiden Skalen eine Domain angibt, legt der Plot beide in derselben Anzahl runder Schritte aus (1, 2 oder 5 mal eine Zehnerpotenz, ein Schritt für etwa je 32 Punkte Höhe): Enthalten beide die Null, liegt die Null auf beiden auf derselben Linie; andernfalls gewinnt eine Skala, die bei null beginnt (Volumen), ihre zusätzlichen Schritte nach oben und eine andere (ein Preis) auf beiden Seiten. Die Ticks der Achsen sind diese Schritte, und ein `Grid` ohne `x` und `y` zeichnet seine Linien bei ihnen, sodass ein Gitter beiden Achsen dient. `alignTicks={false}` schaltet das ab; eine `domain`, die die App angibt, belässt beide Skalen, wie sie sind.

Der Hover findet eine Zeile; der Punkt jedes Marks sitzt auf seiner eigenen Skala, und die Anzeige ist Sache der App, die beide Werte der Zeile liest, die `onHoverChange` meldet. Balken auf beiden Skalen stehen in jedem Band nebeneinander, und ein `stack` stapelt nur die Balken auf seiner Skala. `y2Scale` ist linear: Ein Plot, dessen y-Achse Bänder hat, hat keine zweite y-Skala.
<a id="line-area-and-grid"></a>

## Line, Area und Grid

| Mark | Prop | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | `y` des Plots | Was gezeichnet wird: ein Punkt pro Zeile mit Wert; Zeilen ohne Wert werden übersprungen. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | die Zeilen des Plots | Zeilen einer eigenen Serie (andere x-Werte), die über das eigene `x` auf den Skalen des Plots platziert werden (ohne: der Index der Zeile). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | Wie die Punkte verbunden werden: als glatte Kurve, als gerade Segmente oder als Stufen, die jeden Wert bis zur nächsten Zeile halten. Die untere Kante einer Area folgt derselben Kurve. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Ein Punkt auf jedem Datenpunkt: eine auf ihm zentrierte View, deren Größe, Hintergrund und Rahmen von der App bestimmt werden. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` des Plots | Der Hover-Punkt auf dem Datenpunkt der Zeile unter dem Zeiger: der Punkt jeder Serie in ihrer eigenen Farbe. Jeder ersetzt den des Plots für dieses Mark (die Farbe des Marks über Größe und Ring des Plots); `hidden` zeigt keinen. |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | keiner | Sein Hintergrund: eine Box um seine Form (vom ersten bis zum letzten Punkt, vom höchsten Punkt bis zur Basislinie oder bei einem Band bis zum tiefsten Punkt der unteren Kante), deren Hintergrund (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) nur innerhalb der Form sichtbar ist, unter ihrem `fill`. Ist einer gesetzt, ist `fill` standardmäßig `none`. |
| `Area` | `y1` | `string \| (d, index) => number` | `y` des Plots | Was die obere Kante bildet. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | der untere Rand der y-Skala | Die untere Kante: Eine Zahl ist eine Basislinie auf der y-Skala; ein Feld oder eine Funktion liefert für jede Zeile einen eigenen unteren Wert, wodurch die Area zu einem Band wird (Tagestief bis Tageshoch, Spanne einer Prognose). Ohne Angabe schließt die Area an dem Rand ab, an dem die kleinsten Werte der y-Skala liegen: unten, bei einer umgekehrten Skala oben (eine Area, die von oben hängt). Eine Zeile ohne Wert an einer der beiden Kanten wird übersprungen. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | Die y-Skala, auf der seine Werte liegen: die `yScale` des Plots oder dessen zweite, `y2Scale` ([Duale Achsen](#dual-axes)). |
| `Grid` | `x` | `number[]` | keine | Wo die vertikalen Linien verlaufen, als Werte der x-Skala (Zeilenindizes bei einer `point`-Skala). |
| `Grid` | `y` | `number[]` | keine | Wo die horizontalen Linien verlaufen, als Werte der y-Skala. Ohne `x` und `y` folgen die Linien den Ticks ihrer Skala, dort, wo ein `PlotAxis` ohne `ticks` sie setzt (bei liegenden Balken entlang x). |
| `Grid` | `ticks` | `number` | Standard der Achse | Ungefähr, wie viele Linien ohne `x` und `y` gezeichnet werden, wie das `ticks` eines `PlotAxis`. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | keine | Die Kategorie seiner Zeilen, deren Farbe aus der `colorScale` des Plots stammt: Die Kategorie der ersten Zeile bestimmt die `stroke` der Line (die `fill` der Area), wo nichts anderes gesetzt ist ([Farben nach Kategorie](#colors-by-category)). |

Jedes Mark füllt den Plot und wird mit seinen [SVG-Paint-Eigenschaften](../modules/style-reference.md#svg-paint) gezeichnet, wobei seine eigenen Vorrang vor denen des Plots haben, so wie CSS sie vererbt:

| Mark | Zeichnet mit | Wo keine gesetzt ist |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 breit, durchgezogen |
| `Area` | `fill` (über seinem `background`-Teil); seine obere Kante `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (`none` neben einem Hintergrund); kein Strich |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 breit, durchgezogen; jede Linie auf ganzen Geräte-Pixeln, damit eine dünne scharf bleibt |

Die Werte, die eine `Line` oder eine `Area` zeichnet, bei einer Area auch ihr `y0` (die Basislinie oder der untere Wert jeder Zeile), bilden die Domain der y-Skala, wenn der Plot keine hat; die eines Grid tun das nicht. Ein Mark wird nur neu gezeichnet, wenn sich ändert, was es zeichnet (seine Zeilen, Werte, Kurve, die Größe oder Skalen des Plots, sein Paint); der Zeiger bewegt die Teile des Hovers und führt nie dazu, dass ein Mark neu gezeichnet wird.

Ein Band ist eine `Area`, deren `y0` die Zeilen liest: Ihre obere Kante verläuft durch `y1`, ihre untere Kante zurück durch `y0`, beide mit dem `curve` der Area, und das appear zeichnet beide von der Vorderkante her ein. Der Hover-Punkt sitzt auf der oberen Kante; eine `Line` darüber markiert den mittleren Wert:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` ist das von CSS, wie in einem Browser: eine Farbe. Ein Verlauf unter einer Line ist der Hintergrund einer Area, so wie eine Seite einen Verlauf in einer Form zeigt (ein `background-image` einer Box unter `clip-path`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` blendet vom höchsten Punkt der Area bis zu ihrer Basislinie aus, in den Tokens des Themes und den Farben des Appearance wie der Hintergrund jeder View.

## Bar

Ein `Bar` zeichnet pro Zeile einen Balken im Band der Zeile auf einer `band`-Skala: aufrecht auf einer Band-x-Skala, liegend auf einer Band-y-Skala (die x-Skala ist dann `linear`). Jeder Balken reicht von `base` bis zum Wert der Zeile auf der anderen Skala, sodass ein negativer Wert in die andere Richtung wächst; eine Zeile ohne Wert hat keinen Balken. Auf einer umgekehrten Wertskala wachsen die Balken von der oberen Kante nach unten oder von der rechten nach links, und eine umgekehrte Band-Skala setzt das Band der ersten Zeile nach rechts oder unten ([Umgekehrte Skalen](#reversed-scales)).

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

Balken außerhalb eines Stacks stehen in jedem Band nebeneinander, in der Reihenfolge der Marks; Balken mit demselben `stack` werden gestapelt, wobei der Balken jeder Zeile dort beginnt, wo der vorherige im Stack endet:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` des Plots | Was jeder Balken zeigt. |
| `base` | `number \| string \| (d, index) => number` | `0` | Der Wert, von dem die Balken auf der Wertskala aus wachsen: einer für alle Zeilen oder ein Feld oder eine Funktion, die jeder Zeile einen eigenen liefert, sodass jeder Balken von der Basis seiner Zeile bis zu ihrem Wert reicht (eine Zeile ohne Basis hat keinen Balken). Er zählt zur Domain. Ein Stack wächst Zeile für Zeile von der Basis seines ersten Balkens aus. |
| `stack` | `string` | keiner | Der Stack, dem er beitritt: Die Balken mit demselben `stack` werden der Reihe nach gestapelt (eine Zeile ohne Wert fügt nichts hinzu). |
| `scale` | `"y" \| "y2"` | `"y"` | Die y-Skala, auf der die Werte seiner aufrechten Balken liegen ([Duale Achsen](#dual-axes)); Balken auf beiden stehen nebeneinander, und ein Stack stapelt nur die Balken auf seiner Skala. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Der Radius jeder Ecke seiner Balken; `{ topLeft: 4, topRight: 4 }` rundet die Spitzen aufrechter Balken ab. Ein Radius, der größer als ein halber Balken ist, wird angepasst. |
| `stagger` | `number` | `0` | Mit dem appear des Plots starten die Balken nacheinander, Zeile für Zeile, über diesen Anteil davon (0 bis 0.95), wobei jeder in der restlichen Zeit wächst; 0 lässt sie gemeinsam wachsen. |
| `inactiveOpacity` | `number` | keine | Die Deckkraft seiner Balken abseits der Zeile unter dem Zeiger, solange der Zeiger über dem Plot ist, damit diese Zeile hervorsticht: Sie blendet mit dem Hover ein und aus und wandert mit ihm von Balken zu Balken. |
| `label` | `string \| (d, index) => string` | keiner | Der Text am Wertende jedes Balkens: ein Feld (sein Text oder seine Zahl) oder eine Funktion, die den von der App formatierten Text zurückgibt. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | keiner | Der `label`-Teil: ein auf dem Balken zentrierter Text, über dem Ende eines aufrechten Balkens (unter einem, der nach unten wächst), hinter einem liegenden Balken (vor einem, der zurückwächst). Sein Padding ist sein Abstand vom Balken. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | keiner | Sein Hintergrund: die Box jedes Balkens, deren Hintergrund (`bg-linear-to-t from-… to-…`, vom unteren Ende des Balkens bis zu seinem oberen) nur innerhalb des Balkens sichtbar ist, unter seinem `fill`. Ist einer gesetzt, ist `fill` standardmäßig `none`. |
| `color` | `string \| (d, index) => string` | keine | Die Kategorie jedes Balkens, deren Farbe aus der `colorScale` des Plots stammt: die `fill` des Balkens, wo nichts anderes gesetzt ist ([Farben nach Kategorie](#colors-by-category)). |

Die Band-Skala legt pro Zeile des Plots ein Band an, der Reihe nach, oder pro Kategorie ihres `domain`, wie es `scaleBand` von d3 tut:

| Option | Standard | Beschreibung |
|---|---|---|
| `domain` | keine | Die Kategorien seiner Bänder, der Reihe nach (`scaleBand().domain()` von d3): Ein [`Cell`](#cell) kommt in das Band der Kategorie seiner Zeile, und ein `PlotAxis` schreibt die Kategorie jedes Bands; eine doppelt geschriebene Kategorie behält ihren ersten Platz. Ohne Angabe sind die Bänder die Zeilen oder, über Zellen, die Kategorien, die die Zellen entlang der Achse benennen, in der Reihenfolge, in der die Zeilen sie liefern. |
| `paddingInner` | `0` | Der Abstand zwischen benachbarten Bändern, ein Anteil der Schrittweite jedes Bands (0 bis 1). |
| `paddingOuter` | `0` | Der Abstand vor dem ersten und nach dem letzten Band, ein Anteil einer Schrittweite. Die Hälfte von `paddingInner` setzt die Mitten der Bänder in gleichen Schritten über den Plot. |
| `maxBandWidth` | keine | Die maximale Breite eines Bands in Punkten: Wenige Bänder über einem breiten Plot bleiben schmal, jedes in der Mitte seines Platzes. |
| `bandCount` | die Zeilen | Die Bänder, für die die Achse angelegt wird, wenn es mehr als die Zeilen sind: Die Zeilen nehmen die vorderen ein und behalten ihre Breite und ihren Platz, wie Zeilen eintreffen. |
| `groupPadding` | `0` | Der Abstand zwischen den nebeneinander stehenden Balken in einem Band, ein Anteil des Platzes jedes Balkens. |
| `reverse` | `false` | Die Bänder laufen vom anderen Rand aus: das der ersten Zeile rechts an der x-Achse, unten an der y-Achse; die nebeneinander stehenden Balken in einem Band behalten ihre Reihenfolge. |

Ein Balken wird mit seinem `fill` gezeichnet (`fill-*`; vom Plot geerbt, wie CSS vererbt), mit `currentColor`, wo keiner gesetzt ist (die Farbe seiner Kategorie mit `color`), und zeigt keinen Hover-Punkt. Auf einer Band-Skala findet der Hover das Band unter dem Zeiger, und die Cross-Line des Plots sitzt in diesem Band, so breit wie es selbst: `crossLineClass="w-full h-full bg-foreground/5"` tönt das Band, `w-px` behält eine Linie in seiner Mitte. Die Werte und die Basis der Balken bilden die Domain der Wertskala, wenn der Plot keine hat. Mit dem appear des Plots wächst jeder Balken aus der Basis seines Stacks heraus; die Bewegung, das Ein- und Ausblenden und das Gleiten laufen auf dem Animator der Plattform, und der Zeiger führt nie dazu, dass ein Balken neu gezeichnet wird.

<a id="ranges"></a>

### Bereiche

<!-- demo: el-plot-ranges -->

Ist `base` ein Feld oder eine Funktion, umfasst jeder Balken zwei Werte seiner Zeile: den Schritt eines Waterfall vom laufenden Gesamtwert davor zu dem danach, den Körper einer Kerze von ihrer Eröffnung bis zu ihrem Schlusskurs, eine Aufgabe von ihrem Start bis zu ihrem Ende. Ein Balken wächst beim Erscheinen von seiner eigenen Basis aus, und sein Label sitzt an seinem Wertende, über einem Balken, der steigt, und unter einem, der fällt.

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

Ein Funnel besteht aus liegenden, zentrierten Balken: `base={(d) => -d.users / 2}` und `value={(d) => d.users / 2}` auf einer Band-y-Skala.

## Rule

Eine `Rule` zeichnet pro Zeile eine gerade Linie entlang der Wertachse, von `base` bis zum Wert der Zeile: in der Mitte des Bands der Zeile auf einer Band-Skala (quer über den Plot auf einer Band-y-Skala), am Platz der Zeile entlang der x-Achse auf einer Point- oder Linear-Skala. Der Docht einer Kerze, der Whisker eines Box-Plots, ein Fehlerbalken und der Stiel eines Lollipops sind Rules; ein Candlestick ist eine `Bar` über einem `Rule`:

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` des Plots | Wo jede Linie endet. Eine Zeile ohne Wert hat keine Linie. |
| `base` | `number \| string \| (d, index) => number` | `0` | Wo jede Linie beginnt: ein Wert für alle Zeilen (der Stiel eines Lollipops von der Nulllinie aus) oder ein Feld oder eine Funktion, die jeder Zeile einen eigenen liefert (das Tief einer Kerze). Er zählt zur Domain. |
| `scale` | `"y" \| "y2"` | `"y"` | Die y-Skala, auf der seine Werte liegen ([Duale Achsen](#dual-axes)). |
| `stagger` | `number` | `0` | Mit dem appear des Plots starten die Linien nacheinander, Zeile für Zeile, über diesen Anteil davon (0 bis 0.95), wobei jede in der restlichen Zeit von ihrem Start aus wächst. |
| `inactiveOpacity` | `number` | keine | Die Deckkraft seiner Linien abseits der Zeile unter dem Zeiger, solange der Zeiger über dem Plot ist, wie bei `Bar`. |
| `color` | `string \| (d, index) => string` | keine | Die Kategorie jeder Linie, deren Farbe aus der `colorScale` des Plots stammt: die `stroke` der Linie, wo nichts anderes gesetzt ist. |

Eine Rule wird mit ihrem `stroke` gezeichnet (`stroke-*`, `strokeWidth`, `strokeDasharray`; vom Plot geerbt, wie CSS vererbt), mit `currentColor`, wo keiner gesetzt ist, und zeigt keinen Hover-Punkt. Ihre Werte und ihre Basis bilden die Domain der Wertskala, wenn der Plot keine hat; sie wächst mit dem appear des Plots von ihrem Start aus und bewegt sich mit den Domains der Skalen, auf dem Animator der Plattform.
## Dot

<!-- demo: el-plot-dots -->

Ein `Dot` zeichnet pro Zeile einen Punkt dort, wo zwei Werte der Zeile zusammentreffen: ihr `x` entlang einer `linear`-x-Skala und ihr `value` auf der y-Achse ergeben ein Streudiagramm; auf einer Band-x-Skala sitzt jeder Punkt in der Mitte des Bands seiner Zeile; über einer Band-y-Skala (die x-Skala `linear`) verläuft sein Wert entlang von x und das Band seiner Zeile die Zeichnung hinab, ein Dot Plot. Sein Radius `r` ist entweder eine einzige Zahl für alle Punkte oder ein Wert jeder Zeile, den `rScale` in einen Radius umrechnet, ein Blasendiagramm. Eine Zeile ohne Wert hat keinen Punkt.

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

Wenn `r` ein Feld oder eine Funktion ist, bestimmt der Wert jeder Zeile die Größe ihres Punkts. `rScale={{ type: "sqrt", range: [min, max] }}` bildet die Quadratwurzeln der Werte auf Radien in Punkten ab, wie es `scaleSqrt` von d3 tut. Bei einem Bereich ab 0 ist daher die Fläche einer Blase proportional zu ihrem Wert; ein Bereich ab einem Wert über 0 hält auch die kleinsten Blasen sichtbar. Die Domain reicht von 0 bis zum größten Wert, sofern die Skala keine angibt. Die größeren Punkte werden zuerst gezeichnet, damit die kleineren darüber sichtbar bleiben:

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

Die Werte eines Dots bilden die Domain der Wertskala, wenn der Plot keine hat, ohne dabei die 0 einzubeziehen, sodass die Achsen eines Streudiagramms zu seinen Punkten passen. Gib dem Plot `domain`s mit etwas Spielraum um die Werte, wenn die Punkte groß sind: Eine Blase am Rand der Domain wird über den Rand des Plots hinaus gezeichnet.

Zwei Marks in denselben Bändern ergeben die Diagramme, die zwei Werte einer Zeile vergleichen: Ein Lollipop ist ein `Rule` von 0 unter einem `Dot` an seinem Wert, und ein Dumbbell ist über einer Band-y-Skala ein `Rule` von einem Wert zum anderen mit einem `Dot` an jedem Ende:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | der `y` des Plots | Wohin jeder Punkt entlang der Wertachse gehört: auf der y-Achse nach oben oder über einer Band-y-Skala entlang von x. Eine Zeile ohne Wert hat keinen Punkt. |
| `r` | `number \| string \| (d, index) => number` | `3` | Der Radius der Punkte in Punkten oder ein Feld bzw. eine Funktion, die jeder Zeile einen Wert gibt, den `rScale` in einen Radius umrechnet (ohne eine solche Skala ist der Wert der Radius). Eine Zeile, deren Wert fehlt, hat keinen Punkt. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | none | Wie die Werte von `r` zu Radien werden: ihre Quadratwurzeln über der `domain` (0 bis zum größten Wert, wenn keine angegeben ist) auf dem `range` der Radien, sodass ein Bereich ab 0 die Fläche jedes Punkts proportional zu seinem Wert macht. Werte außerhalb der Domain nehmen die Enden des Bereichs an. |
| `stagger` | `number` | `0` | Mit dem Appear des Plots beginnen die Punkte nacheinander, Zeile für Zeile, zu wachsen, verteilt über diesen Anteil davon (0 bis 0.95); 0 lässt sie gemeinsam wachsen. |
| `inactiveOpacity` | `number` | none | Die Deckkraft der übrigen Punkte, solange einer unter dem Zeiger oder den Tasten liegt: Sie blenden mit dem Hover ein und aus. |
| `color` | `string \| (d, index) => string` | none | Die Kategorie jedes Punkts, seine Farbe aus `colorScale` des Plots: der `fill` des Punkts, wo nichts anderes eine Farbe festlegt ([Farben nach Kategorie](#colors-by-category)). |
| `hitRadius` | `number` | `8` | Wie weit jenseits des Rands eines Punkts der Zeiger ihn noch findet: Von den Punkten innerhalb dieses Abstands findet der Zeiger den, dessen Mittelpunkt ihm am nächsten liegt (Voronoi-Zellen), sodass eine kleine Blase über einer großen um ihren eigenen Mittelpunkt herum gefunden wird. Die Zeile eines Dot Plots wird von überall entlang ihrer gefunden, wenn der Radius so groß wie eine Zeile ist. |
| `scale` | `"y" \| "y2"` | `"y"` | Die y-Skala, entlang der seine Werte verlaufen ([Doppelte Achsen](#dual-axes)); Punkte über einer Band-y-Skala legen ihre Werte entlang von x. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` des Plots | Der `hoverDot`-Part: eine View so breit und hoch wie der Punkt unter dem Zeiger, auf ihm zentriert. `rounded-full outline-2 outline-offset-1` umrandet ihn; `hidden` zeigt für diesen Mark keinen an. |

Ein Punkt wird mit seinem `fill` gefüllt (`fill-*`; vom Plot geerbt, so wie CSS erbt), mit `currentColor`, wo keiner gesetzt ist (die Farbe seiner Kategorie mit `color`), und mit seinem `stroke` umrandet, wo einer gesetzt ist (`stroke-*`, `strokeWidth`): Ein Ring in der Farbe der Card hält überlappende Punkte auseinander. Über einem Plot mit Punkten meldet der Plot die Zeile des Punkts, dessen Mittelpunkt dem Zeiger am nächsten liegt (`null` von jedem Punkt entfernt), die Tasten schalten in der Reihenfolge der Zeilen durch sie (sortiere die Zeilen nach x, und die Tasten gehen die Punkte von links nach rechts ab), und der `hoverDot`-Part markiert den Punkt. Mit dem Appear des Plots wachsen die Punkte aus dem Nichts; mit `motion.update` bewegen sie sich zu ihren neuen Werten und Größen, der Punkt einer neuen Zeile wächst ein und der Punkt einer entfernten Zeile schrumpft weg; alles auf dem Animator der Plattform, ohne dass ein Mark neu gezeichnet wird.

## Cell

<!-- demo: el-plot-cells -->

Eine `Cell` zeichnet pro Zeile ein Rechteck in zwei Bändern zugleich: dem Band ihrer `x`-Kategorie auf einer `band`-x-Skala und dem Band ihrer `y`-Kategorie auf einer `band`-y-Skala, sodass die Zeilen ein Raster bilden, eine Heatmap. Eine Korrelationsmatrix, ein Kalender monatlicher Renditen und eine Woche an Trades pro Stunde sind Cells. Jede Cell füllt ihre beiden Bänder, daher sind `paddingInner` und `paddingOuter` der Skalen die Abstände zwischen und um die Cells. Ihre Farbe ist ihr `value` entlang der `colorScale` des Plots, einer Farbrampe ([Farben entlang einer Rampe](#colors-along-a-ramp)), oder die ihrer `color`-Kategorie über eine ordinale Skala. Cells liegen auf den x- und y-Skalen des Plots.

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

Die `domain` einer Band-Skala nennt die Kategorien ihrer Bänder der Reihe nach, wie es `scaleBand().domain()` von d3 tut: die Monate eines Kalenders von Januar bis Dezember, jeder mit seinem Band, gleich ob seine Zeilen schon vorliegen oder nicht, sodass März 2026 oben eine leere Stelle im Raster ist. Ohne Domain sind die Bänder die Kategorien, die die Cells entlang der Achse nennen, in der Reihenfolge, in der die Zeilen sie bringen (2025 über 2026). Eine `PlotAxis` entlang einer Band-Skala von Kategorien schreibt die Kategorie jedes Bands, ohne `format`.

Eine Korrelationsmatrix nennt dieselben Holdings entlang beider Achsen, ihre `domain` ist der gesamte Wertebereich der Koeffizienten, sodass ein Koeffizient von 0 die Mitte der Rampe erhält, was auch immer die Holdings sind:

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | none | Die Spalte jeder Zeile: ein Feld (sein Text oder seine Zahl) oder eine Funktion, die die Kategorie zurückgibt. Die Cell der Zeile kommt in das Band dieser Kategorie der x-Skala; eine Zeile ohne Kategorie hat keine Cell. |
| `y` | `string \| (d, index) => string` | none | Die Reihe jeder Zeile, als `x` entlang der y-Skala. |
| `value` | `string \| (d, index) => number` | none | Die Zahl jeder Cell, die eine `sequential`- oder `diverging`-`colorScale` zu ihrer Farbe macht. Eine Zeile ohne Zahl erhält die `unknown`-Farbe der Skala und hat ohne diese keine Cell. |
| `color` | `string \| (d, index) => string` | none | Die Kategorie jeder Cell, ihre Farbe aus einer `ordinal`-`colorScale` ([Farben nach Kategorie](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Der Radius jeder Ecke ihrer Cells. |
| `stagger` | `number` | `0` | Mit dem Appear des Plots beginnen die Cells nacheinander, Zeile für Zeile, zu wachsen, verteilt über diesen Anteil davon (0 bis 0.95), jede für den Rest von ihrer Mitte aus; 0 lässt sie gemeinsam wachsen. |
| `inactiveOpacity` | `number` | none | Die Deckkraft der übrigen Cells und ihrer Labels, solange eine unter dem Zeiger oder den Tasten liegt: Sie blenden mit dem Hover ein und aus. |
| `label` | `string \| (d, index) => string` | none | Der `label`-Part: ein Text in der Mitte jeder Cell, ein Feld (sein Text oder seine Zahl) oder eine Funktion, die den Text zurückgibt, den die App formatiert. Jedes Label wird dort gezeigt, wo seine berechnete Größe in seine Cell passt, sodass ein schmaler Plot nur die Farben zeigt. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | none | Schrift, Größe und Farbe der Labels. Ein Label auf einer Cell mit dunkler `colorScale`-Farbe hat das Attribut `data-dark` (wo helle Schrift besser lesbar ist), sodass `data-dark:text-white` es dort hell schreibt. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | none | Der `hoverCell`-Part: eine View so groß wie die Cell unter dem Zeiger oder den Tasten, über ihr; `rounded-sm outline-2 outline-foreground` umrandet sie. Sie bewegt sich im selben Frame mit dem Zeiger und gleitet auf der `pointer`-Spring, wenn die Tasten sie bewegen. |

Eine Cell wird mit ihrer Farbe aus der `colorScale` des Plots gefüllt, wo die App kein `fill` setzt (`fill-*`-Klassen und -Styles haben Vorrang, vom Plot geerbt, so wie CSS sie erbt), mit `currentColor`, wo nichts eines setzt, und mit ihrem `stroke` umrandet, wo einer gesetzt ist. Über einem Plot mit Cells meldet der Plot die Zeile der Cell unter dem Zeiger, und über dem Abstand zwischen zwei Cells die nähere; die Pfeiltasten schalten über das Raster auf dem Bildschirm ([Tastatur](#keyboard)), und Screenreader durch die Zeilen in ihrer Reihenfolge. Mit dem Appear des Plots wachsen die Cells aus ihrer Mitte; mit `motion.update` gleitet die Farbe einer Cell zu ihrer neuen, die Cell einer neuen Zeile wächst ein, die Cell einer entfernten Zeile schrumpft weg, und Cells wandern in ihre neuen Bänder; alles auf dem Animator der Plattform, ohne dass ein Mark neu gezeichnet wird.
<a id="pie-and-arc"></a>

## Pie und Arc

Ein `Pie` teilt eine volle Drehung in ein Segment pro Zeile auf, jeweils im Anteil des Zeilenwerts an der Summe aller Werte, im Uhrzeigersinn ab 12 Uhr in der Reihenfolge der Zeilen, um den Mittelpunkt des Plots. Ein `innerRadius` macht daraus ein Donut. Jedes Segment ist eine eigene Canvas, der `slice`-Part, und wird daher mit eigenen Klassen gezeichnet: `sliceClass` sind auf jedem Segment dieselben Klassen, oder eine Funktion der Zeile des Segments, die jedem Segment eigene Klassen gibt. Über einem Pie meldet der Plot die Zeile des Segments unter dem Zeiger (keine im Loch oder außerhalb des Rings), sein Tooltip folgt dem Zeiger, und dieses Segment wächst um `hoverLift`, während die anderen um `hoverDim` verblassen, auf dem Animator der Plattform mit der `motion` des Plots. Ein `Arc` zeichnet einen Sektor zwischen zwei Winkeln: die Spur und den Wert eines Gauge oder einen Ring hinter einem Pie.

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| Mark | Prop | Rust | Type | Default | Description |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | the plot's `y` | Was jede Zeile wert ist. Eine Zeile mit dem Wert null, einem negativen Wert oder ohne Zahl hat kein Segment. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radians) | `0`, `2 * Math.PI` | Wo das erste Segment beginnt und das letzte endet (bei einem Arc seine Enden): Bogenmaß ab 12 Uhr, im Uhrzeigersinn. Ein `endAngle` kleiner als `startAngle` ordnet die Segmente eines Pie in die andere Richtung an. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (radians) | `0` | Der Winkel zwischen benachbarten Segmenten am äußeren Rand. Jede Lücke behält diese Breite (etwa `padAngle * outerRadius` Punkte) bei jedem Radius, ihre Kanten verlaufen parallel, sie ist also in der Mitte oder am Loch so breit wie am Rand; ein Segment, das zu schmal ist, um die Mitte zu erreichen, endet dort, wo sich seine Kanten treffen. Ein Pie mit einem einzigen Segment hat keine Lücke. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Die Radien des Lochs und des Rands: in Punkten oder als Prozentsatz des größten Kreises, den der Plot fasst (die Hälfte seiner kürzeren Seite). |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | Der Radius der Ecken jedes Segments (bei einem Arc seiner Ecken), in Punkten, wie bei d3s `arc.cornerRadius`: Jede Ecke ist ein Kreis, der die Kante und den äußeren Rand oder das Loch berührt, einschließlich der parallelen Kanten der Lücken. Er beträgt höchstens die halbe Dicke des Rings, was einem Arc runde Enden gibt; bei einem Segment, das für zwei ganze Ecken zu schmal ist, treffen sich diese in seiner Mitte. Ein vollständiger Ring behält nur seine runden Kanten. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | none | Die Klassen jedes Segments (`fill-*`, `stroke-*`): auf jedem Segment dieselben, oder eine Funktion der Zeile des Segments und ihres Index, die einmal pro Zeile aufgerufen wird, wenn sich die Zeilen oder die Funktion ändern. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | none | Der Stil jedes Segments, über seinen Klassen (`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | Wie weit das Segment unter dem Zeiger über die anderen hinauswächst, in Punkten: auf der `pointer`-Spring des Plots, mit dem Hover ein- und ausgeblendet. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0 to 1) | `0` | Wie stark die anderen Segmente verblassen, solange eines unter dem Zeiger liegt, als Anteil ihrer Deckkraft, mit dem Überblenden des Hovers. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | none | Die Kategorie jedes Segments, seine Farbe aus der `colorScale` des Plots: das `fill` des Segments, wo nichts anderes gesetzt ist ([Farben nach Kategorie](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | none | Der Text neben jedem Segment: ein Feld (seine Zahl) oder eine Funktion, die den von der App formatierten Text zurückgibt. Eine Zeile mit leerem Text oder ein Segment, das schmaler als ein halbes Grad ist, hat keinen. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | none | Der `label`-Part: ein Text außerhalb des Rings am Ende seiner Hilfslinie, darauf zentriert, auf der rechten Hälfte des Pie dahinter und auf der linken davor. Sein Padding ist sein Abstand vom Ende der Linie. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | Wie weit die Labels jenseits des Rands sitzen, in Punkten. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | none | Der `labelLine`-Part: die Hilfslinie jedes Labels, vom Rand in der Mitte des Segments hinaus zum Radius des Labels, dann quer zum Text. Ihre `stroke` (`currentColor`, wo keine gesetzt ist), `strokeWidth` und `strokeDasharray`, auf jeder Linie dieselben oder eine Funktion der Zeile des Segments; sie wird angezeigt, sobald sie gestylt ist. |

Ein Segment und ein Arc werden mit `fill` gefüllt (`currentColor`, wo keines gesetzt ist, bei einem Segment die Farbe seiner Kategorie mit `color`) und an ihren Kanten mit `stroke` umrandet (keine, wo keine gesetzt ist), jeweils ihr eigener Wert vor dem des Pie und des Plots, wie CSS sie vererbt: Eine Umrandung in der Farbe der Fläche (`stroke-card stroke-2`) schneidet auch Lücken zwischen die Segmente. Ihre Werte gehen nicht in die Skalen des Plots ein. Die Segmente eines Pie werden nur neu gezeichnet, wenn sich die Zeilen, ihre Werte, die Winkel, die Radien oder die Größe des Plots ändern; der Zeiger bewegt das Anheben und das Verblassen auf dem Animator.

Plots mit einem Pie platzieren den Tooltip meist am Zeiger (`tooltipPlacement="pointer"`), da die Zeilen eines Pie keinen Platz entlang einer Achse haben: Die Fadenkreuzlinie und der Tooltip folgen darüber dem Zeiger, und es werden keine Hover-Punkte angezeigt. Die Mitte eines Donuts ist ein eigenes Element der App, das über den Plot gelegt wird (der Wert des überfahrenen Segments oder die Summe), und ebenso seine Legende, mit jedem Schlüssel in der Farbe seines Segments.

Die Labels eines Pie benennen seine Segmente außerhalb des Rings: Jeder Text sitzt `labelGap` jenseits des Rands in Richtung der Mitte seines Segments (der Schwerpunkt des Segments bei diesem Radius), dann quer zu diesem Radius auf der Seite des Pie, auf der das Segment liegt, und eine gestylte Hilfslinie verbindet ihn mit dem Rand. Die Labels schwenken beim Appear des Plots mit ihren Segmenten ein und blenden über dessen Ende ein, bewegen sich mit ihnen auf `motion.update` und werden mit dem überfahrenen Segment angehoben; alles läuft auf dem Animator der Plattform. Geben Sie dem Plot Platz dafür: ein `outerRadius` unterhalb von `"100%"` oder Raum um den Plot. Eigener Inhalt der App an einem Segment ist ein Element, das über den Plot gelegt wird, wie die Mitte eines Donuts.

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## Farben nach Kategorie

Die `colorScale` eines Plots gibt Kategorien ihre Farben, wie d3s `scaleOrdinal`, und das `color` eines Marks benennt die Kategorie jeder Zeile: ein Feld (sein Text oder seine Zahl) oder eine Funktion der Zeile. Die Kategorien der `domain` erhalten der Reihe nach die Farben der `range`, und der Bereich beginnt wieder bei seiner ersten Farbe, wenn die Domain länger ist. Eine Kategorie außerhalb der Domain erhält `unknown`; ohne diese tritt sie der Domain bei, sobald ein Mark ihr zum ersten Mal begegnet (die Marks der Reihe nach, jeweils ihre Zeilen der Reihe nach), und erhält die nächste Farbe, sodass bei völligem Fehlen eines `domain` die Kategorien die Farben in der Reihenfolge erhalten, in der die Zeilen sie liefern. Die Farben gehören der App: CSS-Farben, darunter auch die Tokens des Themes.

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

Ein Segment, ein Balken und ein Punkt erhalten die Farbe ihrer Zeile; ein `Line` und ein `Area` sind jeweils eine Serie und erhalten die Farbe ihrer ersten Zeile, sodass eine Linie mit eigenen Zeilen (`data`) in der Farbe ihrer Zeilen erscheint, und eine Skala hält die Farbe einer Kategorie über ein Pie, Balken und Linien hinweg gleich. Die Farbe ist das `fill` des Marks (bei einer Linie ihr `stroke`), wo nichts anderes gesetzt ist, anstelle von `currentColor`: Die Klassen und Stile der App haben Vorrang, dann die des Parts (`sliceClass`, `sliceStyle`), die des Marks und die, die es vom Plot erbt, sodass `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` ein einzelnes Segment abhebt, während die Skala die anderen färbt. Neben einem `background`-Part bleibt das `fill` eines Balkens und einer Fläche `none`.

| `OrdinalScale` | Type | Default | Description |
|---|---|---|---|
| `type` | `"ordinal"` | (required) | Die Art der Skala. |
| `domain` | `string[]` | none | Die Kategorien, der Reihe nach. Eine doppelt angegebene Kategorie behält ihren ersten Platz. |
| `range` | `string[]` | (required) | Die Farben, der Reihe nach (CSS-Farben); Kategorie `i` erhält Farbe `i % range.length`. |
| `unknown` | `string` | none | Die Farbe jeder Kategorie außerhalb der Domain; ohne diese erhält jede die nächste Farbe. |

<a id="colors-along-a-ramp"></a>

### Farben entlang eines Verlaufs

Eine `colorScale` vom Typ `type: "sequential"` oder `"diverging"` gibt Zahlen ihre Farben entlang eines Verlaufs, wie d3s `scaleSequential` und `scaleDiverging`, für das `value` eines [`Cell`](#cell). Ihr `range` besteht aus zwei oder mehr Farben, die gleichmäßig entlang des Verlaufs vom unteren bis zum oberen Ende verteilt und dazwischen in OKLab gemischt werden: Die Abstufungen wirken für das Auge gleichmäßig, und zwei Farbtöne treffen sich über ihre eigene Mischung. Ein Wert außerhalb der `domain` erhält das Ende des Verlaufs, und eine Zeile ohne Wert erhält `unknown`.

`sequential` verteilt seine `domain` über den gesamten Verlauf, wobei die Domain der Wertebereich der Zellen ist, sofern die App keine benennt: Anzahlen, Volumen, Aktivität. `diverging` legt seinen `pivot` (standardmäßig 0) auf die mittlere Farbe des Verlaufs, die Werte darunter entlang der ersten Hälfte und die darüber entlang der zweiten: Verluste in einem Farbton, Gewinne in einem anderen, ein unveränderter Monat in der neutralen Mitte. Sofern die App keine Domain benennt, ist sie der Wertebereich, auf beiden Seiten des Pivots symmetrisch gemacht (`symmetric` von Observable Plot), sodass ein Verlust und ein Gewinn gleicher Größe gleich stark erscheinen; eine Korrelationsmatrix benennt `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | Type | Default | Description |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (required) | Die Art des Verlaufs. |
| `domain` | `[number, number]` | the values' extent (made even about the pivot for `diverging`) | Die Werte der beiden Enden des Verlaufs. |
| `pivot` | `number` | `0` | Nur `diverging`: der Wert der mittleren Farbe des Verlaufs. |
| `range` | `string[]` | (required) | Die Farben entlang des Verlaufs, vom unteren zum oberen Ende (CSS-Farben), dazwischen in OKLab gemischt. |
| `unknown` | `string` | none | Die Farbe einer Zeile ohne Wert; ohne diese hat die Zeile keine Zelle. |
## RadialLine and RadialGrid

Eine `RadialLine` zeichnet eine Datenreihe um den Mittelpunkt des Plots: das Polygon eines Radars oder eine Linie rund um ein Zifferblatt. Jede Zeile mit einem Wert ist ein Punkt im Winkel der Zeile, so weit außen, wie die y-Skala des Plots ihren Wert platziert, von `innerRadius` (dem kleinsten Wert der Domäne) bis `outerRadius` (ihrem größten). Ohne `angle` verteilen sich die Zeilen der Reihe nach gleichmäßig über den Vollkreis, ab 12 Uhr im Uhrzeigersinn, sechs Zeilen ergeben also ein Sechseck; `closed` verbindet den letzten Punkt mit dem ersten. Eine Linie zeichnet ihre Punkte als Strich und füllt ihre Fläche bis hinunter zu `innerRadius` (standardmäßig der Mittelpunkt), sodass ein Mark zugleich der Umriss und die Flächenfüllung eines Radars ist. Ein `RadialGrid` zeichnet dahinter das Radargitter: `rings` bei Werten der y-Skala, Polygone durch die Winkel der Zeilen oder `circular`, und `spokes` hinaus zu jeder Zeile. Über einer radialen Linie meldet der Plot die Zeile, deren Winkel dem des Zeigers am nächsten liegt, innerhalb des äußeren Radius der Linie, und der Hover-Punkt jeder Linie sitzt auf ihrem Punkt dieser Zeile.

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| Mark | Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | `y` des Plots | Was jede Zeile von der Mitte nach außen platziert: ein Wert der y-Skala, von `innerRadius` beim kleinsten Wert der Domäne bis `outerRadius` beim größten. Eine Zeile ohne Wert wird übersprungen. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | die Zeilen gleichmäßig über den Vollkreis verteilt | Wo jede Zeile um den Mittelpunkt liegt: Radiant ab 12 Uhr, im Uhrzeigersinn. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (Radiant) | `0`, `2 * Math.PI` | Wo die Zeilen ohne `angle` liegen: ab `startAngle`, gleichmäßig verteilt. Über einen ganzen Vollkreis liegen sie je einen Schritt von `1 / rows` eines Vollkreises auseinander, die letzte einen Schritt vor der ersten; über einen Teil eines Vollkreises liegt die erste auf `startAngle` und die letzte auf `endAngle`. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Wo der kleinste und der größte Wert der y-Domäne liegen: in Punkten oder als Prozentsatz des größten Kreises, den der Plot fasst (die Hälfte seiner kürzeren Seite), wie bei den Radien eines Kreisdiagramms. Die Fläche einer Linie wird bis `innerRadius` gefüllt; die Speichen eines Gitters verlaufen zwischen beiden. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | Wie sie ihre Punkte verbindet: gerade Segmente, eine glatte Kurve (geschlossen: eine glatte Schleife) oder Stufen. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | Sie führt vom letzten Punkt zurück zum ersten weiter: das Polygon eines Radars. Offen schließt sich ihre Fläche zum Mittelpunkt (oder entlang ihres inneren Rands). |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Ein Punkt auf jedem Datenpunkt: eine auf ihn zentrierte View, deren Größe, Hintergrund und Rahmen die der App sind. Die Punkte wachsen heraus und bewegen sich mit der Linie. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Ihr Hintergrund: eine Box um ihren äußeren Kreis, deren Hintergrund (`bg-*`, ein Verlauf) nur innerhalb ihrer Fläche sichtbar ist, unter ihrem `fill`, wie bei einer Fläche. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` des Plots | Ihr Hover-Punkt, auf ihrem Punkt der Zeile unter dem Zeiger, wobei der Zeiger im selben Frame liegt und beim Weiterschalten mit den Tasten mit der `pointer`-Feder des Plots zur nächsten Zeile gleitet; `hidden` zeigt keinen. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | keine | Wo ihre Ringe liegen, als Werte der y-Skala: jeder so weit außen, wie eine radiale Linie diesen Wert platziert. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | Eine Linie von `innerRadius` bis `outerRadius` im Winkel jeder Zeile. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | Ihre Ringe sind Kreise (Bögen über einen Teil eines Vollkreises). Standardmäßig sind sie Polygone durch die Winkel der Zeilen, und Kreise, solange der Plot weniger als drei Zeilen hat. |

Eine radiale Linie zeichnet ihren Strich mit `stroke`, `strokeWidth` und `strokeDasharray` (`currentColor`, 1 breit und durchgezogen, wo nichts gesetzt ist) und füllt ihre Fläche mit `fill` (keine Füllung, wo nichts gesetzt ist); ein radiales Gitter zeichnet wie ein Gitter. Ihr Paint erbt vom Plot. Die Werte einer Linie bilden zusammen mit 0 die Domäne der y-Skala, wenn der Plot keine hat, sodass ein Radar mit positiven Werten aus seiner Mitte wächst; die Ringe eines Gitters tun das nicht. Mit einer y-`domain` am Plot bleiben die Ringe und die Skala des Radars fest, während sich die Werte ändern.

Beschriftungen rund um ein Radar sind Elemente der App, die über den Plot gelegt werden, wie die Mitte eines Donuts. Ohne `angle` liegt Zeile `i` von `n` bei `a = 2π·i / n` ab 12 Uhr, sodass in einem quadratischen Plot eine Box ohne Größe bei `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (`r` ein Prozentsatz der Seite des Plots, etwas über dem halben Anteil des äußeren Radius) die Stelle jenseits des Rands markiert, und der Name von dort vom Mittelpunkt weg wächst: rechts davon auf der rechten Hälfte, links davon auf der linken, darüber oben und darunter unten, wie oben.

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

Ein `Sankey` zeichnet Flüsse zwischen den Zeilen des Plots: Jede Zeile ist ein Knoten, und `links` benennt die Flüsse zwischen ihnen, `{ source, target, value }` with the indices of two rows in the plot's `data`. Es legt sie wie d3-sankey in der Größe des Plots aus: die Knoten in Spalten (`nodeAlign`), jeder so hoch wie das Meiste, was in ihn hinein- oder aus ihm herausfließt, die Knoten einer Spalte `nodePadding` voneinander entfernt und über `iterations` Durchgänge zu ihren Flüssen hin entspannt; dazu pro Link ein Band von der rechten Kante seiner Quelle zur linken Kante seines Ziels, an jedem Ende so breit wie sein Anteil an der Seite dieses Knotens, sodass beide Seiten jedes Knotens bedeckt sind, auch wo seine ein- und ausgehenden Flüsse sich unterscheiden. Jede Spalte ist im Plot zentriert, und eine Folge gleicher Spalten mit je einem Knoten wird leicht versetzt, damit sich die Bänder dazwischen krümmen. `valueScale="sqrt"` skaliert mit der Quadratwurzel der Werte, damit ein dominanter Fluss die kleinen nicht erdrückt.

Jeder Knoten und jedes Band ist ein eigenes Canvas, die Parts `node` und `link`, sodass jedes mit eigenen Klassen zeichnet: `nodeClass` sind dieselben Klassen für jeden Knoten oder eine Funktion der Zeile des Knotens, und `linkClass` dieselben für jedes Band oder eine Funktion des Links. Der Part `linkBackground` zeigt einen Hintergrund innerhalb jedes Bandes, eine Box von seiner Quelle zu seinem Ziel: Eine Funktion des Links gibt jedem Band einen Verlauf von der Farbe seiner Quelle zu der seines Ziels. Die Bänder werden unter den Knoten gezeichnet, und beide werden mit der Appear-Animation des Plots von der Vorderkante her eingezeichnet.

Über einem Sankey meldet der Plot den Knoten unter dem Zeiger (`onHoverChange`, die Zeile des Knotens; keinen über einem Band), sein Tooltip folgt dem Zeiger, und die nicht mit diesem Knoten verbundenen Links blenden um `hoverDim` aus, auf dem Animator der Plattform mit dem `motion` des Plots. Die Tasten gehen die Knoten in der Reihenfolge der Zeilen durch, der Tooltip steht neben der Mitte jedes Knotens. `nodeLabel` benennt jeden Knoten und `valueLabel` gibt seinen Wert an, der Wert über dem Namen, wenn beide gesetzt sind: links von einem Knoten in der ersten Spalte, rechts von einem in der letzten, zentriert über einem dazwischen, wie das Diagramm von `gpui-component` sie platziert; eine Beschriftung neben einem Knoten bleibt zwischen Ober- und Unterkante des Plots, und eine über den Rand des Plots hinaus sitzt in dem Platz, den die App um ihn lässt (ihr Margin). Das Padding des Parts `nodeLabel` ist der Abstand zu seinem Knoten und seine Klassen bestimmen seinen Text (`max-w-20 truncate` kürzt einen langen Namen); die Beschriftungen blenden mit der Appear-Animation ein. Ändert die App die Flüsse, bewegt sich jeder Knoten und jedes Band mit dem `motion.update` des Plots von seinem alten zu seinem neuen Platz, seine Beschriftung mit: Ein neuer Knoten wächst aus seiner Mitte, ein neuer Link aus seiner geringsten Breite, und entfallene verschwinden sofort; eine Änderung während der Bewegung setzt dort an, wo sie gerade gezeichnet sind. Links werden anhand von Quelle und Ziel unterschieden, sodass ein Umsortieren von `links` nichts bewegt.

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | erforderlich | Die Flüsse: von der Zeile `source` zur Zeile `target` (ihre Indizes in den `data` des Plots), `value` ihre Größe. Ein Wert, der keine Zahl oder kleiner als null ist, trägt nichts und zeichnet kein Band. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | Die Breite jedes Knotens in Punkten. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | Der Abstand zwischen den Knoten einer Spalte in Punkten; kleiner in einer Spalte, die dafür zu voll ist. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | In welche Spalte jeder Knoten gehört, wie bei d3-sankey: seine Tiefe ab der ersten Spalte (`"left"`), so weit rechts, wie seine Flüsse es zulassen (`"right"`), seine Tiefe, wobei ein Knoten, der nur Flüsse beginnt, neben seine Ziele rückt (`"center"`), oder seine Tiefe, wobei die Knoten, in denen Flüsse enden, in der letzten Spalte stehen (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | Wie viele Durchgänge die Knoten zu ihren Flüssen hin entspannen. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | Höhen und Breiten proportional zu den Werten oder zu ihren Quadratwurzeln. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | Das Dünnste, was ein Band zeichnet, in Punkten, damit ein kleiner Fluss sichtbar bleibt. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | Der Radius der Ecken jedes Knotens in Punkten. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | keine | Die Klassen jedes Knotens (`fill-*`, `stroke-*`): dieselben für jeden Knoten oder eine Funktion der Zeile des Knotens und ihres Index, einmal pro Zeile aufgerufen, wenn sich die Zeilen oder die Funktion ändern. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil jedes Knotens, über seinen Klassen. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | keine | Die Klassen jedes Bandes: dieselben für jedes Band oder eine Funktion des Links und seines Index in `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil jedes Bandes, über seinen Klassen. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | keine | Die Klassen des Hintergrunds jedes Bandes (`bg-*`, ein Verlauf: `bg-linear-to-r from-… to-…`), innerhalb des Bandes über einer Box von seiner Quelle zu seinem Ziel sichtbar, unter seinem `fill`. Mit einem Hintergrund ist der `fill` eines Bandes `none`, wo keiner gesetzt ist. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Stil des Hintergrunds jedes Bandes, über seinen Klassen. |
| `hoverDim` | `.hover_dim(..)` | `number` (0 bis 1) | `0` | Wie stark die nicht mit dem Knoten unter dem Zeiger verbundenen Links ausblenden, als Anteil ihrer Deckkraft, mit der `pointer`-Feder des Plots und dem Ausblenden des Hovers. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | keiner | Der Name neben jedem Knoten: ein Feld oder eine Funktion der Zeile des Knotens und ihres Index. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | keiner | Der Wert neben jedem Knoten, über seinem Namen: eine Funktion seiner Zeile und des Meisten, was in ihn hinein- oder aus ihm herausfließt (in den Werten der Links, unabhängig von `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | keine | Die Klassen jeder Beschriftung, des Parts `nodeLabel`: ihr Padding ist der Abstand zu ihrem Knoten, ihre Textstile gelten für beide Zeilen. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | keiner | Der Stil jeder Beschriftung, über ihren Klassen. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | keine | Die Klassen der Wertzeile, des Parts `valueLabel`, über denen der Beschriftung. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | keiner | Der Stil der Wertzeile, über ihren Klassen. |

Ein Knoten und ein Band füllen mit `fill` (`currentColor`, wo keine gesetzt ist) und zeichnen ihren Strich mit `stroke` (keiner, wo keiner gesetzt ist), jeweils ihre eigenen Werte über denen des Sankey und des Plots, wie CSS sie vererbt. Ein Knoten, durch den nichts fließt, ist einen Punkt hoch. Das Layout läuft nur erneut, wenn sich die Links, die Optionen oder die Größe des Plots ändern, nie für den Zeiger oder die Appear-Animation; ändert sich die Größe des Plots, bewegt sich nichts. Links, die einen Zyklus bilden oder eine Zeile benennen, die der Plot nicht hat, zeichnen nichts und protokollieren eine Warnung. Ihre Werte gehen nicht in die Skalen des Plots ein.
## Treemap

Ein `Treemap` zeichnet die Zeilen des Plots als Hierarchie verschachtelter Rechtecke: Jede Zeile ist ein Knoten, ihr `id` und die `parent`, die sie benennt, bilden den Baum (d3s `stratify`), die Fläche jedes Blatts ist proportional zu seinem `value`, und jede Gruppe ist die Box dessen, was unter ihr liegt; ihr Wert ist die Summe der Werte ihrer Blätter (unabhängig davon, was ihre eigene Zeile enthält). Eine Zeile ohne `parent` oder deren Parent keine Zeile benennt, ist ein Knoten der obersten Ebene; ohne `id` ist die id einer Zeile ihr Index, sodass `parent` eine Zeile auch über ihren Index benennen kann. Ein Baum in der verschachtelten Form, die gpt-vis schreibt (`{ name, value, children }`), lässt sich mit wenigen Zeilen Code der App in Zeilen umwandeln; die Anzahl der Ebenen ist nicht begrenzt.

Die Kacheln werden squarified angeordnet, wie d3s `treemapSquarify` sie erzeugt: die Knoten jeder Ebene nach Wert geordnet, der größte zuerst oben links (`sort="value"`), nahe am Seitenverhältnis `ratio` (dem goldenen Schnitt); `sort="data"` behält die Reihenfolge der Zeilen bei, sodass die Knoten ihre Plätze behalten, wenn sich ihre Werte ändern. `paddingInner` ist der Abstand zwischen Geschwistern, nicht entlang des äußeren Rands ihres Parents; `paddingOuter` ist der Platz innerhalb einer Gruppe um ihre Kinder; `paddingTop` ist ein Band am oberen Rand jeder Gruppe, in dem ihr `groupLabel` geschrieben steht. Jeder dieser Werte nimmt eine Zahl für alle Ebenen oder eine pro Ebene von der obersten abwärts (`[3, 1]`: 3 zwischen den Knoten der obersten Ebene, 1 darunter). Das Band einer Ebene gilt für alle Geschwister eines Parents oder für keines; es entfällt, wo eines dafür zu klein ist, sodass die Gruppen einer Ebene einheitlich aussehen.

Ein Blatt, dessen Wert 0, kleiner als 0 oder keine Zahl ist, erhält keine Fläche: Es wird nicht gezeichnet, hat kein Label und wird vom Zeiger nicht gefunden; dasselbe gilt für eine Gruppe, deren Blätter alle so sind.
Die Flächen einer Treemap sind Anteile eines Ganzen, daher zeigt die App mit eigenen Worten, was ausgelassen wurde (ein Hinweis unter der Karte).
Negative Zahlen sind für Farben gedacht: die Tagesveränderung einer Marktkarte.

Die Farbe eines Knotens ist die seiner Zeile aus dem `colorScale` des Plots: `colorValue` ist eine Zahl auf einer Rampe (`sequential`,
`diverging`: Verluste rot, Gewinne grün, unverändert neutral, über den Wertebereich der Werte ohne `domain`), `color` eine
Kategorie (`ordinal`: `"parent"` färbt die Blätter einer Gruppe gleich). Die Blätter sind der `leaf`-Part (`leafClass`,
`leafStyle`) und die Gruppen der `group`-Part (`groupClass`, `groupStyle`), die nur mit einer Klasse oder einem Style gezeichnet werden: ein
Rechteck unter ihren Kindern, das in den Lücken, in seinem Padding und in seinem Band sichtbar ist. Jeder Part ist auf allen Knoten gleich oder eine
Funktion der Zeile des Knotens. `cornerRadii` rundet jedes Rechteck ab.

`label` schreibt den Namen jedes Blatts und `valueLabel` seinen Wert darunter, als Funktion der Zeile und ihres Werts (der Wert einer Gruppe ist die
Summe ihrer Blätter): oben links (`labelPlacement="start"`) oder in der Mitte (`"center"`). Der `label`-Part ist eine Box
so groß wie ihr Blatt: Ihr Padding ist der Abstand zu den Rändern des Blatts, und ihr Text gibt den Zeilen ihren Stil. Der Name wird
mit einer Ellipse abgeschnitten, wo das Blatt schmaler ist, und nur angezeigt, wo er passt; der Wert wird vollständig oder gar nicht angezeigt. Ein Label, dessen Blatt eine dunkle Farbe hat, erhält das Attribut `data-dark`,
sodass `data-dark:text-white` es auf einem tiefen Rot lesbar hält.

Über einer Treemap meldet der Plot den Knoten unter dem Zeiger (`onHoverChange`, die Zeile des Knotens): ein Blatt oder eine Gruppe in
ihrem Band oder Padding; über einer Lücke zwischen Geschwistern eines von ihnen, damit das Hover nicht flackert. Die anderen blenden
auf `inactiveOpacity` aus (ein Blatt behält seine Gruppen, eine Gruppe das, was unter ihr liegt), und der `hover`-Part, eine View so groß wie der
Knoten, umrandet ihn. Die Pfeiltasten wechseln zum Blatt daneben auf dem Bildschirm, Pos1 und Ende zum ersten und zum letzten.
Beim Erscheinen des Plots wachsen die Knoten der obersten Ebene aus ihrer Mitte, einer nach dem anderen mit `stagger`; wenn sich die Zeilen
ändern, bewegt sich jeder Knoten mit `motion.update` zu seiner neuen Box und Farbe, erkannt an seiner `id`: ein Knoten, der neu in den Zeilen ist,
wächst aus seiner Mitte, und einer, der weggefallen ist, schrumpft in seine eigene. Die x- und y-Skalen des Plots werden nicht verwendet.

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | der Index der Zeile | Die id des Knotens jeder Zeile: das, was `parent` benennt, und das, woran ein Knoten erkannt wird, wenn sich die Zeilen ändern. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | keiner: Jede Zeile ist ein Knoten der obersten Ebene | Die id des Parents jeder Zeile; leer oder keine id einer Zeile für einen Knoten der obersten Ebene. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | erforderlich | Die Größe jedes Blatts; die einer Gruppe ist die Summe ihrer Kinder. Ein Blatt mit 0, kleiner als 0 oder keiner Zahl erhält keine Fläche. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | Geschwister, der größte zuerst oben links, oder in der Reihenfolge der Zeilen. |
| `ratio` | `.ratio(..)` | `number` | der goldene Schnitt | Das Seitenverhältnis, dem sich die Kacheln annähern, mindestens 1. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | Der Abstand zwischen Geschwistern, in Punkten, pro Ebene von der obersten abwärts (der letzte gilt für alle darunter). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | Der Platz innerhalb jeder Gruppe um ihre Kinder, pro Ebene. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | Das Band am oberen Rand jeder Gruppe, für ihr `groupLabel`, pro Ebene; für alle Geschwister eines Parents oder für keines. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | eckig | Der Radius jeder Ecke ihrer Rechtecke. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | keine | Die Kategorie jedes Knotens, der ein `ordinal` `colorScale` eine Farbe gibt. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | keine | Die Zahl jedes Knotens, die ein `sequential` oder `diverging` `colorScale` zu seiner Farbe macht. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | keine | Die Klassen jedes Blatts (`fill-*`, `stroke-*`), auf jedem Blatt gleich oder eine Funktion seiner Zeile. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Style jedes Blatts, über seinen Klassen. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | keine | Die Klassen jeder Gruppe, ein Rechteck unter ihren Kindern; Gruppen werden nur mit einer Klasse oder einem Style gezeichnet. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Style jeder Gruppe, über ihren Klassen. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0 bis 1) | keine | Die Deckkraft der Knoten abseits des gehoverten und ihrer Labels, mit dem Ausblenden des Hovers. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | keiner | Der Name in jedem Blatt, einzeilig, mit einer Ellipse abgeschnitten. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | keiner | Der Wert in jedem Blatt, unter seinem Namen, nur angezeigt, wo er vollständig passt. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | Die Labels oben links in ihren Blättern oder in deren Mitte. |
| `labelClass` | `.label_class(..)` | `string` | keine | Die Klassen des Labels jedes Blatts, eine Box so groß wie das Blatt: sein Padding und seine Textstile; `data-dark:` auf dunklen Blättern. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | keiner | Der Style des Labels jedes Blatts, über seinen Klassen. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | keine | Die Klassen der Wertzeile, über denen des Labels. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | keiner | Der Style der Wertzeile, über ihren Klassen. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | keiner | Der Name jeder Gruppe, in ihrem Band, mit einer Ellipse abgeschnitten. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | keine | Die Klassen des Labels jeder Gruppe, eine Box so groß wie das Band. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | keiner | Der Style des Labels jeder Gruppe, über ihren Klassen. |
| `stagger` | `.stagger(..)` | `number` (0 bis 0.95) | `0` | Wie die Knoten der obersten Ebene nacheinander erscheinen: der Anteil des Erscheinens, über den sie starten. |
| `hoverClass` | `.hover_class(..)` | `string` | keine | Die Klassen des `hover`-Parts, eine View so groß wie der gehoverte Knoten darüber (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Style des Hover-Parts, über seinen Klassen. |

Ein Rechteck füllt sich mit `fill` (der Farbe des `colorScale`, sonst `currentColor`, wo keine gesetzt ist) und wird mit
`stroke` umrandet (keine, wo keine gesetzt ist), wobei seine eigene Einstellung der der Treemap und der des Plots vorgeht, so wie CSS sie vererbt. Das Layout läuft
nur dann erneut, wenn sich die Zeilen, die Optionen oder die Größe des Plots ändern, nie für den Zeiger oder das Erscheinen; eine Änderung der Größe des Plots
verschiebt nichts. Eine wiederholte `id`, ein `parent`, das keine Zeile benennt, und eine Zeile, die ihr eigener Vorfahre ist, protokollieren einmalig eine Warnung:
Die erste Zeile behält die id, die verwaiste Zeile wird ein Knoten der obersten Ebene, der Zyklus wird nicht gezeichnet.

## PlotAxis

Eine `PlotAxis` beschriftet einen Rand des Plots mit den Ticks der Skala, die dieser Rand trägt: der untere und der obere Rand die der x-Skala, der linke und der rechte die der y-Skala, wie d3s `axisBottom`, `axisTop`, `axisLeft` und `axisRight`. Ihre Ticks
stammen aus der Skala: runde Werte bei einer `linear`-Skala (das 1-, 2- oder 5-Fache einer Zehnerpotenz, innerhalb des Wertebereichs), Zeilen bei einer
`point`- oder `band`-Skala. Ihre Labels sind Texte, die das Layout des Plots platziert, sodass die App festlegt, was sie lesen und wie sie
aussehen, und das Layout sie an Ort und Stelle setzt: Jedes Label ist entlang des Rands auf seinem Tick zentriert. Entlang des unteren und oberen
Rands rücken das erste und das letzte genau so weit nach innen, wie nötig ist, damit sie innerhalb der Enden des Plots bleiben; neben dem linken und
rechten Rand bleibt jedes Label auf seinem Tick, sodass es als das seiner Gitterlinie gelesen wird, und wo ein Label nahe einem Ende den oberen oder unteren Rand des
Plots überschreiten würde, beginnen die linearen y-Skalen des Plots um diesen Betrag weiter innen (die halbe Höhe des Labels bei einem Tick
am Ende), sodass jedes Label innerhalb des Plots auf seiner Gitterlinie bleibt.

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | Der Rand, entlang dem sie verläuft: der untere und der obere Rand tragen die Ticks der x-Skala, der linke und der rechte die der y-Skala. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | Die y-Skala, die eine linke oder rechte Achse beschriftet: die `yScale` des Plots oder seine zweite, `y2Scale` ([Duale Achsen](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | Wo ihre Labels sitzen: jenseits des Rands, in dem Platz, den die App um den Plot lässt, wo sie frei von den Marks bleiben; oder über dem Plot entlang des Rands, sodass der Plot seine volle Größe behält (neben einem linken oder rechten Rand sitzt jedes Label auf der Oberseite seiner Gitterlinie). |
| `ticks` | `.ticks(..)` | `number` | `10` bei einer `linear`-Skala (jeder Schritt bei ausgerichteten Skalen), bei den übrigen jede Zeile | Ungefähr wie viele Ticks sie nimmt: bei einer `linear`-Skala runde Werte innerhalb des Wertebereichs, ungefähr so viele; bei einer `point`- oder `band`-Skala so viele Zeilen, gleichmäßig verteilt von der ersten bis zur letzten. |
| `tickValues` | `.tick_values(..)` | `number[]` | keine | Die Werte ihrer Ticks, anstelle von `ticks`: Werte der Skala, bei einer `point`- oder `band`-Skala Zeilenindizes (`[0, 3, 6]` beschriftet jede dritte Zeile). Die Werte innerhalb des Wertebereichs erhalten jeweils einen Tick. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | die Kategorie eines Bands bei einer Band-Skala von Kategorien, sonst der Wert, mit den Dezimalstellen, die der Abstand zwischen den Ticks braucht, Tausender gruppiert | Der Text jedes Ticks: die Funktion der App von seinem Wert (der Index einer Zeile bei einer `point`- oder `band`-Skala) und seinem Index unter den Ticks der Achse. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | keine | Der `label`-Part: ein Text pro Tick, dessen Schrift, Farbe und Padding von der App stammen; sein Padding zum Plot hin ist sein Abstand vom Rand (`pt-2` unter einer unteren Achse). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der `tick`-Part: eine View pro Tick auf dem Rand, auf ihrem Tick zentriert und zu den Labels hin reichend (`h-1 w-px bg-border` unter einer unteren Achse); wird angezeigt, sobald er einen Style hat. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | keine | Der `line`-Part: eine View entlang des gesamten Rands, auf der Seite der Labels (`h-px bg-border` unter einer unteren Achse); wird angezeigt, sobald er einen Style hat. |

Außen sitzen die Labels im Rand des Plots, so wie die Achsen von d3 in den Rändern eines Diagramms sitzen: Der Plot behält die Größe, die die App ihm
gibt, und die App gibt ihm auf der Seite der Achse einen Rand, der so tief ist wie die Labels (`mb-6` für `pt-2 text-xs`-Labels
darunter), oder das Padding seines Parents dort. Zwei Achsen an einem Rand beschriften jeweils ihre eigenen Werte, in ihrem eigenen Style: die
Enden eines Bereichs blass und seine Mitte kräftiger.

`format` wird einmal pro Tick aufgerufen, wenn sich die Ticks oder die Funktion ändern, im nächsten Turn, nie während der Plot zeichnet
oder dem Zeiger folgt: Halte sie pur (derselbe Wert, derselbe Text). Ohne sie liest sich ein Tick so, wie d3 ihn schreibt:
`1,500`, `0.25`, `−2`. In Rust erzeugt `plot_axis()` eine Achse, ihr `format` eine `TickFormat::from_fn(|value, index| ..)`.
Eine Achse nimmt keinen Zeiger an, und Screenreader hören den Plot statt seiner Labels.
## PlotLabel

Ein `PlotLabel` schreibt Texte an Punkte des Plots: eine Beschriftung über einem Gipfel, ein Tag am letzten Punkt einer Linie, eine Notiz am Ende einer Gitterlinie. Jeder seiner `texts` benennt seinen Punkt mit Werten der Skalen des Plots, wie es die Marks tun: der Index einer Zeile auf einer `point`- oder `band`-Skala (die Mitte des Bands der Zeile), ein Wert auf einer `linear`-Skala. Die Oberkante des Textes sitzt auf dem Punkt, und sein `align` lässt ihn dort beginnen, zentriert ihn darauf oder lässt ihn dort enden. Das Layout des Plots platziert die Texte, sodass sie der Größe des Plots folgen; sie gleiten mit den Domains der Skalen (`motion.update`) und blenden mit dem Appear ein.

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | Die Texte, die es schreibt, jeweils an einem eigenen Punkt. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | Die y-Skala, deren Werte die `y` seiner Texte sind ([Duale Achsen](#dual-axes)). |

Jeder Text ist ein `PlotText`:

| Feld | Typ | Standard | Beschreibung |
|---|---|---|---|
| `text` | `string` | | Was er anzeigt. |
| `x` | `number` | | Wo er entlang der x-Achse liegt: ein Wert der x-Skala, der Index einer Zeile auf einer `point`- oder `band`-Skala (`0.5` liegt auf halbem Weg zwischen den ersten beiden Zeilen). |
| `y` | `number` | | Wo seine Oberkante entlang der y-Achse liegt: ein Wert der y-Skala. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Wie er entlang x von seinem Punkt aus sitzt: dort beginnend, darauf zentriert oder dort endend. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | keine | Die eigenen Klassen und der eigene Style des Textes, über dem, was er vom Label erbt: seine Box (Hintergrund und Padding eines Tags) und sein Abstand zum Punkt. |

Das Aussehen bestimmt die App: Das `class` des Labels gibt jedem Text die Textstile, die er erbt (Schrift, Größe, Farbe), und die eigenen `class` und `style` eines Textes stylen ihn allein. Ein Text steht mit `-translate-y-full` über seinem Punkt, und sein Padding ist sein Abstand zum Punkt (`pb-1`); ein Tag neben dem letzten Punkt einer Linie sitzt in dem Rand, den die App auf dieser Seite lässt (`mr-12`), wie die Beschriftungen einer Achse. In Rust erzeugt `plot_label()` ein Label, jeder Text ein `PlotText::new(text, x, y)` mit `.align(PlotTextAlign::Center)`, `.class(..)` und `.style(..)`. Der Pointer geht durch die Texte hindurch zum Plot, und Screenreader lesen den Plot vor, dessen `accessibilityLabel` sagt, worauf die Texte hinweisen.

<a id="motion"></a>

## Bewegung

Die Bewegung gehört der App, und standardmäßig gibt es keine: Alles erscheint sofort. `motion` nimmt die Timings von [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` und `{ stiffness, damping, mass }`):

| Schlüssel | Typ | Was sich bewegt |
|---|---|---|
| `appear` | Timing | Die Marks zeichnen sich ein, mit einem `appearGeneration`: Linien und Flächen von der Vorderkante aus, Balken wachsen aus ihrer Basis (nacheinander mit dem `stagger` eines Balkens); Punkte wachsen aus dem Nichts (nacheinander mit dem `stagger` eines Punkts); Zellen wachsen aus ihrer Mitte (nacheinander mit dem `stagger` einer Zelle); der Ring eines Pie und eines Arc schwingt im Uhrzeigersinn von seinem Start aus ein; eine radiale Linie wächst aus ihrem inneren Radius, ihre Punkte mit ihr; die Nodes und Ribbons eines Sankey von der Vorderkante aus, seine Labels blenden ein. |
| `update` | Timing | Marks bewegen sich zur neuen Form, wenn die App sie ändert: Punkte zu ihren neuen Werten und Größen, der Punkt einer neuen Zeile wächst hinein und der einer entfallenen Zeile schrumpft weg; Zellen zu ihren neuen Farben (gemischt in OKLab) und Bändern, die Zelle einer neuen Zeile wächst hinein und die einer entfallenen schrumpft weg; die Radien eines Pie und eines Arc, sodass sich das Loch eines Donuts öffnet und schließt, und ihre Winkel, sodass ein Gauge oder ein Slice zu seinem neuen Wert schwingt (`arcTween` von d3: die Winkel bewegen sich, nicht die Kontur; ein neuer Slice öffnet sich dort, wo der vorherige endet; eine Änderung während einer Bewegung setzt dort an, wo gerade gezeichnet wird); die Punkte einer radialen Linie zu ihren neuen Werten, Winkeln und Radien (eine neue Zeile wächst aus dem inneren Radius), die Ringe eines radialen Gitters mit ihnen; und die Domain einer linearen Skala, das `domain` der App oder der Umfang der Werte der Marks, während Zeilen eintreffen, die vom alten zum neuen gleitet, wobei die Marks, die Gitterlinien, die `PlotAxis` und die `PlotLabel` mitgehen; und die Nodes, Ribbons und Labels eines Sankey, vom Layout der alten Flows zu dem der neuen, wobei eine Änderung während der Bewegung dort ansetzt, wo gerade gezeichnet wird. |
| `enter` | Timing | Die Teile des Hovers blenden ein, wenn der Pointer über den Plot kommt. |
| `exit` | Timing | Sie blenden aus, nachdem er ihn verlässt. |
| `pointer` | Spring | Sie gleiten von einer Zeile zur nächsten, wenn die Tasten oder ein Screenreader den Hover weiterschalten; der Slice eines Pie hebt sich dabei. |

Die Teile des Hovers folgen dem Pointer im selben Frame: Wenn er sich bewegt, liegen die Kreuzlinie, die Punkte und der Tooltip sofort auf der Zeile darunter, sodass sie der Hand folgen, während ihr Ein- und Ausblenden (`enter`, `exit`) weiterhin animiert wird.

Die Bewegung läuft auf dem Animator der Plattform, ohne JS pro Frame, und ist für Personen, die reduzierte Bewegung wünschen, sofort abgeschlossen. Ein Plot, den eine Liste für eine zurückkehrende Zeile neu erzeugt, zeichnet sich erneut ein, es sei denn, ein [`PlotAppearScope`](#plotappearscope) um die Liste hat gesehen, dass sein Appear beendet wurde.

Eine Domain bewegt sich so, wie d3 die Domain einer Skala überblendet: Die Skala dazwischen platziert jeden Wert, sodass die Marks ihre Formen behalten, die Gitterlinien und die Teile des Hovers sich mit ihnen bewegen, Balken ihre Ecken behalten und eine Zeile, die mit der neuen Domain hinzukommt, sich mit den übrigen bewegt. Ein Live-Chart, das seine y-Skala hin und wieder an seine Zeilen anpasst (mit etwas Spielraum, damit das Gitter zwischen den Anpassungen stillhält), gleitet mit einem `update`-Timing zu jeder neuen Anpassung. Wenn sich die Größe des Plots ändert, übernehmen die Marks die neue Größe sofort.

Das ist die eigene Bewegung des Plots, die Timings dessen, was ein Chart bewegt: der Clip seiner Marks und die Teile seines Hovers. Die Entrances, Exits und Attention Seekers einer View sind die Presets und Keyframes von [`createMotion`](../modules/nsh.md#createmotion), die eine App weiterhin auf der View des Plots oder auf den Elementen darum abspielen kann.

## PlotAppearScope

Eine Liste erzeugt den Plot einer Zeile jedes Mal neu, wenn die Zeile wieder in den Blick kommt, sodass sich eine Sparkline mit einem Appear jedes Mal erneut einzeichnet, wenn die Liste zu ihr zurückscrollt. Ein `PlotAppearScope` um die Liste merkt sich die Appears, die darin beendet wurden: Ein dort neu erzeugter Plot, dessen `appearGeneration` beendet wurde, zeigt seine Marks sofort vollständig. Ein Plot wird über seine Generation gemerkt, daher bekommt der Plot jeder Zeile eine eigene: den Key der Zeile mit allem, was sie neu abspielen soll (`` `${symbol} ${period}` ``).

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | keine | Wofür sich der Scope etwas merkt: Wenn es sich ändert, vergisst der Scope, und seine Plots zeichnen sich neu ein, dort wo sie sind. Benenne es nach dem Inhalt, etwa einer Watchlist oder einer Konversation; ohne eines merkt sich der Scope, solange er angezeigt wird. |
| `children` | `.child(..)` | `JSX.Element` | keine | Was er enthält: die Liste oder alles, was seine Plots neu erzeugt, wenn sie kommen und gehen. |

Eine neue Generation zeichnet den Plot weiterhin ein, ebenso ein Plot, der vor dem Ende seines Appears entfernt wurde, und zwar von vorn. Sobald ein Plot eine neue Generation beendet hat, vergisst sein Scope die vorherige, sodass der Wechsel zurück zu einem früheren Zeitraum den Plot erneut einzeichnet. Das Gedächtnis gehört zum Scope: Ein Scope, der nicht mehr angezeigt wird, oder einer mit neuem `id` zeichnet seine Plots neu ein, und ein Plot merkt sich seine Appears im innersten Scope um ihn herum. Sein Aussehen bestimmt die App: `class` und `style` legen ihn wie jede View aus (`flex-1` um eine Liste, die den Bildschirm füllt). In Rust erzeugt `plot_appear_scope()` einen.

<a id="keyboard"></a>

## Tastatur

Ein interaktiver Plot ist ein Tab-Stopp (macOS, das Web), und solange er den Tastaturfokus hat, bewegen seine Tasten denselben Hover wie der Pointer: Die Kreuzlinie, die Punkte und der Tooltip gleiten mit dem `pointer`-Spring, der Slice eines Pie hebt sich, `onHoverChange` meldet die Zeile, und Screenreader lesen das `accessibilityValue` vor, das die App dafür angibt. Sein Fokusring bestimmt die App: eine `focus-visible:`-Klasse oder ein `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| Tasten | Was sie tun |
|---|---|
| Rechts, Links | Zur Zeile auf dieser Seite wechseln: die nächste oder die vorherige Zeile, auf einer umgekehrten x-Skala, deren erste Zeile rechts liegt, andersherum (über einem Pie die Slices in der Reihenfolge der Zeilen; über einem Sankey seine Nodes; über einer Treemap das Blatt daneben auf dem Bildschirm, wie es Oben und Unten tun); ohne gehoverte Zeile beginnt Rechts bei der Zeile am linken Ende und Links bei der am rechten Ende (über einem Pie beim ersten und beim letzten Slice). |
| Pos1, Ende | Zur ersten oder zur letzten Zeile wechseln. |
| Oben, Unten | Über Zellen: zur Zelle darüber oder darunter in derselben Spalte wechseln. Über Zellen folgen die Tasten dem Raster auf dem Bildschirm (Data Grid von WAI-ARIA): Rechts und Links wechseln zur nächsten Zelle entlang der Reihe, Pos1 und Ende zur ersten und zur letzten Zelle der Reihe; ohne gehoverte Zelle beginnt die erste Taste bei der Zelle oben links (Links, Oben und Ende bei der unten rechts). An einem Rand bleibt der Hover. |
| Escape | Löscht den Hover. |

Der Plot reagiert auf seine Tasten, solange er den Fokus hat, und auf Escape, solange eine Zeile gehovert ist; in der übrigen Zeit gehen sie an die App und die Views darum. Wenn der Fokus woandershin wechselt, wird ein durch die Tasten erzeugter Hover gelöscht. Der Plot nimmt keine Presses an, sodass ein Plot in einer pressbaren Karte der Karte ihre Presses lässt. Auch Screenreader schalten durch die Zeilen: VoiceOvers Wischen nach oben und unten, TalkBacks Scrollen vorwärts und zurück, und jeder Screenreader, der die Aktionen `increment` und `decrement` eines Elements anbietet, wechselt zur nächsten und zur vorherigen Zeile, auch auf einer umgekehrten Skala in der Reihenfolge der Zeilen.

<a id="building-charts"></a>

## Diagramme bauen

Ein Chart besteht aus einem Plot, seinen Marks, seinen Achsen und den eigenen Elementen der App darum. Gib der y-Skala ein `domain` und ihrer Achse die Werte des Gitters (`tickValues`): Jedes Label sitzt dann an seiner Gitterlinie. Die Kreuzlinie, die Punkte und der Tooltip des Hovers sind Teile des Plots, von der App gestylt und befüllt; die Werte der Zeile stehen dort, wo die App sie zeigt.

Gitter lesen sich am besten als durchgezogene Haarlinien mit einer festeren Grundlinie, was eine gestrichelte Linie frei lässt, einen Referenzwert zu bedeuten (der Eröffnungskurs unten). Eine Fläche wirkt leichter als Verlauf, der zu ihrer Grundlinie hin ausblendet, denn als flache Füllung. Der Hover-Punkt jeder Serie nimmt die Farbe seiner Serie und als Ring die Farbe der Fläche, auf der das Chart sitzt, sodass er sich von seiner Linie abhebt, und der Tooltip sitzt oben im Plot, bei der ersten und der letzten Zeile innerhalb seiner Ränder: Ein `domain` mit Platz über dem höchsten Wert hält ihn von der Linie fern.

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

Ein Balkendiagramm liest sich am besten mit abgerundeten Spitzen der Balken und eckigen Basen (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), mit abgeschwächten Balken der anderen Zeilen, solange eine gehovert wird (`inactiveOpacity`), und getöntem Band (`crossLineClass`), und mit den Werten in kleinen tabellarischen Ziffern über den Balken, bei einem Stack mit der Summe. Mit `paddingOuter` gleich der Hälfte von `paddingInner` fallen die Mitten der Bänder in gleichen Abständen, und ein `PlotAxis` zentriert jeden Monat unter seinem Band; ein `maxBandWidth` hält einige Balken in einer breiten Karte schmal.

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

Eine Sparkline in einer Listenzeile ist ein Plot mit `interactive={false}`: Sie zeichnet ihre Marks und folgt keinem Pointer.

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Plot ist für Screenreader ein Element mit der Image-Rolle und dem `accessibilityLabel` der App; seine Marks, die Labels seiner Achsen, seine `PlotLabel` und die Teile des Hovers sind Teile davon und sagen selbst nichts. Sag im Label, was das Chart zeigt und was heraussticht (die Spanne, der höchste Wert), und gib `accessibilityValue` die Worte für die Zeile unter dem Pointer, damit ein Screenreader den Wert ansagt, wenn er sich ändert.
- Die Zeile unter dem Pointer wird mit `onHoverChange` auf Plattformen mit Pointer gemeldet (Desktops, das Web, ein iPad mit Trackpad). Touchscreens melden keinen Hover: Zeige die Werte, die Touch-Nutzer brauchen, in den eigenen Elementen der App, oder biete die Zeilen als Text oder Liste an, wo die Zahlen wichtig sind.
- Über einem Pie ist die gemeldete Zeile die des Slices unter dem Pointer: Gib `accessibilityValue` seinen Namen, Wert und Anteil (`"Team, 340 seats, 34.0%"`), und nenne die Summe und den größten Anteil im Label. Über einem Radar ist es die Achse, die dem Pointer am nächsten liegt: Gib ihr den Namen der Achse und den Wert jeder Serie dort.
- Ein interaktiver Plot ist ein Stopp des Tastaturfokus, dessen Pfeiltasten den Hover bewegen ([Tastatur](#keyboard)), und er bietet Screenreadern `increment` und `decrement`, um durch die Zeilen zu schalten (VoiceOver liest ihn als einstellbar vor); ein Plot mit `interactive={false}` ist keines von beidem, und er nimmt in beiden Fällen keine Presses an.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels und Rollen im Allgemeinen.
<a id="platform-notes"></a>

## Plattformhinweise

- Jede Plattform zeichnet die Marks auf dieselbe Weise: aus einer in Rust aufgezeichneten Zeichnung pro Mark. Ändern sich die Zeilen, zeichnet sie die Marks, die diese lesen, in einem Batch neu. Ändert sich eine Paint-Klasse (das Erscheinungsbild, `dark:`), wird die Zeichnung erneut gesendet, ohne sie neu aufzuzeichnen.
- Die Einblendung beschneidet Linien und Flächen und lässt Balken wachsen, jeweils mit Werten, die der Animator der Plattform bewegt. Das Ausblenden eines Balkens im Abstand zur gehoverten Zeile ist eine Deckkraft, die der Animator aus der Position des Hovers berechnet. Die Teile des Hovers sind Views, die der Animator bewegt und ein- bzw. ausblendet, und er hält den Tooltip innerhalb des Plots, ausgehend von der Größe des Plots und der des Tooltips.
- Der Hintergrund einer Fläche wird in einem eigenen Canvas gezeichnet, beschnitten auf die Form der Fläche, mit demselben Verlauf, den die Plattform für das `bg-linear-*` einer View zeichnet. Ändern sich ihre Klassen (das Erscheinungsbild, `dark:`), wird die Zeichnung erneut gesendet, ohne sie neu aufzuzeichnen.
- Ein Pie zeichnet jedes Segment in einem eigenen Canvas. Das Segment unter dem Zeiger wird in Rust aus den Winkeln und Radien der Segmente ermittelt. Das Anheben des Segments ist ein Radius und das Ausblenden der übrigen eine Deckkraft, die der Animator bewegt. Der Sweep der Einblendung bewegt die Winkel der Segmente auf dieselbe Weise, sodass keines von beidem eine Zeichnung neu aufzeichnet.
- Die Zeile einer Radial-Linie unter dem Zeiger wird in Rust aus den Winkeln ihrer Punkte ermittelt. Ihr Hover-Punkt ist eine View, die der Animator auf der Zeile unter dem Zeiger platziert (er gleitet auf der `pointer`-Spring, während die Keys weiterspringen). Während die Linie eingeblendet wird oder zu neuen Werten wechselt, sind ihre Punkte Zahlen, die der Animator von ihrem bisherigen Stand aus bewegt, sodass die Linie pro Änderung einmal aufgezeichnet wird.
- Ein Dot-Mark wird in einem Canvas gezeichnet. Der Punkt unter dem Zeiger wird in Rust aus den Mittelpunkten und Radien der Punkte ermittelt, und sein Hover-Punkt ist eine View, die der Animator darauf platziert, in derselben Größe. Das Wachsen der Einblendung, die Bewegungen bei einer Änderung und das Ausblenden des Hovers sind Werte, die der Animator bewegt, sodass die Punkte pro Änderung einmal aufgezeichnet werden.
- Ein Cell-Mark wird in einem Canvas gezeichnet. Die Zelle unter dem Zeiger wird in Rust aus den Boxen der Zellen ermittelt, und ihre Hover-Zelle ist eine View, die der Animator darauf platziert. Das Wachsen, die Farb- und Positionswechsel bei einer Änderung und das Ausblenden des Hovers sind Werte, die der Animator bewegt, sodass die Zellen pro Änderung einmal aufgezeichnet werden. Jedes Label ist ein Text der Plattform und wird dort angezeigt, wo seine berechnete Größe in die Zelle passt.
- Die Labels, Tick-Marks und die Linie einer Achse sind die eigenen Texte und Views der Plattform. Das Layout in Rust platziert sie anhand der Größe und der Skalen des Plots: Sie bewegen sich mit den Marks, wenn sich die Größe des Plots ändert, und eine neue Domain schreibt die Labels neu.
