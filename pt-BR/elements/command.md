---
title: "Command"
description: "Command: uma paleta de comandos, um campo de busca sobre os comandos do app filtrados conforme o usuário digita: uma paleta Cmd+K em um diálogo, um menu de comandos inline, uma busca à qual o app responde. Virtualizada, com prioridade para o teclado, uma list box para leitores de tela. A aparência de cada parte é definida pelo app."
group: base
demo: el-command
source_hash: b1a002e27d282723
---


# Command

Uma paleta de comandos é um campo de busca sobre uma lista de comandos: o usuário digita algumas letras, a lista é reduzida aos comandos que correspondem, as setas movem o destaque e Enter executa o comando destacado. `Command` cuida do comportamento de uma paleta: filtragem, seções, destaque, teclado e o que os leitores de tela anunciam. A filtragem é executada nativamente e as linhas são virtualizadas: apenas as linhas visíveis são criadas, então uma paleta com milhares de comandos, arquivos ou emojis filtra a cada tecla digitada. A aparência é a do app: o comando não desenha nada por conta própria, o app estiliza cada parte (`itemClass`, `groupClass`, `searchClass`, ...) e desenha o conteúdo das linhas (`renderItem`: um ícone, o rótulo, as teclas do atalho).

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. A consulta pertence ao app quando ele define `query`, que atualiza em `onQueryChange`; sem isso, o campo de busca mantém a sua própria, começando a partir de `defaultQuery`. Os itens são identificados pelo seu `id`, próprio do app, nunca pelo rótulo: `onSelect({ id })` informa qual deles o usuário escolheu. Em Rust, `command()` o cria, com um setter por prop (`.items(..)`, `.query(..)`, `.render_item(..)`), um método ouvinte por evento e os métodos de estilo tipados.

<a id="items"></a>

## Itens

`items` são os comandos, em ordem, cada um um `CommandItem`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O que o identifica em `onSelect` e `onHighlightChange`: único entre os itens. |
| `label` | `string` | O que a sua linha mostra, a menos que `renderItem` a desenhe, o que os leitores de tela dizem e o que a consulta compara. |
| `keywords` | `string[]` | Mais palavras que a consulta compara: sinônimos, um nome em inglês ao lado de um rótulo traduzido. |
| `group` | `string` | Sua seção: itens adjacentes de um mesmo grupo aparecem sob um cabeçalho com este título. |
| `shortcut` | `string` | O atalho de teclado do mesmo comando, como [`keymap`](../modules/nsh.md#keymap) o nomeia (`"mod+shift+p"`), para a sua linha exibir. O app o vincula com `keymap.bind`. |
| `disabled` | `boolean` | Não pode ser escolhido: as teclas o ignoram, toques não fazem nada, os estilos de `disabled:` se aplicam. |
| `checked` | `boolean` | É o que está em vigor (um tema, um idioma): os estilos de `checked:` se aplicam e os leitores de tela dizem que está marcado. |

A consulta corresponde a um item quando o seu rótulo ou uma de suas palavras-chave a contém, ignorando maiúsculas e minúsculas e os espaços ao redor. Os itens mantêm a ordem, e uma seção sem correspondências desaparece junto com o seu cabeçalho. `renderItem` recebe um `CommandEntry` para cada linha visível: os campos do item e `shortcutLabel`, o seu `shortcut` como as dicas o mostram aqui (`⇧⌘P` nas plataformas da Apple, `Ctrl+Shift+P` nas demais). Isso é o que o item é, e o destaque é o `focus:` da linha: o desenho é feito uma vez por item e mantém suas views enquanto o destaque se move.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | Os comandos, em ordem. |
| `query` | `.query(..)` | `string` | nenhum | A consulta (controlada), que o app define em `onQueryChange`. |
| `defaultQuery` | `.default_query(..)` | `string` | nenhum | A consulta inicial, enquanto `query` não estiver definido. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | Um campo de busca acima das linhas. Sem ele, todos os itens aparecem, e o comando é uma parada do foco do teclado, com typeahead. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | A consulta filtra os itens. Desativado, todos os itens aparecem: para uma busca que o próprio app responde (os resultados de um servidor definidos como `items`). Uma nova consulta ainda destaca o primeiro item. |
| `loading` | `.loading(..)` | `boolean` | `false` | Uma busca está em andamento: `empty` aguarda, e a lista fica ocupada para os leitores de tela. Mostre o seu indicador em `searchSuffix`. |
| `placeholder` | `.placeholder(..)` | `string` | nenhum | O placeholder do campo de busca. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | O campo de busca recebe o foco do teclado assim que é exibido: uma paleta que abre para receber digitação. |
| `separator` | `.separator(..)` | `boolean` | `true` | Uma linha separadora entre duas seções exibidas, estilizada por `separatorClass`; nunca primeira, última nem duplicada. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam a lista ("Comandos") e o campo de busca enquanto `searchAccessibilityLabel` não estiver definido. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | Como os leitores de tela chamam o campo de busca: o que ele pesquisa ("Pesquisar comandos"). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | nenhum | O que aparece acima do campo de busca (um título) e abaixo das linhas (as dicas de teclas, uma contagem). |
| `empty` | `.empty(..)` | `JSX.Element` | nenhum | O que aparece enquanto nenhum item aparece: uma consulta sem correspondências, nenhum item. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | nenhum | O que aparece antes e depois do campo de busca na sua barra: um ícone de busca, um spinner enquanto `loading`. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | nenhum | O conteúdo de uma linha, para as linhas visíveis; sem ele, uma linha mostra o rótulo do item. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | nenhum | O cabeçalho de uma seção (`{ heading }`); sem ele, um cabeçalho mostra o seu título. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio comando: seu tamanho, moldura e superfície. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A linha de `searchPrefix`, o campo de busca e `searchSuffix`. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | O campo de busca. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A scroll view das linhas. Dê a ela uma altura (`max-h-80`, ou um comando com tamanho definido): as linhas rolam dentro dela, e apenas as visíveis são criadas. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | A linha de cada item e seus estados (abaixo); seus estilos de texto chegam ao rótulo. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | O cabeçalho de cada seção. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada separador: a altura e a cor de uma linha divisória. |

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | O usuário escolheu um item: Enter, ou um toque em sua linha. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | O destaque se moveu (as teclas, o ponteiro, uma nova consulta ou novos itens, `highlight`): para pré-visualizar o que Enter executaria. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | O usuário digitou no campo de busca, ou Esc o limpou. |
| `onCancel` | `.on_cancel(..)` | nenhum | Esc com a consulta vazia: feche o que contém o comando (o `open` de um diálogo). |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com | Estados |
|---|---|---|---|
| O comando | | `class`, `style` | |
| `header` | o comando | o elemento do app | |
| A barra de busca | o comando | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, o campo de busca, `searchSuffix` | a barra de busca | os elementos do app; `searchClass`, `searchStyle` | o `focus:` do campo |
| A lista | o comando | `listClass`, `listStyle` | |
| O cabeçalho de uma seção | a lista | `groupClass`, `groupStyle`, `renderGroup` | |
| Um separador | a lista | `separatorClass`, `separatorStyle` | |
| Uma linha | a lista | `itemClass`, `itemStyle` | `focus:` (destacada), `checked:`, `disabled:`, `hover:`, `active:` |
| O conteúdo de uma linha | uma linha | `renderItem` | `group-focus:`, `group-checked:`, `group-disabled:` sob `group` em `itemClass` |
| `empty` | o comando | o elemento do app | |
| `footer` | o comando | o elemento do app | |

Mostre a linha destacada com `focus:` (veja [Guias de design](../docs/design-guides.md#interaction-states)).

## Ref

| Método | Descrição |
|---|---|
| `focus()` | Dá ao campo de busca o foco do teclado (sem um campo, ao comando). |
| `highlight(id)` | Destaca o item de `id` e rola a sua linha para a área visível; um item que não está sendo exibido ou que está desabilitado permanece como está. |
| `matchedCount()` | `Promise<number>`: quantos itens a consulta mostra, incluindo os desabilitados. |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## Uma paleta em um diálogo

Coloque o comando em um [`Dialog`](./dialog.md) e abra-o com o atalho do app. Esc limpa primeiro a consulta; com a consulta vazia, ele é `onCancel`, onde o app fecha o diálogo.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## Uma busca respondida pelo app

Com `filterable={false}`, todos os itens que o app fornece são exibidos: o app pesquisa em `onQueryChange` (um servidor, um banco de dados) e define `items` com os resultados, `loading` enquanto aguarda.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## Acessibilidade

- A lista tem o papel `"listbox"`, nomeada por `accessibilityLabel`; cada linha é um `"option"` nomeado pelo rótulo do seu item, marcado e desabilitado conforme o item; o cabeçalho de uma seção é um `"header"`, e um separador fica oculto.
- O campo de busca é um campo de texto nomeado por `searchAccessibilityLabel` (ou, na falta dele, `accessibilityLabel`); seu placeholder é uma dica exibida enquanto ele está vazio.
- O campo de busca mantém o foco do teclado enquanto as setas movem o destaque, e os leitores de tela anunciam o rótulo destacado. Sem um campo de busca, a linha destacada recebe o foco do leitor de tela.
- Enquanto `loading`, a lista fica ocupada.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="keyboard"></a>

## Teclado

| Tecla | O que faz |
|---|---|
| Digitação | Filtra os itens; a primeira correspondência habilitada é destacada. |
| Seta para baixo, Seta para cima | Destaca o próximo item ou o anterior, ignorando os desabilitados, do último para o primeiro e vice-versa. |
| Page Down, Page Up | Move o destaque pela quantidade de linhas visíveis. |
| Enter | Escolhe o item destacado (`onSelect`). |
| Esc | Limpa a consulta; com a consulta vazia, dispara `onCancel`. |
| Home, End | Sem campo de busca: o primeiro ou o último item (no campo, movem o cursor de texto). |
| Espaço, letras, dígitos | Sem campo de busca: Espaço escolhe, letras e dígitos destacam por typeahead. |

<a id="platform-notes"></a>

## Notas de plataforma

- Desktops (macOS, Windows, Linux, GPUI) e web: o ponteiro destaca a linha sobre a qual passa, e um clique escolhe no momento em que o botão é pressionado, de modo que o campo de busca mantém o foco do teclado.
- iOS, Android e Mac Catalyst: um toque escolhe uma linha, e a tecla return do teclado escolhe o item destacado e mantém o campo para a próxima consulta.
- Todas as plataformas desenham o que o app estiliza: o comando, sua barra de busca, suas linhas e o conteúdo delas.
