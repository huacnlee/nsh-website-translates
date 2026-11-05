---
title: "Select"
description: "Select 컴포넌트: 항목 목록에서 하나의 값을 선택합니다. 데스크톱에서는 트리거 위치에 팝업으로, 휴대폰에서는 시트로 표시되며, 키보드, 타입어헤드, 검색, 섹션을 지원하고 앱에서 스타일을 지정할 수 있습니다."
group: base
demo: el-select
source_hash: 2fc7845fec15f74b
---

# Select

Select는 목록의 항목 중 하나를 고르는 컴포넌트입니다: 설정, 필터, 국가, 시간대 등. 앱의 트리거가 목록을 열며, 목록은 각 기기에 맞는 방식으로 표시됩니다:

- 데스크톱과 데스크톱 브라우저에서는 트리거 위에 팝업이 뜨고, 선택된 행이 트리거 위에 겹쳐져 선택한 제목이 제자리에 그대로 있습니다(shadcn/ui의 `item-aligned` 위치). 너비는 트리거와 같으며(앱의 `popupStyle` / `popupClass` 너비로 다르게 지정할 수 있고, `gpui-component`의 `menu_width`도 마찬가지입니다), 높이는 행의 높이만큼이되 화면의 여유 공간까지입니다. 선택된 항목이 없으면 트리거 아래에 열립니다. 키보드로 항목 사이를 이동하고 하나를 선택합니다.
- 휴대폰과 태블릿에서는 배경막 위에 화면 하단 시트로 표시됩니다.

동작은 Select가 담당합니다: 값(앱의 값 또는 자체 값), 열림 상태, 키보드, typeahead, 검색, 섹션, 강조된 행, 스크린 리더가 읽는 내용. 외형은 앱이 담당합니다: 트리거, 팝업, 목록, 행, 섹션 헤더, 검색 필드의 스타일을 지정하거나 행을 직접 그립니다.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, select, theme};
use nsh_core::prelude::*;

const FRUITS: [(&str, &str); 5] = [
    ("apple", "Apple"),
    ("banana", "Banana"),
    ("blueberry", "Blueberry"),
    ("grapes", "Grapes"),
    ("pineapple", "Pineapple"),
];

fn fruit_select() -> impl IntoElement {
    let fruit = signal(None::<SharedString>);
    let title = move || {
        let chosen = fruit.get();
        FRUITS
            .iter()
            .find(|(value, _)| Some(*value) == chosen.as_deref())
            .map_or("Pick a fruit", |(_, title)| *title)
            .to_string()
    };
    select()
        .items(
            FRUITS
                .iter()
                .map(|&(value, title)| SelectItem::new(value, title).disabled(value == "grapes"))
                .collect::<Vec<_>>(),
        )
        .value(move || fruit.get())
        .on_change(move |next: &Option<SharedString>| fruit.set(next.clone()))
        .accessibility_label("Fruit")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .text_color(move || theme().popover_foreground)
                .shadow_md()
        })
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .trigger(
            view()
                .h_9()
                .w_48()
                .flex_row()
                .items_center()
                .justify_between()
                .px_3()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .hover(|s| s.bg(move || theme().accent))
                .child(text(title))
                .child(text("▾").text_color(move || theme().muted_foreground)),
        )
        .render_item(|item: &SelectEntry| {
            view()
                .flex_row()
                .items_center()
                .px_2()
                .py_1p5()
                .child(text(item.title.clone()).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Select } from "nsh/base";

const FRUITS = [
  { value: "apple", title: "Apple" },
  { value: "banana", title: "Banana" },
  { value: "blueberry", title: "Blueberry" },
  { value: "grapes", title: "Grapes", disabled: true },
  { value: "pineapple", title: "Pineapple" },
];

function App() {
  const fruit = signal<string | null>(null);
  const title = () => FRUITS.find((f) => f.value === fruit())?.title;
  return (
    <Select
      items={FRUITS}
      value={fruit()}
      onChange={({ value }) => fruit.set(value)}
      accessibilityLabel="Fruit"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      itemClass="rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground disabled:opacity-50"
      trigger={
        <View class="h-9 w-48 flex-row items-center justify-between rounded-md border border-input px-3 hover:bg-accent active:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text class={fruit() ? "text-foreground" : "text-muted-foreground"}>{title() ?? "Pick a fruit"}</Text>
          <Text class="text-muted-foreground">▾</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`Select`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서 `select()`는 prop마다 setter 하나, 이벤트(`.on_change(..)`)마다 리스너 하나를 갖는 인스턴스를 만듭니다(`.items(..)`, `.value(..)`, `.item_style(..)`). `SelectItem::new(value, title)`는 `.disabled(..)`와 `.group(..)`를 가진 항목을 만듭니다.

<a id="items"></a>

## 항목

목록은 `items`에 데이터로 전달합니다. 각 항목에는 `value`(항목 간에 고유하며, 선택하면 설정되는 값), `title`(행에 표시되고, 검색과 typeahead가 일치시키며, 스크린 리더가 읽는 내용)이 있고, 선택적으로 `disabled`과 `group`를 지정할 수 있습니다. 같은 `group`를 가진 인접한 항목은 해당 제목의 헤더 아래에서 하나의 섹션을 이룹니다:

```tsx
<Select
  items={[
    { value: "lisbon", title: "Lisbon", group: "Europe" },
    { value: "london", title: "London", group: "Europe" },
    { value: "tokyo", title: "Tokyo", group: "Asia" },
    { value: "seoul", title: "Seoul", group: "Asia", disabled: true },
  ]}
  groupClass="px-2 pb-1 pt-2 text-xs text-muted-foreground"
  trigger={trigger}
/>
```

행은 팝업의 스크롤 뷰 안에서 가상화된 목록으로 렌더링됩니다. 항목이 수천 개여도 화면에 보이는 행만 만들어지며, 행의 높이가 사용 가능한 공간보다 크면 팝업이 스크롤됩니다.

<a id="value"></a>

## 값

`value`를 지정하면 앱이 선택된 항목을 소유합니다. Select는 그 값의 항목을 표시하고 선택은 `onChange({ value })`로 알립니다. 앱은 `value`을 설정해 이를 따르거나 자체 값을 유지할 수 있습니다. `value={null}`는 아무것도 선택되지 않은 상태입니다. 생략하면 Select가 자체 값을 유지하며, 처음에는 `defaultValue`의 값을 사용합니다. `onChange`는 변경을 알립니다. 이미 선택된 항목을 다시 선택하면 목록이 닫힙니다.

`cleanable`는 항목이 선택되어 있는 동안 지우기 버튼을 추가합니다. 누르면 값이 지워지고 `onChange({ value: null })`로 알리며, 목록은 닫힌 채로 유지됩니다. 이 버튼은 Select의 뷰에서 트리거의 안이 아니라 트리거 뒤에 오므로, 버튼을 눌러도 목록이 열리지 않습니다. 앱이 버튼을 배치하고(`absolute`로 트리거의 끝, 즉 쉐브론이 있을 자리에 겹칩니다) 내용을 채웁니다:

```tsx
<Select
  items={fonts}
  value={font()}
  onChange={({ value }) => font.set(value)}
  cleanable
  clearButtonAccessibilityLabel="Clear the font"
  clearButtonClass="absolute right-2 top-2 size-5 items-center justify-center rounded-full hover:bg-accent"
  clearButton={<Text class="text-xs text-muted-foreground">✕</Text>}
  trigger={trigger}
/>
```

트리거는 앱의 요소이므로 선택된 항목에 대해 앱이 원하는 것을 무엇이든 표시할 수 있습니다: 제목, 아이콘, 아무것도 선택되지 않았을 때의 플레이스홀더. TSX에서는 전달한 요소가 곧 트리거입니다. 이 요소가 콤보박스이며 누름, 키보드 포커스, 확장 상태, `disabled`을 직접 처리합니다. 따라서 요소 자체의 `active:`, `focus:`, `disabled:` 클래스가 Select를 따르고, 요소 자체의 `onPress`도 함께 실행되며, 목록은 이 요소를 기준으로 배치되고 너비도 같습니다.

<a id="open-state"></a>

## 열림 상태

`open`가 없으면 Select가 자체 열림 상태를 유지합니다(`defaultOpen`에서 시작). `open`를 지정하면 앱이 열림 상태를 소유하고 `onOpenChange({ open, reason })`에서 변경합니다: `"triggerPress"`(트리거를 누르거나 트리거의 키를 누름), `"select"`(선택), `"pressOutside"`, `"backdropPress"`, `"cancel"`(Escape 또는 뒤로 가기). `onOpen`와 `onClose`은 목록이 표시된 시점과 사라진 시점(시트의 경우 들어온 뒤와 나간 뒤)을 알려 주고, `onCancel`는 사용자가 선택하지 않고 닫았음을 알려 줍니다.

<a id="search"></a>

## 검색

`searchable`는 항목 위에 검색 필드를 둡니다. 입력하면 대소문자를 무시하고 제목으로 항목을 필터링하며, 일치하는 항목이 없는 섹션은 헤더와 함께 사라집니다. 강조는 첫 번째 일치 항목으로 이동하고, 필드가 키보드를 가진 동안에도 키로 강조를 계속 옮길 수 있으며, Return으로 선택합니다. `empty`는 일치하는 항목이 없을 때 목록에 표시되는 내용입니다:

```tsx
<Select
  items={zones}
  searchable
  searchPlaceholder="Search time zones"
  searchAccessibilityLabel="Search time zones"
  searchClass="mx-1 mb-1 rounded-md border border-input px-2 py-1.5 text-sm"
  empty={<Text class="px-2 py-6 text-center text-sm text-muted-foreground">No time zone found</Text>}
  trigger={trigger}
/>
```

데스크톱에서는 목록이 열릴 때 검색 필드가 키보드를 가져가고, 터치 화면에서는 필드를 누르면 키보드가 올라옵니다. 열 때마다 검색어는 비어 있는 상태로 시작합니다.

<a id="rows-the-app-draws"></a>

## 앱이 그리는 행

`itemClass`는 각 항목의 행을 스타일링하며, 행에는 `renderItem`가 그리기 전까지 항목의 제목이 표시됩니다. `focus:`는 강조된 행(키나 포인터가 있는 곳)에, `selected:`는 선택된 행에, `disabled:`는 비활성화된 행에 적용됩니다. 행을 직접 그리려면 `renderItem`를 지정하세요. 이 함수는 항목이 무엇인지([`SelectEntry`](#types))를 받아 행의 내용을 반환하며, 화면에 보이는 행에 대해서만 호출됩니다. 행의 상태는 전달되지 않습니다. `itemClass`에서 `group`를 사용하면 내용이 `group-focus:`, `group-selected:`, `group-disabled:` 클래스로 행의 상태를 따르므로, 그리기는 항목마다 한 번만 이루어지고 강조의 이동이나 선택이 있어도 다시 그리지 않습니다. `renderGroup`도 섹션 헤더를 같은 방식으로 그립니다:

```tsx
<Select
  items={fonts}
  itemClass="group rounded-md focus:bg-accent disabled:opacity-50"
  renderItem={(item) => (
    <View class="flex-row items-center gap-2 px-2 py-1.5">
      <Text class="flex-1 text-sm" style={{ fontFamily: item.value }}>{item.title}</Text>
      <Text class="w-4 text-right text-sm opacity-0 group-selected:opacity-100">✓</Text>
    </View>
  )}
  renderGroup={(group) => <Text class="px-2 pt-2 text-xs font-medium text-muted-foreground">{group.title}</Text>}
  trigger={trigger}
/>
```

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 항목, 순서대로. |
| `value` | `.value(..)` | `string \| null` | 없음 | 앱이 소유하는, 선택된 항목의 `value`. 선택 없음은 `null`. 생략하면 Select가 자체 값을 유지합니다. |
| `defaultValue` | `.default_value(..)` | `string` | 없음 | `value`가 없을 때의 초기 값. |
| `open` | `.open(..)` | `boolean` | 없음 | 앱이 소유하는 열림 상태. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | `open`가 없을 때의 초기 열림 상태. |
| `searchable` | `.searchable(..)` | `boolean` | `false` | 항목 위의 검색 필드가 제목으로 항목을 필터링합니다. |
| `searchPlaceholder` | `.search_placeholder(..)` | `string` | 없음 | 검색 필드의 플레이스홀더. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 검색 필드를 부르는 이름: 무엇을 검색하는지. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 항목이 선택되어 있는 동안 지우기 버튼을 표시합니다. 누르면 값이 지워집니다(`onChange({ value: null })`). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 닫힌 채로 유지됩니다. 트리거는 누름과 키보드 포커스를 받지 않으며, `disabled:` 스타일이 적용됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 Select를 부르는 이름: 무엇에 대한 선택인지. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 데스크톱: 목록이 놓이는 트리거의 쪽. 그쪽에만 공간이 있으면 반대쪽에 놓입니다. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | 데스크톱: 트리거와 정렬되는 방식. |
| `offset` | `.offset(..)` | `number` | `0` | 데스크톱: 트리거와 목록 사이의 간격. |
| `margin` | `.margin(..)` | `number` | `0` | 데스크톱: 안전 영역의 가장자리와 유지하는 거리. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 목록이 들어 있는 팝업(데스크톱) 또는 시트(터치 화면). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 터치 화면: 시트 뒤의 배경막. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 목록, 즉 행의 스크롤 뷰. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 항목의 행. 텍스트 스타일은 제목이 상속합니다: 강조된 동안 `focus:`, 선택된 동안 `selected:`, 선택할 수 없는 동안 `disabled:`. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 섹션의 헤더. |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<InputStyle>` | 없음 | 검색 필드: 박스와 텍스트(`color`, `fontSize`, `placeholderColor`). |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 지우기 버튼(`cleanable`). Select와 함께 `disabled:`. |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 없음 | 지우기 버튼의 내용: 십자 표시, 아이콘. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 지우기 버튼을 부르는 이름. |
| `trigger` | `.trigger(..)` | `JSX.Element` | 없음 | 누르면 목록이 열리는 요소. 목록은 이 요소를 기준으로 배치됩니다. |
| `empty` | `.empty(..)` | `JSX.Element` | 없음 | 표시할 항목이 없을 때(일치하는 검색 결과가 없을 때) 목록에 표시되는 내용. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 없음 | 항목이 무엇인지에 따라 앱이 그리는 항목의 행(상태는 행의 클래스). 지정하지 않으면 항목의 제목. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 없음 | 앱이 그리는 섹션의 헤더. 지정하지 않으면 섹션의 제목. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 트리거를 감싸는 뷰. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 사용자가 다른 항목을 선택했습니다(누름, Return 또는 Space, 트리거에서의 typeahead): 그 항목의 `value`. 지우기 버튼이 값을 지웠으면 `null`. 이를 따르려면 `value`를 설정하세요. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 목록이 열리거나 닫혔으며, 그 이유가 함께 전달됩니다. 이를 따르려면 `open`를 설정하세요. |
| `onOpen` | `.on_open(\|\| ..)` | 목록이 표시되었습니다. 시트의 경우 들어온 뒤. |
| `onClose` | `.on_close(\|\| ..)` | 목록이 사라졌습니다. 시트의 경우 나간 뒤. 앱이 닫은 경우에도 발생합니다. |
| `onCancel` | `.on_cancel(\|\| ..)` | 사용자가 선택하지 않고 목록을 닫았습니다(Escape 또는 뒤로 가기, 바깥이나 배경막을 누름). |

이벤트는 다음 순서로 발생합니다: 선택이면 `onChange`, 선택 없이 닫은 경우에는 `onCancel`, 그다음 `onOpenChange`, 그다음 목록이 표시되거나 사라진 뒤에 `onOpen` 또는 `onClose`.

<a id="types"></a>

<a id="types"></a>

## 타입

| 타입 | 멤버 | 설명 |
|---|---|---|
| `SelectItem` | `value: string`, `title: string`, `disabled?: boolean`, `group?: string` | `items`의 항목. |
| `SelectEntry` | `value`, `title`, `disabled`, `group?`(항목의 것), `index: number` | `renderItem`가 받는 것: 항목과 `items` 안에서의 인덱스. 상태(행의 `focus:`, `selected:`, `disabled:`)는 전달되지 않습니다. |
| `SelectGroup` | `title: string` | `renderGroup`가 받는 것: 섹션의 `group`. |

Rust에서는 `nsh_base::SelectItem`, `SelectEntry`, `SelectGroup`입니다. `value`는 `SelectValue`(값에는 `Controlled(Some(..))`, `null`에는 `Controlled(None)`)이며, `.value(..)`가 `Option<SharedString>` 또는 문자열로부터 만듭니다.

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 위치 | 스타일 지정 |
|---|---|---|
| 트리거 | Select의 뷰 | 앱의 자체 요소(`trigger`) |
| 지우기 버튼 | Select의 뷰, 트리거 뒤(`cleanable`, 항목이 선택된 동안) | `clearButtonClass`, `clearButtonStyle`. 내용은 `clearButton` |
| 팝업 또는 시트 | 모든 것 위, 트리거 위치(데스크톱) 또는 하단(터치 화면) | `popupClass`, `popupStyle` |
| 배경막 | 시트 뒤(터치 화면) | `backdropClass`, `backdropStyle` |
| 검색 필드 | 팝업, 맨 앞(`searchable`) | `searchClass`, `searchStyle`, `searchPlaceholder`, `searchAccessibilityLabel` |
| 목록 | 팝업, 검색 필드 뒤 | `listClass`, `listStyle` |
| 섹션 헤더 | 목록, 섹션의 항목 앞 | `groupClass`, `groupStyle`, `renderGroup` |
| 항목의 행 | 목록 | `itemClass`, `itemStyle`, `renderItem`(안쪽의 `group-focus:`, `group-selected:`, `group-disabled:`, `itemClass`의 `group` 아래) |
| 빈 상태 | 팝업, 표시할 항목이 없는 동안 | 자체 요소(`empty`) |

팝업은 열(column)입니다. 높이는 검색 필드와 행을 따르므로, `popupClass`의 `max-h-*`이 높이를 제한하고 목록은 그 안에서 스크롤됩니다.

<a id="keyboard"></a>

## 키보드

데스크톱에서 Tab은 `disabled`이 아닌 Select의 트리거에 도달합니다. 목록이 닫혀 있을 때 아래 방향키, 위 방향키, Return, Space는 선택된 항목에서 목록을 엽니다(선택된 항목이 없으면 위 방향키는 활성화된 마지막 항목에서, 나머지는 첫 항목에서 엽니다). 문자와 숫자는 네이티브 select처럼 입력한 내용으로 시작하는 제목의 항목을 선택합니다. 목록이 열려 있을 때:

| 키 | 동작 |
|---|---|
| 아래 방향키, 위 방향키 | 다음 또는 이전의 활성화된 항목. 끝에서는 반대쪽 끝으로 순환합니다. |
| Home, End | 활성화된 첫 항목 또는 마지막 항목(검색 필드가 키보드를 가진 동안에는 필드 자체의 동작). |
| Page Down, Page Up | 한 페이지만큼의 행만큼 앞으로 또는 뒤로. |
| Return | 강조된 항목을 선택하고 목록을 닫습니다. |
| Space | 강조된 항목을 선택합니다(검색 필드가 없을 때). |
| 문자, 숫자 | 마지막 1초 동안 입력한 내용으로 제목이 시작하는 다음 항목(검색 필드가 없을 때). |
| Escape | 선택하지 않고 목록을 닫습니다. |

목록이 닫히면 바깥을 눌러 포커스가 다른 곳으로 옮겨진 경우를 제외하고 키보드 포커스가 트리거로 돌아갑니다. 포인터는 위로 지나가는 행을 강조하고, 키로 이동한 강조된 행은 화면에 보이도록 스크롤됩니다.

<a id="on-each-device"></a>

## 기기별 동작

| | 데스크톱과 데스크톱 브라우저 | 휴대폰과 태블릿 |
| --- | --- | --- |
| 목록 | 트리거 위의 팝업이며 선택된 행이 트리거 위에 겹칩니다(선택된 항목이 없으면 트리거 아래). `popupStyle`가 너비를 지정하지 않는 한 트리거와 같은 너비이고, 높이는 행의 높이만큼이되 화면의 여유 공간까지입니다 | 배경막 위의 하단 시트이며, 높이는 행의 높이만큼이되 상태 표시줄까지입니다 |
| 닫기 | 선택, Escape, 바깥 누름(포인터 아래에 있는 요소로 이어집니다) | 선택, 배경막, Android 뒤로 가기 버튼 |
| 검색 | 목록이 열릴 때 필드가 키보드를 가져갑니다 | 필드를 누르면 키보드가 올라옵니다 |
| 선택 | 누르는 순간 선택되므로 검색 필드가 키보드를 유지합니다 | 탭 |

`popupClass`는 데스크톱에서는 팝업을, 휴대폰에서는 시트를 스타일링합니다. 둘 사이에서 달라지는 스타일은 `platform.idiom`(`nsh/device`)를 `"desktop"`와 비교할 수 있습니다.
<a id="accessibility"></a>

## 접근성

- 트리거는 스크린 리더에서 콤보박스로 인식됩니다. 레이블은 `accessibilityLabel`이고, 값은 선택된 항목의 제목이며, 목록이 펼쳐져 있는지 여부도 알려 줍니다. `disabled`는 트리거를 흐리게 표시합니다.
- 지우기 버튼은 `clearButtonAccessibilityLabel`이라는 이름이 붙은 버튼이며, Tab 키 이동 대상이 아닙니다.
- 검색 필드는 `searchAccessibilityLabel`이라는 이름이 붙은 텍스트 필드입니다. 플레이스홀더는 필드가 비어 있는 동안 표시되는 힌트입니다.
- 목록은 listbox이고 각 행은 option이며, 항목의 제목이 이름으로 쓰입니다. 선택된 option은 선택됨 상태로, 비활성화된 option은 흐리게 표시됩니다. 섹션의 헤더는 헤더로 인식됩니다.
- 키 입력으로 하이라이트가 이동하면 스크린 리더의 포커스도 하이라이트된 행으로 이동합니다. 검색 필드가 키보드 입력을 받고 있는 동안에는 대신 하이라이트된 항목의 제목이 안내되므로, 입력을 계속할 수 있습니다.

레이블, 역할, 안내 방식에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.
