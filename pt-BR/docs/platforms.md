---
title: "Visão geral das plataformas"
description: "Onde o NSH roda: iOS, Android, macOS, Windows, Linux, GPUI e a web, cada um com seu próprio backend; como executar, empacotar e incorporar um app Rust ou TSX em cada uma, e o que cada uma exige."
order: 10
group: platforms
source_hash: 122188df65c9a97c
---


# Visão geral das plataformas

O NSH roda em celulares, desktops e na web: iOS, Android, macOS, Windows, Linux, GPUI e páginas web. Cada um tem um backend próprio que desenha com a UI nativa da plataforma, então um app é feito de views UIKit em um iPhone, views AppKit em um Mac, widgets GTK 4 no Linux, elementos GPUI em um app GPUI e HTML em um navegador, com o texto, a entrada, a acessibilidade e o modo escuro da plataforma. Tudo acima do backend é compartilhado: o grafo reativo, o renderer, o layout Taffy, os componentes e os módulos nativos são o mesmo código Rust em todo lugar, então um app roda em todos eles. Um app escrito em Rust é esse código mais o seu crate, sem VM JavaScript; um app TSX executa seus módulos no QuickJS por cima dele ([Criando com Rust](./rust.md)).

Em todas as plataformas, um app é usado de duas formas: empacotado como um app instalável da plataforma (`nsh package`), ou embutido em um app nativo seu, seja o host vinculando uma raiz Rust ou carregando TSX em tempo de execução. Você o desenvolve com `nsh run` (edições em Rust recompilam e reiniciam o app, edições em TSX são hot updates).

<a id="at-a-glance"></a>

## Visão geral

| Plataforma | Backend; texto | Roda em | Desenvolvimento | Empacotamento |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit; CoreText | iOS 15.0+, dispositivos e o simulador | `nsh run --target ios` | `.app` (simulador), `.ipa` assinado |
| [Android](./android.md) | views do Android; `StaticLayout` | Android 9 (API 28)+, `arm64-v8a`, `armeabi-v7a` e `x86_64` | `nsh run --target android` | `.apk` assinado |
| [macOS](./macos.md) | AppKit e Core Animation; CoreText | macOS 14+ | `nsh run --target macos` | `.app` com assinatura ad hoc |
| [Windows](./windows.md) | janelas Win32 desenhadas com Direct2D; DirectWrite | Windows 10 1809+, Windows 11 | `nsh run` (o padrão no Windows) | um diretório e um `.zip` |
| [Linux](./linux.md) | widgets GTK 4; Pango | GTK 4.14+ | `nsh run` (o padrão no Linux) | um diretório e um `.tar.gz` |
| [GPUI](./gpui.md) | GPUI; sistema de texto do GPUI | macOS, Windows, Linux (Vulkan) | no seu app GPUI; TSX também com `nsh run --target gpui` | dentro do app GPUI que o embute |
| [Web](./web.md) | HTML e CSS; as fontes do navegador | navegadores modernos, desktop e celular | `nsh run --target web` | um site estático |

- **[GPUI](./gpui.md)** desenha apps com [GPUI](https://gpui-kit.com), o framework do projeto irmão GPUI Kit, em macOS, Windows e Linux igualmente: é o backend para embutir em apps GPUI e GPUI Kit, que colocam o `AppView` na sua própria árvore de elementos. Apps desktop independentes rodam e são empacotados com o backend de cada SO (AppKit, Win32, GTK 4).
- **[Web](./web.md)** renderiza apps como HTML em uma página de navegador: `nsh package --target web` publica um site estático para qualquer servidor web ou CDN, com o engine e o crate de um app Rust compilados para WebAssembly, e uma página sua embute um app com `createPlayer` ou um iframe. Também executa as demos ao vivo e o [playground](/playground) deste site.
- **Mac Catalyst** executa o backend de iOS em uma janela do tamanho de um iPhone (390×844) em um Mac, para desenvolvimento. Selecione-o com `--target catalyst` para ver como um app aparece em um celular.

<a id="develop-and-package"></a>

## Desenvolver e empacotar

`nsh run` escolhe a plataforma da própria máquina quando você não informa `--target`: AppKit no macOS, a janela GTK no Linux e a janela Win32 no Windows. Os celulares são alcançados a partir de um computador: iOS a partir de um Mac com Xcode, Android a partir de macOS, Linux ou Windows com o Android SDK ([Instalação](./installation.md#what-works-where)).

Um app Rust (cujo `nsh.json` nomeia o componente `"root"`) roda e é empacotado a partir do seu diretório: `nsh` compila o runner próprio do app para o alvo, com o seu crate e sem QuickJS. Um app TSX informa a sua entrada:

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

Cada SO desktop empacota apps com o seu próprio backend, compilado para a máquina em que roda: empacote um app Mac em um Mac, um app Windows no Windows e um app Linux no Linux. [Empacotamento](./packaging.md) cobre a saída, a assinatura e os ícones de cada alvo.

<a id="embed-in-a-native-app"></a>

## Embutir em um app nativo

| Plataforma | View host | Executa | Distribuído como | Linguagem do host |
|---|---|---|---|---|
| macOS | `AppView` (um `NSView`) | uma raiz Rust, bundles TSX | o crate `nsh-platform-macos` | Rust |
| Windows | `AppView` (uma janela filha) | uma raiz Rust, bundles TSX | o crate `nsh-platform-windows` | Rust |
| Linux | `AppView` (um widget GTK) | uma raiz Rust, bundles TSX | o crate `nsh-platform-linux` | Rust |
| GPUI (macOS, Windows, Linux) | `AppView` (uma view GPUI) | uma raiz Rust, bundles TSX, pacotes assinados | o crate `nsh-platform-gpui` | Rust |
| iOS | `AppView` (um `UIView`) | uma raiz Rust, bundles TSX | o crate `nsh-platform-ios` | Rust |
| iOS | `NshAppView` (um `UIView`) | bundles TSX, pacotes assinados | `NativeShell.xcframework` | Swift |
| Android | `NshView` (um `FrameLayout`) | bundles TSX, pacotes assinados | `nsh.aar` | Java ou Kotlin |
| Web | `createPlayer` (um elemento da página) ou um iframe | bundles TSX; um app Rust como o seu site publicado | os arquivos de runtime de `nsh package --target web` | JavaScript ou HTML |

Um host Rust monta uma raiz Rust (`Root::of::<App>()`) como `AppSource::Rust` ou `App::Rust`, e fornece aos seus engines os conjuntos de UI do app com `set_ui_sets`, de modo que o TSX que ele carrega importa os componentes e módulos do próprio app. Cada view é um engine, e um app pode exibir várias. O host registra suas próprias views nativas para os apps usarem em todas as plataformas ([Componentes nativos](./native-components.md)).

> [!NOTE]
> Hosts Rust embutem o NSH com os crates de plataforma do repositório do NSH; o `AppView` do macOS, Windows e Linux carrega bundles dos arquivos do próprio app (ou do código-fonte), com os limites padrão. O crate GPUI e os SDKs de iOS e Android também carregam [pacotes assinados](./signed-packages.md) e definem limites e capacidades por view ([Sandbox e capacidades](./sandbox-and-capabilities.md)).

<a id="writing-for-every-platform"></a>

## Escrevendo para todas as plataformas

A maior parte de um app não precisa de verificações de plataforma: elementos, estilos, layout e módulos se comportam da mesma forma em todo lugar. Onde as plataformas diferem, o NSH dá à diferença um único lugar ([Código específico de plataforma](./platform-specific.md)):

- **O ambiente diz onde o app roda**: em Rust `os()`, `idiom()` e `is_desktop()` (`nsh_core::prelude`), em TSX `platform.os`, `platform.idiom`, `platform.desktop` e `platform.select` de `nsh`. O SO é iOS, Android, macOS, Windows, Linux ou a web.
- **Props exclusivas de plataforma** vão em `ios={{…}}`, `android={{…}}`, `web={{…}}` ou `desktop={{…}}` em TSX (`desktop`: macOS, Windows, Linux e navegadores desktop).
- **A entrada segue a plataforma.** Celulares recebem toques e o teclado virtual; desktops recebem o mouse, o trackpad e o teclado.

Os componentes de um app são desenhados com as primitivas do NSH, então rodam em desktops tanto quanto em celulares, com a mesma aparência em ambos. Um layout desktop é construído a partir das primitivas (`view`, `text`, `scroll`, `virtual_list`, …; `View`, `Text`, `Scroll`, `List`, … em TSX) e de uma verificação de desktop, como é o layout desktop da galeria:

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

Cada backend lista o que faz à sua própria maneira: [macOS](./macos.md#what-differs-on-macos), [Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux), [GPUI](./gpui.md#differences).

<a id="see-also"></a>

## Veja também

- [Primeiros passos](./getting-started.md): um primeiro app, executado em cada plataforma.
- [Criando com Rust](./rust.md): apps escritos em Rust, e Rust com TSX.
- [Instalação](./installation.md): as ferramentas de que cada plataforma precisa.
- [Arquitetura](./architecture.md): o que é compartilhado e o que cada backend faz.
