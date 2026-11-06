---
title: "Navegação"
description: "Pilhas de navegação nativas com createNavStack, NavStack e NavPage, cabeçalhos em todas as plataformas, como manter o usuário em uma página com popOnBack, diálogos e o botão Voltar do Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---


# Navegação

`nsh_base` (TSX: `nsh/base`) oferece uma pilha de navegação nativa e diálogos nativos. Uma pilha de navegação (`nav_stack()` em Rust, `NavStack` em TSX) é uma UINavigationController no iOS, com seu cabeçalho, gesto de voltar deslizando e títulos grandes, e uma pilha com toolbar e predictive back no Android; nos desktops e na web, cada página mostra o cabeçalho que o seu app desenha. Você mantém as rotas no seu estado; a pilha renderiza cada rota como uma página e a mantém montada, com seu estado, enquanto ela estiver na pilha.

Em Rust, importe os builders pelo nome junto com o prelude (`use nsh_base::{dialog, nav_page, nav_stack};`; os alertas do sistema são `nsh_base::alert_dialog()`). As rotas são um signal e os filhos da pilha são suas páginas, uma por rota, identificadas por chave (`each`): uma página que entra faz o push, e uma que sai faz o pop. Em TSX, `createNavStack` guarda as rotas e `NavStack` as renderiza.

```rust tabs
use nsh_base::{nav_page, nav_stack};
use nsh_core::prelude::*;

#[derive(Debug, Clone, PartialEq)]
enum Route {
    Inbox,
    Message(u32),
}

/// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
fn header(routes: Signal<Vec<Route>>, title: &'static str) -> impl IntoElement {
    view()
        .h(px(48.0))
        .flex_row()
        .items_center()
        .gap_3()
        .border_b_1()
        .border_color(rgb(0xe5e7eb))
        .px_4()
        .child(when(
            move || routes.with(|r| r.len() > 1),
            move || {
                text("Back")
                    .role(AccessibilityRole::Button)
                    .on_press(move || routes.update(|r| { r.pop(); }))
                    .text_color(rgb(0x2563eb))
                    .active(|s| s.opacity(0.6))
            },
        ))
        .child(text(title).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
}

fn inbox(routes: Signal<Vec<Route>>) -> Screen {
    nav_page()
        .title("Inbox")
        .header(header(routes, "Inbox"))
        .child(scroll().flex_1().children((1..=5).map(move |id| {
            view()
                .on_press(move || routes.update(|r| r.push(Route::Message(id))))
                .p_4()
                .active(|s| s.bg(rgb(0xf3f4f6)))
                .child(text(format!("Message {id}")))
        })))
}

fn message(routes: Signal<Vec<Route>>, id: u32) -> Screen {
    nav_page()
        .title(format!("Message {id}"))
        .header(header(routes, "Message"))
        .child(view().flex_1().p(px(16.0)).child(text(format!("The body of message {id}."))))
}

#[component]
pub fn App() -> impl IntoElement {
    let routes = signal(vec![Route::Inbox]);
    nav_stack().flex_1().child(each(
        move || routes.get(),
        |route: &Route| format!("{route:?}"),
        move |route, index| {
            let page = match route.get_untracked() {
                Route::Inbox => inbox(routes),
                Route::Message(id) => message(routes, id),
            };
            // The user went back natively: drop the route (and those above it).
            page.on_dismiss(move || routes.update(|r| r.truncate(index.get_untracked())))
        },
    ))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "inbox" } | { name: "message"; id: number };

const nav = createNavStack<Route>([{ name: "inbox" }]);

// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
function Header(props: { title: string }) {
  return (
    <View class="h-12 flex-row items-center gap-3 border-b border-gray-200 px-4">
      <If when={nav.routes().length > 1}>
        <Text role="button" onPress={() => nav.pop()} class="text-blue-600 active:opacity-60">
          Back
        </Text>
      </If>
      <Text style={{ fontSize: 17, fontWeight: "600" }}>{props.title}</Text>
    </View>
  );
}

function Inbox() {
  return (
    <NavPage title="Inbox" header={<Header title="Inbox" />}>
      <Scroll style={{ flex: 1 }}>
        <Each of={[1, 2, 3, 4, 5]}>
          {(id) => (
            <View onPress={() => nav.push({ name: "message", id: id() })} class="p-4 active:bg-gray-100">
              <Text>Message {id()}</Text>
            </View>
          )}
        </Each>
      </Scroll>
    </NavPage>
  );
}

function Message(props: { id: number }) {
  return (
    <NavPage title={`Message ${props.id}`} header={<Header title={`Message ${props.id}`} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The body of message {props.id}.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => {
        switch (route.name) {
          case "inbox":
            return <Inbox />;
          case "message":
            return <Message id={route.id} />;
        }
      }}
    </NavStack>
  );
}

mount(App);
```

<a id="the-stacks-state"></a>

## O estado da pilha

Em Rust, as rotas são o seu próprio signal (`signal(vec![..])`, ou `global::<Routes>()` para um que o app inteiro alcança), e você faz push, pop e replace atualizando-o: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. A chave de cada página (aqui o texto `Debug` da rota) diz à pilha qual página é qual, de modo que as páginas cuja rota permanece mantêm seu estado; dê uma chave única às rotas que podem se repetir. Trate o `on_dismiss` de cada página: o usuário voltou de forma nativa, e a rota (com as que estão acima dela) sai do seu signal.

Em TSX, `createNavStack(routes)` cria o estado da pilha a partir de um array de rotas, da base ao topo. Uma rota é qualquer valor que você quiser (uma string, um objeto, uma union discriminada como acima), e cada push é uma página própria, inclusive quando a mesma rota é empilhada duas vezes. Crie o estado uma só vez, no nível do módulo ou no seu componente raiz, e importe-o onde as páginas navegarem.

| Membro | Descrição |
|---|---|
| `routes()` | As rotas, da base ao topo (reativo). |
| `push(route)` | Empilha uma página. |
| `pop(count?)` | Remove `count` páginas (padrão 1); pelo menos uma permanece. |
| `popToRoot()` | Volta até a primeira página. |
| `replace(route)` | Substitui a página do topo. |
| `setRoutes(routes)` | Substitui as páginas, por exemplo após o login; uma rota que permanece (o mesmo valor) mantém sua página e seu estado. |
| `remove(route)` | Remove a página mais ao topo de `route`, onde quer que ela esteja. |

Para começar com várias páginas de profundidade, passe mais rotas: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

Quando o usuário sai de uma página de forma nativa (o botão de voltar no cabeçalho, o gesto de deslizar para voltar no iOS, o botão ou gesto de voltar do Android, as teclas e o botão do mouse de voltar nos desktops, o botão de voltar do navegador), a pilha em TSX remove essa rota do seu estado por você, de modo que `routes()` sempre corresponde ao que está na tela; uma página em Rust informa isso com `on_dismiss`, como acima.

Uma rota carrega o que a página precisa. Os apps de galeria empilham rotas que contêm aquilo que forma a página, o que mantém o tipo da rota pequeno quando há muitas páginas:

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

/// A pushed page: its key (unique in the stack) and what makes it.
#[derive(Clone)]
pub struct Route {
    pub key: SharedString,
    pub page: Rc<dyn Fn() -> Screen>,
}

impl PartialEq for Route {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

/// The pushed pages, bottom to top: one signal for the whole app.
#[derive(Default, Clone)]
pub struct Routes(pub Vec<Route>);

pub fn routes() -> Signal<Routes> {
    global::<Routes>()
}

// Elsewhere: routes().update(|r| r.0.push(Route { key: "settings".into(), page: Rc::new(settings) }));
```

```ts tabs
import { type JSX } from "nsh";
import { createNavStack } from "nsh/base";

export type Route = { name: "home" } | { name: "page"; page: () => JSX.Element };
export const nav = createNavStack<Route>([{ name: "home" }]);

// Elsewhere: nav.push({ name: "page", page: Settings });
```

## NavStack

Em Rust, `nav_stack()` é uma view cujos filhos são suas páginas, da base ao topo; estilize-a como qualquer view (`.flex_1()`). Em TSX:

| Prop | Tipo | Descrição |
|---|---|---|
| `state` | `NavStackState<R>` | As rotas a mostrar. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | Renderiza uma rota; retorne um `<NavPage>` para o cabeçalho dela. |
| `style`, `class` | | O estilo da própria pilha (geralmente `flex: 1`). |

A função de renderização roda uma vez por rota, quando ela é empilhada; `route` é o valor simples, `index()` sua posição atual. O que ela retorna se torna o conteúdo da página. Retorne um `<NavPage>` para definir o cabeçalho; qualquer outra coisa é envolvida em uma página com as opções padrão.

As páginas permanecem montadas enquanto sua rota estiver na pilha: ao voltar, a página anterior aparece exatamente como foi deixada, com sua posição de rolagem, inputs e signals. Os handlers de [`cleanup`](./reactivity.md) de uma página rodam quando sua rota sai da pilha.

<a id="navpage-and-the-header"></a>

## NavPage e o cabeçalho

Uma página (`nav_page()` em Rust, `NavPage` em TSX) envolve o conteúdo de uma página e carrega seu cabeçalho. O iOS e o Android mostram o cabeçalho do sistema, configurado pelo título e pelas opções de cabeçalho. Os desktops e a web mostram o slot de cabeçalho da página (`.header(..)`, em TSX `header`), com as suas próprias views, no topo da página: tão largo quanto a página, tão alto quanto o layout resultar, com o conteúdo abaixo dele. Dê os dois a uma página, como faz o exemplo acima, e ela fica natural em qualquer lugar. Todas as opções são reativas: mude um signal e o cabeçalho acompanha.

Em Rust, cada prop abaixo é um método de `nav_page()` em snake case: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; seus filhos são o seu conteúdo.

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `header` | `JSX.Element` | | Desktops e web: o cabeçalho da página, desenhado pelo app (um título, um botão de voltar, botões de toolbar). |
| `title` | `string` | | iOS e Android: o título do cabeçalho do sistema. |
| `headerVisible` | `boolean` | `true` | iOS e Android: o cabeçalho do sistema é exibido. |
| `headerTransparent` | `boolean` | `false` | iOS e Android: o conteúdo se estende por baixo do cabeçalho. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS e Android: o fundo do cabeçalho, a cor do título (`color`) e a dos botões (`tintColor`). |
| `headerClass` | `string` | | O mesmo que classes: `bg-*`, `text-*` para o título, `tint-*` para os botões; `headerStyle` prevalece sobre eles. |
| `headerBackVisible` | `boolean` | `true` | iOS e Android: o botão de voltar é exibido. |
| `headerLeft` | `JSX.Element` | | iOS e Android: views no início do cabeçalho (elas substituem o botão de voltar). |
| `headerRight` | `JSX.Element` | | iOS e Android: views no fim do cabeçalho. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: o próprio bar button do UIKit no fim do cabeçalho, com a aparência, o símbolo ou o rótulo do sistema, no lugar das views de `headerRight`; um toque nele é um toque na primeira view pressionável de `headerRight`, então mantenha uma ali. O Android mostra `headerRight` como está. |
| `ios={{ headerLeftSystemItem }}` | igual a `headerRightSystemItem` | | iOS: o mesmo, no início do cabeçalho, acionando `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: o próprio bar button do UIKit mostrando o SF Symbol com esse nome (`"slider.horizontal.3"`) no lugar das views de `headerRight`; um toque nele é um toque na primeira view pressionável de `headerRight`, e o VoiceOver lê o rótulo dessa view. `headerRightSystemItem` prevalece sobre ele; um nome que os SF Symbols não têm faz `headerRight` ser mostrado como está. O Android mostra `headerRight` como está. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: o mesmo, no início do cabeçalho, acionando `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS e Android: views que substituem o título. |
| `headerLargeTitle` | `boolean` | `false` | iOS: um título grande que encolhe para dentro da barra conforme o conteúdo rola. |
| `headerBackTitle` | `string` | | O rótulo do botão de voltar que leva de volta a esta página (iOS; a seta de voltar do Android diz isso aos leitores de tela). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Como a página entra e sai. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS e Android: a barra de status enquanto a página está no topo ([Barra de status](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | O gesto interativo de voltar (swipe back do iOS, predictive back do Android) faz o pop. Os botões de voltar fazem o pop de qualquer forma. |
| `popOnBack` | `boolean` | `true` | Todo jeito de voltar faz o pop da página: os botões de voltar, o voltar do Android, as teclas de voltar dos desktops, o botão de voltar do navegador e o deslize. |
| `onBackPress` | `() => void` | | O usuário pressionou voltar na página, tendo `popOnBack` permitido ou não o pop. |
| `onDismiss` | `() => void` | | O usuário fez o pop da página; a rota dela já foi removida. |
| `style`, `class` | | | A view de conteúdo da página. |

Os itens do cabeçalho são views comuns, então podem ser pressionáveis e reativos:

```rust tabs
fn compose(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let cancel = move || {
        text("Cancel")
            .on_press(move || routes.update(|r| { r.pop(); }))
            .text_size(px(17.0))
            .text_color(rgb(0x0969da))
    };
    let send_button = move || {
        text("Send")
            .on_press(move || send(draft.get()))
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(move || if draft.with(String::is_empty) { rgb(0x8c959f) } else { rgb(0x0969da) })
    };
    nav_page()
        .title("New message")
        .header_left(cancel())
        .header_right(send_button())
        .header(
            view()
                .h(px(48.0))
                .flex_row()
                .items_center()
                .justify_between()
                .px_4()
                .child(cancel())
                .child(text("New message").text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
                .child(send_button()),
        )
        .child(
            input()
                .multiline(true)
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .flex_1()
                .p(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
function Compose() {
  const text = signal("");
  const cancel = () => (
    <Text onPress={() => nav.pop()} style={{ fontSize: 17, color: "#0969da" }}>
      Cancel
    </Text>
  );
  const sendButton = () => (
    <Text
      onPress={() => send(text())}
      style={{ fontSize: 17, fontWeight: "600", color: text() ? "#0969da" : "#8c959f" }}
    >
      Send
    </Text>
  );
  return (
    <NavPage
      title="New message"
      headerLeft={cancel()}
      headerRight={sendButton()}
      header={
        <View class="h-12 flex-row items-center justify-between px-4">
          {cancel()}
          <Text style={{ fontSize: 17, fontWeight: "600" }}>New message</Text>
          {sendButton()}
        </View>
      }
    >
      <Input multiline value={text()} onChange={({ value }) => text.set(value)} style={{ flex: 1, padding: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

Um cabeçalho de sistema colorido (em Rust, `header_style_with` recebe estilos tipados: `bg`, `text_color` e `tint_color`, a cor dos botões do cabeçalho; as cores do tema acompanham a aparência):

```rust tabs
nav_page()
    .title("Profile")
    .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(rgb(0xffffff)).tint_color(rgb(0xffffff)))
```

```tsx tabs
<NavPage title="Profile" headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}>
  …
</NavPage>
```

Uma página que não mostra cabeçalho ainda tem as barras do sistema ao redor; aplique padding ao conteúdo com os insets da [área segura](../elements/safe-area.md):

```rust tabs
use nsh_base::nav_page;

nav_page()
    .header_visible(false)
    .child(view().flex_1().p_safe_area() /* … */)
```

```tsx tabs
<NavPage headerVisible={false}>
  <View class="flex-1 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)] px-4">…</View>
</NavPage>
```

<a id="safe-areas-under-the-header"></a>

### Áreas seguras sob o cabeçalho

Dentro de uma página, as variáveis `env(safe-area-inset-*)` e os insets da página (`Scope::insets` em Rust, `safeAreaInsets()` em TSX) são os que ficam abaixo do cabeçalho do sistema, dentro da página. Com um cabeçalho transparente, o conteúdo começa no topo da página e o inset superior é a altura do cabeçalho, então aplicar padding com `env(safe-area-inset-top)` mantém o texto afastado dele enquanto uma imagem de fundo preenche a página inteira. Com um título grande, coloque uma scroll view diretamente na página para que o título possa colapsar ao rolar. Nos desktops e na web, o conteúdo começa abaixo do slot de cabeçalho da página.

<a id="keeping-the-user-on-a-page-poponback"></a>

## Mantendo o usuário em uma página: popOnBack

Para perguntar antes de descartar alterações não salvas, defina `pop_on_back` (TSX `popOnBack`) como false enquanto houver algo a perder, trate o toque em voltar (`.on_back_press(..)`, TSX `onBackPress`) e faça o pop quando o usuário concordar:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| { r.pop(); });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || draft.with(String::is_empty))
        .on_back_press(move || {
            if !draft.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .placeholder("A note")
                .m(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const dirty = () => text().length > 0;
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
    <NavPage title="Edit" popOnBack={!dirty()} onBackPress={() => dirty() && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" style={{ margin: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

Com `pop_on_back(false)` (`popOnBack={false}`), a página permanece em qualquer jeito de voltar (os botões de voltar, o botão e o gesto de voltar do Android, as teclas de voltar dos desktops, o botão de voltar do navegador, o deslize), e o evento de toque em voltar informa que o usuário tentou. Fazer o pop pelo código (removendo a rota, `nav.pop()`) faz o pop como sempre.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` é uma prop, não um callback que retorna true ou false, porque a thread principal nunca espera pelo código do app. Quando o usuário inicia um deslize ou pressiona voltar, o sistema pergunta imediatamente se a página pode sair, e o NSH responde de forma nativa a partir das props que já tem. Defina-a assim que houver algo a perder (como acima, a partir do texto), antes que o usuário tente sair.

`pop_on_swipe(false)` (`popOnSwipe={false}`) é a opção mais leve: desativa apenas o gesto interativo (swipe back do iOS, animação de predictive back do Android), e os botões de voltar continuam fazendo o pop.

<a id="dialogs"></a>

## Diálogos

Um diálogo (`dialog()` de `nsh_base` em Rust, `Dialog` em TSX) apresenta conteúdo sobre todo o resto, em sua própria camada de janela nativa: uma view controller apresentada no iOS, uma janela de diálogo no Android, uma camada sobre a janela inteira nos desktops e na web. A aparência é sua. Em Rust, o diálogo é apresentado enquanto está na view (dentro de um `when`) e seus filhos o preenchem: desenhe o backdrop e o popup como views. Em TSX, `class` e `style` estilizam o popup que contém seus filhos, `backdropClass` ou `backdropStyle` adicionam um backdrop atrás dele, e `open` o controla:

```rust tabs
use nsh_base::dialog;
use nsh_core::prelude::*;

pub fn files() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .child(view().on_press(move || open.set(true)).p(px(16.0)).child(text("Delete the file")))
        .child(when(
            move || open.get(),
            move || {
                dialog()
                    .animation(ModalAnimation::Fade)
                    // Escape, Android's back button, a swipe down on a sheet.
                    .on_cancel(move || open.set(false))
                    .child(
                        // The backdrop and the popup are the app's views.
                        view()
                            .flex_1()
                            .bg(rgba(0x00000066))
                            .items_center()
                            .justify_center()
                            .on_press(move || open.set(false))
                            .child(
                                view()
                                    .w(px(320.0))
                                    .gap_3()
                                    .rounded_2xl()
                                    .bg(white())
                                    .p_5()
                                    .on_press(|| {})
                                    .child(text("Delete the file?").text_size(px(20.0)).font_weight(FontWeight::BOLD))
                                    .child(
                                        view()
                                            .on_press(move || open.set(false))
                                            .child(text("Delete").text_color(rgb(0xcf222e))),
                                    ),
                            ),
                    )
            },
        ))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Dialog } from "nsh/base";

function Files() {
  const open = signal(false);
  return (
    <View style={{ flex: 1 }}>
      <View onPress={() => open.set(true)} style={{ padding: 16 }}>
        <Text>Delete the file</Text>
      </View>
      <Dialog
        open={open()}
        animation="fade"
        onOpenChange={(e) => open.set(e.open)}
        backdropClass="bg-black/40"
        class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete the file?</Text>
        <View onPress={() => open.set(false)}>
          <Text style={{ color: "#cf222e" }}>Delete</Text>
        </View>
      </Dialog>
    </View>
  );
}
```

Escape, o botão de voltar do Android, um toque no backdrop (o backdrop do TSX, o de uma sheet nativa em Rust) e um deslize para baixo em uma sheet o fecham de forma nativa (`close_on_escape`, `close_on_backdrop_press` e `close_on_swipe`, em TSX `closeOnEscape`, `closeOnBackdropPress` e `closeOnSwipe`, todos true por padrão). Em Rust, `on_cancel` informa cada tentativa e `on_close` o fechamento, então deixe o diálogo fora da view ali; um backdrop que o seu app desenha o fecha com o próprio handler de toque, como acima. Em TSX, `onOpenChange({ open: false, reason })` avisa você, então defina `open` como `false` ali. Para confirmar antes, defina uma flag como false e trate o evento de cancelamento (`on_cancel`, `onCancel`), que informa cada tentativa, e então feche o diálogo você mesmo. No iOS, `.presentation(ModalPresentation::PageSheet)` ou `FormSheet` (`presentation="pageSheet"` ou `"formSheet"`) apresenta uma sheet que mantém visível o que está atrás.

Veja [Dialog](../elements/dialog.md) para todas as props. Dentro de um diálogo, as variáveis `env(safe-area-inset-*)` e os insets são os do próprio diálogo. Para diálogos do sistema (um alerta com ações, um action sheet), use [`AlertDialog`](../modules/nsh-base.md#alertdialog) de `nsh_base` (TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## O botão voltar do Android

No Android, o botão (ou gesto) de voltar é tratado nesta ordem:

1. O diálogo do topo: ele informa o cancelamento (`on_cancel`, `onCancel`) e fecha enquanto `close_on_escape` / `closeOnEscape` for true (o padrão).
2. Seus listeners de voltar (`on_back_press` em Rust, `BackHandler` de `nsh/mobile` em TSX), o adicionado mais recentemente primeiro.
3. A pilha do topo: sua página do topo informa o toque em voltar e faz o pop enquanto `pop_on_back` / `popOnBack` for true.
4. Se nada o tratou: o app é encerrado.

Um listener retorna `true` quando tratou o toque, o que impede a pilha de fazer o pop. Enquanto um listener estiver registrado,
o gesto de voltar do Android não mostra uma prévia do pop (o app só responde quando o gesto termina), então adicione listeners apenas
enquanto eles puderem assumir o toque:

```rust tabs
use nsh_core::prelude::*;

pub fn editor() -> impl IntoElement {
    let selecting = signal(false);
    // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
    effect(move || {
        if selecting.get() {
            on_back_press(move || {
                selecting.set(false);
                true
            });
        }
    });
    // …
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { BackHandler } from "nsh/mobile";

function Editor() {
  const selecting = signal(false);
  // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
  effect(() => {
    if (selecting()) {
      BackHandler.on("press", () => {
        selecting.set(false);
        return true;
      });
    }
  });
  // …
}
```

Um listener criado em um effect dura até o effect rodar de novo ou seu componente sair; em TSX, a função
que `BackHandler.on` retorna também o interrompe. Em TSX, `BackHandler.exitApp()` sai do app; `nsh/mobile` também pode ser importado no iOS, onde as chamadas de `BackHandler` retornam imediatamente, de modo que o mesmo código roda nas duas plataformas. Veja [Código específico de plataforma](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## Abas e outros layouts

Uma barra de abas é a sua própria UI, desenhada a partir de primitivas: uma linha de views pressionáveis e um signal que guarda a aba selecionada; renderize o conteúdo da aba selecionada com [`when` / `<If>`](../elements/control-flow.md) (ou um filho função em TSX). Para manter o estado de cada aba ao alternar, dê a cada aba sua própria pilha e rotas e mantenha todas montadas, escondendo as inativas com `display: none`.

<a id="related"></a>

## Relacionados

- [`nsh/base`](../modules/nsh-base.md): a referência de `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` e `Dialog`; [Área segura](../elements/safe-area.md) para os insets.
- [A barra de status](../modules/nsh-base.md#status-bar) de páginas e diálogos.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
