---
title: "Sheet"
description: "Die Sheet-Komponente: ein Panel am Rand des Bildschirms über einem Backdrop, das durch den Backdrop, Escape und Zurück geschlossen wird und von der App gestaltet wird."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---


# Sheet

Ein Sheet ist ein Panel an einem Bildschirmrand über einem Backdrop, der den Rest verdeckt: Filter, ein Panel zum Teilen, eine seitliche Schublade (Drawer). Ein Tippen auf den Backdrop, Escape, die Android-Zurück-Taste und die Escape-Geste von VoiceOver schließen es. Es erscheint in seinem Fenster über allem, auf jedem Gerät gleich, und zeichnet selbst nichts: Panel und Backdrop gehören der App.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` stammt aus [`nsh/base`](../modules/nsh-base.md). Sein Inhalt wird bei jedem Öffnen neu erzeugt. `side` platziert es am `"bottom"` (Standard) oder `"top"` des Bildschirms, so breit wie der Bildschirm, oder am `"left"` oder `"right"`, so hoch wie der Bildschirm; seine Ausdehnung quer dazu bestimmt das Panel, aus seinem Inhalt oder `popupClass`.

Seine Slide-Animation folgt der gemessenen Größe des Panels, während der Inhalt während des Einblendens erzeugt wird oder wächst. Lazy Content und asynchrone Größenaktualisierungen teilen sich denselben Animationsfortschritt; das Panel setzt sich bei seiner aktuellen Größe.

<a id="open-state"></a>

## Offener Zustand

Ohne `open` verwaltet das Sheet seinen eigenen Zustand, beginnend mit `defaultOpen`. Mit `open` gehört der Zustand der App: Ändere ihn in `onOpenChange({ open, reason })`, das jede Schließanfrage mit ihrem Grund meldet (`"backdropPress"`, `"cancel"`, `"swipe"`).
`onOpen` und `onClose` folgen ihm beim Ein- und Ausblenden, unabhängig davon, wer das Sheet geöffnet oder geschlossen hat.

`closeOnEscape={false}` hält es bei Escape und Zurück offen, `closeOnBackdropPress={false}` bei Tippen auf den Backdrop;
`onCancel` erhält diese Ereignisse trotzdem, um vorher nachzufragen.

<a id="dragging-a-bottom-sheet"></a>

## Ziehen eines Bottom Sheets

Setze `closeOnSwipe`, damit ein unteres Panel dem Ziehen nach unten folgt. Sein Backdrop blendet mit der Distanz aus; wird das Panel nach mehr als 30 % seiner Höhe oder mit mehr als 800 Punkten pro Sekunde nach unten losgelassen, wird das Schließen mit dem Grund `"swipe"` angefordert.
Ein kürzeres Ziehen kehrt sanft zurück. Eine steuernde App kann `open` auf true halten, um das Panel nach einer Schließanfrage zurückzuholen.
Bei reduzierter Bewegung setzen sich Loslassen sowie programmatisches Öffnen und Schließen sofort; direktes Ziehen folgt weiterhin dem Finger.

Das Panel passt sich seinem Inhalt an, auch bei kurzen Menüs; verwende `popupStyle` oder die Höhe eines Kindelements, um höheren Inhalt zu begrenzen.
Die App zeichnet ihren eigenen Handle, der eine beliebige View im Panel sein kann. Unter iOS verbraucht ein innerer vertikaler `Scroll` oder `List`
das Ziehen bis zu seinem Anfang und gibt die verbleibende Abwärtsbewegung innerhalb derselben Geste an das Panel weiter.
Unter Android, auf Desktops und im Web nutzt das Ziehen am Handle oder am Inhalt außerhalb eines Scrollbereichs deren native Pan-Unterstützung;
innere Scrollbereiche behalten die normale Gestenarbitrierung ihrer Plattform. Wird `closeOnSwipe` auf false gesetzt, bleibt das Panel
unbewegt, und der eingehängte Inhalt samt Scrollposition bleibt erhalten. Andere Seiten behalten ihr bisheriges Verhalten.

## Native Sheets

Ein Sheet wird von NSH im Fenster der App gezeichnet und von der App gestaltet. Für das von der Plattform selbst präsentierte Sheet (ein Page Sheet
unter iOS) verwende einen [Dialog](./dialog.md) mit `presentation="pageSheet"`.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | keiner | Geöffnet, von der App gesteuert. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Zu Beginn geöffnet, ohne `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Der Rand, an dem es sitzt. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape und die Android-Zurück-Taste schließen es. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Ein Tippen auf den Backdrop schließt es. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | Ein unteres Panel folgt dem Ziehen nach unten und schließt sich bei ausreichendem Loslassen. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Panels. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Backdrops, etwa eine transluzente Farbe. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Eine Schließanfrage mit Grund: `"backdropPress"`, `"cancel"` oder `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | Es ist eingeblendet: Alles ist da. |
| `onClose` | `.on_close(\|\| ..)` | Es ist weg: Alles ist verschwunden. Auch dann, wenn die App es geschlossen hat. |
| `onCancel` | `.on_cancel(\|\| ..)` | Der Nutzer hat versucht, es zu schließen (Escape oder Zurück, Tippen auf den Backdrop, ein aktivierter Swipe), unabhängig davon, ob es sich geschlossen hat. |

Im Web präsentiert das Einbetten mit `dialogs: "viewport"` das Sheet und seinen Backdrop über der Host-Seite,
einschließlich eines Same-Origin-iframes. Cross-Origin-Frames verwenden [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
