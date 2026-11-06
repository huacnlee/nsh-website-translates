---
title: "Упаковка"
description: "Сборка устанавливаемых приложений на Rust и TSX с помощью nsh package для устройств iOS, симулятора iOS, Android, macOS, Windows, Linux и web, с метаданными приложения, иконками и подписью."
order: 19
group: platforms
source_hash: 74c2991490481926
---

# Упаковка

`nsh package` превращает приложение в нечто, что можно установить: `.app` для симулятора iOS, подписанный `.ipa` для устройств iOS, подписанный `.apk` для Android, подписанный ad hoc `.app` для macOS, каталог и `.tar.gz` для Linux, каталог и `.zip` для Windows или статический сайт для веба. Не нужен ни проект Xcode, ни Gradle.

- **Rust-приложение** (`nsh.json` указывает его `"root"`) упаковывается из своего каталога. `nsh` собирает runner целевой платформы в режиме release с вашим подключённым crate и смонтированным корневым компонентом, без QuickJS. Нужны Cargo, Rust-таргет платформы (`rustup target add …`), а для Android ещё и NDK.
- **TSX-приложение** указывает свою точку входа. Его релизная сборка (минифицированная, скомпилированная в байткод QuickJS, ровно так, как её собирает `nsh build --release`) кладётся рядом с **предсобранным runtime**, который поставляется с NSH, поэтому тулчейн Rust не нужен. Приложение со своим crate (`"rust"` без `"root"`) получает runner'ы, собранные с его crate.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

Результат попадает в `.nsh/out/`, если не передать `--out`. В разделах ниже для каждой целевой платформы приведена команда для Rust-приложения; TSX-приложение добавляет свою точку входа (`nsh package App.tsx --target …`).

> [!NOTE]
> Чтобы вместо этого встроить NSH *внутрь* существующего нативного приложения, см. [Платформы](./platforms.md#embed-in-a-native-app), а для приложения на GPUI или GPUI Kit см. [GPUI](./gpui.md#embedding-in-a-gpui-app). Чтобы выпускать обновления, которые приложения скачивают и проверяют, см. [Подписанные пакеты](./signed-packages.md).

<a id="app-metadata-30"></a>

## Метаданные приложения: `nsh.json`

`nsh package` читает `nsh.json` в каталоге приложения (рядом с файлом точки входа у TSX-приложения). `nsh init` создаёт такой файл:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Ключ | Тип | По умолчанию | Назначение |
|---|---|---|---|
| `name` | string | имя каталога точки входа | Отображаемое имя под значком (`CFBundleDisplayName`, Android `android:label`) и имя выходного файла. |
| `id` | string | обязателен | Идентификатор бандла / имя пакета Android в формате обратного DNS в домене, которым вы владеете. Он же определяет, где приложение хранит своё [хранилище](../modules/nsh.md#storage), так что у каждого приложения оно своё. `nsh package` и `nsh publish` предупреждают о заглушке `com.example.`. |
| `version` | string | `"1.0.0"` | Видимая пользователю версия (`CFBundleShortVersionString`, `versionName`). |
| `build` | number | `1` | Номер сборки (`CFBundleVersion`, `versionCode`). Увеличивайте его для каждого загружаемого релиза. |
| `icon` | string | нет | Квадратный PNG, в идеале 1024×1024, относительно `nsh.json`. |

`nsh.json` также содержит `rust` и `root` (crate'ы приложения и его корневой компонент, [Сборка на Rust](./rust.md)), `theme` и `appearance`, `tailwind` (см. [Tailwind](./tailwind.md)) и `capabilities` (см. [Песочница и capabilities](./sandbox-and-capabilities.md)); [Структура проекта](./project-structure.md#nshjson) перечисляет все ключи. Неизвестные ключи приводят к ошибке.

Каждый из перечисленных выше ключей можно переопределить в командной строке, что удобно в CI:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## Параметры

| Флаг | Описание |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | Для чего собирать (обязательно). |
| `-o, --out <dir>` | Выходной каталог. По умолчанию `.nsh/out`. |
| `--name <name>` | Отображаемое имя. |
| `--id <id>` | Идентификатор бандла, например `com.example.app`. |
| `--app-version <version>` | Версия, например `1.2.0`. |
| `--build <n>` | Номер сборки. |
| `--icon <png>` | Значок приложения: квадратный PNG, в идеале 1024×1024. |
| `--sign <identity>` | iOS: идентификатор подписи кода для устройств. |
| `--profile <file>` | iOS: provisioning profile для устройств (`.mobileprovision`). |
| `--keystore <file>` | Android: релизный keystore (по умолчанию: debug-ключ). |
| `--key-alias <alias>` | Android: алиас ключа в keystore. |
| `--keystore-password <password>` | Android: пароль keystore; также читается из `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android: ABI для APK, флаг можно повторять или перечислять значения через запятую (по умолчанию: `arm64-v8a` и `armeabi-v7a`). |
| `--run` | Затем установить и запустить: в симуляторе iOS либо на устройстве или эмуляторе Android, который видит `adb`; приложения macOS, Linux и Windows запускаются на этой машине; веб-сайт раздаётся на этой машине и открывается в браузере. Не для `--target ios`. |

<a id="ios-simulator"></a>

## Симулятор iOS

```sh
nsh package --target ios-simulator --run
```

Создаёт `.nsh/out/<Name>.app`, подписанный ad hoc (симулятору нужна подпись, но не идентификатор). С `--run` запускает симулятор, если ни один не запущен, устанавливает приложение и запускает его. Требуется Xcode.

<a id="ios-devices"></a>

## Устройства iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Создаёт `.nsh/out/<Name>.ipa`, готовый для TestFlight, инструментов загрузки в App Store или прямой установки (в зависимости от профиля). Что происходит:

- Provisioning profile копируется в приложение как `embedded.mobileprovision`.
- Entitlements берутся из профиля. NSH проверяет, что application identifier профиля покрывает `id` приложения (работают wildcard-профили, такие как `TEAMID.*` или `TEAMID.com.example.*`), и в противном случае останавливается с ошибкой.
- Приложение подписывается с помощью `codesign` указанным идентификатором, затем упаковывается в `.ipa` (`Payload/<Name>.app`).

Найти свои идентификаторы можно так:

```sh
security find-identity -v -p codesigning
```

Без `--sign` и `--profile` NSH создаёт неподписанный `.nsh/out/<Name>.app` и сообщает об этом; в таком виде его нельзя установить на устройство.

Приложение поддерживает iPhone и iPad, портретную и ландшафтную ориентации (портретная вверх ногами только на iPad) и требует iOS 15.0 или новее.

## Android

```sh
nsh package --target android --run
```

Создаёт `.nsh/out/<Name>.apk`. APK собирается напрямую инструментами сборки SDK (`aapt2`, `zipalign`, `apksigner`), без Gradle. Требования:

- Android SDK, найденный через `ANDROID_HOME` (или `ANDROID_SDK_ROOT`, или `~/Library/Android/sdk`), с build tools и пакетом `platforms;android-35`. Если чего-то не хватает, NSH подскажет команду `sdkmanager`.
- JDK, чтобы в первый раз создать debug keystore.
- Для Rust-приложения Android NDK (`sdkmanager "ndk;<version>"` или `ANDROID_NDK_HOME`), который собирает его `libnsh.so`.

Приложение нацелено на API 35 и требует API 28 (Android 9) или новее. Оно содержит нативный код для ABI телефонов, `arm64-v8a` и `armeabi-v7a`; с `--run` также для ABI подключённого устройства, например `x86_64` эмулятора. `--abi` позволяет выбрать их самостоятельно, например `--abi arm64-v8a` только для 64-разрядных телефонов даёт самый маленький APK:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Подпись для релиза

Без `--keystore` APK подписывается стандартным debug-ключом (`~/.android/debug.keystore`, создаётся, если отсутствует), и NSH предупреждает, что он не предназначен для релизов в магазинах. Для релиза один раз создайте keystore и передайте его:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Предпочитайте переменную окружения, а не `--keystore-password`, чтобы пароль не попал в историю вашей оболочки.

## macOS

```sh
nsh package --target macos --run
```

Создаёт `.nsh/out/<Name>.app`: исполняемый файл в `Contents/MacOS/`, а также `nsh/assets/…`, `nsh/app.json` (заголовок окна и внешний вид приложения) и `nsh/bundle.nshc` TSX-приложения в `Contents/Resources/`. Приложение подписано ad hoc и требует macOS 14 или новее; чтобы распространять его, подпишите его Developer ID и пройдите нотаризацию. См. [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Создаёт `.nsh/out/<Name>/` (исполняемый файл `<Name>`, `nsh/assets/…`, `nsh/app.json` с заголовком окна и идентификатором приложения, `nsh/bundle.nshc` TSX-приложения, `<id>.desktop` и значок `<id>.png`) и то же, что и `.nsh/out/<Name>.tar.gz`. Упаковывайте на Linux: runner собирается для той машины, на которой идёт сборка. GTK 4 (4.14 или новее), Pango и WebKitGTK 6.0 (для веб-представлений) должны быть установлены там, где запускается приложение. Установка и desktop entry: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Создаёт `.nsh\out\<Name>\` (исполняемый файл `<Name>.exe` со значком приложения, `nsh\assets\…`, `nsh\app.json` с заголовком окна, идентификатором приложения, версией и внешним видом, и `nsh\bundle.nshc` TSX-приложения) и то же, что и `.nsh\out\<Name>.zip`. TSX-приложению инструменты не нужны; runner Rust-приложения собирается с помощью Visual Studio Build Tools. Упаковывайте на Windows: runner собирается для той машины, на которой идёт сборка, а встроить значок может только Windows. Приложение запускается из любого места, куда скопирован его каталог; ничего не устанавливается. См. [Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Создаёт `.nsh/out/<Name>/`, статический сайт: `index.html`, `manifest.webmanifest`, скрипт страницы (`nsh.<digest>.js`) и `nsh.<digest>.wasm` (движок и crate Rust-приложения; для TSX-приложения runtime рядом с ES-модулем приложения `app.<digest>.js`), его ресурсы и значки. Каждый файл назван по своему содержимому, чтобы хосты могли кэшировать их навсегда. Разверните каталог на любом веб-сервере или CDN; `--run` раздаёт его на `http://127.0.0.1:4173/`, чтобы вы могли открыть сайт. Заголовки кэширования и встраивание: [Web](./web.md#publish-an-app).

<a id="icons"></a>

## Значки

Передайте один квадратный PNG, в идеале 1024×1024, в `nsh.json` (`"icon": "icon.png"`) или через `--icon`:

- **iOS:** компилируется `actool` из Xcode в каталог ресурсов приложения (`Assets.car`), который формирует все нужные iOS размеры.
- **Android:** масштабируется до 192×192 и используется как значок лаунчера (`mipmap-xxxhdpi`).
- **macOS:** преобразуется `sips` в `AppIcon.icns`.
- **Linux:** копируется как `<id>.png`, которое файл `.desktop` указывает как свой `Icon`.
- **Windows:** масштабируется до 16–64 пикселей и 256 пикселей и встраивается в исполняемый файл как его значок, который показывают окно, Проводник и панель задач.
- **Web:** масштабируется до 32 пикселей (favicon), 180 (`apple-touch-icon`), 192 и 512 (манифест веб-приложения).

Без значка система показывает свой значок по умолчанию.

<a id="what-is-inside"></a>

## Что внутри

Пакет Rust-приложения состоит из его runner'а, собранного с вашим crate и смонтированным корневым компонентом, и ресурсов, которые регистрируют его crate'ы (`assets!()`). Пакет TSX-приложения содержит его байткод, его `capabilities.json` (если оно объявляет capabilities) и импортируемые ресурсы рядом с предсобранным runtime:

| Платформа | Runtime | TSX-приложение |
|---|---|---|
| iOS | исполняемый файл `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (без символов, хранится без сжатия, выравнивание 16 КБ) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | исполняемый файл `nsh-macos-app`, переименованный в `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | исполняемый файл `nsh-linux-app`, переименованный в `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | исполняемый файл `nsh-windows-app.exe`, переименованный в `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Упакованное приложение не регистрирует [нативные компоненты](./native-components.md); для них встраивайте NSH в собственное приложение.

<a id="finding-the-runtime"></a>

## Поиск runtime

Rust-приложение собирает свои runner'ы само. Для TSX-приложений `nsh package` ищет предсобранный runtime рядом с CLI (`bin/../runtime` в дистрибутиве). В checkout NSH он использует `target/<triple>/<profile>` и `target/android/<profile>` с профилем самого CLI (debug-CLI использует debug-runtime'ы): соберите их с помощью `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (или `aarch64-apple-ios` для устройств) и `cargo xtask android` (добавьте `--release` для release-CLI). `nsh-macos-app` (на macOS), `nsh-linux-app` (на Linux) и `nsh-windows-app` (на Windows) собираются для этой машины в `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`); веб-runtime собирается с профилем `web` независимо от профиля CLI, в `target/wasm32-unknown-unknown/web/`. Переменная окружения `NSH_RUNTIME` указывает CLI на другой каталог с той же структурой, что и `runtime/` дистрибутива (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## См. также

- [CLI](./cli.md): все команды
- [Подписанные пакеты](./signed-packages.md): обновления, которые скачивают приложения
- [Структура проекта](./project-structure.md): `nsh.json` и файлы приложения
