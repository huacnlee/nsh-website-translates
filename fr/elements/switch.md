---
title: "Switch"
description: "Le composant Switch : un contrôle activé / désactivé qui gère les pressions, l'activation au clavier, l'état désactivé ainsi que son rôle et sa valeur pour les lecteurs d'écran, avec une piste et un curseur que l'application stylise."
group: base
demo: el-switch
source_hash: d203427a791f5543
---

# Switch

Un switch active ou désactive un réglage, et le changement prend effet immédiatement. Il gère le comportement : appuis, activation au clavier, état désactivé, ainsi que le rôle switch et sa valeur pour les lecteurs d'écran. L'apparence appartient à l'app : un `Switch` n'a ni couleurs, ni tailles, ni animation, ni libellé propres. Il est composé d'une piste (track) contenant un curseur (thumb), puis de ses enfants (un libellé), et l'app style chaque partie, avec des classes `checked:` et `disabled:` qui suivent le switch.

```rust tabs
use nsh_base::{switch, theme};
use nsh_core::prelude::*;

fn wifi() -> impl IntoElement {
    let on = signal(false);
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text("Wi-Fi"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Switch } from "nsh/base";

function App() {
  const on = signal(false);
  return (
    <Switch
      checked={on()}
      onChange={({ checked }) => on.set(checked)}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text>Wi-Fi</Text>
    </Switch>
  );
}

mount(App);
```

`Switch` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : un appui signale la valeur suivante avec `onChange`, et le switch affiche la valeur `checked` que l'app lui renvoie. En Rust, `switch()` en crée un avec un setter par prop (`.checked(..)`, `.track_style(..)`), un écouteur par événement (`.on_change(..)`), les méthodes de style typées pour le switch lui-même et `.child(..)` pour son libellé ; le style d'une partie accepte les méthodes d'état (`.checked(..)`, `.disabled_style(..)`) qui suivent le switch.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `checked` | `.checked(..)` | `boolean` | `false` | Activé ou désactivé. Un appui signale la valeur suivante avec `onChange` ; le switch affiche la valeur que l'app lui renvoie. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui et aucun retour visuel d'appui ; les styles `disabled:` s'appliquent au switch et à ses parties, et les lecteurs d'écran indiquent qu'il est grisé. |
| `checkedStyle` | `.checked_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style du switch lorsqu'il est `checked` et non désactivé, sous forme de classes `checked:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran : ce que le switch active, lorsque ses enfants ne contiennent pas de texte qui le dise. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La piste, la partie le long de laquelle le curseur se déplace. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le curseur, à l'intérieur de la piste. |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Jusqu'où, en dehors de ses limites, les appuis comptent encore, en points : un nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu après la piste : un libellé, que les lecteurs d'écran énoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le switch lui-même : la ligne qui entoure la piste et le libellé. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style du switch lorsqu'il est pressé, survolé, focalisé ou désactivé, sous forme de classes `<state>:`. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|checked: &bool\| ..)` | Le switch a été pressé : un tap, un clic, Espace ou Entrée lorsqu'il a le focus clavier, ou une activation par un lecteur d'écran. Il signale la valeur que le switch demande sous la forme `checked`, l'opposé de la valeur `checked` qu'il a. |

Un switch désactivé ne signale rien.

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylée avec | États |
|---|---|---|---|
| Le switch | | `class`, `style` | `checked:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `checkedStyle`, `disabledStyle`, ...) |
| La piste | le switch, en premier | `trackClass`, `trackStyle` | `checked:`, `disabled:` suivent le switch |
| Le curseur | la piste | `thumbClass`, `thumbStyle` | `checked:`, `disabled:` suivent le switch |
| Le libellé | le switch, après la piste | ses propres éléments (`children`) | `group-checked:` et les autres variantes `group-*:` avec `group` sur le `class` du switch |

Le curseur se déplace grâce à ses propres styles `checked:` : une translation (`checked:translate-x-5`), ou une marge ou l'alignement de la piste (`checked:justify-end` sur la piste). Une classe `transition-*` anime le changement de façon native. Pour placer le libellé avant la piste, inversez la ligne : `class="flex-row-reverse justify-between"`.

<a id="disabled"></a>

## Désactivé

Un switch désactivé n'accepte aucun appui, et les lecteurs d'écran l'annoncent comme grisé. Ses classes `disabled:` et celles de sa piste et de son curseur s'appliquent, par-dessus leurs classes `checked:` :

```tsx
<Switch
  checked={on()}
  disabled={!online()}
  onChange={({ checked }) => on.set(checked)}
  class="flex-row items-center gap-3 disabled:opacity-50"
  trackClass="w-11 rounded-full bg-muted p-0.5 checked:bg-primary disabled:bg-muted"
  thumbClass="size-5 rounded-full bg-background checked:translate-x-5"
>
  <Text>Sync over cellular</Text>
</Switch>
```

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Un switch sans libellé à côté peut être plus petit qu'un doigt. `hitSlop` fait compter les appuis qui tombent près de lui, en points au-delà de chaque côté, sans changer sa mise en page ni son apparence : un nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme les accepte le [`hitSlop` d'une vue](./index.md#presses-and-feedback).

```tsx
<Switch
  checked={on()}
  hitSlop={{ top: 8, bottom: 8 }}
  accessibilityLabel="Notifications"
  onChange={({ checked }) => on.set(checked)}
  trackClass="w-9 rounded-full bg-muted p-0.5 checked:bg-primary"
  thumbClass="size-4 rounded-full bg-background checked:translate-x-4"
/>
```

<a id="accessibility"></a>

## Accessibilité

- Un switch est un seul élément pour les lecteurs d'écran, avec le rôle `"switch"` et sa valeur (activé ou désactivé) ; la piste et le curseur en font partie. Son libellé est le texte de ses enfants ; renseignez `accessibilityLabel` lorsqu'il n'en a pas.
- `disabled` est annoncé comme la plateforme l'annonce (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).
- Sur macOS et le web, un switch est un point d'arrêt du focus clavier : Tab l'atteint, Espace et Entrée le basculent, et les styles `focus:` indiquent où se trouve le focus.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : un appui est un tap qui se termine sur le switch, libellé compris.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, Espace et Entrée basculent aussi le switch qui a le focus clavier.
- Chaque plateforme dessine ce que l'app style ; le curseur se déplace selon les styles et les transitions de l'app.
