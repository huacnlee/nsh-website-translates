---
title: "Progress"
description: "Die Progress-Komponente: ein linearer Fortschrittsbalken, der seine Rolle, seinen Wertebereich und seinen Wert für Screenreader sowie die Breite des Indikators anhand des Wertes verwaltet, mit einer Spur und einem Indikator, die von der App gestaltet werden."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---


# Progress

Ein Fortschrittsbalken zeigt, wie weit eine Aufgabe mit bekanntem Umfang ist (ein Download, ein Upload, ein Schritt einer Einrichtung) oder, solange `indeterminate`, dass eine Aufgabe mit unbekanntem Umfang läuft. Er bestimmt, was Screenreader erhalten, nämlich die Rolle Progress Bar mit dem Bereich 0 bis 100 und dem Wert, sowie die Breite des Indikators: `value` Prozent der Breite des Tracks. Das Aussehen liegt bei der App: `Progress` hat keine eigenen Farben, Größen, Radien, Animationen oder Beschriftungen. Er besteht aus einem Track mit einem Indikator darin und danach seinen Children (eine Beschriftung, der Wert als Text), und die App gestaltet jeden Teil.

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

`Progress` stammt aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der Wert gehört der App: Der Fortschrittsbalken zeigt den `value`, den die App übergibt, begrenzt auf 0 bis 100. In Rust erzeugt `progress()` einen Fortschrittsbalken mit einem Setter pro Prop (`.value(..)`, `.indicator_style(..)`), den typisierten Style-Methoden für den Fortschrittsbalken selbst und `.child(..)` für seine Beschriftung.

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | Wie weit die Aufgabe ist, als Prozentwert von 0 bis 100 (außerhalb des Bereichs gilt das nächstliegende Ende). Der Indikator nimmt diesen Anteil der Breite des Tracks ein, und Screenreader sagen ihn an. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Der Umfang der Aufgabe ist unbekannt: Screenreader hören einen Fortschrittsbalken ohne Wert, und die Breite des Indikators bestimmt die App (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was Screenreader sagen: was in Arbeit ist, wenn die Children keinen Text enthalten, der es sagt. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Track, der Teil, den der Indikator füllt. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator im Track: seine Höhe, Farbe und Animation. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt nach dem Track: eine Beschriftung oder der Wert als Text, den Screenreader ansagen. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Fortschrittsbalken selbst: die Spalte (oder Zeile) um den Track und die Beschriftung. |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit |
|---|---|---|
| Der Fortschrittsbalken | | `class`, `style` |
| Der Track | dem Fortschrittsbalken, als Erstes | `trackClass`, `trackStyle` |
| Der Indikator | dem Track | `indicatorClass`, `indicatorStyle`; seine Breite beträgt `value` Prozent der des Tracks |
| Die Beschriftung | dem Fortschrittsbalken, nach dem Track | eigenen Elementen (`children`) |

Der Indikator beginnt an der vorderen Kante des Tracks; `overflow-hidden` und ein Radius am Track runden sein Ende zusammen mit dem des Tracks ab. Eine `w-*`-Klasse oder ein `width` in `indicatorStyle` ersetzt die Breite des Werts, und so erhält ein unbestimmter Balken seine eigene.

<a id="indeterminate"></a>

## Unbestimmt

Solange der Umfang unbekannt ist, setze `indeterminate` und gib dem Indikator eine Breite und eine Animation der App. Die Animation ist Sache der App, und `motion-reduce:` hält sie für Personen still, die weniger Bewegung wünschen:

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

## Barrierefreiheit

- Ein Fortschrittsbalken ist für Screenreader ein einzelnes Element mit der Rolle `"progressbar"`, dem Bereich 0 bis 100 und seinem Wert (VoiceOver und TalkBack sagen ihn als Prozentwert an); der Track und der Indikator sind Teile davon. Seine Beschriftung ist der Text seiner Children; gib `accessibilityLabel` an, wenn er keinen hat.
- Solange `indeterminate`, behält er die Rolle und den Bereich und hat keinen Wert (im Browser entfällt `aria-valuenow`, so wie ARIA es für einen unbestimmten Fortschrittsbalken vorsieht).
- Er nimmt keine Eingaben per Tippen oder Klicken und keinen Tastaturfokus an: Er meldet nur, und die Steuerelemente, die die Aufgabe starten oder stoppen, sind Sache der App.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Beschriftungen, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- Jede Plattform zeichnet, was die App gestaltet; die Breite des Indikators folgt `value` sofort, und eine Änderung wird animiert, wenn die App sie animiert.
- Screenreader: VoiceOver (iOS, macOS) hört den Wert als Prozentwert und den Balken als sich häufig aktualisierend; TalkBack, UI Automation (Windows), die Barrierefreiheit von GTK (Linux) und der Browser (`aria-valuenow`) erhalten den Bereich und den Wert.
