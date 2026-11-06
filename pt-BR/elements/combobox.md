---
title: "Combobox"
description: "O componente Combobox: um ou vários valores escolhidos a partir de uma lista de itens filtrada pela digitação no campo de entrada, com um popup abaixo do campo em desktops e uma sheet em celulares, estilizado pelo app."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---


# Combobox

Um combobox escolhe valores de uma lista de itens, um só ou, com `multiple`, vários: as tags de um post, os membros de um canal, os idiomas de um documento. Seu gatilho é um campo de texto: digitar abre a lista e a filtra, como faz o combobox do shadcn/ui. Ele é irmão do [Select](./select.md) e compartilha sua lista, apresentada como cada dispositivo espera:

- Em desktops e em navegadores desktop, um popup sob o campo, com a largura do campo (a largura `popupStyle` / `popupClass` do app define outra) e com a altura de suas linhas, até o limite do espaço disponível ao lado.
- Em celulares e tablets, uma sheet na parte inferior da tela, sobre um backdrop.

O combobox é dono do comportamento: o valor (do app ou próprio), o estado de abertura, o teclado, a busca, as seções, a linha destacada e o que os leitores de tela anunciam. Com `multiple`, uma escolha alterna o item no valor e a lista permanece aberta, de modo que vários itens são escolhidos de uma só vez. A aparência é do app: ele estiliza o campo, o popup, a lista, as linhas, os cabeçalhos das seções, o input e o rodapé, ou desenha as linhas por conta própria.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `combobox()` cria um com um setter por prop (`.items(..)`, `.value(..)`, `.multiple(..)`) e um listener por evento (`.on_change(..)`). Seus itens são os de `Select`: `SelectItem::new(value, title)`, com `.disabled(..)` e `.group(..)`, em seções como as de um select (veja [Itens](./select.md#items)).

<a id="value"></a>

## Valor

O valor é um array com os valores dos itens selecionados. Com `value`, o app é o dono dele: o combobox mostra esses itens como selecionados e informa cada mudança com `onChange({ value })`; o app define `value` para acompanhá-la, ou mantém o seu próprio. Se omitido, o combobox mantém seu próprio valor, a partir de `defaultValue` no início.

- Com `multiple`, um toque, Return ou Espaço alterna o item destacado: entra no valor se estava fora, sai se estava dentro. A lista permanece aberta.
- Sem ele, uma escolha substitui o valor pelo desse item e fecha a lista; escolher o item já selecionado apenas a fecha.

`onConfirm({ value })` informa o valor quando a lista fecha: uma vez por abertura, não importa como ela feche (uma escolha, Escape, um toque fora, o botão de gatilho), com o valor como o usuário o deixou. Cmd+Return no Mac (Ctrl+Return nos demais) fecha a lista e confirma.

`cleanable` adiciona um botão de limpar enquanto houver um item selecionado: um toque esvazia o valor (`onChange({ value: [] })`). O botão vem depois do input e antes do botão de gatilho; um toque nele nunca abre a lista. O app o preenche, como no [botão de limpar de um select](./select.md#value).

## Input

O gatilho é um campo de texto na linha do combobox (seus `class` e `style`: a borda e o preenchimento do campo), com o `prefix` do app antes dele (os itens escolhidos como chips, um ícone) e, depois dele, o botão de limpar, o `triggerButton` do app (um chevron) e `suffix`.

- Digitar abre a lista e filtra os itens pelo título, ignorando maiúsculas e minúsculas; `empty` aparece enquanto nada corresponder. Seta para baixo e seta para cima também a abrem, um toque no botão de gatilho a abre e a fecha, e em telas sensíveis ao toque um toque no input a abre.
- Com um único valor, o input mostra o título do item escolhido (`placeholder` enquanto não houver nenhum). Ele fica selecionado quando o input recebe o foco, então o que for digitado o substitui.
- Com `multiple`, o input mostra a consulta; o app mostra os itens escolhidos, em `prefix` ou ao lado do combobox.

A consulta é do próprio combobox, começando cada abertura em `defaultQuery` (ou vazia), ou do app com `query`: `onQueryChange({ query })` informa o que foi digitado, e o app define `query` para acompanhá-lo, para filtrar à sua maneira ou para sugerir um ponto de partida.

<a id="footer"></a>

## Rodapé

`footer` é o conteúdo abaixo das linhas, em uma parte própria (`footerClass`, `footerStyle`): uma ação ("Gerenciar tags"), uma contagem, uma dica. Ele permanece no lugar enquanto as linhas rolam.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Os itens, em ordem. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Uma escolha alterna o item no valor e a lista permanece aberta. |
| `value` | `.value(..)` | `string[]` | nenhum | Os valores dos itens selecionados, pertencentes ao app. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | O valor inicial, sem `value`. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | O estado de abertura, do app ou do próprio combobox. |
| `placeholder` | `.placeholder(..)` | `string` | nenhum | O placeholder do input, enquanto ele está vazio. |
| `query` | `.query(..)` | `string` | nenhum | A consulta, pertencente ao app. |
| `defaultQuery` | `.default_query(..)` | `string` | nenhum | A consulta com que cada abertura começa, sem `query`. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Um botão de limpar enquanto houver um item selecionado; um toque esvazia o valor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece fechado e não recebe toques nem foco do teclado. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Sobre o que é a escolha, para leitores de tela. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | como os de `Select` | `"bottom"`, `"start"`, 0, 0 | Desktops: onde o popup fica em relação ao campo. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O popup (desktops) ou a sheet (telas sensíveis ao toque). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O backdrop atrás da sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A lista, a scroll view das linhas. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | A linha de cada item: `focus:` enquanto destacada, `selected:` enquanto selecionada, `disabled:` enquanto não pode ser. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O cabeçalho de cada seção. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | nenhum | O input: `focus:` enquanto edita, `disabled:` com o combobox. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O rodapé, abaixo das linhas. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O botão de limpar (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nenhum | O conteúdo do botão de limpar. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o botão de limpar. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | nenhum | Um botão após o input (um chevron): um toque abre e fecha a lista. |
| `prefix` | `.prefix(..)` | `JSX.Element` | nenhum | Conteúdo antes do input: chips, um ícone. |
| `suffix` | `.suffix(..)` | `JSX.Element` | nenhum | Conteúdo após o botão de gatilho. |
| `empty` | `.empty(..)` | `JSX.Element` | nenhum | O que a lista mostra enquanto nenhum item é exibido. |
| `footer` | `.footer(..)` | `JSX.Element` | nenhum | O que aparece abaixo das linhas. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | nenhum | A linha de um item, desenhada pelo app a partir do que o item é, nunca do seu estado: o conteúdo acompanha `group-focus:`, `group-selected:` e `group-disabled:` da linha (`group` em `itemClass`), de modo que mover o destaque ou alternar um item não redesenha nada; caso contrário, o título do item. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | nenhum | O cabeçalho de uma seção, desenhado pelo app; caso contrário, seu título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O campo: a linha com o prefixo, o input, os botões e o sufixo; a lista tem a mesma largura dele. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | O valor mudou (uma escolha, uma alternância, o botão de limpar): `{ value }`, os valores dos itens selecionados. Defina `value` para acompanhá-lo. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | A lista fechou: `{ value }` como está nesse momento, uma vez por abertura. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | O usuário digitou no input: `{ query }`. Defina `query` para acompanhá-lo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | A lista abriu ou fechou, com o motivo (`{ open, reason }`). Defina `open` para acompanhá-lo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | A lista é exibida, ou desapareceu. |
| `onCancel` | `.on_cancel(..)` | O usuário fechou a lista sem uma escolha que a feche (Escape ou voltar, um toque fora ou no backdrop). |

Eles ocorrem nesta ordem: `onChange` para uma escolha, ou `onCancel` para um fechamento sem escolha, depois `onOpenChange`, depois `onConfirm` quando a lista fecha, e então `onOpen` ou `onClose` quando a lista é exibida ou desaparece.

<a id="parts"></a>

## Partes

| Parte | Onde | Estilizada com |
|---|---|---|
| O campo | a view do combobox, uma linha | `class`, `style` |
| O prefixo | o campo, primeiro | o elemento do próprio app (`prefix`) |
| O input | o campo, depois do prefixo | `inputClass`, `inputStyle`, `placeholder` |
| O botão de limpar | o campo, depois do input (`cleanable`, enquanto um item está selecionado) | `clearButtonClass`, `clearButtonStyle`; seu conteúdo `clearButton` |
| O botão de gatilho | o campo, depois do botão de limpar | o elemento do próprio app (`triggerButton`) |
| O sufixo | o campo, por último | o elemento do próprio app (`suffix`) |
| O popup ou a sheet | sobre todo o resto, sob o campo (desktops) ou na parte inferior (telas sensíveis ao toque) | `popupClass`, `popupStyle` |
| O backdrop | atrás da sheet (telas sensíveis ao toque) | `backdropClass`, `backdropStyle` |
| A lista | o popup | `listClass`, `listStyle` |
| O cabeçalho de uma seção | a lista, antes de seus itens | `groupClass`, `groupStyle`, `renderGroup` |
| A linha de um item | a lista | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` dentro, sob `group` em `itemClass`) |
| O estado vazio | o popup, enquanto nenhum item é exibido | seu próprio elemento (`empty`) |
| O rodapé | o popup, por último | `footerClass`, `footerStyle`; seu conteúdo `footer` |

<a id="keyboard"></a>

## Teclado

As teclas são as de um select (veja [Teclado](./select.md#keyboard)) enquanto o input mantém o foco, com estas diferenças: letras e dígitos são digitados no input, que filtra a lista, em vez de busca por digitação (typeahead); seta para baixo e seta para cima abrem a lista fechada; Return alterna o item destacado com `multiple` e mantém a lista aberta; Cmd+Return no Mac (Ctrl+Return nos demais) a fecha e confirma. Quando a lista fecha nos desktops, o input mantém o foco.

<a id="accessibility"></a>

## Acessibilidade

- O input é um combobox para leitores de tela: seu rótulo é `accessibilityLabel`, seu valor são os títulos dos itens selecionados, separados por vírgulas, e ele informa se a lista está expandida. `disabled` o esmaece.
- A lista é uma listbox e cada linha uma opção, nomeada por seu título; as opções selecionadas são marcadas como selecionadas e uma desabilitada fica esmaecida. Os cabeçalhos das seções são cabeçalhos.
- O botão de limpar é um botão nomeado por `clearButtonAccessibilityLabel`; ele não é uma parada do Tab. O botão de gatilho fica oculto para leitores de tela, já que o input informa se a lista está aberta, e também não é uma parada do Tab.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.
