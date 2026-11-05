---
title: "nsh/mobile"
description: "iOS 與 Android 提供的功能：TabBar（系統的標籤列）、iOS 上的 InputAccessoryView、Android 上的 BackHandler，以及 isAvailable。"
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` 收錄 iOS 與 Android 專屬的功能：兩個平台上的系統分頁列 `TabBar`；iOS 上位於鍵盤上方的列 [`InputAccessoryView`](#inputaccessoryview)；以及 Android 上的返回按鈕 [`BackHandler`](#backhandler)。Rust 程式碼使用 `nsh_core::mobile` 與 `nsh_core::prelude`；TSX 則匯入 `nsh/mobile`。此模組可在所有平台上匯入，因此同一份 bundle 可在各處執行：在其他平台上，其元件不佔用空間，呼叫會立即返回，而 `isAvailable` 會告訴你目前是否在 iOS 或 Android 上（可用 `nsh` 的 `platform.os` 判斷是哪一個）。桌面平台提供的功能請參閱 [nsh/desktop](./nsh-desktop.md)。

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## 範圍

此模組提供行動平台專屬的功能，例如用於應用程式頂層導覽的系統分頁列。通用控制項屬於 [`nsh/base`](./nsh-base.md)：例如其 [Switch](../elements/switch.md) 在手機、桌面與網頁上共用相同的行為與 API，軌道、滑塊與狀態樣式則由應用程式提供。`TabBar` 負責行動應用程式的導覽；`Tabs` 負責跨平台的分頁內容。只有具備行動平台專屬互動語意的功能才歸入此處。單純的系統外觀、尺寸或動畫，並不會改變通用控制項的共同角色。這項區分是判斷哪些功能屬於此處的依據（[目標與設計原則](../docs/goals.md)）。

## isAvailable

```ts
const isAvailable: boolean;
```

在 iOS、iOS 模擬器、Mac Catalyst 與 Android 上為 `true`；其他平台為 `false`。Rust：`matches!(os(), Os::Ios | Os::Android)`。

## TabBar

分頁列用於在應用程式的頂層區段之間切換：例如紀錄與統計、收件匣與設定。`TabBar` 是系統原生的分頁列，因此外觀與行為和系統應用程式一致：在 iOS 與 iPadOS 上為 `UITabBar`（iOS 26 上有 Liquid Glass 及其選取效果），在 Android 上為 Material 3 的導覽列，並採用系統的顏色，支援淺色與深色模式。應用程式提供分頁（`items`）、指定選取的分頁（`selectedIndex`）、接收使用者的選擇（`onChange`）、以 `class` 與 `style` 放置分頁列，並自行顯示所選區段的內容。若要在頁面內使用分頁，且需跨所有平台，請使用 `nsh/base` 的 [Tabs](../elements/tabs.md)。

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` 來自 `nsh/mobile`，在 Rust 中為 `nsh_core::mobile`。選取狀態由應用程式掌控：點按時會回報 `onChange` 及該分頁的索引（`{ index }`），分頁列會像系統原生的一樣立即顯示所做的選擇，應用程式再顯示對應的區段，並將索引以 `selectedIndex` 傳回。在樣式未指定高度時，其高度採用系統預設值。在 Rust 中，`tab_bar()` 會建立分頁列，每個屬性有對應的設定方法（`.items(..)`、`.selected_index(..)`），每個事件有對應的監聽器（`.on_change(..)`），並提供具型別的樣式方法；`TabBarItem::new(title).icon(name)` 則用於建立分頁。

<a id="props"></a>

### 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | 依序排列的分頁。 |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | 以索引指定選取的分頁；超出分頁數量的索引表示不選取任何分頁。 |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS：不使用轉場動畫直接隱藏分頁列。此值在 push 與 pop 之間由應用程式負責維護。當此屬性與可見堆疊的 `hidesBottomBarWhenPushed` 請求皆為 false 時，分頁列才會顯示。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 分頁列的位置與尺寸。其外觀由系統決定，所選分頁使用主題的 `primary`。 |
| `testID` | `.test_id(..)` | `string` | 無 | 用於在測試與 `nsh test --trace` 中找到分頁列。 |

#### TabBarItem

| 欄位 | Rust | 型別 | 說明 |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | 分頁的標題，螢幕閱讀器會朗讀此內容。 |
| `icon` | `.icon(name)` | `string` | 分頁的圖示，以各平台的名稱指定：iOS 上為 [SF Symbol](https://developer.apple.com/sf-symbols/)（`"house"`），Android 上為應用程式的 drawable（`res/drawable/home.xml` 為 `"home"`，`"android:ic_menu_search"` 則為系統的）。`platform.select` 可為每個平台分別指定。 |

<a id="events"></a>

### 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | 使用者選擇了分頁：`{ index }` 為其索引。分頁列會立即顯示該選擇；應用程式需顯示該分頁的內容並設定 `selectedIndex`。 |

<a id="platform-notes"></a>

### 平台說明

- **iOS 與 Mac Catalyst**：`UITabBar`，採用對應 iOS 版本的系統外觀：iOS 26 上為浮動的 Liquid Glass 分頁列及其選取效果。圖示為 SF Symbols。主題的 `primary` 即分頁列的 `tintColor`，也就是所選分頁的顏色；其他分頁維持系統的顏色。
- **Android**：Material 3 的導覽列，由平台的 view 組成：每個標籤上方是位於啟用指示器中的圖示，按下時有漣漪效果，Android 12 及更新版本使用系統的動態色彩，更早版本使用 Material 的基準色彩，並依應用程式的外觀呈現淺色或深色。位於視窗底部時，它會延伸到導覽列下方，高度增加其 inset，與 Material 的行為相同。圖示為應用程式的 drawable（由分頁列著色）。所選分頁的圖示與標籤採用主題的 `primary`，其啟用指示器則為該顏色的 12% 不透明度；其他分頁維持系統的顏色。
- **桌面平台（macOS、Windows、Linux、GPUI）與網頁**：各區段以 [Tabs](../elements/tabs.md) 顯示，採用應用程式自己的外觀。`TabBar` 在這些平台上不佔用空間，因此同一份版面配置即可涵蓋兩種情況，並由 `platform.os` 選擇（[`nsh` 的裝置 API](./nsh.md#device)）。

## InputAccessoryView

適用於 iOS 與 Mac Catalyst；在 Android 上是一個空的隱藏 view。

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

位於鍵盤上方的列（UIKit 的 `inputAccessoryView`），當 `ios={{ inputAccessoryViewID }}` 與其 `nativeID` 相符的輸入元件取得焦點時顯示。Rust：`input_accessory_view(native_id)`，會為 `.input_accessory(native_id)` 相符的輸入元件顯示。其寬度與視窗相同，高度與其內容相同，並由原生機制隨鍵盤移動。

| 屬性 | 型別 | Rust | 說明 |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | 具有此 `inputAccessoryViewID` 的輸入元件會顯示該列。 |
| `style` | `StyleProp<ViewStyle>` | `Styled` 方法（`.bg(…)`） | 該列的樣式（例如背景）。 |
| `class` | `string` | | Tailwind 類別。 |
| `children` | `JSX.Element` | `.child(…)` | 該列的內容。 |

它在樹中所放置的位置不會渲染任何內容，在 Android 上則完全不渲染，因此可以將它放在所屬輸入元件旁邊。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

另請參閱 [表單與鍵盤](../docs/forms-and-keyboard.md)。

## BackHandler

適用於 Android；在 iOS 上，其監聽器會被保留但永遠不會被呼叫，而 `exitApp()` 會立即返回。

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

系統的返回按鈕與返回手勢。對話框會先處理返回操作（對話框會關閉）；接著執行 `BackHandler` 的監聽器，最近新增的優先；若沒有任何監聽器處理，最上層的導覽堆疊會 pop，若已無頁面可返回，應用程式便會結束。

| 成員 | Rust | 說明 |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` 在已處理該操作時返回 `true`。會返回一個停止監聽的函式；在元件渲染（或 effect 執行）期間新增的監聽器，會隨之停止，Rust 與 TSX 皆然。 |
| `exitApp()` | 監聽器返回 `false` | 離開應用程式。返回 `false` 的 Rust 監聽器會讓該操作繼續傳遞，因此堆疊會返回或應用程式會結束。 |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> 監聽器會在系統送出返回操作之後執行：主執行緒絕不會等待應用程式的程式碼。只要至少註冊了一個監聽器，NSH 就會接手對話框未處理的返回操作，並在沒有任何監聽器返回 `true` 時，自行在最上層堆疊中返回或結束應用程式。

狀態列由 `nsh/base` 中[頁面與對話框](./nsh-base.md#status-bar)的 `statusBar` 設定，iOS 與 Android 皆然。
