---
title: "Dialog"
description: "El componente Dialog: una superficie modal sobre todo lo demás, para flujos de pantalla completa, hojas y diálogos que la aplicación estiliza."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---


# Dialog

Un diálogo presenta contenido sobre el resto de la app en su propia capa de ventana nativa: un view controller presentado en iOS y Mac Catalyst, un Dialog en Android, una capa sobre toda la ventana en los escritorios y la web. Se usa para flujos a pantalla completa, sheets y diálogos. Los gestos propios del sistema (deslizar una sheet hacia abajo, el botón atrás de Android, Escape) funcionan y se deciden de forma nativa. Rust crea uno con `nsh_base::dialog()`, TSX con `<Dialog>` desde `nsh/base`.

El diálogo se encarga de su comportamiento y deja su aspecto a la app: sus estilos dan estilo al popup (la vista que contiene a los hijos), y en TSX `backdropClass` / `backdropStyle` añaden un backdrop detrás de él.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

En TSX, el diálogo se muestra mientras `open` no sea `false` y se cierra cuando pasa a ser `false`. En Rust, se presenta mientras está en la vista y se descarta cuando sale de ella, por lo que `when` lo conserva. En ambos casos entrega a su contenido los insets de safe area del diálogo, que leen las variables [`env(safe-area-inset-*)`](./safe-area.md) y `safeAreaInsets()` (`cx.insets()` en un componente de Rust) dentro de él. [`Button`](./button.md), también de `nsh/base`, es un objetivo de pulsación al que la app da estilo.

`nsh_core::prelude` también tiene una función `dialog` más antigua y obsoleta: importa `nsh_base::dialog` por nombre, como arriba, y la importación explícita ocupa su lugar. Para la alerta o la action sheet del sistema, usa [`AlertDialog`](./alert-dialog.md).

## Props

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `open` | en la vista mientras está abierto (`when(open, ..)`) | `boolean` | `true` | Se muestra mientras sea true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | Cómo entra y sale. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | ninguno | Entra y sale mediante un shader WGSL en lugar de su `animation`: `shade(uv)` lee lo que hay detrás como `sample_from` y el diálogo como `sample_to` mientras `nsh.progress` va de 0 a 1 durante `duration` milisegundos (350 por defecto), y de 1 de vuelta a 0 al cerrarse. Cuando el sistema pide menos movimiento, usa su propio `animation`. Consulta [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | Su forma en iOS: `fullScreen` cubre la pantalla con un fondo transparente; `pageSheet` y `formSheet` son sheets del sistema que mantienen visible lo que hay detrás (`formSheet` es una sheet centrada más pequeña en pantallas grandes). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape y el botón atrás de Android lo cierran de forma nativa. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Una pulsación en el backdrop lo cierra. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Deslizar una sheet hacia abajo (iOS, navegadores de teléfono) la cierra de forma nativa. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | ninguno | iOS y Android: la barra de estado mientras el diálogo está abierto, por encima de la de las páginas ([Barra de estado](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Terminó de aparecer. |
| `onClose` | `.on_close(..)` | `() => void` | | Desapareció: el usuario lo cerró o la app lo quitó. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | El usuario intentó cerrarlo (Escape, atrás, una pulsación en el backdrop, un deslizamiento hacia abajo), haya permitido o no un flag `closeOn*` que se cerrara. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | El usuario lo cerró: mantén `open` sincronizado aquí. En Rust, `on_cancel` quita el diálogo de la vista. |
| `class`, `style` | métodos `Styled` | `string`, `StyleProp<ViewStyle>` | | El popup: la vista que contiene a los hijos. |
| `backdropClass`, `backdropStyle` | una vista hija que llena el diálogo | `string`, `StyleProp<ViewStyle>` | | Un backdrop que llena el diálogo detrás del popup, presente cuando se define cualquiera de los dos. |
| `children` | `.child(..)` | `JSX.Element` | | El contenido. |

| Clave de `ios` | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | las del presentador | Las orientaciones que permite el diálogo. |

| Clave de `android` | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | El contenido llega por debajo de la barra de estado; si no, empieza debajo de ella. |

<a id="opening-and-closing"></a>

## Apertura y cierre

El estado del diálogo pertenece a la app. Cuando el usuario cierra el diálogo (Escape, el botón atrás de Android, una pulsación en el backdrop, una sheet deslizada hacia abajo), este se cierra de forma nativa y se lo comunica a la app, que ajusta su estado para que coincida: `onOpenChange({ open: false, reason })` en TSX, `on_cancel` en Rust. En TSX, mientras `open` siga siendo `true` el diálogo permanece cerrado, y se vuelve a abrir cuando `open` pasa de `false` a `true`.

Cada flag `closeOn*` se lee de forma nativa cuando el usuario actúa, ya que el hilo principal nunca espera al código de la app. Para pedir confirmación antes de cerrar, establece los flags en `false`: el intento llama entonces a `onCancel`, y la app cierra el diálogo por sí misma (en TSX estableciendo `open` en `false`, en Rust quitándolo de la vista):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` se llama en cada intento, ya sea que los flags permitan o no que el diálogo se cierre.

<a id="a-dialog-with-a-backdrop"></a>

## Un diálogo con backdrop

Un diálogo con la presentación `fullScreen` por defecto muestra lo que dibuja la app: aquí un backdrop atenuado y una tarjeta centrada sobre él. Una pulsación en el backdrop lo cierra:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

Para la alerta o la action sheet del sistema, usa [`AlertDialog`](./alert-dialog.md) de `nsh/base`.

<a id="ref-methods"></a>

## Métodos de ref

Ninguno.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS y Mac Catalyst: `presentation` elige la forma. `fullScreen` se presenta sobre la pantalla completa con un fondo transparente; `pageSheet` y `formSheet` son sheets del sistema con el fondo del sistema, que siguen al dedo al deslizarlas hacia abajo (`closeOnSwipe`).
- Android: el diálogo llena la ventana y muestra el popup y el backdrop de la app. El botón atrás se dirige primero al diálogo más superior, antes que a las pilas y a los listeners de `BackHandler`.
- Escritorios (macOS, Windows, Linux, GPUI) y la web: el diálogo es una capa transparente sobre toda la ventana que muestra el popup y el backdrop de la app. Escape es un intento de cierre.
- `supportedOrientations` es de iOS; `statusBarTranslucent` es de Android. El contenido de un diálogo de Android empieza debajo de la barra de estado a menos que se defina `statusBarTranslucent`.
