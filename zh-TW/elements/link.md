---
title: "Link"
description: "Link 元件：按下後會前往某處的內容，可以是頁面、網站或應用程式中的路由，支援按下操作、鍵盤啟用、停用狀態，以及供螢幕閱讀器使用的 link 角色，樣式由應用程式自行定義。"
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Link 會帶使用者前往某處：網頁、另一個應用程式（`mailto:`、`tel:`），或應用程式本身的某個畫面。它負責行為：按下、取得鍵盤焦點時的 Return 與 Space、停用狀態，以及供螢幕閱讀器使用的 link 角色。外觀則由應用程式決定：`Link` 本身沒有顏色、底線或標籤，畫面上顯示的是它的子元素。`href` 說明前往何處；它是供開啟使用的資料，不會顯示為畫面上的文字。

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` 來自 [`nsh/base`](../modules/nsh-base.md)，也就是 Rust 中的 `nsh-base` crate。在 Rust 中，`link()` 會建立一個 Link，每個 prop 都有對應的 setter（`.href(..)`、`.open_with(..)`），每個事件都有對應的監聽器（`.on_open(..)`、`.on_press(..)`），並提供 Link 的型別化樣式方法，以及用於內容的 `.child(..)`。

<a id="opening"></a>

## 開啟

按下、點擊，或在取得焦點的 Link 上按 Return 或 Space，會開啟其 `href`：

1. `onOpen({ href })` 回報前往的目標。
2. 使用 `openWith="system"`（預設值）時，其他應用程式或網站的 URL，也就是帶有 scheme 的 URL（`https:`、`mailto:`、`tel:`，或其他應用程式註冊的 scheme），會在應用程式之外開啟，方式與 [`openUrl`](../modules/nsh.md) 相同：先交給嵌入端應用程式的路由器處理，再交給系統。其他任何 `href`，例如應用程式自己的路徑（`/orders/42`）或 `#anchor`，只會被回報，並留在應用程式內。
3. `onPress()` 回報這次按下。

使用 `openWith="app"` 時，Link 如何開啟由應用程式的 `onOpen` 處理函式決定：可以是應用程式自己的路由、應用程式內 web view 中的頁面，或是先顯示確認。

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

當應用程式在 `nsh.json` 中宣告 capabilities（`"openUrl": true` 或 `{ "schemes": ["https", "mailto"] }`）時，在應用程式之外開啟 URL 需要 `openUrl` capability。

## Props

| Prop | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | 無 | Link 前往的目標：URL，或應用程式自己的路徑。會透過 `onOpen` 回報，不會顯示。 |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"`（`LinkOpenWith`） | `"system"` | 由誰開啟 `href`：系統會開啟其他應用程式或網站的 URL；`"app"` 則交給 `onOpen` 處理。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下、沒有按下回饋、沒有鍵盤焦點；`disabled:` 樣式仍會套用，螢幕閱讀器會說明它呈現淡化狀態。 |
| `current` | `.current(..)` | `boolean` | `false` | 指向使用者目前所在頁面的 Link，用於導覽列或麵包屑：螢幕閱讀器會說明它是目前頁面。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 當內容傳達的資訊太少（例如圖示）時，螢幕閱讀器所朗讀的內容。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界之外多遠的按下仍會計入，單位為 point：可以用一個數字套用到每一側，或分別指定各側。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容：標籤、圖示，或應用程式顯示的任何東西。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | Link 的外觀：顏色、底線、內距；文字屬性會傳遞給其內部的文字。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | Link 在被按下、懸停、取得焦點或停用時的樣式，與 `<state>:` class 相同。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Link 開啟 `href`：使用 `openWith="app"` 時由處理函式開啟，使用 `"system"` 時則會收到系統被要求開啟的內容。它發生在 `onPress` 之前。 |
| `onPress` | `.on_press(\|\| ..)` | Link 被按下：點一下、點擊，或在取得鍵盤焦點時按 Return 或 Space。 |

停用的 Link 不會回報任何事件，對它的按下也不會傳到其周圍任何可按下的 view。

<a id="states"></a>

## 狀態

應用程式以 class 或樣式 props 為每個狀態設定樣式：

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

已造訪的 Link 由應用程式自行記錄：它保存已開啟過的 href，並依自身的狀態為這些 Link 設定樣式。

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## 在文字中使用

與文字內的每個 view 一樣，位於 `<Text>` 內的 `Link` 是段落中的行內方塊：它位於該行之中，擁有自己的狀態、焦點與角色，並且保持在同一行。`align-text-bottom` 會把只有一行文字的 Link 對齊到段落的基線：

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

若要讓 Link 隨段落的行一起換行，請使用帶有 `role="link"` 與 `onPress` 的巢狀 `<Text>`（請見 [Text](./text.md)），[TextView](./text-view.md) 繪製文件中的 Link 就是這種做法。

<a id="a-small-target-with-hitslop"></a>

## 以 hitSlop 處理較小的目標

Link 可能比手指還小：例如圖示或很短的單字。`hitSlop` 會讓落在它附近的按下也被計入，範圍是每一側向外延伸的 point 數，且不會改變其版面配置或外觀：可以用一個數字套用到每一側，或分別指定各側（`{ top: 8, bottom: 8 }`），做法與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 相同。

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## 無障礙

- 對螢幕閱讀器而言，Link 是一個元素，角色為 `"link"`；其標籤是子元素的文字，或 `accessibilityLabel`。`href` 仍然只是資料：螢幕閱讀器朗讀的是標籤。
- `current` 會被朗讀為目前頁面（ARIA 的 `aria-current="page"`），`disabled` 則依平台對淡化元素的說法來朗讀。
- 在 macOS 與網頁上，Link 是鍵盤焦點的停駐點：Tab 可以移到它，Return 與 Space 可以開啟它，而 `focus:` 樣式會顯示焦點所在位置。

關於標籤、角色與播報的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台說明

- iOS、Android 與 Mac Catalyst：按下是指在 Link 上結束的一次點一下。
- 桌面平台（macOS、Windows、Linux、GPUI）與網頁：按下是指一次點擊。在 macOS 與網頁上，Return 與 Space 也能開啟取得鍵盤焦點的 Link。
- 網頁會將 Link 繪製為帶有 `role="link"` 的元素。
- 所有平台繪製的都是應用程式所設定的樣式。
