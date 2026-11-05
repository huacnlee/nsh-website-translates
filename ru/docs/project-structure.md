---
title: "Структура проекта"
description: "Файлы приложения NSH на Rust или TSX, каждый ключ nsh.json, настройка TypeScript в .nsh/types, ресурсы, а также способы импорта модулей и пакетов."
order: 5
group: start
source_hash: 67da39e1182fc05c
---

# Структура проекта

Приложение NSH — это каталог с `nsh.json` и его кодом: Rust-крейтом, корневой компонент которого называет `nsh.json`, или TSX-модулем входа, или и тем и другим. Всё остальное (другие модули, изображения, шрифты, JSON-файлы) находится отсюда: по модулям крейта и его каталогу `assets/` либо по файлам, которые импортирует TSX-вход, поэтому списка файлов поддерживать не нужно.

Приложение на Rust — это проект Cargo:

```text
my-app/
├── nsh.json           name, id, version, icon, the crate ("rust") and its root component ("root"), theme
├── Cargo.toml         the crate: nsh-core, nsh-base and your dependencies
├── src/
│   ├── lib.rs         the root component and the crate's UI set (#[native_module])
│   ├── main.rs        cargo run: the root on this machine's desktop backend
│   └── screens/       your own modules (any layout you like)
├── assets/            files the crate ships: asset!("logo@2x.png"), fonts
├── .gitignore         .nsh/ and target/
├── .nsh/              generated: the runners' sources, test entries, build output (.nsh/out)
└── target/            Cargo's build directory
```

Приложение на TSX — это точка входа и модули, которые она импортирует:

```text
my-app/
├── App.tsx            the entry module: calls mount()
├── App.test.tsx       its tests (nsh test)
├── nsh.json           name, id, version, icon, Tailwind theme, capabilities
├── tsconfig.json      TypeScript settings for editors
├── .gitignore         .nsh/ and target/
├── components/        your own modules (any layout you like)
│   └── Header.tsx
├── assets/
│   ├── logo@2x.png    imported images
│   └── Inter.ttf      imported fonts
└── .nsh/              generated: type declarations, development host builds, test entries, build output (.nsh/out)
```

Приложение, в котором есть и то и другое, перечисляет свои крейты в `"rust"` и имеет TSX-вход, который их импортирует ([Сборка с Rust](./rust.md#extending-a-rust-app-with-tsx)).

Каждая команда принимает в качестве аргумента каталог приложения или его точку входа (`nsh run my-app`, `nsh run my-app/App.tsx`). Каталог `nsh.json` и точки входа — это корень приложения: оттуда читается `nsh.json`, пути к ресурсам отсчитываются от него, и туда же записывается `.nsh/`. В приложении на Rust (`nsh.json` `"root"`) каталог запускает корневой компонент; если указать TSX-вход, запускается он.

<a id="the-root-component"></a>

## Корневой компонент

Корень Rust-приложения — компонент его крейта, который называет `"root"` в `nsh.json` по его пути в крейте (`App`, `shell::Gallery`). TSX-вход — обычный модуль, который заканчивается рендерингом корневого компонента:

```rust tabs
// src/lib.rs; nsh.json: { "rust": ".", "root": "App" }
mod screens;

use nsh_core::prelude::*;

/// What a TSX entry may import from the crate.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>().assets(assets!());
}

#[component]
pub fn App() -> impl IntoElement {
    screens::home()
}
```

```tsx tabs
// App.tsx
import { mount } from "nsh";
import { Home } from "./components/Home";

function App() {
  return <Home />;
}

mount(App);
```

`nsh run` и `nsh package` монтируют корень на Rust на каждой платформе, без QuickJS. В TSX `mount(component, props?)` рендерит компонент на поверхность приложения и возвращает функцию, которая снова его удаляет; рендер выполняется в приложении один раз. Код верхнего уровня точки входа выполняется при загрузке бандла, до первого кадра.

## nsh.json

`nsh.json` лежит в корне приложения. `nsh init` записывает `name`, `id`, `version` и `build`, а для приложения на Rust ещё и крейт с его корневым компонентом:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "rust": ".",
  "root": "App",
  "theme": "theme.json"
}
```

Все остальные ключи необязательны; TSX-приложение может не указывать и эти четыре. `nsh.json` TSX-приложения может выглядеть так:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png",
  "tailwind": {
    "colors": { "brand": { "500": "#7c3aed", "600": "#6d28d9" } },
    "radius": { "card": 14 }
  },
  "capabilities": {
    "network": { "hosts": ["api.example.com", "*.cdn.example.com"] }
  }
}
```

| Ключ | Тип | Используется | Описание |
|---|---|---|---|
| `name` | строка | `package` | Отображаемое имя под значком приложения. По умолчанию — имя каталога точки входа. |
| `id` | строка | `package`, `publish`, `Storage` | Идентификатор пакета / идентификатор приложения в формате обратного DNS, например `com.yourcompany.app`; требуется для `package` и `publish`. `nsh run` без него использует `com.example.<name>`. |
| `version` | строка | `package`, `publish` | Версия, видимая пользователю, например `1.2.0` (`CFBundleShortVersionString`, в Android `versionName`). |
| `build` | число | `package`, `publish` | Номер сборки (`CFBundleVersion`, в Android `versionCode`). Подписанные пакеты требуют, чтобы он рос с каждым релизом. |
| `minRuntime` | строка | `publish` | Самая ранняя версия среды выполнения NSH, которая запускает подписанный пакет, например `0.2.0`. По умолчанию — версия CLI ([Подписанные пакеты](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | строка | `package` | Квадратный PNG, желательно 1024×1024, относительно `nsh.json`. |
| `tailwind` | объект | каждая сборка | Расширяет тему Tailwind, по которой разрешаются ваши строки `class` ([Tailwind](./tailwind.md#theme)). |
| `appearance` | строка | каждая сборка, `package` | `"light"`, `"dark"` или `"system"` (по умолчанию): приложение, которое всегда светлое или тёмное, указывает это здесь. Классы `colorScheme()`, `dark:`, тема компонентов и элементы управления платформы следуют этому значению с самого начала ([Устройство и окружение](./device-and-environment.md#dark-mode)). |
| `theme` | строка или объект | каждая сборка | Дизайн-токены приложения (`cssVars` из shadcn/ui поверх стандартной темы `neutral`), которыми рисуют токен-классы, `token()` и компоненты на Rust: путь к файлу темы относительно `nsh.json` или сама тема инлайн ([Сборка с Rust](./rust.md#theme), [Токены темы](./tailwind.md#theme-tokens)). |
| `statusBar` | объект | каждая сборка, `package` | Вид строки состояния по умолчанию под каждой страницей и диалогом (iOS и Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, оба необязательны. Упакованные приложения iOS показывают её начиная с экрана запуска ([Строка состояния](../modules/nsh-base.md#status-bar)). |
| `capabilities` | объект | каждая сборка | Что приложению разрешено использовать за пределами своей VM: сетевые хосты, хосты веб-представлений, строка состояния ([Песочница и возможности](./sandbox-and-capabilities.md)). |
| `resolve` | объект | каждая сборка | Как разрешаются «голые» импорты: условия экспорта npm-пакетов и алиасы ([npm-пакеты](#npm-packages)). |
| `rust` | строка или string[] | каждая команда | Rust-крейт приложения или список крейтов относительно `nsh.json`: их компоненты и модули, которые TSX импортирует по спецификатору `#[native_module]` каждого крейта ([Сборка с Rust](./rust.md#several-crates)). |
| `web` | объект | `package` | Что веб-пакет добавляет на свою страницу. `web.host`: JS-модуль относительно `nsh.json`, экспортирующий `createHost(player)`, который отвечает на вызовы [`host`](../modules/nsh.md#host) приложения; `web.connect`: хосты, до которых доходят собственные запросы этого модуля, в виде шаблонов `capabilities.network.hosts`, которые разрешает Content-Security-Policy страницы ([Web](./web.md#the-hosts-functions)). |
| `root` | строка | `run`, `package` | Корневой компонент Rust-приложения, его путь в крейте `rust`, первом из списка (`App`, `shell::Gallery`): `nsh run` и `nsh package` каталога приложения монтируют его без QuickJS на любой платформе; `nsh run App.tsx` по-прежнему запускает TSX-вход ([Сборка с Rust](./rust.md)). |

Флаги `nsh package` и `nsh publish` (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) переопределяют значения из файла ([CLI](./cli.md)).

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` и `resolve` проверяются при сборке приложения. Опечатка приводит к ошибке сборки, а не к настройке, которая молча ничего не делает:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

Без ключа `capabilities` приложение может свободно использовать сеть, веб-представления и строку состояния: автономное приложение принадлежит своему разработчику. При наличии ключа всё, что не перечислено, запрещено — и при разработке, и в упакованных приложениях:

```json
"capabilities": {
  "network": {
    "hosts": ["api.example.com", "*.cdn.example.com"],
    "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }]
  },
  "webview": { "hosts": ["*.example.com"] },
  "statusBar": true
}
```

`network` охватывает `fetch`, удалённые изображения и источники видео; локальные ресурсы разрешены всегда. Приложение, встраивающее NSH, может предоставить меньше, чем объявляет приложение. Подробности — в разделе [Песочница и возможности](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json и .nsh/types

NSH не нуждается в `node_modules`. Вместо этого каждая команда, собирающая приложение (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`), записывает TypeScript-объявления всего, что предоставляет NSH, в `.nsh/types`, а настройки TypeScript для NSH — в `.nsh/tsconfig.json`. `tsconfig.json` приложения расширяет их:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` направляет импорты `nsh` и крейты вашего приложения в `.nsh/types`, подключает объявления глобальных переменных, ресурсов и токенов и задаёт параметры компилятора, которые используют приложения NSH (`lib`, `jsx`, `strict`, ...). NSH поддерживает его актуальным: когда новая версия добавляет библиотеку или путь, они появляются в вашем приложении со следующей сборкой, а ваш `tsconfig.json` остаётся таким, каким вы его написали. Параметры, которые вы добавляете в `tsconfig.json`, применяются поверх параметров NSH.

| Файл в `.nsh/types/nsh/` | Объявляет |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... и реэкспортирует типы ниже |
| `types.d.ts` | Стили (`ViewStyle`, `TextStyle`, ...), свойства и события каждого элемента, ссылки (`ViewRef`, `InputRef`, ...: то, что получает `ref`) |
| `jsx-runtime.d.ts` | JSX-рантайм, который TypeScript разрешает через `jsxImportSource` (пространство имён `JSX`) |
| `globals.d.ts` | `If` и `Each`; `console`, таймеры, `requestAnimationFrame`, `fetch` и другие [глобальные API](../modules/globals.md) |
| `assets.d.ts` | Что возвращает импорт изображения или шрифта |
| `tokens.d.ts` | `Tokens`: дизайн-токены приложения из его `"theme"`, которые типизируют [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`, `desktop.d.ts` | По одному файлу на модуль (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` — это `ES2023` без `DOM`: `document` или `window` нет. Файлы в `.nsh` перегенерируются (только при изменении содержимого), поэтому не редактируйте их и не коммитьте; `.gitignore` уже исключает `.nsh/`. Если после клонирования проекта редактор показывает `nsh` как отсутствующий, один раз запустите любую команду сборки, например `nsh check`.

`.nsh/tsconfig.json` добавляет `"ESNext.Disposable"`, который объявляет `using` и `Symbol.dispose`, имеющиеся в рантайме: `using account = new Account()` освобождает значение [класса Rust](./rust.md) в конце блока. Его `jsxImportSource: "nsh"` и `jsx: "preserve"` важны только редактору: NSH компилирует JSX собственным компилятором, что бы ни говорил `tsconfig.json`. TypeScript проверяется редактором или `nsh check`; остальные команды удаляют типы без проверки.

Приложение, созданное более ранним `nsh init`, получает новый `tsconfig.json` со следующей сборкой, если его собственный — неизменённый шаблон NSH; NSH выводит строку об этом. Изменённый вами `tsconfig.json` остаётся вашим: `nsh check` укажет, если он не расширяет `./.nsh/tsconfig.json`, и вы добавляете строку `extends` и удаляете параметры, которые он задаёт.

<a id="modules"></a>

## Модули

Код Rust-приложения — это модули его крейта (`mod screens;`), а зависимости берутся с crates.io, как у любого крейта; собственные крейты NSH — `nsh-core` (примитивы, сигналы и типизированные стили, `use nsh_core::prelude::*`) и `nsh-base` (базовые компоненты и тема).

В TSX разбивайте приложение на сколько угодно модулей `.ts` и `.tsx` и импортируйте их по относительным путям; расширение можно опустить:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

Все они собираются в один скрипт. JSON-файлы импортируются как их разобранное значение.

<a id="loading-code-on-demand"></a>

### Загрузка кода по требованию

`import()` одного из модулей приложения возвращает промис с его экспортами, как в браузере:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

Приложения на устройствах поставляются одним бандлом, поэтому модуль уже на месте, и промис разрешается сразу. Веб-приложение, опубликованное с разделением (`nsh build --split`), получает модуль и то, что используется только им, отдельным файлом, который скачивается при первом обращении `import()` ([Web](./web.md#split-bundles)). Спецификатор должен быть литеральным относительным путём: сборщик должен видеть, какой модуль имеется в виду.

<a id="nshs-modules"></a>

### Модули NSH

Импорты `nsh` и `nsh/...` не включаются в бандл: их нативно предоставляет рантайм.

| Модуль | Что в нём |
|---|---|
| `nsh` | Реактивность (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; примитивы `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (`selectable` у `View` для выделения текста); отступы безопасной области (`safeArea`, `safeAreaInsets`) и экранная клавиатура (`Keyboard`, `keyboardFrame`); нативные анимации; `PanResponder`; окружение (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); состояние программы чтения с экрана и режима уменьшения движения, объявления; буфер обмена, выбор фото, хранилище, канал хоста, сочетания клавиш; компоненты и функции, которые регистрирует встраивающее приложение ([справочник](../modules/nsh.md)) |
| `nsh/base` | Нестилизованная основа UI приложения: стеки навигации и их страницы (`NavStack`, `NavPage`, `createNavStack`), диалоги (`Dialog`), цель нажатия (`Button`), текстовое поле (`Input`) и системный диалог оповещения (`AlertDialog`); страницы и диалоги задают строку состояния (`statusBar`) ([справочник](../modules/nsh-base.md)) |
| `nsh/mobile` | То, что есть в iOS и Android: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([справочник](../modules/nsh-mobile.md)) |
| `nsh/desktop` | То, что есть в macOS, Windows и Linux: `Window`, `titleBar`, `Menu` ([справочник](../modules/nsh-desktop.md)) |

Каждый модуль описан в [справочнике модулей](../modules/index.md). Импорт модуля, которого в NSH нет (`nsh/foo`), — ошибка сборки. Так же и имя, которое использует ваш код, но которое модуль не экспортирует (`import { Buton } from "nsh/base"`): ошибка указывает на импорт и называет ближайший экспорт (``did you mean `Button`?``). Имена, используемые только как типы, проверяет `nsh check`.

<a id="npm-packages"></a>

### npm-пакеты

NSH ничего не требует от npm, но сборщик разрешает «голые» импорты из каталога `node_modules`, если вы устанавливаете пакеты менеджером пакетов. Пакеты разрешаются в свои браузерные сборки, потому что рантайм предоставляет веб-API (`fetch`, потоки, `URL`, `TextEncoder`, ...), а не API Node (`fs`, `Buffer`, `process`). Пакеты, обращающиеся к DOM, не работают: его нет.

У пакета, браузерная сборка которого использует DOM, часто есть другая сборка — для воркеров или React Native. `resolve.conditions` выбирает условия экспорта, с которыми разрешаются пакеты, вместо стандартных `["browser"]`: `import`, `require`, `module` и `default` применяются всегда, а без `browser` пакеты разрешаются через поля `module` и `main`. `resolve.alias` заменяет импорт: путём относительно `nsh.json` (`./` или `../`), другим пакетом или `false` для пустого модуля. TypeScript (`nsh check`, редакторы) типизирует импорт как написано: имя, не являющееся установленным пакетом, получает типы из файла `.d.ts` приложения.

```json
"resolve": {
  "conditions": ["worker"],
  "alias": { "dom-only-helper": "./shims/helper.ts", "node-polyfill": false }
}
```

```ts
// shims/aliases.d.ts
declare module "node-polyfill";
```

`solid-js` импортировать нельзя: сборщик отказывается и указывает на собственные `signal`, `computed` и `effect` из `nsh`, которые его заменяют.

<a id="assets"></a>

## Ресурсы

Изображения и шрифты поставляются вместе с приложением. Rust-крейт читает каждый файл своего каталога `assets/` при компиляции с помощью `asset!` и поставляет их все через `registry.assets(assets!())` в своей функции `#[native_module]`; TSX импортирует их как модули, а сборщик запоминает каждый импортированный файл (и варианты изображения для разной плотности пикселей). `nsh build` копирует их в `.nsh/out/assets/`, `nsh package` помещает их в приложение, а во время разработки они отдаются приложению сервером.

```rust tabs
use nsh_core::element::{FontAsset, ImageAsset, asset};

const LOGO: ImageAsset = asset!("logo@2x.png");      // its url, and its size: 64×64 points
const INTER: FontAsset = asset!("Inter.ttf");        // its uri, and its family: "Inter"

image(LOGO)
text("Hello").font_family(INTER.family)
```

```tsx tabs
import { Image, Text } from "nsh";
import logo from "./assets/logo@2x.png";   // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
import Inter from "./assets/Inter.ttf";     // "Inter"

<Image src={logo} />
<Text style={{ fontFamily: Inter }}>Hello</Text>
```

| Расширение | Что даёт импорт |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | Объект `ImageAsset`: `{ url, size, scales? }`, размер задан в пунктах. Суффикс `@2x` / `@3x` делит размер в пикселях на 2 / 3. Файл без суффикса поставляет и соседние файлы `@1.5x`–`@4x`, перечисленные в `scales`, и загружается вариант, подходящий экрану ([плотности пикселей](./images-and-assets.md#pixel-densities)). |
| `.svg` | `ImageAsset` с размером в пунктах, взятым из `width` и `height` SVG (или `viewBox`). |
| `.ttf`, `.otf`, `.woff`, `.woff2` | Имя семейства шрифта, строка. Шрифт регистрируется до первого кадра. |
| `.json` | Разобранный JSON |

См. [Изображения и ресурсы](./images-and-assets.md) и [Шрифты](./fonts.md).
<a id="generated-directories"></a>

## Генерируемые каталоги

- **`.nsh/`**: всё, что генерирует NSH: объявления типов (`.nsh/types`), исходники раннеров Rust-приложения (`.nsh/rust`), то, что `nsh run` устанавливает на симуляторы и устройства (хост-приложение Catalyst, APK для разработки под Android), а также `.nsh/out` — вывод по умолчанию команды `nsh build` (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; для Rust-приложения `app.json` и `assets/`) и команды `nsh package` (`.app`, `.ipa`, `.apk`, сайт); `-o` записывает результат в другое место. Можно безопасно удалять: каталог создаётся заново.
- **`target/`**: каталог сборки Cargo для крейтов и раннеров приложения (или `CARGO_TARGET_DIR`).
