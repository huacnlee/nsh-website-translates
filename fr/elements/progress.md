---
title: "Progress"
description: "Le composant Progress : une barre de progression linéaire qui gère son rôle, sa plage et sa valeur pour les lecteurs d'écran, ainsi que la largeur de l'indicateur en fonction de la valeur, avec une piste et un indicateur que l'application personnalise."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---

# Progress

Une barre de progression indique où en est une tâche dont l'étendue est connue (un téléchargement, un envoi, une étape d'installation) ou, tant que `indeterminate`, qu'une tâche d'étendue inconnue est en cours. Elle gère ce que reçoivent les lecteurs d'écran, à savoir le rôle de barre de progression avec la plage de 0 à 100 et la valeur, ainsi que la largeur de l'indicateur : `value` pour cent de celle de la piste. L'apparence revient à l'app : un `Progress` n'a ni couleurs, ni tailles, ni rayons, ni animation, ni libellé propres. Il se compose d'une piste contenant un indicateur, puis de ses enfants (un libellé, la valeur sous forme de texte), et l'app stylise chaque partie.

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

`Progress` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : la barre de progression affiche le `value` que l'app lui transmet, borné entre 0 et 100. En Rust, `progress()` en crée une avec un setter par prop (`.value(..)`, `.indicator_style(..)`), les méthodes de style typées pour la barre de progression elle-même et `.child(..)` pour son libellé.

## Props

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | Où en est la tâche, en pourcentage de 0 à 100 (hors de la plage, on retient l'extrémité la plus proche). L'indicateur occupe cette part de la largeur de la piste, et les lecteurs d'écran l'annoncent. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | L'étendue de la tâche est inconnue : les lecteurs d'écran entendent une barre de progression sans valeur, et la largeur de l'indicateur revient à l'app (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Ce que disent les lecteurs d'écran : ce qui est en cours, lorsque les enfants n'ont pas de texte qui le dise. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucune | La piste, la partie que remplit l'indicateur. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucune | L'indicateur, à l'intérieur de la piste : sa hauteur, sa couleur et son animation. |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le contenu après la piste : un libellé ou la valeur sous forme de texte, que les lecteurs d'écran annoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La barre de progression elle-même : la colonne (ou la ligne) autour de la piste et du libellé. |

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylisée avec |
|---|---|---|
| La barre de progression | | `class`, `style` |
| La piste | la barre de progression, en premier | `trackClass`, `trackStyle` |
| L'indicateur | la piste | `indicatorClass`, `indicatorStyle` ; sa largeur est de `value` pour cent de celle de la piste |
| Le libellé | la barre de progression, après la piste | ses propres éléments (`children`) |

L'indicateur part du bord d'attaque de la piste ; `overflow-hidden` et un rayon sur la piste arrondissent son extrémité avec celle de la piste. Une classe `w-*` ou un `width` dans `indicatorStyle` remplace la largeur issue de la valeur, ce qui permet à une barre indéterminée d'avoir la sienne.

<a id="indeterminate"></a>

## Indéterminé

Tant que l'étendue est inconnue, définissez `indeterminate` et donnez à l'indicateur une largeur et une animation propres à l'app. L'animation est un choix de l'app, et `motion-reduce:` la fige pour les personnes qui demandent moins d'animation :

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

## Accessibilité

- Une barre de progression est un seul élément pour les lecteurs d'écran, avec le rôle `"progressbar"`, la plage de 0 à 100 et sa valeur (VoiceOver et TalkBack l'annoncent sous forme de pourcentage) ; la piste et l'indicateur en font partie. Son libellé est le texte de ses enfants ; renseignez `accessibilityLabel` lorsqu'elle n'en a pas.
- Tant que `indeterminate`, elle conserve le rôle et la plage, mais n'a pas de valeur (dans le navigateur : `aria-valuenow` est omis, comme le prévoit ARIA pour une barre de progression indéterminée).
- Elle ne reçoit ni appuis ni focus clavier : elle informe, et les contrôles qui démarrent ou arrêtent la tâche relèvent de l'app.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Chaque plateforme dessine ce que l'app stylise ; la largeur de l'indicateur suit `value` immédiatement, et un changement s'anime lorsque l'app l'anime.
- Lecteurs d'écran : VoiceOver (iOS, macOS) entend la valeur sous forme de pourcentage et la barre comme se mettant à jour fréquemment ; TalkBack, UI Automation (Windows), l'accessibilité de GTK (Linux) et le navigateur (`aria-valuenow`) reçoivent la plage et la valeur.
