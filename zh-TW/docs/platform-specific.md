---
title: "平台專屬程式碼"
description: "為手機、桌面與瀏覽器撰寫同一個應用程式 - 在 ios={{}} / android={{}} / desktop={{}} / web={{}} 中設定平台專屬的 props、nsh/mobile 與 nsh/desktop 模組、platform.os 與 platform.select,以及平台專屬的 Tailwind 變體。"
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# 平台專屬程式碼

一個 NSH bundle 即可在 iOS、Android、macOS、Windows 和 Linux（以及 Mac Catalyst）上執行，也能透過 [Web runtime](./web.md) 在瀏覽器中執行。應用程式的大部分內容完全不需要平台檢查：元素、樣式、版面配置和模組在各處的行為都相同，由它們組成的元件在各處看起來也相同。當某些內容確實只屬於某個平台時，NSH 為它提供明確的位置，讓平台程式碼保持可見且彼此隔離：

| Rust | TSX | 用途 |
|---|---|---|
| [Builder 方法（`.ripple(..)`、`.input_accessory(..)`）](#platform-only-props) | [`ios={{…}}`、`android={{…}}`、`desktop={{…}}`、`web={{…}}`](#platform-only-props) | 僅單一平台才有的 props。 |
| [`on_back_press`、`nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`、`nsh/desktop`](#platform-modules) | 僅行動平台或僅桌面平台才有的 API。 |
| [`os()`、`idiom()`、`is_desktop()`](#platformos-and-platformselect) | [`platform.os`、`platform.desktop`、`platform.select`](#platformos-and-platformselect) | 依平台選擇值或程式碼。 |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [`ios:` / `android:` / `web:` class](#platform-variants-in-tailwind) | 依平台設定樣式。 |

<a id="desktop-and-mobile"></a>

## 桌面與行動

每個平台依同一條規則歸類為桌面或行動。桌面包含 macOS、Windows、Linux，以及採用桌面慣用模式（使用滑鼠與寬視窗，見 [Web](./web.md)）的瀏覽器。行動包含 iOS、Android，以及採用手機或平板慣用模式的瀏覽器；Mac Catalyst 執行的是 iOS 後端，因此同樣屬於行動，並使用 `ios={{…}}` props。`desktop={{…}}` props、`platform.select({ desktop, mobile })`、`platform.desktop` 和 `platform.idiom === "desktop"` 都遵循這條規則，`nsh/base` 的元件也是如此（選單在桌面上是彈出視窗，在行動裝置上是 sheet），在 Rust 中則是 `is_desktop()`。

`nsh/desktop` 的 `isAvailable` 回答的是範圍較窄的問題：該模組的視窗與選單 API 是否可用，在 macOS、Windows 和 Linux 上皆可用。版面配置、密度與輸入方式請以 `platform.desktop` 作為判斷依據，而 `Window` 與 `Menu` 的呼叫則以 `isAvailable` 判斷。

<a id="platform-only-props"></a>

## 平台專屬 props

在 Rust 中，只有某個平台才有的 prop 與其他 prop 一樣是 builder 方法（`.ripple(..)`、Android 的 `.elevation(..)`、iOS 的 `.input_accessory(..)`、桌面平台的 `.window_drag(..)`）；其他平台則會忽略它。在 TSX 中，只存在於單一平台的 props 會集中在以該平台命名的物件中。每個元素都接受 `ios`、`android`、`desktop`（macOS、Windows、Linux，以及桌面慣用模式的瀏覽器）和 `web`（瀏覽器）；在其他平台上該物件會被忽略，而在其所屬平台上只會套用其中的鍵。桌面瀏覽器會同時套用 `desktop` 與 `web`。

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

TSX 的這些物件與一般 prop 一樣具有響應性；從物件中移除的鍵會被清除。

目前已提供的項目：

| Rust | TSX | 作用於 | 說明 |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | 每個元素 | 按下時的 Material 漣漪效果：顏色、無邊界、半徑、前景。 |
| `.elevation(..)` | `android={{ elevation }}` | 每個元素 | Material 陰影，單位為 point，依視圖的形狀產生。 |
| | `android={{ accessibilityLiveRegion }}` | 每個元素 | `"none"`、`"polite"` 或 `"assertive"`：TalkBack 會播報該視圖的變化。 |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | 對話框的內容會延伸到狀態列下方。 |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | 顯示在鍵盤上方的 `InputAccessoryView`。 |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | iOS 的自動填入類型名稱（Rust 的 `AutoFill` 涵蓋兩個平台）。 |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | 允許的螢幕方向。 |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | 以滑動手勢在頁面歷史中後退與前進。 |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | UIKit 原生的標頭尾端列按鈕，按下時觸發 `headerRight`。 |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | UIKit 原生的標頭開頭列按鈕，按下時觸發 `headerLeft`。 |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | UIKit 原生的標頭尾端列按鈕，顯示 SF Symbol，按下時觸發 `headerRight`。 |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | UIKit 原生的標頭開頭列按鈕，顯示 SF Symbol，按下時觸發 `headerLeft`。 |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS：觸控板雙指滑動可在頁面歷史中後退與前進；Windows：觸控螢幕滑動；Linux：觸控板滑動。 |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | 每個元素 | 按住它即可拖曳視窗，如同系統標題列的行為（請見 [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)）。 |

在 TSX 中，`desktop={{…}}` 和 `web={{…}}` 在所有平台上都會被接受。這些型別（`IOSProps`、`AndroidProps`、`DesktopProps` 及其各元素專屬的形式）會讓編輯器知道每個元素接受哪些 props。

在所有平台上都有意義的元素行為是頂層 prop（在 Rust 中則是同名的方法），並會在有意義的平台上套用：`NavPage` 的 `title`、`headerStyle`、`headerLargeTitle` 和 `headerBackTitle` 負責設定 iOS 與 Android 的系統標頭，其 `header` slot 是桌面平台與 Web 的標頭，而 `Dialog` 的 `presentation` 用於選擇 iOS 的 sheet。`AlertDialog.show` 的 `closeOnBackdropPress`、`pagingEnabled`、`refreshing`、`hitSlop` 等在所有平台上都可運作。某個平台自有的系統功能放在該平台的物件中；當多個平台都有此功能時，則放在各自的物件中並使用相同的名稱：`WebView` 的 `allowsBackForwardNavigationGestures`（系統在頁面歷史中的滑動手勢）同時存在於 `ios={{…}}` 和 `desktop={{…}}`。

<a id="platform-modules"></a>

## 平台模組

在 Rust 中，只有單一平台才有的 API 是 `nsh_core::prelude`（`on_back_press`、`input_accessory_view`）和 `nsh_core::element::desktop` 的函式（視窗：`set_title`、`set_title_bar`、`title_bar`、`minimize`、`toggle_maximize`、`toggle_full_screen`、`set_frame`、`set_level`、`order_front`、`close_window`；選單：`set_application_menu`、`popup_menu`）；在其他平台上它們不會執行任何動作。在 TSX 中，`nsh/mobile` 包含 iOS 與 Android 的 API（其中部分僅屬於其中一個平台），`nsh/desktop` 則包含桌面平台的 API。兩者都可以在所有平台上匯入，因此同一個 bundle 能在各處執行：在其他平台上，它們的函式會立即返回，其元件也不佔用任何空間。兩者各自匯出 `isAvailable`，在其所屬平台上為 `true`；可用 `platform.os` 區分它們。

### nsh/mobile

`isAvailable` 在 iOS（含 Mac Catalyst）和 Android 上為 `true`。兩個平台都有 [`TabBar`](../modules/nsh-mobile.md#tabbar)，即系統的分頁列。

#### BackHandler (Android)

| Rust | TSX | 說明 |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | 監聽返回鍵，順序在對話框之後、堆疊之前；處理完畢時回傳 `true`。監聽器會隨新增它的元件（或 effect）一同移除；在 TSX 中，該呼叫也會回傳一個函式，可提前停止監聽。 |
| | `BackHandler.exitApp()` | 離開應用程式。 |

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

返回鍵會先由最上層的對話框處理，接著是返回監聽器（最近新增的優先），再來是最上層的導覽堆疊；若都無人處理，應用程式便會結束。請參閱 [Navigation](./navigation.md#the-android-back-button)。

#### InputAccessoryView (iOS)

| Rust | TSX | 說明 |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | 為指定其原生 id 的輸入元件（`.input_accessory(..)`、`ios={{ inputAccessoryViewID }}`）在鍵盤上方顯示的一條列。 |

請參閱 [Forms and the keyboard](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview)。

### nsh/desktop

Rust 應用程式使用 `nsh_core::element::desktop` 繪製自己的標題列（[Building with Rust](./rust.md#desktop-title-bars)）。TSX 的模組如下：

| 匯出 | 說明 |
|---|---|
| `Window` | 視窗：`setTitle`、用於應用程式自訂標題列的 `setTitleBar({ style: "hidden" })`、`minimize`、`toggleMaximize`、`toggleFullScreen`、`close`。 |
| `titleBar` | 隱藏標題列的高度，以及系統視窗控制項佔用的空間（具響應性）。 |
| `Menu` | `setApplicationMenu(items)`（含快速鍵的選單列）與 `popup(items, at?)`（右鍵選單）。 |
| `isAvailable` | 在視窗與選單 API 可運作的平台上為 `true`：macOS、Windows 和 Linux。桌面瀏覽器為 `platform.desktop`，並保留瀏覽器本身的視窗與選單。 |

請參閱 [nsh/desktop](../modules/nsh-desktop.md)。

<a id="the-status-bar"></a>

### 狀態列

在兩個平台上，狀態列都歸屬於最上層的頁面或對話框，與 UIKit 相同，由最上層的 view controller 決定：[`NavPage` 與 `Dialog` 接受 `statusBar`](../modules/nsh-base.md#status-bar)（在 Rust 中為 `.status_bar(StatusBarStyle::Light)`，其他欄位則使用 `StatusBarSetting`），包含 `foreground`（`"auto"`、用於深色背景的 `"light"`、用於淺色背景的 `"dark"`）、`hidden` 和 `animated`。最近顯示的頁面或對話框優先，並逐欄位判定；當它消失後，其下層的設定會重新生效。`nsh.json` 的 `"statusBar"` 是位於它們之下的應用程式預設值。

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

在嵌入原生應用程式的 app 中，iOS 上的狀態列由宿主應用程式的 view controller 決定。若應用程式在 `nsh.json` 中宣告了 `"capabilities"`，則需要 `"statusBar": true` 才能變更它。

## platform.os and platform.select

Rust 中的 `os()` 與 TSX 中從 `nsh` 匯入的 `platform` 常數會告訴你應用程式在哪裡執行：`Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux` 或 `Os::Web`，以及 `platform.os` `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"` 或 `"web"`（Mac Catalyst 為 `"ios"`，在其任一種慣用模式下都搭配 `platform.catalyst`；[macOS 後端](./macos.md)為 `"macos"`，[Linux 後端](./linux.md)為 `"linux"`，[Windows 後端](./windows.md)為 `"windows"`，其元素會套用 `desktop` props；[瀏覽器](./web.md)為 `"web"`，且當 `platform.desktop` 為 `true` 時，也會套用 `desktop` props）。版本、慣用模式等資訊請參閱 [Device and environment](./device-and-environment.md#the-platform)。

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

在 Rust 中由 `match os()` 選擇值，桌面平台使用 `is_desktop()`。在 TSX 中，`platform.select(spec)` 會回傳適用於目前平台的值。它會先尋找作業系統自己的鍵，接著依[上述規則](#desktop-and-mobile)尋找 `desktop` 或 `mobile`（`platform.desktop`），然後是 `native`（除 Web 之外的所有平台），最後是 `default`：

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

當沒有任何項目相符且沒有 `default` 時，它會回傳 `undefined`。

<a id="rendering-different-components"></a>

### 渲染不同的元件

選擇元件的方式相同；當選擇結果永遠不變時，可在模組層級（TSX）處理：

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

或使用 [`when` / `<If>`](../elements/control-flow.md) 以行內方式處理：

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

## Tailwind 中的平台變體

Rust 使用 `.when(os() == Os::Ios, |v| ..)` 依平台設定樣式；在 TSX 中，`ios:`、`android:` 和 `web:` 變體可在單一平台上套用 class：

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

## 優先採用共用行為

在使用平台檢查之前，先考慮這項差異對使用者是否重要。在行為理應不同的地方（捲動物理效果、文字渲染、鍵盤、無障礙功能），元素與樣式已經對應到各平台的原生行為；而在使用者期待一致的地方（你的應用程式自身的外觀），則維持相同。平台檢查最適合用於使用者所依賴的平台慣例：Android 的返回鍵與 toast、iOS 的 sheet 與大標題、自動填入名稱、Android 的漣漪效果。

<a id="related"></a>

## 相關內容

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) 與 [`BackHandler`](../modules/nsh-mobile.md#backhandler)：參考文件。
- [`nsh` 的裝置 API](../modules/nsh.md#device)：`platform`。
- [Native components](./native-components.md)：使用宿主應用程式在各平台上提供的視圖。
- [Tailwind](./tailwind.md)：所有變體。
