---
title: "Image"
description: "Image: 画像要素、および画像情報の取得と先読みのための Image.getSize と Image.prefetch。"
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` は、画像を表示する [`<Image>`](../elements/image.md) 要素である `Image` をエクスポートします。同じ `Image` は、画像を表示せずにネイティブの画像ローダーへ問い合わせることもでき、画像のサイズの取得や、表示前の読み込みが行えます。

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` は 2 つの関数を持つコンポーネントです。`<Image src=…>` はネイティブの画像ビューを描画し(コンパイラが `<View>` と同様にその場で生成します)、`Image.getSize` と `Image.prefetch` はそのコンポーネントに対して直接呼び出します。

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

ガイドは [Images and assets](../docs/images-and-assets.md) を参照してください。

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

画像を読み込み、ピクセル単位のサイズで解決します(縮小されたコピーではなく、元の画像のサイズです。SVG の場合は固有サイズをポイント単位で返し、[Web ではブラウザが計測した値](../docs/images-and-assets.md#svg-images)になります)。[ピクセル密度別バリアント](../docs/images-and-assets.md#pixel-densities)を持つインポート済み画像では、この画面でビューが読み込むバリアントを読み込み、どのバリアントを読み込んだかにかかわらず、インポートされたファイルのサイズで解決します(それを表示する `<Image>` は、`onLoad` に読み込まれたバリアントのピクセル数を報告します)。読み込まれたバイト列はメモリに保持されるため、次にその画像を表示する `<Image>` が再度ダウンロードすることはありません。画像を読み込めない場合、Promise は reject されます。

```tsx
import { Image, signal } from "nsh";

const url = "https://picsum.photos/seed/nsh/1200/800";
const ratio = signal(1);

Image.getSize(url).then(({ width, height }) => ratio.set(width / height));

<Image src={url} style={{ width: "100%", aspectRatio: ratio() }} />;
```

## Image.prefetch

```ts
prefetch(src: string | ImageAsset): Promise<void>;
```

画像を表示する前に読み込みます。バイト列がメモリに載った時点で解決し、画像を読み込めない場合はそのエラーで reject されます。ピクセル密度別バリアントを持つインポート済み画像では、この画面でビューが読み込むバリアントを読み込みます。ギャラリーの次のページや、タップ先の画像などに使用します。

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## 関連項目

- [`<Image>`](../elements/image.md): `src`、`placeholder`、`objectFit` スタイル、`onLoad`、`onProgress`、`onError` などの props。
- 画像ファイルをインポートする(`import logo from "./logo.png"`)と、`<Image src>` やキャンバスの `drawImage` が受け取れる `ImageAsset`(`{ url, size, scales? }`、ポイント単位のサイズ)が得られます。

> [!NOTE]
> アプリが `nsh.json` で `capabilities` を宣言している場合、リモート URL の `getSize` と `prefetch` は、`fetch` と同様に `network` で許可されている必要があります。許可されていない URL へのリクエストは一切行われず、Promise は、`code` が `"ERR_ACCESS_DENIED"`、`permission` が `"network"`、そして `resource` が URL である `Error` で reject されます。[Sandbox and capabilities](../docs/sandbox-and-capabilities.md) を参照してください。
