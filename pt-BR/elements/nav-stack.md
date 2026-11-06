---
title: "NavStack"
description: "Pilhas de navegação nativas: NavStack, NavPage e createNavStack, como adicionar (push) e remover (pop) páginas, slots de cabeçalho, como sair de uma página e como cada plataforma exibe uma pilha."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---


# NavStack

Uma pilha de navegação mostra uma página por vez e mantém as páginas abaixo dela: `UINavigationController` no iOS e no Mac Catalyst, com o cabeçalho do sistema e o gesto de deslizar para voltar, e uma pilha de páginas com barra de ferramentas e voltar preditivo no Android.
Nos desktops (macOS, Windows, Linux, GPUI) e na web, cada página mostra o cabeçalho próprio do app no topo, e as teclas de
voltar e o botão de voltar do navegador removem a página da pilha. `NavStack` é a pilha, `NavPage` é uma de suas páginas.

A pilha controla o comportamento de navegação (transições, gestos e botões de voltar, estado das páginas enquanto estão cobertas); o conteúdo das páginas e o cabeçalho dos desktops ficam por conta do app.

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

No iOS e no Android, a página mostra o cabeçalho do sistema com `title` e um botão de voltar; nos desktops e na web, mostra
`header`. Um app que mira apenas celulares deixa `header` de fora; um que mira apenas desktops deixa de fora as opções do
cabeçalho do sistema. O [Guia de navegação](../docs/navigation.md) percorre a navegação de um app inteiro: o
estado da pilha, diálogos, o botão de voltar do Android e as abas.

<a id="how-a-stack-works"></a>

## Como uma pilha funciona

- As páginas da pilha são **rotas**: valores de sua escolha, da base ao topo da pilha. Uma rota geralmente
  nomeia a página e carrega seus parâmetros.
- Em TSX, as rotas ficam no estado criado por `createNavStack`. `NavStack` chama sua função filha uma vez a cada push
  e mostra o resultado como uma página. Ele mantém essa página enquanto sua rota estiver na pilha, então uma página mantém seu estado
  (signals, posição de rolagem, campos de entrada) enquanto outras páginas a cobrem.
- Em Rust, os filhos da pilha são suas páginas: um `nav_page()` colocado em `nav_stack()` é empilhado, e um que for deixado de fora é
  removido. Mantenha as rotas em um signal e renderize as páginas com `each(..)`, usando a rota como chave, para que as páginas abaixo mantenham
  seu estado.
- Cada push é uma página própria, inclusive quando o mesmo valor de rota é empilhado duas vezes.
- Quando o usuário sai de uma página de forma nativa (botão de voltar, deslizar para voltar, voltar do Android, teclas de voltar dos desktops,
  voltar do navegador), a página é removida. Em TSX, a pilha remove a rota do estado, de modo que `nav.routes()` sempre corresponde
  ao que o usuário vê. Em Rust, a página dispara `on_dismiss`, onde você descarta a rota dela (e as rotas acima dela).
- Em TSX, uma função filha que retorna algo diferente de `<NavPage>` gera uma página com opções padrão. Retorne
  um `<NavPage>` para definir o cabeçalho e as demais opções.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Cria o estado de uma pilha que começa com `routes`, da base ao topo. Crie-o uma só vez, por exemplo no nível do módulo,
e passe-o para `<NavStack state>`. Qualquer código pode importá-lo para navegar.

| Membro | Descrição |
|---|---|
| `routes: Accessor<readonly R[]>` | As rotas, da base ao topo. Reativo. |
| `push(route: R): void` | Empilha uma página. |
| `pop(count?: number): void` | Remove `count` páginas (padrão 1). Pelo menos uma página sempre permanece. |
| `popToRoot(): void` | Volta para a primeira página. |
| `replace(route: R): void` | Substitui a página do topo. |
| `setRoutes(routes: R[]): void` | Substitui as páginas; uma rota que permanece (o mesmo valor) mantém sua página e seu estado. |
| `remove(route: R): void` | Remove a página mais ao topo de `route` (comparada com `===`), esteja onde estiver na pilha. |

Em Rust, as mesmas operações são alterações no seu signal de rotas: `routes.update(|r| r.push(route))` empilha,
`r.pop()` remove, `r.truncate(1)` volta para a primeira página que você mantém nele, e `routes.set(..)` substitui as páginas.

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

<a id="navstack-props"></a>

## Props de NavStack

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `state` | as páginas são seus filhos | `NavStackState<R>` | O estado que guarda as rotas (`createNavStack`). Obrigatório. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderiza uma rota. Retorne um `<NavPage>` para suas opções. Obrigatório. |
| `style`, `class` | métodos de estilo | | O estilo da pilha; normalmente `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Localiza a pilha em testes e em `nsh test --trace`. |

A função filha em TSX recebe o próprio valor da rota e um accessor da posição dela na pilha.

<a id="navpage-props"></a>

## Props de NavPage

`NavPage` é uma página de uma pilha. Ela guarda o conteúdo da página, seu `header` nos desktops e na web, e as
opções do cabeçalho do sistema no iOS e no Android. Em Rust, `nav_page()` retorna a página e seus métodos builder são
os nomes das props em snake case.

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | nenhum | Desktops e web: o cabeçalho da página, posicionado no topo da página, tão largo quanto a página e tão alto quanto o seu layout, com o conteúdo abaixo dele. |
| `title` | `.title(..)` | `string` | nenhum | iOS e Android: o título do cabeçalho do sistema. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS e Android: o cabeçalho do sistema é exibido. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS e Android: o conteúdo se estende por baixo de um cabeçalho do sistema transparente. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: a barra de abas do sistema sai enquanto esta página está no topo, movendo-se na transição — a mesma animação da página, e a barra nunca é reconstruída; ela volta quando a página é removida. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: um título grande que encolhe até a barra conforme o conteúdo rola; o conteúdo rola por baixo do cabeçalho. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | nenhum | iOS e Android: o rótulo do botão de voltar que leva de volta a esta página (no Android, sua descrição para leitores de tela). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS e Android: o botão de voltar é exibido. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | nenhum | iOS e Android: conteúdo na borda inicial do cabeçalho do sistema, no lugar do botão de voltar. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | nenhum | iOS e Android: conteúdo na borda final do cabeçalho do sistema. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | nenhum | iOS e Android: conteúdo que substitui o título. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | plataforma | iOS e Android: as cores do cabeçalho do sistema: o fundo, o do título (`color`) e o dos botões (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | nenhum | As mesmas cores como classes: `bg-*`, `text-*` para o título, `tint-*` para os botões (em Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, cores do tema que acompanham a aparência). `headerStyle` tem prioridade sobre elas. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | Os botões de voltar e o deslizar para voltar removem a página. Veja [Saindo de uma página](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | O gesto interativo de voltar remove a página: deslizar para voltar no iOS, voltar preditivo do Android que acompanha o dedo. Os botões de voltar removem a página de qualquer forma. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Como a página entra e sai. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | nenhum | A página entra e sai por meio de um shader WGSL no lugar de seu `animation`: `shade(uv)` lê a página abaixo como `sample_from` e esta página como `sample_to` enquanto `nsh.progress` vai de 0 a 1 ao longo de `duration` milissegundos (350 por padrão), e de 1 de volta a 0 quando a página sai. Quando o sistema pede menos movimento, a página usa o seu próprio `animation`. Veja [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | nenhum | iOS e Android: a barra de status enquanto a página está no topo. Veja [Barra de status](../modules/nsh-base.md#status-bar). |
| `style`, `class` | métodos de estilo | | nenhum | O estilo da página. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo. |
| `testID` | `.test_id(..)` | `string` | nenhum | Localiza a página em testes e em `nsh test --trace`. |

<a id="navpage-events"></a>

## Eventos de NavPage

| Evento | Rust | Descrição |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | O usuário pressionou voltar na página (o botão de voltar do cabeçalho, voltar do Android, Escape, Alt+Seta para a esquerda ou o botão de voltar do mouse nos desktops, o voltar do navegador), independentemente de `popOnBack` ter permitido remover a página. |
| `onDismiss` | `.on_dismiss(..)` | O usuário removeu a página (botão de voltar, deslize); em TSX sua rota já foi removida, e em Rust você a descarta aqui. |

<a id="header-slots"></a>

## Slots do cabeçalho

`header`, `headerLeft`, `headerRight` e `headerTitle` são slots: elementos comuns que leem signals, tratam toques
e se atualizam enquanto a página é exibida. `header` é o cabeçalho inteiro do app nos desktops e na web; os outros três
vão para o cabeçalho do sistema no iOS e no Android.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

O conteúdo da página começa abaixo do cabeçalho: abaixo de um cabeçalho do sistema opaco no iOS e no Android, abaixo de `header` nos
desktops e na web. Com `headerTransparent`, `headerLargeTitle` ou `headerVisible={false}`, ele começa no topo da
página no iOS e no Android; use [`env(safe-area-inset-top)`](./safe-area.md) ou `safeAreaInsets()` para mantê-lo afastado do
cabeçalho e da barra de status.

No iOS, `headerVisible={false}` mantém o deslizar para voltar habilitado enquanto `popOnSwipe` e `popOnBack` forem verdadeiros.
Um gesto interativo de voltar aceito encerra a edição quando a transição começa, então o teclado é dispensado durante o
arrasto. Cancelar a transição restaura o foco do mesmo editor quando outro controle não o tiver assumido.

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## Saindo de uma página

`popOnBack={false}` mantém o usuário em uma página, por exemplo enquanto um formulário tem alterações não salvas. Enquanto for false, o deslizar
para voltar fica desativado e os botões e teclas de voltar chamam `onBackPress` sem remover a página. Pergunte ao usuário e depois remova a página você mesmo:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> O sistema pergunta se o usuário pode voltar na thread principal, no momento em que o usuário age, e a thread principal
> nunca espera por JS nem pelo seu código Rust. Por isso, o NSH responde a partir do valor de `popOnBack` que já está montado. Defina
> `popOnBack={false}` assim que houver algo a perder, antes de o usuário voltar.

`onBackPress` é chamado a cada toque em voltar, inclusive quando a página é removida, então ele também informa que o usuário voltou.
Para desativar apenas o gesto de deslizar e manter os botões de voltar, use `popOnSwipe={false}`. A confirmação em si é um
[AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Notas por plataforma

- **iOS**: `UINavigationController` com o cabeçalho do sistema, botão de voltar e deslizar para voltar; `headerLargeTitle` é o
  título grande do UIKit. As alterações na pilha que chegam durante uma transição em andamento são aplicadas quando ela termina.
- **Android**: uma pilha com barra de ferramentas. O botão de voltar do sistema remove a página do topo, com voltar preditivo nas versões do Android
  que o possuem; a descrição da seta para cima para leitores de tela é o `headerBackTitle` da página inferior, ou o
  do sistema. Veja `BackHandler` em [`BackHandler`](../modules/nsh-mobile.md#backhandler) para tratar o botão de voltar por conta própria.
- **Mac Catalyst**: igual ao iOS.
- **Desktops (macOS, Windows, Linux, GPUI) e web**: cada página mostra seu `header` no topo e seu conteúdo
  abaixo dele. Escape, Alt+Seta para a esquerda e o botão de voltar do mouse voltam nos desktops, e o botão de voltar do navegador faz isso na web.

Para conteúdo exibido sobre a pilha e seu cabeçalho, como uma sheet ou um fluxo em tela cheia, use um
[Dialog](./dialog.md).
