---
title: "Primeiros passos"
description: "Crie um app em Rust ou TSX com nsh init, execute-o no iOS, Android, macOS, Windows, Linux ou na web, hospede módulos TSX no seu app e distribua-os como pacotes assinados, ou empacote o app de forma independente."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---


# Primeiros passos

Este guia cria um app NSH, o executa nas plataformas que você escolher como alvo e o publica. Apps NSH são escritos em Rust ou TSX, sobre o mesmo engine: Rust compila seu app para código nativo, sem VM de JavaScript, e TSX roda no QuickJS com hot updates, como módulos que um app nativo pode carregar em tempo de execução. O guia segue primeiro um app em Rust e depois o mesmo app em TSX.
Ele pressupõe que `nsh` esteja instalado e no seu `PATH` ([Instalação](./installation.md)); em um checkout, use
`./target/debug/nsh` no lugar.

> [!TIP]
> Não tem um projeto de app em mãos? As duas primeiras seções não precisam de nenhum: `nsh run` mostra o app em uma janela no seu computador, no simulador de iOS, em um dispositivo Android ou no navegador. Você pode parar por aí, ou [empacotá-lo como um app independente](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## Criar um app

Em um terminal, `nsh init` pergunta em que o app é escrito: `rust`, `ts` ou `mixed` (TSX com um crate Rust próprio).
`--template` escolhe sem perguntar.

<a id="in-rust"></a>

### Em Rust

```sh
nsh init my-app --template rust
```

`nsh init` cria o diretório e escreve um projeto Cargo:

| Arquivo | O que é |
|---|---|
| `src/lib.rs` | O app: seu componente raiz, estado e handlers |
| `src/main.rs` | Monta a mesma raiz no macOS, Windows ou Linux para `cargo run` |
| `Cargo.toml` | O crate, que depende de `nsh-core` e `nsh-base` na versão da CLI |
| `nsh.json` | O nome, o id, a versão e o número de build do app, seu crate (`"rust": "."`) e o componente raiz (`"root": "App"`) ([Estrutura do projeto](./project-structure.md#nshjson)) |
| `App.test.tsx` | O teste da raiz, em TypeScript (`nsh test`), com `tsconfig.json` e `.nsh/types` para o seu editor |
| `README.md` | Como executar, testar e empacotar o app, e como adicionar uma entrada TSX depois |
| `.gitignore` | Ignora `.nsh/` e `target/` |

O desenvolvimento em Rust exige uma toolchain Rust ([rustup](https://rustup.rs)); os comandos `nsh` compilam os runners do app a partir dos crates do NSH no crates.io, na versão da CLI.

<a id="in-tsx"></a>

### Em TSX

```sh
nsh init my-app --template ts
```

Um app TSX é composto por um ou mais arquivos `.tsx` com uma entrada: o que `nsh run` executa e o que um app host carrega como módulo.

| Arquivo | O que é |
|---|---|
| `App.tsx` | O módulo de entrada: renderiza o app com `mount` |
| `App.test.tsx` | Seu teste (`nsh test`) |
| `nsh.json` | O nome, o id, a versão e o número de build do app ([Estrutura do projeto](./project-structure.md#nshjson)) |
| `tsconfig.json` | Estende `.nsh/tsconfig.json`, as configurações de TypeScript do NSH, que resolvem `nsh` para as declarações em `.nsh/types` |
| `.gitignore` | Ignora `.nsh/` e `target/` |
| `.nsh/types/` | Declarações geradas de todos os módulos do NSH, para o seu editor |

Arquivos que já existem são mantidos, então você pode executá-lo em um diretório que já tenha alguns deles; um app Rust é criado em um novo diretório.

Em ambos, o nome de exibição usa por padrão o nome do diretório; passe `--name "My App"` para escolher outro. O id vira
`com.example.<name>`: altere-o em `nsh.json` antes de publicar. `nsh init my-app --template mixed` cria um app TSX
que também é um crate Rust (`Cargo.toml` e `src/lib.rs` ao lado de `App.tsx`), cujo componente, módulo e classe
`App.tsx` importa ([Building with Rust](./rust.md)).

<a id="the-root-component"></a>

### O componente raiz

Os dois templates geram o mesmo app, um contador:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Em Rust:

- **`use nsh_core::prelude::*`** traz as primitivas (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...),
  [signals](./reactivity.md) e os métodos de estilo tipados (`.p_safe_area()` aplica padding a uma view conforme a [área segura](../elements/safe-area.md)); **`nsh_base`** traz os componentes base sem estilo
  (`button()`, o teclado, diálogos) e `theme()`, as cores e
  os raios que os componentes do app usam para desenhar ([Tema](./rust.md#theme)).
- **`#[component] pub fn App()`** é um componente: uma função que roda **uma vez** e retorna seus elementos.
  O `"root": "App"` de `nsh.json` dá nome a ele, e `nsh run` o monta. `signal(0_u32)` cria um valor que muda ao longo do tempo.
- **`text(move || format!(…, count.get()))`** vincula o texto ao signal: quando `count` muda, o NSH executa esta
  closure novamente e atualiza apenas este texto, nada mais. Estilos recebem closures da mesma forma:
  `.bg(move || theme().primary)` acompanha o tema no modo escuro.
- **`.on_press(..)`** faz a view responder a toques; `.active(|s| s.opacity(0.6))` é o estilo dela enquanto pressionada, aplicado
  nativamente. O botão é do próprio app: o NSH fornece as primitivas e as capacidades, e o app desenha sua UI
  a partir delas.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** são métodos de estilo tipados, nomeados como os utilitários do Tailwind, em
  pontos (`px`). O layout é flexbox, e os filhos são empilhados em coluna por padrão ([Layout](./layout.md)).
- **`#[native_module("my-app/native")]`** nomeia o que uma entrada TSX pode importar do crate, para quando você adicionar telas TSX
  por cima ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)).

Em TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` é o módulo central: signals, `mount`, as outras
  primitivas reativas e os elementos host. Ele é servido pelo runtime nativo, não empacotado no bundle. **`nsh/base`** traz os
  componentes base, como `nsh_base` faz em Rust.
- **`function App()`** é um componente que roda **uma vez**. **`{count()}`** lê o signal dentro do JSX: o compilador
  vê uma chamada e faz este texto acompanhar o signal.
- **`<View onPress>`** é uma view nativa que reage a toques; as classes `active:` são o estilo dela enquanto pressionada. `View`,
  `Text`, `Image`, `Scroll` e os demais [elementos host](../elements/index.md) são importados de `nsh` (`Input` de `nsh/base`); apenas
  `If` e `Each` não precisam de import.
- **`class`** recebe classes do [Tailwind](./tailwind.md); `style={{ … }}` recebe um objeto com propriedades de estilo em camelCase,
  com números em pontos. `bg-background`, `bg-primary`, `text-primary-foreground` e
  `rounded-(--radius)` nomeiam os tokens do tema do app ([Tokens de tema](./tailwind.md#theme-tokens)): eles acompanham
  o modo escuro por conta própria, e `"theme"` em `nsh.json` os reestiliza.
- **`mount(App)`** renderiza o componente na superfície do app.

> [!IMPORTANT]
> O texto aparece em um elemento de texto: `text(..)` em Rust, `<Text>` em TSX. Em TSX, texto escrito diretamente em um `<View>`
> (`<View>Hello</View>`) é um erro de build que aponta para ele, e uma string que uma expressão coloca ali
> (`<View>{name}</View>`) é registrada no log.

<a id="develop-it"></a>

## Desenvolva

<a id="run-it"></a>

### Execute

`nsh run` compila o app, o inicia e recompila enquanto você edita; os logs do app aparecem no terminal. Passe a ele o diretório do app: ele executa a raiz de um app Rust, ou o `App.tsx` de um app TSX (`nsh run my-app/App.tsx` indica outra entrada).

Para um app Rust, `nsh run` compila o runner próprio do app para o alvo, com seu crate e a raiz montada e sem QuickJS, e o inicia; uma alteração no código Rust o compila de novo e reinicia o app. `cargo run` no diretório do app inicia a mesma raiz diretamente no backend desktop. Para um app TSX, `nsh run` inicia um servidor de desenvolvimento e um host de desenvolvimento que carrega o app a partir dele, e aplica patches no app em execução a cada salvamento.

Sem `--target`, `nsh run` usa a máquina em que você está: uma janela AppKit no macOS, uma janela Win32 no Windows e uma janela GTK no Linux. Escolha outra plataforma com `--target`:

| Alvo | Comando | Executa a partir de |
|---|---|---|
| Simulador de iOS | `nsh run my-app --target ios` | macOS com Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (o padrão) |
| Windows | `nsh run my-app` | Windows (o padrão) |
| Linux (GTK 4) | `nsh run my-app` | Linux (o padrão) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### Simulador de iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` usa um simulador já iniciado, ou inicia o iPhone mais recente se nenhum estiver em execução, e instala o app nele (o runner de um app Rust, ou o host de desenvolvimento). `--device` escolhe um simulador pelo nome ou pelo UDID.

#### Android

```sh
nsh run my-app --target android
```

Inicie um emulador ou conecte um dispositivo primeiro (`adb devices` os lista; o NSH usa o primeiro). `nsh` instala o app
nele: o `libnsh.so` próprio de um app Rust, ou um APK de host de desenvolvimento (recompilado apenas quando o runtime muda) cuja porta do servidor de desenvolvimento
é encaminhada ao dispositivo com `adb reverse`, de modo que funciona por USB sem uma rede compartilhada.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

O app abre como um app de desktop para Mac (AppKit, em uma janela redimensionável), com entrada de mouse, trackpad e teclado em vez de
toques. Exige macOS 14 ou posterior; veja [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (padrão no Windows)

```sh
nsh run my-app
```

O app abre em uma janela de desktop (1200×800 pontos), com entrada de mouse, touchpad, toque e teclado. Exige Windows
10 1809 ou posterior; veja [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (padrão no Linux)

```sh
nsh run my-app
```

O app abre em uma janela GTK (390×844 pontos). Exige GTK 4.14 ou posterior; veja [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` imprime o endereço da página; abra-o em um navegador. Um app Rust roda como WebAssembly com seu crate, e a página aberta
carrega a nova build sozinha após uma alteração; veja [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

O app abre em uma janela do tamanho de um iPhone (390×844 pontos) no seu Mac. Esta é a forma mais rápida de ver um app como um celular o mostra:
sem simulador para iniciar. Ele usa UIKit como o iOS, então o que você vê é o que um iPhone mostra, exceto por comportamentos específicos do Mac,
como a rolagem com a roda do mouse. Para o app Mac em si, use `--target macos`.

<a id="edit-it"></a>

### Edite

Deixe `nsh run` em execução e altere o rótulo do botão:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Salve. Um app Rust é compilado de novo e reinicia com o novo rótulo; a contagem recomeça. Um app TSX recebe um hot update:
a CLI recompila e envia um patch, e o host executa novamente o módulo alterado e renderiza de novo apenas os componentes
cujo código mudou. Aqui isso é `App`, que é dono do signal `count`, então a contagem também recomeça.

Trechos de UI viram componentes próprios, ou funções simples que retornam elementos:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

Em TSX, o estado sobrevive quando você edita um componente que não é dono dele: toque algumas vezes e depois altere a cor de `TapButton`
, e o botão é atualizado enquanto a contagem permanece. A substituição a quente funciona por componente de nível superior: uma função com
nome em maiúscula cujo corpo contém JSX. Um componente é renderizado de novo quando seu próprio código muda, ou quando o
código do módulo fora dos componentes muda (uma constante que ele usa, um helper). Se uma edição não puder ser aplicada no lugar (por exemplo, ela
importa um módulo do NSH que o app em execução ainda não importou, ou altera as capacidades de `nsh.json`), o host recarrega o
app inteiro.

<a id="errors"></a>

#### Erros

Um erro de compilação em Rust é impresso no terminal com a saída do cargo, e `nsh run` compila de novo no próximo salvamento. Um
erro de build em TSX é impresso no terminal e exibido no dispositivo como uma sobreposição vermelha com o arquivo, a linha e a
coluna; o app continua executando a última build boa. A sobreposição desaparece na próxima build bem-sucedida (toque nela para
dispensá-la antes). Uma exceção lançada em tempo de execução é exibida da mesma forma, com a stack mapeada de volta para o seu código-fonte `.tsx`.

<a id="host-it-in-your-app"></a>

## Hospede no seu app

Um app nativo exibe o NSH em uma view própria: `NshAppView` (uma `UIView`) no iOS, `NshView` (uma `View` do Android) no
Android, `AppView` no macOS, Windows, Linux e em apps GPUI. Posicione-a como qualquer outra view, em qualquer tela, quantas
vezes precisar.

Uma raiz Rust faz parte da build do app: o app linka seu crate e monta a raiz com `AppSource::Rust` no
`AppView` de macOS, Windows, Linux, GPUI e iOS ([Building with Rust](./rust.md#an-app-written-in-rust)). Um app TSX é
um módulo que a view carrega: durante o desenvolvimento, a partir do servidor de desenvolvimento; em release, a partir de um bundle compilado ou de um pacote
assinado baixado. As seções abaixo carregam módulos TSX.

### iOS

Linke `NativeShellDev.xcframework` em Debug e `NativeShell.xcframework` em Release ([Incorporação em apps iOS](./ios.md)), depois:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` serve o módulo ao app e envia cada salvamento, como `nsh run` faz com seu próprio host. Para a
build de release, `nsh build my-app --release --out MyApp/nsh` grava o bundle em uma pasta que você adiciona aos
recursos do app.

### Android

Adicione `nsh-dev.aar` para builds de debug e `nsh.aar` para builds de release ([Incorporação em apps Android](./android.md)), depois:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows e Linux

Apps desktop escritos em Rust incorporam o NSH com `AppView`, a partir dos crates `nsh-platform-macos`, `nsh-platform-windows`,
`nsh-platform-linux` e `nsh-platform-gpui`: uma `NSView`, uma janela filha, um widget GTK ou uma view GPUI que
monta uma raiz Rust ou carrega um bundle compilado. Veja [macOS](./macos.md#embedding-in-a-mac-app),
[Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) e [GPUI](./gpui.md),
e [Plataformas](./platforms.md#embed-in-a-native-app) para todos os hosts lado a lado.

<a id="what-the-module-may-do"></a>

### O que o módulo pode fazer

No iOS e no Android, o host decide antes do carregamento o que um módulo pode fazer: `grantCapabilities` define os hosts de rede
e outras capacidades que ele pode acessar, e limites restringem sua memória, tempo de chamada e quantidade de nós ([Sandbox e
capacidades](./sandbox-and-capabilities.md)). Para oferecer aos módulos suas próprias views nativas (um mapa, um gráfico, um componente
de design system), registre-as como [componentes nativos](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Distribua atualizações como pacotes assinados

Um módulo TSX que o app baixa após o lançamento vem como um pacote assinado. Crie uma chave raiz uma única vez e mantenha-a offline,
certifique uma chave de release com ela e publique:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

O app confia na chave pública da raiz e carrega o que baixa; o NSH verifica a assinatura, o certificado e a
lista de revogação antes de executar qualquer coisa:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

O Android tem o mesmo fluxo com `NshTrust` e `NshPackage`. Hospedagem, entrega e revogação em detalhe: [Pacotes
assinados](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## Ou distribua como um app standalone

`nsh package` gera um app instalável, em Rust ou TSX, sem nenhum projeto Xcode ou build Gradle próprio:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Um app Rust é empacotado com seu próprio runner, construído a partir do seu crate e dos crates do NSH, com a raiz montada; um app TSX, com o runtime pré-compilado. Opções, assinatura e ícones: [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Experimente no terminal

`nsh test` executa um app em modo headless, sem dispositivo nem janela. Dado o `nsh.json` de um app Rust ou a entrada de um app TSX, ele abre o app, deixa-o rodar e imprime o que ele monta; com `--trace`, imprime também as operações de view nativas e o tempo de cada commit ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

Dado um diretório, ele executa os testes do app: o `App.test.tsx` de cada template abre o app, pressiona seu botão e verifica o que ele exibe (`nsh test my-app`). Um app Rust abre sua raiz (`open(".")`); ele também pode ser testado em `cargo test` com `nsh_testing::Headless` ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Próximos passos

- [Building with Rust](./rust.md): apps Rust, seu tema e TSX sobre um crate Rust.
- [JSX and components](./jsx-and-components.md) e [Reactivity](./reactivity.md): componentes e signals, em Rust e TSX.
- [Platforms](./platforms.md): o que cada plataforma suporta e sua própria página ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) e [Sandbox and capabilities](./sandbox-and-capabilities.md): entrega e o que os módulos podem fazer.
- [Project structure](./project-structure.md): o que vai em `nsh.json`, assets, arquivos.
