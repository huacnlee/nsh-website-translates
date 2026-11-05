---
title: "Tooltip"
description: "Le composant Tooltip : une indication sur l'élément qui le contient, affichée sur les ordinateurs de bureau lorsque le pointeur reste dessus, avec un style défini par l'application."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

Un tooltip est une courte indication placée à côté de l'élément qu'elle concerne : ce que fait un bouton à icône, le texte complet d'un libellé tronqué.
Sur les ordinateurs de bureau et dans les navigateurs de bureau, il s'affiche une fois que le pointeur est resté sur son déclencheur pendant `delay` (500 ms), et
se masque quand le pointeur le quitte ou appuie sur le déclencheur. Les téléphones et les tablettes n'affichent un tooltip que lorsque l'application l'ouvre
(`open`). Il ne capte jamais le pointeur ni les appuis, de sorte que le déclencheur fonctionne exactement comme sans lui.

`Tooltip` de [`nsh/base`](../modules/nsh-base.md) se transmet via la prop `tooltip` que possède chaque élément
([Props communes](index.md#tooltips)), comme le `.tooltip(..)` de GPUI : l'élément est ce sur quoi le pointeur s'arrête et ce contre quoi
le tooltip est placé. Le tooltip lui-même est la bulle : stylez-la avec `class` / `style`, et ses enfants constituent ce qu'elle dit.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

Par défaut, il se place au-dessus de son déclencheur (`placement`), de l'autre côté s'il n'y a pas assez de place, et reste dans la zone
de sécurité. Avec `open`, c'est l'application qui décide quand il s'affiche : il suit `onOpenChange`, qui signale que le pointeur s'est arrêté sur le
déclencheur ou l'a quitté, et il peut s'afficher sur n'importe quel appareil.

Il apparaît et disparaît avec vos transitions : `startingClass` est son apparence dans sa première image et `endingClass` son apparence
une fois masqué, qu'il conserve pendant l'exécution des classes `transition-*` de son `class` ; `onClose` suit.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce qu'il dit. |
| `class`, `style` | méthodes `.app_class(..)`, `Styled` | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence de la bulle : le tooltip lui-même. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Son apparence dans sa première image : ses transitions partent de là. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Son apparence une fois masqué : il la conserve pendant l'exécution de ses transitions. |
| `open` | `.open(..)` | `boolean` | aucun | Affiché, contrôlé par l'application. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Affiché au départ, sans `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Millisecondes pendant lesquelles le pointeur reste sur le déclencheur avant l'affichage ; `Infinity` : jamais de lui-même, uniquement quand l'application l'ouvre. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il ne s'affiche jamais. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Le côté du déclencheur où il se place. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Son alignement sur le déclencheur le long de ce côté. |
| `offset` | `.offset(..)` | `number` | `4` | L'écart entre le déclencheur et le tooltip. |
| `margin` | `.margin(..)` | `number` | `4` | La distance qu'il conserve par rapport aux bords de la zone de sécurité. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Le pointeur s'est arrêté sur le déclencheur, l'a quitté ou a appuyé dessus (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | Il est affiché. |
| `onClose` | `.on_close(\|\| ..)` | Il a disparu, après sa sortie ; également lorsque l'application l'a masqué. |

<a id="accessibility"></a>

## Accessibilité

Un tooltip répète aux lecteurs d'écran ce que dit son déclencheur : donnez aussi un `accessibilityLabel` au déclencheur, afin que
l'indication soit disponible pour tout le monde.
