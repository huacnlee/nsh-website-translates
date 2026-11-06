---
title: "macOS"
description: "Execute apps NSH em Rust e TSX no macOS em janelas AppKit, empacote-os como bundles .app, incorpore-os em um app Mac com AppView e veja o que muda no macOS."
order: 13
group: platforms
source_hash: 1b63a5bad9780b73
---


# macOS

Apps NSH também rodam como apps nativos para Mac. O backend do macOS os renderiza com views do AppKit e Core Animation e faz o layout do texto com CoreText; o core, o grafo reativo, o renderer, o layout Taffy e os módulos nativos são os mesmos do iOS e do Android, então um app roda em qualquer lugar. No macOS, `os()` é `Os::MacOs` (`platform.os` é `"macos"`
em TSX) e as props `desktop={{…}}` do TSX se aplicam. O título da janela, uma barra de título própria do app, a barra de menus e os menus de contexto vêm de `nsh_core::element::desktop` em Rust ([Barras de título no desktop](./rust.md#desktop-title-bars)) e de
[`nsh/desktop`](../modules/nsh-desktop.md) em TSX.

O backend do macOS se comporta como um app de desktop: entrada de mouse, trackpad e teclado, janelas redimensionáveis, diálogos
sobre a janela e uma barra de menus.

<a id="requirements"></a>

## Requisitos

- **macOS 14** ou posterior, onde o app roda.
- Command line tools do Xcode (`xcode-select --install`), para compilar os runners dos apps Rust e o runtime macOS do NSH a partir de um
  checkout, e para empacotar apps (`codesign`, `sips`). A distribuição feita com `cargo xtask dist` em um Mac inclui o
  runtime dos apps TSX em `runtime/macos/`.

<a id="running-an-app"></a>

## Executando um app

Um app Rust roda a partir do seu diretório:

```sh
nsh run --target macos         # the default on a Mac
```

`nsh` compila um runner de debug com o seu crate e abre o app em uma janela, com os logs (`log::info!` e os demais)
no terminal; uma mudança no código Rust do crate compila o runner novamente e reinicia o app. `cargo run` inicia
a mesma raiz a partir do `src/main.rs` do crate, que `nsh init --template rust` grava: [`run_app`](#embedding-in-a-mac-app)
com `AppSource::Rust`.

Um app TSX indica sua entrada:

```sh
nsh run App.tsx --target macos
```

O app abre em uma janela do AppKit (1200×800 por padrão), com hot reload, logs no terminal e o overlay de erro, como
nos outros alvos; Cmd+R recarrega o build mais recente. A barra de menus e a janela mostram o nome do app (o `"name"` do nsh.json,
ou, na falta dele, o do seu diretório). Em um checkout, `nsh run` compila primeiro o host de desenvolvimento
(`nsh-macos-host`). Encerrar `nsh run` fecha a janela, e fechar a janela encerra `nsh run`. O host também
executa um bundle compilado sozinho:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/macos/nsh-macos-host --bundle build/bundle.nshc --window-size 1200x800   # in a checkout: target/debug/nsh-macos-host
```

`--window-size` é o tamanho inicial da janela (apps TSX); a janela pode ser redimensionada. `--display <n>` (`nsh run` / `nsh test
--target macos --display <n>`) centers it on display `n`: `1` é o display principal, o que tem a barra de menus.

`nsh test --target macos` executa os testes de um app TSX em janelas do macOS, em um display secundário quando houver (a tela
principal continua sua; `--display <n>` escolhe outro): cada app que um teste abre recebe uma janela própria, com o tamanho que o
teste pede, mesmo em um display menor que ele, e
os passos clicam, digitam e rolam com a entrada do sistema nas views que seus seletores indicam
([Testes](./testing-and-trace.md#on-a-real-platform)).

<a id="performance-monitor"></a>

### Monitor de desempenho

`--fps` (`AppOptions { fps: true, .. }` no `run_app` de um app Rust, `AppView::set_fps_monitor(true)` ao incorporar,
`nsh run App.tsx --target macos --fps`, o `--fps` do host, ou o `open -a MyApp --args --fps` de um app TSX empacotado) mostra um painel no canto superior direito do
app, atualizado duas vezes por segundo:

| Linha | O que mede |
|---|---|
| `FPS` | Frames exibidos no último segundo: atualizações do display em que o app mudou (um app ocioso marca baixo; isso não é lentidão). `max` é o que a main thread conseguiu acompanhar, seguido da taxa do display (120 Hz em telas ProMotion). |
| `TICK` | Os intervalos entre as atualizações do display conforme chegaram (média, p95) e `gap`, o intervalo p95 entre frames exibidos: uma atualização (8,3 ms a 120 Hz) quando nada está atrasado. |
| `MAIN` | Tempo da main thread por frame (aplicar as mudanças do engine, desenhar texto e canvases, animações, entrada), seu percentil 95 e `drop`: a parcela de frames que levaram mais que uma atualização. |
| `JS` / `CORE` | Por commit: o seu código (handlers, timers, linhas de lista) e o core do NSH (layout, texto, diffing); commits por segundo, mudanças de views nativas por commit. |
| `HOP` | Quanto tempo as mudanças esperam entre a engine thread e a main thread; quão ocupada está a engine thread. |
| `CPU` / `GPU` / `MEM` | O processo: CPU (100% é um núcleo), sua fração de GPU, seu consumo de memória (o valor do Activity Monitor). |

As barras abaixo mostram o tempo da main thread dos últimos 120 frames em relação a uma atualização (a linha): verde até a metade dela, âmbar
até ela, vermelho acima. Enquanto o painel está visível, as leituras também são registradas em log uma vez por segundo (alvo `nsh::perf`, no
formato do backend Linux com as fases de frame do macOS `tick`, `drain` e `canvas`; milissegundos como média/p50/p95/máx), que
`nsh test --fps -v` mostra e `examples/gallery/tools/perf.py` lê. Meça builds de release; o monitor não tem custo
enquanto está desligado.

<a id="packaging"></a>

## Empacotamento

```sh
nsh package --target macos [--run]           # a Rust app, from its directory
nsh package App.tsx --target macos [--run]   # a TSX app
```

Gera um app bundle:

```text
.nsh/out/<Name>.app/Contents/
  Info.plist
  MacOS/<Name>               the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  Resources/nsh/bundle.nshc  a TSX app, compiled
  Resources/nsh/assets/…     the assets it imports (a Rust crate's `assets!()` too)
  Resources/nsh/app.json     the window title and the app's appearance
  Resources/AppIcon.icns     the icon, when nsh.json names one (converted with sips)
```

O `.app` é assinado ad hoc, portanto roda no Mac que o compilou. Para distribuí-lo, assine-o com um Developer ID e
notarize-o. `--run` abre o app após empacotá-lo.

<a id="embedding-in-a-mac-app"></a>

## Incorporando em um app Mac

O crate `nsh-platform-macos` (do repositório do NSH) dá a um app Mac em Rust `AppView`: um engine NSH como uma `NSView`.
Cada `AppView` é independente; várias podem rodar ao mesmo tempo. Ela executa uma raiz Rust, o componente raiz do seu crate:

```rust
use std::rc::Rc;
use nsh_platform_macos::{
    objc2::MainThreadMarker, objc2_app_kit::NSWindow, set_ui_sets, AppOptions, AppView, Root,
};

fn show(window: &NSWindow) -> Rc<AppView> {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let view = AppView::new(mtm, AppOptions::default());
    // register native components here, before loading
    view.load(Root::of::<my_app::App>().into());
    window.setContentView(Some(&view.view()));
    // Keep the view while the window shows it; `stop` it when the window closes.
    view
}
```

`Root::tokens` dá à raiz o seu [tema](./rust.md#theme) (`nsh_base::Theme::from_json(json)?.into_tokens()`) e
`Root::app_id` o id sob o qual seus dados são mantidos. Um bundle TSX que `nsh build` gerou carrega na mesma view:

```rust
use nsh_platform_macos::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(mtm, AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` substitui o que estava rodando; `stop` encerra o app. `asset_base` informa onde os URIs `asset:/` são resolvidos
(`AssetBase::Directory` ou `AssetBase::Http`). Bundles de bytecode (`bundle.nshc`) são carregados com
`unsafe { Bundle::bytecode(bytes) }`: bytecode é entrada confiável, então só o carregue de arquivos do seu próprio app.
Para um app que é apenas um app NSH, `run_app(source, options)` (`AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`) abre uma `AppView` em uma janela com um menu padrão
(About, Hide, Quit, Edit, Minimize, Zoom, Enter Full Screen, Close), que o app pode substituir por
`Menu.setApplicationMenu` ([`nsh/desktop`](../modules/nsh-desktop.md)), e roda até a janela ser fechada.
Por padrão, fechar a janela ou escolher Quit encerra o engine e retorna de `run_app`;
o chamador pode então concluir a limpeza ou relançar seu executável.

Defina `AppOptions { keep_alive_on_close: true, ..Default::default() }` para manter a
sessão standalone viva quando a janela for fechada. Fechar oculta a janela;
reabrir pelo Dock mostra a mesma janela e o mesmo engine. Para uma saída explícita
ou um relançamento de atualização, chame `nsh_platform_macos::quit_app()` de qualquer thread. Ela
fecha a janela retida, encerra o engine e retorna de `run_app`.
`nsh_core::element::desktop::close_window()` segue a política de fechamento de janela escolhida.

`AppOptions::cache` (ou `AppView::set_cache`, para os apps carregados em seguida) define onde os apps guardam seus caches, as
[imagens que baixam](./images-and-assets.md#kept-on-disk) e quanto cada um mantém (`CacheOptions`: o
diretório de cache do sistema e 256 MiB de imagens por padrão).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` dão ao app o idioma e o
tamanho de texto do seu app no lugar dos do sistema (`None` volta a seguir o sistema): `locale()`, `Intl`, `fontScale()` e o texto
acompanham imediatamente ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` aplica a marca do seu app sobre o [tema](./tailwind.md#theme-tokens) do app: um arquivo de tema
no formato do `"theme"` de `nsh.json`, cujos tokens prevalecem sobre os de mesmo nome do app nos modos claro e escuro,
enquanto os demais tokens do app permanecem; classes como `bg-primary` são reestilizadas imediatamente, e os apps carregados depois já começam com ele
(`None` devolve ao app o seu próprio tema; um arquivo que não pode ser interpretado é um erro e não altera nada).

Componentes nativos são registrados com `AppView::register_component`; veja
[Componentes nativos](./native-components.md#registering-on-macos-rust). `set_ui_sets(sets)` define os conjuntos de UI que todo
engine serve: os do NSH (`nsh_base::registry()`) e os dos seus crates (`my_app::registry()`, que `#[native_module]`
gera), de modo que o TSX carregado por uma view também importa seus componentes e módulos Rust.

<a id="what-differs-on-macos"></a>

## O que muda no macOS

O ambiente é o de um desktop: a safe area e a altura do teclado são 0, `idiom()` é o desktop
(`platform.idiom` é `"desktop"`), `os_version()` (`platform.version`) é a versão do macOS, e o modo escuro acompanha a aparência do sistema em tempo real. Veja
[Dispositivo e ambiente](./device-and-environment.md).

A entrada é a de um desktop: o mouse, o trackpad (rolagem com inércia, pinça e rotação) e o teclado.
O texto selecionável é selecionado arrastando, com duplo e triplo clique, e copiado com Cmd+C. Escape, Option+Left,
Cmd+[ e o botão voltar do mouse fecham o diálogo mais recente ou voltam em uma pilha (Escape em um campo ou página web em foco
apenas sai dele; uma página recebe essas teclas primeiro e mantém as que usa); um `Dialog` é uma camada sobre toda a janela
que mostra o popup e o backdrop do app. As páginas mostram seu `header` no topo. Um clique em qualquer lugar de um `Input`, inclusive no padding, coloca o cursor de texto no ponto
mais próximo. `AlertDialog` mostra uma sheet `NSAlert` na janela: até duas ações de alerta em uma linha (a ação de
cancelar à esquerda, a última ação regular como padrão para Return), mais ações e as ações de uma action sheet empilhadas na
sua ordem, com a ação de cancelar por último e sem padrão; Escape escolhe a ação de cancelar.

<a id="keyboard"></a>

### Teclado

| Teclas | Ação |
|---|---|
| Return | Em um `Input`, o que `submitBehavior` define: enviar (`onSubmit`), enviar e sair do campo, ou uma nova linha (inputs multilinha) |
| Return, Enter do teclado numérico, Space | Ativa uma view em foco com `onPress` uma vez ao pressionar a tecla; a repetição automática é consumida |
| Shift+Return, Option+Return, Ctrl+Return | Uma nova linha em um input multilinha cujo return envia |
| Tab, Shift+Tab (Ctrl também) | O próximo / anterior campo ou view pressionável na ordem da tela, dentro do diálogo mais recente; Option+Tab digita um tab em um input multilinha |
| Escape | Sai do campo em foco; senão, limpa a seleção de texto, depois fecha o diálogo mais recente ou volta |
| Option+Left, Cmd+[, botão voltar do mouse | Voltar (não enquanto um campo tem o foco: nele Option+Left move o cursor de texto) |
| Option / Cmd + setas, com Shift; Option+Delete, Cmd+Delete; Ctrl+A / E / K | Mover, selecionar e apagar por palavra e por linha em um campo, como em qualquer app Mac |
| Cmd+Z, Shift+Cmd+Z, Cmd+X / C / V / A | Desfazer, refazer, recortar, copiar, colar, selecionar tudo (um campo `masked` recusa recortar e copiar); Cmd+A / Cmd+C selecionam e copiam texto selecionável |
| Setas; Page Up / Down, Space, Shift+Space, Option+Up / Down; Home / End, Cmd+Up / Down | Rolam a scroll view ao redor da view em foco ou sob o mouse por uma linha, uma página, até o início / fim (não enquanto um campo tem o foco) |
| Cmd+W, Cmd+M, Ctrl+Cmd+F, Cmd+H, Option+Cmd+H, Cmd+Q | Fechar, minimizar, tela cheia, ocultar, ocultar outros, sair (menus dos apps `nsh package` e `nsh run`) |
| Cmd+R | Recarrega o build mais recente (`nsh run`) |

Os atalhos do próprio app ([`keymap`](../modules/nsh.md#keymap)) têm precedência sobre esses, exceto as teclas de ativação dirigidas a uma view pressionável em foco, Quit, Hide,
Minimize e Full Screen, que não podem ser associados.

Os atalhos funcionam com qualquer layout de teclado (em um layout cirílico ou grego, Cmd+C é a tecla que digita C em um layout US).
Um return que confirma a composição de um método de entrada (chinês, japonês, ...) nunca envia. `onKeyPress` informa
o que o React Native informa: o texto digitado, `"Enter"`, `"Backspace"` e `"Escape"`.

Não suportado, ou diferente:

- **Scroll views com zoom** (`zoomTo`, as props de zoom).
- **`mixBlendMode`** e `brightness()` acima de 1.
- **Inputs**: tipos de conteúdo e preenchimento automático, tipos de teclado, capitalização automática, espaçamento entre letras; as input accessory views
  nunca são exibidas (não há teclado virtual) e `keyboardShouldPersistTaps` é ignorado.
- **`scrollable={false}` de `WebView`** impede que a roda do mouse e o trackpad rolem a página: eles rolam
  as scroll views do app ao redor dela, como no iOS. A página ainda rola com o teclado (Space, as setas) e com seus próprios
  scripts, e os gestos de deslizar no trackpad entre suas páginas (`allowsBackForwardNavigationGestures`) também são desativados.
- **Acessibilidade**: `accessibilityActions` personalizados.
- **A status bar** e **haptics** (sem equivalente no desktop).

<a id="see-also"></a>

## Veja também

- [CLI](./cli.md): `nsh run --target macos`, `nsh package --target macos`
- [Empacotamento](./packaging.md)
- [Código específico de plataforma](./platform-specific.md)
