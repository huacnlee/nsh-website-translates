---
title: "Menu"
description: "Menu e ContextMenu com MenuItem, MenuSeparator e Submenu: um popup com submenus em cascata em desktops, uma sheet com submenus no próprio local em celulares, estilizado pelo app."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---


# Menu

A menu é uma lista de ações que o seu gatilho abre. Uma única estrutura serve a todos os dispositivos, apresentada como cada um espera:

- Em desktops e em navegadores desktop, um popup junto ao gatilho; um `Submenu` se abre em cascata ao lado do seu item quando o ponteiro passa sobre ele ou o pressiona.
- Em celulares e tablets, uma sheet na parte inferior da tela, sobre um backdrop; um `Submenu` mostra seus itens na sheet no lugar dos itens do menu, com uma linha sua levando de volta.

Escolher um item, tocar fora, Escape, o botão voltar do Android e o gesto de escape do VoiceOver fecham o menu. `ContextMenu` é o mesmo menu aberto pelo botão secundário (um clique direito) no ponteiro, ou por um dedo mantido sobre o gatilho em telas sensíveis ao toque.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

Todos os cinco vêm de [`nsh/base`](../modules/nsh-base.md). Os itens chegam ao menu por conta própria, então você os organiza livremente: grupos em views, rótulos, itens que aparecem e somem com `If`. `popupClass` estiliza o popup nos desktops e a sheet nos celulares; um estilo que difere entre eles pode comparar `platform.idiom` (`nsh`) com `"desktop"`.

<a id="menu-bars"></a>

## Barras de menu

Menus cujos gatilhos são itens de um mesmo `Toolbar` formam uma barra de menu: com um dos menus aberto, o ponteiro sobre o gatilho de outro menu abre esse menu no lugar, e as setas do teclado se movem entre os gatilhos.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Menus de contexto

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

Nos desktops, o botão secundário o abre onde o ponteiro está. Em telas sensíveis ao toque, um dedo mantido sobre o gatilho o abre como uma sheet; os toques do próprio gatilho e as scroll views ao redor continuam funcionando, e mover o dedo cancela a pressão prolongada.

<a id="checkable-items"></a>

## Itens marcáveis

`checked` torna um item marcável: uma configuração que o menu exibe ("Mostrar barra lateral") ou, com `role="menuitemradio"`, uma escolha de um grupo ("Ordenar por"). O valor é seu: escolher o item chama `onSelect`, você define o próximo valor, e o item o exibe. Enquanto está marcado, suas classes `checked:` e `checkedStyle` se aplicam, assim como as do seu indicador: a parte antes do conteúdo (`indicatorClass`, `indicatorStyle`) em torno da marca que você fornece (`indicator`). A marca é criada uma vez e mantida; as classes `checked:` do indicador a mostram e a ocultam, ou as classes `group-checked:` da própria marca com `group` em `indicatorClass`. `closeOnSelect={false}` mantém o menu aberto, de modo que uma configuração mostra seu novo valor imediatamente.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

Uma marca na borda final vai no conteúdo, estilizada com classes `group-checked:` sob `group` no item.

<a id="entrance-and-exit"></a>

## Entrada e saída

Nos desktops, o popup entra e sai com as suas transições, como as de um [Popover](./popover.md#entrance-and-exit): `popupStartingClass` é sua aparência no primeiro frame, `popupEndingClass` sua aparência depois de fechado, que ele mantém enquanto as classes `transition-*` de `popupClass` rodam, e `onClose` vem em seguida. Os submenus assumem as mesmas aparências e fecham junto com o seu menu. A sheet dos celulares desliza para dentro e para fora por conta própria.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

<a id="open-state"></a>

## Estado de abertura

Sem `open`, um menu mantém seu próprio estado (a partir de `defaultOpen` para `Menu`). Com `open`, o app é o dono do estado e o altera em `onOpenChange({ open, reason })`: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` ou `"longPress"`.

## Props

### Menu

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nenhum | Aberto, controlado pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aberto inicialmente, sem `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktops: o lado do gatilho em que ele fica. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktops: como ele se alinha ao gatilho. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: o espaço entre o gatilho e o popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: a distância que ele mantém das bordas da área segura. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O popup (desktops) ou a sheet (celulares), e os popups dos submenus. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Desktops: a aparência dos popups no primeiro frame, sobre a sua própria. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Desktops: a aparência dos popups depois de fechados, mantida enquanto suas transições rodam. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Celulares: o backdrop atrás da sheet. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O que o abre quando pressionado. Enquanto o menu está aberto, suas classes `aria-expanded:` e `expandedStyle` se aplicam. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os itens, criados a cada abertura. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, as aparências inicial e final, `backdropClass` / `backdropStyle`, `trigger` e `children` como em `Menu`, e:

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | O botão secundário e os dedos mantidos não fazem nada. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: o espaço entre o ponteiro e o popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktops: a distância que ele mantém das bordas da área segura. |

### MenuItem

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Não pode ser escolhido; os estilos `disabled:` se aplicam. |
| `checked` | `.checked(..)` | `boolean` | nenhum | Marcado ou não, o que o torna um item marcável; pertence ao app. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | nenhum | Seu estilo enquanto marcado, como classes `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` com `checked`, senão `"menuitem"` | O que ele é para leitores de tela; `"menuitemradio"` para uma escolha de um grupo. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador, a parte antes do conteúdo; suas classes `checked:` e `disabled:` acompanham o item. |
| `indicator` | `.indicator(..)` | `JSX.Element` | nenhum | A marca dentro do indicador. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Escolhê-lo fecha o menu. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem, quando o conteúdo não basta. |
| `children`, `class`, `style` | `.child(..)`, métodos de estilo | | nenhum | Seu conteúdo e aparência, com os estados `hover:`, `active:` e `checked:`. |

### Submenu

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O item que o abre. |
| `back` | `.back(..)` | `JSX.Element` | nenhum | Celulares: a linha acima dos seus itens que volta aos itens ao redor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Não abre. |
| `offset` | `.offset(..)` | `number` | `0` | Desktops: o espaço entre o menu ao redor e o seu popup. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Seus itens. |

`MenuSeparator` é uma view que você estiliza (`class`, `style`), exibida junto com os itens do seu nível.

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Abriu ou fechou, com o motivo. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | Está visível; como sheet, depois de entrar. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Sumiu: como sheet, depois de sair; como popup, depois da sua saída. Também quando o app o fechou. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Desktops: o popup foi posicionado: `placement` (o lado em que ficou), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | O usuário tentou fechá-lo sem escolher (Escape ou voltar, um toque fora ou no backdrop). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | O item foi escolhido; um item marcável pede o seu outro valor. |

<a id="accessibility"></a>

## Acessibilidade

O popup ou a sheet é um menu e seus itens são itens de menu para leitores de tela; o gatilho informa se o menu está expandido. Um item marcável é um item de menu do tipo checkbox ou radio, lido como marcado ou não marcado; seu indicador faz parte do item. Em TSX, o gatilho é o elemento que você passa, um `Button` ou uma view sua: ele recebe os toques e o estado expandido por conta própria, então suas classes `active:` e `activeStyle` aparecem enquanto ele está pressionado, e o seu próprio `onPress` também é executado. Apenas os itens do nível exibido estão na tela, então os leitores de tela leem o que está ali.
