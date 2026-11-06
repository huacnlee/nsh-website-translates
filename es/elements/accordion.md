---
title: "Accordion"
description: "Accordion y sus partes: secciones apiladas que se expanden y se contraen bajo sus encabezados, de una en una o varias a la vez, abiertas según el valor de la app, reveladas mediante una altura con efecto de resorte cuando se solicita, y con toda la apariencia definida por la app."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---


# Accordion

Un acordeón apila secciones que se expanden y se contraen bajo sus encabezados: las preguntas de unas FAQ, los grupos de una página de ajustes, los pasos de un proceso de pago. Lo forman cinco partes, cada una con una pieza del comportamiento y ninguna con el aspecto:

- `Accordion`, la pila: guarda los `value` de la app, los valores de los ítems abiertos, y informa del siguiente con `onChange`. Se abre un ítem a la vez, o varios con `multiple`.
- `AccordionItem`, una sección, identificada por su `value`. Está abierta mientras el `value` del acordeón la contenga.
- `AccordionHeader`, el encabezado del ítem, de un `level` que los lectores de pantalla anuncian.
- `AccordionTrigger`, el botón del encabezado que expande y contrae su ítem, e indica si está expandido.
- `AccordionPanel`, el contenido del ítem, visible mientras está abierto; con `reveal` su altura se abre y se cierra con un resorte.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

Las partes provienen de [`nsh/base`](../modules/nsh-base.md), el crate `nsh-base` de Rust. El valor pertenece a la app: la pulsación de un trigger informa del siguiente `value` con `onChange`, y el acordeón abre los ítems cuyos valores la app le devuelve. Cada parte encuentra por sí sola la que la rodea, de modo que la app las dispone con libertad: divisores entre los ítems, una insignia en un encabezado, un icono antes de un título. En Rust, `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()` y `accordion_panel()` las crean, con un setter por cada prop y `.child(..)` para lo que va dentro.

## Props

### Accordion

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | Los `value` de los ítems abiertos. Pertenecen a la app: la pulsación de un trigger informa de los siguientes con `onChange`, y el acordeón muestra los que la app le devuelve. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Varios ítems abiertos a la vez: abrir uno deja abiertos los demás. Sin esta prop, abrir un ítem cierra el que estaba abierto. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Todos los ítems están deshabilitados: ningún trigger recibe pulsaciones y los lectores de pantalla indican que cada uno aparece atenuado. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | Los ítems, y lo que la app disponga entre ellos (divisores). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño y el aspecto de la pila: una tarjeta alrededor de los ítems, el espacio entre ellos. |

### AccordionItem

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | obligatorio | Lo que identifica al ítem en el `value` del acordeón: el id propio de la app, nunca su título, que cambia con el idioma. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Su trigger no recibe pulsaciones y los lectores de pantalla indican que aparece atenuado. Sigue abierto o cerrado según lo que diga el `value` del acordeón. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El encabezado y el panel del ítem, y cualquier otra cosa que la app disponga en él. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | La sección: un divisor debajo, una tarjeta alrededor. |

### AccordionHeader

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | El nivel del encabezado entre los encabezados de la página, para los lectores de pantalla (1 es el más alto). |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El trigger del ítem, y cualquier otra cosa que contenga el encabezado (una insignia, una acción propia). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño del encabezado. |

### AccordionTrigger

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del trigger mientras su ítem está abierto, como clases `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que dicen los lectores de pantalla, cuando los hijos no contienen texto que lo diga. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El título y el chevron; las clases `group-aria-expanded:` de su interior siguen al trigger con `group` en su `class`. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El trigger en sí: la fila que pulsa el usuario. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | ninguno | El estilo del trigger mientras está pulsado, con el puntero encima, enfocado o deshabilitado, como las clases `<state>:`. |

### AccordionPanel

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | Se abre y se cierra con un efecto de revelado, como el de `Collapsible`: el panel recorta su contenido y su altura pasa con un resorte de cero a la del contenido y de vuelta, con amortiguación crítica (unos 265 ms, sin rebote), y los ítems siguientes se desplazan con él. Con movimiento reducido se abre y se cierra al instante. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | El contenido permanece en el árbol mientras el ítem está cerrado, fuera de la vista, del foco del teclado y de los lectores de pantalla: un vídeo conserva su posición, una web view su página. Sin esta prop, el contenido sale del árbol cuando el panel se cierra (una vez que el revelado lo ha cerrado) y vuelve tal como estaba. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Cómo llaman los lectores de pantalla a la región: normalmente el título del ítem, tal como lo dice su encabezado. |
| `children` | `.child(..)` | `JSX.Element` | ninguno | El contenido. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | El diseño y el aspecto de la región. Con `reveal` el panel está en el layout mientras está cerrado, con altura cero, así que su relleno y sus bordes van en una vista de su contenido. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Se pulsó un trigger: un toque, un clic, Espacio o Retorno mientras tiene el foco del teclado, o la activación de un lector de pantalla. `value` son los valores de los ítems abiertos tal como quedarían: el valor de un ítem abierto sale de la lista, el de uno cerrado se añade al final o, sin `multiple`, reemplaza al anterior. Se ejecuta antes de que cambie nada: asigna `value` para seguirlo. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Se estiliza con | Estados |
|---|---|---|---|
| La pila | | `class`, `style` de `Accordion` | |
| Un ítem | la pila | `class`, `style` de `AccordionItem` | el valor de la app |
| El encabezado | el ítem | `class`, `style` de `AccordionHeader` | |
| El trigger | el encabezado | `class`, `style` de `AccordionTrigger` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (o `expandedStyle`, `disabledStyle`, ...) |
| El título y el chevron | el trigger | sus propios elementos (`children`) | `group-aria-expanded:`, `group-disabled:` con `group` en el `class` del trigger |
| El panel | el ítem, después del encabezado | `class`, `style` de `AccordionPanel` | |
| El contenido | el panel | sus propios elementos (`children`) | |

Sin `reveal`, un panel cerrado queda fuera del layout y su contenido fuera del árbol. Con `reveal`, el cambio es una animación de layout del commit que modifica `value` (como `LayoutAnimation.configureNext`, ejecutada de forma nativa, por lo que no se ejecuta JavaScript mientras se mueve): el panel que se abre crece de cero a la altura de su contenido, el que se cierra vuelve a encogerse, ambos con el mismo resorte, y los ítems siguientes se desplazan con ellos. Una transición de la app los acompaña: el chevron gira (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Deshabilitado

El trigger de un ítem deshabilitado no recibe pulsaciones y los lectores de pantalla lo anuncian como atenuado; las clases `disabled:` del trigger y las `group-disabled:` de su interior lo siguen. El `disabled` del acordeón deshabilita todos los ítems. Un ítem deshabilitado sigue mostrando lo que dice el `value` de la app: la app puede abrirlo.

<a id="accessibility"></a>

## Accesibilidad

- La pila es un grupo, cada encabezado es un heading de su `level` y cada trigger es un botón dentro de él que indica si su ítem está expandido. Los lectores de pantalla pueden ir de encabezado en encabezado.
- Un panel abierto es una región, nombrada por su `accessibilityLabel`; uno cerrado queda oculto para los lectores de pantalla, incluido el contenido que se mantiene.
- El aspecto del ítem abierto es decisión de la app y no debería depender solo del color: gira el chevron, como hacen los ejemplos.

Consulta [Accessibility](../docs/accessibility.md) para ver las etiquetas, los roles y los anuncios en general.

<a id="keyboard"></a>

## Teclado

Donde las vistas que reciben pulsaciones son paradas del foco del teclado (macOS y la web), cada trigger es una parada, en el orden de la página, y Espacio y Retorno lo pulsan. Los triggers deshabilitados se omiten, y también el contenido de un panel cerrado. Tab pasa de un trigger a los controles de su panel abierto y de ahí al siguiente trigger.

<a id="platform-notes"></a>

## Notas de plataforma

- Todas las plataformas muestran el panel de un ítem abierto bajo su encabezado y dejan uno cerrado fuera del layout (con altura cero con `reveal`).
- Con `reveal`, todas las plataformas animan con un resorte la altura de los paneles en su propio animador (iOS, Android, macOS, Windows, Linux, GPUI y la web), y los abren y cierran al instante cuando el sistema pide movimiento reducido.
- El lector de pantalla de cada plataforma oye el encabezado y su nivel al leer los encabezados, y el trigger de su interior como un botón con su estado expandido; en iOS, VoiceOver lee el propio trigger.
- iOS, Android y Mac Catalyst: la pulsación de un trigger es un toque. Escritorio (macOS, Windows, Linux, GPUI) y la web: un clic, y Espacio o Retorno sobre el trigger enfocado en macOS y la web.
