---
title: "OtpInput"
description: "OtpInput 컴포넌트: 고정 길이의 숫자 일회용 코드를 입력, 붙여넣기 또는 자동 완성하여 하나의 네이티브 필드에 담고, 앱에서 스타일을 지정할 수 있는 셀, 그룹, 캐럿으로 표시합니다."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

일회용 코드 입력(OtpInput)은 정해진 개수의 숫자(문자 메시지로 받은 인증 코드, 인증 앱의 코드)를 받아 셀에 보여 줍니다. 동작은 컴포넌트가 맡습니다. 셀 위에 투명하게 놓인 네이티브 텍스트 필드 하나가 키보드를 받으므로, 입력, 입력기(IME), 붙여넣기, 숫자 키패드, 시스템의 코드 자동 완성(iOS의 "From Messages", Android의 SMS 제안)은 모두 플랫폼 고유의 방식 그대로이며, 스크린 리더는 텍스트 필드 하나만 인식합니다. 숫자만 입력할 수 있으며 최대 `length`까지 들어갑니다. Backspace는 마지막 숫자를 지우고, `onComplete`는 코드가 가득 찼을 때를 알려 줍니다. 모양은 앱이 정합니다. `OtpInput`에는 색, 크기, 테두리, 레이블이 따로 없습니다. 구성 요소는 셀, 셀을 나눈 그룹, 캐럿이며, 앱이 각각의 스타일을 지정합니다.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput`는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `otp_input()`가 prop마다 setter(`.length(..)`, `.cell_style(..)`)를, 이벤트마다 리스너 메서드(`.on_complete(..)`)를, 입력 자체를 위한 타입이 지정된 스타일 메서드를 갖춘 인스턴스를 만듭니다.

<a id="the-code"></a>

## 코드

- **제어형(Controlled)**: `value`를 전달하고 `onChange`에서 값을 설정합니다. 셀은 앱이 전달한 `value`를 그대로 보여 주며, 앱이 직접 설정한 값(잘못된 코드 뒤에 코드를 지우는 경우)은 보고되지 않습니다.
- **비제어형(Uncontrolled)**: `defaultValue`를 전달하거나(또는 아무것도 전달하지 않고), `onChange`와 `onComplete`에서 코드를 읽습니다.

사용자의 동작은 필드에서 읽으며, 캐럿은 항상 끝에 있습니다.

| 사용자 동작 | 코드 |
|---|---|
| 숫자를 입력함 | 코드가 `length`보다 짧으면 끝에 추가됩니다. 가득 찬 뒤에는 아무것도 바뀌지 않습니다. |
| 전각 숫자를 입력함(`０`–`９`, 동아시아 입력기에서 입력되는 숫자) | ASCII 숫자가 추가됩니다. |
| 그 밖의 문자를 입력함 | 아무것도 바뀌지 않습니다. 필드가 해당 입력을 버립니다. |
| Backspace를 누름 | 마지막 숫자가 지워집니다. |
| 붙여넣거나 시스템이 코드를 자동 완성함 | 그 숫자들이 같은 방식으로 추가됩니다. 숫자가 `length`개 이상인 텍스트(`123-456`, 메시지의 코드)는 코드를 앞의 `length`개 숫자로 교체합니다. |

`onChange`는 변경될 때마다 새 코드와 함께 알리며, 변경으로 마지막 셀이 채워지면 `onComplete`가 그 뒤를 이어 호출되므로 앱은 이 시점에 코드를 검증하면 됩니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | 필수 | 코드의 자릿수입니다. 숫자 하나당 셀 하나입니다. |
| `value` | `.value(..)` | `string` | 없음 | 앱이 제어하는 코드입니다(그대로 표시됨). 설정하지 않으면 입력이 자체적으로 코드를 유지합니다. |
| `defaultValue` | `.default_value(..)` | `string` | 없음 | `value`가 설정되지 않았을 때의 초기 코드입니다. |
| `masked` | `.masked(..)` | `boolean` | `false` | 채워진 셀에 숫자 대신 글머리 기호가 표시되며, 필드는 보안 필드가 됩니다. 스크린 리더가 코드를 읽지 않고, 시스템도 코드를 제안 목록에 넣지 않습니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 포커스와 편집이 불가능합니다. `disabled:` 스타일이 입력과 그 구성 요소에 적용되며, 스크린 리더는 비활성화(dimmed) 상태라고 안내합니다. |
| `groups` | `.groups(..)` | `number` | `1` | 셀을 몇 개의 그룹으로 나눌지를 지정하며, 가능한 한 고르게 나뉩니다(여섯 자리를 둘로 나누면 3 + 3). 최소 하나, 최대 셀당 하나입니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 필드에 대해 읽어 주는 내용입니다. 코드의 용도와 자릿수를 알려 줍니다. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 셀의 크기, 테두리, 텍스트(`color`, `fontSize`, 숫자가 이를 상속함)입니다. `focus:`와 `data-filled:`는 셀의 상태 스타일을 지정합니다(구성 요소 참조). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 셀의 각 그룹입니다(`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 캐럿의 너비, 높이, 색입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 입력 자체, 즉 그룹을 감싸는 행(또는 열)입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | 사용자가 코드를 변경했을 때입니다(입력, 삭제, 붙여넣기, 자동 완성). |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | 사용자의 변경으로 마지막 셀이 채워졌을 때이며, `onChange` 뒤에 발생합니다. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | 없음 | 입력이 키보드 포커스를 얻었을 때 / 잃었을 때입니다. |

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | 입력을 눌렀을 때와 같이 키보드 포커스를 가져오고 소프트웨어 키보드를 표시합니다. |

<a id="parts"></a>

## 구성 요소

| 구성 요소 | 위치 | 스타일 지정 |
|---|---|---|
| 입력 | | `class`, `style` |
| 그룹 | 입력 안, 그룹마다 하나 | `groupClass`, `groupStyle`. `disabled:`는 입력을 따릅니다 |
| 셀 | 해당 그룹 안, 숫자마다 하나 | `cellClass`, `cellStyle`. 입력에 포커스가 있는 동안 다음 숫자를 받을 셀에는 `focus:`, 숫자가 들어 있는 각 셀에는 `data-filled:`, `disabled:`는 입력을 따릅니다 |
| 숫자 | 채워진 셀 안 | 셀의 텍스트 스타일(`text-xl`, `font-semibold`). `masked`일 때는 `•` |
| 캐럿 | 입력에 포커스가 있는 동안 다음 숫자를 받을 빈 셀 안 | `caretClass`, `caretStyle` |

다음 숫자를 받는 셀은 마지막 숫자 다음의 셀이며, 코드가 가득 찬 뒤에는 마지막 셀입니다. 캐럿은 텍스트 필드처럼 깜박이며(0.5초 켜지고 0.5초 꺼지며, 편집할 때마다 잠시 동안 고정됨), 불투명도로 네이티브하게 처리되고 레이아웃에서 자리를 유지합니다. 모션 줄이기가 켜져 있으면 움직이지 않습니다. 입력의 아무 곳이나 누르면 포커스가 갑니다. 필드가 셀 위에 놓여 있기 때문입니다.

마스킹 여부와 관계없이 숫자가 들어 있는 셀에는 `data-filled` 속성이 있으므로, `data-filled:` 클래스로 사용자가 채운 셀의 스타일(더 굵은 테두리, 채우기: `data-filled:border-foreground data-filled:bg-muted`)을 지정할 수 있습니다. 이는 shadcn/ui가 상태를 작성하는 방식과 같습니다. `cellClass`에서 `group`를 사용하면 `group-data-filled:` 클래스로 채워진 셀의 내부, 즉 숫자의 스타일을 지정할 수 있습니다. 셀은 클래스만 바꾸고 내용은 바꾸지 않으므로, 키를 누르면 셀 하나의 스타일만 바뀌고 다시 그려지는 것은 없습니다.

<a id="accessibility"></a>

## 접근성

- 스크린 리더는 `accessibilityLabel`로 이름이 붙은 텍스트 필드 하나를 인식하며(코드의 용도와 길이를 말해 주세요: "인증 코드, 6자리"), 코드가 그 값입니다. 셀은 스크린 리더에게 숨겨집니다. `masked`인 동안 필드는 보안 필드이므로 코드를 소리 내어 읽지 않습니다.
- 키보드는 플랫폼의 것입니다. 휴대폰에서는 숫자 키패드, 데스크톱에서는 모든 키보드(숫자만 입력됨)와 Backspace를 사용합니다. Tab 키로 다른 텍스트 필드처럼 입력에 이동할 수 있습니다.
- `disabled`인 동안에는 포커스를 받지 않으며, 스크린 리더는 비활성화(dimmed) 상태라고 안내합니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참조하세요.

<a id="platform-notes"></a>

## 플랫폼별 참고 사항

- iOS: 필드는 코드 필드(`textContentType` `oneTimeCode`)이므로 QuickType 바가 Messages나 Mail의 코드를 제안하며, 숫자 키패드가 나타납니다. `masked` 필드는 iOS의 보안 필드와 마찬가지로, 포커스를 잃은 뒤 다시 입력하면 처음부터 다시 시작합니다.
- Android: `autofillHints` `smsOTPCode`를 사용하면 키보드와 자동 완성 서비스가 문자 메시지의 코드를 제안할 수 있으며, 숫자 키보드가 나타납니다.
- macOS, Windows, Linux, 웹: 입력과 붙여넣기는 필드로 전달되며(브라우저에서는 휴대폰의 숫자 키보드를 위해 `inputmode="numeric"` 사용), 셀 위에서는 I-beam 포인터가 표시됩니다.
