---
title: "CLI"
description: "Todos os subcomandos e flags do NSH - init, build, test, check, dev, run, package e os comandos de assinatura keygen, certify, publish, verify, symbolicate e revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---


# CLI

`nsh` é a ferramenta com a qual um app NSH é construído, em Rust ou TSX. Todo subcomando que compila um app aceita `[ENTRY]`: o diretório do app (padrão: o atual, então `cd my-app && nsh run` funciona), que executa o componente raiz de um app Rust (`nsh.json` `"root"`) ou o `App.tsx` de um app TSX, ou um módulo de entrada TSX. Ele lê `nsh.json` na raiz do app e atualiza as declarações de tipo em `.nsh/types`.

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help` imprime as flags de um comando; `nsh -V` (`--version`) imprime a versão e a revisão do Git a partir da qual ele foi compilado.

<a id="output"></a>

## Saída

Todo comando imprime uma linha por etapa, e os detalhes apenas quando algo falha:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` é uma etapa concluída, `→` indica onde se conectar, `•` indica o que um dispositivo fez; as linhas `warn` e `error` são problemas, e as linhas simples são a saída do próprio app (`console.log`). Em um terminal, um spinner mostra a etapa em execução, e as linhas são coloridas (a menos que `NO_COLOR` esteja definido); quando redirecionada para um arquivo, apenas as linhas de resultado são gravadas, sem cores. A saída das ferramentas que o NSH executa (cargo para o crate Rust de um app, os hosts de desenvolvimento) é impressa abaixo de uma linha `error` quando uma delas falha.

`-v, --verbose` (qualquer comando; também `NSH_VERBOSE=1`) imprime tudo conforme acontece: cada linha de log com seu nível e origem, a saída do cargo e a dos próprios hosts.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Cria um app em `DIR` (padrão: o diretório atual, criado se não existir) a partir de um template. Sem `--template`, `nsh init` pergunta qual usar em um terminal (Enter escolhe `ts`) e usa `ts` nos demais casos (um script, CI).

| Template | O que cria |
|---|---|
| `rust` | Um app escrito em Rust: um projeto Cargo (`Cargo.toml`, `src/lib.rs` com o componente raiz, `src/main.rs` para `cargo run`), `nsh.json` com `"rust": "."` e `"root": "App"`, o teste da raiz `App.test.tsx` com `tsconfig.json` e `.nsh/types`, `.gitignore` e um README, que também explica como adicionar uma entrada TSX depois. `nsh run` e `nsh package` montam a raiz sem QuickJS em todos os destinos (`nsh test` a abre para testes em TypeScript), inclusive no navegador ([Building with Rust](./rust.md)); `cargo run` a inicia diretamente no macOS, Windows ou Linux. |
| `ts` | Um app TSX: `App.tsx`, seu teste `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` e `.nsh/types`. Arquivos que já existem são mantidos; falha apenas se todos eles já existirem. |
| `mixed` | Um app TSX com um crate Rust próprio na raiz: `App.tsx`, seu teste `App.test.tsx`, `tsconfig.json`, `nsh.json` com `"rust": "."`, `.gitignore`, `.nsh/types`, um README, e o crate ao lado de `App.tsx` (`Cargo.toml`, `src/lib.rs`), cujo `#[native_module("<name>/native")]` exporta um componente, um módulo e uma classe que `App.tsx` usa. Sem `"root"`, `App.tsx` é a entrada. |

| Flag | Descrição |
|---|---|
| `--name <NAME>` | Nome de exibição gravado em `nsh.json`. Padrão: o nome do diretório. O id se torna `com.example.<name>` (apenas letras e dígitos, em minúsculas), e o especificador de importação dos crates, `<name>/native` (em minúsculas, palavras unidas por `-`). |
| `--template <TEMPLATE>` | `rust`, `ts` ou `mixed` (acima). `rust` e `mixed` precisam de Rust; `cargo run` também precisa das bibliotecas de desenvolvimento do backend desktop nativo. |
| `--nsh-source <DIR>` | Com `rust` ou `mixed`: os crates dependem, por caminho, dos crates do NSH do checkout em `DIR`, para compilar o app com as fontes do NSH. |

Os crates de `rust` e `mixed` dependem dos crates do NSH no crates.io na versão da CLI (com `--nsh-source`, nos de um checkout), e os comandos `nsh` compilam os runners e hosts do app a partir dos mesmos crates. Antes de cada comando em um app assim, `nsh` compila um pequeno programa com os crates do app e o núcleo do NSH que descreve seus componentes, módulos e classes, e o executa quando os crates mudaram; com essa descrição, a própria CLI empacota, compila, verifica tipos, serve e distribui o app. As compilações de um app Rust compilam apenas seus crates e o núcleo do NSH. Crie-os em um diretório de app novo: a existência de qualquer um desses arquivos é reportada como conflito antes de qualquer gravação.

Apps cujos crates Rust dependem do NSH via Git usam o checkout que o Cargo resolve no lockfile do app. Os hosts gerados compartilham esse checkout, incluindo as dependências do NSH redirecionadas pelos patches do Cargo do app.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Para uma entrada TSX, `nsh run` inicia o servidor de desenvolvimento (como `nsh dev`), abre um host de desenvolvimento que carrega o app a partir dele e recompila a cada salvamento. O Hot Module Replacement atualiza o app em execução no próprio lugar; logs e erros do app são impressos no terminal. Encerre com Ctrl-C (ou fechando a janela do Catalyst, macOS, Linux, Windows ou GPUI). Seja qual for a forma como termine (Ctrl-C, `kill` / `pkill`, um erro), ele encerra o host que iniciou: o app Catalyst, o host macOS, Linux, Windows ou GPUI, o host de desenvolvimento no simulador ou no dispositivo Android.

Um app Rust (`nsh.json` `"root"`, [Building with Rust](./rust.md)) é executado sem servidor de desenvolvimento e sem QuickJS: `nsh run` compila o runner do app para o destino com a raiz montada, o inicia (nos desktops, uma compilação de debug, com seus logs no terminal; no simulador e no Android, o app instalado) e, quando o código Rust do crate muda, compila de novo e o reinicia. Com `--target web`, ele imprime o endereço da página, e a página aberta carrega o novo runtime sozinha. Informe a entrada TSX (`nsh run App.tsx`) para executá-la.

| Flag | Padrão | Descrição |
|---|---|---|
| `--target <TARGET>` | `macos` no macOS, `linux` no Linux, `windows` no Windows | `catalyst`: o host Mac Catalyst, uma janela do tamanho de um iPhone (390×844). `ios`: o host em um simulador de iOS. `android`: o host em um dispositivo ou emulador Android. `macos`: o host AppKit, uma janela de 1200×800 ([macOS](./macos.md)). `linux`: o host GTK, uma janela de 390×844 ([Linux](./linux.md)). `windows`: o host Win32, uma janela de 1200×800 ([Windows](./windows.md)). `gpui`: o host GPUI, uma janela de 1200×800, no macOS, Windows ou Linux, exibindo um app TSX como os apps GPUI que o incorporam o exibem ([GPUI](./gpui.md)). `web`: a página do servidor de desenvolvimento, no endereço que ele imprime ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Simulador de iOS a usar, por nome (`"iPhone 16 Pro"`) ou UDID. Padrão: um já inicializado; do contrário, o iPhone mais recente, que é inicializado. |
| `--port <PORT>` | `8790` | Porta do servidor de desenvolvimento. Substitui a sessão de desenvolvimento anterior do NSH nessa porta depois que a limpeza dela termina. |
| `--release` | | Minifica e remove informações de debug. Bundles de release não têm Hot Module Replacement: cada salvamento recarrega o app. |
| `--limits [<LIMITS>]` | | Executa o app como um app incorporado em outro, dentro dos limites definidos pelo app host: `memory` e `stack` (em `KB`, `MB` ou `GB`), `load` e `call` (em `ms` ou `s`) e `nodes`, como `--limits memory=128MB,call=500ms`. Os que forem omitidos mantêm os padrões de incorporação, com os quais `--limits` sozinho é executado ([Sandbox and capabilities](./sandbox-and-capabilities.md#limits)). Sem ele, o app é executado por conta própria, como um app empacotado. Entradas TSX. |
| `--trace` | | O host registra no terminal o tempo de cada commit (JS, layout, itens de montagem). |
| `--fps` | | O monitor de desempenho: taxa de quadros, o custo de quadros e commits, CPU, GPU e memória, exibido sobre o app no macOS ([macOS](./macos.md#performance-monitor)) e registrado uma vez por segundo no macOS, Linux, Windows e iOS. |
| `--name <NAME>` | nome de `nsh.json` | Nome de exibição do aplicativo na barra de menus e título inicial da janela (`--target macos`, entradas TSX). |
| `--window-size <WIDTHxHEIGHT>` | Padrão do host | Tamanho inicial da janela em pontos, como `800x600` (`--target macos`, `linux`, `windows` e `gpui`, entradas TSX). |
| `--display <N>` | A tela principal | A tela em que a janela abre, centralizada: `1` é a tela primária (a que tem a barra de menus), `2` a seguinte, e assim por diante; um número sem tela correspondente a abre na principal (`--target macos`, entradas TSX). |

Com `--target android`, o primeiro dispositivo que `adb devices` lista é usado; a porta do servidor de desenvolvimento é encaminhada a ele com `adb reverse`. Veja [Getting started](./getting-started.md#run-it) e [Dev server and debugging](./dev-server-and-debugging.md).

Uma substituição aguarda até dez segundos para que a sessão anterior conclua a limpeza. Uma porta ocupada por outro programa, ou por uma CLI mais antiga do NSH, produz um erro com o nome da porta. Use valores de `--port` distintos para executar vários apps juntos; `--port 0` pede ao sistema operacional uma porta livre.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Inicia o servidor de desenvolvimento e abre o host nativo deste sistema: AppKit no macOS, GTK no Linux, Win32 no Windows. Escolha `--target ios` ou `--target android` explicitamente para o desenvolvimento mobile. `--server-only` atende hosts que você mesmo inicia. O servidor compila o app, observa o diretório da entrada e envia cada recompilação aos hosts conectados. Com `--server-only`, ele imprime a URL para hosts nesta máquina e uma por endereço de LAN para dispositivos e, quando o runtime web está presente, a página que os navegadores abrem para executar o app ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Use `nsh dev --server-only` com um app que incorpora o SDK de desenvolvimento (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` e `--limits` funcionam como em `nsh run`; `--server-only` seleciona um servidor sem um host iniciado.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Executa os testes do app em modo headless ([Testing](./testing-and-trace.md)): os arquivos de teste (`*.test.tsx`, `*.test.ts`, importando `nsh/test`) em `PATH`, um diretório (padrão: o atual; diretórios ocultos, `node_modules` e `target` são ignorados), ou o arquivo de teste `PATH`. Dado um diretório de um app com crates Rust próprios (`nsh.json` `"rust"`: um app Rust ou um app TSX com um crate), ele executa primeiro `cargo test` para cada crate do diretório, no diretório do próprio crate, e mostra e contabiliza cada teste Rust junto com os testes TypeScript, sob o arquivo do seu alvo de teste (`src/lib.rs › tests::adds`); um app Rust com apenas testes Rust também é testado dessa forma. Cada arquivo de teste é executado em um engine próprio, e cada app que seus testes abrem, em outro engine novo. Ele imprime uma linha por teste e, em caso de falha, o que foi lançado, o local no arquivo de teste e os textos na tela; qualquer falha faz com que ele saia com código diferente de zero. Dada a entrada do app (`nsh test App.tsx`; a de um app Rust: `nsh test nsh.json`), ele abre o app na rede, deixa-o executar por 1,2 s e executa os passos fornecidos pela entrada padrão (`await app.press("Add")`, com `app` sendo o app). Um app TSX é executado no próprio processo da CLI; um app com crates Rust próprios é executado em um runner headless compilado com eles, para o qual a CLI compila as entradas. As execuções headless se comportam como iOS, a menos que um teste abra o app como Android (`open`, `platform`): `platform.os` é `"ios"`, e as classes `ios:` e as props `ios={{…}}` se aplicam.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Flag | Descrição |
|---|---|
| `--filter <NAME>` | Executa apenas os testes cujo nome (após os nomes dos blocos `describe` em que está) contém `NAME`; para os crates, `cargo test <NAME>`. |
| `--trace` | Imprime cada lote de montagem dos apps que os testes abrem, sob o passo em que chegou (`── press(Add): 7 items`), e o tempo de cada commit: quanto custam o primeiro quadro, um passo ou um quadro de rolagem. Com `--target`, os lotes e tempos do host. |
| `--fps` | Com `--target linux`, `macos`, `windows` ou `ios`: o host registra uma vez por segundo as leituras do seu monitor de desempenho (taxa de quadros, fases de quadro, commits, CPU, memória), exibidas com `-v`. |
| `--junit <FILE>` | Também grava os resultados em `FILE` como um relatório JUnit XML, o formato a partir do qual serviços de CI mostram resultados de teste: um `testsuite` por arquivo de teste, um `testcase` por teste. |
| `--target <TARGET>` | Executa os apps que os testes abrem no host de desenvolvimento desta plataforma em vez de headless (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` e `android`; `web` os executa em um Chrome, Edge ou Chromium headless): os passos agem com a entrada nativa da plataforma ([Testing](./testing-and-trace.md#on-a-real-platform)), e `open` verifica suas opções em relação à plataforma, rejeitando as que ela não pode honrar (`ERR_NSH_TEST_UNSUPPORTED`: `width` e `height` no iOS e no Android, um `platform` de outro tipo de dispositivo). Os testes Rust dos crates são executados nesta máquina, nas execuções sem `--target`. |
| `--browser <PATH>` | O executável do Chrome, Edge ou Chromium no qual `--target web` executa os apps (padrão: o instalado nesta máquina). |
| `--display <N>` | Com `--target macos`: a tela em que as janelas dos apps abrem, centralizadas: `1` é a tela primária (a que tem a barra de menus), `2` a seguinte, e assim por diante; um número sem tela correspondente as abre na principal. Por padrão, elas abrem em uma tela secundária (a primeira além da primária, que não seja espelho dela), de modo que uma execução de testes fica em uma tela própria, e na primária quando ela é a única. Os testes são executados da mesma forma em qualquer tela. |
| `--web-host <JS>` | O módulo host da página web que os apps abertos em modo headless recebem (padrão: `nsh.json` `web.host`; ele exporta `createHost(player)`): responde às chamadas de [`host`](../modules/nsh.md#host) deles, e seu `player.hostEvent` alcança `host.on` ([Testing](./testing-and-trace.md#the-pages-host)). Apenas em execuções headless; `--target web` executa o `web.host` de `nsh.json`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Verifica os tipos do app. Em um app com crates Rust próprios (`nsh.json` `"rust"`), cada crate é verificado primeiro com `cargo check --all-targets` no diretório do crate, testes incluídos; erros do Cargo fazem o comando encerrar com código diferente de zero. Um app Rust (`"root"`) é então verificado na medida em que tem TypeScript: com um `tsconfig.json` (o que `nsh init --template rust` escreve para `App.test.tsx`), seus arquivos de teste também têm os tipos verificados. A verificação do TypeScript atualiza `.nsh/types` e `.nsh/tsconfig.json` e depois executa `tsc -p <app directory> --noEmit` com o `tsconfig.json` do app. Ela usa o TypeScript 7, o compilador nativo, que não precisa de Node: na primeira execução, ele é baixado do registro npm (cerca de 9 MB), conferido com o checksum que o NSH registra e guardado no cache do NSH (`~/Library/Caches/nsh` no macOS, `~/.cache/nsh` no Linux, `%LOCALAPPDATA%\nsh` no Windows, ou `NSH_CACHE`). Erros de tipo fazem o comando encerrar com código diferente de zero. Ele emite um aviso quando `tsconfig.json` não estende `./.nsh/tsconfig.json`, onde o NSH mantém suas configurações de TypeScript ([Estrutura do projeto](./project-structure.md#tsconfigjson-and-nshtypes)).

| Flag | Descrição |
|---|---|
| `--tsc <TSC>` | Executa este `tsc` no lugar (também `NSH_TSC`), por exemplo um de `node_modules` ou uma cópia para máquinas sem rede. |
| `-- <TSC ARGS>` | Repassado a `tsc`, por exemplo `nsh check -- --pretty false`. |

Os arquivos gerados pelo NSH ficam em `.nsh/`: declarações, fontes dos runners e saídas padrão de build/package em
`.nsh/out/`. O Cargo mantém seu cache normal em `target/` e o comportamento existente de `CARGO_TARGET_DIR`; o NSH não
adiciona configuração do Cargo para realocá-lo. `--out` continua substituindo o local de saída.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Compila o app. Para um app Rust (`nsh.json` `"root"`), compila e descreve os crates do app e grava `app.json` e os arquivos que eles distribuem (`assets/`): seus runners montam a raiz. Para um app TSX, empacota o app em um bundle e o compila para bytecode do QuickJS, para apps que embutem o NSH e distribuem o bundle por conta própria.

| Flag | Padrão | Descrição |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Diretório de saída. |
| `--release` | | Minifica e remove informações de depuração. |
| `--split` | | Coloca o que `import()` carrega em arquivos de chunk próprios, baixados na primeira importação (apps web, veja [Bundles divididos](./web.md#split-bundles)). Sem essa flag, o bundle contém o app inteiro. |

Ele grava:

| Arquivo | Conteúdo |
|---|---|
| `bundle.js` | O bundle como JavaScript |
| `bundle.js.map` | Seu source map (os stack traces são mapeados de volta para seus fontes) |
| `bundle.nshc` | O bundle como bytecode compilado: o que os apps carregam |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | Com `--split`: cada chunk, seu source map e seu bytecode (`Screen.js` para `import("./Screen")`) |
| `capabilities.json` | O `capabilities` de `nsh.json`, se declarado (removido caso contrário) |
| `assets/` | Cada imagem e fonte importada, no caminho relativo à raiz do app |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Compila um app instalável em modo release. Um app Rust (`nsh.json` `"root"`) é empacotado com seu próprio runner, compilado com o Cargo a partir dos seus crates e dos do NSH, com a raiz montada e sem QuickJS ([Compilando com Rust](./rust.md)); um app TSX é empacotado com o runtime pré-compilado. Nenhum projeto Xcode nem build Gradle é envolvido: o NSH monta o bundle do app por conta própria e usa `actool` e `codesign` do Xcode (iOS) ou `aapt2`, `zipalign` e `apksigner` do SDK (Android); no macOS, monta um `.app` com assinatura ad hoc usando `codesign` (e `sips` para o ícone); no Linux, copia o runner e grava um `.tar.gz` com `tar`; no Windows, copia o runner, embute o ícone e grava um `.zip`, sem ferramentas; para a web, grava um site estático, sem ferramentas. Os metadados vêm de `nsh.json`, substituídos pelas flags.

| Flag | Descrição |
|---|---|
| `--target <TARGET>` | Obrigatória. `ios`: dispositivos iOS, um `.ipa` assinado (ou um `.app` não assinado sem `--sign`). `ios-simulator`: um `.app` com assinatura ad hoc. `android`: um `.apk` assinado. `macos`: um `.app` com assinatura ad hoc ([macOS](./macos.md#packaging)). `linux`: um diretório `<Name>/` (o executável, `nsh/`, um arquivo `.desktop`) e `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: um diretório `<Name>\` (`<Name>.exe`, `nsh\`) e `<Name>.zip` ([Windows](./windows.md#packaging)). `web`: um diretório `<Name>/`, um site estático (`index.html` e arquivos nomeados pelo seu conteúdo) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Diretório de saída (padrão `.nsh/out`). |
| `--name <NAME>` | Nome de exibição. |
| `--id <ID>` | Identificador do bundle, por exemplo `com.example.app`. |
| `--app-version <VERSION>` | Versão, por exemplo `1.2.0`. |
| `--build <BUILD>` | Número do build. |
| `--icon <ICON>` | Ícone do app: um PNG quadrado, idealmente 1024×1024. |
| `--sign <IDENTITY>` | Dispositivos iOS: identidade de assinatura de código, por exemplo `"Apple Development: …"`. |
| `--profile <FILE>` | Dispositivos iOS: perfil de provisionamento (`.mobileprovision`). Os entitlements vêm dele. |
| `--keystore <FILE>` | Android: keystore de release. Padrão: a chave de debug em `~/.android/debug.keystore` (criada se não existir). |
| `--key-alias <ALIAS>` | Android: alias da chave no keystore. |
| `--keystore-password <PASSWORD>` | Android: senha do keystore. Também lida de `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android: as ABIs do APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), repetidas ou separadas por vírgulas. Padrão: `arm64-v8a` e `armeabi-v7a`, mais a do dispositivo com `--run`. |
| `--run` | Instala e inicia o app em seguida: no simulador (`ios-simulator`) ou no dispositivo Android conectado; `macos`, `linux` e `windows` o iniciam; `web` serve o site nesta máquina no endereço que ele imprime. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Veja [Empacotamento](./packaging.md).

<a id="signing-commands"></a>

## Comandos de assinatura

Estes comandos criam e verificam pacotes assinados (`.nshpkg`): bundles de app que apps que embutem o NSH baixam e verificam antes de executá-los. [Pacotes assinados](./signed-packages.md) explica o modelo (uma chave raiz offline certifica chaves de release para alguns ids de app).

### nsh keygen

```sh
nsh keygen <NAME>
```

Cria um par de chaves Ed25519: `<NAME>.secret` e `<NAME>.pub` (por exemplo `nsh keygen keys/root`). Mantenha o `.secret` de uma raiz offline; os apps confiam em seu `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Certifica uma chave de release com uma chave raiz para alguns ids de app e uma janela de tempo; os pacotes carregam o certificado.

| Flag | Descrição |
|---|---|
| `--root <ROOT>` | A chave secreta da raiz. |
| `--key <KEY>` | A chave pública da chave de release. |
| `--apps <APPS>` | Ids de app para os quais ela pode assinar: `*`, `com.example.*` ou um id. Repetível. |
| `--days <DAYS>` | Por quanto tempo ela pode assinar, a partir de agora (padrão 365). |
| `-o, --out <OUT>` | O certificado a gravar. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Compila o app em modo release e o assina em um pacote. Os metadados vêm de `nsh.json`, substituídos pelas flags.

Dado um pacote (`ENTRY` é um arquivo `.nshpkg`), ele o assina novamente com esta chave, como faz uma plataforma que assina
os pacotes de seus apps com uma chave própria. Os arquivos e o cabeçalho do pacote permanecem como estão; seu certificado,
horário de assinatura e assinatura passam a ser os da nova chave ([Pacotes assinados](./signed-packages.md#sign-a-package-again)). `-o`
pode nomear o pacote lido, e só `--key`, `--cert` e `-o` se aplicam.

| Flag | Descrição |
|---|---|
| `--key <KEY>` | A chave secreta da chave de release. |
| `--cert <CERT>` | Seu certificado (`nsh certify`). |
| `-o, --out <OUT>` | O pacote a gravar. Padrão: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | Id do app. |
| `--app-version <VERSION>` | Versão. |
| `--build <BUILD>` | Número do build: deve crescer a cada release. |
| `--source-map <WHERE>` | Onde o source map fica: `package` (padrão), `file` (`<package>.map` ao lado do pacote) ou `none` ([Pacotes assinados](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Omite do bytecode as tabelas de linha e coluna: fica menor, mas as pilhas de erro não têm posições. |
| `--min-runtime <VERSION>` | O runtime mais antigo que executa o pacote, por exemplo `0.2.0`; runtimes mais antigos o recusam. Padrão: a versão desta CLI ([Pacotes assinados](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Verifica um pacote como faria um app que confia nas raízes informadas. Sem `--root`, só a assinatura do próprio pacote é verificada. Imprime o SHA-256 do pacote, que `nsh revoke --package` aceita.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Reescreve as posições do bundle (`bundle.js:LINE:COL`) de um erro reportado por um pacote para os seus fontes e imprime o
resultado. `MAP` é um source map (`<package>.map` de `nsh publish --source-map file`, `bundle.js.map`) ou um pacote que
contém um; `INPUT` é o texto do erro (padrão: entrada padrão).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Assina uma lista de revogação: chaves de release e pacotes que não devem mais ser carregados.

| Flag | Descrição |
|---|---|
| `--root <ROOT>` | A chave secreta da raiz. |
| `--extend <EXTEND>` | Mantém as entradas desta lista (a última publicada). |
| `--sequence <N>` | O número da lista, maior que qualquer um publicado antes. Padrão com `--extend`: o número daquela lista mais um. |
| `--key <ID>` | Um id de chave de release a revogar. Repetível. |
| `--package <SHA256>` | Um SHA-256 de pacote a revogar. Repetível. |
| `-o, --out <OUT>` | A lista a gravar. |

<a id="environment-variables"></a>

## Variáveis de ambiente

| Variável | Usada por | Descrição |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | alvos Android | O SDK do Android. Alternativa: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | apps com crates Rust | Onde os runners do app são compilados. Padrão: o `target/` do app. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | A senha do keystore. |
| `NSH_RUNTIME` | `run`, `package` | Um diretório de runtime a usar no lugar do que fica ao lado da CLI. |
| `NSH_VERBOSE` | todos os comandos | `1`: como `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | A CLI `wasm-bindgen` para um app cujos crates [chamam APIs do navegador](./web.md#browser-apis-from-rust). Padrão: a que está em `PATH`. |
| `NO_COLOR` | todos os comandos | Definida: sem cores nos terminais. |
