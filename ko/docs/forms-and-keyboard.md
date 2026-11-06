---
title: "폼과 키보드"
description: "input 요소를 사용한 텍스트 입력 - 제어(controlled) 값과 비제어(uncontrolled) 값, 키보드 유형, 리턴 키, 포커스, 선택 영역, 내용에 따라 늘어나는 여러 줄 입력 - 그리고 소프트웨어 키보드에 콘텐츠가 가려지지 않도록 하는 방법을 다룹니다."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# 폼과 키보드

텍스트 입력은 input 요소이며, Rust에서는 `input()`, TSX에서는 `<Input>`입니다. iOS에서는 UITextField 또는 UITextView, Android에서는 EditText가 됩니다. 타이핑, 캐럿, 선택, 자동 수정, 자동 완성은 플랫폼 고유의 동작이며, 앱은 이벤트를 통해 텍스트를 받고 이를 제어할 수 있습니다. 또한 NSH는 포커스된 input이 소프트웨어 키보드에 가려지지 않도록 자동으로 위쪽에 유지하며, NSH가 스스로 처리할 수 없는 경우를 위해 키보드의 높이를 반응형 값으로 제공합니다.

input은 다른 뷰와 마찬가지로 스타일을 받으므로(Rust에서는 타입이 있는 스타일 메서드, TSX에서는 스타일과 Tailwind 클래스), 폼의 필드가 앱 고유의 모습을 가질 수 있습니다. 레이블이 있는 필드는 직접 만드는 짧은 컴포넌트입니다:

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## 제어형 및 비제어형 input

input에 값을 전달하면(`.value(..)`, TSX `value`) **제어형(controlled)** input입니다. signal이 가진 값을 표시하며, change 이벤트(`.on_change(..)`, TSX `onChange`)에서 signal을 업데이트합니다.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

값을 직접 제어하므로 사용자가 입력한 내용을 변환할 수 있습니다. `.on_change(move |t: &str| tag.set(t.to_uppercase()))`은 대문자로 바꾸고, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}`은 숫자만 남깁니다.

<a id="input-methods"></a>

### 입력기

중국어, 일본어, 한국어 입력기는 텍스트를 확정하기 전에 조합합니다. 병음(pinyin)은 글자를 선택하면 腾으로 바뀝니다. `onCompositionChange`(Rust `.on_composition_change(..)`)은 조합 과정을 보고하며, 사용자가 입력하는 동안에는 `{ composing: true, text: "teng" }`, 조합이 끝나면 `{ composing: false, text: "" }`을 보고합니다. 확정된 텍스트는 종료 이벤트 전에 `onChange`에 도달합니다. iOS, Android, macOS, 웹에서는 이 시스템들이 조합 중인 텍스트를 input 안에 보관하므로 `onChange`도 조합 중인 텍스트를 보고하고, Windows, Linux, GPUI에서는 확정된 텍스트를 보고합니다. 제어형 input은 앱이 값으로 무엇을 하든 조합을 유지합니다. 사용자가 조합하는 동안 설정된 `value`은 조합이 끝난 뒤에 표시되므로, 텍스트를 대문자로 바꾸거나 필터링하는 input도 병음을 입력된 그대로 받습니다.

확정된 텍스트만 검색하는 검색창:

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

값이 없는 input은 **비제어형(uncontrolled)** input입니다. 자체적으로 텍스트를 유지하며 기본값(`.default_value(..)`, TSX `defaultValue`)에서 시작하고, 필요할 때 change 또는 submit 이벤트에서 값을 읽습니다. 비밀번호처럼 제출 시에만 읽는 필드에 사용하세요.

> [!NOTE]
> 제어형 input은 키 입력을 잃지 않습니다. 모든 네이티브 편집에는 편집 횟수(edit count)가 붙으며, JS에서 돌아온 `value`은 최신 편집에 대한 응답일 때만 적용됩니다. JS가 느려서 그 사이 사용자가 더 입력했다면, 오래된 값은 더 새로운 텍스트를 덮어쓰지 않고 버려집니다.

<a id="props"></a>

## 속성(Props)

Rust에서 각 속성은 `input()`의 메서드이며 snake case로 이름이 붙습니다(`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`). 고유한 이름을 가진 것은 다음과 같습니다: `.keyboard_type(KeyboardType::Email)`과 다른 `KeyboardType` variant, `.auto_fill(AutoFill::Email)`(`autoComplete`용), `.keyboard_appearance(..)`과 `.input_accessory(..)`(`ios={{ … }}` 속성용). 각 이벤트는 `on_`의 메서드입니다: `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `value` | `string` | | JS가 제어하는 텍스트. |
| `defaultValue` | `string` | | 비제어형 input의 초기 텍스트. |
| `placeholder` | `string` | | input이 비어 있는 동안 표시됩니다. |
| `masked` | `boolean` | `false` | 텍스트를 숨깁니다(비밀번호). |
| `keyboardType` | `KeyboardType` | `"default"` | 키보드 레이아웃. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | 리턴 키의 레이블. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | 자동 대문자 변환. |
| `autoCorrect` | `boolean` | `true` | 시스템의 자동 수정. |
| `autoComplete` | `AutoComplete` | | 자동 완성을 위해 input이 담는 내용. |
| `multiline` | `boolean` | `false` | 여러 줄. `submitBehavior`에서 달리 지정하지 않는 한 리턴은 줄 바꿈을 삽입합니다. |
| `maxLength` | `number` | | 사용자가 입력할 수 있는 최대 문자 수. |
| `readonly` | `boolean` | `false` | 사용자가 텍스트를 선택하고 복사할 수는 있지만 변경할 수는 없습니다. |
| `autoFocus` | `boolean` | `false` | 나타날 때 포커스됩니다. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | 단일 줄 `"blurAndSubmit"`, 여러 줄 `"newline"` | 리턴 키의 동작: 제출 후 포커스 유지, 제출 후 포커스 해제, 또는 줄 바꿈 삽입(여러 줄 전용). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | 붙여넣기의 동작: 텍스트를 삽입하거나 아무것도 하지 않습니다([붙여넣기](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | 캐럿이 그려집니다. `false`은 캐럿을 숨깁니다. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | 키보드의 외관(iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | 제어형 선택 영역(UTF-16 단위). |
| `allowFontScaling` | `boolean` | `true` | 시스템 텍스트 크기를 따릅니다. |
| `maxFontSizeMultiplier` | `number` | | 시스템 배율의 상한(0: 제한 없음). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: 키보드 위에 표시되는 바(아래 참조). |
| `ios={{ textContentType }}` | `TextContentType` | | `autoComplete` 값에 대한 iOS의 이름. |

이벤트:

| 이벤트 | 페이로드 | 시점 |
|---|---|---|
| `onChange` | `{ value }` | 텍스트가 변경되었습니다. `value`은 현재 텍스트입니다. |
| `onSubmit` | `{ text }` | 제출하는 input(단일 줄, 또는 `submitBehavior` `"submit"` / `"blurAndSubmit"`)에서 리턴 키를 눌렀습니다. |
| `onFocus` / `onBlur` | | input이 포커스를 얻음 / 잃음. |
| `onSelectionChange` | `{ start, end }` | 캐럿 또는 선택 영역이 이동했습니다(UTF-16 단위). |
| `onPaste` | `{ text, html, files, uris }` | 사용자가 붙여넣었습니다: 텍스트, 그 HTML(Linux, 웹), `File` 형태의 이미지, 로컬 파일의 URL([붙여넣기](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | 캐럿이 이동했습니다: input 안과 창 안에서의 위치([캐럿](#the-caret)). |
| `onKeyPress` | `{ key }` | 텍스트가 변경되기 전. `key`은 입력된 텍스트이며, `"Backspace"` 또는 `"Enter"`입니다. |
| `onContentSizeChange` | `{ size }` | 입력하는 동안 텍스트의 크기(`size`)가 변경되었습니다(여러 줄일 때는 input의 너비 기준). 빈 input은 플레이스홀더와 관계없이 빈 한 줄을 보고합니다. |
| `onCompositionChange` | `{ composing, text }` | 입력기의 조합이 시작, 변경 또는 종료되었습니다([입력기](#input-methods) 참조). |

input은 텍스트처럼 스타일을 지정합니다. `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` 및 [텍스트 스타일](./text.md)의 나머지, 그리고 테두리, 패딩, 배경을 사용할 수 있습니다. 포커스 스타일(Rust의 `.focus(|s| ..)`, TSX의 `focus:` Tailwind variant 또는 `focusStyle`)은 input이 포커스를 가진 동안 적용됩니다. 플레이스홀더의 색상은 `.placeholder_color(..)`(`placeholderColor` 스타일 키, `placeholder:text-*`)이고, 캐럿의 색상은 `.caret_color(..)`(`caretColor`, `caret-*`), 선택 하이라이트의 색상은 `.selection_color(..)`(`selectionColor`, `selection:text-*`)입니다. UIKit은 캐럿과 선택 영역을 하나의 색으로 틴트하며, 설정되어 있으면 캐럿의 색을 사용합니다:

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## 키보드와 자동 완성

키보드 타입(`.keyboard_type(..)`, TSX `keyboardType`)이 레이아웃을 정합니다:

| Rust | TSX | 키보드 |
|---|---|---|
| `KeyboardType::Default` | `"default"` | 텍스트. |
| `KeyboardType::Email` | `"email-address"` | `@`과 `.`을 바로 입력할 수 있는 텍스트. |
| `KeyboardType::Url` | `"url"` | `/`과 `.com`이 있는 텍스트. |
| `KeyboardType::Number` | `"number-pad"` | 숫자만: 부호와 소수점 구분 기호 없음(코드, PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | 숫자와 소수점 구분 기호. |
| `KeyboardType::Numeric` | `"numeric"` | React Native와 동일: iOS에서는 decimal pad, Android에서는 부호와 소수점 구분 기호가 있는 숫자. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | 숫자, 마이너스 부호, 구두점(iOS의 숫자 및 구두점 키보드. Android에서는 부호와 소수점 구분 기호가 있는 숫자). iOS에서 음수에 사용하세요. |
| `KeyboardType::Phone` | `"phone-pad"` | 전화 다이얼 패드. |

iOS에서 `.keyboard_appearance(KeyboardAppearance::Dark)`(TSX `ios={{ keyboardAppearance: "dark" }}`, 또는 light, 기본값)은 시스템 외관과 관계없이 키보드를 라이트 또는 다크 외관으로 만들며, 라이트 모드에서 다크 앱을 쓸 때 유용합니다. Android의 키보드는 항상 시스템 테마를 따릅니다.

자동 완성(`.auto_fill(AutoFill::Email)`, TSX `autoComplete`)은 필드가 무엇을 담는지 시스템에 알려, 저장된 이름, 주소, 비밀번호와 메시지로 받은 일회용 코드를 제안할 수 있게 합니다. Rust의 `AutoFill`에는 종류별 variant가 있습니다(`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ..., 그리고 `Off`). TSX는 다음 값을 받습니다: `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` 등, 또는 `"off"`. iOS 고유의 이름(`"emailAddress"`, `"oneTimeCode"`, ...)도 `autoComplete` 또는 `ios={{ textContentType }}`에서 허용됩니다.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## 리턴 키와 필드 간 이동

리턴 키 타입(`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`)은 리턴 키의 레이블을 정합니다: default, done, go, next, search 또는 send. 제출 동작(`.submit_behavior(..)`, TSX `submitBehavior`)은 리턴 키를 눌렀을 때의 동작을 정합니다:

| Rust | TSX | 리턴 | 기본값 적용 대상 |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | submit 이벤트를 발생시킨 뒤 input이 포커스를 잃습니다 | 단일 줄 input |
| `SubmitBehavior::Submit` | `"submit"` | submit 이벤트를 발생시키고 input은 포커스를 유지합니다 | |
| `SubmitBehavior::Newline` | `"newline"` | 줄 바꿈을 삽입합니다(여러 줄 input 전용) | 여러 줄 input |

`"submit"` 또는 `"blurAndSubmit"`이 지정된 여러 줄 input은 채팅 작성기처럼 리턴 시 전송하면서도 줄은 계속 줄 바꿈됩니다. 하드웨어 키보드(데스크톱, Mac, 태블릿 키보드)에서는 Shift+Return 또는 Option / Alt+Return이 줄 바꿈을 삽입합니다. 입력기의 조합(예: 중국어나 일본어 입력)을 확정하는 리턴은 확정만 하며 제출하지 않습니다.

다음 필드로 이동하려면 input의 ref(Rust의 `element_ref()`과 `.element_ref(&r)`, TSX의 `ref`)를 보관해 두고 `focus()`를 호출하세요:

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

첫 번째 필드에서 블러 없이 제출하면(`SubmitBehavior::Submit`, `submitBehavior="submit"`) 포커스가 이동하는 동안 키보드가 올라온 상태로 유지되어, 내려갔다가 다시 올라오지 않습니다. 리턴 시 전송하고 포커스를 유지하는 채팅 input도 같은 방식으로 제출합니다(작성기는 [아래](#content-outside-scroll-views) 참조).

최대 길이와 제출 동작은 모두 네이티브에서 적용됩니다. 사용자가 입력하는 동안 플랫폼이 "이 문자를 추가해도 되는가?"와 "리턴이 편집을 끝내야 하는가?"를 묻고, NSH는 JS를 기다리지 않고 속성 값으로 답합니다.

<a id="focus-from-code"></a>

## 코드에서 포커스 제어

input의 ref에는 다음이 있습니다:

| Rust | TSX | 설명 |
|---|---|---|
| `focus()` | `focus()` | input에 포커스를 주고 키보드를 표시합니다. |
| `blur()` | `blur()` | 포커스를 해제합니다. |
| `set_selection(start, end)` | `setSelection(start, end?)` | `start..end`을 선택합니다(UTF-16 단위). 둘이 같으면 캐럿이 됩니다(TSX: `end` 없이). |

macOS와 웹에서는 press를 받는 뷰의 ref에 있는 `focus()`과 `blur()`이 Tab처럼 키보드 포커스를 이동시킵니다([키보드 포커스](../elements/index.md#keyboard-focus)).

Rust의 `dismiss_keyboard()`과 TSX의 `Keyboard.dismiss()`(`nsh`에서 가져옴)은 포커스를 가진 input이 무엇이든 포커스를 해제합니다:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## 선택 영역

selection 이벤트(`.on_selection_change(..)`, TSX `onSelectionChange`)는 캐럿과 선택 영역을 보고하며, ref의 `set_selection` 또는 선택 범위(`.selected_range(..)`, TSX `selectedRange`)로 이를 설정합니다. 위치는 JavaScript 문자열 인덱스처럼 UTF-16 코드 단위이므로, TSX에서 `text.slice(start, end)`은 선택된 텍스트입니다. Rust에서는 텍스트의 UTF-16 단위를 슬라이스하세요.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## 캐럿

caret 이벤트(`.on_caret_move(..)`, TSX `onCaretMove`)는 캐럿의 위치를 알려 주어, 캐럿 위치에 속하는 것을 그곳에서 열 수 있게 합니다. 예를 들어 `@` 멘션의 제안, 슬래시 명령 메뉴, 이모지 선택기입니다. `bounds`는 input 안의 `Bounds`(`origin`과 `size`, input의 패딩과 스크롤이 반영됨)로, 너비는 플랫폼이 캐럿을 그리는 너비이고 높이는 해당 줄의 높이입니다. `pageBounds`은 창(또는 input이 있는 다이얼로그) 안에서의 같은 박스이며, 오버레이가 이를 `anchor`로 받습니다. 이 이벤트는 input이 포커스를 가진 동안 캐럿이 이동할 때마다 발생합니다. 선택 영역이 바뀔 때, 그리고 input의 텍스트가 스크롤되거나 다른 줄로 줄 바꿈될 때입니다. Rust에서는 오버레이를 `.anchor_bounds(..)`로 박스에 맞춰 배치합니다.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds`은 이벤트가 발생한 시점의 캐럿 위치입니다. input 아래의 페이지가 스크롤되면 input은 움직이지만 이벤트는 발생하지 않으므로, 스크롤될 때 제안을 닫거나 input 자체에 고정하세요.

<a id="pasting-images-and-files"></a>

## 이미지와 파일 붙여넣기

paste 이벤트(`.on_paste(..)`, TSX `onPaste`)는 키보드 단축키, 메뉴의 붙여넣기, 또는 키보드의 이미지 입력으로 사용자가 무엇을 붙여넣었는지 알려 줍니다: `text`, `html`, `files`, `uris`. `html`은 브라우저, 오피스 제품군, 리치 텍스트 에디터가 복사한 서식을 포함한 같은 내용입니다(Linux와 웹). `files`은 클립보드가 데이터로 담고 있던 것으로, 스크린샷이나 페이지 또는 다른 앱에서 복사한 이미지 등입니다. 앱이 업로드하거나 표시할 수 있는 바이트를 가진 `File`이며, 이름은 `image.png`(또는 해당 타입)입니다. `uris`은 파일 관리자에서 복사한 파일의 `file:` URL로, 파일 드롭과 같습니다. 플랫폼은 사용자가 붙여넣는 순간에만 클립보드를 읽습니다.

input은 늘 그렇듯 붙여넣은 텍스트를 스스로 삽입합니다. 이벤트는 해당 텍스트의 `onChange` 전에 발생합니다. input은 텍스트를 담으므로 이미지와 파일은 삽입되지 않습니다. `pasteBehavior` `"report"`이면 input은 아무것도 삽입하지 않으며, 붙여넣기 동작은 앱이 결정합니다. 긴 텍스트를 첨부 파일로 보내거나, 정리된 버전을 삽입할 수 있습니다. 시스템이 그 자리에서 묻기 때문에 input은 속성 값으로 즉시 결정합니다.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

붙여넣은 파일은 다른 `File`과 마찬가지로 `fetch`과 `FormData`(`form.append("image", file)`)로 업로드하세요. 바이트는 전송될 때까지 네이티브에 남아 있습니다. Android에서는 이미지(GIF, 스티커)를 삽입하는 키보드도 같은 방식으로 보고합니다. Linux에서는 클립보드를 비동기로 읽으므로, 이벤트가 삽입되는 텍스트의 `onChange` 뒤에 올 수 있습니다. macOS의 마스킹된 input은 AppKit 고유의 붙여넣기를 유지하며 아무것도 보고하지 않습니다.

<a id="multiline-inputs-that-grow"></a>

## 늘어나는 여러 줄 input

여러 줄 input(`.multiline(true)`, TSX `multiline`)은 자신의 높이 안에서 텍스트를 스크롤합니다. 콘텐츠에 맞춰 늘리려면 content size 이벤트의 높이(`.on_content_size_change(..)`, TSX `onContentSizeChange`)를 스타일에 되돌려 넣고 한도를 두세요:

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

보고되는 높이는 (input의 너비 기준) 텍스트의 높이이므로, 위 예제처럼 세로 패딩은 직접 더하세요.
<a id="keeping-inputs-above-the-keyboard"></a>

## 키보드 위에 입력창 유지하기

<a id="inside-scroll-views-automatic"></a>

### 스크롤 뷰 내부: 자동

키보드가 스크롤 뷰나 리스트 안에 있는 포커스된 입력창을 가리면, NSH는 스크롤 뷰에 키보드 높이만큼의 하단 인셋을 주고 입력창이 보이도록 스크롤합니다. 이는 네이티브로 처리되므로 별도의 코드가 필요 없습니다. 긴 폼은 입력창으로 이루어진 스크롤 뷰일 뿐입니다:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

닫기 모드(`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode`: none, on drag, interactive)를 사용하면 폼을 드래그하여 키보드를 숨길 수 있습니다. 처리된 탭(`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`)을 사용하면 키보드가 올라와 있는 동안 버튼을 탭했을 때 키보드만 닫히는 대신 탭이 버튼에 그대로 전달됩니다. [Scrolling](./scrolling.md#scroll-views-and-the-keyboard)을 참고하세요.

<a id="content-outside-scroll-views"></a>

### 스크롤 뷰 밖의 콘텐츠

iOS에서는 키보드가 스크롤 뷰 안에 있지 않은 포커스된 입력창을 가리게 되면, NSH가 해당 화면(또는 다이얼로그)의 콘텐츠를 입력창이 키보드 바로 위에 올 때까지 키보드의 곡선에 맞춰 위로 이동시키고, 키보드가 숨겨지거나 입력창이 포커스를 잃으면 다시 아래로 내립니다. 이는 SwiftUI의 동작과 같습니다(Android에서는 `adjustPan` 모드의 창을 시스템이 패닝합니다). 앱 자체 레이아웃이 가려진 채로 두는 부분에 대해서만 이렇게 동작합니다. 아래와 같이 앱이 직접 공간을 확보한 경우에는 다시 이동하지 않습니다.

이 방식은 페이지 전체를 움직입니다. 화면 하단에 고정된 메시지 바는 키보드 위에 얹혀 올라가고 그 위의 콘텐츠는 대신 줄어들어야 합니다. 이 경우 화면의 하단 패딩을 CSS의 `env(keyboard-inset-height)`(`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`)으로 지정하세요. 이 값은 키보드 높이만큼의 하단 공간을 확보하며, 키보드와 함께 네이티브로 애니메이션됩니다.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

패딩(`.pb_keyboard()`)은 배경이 화면 하단까지 이어지는 상태에서 위쪽 콘텐츠를 줄입니다. 하단 마진(`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`)은 뷰 전체를 키보드 상단에서 끝나게 합니다. `calc(env(keyboard-inset-height) + <length>)`(Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`)은 뷰 아래에 있는 탭 바의 높이를 뺀 값처럼 길이를 더해 줍니다.

전체 높이는 화면 콘텐츠처럼 표면의 하단까지 닿는 뷰에 적합합니다. 키보드에 맞춰 창 크기가 조정되는 Android 호스트에서는 창 자체가 줄어들고 이 변수는 0이 됩니다. [Keyboard](../elements/keyboard.md)를 참고하세요.

<a id="the-keyboard-accessor"></a>

### 키보드 접근자

Rust의 `keyboard_height()`과 `keyboard_duration()`, 그리고 TSX에서 `nsh`의 `keyboardFrame()`(`{ height, duration }`)은 반응형이며, 각각 키보드가 표면 안으로 얼마나 들어와 있는지(숨겨져 있으면 0이며, 그 아래의 하단 세이프 에어리어를 포함)와 키보드 애니메이션의 지속 시간(밀리초)을 나타냅니다. 커스텀 처리가 필요한 경우에 읽어 사용하세요. 예를 들어 입력 중에는 플로팅 버튼을 숨기거나 패널의 크기를 조정할 수 있습니다. 키보드의 이동이 시작되는 업데이트에서 이 값에 따라 바뀌는 것은 `env(keyboard-inset-height)`처럼 키보드와 함께, 키보드의 곡선에 맞춰, 키보드가 움직이기 시작한 시점부터 타이밍이 맞춰져 움직입니다(`LayoutCurve::Keyboard`). 앱이 해당 업데이트에 대해 설정한 애니메이션(`LayoutAnimation.configureNext`)이 있으면 그것이 우선합니다.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## 키보드 위의 바 (iOS): InputAccessoryView

Rust의 `input_accessory_view(id)`와 TSX에서 `nsh/mobile`의 `InputAccessoryView`는 이를 지정한 입력창이 포커스를 가진 동안 키보드 상단에 붙는 바를 표시합니다. 이는 iOS의 `inputAccessoryView`입니다. 인터랙티브 닫기 중에도 키보드와 함께 네이티브로 움직입니다. 트리에서 배치된 위치에서는 공간을 차지하지 않으며, 입력창은 id로 이를 참조합니다(`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` 및 `nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

바의 너비는 창과 같고 높이는 콘텐츠에 맞춰집니다. 입력 액세서리는 iOS 전용입니다. Android에서는 바가 비어 있는 숨겨진 뷰이므로, 해당 컨트롤은 입력창 위(Rust의 `os() == Os::Android`, TSX의 `platform.os === "android"`)처럼 다른 곳에 배치하세요.

<a id="related"></a>

## 관련 문서

- [`Input`](../elements/input.md): 요소 레퍼런스.
- [Keyboard](../elements/keyboard.md) 및 [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [Scrolling](./scrolling.md#scroll-views-and-the-keyboard): 스크롤 뷰에서의 키보드 닫기와 탭.
