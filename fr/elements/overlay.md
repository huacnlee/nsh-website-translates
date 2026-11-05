---
title: "Overlay"
description: "L'élément Overlay : un contenu affiché par-dessus l'écran quel que soit le rognage appliqué à son parent, disposé comme une boîte fixe ou placé contre une ancre qu'il suit, avec signalement des appuis à l'extérieur et de la touche Échap."
order: 100
group: primitives
demo: el-overlay
source_hash: 7e13ccf223d62c09
---

# Overlay

Un overlay affiche ses enfants au-dessus de tout le reste dans la vue racine où il se trouve : la fenêtre, ou la boîte de dialogue qui l'entoure.
La taille de son parent, `overflow: hidden` et les vues défilantes ne le rognent pas. Pour tout le reste, il demeure là où vous l'avez écrit : il lit le contexte qui l'entoure, ses gestionnaires sont ceux de son composant, et il disparaît avec son parent. Les popovers, menus, infobulles et feuilles sont construits dessus ; [`nsh/base`](../modules/nsh-base.md) les propose prêts à l'emploi ([Popover](./popover.md), [Menu](./menu.md), [Tooltip](./tooltip.md), [Sheet](./sheet.md)), et un overlay sert à construire les vôtres.

```rust tabs
use nsh_core::prelude::*;

fn more_button() -> impl IntoElement {
    let open = signal(false);
    let anchor = element_ref();
    view()
        .child(
            view()
                .element_ref(&anchor)
                .on_press(move || open.update(|o| *o = !*o))
                .px_3()
                .py_2()
                .child(text("More")),
        )
        .child(when(move || open.get(), move || {
            overlay()
                .anchor(&anchor)
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(6.0))
                .margin(px(8.0))
                .on_press_outside(move |_: &Point<Points>| open.set(false))
                .on_cancel(move || open.set(false))
                .rounded_lg()
                .bg(white())
                .p_3()
                .shadow_lg()
                .child(text("Shown above everything"))
        }))
}
```

```tsx tabs
import { Overlay, signal, Text, View, type ViewRef } from "nsh";

function MoreButton() {
  const open = signal(false);
  let anchor: ViewRef | undefined;
  return (
    <View>
      <View ref={anchor} onPress={() => open.set(!open())} class="px-3 py-2">
        <Text>More</Text>
      </View>
      <If when={open()}>
        <Overlay
          anchor={anchor}
          placement="bottom"
          align="start"
          offset={6}
          margin={8}
          onPressOutside={() => open.set(false)}
          onCancel={() => open.set(false)}
          class="rounded-lg bg-white p-3 shadow-lg"
        >
          <Text>Shown above everything</Text>
        </Overlay>
      </If>
    </View>
  );
}
```

`Overlay` provient de `nsh` en TSX et `overlay()` de `nsh_core::prelude` en Rust. Il est affiché tant qu'il est dans la vue : placez-le dans un `If` (Rust : `when(..)`) pour l'ouvrir et le fermer. Les overlays affichés plus tard sont au-dessus des précédents, et un overlay placé dans un autre est au-dessus de celui-ci.

## Placement

Sans `anchor`, un overlay est disposé comme une boîte `position: fixed` de sa vue racine : ses `top`, `left`, `inset`, sa taille et ses marges se rapportent à la fenêtre entière (ou à la boîte de dialogue). `class="inset-0"` la recouvre, ce qui donne un fond ou une couche plein écran ; `class="bottom-0 left-0 right-0"` est une barre le long du bas.

Avec `anchor`, NSH le place à côté de l'ancre :

- `anchor` est une vue (un `ref`), un `Point` (`{ x, y }`) dans les coordonnées de la vue racine, le `pageX` / `pageY` d'un toucher (un menu là où se trouve le pointeur), ou un `Bounds` (`{ origin, size }`) à cet endroit : le curseur d'un champ de saisie (le `pageBounds` de `onCaretMove`), là où s'ouvrent les suggestions pour ce qui est en cours de saisie.
- `placement` est le côté où il se place : `"top"`, `"bottom"` (par défaut), `"left"` ou `"right"`. Quand il ne tient pas de ce côté mais tient du côté opposé, il passe de l'autre côté ; quand il ne tient d'aucun des deux, il se place du côté qui a le plus de place.
- `align` l'aligne le long de ce côté : `"start"`, `"center"` (par défaut) ou `"end"`. Au-dessus et en dessous de l'ancre, début et fin suivent le sens de la mise en page : le début est le bord gauche, ou le bord droit dans une mise en page de droite à gauche.
- `offset` est l'écart entre l'ancre et l'overlay ; `margin` la distance qu'il garde par rapport aux bords de la zone de sécurité, dans laquelle il reste : il glisse le long de son côté pour s'y ajuster.

Un overlay ancré suit son ancre : quand l'ancre défile, bouge ou change de taille, l'overlay la suit dans la même frame où NSH le dispose. `onPosition` indique où il est allé, afin qu'une flèche puisse pointer vers l'ancre ou qu'un long menu puisse limiter sa hauteur :

```tsx
<Overlay
  anchor={anchor}
  onPosition={(e) => {
    side.set(e.placement); // "top" when it flipped
    maxHeight.set(e.available.height);
  }}
/>
```

<a id="dismissing"></a>

## Fermeture

Un overlay signale ce qui ferme habituellement une popup et vous laisse la décision :

- `onPressOutside` se déclenche quand un doigt ou un bouton de souris s'appuie en dehors de l'overlay, de son ancre et des overlays qu'il contient. L'appui se poursuit vers ce qui se trouve en dessous.
- `onCancel` se déclenche sur Échap, le bouton retour d'Android et le geste d'échappement de VoiceOver sur iOS, uniquement pour l'overlay du dessus qui l'écoute. Il les reçoit avant les pages et `BackHandler`.

Pour bloquer l'écran derrière une popup, placez en dessous un second overlay avec `class="inset-0"` et un `onPress` qui ferme les deux : c'est ainsi que fonctionnent [Sheet](./sheet.md) et la présentation sur téléphone de [Popover](./popover.md).

<a id="props"></a>

## Propriétés

| Propriété | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `anchor` | `.anchor(&element_ref)`, `.anchor_point(point)`, `.anchor_bounds(bounds)` | `ViewRef \| Point \| Bounds \| null` | aucun | La vue, le point ou la boîte par rapport auxquels il est placé. Sans ancre, c'est une boîte fixe de sa vue racine. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Le côté de l'ancre où il se place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Son alignement avec l'ancre le long de ce côté. |
| `offset` | `.offset(px(..))` | `number` | `0` | L'écart entre l'ancre et l'overlay. |
| `margin` | `.margin(px(..))` | `number` | `0` | La distance qu'il garde par rapport aux bords de la zone de sécurité. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce qu'il affiche. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Son apparence et, sans ancre, son emplacement. |

Il accepte aussi les [propriétés communes](./index.md#common-props) d'une vue.

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onPressOutside` | `.on_press_outside(\|point\| ..)` | Un appui a eu lieu en dehors de l'overlay, de son ancre et des overlays qu'il contient (`pagePosition`, un `Point`). |
| `onCancel` | `.on_cancel(\|\| ..)` | Échap, le bouton retour d'Android ou le geste d'échappement de VoiceOver, tant qu'il est l'overlay du dessus à l'écoute. |
| `onPosition` | `.on_position(\|position\| ..)` | NSH l'a placé : `placement` (le côté où il est allé), `bounds` dans la vue racine, et `available` (un `Size` : la place disponible de ce côté). |

<a id="platform-notes"></a>

## Notes sur les plateformes

- Chaque plateforme affiche un overlay comme une vue native de la vue racine de la fenêtre (ou de la boîte de dialogue), dessinée et soumise au hit-testing comme les vues qui l'entourent : UIKit, vues Android, AppKit, GTK, Win32, GPUI et le DOM.
- Un overlay dans un [Dialog](./dialog.md) s'affiche dans cette boîte de dialogue, au-dessus de son contenu.
- Les overlays restent dans leur fenêtre : un menu qui dépasserait le bord de la fenêtre glisse pour rentrer à l'intérieur.
