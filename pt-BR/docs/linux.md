---
title: "Linux"
description: "Execute apps Rust e TSX do NSH no Linux em janelas GTK 4, empacote-os, incorpore-os em um app GTK com AppView e saiba o que muda no Linux."
order: 15
group: platforms
source_hash: c423cb25ff360498
---


# Linux

NSH também roda no Linux. O backend Linux renderiza os apps com widgets GTK 4 e faz o layout de texto com Pango; o núcleo, o grafo reativo, o renderizador, o layout Taffy e os módulos nativos são os mesmos do iOS e do Android, então um único app roda em qualquer lugar. No Linux, `os()` é `Os::Linux` (`platform.os` é `"linux"` em TSX) e as props `desktop={{…}}` do TSX se aplicam. O título da janela, uma barra de título própria do app, a barra de menus e os menus de contexto vêm de `nsh_core::element::desktop` em Rust ([Barras de título no desktop](./rust.md#desktop-title-bars)) e de [`nsh/desktop`](../modules/nsh-desktop.md) em TSX.

<a id="requirements"></a>

## Requisitos

- **GTK 4.14** ou posterior. Para compilar o runner de um app Rust ou o runtime Linux do NSH (a partir de um checkout, ou `cargo xtask
  dist` on Linux) you need their development packages and clang: `libgtk-4-dev clang` no Debian e no Ubuntu (24.04 ou
  posterior), `gtk4 clang` no Arch, `gtk4-devel clang` no Fedora.
- **WebKitGTK 6.0** (2.40 ou posterior) para web views: `libwebkitgtk-6.0-dev` no Debian e no Ubuntu, `webkitgtk-6.0` no
  Arch, `webkitgtk6.0-devel` no Fedora para compilar o runtime. O host de desenvolvimento e o runner de release o usam por
  padrão, então os apps empacotados precisam do WebKitGTK 6.0 onde forem executados (`libwebkitgtk-6.0-4` no Debian e no Ubuntu; os desktops
  GNOME já o incluem). `cargo xtask dist` em uma máquina sem os arquivos de desenvolvimento gera um runtime cujas web views
  são placeholders e cujos apps precisam apenas do GTK.
- Plugins do **GStreamer** para os formatos de vídeo que o seu app reproduz (o GTK reproduz vídeo por meio do GStreamer).

<a id="running-an-app"></a>

## Executando um app

No Linux, `nsh run` abre o app em uma janela GTK. Um app Rust é executado a partir do seu diretório:

```sh
nsh run                        # --target linux is the default on Linux
```

`nsh` compila um runner de debug com o seu crate e abre o app, com os logs (`log::info!` e os demais) no
terminal; uma alteração no código Rust do crate compila o runner novamente e reinicia o app. `cargo run` inicia a mesma
raiz a partir do `src/main.rs` do crate, que `nsh init --template rust` gera: [`run_app`](#embedding-in-a-gtk-app)
com `AppSource::Rust`.

Um app TSX informa seu ponto de entrada e abre, por padrão, em uma janela de 390×844, com hot reload, logs no terminal e o
overlay de erros, como nos outros alvos:

```sh
nsh run App.tsx
```

Em um checkout, `nsh run` compila primeiro o host de desenvolvimento (`nsh-linux-host`); a distribuição gerada no Linux o inclui
em `runtime/linux/`. Ctrl-C fecha a janela, e fechar a janela encerra `nsh run`. O host também executa um bundle já compilado
por conta própria:

```sh
nsh build my-app --release -o build
dist/nsh/runtime/linux/nsh-linux-host --bundle build/bundle.nshc --window-size 1024x768   # in a checkout: target/debug/nsh-linux-host
```

`--window-size` é o tamanho padrão da janela (apps TSX); gerenciadores de janelas de tiling podem atribuir à janela outro tamanho.

<a id="packaging"></a>

## Empacotamento

```sh
nsh package --target linux [--run]           # a Rust app, from its directory
nsh package App.tsx --target linux [--run]   # a TSX app
```

Gera um diretório e o mesmo conteúdo como um arquivo compactado:

```text
.nsh/out/<Name>/
  <Name>                 the executable: a Rust app's own runner, built with its crate; nsh's release runner for TSX
  nsh/bundle.nshc        a TSX app, compiled
  nsh/assets/…           the assets it imports (a Rust crate's `assets!()` too)
  nsh/app.json           the window title and the application id
  <id>.desktop           a desktop entry (StartupWMClass is the id)
  <id>.png               the icon, when nsh.json names one
.nsh/out/<Name>.tar.gz
```

O executável encontra `nsh/` ao lado de si mesmo (um link simbólico para ele, em `~/.local/bin` por exemplo, também funciona). GTK 4, Pango e
WebKitGTK 6.0 devem estar instalados onde o app for executado. Para exibir o app no launcher de um desktop, coloque o executável (ou um link) no
`PATH`, o arquivo `.desktop` em `~/.local/share/applications` e o ícone em um diretório de tema de ícones. `--run` inicia
o app depois de empacotá-lo.

<a id="embedding-in-a-gtk-app"></a>

## Incorporando em um app GTK

O crate `nsh-platform-linux` (do repositório do NSH) oferece a um app Rust GTK `AppView`: um engine NSH como um widget GTK.
Cada `AppView` é independente; vários podem rodar ao mesmo tempo. Ele executa uma raiz Rust, o componente raiz do seu crate:

```rust
use std::rc::Rc;
use nsh_platform_linux::{gtk4 as gtk, set_ui_sets, AppOptions, AppView, Root};
use gtk::prelude::*;

fn main() -> gtk::glib::ExitCode {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let app = gtk::Application::builder().application_id("com.example.host").build();
    app.connect_activate(|app| {
        let window = gtk::ApplicationWindow::builder().application(app).default_width(390).default_height(844).build();
        let view = AppView::new(AppOptions::default());
        // register native components here, before loading
        view.load(Root::of::<my_app::App>().into());
        window.set_child(Some(&view.widget()));
        // The window keeps the view; closing it stops the app.
        let keep = std::cell::RefCell::new(Some(Rc::clone(&view)));
        window.connect_destroy(move |_| if let Some(view) = keep.take() { view.stop() });
        window.present();
    });
    app.run()
}
```

`Root::tokens` dá à raiz o seu [tema](./rust.md#theme) e `Root::app_id` o id sob o qual seus dados são mantidos. Um bundle
TSX gerado por `nsh build` é carregado na mesma view, com `asset_base` apontando para o seu diretório `assets`:

```rust
use nsh_platform_linux::{AppOptions, AppView, AssetBase, Bundle};

let view = AppView::new(AppOptions {
    asset_base: Some(AssetBase::Directory("app/assets".into())),
    ..AppOptions::default()
});
let code = std::fs::read_to_string("app/bundle.js").expect("bundle");
view.load(Bundle::source(code).into());
```

`AppView::load` substitui o que estava em execução; `stop` encerra o app. `asset_base` informa onde os URIs `asset:/` são resolvidos
(`AssetBase::Directory` ou `AssetBase::Http`). Bundles de bytecode (`bundle.nshc`) são carregados com `unsafe { Bundle::bytecode(bytes) }`:
o bytecode QuickJS é uma entrada confiável, então carregue-o somente a partir dos arquivos do seu próprio app. Uma janela independente é
`nsh_platform_linux::run_app(source, options)`, com `AppSource::Rust(root)` ou `AppSource::Bundle(bundle)`.

`AppOptions::cache` (ou `AppView::set_cache`, para os apps carregados a seguir) define onde os apps mantêm seus caches, as
[imagens que baixam](./images-and-assets.md#kept-on-disk) e quanto cada um mantém (`CacheOptions`: o diretório
de cache do sistema e 256 MiB de imagens por padrão).

`AppView::set_locale(Some(locale))` e `AppView::set_font_scale(Some(scale))` fornecem ao app o idioma e o
tamanho de texto do seu app no lugar dos do sistema (`None` volta a seguir o sistema): `locale()`, `Intl`, `fontScale()` e o texto
os acompanham imediatamente ([Dispositivo e ambiente](./device-and-environment.md#in-an-embedding-app)).

`AppView::set_theme_overrides(Some(json))` aplica a marca do seu app sobre o [tema](./tailwind.md#theme-tokens) do app: um arquivo de tema
no formato de `nsh.json` de `"theme"`, cujos tokens prevalecem sobre os do app com os mesmos nomes nos modos claro e escuro,
enquanto os demais tokens do app permanecem; classes como `bg-primary` são reestilizadas imediatamente, e os apps carregados depois já começam com ele
(`None` devolve ao app o seu próprio tema; um arquivo que não pode ser interpretado gera um erro e não altera nada).

Componentes nativos são registrados com `AppView::register_component`; veja [Componentes nativos](./native-components.md#registering-on-linux-rust).
`set_ui_sets(sets)` define os conjuntos de UI que todo engine serve: os do NSH (`nsh_base::registry()`) e os dos seus crates
(`my_app::registry()`, que `#[native_module]` gera), de modo que o TSX carregado por uma view importa também os seus componentes e
módulos Rust.

<a id="what-differs-on-linux"></a>

## O que muda no Linux

O ambiente é o de um desktop: a safe area e a altura do teclado são 0, `idiom()` é o desktop
(`platform.idiom` é `"desktop"`), `os_version()` (`platform.version`) é a versão maior e menor do kernel, e o modo escuro acompanha a configuração do desktop
(por meio do XDG settings portal) em tempo real. Veja [Dispositivo e ambiente](./device-and-environment.md).

<a id="keyboard"></a>

### Teclado

| Teclas | Ação |
|---|---|
| Return | Em um `Input`, o que `submitBehavior` define: enviar (`onSubmit`), enviar e sair do campo, ou uma nova linha (inputs multilinha) |
| Shift+Return, Alt+Return | Uma nova linha em um input multilinha cujo return envia (Ctrl+Return envia) |
| Tab, Shift+Tab | O campo seguinte / anterior na ordem da tela, dentro do diálogo mais recente |
| Escape | Sai do campo em foco; caso contrário, limpa a seleção de texto e depois fecha o diálogo mais recente ou volta |
| Alt+Left, tecla Voltar, botão de voltar do mouse | Voltam (inclusive a partir de um campo) |
| Ctrl+setas, Home / End, com Shift; Ctrl+Backspace / Delete | Movem, selecionam e apagam por palavra e por linha em um campo, como em qualquer app GTK |
| Ctrl+Z, Ctrl+Shift+Z, Ctrl+X / C / V / A | Desfazer, refazer, recortar, copiar, colar, selecionar tudo (um campo `masked` recusa recortar e copiar); Ctrl+A / Ctrl+C selecionam e copiam texto selecionável |
| Setas; Page Up / Down, Espaço, Shift+Espaço; Home / End | Rolam a scroll view ao redor da view em foco ou sob o mouse por uma linha, uma página, até o início / fim (não enquanto um campo tem o foco) |
| Ctrl+W, F11, Ctrl+Q | Fechar a janela, tela cheia, sair (apps `nsh package` e `nsh run`) |
| Ctrl+R | Recarrega o build mais recente (`nsh run`) |

Os atalhos do próprio app ([`keymap`](../modules/nsh.md#keymap)) são um controlador de atalhos válido para toda a janela; Ctrl+Q e
F11 não podem ser associados a outras ações.

Os atalhos funcionam com qualquer layout de teclado (em um teclado cirílico ou grego, Ctrl+C é a tecla que digita C em um layout US).
Um return que confirma a composição de um método de entrada (chinês, japonês, ...) nunca envia. `onKeyPress` informa
o que o React Native informa: o texto digitado, `"Enter"`, `"Backspace"` e `"Escape"`; o texto colado não é informado.

As web views são páginas WebKitGTK, desenhadas dentro das views do NSH: sheets, diálogos, toasts e as views posteriores a elas são desenhados sobre uma página,
e os pais a recortam e a esmaecem. Os dados de site (cookies, armazenamento, cache) são mantidos por app, em
`~/.local/share/<app id>/webkit` e `~/.cache/<app id>/webkit`. A capability `webview` também se aplica às páginas de
frames: um `iframe` de um host ao qual o seu app não recebeu permissão permanece vazio. Escape em uma página sai dela, como em um campo de texto
(a menos que a página o use); Alt+Left e o botão de voltar do mouse voltam na página enquanto ela tiver histórico.

Não suportado:

- **Vídeo `rate`**: o GTK reproduz apenas em velocidade normal. `onEnd` só ocorre em vídeos que não fazem loop.
- **Scroll views com zoom** (`zoomTo`, as props de zoom).
- **`mixBlendMode` e `backdropFilter`** (a cor de fundo ainda é desenhada); `borderCurve: "continuous"` desenha
  cantos circulares.
- **Input accessory views** e a **barra de status** (sem equivalente no desktop).
- **Acessibilidade**: agrupamento de `accessible`, `accessibilityActions` personalizado; em vez disso, as live regions são anunciadas.

<a id="see-also"></a>

## Veja também

- [CLI](./cli.md): `nsh run --target linux`, `nsh package --target linux`
- [Empacotamento](./packaging.md)
- [Código específico de plataforma](./platform-specific.md)
