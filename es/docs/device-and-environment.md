---
title: "Dispositivo y entorno"
description: "Cómo leer el tamaño de la ventana, el esquema de color, la escala de fuente, las áreas seguras, la plataforma, la densidad de píxeles y la dirección del diseño, y cómo reaccionar cuando cambian."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---


# Dispositivo y entorno

El entorno en el que se ejecuta una app cambia mientras se ejecuta: la ventana cambia de tamaño (rotación, vista dividida, una ventana de Mac), el usuario cambia al modo oscuro o a un tamaño de texto mayor, el teclado aparece y desaparece. NSH expone cada uno de estos cambios como un **accesor reactivo**: se llama como una señal, y todo lo que lo lee (un estilo, un texto, un valor calculado) se actualiza cuando cambia. No hay listeners que añadir ni quitar.

En Rust los accesores son funciones de `nsh_core::prelude`; en TSX provienen de los módulos indicados.

| Rust | TSX | Valor |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | El ancho y el alto de la superficie, en puntos. |
| `dark()` | `colorScheme()` (`nsh`) | Oscuro o claro: el del sistema, o el propio de la app (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | El tamaño de texto preferido del usuario relativo al predeterminado (1 es el predeterminado). |
| `safe_area()` | `safeArea()` (`nsh`) | Márgenes de la superficie no cubiertos por la interfaz del sistema: superior, derecho, inferior, izquierdo. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Los márgenes de la zona donde se renderiza el componente que llama (una página, un diálogo). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | La altura del teclado de software y la duración de su animación. |
| `locale()` | `locale()` (`nsh`) | La configuración regional del usuario como etiqueta BCP 47 (`"en-US"`, `"zh-Hans-CN"`): para la que `Intl` formatea por defecto. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Si la app está en uso: `active`, `inactive` (visible sin el foco) o `background` ([En segundo plano](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | Consulta [Accesibilidad](./accessibility.md). |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## Tamaño de ventana y diseño adaptable

`window()` (TSX: `windowSize()`) es el tamaño de la superficie en la que NSH renderiza: la pantalla en un teléfono, la ventana en un iPad con vista dividida o en un Mac, la vista anfitriona cuando NSH está incrustado. Úsalo para cambiar el diseño, no solo los tamaños:

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

Con frecuencia flexbox, los porcentajes y `aspect_ratio` (`aspectRatio`) bastan sin leer el tamaño en absoluto; consulta [Diseño](./layout.md). `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` de Rust cambia los estilos según el ancho; en TSX con Tailwind, las variantes de breakpoint (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) y `portrait:` / `landscape:` también siguen a la ventana: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## Modo oscuro

La apariencia sigue al sistema a menos que la app establezca la suya. En Rust, la forma más sencilla de admitir el modo oscuro es un color con un valor claro y uno oscuro, `AdaptiveColor::rgb(light, dark)`: cambia de forma nativa cuando cambia la apariencia, sin nada que ejecutar. En TSX es la variante de Tailwind `dark:`, que se aplica cuando `colorScheme()` es `"dark"`:

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

Para cualquier otro caso, lee `dark()` (TSX: `colorScheme()`) en una closure o en un valor calculado; en TSX, para más de unos pocos colores, deriva una paleta una sola vez:

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Los componentes de Rust también toman sus colores del tema, que tiene valores claros y oscuros (`nsh.json` `"theme"`, consulta [Desarrollo con Rust](./rust.md)), por lo que también cambian con el sistema. Para que la barra de estado coincida con tu fondo, da a tus páginas y diálogos un [`statusBar`](../modules/nsh-base.md#status-bar), o a la app uno en `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Una app con su propia apariencia

Una app que es siempre oscura (o siempre clara) lo indica en `nsh.json`, y `dark()` y `colorScheme()`, los colores adaptativos, las clases `dark:`, el tema, el estilo predeterminado de la barra de estado y las alertas la siguen desde el primer fotograma (las apps empaquetadas también se inician con ella):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` de `nsh`) la cambia en tiempo de ejecución, para un ajuste de apariencia dentro de la app; `Appearance::System` (`"system"`) vuelve a seguir al sistema:

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> Prueba ambas apariencias durante el desarrollo: `xcrun simctl ui booted appearance dark` cambia un simulador de iOS, y Android tiene un interruptor de tema oscuro en Quick Settings. El cambio llega a tu app al instante, sin recargar.

<a id="text-size"></a>

## Tamaño de texto

`font_scale()` (TSX: `fontScale()`) es el ajuste de tamaño de texto del usuario (Dynamic Type en iOS, tamaño de fuente en Android) relativo al predeterminado. Los textos y las entradas lo siguen por sí solos: `fontSize: 16` se renderiza más grande cuando el usuario pidió un texto más grande. Por elemento puedes excluirlo o limitarlo:

| Rust (en `text` y `input`) | TSX (en `<Text>` y `<Input>`) | Predeterminado | Descripción |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Seguir el tamaño de texto del sistema. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (ninguno) | La mayor escala aplicada a este texto. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Lee `font_scale()` para adaptar el diseño que no sigue al texto automáticamente, como cambiar una fila a columna cuando el texto se hace grande: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` en Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` en TSX.

El tamaño de texto escala el texto: todo texto y entrada que permita escalar la fuente, y las alertas y toasts de la plataforma. Las longitudes mantienen su tamaño: espaciado, anchos y altos, radios de esquina, bordes e imágenes, en puntos o en clases (`p-4`, `rounded-lg`, `w-[2rem]`). Las cajas dimensionadas por su contenido crecen con su texto.

<a id="language-and-region"></a>

## Idioma y región

`locale()` es la configuración regional del usuario, como etiqueta BCP 47 (`locale().as_str()` en Rust). En TSX, `Intl` formatea números y fechas para ella por defecto, de modo que `new Intl.NumberFormat().format(1234.5)` da `1,234.5` en `en-US` y `1.234,5` en `de-DE`. Lee `locale()` para elegir las cadenas de tus propias traducciones: los textos que la leen se actualizan cuando cambia.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## En una app anfitriona

Una app mostrada dentro de una app nativa sigue los ajustes propios de esa app cuando los establece: la configuración regional y el tamaño de texto de las API de incrustación (`AppView::set_locale` y `set_font_scale` en Rust sobre [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) y [Windows](./windows.md), `locale` y `fontScale` en Swift sobre [iOS](./ios.md), `setLocale` y `setFontScale` en Java sobre [Android](./android.md)) sustituyen al idioma y al tamaño de texto del sistema. `locale()`, `Intl`, `fontScale()` y el texto los siguen al instante, igual que siguen un cambio del sistema, y los del sistema vuelven cuando la app anfitriona los borra. Úsalos cuando la app nativa permita a sus usuarios elegir un idioma o un tamaño de texto propios.

<a id="in-the-background"></a>

## En segundo plano

`lifecycle()` (igual en TSX) indica si el usuario está usando la app. Es `active` en primer plano, `inactive` mientras la app sigue visible pero otra app o ventana tiene el foco (o el sistema muestra algo sobre ella: el selector de apps, una llamada entrante), y `background` mientras no es visible: en segundo plano en un teléfono, minimizada en un escritorio, una pestaña oculta en la web. Como todo accesor, actualiza lo que lo lee, así que un efecto pausa un feed en vivo, un sondeo o un vídeo en segundo plano y los reanuda cuando el usuario vuelve:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

Usa `background` para pausar trabajo, y guarda lo que el usuario cambia a medida que lo cambia: el sistema puede suspender una app segundos después de pasar a segundo plano, antes de que se haya ejecutado un efecto que lee el cambio. Una app mostrada dentro de una app nativa sigue el estado de esa app, y donde una app tiene varias ventanas (un iPad, un escritorio) una vista sigue a la ventana en la que está. En las pruebas, `app.setLifecycle("background")` de `nsh/test` la lleva a ese estado ([Pruebas](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## Áreas seguras

Las muescas, el indicador de inicio, la barra de estado, la barra de navegación de Android y la barra de título de Mac Catalyst cubren partes de la superficie. Las apps de NSH dibujan de borde a borde en todas las plataformas, y reciben las partes cubiertas como márgenes.

- `safe_area()` (TSX: `safeArea()`) devuelve los márgenes de la superficie.
- El `cx.insets()` de un componente (TSX: `safeAreaInsets()`) devuelve los márgenes **de la zona donde se renderiza el componente**: dentro de una [página](./navigation.md#safe-areas-under-the-header) de navegación se miden por debajo de su cabecera, dentro de un [diálogo](../elements/dialog.md) son los del diálogo. Prefiérelo en componentes que puedan mostrarse en varios lugares.
- `env(safe-area-inset-top)`, `-right`, `-bottom` y `-left` de CSS añaden relleno o espacio a cualquier vista según los márgenes de la zona donde se renderiza, en `padding*` y `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` añade una longitud; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). El relleno se actualiza de forma nativa cuando cambian los márgenes ([Área segura](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

En Android, una vista incrustada bajo una barra de herramientas recibe solo las partes de las barras del sistema que se solapan con ella, como el área segura de UIKit: ningún margen superior si no llega a la barra de estado.

<a id="the-platform"></a>

## La plataforma

`os()`, `os_version()`, `idiom()`, `is_desktop()` y `is_catalyst()` en Rust, y la constante `platform` de `nsh` en TSX, describen dónde se ejecuta la app. Permanecen iguales mientras la app se ejecuta.

| Rust | TSX | Descripción |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` o `Os::Web` (`os().name()` es la cadena de TSX). Mac Catalyst es iOS. |
| `os_version()` | `platform.version` | Mayor y menor; en Android, el nivel de API y 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` o `Desktop`; `Desktop` exactamente donde se cumple `is_desktop()`. |
| `is_desktop()` | `platform.desktop` | macOS, Windows o Linux, o un navegador de escritorio ([Escritorio y móvil](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, en cualquiera de sus idioms. |

`platform` de TSX al completo:

| Miembro | Descripción |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` o `"web"`. Mac Catalyst informa `"ios"`. |
| `platform.version` | Una cadena: iOS y escritorios: la versión del SO (`"17.5"`); Android: el nivel de API (`"35"`); la web: `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` o `"desktop"`. `"desktop"` exactamente donde `platform.desktop` es `true`. `"mac"` es el idiom Mac de UIKit bajo Mac Catalyst, un idiom móvil. |
| `platform.desktop` | Se aplica el comportamiento de escritorio: macOS, Windows, Linux y navegadores de escritorio. Las props `desktop={{…}}` y `platform.select({ desktop })` lo siguen. |
| `platform.catalyst` | La app se ejecuta bajo Mac Catalyst (`os` `"ios"`), en el idiom Mac o iPad. |
| `platform.select(spec)` | El valor para esta plataforma; consulta [Código específico de plataforma](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` se ejecuta sin interfaz como iOS.

En [Linux](./linux.md), `platform.os` es `"linux"`, el idiom `"desktop"` y `platform.version` la versión mayor y menor
del kernel (`"6.12"`): las distribuciones numeran sus versiones de maneras que no se pueden comparar. Allí, el área
segura y la altura del teclado son 0, `colorScheme()` sigue en vivo el ajuste del escritorio (el portal de ajustes XDG),
`fontScale()` el escalado de texto del escritorio y `pixelRatio()` la escala de la pantalla, incluidas las fraccionarias.

En [macOS](./macos.md) (el backend AppKit), `platform.os` es `"macos"`, el idiom `"desktop"` y
`platform.version` la versión de macOS. El área segura y la altura del teclado son 0, `colorScheme()` sigue en vivo la
apariencia del sistema, `fontScale()` es 1 y `pixelRatio()` la escala de respaldo de la pantalla.

En [Windows](./windows.md), `platform.os` es `"windows"`, el idiom `"desktop"` y `platform.version` `"10.0"`, también en
Windows 11 (Windows mantuvo el número de versión). El área segura y la altura del teclado son 0, `colorScheme()` sigue en vivo
Configuración > Personalización > Colores, `fontScale()` el ajuste de Tamaño del texto (de 1 a 2,25), `reduceMotion()` el
ajuste de efectos de animación, `pixelRatio()` la escala del monitor, y `Intl` formatea según el formato regional del usuario.

En un navegador ([el runtime web](./web.md)), `platform.os` es `"web"` y `platform.version` `"0.0"`. El idiom es
`"desktop"` con un ratón y una ventana de al menos 600 puntos de ancho, `"pad"` en una tableta y `"phone"` en un teléfono,
decidido cuando se inicia la app. La configuración regional, `reduceMotion()`, `fontScale()` (el tamaño de texto del navegador), `pixelRatio()`,
el área segura y la altura del teclado provienen del navegador y lo siguen en vivo.

<a id="pixel-density"></a>

## Densidad de píxeles

`pixel_ratio()` y `round_to_nearest_pixel(points)` en Rust, y `pixelRatio()` de `nsh` en TSX, convierten entre puntos y píxeles del dispositivo.

| Rust | TSX | Descripción |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Píxeles del dispositivo por punto (2 o 3 en la mayoría de los teléfonos), reactivo. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Puntos redondeados al píxel del dispositivo más cercano. |

Una línea fina, de un píxel del dispositivo de alto:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` y `pixelRatio()` son reactivos, de modo que una línea fina sigue a una ventana movida a una pantalla con otra densidad.

<a id="right-to-left"></a>

## De derecha a izquierda

Cuando el idioma del dispositivo se escribe de derecha a izquierda (árabe, hebreo, persa, ...), NSH dispone la app de derecha a izquierda: las filas avanzan desde la derecha, las propiedades de estilo lógicas toman sus lados de derecha a izquierda, el texto se alinea a la derecha y los widgets nativos se reflejan. La dirección del diseño sigue al idioma del usuario por sí sola. El estilo `direction` de una vista (`"ltr"`, `"rtl"` o `"inherit"`; `.direction(LayoutDirection::..)` en Rust) establece la dirección de su subárbol; en la vista raíz establece la de la app.

Los cambios se aplican al instante, sin reiniciar la app; la demo de esta página alterna el estilo `direction`.

Escribe diseños que funcionen en ambos sentidos con las propiedades lógicas: en Rust `ms` / `me` y `ps` / `pe` (los nombres de Tailwind), en TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` y así sucesivamente, que significan izquierda y derecha en diseños de izquierda a derecha y lo contrario de derecha a izquierda. `left` y `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) mantienen sus lados en ambos, como en CSS. El estilo `direction` (`"inherit"`, `"ltr"`, `"rtl"`) anula la dirección para un subárbol, por ejemplo para mantener un número de teléfono o los controles de un reproductor multimedia de izquierda a derecha. Las variantes de Tailwind `rtl:` y `ltr:` se aplican según la dirección.

Las vistas de desplazamiento horizontal y las listas empiezan por el extremo derecho en los diseños de derecha a izquierda. En Android, la app anfitriona debe declarar `android:supportsRtl="true"` en su manifiesto para que los widgets nativos se reflejen.

<a id="related"></a>

## Relacionado

- [La API de dispositivo de `nsh`](../modules/nsh.md#device): la referencia.
- [Código específico de plataforma](./platform-specific.md): `platform.select`, props y módulos de plataforma.
- [Accesibilidad](./accessibility.md): lectores de pantalla y movimiento reducido.
- [Área segura](../elements/safe-area.md), [Teclado](../elements/keyboard.md) y [la barra de estado](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, variantes de breakpoint y de orientación.
