---
title: "플랫폼별 코드"
description: "휴대폰, 데스크톱, 브라우저를 위한 하나의 앱 작성하기 - ios={{}} / android={{}} / desktop={{}} / web={{}}의 플랫폼 전용 props, nsh/mobile 및 nsh/desktop 모듈, platform.os와 platform.select, 그리고 플랫폼별 Tailwind variants."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# 플랫폼별 코드

하나의 NSH 번들이 iOS, Android, macOS, Windows, Linux(그리고 Mac Catalyst)에서 실행되며, [웹 런타임](./web.md)을 통해 브라우저에서도 실행됩니다. 앱의 대부분은 플랫폼 검사가 전혀 필요하지 않습니다. 요소, 스타일, 레이아웃, 모듈은 어디서나 동일하게 동작하고, 이들로 만든 컴포넌트도 어디서나 똑같이 보입니다. 정말로 특정 플랫폼에만 해당하는 경우에는 NSH가 그 코드를 둘 명확한 자리를 제공하므로, 플랫폼 코드가 눈에 잘 보이고 한곳에 모이게 됩니다.

| Rust | TSX | 용도 |
|---|---|---|
| [빌더 메서드(`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | 한 플랫폼에만 있는 props. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | 모바일 플랫폼에만 또는 데스크톱에만 있는 API. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | 플랫폼별로 값이나 코드를 선택. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [`ios:` / `android:` / `web:` 클래스](#platform-variants-in-tailwind) | 플랫폼별 스타일. |

<a id="desktop-and-mobile"></a>

## 데스크톱과 모바일

모든 플랫폼은 하나의 규칙에 따라 데스크톱 또는 모바일로 구분됩니다. 데스크톱은 macOS, Windows, Linux, 그리고 데스크톱 방식(마우스와 넓은 창)의 브라우저입니다([웹](./web.md)). 모바일은 iOS, Android, 그리고 휴대폰이나 태블릿 방식의 브라우저입니다. Mac Catalyst는 iOS 백엔드를 실행하므로 역시 모바일이며, `ios={{…}}` props를 사용합니다. `desktop={{…}}` props, `platform.select({ desktop, mobile })`, `platform.desktop`, `platform.idiom === "desktop"` 모두 이 규칙을 따르고, `nsh/base`의 컴포넌트도 마찬가지입니다(메뉴는 데스크톱에서는 팝업, 모바일에서는 시트입니다). Rust에서는 `is_desktop()`도 이 규칙을 따릅니다.

`nsh/desktop`의 `isAvailable`는 더 좁은 범위의 질문, 즉 해당 모듈의 창 및 메뉴 API가 동작하는지에 답합니다. 이 API는 macOS, Windows, Linux에서 동작합니다. 레이아웃, 밀도, 입력은 `platform.desktop`로 구분하고, `Window` 및 `Menu` 호출은 `isAvailable`로 구분하세요.

<a id="platform-only-props"></a>

## 플랫폼 전용 props

Rust에서 한 플랫폼에만 있는 prop은 다른 prop과 마찬가지로 빌더 메서드입니다(`.ripple(..)`, Android용 `.elevation(..)`, iOS용 `.input_accessory(..)`, 데스크톱용 `.window_drag(..)`). 다른 플랫폼에서는 이를 무시합니다. TSX에서는 한 플랫폼에만 있는 props를 그 플랫폼의 이름을 딴 객체로 묶습니다. 각 요소는 `ios`, `android`, `desktop`(macOS, Windows, Linux 및 데스크톱 방식의 브라우저), `web`(브라우저)을 받습니다. 다른 플랫폼에서는 이 객체가 무시되고, 해당 플랫폼에서는 객체 안의 키만 적용됩니다. 데스크톱 브라우저는 `desktop`과 `web`을 모두 적용합니다.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

TSX 객체는 다른 prop과 마찬가지로 반응형이며, 객체에서 제거된 키는 해제됩니다.

현재 제공되는 항목은 다음과 같습니다.

| Rust | TSX | 대상 | 설명 |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | 모든 요소 | 눌렀을 때의 머티리얼 리플: color, borderless, radius, foreground. |
| `.elevation(..)` | `android={{ elevation }}` | 모든 요소 | 뷰의 모양을 따르는 머티리얼 그림자(포인트 단위). |
| | `android={{ accessibilityLiveRegion }}` | 모든 요소 | `"none"`, `"polite"` 또는 `"assertive"`: TalkBack이 뷰의 변경 사항을 안내합니다. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | 다이얼로그의 콘텐츠가 상태 표시줄 아래까지 확장됩니다. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | 키보드 위에 표시되는 `InputAccessoryView`. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | 자동 완성 유형에 대한 iOS의 이름(Rust의 `AutoFill`은 두 플랫폼을 모두 다룹니다). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | 허용하는 화면 방향. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | 페이지 기록에서 스와이프로 뒤로 및 앞으로 이동. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | 헤더 끝에 있는 UIKit 자체 바 버튼이며, 누르면 `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | 헤더 시작에 있는 UIKit 자체 바 버튼이며, 누르면 `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | 헤더 끝에 SF Symbol을 표시하는 UIKit 자체 바 버튼이며, 누르면 `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | 헤더 시작에 SF Symbol을 표시하는 UIKit 자체 바 버튼이며, 누르면 `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: 두 손가락 트랙패드 스와이프로 페이지 기록에서 뒤로 및 앞으로 이동. Windows: 터치스크린 스와이프. Linux: 터치패드 스와이프. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | 모든 요소 | 누르면 시스템 제목 표시줄처럼 창을 드래그합니다([nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own) 참고). |

TSX에서 `desktop={{…}}`과 `web={{…}}`은 모든 플랫폼에서 허용됩니다. 타입(`IOSProps`, `AndroidProps`, `DesktopProps` 및 요소별 형태)은 각 요소가 받는 값을 에디터에 알려 줍니다.

요소가 모든 플랫폼에서 갖는 의미는 최상위 prop(Rust에서는 같은 이름의 메서드)으로 지정하며, 의미가 있는 곳에 적용됩니다. `NavPage`의 `title`, `headerStyle`, `headerLargeTitle`, `headerBackTitle`은 iOS와 Android의 시스템 헤더를 구성하고, `header` 슬롯은 데스크톱과 웹의 헤더이며, `Dialog`의 `presentation`은 iOS의 시트를 선택합니다. `AlertDialog.show`의 `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` 등은 모든 플랫폼에서 동작합니다. 특정 플랫폼 고유의 시스템 기능은 그 플랫폼의 객체에 넣고, 여러 플랫폼에 있는 기능이라면 각 객체에 같은 이름으로 넣습니다. 시스템이 제공하는 페이지 기록 스와이프인 `WebView`의 `allowsBackForwardNavigationGestures`는 `ios={{…}}`과 `desktop={{…}}`에 있습니다.

<a id="platform-modules"></a>

## 플랫폼 모듈

Rust에서 한 플랫폼에만 있는 API는 `nsh_core::prelude`(`on_back_press`, `input_accessory_view`)과 `nsh_core::element::desktop`(창: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`, 메뉴: `set_application_menu`, `popup_menu`)의 함수이며, 다른 플랫폼에서는 아무 동작도 하지 않습니다. TSX에서는 `nsh/mobile`이 iOS와 Android의 API(일부는 한 플랫폼 전용)를, `nsh/desktop`이 데스크톱의 API를 제공합니다. 두 모듈 모두 모든 플랫폼에서 import할 수 있으므로 하나의 번들이 어디서나 실행됩니다. 다른 플랫폼에서는 이 모듈의 함수가 즉시 반환하고 컴포넌트는 공간을 차지하지 않습니다. 각 모듈은 `isAvailable`를 내보내며, 이 값은 해당 플랫폼에서 `true`입니다. `platform.os`로 두 모듈을 구분할 수 있습니다.

### nsh/mobile

`isAvailable`은 iOS(Mac Catalyst 포함)와 Android에서 `true`입니다. 두 플랫폼 모두 시스템 탭 바인 [`TabBar`](../modules/nsh-mobile.md#tabbar)을 제공합니다.

#### BackHandler (Android)

| Rust | TSX | 설명 |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | 다이얼로그 다음, 스택보다 먼저 뒤로 가기 버튼을 수신합니다. 처리했으면 `true`를 반환하세요. 리스너는 이를 추가한 컴포넌트(또는 effect)와 함께 사라지며, TSX에서는 이 호출이 더 일찍 중지할 수 있는 함수도 반환합니다. |
| | `BackHandler.exitApp()` | 앱을 종료합니다. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

뒤로 가기 버튼은 최상위 다이얼로그가 가장 먼저 처리하고, 그다음 뒤로 가기 리스너(가장 최근 것부터), 그다음 최상위 내비게이션 스택이 처리하며, 아무도 처리하지 않으면 앱이 종료됩니다. [내비게이션](./navigation.md#the-android-back-button)을 참고하세요.

#### InputAccessoryView (iOS)

| Rust | TSX | 설명 |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | 자신의 네이티브 id를 지정한 입력창(`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`)의 키보드 위에 표시되는 바. |

[폼과 키보드](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview)를 참고하세요.

### nsh/desktop

Rust 앱은 `nsh_core::element::desktop`로 자체 제목 표시줄을 그립니다([Rust로 빌드하기](./rust.md#desktop-title-bars)). TSX 모듈은 다음과 같습니다.

| Export | 설명 |
|---|---|
| `Window` | 창: `setTitle`, 앱 자체 제목 표시줄을 위한 `setTitleBar({ style: "hidden" })`, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | 숨겨진 제목 표시줄의 높이와 시스템 창 컨트롤이 차지하는 공간(반응형). |
| `Menu` | `setApplicationMenu(items)`(단축키가 있는 메뉴 바)와 `popup(items, at?)`(컨텍스트 메뉴). |
| `isAvailable` | 창과 메뉴 API가 동작하는 곳(macOS, Windows, Linux)에서 `true`입니다. 데스크톱 브라우저는 `platform.desktop`이며 브라우저의 창과 메뉴를 그대로 유지합니다. |

[nsh/desktop](../modules/nsh-desktop.md)을 참고하세요.

<a id="the-status-bar"></a>

### 상태 표시줄

두 플랫폼 모두에서 상태 표시줄은 맨 위에 있는 페이지나 다이얼로그에 속합니다. 이는 최상위 뷰 컨트롤러가 상태 표시줄을 결정하는 UIKit과 같은 방식입니다. [`NavPage`와 `Dialog`에 `statusBar` 전달](../modules/nsh-base.md#status-bar)(Rust에서는 `.status_bar(StatusBarStyle::Light)` 또는 나머지 필드를 위한 `StatusBarSetting`)로 지정하며, 필드는 `foreground`(`"auto"`, 어두운 배경용 `"light"`, 밝은 배경용 `"dark"`), `hidden`, `animated`입니다. 가장 최근에 표시된 페이지나 다이얼로그가 필드별로 우선 적용되고, 그것이 사라지면 그 아래에 있던 것이 다시 적용됩니다. `nsh.json`의 `"statusBar"`은 그 아래에서 앱의 기본값 역할을 합니다.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

네이티브 앱에 임베드된 앱에서는 iOS의 경우 호스트 앱의 뷰 컨트롤러가 상태 표시줄을 결정합니다. `nsh.json`에 `"capabilities"`을 선언한 앱에서 이를 변경하려면 `"statusBar": true`가 필요합니다.

## platform.os and platform.select

Rust의 `os()`와 TSX에서 `nsh`의 `platform` 상수는 앱이 실행되는 위치를 알려 줍니다. 값은 `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` 또는 `Os::Web`이며, `platform.os`는 `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` 또는 `"web"`입니다(Mac Catalyst는 `"ios"`이며 두 방식 중 어느 쪽이든 `platform.catalyst`입니다. [macOS 백엔드](./macos.md)는 `"macos"`, [Linux 백엔드](./linux.md)는 `"linux"`, [Windows 백엔드](./windows.md)는 `"windows"`이며, 이들의 요소는 `desktop` props를 적용합니다. [브라우저](./web.md)는 `"web"`이고, `platform.desktop`가 `true`이면 `desktop` props도 적용합니다). 버전, 방식 등 나머지는 [디바이스와 환경](./device-and-environment.md#the-platform)을 참고하세요.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

Rust에서는 `match os()`가 값을 선택하며, 데스크톱용으로 `is_desktop()`가 있습니다. TSX에서는 `platform.select(spec)`가 현재 플랫폼의 값을 반환합니다. 먼저 OS 자체의 키를 찾고, 그다음 [위의 규칙](#desktop-and-mobile)(`platform.desktop`)에 따라 `desktop` 또는 `mobile`을, 그다음 `native`(웹을 제외한 모든 플랫폼)을, 마지막으로 `default`을 찾습니다.

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

일치하는 항목이 없고 `default`도 없으면 `undefined`를 반환합니다.

<a id="rendering-different-components"></a>

### 다른 컴포넌트 렌더링

선택이 바뀌지 않는다면 같은 방식으로 (TSX에서는) 모듈 수준에서 컴포넌트를 선택하세요.

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

또는 [`when` / `<If>`](../elements/control-flow.md)로 인라인에서 선택할 수 있습니다.

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Tailwind의 플랫폼 변형

Rust에서는 `.when(os() == Os::Ios, |v| ..)`로 플랫폼별 스타일을 지정하고, TSX에서는 `ios:`, `android:`, `web:` 변형이 한 플랫폼에서만 클래스를 적용합니다.

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## 공통 동작을 우선하기

플랫폼 검사를 사용하기 전에, 그 차이가 사용자에게 정말 중요한지 먼저 생각해 보세요. 요소와 스타일은 달라야 하는 부분(스크롤 물리, 텍스트 렌더링, 키보드, 접근성)에서는 이미 각 플랫폼의 네이티브 동작에 맞게 매핑되어 있고, 사용자가 일관성을 기대하는 부분(앱 고유의 외관)에서는 동일하게 유지됩니다. 플랫폼 검사는 사용자가 의존하는 플랫폼 관례에만 사용하는 것이 좋습니다. 예를 들면 Android의 뒤로 가기 버튼과 토스트, iOS의 시트와 큰 제목, 자동 완성 이름, Android의 리플이 있습니다.

<a id="related"></a>

## 관련 문서

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) 및 [`BackHandler`](../modules/nsh-mobile.md#backhandler): 레퍼런스.
- [`nsh`의 디바이스 API](../modules/nsh.md#device): `platform`.
- [네이티브 컴포넌트](./native-components.md): 호스트 앱이 각 플랫폼에서 제공하는 뷰 사용하기.
- [Tailwind](./tailwind.md): 모든 변형.
