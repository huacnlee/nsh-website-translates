---
title: "Scrollen"
description: "Scroll-Views in Rust und TSX – Paging und Snapping, Zoomen, Pull-to-Refresh, Scroll-Events, scrollgekoppelte Effekte mit scrollValue, die Tastatur in Scroll-Views und Scrollen per Code."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---


# Scrollen

Die Scroll View (`scroll()` in Rust, `<Scroll>` in TSX) ist die plattformeigene Scroll View (UIScrollView unter iOS, eine ScrollView unter Android): Flings, Bounces, der Scroll-Indikator und Pull-to-Refresh sind nativ, ebenso das Snapping. Dein Code erfährt über Events vom Scrollen und kann den Offset an einen [animierten Wert](./animation.md#animated-values) binden, für Effekte, die dem Finger Frame für Frame folgen.

Verwende eine Scroll View für Inhalte bekannter, mäßiger Größe: eine Einstellungsseite, ein Formular, einen Artikel, eine Reihe von Chips. Für lange oder unbegrenzte Daten nimm eine [Liste](./lists.md), die Zeilen wiederverwendet und dieselben Scrolling-Props akzeptiert.

<a id="a-scroll-view"></a>

## Eine Scroll View

Eine Scroll View ist der Viewport; ihre Kinder sind der Inhalt. Der Viewport braucht eine Größe von seinem Parent (meist `flex: 1`, `.flex_1()`), und der Inhalt wird in der Breite (vertikal) bzw. Höhe (horizontal) des Viewports angeordnet und ist so lang, wie er sein muss.

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

Die obige Child View ist der Content Container der Scroll View; in TSX erzeugt `contentStyle` (oder `contentClass`) einen solchen, indem es die Kinder in eine View mit diesem Style packt, die mit ihnen scrollt. `flexGrow: 1` (`.flex_grow(1.0)`) macht den Inhalt mindestens so hoch wie den Viewport, sodass kurzer Inhalt zentriert werden kann und langer trotzdem scrollt:

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

Eine horizontale Scroll View nimmt `horizontal` (`.horizontal()`) und eine Zeile als Kind:

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

Bei Rechts-nach-links-Layout (siehe [Gerät und Umgebung](./device-and-environment.md#right-to-left)) beginnt eine horizontale Scroll View an ihrem rechten Ende und behält ihren Abstand zu diesem.

Finger ziehen Scroll Views. Auf dem Desktop (macOS, Windows, Linux) und im Browser scrollt die Maus wie in Desktop-Apps: mit dem Mausrad (Shift + Mausrad scrollt horizontal), dem Touchpad, der Tastatur und dem Scroll-Indikator, der erscheint, solange die Maus über der View steht, und sich wie eine Scrollleiste ziehen lässt; Maus-Drags gehen an die Pans, Responder und die Textauswahl der App. Touchscreens an Desktops ziehen Scroll Views wie Finger. Horizontale Views behalten dort ihren Indikator auch mit `scrollbar={false}`, denn damit bewegt man sie mit einer Maus ohne horizontales Rad.

<a id="behavior-props"></a>

### Verhaltens-Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scrollt seitwärts. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Der Nutzer kann scrollen. Scrollen per Code funktioniert weiterhin. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll über die Ränder hinaus. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | Der Scroll-Indikator wird angezeigt. Auf dem Desktop und in Desktop-Browsern behält ihn eine horizontale View: Er ist die Scrollleiste der Maus. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Platz um den Inhalt, in den hineingescrollt werden kann. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Wo sie beginnt. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | der Plattform | Wie schnell ein Fling langsamer wird: `"normal"`, `"fast"` oder die pro Millisekunde beibehaltene Geschwindigkeit (`0.998` ist normal, `0.99` schnell; `0` ist der Standard der Plattform). |

<a id="paging-and-snapping"></a>

## Paging und Snapping

Das Snapping wird nativ beim Loslassen des Fingers entschieden, anhand des Offsets beim Loslassen, des projizierten Gleitwegs und der Geschwindigkeit; die Scroll View gleitet dann zum gewählten Haltepunkt, ganz ohne dein Zutun.

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | Haltepunkte bei Vielfachen der Viewport-Größe. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | Haltepunkte bei Vielfachen dieser Länge (0: aus). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | Haltepunkte bei diesen Offsets. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Mit `snapToInterval`: Welcher Punkt eines Elements am Viewport ausgerichtet wird. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Ein Fling bewegt höchstens um einen Haltepunkt weiter. |

Ein Pager: Seiten so breit wie die Scroll View und ein Indikator, der aktualisiert wird, wenn das Gleiten endet.

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

Ein Karussell aus Karten, die zur Mitte hin einrasten, eine Karte pro Fling:

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

Listen akzeptieren dieselben Snapping-Props, weshalb sie für ein langes Karussell die bessere Wahl sind.

## Scroll-Events

| Prop | Rust | Payload | Wann |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | Der Offset hat sich geändert. Höchstens einmal pro Frame; `scrollEventThrottle` vergrößert den Abstand weiter. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Minimale Millisekunden zwischen `onScroll`-Events. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | Der Nutzer hat begonnen zu ziehen. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | Der Nutzer hat den Finger gehoben. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | Das Gleiten nach einem Fling hat begonnen. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | Das Gleiten ist zu Ende (auch wenn ein neuer Drag es abfängt). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Ein Nutzer-Scroll ist zur Ruhe gekommen: nach dem Gleiten oder am Ende eines Drags ohne Gleiten. |

`ScrollEvent` enthält den Offset (`offset`, ein `Point`; in Rust ebenso), die Größe des Inhalts, gezoomt (`contentSize`, ein `Size`; `content_size`), den Viewport (`size`) und `zoomScale` (`zoom_scale`). Die übrigen Events enthalten den Offset: `{ offset }` mit einem `Point` in TSX, einem `Point<Points>` in Rust.

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
> `onScroll` führt deinen Code bei jedem Frame eines Scrollvorgangs aus (vorbehaltlich der Drosselung). Für etwas, das nur scroll-gekoppelt *aussehen* muss, etwa einen Header, der ausblendet, oder ein Parallax-Bild, verwende stattdessen [`scrollValue`](#scroll-linked-effects-scrollvalue): Es läuft vollständig nativ.

<a id="scroll-linked-effects-scrollvalue"></a>

## Scroll-gekoppelte Effekte: scrollValue

`scrollValue` (`.scroll_value(&value)`) nimmt einen [animierten Wert](./animation.md#animated-values) und schreibt den Scroll-Offset (entlang der Hauptachse) nativ in ihn, im selben Frame, in dem sich der Inhalt bewegt. Binde diesen Wert oder daraus mit `interpolate`, `diffClamp` (`diff_clamp`) oder Arithmetik abgeleitete Knoten an Styles.

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

Ein Header, der beim Hochscrollen des Inhalts wegrutscht und sofort zurückkommt, sobald nach unten gescrollt wird, ist `diffClamp` des Offsets:

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

Interpolationen klemmen standardmäßig außerhalb ihres Eingabebereichs, sodass das Ziehen über den oberen Rand hinaus (ein negativer Offset) den Effekt an seinem Ende hält; übergib `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` in Rust) für einen dehnbaren Header, der beim Ziehen wächst.

## Pull-to-Refresh

`refreshing` und `onRefresh` (`.refreshing(..)` und `.on_refresh(..)`) fügen das Pull-to-Refresh-Steuerelement der Plattform hinzu. Das Steuerelement wird angezeigt, solange `refreshing` true ist; setze es in `onRefresh` und setze es zurück, wenn die Arbeit erledigt ist.

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

Unter iOS ist das Steuerelement UIRefreshControl; im Mac-Idiom von Mac Catalyst zeigt NSH einen eigenen Spinner mit demselben Verhalten. Listen akzeptieren dieselben Props. Auf dem Desktop und im Browser ist das Ziehen eine Geste des Touchscreens (oder eines macOS-Trackpads, das über den oberen Rand hinauszieht), da die Maus ohne Ziehen scrollt; biete dort einen anderen Weg zum Aktualisieren an, etwa eine Schaltfläche oder ein Tastaturkürzel.

<a id="an-indicator-of-your-own"></a>

### Ein eigener Indikator

Das Aussehen des Ziehens bestimmt die App. `refreshIndicator={{ height }}` besagt, dass die App einen eigenen Indikator zeichnet, `height` gibt seine Höhe in Punkten an: Der Spinner der Plattform wird ausgeblendet, ein Zug löst die Aktualisierung aus, sobald er `height` erreicht, und während der Aktualisierung bleiben `height` über dem Inhalt für den Indikator frei. `pullValue` speist einen animierten Wert damit, wie weit der Inhalt über den oberen Rand hinausgezogen ist: 0 in Ruhe, wachsend mit dem Zug, und `height` während der Aktualisierung. Zeichne den Indikator über den oberen Rand der Scroll View und interpoliere seine Styles aus dem Wert: Sie folgen dem Finger im UI-Thread, ohne JS pro Frame.

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

Halte `height` innerhalb der halben Viewport-Höhe: Über dem oberen Rand setzt der Inhalt dem Finger umso mehr Widerstand entgegen, je weiter er geht, und eine zu große Höhe wird nie erreicht. Unter iOS ersetzt ein eigener Indikator der App UIRefreshControl durch den Zug, den NSH selbst erkennt, wie im Mac-Idiom.

<a id="zooming"></a>

## Zoomen

Eine Scroll View (Listen behalten die Skalierung 1) zoomt, wenn ihre maximale Zoomstufe über der minimalen liegt: Pinchen skaliert den Inhalt, und im vergrößerten Zustand scrollt er in beide Richtungen.

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Der kleinste Zoom. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Der größte Zoom; liegt er über dem Minimum, zoomt Pinchen. |
| `zoomScale` | `.zoom(scale)` | `number` | | Zoomt auf diese Stufe, wenn sich der Prop ändert; der Zoom des Nutzers bleibt sonst erhalten. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Pinchen darf über die Grenzen hinausgehen und federt zurück. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | Der Nutzer kann per Pinch zoomen. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Inhalt, der kleiner als der Viewport ist (herausgezoomt), wird zentriert. |

Das Scroll-Event meldet die Zoomstufe und die gezoomte Inhaltsgröße. Per Code zoomt `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` so, dass der Inhaltspunkt (in ungezoomten Punkten) in der Mitte des Viewports landet; Doppeltippen zum Zoomen ist ein Press-Handler, der es aufruft:

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

Text und Canvases innerhalb einer gezoomten Scroll View werden nach dem Zoomen in der neuen Auflösung neu gezeichnet, sodass sie unter iOS scharf bleiben. Unter Android zoomt NSH mit einer eigenen Scroll View, die um den Fokuspunkt des Pinch herum skaliert, mit beliebig vielen Fingern schwenkt, flingt und an den Rändern und Zoomgrenzen wie ein Gummiband nachgibt. Android beginnt einen Pinch, sobald die Finger etwa 27 mm auseinander sind, wie es der Gestendetektor des Systems tut.

<a id="scrolling-from-code"></a>

## Scrollen per Code

Gib der Scroll View eine Ref (`element_ref()` und `.element_ref(&scroller)` in Rust, eine [`ref`](./jsx-and-components.md) in TSX) und rufe ihre Methoden auf. Befehle laufen nach den übrigen Änderungen desselben Updates, sodass das Scrollen zu gerade hinzugefügtem Inhalt funktioniert.

| Rust | TSX | Beschreibung |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Scrollt zu einem Offset. In TSX standardmäßig animiert. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Zoombare Scroll Views: zoomt auf `scale` (an die Grenzen geklemmt), um den Inhaltspunkt oder die Mitte. |

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

Listen ergänzen `scrollToIndex`, `scrollToOffset` und `scrollToEnd`; siehe [Listen](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Scroll Views und die Tastatur

NSH hält ein fokussiertes Eingabefeld von selbst sichtbar: Wenn die Tastatur erscheint, erhält die Scroll View um das Eingabefeld einen unteren Inset in Höhe der Tastatur und scrollt das Eingabefeld in den sichtbaren Bereich. Das geschieht nativ, ohne Code in deiner App. Verwende `env(keyboard-inset-height)` als unteres Padding ([Inhalte außerhalb von Scroll Views](./forms-and-keyboard.md#content-outside-scroll-views)) für Inhalte außerhalb von Scroll Views, etwa eine am unteren Rand fixierte Nachrichtenleiste.

Zwei Props bestimmen, wie Scrollen und Taps mit der Tastatur zusammenspielen:

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Ob das Ziehen des Inhalts die Tastatur ausblendet. `"interactive"` lässt die Tastatur unter iOS dem Finger nach unten folgen; unter Android verhält es sich wie `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | Was ein Tap bewirkt, während die Tastatur sichtbar ist. |

`keyboardShouldPersistTaps`:

- `"never"`: Ein Tap außerhalb des fokussierten Eingabefelds blendet nur die Tastatur aus, und Schaltflächen erhalten den nächsten Tap. Der Nutzer tippt einmal zum Schließen, ein zweites Mal zum Drücken.
- `"handled"`: Ein Tap auf etwas, das ihn verarbeitet (eine Schaltfläche), geht durch und die Tastatur bleibt; ein Tap auf leere Fläche blendet sie aus. Meist die richtige Wahl für Formulare.
- `"always"`: Die Tastatur bleibt bei jedem Tap sichtbar.

Beides wird nativ entschieden, wenn der Tap oder Drag geschieht, ohne auf deinen Code zu warten. Um die Tastatur per Code auszublenden, rufe `dismiss_keyboard()` in Rust oder `Keyboard.dismiss()` aus [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) in TSX auf.

<a id="nested-scroll-views"></a>

## Verschachtelte Scroll Views

Eine horizontale Scroll View in einer vertikalen funktioniert wie erwartet: Jede übernimmt die Drags entlang ihrer eigenen Achse. Zwei Scroll Views auf derselben Achse lassen sich ebenfalls verschachteln (die innere scrollt zuerst). Responder, die den Finger brauchen, etwa ein Zeichen-Canvas in einer Scroll View, halten ihn von den umgebenden Scroll Views fern: `.keep_touches(true)` in Rust, `true`, von `onResponderGrant` zurückgegeben, in TSX; siehe [Touch und Gesten](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## Siehe auch

- [Scroll](../elements/scroll.md): die Element-Referenz mit allen Props und Events.
- [Listen](./lists.md): virtualisierte Listen mit denselben Scrolling-Props.
- [Animation](./animation.md): animierte Werte, `interpolate` und `diffClamp` für scroll-gekoppelte Effekte.
- [Formulare und die Tastatur](./forms-and-keyboard.md): Eingabefelder, Fokus und die Tastatur.
