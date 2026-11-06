---
title: "Popover"
description: "Le composant Popover : un contenu ancré à un déclencheur, affiché au-dessus de tout le reste, que le déclencheur, un appui à l'extérieur, Échap et le retour permettent de fermer, et dont le style est défini par l'application."
group: base
demo: el-popover
source_hash: 49f2e25232287792
---

# Popover

Un popover affiche du contenu à côté de son déclencheur, au-dessus de tout le reste : des détails, un petit formulaire, un sélecteur de couleur.
Appuyer sur le déclencheur l'ouvre et le ferme ; un appui à l'extérieur, Échap, le bouton retour d'Android et le geste d'échappement de VoiceOver le ferment. Il se place
sur un côté du déclencheur, passe de l'autre côté s'il n'y a pas de place, reste dans la zone de sécurité et suit le
déclencheur lorsqu'il défile. Il ne dessine rien lui-même : la popup et son contenu appartiennent à l'app.

```rust tabs
use nsh_base::{OpenChangeReason, PopoverEvent, popover};
use nsh_core::prelude::*;

fn details() -> impl IntoElement {
    popover()
        .offset(px(6.0))
        .margin(px(8.0))
        .trigger(view().px_3().py_2().rounded_md().bg(rgb(0xe5e7eb)).child(text("Details")))
        .on_open_change(|e: &PopoverEvent| {
            if let PopoverEvent::OpenChange(open, OpenChangeReason::PressOutside) = e {
                log::info!("closed by a press outside: {open}");
            }
        })
        .child(
            view()
                .w(px(240.0))
                .gap_1()
                .p_3()
                .rounded_lg()
                .bg(white())
                .shadow_lg()
                .child(text("Order #1024").font_weight(FontWeight::SEMIBOLD))
                .child(text("Shipped yesterday, arriving Friday.")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Popover } from "nsh/base";

function Details() {
  return (
    <Popover
      offset={6}
      margin={8}
      popupClass="w-60 gap-1 rounded-lg bg-white p-3 shadow-lg"
      trigger={
        <View class="rounded-md bg-gray-200 px-3 py-2">
          <Text>Details</Text>
        </View>
      }
    >
      <Text class="font-semibold">Order #1024</Text>
      <Text>Shipped yesterday, arriving Friday.</Text>
    </Popover>
  );
}
```

`Popover` provient de [`nsh/base`](../modules/nsh-base.md). Son contenu est recréé à chaque ouverture, donc l'état qu'il contient
repart de zéro.

<a id="open-state"></a>

## État d'ouverture

Sans `open`, le popover gère son propre état, à partir de `defaultOpen`. Avec `open`, c'est l'app qui le possède : modifiez-le
dans `onOpenChange({ open, reason })`, qui signale chaque demande d'ouverture ou de fermeture avec sa raison (`"triggerPress"`,
`"pressOutside"`, `"cancel"`).

```tsx
const open = signal(false);

<Popover open={open()} onOpenChange={(e) => open.set(e.open)} trigger={<Text>Filters</Text>}>
  <FilterForm onApply={() => open.set(false)} />
</Popover>
```

`closeOnEscape={false}` le garde ouvert lors d'Échap et du retour (`onCancel` les reçoit toujours, pour demander d'abord) ;
`closeOnPressOutside={false}` le garde ouvert lors des appuis à l'extérieur.

<a id="phones-and-desktops"></a>

## Téléphones et ordinateurs

Un popover est ancré à son déclencheur sur tous les appareils : ce qu'il affiche appartient à côté de ce qui l'a ouvert.

- Sur les ordinateurs de bureau et dans les navigateurs de bureau, un appui à l'extérieur le ferme et se poursuit sur ce qui se trouve sous le pointeur, de sorte
  qu'un seul clic ferme le popover et appuie sur le bouton visé.
- Sur les téléphones et les tablettes, un appui à l'extérieur ne fait que le fermer : un fond transparent capte l'appui, comme le font les
  popovers du système.

Pour une liste d'actions, utilisez un [Menu](./menu.md), qui devient une feuille sur les téléphones ; pour un panneau, utilisez un [Sheet](./sheet.md).

<a id="entrance-and-exit"></a>

## Entrée et sortie

Un popover apparaît et disparaît avec vos transitions. `popupStartingClass` est l'apparence de la popup à sa première image, et les
classes `transition-*` de `popupClass` l'amènent à sa propre apparence : c'est son entrée. `popupEndingClass` est son apparence une fois
fermé : le popover reste, sans recevoir d'appuis, pendant que ces transitions s'exécutent, puis disparaît, et `onClose` suit. S'il est rouvert
pendant sa sortie, il revient à son apparence depuis l'état où il se trouve. `popupStartingStyle` et `popupEndingStyle` font de même
avec des styles en ligne. Lorsque l'utilisateur demande moins de mouvement, il apparaît et disparaît instantanément.

```tsx
<Popover
  popupClass="rounded-lg bg-white p-3 shadow-lg transition-all duration-150 ease-out"
  popupStartingClass="opacity-0 scale-95"
  popupEndingClass="opacity-0 scale-95"
  onPosition={({ placement }) => side.set(placement)}
  trigger={<Text>Details</Text>}
>
  <OrderSummary />
</Popover>
```

`onPosition({ placement, bounds, available })` indique où la popup est allée : le côté du déclencheur (l'autre côté lorsque
`placement` manquait de place), son cadre et l'espace disponible de ce côté, afin qu'une flèche ou une entrée puisse pointer vers le déclencheur.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | aucun | Ouvert, contrôlé par l'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Ouvert au départ, sans `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Le côté du déclencheur sur lequel il se place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Son alignement avec le déclencheur le long de ce côté. |
| `offset` | `.offset(..)` | `number` | `0` | L'espace entre le déclencheur et la popup. |
| `margin` | `.margin(..)` | `number` | `0` | La distance qu'il garde par rapport aux bords de la zone de sécurité. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Échap et le bouton retour d'Android le ferment. |
| `closeOnPressOutside` | `.close_on_press_outside(..)` | `boolean` | `true` | Un appui à l'extérieur le ferme. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la popup, la boîte dans laquelle se trouve le contenu. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la popup à sa première image, par-dessus la sienne : ses transitions partent de là. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la popup une fois fermée, par-dessus la sienne : elle reste pendant que ses transitions s'exécutent. |
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | Ce qui l'ouvre ; il est placé par rapport à lui. Tant que le popover est ouvert, ses classes `aria-expanded:` et `expandedStyle` s'appliquent. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Il s'est ouvert ou fermé, avec la raison : `"triggerPress"`, `"pressOutside"` ou `"cancel"`. |
| `onOpen` | `.on_open(\|\| ..)` | Il est affiché. |
| `onClose` | `.on_close(\|\| ..)` | Il a disparu, après sa sortie ; également lorsque l'app l'a fermé. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utilisateur a tenté de le fermer (Échap ou retour, appui à l'extérieur), qu'il se soit fermé ou non. |
| `onPosition` | `.on_position(\|e\| ..)` | La popup a été placée : `placement` (le côté choisi), `bounds` (son cadre), `available` (l'espace disponible de ce côté). |

<a id="accessibility"></a>

## Accessibilité

Le déclencheur indique aux lecteurs d'écran si le popover est déployé. Échap et le bouton retour le ferment, comme les utilisateurs s'y attendent
d'une popup. En TSX, le déclencheur est l'élément que vous passez, un `Button` ou une vue de votre cru : il prend lui-même en charge les appuis et l'état
déployé, de sorte que ses propres classes `active:` et `activeStyle` s'appliquent pendant l'appui, et que son propre `onPress`
s'exécute aussi.
