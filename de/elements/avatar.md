---
title: "Avatar"
description: "Die Komponenten Avatar und AvatarGroup: das Bild einer Person oder ein Fallback, während es lädt, wenn das Laden fehlschlägt und wenn keines vorhanden ist, wobei der Ladezustand nativ ausgeführt wird; sowie eine Reihe von Avataren, die die ersten paar anzeigt und für die übrigen steht."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---


# Avatar

Ein Avatar zeigt das Bild einer Person: ein Teammitglied, den Verfasser eines Kommentars, das Konto in einer Kopfzeile. Solange das Bild lädt, wenn es fehlschlägt und wenn es keines gibt, zeigt er einen Fallback: die Initialen aus dem `name` der Person oder den eigenen Inhalt der App (ein Icon). Er verwaltet den Ladezustand des Bildes, nativ aus den load- und error-Events des Bildes und ohne JavaScript, und liefert den Screenreadern ein Bild, das mit dem Namen der Person beschriftet ist. Das Aussehen bestimmt die App: Ein `Avatar` hat keine eigene Größe, Form, Farben oder Schrift. Eine `AvatarGroup` zeigt die ersten Avatare einer Reihe und einen Überlauf, der für die übrigen steht ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` und `AvatarGroup` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. In Rust erzeugen `avatar()` und `avatar_group()` sie mit je einem Setter pro Prop (`.src(..)`, `.fallback_delay(..)`), den typisierten Style-Methoden für den Avatar selbst und `.child(..)` für das, was über dem Bild liegt.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | keiner | Das Bild, so wie `src` von [`<Image>`](./image.md) es entgegennimmt: eine URL, eine `asset:/`- oder `data:`-URI, eine `blob:`-URL (ein vom Nutzer gewähltes Foto: `URL.createObjectURL(file)`) oder ein importiertes Bild. Es wird angezeigt, sobald es geladen ist; ein leerer String bedeutet kein Bild. |
| `name` | `.name(..)` | `string` | keiner | Der Name der Person: was Screenreader vorlesen, und die Initialen, die der Fallback zeigt, wenn die App kein `fallback` übergibt. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | Was Screenreader vorlesen, vorrangig vor `name`. `""` macht den Avatar dekorativ, sodass er vor Screenreadern verborgen ist. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | Wie lange der Fallback wartet, während das Bild lädt, damit ein schnell geladenes Bild erscheint, ohne dass der Fallback zuvor kurz aufblitzt. `Infinity`: kein Fallback während des Ladens, nur wenn das Bild fehlschlägt oder fehlt. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Das Bild: Einpassung, Radius und Bewegung. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Fallback: Hintergrund, Textfarbe und Größe sowie die Ausrichtung seines Inhalts. |
| `fallback` | `.fallback(..)` | `JSX.Element` | die Initialen | Der Inhalt des Fallbacks anstelle der Initialen: ein Icon, ein Platzhalter für jemanden ohne Namen. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Was über dem Bild erscheint: ein Präsenzpunkt, ein Badge. Screenreader hören das Label des Avatars, nicht diese Elemente (siehe [Accessibility](#accessibility)). |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Avatar selbst: Größe und Form. |

| Event | Rust | Payload | Beschreibung |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | Der Status des Bildes hat sich geändert: `"idle"` (kein `src`), `"loading"`, `"loaded"` oder `"error"`. |

## Parts

| Part | Enthalten in | Gestaltet mit |
|---|---|---|
| Der Avatar | | `class`, `style` |
| Der Fallback | dem Avatar, als Erstes, so groß wie dieser; vorhanden, solange das Bild lädt (nach `fallbackDelay`), fehlschlägt oder fehlt | `fallbackClass`, `fallbackStyle`; sein Inhalt sind die Initialen oder `fallback` |
| Das Bild | dem Avatar, über dem Fallback, ihn ausfüllend | `imageClass`, `imageStyle` |
| Der Inhalt der App | dem Avatar, als Letztes | seine eigenen Elemente (`children`) |

Gib dem Avatar seine Größe (`class="size-10"`): Fallback und Bild füllen ihn aus, sodass das Verschwinden des Fallbacks kein neues Layout auslöst. Das Bild wird von Anfang an layoutet, zunächst transparent, und wird deckend, sobald es geladen ist; der Fallback verschwindet dann. Ein `transition-opacity` in `imageClass` blendet es ein (bei reduzierter Bewegung erscheint es sofort). Runde das Bild und den Fallback ab (jeweils mit `rounded-full`), statt den Avatar zu beschneiden, damit ein Präsenzpunkt an seinem Rand (`absolute bottom-0 right-0`) vollständig sichtbar bleibt.

Die Initialen sind die ersten Buchstaben der ersten zwei Wörter des Namens in Großbuchstaben ("Ada Lovelace" ergibt "AL"); bei einem einzelnen Wort sind es dessen ersten zwei Buchstaben ("huacnlee" ergibt "HU"), und bei einem Namen in einer Schrift ohne Groß- und Kleinschreibung das erste Zeichen ("王小明" ergibt "王").

## Groups

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | Höchstens so viele ihrer Avatare werden angezeigt, und zwar die ersten; für die übrigen werden keine Views erzeugt. |
| `total` | `.total(..)` | `number` | die Anzahl der Kinder | Für wie viele Personen die Gruppe steht, wenn die App nur die ersten von ihnen übergibt. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader über die Gruppe vorlesen. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Überlauf-Part, nach den angezeigten Avataren. |
| `overflow` | `.overflow(..)` | `JSX.Element` | keiner | Was für die nicht angezeigten Personen steht ("+5", "⋯"); vorhanden, solange die Gruppe mehr Personen umfasst als Avatare angezeigt werden. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | keiner | Was Screenreader anstelle des Inhalts des Überlaufs vorlesen: "5 weitere Personen" für ein "+5". |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die Avatare, in der angegebenen Reihenfolge. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Die Reihe: Richtung (`flex-row`) und Abstand. |

Die Überlappung, die Ringe und die Form des Überlaufs bestimmt die App: Ein negativer Margin an jedem Avatar nach dem ersten (`-ml-2`) staffelt sie übereinander, und ein Ring in der Farbe des Hintergrunds trennt sie voneinander. Übergib bei einer langen Liste nur die ersten `limit` Personen und `total`: Es werden nur die angezeigten Avatare erzeugt. Die Anzahl, für die der Überlauf steht, ist `total` abzüglich der angezeigten Avatare; deren Anzahl ist der kleinere Wert aus der Zahl der Kinder und `limit`: `total={8}` mit zwei Kindern zeigt zwei Avatare und "+6".

## Accessibility

- Ein Avatar ist für Screenreader ein einzelnes Bild, beschriftet mit `accessibilityLabel` oder `name`: Der Name wird einmal vorgelesen. Der Fallback und das Bild sind vor ihnen verborgen, sodass die Initialen nicht gesondert vorgelesen werden. Ein Avatar ohne beides oder mit `accessibilityLabel=""` ist dekorativ und vor Screenreadern verborgen, wie es sich für einen Avatar neben dem Namen, den er zeigt, gehört.
- Eine Gruppe ist eine Gruppe, beschriftet mit ihrem `accessibilityLabel` ("Ada, Grace und 5 weitere"); die angezeigten Avatare sind Bilder darin. Der Überlauf wird als sein Inhalt vorgelesen ("+5") oder als `overflowAccessibilityLabel` ("5 weitere Personen"), wenn die App eines angibt: NSH schreibt keine eigenen Texte.
- Ein Avatar ist für Screenreader ein einzelnes Element, daher wird nicht gesondert vorgelesen, was seine Kinder zeigen, und ein Button oder Link darin ist unter iOS überhaupt nicht erreichbar. Sage in `accessibilityLabel`, was ein Präsenzpunkt oder ein Badge bedeutet ("Ada Lovelace, online"), und platziere alles, was gedrückt werden kann, neben dem Avatar, nicht darin.
- Keiner von beiden nimmt Eingaben per Tippen oder Tastaturfokus an: Setze einen Avatar in einen `Button`, damit er bedienbar wird.

Siehe [Accessibility](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

## Platform notes

- Jede Plattform lädt das Bild mit ihrem eigenen Image-Loader und eigenen Caches (siehe [Image](./image.md)); dessen load- und error-Events ändern den Zustand des Avatars in Rust, sodass ein ladendes oder fehlgeschlagenes Bild das Bild und den Fallback verändert und sonst nichts.
- Das Bild beginnt zu laden, sobald es einen Frame hat, und bleibt daher auch im transparenten Zustand im Layout.
