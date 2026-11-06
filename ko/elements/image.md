---
title: "Image"
description: "번들 이미지 또는 원격 이미지를 표시하는 요소로, 플레이스홀더, 블러, 페이드, 틴트 및 로드 이벤트를 지원합니다."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image`는 앱의 에셋 또는 URL에 있는 이미지를 표시합니다. 이미지는 메인 스레드 밖에서 다운로드 및 디코딩되고, 뷰에 표시되는 크기로 다운샘플링되어 메모리에 캐시됩니다. 애니메이션 GIF, WebP, APNG 이미지도 재생됩니다. Rust에서는 `image(src)`로, TSX에서는 `nsh`의 `<Image>`로 만듭니다.

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

에셋은 자신의 크기를 알고 있습니다. width와 height를 모두 지정하지 않으면 에셋의 크기를 따르고, 둘 중 하나만 지정하면 나머지는 에셋의 가로세로 비율에 맞춰집니다. URL 이미지의 크기는 로드된 후에야 알 수 있으므로, 원격 이미지에는 width와 height를 모두 지정하거나(또는 둘 중 하나와 가로세로 비율을 지정) 해야 합니다.

## Sources

소스(`src` 및 `placeholder`, Rust에서는 `image(..)` 및 `.placeholder(..)`)에는 다음 값을 사용할 수 있습니다.

| 값 | 예시 | 설명 |
|---|---|---|
| 에셋 | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | 포인트 단위 크기를 가진 `ImageAsset` `{ url, size, scales? }`입니다. `@2x` 파일은 픽셀 수의 절반으로 계산됩니다. `logo.png` 옆에 `logo@2x.png` / `logo@3x.png`가 있으면 화면의 픽셀 비율에 맞는 변형이 로드됩니다([픽셀 밀도](../docs/images-and-assets.md#pixel-densities)). `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic`를 import할 수 있으며, `.svg`는 `width`와 `height` 또는 `viewBox`에 따라 크기가 정해집니다([SVG 이미지](../docs/images-and-assets.md#svg-images)). |
| URL | `"https://example.com/a.jpg"` | 다운로드되어 캐시됩니다. 같은 URL의 다운로드는 뷰 간에 공유됩니다. |
| 에셋 경로 | `"asset:/images/a.png"` | 앱 에셋에 포함된 파일입니다. |
| `data:` URI | `"data:image/png;base64,iVBOR…"` | URI에 들어 있는 바이트이며, base64 또는 퍼센트 인코딩(`data:image/svg+xml,%3Csvg…`)을 사용합니다. |
| `blob:` URL | `URL.createObjectURL(blob)` | `Blob` 또는 `File`(TSX)의 바이트입니다. 이미지가 바이트를 유지하므로, URL을 revoke해도 이미지는 그대로 온전하게 표시됩니다. |

앱이 이미 가지고 있는 바이트로 만든 이미지는 요청 없이 표시됩니다. 채팅 앱은 사용자가 고른 사진을 업로드하는 동안 blob에서 표시하다가, 업로드가 끝나면 `src`를 사진의 URL로 전환합니다.

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

같은 바이트는 하나의 이미지로 취급됩니다. 같은 그림을 `data:` URI와 blob으로 각각 사용해도 한 번만 디코딩되며 캐시를 공유합니다.

개발 중에는 에셋이 개발 서버에서 제공되며, `nsh build`와 `nsh package`가 에셋을 앱에 복사합니다(Rust 크레이트는 `assets/` 디렉터리를 `registry.assets(assets!())`와 함께 배포합니다). 자세한 내용은 [이미지와 에셋](../docs/images-and-assets.md)을 참고하세요.

> [!NOTE]
> 앱이 [capabilities](../docs/sandbox-and-capabilities.md)를 선언하면 원격 이미지는 목록에 있는 호스트에서만 로드됩니다. 그 외의 호스트에 있는 이미지는 요청되지 않고 `onError`와 함께 실패하며, 이때 `code`는 `"ERR_ACCESS_DENIED"`입니다. `asset:` URI, `data:` URI, `blob:` URL은 항상 로드됩니다.

## Props

[공통 props](./index.md#common-props)(`style`의 타입은 `ImageStyle`) 외에 다음 props가 있습니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | 표시할 이미지입니다. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | `src`가 로드될 때까지 표시됩니다. 로컬 에셋이 가장 좋습니다. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | 이미지를 이 반경(포인트 단위)만큼 블러 처리합니다(디코딩 중 메인 스레드 밖에서 한 번만 적용됩니다). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | 로드된 이미지가 페이드 인되는 시간(밀리초 단위)입니다. |
| `tintColor` (스타일) | `.tint_color(..)` | `ColorValue` | | 템플릿 이미지(한 가지 색으로 그려진 아이콘)의 색을 바꿉니다. |
| `objectFit` (스타일) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | CSS의 `object-fit`(`object-*` 클래스)처럼 이미지가 박스에 맞춰지는 방식을 정합니다. `"cover"`는 박스를 채우고 넘치는 부분을 잘라내며, `"contain"`는 박스 안에 맞추고, `"fill"`는 늘려서 채우며, `"none"`는 원래 크기로 표시하고, `"scale-down"`는 같지만 박스보다 크면 맞게 축소합니다. |
| `objectPosition` (스타일) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | `objectFit`로 크기가 정해진 뒤 이미지가 박스 안에서 놓이는 위치를 CSS의 `object-position`(`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`)처럼 지정합니다. 박스를 덮는 이미지는 이 위치를 기준으로 잘립니다. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | 로딩이 시작되었습니다. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | 바이트 단위의 다운로드 진행 상황입니다(`total`는 알 수 없을 때 0이며), 최대 100ms마다 전달됩니다. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | 로드되었습니다. 원본 이미지의 픽셀 단위 크기를 전달하며(디코딩 및 다운샘플링된 크기가 아닙니다. SVG는 포인트 단위 크기이며, [웹에서는 브라우저가 측정한 값](../docs/images-and-assets.md#svg-images)입니다), 변형이 있는 이미지는 로드된 변형의 크기를 전달합니다. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | 로딩에 실패했습니다. 앱의 capabilities가 허용하지 않는 URL이면 `code`는 `"ERR_ACCESS_DENIED"`입니다. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | `onLoad` 또는 `onError` 이후에 호출됩니다. |

`ImageStyle`는 뷰 스타일에 템플릿 이미지(한 가지 색으로 그려진 아이콘)의 색을 바꾸는 `tintColor`와, 이미지를 박스 안에 배치하는 `objectPosition`를 추가합니다([Image position](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

## Events

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | 없음 | 로딩이 시작되었습니다. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | 바이트가 도착했습니다(최대 100ms마다). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | 이미지가 표시되었습니다. 원본 크기를 픽셀 단위로 전달합니다(SVG는 포인트 단위이며, [웹에서는 브라우저가 측정한 값](../docs/images-and-assets.md#svg-images)입니다). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, 메시지) | 로딩 또는 디코딩에 실패했거나, 호스트가 앱의 capabilities 밖에 있습니다(`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | 없음 | `onLoad` 또는 `onError` 이후에 호출됩니다. |

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

[픽셀 밀도 변형](../docs/images-and-assets.md#pixel-densities)이 있는 이미지는 파일 중 하나를 로드하며, `onLoad`는 그 파일의 픽셀 크기를 전달합니다. 예를 들어 64×64 포인트의 `logo.png`가 3× 화면에서 `logo@3x.png`를 로드하면 192×192가 전달됩니다. 픽셀 비율이 바뀌어 이미지가 다른 변형을 로드하면 그 로드도 함께 전달됩니다. `onLoadStart`가 호출되고, 이어서 새 파일의 크기와 함께 `onLoad`(또는 `onError`)가 호출된 뒤, `onLoadEnd`가 호출됩니다.

이미지를 표시하기 전에 크기를 알아내거나 미리 로드하려면, TSX에서는 `Image.getSize(src)`와 `Image.prefetch(src)`를 호출하고(엘리먼트를 렌더링하는 동일한 `Image`가 이 메서드들을 제공합니다. [Image API](../modules/nsh-image.md) 참고), Rust에서는 태스크 안에서 `image_size(src)`와 `prefetch_image(src)`를 await합니다. 변형이 있는 import된 이미지를 전달하면 `Image.getSize`와 `Image.prefetch`는 이 화면에 표시되는 변형을 로드하고, `getSize`는 import된 파일의 크기로 resolve됩니다(`logo.png`의 경우 64×64).

## Ref methods

자체 메서드는 없습니다.

## Platform notes

- 캐시 키에는 디코딩 크기와 블러 반경이 포함됩니다. 같은 URL을 두 가지 크기로 표시하면 디코딩은 두 번 하지만 다운로드는 한 번만 합니다.
- iOS는 애니메이션 이미지를 키프레임 애니메이션으로 재생하며(최대 600프레임), 틴트가 적용된 애니메이션 이미지는 첫 프레임만 표시합니다.
- Android는 API 28(`AnimatedImageDrawable`)부터 애니메이션 이미지를 재생하며, 캐시와 블러는 적용되지 않습니다.
- Android에서는 iOS와 마찬가지로 테두리가 이미지 위에 그려집니다.
