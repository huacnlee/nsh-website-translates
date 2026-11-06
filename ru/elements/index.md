---
title: "Элементы"
description: "Примитивы и базовые компоненты, из которых строится любое приложение NSH, в Rust и TSX, а также свойства, события и методы ref, общие для всех них."
order: 1
source_hash: 84e4cb96ec250ab2
---

# Элементы

Native Shell строит каждый экран из небольшого набора элементов: примитивов, таких как `View`, `Text` и `Image`, и базовых
компонентов, таких как `Button`, `Dialog` и `NavStack`. Каждый примитив — это нативное представление (подкласс UIView на iOS и Mac
Catalyst, Android `View`, представление AppKit, GTK или Win32 на десктопах), которое создаёт и раскладывает среда выполнения NSH.
Всё, что показывает приложение, состоит из них: кнопки, карточки, строки и экраны приложения — это его собственные компоненты, нарисованные
этими элементами и оформленные самим приложением, так что внешний вид приложения полностью принадлежит ему.

Каждый пример на этих страницах приведён на Rust и TSX: выберите вкладку, и все примеры на странице переключатся следом.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

В Rust примитивы — это функции `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`), а базовые
компоненты поставляются крейтом `nsh_base`. Стили — это типизированные методы (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`,
`.bg(..)`), стили состояний принимают замыкание (`.active(|s| s.opacity(0.6))`), обработчики — это замыкания, получающие своё событие
(`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`), а `.child(..)` добавляет дочерние элементы. Фрагмент UI — это обычная функция, возвращающая
`impl IntoElement`; она выполняется один раз, а сигналы, которые она читает в замыканиях (`text(move || ..)`, `.bg(move || ..)`), обновляют то,
с чем связаны. См. [Сборка на Rust](../docs/rust.md).

В TSX каждый тег пишется в PascalCase и называет привязку в области видимости: примитивы приходят из `nsh`, базовые компоненты — из
`nsh/base`. Только `<If>` и `<Each>` являются глобальными и не требуют импорта. Тег в нижнем регистре, например `<view>`, — это ошибка сборки,
потому что TypeScript проверял бы его по одному глобальному типу на имя, а обобщённые компоненты, такие как `List` и `Each`,
не смогли бы вывести типы своих элементов. Компилятор распознаёт элементы по их импортам и создаёт нативные
представления на месте, поэтому импорт ничего не стоит во время выполнения. См. [JSX и компоненты](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## Примитивы

Импортируются из `nsh` в TSX, из `nsh_core::prelude` в Rust.

| Элемент | Rust | Нативное представление (iOS / Android) | Страница |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; с `selectable` тексты внутри него выделяются вместе | [View](./view.md), [Выделение текста](./text-selection.md) |
| `<Text>` | `text(content)` | представление CoreText / представление StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | представление со слоем изображения / image view | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView с переиспользуемыми ячейками | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | представление, воспроизводящее 2D-рисунок | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | представление, в области которого программа на WGSL рисует на GPU, под его дочерними элементами | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer на TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | представление поверх окна (или диалога, в котором оно находится), размещаемое относительно якоря | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | управление потоком: элементы, которые они выбирают | [Управление потоком](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | панель над клавиатурой на iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Отступы padding и margin удерживают содержимое вне системного UI с помощью `env()` из CSS: `env(safe-area-inset-top)` и остальные края ([Безопасная область](./safe-area.md)) и `env(keyboard-inset-height)` ([Клавиатура](./keyboard.md)).

<a id="base"></a>

## Базовые компоненты

Импортируются из `nsh/base` в TSX, из крейта `nsh_base` в Rust. Они отвечают за поведение, состояние, фокус и доступность,
а внешний вид берут из приложения.

| Компонент | Rust | Что делает | Страница |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | Системный алерт и action sheet | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` и его части | `nsh_base::accordion()`, `accordion_item()`, ... | Стопка секций, которые раскрываются и сворачиваются под своими заголовками, по одной или по нескольку | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | Изображение человека или запасной вариант на время загрузки или при ошибке, и ряд таких изображений, показывающий первые несколько | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Нажимаемый элемент управления со своими состояниями и ролью | [Button](./button.md) |
| `<Carousel>` и его части | `nsh_base::carousel()`, `carousel_content()`, ... | Слайды, показываемые по одному, с нативным пролистыванием, кнопками «назад» / «вперёд», пагинацией, клавишами и бесшовным циклом | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Элемент управления в состоянии «отмечен», «не отмечен» или «неопределённое» с индикатором | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Область, содержимое которой раскрывается и сворачивается | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Палитра команд: поле поиска над командами с нативной фильтрацией, виртуализированный список, клавиши палитры Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Таблица из любого числа строк и столбцов с выделением, сортировкой, изменяемыми по размеру и перемещаемыми столбцами | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Показывает свои дочерние элементы поверх всего остального | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | Изменения между двумя текстами или в патче, в разделённом или объединённом виде | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Рабочая область из разделителей, групп вкладок и панелей по краям, которую пользователь компонует сам | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Редактор кода с подсветкой, несколькими курсорами, сворачиванием и поиском | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Предпросмотр того, на что указывает триггер, пока на нём находится указатель | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | Нативное поле ввода текста (UITextField или UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Нажимаемая цель, открывающая страницу, сайт или маршрут приложения | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Меню: всплывающие окна с каскадными подменю на десктопах, листы на телефонах | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Нативная навигация: стек страниц с заголовком платформы и жестами возврата | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Число, вводимое в поле или изменяемое шагами кнопками и клавишами | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Одноразовый код с фиксированным числом цифр, вводимый, вставляемый или автоматически подставляемый в ячейки | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | Страницы набора: «Назад», страницы вокруг текущей, многоточия и «Вперёд» | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Элементы, содержащие элементы, с раскрытием и сворачиванием и одним выбранным: виртуализированное, одна остановка фокуса клавиатуры | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | Рамка диаграммы и её метки, рисуемые нативно по строкам данных приложения | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | Содержимое, привязанное к триггеру, поверх всего | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Индикатор выполнения: насколько продвинута задача или что она выполняется | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Один вариант из набора, из которого пользователь выбирает один, и сам набор | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Панели рядом или друг над другом с ручками для изменения их размера | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Полоса прокрутки с собственным видом приложения для scroll view или списка | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Одно значение, выбранное из списка элементов, с клавиатурой, поиском и секциями | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Панель у края экрана над подложкой | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Значение или диапазон из двух значений, выбираемые вдоль трека | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Переключатель «вкл / выкл» с треком и бегунком | [Switch](./switch.md) |
| `<Table>` и его части | `nsh_base::table()`, `table_row()`, ... | Таблица из собственных строк и ячеек приложения с ролями таблицы | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Одна вкладка списка вкладок и сам список | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Показывает документ Markdown или HTML с помощью текстов и представлений | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | Семантический корень тоста; тосты, выложенные слоями от края | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Кнопка, которая включена или выключена, и панель таких кнопок | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Панель кнопок, переключателей и ссылок, одна остановка фокуса клавиатуры | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Подсказка рядом с триггером при наведении или удерживаемом пальце | [Tooltip](./tooltip.md) |

> [!NOTE]
> Строка рисуется только внутри `Text`. Строка в качестве дочернего элемента `View` не создаёт нативного представления и не участвует в
> раскладке.

<a id="common-props"></a>

## Общие свойства

Каждый примитив принимает перечисленные ниже свойства (тип `CommonProps` в TSX; трейты `Styled`, `Interactive` и `Accessible`
в Rust). На страницах элементов перечислены только их собственные свойства. В столбце Rust указан метод построителя.

<a id="styling"></a>

### Стилизация

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `style` | типизированные методы `Styled`; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` для `<Text>` и `<Input>`, `ImageStyle` для `<Image>`) | Встроенный стиль или массив стилей, объединяемых слева направо (ложные элементы пропускаются; массивы могут быть вложенными, поэтому `style={[base, props.style]}` принимает `props.style`, который сам является массивом). Приоритетнее `class`. См. [справочник по стилям](../modules/style-reference.md). |
| `class` | типизированные методы `Styled` (`.flex_row().gap_2().p_4()`) | `string` | Классы Tailwind, разрешаемые нативно (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Более поздние классы приоритетнее более ранних. См. [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Классы, применяемые, пока их значение истинно (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Игнорирует нажатия (без обратной связи на нажатие), применяет стили `disabled:`, отключает элементы управления, такие как поля ввода, а программы чтения с экрана сообщают, что элемент отключён (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### Нажатия и обратная связь

Обработка нажатий выполняется нативно: платформа распознаёт нажатие и применяет стили нажатия приложения, а код
приложения узнаёт о нём только потом. Отвечает только самое внутреннее нажимаемое представление; внутри scroll view начало нажатия ждёт около
130 мс, чтобы сначала могла начаться прокрутка.

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Касание завершилось внутри представления. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | Палец оставался прижатым в течение `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Палец коснулся представления. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | Палец был поднят или ушёл с представления. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Миллисекунды до того, как нажатие становится долгим. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Расширяет область касания за пределы границ, в пунктах. |

`PressEvent` — это `{ position, pagePosition, modifiers, clickCount }`: где был указатель в представлении и в его корневом
представлении (`Point`), модификаторы, удерживаемые в момент начала нажатия, и число последовательных кликов (2 для двойного клика). Если
платформа не сообщает об указателе, это начало координат представления без клавиш и с одним кликом.

Ключ стиля `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` в Rust, классы `pointer-events-*`)
определяет, какие касания получают представление и представления в нём: `"none"` — никто (представление внутри, задающее `"auto"`, снова получает
их), `"box-none"` — только представления внутри него, `"box-only"` — только само представление
([касания и жесты](../docs/touch-and-gestures.md#pointerevents)).

Обратная связь на нажатие определяется приложением: `activeStyle` (или классы `active:`, `.active(..)` в Rust) применяется, пока представление
нажато, нативно, без обращения к коду приложения (см. ниже).

<a id="state-styles"></a>

### Стили состояний

Стили, которые применяются, пока представление находится в некотором состоянии, поверх его собственных стилей, нативно. Каждый из них — объектная форма варианта Tailwind.
Более поздние состояния приоритетнее (selected, checked и indeterminate, затем hover, focus, active); `disabledStyle` приоритетнее всех, а остальные не
применяются, пока представление отключено. Каждый принимает собственный стиль элемента: `TextStyle` на `<Text>`, `InputStyle` на
`<Input>`, `ImageStyle` на `<Image>`, `ViewStyle` в остальных случаях.

| Свойство | Rust | Вариант класса | Применяется |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Пока нажато. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Пока над представлением находится указатель. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Пока представление имеет фокус. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Пока фокус имеет представление или представление внутри него (содержимое `Overlay` считается находящимся внутри представления, в котором оно находится). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Пока `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Пока `accessibilityState.checked` равно `true` (чекбокс, переключатель, радиокнопка; `"mixed"` не отмечено). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Пока `accessibilityState.checked` равно `"mixed"` (чекбокс, который не отмечен и не снят). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Пока `accessibilityState.selected` равно `true` (выбранный `Button`, вкладка). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Пока `accessibilityState.expanded` равно `true` (триггер `Popover` или `Menu`, пока его всплывающее окно открыто). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Пока `accessibilityState.pressed` равно `true` (кнопка-переключатель во включённом состоянии; `"mixed"` не нажато). Не `activeStyle`, то есть не идущее нажатие. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
<a id="hover"></a>

### Hover (наведение)

Приложение слышит, как мышь заходит на представление, движется над ним и уходит с него: на macOS, Windows, Linux, в бэкенде GPUI и в настольных браузерах, с указателем iPad или мышью Mac на iOS, а также с мышью или стилусом на Android. Стили наведения (`hover:`, `.hover(..)`) оформляют представления под курсором в тех же местах.

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | Мышь зашла на представление или на вложенное в него (`mouseenter` в DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | Мышь двигалась над представлением (или над вложенным в него), с нажатой кнопкой или без неё, либо клавиша-модификатор была нажата или отпущена, пока мышь покоится над ним без нажатых кнопок (`mousemove` в DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | Мышь покинула представление и вложенные в него представления или окно; `e` — последняя позиция мыши (`mouseleave` в DOM). |

Как и CSS `:hover` и `mouseenter` в DOM, представление считается наведённым, пока мышь находится над ним или над любым вложенным в него, поэтому окружающие представления тоже слышат `onMouseEnter` (снаружи внутрь; `onMouseLeave` — изнутри наружу). События приходят постфактум и никогда не приходят от касаний. Представление, убранное из-под мыши, слышит `onMouseLeave`: на Linux и Windows при следующем движении мыши.

`MouseEvent` сообщает, где находится мышь, как и `MouseMoveEvent` в GPUI: `position` в представлении (`Point` в пунктах, с отменёнными трансформациями), `pagePosition` в корневом представлении, в котором оно находится (как это дают касания), удерживаемые `modifiers` (`control`, `alt`, `shift`, `platform`: Command на платформах Apple, клавиша Windows на остальных) и `pressedButton` — удерживаемая кнопка (`"left"`, `"right"`, `"middle"`, `"back"` или `"forward"`, `MouseButton` в GPUI) либо `null`; в Rust `position`, `page_position`, `modifiers` и `pressed_button`. На десктопах и в вебе перетаскивание — это тоже касание (`onTouchMove`, responder), и его движения доходят до `onMouseMove` с установленным `pressedButton`: обратная связь, которая следует только за наведением, их пропускает; на iOS и Android наведение сообщает указатель без нажатой кнопки. Движения приходят не чаще раза за кадр (берётся последнее) и всегда раньше `onMouseLeave`, который за ними следует, поэтому обработчик может перерисовывать при каждом движении:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

<a id="tooltips"></a>

### Tooltips (подсказки)

`tooltip` добавляет любому элементу подсказку, которая показывается над ним на десктопах (macOS, Windows, Linux, бэкенд GPUI и настольные браузеры), когда указатель пробыл на нём полсекунды, и остаётся, пока указатель не уйдёт или не нажмёт на элемент. На телефонах и планшетах подсказок нет. Подсказка никогда не перехватывает указатель и нажатия, поэтому элемент работает точно так же, как и без неё.

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | Подсказка — элемент, который оформляет приложение: [`Tooltip`](tooltip.md) из `nsh/base` — это сама подсказка со своим размещением, задержкой и событиями; любой другой элемент показывается как есть. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

`Tooltip` сам задаёт свой вид, размещение, задержку и события, как `.tooltip(..)` в GPUI. Приложение с многими подсказками держит один небольшой собственный компонент, который оборачивает текст в `Tooltip`.

<a id="context-menus"></a>

### Context menus (контекстные меню)

`onContextMenu` сообщает представлению, что над ним нажата дополнительная кнопка: правый щелчок, Control-щелчок на macOS, щелчок двумя пальцами на тачпаде, дополнительный щелчок указателя iPad; в браузерах также клавиша меню на клавиатуре. Откройте здесь собственное меню приложения; в TSX [`Menu.popup`](../modules/nsh-desktop.md) показывает системное:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Над представлением или вложенным в него представлением нажата дополнительная кнопка. |

`ContextMenuEvent` содержит `position` в представлении, `pagePosition` в его корневом представлении (где `Menu.popup` размещает меню: `Menu.popup(items, e.pagePosition)`) и `modifiers`; в Rust `position`, `page_position` и `modifiers`. Событие слышит ближайшее представление, которое слушает, начиная с находящегося под указателем и далее наружу. Если ближе этого представления находится текстовое поле или выделяемый текст с меню редактирования (Windows, бэкенд GPUI, браузеры), вместо него показывается собственное меню этого элемента. Платформа решает это в момент нажатия кнопки, исходя из того, что смонтировано, поэтому обработчик узнаёт о щелчке постфактум, и ничего отменять не нужно. Представление `disabled` оставляет щелчок ближайшему включённому слушателю вокруг него. На сенсорных экранах меню открывает долгое нажатие: обрабатывайте `onLongPress` той же функцией.

<a id="keyboard-focus"></a>

### Keyboard focus (фокус клавиатуры)

На macOS и в вебе Tab перемещает фокус клавиатуры между остановками в порядке дерева: поля ввода, представления, принимающие нажатия, и каждое представление `focusable`. Стили фокуса (`focus:`, `.focus(..)`) оформляют представление в фокусе, а Return или Space нажимают его, если оно принимает нажатия. Щелчок нажимает представление, не фокусируя его, поэтому стили фокуса показываются только для фокуса клавиатуры.

Фокус и нажатия — разные вещи. Представление, которое принимает клавиши, пока имеет фокус (диаграмма, ползунок, список, перемещающий выделение стрелками), задаёт `focusable` и привязывает свои клавиши, пока оно в фокусе (`onFocus` / `onBlur` с [`keymap`](../modules/nsh.md#keymap)); нажатие на него по-прежнему доходит до нажимаемого представления вокруг, например карточки, которая открывает страницу.

`focus()` ссылки (ref) переводит фокус клавиатуры на остановку так же, как Tab (показываются её стили фокуса и срабатывает `onFocus`), например чтобы вернуть его триггеру закрывшегося всплывающего окна, а `blur()` снимает его.

Окружающее представление оформляет себя с помощью `focus-within:` (`focusWithinStyle`, `.focus_within(..)`), пока фокус находится на нём или на любом вложенном в него представлении: рамка поля вокруг редактирующего ввода, панель инструментов, пока фокус на одной из её кнопок. Содержимое `Overlay` находится внутри представления, в котором расположен оверлей, где бы он ни показывался, поэтому всплывающее окно считается частью представления, содержащего его триггер. В Rust компонент слышит, как фокус входит в элемент и покидает его, через `on_focus_in(..)` и `on_focus_out(..)` его ref: перемещение между представлениями внутри него не является ни тем, ни другим.

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` для представлений, принимающих нажатия | Является ли представление остановкой Tab. `true` делает остановкой любое представление, принимает ли оно нажатия или оставляет их окружающим представлениям; `false` оставляет нажимаемое представление только указателю (подложка, закрывающая поповер, строки, между которыми двигаются стрелки). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (или `focus()`) передал представлению фокус клавиатуры. |
| `onBlur` | `.on_blur(..)` | `() => void` | | Фокус клавиатуры покинул представление. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Layout and identity (раскладка и идентичность)

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` — рамка представления относительно родителя, `{ origin, size }`, после каждой раскладки, которая её меняет. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | Ref элемента (см. [методы ref](#ref-methods)): `ViewRef` или собственный тип элемента поверх него. `ref={el}` присваивает переменную, `ref={fn}` вызывает функцию. |
| `nativeID` | `.native_id(id)` | `string` | Даёт представлению имя для других, например `InputAccessoryView`, на который ссылается поле ввода. |
| `testID` | `.test_id(id)` | `string` | Идентификатор для UI-тестов (на Android — resource id представления). |
| `key` | `.key(key)` | `string` | Идентичность элемента среди его соседей. |

<a id="gestures-driving-animated-values"></a>

### Gestures driving animated values (жесты, управляющие анимируемыми значениями)

Эти свойства привязывают жест к [нативным анимируемым значениям](../modules/nsh.md#animation), которые двигаются в UI-потоке, без работы кода приложения на каждый кадр. См. [касания и жесты](../docs/touch-and-gestures.md).

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Перетаскивания управляют этими значениями (в пунктах). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Началось перетаскивание. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Перетаскивание закончилось, с скоростью в момент отпускания (например, чтобы запустить `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | Щипки двумя пальцами управляют `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Щипок начался / закончился. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Повороты двумя пальцами управляют `angle` (в градусах). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Поворот начался / закончился. |

`PanEvent` — это `{ cancelled, translation, velocity, value? }` (в Rust `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`): отменила ли система перетаскивание, смещение с начала и скорость в пунктах в секунду (`Point`), а также привязанные значения в этот момент, `{ x?, y? }` для осей, которые связывает `pan` (перетаскивание может перехватить значение посреди анимации).

<a id="raw-touches-and-the-responder-system"></a>

### Raw touches and the responder system (сырые касания и система responder)

Для жестов, которые не покрывают свойства выше, каждый элемент принимает свойства касаний и responder: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (и их формы `…Capture`), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (и `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` и `onResponderTerminationRequest`. Каждый обработчик получает `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Возврат `true` из `onResponderGrant` не даёт нативным scroll-представлениям забрать касания. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) делает представление responder только после того, как платформа активирует его pan, поэтому перетаскивания внутри scroll-представлений оставляют другую ось им ([Касания и жесты](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` в [`PanResponder`](../modules/nsh.md#panresponder) строится на них. В Rust `.on_touch(..)` слышит каждое касание (`TouchEvent`), `.claim_touches(..)` решает, когда представление их забирает, а `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` и остальные следуют за responder.

<a id="accessibility"></a>

### Accessibility (доступность)

| Свойство | Rust | Тип | Описание |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | Представление — один элемент для вспомогательных технологий; его дочерние элементы отдельно не раскрываются. |
| `accessibilityLabel` | `.label(..)` | `string` | Что читают скринридеры. Представления без метки читают свои тексты. |
| `accessibilityHint` | `.hint(..)` | `string` | Что делает активация элемента. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | Чем является элемент (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | Состояние, о котором сообщают вспомогательные технологии (`checked` и `pressed` могут быть `"mixed"`; `current` — это `true` или `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | Уровень заголовка (1 — верхний), глубина элемента дерева (1 — верхний). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | Значение диапазона или текстового элемента. |
| `accessibilityElementsHidden` | | `boolean` | Скрывает представление и его поддерево от вспомогательных технологий. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Раскрывается ли представление. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Пользовательские действия, предлагаемые вспомогательным технологиям. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | Пользователь вызвал одно из `accessibilityActions`. |

См. [доступность](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Platform-only props (свойства только для одной платформы)

Свойства, существующие на одной платформе, помещаются в TSX в объект, названный по ней, поэтому общие свойства везде остаются одинаковыми. Отправляется только объект текущей платформы, остальные игнорируются. Билдеры Rust принимают их как методы, которые применяются на своей платформе.

| Свойство | Описание |
|---|---|
| `ios={{…}}` | iOS и Mac Catalyst. `<Input>`, `Dialog` и `WebView` добавляют собственные ключи. |
| `android={{…}}` | Android. Каждый элемент принимает `ripple`, `elevation` и `accessibilityLiveRegion` (ниже). |
| `desktop={{…}}` | Десктопные платформы и настольные браузеры; на мобильных игнорируется. Каждый элемент принимает `windowDrag` (ниже). |
| `web={{…}}` | Браузеры; в остальных местах игнорируется. |

| Ключ `android` | Rust | Тип | Описание |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | Material-рябь при нажатии. |
| `elevation` | `.elevation(px(2.0))` | `number` | Material-тень (в пунктах) по форме представления. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | Как изменения представления объявляются в TalkBack. |

| Ключ `desktop` | Rust | Тип | Описание |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Нажатие на представление перетаскивает окно, как это делала бы его строка заголовка; `false` оставляет часть перетаскиваемого представления доступной для щелчков. См. [собственная строка заголовка](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

См. [платформенно-специфичный код](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Методы ref

В TSX `ref` получает ref элемента, тип которого собственный для этого элемента: `ViewRef` (`focus`, `blur`, `measure`) для
`View`, `Text`, `Image`, `Canvas`, `Overlay` и `Shader`, а для остальных элементов тип поверх `ViewRef` с методами элемента:
`InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) и `NativeComponentRef` (нативные компоненты). В Rust `element_ref()` создаёт дескриптор `ElementRef`, который
подключает `.element_ref(&handle)`. Методы дескриптора отправляют команды нативному представлению в том же порядке, что и изменения,
сделанные до них в том же такте. На странице каждого элемента указано, какие методы к нему применимы. Типизируйте переменную ref собственным
типом элемента (`let field!: InputRef` для `<Input>`): переменная с типом `ViewRef` не подходит для элемента, ref которого имеет
собственные методы.

| Метод | Rust | Ref | Описание |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Устанавливает фокус на `<Input>` (показывает клавиатуру) или передаёт фокус клавиатуры представлению, которое принимает нажатия / снимает фокус. |
| `measure()` | `measure()` | `ViewRef` | [Где находится представление](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Выделяет `start..end` в единицах UTF-16; без `end` ставит курсор. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Прокручивает к смещению. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (масштабируемый `<Scroll>`) | Масштабирует до `scale` вокруг точки содержимого. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Прокручивает к смещению вдоль оси списка. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Прокручивает так, чтобы элемент оказался в области видимости. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Прокручивает к концу содержимого. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Управляет страницей. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Переходит к указанному моменту времени. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Вызывает команду зарегистрированного нативного компонента ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Почему обработчики никогда не блокируют UI

Главный поток никогда не ждёт код приложения. Когда системе нужен ответ немедленно (можно ли изменить этот текст, можно ли
кнопке «назад» убрать экран, можно ли закрыть этот лист), NSH отвечает на него нативно, исходя из заранее заданных свойств (`maxLength`,
`popOnBack`, `closeOnSwipe`, …), а событие попадает в приложение уже после этого. Поэтому такое поведение
задаётся свойством, а не возвращаемым значением обработчика.
