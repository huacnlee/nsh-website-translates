---
title: "無障礙功能"
description: "讓應用程式支援 VoiceOver 與 TalkBack:標籤、角色、狀態、數值、自訂動作、群組與隱藏、公告與焦點、文字大小,以及減少動態效果。"
order: 48
group: ui
---

# 無障礙

NSH 以原生檢視（view）進行渲染，因此各平台的輔助技術（iOS 與 Mac Catalyst 上的 VoiceOver、Android 上的 TalkBack、Switch Control、Voice Control 等）看到的是你的應用程式真實的檢視階層。你需要補充的，是這些技術無法自行推斷的描述：元素是什麼、內容為何、處於什麼狀態，以及可以做什麼。每個元素都接受以下的方法（Rust）與 props（TSX）。

<a id="what-you-get-without-doing-anything"></a>

## 無需任何設定即可獲得的功能

- **文字會被朗讀。** 文字元素本身就是無障礙元素，其標籤即為它的文字。沒有標籤的檢視，會被朗讀為其內部的文字。
- **可按壓的檢視是元素。** 具有按壓或長按處理器（`.on_press`、`onPress`）的檢視預設為無障礙元素，啟用它（在 VoiceOver 或 TalkBack 中連點兩下）即等同按壓它。
- **輸入框是文字欄位**，包含其 placeholder、值與鍵盤。
- **文字會跟隨使用者的大小設定。** 請參閱[文字大小](#text-size)。

<a id="labels-hints-and-roles"></a>

## 標籤、提示與角色

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | 型別 | 說明 |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | 該檢視對輔助技術而言是單一元素；其子元素不會被個別公開。 |
| `.label(..)` | `accessibilityLabel` | `string` | 螢幕閱讀器所朗讀的內容，取代內部的文字。 |
| `.hint(..)` | `accessibilityHint` | `string` | 啟用該元素會做什麼，會在停頓後朗讀。 |
| `.role(..)` | `role` | `AccessibilityRole` | 該元素是什麼。 |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | 其狀態：停用、已選取、已勾選、忙碌中、已展開、已按下、目前項目。`selected` 同時會套用選取樣式，`checked` 在為 true 時套用勾選樣式，在 `"mixed"` 時套用不確定樣式，`pressed` 在為 true 時套用按下樣式。 |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | 標題的層級（1 為最上層）、樹狀項目的深度（1 為最上層）。 |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | 範圍型或文字型元素的值。 |
| | `accessibilityActions` | `{ name, label? }[]` | 提供給輔助技術的動作。 |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | 已執行某個動作（Rust：其名稱）。 |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | 對輔助技術隱藏該檢視及其子樹。 |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | 該檢視（及其子樹）是否被公開。 |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android：檢視的變更如何向 TalkBack 播報。 |
| `.test_id(..)` | `testID` | `string` | 供 UI 測試使用的識別碼（iOS 上的 accessibility identifier、Android 上的 resource id）；不會被朗讀。 |

請為每個僅有圖示的控制項提供標籤：螢幕閱讀器無法朗讀字形或圖片。標籤要簡短，且不要包含角色（寫「播放」，而不是「播放按鈕」）：角色會被單獨播報。

<a id="roles"></a>

### 角色

角色（`.role(AccessibilityRole::Header)`、`role="header"`）告訴使用者這是哪一種元素，以及如何操作它。在 Rust 中它是 `AccessibilityRole` 的變體（`Button`、`Header`、`Switch` 等）；TSX 的值有 `"none"`、`"button"`、`"link"`、`"search"`、`"image"`、`"imagebutton"`、`"keyboardkey"`、`"text"`、`"adjustable"`、`"header"`、`"summary"`、`"alert"`、`"checkbox"`、`"combobox"`、`"menu"`、`"menubar"`、`"menuitem"`、`"progressbar"`、`"radio"`、`"radiogroup"`、`"scrollbar"`、`"spinbutton"`、`"switch"`、`"tab"`、`"tablist"`、`"timer"`、`"toolbar"`、`"list"`、`"grid"`、`"table"`、`"rowgroup"`、`"row"`、`"columnheader"` 和 `"cell"`（[`Table`](../elements/table.md) 各部分的角色）、`"listbox"` 和 `"option"`（可供選擇的選項清單，例如 [`Select`](../elements/select.md) 的清單，及其選項，被選中的選項以 `accessibilityState.selected` 標示）、`"group"`（屬於同一組的相關元素）、`"region"`（值得單獨前往的區段，例如手風琴的面板）、`"navigation"`（在應用程式內移動的連結，例如分頁）、`"tree"` 和 `"treeitem"`（可展開與收合的項目，各自位於其 `accessibilityLevel`）、`"menuitemcheckbox"` 和 `"menuitemradio"`（被勾選的選單項目，單獨存在或作為群組中的單一選項）。

最常用的角色：

- `"button"` 用於任何不是連結的可按壓元素；`"link"` 用於導向內容。
- `"header"` 用於區段標題：螢幕閱讀器使用者會在標題之間跳轉以瀏覽畫面。`accessibilityLevel` 在平台會朗讀層級的情況下提供其層級（1 為最上層）。
- `"button"` 搭配 `accessibilityState.pressed` 用於切換按鈕，即維持開或關的按鈕（例如工具列中的粗體）。
- `"navigation"` 包住在頁面之間移動的連結，目前所顯示頁面的連結則搭配 `accessibilityState.current: "page"`。
- `"switch"`、`"checkbox"`、`"radio"` 搭配 `accessibilityState.checked`。
- `"adjustable"` 用於滑桿與步進器，搭配 `accessibilityValue` 以及 `increment` / `decrement` 動作
  （[`Slider`](../elements/slider.md) 的每個滑塊都是其中之一）。
- `"spinbutton"` 用於持有數字且使用者也能逐步調整的欄位，使用相同的值與動作（[`NumberInput`](../elements/number-input.md) 的欄位）。
- `"image"` 用於有意義的圖片，並搭配標籤；裝飾性圖片則應改為隱藏。

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### 狀態與值

對於應用程式中的開 / 關控制項，請使用 `nsh/base` 中的 [`Switch`](../elements/switch.md)，它會自行設定角色與狀態。以下範例展示在檢視上設定角色與狀態的效果。

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

狀態在 Rust 中為 `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }`，在 TSX 中為 `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }`。`pressed` 使按鈕成為切換按鈕（ARIA 的 `aria-pressed`）；`current` 標記一組項目中的目前項目（ARIA 的 `aria-current`）：例如分頁的頁碼、精靈的步驟。停用檢視（`.disabled(..)`、`disabled`）也會隱含 `disabled`。`accessibilityValue` 搭配 `min`、`max` 和 `now` 時會以百分比朗讀；搭配 `text` 時則照原樣朗讀（「3 of 10」、「Medium」）。

<a id="actions"></a>

## 動作

可按壓的檢視本身已支援啟用。對於其他情況，請以 `accessibilityActions` 宣告動作，並以 `onAccessibilityAction` 處理；Rust 元件則以 `.on_accessibility_action(|name: &str| ..)` 接收已執行動作的名稱：

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

部分動作名稱是標準名稱，對應到各平台自身的手勢：

| 名稱 | iOS（VoiceOver） | Android（TalkBack） |
|---|---|---|
| `activate` | 連點兩下 | 連點兩下（click） |
| `increment`、`decrement` | 向上 / 向下撥動，然後 VoiceOver 朗讀新的值 | 向前 / 向後捲動 |
| `longpress` | | 連點兩下並按住 |
| `expand`、`collapse` | | 展開 / 收合 |
| `magicTap` | 雙指連點兩下 | |
| `escape` | 雙指 Z 字形擦動 | |

具有 `increment` 或 `decrement` 的元素無論角色為何都是可調整的：圖表保留其 `"image"` 角色，並透過 VoiceOver 的撥動與 TalkBack 的捲動逐點瀏覽，每走一步後會朗讀其 `accessibilityValue`。

任何其他名稱都會成為自訂動作，並以其 `label`（或其名稱）列於 VoiceOver 的動作轉盤與 TalkBack 的動作選單中。自訂動作是滑動刪除及類似手勢的無障礙形式：

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## 分組與隱藏

將檢視設為無障礙（`.accessible(true)`、`accessible`）會使該檢視成為單一元素：包含標題、副標題與價格的卡片會一次讀完，而不需要使用者逐一撥動三段文字。

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

請隱藏沒有附加價值的內容：裝飾性圖片、分隔線，以及緊鄰著已表達相同意思之文字的圖示。

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden`（iOS 的名稱）與 `importantForAccessibility="no-hide-descendants"`（Android 的名稱）在兩個平台上都會隱藏子樹；同時設定兩者並無妨。

<a id="the-screen-reader-and-the-users-settings"></a>

## 螢幕閱讀器與使用者的設定

在 Rust 中，prelude 會回報使用者的設定並與螢幕閱讀器溝通：`screen_reader()` 和 `reduce_motion()` 是響應式的，`announce_for_accessibility(message)` 讓螢幕閱讀器朗讀一則訊息，而元素的 `element_ref()` 可用 `set_accessibility_focus()` 將螢幕閱讀器的焦點移到該元素。在 TSX 中，`nsh` 的無障礙 API 會回報使用者的設定，並讓你與螢幕閱讀器溝通。

| 成員 | 說明 |
|---|---|
| `screenReaderEnabled()` | VoiceOver 或 TalkBack 是否正在執行（響應式）。 |
| `reduceMotion()` | 使用者是否要求減少動態效果（響應式）。 |
| `announce(message)` | 螢幕閱讀器朗讀 `message`。 |
| `setAccessibilityFocus(ref)` | 將螢幕閱讀器的焦點移到某個檢視。 |

這些設定是存取器（accessor）：請在綁定或 effect 中讀取它們，當使用者變更設定時，讀取它們的部分會自動更新，無需清理。

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

請播報使用者否則可能錯過的變更：背景儲存完成、在焦點之外出現的錯誤、計時器結束。在 Android 上，在檢視上設定 `android={{ accessibilityLiveRegion: "polite" }}` 會讓 TalkBack 自行播報該檢視的變更。

<a id="text-size"></a>

## 文字大小

文字與輸入框會跟隨系統文字大小（iOS 上的 Dynamic Type、Android 上的字型大小），除非你將其關閉（`.allow_font_scaling(false)`、`allowFontScaling={false}`）。與其關閉，不如針對它進行設計：

- 讓文字可換行：避免在包含文字的檢視上使用固定高度。
- 以 `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` 限制過大的標題，而不是停用縮放。
- 文字較大時切換版面配置：讀取 `font_scale()`（Rust）或 `nsh` 中的 `fontScale()`（TSX）（例如在超過 1.3 時，將標籤與其值改為垂直堆疊）。

請參閱[裝置與環境](./device-and-environment.md#text-size)。

<a id="reduced-motion"></a>

## 減少動態效果

當使用者開啟 iOS 的「減少動態效果」（Reduce Motion）或 Android 的移除動畫設定時，`reduce_motion()`（Rust）與 `reduceMotion()`（TSX）為 `true`。你的動畫會照你的寫法執行，因此請使用它，或使用 `motion-reduce:` 和 `motion-safe:` Tailwind 變體，將大幅度的移動替換為淡入淡出或即時變更：

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## 觸控目標

請讓可按壓的元素至少為 44 × 44 點。當控制項必須看起來較小時，請以點擊範圍擴充（hit slop，`.hit_slop(..)`、`hitSlop`）來延伸其觸控區域，而不是改變其尺寸；請參閱[觸控與手勢](./touch-and-gestures.md#hit-areas-hitslop)。

<a id="checking-your-app"></a>

## 檢查你的應用程式

- 開啟 VoiceOver（iOS 設定、輔助使用，或在已設定的情況下連按側邊按鈕三下）或 TalkBack，並在不看畫面的情況下使用應用程式：每個控制項都應說明它是什麼以及它做什麼。
- 在 iOS 模擬器上，Xcode 的 Accessibility Inspector 會顯示每個元素的標籤、特性（traits）與值。
- 試試最大的文字大小與深色模式。
- 測試 ID（`.test_id(..)`、`testID`）為 UI 測試提供穩定的操作依據，不會隨標籤的語言而改變。

<a id="related"></a>

## 相關內容

- [`nsh` 的無障礙 API](../modules/nsh.md#accessibility)：參考文件。
- [`View`](../elements/view.md)：所有無障礙 props。
- [動畫](./animation.md#reduced-motion)與[裝置與環境](./device-and-environment.md)。
