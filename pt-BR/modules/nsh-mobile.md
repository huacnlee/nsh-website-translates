---
title: "nsh/mobile"
description: "O que o iOS e o Android têm: TabBar, a barra de abas do sistema, InputAccessoryView no iOS, BackHandler no Android e isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---


# nsh/mobile

`nsh/mobile` reúne os recursos específicos de iOS e Android: a barra de abas do sistema, `TabBar`, em ambos; [`InputAccessoryView`](#inputaccessoryview), uma barra sobre o teclado, no iOS; e [`BackHandler`](#backhandler), o botão de voltar, no Android. O código Rust usa `nsh_core::mobile` e `nsh_core::prelude`; TSX importa `nsh/mobile`. O módulo pode ser importado em todas as plataformas, então um único bundle roda em qualquer lugar: nas outras plataformas seus componentes não ocupam espaço e suas chamadas retornam imediatamente, e `isAvailable` informa se você está no iOS ou no Android (`platform.os` de `nsh` informa qual). O que os desktops oferecem está em [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Escopo

Este módulo expõe recursos específicos de plataformas móveis, como a barra de abas do sistema para a navegação de nível superior do app. Os controles comuns pertencem a [`nsh/base`](./nsh-base.md): seu [Switch](../elements/switch.md), por exemplo, compartilha comportamento e API entre celulares, desktops e a web, com a trilha, o polegar e os estilos de estado fornecidos pelo app. `TabBar` atende à navegação de apps móveis; `Tabs` atende a conteúdo em abas em todas as plataformas. Só pertencem aqui os recursos com semântica de interação específica de dispositivos móveis. Uma aparência, um tamanho ou uma animação do sistema, por si sós, não mudam o papel compartilhado de um controle comum. Essa distinção orienta quais recursos pertencem aqui ([Objetivos e princípios de design](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` no iOS, no simulador de iOS, no Mac Catalyst e no Android; `false` nos demais. Rust:
`matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Uma barra de abas alterna entre as seções de nível superior de um app: registros e estatísticas, caixa de entrada e configurações. `TabBar` é a barra do próprio sistema, então tem a aparência e o comportamento dos apps do sistema: `UITabBar` no iOS e no iPadOS (Liquid Glass e sua seleção no iOS 26), a barra de navegação do Material 3 no Android, nas cores do sistema, no modo claro e no escuro. O app fornece as abas (`items`), informa qual está selecionada (`selectedIndex`), ouve a escolha do usuário (`onChange`), posiciona a barra com seu `class` e seu `style`, e exibe por conta própria o conteúdo da seção selecionada. Para abas dentro de uma página, e em todas as plataformas, use o [Tabs](../elements/tabs.md) de `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` vem de `nsh/mobile`, `nsh_core::mobile` em Rust. A seleção pertence ao app: um toque informa `onChange` com o índice da aba (`{ index }`), a barra mostra a escolha imediatamente, como a do sistema, e o app exibe essa seção e devolve o índice como `selectedIndex`. Sua altura é a do sistema onde o estilo a deixa em aberto.
Em Rust, `tab_bar()` cria uma barra, com um setter por prop (`.items(..)`, `.selected_index(..)`), um listener por evento
(`.on_change(..)`) e os métodos de estilo tipados; `TabBarItem::new(title).icon(name)` cria uma aba.

### Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | As abas, em ordem. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | A aba selecionada, por índice; um índice além das abas não seleciona nenhuma. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: oculta a barra sem transição. O app é dono desse valor entre pushes e pops. A barra é exibida quando esta prop e a solicitação `hidesBottomBarWhenPushed` da pilha visível são ambas false. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | Onde fica a barra: sua posição e seu tamanho. Sua aparência é a do sistema, com a aba selecionada no `primary` do tema. |
| `testID` | `.test_id(..)` | `string` | nenhum | Localiza a barra em testes e em `nsh test --trace`. |

#### TabBarItem

| Campo | Rust | Tipo | Descrição |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | O título da aba, lido pelos leitores de tela. |
| `icon` | `.icon(name)` | `string` | O ícone da aba, pelo nome que a plataforma lhe dá: um [SF Symbol](https://developer.apple.com/sf-symbols/) no iOS (`"house"`), um drawable do app no Android (`res/drawable/home.xml` é `"home"`, `"android:ic_menu_search"` é o do sistema). `platform.select` escolhe um por plataforma. |

<a id="events"></a>

### Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | O usuário escolheu uma aba: `{ index }`, seu índice. A barra mostra a escolha imediatamente; o app exibe o conteúdo da aba e define `selectedIndex`. |

<a id="platform-notes"></a>

### Notas de plataforma

- **iOS e Mac Catalyst**: `UITabBar`, com a aparência do sistema para a versão do iOS: a barra flutuante Liquid Glass
  e sua seleção no iOS 26. Os ícones são SF Symbols. O `primary` do tema é o `tintColor` da barra, a cor da aba
  selecionada; as demais abas mantêm a cor do sistema.
- **Android**: a barra de navegação do Material 3, feita com as views da plataforma: um ícone em seu indicador ativo sobre cada
  rótulo, um ripple ao pressionar, as cores dinâmicas do sistema no Android 12 e posteriores e as cores de base do Material antes disso,
  no modo claro ou escuro conforme a aparência do app. Na parte inferior da janela, ela se estende sob a barra de navegação, mais alta
  pelo seu inset, como a do Material. Os ícones são drawables do app (tingidos pela barra). O ícone e o rótulo da aba selecionada
  usam o `primary` do tema, sobre um indicador ativo dessa cor com 12% de opacidade; as demais abas mantêm a cor do sistema.
- **Desktops (macOS, Windows, Linux, GPUI) e a web**: as seções são exibidas com [Tabs](../elements/tabs.md), na aparência
  do app. `TabBar` não ocupa espaço nessas plataformas, então um único layout serve a ambos, escolhido por `platform.os`
  ([API de dispositivo de `nsh`](./nsh.md#device)).

## InputAccessoryView

No iOS e no Mac Catalyst; no Android é uma view vazia e oculta.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Uma barra sobre o teclado (`inputAccessoryView` do UIKit), exibida enquanto um input cujo `ios={{ inputAccessoryViewID }}` corresponde ao seu `nativeID` tem foco. Rust: `input_accessory_view(native_id)`, exibido para os inputs cujo `.input_accessory(native_id)` corresponde. Ela tem a largura da janela e a altura do seu conteúdo, e se move com o teclado de forma nativa.

| Prop | Tipo | Rust | Descrição |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Os inputs com este `inputAccessoryViewID` exibem a barra. |
| `style` | `StyleProp<ViewStyle>` | métodos `Styled` (`.bg(…)`) | O estilo da barra (seu fundo, por exemplo). |
| `class` | `string` | | Classes do Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | O conteúdo da barra. |

Ela não renderiza nada no lugar da árvore onde é colocada, e não renderiza nada no Android, então você pode colocá-la ao lado do input a que pertence.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
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
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Veja também [Formulários e teclado](../docs/forms-and-keyboard.md).

## BackHandler

No Android; no iOS seus listeners são mantidos e nunca chamados, e `exitApp()` retorna imediatamente.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

O botão de voltar e o gesto de voltar do sistema. Os diálogos tratam o voltar primeiro (um diálogo se fecha); depois os listeners de `BackHandler` são executados, o adicionado mais recentemente primeiro; quando nenhum deles trata o evento, a pilha de navegação do topo faz pop e, sem página para a qual voltar, o app é encerrado.

| Membro | Rust | Descrição |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` retorna `true` quando tratou o toque. Retorna uma função que para de escutar; um listener adicionado enquanto um componente renderiza (ou um efeito é executado) para junto com ele, tanto em Rust quanto em TSX. |
| `exitApp()` | o listener retorna `false` | Sai do app. Um listener Rust que retorna `false` deixa o toque seguir adiante, então a pilha volta ou o app é encerrado. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> O listener é executado depois que o sistema entregou o toque: a thread principal nunca espera pelo código do app. Enquanto houver pelo menos um listener registrado, o NSH assume os toques de voltar que os diálogos deixam passar, e ele mesmo volta na pilha do topo ou encerra o app quando nenhum listener retorna `true`.

A barra de status é definida pelo `statusBar` de [páginas e diálogos](./nsh-base.md#status-bar) a partir de `nsh/base`, tanto no iOS quanto no Android.
