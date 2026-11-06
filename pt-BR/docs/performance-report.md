---
title: "Relatório de desempenho"
description: "Números medidos de apps NSH - custos de commit e de frame a partir das baselines do NSH, e a taxa de quadros, o uso de CPU e de memória da galeria página por página no Linux, macOS, Windows e iOS - com instruções de como reproduzi-los."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---


# Relatório de desempenho

O custo dos apps NSH, medido. Como o NSH os mantém rápidos e como medir o seu próprio app está em [Desempenho](./performance.md).

<a id="baselines"></a>

## Linhas de base

A partir das linhas de base do próprio NSH (Apple silicon, salvo indicação em contrário):

| Cenário | Números |
|---|---|
| App contador, headless (debug) | Primeiro quadro ~0,5–0,65 ms (58 ops / 49 itens de montagem); um toque ~0,15 ms |
| App contador, Mac Catalyst (release) | Primeiro quadro ~1,05–1,15 ms (cerca de 0,7 ms disso para dispor 10 textos com CoreText pela primeira vez); um toque ~0,12 ms |
| Lista de fotos da galeria, headless (debug) | Primeiro quadro 653 ops / 224 nós, ~2,7 ms |
| Rolagem da lista de fotos, Catalyst (release) | Refazer o bind de uma linha durante uma rolagem lenta ~0,4 ms; uma tela inteira de ~32 linhas em um fling rápido 0,9–1,6 ms |
| Rolagem da lista de fotos, emulador Android (arm64, release) | Refazer o bind de uma linha ~0,3–0,4 ms (JS ~60 µs) |
| Inicialização do engine (release) | ~75–155 µs; as APIs globais (`fetch`, `URL`, ...) não custam nada até o primeiro uso, depois ~90 µs |
| Hot reload | ~120 ms entre salvar um arquivo e a nova versão estar em execução; aplicar a atualização leva 0,2–0,5 ms |

## Linux (GTK 4)

Medido em um desktop Linux (x86_64, 24 threads, GPU NVIDIA), builds de release, a galeria em uma janela de 1896 × 1030 em um
display de 120 Hz, com cada leitura feita automaticamente por `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`,
uma linha por segundo; a CPU é a do processo inteiro, em porcentagem de um núcleo). *Frame p95* é o tempo da thread principal por
quadro desenhado no percentil 95: abaixo de 8,3 ms, um quadro cabe em um refresh de 120 Hz.

<a id="animated-demos"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 sparklines ao vivo, um gráfico intradiário, livro de ofertas, fita | 117–120 | 5–6 ms | 25–29% (1200 × 800), 28–32% (1896 × 1030) |
| Stocks, com a janela preenchendo um display 4K de 144 Hz a 1,6× | 143–145 | 4,1–4,4 ms | 26–29% |
| Canvas: um medidor, um relógio, uma matriz de pontos | 120 | 2,6–4,4 ms | 5–10% |
| Animations: três loops nativos, springs, sequências | 120 | 2,0 ms | 12–13% |

</div>

<a id="every-page"></a>

### Todas as páginas

Todas as páginas da galeria, ao abrir e enquanto o teste as rola, em uma janela de 1200 × 800 em um display de 144 Hz (a
mesma máquina). O NSH só desenha um quadro quando algo na tela muda, então *FPS* aqui é a taxa enquanto algo
se move: um quadro por intervalo mediano entre quadros desenhados (`perf.py`, `moving`); nos 144 do display, cada quadro de uma
animação ou de uma rolagem chega um refresh depois do anterior. *Acima de um refresh* é a parcela de quadros que levaram mais
que um refresh (6,9 ms). GIF e WebP em Images tocam em suas próprias taxas de quadros (cerca de 50 FPS aqui), assim como o vídeo. Physics, Overlays e Menus são curtas: em 1200 × 800 uma rolagem chega ao fim em poucos quadros, então elas são medidas em uma janela de 900 × 500, onde têm espaço para rolar.

<div class="data-table">

| Página | Origem dos quadros | FPS | Frame p95 | Acima de um refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dados ao vivo, loops nativos | 144 | 4,1 ms | 0% | 26% |
| Stocks, rolagem | Dados ao vivo, rolagem | 144 | 4,1 ms | 0% | 25% |
| Photos, rolagem | Rolagem | 144 | 2,8 ms | 2% | 9% |
| Lists, rolagem | Rolagem | 143 | 1,7 ms | 0% | 7% |
| Scrolling, rolagem | Rolagem | 144 | 1,6 ms | 1% | 4% |
| Navigation, rolagem | Rolagem | 143 | 1,7 ms | 0% | 2% |
| Form, rolagem | Rolagem | 144 | 1,3 ms | 0% | 4% |
| Resizable, rolagem | Rolagem | 143 | 0,6 ms | 0% | 1% |
| Dock, rolagem | Rolagem | 142 | 0,5 ms | 1% | 1% |
| Gestures | Springs, um anel pulsante | 144 | 1,6 ms | 0% | 1–5% |
| Physics, rolagem | Rolagem (janela de 900 × 500) | 144 | 1,6 ms | 1% | 1% |
| Animations | Loops nativos | 144 | 2,6 ms | 0–1% | 5% |
| Canvas, rolagem | Rolagem, loops nativos | 144 | 4,2 ms | 0% | 1–4% |
| Styles, rolagem | Rolagem | 144 | 2,3 ms | 2% | 3% |
| Tailwind | Utilitários `animate-*` | 144 | 1,7 ms | 0% | 3–8% |
| Text, rolagem | Rolagem | 144 | 1,9 ms | 0% | 4% |
| Text View, rolagem | Rolagem | 141 | 1,8 ms | 2% | 7% |
| Images, rolagem | Rolagem, quadros de GIF e WebP | 143 | 2,9 ms | 2% | 8% |
| Components, rolagem | Rolagem | 144 | 1,4 ms | 0% | 3% |
| Overlays, rolagem | Rolagem (janela de 900 × 500) | 144 | 1,7 ms | 0% | 2% |
| Menus, rolagem | Rolagem (janela de 900 × 500) | 144 | 1,9 ms | 0% | 2% |
| Controls | Transições | 144 | 0,9 ms | 0% | 1–4% |
| Web e vídeo | Quadros de vídeo, a página | 135–142 | 1,0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### Memória

Em repouso, 3 s após a inicialização (runners de release, janela de 480 × 640). *Private* é a memória que pertence apenas ao processo (USS);
*resident* soma as páginas das bibliotecas compartilhadas (GTK, o driver da GPU), que todo app GTK na máquina compartilha:

<div class="data-table">

| App | Renderizador | Private (USS) | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | GL (`ngl`) | ~49 MB | ~142 MB |
| App Rust | Cairo (`GSK_RENDERER=cairo`) | ~28 MB | ~95 MB |
| Contador TSX (`examples/counter`) | GL | ~79 MB | ~166 MB |
| Janela GTK 4 com um label, como referência | Vulkan / Cairo | ~62 / ~40 MB | ~132 / ~109 MB |

</div>

Revisitar uma página não acrescenta memória; a primeira visita a uma página faz o processo crescer pelo que ele mantém em cache de propósito (imagens
decodificadas, limitadas a 128 MB) e pelas bibliotecas que carrega no primeiro uso (WebKitGTK para web views).

<a id="app-size"></a>

### Tamanho do app

Um app hello world criado por `nsh init` com cada template, e dois apps usados por pessoas, como `nsh package --target linux`
os compila para x86_64. O runner é o único executável do app; o pacote é o `.tar.gz` no qual ele é distribuído. Os hello
worlds são compilados com link-time optimization e stripped (`CARGO_PROFILE_RELEASE_LTO=fat`,
`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| App | Escrito em | Runner | Pacote |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16,5 MB | 7,5 MB |
| Hello world (`--template ts`) | TSX, sobre QuickJS | 25,7 MB | 11,6 MB |
| Hello world (`--template mixed`) | TSX e um crate Rust | 25,8 MB | 11,7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20,9 MB (stripped) | 9,7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22,3 MB | 9,8 MB |

</div>

Os runners TSX contêm o runtime QuickJS, os módulos nativos e o renderizador; o código do app em si é o seu bundle, ao lado do
runner, com menos de 1 KB em um hello world.

O que explica esses números:

- **O renderizador**: com o driver da NVIDIA, o NSH desenha com o renderizador GL do GSK, cujos quadros custam uma fração dos do
  renderizador Vulkan nesse caso (a demo Animations: ~1 ms de desenho por quadro em vez de ~9,5 ms). `GSK_RENDERER` ainda escolhe.
- **Rasters do canvas**: cada canvas é rasterizado uma vez em tiles de 256 px mantidos na GPU. Um valor animado redesenha apenas
  a área que as operações que o leem cobrem, sobre os pixels mantidos da parte estática do desenho; um canvas fora de vista
  espera até rolar para dentro da visão.
- **Paths postos de lado uma vez**: `fillRect` e `fillText` depois de um path longo o deixam no lugar até que seja usado de novo (uma
  linha de 400 pontos e depois 240 barras: 0,63 ms).

## macOS (AppKit)

Medido em um MacBook Pro (Apple M3, 24 GB) em seu display ProMotion integrado de 120 Hz, builds de release, a galeria em
uma janela de 1200 × 800, com cada leitura feita automaticamente por `examples/gallery/tools/perf.py` (`nsh test --target macos
--fps`, uma linha por segundo; a CPU é a do processo inteiro, em porcentagem de um núcleo, e a GPU, sua parcela da GPU). As fases são
as da thread principal por quadro: *tick* (as animações nativas do display link) e *canvas* (a reprodução dos desenhos).

<a id="animated-demos-1"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 sparklines ao vivo, um gráfico intradiário, livro de ofertas, fita | 120 | 2,7–3,7 ms | 33–36% | 18–22% |
| Canvas: um medidor, um relógio, uma matriz de pontos | 119–120 | 0,6–0,7 ms | 4–7% | 0% |
| Animations: três loops nativos, springs, sequências | 119–120 | 0,3–1,6 ms | 5–8% | 0% |

</div>

Em Stocks, o tempo da thread principal por quadro é de ~1,6 ms de ticks, dos quais ~0,45 ms reproduzem as partes animadas dos canvases;
o Core Animation desenha o restante de cada canvas em suas próprias threads.

<a id="every-page-1"></a>

### Todas as páginas

Todas as páginas da galeria, ao abrir e enquanto o teste as rola, na mesma janela de 1200 × 800. Como no Linux, *FPS*
é a taxa enquanto algo se move (um quadro por intervalo mediano entre quadros desenhados); nos 120 do display, cada quadro
de uma animação ou de uma rolagem chega um refresh depois do anterior. *Acima de um refresh* é a parcela de quadros que levaram
mais que um refresh (8,3 ms). Uma página em repouso não desenha quadros e usa de 2 a 5% de CPU. GIF e WebP em Images tocam no Core
Animation e o vídeo no AVFoundation, em suas próprias taxas de quadros.

<div class="data-table">

| Página | Origem dos quadros | FPS | Frame p95 | Acima de um refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dados ao vivo, loops nativos | 120 | 3,2 ms | 0% | 35% |
| Stocks, rolagem | Dados ao vivo, rolagem | 120 | 3,5 ms | 0% | 36% |
| AI Chat, rolagem | Rolagem | 120 | 2,4 ms | 1% | 5% |
| Photos, rolagem | Rolagem | 120 | 1,4 ms | 0% | 10% |
| Lists, rolagem | Rolagem | 120 | 1,6 ms | 0% | 8% |
| Scrolling, rolagem | Rolagem | 120 | 2,7 ms | 0% | 6% |
| Navigation, rolagem | Rolagem | 120 | 0,2 ms | 0% | 4% |
| Form, rolagem | Rolagem | 120 | 0,6 ms | 0% | 5% |
| Resizable, rolagem | Rolagem | 120 | 0,3 ms | 0% | 4% |
| Dock, rolagem | Rolagem | 120 | 0,3 ms | 1% | 5% |
| Gestures | Springs, um anel pulsante | 120 | 0,4 ms | 0% | 4% |
| Physics, rolagem | Rolagem | 120 | 0,3 ms | 0% | 4% |
| Animations | Loops nativos | 120 | 0,3 ms | 0% | 5% |
| Canvas, rolagem | Rolagem, loops nativos | 120 | 1,2 ms | 0% | 7% |
| Styles, rolagem | Rolagem, uma transformação oscilante | 120 | 1,0 ms | 0% | 6% |
| Tailwind | Utilitários `animate-*` | 120 | 0,5 ms | 0% | 4% |
| Text, rolagem | Rolagem | 120 | 0,3 ms | 0% | 5% |
| Text View, rolagem | Rolagem | 120 | 0,7 ms | 0% | 5% |
| Images, rolagem | Rolagem | 120 | 0,4 ms | 0% | 5% |
| Components, rolagem | Rolagem | 120 | 0,3 ms | 0% | 5% |
| Overlays, rolagem | Rolagem | 120 | 0,3 ms | 0% | 4% |
| Menus, rolagem | Rolagem | 120 | 0,3 ms | 0% | 5% |
| Controls | Transições | 120 | 0,3 ms | 0% | 4% |
| Web e vídeo, rolagem | Rolagem | 120 | 0,2 ms | 0% | 6% |
| System | `requestAnimationFrame`, timers | 120 | 0,2 ms | 0% | 3% |
| Standard APIs, rolagem | Rolagem | 120 | 0,3 ms | 0% | 5% |
| Storage, rolagem | Rolagem | 120 | 0,3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### Memória

Em repouso, 3 s após a inicialização (runners de release). *Footprint* é a memória que o macOS atribui ao processo (o que o Activity
Monitor mostra); *resident* soma as páginas das bibliotecas compartilhadas do sistema:

<div class="data-table">

| App | Janela | Footprint | Resident (RSS) |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | 1200 × 800 | ~19 MB | ~86 MB |
| Contador TSX (`examples/counter`) | 1200 × 800 | ~20 MB | ~89 MB |
| Janela AppKit com um label, como referência | 480 × 640 | ~17 MB | ~80 MB |

</div>

Ao longo do tour da galeria, o processo mantém de 84 a 230 MB até a página Canvas e ~350–360 MB a partir da página Text View,
com o que ele mantém em cache de propósito (imagens decodificadas, limitadas a 128 MB; os documentos da página Text View) e os
frameworks que carrega no primeiro uso (WebKit para web views); os rasters da página Canvas, até ~310 MB com os três
canvases na tela, são liberados quando a página fecha.
<a id="app-size-1"></a>

### Tamanho do app

Os apps hello world criados por `nsh init` com cada template, como `nsh package --target macos` os compila para Apple
silicon (arm64), com link-time optimization e stripped como no Linux, e os dois apps acima como são distribuídos para Apple
silicon. O executável é o runner dentro do `.app`; o zip é o `.app` compactado (`ditto -c -k`):

<div class="data-table">

| App | Escrito em | Executável | Compactado `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12,4 MB | 6,0 MB |
| Hello world (`--template ts`) | TSX, no QuickJS | 19,8 MB | 9,5 MB |
| Hello world (`--template mixed`) | TSX e um crate Rust | 19,8 MB | 9,5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21,6 MB | 8,4 MB (`.tar.gz` da sua release) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18,4 MB | 9,7 MB (`.tar.gz` da sua release) |

</div>

O que explica esses números:

- **Quadros só para mudanças**: o display link dispara enquanto uma animação nativa roda e para junto com ela; uma
  animação para com a sua página (a exclusão da sua view encerra seus keyframes, um loop para no `cleanup` do seu componente).
- **Canvases desenhados onde custam menos**: um canvas que pinta com frequência (uma animação, dados ao vivo) desenha nas
  threads do Core Animation (`drawsAsynchronously`), o que mantém a thread principal livre; um canvas redesenhado de vez em quando desenha
  imediatamente, sem a memória gráfica que o desenho assíncrono retém. Um valor animado redesenha apenas a área coberta
  pelas operações que o leem.
- **Partes estáticas do canvas mantidas**: quando um desenho permanece inalterado, uma parte longa antes da sua primeira
  operação animada é mantida como uma layer; a cada quadro, essa layer é desenhada e apenas o restante animado é
  reexecutado, imediatamente na thread principal (o medidor, o relógio e a matriz de pontos da página Canvas: nenhum
  trabalho de GPU e metade da memória).
- **Conteúdo desenhado quando muda**: textos e canvases desenham em layers próprias, de novo quando o conteúdo ou o
  tamanho muda, não quando se movem ou rolam.

## Windows (Win32, Direct2D)

Medido em um desktop com Windows 11 (Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti) com um display 4K de
144 Hz a 150%, builds de release, a galeria em uma janela de 1200 × 800 (1800 × 1200 pixels), cada leitura feita
automaticamente por `examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, uma linha por segundo; a CPU é a do processo inteiro, em
porcentagem de um núcleo). As fases são as da thread principal por quadro: *paint* (o Direct2D desenhando a janela) e,
dentro dela, *canvas* (gravação e reexecução de desenhos).

<a id="animated-demos-2"></a>

### Demos animadas

<div class="data-table">

| Demo | FPS | Frame p95 | Paint / canvas por quadro | CPU |
|---|---|---|---|---|
| Stocks: 22 sparklines ao vivo, um gráfico intradiário, livro de ofertas, tape | 144 | 3,7–4,3 ms | 1,4 / 0,13 ms | 36–43% |
| Canvas: um medidor, um relógio, uma matriz de pontos | 144 | 1,0–2,0 ms | 0,8–1,4 / 0,05 ms | 21–35% |
| Animations: três loops nativos, springs, sequências | 144 | 1,0–3,6 ms | 0,9–1,9 ms | 20–41% |

</div>

Stocks faz de 16 a 17 commits por segundo, cada um em até 2,1 ms de JS e 1,7 ms do core na thread do engine (p95).

> [!NOTE]
> Páginas cujas animações movem views por áreas grandes consomem mais CPU aqui do que no Linux e no macOS (Animations
> 20–41% contra 5–13%, Gestures 36% contra 1–5%). Um quadro no Windows desenha de novo, com o Direct2D na thread
> principal, todas as views nas áreas que mudaram: um anel que cresce redesenha o card sob ele a cada quadro. No macOS, o
> Core Animation move, escala e faz fade das layers que mantém na GPU sem desenhá-las de novo, e no Linux o GSK mantém os
> render nodes do que não mudou. Os números também contam 144 quadros por segundo a 1800 × 1200 pixels.

<a id="every-page-2"></a>

### Todas as páginas

Todas as páginas da galeria, ao abrirem e enquanto o teste as rola, na mesma janela de 1200 × 800. Como no Linux e no
macOS, *FPS* é a taxa enquanto algo se move (um quadro por intervalo mediano entre quadros desenhados); a 144 do display,
cada quadro de uma animação ou de uma rolagem vem um refresh depois do anterior. *Mais de um refresh* é a proporção de
quadros que levaram mais que um refresh (6,9 ms). Uma página em repouso não desenha quadros e usa de 0 a 2% de CPU. Os
GIF e WebP de Images rodam em suas próprias taxas de quadros (cerca de 40 FPS aqui). Physics, Overlays, Menus e Storage
são medidas em uma janela de 900 × 500, onde há espaço para rolar.

<div class="data-table">

| Página | Origem dos quadros | FPS | Frame p95 | Mais de um refresh | CPU |
|---|---|---|---|---|---|
| Stocks | Dados ao vivo, loops nativos | 144 | 3,9 ms | 0% | 36% |
| Stocks, scrolling | Dados ao vivo, rolagem | 144 | 4,3 ms | 0% | 43% |
| Photos, scrolling | Rolagem | 143 | 2,1 ms | 0% | 9% |
| Lists, scrolling | Rolagem | 144 | 2,0 ms | 1% | 19% |
| Scrolling, scrolling | Rolagem | 143 | 2,1 ms | 0% | 7% |
| Navigation, scrolling | Rolagem | 144 | 0,8 ms | 0% | 9% |
| Form, scrolling | Rolagem | 144 | 0,8 ms | 0% | 12% |
| Resizable, scrolling | Rolagem | 143 | 0,4 ms | 0% | 4% |
| Dock, scrolling | Rolagem | 144 | 0,5 ms | 1% | 5% |
| Gestures | Springs, um anel pulsante | 144 | 1,8 ms | 0% | 36% |
| Physics, scrolling | Rolagem (janela de 900 × 500) | 144 | 0,8 ms | 0% | 4% |
| Animations | Loops nativos | 144 | 1,0 ms | 0% | 28% |
| Canvas, scrolling | Rolagem, loops nativos | 144 | 2,0 ms | 0% | 35% |
| Styles, scrolling | Rolagem, uma transformação oscilante | 144 | 2,1 ms | 0% | 39% |
| Tailwind | Utilitários `animate-*` | 144 | 0,6 ms | 0% | 19% |
| Text, scrolling | Rolagem | 144 | 1,6 ms | 0% | 8% |
| Text View, scrolling | Rolagem | 144 | 1,1 ms | 0% | 10% |
| Images, scrolling | Rolagem, quadros de GIF e WebP | 143 | 4,8 ms | 2% | 23% |
| Components, scrolling | Rolagem | 144 | 1,0 ms | 1% | 11% |
| Overlays, scrolling | Rolagem (janela de 900 × 500) | 144 | 0,6 ms | 0% | 1% |
| Menus, scrolling | Rolagem (janela de 900 × 500) | 144 | 0,6 ms | 0% | 2% |
| Controls | Transições | 117–144 | 1,5 ms | 0% | 22% |
| Web and video, scrolling | Rolagem | 144 | 1,6 ms | 0% | 15% |
| System | `requestAnimationFrame`, timers | 144 | < 0,1 ms | 0% | 1% |
| Storage, scrolling | Rolagem (janela de 900 × 500) | 144 | 0,5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### Memória

Em repouso, 3 s após a inicialização (runners de release, janela de 1200 × 800). *Private working set* é a memória que o
processo usa sozinho (coluna Memory do Task Manager); *private bytes* é o que ele tem alocado (committed); *working set*
soma as páginas das bibliotecas do sistema que ele compartilha com outros processos (Direct3D, Direct2D, DirectWrite, o
driver da GPU):

<div class="data-table">

| App | Private working set | Private bytes | Working set |
|---|---|---|---|
| App Rust (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| Contador em TSX (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

Ao longo do tour da galeria, o working set fica em ~108–115 MB em Stocks, ~230 MB a partir da página Canvas, ~320–340 MB
a partir da página Text View e ~390–405 MB depois que Web and video abre o WebView2 (cujas páginas rodam nos processos
próprios do WebView2), com o que ele guarda em cache de propósito (imagens decodificadas, limitadas a 128 MB; os
documentos da página Text View).

<a id="app-size-2"></a>

### Tamanho do app

Os apps hello world criados por `nsh init` com cada template, como `nsh package --target windows` os compila para x86_64
(os runners Rust com link-time optimization e stripped, como no Linux). O executável é o `<Name>.exe` do app;
o zip é o `.zip` gravado ao lado do seu diretório:

<div class="data-table">

| App | Escrito em | Executável | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15,0 MB | 6,7 MB |
| Hello world (`--template ts`) | TSX, no QuickJS | 28,6 MB | 12,4 MB |
| Hello world (`--template mixed`) | TSX e um crate Rust | 26,3 MB | 11,5 MB |

</div>

O que explica esses números:

- **Quadros só para mudanças, desenhados só onde mudaram**: o ticker sincronizado com o compositor roda enquanto uma
  animação nativa, uma transição ou um frame callback está em execução. Um quadro desenha as áreas das views que mudaram
  (onde estavam e onde estão), sobre os pixels que a janela mantém, e apresenta ao compositor apenas essas áreas
  (Stocks: ~34 views por quadro).
- **Canvases gravam sua parte animada**: um desenho é gravado como command lists do Direct2D, vetorial e nítido em
  qualquer escala. Quando um valor animado muda, apenas as operações a partir da primeira que lê um valor animado são
  gravadas de novo; o que vem antes é mantido (Stocks: ~26 ms de gravação por segundo para 22 sparklines pulsantes e o
  gráfico).
- **Só o que aparece é desenhado**: os filhos de uma scroll view ou de uma view com clipping que estão fora de vista ficam
  de fora do quadro, e views sem conteúdo próprio desenham apenas o fundo e a borda.

## iOS (UIKit)

Medido no simulador do iOS (um iPhone 18 Pro Max, no MacBook Pro acima), builds de release, com o mesmo tour
(`perf.py --target ios`: `nsh test --target ios --fps`, os toques de um dedo como o UIKit os recebe). O simulador apresenta
a 60 Hz; em um iPhone com tela ProMotion, os display links do NSH rodam a 120 Hz da tela (os apps que `nsh package`
compila e o host de desenvolvimento pedem isso com `CADisableMinimumFrameDurationOnPhone`). As fases são *tick* (animações
nativas), *drain* (aplicação dos batches do engine) e *scroll* (o que acompanha uma scroll view: listas, células sticky,
valores vinculados).

<div class="data-table">

| Página | Origem dos quadros | FPS | Frame p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | Rolagem | 60 | 0,1 ms | 6% |
| Stocks | Dados ao vivo, loops nativos | 60 | 0,3 ms | 22% |
| Stocks, scrolling | Dados ao vivo, rolagem | 60 | 0,3 ms | 25% |
| Photos, scrolling | Rolagem | 60 | 1,2 ms | 6% |
| Lists, scrolling | Rolagem | 60 | 1,1 ms | 8% |
| Scrolling, scrolling | Rolagem | 60 | 0,1 ms | 7% |
| Navigation, scrolling | Rolagem | 60 | 0,2 ms | 7% |
| Form, scrolling | Rolagem | 60 | 0,3 ms | 7% |
| Gestures | Springs, um anel pulsante | 60 | 0,3 ms | 3% |
| Animations | Loops nativos | 60 | 0,7 ms | 6% |
| Canvas | Loops nativos | 60 | 0,4 ms | 16% |
| Styles | Uma transformação oscilante | 60 | 0,4 ms | 4% |
| Tailwind, scrolling | Rolagem | 60 | 0,2 ms | 7% |
| Text, scrolling | Rolagem | 60 | 0,1 ms | 7% |
| Text View, scrolling | Rolagem | 60 | 0,1 ms | 6% |
| Images, scrolling | Rolagem | 60 | 0,1 ms | 5% |
| Components, scrolling | Rolagem | 60 | 0,2 ms | 6% |
| Overlays, scrolling | Rolagem | 60 | 0,1 ms | 6% |
| Menus, scrolling | Rolagem | 60 | 0,2 ms | 7% |
| Controls, scrolling | Rolagem, transições | 60 | 0,2 ms | 5% |
| Web and video, scrolling | Rolagem | 60 | 0,1 ms | 8% |
| System | `requestAnimationFrame`, timers | 60 | 0,3 ms | 4% |
| Standard APIs, scrolling | Rolagem | 60 | 0,1 ms | 7% |
| Storage, scrolling | Rolagem | 60 | 0,1 ms | 8% |

</div>

*FPS* é a taxa enquanto algo se move, como acima: a 60 do simulador, cada quadro vem um refresh depois do anterior.
Toda página sem nada se movendo não desenha quadros e usa de 1 a 2% de CPU em repouso. O processo ocupa 40 MB na página
inicial da galeria e ~180 MB depois do tour completo (imagens em cache de propósito, os documentos da página Text View).

Em um iPhone 17 Pro (ProMotion, 120 Hz), com o host de desenvolvimento e uma demo na tela, as páginas animadas
desenham a cada refresh:

<div class="data-table">

| Página | Origem dos quadros | FPS | Frame p95 | Mais de um refresh | CPU | Memória |
|---|---|---|---|---|---|---|
| Stocks | Dados ao vivo, loops nativos | 120 | 0,2–0,3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | Loops nativos | 120 | 0,1 ms | 0% | 25–36% | 37–38 MB |
| Animations | Loops nativos | 120 | 0,2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks faz 20 commits por segundo (um tick a cada 50 ms), cada um em 1,5 ms de JS e 1,4 ms do core na thread do
engine (p95 de 2,2 e 2,0 ms), que fica ocupada de 4 a 6% do tempo.

<a id="measuring-an-app"></a>

## Medindo um app

Para medir um app da mesma forma, execute seus testes ou steps com `--fps` e `-v` em `--target linux`, `macos`, `windows` ou `ios`:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
