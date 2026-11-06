---
title: "Link"
description: "Il componente Link: contenuto che porta altrove quando viene premuto, una pagina, un sito o una route dell'app, con pressioni, attivazione da tastiera, stato disabilitato e ruolo link per gli screen reader, con stile definito dall'app."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Un link porta l'utente da qualche parte: una pagina web, un'altra app (`mailto:`, `tel:`) o una schermata dell'app stessa. Gestisce il comportamento: pressioni, Return e Spazio quando ha il focus della tastiera, lo stato disabilitato e il ruolo link per gli screen reader. L'aspetto spetta all'app: un `Link` non ha colore, sottolineatura o etichetta propri, e ciò che si vede sono i suoi figli. `href` dice dove porta; è un dato per l'apertura, mai testo a schermo.

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

`Link` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `link()` ne crea uno con un setter per ogni prop (`.href(..)`, `.open_with(..)`), un listener per ogni evento (`.on_open(..)`, `.on_press(..)`), i metodi di stile tipizzati per il link e `.child(..)` per il suo contenuto.

<a id="opening"></a>

## Apertura

Una pressione, un clic, oppure Return o Spazio sul link con il focus apre il suo `href`:

1. `onOpen({ href })` riporta dove porta il link.
2. Con `openWith="system"` (il default), un URL di un'altra app o di un altro sito, cioè con uno schema (`https:`, `mailto:`,
   `tel:`, uno schema registrato da un'altra app), si apre fuori dall'app, come lo apre [`openUrl`](../modules/nsh.md): prima lo prende il
   router dell'app che ospita, poi il sistema. Qualsiasi altro `href`, un percorso dell'app (`/orders/42`)
   o `#anchor`, viene riportato e resta all'app.
3. `onPress()` riporta la pressione.

Con `openWith="app"`, l'handler `onOpen` dell'app è il modo in cui il link si apre: una route propria, una pagina in una web
view in-app, prima una conferma.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

Aprire un URL fuori dall'app richiede la capability `openUrl` quando l'app dichiara le capability in `nsh.json`
(`"openUrl": true` o `{ "schemes": ["https", "mailto"] }`).

## Props

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | nessuno | Dove porta il link: un URL o un percorso dell'app. Riportato con `onOpen`, mai mostrato. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Chi apre `href`: il sistema apre un URL di un'altra app o di un altro sito; `"app"` lo lascia a `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione, nessun feedback di pressione, nessun focus da tastiera; si applicano gli stili `disabled:` e gli screen reader dicono che è attenuato. |
| `current` | `.current(..)` | `boolean` | `false` | Il link alla pagina in cui si trova l'utente, in una navigazione o in un breadcrumb: gli screen reader dicono che è la pagina corrente. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader, quando il contenuto dice troppo poco (un'icona). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Di quanto fuori dai suoi limiti le pressioni contano ancora, in punti: un numero per tutti i lati, oppure i lati indicati per nome. Come `hitSlop` di una view. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto: un'etichetta, un'icona, qualsiasi cosa mostri l'app. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del link: colore, sottolineatura, padding; le proprietà del testo passano ai testi al suo interno. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del link quando è premuto, in hover, con il focus o disabilitato, come le classi `<state>:`. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Il link apre `href`: con `openWith="app"` lo apre l'handler, con `"system"` l'handler sente cosa è stato chiesto al sistema di aprire. Arriva prima di `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | Il link è stato premuto: un tap, un clic, oppure Return o Spazio quando ha il focus della tastiera. |

Un link disabilitato non riporta nulla, e una pressione su di esso non raggiunge nessuna view pressable attorno.

<a id="states"></a>

## Stati

L'app stila ogni stato con classi o style props:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Ricordare un link visitato spetta all'app: conserva gli href che ha aperto e stila quei link in base al proprio stato.

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

## Dentro il testo

Un `Link` dentro un `<Text>` è un box inline del paragrafo, come ogni view dentro un testo: sta nella riga, mantiene i propri stati, focus e ruolo, e resta su una sola riga. `align-text-bottom` posiziona un link con una riga di testo sulla baseline del paragrafo:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Un link che va a capo con le righe del paragrafo è un `<Text>` annidato con `role="link"` e `onPress` (vedi
[Text](./text.md)), come [TextView](./text-view.md) disegna i link di un documento.

<a id="a-small-target-with-hitslop"></a>

## Un bersaglio piccolo con hitSlop

Un link può essere più piccolo di un dito: un'icona, una parola breve. `hitSlop` fa contare le pressioni che cadono vicino al link, in punti oltre ogni lato, senza cambiare il suo layout o il suo aspetto: un numero per tutti i lati, oppure i lati indicati per nome
(`{ top: 8, bottom: 8 }`), come li accetta [`hitSlop` di una view](./index.md#presses-and-feedback).

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Accessibilità

- Un link è un unico elemento per gli screen reader, con il ruolo `"link"`; la sua etichetta è il testo dei suoi figli, oppure
  `accessibilityLabel`. `href` resta un dato: gli screen reader dicono l'etichetta.
- `current` viene detto come pagina corrente (`aria-current="page"` di ARIA), e `disabled` come la piattaforma dice un elemento
  attenuato.
- Su macOS e sul web un link è una tappa del focus da tastiera: Tab lo raggiunge, Return e Spazio lo aprono, e gli stili `focus:`
  mostrano dove si trova il focus.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tap che termina sul link.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, anche Return e Spazio
  aprono il link che ha il focus della tastiera.
- Il web rende un link come un elemento con `role="link"`.
- Ogni piattaforma disegna ciò che l'app stila.
