---
title: "Установка"
description: "Как получить команду NSH из готового дистрибутива или из исходного кода, а также какие инструменты нужны для каждой платформы: iOS, Android, macOS, Windows и Linux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# Установка

Всё, что делает NSH, выполняется одной командой — `nsh`. Она собирает приложения, написанные на Rust или TSX, запускает их на всех платформах, отдаёт TSX хостам разработки с горячими обновлениями и упаковывает устанавливаемые приложения. Её можно использовать из готового дистрибутива или собрать из локальной копии репозитория.

Приложениям на Rust дополнительно нужен инструментарий Rust ([ниже](#for-apps-written-in-rust)); приложениям на TSX достаточно одного `nsh`. Кроме того, каждой платформе требуются свои инструменты:

| Платформа | Разработка и упаковка на | Требуется |
|---|---|---|
| iOS | macOS | Xcode и среда выполнения симулятора iOS |
| Android | macOS, Windows или Linux | Android SDK и JDK; эмулятор или устройство |
| macOS | macOS | Инструменты командной строки Xcode; приложения работают на macOS 14+ |
| Windows | Windows | Windows 10 1809+; WebView2 Runtime для веб-представлений |
| Linux | Linux | GTK 4.14+ (и его пакеты для разработки, чтобы собрать рантайм) |
| [GPUI](./gpui.md) (встраивание в приложения GPUI) | macOS, Windows или Linux | GPU (Metal, DirectX или Vulkan); в Linux — Wayland или X11 |

На macOS по умолчанию используется хост AppKit. Mac Catalyst (`--target catalyst`) требует Xcode, как и iOS. Подробности — в разделе [Инструменты платформ](#platform-tools).

<a id="installing-a-release"></a>

## Установка релиза

Каждый [релиз на GitHub](https://github.com/longbridge/nsh/releases) содержит готовый дистрибутив (см. ниже) для macOS (Apple silicon), Linux x86_64 и Windows x86_64. Любой способ установки добавляет одну и ту же команду `nsh` в ваш `PATH`.

**macOS и Linux** — с помощью установочного скрипта:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

Он устанавливает дистрибутив в `~/.nsh` и создаёт ссылку `~/.local/bin/nsh` на него; повторный запуск обновляет установку. `NSH_VERSION=v0.1.0` закрепляет конкретный релиз, `NSH_INSTALL_DIR` выбирает другой каталог.

**Windows** — в PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

Он устанавливает дистрибутив в `%LOCALAPPDATA%\nsh` и добавляет его `bin` в пользовательский `PATH` (после этого откройте новый терминал). `$env:NSH_VERSION` и `$env:NSH_INSTALL_DIR` работают так же, как описано выше.

**Homebrew** (macOS и Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (все три платформы):

```sh
mise use -g github:longbridge/nsh
```

В именах архивов (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, у каждого есть `.sha256`) нет версии, поэтому `https://github.com/longbridge/nsh/releases/latest/download/<archive>` всегда загружает последнюю. SDK для встраивания также выпускаются отдельно — для нативных приложений, которым CLI не нужен: `nsh-embed-ios.zip` и `nsh-embed-android.zip`.

> [!NOTE]
> Бинарные файлы пока не подписаны. macOS помещает в карантин файлы, загруженные браузером; установочный скрипт, Homebrew и mise загружают через `curl`, и карантин на них не распространяется, в остальных случаях выполните `xattr -dr com.apple.quarantine <dir>`. Для рантайма Linux нужны glibc 2.39 и GTK 4.14 или новее (Ubuntu 24.04 и новее). Сборок для Mac на Intel, а также для Linux и Windows на arm64 нет: соберите их из локальной копии репозитория.

<a id="for-apps-written-in-rust"></a>

## Для приложений на Rust

Установите Rust через [rustup](https://rustup.rs). `nsh` собирает раннер Rust-приложения для каждой целевой платформы с помощью Cargo — из вашего крейта и крейтов NSH с crates.io той же версии, что и CLI, поэтому добавьте Rust-таргеты платформ, на которых вы запускаете приложения:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

Десктопные платформы собираются для машины, на которой вы работаете. `cargo run` в каталоге Rust-приложения запускает его сразу на десктопном бэкенде, который собирается с библиотеками разработки этого бэкенда ([Инструменты платформ](#platform-tools)). Для сборок под Android также нужен **NDK** из состава SDK, как и при [сборке рантайма Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## Готовый дистрибутив

Дистрибутив — это каталог `dist/nsh` с CLI и готовыми нативными рантаймами, с которыми он упаковывает приложения:

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

Добавьте `dist/nsh/bin` в `PATH` (или вызывайте `dist/nsh/bin/nsh` напрямую) и храните каталог целиком: `nsh` находит рантаймы рядом с собой, в `bin/../runtime` (в том числе через символическую ссылку на него, как её создают установщики).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

Дистрибутив создаётся командой `cargo xtask dist` в локальной копии репозитория (см. ниже). Входящий в него бинарный файл `nsh` собран для этой машины. На Mac с Xcode он включает рантаймы iOS и macOS (Apple Silicon); на Linux вместо них включается рантайм Linux, собранный для этой машины; на Windows — рантайм Windows, с `bin\nsh.exe`. Каждый вариант также включает хост разработки [GPUI](./gpui.md), собранный для этой машины. Во все варианты входит рантайм Android (на Windows — только если найден Android SDK).

<a id="installing-the-latest-source"></a>

## Установка из последних исходников

На macOS и Linux установите последнюю версию `main` с помощью Git, Rust и перечисленных ниже зависимостей для сборки на платформе:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

Установщик хранит копию репозитория в `~/.nsh/source`, собирает релизную версию CLI и создаёт ссылку на неё в `~/.local/bin`. Чтобы обновить, запустите команду снова; локальные изменения в исходниках нужно предварительно сохранить. Сохранённая копия позволяет NSH собирать нативные рантаймы по требованию. Cargo использует имеющуюся конфигурацию и целевой каталог. `NSH_INSTALL_DIR` меняет префикс установки; `NSH_VERSION` выбирает только готовые релизы. Команды `-V` и `--version` показывают версию и семисимвольную ревизию исходников.

<a id="building-from-a-checkout"></a>

## Сборка из локальной копии репозитория

Вам нужен Rust, установленный через [rustup](https://rustup.rs). Файл `rust-toolchain.toml` в репозитории выбирает стабильный инструментарий и при первом использовании устанавливает таргеты iOS и Android.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

Затем один раз соберите хост разработки для каждой платформы, на которой вы хотите запускать приложения, и повторяйте это после обновления копии репозитория:

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

Для `nsh package` соберите также релизные раннеры:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

CLI, собранный из локальной копии репозитория, ищет рантаймы в `target/<triple>/<profile>` (рантаймы macOS, Linux, Windows и GPUI, собранные для этой машины, — в `target/<profile>`) и `target/android/<profile>[-dev]`, используя собственный профиль: `./target/debug/nsh` использует отладочные рантаймы, `./target/release/nsh` — релизные. Собирайте оба с одним и тем же профилем (добавьте `--release` ко всем, чтобы приложения работали быстрее).

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` заставляет `nsh` использовать каталог рантаймов с той же структурой, что и `runtime/` в дистрибутиве, где бы ни находился сам CLI.

<a id="platform-tools"></a>

## Инструменты платформ

<a id="ios-and-mac-catalyst"></a>

### iOS и Mac Catalyst

- **Xcode** (с инструментами командной строки). `nsh run` использует `xcrun simctl`, чтобы запускать симуляторы и устанавливать хост разработки; `nsh package` использует `actool` для значков приложений и `codesign` для подписи.
- Среда выполнения симулятора iOS. Если ни одна не установлена, установите её командой `xcodebuild -downloadPlatform iOS`.
- Приложения рассчитаны на iOS 15.0 и новее.

### Android

- **Android SDK**, который находится через `ANDROID_HOME`, `ANDROID_SDK_ROOT` или стандартное расположение Android Studio (`~/Library/Android/sdk`, `%LOCALAPPDATA%\Android\Sdk` в Windows), со следующими компонентами:
  - `platforms;android-35` и свежая версия `build-tools` (NSH использует из неё `aapt2`, `zipalign` и `apksigner`, без Gradle);
  - `platform-tools` (`adb`).
- **JDK** (`keytool` создаёт отладочное хранилище ключей в `~/.android/debug.keystore` при первой упаковке, `apksigner` требует Java).
- Запущенный эмулятор или устройство, подключённое через `adb`. Приложениям нужен Android 9 (API 28) или новее.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Инструменты командной строки Xcode** (`xcode-select --install`): SDK и clang для сборки рантайма, `codesign` и `sips` для упаковки приложений.
- Приложениям нужна macOS 14 или новее.

См. [macOS](./macos.md).

### Linux

- **GTK 4.14** или новее, с пакетами для разработки и clang для сборки рантайма: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 или новее), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (2.40 или новее) для веб-представлений: `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora) для сборки рантайма; затем он нужен приложениям там, где они запускаются. Без него `cargo xtask dist` собирает рантайм с заглушками вместо веб-представлений.
- Плагины **GStreamer** для видеоформатов, которые воспроизводят приложения.

См. [Linux](./linux.md).

### Windows

- **Windows 10 1809** или новее, либо Windows 11. WebView2 Runtime (входит в Windows 11, устанавливается вместе с Edge в Windows 10) для веб-представлений.
- Для сборки рантайма: **Visual Studio Build Tools** с рабочей нагрузкой «Разработка классических приложений на C++» и Windows SDK, а также **LLVM** (libclang, для привязок QuickJS; ищется в `C:\Program Files\LLVM`, иначе задайте `LIBCLANG_PATH`).

См. [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### Сборка рантайма Android

Для сборки рантайма Android из локальной копии репозитория (`cargo xtask android`) дополнительно нужен **NDK** из состава SDK (`ndk;<version>`; задайте `ANDROID_NDK_HOME`, если самая новая установленная версия неполная) и `javac`.

<a id="what-works-where"></a>

## Что где работает

| Команда | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | Да | Да | Да |
| `nsh run --target catalyst` (Mac Catalyst) | Да | Нет | Нет |
| `nsh run --target macos`, `nsh package --target macos` | Да | Нет | Нет |
| `nsh run --target linux` (по умолчанию в Linux), `nsh package --target linux` | Нет | Да | Нет |
| `nsh run --target windows` (по умолчанию в Windows), `nsh package --target windows` | Нет | Нет | Да |
| `nsh run --target gpui` (бэкенд, который встраивают приложения GPUI) | Да | Да | Да |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | Да, с Xcode | Нет | Нет |
| `nsh run --target android`, `nsh package --target android` | Да | Да, из локальной копии репозитория | Да, с рантаймом Android |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | Да | Да | Да |

В Linux соберите CLI и рантайм Android из локальной копии репозитория (`cargo build -p nsh-cli` и `cargo xtask android --dev`); тулчейн NDK для Linux используется автоматически. В Windows тулчейн NDK для Windows используется так же, а `cargo xtask dist` включает рантайм Android, если находит Android SDK.

<a id="editor-setup"></a>

## Настройка редактора

Приложение на Rust — это проект Cargo: rust-analyzer (VS Code, Zed, Neovim, RustRover) проверяет его и дополняет API NSH вместе с doc-комментариями, как и для любого крейта.

Для TSX NSH не требует NPM. `nsh init` создаёт `tsconfig.json` и объявления типов всего, что предоставляет NSH, в `.nsh/types`, а каждая команда, собирающая приложение, поддерживает их актуальными. Любой редактор, использующий языковой сервер TypeScript (VS Code, Zed, Neovim, WebStorm), проверяет типы приложения с их помощью. См. [Структура проекта](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## Дальнейшие шаги

Перейдите к разделу [Начало работы](./getting-started.md), чтобы создать приложение и запустить его.
