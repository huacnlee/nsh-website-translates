---
title: "접근성"
description: "VoiceOver와 TalkBack에서 앱이 제대로 동작하도록 만들기 - 레이블, 역할, 상태, 값, 사용자 지정 동작, 그룹화와 숨기기, 안내 메시지와 포커스, 텍스트 크기, 모션 줄이기."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# 접근성

NSH는 네이티브 뷰로 렌더링하므로 VoiceOver(iOS 및 Mac Catalyst), TalkBack(Android), Switch Control, Voice Control 등 각 플랫폼의 보조 기술은 앱의 실제 뷰 계층 구조를 그대로 인식합니다. 개발자가 추가하는 것은 보조 기술이 스스로 추론할 수 없는 설명, 즉 요소가 무엇인지, 무엇을 말하는지, 어떤 상태인지, 무엇을 할 수 있는지입니다. 모든 요소는 아래의 메서드(Rust)와 props(TSX)를 받습니다.

<a id="what-you-get-without-doing-anything"></a>

## 아무것도 하지 않아도 제공되는 기능

- **텍스트는 읽힙니다.** 텍스트 요소는 접근성 요소이며, 레이블은 그 텍스트입니다. 레이블이 없는 뷰는 그 안에 있는 텍스트들로 읽힙니다.
- **누를 수 있는 뷰는 요소입니다.** 누르기 또는 길게 누르기 핸들러(`.on_press`, `onPress`)가 있는 뷰는 기본적으로 접근성 요소이며, 이를 활성화하면(VoiceOver 또는 TalkBack에서 두 번 탭) 눌림 동작이 실행됩니다.
- **입력은 텍스트 필드입니다.** 플레이스홀더, 값, 키보드가 함께 제공됩니다.
- **텍스트는 사용자의 크기 설정을 따릅니다.** [텍스트 크기](#text-size)를 참고하세요.

<a id="labels-hints-and-roles"></a>

## 레이블, 힌트, 역할

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

| Rust | TSX | 유형 | 설명 |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | 이 뷰는 보조 기술에 하나의 요소로 노출되며, 자식 요소는 별도로 노출되지 않습니다. |
| `.label(..)` | `accessibilityLabel` | `string` | 내부 텍스트 대신 스크린 리더가 읽는 내용입니다. |
| `.hint(..)` | `accessibilityHint` | `string` | 요소를 활성화하면 무엇이 일어나는지를 설명하며, 잠시 멈춘 뒤 읽힙니다. |
| `.role(..)` | `role` | `AccessibilityRole` | 요소가 무엇인지를 나타냅니다. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | 요소의 상태(비활성화, 선택됨, 체크됨, 진행 중, 확장됨, 눌림, 현재 항목)입니다. `selected`는 선택됨 스타일도 함께 적용하고, `checked`는 true일 때 체크됨 스타일을, `"mixed"`일 때 불확정 스타일을 적용하며, `pressed`는 true일 때 눌림 스타일을 적용합니다. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | 제목의 레벨(1이 최상위), 트리 항목의 깊이(1이 최상위)입니다. |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | 범위 요소 또는 텍스트 요소의 값입니다. |
| | `accessibilityActions` | `{ name, label? }[]` | 보조 기술에 제공하는 액션입니다. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | 액션이 수행되었음을 알립니다(Rust에서는 그 이름). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | 뷰와 그 하위 트리를 보조 기술에서 숨깁니다. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | 뷰(및 그 하위 트리)를 노출할지 여부입니다. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: 뷰의 변경 사항을 TalkBack에 어떻게 알릴지 지정합니다. |
| `.test_id(..)` | `testID` | `string` | UI 테스트용 식별자입니다(iOS에서는 accessibility identifier, Android에서는 resource id). 소리 내어 읽히지 않습니다. |

아이콘만 있는 컨트롤에는 반드시 레이블을 지정하세요. 스크린 리더는 글리프나 이미지를 읽을 수 없습니다. 레이블은 짧게 쓰고 역할을 포함하지 마세요("Play button"이 아니라 "Play"). 역할은 따로 안내됩니다.

<a id="roles"></a>

### 역할

역할(`.role(AccessibilityRole::Header)`, `role="header"`)은 사용자에게 이 요소가 어떤 종류이며 어떻게 조작하는지 알려 줍니다. Rust에서는 `AccessibilityRole` variant(`Button`, `Header`, `Switch`, ...)이고, TSX 값은 `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"`, `"cell"`([`Table`](../elements/table.md)의 파트들이 가지는 역할), `"listbox"` 및 `"option"`(선택할 옵션의 목록. 예: [`Select`](../elements/select.md)의 목록과 그 옵션이며, 선택된 옵션은 `accessibilityState.selected`로 표시), `"group"`(서로 관련되어 함께 속하는 요소들), `"region"`(독립적으로 접근할 가치가 있는 영역. 예: 아코디언의 패널), `"navigation"`(앱 안에서 이동하는 링크. 예: 페이지네이션), `"tree"` 및 `"treeitem"`(확장 및 축소되는 항목으로, 각각 `accessibilityLevel`에 위치), `"menuitemcheckbox"` 및 `"menuitemradio"`(체크되는 메뉴 항목으로, 단독이거나 그룹 중 하나의 선택지)입니다.

가장 유용한 역할은 다음과 같습니다.

- `"button"`은 링크가 아닌 모든 누를 수 있는 요소에, `"link"`는 콘텐츠로 이동하는 경우에 사용합니다.
- `"header"`는 섹션 제목에 사용합니다. 스크린 리더 사용자는 헤더 사이를 건너뛰며 화면을 훑어봅니다. `accessibilityLevel`는 플랫폼이 읽어 주는 경우 그 레벨(1이 최상위)을 지정합니다.
- `"button"`과 `accessibilityState.pressed`는 켜짐 또는 꺼짐 상태를 유지하는 토글 버튼(툴바의 굵게 버튼 등)에 사용합니다.
- `"navigation"`는 페이지 사이를 이동하는 링크를 감싸며, 현재 표시된 페이지의 링크에는 `accessibilityState.current: "page"`를 사용합니다.
- `"switch"`, `"checkbox"`, `"radio"`은 `accessibilityState.checked`와 함께 사용합니다.
- `"adjustable"`은 슬라이더와 스테퍼에 사용하며, `accessibilityValue` 및 `increment` / `decrement` 액션과 함께 씁니다
  ([`Slider`](../elements/slider.md)의 각 썸이 하나의 요소입니다).
- `"spinbutton"`은 사용자가 단계별로 조절할 수도 있는 숫자를 담는 필드에 사용하며, 같은 값과 액션을 사용합니다
  ([`NumberInput`](../elements/number-input.md)의 필드).
- `"image"`는 의미 있는 이미지에 레이블과 함께 사용하며, 장식용 이미지는 대신 숨겨야 합니다.

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

### 상태와 값

앱에서 켜짐 / 꺼짐 컨트롤이 필요하면 `nsh/base`의 [`Switch`](../elements/switch.md)를 사용하세요. 역할과 상태를 자동으로 설정해 줍니다. 아래 예제는 뷰에 지정한 역할과 상태가 어떤 역할을 하는지 보여 줍니다.

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

상태는 Rust에서는 `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }`, TSX에서는 `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }`입니다. `pressed`는 버튼을 토글 버튼으로 만들고(ARIA의 `aria-pressed`), `current`는 집합의 현재 항목(ARIA의 `aria-current`), 즉 페이지네이션의 페이지나 마법사의 단계를 표시합니다. `disabled`는 뷰를 비활성화하면(`.disabled(..)`, `disabled`) 함께 적용됩니다. `accessibilityValue`는 `min`, `max`, `now`와 함께 쓰면 백분율로 읽히고, `text`와 함께 쓰면 지정한 그대로("3 of 10", "Medium") 읽힙니다.

<a id="actions"></a>

## 액션

누를 수 있는 뷰는 이미 활성화를 지원합니다. 그 외의 경우에는 `accessibilityActions`로 액션을 선언하고 `onAccessibilityAction`로 처리하세요. Rust 컴포넌트는 `.on_accessibility_action(|name: &str| ..)`로 수행된 액션의 이름을 받습니다.

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

일부 액션 이름은 표준이며 각 플랫폼 고유의 제스처에 대응합니다.

| 이름 | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | 두 번 탭 | 두 번 탭(클릭) |
| `increment`, `decrement` | 위 / 아래로 스와이프한 뒤 VoiceOver가 새 값을 읽음 | 앞으로 / 뒤로 스크롤 |
| `longpress` | | 두 번 탭한 채로 유지 |
| `expand`, `collapse` | | 확장 / 축소 |
| `magicTap` | 두 손가락 두 번 탭 | |
| `escape` | 두 손가락 Z 스크럽 | |

`increment` 또는 `decrement`가 있는 요소는 역할과 관계없이 조절 가능합니다. 차트는 `"image"` 역할을 유지한 채 VoiceOver의 스와이프와 TalkBack의 스크롤로 각 데이터 포인트를 이동할 수 있으며, 각 이동 후에 `accessibilityValue`가 읽힙니다.

그 외의 이름은 커스텀 액션이 되어 VoiceOver의 액션 로터와 TalkBack의 액션 메뉴에 `label`(또는 이름)과 함께 나열됩니다. 커스텀 액션은 스와이프하여 삭제하기 등의 제스처를 접근 가능하게 만든 형태입니다.

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## 그룹화와 숨기기

뷰를 접근 가능하게 만들면(`.accessible(true)`, `accessible`) 그 뷰가 하나의 요소가 됩니다. 제목, 부제목, 가격이 있는 카드는 사용자가 텍스트 세 개를 따로 스와이프하지 않아도 한 번에 읽힙니다.

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

장식용 이미지, 구분선, 이미 같은 내용을 말하는 텍스트 옆의 아이콘처럼 추가 정보가 없는 요소는 숨기세요.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden`(iOS의 이름)와 `importantForAccessibility="no-hide-descendants"`(Android의 이름)는 두 플랫폼 모두에서 하위 트리를 숨기며, 둘 다 설정해도 문제없습니다.

<a id="the-screen-reader-and-the-users-settings"></a>

## 스크린 리더와 사용자 설정

Rust에서 prelude는 사용자 설정을 알려 주고 스크린 리더와 상호작용합니다. `screen_reader()`와 `reduce_motion()`는 반응형이고, `announce_for_accessibility(message)`는 스크린 리더가 메시지를 읽게 하며, 요소의 `element_ref()`는 `set_accessibility_focus()`로 스크린 리더의 포커스를 그 요소로 옮깁니다. TSX에서는 `nsh`의 접근성 API가 사용자 설정을 알려 주고 스크린 리더와 상호작용할 수 있게 해 줍니다.

| 멤버 | 설명 |
|---|---|
| `screenReaderEnabled()` | VoiceOver 또는 TalkBack이 실행 중인지 여부(반응형). |
| `reduceMotion()` | 사용자가 모션 감소를 요청했는지 여부(반응형). |
| `announce(message)` | 스크린 리더가 `message`를 읽습니다. |
| `setAccessibilityFocus(ref)` | 스크린 리더의 포커스를 뷰로 옮깁니다. |

설정 값은 접근자(accessor)입니다. 바인딩이나 이펙트 안에서 읽으면, 사용자가 설정을 변경할 때 이를 읽는 쪽이 자동으로 갱신되며 별도의 정리(cleanup)가 필요 없습니다.

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

사용자가 놓칠 수 있는 변경 사항, 예를 들어 백그라운드 저장 완료, 포커스에서 떨어진 곳에 나타나는 오류, 타이머 종료 등은 알려 주세요. Android에서는 뷰에 `android={{ accessibilityLiveRegion: "polite" }}`를 지정하면 TalkBack이 그 뷰의 변경 사항을 자동으로 알립니다.

<a id="text-size"></a>

## 텍스트 크기

텍스트와 입력은 끄지 않는 한 시스템 텍스트 크기(iOS의 Dynamic Type, Android의 글꼴 크기)를 따릅니다(`.allow_font_scaling(false)`, `allowFontScaling={false}`). 끄는 대신 큰 텍스트를 고려해 설계하세요.

- 텍스트가 줄바꿈되도록 하세요. 텍스트를 담은 뷰에는 고정 높이를 피하세요.
- 크기 조절을 끄는 대신 `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier`로 매우 큰 제목의 크기를 제한하세요.
- 텍스트가 클 때는 레이아웃을 전환하세요. `font_scale()`(Rust) 또는 `nsh`의 `fontScale()`(TSX)를 읽어 판단합니다(예: 1.3을 넘으면 레이블과 값을 세로로 쌓기).

[기기 및 환경](./device-and-environment.md#text-size)을 참고하세요.

<a id="reduced-motion"></a>

## 모션 감소

`reduce_motion()`(Rust)와 `reduceMotion()`(TSX)는 사용자가 iOS의 Reduce Motion 또는 Android의 애니메이션 제거 설정을 켰을 때 `true`입니다. 애니메이션은 작성한 그대로 실행되므로, 이 값이나 Tailwind 변형 `motion-reduce:` 및 `motion-safe:`를 사용해 큰 움직임을 페이드나 즉각적인 변경으로 대체하세요.

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

## 터치 타겟

누를 수 있는 요소는 최소 44 × 44 포인트로 만드세요. 컨트롤이 더 작게 보여야 한다면 크기를 키우는 대신 히트 슬롭(`.hit_slop(..)`, `hitSlop`)으로 터치 영역을 확장하세요. [터치와 제스처](./touch-and-gestures.md#hit-areas-hitslop)를 참고하세요.

<a id="checking-your-app"></a>

## 앱 확인하기

- VoiceOver(iOS 설정, 손쉬운 사용 또는 설정해 두었다면 측면 버튼 세 번 클릭) 또는 TalkBack을 켜고 화면을 보지 않은 채 앱을 사용해 보세요. 모든 컨트롤이 자신이 무엇이고 무엇을 하는지 말해 주어야 합니다.
- iOS 시뮬레이터에서는 Xcode의 Accessibility Inspector가 각 요소의 레이블, 트레이트, 값을 보여 줍니다.
- 가장 큰 텍스트 크기와 다크 모드에서도 확인해 보세요.
- 테스트 ID(`.test_id(..)`, `testID`)는 레이블의 언어에 따라 바뀌지 않는 안정적인 핸들을 UI 테스트에 제공합니다.

<a id="related"></a>

## 관련 문서

- [`nsh`의 접근성 API](../modules/nsh.md#accessibility): 레퍼런스.
- [`View`](../elements/view.md): 모든 접근성 prop.
- [애니메이션](./animation.md#reduced-motion) 및 [기기 및 환경](./device-and-environment.md).
