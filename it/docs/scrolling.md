---
title: "Scorrimento"
description: "Scroll view in Rust e TSX - paginazione e snapping, zoom, pull to refresh, eventi di scorrimento, effetti collegati allo scorrimento con scrollValue, la tastiera nelle scroll view e scorrimento da codice."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# Scorrimento

La scroll view (`scroll()` in Rust, `<Scroll>` in TSX) è la scroll view nativa della piattaforma (UIScrollView su iOS, una ScrollView su Android): fling, rimbalzi, indicatore di scorrimento e pull to refresh sono nativi, così come lo snapping. Il tuo codice viene a sapere dello scorrimento tramite eventi e può associare l'offset a un [valore animato](./animation.md#animated-values) per effetti che seguono il dito fotogramma per fotogramma.

Usa una scroll view per contenuti di dimensioni note e moderate: una pagina di impostazioni, un modulo, un articolo, una riga di chip. Per dati lunghi o illimitati usa una [lista](./lists.md), che ricicla le righe e accetta le stesse prop di scorrimento.

<a id="a-scroll-view"></a>

## Una scroll view

Una scroll view è il viewport; i suoi figli sono il contenuto. Il viewport riceve una dimensione dal genitore (di solito `flex: 1`, `.flex_1()`), e il contenuto viene disposto alla larghezza del viewport (verticale) o alla sua altezza (orizzontale) e lungo quanto serve.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

La view figlia qui sopra è il contenitore del contenuto della scroll view; in TSX, `contentStyle` (o `contentClass`) ne crea uno al posto tuo, avvolgendo i figli in una view con quello stile, che scorre insieme a loro. `flexGrow: 1` (`.flex_grow(1.0)`) rende il contenuto alto almeno quanto il viewport, così un contenuto breve può essere centrato e uno lungo scorre comunque:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

Una scroll view orizzontale accetta `horizontal` (`.horizontal()`) e una riga come figlio:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

Da destra a sinistra (vedi [Dispositivo e ambiente](./device-and-environment.md#right-to-left)), una scroll view orizzontale parte dalla sua estremità destra e ne mantiene la distanza.

Le dita trascinano le scroll view. Sul desktop (macOS, Windows, Linux) e nel browser, il mouse scorre come nelle app desktop: con la rotella (Shift + rotella scorre in orizzontale), il touchpad, la tastiera e l'indicatore di scorrimento, che compare mentre il mouse si muove sulla view e si trascina come una barra di scorrimento; i trascinamenti del mouse vanno ai pan, ai responder e alla selezione del testo dell'app. Gli schermi touch sui desktop trascinano le scroll view come fanno le dita. Le view orizzontali mantengono lì il loro indicatore anche con `scrollbar={false}`, perché è il modo in cui un mouse senza rotella orizzontale le sposta.

<a id="behavior-props"></a>

### Prop di comportamento

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scorre lateralmente. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utente può farla scorrere. Lo scorrimento da codice continua a funzionare. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll oltre i bordi. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | L'indicatore di scorrimento è visibile. Sul desktop e nei browser desktop una view orizzontale lo mantiene: è la barra di scorrimento del mouse. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Spazio attorno al contenuto, nel quale è possibile scorrere. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Da dove parte. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | quello della piattaforma | Quanto velocemente rallenta un fling: `"normal"`, `"fast"`, oppure la velocità mantenuta per millisecondo (`0.998` è normale, `0.99` veloce; `0` è il valore predefinito della piattaforma). |

<a id="paging-and-snapping"></a>

## Paginazione e snapping

Lo snapping viene deciso nativamente quando il dito si solleva, in base all'offset di rilascio, allo scivolamento previsto e alla velocità; la scroll view scivola poi fino alla ssosta scelta, senza alcun intervento del tuo codice.

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | Si ferma a multipli della dimensione del viewport. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | Si ferma a multipli di questa lunghezza (0: disattivato). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | Si ferma a questi offset. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Con `snapToInterval`: quale punto di un elemento si allinea con il viewport. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Un fling si sposta al massimo di una sosta. |

Un pager: pagine larghe quanto la scroll view e un indicatore aggiornato al termine dello scivolamento.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

Un carosello di card che si agganciano al centro, una card per fling:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

Le liste accettano le stesse prop di snapping, il che le rende la scelta migliore per un carosello lungo.

<a id="scroll-events"></a>

## Eventi di scorrimento

| Prop | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | L'offset è cambiato. Al massimo una volta per frame; `scrollEventThrottle` li distanzia ulteriormente. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Millisecondi minimi tra gli eventi `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | L'utente ha iniziato a trascinare. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | L'utente ha sollevato il dito. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | È iniziato lo scivolamento dopo un fling. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | Lo scivolamento è terminato (anche quando un nuovo trascinamento lo intercetta). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Uno scorrimento dell'utente si è fermato: dopo lo scivolamento, oppure alla fine di un trascinamento senza scivolamento. |

`ScrollEvent` contiene l'offset (`offset`, un `Point`; lo stesso in Rust), la dimensione del contenuto, con zoom (`contentSize`, un `Size`; `content_size`), il viewport (`size`) e `zoomScale` (`zoom_scale`). Gli altri eventi contengono l'offset: `{ offset }` con un `Point` in TSX, un `Point<Points>` in Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` esegue il tuo codice a ogni frame di uno scorrimento (soggetto al throttle). Per qualcosa che deve solo *sembrare* legato allo scorrimento, come un header che sfuma o un'immagine in parallasse, usa invece [`scrollValue`](#scroll-linked-effects-scrollvalue): viene eseguito interamente in modo nativo.

<a id="scroll-linked-effects-scrollvalue"></a>

## Effetti legati allo scorrimento: scrollValue

`scrollValue` (`.scroll_value(&value)`) riceve un [valore animato](./animation.md#animated-values) e vi scrive nativamente l'offset di scorrimento (lungo l'asse principale), nello stesso frame in cui il contenuto si muove. Associa quel valore, o i nodi derivati da esso con `interpolate`, `diffClamp` (`diff_clamp`) o con l'aritmetica, agli stili.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

Un header che scivola via mentre il contenuto scorre verso l'alto e ritorna non appena si scorre verso il basso è `diffClamp` dell'offset:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

Le interpolazioni, per impostazione predefinita, vengono limitate fuori dal loro intervallo di input, quindi tirando oltre il bordo superiore (un offset negativo) l'effetto resta al suo estremo; passa `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` in Rust) per un header elastico che si allarga mentre tiri.

## Pull to refresh

`refreshing` e `onRefresh` (`.refreshing(..)` e `.on_refresh(..)`) aggiungono il controllo pull-to-refresh della piattaforma. Il controllo è visibile finché `refreshing` è true; impostalo in `onRefresh` e azzeralo quando il lavoro è terminato.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

Su iOS il controllo è UIRefreshControl; nell'idioma Mac di Mac Catalyst, NSH mostra un proprio spinner con lo stesso comportamento. Le liste accettano le stesse prop. Sul desktop e nel browser il pull è un gesto del touchscreen (o del trackpad di macOS, che tira oltre il bordo superiore), dato che il mouse scorre senza trascinare; offri lì un altro modo per aggiornare, come un pulsante o una scorciatoia da tastiera.

<a id="an-indicator-of-your-own"></a>

### Un indicatore personalizzato

L'aspetto del pull spetta all'app. `refreshIndicator={{ height }}` indica che l'app disegna un proprio indicatore, alto `height` punti: lo spinner della piattaforma è nascosto, un pull avvia l'aggiornamento una volta raggiunto `height`, e durante l'aggiornamento `height` restano sopra il contenuto per l'indicatore. `pullValue` alimenta un valore animato con quanto il contenuto è tirato oltre il bordo superiore: 0 a riposo, crescente con il pull, e `height` durante l'aggiornamento. Disegna l'indicatore sopra la parte alta della scroll view e interpola i suoi stili a partire dal valore: seguono il dito sul thread UI, senza JS per frame.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

Mantieni `height` entro metà viewport: oltre il bordo superiore il contenuto oppone più resistenza al dito quanto più va lontano, e un'altezza troppo grande non viene mai raggiunta. Su iOS, un indicatore proprio dell'app sostituisce UIRefreshControl con il pull che NSH rileva da sé, come nell'idioma Mac.

<a id="zooming"></a>

## Zoom

Una scroll view (le liste mantengono una scala di 1) fa zoom quando la scala di zoom massima è superiore alla minima: il pinch scala il contenuto e, con lo zoom avanti, scorre in entrambe le direzioni.

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Lo zoom minimo. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Lo zoom massimo; se superiore al minimo, il pinch fa zoom. |
| `zoomScale` | `.zoom(scale)` | `number` | | Fa zoom a questa scala quando la prop cambia; altrimenti lo zoom dell'utente viene mantenuto. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Il pinch può superare i limiti e poi torna indietro con effetto elastico. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | L'utente può fare pinch per zoomare. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Il contenuto più piccolo del viewport (con zoom indietro) viene centrato. |

L'evento di scroll riporta la scala di zoom e la dimensione del contenuto con zoom. Da codice, `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` fa zoom in modo che il punto del contenuto (in punti senza zoom) finisca al centro del viewport; il doppio tap per lo zoom è un gestore di pressione che lo richiama:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

Testo e canvas all'interno di una scroll view con zoom vengono ridisegnati alla nuova risoluzione al termine dello zoom, così restano nitidi su iOS. Su Android, NSH fa zoom con una scroll view propria, che scala attorno al punto focale del pinch, scorre con un numero qualsiasi di dita, fa fling e rimbalza elasticamente ai bordi e ai limiti di zoom. Android avvia un pinch quando le dita sono distanti circa 27 mm, come fa il rilevatore di gesti del sistema.

<a id="scrolling-from-code"></a>

## Scorrere da codice

Assegna alla scroll view un ref (`element_ref()` e `.element_ref(&scroller)` in Rust, un [`ref`](./jsx-and-components.md) in TSX) e chiama i suoi metodi. I comandi vengono eseguiti dopo il resto delle modifiche nello stesso aggiornamento, quindi scorrere verso un contenuto appena aggiunto funziona.

| Rust | TSX | Descrizione |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Scorre a un offset. Animato per impostazione predefinita in TSX. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Scroll view con zoom: fa zoom a `scale` (limitato ai limiti), attorno al punto del contenuto o al centro. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

Le liste aggiungono `scrollToIndex`, `scrollToOffset` e `scrollToEnd`; vedi [Liste](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Scroll view e tastiera

NSH mantiene visibile da sé un input con il focus: quando compare la tastiera, la scroll view attorno all'input riceve un inset inferiore alto quanto la tastiera e fa scorrere l'input in vista. Questo avviene in modo nativo, senza codice nella tua app. Usa `env(keyboard-inset-height)` come padding inferiore ([Contenuto fuori dalle scroll view](./forms-and-keyboard.md#content-outside-scroll-views)) per i contenuti fuori dalle scroll view, come una barra dei messaggi fissata in basso.

Due prop decidono come scorrimento e tap interagiscono con la tastiera:

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Se trascinare il contenuto nasconde la tastiera. `"interactive"` fa sì che la tastiera segua il dito verso il basso su iOS; su Android si comporta come `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | Cosa fa un tap mentre la tastiera è visibile. |

`keyboardShouldPersistTaps`:

- `"never"`: un tap fuori dall'input con il focus nasconde soltanto la tastiera, e i pulsanti ricevono il tap successivo. L'utente tocca una volta per chiudere, un'altra per premere.
- `"handled"`: un tap su qualcosa che lo gestisce (un pulsante) passa attraverso e la tastiera resta; un tap su uno spazio vuoto la nasconde. Di solito è la scelta giusta per i moduli.
- `"always"`: la tastiera resta visibile a ogni tap.

Entrambe vengono decise nativamente nel momento del tap o del trascinamento, senza attendere il tuo codice. Per nascondere la tastiera da codice, chiama `dismiss_keyboard()` in Rust oppure `Keyboard.dismiss()` da [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) in TSX.

<a id="nested-scroll-views"></a>

## Scroll view annidate

Una scroll view orizzontale dentro una verticale funziona come ci si aspetta: ciascuna riceve i trascinamenti lungo il proprio asse. Anche due scroll view sullo stesso asse si possono annidare (quella interna scorre per prima). I responder che hanno bisogno del dito, come un canvas di disegno dentro una scroll view, lo sottraggono alle scroll view che li circondano: `.keep_touches(true)` in Rust, `true` restituito da `onResponderGrant` in TSX; vedi [Tocco e gesti](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## Correlati

- [Scroll](../elements/scroll.md): il riferimento dell'elemento, ogni prop ed evento.
- [Liste](./lists.md): liste virtualizzate con le stesse prop di scorrimento.
- [Animazione](./animation.md): valori animati, `interpolate` e `diffClamp` per gli effetti legati allo scorrimento.
- [Moduli e tastiera](./forms-and-keyboard.md): input, focus e tastiera.
