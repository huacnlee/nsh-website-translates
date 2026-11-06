---
title: "平台專用程式碼"
description: "為手機、桌面及瀏覽器撰寫同一個應用程式 - 在 ios={{}} / android={{}} / desktop={{}} / web={{}} 中設定僅限特定平台的 props、nsh/mobile 與 nsh/desktop 模組、platform.os 與 platform.select，以及平台專用的 Tailwind variants。"
order: 17
group: platforms
source_hash: 3943d421295a93f3
---


# 平台專用程式碼

一個 NSH bundle 可在 iOS、Android、macOS、Windows 和 Linux（以及 Mac Catalyst）上運行，並可透過[網頁運行環境](./web.md)在瀏覽器中運行。大部分 app 完全不需要平台檢查：元素、樣式、佈局和模組在所有平台上行為一致，由它們組成的元件在各處外觀也相同。當某些事物確實只屬於某個平台時，NSH 為它提供明確的位置，令平台程式碼保持可見而且自成一體：

| Rust | TSX | 用途 |
|---|---|---|
| [建構器方法（`.ripple(..)`、`.input_accessory(..)`）](#platform-only-props) | [`ios={{…}}`、`android={{…}}`、`desktop={{…}}`、`web={{…}}`](#platform-only-props) | 只有單一平台才有的 props。 |
| [`on_back_press`、`nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`、`nsh/desktop`](#platform-modules) | 只有流動平台或只有桌面平台才有的 API。 |
| [`os()`、`idiom()`、`is_desktop()`](#platformos-and-platformselect) | [`platform.os`、`platform.desktop`、`platform.select`](#platformos-and-platformselect) | 按平台選擇值或程式碼。 |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [`ios:` / `android:` / `web:` class](#platform-variants-in-tailwind) | 按平台設定樣式。 |

<a id="desktop-and-mobile"></a>

## 桌面與流動裝置

每個平台都屬於桌面或流動，規則只有一條。桌面包括 macOS、Windows、Linux，以及以桌面形式（滑鼠與寬視窗，[網頁](./web.md)）運行的瀏覽器。流動包括 iOS、Android，以及以手機或平板形式運行的瀏覽器；Mac Catalyst 運行 iOS 後端，所以也屬於流動，並使用 `ios={{…}}` props。`desktop={{…}}` props、`platform.select({ desktop, mobile })`、`platform.desktop` 和 `platform.idiom === "desktop"` 全都依循這條規則，`nsh/base` 的元件亦然（選單在桌面上是彈出式選單，在流動裝置上是 sheet），在 Rust 中還有 `is_desktop()`。

`nsh/desktop` 的 `isAvailable` 回答的是一個較窄的問題：該模組的視窗與選單 API 是否可用，在 macOS、Windows 和 Linux 上可用。佈局、密度和輸入請以 `platform.desktop` 作判斷，`Window` 和 `Menu` 的呼叫則以 `isAvailable` 作判斷。

<a id="platform-only-props"></a>

## 平台專屬 props

在 Rust 中，只有某個平台才有的 prop 就是一個普通的 builder 方法（`.ripple(..)`；Android 的 `.elevation(..)`；iOS 的 `.input_accessory(..)`；桌面平台的 `.window_drag(..)`）；其他平台會略過它。在 TSX 中，只存在於單一平台的 props 會歸入以該平台命名的物件。每個元素都接受 `ios`、`android`、`desktop`（macOS、Windows、Linux，以及桌面形式的瀏覽器）和 `web`（瀏覽器）；在其他平台上該物件會被忽略，在所屬平台上只會套用其中的鍵。桌面瀏覽器會同時套用 `desktop` 和 `web`。

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

TSX 物件如同其他 prop 一樣具反應性；從物件中移除的鍵會被清除。

目前已有的項目：

| Rust | TSX | 於 | 說明 |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | 每個元素 | 按下時的 Material 水波紋：顏色、無邊界、半徑、前景。 |
| `.elevation(..)` | `android={{ elevation }}` | 每個元素 | Material 陰影，單位為 point，依據 view 的形狀。 |
| | `android={{ accessibilityLiveRegion }}` | 每個元素 | `"none"`、`"polite"` 或 `"assertive"`：TalkBack 會播報該 view 的變化。 |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | 對話框的內容延伸至狀態列下方。 |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | 顯示於鍵盤上方的 `InputAccessoryView`。 |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | iOS 對自動填寫類型的命名（Rust 的 `AutoFill` 同時涵蓋兩個平台）。 |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | 所允許的方向。 |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | 在頁面記錄中滑動返回及前進。 |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | UIKit 自家的列按鈕，位於標題列末端，按下時觸發 `headerRight`。 |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | UIKit 自家的列按鈕，位於標題列起端，按下時觸發 `headerLeft`。 |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | UIKit 自家的列按鈕，位於標題列末端並顯示 SF Symbol，按下時觸發 `headerRight`。 |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | UIKit 自家的列按鈕，位於標題列起端並顯示 SF Symbol，按下時觸發 `headerLeft`。 |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS：雙指觸控板滑動可在頁面記錄中返回及前進；Windows：觸控螢幕滑動；Linux：觸控板滑動。 |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | 每個元素 | 按下時會拖動視窗，如同系統標題列一般（見 [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)）。 |

在 TSX 中，`desktop={{…}}` 和 `web={{…}}` 在所有平台上都可使用。型別（`IOSProps`、`AndroidProps`、`DesktopProps` 及其各元素形式）會讓編輯器知道每個元素接受甚麼。

在所有平台上都有意義的元素行為屬於頂層 prop（在 Rust 中是同名方法），並在有意義之處套用：`NavPage` 的 `title`、`headerStyle`、`headerLargeTitle` 和 `headerBackTitle` 負責設定 iOS 和 Android 的系統標題列，它的 `header` slot 則是桌面平台和網頁的標題列，而 `Dialog` 的 `presentation` 用來選擇 iOS 的 sheet。`AlertDialog.show` 的 `closeOnBackdropPress`、`pagingEnabled`、`refreshing`、`hitSlop` 等在所有平台上都適用。某平台自有的系統功能放在它的物件內；若多個平台都有，則在各自的物件中以相同名稱出現：`WebView` 的 `allowsBackForwardNavigationGestures`（系統在頁面記錄中的滑動）見於 `ios={{…}}` 和 `desktop={{…}}`。

<a id="platform-modules"></a>

## 平台模組

在 Rust 中，只有單一平台才有的 API 是 `nsh_core::prelude`（`on_back_press`、`input_accessory_view`）和 `nsh_core::element::desktop` 的函式（視窗：`set_title`、`set_title_bar`、`title_bar`、`minimize`、`toggle_maximize`、`toggle_full_screen`、`set_frame`、`set_level`、`order_front`、`close_window`；選單：`set_application_menu`、`popup_menu`）；在其他平台上它們不會執行任何操作。在 TSX 中，`nsh/mobile` 包含 iOS 和 Android 的 API（部分只屬其中一個平台），`nsh/desktop` 則包含桌面平台的 API。兩者在所有平台上都可匯入，因此同一個 bundle 可到處運行：在其他平台上，它們的函式會立即返回，元件則不佔空間。各自匯出 `isAvailable`，在其所屬平台上為 `true`；`platform.os` 可區分兩者。

### nsh/mobile

`isAvailable` 在 iOS（包括 Mac Catalyst）和 Android 上為 `true`。兩個平台都有 [`TabBar`](../modules/nsh-mobile.md#tabbar)，即系統的分頁列。

#### BackHandler (Android)

| Rust | TSX | 說明 |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | 在對話框之後、堆疊之前監聽返回按鈕；處理完畢時返回 `true`。監聽器會隨加入它的元件（或 effect）一同移除；在 TSX 中，該呼叫亦會返回一個函式，可提早停止監聽。 |
| | `BackHandler.exitApp()` | 離開 app。 |

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

返回按鈕會先由最上層的對話框處理，然後是返回監聽器（最近加入的優先），再到最上層的導覽堆疊，若無人處理，app 便會退出。參閱[導覽](./navigation.md#the-android-back-button)。

#### InputAccessoryView (iOS)

| Rust | TSX | 說明 |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | 在鍵盤上方顯示的列，供指定其原生 id 的輸入框使用（`.input_accessory(..)`、`ios={{ inputAccessoryViewID }}`）。 |

參閱[表單與鍵盤](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview)。

### nsh/desktop

Rust app 以 `nsh_core::element::desktop` 繪製自己的標題列（[以 Rust 建構](./rust.md#desktop-title-bars)）。TSX 的模組：

| 匯出 | 說明 |
|---|---|
| `Window` | 視窗：`setTitle`、用於 app 自訂標題列的 `setTitleBar({ style: "hidden" })`、`minimize`、`toggleMaximize`、`toggleFullScreen`、`close`。 |
| `titleBar` | 隱藏標題列的高度，以及系統視窗控制項所佔的空間（具反應性）。 |
| `Menu` | `setApplicationMenu(items)`（附快速鍵的選單列）和 `popup(items, at?)`（右鍵選單）。 |
| `isAvailable` | `true` 於視窗和選單 API 可用的平台：macOS、Windows 和 Linux。桌面瀏覽器為 `platform.desktop`，並保留瀏覽器自身的視窗和選單。 |

參閱 [nsh/desktop](../modules/nsh-desktop.md)。

<a id="the-status-bar"></a>

### 狀態列

在兩個平台上，狀態列都屬於最上層的頁面或對話框，與 UIKit 一樣，由最上層的 view controller 決定：[`NavPage` 和 `Dialog` 接受 `statusBar`](../modules/nsh-base.md#status-bar)（在 Rust 中是 `.status_bar(StatusBarStyle::Light)`，其他欄位則用 `StatusBarSetting`），包含 `foreground`（`"auto"`，深色背景用 `"light"`，淺色背景用 `"dark"`）、`hidden` 和 `animated`。最近顯示的頁面或對話框逐個欄位優先，當它消失後，其下方的一個會重新生效。`nsh.json` 的 `"statusBar"` 是它們之下 app 的預設值。

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

在嵌入原生 app 的 app 中，iOS 上由宿主 app 的 view controller 決定狀態列。在 `nsh.json` 中宣告 `"capabilities"` 的 app，需要 `"statusBar": true` 才能更改。

## platform.os and platform.select

Rust 中的 `os()` 和 TSX 中來自 `nsh` 的 `platform` 常數會告訴你 app 在哪裏運行：`Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux` 或 `Os::Web`，而 `platform.os` 為 `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"` 或 `"web"`（Mac Catalyst 為 `"ios"`，在其任一形式下都帶有 `platform.catalyst`；[macOS 後端](./macos.md)是 `"macos"`，[Linux 後端](./linux.md)是 `"linux"`，[Windows 後端](./windows.md)是 `"windows"`，它們的元素會套用 `desktop` props；[瀏覽器](./web.md)是 `"web"`，當 `platform.desktop` 為 `true` 時亦會套用 `desktop` props）。版本、形式及其他資訊請參閱[裝置與環境](./device-and-environment.md#the-platform)。

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

在 Rust 中，由 `match os()` 選擇值，桌面平台用 `is_desktop()`。在 TSX 中，`platform.select(spec)` 返回適用於此平台的值。它會先找該 OS 自己的鍵，然後按[上述規則](#desktop-and-mobile)找 `desktop` 或 `mobile`（`platform.desktop`），再找 `native`（除網頁外的所有平台），最後找 `default`：

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

當沒有任何匹配且沒有 `default` 時，它返回 `undefined`。

<a id="rendering-different-components"></a>

### 渲染不同的元件

以相同方式選擇元件；若選擇永不改變，則在模組層級（TSX）進行：

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

或以 [`when` / `<If>`](../elements/control-flow.md) 內聯：

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

## Tailwind 的平台變體

Rust 以 `.when(os() == Os::Ios, |v| ..)` 按平台設定樣式；在 TSX 中，`ios:`、`android:` 和 `web:` 變體會在單一平台上套用 class：

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

## 優先使用共通行為

在使用平台檢查之前，先考慮這個差異對使用者是否重要。元素和樣式在應有差異之處（捲動物理效果、文字渲染、鍵盤、無障礙功能）已對應各平台的原生行為，而在使用者期望一致之處（你 app 自身的外觀）則保持相同。平台檢查最好只留給使用者所依賴的平台慣例：Android 的返回按鈕和 toast、iOS 的 sheet 和大標題、自動填寫名稱、Android 的水波紋。

<a id="related"></a>

## 相關內容

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) 和 [`BackHandler`](../modules/nsh-mobile.md#backhandler)：參考文件。
- [`nsh` 的裝置 API](../modules/nsh.md#device)：`platform`。
- [原生元件](./native-components.md)：使用宿主 app 在各平台提供的 view。
- [Tailwind](./tailwind.md)：所有變體。
