---
title: "Overlay"
description: "Das Overlay-Element: Inhalte, die oberhalb des Bildschirms angezeigt werden, unabhängig davon, was das übergeordnete Element beschneidet. Es wird als feste Box angeordnet oder an einem Anker platziert, dem es folgt. Klicks außerhalb und die Escape-Taste werden gemeldet."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---


# Overlay

Ein Overlay zeigt seine Kinder über allem in der Root-View, in der es sich befindet: dem Fenster oder dem Dialog darum herum.
Die Größe seines Elternelements, `overflow: hidden` und Scroll-Views beschneiden es nicht. In allem anderen bleibt es dort, wo du es geschrieben hast: Es liest den Kontext um sich herum, seine Handler gehören zu seiner Komponente, und es verschwindet mit seinem Elternelement. Popovers, Menüs, Tooltips und Sheets basieren darauf; [`nsh/base`](../modules/nsh-base.md) liefert sie fertig mit ([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), und mit einem Overlay baust du deine eigenen.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay` kommt in TSX aus `nsh` und `overlay()` in Rust aus `nsh_core::prelude`. Es wird angezeigt, solange es in der View ist: Setze es in ein `If` (Rust: `when(..)`), um es zu öffnen und zu schließen. Später angezeigte Overlays liegen über früheren, und ein Overlay innerhalb eines anderen liegt über diesem.

<a id="placement"></a>

## Platzierung

Ohne `anchor` wird ein Overlay als `position: fixed`-Box seiner Root-View gelayoutet: Sein `top`, `left`, `inset`, seine Größe und seine Abstände beziehen sich auf das gesamte Fenster (oder den Dialog). `class="inset-0"` deckt es vollständig ab, was einem Backdrop oder einer Ebene über das ganze Fenster entspricht; `class="bottom-0 left-0 right-0"` ist eine Leiste am unteren Rand.

Mit `anchor` platziert NSH es neben dem Anker:

- `anchor` ist eine View (ein `ref`), ein `Point` (`{ x, y }`) in den Koordinaten der Root-View, die `pageX` / `pageY` einer Berührung (ein Menü dort, wo der Zeiger ist) oder ein `Bounds` (`{ origin, size }`) dort: das Caret einer Eingabe (`onCaretMove` von `pageBounds`), an dem sich Vorschläge für das Getippte öffnen.
- `placement` ist die Seite, auf der es erscheint: `"top"`, `"bottom"` (der Standard), `"left"` oder `"right"`. Passt es dort nicht und auf der gegenüberliegenden Seite schon, erscheint es dort; passt es auf keiner von beiden, erscheint es auf der Seite mit mehr Platz.
- `align` richtet es entlang dieser Seite aus: `"start"`, `"center"` (der Standard) oder `"end"`. Über und unter dem Anker folgen Start und Ende der Layoutrichtung: Start ist der linke Rand, in einem Rechts-nach-links-Layout der rechte Rand.
- `offset` ist der Abstand zwischen Anker und Overlay; `margin` der Abstand, den es zu den Rändern der Safe Area einhält und innerhalb derer es bleibt: Es gleitet entlang seiner Seite, damit es passt.

Ein verankertes Overlay folgt seinem Anker: Wenn der Anker scrollt, sich bewegt oder seine Größe ändert, bewegt sich das Overlay im selben Frame mit, in dem NSH es layoutet. `onPosition` meldet, wohin es gelangt ist, sodass ein Pfeil auf den Anker zeigen oder ein langes Menü seine Höhe begrenzen kann:

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## Schließen

Ein Overlay meldet, was ein Popup üblicherweise schließt, und überlässt dir die Entscheidung:

- `onPressOutside` wird ausgelöst, wenn ein Finger oder eine Maustaste außerhalb des Overlays, seines Ankers und der Overlays darin gedrückt wird. Der Druck wird an das weitergegeben, was darunter liegt.
- `onCancel` wird bei Escape, der Zurück-Taste von Android und der Escape-Geste von VoiceOver auf iOS ausgelöst, und zwar nur für das oberste Overlay, das darauf hört. Es erhält sie vor den Seiten und `BackHandler`.

Um den Bildschirm hinter einem Popup zu blockieren, setze ein zweites Overlay mit `class="inset-0"` darunter, dazu ein `onPress`, das beide schließt: So funktionieren [Sheet](./sheet.md) und die Telefon-Darstellung von [Popover](./popover.md).

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | keiner | Die View, der Punkt oder die Box, an der es platziert wird. Ohne Anker ist es eine feste Box seiner Root-View. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Die Seite des Ankers, auf der es erscheint. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Wie es sich entlang dieser Seite am Anker ausrichtet. |
| `offset` | `.offset(px(..))` | `number` | `0` | Der Abstand zwischen Anker und Overlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | Der Abstand zu den Rändern der Safe Area. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Was es anzeigt. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Sein Aussehen und, ohne Anker, seine Position. |

Es akzeptiert außerdem die [allgemeinen Props](./index.md#common-props) einer View.

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Ein Druck erfolgte außerhalb des Overlays, seines Ankers und der Overlays darin (`pagePosition`, ein `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, die Zurück-Taste von Android oder die Escape-Geste von VoiceOver, während es das oberste Overlay ist, das darauf hört. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH hat es platziert: `placement` (die Seite, auf der es erschien), `bounds` in der Root-View und `available` (ein `Size`: der Platz auf dieser Seite). |

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Jede Plattform zeigt ein Overlay als native View der Root-View des Fensters (oder des Dialogs) an, die genauso gezeichnet wird und Treffer erkennt wie die Views um sie herum: UIKit, Android Views, AppKit, GTK, Win32, GPUI und das DOM.
- Ein Overlay innerhalb eines [Dialog](./dialog.md) wird in diesem Dialog über dessen Inhalt angezeigt.
- Overlays bleiben in ihrem Fenster: Ein Menü, das über den Fensterrand hinausragen würde, gleitet zurück ins Fenster.
