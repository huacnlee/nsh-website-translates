---
title: "안전 영역"
description: "safe-area-inset 환경 변수와 safeArea 및 safeAreaInsets 접근자: 노치, 상태 표시줄, 홈 인디케이터, 헤더를 피해 콘텐츠를 배치합니다."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# 안전 영역

안전 영역은 콘텐츠가 노치나 Dynamic Island, 상태 표시줄, 홈 인디케이터, 내비게이션 헤더, Mac Catalyst 제목 표시줄과 겹치지 않게 합니다. 모든 뷰는 CSS의 `env()`인 `env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`을 padding 또는 margin에 사용해 이 영역만큼 스스로 여백을 둘 수 있습니다. 이 값들은 노드가 렌더링되는 루트 뷰의 인셋입니다. [NavPage](./nav-stack.md) 안에서는 페이지 헤더 아래쪽의 인셋, [Dialog](./dialog.md) 안에서는 다이얼로그의 인셋, 그 외에는 서피스의 안전 영역입니다. 브라우저에서는 페이지가 루트이며, 변수도 브라우저 자체의 값입니다.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

배경색은 상태 표시줄 뒤쪽을 포함한 전체 영역을 채우고, 콘텐츠는 그 아래에서 시작합니다. 값은 인셋을 따라가므로 화면을 회전하거나 다른 페이지나 다이얼로그로 이동하면 padding이 네이티브에서 자동으로 갱신됩니다.

<a id="values"></a>

## 값

| 값 | 예시 | 의미 |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | 인셋 값입니다. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | 인셋 값입니다. CSS와 마찬가지로 길이는 알 수 없는 이름을 대체하는 폴백입니다. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | 인셋에 길이를 더한 값으로, 자체 간격을 유지하는 콘텐츠에 사용합니다. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | 위와 같습니다. |

이 값들은 `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`와 동일한 `margin` 키에 적용됩니다. Tailwind에서는 `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` 및 `m` 유틸리티의 임의 값(arbitrary value)으로 사용합니다(공백은 생략할 수 있습니다): `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(safe-area-inset-bottom)+16px)]`. 이 값들의 TypeScript 타입은 `EnvValue`입니다. [스타일 레퍼런스](../modules/style-reference.md)를 참고하세요.

Rust에서는 `Styled` 메서드로 설정합니다: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`, `.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, 동일한 `m` 메서드, 그리고 인셋에 길이를 더하는 경우에는 `.pt_safe_area_plus(px(16.0))`(및 `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`)를 사용합니다.

<a id="choosing-the-edges"></a>

## 가장자리 선택

탭 바나 직접 만든 하단 바가 하단 인셋을 처리하는 경우처럼, 필요한 가장자리에만 여백을 줄 수 있습니다.

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## 사용 위치

보이는 불투명 헤더가 있는 [NavPage](./nav-stack.md)는 이미 콘텐츠를 헤더 아래에 배치하므로, 그 안에서 상단 인셋은 0입니다. 안전 영역 인셋은 다음과 같은 경우에 사용합니다.

- 내비게이션 스택이 없는 앱의 루트
- `headerVisible={false}` 또는 `headerTransparent`가 설정된 페이지
- 전체 화면 [Dialog](./dialog.md)의 콘텐츠
- 화면 가장자리에 직접 만든 바

<a id="safearea-and-safeareainsets"></a>

## safeArea와 safeAreaInsets

코드에서 숫자 값이 필요하면 직접 읽을 수 있습니다. 두 TSX 접근자는 모두 `nsh`에서 가져오며, `Edges` 객체(`{ top, right, bottom, left }`, 단위는 포인트)를 반환하고 반응형입니다. 이 값을 읽는 코드는 값이 바뀔 때(예: 화면 회전) 다시 실행됩니다.

| TSX | Rust | 반환값 |
|---|---|---|
| `safeArea()` | `safe_area()` | 서피스의 안전 영역: 시스템 UI(노치, 홈 인디케이터, 제목 표시줄)와 겹치지 않는 부분입니다. |
| `safeAreaInsets()` | `cx.insets()` | 컴포넌트가 렌더링되는 위치의 인셋: 가장 가까운 페이지의 인셋(헤더 아래), 가장 가까운 다이얼로그의 인셋, 그렇지 않으면 서피스의 안전 영역입니다. 이 값들은 `safe-area-inset-*` 변수의 값입니다. TSX에서는 컴포넌트 안에서 호출하며 접근자를 반환합니다. 사용자 크레이트의 Rust 컴포넌트는 `cx.insets()`로 읽습니다. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

인셋 자체만큼 padding을 줄 때는 `env()`이 더 간단한 방법입니다. 코드를 실행하지 않고 네이티브에서 갱신됩니다.

<a id="platform-notes"></a>

## 플랫폼별 참고 사항

- **iOS**: 인셋은 UIKit의 안전 영역에서 가져옵니다. 상태 표시줄, 노치 또는 Dynamic Island, 홈 인디케이터가 해당합니다.
- **Android**: NSH는 시스템 바와 디스플레이 컷아웃 중 NSH 뷰와 겹치는 부분을 보고합니다. NSH가 네이티브 툴바 아래에 [임베드](../docs/android.md)된 경우, 뷰의 상단 인셋은 0입니다.
- **Mac Catalyst**: 상단 인셋은 윈도우의 제목 표시줄입니다.
- **데스크톱(macOS, Windows, Linux, GPUI)과 웹**: 페이지의 콘텐츠는 `header` 아래에서 시작하며, 다이얼로그는 모바일과 마찬가지로 콘텐츠에 자체 인셋을 제공합니다.

<a id="related"></a>

## 관련 문서

- [Keyboard](./keyboard.md): `env(keyboard-inset-height)`, 소프트웨어 키보드 위에 유지되는 콘텐츠.
- [Device and environment](../docs/device-and-environment.md): 기기의 다른 값들과 함께 보는 안전 영역.
