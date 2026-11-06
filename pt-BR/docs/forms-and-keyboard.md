---
title: "Formulários e o teclado"
description: "Entrada de texto com o elemento input - valores controlados e não controlados, tipos de teclado, a tecla return, foco, seleção, inputs multilinha com crescimento automático - e como manter o conteúdo fora da área ocupada pelo teclado virtual."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---


# Formulários e o teclado

A entrada de texto é o elemento de input, `input()` em Rust e `<Input>` em TSX: um UITextField ou UITextView no iOS, um EditText no Android. A digitação, o cursor, a seleção, a autocorreção e o preenchimento automático são da própria plataforma; seu app recebe o texto por eventos e pode controlá-lo. O NSH também mantém os inputs com foco acima do teclado virtual por conta própria e fornece a altura do teclado como um valor reativo, para os casos que ele não consegue tratar sozinho.

Um input aceita estilos como qualquer view (métodos de estilo tipados em Rust, estilos e classes Tailwind em TSX), então os campos de um formulário ficam com a aparência do seu app. Um campo com rótulo é um pequeno componente seu:

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

## Inputs controlados e não controlados

Um input é **controlado** quando você passa seu valor (`.value(..)`, TSX `value`): ele mostra o que o seu signal contém, e você atualiza o signal a partir do evento de mudança (`.on_change(..)`, TSX `onChange`).

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

Como você controla o valor, pode transformar o que o usuário digita: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` converte para maiúsculas, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` mantém apenas dígitos.

<a id="input-methods"></a>

### Métodos de entrada

Os métodos de entrada de chinês, japonês e coreano compõem o texto antes de confirmá-lo: o pinyin vira 腾 assim que um caractere é escolhido. `onCompositionChange` (Rust `.on_composition_change(..)`) informa a composição conforme ela acontece, `{ composing: true, text: "teng" }` enquanto o usuário digita e `{ composing: false, text: "" }` quando ela termina; o texto confirmado chega a `onChange` antes do fim. No iOS, Android, macOS e na web, `onChange` também informa o texto que está sendo composto, pois esses sistemas o mantêm no input; no Windows, Linux e GPUI ele informa o texto confirmado. Um input controlado mantém a composição em andamento, faça o app o que fizer com o valor: um `value` definido enquanto o usuário compõe só é mostrado quando a composição termina, de modo que um input que converte para maiúsculas ou filtra o texto aceita o pinyin como foi digitado.

Uma caixa de busca que pesquisa apenas o texto confirmado:

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

Um input é **não controlado** quando não tem valor: ele mantém o próprio texto, começando pelo valor padrão (`.default_value(..)`, TSX `defaultValue`), e você o lê a partir do evento de mudança ou de envio quando precisar. Use isso para campos que você só lê no envio, como uma senha.

> [!NOTE]
> Um input controlado nunca perde teclas digitadas. Cada edição nativa carrega uma contagem de edições, e um `value` que volta do JS só é aplicado se responder à edição mais recente. Se o JS estiver lento e o usuário tiver digitado mais nesse meio tempo, o valor desatualizado é descartado em vez de sobrescrever o texto mais novo.

## Props

Em Rust, cada prop é um método de `input()` com nome em snake case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), com estes nomes próprios: `.keyboard_type(KeyboardType::Email)` e as demais variantes de `KeyboardType`, `.auto_fill(AutoFill::Email)` para `autoComplete`, `.keyboard_appearance(..)` e `.input_accessory(..)` para as props `ios={{ … }}`. Cada evento é um método de `on_`: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `value` | `string` | | O texto, controlado pelo JS. |
| `defaultValue` | `string` | | O texto inicial de um input não controlado. |
| `placeholder` | `string` | | Exibido enquanto o input está vazio. |
| `masked` | `boolean` | `false` | Oculta o texto (senhas). |
| `keyboardType` | `KeyboardType` | `"default"` | O layout do teclado. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | O rótulo da tecla return. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Capitalização automática. |
| `autoCorrect` | `boolean` | `true` | As correções do sistema. |
| `autoComplete` | `AutoComplete` | | O que o input contém, para o preenchimento automático. |
| `multiline` | `boolean` | `false` | Várias linhas; return insere uma quebra de linha, a menos que `submitBehavior` diga o contrário. |
| `maxLength` | `number` | | O máximo de caracteres que o usuário pode digitar. |
| `readonly` | `boolean` | `false` | O usuário pode selecionar e copiar o texto, mas não alterá-lo. |
| `autoFocus` | `boolean` | `false` | Recebe o foco ao aparecer. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | linha única `"blurAndSubmit"`, multilinha `"newline"` | O que o return faz: envia e mantém o foco, envia e remove o foco, ou insere uma quebra de linha (somente multilinha). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | O que uma colagem faz: insere seu texto ou nada ([colagem](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | O cursor é desenhado; `false` o oculta. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | A aparência do teclado (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | A seleção controlada, em unidades UTF-16. |
| `allowFontScaling` | `boolean` | `true` | Segue o tamanho de texto do sistema. |
| `maxFontSizeMultiplier` | `number` | | O limite superior da escala do sistema (0: nenhum). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: a barra exibida acima do teclado (veja abaixo). |
| `ios={{ textContentType }}` | `TextContentType` | | Os nomes do iOS para os valores de `autoComplete`. |

Eventos:

| Evento | Payload | Quando |
|---|---|---|
| `onChange` | `{ value }` | O texto mudou: `value` é o texto atual. |
| `onSubmit` | `{ text }` | A tecla return foi pressionada em um input que envia (linha única, ou `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | O input ganhou / perdeu o foco. |
| `onSelectionChange` | `{ start, end }` | O cursor ou a seleção se moveu (unidades UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | O usuário colou: texto, seu HTML (Linux, web), imagens como `File`s, URLs de arquivos locais ([colagem](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | O cursor se moveu: onde ele está no input e na janela ([o cursor](#the-caret)). |
| `onKeyPress` | `{ key }` | Antes de o texto mudar: `key` é o texto digitado, `"Backspace"` ou `"Enter"`. |
| `onContentSizeChange` | `{ size }` | O tamanho do texto (`size`) mudou (na largura do input quando multilinha), conforme é digitado; um input vazio informa uma linha vazia, seja qual for o placeholder. |
| `onCompositionChange` | `{ composing, text }` | A composição de um método de entrada começou, mudou ou terminou (veja [Métodos de entrada](#input-methods)). |

Um input é estilizado como texto: `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` e o restante dos [estilos de texto](./text.md), além de bordas, padding e fundos. O estilo de foco (`.focus(|s| ..)` em Rust, a variante Tailwind `focus:` ou `focusStyle` em TSX) é aplicado enquanto o input tem foco. A cor do placeholder é `.placeholder_color(..)` (a chave de estilo `placeholderColor`, `placeholder:text-*`), a do cursor é `.caret_color(..)` (`caretColor`, `caret-*`) e a do destaque da seleção é `.selection_color(..)` (`selectionColor`, `selection:text-*`); o UIKit pinta o cursor e a seleção com uma única cor, a do cursor quando definida:

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

## Teclados e preenchimento automático

O tipo de teclado (`.keyboard_type(..)`, TSX `keyboardType`) define o layout:

| Rust | TSX | Teclado |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Texto. |
| `KeyboardType::Email` | `"email-address"` | Texto com `@` e `.` à mão. |
| `KeyboardType::Url` | `"url"` | Texto com `/` e `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Somente dígitos: sem sinal e sem separador decimal (códigos, PINs). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Dígitos e um separador decimal. |
| `KeyboardType::Numeric` | `"numeric"` | Como no React Native: o teclado decimal do iOS; no Android, dígitos com sinal e separador decimal. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Dígitos, um sinal de menos e pontuação (o teclado de números e pontuação do iOS; no Android, dígitos com sinal e separador decimal). Use-o para números negativos no iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | Um teclado de discagem telefônica. |

No iOS, `.keyboard_appearance(KeyboardAppearance::Dark)` (TSX `ios={{ keyboardAppearance: "dark" }}`; ou light, o padrão) dá ao teclado uma aparência clara ou escura, independentemente da aparência do sistema, para um app escuro no modo claro. Os teclados do Android sempre seguem o tema do sistema.

O preenchimento automático (`.auto_fill(AutoFill::Email)`, TSX `autoComplete`) informa ao sistema o que o campo contém, para que ele possa oferecer nomes, endereços, senhas e códigos de uso único de mensagens salvos. O `AutoFill` do Rust tem uma variante para cada tipo (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ... e `Off`). O TSX aceita estes valores: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` e outros, ou `"off"`; os nomes próprios do iOS (`"emailAddress"`, `"oneTimeCode"`, ...) também são aceitos, em `autoComplete` ou `ios={{ textContentType }}`.

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

## A tecla return e a navegação entre campos

O tipo da tecla return (`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`) define o rótulo da tecla return: default, done, go, next, search ou send. O comportamento de envio (`.submit_behavior(..)`, TSX `submitBehavior`) define o que acontece ao pressioná-la:

| Rust | TSX | Return | Padrão para |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | dispara o evento de envio e depois o input perde o foco | inputs de linha única |
| `SubmitBehavior::Submit` | `"submit"` | dispara o evento de envio; o input mantém o foco | |
| `SubmitBehavior::Newline` | `"newline"` | insere uma quebra de linha (somente inputs multilinha) | inputs multilinha |

Um input multilinha com `"submit"` ou `"blurAndSubmit"` envia ao pressionar return, como os campos de composição de chats, e continua quebrando as linhas; em um teclado físico (desktops, um Mac, o teclado de um tablet), Shift+Return ou Option / Alt+Return insere uma quebra de linha. Um return que confirma a composição de um método de entrada (entrada em chinês ou japonês, por exemplo) apenas a confirma e nunca envia.

Para passar ao campo seguinte, mantenha refs dos inputs (`element_ref()` e `.element_ref(&r)` em Rust, `ref` em TSX) e chame `focus()`:

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

Enviar sem remover o foco (`SubmitBehavior::Submit`, `submitBehavior="submit"`) no primeiro campo mantém o teclado aberto enquanto o foco se move, de modo que ele não desce e sobe de novo. Um input de chat que envia ao pressionar return e permanece com o foco envia da mesma forma (veja o campo de composição [abaixo](#content-outside-scroll-views)).

Tanto o comprimento máximo quanto o comportamento de envio são aplicados nativamente: a plataforma pergunta "este caractere pode ser adicionado?" e "o return deve encerrar a edição?" enquanto o usuário digita, e o NSH responde a partir das props, sem esperar pelo JS.

<a id="focus-from-code"></a>

## Foco via código

A ref de um input tem:

| Rust | TSX | Descrição |
|---|---|---|
| `focus()` | `focus()` | Dá foco ao input e mostra o teclado. |
| `blur()` | `blur()` | Remove o foco dele. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Seleciona `start..end` (unidades UTF-16); um cursor quando são iguais (TSX: sem `end`). |

No macOS e na web, `focus()` e `blur()` na ref de uma view que recebe pressionamentos movem o foco do teclado como a tecla Tab ([foco do teclado](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` em Rust e `Keyboard.dismiss()` de `nsh` em TSX removem o foco de qualquer input que o tenha:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Seleção

O evento de seleção (`.on_selection_change(..)`, TSX `onSelectionChange`) informa o cursor e a seleção; o `set_selection` da ref ou o intervalo selecionado (`.selected_range(..)`, TSX `selectedRange`) os definem. As posições são unidades de código UTF-16, como os índices de strings do JavaScript; assim, em TSX `text.slice(start, end)` é o texto selecionado; em Rust, fatie as unidades UTF-16 do texto.

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

## O cursor

O evento do cursor (`.on_caret_move(..)`, TSX `onCaretMove`) diz onde o cursor está, para que o que pertence a ele possa abrir ali: sugestões para uma menção com `@`, o menu de um comando com barra, um seletor de emojis. `bounds` é um `Bounds` no input (`origin` e `size`, com o padding e a rolagem do input aplicados), tão largo quanto a plataforma desenha o cursor e tão alto quanto sua linha; `pageBounds` é a mesma caixa na janela (ou no diálogo em que o input está), que um overlay recebe como seu `anchor`. O evento chega enquanto o input tem o foco, sempre que o cursor se move: com a seleção, e quando o texto do input rola ou quebra em outras linhas. Em Rust, um overlay é posicionado em relação a uma caixa com `.anchor_bounds(..)`.

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

`pageBounds` é onde o cursor estava quando o evento chegou: uma página que rola sob o input move o input, mas não envia nenhum evento; por isso, feche as sugestões quando ela rolar, ou ancore-as ao próprio input.

<a id="pasting-images-and-files"></a>

## Colando imagens e arquivos

O evento de colagem (`.on_paste(..)`, TSX `onPaste`) informa o que o usuário colou, seja pelo atalho do teclado, pelo Colar de um menu ou pelo teclado de imagens: `text`, `html`, `files` e `uris`. `html` é o mesmo conteúdo com sua formatação, como foi copiado por um navegador, um pacote de escritório ou um editor de rich text (no Linux e na web). `files` são o que a área de transferência continha como dados, como uma captura de tela ou uma imagem copiada de uma página ou de outro app: `File`s cujos bytes o app pode enviar ou exibir, chamados de `image.png` (ou o tipo que ele é). `uris` são as URLs `file:` de arquivos copiados em um gerenciador de arquivos, como as de um arquivo solto. A plataforma lê a área de transferência quando o usuário cola, e somente então.

O input insere o texto colado por conta própria, como sempre faz: o evento chega antes do `onChange` desse texto. Imagens e arquivos nunca são inseridos, já que um input contém texto. Com `pasteBehavior` `"report"`, o input não insere nada e o app decide o que uma colagem faz: enviar um texto longo como anexo ou inserir uma versão limpa. O input decide na hora, a partir da prop, porque o sistema pergunta a ele no ato.

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

Envie um arquivo colado como qualquer `File`, com `fetch` e `FormData` (`form.append("image", file)`); seus bytes permanecem nativos até serem enviados. No Android, os teclados que inserem imagens (GIFs, stickers) as informam da mesma forma. No Linux, a área de transferência é lida de forma assíncrona, então o evento pode chegar depois do `onChange` do texto que ele insere. Inputs mascarados no macOS mantêm a colagem própria do AppKit e não informam nada.

<a id="multiline-inputs-that-grow"></a>

## Inputs multilinha que crescem

Um input multilinha (`.multiline(true)`, TSX `multiline`) rola seu texto dentro da própria altura. Para fazê-lo crescer com o conteúdo, devolva a altura do evento de tamanho do conteúdo (`.on_content_size_change(..)`, TSX `onContentSizeChange`) ao seu estilo, com um limite:

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

A altura informada é a do texto (na largura do input), então adicione você mesmo o padding vertical, como acima.
<a id="keeping-inputs-above-the-keyboard"></a>

## Mantendo inputs acima do teclado

<a id="inside-scroll-views-automatic"></a>

### Dentro de scroll views: automático

Quando o teclado aparece sobre um input com foco que está dentro de uma scroll view ou de uma lista, o NSH aplica à scroll view um inset inferior com a altura do teclado e rola o input para a área visível. Isso é nativo e não exige código. Um formulário longo é simplesmente uma scroll view de inputs:

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

O modo de dispensa (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive) permite que arrastar o formulário esconda o teclado; os toques tratados (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) deixam um toque em um botão passar enquanto o teclado está aberto, em vez de apenas dispensá-lo. Veja [Rolagem](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Conteúdo fora de scroll views

No iOS, quando o teclado cobriria um input com foco que não está em nenhuma scroll view, o NSH move o conteúdo da tela (ou do diálogo) para cima até que o input fique logo acima do teclado, seguindo a curva do teclado, e o move de volta para baixo quando o teclado se esconde ou o input perde o foco, como o SwiftUI faz (no Android, uma janela no modo `adjustPan` é deslocada pelo sistema). Isso só acontece para o que o layout do próprio app deixa coberto: um app que abre espaço por conta própria, como abaixo, não é movido novamente.

Isso move a página inteira. Uma barra de mensagem fixada na parte inferior de uma tela deve acompanhar o teclado enquanto o conteúdo acima dela encolhe: adicione ao padding inferior da tela o `env(keyboard-inset-height)` do CSS (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`): ele abre na parte inferior um espaço com a altura do teclado, animado nativamente junto com o teclado.

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

O padding (`.pb_keyboard()`) encolhe o conteúdo acima enquanto o fundo alcança a parte inferior da tela; uma margem inferior (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) faz a view inteira terminar no topo do teclado. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) soma um comprimento, como menos a altura de uma barra de abas abaixo da view.

A altura total é adequada para uma view que alcança a parte inferior da superfície, como o conteúdo de uma tela. Em um host Android cuja janela é redimensionada pelo teclado, a própria janela encolhe e a variável vale 0. Veja [Teclado](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### O accessor do teclado

`keyboard_height()` e `keyboard_duration()` em Rust, e `keyboardFrame()` de `nsh` em TSX (um `{ height, duration }`), são reativos: indicam até onde o teclado avança sobre a superfície (0 quando escondido; a área segura inferior sob ele está incluída) e a duração de sua animação em milissegundos. Leia-os para qualquer caso personalizado: esconder um botão flutuante durante a digitação ou dimensionar um painel. O que muda com eles na atualização em que o movimento do teclado começa se move junto com o teclado, em sua curva e com o tempo contado a partir de quando ele começou a se mover (`LayoutCurve::Keyboard`), como faz `env(keyboard-inset-height)`; uma animação que o app configura para essa atualização (`LayoutAnimation.configureNext`) tem prioridade.

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

## Uma barra sobre o teclado (iOS): InputAccessoryView

`input_accessory_view(id)` em Rust e `InputAccessoryView` de `nsh/mobile` em TSX mostram uma barra presa ao topo do teclado enquanto um input que a referencia tem foco: o `inputAccessoryView` do iOS. Ela se move com o teclado de forma nativa, inclusive durante a dispensa interativa. Ela não ocupa espaço onde é colocada na árvore; os inputs se referem a ela pelo seu id (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` e `nativeID`):

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

A barra tem a largura da janela e a altura do seu conteúdo. Os input accessories são do iOS: no Android a barra é uma view vazia e oculta, então coloque esses controles em outro lugar por lá, por exemplo acima do input (`os() == Os::Android` em Rust, `platform.os === "android"` em TSX).

<a id="related"></a>

## Relacionados

- [`Input`](../elements/input.md): a referência do elemento.
- [Teclado](../elements/keyboard.md) e [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Rolagem](./scrolling.md#scroll-views-and-the-keyboard): dispensa do teclado e toques em scroll views.
