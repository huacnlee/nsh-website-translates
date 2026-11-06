---
title: "圖片與資源"
description: "在 Rust 和 TSX 中顯示圖片 - 應用程式的資源與 @2x 檔案、SVG 圖片、遠端 URL、縮放模式、佔位圖、模糊、著色、載入事件,以及讀取圖片尺寸或預先載入圖片。"
order: 36
group: ui
---

# 圖片與資源

圖片元素（Rust 中為 `image(..)`，TSX 中為 `<Image>`）可顯示點陣圖或 SVG 向量圖：可以是隨應用程式一併發佈的檔案，也可以是從 URL 下載的圖片。圖片會在主執行緒之外讀取與解碼，並降採樣至檢視所顯示的尺寸後快取；主執行緒只負責顯示解碼後的結果。

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

Rust crate 會將檔案放在其 `assets/` 目錄中：`asset!("logo@2x.png")`（相對於 `assets/` 的路徑）是一個 `ImageAsset`、`{ url, size, scales }`，於 crate 編譯時讀取，而 crate 的 `#[native_module]` 函式中的 `registry.assets(assets!())` 會將該目錄的每個檔案隨應用程式一併發佈。在 TSX 中，像匯入模組一樣匯入圖片檔案：匯入會得到一個 `ImageAsset`、`{ url, size, scales? }`，並由 bundler 將檔案隨應用程式一併發佈：

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

支援的檔案：`.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic` 與 `.svg`（[SVG 圖片](#svg-images)）。

**尺寸以點（point）為單位。** 檔名中的 `@2x` 或 `@3x` 後綴表示該檔案每點有 2 或 3 個像素，因此 128×128 像素的 `logo@2x.png` 是一個 64×64 點的資源。沒有後綴時，一個像素即為一點。帶有後綴的檔名只會顯示該檔案；不帶後綴的檔名在有[像素密度變體](#pixel-densities)時，則會顯示其變體。

**自然尺寸。** 當樣式未指定寬度或高度時，來自資源的圖片會以其自然尺寸進行版面配置，因此 `image(LOGO)` 與 `<Image src={logo} />` 不需要樣式。若要以不同尺寸顯示，可設定單一維度加上長寬比，或同時設定兩個維度。

在 Rust 中，檔案遺失或損毀會使建置失敗，而檔案變更會使 crate 重新建置。在 TSX 中，資源會相對於匯入它的模組解析，其 `url` 則相對於應用程式根目錄（進入點所在的目錄）。`nsh build` 會將它們複製到 `out/assets/`，`nsh package` 會將它們放入應用程式中，而在開發期間則由開發伺服器提供。

> [!TIP]
> 在 TSX 中，`src` 也接受 `asset:/path` 字串，但只有被匯入的檔案才保證會被發佈。從未被匯入的路徑在開發伺服器上可以運作（開發伺服器會提供整個應用程式目錄），但在打包後的應用程式中會遺失。請匯入你使用的每一張圖片。Rust crate 則會透過 `assets!()` 發佈其整個 `assets/` 目錄。

<a id="pixel-densities"></a>

### 像素密度

檔案名稱不加後綴，並將較高密度的版本放在它旁邊，應用程式就會載入符合螢幕的版本：

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

- `asset!` 與 bundler 會為未帶後綴命名的圖片尋找 `@1.5x`、`@2x`、`@3x` 與 `@4x` 同層檔案。`scales` 會列出這些檔案，其中 1 代表原名檔案；沒有同層檔案的圖片沒有縮放倍率（在 TSX 中匯入為 `{ url, size }`）。bundler 會發佈它找到的同層檔案，而 `assets!()` 會發佈整個目錄。
- 圖片會載入不小於螢幕像素比的最小倍率，若無則載入最大的倍率，與 React Native 的選擇方式相同：1× 螢幕載入 `logo.png`，2× 螢幕載入 `logo@2x.png`，3× 手機（以及 2.625）載入 `logo@3x.png`。在網頁上只會下載該檔案。
- 當像素比改變時（視窗移到另一個螢幕、瀏覽器縮放），選擇結果改變的圖片會重新載入，並觸發其[載入事件](#load-events)。它們的尺寸仍維持原名檔案的尺寸（以點為單位）。
- 若變體的像素數不等於原名檔案尺寸乘以其倍率，在 TSX 中會產生建置警告，在 Rust 中則會使建置失敗。
- 以密度後綴命名的檔案（`./logo@3x.png`、`asset!("logo@3x.png")`）僅代表該檔案本身。
- [SVG 圖片](#svg-images)會依任何比例為螢幕繪製，因此不需要發佈變體。

只用一個檔案也可以：以你需要的最高密度匯出（`@3x` 可在每支手機上獲得最清晰的結果）並加上其後綴命名；圖片會在解碼時降採樣至螢幕大小。變體則讓每個螢幕只下載、解碼並保留符合自己的檔案。

<a id="svg-images"></a>

## SVG 圖片

像匯入任何圖片一樣匯入 `.svg` 檔案。其以點為單位的尺寸取自 `width` 與 `height`（或其中之一，另一個由 `viewBox` 的長寬比推得），否則取自 `viewBox`：SVG 的一個 CSS 像素即為一點，而 `@2x` 後綴不會改變 SVG 檔案。

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

SVG 在顯示的尺寸下都會保持清晰。瀏覽器以向量方式繪製；iOS、macOS 與 Android 在圖片載入時，依檢視所顯示的尺寸（以像素計）繪製（如同它們對點陣圖進行降採樣；之後放大的檢視會縮放該繪製結果，直到圖片重新載入）；Windows、Linux 與 GPUI 則以每點四個像素繪製一次（每邊最多 2048 像素），再縮放至各個檢視。其餘行為與點陣圖相同：`objectFit`、`tintColor`（透過 SVG 的不透明形狀，因此單色圖示可跟隨主題）、濾鏡、`blurRadius`、佔位圖、載入事件、`Image.getSize` 與 `Image.prefetch`。`onLoad` 與 `Image.getSize` 會以整數點回報 SVG 的尺寸；圖片則以其精確尺寸進行版面配置。遠端 SVG 檔案的載入方式相同，經過相同的下載與[能力（capability）](./sandbox-and-capabilities.md)檢查；NSH 依內容辨識 SVG（也包括以 gzip 壓縮的，`.svgz`），與其 URL 結尾為何無關。

**原生平台能繪製的內容。** iOS、macOS、Android、Windows、Linux 與 GPUI 使用同一個渲染器（resvg）繪製 SVG，因此圖形在各平台上看起來一致：形狀與路徑、填色與描邊、漸層與圖樣、裁切路徑與遮罩、不透明度、濾鏡與變形。文字（`<text>`）、動畫（SMIL 與 CSS）、內嵌圖片（`<image>`）與 HTML（`<foreignObject>`）會在瀏覽器中顯示；原生平台則以靜態方式繪製 SVG 的其餘部分，而 `nsh build` 會指出使用這些功能的檔案。請將文字匯出為外框（路徑），以便在各處得到相同的結果。

**自成一體的圖像。** 在原生平台上，SVG 只會繪製它自身包含的內容：它所參照的檔案、URL、`data:` 圖片與其他文件都會被省略。原生平台繪製 SVG（包括遠端 SVG）時，會受到限制以控制記憶體用量：文件最大 16 MiB（壓縮文件以解壓縮後的大小計算）、繪製結果每邊最多 8192 像素且總計最多 4096 × 4096 像素（64 MiB；較大的會以較小尺寸繪製），而圖層（帶有不透明度、遮罩、裁切路徑與濾鏡的群組，渲染器會將它們分開繪製）同時最多 256 MiB。超過文件或圖層上限的 SVG 會載入失敗，並回報 `onError`。

**網頁上回報的尺寸。** 瀏覽器會自行測量 SVG，無論是匯入的還是遠端的：當 SVG 具有 `width` 與 `height` 時，`onLoad` 與 `Image.getSize` 會回報它們，否則回報瀏覽器給定的尺寸，瀏覽器通常由預設的 300 × 150 與 `viewBox` 的長寬比推得。匯入的 SVG 在每個平台上都以 bundler 提供的尺寸進行版面配置。請為 SVG 設定 `width` 與 `height`，以便在各處得到相同的回報尺寸。

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

- **請為遠端圖片指定尺寸。** 它們的尺寸在載入之前是未知的，因此若沒有寬度與高度（或其中之一加上長寬比），它們的高度會塌縮為零。
- 圖片載入期間會顯示**背景色**，或使用佔位圖（見下文）。
- 下載是共用的：多個顯示相同 URL 的檢視只會下載一次，即使它們以不同尺寸解碼也一樣。不再有人等待的下載會被取消。
- 解碼後的圖片會快取在記憶體中（快取會在記憶體壓力下被清除），以 URL、解碼尺寸與模糊半徑作為索引鍵。
- 當應用程式宣告了[能力](./sandbox-and-capabilities.md)時，圖片的主機必須在 `network` 下被允許；被拒絕的圖片會以其 error 事件失敗。

<a id="kept-on-disk"></a>

### 保存於磁碟

下載的圖片也會依伺服器送出的原樣保存在磁碟上，因此重新開啟的應用程式（滿是頭像與照片的對話、動態消息）無需下載就能顯示先前顯示過的圖片，離線時亦然。應用程式不需要任何設定：在 iOS、Android、macOS、Windows、Linux 與 GPUI 上，每個使用 `http://` 或 `https://` URL 的圖片都會經過此快取；在瀏覽器中，則由瀏覽器自身的 HTTP 快取達到相同效果。

快取遵循伺服器的 HTTP 快取標頭：

- 除非回應指定 `Cache-Control: no-store`，否則圖片會被保留。
- 在新鮮期間內，無需發出請求即可使用：依 `max-age`；否則至 `Expires`；否則為自 `Last-Modified` 起算時間的十分之一（最多一週）。
- 之後會向伺服器檢查（`If-None-Match` 搭配其 `ETag`，`If-Modified-Since` 搭配其 `Last-Modified`）：未變更的圖片（`304`）無需下載即可再次使用，已變更的則會取代舊的。
- 當請求失敗（沒有網路）或伺服器發生錯誤（`5xx`）時，會顯示保留的副本，除非回應指定了 `must-revalidate` 或 `no-cache`。

每個應用程式有自己的 256 MiB 快取；超過後，最久未使用的圖片會最先被丟棄。同一個應用程式的多個檢視、介面（surface）與處理程序可以安全地共用它。嵌入式應用程式可選擇它的位置與大小，或將它關閉：

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

預設情況下，快取位於系統的快取目錄：iOS 上為 `Library/Caches/nsh`，Android 上為快取目錄中的 `nsh`，macOS 上為 `~/Library/Caches`，Windows 上為 `%LOCALAPPDATA%`，Linux 上為 `$XDG_CACHE_HOME`（`~/.cache`），每個應用程式在其中各有自己的 `<app id>/images`。系統在需要空間時可能會清除這些目錄。

<a id="resize-modes"></a>

## 縮放模式

`objectFit` 樣式，即 CSS 的 `object-fit`（Rust 中為 `.object_fit(..)`），決定圖片如何填滿形狀不同的方框：

| 值 | 結果 |
|---|---|
| `"cover"`（`ResizeMode::Cover`，預設） | 填滿方框，保持長寬比，裁切溢出的部分 |
| `"contain"`（`ResizeMode::Contain`） | 在方框內完整顯示，保持長寬比，留下空白帶 |
| `"fill"`（`ResizeMode::Stretch`） | 精確填滿方框，圖片會變形 |
| `"none"`（`ResizeMode::Center`） | 自然尺寸，置於 `objectPosition`（預設置中） |
| `"scale-down"`（`ResizeMode::ScaleDown`） | 自然尺寸，較大時縮小以適應 |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Tailwind 類別 `object-cover`、`object-contain`、`object-fill`、`object-none` 與 `object-scale-down` 設定的是相同的樣式。

<a id="image-position"></a>

### 圖片位置

調整後尺寸的圖片在方框中的位置由 `objectPosition` 樣式決定（Rust 中為 `.object_position(..)` 與 `.object_top()` 等），即 CSS 的 `object-position`：預設為中心。被覆蓋（cover）的圖片會圍繞該位置裁切，被包含（contain）的圖片則在空白帶內移動。它接受關鍵字（`"top"`、`"left bottom"`）、百分比與長度（`"25% 75%"`、`"10px 0"`），以及帶偏移量的邊緣（`"right 10px bottom 20%"`）。聊天氣泡中的直式照片可以這樣顯示其頂部：

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Tailwind 類別即 Tailwind 本身的類別：`object-top`、`object-bottom`、`object-left`、`object-right`、`object-center`、`object-top-left`、`object-top-right`、`object-bottom-left`、`object-bottom-right`，以及任意值（`object-[25%_75%]`）。

<a id="styling-images"></a>

## 圖片樣式

圖片即是檢視：它們可使用圓角（也可逐角設定）、邊框、陰影、不透明度與變形。圓角會裁切圖片。

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **著色**（Rust 中為 `.tint_color(..)`，TSX 中為 `tintColor` 樣式）會重新為圖片的不透明像素上色：適用於跟隨主題的單色圖示。
- **濾鏡**（`.grayscale(..)`、`.sepia(..)`、`.blur(..)`；TSX 中為 `filter`）適用於兩個平台上的圖片（[濾鏡](./styling.md#filters-and-blending)）。

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## 佔位圖、淡入與模糊

| Prop | Rust | 說明 |
|---|---|---|
| `placeholder` | `.placeholder(..)` | 在 `src` 載入完成前顯示的圖片，可以是 URL 或資源；最好使用本機資源 |
| `fadeDuration` | `.fade_duration(ms)` | 載入完成的圖片淡入所需的毫秒數。iOS 預設為 0，Android 預設為 300 |
| `blurRadius` | `.blur_radius(px(..))` | 以此半徑（以點為單位）模糊圖片，於解碼時套用一次 |

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

動畫 GIF、WebP 與 APNG 檔案會自動播放，無論是資源還是來自 URL。它們可使用相同的樣式，包括 `objectFit`；在 iOS 上，著色的動畫圖片會顯示其第一個影格。

<a id="load-events"></a>

## 載入事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | 開始載入 |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }`（以位元組計，`total` 未知時為 0） | 下載期間，最多每 100 毫秒一次 |
| `onLoad` | `.on_load(..)` | `{ size }` | 圖片已就緒；來源的尺寸（以像素計；SVG 則以點計，[在網頁上依瀏覽器的測量結果](#svg-images)） |
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

load 事件回報的是來源圖片的尺寸，而非解碼時使用的尺寸。

具有[像素密度變體](#pixel-densities)的圖片會載入其中一個檔案，而 load 事件回報的是該檔案的像素數：在 3× 螢幕上，`logo@3x.png` 為 192×192，而 `Image.getSize(logo)` 則解析為匯入檔案的 64×64。當像素比改變且圖片載入另一個變體時，該次載入也會回報其事件：`onLoadStart`，接著是帶有新檔案尺寸的 `onLoad`（或 `onError`），然後是 `onLoadEnd`。
<a id="an-images-size-and-prefetching"></a>

## 圖片的尺寸與預先載入

不在畫面上的圖片可以事先測量並提前載入：Rust 中使用 `image_size(..)` 和 `prefetch_image(..)`，TSX 中則使用 `Image.getSize` 和 `Image.prefetch`（位於渲染該元素的同一個 `Image` 上）：

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

| Rust | TSX | 傳回值 |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | 圖片的尺寸，單位為像素（SVG 則以點為單位，[在網頁上則以瀏覽器的測量結果為準](#svg-images)）；無法載入時會傳回錯誤 |
| `prefetch_image(src)` | `Image.prefetch(src)` | 圖片的位元組載入完成後不傳回任何值；無法載入時會傳回錯誤 |

在 TSX 中，`src` 可以是 URL 字串或匯入的圖片。對於具有[變體](#pixel-densities)的匯入圖片，兩者都會載入視圖在此螢幕上所載入的變體，而 `getSize` 傳回的是匯入檔案本身的尺寸。兩者都會保留已下載的位元組，供之後顯示該圖片的視圖使用，因此在顯示前已預先載入的圖片無需下載即可出現。

常見的用法是依長寬比調整遠端圖片的大小：

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
| `.json` 及其他檔案 | 帶有其 URI 的 `FileAsset` | `.json`：解析後的值，已打包進指令碼中 | [專案結構](./project-structure.md#modules) |

在兩種方式中，字型都會在第一個影格之前完成註冊。

<a id="reading-a-file-at-run-time"></a>

### 在執行階段讀取檔案

`fetch` 會依應用程式隨附檔案的 `asset:/` URL 來讀取該檔案，在 TSX 與 Rust 中皆適用，且支援所有平台。匯入的圖片帶有其 URL（`url`），Rust crate 的檔案則可透過 `asset!`（`FileAsset::uri`）和 `assets!()` 取得其 URL：

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

引擎會在自己的執行緒之外，從應用程式的檔案中讀取該檔案（在 `nsh run` 期間則從開發伺服器讀取），不需要任何權限：這些檔案屬於應用程式自身。網頁應用程式會從其提供資源的位置下載頁面尚未預先載入的內容。回應為 `200`，內容包含檔案的位元組、其 `Content-Length`，以及依副檔名推得的 `Content-Type`（`image/png`、`application/json` 等），而無論檔案是以何種方式取得，其 `url` 都是 `asset:/` URL；若檔案並非應用程式所隨附，則會以指出該檔案的網路錯誤拒絕。URL 以檔案在應用程式檔案內的路徑來指定檔案，而請求以 `GET`（或 `HEAD`）讀取：路徑超出這些檔案範圍的 URL（`..`、絕對路徑）以及使用其他方法的請求，都會以相同方式被拒絕，且在讀取或下載任何內容之前就會拒絕。

<a id="a-modules-own-url"></a>

### 模組自身的 URL

在 TSX 中，`import.meta.url` 是撰寫該程式碼的模組的 URL，因此 `new URL("./data.json", import.meta.url)` 會指向與它相鄰的檔案。本機或已打包的桌面應用程式，其模組具有位於應用程式目錄中的 `file:` URL，`fs/promises` 會在 `${pluginDir}` 授權下讀取這些 URL；網頁應用程式的模組 URL 則是頁面的 URL；已打包的行動應用程式的模組 URL 是 `asset:/` URL，與匯入圖片的 URL 相同。若要隨應用程式打包圖片，請以匯入的方式引入：以這種方式建立的 URL 只是指向該檔案，並不會將它打包。

點陣圖也可以使用 `draw_image` / `drawImage` 繪製在畫布上（[畫布](./canvas.md)），而漸層可以取代許多裝飾性圖片（[樣式](./styling.md#gradients)）。

<a id="related"></a>

## 相關內容

- [image 元素](../elements/image.md)：所有屬性，包括 `getSize` 和 `prefetch`。
- [清單](./lists.md)：包含大量圖片的長清單會回收其視圖。
