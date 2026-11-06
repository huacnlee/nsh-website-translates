---
title: "HoverCard"
description: "Le composant HoverCard : un aperçu de ce vers quoi pointe son déclencheur, affiché tant que le pointeur reste sur le déclencheur, et stylisé par l'application."
group: base
demo: el-hover-card
source_hash: 30e2d3b34842945d
---

# HoverCard

Une carte de survol prévisualise ce vers quoi pointe son déclencheur sans quitter la page : le profil derrière une mention, la page derrière un lien, la cotation derrière un symbole boursier. Sur les ordinateurs de bureau et dans les navigateurs de bureau, elle s'ouvre lorsque le pointeur est resté immobile sur le déclencheur pendant `openDelay` (600 ms), ou dès que le focus clavier arrive sur le déclencheur. Elle reste ouverte tant que le pointeur passe du déclencheur à la carte et inversement, et tant que le focus clavier se trouve sur le déclencheur ou sur un lien ou un bouton de la carte ; tout le contenu de la carte est ainsi utilisable aussi bien au pointeur qu'au clavier. Elle se ferme `closeDelay` (300 ms) après que le pointeur a quitté les deux et que le focus n'est dans aucun des deux. Échap et un appui à l'extérieur la ferment immédiatement. Sur les téléphones et les tablettes, un appui sur le déclencheur l'ouvre et la ferme, et un appui à l'extérieur la ferme.

`HoverCard` de [`nsh/base`](../modules/nsh-base.md) ne dessine rien par lui-même : le déclencheur est votre élément, la fenêtre contextuelle et son contenu vous appartiennent.

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

Le déclencheur conserve son propre rôle, ses appuis et son apparence : une vue avec `role="link"` et son propre `onPress` va toujours là où elle va lorsqu'on appuie dessus, et la carte lui ajoute un aperçu. Le contenu est créé à chaque ouverture de la carte, il peut donc charger à ce moment-là ce qu'il affiche. Sur les téléphones et les tablettes, où un appui ouvre la carte, le déclencheur indique aux lecteurs d'écran si sa carte est ouverte. Dans une [Toolbar](./toolbar.md), le déclencheur peut être l'un de ses éléments ; en revanche, ce que la carte affiche ne l'est pas : ses boutons et ses liens conservent leurs propres arrêts de tabulation et le `disabled` de la barre d'outils ne les modifie pas.

<a id="delays"></a>

## Délais

`openDelay` évite que la carte ne s'ouvre brusquement lorsque le pointeur traverse le déclencheur en se dirigeant ailleurs ; `closeDelay` laisse au pointeur le temps de franchir l'espace entre le déclencheur et la carte. Les deux sont exprimés en millisecondes. Le pointeur et les délais sont suivis nativement : rester sur un déclencheur ou se déplacer entre lui et la carte n'exécute aucun de vos codes tant que la carte ne s'ouvre ni ne se ferme. Un `openDelay` de `Infinity` laisse l'ouverture à l'application (et à un appui sur un écran tactile) ; un `closeDelay` de `Infinity` laisse la fermeture à Échap, à un appui à l'extérieur et à l'application.

```tsx
<HoverCard openDelay={300} closeDelay={150} trigger={<Text>AAPL</Text>}>
  <Quote symbol="AAPL" />
</HoverCard>
```

<a id="open-state"></a>

## État d'ouverture

Sans `open`, la carte gère son propre état, à partir de `defaultOpen`. Avec `open`, l'application en est responsable : modifiez-le dans `onOpenChange({ open, reason })`, qui signale chaque demande d'ouverture ou de fermeture avec sa raison : `"hover"` (le pointeur), `"focus"` (le focus clavier), `"triggerPress"` (un appui sur un écran tactile), `"pressOutside"` ou `"cancel"` (Échap ou retour).

```tsx
const open = signal(false);

<HoverCard open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>@ada</Text>}>
  <Profile id="ada" />
</HoverCard>
```

<a id="entrance-and-exit"></a>

## Entrée et sortie

Une carte de survol apparaît et disparaît avec vos transitions, comme le fait un [Popover](./popover.md). `popupStartingClass` est l'apparence de la fenêtre contextuelle dans sa première image, et les classes `transition-*` de `popupClass` la mènent vers sa propre apparence. `popupEndingClass` est son apparence une fois fermée : la carte reste, sans recevoir le pointeur, pendant l'exécution de ces transitions, puis disparaît, et `onClose` suit. Si l'on s'arrête de nouveau sur le déclencheur pendant qu'elle disparaît, elle est rétablie. Lorsque l'utilisateur demande moins d'animations, elle apparaît et disparaît instantanément.

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

Par défaut, elle se place sous le déclencheur (`placement`, `align`), de l'autre côté s'il n'y a pas de place, et reste dans la zone sûre. `onPosition({ placement, bounds, available })` indique où elle a été placée.

<a id="props"></a>

## Propriétés

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | aucun | Ouverture, contrôlée par l'application. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Ouverte au départ, sans `open`. |
| `openDelay` | `.open_delay(..)` | `number` | `600` | Millisecondes pendant lesquelles le pointeur reste sur le déclencheur, ou le focus reste sur lui, avant l'ouverture ; `Infinity` : jamais d'ouverture automatique. |
| `closeDelay` | `.close_delay(..)` | `number` | `300` | Millisecondes pendant lesquelles le pointeur est éloigné du déclencheur et de la carte, le focus n'étant dans aucun des deux, avant la fermeture ; `Infinity` : jamais de fermeture automatique. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Le côté du déclencheur où elle se place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Son alignement sur le déclencheur le long de ce côté. |
| `offset` | `.offset(..)` | `number` | `0` | L'écart entre le déclencheur et la carte. |
| `margin` | `.margin(..)` | `number` | `0` | La distance qu'elle garde par rapport aux bords de la zone sûre. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la fenêtre contextuelle, la carte dans laquelle se trouve le contenu. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la fenêtre contextuelle dans sa première image, par-dessus la sienne : ses transitions partent de là. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la fenêtre contextuelle une fois fermée, par-dessus la sienne : elle reste pendant l'exécution de ses transitions. |
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | Ce qu'elle prévisualise ; elle est positionnée par rapport à lui. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu, créé à chaque ouverture. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Demande l'ouverture ou la fermeture, avec la raison : `"hover"`, `"focus"`, `"triggerPress"`, `"pressOutside"` ou `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Elle est affichée. |
| `onClose` | `.on_close(\|\| ..)` | Elle a disparu, après sa sortie ; également lorsque l'application l'a fermée. |
| `onPosition` | `.on_position(\|e\| ..)` | La fenêtre contextuelle a été placée : `placement` (le côté où elle s'est placée), `bounds` (son cadre), `available` (l'espace disponible de ce côté). |

<a id="accessibility"></a>

## Accessibilité

Une carte de survol s'ajoute à son déclencheur : celui-ci conserve son rôle et son libellé, et ce qu'il ouvre ou fait lorsqu'on appuie dessus reste identique. Les utilisateurs du clavier obtiennent la carte lorsque le focus reste sur le déclencheur, et Échap la ferme. La carte ne prend pas le focus d'elle-même : Tab quitte donc le déclencheur comme auparavant. Les liens et les boutons de la carte reçoivent le focus comme partout ailleurs, et la carte reste ouverte tant que l'un d'eux l'a ; ce qui compte dans la carte doit aussi être accessible depuis la page vers laquelle mène le déclencheur.
