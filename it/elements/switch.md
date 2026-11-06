---
title: "Switch"
description: "Il componente Switch: un controllo on / off che gestisce le pressioni, l'attivazione da tastiera, lo stato disabilitato e il proprio ruolo e valore per gli screen reader, con una track e un thumb che l'app può personalizzare nello stile."
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

Uno switch attiva o disattiva un'impostazione, e la modifica ha effetto immediato. Gestisce il comportamento: pressioni, attivazione da tastiera, stato disabilitato, il ruolo di switch e il suo valore per gli screen reader. L'aspetto spetta all'app: un `Switch` non ha colori, dimensioni, animazioni né etichetta propri. È composto da una traccia (track) con un cursore (thumb) al suo interno, poi dai suoi figli (un'etichetta), e l'app stilizza ogni parte, con classi `checked:` e `disabled:` che seguono lo switch.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore è dell'app: una pressione comunica il valore successivo con `onChange`, e lo switch mostra il `checked` che l'app restituisce. In Rust, `switch()` ne crea uno con un setter per ogni prop (`.checked(..)`, `.track_style(..)`), un listener per ogni evento (`.on_change(..)`), i metodi di stile tipizzati per lo switch stesso e `.child(..)` per la sua etichetta; lo stile di una parte accetta i metodi di stato (`.checked(..)`, `.disabled_style(..)`) che seguono lo switch.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Attivo o disattivo. Una pressione comunica il valore successivo con `onChange`; lo switch mostra il valore che l'app restituisce. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback alla pressione; gli stili `disabled:` si applicano allo switch e alle sue parti, e gli screen reader dicono che è attenuato. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile dello switch quando è `checked` e non disabilitato, come classi `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: che cosa attiva lo switch, quando i suoi figli non contengono testo che lo dica. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La traccia, la parte lungo cui si muove il cursore. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il cursore, all'interno della traccia. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Quanto oltre i suoi limiti le pressioni vengono ancora conteggiate, in punti: un solo numero per tutti i lati, oppure i lati indicati per nome. Come `hitSlop` di una view. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto dopo la traccia: un'etichetta, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Lo switch stesso: la riga attorno alla traccia e all'etichetta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile dello switch quando è premuto, in hover, con il focus o disabilitato, come classi `<state>:`. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Lo switch è stato premuto: un tocco, un clic, Spazio o Invio mentre ha il focus della tastiera, oppure l'attivazione da parte di uno screen reader. Comunica come `checked` il valore richiesto dallo switch, l'opposto del `checked` che ha. |

Uno switch disabilitato non comunica nulla.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Lo switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (oppure `checkedStyle`, `disabledStyle`, ...) |
| La traccia | lo switch, per prima | `trackClass`, `trackStyle` | `checked:`, `disabled:` seguono lo switch |
| Il cursore | la traccia | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` seguono lo switch |
| L'etichetta | lo switch, dopo la traccia | i propri elementi (`children`) | `group-checked:` e le altre varianti `group-*:` con `group` sul `class` dello switch |

Il cursore si muove tramite i propri stili `checked:`: una traslazione (`checked:translate-x-5`), oppure un margine o l'allineamento della traccia (`checked:justify-end` sulla traccia). Una classe `transition-*` anima il cambiamento in modo nativo. Per collocare l'etichetta prima della traccia, inverti la riga: `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## Disabilitato

Uno switch disabilitato non accetta pressioni, e gli screen reader lo annunciano come attenuato. Le sue classi `disabled:` e quelle della traccia e del cursore si applicano, sovrascrivendo quelle `checked:`:

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## Un'area di tocco piccola con hitSlop

Uno switch senza etichetta accanto può essere più piccolo di un dito. `hitSlop` fa sì che le pressioni che cadono vicino ad esso vengano conteggiate, in punti oltre ogni lato, senza cambiarne il layout né l'aspetto: un solo numero per tutti i lati, oppure i lati indicati per nome (`{ top: 8, bottom: 8 }`), come li accetta [`hitSlop` di una view](./index.md#presses-and-feedback).

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## Accessibilità

- Uno switch è un unico elemento per gli screen reader, con il ruolo `"switch"` e il suo valore (attivo o disattivo); la traccia e il cursore ne sono parti. La sua etichetta è il testo dei suoi figli; usa `accessibilityLabel` quando non ne ha.
- `disabled` viene annunciato nel modo in cui lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità del browser).
- Su macOS e sul web uno switch è una tappa del focus da tastiera: Tab lo raggiunge, Spazio e Invio lo commutano, e gli stili `focus:` mostrano dove si trova il focus.

Consulta [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tocco che termina sullo switch, etichetta inclusa.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, Spazio e Invio commutano anche lo switch che ha il focus della tastiera.
- Ogni piattaforma disegna ciò che l'app stilizza; il cursore si muove come indicano gli stili e le transizioni dell'app.
