---
title: "裝置與環境"
description: "讀取視窗大小、色彩配置、字型縮放比例、安全區域、平台、像素密度與版面配置方向，並在這些資訊變更時做出回應。"
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# 裝置與環境

App 執行期間,所處的環境會持續變化:視窗大小改變(旋轉、分割檢視、Mac 視窗)、使用者切換到深色模式或調大文字尺寸、鍵盤出現又消失。NSH 將這些變化都以**響應式存取器(reactive accessor)**的形式提供:像呼叫 signal 一樣呼叫它,凡是讀取它的內容(樣式、文字、計算值)都會在它變化時更新。不需要新增或移除任何監聽器。

在 Rust 中,存取器是 `nsh_core::prelude` 的函式;在 TSX 中,則來自所列的模組。

| Rust | TSX | 值 |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | 顯示區域(surface)的寬度與高度,單位為 point。 |
| `dark()` | `colorScheme()` (`nsh`) | 深色或淺色:採用系統的設定,或 App 自己的設定(`set_color_scheme`、`setColorScheme`)。 |
| `font_scale()` | `fontScale()` (`nsh`) | 使用者偏好的文字尺寸相對於預設值的比例(1 為預設值)。 |
| `safe_area()` | `safeArea()` (`nsh`) | 顯示區域中未被系統 UI 覆蓋部分的內縮量:上、右、下、左。 |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | 呼叫端元件所在渲染位置的內縮量(頁面、對話框)。 |
| `keyboard_height()`、`keyboard_duration()` | `keyboardFrame()` (`nsh`) | 軟體鍵盤的高度與動畫時長。 |
| `locale()` | `locale()` (`nsh`) | 使用者的地區設定,以 BCP 47 標籤表示(`"en-US"`、`"zh-Hans-CN"`):也是 `Intl` 預設採用的格式化依據。 |
| `lifecycle()` | `lifecycle()` (`nsh`) | App 是否正在使用中:`active`、`inactive`(可見但沒有焦點)或 `background`([在背景執行](#in-the-background))。 |
| `reduce_motion()`、`screen_reader()` | `reduceMotion()`、`screenReaderEnabled()` (`nsh`) | 請參閱[無障礙](./accessibility.md)。 |

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

## 視窗大小與響應式版面

`window()`(TSX:`windowSize()`)是 NSH 渲染所在顯示區域的大小:在手機上是螢幕,在分割檢視的 iPad 或 Mac 上是視窗,在嵌入 NSH 時則是宿主檢視。你可以用它來改變版面配置,而不只是改變尺寸:

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

很多時候,flexbox、百分比與 `aspect_ratio`(`aspectRatio`)就能完成工作,完全不需要讀取大小;請參閱[版面配置](./layout.md)。Rust 的 `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` 會隨寬度切換樣式;在使用 Tailwind 的 TSX 中,斷點變體(`sm:`、`md:`、`lg:`、`xl:`、`2xl:`、`max-*:`、`min-[…]:`)以及 `portrait:` / `landscape:` 同樣會跟隨視窗:`class="grid grid-cols-2 md:grid-cols-4"`。

<a id="dark-mode"></a>

## 深色模式

外觀預設跟隨系統,除非 App 自行設定。在 Rust 中,支援深色模式最簡單的方式是使用同時具有淺色值與深色值的顏色 `AdaptiveColor::rgb(light, dark)`:外觀改變時它會以原生方式切換,不需要執行任何程式碼。在 TSX 中則是使用 `dark:` Tailwind 變體,它在 `colorScheme()` 為 `"dark"` 時生效:

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

其他情況下,請在閉包或計算值中讀取 `dark()`(TSX:`colorScheme()`);在 TSX 中,若要處理的顏色不只幾個,可以一次性衍生出一組調色盤:

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

Rust 元件的顏色也取自主題,而主題具有淺色值與深色值(`nsh.json` `"theme"`,請參閱[以 Rust 建構](./rust.md)),因此它們同樣會隨系統切換。若要讓狀態列與你的背景相符,請為頁面與對話框指定 [`statusBar`](../modules/nsh-base.md#status-bar),或在 `nsh.json` 中為 App 指定一個。

<a id="an-app-with-its-own-appearance"></a>

### 擁有自己外觀的 App

永遠使用深色(或永遠使用淺色)的 App,可以在 `nsh.json` 中宣告,此後 `dark()` 與 `colorScheme()`、自適應顏色、`dark:` class、主題、狀態列的預設樣式以及警示框,從第一個畫面起都會跟隨它(封裝後的 App 啟動時也會採用):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)`(TSX:來自 `nsh` 的 `setColorScheme`)可在執行階段變更外觀,適用於 App 內的外觀設定;`Appearance::System`(`"system"`)則恢復跟隨系統:

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
> 開發時請測試兩種外觀:`xcrun simctl ui booted appearance dark` 可切換 iOS 模擬器的外觀,而 Android 在快速設定中有深色主題開關。變更會立即傳到你的 App,不需要重新載入。

<a id="text-size"></a>

## 文字尺寸

`font_scale()`(TSX:`fontScale()`)是使用者的文字尺寸設定(iOS 上的 Dynamic Type、Android 上的字型大小)相對於預設值的比例。文字與輸入框會自動跟隨:當使用者要求較大的文字時,`fontSize: 16` 會以較大的尺寸渲染。你也可以針對個別元素選擇不跟隨,或設定上限:

| Rust(用於 `text` 與 `input`) | TSX(用於 `<Text>` 與 `<Input>`) | 預設值 | 說明 |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | 跟隨系統文字尺寸。 |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0`(無) | 套用於此文字的最大縮放比例。 |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

若有不會自動跟隨文字的版面配置需要調整,例如文字變大時將橫列改為直欄,請讀取 `font_scale()`:Rust 中使用 `.style_when(|| font_scale() > 1.3, |s| s.flex_col())`,TSX 中使用 `flexDirection: fontScale() > 1.3 ? "column" : "row"`。

文字尺寸只會縮放文字:每個允許字型縮放的文字與輸入框,以及平台的警示框與 toast。長度保持不變:間距、寬度與高度、圓角半徑、邊框與圖片,無論以 point 或 class(`p-4`、`rounded-lg`、`w-[2rem]`)表示。依內容決定大小的方塊會隨其文字增大。

<a id="language-and-region"></a>

## 語言與地區

`locale()` 是使用者的地區設定,以 BCP 47 標籤表示(在 Rust 中為 `locale().as_str()`)。在 TSX 中,`Intl` 預設會依此格式化數字與日期,因此 `new Intl.NumberFormat().format(1234.5)` 在 `en-US` 中得到 `1,234.5`,在 `de-DE` 中得到 `1.234,5`。請讀取 `locale()` 來挑選你自己翻譯的字串:讀取它的文字會在它變化時更新。

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

## 在嵌入式 App 中

顯示於原生 App 內的 App,在原生 App 自行設定時會跟隨其設定:嵌入 API 的地區設定與文字尺寸(Rust 在 [GPUI](./gpui.md)、[macOS](./macos.md)、[Linux](./linux.md) 與 [Windows](./windows.md) 上使用 `AppView::set_locale` 與 `set_font_scale`,Swift 在 [iOS](./ios.md) 上使用 `locale` 與 `fontScale`,Java 在 [Android](./android.md) 上使用 `setLocale` 與 `setFontScale`)會取代系統的語言與文字尺寸。`locale()`、`Intl`、`fontScale()` 與文字會立即跟隨,就像跟隨系統的變更一樣;當嵌入的 App 清除這些設定時,系統的設定會恢復生效。當原生 App 讓使用者自行選擇語言或文字尺寸時,請使用它們。

<a id="in-the-background"></a>

## 在背景執行

`lifecycle()`(TSX 中相同)表示使用者是否正在使用 App。App 位於前景時為 `active`;App 仍然可見但其他 App 或視窗取得焦點(或系統在其上方顯示內容:App 切換器、來電)時為 `inactive`;App 不可見時為 `background`:手機上位於背景、桌面上已最小化、網頁上為隱藏的分頁。與所有存取器一樣,它會更新讀取它的內容,因此可以用 effect 在背景時暫停即時資料流、輪詢或影片,並在使用者返回時恢復:

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

請用 `background` 來暫停工作,並且在使用者變更內容時就立即儲存:系統可能在 App 進入背景後幾秒內就將其暫停,而此時讀取該變化的 effect 可能還來不及執行。顯示於原生 App 內的 App 會跟隨該 App 的狀態;在有多個視窗的情況下(iPad、桌面),檢視會跟隨其所在的視窗。在測試中,`nsh/test` 的 `app.setLifecycle("background")` 可將 App 移到背景([測試](./testing-and-trace.md#steps))。

<a id="safe-areas"></a>

## 安全區域

瀏海、Home 指示條、狀態列、Android 的導覽列以及 Mac Catalyst 的標題列,都會遮住顯示區域的一部分。NSH App 在所有平台上都是延伸到邊緣繪製,並以內縮量的形式取得被遮住的部分。

- `safe_area()`(TSX:`safeArea()`)提供顯示區域的內縮量。
- 元件的 `cx.insets()`(TSX:`safeAreaInsets()`)提供**元件渲染位置**的內縮量:在導覽[頁面](./navigation.md#safe-areas-under-the-header)內,它們是在標頭下方測量的;在[對話框](../elements/dialog.md)內,它們是對話框的內縮量。在可能顯示於多個位置的元件中,建議優先使用它。
- CSS 的 `env(safe-area-inset-top)`、`-right`、`-bottom` 與 `-left` 可依檢視渲染位置的內縮量,為任何檢視加上內距或間距,用於 `padding*` 與 `margin*`(`calc(env(safe-area-inset-bottom) + 8px)` 會加上一個長度;Tailwind 為 `pt-[env(safe-area-inset-top)]`;Rust 為 `.p_safe_area()`、`.pt_safe_area()`、`.pb_safe_area_plus(px(8.0))` 等)。內縮量改變時,內距會以原生方式更新([安全區域](../elements/safe-area.md))。

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

在 Android 上,嵌入於工具列下方的檢視只會取得與它重疊的那部分系統列,就像 UIKit 的安全區域:如果沒有延伸到狀態列,就沒有頂端內縮量。

<a id="the-platform"></a>

## 平台

Rust 中的 `os()`、`os_version()`、`idiom()`、`is_desktop()` 與 `is_catalyst()`,以及 TSX 中來自 `nsh` 的 `platform` 常數,描述 App 執行所在的環境。它們在 App 執行期間保持不變。

| Rust | TSX | 說明 |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux` 或 `Os::Web`(`os().name()` 是 TSX 的字串)。Mac Catalyst 屬於 iOS。 |
| `os_version()` | `platform.version` | 主版本與次版本;在 Android 上為 API 等級與 0。 |
| `idiom()` | `platform.idiom` | `Idiom::Phone`、`Pad`、`Mac`、`Tv` 或 `Desktop`;僅在 `is_desktop()` 成立時才是 `Desktop`。 |
| `is_desktop()` | `platform.desktop` | macOS、Windows 或 Linux,或桌面瀏覽器([桌面與行動裝置](./platform-specific.md#desktop-and-mobile))。 |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst,無論處於哪一種 idiom。 |

TSX 的 `platform` 完整成員如下:

| 成員 | 說明 |
|---|---|
| `platform.os` | `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"` 或 `"web"`。Mac Catalyst 回報 `"ios"`。 |
| `platform.version` | 字串:iOS 與桌面為作業系統版本(`"17.5"`);Android 為 API 等級(`"35"`);網頁為 `"0.0"`。 |
| `platform.idiom` | `"phone"`、`"pad"`、`"mac"`、`"tv"` 或 `"desktop"`。僅在 `platform.desktop` 為 `true` 時才是 `"desktop"`。`"mac"` 是 Mac Catalyst 下 UIKit 的 Mac idiom,屬於行動裝置 idiom。 |
| `platform.desktop` | 套用桌面行為:macOS、Windows、Linux 與桌面瀏覽器。`desktop={{…}}` props 與 `platform.select({ desktop })` 都會跟隨它。 |
| `platform.catalyst` | App 在 Mac Catalyst(`os` `"ios"`)下執行,無論是 Mac 或 iPad idiom。 |
| `platform.select(spec)` | 此平台對應的值;請參閱[平台專屬程式碼](./platform-specific.md#platformselect)。 |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` 以無頭(headless)模式執行時視為 iOS。

在 [Linux](./linux.md) 上,`platform.os` 為 `"linux"`,idiom 為 `"desktop"`,`platform.version` 為核心的主版本與次版本(`"6.12"`):各發行版的版本編號方式不同,無法互相比較。在該平台上,安全區域與鍵盤高度為 0,`colorScheme()` 會即時跟隨桌面的設定(XDG settings portal),`fontScale()` 為桌面的文字縮放,`pixelRatio()` 為顯示器的縮放比例,包含小數縮放。

在 [macOS](./macos.md)(AppKit 後端)上,`platform.os` 為 `"macos"`,idiom 為 `"desktop"`,`platform.version` 為 macOS 版本。安全區域與鍵盤高度為 0,`colorScheme()` 會即時跟隨系統的外觀,`fontScale()` 為 1,`pixelRatio()` 為顯示器的 backing scale。

在 [Windows](./windows.md) 上,`platform.os` 為 `"windows"`,idiom 為 `"desktop"`,`platform.version` 為 `"10.0"`,Windows 11 也一樣(Windows 沿用了版本號)。安全區域與鍵盤高度為 0,`colorScheme()` 會即時跟隨「設定 > 個人化 > 色彩」,`fontScale()` 為「文字大小」設定(1 到 2.25),`reduceMotion()` 為動畫效果設定,`pixelRatio()` 為螢幕的縮放比例,`Intl` 則依使用者的地區格式進行格式化。

在瀏覽器中([Web 執行環境](./web.md)),`platform.os` 為 `"web"`,`platform.version` 為 `"0.0"`。使用滑鼠且視窗寬度至少 600 point 時,idiom 為 `"desktop"`;在平板上為 `"pad"`,在手機上為 `"phone"`,於 App 啟動時決定。地區設定、`reduceMotion()`、`fontScale()`(瀏覽器的文字尺寸)、`pixelRatio()`、安全區域與鍵盤高度皆來自瀏覽器,並即時跟隨其變化。

<a id="pixel-density"></a>

## 像素密度

Rust 中的 `pixel_ratio()` 與 `round_to_nearest_pixel(points)`,以及 TSX 中來自 `nsh` 的 `pixelRatio()`,可在 point 與裝置像素之間進行轉換。

| Rust | TSX | 說明 |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | 每個 point 對應的裝置像素數(多數手機為 2 或 3),具響應性。 |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | 四捨五入到最接近的裝置像素的 point 值。 |

高度為一個裝置像素的細線(hairline):

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

`pixel_ratio()` 與 `pixelRatio()` 具響應性,因此當視窗移到另一個密度不同的螢幕時,細線也會隨之調整。

<a id="right-to-left"></a>

## 由右至左

當裝置語言以由右至左書寫(阿拉伯文、希伯來文、波斯文等)時,NSH 會將 App 以由右至左的方式排版:橫列從右側開始排列,邏輯樣式屬性採用其由右至左對應的側邊,文字靠右對齊,原生元件也會鏡像。版面方向會自動跟隨使用者的語言。檢視的 `direction` 樣式(`"ltr"`、`"rtl"` 或 `"inherit"`;Rust 中為 `.direction(LayoutDirection::..)`)可設定其子樹的方向;設定在根檢視上時,則設定整個 App 的方向。

變更會立即生效,不需要重新啟動 App;本頁的示範會切換 `direction` 樣式。

請使用邏輯屬性來撰寫雙向皆可運作的版面:Rust 中為 `ms` / `me` 與 `ps` / `pe`(Tailwind 的名稱),TSX 中為 `marginStart` / `marginEnd`、`paddingStart` / `paddingEnd`、`start` / `end`、`borderTopStartRadius`、`textAlign: "start"` 等,它們在由左至右的版面中代表左與右,在由右至左時則相反。`left` 與 `right`(`marginLeft`、`paddingRight`、`left`、`textAlign: "left"` 等)與 CSS 一樣,在兩種方向下都保持其所指的側邊。`direction` 樣式(`"inherit"`、`"ltr"`、`"rtl"`)可為子樹覆寫方向,例如讓電話號碼或媒體播放器的控制項保持由左至右。`rtl:` 與 `ltr:` Tailwind 變體則依方向分別套用。

水平捲動檢視與列表在由右至左的版面中,會從右端開始。在 Android 上,宿主 App 必須在其 manifest 中宣告 `android:supportsRtl="true"`,原生元件才會鏡像。

<a id="related"></a>

## 相關內容

- [`nsh` 的裝置 API](../modules/nsh.md#device):參考文件。
- [平台專屬程式碼](./platform-specific.md):`platform.select`、平台 props 與模組。
- [無障礙](./accessibility.md):螢幕閱讀器與減少動態效果。
- [安全區域](../elements/safe-area.md)、[鍵盤](../elements/keyboard.md)與[狀態列](../modules/nsh-base.md#status-bar)。
- [Tailwind](./tailwind.md):`dark:`、斷點與方向變體。
