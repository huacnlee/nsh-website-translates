---
title: "Accesibilidad"
description: "Cómo lograr que las aplicaciones funcionen con VoiceOver y TalkBack: etiquetas, roles, estados, valores, acciones personalizadas, agrupación y ocultación, anuncios y foco, tamaño del texto y movimiento reducido."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---


# Accesibilidad

NSH renderiza con vistas nativas, por lo que las tecnologías de accesibilidad de las plataformas (VoiceOver en iOS y Mac Catalyst, TalkBack en Android, Switch Control, Voice Control, ...) ven la jerarquía de vistas real de tu app. Lo que tú añades son las descripciones que esas tecnologías no pueden inferir: qué es un elemento, qué dice, en qué estado está y qué puede hacer. Todos los elementos aceptan los métodos (Rust) y las props (TSX) siguientes.

<a id="what-you-get-without-doing-anything"></a>

## Lo que obtienes sin hacer nada

- **El texto se lee.** Un elemento de texto es un elemento de accesibilidad cuya etiqueta es su texto. Una vista sin etiqueta se lee como los textos que contiene.
- **Las vistas pulsables son elementos.** Una vista con un manejador de pulsación o de pulsación larga (`.on_press`, `onPress`) es un elemento de accesibilidad por defecto, y activarla (doble toque con VoiceOver o TalkBack) la pulsa.
- **Los inputs son campos de texto**, con su placeholder, su valor y su teclado.
- **El texto sigue el ajuste de tamaño del usuario.** Consulta [Tamaño del texto](#text-size).

<a id="labels-hints-and-roles"></a>

## Etiquetas, sugerencias y roles

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | Tipo | Descripción |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | La vista es un único elemento para las tecnologías de accesibilidad; sus hijos no se exponen por separado. |
| `.label(..)` | `accessibilityLabel` | `string` | Lo que leen los lectores de pantalla, en lugar de los textos que contiene. |
| `.hint(..)` | `accessibilityHint` | `string` | Lo que hace activar el elemento, leído después de una pausa. |
| `.role(..)` | `role` | `AccessibilityRole` | Qué es el elemento. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Su estado: deshabilitado, seleccionado, marcado, ocupado, expandido, pulsado, actual. `selected` también aplica el estilo de seleccionado, `checked` el estilo de marcado cuando es true y el estilo de indeterminado cuando `"mixed"`, `pressed` el estilo de pulsado cuando es true. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | El nivel de un encabezado (1 el más alto), la profundidad de un elemento de árbol (1 en lo más alto). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | El valor de un elemento de rango o de texto. |
| | `accessibilityActions` | `{ name, label? }[]` | Acciones ofrecidas a las tecnologías de accesibilidad. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | Se realizó una acción (Rust: su nombre). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Oculta la vista y su subárbol a las tecnologías de accesibilidad. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Si la vista (y su subárbol) está expuesta. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: cómo se anuncian a TalkBack los cambios de la vista. |
| `.test_id(..)` | `testID` | `string` | Un identificador para pruebas de UI (el accessibility identifier en iOS, el resource id en Android); no se lee en voz alta. |

Da una etiqueta a todo control que solo tenga un icono: un lector de pantalla no puede leer un glifo ni una imagen. Mantén las etiquetas cortas y no incluyas el rol ("Reproducir", no "Botón reproducir"): el rol se anuncia por separado.

### Roles

El rol (`.role(AccessibilityRole::Header)`, `role="header"`) le dice al usuario qué tipo de elemento es y cómo manejarlo. En Rust es una variante de `AccessibilityRole` (`Button`, `Header`, `Switch`, ...); los valores de TSX son `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` y `"cell"` (los roles de las partes de [`Table`](../elements/table.md)), `"listbox"` y `"option"` (una lista de opciones entre las que elegir, como la lista de [`Select`](../elements/select.md), y sus opciones, la elegida marcada con `accessibilityState.selected`), `"group"` (elementos relacionados que van juntos), `"region"` (una sección a la que vale la pena llegar por sí sola, como el panel de un acordeón), `"navigation"` (enlaces que se mueven por la app, como una paginación), `"tree"` y `"treeitem"` (elementos que se expanden y se contraen, cada uno en su `accessibilityLevel`), `"menuitemcheckbox"` y `"menuitemradio"` (elementos de menú que se marcan, solos o como una opción de un grupo).

Los más útiles:

- `"button"` para cualquier elemento pulsable que no sea un enlace; `"link"` para navegar a contenido.
- `"header"` para los títulos de sección: los usuarios de lectores de pantalla saltan entre encabezados para recorrer una pantalla. `accessibilityLevel` indica su nivel (1 el más alto) donde la plataforma lo lee.
- `"button"` con `accessibilityState.pressed` para un botón de alternancia, que permanece activado o desactivado (negrita en una barra de herramientas).
- `"navigation"` alrededor de enlaces que se mueven entre páginas, con `accessibilityState.current: "page"` en el enlace de la página mostrada.
- `"switch"`, `"checkbox"`, `"radio"` con `accessibilityState.checked`.
- `"adjustable"` para sliders y steppers, con `accessibilityValue` y las acciones `increment` / `decrement`
  (cada thumb de un [`Slider`](../elements/slider.md) es uno).
- `"spinbutton"` para un campo que contiene un número que el usuario también puede incrementar o decrementar, con el mismo valor y las mismas acciones (el
  campo de un [`NumberInput`](../elements/number-input.md)).
- `"image"` para imágenes con significado, con una etiqueta; las imágenes decorativas deben ocultarse en su lugar.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### Estados y valores

Para un control de activado / desactivado en una app, usa [`Switch`](../elements/switch.md) de `nsh/base`, que establece el rol y el estado por sí mismo. El ejemplo muestra qué hacen un rol y un estado en una vista.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

El estado es `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` en Rust y `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` en TSX. `pressed` convierte un botón en un botón de alternancia (`aria-pressed` de ARIA); `current` marca el elemento actual de un conjunto (`aria-current` de ARIA): la página de una paginación, el paso de un asistente. `disabled` también está implícito al deshabilitar la vista (`.disabled(..)`, `disabled`). `accessibilityValue` con `min`, `max` y `now` se lee como un porcentaje; con `text` se lee tal cual ("3 de 10", "Medio").

<a id="actions"></a>

## Acciones

Una vista pulsable ya admite la activación. Para cualquier otra, declara acciones con `accessibilityActions` y gestiónalas con `onAccessibilityAction`; un componente de Rust recibe el nombre de la acción realizada con `.on_accessibility_action(|name: &str| ..)`:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

Algunos nombres de acción son estándar y se corresponden con los gestos propios de las plataformas:

| Nombre | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Doble toque | Doble toque (clic) |
| `increment`, `decrement` | Deslizar hacia arriba / abajo; luego VoiceOver lee el nuevo valor | Desplazar hacia delante / atrás |
| `longpress` | | Doble toque y mantener |
| `expand`, `collapse` | | Expandir / contraer |
| `magicTap` | Doble toque con dos dedos | |
| `escape` | Gesto de Z con dos dedos | |

Un elemento con `increment` o `decrement` es ajustable sea cual sea su rol: un gráfico conserva su rol `"image"` y recorre sus puntos con los deslizamientos de VoiceOver y los desplazamientos de TalkBack, y su `accessibilityValue` se lee tras cada paso.

Cualquier otro nombre se convierte en una acción personalizada, que aparece en el rotor de acciones de VoiceOver y en el menú de acciones de TalkBack con su `label` (o con su nombre). Las acciones personalizadas son la forma accesible de deslizar para eliminar y gestos similares:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Agrupar y ocultar

Hacer accesible una vista (`.accessible(true)`, `accessible`) la convierte en un único elemento: una tarjeta con un título, un subtítulo y un precio se lee de una sola vez, en lugar de que el usuario tenga que deslizarse por tres textos.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

Oculta lo que no aporta nada: imágenes decorativas, divisores, un icono junto a un texto que ya dice lo mismo.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (el nombre de iOS) y `importantForAccessibility="no-hide-descendants"` (el de Android) ocultan ambos el subárbol en las dos plataformas; establecer los dos es inofensivo.

<a id="the-screen-reader-and-the-users-settings"></a>

## El lector de pantalla y los ajustes del usuario

En Rust, el prelude informa de los ajustes del usuario y habla con el lector de pantalla: `screen_reader()` y `reduce_motion()` son reactivos, `announce_for_accessibility(message)` hace que el lector de pantalla lea un mensaje, y el `element_ref()` de un elemento mueve el foco del lector de pantalla hacia él con `set_accessibility_focus()`. En TSX, la API de accesibilidad de `nsh` informa de los ajustes del usuario y te permite hablar con el lector de pantalla.

| Miembro | Descripción |
|---|---|
| `screenReaderEnabled()` | Si VoiceOver o TalkBack está en ejecución (reactivo). |
| `reduceMotion()` | Si el usuario pidió menos movimiento (reactivo). |
| `announce(message)` | El lector de pantalla lee `message`. |
| `setAccessibilityFocus(ref)` | Mueve el foco del lector de pantalla a una vista. |

Los ajustes son accesores: léelos en un binding o en un efecto, y lo que los lea se actualiza cuando el usuario cambia el ajuste, sin necesidad de limpieza.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

Anuncia los cambios que el usuario pasaría por alto: que termine un guardado en segundo plano, que aparezca un error lejos del foco, que acabe un temporizador. En Android, `android={{ accessibilityLiveRegion: "polite" }}` en una vista hace que TalkBack anuncie por sí mismo sus cambios.

<a id="text-size"></a>

## Tamaño del texto

El texto y los inputs siguen el tamaño de texto del sistema (Dynamic Type en iOS, tamaño de fuente en Android) a menos que lo desactives (`.allow_font_scaling(false)`, `allowFontScaling={false}`). En lugar de desactivarlo, diseña pensando en ello:

- Deja que el texto se ajuste en varias líneas: evita alturas fijas en las vistas que contienen texto.
- Limita los encabezados muy grandes con `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` en lugar de desactivar el escalado.
- Cambia de diseño cuando el texto sea grande: lee `font_scale()` (Rust) o `fontScale()` de `nsh` (TSX) (por ejemplo, apila una etiqueta y su valor en vertical por encima de 1.3).

Consulta [Dispositivo y entorno](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Movimiento reducido

`reduce_motion()` (Rust) y `reduceMotion()` (TSX) son `true` cuando el usuario activó Reducir movimiento (Reduce Motion) en iOS o el ajuste de eliminar animaciones en Android. Tus animaciones se ejecutan tal como las escribes, así que úsalo, o las variantes de Tailwind `motion-reduce:` y `motion-safe:`, para sustituir los movimientos grandes por un desvanecimiento o un cambio instantáneo:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## Áreas táctiles

Haz que los elementos pulsables midan al menos 44 × 44 puntos. Cuando un control deba verse más pequeño, amplía su área táctil con el hit slop (`.hit_slop(..)`, `hitSlop`) en lugar de su tamaño; consulta [Toque y gestos](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Comprobar tu app

- Activa VoiceOver (Ajustes de iOS, Accesibilidad, o triple clic en el botón lateral si está configurado) o TalkBack, y usa la app sin mirar: cada control debería decir qué es y qué hace.
- En los simuladores de iOS, el Accessibility Inspector de Xcode muestra la etiqueta, los rasgos y el valor de cada elemento.
- Prueba el mayor tamaño de texto y el modo oscuro.
- Un test id (`.test_id(..)`, `testID`) ofrece a las pruebas de UI un identificador estable que no cambia con el idioma de la etiqueta.

<a id="related"></a>

## Relacionado

- [API de accesibilidad de `nsh`](../modules/nsh.md#accessibility): la referencia.
- [`View`](../elements/view.md): todas las props de accesibilidad.
- [Animación](./animation.md#reduced-motion) y [Dispositivo y entorno](./device-and-environment.md).
