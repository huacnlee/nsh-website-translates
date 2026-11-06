---
title: "JSX y componentes"
description: "Cómo NSH describe la interfaz de usuario en Rust y en TSX: elementos, componentes, props, children, control de flujo, refs y spreads, y cómo el compilador de JSX y los builders de Rust crean los mismos elementos nativos."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---


# JSX y componentes

Las apps de NSH describen su UI con elementos y componentes, en Rust o en TSX. Rust construye los elementos con funciones y métodos builder tipados (`view().gap_4().child(..)`); TSX los escribe como JSX, que el compilador de NSH convierte en llamadas directas al mismo renderizador nativo, sin React ni DOM virtual. En ambos casos, un componente es una función que se ejecuta una sola vez para construir su parte del árbol. Lo que mantiene la UI actualizada después es la [reactividad](./reactivity.md): los bindings que leen signals se siguen de forma nativa, y solo ellos se ejecutan de nuevo.

<a id="elements"></a>

## Elementos

Los **elementos host** están respaldados cada uno por una vista nativa. Rust los crea con las funciones del prelude; TSX los importa de `nsh` como componentes, y solo `If` y `Each` son globales que no necesitan importación:

| Rust | TSX | Vista nativa | Página |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: una caja para layout, estilos y toques | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Una vista de texto nativa; los elementos de texto anidados son spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Una vista de imagen (recursos locales y URLs) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Una lista virtualizada que recicla sus filas | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Un dibujo, una página web, un reproductor de vídeo | [Elementos](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` de `nsh/base` | Una capa presentada | [Elementos](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Control de flujo, sin vista propia | [Control de flujo](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

En Rust, los estilos son métodos tipados con los nombres de las utilidades de Tailwind (`.px_4()`, `.rounded_lg()`, `.bg(..)`), y los listeners también son métodos (`.on_press(..)`); los ajustes exclusivos de una plataforma tienen sus propios métodos. En TSX, las props conservan sus nombres en camelCase (`onPress`, `allowFontScaling`, `backgroundColor`); todo elemento acepta `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, manejadores de toques, props de accesibilidad y `testID`, y las props exclusivas de una plataforma van en `ios={{…}}` y `android={{…}}`, donde solo se envía el objeto de la plataforma actual:

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

Las etiquetas TSX se escriben en PascalCase para que TypeScript compruebe cada una contra el binding que nombra: una etiqueta en minúsculas se comprueba contra un único tipo global por nombre, de modo que un componente genérico como `List` o `Each` no podría inferir el tipo de sus filas a partir de `each` / `of`, y los componentes propios de una app no tendrían ningún tipo. Las importaciones no cuestan nada en tiempo de ejecución: el compilador reconoce las primitivas por sus importaciones (también con alias) y crea el elemento nativo en el lugar, así que `<View>` es una llamada directa al renderizador y la importación se elimina del bundle. Una etiqueta en minúsculas es un error de compilación que indica qué escribir:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> El texto solo se muestra dentro de un elemento de texto: `text(..)` en Rust, `<Text>` en TSX. Una cadena directamente dentro de un `<View>` no crea ninguna vista nativa y no se muestra.

<a id="components"></a>

## Componentes

El aspecto de una app es propio de la app. NSH ofrece dos capas: las primitivas (los elementos anteriores, los estilos, las clases de Tailwind) y los componentes base sin estilo de [`nsh/base`](../modules/nsh-base.md) (`nsh_base` en Rust), que se encargan de comportamientos como la navegación, los diálogos, el teclado, la barra de estado y las áreas seguras. La tercera capa, la biblioteca de componentes, es tuya: los botones, las tarjetas y cualquier otra pieza de tu UI son componentes que escribes sobre esas dos capas, en el crate de tu app ([Building with Rust](./rust.md)) o en TSX, o una biblioteca de la comunidad ([Three layers](./architecture.md#three-layers)).

Un componente de Rust es un `#[component] fn` que recibe su struct de props (y, cuando tiene eventos, un `Scope` para emitirlos) y devuelve sus elementos. `#[component]` también crea su constructor, con el nombre de la función en snake case: `Badge` se coloca con `badge()`, igual que `view()` coloca una vista, con un setter por prop (`.label(..)`, `.color(..)`: un valor, un signal o un closure). Un componente de TSX es una función que recibe un objeto de props y devuelve JSX:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

La función se ejecuta **una vez**, cuando se crea el componente, y no rastrea lo que lee: no hay re-renderizado. El código de su cuerpo (crear signals, iniciar effects, calcular constantes) se ejecuta una sola vez. Los elementos que devuelve permanecen conectados a las props y los signals que leen, de modo que `Badge` arriba actualiza su texto cada vez que cambia `unread`, sin volver a ejecutar `Badge`.

Escribe un `#[component]` cuando la UI tenga props o eventos propios, o cuando una entrada TSX lo importe: un componente de Rust se registra bajo su tipo (`registry.register::<Badge>()`), con props tipadas a partir del struct ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). Para una pieza de UI que solo usa Rust, basta una función simple que devuelva `impl IntoElement`, con sus argumentos como props. En TSX, un componente puede devolver un elemento, una cadena o un número, un array, `null`, o una función que devuelva cualquiera de estos (que el renderizador sigue); el tipo `Component<P>` de `nsh` describe uno:

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### Qué se ejecuta de nuevo

Un valor dado a un elemento se establece una vez; un binding sigue lo que lee. En Rust, un binding es un closure (o un signal, un memo, una prop) dado donde va un valor. En TSX, el compilador decide para cada expresión del JSX: una expresión cambia cuando **llama a una función o lee una propiedad** (fuera de funciones anidadas), y todo lo demás se establece una vez:

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

Una prop o un hijo cambiante es un pequeño effect nativo que establece esa única prop o reemplaza ese único hijo. En Rust los estilos se comparan por diferencias, de modo que un estilo que cambia solo envía las propiedades que cambiaron.

Los manejadores de eventos se establecen una vez: un closure en Rust, una función o un nombre en TSX (`onPress={() => …}`, `onPress={save}`). En TSX, las demás expresiones se siguen (`onPress={props.onPress}` sigue la prop).

### Props

Las props de un componente de Rust son los campos de su struct `#[derive(Props)]`, cada uno un `Prop<T>`: un valor, o un binding que pasó el padre. Léelo dentro de un binding (`text(props.title)`, `move || props.title.get()`) para seguirlo; `props.title.get()` en el cuerpo lo lee una sola vez. Los campos con `#[prop(default)]` o `#[prop(default = …)]`, y los `Option`, son opcionales. El constructor inicia cada prop con su valor por defecto, y un padre llama a los setters de las que necesita: `badge().label("New")`.

Una prop de TSX a la que se le da una expresión cambiante se pasa como getter: al leer `props.title` se la invoca, y eso es lo que permite que el JSX que la lee la siga. Las props estáticas son valores simples. En ambos casos, las props se leen donde se usan:

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

Un componente de TSX que desestructura sus props en el parámetro, `function Title({ text }: …)`, las lee igualmente una sola vez, y la compilación lo advierte indicando las props que se deben leer en su lugar:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Una prop que el componente quiere solo una vez, como un id con el que empieza, se lee en el cuerpo (`props.id.get_untracked()`, `const { id } = props;`), lo que deja claro su intención.

En TSX lo mismo se aplica a los valores por defecto: escribe `props.color ?? "#ddf4ff"` en el JSX en lugar de desestructurar con un valor por defecto. Para calcular algo a partir de las props, usa un closure o [`computed`](./reactivity.md#computed):

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

<a id="children"></a>

### Hijos

Lo que un padre coloca dentro de un componente llega como sus hijos: un campo `children: Prop<Children>` en Rust, que el padre rellena con `.child(..)`; `props.children` en TSX, un getter que construye esos elementos al leerse:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

En TSX, cada lectura de `props.children` vuelve a construir los hijos (nuevas vistas nativas): léelo una sola vez, en el lugar donde van los hijos. Entre varios hijos, uno que cambia (un `<If>`, un `<Each>`, `{cond() ? a : b}`) llega como una función, y `{props.children}` actualiza solo ese: sus hermanos conservan sus vistas, y un input conserva su texto y su foco. Los fragmentos (`<>…</>`) agrupan elementos sin vista.

Los hijos también pueden crearse mediante una función que el componente llama con argumentos, un render callback:

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## Control de flujo

`when` y `each` en Rust, `<If>` y `<Each>` en TSX, son estructuras de control de flujo integradas. No renderizan ninguna vista propia.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`** muestra su rama mientras se cumple la condición y, si no, la rama `otherwise` / `else`. Solo vuelve a renderizar una rama cuando cambia si la condición se cumple, no cada vez que se reevalúa la condición. En TSX, un hijo función recibe un accessor del valor de `when`, tipado sin `null` ni `undefined`: `u()` es el usuario mientras se muestra la rama, y lo sigue cuando cambia.
- **`each`** / **`<Each>`** renderiza una fila por elemento, creada por su función de fila. Las filas se conservan por clave (Rust: la función de clave; TSX: `key`, por defecto el propio elemento, los objetos por identidad y los primitivos por valor): cuando la lista cambia, las filas conservadas se mueven en lugar de reconstruirse, y solo se crean filas nuevas para las claves nuevas. La función de fila recibe **signals** del elemento y de su índice (`todo.get()` y `index.get()` en Rust, `todo()` y `index()` en TSX), porque el elemento y la posición de una fila conservada pueden cambiar. En TSX, `key="index"` (o `key={(item, i) => i}`) conserva las filas por posición: una lista de cadenas que cambia en el sitio, como el texto que llega en streaming, conserva sus filas y solo cambia su `item()`.

Una elección hecha en un closure (`dynamic(move || if busy.get() { … } else { … })` en Rust, un ternario o `&&` en TSX) vuelve a construir su rama cada vez que cambia algo de lo que lee. Prefiere `when` / `<If>` cuando una rama tiene más de unos pocos elementos.

Para listas largas o infinitas, usa [`List`](./lists.md) (`virtual_list` en Rust): crea vistas solo para las filas en pantalla y las recicla. Consulta [Control de flujo](../elements/control-flow.md) para ver los detalles.

## Refs

Un ref nombra un elemento host para llamadas imperativas: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([dónde está una vista](./touch-and-gestures.md#where-a-view-is-measure)), ... En Rust, `element_ref()` crea uno y `.element_ref(&handle)` lo coloca en un elemento; en TSX, `ref` te da el ref del elemento, cuyo tipo es el propio del elemento (`InputRef` aquí, `ViewRef` para un `View`; consulta [ref methods](../elements/index.md#ref-methods)):

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

Un ref de Rust es un handle `Copy`; sus llamadas van al elemento que lo lleva y no hacen nada cuando su propietario ya no existe. En TSX, lo que nombra `ref={…}` recibe el nodo:

- una variable declarada con `let` lo recibe por asignación;
- un campo (`ref={refs.input}`, `ref={refs[name]}`) lo recibe por asignación;
- un [signal](./reactivity.md) se establece con él, de modo que lo que lee el signal lo sigue;
- una función se llama con él (`<Scroll ref={(node) => (scroller = node)} />`).

Un `const` o una importación contiene un signal o una función, como en `const input = signal<InputRef>()` con `<Input ref={input} />` y `input()?.focus()`; si contiene cualquier otra cosa, se informa al crear el elemento, indicando qué escribir.

El ref se establece cuando se crea el elemento, antes de que el componente devuelva, por lo que está disponible en [effects](./reactivity.md#effect) y en los manejadores de eventos. Las llamadas se envían a la vista en orden junto con los cambios hechos antes de ellas. Los componentes base y los componentes de Rust del crate propio también aceptan `ref` (en Rust `component_ref()`, colocado en el elemento con `.component_ref(&r)`: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Propagación de props

En Rust, un padre llama a los setters de las props que necesita y las demás conservan sus valores por defecto, y un wrapper pasa sus propios `Prop` tal cual (`card().title(props.title)`): un `Prop` sigue lo que se le dio.

En TSX, propaga un objeto de props sobre un elemento o un componente con `{...props}`. Los getters siguen siendo getters, de modo que las props propagadas siguen lo que leen. Para quedarte con algunas props y pasar el resto, usa `split`:

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

`split(props, keys)` devuelve `[picked, rest]`, y ambos siguen leyendo a través de las props originales (desestructurar `{ label, ...rest } = props` leería cada prop una vez). Las props de elemento que vienen después en el JSX prevalecen sobre las anteriores.

`<If>` y `<Each>` no admiten props propagadas, y los hijos propagados (`{...items}`) no están soportados: usa `<Each>` o una expresión de array.

<a id="tags-and-names"></a>

## Etiquetas y nombres

Un elemento de Rust es lo que el código llame: la función de una primitiva, el constructor de un componente (`badge()`, `nsh_base::button()`) o una función propia. Una etiqueta TSX nombra un binding en el ámbito, como de costumbre: `<Badge />`, `<Theme.Provider>`, un `<Button>` propio. Una etiqueta que no nombra nada en el ámbito es un error de compilación, excepto `<If>` y `<Each>`, que son globales.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

El `Button` de `nsh_base` (`button()` en Rust, `<Button>` de `nsh/base`) es el objetivo de pulsación sin estilo, con los estados deshabilitado y seleccionado y su accesibilidad; la app le da su aspecto: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

En TSX, tus bindings prevalecen sobre los globales: un componente llamado `Each` en el ámbito hace que `<Each>` sea ese componente. Una primitiva se reconoce por su importación, así que `import { View as Box } from "nsh"` hace de `<Box>` una vista, y un componente propio llamado `Text` es simplemente tu componente. Las primitivas también son componentes reales: `const Tag = inline ? Text : View;` y después `<Tag>…</Tag>` funciona.

Los componentes se tipan por sus propias declaraciones: el compilador comprueba los structs de props de Rust, y TypeScript comprueba las props de un componente TSX dondequiera que se use, sin nada que generar. Un componente de Rust que una entrada TSX importa obtiene declaraciones de TypeScript generadas a partir de su struct.

<a id="mounting-and-the-root"></a>

## Montaje y raíz

La raíz de una app de Rust es el componente que nombra el `"root"` de `nsh.json`; `nsh run` y `nsh package` lo montan. Una entrada TSX llama a `mount(App)` para renderizar el componente raíz (`mount(App, props)` le pasa props). La vista raíz llena la superficie (la ventana, o la vista en la que una app incrusta NSH). Dale a la raíz `flex: 1` para que llene la pantalla, y un color de fondo: el fondo propio de la superficie depende de la plataforma.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## Relacionado

- [Reactivity](./reactivity.md): señales, efectos, contexto.
- [Elements](../elements/index.md): cada elemento host y sus props.
- [Styling](./styling.md) y [Tailwind](./tailwind.md): el aspecto de tus componentes.
- [Building with Rust](./rust.md): aplicaciones en Rust, componentes en el propio crate de tu aplicación y TSX por encima.
