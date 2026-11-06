---
title: "Servidor de Desenvolvimento e Depuração"
description: "Execute aplicativos Rust e TSX com nsh run e nsh dev, conecte simuladores, emuladores e dispositivos, e use recompilações, hot module replacement, logs, o overlay de erros e stack traces com source maps."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---


# Servidor de Desenvolvimento e Depuração

Durante o desenvolvimento, o NSH compila seu app a cada salvamento. Um app Rust (`nsh.json` indica seu `"root"`) é compilado em seu próprio runner, que o `nsh run` inicia; uma alteração em seu crate o compila novamente e reinicia o app. Um app TSX é enviado a todos os hosts conectados, que são atualizados no próprio lugar. Dois comandos fazem isso:

- `nsh run` compila o app **e** o inicia: uma janela Mac Catalyst ou AppKit, uma janela GTK no Linux, uma janela Win32 no Windows, um simulador de iOS, um dispositivo ou emulador Android, ou uma página de navegador. Para TSX, também inicia o servidor de desenvolvimento, ao qual o host de desenvolvimento se conecta.
- `nsh dev --server-only` inicia o servidor de desenvolvimento para TSX, para hosts que você mesmo inicia: seu próprio app com o SDK de desenvolvimento, um dispositivo na rede ou vários hosts ao mesmo tempo.

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev` também abre o host nativo por padrão; os hosts móveis usam `--target ios` ou `--target android`.

## `nsh run`

| Flag | Descrição |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | Onde executar. O padrão é `macos` no macOS (AppKit), `linux` no Linux e `windows` no Windows. Um app Rust roda em todos eles, exceto `gpui`, que incorpora sua raiz em um app GPUI ([GPUI](./gpui.md)). |
| `--device <name or UDID>` | O simulador de iOS a usar. Padrão: um simulador já iniciado; caso contrário, o iPhone mais recente (iniciado para você). |
| `--port <port>` | Porta do servidor de desenvolvimento. Padrão 8790; a próxima porta livre é usada se ela estiver ocupada. |
| `--release` | Serve builds de release de TSX (minificados, sem informações de depuração, sem atualizações a quente). |
| `--trace` | Registra no log o tempo de cada commit no host (apps TSX). |

O que cada destino faz:

- **`catalyst`** (macOS) executa o host de desenvolvimento como um app Mac. Encerrar `nsh run` (Ctrl-C ou `kill`) o fecha, e fechar a janela encerra `nsh run`.
- **`macos`** (macOS) executa o host de desenvolvimento AppKit, um app desktop em uma janela de 1200×800, da mesma forma; Cmd+R recarrega o build mais recente. Requer macOS 14 ou posterior ([macOS](./macos.md)).
- **`linux`** (Linux) executa o host de desenvolvimento GTK em uma janela de 390×844, da mesma forma: encerrar `nsh run` o fecha, e fechar a janela encerra `nsh run`. Requer GTK 4.14 ou posterior ([Linux](./linux.md)).
- **`windows`** (Windows) executa o host de desenvolvimento Win32 em uma janela de 1200×800, da mesma forma; o host nunca sobrevive a `nsh run`, mesmo quando o console é fechado. Requer Windows 10 1809 ou posterior ([Windows](./windows.md)).
- **`ios`** instala o host de desenvolvimento no simulador, o inicia apontando para o servidor de desenvolvimento e continua observando. O simulador compartilha a rede do Mac, então o host alcança o servidor em `127.0.0.1`. Encerrar `nsh run` (Ctrl-C) fecha o host, que de outra forma entraria na próxima sessão. Requer Xcode.
- **`android`** instala o APK do host de desenvolvimento (de novo apenas quando o runtime mudou), executa `adb reverse tcp:<port> tcp:<port>` para que o `127.0.0.1` do próprio dispositivo alcance o servidor, e o inicia. Funciona com um emulador ou um dispositivo USB. Requer o Android SDK (`ANDROID_HOME`). Quando `nsh run` termina (inclusive com Ctrl-C), ele para o host e remove esse redirecionamento de porta, para que o host não entre na próxima sessão.

Quando `nsh run` termina, seja como for, ele para o host que iniciou: encerra o app Catalyst ou fecha o host macOS, Linux ou Windows, termina o host de desenvolvimento no simulador, ou o força a parar no dispositivo.

Para um app Rust, cada destino executa o runner do próprio app, compilado com seu crate: nos desktops, um build de debug no próprio lugar, com a saída no terminal; no iOS e no Android, um pacote dele, instalado. Para TSX, os hosts são genéricos: executam qualquer app NSH que o servidor envie, então não há nada a compilar por app (um app com um crate próprio recebe hosts compilados com ele).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| Flag | Descrição |
|---|---|
| `--port <port>` | Porta do servidor de desenvolvimento. Padrão 8790 (a próxima livre, se estiver ocupada). |
| `--release` | Serve builds de release. |

Conecte os hosts à URL exibida:

- **Seu próprio app iOS**, vinculado com `NativeShellDev.xcframework`: `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`. Veja [Embedding in iOS apps](./ios.md#development).
- **Seu próprio app Android**, com `nsh-dev.aar`: `nsh.connectDevServer("ws://192.168.1.20:8790/ws")`, ou `adb reverse tcp:8790 tcp:8790` e `ws://127.0.0.1:8790/ws`. Veja [Embedding in Android apps](./android.md#development).

Qualquer número de hosts pode estar conectado ao mesmo tempo; cada build vai para todos eles. Um host que se conecta depois recebe o build atual imediatamente. Um host que não consegue executar o app, porque lhe falta um conjunto de UI que o app importa (um host de desenvolvimento compilado para outro app), não recebe o build: ele mostra o motivo, e o terminal imprime uma linha `warn` com o comando que instala o host do app.

> [!NOTE]
> Um dispositivo na LAN precisa alcançar seu computador na porta do servidor de desenvolvimento: mesma rede, sem firewall no meio. Os assets (imagens, fontes) são servidos por HTTP simples a partir da mesma porta.

<a id="rust-edits"></a>

## Edições em Rust

Rust é compilado: uma alteração no crate de um app, ou em um crate do qual ele depende por caminho, compila o app novamente, e `nsh run` o reinicia com o novo código. O estado do app começa do zero; mantenha o que precisa sobreviver a uma reinicialização em [storage](../modules/nsh.md#storage). Um erro de build é impresso no terminal, e o próximo salvamento que compilar executa novamente. Em um app com Rust e TSX, as edições de TSX continuam sendo atualizações a quente (abaixo) e as edições de Rust reiniciam o app.

<a id="hot-module-replacement"></a>

## Substituição de módulos a quente

Os builds de desenvolvimento de TSX mantêm um módulo por arquivo de código-fonte. Quando você salva, o NSH recompila, compara os módulos com o último build bom e envia um **patch** apenas com os módulos que mudaram. O host o aplica no próprio lugar em bem menos de um milissegundo; do salvamento do arquivo até ver a mudança leva cerca de 120 ms.

O que acontece com seu app:

- **Apenas os componentes que você editou são renderizados novamente.** Todo componente de nível superior (uma função com inicial maiúscula que retorna JSX) é envolvido por um proxy estável. Quando seu código muda (ou o restante do código de seu módulo, que ele pode usar), suas instâncias são renderizadas novamente com o novo código; os componentes cujo código não mudou mantêm suas instâncias e, com elas, seus signals e estado. Edite o estilo de um botão e a tela permanece onde estava, com o mesmo texto de entrada e a mesma posição de rolagem.
- **Os módulos que mudaram são executados novamente**, assim como os módulos que importam um módulo alterado e não conseguem absorver a atualização sozinhos, até a entrada. O código de nível de módulo, portanto, é executado novamente, exceto o que mantém seu estado:
- **Signals e pilhas de navegação de nível superior mantêm seu estado**: um `const` criado por `signal(…)` ou `createNavStack(…)` no topo de um módulo mantém seu valor (uma pilha, suas páginas) entre as edições, desde que seu próprio inicializador seja o mesmo; mude o inicializador (`signal(0)` para `signal(10)`) para começar do zero.
- **Objetos `context()` de nível superior mantêm sua identidade**, assumindo o novo valor padrão, de modo que providers e consumers em módulos diferentes continuem correspondendo.
- **Editar a entrada mantém o app montado.** `mount(App)` (ou `mount(() => <App />)`) executado novamente com o mesmo componente mantém o que ele montou: apenas os componentes que você editou são renderizados novamente. Edite o próprio `App` e ele é renderizado novamente, junto com o que renderiza (o estado deles começa do zero), mas um navegador criado no topo do módulo mantém suas rotas, de modo que uma tela empilhada continua empilhada. Uma chamada `mount` que mudou (outro componente, props) monta o app novamente.
- **Um componente que lança uma exceção** reporta o erro e não renderiza nada até você corrigi-lo; o restante do app continua em execução. O próximo salvamento bom se recupera.

O host **recarrega o app inteiro** em vez de aplicar um patch quando:

- a alteração importa um módulo NSH que o app em execução ainda não havia importado (por exemplo, o primeiro `import … from "nsh"`);
- o `capabilities` do app em `nsh.json` mudou;
- o host não está executando o build no qual o patch se baseia (acabou de se conectar, ou um carregamento anterior falhou);
- um patch não pode ser aplicado.

> [!TIP]
> O estado que um componente mantém em seus próprios signals é redefinido quando esse componente, ou um que o renderiza, é editado. Mantenha o estado que precisa sobreviver às edições em signals de nível superior (ou em um módulo de store) e crie os navegadores no topo de um módulo.

`--release` serve builds de release, sem atualizações a quente: cada salvamento recarrega o app. Use-o para verificar o build minificado. Tudo o que é carregado de um servidor de desenvolvimento, `--release` ou não, dispensa o hardening do runtime (`eval` continua disponível); veja [Sandbox and capabilities](./sandbox-and-capabilities.md#hardening).

## Logs

Um app Rust registra logs com o crate `log` (`log::info!`, `log::warn!`, `log::error!`): `nsh run` mostra as linhas em seu terminal, junto com a saída do app, nos desktops e no simulador de iOS.

Em TSX, `console.log`, `console.info`, `console.debug`, `console.warn` e `console.error` vão para o log nativo com o target `js`. Enquanto um host está conectado, suas linhas de log são encaminhadas ao terminal que executa `nsh run` / `nsh dev`: suas linhas de `console.log` como estão (com o nome do dispositivo como prefixo quando vários dispositivos estão conectados), e os avisos e erros após o nome do dispositivo:

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log` formata os valores como um console de navegador: strings como estão, erros com sua stack, funções pelo nome, objetos e arrays como JSON. Quando o host não está conectado, os logs vão para o log da plataforma (o console do Xcode / o unified log no iOS, `adb logcat` no Android).

Uma promise rejeitada que ainda não tem handler quando o trabalho que a rejeitou termina (suas microtasks foram executadas) também é registrada como erro, do jeito que um navegador a reporta: uma função `async` que lança uma exceção sem que ninguém a aguarde, um `Promise.reject(…)` que ninguém captura, uma chamada ao Rust que falha sem que nada esteja esperando por ela. A linha vai para onde `console.error` vai (o terminal, o log da plataforma, o console do navegador na web), com sua stack apontando para seus fontes:

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

Um handler anexado mais tarde no mesmo turno (`const p = load(); …; p.catch(…)`) conta como tratamento. Aguarde a promise ou dê a ela um `.catch` onde a falha importa.

O restante do terminal tem uma linha por etapa (`✓` concluído, `→` onde se conectar, `•` o que um dispositivo fez); a saída das ferramentas que o NSH executa (cargo, os próprios hosts) só é impressa quando uma delas falha. `nsh run -v` (ou `NSH_VERBOSE=1`) imprime tudo: cada linha de log com seu nível e origem, a saída do cargo e a dos próprios hosts.

`--trace` adiciona o custo de cada commit:

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Veja [Testing](./testing-and-trace.md) para saber o que esses números significam.

<a id="the-error-overlay"></a>

## A sobreposição de erros

Estes erros exibem uma sobreposição vermelha sobre o app no host, com a mensagem e a stack:

- uma falha de build (um erro de sintaxe, um elemento desconhecido, um import ausente), com um trecho de código apontando para a linha;
- um erro durante a avaliação do bundle;
- uma exceção não capturada em um handler de evento, timer ou effect.

Toque na sobreposição para dispensá-la. Ela também desaparece no próximo recarregamento bem-sucedido. As falhas de build também são impressas no terminal:

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

O bundler remove os tipos do TypeScript sem verificá-los; execute [`nsh check`](./cli.md#nsh-check) (o compilador nativo do TypeScript, com o `tsconfig.json` que `nsh init` gera; sem necessidade de Node) ou confie em seu editor para os erros de tipo.

Em builds de release (um app de incorporação com o SDK de release, um app empacotado), os erros são registrados em log e passados ao manipulador de erros do app host (`NshAppView.onError`, `NshView.setErrorListener`), mas não são exibidos sobre o app.

<a id="source-maps-and-stack-traces"></a>

## Source maps e stack traces

O bundling produz um source map que compõe todas as etapas (TypeScript → JSX → o bundle), e ele é enviado junto com cada build. Antes de um stack trace ser impresso ou exibido, o runtime reescreve as posições do bundle para os seus fontes, de modo que as stacks apontam para `App.tsx:2:28`, e não para o bundle:

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build` grava o mapa como `bundle.js.map`; um app de incorporação que carrega um bundle de uma pasta o lê ao lado do bundle, e os [pacotes assinados](./signed-packages.md) também o carregam, a menos que ele seja mantido ao lado do pacote e aplicado com `nsh symbolicate` ([Errors from published packages](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## Dicas de depuração

- **Nada é atualizado após uma edição**: verifique o terminal em busca de um erro de build; a sobreposição também o mostra no host.
- **O app mantém um estado antigo que você esperava que fosse redefinido**: a substituição a quente mantém de propósito o estado dos componentes inalterados, os signals de nível superior e os navegadores. Reinicie com Ctrl-C e `nsh run`, ou mude o inicializador do estado.
- **Uma requisição falha apenas em um build empacotado ou incorporado**: verifique as [capabilities](./sandbox-and-capabilities.md) do app; as recusas são registradas em log com a chave a adicionar.
- **Algo está lento**: reproduza sem interface gráfica com [`nsh test --trace`](./testing-and-trace.md), que imprime cada operação de view nativa, ou execute um app TSX com `--trace`.
- **Erros de tipo no editor**: `nsh run` e `nsh dev` mantêm `.nsh/types` atualizado; veja [Project structure](./project-structure.md).

<a id="see-also"></a>

## Veja também

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
