---
title: "Sicherer Bereich"
description: "Die Umgebungsvariablen safe-area-inset sowie die Accessoren safeArea und safeAreaInsets: Inhalte, die frei von der Notch, der Statusleiste, dem Home-Indikator und Headern gehalten werden."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---


# Sicherer Bereich

Der Safe Area hält Inhalte frei von der Notch bzw. der Dynamic Island, der Statusleiste, dem Home-Indikator, einem Navigations-Header und der Mac-Catalyst-Titelleiste. Jede View kann sich per CSS-`env()` um diesen Bereich einrücken:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` und
`env(safe-area-inset-left)`, in ihrem Padding oder Margin. Das sind die Insets der Root-View, in der der Knoten gerendert wird:
innerhalb einer [NavPage](./nav-stack.md) die Insets unterhalb des Headers der Seite, innerhalb eines [Dialog](./dialog.md) die Insets des Dialogs und andernfalls der Safe Area der Surface. In einem Browser ist die Seite die Root, und die Variablen sind die des Browsers selbst.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

Die Hintergrundfarbe füllt den gesamten Bereich aus, einschließlich des Bereichs hinter der Statusleiste, und der Inhalt beginnt darunter. Die Werte folgen den Insets: Bei Rotation oder in einer anderen Seite bzw. einem anderen Dialog aktualisiert sich das Padding nativ.

<a id="values"></a>

## Werte

| Wert | Beispiel | Bedeutung |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | Der Inset. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | Der Inset; die Längenangabe dient als Ersatz für einen unbekannten Namen, wie in CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | Der Inset plus eine Länge, für Inhalte, die ihren eigenen Abstand behalten. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | Dasselbe. |

Sie gelten für `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` und dieselben `margin`-Schlüssel. In Tailwind sind sie beliebige Werte der Utilities `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` und `m` (Leerzeichen dürfen weggelassen werden): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. Der TypeScript-Typ dieser Werte ist `EnvValue`. Siehe
[die Style-Referenz](../modules/style-reference.md).

In Rust setzen die `Styled`-Methoden sie: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, dieselben `m`-Methoden sowie `.pt_safe_area_plus(px(16.0))`
(und `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) für einen Inset plus eine Länge.

<a id="choosing-the-edges"></a>

## Die Kanten auswählen

Rücke nur die Kanten ein, die es brauchen, zum Beispiel wenn eine Tab-Leiste oder eine eigene untere Leiste den unteren Inset übernimmt:

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## Wann man es verwendet

Eine [NavPage](./nav-stack.md) mit sichtbarem, opakem Header platziert ihren Inhalt bereits unterhalb des Headers, daher ist der obere Inset dort 0. Die Safe-Area-Insets sind gedacht für:

- die Root einer App ohne Navigationsstack,
- eine Seite mit `headerVisible={false}` oder `headerTransparent`,
- den Inhalt eines Vollbild-[Dialog](./dialog.md),
- eigene Leisten an den Rändern des Bildschirms.

<a id="safearea-and-safeareainsets"></a>

## safeArea und safeAreaInsets

Wenn du die Zahlen im Code brauchst, lies sie direkt aus. Beide TSX-Accessoren stammen aus `nsh`, geben ein `Edges`-Objekt zurück (`{ top, right, bottom, left }` in Punkten) und sind reaktiv: Code, der sie liest, wird erneut ausgeführt, wenn sie sich ändern, zum Beispiel bei Rotation.

| TSX | Rust | Rückgabe |
|---|---|---|
| `safeArea()` | `safe_area()` | Der Safe Area der Surface: die Bereiche, die frei von System-UI sind (Notch, Home-Indikator, Titelleiste). |
| `safeAreaInsets()` | `cx.insets()` | Die Insets dort, wo die Komponente gerendert wird: die der nächsten Seite (unterhalb ihres Headers), die des nächsten Dialogs oder sonst der Safe Area der Surface. Das sind die Werte der `safe-area-inset-*`-Variablen. In TSX rufst du sie in einer Komponente auf; sie gibt einen Accessor zurück. Eine Rust-Komponente deiner Crate liest sie mit `cx.insets()`. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

Für Padding um den Inset selbst ist `env()` die einfachere Form: Es aktualisiert sich nativ, ohne dass Code ausgeführt wird.

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- **iOS**: Die Insets stammen vom Safe Area von UIKit: der Statusleiste, der Notch bzw. der Dynamic Island und dem Home-Indikator.
- **Android**: NSH meldet die Teile der System-Bars und des Display-Cutouts, die die NSH-View überlappen. Wenn NSH unterhalb einer nativen Toolbar [eingebettet](../docs/android.md) ist, beträgt der obere Inset der View 0.
- **Mac Catalyst**: Der obere Inset ist die Titelleiste des Fensters.
- **Desktops (macOS, Windows, Linux, GPUI) und das Web**: Der Inhalt einer Seite beginnt unterhalb ihres `header`, und ein Dialog gibt seinem Inhalt eigene Insets, wie auf den Smartphones.

<a id="related"></a>

## Siehe auch

- [Keyboard](./keyboard.md): `env(keyboard-inset-height)`, Inhalte, die oberhalb der Software-Tastatur bleiben.
- [Device and environment](../docs/device-and-environment.md): der Safe Area unter den übrigen Werten des Geräts.
