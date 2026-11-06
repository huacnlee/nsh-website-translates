---
title: "HoverCard"
description: "Die HoverCard-Komponente: eine Vorschau auf das, worauf ihr Trigger verweist, die angezeigt wird, solange der Mauszeiger auf dem Trigger ruht, und von der App gestaltet wird."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---


# HoverCard

Eine Hover Card zeigt eine Vorschau dessen, worauf ihr Trigger verweist, ohne dass die Seite verlassen wird: das Profil hinter einer Erwähnung, die Seite hinter einem Link, den Kurs hinter einem Ticker. Auf Desktops und in Desktop-Browsern öffnet sie sich, sobald der Mauszeiger `openDelay` (600 ms) auf dem Trigger verweilt hat oder der Tastaturfokus auf den Trigger gelangt. Sie bleibt geöffnet, während sich der Mauszeiger vom Trigger auf die Karte und zurück bewegt, sowie solange der Tastaturfokus auf dem Trigger oder auf einem Link oder Button in der Karte liegt. So lässt sich alles in der Karte gleichermaßen mit Mauszeiger und Tastatur bedienen. Sie schließt sich `closeDelay` (300 ms), nachdem der Mauszeiger beide verlassen hat und der Fokus in keinem von beiden liegt. Escape und ein Klick außerhalb schließen sie sofort. Auf Smartphones und Tablets öffnet und schließt ein Tippen auf den Trigger die Karte, ein Tippen außerhalb schließt sie.

`HoverCard` aus [`nsh/base`](../modules/nsh-base.md) zeichnet selbst nichts: Der Trigger ist Ihr Element, das Popup und sein Inhalt stammen ebenfalls von Ihnen.

```rust tabs
use nsh_base::hover_card;
use nsh_core::prelude::*;

fn mention() -> impl IntoElement {
    hover_card()
        .offset(px(8.0))
        .popup_class("w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg")
        .trigger(text("@ada").text_color(rgb(0x2563eb)))
        .child(text("Ada Lovelace").font_weight(FontWeight::SEMIBOLD))
        .child(text("Writes the first programs for the Analytical Engine."))
}
```

```tsx tabs
import { Text } from "nsh";
import { HoverCard } from "nsh/base";

function Mention() {
  return (
    <HoverCard
      offset={8}
      popupClass="w-72 gap-2 rounded-xl border border-border bg-popover p-4 shadow-lg"
      trigger={<Text class="text-blue-600">@ada</Text>}
    >
      <Text class="font-semibold">Ada Lovelace</Text>
      <Text>Writes the first programs for the Analytical Engine.</Text>
    </HoverCard>
  );
}
```

Der Trigger behält seine eigene Rolle, seine Interaktionen und sein Aussehen: Ein View mit `role="link"` und eigenem `onPress` führt beim Drücken weiterhin dorthin, wohin er auch sonst führt, und die Karte ergänzt ihn um eine Vorschau. Der Inhalt wird bei jedem Öffnen der Karte neu erzeugt und kann daher erst dann laden, was er anzeigt. Auf Smartphones und Tablets, wo ein Tippen die Karte öffnet, teilt der Trigger Screenreadern mit, ob seine Karte geöffnet ist. In einer [Toolbar](./toolbar.md) kann der Trigger eines ihrer Elemente sein; was die Karte zeigt, gehört dagegen nicht dazu: Ihre Buttons und Links behalten ihre eigenen Tab-Stopps, und das `disabled` der Toolbar lässt sie unverändert.

<a id="delays"></a>

## Verzögerungen

`openDelay` verhindert, dass die Karte aufblitzt, wenn der Mauszeiger den Trigger nur auf dem Weg woandershin überquert; `closeDelay` gibt dem Mauszeiger Zeit, die Lücke zwischen Trigger und Karte zu überqueren. Beide Werte sind in Millisekunden angegeben. Mauszeiger und Verzögerungen werden nativ verfolgt, sodass das Verweilen auf einem Trigger und das Bewegen zwischen ihm und der Karte keinen Ihrer Codes ausführen, bis sich die Karte öffnet oder schließt. Ein `openDelay` von `Infinity` überlässt das Öffnen der App (und einem Tippen auf einem Touchscreen); ein `closeDelay` von `Infinity` überlässt das Schließen Escape, einem Klick außerhalb und der App.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## Zustand „geöffnet“

Ohne `open` verwaltet die Karte ihren Zustand selbst, beginnend bei `defaultOpen`. Mit `open` gehört der Zustand der App: Ändern Sie ihn in `onOpenChange({ open, reason })`, das jede Anfrage zum Öffnen oder Schließen samt Grund meldet: `"hover"` (der Mauszeiger), `"focus"` (der Tastaturfokus), `"triggerPress"` (ein Tippen auf einem Touchscreen), `"pressOutside"` oder `"cancel"` (Escape oder Zurück).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## Ein- und Ausblenden

Eine Hover Card erscheint und verschwindet mit Ihren Übergängen, wie es auch ein [Popover](./popover.md) tut. `popupStartingClass` ist das Aussehen des Popups im ersten Frame, und die `transition-*`-Klassen von `popupClass` führen es zu seinem eigentlichen Aussehen. `popupEndingClass` ist sein Aussehen im geschlossenen Zustand: Die Karte bleibt bestehen und nimmt keine Mauszeigereingaben an, solange diese Übergänge laufen, dann verschwindet sie, und `onClose` folgt. Verweilt der Mauszeiger erneut auf dem Trigger, während sie verschwindet, holt er sie zurück. Wenn der Nutzer weniger Bewegung wünscht, erscheint und verschwindet sie sofort.

```tsx
<HoverCard
  popupClass="rounded-xl bg-popover p-4 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  trigger={<Text>@ada</Text>}
>
  <Profile id="ada" />
</HoverCard>
```

Standardmäßig erscheint sie unterhalb des Triggers (`placement`, `align`), auf der gegenüberliegenden Seite, wenn dort kein Platz ist, und bleibt innerhalb des sicheren Bereichs. `onPosition({ placement, bounds, available })` gibt an, wohin sie gelangt ist.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | keiner | Geöffnet, von der App gesteuert. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Anfangs geöffnet, ohne `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | Millisekunden, die der Mauszeiger auf dem Trigger verweilt oder der Fokus auf ihm bleibt, bevor sich die Karte öffnet; `Infinity`: öffnet sich nie von selbst. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | Millisekunden, die der Mauszeiger vom Trigger und von der Karte entfernt ist und der Fokus in keinem von beiden liegt, bevor sich die Karte schließt; `Infinity`: schließt sich nie von selbst. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Die Seite des Triggers, auf der sie erscheint. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Wie sie sich entlang dieser Seite am Trigger ausrichtet. |
| `offset` | `.offset(..)` | `number` | `0` | Der Abstand zwischen Trigger und Karte. |
| `margin` | `.margin(..)` | `number` | `0` | Der Abstand, den sie zu den Rändern des sicheren Bereichs einhält. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups, der Karte, in der der Inhalt liegt. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups im ersten Frame, über sein eigenes gelegt: Seine Übergänge laufen von hier aus. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Popups im geschlossenen Zustand, über sein eigenes gelegt: Es bleibt bestehen, solange seine Übergänge laufen. |
| `trigger` | `.trigger(..)` | `JSX.Element` | keiner | Das, wovon sie eine Vorschau zeigt; sie wird daran ausgerichtet. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt, der bei jedem Öffnen neu erzeugt wird. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Fordert das Öffnen oder Schließen an, samt Grund: `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` oder `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Sie wird angezeigt. |
| `onClose` | `.on_close(\|\| ..)` | Sie ist verschwunden, nach ihrem Ausblenden; auch dann, wenn die App sie geschlossen hat. |
| `onPosition` | `.on_position(\|e\| ..)` | Das Popup wurde platziert: `placement` (die Seite, auf der es erschien), `bounds` (sein Frame), `available` (der verfügbare Platz auf dieser Seite). |

<a id="accessibility"></a>

## Barrierefreiheit

Eine Hover Card ergänzt ihren Trigger: Der Trigger behält seine Rolle und sein Label, und was er beim Drücken öffnet oder auslöst, bleibt unverändert. Tastaturnutzer erhalten die Karte, wenn der Fokus auf dem Trigger ruht, und Escape schließt sie. Die Karte übernimmt selbst keinen Fokus, sodass Tab vom Trigger aus wie bisher weiterspringt. Links und Buttons in der Karte erhalten den Fokus wie überall sonst, und die Karte bleibt geöffnet, solange einer von ihnen ihn hat; was in der Karte wichtig ist, sollte zudem von der Seite aus erreichbar sein, zu der der Trigger führt.
