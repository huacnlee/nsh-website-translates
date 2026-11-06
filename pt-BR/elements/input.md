---
title: "Input"
description: "O campo de texto nativo: texto controlado e não controlado, teclados, preenchimento automático, seleção, entradas multilinha e foco."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` é um campo de texto nativo: um UITextField (linha única) ou UITextView (múltiplas linhas) no iOS e no Mac Catalyst, e um EditText no Android. Digitação, cursor, seleção, autocorreção e preenchimento automático são os da própria plataforma. Em Rust, cria-se um com `nsh_base::input()`, e em TSX com `<Input>` de `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Controlado e não controlado

- **Controlado**: passe `value` e atualize-o em `onChange`. O app pode reescrever o que o usuário digitou (remover espaços, formatar): o texto mostra a edição imediatamente e é corrigido quando o novo `value` chega. Cada edição nativa carrega um contador, e um `value` vindo do app é aplicado quando se baseia na edição mais recente, de modo que a digitação mais nova sempre vence uma atualização lenta.
- **Não controlado**: passe `defaultValue` (`.default_value(..)`, ou nada) e leia o texto de `onChange` ou `onSubmit`.

Regras que devem valer enquanto o usuário digita são props, tratadas nativamente: `maxLength` limita o comprimento e `submitBehavior` decide o que o return faz. Veja [formulários e o teclado](../docs/forms-and-keyboard.md).

## Props

Além das [props comuns](./index.md#common-props) (com `style` tipado como `TextStyle`: fonte, cor, alinhamento e os estilos de view se aplicam):

<a id="text"></a>

### Texto

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | O texto, controlado pelo app. |
| `defaultValue` | `.default_value(..)` | `string` | | O texto inicial. |
| `placeholder` | `.placeholder(..)` | `string` | | Exibido enquanto o input está vazio. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Várias linhas; o return insere uma quebra de linha, a menos que `submitBehavior` diga o contrário. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | A barra de rolagem de um input multilinha: o indicador da plataforma, ou a barra integrada do app quando ele definiu uma ([Scrollbar](./scrollbar.md#built-in-bars)); um objeto é um tema próprio, `false` nenhuma. |
| `maxLength` | `.max_length(..)` | `number` | | O máximo de caracteres que o usuário pode digitar. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | O usuário pode selecionar e copiar o texto, mas não alterá-lo. |
| `masked` | `.masked(..)` | `boolean` | `false` | O texto fica oculto (senhas). |
| `allowFontScaling` | | `boolean` | `true` | Segue o tamanho de texto do sistema. |
| `maxFontSizeMultiplier` | | `number` | `0` | O limite superior da escala do sistema (0 significa sem limite). |

<a id="keyboard"></a>

### Teclado

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | O layout do teclado ([os valores](../docs/forms-and-keyboard.md#keyboards-and-autofill); `numbers-and-punctuation` tem um sinal de menos no iOS). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | O rótulo da tecla return. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Capitalização automática. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | As correções do sistema. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | O que o input contém, para preenchimento automático no iOS, no Android e na web: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | O que uma colagem faz: `"insert"` insere o texto colado, `"report"` não insere nada, para que o app trate o que `onPaste` informa. Imagens e arquivos nunca são inseridos. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (linha única), `"newline"` (multilinha) | O que o return faz: `"submit"` reporta `onSubmit` e mantém o foco, `"blurAndSubmit"` também remove o foco, `"newline"` insere uma quebra de linha (multilinha; uma linha única envia). Um input multilinha que envia ainda aceita quebras de linha com Shift+Return ou Option / Alt+Return em teclados físicos. `"submit"` mantém o teclado aberto (por exemplo, para enviar várias mensagens). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Recebe o foco quando aparece. |

<a id="caret-and-selection"></a>

### Cursor e seleção

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | O cursor é desenhado (padrão `true`; `false` o oculta). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | A seleção controlada, em unidades UTF-16; `end` tem `start` como padrão (um cursor). |

O cursor pisca enquanto sua janela está visível e ativa. Em janelas GPUI no Linux, ele permanece visível após dez segundos sem digitar ou movê-lo, como em apps GTK, de modo que um campo focado e deixado sozinho não consome quadros.

<a id="colors"></a>

### Cores

As cores do placeholder, do cursor e do destaque da seleção são chaves de estilo, com suas classes Tailwind, e métodos em Rust (o UIKit tinge o cursor e a seleção com uma única cor, a do cursor quando definida):

| Chave de estilo | Rust | Classe | Descrição |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | A cor do placeholder. |
| `caretColor` | `.caret_color(..)` | `caret-*` | A cor do cursor. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | A cor do destaque da seleção. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| Chave `ios` | Rust | Tipo | Descrição |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | Os nomes do iOS para `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | O `nativeID` de um `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) exibido sobre o teclado enquanto o input tem foco. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | A aparência do teclado; `"default"` segue a aparência do sistema. Os teclados do Android seguem o tema do sistema. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | O usuário alterou o texto: `value` é o texto atual. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | A tecla return foi pressionada em um input que envia (linha única, ou `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | nenhum | O input ganhou / perdeu o foco. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | O cursor ou a seleção se moveu (unidades UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | O usuário colou: o texto, sua formatação como HTML (Linux, web), imagens (uma captura de tela) como `File`s, URLs `file:` de arquivos locais. Ocorre antes do `onChange` do texto que ela insere ([formulários e teclado](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | O cursor se moveu, junto com a seleção ou conforme o texto rolou ou quebrou: `bounds` é onde ele está no input, `pageBounds` na janela, o `anchor` de um `Overlay` ([formulários e teclado](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Antes de o texto mudar: `key` é o texto digitado, `"Backspace"` ou `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | O tamanho do texto mudou (na largura do input quando multilinha), conforme é digitado; um input vazio reporta uma linha vazia, seja qual for o seu placeholder. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | A composição de um método de entrada começou, mudou ou terminou: `text` é o que está sendo composto (pinyin antes de um caractere ser escolhido, kana antes da conversão), `""` quando ela termina. O texto confirmado chega a `onChange` antes do fim. |

Um input multilinha que cresce com o seu texto:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Métodos de ref

| Método | Rust | Descrição |
|---|---|---|
| `focus()` | `focus()` | Foca o input e mostra o teclado. |
| `blur()` | `blur()` | Remove o foco dele. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Seleciona `start..end` (unidades UTF-16); um cursor quando são iguais. |

Mover o foco para o próximo campo ao pressionar return:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` de `nsh` (`dismiss_keyboard()` em Rust) oculta o teclado, qualquer que seja o input que o tenha.

<a id="platform-notes"></a>

## Notas de plataforma

- No macOS, o texto de linha única, os placeholders e os cursores compartilham as métricas de fonte do campo nativo e são centralizados juntos dentro da caixa de conteúdo. `lineHeight` participa do layout; editores multilinha também o usam para o espaçamento entre parágrafos.
- Inputs dentro de uma [scroll view](./scroll.md#keyboard) são mantidos fora do alcance do teclado de forma nativa. Em outros lugares, use um padding ou margin inferior de [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` desabilita o input (sem foco), além de aplicar os estilos de desabilitado; um input `readonly` mantém seu foco e sua seleção.
- `inputAccessoryViewID` se aplica no iOS, onde o teclado tem uma barra de acessórios.
