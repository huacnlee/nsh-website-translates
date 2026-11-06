---
title: "Testes"
description: "Teste apps em modo headless, em Rust com cargo test e nsh_testing ou em TypeScript com nsh test: abra o app, toque, digite, role e espere como um usuário, simule a rede e o armazenamento, e leia as operações de view nativas e os tempos que --trace imprime; testID para testes de UI."
order: 61
group: tools
source_hash: c0e7414002b92551
---


# Testes

O NSH executa apps **headless**: o motor real (o mesmo grafo reativo, renderizador, componentes, layout e virtualização de listas que em um dispositivo, e QuickJS para TSX), com quadros de exibição a 60 Hz, mas sem simulador, sem dispositivo e sem janela. Ele roda em qualquer lugar onde o Cargo ou a CLI rodem, inclusive em máquinas de CI Linux, e faz dois trabalhos:

- executa testes: cada um abre o app, executa os passos que um usuário daria (pressionar, digitar, rolar) e verifica o que está na tela.
  Os testes de um app Rust são escritos em Rust, executados por `cargo test` com o crate `nsh-testing`; os testes escritos em TypeScript rodam com
  `nsh test`, tanto para apps TSX quanto para apps Rust;
- com `--trace`, imprime cada operação que o runtime envia às views nativas, com tempos: quanto custam o primeiro
  quadro, um toque ou um quadro de rolagem.

<a id="writing-tests"></a>

## Escrevendo testes

O mesmo teste, em Rust e em TypeScript: ele abre o app com uma lista de tarefas vazia em seu armazenamento, digita, pressiona e
verifica o que a tela mostra.

```rust tabs
// tests/app/main.rs
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, MemoryStorage};

#[test]
fn adds_a_todo() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.storage = Some(MemoryStorage::new([("todos".to_owned(), "[]".to_owned())]));
    let mut app = Headless::start(config).unwrap();
    app.type_text("id:new-todo", "Buy milk").unwrap();
    app.press("text:Add").unwrap();
    app.wait_for("text:Buy milk").unwrap();
    assert!(app.screen().texts().contains(&"1 item left"));
}
```

```tsx tabs
// App.test.tsx
import { expect, open, test } from "nsh/test";

test("adds a todo", async () => {
  const app = await open("./App.tsx", { storage: { todos: "[]" } });
  await app.type("id:new-todo", "Buy milk");
  await app.press("text:Add");
  await app.waitFor("text:Buy milk");
  expect(app.texts()).toContain("1 item left");
});
```

<a id="tests-in-rust-with-cargo-test"></a>

## Testes em Rust com cargo test

Os testes de um app Rust são testes de integração de seu crate, com `nsh-engine` e `nsh-testing` (suas features padrão,
sem QuickJS) como dev-dependencies:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` é um motor do tamanho de um celular (390×844 pontos) sem nenhuma outra configuração; seus campos definem o que as
opções de `open` definem abaixo: `storage` (`MemoryStorage::new(entries)`), `network` (`StubNetwork`, abaixo), `viewport`,
`environment` (a aparência, o locale, movimento reduzido), `clock` (`Clock::manual(time)`, abaixo).
`nsh_testing::Headless::start(config)` inicia o app e mantém um modelo das views que ele exibe. Seus passos são os de
`nsh test` abaixo, com os mesmos seletores, em Rust: `press`, `long_press`, `clear`, `type_text`, `submit`,
`scroll(selector, px(3000.0))`, `back`, `wait`, `wait_for`, `wait_for_gone`, `wait_until`, `run_for`, `fast_forward`,
`set_system_time`, `set_viewport`, `set_clipboard` e `on_dialog`; `app.shows(text)` e `app.screen()` (`texts()`,
`count(selector)`, `enabled(selector)`, `dialogs()`, `clipboard()`, `commands()`) leem o que está na tela. Um passo
retorna um erro com os textos na tela quando não pode ser executado.

`nsh_testing::tsx(entry, sets)` (feature `bundle`) abre a entrada TSX de um app da mesma forma, compilada com os conjuntos de UI do NSH e do
crate ([Compilando com Rust](./rust.md#testing)). `examples/gallery-rs` testa seu root em Rust dessa maneira, um
módulo por demo; `examples/rust-exports` testa sua entrada TSX a partir de Rust.

`nsh test` também executa esses testes: dado o diretório de um app com crates Rust (`nsh.json` `"rust"`), ele executa
`cargo test` para cada crate nele antes dos arquivos de teste, e mostra e conta os testes Rust junto com os de TypeScript
(`✓ src/lib.rs › tests::adds`), em seu resumo e em seu relatório `--junit`. Assim, `nsh test` é o único comando para um app Rust,
um app TSX com um crate e um app TSX comum, e `nsh check` também executa `cargo check --all-targets` nos crates
antes de verificar os tipos do TypeScript.

<a id="tests-with-nsh-test"></a>

## Testes com nsh test

Um arquivo de teste é um arquivo `*.test.tsx` ou `*.test.ts` ao lado do seu código. Ele importa `nsh/test`, como `App.test.tsx` acima
faz:

```sh
nsh test                      # every test file of the app in the current directory
nsh test App.test.tsx         # one file
nsh test --filter "adds"      # the tests whose name contains "adds"
```

```text
✓ App.test.tsx › adds a todo (84ms)
✗ App.test.tsx › keeps todos after a restart (312ms)
    expected ["Todos","0 items left"] to contain "1 item left"
    at <anonymous> (App.test.tsx:21:22)
    on screen: "Todos", "0 items left"
error 2 tests: 1 passed, 1 failed (0.9s)
```

Um teste que falha mostra o que foi lançado, em que ponto do arquivo de teste, e os textos na tela do app que ele abriu. Qualquer falha
faz `nsh test` sair com um código diferente de zero. `nsh init` cria um `App.test.tsx` com o app, e `nsh check` verifica os tipos
dos arquivos de teste junto com o restante (`.nsh/types` declara `nsh/test`).

Cada arquivo de teste roda em um motor próprio, e seus testes rodam um após o outro, em ordem. `open` inicia o app em
outro motor, um novo a cada vez, de modo que os testes nunca compartilham estado; os apps que um teste abriu são fechados quando ele termina. Um
teste falha quando lança uma exceção, quando a promise que ele retorna é rejeitada e após o timeout: 30 segundos, ou os milissegundos
dados pelo terceiro argumento de `test` (`test("syncs", body, 60_000)`). Um app com crates Rust próprios
(`nsh.json` `"rust"`) executa seus testes em um runner headless que o NSH compila junto com eles, da mesma forma; em um app Rust
(`nsh.json` `"root"`, [Compilando com Rust](./rust.md)), `open(".")` inicia seu componente root.

<a id="grouping-tests-and-setting-them-up"></a>

### Agrupando testes e configurando-os

`describe`, os hooks e as variantes de `test` funcionam como no Jest:

```tsx
import { beforeEach, describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";

describe("the cart", () => {
  let app: App;
  beforeEach(async () => {
    app = await open("./App.tsx", { storage: { cart: "[]" } });
    await app.press("Cart");
  });

  test("starts empty", () => {
    expect(app.texts()).toContain("No items");
  });

  test.todo("applies a coupon");
});
```

| Função | Descrição |
|---|---|
| `describe(name, body)` | Agrupa os testes e os blocos que `body` declara (de uma vez, enquanto o arquivo carrega): os nomes deles começam com `name` (`the cart › starts empty`), e os hooks que ele declara rodam apenas em torno deles. Os blocos podem ser aninhados. |
| `beforeEach(fn, timeout?)`, `afterEach(fn, timeout?)` | Executam `fn` antes / depois de cada teste do bloco em que são declarados (o arquivo, um `describe`): `beforeEach` dos blocos externos primeiro, `afterEach` dos internos primeiro. Um `beforeEach` que falha faz o teste falhar; `afterEach` roda de qualquer forma. |
| `beforeAll(fn, timeout?)`, `afterAll(fn, timeout?)` | Executam `fn` uma vez antes do primeiro e depois do último teste de seu bloco, quando algum de seus testes roda. Um `beforeAll` que falha faz os testes do bloco falharem; um `afterAll` que falha é reportado como um `<block> › afterAll` com falha. Um app que um `beforeAll` abre permanece aberto para os testes do bloco, e é fechado após seu `afterAll`. |
| `test.skip(name, body, timeout?)`, `describe.skip(name, body)` | Declaram um teste, ou um bloco cujos testes, não são executados: eles são reportados como ignorados. |
| `test.only(name, body, timeout?)`, `describe.only(name, body)` | Enquanto um arquivo de teste tiver um deles, somente esses testes e blocos rodam; os demais do arquivo são reportados como ignorados. |
| `test.todo(name)` | Um teste ainda por escrever, reportado como tal. |

Um hook pode ser `async`; seu `timeout` é de 30 segundos, a menos que seja informado. Testes e hooks são declarados enquanto o arquivo carrega: um
teste declarado dentro de um teste ou de um hook lança uma exceção.

<a id="opening-the-app"></a>

### Abrindo o app

`open(entry, options?)` compila o app em `entry` (relativo ao arquivo de teste; cada entrada é compilada uma vez por execução),
o inicia em um viewport de 390×844 e resolve assim que ele foi renderizado e está quieto. Com `--target`, o app roda com as
opções como o teste as define: uma que a plataforma do alvo não possa honrar faz `open` ser rejeitado com
`ERR_NSH_TEST_UNSUPPORTED`, nomeando-a (veja [Em uma plataforma real](#on-a-real-platform)).

| Opção | Padrão | Descrição |
|---|---|---|
| `storage` | vazio | O que `Storage` contém no início: `{ todos: "[]" }`. |
| `network` | nenhum | O que as requisições do app recebem, por rota: veja [Simulando a rede](#stubbing-the-network). `"live"`: a rede real, para suas requisições, sockets e WebSockets. |
| `width`, `height` | 390, 844 | O viewport em pontos: no headless, a janela dos desktops, a página da web. No iOS e no Android o app preenche a tela do dispositivo. |
| `safeArea` | 0 | Os insets da safe area em pontos: `{ top: 47, bottom: 34 }`. |
| `clipboard` | vazio | O texto na área de transferência no início. |
| `colorScheme` | `"light"` | A aparência do sistema: `"light"` ou `"dark"` (classes `colorScheme()`, `dark:`). |
| `locale` | `"en-US"` | O locale do dispositivo, uma tag BCP 47 (`locale()`, o padrão de `Intl`). |
| `reducedMotion` | `false` | O usuário pediu menos movimento (`reduceMotion()`). |
| `platform` | `"ios"` | A plataforma como a qual o app roda no headless: `"ios"`, `"android"`, ou a de um desktop, `"macos"`, `"windows"`, `"linux"`, ou `"web"` no idioma de desktop (`platform.os`, props `ios={{…}}` / `android={{…}}` / `desktop={{…}}`, atalhos de teclado). Com `--target`, o app roda como a plataforma do alvo: `platform` de um desktop em qualquer desktop e na web, sempre como desktop (no navegador no idioma de desktop em qualquer largura, com `platform.os` permanecendo `"web"`), `"ios"` e `"android"` cada um como a si mesmo. |
| `clock` | a do sistema | Um relógio manual, cujo tempo só avança conforme o teste o move: `{}`, ou `{ time }` para começar em um `Date` (ou milissegundos desde a época Unix). Veja [Controlando o tempo](#controlling-time). |
| `host` | nenhum | A parte do app anfitrião, que o teste interpreta: `{ params, handlers }`. Veja [Simulando o app host](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### Simulando o app host

Um app embutido em um app nativo conversa com ele por meio de [`host`](../modules/nsh.md#host). Em um teste, o teste faz o papel
do app host: `host.params` fornece os parâmetros de inicialização que o app lê ao iniciar, e `host.handlers` responde aos
`host.call` do app e ouve seus `host.post`, por nome. Um handler é um valor, que responde a toda chamada, ou uma função dos dados da
chamada que retorna a resposta (ou uma promise dela). O que a função lançar rejeita a chamada, como o erro de um app host
faria. Uma chamada a um nome que `handlers` não lista falha, como em um app host que não trata nenhum.

```tsx
const app = await open("./App.tsx", {
  host: {
    params: { conversation: "c-42" },
    handlers: {
      "user.profile": async ({ id }) => ({ id, name: "Ada" }),
      "feature.flags": { search: true },
      analytics: null,
    },
  },
});
await app.press("Profile");
expect(app.host.calls()).toEqual([{ name: "user.profile", data: { id: 7 } }]);
expect(app.host.posts()).toEqual([{ name: "analytics", data: { screen: "profile" } }]);
// The app's `host.on("conversation.open", …)` hears it.
await app.host.send("conversation.open", { id: "c-43" });
expect(app.shows("Conversation c-43")).toBe(true);
```

`app.host.send(name, data)` envia um evento e depois espera até que o app esteja quieto. `app.host.calls()` e
`app.host.posts()` listam o que os handlers receberam, em ordem: `name` e `data`.

As URLs que o app abre ([`openUrl`](../modules/nsh.md#openurl), os links de um `TextView` com `links="open"`) são
registradas e informadas ao app como abertas, e nada é aberto nesta máquina. `app.openedUrls()` as lista:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### Simulando a rede

`network` lista rotas por `"<METHOD> <URL>"` (uma URL simples é um `GET`; `*` corresponde a qualquer texto). Uma requisição que nenhuma rota
atende falha, de modo que os testes nunca alcançam a rede sem que isso seja pedido. Uma rota é uma resposta, ou uma função da requisição que
retorna uma (ou uma promise de uma); em Rust, `StubNetwork::new(routes)` aceita as mesmas rotas, cada uma um `StubResponse` ou
um `StubRoute::Handler`:

```rust tabs
use std::sync::Arc;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, StubNetwork, StubResponse};

#[test]
fn adds_a_todo_on_the_server() {
    let mut todos = StubResponse::default();
    todos.status = 200;
    todos.headers = vec![("content-type".to_owned(), "application/json".to_owned())];
    todos.body = br#"[{ "id": 1, "title": "Walk" }]"#.to_vec();
    let mut created = StubResponse::default();
    created.status = 201;
    let mut offline = StubResponse::default();
    offline.error = Some("offline".to_owned());
    let network = Arc::new(StubNetwork::new([
        ("GET https://api.example.com/todos".to_owned(), todos),
        ("POST https://api.example.com/todos".to_owned(), created),
        ("GET https://api.example.com/sync".to_owned(), offline),
    ]));
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.network = Some(network.clone());
    let mut app = Headless::start(config).unwrap();
    app.press("Add").unwrap();
    let methods: Vec<String> = network.requests().iter().map(|r| r.method.clone()).collect();
    assert_eq!(methods, ["GET", "POST"]);
}
```

```tsx tabs
const app = await open("./App.tsx", {
  network: {
    "GET https://api.example.com/todos": { body: [{ id: 1, title: "Walk" }] },
    "POST https://api.example.com/todos": (request) => ({ status: 201, body: JSON.parse(request.body!) }),
    "GET https://api.example.com/todos/*": { status: 404 },
    "GET https://api.example.com/sync": { error: "offline" },
    "GET https://api.example.com/slow": { body: "done", delay: 2000 },
  },
});
await app.press("Add");
expect(app.requests().map((r) => r.method)).toEqual(["GET", "POST"]);
```

| Membro da resposta | Padrão | Descrição |
|---|---|---|
| `status` | 200 | O código de status. |
| `headers` | nenhum | Nomes e valores de cabeçalhos. |
| `body` | vazio | Uma string, ou um valor enviado como JSON (com `content-type: application/json`, a menos que `headers` informem um). |
| `error` | nenhum | A requisição falha com esta mensagem, como quando o dispositivo está offline. |
| `delay` | 0 | Quanto tempo a resposta leva, em milissegundos; um passo não espera por ela, `waitFor` espera. Em um relógio manual, ela chega assim que o relógio a ultrapassa. |

A função de uma rota recebe a requisição (`method`, `url`, `headers`, `body` como texto) e roda no arquivo de teste, de modo que pode
contar requisições ou responder a partir do que o teste configurou. Uma função que lança uma exceção faz a requisição falhar, assim como o passo que a
fez. `app.requests()` lista as requisições que o app fez, em ordem, da mesma forma.

As conexões também ficam no teste: os sockets do app (`net`) e os WebSockets (o global `WebSocket` e o módulo `websocket`)
não abrem nenhuma, a menos que `network` seja `"live"`. Depois das verificações de capacidade que as execuções do próprio app passam, `net.connect`
e `connect` do módulo `websocket` são rejeitados com `code` `ERR_NSH_TEST_NETWORK`, e um `WebSocket` global dispara `error` e depois
`close` (1006, não limpo), como em uma conexão recusada pela rede. Com `"live"`, eles se conectam à rede real
junto com as requisições do app. Em Rust, `EngineConfig::refuse_connections` faz o mesmo para um app `Headless`: uma
função do que o app conecta (a URL de um WebSocket, o `host:port` de um socket) que retorna o erro com o qual sua chamada
falha.

<a id="controlling-time"></a>

### Controlando o tempo

No relógio do sistema, os timers e as animações nativas de um app levam tanto tempo quanto em um dispositivo, e os testes que
os aguardam também. Com um relógio manual (`EngineConfig::clock` em Rust, `clock` de `open` em TypeScript), o app roda em um
relógio cujo tempo só avança conforme o teste o move, e instantaneamente, como com os fake timers do Jest ou o
`page.clock` do Playwright. `app.clock` é esse relógio, e `null` quando o app roda no do sistema:

```rust tabs
use std::time::{Duration, SystemTime};
use nsh_engine::{Clock, EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn autosaves() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    // 2026-01-01T09:00:00Z
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_767_258_000));
    let mut app = Headless::start(config).unwrap();
    app.type_text("label:Note", "Milk").unwrap();
    app.run_for(Duration::from_secs(10)).unwrap(); // the autosave, ten seconds later
    assert!(app.shows("Saved at 09:00:10"));
}
```

```tsx tabs
const app = await open("./App.tsx", { clock: { time: new Date("2026-01-01T09:00:00Z") } });
await app.type("label:Note", "Milk");
await app.clock!.runFor(10_000);           // the autosave, ten seconds later
expect(app.texts()).toContain("Saved at 09:00:10");
```

Um `StubNetwork` cujas respostas têm um `delay` segue um relógio manual com `.with_clock(clock.clone())`. Os passos abaixo
são de `nsh test`; `Headless` tem cada um deles (`run_for`, `fast_forward`, `set_system_time`).

| Passo | Descrição |
|---|---|
| `await app.clock.runFor(ms)` | Move o relógio em `ms` milissegundos, um quadro de exibição por vez. Timers, `requestAnimationFrame`, animações nativas e respostas atrasadas rodam à medida que vencem, em ordem, cada um em seu momento. Resolve assim que o app está quieto. |
| `await app.clock.fastForward(ms)` | Move o relógio em `ms` milissegundos de uma só vez, como um dispositivo que acorda do repouso: os timers vencidos nesse intervalo rodam uma vez cada. |
| `app.clock.setSystemTime(time)` | Define o horário de parede (`Date.now()`, `new Date()`) para um `Date` ou milissegundos, sem mover nenhum timer. |

`Date`, `performance.now()` e a data padrão de `Intl` seguem o relógio. Os passos concluem o que está em execução sem esperar
por isso: enquanto o app pede quadros ou uma animação nativa está em execução, os quadros vêm um após o outro, cada um com o tempo de um quadro
(1/60 s) a mais no relógio. Uma transição de 300 ms leva alguns milissegundos, e um timer que vence durante ela roda. Uma
animação que se repete para sempre (um spinner) roda junto com o relógio: ela gira conforme o teste move o relógio. `app.wait(ms)`
e um toque longo movem o relógio pelo tempo que duram. Um timer que vence mais tarde só roda quando o teste move o relógio
até lá. `waitFor` e `waitUntil` movem o relógio enquanto esperam, um quadro de exibição por vez, olhando após cada quadro,
de modo que o que um timer mostra aparece enquanto esperam, em um instante: `waitFor("Saved", { timeout: 15_000 })` move o relógio
em até quinze segundos. O timeout deles conta nos dois relógios: uma espera move o relógio do app no máximo por esse tempo, e é rejeitada
quando também passou tanto tempo real, de modo que o que vem de fora do app (a função de uma rota, a rede) tem o mesmo tempo
que teria no relógio do sistema. Os testes da galeria rodam assim (`examples/gallery/tests`): seus doze testes que esperam por animações
levam 6 s em vez de 28 s.
<a id="steps"></a>

### Passos

Os passos nomeiam views com **seletores**, escritos como os do Playwright:

| Seletor | Corresponde a |
|---|---|
| `id:<testID>` | A view com aquele `testID`. |
| `label:<label>` | A view com aquele `accessibilityLabel`. |
| `text:<text>` | Um texto que o diga (espaços ao redor à parte), um trecho de um texto que recebe pressionamentos (um `<Text onPress>` aninhado, o link de um `TextView`), ou um input que o contenha ou, enquanto vazio, com aquele placeholder. |
| `role:<role>`, `role:<role>[<name>]` | Uma view com aquele `role` (`role:button`) e aquele nome: seu label, senão os textos nela (`role:button[Save]`). |
| `view:<id>` | A view com aquele id na saída de `--trace`. |
| qualquer outra coisa | Um `testID`, senão um label, senão um texto, como escrito. |

Uma parte que começa com uma palavra em minúsculas e dois-pontos nomeia um prefixo (`id`, `label`, `role`, `text`, `view`), então
`tapped: solo` é um erro de passo que os lista. Um texto, label ou test id que começa assim recebe o seu prefixo, que
lê o restante como escrito: `text:tapped: solo`, `label:note: draft`, `id:row:2`. Os seletores mantêm seu significado à medida que novos
prefixos chegam.

`label:`, `text:` e o nome de um role também aceitam uma regex: `text:/^Buy/i`, escrita na sintaxe da crate `regex` do Rust
(classes, grupos, âncoras e quantificadores do JavaScript, com correspondência em tempo linear; flags `i`, `m` e `s`). ` >> ` procura
dentro do que a parte anterior encontrou (`id:cart >> role:button[Remove]`), e `nth=<n>` mantém uma das correspondências, a partir de 0
(`text:Delete >> nth=1`). Um seletor encontra as views que um usuário olharia primeiro: no modal do topo, depois na tela,
e de uma navigation stack apenas a tela do topo. Ele corresponde ao que o usuário vê: views com uma área, fora de `visibility: hidden`, dentro da janela e
das views que as recortam (`overflow: hidden`), ou em qualquer lugar do conteúdo de uma scroll view que o usuário possa rolar, o que a
rolagem traz para dentro (`opacity` e transformações à parte, como no Playwright). Um passo que age sobre uma view (`press`, `type`, `clear`, `submit`, `scroll`, `longPress`) precisa de exatamente
uma: um seletor que corresponde a várias faz o passo falhar, e o erro diz como restringi-lo.

| Passo | Descrição |
|---|---|
| `await app.press(selector)` | Pressiona a view, ou a view mais próxima ao redor dela que recebe pressionamentos (o botão ao redor de um texto): `onPressDown`, `onPressUp`, `onPress`, dentro de um dedo que desce e levanta, o que as views ao redor que escutam toques recebem (o `onPressOutside` de um overlay). Um trecho de um texto é pressionado sobre seus caracteres (`await app.press("Privacy policy")`), em headless e no iOS, Android e nos desktops. Um segundo pressionamento da mesma view em até 500 ms é seu segundo clique (`clicks: 2`, um toque duplo), como as plataformas os contam. Rejeita quando está desabilitada. |
| `await app.longPress(selector)` | Mantém um dedo sobre ela (ou a view mais próxima ao redor que recebe pressionamentos ou toques) por seu `delayLongPress` (500 ms): `onPressDown`, `onLongPress`, `onPressUp`; nenhum `onPress` se segue. Os handlers dos toques escutam o dedo (um `ContextMenu` ou `Tooltip` abre). |
| `await app.clear(selector)` | Esvazia o input, como selecionar tudo e apagar faz. |
| `await app.type(selector, text)` | Digita no input (ou no primeiro input dentro da view; `text:` também corresponde ao texto ou placeholder de um input) ao final do que ele contém, tecla por tecla: ele recebe o foco, depois cada caractere é um `onKeyPress` e um `onChange`, dentro de `maxLength`. Um `\n` em um input de linha única é a tecla return. |
| `await app.submit(selector)` | A tecla return no input, como seu `submitBehavior` indica: `onSubmit` (e o foco sai de um input de linha única), ou uma quebra de linha em um input multilinha. |
| `await app.scroll(selector, distance)` | Arrasta a scroll view ou lista (a própria view, a que a envolve, ou a primeira dentro dela) por `distance` pontos ao longo de seu eixo, 10 pontos por frame, dentro de seu conteúdo, como o usuário poderia (`scrollable`). Um valor negativo rola de volta. |
| `await app.hover(selector)` | Move o mouse sobre o meio da view: as views sob ele que ele deixou escutam `onMouseLeave`, aquelas sobre as quais passou escutam `onMouseEnter` e assumem seus estilos `hover:`, e aquelas que escutam recebem `onMouseMove` com a posição dele e nenhum botão pressionado. Os desktops e a web em qualquer largura, inclusive um navegador no idiom de phone (headless: um desktop ou `"web"` `platform`); um phone iOS ou Android não tem mouse: nele, rejeita. |
| `await app.rightClick(selector)` | O botão secundário do mouse sobre o meio da view: ela, ou a view mais próxima ao redor que escuta, recebe `onContextMenu`. Os desktops e a web (headless: um desktop `platform`); um phone não tem mouse: nele, rejeita. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | Cola no input como o usuário faz com aquilo na área de transferência: ele recebe o foco e escuta `onPaste` (`html` o mesmo conteúdo com sua formatação, `files` são caminhos cujos bytes ele recebe como `File`s, `uris` `file:` URLs), depois seu texto entra como `pasteBehavior` indica. Em headless, no macOS, no iOS e na web; a área de transferência da máquina permanece como estava. |
| `app.menu()` | As ações do menu de contexto que o app mostra (`Menu.popup`): `label` (as de um submenu depois da própria, `"Share > Mail"`), `disabled`, e `checked` para um item marcável; `null` quando nenhum está aberto. |
| `await app.chooseMenuItem(label)` | Escolhe a ação do menu de contexto aberto, como um clique nela faz: o app escuta `onMenu` (seu `onSelect` é executado), depois o menu fecha. Rejeita quando o item está desabilitado ou ausente. |
| `await app.closeMenu()` | Fecha o menu de contexto aberto sem nada escolhido, como o Escape faz. |
| `await app.keyboard.press(keys)` | Pressiona uma tecla com seus modificadores, como `keymap` a nomeia (`"mod+k"`, `"shift+/"`, `"escape"`; `mod` é a tecla command da plataforma), em um teclado físico, em todas as plataformas (phones e tablets também têm um): o atalho do app para ela a escuta (`keymap.bind`, `onKeyCommand`), senão, no macOS e na web, Tab e Shift+Tab movem o foco do teclado entre os inputs e as views que recebem pressionamentos (estilos `onFocus`, `onBlur`, `focus:`) e Return ou Space pressiona a view em que o foco está, senão o input focado recebe um caractere, Backspace ou a tecla return, senão Escape volta. |
| `await app.keyboard.down(keys)` / `up(keys)` | Mantém teclas modificadoras (`"mod"`, `"shift"`, `"alt"`, `"ctrl"`, `"meta"`, unidas por `+`) pressionadas até `up`: os pressionamentos, arrastos e hovers nesse meio-tempo as carregam, como um Mod-click ou um Shift-drag faz. Por enquanto, em headless e no Linux. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | Arrasta como `drag` faz e mantém o dedo pressionado até `drop()`, que o levanta onde está: os passos entre eles olham a tela no meio do arrasto (uma prévia do arrasto, uma linha de soltura). Por enquanto, em headless e no Linux. |
| `await app.dropFiles(selector, uris)` | Solta arquivos locais (URLs `file:`, como um gerenciador de arquivos os arrasta) sobre o meio da view: ela, ou a view mais próxima ao redor que escuta, recebe `onFileDrop`. Por enquanto, nos desktops, em headless e no Linux. |
| `await app.drag(selector, { x, y })` | Um dedo pousa no meio da view, descansa por 100 ms, move-se por `x`, `y` pontos, 10 por frame, e levanta, como a entrada da plataforma o interpreta: um pan o acompanha (`pan={{ x, y }}`, `onPanStart`, `onPanEnd` com a velocidade de soltura), as views que escutam toques o recebem (`onTouchStart`, `PanResponder`), uma scroll view rola com ele e, se puxada o bastante além do topo, atualiza (`onRefresh`), e um pressionamento sob ele é cancelado assim que se afasta. Nos desktops e na web, é o mouse. |
| `await app.wait(ms)` | Deixa o app rodar por `ms` milissegundos: timers, animações, requisições. Em um relógio manual, avança-o em `ms` (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | Resolve quando uma view corresponde, ou com `{ state: "gone" }` quando nenhuma corresponde; rejeita após `timeout` ms (5000). Em um relógio manual, avança-o um frame de display por vez enquanto espera, em no máximo `timeout`. |
| `await app.waitUntil(condition, options?)` | Resolve quando `condition()` retorna true, olhando de novo após cada mudança do app: para o que nenhum seletor expressa (`() => app.storage().note === "Milk"`). Em um relógio manual, avança-o um frame de display entre duas verificações, em no máximo `timeout`. |
| `app.shows(selector)` | Se uma view corresponde agora. |
| `app.count(selector)` | Quantas views correspondem agora. |
| `app.enabled(selector)` | Se a view aceita entrada: nem ela nem uma view ao redor está desabilitada, e um input não é `readonly`. |
| `app.texts()` | Os textos na tela agora, em ordem. |
| `app.value(selector)` | O texto de um input, `null` quando nenhum corresponde. |
| `app.spanStyle(selector)` | O estilo resolvido do primeiro caractere correspondente, em headless e em cada `--target`: `color`, `backgroundColor` opcional, `fontSize`, `fontWeight`, `italic`, `underline` e `lineThrough`. As cores são `#rrggbbaa`; os tamanhos estão em pontos. |
| `app.storage()` | O que o armazenamento do app contém agora. |
| `await app.back()` | Volta como o usuário faz (o botão de voltar de um header, deslizar uma sheet para baixo): a stack mais interna do modal mais novo, senão da tela, remove sua tela do topo (`onDismiss`), ou a consulta (`onBackRequest`) quando ela tem `preventBack`; sem uma, o modal mais novo pede para fechar (`onRequestClose`). Rejeita quando não há nada de onde voltar. |
| `app.onDialog(handler)` | Responde aos diálogos que o app mostra a partir de agora (`Alert.alert`, action sheets): `handler` recebe o diálogo (`title`, `message`, `buttons`, `cancelable`, `sheet`) e retorna o texto do botão a pressionar, ou `null` para fechá-lo sem nenhum. |
| `app.dialogs()` | Os diálogos que o app mostrou, em ordem. |
| `app.onPick(handler)` | Responde às seleções que o app pede a partir de agora (`Picker.pickImages`): `handler` recebe o que a seleção pede (`multiple`, `limit`, `maxDimension`, `quality`, `format`) e retorna os arquivos que o usuário escolhe (`{ name, type?, data: Uint8Array }`, entregues ao app como estão), ou `null` para cancelar. Sem um handler, as seleções são canceladas. Execuções headless. |
| `app.picks()` | As seleções que o app pediu, em ordem. |
| `app.hear(text)` | O usuário diz `text` na sessão de fala em andamento (`Speech.start`): seu `result` informa `text` como a transcrição inteira até agora. Execuções headless. |
| `app.endSpeech(error?)` | Encerra a sessão de fala em andamento: com `error` (`"no-speech"`, `"network"`, ...) ela falha, senão chegam um último resultado final e `end`, `no-speech` quando nada foi ouvido. Execuções headless. |
| `app.speechRequests()` | As sessões de fala que o app iniciou, em ordem: `lang` (`null` para a do usuário) e `interim`. |
| `app.clipboard()` | O texto na área de transferência agora, `null` quando ela não contém nenhum. |
| `app.requests()` | As requisições que o app fez, em ordem: `method`, `url`, `headers`, `body`. |
| `await app.host.send(name, data?)` | Envia um evento do app host ao app (`host.on`), depois espera até que fique quieto. Veja [Simulando o app host](#playing-the-host-app). |
| `app.host.calls()`, `app.host.posts()` | As chamadas e posts do app que o `host.handlers` de `open` recebeu, em ordem: `name`, `data`. |
| `app.openedUrls()` | As URLs que o app abriu (`openUrl`), em ordem: registradas, nunca abertas. |
| `await app.setViewport(width, height)` | Redimensiona o viewport, como girar o dispositivo ou redimensionar uma janela faz (`windowSize()`). |
| `await app.setColorScheme(scheme)` | Alterna a aparência do sistema para `"light"` ou `"dark"`, como o usuário faz. |
| `await app.setLifecycle(state)` | Move o app para `"background"`, `"inactive"` ou `"active"`, como o sistema faz quando o usuário o deixa, troca para outro app ou janela e volta (`lifecycle()`). Apenas execuções headless. |
| `await app.screenshot(path?)` | Uma imagem da janela do app como PNG (um `Uint8Array`), também salva em `path` nesta máquina quando informado (relativo ao diretório atual). Somente uma plataforma real desenha o app: veja [Em uma plataforma real](#on-a-real-platform). |

Um passo é resolvido quando o app não renderizou nada por 100 ms e nenhuma animação nativa que termina por conta própria está em execução (2 s no
máximo, para apps que renderizam o tempo todo; em um relógio manual, também 2 s do tempo do app), de modo que o que ele mudou esteja
na tela quando a próxima linha for executada; use `waitFor` para o que vem depois (uma resposta, um timer). Em um relógio manual, um passo
não espera esses 100 ms: ele é resolvido assim que o app executou tudo o que o passo e o tempo do relógio tornaram
devido (timers vencidos agora, promises, uma resposta simulada respondida na hora) e não pede nenhum frame, a menos que uma requisição ainda esteja
em andamento, de modo que os testes em um relógio manual rodam sem pausas entre seus passos. O que outra thread responde (uma chamada de
`nsh/host`, uma leitura de arquivo, o trabalho de uma tarefa Rust em uma thread) chega depois que o passo é resolvido: `waitFor` o que
ela mostra. Uma animação que se repete
para sempre, como um spinner de carregamento, continua rodando em segundo plano enquanto os passos e `waitFor` prosseguem, como uma
animação CSS infinita faz nos testes de um navegador. Um passo rejeita, fazendo o teste falhar, quando nada corresponde ao seu seletor (o erro lista os textos na
tela), quando o app lançou uma exceção nesse meio-tempo e quando o app pediu algo que só uma plataforma real responde.

As falhas que um teste pode esperar carregam um `code`, que permanece como está; suas mensagens são para pessoas e podem mudar, então
um teste compara o código:

| `code` | O passo ou a consulta |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | Nada na tela corresponde ao seletor, ou o menu aberto não tem tal item. |
| `ERR_NSH_TEST_DISABLED` | A view que o seletor nomeia está desabilitada (uma scroll view que o usuário não pode rolar, um item de menu desabilitado). |
| `ETIMEDOUT` | `waitFor` ou `waitUntil` esgotou o tempo, ou o app não renderizou nada após `open`. |
| `ERR_NSH_TEST_NO_BACK` | `back()` não encontrou nada de onde voltar. |
| `ERR_NSH_TEST_UNSUPPORTED` | `open` com `--target` recebeu uma opção que a plataforma do alvo não pode honrar: `width` ou `height` no iOS e no Android, o `platform` de um phone em um desktop ou na web, o de um desktop ou o do outro phone no iOS ou no Android, `host.handlers`. A mensagem a nomeia. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

`app.spanStyle("id:guide")` lê um `<Text testID="guide">` aninhado; `text:word` lê o primeiro caractere
dessa correspondência. Delimite consultas com `id:note >> text:word` e selecione correspondências repetidas com `>> nth=0`.
A consulta informa um erro para um trecho ausente, ambíguo ou vazio. Atualizar o `testID` de um trecho reutiliza seu layout de texto
e preserva a contagem de callbacks de `onTextLayout`.
<a id="what-headless-runs-play-of-the-platform"></a>

### O que as execuções headless fazem pela plataforma

Uma execução headless tem o runtime real e nenhuma plataforma. Ela faz o papel da plataforma que o protocolo do NSH define, e nada do que só uma plataforma real pode fazer:

- **As animações nativas rodam** quadro a quadro, até o fim: os callbacks `start(callback)` são executados, assim como o que depende deles. Loops sem fim rodam até o app pará-los.
- **Voltar** desempilha telas e fecha modais como uma plataforma faz (`app.back()`).
- **Os diálogos são respondidos**: pelo `onDialog` do teste; na falta dele, pelo botão de cancelar; na falta deste, são fechados quando possível. Um diálogo que só os outros botões respondem faz falhar o passo que o exibiu, até que o teste diga qual pressionar.
- **A área de transferência guarda texto**: o que o app copia, lido de volta quando ele cola (`clipboard` para começar com algum texto).
- **O host da página responde `host`** quando o `nsh.json` do app indica um em `web.host` ([O host da página](#the-pages-host)).
- **O app roda sob suas capabilities**: o que seu `nsh.json` declara em `capabilities` é aplicado como em um dispositivo, então o que não é declarado é recusado.
- **As URLs são registradas**: o que o app abre é reportado como aberto, e `app.openedUrls()` o lista.
- **As seleções são respondidas**: com os arquivos do teste (`onPick`) ou, na falta deles, canceladas, de modo que `Picker.pickImages` resolve `[]`.
- **A fala é do teste**: `Speech.available()` resolve `true`, uma sessão começa de imediato e ouve o que `hear` diz.
- **Os modais aparecem de imediato**: `onShow` chega quando um é apresentado.
- **As imagens não são carregadas**: nenhum `onLoad` ou `onError` chega, e `Image.getSize` e `Image.prefetch` são rejeitados.
- **O que só uma plataforma real responde faz o passo falhar**: uma imagem ou arquivos na área de transferência.

<a id="the-pages-host"></a>

### O host da página

Um app publicado na web recebe seu host da própria página: `nsh.json` `web.host`, um módulo que exporta `createHost(player)` ([Web](./web.md#the-hosts-functions)). As execuções headless carregam esse módulo para cada app que um teste abre, antes de o app iniciar, em um contexto JavaScript próprio (timers e `console`, nada do navegador, sem imports): seu `call` responde ao [`host.call`](../modules/nsh.md#host) do app, seu `player.hostEvent` alcança `host.on`, e `host.available()` é `true`. Um `call` que lança um erro, rejeita ou retorna algo que não é JSON rejeita a chamada do app com a sua mensagem, como na página, e os eventos enviados antes de o app iniciar chegam aos listeners de nível superior dele assim que ele inicia. `--web-host <module>` indica outro módulo. O `capabilities.host` do app deve listar o que ele chama, como na página. O timeout de uma chamada e os timers do próprio host rodam no tempo do app, então um relógio manual os move (`app.clock.runFor`). Em um navegador (`--target web`), a página de desenvolvimento executa o `web.host` de `nsh.json` para cada app, como uma página publicada faz; nas outras plataformas (`--target`), os apps não têm host: `host.available()` é `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

`examples/host-echo` tem um app, seu host e seus testes.

<a id="expectations"></a>

### Expectativas

`expect(value)` verifica valores como o Jest faz, como o JS os produziu: `toBe` é `Object.is`, `toEqual` compara membro a membro, e um `Date`, um `Map` ou um `Uint8Array` é comparado como o que é. Cada verificação lança um erro quando não é satisfeita. `.not` inverte as verificações: `expect(app.texts()).not.toContain("Error")`. Dada uma função, `toThrow` verifica o que a chamada dela lança; dada uma promise, ou uma função que retorna uma, `rejects` e `resolves` verificam aquilo em que ela se resolve, como no Jest: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| Verificação | Satisfeita quando |
|---|---|
| `toBe(expected)` | O valor é `expected`, conforme `Object.is`: a mesma primitiva (`NaN` é `NaN`, `0` não é `-0`) ou o mesmo objeto. |
| `toEqual(expected)` | O valor é igual a `expected` membro a membro, como o `toEqual` do Jest: objetos por suas próprias propriedades enumeráveis (uma propriedade que é `undefined` conta como ausente), arrays item a item, datas pelo seu instante, expressões regulares por source e flags, maps e sets por suas entradas em qualquer ordem, `ArrayBuffer`s e typed arrays por seus bytes, erros por nome e mensagem; `NaN` é igual a `NaN`. Uma instância de uma classe é igual a um objeto simples com as suas propriedades. |
| `toMatchObject(subset)` | O valor tem todas as propriedades de `subset`, cada uma igual conforme `toEqual`, e os objetos dentro dele são comparados do mesmo modo; as outras propriedades não são consideradas, e os arrays são comparados item a item, todos eles. |
| `toContain(item)` | Um array, um `Set`, um typed array ou outro iterável contém `item` (`===`), ou uma string o contém. |
| `toContainEqual(item)` | Um array, um `Set` ou outro iterável contém um item igual a `item`, conforme `toEqual`. |
| `toBeTruthy()`, `toBeFalsy()` | O valor é truthy / falsy, como o JS o vê. |
| `toMatch(pattern)` | Uma string contém `pattern` (uma string) ou corresponde a ele (um `RegExp`, executado pelo motor JS: look-behind, backreferences e grupos nomeados funcionam como em JavaScript). |
| `toHaveLength(n)` | O `length` do valor é `n`: as unidades UTF-16 de uma string, os itens de um array ou de um typed array. |
| `toBeNull()` | O valor é `null`. |
| `toBeUndefined()`, `toBeDefined()` | O valor é `undefined` / qualquer outra coisa. |
| `toBeNaN()` | O valor é `NaN`. |
| `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`, `toBeLessThanOrEqual(n)` | Um número se compara assim com `n`. |
| `toThrow(expected?)` | `expect(fn)`: a chamada de `fn` lança um erro. Dado `expected`, o erro corresponde a ele: sua mensagem contém uma string ou corresponde a um `RegExp`; uma classe de erro (`TypeError`, uma classe do app) é o `name` do erro, e `Error` corresponde a qualquer erro; um erro tem a mesma mensagem. |
| `rejects.toThrow(expected?)` | `expect(promise)`: a promise é rejeitada, com um erro que corresponde a `expected` conforme `toThrow`. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: a promise é rejeitada com um valor que corresponde a `subset` conforme `toMatchObject`: as propriedades próprias de um erro (`code`, `permission`, ...) com seu `name` e seu `message`. |
| `resolves.toBe(expected)`, `resolves.toEqual(expected)`, `resolves.toMatchObject(subset)` | `expect(promise)`: a promise é resolvida com um valor que satisfaz a verificação. |

Uma verificação que falha diz o que recebeu e o que esperava, escritos como o JS os escreveria: `expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

`rejects` e `resolves` também têm um `.not` próprio: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### Em uma plataforma real

`nsh test --target macos` (ou `linux`, `windows`, `gpui`, `web`, `ios`, `android`) executa os mesmos testes no host de desenvolvimento da plataforma, em vez de headless: cada `open` inicia o app em uma janela própria, com um diretório de dados novo, e os passos agem com a entrada nativa da plataforma nas views que seus seletores nomeiam, como o Playwright faz em um navegador:

- um toque é um clique no meio da view, um toque longo é um clique mantido, `type` clica no input e digita suas teclas, `scroll` é um gesto de trackpad sobre a scroll view, `back` é o que um usuário faz (Escape no macOS e no Linux, o botão voltar do mouse no Windows e no GPUI, o botão voltar do navegador na web, uma sheet arrastada para baixo, o gesto de escape do VoiceOver enquanto um menu, popover ou `Sheet` está aberto e, fora isso, o botão voltar do cabeçalho no iOS, o botão voltar no Android);
- uma view fora da tela é rolada até ficar visível primeiro, um gesto por vez; em uma tela de toque, o dedo pousa onde a própria página o aceita, ao lado das views que seguem um arrasto (um slider, uma área de desenho), como um usuário rola;
- seletores, esperas e consultas veem o mesmo modelo do app que as execuções headless, construído a partir do que o host desenha, de modo que encontram as mesmas views;
- os diálogos são os da própria plataforma: `app.dialogs()` os lê, e responder a um (`onDialog`, ou o botão de cancelar quando o teste não diz nada) pressiona o botão dele;
- `app.screenshot(path)` tira uma imagem da janela.

```sh
nsh test --target macos                       # the app's tests in macOS windows
nsh test --target linux                       # in GTK windows (xvfb-run -a … on a machine without a display)
nsh test --target windows                     # in Win32 windows
nsh test --target ios                         # in an iOS simulator
nsh test --target android                     # on the Android device or emulator adb lists first
nsh test --target gpui                        # in GPUI windows (macOS, Windows, Linux)
nsh test --target web                         # in a headless Chrome, Edge or Chromium
nsh test tests/form.test.tsx --target macos   # one file
```

A janela abre no tamanho do viewport (390 × 844, a menos que `open` diga outro), dentro da tela; no iOS e no Android, o app ocupa a tela do dispositivo, no tamanho do dispositivo. O app roda como a plataforma do alvo (`platform.os`). Um `clock` manual funciona como no headless: `app.clock.runFor`, `fastForward` e `setSystemTime` movem o tempo do app de imediato (timers, `requestAnimationFrame` com um quadro de distância, `Date`), `app.wait(ms)`, `waitFor` e `waitUntil` também o movem, e cada quadro que a plataforma exibe o move um quadro (1/60 s), de modo que o tempo do app passa enquanto ele anima. As animações da própria plataforma e o `delay` de uma rota levam tempo real. As requisições do app chegam ao teste como no headless: as rotas `network` as respondem, uma requisição que nenhuma rota atende falha, e `"live"` as deixa passar para a rede do host; `app.requests()` as lista todas. Sockets e WebSockets conectam na rede do host com `"live"`, e são recusados como no headless caso contrário. `storage` está no armazenamento do app quando ele inicia, e `app.storage()` o lê a partir do app. `locale`, `reducedMotion` e `safeArea`, quando `open` os fornece (um valor padrão incluído), guardam o que a plataforma reporta, e um `colorScheme` fornecido troca a aparência do sistema (`"light"` também); o que ele omite é o da plataforma, e as chamadas de área de transferência do app são atendidas pela área de transferência do próprio teste (`clipboard` é o texto dela no início, `app.clipboard()` a lê), de modo que a área de transferência da máquina permanece como estava; o copiar e colar de um input de texto usa o do sistema. `host.params` chega ao app, `app.host.send` envia eventos, e as URLs que o app abre são registradas para `app.openedUrls()` em vez de serem abertas. `host.handlers` roda headless, onde o teste responde às chamadas do app. `open` verifica suas opções contra o alvo: `width` e `height` no iOS e no Android, um `platform` de outro tipo de dispositivo (o de um celular em um desktop ou na web, o de um desktop ou o do outro celular no iOS ou no Android) e `host.handlers` são rejeitados com `ERR_NSH_TEST_UNSUPPORTED`, de modo que um teste roda como está escrito ou diz o que precisa. O `platform` de um desktop (`"macos"` para o mouse e as teclas de um desktop) roda em todo alvo desktop e na web, como a plataforma desse alvo e sempre como um desktop: no navegador, a página inicia no idioma desktop seja qual for sua largura, enquanto sem um `platform` (ou com `"web"`) ela mede seu idioma como um navegador faz (desktop a partir de 600 pontos de largura). Um app com crates Rust próprios roda em um host de desenvolvimento compilado com seus crates, que o NSH compila para a plataforma; o host de um app Rust executa sua raiz, então `open(".")` o inicia ali como faz no headless.

Na web, os apps rodam na página do host de desenvolvimento em um Chrome, Edge ou Chromium headless: o instalado nesta máquina, ou o executável que `--browser <PATH>` nomeia (um navegador é necessário: `nsh test` diz onde procurou quando não encontra nenhum). Um único navegador atende a execução, e cada `open` recebe uma página com armazenamento próprio. A entrada é a entrada confiável do navegador, como a de um usuário: cliques do mouse, rolagem com a roda e teclas.

No iOS, os apps rodam no host de desenvolvimento em um simulador iOS: o que já estiver iniciado ou, na falta dele, o iPhone mais recente, que `nsh test` inicia. Os passos são toques de dedo e a digitação do teclado de software, como o UIKit os recebe do dispositivo. `setColorScheme` troca a aparência do simulador, que `nsh test` restaura depois do app, e a tela tem o tamanho do dispositivo simulado.

No Android, os apps rodam no host de desenvolvimento no primeiro dispositivo ou emulador que `adb devices` lista, com armazenamento próprio. Os passos são toques de dedo e teclas de um teclado, como as views do app os recebem do dispositivo; `back` é o voltar do sistema. `setColorScheme` troca o tema escuro do dispositivo, que `nsh test` restaura depois do app.

<a id="steps-from-standard-input"></a>

### Passos a partir da entrada padrão

Dada a entrada do app em vez de testes, `nsh test` abre o app na rede real, deixa-o rodar por 1,2 s e então executa os passos que a entrada padrão fornece, com `app` o app:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

Os 1,2 s deixam a coleta de lixo ociosa do engine rodar antes do primeiro passo, de modo que um app que solta algo que ainda usa o revela: seus handlers deixam de funcionar.

Os exemplos têm testes para servir de ponto de partida: `examples/gallery-rs` para um app Rust (`cargo test`, um módulo por demo, e `App.test.tsx`), `examples/rust-exports` para um app com um crate Rust, `examples/counter` e `examples/gallery/tests` (armazenamento, inputs, uma lista longa, requisições simuladas, modo escuro, um relógio manual) para apps TSX.

<a id="tracing-with---trace"></a>

## Rastreamento com --trace

`--trace` imprime cada lote de montagem dos apps que os testes abrem, sob o passo em que chegou, e o tempo de cada commit. Em Rust, um teste imprime o mesmo: `observe` entrega a ele cada lote com seu passo, e `EngineConfig::trace` registra as linhas `perf` por meio do crate `log` (alvo `nsh::perf`; instale um logger como `env_logger` no teste):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

`nsh test` aceita `--trace` em um arquivo de teste, ou na entrada do app com os passos na entrada padrão:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

Com `--target`, o rastreamento é o da plataforma: os lotes que o host aplicou, sob os passos que os trouxeram, e os tempos do próprio host para cada commit e evento, no hardware do dispositivo.

Use-o para:

- verificar se um app (ou uma demo) compila, é avaliado e renderiza sem erros;
- ver exatamente quais views nativas uma mudança cria, move ou atualiza, e quantas;
- medir o custo do primeiro quadro, de um toque e de cada quadro de rolagem;
- detectar regressões no CI.
<a id="reading-the-output"></a>

### Lendo a saída

Aqui está o exemplo do contador com um toque (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`), resumido:

```text
✓ bundled App.tsx (3255 B in 6.2 ms)
perf commit: 56 ops, 271µs (list js 5µs), 49 mount items, 21 nodes
perf first frame: eval 187µs, total 820µs
── open(App.tsx): 49 items
   LayoutDirection { rtl: false }
   Create { id: 2, kind: View }
   Create { id: 4, kind: Text }
   Insert { parent: 2, child: 4, before: None }
   ...
   Frame { id: 2, x: 0, y: 0, w: 390, h: 844 }
   Frame { id: 4, x: 24, y: 64, w: 342, h: 34 }
   ...
   Text { id: 4, text: "nsh counter", content: 342x34 @ 0,0 }
   Text { id: 14, text: "0", content: 36x77 @ 0,0 }
perf event Press on view 26
perf event js: 413µs
perf commit: 10 ops, 672µs (list js 7µs), 7 mount items, 24 nodes
── press(+1): 7 items
   Create { id: 42, kind: Text }
   Insert { parent: 32, child: 42, before: None }
   Frame { id: 32, x: 24, y: 366, w: 342, h: 43 }
   Frame { id: 42, x: 0, y: 23, w: 342, h: 20 }
   Text { id: 14, text: "1", content: 36x77 @ 0,0 }
   Text { id: 42, text: "• 1", content: 342x20 @ 0,0 }
   Text { id: 34, text: "Recent values: 1", content: 342x17 @ 0,0 }
✓ App.tsx › steps (1.4s)
```

<a id="batches-and-mount-items"></a>

#### Lotes e itens de montagem

Cada bloco `── step: N items` é um **lote de montagem** (*mount batch*), sob o passo em que ele chegou: tudo o que a plataforma aplica às views nativas em um frame,
em um único salto para a thread principal. As linhas dele são **itens de montagem** (*mount items*):

| Item | Significado |
|---|---|
| `Create { id, kind }` | Cria uma view nativa (`View`, `Text`, `Image`, `Scroll`, ...). |
| `Insert { parent, child, before }` | Coloca uma view dentro de sua pai, antes de uma irmã (`None`: no final). |
| `Remove` / `Delete` | Desanexa uma view de sua pai / a libera. |
| `ViewStyle { id, style }` | A decoração da view: fundo, bordas, raio, sombra, opacidade, transformação, ... |
| `ViewProps { id, props }` | Configurações de toque e acessibilidade, `testID`. |
| `Events { id, events }` | Quais eventos a view reporta (`EventMask(1)` é o toque). |
| `Frame { id, x, y, w, h }` | Sua posição e tamanho dentro da view pai, em pontos. |
| `Text { id, text, content }` | Texto já diagramado para uma view de texto. |
| `Image { id, source, ... }` | Uma imagem a ser carregada. |

Apenas o que mudou é enviado: um toque que altera um número envia um único item `Text`; as views não recebem estilo padrão nem máscara de eventos vazia; frames sem mudanças não são enviados. Um frame de rolagem que não revela nenhuma linha nova não produz **nenhum lote**.

<a id="the-762-lines"></a>

#### As linhas `perf`

| Linha | Significado |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | Tempo de bundling e tamanho do bundle (configurações de desenvolvimento). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | Um commit: as operações que o JS enfileirou, o tempo gasto pelo core (renderizando componentes, calculando o layout, fazendo o diff), o tempo de JS gasto vinculando linhas de lista, os itens de montagem produzidos e os nós vivos. |
| `turn: 2640µs (timers and tasks 1964µs)` | Um turno que fez commit: seu tempo total e quanto levaram seus timers JS e tarefas de componentes Rust antes do commit (um componente Rust é renderizado no commit). |
| `first frame: eval 271µs, total 1235µs` | Tempo para avaliar o bundle e do início até o primeiro lote. |
| `event Press on view 20` / `event js: 196µs` | Um evento despachado e o tempo que seu handler (e o que ele causou) levou no JS. |

> [!NOTE]
> O texto é medido por um motor de texto aproximado no modo headless, então os tamanhos de texto diferem um pouco dos de um dispositivo, que usa
> CoreText ou o layout de texto do Android. A lógica de layout, a contagem de views e a contagem de operações são as mesmas.

Os tempos de uma única execução dependem muito do estado de clock da CPU (uma máquina que acabou de sair do repouso é lenta). Compare execuções
na mesma máquina, observe o mínimo de várias execuções e confie mais nas contagens de operações e de itens do que nos microssegundos.

<a id="scrolling"></a>

### Rolagem

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` move a lista 10 pontos por frame, a 60 frames por segundo, e o lote de cada frame é impresso:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

Para uma [lista](./lists.md), isso mostra a virtualização em ação: quais frames vinculam novas linhas, quantas operações uma linha
custa e que frames que não revelam nenhuma linha nova não produzem nada. Use com um build de release (`cargo test --release`, ou `./target/release/nsh` em um checkout) para obter tempos significativos.

<a id="in-ci"></a>

### Em CI

Testes headless não precisam de dispositivo nem de tela, então rodam em runners Linux: `cargo test` para os testes de um app em Rust, e
`nsh test`, que não precisa de nada além da CLI. Qualquer teste com falha faz ambos encerrarem com código diferente de zero: um teste que
falha, um app que não compila ou não renderiza nada, uma exceção lançada pelo app durante um passo.

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test                            # a Rust app's tests
      - run: nsh test --junit test-results.xml     # its TypeScript tests, or a TSX app's
```

(Instale a CLI `nsh` no runner da mesma forma que você a instala localmente; veja [Instalação](./installation.md).)

`--junit <FILE>` também grava os resultados como um relatório JUnit XML, que serviços de CI (reporters de testes do GitHub Actions,
GitLab, Jenkins, Azure Pipelines) exibem por teste: um `testsuite` por arquivo de teste, um `testcase` por teste, com o que falhou,
onde, e os textos na tela.

Para proteger o desempenho, registre as contagens de itens de algumas interações (as linhas `── … : N items` e os números `ops` /
`mount items` de `--trace`) e faça o build falhar quando elas crescerem. As contagens são determinísticas; os tempos em máquinas de CI compartilhadas
não são.

> [!NOTE]
> Os testes rodam sob o `capabilities` que o `nsh.json` do app declara, como em um dispositivo: o que o app não declara é
> recusado também no teste.

<a id="784-for-ui-tests"></a>

## `testID` para testes de UI

Testes headless verificam o que o runtime renderiza, e seus seletores `id:` encontram views por test id. Para controlar a UI
nativa real com as ferramentas de teste da plataforma (XCUITest, Espresso / UI Automator, Appium, Maestro), dê um test id às views:
`.test_id(…)` em Rust, `testID` em TSX:

```rust tabs
view()
    .test_id("add-to-cart")
    .p_3()
    .on_press(add)
    .child(text(move || format!("{} items", count.get())).test_id("cart-count"))
```

```tsx tabs
<View testID="add-to-cart" onPress={add} style={{ padding: 12 }}>
  <Text testID="cart-count">{`${count()} items`}</Text>
</View>
```

| Plataforma | Onde `testID` vai parar |
|---|---|
| iOS | O `accessibilityIdentifier` da view (`app.otherElements["add-to-cart"]` no XCUITest). |
| Android | O nome do recurso de id da view do nó de acessibilidade (`By.res("add-to-cart")` no UI Automator). |

O test id é um método de todo elemento em Rust, inclusive os elementos de componentes (`button().test_id("save")`, que
nomeia a raiz do componente), e `testID` uma prop de todo elemento e de todo componente Rust (`Button`, `Dialog`, ...). Ele não altera o que os leitores de tela
dizem; use `accessibilityLabel` para isso (veja [Acessibilidade](./accessibility.md)). Na saída de `--trace`, ele aparece no
item `ViewProps` da view como `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## Veja também

- [Desempenho](./performance.md): o que observar nesses números
- [Servidor de desenvolvimento e depuração](./dev-server-and-debugging.md)
- [Arquitetura](./architecture.md): ops, commits e lotes de montagem
