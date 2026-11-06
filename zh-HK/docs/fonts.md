---
title: "字型"
description: "系統字型與通用字型家族、後備字型清單、從 Rust crate 的資源或 TSX 匯入內容中附帶 .ttf、.otf、.woff 及 .woff2 檔案、包含多種字重與斜體的字型家族,以及在具型別樣式和 Tailwind class 中使用字型。"
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---


# 字型

Text 預設使用系統字體（iOS 為 San Francisco，Android 為 Roboto），除非字體系列另有指定（Rust 中用 `.font_family(..)`，TSX 中用 `fontFamily`）。字體系列可以是通用字體系列、裝置上已安裝的字體，或隨應用程式一併發佈的字體檔案。

<a id="system-and-generic-families"></a>

## 系統字體與通用字體系列

| `fontFamily` | 字體 |
|---|---|
| （無）、`"system-ui"`、`"sans-serif"`、`"ui-sans-serif"`、`"-apple-system"` | 系統字體 |
| `"serif"`、`"ui-serif"` | 系統襯線字體（iOS 為 New York，Android 為 Noto Serif） |
| `"monospace"`、`"ui-monospace"` | 系統等寬字體（iOS 為 SF Mono） |
| `"ui-rounded"` | 系統圓體（SF Pro Rounded），僅限 iOS |

系統字體支援 100 至 900 的所有字重。Tailwind 的 `font-sans`、`font-serif` 和 `font-mono` 對應前三列，而 `font-sans` 和 `font-mono` 則在主題設定了字體時對應主題的字體（[為應用程式設定預設字體](#a-default-font-for-the-app)）。

裝置上已安裝的字體系列可直接以名稱指定（例如 `"Georgia"`、iOS 上的 `"Avenir Next"`）。不同平台和版本所安裝的字體各有不同，因此設計所依賴的字體應隨應用程式發佈。在 iOS 上，若指定的字體系列不存在，會退回使用系統字體，並在日誌中記錄警告（`font family 'X' is not available`）；可以指定一個清單來決定改用哪些字體（[後備清單](#fallback-lists)）。

<a id="shipping-a-font"></a>

## 發佈字體

Rust crate 會發佈其 `assets/` 目錄中的檔案：在 `#[native_module]` 函數中使用 `registry.assets(assets!())` 會發佈全部檔案，而 `asset!("fonts/Pacifico-Regular.ttf")` 是一個 `FontAsset`，其 `family` 是字體的系列名稱，在 crate 編譯時從檔案中讀取。在 TSX 中，匯入 `.ttf`、`.otf`、`.woff` 或 `.woff2` 檔案：匯入的結果即為字體的系列名稱。無論哪種方式，字體都會在第一個畫面幀之前完成註冊，因此文字首次渲染時字體已準備就緒。WOFF 和 WOFF2 檔案是經壓縮的 TrueType 或 OpenType 字體（WOFF2 檔案的大小往往只有對應 TrueType 的一半，可減少應用程式套件的體積及網頁的下載量）：NSH 會在所有平台上將它們當作其所包含的字體來讀取：

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` 和 TSX 匯入的 `Pacifico` 都是字串 `"Pacifico"`：即字體檔案中儲存的系列名稱（優先使用其 typographic family name，否則使用 family name），而不是檔案名稱。使用資源提供的值而非手動輸入名稱，可確保兩者保持一致；檔案缺失或損毀會令 Rust 建置失敗，而被匯入的檔案必定會被打包。

這些檔案與其他[資源](./images-and-assets.md)一樣隨應用程式發佈。字體只會在應用程式的行程中註冊，不會安裝到裝置上。

> [!WARNING]
> 在 TSX 中，若匯入的值從未被使用，TypeScript 的 import elision 會將其移除，字體也會隨之被移除。如果你只是以名稱引用字體系列（例如在 Tailwind 主題中），請以副作用方式匯入該檔案：`import "./fonts/Inter-Bold.ttf";`。Rust crate 會透過 `assets!()` 發佈 `assets/` 中的每個檔案。

<a id="fallback-lists"></a>

## 後備清單

`fontFamily` 接受與 CSS 相同的清單格式：以逗號分隔多個字體系列，最優先的排在最前，含空格的名稱可加引號或不加（`"Brand, 'Noto Sans SC', sans-serif"`），加了引號的名稱可保留其中的逗號（`'ACME, Inc'`）。文字會以平台所擁有的第一個字體系列排版；如果該字體缺少某個字元（其他文字系統或符號），則由清單中下一個擁有該字元的字體系列提供，之後才輪到系統的後備字體。透過清單，只涵蓋拉丁字母的品牌字體可以搭配相稱的字體來顯示中文，也可以在清單中列出應用程式下載的字體，並附上系統字體，在下載完成前先行顯示：

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

各平台以自身的字體機制保留清單的順序：iOS 和 macOS 使用 cascade list，Windows 使用 font fallback（每個段落一個：取其第一個樣式的清單），Linux 使用 Pango 字體系列清單，網頁使用瀏覽器自身的機制，GPUI 則使用其後備字體。在 Android 上，文字以其擁有的第一個字體系列排版；如果該字體是應用程式註冊的字體，清單中排在其後的已註冊字體即為其後備字體（Android 10 及以上）。

<a id="weights-and-italics"></a>

## 字重與斜體

一個字體系列通常由多個檔案組成，每個字重和樣式各一個。請將每個檔案都發佈出去（Rust 中放入 `assets/`，TSX 中逐一匯入）；它們會以相同的系列名稱註冊，並由字重和樣式來選擇字體樣式：

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

當沒有任何已註冊的字體樣式完全符合所要求的字重時，會使用最接近的一個。字體樣式缺失時，各平台的處理方式不同：

| | iOS | Android |
|---|---|---|
| 沒有對應字體樣式的字重 | 最接近的已註冊字體樣式 | 最接近的字體樣式，並在適用時使用 Android 的合成粗體 |
| 沒有斜體字體樣式的斜體 | 正體字體樣式（不會傾斜） | 將正體字體樣式傾斜後的版本 |

請發佈你所使用的所有字體樣式，以便在兩個平台上得到相同的效果。

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## 類型化樣式與 Tailwind class 中的字體

在 Rust 中，`.font_family(..)` 可在任何放置樣式的位置使用資源的字體系列，而字重方法（`.font_weight(FontWeight::SEMIBOLD)`）則用來選擇字體樣式。至於 class，請在 `nsh.json` 的 Tailwind 主題中為你的字體系列命名，以便作為 `font-*` class 使用：

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

任意的字體系列無需在主題中設定即可使用：`font-[Pacifico]`。字重 class（`font-light`、`font-semibold`、`font-bold` 等）選擇字體樣式的方式與 `fontWeight` 相同。View 上的文字樣式會向下傳遞給其內的 Text，因此在 View 上使用 `.font_family(INTER.family)`，或使用 `<View class="font-body">`，即可為整個畫面設定字體系列。

<a id="a-default-font-for-the-app"></a>

## 為應用程式設定預設字體

主題的 `font-sans` 即為應用程式的字體：每個沒有自行設定字體系列的 Text 都會以它繪製，Rust 元件和 TSX 皆然，就如同網頁使用 Tailwind 的 `--font-sans` 一樣。`font-mono` 是等寬字體，用於 `font-mono` class 以及 `TextView` 中的程式碼。請在應用程式的主題中設定這些字體（`nsh.json` 中的 `"theme"`，[Rust](./rust.md#theme)），並按上述方式發佈字體檔案：

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

清單中第一個非通用的字體系列即為所用字體；如果第一個字體系列是通用字體系列（`system-ui`、`sans-serif`），則使用系統字體。也可以在容器上設定字體：其內的 Text 會繼承該字體。

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## 字體功能

`fontVariant` 會啟用字體的 OpenType 功能：`"tabular-nums"`、`"proportional-nums"`、`"lining-nums"`、`"oldstyle-nums"` 和 `"small-caps"`（Rust 中為 `.tabular_nums()`、`.small_caps()` 等；[Text](./text.md#text-styles)）。字體本身必須包含這些功能；系統字體都包含。

<a id="related"></a>

## 相關內容

- [Text](./text.md)：文字樣式、大小，以及系統文字大小設定。
- [Tailwind](./tailwind.md#theme)：主題的鍵名。
- [圖片與資源](./images-and-assets.md)：應用程式檔案的發佈方式。
