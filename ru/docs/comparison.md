---
title: "Сравнение подходов"
description: "Как Native Shell соотносится с React Native, Flutter, Qt, GPUI и Slint, с Electron и Tauri, а также с веб-представлениями и серверно-управляемым UI для интерфейса, доставляемого после релиза."
order: 2
group: start
source_hash: 80f11e255cf3463f
---

# Сравнение подходов

NSH — это фреймворк для полноценных приложений на iOS, Android, macOS, Windows, Linux и в вебе, а также среда выполнения для UI, который доставляется в приложения после релиза. На этой странице NSH сначала сравнивается с кроссплатформенными фреймворками, на которых пишут приложения, а затем со способами, которыми приложения получают UI, не входивший в их поставку. Зелёный означает, что возможность доступна; жёлтый — что она требует больше собственной работы приложения или отдельного проекта; красный — что она не предоставляется. Отметки описывают доступность, а не производительность. Версии — это документированные минимумы каждого фреймворка на момент написания: проверяйте их для используемого релиза.

Легенда: <span class="status status--yes" role="img" aria-label="Да"></span> Да · <span class="status status--partial" role="img" aria-label="Частично"></span> Частично · <span class="status status--no" role="img" aria-label="Нет"></span> Нет.

<a id="cross-platform-frameworks"></a>

## Кроссплатформенные фреймворки

| Возможность | NSH | React Native | Flutter | Qt 6 | GPUI | GPUI Fast | Slint |
|---|---|---|---|---|---|---|---|
| Чем рисуется | UI платформы | Представления платформы | Собственный движок | Граф сцены | Собственный, GPU | Собственный, GPU | Собственный рендерер |
| Модель UI | Retained | Retained | Retained | Retained | Immediate | Immediate + retained | Реактивная, retained |
| Язык | Rust, TSX | JS, TS | Dart | C++, QML | Rust | Rust | Slint + Rust, C++ |
| iOS | <span class="status status--yes" role="img" aria-label="Да"></span> 15+ | <span class="status status--yes" role="img" aria-label="Да"></span> 15.1+ | <span class="status status--yes" role="img" aria-label="Да"></span> 15+ | <span class="status status--yes" role="img" aria-label="Да"></span> 17+ | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> Rust |
| Android | <span class="status status--yes" role="img" aria-label="Да"></span> 9+ | <span class="status status--yes" role="img" aria-label="Да"></span> 7+ | <span class="status status--yes" role="img" aria-label="Да"></span> 7+ | <span class="status status--yes" role="img" aria-label="Да"></span> 9+ | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> |
| macOS | <span class="status status--yes" role="img" aria-label="Да"></span> 14+ | <span class="status status--partial" role="img" aria-label="Частично"></span> Отдельно | <span class="status status--yes" role="img" aria-label="Да"></span> 12+ | <span class="status status--yes" role="img" aria-label="Да"></span> 13+ | <span class="status status--yes" role="img" aria-label="Да"></span> 12+ | <span class="status status--yes" role="img" aria-label="Да"></span> 12+ | <span class="status status--yes" role="img" aria-label="Да"></span> 13+ |
| Windows | <span class="status status--yes" role="img" aria-label="Да"></span> 10 1809+ | <span class="status status--partial" role="img" aria-label="Частично"></span> Отдельно | <span class="status status--yes" role="img" aria-label="Да"></span> 10+ | <span class="status status--yes" role="img" aria-label="Да"></span> 10 1809+ | <span class="status status--yes" role="img" aria-label="Да"></span> 10+ | <span class="status status--yes" role="img" aria-label="Да"></span> 10+ | <span class="status status--yes" role="img" aria-label="Да"></span> 10+ |
| Linux | <span class="status status--yes" role="img" aria-label="Да"></span> GTK 4.14+ | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> Debian 10+ | <span class="status status--yes" role="img" aria-label="Да"></span> Debian 11+ | <span class="status status--yes" role="img" aria-label="Да"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Да"></span> Vulkan | <span class="status status--yes" role="img" aria-label="Да"></span> |
| Веб | <span class="status status--yes" role="img" aria-label="Да"></span> HTML | <span class="status status--partial" role="img" aria-label="Частично"></span> Библиотека | <span class="status status--yes" role="img" aria-label="Да"></span> Canvas | <span class="status status--yes" role="img" aria-label="Да"></span> Canvas | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> Canvas |
| Системный текст | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> |
| UX под устройство | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> |
| Без среды выполнения JS | <span class="status status--yes" role="img" aria-label="Да"></span> Rust-приложения | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> C++ | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> |
| Подписанная доставка | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> OTA | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> QML | <span class="status status--partial" role="img" aria-label="Частично"></span> Shell | <span class="status status--partial" role="img" aria-label="Частично"></span> Shell | <span class="status status--no" role="img" aria-label="Нет"></span> |
| Лицензия | Apache-2.0 | MIT | BSD-3-Clause | LGPL, GPL, коммерческая | Apache-2.0 | Apache-2.0 | GPL, коммерческая |

Immediate-режим заново строит описание UI в каждом кадре; retained-режим хранит его и обновляет только то, что изменилось. GPUI Fast сочетает оба режима поверх GPUI и работает там, где работает GPUI. «Shell» — это [GPUI Shell](https://gpui-kit.com/shell).

NSH — единственный из перечисленных фреймворков, который объединяет всё это: собственный UI и собственный ввод текста каждой платформы; телефоны, десктопы и веб из одного приложения (веб — в виде HTML); Rust-приложения без среды выполнения JavaScript; подписанный UI в песочнице, доставляемый после релиза.

<a id="what-the-rows-mean"></a>

### Что означают строки

- **Чем рисуется, модель UI.** NSH монтирует собственные представления каждой платформы и сохраняет их (retained-режим): изменение обновляет только затронутые представления. React Native тоже монтирует представления платформы — на iOS и Android. Flutter, Qt Quick, GPUI и Slint рисуют собственными рендерерами; GPUI строит дерево элементов в каждом кадре (immediate-режим), а [GPUI Fast](https://github.com/longbridge/gpui-fast) повторно использует то, что не изменилось.
- **Платформы.** Минимумы NSH собственные ([Platforms](./platforms.md)). Остальные взяты из [React Native 0.76](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture) (iOS 15.1, Android 7 / API 24; macOS и Windows — через отдельные проекты react-native-macos и react-native-windows, веб — через библиотеку react-native-web), [Flutter 3.47](https://docs.flutter.dev/reference/supported-platforms), [Qt 6.10](https://doc.qt.io/qt-6.10/supported-platforms.html), [требований Zed](https://zed.dev/docs/installation) для GPUI и [руководств Slint по платформам](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/general/) (iOS — из Rust). «Canvas» означает, что фреймворк рисует в canvas на странице; веб-приложения NSH — это HTML-элементы со стилями CSS, которые браузер сам прокручивает, выделяет и редактирует ([Web](./web.md)).
- **Системный текст.** Текстовые поля NSH — это редакторы платформы: `UITextView`, `EditText`, `NSTextView`, `TextView` в GTK, редакторы браузера, — с системными методами ввода, маркерами выделения и меню редактирования; в Windows собственный редактор NSH работает с DirectWrite и системными методами ввода (IMM32). React Native тоже использует текстовые поля платформы. Фреймворки с самостоятельной отрисовкой реализуют редактирование текста сами и подключают его к системным методам ввода.
- **UX под устройство.** Базовые компоненты NSH следуют устройству: один и тот же `Menu` — это всплывающее окно у элемента-триггера при использовании указателя и панель снизу на телефоне, а `ContextMenu` открывается по правому клику или долгому нажатию пальцем. В остальных фреймворках адаптация взаимодействия под устройство в основном остаётся работой самого приложения.
- **Без среды выполнения JS.** Раннеры Rust-приложения не подключают движок JavaScript ни на одной платформе; TSX — второй путь, на том же движке. QML в Qt Quick работает на JavaScript-движке Qt; Qt Widgets на C++ — нет.
- **Подписанная доставка.** NSH проверяет подписанные пакеты `.nshpkg` по доверенным ключам и списку отзыва и запускает каждый в виртуальной машине с ограничениями и возможностями, которые предоставляет хост ([Signed packages](./signed-packages.md), [Sandbox and capabilities](./sandbox-and-capabilities.md)). Обновления React Native «по воздуху» доставляют доверенный код приложения; Qt умеет загружать файлы QML; приложения GPUI принимают модули JavaScript через [GPUI Shell](https://gpui-kit.com/shell).

<a id="what-sets-nsh-apart"></a>

### Чем NSH отличается

- **Нативность на каждой платформе, в обоих смыслах.** Каждый бэкенд построен на собственных представлениях, тексте и методах ввода своей платформы — UIKit, представления Android, AppKit, Win32 с Direct2D, GTK 4, HTML, — а вместе с ними приходит и взаимодействие, принятое на платформе. Выделение текста, методы ввода и доступность — системные, и всё, что новый выпуск ОС приносит в них, доходит до приложения ([Introduction](./index.md#what-native-means)).
- **Телефоны, десктопы и веб из одного приложения.** Шесть платформ — это бэкенды одного фреймворка, с раскладками, которые перестраиваются, и вводом, который следует устройству; в вебе приложение — это HTML, публикуемый как статический сайт.
- **Сначала Rust, без среды выполнения JavaScript.** Приложение целиком может быть на Rust от начала до конца, скомпилированное в нативный код, с типами, потоками и крейтами Rust. TSX — второй путь, на том же движке, для быстро пишущихся экранов ([Building with Rust](./rust.md)).
- **Retained-представления для повседневных приложений.** Чаты, формы, списки и документы в покое почти не потребляют ресурсов, потому что изменение отправляет только затронутые представления ([Introduction](./index.md#retained-views)).
- **UI, доставляемый после релиза, подписанный и в песочнице.** Приложения, созданные на NSH, — а также нативные приложения, написанные штатными инструментами каждой платформы, — получают модули TSX во время выполнения; их пишет команда или генерирует ИИ ([Dynamic UI](./index.md#dynamic-ui-and-ai-generated-ui)).
- **Один набор инструментов — для людей и агентов.** Один исполняемый файл `nsh` создаёт, запускает, тестирует на реальных платформах, упаковывает и подписывает приложения для всех целей.

### React Native

React Native ближе всего по замыслу: оба сокращают дублирование клиентской работы и используют представления платформы. В центре React Native — JavaScript или TypeScript с React и его экосистемой пакетов, на iOS и Android, а поддержка десктопов вынесена в отдельные проекты. В центре NSH — Rust: его среда выполнения, рендерер и модули написаны на Rust, Rust сам является языком приложений, а TSX — один из двух путей; шесть платформ, включая десктопы и веб, — это бэкенды одного и того же фреймворка.

### Flutter

Flutter рисует каждый пиксель собственным движком, поэтому приложение выглядит одинаково на всех платформах. NSH идёт другим путём: он использует представления, текст и ввод текста каждой платформы, а в вебе — HTML-элементы и собственные прокрутку, выделение и ввод браузера. Редактирование текста, методы ввода и выделение принадлежат платформе и не реализуются заново для каждой из них.
### Qt

Qt — зрелый тулкит с двумя UI-технологиями, Qt Widgets и Qt Quick, а также с давними инструментами и поддержкой платформ. NSH отличается основой и моделью: Rust как основной язык с путём через TSX, набор инструментов, рассчитанный на автоматизированную (в том числе управляемую ИИ) разработку, веб, отображаемый как HTML, и взаимодействие на мобильных устройствах, десктопе и в вебе, адаптированное внутри одной модели компонентов.

<a id="gpui-and-gpui-fast"></a>

### GPUI и GPUI Fast

[GPUI](https://gpui-kit.com) — UI-фреймворк на Rust, который рисует с помощью GPU и создан для требовательных десктопных приложений; [GPUI Fast](https://github.com/longbridge/gpui-fast) — форк от Longbridge с retained-рендерингом: он повторно использует неизменённые представления, раскладку и измерения текста, а также слои прокрутки и нативную композицию окон. NSH, напротив, строится на представлениях каждой платформы, поэтому ввод текста, выделение, методы ввода и системное взаимодействие — родные для платформы, а кроме того, NSH охватывает телефоны и веб; бэкенд NSH для GPUI встраивает приложения NSH в приложения на GPUI и GPUI Kit ([GPUI](./gpui.md)).

Они подходят для разных нагрузок. В [тесте производительности NSH](https://github.com/longbridge/nsh-perf-bench) (Linux, таблица котировок из 500 строк, NSH на бэкенде GTK 4) обычные нагрузки обходятся одинаково: при 1000 котировок в секунду NSH Rust использует 18% ядра, а GPUI Fast — 20%. При длительных плотных обновлениях GPUI Fast впереди: при 20 000 котировок в секунду он использует 25% ядра, тогда как NSH — 73–78%, а покадровая анимация 1000 блоков обходится ему примерно в треть от нагрузки NSH на CPU.

### Slint

Slint — декларативный UI-тулкит со своим языком и лёгкими рендерерами для десктопов и встраиваемых устройств, используемый из Rust, C++, JavaScript или Python. Оба ценят нативную производительность; путь NSH — собственный UI и взаимодействие каждой платформы, HTML в вебе, Rust и TSX как языки приложений и разработка с помощью ИИ на шести платформах.

<a id="electron-and-tauri"></a>

### Electron и Tauri

Electron включает в поставку Chromium, а Tauri использует системный web view: оба создают десктопные приложения (а Tauri — и мобильные) из веб-контента, с текстом и вводом браузера. NSH же строит собственные представления каждой платформы и отображает HTML только в самом вебе.

<a id="ui-delivered-after-release"></a>

## UI, доставляемый после релиза

У приложения, которому нужен UI, не поставлявшийся вместе с ним, — ответы, сгенерированные моделью, функции от партнёров или других команд, экраны, меняющиеся без релиза, — есть несколько устоявшихся вариантов, как на телефонах, так и на десктопах. Они различаются тем, что рисует UI, что может делать доставляемый код и насколько сильно нужно изменить приложение, чтобы его принять.

| Возможность | NSH | Web view | Server-driven UI | Мини-программы | OTA-обновления |
|---|---|---|---|---|---|
| Кто рисует | UI платформы | Движок браузера | Представления приложения | Веб-движок + слой | Рендерер фреймворка |
| Нативный внешний вид и поведение | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> |
| Собственное состояние, логика и раскладка | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> |
| Нативные компоненты хоста | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> Мост | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--yes" role="img" aria-label="Да"></span> |
| Песочница, настраиваемая хостом | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> Same-origin | <span class="status status--yes" role="img" aria-label="Да"></span> Схема | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> |
| Подписанные пакеты с возможностью отзыва | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> |
| Подходит для UI, сгенерированного ИИ | <span class="status status--yes" role="img" aria-label="Да"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> Веб-страницы | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--partial" role="img" aria-label="Частично"></span> | <span class="status status--no" role="img" aria-label="Нет"></span> |
| Цена для приложения-хоста | Одно представление и библиотека | Движок браузера на каждое представление | Рендерер на каждый компонент | SDK контейнера | Всё приложение внутри фреймворка |

- **Web view (H5).** Страница в движке браузера: всё, что можно выразить в HTML, с внешним видом браузера и написанным вручную мостом к нативному коду.
- **Server-driven UI.** JSON, который заново комбинирует компоненты и действия, уже поставляемые с приложением: его легко генерировать, но у него нет локального состояния и логики сверх того, что даёт схема.
- **Контейнеры мини-программ.** Специфичный для платформы фреймворк и API поверх веб-движка внутри большого SDK контейнера.
- **Обновления по воздуху** (например, React Native с сервисом code-push). Весь фреймворк целиком, но обновления — это доверенный код приложения, и само приложение должно быть написано на этом фреймворке.
- **NSH.** Модуль на TSX со своим состоянием, логикой, анимацией и раскладкой, отображаемый средствами UI самой платформы и способный использовать зарегистрированные хостом нативные представления. Он приходит как подписанный пакет, который приложение проверяет, работает в собственной VM с ограничениями на память, время вызова и число узлов и получает доступ только к тем сетевым хостам, веб-страницам и системным настройкам, которые разрешил хост ([Песочница и возможности](./sandbox-and-capabilities.md)). Хост добавляет одно представление в том месте, где появляется модуль ([Платформы](./platforms.md#embed-in-a-native-app)), а один и тот же бандл работает на всех платформах. Именно поэтому NSH существует наряду с [GPUI Shell](./index.md#native-shell-and-gpui-shell).

<a id="when-another-option-fits-better"></a>

## Когда лучше подойдёт другой вариант

- Экран определяется длительными плотными обновлениями тысяч представлений — терминал рыночных данных, получающий десятки тысяч котировок в секунду, или пользовательская визуализация, перерисовываемая каждый кадр: retained-рендеринг GPUI Fast на GPU использует лишь долю CPU (см. [GPUI и GPUI Fast](#gpui-and-gpui-fast)).
- Приложение должно выглядеть пиксель в пиксель одинаково на каждой платформе: фреймворк, который рисует всё сам, например Flutter или Slint, обеспечивает это по своей конструкции.
- Вам уже сегодня нужна большая экосистема сторонних пакетов: у React Native, Flutter и Qt она копилась годами.
- UI — это документ или существующая веб-страница: web view покажет её как есть.
- Набор экранов фиксирован и невелик, а меняются только содержимое и порядок: server-driven UI вообще не требует рантайма.

<a id="see-also"></a>

## См. также

- [Введение](./index.md): что такое NSH и что в нём значит «нативный».
- [Архитектура](./architecture.md): что и где выполняется внутри NSH.
- [Производительность](./performance.md): правила, которым следует NSH, и как измерять приложение.
