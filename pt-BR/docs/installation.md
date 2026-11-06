---
title: "Instalação"
description: "Obtenha o comando NSH, a partir de uma distribuição pré-compilada ou de um checkout do código-fonte, e as ferramentas de que cada plataforma precisa - iOS, Android, macOS, Windows e Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---


# Instalação

Tudo no NSH passa por um único comando, `nsh`. Ele compila apps escritos em Rust ou TSX, executa-os em todas as plataformas, serve TSX a hosts de desenvolvimento com atualizações a quente e empacota apps instaláveis. Você pode usá-lo a partir de uma distribuição pré-compilada ou compilá-lo a partir de um checkout do repositório.

Apps escritos em Rust também precisam de uma toolchain Rust ([abaixo](#for-apps-written-in-rust)); apps TSX precisam apenas de `nsh`. Além disso, cada plataforma exige suas próprias ferramentas:

| Plataforma | Desenvolver e empacotar em | Requer |
|---|---|---|
| iOS | macOS | Xcode e um runtime de simulador iOS |
| Android | macOS, Windows ou Linux | O Android SDK e um JDK; um emulador ou um dispositivo |
| macOS | macOS | As ferramentas de linha de comando do Xcode; os apps são executados no macOS 14+ |
| Windows | Windows | Windows 10 1809+; o WebView2 Runtime para web views |
| Linux | Linux | GTK 4.14+ (e seus pacotes de desenvolvimento para compilar o runtime) |
| [GPUI](./gpui.md) (incorporação em apps GPUI) | macOS, Windows ou Linux | Uma GPU (Metal, DirectX ou Vulkan); no Linux, Wayland ou X11 |

O host AppKit é o padrão no macOS. O Mac Catalyst (`--target catalyst`) precisa do Xcode, assim como o iOS. Os detalhes estão em [Ferramentas de plataforma](#platform-tools).

<a id="installing-a-release"></a>

## Instalando uma versão

Cada [release no GitHub](https://github.com/longbridge/nsh/releases) traz a distribuição pré-compilada (abaixo) para macOS (Apple silicon), Linux x86_64 e Windows x86_64. Todas as formas de instalação colocam o mesmo comando `nsh` no seu `PATH`.

**macOS e Linux**, com o script de instalação:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Ele instala a distribuição em `~/.nsh` e cria um link de `~/.local/bin/nsh` para ela; executá-lo novamente atualiza a instalação. `NSH_VERSION=v0.1.0` fixa uma versão, `NSH_INSTALL_DIR` escolhe outro diretório.

**Windows**, no PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Ele instala em `%LOCALAPPDATA%\nsh` e adiciona o `bin` ao `PATH` do usuário (abra um novo terminal depois). `$env:NSH_VERSION` e `$env:NSH_INSTALL_DIR` funcionam como acima.

**Homebrew** (macOS e Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (os três):

```sh
mise use -g github:longbridge/nsh
```

Os arquivos compactados (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, cada um com um `.sha256`) não trazem versão no nome, então `https://github.com/longbridge/nsh/releases/latest/download/<archive>` sempre baixa a mais recente. Os SDKs de incorporação também são lançados separadamente, para apps nativos que não precisam da CLI: `nsh-embed-ios.zip` e `nsh-embed-android.zip`.

> [!NOTE]
> Os binários ainda não são assinados. O macOS coloca em quarentena arquivos baixados por um navegador; o script de instalação, o Homebrew e o mise baixam com `curl` e não são afetados; caso contrário, execute `xattr -dr com.apple.quarantine <dir>`. O runtime do Linux precisa de glibc 2.39 e GTK 4.14 ou mais recente (Ubuntu 24.04 e posteriores). Não há build para Mac Intel nem para Linux / Windows arm64: compile-os a partir de um checkout.

<a id="for-apps-written-in-rust"></a>

## Para apps escritos em Rust

Instale o Rust pelo [rustup](https://rustup.rs). `nsh` compila o runner de um app Rust para cada alvo com o Cargo, a partir do seu crate e dos crates do NSH no crates.io na versão da CLI, então adicione os alvos Rust das plataformas em que você executa:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

Os desktops compilam para a máquina em que você está. `cargo run` no diretório de um app Rust o inicia diretamente no backend de desktop, o que compila com as bibliotecas de desenvolvimento do backend ([Ferramentas de plataforma](#platform-tools)). Os builds para Android também usam um **NDK** do SDK, como faz [a compilação do runtime do Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## A distribuição pré-compilada

A distribuição é um diretório, `dist/nsh`, com a CLI e os runtimes nativos pré-compilados com os quais ela empacota apps:

```sh
dist/nsh/bin/nsh                                             # the CLI
dist/nsh/runtime/ios/iphoneos/nsh-ios-app                    # runs packaged apps on iOS devices
dist/nsh/runtime/ios/iphonesimulator/{nsh-ios-app,nsh-ios-host}
dist/nsh/runtime/ios/maccatalyst/nsh-ios-host                # the Mac Catalyst development host
dist/nsh/runtime/android/{release,dev}/                      # classes.dex, lib/<abi>/libnsh.so, symbols/<abi>/libnsh.so
dist/nsh/runtime/macos/{nsh-macos-host,nsh-macos-app}        # the macOS (AppKit) development host and release runner
dist/nsh/runtime/linux/{nsh-linux-host,nsh-linux-app}        # the Linux development host and release runner
dist/nsh/runtime/windows/{nsh-windows-host,nsh-windows-app}.exe  # the Windows development host and release runner
dist/nsh/runtime/gpui/nsh-gpui-host[.exe]                    # the GPUI development host, for this OS
dist/nsh/runtime/web/{nsh.wasm,nsh-dev.wasm,nsh.js}          # the web runtimes (nsh package / run --target web)
dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework  # embedding in iOS apps
dist/nsh/embed/android/{nsh,nsh-dev}.aar                     # embedding in Android apps
```

Coloque `dist/nsh/bin` no seu `PATH` (ou chame `dist/nsh/bin/nsh` diretamente) e mantenha o diretório unido: `nsh` encontra os runtimes ao lado de si mesmo, em `bin/../runtime` (também por meio de um link simbólico para ele, como fazem os instaladores).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

A distribuição é criada com `cargo xtask dist` em um checkout (abaixo). O binário `nsh` que ela contém é compilado para aquela máquina. Em um Mac com Xcode, ela inclui os runtimes de iOS e macOS (Apple Silicon); no Linux, inclui o runtime do Linux, compilado para aquela máquina; no Windows, o runtime do Windows, com `bin\nsh.exe`. Cada uma também inclui o host de desenvolvimento do [GPUI](./gpui.md), compilado para aquela máquina. Todas incluem o runtime do Android (no Windows, somente quando o Android SDK é encontrado).

<a id="installing-the-latest-source"></a>

## Instalando o código-fonte mais recente

No macOS e no Linux, instale o `main` mais recente com Git, Rust e as dependências de build da plataforma listadas abaixo:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

O instalador mantém o checkout em `~/.nsh/source`, compila a CLI em modo release e cria um link para ela em `~/.local/bin`. Execute o comando novamente para atualizar; alterações locais no código-fonte precisam ser salvas antes. O checkout mantido permite que o NSH compile runtimes nativos sob demanda. O Cargo usa a configuração e o diretório de destino já existentes. `NSH_INSTALL_DIR` altera o prefixo de instalação; `NSH_VERSION` seleciona apenas releases pré-compiladas. Tanto `-V` quanto `--version` mostram a versão e a revisão do código-fonte com sete caracteres.

<a id="building-from-a-checkout"></a>

## Compilando a partir de um checkout

Você precisa do Rust pelo [rustup](https://rustup.rs). O `rust-toolchain.toml` do repositório seleciona a toolchain stable e instala os alvos iOS e Android no primeiro uso.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Em seguida, compile o host de desenvolvimento de cada alvo em que você quer executar, uma vez, e novamente após atualizar o checkout:

```sh
cargo build -p nsh-ios-host --target aarch64-apple-ios-macabi   # nsh run (Mac Catalyst window)
cargo build -p nsh-ios-host --target aarch64-apple-ios-sim      # nsh run --target ios
cargo xtask android --dev                                       # nsh run --target android
cargo build -p nsh-macos-host                                   # nsh run --target macos (built for you in a checkout)
cargo build -p nsh-linux-host                                   # nsh run on Linux (built for you in a checkout)
cargo build -p nsh-windows-host                                 # nsh run on Windows (built for you in a checkout)
cargo build --manifest-path crates/gpui/Cargo.toml --target-dir target -p nsh-gpui-host   # nsh run --target gpui (built for you in a checkout)
cargo build --profile web -p nsh-platform-web --target wasm32-unknown-unknown   # nsh run --target web (built for you in a checkout)
```

Para `nsh package`, compile também os runners de release:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

Uma CLI compilada a partir de um checkout procura os runtimes em `target/<triple>/<profile>` (os de macOS, Linux, Windows e GPUI, compilados para esta máquina, ficam em `target/<profile>`) e em `target/android/<profile>[-dev]`, usando o próprio perfil: `./target/debug/nsh` usa runtimes de debug, `./target/release/nsh` usa os de release. Compile ambos com o mesmo perfil (adicione `--release` a todos eles para apps mais rápidos).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` faz `nsh` usar um diretório de runtimes organizado como o `runtime/` da distribuição, onde quer que a própria CLI esteja.

<a id="platform-tools"></a>

## Ferramentas de plataforma

<a id="ios-and-mac-catalyst"></a>

### iOS e Mac Catalyst

- **Xcode** (com suas ferramentas de linha de comando). `nsh run` usa `xcrun simctl` para inicializar simuladores e instalar o host de desenvolvimento; `nsh package` usa `actool` para os ícones do app e `codesign` para a assinatura.
- Um runtime de simulador iOS. Se nenhum estiver instalado, instale um com `xcodebuild -downloadPlatform iOS`.
- Os apps têm como alvo o iOS 15.0 e posteriores.

### Android

- **O Android SDK**, encontrado por meio de `ANDROID_HOME`, `ANDROID_SDK_ROOT` ou do local padrão do Android Studio (`~/Library/Android/sdk`, `%LOCALAPPDATA%\Android\Sdk` no Windows), com:
  - `platforms;android-35` e um `build-tools` recente (o NSH usa `aapt2`, `zipalign` e `apksigner` dele, sem Gradle);
  - `platform-tools` (`adb`).
- **Um JDK** (`keytool` cria o keystore de debug em `~/.android/debug.keystore` na primeira vez que você empacota; `apksigner` precisa de Java).
- Um emulador em execução ou um dispositivo conectado por `adb`. Os apps precisam do Android 9 (API 28) ou posterior.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **As ferramentas de linha de comando do Xcode** (`xcode-select --install`): o SDK e o clang para compilar o runtime, `codesign` e `sips` para empacotar apps.
- Os apps precisam do macOS 14 ou posterior.

Veja [macOS](./macos.md).

### Linux

- **GTK 4.14** ou posterior, com seus pacotes de desenvolvimento e o clang para compilar o runtime: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 ou posterior), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 ou posterior) para web views: `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora) para compilar o runtime; os apps então precisam dele onde forem executados. Sem ele, `cargo xtask dist` compila o runtime com placeholders para web views.
- Plugins do **GStreamer** para os formatos de vídeo que os apps reproduzem.

Veja [Linux](./linux.md).

### Windows

- **Windows 10 1809** ou posterior, ou Windows 11. O WebView2 Runtime (parte do Windows 11, instalado com o Edge no Windows 10) para web views.
- Para compilar o runtime: **Visual Studio Build Tools** com a carga de trabalho "Desenvolvimento para desktop com C++" e o Windows SDK, e **LLVM** (libclang, para os bindings do QuickJS; encontrado em `C:\Program Files\LLVM`; caso contrário, defina `LIBCLANG_PATH`).

Veja [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Compilando o runtime do Android

Compilar o runtime do Android a partir de um checkout (`cargo xtask android`) exige, além disso, um **NDK** do SDK (`ndk;<version>`; defina `ANDROID_NDK_HOME` se o mais novo instalado estiver incompleto) e `javac`.

<a id="what-works-where"></a>

## O que funciona onde

| Comando | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Sim | Sim | Sim |
| `nsh run --target catalyst` (Mac Catalyst) | Sim | Não | Não |
| `nsh run --target macos`, `nsh package --target macos` | Sim | Não | Não |
| `nsh run --target linux` (o padrão no Linux), `nsh package --target linux` | Não | Sim | Não |
| `nsh run --target windows` (o padrão no Windows), `nsh package --target windows` | Não | Não | Sim |
| `nsh run --target gpui` (o backend que os apps GPUI incorporam) | Sim | Sim | Sim |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Sim, com Xcode | Não | Não |
| `nsh run --target android`, `nsh package --target android` | Sim | Sim, a partir de um checkout | Sim, com o runtime do Android |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Sim | Sim | Sim |

No Linux, compile a CLI e o runtime do Android a partir de um checkout (`cargo build -p nsh-cli` e `cargo xtask android --dev`); a toolchain Linux do NDK é usada automaticamente. No Windows, a toolchain Windows do NDK é usada da mesma forma, e `cargo xtask dist` inclui o runtime do Android quando encontra o Android SDK.

<a id="editor-setup"></a>

## Configuração do editor

Um app Rust é um projeto Cargo: o rust-analyzer (VS Code, Zed, Neovim, RustRover) o verifica e completa a API do NSH, com seus comentários de documentação, como em qualquer crate.

Para TSX, o NSH não precisa de NPM. `nsh init` grava um `tsconfig.json` e as declarações de tipos de tudo o que o NSH fornece em `.nsh/types`, e todo comando que compila o app as mantém atualizadas. Qualquer editor que use o servidor de linguagem do TypeScript (VS Code, Zed, Neovim, WebStorm) faz a verificação de tipos do app com elas. Veja [Estrutura do projeto](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Próximos passos

Continue com [Primeiros passos](./getting-started.md) para criar um app e executá-lo.
