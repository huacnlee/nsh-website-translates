---
title: "画像とアセット"
description: "RustとTSXでの画像の表示方法 - アプリのアセットと @2x ファイル、SVG画像、リモートURL、リサイズモード、プレースホルダー、ブラー、ティント、読み込みイベント、画像サイズの取得やプリフェッチについて。"
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# 画像とアセット

image 要素(Rust では `image(..)`、TSX では `<Image>`)は、ビットマップまたは SVG の図を表示します。アプリに同梱されたファイルでも、URL からダウンロードした画像でも使えます。画像はメインスレッド外で読み込まれてデコードされ、ビューでの表示サイズに縮小されてキャッシュされます。メインスレッドはデコード済みの結果を表示するだけです。

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

要素の props は [image](../elements/image.md) に一覧があります。

<a id="images-in-the-app"></a>

## アプリ内の画像

Rust のクレートは、ファイルを `assets/` ディレクトリに置きます。`asset!("logo@2x.png")`(`assets/` からの相対パス)は `ImageAsset`、`{ url, size, scales }` で、クレートのコンパイル時に読み込まれます。クレートの `#[native_module]` 関数内の `registry.assets(assets!())` が、ディレクトリ内のすべてのファイルをアプリに同梱します。TSX では、画像ファイルをモジュールのようにインポートします。インポートすると `ImageAsset`、`{ url, size, scales? }` が得られ、バンドラーがそのファイルをアプリに同梱します。

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

対応するファイル: `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic`、`.svg`([SVG 画像](#svg-images))。

**サイズの単位はポイントです。** ファイル名の `@2x` または `@3x` サフィックスは、そのファイルが 1 ポイントあたり 2 または 3 ピクセルであることを示します。したがって 128×128 ピクセルの `logo@2x.png` は 64×64 ポイントのアセットです。サフィックスがなければ 1 ピクセルが 1 ポイントです。サフィックス付きの名前のファイルはそのファイルが表示され、サフィックスなしの名前のファイルは、[ピクセル密度のバリアント](#pixel-densities)があればそれが表示されます。

**自然なサイズ。** アセットの画像は、スタイルで幅または高さが指定されていなければ自然なサイズでレイアウトされるため、`image(LOGO)` と `<Image src={logo} />` にスタイルは不要です。別のサイズにするには、一方の寸法とアスペクト比、または両方の寸法を指定します。

Rust では、ファイルが見つからない、または壊れているとビルドが失敗し、ファイルが変更されるとクレートが再ビルドされます。TSX では、アセットはインポート元のモジュールからの相対で解決され、その `url` はアプリのルート(エントリのディレクトリ)からの相対です。`nsh build` はそれらを `out/assets/` にコピーし、`nsh package` はアプリに含め、開発中は dev サーバーが配信します。

> [!TIP]
> TSX では、`src` は `asset:/path` 文字列も受け付けますが、同梱が保証されるのはインポートされたファイルです。一度もインポートされないパスは、アプリのディレクトリ全体を配信する dev サーバーでは動作しますが、パッケージ化されたアプリには含まれません。使用する画像はすべてインポートしてください。Rust のクレートは、`assets!()` により `assets/` ディレクトリ全体を同梱します。

<a id="pixel-densities"></a>

### ピクセル密度

サフィックスなしでファイルに名前を付け、その隣に高密度版を置くと、アプリは画面に合うものを読み込みます:

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

- `asset!` とバンドラーは、サフィックスなしの名前の画像について、`@1.5x`、`@2x`、`@3x`、`@4x` の兄弟ファイルを探します。`scales` はそれらを、名前を指定したファイルを 1 として列挙します。兄弟ファイルのない画像にはスケールがありません(TSX では `{ url, size }` としてインポートされます)。バンドラーは見つけた兄弟ファイルを同梱し、`assets!()` はディレクトリ全体を同梱します。
- 画像は、画面のピクセル比以上で最小のスケールを読み込み、なければ最大のものを読み込みます。これは React Native の選び方と同じです。1× の画面では `logo.png`、2× の画面では `logo@2x.png`、3× のスマートフォン(および 2.625)では `logo@3x.png` です。Web ではそのファイルだけがダウンロードされます。
- ピクセル比が変わる(ウィンドウを別の画面に移した、ブラウザーのズーム)と、選択が変わる画像は再読み込みされ、[読み込みイベント](#load-events)も発生します。サイズは、名前を指定したファイルのサイズ(ポイント単位)のままです。
- ピクセル数が、名前を指定したファイルのサイズにスケールを掛けた値と一致しないバリアントは、TSX ではビルド警告になり、Rust ではビルドが失敗します。
- 密度サフィックス(`./logo@3x.png`、`asset!("logo@3x.png")`)付きの名前のファイルは、そのファイル単独で扱われます。
- [SVG 画像](#svg-images)はどの比率でも画面に合わせて描画されるため、バリアントは同梱しません。

ファイルが 1 つでも問題ありません。必要な最高密度(すべてのスマートフォンで最もシャープにするなら `@3x`)で書き出し、サフィックス付きの名前を付けます。画像はデコード時に画面に合わせて縮小されます。バリアントを使うと、各画面が自分に合うファイルをダウンロード、デコード、保持できます。

<a id="svg-images"></a>

## SVG 画像

`.svg` ファイルも他の画像と同様にインポートします。ポイント単位のサイズは、その `width` と `height`(どちらか一方だけの場合はもう一方を `viewBox` のアスペクト比から)で決まり、それがなければ `viewBox` で決まります。SVG の CSS ピクセルは 1 ポイントで、`@2x` サフィックスは SVG ファイルには影響しません。

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

SVG は、表示されるサイズでシャープに描画されます。ブラウザーはベクターとして描画します。iOS、macOS、Android は、画像の読み込み時にビューが表示するサイズ(ピクセル単位)で描画します(ビットマップの縮小と同様で、その後ビューが大きくなった場合は、画像が再び読み込まれるまでその描画が拡大されます)。Windows、Linux、GPUI は 1 ポイントあたり 4 ピクセル(1 辺最大 2048 ピクセル)で 1 回描画し、各ビューに合わせて拡大縮小します。そのほかはビットマップと同じです: `objectFit`、`tintColor`(SVG の不透明な図形を通して適用されるため、単色アイコンはテーマに従います)、フィルター、`blurRadius`、プレースホルダー、読み込みイベント、`Image.getSize`、`Image.prefetch`。`onLoad` と `Image.getSize` は SVG のサイズを整数のポイントで報告しますが、画像は正確なサイズでレイアウトされます。リモートの SVG ファイルも、同じダウンロードと[ケイパビリティ](./sandbox-and-capabilities.md)のチェックを通して同様に読み込まれます。NSH は URL の末尾に関係なく、内容から SVG を判別します(gzip 圧縮された `.svgz` も同様です)。

**ネイティブプラットフォームが描画するもの。** iOS、macOS、Android、Windows、Linux、GPUI は 1 つのレンダラー(resvg)で SVG を描画するため、図はどのプラットフォームでも同じに見えます: 図形とパス、塗りと線、グラデーションとパターン、クリップパスとマスク、不透明度、フィルター、変形。テキスト(`<text>`)、アニメーション(SMIL と CSS)、埋め込み画像(`<image>`)、HTML(`<foreignObject>`)はブラウザーでは表示されます。ネイティブプラットフォームはそれ以外の部分を静止画として描画し、これらを使うファイルは `nsh build` に挙げられます。どこでも同じ結果にするには、テキストをアウトライン(パス)に変換して書き出してください。

**自己完結した図。** ネイティブプラットフォームでは、SVG は自身が保持するものだけを描画します。参照しているファイル、URL、`data:` 画像、その他のドキュメントは除外されます。ネイティブプラットフォームは、リモートのものも含め、メモリ使用量を抑える範囲内で SVG を描画します。ドキュメントは最大 16 MiB(圧縮されたものは展開後)、描画は 1 辺最大 8192 ピクセルかつ合計 4096 × 4096 ピクセル(64 MiB。それより大きいものはより小さく描画されます)、レイヤー(不透明度、マスク、クリップパス、フィルターを持つグループで、レンダラーが別に描画するもの)は同時に最大 256 MiB です。ドキュメントまたはレイヤーの上限を超える SVG は、`onError` で読み込みに失敗します。

**Web で報告されるサイズ。** ブラウザーは、インポートされたものもリモートのものも、SVG を自分で計測します。`onLoad` と `Image.getSize` は、SVG に `width` と `height` があればそれを報告し、なければブラウザーが与えるサイズを報告します。ブラウザーは通常、既定の 300 × 150 と `viewBox` のアスペクト比からこれを導きます。インポートされた SVG は、どのプラットフォームでもバンドラーが示すサイズでレイアウトされます。どこでも同じサイズが報告されるように、SVG には `width` と `height` を指定してください。

<a id="remote-images"></a>

## リモート画像

要素に URL を渡します。Rust では文字列(変化する場合はクロージャー)、TSX では URL 文字列です:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **リモート画像にはサイズを指定してください。** 読み込むまでサイズが分からないため、幅と高さ(またはどちらか一方とアスペクト比)がないと、高さのない状態に潰れます。
- **背景色**は画像の読み込み中に表示されます。または、プレースホルダー(後述)を使います。
- ダウンロードは共有されます。同じ URL を表示する複数のビューは、異なるサイズでデコードする場合でも、1 回だけダウンロードします。誰も待たなくなったダウンロードはキャンセルされます。
- デコード済みの画像は、URL、デコードサイズ、ブラー半径をキーとしてメモリ内にキャッシュされます(キャッシュはメモリ逼迫時に破棄されます)。
- アプリが[ケイパビリティ](./sandbox-and-capabilities.md)を宣言している場合、画像のホストは `network` で許可されている必要があります。拒否された画像は error イベントとともに失敗します。

<a id="kept-on-disk"></a>

### ディスクへの保存

ダウンロードした画像は、サーバーが送ったままの形でディスクにも保存されます。そのため、再び開いたアプリ(アバターや写真がたくさんある会話、フィードなど)は、以前に表示した画像をダウンロードせずに、オフラインでも表示できます。アプリ側の設定は不要です。iOS、Android、macOS、Windows、Linux、GPUI では `http://` または `https://` URL のすべての画像がキャッシュを通り、ブラウザーではブラウザー自身の HTTP キャッシュが同じ役割を果たします。

キャッシュはサーバーの HTTP キャッシュヘッダーに従います:

- レスポンスに `Cache-Control: no-store` がない限り、画像は保存されます。
- 新鮮な間はリクエストなしで使われます。その期間は `max-age`、なければ `Expires` まで、それもなければ `Last-Modified` からの経過時間の 10 分の 1(最大 1 週間)です。
- それを過ぎると、サーバーに確認されます(`If-None-Match` と `ETag`、`If-Modified-Since` と `Last-Modified`)。変更されていない画像(`304`)はダウンロードせずに再利用され、変更された画像は置き換えられます。
- リクエストが失敗した場合(ネットワークなし)やサーバーがエラー(`5xx`)を返した場合は、レスポンスが `must-revalidate` または `no-cache` と指定していない限り、保存されたコピーが表示されます。

各アプリは 256 MiB の独自のキャッシュを持ちます。それを超えると、最近使われていない画像から削除されます。1 つのアプリの複数のビュー、サーフェス、プロセスが安全に共有します。組み込み側のアプリは、保存場所とサイズを選ぶか、無効にできます:

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

`CacheLocation::Off`(`.off`、`noDiskCache()`)はディスクに何も保存しません。

既定では、キャッシュはシステムのキャッシュディレクトリにあります。iOS では `Library/Caches/nsh`、Android ではキャッシュディレクトリ内の `nsh`、macOS では `~/Library/Caches`、Windows では `%LOCALAPPDATA%`、Linux では `$XDG_CACHE_HOME`(`~/.cache`)で、各アプリはその中の `<app id>/images` を使います。システムは容量が必要なときにこれらのディレクトリを消去することがあります。

<a id="resize-modes"></a>

## リサイズモード

`objectFit` スタイル(CSS の `object-fit`、Rust では `.object_fit(..)`)は、画像が形の異なるボックスをどう満たすかを決めます:

| 値 | 結果 |
|---|---|
| `"cover"`(`ResizeMode::Cover`、既定) | アスペクト比を保ってボックスを満たし、はみ出した部分を切り取る |
| `"contain"`(`ResizeMode::Contain`) | アスペクト比を保ってボックス内に収め、空きの帯を残す |
| `"fill"`(`ResizeMode::Stretch`) | ボックスをちょうど満たし、画像を歪める |
| `"none"`(`ResizeMode::Center`) | 自然なサイズで、`objectPosition` に配置する(既定では中央) |
| `"scale-down"`(`ResizeMode::ScaleDown`) | 自然なサイズで、大きい場合は収まるように縮小する |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Tailwind のクラス `object-cover`、`object-contain`、`object-fill`、`object-none`、`object-scale-down` も同じスタイルを設定します。

<a id="image-position"></a>

### 画像の位置

サイズが決まった画像がボックス内のどこに置かれるかは `objectPosition` スタイル(Rust では `.object_position(..)` と `.object_top()` など)、CSS の `object-position` で決まり、既定は中央です。cover の画像はその位置を中心に切り取られ、contain の画像は空きの帯の中で移動します。キーワード(`"top"`、`"left bottom"`)、パーセンテージと長さ(`"25% 75%"`、`"10px 0"`)、オフセット付きの辺(`"right 10px bottom 20%"`)を指定できます。チャットの吹き出し内の縦長の写真は、これで上部を表示できます:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Tailwind のクラスは Tailwind 標準のものです: `object-top`、`object-bottom`、`object-left`、`object-right`、`object-center`、`object-top-left`、`object-top-right`、`object-bottom-left`、`object-bottom-right`、および任意の値(`object-[25%_75%]`)。

<a id="styling-images"></a>

## 画像のスタイル

画像はビューなので、角丸(角ごとの指定も可)、ボーダー、シャドウ、不透明度、変形を指定できます。角は画像をクリップします。

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **ティント**(Rust では `.tint_color(..)`、TSX では `tintColor` スタイル)は、画像の不透明なピクセルの色を変えます。テーマに従う単色アイコンに使います。
- **フィルター**(`.grayscale(..)`、`.sepia(..)`、`.blur(..)`、TSX では `filter`)は、両方のプラットフォームで画像に適用されます([フィルター](./styling.md#filters-and-blending))。

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## プレースホルダー、フェードイン、ブラー

| Prop | Rust | 説明 |
|---|---|---|
| `placeholder` | `.placeholder(..)` | `src` が読み込まれるまで表示される画像(URL またはアセット)。ローカルのアセットが最適 |
| `fadeDuration` | `.fade_duration(ms)` | 読み込まれた画像がフェードインするミリ秒数。既定値は iOS で 0、Android で 300 |
| `blurRadius` | `.blur_radius(px(..))` | この半径(ポイント単位)で画像をぼかす。デコード時に 1 回適用される |

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

## アニメーション画像

アニメーション GIF、WebP、APNG ファイルは、アセットでも URL からでも自動的に再生されます。`objectFit` を含め、同じスタイルが使えます。ティントされたアニメーション画像は、iOS では最初のフレームを表示します。

<a id="load-events"></a>

## 読み込みイベント

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | 読み込みの開始時 |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }`(バイト単位。不明な場合 `total` は 0) | ダウンロード中、最大 100 ms ごと |
| `onLoad` | `.on_load(..)` | `{ size }` | 画像の準備完了時。ソースのサイズ(ピクセル単位。SVG はポイント単位で、[Web ではブラウザーが計測した値](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }`(Rust では `&str`) | 読み込みまたはデコードに失敗したとき |
| `onLoadEnd` | `.on_load_end(..)` | | `onLoad` または `onError` の後 |

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

load イベントは、デコードされたサイズではなく、ソース画像のサイズを報告します。

[ピクセル密度のバリアント](#pixel-densities)を持つ画像はそのうち 1 つのファイルを読み込み、load イベントはそのファイルのピクセル数を報告します。3× の画面での `logo@3x.png` では 192×192 となり、`Image.getSize(logo)` はインポートされたファイルの 64×64 で解決されます。ピクセル比が変わって画像が別のバリアントを読み込むと、その読み込みでもイベントが報告されます: `onLoadStart`、続いて新しいファイルのサイズを持つ `onLoad`(または `onError`)、そして `onLoadEnd` の順です。
<a id="an-images-size-and-prefetching"></a>

## 画像のサイズとプリフェッチ

画面に表示されていない画像も、事前に計測して読み込めます。Rust では `image_size(..)` と `prefetch_image(..)`、TSX では `Image.getSize` と `Image.prefetch`(要素を描画するのと同じ `Image` 上で使います)を利用します。

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

| Rust | TSX | 戻り値 |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | 画像のサイズ(ピクセル単位。SVG はポイント単位、[Web ではブラウザが計測した値](#svg-images))。読み込めない場合はエラー |
| `prefetch_image(src)` | `Image.prefetch(src)` | 画像のバイト列の読み込みが完了した時点で何も返しません。読み込めない場合はエラー |

TSX では、`src` は URL 文字列またはインポートした画像です。[バリアント](#pixel-densities)を持つインポート画像の場合、どちらもこの画面でビューが読み込むバリアントを読み込み、`getSize` はインポートしたファイルのサイズを返します。どちらもダウンロードしたバイト列を保持し、次にその画像を表示するビューが利用します。そのため、表示前にプリフェッチした画像は、ダウンロードなしで表示されます。

よくある使い方は、リモート画像をアスペクト比に基づいてサイズ指定することです。

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

## その他のアセット

| ファイル | Rust(`asset!`) | TSX のインポート | ページ |
|---|---|---|---|
| `.ttf`、`.otf`、`.woff`、`.woff2` | ファミリー名を持つ `FontAsset` | フォントのファミリー名 | [フォント](./fonts.md) |
| `.json` およびその他のファイル | URI を持つ `FileAsset` | `.json`: パース済みの値で、スクリプトにバンドルされます | [プロジェクト構成](./project-structure.md#modules) |

どちらの場合も、フォントは最初のフレームより前に登録されます。

<a id="reading-a-file-at-run-time"></a>

### 実行時にファイルを読み込む

`fetch` は、アプリが同梱するファイルを `asset:/` URL で読み込みます。TSX でも Rust でも、すべてのプラットフォームで同様に動作します。インポートした画像は自身の URL(`url`)を持ち、Rust クレートのファイルの URL は `asset!`(`FileAsset::uri`)と `assets!()` から得られます。

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

エンジンは、アプリのファイルからスレッドとは別の場所で(`nsh run` の間は開発サーバーから)ファイルを読み込みます。これらはアプリ自身のファイルであるため、ケイパビリティは不要です。Web アプリでは、ページがプリロードしていないものを、アセットの配信元からダウンロードします。レスポンスは、ファイルのバイト列を持つ `200` で、その `Content-Length` と、拡張子から決まる `Content-Type`(`image/png`、`application/json` など)を持ちます。その `url` は、ファイルがどのように届いたかにかかわらず `asset:/` URL になります。アプリが同梱していないファイルは、そのファイルを示すネットワークエラーとして reject されます。URL はアプリのファイル内のパスでファイルを指定し、リクエストは `GET`(または `HEAD`)で読み込みます。パスがアプリのファイルの外に出る URL(`..`、絶対パス)や、別のメソッドを使うリクエストは、何かが読み込まれたりダウンロードされたりする前に、同様に reject されます。

<a id="a-modules-own-url"></a>

### モジュール自身の URL

TSX では、`import.meta.url` は記述しているモジュール自身の URL なので、`new URL("./data.json", import.meta.url)` はそのモジュールの隣にあるファイルを指します。ローカルまたはパッケージ化されたデスクトップアプリのモジュールは、アプリのディレクトリ内の `file:` URL を持ち、`fs/promises` は `${pluginDir}` の許可のもとでそれを読み込みます。Web アプリのモジュールはページの URL を持ちます。パッケージ化されたモバイルアプリのモジュールは、インポートした画像と同様の `asset:/` URL を持ちます。画像を同梱するにはインポートしてください。この方法で作った URL はファイルを指し示すだけで、パッケージには含めません。

ビットマップ画像は、`draw_image` / `drawImage`([Canvas](./canvas.md))でキャンバスに描画することもでき、多くの装飾的な画像はグラデーションで置き換えられます([スタイリング](./styling.md#gradients))。

<a id="related"></a>

## 関連項目

- [image 要素](../elements/image.md): すべての props、`getSize` と `prefetch` を含みます。
- [リスト](./lists.md): 画像を多数並べた長いリストでは、ビューが再利用されます。
