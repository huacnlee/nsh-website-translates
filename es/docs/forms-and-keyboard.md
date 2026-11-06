---
title: "Formularios y el teclado"
description: "Entrada de texto con el elemento input: valores controlados y no controlados, tipos de teclado, la tecla de retorno, el foco, la selección, inputs multilínea que crecen y cómo evitar que el teclado de software tape el contenido."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---


# Formularios y el teclado

La entrada de texto es el elemento input, `input()` en Rust y `<Input>` en TSX: un UITextField o un UITextView en iOS, un EditText en Android. La escritura, el cursor de texto, la selección, la autocorrección y el autocompletado son los propios de la plataforma; tu app recibe el texto mediante eventos y puede controlarlo. NSH también mantiene por sí mismo los inputs enfocados por encima del teclado en pantalla, y te da la altura del teclado como un valor reactivo para los casos que no puede resolver por sí solo.

Un input admite estilos como cualquier vista (métodos de estilo tipados en Rust, estilos y clases de Tailwind en TSX), de modo que los campos de un formulario tengan el aspecto propio de tu app. Un campo con etiqueta es un componente breve que escribes tú:

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## Inputs controlados y no controlados

Un input es **controlado** cuando le pasas su valor (`.value(..)`, en TSX `value`): muestra lo que contiene tu signal, y tú actualizas el signal desde el evento de cambio (`.on_change(..)`, en TSX `onChange`).

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

Como controlas el valor, puedes transformar lo que escribe el usuario: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` pasa a mayúsculas, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` conserva solo los dígitos.

<a id="input-methods"></a>

### Métodos de entrada

Los métodos de entrada chinos, japoneses y coreanos componen el texto antes de confirmarlo: el pinyin se convierte en 腾 cuando se elige un carácter. `onCompositionChange` (en Rust `.on_composition_change(..)`) informa de la composición a medida que avanza, `{ composing: true, text: "teng" }` mientras el usuario escribe y `{ composing: false, text: "" }` cuando termina; el texto confirmado llega a `onChange` antes del final. En iOS, Android, macOS y la web, `onChange` también informa del texto que se está componiendo, ya que esos sistemas lo mantienen en el input; en Windows, Linux y GPUI informa del texto confirmado. Un input controlado mantiene la composición en curso haga lo que haga la app con el valor: un `value` establecido mientras el usuario compone se muestra cuando termina la composición, de modo que un input que pasa a mayúsculas o filtra su texto acepta el pinyin tal como se escribe.

Un cuadro de búsqueda que busca solo el texto confirmado:

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

Un input es **no controlado** si no tiene valor: conserva su propio texto, empezando por su valor por defecto (`.default_value(..)`, en TSX `defaultValue`), y lo lees desde el evento de cambio o de envío cuando lo necesitas. Úsalo para campos que solo lees al enviar, como una contraseña.

> [!NOTE]
> Un input controlado nunca pierde pulsaciones de teclas. Cada edición nativa lleva un contador de ediciones, y un `value` que vuelve desde JS solo se aplica si responde a la última edición. Si JS es lento y el usuario ha escrito más entretanto, el valor obsoleto se descarta en lugar de sobrescribir el texto más reciente.

## Props

En Rust, cada prop es un método de `input()` con nombre en snake case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), con estos nombres propios: `.keyboard_type(KeyboardType::Email)` y las demás variantes de `KeyboardType`, `.auto_fill(AutoFill::Email)` para `autoComplete`, `.keyboard_appearance(..)` y `.input_accessory(..)` para las props de `ios={{ … }}`. Cada evento es un método `on_`: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `value` | `string` | | El texto, controlado por JS. |
| `defaultValue` | `string` | | El texto inicial de un input no controlado. |
| `placeholder` | `string` | | Se muestra mientras el input está vacío. |
| `masked` | `boolean` | `false` | Oculta el texto (contraseñas). |
| `keyboardType` | `KeyboardType` | `"default"` | La disposición del teclado. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | La etiqueta de la tecla return. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Mayúsculas automáticas. |
| `autoCorrect` | `boolean` | `true` | Las correcciones del sistema. |
| `autoComplete` | `AutoComplete` | | Lo que contiene el input, para el autocompletado. |
| `multiline` | `boolean` | `false` | Varias líneas; return inserta un salto de línea salvo que `submitBehavior` indique lo contrario. |
| `maxLength` | `number` | | El máximo de caracteres que puede introducir el usuario. |
| `readonly` | `boolean` | `false` | El usuario puede seleccionar y copiar el texto, pero no modificarlo. |
| `autoFocus` | `boolean` | `false` | Recibe el foco al aparecer. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | una línea `"blurAndSubmit"`, varias líneas `"newline"` | Qué hace return: enviar y conservar el foco, enviar y quitar el foco, o insertar un salto de línea (solo multilínea). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | Qué hace un pegado: insertar su texto o nada ([pegado](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | Se dibuja el cursor de texto; `false` lo oculta. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | El aspecto del teclado (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | La selección controlada, en unidades UTF-16. |
| `allowFontScaling` | `boolean` | `true` | Sigue el tamaño de texto del sistema. |
| `maxFontSizeMultiplier` | `number` | | El límite superior de la escala del sistema (0: ninguno). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: la barra que se muestra sobre el teclado (véase más abajo). |
| `ios={{ textContentType }}` | `TextContentType` | | Los nombres de iOS para los valores de `autoComplete`. |

Eventos:

| Evento | Carga útil | Cuándo |
|---|---|---|
| `onChange` | `{ value }` | El texto cambió: `value` es el texto actual. |
| `onSubmit` | `{ text }` | Se pulsó la tecla return en un input que envía (una línea, o `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | El input ganó / perdió el foco. |
| `onSelectionChange` | `{ start, end }` | El cursor o la selección se movió (unidades UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | El usuario pegó: texto, su HTML (Linux, web), imágenes como `File`s, URLs de archivos locales ([pegado](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | El cursor se movió: dónde está en el input y en la ventana ([el cursor](#the-caret)). |
| `onKeyPress` | `{ key }` | Antes de que cambie el texto: `key` es el texto escrito, `"Backspace"` o `"Enter"`. |
| `onContentSizeChange` | `{ size }` | El tamaño del texto (`size`) cambió (al ancho del input cuando es multilínea), a medida que se escribe; un input vacío informa de una línea vacía, sea cual sea su placeholder. |
| `onCompositionChange` | `{ composing, text }` | La composición de un método de entrada empezó, cambió o terminó (véase [Métodos de entrada](#input-methods)). |

Un input se estiliza como el texto: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` y el resto de los [estilos de texto](./text.md), además de bordes, relleno y fondos. El estilo de foco (`.focus(|s| ..)` en Rust, la variante de Tailwind `focus:` o `focusStyle` en TSX) se aplica mientras el input tiene el foco. El color del placeholder es `.placeholder_color(..)` (la
clave de estilo `placeholderColor`, `placeholder:text-*`), el del cursor es `.caret_color(..)` (`caretColor`, `caret-*`) y el del resaltado de la selección es `.selection_color(..)`
(`selectionColor`, `selection:text-*`); UIKit tiñe el cursor y la selección con un solo color, el del cursor si está definido:

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## Teclados y autocompletado

El tipo de teclado (`.keyboard_type(..)`, en TSX `keyboardType`) elige la disposición:

| Rust | TSX | Teclado |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Texto. |
| `KeyboardType::Email` | `"email-address"` | Texto con `@` y `.` a mano. |
| `KeyboardType::Url` | `"url"` | Texto con `/` y `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Solo dígitos: sin signo ni separador decimal (códigos, PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Dígitos y un separador decimal. |
| `KeyboardType::Numeric` | `"numeric"` | Como en React Native: el teclado decimal de iOS; en Android, dígitos con signo y separador decimal. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Dígitos, un signo menos y signos de puntuación (el teclado de números y puntuación de iOS; en Android, dígitos con signo y separador decimal). Úsalo para números negativos en iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | Un teclado de marcación telefónica. |

En iOS, `.keyboard_appearance(KeyboardAppearance::Dark)` (en TSX `ios={{ keyboardAppearance: "dark" }}`; o light, el valor por defecto) da al teclado un aspecto claro u oscuro con independencia de la apariencia del sistema, para una app oscura con el sistema en modo claro. Los teclados de Android siempre siguen el tema del sistema.

El autocompletado (`.auto_fill(AutoFill::Email)`, en TSX `autoComplete`) indica al sistema qué contiene el campo, de modo que pueda ofrecer nombres, direcciones, contraseñas y códigos de un solo uso guardados o recibidos en mensajes. El `AutoFill` de Rust tiene una variante por tipo (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ... y `Off`). TSX acepta estos valores: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` y otros, o `"off"`; también se aceptan los nombres propios de iOS (`"emailAddress"`, `"oneTimeCode"`, ...), en `autoComplete` o `ios={{ textContentType }}`.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## La tecla return y el desplazamiento entre campos

El tipo de tecla return (`.return_key_type(ReturnKeyType::Next)`, en TSX `returnKeyType`) etiqueta la tecla return: default, done, go, next, search o send. El comportamiento de envío (`.submit_behavior(..)`, en TSX `submitBehavior`) indica qué hace al pulsarla:

| Rust | TSX | Return | Valor por defecto de |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | dispara el evento de envío y después el input pierde el foco | inputs de una línea |
| `SubmitBehavior::Submit` | `"submit"` | dispara el evento de envío; el input conserva el foco | |
| `SubmitBehavior::Newline` | `"newline"` | inserta un salto de línea (solo inputs multilínea) | inputs multilínea |

Un input multilínea con `"submit"` o `"blurAndSubmit"` envía al pulsar return, como hacen los editores de mensajes de chat, y sigue ajustando sus líneas; en un teclado físico (equipos de escritorio, un Mac, el teclado de una tableta), Shift+Return u Option / Alt+Return inserta un salto de línea. Un return que confirma la composición de un método de entrada (por ejemplo, entrada en chino o japonés) solo la confirma y nunca envía.

Para pasar al campo siguiente, conserva refs a los inputs (`element_ref()` y `.element_ref(&r)` en Rust, `ref` en TSX) y llama a `focus()`:

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

Enviar sin perder el foco (`SubmitBehavior::Submit`, `submitBehavior="submit"`) en el primer campo mantiene el teclado visible mientras el foco se desplaza, de modo que no se oculta y vuelve a aparecer. Un input de chat que envía al pulsar return y conserva el foco envía de la misma manera (véase el editor de mensajes [más abajo](#content-outside-scroll-views)).

Tanto la longitud máxima como el comportamiento de envío se aplican de forma nativa: la plataforma pregunta «¿se puede añadir este carácter?» y «¿debe return terminar la edición?» mientras el usuario escribe, y NSH responde a partir de las props sin esperar a JS.

<a id="focus-from-code"></a>

## Foco desde el código

La ref de un input tiene:

| Rust | TSX | Descripción |
|---|---|---|
| `focus()` | `focus()` | Da el foco al input y muestra el teclado. |
| `blur()` | `blur()` | Le quita el foco. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Selecciona `start..end` (unidades UTF-16); un cursor cuando son iguales (en TSX: sin `end`). |

En macOS y la web, `focus()` y `blur()` en la ref de una vista que admite pulsaciones mueven el foco del teclado como lo hace Tab ([foco del teclado](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` en Rust y `Keyboard.dismiss()` de `nsh` en TSX quitan el foco al input que lo tenga:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Selección

El evento de selección (`.on_selection_change(..)`, en TSX `onSelectionChange`) informa del cursor y de la selección; el `set_selection` de la ref o el rango seleccionado (`.selected_range(..)`, en TSX `selectedRange`) los establecen. Las posiciones son unidades de código UTF-16, igual que los índices de las cadenas de JavaScript, así que en TSX `text.slice(start, end)` es el texto seleccionado; en Rust, divide el texto en sus unidades UTF-16.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## El cursor

El evento del cursor (`.on_caret_move(..)`, en TSX `onCaretMove`) indica dónde está el cursor, de modo que pueda abrirse en ese punto lo que corresponda: sugerencias para una mención con `@`, el menú de un comando con barra, un selector de emojis. `bounds` es un `Bounds`
en el input (`origin` y `size`, con el relleno y el desplazamiento del input aplicados), tan ancho como lo dibuja la plataforma
para el cursor y tan alto como su línea; `pageBounds` es la misma caja en la ventana (o en el diálogo en el que está el input), que una
superposición toma como su `anchor`. El evento llega mientras el input tiene el foco, siempre que el cursor se mueve: con la
selección, y cuando el texto del input se desplaza o se ajusta a otras líneas. En Rust, una superposición se coloca respecto a una caja
con `.anchor_bounds(..)`.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` es donde estaba el cursor cuando llegó el evento: una página que se desplaza bajo el input mueve el input pero
no envía ningún evento, así que cierra las sugerencias cuando se desplace, o ánclalas al propio input.

<a id="pasting-images-and-files"></a>

## Pegar imágenes y archivos

El evento de pegado (`.on_paste(..)`, en TSX `onPaste`) indica qué pegó el usuario, ya sea con el atajo de teclado, con la opción Pegar de un menú o con una imagen del teclado: `text`, `html`, `files` y `uris`. `html` es el mismo contenido con su formato, tal como lo copió un
navegador, una suite ofimática o un editor de texto enriquecido (en Linux y la web). `files` es lo que el portapapeles contenía como datos, como una
captura de pantalla o una imagen copiada de una página o de otra app: `File`s cuyos bytes la app puede subir o mostrar, con el nombre
`image.png` (o el del tipo que sea). `uris` son las URL `file:` de archivos copiados en un gestor de archivos, como las de una operación de soltar archivos.
La plataforma lee el portapapeles cuando el usuario pega, y solo entonces.

El input inserta por sí mismo el texto pegado, como siempre: el evento llega antes del `onChange` de ese texto.
Las imágenes y los archivos nunca se insertan, ya que un input contiene texto. Con `pasteBehavior` `"report"` el input no inserta
nada, y la app decide qué hace un pegado: enviar un texto largo como adjunto o insertar una versión depurada.
El input lo decide al instante, a partir de la prop, porque el sistema se lo pregunta en el acto.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

Sube un archivo pegado como cualquier `File`, con `fetch` y `FormData` (`form.append("image", file)`); sus bytes permanecen
en el lado nativo hasta que se envían. En Android, los teclados que insertan imágenes (GIF, stickers) las notifican de la misma manera. En
Linux el portapapeles se lee de forma asíncrona, así que el evento puede llegar después del `onChange` del texto que inserta.
Los inputs enmascarados en macOS conservan el pegado propio de AppKit y no notifican nada.

<a id="multiline-inputs-that-grow"></a>

## Inputs multilínea que crecen

Un input multilínea (`.multiline(true)`, en TSX `multiline`) desplaza su texto dentro de su propia altura. Para que crezca con su contenido, devuelve la altura del evento de tamaño del contenido (`.on_content_size_change(..)`, en TSX `onContentSizeChange`) a su estilo, con un límite:

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

La altura informada es la del texto (al ancho del input), así que añade tú mismo el relleno vertical, como arriba.
<a id="keeping-inputs-above-the-keyboard"></a>

## Mantener los inputs por encima del teclado

<a id="inside-scroll-views-automatic"></a>

### Dentro de scroll views: automático

Cuando el teclado aparece sobre un input con foco que está dentro de un scroll view o de una lista, NSH le da al scroll view un inset inferior tan alto como el teclado y desplaza el input hasta dejarlo visible. Esto es nativo y no requiere código. Un formulario largo es simplemente un scroll view de inputs:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

El modo de descarte (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive) permite que arrastrar el formulario oculte el teclado; los toques gestionados (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) permiten que un toque en un botón se procese mientras el teclado está visible, en lugar de limitarse a descartarlo. Consulta [Scrolling](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Contenido fuera de scroll views

En iOS, cuando el teclado cubriría un input con foco que no está en ningún scroll view, NSH mueve el contenido de su pantalla (o diálogo) hacia arriba hasta que el input queda justo encima del teclado, siguiendo la curva del teclado, y lo vuelve a bajar cuando el teclado se oculta o el input pierde el foco, como hace SwiftUI (en Android, el sistema desplaza una ventana en modo `adjustPan`). Solo lo hace para lo que el propio layout de la app deja cubierto: una app que ya hace espacio por sí misma, como se muestra a continuación, no se vuelve a mover.

Eso mueve la página entera. Una barra de mensajes fijada al fondo de una pantalla debería viajar sobre el teclado mientras el contenido de encima se reduce: añade al padding inferior de la pantalla el valor de `env(keyboard-inset-height)` de CSS (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`): crea un espacio inferior tan alto como el teclado, animado de forma nativa junto con el teclado.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

El padding (`.pb_keyboard()`) reduce el contenido de encima mientras el fondo llega hasta el borde inferior de la pantalla; un margen inferior (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) hace que toda la vista termine en la parte superior del teclado. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) suma una longitud, como menos la altura de una barra de pestañas situada debajo de la vista.

La altura completa es adecuada para una vista que llega hasta el borde inferior de la superficie, como el contenido de una pantalla. En un host Android cuya ventana se redimensiona por el teclado, la ventana misma se reduce y la variable vale 0. Consulta [Keyboard](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### El accesor del teclado

`keyboard_height()` y `keyboard_duration()` en Rust, y `keyboardFrame()` de `nsh` en TSX (un `{ height, duration }`), son reactivos: indican cuánto penetra el teclado en la superficie (0 cuando está oculto; incluye el área segura inferior que queda bajo él) y la duración de su animación en milisegundos. Léelos para cualquier caso personalizado: ocultar un botón flotante mientras se escribe o dimensionar un panel. Lo que cambia con ellos en la actualización en la que empieza el movimiento del teclado se mueve con el teclado, siguiendo su curva y con el tiempo medido desde que empezó a moverse (`LayoutCurve::Keyboard`), igual que hace `env(keyboard-inset-height)`; una animación que la app configure para esa actualización (`LayoutAnimation.configureNext`) tiene prioridad.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## Una barra sobre el teclado (iOS): InputAccessoryView

`input_accessory_view(id)` en Rust y `InputAccessoryView` de `nsh/mobile` en TSX muestran una barra adjunta a la parte superior del teclado mientras tiene foco un input que la nombra: el `inputAccessoryView` de iOS. Se mueve con el teclado de forma nativa, incluso durante el descarte interactivo. No ocupa espacio donde se coloca en el árbol; los inputs se refieren a ella por su id (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` y `nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
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
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

La barra tiene el ancho de la ventana y la altura de su contenido. Los input accessories son propios de iOS: en Android la barra es una vista vacía y oculta, así que allí hay que colocar esos controles en otro lugar, por ejemplo encima del input (`os() == Os::Android` en Rust, `platform.os === "android"` en TSX).

<a id="related"></a>

## Relacionado

- [`Input`](../elements/input.md): la referencia del elemento.
- [Keyboard](../elements/keyboard.md) y [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): descarte del teclado y toques en scroll views.
