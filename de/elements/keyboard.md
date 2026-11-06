---
title: "Tastatur"
description: "Die Umgebungsvariable keyboard-inset-height, Keyboard.dismiss und die Höhe der Tastatur: Inhalte, die oberhalb der Software-Tastatur bleiben und sich mit ihr bewegen."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---


# Tastatur

`env(keyboard-inset-height)` ist die Höhe der Software-Tastatur über der Oberfläche, solange die Tastatur ausgeblendet ist, ist der Wert 0. Als unteres Padding oder Margin einer View hält sie den Inhalt oberhalb der Tastatur: Wenn die Tastatur ein- oder ausgeblendet wird, schafft die View Platz in Höhe der Tastatur, und die Änderung wird nativ mit der Tastatur animiert. Verwende sie für Inhalte außerhalb von Scroll-Views, etwa eine Nachrichtenleiste am unteren Rand eines Chat-Bildschirms; Eingabefelder innerhalb einer [Scroll-View](./scroll.md) oder einer [List](./list.md) werden nativ in den sichtbaren Bereich gescrollt. Dazu gehören `Keyboard.dismiss()`, das die Tastatur ausblendet, und die Höhe der Tastatur für eigene Layouts.

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

Die volle Tastaturhöhe eignet sich für eine View, die bis zum unteren Bildschirmrand reicht, etwa den Inhalt eines Bildschirms. Befindet sich darunter etwas, zum Beispiel eine Tab-Leiste, ziehst du diese mit einer Länge ab: `calc(env(keyboard-inset-height) + -49px)` hält eine View oberhalb einer 49 pt hohen Tab-Leiste, und `calc(env(keyboard-inset-height) + 12px)` fügt Abstand über der Tastatur hinzu. Ein Padding ist mindestens 0.

<a id="padding-or-margin"></a>

## Padding oder Margin

| Stil | So entsteht Platz |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | Der Inhalt darüber schrumpft; der Hintergrund reicht weiterhin bis zum unteren Bildschirmrand. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | Die gesamte View samt Hintergrund endet am oberen Rand der Tastatur. |

Die Tastaturhöhe wird nur der Länge in derselben Deklaration hinzugefügt, daher kombiniert eine View sie mit eigenem Abstand in `calc()`. In Rust fügen `.pb_keyboard_plus(px(..))` und `.mb_keyboard_plus(px(..))` eine Länge hinzu.

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

Hier deckt eine 49 pt hohe Tab-Leiste unterhalb der View bereits einen Teil der Tastaturhöhe ab. Um den Platz abzuschalten, lässt du die Variable im Stil weg, zum Beispiel über eine Bedingung auf einem Signal.

<a id="hiding-the-keyboard"></a>

## Die Tastatur ausblenden

`Keyboard.dismiss()` aus `nsh` entfernt den Fokus vom fokussierten Eingabefeld und blendet damit die Tastatur aus. Ist kein Eingabefeld fokussiert, bleibt alles unverändert. Rust-Komponenten rufen `dismiss_keyboard()` auf.

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
> Damit die Tastatur ausgeblendet wird, wenn der Benutzer eine Scroll-View zieht, setze `keyboardDismissMode="on-drag"` oder `"interactive"` auf der [Scroll-View](./scroll.md) oder der [List](./list.md).

<a id="the-keyboards-height"></a>

## Die Höhe der Tastatur

| TSX | Rust | Rückgabe |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | Die Höhe der Software-Tastatur über der NSH-Oberfläche in Punkten (0, solange sie ausgeblendet ist) sowie die Dauer ihrer Ein- bzw. Ausblendanimation in Millisekunden. |

Beide sind reaktiv: Ein Effect, ein JSX-Ausdruck oder eine Style-Closure, die sie liest, wird erneut ausgeführt, wenn die Tastatur ein- oder ausgeblendet wird oder ihre Höhe ändert.

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

Die Höhe ist der Teil der Tastatur, der die NSH-Oberfläche überlagert. Wenn das Fenster selbst für die Tastatur schrumpft (eine Android-Activity, die ihre Größe anpasst) oder wenn NSH in eine View eingebettet ist, die oberhalb der Tastatur endet, ist die Höhe 0.

> [!NOTE]
> Um Inhalte oberhalb der Tastatur zu halten, ist `env(keyboard-inset-height)` die einfachere Variante: Es animiert nativ mit der Tastatur, ohne dass Code ausgeführt wird.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- **iOS**: Der Platz wird mit der eigenen Dauer der Tastatur und einer Ease-in-ease-out-Kurve animiert.
- **Android**: Wenn das Fenster für die Tastatur schrumpft (eine Activity, die ihre Größe anpasst), endet der Inhalt bereits oberhalb der Tastatur, und die Variable ist 0. Wenn die Tastatur die View überlagert, schafft sie Platz wie unter iOS.
- **Desktops und Mac Catalyst** verwenden eine Hardware-Tastatur: Die Variable ist 0, und die View behält ihr Layout.
- **Web**: Die Variable ist die des Browsers (die der VirtualKeyboard API).

Siehe [Formulare und Tastatur](../docs/forms-and-keyboard.md) für Fokusreihenfolge, Return-Tasten und Eingabezubehör sowie [Safe Area](./safe-area.md) für die übrigen Umgebungsvariablen.
