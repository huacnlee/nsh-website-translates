---
title: "Comparando abordagens"
description: "Como o Native Shell se compara ao React Native, Flutter, Qt, GPUI e Slint, ao Electron e Tauri, e a web views e UI orientada pelo servidor para UI entregue após o lançamento."
order: 2
group: start
source_hash: 80f11e255cf3463f
---


# Comparando abordagens

O NSH é um framework para apps completos em iOS, Android, macOS, Windows, Linux e web, e também um runtime para UI entregue aos apps depois do lançamento. Esta página o compara primeiro com os frameworks multiplataforma em que as pessoas escrevem apps e, depois, com as formas pelas quais os apps recebem UI que não vieram no pacote original. Verde significa que o recurso está disponível; amarelo, que exige mais trabalho do próprio app ou um projeto separado; vermelho, que não é oferecido. As marcas descrevem disponibilidade, não desempenho. As versões são os mínimos documentados de cada framework no momento da escrita: confira-as para a versão que você usa.

Legenda: <span class="status status--yes" role="img" aria-label="Sim"></span> Sim · <span class="status status--partial" role="img" aria-label="Parcial"></span> Parcial · <span class="status status--no" role="img" aria-label="Não"></span> Não.

<a id="cross-platform-frameworks"></a>

## Frameworks multiplataforma

| Recurso | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Desenhado por | UI da plataforma | Views da plataforma | Engine própria | Grafo de cena | Própria, GPU | Própria, GPU | Renderizador próprio |
| Modelo de UI | Retido | Retido | Retido | Retido | Imediato | Imediato + retido | Reativo, retido |
| Linguagem | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Sim"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 15+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 17+ | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Sim"></span> 9+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 7+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 9+ | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Sim"></span> 14+ | <span class="status status--partial" role="img" aria-label="Parcial"></span> Separado | <span class="status status--yes" role="img" aria-label="Sim"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 13+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 12+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Sim"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Parcial"></span> Separado | <span class="status status--yes" role="img" aria-label="Sim"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 10+ | <span class="status status--yes" role="img" aria-label="Sim"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Sim"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Sim"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Sim"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sim"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| Web | <span class="status status--yes" role="img" aria-label="Sim"></span> HTML | <span class="status status--partial" role="img" aria-label="Parcial"></span> Biblioteca | <span class="status status--yes" role="img" aria-label="Sim"></span> Canvas | <span class="status status--yes" role="img" aria-label="Sim"></span> Canvas | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> Canvas |
| Texto do sistema | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| UX por dispositivo | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| Sem runtime JS | <span class="status status--yes" role="img" aria-label="Sim"></span> Apps Rust | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> C++ | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| Entrega assinada | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> OTA | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> QML | <span class="status status--partial" role="img" aria-label="Parcial"></span> Shell | <span class="status status--partial" role="img" aria-label="Parcial"></span> Shell | <span class="status status--no" role="img" aria-label="Não"></span> |
| Licença | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, comercial | Apache-2.0 | Apache-2.0 | GPL, comercial |

O modo imediato constrói a descrição da UI novamente a cada frame; o modo retido a mantém e atualiza apenas o que mudou. O GPUI Fast combina os dois sobre o GPUI e roda onde o GPUI roda. "Shell" é o [GPUI Shell](https://gpui-kit.com/shell).

O NSH é o único framework aqui que reúne tudo isto: a UI e a entrada de texto nativas de cada plataforma, celulares, desktops e web a partir de um único app (a web como HTML), apps Rust sem runtime JavaScript e UI assinada e isolada em sandbox entregue após o lançamento.

<a id="what-the-rows-mean"></a>

### O que significam as linhas

- **Desenhado por, modelo de UI.** O NSH monta as views nativas de cada plataforma e as mantém (modo retido): uma mudança atualiza apenas as views que ela tocou. O React Native também monta views da plataforma, no iOS e no Android. Flutter, Qt Quick, GPUI e Slint desenham com seus próprios renderizadores; o GPUI constrói a árvore de elementos a cada frame (modo imediato), e o [GPUI Fast](https://github.com/longbridge/gpui-fast) reaproveita o que não mudou.
- **Plataformas.** Os mínimos do NSH são os seus próprios ([Plataformas](./platforms.md)). Os dos demais vêm do [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS e Windows pelos projetos separados react-native-macos e react-native-windows, e a web pela biblioteca react-native-web), do [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), do [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), dos [requisitos do Zed](https://zed.dev/docs/installation) para o GPUI e dos [guias de plataforma do Slint](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS a partir de Rust). "Canvas" significa que o framework desenha em um canvas na página; os apps web do NSH são elementos HTML estilizados com CSS, e é o navegador que cuida da rolagem, da seleção e da edição ([Web](./web.md)).
- **Texto do sistema.** Os campos de texto do NSH são os editores da plataforma — `UITextView`, `EditText`, `NSTextView`, o `TextView` do GTK, o do navegador — com os métodos de entrada, as alças de seleção e os menus de edição do sistema; no Windows, o editor próprio do NSH funciona com o DirectWrite e com os métodos de entrada do sistema (IMM32). O React Native também usa os campos de texto da plataforma. Os frameworks que desenham a própria UI implementam a edição de texto por conta própria e a conectam aos métodos de entrada do sistema.
- **UX por dispositivo.** Os componentes base do NSH se adaptam ao dispositivo: o mesmo `Menu` é um popup junto ao gatilho com um ponteiro e uma sheet que sobe da parte inferior no celular, e um `ContextMenu` abre com o clique direito ou com o dedo mantido pressionado. Nos demais, adaptar a interação a cada dispositivo costuma ser trabalho do próprio app.
- **Sem runtime JS.** Os runners de um app Rust não incluem nenhuma engine JavaScript em plataforma alguma; o TSX é o segundo caminho, sobre a mesma engine. O QML do Qt Quick roda na engine JavaScript do Qt; o Qt Widgets em C++ não.
- **Entrega assinada.** O NSH verifica pacotes `.nshpkg` assinados contra as chaves em que confia e uma lista de revogação, e executa cada um em uma VM com os limites e as capacidades concedidos pelo host ([Pacotes assinados](./signed-packages.md), [Sandbox e capacidades](./sandbox-and-capabilities.md)). As atualizações over-the-air do React Native entregam código de app confiável; o Qt pode carregar arquivos QML; os apps GPUI recebem módulos JavaScript pelo [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### O que diferencia o NSH

- **Nativo em todas as plataformas, nos dois sentidos.** Cada backend é construído sobre as views, o texto e os métodos de entrada da própria plataforma — UIKit, views do Android, AppKit, Win32 com Direct2D, GTK 4, HTML — e a interação de cada plataforma vem junto. Seleção de texto, métodos de entrada e acessibilidade são os do sistema, e o que uma nova versão do SO traz para eles chega ao app ([Introdução](./index.md#what-native-means)).
- **Celulares, desktops e web a partir de um único app.** Seis plataformas são backends de um só framework, com layouts que se reorganizam e entrada que acompanha o dispositivo; na web, o app é HTML, publicado como site estático.
- **Rust primeiro, sem runtime JavaScript.** Um app inteiro pode ser Rust do começo ao fim, compilado para código nativo com os tipos, as threads e os crates do Rust. O TSX é o segundo caminho, sobre a mesma engine, para telas escritas rapidamente ([Criando com Rust](./rust.md)).
- **Views retidas para apps do dia a dia.** Chats, formulários, listas e documentos ficam quase ociosos em repouso, porque uma mudança envia apenas as views que ela tocou ([Introdução](./index.md#retained-views)).
- **UI entregue após o lançamento, assinada e em sandbox.** Apps criados com o NSH — e apps nativos escritos com as ferramentas de cada plataforma — recebem módulos TSX em tempo de execução, escritos por uma equipe ou gerados por IA ([UI dinâmica](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Uma única toolchain, para pessoas e agentes.** Um único executável `nsh` cria, executa, testa em plataformas reais, empacota e assina apps para todos os destinos.

### React Native

O React Native é o mais próximo em intenção: ambos reduzem o trabalho duplicado de cliente e usam as views da plataforma. O centro do React Native é JavaScript ou TypeScript com React e seu ecossistema de pacotes, no iOS e no Android, com suporte a desktop em projetos separados. O centro do NSH é Rust: seu runtime, seu renderizador e seus módulos são Rust, Rust é uma linguagem de app por direito próprio e o TSX é um caminho entre dois; suas seis plataformas, incluindo desktops e web, são backends do mesmo framework.

### Flutter

O Flutter desenha cada pixel com sua própria engine, de modo que um app tem a mesma aparência em todas as plataformas. O NSH segue o outro caminho: as views, o texto e a entrada de texto de cada plataforma e, na web, elementos HTML com a rolagem, a seleção e a entrada do próprio navegador. A edição de texto, os métodos de entrada e a seleção são os da plataforma, em vez de reimplementados para cada uma.
### Qt

Qt é um toolkit maduro com duas tecnologias de UI, Qt Widgets e Qt Quick, além de ferramentas e suporte a plataformas consolidados. O NSH se diferencia na base e no modelo: Rust como linguagem principal com um caminho em TSX, uma toolchain projetada para desenvolvimento automatizado (e orientado por IA), a web renderizada como HTML, e a interação de mobile, desktop e web adaptada dentro de um único modelo de componentes.

<a id="gpui-and-gpui-fast"></a>

### GPUI e GPUI Fast

[GPUI](https://gpui-kit.com) é um framework de UI em Rust que desenha com a GPU, criado para apps desktop exigentes; [GPUI Fast](https://github.com/longbridge/gpui-fast) é o fork da Longbridge com renderização retida, que reaproveita views, layout e medições de texto que não mudaram, além de scroll layers e composição nativa de janelas. O NSH, em vez disso, é construído sobre as views de cada plataforma, de modo que entrada de texto, seleção, métodos de entrada e interação com o sistema são os da própria plataforma, e ele cobre também celulares e a web; o backend GPUI do NSH incorpora apps NSH em apps GPUI e GPUI Kit ([GPUI](./gpui.md)).

Os dois atendem cargas diferentes. No [benchmark de desempenho do NSH](https://github.com/longbridge/nsh-perf-bench) (Linux, uma tabela de cotações com 500 linhas, NSH no backend GTK 4), as cargas do dia a dia custam o mesmo: a 1.000 cotações por segundo, o NSH Rust usa 18% de um núcleo e o GPUI Fast, 20%. Sob atualizações densas e contínuas, o GPUI Fast leva vantagem: a 20.000 cotações por segundo ele usa 25% de um núcleo, enquanto o NSH usa 73–78%, e a animação quadro a quadro de 1.000 caixas custa a ele cerca de um terço da CPU do NSH.

### Slint

Slint é um toolkit de UI declarativo com linguagem própria e renderizadores leves, para desktops e dispositivos embarcados, usado a partir de Rust, C++, JavaScript ou Python. Ambos valorizam desempenho nativo; o caminho do NSH é a UI e a interação próprias de cada plataforma, HTML na web, Rust e TSX como linguagens de app e desenvolvimento orientado por IA em seis plataformas.

<a id="electron-and-tauri"></a>

### Electron e Tauri

O Electron embute o Chromium e o Tauri usa a web view do sistema: ambos criam apps desktop (e, no caso do Tauri, apps mobile) a partir de conteúdo web, com o texto e a entrada do navegador. O NSH, em vez disso, constrói as views nativas de cada plataforma e renderiza HTML apenas na própria web.

<a id="ui-delivered-after-release"></a>

## UI entregue após o lançamento

Um app que quer uma UI que não veio com ele — respostas geradas por um modelo, funcionalidades de parceiros ou de outras equipes, telas que mudam sem um novo release — tem algumas opções consolidadas, tanto em celulares quanto em desktops. Elas diferem no que desenha a UI, no que o código entregue pode fazer e em quanto do app precisa mudar para hospedá-las.

| Capacidade | NSH | Web view | Server-driven UI | Mini-programs | Atualizações OTA |
|---|---|---|---|---|---|
| Desenhada por | UI da plataforma | Engine do navegador | Views do app | Engine web + camada | Renderizador do framework |
| Aparência e comportamento nativos | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| Estado, lógica e layout próprios | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| Componentes nativos do host | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Bridge | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--yes" role="img" aria-label="Sim"></span> |
| Sandbox configurado pelo host | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Sim"></span> Schema | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--no" role="img" aria-label="Não"></span> |
| Pacotes assinados e revogáveis | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--no" role="img" aria-label="Não"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> |
| Adequada a UI gerada por IA | <span class="status status--yes" role="img" aria-label="Sim"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> Páginas web | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--partial" role="img" aria-label="Parcial"></span> | <span class="status status--no" role="img" aria-label="Não"></span> |
| Custo para o app host | Uma view e uma biblioteca | Uma engine de navegador por view | Um renderizador por componente | Um SDK de contêiner | O app inteiro dentro do framework |

- **Web view (H5).** Uma página em uma engine de navegador: tudo o que o HTML consegue expressar, com a aparência do navegador e uma bridge escrita à mão para o código nativo.
- **Server-driven UI.** JSON que recombina os componentes e ações que o app já traz: fácil de gerar, sem estado nem lógica locais além do que o schema oferece.
- **Contêineres de mini-programs.** Um framework e uma API específicos de uma plataforma sobre uma engine web, dentro de um grande SDK de contêiner.
- **Atualizações over-the-air** (React Native com um serviço de code-push, por exemplo). O framework inteiro, mas as atualizações são código de app confiável, e o app precisa ser escrito nesse framework.
- **NSH.** Um módulo TSX com estado, lógica, animação e layout próprios, renderizado com a UI da própria plataforma, que pode usar as views nativas registradas pelo host. Ele chega como um pacote assinado que o app verifica, roda em sua própria VM com limites de memória, tempo de chamada e nós, e acessa apenas os hosts de rede, páginas web e configurações do sistema que o host concede ([Sandbox e capacidades](./sandbox-and-capabilities.md)). O host adiciona uma view onde o módulo aparece ([Plataformas](./platforms.md#embed-in-a-native-app)), e o mesmo bundle roda em todas as plataformas. Essa é a razão de o NSH existir ao lado do [GPUI Shell](./index.md#native-shell-and-gpui-shell).

<a id="when-another-option-fits-better"></a>

## Quando outra opção serve melhor

- A tela é dominada por atualizações densas e contínuas de milhares de views — um terminal de dados de mercado recebendo dezenas de milhares de cotações por segundo, uma visualização customizada redesenhada a cada quadro: a renderização retida na GPU do GPUI Fast usa uma fração da CPU (veja [GPUI e GPUI Fast](#gpui-and-gpui-fast)).
- O app precisa ser idêntico pixel a pixel em todas as plataformas: um framework que desenha tudo por conta própria, como Flutter ou Slint, oferece isso por design.
- Você precisa hoje de um grande ecossistema de pacotes de terceiros: React Native, Flutter e Qt têm anos deles.
- A UI é um documento ou uma página web existente: uma web view a exibe como ela é.
- O conjunto de telas é fixo e pequeno, e só o conteúdo e a ordem mudam: server-driven UI não precisa de nenhum runtime.

<a id="see-also"></a>

## Veja também

- [Introdução](./index.md): o que é o NSH e o que significa nativo nele.
- [Arquitetura](./architecture.md): o que roda onde dentro do NSH.
- [Desempenho](./performance.md): as regras que o NSH segue e como medir um app.
