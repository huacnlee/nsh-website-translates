---
title: "Carousel"
description: "Carousel y sus partes: diapositivas que se muestran de una en una, y que se desplazan mediante deslizamiento, la rueda y el panel táctil sobre el desplazamiento propio de la plataforma, mediante controles de anterior y siguiente, una paginación y el teclado, pasando de un extremo a otro sin interrupciones. El Carousel se encarga de qué diapositiva se muestra, del ajuste al límite de cada diapositiva, del bucle, de las teclas y de la accesibilidad; el aspecto y todas las etiquetas son responsabilidad de la app."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---


# Carousel

Un carrusel muestra las diapositivas de una en una: las fotos de un producto, los pasos de un onboarding, un banner que avanza solo, una fila de tarjetas. `Carousel` se encarga del comportamiento: qué diapositiva se muestra, el deslizamiento entre ellas, los controles de anterior y siguiente, una paginación, las teclas de flecha, dar la vuelta por los extremos y lo que oyen los lectores de pantalla. Sus partes lo encuentran mediante el contexto, de modo que la app las organiza libremente en su propio layout. El aspecto es de la app: no trae colores, tamaños, flechas, puntos ni etiquetas propios.

El contenido es una scroll view nativa. Un dedo, la rueda y el touchpad mueven las diapositivas en el hilo principal de la plataforma, en el mismo fotograma que el puntero, y al soltar el contenido se ajusta a la diapositiva más cercana, una diapositiva por gesto de lanzamiento. Cuando se detiene, el carrusel informa de la diapositiva con `onChange`. Los controles, la paginación, las teclas y el `index` de la app desplazan el contenido de forma nativa hasta la diapositiva, con animación.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` y sus partes provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. La diapositiva mostrada es el `index` de la app: un deslizamiento, un control o una tecla informa de la siguiente con `onChange`, y el carrusel se desplaza hasta el `index` que la app devuelve. La diapositiva en la que se detiene un deslizamiento se muestra hasta que la app responde a su `onChange`: permanece cuando la app la devuelve como `index`, y el contenido vuelve con efecto de rebote a la diapositiva de la app, con animación, cuando la app mantiene el `index` que tenía. Sin `index` el carrusel mantiene el suyo, a partir de `defaultIndex`. En Rust, `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` y `carousel_pagination_item()` crean las partes, con un setter por prop (`.index(..)`), un listener por evento (`.on_change(..)`), los métodos de estilo tipados y `.child(..)` para su contenido.

## Props

### Carousel

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | ninguno | La diapositiva mostrada, desde 0, limitada a las diapositivas que hay. La app es su dueña: los cambios se informan con `onChange`, y un nuevo `index` se desplaza hasta allí, con animación. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | La diapositiva mostrada al principio, mientras `index` no está definido. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La dirección en que se suceden las diapositivas; se lee al crear el carrusel. Las teclas de flecha de un carrusel vertical son Arriba y Abajo. |
| `looping` | `.looping(..)` | `boolean` | `false` | Las diapositivas dan la vuelta: tras la última viene la primera, y antes de la primera la última, sin saltos, tanto para un deslizamiento, anterior, siguiente y las teclas como para el `index` de la app ([Bucle](#looping)). Se lee al crear el carrusel. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al carrusel, una región: qué son sus diapositivas (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El `CarouselContent`, los controles y lo que la app disponga a su alrededor. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El layout del carrusel: dónde van el contenido y los controles. |

### CarouselContent

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los `CarouselItem`, cada uno hijo del contenido. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El tamaño del viewport y la pista que forman en él las diapositivas: un `gap` entre ellas, padding que deja ver un adelanto de las diapositivas contiguas a la que está en vista. |

### CarouselItem

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla a la diapositiva, un grupo: su lugar entre las demás y lo que muestra (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido de la diapositiva. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Su tamaño a lo largo del eje (`w-full` para una diapositiva por vista, `basis-1/3` para tres) y su aspecto. En un carrusel con bucle, su traslación pertenece al carrusel: coloca un `transform` en una vista dentro de ella. |

### CarouselPrevious, CarouselNext

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | El nombre del control, cuando sus hijos no tienen texto que lo diga (un icono de flecha). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El icono o la etiqueta de la app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto y su posición: junto al contenido, o `absolute` sobre su borde. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | Su estilo mientras está pulsado, con el cursor encima, con el foco o deshabilitado en un extremo, como las clases `<state>:`. |

### CarouselPagination

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla al grupo de elementos de paginación (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | ninguno | Las clases de Tailwind del indicador, una vista sobre el elemento de la diapositiva mostrada (una píldora detrás de los puntos, un subrayado): su aspecto y su posición a lo ancho de la fila (`inset-y-0`, `bottom-0 h-0.5`). A lo largo de la fila abarca ese elemento y salta al siguiente de forma nativa. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del indicador, sobre `indicatorClass`. Sin ninguno de los dos, la paginación no tiene indicador. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los `CarouselPaginationItem`, y lo que la app disponga entre ellos. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El layout de la fila (`flex-row gap-2`). |

### CarouselPaginationItem

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | obligatorio | La diapositiva que representa, desde 0. Un índice posterior a la última diapositiva queda deshabilitado. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | Su estilo mientras se muestra su diapositiva, como clases `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Qué diapositiva representa (`"Slide 3"`), cuando sus hijos no tienen texto que lo diga (un punto). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El punto, la miniatura o el número de la app. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Su aspecto; las clases `group-selected:` dentro de él lo siguen con `group`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | El usuario pasó a otra diapositiva: un deslizamiento, la rueda o el touchpad se detuvo en ella, o un control, un elemento de paginación o una tecla la pidió. `{ index }` es esa diapositiva. Un nuevo `index` de la app no informa de nada. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | El usuario empezó a arrastrar el contenido (un dedo, el touchpad). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | El contenido que el usuario arrastró se detuvo. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | El foco del teclado entró en el carrusel: en su propia vista, en su control anterior o siguiente, en un elemento de paginación o en una vista enfocable de una diapositiva. Moverse entre ellos no informa de nada. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | El foco del teclado salió del carrusel: de su propia vista, sus controles, sus elementos de paginación y el contenido de las diapositivas. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada con | Estados |
|---|---|---|---|
| El carrusel | | `class`, `style` de `Carousel` | `focus:` |
| El contenido | el carrusel | `class`, `style` de `CarouselContent` | |
| Una diapositiva | el contenido | `class`, `style` de `CarouselItem` | |
| Anterior, siguiente | el carrusel | sus `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| La paginación | el carrusel | `class`, `style` de `CarouselPagination` | |
| El indicador | la paginación | `indicatorClass`, `indicatorStyle` | |
| Un elemento de paginación | la paginación | sus `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Varias diapositivas por vista

El ancho de una diapositiva lo da su propia clase, así que una fila de tarjetas son varias diapositivas en el viewport. Cada diapositiva es un punto de ajuste donde empieza: el contenido se detiene con esa diapositiva allí donde se detiene la primera, de modo que un padding antes de la primera se conserva antes de cada una. Al final del rango, las diapositivas que no pueden llegar a ese lugar se detienen con la última, y siguiente se detiene ahí. `index` nombra la diapositiva que está en el primer lugar; las diapositivas que se detienen con la última muestran el mismo lugar, y un deslizamiento allí informa de la primera de ellas:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` con el ancho de un teléfono, o `basis-[85%]`, muestra un adelanto de la tarjeta siguiente. Un carrusel vertical (`axis="vertical"`) dimensiona sus diapositivas por su alto.

<a id="looping"></a>

## Bucle

Con `looping`, las diapositivas dan la vuelta sin saltos: tras la última viene la primera, ya sea deslizando, avanzando con siguiente o con las teclas, o mediante el `index` de la app, sin rebobinar a través de las diapositivas intermedias. El contenido guarda espacio para una vuelta completa de diapositivas antes y después de ellas, y dibuja cada diapositiva donde está más cerca del centro de la vista; la animación ejecuta esto en los fotogramas propios de la plataforma, junto con el scroll. Cada diapositiva existe una sola vez: los lectores de pantalla y la paginación la ven una vez.

El bucle es continuo mientras las diapositivas abarquen el viewport y una diapositiva más (tres diapositivas de ancho completo, o cinco de un tercio de ancho). Con menos, anterior, siguiente y las teclas siguen dando la vuelta, desplazándose hacia atrás a través de las diapositivas.

<a id="slides-that-move-on-by-themselves"></a>

## Diapositivas que avanzan solas

Un banner que avanza solo es cosa de la app: un temporizador que establece `index`. El carrusel informa de cuándo el usuario está interactuando con él, de modo que el temporizador espera en ese momento, como pide el [patrón de carrusel de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): `onDragStart` / `onDragEnd` alrededor de un arrastre, `onFocus` / `onBlur` mientras el foco del teclado está en el carrusel (en él, en sus controles, en su paginación o en el contenido de las diapositivas), y el puntero sobre una vista que lo rodee. Déjalo desactivado con movimiento reducido, y da a los usuarios un botón que lo detenga (el control de rotación):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Leer `index()` dentro del efecto inicia un intervalo completo de nuevo tras cada cambio, incluido el del usuario. Con `looping`, pasar de la última diapositiva a la primera avanza hacia delante a través de la unión.

<a id="accessibility"></a>

## Accesibilidad

- El carrusel es una región con el nombre dado por `accessibilityLabel`; cada diapositiva es un grupo con su propio nombre (su lugar entre las demás y lo que muestra).
- Anterior y siguiente son botones, deshabilitados en los extremos salvo que el carrusel haga bucle; cada elemento de paginación es un botón, seleccionado mientras se muestra su diapositiva.
- Cada etiqueta es de la app, en el idioma de la app.
- Las diapositivas de un carrusel con bucle existen una sola vez cada una, estén donde estén dibujadas.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En macOS y en la web, donde Tab llega a las vistas que reciben pulsaciones, el carrusel es una parada del foco del teclado, y también lo son sus controles y sus elementos de paginación. Mientras uno de ellos tiene el foco:

| Tecla | Qué hace |
|---|---|
| Izquierda, Derecha (Arriba, Abajo en vertical) | Pasa a la diapositiva anterior o a la siguiente, dando la vuelta por los extremos con bucle. |
| Inicio, Fin | Pasa a la primera o a la última diapositiva. |
| Espacio, Retorno | Pulsa el control o el elemento de paginación enfocado. |

En un layout de derecha a izquierda, las diapositivas de un carrusel horizontal van desde la derecha, de modo que Izquierda pasa a la diapositiva siguiente y Derecha a la anterior; un carrusel vertical conserva Arriba y Abajo. Un control que se deshabilita mientras tiene el foco (siguiente en la última diapositiva) le pasa el foco al carrusel, para que las teclas sigan funcionando allí. Las vistas enfocables de la app dentro de las diapositivas conservan sus propias teclas: las flechas de un input mueven su cursor de texto.

<a id="motion"></a>

## Movimiento

- Un deslizamiento, la rueda y el touchpad mueven las diapositivas con el puntero, en el mismo fotograma: las desplaza la plataforma.
- Al soltar, el contenido se desliza hasta la diapositiva más cercana, una diapositiva por gesto de lanzamiento, tal como lo ajusta la plataforma.
- Anterior, siguiente, un elemento de paginación, una tecla y el `index` de la app desplazan el contenido hasta la diapositiva, con animación; con movimiento reducido, de inmediato.
- El indicador de la paginación salta al elemento de la diapositiva mostrada; con movimiento reducido se mueve de inmediato.
- `looping` pasa de la última diapositiva a la primera avanzando un paso, a través de la unión; cuando el contenido se detiene, retrocede una vuelta completa sin animación, lo que no cambia nada en pantalla.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS, Android y Mac Catalyst: un dedo desliza las diapositivas; un toque pulsa un control.
- Escritorio (macOS, Windows, Linux, GPUI) y la web: la rueda y el touchpad desplazan las diapositivas, y un clic pulsa un control. Un arrastre con el ratón sobre el contenido queda en manos de la app, como en toda scroll view allí.
- Todas las plataformas dibujan lo que la app estiliza: las diapositivas, los controles, la paginación y su indicador.
