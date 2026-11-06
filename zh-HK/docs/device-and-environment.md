---
title: "裝置與環境"
description: "讀取視窗大小、色彩配置、字體縮放比例、安全區域、平台、像素密度及版面方向,並在這些項目變更時作出回應。"
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---


# 裝置與環境

應用程式運行時，所處的環境會不斷改變：視窗大小改變（旋轉螢幕、分割檢視、Mac 視窗）、用戶切換到深色模式或較大的文字大小、鍵盤彈出或收起。NSH 將這些變化都以**響應式存取器**（reactive accessor）提供：像 signal 一樣呼叫它，所有讀取過它的內容（樣式、文字、計算值）都會在它改變時自動更新，無需新增或移除任何監聽器。

在 Rust 中，這些存取器是 `nsh_core::prelude` 的函數；在 TSX 中，它們來自所列出的模組。

| Rust | TSX | 值 |
|---|---|---|
| `window()` | `windowSize()`（`nsh`） | 表面的寬度和高度，以 point 為單位。 |
| `dark()` | `colorScheme()`（`nsh`） | 深色或淺色：系統的設定，或應用程式自訂的設定（`set_color_scheme`、`setColorScheme`）。 |
| `font_scale()` | `fontScale()`（`nsh`） | 用戶偏好的文字大小相對於預設值的比例（1 為預設值）。 |
| `safe_area()` | `safeArea()`（`nsh`） | 表面中未被系統 UI 遮蓋部分的 inset：上、右、下、左。 |
| `cx.insets()` | `safeAreaInsets()`（`nsh`） | 呼叫端 component 所渲染位置的 inset（頁面、對話框）。 |
| `keyboard_height()`、`keyboard_duration()` | `keyboardFrame()`（`nsh`） | 軟鍵盤的高度和動畫時長。 |
| `locale()` | `locale()`（`nsh`） | 用戶的語言地區，以 BCP 47 標籤表示（`"en-US"`、`"zh-Hans-CN"`）：`Intl` 預設按此格式化。 |
| `lifecycle()` | `lifecycle()`（`nsh`） | 應用程式是否正在使用：`active`、`inactive`（可見但沒有焦點）或 `background`（[在背景](#in-the-background)）。 |
| `reduce_motion()`、`screen_reader()` | `reduceMotion()`、`screenReaderEnabled()`（`nsh`） | 見[無障礙功能](./accessibility.md)。 |

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

## 視窗大小與響應式佈局

`window()`（TSX：`windowSize()`）是 NSH 渲染所在表面的大小：手機上是螢幕，iPad 分割檢視或 Mac 上是視窗，NSH 嵌入其他應用程式時則是宿主 view。用它來改變佈局，而不只是改變尺寸：

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

很多時候，只靠 flexbox、百分比和 `aspect_ratio`（`aspectRatio`）已經足夠，完全不需要讀取尺寸；請參閱[佈局](./layout.md)。Rust 的 `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` 會隨寬度切換樣式；在 TSX 中配合 Tailwind 時，breakpoint variant（`sm:`、`md:`、`lg:`、`xl:`、`2xl:`、`max-*:`、`min-[…]:`）以及 `portrait:` / `landscape:` 同樣會跟隨視窗：`class="grid grid-cols-2 md:grid-cols-4"`。

<a id="dark-mode"></a>

## 深色模式

除非應用程式自行設定，否則外觀會跟隨系統。在 Rust 中，支援深色模式最簡單的方法是使用同時包含淺色值和深色值的顏色 `AdaptiveColor::rgb(light, dark)`：外觀改變時它會在原生層自動切換，無需執行任何程式碼。在 TSX 中則使用 `dark:` Tailwind variant，它會在 `colorScheme()` 為 `"dark"` 時生效：

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

其他情況下，請在 closure 或計算值中讀取 `dark()`（TSX：`colorScheme()`）；在 TSX 中，若涉及的顏色不止幾個，建議一次性派生出一組調色盤：

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

Rust component 的顏色也取自主題，主題同時有淺色值和深色值（`nsh.json` `"theme"`，參閱[使用 Rust 開發](./rust.md)），因此同樣會隨系統切換。若要讓狀態列配合背景，可為頁面和對話框設定 [`statusBar`](../modules/nsh-base.md#status-bar)，或在 `nsh.json` 中為整個應用程式設定一個。

<a id="an-app-with-its-own-appearance"></a>

### 自訂外觀的應用程式

若應用程式始終是深色（或始終是淺色），可在 `nsh.json` 中指明，`dark()` 和 `colorScheme()`、自適應顏色、`dark:` class、主題、狀態列的預設樣式以及警示框，由第一個畫面起都會跟隨該設定（打包後的應用程式啟動時也會使用該外觀）：

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)`（TSX：來自 `nsh` 的 `setColorScheme`）可在運行時改變外觀，適用於應用程式內的外觀設定；`Appearance::System`（`"system"`）則會重新跟隨系統：

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
> 開發時請測試兩種外觀：`xcrun simctl ui booted appearance dark` 可切換 iOS 模擬器的外觀，Android 則可在「快速設定」中切換深色主題。改變會即時反映到應用程式，無需重新載入。

<a id="text-size"></a>

## 文字大小

`font_scale()`（TSX：`fontScale()`）是用戶的文字大小設定（iOS 上的 Dynamic Type，Android 上的字型大小）相對於預設值的比例。文字和輸入框會自動跟隨：用戶要求較大的文字時，`fontSize: 16` 會以較大的尺寸渲染。你也可以逐個元素選擇不跟隨，或設定上限：

| Rust（用於 `text` 和 `input`） | TSX（用於 `<Text>` 和 `<Input>`） | 預設值 | 說明 |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | 跟隨系統的文字大小。 |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0`（無） | 套用於此文字的最大縮放比例。 |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

對於不會自動跟隨文字大小的佈局，可讀取 `font_scale()` 來調整，例如文字變大時將一行改為一列：Rust 中使用 `.style_when(|| font_scale() > 1.3, |s| s.flex_col())`，TSX 中使用 `flexDirection: fontScale() > 1.3 ? "column" : "row"`。

文字大小設定會縮放文字：所有允許字型縮放的文字和輸入框，以及平台的警示框和 toast。長度則維持不變：間距、寬度和高度、圓角半徑、邊框和圖片，無論是以 point 還是 class（`p-4`、`rounded-lg`、`w-[2rem]`）指定。由內容決定大小的方框會隨文字一同增大。

<a id="language-and-region"></a>

## 語言與地區

`locale()` 是用戶的語言地區，以 BCP 47 標籤表示（Rust 中為 `locale().as_str()`）。在 TSX 中，`Intl` 預設會按該地區格式化數字和日期，因此 `new Intl.NumberFormat().format(1234.5)` 在 `en-US` 中得到 `1,234.5`，在 `de-DE` 中得到 `1.234,5`。請讀取 `locale()` 來選擇你自己的翻譯字串：讀取了它的文字會在它改變時更新。

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

## 在嵌入式應用程式中

顯示在原生應用程式內的應用程式，在宿主應用程式有自行設定時，會跟隨其設定：嵌入 API 的語言地區和文字大小（Rust 中在 [GPUI](./gpui.md)、[macOS](./macos.md)、[Linux](./linux.md) 和 [Windows](./windows.md) 上為 `AppView::set_locale` 和 `set_font_scale`，Swift 中在 [iOS](./ios.md) 上為 `locale` 和 `fontScale`，Java 中在 [Android](./android.md) 上為 `setLocale` 和 `setFontScale`）會取代系統的語言和文字大小。`locale()`、`Intl`、`fontScale()` 和文字會即時跟隨它們，就像跟隨系統的改變一樣；當宿主應用程式清除這些設定後，便會恢復使用系統的設定。若原生應用程式讓其用戶自行選擇語言或文字大小，便可使用這些 API。

<a id="in-the-background"></a>

## 在背景

`lifecycle()`（TSX 中相同）表示用戶是否正在使用應用程式。應用程式在前景時為 `active`；仍然可見但其他應用程式或視窗取得了焦點（或系統在其上方顯示內容：應用程式切換器、來電）時為 `inactive`；不可見時為 `background`：手機上在背景、桌面上已最小化、網頁上為隱藏的分頁。與所有存取器一樣，它會更新讀取過它的內容，因此可以用 effect 在背景暫停即時資料串流、輪詢或影片，並在用戶回來時恢復：

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

`background` 只適合用來暫停工作，而用戶所做的更改應在更改時即時儲存：系統可能在應用程式進入背景數秒後便將其暫停，此時讀取該變化的 effect 可能還未來得及運行。顯示在原生應用程式內的應用程式會跟隨該應用程式的狀態；若應用程式有多個視窗（iPad、桌面），view 會跟隨它所在的視窗。在測試中，`nsh/test` 的 `app.setLifecycle("background")` 可將應用程式移到該狀態（[測試](./testing-and-trace.md#steps)）。

<a id="safe-areas"></a>

## 安全區域

瀏海、主畫面指示條、狀態列、Android 的導覽列以及 Mac Catalyst 的標題列，都會遮蓋表面的部分區域。NSH 應用程式在所有平台上都是邊到邊繪製，並以 inset 的形式取得被遮蓋的部分。

- `safe_area()`（TSX：`safeArea()`）提供表面的 inset。
- component 的 `cx.insets()`（TSX：`safeAreaInsets()`）提供 **component 所渲染位置** 的 inset：在導覽[頁面](./navigation.md#safe-areas-under-the-header)內，它們是在標題下方量度的；在[對話框](../elements/dialog.md)內，則是對話框自身的 inset。在可能顯示於多處的 component 中，請優先使用它。
- CSS 的 `env(safe-area-inset-top)`、`-right`、`-bottom` 和 `-left` 可按 view 所渲染位置的 inset 為任何 view 設定內距或間距，用於 `padding*` 和 `margin*`（`calc(env(safe-area-inset-bottom) + 8px)` 可加上一個長度；Tailwind 為 `pt-[env(safe-area-inset-top)]`；Rust 為 `.p_safe_area()`、`.pt_safe_area()`、`.pb_safe_area_plus(px(8.0))` 等）。inset 改變時，內距會在原生層更新（[安全區域](../elements/safe-area.md)）。

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

在 Android 上，嵌入在工具列下方的 view 只會取得與它重疊的那部分系統列，與 UIKit 的安全區域一樣：若它沒有伸延至狀態列，便沒有頂部 inset。

<a id="the-platform"></a>

## 平台

Rust 中的 `os()`、`os_version()`、`idiom()`、`is_desktop()` 和 `is_catalyst()`，以及 TSX 中來自 `nsh` 的 `platform` 常數，描述應用程式運行的環境。它們在應用程式運行期間保持不變。

| Rust | TSX | 說明 |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux` 或 `Os::Web`（`os().name()` 是 TSX 的字串）。Mac Catalyst 屬於 iOS。 |
| `os_version()` | `platform.version` | 主版本和次版本；在 Android 上為 API level 和 0。 |
| `idiom()` | `platform.idiom` | `Idiom::Phone`、`Pad`、`Mac`、`Tv` 或 `Desktop`；僅在 `is_desktop()` 成立時才是 `Desktop`。 |
| `is_desktop()` | `platform.desktop` | macOS、Windows 或 Linux，或桌面瀏覽器（[桌面與流動裝置](./platform-specific.md#desktop-and-mobile)）。 |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst，不論屬於哪一種 idiom。 |

TSX 的 `platform` 完整成員如下：

| 成員 | 說明 |
|---|---|
| `platform.os` | `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"` 或 `"web"`。Mac Catalyst 回報 `"ios"`。 |
| `platform.version` | 字串：iOS 和桌面平台為作業系統版本（`"17.5"`）；Android 為 API level（`"35"`）；web 為 `"0.0"`。 |
| `platform.idiom` | `"phone"`、`"pad"`、`"mac"`、`"tv"` 或 `"desktop"`。僅在 `platform.desktop` 為 `true` 時才是 `"desktop"`。`"mac"` 是 Mac Catalyst 下 UIKit 的 Mac idiom，屬於流動 idiom。 |
| `platform.desktop` | 適用桌面行為：macOS、Windows、Linux 和桌面瀏覽器。`desktop={{…}}` prop 和 `platform.select({ desktop })` 會跟隨它。 |
| `platform.catalyst` | 應用程式在 Mac Catalyst（`os` `"ios"`）下運行，屬於 Mac 或 iPad idiom。 |
| `platform.select(spec)` | 此平台對應的值；參閱[平台專屬程式碼](./platform-specific.md#platformselect)。 |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` 以無介面（headless）模式運行，視為 iOS。

在 [Linux](./linux.md) 上，`platform.os` 為 `"linux"`，idiom 為 `"desktop"`，`platform.version` 為內核的主版本和次版本（`"6.12"`）：各發行版的版本編號方式不同，無法互相比較。在 Linux 上，安全區域和鍵盤高度為 0，`colorScheme()` 即時跟隨桌面環境的設定（XDG settings portal），`fontScale()` 跟隨桌面環境的文字縮放，`pixelRatio()` 跟隨顯示器的縮放比例（包括小數比例）。

在 [macOS](./macos.md)（AppKit backend）上，`platform.os` 為 `"macos"`，idiom 為 `"desktop"`，`platform.version` 為 macOS 版本。安全區域和鍵盤高度為 0，`colorScheme()` 即時跟隨系統的外觀，`fontScale()` 為 1，`pixelRatio()` 為顯示器的 backing scale。

在 [Windows](./windows.md) 上，`platform.os` 為 `"windows"`，idiom 為 `"desktop"`，`platform.version` 為 `"10.0"`，Windows 11 亦然（Windows 沿用了該版本號）。安全區域和鍵盤高度為 0，`colorScheme()` 即時跟隨「設定」>「個人化」>「色彩」，`fontScale()` 跟隨「文字大小」設定（1 至 2.25），`reduceMotion()` 跟隨動畫效果設定，`pixelRatio()` 跟隨顯示器的縮放比例，`Intl` 則按用戶的地區格式進行格式化。

在瀏覽器中（[web runtime](./web.md)），`platform.os` 為 `"web"`，`platform.version` 為 `"0.0"`。idiom 在配備滑鼠且視窗寬度至少 600 point 時為 `"desktop"`，在平板電腦上為 `"pad"`，在手機上為 `"phone"`，於應用程式啟動時決定。語言地區、`reduceMotion()`、`fontScale()`（瀏覽器的文字大小）、`pixelRatio()`、安全區域和鍵盤高度均來自瀏覽器，並即時跟隨其變化。

<a id="pixel-density"></a>

## 像素密度

Rust 中的 `pixel_ratio()` 和 `round_to_nearest_pixel(points)`，以及 TSX 中來自 `nsh` 的 `pixelRatio()`，用於在 point 與裝置像素之間轉換。

| Rust | TSX | 說明 |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | 每個 point 的裝置像素數（大多數手機為 2 或 3），具響應性。 |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | 四捨五入至最接近裝置像素的 point 值。 |

一條發絲線（hairline），高度為一個裝置像素：

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

`pixel_ratio()` 和 `pixelRatio()` 具響應性，因此當視窗移到另一個像素密度的螢幕時，發絲線會隨之調整。

<a id="right-to-left"></a>

## 由右至左

當裝置語言是由右至左書寫（阿拉伯文、希伯來文、波斯文等）時，NSH 會將應用程式由右至左排版：行由右邊開始排列，邏輯樣式屬性採用其由右至左的對應方向，文字靠右對齊，原生 widget 也會鏡像翻轉。排版方向會自動跟隨用戶的語言。view 的 `direction` 樣式（`"ltr"`、`"rtl"` 或 `"inherit"`；Rust 中為 `.direction(LayoutDirection::..)`）可設定其子樹的方向；設定在根 view 上時，則設定整個應用程式的方向。

更改會即時生效，無需重新啟動應用程式；本頁的示範會切換 `direction` 樣式。

請使用邏輯屬性編寫兩個方向都適用的佈局：Rust 中為 `ms` / `me` 和 `ps` / `pe`（Tailwind 的名稱），TSX 中為 `marginStart` / `marginEnd`、`paddingStart` / `paddingEnd`、`start` / `end`、`borderTopStartRadius`、`textAlign: "start"` 等，它們在由左至右的佈局中表示左和右，在由右至左的佈局中則相反。`left` 和 `right`（`marginLeft`、`paddingRight`、`left`、`textAlign: "left"` 等）與 CSS 一樣，在兩個方向下都維持原來的一側。`direction` 樣式（`"inherit"`、`"ltr"`、`"rtl"`）可覆寫某個子樹的方向，例如讓電話號碼或媒體播放器的控制項保持由左至右。`rtl:` 和 `ltr:` Tailwind variant 則按方向分別套用。

橫向捲動的 view 和清單在由右至左的佈局中會從最右端開始。在 Android 上，宿主應用程式必須在 manifest 中宣告 `android:supportsRtl="true"`，原生 widget 才會鏡像翻轉。

<a id="related"></a>

## 相關內容

- [`nsh` 的 device API](../modules/nsh.md#device)：參考文件。
- [平台專屬程式碼](./platform-specific.md)：`platform.select`、platform prop 與模組。
- [無障礙功能](./accessibility.md)：螢幕閱讀器與減少動態效果。
- [安全區域](../elements/safe-area.md)、[鍵盤](../elements/keyboard.md)和[狀態列](../modules/nsh-base.md#status-bar)。
- [Tailwind](./tailwind.md)：`dark:`、breakpoint 與方向 variant。
