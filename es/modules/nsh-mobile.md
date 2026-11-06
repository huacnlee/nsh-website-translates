---
title: "nsh/mobile"
description: "Lo que ofrecen iOS y Android: TabBar, la barra de pestañas del sistema, InputAccessoryView en iOS, BackHandler en Android e isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---


# nsh/mobile

`nsh/mobile` contiene las capacidades específicas de iOS y Android: la barra de pestañas del sistema, `TabBar`, en ambas; [`InputAccessoryView`](#inputaccessoryview), una barra sobre el teclado, en iOS; y [`BackHandler`](#backhandler), el botón de retroceso, en Android. El código Rust usa `nsh_core::mobile` y `nsh_core::prelude`; TSX importa `nsh/mobile`. El módulo se puede importar en todas las plataformas, de modo que un mismo bundle funciona en todas partes: en las demás plataformas sus componentes no ocupan espacio y sus llamadas retornan de inmediato, y `isAvailable` indica si estás en iOS o Android (`platform.os` de `nsh` indica cuál). Lo que ofrecen los escritorios está en [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Alcance

Este módulo expone capacidades específicas de las plataformas móviles, como la barra de pestañas del sistema para la navegación de nivel superior de la app. Los controles comunes pertenecen a [`nsh/base`](./nsh-base.md): su [Switch](../elements/switch.md), por ejemplo, comparte comportamiento y API en teléfonos, escritorios y la web, con la pista, el pulgar y los estilos de estado proporcionados por la app. `TabBar` sirve a la navegación de las apps móviles; `Tabs` sirve al contenido con pestañas en todas las plataformas. Aquí solo pertenecen las capacidades con semántica de interacción específica de móvil. Una apariencia, un tamaño o una animación del sistema, por sí solos, no cambian el rol compartido de un control común. Esta distinción guía qué capacidades pertenecen aquí ([Objetivos y principios de diseño](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` en iOS, el simulador de iOS, Mac Catalyst y Android; `false` en el resto. Rust:
`matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Una barra de pestañas cambia entre las secciones de nivel superior de una app: registros y estadísticas, bandeja de entrada y ajustes. `TabBar` es la barra propia del sistema, así que se ve y se comporta como las apps del sistema: `UITabBar` en iOS y iPadOS (Liquid Glass y su selección en iOS 26), la barra de navegación de Material 3 en Android, con los colores del sistema, en claro y oscuro. La app proporciona las pestañas (`items`), indica cuál está seleccionada (`selectedIndex`), recibe la elección del usuario (`onChange`), coloca la barra con su `class` y su `style`, y muestra ella misma el contenido de la sección seleccionada. Para pestañas dentro de una página, y en todas las plataformas, usa [Tabs](../elements/tabs.md) de `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` viene de `nsh/mobile`, y `nsh_core::mobile` en Rust. La selección pertenece a la app: un toque informa `onChange` con el índice de la pestaña (`{ index }`), la barra muestra la elección de inmediato, como la del sistema, y la app muestra esa sección y devuelve el índice como `selectedIndex`. Su altura es la del sistema cuando el estilo no la fija. En Rust, `tab_bar()` crea una barra, con un setter por prop (`.items(..)`, `.selected_index(..)`), un listener por evento (`.on_change(..)`) y los métodos de estilo tipados; `TabBarItem::new(title).icon(name)` crea una pestaña.

<a id="props"></a>

### Propiedades

| Prop | Rust | Tipo | Valor predeterminado | Descripción |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | Las pestañas, en orden. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | La pestaña seleccionada, por índice; un índice fuera del rango de pestañas no selecciona ninguna. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: oculta la barra sin transición. La app es dueña de este valor entre push y pop. La barra se muestra cuando tanto esta prop como la solicitud `hidesBottomBarWhenPushed` de la pila visible son falsas. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | ninguno | Dónde está la barra: su posición y tamaño. Su aspecto es el del sistema, con la pestaña seleccionada en el `primary` del tema. |
| `testID` | `.test_id(..)` | `string` | ninguno | Localiza la barra en las pruebas y en `nsh test --trace`. |

#### TabBarItem

| Campo | Rust | Tipo | Descripción |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | El título de la pestaña, que leen los lectores de pantalla. |
| `icon` | `.icon(name)` | `string` | El icono de la pestaña, por el nombre que le da la plataforma: un [SF Symbol](https://developer.apple.com/sf-symbols/) en iOS (`"house"`), un drawable de la app en Android (`res/drawable/home.xml` es `"home"`, `"android:ic_menu_search"` el del sistema). `platform.select` elige uno por plataforma. |

<a id="events"></a>

### Eventos

| Evento | Rust | Descripción |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | El usuario eligió una pestaña: `{ index }`, su índice. La barra muestra la elección de inmediato; la app muestra el contenido de la pestaña y establece `selectedIndex`. |

<a id="platform-notes"></a>

### Notas por plataforma

- **iOS y Mac Catalyst**: `UITabBar`, con la apariencia del sistema para la versión de iOS: la barra flotante Liquid Glass y su selección en iOS 26. Los iconos son SF Symbols. El `primary` del tema es el `tintColor` de la barra, el color de la pestaña seleccionada; las demás pestañas conservan el del sistema.
- **Android**: la barra de navegación de Material 3, construida con las vistas de la plataforma: un icono en su indicador activo sobre cada etiqueta, una ondulación (ripple) al pulsar, los colores dinámicos del sistema en Android 12 y posteriores y los colores base de Material en versiones anteriores, en claro u oscuro según la apariencia de la app. En la parte inferior de la ventana se extiende bajo la barra de navegación, más alta en la medida de su inset, como la de Material. Los iconos son drawables de la app (teñidos por la barra). El icono y la etiqueta de la pestaña seleccionada toman el `primary` del tema, sobre un indicador activo de ese color al 12 % de opacidad; las demás pestañas conservan los del sistema.
- **Escritorios (macOS, Windows, Linux, GPUI) y la web**: las secciones se muestran con [Tabs](../elements/tabs.md), con el aspecto de la app. `TabBar` no ocupa espacio allí, así que un único layout sirve para ambos casos, elegido mediante `platform.os` ([la API de dispositivo de `nsh`](./nsh.md#device)).

## InputAccessoryView

En iOS y Mac Catalyst; en Android es una vista vacía y oculta.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Una barra sobre el teclado (`inputAccessoryView` de UIKit), que se muestra mientras tiene el foco un input cuyo `ios={{ inputAccessoryViewID }}` coincide con su `nativeID`. En Rust: `input_accessory_view(native_id)`, que se muestra para los inputs cuyo `.input_accessory(native_id)` coincide. Tiene el ancho de la ventana y la altura de su contenido, y se mueve con el teclado de forma nativa.

| Prop | Tipo | Rust | Descripción |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Los inputs con este `inputAccessoryViewID` muestran la barra. |
| `style` | `StyleProp<ViewStyle>` | Métodos de `Styled` (`.bg(…)`) | El estilo de la barra (su fondo, por ejemplo). |
| `class` | `string` | | Clases de Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | El contenido de la barra. |

No renderiza nada en el lugar del árbol donde se coloca, y no renderiza nada en absoluto en Android, así que puedes colocarla junto al input al que pertenece.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Consulta también [Formularios y teclado](../docs/forms-and-keyboard.md).

## BackHandler

En Android; en iOS sus listeners se conservan pero nunca se invocan, y `exitApp()` retorna de inmediato.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

El botón de retroceso del sistema y el gesto de retroceso. Los diálogos gestionan primero la pulsación de retroceso (un diálogo se cierra); después se ejecutan los listeners de `BackHandler`, empezando por el añadido más recientemente; cuando ninguno la gestiona, la pila de navegación superior hace pop, y si no hay página a la que volver, la app se cierra.

| Miembro | Rust | Descripción |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` devuelve `true` cuando gestionó la pulsación. Devuelve una función que deja de escuchar; un listener añadido mientras se renderiza un componente (o se ejecuta un efecto) se detiene junto con él, tanto en Rust como en TSX. |
| `exitApp()` | el listener devuelve `false` | Sale de la app. Un listener de Rust que devuelve `false` deja que la pulsación continúe, de modo que la pila retrocede o la app se cierra. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> El listener se ejecuta después de que el sistema haya entregado la pulsación: el hilo principal nunca espera al código de la app. Mientras haya al menos un listener registrado, NSH recoge las pulsaciones de retroceso que dejan los diálogos, y retrocede en la pila superior o cierra la app por sí mismo cuando ningún listener devuelve `true`.

La barra de estado se configura mediante el `statusBar` de las [páginas y diálogos](./nsh-base.md#status-bar) desde `nsh/base`, tanto en iOS como en Android.
