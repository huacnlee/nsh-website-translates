---
title: "Accordion"
description: "Accordion и его части: стопка секций, которые разворачиваются и сворачиваются под своими заголовками, по одной или по нескольку одновременно, открываются по значению приложения, плавно раскрываются с пружинящим изменением высоты по запросу, а внешний вид полностью определяется приложением."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

Аккордеон складывает секции, которые раскрываются и сворачиваются под своими заголовками: вопросы FAQ, группы страницы настроек, шаги оформления заказа. Он состоит из пяти частей, и каждая отвечает за одно поведение и не определяет внешний вид:

- `Accordion`, стопка: хранит `value` приложения, то есть значения открытых элементов, и сообщает о следующих через `onChange`. Открыт может быть один элемент или несколько, если указан `multiple`.
- `AccordionItem`, одна секция, которую определяет её `value`. Она открыта, пока `value` аккордеона содержит её значение.
- `AccordionHeader`, заголовок элемента с `level`, который объявляют программы чтения с экрана.
- `AccordionTrigger`, кнопка в заголовке, которая раскрывает и сворачивает свой элемент и сообщает, раскрыт ли он.
- `AccordionPanel`, содержимое элемента, видимое, пока он открыт; с `reveal` его высота плавно, по пружине, раскрывается и сворачивается.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

Части поставляет [`nsh/base`](../modules/nsh-base.md), `nsh-base`-крейт на Rust. Значение принадлежит приложению: нажатие на триггер сообщает следующие `value` через `onChange`, а аккордеон открывает элементы, значения которых приложение передаёт обратно. Каждая часть сама находит окружающую её часть, поэтому приложение располагает их свободно: разделители между элементами, бейдж в заголовке, значок перед названием. В Rust их создают `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()` и `accordion_panel()`: у каждого свойства есть сеттер, а для содержимого — `.child(..)`.

<a id="props"></a>

## Свойства

<a id="accordion-1"></a>

### Accordion

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | `value` открытых элементов. Они принадлежат приложению: нажатие на триггер сообщает следующие через `onChange`, а аккордеон показывает те, что приложение передаёт обратно. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Несколько элементов открыты одновременно: открытие одного не закрывает остальные. Без этого свойства открытие элемента закрывает тот, что был открыт. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Все элементы отключены: ни один триггер не принимает нажатий, а программы чтения с экрана сообщают, что каждый из них затемнён. |
| `children` | `.child(..)` | `JSX.Element` | нет | Элементы и всё, что приложение располагает между ними (разделители). |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Компоновка и внешний вид стопки: карточка вокруг элементов, промежуток между ними. |

### AccordionItem

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | обязательное | То, что определяет элемент в `value` аккордеона: собственный идентификатор приложения, но не заголовок, который меняется вместе с языком. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Его триггер не принимает нажатий, а программы чтения с экрана сообщают, что он затемнён. Элемент остаётся открытым или закрытым в соответствии с `value` аккордеона. |
| `children` | `.child(..)` | `JSX.Element` | нет | Заголовок и панель элемента и всё остальное, что приложение располагает в нём. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Секция: разделитель под ней, карточка вокруг неё. |

### AccordionHeader

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | Уровень заголовка среди заголовков страницы, для программ чтения с экрана (1 — верхний). |
| `children` | `.child(..)` | `JSX.Element` | нет | Триггер элемента и всё остальное, что содержит заголовок (бейдж, собственное действие). |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Компоновка заголовка. |

### AccordionTrigger

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль триггера, пока его элемент открыт, в виде классов `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Что произносят программы чтения с экрана, если в дочерних элементах нет текста, который это говорит. |
| `children` | `.child(..)` | `JSX.Element` | нет | Название и шеврон; классы `group-aria-expanded:` внутри следуют за триггером при `group` на его `class`. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Сам триггер: строка, на которую нажимает пользователь. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль триггера, пока он нажат, под курсором, в фокусе или отключён, в виде классов `<state>:`. |

### AccordionPanel

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | Открывается и закрывается с эффектом раскрытия, как у `Collapsible`: панель обрезает содержимое, а её высота по пружине растёт от нуля до высоты содержимого и обратно с критическим затуханием (около 265 мс, без перерегулирования), и следующие за ней элементы смещаются вместе с ней. При включённом уменьшении движения открывается и закрывается мгновенно. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | Пока элемент закрыт, содержимое остаётся в дереве, но скрыто от глаз, от фокуса клавиатуры и от программ чтения с экрана: видео сохраняет свою позицию, веб-представление — свою страницу. Без этого свойства содержимое покидает дерево, когда панель закрывается (после того как эффект раскрытия её закрыл), и возвращается в прежнем виде. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как программы чтения с экрана называют область: обычно это название элемента, как его произносит заголовок. |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое. |
| `class`, `style` | методы стиля | `string`, `StyleProp<ViewStyle>` | нет | Компоновка и внешний вид области. С `reveal` закрытая панель остаётся в компоновке с нулевой высотой, поэтому её отступы и рамки следует задавать на представлении, содержащем её содержимое. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Триггер нажат: касание, щелчок, Space или Return, пока он в фокусе клавиатуры, либо активация программой чтения с экрана. `value` — значения открытых элементов в том виде, какими они стали бы: значение открытого элемента убирается из списка, значение закрытого добавляется в конец или, без `multiple`, заменяет прежнее. Обработчик срабатывает до каких-либо изменений: задайте `value`, чтобы последовать за ним. |

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Стопка | | у `Accordion`: `class`, `style` | |
| Элемент | стопка | у `AccordionItem`: `class`, `style` | значение приложения |
| Заголовок | элемент | у `AccordionHeader`: `class`, `style` | |
| Триггер | заголовок | у `AccordionTrigger`: `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (или `expandedStyle`, `disabledStyle`, ...) |
| Название и шеврон | триггер | собственные элементы (`children`) | `group-aria-expanded:`, `group-disabled:` с `group` на `class` триггера |
| Панель | элемент, после заголовка | у `AccordionPanel`: `class`, `style` | |
| Содержимое | панель | собственные элементы (`children`) | |

Без `reveal` закрытая панель находится вне компоновки, а её содержимое — вне дерева. С `reveal` изменение является анимацией компоновки того коммита, который меняет `value` (как `LayoutAnimation.configureNext`, выполняется нативно, поэтому пока идёт движение, JavaScript не запускается): открывающаяся панель растёт от нуля до высоты своего содержимого, закрывающаяся сжимается обратно, обе по одной и той же пружине, а следующие за ними элементы смещаются вместе с ними. Вместе с этим идёт и переход, заданный приложением: шеврон поворачивается (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Отключение

Триггер отключённого элемента не принимает нажатий, а программы чтения с экрана объявляют его затемнённым; классы `disabled:` на триггере и `group-disabled:` внутри него следуют за этим. Свойство `disabled` аккордеона отключает все элементы. Отключённый элемент по-прежнему показывает то, что говорит `value` приложения: приложение может его открыть.

<a id="accessibility"></a>

## Доступность

- Стопка является группой, каждый заголовок — заголовком своего `level`, а каждый триггер — кнопкой внутри него, сообщающей, раскрыт ли её элемент. Программы чтения с экрана могут переходить от заголовка к заголовку.
- Открытая панель является областью, названной через `accessibilityLabel`; закрытая скрыта от программ чтения с экрана вместе с сохранённым содержимым.
- Вид открытого элемента определяет приложение, и он не должен опираться только на цвет: поворачивайте шеврон, как в примерах.

Подробнее о метках, ролях и объявлениях в целом см. [Доступность](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

Там, где представления, принимающие нажатия, являются остановками фокуса клавиатуры (macOS и веб), каждый триггер является остановкой, в порядке страницы, и Space и Return нажимают его. Отключённые триггеры пропускаются, как и содержимое закрытой панели. Tab переводит фокус с триггера на элементы управления его открытой панели и далее к следующему триггеру.

<a id="platform-notes"></a>

## Особенности платформ

- На каждой платформе панель открытого элемента показывается под его заголовком, а закрытая остаётся вне компоновки (с нулевой высотой при `reveal`).
- С `reveal` каждая платформа плавно меняет высоту панелей по пружине собственным аниматором (iOS, Android, macOS, Windows, Linux, GPUI и веб), а когда система запрашивает уменьшение движения, открывает и закрывает их мгновенно.
- Программа чтения с экрана каждой платформы озвучивает заголовок и его уровень при чтении заголовков, а находящийся в нём триггер — как кнопку с её состоянием раскрытия; на iOS VoiceOver читает сам триггер.
- iOS, Android и Mac Catalyst: нажатие на триггер — это касание. Настольные платформы (macOS, Windows, Linux, GPUI) и веб: щелчок, а также Space или Return на триггере в фокусе на macOS и в вебе.
