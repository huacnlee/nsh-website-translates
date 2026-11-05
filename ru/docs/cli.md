---
title: "CLI"
description: "Все подкоманды и флаги NSH: init, build, test, check, dev, run, package, а также команды подписи keygen, certify, publish, verify, symbolicate и revoke."
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh` — инструмент, с помощью которого собирается приложение NSH на Rust или TSX. Каждая подкоманда, собирающая приложение, принимает `[ENTRY]`: каталог приложения (по умолчанию текущий, поэтому работает `cd my-app && nsh run`), который запускает корневой компонент приложения на Rust (`nsh.json` `"root"`) или `App.tsx` приложения на TSX, либо модуль входа TSX. Она читает `nsh.json` в корне приложения и обновляет объявления типов в `.nsh/types`.

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

`nsh <command> --help` выводит флаги команды; `nsh -V` (`--version`) выводит версию и Git-ревизию, из которой собран инструмент.

<a id="output"></a>

## Вывод

Каждая команда выводит по одной строке на шаг, а подробности — только при сбое:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` — завершённый шаг, `→` — куда подключаться, `•` — что сделало устройство; строки `warn` и `error` — это проблемы, а
обычные строки — собственный вывод вашего приложения (`console.log`). В терминале спиннер показывает выполняющийся шаг, а
строки раскрашиваются (если не задано `NO_COLOR`); при перенаправлении в файл записываются только строки с результатом, без цветов.
Вывод инструментов, которые запускает NSH (cargo для Rust-крейта приложения, хосты разработки), печатается под строкой `error`,
когда один из них завершается сбоем.

`-v, --verbose` (любая команда; также `NSH_VERBOSE=1`) выводит всё по мере поступления: каждую строку лога с её уровнем и
источником, вывод cargo и собственный вывод хостов.

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

Создаёт из шаблона приложение в `DIR` (по умолчанию текущий каталог, создаётся, если его нет). Без `--template` команда `nsh init` в терминале спрашивает, какой шаблон выбрать (Enter выбирает `ts`), а в других случаях (скрипт, CI) берёт `ts`.

| Шаблон | Что создаёт |
|---|---|
| `rust` | Приложение на Rust: проект Cargo (`Cargo.toml`, `src/lib.rs` с корневым компонентом, `src/main.rs` для `cargo run`), `nsh.json` с `"rust": "."` и `"root": "App"`, тест корня `App.test.tsx` с `tsconfig.json` и `.nsh/types`, `.gitignore` и README, в котором также сказано, как позже добавить точку входа TSX. `nsh run` и `nsh package` монтируют корень без QuickJS на каждой целевой платформе (`nsh test` открывает его для тестов на TypeScript), включая браузер ([Сборка на Rust](./rust.md)); `cargo run` запускает его напрямую на macOS, Windows или Linux. |
| `ts` | Приложение на TSX: `App.tsx`, его тест `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` и `.nsh/types`. Существующие файлы сохраняются; команда завершается ошибкой, только если уже существуют все они. |
| `mixed` | Приложение на TSX с собственным Rust-крейтом в корне: `App.tsx`, его тест `App.test.tsx`, `tsconfig.json`, `nsh.json` с `"rust": "."`, `.gitignore`, `.nsh/types`, README и крейт рядом с `App.tsx` (`Cargo.toml`, `src/lib.rs`), чей `#[native_module("<name>/native")]` экспортирует компонент, модуль и класс, которые использует `App.tsx`. Без `"root"` точкой входа служит `App.tsx`. |

| Флаг | Описание |
|---|---|
| `--name <NAME>` | Отображаемое имя, записываемое в `nsh.json`. По умолчанию — имя каталога. Идентификатор становится `com.example.<name>` (только буквы и цифры, нижний регистр), а спецификатор импорта крейтов — `<name>/native` (нижний регистр, слова соединены через `-`). |
| `--template <TEMPLATE>` | `rust`, `ts` или `mixed` (см. выше). `rust` и `mixed` требуют Rust; `cargo run` также требует библиотек разработки нативного настольного бэкенда. |
| `--nsh-source <DIR>` | С `rust` или `mixed`: крейты зависят по пути от крейтов NSH из checkout в `DIR`, чтобы собирать приложение из исходников NSH. |

Крейты `rust` и `mixed` зависят от крейтов NSH на crates.io версии CLI (с `--nsh-source` — от крейтов checkout), а команды `nsh` собирают раннеры и хосты приложения из тех же крейтов. Перед каждой командой для такого приложения `nsh` собирает небольшую программу из крейтов приложения и ядра NSH, которая описывает их компоненты, модули и классы, и запускает её, когда крейты изменились; по этому описанию сам CLI собирает в бандл, компилирует, проверяет типы, раздаёт и упаковывает приложение. Сборки приложения на Rust компилируют только его крейты и ядро NSH. Создавайте их в новом каталоге приложения: наличие любого из их файлов сообщается как конфликт до того, как что-либо будет записано.

Приложения, чьи Rust-крейты зависят от NSH через Git, используют checkout, который Cargo разрешает в lock-файле приложения. Сгенерированные хосты используют тот же checkout, включая зависимости NSH, перенаправленные через Cargo patches приложения.

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

Для точки входа TSX `nsh run` запускает dev-сервер (как `nsh dev`), стартует хост разработки, который загружает приложение с него, и пересобирает при каждом сохранении. Hot module replacement обновляет работающее приложение на месте; логи и ошибки приложения выводятся в терминал. Остановить можно через Ctrl-C (или закрыв окно Catalyst, macOS, Linux, Windows или GPUI). Как бы ни завершилась работа (Ctrl-C, `kill` / `pkill`, ошибка), команда останавливает запущенный ею хост: приложение Catalyst, хост macOS, Linux, Windows или GPUI, хост разработки в симуляторе или на устройстве Android.

Приложение на Rust (`nsh.json` `"root"`, [Сборка на Rust](./rust.md)) запускается без dev-сервера и без QuickJS: `nsh run` собирает раннер приложения для целевой платформы с примонтированным корнем, запускает его (на десктопах — отладочная сборка, её логи в терминале; в симуляторе и на Android — установленное приложение), а при изменении Rust-кода крейта собирает заново и перезапускает. С `--target web` команда выводит адрес страницы, и открытая страница сама загружает новый runtime. Чтобы запустить вместо этого точку входа TSX, укажите её (`nsh run App.tsx`).

| Флаг | По умолчанию | Описание |
|---|---|---|
| `--target <TARGET>` | `macos` на macOS, `linux` на Linux, `windows` на Windows | `catalyst`: хост Mac Catalyst, окно размером с iPhone (390×844). `ios`: хост в симуляторе iOS. `android`: хост на устройстве или эмуляторе Android. `macos`: хост AppKit, окно 1200×800 ([macOS](./macos.md)). `linux`: хост GTK, окно 390×844 ([Linux](./linux.md)). `windows`: хост Win32, окно 1200×800 ([Windows](./windows.md)). `gpui`: хост GPUI, окно 1200×800, на macOS, Windows или Linux, показывающий приложение TSX так, как его показывают приложения GPUI, которые его встраивают ([GPUI](./gpui.md)). `web`: страница dev-сервера по выводимому им адресу ([Web](./web.md#develop-in-the-browser)). |
| `--device <DEVICE>` | | Используемый симулятор iOS — по имени (`"iPhone 16 Pro"`) или UDID. По умолчанию: уже запущенный, иначе новейший iPhone, который запускается. |
| `--port <PORT>` | `8790` | Порт dev-сервера. Заменяет предыдущую сессию разработки NSH на этом порту после завершения её очистки. |
| `--release` | | Минификация и удаление отладочной информации. В релизных бандлах нет hot module replacement: каждое сохранение перезагружает приложение. |
| `--limits [<LIMITS>]` | | Запускает приложение как встроенное в другое, в пределах ограничений, которые задаёт приложение-хозяин: `memory` и `stack` (в `KB`, `MB` или `GB`), `load` и `call` (в `ms` или `s`) и `nodes`, например `--limits memory=128MB,call=500ms`. Пропущенные параметры сохраняют значения встраивания по умолчанию, с которыми работает один только `--limits` ([Sandbox и capabilities](./sandbox-and-capabilities.md#limits)). Без него приложение работает само по себе, как упакованное. Точки входа TSX. |
| `--trace` | | Хост выводит в терминал время каждого коммита (JS, layout, mount items). |
| `--fps` | | Монитор производительности: частота кадров, стоимость кадров и коммитов, CPU, GPU и память; отображается поверх приложения на macOS ([macOS](./macos.md#performance-monitor)) и раз в секунду выводится в лог на macOS, Linux, Windows и iOS. |
| `--name <NAME>` | имя `nsh.json` | Отображаемое имя приложения в строке меню и начальный заголовок окна (`--target macos`, точки входа TSX). |
| `--window-size <WIDTHxHEIGHT>` | По умолчанию хоста | Начальный размер окна в пунктах, например `800x600` (`--target macos`, `linux`, `windows` и `gpui`, точки входа TSX). |
| `--display <N>` | Основной дисплей | Дисплей, на котором окно открывается по центру: `1` — основной дисплей (с строкой меню), `2` — следующий и так далее; номер несуществующего дисплея открывает окно на основном (`--target macos`, точки входа TSX). |

С `--target android` используется первое устройство из списка `adb devices`; порт dev-сервера пробрасывается на него с помощью `adb reverse`. См. [Начало работы](./getting-started.md#run-it) и [Dev-сервер и отладка](./dev-server-and-debugging.md).

Замена ждёт до десяти секунд, пока предыдущая сессия завершит очистку. Порт, занятый другой программой или более старым CLI NSH, приводит к ошибке с указанием порта. Чтобы запускать несколько приложений вместе, используйте разные значения `--port`; `--port 0` просит у ОС свободный порт.

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Запускает dev-сервер и открывает нативный хост этой системы: AppKit на macOS, GTK на Linux, Win32 на Windows. Для мобильной разработки явно выберите `--target ios` или `--target android`. `--server-only` обслуживает хосты, которые вы запускаете сами. Сервер собирает приложение, следит за каталогом точки входа и отправляет каждую пересборку подключённым хостам. С `--server-only` он выводит URL для хостов на этой машине и по одному на каждый LAN-адрес для устройств, а при наличии web-runtime — и страницу, которую браузеры открывают для запуска приложения ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

Используйте `nsh dev --server-only` с приложением, встраивающим SDK разработки (`NativeShellDev.xcframework`, `nsh-dev.aar`). `--target`, `--device`, `--port`, `--release` и `--limits` работают так же, как для `nsh run`; `--server-only` выбирает сервер без запуска хоста.

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

Запускает тесты приложения без интерфейса ([Тестирование](./testing-and-trace.md)): тестовые файлы (`*.test.tsx`, `*.test.ts`, импортирующие `nsh/test`) в `PATH`, каталоге (по умолчанию текущем; скрытые каталоги, `node_modules` и `target` пропускаются) или тестовый файл `PATH`. Если указан каталог приложения с собственными Rust-крейтами (`nsh.json` `"rust"`: приложение на Rust или приложение на TSX с крейтом), сначала для каждого крейта в каталоге запускается `cargo test` в каталоге самого крейта, и каждый Rust-тест показывается и учитывается вместе с тестами на TypeScript — под файлом своей тестовой цели (`src/lib.rs › tests::adds`); приложение на Rust только с Rust-тестами тоже тестируется так. Каждый тестовый файл выполняется на собственном движке, а каждое приложение, которое открывают его тесты, — на другом, свежем. Команда выводит строку на каждый тест, а при сбое — что было выброшено, где в тестовом файле и какие тексты были на экране; любой сбой приводит к ненулевому коду выхода. Если указана точка входа приложения (`nsh test App.tsx`; для приложения на Rust: `nsh test nsh.json`), команда открывает приложение в сети, даёт ему поработать 1,2 с и выполняет шаги, поступающие со стандартного ввода (`await app.press("Add")`, где `app` — приложение). Приложение на TSX выполняется в собственном процессе CLI; приложение с собственными Rust-крейтами выполняется в headless-раннере, собранном вместе с ними, для которого CLI собирает точки входа. Запуски без интерфейса ведут себя как на iOS, если только тест не открывает приложение как Android (`open`, `platform`): `platform.os` равно `"ios"`, и применяются классы `ios:` и свойства `ios={{…}}`.

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Флаг | Описание |
|---|---|
| `--filter <NAME>` | Запускает только тесты, имя которых (после имён блоков `describe`, в которых он находится) содержит `NAME`; для крейтов — `cargo test <NAME>`. |
| `--trace` | Выводит каждый пакет монтирования приложений, которые открывают тесты, под шагом, в котором он пришёл (`── press(Add): 7 items`), и время каждого коммита: сколько стоят первый кадр, шаг или кадр прокрутки. С `--target` — пакеты и тайминги хоста. |
| `--fps` | С `--target linux`, `macos`, `windows` или `ios`: хост раз в секунду логирует показания своего монитора производительности (частота кадров, фазы кадров, коммиты, CPU, память), отображаемые с `-v`. |
| `--junit <FILE>` | Дополнительно записывает результаты в `FILE` в виде отчёта JUnit XML — формата, из которого CI-сервисы показывают результаты тестов: `testsuite` на каждый тестовый файл, `testcase` на каждый тест. |
| `--target <TARGET>` | Запускает приложения, которые открывают тесты, на хосте разработки этой платформы вместо запуска без интерфейса (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` и `android`; `web` запускает их в headless Chrome, Edge или Chromium): шаги действуют через собственный ввод платформы ([Тестирование](./testing-and-trace.md#on-a-real-platform)), а `open` сверяет свои параметры с платформой и отклоняет те, которые она не может выполнить (`ERR_NSH_TEST_UNSUPPORTED`: `width` и `height` на iOS и Android, `platform` устройства другого типа). Rust-тесты крейтов выполняются на этой машине, в запусках без `--target`. |
| `--browser <PATH>` | Исполняемый файл Chrome, Edge или Chromium, в котором `--target web` запускает приложения (по умолчанию — установленный на этой машине). |
| `--display <N>` | С `--target macos`: дисплей, на котором окна приложений открываются по центру: `1` — основной дисплей (с строкой меню), `2` — следующий и так далее; номер несуществующего дисплея открывает их на основном. По умолчанию они открываются на дополнительном дисплее (первом, кроме основного, не являющемся его зеркалом), так что тестовый запуск остаётся на собственном экране, а на основном — если он единственный. Тесты выполняются одинаково на любом дисплее. |
| `--web-host <JS>` | Модуль хоста веб-страницы, который получают приложения, открытые без интерфейса (по умолчанию: `nsh.json` `web.host`; он экспортирует `createHost(player)`): он отвечает на их вызовы [`host`](../modules/nsh.md#host), а его `player.hostEvent` доходит до `host.on` ([Тестирование](./testing-and-trace.md#the-pages-host)). Только для запусков без интерфейса; `--target web` запускает `nsh.json` из `web.host`. |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

Проверяет типы в приложении. Если у приложения есть собственные Rust-крейты (`nsh.json` `"rust"`), сначала каждый крейт проверяется с помощью `cargo check --all-targets` в каталоге крейта, включая его тесты; ошибки Cargo приводят к завершению с ненулевым кодом. Затем Rust-приложение (`"root"`) проверяется в той мере, в какой в нём есть TypeScript: если есть `tsconfig.json` (тот, который `nsh init --template rust` создаёт для `App.test.tsx`), типы проверяются и в его тестовых файлах. Проверка TypeScript обновляет `.nsh/types` и `.nsh/tsconfig.json`, а затем запускает `tsc -p <app directory> --noEmit` с `tsconfig.json` приложения. Используется TypeScript 7, нативный компилятор, которому Node не нужен: при первом запуске он скачивается из реестра npm (около 9 МБ), сверяется с контрольной суммой, которую записывает NSH, и сохраняется в кэше NSH (`~/Library/Caches/nsh` в macOS, `~/.cache/nsh` в Linux, `%LOCALAPPDATA%\nsh` в Windows или `NSH_CACHE`). Ошибки типов приводят к завершению с ненулевым кодом. Если `tsconfig.json` не расширяет `./.nsh/tsconfig.json`, в котором NSH хранит свои настройки TypeScript, выводится предупреждение ([Структура проекта](./project-structure.md#tsconfigjson-and-nshtypes)).

| Флаг | Описание |
|---|---|
| `--tsc <TSC>` | Запустить вместо него этот `tsc` (также `NSH_TSC`), например из `node_modules` или копию для машин без сети. |
| `-- <TSC ARGS>` | Передаётся в `tsc`, например `nsh check -- --pretty false`. |

Файлы, сгенерированные NSH, остаются в `.nsh/`: объявления, исходники раннеров и выходные файлы сборки и упаковки по умолчанию в
`.nsh/out/`. Cargo сохраняет свой обычный кэш `target/` и прежнее поведение `CARGO_TARGET_DIR`; NSH не
добавляет конфигурацию Cargo для его переноса. `--out` по-прежнему переопределяет место вывода.

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

Собирает приложение. Для Rust-приложения (`nsh.json` `"root"`) собирает и описывает крейты приложения и записывает `app.json` и файлы, которые поставляются вместе с ним (`assets/`): его раннеры монтируют корень. Для TSX-приложения собирает бандл приложения и компилирует его в байткод QuickJS, для приложений, которые встраивают NSH и сами поставляют бандл.

| Флаг | По умолчанию | Описание |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | Выходной каталог. |
| `--release` | | Минифицировать и удалить отладочную информацию. |
| `--split` | | Поместить то, что загружает `import()`, в отдельные файлы-чанки, которые скачиваются при первом импорте (веб-приложения, см. [Split bundles](./web.md#split-bundles)). Без него бандл содержит всё приложение. |

Записываются следующие файлы:

| Файл | Содержимое |
|---|---|
| `bundle.js` | Бандл в виде JavaScript |
| `bundle.js.map` | Его карта исходников (стек вызовов сопоставляется с вашими исходниками) |
| `bundle.nshc` | Бандл в виде скомпилированного байткода: именно его загружают приложения |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | С `--split`: каждый чанк, его карта исходников и его байткод (`Screen.js` для `import("./Screen")`) |
| `capabilities.json` | `capabilities` из `nsh.json`, если он объявлен (иначе удаляется) |
| `assets/` | Каждое импортированное изображение и шрифт по пути относительно корня приложения |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

Собирает устанавливаемое приложение в режиме release. Rust-приложение (`nsh.json` `"root"`) упаковывается с собственным раннером, который собирается Cargo из ваших крейтов и крейтов NSH, а его корень монтируется без QuickJS ([Building with Rust](./rust.md)); TSX-приложение упаковывается с предсобранным рантаймом. Проект Xcode и сборка Gradle не нужны: NSH сам собирает бандл приложения и использует `actool` и `codesign` из Xcode (iOS) или `aapt2`, `zipalign` и `apksigner` из SDK (Android); для macOS он собирает `.app` с ad hoc подписью с помощью `codesign` (и `sips` для значка); для Linux копирует раннер и записывает `.tar.gz` с помощью `tar`; для Windows копирует раннер, встраивает значок и записывает `.zip`, без дополнительных инструментов; для web записывает статический сайт, также без инструментов. Метаданные берутся из `nsh.json` и переопределяются флагами.

| Флаг | Описание |
|---|---|
| `--target <TARGET>` | Обязательный. `ios`: устройства iOS, подписанный `.ipa` (или неподписанный `.app` без `--sign`). `ios-simulator`: `.app` с ad hoc подписью. `android`: подписанный `.apk`. `macos`: `.app` с ad hoc подписью ([macOS](./macos.md#packaging)). `linux`: каталог `<Name>/` (исполняемый файл, `nsh/`, файл `.desktop`) и `<Name>.tar.gz` ([Linux](./linux.md#packaging)). `windows`: каталог `<Name>\` (`<Name>.exe`, `nsh\`) и `<Name>.zip` ([Windows](./windows.md#packaging)). `web`: каталог `<Name>/`, статический сайт (`index.html` и файлы, названные по их содержимому) ([Web](./web.md#publish-an-app)). |
| `-o, --out <OUT>` | Выходной каталог (по умолчанию `.nsh/out`). |
| `--name <NAME>` | Отображаемое имя. |
| `--id <ID>` | Идентификатор бандла, например `com.example.app`. |
| `--app-version <VERSION>` | Версия, например `1.2.0`. |
| `--build <BUILD>` | Номер сборки. |
| `--icon <ICON>` | Значок приложения: квадратный PNG, лучше всего 1024×1024. |
| `--sign <IDENTITY>` | Устройства iOS: идентификатор подписи кода, например `"Apple Development: …"`. |
| `--profile <FILE>` | Устройства iOS: профиль provisioning (`.mobileprovision`). Entitlements берутся из него. |
| `--keystore <FILE>` | Android: release-хранилище ключей. По умолчанию: отладочный ключ в `~/.android/debug.keystore` (создаётся, если отсутствует). |
| `--key-alias <ALIAS>` | Android: псевдоним ключа в хранилище. |
| `--keystore-password <PASSWORD>` | Android: пароль хранилища ключей. Также читается из `NSH_KEYSTORE_PASSWORD`. |
| `--abi <ABI>` | Android: ABI для APK (`arm64-v8a`, `armeabi-v7a`, `x86_64`), флаг можно повторять или перечислять через запятую. По умолчанию: `arm64-v8a` и `armeabi-v7a`, плюс ABI устройства с `--run`. |
| `--run` | После сборки установить и запустить приложение: в симуляторе (`ios-simulator`) или на подключённом устройстве Android; `macos`, `linux` и `windows` запускают его; `web` раздаёт сайт на этой машине по адресу, который выводится в консоль. |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

См. [Packaging](./packaging.md).

## Signing commands

Эти команды создают и проверяют подписанные пакеты (`.nshpkg`): бандлы приложений, которые приложения со встроенным NSH скачивают и проверяют перед запуском. Модель описана в разделе [Signed packages](./signed-packages.md) (офлайн-корневой ключ заверяет release-ключи для определённых идентификаторов приложений).

### nsh keygen

```sh
nsh keygen <NAME>
```

Создаёт пару ключей Ed25519: `<NAME>.secret` и `<NAME>.pub` (например `nsh keygen keys/root`). Храните `.secret` корневого ключа офлайн; приложения доверяют его `.pub`.

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

Заверяет release-ключ корневым ключом для определённых идентификаторов приложений и временного окна; пакеты содержат сертификат.

| Флаг | Описание |
|---|---|
| `--root <ROOT>` | Секретный ключ корня. |
| `--key <KEY>` | Публичный ключ release-ключа. |
| `--apps <APPS>` | Идентификаторы приложений, для которых он может подписывать: `*`, `com.example.*` или конкретный идентификатор. Можно повторять. |
| `--days <DAYS>` | Как долго он может подписывать, считая от текущего момента (по умолчанию 365). |
| `-o, --out <OUT>` | Сертификат, который нужно записать. |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

Собирает приложение в режиме release и подписывает его в пакет. Метаданные берутся из `nsh.json` и переопределяются флагами.

Если передан пакет (`ENTRY` — это файл `.nshpkg`), он подписывается заново этим ключом, как это делает платформа, которая
подписывает пакеты своих приложений одним собственным ключом. Файлы и заголовок пакета остаются прежними; его сертификат,
время подписи и подпись становятся данными нового ключа ([Signed packages](./signed-packages.md#sign-a-package-again)). `-o`
может указывать прочитанный пакет, и применяются только `--key`, `--cert` и `-o`.

| Флаг | Описание |
|---|---|
| `--key <KEY>` | Секретный ключ release-ключа. |
| `--cert <CERT>` | Его сертификат (`nsh certify`). |
| `-o, --out <OUT>` | Пакет, который нужно записать. По умолчанию: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <ID>` | Идентификатор приложения. |
| `--app-version <VERSION>` | Версия. |
| `--build <BUILD>` | Номер сборки: должен расти с каждым релизом. |
| `--source-map <WHERE>` | Куда помещать карту исходников: `package` (по умолчанию), `file` (`<package>.map` рядом с пакетом) или `none` ([Signed packages](./signed-packages.md#errors-from-published-packages)). |
| `--strip-debug` | Не включать в байткод таблицы строк и столбцов: пакет меньше, но в стеках ошибок нет позиций. |
| `--min-runtime <VERSION>` | Самый ранний рантайм, который запускает пакет, например `0.2.0`; более старые рантаймы отказываются его запускать. По умолчанию: версия этого CLI ([Signed packages](./signed-packages.md#which-runtimes-run-a-package)). |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

Проверяет пакет так, как это сделало бы приложение, доверяющее указанным корням. Без `--root` проверяется только собственная подпись пакета. Команда выводит SHA-256 пакета, который принимает `nsh revoke --package`.

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

Переписывает позиции в бандле (`bundle.js:LINE:COL`) из ошибки, о которой сообщил пакет, в позиции ваших исходников и выводит
результат. `MAP` — это карта исходников (`<package>.map` из `nsh publish --source-map file`, `bundle.js.map`) или пакет,
который её содержит; `INPUT` — текст ошибки (по умолчанию читается из стандартного ввода).

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

Подписывает список отзыва: release-ключи и пакеты, которые больше нельзя загружать.

| Флаг | Описание |
|---|---|
| `--root <ROOT>` | Секретный ключ корня. |
| `--extend <EXTEND>` | Сохранить записи этого списка (последнего опубликованного). |
| `--sequence <N>` | Номер списка, выше любого из опубликованных ранее. По умолчанию с `--extend`: номер того списка плюс один. |
| `--key <ID>` | Идентификатор release-ключа, который нужно отозвать. Можно повторять. |
| `--package <SHA256>` | SHA-256 пакета, который нужно отозвать. Можно повторять. |
| `-o, --out <OUT>` | Список, который нужно записать. |

## Environment variables

| Переменная | Где используется | Описание |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Цели Android | Android SDK. Запасной вариант: `~/Library/Android/sdk`. |
| `CARGO_TARGET_DIR` | приложения с Rust-крейтами | Где собираются раннеры приложения. По умолчанию: `target/` приложения. |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | Пароль хранилища ключей. |
| `NSH_RUNTIME` | `run`, `package` | Каталог рантайма, который используется вместо находящегося рядом с CLI. |
| `NSH_VERBOSE` | каждая команда | `1`: как `--verbose`. |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | CLI `wasm-bindgen` для приложения, крейты которого [вызывают API браузера](./web.md#browser-apis-from-rust). По умолчанию: тот, что находится в `PATH`. |
| `NO_COLOR` | каждая команда | Если задана, в терминалах не используются цвета. |
