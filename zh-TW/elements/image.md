---
title: "Image"
description: "用於顯示內建或遠端圖片的元件，支援預留位置、模糊、淡入淡出、著色以及載入事件。"
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` 可顯示來自 App 資產或 URL 的圖片。圖片會在主執行緒之外下載與解碼，縮小取樣至檢視實際顯示的大小，並快取在記憶體中。支援播放動態 GIF、WebP 與 APNG。Rust 使用 `image(src)` 建立，TSX 則使用來自 `nsh` 的 `<Image>`。

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

資產本身已知尺寸：未指定寬度或高度時，圖片會採用資產的尺寸；只指定其中一項時，另一項會依資產的長寬比自動決定。URL 的尺寸要等到載入後才會得知，因此遠端圖片請同時指定寬度與高度（或指定長寬比與其中一項）。

<a id="sources"></a>

## 來源

來源（`src` 與 `placeholder`；Rust 中為 `image(..)` 與 `.placeholder(..)`）可接受：

| 值 | 範例 | 說明 |
|---|---|---|
| 資產 | Rust `asset!("logo.png")`，TSX `import logo from "./logo.png"` | 一個 `ImageAsset` `{ url, size, scales? }`，以點（point）為單位計算大小：`@2x` 檔案的尺寸為其像素的一半。若在 `logo.png` 旁有 `logo@2x.png` / `logo@3x.png`，則會載入對應螢幕像素比例的版本（[像素密度](../docs/images-and-assets.md#pixel-densities)）。可匯入 `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp` 與 `.heic`，也可匯入 `.svg`，其大小由 `width` 與 `height` 或 `viewBox` 決定（[SVG 圖片](../docs/images-and-assets.md#svg-images)）。 |
| URL | `"https://example.com/a.jpg"` | 下載並快取。相同 URL 的下載會在各檢視之間共用。 |
| 資產路徑 | `"asset:/images/a.png"` | App 資產中的檔案。 |
| `data:` URI | `"data:image/png;base64,iVBOR…"` | URI 中的位元組，以 base64 或百分比編碼（`data:image/svg+xml,%3Csvg…`）。 |
| `blob:` URL | `URL.createObjectURL(blob)` | `Blob` 或 `File`（TSX）的位元組。圖片會保留這些位元組：即使撤銷該 URL，圖片仍會完整顯示。 |

App 已持有的位元組可直接顯示圖片，無需發出請求。聊天室在上傳時會先以 blob 顯示使用者挑選的照片，上傳完成後再將 `src` 切換為該照片的 URL：

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

相同的位元組視為同一張圖片：同一張圖片無論以 `data:` URI 或 blob 提供，都只會解碼一次並共用快取。

開發期間，資產由開發伺服器提供；`nsh build` 與 `nsh package` 會將資產複製到 App 中（Rust crate 則以 `registry.assets(assets!())` 隨附其 `assets/` 目錄）。請參閱[圖片與資產](../docs/images-and-assets.md)。

> [!NOTE]
> 當 App 宣告了[權限](../docs/sandbox-and-capabilities.md)時，遠端圖片僅會從其列出的主機載入；來自其他主機的圖片不會被請求，並會以 `onError` 失敗，其 `code` 為 `"ERR_ACCESS_DENIED"`。`asset:` URI、`data:` URI 與 `blob:` URL 一律可載入。

<a id="props"></a>

## 屬性

除了[通用屬性](./index.md#common-props)之外（其中 `style` 的型別為 `ImageStyle`）：

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | 圖片。 |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | 在 `src` 載入完成前顯示；最好使用本機資產。 |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | 以此半徑（單位為點）模糊圖片（在解碼時於主執行緒之外套用一次）。 |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`，Android `300` | 載入完成的圖片淡入所需的時間，單位為毫秒。 |
| `tintColor`（樣式） | `.tint_color(..)` | `ColorValue` | | 為範本圖片（以單一顏色繪製的圖示）重新著色。 |
| `objectFit`（樣式） | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | 圖片如何符合其方框，與 CSS 的 `object-fit` 相同（`object-*` 類別）：`"cover"` 填滿並裁切，`"contain"` 完整容納於其中，`"fill"` 拉伸，`"none"` 以原始尺寸顯示，`"scale-down"` 同上，但若圖片較大則縮小至符合。 |
| `objectPosition`（樣式） | `.object_position(..)`、`.object_top()`、... | `string` | `"center"` | 在 `objectFit` 決定尺寸後，圖片在其方框中的位置，與 CSS 的 `object-position` 相同（`"top"`、`"25% 75%"`、`"right 10px bottom 20%"`）；填滿方框的圖片會圍繞此位置裁切。 |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | 開始載入。 |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | 以位元組表示的下載進度（未知時 `total` 為 0），最多每 100 毫秒回報一次。 |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | 載入完成；為來源圖片以像素表示的尺寸（不是解碼後縮小取樣的尺寸；SVG 則為以點表示的尺寸，[在 Web 上以瀏覽器量測的結果為準](../docs/images-and-assets.md#svg-images)）；若圖片有多個變體，則為所載入變體的尺寸。 |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | 載入失敗；對於 App 權限未授權的 URL，`code` 為 `"ERR_ACCESS_DENIED"`。 |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | 在 `onLoad` 或 `onError` 之後。 |

`ImageStyle` 會在檢視樣式中加入 `tintColor`（為範本圖片重新著色，即以單一顏色繪製的圖示）以及 `objectPosition`（決定圖片在其方框中的位置；參閱[圖片位置](../docs/images-and-assets.md#image-position)）。

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | 無 | 開始載入。 |
| `onProgress` | `.on_progress` | `{ loaded, total }`（`ImageProgress`） | 收到位元組（最多每 100 毫秒一次）。 |
| `onLoad` | `.on_load` | `{ size }`（`Size<DevicePixels>`） | 圖片已顯示；為其來源以像素表示的尺寸（SVG 則以點表示，[在 Web 上以瀏覽器量測的結果為準](../docs/images-and-assets.md#svg-images)）。 |
| `onError` | `.on_error` | `{ message, code? }`（`&str`，即訊息） | 載入或解碼失敗，或主機不在 App 的權限範圍內（`code` `"ERR_ACCESS_DENIED"`）。 |
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

具有[像素密度變體](../docs/images-and-assets.md#pixel-densities)的圖片會載入其中一個檔案，而 `onLoad` 回報的是該檔案的像素：在 3× 螢幕上，`logo@3x.png` 為 192×192，對應 64×64 點的 `logo.png`。當像素比例改變而圖片載入另一個變體時，同樣會回報該次載入：先是 `onLoadStart`，接著是帶有新檔案尺寸的 `onLoad`（或 `onError`），最後是 `onLoadEnd`。

若要在顯示圖片之前取得其尺寸或預先載入，TSX 可呼叫 `Image.getSize(src)` 與 `Image.prefetch(src)`（渲染該元素的同一個 `Image` 也提供這些方法；請參閱 [Image API](../modules/nsh-image.md)），Rust 則使用 `image_size(src)` 與 `prefetch_image(src)`，並在任務中以 await 等待。對於具有變體的匯入圖片，`Image.getSize` 與 `Image.prefetch` 會載入此螢幕所顯示的變體，而 `getSize` 會以匯入檔案的尺寸解析（`logo.png` 為 64×64）。

<a id="ref-methods"></a>

## Ref 方法

無自有方法。

<a id="platform-notes"></a>

## 平台注意事項

- 快取鍵包含解碼尺寸與模糊半徑：同一個 URL 以兩種尺寸顯示時，會解碼兩次，但只下載一次。
- iOS 以關鍵影格動畫播放動態圖片（最多 600 個影格）；套用色調的動態圖片只會顯示第一個影格。
- Android 自 API 28（`AnimatedImageDrawable`）起播放動態圖片，且不快取、不模糊。
- 在 Android 上，邊框繪製於圖片之上，與 iOS 相同。
