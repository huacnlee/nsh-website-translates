---
title: "nsh/mobile"
description: "iOS 與 Android 所提供的功能：TabBar（系統的分頁列）、iOS 上的 InputAccessoryView、Android 上的 BackHandler，以及 isAvailable。"
order: 12.2
source_hash: 53d6d77de0d6e9ca
---


# nsh/mobile

`nsh/mobile` 包含 iOS 和 Android 專屬的功能：兩個平台上的系統分頁列 `TabBar`；iOS 上位於鍵盤上方的列 [`InputAccessoryView`](#inputaccessoryview)；以及 Android 上的返回按鈕 [`BackHandler`](#backhandler)。Rust 程式碼使用 `nsh_core::mobile` 和 `nsh_core::prelude`；TSX 則匯入 `nsh/mobile`。此模組可在所有平台匯入，因此同一個 bundle 可以到處運行：在其他平台上，其元件不佔空間，其呼叫會立即返回，而 `isAvailable` 會告訴你目前是否身處 iOS 或 Android（`nsh` 的 `platform.os` 可分辨是哪一個）。桌面平台所提供的功能見 [nsh/desktop](./nsh-desktop.md)。

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## 範圍

此模組提供行動平台專屬的功能，例如用於應用程式頂層導覽的系統分頁列。通用控制項屬於 [`nsh/base`](./nsh-base.md)：以其 [Switch](../elements/switch.md) 為例，它在手機、桌面和網頁上共用相同的行為和 API，軌道、滑塊和狀態樣式由應用程式提供。`TabBar` 服務行動應用程式的導覽；`Tabs` 則服務跨平台的分頁內容。只有具備行動平台專屬互動語意的功能才屬於此處。單憑系統外觀、尺寸或動畫，並不會改變通用控制項的共通角色。這項區分決定了哪些功能屬於此處（[目標與設計原則](../docs/goals.md)）。

## isAvailable

```ts
const isAvailable: boolean;
```

在 iOS、iOS 模擬器、Mac Catalyst 和 Android 上為 `true`；其他地方為 `false`。Rust：`matches!(os(), Os::Ios | Os::Android)`。

## TabBar

分頁列用於在應用程式的頂層區段之間切換：記錄與統計、收件匣和設定。`TabBar` 是系統本身的分頁列，因此外觀和行為與系統應用程式一致：在 iOS 和 iPadOS 上是 `UITabBar`（iOS 26 上為 Liquid Glass 及其選取效果），在 Android 上是 Material 3 的導覽列，使用系統的顏色，支援淺色和深色模式。應用程式提供分頁（`items`），指明哪一個被選取（`selectedIndex`），接收使用者的選擇（`onChange`），以 `class` 和 `style` 安排分頁列的位置，並自行顯示所選區段的內容。若要在頁面內使用分頁，並且需要支援所有平台，請使用 `nsh/base` 的 [Tabs](../elements/tabs.md)。

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

`TabBar` 來自 `nsh/mobile`，在 Rust 中為 `nsh_core::mobile`。選取狀態由應用程式掌控：點按時會回報 `onChange` 和分頁的索引（`{ index }`），分頁列會像系統的分頁列一樣立即顯示該選擇，而應用程式則顯示對應的區段，並把索引以 `selectedIndex` 傳回。在樣式沒有指定的情況下，其高度由系統決定。在 Rust 中，`tab_bar()` 會建立分頁列，每個屬性有一個 setter（`.items(..)`、`.selected_index(..)`），每個事件有一個監聽器（`.on_change(..)`），並提供具型別的樣式方法；`TabBarItem::new(title).icon(name)` 則建立分頁。

<a id="props"></a>

### 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | 分頁，按順序排列。 |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | 以索引指定被選取的分頁；超出分頁數量的索引表示不選取任何分頁。 |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS：不帶轉場效果地隱藏分頁列。在 push 和 pop 之間，此值由應用程式掌管。只有當此屬性和可見堆疊的 `hidesBottomBarWhenPushed` 請求同時為 false 時，分頁列才會顯示。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 分頁列的位置：其定位和尺寸。其外觀由系統決定，被選取的分頁使用主題的 `primary`。 |
| `testID` | `.test_id(..)` | `string` | 無 | 在測試和 `nsh test --trace` 中找到該分頁列。 |

#### TabBarItem

| 欄位 | Rust | 類型 | 說明 |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | 分頁的標題，螢幕閱讀器會讀出。 |
| `icon` | `.icon(name)` | `string` | 分頁的圖示，使用各平台對它的名稱：iOS 上是 [SF Symbol](https://developer.apple.com/sf-symbols/)（`"house"`），Android 上是應用程式的 drawable（`res/drawable/home.xml` 是 `"home"`，`"android:ic_menu_search"` 是系統的）。`platform.select` 可為每個平台各指定一個。 |

<a id="events"></a>

### 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | 使用者選擇了一個分頁：`{ index }`，即其索引。分頁列會立即顯示該選擇；應用程式則顯示該分頁的內容並設定 `selectedIndex`。 |

<a id="platform-notes"></a>

### 平台備註

- **iOS 和 Mac Catalyst**：`UITabBar`，外觀依 iOS 版本而定，採用系統外觀：iOS 26 上是浮動的 Liquid Glass 分頁列及其選取效果。圖示為 SF Symbols。主題的 `primary` 就是分頁列的 `tintColor`，即被選取分頁的顏色；其他分頁沿用系統的顏色。
- **Android**：Material 3 的導覽列，由平台的 view 組成：每個標籤上方有一個位於 active indicator 內的圖示，按下時有 ripple 效果，Android 12 及更新版本使用系統的動態顏色，之前的版本使用 Material 的基準顏色，並依應用程式的外觀採用淺色或深色。位於視窗底部時，它會延伸到導覽列下方，高度按導覽列的 inset 增加，與 Material 的做法相同。圖示為應用程式的 drawable（由分頁列著色）。被選取分頁的圖示和標籤使用主題的 `primary`，其下的 active indicator 為該顏色的 12% 不透明度；其他分頁沿用系統的顏色。
- **桌面平台（macOS、Windows、Linux、GPUI）和網頁**：各區段以 [Tabs](../elements/tabs.md) 顯示，採用應用程式自己的外觀。`TabBar` 在這些平台上不佔空間，因此同一個版面可以同時適用，並由 `platform.os`（[`nsh` 的裝置 API](./nsh.md#device)）選擇。

## InputAccessoryView

在 iOS 和 Mac Catalyst 上可用；在 Android 上則是一個空白的隱藏 view。

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

位於鍵盤上方的列（UIKit 的 `inputAccessoryView`），當 `ios={{ inputAccessoryViewID }}` 與其 `nativeID` 相符的輸入框取得焦點時顯示。Rust：`input_accessory_view(native_id)`，會為 `.input_accessory(native_id)` 相符的輸入框顯示。它與視窗同寬，高度與其內容相同，並在原生層面隨鍵盤移動。

| 屬性 | 類型 | Rust | 說明 |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | 具有此 `inputAccessoryViewID` 的輸入框會顯示該列。 |
| `style` | `StyleProp<ViewStyle>` | `Styled` 方法（`.bg(…)`） | 該列的樣式（例如其背景）。 |
| `class` | `string` | | Tailwind classes。 |
| `children` | `JSX.Element` | `.child(…)` | 該列的內容。 |

它在樹中所放置的位置不會渲染任何內容，在 Android 上則完全不渲染，因此你可以把它放在所屬輸入框的旁邊。

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

另請參閱 [Forms and keyboard](../docs/forms-and-keyboard.md)。

## BackHandler

在 Android 上可用；在 iOS 上，其監聽器會被保留但永遠不會被呼叫，而 `exitApp()` 會立即返回。

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

即系統的返回按鈕和返回手勢。對話框會先處理返回操作（對話框會關閉）；然後 `BackHandler` 的監聽器會執行，最近加入的最先執行；當沒有任何監聽器處理該操作時，最上層的導覽堆疊會 pop，如果沒有可返回的頁面，應用程式便會退出。

| 成員 | Rust | 說明 |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | 當 `listener` 已處理該次按下時，返回 `true`。返回一個用來停止監聽的函式；在元件渲染（或 effect 執行）期間加入的監聽器，會隨之停止，Rust 和 TSX 都是如此。 |
| `exitApp()` | 監聽器返回 `false` | 離開應用程式。返回 `false` 的 Rust 監聽器會讓該次按下繼續傳遞，因此堆疊會返回上一頁，或應用程式會退出。 |

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
> 監聽器在系統傳遞該次按下之後執行：主執行緒從不等待應用程式的程式碼。只要至少註冊了一個監聽器，NSH 就會接管對話框未處理的返回操作，並在沒有任何監聽器返回 `true` 時，自行在最上層堆疊中返回或退出應用程式。

狀態列由來自 `nsh/base` 的 [pages and dialogs](./nsh-base.md#status-bar) 的 `statusBar` 設定，iOS 和 Android 均如此。
