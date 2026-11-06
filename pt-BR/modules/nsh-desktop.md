---
title: "nsh/desktop"
description: "APIs exclusivas para desktop: a janela (título, barra de título, maximizar, tela cheia), uma barra de título própria do aplicativo com regiões arrastáveis, o menu do aplicativo, menus de contexto e atalhos de teclado."
order: 12.5
source_hash: 460c34aa14353d38
---


# nsh/desktop

`nsh/desktop` reúne o que só os desktops têm: a janela e sua barra de título, o menu do aplicativo e os menus de contexto. Funciona no macOS, no Windows e no Linux. O código Rust encontra o mesmo em `nsh_core::element::desktop`: as funções da janela (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), o menu do aplicativo e os menus de contexto (`set_application_menu`, `popup_menu`, compostos por `MenuItem`) e marca as views arrastáveis com `.window_drag(true)`; TSX importa `nsh/desktop`. O módulo pode ser importado em todas as plataformas, então um único bundle roda em qualquer lugar: no iOS e no Android suas funções não fazem nada, e `isAvailable` informa se a janela e os menus existem.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` onde as APIs de janela e de menu deste módulo funcionam: macOS, Windows e Linux; `false` nos demais. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) é a verificação mais ampla para o comportamento de desktop (props `desktop={{…}}`, `platform.select({ desktop })`): ela também vale em navegadores no idioma desktop, que rodam na janela do próprio navegador. Condicione o layout, a densidade e a entrada de desktop a `platform.desktop`, e as chamadas de `Window` e `Menu` a `isAvailable`.

<a id="window"></a>

## Janela

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

A coluna Rust indica as funções de `nsh_core::element::desktop`.

| Membro | Rust | Descrição |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | O título da janela: a barra de título, a barra de tarefas ou o Dock, o seletor de janelas. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` remove a barra de título do sistema: o app preenche a janela até a borda superior e desenha uma barra de título própria. Os controles de janela do sistema permanecem (os semáforos do macOS, os botões minimizar / maximizar / fechar do Windows, os botões de janela do GTK). `height` é a altura da sua barra em pontos: os controles ficam centralizados nela (os botões de legenda do Windows a preenchem; no macOS `height` seleciona o chrome compacto até 44 pontos e o regular acima disso; dimensione sua barra usando a altura real de `titleBar().height`, e o AppKit posiciona os semáforos durante o redimensionamento ao vivo. A barra de ferramentas já existente de um app hospedeiro mantém seu próprio estilo e altura); sem ela, os controles assumem a altura da plataforma. `style: "default"` traz de volta a barra de título do sistema (Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | No Windows e no Linux em apps GPUI, onde a janela desenha o menu do aplicativo como uma barra acima do app: `"shown"` (o padrão) o mostra sempre; `"autoHide"` o mostra depois que Alt é pressionada e solta sozinha, até que Alt sozinha o oculte de novo, como em apps do Windows e do GNOME. F10 e Alt com a inicial de um menu abrem um menu de qualquer modo, e a barra aparece enquanto ele está aberto. A barra de menus do macOS é do sistema. |
| `minimize()` | `minimize()` | Minimiza a janela. |
| `toggleMaximize()` | `toggle_maximize()` | Maximiza a janela, ou a restaura quando ela está maximizada. |
| `toggleFullScreen()` | `toggle_full_screen()` | Entra ou sai da tela cheia. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Move e dimensiona a janela em pontos; campos omitidos mantêm seus valores. No macOS e no Windows, `size` (`width`, `height`) inclui as decorações da janela; no Linux, define o tamanho padrão de janela do GTK. `origin` (`x`, `y`) é o canto superior esquerdo da janela, medido a partir do canto superior esquerdo da tela principal (no macOS, a que tem a barra de menus), com `y` crescendo para baixo, igual em todas as plataformas; um `height` sem `y` mantém a borda superior onde está, de modo que a janela cresce e encolhe pela borda inferior. `animated: true` ativa a animação de redimensionamento do macOS (padrão: false). |
| `setLevel(level)` | `set_level(level)` | No macOS e no Windows, `"floating"` mantém a janela acima das janelas normais e `"normal"` restaura o nível normal. `"desktopIcon"` seleciona o nível dos ícones da área de trabalho do macOS (a janela também fica em todos os espaços, fora do Mission Control e do Cmd+`); no Windows, move a janela para o fundo da ordem z atual, de onde uma ativação posterior pode elevá-la. |
| `orderFront()` | `order_front()` | Traz a janela para a frente do seu nível e lhe dá foco (o app é ativado; o macOS tira a janela da minimização, o Windows restaura janelas minimizadas e define o primeiro plano, o GTK a apresenta). A janela mantém seu nível. No macOS, superfícies de nível de área de trabalho permanecem atrás das outras janelas. O GPUI ativa sua janela; o gerenciador de janelas controla as solicitações de primeiro plano no Linux. |
| `close()` | `close_window()` | Fecha a janela; o app termina com ela. |

O dimensionamento de janela é suportado no macOS, no Windows e no Linux; o posicionamento e os níveis, no macOS e no Windows. O gerenciador de janelas do Linux controla o posicionamento e o empilhamento. Em apps GPUI, `setFrame` define o tamanho da janela e a plataforma a posiciona; o host do GPUI escolhe sua posição e seu nível ao abrir a janela.

Ao dimensionar uma janela a partir de conteúdo medido com `onLayout`, reserve espaço para as decorações da janela no macOS e no Windows. `width` e `height` aceitam números finitos positivos; `x` e `y` aceitam números finitos. Campos inválidos mantêm seus valores anteriores.

<a id="a-title-bar-of-your-own"></a>

## Uma barra de título própria

Com a barra de título oculta, o app desenha sua própria barra e indica quais partes dela movem a janela, com `.window_drag(true)` em Rust e `desktop={{ windowDrag: true }}` em TSX:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

Pressionar uma view com `windowDrag` arrasta a janela como a barra de título do sistema faria: um clique duplo a maximiza (ou faz o que o usuário definiu: no macOS, "Dar um clique duplo na barra de título da janela para"), e no Windows e no Linux um clique com o botão direito abre o menu da janela.

- A view mais próxima que define `windowDrag` decide: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) mantém clicável uma parte de uma view arrastável.
- Campos de texto e views com handlers de pressionar ou tocar (`onPress`, `onTouch*`, responders) dentro de uma view arrastável continuam clicáveis sem isso: o campo de busca e quaisquer botões do exemplo acima funcionam normalmente.
- `windowDrag` também funciona com a barra de título do sistema: uma barra lateral ou uma barra de ferramentas também pode mover a janela.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

A área da barra de título oculta, em pontos (reativa): seu `height` e as larguras que os controles de janela do sistema ocupam nas extremidades `left` e `right`. Monte o layout da sua barra com ela para que nada fique sob os controles. Os três valores são 0 enquanto o sistema mostra sua barra de título (e em tela cheia, e fora de desktops). Rust: `title_bar() -> Edges<Points>`, cujo `top` é a altura e cujos `left` e `right` são as larguras dos controles; lê-lo assina as mudanças.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, senão a da barra de título (28 ou 32, conforme a versão do macOS) | A largura dos semáforos | 0 |
| Windows | `height`, senão 32 | 0 | Os três botões de legenda (138) |
| Linux | `height`, senão a da barra de cabeçalho | Os botões de janela no início (o layout de botões do desktop) | Os botões de janela no fim |

No Windows, os botões de legenda são desenhados pelo NSH no estilo do Windows 11 e seguem a aparência do app; passar o mouse sobre o botão de maximizar mostra os layouts de encaixe do Windows 11. A janela mantém suas bordas de redimensionamento, sua sombra e seus cantos arredondados em todas as plataformas.

## Menu

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Membro | Descrição |
|---|---|
| `setApplicationMenu(items)` | Define o menu do aplicativo: um submenu por item de nível superior (`File`, `Edit`, ...). No macOS, é a barra de menus, cujo primeiro menu é o menu do app (o AppKit o intitula com o nome do app). No Windows e no Linux, é a barra de menus da janela, que não é exibida enquanto a barra de título está oculta; seus atalhos continuam funcionando, e uma barra de título própria do app pode abrir seus menus com `Menu.popup`. `null` restaura o menu padrão da plataforma. |
| `popup(items, at?)` | Mostra um menu de contexto com o canto superior esquerdo em `at` (as coordenadas da janela, em pontos: o `e.pagePosition` de um `onContextMenu`), ou no ponteiro. A promise é resolvida quando o menu fecha, tenha um item sido escolhido ou não: um botão que o abriu pode ficar pressionado até lá. |

Em Rust, `set_application_menu(items)` recebe um `Vec<MenuItem>` (`None` restaura o menu padrão da plataforma), e `popup_menu(items)` (no ponteiro) e `popup_menu_at(items, at)` retornam um `Answer<()>` que chega quando o menu fecha (aguardá-lo é opcional). O handler de um item roda sob o owner que definiu o menu, enquanto esse owner viver.

Chame `setApplicationMenu` de novo para mudar o menu. Dentro de um `effect`, ele acompanha os signals que lê: uma marca de seleção ou um estado desabilitado que depende do estado do app se mantém atualizado.

<a id="menu-items"></a>

### Itens de menu

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| Campo | Descrição |
|---|---|
| `label` | O que o item mostra. Um item de role tem um rótulo próprio sem ele. |
| `onSelect` | Chamado quando o item é escolhido, por um clique ou pelo seu atalho. |
| `shortcut` | Seu atalho de teclado: modificadores e uma tecla unidos por `+`, como `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` ou `"f11"`. Os modificadores estão na tabela abaixo. As teclas são letras, dígitos e pontuação, escritos como o caractere que a tecla digita em um teclado americano sem Shift (`,`, `/`; `"shift+/"` para `?`), ou um nome: `plus` (a tecla `=` / `+`, também `=`), `minus` (também `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, as setas `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. Maiúsculas e minúsculas não importam (`"Mod+Shift+N"` é `"mod+shift+n"`; uma letra maiúscula é a mesma tecla, não Shift), e minúsculas é o estilo recomendado. Um atalho inválido (`"mod-n"`, `"mod++"`, `"mod+?"`) lança um erro que indica a grafia correta. `keymap` aceita as mesmas teclas. Os menus o exibem no estilo da própria plataforma (`⇧⌘N` no macOS, `Ctrl+Shift+N` no Windows). |
| `when` | Quando o atalho escolhe o item enquanto um campo de texto tem o foco do teclado, no backend GPUI: `"always"` (o padrão), `"auto"` (a menos que o campo use a própria tecla: teclas que digitam, movem o cursor ou apagam, e os atalhos de edição, como nos bindings de [`keymap`](./nsh.md#keymap)) ou `"notEditing"`. Uma tecla que o item deixa passar vai para o campo. |
| `disabled` | `true` deixa o item acinzentado (padrão `false`). |
| `checked` | Defina (como `true` ou `false`) para um item com marca de seleção. |
| `submenu` | Torna o item um submenu (precisa de um `label`). |
| `role` | Um item padrão que a plataforma executa (abaixo). |

Itens `null`, `undefined` e `false` são ignorados, então `cond && { … }` funciona em uma lista.

Em Rust, um item é `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` ou `MenuItem::submenu(label, items)`, com os campos como métodos: `.shortcut("mod+n")` (entra em panic com um atalho inválido, indicando a grafia correta), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)` e `.label(..)` para o item de uma role.

Modificadores:

| Modificador | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (também `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (também `command`, `meta`, `super`, `win`) | Command (⌘) | Tecla Windows | Super |
| `ctrl` (também `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (também `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

Use `mod` para os atalhos próprios de um app: é a tecla que os apps de cada plataforma usam para eles (⌘N no macOS, Ctrl+N no Windows e no Linux), então uma única grafia serve em todo lugar. A tecla Windows e Super pertencem em grande parte ao sistema (Win+E, a visão geral do GNOME), então `cmd` raramente é a escolha certa fora do macOS.

Roles:

| Role | Faz | Plataformas |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Os itens padrão do menu do app | macOS (omitidos nas demais) |
| `quit` | Encerra o app | Todas |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Editam o campo de texto em foco (seus próprios atalhos continuam sendo dele) | Todas |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | A janela | Todas |

Um item de role tem o rótulo e o atalho da plataforma, a menos que defina os seus (o macOS adiciona o nome do app a `about`, `hide` e `quit`).

Os atalhos de menu vêm primeiro, como nos apps nativos: uma tecla que um item usa nunca chega ao campo de texto em foco nem às teclas do próprio NSH. Apenas um binding de [`keymap`](./nsh.md#keymap) com o mesmo atalho vem antes deles. Portanto, dê os atalhos de edição (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) apenas às roles de edição, que os repassam ao campo de texto, e evite teclas sem modificador (`escape`, as setas, letras), que as tirariam dos campos de texto e da navegação de volta. No backend GPUI, `when: "auto"` permite que um item compartilhe uma tecla com campos de texto: `delete` ou `mod+z` escolhem o item enquanto nenhum campo tem o foco e editam o texto enquanto um tem.

No backend GPUI, um componente nativo com o foco do teclado vê cada tecla primeiro. Uma tecla que ele trata por conta própria nunca chega ao keymap nem ao menu. Uma tecla que ele deixa passar chega ao keymap como se um campo de texto estivesse em foco, e depois ao menu.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

Um menu de contexto, a partir do pressionar de um botão:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> Os menus são do sistema (NSMenu, menus Win32, menus popover do GTK): têm a aparência e o comportamento de qualquer outro app, seguem a aparência do sistema (ou do app) e são acessíveis pelo teclado. `examples/desktop` é um app com barra de título própria, menu do aplicativo e menus de contexto.
