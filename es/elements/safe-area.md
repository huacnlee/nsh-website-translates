---
title: "Área segura"
description: "Las variables de entorno safe-area-inset y los accesores safeArea y safeAreaInsets: contenido que se mantiene libre del notch, la barra de estado, el indicador de inicio y los encabezados."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---


# Área segura

El área segura mantiene el contenido alejado del notch o la Dynamic Island, la barra de estado, el indicador de inicio, un encabezado de navegación y la barra de título de Mac Catalyst. Cualquier vista se ajusta a ella con el `env()` de CSS:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` y
`env(safe-area-inset-left)`, en su padding o margin. Son los insets de la vista raíz en la que se renderiza el nodo:
dentro de una [NavPage](./nav-stack.md), los insets situados bajo el encabezado de la página; dentro de un [Dialog](./dialog.md), los insets del diálogo; y en cualquier otro caso, el área segura de la superficie. En un navegador la página es la raíz, y las variables son las propias del navegador.

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

El color de fondo llena toda el área, incluida la zona detrás de la barra de estado, y el contenido comienza debajo de ella. Los valores siguen a los insets: al rotar el dispositivo, o en otra página o diálogo, el padding se actualiza de forma nativa.

<a id="values"></a>

## Valores

| Valor | Ejemplo | Significado |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | El inset. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | El inset; la longitud sustituye a un nombre desconocido, como en CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | El inset más una longitud, para contenido que mantiene su propio espaciado. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | Lo mismo. |

Se aplican a `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` y a las mismas claves de `margin`. En Tailwind son valores arbitrarios de las utilidades `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` y `m` (se pueden omitir los espacios): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. El tipo de TypeScript de estos valores es `EnvValue`. Consulta
[la referencia de estilos](../modules/style-reference.md).

En Rust, los métodos de `Styled` los establecen: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, los mismos métodos de `m`, y `.pt_safe_area_plus(px(16.0))`
(y `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) para un inset más una longitud.

<a id="choosing-the-edges"></a>

## Elegir los bordes

Aplica padding solo a los bordes que lo necesiten, por ejemplo cuando una barra de pestañas o una barra inferior propia se encarga del inset inferior:

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

## Dónde usarlo

Una [NavPage](./nav-stack.md) con un encabezado visible y opaco ya coloca su contenido debajo del encabezado, por lo que el inset superior es 0. Los insets del área segura sirven para:

- la raíz de una app sin pila de navegación,
- una página con `headerVisible={false}` o `headerTransparent`,
- el contenido de un [Dialog](./dialog.md) a pantalla completa,
- barras propias en los bordes de la pantalla.

<a id="safearea-and-safeareainsets"></a>

## safeArea y safeAreaInsets

Cuando necesites los números en el código, léelos directamente. Ambos accesores de TSX provienen de `nsh`, devuelven un objeto `Edges` (`{ top, right, bottom, left }` en puntos) y son reactivos: el código que los lee se vuelve a ejecutar cuando cambian, por ejemplo al rotar el dispositivo.

| TSX | Rust | Devuelve |
|---|---|---|
| `safeArea()` | `safe_area()` | El área segura de la superficie: las partes libres de la interfaz del sistema (notch, indicador de inicio, barra de título). |
| `safeAreaInsets()` | `cx.insets()` | Los insets del lugar donde se renderiza el componente: los de la página más cercana (bajo su encabezado), los del diálogo más cercano o, si no hay ninguno, el área segura de la superficie. Son los valores de las variables `safe-area-inset-*`. En TSX, llámalo dentro de un componente; devuelve un accesor. Un componente Rust de tu crate los lee con `cx.insets()`. |

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

Para aplicar padding con el propio inset, `env()` es la forma más sencilla: se actualiza de forma nativa, sin ejecutar código.

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: los insets provienen del área segura de UIKit: la barra de estado, el notch o la Dynamic Island, y el indicador de inicio.
- **Android**: NSH informa de las partes de las barras del sistema y del recorte de pantalla que se superponen con la vista de NSH. Cuando NSH está [integrado](../docs/android.md) bajo una barra de herramientas nativa, el inset superior de la vista es 0.
- **Mac Catalyst**: el inset superior es la barra de título de la ventana.
- **Escritorio (macOS, Windows, Linux, GPUI) y la web**: el contenido de una página comienza debajo de su `header`, y un diálogo da a su contenido insets propios, igual que en los teléfonos.

<a id="related"></a>

## Relacionado

- [Teclado](./keyboard.md): `env(keyboard-inset-height)`, contenido que se mantiene por encima del teclado en pantalla.
- [Dispositivo y entorno](../docs/device-and-environment.md): el área segura entre los demás valores del dispositivo.
