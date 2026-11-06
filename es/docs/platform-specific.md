---
title: "Código específico de plataforma"
description: "Cómo escribir una sola app para teléfonos, escritorio y navegadores: props exclusivas de cada plataforma en ios={{}} / android={{}} / desktop={{}} / web={{}}, los módulos nsh/mobile y nsh/desktop, platform.os y platform.select, y variantes de Tailwind por plataforma."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---


# Código específico de plataforma

Un mismo bundle de NSH se ejecuta en iOS, Android, macOS, Windows y Linux (y en Mac Catalyst), y en los navegadores mediante el [web runtime](./web.md). La mayor parte de una app no necesita ninguna comprobación de plataforma: los elementos, los estilos, el layout y los módulos se comportan igual en todas partes, y los componentes que construyes con ellos se ven igual en todas partes. Cuando algo realmente es específico de una plataforma, NSH le da un lugar claro, de modo que el código de plataforma sea visible y quede acotado:

| Rust | TSX | Para |
|---|---|---|
| [Métodos builder (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Props que solo tiene una plataforma. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | APIs que solo tienen las plataformas móviles o solo los escritorios. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Elegir valores o código según la plataforma. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [clases `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Estilos por plataforma. |

<a id="desktop-and-mobile"></a>

## Escritorio y móvil

Toda plataforma es de escritorio o móvil, según una única regla. Escritorio es macOS, Windows, Linux y los navegadores en el idioma de escritorio (un ratón y una ventana ancha, [la web](./web.md)). Móvil es iOS, Android y los navegadores en el idioma de teléfono o tableta; Mac Catalyst ejecuta el backend de iOS, así que también es móvil, con props `ios={{…}}`. Las props `desktop={{…}}`, `platform.select({ desktop, mobile })`, `platform.desktop` y `platform.idiom === "desktop"` siguen todas esta regla, igual que los componentes de `nsh/base` (un menú es un popup en escritorio y una hoja en móvil) y, en Rust, `is_desktop()`.

El `isAvailable` de `nsh/desktop` responde a una pregunta más acotada: si las APIs de ventana y menú de ese módulo funcionan, lo cual ocurre en macOS, Windows y Linux. Condiciona el layout, la densidad y la entrada con `platform.desktop`, y las llamadas a `Window` y `Menu` con `isAvailable`.

<a id="platform-only-props"></a>

## Props exclusivas de una plataforma

En Rust, una prop que solo tiene una plataforma es un método builder como cualquier otro (`.ripple(..)`, `.elevation(..)` para Android, `.input_accessory(..)` para iOS, `.window_drag(..)` para los escritorios); las demás plataformas la ignoran. En TSX, las props que existen en una sola plataforma se agrupan en un objeto que lleva su nombre. Cada elemento acepta `ios`, `android`, `desktop` (macOS, Windows, Linux y los navegadores en el idioma de escritorio) y `web` (navegadores); en las demás plataformas el objeto se ignora, y en su propia plataforma solo se aplican sus claves. Un navegador de escritorio aplica tanto `desktop` como `web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

Los objetos de TSX son reactivos como cualquier prop; una clave que se elimina del objeto se borra.

Lo que existe hoy:

| Rust | TSX | En | Descripción |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | todos los elementos | El ripple de material mientras se pulsa: color, borderless, radius, foreground. |
| `.elevation(..)` | `android={{ elevation }}` | todos los elementos | La sombra de material, en puntos, a partir de la forma de la vista. |
| | `android={{ accessibilityLiveRegion }}` | todos los elementos | `"none"`, `"polite"` o `"assertive"`: TalkBack anuncia los cambios de la vista. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | El contenido del diálogo llega por debajo de la barra de estado. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | El `InputAccessoryView` que se muestra sobre el teclado. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | Los nombres de iOS para los tipos de autofill (el `AutoFill` de Rust cubre ambas plataformas). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | Las orientaciones que permite. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Deslizar hacia atrás y hacia adelante en el historial de páginas. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | El botón de barra propio de UIKit al final de la cabecera, que al pulsarlo ejecuta `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | El botón de barra propio de UIKit al inicio de la cabecera, que al pulsarlo ejecuta `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | El botón de barra propio de UIKit que muestra un SF Symbol al final de la cabecera, que al pulsarlo ejecuta `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | El botón de barra propio de UIKit que muestra un SF Symbol al inicio de la cabecera, que al pulsarlo ejecuta `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: los deslizamientos de dos dedos en el trackpad avanzan y retroceden en el historial de páginas; Windows: deslizamientos en pantalla táctil; Linux: deslizamientos en el touchpad. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | todos los elementos | Al pulsarlo arrastra la ventana, como lo haría la barra de título del sistema (consulta [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

En TSX, `desktop={{…}}` y `web={{…}}` se aceptan en todas partes. Los tipos (`IOSProps`, `AndroidProps`, `DesktopProps` y sus formas por elemento) indican a tu editor qué acepta cada elemento.

Lo que un elemento significa en todas las plataformas es una prop de nivel superior (en Rust, un método con el mismo nombre), que se aplica allí donde tiene sentido: `title`, `headerStyle`, `headerLargeTitle` y `headerBackTitle` de `NavPage` configuran la cabecera del sistema de iOS y Android, su slot `header` es la cabecera de los escritorios y la web, y `presentation` de `Dialog` elige las hojas de iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` y el resto de `AlertDialog.show` funcionan en todas las plataformas. Una función propia del sistema de una plataforma va en su objeto y, cuando varias plataformas la tienen, en el de cada una con el mismo nombre: `allowsBackForwardNavigationGestures` de `WebView`, los deslizamientos del sistema por el historial de páginas, está en `ios={{…}}` y `desktop={{…}}`.

<a id="platform-modules"></a>

## Módulos de plataforma

En Rust, las APIs que solo tiene una plataforma son funciones de `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) y de `nsh_core::element::desktop` (la ventana: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; menús: `set_application_menu`, `popup_menu`); en el resto de plataformas no hacen nada. En TSX, `nsh/mobile` contiene las APIs de iOS y Android (algunas de una sola plataforma) y `nsh/desktop` las de los escritorios. Ambos se pueden importar en todas las plataformas, de modo que un solo bundle se ejecuta en todas partes: en las demás plataformas sus funciones retornan de inmediato y sus componentes no ocupan espacio. Cada uno exporta `isAvailable`, que es `true` en sus propias plataformas; `platform.os` permite distinguirlos.

### nsh/mobile

`isAvailable` es `true` en iOS (con Mac Catalyst) y Android. Ambas plataformas tienen [`TabBar`](../modules/nsh-mobile.md#tabbar), la barra de pestañas del sistema.

#### BackHandler (Android)

| Rust | TSX | Descripción |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Escucha el botón Atrás después de los diálogos y antes de las pilas; devuelve `true` cuando lo has gestionado. El listener desaparece con el componente (o efecto) que lo añadió; en TSX la llamada también devuelve una función que lo detiene antes. |
| | `BackHandler.exitApp()` | Sale de la app. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

El botón Atrás lo gestiona primero el diálogo superior, después los listeners de retroceso (el más reciente primero), luego la pila de navegación superior, y la app se cierra cuando nadie lo ha gestionado. Consulta [Navigation](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Descripción |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Una barra sobre el teclado de los inputs que nombran su id nativo (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

Consulta [Forms and the keyboard](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Las apps de Rust dibujan sus propias barras de título con `nsh_core::element::desktop` ([Building with Rust](./rust.md#desktop-title-bars)). El módulo de TSX:

| Exportación | Descripción |
|---|---|
| `Window` | La ventana: `setTitle`, `setTitleBar({ style: "hidden" })` para una barra de título propia de la app, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | La altura de la barra de título oculta y el espacio que ocupan los controles de ventana del sistema (reactivo). |
| `Menu` | `setApplicationMenu(items)` (la barra de menús, con atajos) y `popup(items, at?)` (menús contextuales). |
| `isAvailable` | `true` donde funcionan las APIs de ventana y menú: macOS, Windows y Linux. Los navegadores de escritorio tienen `platform.desktop` y conservan la ventana y los menús del navegador. |

Consulta [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### La barra de estado

En ambas plataformas la barra de estado pertenece a la página o al diálogo que está encima, como en UIKit, donde decide el view controller superior: [`NavPage` y `Dialog` aceptan `statusBar`](../modules/nsh-base.md#status-bar) (en Rust `.status_bar(StatusBarStyle::Light)`, o un `StatusBarSetting` para los demás campos) con `foreground` (`"auto"`, `"light"` para fondos oscuros, `"dark"` para fondos claros), `hidden` y `animated`. Gana la página o el diálogo mostrado más recientemente, campo por campo, y cuando desaparece vuelve a aplicarse el que está debajo. `"statusBar"` de `nsh.json` es el valor predeterminado de la app por debajo de ellos.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

En una app incrustada en una app nativa, el view controller de la app anfitriona decide la barra de estado en iOS. Una app que declara `"capabilities"` en `nsh.json` necesita `"statusBar": true` para cambiarla.

## platform.os and platform.select

`os()` en Rust y la constante `platform` de `nsh` en TSX indican dónde se ejecuta la app: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` o `Os::Web`, y `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` o `"web"` (Mac Catalyst es `"ios"`, con `platform.catalyst` en cualquiera de sus dos idiomas; el [backend de macOS](./macos.md) es `"macos"`, el [backend de Linux](./linux.md) `"linux"` y el [backend de Windows](./windows.md) `"windows"`, y sus elementos aplican sus props `desktop`; los [navegadores](./web.md) son `"web"`, y también aplican las props `desktop` cuando `platform.desktop` es `true`). Consulta [Device and environment](./device-and-environment.md#the-platform) para la versión, el idioma y el resto.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

En Rust, un `match os()` elige el valor, con `is_desktop()` para los escritorios. En TSX, `platform.select(spec)` devuelve el valor de esta plataforma. Busca la clave propia del SO, luego `desktop` o `mobile` según [la regla anterior](#desktop-and-mobile) (`platform.desktop`), luego `native` (todas las plataformas salvo la web) y por último `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

Devuelve `undefined` cuando nada coincide y no hay `default`.

<a id="rendering-different-components"></a>

### Renderizar componentes distintos

Elige los componentes de la misma manera, a nivel de módulo (TSX) cuando la elección nunca cambia:

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

o en línea con [`when` / `<If>`](../elements/control-flow.md):

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Variantes de plataforma en Tailwind

Rust aplica estilos por plataforma con `.when(os() == Os::Ios, |v| ..)`; en TSX, las variantes `ios:`, `android:` y `web:` aplican clases en una sola plataforma:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## Preferir el comportamiento compartido

Antes de recurrir a una comprobación de plataforma, considera si la diferencia importa a tus usuarios. Los elementos y los estilos ya se corresponden con el comportamiento nativo de cada plataforma donde debe diferir (física del scroll, renderizado de texto, teclados, accesibilidad), y se mantienen iguales donde los usuarios esperan coherencia (el aspecto propio de tu app). Lo mejor es reservar las comprobaciones de plataforma para las convenciones en las que los usuarios confían: el botón Atrás y los toasts de Android, las hojas y los títulos grandes de iOS, los nombres de autofill, el ripple de Android.

<a id="related"></a>

## Relacionado

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) y [`BackHandler`](../modules/nsh-mobile.md#backhandler): las referencias.
- [La API de dispositivo de `nsh`](../modules/nsh.md#device): `platform`.
- [Native components](./native-components.md): uso de las vistas que tu app anfitriona proporciona en cada plataforma.
- [Tailwind](./tailwind.md): todas las variantes.
