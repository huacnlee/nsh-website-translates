---
title: "Select"
description: "O componente Select: um valor escolhido a partir de uma lista de itens, com um popup junto ao seu gatilho em desktops e uma sheet em celulares, com suporte a teclado, typeahead, busca e seções, estilizado pelo app."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---


# Select

Um select escolhe um valor de uma lista de itens: uma configuração, um filtro, um país, um fuso horário. O gatilho do app abre a lista, apresentada da forma que cada dispositivo espera:

- Nos desktops e nos navegadores desktop, um popup sobre o gatilho, com a linha selecionada sobreposta ao gatilho, de modo que o título escolhido permaneça onde estava (a posição `item-aligned` do shadcn/ui), tão largo quanto o gatilho (a largura definida por `popupStyle` / `popupClass` no app estabelece outra, como em `gpui-component`, com `menu_width`) e tão alto quanto suas linhas, até o espaço disponível na tela; sem nenhum item selecionado, ele abre abaixo do gatilho. O teclado percorre os itens e escolhe um.
- Em celulares e tablets, uma sheet na parte inferior da tela, sobre um backdrop.

O select é dono do comportamento: o valor (o do app ou o próprio), o estado aberto, o teclado, o typeahead, a busca, as seções, a linha destacada e o que os leitores de tela anunciam. A aparência é do app: ele estiliza o gatilho, o popup, a lista, as linhas, os cabeçalhos das seções e o campo de busca, ou desenha as linhas por conta própria.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `select()` cria um com um setter por prop (`.items(..)`, `.value(..)`, `.item_style(..)`) e um listener por evento (`.on_change(..)`);
`SelectItem::new(value, title)` cria um item, com `.disabled(..)` e `.group(..)`.

<a id="items"></a>

## Itens

`items` é a lista como dado: cada item tem um `value` (único entre os itens: o que escolhê-lo define), um `title` (o que
sua linha mostra, o que a busca e o typeahead comparam e o que os leitores de tela anunciam) e, opcionalmente, `disabled` e um `group`.
Itens adjacentes com o mesmo `group` formam uma seção sob um cabeçalho com esse título:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

As linhas são uma lista virtualizada na scroll view do popup: uma lista com milhares de itens cria apenas as linhas visíveis,
e o popup rola quando suas linhas são mais altas que o espaço disponível.

<a id="value"></a>

## Valor

Com `value`, o app é dono do item escolhido: o select mostra o item desse valor e informa uma escolha com
`onChange({ value })`; o app define `value` para acompanhá-la, ou mantém o seu próprio. `value={null}` significa nada escolhido. Se omitido, o
select mantém seu próprio valor, a partir de `defaultValue` no início. `onChange` informa as mudanças: escolher novamente o item já escolhido
fecha a lista.

`cleanable` adiciona um botão de limpar enquanto um item está escolhido: um toque limpa o valor, informado como `onChange({ value: null })`, e
a lista permanece fechada. O botão vem depois do gatilho na view do select, não dentro dele, de modo que um toque nele nunca
abre a lista; o app o posiciona (sobre o fim do gatilho com `absolute`, onde ficaria um chevron) e o preenche:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

O gatilho é um elemento do app, então ele mostra o que o app quiser para o item escolhido: seu título, um ícone, um
placeholder enquanto nada está escolhido. Em TSX, ele é o elemento que você passa: ele é o combobox e recebe os toques, o
foco do teclado, o estado expandido e `disabled` por conta própria, então suas próprias classes `active:`, `focus:` e `disabled:`
acompanham o select, seu próprio `onPress` também é executado, e a lista é posicionada em relação a ele e tem a mesma largura.

<a id="open-state"></a>

## Estado aberto

Sem `open`, o select mantém seu próprio estado aberto (a partir de `defaultOpen`). Com `open`, o app é dono dele e o altera
em `onOpenChange({ open, reason })`: `"triggerPress"` (um toque no gatilho, ou uma de suas teclas), `"select"` (uma escolha),
`"pressOutside"`, `"backdropPress"` ou `"cancel"` (Escape ou voltar). `onOpen` e `onClose` indicam quando a lista
é exibida e quando some (uma sheet, depois de entrar e depois de sair), `onCancel` indica que o usuário a fechou sem escolher.

<a id="search"></a>

## Busca

`searchable` coloca um campo de busca acima dos itens: digitar filtra-os pelo título, ignorando maiúsculas e minúsculas, e uma seção sem
correspondência some junto com seu cabeçalho. O destaque vai para a primeira correspondência, as teclas continuam a movê-lo enquanto o campo tem o
teclado, e Return a escolhe. `empty` é o que a lista mostra enquanto nada corresponde:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

Nos desktops, o campo de busca recebe o teclado assim que a lista abre; em telas sensíveis ao toque, o teclado aparece quando o
campo é tocado. Cada abertura começa com a busca vazia.

<a id="rows-the-app-draws"></a>

## Linhas desenhadas pelo app

`itemClass` estiliza a linha de cada item, que mostra o título do item até que `renderItem` a desenhe: `focus:` se aplica à linha destacada (onde estão as
teclas ou o ponteiro), `selected:` à escolhida e `disabled:` à desabilitada. Para desenhar uma linha, forneça
`renderItem`: ele recebe o que o item é ([`SelectEntry`](#types)) e retorna o conteúdo da linha, para as linhas visíveis.
Ele nunca recebe o estado da linha: com `group` em `itemClass`, o conteúdo acompanha os estados da linha por meio das classes `group-focus:`,
`group-selected:` e `group-disabled:`, de modo que o desenho é feito uma vez por item e mover o destaque ou
escolher não redesenha nada. `renderGroup` desenha o cabeçalho de uma seção da mesma forma:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | Os itens, em ordem. |
| `value` | `.value(..)` | `string \| null` | nenhum | O `value` do item escolhido, controlado pelo app; `null` para nenhum. Se omitido, o select mantém o seu próprio. |
| `defaultValue` | `.default_value(..)` | `string` | nenhum | O valor inicial, sem `value`. |
| `open` | `.open(..)` | `boolean` | nenhum | Aberto, controlado pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aberto no início, sem `open`. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | Um campo de busca acima dos itens os filtra pelo título. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | nenhum | O placeholder do campo de busca. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o campo de busca: o que ele pesquisa. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Um botão de limpar enquanto um item está escolhido; um toque limpa o valor (`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece fechado: o gatilho não recebe toques nem foco do teclado, e os estilos `disabled:` se aplicam a ele. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela o chamam: sobre o que é a escolha. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktops: o lado do gatilho em que a lista fica, ou o outro lado quando só ele tem espaço. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktops: como ela se alinha com o gatilho. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: o espaço entre o gatilho e a lista. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: a distância que ela mantém das bordas da área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O popup (desktops) ou a sheet (telas sensíveis ao toque) em que a lista fica. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Telas sensíveis ao toque: o backdrop atrás da sheet. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A lista, a scroll view das linhas. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | A linha de cada item, com seus estilos de texto herdados pelo título: `focus:` enquanto destacada, `selected:` enquanto escolhida, `disabled:` enquanto não pode ser escolhida. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O cabeçalho de cada seção. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | nenhum | O campo de busca: sua caixa e seu texto (`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O botão de limpar (`cleanable`); `disabled:` com o select. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nenhum | O conteúdo do botão de limpar: um X, um ícone. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o botão de limpar. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O que abre a lista quando tocado; a lista é posicionada em relação a ele. |
| `empty` | `.empty(..)` | `JSX.Element` | nenhum | O que a lista mostra enquanto nenhum item aparece (uma busca sem correspondência). |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | nenhum | A linha de um item, desenhada pelo app a partir do que o item é (seus estados são as classes da linha); caso contrário, o título do item. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | nenhum | O cabeçalho de uma seção, desenhado pelo app; caso contrário, seu título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A view ao redor do gatilho. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | O usuário escolheu outro item (um toque, Return ou Space, typeahead no gatilho): seu `value`; `null` quando o botão de limpar o limpou. Defina `value` para acompanhá-lo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | A lista abriu ou fechou, com o motivo. Defina `open` para acompanhá-lo. |
| `onOpen` | `.on_open(\|\| ..)` | A lista é exibida; como sheet, depois de entrar. |
| `onClose` | `.on_close(\|\| ..)` | A lista sumiu; como sheet, depois de sair. Também quando o app a fechou. |
| `onCancel` | `.on_cancel(\|\| ..)` | O usuário fechou a lista sem escolher (Escape ou voltar, um toque fora ou no backdrop). |

Eles ocorrem nesta ordem: `onChange` para uma escolha, ou `onCancel` para um fechamento sem escolha, depois `onOpenChange` e, em seguida,
`onOpen` ou `onClose` quando a lista é exibida ou some.

<a id="types"></a>

<a id="types"></a>

## Tipos

| Tipo | Membros | Descrição |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | Um item de `items`. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?` (do item), `index: number` | O que `renderItem` recebe: o item e seu índice entre os `items`, nunca seu estado (`focus:`, `selected:` e `disabled:` da linha). |
| `SelectGroup` | `title: string` | O que `renderGroup` recebe: o `group` da seção. |

Em Rust, eles são `nsh_base::SelectItem`, `SelectEntry` e `SelectGroup`; `value` é um `SelectValue`
(`Controlled(Some(..))` para um valor, `Controlled(None)` para `null`), que `.value(..)` cria a partir de um
`Option<SharedString>` ou de uma string.

<a id="parts"></a>

## Partes

| Parte | Onde | Estilizada com |
|---|---|---|
| O gatilho | a view do select | o próprio elemento do app (`trigger`) |
| O botão de limpar | a view do select, depois do gatilho (`cleanable`, enquanto um item está escolhido) | `clearButtonClass`, `clearButtonStyle`; seu conteúdo `clearButton` |
| O popup ou a sheet | sobre tudo, no gatilho (desktops) ou na parte inferior (telas sensíveis ao toque) | `popupClass`, `popupStyle` |
| O backdrop | atrás da sheet (telas sensíveis ao toque) | `backdropClass`, `backdropStyle` |
| O campo de busca | o popup, em primeiro lugar (`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| A lista | o popup, depois do campo de busca | `listClass`, `listStyle` |
| O cabeçalho de uma seção | a lista, antes de seus itens | `groupClass`, `groupStyle`, `renderGroup` |
| A linha de um item | a lista | `itemClass`, `itemStyle`, `renderItem` (`group-focus:`, `group-selected:`, `group-disabled:` dentro, sob `group` em `itemClass`) |
| O estado vazio | o popup, enquanto nenhum item aparece | seu próprio elemento (`empty`) |

O popup é uma coluna: sua altura acompanha o campo de busca e as linhas, de modo que um `max-h-*` em `popupClass` a limita e
a lista rola dentro dela.

<a id="keyboard"></a>

## Teclado

Nos desktops, Tab chega ao gatilho de um select que não está `disabled`. Com a lista fechada, Down, Up, Return
e Space a abrem no item escolhido (sem nenhum escolhido, Up abre no último item habilitado e as demais no primeiro), e
letras e dígitos escolhem o item cujo título começa com o que foi digitado, como faz um select nativo. Com a lista
aberta:

| Tecla | Ação |
|---|---|
| Down, Up | O próximo item habilitado ou o anterior, dando a volta nas extremidades. |
| Home, End | O primeiro ou o último item habilitado (as ações do próprio campo de busca enquanto ele tem o teclado). |
| Page Down, Page Up | Avança ou volta uma página de linhas. |
| Return | Escolhe o item destacado e fecha a lista. |
| Space | Escolhe o item destacado (sem campo de busca). |
| Letras, dígitos | O próximo item cujo título começa com o que foi digitado no último segundo (sem campo de busca). |
| Escape | Fecha a lista sem escolher. |

Quando a lista fecha, o foco do teclado volta ao gatilho, a menos que um toque fora o tenha levado para outro lugar. O
ponteiro destaca a linha sobre a qual passa; a linha destacada é revelada conforme as teclas se movem até ela.

<a id="on-each-device"></a>

## Em cada dispositivo

| | Desktops e navegadores desktop | Celulares e tablets |
| --- | --- | --- |
| A lista | um popup sobre o gatilho, com a linha selecionada sobre ele (abaixo dele enquanto não houver nenhuma), tão largo quanto o gatilho, a menos que `popupStyle` defina uma largura, e tão alto quanto suas linhas, até o espaço disponível na tela | uma sheet na parte inferior sobre um backdrop, tão alta quanto suas linhas, até a barra de status |
| Fechamento | uma escolha, Escape, um toque fora (que segue para o que está sob o ponteiro) | uma escolha, o backdrop, o botão voltar do Android |
| Busca | o campo recebe o teclado assim que a lista abre | o teclado aparece quando o campo é tocado |
| Uma escolha | o pressionar do botão escolhe, de modo que o campo de busca mantém o teclado | um toque |

`popupClass` estiliza o popup nos desktops e a sheet nos celulares; um estilo que difere entre eles pode comparar
`platform.idiom` (`nsh/device`) com `"desktop"`.
<a id="accessibility"></a>

## Acessibilidade

- O gatilho é um combobox para leitores de tela: seu rótulo é `accessibilityLabel`, seu valor é o título do item escolhido
  e ele informa se a lista está expandida. `disabled` o deixa esmaecido.
- O botão de limpar é um botão nomeado por `clearButtonAccessibilityLabel`; ele não é uma parada da tecla Tab.
- O campo de busca é um campo de texto nomeado por `searchAccessibilityLabel`; seu placeholder é uma dica exibida enquanto ele está
  vazio.
- A lista é um listbox e cada linha é uma option, nomeada pelo seu título; a opção escolhida fica selecionada e uma desabilitada
  fica esmaecida. Os cabeçalhos das seções são cabeçalhos.
- À medida que as teclas movem o destaque, o foco do leitor de tela se move para a linha destacada; enquanto o campo de busca está
  com o teclado, o título do item destacado é anunciado no lugar, para que a digitação continue.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, funções e anúncios em geral.
