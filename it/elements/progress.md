---
title: "Progress"
description: "Il componente Progress: una barra di avanzamento lineare che gestisce il proprio ruolo, l'intervallo e il valore per gli screen reader, e imposta la larghezza dell'indicatore in base al valore, con una traccia e un indicatore che l'app può personalizzare nello stile."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

Una progress bar mostra a che punto è un'attività di cui si conosce l'estensione (un download, un upload, un passaggio di una configurazione), oppure, mentre
`indeterminate`, che è in corso un'attività di estensione sconosciuta. Gestisce ciò che ricevono gli screen reader, il ruolo di progress bar
con l'intervallo da 0 a 100 e il valore, e la larghezza dell'indicatore: `value` percento di quella della traccia. L'aspetto è
quello dell'app: un `Progress` non ha colori, dimensioni, raggi, movimento né etichetta propri. È composto da una traccia con un indicatore
al suo interno, poi dai suoi figli (un'etichetta, il valore come testo), e l'app stila ogni parte.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore appartiene all'app: la
progress bar mostra il `value` che l'app le passa, limitato tra 0 e 100. In Rust, `progress()` ne crea una con un setter per ogni prop
(`.value(..)`, `.indicator_style(..)`), i metodi di stile tipizzati per la progress bar stessa e `.child(..)` per la sua
etichetta.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | A che punto è l'attività, come percentuale da 0 a 100 (fuori dall'intervallo, viene usato l'estremo più vicino). L'indicatore occupa quella quota della larghezza della traccia, e gli screen reader la leggono. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | L'estensione dell'attività è sconosciuta: gli screen reader sentono una progress bar senza valore, e la larghezza dell'indicatore è decisa dall'app (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: cosa è in corso, quando i suoi figli non hanno un testo che lo dica. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | La traccia, la parte che l'indicatore riempie. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore, all'interno della traccia: altezza, colore e movimento. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto dopo la traccia: un'etichetta o il valore come testo, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La progress bar stessa: la colonna (o riga) attorno alla traccia e all'etichetta. |

<a id="parts"></a>

## Parti

| Parte | Contenuta in | Stilata con |
|---|---|---|
| La progress bar | | `class`, `style` |
| La traccia | la progress bar, per prima | `trackClass`, `trackStyle` |
| L'indicatore | la traccia | `indicatorClass`, `indicatorStyle`; la sua larghezza è `value` percento di quella della traccia |
| L'etichetta | la progress bar, dopo la traccia | i propri elementi (`children`) |

L'indicatore parte dal bordo iniziale della traccia; `overflow-hidden` e un raggio sulla traccia ne arrotondano l'estremità insieme a quella
della traccia. Una classe `w-*` o un `width` in `indicatorStyle` prende il posto della larghezza del valore, ed è così che una
barra indeterminata ottiene la propria.

<a id="indeterminate"></a>

## Indeterminata

Finché l'estensione è sconosciuta, imposta `indeterminate` e assegna all'indicatore una larghezza e un movimento propri dell'app. Il movimento è
una scelta dell'app, e `motion-reduce:` lo mantiene fermo per le persone che chiedono meno movimento:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## Accessibilità

- Una progress bar è un unico elemento per gli screen reader, con il ruolo `"progressbar"`, l'intervallo da 0 a 100 e il suo valore
  (VoiceOver e TalkBack lo leggono come percentuale); la traccia e l'indicatore ne sono parti. La sua etichetta è il testo
  dei suoi figli; fornisci `accessibilityLabel` quando non ne ha.
- Finché `indeterminate`, mantiene il ruolo e l'intervallo e non ha valore (nel browser: `aria-valuenow` viene omesso,
  come previsto da ARIA per una progress bar indeterminata).
- Non accetta pressioni né focus da tastiera: segnala soltanto, e i controlli che avviano o fermano l'attività sono dell'app.

Consulta [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma disegna ciò che l'app stila; la larghezza dell'indicatore segue subito `value`, e una modifica viene animata
  quando l'app la anima.
- Screen reader: VoiceOver (iOS, macOS) legge il valore come percentuale e la barra come aggiornata di frequente;
  TalkBack, UI Automation (Windows), l'accessibilità di GTK (Linux) e il browser (`aria-valuenow`) ricevono l'intervallo e il
  valore.
