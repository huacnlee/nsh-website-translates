---
title: "Link"
description: "Die Link-Komponente: Inhalt, der beim Drücken zu einem Ziel führt, einer Seite, einer Website oder einer Route der App, mit Presses, Tastaturaktivierung, dem deaktivierten Zustand und der Link-Rolle für Screenreader, gestaltet von der App."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---


# Link

Ein Link führt den Nutzer irgendwohin: auf eine Webseite, in eine andere App (`mailto:`, `tel:`) oder zu einem Screen der App selbst. Er besitzt das Verhalten: Presses, Return und Leertaste, solange er den Tastaturfokus hat, den deaktivierten Zustand und die Link-Rolle für Screenreader. Das Aussehen gehört der App: Ein `Link` hat keine eigene Farbe, keine Unterstreichung und kein eigenes Label, und seine Children sind das, was angezeigt wird. `href` sagt, wohin er führt; es sind Daten für das Öffnen, niemals Text auf dem Bildschirm.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugt `link()` einen Link mit einem Setter pro Prop (`.href(..)`, `.open_with(..)`), einem Listener pro Event (`.on_open(..)`, `.on_press(..)`), den typisierten Style-Methoden für den Link und `.child(..)` für seinen Inhalt.

<a id="opening"></a>

## Öffnen

Ein Press, ein Klick oder Return bzw. Leertaste auf dem fokussierten Link öffnet seinen `href`:

1. `onOpen({ href })` meldet, wohin er führt.
2. Mit `openWith="system"` (dem Standard) wird eine URL einer anderen App oder Site, also eine mit Schema (`https:`, `mailto:`, `tel:`, ein von einer anderen App registriertes Schema), außerhalb der App geöffnet, so wie [`openUrl`](../modules/nsh.md) sie öffnet: Zuerst übernimmt der Router der einbettenden App, danach das System. Jedes andere `href`, ein Pfad der App (`/orders/42`) oder `#anchor`, wird gemeldet und bleibt bei der App.
3. `onPress()` meldet den Press.

Mit `openWith="app"` ist der `onOpen`-Handler der App die Art, wie der Link sich öffnet: eine eigene Route, eine Seite in einer In-App-Web-View, zuvor eine Bestätigung.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

Das Öffnen einer URL außerhalb der App erfordert die Capability `openUrl`, wenn die App Capabilities in `nsh.json` deklariert (`"openUrl": true` oder `{ "schemes": ["https", "mailto"] }`).

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | keiner | Wohin der Link führt: eine URL oder ein Pfad der App. Wird mit `onOpen` gemeldet, nie angezeigt. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Wer `href` öffnet: Das System öffnet eine URL einer anderen App oder Site; `"app"` überlässt es `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Keine Presses, kein Press-Feedback, kein Tastaturfokus; `disabled:`-Styles gelten, und Screenreader sagen an, dass er abgeblendet ist. |
| `current` | `.current(..)` | `boolean` | `false` | Der Link zur Seite, auf der sich der Nutzer befindet, in einer Navigation oder einem Breadcrumb: Screenreader sagen an, dass es die aktuelle Seite ist. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader vorlesen, wenn der Inhalt zu wenig sagt (ein Icon). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | keiner | Wie weit außerhalb seiner Grenzen Presses noch zählen, in Punkten: eine Zahl für alle Seiten oder die einzelnen Seiten benannt. Wie `hitSlop` einer View. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt: ein Label, ein Icon, alles, was die App anzeigt. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen des Links: Farbe, Unterstreichung, Padding; Texteigenschaften werden an die Texte darin weitergegeben. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Der Style des Links im gedrückten, gehoverten, fokussierten oder deaktivierten Zustand, wie die `<state>:`-Klassen. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Der Link öffnet `href`: Mit `openWith="app"` öffnet der Handler ihn, mit `"system"` erfährt er, was das System öffnen sollte. Es kommt vor `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | Der Link wurde gedrückt: ein Tap, ein Klick oder Return bzw. Leertaste, solange er den Tastaturfokus hat. |

Ein deaktivierter Link meldet nichts, und ein Press darauf erreicht keine drückbare View darum herum.

<a id="states"></a>

## Zustände

Die App stylt jeden Zustand mit Klassen oder Style-Props:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Ein besuchter Link ist Sache der App: Sie merkt sich die geöffneten hrefs und stylt diese Links über ihren eigenen State.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## In Text

Ein `Link` in einem `<Text>` ist eine Inline-Box des Absatzes, wie jede View in einem Text: Er sitzt in der Zeile, behält seine eigenen Zustände, seinen Fokus und seine Rolle und bleibt in einer Zeile. `align-text-bottom` platziert einen Link mit einer Textzeile auf der Baseline des Absatzes:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Ein Link, der mit den Zeilen des Absatzes umbricht, ist ein verschachtelter `<Text>` mit `role="link"` und `onPress` (siehe [Text](./text.md)), so wie [TextView](./text-view.md) die Links eines Dokuments zeichnet.

<a id="a-small-target-with-hitslop"></a>

## Ein kleines Ziel mit hitSlop

Ein Link kann kleiner als ein Finger sein: ein Icon, ein kurzes Wort. `hitSlop` lässt Presses zählen, die in der Nähe landen, in Punkten über jede Seite hinaus, ohne sein Layout oder sein Aussehen zu ändern: eine Zahl für alle Seiten oder die einzelnen Seiten benannt (`{ top: 8, bottom: 8 }`), so wie [`hitSlop` einer View](./index.md#presses-and-feedback) sie annimmt.

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Barrierefreiheit

- Ein Link ist für Screenreader ein einzelnes Element mit der Rolle `"link"`; sein Label ist der Text seiner Children oder `accessibilityLabel`. `href` bleibt ein Datum: Screenreader sagen das Label an.
- `current` wird als aktuelle Seite angesagt (ARIAs `aria-current="page"`), und `disabled` so, wie die Plattform ein abgeblendetes Element ansagt.
- Unter macOS und im Web ist ein Link ein Haltepunkt des Tastaturfokus: Tab erreicht ihn, Return und Leertaste öffnen ihn, und `focus:`-Styles zeigen, wo der Fokus liegt.

Siehe [Accessibility](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Press ist ein Tap, der auf dem Link endet.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Ein Press ist ein Klick. Unter macOS und im Web öffnen außerdem Return und Leertaste den Link, der den Tastaturfokus hat.
- Das Web rendert einen Link als Element mit `role="link"`.
- Jede Plattform zeichnet, was die App stylt.
