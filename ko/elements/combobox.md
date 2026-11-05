---
title: "Combobox"
description: "Combobox 컴포넌트: 입력란에 입력하여 필터링되는 항목 목록에서 하나 또는 여러 값을 선택합니다. 데스크톱에서는 필드 아래에 팝업으로, 휴대폰에서는 시트로 표시되며, 앱에서 스타일을 지정합니다."
group: base
demo: el-combobox
source_hash: 278180c11b9d894f
---

# Combobox

Combobox는 항목 목록에서 값을 선택합니다. 하나를 고를 수도 있고, `multiple`를 사용하면 여러 개를 고를 수도 있습니다. 게시물의 태그, 채널의 멤버, 문서의 언어가 그 예입니다. 트리거는 입력 필드입니다. 입력하면 목록이 열리고 필터링되며, 이는 shadcn/ui의 combobox와 같습니다. [Select](./select.md)의 형제 컴포넌트로 목록을 공유하며, 각 기기에 맞는 방식으로 표시합니다.

- 데스크톱과 데스크톱 브라우저에서는 필드 아래에 팝업이 표시됩니다. 너비는 필드와 같고(앱의 `popupStyle` / `popupClass` 너비로 바꿀 수 있습니다), 높이는 행의 높이에 맞추되 주변의 여유 공간까지만 늘어납니다.
- 폰과 태블릿에서는 배경막 위, 화면 하단에 시트가 표시됩니다.

Combobox는 값(앱이 관리하거나 자체 관리), 열림 상태, 키보드, 검색, 섹션, 하이라이트된 행, 스크린 리더가 읽는 내용을 담당합니다. `multiple`를 사용하면 선택은 값에서 항목을 토글하고 목록은 열린 채로 유지되므로, 한 번에 여러 개를 고를 수 있습니다. 외형은 앱이 정합니다. 필드, 팝업, 목록, 행, 섹션 헤더, 입력, 푸터의 스타일을 지정하거나 행을 직접 그립니다.

```rust tabs
use nsh_base::{SelectEntry, SelectItem, combobox, theme};
use nsh_core::prelude::*;

const TAGS: [(&str, &str); 5] = [
    ("bug", "Bug"),
    ("design", "Design"),
    ("docs", "Docs"),
    ("perf", "Performance"),
    ("security", "Security"),
];

fn tag_picker() -> impl IntoElement {
    let tags = signal(Vec::<SharedString>::new());
    let title = move || match tags.get().len() {
        0 => "Add tags".to_string(),
        n => format!("{n} tags"),
    };
    combobox()
        .items(
            TAGS.iter()
                .map(|&(value, title)| SelectItem::new(value, title))
                .collect::<Vec<_>>(),
        )
        .multiple(true)
        .placeholder(title)
        .value(move || Some(tags.get()))
        .on_change(move |next: &Vec<SharedString>| tags.set(next.clone()))
        .accessibility_label("Tags")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_1()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .h_9()
        .w_48()
        .px_3()
        .flex_row()
        .items_center()
        .rounded_md()
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_sm())
        .trigger_button(text("⌄"))
        .item_class("rounded-md focus:bg-accent selected:font-medium disabled:opacity-50")
        .render_item(|item: &SelectEntry| view().px_2().py_1p5().child(text(item.title.clone()).text_sm()))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Combobox } from "nsh/base";

const TAGS = [
  { value: "bug", title: "Bug" },
  { value: "design", title: "Design" },
  { value: "docs", title: "Docs" },
  { value: "perf", title: "Performance" },
  { value: "security", title: "Security" },
];

function App() {
  const tags = signal<string[]>([]);
  return (
    <Combobox
      items={TAGS}
      multiple
      placeholder={tags().length ? `${tags().length} tags` : "Add tags"}
      value={tags()}
      onChange={({ value }) => tags.set(value)}
      accessibilityLabel="Tags"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      class="h-9 w-48 flex-row items-center rounded-md border border-input px-3"
      inputClass="flex-1 text-sm placeholder:text-muted-foreground"
      itemClass="group rounded-md px-2 py-1.5 text-sm focus:bg-accent focus:text-accent-foreground"
      triggerButton={<Text class="px-1 text-muted-foreground">⌄</Text>}
      renderItem={(item) => (
        <View class="flex-row justify-between">
          <Text>{item.title}</Text>
          <Text class="opacity-0 group-selected:opacity-100">✓</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Combobox`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `combobox()`가 prop마다 setter를, 이벤트마다 리스너(`.on_change(..)`)를 가진 인스턴스를 만듭니다(`.items(..)`, `.value(..)`, `.multiple(..)`). 항목은 `Select`의 항목과 같습니다. `.disabled(..)`와 `.group(..)`를 가진 `SelectItem::new(value, title)`이며, select와 마찬가지로 섹션으로 묶을 수 있습니다([항목](./select.md#items) 참고).

<a id="value"></a>

## 값

값은 선택된 항목들의 값으로 이루어진 배열입니다. `value`를 사용하면 앱이 값을 소유합니다. Combobox는 해당 항목을 선택된 상태로 표시하고 변경이 있을 때마다 `onChange({ value })`로 알리며, 앱은 `value`를 설정해 이를 따라가거나 자체 값을 유지합니다. 생략하면 Combobox가 자체 값을 유지하며, 처음에는 `defaultValue`의 값을 사용합니다.

- `multiple`를 사용하면 누르기, Return, Space가 하이라이트된 항목을 토글합니다. 값에 없었다면 추가하고, 있었다면 제거합니다. 목록은 열린 채로 유지됩니다.
- 사용하지 않으면 선택이 값을 해당 항목의 값으로 바꾸고 목록을 닫습니다. 이미 선택된 항목을 다시 선택하면 목록만 닫힙니다.

`onConfirm({ value })`는 목록이 닫힐 때 값을 알립니다. 어떤 방식으로 닫히든(선택, Escape, 바깥 누르기, 트리거 버튼) 열릴 때마다 한 번, 사용자가 남긴 그대로의 값과 함께 호출됩니다. Mac에서는 Cmd+Return(그 외에서는 Ctrl+Return)이 목록을 닫고 확정합니다.

`cleanable`는 항목이 선택되어 있는 동안 지우기 버튼을 추가합니다. 누르면 값이 비워집니다(`onChange({ value: [] })`). 버튼은 입력 뒤, 트리거 버튼 앞에 놓이며, 이 버튼을 눌러도 목록은 열리지 않습니다. 버튼의 내용은 [select의 지우기 버튼](./select.md#value)처럼 앱이 채웁니다.

<a id="input"></a>

## 입력

트리거는 Combobox의 행 안에 있는 텍스트 입력입니다(필드의 테두리와 채우기인 `class`와 `style`). 그 앞에 앱의 `prefix`(칩으로 표시된 선택 항목, 아이콘)이 오고, 뒤에 지우기 버튼, 앱의 `triggerButton`(셰브론), `suffix`가 옵니다.

- 입력하면 목록이 열리고 대소문자를 무시하고 제목으로 항목을 필터링하며, 일치하는 항목이 없는 동안에는 `empty`가 표시됩니다. 아래쪽 및 위쪽 화살표 키로도 열 수 있고, 트리거 버튼을 누르면 열고 닫으며, 터치 스크린에서는 입력을 탭하면 열립니다.
- 값이 하나일 때 입력에는 선택된 항목의 제목이 표시됩니다(선택된 항목이 없는 동안에는 `placeholder`). 입력이 포커스를 받으면 이 텍스트가 선택되므로, 입력한 내용이 그것을 대체합니다.
- `multiple`를 사용하면 입력에는 쿼리가 표시되며, 선택된 항목은 앱이 `prefix` 안이나 Combobox 옆에 표시합니다.

쿼리는 Combobox 자체의 것으로, 열릴 때마다 `defaultQuery`(없으면 빈 값)에서 시작합니다. 또는 `query`로 앱이 관리할 수도 있습니다. `onQueryChange({ query })`가 입력된 내용을 알리고, 앱은 `query`를 설정해 이를 따라가며 자체 방식으로 필터링하거나 시작점을 제안할 수 있습니다.

<a id="footer"></a>

## 푸터

`footer`는 행 아래에 있는 별도의 영역(`footerClass`, `footerStyle`)에 들어가는 콘텐츠입니다. 동작("Manage tags"), 개수, 힌트 등이 해당합니다. 행이 스크롤되는 동안에도 제자리에 고정됩니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `items` | `.items(..)` | `SelectItem[]` | `[]` | 항목들, 순서대로. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 선택이 값에서 항목을 토글하며 목록은 열린 채로 유지됩니다. |
| `value` | `.value(..)` | `string[]` | 없음 | 선택된 항목들의 값. 앱이 소유합니다. |
| `defaultValue` | `.default_value(..)` | `string[]` | `[]` | `value`를 사용하지 않을 때의 초기 값. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | 열림 상태. 앱이 관리하거나 Combobox 자체가 관리합니다. |
| `placeholder` | `.placeholder(..)` | `string` | 없음 | 입력이 비어 있는 동안 표시되는 입력의 placeholder. |
| `query` | `.query(..)` | `string` | 없음 | 쿼리. 앱이 소유합니다. |
| `defaultQuery` | `.default_query(..)` | `string` | 없음 | `query`를 사용하지 않을 때, 열릴 때마다 시작하는 쿼리. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | 항목이 선택되어 있는 동안 표시되는 지우기 버튼. 누르면 값이 비워집니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 닫힌 상태를 유지하며 누르기와 키보드 포커스를 받지 않습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 선택이 무엇에 관한 것인지, 스크린 리더용. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | `Select`와 동일 | `"bottom"`, `"start"`, 0, 0 | 데스크톱: 필드를 기준으로 팝업이 놓이는 위치. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 팝업(데스크톱) 또는 시트(터치 스크린). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 시트 뒤의 배경막. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 목록, 즉 행들의 스크롤 뷰. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 항목의 행. 하이라이트된 동안은 `focus:`, 선택된 동안은 `selected:`, 선택할 수 없는 동안은 `disabled:`. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 섹션의 헤더. |
| `inputClass`, `inputStyle` | `.input_class(..)`, `.input_style(..)` | `string`, `StyleProp<InputStyle>` | 없음 | 입력. 편집 중에는 `focus:`, Combobox와 함께일 때는 `disabled:`. |
| `footerClass`, `footerStyle` | `.footer_class(..)`, `.footer_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 행 아래의 푸터. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 지우기 버튼(`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | 없음 | 지우기 버튼의 내용. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | 없음 | 스크린 리더가 지우기 버튼을 부르는 이름. |
| `triggerButton` | `.trigger_button(..)` | `JSX.Element` | 없음 | 입력 뒤의 버튼(셰브론). 누르면 목록이 열리고 닫힙니다. |
| `prefix` | `.prefix(..)` | `JSX.Element` | 없음 | 입력 앞의 콘텐츠: 칩, 아이콘. |
| `suffix` | `.suffix(..)` | `JSX.Element` | 없음 | 트리거 버튼 뒤의 콘텐츠. |
| `empty` | `.empty(..)` | `JSX.Element` | 없음 | 표시할 항목이 없는 동안 목록이 보여 주는 내용. |
| `footer` | `.footer(..)` | `JSX.Element` | 없음 | 행 아래에 표시되는 내용. |
| `renderItem` | `.render_item(..)` | `(item: SelectEntry) => JSX.Element` | 없음 | 앱이 항목의 상태가 아니라 항목 자체를 기준으로 그리는 항목의 행. 내용은 행의 `group-focus:`, `group-selected:`, `group-disabled:`(`itemClass`의 `group`)를 따르므로 하이라이트 이동이나 토글로는 다시 그려지지 않습니다. 지정하지 않으면 항목의 제목이 표시됩니다. |
| `renderGroup` | `.render_group(..)` | `(group: SelectGroup) => JSX.Element` | 없음 | 앱이 그리는 섹션의 헤더. 지정하지 않으면 섹션의 제목이 표시됩니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 필드: 접두사, 입력, 버튼, 접미사로 이루어진 행. 목록의 너비는 이 필드와 같습니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | 값이 변경되었습니다(선택, 토글, 지우기 버튼): `{ value }`, 선택된 항목들의 값. `value`를 설정해 이를 따라갑니다. |
| `onConfirm` | `.on_confirm(\|value\| ..)` | 목록이 닫혔습니다. 열릴 때마다 한 번, 그 시점의 `{ value }`와 함께 호출됩니다. |
| `onQueryChange` | `.on_query_change(\|query\| ..)` | 사용자가 입력에 입력했습니다: `{ query }`. `query`를 설정해 이를 따라갑니다. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | 목록이 열리거나 닫혔으며, 그 이유(`{ open, reason }`)가 함께 전달됩니다. `open`를 설정해 이를 따라갑니다. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | 목록이 표시되었거나 사라졌습니다. |
| `onCancel` | `.on_cancel(..)` | 사용자가 목록을 닫는 선택 없이 목록을 닫았습니다(Escape 또는 뒤로 가기, 바깥이나 배경막 누르기). |

순서는 다음과 같습니다. 선택에는 `onChange`, 선택 없이 닫는 경우에는 `onCancel`, 그다음 `onOpenChange`, 목록이 닫히면서 `onConfirm`, 목록이 표시되거나 사라지면 `onOpen` 또는 `onClose`가 호출됩니다.

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 |
|---|---|---|
| 필드 | Combobox의 뷰, 하나의 행 | `class`, `style` |
| 접두사 | 필드, 맨 앞 | 앱 자체의 요소(`prefix`) |
| 입력 | 필드, 접두사 뒤 | `inputClass`, `inputStyle`, `placeholder` |
| 지우기 버튼 | 필드, 입력 뒤(항목이 선택되어 있는 동안 `cleanable`) | `clearButtonClass`, `clearButtonStyle`. 내용은 `clearButton` |
| 트리거 버튼 | 필드, 지우기 버튼 뒤 | 앱 자체의 요소(`triggerButton`) |
| 접미사 | 필드, 맨 끝 | 앱 자체의 요소(`suffix`) |
| 팝업 또는 시트 | 모든 요소 위, 필드 아래(데스크톱) 또는 하단(터치 스크린) | `popupClass`, `popupStyle` |
| 배경막 | 시트 뒤(터치 스크린) | `backdropClass`, `backdropStyle` |
| 목록 | 팝업 | `listClass`, `listStyle` |
| 섹션의 헤더 | 목록, 섹션의 항목 앞 | `groupClass`, `groupStyle`, `renderGroup` |
| 항목의 행 | 목록 | `itemClass`, `itemStyle`, `renderItem`(안쪽의 `group-focus:`, `group-selected:`, `group-disabled:`, `itemClass`의 `group` 아래) |
| 빈 상태 | 팝업, 표시할 항목이 없는 동안 | 자체 요소(`empty`) |
| 푸터 | 팝업, 맨 끝 | `footerClass`, `footerStyle`. 내용은 `footer` |

<a id="keyboard"></a>

## 키보드

입력이 포커스를 유지하는 동안의 키는 select의 키와 같으며([키보드](./select.md#keyboard) 참고), 다음 차이가 있습니다. 문자와 숫자는 타입어헤드가 아니라 입력에 입력되어 목록을 필터링합니다. 아래쪽 및 위쪽 화살표 키는 닫힌 목록을 엽니다. `multiple`를 사용하면 Return이 하이라이트된 항목을 토글하고 목록을 열린 채로 유지합니다. Mac에서는 Cmd+Return(그 외에서는 Ctrl+Return)이 목록을 닫고 확정합니다. 데스크톱에서 목록이 닫힐 때 입력은 포커스를 유지합니다.

<a id="accessibility"></a>

## 접근성

- 입력은 스크린 리더에게 combobox로 인식됩니다. 레이블은 `accessibilityLabel`이고, 값은 선택된 항목들의 제목을 쉼표로 이어 붙인 것이며, 목록이 펼쳐져 있는지도 알려 줍니다. `disabled`는 입력을 흐리게 표시합니다.
- 목록은 listbox이고 각 행은 option이며, 제목이 이름이 됩니다. 선택된 option은 선택됨으로, 비활성 option은 흐리게 표시됩니다. 섹션의 헤더는 헤더로 인식됩니다.
- 지우기 버튼은 `clearButtonAccessibilityLabel`로 이름이 지정되는 버튼이며 Tab 정지 지점이 아닙니다. 트리거 버튼은 입력이 목록의 열림 여부를 알려 주므로 스크린 리더에서 숨겨지며, 마찬가지로 Tab 정지 지점이 아닙니다.

레이블, 역할, 안내 방송에 관한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.
