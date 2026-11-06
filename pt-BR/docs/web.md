---
title: "Web"
description: "Crie aplicativos web em Rust ou TSX com componentes do Native Shell renderizados como HTML e CSS, desenvolva no navegador e publique em qualquer host estático ou CDN."
order: 16
group: platforms
demo: counter
source_hash: 3d223070a2f7ac3d
---


# Web

Crie apps web com o Native Shell usando os mesmos componentes, estilos e lógica de aplicação das plataformas nativas. O NSH renderiza a interface como elementos HTML e CSS: texto, imagens, campos de entrada, rolagem, estilos visuais e interações usam o DOM do navegador e as APIs web.

`nsh package --target web` publica o app como um site estático para qualquer servidor web ou CDN ([Publicar um app](#publish-an-app)), e `nsh run --target web` o executa no navegador enquanto você o edita ([Desenvolver no navegador](#develop-in-the-browser)). Todas as demos ao vivo deste site usam este backend web.

Apps TSX publicados usam o motor JavaScript do navegador. O empacotamento vincula a cada app seu próprio runtime, contendo apenas os componentes `nsh/base` e os módulos padrão que o app importa: um app criado com os componentes principais baixa cerca de 1,1 MB. Os dados de realce de sintaxe são carregados quando o código é realçado pela primeira vez.

<a id="what-runs-where"></a>

## O que roda onde

A página é construída com elementos HTML estilizados com CSS. O NSH transforma as atualizações de componentes em lotes de alterações no DOM, enquanto o navegador exibe a interface e cuida da rolagem, da seleção de texto e da entrada. O WebAssembly hospeda o engine Rust compartilhado para estado dos componentes, layout e atualizações: com o crate de um app Rust compilado junto, ou ao lado do motor JavaScript do navegador, que executa o código de um app TSX como módulos ES: apps publicados, a página do servidor de desenvolvimento, as demos deste site e o playground.

Em todas as plataformas nativas o engine tem sua própria thread e entrega um `MountBatch` por commit à thread principal. Uma página do navegador tem uma única thread, então o build web aciona o mesmo engine passo a passo a partir do event loop da página (`nsh_engine::LocalEngine`):

```text
pointer / keyboard / scroll events ─┐
setTimeout (the engine's deadline) ─┼─▶ nsh.wasm: engine turn (Rust or JS, core, layout) ─▶ one JSON batch ─▶ nsh.js: DOM
requestAnimationFrame ──────────────┘                                                 ▲
                                                          native animation outputs ───┘
```

- **O layout é do core.** Toda view é um elemento posicionado de forma absoluta no frame calculado pelo Taffy, então flexbox, grid, `aspectRatio` e porcentagens se comportam exatamente como nos dispositivos. O layout do próprio navegador não participa.
- **Os estilos viram CSS em Rust.** Fundo, bordas, raios, sombras (`boxShadow`, `textShadow`), gradientes, filtros, `backdropFilter`, transformações, `transformOrigin`, `outline`, `mixBlendMode`, transições e as animações keyframe integradas viram propriedades CSS. Classes Tailwind, estados `active:`, `hover:` e `focus:` e `dark:` são todos resolvidos nativamente, como nos dispositivos.
- **O texto é disposto em Rust** com medidas de fonte do navegador (`CanvasRenderingContext2D.measureText`) e desenhado trecho a trecho nas posições que o layout escolheu, de modo que o que foi medido é o que é desenhado. As linhas quebram após espaços, ao redor de caracteres CJK e em `\n`; `numberOfLines` trunca com reticências.
- **As animações nativas rodam em Rust** em `requestAnimationFrame`: timing `Animated`, spring e decay, `interpolate`, valores animados vinculados a `opacity`, `translate`, `rotate`, `scale`, os passos de `transform` e `backgroundColor`, arrastes vinculados com `pan`, valores vinculados à rolagem e argumentos de canvas. O JS não participa a cada frame, como nos dispositivos. `LayoutAnimation`, transições de estilo, os keyframes de `animate-*` e transições de tela se movem como nos backends desktop, e `prefers-reduced-motion` as desativa (as telas fazem fade).
- **Entrada:** pressionamentos com feedback de `activeStyle` / `active:` e pressionamentos longos, o sistema de responder (`onTouch*`, `PanResponder`), arrastes nativos e pinça e rotação com dois dedos, scroll views (a rolagem do navegador), pull to refresh, scroll views com zoom (pinça, ctrl+roda e pinça no touchpad, `zoomTo`), `<Input>` com valores controlados, foco e envio, `Canvas`, `NavStack` e `NavPage` com o `header` da página, `Dialog`.
- **A UI do sistema é desenhada na página:** `AlertDialog` tem a aparência dos diálogos dos backends desktop nos navegadores desktop e a do iOS nos celulares (com o idioma `desktop`, veja abaixo). As fontes personalizadas são medidas novamente quando o navegador as carrega, e um app espera as fontes que importa antes de exibir seu primeiro frame.
- **Dialogs** são uma camada sobre todo o app que mostra o popup e o backdrop do app, como nos backends desktop. Escape, o botão voltar do navegador e um toque no backdrop os fecham (`closeOnEscape`, `closeOnBackdropPress`), e `animation`, `onOpen`, `onClose`, `onCancel` e `onOpenChange` funcionam como nos dispositivos. Uma página que [incorpora o app](#embed-it-in-a-page) em parte do seu layout pode exibir dialogs e alertas sobre toda a janela do navegador (`dialogs: "viewport"`), assim como o iOS e o Android os exibem sobre a tela inteira.

<a id="keyboard-mouse-and-touch"></a>

## Teclado, mouse e toque

Apps publicados se comportam como apps desktop em navegadores desktop e como apps de celular em navegadores de celular:

- **Rodas e touchpads** rolam a scroll view mais interna, no seu eixo, que ainda possa se mover (uma roda vertical rola uma lista horizontal quando nada na vertical pode se mover) e permanecem nela até a rolagem terminar; os cliques da roda deslizam suavemente, e views com paginação e snap avançam uma página por rolagem. Ctrl + roda e pinça no touchpad aplicam pinça às views com valores de pinça nativos, em vez de dar zoom na página. Arrastar com o mouse não rola, como nas plataformas desktop: os arrastes do mouse vão para pans, para o sistema de responder e para a seleção de texto. As scroll views informam `onScrollDragStart` / `onScrollDragEnd`, `onMomentumStart` / `End` e `onScrollEnd` como nas plataformas desktop.
- **Teclado**: Tab e Shift+Tab alternam entre pressables e campos de entrada (os estilos `focus:` do app mostram o foco do teclado); Return pressiona o pressable com foco, Space o pressiona ao ser solto; setas, Page Up / Page Down, Space, Home e End rolam a scroll view ao redor do foco ou sob o mouse; Escape sai de um campo, fecha o dialog e depois volta. Atalhos de `keymap` funcionam no navegador, comparados na hora (`mod` é Command no Safari e no Chrome em um Mac, Control nos demais).
- **Voltar**: Escape, Alt+Left (Cmd+[ em um Mac) e o botão voltar do mouse fecham o dialog mais recente ou removem a stack mais interna, como o botão voltar do Android; `popOnBack` e `onBackPress` funcionam como lá. Quando o app ocupa a página inteira, cada página empilhada e cada dialog aberto é uma entrada no histórico do navegador, de modo que o botão voltar do navegador volta dentro do app.
- **Toque**: apenas as scroll views fazem pan; a própria página nunca rola, dá zoom ou faz pull to refresh sob o app, e os toques não têm atraso. Em um iframe, os gestos de deslizar que o app não captura rolam a página que o incorpora. Os arrastes em views com pans nativos, pinças e o sistema de responder pertencem ao app.
- **Acessibilidade**: `role`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`, `accessibilityValue`, `accessibilityLiveRegion` e `accessibilityElementsHidden` viram ARIA; `announce` fala por meio de uma live region e `setAccessibilityFocus` move o foco. As views sob um dialog ou alerta ficam inertes.
- **Seleção e menus**: em navegadores desktop o texto é selecionável por padrão, como em uma página web, exceto dentro de elementos interativos (views com handlers de pressionamento ou toque: botões, linhas pressionáveis, abas) e de texto com `userSelect: "none"` ou `select-none`; arrastar o mouse sobre o texto o seleciona, Ctrl/Cmd+C o copia linha por linha e Ctrl/Cmd+A seleciona todo o texto em que a seleção está. Em navegadores de celular e tablet, apenas o texto com `userSelect: "text"` é selecionável, como nos apps nativos. O menu de contexto do navegador aparece apenas em texto selecionável e em campos de entrada.

<a id="apps-with-rust-components"></a>

## Apps com componentes Rust

Um app escrito em Rust ([Criando com Rust](./rust.md)) é publicado e executado no navegador a partir do seu diretório:

```sh
nsh package --target web           # .nsh/out/<Name>/: the app's own nsh.wasm, with its crate
nsh run --target web               # the dev server's page; editing the Rust code builds it again
```

Quando `nsh.json` nomeia o componente raiz do app (`"root"`), a página é composta pelo Rust do app e pelo script de página do NSH, e nada mais: `nsh.wasm` contém o engine, os componentes e o crate do app, o site não tem `app.js`, e a página monta a raiz assim que o runtime e as fontes estão carregados. A galeria Rust inteira tem 3,3 MB (1,06 MB com gzip, 0,75 MB com brotli), menos que o runtime dos apps TSX. Sob sua entrada TSX (`nsh package App.tsx --target web`), o mesmo app roda como os apps TSX, no motor JavaScript do navegador, e importa os componentes e módulos do crate.

De qualquer forma, os assets do crate (`assets!()`) são publicados junto com os do app, e suas fontes são carregadas antes do primeiro frame. Durante `nsh run --target web`, uma alteração no código Rust do crate recompila o runtime e a página aberta o carrega sozinha; as edições em TSX continuam sendo hot updates. O runtime de desenvolvimento é compilado de forma incremental, então uma alteração no crate fica pronta em cerca de um segundo; `nsh package` compila o runtime publicado otimizado para tamanho.

O código Rust que roda em todas as plataformas, inclusive na web, usa os serviços do engine: `fetch(url).await` faz requisições HTTP pela mesma pilha de rede do `fetch` do JS (a do navegador, neste caso, com suas regras de CORS); `timer`, `set_timeout` e `set_interval` esperam; e `nsh_core::time::Instant` e `nsh_core::time::unix_ms()` leem o relógio. `background` e `blocking` executam trabalho nas threads dos alvos nativos.

O build precisa do alvo Rust e de um clang que compile para WebAssembly, assim como o build do próprio runtime: `rustup target add wasm32-unknown-unknown`, além de `clang` e `llvm-ar` (no macOS, uma toolchain LLVM como a do Homebrew, `llvm`, por meio de `CC_wasm32_unknown_unknown` e `AR_wasm32_unknown_unknown`).

<a id="browser-apis-from-rust"></a>

### APIs do navegador a partir do Rust

Um crate pode chamar as próprias APIs do navegador por meio do [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/) e de seus crates `web-sys` e `js-sys`, atrás de `#[cfg(target_arch = "wasm32")]`: um WebSocket, `IndexedDB`, a área de transferência, qualquer Web API e JS do próprio crate (`#[wasm_bindgen(inline_js = …)]`, `module = "/js/…"`). Quando o runtime web do app chama JS dessa forma (incluindo conversões de `JsValue`), `nsh` executa o CLI `wasm-bindgen` sobre ele e publica o seu glue e o JS do crate ao lado do runtime, tanto em desenvolvimento quanto em sites publicados. A versão do CLI é a do crate `wasm-bindgen` ao qual o runtime se vincula, que `nsh` nomeia: `cargo install wasm-bindgen-cli --version <version> --locked` o instala (`NSH_WASM_BINDGEN` indica um CLI em outro lugar que não `PATH`). Um runtime que se vincula ao wasm-bindgen e não chama JS por meio dele (por meio de features padrão de uma dependência) é compilado como qualquer outro runtime.

O crate nomeia as APIs que usa como features de `web-sys`, e fixar `wasm-bindgen` mantém sua versão, e portanto a do CLI, a mesma de build para build:

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
web-sys = { version = "0.3", features = ["WebSocket", "MessageEvent"] }
futures-channel = "0.3"
```

Os callbacks do navegador (uma mensagem que chega, um timer da página) acordam as tasks do app, que são executadas imediatamente:

```rust
#[cfg(target_arch = "wasm32")]
async fn echo(url: &str, text: String) -> Result<String, String> {
    use wasm_bindgen::{JsCast, prelude::*};
    let ws = web_sys::WebSocket::new(url).map_err(|e| format!("{e:?}"))?;
    let (tx, rx) = futures_channel::oneshot::channel();
    let tx = std::cell::RefCell::new(Some(tx));
    let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |e: web_sys::MessageEvent| {
        if let (Some(tx), Some(data)) = (tx.borrow_mut().take(), e.data().as_string()) {
            let _ = tx.send(data);
        }
    });
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    on_message.forget();
    let open = ws.clone();
    let on_open = Closure::<dyn FnMut()>::new(move || {
        let _ = open.send_with_str(&text);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    on_open.forget();
    rx.await.map_err(|_| "closed".to_owned())
}
```

As chamadas de um crate a APIs do navegador são executadas com as permissões da própria página, assim como o código nativo de um crate é executado com as do app nas outras plataformas: as capabilities de `nsh.json` governam o que passa pelo engine (`fetch`, o JS do app), e as regras do navegador (CORS, o Content-Security-Policy da página) governam cada requisição que a página faz.

<a id="publish-an-app"></a>

## Publicar um app

```sh
# A Rust app, from its directory
nsh package --target web                   # .nsh/out/<Name>/: a static site
nsh package --target web --run             # and serve it on this machine (open the address it prints)

# A TSX app
nsh package App.tsx --target web
nsh package App.tsx --target web --run
```

`nsh package --target web` grava `.nsh/out/<Name>/` (`--out` para outro diretório), organizado como um build de frontend: uma página e arquivos nomeados a partir do seu conteúdo.

| Arquivo | O que é |
|---|---|
| `index.html` | A página do app: seu nome como título, os ícones, as cores de sua `appearance`, um indicador de carregamento e uma mensagem quando o app não consegue carregar ou iniciar |
| `manifest.webmanifest` | O nome, o id, os ícones e as cores com que os navegadores instalam o app |
| `nsh.<digest>.js` | O runtime do DOM, minificado (79 KB, 22,5 KB com brotli) |
| `nsh.<digest>.wasm` | O engine Rust, o layout e os componentes, mais o próprio crate de um app Rust. O TSX roda no JavaScript do navegador; o empacotamento o vincula apenas aos componentes e módulos padrão que a primeira tela do app importa. |
| `nsh-<name>.<digest>.wasm` | Componentes, módulos padrão e shaders que o app usa além da primeira tela: baixados em segundo plano depois que ela é exibida |
| `<file>.br`, `<file>.gz` | Cada arquivo comprimido previamente, para hosts que enviam arquivos pré-comprimidos |
| `nsh-syntaxes.<digest>.bin` | As sintaxes com que o código é realçado (conjunto do bat: 0,92 MB, 0,8 MB com brotli), baixadas na primeira vez que um bloco de código, um `Editor` ou um `DiffView` exibe código em alguma linguagem |
| `nsh-bindgen.<digest>.js` | O glue do wasm-bindgen de um app cujos crates chamam [APIs do navegador a partir do Rust](#browser-apis-from-rust), minificado |
| `snippets.<digest>/<crate>-<hash>/…` | O JS desses crates que o glue importa (`inline_js`, `module = "/js/…"`), nos caminhos que o wasm-bindgen lhe dá |
| `app.<digest>.js` | A entrada TSX compilada como módulo ES, carregada pelo navegador. |
| `host.<digest>.js` | O host da página, `nsh.json` `web.host` ([as funções do host](#the-hosts-functions)) |
| `<name>.<digest>.js` | Módulos ES carregados sob demanda por `import()`. |
| `assets/<path>.<digest>.<ext>` | Todos os assets que o app importa, carregados a partir de sua URL quando são usados (as fontes antes de o código que as registra ser executado, pois o texto é medido com elas: antes de o app iniciar, ou junto com o chunk que as importa) |
| `icons/<size>.<digest>.png` | O ícone de `nsh.json` em 32 (favicon), 180 (`apple-touch-icon`), 192 e 512 pixels |

`<digest>` é o início do SHA-256 do conteúdo do arquivo: o nome de um arquivo muda exatamente quando seu conteúdo muda, de modo que uma nova versão altera apenas `index.html` e os arquivos que realmente mudaram. Tudo usa URLs relativas, então o site funciona a partir de qualquer diretório de qualquer host (`https://example.com/apps/counter/`).

<a id="runtime-size"></a>

### Tamanho do runtime

O empacotamento vincula a cada app seu próprio `nsh.<digest>.wasm`, contendo o engine e os componentes `nsh/base`, módulos padrão e shaders que a primeira tela do app importa. O que as outras telas do app importam é baixado em segundo plano depois que a primeira tela é exibida. Um app cujos crates chamam [APIs do navegador a partir do Rust](#browser-apis-from-rust) recebe o runtime completo, com seus crates incluídos, em seu `nsh.<digest>.wasm`. Medido com `nsh package --target web` (MB = 10^6 bytes):

| App | Usa | `nsh.<digest>.wasm` | gzip | Brotli |
|---|---|---|---|---|
| `examples/counter` | Os componentes principais | 3,96 MB | 1,32 MB | 0,97 MB |
| `examples/gallery` | Todos os componentes, `zlib` e shaders | 4,13 MB | 1,36 MB | 1,01 MB |
<a id="deploy-it"></a>

### Publique o app

Envie o diretório para qualquer host estático: um object store atrás de uma CDN, Cloudflare Pages, Netlify, GitHub Pages, nginx. Duas regras fazem o app carregar rápido e atualizar de forma confiável:

| Arquivos | `Cache-Control` |
|---|---|
| `index.html`, `manifest.webmanifest` | `no-cache` (revalidados a cada carregamento, para que uma nova versão apareça imediatamente) |
| todo o resto | `public, max-age=31536000, immutable` |

Sirva `.wasm` como `application/wasm` (assim os navegadores o compilam enquanto ele é baixado) e envie as cópias pré-comprimidas aos navegadores que as aceitam: `brotli_static on; gzip_static on;` do nginx, `file_server {
precompressed br gzip }` do Caddy, ou uma CDN que comprime com Brotli. Com Brotli, o runtime fica cerca de um quarto menor do que com gzip. `nsh package --target web --run` serve o site dessa forma em `http://127.0.0.1:4173/`.

Um app publicado para a web roda como um app nativo empacotado: como um release, com as capacidades que seu `nsh.json` declara ([Sandbox e capacidades](./sandbox-and-capabilities.md)), sendo um app TSX no mecanismo JavaScript do navegador. Quando essas capacidades restringem `network`, a página também carrega uma `connect-src` Content-Security-Policy com os hosts declarados (e a origem da própria página), de modo que o próprio navegador recusa requisições e saltos de redirecionamento para qualquer outro host. Um erro que impeça a inicialização é exibido na página; erros posteriores vão para o console do navegador.

<a id="embed-it-with-an-iframe"></a>

### Incorpore com um iframe

Não existe uma API de incorporação na web: incorpore o app publicado com um `<iframe>`. Seu tamanho é a janela do app:

```html
<iframe src="https://apps.example.com/counter/" title="Counter"
        style="width: 390px; height: 844px; border: 0"></iframe>
```

<a id="develop-in-the-browser"></a>

## Desenvolva no navegador

```sh
nsh run --target web               # a Rust app, from its directory
nsh run App.tsx --target web       # a TSX app
```

inicia o servidor de desenvolvimento e imprime o endereço da página, `http://127.0.0.1:8790/`: abra-o em qualquer navegador. A página é um host de desenvolvimento como os outros: ela executa cada build do app, mostra erros de build e erros de runtime sobre o app e envia os logs do app para o terminal. Uma alteração no crate de um app Rust recompila seu runtime e a página aberta o carrega sozinha; as edições em TSX são aplicadas no lugar (hot updates). Celulares na mesma rede abrem o endereço que `nsh run` imprime logo abaixo (`on this network: http://192.168.…:8790/`). `nsh dev` serve a mesma página quando o runtime web está presente (na distribuição, sempre).

<a id="build-the-websites-player"></a>

## Compile o player do site

```sh
cargo xtask web                       # nsh.wasm, nsh.js, the player and website/demos/*.tsx
cargo xtask web --out target/play     # somewhere else
```

O diretório de saída contém:

| Arquivo | O que é |
|---|---|
| `gallery/nsh.<digest>.wasm` | O runtime da galeria, vinculado para ela por `nsh package` (usa todos os componentes e `zlib`: cerca de 11,8 MB, 3,6 MB com gzip) |
| `gallery/nsh-syntaxes.<digest>.bin` | As sintaxes com as quais o runtime destaca código, buscadas na primeira vez que uma demo mostra código em uma linguagem |
| `nsh-playground.wasm` | O mesmo, mais o compilador TSX do NSH, para o [Playground](#the-playground) (cerca de 8 MB, 2,4 MB com gzip) |
| `gallery/nsh.<digest>.js` | O runtime DOM (minificado): carrega o wasm, aplica batches e transforma entrada em eventos |
| `index.html` | Uma página de player: executa `demos/<name>.js` para `#<name>` |
| `nsh.wasm`, `nsh.js`, `browser/` | O runtime que o player carrega: o engine, o runtime DOM e os módulos do host do navegador |
| `demos/<name>.js` | Cada demo compilada por `nsh build --release`: um módulo ES |
| `gallery/` | O app da galeria publicado com `nsh package --target web`, exibido na página [Galeria](/gallery) |

Sirva o diretório com qualquer servidor estático (ele precisa do tipo MIME `application/wasm` para a compilação em streaming) e abra `index.html#counter`.

<a id="the-playground"></a>

## O Playground

O [Playground](/playground) edita e executa um app no navegador: a página compila o TSX com o compilador JSX próprio do NSH (embutido em `nsh-playground.wasm`, sem rolldown) e o executa no mecanismo JavaScript do navegador a cada pausa na digitação. Toda demo deste site tem um link **Editar no Playground**, e **Compartilhar** coloca o código no próprio link, de modo que nada é armazenado em um servidor.

Um app do Playground é um único módulo: ele importa os módulos do NSH (`nsh` e `nsh/*`), mas nenhum outro arquivo ou pacote. A saída e os erros de `console.log` aparecem abaixo do celular.

O compilador também é uma função Rust, `nsh_bundler::compile_module(name, source, ui_sets)`, disponível sem a feature `bundle` do crate.

<a id="embed-it-in-a-page"></a>

## Incorpore em uma página

Um app Rust é incorporado como seu site publicado, em um [iframe](#embed-it-with-an-iframe). Para TSX, `nsh.js` é um módulo ES. `createPlayer` carrega o runtime em um contêiner; `runModule(url)` inicia um bundle que `nsh build` grava (`bundle.js`, um módulo ES) no mecanismo JavaScript do navegador, em um realm próprio do app, substituindo o que estava em execução. Ele retorna uma promise que é resolvida quando o módulo é carregado e rejeitada com o erro que o interrompeu, o qual o player também reporta (`onError`):

```js
import { createPlayer } from "./nsh.js";

const player = await createPlayer(document.querySelector("#phone"), {
  wasm: "./nsh.wasm",
  assetBase: "./assets/",   // where `asset:/…` URIs (image imports) are served from
  // dark: true,            // force an appearance; otherwise it follows the system
  // idiom: "phone",        // force "phone", "pad" or "desktop"; otherwise the pointer and the size decide
  // history: false,        // pages and dialogs as browser history entries; by default only when the app is the page, not in an iframe
  // dialogs: "viewport",   // Dialog, Sheet and AlertDialog over the whole browser window; by default over the container
});
await player.runModule(new URL("./bundle.js", location.href).href);
```

`assets` (um mapa de caminhos de `asset:/` para URLs) substitui `assetBase`, `readAsset(uri)` retorna os bytes de um asset de que o engine precisa imediatamente (uma fonte) ou `null`, `data` mapeia os arquivos que o runtime busca na primeira vez que precisa deles para suas URLs (`syntaxes`: `nsh-syntaxes.<digest>.bin`; por padrão, `nsh-<name>.bin` ao lado de `nsh.js`), e `glue` é a URL do glue wasm-bindgen de um runtime cujos crates chamam [APIs do navegador a partir de Rust](#browser-apis-from-rust) (`nsh-bindgen.<digest>.js`), que o player carrega junto com o runtime; `player.runModule(url, { capabilities, appId })` executa o app sob as capacidades que ele declara (seu `capabilities.json`) e mantém seu armazenamento sob o id `nsh.json` (sem um, sob o caminho da página). A página que `nsh package --target web` grava usa todos eles.

`runModule(url, { chunks })` também recebe o local dos chunks de um [bundle dividido](#split-bundles).

`player.runSource(code, { name, sourceMap, capabilities, appId })` executa um módulo ES fornecido como texto-fonte, com as mesmas opções. Com `nsh-playground.wasm`, `player.compileAndRun(tsx, name, options)` compila o TSX primeiro, o executa com as opções de `runSource` e resolve para o erro de compilação, ou `null`; `player.compile(tsx)` retorna `{ code }` ou `{ error }`.

O tamanho do contêiner é a janela do app (`windowSize()`); redimensionar o contêiner redimensiona o app. `player.setDark(true)` alterna a aparência em tempo de execução, que os apps observam por meio das classes `colorScheme()` e `dark:`.

Diálogos e alertas cobrem o contêiner. Com `dialogs: "viewport"` eles cobrem a janela inteira do navegador, como os diálogos modais da própria página, enquanto o app mantém o contêiner como sua janela: um `Dialog` é disposto no tamanho e na área segura da janela e desliza a partir da borda inferior, seu backdrop cobre a página inteira e a roda do mouse sobre ele não rola a página. O diálogo aparece na top layer do navegador (Chrome 114, Safari 17, Firefox 125 e posteriores), ficando acima do restante da página onde quer que o contêiner esteja; em navegadores anteriores, ele cobre o contêiner.


`Sheet` segue a mesma configuração de apresentação que `Dialog` e `AlertDialog`. Em um iframe de mesma origem, a apresentação na viewport cobre automaticamente a página externa, enquanto o app mantém seu tamanho de layout original. O iframe volta à posição e ao tamanho originais quando o último popup é fechado; seu engine e seu estado permanecem ativos. As demos da documentação ativam essa apresentação.

Para um iframe de origem cruzada ou em sandbox, a página que o incorpora registra o host antes de carregar o player:

```js
import { hostPlayerFrame } from "./nsh.js";
const frame = document.querySelector("iframe");
const disconnect = hostPlayerFrame(frame);
frame.src = "https://apps.example.com/player.html"; // player uses dialogs: "viewport"
// When removing the embedding: disconnect();
```

O host aceita requisições da janela desse iframe, mantém a página ao redor inerte e bloqueia sua rolagem enquanto um popup está visível, e restaura ambos ao fechar. Cada limite de incorporação de origem cruzada exige a cooperação de seu host; sem ela, a apresentação permanece dentro daquele documento e o player reporta um aviso.

<a id="the-hosts-functions"></a>

## As funções do host

Na web, a página é o host do app: ela responde a `host.call(name, args)` de [`host`](../modules/nsh.md#host) e envia os eventos que `host.on` escuta. `host` de `createPlayer` é um objeto cujo `call(name, args)` retorna o resultado, ou uma promise dele; um throw ou uma rejeição rejeita a chamada do app com a mensagem do erro. `player.hostEvent(event, payload)` envia um evento com um payload JSON (um payload que não seja JSON lança uma exceção). Com um `host`, `host.available()` é `true`.

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: {
    async call(name, args) {
      if (name === "user.info") return { name: "Ada" };
      throw new Error(`no host function ${name}`);
    },
  },
});
player.hostEvent("theme", { dark: true });
```

Um app publicado obtém seu host de `nsh.json`: `web.host` nomeia um módulo JS no diretório do app, relativo a `nsh.json`, que exporta `createHost(player)`. `nsh package --target web` o copia para o site como `host.<digest>.js`, e a página executa `createHost` com o player antes de o app iniciar; o que ela retornar (ou resolver) deve ter uma função `call`, ou a página mostra que o app não pôde ser carregado. O player `createHost` recebe passa a enviar eventos a partir daí:

```json
{
  "capabilities": {
    "host": ["user.*"]
  },
  "web": { "host": "./host.js", "connect": ["api.example.com"] }
}
```

```js
// host.js
const post = (url) => (args) =>
  fetch(url, { method: "POST", body: JSON.stringify(args) }).then((r) => r.json());

// The functions the app may call, by their exact names.
const functions = new Map([
  ["user.info", post("https://api.example.com/user/info")],
  ["user.settings", post("https://api.example.com/user/settings")],
]);

export async function createHost(player) {
  addEventListener("online", () => player.hostEvent("online", {}));
  return {
    call(name, args) {
      const f = functions.get(name);
      if (!f) throw new Error(`no host function ${name}`);
      return f(args);
    },
  };
}
```

O host procura cada nome exatamente como ele é em uma tabela de suas funções, como acima, e mantém suas URLs e caminhos como algo seu: `capabilities.host` concede nomes pelo início (`user.*`), então um nome que o host transformasse em um caminho poderia alcançar o que a concessão deixa de fora. O runtime repassa nomes de 1 a 128 caracteres entre `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` e `-`, sem `..`, e rejeita a chamada de qualquer outro nome. Uma concessão por prefixo termina com um separador (`bridge.*`): `bridge*` também corresponde a `bridgeAdmin`.

Eventos enviados antes de o app executar, como os do próprio `createHost`, são entregues em ordem assim que ele inicia, de modo que os listeners `host.on` de nível superior do app os recebem. Um evento enviado antes de um listener ser registrado não é reenviado a ele: um app lê o estado com o qual inicia por meio de uma chamada (`host.call("user.info")`) e acompanha suas mudanças por meio de eventos.

O módulo do host executa na página do app e compartilha sua Content-Security-Policy: quando as capacidades do app restringem `network`, o `connect-src` da página contém a origem da página, os hosts que `capabilities.network` lista e os hosts que `web.connect` lista. `web.connect` nomeia os hosts que as próprias requisições do módulo do host (`fetch`, `XMLHttpRequest`, `WebSocket`) alcançam, como padrões iguais aos de `capabilities.network.hosts` (`api.example.com`, `*.example.com`, `"*"`), como em `api.example.com` acima; as requisições do próprio app continuam sendo verificadas em relação ao seu `capabilities`.

O módulo é copiado como está, então ele importa outro código por URL absoluta. O app ainda precisa de sua [capacidade](./sandbox-and-capabilities.md) `host` para cada função que chama. `nsh run --target web` o executa na página de desenvolvimento, e `nsh test` executa o mesmo módulo para cada app que seus testes abrem, headless ou em um navegador (`--target web`), de modo que o app e seu host são testados juntos ([Testes](./testing-and-trace.md#the-pages-host)).

<a id="the-browser-as-a-platform"></a>

## O navegador como plataforma

`platform.os` é `"web"`. O tipo de dispositivo em que o navegador está determina como o app se comporta, conforme `platform.idiom`:

- `"desktop"`: um mouse (um ponteiro fino que permite hover) e um contêiner com pelo menos 600 pontos de largura. `platform.desktop` é `true`, `platform.select` escolhe `desktop` e as props `desktop={{…}}` se aplicam.
- `"pad"`: uma tela sensível ao toque cujo lado menor tem pelo menos 600 pontos; `"phone"` caso contrário. Estes são mobile: `platform.select` escolhe `mobile`.

O idiom é decidido quando o app inicia e permanece o mesmo enquanto ele executa, como em todas as plataformas; uma janela de desktop estreita continua sendo um desktop, com layout para seu `windowSize()`. Props `web={{…}}`, classes `platform.select({ web })` e `web:` se aplicam somente em navegadores; `ios={{…}}`, `native` e `ios:` não se aplicam ali.

A página reporta o restante do ambiente e o mantém atualizado:

| Valor | Vindo do navegador |
|---|---|
| Locale (padrão de `Intl`) | `navigator.languages[0]` |
| Fuso horário (hora local de `Date`, `timeZone` padrão de `Intl`) | o do navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`), incluindo horário de verão |
| A direção do layout (`rtl:` / `ltr:`) | `<html dir>` quando definido, senão o script do locale |
| `reduceMotion()` | `prefers-reduced-motion` |
| `fontScale()` | o tamanho da fonte do elemento raiz / 16 px (a configuração de tamanho de texto do navegador) |
| `pixelRatio()` | `devicePixelRatio` (muda com zoom e telas) |
| `colorScheme()` | `prefers-color-scheme` |
| `safeArea()` | `env(safe-area-inset-*)` onde se sobrepõe ao contêiner (páginas `viewport-fit=cover` em celulares) |
| `keyboardFrame()` | quanto do contêiner o teclado na tela cobre (`visualViewport`) |

`platform.version` é `"0.0"`, e `screenReaderEnabled()` permanece `false` (os navegadores não informam). As barras do navegador ao redor da página pertencem ao navegador; o [`statusBar`](../modules/nsh-base.md#status-bar) de uma página é para os celulares.

<a id="networking"></a>

## Rede

URLs `fetch` (com streams, `AbortController` e `FormData`) e `<Image>` passam pela pilha de rede do próprio navegador, depois que o NSH verifica as [capacidades](./sandbox-and-capabilities.md) do app. Como as requisições são do navegador, valem as regras do navegador:

- **URLs relativas** são resolvidas em relação à URL da página, como no navegador: um app publicado acessa sua própria API com `fetch("/api/items")`, e `<Image src="/photos/a.jpg" />` carrega do seu próprio servidor. (As plataformas nativas não têm página, então precisam de URLs absolutas.)
- **CORS.** Uma requisição para uma origem diferente da da página só tem sucesso se esse servidor permitir a origem da página (`Access-Control-Allow-Origin`); caso contrário, `fetch` é rejeitado com um erro de rede. Apenas os cabeçalhos de resposta que o servidor expõe ficam visíveis.
- **Cookies** (e autenticação HTTP) são enviados somente para a origem da própria página (`credentials: "same-origin"`), e os cabeçalhos que os navegadores proíbem (`Cookie`, `User-Agent`, `Host`, ...) são descartados.
- **Redirecionamentos** são seguidos pelo navegador. Uma requisição redirecionada que não deve segui-lo falha: `redirect: "manual"` e `"error"`, e requisições de um app cujas capacidades restringem `network` (o NSH verifica cada salto, e os navegadores não revelam um redirecionamento antes de segui-lo).
- **Corpos de requisição** que são um `ReadableStream` são coletados primeiro e enviados de uma só vez; os corpos de resposta chegam em streaming conforme são recebidos.
<a id="split-bundles"></a>

## Bundles divididos

Um app web em TSX não precisa baixar todo o seu código antes de mostrar a primeira tela (um app em Rust é um único `nsh.wasm`, que o navegador compila enquanto baixa). `nsh package --target web` publica apps TSX divididos, com cada chunk como `<name>.<digest>.js` e a página mapeando os chunks para esses arquivos. Para dividir um bundle você mesmo, `nsh build --split` coloca os módulos que `import()` carrega em chunks próprios, ao lado de `bundle.js`:

```sh
nsh build --release --split -o site/app
# bundle.js        the app up to its first screen
# Screen.js        import("./Screen") and what only it uses
# detail.js        what two chunks share, when they do (made by the bundler)
```

O primeiro `import("./Screen")` baixa `Screen.js` e os chunks que ele importa, todos de uma vez, e então os avalia; importações posteriores dele são resolvidas imediatamente. A página informa onde estão os chunks: por padrão, ao lado do bundle, ou uma URL por chunk, para arquivos renomeados com um digest de conteúdo, de modo que uma CDN possa armazená-los em cache para sempre:

```js
await player.runModule(entry, {
  chunks: { "Screen.js": "/app.3f2a9c.js", "detail.js": "/app.81bb07.js" },
});
```

Um chunk que não pode ser baixado rejeita o `import()` com um `TypeError` que o nomeia; o próximo `import()` tenta novamente. Os nomes dos chunks são nomes de arquivo fixos do bundle: o app não pode fazer a página baixar nada além disso.

A [galeria](/gallery) carrega cada demo dessa forma: `lazy` (em `examples/gallery/ui.tsx`) cria um componente que inicia a importação na primeira vez que é renderizado, mostra um placeholder até que ela seja resolvida e então renderiza o que foi carregado. Seu primeiro carregamento é o índice e a demo exibida primeiro; uma fonte que uma demo importa vem junto com o chunk dessa demo. As builds nativas contêm todos os módulos, então nelas a importação é resolvida imediatamente:

```tsx
const Stocks = lazy(() => import("./demos/Stocks").then((m) => m.Stocks));
```

<a id="limits"></a>

## Limites

O navegador define estes limites, e o backend web os segue:

- **Web views de outros sites**: `WebView` é um `<iframe>`. O HTML inline (`html`) recebe tudo: `onMessage`, `postMessage`, `injectJavaScript`, os scripts injetados e os eventos de carregamento (ele é executado com uma origem própria, separada da página). Uma página de outro site recebe apenas `postMessage` e eventos de carregamento com a URL que lhe foi dada: os navegadores ocultam suas navegações, título, histórico e erros da página ao redor, e `userAgent` não pode ser definido.
- **Vídeos com som que iniciam sozinhos**: `Video` é um `<video>` com todas as props e eventos, mas os navegadores só iniciam um vídeo com som após um gesto do usuário (vídeos sem som são reproduzidos).
- **Componentes nativos**: os componentes nativos registrados pertencem aos apps nativos que incorporam o NSH; na web, sua view permanece vazia, com um aviso no console.
- **Serviços da plataforma**: ler a área de transferência (`Clipboard.readText`, também `hasText`) requer um contexto seguro (HTTPS) e pode pedir permissão ao usuário. As imagens não informam `onProgress`.
- **Detalhes de modelagem de texto**: a quebra de linha é um subconjunto da UAX #14 (espaços, CJK, hifens e as regras de início e fim de linha da pontuação CJK: marcas de fechamento como `。`, `，` e `」` não ficam no início de uma linha, marcas de abertura como `（` e `「` não ficam no fim), sem hifenização e sem reordenação bidirecional além da direção do parágrafo.

O player e o servidor de desenvolvimento executam os apps com configurações de desenvolvimento; os apps publicados são executados como releases. Ambos executam o código de um app TSX no motor JavaScript do navegador, em um realm próprio do app.

<a id="see-also"></a>

## Veja também

- [Empacotamento](./packaging.md): os outros destinos de `nsh package`.
- [Arquitetura](./architecture.md): o motor, o núcleo e os lotes de montagem que a build web reutiliza.
- [Testes](./testing-and-trace.md): `nsh test` executa o mesmo motor em modo headless, com um motor de texto aproximado.
