---
title: "키보드"
description: "keyboard-inset-height 환경 변수, Keyboard.dismiss, 그리고 키보드의 높이: 소프트웨어 키보드 위에 콘텐츠를 유지하고 키보드와 함께 움직이게 하는 방법."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# 키보드

`env(keyboard-inset-height)`는 화면(surface) 위에 표시되는 소프트웨어 키보드의 높이이며, 키보드가 숨겨져 있으면 0입니다. 뷰의
아래쪽 padding 또는 margin으로 사용하면 콘텐츠가 키보드 위에 유지됩니다. 키보드가 나타나거나 사라질 때 뷰가 키보드
높이만큼 공간을 확보하며, 이 변화는 키보드와 함께 네이티브로 애니메이션됩니다. 채팅 화면 하단의 메시지 바처럼 스크롤 뷰 밖에 있는 콘텐츠에 사용하세요. [스크롤 뷰](./scroll.md)나 [List](./list.md) 안의 입력 필드는 네이티브로 스크롤되어 화면에 보입니다. 이와 함께 키보드를 숨기는 `Keyboard.dismiss()`와 키보드의 높이도 제공되며, 직접 만드는 레이아웃에 사용할 수 있습니다.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

전체 키보드 높이는 화면 콘텐츠처럼 화면 아래쪽까지 닿는 뷰에 적합합니다. 탭 바처럼 그 아래에 다른 요소가 있다면 길이 값으로 그만큼을 빼세요. `calc(env(keyboard-inset-height) + -49px)`은 49pt 탭 바 위에 뷰를 유지하고, `calc(env(keyboard-inset-height) + 12px)`은 키보드 위에 여백을 추가합니다. padding은 최소 0입니다.

<a id="padding-or-margin"></a>

## Padding 또는 margin

| 스타일 | 공간을 확보하는 방식 |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | 위쪽 콘텐츠가 줄어들며, 배경은 여전히 화면 아래쪽까지 닿습니다. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | 배경을 포함한 뷰 전체가 키보드 상단에서 끝납니다. |

키보드 높이는 같은 선언 안의 길이 값에만 더해지므로, 뷰는 `calc()`에서 자신의 간격과 키보드 높이를 함께 사용할 수 있습니다. Rust에서는 `.pb_keyboard_plus(px(..))`와 `.mb_keyboard_plus(px(..))`가 길이 값을 더합니다.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

여기서는 뷰 아래의 49pt 탭 바가 이미 키보드 높이의 일부를 가리고 있습니다. 공간 확보를 끄려면 스타일에서 해당 변수를 빼면 됩니다. 예를 들어 signal의 조건을 사용할 수 있습니다.

<a id="hiding-the-keyboard"></a>

## 키보드 숨기기

`nsh`의 `Keyboard.dismiss()`는 포커스된 입력 필드의 포커스를 해제하여 키보드를 숨깁니다. 포커스된 입력 필드가 없으면 아무것도 변경하지 않습니다. Rust 컴포넌트에서는 `dismiss_keyboard()`를 호출합니다.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> 사용자가 스크롤 뷰를 드래그할 때 키보드를 숨기려면 [스크롤 뷰](./scroll.md) 또는 [List](./list.md)에 `keyboardDismissMode="on-drag"` 또는 `"interactive"`를 설정하세요.

<a id="the-keyboards-height"></a>

## 키보드 높이

| TSX | Rust | 반환값 |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | NSH 화면 위에 표시되는 소프트웨어 키보드의 높이(포인트 단위, 숨겨져 있으면 0)와 키보드가 나타나거나 사라지는 애니메이션의 지속 시간(밀리초 단위)입니다. |

둘 다 반응형입니다. 이 값을 읽는 effect, JSX 표현식 또는 스타일 클로저는 키보드가 나타나거나 사라지거나 높이가 바뀔 때 다시 실행됩니다.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

이 높이는 키보드 중 NSH 화면과 겹치는 부분입니다. 키보드 때문에 창 자체가 줄어들거나(크기를 조정하는 Android activity), NSH가 키보드 위에서 끝나는 뷰에 임베드된 경우에는 높이가 0입니다.

> [!NOTE]
> 콘텐츠를 키보드 위에 유지하려면 `env(keyboard-inset-height)`가 더 간단한 방법입니다. 코드를 실행하지 않고도 키보드와 함께 네이티브로 애니메이션됩니다.

<a id="platform-notes"></a>

## 플랫폼별 참고 사항

- **iOS**: 공간은 키보드 자체의 지속 시간과 ease-in-ease-out 곡선으로 애니메이션됩니다.
- **Android**: 키보드 때문에 창이 줄어드는 경우(크기를 조정하는 activity) 콘텐츠는 이미 키보드 위에서 끝나므로 변수는 0입니다. 키보드가 뷰와 겹치는 경우에는 iOS와 같이 공간을 확보합니다.
- **데스크톱과 Mac Catalyst**는 하드웨어 키보드로 입력하므로 변수는 0이며 뷰는 레이아웃을 그대로 유지합니다.
- **Web**: 변수는 브라우저 자체의 값(VirtualKeyboard API의 값)입니다.

포커스 순서, 리턴 키, 입력 액세서리는 [양식과 키보드](../docs/forms-and-keyboard.md)를, 다른 환경 변수는 [Safe area](./safe-area.md)를 참고하세요.
