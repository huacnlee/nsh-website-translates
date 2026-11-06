---
title: "Radio"
description: "Radio et RadioGroup : un ensemble d'options parmi lesquelles l'utilisateur en choisit exactement une. Chaque radio gère les appuis, l'activation au clavier, l'état désactivé ainsi que son rôle et son état coché pour les lecteurs d'écran ; le groupe constitue l'ensemble ; l'apparence et la valeur relèvent de l'application."
group: base
demo: el-radio
source_hash: 051314109ae3d0b2
---

# Radio

Les radios proposent un ensemble d'options dont l'utilisateur en choisit exactement une : un forfait, un ordre de tri, un thème. Chaque `Radio` gère le comportement d'une option : les appuis, l'activation au clavier, l'état désactivé, ainsi que le rôle radio et son état coché pour les lecteurs d'écran. Un `RadioGroup` placé autour d'elles forme l'ensemble, que les lecteurs d'écran annoncent comme un seul groupe. L'apparence appartient à l'app : une radio n'a ni cercle, ni point, ni couleurs, ni tailles, ni libellé propres. Ses enfants sont l'indicateur et le libellé de l'app, et les classes `checked:` sur la radio, ou les classes `group-checked:` sur son contenu, suivent son état.

```rust tabs
use nsh_base::{radio, radio_group, theme};
use nsh_core::prelude::*;

fn plans() -> impl IntoElement {
    let plan = signal("basic");
    let option = move |value: &'static str, label: &'static str| {
        let checked = move || plan.get() == value;
        radio()
            .checked(checked)
            .on_change(move |_: &bool| plan.set(value))
            .flex_row()
            .items_center()
            .gap_2()
            .child(
                view()
                    .size(px(20.0))
                    .items_center()
                    .justify_center()
                    .rounded_full()
                    .border_2()
                    .border_color(move || theme().border)
                    .child(
                        view()
                            .size(px(10.0))
                            .rounded_full()
                            .bg(move || theme().primary)
                            .opacity(move || if checked() { 1.0_f32 } else { 0.0 }),
                    ),
            )
            .child(text(label))
    };
    radio_group()
        .gap_3()
        .child(option("basic", "Basic"))
        .child(option("pro", "Pro"))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Radio, RadioGroup } from "nsh/base";

function App() {
  const plan = signal("basic");
  const option = (value: string, label: string) => (
    <Radio
      checked={plan() === value}
      onChange={() => plan.set(value)}
      class="group flex-row items-center gap-2"
    >
      <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
        <View class="size-2.5 rounded-full group-checked:bg-primary" />
      </View>
      <Text>{label}</Text>
    </Radio>
  );
  return (
    <RadioGroup class="gap-3">
      {option("basic", "Basic")}
      {option("pro", "Pro")}
    </RadioGroup>
  );
}

mount(App);
```

`Radio` et `RadioGroup` viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : le groupe n'en détient aucune. Chaque radio sait si elle est cochée ; un appui sur une radio non cochée signale `onChange({ checked: true })`, l'app définit sa valeur, et chaque radio affiche le `checked` que l'app lui renvoie. En Rust, `radio()` et `radio_group()` les créent, avec un setter par prop (`.checked(..)`), un écouteur par événement (`.on_change(..)`), les méthodes de style typées et `.child(..)` pour leur contenu.

## Props

<a id="radio-1"></a>

### Radio

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Cochée ou non. Un appui sur une radio non cochée signale `true` avec `onChange` ; la radio affiche la valeur que l'app lui renvoie. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui et aucun retour d'appui ; les styles `disabled:` s'appliquent, et les lecteurs d'écran indiquent qu'elle est grisée. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style de la radio lorsqu'elle est cochée et non désactivée, sous forme de classes `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran : l'option, lorsque ses enfants n'ont aucun texte qui l'indique. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Distance, en points, au-delà de ses limites sur laquelle les appuis comptent encore : un nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | L'indicateur et le libellé de l'app, que les lecteurs d'écran énoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La radio elle-même : la ligne autour de l'indicateur et du libellé. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de la radio lorsqu'elle est pressée, survolée, ciblée par le focus ou désactivée, sous forme de classes `<state>:`. |

### RadioGroup

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | aucun | Les radios de l'ensemble, et tout ce que l'app dispose entre elles. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La mise en page et l'apparence du groupe : une colonne par défaut, `flex-row` pour une ligne. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` (`Radio`) | `.on_change(\|checked: &bool\| ..)` | Une radio non cochée a été pressée : un toucher, un clic, Espace ou Entrée lorsqu'elle a le focus clavier, ou l'activation par un lecteur d'écran ; ou bien une touche fléchée de son groupe a déplacé le focus clavier vers elle. Elle demande à être cochée, donc `checked` vaut `true`. L'événement s'exécute avant tout changement : la radio affiche le `checked` que l'app lui renvoie. |

Une radio cochée reste cochée et ne signale rien, car une radio ne peut pas se décocher elle-même ; une radio désactivée ne signale rien non plus.

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylée avec | États |
|---|---|---|---|
| Le groupe | | `RadioGroup` : `class`, `style` | |
| La radio | le groupe | `Radio` : `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `disabledStyle`, ...) |
| L'indicateur et le libellé | la radio | leurs propres éléments (`children`) | `group-checked:`, `group-disabled:` et les autres variantes `group-*:` avec `group` sur le `class` de la radio |

L'indicateur est le contenu de l'app : un anneau avec un point, une coche, une carte mise en évidence. Avec `group` sur le `class` de la radio, ses classes `group-checked:` affichent le point tant que la radio est cochée.

<a id="disabled"></a>

## Désactivée

Une radio désactivée ne reçoit aucun appui, et les lecteurs d'écran l'annoncent comme grisée. Ses classes `disabled:` s'appliquent par-dessus ses classes `checked:`, et les classes `group-disabled:` à l'intérieur suivent :

```tsx
<Radio
  checked={plan() === "team"}
  disabled={!eligible()}
  onChange={() => plan.set("team")}
  class="group flex-row items-center gap-2 disabled:opacity-50"
>
  <View class="size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary">
    <View class="size-2.5 rounded-full group-checked:bg-primary" />
  </View>
  <Text>Team</Text>
</Radio>
```

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Une radio sans libellé à côté (un point dans la ligne d'un tableau) peut être plus petite qu'un doigt. `hitSlop` fait compter les appuis qui tombent près d'elle, en points au-delà de chaque côté, sans modifier sa mise en page ni son apparence : un nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme le [`hitSlop` d'une vue](./index.md#presses-and-feedback) les accepte.

```tsx
<Radio
  checked={plan() === "team"}
  hitSlop={12}
  accessibilityLabel="Team"
  onChange={() => plan.set("team")}
  class="group size-5 items-center justify-center rounded-full border-2 border-border group-checked:border-primary"
>
  <View class="size-2.5 rounded-full group-checked:bg-primary" />
</Radio>
```

<a id="accessibility"></a>

## Accessibilité

- Une radio est un seul élément pour les lecteurs d'écran, avec le rôle `"radio"` et son état : cochée ou non, et sélectionnée lorsqu'elle est cochée, car certains lecteurs d'écran lisent l'un et d'autres l'autre (les radios d'UI Automation sont des éléments de sélection). Son indicateur et son libellé en font partie ; son libellé est le texte de ses enfants, ou `accessibilityLabel`.
- Un `RadioGroup` a le rôle `"radiogroup"` : les lecteurs d'écran entendent les radios qu'il contient comme un seul ensemble, chacune restant un élément à part entière.
- `disabled` est annoncé comme le fait la plateforme (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).
- Sur macOS et le web, un `RadioGroup` constitue un seul arrêt du focus clavier, et les touches fléchées se déplacent entre ses radios et les cochent (voir ci-dessous).

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, où Tab atteint les vues qui reçoivent des appuis, un `RadioGroup` suit le [modèle WAI-ARIA du groupe de boutons radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) :

| Touche | Effet |
|---|---|
| Tab, Maj+Tab | Entre dans le groupe sur la radio cochée (la première radio non désactivée si aucune ne l'est), et en sort en une seule étape. |
| Bas, Droite | Déplace le focus vers la radio suivante, de la dernière à la première, et la coche. |
| Haut, Gauche | Déplace le focus vers la radio précédente, de la première à la dernière, et la coche. |
| Espace | Coche la radio ayant le focus. |

Les touches fléchées ignorent les radios désactivées ; la radio vers laquelle elles se déplacent demande à être cochée avec `onChange`, et l'app la coche. Dans une mise en page de droite à gauche, Gauche et Droite s'inversent : Gauche passe à la radio suivante et Droite à la précédente ; Haut et Bas gardent leur sens. Les styles `focus:` montrent où se trouve le focus. Une `Radio` en dehors d'un `RadioGroup` est un arrêt à part entière, que Tab atteint et que Espace et Entrée cochent.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : un appui est un toucher qui se termine sur la radio, libellé compris.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, Espace et Entrée cochent aussi la radio qui a le focus clavier, et les touches fléchées le déplacent ([Clavier](#keyboard)).
- Chaque plateforme dessine ce que l'app stylise : l'indicateur, le libellé et leurs transitions.
