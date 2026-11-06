---
title: "Tabs"
description: "Tab y Tabs: las pestañas de una lista de pestañas y la propia lista. Cada pestaña se encarga de las pulsaciones, la activación con teclado, el estado deshabilitado y su rol y estado de selección para los lectores de pantalla; la lista es el conjunto, con un indicador que sigue de forma nativa a la pestaña seleccionada; el aspecto, el valor y el contenido que muestra cada pestaña son responsabilidad de la app."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---


# Tabs

Las pestañas cambian entre las secciones de un mismo lugar: el resumen y la actividad de un proyecto, las vistas de un documento.
Cada `Tab` gestiona el comportamiento de una pestaña: pulsaciones, activación por teclado, el estado deshabilitado, y el rol de pestaña y su estado seleccionado para los lectores de pantalla. Un `Tabs` que las envuelve es la lista de pestañas, que los lectores de pantalla anuncian como un solo conjunto. El aspecto es el de la app: una pestaña no tiene colores, tamaños ni etiqueta propios. Sus hijos son la etiqueta de la app, y las clases `selected:` en la pestaña, o las clases `group-selected:` en lo que hay dentro de ella, siguen su estado. El contenido de cada sección también es de la app: muestra la que nombra su valor, junto a la lista. El indicador de la lista, un subrayado o una píldora que la app estiliza, se sitúa sobre la pestaña seleccionada y viaja a la siguiente de forma nativa ([Indicador](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` y `Tabs` provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor es de la app: la lista no guarda ninguno. A cada pestaña se le indica si está seleccionada; una pulsación informa `onPress`, la app establece su valor y muestra esa sección, y cada pestaña muestra el `selected` que la app devuelve. Las esquinas de la lista y las de las pestañas son concéntricas: el relleno de la lista (`p-1`) es la diferencia entre `radius.lg` y `radius`. El relleno de la pestaña seleccionada es el indicador de la lista (`indicatorClass`, dentro de ese relleno: `inset-y-1`), que se desplaza con un efecto de resorte hacia la pestaña que la app selecciona. En Rust, `tab()` y `tabs()` los crean, con un setter por prop (`.selected(..)`), un listener por evento (`.on_press(..)`), los métodos de estilo tipados y `.child(..)` para su contenido.

## Props

### Tab

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | La pestaña actual de su lista: los lectores de pantalla dicen que está seleccionada y se aplican los estilos `selected:`. Una pulsación informa `onPress`; la pestaña muestra el valor que la app devuelve. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sin pulsaciones ni respuesta visual a la pulsación; se aplican los estilos `disabled:` y los lectores de pantalla dicen que está atenuada. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de la pestaña mientras está seleccionada y no deshabilitada, como clases `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla: el nombre de la pestaña, cuando sus hijos no tienen texto que lo indique (un icono). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | La etiqueta, el icono o la insignia de la app, que los lectores de pantalla dicen. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La propia pestaña: la superficie que rodea su etiqueta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo de la pestaña mientras está pulsada, con el cursor encima, enfocada o deshabilitada, como clases `<state>:`. |

### Tabs

| Prop | Rust | Tipo | Predeterminado | Descripción |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | ninguno | Las clases de Tailwind del indicador sobre la pestaña seleccionada: su aspecto y su posición a lo ancho de la lista (`bottom-0 h-0.5` para un subrayado en una fila, `inset-y-1` para una píldora). A lo largo de la lista abarca la pestaña seleccionada, dentro de sus propios márgenes en ese eje. Con `indicatorClass` o `indicatorStyle` la lista tiene un indicador. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del indicador, sobre `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Las pestañas de la lista, y todo lo que la app disponga entre ellas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño y el aspecto de la lista: una columna por defecto, `flex-row` para una fila. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | Se pulsó la pestaña: un toque, un clic, Espacio o Return mientras tiene el foco del teclado, o la activación de un lector de pantalla; o bien una tecla de flecha, Home o End de su lista movió el foco del teclado hacia ella. Se ejecuta antes de que cambie nada: la pestaña muestra el `selected` que la app devuelve. |

La pestaña seleccionada también informa de sus pulsaciones, de modo que la app puede actuar ante una segunda pulsación (por ejemplo, desplazar su sección al principio).
Una pestaña deshabilitada no informa de nada.

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada con | Estados |
|---|---|---|---|
| La lista | | `Tabs`: `class`, `style` | |
| El indicador | la lista, detrás de las pestañas | `indicatorClass`, `indicatorStyle` | sobre la pestaña seleccionada |
| La pestaña | la lista | `Tab`: `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (o `selectedStyle`, `disabledStyle`, ...) |
| La etiqueta | la pestaña | sus propios elementos (`children`) | `group-selected:`, `group-disabled:` y las demás variantes `group-*:` con `group` en el `class` de la pestaña |
| El contenido de la sección | junto a la lista | los elementos de la app | el valor de la app |

Muestra la pestaña seleccionada mediante su propia superficie: un relleno, una etiqueta más marcada, un peso más grueso (consulta las [Guías de diseño](../docs/design-guides.md#interaction-states)).

<a id="indicator"></a>

## Indicador

Un subrayado bajo la pestaña seleccionada, una píldora detrás de ella o el segmento elevado de un control segmentado es el indicador de la lista: una vista que la app estiliza con `indicatorClass` y `indicatorStyle`, dibujada detrás de las pestañas y posicionada de forma absoluta en la lista. Native Shell la sitúa sobre la pestaña seleccionada después de cada layout. A lo largo de la lista (el ancho de una fila, el alto de una columna) abarca esa pestaña, dentro de los márgenes propios del indicador en ese eje (`mx-3` para un subrayado más corto que su pestaña); a lo ancho de la lista, sus clases lo posicionan:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

Cuando la app selecciona otra pestaña, el indicador se desplaza hasta ella de forma nativa con un efecto de resorte, como el indicador de la barra de pestañas de GPUI Kit; con movimiento reducido, se mueve de inmediato. Mientras no haya ninguna pestaña seleccionada permanece oculto; mientras haya varias, se sitúa en la primera. Un cambio de tamaño o un cambio en el ancho de una pestaña lo mueve en el mismo fotograma que las pestañas. El indicador no necesita eventos de layout ni código de la app: la pestaña seleccionada es aquella cuyo `selected` es verdadero. En una lista con desplazamiento, la vista de scroll rodea el `Tabs`, y el indicador se desplaza junto con las pestañas.

<a id="disabled"></a>

## Deshabilitado

Una pestaña deshabilitada no admite pulsaciones, y los lectores de pantalla la anuncian como atenuada. Sus clases `disabled:` se aplican sobre las `selected:`, y las clases `group-disabled:` que hay dentro de ella las siguen:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## Accesibilidad

- Una pestaña es un solo elemento para los lectores de pantalla, con el rol `"tab"` y su estado seleccionado. Su etiqueta es el texto de sus hijos, o `accessibilityLabel`.
- `Tabs` tiene el rol `"tablist"`: los lectores de pantalla perciben las pestañas que contiene como un solo conjunto, cada una todavía como un elemento independiente.
- `disabled` se anuncia como lo anuncia la plataforma (VoiceOver, TalkBack, UI Automation, el árbol de accesibilidad del navegador).
- En macOS y la web, la lista es una sola parada del foco del teclado, y las teclas de flecha se mueven entre sus pestañas (más abajo).
- El indicador está oculto para los lectores de pantalla y no recibe el foco: solo las pestañas son los elementos de la lista.

Consulta [Accesibilidad](../docs/accessibility.md) para ver etiquetas, roles y anuncios en general.

<a id="keyboard"></a>

## Teclado

En macOS y la web, donde Tab llega a las vistas que admiten pulsaciones, una lista `Tabs` sigue el [patrón de pestañas de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| Tecla | Qué hace |
|---|---|
| Tab, Shift+Tab | Entra en la lista por la pestaña seleccionada (la primera pestaña no deshabilitada si no hay ninguna), y sale de ella en un solo paso. |
| Derecha, Abajo | Mueve el foco a la pestaña siguiente, de la última a la primera. |
| Izquierda, Arriba | Mueve el foco a la pestaña anterior, de la primera a la última. |
| Home, End | Mueve el foco a la primera o a la última pestaña. |
| Espacio, Return | Pulsa la pestaña enfocada. |

Las teclas de flecha omiten las pestañas deshabilitadas, y la pestaña a la que se mueven informa `onPress`, de modo que la app la selecciona a medida que se mueve el foco: la sección sigue al foco. Ambos pares de flechas se mueven, sea cual sea el layout de la lista, que es una clase de la app. En un layout de derecha a izquierda la fila corre desde la derecha, así que Izquierda y Derecha intercambian sus lugares: Izquierda se mueve a la pestaña siguiente y Derecha a la anterior; Arriba, Abajo, Home y End conservan los suyos. Los estilos `focus:` muestran dónde está el foco. Un `Tab` fuera de un `Tabs` es una parada independiente.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android y Mac Catalyst: una pulsación es un toque que termina sobre la pestaña, incluida su etiqueta.
- Escritorios (macOS, Windows, Linux, GPUI) y la web: una pulsación es un clic. En macOS y la web, Espacio y Return también pulsan la pestaña que tiene el foco del teclado, y las teclas de flecha, Home y End lo mueven ([Teclado](#keyboard)).
- Cada plataforma dibuja lo que la app estiliza: las pestañas, la superficie de la seleccionada, el indicador y el contenido de las secciones. El desplazamiento del indicador es una animación de layout nativa en todas las plataformas.
