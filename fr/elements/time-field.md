---
title: "TimeField"
description: "Le composant TimeField : une heure de la journée modifiée segment par segment, heures, minutes et secondes, avec le clavier ou le pavé numérique d'un téléphone, stylisé par l'application."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---

# TimeField

Un champ d'heure modifie une heure de la journée, un segment à la fois : l'heure, la minute, avec `precision="second"` la seconde, et avec `hourCycle="h12"` AM ou PM. L'heure d'un rappel, le début d'une réunion, les horaires d'ouverture d'un commerce. C'est l'heure placée sous le calendrier de [DatePicker](./date-picker.md) avec `timePrecision`, mais seule dans la page.

Le champ gère le comportement : l'heure (celle de l'application, ou la sienne), le segment que les touches modifient, la saisie et l'incrémentation des chiffres, et ce qu'entendent les lecteurs d'écran. L'apparence revient à l'application : elle style les segments et le `:` qui les sépare, ou dessine elle-même les segments.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `time_field()` en crée un avec un setter par prop (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) et un listener par événement (`.on_change(..)`). Son heure est un `TimeOfDay`, un `chrono::NaiveTime`.

<a id="value"></a>

## Valeur

La valeur est une heure de la journée sur une horloge de 24 heures, comme celle d'un `<input type="time">` HTML : `"HH:MM"`, ou `"HH:MM:SS"` avec `precision="second"`, quel que soit le `hourCycle` affiché par le champ. Avec `value`, l'application en est propriétaire : le champ l'affiche et signale chaque modification avec `onChange({ value })` ; l'application définit `value` pour la suivre. Si elle est omise, le champ conserve sa propre heure, issue de `defaultValue` au départ (par défaut `00:00`).

`precision` est la plus petite unité que le champ modifie, `"minute"` (par défaut) ou `"second"`. `hourCycle` indique comment il compte les heures : `"h23"` (par défaut) de 00 à 23, `"h12"` de 12 à 11 avec un segment AM/PM après les nombres.

<a id="editing"></a>

## Édition

Un segment est sélectionné ; les touches le modifient, comme dans le champ d'heure de `gpui-base` :

- Haut et Bas incrémentent ou décrémentent le segment d'une unité et reviennent au début (59 vers 00) sans propager de retenue au segment suivant.
- Les chiffres s'y saisissent, deux à la fois : un chiffre qui ne peut pas commencer une valeur plus longue (un `7` dans l'heure) termine le segment et passe au suivant.
- `a` et `p` définissent AM et PM.
- Retour arrière et Suppr réinitialisent le segment.

Un appui sur un segment le sélectionne. Un appui sur le segment AM/PM sélectionné le bascule, puisque les téléphones n'ont pas de touches `a` et `p`. Les touches vont à un champ de texte natif placé derrière les segments, transparent, comme celui d'un [OtpInput](./otp-input.md) : sur téléphones et tablettes, il fait apparaître le pavé numérique.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | aucun | L'heure, gérée par l'application. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | L'heure au départ, sans `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | La plus petite unité modifiée. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Comment il compte les heures ; `"h12"` ajoute un segment AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ni focus ni édition ; les styles `disabled:` s'appliquent au champ et à ses segments. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Le nom que les lecteurs d'écran donnent au champ. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | Chaque segment : `focus:` sur le segment sélectionné tant que le champ a le focus, `disabled:` avec le champ ; avec `group`, son contenu les suit (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | Chaque `:` entre les nombres. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | aucun | Le contenu d'un segment, dessiné par l'application à partir de ce qu'il affiche ; sinon, son libellé. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le champ, autour de ses segments (une ligne). |

`renderSegment` reçoit un `TimeFieldSegmentEntry` : `segment` (`"hour"`, `"minute"`, `"second"` ou `"period"`), `value` (l'heure sur l'horloge du champ, la minute ou la seconde ; `0` pour AM et `1` pour PM) et `label` (deux chiffres, ou `AM` / `PM`). Il ne reçoit jamais l'état du segment : le segment est `focus:` tant que les touches le modifient et `disabled:` avec le champ, et avec `group` dans `segmentClass`, son contenu les suit avec `group-focus:` et `group-disabled:`. Ainsi, un segment n'est redessiné que lorsque sa valeur change ; le déplacement entre les segments et l'arrivée ou le départ du focus ne dessinent rien :

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utilisateur a modifié l'heure : `{ value }`. Définissez `value` pour la suivre. Un `value` transmis par l'application n'est jamais signalé. |

<a id="parts"></a>

## Parties

| Partie | Où | Stylée avec |
|---|---|---|
| Le champ | la racine, une ligne | `class`, `style` |
| Un segment | le champ : heure, minute, seconde, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` à l'intérieur, sous `group` dans `segmentClass`) |
| Un séparateur | le champ, entre deux nombres | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Clavier

Tab atteint le champ avec son segment sélectionné. Ensuite :

| Touche | Action |
|---|---|
| Gauche / Droite | Le segment précédent ou suivant. |
| Tab / Maj+Tab | Le segment suivant ou précédent ; Tab depuis le dernier et Maj+Tab depuis le premier quittent le champ. |
| Haut / Bas | Incrémente ou décrémente le segment d'une unité, en revenant au début. |
| 0 à 9 | Saisit dans le segment. |
| A / P | AM ou PM. |
| Retour arrière, Suppr | Réinitialise le segment. |

<a id="accessibility"></a>

## Accessibilité

- Le champ est un champ de texte nommé par `accessibilityLabel` ; les lecteurs d'écran lisent l'heure qu'il affiche. `disabled` l'atténue.
- Les téléphones et tablettes affichent le pavé numérique.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.
