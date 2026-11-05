---
title: "字型"
description: "系統字型與通用字型家族、備用字型清單、從 Rust crate 的資源或 TSX 匯入來打包 .ttf、.otf、.woff 與 .woff2 檔案、包含多種字重與斜體的字型家族,以及在具型別的樣式與 Tailwind class 中使用字型。"
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# 字型

文字預設使用系統字型（iOS 為 San Francisco，Android 為 Roboto），除非字型家族另有指定（Rust 中為 `.font_family(..)`，TSX 中為 `fontFamily`）。字型家族可以是通用字型家族、裝置上已安裝的字型，或隨應用程式一併發布的字型檔案。

<a id="system-and-generic-families"></a>

## 系統字型與通用字型家族

| `fontFamily` | 字型 |
|---|---|
| （未設定）、`"system-ui"`、`"sans-serif"`、`"ui-sans-serif"`、`"-apple-system"` | 系統字型 |
| `"serif"`、`"ui-serif"` | 系統襯線字型（iOS 為 New York，Android 為 Noto Serif） |
| `"monospace"`、`"ui-monospace"` | 系統等寬字型（iOS 為 SF Mono） |
| `"ui-rounded"` | 系統圓體字型（SF Pro Rounded），僅限 iOS |

系統字型支援 100 到 900 的所有字重。Tailwind 的 `font-sans`、`font-serif` 與 `font-mono` 對應前三列，而 `font-sans` 與 `font-mono` 在佈景主題有設定時，對應到主題的字型（[為應用程式設定預設字型](#a-default-font-for-the-app)）。

裝置上已安裝的字型家族可以直接以名稱指定（例如 `"Georgia"`，iOS 上的 `"Avenir Next"`）。不同平台與版本所安裝的字型各不相同，因此請將設計所依賴的字型隨應用程式一併發布。在 iOS 上，若指定的字型家族不存在，會退回使用系統字型，並在記錄中輸出警告（`font family 'X' is not available`）；你可以指定一份清單，自行決定改用哪些字型（[備用字型清單](#fallback-lists)）。

<a id="shipping-a-font"></a>

## 發布字型

Rust crate 會發布其 `assets/` 目錄中的檔案：在其 `#[native_module]` 函式中使用 `registry.assets(assets!())` 會發布全部檔案，而 `asset!("fonts/Pacifico-Regular.ttf")` 是一個 `FontAsset`，其 `family` 為字型的家族名稱，於 crate 編譯時從檔案中讀取。在 TSX 中，匯入 `.ttf`、`.otf`、`.woff` 或 `.woff2` 檔案：匯入的值即為字型的家族名稱。無論哪種方式，字型都會在第一個畫面幀之前完成註冊，因此文字首次繪製時字型已就緒。WOFF 與 WOFF2 檔案是壓縮過的 TrueType 或 OpenType 字型（WOFF2 檔案的大小通常只有對應 TrueType 的一半，可節省應用程式套件大小與網頁下載量）：NSH 在所有平台上都會將它們當作其內含的字型來讀取：

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

`PACIFICO.family` 與 TSX 的匯入 `Pacifico` 都是字串 `"Pacifico"`：即儲存在字型檔案中的家族名稱（其排版家族名稱，若無則為家族名稱），而不是檔案名稱。使用資產提供的值而不是手寫名稱，可以讓兩者保持同步；檔案遺失或損毀會使 Rust 建置失敗，而匯入的檔案則必定會被打包。

這些檔案與其他[資產](./images-and-assets.md)一樣隨應用程式發布。字型只會註冊於應用程式的處理程序中，不會安裝到裝置上。

> [!WARNING]
> 在 TSX 中，若匯入的值從未被使用，TypeScript 的匯入省略（import elision）會將其移除，字型也會隨之被移除。如果你只是以名稱引用字型家族（例如在 Tailwind 佈景主題中），請以僅含副作用的方式匯入該檔案：`import "./fonts/Inter-Bold.ttf";`。Rust crate 則會透過 `assets!()` 發布 `assets/` 的所有檔案。

<a id="fallback-lists"></a>

## 備用字型清單

`fontFamily` 接受一份清單，與 CSS 相同：以逗號分隔多個字型家族，最優先者在前，含空格的名稱可加引號也可不加（`"Brand, 'Noto Sans SC', sans-serif"`），加了引號的名稱可保留其中的逗號（`'ACME, Inc'`）。文字會以平台上擁有的第一個字型家族排版；該字型缺少的字元（其他文字系統、符號）會取自清單中下一個擁有該字元的字型家族，然後才是系統的備用字型。清單可讓僅涵蓋拉丁字母的品牌字型以相搭配的字型顯示中文，也可以在指定一個由應用程式下載的字型時，同時列出系統字型，在下載完成前先顯示：

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

各平台以自身的字型機制保留清單的順序：iOS 與 macOS 使用串接清單（cascade list），Windows 使用字型備用機制（每個段落一份：取其第一個樣式的清單），Linux 使用 Pango 字型家族清單，網頁使用瀏覽器本身的機制，以及 GPUI 的備用字型。在 Android 上，文字會以其擁有的第一個字型排版；當該字型是由應用程式註冊的字型時，清單中排在其後的已註冊字型即為其備用字型（Android 10 以上）。

<a id="weights-and-italics"></a>

## 字重與斜體

一個字型家族通常包含多個檔案，每個字重與樣式各一個。請將你使用的每個檔案都發布出去（Rust 中放入 `assets/`，TSX 中逐一匯入）；它們會以相同的家族名稱註冊，並由字重與樣式選擇字型的字面：

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

當沒有已註冊的字面與所要求的字重完全相符時，會使用最接近的字面。字面缺少時，各平台的行為不同：

| | iOS | Android |
|---|---|---|
| 缺少對應字重的字面 | 最接近的已註冊字面 | 最接近的字面，並在適用時使用 Android 的合成粗體 |
| 缺少斜體字面的斜體 | 直立字面（不傾斜） | 將直立字面傾斜後的版本 |

請將你使用的字面都發布出去，以便在兩個平台上得到相同的結果。

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## 型別樣式與 Tailwind 類別中的字型

在 Rust 中，`.font_family(..)` 可在任何放置樣式的地方接受資產的字型家族，而字重方法（`.font_weight(FontWeight::SEMIBOLD)`）用來選擇字面。對於類別，請在 `nsh.json` 的 Tailwind 佈景主題中為你的字型家族命名，即可將它們作為 `font-*` 類別使用：

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

任意的字型家族無需佈景主題項目即可使用：`font-[Pacifico]`。字重類別（`font-light`、`font-semibold`、`font-bold` 等）選擇字面的方式與 `fontWeight` 相同。檢視上的文字樣式會向下傳遞給其內部的文字，因此在檢視上使用 `.font_family(INTER.family)` 或 `<View class="font-body">`，即可為整個畫面設定字型家族。

<a id="a-default-font-for-the-app"></a>

## 為應用程式設定預設字型

佈景主題的 `font-sans` 即為應用程式的字型：每一段未自行指定字型家族的文字都會以它繪製，無論是 Rust 元件還是 TSX 皆然，就如同網頁使用 Tailwind 的 `--font-sans` 一般。`font-mono` 是等寬字型，用於 `font-mono` 類別以及 `TextView` 中的程式碼。請在應用程式的佈景主題中設定它們（`nsh.json` 中的 `"theme"`，[Rust](./rust.md#theme)），並如上所述發布字型檔案：

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

清單中第一個非通用的字型家族即為所用字型；若第一個是通用字型家族（`system-ui`、`sans-serif`），則使用系統字型。也可以在容器上設定字型：其內部的文字會繼承它。

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

## 字型功能

`fontVariant` 會啟用字型的 OpenType 功能：`"tabular-nums"`、`"proportional-nums"`、`"lining-nums"`、`"oldstyle-nums"` 與 `"small-caps"`（Rust 中為 `.tabular_nums()`、`.small_caps()` 等；[Text](./text.md#text-styles)）。字型本身必須包含這些功能；系統字型皆包含。

<a id="related"></a>

## 相關內容

- [Text](./text.md)：文字樣式、大小與系統文字大小設定。
- [Tailwind](./tailwind.md#theme)：佈景主題的鍵值。
- [Images and assets](./images-and-assets.md)：應用程式檔案的發布方式。
