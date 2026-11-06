---
title: "Scrollbar"
description: "Die Scrollbar-Komponente: eine Bildlaufleiste im eigenen Look der App, entweder für alle Scroll-Ansichten und Listen (ein einmal festgelegtes Theme) oder für eine einzelne, platziert, wo die App sie haben möchte. Ihr Thumb folgt dem Inhalt, und Ziehen und Drücken scrollen den Inhalt. Sie wird beim Scrollen, beim Hovern oder dauerhaft angezeigt und blendet sich nach dem Timing der App ein und aus."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---


# Scrollbar

Eine Scrollbar gibt einer Scroll View oder einer Liste eine Leiste im eigenen Look der App: eine dünne Pille, die sich unter dem Zeiger verbreitert, einen Track im Farbton der Marke, eine Leiste neben einem fixierten Header oder entlang zweier Bereiche. Einmal als Theme der App gesetzt, zeichnen alle Scroll Views und Listen eine solche Scrollbar anstelle der Plattform-Anzeige ([Integrierte Scrollbars](#built-in-bars)); von der App platziert, benennt sie die Scroll View, die sie bewegt, und sitzt dort, wo die App sie hinsetzt. Sie bringt ihr Verhalten selbst mit: Länge und Position des Thumbs folgen dem Inhalt, dem Viewport und dem Offset (auch wenn eine Liste wächst oder die Fenstergröße sich ändert); Ziehen des Thumbs scrollt den Inhalt, und ein Druck auf den Track bringt die Mitte des Thumbs dorthin; sie wird angezeigt, während der Inhalt scrollt, solange der Zeiger darüber ist, oder immer, und blendet nativ ein und aus. Look und Timing bestimmt die App: Eine `Scrollbar` hat keine eigenen Farben, Größen oder Radien, und ihre Ein- und Ausblendungen dauern null Zeit, bis die App ihnen eine Dauer gibt.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `scrollbar()` eine Scrollbar, mit einem Setter pro Prop (`.scroll(..)`, `.thumb_style(..)`) und den typisierten Style-Methoden für die Scrollbar selbst; bei `scroll` kann `ElementRef` (oder `ScrollbarTarget`) übergeben werden.

<a id="built-in-bars"></a>

## Integrierte Scrollbars

Jede Scroll View und jede Liste kann anstelle der Plattform-Anzeige eine `Scrollbar` zeichnen, ohne dass eine Scrollbar platziert werden muss: `Scrollbar.setTheme` gibt der Scrollbar jeder View, deren `scrollbar` `true` ist, einmal den Look der App, dort, wo die App startet. Jede View erhält ihre eigene Scrollbar über ihrem Viewport; sie bleibt dort, während der Inhalt scrollt (auf dem Main Thread, wie es Sticky Views tun), und wird über dem Inhalt gezeichnet; sie folgt, scrollt und blendet sich ein und aus wie eine platzierte `Scrollbar`.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

Ein `ScrollbarTheme` enthält die Props einer Scrollbar, die für alle Views gleich sind, sowie den Look jeder Achse:

| Feld | Typ | Standard | Beschreibung |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Wann die Scrollbars angezeigt werden: [Wann sie erscheint](#when-it-shows). |
| `motion` | `ScrollbarMotion` | springt, `idle` `2000` | Wie sie ein- und ausgeblendet werden: [Bewegung](#motion). |
| `minThumbLength` | `number` | `48` | Die kürzeste Länge eines Thumbs. |
| `vertical`, `horizontal` | `ScrollbarLook` | keine | Der Look der Scrollbars vertikaler und horizontaler Views: `class` und `style` für den Track, im Viewport der View platziert; `thumbClass` und `thumbStyle`; `accessibilityLabel`. Eine View, deren Achse keinen Look hat, behält die Plattform-Anzeige. |

Ein späterer Aufruf von `setTheme` gestaltet die Scrollbars neu, und `Scrollbar.setTheme(null)` gibt den Views die Plattform-Anzeige zurück. Eine einzelne View kann ein eigenes Theme als Prop `scrollbar` erhalten (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`), unabhängig davon, ob die App eines gesetzt hat; `scrollbar={false}` lässt eine View ohne Scrollbar. Eine Liste, die im Viewport ihres Eltern-Elements angelegt ist (`viewport="parent"`), scrollt mit dieser View und deren Scrollbar. Bei mehrzeiligem `Input` liegt auch die Scrollbar des vertikalen Looks über dem Text und scrollt ihn, wie es die eigene Anzeige der Text-View tut.

<a id="the-scroll-view-it-moves"></a>

## Die Scroll View, die sie bewegt

`scroll` benennt die Scroll View oder die Liste, der die Scrollbar folgt: ihr `ref`. Die Scrollbar findet sie, sobald sie auf dem Bildschirm ist, daher darf `ref` von einem späteren Element im selben Render gesetzt werden; schreibe die Scrollbar nach ihrer Scroll View (oder halte `ref` in einem Signal). Schalte die eigene Anzeige der Scroll View mit `scrollbar={false}` ab und platziere die Scrollbar mit `class`: über dem Rand der Scroll View in einer `relative`-Box um beide oder irgendwo sonst auf dem Bildschirm.

- Der Thumb ist so lang wie der Anteil des Inhalts, den der Viewport zeigt, entlang der Content Box des Tracks (innerhalb seines Paddings), und nicht kürzer als `minThumbLength`. Seine Position entspricht dem Scrollabstand des Inhalts; wenn der Inhalt über ein Ende hinausfedert, bleibt der Thumb an diesem Ende.
- Ziehen des Thumbs scrollt den Inhalt um genau so viel, wie sich der Thumb bewegt. Ein Druck auf den Track bringt die Mitte des Thumbs unter den Zeiger, und ein Ziehen setzt sich von dort fort.
- Eine vertikale Scrollbar folgt einer vertikalen Scroll View; `axis="horizontal"` erzeugt eine Scrollbar für eine horizontale (am unteren Rand zu platzieren). Eine Scrollbar pro Achse.
- Listen funktionieren ebenso: Der Thumb folgt der gesamten Länge der Liste, während Zeilen gemessen und hinzugefügt werden.

<a id="when-it-shows"></a>

## Wann sie erscheint

| `mode` | Wird angezeigt |
|---|---|
| `"scrolling"` (Standard) | Während der Inhalt scrollt, und bis `motion.idle` nach dem Stopp; ein Zeiger auf der Scrollbar hält sie, solange sie angezeigt wird. |
| `"hover"` | Solange der Zeiger über der Scrollbar ist (an der Stelle, an der sie angezeigt wird, auch im ausgeblendeten Zustand), und wie bei `"scrolling"`. |
| `"always"` | Immer. |

In jedem Modus wird sie angezeigt, solange ihr Thumb gezogen wird, und bleibt nach dem letzten Scrollen, Ziehen oder Hovern noch `motion.idle` sichtbar. Passt der Inhalt in den Viewport, bleibt sie ausgeblendet. Ausgeblendet steht die Scrollbar auf `opacity: 0` und reicht Drücke an das darunterliegende Element durch.

<a id="motion"></a>

## Bewegung

`motion` steuert das Timing der Ein- und Ausblendungen der Scrollbar, die nativ laufen, so wie `ScrollbarMotion` von `gpui-base`:

| Feld | Standard | Beschreibung |
|---|---|---|
| `idle` | `2000` | Wie lange die Scrollbar nach dem letzten Scrollen, Ziehen oder Hovern sichtbar bleibt, in Millisekunden. |
| `enter` | `0` | Wie lange das Erscheinen dauert: Die Deckkraft steigt linear, ein Slide läuft mit Ease-out aus. |
| `exit` | `0` | Wie lange das Ausblenden dauert, sobald `idle` vorbei ist, mit Ease-in; sie gleitet beim Ausblenden aus ihrem Track heraus. |
| `entrance` | `"fade"` | Wie sie erscheint: `"fade"` an Ort und Stelle oder `"slideAndFade"` von dem Rand, an dem sie liegt (rechts, unten). |
| `thumbHoverEntrance` | `"fade"` | Wie sie erscheint, wenn der Zeiger auf ihrem ausgeblendeten Thumb sie anzeigt (`"hover"`). |

Ohne Dauern springt die Scrollbar ein und aus. Eine auf halbem Weg umgekehrte Überblendung behält ihre Geschwindigkeit: Sie läuft über den Anteil ihrer Dauer, der noch zurückzulegen ist. Eine `"always"`-Scrollbar animiert nie, und keine animiert, solange der Nutzer weniger Bewegung wünscht. Der Track beschneidet, was gleitet. Die eigene Bewegung des Thumbs, etwa eine Breite, die bei `hover:` wächst, gehört zu seinem Style (`transition-all` bei `thumbClass`).

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | keine | Die Scroll View oder Liste, der die Scrollbar folgt und die sie bewegt (ihr `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | Die Achse der Scroll View: Der Track verläuft entlang dieser. Wird gelesen, wenn die Scrollbar erzeugt wird. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Wann die Scrollbar angezeigt wird. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | springt, `idle` `2000` | Wie sie ein- und ausgeblendet wird: [Bewegung](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | Die kürzeste Länge des Thumbs bei langem Inhalt, damit er leicht zu greifen bleibt. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keine | Der Thumb. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keine | Was Screenreader über die Scrollbar sagen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Die Scrollbar: ihr Track, dort, wo die App sie platziert. |

<a id="parts"></a>

## Teile

| Teil | Innerhalb | Gestaltet mit |
|---|---|---|
| Der Track | dort, wo die App ihn platziert | `class`, `style` |
| Der Thumb | die Content Box des Tracks | `thumbClass`, `thumbStyle` |

Die Scrollbar bemisst den Thumb entlang der Achse und bewegt ihn; seine Dicke und seine Position quer zum Track bestimmt die App (`w-1.5` und `items-end` am Track setzen einen 6-Punkt-Thumb nach rechts). Das Padding des Tracks hält den Thumb von dessen Enden und Seiten fern.

Zustände der Teile:

- Der Track: `hover:` unter dem Zeiger; er fungiert als `group`, daher übernimmt der Thumb `group-hover:` von ihm (ein Thumb, der sich verbreitert, wenn sich der Zeiger nähert).
- Der Thumb: `hover:` unter dem Zeiger, `active:` während er gezogen wird.

Die Sichtbarkeit der Scrollbar ist ihre Deckkraft: Lege die Transparenz in die Farben des Hintergrunds des Tracks oder des Thumbs. Ein Thumb, der sich verbreitert, verwendet `transition-all` (dies verzögert nie die Position des Thumbs, die die Scrollbar unabhängig von seinen Styles setzt), und `motion-reduce:` hält ihn für Nutzer ruhig, die weniger Bewegung wünschen.

<a id="accessibility"></a>

## Barrierefreiheit

- Die Scroll View bleibt das, was Screenreader scrollen: Sie bewegen sie mit ihren eigenen Gesten und lesen ihren Inhalt.
- Die Scrollbar wird über `accessibilityLabel` für die Screenreader beschriftet, die sie erreichen.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Aktionen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Jede Plattform zeichnet, was die App gestaltet, und der Thumb folgt dem Offset, den jede Plattform für die Scroll View meldet. Ziehen des Thumbs und Drücke auf den Track funktionieren mit Maus, Stift oder Finger.
- `"hover"` folgt dem Zeiger einer Maus oder eines Touchpads (Desktops und Web); auf einem Touchscreen wird die Scrollbar angezeigt, während der Inhalt scrollt, und ihr ausgeblendeter Track lässt Berührungen durch.
