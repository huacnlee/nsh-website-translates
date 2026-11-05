---
title: "Clavier"
description: "La variable d'environnement keyboard-inset-height, Keyboard.dismiss et la hauteur du clavier : un contenu qui reste au-dessus du clavier logiciel et se déplace avec lui."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# Clavier

`env(keyboard-inset-height)` est la hauteur du clavier logiciel au-dessus de la surface, 0 tant qu'il est masqué. Utilisée comme padding ou margin du bas d'une vue, elle maintient le contenu au-dessus du clavier : lorsque le clavier s'affiche ou se masque, la vue fait de la place de sa hauteur, et le changement s'anime nativement avec le clavier. Utilisez-la pour le contenu en dehors des scroll views, comme une barre de message en bas d'un écran de discussion ; les champs de saisie à l'intérieur d'une [scroll view](./scroll.md) ou d'une [List](./list.md) sont amenés à l'écran nativement par défilement. Elle s'accompagne de `Keyboard.dismiss()`, qui masque le clavier, et de la hauteur du clavier, pour vos propres mises en page.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

La hauteur complète du clavier convient à une vue qui atteint le bas de l'écran, comme le contenu d'un écran. Lorsque quelque chose se trouve en dessous, comme une barre d'onglets, soustrayez-le avec une longueur : `calc(env(keyboard-inset-height) + -49px)` maintient une vue au-dessus d'une barre d'onglets de 49 pt, et `calc(env(keyboard-inset-height) + 12px)` ajoute un espacement au-dessus du clavier. Un padding vaut au minimum 0.

<a id="padding-or-margin"></a>

## Padding ou margin

| Style | Comment la place est faite |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | Le contenu au-dessus rétrécit ; l'arrière-plan atteint toujours le bas de l'écran. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | La vue entière, arrière-plan compris, s'arrête en haut du clavier. |

La hauteur du clavier n'est ajoutée à la longueur que dans la même déclaration ; une vue la combine donc avec son propre espacement dans `calc()`. En Rust, `.pb_keyboard_plus(px(..))` et `.mb_keyboard_plus(px(..))` ajoutent une longueur.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

Ici, une barre d'onglets de 49 pt située sous la vue couvre déjà une partie de la hauteur du clavier. Pour désactiver cette place, laissez la variable en dehors du style, par exemple avec une condition sur un signal.

<a id="hiding-the-keyboard"></a>

## Masquer le clavier

`Keyboard.dismiss()`, provenant de `nsh`, retire le focus du champ de saisie ayant le focus, ce qui masque le clavier. Si aucun champ n'a le focus, rien ne change. Les composants Rust appellent `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> Pour masquer le clavier lorsque l'utilisateur fait glisser une scroll view, définissez `keyboardDismissMode="on-drag"` ou `"interactive"` sur la [scroll view](./scroll.md) ou la [List](./list.md).

<a id="the-keyboards-height"></a>

## La hauteur du clavier

| TSX | Rust | Retourne |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | La hauteur du clavier logiciel au-dessus de la surface NSH, en points (0 tant qu'il est masqué), et la durée de son animation d'affichage ou de masquage, en millisecondes. |

Les deux sont réactives : un effet, une expression JSX ou une closure de style qui les lit s'exécute à nouveau lorsque le clavier s'affiche, se masque ou change de hauteur.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

La hauteur correspond à la partie du clavier qui recouvre la surface NSH. Lorsque la fenêtre elle-même se réduit pour laisser place au clavier (une activité Android qui se redimensionne), ou lorsque NSH est intégré dans une vue qui se termine au-dessus du clavier, la hauteur vaut 0.

> [!NOTE]
> Pour maintenir le contenu au-dessus du clavier, `env(keyboard-inset-height)` est la forme la plus simple : elle s'anime nativement avec le clavier, sans exécuter de code.

<a id="platform-notes"></a>

## Notes par plateforme

- **iOS** : la place s'anime avec la durée propre au clavier et une courbe ease-in-ease-out.
- **Android** : lorsque la fenêtre se réduit pour laisser place au clavier (une activité qui se redimensionne), le contenu se termine déjà au-dessus du clavier et la variable vaut 0. Lorsque le clavier recouvre la vue, elle fait de la place comme sur iOS.
- **Ordinateurs de bureau et Mac Catalyst** : la saisie se fait avec un clavier physique ; la variable vaut 0 et la vue conserve sa mise en page.
- **Web** : la variable est celle du navigateur (celle de l'API VirtualKeyboard).

Consultez [Formulaires et clavier](../docs/forms-and-keyboard.md) pour l'ordre du focus, les touches de retour et les accessoires de saisie, et [Safe area](./safe-area.md) pour les autres variables d'environnement.
