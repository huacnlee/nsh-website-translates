---
title: "Checkbox"
description: "Le composant Checkbox : un contrôle coché, décoché ou indéterminé qui gère les pressions, l'activation au clavier, l'état désactivé ainsi que son rôle et sa valeur pour les lecteurs d'écran, avec un indicateur que l'application stylise et marque."
group: base
demo: el-checkbox
source_hash: c31b1f22eacafd92
---

# Checkbox

Une checkbox sélectionne une option, un élément d'une liste, ou tous. Elle est cochée, décochée ou indéterminée (ni l'un ni l'autre : un « tout sélectionner » sur une sélection partielle). Elle porte le comportement : les pressions, l'activation au clavier, l'état désactivé, ainsi que le rôle checkbox et sa valeur pour les lecteurs d'écran. L'apparence appartient à l'app : un `Checkbox` n'a ni case, ni coche, ni couleurs, ni tailles, ni libellé propres. Il est composé d'un indicateur (la case) contenant la coche de l'app, puis de ses enfants (un libellé), et l'app style chaque partie, avec des classes `checked:`, `indeterminate:` et `disabled:` qui suivent la checkbox.

```rust tabs
use nsh_base::{checkbox, theme};
use nsh_core::prelude::*;

fn notify() -> impl IntoElement {
    let on = signal(false);
    checkbox()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded_md()
                .border_2()
                .border_color(move || theme().border)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || if on.get() { "✓" } else { "" }).text_color(move || theme().primary_foreground))
        .child(text("Notify me"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Checkbox } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Checkbox
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-md border-2 border-border transition-colors checked:border-primary checked:bg-primary"
      indicator={<Text class="text-primary-foreground">{on() ? "✓" : ""}</Text>}
    >
      <Text>Notify me</Text>
    </Checkbox>
  );
}

mount(App);
```

`Checkbox` vient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` de Rust. La valeur appartient à l'app : une pression signale la valeur suivante avec `onChange`, et la checkbox affiche les `checked` et `indeterminate` que l'app lui renvoie. En Rust, `checkbox()` en construit une avec un setter par prop (`.checked(..)`, `.indicator_style(..)`), un écouteur par événement (`.on_change(..)`), les méthodes de style typées pour la checkbox elle-même et `.child(..)` pour son libellé ; le style de l'indicateur accepte les méthodes d'état (`.checked(..)`, `.indeterminate(..)`, `.disabled_style(..)`) qui suivent la checkbox.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Cochée ou non. Une pression signale la valeur suivante avec `onChange` ; la checkbox affiche la valeur que l'app lui renvoie. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | Ni cochée ni décochée, par-dessus `checked` tant qu'elle est vraie : les lecteurs d'écran indiquent qu'elle est mixte, et une pression demande l'état coché. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucune pression et aucun retour de pression ; les styles `disabled:` s'appliquent à la checkbox et à son indicateur, et les lecteurs d'écran l'annoncent comme grisée. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style de la checkbox lorsqu'elle est cochée et non désactivée, sous forme de classes `checked:`. |
| `indeterminateStyle` | `.indeterminate_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style de la checkbox lorsqu'elle est indéterminée et non désactivée, sous forme de classes `indeterminate:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran : ce que la checkbox sélectionne, lorsque ses enfants n'ont pas de texte qui le dise. |
| `role` | `.role(..)` | `AccessibilityRole` | `"checkbox"` | Ce que c'est pour les lecteurs d'écran, lorsque c'est quelque chose de plus précis (un élément de menu coché : `"menuitem"`). |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur, la case qui montre la valeur. |
| `indicator` | `.indicator(..)` | `JSX.Element` | aucun | Le contenu de l'indicateur : la coche (une coche, un tiret), que l'app affiche selon sa valeur. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Jusqu'où, en dehors de ses limites, les pressions comptent encore, en points : un nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu après l'indicateur : un libellé, que les lecteurs d'écran énoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La checkbox elle-même : la ligne autour de l'indicateur et du libellé. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de la checkbox lorsqu'elle est pressée, survolée, qu'elle a le focus ou qu'elle est désactivée, sous forme de classes `<state>:`. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | La checkbox a été pressée : un toucher, un clic, Espace ou Entrée lorsqu'elle a le focus clavier, ou l'activation par un lecteur d'écran. Elle signale la valeur que la checkbox demande sous la forme `checked` : `true` depuis décochée et depuis indéterminée, `false` depuis cochée. |

Une checkbox désactivée ne signale rien.

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylée avec | États |
|---|---|---|---|
| La checkbox | | `class`, `style` | `checked:`, `indeterminate:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `indeterminateStyle`, `disabledStyle`, ...) |
| L'indicateur | la checkbox, en premier | `indicatorClass`, `indicatorStyle` | `checked:`, `indeterminate:`, `disabled:` suivent la checkbox |
| La coche | l'indicateur | ses propres éléments (`indicator`) | `group-checked:`, `group-indeterminate:` et les autres variantes `group-*:` avec `group` sur `indicatorClass` |
| Le libellé | la checkbox, après l'indicateur | ses propres éléments (`children`) | variantes `group-*:` avec `group` sur le `class` de la checkbox |

La coche est le contenu de l'app : elle montre donc ce que l'app décide. Une coche lorsque la checkbox est cochée et un tiret lorsqu'elle est indéterminée, choisis d'après la valeur que l'app détient, ou bien les deux marques avec des classes `group-checked:` / `group-indeterminate:` qui choisissent celle qui est affichée.

<a id="indeterminate"></a>

## Indéterminé

Une checkbox « tout sélectionner » est indéterminée tant que certains éléments sont sélectionnés. Une pression demande l'état coché, et l'app sélectionne tous les éléments :

```tsx
const selected = signal<string[]>([]);
const all = () => selected().length === items.length;
const some = () => selected().length > 0 && !all();

<Checkbox
  checked={all()}
  indeterminate={some()}
  onChange={({ checked }) => selected.set(checked ? items.map((i) => i.id) : [])}
  class="flex-row items-center gap-2"
  indicatorClass="group size-5 items-center justify-center rounded-md border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
  indicator={
    <>
      <Text class="hidden text-primary-foreground group-checked:flex">✓</Text>
      <View class="hidden h-0.5 w-2.5 bg-primary-foreground group-indeterminate:flex" />
    </>
  }
>
  <Text>Select all</Text>
</Checkbox>
```

<a id="disabled"></a>

## Désactivée

Une checkbox désactivée ne prend aucune pression, et les lecteurs d'écran l'annoncent comme grisée. Ses classes `disabled:` et celles de son indicateur s'appliquent, par-dessus leurs classes `checked:` et `indeterminate:` :

```tsx
<Checkbox
  checked={on()}
  disabled={locked()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-2 disabled:opacity-50"
  indicatorClass="size-5 rounded-md border-2 border-border checked:border-primary checked:bg-primary disabled:border-border disabled:bg-muted"
>
  <Text>Share usage data</Text>
</Checkbox>
```

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Une checkbox sans libellé à côté (la case de sélection d'une ligne) peut être plus petite qu'un doigt. `hitSlop` fait compter les pressions qui tombent près d'elle, en points au-delà de chaque côté, sans changer sa mise en page ni son apparence : un nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme le prend le [`hitSlop` d'une vue](./index.md#presses-and-feedback).

```tsx
<Checkbox
  checked={selected()}
  hitSlop={12}
  accessibilityLabel="Select row"
  onChange={({ checked }) => selected.set(checked)}
  indicatorClass="size-4 rounded border border-border checked:bg-primary"
/>
```

<a id="accessibility"></a>

## Accessibilité

- Une checkbox est un seul élément pour les lecteurs d'écran, avec le rôle `"checkbox"` (ou son `role`) et sa valeur : cochée, décochée, ou mixte lorsqu'elle est indéterminée. L'indicateur et la coche en font partie. Son libellé est le texte de ses enfants ; donnez `accessibilityLabel` lorsqu'elle n'en a pas.
- `disabled` est annoncé comme la plateforme l'annonce (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).
- Sur macOS et le web, une checkbox est un arrêt du focus clavier : Tab l'atteint, Espace et Entrée la basculent, et les styles `focus:` montrent où est le focus.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, rôles et annonces en général.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : une pression est un toucher qui se termine sur la checkbox, libellé compris.
- Ordinateurs (macOS, Windows, Linux, GPUI) et le web : une pression est un clic. Sur macOS et le web, Espace et Entrée basculent aussi la checkbox qui a le focus clavier.
- Chaque plateforme dessine ce que l'app style : l'indicateur, la coche et leurs transitions.
