---
title: "Plot"
description: "Il componente Plot di nsh/base/plot, i suoi marchi Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey e Treemap, i suoi PlotAxis e PlotLabel: grafici disegnati nativamente a partire dalle righe dell'app, con le scale degli assi e le relative etichette, i testi sui punti dati, la riga, la cella o la fetta sotto il puntatore, il movimento e nessun aspetto proprio."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---


# Plot

Un plot è la cornice di un grafico: le righe di dati che mostra, le scale dei suoi assi x e y, il puntatore sopra di esso e il suo movimento. I suoi mark disegnano ciò che contiene: una `Line` attraverso una serie, un'`Area` tra una serie e una linea di base, una `Bar` per riga nelle bande di una scala a bande, un `Rule` per riga da un inizio a una fine (lo stoppino di una candela), un `Dot` per riga dove si incontrano due dei suoi valori (i punti di uno scatter, le bolle di un grafico a bolle), una `Cell` per riga nelle bande di due categorie, colorata in base al suo valore (una heatmap), una `Grid` di linee trasversali, una `Pie` delle quote delle righe (una ciambella con un foro), un `Arc` tra due angoli, e un `RadialLine` attorno al centro con gli anelli e i raggi di una `RadialGrid` dietro di esso (un radar), un `Sankey` di flussi tra le righe, e un `Treemap` di rettangoli annidati, con l'area di ogni foglia pari al suo valore (una market map); un `PlotAxis` etichetta un bordo con i tick della sua scala, e un `PlotLabel` scrive testi in punti delle scale. Ogni mark è un canvas che riempie il plot, disegnato nativamente a partire dalle righe: le righe dell'app vengono lette una sola volta, quando le imposta, poi scalate, registrate e disegnate in Rust, quindi un grafico di mille punti non esegue alcun JS per punto. Anche il puntatore è seguito in Rust: la linea di intersezione, i punti e il tooltip dell'hover si muovono e sfumano sull'animator della piattaforma, e l'app viene informata solo di una nuova riga, nient'altro. L'aspetto spetta all'app: i mark si dipingono con le proprietà di pittura CSS delle forme SVG (`stroke-*`, `fill-*`), `currentColor` dove nessuna è impostata, un'area o una barra mostra uno sfondo (un gradiente, `bg-linear-*`) all'interno della propria forma, e le parti dell'hover (tra cui il punto di ogni mark) e le etichette, i segni di graduazione e le linee degli assi sono a disposizione dell'app per stile e contenuto.

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

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` e `PlotLabel` provengono da `nsh/base/plot`, un modulo di [`nsh/base`](../modules/nsh-base.md) a sé stante (in Rust, `nsh_base::plot`). In TypeScript le prop di un plot sono generiche rispetto al tipo delle sue righe: i nomi dei campi vengono verificati rispetto ad esso, e una funzione di una riga riceve il tipo della riga. In Rust, `plot()` ne crea uno con un setter per ogni prop, le righe sono un `Rows` (colonne di numeri per chiave), i valori sono un `RowAccessor` (una chiave o una funzione dell'indice della riga), e i mark usano i metodi di pittura tipizzati (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`).

## Plot

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (obbligatorio) | Le righe, un oggetto per punto. I mark leggono i loro valori una sola volta, quando l'app imposta le righe; una riga senza valore (un campo che non è un numero, `null`) viene saltata. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | l'indice della riga | Ciò che colloca una riga lungo l'asse x in una scala x `linear`. Una scala `point` colloca le righe in ordine. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | nessuno | Ciò che i mark disegnano, a meno che non indichino il proprio. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | Come l'asse x colloca le righe: `point` (in ordine, in modo uniforme dal bordo sinistro a quello destro; una sola riga al centro), `linear` con un `domain` opzionale, oppure `band` (una banda per riga, per le barre, [Bar](#bar); o una banda per categoria, per le celle, [Cell](#cell)). Con una scala y `band` il valore predefinito è `linear`, per le barre orizzontali. `reverse: true` la fa partire dal bordo destro ([Scale invertite](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | Come l'asse y colloca i valori: il valore più piccolo del dominio sul bordo inferiore, il più grande su quello superiore. Senza un `domain`, l'estensione di ciò che i mark disegnano. `band` dispone una banda per riga dal bordo superiore verso il basso, per le barre orizzontali. `reverse: true` la fa correre nell'altro verso: il valore più piccolo sul bordo superiore, le righe dal bordo inferiore verso l'alto ([Scale invertite](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | nessuno | Una seconda scala y, `{ type: "linear", domain?, reverse? }`, per i mark che la nominano (`scale="y2"`): la scala di destra di un grafico a doppio asse ([Assi doppi](#dual-axes)). Senza un `domain`, l'estensione dei valori su di essa. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | Finché nessuna delle due scale y indica un dominio e ci sono mark su entrambe, entrambe vengono ampliate negli stessi passi arrotondati, in modo che i loro tick cadano sulle stesse linee ([Assi doppi](#dual-axes)). `false` lascia a ciascuna l'estensione dei propri valori. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | Il plot segue il puntatore e la tastiera: segnala la riga sotto di esso e mostra le parti dell'hover, ed è una tappa di Tab i cui tasti freccia spostano l'hover ([Tastiera](#keyboard)). `false` disegna solo i mark (una sparkline in una lista), e le pressioni su di esso vanno alle view circostanti. Se il plot offra o meno la tastiera viene deciso alla sua creazione. |
| `motion` | `.motion(..)` | `PlotMotion` | nessuno | I tempi dell'apparizione, della dissolvenza in entrata e in uscita dell'hover, e della molla su cui l'hover scivola quando i tasti lo spostano (sotto). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | nessuno | Attiva l'apparizione: i mark vengono disegnati progressivamente quando il plot viene mostrato per la prima volta, e di nuovo ogni volta che questo valore cambia (un altro simbolo, un altro periodo). All'interno di un [`PlotAppearScope`](#plotappearscope), una generazione che vi si è conclusa viene mostrata subito per intero. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono del grafico: cosa mostra e cosa spicca. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | nessuno | Ciò che gli screen reader sentono come suo valore: le parole dell'app per la riga sotto il puntatore. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La linea di intersezione: una view alta quanto il plot, centrata sulla riga sotto il puntatore. In una scala a bande si colloca nella banda della riga, larga quanto la banda (attraverso il plot in una scala y a bande). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | I punti dell'hover: una view per ogni `Line`, `Area` e `RadialLine`, centrata sul suo punto nella riga sotto il puntatore, e quella di un `Dot` grande quanto il suo punto sotto il puntatore. `hoverDotClass` / `hoverDotStyle` di un mark li sostituiscono per il suo punto. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | nessuno | Il tooltip dell'app, posizionato da `tooltipPlacement` e mosso e sfumato insieme alla linea di intersezione. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | Dove va il tooltip: in cima al plot, centrato sulla linea di intersezione; oppure accanto al puntatore, sul lato della linea di intersezione rivolto verso il centro del plot e sotto il puntatore nella metà superiore, sopra di esso in quella inferiore. In cima resta tra i bordi sinistro e destro del plot (il suo scostamento dal bordo superiore spetta all'app: un tag sotto il plot assume l'altezza del plot e oltre); accanto al puntatore resta all'interno del plot. Con la tastiera, va accanto al punto della prima linea o area nella riga (il centro della banda di una barra, il centro della fetta di un pie). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | La distanza tra il tooltip e ciò che lo posiziona: il bordo superiore per `"top"`, la linea di intersezione e il puntatore per `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | nessuno | I colori dei mark: delle categorie che il loro `color` legge, come `scaleOrdinal` di d3 (`{ type: "ordinal", domain?, range, unknown? }`, [Colori per categoria](#colors-by-category)), oppure dei numeri che il `value` di un `Cell` legge lungo una rampa, come `scaleSequential` e `scaleDiverging` di d3 (`{ type: "sequential" \| "diverging", … }`, [Colori lungo una rampa](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | I mark, disegnati in ordine uno sopra l'altro, e tutto ciò che l'app sovrappone ad essi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La dimensione e l'aspetto del plot; i mark ereditano le sue proprietà di pittura, come CSS le eredita. Le classi `focus:` / `focus-visible:` e `focusStyle` disegnano il suo anello di focus. |

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | Il puntatore è passato su un'altra riga: l'indice della riga più vicina ad esso lungo l'asse x (lungo l'asse y quando solo questo ha bande), della fetta del [pie](#pie-and-arc) sotto di esso, del [dot](#dot) il cui centro è più vicino ad esso, della [cell](#cell) sotto di esso (nello spazio tra due celle, la più vicina), oppure della riga di una [radial line](#radialline-and-radialgrid) più vicina ad esso per angolo; `null` quando esce dal plot (su un pie, le sue fette; su una radial line, il suo raggio esterno). |

`Scale` is `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear` Il `domain` di una scala è l'estensione dei suoi due valori, in qualsiasi ordine; un dominio di un solo valore lo colloca al centro. Il `domain` di una scala `band` è costituito dalle categorie delle sue bande, in ordine ([Cell](#cell)); le sue altre opzioni sono in [Bar](#bar).

Una funzione di una riga (`y={(d) => d.high - d.low}`) viene chiamata una volta per riga quando cambiano le righe o la funzione, nel turno successivo, mai mentre il plot disegna o segue il puntatore: mantienila pura (stessa riga, stesso numero). Il nome di un campo viene letto senza alcun JS.

<a id="reversed-scales"></a>

### Scale invertite

`reverse: true` fa correre una scala dal suo altro bordo, come le scale di visx accettano `reverse` e quelle di d3 accettano un range scritto al contrario. Sull'asse x la prima riga, o il valore più piccolo del dominio, si trova sul bordo destro; sull'asse y il valore più piccolo del dominio si trova sul bordo superiore e le righe corrono dal bordo inferiore verso l'alto. Tutto ciò che è collocato sulla scala la segue: i mark, la base delle barre e il verso in cui crescono, la linea di base di un'area, le linee della griglia, i tick di `PlotAxis`, la riga che l'hover trova, i tasti freccia ([Tastiera](#keyboard)) e gli spostamenti verso un nuovo dominio. Le barre pendono dal bordo superiore su una scala y `linear` invertita, e le barre orizzontali crescono verso sinistra dal bordo destro su una scala x `linear` invertita:

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

Con l'apparizione del plot, linee e aree vengono disegnate progressivamente a partire dal bordo da cui parte la scala x, quello destro quando è invertita.

<a id="dual-axes"></a>

### Assi doppi

<!-- demo: el-plot-dual -->

Un plot ha una seconda scala y per valori di altre unità: i volumi accanto a un prezzo, i ricavi accanto a un margine. Ogni parte che colloca valori lungo y accetta `scale`: `"y"` (il valore predefinito, il `yScale` del plot) oppure `"y2"` (il suo `y2Scale`). Un `PlotAxis` a destra con `scale="y2"` la etichetta:

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

Il dominio di ciascuna scala è proprio: il `domain` dell'app, oppure l'estensione dei valori su di essa, e ciascuna si sposta verso uno nuovo con `motion.update`. Finché nessuna delle due scale indica un dominio, il plot dispone entrambe nello stesso numero di passi arrotondati (1, 2 o 5 volte una potenza di dieci, un passo ogni circa 32 punti di altezza): quando entrambe contengono lo zero, lo zero cade sulla stessa linea in entrambe; altrimenti una scala che parte da zero (i volumi) acquisisce i passi aggiuntivi verso l'alto e un'altra (un prezzo) da entrambi i lati. I tick degli assi sono quei passi, e una `Grid` senza `x` né `y` disegna le sue linee su di essi, così una sola griglia serve entrambi gli assi. `alignTicks={false}` disattiva questo comportamento; un `domain` indicato dall'app lascia entrambe le scale così come sono.

L'hover trova una riga; il punto di ogni mark si trova sulla propria scala, e la lettura è dell'app, che legge entrambi i valori della riga che `onHoverChange` riporta. Le barre su entrambe le scale stanno affiancate in ogni banda, e un `stack` impila solo le barre sulla sua scala. `y2Scale` è lineare: un plot il cui asse y ha bande non ha una seconda scala y.
<a id="line-area-and-grid"></a>

## Line, Area e Grid

| Mark | Prop | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | `y` del plot | Ciò che disegna: un punto per ogni riga con un valore; le righe senza valore vengono saltate. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | le righe del plot | Righe di una serie propria (altri valori x), posizionate sulle scale del plot tramite il proprio `x` (senza, l'indice della riga). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | Come collega i suoi punti: una curva morbida, segmenti retti, oppure gradini che mantengono ogni valore fino alla riga successiva. Il bordo inferiore di un'area segue la stessa curva. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un pallino su ogni punto: una view centrata su di esso, con dimensione, sfondo e bordo decisi dall'app. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` del plot | Il suo pallino di hover, sul punto della riga sotto il puntatore: il pallino di ogni serie nel proprio colore. Ciascuno sostituisce quello del plot per questo mark (il colore del mark prevale su dimensione e anello del plot); `hidden` non ne mostra alcuno. |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo sfondo: un riquadro attorno alla sua forma (dal primo all'ultimo punto, dal punto più alto alla linea di base, oppure fino al punto più basso del suo bordo inferiore in una banda) il cui sfondo (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) si vede solo dentro la forma, sotto il suo `fill`. Se ce n'è uno, `fill` è `none` dove non ne è impostato nessuno. |
| `Area` | `y1` | `string \| (d, index) => number` | `y` del plot | Ciò che forma il suo bordo superiore. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | il bordo inferiore della scala y | Il suo bordo inferiore: un numero è una linea di base sulla scala y; un campo o una funzione assegna a ogni riga un proprio valore inferiore, che rende l'area una banda (dal minimo al massimo di un giorno, l'intervallo di una previsione). Senza, l'area si chiude sul bordo dove si trovano i valori più piccoli della scala y: il bordo inferiore, oppure quello superiore su una scala invertita (un'area che pende dall'alto). Una riga senza valore su uno dei due bordi viene saltata. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | La scala y lungo cui scorrono i suoi valori: il `yScale` del plot o la sua seconda, `y2Scale` ([Dual axes](#dual-axes)). |
| `Grid` | `x` | `number[]` | nessuno | Dove vanno le sue linee verticali, come valori della scala x (indici di riga su una scala `point`). |
| `Grid` | `y` | `number[]` | nessuno | Dove vanno le sue linee orizzontali, come valori della scala y. Senza `x` né `y`, le linee seguono i tick della sua scala, dove li colloca un `PlotAxis` senza `ticks` (lungo x per le barre orizzontali). |
| `Grid` | `ticks` | `number` | il default dell'asse | Circa quante linee disegna senza `x` né `y`, come il `ticks` di un `PlotAxis`. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | nessuno | La categoria delle sue righe, con il colore preso dal `colorScale` del plot: la categoria della sua prima riga determina il `stroke` della linea (il `fill` dell'area) dove nulla ne imposta uno ([Colors by category](#colors-by-category)). |

Ogni mark riempie il plot e disegna con le proprie [SVG paint properties](../modules/style-reference.md#svg-paint), che prevalgono su quelle del plot, come CSS le eredita:

| Mark | Disegna con | Dove non ne è impostata nessuna |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, spessore 1, continuo |
| `Area` | `fill` (sulla sua parte `background`); il suo bordo superiore `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (`none` accanto a uno sfondo); nessun tratto |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, spessore 1, continuo; ogni linea su pixel di dispositivo interi, così una linea sottile resta nitida |

I valori che un `Line` o un `Area` disegna, anche il `y0` di un'area (la sua linea di base, oppure il valore inferiore di ogni riga), formano il dominio della scala y quando il plot non ne ha uno; quelli di una griglia no. Un mark viene ridisegnato solo quando cambia ciò che disegna (le sue righe, i valori, la curva, la dimensione o le scale del plot, il suo paint); il puntatore sposta le parti dell'hover e non ridisegna mai un mark.

Una banda è un `Area` il cui `y0` legge le righe: il suo bordo superiore passa per `y1`, il suo bordo inferiore torna indietro per `y0`, entrambi con il `curve` dell'area, e l'appear li disegna entrambi a partire dal bordo iniziale. Il suo pallino di hover si trova sul bordo superiore; un `Line` sopra di essa segna il valore centrale:

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` è quello di CSS, come in un browser: un colore. Un gradiente sotto una linea è lo sfondo di un'area, nel modo in cui una pagina mostra un gradiente in una forma (il `background-image` di un riquadro sotto `clip-path`): `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` sfuma dal punto più alto dell'area fino alla sua linea di base, con i token del tema e i colori dell'aspetto come lo sfondo di qualsiasi view.

## Bar

Un `Bar` disegna una barra per riga nella banda della riga su una scala `band`: verticale su una scala x a bande, orizzontale su una scala y a bande (la scala x allora `linear`). Ogni barra va da `base` al valore della riga sull'altra scala, così un valore negativo cresce nel verso opposto, e una riga senza valore non ha barra. Su una scala dei valori invertita le barre crescono verso il basso dal bordo superiore o verso sinistra dal bordo destro, e una scala a bande invertita pone la banda della prima riga a destra o in basso ([Reversed scales](#reversed-scales)).

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

Le barre fuori da uno stack stanno affiancate in ogni banda, nell'ordine dei mark; le barre con lo stesso `stack` si impilano, e la barra di ogni riga parte da dove finisce quella che la precede nello stack:

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` del plot | Ciò che mostra ogni barra. |
| `base` | `number \| string \| (d, index) => number` | `0` | Il valore da cui crescono le sue barre, sulla scala dei valori: uno per tutte le righe, oppure un campo o una funzione che assegna a ogni riga il proprio, così ogni barra copre dalla base della riga al suo valore (una riga senza base non ha barra). Conta nel dominio. Uno stack cresce dalla base della sua prima barra, riga per riga. |
| `stack` | `string` | nessuno | Lo stack a cui si unisce: le barre con lo stesso `stack` si impilano in ordine (una riga senza valore non aggiunge nulla). |
| `scale` | `"y" \| "y2"` | `"y"` | La scala y lungo cui scorrono i valori delle sue barre verticali ([Dual axes](#dual-axes)); le barre su entrambe stanno affiancate, e uno stack impila solo le barre sulla sua scala. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Il raggio di ogni angolo delle sue barre; `{ topLeft: 4, topRight: 4 }` arrotonda le punte delle barre verticali. Un raggio maggiore di metà barra viene ridotto per adattarsi. |
| `stagger` | `number` | `0` | Con l'appear del plot, le barre partono una dopo l'altra, riga per riga, in questa quota dell'animazione (da 0 a 0.95), e ciascuna cresce per il resto; 0 le fa crescere insieme. |
| `inactiveOpacity` | `number` | nessuno | L'opacità delle sue barre lontane dalla riga sotto il puntatore mentre il puntatore è sopra il plot, così che quella riga risalti: sfuma in entrata e in uscita con l'hover e passa da barra a barra insieme ad esso. |
| `label` | `string \| (d, index) => string` | nessuno | Il testo all'estremità del valore di ogni barra: un campo (il suo testo, o il suo numero) oppure una funzione che restituisce il testo formattato dall'app. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | nessuno | La parte `label`: un testo centrato sulla barra, sopra l'estremità di una barra verticale (sotto una che cresce verso il basso), dopo una barra orizzontale (prima di una che cresce all'indietro). Il suo padding è la distanza dalla barra. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo sfondo: il riquadro di ogni barra, il cui sfondo (`bg-linear-to-t from-… to-…`, dalla base della barra alla sua cima) si vede solo dentro la barra, sotto il suo `fill`. Se ce n'è uno, `fill` è `none` dove non ne è impostato nessuno. |
| `color` | `string \| (d, index) => string` | nessuno | La categoria di ogni barra, con il colore preso dal `colorScale` del plot: il `fill` della barra dove nulla ne imposta uno ([Colors by category](#colors-by-category)). |

La scala a bande dispone una banda per ogni riga del plot, in ordine, oppure una banda per ogni categoria del suo `domain`, come fa `scaleBand` di d3:

| Opzione | Default | Descrizione |
|---|---|---|
| `domain` | nessuno | Le categorie delle sue bande, in ordine (il `scaleBand().domain()` di d3): un [`Cell`](#cell) va nella banda della categoria della sua riga, e un `PlotAxis` scrive la categoria di ogni banda; una categoria scritta due volte mantiene il suo primo posto. Senza, le bande sono le righe, oppure, sulle celle, le categorie che le celle nominano lungo l'asse, nell'ordine in cui le righe le portano. |
| `paddingInner` | `0` | Lo spazio tra bande vicine, una quota del passo di ogni banda (da 0 a 1). |
| `paddingOuter` | `0` | Lo spazio prima della prima banda e dopo l'ultima, una quota di un passo. La metà di `paddingInner` pone i centri delle bande a passi uguali lungo il plot. |
| `maxBandWidth` | nessuno | La larghezza massima di una banda, in punti: poche bande su un plot largo restano strette, ciascuna al centro del proprio posto. |
| `bandCount` | le righe | Le bande per cui è disposto l'asse quando sono più delle righe: le righe prendono le prime e mantengono larghezza e posizione man mano che arrivano. |
| `groupPadding` | `0` | Lo spazio tra le barre affiancate in una banda, una quota del posto di ogni barra. |
| `reverse` | `false` | Le bande partono dall'altro bordo: quella della prima riga a destra dell'asse x, in basso nell'asse y; le barre affiancate in una banda mantengono il loro ordine. |

Una barra viene disegnata con il suo `fill` (`fill-*`; ereditato dal plot come CSS lo eredita), `currentColor` dove non ne è impostato nessuno (il colore della sua categoria con `color`), e non mostra alcun pallino di hover. Su una scala a bande, l'hover trova la banda sotto il puntatore, e la linea trasversale del plot si trova in quella banda, larga quanto essa: `crossLineClass="w-full h-full bg-foreground/5"` tinge la banda, `w-px` mantiene una linea al suo centro. I valori e la base delle barre formano il dominio della scala dei valori quando il plot non ne ha uno. Con l'appear del plot, ogni barra cresce dalla base del proprio stack; il movimento, la dissolvenza e lo scorrimento girano sull'animator della piattaforma, e il puntatore non ridisegna nessuna barra.

### Ranges

<!-- demo: el-plot-ranges -->

Con `base` un campo o una funzione, ogni barra copre due valori della sua riga: il gradino di una waterfall dal totale parziale precedente a quello successivo, il corpo di una candela dall'apertura alla chiusura, un'attività dall'inizio alla fine. Una barra cresce dalla propria base mentre appare, e la sua etichetta si trova all'estremità del valore, sopra una barra che sale e sotto una che scende.

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

Un funnel è fatto di barre orizzontali, centrate: `base={(d) => -d.users / 2}` e `value={(d) => d.users / 2}` su una scala y a bande.

## Rule

Un `Rule` disegna una linea retta per ogni riga lungo l'asse dei valori, da `base` al valore della riga: al centro della banda della riga su una scala a bande (attraverso il plot su una scala y a bande), nella posizione della riga lungo l'asse x su una scala point o lineare. Lo stelo di una candela, i baffi di un box plot, una barra di errore e lo stelo di un lollipop sono rule; un candlestick è un `Bar` sopra un `Rule`:

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

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` del plot | Dove finisce ogni linea. Una riga senza valore non ha linea. |
| `base` | `number \| string \| (d, index) => number` | `0` | Dove inizia ogni linea: un valore per tutte le righe (lo stelo di un lollipop dalla linea dello zero), oppure un campo o una funzione che assegna a ogni riga il proprio (il minimo di una candela). Conta nel dominio. |
| `scale` | `"y" \| "y2"` | `"y"` | La scala y lungo cui scorrono i suoi valori ([Dual axes](#dual-axes)). |
| `stagger` | `number` | `0` | Con l'appear del plot, le linee partono una dopo l'altra, riga per riga, in questa quota dell'animazione (da 0 a 0.95), e ciascuna cresce dal proprio inizio per il resto. |
| `inactiveOpacity` | `number` | nessuno | L'opacità delle sue linee lontane dalla riga sotto il puntatore mentre il puntatore è sopra il plot, come quella di `Bar`. |
| `color` | `string \| (d, index) => string` | nessuno | La categoria di ogni linea, con il colore preso dal `colorScale` del plot: il `stroke` della linea dove nulla ne imposta uno. |

Una rule traccia con il suo `stroke` (`stroke-*`, `strokeWidth`, `strokeDasharray`; ereditato dal plot come CSS lo eredita), `currentColor` dove non ne è impostato nessuno, e non mostra alcun pallino di hover. I suoi valori e la sua base formano il dominio della scala dei valori quando il plot non ne ha uno; cresce dal proprio inizio con l'appear del plot e si muove con i domini delle scale, sull'animator della piattaforma.
## Dot

<!-- demo: el-plot-dots -->

Un `Dot` disegna un punto per riga dove si incontrano due valori della riga: il suo `x` lungo una scala x `linear` e il suo `value` lungo l'asse y formano uno scatter plot; su una scala x di tipo band ogni punto si trova al centro della banda della sua riga; su una scala y di tipo band (con la scala x `linear`), il suo valore scorre lungo x e la banda della sua riga scende lungo il plot, un dot plot. Il suo raggio `r` è un unico numero per tutti i punti, oppure un valore di ogni riga che `rScale` trasforma in un raggio, un bubble chart. Una riga senza valore non ha alcun punto.

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

Con `r` impostato a un campo o a una funzione, il valore di ogni riga determina la dimensione del suo punto. `rScale={{ type: "sqrt", range: [min, max] }}` mappa le radici quadrate dei valori sui raggi in punti, come fa `scaleSqrt` di d3, quindi con un range che parte da 0 l'area di una bolla è proporzionale al suo valore; un range che parte da più di 0 mantiene visibili le bolle più piccole. Il dominio va da 0 al valore più grande, a meno che la scala non ne indichi uno. I punti più grandi vengono disegnati per primi, così quelli più piccoli restano visibili sopra di essi:

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

I valori di un punto formano il dominio della scala dei valori quando il plot non ne ha uno, senza arrivare fino a 0, così gli assi di uno scatter si adattano ai suoi punti. Quando i punti sono grandi, assegna al plot dei `domain` con un po' di margine attorno ai valori: una bolla al bordo del dominio viene disegnata oltre il bordo del plot.

Due mark nelle stesse bande formano i grafici che confrontano due valori di una riga: un lollipop è un `Rule` da 0 sotto un `Dot` al suo valore, e un dumbbell è un `Rule` da un valore all'altro con un `Dot` a ciascuna estremità, su una scala y di tipo band:

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | il `y` del plot | Dove va ogni punto lungo l'asse dei valori: lungo l'asse y, oppure lungo x su una scala y di tipo band. Una riga senza valore non ha alcun punto. |
| `r` | `number \| string \| (d, index) => number` | `3` | Il raggio dei punti in punti, oppure un campo o una funzione che dà a ogni riga un valore che `rScale` trasforma in un raggio (senza di essa il valore è il raggio). Una riga il cui valore manca non ha alcun punto. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | nessuno | Come i valori di `r` diventano raggi: le loro radici quadrate sul `domain` (da 0 al valore più grande, se non ce n'è uno) sul `range` dei raggi, così un range che parte da 0 rende l'area di ogni punto proporzionale al suo valore. I valori fuori dal dominio assumono gli estremi del range. |
| `stagger` | `number` | `0` | Con l'appear del plot, i punti iniziano a crescere uno dopo l'altro, riga per riga, in questa quota della durata (da 0 a 0.95); 0 li fa crescere tutti insieme. |
| `inactiveOpacity` | `number` | nessuno | L'opacità degli altri punti mentre uno è sotto il puntatore o i tasti: sfumano in entrata e in uscita con l'hover. |
| `color` | `string \| (d, index) => string` | nessuno | La categoria di ogni punto, il suo colore dal `colorScale` del plot: il `fill` del punto dove nient'altro ne imposta uno ([Colori per categoria](#colors-by-category)). |
| `hitRadius` | `number` | `8` | Quanto oltre il bordo di un punto il puntatore riesce ancora a trovarlo: tra i punti entro questa distanza, il puntatore trova quello il cui centro gli è più vicino (le celle di Voronoi), così una piccola bolla sopra una grande viene trovata attorno al proprio centro. La riga di un dot plot viene trovata da qualsiasi punto lungo di essa con un raggio grande quanto una riga. |
| `scale` | `"y" \| "y2"` | `"y"` | La scala y lungo cui vanno i suoi valori ([Assi doppi](#dual-axes)); i punti su una scala y di tipo band mettono i loro valori lungo x. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | il `dotClass`, `dotStyle` del plot | La parte `hoverDot`: una view larga e alta quanto il punto sotto il puntatore, centrata su di esso. `rounded-full outline-2 outline-offset-1` lo cerchia; `hidden` non ne mostra alcuna per questo mark. |

Un punto si riempie con il suo `fill` (`fill-*`; ereditato dal plot come lo eredita il CSS), `currentColor` dove non ne è impostato nessuno (il colore della sua categoria con `color`), e ha il contorno con il suo `stroke` dove ne è impostato uno (`stroke-*`, `strokeWidth`): un anello del colore della card tiene separati i punti sovrapposti. Su un plot con punti, il plot segnala la riga del punto il cui centro è più vicino al puntatore (`null` da ogni punto), i tasti scorrono le righe nel loro ordine (ordina le righe per x, e i tasti percorrono i punti da sinistra a destra), e la parte `hoverDot` segna il punto. Con l'appear del plot, i punti crescono dal nulla; con `motion.update`, si spostano ai loro nuovi valori e dimensioni, il punto di una nuova riga cresce in entrata e il punto di una riga scomparsa si riduce fino a sparire; tutto sull'animator della piattaforma, senza che alcun mark venga ridisegnato.

## Cell

<!-- demo: el-plot-cells -->

Un `Cell` disegna un rettangolo per riga in due bande contemporaneamente: la banda della sua categoria `x` lungo una scala x `band` e la banda della sua categoria `y` lungo una scala y `band`, così le righe formano una griglia, una heatmap. Una matrice di correlazione, un calendario dei rendimenti mensili e una settimana di operazioni per ora sono cell. Ogni cella riempie le sue due bande, quindi `paddingInner` e `paddingOuter` delle scale sono gli spazi tra le celle e attorno ad esse. Il suo colore è il suo `value` lungo il `colorScale` del plot, una rampa di colori ([Colori lungo una rampa](#colors-along-a-ramp)), oppure quello della sua categoria `color` attraverso una scala ordinale. Le celle stanno sulle scale x e y del plot.

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

Il `domain` di una scala band elenca in ordine le categorie delle sue bande, come fa `scaleBand().domain()` di d3: i mesi di un calendario da gennaio a dicembre, ciascuno con la propria banda che le sue righe siano arrivate o no, così marzo 2026 qui sopra è un posto vuoto nella griglia. Senza un dominio, le bande sono le categorie che le celle nominano lungo l'asse, nell'ordine in cui le righe le portano (2025 sopra 2026). Un `PlotAxis` lungo una scala band di categorie scrive la categoria di ogni banda, senza `format`.

Una matrice di correlazione nomina gli stessi titoli lungo entrambi gli assi, con il suo `domain` pari all'intero intervallo dei coefficienti, così un coefficiente di 0 prende il centro della rampa qualunque siano i titoli:

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

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | nessuno | La colonna di ogni riga: un campo (il suo testo, o il suo numero) o una funzione che restituisce la categoria. La cella della riga va nella banda di quella categoria della scala x; una riga senza categoria non ha alcuna cella. |
| `y` | `string \| (d, index) => string` | nessuno | La riga di ogni riga, come `x` lungo la scala y. |
| `value` | `string \| (d, index) => number` | nessuno | Il numero di ogni cella, che un `sequential` o `diverging` `colorScale` trasforma nel suo colore. Una riga senza numero prende il colore `unknown` della scala, e se questo manca non ha alcuna cella. |
| `color` | `string \| (d, index) => string` | nessuno | La categoria di ogni cella, il suo colore da un `ordinal` `colorScale` ([Colori per categoria](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Il raggio di ogni angolo delle sue celle. |
| `stagger` | `number` | `0` | Con l'appear del plot, le celle iniziano a crescere una dopo l'altra, riga per riga, in questa quota della durata (da 0 a 0.95), ciascuna dal proprio centro per il resto; 0 le fa crescere tutte insieme. |
| `inactiveOpacity` | `number` | nessuno | L'opacità delle altre celle e delle loro etichette mentre una è sotto il puntatore o i tasti: sfumano in entrata e in uscita con l'hover. |
| `label` | `string \| (d, index) => string` | nessuno | La parte `label`: un testo al centro di ogni cella, un campo (il suo testo, o il suo numero) o una funzione che restituisce il testo formattato dall'app. Ogni etichetta compare dove la sua dimensione calcolata nel layout sta dentro la cella, così un plot stretto mostra solo i colori. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | nessuno | Il font, la dimensione e il colore delle etichette. Un'etichetta su una cella il cui colore `colorScale` è scuro ha l'attributo `data-dark` (dove un testo chiaro si legge meglio), così `data-dark:text-white` lo scrive chiaro in quel caso. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | nessuno | La parte `hoverCell`: una view grande quanto la cella sotto il puntatore o i tasti, sopra di essa; `rounded-sm outline-2 outline-foreground` la cerchia. Si muove con il puntatore nello stesso frame e scivola sulla spring `pointer` quando i tasti la spostano. |

Una cella si riempie con il suo colore dal `colorScale` del plot dove l'app non imposta alcun `fill` (le classi e gli stili `fill-*` hanno la precedenza, ereditati dal plot come li eredita il CSS), `currentColor` dove nient'altro ne imposta uno, e ha il contorno con il suo `stroke` dove ne è impostato uno. Su un plot con celle, il plot segnala la riga della cella sotto il puntatore, e nello spazio tra due celle quella più vicina; i tasti freccia scorrono la griglia sullo schermo ([Tastiera](#keyboard)), e gli screen reader scorrono le righe nel loro ordine. Con l'appear del plot, le celle crescono dal loro centro; con `motion.update`, il colore di una cella scivola verso il nuovo, la cella di una nuova riga cresce in entrata, la cella di una riga scomparsa si riduce fino a sparire, e le celle si spostano alle loro nuove bande; tutto sull'animator della piattaforma, senza che alcun mark venga ridisegnato.
<a id="pie-and-arc"></a>

## Pie e Arc

Un `Pie` divide un giro in una fetta per riga, ciascuna in proporzione al valore della riga, in senso orario dalle ore 12 nell'ordine delle righe, attorno al centro del plot. Un `innerRadius` lo trasforma in un donut. Ogni fetta è un canvas a sé, la parte `slice`, quindi ciascuna si dipinge con le proprie classi: `sliceClass` sono le stesse classi su ogni fetta, oppure una funzione della riga della fetta che ne assegna di proprie a ciascuna. Su un pie, il plot riporta la riga della fetta sotto il puntatore (nessuna nel foro o fuori dall'anello), il suo tooltip segue il puntatore, e quella fetta cresce di `hoverLift` mentre le altre sfumano di `hoverDim`, sull'animator della piattaforma con il `motion` del plot. Un `Arc` disegna un settore tra due angoli: la traccia e il valore di un gauge, oppure un anello dietro un pie.

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

| Mark | Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | `y` del plot | Quanto vale ogni riga. Una riga che non vale nulla, che vale meno di zero o che non ha un numero non ha fetta. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianti) | `0`, `2 * Math.PI` | Dove inizia la prima fetta e dove finisce l'ultima (le estremità di un arc): radianti dalle ore 12, in senso orario. Un `endAngle` inferiore a `startAngle` dispone le fette di un pie nell'altro verso. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (radianti) | `0` | L'angolo tra fette vicine sul bordo esterno. Ogni spazio mantiene quella larghezza (circa `padAngle * outerRadius` punti) a ogni raggio, con i bordi paralleli, quindi è largo al centro o al foro quanto sul bordo; una fetta troppo stretta per raggiungere il centro termina dove i suoi bordi si incontrano. Un pie di una sola fetta non ne ha. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | I raggi del foro e del bordo esterno: in punti, oppure come percentuale del cerchio più grande che il plot contiene (metà del suo lato minore). |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | Il raggio degli angoli di ogni fetta (di un arc), in punti, come il `arc.cornerRadius` di d3: ogni angolo è un cerchio che tocca il lato e il bordo esterno o il foro, inclusi i bordi paralleli degli spazi. Al massimo è metà dello spessore dell'anello, il che dà a un arc estremità arrotondate, e su una fetta troppo stretta per due angoli interi questi si incontrano a metà. Un anello intero mantiene solo i suoi bordi arrotondati. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | nessuno | Le classi di ogni fetta (`fill-*`, `stroke-*`): le stesse su ogni fetta, oppure una funzione della riga della fetta e del suo indice, chiamata una volta per riga quando cambiano le righe o la funzione. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile di ogni fetta, sopra le sue classi (`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | Di quanto la fetta sotto il puntatore cresce rispetto alle altre, in punti: sulla spring `pointer` del plot, con dissolvenza in entrata e in uscita insieme all'hover. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (da 0 a 1) | `0` | Quanto sfumano le altre fette mentre una è sotto il puntatore, come quota della loro opacità, con la dissolvenza dell'hover. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | nessuno | La categoria di ogni fetta, il suo colore dal `colorScale` del plot: il `fill` della fetta dove nulla ne imposta uno ([Colori per categoria](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | nessuno | Il testo accanto a ogni fetta: un campo (il suo numero) oppure una funzione che restituisce il testo formattato dall'app. Una riga con testo vuoto, o una fetta più stretta di mezzo grado, non lo ha. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | La parte `label`: un testo fuori dall'anello all'estremità della sua linea guida, centrato su di essa, dopo di essa nella metà destra del pie e prima nella metà sinistra. Il suo padding è la distanza dall'estremità della linea. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | Quanto oltre il bordo esterno si trovano le etichette, in punti. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | nessuno | La parte `labelLine`: la linea guida di ogni etichetta, dal bordo esterno a metà della fetta fino al raggio dell'etichetta, poi di lato fino al testo. Il suo `stroke` (`currentColor` dove non ne è impostato uno), `strokeWidth` e `strokeDasharray`, gli stessi su ogni linea oppure una funzione della riga della fetta; visibile una volta stilizzata. |

Una fetta e un arc si riempiono con `fill` (`currentColor` dove non ne è impostato uno, con `color` il colore della categoria della fetta) e tracciano i loro bordi con `stroke` (nessuno dove non ne è impostato uno), i propri sopra quelli del pie e del plot così come li eredita CSS: un tratto del colore della superficie (`stroke-card stroke-2`) crea anche spazi tra le fette. I loro valori non partecipano alle scale del plot. Le fette di un pie vengono ridisegnate solo quando cambiano le righe, i loro valori, gli angoli, i raggi o la dimensione del plot; il puntatore muove l'innalzamento e la dissolvenza sull'animator.

I plot con un pie di solito posizionano il tooltip vicino al puntatore (`tooltipPlacement="pointer"`), dato che le righe di un pie non hanno una posizione lungo un asse: la linea trasversale e il tooltip seguono il puntatore su di esso, e non vengono mostrati punti di hover. Il centro di un donut è un elemento proprio dell'app sovrapposto al plot (il valore della fetta in hover, oppure il totale), e lo stesso vale per la sua legenda, con ogni chiave nel colore della sua fetta.

Le etichette di un pie nominano le sue fette fuori dall'anello: ogni testo si trova a `labelGap` oltre il bordo esterno verso la metà della sua fetta (il centroide della fetta a quel raggio), poi di lato fino a quel raggio dalla parte della fetta nel pie, e una linea guida stilizzata lo collega al bordo. Le etichette si dispiegano con le loro fette all'apparizione del plot e compaiono in dissolvenza alla sua fine, si muovono con esse su `motion.update` e si sollevano con la fetta in hover; tutto viene eseguito sull'animator della piattaforma. Lascia al plot lo spazio per le etichette: un `outerRadius` inferiore a `"100%"`, oppure spazio attorno al plot. Il contenuto proprio dell'app su una fetta è un elemento sovrapposto al plot, come il centro di un donut.

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

## Colori per categoria

Il `colorScale` di un plot assegna i colori alle categorie, come fa il `scaleOrdinal` di d3, e il `color` di un mark indica la categoria di ogni riga: un campo (il suo testo o il suo numero) oppure una funzione della riga. Le categorie del `domain` prendono i colori del `range` in ordine, e il range ricomincia dal primo colore quando il dominio è più lungo. Una categoria fuori dal dominio prende `unknown`; senza di esso, entra nel dominio la prima volta che un mark la incontra (i mark in ordine, ciascuno con le sue righe in ordine) e prende il colore successivo, quindi senza alcun `domain` le categorie prendono i colori nell'ordine in cui le righe le portano. I colori sono quelli dell'app: colori CSS, compresi i token del tema.

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

Una fetta, una barra e un punto prendono il colore della loro riga; un `Line` e un `Area` sono una serie ciascuno e prendono quello della loro prima riga, quindi una linea di righe proprie (`data`) ha il colore delle sue righe, e una sola scala mantiene lo stesso colore di una categoria in un pie, nelle barre e nelle linee. Il colore è il `fill` del mark (il `stroke` di una linea) dove nulla ne imposta uno, al posto di `currentColor`: vengono prima le classi e gli stili dell'app, poi quelli della parte (`sliceClass`, `sliceStyle`), poi quelli del mark e quelli che eredita dal plot, quindi `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` imposta una fetta a parte mentre la scala colora le altre. Accanto a una parte `background`, il `fill` di una barra e di un'area resta `none`.

| `OrdinalScale` | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `type` | `"ordinal"` | (obbligatorio) | Il tipo di scala. |
| `domain` | `string[]` | nessuno | Le categorie, in ordine. Una categoria scritta due volte mantiene il suo primo posto. |
| `range` | `string[]` | (obbligatorio) | I colori, in ordine (colori CSS); la categoria `i` prende il colore `i % range.length`. |
| `unknown` | `string` | nessuno | Il colore di ogni categoria fuori dal dominio; senza di esso, ciascuna prende il colore successivo. |

<a id="colors-along-a-ramp"></a>

### Colori lungo una rampa

Un `colorScale` di `type: "sequential"` o `"diverging"` assegna ai numeri i loro colori lungo una rampa, come fanno `scaleSequential` e `scaleDiverging` di d3, per il `value` di un [`Cell`](#cell). Il suo `range` è composto da due o più colori distribuiti uniformemente lungo la rampa dall'estremo basso a quello alto e mescolati in OKLab tra loro: i passaggi appaiono uniformi all'occhio, e due tonalità si incontrano attraverso la loro miscela. Un valore oltre il `domain` prende l'estremo della rampa, e una riga senza valore prende `unknown`.

`sequential` distribuisce il suo `domain` sull'intera rampa, con il dominio pari all'estensione dei valori delle celle a meno che l'app non ne indichi uno: conteggi, volumi, attività. `diverging` pone il suo `pivot` (0 per impostazione predefinita) al colore centrale della rampa, con i valori inferiori lungo la prima metà e quelli superiori lungo la seconda: perdite in una tonalità, guadagni in un'altra, un mese piatto nel centro neutro. A meno che l'app non indichi un dominio, questo è l'estensione dei valori resa simmetrica ai due lati del pivot (`symmetric` di Observable Plot), quindi una perdita e un guadagno della stessa entità hanno la stessa intensità; una matrice di correlazione indica `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (obbligatorio) | Il tipo di rampa. |
| `domain` | `[number, number]` | l'estensione dei valori (resa simmetrica attorno al pivot per `diverging`) | I valori dei due estremi della rampa. |
| `pivot` | `number` | `0` | Solo `diverging`: il valore del colore centrale della rampa. |
| `range` | `string[]` | (obbligatorio) | I colori lungo la rampa, dall'estremo basso a quello alto (colori CSS), mescolati in OKLab tra loro. |
| `unknown` | `string` | nessuno | Il colore di una riga senza valore; senza di esso, quella riga non ha cella. |
<a id="radialline-and-radialgrid"></a>

## RadialLine e RadialGrid

Un `RadialLine` disegna una serie attorno al centro del plot: il poligono di un radar, o una linea attorno a un quadrante. Ogni riga con un valore è un punto all'angolo della riga, tanto lontano dal centro quanto la scala y del plot colloca il suo valore, da `innerRadius` (il valore minimo del dominio) a `outerRadius` (il massimo). Senza un `angle`, le righe si dispongono uniformemente lungo il giro a partire dalle ore 12, in senso orario e in ordine, quindi sei righe formano un esagono; `closed` unisce l'ultimo punto al primo. Una linea traccia i suoi punti e riempie la sua area fino a `innerRadius` (per default il centro), così un solo mark è il contorno di un radar e la sua campitura. Un `RadialGrid` disegna dietro di esso la griglia del radar: `rings` a valori della scala y, poligoni attraverso gli angoli delle righe oppure `circular`, e `spokes` fino a ogni riga. Sopra una linea radiale, il plot riporta la riga il cui angolo è più vicino a quello del puntatore entro il raggio esterno della linea, e il punto di hover di ogni linea si posiziona sul suo punto di quella riga.

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

| Mark | Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | `y` del plot | Ciò che colloca ogni riga a distanza dal centro: un valore della scala y, da `innerRadius` per il valore minimo del dominio a `outerRadius` per il massimo. Una riga che ne è priva viene saltata. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | le righe distribuite uniformemente lungo il giro | Dove va ogni riga attorno al centro: radianti dalle ore 12, in senso orario. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radianti) | `0`, `2 * Math.PI` | Dove vanno le righe senza `angle`: a partire da `startAngle`, in modo uniforme. Su un giro intero distano un passo pari a `1 / rows` di giro, con l'ultima un passo prima della prima; su una parte di giro la prima si trova su `startAngle` e l'ultima su `endAngle`. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Dove vanno il valore minimo e quello massimo del dominio y: punti, oppure una percentuale del cerchio più grande che il plot contiene (metà del suo lato minore), come i raggi di un grafico a torta. L'area di una linea si riempie fino a `innerRadius`; i raggi di una griglia corrono tra i due. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | Come collega i suoi punti: segmenti dritti, una curva morbida (se chiusa, un anello morbido) o gradini. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | Prosegue dall'ultimo punto tornando al primo: il poligono di un radar. Se aperta, la sua area si chiude sul centro (o lungo il suo bordo interno). |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un punto su ogni punto della linea: una view centrata su di esso, con dimensione, sfondo e bordo definiti dall'app. I punti crescono e si muovono insieme alla linea. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo sfondo: un box attorno al suo cerchio esterno il cui sfondo (`bg-*`, un gradiente) è visibile solo all'interno della sua area, sotto il suo `fill`, come quello di un'area. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` del plot | Il suo punto di hover, sul suo punto della riga sotto il puntatore, con il puntatore nello stesso frame e che scivola verso la riga successiva con la molla `pointer` del plot quando i tasti avanzano; `hidden` non ne mostra alcuno. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | nessuno | Dove vanno i suoi anelli, come valori della scala y: ciascuno tanto lontano quanto una linea radiale colloca quel valore. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | Una linea da `innerRadius` a `outerRadius` all'angolo di ogni riga. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | I suoi anelli sono cerchi (archi su una parte di giro). Per default sono poligoni attraverso gli angoli delle righe, e cerchi finché il plot ha meno di tre righe. |

Una linea radiale traccia il contorno con `stroke`, `strokeWidth` e `strokeDasharray` (`currentColor`, spessore 1 e continuo dove non è impostato nulla) e riempie la sua area con `fill` (nessuno dove non è impostato nulla); una griglia radiale traccia il contorno come fa una griglia. La loro vernice è ereditata dal plot. I valori di una linea, insieme allo 0, formano il dominio della scala y quando il plot non ne ha uno, così un radar di valori positivi cresce dal suo centro; gli anelli di una griglia no. Assegna al plot un `domain` y per mantenere fissi gli anelli e la scala del radar mentre i valori cambiano.

Le etichette attorno a un radar sono elementi dell'app sovrapposti al plot, come lo è il centro di una ciambella. Senza un `angle`, la riga `i` di `n` si trova a `a = 2π·i / n` dalle ore 12, quindi in un plot quadrato un box senza dimensione a `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (con `r` una percentuale del lato del plot di poco superiore alla metà della quota del raggio esterno) segna il punto oltre il bordo, e il nome cresce da lì allontanandosi dal centro: a destra di esso nella metà destra, a sinistra nella metà sinistra, sopra in alto e sotto in basso, come sopra.

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

Un `Sankey` disegna i flussi tra le righe del plot: ogni riga è un nodo e `links` nomina i flussi tra di essi, `{ source, target, value }` with the indices of two rows in the plot's `data`. Li dispone come fa d3-sankey, nelle dimensioni del plot: i nodi in colonne (`nodeAlign`), ciascuno alto quanto il massimo che entra o esce da esso, i nodi di una colonna distanziati di `nodePadding`, rilassati verso i loro flussi in `iterations` passate; e un nastro per ogni link dal bordo destro della sua sorgente al bordo sinistro della sua destinazione, largo a ciascuna estremità quanto la sua quota del lato di quel nodo, così entrambi i lati di ogni nodo sono coperti anche dove i flussi in entrata e in uscita differiscono. Ogni colonna è centrata nel plot, e una serie di colonne uguali a nodo singolo è sfalsata leggermente in modo che i nastri tra di esse si curvino. `valueScale="sqrt"` dimensiona in base alla radice quadrata dei valori, così un flusso dominante non schiaccia quelli piccoli.

Ogni nodo e ogni nastro è un canvas a sé, le parti `node` e `link`, quindi ciascuno si dipinge con le proprie classi: `nodeClass` sono le stesse classi su ogni nodo oppure una funzione della riga del nodo, e `linkClass` le stesse su ogni nastro oppure una funzione del link. La parte `linkBackground` mostra uno sfondo all'interno di ogni nastro, un box dalla sua sorgente alla sua destinazione: una funzione del link dà a ogni nastro un gradiente dal colore della sua sorgente a quello della sua destinazione. I nastri vengono disegnati sotto i nodi, ed entrambi si disegnano a partire dal bordo iniziale con l'apparizione del plot.

Sopra un sankey, il plot riporta il nodo sotto il puntatore (`onHoverChange`, la riga del nodo; nessuno sopra un nastro), il suo tooltip segue il puntatore, e i link non collegati a quel nodo sfumano di `hoverDim`, sull'animator della piattaforma con `motion` del plot. I tasti scorrono i nodi nell'ordine delle righe, con il tooltip accanto al centro di ciascun nodo. `nodeLabel` nomina ogni nodo e `valueLabel` ne fornisce il valore, con il valore sopra il nome quando entrambi sono impostati: a sinistra di un nodo nella prima colonna, a destra di uno nell'ultima, centrato sopra uno nel mezzo, come li colloca il grafico di `gpui-component`; un'etichetta accanto a un nodo resta tra il bordo superiore e quello inferiore del plot, e una oltre il bordo del plot si colloca nello spazio che l'app lascia attorno ad esso (il suo margin). Il padding della parte `nodeLabel` è la distanza dal suo nodo e le sue classi ne definiscono il testo (`max-w-20 truncate` tronca un nome lungo); le etichette sfumano in ingresso con l'apparizione. Quando l'app cambia i flussi, ogni nodo e ogni nastro si sposta dal vecchio posto al nuovo con `motion.update` del plot, con la sua etichetta al seguito: un nodo nuovo per i flussi cresce dal suo centro, un link nuovo dalla sua larghezza minima, e quelli che scompaiono se ne vanno subito; un cambiamento mentre si muovono prosegue da dove sono disegnati. I link si distinguono per sorgente e destinazione, quindi riordinare `links` non sposta nulla.

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

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | obbligatorio | I flussi: dalla riga `source` alla riga `target` (i loro indici in `data` del plot), con `value` la sua dimensione. Un valore che non è un numero o è inferiore a zero non trasporta nulla e non disegna alcun nastro. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | La larghezza di ogni nodo, in punti. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | Lo spazio tra i nodi di una colonna, in punti; minore in una colonna troppo affollata per rispettarlo. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | In quale colonna va ciascun nodo, come in d3-sankey: la sua profondità dalla prima colonna (`"left"`), il più a destra possibile compatibilmente con i suoi flussi (`"right"`), la sua profondità con un nodo che si limita ad avviare flussi posto accanto alle sue destinazioni (`"center"`), oppure la sua profondità con i nodi che terminano i flussi nell'ultima colonna (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | Quante passate rilassano i nodi verso i loro flussi. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | Altezze e larghezze in proporzione ai valori, o alle loro radici quadrate. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | Il minimo spessore con cui si disegna un nastro, in punti, così un flusso piccolo resta visibile. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | Il raggio degli angoli di ogni nodo, in punti. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | nessuno | Le classi di ogni nodo (`fill-*`, `stroke-*`): le stesse su ogni nodo, oppure una funzione della riga del nodo e del suo indice, chiamata una volta per riga quando cambiano le righe o la funzione. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile di ogni nodo, sopra le sue classi. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | nessuno | Le classi di ogni nastro: le stesse su ogni nastro, oppure una funzione del link e del suo indice in `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile di ogni nastro, sopra le sue classi. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | nessuno | Le classi dello sfondo di ogni nastro (`bg-*`, un gradiente: `bg-linear-to-r from-… to-…`), mostrato all'interno del nastro su un box dalla sua sorgente alla sua destinazione, sotto il suo `fill`. Con uno sfondo, il `fill` di un nastro è `none` dove non è impostato nulla. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile dello sfondo di ogni nastro, sopra le sue classi. |
| `hoverDim` | `.hover_dim(..)` | `number` (da 0 a 1) | `0` | Quanto sfumano i link non collegati al nodo sotto il puntatore, come quota della loro opacità, con la molla `pointer` del plot e con la dissolvenza dell'hover. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | nessuno | Il nome accanto a ogni nodo: un campo, oppure una funzione della riga del nodo e del suo indice. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | nessuno | Il valore accanto a ogni nodo, sopra il suo nome: una funzione della sua riga e del massimo che entra o esce da esso (nei valori dei link, qualunque sia `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | nessuno | Le classi di ogni etichetta, la parte `nodeLabel`: il suo padding è la distanza dal suo nodo, gli stili del testo valgono per entrambe le righe. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | nessuno | Lo stile di ogni etichetta, sopra le sue classi. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | nessuno | Le classi della riga del valore, la parte `valueLabel`, sopra quelle dell'etichetta. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | nessuno | Lo stile della riga del valore, sopra le sue classi. |

Un nodo e un nastro si riempiono con `fill` (`currentColor` dove non è impostato nulla) e tracciano il contorno con `stroke` (nessuno dove non è impostato nulla), con i propri valori sopra quelli del sankey e del plot, secondo l'ereditarietà CSS. Un nodo senza flussi che lo attraversano è alto un punto. Il layout viene eseguito di nuovo solo quando cambiano i link, le opzioni o la dimensione del plot, mai per il puntatore o per l'apparizione; il cambio di dimensione del plot non sposta nulla. I link che formano un ciclo, o che nominano una riga che il plot non ha, non disegnano nulla e registrano un avviso nel log. I suoi valori non partecipano alle scale del plot.
## Treemap

Un `Treemap` disegna le righe del plot come una gerarchia di rettangoli annidati: ogni riga è un nodo, il suo `id` e il `parent` che nomina formano l'albero (`stratify` di d3), l'area di ogni foglia è proporzionale al suo `value`, e ogni gruppo è il riquadro di ciò che contiene, con un valore pari alla somma di quelli delle sue foglie (qualunque cosa contenga la sua riga). Una riga senza `parent`, o il cui genitore non nomina alcuna riga, è un nodo di primo livello; senza `id` l'id di una riga è il suo indice, quindi `parent` può nominare una riga anche tramite il suo indice. Un albero nella forma annidata che gpt-vis scrive (`{ name, value, children }`) richiede poche righe di codice dell'app per ricavarne le righe; non c'è limite ai livelli.

Le tessere sono squarified, come le crea `treemapSquarify` di d3: i nodi di ogni livello in ordine di valore, dal più grande in alto a sinistra (`sort="value"`), vicino al rapporto d'aspetto `ratio` (la sezione aurea); `sort="data"` mantiene l'ordine delle righe, così i nodi conservano la loro posizione al variare dei valori. `paddingInner` è lo spazio tra fratelli, assente lungo i bordi esterni del loro genitore; `paddingOuter` è lo spazio all'interno di un gruppo attorno ai suoi figli; `paddingTop` è una fascia in cima a ogni gruppo, dove è scritto il suo `groupLabel`. Ognuno accetta un numero per tutti i livelli o uno per livello dal primo in giù (`[3, 1]`: 3 tra i nodi di primo livello, 1 sotto di essi). La fascia di un livello si applica a tutti i fratelli di un genitore o a nessuno, e viene omessa dove uno è troppo piccolo per contenerla, così i gruppi di un livello si leggono allo stesso modo.

Una foglia il cui valore è 0, minore di 0 o non numerico non occupa area: non viene disegnata, non ha etichetta e non viene trovata dal puntatore, e lo stesso vale per un gruppo le cui foglie sono tutte così. Le aree di un treemap sono quote di un intero, quindi l'app mostra ciò che è stato escluso con parole proprie (una nota sotto la mappa). I numeri negativi servono per i colori: la variazione giornaliera di una market map.

Il colore di un nodo è quello della sua riga tra i `colorScale` del plot: `colorValue` è un numero lungo una rampa (`sequential`, `diverging`: perdite rosse, guadagni verdi, valori piatti neutri, sull'intervallo dei valori senza `domain`), `color` una categoria (`ordinal`: `"parent"` colora allo stesso modo le foglie di un gruppo). Le foglie sono la parte `leaf` (`leafClass`, `leafStyle`) e i gruppi la parte `group` (`groupClass`, `groupStyle`), disegnati solo con una classe o uno stile: un rettangolo sotto i suoi figli, visibile negli spazi, nel padding e nella fascia. Ogni parte è uguale su ogni nodo oppure è una funzione della riga del nodo. `cornerRadii` arrotonda ogni rettangolo.

`label` scrive il nome di ogni foglia e `valueLabel` il suo valore sotto di esso, come funzione della riga e del suo valore (quello di un gruppo è la somma delle sue foglie): in alto a sinistra (`labelPlacement="start"`) o al centro (`"center"`). La parte `label` è un riquadro grande quanto la sua foglia: il suo padding è lo spazio dai bordi della foglia e il suo testo dà lo stile alle righe. Il nome viene troncato con un'ellissi dove la foglia è più stretta e mostrato solo dove entra; il valore è mostrato per intero o per niente. Un'etichetta la cui foglia ha un colore scuro ha l'attributo `data-dark`, così `data-dark:text-white` la mantiene leggibile su un rosso intenso.

Sopra un treemap, il plot riporta il nodo sotto il puntatore (`onHoverChange`, la riga del nodo): una foglia, oppure un gruppo nella sua fascia o nel suo padding; attraverso uno spazio tra fratelli, uno di essi, così l'hover non sfarfalla. Gli altri sfumano fino a `inactiveOpacity` (una foglia mantiene i suoi gruppi, un gruppo ciò che sta sotto di esso), e la parte `hover`, una view grande quanto il nodo, ne traccia il contorno. I tasti freccia passano alla foglia accanto sullo schermo, Home e End alla prima e all'ultima. Con l'appear del plot i nodi di primo livello crescono dal loro centro, uno dopo l'altro con `stagger`; quando le righe cambiano, ogni nodo si sposta nel suo nuovo riquadro e colore con `motion.update`, riconosciuto dal suo `id`: un nodo nuovo tra le righe cresce dal suo centro e uno scomparso si riduce verso il proprio. Le scale x e y del plot non vengono usate.

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | l'indice della riga | L'id del nodo di ogni riga: ciò che `parent` nomina, e con cui un nodo è riconosciuto quando le righe cambiano. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | nessuno: ogni riga è un nodo di primo livello | L'id del genitore di ogni riga; vuoto, o l'id di nessuna riga, per un nodo di primo livello. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | obbligatorio | La dimensione di ogni foglia; quella di un gruppo è la somma di quelle dei suoi figli. Una foglia pari a 0, minore di 0 o non numerica non occupa area. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | I fratelli dal più grande in alto a sinistra, oppure nell'ordine delle righe. |
| `ratio` | `.ratio(..)` | `number` | la sezione aurea | Il rapporto d'aspetto a cui si avvicinano le tessere, almeno 1. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | Lo spazio tra fratelli, in punti, per livello dal primo in giù (l'ultimo vale per quelli sotto). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | Lo spazio all'interno di ogni gruppo attorno ai suoi figli, per livello. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | La fascia in cima a ogni gruppo, per il suo `groupLabel`, per livello; su tutti i fratelli di un genitore o su nessuno. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | squadrato | Il raggio di ogni angolo dei suoi rettangoli. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | nessuna | La categoria di ogni nodo, a cui un `ordinal` `colorScale` assegna un colore. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | nessuno | Il numero di ogni nodo, che un `sequential` o `diverging` `colorScale` trasforma nel suo colore. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | nessuna | Le classi di ogni foglia (`fill-*`, `stroke-*`), uguali su ogni foglia o come funzione della sua riga. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile di ogni foglia, sopra le sue classi. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | nessuna | Le classi di ogni gruppo, un rettangolo sotto i suoi figli; i gruppi sono disegnati solo con una classe o uno stile. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile di ogni gruppo, sopra le sue classi. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (da 0 a 1) | nessuna | L'opacità dei nodi lontani da quello in hover, e delle loro etichette, con la dissolvenza dell'hover. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | nessuno | Il nome in ogni foglia, su una riga, troncato con un'ellissi. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | nessuno | Il valore in ogni foglia, sotto il suo nome, mostrato solo dove entra per intero. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | Le etichette in alto a sinistra delle loro foglie, oppure al centro. |
| `labelClass` | `.label_class(..)` | `string` | nessuna | Le classi dell'etichetta di ogni foglia, un riquadro grande quanto la foglia: il suo padding e gli stili del testo; `data-dark:` sulle foglie scure. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | nessuno | Lo stile dell'etichetta di ogni foglia, sopra le sue classi. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | nessuna | Le classi della riga del valore, sopra quelle dell'etichetta. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | nessuno | Lo stile della riga del valore, sopra le sue classi. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | nessuno | Il nome di ogni gruppo, nella sua fascia, troncato con un'ellissi. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | nessuna | Le classi dell'etichetta di ogni gruppo, un riquadro grande quanto la fascia. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | nessuno | Lo stile dell'etichetta di ogni gruppo, sopra le sue classi. |
| `stagger` | `.stagger(..)` | `number` (da 0 a 0.95) | `0` | Come appaiono uno dopo l'altro i nodi di primo livello: la quota dell'appear su cui iniziano. |
| `hoverClass` | `.hover_class(..)` | `string` | nessuna | Le classi della parte `hover`, una view grande quanto il nodo in hover sopra di esso (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile della parte hover, sopra le sue classi. |

Un rettangolo si riempie con `fill` (il colore di `colorScale`, altrimenti `currentColor`, dove non ne è impostato nessuno) e ne traccia il contorno con `stroke` (nessuno dove non è impostato), il proprio sopra quello del treemap e del plot, come li eredita CSS. Il layout viene rieseguito solo quando cambiano le righe, le opzioni o la dimensione del plot, mai per il puntatore o l'appear; il cambio di dimensione del plot non sposta nulla. Un `id` ripetuto, un `parent` che non nomina alcuna riga e una riga che è antenata di se stessa registrano un avviso una sola volta: la prima riga mantiene l'id, l'orfano è un nodo di primo livello, il ciclo non viene disegnato.

## PlotAxis

Un `PlotAxis` etichetta un bordo del plot con i tick della scala che quel bordo porta: i bordi inferiore e superiore quelli della scala x, quelli sinistro e destro quelli della scala y, come `axisBottom`, `axisTop`, `axisLeft` e `axisRight` di d3. I suoi tick provengono dalla scala: valori tondi su una scala `linear` (1, 2 o 5 volte una potenza di dieci, dentro il dominio), righe su una scala `point` o `band`. Le sue etichette sono testi che il layout del plot posiziona, quindi l'app dice cosa leggono e che aspetto hanno, e il layout li mette a posto: ogni etichetta è centrata sul suo tick lungo il bordo. Lungo i bordi inferiore e superiore, la prima e l'ultima si spostano verso l'interno quanto basta per restare entro le estremità del plot; accanto ai bordi sinistro e destro, ogni etichetta resta sul suo tick, così si legge come quella della sua linea della griglia, e dove un'etichetta vicina a un'estremità supererebbe il bordo superiore o inferiore del plot, le scale y lineari del plot iniziano a quella distanza da esso (metà dell'altezza dell'etichetta per un tick all'estremità), così ogni etichetta resta dentro il plot, sulla sua linea della griglia.

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | Il bordo lungo cui corre: i bordi inferiore e superiore portano i tick della scala x, quelli sinistro e destro quelli della scala y. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | La scala y che un asse sinistro o destro etichetta: il `yScale` del plot oppure il secondo, `y2Scale` ([Dual axes](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | Dove si trovano le sue etichette: oltre il bordo, nello spazio che l'app lascia attorno al plot, dove restano distanti dai mark; oppure sopra il plot lungo il bordo, così il plot mantiene la sua dimensione intera (accanto a un bordo sinistro o destro, ogni etichetta si trova sul lato superiore della sua linea della griglia). |
| `ticks` | `.ticks(..)` | `number` | `10` su una scala `linear` (ogni passo delle scale allineate), ogni riga sulle altre | Circa quanti tick prende: su una scala `linear`, valori tondi dentro il dominio, circa questo numero; su una scala `point` o `band`, questo numero di righe distribuite uniformemente dalla prima all'ultima. |
| `tickValues` | `.tick_values(..)` | `number[]` | nessuno | I valori dei suoi tick, al posto di `ticks`: valori della scala, indici di riga su una scala `point` o `band` (`[0, 3, 6]` etichetta una riga ogni tre). I valori dentro il dominio ottengono ciascuno un tick. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | la categoria di una band su una scala band di categorie, altrimenti il valore, con i decimali che il passo tra i tick richiede, con le migliaia raggruppate | Il testo di ogni tick: la funzione dell'app del suo valore (l'indice di una riga su una scala `point` o `band`) e del suo indice tra i tick dell'asse. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | nessuno | La parte `label`: un testo per tick, con font, colore e padding dell'app; il suo padding verso il plot è la sua distanza dal bordo (`pt-2` sotto un asse inferiore). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La parte `tick`: una view per tick sul bordo, centrata sul suo tick e che si estende verso le etichette (`h-1 w-px bg-border` sotto un asse inferiore); mostrata una volta che ha uno stile. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La parte `line`: una view lungo l'intero bordo, dal lato delle etichette (`h-px bg-border` sotto un asse inferiore); mostrata una volta che ha uno stile. |

All'esterno, le etichette stanno nel margine del plot, come gli assi di d3 stanno nei margini di un grafico: il plot mantiene la dimensione che l'app gli dà, e l'app gli dà un margine sul lato dell'asse profondo quanto le etichette (`mb-6` per etichette `pt-2 text-xs` sotto di esso), oppure il padding del suo genitore in quel punto. Due assi sullo stesso bordo etichettano ciascuno i propri valori, nel proprio stile: gli estremi di un intervallo tenui e il suo centro più deciso.

`format` viene chiamato una volta per tick quando i tick o la funzione cambiano, nel turno successivo, mai mentre il plot disegna o segue il puntatore: mantienilo puro (stesso valore, stesso testo). Senza di esso, un tick si legge come lo scrive d3: `1,500`, `0.25`, `−2`. In Rust, `plot_axis()` crea un asse, il suo `format` un `TickFormat::from_fn(|value, index| ..)`.
Un asse non accetta il puntatore, e gli screen reader leggono il plot anziché le sue etichette.
## PlotLabel

Un `PlotLabel` scrive testi in punti del plot: una didascalia sopra un picco, un'etichetta sull'ultimo punto di una linea, una nota all'estremità di una linea della griglia. Ciascuno dei suoi `texts` indica il proprio punto con valori delle scale del plot, come fanno i mark: l'indice di una riga su una scala `point` o `band` (il centro della banda della riga), un valore su una scala `linear`. Il bordo superiore del testo poggia sul punto, e il suo `align` lo fa iniziare lì, lo centra su di esso o lo fa terminare lì. Il layout del plot posiziona i testi, quindi seguono le dimensioni del plot; scorrono insieme ai domini delle scale (`motion.update`) e compaiono in dissolvenza con l'appear.

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | I testi che scrive, ciascuno nel proprio punto. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | La scala y di cui i `y` dei suoi testi sono valori ([Assi doppi](#dual-axes)). |

Ogni testo è un `PlotText`:

| Campo | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `text` | `string` | | Ciò che legge. |
| `x` | `number` | | Dove va lungo l'asse x: un valore della scala x, l'indice di una riga su una scala `point` o `band` (`0.5` è a metà tra le prime due righe). |
| `y` | `number` | | Dove va il suo bordo superiore lungo l'asse y: un valore della scala y. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Come si dispone lungo x rispetto al suo punto: iniziando da esso, centrato su di esso o terminando in esso. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | nessuno | Le classi e lo stile propri del testo, sopra ciò che eredita dall'etichetta: il suo box (lo sfondo e il padding di un tag) e la sua distanza dal punto. |

L'aspetto è quello dell'app: il `class` dell'etichetta dà a ogni testo gli stili di testo che ereditano (font, dimensione, colore), mentre `class` e lo stile `style` propri di un testo lo stilizzano da solo. Un testo va sopra il suo punto con `-translate-y-full`, e il suo padding è la distanza dal punto (`pb-1`); un tag accanto all'ultimo punto di una linea si trova nel margine che l'app lascia su quel lato (`mr-12`), come fanno le etichette di un asse. In Rust, `plot_label()` crea un'etichetta, ogni testo è un `PlotText::new(text, x, y)` con `.align(PlotTextAlign::Center)`, `.class(..)` e `.style(..)`. Il puntatore attraversa i testi fino al plot, e gli screen reader leggono il plot, la cui `accessibilityLabel` dice che cosa indicano i testi.

<a id="motion"></a>

## Animazione

L'animazione è quella dell'app, e per impostazione predefinita non c'è: tutto appare subito. `motion` accetta i timing di [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` e `{ stiffness, damping, mass }`):

| Chiave | Tipo | Cosa si muove |
|---|---|---|
| `appear` | timing | I mark si disegnano progressivamente, con un `appearGeneration`: linee e aree dal bordo d'ingresso, barre che crescono dalla loro base (una dopo l'altra con il `stagger` di una barra); punti che crescono dal nulla (uno dopo l'altro con il `stagger` di un punto); celle che crescono dal loro centro (una dopo l'altra con il `stagger` di una cella); l'anello di un pie e di un arc si apre in senso orario dal suo inizio; una linea radiale cresce dal suo raggio interno, con i suoi punti; i nodi e i nastri di un sankey dal bordo d'ingresso, con le sue etichette in dissolvenza. |
| `update` | timing | I mark si spostano verso la nuova forma quando l'app la cambia: i punti verso i nuovi valori e le nuove dimensioni, il punto di una nuova riga che cresce e quello di una riga eliminata che si riduce fino a sparire; le celle verso i nuovi colori (mescolati in OKLab) e le nuove bande, la cella di una nuova riga che cresce e quella di una riga eliminata che si riduce fino a sparire; i raggi di un pie e di un arc, così il foro di un donut si apre e si chiude, e i loro angoli, così un gauge o una fetta scorre fino al nuovo valore (`arcTween` di d3: si muovono gli angoli, non il contorno; una nuova fetta si apre da dove finisce quella precedente; una modifica durante un movimento prosegue da dove è disegnato); i punti di una linea radiale verso i nuovi valori, angoli e raggi (una nuova riga che cresce dal raggio interno), insieme agli anelli di una griglia radiale; il dominio di una scala lineare, ossia il `domain` dell'app o l'estensione dei valori dei mark man mano che arrivano le righe, che scorre dal vecchio al nuovo, con i mark, le linee della griglia, i `PlotAxis` e i `PlotLabel` al seguito; e i nodi, i nastri e le etichette di un sankey, dal layout dei vecchi flussi a quello nuovo, con una modifica durante il movimento che prosegue da dove sono disegnati. |
| `enter` | timing | Le parti dell'hover compaiono in dissolvenza quando il puntatore arriva sul plot. |
| `exit` | timing | Scompaiono in dissolvenza dopo che il puntatore se ne va. |
| `pointer` | spring | Scorrono da una riga alla successiva quando i tasti o uno screen reader spostano l'hover; la fetta di un pie si solleva. |

Le parti dell'hover seguono il puntatore nello stesso frame: mentre si muove, la linea di intersezione, i punti e il tooltip si trovano subito sulla riga sotto di esso, quindi seguono la mano, mentre la loro dissolvenza in entrata e in uscita (`enter`, `exit`) resta animata.

L'animazione viene eseguita dall'animator della piattaforma, senza JS per frame, e si completa subito per chi richiede movimento ridotto. Un plot che una lista ricrea per una riga che ritorna si disegna di nuovo, a meno che un [`PlotAppearScope`](#plotappearscope) attorno alla lista non abbia visto terminare il suo appear.

Un dominio si muove come d3 fa transitare il dominio di una scala: la scala intermedia posiziona ogni valore, quindi i mark mantengono la loro forma, le linee della griglia e le parti dell'hover si muovono con essi, le barre mantengono i loro angoli, e una riga che entra con il nuovo dominio si muove insieme alle altre. Un grafico live che adatta la sua scala y alle righe di tanto in tanto (con un po' di margine, così la griglia resta ferma tra un adattamento e l'altro) scorre verso ogni nuovo adattamento con un timing `update`. Quando le dimensioni del plot cambiano, i mark assumono subito le nuove dimensioni.

È l'animazione propria del plot, i timing di ciò che un grafico muove: il clip dei suoi mark e le parti del suo hover. Le entrate, le uscite e gli attira-attenzione di una vista sono i preset e i keyframe di [`createMotion`](../modules/nsh.md#createmotion), che un'app può comunque riprodurre sulla vista del plot o sugli elementi che lo circondano.

## PlotAppearScope

Una lista ricrea il plot di una riga ogni volta che la riga torna in vista, quindi una sparkline con un appear si disegna di nuovo ogni volta che la lista torna a scorrere fino a essa. Un `PlotAppearScope` attorno alla lista ricorda gli appear che sono terminati al suo interno: un plot ricreato lì il cui `appearGeneration` è terminato mostra subito i suoi mark per intero. Un plot è ricordato tramite la sua generazione, quindi il plot di ogni riga ha la propria, composta dalla chiave della riga con ciò che dovrebbe farlo ripetere (`` `${symbol} ${period}` ``).

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | nessuno | Per che cosa lo scope ricorda: quando cambia, lo scope dimentica e i suoi plot si disegnano di nuovo, dove si trovano. Va chiamato in base al contenuto, come una watchlist o una conversazione; senza di esso, lo scope ricorda finché è mostrato. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che contiene: la lista, o qualunque cosa ricrei i suoi plot man mano che vanno e vengono. |

Una nuova generazione disegna comunque il plot da capo, così come un plot rimosso prima che il suo appear terminasse. Quando un plot ha terminato una nuova generazione, il suo scope dimentica quella precedente, quindi tornare a un periodo precedente disegna di nuovo il plot. La memoria va con lo scope: uno scope che non è più mostrato, o uno con un nuovo `id`, disegna i suoi plot da capo, e un plot ricorda nello scope più interno che lo circonda. Il suo aspetto è quello dell'app: `class` e `style` lo dispongono come qualsiasi vista (`flex-1` attorno a una lista che riempie lo schermo). In Rust, `plot_appear_scope()` ne crea uno.

<a id="keyboard"></a>

## Tastiera

Un plot interattivo è una tappa del Tab (macOS, web), e finché ha il focus della tastiera i suoi tasti muovono lo stesso hover del puntatore: la linea di intersezione, i punti e il tooltip scorrono con la spring `pointer`, la fetta di un pie si solleva, `onHoverChange` segnala la riga, e gli screen reader leggono il `accessibilityValue` che l'app fornisce per essa. Il suo anello di focus è quello dell'app: una classe `focus-visible:` o un `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| Tasti | Cosa fanno |
|---|---|
| Destra, Sinistra | Si spostano sulla riga da quel lato: la riga successiva o quella precedente, al contrario su una scala x invertita, la cui prima riga è a destra (su un pie, le sue fette nell'ordine delle righe; su un sankey, i suoi nodi; su un treemap, la foglia accanto sullo schermo, come fanno Su e Giù); senza alcuna riga in hover, Destra parte dalla riga all'estremità sinistra e Sinistra da quella all'estremità destra (su un pie, la prima e l'ultima fetta). |
| Home, End | Si spostano sulla prima o sull'ultima riga. |
| Su, Giù | Sulle celle: si spostano sulla cella sopra o sotto nella stessa colonna. Sulle celle i tasti seguono la griglia sullo schermo (la data grid di WAI-ARIA): Destra e Sinistra si spostano sulla cella successiva lungo la linea, Home e End sulla prima e sull'ultima cella della linea; senza alcuna cella in hover, il primo tasto parte dalla cella in alto a sinistra (Sinistra, Su e End da quella in basso a destra). Su un bordo l'hover resta dov'è. |
| Escape | Cancella l'hover. |

Il plot risponde ai suoi tasti finché ha il focus, e a Escape mentre una riga è in hover; il resto del tempo vanno all'app e alle viste che lo circondano. Spostare il focus altrove cancella un hover creato dai tasti. Il plot non accetta pressioni, quindi un plot dentro una card premibile lascia alla card le sue pressioni. Anche gli screen reader scorrono le righe: lo swipe su e giù di VoiceOver, lo scorrimento avanti e indietro di TalkBack, e ogni screen reader che offre le azioni `increment` e `decrement` di un elemento si spostano sulla riga successiva e su quella precedente, nell'ordine delle righe anche su una scala invertita.

<a id="building-charts"></a>

## Costruire grafici

Un grafico è un plot, i suoi mark, i suoi assi e gli elementi propri dell'app attorno a essi. Dai alla scala y un `domain` e al suo asse i valori della griglia (`tickValues`): ogni etichetta si troverà così sulla sua linea della griglia. La linea di intersezione, i punti e il tooltip dell'hover sono parti del plot, stilizzate e riempite dall'app; i valori della riga vanno dove l'app li mostra.

Le griglie si leggono meglio come linee sottili continue con una linea di base più marcata, il che lascia libera una linea tratteggiata per indicare un valore di riferimento (il prezzo di apertura qui sotto). Un'area si legge meglio come una velatura che sfuma verso la sua linea di base che come un riempimento uniforme. Il punto di hover di ogni serie prende il colore della sua serie, e il colore della superficie su cui poggia il grafico come suo anello, così si stacca dalla sua linea, e il tooltip sta in cima al plot, all'interno dei suoi bordi sulla prima e sull'ultima riga: un `domain` con spazio sopra il valore più alto lo tiene lontano dalla linea.

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

Un grafico a barre si legge meglio con le punte delle barre arrotondate e le basi squadrate (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), le barre delle altre righe attenuate mentre una è in hover (`inactiveOpacity`) e la sua banda colorata (`crossLineClass`), e i valori in piccole cifre tabulari sopra le barre, con il totale sopra una pila. Con `paddingOuter` pari alla metà di `paddingInner`, i centri delle bande cadono a intervalli uguali, e un `PlotAxis` centra ogni mese sotto la sua banda; un `maxBandWidth` mantiene strette alcune barre in una card larga.

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

Una sparkline in una riga di lista è un plot con `interactive={false}`: disegna i suoi mark e non segue alcun puntatore.

<a id="accessibility"></a>

## Accessibilità

- Un plot è un unico elemento per gli screen reader, con il ruolo image e il `accessibilityLabel` dell'app; i suoi mark, le etichette dei suoi assi, i suoi `PlotLabel` e le parti dell'hover ne fanno parte e non dicono nulla da soli. Indica nell'etichetta che cosa mostra il grafico e che cosa spicca (l'intervallo, il valore più alto), e dai a `accessibilityValue` le parole per la riga sotto il puntatore, così uno screen reader dice il valore mentre cambia.
- La riga sotto il puntatore viene segnalata con `onHoverChange` sulle piattaforme con un puntatore (desktop, web, un iPad con trackpad). Gli schermi touch non segnalano l'hover: mostra i valori di cui un utente touch ha bisogno negli elementi propri dell'app, oppure offri le righe come testo o come lista dove i numeri contano.
- Su un pie la riga segnalata è quella della fetta sotto il puntatore: dai a `accessibilityValue` il suo nome, valore e quota (`"Team, 340 seats, 34.0%"`), e indica nell'etichetta il totale e la quota maggiore. Su un radar è l'asse più vicino al puntatore: dagli il nome dell'asse e il valore di ciascuna serie in quel punto.
- Un plot interattivo è una tappa del focus della tastiera i cui tasti freccia muovono l'hover ([Tastiera](#keyboard)), e offre agli screen reader `increment` e `decrement` per scorrere le righe (VoiceOver lo legge come regolabile); un plot con `interactive={false}` non è nessuna delle due cose, e in entrambi i casi non accetta pressioni.

Vedi [Accessibilità](../docs/accessibility.md) per etichette e ruoli in generale.
<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma disegna i mark allo stesso modo, a partire da un disegno per mark registrato in Rust; una modifica delle righe ridisegna in un unico batch i mark che le leggono, mentre una modifica di una classe di vernice (l'aspetto, `dark:`) invia di nuovo il disegno senza registrarlo.
- L'apparizione ritaglia linee e aree e fa crescere le barre, con valori che l'animator della piattaforma muove; la dissolvenza di una barra rispetto alla riga in hover è un'opacità che l'animator calcola a partire dalla posizione dell'hover; le parti dell'hover sono view che l'animator muove e dissolve, e mantiene il tooltip all'interno del plot a partire dalle dimensioni del plot e da quelle del tooltip.
- Lo sfondo di un'area viene disegnato nel proprio canvas, ritagliato secondo la forma dell'area, con lo stesso gradiente che la piattaforma disegna per il `bg-linear-*` di una view; una modifica delle sue classi (l'aspetto, `dark:`) invia di nuovo il disegno senza registrarlo.
- Un grafico a torta disegna ogni fetta nel proprio canvas; la fetta sotto il puntatore viene individuata in Rust a partire dagli angoli e dai raggi delle fette, il suo sollevamento è un raggio e la dissolvenza delle altre è un'opacità che l'animator muove, e lo sweep dell'apparizione muove allo stesso modo gli angoli delle fette, quindi nessuno dei due registra di nuovo un disegno.
- La riga di un grafico a linee radiale sotto il puntatore viene individuata in Rust a partire dagli angoli dei suoi punti; il suo punto di hover è una view che l'animator posiziona sulla riga sotto il puntatore (scivolando sulla spring `pointer` mentre le chiavi avanzano), e mentre appare o si sposta verso nuovi valori i suoi punti sono numeri che l'animator muove a partire da dove si trovavano, quindi la linea viene registrata una sola volta per modifica.
- Un dot mark viene disegnato in un unico canvas; il punto sotto il puntatore viene individuato in Rust a partire dai centri e dai raggi dei punti, e il suo punto di hover è una view che l'animator posiziona su di esso, grande quanto lui; la crescita dell'apparizione, gli spostamenti di una modifica e la dissolvenza dell'hover sono valori che l'animator muove, quindi i punti vengono registrati una sola volta per modifica.
- Un cell mark viene disegnato in un unico canvas; la cella sotto il puntatore viene individuata in Rust a partire dai riquadri delle celle, e la sua cella di hover è una view che l'animator posiziona su di essa; la crescita, i colori e gli spostamenti di una modifica e la dissolvenza dell'hover sono valori che l'animator muove, quindi le celle vengono registrate una sola volta per modifica. Ogni etichetta è un testo della piattaforma, mostrato dove la sua dimensione calcolata dal layout rientra nella cella.
- Le etichette, i segni di graduazione e la linea di un asse sono testi e view propri della piattaforma, posizionati dal layout in Rust a partire dalle dimensioni e dalle scale del plot: si spostano insieme ai mark quando cambiano le dimensioni del plot, e un nuovo dominio scrive di nuovo le etichette.
