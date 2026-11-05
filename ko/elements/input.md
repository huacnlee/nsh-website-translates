---
title: "Input"
description: "네이티브 텍스트 필드: 제어 및 비제어 텍스트, 키보드, 자동 완성, 선택, 여러 줄 입력, 포커스를 다룹니다."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input`은(는) 네이티브 텍스트 필드입니다. iOS와 Mac Catalyst에서는 UITextField(한 줄) 또는 UITextView(여러 줄)이고, Android에서는 EditText입니다. 입력, 캐럿, 선택, 자동 수정, 자동 완성은 플랫폼 자체의 기능을 그대로 사용합니다. Rust에서는 `nsh_base::input()`으로, TSX에서는 `nsh/base`의 `<Input>`로 만듭니다.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Controlled와 Uncontrolled

- **Controlled**: `value`을 전달하고 `onChange`에서 갱신합니다. 앱은 사용자가 입력한 내용을 고쳐 쓸 수 있습니다(공백 제거, 형식 지정 등). 텍스트에는 편집 내용이 즉시 표시되고, 새 `value`이 도착하면 교정됩니다. 네이티브 편집마다 횟수가 함께 전달되며, 앱이 보낸 `value`은 최신 편집을 기준으로 한 경우에만 적용되므로, 업데이트가 느리더라도 더 최근의 입력이 항상 우선합니다.
- **Uncontrolled**: `defaultValue`(`.default_value(..)` 또는 아무것도 전달하지 않음)을 전달하고, 텍스트는 `onChange` 또는 `onSubmit`에서 읽습니다.

사용자가 입력하는 동안 반드시 지켜져야 하는 규칙은 props이며 네이티브에서 처리됩니다. `maxLength`은 길이를 제한하고 `submitBehavior`은 return 키의 동작을 결정합니다. [폼과 키보드](../docs/forms-and-keyboard.md)를 참고하세요.

## Props

[공통 props](./index.md#common-props) 외에(`style`는 `TextStyle` 타입이며, 글꼴, 색상, 정렬, 뷰 스타일이 적용됩니다):

<a id="text"></a>

### 텍스트

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | 앱이 제어하는 텍스트입니다. |
| `defaultValue` | `.default_value(..)` | `string` | | 초기 텍스트입니다. |
| `placeholder` | `.placeholder(..)` | `string` | | 입력이 비어 있는 동안 표시됩니다. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | 여러 줄 입력입니다. `submitBehavior`에서 달리 지정하지 않는 한 return은 줄바꿈을 삽입합니다. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | 여러 줄 입력의 스크롤 바입니다. 플랫폼의 표시기이거나, 앱이 설정한 경우 앱의 내장 바입니다([Scrollbar](./scrollbar.md#built-in-bars)). 객체는 자체 테마이며, `false`는 표시하지 않음을 뜻합니다. |
| `maxLength` | `.max_length(..)` | `number` | | 사용자가 입력할 수 있는 최대 문자 수입니다. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | 사용자가 텍스트를 선택하고 복사할 수는 있지만 변경할 수는 없습니다. |
| `masked` | `.masked(..)` | `boolean` | `false` | 텍스트를 숨깁니다(비밀번호). |
| `allowFontScaling` | | `boolean` | `true` | 시스템 텍스트 크기를 따릅니다. |
| `maxFontSizeMultiplier` | | `number` | `0` | 시스템 배율의 상한입니다(0은 제한 없음). |

<a id="keyboard"></a>

### 키보드

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | 키보드 레이아웃입니다([값 목록](../docs/forms-and-keyboard.md#keyboards-and-autofill). iOS에서 `numbers-and-punctuation`에는 마이너스 기호가 있습니다). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | return 키의 레이블입니다. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 자동 대문자 변환입니다. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | 시스템의 자동 교정입니다. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | iOS, Android, 웹에서 자동 완성을 위해 입력이 담는 내용을 지정합니다: `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | 붙여넣기 시의 동작입니다. `"insert"`은 붙여넣은 텍스트를 삽입하고, `"report"`은 아무것도 삽입하지 않아 앱이 `onPaste`이 보고하는 내용을 처리할 수 있게 합니다. 이미지와 파일은 삽입되지 않습니다. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"`(한 줄), `"newline"`(여러 줄) | return 키의 동작입니다. `"submit"`은 `onSubmit`을 보고하고 포커스를 유지하며, `"blurAndSubmit"`은 포커스도 해제하고, `"newline"`은 줄바꿈을 삽입합니다(여러 줄. 한 줄 입력은 제출합니다). 제출하는 여러 줄 입력도 하드웨어 키보드에서는 Shift+Return 또는 Option / Alt+Return으로 줄바꿈을 입력할 수 있습니다. `"submit"`은 키보드를 계속 표시합니다(예: 여러 메시지를 연달아 보낼 때). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 나타날 때 포커스를 받습니다. |

<a id="caret-and-selection"></a>

### 캐럿과 선택

| Prop | Rust | 타입 | 설명 |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | 캐럿을 그립니다(기본값 `true`. `false`은 캐럿을 숨깁니다). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | UTF-16 단위의 제어되는 선택 영역입니다. `end`의 기본값은 `start`입니다(캐럿). |

캐럿은 창이 표시되고 활성 상태인 동안 깜박입니다. Linux의 GPUI 창에서는 GTK 앱과 마찬가지로 입력하거나 이동하지 않은 채 10초가 지나면 계속 표시된 상태로 유지되므로, 포커스된 채 방치된 필드가 프레임을 소모하지 않습니다.

<a id="colors"></a>

### 색상

placeholder, 캐럿, 선택 하이라이트의 색상은 Tailwind 클래스가 있는 스타일 키이며, Rust에서는 메서드로 설정합니다(UIKit은 하나의 색상으로 캐럿과 선택을 함께 칠하며, 설정된 경우 캐럿의 색상을 사용합니다).

| 스타일 키 | Rust | 클래스 | 설명 |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | placeholder의 색상입니다. |
| `caretColor` | `.caret_color(..)` | `caret-*` | 캐럿의 색상입니다. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | 선택 하이라이트의 색상입니다. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| `ios` 키 | Rust | 타입 | 설명 |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | `autoComplete`에 대한 iOS의 이름입니다(`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | 입력에 포커스가 있는 동안 키보드 위에 표시되는 `InputAccessoryView`의 `nativeID`입니다([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)). |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | 키보드의 외관입니다. `"default"`은 시스템의 외관을 따릅니다. Android의 키보드는 시스템 테마를 따릅니다. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | 사용자가 텍스트를 변경했습니다. `value`은 현재 텍스트입니다. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | 제출하는 입력(한 줄, 또는 `submitBehavior` `"submit"` / `"blurAndSubmit"`)에서 return 키를 눌렀습니다. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | 없음 | 입력이 포커스를 얻거나 잃었습니다. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | 캐럿 또는 선택 영역이 이동했습니다(UTF-16 단위). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | 사용자가 붙여넣었습니다. 텍스트, HTML 형식의 서식(Linux, 웹), 이미지(스크린샷)는 `File`로, 로컬 파일은 `file:` URL로 전달됩니다. 삽입될 텍스트의 `onChange`보다 먼저 발생합니다([폼과 키보드](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | 선택과 함께, 또는 텍스트가 스크롤되거나 줄바꿈되면서 캐럿이 이동했습니다. `bounds`는 입력 내에서의 위치, `pageBounds`는 창에서의 위치이며, `Overlay`의 `anchor`입니다([폼과 키보드](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | 텍스트가 변경되기 전입니다. `key`은 입력된 텍스트이며, `"Backspace"` 또는 `"Enter"`입니다. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | 입력하는 동안 텍스트의 크기가 변경되었습니다(여러 줄일 때는 입력의 너비 기준). 비어 있는 입력은 placeholder와 관계없이 빈 줄 하나를 보고합니다. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | 입력기의 조합이 시작, 변경 또는 종료되었습니다. `text`은 조합 중인 내용이며(글자를 선택하기 전의 병음, 변환 전의 가나), 종료되면 `""`입니다. 확정된 텍스트는 종료 전에 `onChange`에 전달됩니다. |

텍스트에 따라 늘어나는 여러 줄 입력:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `focus()` | `focus()` | 입력에 포커스를 주고 키보드를 표시합니다. |
| `blur()` | `blur()` | 포커스를 해제합니다. |
| `setSelection(start, end?)` | `set_selection(start, end)` | `start..end`을 선택합니다(UTF-16 단위). 둘이 같으면 캐럿이 됩니다. |

return 시 다음 필드로 포커스 이동하기:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`nsh`의 `Keyboard.dismiss()`(Rust에서는 `dismiss_keyboard()`)은 어떤 입력이 키보드를 사용 중이든 키보드를 숨깁니다.

<a id="platform-notes"></a>

## 플랫폼 참고

- macOS에서 한 줄 텍스트, placeholder, 캐럿은 네이티브 필드의 글꼴 메트릭을 공유하며 콘텐츠 박스 안에서 함께 가운데 정렬됩니다. `lineHeight`은 레이아웃에 반영되며, 여러 줄 편집기는 단락 간격에도 이를 사용합니다.
- [scroll view](./scroll.md#keyboard) 안의 입력은 네이티브에서 키보드에 가려지지 않도록 유지됩니다. 그 외의 경우에는 [`env(keyboard-inset-height)`](./keyboard.md)의 하단 padding 또는 margin을 사용하세요.
- `disabled`은 비활성 스타일을 적용할 뿐만 아니라 입력을 비활성화합니다(포커스 불가). `readonly` 입력은 포커스와 선택을 유지합니다.
- `inputAccessoryViewID`은 키보드에 액세서리 바가 있는 iOS에서 적용됩니다.
