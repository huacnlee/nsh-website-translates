---
title: "圖片與資源"
description: "在 Rust 和 TSX 中顯示圖片：應用程式的資源與 @2x 檔案、SVG 圖片、遠端 URL、縮放模式、佔位圖、模糊效果、著色、載入事件，以及讀取圖片尺寸或預先載入圖片。"
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---


# 圖片與資源

image 元素（Rust 中為 `image(..)`，TSX 中為 `<Image>`）會顯示點陣圖或 SVG 圖像：可以是隨應用程式一併發佈的檔案，也可以是從 URL 下載的圖片。圖片會在主執行緒以外讀取和解碼，按檢視顯示的大小縮減取樣並快取；主執行緒只負責顯示解碼後的結果。

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

元素的 props 列於 [image](../elements/image.md)。

<a id="images-in-the-app"></a>

## 應用程式內的圖片

Rust crate 將檔案存放在其 `assets/` 目錄：`asset!("logo@2x.png")`（相對於 `assets/` 的路徑）是一個 `ImageAsset`、`{ url, size, scales }`，於 crate 編譯時讀取，而 crate 的 `#[native_module]` 函式中的 `registry.assets(assets!())` 會將該目錄的所有檔案隨應用程式一併發佈。在 TSX 中，像匯入模組一樣匯入圖片檔案：匯入會得到一個 `ImageAsset`、`{ url, size, scales? }`，而 bundler 會將該檔案隨應用程式一併發佈：

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

支援的檔案：`.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic` 及 `.svg`（[SVG 圖像](#svg-images)）。

**尺寸以點（point）為單位。** 檔案名稱中的 `@2x` 或 `@3x` 後綴表示該檔案每點有 2 或 3 個像素，因此 128×128 像素的 `logo@2x.png` 是 64×64 點的資源。沒有後綴時，一個像素即一點。名稱帶後綴的檔案就是實際顯示的檔案；名稱不帶後綴的檔案，若有[像素密度變體](#pixel-densities)，則會顯示相應的變體。

**自然尺寸。** 來自資源的圖片，若樣式沒有指定寬度或高度，會以其自然尺寸排版，所以 `image(LOGO)` 和 `<Image src={logo} />` 不需要任何樣式。如要改變尺寸，可設定其中一個維度加上長寬比，或同時設定兩個維度。

在 Rust 中，檔案遺失或損毀會令建置失敗，而檔案有更改則會重新建置 crate。在 TSX 中，資源相對於匯入它的模組解析，其 `url` 則相對於應用程式的根目錄（入口所在的目錄）。`nsh build` 會將它們複製到 `out/assets/`，`nsh package` 會將它們放進應用程式，而在開發期間，開發伺服器會提供這些檔案。

> [!TIP]
> 在 TSX 中，`src` 亦接受 `asset:/path` 字串，而只有匯入的檔案才保證會一併發佈。從未匯入的路徑在開發伺服器下可以正常運作，因為它會提供整個應用程式目錄，但在打包後的應用程式中會找不到。請匯入你用到的每一張圖片。Rust crate 則會透過 `assets!()` 發佈其整個 `assets/` 目錄。

<a id="pixel-densities"></a>

### 像素密度

檔案名稱不帶後綴，並將其較高密度的版本放在旁邊，應用程式便會載入適合該螢幕的版本：

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- `asset!` 和 bundler 會為名稱不帶後綴的圖片尋找 `@1.5x`、`@2x`、`@3x` 和 `@4x` 同級檔案。`scales` 會列出這些檔案，其中 1 代表指定名稱的檔案；沒有同級檔案的圖片則沒有縮放比例（在 TSX 中匯入為 `{ url, size }`）。bundler 會發佈它找到的同級檔案，而 `assets!()` 則會發佈整個目錄。
- 圖片會載入不小於螢幕像素比的最小縮放比例，若沒有則載入最大的，與 React Native 的選擇方式相同：1× 螢幕載入 `logo.png`，2× 螢幕載入 `logo@2x.png`，3× 手機（以及 2.625）載入 `logo@3x.png`。在網頁上只會下載該檔案。
- 當像素比改變時（視窗移到另一個螢幕、瀏覽器縮放），選擇因而改變的圖片會重新載入，並觸發其[載入事件](#load-events)。它們的尺寸仍然是指定名稱檔案的尺寸，以點為單位。
- 若變體的像素不等於指定名稱檔案的尺寸乘以其縮放比例，在 TSX 中會產生建置警告，在 Rust 中則會令建置失敗。
- 帶有密度後綴的檔案（`./logo@3x.png`、`asset!("logo@3x.png")`）只代表該檔案本身。
- [SVG 圖像](#svg-images)會按任何比例為螢幕繪製，因此不需要發佈變體。

只用一個檔案也可以：以你需要的最高密度匯出（`@3x` 可在每部手機上取得最清晰的效果），並以其後綴命名；圖片在解碼時會按螢幕縮減取樣。變體則讓每個螢幕下載、解碼和保留適合自己的檔案。

<a id="svg-images"></a>

## SVG 圖像

像匯入任何圖片一樣匯入 `.svg` 檔案。其以點為單位的尺寸取自 `width` 和 `height`（或只取其中一個，另一個按 `viewBox` 的長寬比推算），否則取自其 `viewBox`：SVG 的一個 CSS 像素即一點，而 `@2x` 後綴不會改變 SVG 檔案。

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

SVG 在顯示的尺寸下都很清晰。瀏覽器以向量繪製；iOS、macOS 和 Android 在圖片載入時，按檢視顯示的像素尺寸繪製（如同它們對點陣圖縮減取樣；之後才放大的檢視會縮放該次繪製的結果，直至圖片再次載入）；Windows、Linux 和 GPUI 則以每點四個像素（每邊最多 2048 像素）繪製一次，再按每個檢視縮放。其他方面與點陣圖相同：`objectFit`、`tintColor`（透過 SVG 的不透明形狀，因此單色圖示會跟隨主題）、濾鏡、`blurRadius`、佔位圖、載入事件、`Image.getSize` 和 `Image.prefetch`。`onLoad` 和 `Image.getSize` 以整數點回報 SVG 的尺寸；圖片會以其精確尺寸排版。遠端 SVG 檔案以同樣方式載入，經過相同的下載和[能力](./sandbox-and-capabilities.md)檢查；NSH 按內容辨識 SVG（也包括以 gzip 壓縮的，`.svgz`），不論其 URL 以甚麼結尾。

**原生平台會繪製的內容。** iOS、macOS、Android、Windows、Linux 和 GPUI 以同一個渲染器（resvg）繪製 SVG，因此圖像在各平台上看起來一致：形狀和路徑、填色和描邊、漸變和圖樣、剪裁路徑和遮罩、不透明度、濾鏡和變形。文字（`<text>`）、動畫（SMIL 和 CSS）、內嵌圖片（`<image>`）和 HTML（`<foreignObject>`）會在瀏覽器中顯示；原生平台則以靜態方式繪製 SVG 的其餘部分，而 `nsh build` 會列出使用這些功能的檔案。將文字匯出為輪廓（路徑），即可在所有平台得到相同的結果。

**自足的圖像。** 在原生平台上，SVG 只會繪製它本身包含的內容：它所引用的檔案、URL、`data:` 圖片和其他文件都會被略去。原生平台繪製 SVG（包括遠端的）時，會受限於一些控制記憶體用量的上限：文件最大 16 MiB（壓縮的文件以解壓後計算），繪製結果每邊最多 8192 像素、總共最多 4096 × 4096 像素（64 MiB；更大的會以較小尺寸繪製），而圖層（帶有不透明度、遮罩、剪裁路徑和濾鏡的群組，渲染器會把它們分開繪製）同時最多 256 MiB。SVG 超出文件或圖層上限時會載入失敗，並傳回 `onError`。

**網頁上回報的尺寸。** 瀏覽器會自行量度 SVG，不論是匯入的還是遠端的：SVG 有 `width` 和 `height` 時，`onLoad` 和 `Image.getSize` 會回報這兩個值，否則回報瀏覽器給予的尺寸，瀏覽器通常由預設的 300 × 150 和 `viewBox` 的長寬比推算而來。匯入的 SVG 在所有平台上都以 bundler 提供的尺寸排版。為 SVG 設定 `width` 和 `height`，即可在各處得到相同的回報尺寸。

<a id="remote-images"></a>

## 遠端圖片

為元素提供 URL：在 Rust 中是字串（會變動的則用閉包），在 TSX 中是 URL 字串：

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **為遠端圖片指定尺寸。** 圖片載入前其尺寸是未知的，因此若沒有寬度和高度（或其中一個加上長寬比），它們的高度會收縮為零。
- **背景顏色**會在圖片載入期間顯示，也可以使用佔位圖（見下文）。
- 下載會共用：多個顯示同一 URL 的檢視只會下載一次，即使它們以不同尺寸解碼也一樣。不再有人等待的下載會被取消。
- 解碼後的圖片會快取在記憶體中（記憶體不足時快取會被清除），以 URL、解碼尺寸和模糊半徑作為鍵。
- 當應用程式宣告了[能力](./sandbox-and-capabilities.md)時，圖片的主機必須在 `network` 下獲得允許；被拒絕的圖片會以其 error 事件失敗。

<a id="kept-on-disk"></a>

### 保存在磁碟上

下載的圖片也會按伺服器傳送的原樣保存在磁碟上，因此重新開啟的應用程式（滿是頭像和相片的對話、動態消息）無需下載，即可顯示之前顯示過的圖片，離線時亦然。應用程式無需任何設定：在 iOS、Android、macOS、Windows、Linux 和 GPUI 上，每個 `http://` 或 `https://` URL 的圖片都會經過該快取；在瀏覽器中，則由瀏覽器自身的 HTTP 快取達到相同效果。

快取遵循伺服器的 HTTP 快取標頭：

- 除非回應指明 `Cache-Control: no-store`，否則圖片會被保存。
- 在新鮮期內無需發出請求即可使用：新鮮期為 `max-age` 所指的時間，否則直至 `Expires`，再否則為自 `Last-Modified` 起計時間的十分之一（最多一星期）。
- 之後會向伺服器查證（`If-None-Match` 連同其 `ETag`，`If-Modified-Since` 連同其 `Last-Modified`）：未變更的圖片（`304`）會再次使用而無需下載，已變更的則會取代舊的。
- 當請求失敗（沒有網絡）或伺服器出錯（`5xx`）時，會顯示所保存的副本，除非回應指明 `must-revalidate` 或 `no-cache`。

每個應用程式有自己 256 MiB 的快取；超出時，最久未使用的圖片會最先被移除。同一應用程式的多個檢視、surface 和程序可以安全地共用它。嵌入式應用程式可以選擇快取的位置和大小，或將其關閉：

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

`CacheLocation::Off`（`.off`、`noDiskCache()`）不會在磁碟上保存任何內容。

預設情況下，快取位於系統的快取目錄：iOS 上是 `Library/Caches/nsh`，Android 上是快取目錄中的 `nsh`，macOS 上是 `~/Library/Caches`，Windows 上是 `%LOCALAPPDATA%`，Linux 上是 `$XDG_CACHE_HOME`（`~/.cache`），每個應用程式在該處都有自己的 `<app id>/images`。系統需要空間時可能會清除這些目錄。

<a id="resize-modes"></a>

## 縮放模式

`objectFit` 樣式，即 CSS 的 `object-fit`（Rust 中為 `.object_fit(..)`），決定圖片如何填滿形狀不同的方框：

| 值 | 結果 |
|---|---|
| `"cover"`（`ResizeMode::Cover`，預設） | 填滿方框，保持長寬比，裁去溢出的部分 |
| `"contain"`（`ResizeMode::Contain`） | 放入方框內，保持長寬比，留下空白帶 |
| `"fill"`（`ResizeMode::Stretch`） | 準確填滿方框，圖片會變形 |
| `"none"`（`ResizeMode::Center`） | 自然尺寸，置於 `objectPosition`（預設置中） |
| `"scale-down"`（`ResizeMode::ScaleDown`） | 自然尺寸，較大時縮小至適合方框 |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Tailwind 類別 `object-cover`、`object-contain`、`object-fill`、`object-none` 和 `object-scale-down` 設定相同的樣式。

<a id="image-position"></a>

### 圖片位置

已定好尺寸的圖片在方框內的位置由 `objectPosition` 樣式決定（Rust 中為 `.object_position(..)` 和 `.object_top()` 等），即 CSS 的 `object-position`：預設為中央。填滿式（cover）的圖片會圍繞該位置裁剪，包含式（contain）的圖片則在空白帶內移動。它接受關鍵字（`"top"`、`"left bottom"`）、百分比和長度（`"25% 75%"`、`"10px 0"`），以及帶偏移量的邊緣（`"right 10px bottom 20%"`）。聊天氣泡中的直幅相片可以這樣顯示其頂部：

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Tailwind 類別與 Tailwind 的相同：`object-top`、`object-bottom`、`object-left`、`object-right`、`object-center`、`object-top-left`、`object-top-right`、`object-bottom-left`、`object-bottom-right` 和任意值（`object-[25%_75%]`）。

<a id="styling-images"></a>

## 為圖片設定樣式

圖片就是檢視：它們支援圓角（也可逐個角設定）、邊框、陰影、不透明度和變形。圓角會裁剪圖片。

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **著色**（Rust 中為 `.tint_color(..)`，TSX 中為 `tintColor` 樣式）會為圖片的不透明像素重新上色：適用於跟隨主題的單色圖示。
- **濾鏡**（`.grayscale(..)`、`.sepia(..)`、`.blur(..)`；TSX 中為 `filter`）在兩個平台上都適用於圖片（[濾鏡](./styling.md#filters-and-blending)）。

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## 佔位圖、淡入和模糊

| Prop | Rust | 說明 |
|---|---|---|
| `placeholder` | `.placeholder(..)` | 在 `src` 載入完成前顯示的圖片，可以是 URL 或資源；最好是本機資源 |
| `fadeDuration` | `.fade_duration(ms)` | 載入完成的圖片淡入所需的毫秒數。iOS 上預設為 0，Android 上為 300 |
| `blurRadius` | `.blur_radius(px(..))` | 以此半徑（以點為單位）模糊圖片，解碼時套用一次 |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## 動畫圖片

動畫 GIF、WebP 和 APNG 檔案會自動播放，不論來自資源還是 URL。它們支援相同的樣式，包括 `objectFit`；在 iOS 上，已著色的動畫圖片只會顯示第一格。

<a id="load-events"></a>

## 載入事件

| 事件 | Rust | Payload | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | 開始載入 |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` 以位元組計（未知時 `total` 為 0） | 下載期間，最多每 100 毫秒一次 |
| `onLoad` | `.on_load(..)` | `{ size }` | 圖片已準備就緒；來源的像素尺寸（SVG 的以點計，[在網頁上按瀏覽器的量度](#svg-images)） |
| `onError` | `.on_error(..)` | `{ message }`（Rust 中為 `&str`） | 載入或解碼失敗 |
| `onLoadEnd` | `.on_load_end(..)` | | 在 `onLoad` 或 `onError` 之後 |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

load 事件回報的是來源圖片的尺寸，而不是解碼時所用的尺寸。

具有[像素密度變體](#pixel-densities)的圖片會載入其中一個檔案，而 load 事件回報的是該檔案的像素：在 3× 螢幕上，`logo@3x.png` 回報 192×192，而 `Image.getSize(logo)` 則解析為匯入檔案的 64×64。當像素比改變而圖片載入另一個變體時，該次載入也會回報其事件：先是 `onLoadStart`，然後是帶有新檔案尺寸的 `onLoad`（或 `onError`），最後是 `onLoadEnd`。
<a id="an-images-size-and-prefetching"></a>

## 圖片的尺寸與預取

不在畫面上的圖片可以預先量度尺寸及載入：Rust 中使用 `image_size(..)` 和 `prefetch_image(..)`，TSX 中使用 `Image.getSize` 和 `Image.prefetch`（在渲染該元素的同一個 `Image` 上）：

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | 回傳 |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | 圖片的尺寸，單位為像素（SVG 的尺寸以點為單位，[在網頁上則以瀏覽器的量度為準](#svg-images)）；無法載入時回傳錯誤 |
| `prefetch_image(src)` | `Image.prefetch(src)` | 圖片的位元組載入完成後不回傳任何內容；無法載入時回傳錯誤 |

在 TSX 中，`src` 可以是 URL 字串或已匯入的圖片。對於設有[變體](#pixel-densities)的已匯入圖片，兩者都會載入視圖在此畫面上所載入的變體，而 `getSize` 給出的是已匯入檔案的尺寸。兩者都會保留已下載的位元組，供之後顯示該圖片的視圖使用，因此在顯示前已預取的圖片出現時無需再下載。

常見的用法是按長寬比決定遠端圖片的大小：

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## 其他資源

| 檔案 | Rust（`asset!`） | TSX 匯入 | 頁面 |
|---|---|---|---|
| `.ttf`、`.otf`、`.woff`、`.woff2` | 帶有字型家族名稱的 `FontAsset` | 字型的家族名稱 | [字型](./fonts.md) |
| `.json` 及其他檔案 | 帶有其 URI 的 `FileAsset` | `.json`：解析後的值，已打包進指令碼 | [專案結構](./project-structure.md#modules) |

兩者的字型都會在第一個影格之前完成註冊。

<a id="reading-a-file-at-run-time"></a>

### 於執行時讀取檔案

`fetch` 透過 `asset:/` URL 讀取應用程式隨附的檔案，無論在 TSX 還是 Rust 中，在所有平台上皆然。已匯入的圖片本身帶有其 URL（`url`），Rust crate 的檔案則可透過 `asset!`（`FileAsset::uri`）和 `assets!()` 取得其 URL：

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

引擎會在其執行緒以外讀取應用程式檔案中的該檔案（在 `nsh run` 期間則從開發伺服器讀取），無需任何權限：這些都是應用程式自己的檔案。網頁應用程式會從其提供資源之處下載頁面尚未預載的內容。回應為 `200`，包含檔案的位元組、其 `Content-Length` 及按副檔名得出的 `Content-Type`（`image/png`、`application/json` 等），而且無論檔案以何種方式取得，其 `url` 皆為 `asset:/` URL；應用程式並未隨附的檔案會以指明該檔案的網絡錯誤拒絕。URL 以檔案在應用程式檔案內的路徑來指明該檔案，請求則以 `GET`（或 `HEAD`）讀取：路徑離開這些檔案的 URL（`..`、絕對路徑）以及使用其他方法的請求，都會以同樣方式拒絕，且在讀取或下載任何內容之前就會拒絕。

<a id="a-modules-own-url"></a>

### 模組本身的 URL

在 TSX 中，`import.meta.url` 是其所在模組的 URL，因此 `new URL("./data.json", import.meta.url)` 會指明與它相鄰的檔案。本機或已打包的桌面應用程式，其模組擁有位於應用程式目錄中的 `file:` URL，`fs/promises` 在 `${pluginDir}` 授權下讀取這些 URL；網頁應用程式的模組 URL 則屬於該頁面；已打包的流動應用程式的模組則是 `asset:/` URL，與已匯入圖片的 URL 相似。要隨附圖片，請匯入該圖片：以此方式建立的 URL 只是指明該檔案，並不會將它打包。

點陣圖也可以透過 `draw_image` / `drawImage` 繪製在畫布上（[Canvas](./canvas.md)），而漸變可以取代許多裝飾性圖片（[樣式](./styling.md#gradients)）。

<a id="related"></a>

## 相關內容

- [image 元素](../elements/image.md)：所有 prop，包括 `getSize` 和 `prefetch`。
- [清單](./lists.md)：包含大量圖片的長清單會回收其視圖。
