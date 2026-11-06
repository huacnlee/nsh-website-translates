---
title: "Image"
description: "Image：圖片元素，以及用於取得圖片資訊與預先載入的 Image.getSize 和 Image.prefetch。"
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` 匯出 `Image`，這是用來顯示圖片的 [`<Image>`](../elements/image.md) 元素。同一個 `Image` 也可以向原生圖片載入器查詢圖片資訊而不顯示圖片：包括圖片尺寸，以及在顯示之前先行載入。

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` 是一個帶有兩個函式的元件：`<Image src=…>` 負責轉譯原生圖片檢視（編譯器會就地產生它，就像處理 `<View>` 一樣），而 `Image.getSize` / `Image.prefetch` 則直接在它上面呼叫。

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

指南請參閱[圖片與資源](../docs/images-and-assets.md)。

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

載入圖片，並以其像素尺寸完成 Promise（為來源圖片的尺寸，而非降低取樣後的副本；SVG 則為其固有尺寸，單位為 point，[在網頁上則依瀏覽器的測量結果](../docs/images-and-assets.md#svg-images)）。若匯入的圖片具有[像素密度變體](../docs/images-and-assets.md#pixel-densities)，會載入各檢視在此螢幕上所載入的變體，並以匯入檔案的尺寸完成，無論實際載入的是哪個變體（顯示該圖片的 `<Image>` 會在 `onLoad` 中回報所載入變體的像素）。載入的位元組會保留在記憶體中，因此接著顯示該圖片的 `<Image>` 不會再次下載。若圖片無法載入，Promise 會被拒絕。

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

在顯示圖片之前預先載入。當圖片的位元組進入記憶體後完成，若圖片無法載入，則以該錯誤拒絕。對於具有像素密度變體的匯入圖片，會載入各檢視在此螢幕上所載入的變體。可用於圖庫的下一頁，或點擊後才會顯示的圖片。

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## 相關內容

- [`<Image>`](../elements/image.md)：`src`、`placeholder`、`objectFit` 樣式、`onLoad`、`onProgress`、`onError` 以及其他屬性。
- 匯入圖片檔（`import logo from "./logo.png"`）會得到一個 `ImageAsset`（`{ url, size, scales? }`，以 point 為單位的尺寸），可供 `<Image src>` 與 canvas 的 `drawImage` 接受。

> [!NOTE]
> 當你的應用程式在 `nsh.json` 中宣告 `capabilities` 時，遠端 URL 的 `getSize` 與 `prefetch` 必須在 `network` 下獲得允許，就像 `fetch` 一樣。不在允許範圍內的 URL 絕不會被請求：Promise 會以一個 `Error` 拒絕，其 `code` 為 `"ERR_ACCESS_DENIED"`，`permission` `"network"`，且 `resource` 該 URL。請參閱[沙箱與權限](../docs/sandbox-and-capabilities.md)。
