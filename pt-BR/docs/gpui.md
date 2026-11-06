---
title: "GPUI"
description: "Incorpore apps NSH em Rust e TSX em um app GPUI ou GPUI Kit com AppView, renderizados pelo GPUI no macOS, no Windows e no Linux, experimente apps TSX no host de desenvolvimento do GPUI e veja o que o backend GPUI faz de diferente."
order: 15.5
group: platforms
source_hash: 1f281d4fc1a89362
---


# GPUI

O backend GPUI desenha apps NSH com o [GPUI](https://gpui-kit.com) (GPUI Fast), o framework de UI acelerado por GPU no qual o GPUI Kit é construído, em macOS, Windows e Linux. É o backend para incorporar em apps GPUI e GPUI Kit: um `AppView` é uma view GPUI, então um app GPUI ou GPUI Kit exibe apps NSH, seja uma raiz Rust própria ou TSX que ele carrega, em qualquer ponto de sua própria árvore de elementos. Apps standalone são executados e empacotados com o backend próprio de cada desktop: [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) e [Linux](./linux.md) (GTK). O core, o grafo reativo, o renderer, o layout Taffy e os módulos nativos são os mesmos de todas as outras plataformas, então um app roda em qualquer lugar. `os()` (`platform.os` em TSX) é o SO em que ele está rodando (macOS, Windows ou Linux) e as props `desktop={{…}}` do TSX se aplicam.

Todo elemento e módulo dos backends [macOS](./macos.md) (AppKit), [Windows](./windows.md) (Win32) e [Linux](./linux.md) (GTK) está presente; onde o GPUI desenha algo à sua maneira, [Diferenças](#differences) explica como.

<a id="how-it-works"></a>

## Como funciona

- **Um elemento por superfície.** Uma superfície é um elemento GPUI que preenche o espaço dado pelo seu pai e pinta toda a árvore de views com as primitivas do GPUI: quads, sombras, paths, glifos e imagens. O NSH mantém uma view retida por nó, como no Windows, e só redesenha quando um commit mudou algo.
- **O texto é moldado na thread do engine** com o sistema de texto do GPUI (as fontes do próprio app) e quebrado em linhas pelo NSH; a thread principal apenas pinta os glifos.
- **Um salto por commit.** O engine roda em sua própria thread; cada commit é um closure enviado à thread principal do GPUI, que notifica a view.
- **A entrada** vem dos eventos de mouse, rolagem, teclado e input method do GPUI; hit testing, pressionamentos, o sistema de responders, rolagem e edição de texto usam a mesma lógica do backend Windows.

<a id="requirements"></a>

## Requisitos

- macOS, Windows ou Linux, com uma GPU com a qual o GPUI consiga desenhar (Metal no macOS, DirectX no Windows, Vulkan no Linux).
- No macOS, compilar seu app GPUI ou o runtime a partir de um checkout usa o Metal Toolchain do Xcode (`xcodebuild -downloadComponent
  MetalToolchain`), which compiles GPUI's shaders ahead of time. On a Mac without it, `nsh run` compila
  o runtime com o recurso `runtime-shaders` do GPUI e avisa isso: os shaders são compilados quando o app inicia (uma fração
  de segundo na primeira vez, depois em cache pelo macOS).
- No Linux: um driver Vulkan, Wayland ou X11 com `libxkbcommon`, GTK 3 e WebKitGTK 4.1 (web views) e GStreamer
  1.20 ou posterior com seus plug-ins base e good (vídeos). Web views precisam do X11: em um desktop Wayland, execute o app sob
  Xwayland (`WAYLAND_DISPLAY=` vazio), caso contrário elas exibem um placeholder. Compilar o runtime a partir de um checkout também exige
  os pacotes de desenvolvimento; no Debian e no Ubuntu:

  ```sh
  sudo apt-get install clang libclang-dev pkg-config libfontconfig-dev libfreetype-dev libwayland-dev libx11-xcb-dev \
    libxcb1-dev libxkbcommon-dev libxkbcommon-x11-dev libzstd-dev libvulkan1 libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-good
  ```

<a id="running-an-app"></a>

## Executando um app

Um app Rust roda dentro do seu app GPUI: incorpore sua raiz com `AppView` ([Incorporando em um app GPUI](#embedding-in-a-gpui-app))
e `cargo run` o app GPUI; seu crate e o app são um único build do Cargo. Isoladamente, um app Rust roda no backend próprio deste SO
(`nsh run --target macos`, `windows` ou `linux`).

Um app TSX roda no host de desenvolvimento GPUI:

```sh
nsh run App.tsx --target gpui
```

Ele abre o app em uma janela GPUI (1200×800 por padrão), como um app GPUI que o incorpora o exibe, com hot reload, logs no
terminal e o overlay de erros, como nos outros targets. O host de desenvolvimento (`nsh-gpui-host`) roda no próprio local em
todos os SOs, sem um app bundle ao redor. Em um checkout, `nsh run` o compila primeiro; a distribuição o inclui em `runtime/gpui/`. O host também executa um
bundle compilado por conta própria:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/gpui/nsh-gpui-host --bundle build/bundle.nshc --window-size 390x844   # in a checkout: target/debug/nsh-gpui-host
```

`--window-size` é o tamanho da janela em pontos (`<width>x<height>`).

<a id="packaging"></a>

## Empacotamento

Um app GPUI distribui o NSH dentro do seu próprio executável: ele incorpora a raiz Rust ou o bundle TSX do app com `AppView` ([Incorporando em um app
GPUI](#embedding-in-a-gpui-app)) e é compilado e distribuído como o app GPUI que é. Um app NSH standalone é empacotado
com o target próprio do SO: [`--target macos`](./macos.md#packaging), [`--target windows`](./windows.md#packaging) ou
[`--target linux`](./linux.md#packaging) ([Empacotamento](./packaging.md)).

No Linux, um app GPUI com web views e vídeos faz link dinâmico com WebKitGTK 4.1 e GStreamer, então as máquinas em que ele roda
precisam tê-los instalados, junto com GTK 3 e os plug-ins base e good do GStreamer (Debian / Ubuntu: `libwebkit2gtk-4.1-0`,
`libgstreamer1.0-0`, `libgstreamer-plugins-base1.0-0`, `gstreamer1.0-plugins-good`), além de um driver Vulkan e
`libxkbcommon`.

<a id="embedding-in-a-gpui-app"></a>

## Incorporando em um app GPUI

O crate `nsh-platform-gpui` (do repositório do NSH) oferece a um app GPUI em Rust o `AppView`: um engine NSH como uma view GPUI
(`Entity<AppView>`), que preenche o espaço dado pelo seu elemento pai. Cada `AppView` é independente; vários
podem rodar ao mesmo tempo. Ele executa uma raiz Rust, o componente raiz do seu crate:

```rust
use gpui::{AppContext, WindowOptions};
use nsh_platform_gpui::{set_ui_sets, App, AppOptions, AppView, Root};

// Once, before the first view: the UI sets the apps import (NSH's and your crate's).
set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
gpui_platform::application().run(|cx| {
    cx.open_window(WindowOptions::default(), |window, cx| {
        cx.new(|cx| {
            let view = AppView::new(AppOptions::default(), window, cx);
            view.load(App::Rust(Root::of::<my_app::App>()));
            view
        })
    })
    .unwrap();
});
```

`Root::tokens` dá à raiz o seu [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`,
`Theme` é reexportado aqui) e `Root::app_id` o id sob o qual seus dados são mantidos. Um bundle TSX que `nsh build` escreveu
é carregado na mesma view:

```rust
use nsh_platform_gpui::{App, Bundle};

let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(App::Js(Bundle::source(code)));
```

Coloque a entity em sua árvore de elementos como qualquer outra view (um `Root` do GPUI Kit, um painel, um dock). `AppView::load`
substitui o que estava rodando; `stop` (ou descartar a view) encerra o app. `AppOptions::asset_base` informa onde as URIs `asset:/`
são resolvidas (`AssetBase::Directory` ou `AssetBase::Http`). Bundles de bytecode (`bundle.nshc`) são carregados com
`unsafe { Bundle::bytecode(bytes) }` (ou `Bundle::read_trusted(path)`, também unsafe): o bytecode QuickJS é entrada confiável,
então só o carregue a partir dos arquivos do seu próprio app.

- `open_app_window(source, options, cx)` abre uma janela com um `AppView` em um app GPUI em execução.
- `run_app(source, options)` inicia o GPUI e executa um app em uma janela até ela ser fechada (o que o host de desenvolvimento faz).
- `AppView::register_component(name, factory)` registra um componente nativo seu antes do carregamento
  ([Componentes nativos](./native-components.md)).
- `AppOptions::cache` (ou `AppView::set_cache`, para os apps carregados em seguida) define onde os apps mantêm seus caches, as
  [imagens que baixam](./images-and-assets.md#kept-on-disk), e quanto cada um mantém: `CacheOptions { location,
  images }`, `CacheLocation::System` (the default), `Dir(path)` or `Off`, `CachePolicy::Default` (256 MiB),
  `MaxSize(ByteSize::mib(n))` ou `Off`.
- `AppView::host()` é o canal da view com os apps que ela executa ([`host`](../modules/nsh.md#host)), um
  `HostChannel` que qualquer thread pode usar: `set_params(map)` antes do carregamento dá ao app seus parâmetros de inicialização
  (`host.params`), `send(name, data)` envia um evento (`host.on`), e `handle(name, |call| …)` responde ao seu
  `host.call(name, data)` e ouve o seu `host.post` (`call.resolve(json)`, `call.reject(message)`, imediatamente ou depois
  a partir de qualquer thread). Os handlers rodam na thread do engine: repasse a chamada às suas entities GPUI (um canal que uma
  task `cx.spawn` lê) e responda a partir de lá. Os `AppView`s de macOS, Windows e Linux têm o mesmo `host()`.
  Seu `handle_open_url(|request| …)` vê as URLs que o app abre ([`openUrl`](../modules/nsh.md#openurl))
  antes do sistema: `request.handled()` quando seu app roteou a URL por conta própria, `request.decline()` (ou descartar
  a requisição) para que o sistema a abra com o `open_url` do GPUI.
- `AppOptions::limits` (ou `AppView::set_limits`, para os apps carregados em seguida) define os limites da VM: o heap JS, a
  pilha, os orçamentos de tempo e a cota de nós ([Sandbox e capabilities](./sandbox-and-capabilities.md)). Apps incorporados recebem `Limits::default()` (um
  heap de 256 MB); o host de desenvolvimento executa os apps por conta própria, com `Limits::standalone()`.
- `AppOptions::transparent` torna a view translúcida: ela não desenha fundo de janela, e `open_app_window` /
  `run_app` abrem uma janela transparente, de modo que o que o app deixa sem pintar mostra o que está atrás da janela (widgets
  de desktop, overlays). False por padrão.
- `AppView::connect_dev_server(url, cx)` (feature `dev`) carrega o app de `nsh dev` e o recarrega conforme você edita,
  com o overlay de erros sobre a view; `AppView::on_error` continua ouvindo os erros do app.
- `AppView::on_app_error(|error| …)` ouve os erros do app: `error.kind` (o app falhou ao carregar, uma exceção
  não capturada, a VM parou), `error.is_fatal()` quando nenhum JS do app volta a rodar, `error.message`, `error.stack`
  e `error.package` (o id e o build do pacote assinado de onde ele veio). `AppView::on_error` recebe os mesmos
  erros como texto.
- `AppView::set_locale(locale, cx)` e `AppView::set_font_scale(scale, cx)` dão ao app o idioma e o
  tamanho de texto do seu app no lugar dos do sistema (`None` volta a seguir o sistema): `locale()`, `Intl`, `fontScale()` e o texto
  acompanham imediatamente ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).
- `AppView::run_package(&package)` executa um [pacote assinado](./signed-packages.md#loading-packages-in-a-host-app)
  de `verify_package` ou `load_package`; `accept_package` o registra assim que seu app decide que ele está saudável.
- `set_ui_sets(sets)` define os conjuntos de UI que todo engine serve: os do NSH (`nsh_base::registry()`) e os dos seus crates
  (`my_app::registry()`, que `#[native_module]` gera; [Building with Rust](./rust.md)), e fornece os conjuntos do seu próprio app: um app acessa as funções e classes de um conjunto pelo nome com
  [`nativeModule`](../modules/nsh.md#nativemodule) e é construído com o `nsh build` padrão. O `examples/embed-gpui` do repositório mantém uma mesa de negociação no host dessa forma, que dois tickets de ordem incorporados e os widgets
  do próprio host compartilham.

<a id="differences"></a>

## Diferenças

O que é desenhado ou se comporta de forma diferente dos backends desktop nativos:

- **Transformações**: views rotacionadas, inclinadas e projetadas giram seus fundos, bordas e sombras, mas o texto permanece
  na vertical, e imagens, vídeos e canvases são desenhados em seus limites.
- **Opacidade** se aplica a cada cor em vez de a um grupo, então filhos sobrepostos de uma view translúcida
  se mostram através uns dos outros; a opacidade de uma imagem (um fade-in, uma view translúcida) muda em dezesseis avos.
- **Clips arredondados** (`overflow: "hidden"` com um raio) arredondam os fundos e as imagens dos filhos, mas texto,
  bordas, vídeos e componentes nativos são cortados pelo retângulo.
- **Não desenhados**: `filter: blur()`, `backdropFilter` e `mixBlendMode`; as sombras aparecem através de preenchimentos translúcidos;
  `borderCurve: "continuous"` desenha cantos circulares.
- **O texto em canvas** é aproximado: na vertical sob rotações, reduzido em vez de estreitado para `maxWidth`,
  gradientes o pintam em uma única cor, preenchimentos `strokeText`, suas sombras não são desfocadas, e operações de composição e
  `clearRect` não se aplicam a ele.
- **Scroll views** não dão zoom (`zoomTo` e as props de zoom são ignoradas).
- **Vídeo** é reproduzido no Linux (GStreamer); no macOS e no Windows um vídeo exibe um placeholder e reporta `onError`.
- **Web views** são views nativas acima de tudo o que o NSH desenha em seu lugar. No Linux elas precisam do X11 (veja
  [Requisitos](#requirements)); onde as páginas ficam pretas sob Xwayland ("Failed to create GBM buffer" no log),
  execute o app com `WEBKIT_DISABLE_DMABUF_RENDERER=1`. No macOS e no Windows, ancestrais com clipping não as cortam e
  falhas de carregamento não reportam `onError`. `baseUrl`, `scrollable` e `allowsBackForwardNavigationGestures` não
  são suportados.
- **Acessibilidade** passa pelo AccessKit: leitores de tela podem ativar, focar, definir valores e rolar elementos até ficarem
  visíveis em todas as plataformas; ações personalizadas e a ação de menu de contexto ainda não são repassadas.

Para comparação, a lista própria de cada backend nativo: [macOS](./macos.md#what-differs-on-macos),
[Windows](./windows.md#what-differs-on-windows), [Linux](./linux.md#what-differs-on-linux).

<a id="see-also"></a>

## Veja também

- [Building with Rust](./rust.md): o crate cuja raiz um app GPUI incorpora
- [CLI](./cli.md): `nsh run --target gpui`
- [Empacotamento](./packaging.md): apps standalone, com o target próprio de cada SO
- [Visão geral das plataformas](./platforms.md)
