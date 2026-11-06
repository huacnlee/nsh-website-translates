---
title: "Popover"
description: "Die Popover-Komponente: Inhalt, der an einem Auslöser verankert ist und über allem anderen liegt. Der Auslöser, ein Tippen außerhalb, Escape und die Zurück-Aktion schließen ihn. Das Styling übernimmt die App."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---


# Popover

Ein Popover zeigt Inhalte neben seinem Trigger und über allem anderen an: Details, ein kleines Formular, einen Farbwähler.
Ein Druck auf den Trigger öffnet und schließt es; ein Druck außerhalb, Escape, die Android-Zurück-Taste und die Escape-Geste von VoiceOver schließen es. Es wird an einer Seite des Triggers platziert, wechselt auf die andere Seite, wenn dort kein Platz ist, bleibt innerhalb der Safe Area und folgt dem Trigger beim Scrollen. Es zeichnet nichts selbst: Das Popup und sein Inhalt gehören der App.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` stammt aus [`nsh/base`](../modules/nsh-base.md). Sein Inhalt wird bei jedem Öffnen neu erzeugt, daher beginnt der Zustand darin jedes Mal von vorn.

<a id="open-state"></a>

## Offener Zustand

Ohne `open` verwaltet das Popover seinen eigenen Zustand, beginnend bei `defaultOpen`. Mit `open` gehört der Zustand der App: Sie ändert ihn in `onOpenChange({ open, reason })`, das jede Anfrage zum Öffnen oder Schließen samt Grund meldet (`"triggerPress"`, `"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` hält es bei Escape und Zurück offen (`onCancel` bekommt beides weiterhin mit, um vorher nachzufragen); `closeOnPressOutside={false}` hält es bei Drücken außerhalb offen.

<a id="phones-and-desktops"></a>

## Smartphones und Desktops

Ein Popover ist auf jedem Gerät an seinem Trigger verankert: Was es zeigt, gehört neben das, was es geöffnet hat.

- Auf Desktops und in Desktop-Browsern schließt ein Druck außerhalb das Popover und wird an das weitergegeben, was unter dem Zeiger liegt. Ein Klick schließt also das Popover und drückt zugleich die Schaltfläche, auf die er traf.
- Auf Smartphones und Tablets schließt ein Druck außerhalb das Popover nur: Ein transparenter Hintergrund fängt den Druck ab, wie bei den Popovers des Systems.

Für eine Liste von Aktionen verwenden Sie ein [Menu](./menu.md), das auf Smartphones zu einem Sheet wird; für ein Panel verwenden Sie ein [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Ein- und Ausblenden

Ein Popover kommt und geht mit Ihren Transitions. `popupStartingClass` ist das Aussehen des Popups im ersten Frame, und die `transition-*`-Klassen von `popupClass` führen es zu seinem eigenen Aussehen: dem Einblenden. `popupEndingClass` ist sein Aussehen im geschlossenen Zustand: Das Popover bleibt bestehen und nimmt keine Drücke an, solange diese Transitions laufen, und verschwindet dann; danach folgt `onClose`. Wird es beim Ausblenden erneut geöffnet, kehrt es von seinem aktuellen Stand aus zu seinem Aussehen zurück. `popupStartingStyle` und `popupEndingStyle` leisten dasselbe mit Inline-Styles. Wenn der Benutzer weniger Bewegung wünscht, erscheint und verschwindet es sofort.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` gibt an, wohin das Popup gesetzt wurde: die Seite des Triggers (die andere, wenn dort für `placement` kein Platz war), sein Frame und den Platz auf dieser Seite, sodass ein Pfeil oder eine Einblendung auf den Trigger zeigen kann.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | keiner | Geöffnet, von der App gesteuert. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Anfangs geöffnet, ohne `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Die Seite des Triggers, auf der es erscheint. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Wie es sich entlang dieser Seite am Trigger ausrichtet. |
| `offset` | `.offset(..)` | `number` | `0` | Der Abstand zwischen Trigger und Popup. |
| `margin` | `.margin(..)` | `number` | `0` | Der Abstand, den es zu den Rändern der Safe Area einhält. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape und die Android-Zurück-Taste schließen es. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Ein Druck außerhalb schließt es. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups, der Box, in der der Inhalt liegt. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups im ersten Frame, zusätzlich zu seinem eigenen: Seine Transitions laufen von dort aus. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups im geschlossenen Zustand, zusätzlich zu seinem eigenen: Es bleibt bestehen, solange seine Transitions laufen. |
| `trigger` | `.trigger(..)` | `JSX.Element` | keiner | Was es öffnet; das Popover wird daran ausgerichtet. Solange das Popover geöffnet ist, gelten dessen `aria-expanded:`-Klassen und `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Es wurde geöffnet oder geschlossen, mit dem Grund: `"triggerPress"`, `"pressOutside"` oder `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Es wird angezeigt. |
| `onClose` | `.on_close(\|\| ..)` | Es ist verschwunden, nach dem Ausblenden; auch dann, wenn die App es geschlossen hat. |
| `onCancel` | `.on_cancel(\|\| ..)` | Der Benutzer hat versucht, es zu schließen (Escape oder Zurück, ein Druck außerhalb), unabhängig davon, ob es sich geschlossen hat. |
| `onPosition` | `.on_position(\|e\| ..)` | Das Popup wurde platziert: `placement` (die Seite, auf der es erscheint), `bounds` (sein Frame), `available` (der Platz auf dieser Seite). |

<a id="accessibility"></a>

## Barrierefreiheit

Der Trigger teilt Screenreadern mit, ob das Popover erweitert ist. Escape und die Zurück-Taste schließen es, wie es Benutzer von einem Popup erwarten. In TSX ist der Trigger das Element, das Sie übergeben, ein `Button` oder eine eigene View: Er übernimmt die Drücke und den Erweitert-Zustand selbst, sodass seine eigenen `active:`-Klassen und `activeStyle` gelten, solange er gedrückt wird, und sein eigenes `onPress` ebenfalls ausgeführt wird.
