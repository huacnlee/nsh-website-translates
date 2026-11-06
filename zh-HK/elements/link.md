---
title: "Link"
description: "Link 元件:按下後會前往其他位置的內容,可以是頁面、網站或應用程式的路由,支援按下操作、鍵盤啟動、停用狀態,以及供螢幕閱讀器使用的 link 角色,樣式由應用程式自行定義。"
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---


# Link

連結會帶用戶前往某處：網頁、另一個應用程式（`mailto:`、`tel:`），或應用程式本身的某個畫面。它負責處理行為：按下、獲得鍵盤焦點時的 Return 和 Space、停用狀態，以及供屏幕閱讀器使用的 link 角色。外觀則由應用程式決定：`Link` 本身沒有顏色、底線或標籤，顯示出來的是它的子元素。`href` 指明去向；它是供開啟時使用的資料，絕不會顯示為畫面上的文字。

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

`Link` 來自 [`nsh/base`](../modules/nsh-base.md)，即 Rust 中的 `nsh-base` crate。在 Rust 中，`link()` 會建立一個連結，每個屬性有對應的 setter（`.href(..)`、`.open_with(..)`），每個事件有對應的監聽器（`.on_open(..)`、`.on_press(..)`），連結本身使用型別化的樣式方法，內容則使用 `.child(..)`。

<a id="opening"></a>

## 開啟

按下、點擊，或在獲得焦點的連結上按 Return 或 Space，會開啟它的 `href`：

1. `onOpen({ href })` 回報連結的去向。
2. 在 `openWith="system"`（預設值）下，屬於另一個應用程式或網站的 URL，即帶有 scheme 的 URL（`https:`、`mailto:`、`tel:`，或其他應用程式註冊的 scheme），會在應用程式外開啟，方式與 [`openUrl`](../modules/nsh.md) 相同：先由嵌入式應用程式的 router 處理，再交給系統。其他的 `href`，即應用程式自己的路徑（`/orders/42`）或 `#anchor`，只會回報，並由應用程式自行處理。
3. `onPress()` 回報這次按下。

在 `openWith="app"` 下，連結如何開啟由應用程式的 `onOpen` 處理器決定：自己的路由、應用程式內 web view 中的頁面，或先顯示確認。

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

當應用程式在 `nsh.json` 中宣告 capability（`"openUrl": true`，或 `{ "schemes": ["https", "mailto"] }`）時，在應用程式外開啟 URL 需要 `openUrl` capability。

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | 無 | 連結的去向：URL，或應用程式自己的路徑。以 `onOpen` 回報，絕不顯示。 |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"`（`LinkOpenWith`） | `"system"` | 由誰開啟 `href`：系統會開啟屬於另一個應用程式或網站的 URL；`"app"` 則交由 `onOpen` 處理。 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 不接受按下、沒有按下回饋、沒有鍵盤焦點；`disabled:` 樣式會套用，屏幕閱讀器會說明它處於變暗狀態。 |
| `current` | `.current(..)` | `boolean` | `false` | 指向用戶目前所在頁面的連結，用於導覽列或麵包屑：屏幕閱讀器會說明它是目前頁面。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 無 | 當內容提供的資訊不足（例如圖示）時，屏幕閱讀器所讀出的內容。 |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | 無 | 在邊界以外多遠的按下仍會計算在內，單位為點：所有邊使用同一個數字，或分別指定各邊。與 view 的 `hitSlop` 相同。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容：標籤、圖示，或應用程式顯示的任何內容。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | 無 | 連結的外觀：顏色、底線、內距；文字屬性會傳遞給其內的文字。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | 無 | 連結在按下、懸停、聚焦或停用時的樣式，與 `<state>:` class 相同。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | 連結開啟 `href`：在 `openWith="app"` 下由處理器開啟，在 `"system"` 下則得知系統被要求開啟的內容。它早於 `onPress` 觸發。 |
| `onPress` | `.on_press(\|\| ..)` | 連結被按下：輕按、點擊，或在連結獲得鍵盤焦點時按 Return 或 Space。 |

已停用的連結不會回報任何事件，對它的按下也不會傳到周圍任何可按下的 view。

<a id="states"></a>

## 狀態

應用程式以 class 或樣式屬性為各個狀態設定樣式：

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

已造訪的連結由應用程式自行記錄：它保存已開啟的 href，並按自己的狀態為這些連結設定樣式。

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

## 在文字內

與文字內的所有 view 一樣，位於 `<Text>` 內的 `Link` 是段落的行內框：它位於行內，保有自己的狀態、焦點和角色，並且只佔一行。`align-text-bottom` 會把只有一行文字的連結對齊段落的基線：

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

隨段落換行的連結，是帶有 `role="link"` 和 `onPress` 的巢狀 `<Text>`（參閱 [Text](./text.md)），[TextView](./text-view.md) 繪製文件中的連結時就是這樣做。

<a id="a-small-target-with-hitslop"></a>

## 使用 hitSlop 處理細小的目標

連結可能比手指還小：例如圖示或短詞。`hitSlop` 讓落在連結附近的按下也計算在內，距離以各邊向外的點數計算，不會改變連結的版面或外觀：所有邊使用同一個數字，或分別指定各邊（`{ top: 8, bottom: 8 }`），與 [view 的 `hitSlop`](./index.md#presses-and-feedback) 接受的格式相同。

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## 無障礙

- 對屏幕閱讀器而言，連結是單一元素，角色為 `"link"`；其標籤是子元素的文字，或 `accessibilityLabel`。`href` 仍然只是資料：屏幕閱讀器讀出的是標籤。
- `current` 會讀作目前頁面（ARIA 的 `aria-current="page"`），`disabled` 則按平台對變暗元素的讀法讀出。
- 在 macOS 和 web 上，連結是鍵盤焦點的停駐點：按 Tab 可到達，按 Return 和 Space 可開啟，`focus:` 樣式會顯示焦點所在位置。

有關標籤、角色和公告的一般說明，請參閱 [Accessibility](../docs/accessibility.md)。

<a id="platform-notes"></a>

## 平台備註

- iOS、Android 和 Mac Catalyst：按下指在連結上結束的輕按。
- 桌面平台（macOS、Windows、Linux、GPUI）和 web：按下指點擊。在 macOS 和 web 上，Return 和 Space 也可開啟獲得鍵盤焦點的連結。
- web 會把連結繪製為帶有 `role="link"` 的元素。
- 各平台都會繪製應用程式所設定的樣式。
