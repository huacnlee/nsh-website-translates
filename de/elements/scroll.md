---
title: "Scroll"
description: "Die native Scroll View: vertikales und horizontales Scrollen, Paging und Snapping, Pull-to-Refresh, Zoomen und Scroll-Events."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---


# Scroll

`Scroll` ist eine native Scroll-View (UIScrollView unter iOS und Mac Catalyst, eine ScrollView unter Android). Sie legt alle ihre
Kinder als Inhalt aus und scrollt sie nativ: Scrollen, Fling, Bouncing und Snapping laufen auf der Plattform, mit der
Bildwiederholrate des Displays. In Rust erzeugst du sie mit `scroll()`, in TSX mit `<Scroll>` aus `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Eine Scroll-View erzeugt jedes Kind, was für Seiten moderater Größe geeignet ist. Für lange oder unbegrenzte Daten verwende eine
[Liste](./list.md): Sie erzeugt die Zeilen in der Nähe des Viewports und recycelt sie.

Eine Scroll-View braucht entlang ihrer Achse eine begrenzte Größe: Gib ihr `flex: 1` (`.flex_1()`) oder eine Höhe innerhalb eines Containers, der
eine hat. Ihr Inhalt wird in der Breite der Scroll-View (bei horizontaler Ausrichtung in deren Höhe) und so hoch (breit) wie nötig ausgelegt.

## Props

Zusätzlich zu den [allgemeinen Props](./index.md#common-props) (mit `style` vom Typ `ViewStyle`). In Rust sind die Scrolling-Props
Methoden des Traits `Scrollable`, die sich Listen teilen.

### Scrolling

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scrollt seitwärts. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | Der Benutzer kann scrollen. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Der Scroll-Indikator wird angezeigt: der der Plattform oder die [integrierte Leiste](./scrollbar.md#built-in-bars) der App, sobald diese ein Theme gesetzt hat; ein Objekt ist ein eigenes Theme der View. Auf dem Desktop und in Desktop-Browsern behält eine horizontale View ihn: Er ist die Scroll-Leiste der Maus. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll über die Ränder hinaus. |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | Hält bei Vielfachen des Viewports an. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | Hält bei Vielfachen dieser Länge an (0: aus). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | Hält bei diesen Offsets an. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Welcher Punkt eines Elements mit `snapToInterval` am Viewport ausgerichtet wird. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Ein Fling bewegt höchstens einen Snap-Punkt weit. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | Plattform | Wie schnell ein Fling langsamer wird: die pro Millisekunde beibehaltene Geschwindigkeit (`normal` 0,998, `fast` 0,99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Abstand um den Inhalt. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Wo sie beginnt. |
| `contentStyle` | die eigenen Styles der Content-View | `ViewStyle` | | Der Style einer View um die Kinder, die mit ihnen scrollt; `flexGrow: 1` macht sie mindestens so hoch wie den Viewport (ein zentrierter Leerzustand). |
| `contentClass` | die eigenen Styles der Content-View | `string` | | Dasselbe wie Klassen, z. B. `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Ob Ziehen die Tastatur schließt. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Ob ein Tippen die Tastatur schließt: `never` (das Tippen schließt sie nur), `always` (sie bleibt oben), `handled` (sie bleibt oben, wenn etwas das Tippen verarbeitet). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Ein animierter Wert, der mit dem Scroll-Offset (Hauptachse) gespeist wird, für scrollgekoppelte Animationen. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Minimale Millisekunden zwischen `onScroll`-Events (ohnehin höchstens eines pro Frame). |

### Pull to refresh

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | Der Refresh-Spinner wird angezeigt. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | Der Benutzer hat zum Aktualisieren gezogen: Starte das Laden und setze `refreshing`, bis es endet. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | Die App zeichnet ihren eigenen Indikator, `height` Punkte hoch: Der Spinner der Plattform wird ausgeblendet, ein Ziehen löst die Aktualisierung aus, sobald es `height` erreicht, und während der Aktualisierung bleibt `height` über dem Inhalt. Eine Höhe von 0 oder weniger bedeutet keinen. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Ein animierter Wert, der damit gespeist wird, wie weit die View über ihren oberen Rand hinausgezogen ist (0 in Ruhe, wächst mit dem Ziehen; der Platz, der während der Aktualisierung über dem Inhalt bleibt: `height` mit `refreshIndicator`), für den Indikator der App. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

Wenn `maximumZoomScale` über `minimumZoomScale` (`.zoom_range(min, max)` in Rust) gesetzt wird, lässt sich der Inhalt per
Pinch zoomen; hineingezoomt scrollt er in beide Richtungen. Listen behalten ihren Maßstab.

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Der kleinste Zoom. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Der größte Zoom. |
| `zoomScale` | `.zoom(..)` | `number` | | Zoomt auf diesen Maßstab, wenn er sich ändert; andernfalls bleibt der Zoom des Benutzers erhalten. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Pinchen darf die Grenzen überschreiten und federt zurück. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | Der Benutzer kann per Pinch zoomen. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Inhalt, der kleiner als der Viewport ist (herausgezoomt), wird zentriert. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Der Offset hat sich geändert (höchstens einmal pro Frame und nicht öfter als `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | Der Benutzer hat begonnen / aufgehört zu ziehen. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Ein Gleiten nach dem Ziehen hat begonnen / aufgehört. Ein Gleiten, das von einem neuen Ziehen abgefangen wird, endet trotzdem mit `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Das Scrollen ist zur Ruhe gekommen. |
| `onRefresh` | `.on_refresh` | keine | Zum Aktualisieren gezogen. |

`ScrollEvent` ist `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (in Rust `offset`, `content_size`,
`size`, `zoom_scale`): der Offset, die (gezoomte) Inhaltsgröße, die Viewport-Größe und der Zoom-Maßstab (1, sofern die View
nicht zoomt).

> [!TIP]
> Um etwas mit der Scroll-Position zu bewegen (ein schrumpfender Header, ein Parallax-Bild), binde `scrollValue` an einen nativen
> Wert und interpoliere ihn in einem Style. Das läuft auf dem UI-Thread mit der Bildwiederholrate des Displays, während `onScroll` ein Event pro
> Frame im Code der App ist. Siehe [Animation](../docs/animation.md).

<a id="ref-methods"></a>

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Scrollt zu einem Offset. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Zoomt auf `scale` (auf die Grenzen begrenzt), wobei der Inhaltspunkt (`x`, `y`, ungezoomte Punkte) in der Mitte des Viewports liegt, oder um die Mitte herum. Z. B. ein Doppeltippen, das auf den getippten Punkt hineinzoomt. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## Tastatur

Eingabefelder in einer Scroll-View werden nativ von der Tastatur freigehalten: Die Scroll-View erhält einen unteren Inset und scrollt von selbst zum
fokussierten Eingabefeld. Für Inhalte außerhalb von Scroll-Views verwende [`env(keyboard-inset-height)`](./keyboard.md)
in einem unteren Padding oder Margin. Siehe [Formulare und die Tastatur](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## Rechts nach links

Horizontale Scroll-Views beginnen in Rechts-nach-links-Layouts am rechten Ende und behalten ihren Abstand davon bei, wenn sich der Inhalt
ändert; ihre Kinder werden gespiegelt.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Android: Pull to refresh wird von NSH gezeichnet (Overscroll bleibt nativ), `contentInset` wird als Padding angewendet, und
  `decelerationRate` formt Snapping-Gleitbewegungen.
- Android zoomt mit NSHs eigener Scroll-View, die den Inhalt um seine obere linke Ecke skaliert und in beide Richtungen scrollt.
  Pinches beginnen nach dem minimalen Abstand zwischen den Fingern unter Android (etwa 27 mm).
- Unter Mac Catalyst (Mac-Idiom) erkennt NSH das Ziehen und zeigt seinen Spinner an.
- iOS zeichnet Texte und Canvases in der gezoomten Auflösung neu, wenn ein Zoom endet.
