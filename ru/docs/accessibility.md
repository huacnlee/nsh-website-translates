---
title: "Специальные возможности"
description: "Как обеспечить работу приложений с VoiceOver и TalkBack: метки, роли, состояния, значения, пользовательские действия, группировка и скрытие элементов, объявления и фокус, размер текста и уменьшение движения."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# Доступность

NSH отрисовывает интерфейс нативными представлениями, поэтому вспомогательные технологии платформ (VoiceOver на iOS и Mac Catalyst, TalkBack на Android, Switch Control, Voice Control, ...) видят настоящую иерархию представлений вашего приложения. Вы добавляете то, что эти технологии не могут определить сами: чем является элемент, что в нём написано, в каком он состоянии и что он умеет. Каждый элемент принимает перечисленные ниже методы (Rust) и свойства (TSX).

<a id="what-you-get-without-doing-anything"></a>

## Что вы получаете без дополнительных усилий

- **Текст озвучивается.** Текстовый элемент является элементом доступности, а его метка совпадает с текстом. Представление без метки озвучивается как тексты внутри него.
- **Нажимаемые представления являются элементами.** Представление с обработчиком нажатия или долгого нажатия (`.on_press`, `onPress`) по умолчанию является элементом доступности, а его активация (двойное касание в VoiceOver или TalkBack) нажимает его.
- **Поля ввода являются текстовыми полями** с подсказкой, значением и клавиатурой.
- **Текст следует настройке размера, выбранной пользователем.** См. [Размер текста](#text-size).

<a id="labels-hints-and-roles"></a>

## Метки, подсказки и роли

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | Тип | Описание |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | Представление является одним элементом для вспомогательных технологий; его дочерние элементы не передаются отдельно. |
| `.label(..)` | `accessibilityLabel` | `string` | Что читают скринридеры вместо текстов внутри. |
| `.hint(..)` | `accessibilityHint` | `string` | Что делает активация элемента; читается после паузы. |
| `.role(..)` | `role` | `AccessibilityRole` | Чем является элемент. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Его состояние: disabled, selected, checked, busy, expanded, pressed, current. `selected` также применяет стиль выбранного элемента, `checked` — стиль отмеченного при true и стиль неопределённого состояния при `"mixed"`, `pressed` — стиль нажатого при true. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | Уровень заголовка (1 — верхний), глубина элемента дерева (1 — верхний уровень). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | Значение диапазонного или текстового элемента. |
| | `accessibilityActions` | `{ name, label? }[]` | Действия, предлагаемые вспомогательным технологиям. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | Действие выполнено (в Rust: его имя). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Скрывает представление и его поддерево от вспомогательных технологий. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Доступно ли представление (и его поддерево) вспомогательным технологиям. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: как TalkBack объявляет изменения представления. |
| `.test_id(..)` | `testID` | `string` | Идентификатор для UI-тестов (accessibility identifier на iOS, resource id на Android); не озвучивается. |

Задавайте метку для каждого элемента управления, состоящего только из значка: скринридер не может прочитать глиф или изображение. Делайте метки короткими и не включайте в них роль («Play», а не «Кнопка Play»): роль объявляется отдельно.

<a id="roles"></a>

### Роли

Роль (`.role(AccessibilityRole::Header)`, `role="header"`) сообщает пользователю, что это за элемент и как с ним работать. В Rust это вариант `AccessibilityRole` (`Button`, `Header`, `Switch`, ...); значения в TSX: `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` и `"cell"` (роли частей [`Table`](../elements/table.md)), `"listbox"` и `"option"` (список вариантов для выбора, например список [`Select`](../elements/select.md), и его варианты, выбранный отмечается `accessibilityState.selected`), `"group"` (связанные элементы, составляющие единое целое), `"region"` (раздел, к которому стоит переходить отдельно, например панель аккордеона), `"navigation"` (ссылки для перемещения по приложению, например пагинация), `"tree"` и `"treeitem"` (элементы, которые разворачиваются и сворачиваются, каждый на своём `accessibilityLevel`), `"menuitemcheckbox"` и `"menuitemradio"` (пункты меню с отметкой, отдельные или как один из вариантов группы).

Наиболее полезные:

- `"button"` для любого нажимаемого элемента, не являющегося ссылкой; `"link"` для перехода к содержимому.
- `"header"` для заголовков разделов: пользователи скринридеров переходят между заголовками, чтобы бегло просмотреть экран. `accessibilityLevel` задаёт его уровень (1 — верхний) там, где платформа его читает.
- `"button"` вместе с `accessibilityState.pressed` для кнопки-переключателя, которая остаётся включённой или выключенной (полужирный шрифт на панели инструментов).
- `"navigation"` вокруг ссылок, переключающих страницы, со `accessibilityState.current: "page"` у ссылки на показанную страницу.
- `"switch"`, `"checkbox"`, `"radio"` вместе с `accessibilityState.checked`.
- `"adjustable"` для слайдеров и степперов, со `accessibilityValue` и действиями `increment` / `decrement`
  (каждый ползунок [`Slider`](../elements/slider.md) является таким элементом).
- `"spinbutton"` для поля, которое хранит число, которое пользователь также может изменять шагами, с тем же значением и действиями (поле
  [`NumberInput`](../elements/number-input.md)).
- `"image"` для значимых изображений, с меткой; декоративные изображения лучше скрывать.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### Состояния и значения

Для элемента управления «вкл / выкл» в приложении используйте [`Switch`](../elements/switch.md) из `nsh/base`, который сам задаёт роль и состояние. Пример показывает, что делают роль и состояние на представлении.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

Состояние задаётся через `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` в Rust и `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` в TSX. `pressed` превращает кнопку в кнопку-переключатель (`aria-pressed` из ARIA); `current` отмечает текущий элемент набора (`aria-current` из ARIA): страницу пагинации, шаг мастера. `disabled` также подразумевается при отключении представления (`.disabled(..)`, `disabled`). `accessibilityValue` вместе с `min`, `max` и `now` читается как процент; с `text` читается как задано («3 из 10», «Medium»).

<a id="actions"></a>

## Действия

Нажимаемое представление уже поддерживает активацию. Для всего остального объявляйте действия через `accessibilityActions` и обрабатывайте их через `onAccessibilityAction`; компонент на Rust получает имя выполненного действия через `.on_accessibility_action(|name: &str| ..)`:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

Некоторые имена действий стандартные и соответствуют собственным жестам платформ:

| Имя | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Двойное касание | Двойное касание (click) |
| `increment`, `decrement` | Свайп вверх / вниз, затем VoiceOver читает новое значение | Прокрутка вперёд / назад |
| `longpress` | | Двойное касание с удержанием |
| `expand`, `collapse` | | Развернуть / свернуть |
| `magicTap` | Двойное касание двумя пальцами | |
| `escape` | Жест «Z» двумя пальцами | |

Элемент с `increment` или `decrement` регулируется независимо от роли: диаграмма сохраняет роль `"image"` и перебирает свои точки свайпами VoiceOver и прокруткой TalkBack, а её `accessibilityValue` читается после каждого шага.

Любое другое имя становится пользовательским действием, которое отображается в роторе действий VoiceOver и в меню действий TalkBack со своим `label` (или именем). Пользовательские действия — это доступная форма жеста «смахнуть для удаления» и подобных:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Группировка и скрытие

Если сделать представление доступным (`.accessible(true)`, `accessible`), оно становится одним элементом: карточка с заголовком, подзаголовком и ценой читается за один раз, и пользователю не нужно перебирать свайпами три текста.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

Скрывайте то, что ничего не добавляет: декоративные изображения, разделители, значок рядом с текстом, который говорит то же самое.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (название из iOS) и `importantForAccessibility="no-hide-descendants"` (название из Android) скрывают поддерево на обеих платформах; задавать оба безвредно.

<a id="the-screen-reader-and-the-users-settings"></a>

## Скринридер и настройки пользователя

В Rust prelude сообщает настройки пользователя и взаимодействует со скринридером: `screen_reader()` и `reduce_motion()` реактивны, `announce_for_accessibility(message)` заставляет скринридер прочитать сообщение, а `element_ref()` элемента перемещает фокус скринридера на него с помощью `set_accessibility_focus()`. В TSX API доступности `nsh` сообщает настройки пользователя и позволяет обращаться к скринридеру.

| Член | Описание |
|---|---|
| `screenReaderEnabled()` | Запущен ли VoiceOver или TalkBack (реактивно). |
| `reduceMotion()` | Просил ли пользователь уменьшить анимацию (реактивно). |
| `announce(message)` | Скринридер читает `message`. |
| `setAccessibilityFocus(ref)` | Перемещает фокус скринридера на представление. |

Настройки представлены аксессорами: читайте их в привязке или эффекте, и всё, что их читает, обновится при изменении настройки пользователем, без очистки.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

Объявляйте изменения, которые пользователь иначе пропустил бы: завершение фонового сохранения, ошибку, появившуюся вдали от фокуса, окончание таймера. На Android `android={{ accessibilityLiveRegion: "polite" }}` на представлении заставляет TalkBack самостоятельно объявлять его изменения.

<a id="text-size"></a>

## Размер текста

Текст и поля ввода следуют системному размеру текста (Dynamic Type на iOS, размер шрифта на Android), если вы это не отключите (`.allow_font_scaling(false)`, `allowFontScaling={false}`). Вместо отключения лучше учитывать это при проектировании:

- Позволяйте тексту переноситься: избегайте фиксированной высоты у представлений с текстом.
- Ограничивайте очень крупные заголовки с помощью `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` вместо отключения масштабирования.
- Меняйте раскладку при крупном тексте: читайте `font_scale()` (Rust) или `fontScale()` из `nsh` (TSX) (например, располагайте метку и её значение вертикально при значении выше 1.3).

См. [Устройство и окружение](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Уменьшение анимации

`reduce_motion()` (Rust) и `reduceMotion()` (TSX) равны `true`, когда пользователь включил Reduce Motion на iOS или настройку удаления анимации на Android. Ваши анимации выполняются так, как вы их написали, поэтому используйте это значение или варианты Tailwind `motion-reduce:` и `motion-safe:`, чтобы заменить крупное движение плавным появлением или мгновенным изменением:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## Области касания

Делайте нажимаемые элементы не меньше 44 × 44 пунктов. Если элемент управления должен выглядеть меньше, расширяйте его область касания с помощью hit slop (`.hit_slop(..)`, `hitSlop`), а не его размер; см. [Касания и жесты](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Проверка приложения

- Включите VoiceOver (Настройки iOS, Универсальный доступ, или тройное нажатие боковой кнопки, если оно настроено) или TalkBack и пользуйтесь приложением, не глядя на экран: каждый элемент управления должен сообщать, чем он является и что делает.
- В симуляторах iOS Accessibility Inspector из Xcode показывает метку, трейты и значение каждого элемента.
- Попробуйте самый большой размер текста и тёмную тему.
- Тестовый идентификатор (`.test_id(..)`, `testID`) даёт UI-тестам стабильную точку привязки, которая не меняется в зависимости от языка метки.

<a id="related"></a>

## См. также

- [API доступности `nsh`](../modules/nsh.md#accessibility): справочник.
- [`View`](../elements/view.md): все свойства доступности.
- [Анимация](./animation.md#reduced-motion) и [Устройство и окружение](./device-and-environment.md).
