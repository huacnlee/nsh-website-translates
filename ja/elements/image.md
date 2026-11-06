---
title: "Image"
description: "バンドルされた画像またはリモート画像を表示する要素です。プレースホルダー、ブラー、フェード、ティント、読み込みイベントに対応しています。"
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` はアプリのアセットまたは URL の画像を表示します。画像はメインスレッド外でダウンロードおよびデコードされ、ビューが表示するサイズにダウンサンプリングされて、メモリにキャッシュされます。アニメーション GIF、WebP、APNG は再生されます。Rust では `image(src)` で作成し、TSX では `nsh` の `<Image>` を使います。

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

アセットは自身のサイズを持っているため、幅も高さも指定しなければ画像はそのサイズになり、どちらか一方を指定すればもう一方はアセットのアスペクト比に従います。URL のサイズは読み込まれてから分かるため、リモート画像には幅と高さ(またはアスペクト比とどちらか一方)を指定してください。

<a id="sources"></a>

## ソース

ソース(`src` と `placeholder`、Rust では `image(..)` と `.placeholder(..)`)には次の値を指定できます。

| 値 | 例 | 説明 |
|---|---|---|
| アセット | Rust `asset!("logo.png")`、TSX `import logo from "./logo.png"` | `ImageAsset` `{ url, size, scales? }`。ポイント単位のサイズを持ち、`@2x` ファイルはピクセル数の半分として扱われます。`logo.png` の隣に `logo@2x.png` / `logo@3x.png` がある場合、画面のピクセル比に合うバリアントが読み込まれます([ピクセル密度](../docs/images-and-assets.md#pixel-densities))。`.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.heic` をインポートでき、`.svg` は `width` と `height` または `viewBox` によってサイズが決まります([SVG 画像](../docs/images-and-assets.md#svg-images))。 |
| URL | `"https://example.com/a.jpg"` | ダウンロードされてキャッシュされます。同じ URL のダウンロードはビュー間で共有されます。 |
| アセットパス | `"asset:/images/a.png"` | アプリのアセットのファイル。 |
| `data:` URI | `"data:image/png;base64,iVBOR…"` | URI 内のバイト列。base64 またはパーセントエンコード(`data:image/svg+xml,%3Csvg…`)。 |
| `blob:` URL | `URL.createObjectURL(blob)` | `Blob` または `File`(TSX)のバイト列。画像はそれを保持するため、URL を revoke しても画像は全体が表示されたままになります。 |

アプリがすでに持っているバイト列からの画像は、リクエストなしで表示されます。チャットでは、選択した写真をアップロード中は blob から表示し、その後 `src` を写真の URL に切り替えます。

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

同じバイト列は 1 つの画像として扱われます。同じ画像を `data:` URI と blob の両方で使っても、デコードは 1 回で、キャッシュも共有されます。

開発中、アセットは開発サーバーから配信されます。`nsh build` と `nsh package` はそれらをアプリにコピーします(Rust クレートは `assets/` ディレクトリを `registry.assets(assets!())` で同梱します)。詳しくは[画像とアセット](../docs/images-and-assets.md)を参照してください。

> [!NOTE]
> アプリが[ケイパビリティ](../docs/sandbox-and-capabilities.md)を宣言している場合、リモート画像は一覧にあるホストからのみ読み込まれます。それ以外のホストの画像はリクエストされず、`code` が `"ERR_ACCESS_DENIED"` の `onError` で失敗します。`asset:` URI、`data:` URI、`blob:` URL は常に読み込まれます。

## Props

[共通 props](./index.md#common-props)に加えて(`style` の型は `ImageStyle`):

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | 表示する画像。 |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | `src` の読み込みが完了するまで表示されます。ローカルアセットが最適です。 |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | 画像をこの半径(ポイント)でぼかします(デコード時にメインスレッド外で 1 回だけ適用されます)。 |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`、Android `300` | 読み込まれた画像がフェードインする時間(ミリ秒)。 |
| `tintColor`(スタイル) | `.tint_color(..)` | `ColorValue` | | テンプレート画像(単色で描かれたアイコン)の色を変更します。 |
| `objectFit`(スタイル) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | 画像がボックスに収まる方法。CSS の `object-fit` と同じです(`object-*` クラス)。`"cover"` はボックスを埋めてクロップし、`"contain"` は内側に収め、`"fill"` は引き伸ばし、`"none"` は元のサイズで表示し、`"scale-down"` も同様ですが、大きい場合は収まるよう縮小します。 |
| `objectPosition`(スタイル) | `.object_position(..)`、`.object_top()`、... | `string` | `"center"` | `objectFit` によってサイズが決まった後に、画像がボックス内のどこに置かれるか。CSS の `object-position` と同じです(`"top"`、`"25% 75%"`、`"right 10px bottom 20%"`)。ボックスを覆う画像はこの位置を基準にクロップされます。 |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | 読み込みが開始されました。 |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | ダウンロードの進捗(バイト)。`total` は不明な場合 0 です。最大でも 100 ms ごとに通知されます。 |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | 読み込み完了。ソース画像のサイズ(ピクセル。デコード・ダウンサンプリング後のサイズではありません。SVG はポイント単位で、[Web ではブラウザーが計測した値](../docs/images-and-assets.md#svg-images))。バリアントを持つ画像では、読み込まれたバリアントのサイズです。 |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | 読み込みに失敗しました。アプリのケイパビリティで許可されていない URL の場合、`code` は `"ERR_ACCESS_DENIED"` です。 |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | `onLoad` または `onError` の後。 |

`ImageStyle` はビューのスタイルに、`tintColor`(テンプレート画像、つまり単色で描かれたアイコンの色を変更します)と `objectPosition`(画像をボックス内に配置します)を追加します([画像の位置](../docs/images-and-assets.md#image-position))。

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | なし | 読み込みが開始されました。 |
| `onProgress` | `.on_progress` | `{ loaded, total }`(`ImageProgress`) | バイトが到着しました(最大でも 100 ms ごと)。 |
| `onLoad` | `.on_load` | `{ size }`(`Size<DevicePixels>`) | 画像が表示されました。ソースのサイズ(ピクセル。SVG はポイント単位で、[Web ではブラウザーが計測した値](../docs/images-and-assets.md#svg-images))。 |
| `onError` | `.on_error` | `{ message, code? }`(`&str`、メッセージ) | 読み込みまたはデコードに失敗した、あるいはホストがアプリのケイパビリティの範囲外です(`code` `"ERR_ACCESS_DENIED"`)。 |
| `onLoadEnd` | `.on_load_end` | なし | `onLoad` または `onError` の後。 |

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

[ピクセル密度バリアント](../docs/images-and-assets.md#pixel-densities)を持つ画像はそのファイルのうち 1 つを読み込み、`onLoad` はそのファイルのピクセル数を報告します。たとえば 3× の画面では、64×64 ポイントの `logo.png` に対して `logo@3x.png` の 192×192 です。ピクセル比が変わって画像が別のバリアントを読み込んだ場合は、その読み込みも報告します。まず `onLoadStart`、続いて新しいファイルのサイズとともに `onLoad`(または `onError`)、最後に `onLoadEnd` です。

画像のサイズを知りたい場合や、表示前に読み込みたい場合は、TSX では `Image.getSize(src)` と `Image.prefetch(src)` を呼び出し(要素を描画するのと同じ `Image` がこれらを持ちます。[Image API](../modules/nsh-image.md)を参照)、Rust では `image_size(src)` と `prefetch_image(src)` をタスク内で await します。バリアントを持つインポート済み画像を渡すと、`Image.getSize` と `Image.prefetch` はこの画面が表示するバリアントを読み込み、`getSize` はインポートされたファイルのサイズで解決されます(`logo.png` では 64×64)。

<a id="ref-methods"></a>

## Ref メソッド

独自のものはありません。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- キャッシュキーにはデコードサイズとぼかし半径が含まれます。同じ URL を 2 つのサイズで表示すると、デコードは 2 回行われますが、ダウンロードは 1 回です。
- iOS はアニメーション画像をキーフレームアニメーションとして再生します(最大 600 フレーム)。色を付けたアニメーション画像は最初のフレームのみ表示されます。
- Android は API 28(`AnimatedImageDrawable`)以降でアニメーション画像を再生しますが、キャッシュもぼかしもされません。
- Android では、iOS と同様にボーダーは画像の上に描画されます。
