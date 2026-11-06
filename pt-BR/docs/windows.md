---
title: "Windows"
description: "Execute apps NSH em Rust e TSX no Windows, em janelas Win32 desenhadas com Direct2D, empacote-os, incorpore-os em um app Win32 com AppView e saiba o que muda no Windows."
order: 14
group: platforms
source_hash: d39f39f9d32017d0
---


# Windows

NSH apps também rodam no Windows. O backend do Windows os desenha em janelas Win32 com Direct2D e faz o layout de texto com DirectWrite; o núcleo, o grafo reativo, o renderizador, o layout Taffy e os módulos nativos são os mesmos do iOS e do Android, então um único app roda em qualquer lugar. No Windows, `os()` é `Os::Windows` (`platform.os` é `"windows"` em TSX) e as props `desktop={{…}}` do TSX se aplicam. O título da janela, uma barra de título própria do app, a barra de menus e os menus de contexto vêm de `nsh_core::element::desktop` em Rust ([Barras de título no desktop](./rust.md#desktop-title-bars)) e de [`nsh/desktop`](../modules/nsh-desktop.md) em TSX.

<a id="requirements"></a>

## Requisitos

- **Windows 10 1809** ou posterior, ou Windows 11.
- O **WebView2 Runtime** para web views. Ele já vem com o Windows 11 e com o Microsoft Edge no Windows 10; sem ele, um
  `WebView` exibe um placeholder.
- **Codecs do Media Foundation** para os formatos de vídeo que o seu app reproduz (os vídeos são reproduzidos pela própria pilha de mídia do Windows).
- Para compilar o runner de um app Rust: Visual Studio Build Tools com a carga de trabalho C++ e o Windows SDK. Para compilar o
  runtime do NSH para Windows (a partir de um checkout, ou `cargo xtask dist` no Windows), também é necessário o LLVM (para os bindings do QuickJS).

<a id="running-an-app"></a>

## Executando um app

No Windows, `nsh run` abre o app em uma janela. Um app Rust é executado a partir do seu diretório:

```sh
nsh run                        # --target windows is the default on Windows
```

`nsh` compila um runner de debug com o seu crate e abre o app, com seus logs (`log::info!` e os demais) no
terminal; uma alteração no código Rust do crate compila o runner novamente e reinicia o app. `cargo run` inicia o mesmo
root a partir do `src/main.rs` do crate, que `nsh init --template rust` grava: [`run_app`](#embedding-in-a-win32-app)
com `AppSource::Rust`.

Um app TSX informa o seu ponto de entrada e abre, por padrão, em uma janela de 1200×800, com hot reload, logs no terminal e o
overlay de erros, como nos outros alvos:

```sh
nsh run App.tsx
```

Em um checkout, `nsh run` compila primeiro o host de desenvolvimento (`nsh-windows-host.exe`); a distribuição gerada no Windows
o inclui em `runtime\windows\`. Ctrl-C fecha a janela, e fechar a janela encerra `nsh run`; o host nunca
sobrevive a `nsh`, independentemente de como ele termine. O host também executa um bundle compilado por conta própria:

```sh
nsh build my-app --release -o build
dist\nsh\runtime\windows\nsh-windows-host --bundle build\bundle.nshc --window-size 390x844   # in a checkout: target\debug\nsh-windows-host
```

`--window-size` é o tamanho da janela em pontos (`<width>x<height>`; apps TSX).

<a id="performance-monitor"></a>

### Monitor de desempenho

`--fps` (`nsh run App.tsx --target windows --fps`, `nsh test --target windows --fps`, o `--fps` do host, ou
`AppOptions { fps: true, .. }` no `run_app` de um app Rust) registra nos logs as leituras do monitor de desempenho uma vez por segundo
(alvo `nsh::perf`): quadros exibidos em relação à taxa de atualização da tela, o tempo da thread principal por quadro e suas fases (`tick`,
`drain`, `paint`, `present`, `canvas`), os commits do engine, CPU e memória, no formato que os outros desktops registram
(milissegundos como média/p50/p95/máx). `nsh test --fps -v` os exibe e `examples/gallery/tools/perf.py` os lê
([Relatório de desempenho](./performance-report.md#windows-win32-direct2d)). Meça builds de release; o monitor não tem
custo enquanto está desligado.

<a id="packaging"></a>

## Empacotamento

```sh
nsh package --target windows [--run]           # a Rust app, from its directory
nsh package App.tsx --target windows [--run]   # a TSX app
```

Grava um diretório e o mesmo conteúdo como um arquivo compactado:

```text
.nsh\out\<Name>\
  <Name>.exe             the executable, with the app's icon: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh\bundle.nshc         a TSX app, compiled
  nsh\assets\…           the assets it imports (a Rust crate's `assets!()` too)
  nsh\app.json           the window title, the app id, the version and the appearance
.nsh\out\<Name>.zip
```

O executável encontra `nsh\` ao lado dele; copie o diretório inteiro (ou descompacte o `.zip`) para onde o app deve
ficar: nada é instalado. O ícone de `nsh.json` é incorporado ao executável (o Explorer e a barra de tarefas o exibem)
sem nenhuma ferramenta adicional; o empacotamento em outro sistema mantém o ícone padrão. O id do app agrupa as janelas do app na
barra de tarefas. `--run` inicia o app depois de empacotá-lo. O executável não é assinado: assine-o com o seu próprio
certificado (`signtool`) para distribuí-lo.

<a id="embedding-in-a-win32-app"></a>

## Incorporando em um app Win32

O crate `nsh-platform-windows` (do repositório do NSH) oferece a um app Win32 em Rust o `AppView`: um engine NSH em uma janela filha
de uma janela sua. Cada `AppView` é independente; vários podem rodar ao mesmo tempo. Ele executa um root Rust, o componente
root do seu crate:

```rust
use std::rc::Rc;
use nsh_platform_windows::{
    windows::{self, Win32::{Foundation::HWND, System::Ole::OleInitialize, UI::WindowsAndMessaging::MoveWindow}},
    set_ui_sets, AppOptions, AppView, Root,
};

/// Called on the thread that runs your message loop, with your window.
fn embed(parent: HWND) -> windows::core::Result<Rc<AppView>> {
    // Once per thread: COM and OLE (the clipboard, image decoding).
    unsafe { OleInitialize(None)? };
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let view = AppView::new(
        Some(parent),
        AppOptions {
            app_id: "com.example.host".into(),
            ..AppOptions::default()
        },
    )?;
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    Ok(view)
}

// On WM_SIZE of `parent`:
// unsafe { MoveWindow(view.hwnd(), 0, 0, width, height, true) };
```

Um bundle TSX gerado por `nsh build` é carregado na mesma view, com `asset_base` apontando para o diretório `assets` dele:

```rust
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

A view é uma janela filha: o seu loop de mensagens a executa, e você a posiciona com `MoveWindow` no `hwnd()` dela quando a
janela pai é redimensionada. Crie-a na thread da janela em que ela fica: o ciclo de vida dela acompanha a janela de nível superior
dessa janela, aquela sob a qual ela foi criada. `AppView::load` substitui o que estava em execução; `stop` (ou destruir a janela) encerra o app. `asset_base`
informa onde os URIs `asset:/` são resolvidos (`AssetBase::Directory` ou `AssetBase::Http`). Bundles de bytecode (`bundle.nshc`)
são carregados com `unsafe { Bundle::bytecode(bytes) }` (ou `Bundle::read_trusted(path)`, também unsafe): o bytecode do QuickJS é uma entrada confiável, então
carregue-o apenas de arquivos do seu próprio app. Uma janela independente é `nsh_platform_windows::run_app(source, options)`, com
`AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`. `Root::tokens` dá a um root o seu [tema](./rust.md#theme) e
`Root::app_id` o id sob o qual os dados dele são mantidos.

`AppOptions::cache` (ou `AppView::set_cache`, para os apps carregados a seguir) define onde os apps mantêm seus caches, as
[imagens que baixam](./images-and-assets.md#kept-on-disk) e quanto cada um mantém (`CacheOptions`: por padrão, o
diretório de cache do sistema e 256 MiB de imagens).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` dão ao app o idioma e o
tamanho de texto do seu app no lugar dos do sistema (`None` volta a seguir o sistema): `locale()`, `Intl`, `fontScale()` e o texto
acompanham imediatamente ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` coloca a marca do seu app sobre o [tema](./tailwind.md#theme-tokens) do app: um arquivo de tema
no formato de `nsh.json` de `"theme"`, cujos tokens prevalecem sobre os do app com os mesmos nomes nos modos claro e escuro,
enquanto os demais tokens do app permanecem; classes como `bg-primary` são reestilizadas imediatamente, e os apps carregados depois já começam com ele
(`None` devolve ao app o seu próprio tema; um arquivo que não pode ser interpretado é um erro e não altera nada).

Os componentes nativos são registrados com `AppView::register_component`; veja
[Componentes nativos](./native-components.md#registering-on-windows-rust). `set_ui_sets(sets)` define os conjuntos de UI que todo
engine serve: os do NSH (`nsh_base::registry()`) e os dos seus crates (`my_app::registry()`, que `#[native_module]`
gera), de modo que o TSX carregado por uma view também importa os seus componentes e módulos Rust.

<a id="what-differs-on-windows"></a>

## O que é diferente no Windows

O ambiente é o de um desktop: a área segura e a altura do teclado são 0, `idiom()` é o desktop
(`platform.idiom` é `"desktop"`) e `os_version()` (`platform.version`) é `"10.0"` (também no Windows 11: o Windows manteve o número da versão). O modo escuro
acompanha em tempo real Configurações > Personalização > Cores, `fontScale()` a configuração Tamanho do texto, reduzir movimento a configuração de
efeitos de animação e o locale o formato regional do usuário. Veja [Dispositivo e ambiente](./device-and-environment.md).

O estilo `cursor` acompanha as atualizações enquanto o mouse está parado sobre uma view. Quando um lote altera o cursor,
o Windows aplica o novo formato ou `"none"` depois do lote inteiro, usando a view sob o ponteiro.
A barra de título e as bordas de redimensionamento mantêm os cursores do sistema.

<a id="keyboard"></a>

### Teclado

| Teclas | Ação |
|---|---|
| Return | Em um `Input`, o que `submitBehavior` determina: enviar (`onSubmit`), enviar e sair do campo, ou uma nova linha (inputs multilinha) |
| Shift+Return, Alt+Return | Uma nova linha em um input multilinha cujo return envia (Ctrl+Return envia) |
| Tab, Shift+Tab | O campo de texto seguinte / anterior, dentro do diálogo mais recente; o texto do campo é selecionado, como nos diálogos do Windows |
| Escape | Sai do campo em foco; caso contrário, limpa a seleção de texto e depois fecha o diálogo mais recente ou volta |
| Alt+Left, tecla Voltar do navegador, botão Voltar do mouse | Voltam (inclusive a partir de um campo) |
| Ctrl+setas, Home / End, Ctrl+Home / End, com Shift; Ctrl+Backspace / Delete | Movem, selecionam e apagam por palavra e por linha em um campo, como em qualquer app do Windows |
| Ctrl+Z, Ctrl+Y, Ctrl+X / C / V / A; Shift+Delete, Ctrl+Insert, Shift+Insert | Desfazer, refazer, recortar, copiar, colar, selecionar tudo (um campo `masked` recusa recortar e copiar); Ctrl+A / Ctrl+C selecionam e copiam texto selecionável |
| Setas; Page Up / Down, Space, Shift+Space; Home / End, Ctrl+Home / End | Rolam a scroll view ao redor da view em foco ou sob o mouse por uma linha, uma página, até o início / o fim (não enquanto um campo tem o foco) |
| F11, Alt+F4 | Tela cheia, fechar a janela (apps `nsh package` e `nsh run`) |
| Ctrl+R, F5 | Recarregam o build mais recente (`nsh run`) |

Os atalhos funcionam com qualquer layout de teclado (em um teclado cirílico ou grego, Ctrl+C é a tecla que digita C em um layout americano).
Um return que confirma a composição de um método de entrada (chinês, japonês, ...) nunca envia. `onKeyPress` informa
o que o React Native informa: o texto digitado, `"Enter"`, `"Backspace"` e `"Escape"`; o texto colado não é informado.

Os atalhos do próprio app ([`keymap`](../modules/nsh.md#keymap)) têm precedência sobre as teclas de um campo em foco, a navegação
e a rolagem; Alt+F4, F11 e Ctrl+Q não podem ser associados.

Diferente, ou sem suporte:

- **`WebView`**: uma página dentro de uma view com transformação 3D (perspectiva) não é exibida, e um `backdropFilter` sobre uma
  página não a desfoca. `baseUrl` aceita URLs `http(s)`. Um componente nativo que traz uma janela própria
  fica acima de tudo o que o NSH desenha.
- **Vídeo**: os formatos que os codecs instalados decodificam; sem pôster; a barra de controles sempre aparece com `controls`.
- **Scroll views com zoom** (`zoomTo`, as props de zoom); o indicador de rolagem não pode ser arrastado.
- **`mixBlendMode` e `backdropFilter`** são desenhados, mas não dentro de uma view que tenha um `filter` ou uma transformação 3D;
  `borderCurve: "continuous"` desenha cantos circulares.
- **Texto**: reticências no início e no meio apenas em uma única linha (com mais linhas, usa-se reticências no fim); emoji coloridos apenas de fontes
  COLR; versaletes (small caps) apenas onde a fonte os possui.
- **Inputs de texto**: tipos de teclado e autofill não se aplicam (não há teclado virtual); Tab move entre os campos
  de texto. Um clique com o botão direito abre o menu de edição (Desfazer, Recortar, Copiar, Colar, Excluir, Selecionar tudo), como em texto selecionável (Copiar,
  Selecionar tudo).
- **Acessibilidade** (UI Automation): diálogos de alerta e toasts não são expostos; títulos informam
  nível 1.
- **Input accessory views** e a **barra de status** (sem equivalente no desktop).

<a id="see-also"></a>

## Veja também

- [CLI](./cli.md): `nsh run --target windows`, `nsh package --target windows`
- [Empacotamento](./packaging.md)
- [Código específico de plataforma](./platform-specific.md)
