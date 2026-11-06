---
title: "Button"
description: "Le composant Button : une cible d'appui qui gère les appuis, les états désactivé et sélectionné ainsi que son rôle pour les lecteurs d'écran, et dont le style est défini par l'application."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

Un bouton est une cible d'appui. Il gère le comportement : les appuis, le retour visuel d'appui via les styles d'état de l'app, les états désactivé et sélectionné, le focus clavier et son rôle pour les lecteurs d'écran. L'apparence appartient à l'app : un `Button` n'a ni couleurs, ni tailles, ni marges internes, ni libellé propres. Un même composant devient ainsi un bouton principal, un bouton d'icône, un onglet, une bascule de barre d'outils ou la ligne d'une liste, selon les styles et les enfants que vous lui donnez.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En TSX, son apparence passe par `class` et
`style`, avec les variantes d'état `active:`, `hover:`, `focus:`, `selected:` et `disabled:` (ou les
`activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` et `disabledStyle` correspondants). En Rust, `button()` en crée un
comme `view()` crée une vue : un setter par prop (`.disabled(..)`, `.selected(..)`), un écouteur par événement (`.on_press(..)`),
les méthodes de style typées (`.px_4()`, `.bg(..)`) pour son apparence, les méthodes d'état (`.active(..)`, `.hover(..)`,
`.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) pour ses états et `.child(..)` pour son contenu.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui et aucun retour visuel d'appui ; les styles `disabled:` s'appliquent et les lecteurs d'écran l'annoncent comme grisé. |
| `selected` | `.selected(..)` | `boolean` | `false` | Sélectionné : une bascule activée, l'onglet courant. Les lecteurs d'écran l'annoncent. L'app détient la valeur et la stylise. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style lorsque `selected` est vrai et que le bouton n'est pas désactivé, sous forme de classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran lorsque le contenu ne suffit pas, par exemple pour une icône. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | Ce qu'il est pour les lecteurs d'écran lorsqu'aucun composant `nsh/base` ne correspond à ce contrôle : `"link"` (il ouvre une URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Jusqu'où, hors de ses limites, les appuis comptent encore, en points : un nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu : du texte, une icône, n'importe quelle disposition. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Son apparence, en totalité. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style lorsqu'il est pressé, survolé, focalisé ou désactivé, sous forme de classes `<state>:`. Les états suivants l'emportent sur les précédents ; `disabled` l'emporte sur tous. |

En Rust, chaque prop est un setter qui accepte une valeur, un signal ou une closure ; les props omises gardent leur valeur par défaut :

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Le bouton a été pressé : un toucher, un clic, Return ou Espace lorsqu'il a le focus clavier, ou l'activation par un lecteur d'écran. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Un appui a commencé sur le bouton. |
| `onPressUp` | `.on_press_up(\|\| ..)` | L'appui s'est terminé : relâché, éloigné ou annulé. |

`onPressDown` et `onPressUp` servent à un retour visuel d'appui qui vous est propre, comme un ressort ou une surbrillance que les styles d'état n'expriment pas. Un bouton désactivé n'en signale aucun.

<a id="styling"></a>

## Style

L'apparence d'un bouton appartient à votre app : c'est elle qui décide ce qu'est un bouton principal ou secondaire. Une paire de petits composants permet de garder cette décision en un seul endroit :

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

Les variantes d'état sont appliquées nativement : un appui assombrit le bouton sur le thread principal, sans exécuter de JS ni de Rust.
En Rust, les méthodes d'état correspondent aux mêmes variantes : `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` et
`.disabled_style(..)` suivent les états propres du bouton. Les couleurs de votre thème fonctionnent de la même façon : `bg-primary` en TSX,
`theme().primary` en Rust (voir [Theme tokens](../docs/tailwind.md#theme-tokens)).

<a id="disabled"></a>

## Désactivé

Un bouton désactivé ne reçoit aucun appui et ne donne aucun retour visuel, et les lecteurs d'écran l'annoncent comme grisé. Son apparence une fois désactivé vous appartient, avec des classes `disabled:` ou `disabledStyle` :

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## Une bascule avec selected

`selected` fait d'un bouton une bascule : le bouton gras d'une barre d'outils, une puce de filtre, l'onglet courant. L'app détient la valeur,
l'inverse dans `onPress` et stylise l'état sélectionné ; les lecteurs d'écran annoncent le bouton comme sélectionné.

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Une rangée d'onglets se construit avec [`Tabs`](./tabs.md) et un contrôle activé / désactivé avec [`Switch`](./switch.md), issus de `nsh/base` : ils gèrent le rôle, l'état sélectionné et le clavier propres à leur type, ce que ne fait pas un `Button` avec `role="tab"` ou `role="switch"`.

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Un bouton d'icône peut être plus petit qu'un doigt. `hitSlop` fait compter les appuis qui tombent près de lui, en points au-delà de chaque côté,
sans changer sa disposition ni son apparence : un nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme
les accepte le [`hitSlop` d'une vue](./index.md#presses-and-feedback).

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## Accessibilité

- Un bouton est un seul élément pour les lecteurs d'écran, avec le rôle `"button"` sauf indication contraire de `role`. Son libellé est son
  contenu textuel ; donnez `accessibilityLabel` lorsque le contenu est une icône ou en dit trop peu.
- `disabled` et `selected` sont annoncés comme la plateforme les annonce (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité
  du navigateur).
- Sur macOS et le web, un bouton est une étape du focus clavier : Tab l'atteint, Return et Espace l'actionnent, et
  les styles `focus:` montrent où se trouve le focus.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS, Android et Mac Catalyst : un appui est un toucher qui se termine sur le bouton ; s'éloigner l'annule, comme avec les
  boutons du système.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, Return et Espace
  actionnent aussi le bouton qui a le focus clavier. Les styles `hover:` s'appliquent avec une souris ou le pointeur d'un trackpad.
- Chaque plateforme dessine ce que l'app stylise : le retour visuel d'appui est `active:` / `activeStyle` ou une animation de votre cru.
