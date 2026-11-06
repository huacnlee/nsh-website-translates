---
title: "Image"
description: "用於顯示內置或遠端圖片的元件，支援佔位圖、模糊效果、淡入淡出、著色及載入事件。"
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---


# Image

`Image` 顯示來自應用程式資源或 URL 的圖片。圖片會在主執行緒以外下載和解碼，按檢視實際顯示的大小縮小取樣，並快取在記憶體中。支援播放動態 GIF、WebP 和 APNG 圖片。Rust 以 `image(src)` 建立，TSX 則以 `<Image>` 配合 `nsh` 建立。

```rust tabs
use nsh_core::prelude::*;

// assets/logo.png in the app's crate.
const LOGO: ImageAsset = asset!("logo.png");

view()
    .flex_row()
    .gap_3()
    .child(image(LOGO))
    .child(
        image("https://example.com/avatar.jpg")
            .placeholder(LOGO)
            .object_fit(ResizeMode::Cover)
            .size(px(64.0))
            .rounded_full(),
    )
```

```tsx tabs
import { Image, View } from "nsh";
import logo from "./assets/logo.png";

<View style={{ flexDirection: "row", gap: 12 }}>
  <Image src={logo} />
  <Image
    src="https://example.com/avatar.jpg"
    placeholder={logo}
    style={{ width: 64, height: 64, borderRadius: 32 }}
  />
</View>;
```

資源本身已知道自己的大小：沒有指定寬度或高度時，圖片會採用資源的大小；只指定其中一項時，另一項會按資源的長寬比自動推算。URL 圖片要載入後才知道大小，所以遠端圖片請同時指定寬度和高度（或指定長寬比，再配合其中一項）。

<a id="sources"></a>

## 來源

來源（`src` 和 `placeholder`；Rust 中為 `image(..)` 和 `.placeholder(..)`）接受以下值：

| 值 | 範例 | 說明 |
|---|---|---|
| 資源 | Rust `asset!("logo.png")`，TSX `import logo from "./logo.png"` | 一個 `ImageAsset` `{ url, size, scales? }`，以點（point）為單位計算大小：`@2x` 檔案的大小為其像素的一半。如果 `logo.png` 旁邊有 `logo@2x.png` / `logo@3x.png`，就會載入對應螢幕像素比例的版本（[像素密度](../docs/images-and-assets.md#pixel-densities)）。可以匯入 `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp` 和 `.heic`，以及 `.svg`，其大小由 `width` 和 `height` 或 `viewBox` 決定（[SVG 圖片](../docs/images-and-assets.md#svg-images)）。 |
| URL | `"https://example.com/a.jpg"` | 會下載並快取。相同 URL 的下載會在各檢視之間共用。 |
| 資源路徑 | `"asset:/images/a.png"` | 應用程式資源中的檔案。 |
| `data:` URI | `"data:image/png;base64,iVBOR…"` | URI 內的位元組，以 base64 或百分比編碼（`data:image/svg+xml,%3Csvg…`）。 |
| `blob:` URL | `URL.createObjectURL(blob)` | `Blob` 或 `File`（TSX）的位元組。圖片會保留這些位元組：撤銷該 URL 後，圖片仍會完整顯示。 |

如果圖片的位元組已在應用程式手上，就不會發出請求，直接顯示。例如聊天應用程式在上載期間，會用所選相片的 blob 顯示該相片，上載完成後再將 `src` 切換為相片的 URL：

```rust tabs
// Bytes in a `data:` URI (an image the app made or received inline).
image(format!("data:image/png;base64,{encoded}")).size(px(64.0))
```

```tsx tabs
import { Image, signal } from "nsh";

const preview = URL.createObjectURL(photo); // the picked `File`
const src = signal(preview);
upload(photo).then((url) => {
  src.set(url);
  URL.revokeObjectURL(preview);
});

<Image src={src()} style={{ width: 240, height: 180 }} />;
```

相同的位元組只算作一張圖片：同一幅圖片無論以 `data:` URI 還是 blob 提供，都只會解碼一次，並共用快取。

開發期間，資源由開發伺服器提供；`nsh build` 和 `nsh package` 會將資源複製到應用程式中（Rust crate 則以 `registry.assets(assets!())` 附帶其 `assets/` 目錄）。詳情請參閱[圖片與資源](../docs/images-and-assets.md)。

> [!NOTE]
> 當應用程式宣告了 [capabilities](../docs/sandbox-and-capabilities.md) 時，遠端圖片只會從其列出的主機載入；來自其他主機的圖片不會被請求，並會以 `onError` 失敗，其 `code` 為 `"ERR_ACCESS_DENIED"`。`asset:` URI、`data:` URI 和 `blob:` URL 一律會載入。

<a id="props"></a>

## 屬性

除了[通用屬性](./index.md#common-props)（其中 `style` 的類型為 `ImageStyle`）之外：

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | 圖片。 |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | 在 `src` 載入完成前顯示；最好使用本機資源。 |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | 以此半徑（單位為點）模糊圖片（解碼時在主執行緒以外套用一次）。 |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`，Android `300` | 載入完成的圖片淡入所需時間，單位為毫秒。 |
| `tintColor`（樣式） | `.tint_color(..)` | `ColorValue` | | 為範本圖片（以單一顏色繪製的圖示）重新著色。 |
| `objectFit`（樣式） | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | 圖片如何適應其方框，與 CSS 的 `object-fit` 相同（`object-*` 類別）：`"cover"` 填滿方框並裁切，`"contain"` 完整放入方框內，`"fill"` 拉伸，`"none"` 以原始大小顯示，`"scale-down"` 同樣如此，但圖片較大時會縮小以適應。 |
| `objectPosition`（樣式） | `.object_position(..)`、`.object_top()`、... | `string` | `"center"` | 在 `objectFit` 決定大小後，圖片在方框內的位置，與 CSS 的 `object-position` 相同（`"top"`、`"25% 75%"`、`"right 10px bottom 20%"`）；覆蓋方框的圖片會圍繞此位置裁切。 |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | 開始載入。 |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | 下載進度（以位元組計），最多每 100 毫秒一次（大小未知時 `total` 為 0）。 |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | 載入完成；來源圖片的大小（以像素計，不是解碼並縮小取樣後的大小；SVG 的大小以點計，[在網頁上則由瀏覽器量度](../docs/images-and-assets.md#svg-images)）；如果圖片有多個版本，則為所載入版本的大小。 |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | 載入失敗；如果 URL 未獲應用程式的 capabilities 授權，`code` 為 `"ERR_ACCESS_DENIED"`。 |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | 在 `onLoad` 或 `onError` 之後。 |

`ImageStyle` 會在檢視樣式中加入 `tintColor`（為範本圖片重新著色，即以單一顏色繪製的圖示），以及 `objectPosition`（決定圖片在方框內的位置，見[圖片位置](../docs/images-and-assets.md#image-position)）。

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 觸發時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | 無 | 開始載入。 |
| `onProgress` | `.on_progress` | `{ loaded, total }`（`ImageProgress`） | 收到位元組（最多每 100 毫秒一次）。 |
| `onLoad` | `.on_load` | `{ size }`（`Size<DevicePixels>`） | 圖片已顯示；其來源大小（以像素計，SVG 以點計，[在網頁上則由瀏覽器量度](../docs/images-and-assets.md#svg-images)）。 |
| `onError` | `.on_error` | `{ message, code? }`（`&str`，即訊息） | 載入或解碼失敗，或主機不在應用程式的 capabilities 範圍內（`code` `"ERR_ACCESS_DENIED"`）。 |
| `onLoadEnd` | `.on_load_end` | 無 | 在 `onLoad` 或 `onError` 之後。 |

```rust tabs
let state = signal(SharedString::from("loading"));

image(url)
    .w_full()
    .aspect_ratio(16.0 / 9.0)
    .on_load(move |size: &Size<DevicePixels>| state.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| state.set(message.to_string().into()))
```

```tsx tabs
const state = signal("loading");
<Image
  src={url}
  style={{ width: "100%", aspectRatio: 16 / 9 }}
  onLoad={({ size }) => state.set(`${size.width}×${size.height} px`)}
  onError={(e) => state.set(e.message)}
/>;
```

具有[像素密度版本](../docs/images-and-assets.md#pixel-densities)的圖片會載入其中一個檔案，`onLoad` 回報的是該檔案的像素大小：在 3× 螢幕上，對 64×64 點的 `logo.png` 而言，`logo@3x.png` 為 192×192。當像素比例改變而圖片載入另一個版本時，也會回報該次載入：`onLoadStart`，然後是帶有新檔案大小的 `onLoad`（或 `onError`），最後是 `onLoadEnd`。

如果想在顯示圖片之前得知其大小或預先載入，TSX 可呼叫 `Image.getSize(src)` 和 `Image.prefetch(src)`（渲染該元素的同一個 `Image` 也提供這些方法；請參閱 [Image API](../modules/nsh-image.md)），Rust 則使用 `image_size(src)` 和 `prefetch_image(src)`，並在任務中 await。如果傳入已匯入且有多個版本的圖片，`Image.getSize` 和 `Image.prefetch` 會載入此螢幕所顯示的版本，而 `getSize` 會以所匯入檔案的大小解析（`logo.png` 為 64×64）。

<a id="ref-methods"></a>

## Ref 方法

沒有專屬的方法。

<a id="platform-notes"></a>

## 平台備註

- 快取鍵包含解碼大小和模糊半徑：同一個 URL 以兩種大小顯示時，會解碼兩次，但只下載一次。
- iOS 以關鍵影格動畫播放動態圖片（最多 600 格）；套用了色調的動態圖片只會顯示第一格。
- Android 由 API 28 起播放動態圖片（`AnimatedImageDrawable`），不會快取，也不會模糊。
- 在 Android 上，邊框繪製在圖片之上，與 iOS 相同。
