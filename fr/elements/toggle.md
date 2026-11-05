---
title: "Toggle"
description: "Toggle et ToggleGroup : un bouton qui est activé ou désactivé, et une barre d'outils composée de ces boutons. Chaque Toggle gère les appuis, l'activation au clavier, l'état désactivé ainsi que son rôle et son état « pressé » pour les lecteurs d'écran ; le groupe est une barre d'outils qui ne constitue qu'un seul point d'arrêt pour le focus clavier ; l'apparence et la détermination des Toggle pressés relèvent de l'application."
group: base
demo: el-toggle
source_hash: d8d3727dd9d04426
---

# Toggle

Un toggle est un bouton qui reste activé ou désactivé : le gras dans une barre d'outils de texte, une étoile de favori, une option d'affichage. `Toggle` gère son comportement : les pressions, l'activation au clavier, l'état désactivé, ainsi que le rôle de bouton avec son état pressé pour les lecteurs d'écran, qui l'annoncent comme un bouton à bascule. Un `ToggleGroup` autour de plusieurs toggles forme une barre d'outils : les lecteurs d'écran l'annoncent comme telle, et le clavier y accède en un seul arrêt puis se déplace entre ses toggles avec les touches fléchées. L'apparence est celle de l'app : un toggle n'a ni couleurs, ni tailles, ni icône, ni libellé propres. Ses enfants sont l'icône ou le libellé de l'app, et les classes `aria-pressed:` sur le toggle, ou les classes `group-aria-pressed:` sur son contenu, suivent son état.

```rust tabs
use nsh_base::{theme, toggle, toggle_group};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(true);
    let italic = signal(false);
    let item = move |label: &'static str, on: Signal<bool>| {
        toggle()
            .pressed(on)
            .accessibility_label(label)
            .on_change(move |pressed: &bool| on.set(*pressed))
            .size_8()
            .items_center()
            .justify_center()
            .rounded(move || theme().radius)
            .pressed_style(|s| s.bg(move || theme().accent))
            .child(text(&label[..1]).text_sm().text_color(move || {
                if on.get() { theme().accent_foreground } else { theme().muted_foreground }
            }))
    };
    toggle_group()
        .flex_row()
        .self_start()
        .gap_1()
        .child(item("Bold", bold))
        .child(item("Italic", italic))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Toggle, ToggleGroup } from "nsh/base";

function App() {
  const marks = signal<string[]>(["bold"]);
  const item = (value: string, label: string) => (
    <Toggle
      pressed={marks().includes(value)}
      accessibilityLabel={label}
      onChange={({ pressed }) =>
        marks.set(pressed ? [...marks(), value] : marks().filter((m) => m !== value))
      }
      class="group size-8 items-center justify-center rounded-(--radius) aria-pressed:bg-accent"
    >
      <Text class="text-sm text-muted-foreground group-aria-pressed:text-accent-foreground">{label[0]}</Text>
    </Toggle>
  );
  return (
    <ToggleGroup class="flex-row self-start gap-1">
      {item("bold", "Bold")}
      {item("italic", "Italic")}
    </ToggleGroup>
  );
}

mount(App);
```

`Toggle` et `ToggleGroup` viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : chaque toggle sait s'il est pressé, une pression signale la valeur qu'elle demande avec `onChange`, et le toggle affiche le `pressed` que l'app renvoie. Le groupe ne détient pas non plus de valeur, de sorte que le nombre de toggles pouvant être pressés relève aussi de l'app : un nombre quelconque (gras, italique et souligné), ou exactement un (un alignement, un sélecteur de vue), auquel cas l'app presse le toggle demandé, relâche les autres et garde pressé celui qui l'est déjà. En Rust, `toggle()` et `toggle_group()` les construisent, avec un setter par prop (`.pressed(..)`), un écouteur par événement (`.on_change(..)`), les méthodes de style typées et `.child(..)` pour leur contenu.

## Props

<a id="toggle-1"></a>

### Toggle

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `pressed` | `.pressed(..)` | `boolean` | `false` | Activé ou désactivé : les lecteurs d'écran l'annoncent comme pressé, et les styles `aria-pressed:` s'appliquent. Une pression signale l'autre valeur avec `onChange` ; le toggle affiche la valeur que l'app renvoie. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucune pression et aucun retour visuel de pression ; les styles `disabled:` s'appliquent, et les lecteurs d'écran l'annoncent comme grisé. Un toggle dans un `ToggleGroup` désactivé est lui aussi désactivé. |
| `pressedStyle` | `.pressed_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style du toggle lorsqu'il est pressé et non désactivé, sous forme de classes `aria-pressed:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran : ce que le toggle active, lorsque ses enfants n'ont pas de texte qui l'indique (une icône). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Jusqu'où, en dehors de ses limites, les pressions comptent encore, en points : un nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | L'icône ou le libellé de l'app, que les lecteurs d'écran annoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le toggle lui-même : la surface autour de son contenu. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style du toggle pendant une pression, au survol, avec le focus ou lorsqu'il est désactivé, sous forme de classes `<state>:`. |

### ToggleGroup

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Tous les toggles du groupe sont désactivés, quel que soit leur propre `disabled`. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les toggles du groupe, et tout ce que l'app dispose entre eux (un séparateur). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La disposition et l'apparence du groupe : une colonne par défaut, `flex-row` pour une ligne. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` (`Toggle`) | `.on_change(\|pressed: &bool\| ..)` | Le toggle a été pressé : un toucher, un clic, Espace ou Entrée lorsqu'il a le focus clavier, ou une activation par un lecteur d'écran. `{ pressed }` est la valeur demandée, l'opposé de `pressed`. L'événement s'exécute avant tout changement : le toggle affiche le `pressed` que l'app renvoie. |

Une touche fléchée dans un `ToggleGroup` ne fait que déplacer le focus clavier : elle ne presse rien. Un toggle désactivé ne signale rien.

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec | États |
|---|---|---|---|
| Le groupe | | `class`, `style` de `ToggleGroup` | |
| Le toggle | le groupe, ou n'importe où | `class`, `style` de `Toggle` | `aria-pressed:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `pressedStyle`, `disabledStyle`, ...) |
| L'icône ou le libellé | le toggle | ses propres éléments (`children`) | `group-aria-pressed:`, `group-disabled:` et les autres variantes `group-*:` avec `group` sur le `class` du toggle |

`aria-pressed:` correspond au toggle activé ; `active:` correspond à une pression en cours, que le toggle soit activé ou non. Montrez un toggle pressé par sa propre surface : un remplissage, une pastille surélevée, une icône plus marquée (voir [Guides de conception](../docs/design-guides.md#interaction-states)).

## Segmented

Un groupe dont les toggles sont joints, un seul étant pressé à la fois, est un contrôle segmenté (un sélecteur de vue) : l'app conserve une valeur et presse le toggle qui la nomme. L'apparence jointe vient des classes de l'app :

```tsx
<ToggleGroup class="flex-row self-start">
  <Each of={["grid", "list"]}>
    {(value) => (
      <Toggle
        pressed={view() === value()}
        accessibilityLabel={`${value()} view`}
        onChange={({ pressed }) => pressed && view.set(value())}
        class="-ml-px h-8 px-3 border border-border first:ml-0 first:rounded-l-(--radius) last:rounded-r-(--radius) aria-pressed:bg-accent"
      >
        <Text class="text-sm">{value()}</Text>
      </Toggle>
    )}
  </Each>
</ToggleGroup>
```

## Disabled

Un toggle désactivé ne reçoit aucune pression, et les lecteurs d'écran l'annoncent comme grisé. Ses classes `disabled:` s'appliquent par-dessus ses classes `aria-pressed:`, et les classes `group-disabled:` à l'intérieur suivent. `disabled` sur un `ToggleGroup` désactive tous les toggles qu'il contient, soit une barre d'outils que l'app verrouille :

```tsx
<ToggleGroup disabled={readonly()} class="flex-row gap-1">
  <Toggle pressed={bold()} onChange={({ pressed }) => bold.set(pressed)} class="size-8 disabled:opacity-50">
    <Text>B</Text>
  </Toggle>
</ToggleGroup>
```

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Un toggle d'icône peut être plus petit qu'un doigt. `hitSlop` fait compter les pressions qui tombent à proximité, en points au-delà de chaque côté, sans modifier sa disposition ni son apparence : un nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme les accepte [le `hitSlop` d'une vue](./index.md#presses-and-feedback).

```tsx
<Toggle
  pressed={favorite()}
  hitSlop={12}
  accessibilityLabel="Favorite"
  onChange={({ pressed }) => favorite.set(pressed)}
  class="size-5 items-center justify-center"
>
  <Text>★</Text>
</Toggle>
```

<a id="accessibility"></a>

## Accessibilité

- Un toggle est un seul élément pour les lecteurs d'écran, avec le rôle `"button"` et son état pressé : un bouton à bascule. Son libellé est le texte de ses enfants, ou `accessibilityLabel`.
- `ToggleGroup` a le rôle `"toolbar"` : les lecteurs d'écran perçoivent les toggles qu'il contient comme une seule barre d'outils, chacun restant un élément à part entière.
- `disabled` est annoncé comme le fait la plateforme (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).
- Sur macOS et le web, le groupe constitue un seul arrêt du focus clavier, et les touches fléchées se déplacent entre ses toggles (voir ci-dessous).

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, où Tab atteint les vues qui reçoivent des pressions, un `ToggleGroup` suit le [motif de barre d'outils WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) :

| Touche | Effet |
|---|---|
| Tab, Maj+Tab | Entre dans le groupe au premier toggle pressé (le premier toggle non désactivé si aucun ne l'est), et en sort en une seule étape. |
| Droite, Bas | Déplace le focus vers le toggle suivant, du dernier au premier. |
| Gauche, Haut | Déplace le focus vers le toggle précédent, du premier au dernier. |
| Début, Fin | Déplace le focus vers le premier ou le dernier toggle. |
| Espace, Entrée | Presse le toggle qui a le focus. |

Les touches fléchées ignorent les toggles désactivés et ne pressent rien : un toggle ne change que lorsqu'il est pressé. Les deux paires de flèches déplacent le focus, quelle que soit la disposition du groupe, qui relève des classes de l'app. Dans une disposition de droite à gauche, Gauche et Droite s'inversent : Gauche passe au toggle suivant et Droite au précédent ; Haut, Bas, Début et Fin gardent leur effet. Les styles `focus:` montrent où se trouve le focus. Un `Toggle` en dehors d'un `ToggleGroup` constitue un arrêt à part entière.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : une pression est un toucher qui se termine sur le toggle, contenu compris.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : une pression est un clic. Sur macOS et le web, Espace et Entrée pressent aussi le toggle qui a le focus clavier, et les touches fléchées, Début et Fin le déplacent ([Clavier](#keyboard)).
- Chaque plateforme dessine ce que l'app stylise : les toggles, la surface de ceux qui sont pressés et la piste du groupe.
