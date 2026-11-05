---
title: "Sheet"
description: "Le composant Sheet : un panneau placé sur un bord de l'écran, au-dessus d'un arrière-plan, fermé par l'arrière-plan, la touche Échap et le retour, et stylisé par l'application."
group: base
demo: el-sheet
source_hash: 9ebaacaa0bebfe35
---

# Sheet

Une sheet est un panneau placé sur un bord de l'écran, au-dessus d'un fond (backdrop) qui recouvre le reste : filtres, panneau de partage, tiroir latéral. Un appui sur le backdrop, la touche Échap, le bouton retour d'Android et le geste d'échappement de VoiceOver la ferment. Elle s'affiche au-dessus de tout le contenu de sa
fenêtre, de la même façon sur tous les appareils, et ne dessine rien par elle-même : le panneau et le backdrop sont ceux de l'app.

```rust tabs
use nsh_base::{SheetEvent, sheet};
use nsh_core::prelude::*;

fn filters(open: Signal<bool>) -> impl IntoElement {
    sheet()
        .open(move || Some(open.get()))
        .on_open_change(move |e: &SheetEvent| {
            if let SheetEvent::OpenChange(next, _) = e {
                open.set(*next);
            }
        })
        .child(
            view()
                .gap_3()
                .p_6()
                .rounded_t(px(16.0))
                .bg(white())
                .child(text("Filters").font_weight(FontWeight::SEMIBOLD))
                .child(view().on_press(move || open.set(false)).child(text("Done"))),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Sheet } from "nsh/base";

function Filters() {
  const open = signal(false);
  return (
    <>
      <View onPress={() => open.set(true)}><Text>Filters</Text></View>
      <Sheet
        open={open()}
        onOpenChange={(e) => open.set(e.open)}
        popupClass="gap-3 rounded-t-2xl bg-white p-6"
        backdropClass="bg-black/40"
      >
        <Text class="font-semibold">Filters</Text>
        <View onPress={() => open.set(false)}><Text>Done</Text></View>
      </Sheet>
    </>
  );
}
```

`Sheet` provient de [`nsh/base`](../modules/nsh-base.md). Son contenu est recréé à chaque ouverture. `side` la place en
`"bottom"` (par défaut) ou en `"top"` de l'écran, sur toute la largeur de l'écran, ou à `"left"` ou `"right"`, sur toute la
hauteur de l'écran ; sa taille dans l'autre dimension est celle du panneau, déterminée par son contenu ou par `popupClass`.

Son glissement suit la taille mesurée du panneau pendant que le contenu est créé ou grandit durant l'entrée. Le contenu paresseux (lazy) et
les mises à jour de taille asynchrones partagent la même progression d'animation ; le panneau se stabilise à sa taille courante.

<a id="open-state"></a>

## État d'ouverture

Sans `open`, la sheet conserve son propre état, en partant de `defaultOpen`. Avec `open`, c'est l'app qui le possède : modifiez-le dans
`onOpenChange({ open, reason })`, qui signale chaque demande de fermeture avec son motif (`"backdropPress"`, `"cancel"`, `"swipe"`).
`onOpen` et `onClose` l'accompagnent à l'entrée et à la sortie, que ce soit l'utilisateur ou l'app qui l'ait ouverte ou fermée.

`closeOnEscape={false}` la maintient ouverte face à Échap et au retour, `closeOnBackdropPress={false}` face aux appuis sur le backdrop ;
`onCancel` les reçoit quand même, afin de pouvoir demander confirmation avant.

<a id="dragging-a-bottom-sheet"></a>

## Glisser une bottom sheet

Définissez `closeOnSwipe` pour qu'un panneau du bas suive un glissement vers le bas. Son backdrop s'estompe selon la distance ; un relâchement
au-delà de 30 % de la hauteur du panneau, ou vers le bas à 800 points par seconde, demande la fermeture avec le motif `"swipe"`.
Un glissement plus court ramène le panneau en douceur. Un propriétaire en mode contrôlé peut laisser `open` à true pour ramener le panneau après une demande de fermeture.
Avec la réduction des animations, le relâchement et l'ouverture/fermeture programmatiques se stabilisent immédiatement ; le glissement direct suit toujours le doigt.

Le panneau s'adapte à son contenu, y compris pour les menus courts ; utilisez `popupStyle` ou la hauteur d'un enfant pour contraindre un contenu plus haut.
L'app dessine sa propre poignée, qui peut être n'importe quelle vue à l'intérieur du panneau. Sur iOS, un `Scroll` ou `List` vertical interne
consomme le glissement jusqu'à son sommet, puis transmet le mouvement descendant restant au panneau au sein du même geste.
Sur Android, les ordinateurs de bureau et le web, le glissement de la poignée ou du contenu en dehors d'un défilement utilise leur prise en charge native du déplacement (pan) ;
les défilements internes conservent l'arbitrage de gestes normal de leur plateforme. Définir `closeOnSwipe` à false maintient le panneau
immobile et préserve le contenu monté ainsi que la position de défilement. Les autres côtés conservent leur comportement existant.

<a id="native-sheets"></a>

## Sheets natives

Une sheet est dessinée par NSH dans la fenêtre de l'app, avec le style défini par l'app. Pour la sheet présentée par la plateforme elle-même (une page sheet
sur iOS), utilisez un [Dialog](./dialog.md) avec `presentation="pageSheet"`.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | aucun | Ouverte, contrôlée par l'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Ouverte au départ, sans `open`. |
| `side` | `.side(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Le bord où elle se place. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Échap et le bouton retour d'Android la ferment. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Un appui sur le backdrop la ferme. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `false` | Un panneau du bas suit un glissement vers le bas et se ferme si le relâchement est suffisant. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence du panneau. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence du backdrop, par exemple une couleur translucide. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Une demande de fermeture, avec son motif : `"backdropPress"`, `"cancel"` ou `"swipe"`. |
| `onOpen` | `.on_open(\|\| ..)` | Elle est entrée : tout est en place. |
| `onClose` | `.on_close(\|\| ..)` | Elle est partie : tout a disparu. Également lorsque l'app l'a fermée. |
| `onCancel` | `.on_cancel(\|\| ..)` | L'utilisateur a essayé de la fermer (Échap ou retour, appui sur le backdrop, balayage activé), qu'elle se soit fermée ou non. |

Sur le web, l'intégration avec `dialogs: "viewport"` présente la sheet et son backdrop par-dessus la page hôte,
y compris dans une iframe de même origine. Les frames cross-origin utilisent [`hostPlayerFrame`](../docs/web.md#embed-it-in-a-page).
