---
title: "ColorPicker"
description: "El componente ColorPicker y sus partes: un color elegido en un área de saturación y brillo, en controles deslizantes de cualquier canal de RGB, HSL, HSB u OKLCH y del alfa, escrito en cualquier forma de CSS, seleccionado desde muestras o tomado de la pantalla con un cuentagotas, con las teclas de WAI-ARIA y elementos ajustables para lectores de pantalla, con el diseño y los estilos definidos por la aplicación."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---


# ColorPicker

Un color picker guarda un color, y las partes que contiene lo muestran y lo cambian: un `ColorArea` de saturación y brillo, `ColorSlider`s de cualquier canal de RGB, HSL, HSB u OKLCH y del alfa, `ColorField`s que toman el color como texto o un canal como número, `ColorSwatch`es de colores predefinidos y un `ColorEyeDropper` que elige un color en cualquier punto de la pantalla. La app dispone las partes con sus propios elementos intercalados (una fila por canal con su letra, el espacio elegido con `Tabs`, el picker dentro de un `Popover`) y da estilo a cada una: las partes dibujan los colores de los canales, y cada tamaño, radio, borde y sombra es de la app.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` y `ColorEyeDropper` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. En Rust, `color_picker()` y las funciones de sus partes los crean con un setter por prop (`.channel(..)`, `.thumb_style(..)`), un método de escucha por evento (`.on_change(..)`) y los métodos de estilo tipados; el color es un `Hsla`, y los espacios, canales y formatos son `ColorSpace`, `ColorChannel` y `ColorFormat`.

<a id="value"></a>

## Valor

El color es un color CSS: hex (`#3b82f6`, `#3b82f680` con su alfa), `rgb()`, `hsl()`, `hsb()`, `oklch()` o un nombre CSS; en Rust, un `Hsla`. La app lo posee con `value` y establece el que informa `onChange`, como en cada control de `nsh/base`; o bien deja el color en manos del picker con `defaultValue` y aun así recibe los cambios.

- `onChange({ value, formatted })` informa de cada color que pide el usuario: en cada paso de un arrastre sobre el área o un slider, con cada tecla, con el número de un campo a medida que se escribe, al pulsar un swatch. `value` es el color, `formatted` el mismo color escrito como indica `format` (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` o `"oklch"`), listo para guardar o para usar como token.
- `onChangeEnd({ value, formatted })` informa una sola vez del color en el que terminó el cambio: cuando se levanta el puntero, después de cada tecla, cuando se sale de un campo o se envía, cuando se pulsa un swatch.
- El picker conserva el color en cada espacio tal como lo fijó el usuario. Un gris conserva su matiz y su saturación, de modo que el slider de matiz se queda donde el usuario lo dejó; un color editado en OKLCH conserva su luminosidad, croma y matiz tal como se escribieron, también más allá de lo que muestra sRGB (el color informado es el más cercano que muestra sRGB, y `formatted` en `"oklch"` conserva los canales).
- Un `value` que establece la app y que el picker no informó reemplaza el color en todos los espacios.

<a id="spaces-and-channels"></a>

## Espacios y canales

| `colorSpace` | Canales (`channel`) | Rangos |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0 a 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | matiz 0 a 360, los demás 0 a 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | matiz 0 a 360, los demás 0 a 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | luminosidad 0 a 100 (de 0.1 en 0.1), croma 0 a 0.4 (de 0.001 en 0.001), matiz 0 a 360 (de 0.1 en 0.1) |
| cualquiera | `"alpha"` | 0 a 100 |

La pista de un slider dibuja los colores de su canal manteniendo fijos los demás canales, de modo que muestra adónde lleva cada valor. Un canal que su espacio no tiene se sustituye por el primero del espacio (una advertencia lo indica).

## Props

### ColorPicker

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | ninguno | El color (controlado). La app establece el que informa `onChange`. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | El color inicial mientras `value` no esté establecido; el picker conserva entonces el suyo. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | Cómo escribe el color `formatted`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin cambios desde ninguna parte; las clases `disabled:` se aplican al picker y a sus partes. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Las partes y los elementos de la app entre ellas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El propio picker: la columna (o fila) que rodea sus partes. |

### ColorArea

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El panel, que llena el área: los colores del matiz, con la saturación de izquierda a derecha (de derecha a izquierda en un diseño de derecha a izquierda) y el brillo de abajo hacia arriba, recortado en sus esquinas. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El thumb, centrado en el color. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | El fondo del thumb es el color. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin cambios por puntero, teclado ni lector de pantalla. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el thumb. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El área: su tamaño lo define la app. |

### ColorSlider

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | El espacio del canal. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | El canal que cambia: uno de los del espacio, o `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La dirección de la pista: el valor más pequeño al inicio (la izquierda, la derecha en un diseño de derecha a izquierda), o abajo. Se lee cuando se crea el slider. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | La pista: los colores del canal a lo largo de ella, recortados en sus esquinas; el thumb se coloca sobre ella. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | ninguno | El thumb, centrado en el valor. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | El fondo del thumb es el color (con su alfa en un slider de alfa). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | ninguno | El color de un tablero de ajedrez bajo la pista, que se transparenta a través de los colores de un slider de alfa. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | El lado de los cuadros del tablero. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin cambios por puntero, teclado ni lector de pantalla. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el thumb. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El slider: la banda alrededor de la pista que recibe las pulsaciones y los arrastres. |

### ColorField

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | ninguno | El canal que toma como número. Sin ella, el campo toma el color completo como texto. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | El espacio de `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | Cómo escribe el campo el color completo. Lee cualquier forma CSS. |
| `placeholder` | `.placeholder(..)` | `string` | ninguno | Se muestra mientras el campo está vacío. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin escritura. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla para el campo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<TextStyle>` | ninguno | El campo, un input de texto. |

El campo de un canal cambia el color a medida que se escribe un número, limitado al rango del canal; el campo del color completo lo cambia cuando se sale del campo o se envía, si el texto se lee como un color. Al salir de un campo, su valor se vuelve a escribir en su formato.

### ColorSwatch

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | ninguno | El color que muestra; una pulsación lo elige en el picker que lo rodea. Sin ella, el color del propio picker: una vista previa. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo mientras es el color del picker, como clases `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | ninguno | Un tablero de ajedrez bajo un color translúcido. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | El lado de sus cuadros. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | el color en hex | Lo que dicen los lectores de pantalla. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Contenido sobre el color: una marca de verificación en el swatch seleccionado (`group-selected:`). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El swatch: su tamaño, forma y borde; sus esquinas recortan el color. |

### ColorEyeDropper

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones. También está deshabilitado donde la plataforma no tiene cuentagotas. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Su contenido: el icono o la etiqueta de la app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El botón. |

Una pulsación muestra el cuentagotas del sistema: el color sampler de AppKit en macOS, el `EyeDropper` del navegador en la web (Chrome y Edge). El color elegido pasa a ser el del picker (`onChange`, luego `onChangeEnd`); Escape no elige ninguno. Donde la plataforma no tiene cuentagotas el botón está deshabilitado, y `disabled:hidden` lo oculta allí.

<a id="events"></a>

## Eventos

| Evento | De | Rust | Carga | Cuándo |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | El usuario cambió el color. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | El cambio terminó. Una vez por cambio. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | Se pulsó el swatch; funciona también solo, como chip de una paleta. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | El usuario eligió un color en la pantalla; funciona también solo. |

En Rust, `ColorPickerEvent::Change(Hsla, SharedString)` y `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` llevan el color y su texto `formatted`.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada con |
|---|---|---|
| `ColorArea` | el picker | `class`, `style` |
| El panel del área | el área, llenándola | `panelClass`, `panelStyle` |
| El thumb del área | el área, centrado en el color | `thumbClass`, `thumbStyle` |
| `ColorSlider` | el picker | `class`, `style` |
| La pista del slider | el slider | `trackClass`, `trackStyle` |
| El thumb del slider | el slider, centrado en el valor sobre la pista | `thumbClass`, `thumbStyle` |
| `ColorField` | el picker | `class`, `style` |
| `ColorSwatch` | el picker, o solo | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | el picker, o solo | `class`, `style` |

El thumb de un slider se centra en los extremos de la pista cuando el canal está en sus extremos. Un padding en el slider de la mitad del ancho del thumb (`h-6 justify-center px-2.5` alrededor de una pista `h-3`) mantiene todo el thumb dentro del slider, donde recibe las pulsaciones en ambos extremos. Estados que muestran las partes: el `active:` de un thumb mientras se arrastra y `focus:` con el foco del teclado, el `selected:` de un swatch y el `disabled:` de cada parte.

<a id="keyboard"></a>

## Teclado

En macOS y en la web cada thumb es una parada del foco del teclado (Tab):

| Tecla | En un slider | En el área |
|---|---|---|
| Derecha, Arriba | Un paso hacia arriba | Derecha: más saturación; Arriba: más brillo |
| Izquierda, Abajo | Un paso hacia abajo | Izquierda: menos saturación; Abajo: menos brillo |
| Mayús con una flecha | Diez pasos | Diez pasos |
| Page Up, Page Down | Diez pasos | Diez pasos de brillo |
| Home, End | Los extremos del canal | |

En un diseño de derecha a izquierda, un slider horizontal y el área corren desde la derecha, con el valor más pequeño (la menor saturación) en el extremo derecho: Izquierda es un paso hacia arriba y Derecha un paso hacia abajo, y una pulsación o un arrastre elige el valor que hay bajo el puntero tal como está dibujado. Un slider vertical mantiene Derecha y Arriba como un paso hacia arriba; Arriba y Abajo en el área mantienen el brillo.

Un swatch acepta Espacio y Retorno. Cada tecla informa `onChange` y luego `onChangeEnd`; las flechas se repiten mientras se mantienen pulsadas.

<a id="accessibility"></a>

## Accesibilidad

- El thumb del área y el de cada slider son elementos ajustables (`"adjustable"`, un slider en el navegador) con su etiqueta, valor y rango; el incremento y el decremento de los lectores de pantalla los mueven paso a paso.
- Cada campo es un campo de texto con su etiqueta; cada swatch, un botón, seleccionado mientras es el color del picker, nombrado por su color en hex a menos que `accessibilityLabel` le dé nombre. El cuentagotas es un botón con la etiqueta de la app.
- Mientras están deshabilitadas, los lectores de pantalla indican que las partes están atenuadas, y no aceptan acciones.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y acciones en general.

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma dibuja lo que la app estiliza; los colores de las pistas y del panel son degradados dibujados por la plataforma. Las pulsaciones y los arrastres se siguen en el núcleo, para un ratón, un lápiz o un dedo, y una scroll view alrededor del picker limita su desplazamiento a los arrastres que empiezan en otro lugar.
- `ColorEyeDropper` elige con el color sampler de AppKit en macOS y con el `EyeDropper` del navegador en la web; el color llega en sRGB.
