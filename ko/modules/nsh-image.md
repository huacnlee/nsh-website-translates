---
title: "Image"
description: "Image: 이미지 요소와 함께 이미지 정보 확인 및 사전 로딩을 위한 Image.getSize, Image.prefetch를 제공합니다."
order: 2.2
source_hash: 028257cecdec706c
---

# 이미지

`nsh`는 이미지를 표시하는 [`<Image>`](../elements/image.md) 엘리먼트인 `Image`를 export합니다. 같은 `Image`는 이미지를 표시하지 않고도 네이티브 이미지 로더에 이미지의 크기를 묻거나, 이미지가 표시되기 전에 미리 로드하는 데에도 사용할 수 있습니다.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image`는 두 가지 함수를 가진 컴포넌트입니다. `<Image src=…>`는 네이티브 이미지 뷰를 렌더링하며(컴파일러가 `<View>`와 마찬가지로 해당 위치에 직접 생성합니다), `Image.getSize` / `Image.prefetch`는 이 컴포넌트에서 직접 호출합니다.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

가이드는 [이미지와 에셋](../docs/images-and-assets.md)을 참고하세요.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

이미지를 로드하고 픽셀 단위의 크기로 resolve합니다(다운샘플링된 사본이 아니라 원본 이미지의 크기이며, SVG의 경우 포인트 단위의 고유 크기이고 [웹에서는 브라우저가 측정한 크기](../docs/images-and-assets.md#svg-images)입니다). [픽셀 밀도 variant](../docs/images-and-assets.md#pixel-densities)가 있는 import된 이미지는 이 화면에서 뷰가 로드하는 variant를 로드하며, 어떤 variant를 로드했든 import된 파일의 크기로 resolve합니다(이를 표시하는 `<Image>`는 `onLoad`에 로드된 variant의 픽셀 크기를 보고합니다). 로드된 바이트는 메모리에 유지되므로, 다음에 이를 표시하는 `<Image>`는 이미지를 다시 다운로드하지 않습니다. 이미지를 로드할 수 없으면 promise가 reject됩니다.

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

이미지를 표시하기 전에 미리 로드합니다. 바이트가 메모리에 올라오면 resolve하고, 이미지를 로드할 수 없으면 해당 오류와 함께 reject합니다. 픽셀 밀도 variant가 있는 import된 이미지의 경우 이 화면에서 뷰가 로드하는 variant를 로드합니다. 갤러리의 다음 페이지나 탭하면 나타나는 이미지에 사용하세요.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## 관련 문서

- [`<Image>`](../elements/image.md): `src`, `placeholder`, `objectFit` 스타일, `onLoad`, `onProgress`, `onError` 및 기타 props.
- 이미지 파일을 import하면(`import logo from "./logo.png"`) `<Image src>`와 캔버스 `drawImage`가 받아들이는 `ImageAsset`(`{ url, size, scales? }`, 포인트 단위 크기)를 얻습니다.

> [!NOTE]
> 앱이 `nsh.json`에서 `capabilities`를 선언하면, 원격 URL에 대한 `getSize`와 `prefetch`는 `fetch`처럼 `network`에서 허용되어야 합니다. 이에 해당하지 않는 URL은 요청되지 않으며, promise는 `code`가 `"ERR_ACCESS_DENIED"`인 `Error`와 함께 reject되고, `permission` `"network"` 및 `resource` URL이 포함됩니다. [샌드박스와 권한](../docs/sandbox-and-capabilities.md)을 참고하세요.
