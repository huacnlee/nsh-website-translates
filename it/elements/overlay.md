---
title: "Overlay"
description: "L'elemento Overlay: contenuto mostrato sopra lo schermo indipendentemente da ciò che ritaglia il suo elemento padre, disposto come un riquadro fisso oppure posizionato rispetto a un'ancora che segue, con la segnalazione dei tocchi all'esterno e del tasto Escape."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Un overlay mostra i suoi figli sopra a tutto nella vista radice in cui si trova: la finestra, o il dialog che la circonda.
Né la dimensione del genitore, né `overflow: hidden`, né le scroll view lo ritagliano. Per tutto il resto rimane dove lo hai scritto:
legge il contesto che lo circonda, i suoi handler sono quelli del suo componente e scompare insieme al suo genitore. Popover,
menu, tooltip e sheet sono costruiti su di esso; [`nsh/base`](../modules/nsh-base.md) li offre già pronti
([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), mentre l'overlay è ciò che
usi per costruire i tuoi.

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

`Overlay` proviene da `nsh` in TSX e `overlay()` da `nsh_core::prelude` in Rust. Viene mostrato finché è presente nella
vista: mettilo in un `If` (Rust: `when(..)`) per aprirlo e chiuderlo. Gli overlay mostrati dopo stanno sopra a quelli precedenti, e
un overlay dentro un altro sta sopra a quest'ultimo.

<a id="placement"></a>

## Posizionamento

Senza `anchor`, un overlay viene disposto come un box `position: fixed` della sua vista radice: i suoi `top`, `left`, `inset`,
la dimensione e i margini sono riferiti all'intera finestra (o al dialog). `class="inset-0"` la ricopre, ed è un backdrop o un
livello a tutta finestra; `class="bottom-0 left-0 right-0"` è una barra lungo il bordo inferiore.

Con `anchor`, NSH lo posiziona accanto all'ancora:

- `anchor` è una vista (un `ref`), un `Point` (`{ x, y }`) nelle coordinate della vista radice, le coordinate `pageX` / `pageY` di un tocco
  (un menu dove si trova il puntatore), oppure un `Bounds` (`{ origin, size }`) in quelle coordinate: il cursore di un input (`pageBounds` di `onCaretMove`), dove si aprono i suggerimenti
  per ciò che si sta digitando.
- `placement` è il lato su cui si posiziona: `"top"`, `"bottom"` (il valore predefinito), `"left"` o `"right"`. Quando non c'entra
  da quel lato ma c'entra sul lato opposto, va sull'altro lato; quando non c'entra in nessuno dei due, va sul lato con più spazio.
- `align` lo allinea lungo quel lato: `"start"`, `"center"` (il valore predefinito) o `"end"`. Sopra e sotto l'ancora,
  start ed end seguono la direzione del layout: start è il bordo sinistro, oppure il bordo destro in un layout da destra a sinistra.
- `offset` è lo spazio tra l'ancora e l'overlay; `margin` è la distanza che mantiene dai bordi della
  safe area, all'interno della quale resta: scorre lungo il proprio lato per adattarsi.

Un overlay ancorato segue la sua ancora: quando l'ancora scorre, si sposta o cambia dimensione, l'overlay si muove con essa nello
stesso frame in cui NSH lo dispone. `onPosition` indica dove è finito, così una freccia può puntare all'ancora o un menu lungo può
limitare la propria altezza:

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

## Chiusura

Un overlay segnala ciò che di solito chiude un popup e lascia a te la decisione:

- `onPressOutside` viene emesso quando un dito o un pulsante del mouse viene premuto fuori dall'overlay, dalla sua ancora e dagli overlay
  al suo interno. La pressione prosegue verso ciò che si trova sotto.
- `onCancel` viene emesso con Escape, il pulsante indietro di Android e il gesto di escape di VoiceOver su iOS, solo per l'overlay più in alto che lo ascolta. Li intercetta
  prima delle pagine e di `BackHandler`.

Per bloccare lo schermo dietro un popup, metti sotto di esso un secondo overlay con `class="inset-0"` e un `onPress` che chiuda
entrambi: è così che funzionano [Sheet](./sheet.md) e la presentazione su telefono di [Popover](./popover.md).

## Props

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | nessuno | La vista, il punto o il box rispetto a cui viene posizionato. Senza di esso è un box fisso della sua vista radice. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Il lato dell'ancora su cui si posiziona. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Come si allinea all'ancora lungo quel lato. |
| `offset` | `.offset(px(..))` | `number` | `0` | Lo spazio tra l'ancora e l'overlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | La distanza che mantiene dai bordi della safe area. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che mostra. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto e, senza un'ancora, la sua posizione. |

Accetta anche le [prop comuni](./index.md#common-props) di una vista.

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Una pressione è avvenuta fuori da esso, dalla sua ancora e dagli overlay al suo interno (`pagePosition`, un `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Escape, il pulsante indietro di Android o il gesto di escape di VoiceOver, mentre è l'overlay più in alto in ascolto. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH lo ha posizionato: `placement` (il lato su cui è andato), `bounds` nella vista radice e `available` (un `Size`: lo spazio disponibile su quel lato). |

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma mostra un overlay come una vista nativa della vista radice della finestra (o del dialog), disegnata e sottoposta a hit-test
  come le viste che la circondano: UIKit, Android views, AppKit, GTK, Win32, GPUI e il DOM.
- Un overlay all'interno di un [Dialog](./dialog.md) viene mostrato in quel dialog, sopra al suo contenuto.
- Gli overlay restano nella propria finestra: un menu che supererebbe il bordo della finestra scorre all'indietro per rientrarvi.
