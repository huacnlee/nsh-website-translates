---
title: "기기 및 환경"
description: "창 크기, 색상 구성표, 글꼴 배율, 안전 영역, 플랫폼, 픽셀 밀도, 레이아웃 방향을 읽고, 이러한 값이 변경될 때 대응하는 방법을 설명합니다."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# 기기와 환경

앱이 실행되는 동안 환경은 계속 바뀝니다. 창 크기가 바뀌고(회전, 분할 보기, Mac 창), 사용자가 다크 모드나 더 큰 텍스트 크기로 전환하고, 키보드가 나타났다 사라집니다. NSH는 이런 요소를 각각 **반응형 접근자**(reactive accessor)로 제공합니다. 시그널처럼 호출하면, 이를 읽은 것(스타일, 텍스트, 계산된 값)이 값이 바뀔 때 갱신됩니다. 추가하거나 제거해야 하는 리스너는 없습니다.

Rust에서 접근자는 `nsh_core::prelude`의 함수이고, TSX에서는 표에 나열된 모듈에서 가져옵니다.

| Rust | TSX | 값 |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | 서피스의 너비와 높이(포인트 단위). |
| `dark()` | `colorScheme()` (`nsh`) | 다크 또는 라이트: 시스템의 모드 또는 앱 자체의 모드(`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | 기본값 대비 사용자가 선호하는 텍스트 크기(1이 기본값). |
| `safe_area()` | `safeArea()` (`nsh`) | 시스템 UI에 가려지지 않는 서피스의 인셋: 위, 오른쪽, 아래, 왼쪽. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | 호출한 컴포넌트(페이지, 대화 상자)가 렌더링되는 위치의 인셋. |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | 소프트웨어 키보드의 높이와 애니메이션 지속 시간. |
| `locale()` | `locale()` (`nsh`) | BCP 47 태그(`"en-US"`, `"zh-Hans-CN"`)로 나타낸 사용자의 로케일: `Intl`이 기본적으로 이 로케일에 맞춰 형식을 지정합니다. |
| `lifecycle()` | `lifecycle()` (`nsh`) | 앱이 사용 중인지 여부: `active`, `inactive`(보이지만 포커스는 없음) 또는 `background`([백그라운드에서](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | [접근성](./accessibility.md)을 참고하세요. |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## 창 크기와 반응형 레이아웃

`window()`(TSX: `windowSize()`)는 NSH가 렌더링하는 서피스의 크기입니다. 휴대폰에서는 화면, 분할 보기의 iPad나 Mac에서는 창, NSH가 임베드된 경우에는 호스트 뷰의 크기입니다. 크기만이 아니라 레이아웃 자체를 바꾸는 데 사용하세요.

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

크기를 읽지 않아도 flexbox, 퍼센트, `aspect_ratio`(`aspectRatio`)만으로 충분한 경우가 많습니다. [레이아웃](./layout.md)을 참고하세요. Rust의 `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())`은 너비에 따라 스타일을 전환합니다. Tailwind를 사용하는 TSX에서는 브레이크포인트 변형(`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`)과 `portrait:` / `landscape:`도 창을 따라갑니다: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## 다크 모드

앱이 자체 모드를 설정하지 않으면 모양은 시스템을 따릅니다. Rust에서 다크 모드를 지원하는 가장 간단한 방법은 라이트 값과 다크 값을 가진 색상 `AdaptiveColor::rgb(light, dark)`입니다. 실행할 코드 없이도 모양이 바뀌면 네이티브하게 전환됩니다. TSX에서는 `colorScheme()`가 `"dark"`일 때 적용되는 Tailwind 변형 `dark:`을 사용합니다.

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

그 밖의 경우에는 클로저나 계산된 값에서 `dark()`(TSX: `colorScheme()`)을 읽으세요. TSX에서 색상이 몇 개를 넘으면 팔레트를 한 번만 만들어 두세요.

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Rust 컴포넌트도 라이트 값과 다크 값을 가진 테마(`nsh.json` `"theme"`, [Rust로 빌드하기](./rust.md) 참고)에서 색상을 가져오므로 시스템에 따라 함께 전환됩니다. 상태 표시줄을 배경에 맞추려면 페이지와 대화 상자에 [`statusBar`](../modules/nsh-base.md#status-bar)를 지정하거나, 앱 전체에는 `nsh.json`에서 지정하세요.

<a id="an-app-with-its-own-appearance"></a>

### 자체 모양을 가진 앱

항상 다크(또는 항상 라이트)인 앱은 `nsh.json`에 이를 명시합니다. 그러면 `dark()`과 `colorScheme()`, 적응형 색상, `dark:` 클래스, 테마, 상태 표시줄의 기본 스타일, 알림이 첫 프레임부터 이를 따릅니다(패키징된 앱도 해당 모양으로 실행됩니다).

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)`(TSX: `nsh`의 `setColorScheme`)은 앱 내 모양 설정을 위해 실행 중에 모양을 바꿉니다. `Appearance::System`(`"system"`)는 다시 시스템을 따릅니다.

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> 개발 중에는 두 가지 모양을 모두 테스트하세요. `xcrun simctl ui booted appearance dark`로 iOS 시뮬레이터의 모양을 전환할 수 있고, Android에는 빠른 설정에 다크 테마 토글이 있습니다. 변경 사항은 다시 로드하지 않아도 앱에 즉시 반영됩니다.

<a id="text-size"></a>

## 텍스트 크기

`font_scale()`(TSX: `fontScale()`)은 기본값 대비 사용자의 텍스트 크기 설정(iOS의 Dynamic Type, Android의 글꼴 크기)입니다. 텍스트와 입력란은 스스로 이를 따릅니다. 사용자가 더 큰 텍스트를 요청하면 `fontSize: 16`가 더 크게 렌더링됩니다. 요소별로 이를 끄거나 상한을 둘 수 있습니다.

| Rust (`text`, `input`) | TSX (`<Text>`, `<Input>`) | 기본값 | 설명 |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | 시스템 텍스트 크기를 따릅니다. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0`(없음) | 이 텍스트에 적용되는 최대 배율. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

텍스트를 자동으로 따르지 않는 레이아웃을 조정해야 할 때, 예를 들어 텍스트가 커지면 행을 열로 바꾸려면 `font_scale()`을 읽으세요. Rust에서는 `.style_when(|| font_scale() > 1.3, |s| s.flex_col())`, TSX에서는 `flexDirection: fontScale() > 1.3 ? "column" : "row"`입니다.

텍스트 크기는 텍스트의 크기를 조절합니다. 글꼴 배율을 허용하는 모든 텍스트와 입력란, 그리고 플랫폼의 알림과 토스트가 대상입니다. 길이는 크기를 유지합니다. 포인트나 클래스(`p-4`, `rounded-lg`, `w-[2rem]`)로 지정한 간격, 너비와 높이, 모서리 반경, 테두리, 이미지가 이에 해당합니다. 콘텐츠에 따라 크기가 정해지는 상자는 텍스트와 함께 커집니다.

<a id="language-and-region"></a>

## 언어와 지역

`locale()`은 BCP 47 태그로 나타낸 사용자의 로케일입니다(Rust에서는 `locale().as_str()`). TSX에서 `Intl`은 기본적으로 이 로케일에 맞춰 숫자와 날짜의 형식을 지정하므로, `new Intl.NumberFormat().format(1234.5)`은 `en-US`에서 `1,234.5`을, `de-DE`에서 `1.234,5`을 반환합니다. 직접 만든 번역 문자열을 고르려면 `locale()`를 읽으세요. 이를 읽는 텍스트는 값이 바뀔 때 갱신됩니다.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## 임베딩 앱에서

네이티브 앱 안에 표시되는 앱은 임베딩 앱이 설정을 지정한 경우 그 설정을 따릅니다. 임베딩 API의 로케일과 텍스트 크기(Rust의 [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md), [Windows](./windows.md)에서는 `AppView::set_locale`와 `set_font_scale`, Swift의 [iOS](./ios.md)에서는 `locale`과 `fontScale`, Java의 [Android](./android.md)에서는 `setLocale`와 `setFontScale`)가 시스템의 언어와 텍스트 크기를 대신합니다. `locale()`, `Intl`, `fontScale()`과 텍스트는 시스템 변경을 따를 때와 마찬가지로 이를 즉시 따르며, 임베딩 앱이 설정을 해제하면 시스템 값으로 돌아갑니다. 네이티브 앱에서 사용자가 자체 언어나 텍스트 크기를 선택할 수 있을 때 사용하세요.

<a id="in-the-background"></a>

## 백그라운드에서

`lifecycle()`(TSX에서도 동일)는 사용자가 앱을 사용 중인지 알려 줍니다. 포그라운드에서는 `active`, 앱이 여전히 보이지만 다른 앱이나 창이 포커스를 가진 경우(또는 앱 전환기나 걸려 오는 전화처럼 시스템이 그 위에 무언가를 표시하는 경우)에는 `inactive`, 앱이 보이지 않을 때(휴대폰에서는 백그라운드, 데스크톱에서는 최소화, 웹에서는 숨겨진 탭)는 `background`입니다. 다른 접근자와 마찬가지로 이를 읽은 것을 갱신하므로, 이펙트로 백그라운드에서 실시간 피드, 폴링, 동영상을 일시 중지하고 사용자가 돌아오면 재개할 수 있습니다.

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

작업을 일시 중지하는 데는 `background`을 사용하고, 사용자가 변경한 내용은 변경하는 즉시 저장하세요. 시스템은 앱이 백그라운드로 이동한 지 몇 초 만에 앱을 중단할 수 있으며, 그 변경을 읽는 이펙트가 실행되기 전에 중단될 수도 있습니다. 네이티브 앱 안에 표시되는 앱은 그 앱의 상태를 따르고, 앱에 창이 여러 개 있는 경우(iPad, 데스크톱) 뷰는 자신이 속한 창을 따릅니다. 테스트에서는 `nsh/test`의 `app.setLifecycle("background")`이 앱을 그 상태로 옮깁니다([테스트](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## 안전 영역

노치, 홈 인디케이터, 상태 표시줄, Android의 내비게이션 바, Mac Catalyst의 제목 표시줄은 서피스의 일부를 가립니다. NSH 앱은 모든 플랫폼에서 가장자리까지 그리며, 가려진 부분을 인셋으로 받습니다.

- `safe_area()`(TSX: `safeArea()`)는 서피스의 인셋을 제공합니다.
- 컴포넌트의 `cx.insets()`(TSX: `safeAreaInsets()`)는 **컴포넌트가 렌더링되는 위치**의 인셋을 제공합니다. 내비게이션 [페이지](./navigation.md#safe-areas-under-the-header) 안에서는 헤더 아래부터 측정되고, [대화 상자](../elements/dialog.md) 안에서는 대화 상자의 인셋입니다. 여러 곳에 표시될 수 있는 컴포넌트에서는 이쪽을 사용하세요.
- CSS의 `env(safe-area-inset-top)`, `-right`, `-bottom`, `-left`은 `padding*`와 `margin*`에서 뷰가 렌더링되는 위치의 인셋만큼 패딩이나 간격을 줍니다(`calc(env(safe-area-inset-bottom) + 8px)`은 길이를 더하고, Tailwind는 `pt-[env(safe-area-inset-top)]`, Rust는 `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))` 등). 패딩은 인셋이 바뀔 때 네이티브하게 갱신됩니다([안전 영역](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

Android에서 툴바 아래에 임베드된 뷰는 UIKit의 안전 영역처럼 자신과 겹치는 시스템 바 부분만 받습니다. 상태 표시줄까지 닿지 않으면 위쪽 인셋은 없습니다.

<a id="the-platform"></a>

## 플랫폼

Rust의 `os()`, `os_version()`, `idiom()`, `is_desktop()`, `is_catalyst()`과 TSX의 `nsh`에서 가져오는 `platform` 상수는 앱이 실행되는 위치를 설명합니다. 앱이 실행되는 동안에는 바뀌지 않습니다.

| Rust | TSX | 설명 |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` 또는 `Os::Web`(`os().name()`은 TSX의 문자열). Mac Catalyst는 iOS입니다. |
| `os_version()` | `platform.version` | 주 버전과 부 버전. Android에서는 API 레벨과 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` 또는 `Desktop`. `Desktop`은 `is_desktop()`이 참인 곳에서만 해당합니다. |
| `is_desktop()` | `platform.desktop` | macOS, Windows, Linux 또는 데스크톱 브라우저([데스크톱과 모바일](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | 두 idiom 모두의 Mac Catalyst. |

TSX의 `platform` 전체:

| 멤버 | 설명 |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` 또는 `"web"`. Mac Catalyst는 `"ios"`를 보고합니다. |
| `platform.version` | 문자열: iOS와 데스크톱에서는 OS 버전(`"17.5"`), Android에서는 API 레벨(`"35"`), 웹에서는 `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` 또는 `"desktop"`. `"desktop"`은 `platform.desktop`이 `true`인 곳에서만 해당합니다. `"mac"`은 Mac Catalyst에서 UIKit의 Mac idiom이며, 모바일 idiom입니다. |
| `platform.desktop` | 데스크톱 동작이 적용됩니다: macOS, Windows, Linux, 데스크톱 브라우저. `desktop={{…}}` props와 `platform.select({ desktop })`가 이를 따릅니다. |
| `platform.catalyst` | 앱이 Mac 또는 iPad idiom의 Mac Catalyst(`os` `"ios"`)에서 실행됩니다. |
| `platform.select(spec)` | 이 플랫폼의 값. [플랫폼별 코드](./platform-specific.md#platformselect)를 참고하세요. |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test`은 헤드리스에서 iOS로 실행됩니다.

[Linux](./linux.md)에서 `platform.os`은 `"linux"`, idiom은 `"desktop"`이고 `platform.version`은 커널의 주 버전과 부 버전(`"6.12"`)입니다. 배포판마다 릴리스 번호를 매기는 방식이 달라 서로 비교할 수 없기 때문입니다. Linux에서는 안전 영역과 키보드 높이가 0이고, `colorScheme()`은 데스크톱의 설정(XDG 설정 포털)을 실시간으로 따르며, `fontScale()`은 데스크톱의 텍스트 배율을, `pixelRatio()`은 분수 배율을 포함한 디스플레이의 배율을 따릅니다.

[macOS](./macos.md)(AppKit 백엔드)에서 `platform.os`은 `"macos"`, idiom은 `"desktop"`이고 `platform.version`은 macOS 버전입니다. 안전 영역과 키보드 높이는 0이고, `colorScheme()`은 시스템의 모양을 실시간으로 따르며, `fontScale()`은 1이고 `pixelRatio()`은 디스플레이의 백킹 스케일입니다.

[Windows](./windows.md)에서 `platform.os`은 `"windows"`, idiom은 `"desktop"`이고 `platform.version`은 `"10.0"`이며, Windows 11에서도 마찬가지입니다(Windows는 버전 번호를 유지했습니다). 안전 영역과 키보드 높이는 0이고, `colorScheme()`은 설정 > 개인 설정 > 색을 실시간으로 따르며, `fontScale()`은 텍스트 크기 설정(1~2.25)을, `reduceMotion()`은 애니메이션 효과 설정을, `pixelRatio()`은 모니터의 배율을 따르고, `Intl`은 사용자의 지역 형식에 맞춰 형식을 지정합니다.

브라우저([웹 런타임](./web.md))에서 `platform.os`은 `"web"`이고 `platform.version`은 `"0.0"`입니다. idiom은 마우스가 있고 창 너비가 600포인트 이상이면 `"desktop"`, 태블릿이면 `"pad"`, 휴대폰이면 `"phone"`이며, 앱이 시작될 때 결정됩니다. 로케일, `reduceMotion()`, `fontScale()`(브라우저의 텍스트 크기), `pixelRatio()`, 안전 영역, 키보드 높이는 브라우저에서 가져오며 브라우저를 실시간으로 따릅니다.

<a id="pixel-density"></a>

## 픽셀 밀도

Rust의 `pixel_ratio()`과 `round_to_nearest_pixel(points)`, TSX의 `nsh`에서 가져오는 `pixelRatio()`는 포인트와 기기 픽셀 사이를 변환합니다.

| Rust | TSX | 설명 |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | 포인트당 기기 픽셀 수(대부분의 휴대폰에서 2 또는 3), 반응형. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | 가장 가까운 기기 픽셀로 반올림한 포인트. |

기기 픽셀 하나 높이의 헤어라인:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()`과 `pixelRatio()`는 반응형이므로, 헤어라인은 밀도가 다른 화면으로 옮긴 창을 따라갑니다.

<a id="right-to-left"></a>

## 오른쪽에서 왼쪽 방향

기기 언어가 오른쪽에서 왼쪽으로 쓰는 언어(아랍어, 히브리어, 페르시아어 등)이면 NSH는 앱을 오른쪽에서 왼쪽으로 배치합니다. 행은 오른쪽에서 시작하고, 논리적 스타일 속성은 오른쪽에서 왼쪽 방향의 면을 취하며, 텍스트는 오른쪽에 정렬되고, 네이티브 위젯은 좌우가 반전됩니다. 레이아웃 방향은 사용자의 언어를 자동으로 따릅니다. 뷰의 `direction` 스타일(`"ltr"`, `"rtl"` 또는 `"inherit"`, Rust에서는 `.direction(LayoutDirection::..)`)은 그 하위 트리의 방향을 정하며, 루트 뷰에 지정하면 앱의 방향을 정합니다.

변경 사항은 앱을 다시 시작하지 않아도 즉시 적용됩니다. 이 페이지의 데모는 `direction` 스타일을 토글합니다.

논리적 속성으로 양방향에서 모두 동작하는 레이아웃을 작성하세요. Rust에서는 `ms` / `me`과 `ps` / `pe`(Tailwind의 이름), TSX에서는 `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` 등이 있으며, 왼쪽에서 오른쪽 레이아웃에서는 왼쪽과 오른쪽을, 오른쪽에서 왼쪽 레이아웃에서는 그 반대를 의미합니다. `left`과 `right`(`marginLeft`, `paddingRight`, `left`, `textAlign: "left"` 등)는 CSS에서처럼 두 방향 모두에서 같은 면을 유지합니다. `direction` 스타일(`"inherit"`, `"ltr"`, `"rtl"`)은 하위 트리의 방향을 재정의하며, 예를 들어 전화번호나 미디어 플레이어의 컨트롤을 왼쪽에서 오른쪽으로 유지할 때 사용합니다. Tailwind 변형 `rtl:`과 `ltr:`는 방향별로 적용됩니다.

가로 스크롤 뷰와 리스트는 오른쪽에서 왼쪽 레이아웃에서 오른쪽 끝에서 시작합니다. Android에서는 네이티브 위젯이 반전되려면 호스트 앱이 매니페스트에 `android:supportsRtl="true"`을 선언해야 합니다.

<a id="related"></a>

## 관련 문서

- [`nsh`의 기기 API](../modules/nsh.md#device): 레퍼런스.
- [플랫폼별 코드](./platform-specific.md): `platform.select`, 플랫폼 props와 모듈.
- [접근성](./accessibility.md): 스크린 리더와 동작 줄이기.
- [안전 영역](../elements/safe-area.md), [키보드](../elements/keyboard.md), [상태 표시줄](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, 브레이크포인트 및 방향 변형.
