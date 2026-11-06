---
title: "Button"
description: "Button 元件：負責處理按下操作、停用與選取狀態，以及螢幕閱讀器所使用的角色的可按壓目標，樣式由應用程式自行設定。"
group: base
demo: el-button
---

# Button

按鈕是一個可按壓的目標。它負責行為：按壓、透過應用程式的狀態樣式提供的按壓回饋、停用與選取狀態、鍵盤焦點，以及供螢幕閱讀器使用的角色。外觀則由應用程式決定：`Button` 本身沒有顏色、尺寸、內距或標籤，因此同一個元件可以依據你提供的樣式與子元素，變成主要按鈕、圖示按鈕、頁籤、工具列切換鈕或清單中的一列。

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 TSX 中，其外觀由 `class` 與 `style` 決定，並可搭配狀態變體 `active:`、`hover:`、`focus:`、`selected:` 與 `disabled:`（或對應的 `activeStyle`、`hoverStyle`、`focusStyle`、`selectedStyle` 與 `disabledStyle`）。在 Rust 中，`button()` 建立按鈕的方式就如同 `view()` 建立檢視：每個屬性對應一個 setter（`.disabled(..)`、`.selected(..)`），每個事件對應一個監聽器（`.on_press(..)`），以具型別的樣式方法（`.px_4()`、`.bg(..)`）設定外觀，以狀態方法（`.active(..)`、`.hover(..)`、`.focus(..)`、`.selected_style(..)`、`.disabled_style(..)`）設定各狀態，並以 `.child(..)` 設定內容。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按壓，也沒有按壓回饋；會套用 `disabled:` 樣式，且螢幕閱讀器會將其朗讀為已淡化（dimmed）。 |
| `selected` | `.selected(..)` | `boolean` | `false` | 已選取：例如已開啟的切換鈕、目前的頁籤。螢幕閱讀器會朗讀此狀態。其值由應用程式持有並負責設定樣式。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 無 | 當 `selected` 且未停用時的樣式，以 `selected:` class 表示。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 當內容不足以表達時（例如圖示），螢幕閱讀器所朗讀的內容。 |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | 當沒有任何 `nsh/base` 元件屬於該控制項時，螢幕閱讀器所識別的用途：`"link"`（開啟網址）等。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界之外多遠的按壓仍然算數，單位為 point：可用一個數字套用於所有邊，或分別指定各邊。與檢視的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容：文字、圖示或任何版面配置。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 它的外觀，全部都在這裡設定。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 按下、懸停、取得焦點或停用時的樣式，以 `<state>:` class 表示。後面的狀態優先；`disabled` 優先於所有狀態。 |

在 Rust 中，每個 prop 都是一個 setter，可接受值、signal 或 closure；未設定的 prop 會保留預設值：

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

## Events

| 事件 | Rust | 說明 |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | 按鈕被按下：包含輕點、點擊、在按鈕擁有鍵盤焦點時按下 Return 或 Space，或是螢幕閱讀器的啟動操作。 |
| `onPressDown` | `.on_press_down(\|\| ..)` | 一次按壓在按鈕上開始。 |
| `onPressUp` | `.on_press_up(\|\| ..)` | 按壓結束：放開、移開或被取消。 |

`onPressDown` 與 `onPressUp` 用於你自行設計的按壓回饋，例如彈簧動畫，或是狀態樣式無法表達的高亮效果。停用的按鈕不會回報其中任何一個事件。

<a id="styling"></a>

## 樣式

按鈕的外觀由你的應用程式決定：由應用程式定義什麼是主要按鈕或次要按鈕。可以用一對小型元件把這項決定集中在同一處：

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

狀態變體以原生方式套用：按壓時按鈕變暗是在主執行緒上完成的，不需要執行任何 JS 或 Rust。在 Rust 中，狀態方法即是同樣的變體：`.active(..)`、`.hover(..)`、`.focus(..)`、`.selected_style(..)` 與 `.disabled_style(..)` 會跟隨按鈕自身的狀態。你的主題顏色也以同樣的方式運作：TSX 中使用 `bg-primary`，Rust 中使用 `theme().primary`（請參閱 [Theme tokens](../docs/tailwind.md#theme-tokens)）。

<a id="disabled"></a>

## 停用

停用的按鈕不接受按壓，也不提供回饋，且螢幕閱讀器會將其朗讀為已淡化。停用時的外觀由你決定，可使用 `disabled:` class 或 `disabledStyle`：

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## 使用 selected 建立切換鈕

`selected` 會讓按鈕成為切換鈕：例如工具列的粗體按鈕、篩選標籤（filter chip）、目前的頁籤。值由應用程式持有，在 `onPress` 中翻轉，並為選取狀態設定樣式；螢幕閱讀器會將該按鈕朗讀為已選取。

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

一列頁籤應使用 [`Tabs`](./tabs.md)，開／關控制項則應使用 [`Switch`](./switch.md)，兩者皆來自 `nsh/base`：它們各自負責該類控制項的角色、選取狀態與鍵盤操作，而搭配 `role="tab"` 或 `role="switch"` 的 `Button` 並不具備這些。

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 擴大小型目標

圖示按鈕可能比手指還小。`hitSlop` 會讓落在按鈕附近的按壓也算數，單位為各邊向外延伸的 point，而不會改變其版面配置或外觀：可用一個數字套用於所有邊，或分別指定各邊（`{ top: 8, bottom: 8 }`），就如同 [檢視的 `hitSlop`](./index.md#presses-and-feedback) 所接受的方式。

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，按鈕是單一元素，其角色為 `"button"`，除非 `role` 另有指定。它的標籤就是其文字內容；當內容是圖示或所傳達的資訊不足時，請提供 `accessibilityLabel`。
- `disabled` 與 `selected` 會依各平台自己的方式朗讀（VoiceOver、TalkBack、UI Automation、瀏覽器的無障礙樹）。
- 在 macOS 與 Web 上，按鈕是鍵盤焦點的停駐點：Tab 可以移到它，Return 與 Space 可以按下它，而 `focus:` 樣式會顯示焦點所在位置。

關於標籤、角色與朗讀內容的整體說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台注意事項

- iOS、Android 與 Mac Catalyst：按壓是在按鈕上結束的輕點；移開則會取消按壓，與系統內建按鈕的行為相同。
- 桌面平台（macOS、Windows、Linux、GPUI）與 Web：按壓即是點擊。在 macOS 與 Web 上，當按鈕擁有鍵盤焦點時，Return 與 Space 同樣可以按下它。`hover:` 樣式會在滑鼠或觸控板的指標下套用。
- 每個平台都繪製應用程式所設定的樣式：按壓回饋是 `active:` / `activeStyle`，或是你自己設計的動畫。
