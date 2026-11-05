---
title: "Carousel"
description: "Carousel и его части: слайды, которые показываются по одному и перемещаются свайпом, колесом мыши и тачпадом на штатной прокрутке платформы, кнопками «назад» и «вперёд», пагинацией и клавиатурой, с бесшовным переходом через границы списка. Carousel отвечает за то, какой слайд показан, привязку к слайдам, зацикливание, клавиши и доступность; внешний вид и все подписи остаются за приложением."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

Карусель показывает слайды по одному: фотографии товара, шаги онбординга, баннер, который сменяется сам, ряд карточек. `Carousel` отвечает за поведение: какой слайд показан, пролистывание между слайдами, кнопки «назад» и «вперёд», пагинацию, стрелки на клавиатуре, переход через края и то, что слышат пользователи скринридеров. Её части находят её через контекст, поэтому приложение свободно расставляет их в своей разметке. Внешний вид остаётся за приложением: у карусели нет собственных цветов, размеров, стрелок, точек и подписей.

Содержимое — нативный scroll view. Палец, колесо мыши и тачпад двигают слайды в главном потоке платформы, в том же кадре, что и указатель, а при отпускании содержимое примагничивается к ближайшему слайду, по одному слайду за бросок. Когда содержимое останавливается, карусель сообщает о слайде через `onChange`. Кнопки, пагинация, клавиши и `index` приложения нативно прокручивают содержимое к слайду с анимацией.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` и её части поставляются из [`nsh/base`](../modules/nsh-base.md), крейта `nsh-base` на Rust. Показанный слайд — `index` приложения: свайп, кнопка или клавиша сообщают следующий слайд через `onChange`, а карусель прокручивает к `index`, который приложение передаёт обратно. Слайд, на котором остановился свайп, остаётся показанным, пока приложение не ответит на его `onChange`: он остаётся, если приложение передаёт его обратно как `index`, а содержимое с анимацией возвращается к слайду приложения, если приложение сохраняет прежний `index`. Без `index` карусель хранит собственный слайд, начиная с `defaultIndex`. В Rust `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` и `carousel_pagination_item()` создают части, с сеттером на каждое свойство (`.index(..)`), слушателем на каждое событие (`.on_change(..)`), типизированными методами стилей и `.child(..)` для их содержимого.

<a id="props"></a>

## Свойства

<a id="carousel-1"></a>

### Carousel

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | нет | Показанный слайд, начиная с 0, ограниченный числом слайдов. Владелец — приложение: изменения сообщаются через `onChange`, а новый `index` прокручивает к нему с анимацией. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | Слайд, показанный первым, пока `index` не задан. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Направление, в котором слайды следуют друг за другом; читается при создании карусели. Стрелки клавиатуры вертикальной карусели — Up и Down. |
| `looping` | `.looping(..)` | `boolean` | `false` | Слайды идут по кругу: после последнего идёт первый, а перед первым — последний, бесшовно, одинаково для свайпа, «назад», «вперёд», клавиш и `index` приложения ([Зацикливание](#looping)). Читается при создании карусели. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют карусель, регион: что представляют собой её слайды (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | нет | `CarouselContent`, кнопки и всё, что приложение размещает вокруг них. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Раскладка карусели: где находятся содержимое и кнопки. |

### CarouselContent

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | нет | Элементы `CarouselItem`, каждый — дочерний элемент content. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Размер области просмотра и трека, который слайды образуют в ней: `gap` между ними, отступ, при котором видна часть слайдов рядом с показанным. |

### CarouselItem

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют слайд, группу: его место среди остальных и что он показывает (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | нет | Содержимое слайда. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Размер вдоль оси (`w-full` для одного слайда в области просмотра, `basis-1/3` для трёх) и внешний вид. В зацикленной карусели его смещение (translation) принадлежит карусели: помещайте `transform` на view внутри него. |

### CarouselPrevious, CarouselNext

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Имя кнопки, когда в её дочерних элементах нет текста, который его задаёт (иконка-стрелка). |
| `children` | `.child(..)` | `JSX.Element` | нет | Иконка или подпись приложения. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид и положение: рядом с содержимым или `absolute` поверх его края. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | нет | Стиль при нажатии, наведении, фокусе или когда кнопка отключена на краю, как классы `<state>:`. |

### CarouselPagination

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Как скринридеры называют группу элементов пагинации (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | нет | Tailwind-классы индикатора — view на элементе показанного слайда (плашка за точками, подчёркивание): его внешний вид и положение поперёк ряда (`inset-y-0`, `bottom-0 h-0.5`). Вдоль ряда он занимает этот элемент и нативно перепрыгивает к следующему. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль индикатора поверх `indicatorClass`. Если не задано ни то, ни другое, у пагинации нет индикатора. |
| `children` | `.child(..)` | `JSX.Element` | нет | Элементы `CarouselPaginationItem` и всё, что приложение размещает между ними. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Раскладка ряда (`flex-row gap-2`). |

### CarouselPaginationItem

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | обязательно | Слайд, который он показывает, начиная с 0. Индекс за последним слайдом означает отключённый элемент. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | нет | Стиль, пока показан его слайд, как классы `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | нет | Какой слайд он показывает (`"Slide 3"`), когда в его дочерних элементах нет текста, который это задаёт (точка). |
| `children` | `.child(..)` | `JSX.Element` | нет | Точка, миниатюра или номер приложения. |
| `class`, `style` | методы стилей | `string`, `StyleProp<ViewStyle>` | нет | Внешний вид; классы `group-selected:` внутри него следуют за ним под `group`. |

<a id="events"></a>

## События

| Событие | Rust | Описание |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | Пользователь перешёл к другому слайду: свайп, колесо или тачпад остановились на нём, либо кнопка, элемент пагинации или клавиша запросили его. `{ index }` — этот слайд. Новый `index` от приложения ничего не сообщает. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | Пользователь начал перетаскивать содержимое (пальцем, тачпадом). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | Содержимое, которое перетаскивал пользователь, остановилось. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | Фокус клавиатуры попал в карусель: на её собственный view, кнопку «назад» или «вперёд», элемент пагинации или фокусируемый view в слайде. Перемещение между ними ничего не сообщает. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | Фокус клавиатуры покинул карусель: её собственный view, кнопки, элементы пагинации и содержимое слайдов. |

<a id="parts"></a>

## Части

| Часть | Внутри | Стилизуется через | Состояния |
|---|---|---|---|
| Карусель | | `class`, `style` у `Carousel` | `focus:` |
| Содержимое | карусель | `class`, `style` у `CarouselContent` | |
| Слайд | содержимое | `class`, `style` у `CarouselItem` | |
| Назад, вперёд | карусель | их `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| Пагинация | карусель | `class`, `style` у `CarouselPagination` | |
| Индикатор | пагинация | `indicatorClass`, `indicatorStyle` | |
| Элемент пагинации | пагинация | его `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Несколько слайдов в области просмотра

Ширина слайда задаётся его собственным классом, поэтому ряд карточек — это несколько слайдов в области просмотра. Каждый слайд — точка примагничивания там, где он начинается: содержимое останавливается с этим слайдом там, где останавливается первый, поэтому отступ перед первым сохраняется перед каждым. В конце диапазона слайды, которые не могут достичь этого места, останавливаются вместе с последним, и «вперёд» там останавливается. `index` называет слайд на первом месте; слайды, останавливающиеся вместе с последним, показывают то же место, и свайп там сообщает первый из них:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` на ширине телефона, или `basis-[85%]`, показывает край следующей карточки. Вертикальная карусель (`axis="vertical"`) задаёт размер слайдов по их высоте.

<a id="looping"></a>

## Зацикливание

С `looping` слайды идут по кругу бесшовно: после последнего идёт первый — при свайпе, шаге «вперёд» или клавишами, либо при `index` приложения, без перемотки через промежуточные слайды. Содержимое держит запас в целый оборот слайдов до и после них и рисует каждый слайд там, где он ближе всего к середине области просмотра; анимация выполняет это на собственных кадрах платформы, вместе с прокруткой. Каждый слайд существует в одном экземпляре: скринридеры и пагинация видят его один раз.

Цикл бесшовен, пока слайды покрывают область просмотра и ещё один слайд (три слайда на всю ширину или пять шириной в треть). При меньшем числе «назад», «вперёд» и клавиши всё равно идут по кругу, прокручивая обратно через слайды.

<a id="slides-that-move-on-by-themselves"></a>

## Слайды, которые сменяются сами

Баннер, который сменяется сам, — дело приложения: таймер, который задаёт `index`. Карусель сообщает, когда с ней взаимодействует пользователь, поэтому таймер в это время ждёт, как требует [паттерн карусели WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): `onDragStart` / `onDragEnd` вокруг перетаскивания, `onFocus` / `onBlur`, пока фокус клавиатуры находится в карусели (на ней самой, её кнопках, пагинации или содержимом слайдов), и указатель над view вокруг неё. Отключайте автосмену при включённом режиме уменьшения движения и давайте пользователям кнопку, которая её останавливает (управление сменой слайдов):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Чтение `index()` в эффекте заново запускает полный интервал после каждого изменения, в том числе сделанного пользователем. С `looping` переход с последнего слайда на первый идёт вперёд, через шов.

<a id="accessibility"></a>

## Доступность

- Карусель — регион с именем из `accessibilityLabel`; каждый слайд — группа с собственным именем (его место среди остальных и что он показывает).
- «Назад» и «вперёд» — кнопки, отключённые на краях, если карусель не зациклена; каждый элемент пагинации — кнопка, выбранная, пока показан её слайд.
- Все подписи задаёт приложение, на языке приложения.
- Слайды зацикленной карусели существуют каждый в одном экземпляре, где бы они ни рисовались.

Общие сведения о подписях, ролях и объявлениях см. в разделе [Доступность](../docs/accessibility.md).

<a id="keyboard"></a>

## Клавиатура

На macOS и в вебе, где Tab достигает view, принимающих нажатия, карусель является остановкой фокуса клавиатуры, как и её кнопки и элементы пагинации. Пока фокус на одном из них:

| Клавиша | Действие |
|---|---|
| Left, Right (Up, Down у вертикальной) | Переходит к предыдущему или следующему слайду, через края при зацикливании. |
| Home, End | Переходит к первому или последнему слайду. |
| Space, Return | Нажимает кнопку или элемент пагинации, на которых фокус. |

В раскладке справа налево слайды горизонтальной карусели идут справа, поэтому Left переходит к следующему слайду, а Right — к предыдущему; вертикальная карусель сохраняет Up и Down. Кнопка, которая становится отключённой, пока на ней фокус («вперёд» на последнем слайде), передаёт фокус карусели, чтобы клавиши продолжали работать. Фокусируемые view приложения внутри слайдов сохраняют собственные клавиши: стрелки поля ввода двигают его каретку.

<a id="motion"></a>

## Анимация

- Свайп, колесо и тачпад двигают слайды вместе с указателем, в том же кадре: их прокручивает платформа.
- При отпускании содержимое плавно доезжает до ближайшего слайда, по одному слайду за бросок, как примагничивает платформа.
- «Назад», «вперёд», элемент пагинации, клавиша и `index` приложения прокручивают содержимое к слайду с анимацией; при уменьшенном движении — мгновенно.
- Индикатор пагинации перепрыгивает к элементу показанного слайда; при уменьшенном движении он перемещается мгновенно.
- `looping` идёт с последнего слайда на первый шагом вперёд, через шов; когда содержимое останавливается, оно без анимации сдвигается назад на целый оборот, что ничего не меняет на экране.

<a id="platform-notes"></a>

## Особенности платформ

- iOS, Android и Mac Catalyst: палец листает слайды; касание нажимает кнопку.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: колесо и тачпад прокручивают слайды, а щелчок нажимает кнопку. Перетаскивание мышью по содержимому остаётся за приложением, как и в любом scroll view там.
- Каждая платформа рисует то, что стилизует приложение: слайды, кнопки, пагинацию и её индикатор.
