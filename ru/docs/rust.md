---
title: "Разработка на Rust"
description: "Напишите приложение Native Shell полностью на Rust, без QuickJS на любой платформе, либо на Rust с экранами на TSX сверху: когда какой вариант выбрать и как оба подхода используют общие компоненты и модули."
order: 5.5
group: start
source_hash: 3b582ec92e69733e
---

# Разработка на Rust

Приложения на Native Shell пишутся на Rust, на TSX или на обоих сразу. Все три варианта работают на одном движке: реактивный граф, рендерер, раскладка Taffy и нативные модули (навигация, диалоги, клавиатура, строка состояния) во всех случаях написаны на Rust, а каждая платформа рисует интерфейс средствами собственного UI. Различается язык вашего собственного кода, а вместе с ним и то, несёт ли приложение JavaScript VM.

| | Rust | TSX | Rust с TSX |
|---|---|---|---|
| Ваш UI, состояние и обработчики | Rust | TSX на QuickJS | Компоненты и модули на Rust, экраны на TSX, которые их используют |
| Что запускается | только движок и ваш крейт, на всех платформах и в браузере | QuickJS и движок (в браузере вместо QuickJS используется его JavaScript-движок) | QuickJS и движок вместе с вашим крейтом (в браузере вместо QuickJS используется его JavaScript-движок) |
| Подходит для | Средних и крупных приложений со сложной бизнес-логикой | Приложений и модулей, доставляемых во время работы, быстрых итераций | Ядра на Rust с часто меняющимися частями |
| Правки | Пересборка и перезапуск | Горячие обновления | Горячие обновления для TSX, пересборка и перезапуск для Rust |
| Старт | `nsh init my-app --template rust` | `nsh init my-app --template ts` | `nsh init my-app --template mixed` |

<a id="choosing"></a>

## Выбор подхода

**Rust** подходит приложениям с большой и требовательной бизнес-логикой: трейдинг, редакторы, инструменты для работы с большими объёмами данных. Вы получаете систему типов Rust и проверки на этапе компиляции для всего приложения, экосистему crates.io, нативную производительность для собственного кода (а не только для кода NSH) и headless-тесты настоящего UI с помощью `cargo test`. Приложение целиком состоит из Rust и нативного кода: JavaScript VM не поставляется с ним и не работает внутри него на iOS, Android, macOS, Windows, Linux, GPUI и в вебе. Компоненты представляют собой функции, которые выполняются один раз и привязывают сигналы к тому, что показывают, как и в TSX ([Реактивность](./reactivity.md)); вместо строк с классами в них используются типизированные стили.

**TSX** подходит для UI, который появляется после выпуска приложения: модулей, которые нативное приложение загружает во время работы, сгенерированных моделью или написанных другой командой, доставляемых в виде [подписанных пакетов](./signed-packages.md) и работающих в песочнице, которую настраивает хост, с горячими обновлениями во время разработки.

**Rust с TSX** сохраняет ядро на Rust и добавляет TSX там, где это оправдано: для экранов, настроек, онбординга, экспериментов, всего, что вы итерируете с горячими обновлениями или доставляете во время работы как [подписанный пакет](./signed-packages.md). TSX импортирует ваши компоненты и модули на Rust как любой модуль NSH, поэтому две половины встречаются на типизированных интерфейсах. TSX выполняется на QuickJS, который приложение в этом случае несёт с собой.

<a id="an-app-written-in-rust"></a>

## Приложение на Rust

```sh
nsh init my-app --template rust
cd my-app
nsh run                        # this machine's backend; --target ios, android, web, macos, linux or windows
nsh package --target web       # or ios, ios-simulator, android, macos, linux, windows
```

`src/lib.rs` содержит приложение: компоненты, состояние, обработчики, задачи.

```rust
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The components available to TSX through `app/native`.
#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    let quote = signal(SharedString::from("…"));
    // Async work runs in tasks; requests go through NSH's network stack.
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/quote").await {
            quote.set(response.text().into());
        }
    });
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_4()
        .child(text(move || format!("Count: {}", count.get())))
        .child(text(quote))
        .child(
            // nsh_base's unstyled button, drawn with the theme's colors.
            button()
                .px(px(20.0))
                .py(px(12.0))
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .on_press(move || count.update(|c| *c += 1))
                .child(text("Tap").text_color(move || theme().primary_foreground)),
        )
}
```

Элементы и компоненты создаются одинаково: функция создаёт один из них (`view()`, `text(..)`, `button()` из `nsh_base`, `chart()` из вашего `#[component] fn Chart`), а его методы задают свойства, по одному сеттеру на свойство (значение, сигнал или замыкание), и слушатели, по одному методу на событие. Слушатели являются замыканиями своего события (`move |text: &str| ..`), а `move || ..` служит для события без данных; `.child(..)` принимает элемент либо `Option`, `Vec`, массив или итератор элементов (`.child(rows.iter().map(|r| row(r)))`).

`nsh.json` называет корень, а `nsh` монтирует его:

```json
{
  "name": "My App",
  "rust": ".",
  "root": "App",
  "theme": "theme.json",
  "appearance": "system"
}
```

`"root"` — это путь к компоненту в крейте (`App`, `shell::Gallery`; в первом случае при [нескольких крейтах](#several-crates)); `"theme"` — это [тема](#theme), которой пользуются его компоненты при отрисовке, и `"appearance"` применяется к нему так же, как и к приложению на TSX. С ним `nsh run` и `nsh package` в каталоге приложения собирают собственный раннер приложения для целевой платформы, с примонтированным корнем и без QuickJS:

| Цель | Что запускается |
|---|---|
| macOS, Windows, Linux | Релизный раннер с вашим крейтом, в окне; `nsh run` запускает отладочную сборку и показывает логи приложения в терминале |
| iOS, симулятор iOS, Mac Catalyst | Раннер для iOS с вашим крейтом, в приложении |
| Android | `libnsh.so` приложения с вашим крейтом, запускаемая activity из рантайма |
| Web | `nsh.wasm` с движком и вашим крейтом (3,3 МБ для всей галереи на Rust, 0,75 МБ с brotli); страница монтирует корень |

`nsh` собирает то, что нужно вашему крейту, и ничего лишнего: небольшую программу из вашего крейта и ядра NSH, которая описывает его компоненты и модули для CLI, дальше CLI делает всё сам, и раннер для каждой цели, которую вы запускаете или упаковываете. Первая сборка нового приложения на Rust компилирует ваш крейт и ядро NSH, около 60 крейтов. `nsh test` запускает тесты приложения в headless-режиме в раннере с вашим крейтом, собранном тем же способом.

На Linux ваш крейт выбирает необязательные возможности платформы. Включите `webview` в зависимости `nsh-platform-linux`, чтобы использовать веб-представления; при этом подключается WebKitGTK 6.0, который должен быть установлен для сборки и запуска приложения. Сгенерированный раннер наследует этот выбор через унификацию функций Cargo.

Во время `nsh run` изменение Rust-кода крейта заново собирает раннер и перезапускает приложение; в браузере открытая страница сама загружает новый рантайм. `cargo run` запускает тот же корень напрямую на десктопном бэкенде (`src/main.rs`), а нативные приложения, встраивающие NSH, монтируют корень на Rust с помощью `AppSource::Rust` на `AppView` в macOS, Windows, Linux, GPUI и iOS.

Код для любой платформы, включая веб, пользуется сервисами NSH: `fetch` для HTTP ([Сеть](./networking.md#from-rust-components)), `timer`, `set_timeout` и `set_interval` для ожидания, `nsh_core::time::Instant` и `nsh_core::time::unix_ms()` для работы с часами. `background` и `blocking` выполняют работу в потоках нативных целей.

<a id="desktop-title-bars"></a>

## Заголовки окон на десктопе

Приложения на Rust рисуют собственные заголовки окон с помощью `nsh_core::element::desktop`. Вызовите `set_title_bar(TitleBarStyle::Hidden, Some(height))`, пометьте фон заголовка с помощью `.window_drag(true)` и зарезервируйте место под нативные кнопки управления окном с помощью `title_bar()`. Его `top` — это высота заголовка, а `left` и `right` — ширина, занятая системными кнопками. Чтение этого значения подписывает на изменения, в том числе при переходе в полноэкранный режим. Перетаскиванием окна и поведением двойного клика по заголовку, настроенным пользователем, занимается платформа; `.window_drag(false)` не даёт дочернему элементу попасть в область перетаскивания родителя.

```rust
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{close_window, set_title_bar, title_bar}}, prelude::*,
};

fn window_bar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(42.0)));
    view()
        .h(px(42.0))
        .flex_row()
        .items_center()
        .window_drag(true)
        .pl(move || title_bar().left + px(12.0))
        .pr(move || title_bar().right + px(12.0))
        .child(text("My app").flex_1())
        .child(text("Close").window_drag(false).on_press(close_window))
}
```

`set_title_bar(TitleBarStyle::Default, None)` возвращает системный заголовок окна. `close_window()` следует обычному для встраивающего хоста поведению при закрытии окна. В модуле есть и другие функции для работы с окном (`set_title`, `minimize`, `toggle_full_screen`, ...) и меню (`set_application_menu`, `popup_menu`): [nsh/desktop](../modules/nsh-desktop.md).

<a id="files-and-folders"></a>

## Файлы и папки

На десктопах Rust-код показывает системные файловые диалоги и передаёт локальные пути системе, а каждый ответ ожидается в задаче: `pick_paths` с `OpenDialog` (`OpenDialog::files()`, `::folders()` или `::files_and_folders()`), `pick_save_path` с `SaveDialog`, `open_path` (приложение по умолчанию для файла), `reveal_path` (элемент, выделенный в Finder, File Explorer или файловом менеджере) и `move_to_trash` (куда делся элемент, если macOS сообщает об этом). Диалоги отвечают `Ok(None)`, когда пользователь отменяет выбор, и ошибкой, когда их невозможно показать (на Linux без портала выбора файлов, а также на iOS, Android и в вебе, где `open_path`, `reveal_path` и `move_to_trash` тоже отвечают ошибкой). Каждый запрос, завершившийся неудачей, отвечает своей ошибкой, а не `false`.

```rust
use nsh_core::{
    file_dialog::{FileFilter, OpenDialog},
    prelude::*,
};

fn open_notes() {
    let picked = pick_paths(
        OpenDialog::files()
            .multiple(true)
            .filter(FileFilter::new("Markdown", ["md", "markdown"]))
            .button_label("Open"),
    );
    spawn(async move {
        match picked.await {
            Ok(Some(paths)) => {
                for path in paths {
                    let _ = reveal_path(path).await;
                }
            }
            Ok(None) => {} // Cancelled.
            Err(error) => log::warn!("no file dialog: {error}"),
        }
    });
}
```

<a id="extending-a-rust-app-with-tsx"></a>

## Расширение Rust-приложения с помощью TSX

Функция крейта `#[native_module("app/native")]` называет то, что TSX может импортировать: компоненты (`registry.register::<Chart>()`), модули функций (`registry.module::<Portfolio>()`, `#[module]` на unit-структуре и её `impl`), классы (`registry.class::<Ledger>()`, `#[class]` на структуре и её `impl`) и ресурсы; атрибут также создаёт `pub fn registry()` в корне крейта, тот же набор для ваших тестов и другого Rust-кода (`my_app_native::registry()`, рядом с `nsh_base::registry()`). В `#[module]` или `#[class]` `impl` экспортируются `pub fn` (`pub(crate)` тоже); функции без указанной видимости являются вспомогательными и остаются в Rust. Их объявления для TypeScript, включая doc-комментарии, генерируются из типов Rust в `.nsh/types`, поэтому TSX проверяется по ним с помощью `nsh check` и вашего редактора:

```rust
/// A price chart.
#[derive(Clone, PartialEq, Props)]
pub struct ChartProps {
    /// The symbol to chart.
    pub symbol: Prop<SharedString>,
    /// The range shown.
    #[prop(default = SharedString::from("1D"))]
    pub range: Prop<SharedString>,
}

#[derive(Event)]
pub enum ChartEvent {
    /// A price was selected.
    #[args(price)]
    Select(f64),
}

/// A price chart; a press selects the last price.
#[component]
pub fn Chart(props: ChartProps, cx: Scope<ChartEvent>) -> impl IntoElement {
    view()
        .h(px(160.0))
        .bg(move || theme().muted)
        .on_press(move || cx.emit(ChartEvent::Select(101.5)))
        .child(text(move || format!("{} · {}", props.symbol.get(), props.range.get())))
}

/// A ledger kept in Rust.
#[class]
pub struct Ledger {
    entries: Vec<f64>,
}

#[class]
impl Ledger {
    /// An empty ledger.
    pub fn new() -> Self {
        Ledger { entries: Vec::new() }
    }

    /// Adds `amount`; the new balance.
    pub fn add(&mut self, amount: f64) -> f64 {
        self.entries.push(amount);
        self.balance()
    }

    /// The balance.
    #[getter]
    pub fn balance(&self) -> f64 {
        self.entries.iter().sum()
    }

    /// Uploads the entries; resolves when the server has them.
    pub async fn upload(this: Instance<Ledger>, url: String) -> Result<(), String> {
        let body = this.with(|l| format!("{:?}", l.entries));
        fetch(HttpRequest::post(url, body)).await.map(|_| ())
    }
}

/// The app's holdings.
#[module]
pub struct Portfolio;

#[module]
impl Portfolio {
    /// The value of the holdings.
    pub fn total() -> f64 {
        1250.0
    }
}
```

```tsx
import { mount, signal, View, Text } from "nsh";
import { Chart, Ledger, Portfolio } from "app/native";   // Rust

const ledger = new Ledger();   // its state lives in Rust

function Overview() {
  const balance = signal(ledger.add(Portfolio.total()));   // Rust, called at once
  return (
    <View class="gap-2 p-4">
      <Text>Balance: {balance()}</Text>
      <Chart symbol="NSH" range="1M" onSelect={(e) => balance.set(ledger.add(e.price))} />
      <View onPress={() => ledger.upload("https://example.com/ledger")} role="button" class="rounded-lg bg-blue-600 px-4 py-2 active:bg-blue-700">
        <Text class="text-white">Upload</Text>
      </View>
    </View>
  );
}

mount(() => <Overview />);
```

Каждый экспорт документируется в TypeScript doc-комментарием того элемента Rust, который его задаёт: компонент — своим `#[component] fn` (`Chart`), модуль и класс — своей структурой (`Portfolio`, `Ledger`), а свойства, события, функции и члены — собственными комментариями (сеттеру комментарий рядом с его геттером не нужен). Собственные doc-комментарии структуры `Props` и перечисления событий, а также блоков `impl` остаются в Rust; doc-комментарий на блоке `#[module]` или `#[class]` `impl` является ошибкой компиляции, поскольку TypeScript его не покажет. Каждая команда, которая записывает `.nsh/types`, предупреждает об экспорте, который видит TSX, но у которого нет doc-комментария, и называет его (`Ledger.add`, `Chart.range`).

TypeScript показывает doc-комментарий до первого заголовка. Заметки для тех, кто вызывает код из Rust, например что заимствует `&self` или почему функция принимает `cx`, помещаются под заголовком `# Rust` (или rustdoc-заголовками `# Panics`, `# Examples`) и остаются только в документации Rust:

```rust
/// Puts `text` on the clipboard; resolves with the number of characters copied.
///
/// # Rust
///
/// Taking `cx` makes it an op, run in order with the UI changes TS made before it.
pub fn copy(text: String, cx: &mut ModuleCx) -> u32 {
    let count = text.chars().count() as u32;
    cx.set_clipboard(text);
    count
}
```

Свойства — это поля структуры `Props` компонента, а события — варианты его перечисления `Event` (`onSelect`), и те и другие в camel case. Rust-код размещает тот же компонент через его конструктор, сеттер для каждого свойства и метод-слушатель для каждого события: `chart().symbol("NSH").range("1M").on_select(move |price: &f64| last.set(*price))`. Собственное содержимое, события и состояние компонента на Rust остаются в Rust; TSX передаёт свойства и слушает события. Свойство неверного типа (`level={1.5}` для свойства `u32`) вызывает предупреждение, как и у встроенного элемента: свойство сохраняет своё значение, а остальная часть компонента отрисовывается.

Функция или член выполняются так, как сказано в их сигнатуре на Rust. Та, что не является `async`, выполняется внутри вызова TSX и возвращает значение (`Portfolio.total()` — число, `ledger.balance` — свойство): она вычисляет и хранит состояние. `async fn` возвращает Promise и выполняется как задача с сервисами NSH (`fetch`, `timer`, диалоги). Функция модуля, принимающая `cx: &mut ModuleCx`, обращается к платформе по порядку вместе с UI (тост, строка состояния), и то же относится к методу ref компонента; то, что получит TSX, определяется возвращаемым типом: функция, возвращающая `()`, даёт `void`, без ответа (TSX вызывает её и идёт дальше); возвращающая `Result<(), E>` даёт `Promise<void>`, который отклоняется с сообщением `Err` (вызов выполняется вместе с изменениями UI, после того как вызов из TSX уже вернулся, поэтому ошибку несёт Promise; тот, который никто не ожидает и не перехватывает, попадает в лог как [необработанное отклонение](./dev-server-and-debugging.md#logs)); возвращающая значение даёт `Promise<T>`. Аргументы и результаты типизируются по сигнатуре: числа, строки, `Option`, `Vec`, ваши структуры `#[derive(JsObject)]` и перечисления `#[derive(PropEnum)]`, экземпляры ваших классов и функции TSX (`Callback<A, R>`, которые Rust вызывает сразу внутри вызова или позже с помощью `post` и `call_async`; TS видит `(value: number) => void` для `Callback<f64>`, а `#[args(balance)] listener: Callback<f64>` называет аргумент, `(balance: number) => void`). Функция, которая начинает слушать, называется `on(event, listener)` и возвращает `Stop` (`Stop::new(|| …)`), который TSX получает как функцию, останавливающую прослушивание (`() => void`); она выполняется один раз, когда её вызывает TSX или когда исчезает то, что вызвало `on` (компонент или запуск модуля при горячей перезагрузке). Обработчик события получает один объект: значение варианта лежит в его поле `value`, которое `#[args(price)]` на варианте называет (`onSelect({ price })`), а `#[args(open, reason)]` называет поля варианта с несколькими полями. Аргумент неверного типа бросает `TypeError` в вызове или отклоняет Promise той функции, которая его возвращает; `Err` бросает исключение (или отклоняет Promise) со своим сообщением. Объект класса владеет своим значением Rust: оно освобождается, когда объект собирается сборщиком мусора, или сразу при вызове `ledger.dispose()` (также `using ledger = new Ledger()`). Укажите точку входа TSX, чтобы запустить её, `nsh run App.tsx` или `nsh package App.tsx --target …`: правки TSX — это горячие обновления, правки Rust пересобирают и перезапускают приложение. CLI сам собирает и компилирует TSX, зная экспорты вашего крейта из его описания; хосты для разработки и headless-раннер `nsh test` собираются вместе с вашим крейтом и QuickJS.

`examples/rust-exports` в репозитории — это эталон экспорта: небольшое приложение на TSX, чей крейт экспортирует один компонент (обязательные свойства, свойства со значением по умолчанию и необязательные, событие, дочерние элементы), один модуль (по функции каждого вида) и один класс (конструктор, методы, геттер и сеттер, статический член, член `async`, другой экземпляр в качестве аргумента, обратный вызов, в который пишет Rust, `dispose()` и `using`), каждый с коротким doc-комментарием, а также тесты на Rust и на TypeScript (`App.test.tsx`), которые проходят через приложение и проверяют, что показывает каждый из них.

`examples/gallery-rs` в репозитории — это полноценное приложение на Rust: каждое демо написано на Rust, `nsh run examples/gallery-rs
--target web` (or `ios`, `android`, …) runs its root, `nsh test examples/gallery-rs` запускает его тесты в headless-режиме, а `cargo run -p gallery-native` запускает его на десктопном бэкенде.
<a id="render-functions-and-the-apps-classes"></a>

### Render-функции и классы приложения

Компонент рисует содержимое приложения для имеющихся у него значений (строку данных, блок кода документа) с помощью render-функции: пропа `Option<Renderer<T>>`, в TypeScript `(value: T) => JSX.Element`. Компонент вызывает `render(key, value)` там, где должно находиться содержимое, и получает view, которое стилизует и размещает как любое другое (внутри `text(..)`, инлайн-view). Содержимое сохраняется по ключу, пока значение остаётся равным, и рисуется заново при его изменении. Родитель на Rust передаёт замыкание в сеттер пропа (`quote().render_badge(|symbol| ..)`), который создаёт из него `Renderer`.

Стили в компоненте типизированы; Tailwind-классы приложения попадают в одну из его частей через проп классов и `.app_class(..)` на элементе этой части. Они применяются после собственных стилей элемента, с темой приложения, `dark:` и состояниями, как это делает `class` на элементе.

```rust
/// A quote: its symbol, then content of the app's.
#[derive(Clone, Copy, PartialEq, Props)]
pub struct QuoteProps {
    /// The symbol.
    pub symbol: Prop<SharedString>,
    /// Tailwind classes of the symbol's text.
    pub symbol_class: Prop<Option<SharedString>>,
    /// Content of the app's after the symbol (a change, a badge).
    pub render_badge: Prop<Option<Renderer<SharedString>>>,
}

/// A quote of a symbol.
#[component]
pub fn Quote(props: QuoteProps) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_2()
        .child(text(props.symbol).app_class(props.symbol_class))
        .child(dynamic(move || {
            props.render_badge.get().map(|r| r.render("badge", props.symbol.get()).flex_1())
        }))
}
```

```tsx
<Quote
  symbol="NSH"
  symbolClass="text-lg font-semibold"
  renderBadge={(symbol) => <Text class="text-green-600">{`${symbol} ▲ 2.4%`}</Text>}
/>
```

`TextView` в `nsh/base` устроен так: его `renderCodeBlock`, `renderMath`, ... — render-функции, а его `classes` — классы приложения по частям ([TextView](../elements/text-view.md)).

<a id="testing"></a>

## Тестирование

Тесты Rust-приложения запускают его в headless-режиме, в `cargo test` или в `nsh test`, с одним и тем же драйвером: на настоящем движке, без окна, с кадрами отображения на 60 Гц, поэтому таймеры, задачи и анимации работают так же, как на экране. Драйвер запускает приложение, хранит модель показываемых им view и выполняет шаги (`press`, `type_text`, `submit`, `scroll`, `wait_for`) над view, названными селекторами (текст, accessibility-метка или test id; `text:`, `label:`, `id:`); шаг, который невозможно выполнить, завершается ошибкой с текстами, находящимися на экране.

В `cargo test` `nsh_testing::Headless` (функции nsh-testing по умолчанию, без QuickJS) запускает корневой компонент (`app.screen()`: тексты на экране, отправленные им команды); `EngineConfig::new` — движок размером с телефон, в котором больше ничего не задано. `nsh test` запускает тесты на TypeScript ([Тестирование](./testing-and-trace.md)) в headless-раннере, собранном из ваших крейтов, где `open(".")` запускает корневой компонент Rust-приложения:

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```rust tabs
// tests/app.rs: cargo test
use nsh_engine::{EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
// App.test.tsx, next to nsh.json: nsh test
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open(".");
  await app.press("Tap");
  expect(app.texts()).toContain("Count: 1");
});
```

TSX-вход собирается с функцией `bundle` крейта `nsh-testing` так же, как его собирает `nsh run`, для наборов UI, которые обслуживают его хосты: набор NSH и `registry()` каждого крейта, который создаёт `#[native_module]`:

```toml
[dev-dependencies]
nsh-testing = { version = "0.1", features = ["bundle"] }
nsh-base = "0.1"
```

```rust
#[test]
fn the_module_formats_money() {
    let sets = vec![nsh_base::registry(), my_app_native::registry()];
    let mut app = nsh_testing::tsx("../App.tsx", sets).unwrap();
    app.wait_for("Formatted at once: $1,234.50").unwrap();
}
```

`nsh_testing::compile_tsx` собирает вход один раз для нескольких тестов, а `nsh_testing::start` передаёт пакеты тесту, который ведёт собственную модель экрана. `examples/rust-exports` тестирует свой TSX-вход таким образом; `examples/gallery-rs` тестирует свой корневой компонент на Rust из TypeScript, примерно по одному тестовому файлу на каждое демо.

<a id="theme"></a>

## Тема

Внешний вид приложения определяется самим приложением: NSH предоставляет примитивы и базовые компоненты без стилей из `nsh_base`, а ваш крейт — это стилизованный слой поверх них, собственная библиотека компонентов приложения ([Три слоя](./architecture.md#three-layers)). Компоненты Rust берут цвета, радиус скругления и шрифты из темы, `theme()` из `nsh_base`, поэтому один файл меняет стиль каждого компонента приложения. У каждого цвета есть светлое и тёмное значения; когда система переключает оформление, привязка вроде `.bg(move || theme().primary)` меняет цвет нативно, без рендера.

В теме содержатся дизайн-токены [shadcn/ui](https://ui.shadcn.com/docs/theming), а по умолчанию используется тема shadcn `neutral`, чёрно-белая палитра с радиусом скругления 10 pt. Чтобы использовать свою, задайте `"theme"` в `nsh.json` как путь к файлу темы относительно `nsh.json` или как содержимое темы прямо в строке:

```json
{
  "name": "My App",
  "rust": ".",
  "theme": "brand-theme.json"
}
```

Файл темы — это `cssVars` shadcn, формат тем и элементов реестра shadcn, поэтому тема, экспортированная из [тем shadcn](https://ui.shadcn.com/themes) или [tweakcn](https://tweakcn.com), работает как есть. `light` задаёт значения светлого оформления, `dark` — тёмного, а `theme` — обоих:

```json
{
  "cssVars": {
    "theme": {
      "radius": "0.5rem",
      "font-sans": "Inter, sans-serif"
    },
    "light": {
      "primary": "oklch(0.541 0.281 293.009)",
      "primary-foreground": "oklch(0.969 0.016 293.756)",
      "ring": "var(--primary)",
      "up": "#16a34a"
    },
    "dark": {
      "primary": "oklch(0.702 0.183 293.541)",
      "primary-foreground": "oklch(0.283 0.141 291.089)",
      "up": "#4ade80"
    }
  }
}
```

- Ваша тема применяется поверх темы по умолчанию, поэтому перечислять нужно только то, что вы меняете. Значение, которое задаёт `light` и пропускает `dark`, используется в обоих оформлениях.
- Значения записываются как в CSS. Цвета — любой цвет CSS (`#7c3aed`, `rgb(…)`, `hsl(…)`, `oklch(…)`, `white`), `color-mix(in oklab, var(--primary) 80%, white)` или другой токен того же оформления, `var(--primary)` (с запасным значением: `var(--brand, #7c3aed)`). Длины — `rem` (16 пунктов) или `px` (пункты). Шрифты — списки семейств шрифтов: используется первое семейство, не являющееся общим, а если первое семейство общее (`system-ui`, `sans-serif`), то это системный шрифт.
- **Ваши собственные токены.** Любое другое имя — это токен приложения, как переменная в `@theme` Tailwind: `"up"` выше в Rust — это `theme().color("up")`, в классах — `bg-up` / `text-up/70`, а в TSX — `token("up")` ([Токены темы](./tailwind.md#theme-tokens)). Число вроде `"radius-card": "14px"` — это `theme().number("radius-card")` и `rounded-(--radius-card)`.
- Сборщик проверяет тему при сборке: отсутствующий файл, некорректный JSON или тема, отличная от `cssVars`, приводят к сбою сборки с ошибкой `nsh.json: theme: …`.

Токены с их значениями по умолчанию для светлого и тёмного оформления (`neutral` из shadcn):

| Токен | `theme()` | Светлое | Тёмное | Роль |
|---|---|---|---|---|
| `background` / `foreground` | `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` | Фон приложения и текст на нём |
| `card` / `card-foreground` | `card` / `card_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Карточки и сгруппированные поверхности и текст на них |
| `popover` / `popover-foreground` | `popover` / `popover_foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | Popover-ы, меню и подсказки и текст на них |
| `primary` / `primary-foreground` | `primary` / `primary_foreground` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` | `oklch(0.922 0 0)` / `oklch(0.205 0 0)` | Главное действие (основная кнопка) и текст на ней |
| `secondary` / `secondary-foreground` | `secondary` / `secondary_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Вторичные действия и текст на них |
| `muted` / `muted-foreground` | `muted` / `muted_foreground` | `oklch(0.97 0 0)` / `oklch(0.556 0 0)` | `oklch(0.269 0 0)` / `oklch(0.708 0 0)` | Приглушённые поверхности; вторичный текст: подписи, метки, плейсхолдеры |
| `accent` / `accent-foreground` | `accent` / `accent_foreground` | `oklch(0.97 0 0)` / `oklch(0.205 0 0)` | `oklch(0.269 0 0)` / `oklch(0.985 0 0)` | Элемент под курсором или выделенный, например пункт меню или строка списка, и его текст |
| `destructive` | `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Деструктивные действия и ошибки |
| `border` | `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Разделители и границы |
| `input` | `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Граница полей ввода |
| `ring` | `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Кольца фокуса |
| `chart-1` … `chart-5` | `chart_1` … `chart_5` | `oklch(0.87 0 0)` … `oklch(0.269 0 0)` | то же | Ряды диаграммы |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring` | `sidebar`, `sidebar_foreground`, ... | `sidebar` `oklch(0.985 0 0)`, `sidebar-primary` `oklch(0.205 0 0)` | `sidebar` `oklch(0.205 0 0)`, `sidebar-primary` `oklch(0.488 0.243 264.376)` | Поверхность боковой панели, её главное действие, её выделенный элемент, границы и кольцо фокуса |
| `radius` | `radius` | `0.625rem` (10 pt) | | Радиус скругления |
| `font-sans` | `font_sans` | системный шрифт | | Шрифт приложения: любой текст, для которого не задано собственное семейство |
| `font-mono` | `font_mono` | системный моноширинный шрифт | | Моноширинный шрифт: `font-mono`, код в `TextView` |

<a id="several-crates"></a>

## Несколько крейтов

Rust-код приложения можно разделить на крейты, каждый из которых импортируется по собственному спецификатору: `"rust"` принимает список путей к крейтам, и у каждого крейта в нём есть собственная функция `#[native_module]`.

```json
{
  "rust": ["native/charts", "native/storage"],
  "root": "App"
}
```

```tsx
import { Chart } from "app/charts";        // native/charts: #[native_module("app/charts")]
import { Store } from "app/storage";       // native/storage: #[native_module("app/storage")]
```

Каждый раннер и хост линкует их все, а `.nsh/types` объявляет каждый спецификатор. Крейты делятся кодом через path-зависимости Cargo (`shared = { path = "../shared" }`): крейт с компонентами компании может использоваться несколькими крейтами и подключаться несколькими приложениями, а в TSX экспортируются только крейты, перечисленные в `"rust"`. У каждого перечисленного крейта есть собственные имя пакета и спецификатор; `nsh` сообщает о повторяющемся, указывая два пути, которые его используют. `"root"` Rust-приложения — это компонент первого перечисленного крейта. Во время `nsh run` и `nsh dev` изменение любого из них или крейта, от которого они зависят по пути, пересобирает приложение и перезапускает его.

<a id="browser-apis-on-the-web"></a>

## API браузера в вебе

В вебе крейт может вызывать API браузера (WebSocket, `IndexedDB`, …) через wasm-bindgen и `web-sys`; `nsh` собирает необходимую им связующую прослойку вместе с рантаймом. См. [Web](./web.md#browser-apis-from-rust).

<a id="see-also"></a>

## См. также

- [Структура проекта](./project-structure.md): каждый ключ `nsh.json`.
- [Web](./web.md#apps-with-rust-components): Rust-приложения в браузере.
- [Сеть](./networking.md#from-rust-components): `fetch` из Rust.
- [CLI](./cli.md#nsh-init): `nsh init --template rust` и `--template mixed`.
