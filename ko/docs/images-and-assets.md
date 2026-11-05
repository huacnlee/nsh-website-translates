---
title: "이미지와 에셋"
description: "Rust와 TSX에서 이미지 표시하기 - 앱의 에셋과 @2x 파일, SVG 이미지, 원격 URL, 리사이즈 모드, 플레이스홀더, 블러, 틴트, 로드 이벤트, 그리고 이미지 크기 읽기 또는 프리페치하기."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# 이미지와 에셋

image 요소(Rust에서는 `image(..)`, TSX에서는 `<Image>`)는 비트맵 또는 SVG 그림을 표시합니다. 앱과 함께 배포되는 파일이거나 URL에서 내려받은 이미지입니다. 이미지는 메인 스레드 밖에서 읽고 디코딩하며, 뷰가 표시하는 크기로 다운샘플링되어 캐시됩니다. 메인 스레드는 디코딩된 결과를 표시하기만 합니다.

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

요소의 props는 [image](../elements/image.md)에 정리되어 있습니다.

<a id="images-in-the-app"></a>

## 앱 안의 이미지

Rust 크레이트는 파일을 `assets/` 디렉터리에 보관합니다. `asset!("logo@2x.png")`(`assets/` 기준 상대 경로)는 `ImageAsset`, `{ url, size, scales }`이며 크레이트를 컴파일할 때 읽히고, 크레이트의 `#[native_module]` 함수 안의 `registry.assets(assets!())`는 디렉터리의 모든 파일을 앱과 함께 배포합니다. TSX에서는 이미지 파일을 모듈처럼 import합니다. import하면 `ImageAsset`, `{ url, size, scales? }`을 얻고, 번들러가 파일을 앱과 함께 배포합니다:

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

지원하는 파일: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic`, `.svg`([SVG 이미지](#svg-images)).

**크기는 포인트 단위입니다.** 파일 이름의 `@2x` 또는 `@3x` 접미사는 파일이 포인트당 2픽셀 또는 3픽셀임을 뜻하므로, 128×128 픽셀인 `logo@2x.png`는 64×64 포인트 에셋입니다. 접미사가 없으면 1픽셀이 1포인트입니다. 접미사가 붙은 이름의 파일은 그 파일만 표시되고, 접미사 없는 이름의 파일은 [픽셀 밀도 변형](#pixel-densities)이 있으면 그것을 표시합니다.

**고유 크기.** 에셋의 이미지는 스타일에서 너비나 높이를 비워 두면 고유 크기로 레이아웃되므로 `image(LOGO)`와 `<Image src={logo} />`에는 스타일이 필요 없습니다. 다르게 크기를 지정하려면 한 차원과 가로세로 비율, 또는 두 차원을 모두 설정하세요.

Rust에서는 파일이 없거나 손상되면 빌드가 실패하고, 파일이 바뀌면 크레이트가 다시 빌드됩니다. TSX에서는 에셋이 import하는 모듈 기준 상대 경로로 해석되고, 그 `url`은 앱의 루트(엔트리의 디렉터리) 기준 상대 경로입니다. `nsh build`은 이를 `out/assets/`에 복사하고, `nsh package`은 앱에 넣으며, 개발 중에는 개발 서버가 제공합니다.

> [!TIP]
> TSX에서 `src`은 `asset:/path` 문자열도 받지만, 배포가 보장되는 것은 import한 파일뿐입니다. import하지 않은 경로는 앱 디렉터리 전체를 제공하는 개발 서버에서는 동작하지만 패키징된 앱에는 없습니다. 사용하는 모든 이미지를 import하세요. Rust 크레이트는 `assets!()`을 통해 `assets/` 디렉터리 전체를 배포합니다.

<a id="pixel-densities"></a>

### 픽셀 밀도

파일 이름에 접미사를 붙이지 않고 그 옆에 더 높은 밀도의 버전을 두면, 앱이 화면에 맞는 것을 불러옵니다:

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

- `asset!`와 번들러는 접미사 없는 이름의 이미지에 대해 `@1.5x`, `@2x`, `@3x`, `@4x` 형제 파일을 찾습니다. `scales`은 이들을 나열하며, 이름 그대로의 파일은 1입니다. 형제 파일이 없는 이미지에는 scales가 없습니다(TSX에서는 `{ url, size }`로 import됩니다). 번들러는 찾은 형제 파일을 배포하고, `assets!()`는 디렉터리 전체를 배포합니다.
- 이미지는 화면의 픽셀 비율 이상인 가장 작은 스케일을 불러오고, 없으면 가장 큰 것을 불러옵니다. React Native와 같은 방식입니다. 1× 화면에서는 `logo.png`, 2× 화면에서는 `logo@2x.png`, 3× 휴대폰(및 2.625)에서는 `logo@3x.png`입니다. 웹에서는 해당 파일만 다운로드됩니다.
- 픽셀 비율이 바뀌면(창을 다른 화면으로 옮기거나 브라우저 확대/축소) 선택이 바뀌는 이미지는 다시 로드되며, [로드 이벤트](#load-events)도 발생합니다. 크기는 이름 그대로의 파일 크기(포인트)로 유지됩니다.
- 픽셀이 이름 그대로의 파일 크기에 스케일을 곱한 값과 다른 변형은 TSX에서는 빌드 경고를 받고 Rust에서는 빌드가 실패합니다.
- 밀도 접미사가 붙은 이름의 파일(`./logo@3x.png`, `asset!("logo@3x.png")`)은 그 파일만 사용됩니다.
- [SVG 이미지](#svg-images)는 어떤 비율에서도 화면에 맞게 그려지므로 변형을 배포하지 않습니다.

파일 하나만 두어도 됩니다. 필요한 가장 높은 밀도로 내보내고(모든 휴대폰에서 가장 선명하게 하려면 `@3x`) 접미사를 붙여 이름을 지으세요. 이미지는 디코딩할 때 화면에 맞게 다운샘플링됩니다. 변형을 쓰면 각 화면이 자신에게 맞는 파일을 다운로드하고, 디코딩하고, 보관할 수 있습니다.

<a id="svg-images"></a>

## SVG 이미지

`.svg` 파일도 다른 이미지처럼 import합니다. 포인트 단위 크기는 `width`과 `height`(또는 둘 중 하나와, 나머지는 `viewBox`의 가로세로 비율에서), 그것도 없으면 `viewBox`입니다. SVG의 CSS 픽셀 하나가 1포인트이며, `@2x` 접미사는 SVG 파일에 영향을 주지 않습니다.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

SVG는 표시되는 크기에서 선명합니다. 브라우저는 벡터로 그립니다. iOS, macOS, Android는 이미지가 로드될 때 뷰가 표시하는 크기에 맞춰 픽셀 단위로 그립니다(비트맵을 다운샘플링하는 것과 같으며, 이후 뷰가 커지면 이미지가 다시 로드될 때까지 그 그림이 확대됩니다). Windows, Linux, GPUI는 포인트당 4픽셀(한 변 최대 2048픽셀)로 한 번 그리고 각 뷰에 맞춰 스케일합니다. 나머지는 비트맵과 같습니다: `objectFit`, `tintColor`(SVG의 불투명한 도형을 통해 적용되므로 단색 아이콘이 테마를 따릅니다), 필터, `blurRadius`, 플레이스홀더, 로드 이벤트, `Image.getSize`, `Image.prefetch`. `onLoad`과 `Image.getSize`은 SVG의 크기를 정수 포인트로 보고하며, 이미지는 정확한 크기로 레이아웃됩니다. 원격 SVG 파일도 같은 다운로드와 [capability](./sandbox-and-capabilities.md) 검사를 거쳐 같은 방식으로 로드됩니다. NSH는 URL이 어떻게 끝나든 내용으로 SVG를 인식합니다(gzip 압축된 경우도 마찬가지, `.svgz`).

**네이티브 플랫폼이 그리는 것.** iOS, macOS, Android, Windows, Linux, GPUI는 하나의 렌더러(resvg)로 SVG를 그리므로 어느 플랫폼에서나 그림이 같게 보입니다: 도형과 경로, 채우기와 선, 그라디언트와 패턴, 클립 패스와 마스크, 불투명도, 필터, 변환. 텍스트(`<text>`), 애니메이션(SMIL 및 CSS), 포함된 이미지(`<image>`), HTML(`<foreignObject>`)은 브라우저에서 표시되며, 네이티브 플랫폼은 SVG의 나머지를 정지 상태로 그리고 `nsh build`이 이를 사용하는 파일을 알려 줍니다. 어디서나 같은 결과를 얻으려면 텍스트를 윤곽선(경로)으로 내보내세요.

**자체 완결형 그림.** 네이티브 플랫폼에서 SVG는 자신이 담고 있는 것만 그립니다. 참조하는 파일, URL, `data:` 이미지, 다른 문서는 제외됩니다. 네이티브 플랫폼은 메모리를 통제하기 위한 한도 안에서 원격 SVG를 포함해 SVG를 그립니다. 문서는 최대 16 MiB(압축된 문서는 압축을 푼 뒤 기준), 그림은 한 변 최대 8192픽셀이고 전체 4096 × 4096픽셀(64 MiB, 더 큰 그림은 더 작게 그려짐), 레이어(불투명도, 마스크, 클립 패스, 필터가 있는 그룹으로 렌더러가 따로 그림)는 동시에 최대 256 MiB입니다. 문서 또는 레이어 한도를 넘는 SVG는 `onError`와 함께 로드에 실패합니다.

**웹에서 보고되는 크기.** 브라우저가 SVG를 직접 측정합니다(import한 것이든 원격이든). `onLoad`과 `Image.getSize`은 SVG에 `width`과 `height`이 있으면 그 값을, 없으면 브라우저가 부여한 크기를 보고하며, 브라우저는 보통 기본값 300 × 150과 `viewBox`의 가로세로 비율에서 이를 도출합니다. import한 SVG는 모든 플랫폼에서 번들러가 정한 크기로 레이아웃됩니다. 어디서나 같은 크기가 보고되게 하려면 SVG에 `width`과 `height`을 지정하세요.

<a id="remote-images"></a>

## 원격 이미지

요소에 URL을 지정합니다. Rust에서는 문자열(바뀌는 값은 클로저), TSX에서는 URL 문자열입니다:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **원격 이미지에는 크기를 지정하세요.** 로드되기 전에는 크기를 알 수 없으므로, 너비와 높이(또는 둘 중 하나와 가로세로 비율)가 없으면 높이가 0으로 접힙니다.
- **배경색**은 이미지가 로드되는 동안 표시되며, 아니면 플레이스홀더(아래)를 사용하세요.
- 다운로드는 공유됩니다. 같은 URL을 표시하는 여러 뷰는 서로 다른 크기로 디코딩하더라도 한 번만 다운로드합니다. 더 이상 기다리는 곳이 없는 다운로드는 취소됩니다.
- 디코딩된 이미지는 URL, 디코딩 크기, 블러 반경을 키로 메모리에 캐시됩니다(캐시는 메모리 압박 시 비워집니다).
- 앱이 [capabilities](./sandbox-and-capabilities.md)를 선언하면 이미지의 호스트가 `network` 아래에서 허용되어야 하며, 거부된 이미지는 error 이벤트와 함께 실패합니다.

<a id="kept-on-disk"></a>

### 디스크에 보관

다운로드한 이미지는 서버가 보낸 그대로 디스크에도 보관됩니다. 그래서 다시 열린 앱(아바타와 사진이 가득한 대화, 피드)은 이전에 표시한 이미지를 다시 다운로드하지 않고, 오프라인에서도 표시합니다. 앱에 설정은 필요 없습니다. `http://` 또는 `https://` URL의 모든 이미지는 iOS, Android, macOS, Windows, Linux, GPUI에서 캐시를 거치며, 브라우저에서는 브라우저 자체의 HTTP 캐시가 같은 일을 합니다.

캐시는 서버의 HTTP 캐싱 헤더를 따릅니다:

- 응답에 `Cache-Control: no-store`이 없으면 이미지를 보관합니다.
- 신선한 동안에는 요청 없이 사용됩니다. `max-age` 동안, 없으면 `Expires`까지, 그것도 없으면 `Last-Modified` 이후 경과 시간의 10분의 1 동안(최대 일주일)입니다.
- 그 후에는 서버에 확인합니다(`If-None-Match`에는 `ETag`, `If-Modified-Since`에는 `Last-Modified`). 변경되지 않은 이미지(`304`)는 다시 다운로드하지 않고 재사용하며, 변경된 이미지는 교체됩니다.
- 요청이 실패하거나(네트워크 없음) 서버에 오류(`5xx`)가 있으면, 응답에 `must-revalidate` 또는 `no-cache`이 있지 않은 한 보관된 사본이 표시됩니다.

각 앱은 256 MiB의 자체 캐시를 가지며, 이를 넘으면 가장 오래 사용되지 않은 이미지부터 삭제됩니다. 한 앱의 여러 뷰, 서피스, 프로세스가 안전하게 공유합니다. 임베딩하는 앱은 위치와 크기를 선택하거나 캐시를 끌 수 있습니다:

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

`CacheLocation::Off`(`.off`, `noDiskCache()`)은 디스크에 아무것도 보관하지 않습니다.

기본적으로 캐시는 시스템의 캐시 디렉터리에 있습니다. iOS에서는 `Library/Caches/nsh`, Android에서는 캐시 디렉터리의 `nsh`, macOS에서는 `~/Library/Caches`, Windows에서는 `%LOCALAPPDATA%`, Linux에서는 `$XDG_CACHE_HOME`(`~/.cache`)이며, 각 앱은 그 안의 `<app id>/images`에 있습니다. 시스템은 공간이 필요하면 이 디렉터리를 지울 수 있습니다.

<a id="resize-modes"></a>

## 리사이즈 모드

`objectFit` 스타일, 즉 CSS의 `object-fit`(Rust에서는 `.object_fit(..)`)는 이미지가 다른 모양의 상자를 어떻게 채울지 결정합니다:

| 값 | 결과 |
|---|---|
| `"cover"` (`ResizeMode::Cover`, 기본값) | 가로세로 비율을 유지하며 상자를 채우고, 넘치는 부분은 잘라냅니다 |
| `"contain"` (`ResizeMode::Contain`) | 가로세로 비율을 유지하며 상자 안에 맞추고, 빈 띠를 남깁니다 |
| `"fill"` (`ResizeMode::Stretch`) | 상자를 정확히 채우며 이미지를 왜곡합니다 |
| `"none"` (`ResizeMode::Center`) | 고유 크기이며 `objectPosition`에 배치됩니다(기본은 가운데) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | 고유 크기이며, 더 큰 경우 맞게 축소됩니다 |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

Tailwind 클래스 `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down`은 같은 스타일을 설정합니다.

<a id="image-position"></a>

### 이미지 위치

크기가 정해진 이미지가 상자 안 어디에 놓일지는 `objectPosition` 스타일(Rust에서는 `.object_position(..)`, `.object_top()` 등)이 정하며, CSS의 `object-position`입니다. 기본값은 가운데입니다. 상자를 덮는 이미지는 이 위치를 중심으로 잘리고, 안에 맞춘 이미지는 빈 띠 안에서 움직입니다. 키워드(`"top"`, `"left bottom"`), 백분율과 길이(`"25% 75%"`, `"10px 0"`), 오프셋이 있는 가장자리(`"right 10px bottom 20%"`)를 받습니다. 채팅 말풍선의 세로로 긴 사진은 이렇게 하면 윗부분이 보입니다:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

Tailwind 클래스는 Tailwind의 것을 그대로 씁니다: `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right` 및 임의 값(`object-[25%_75%]`).

<a id="styling-images"></a>

## 이미지 스타일링

이미지는 뷰이므로 모서리 반경(모서리별 지정도 가능), 테두리, 그림자, 불투명도, 변환을 받습니다. 모서리는 이미지를 클립합니다.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **틴트**(Rust에서는 `.tint_color(..)`, TSX에서는 `tintColor` 스타일)는 이미지의 불투명한 픽셀을 다시 색칠합니다. 테마를 따르는 단색 아이콘에 사용하세요.
- **필터**(`.grayscale(..)`, `.sepia(..)`, `.blur(..)`, TSX에서는 `filter`)는 두 플랫폼 모두에서 이미지에 적용됩니다([필터](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## 플레이스홀더, 페이드, 블러

| Prop | Rust | 설명 |
|---|---|---|
| `placeholder` | `.placeholder(..)` | `src`가 로드될 때까지 표시되는 이미지로, URL 또는 에셋입니다. 로컬 에셋이 가장 좋습니다 |
| `fadeDuration` | `.fade_duration(ms)` | 로드된 이미지가 페이드 인되는 시간(밀리초). 기본값은 iOS에서 0, Android에서 300 |
| `blurRadius` | `.blur_radius(px(..))` | 이미지를 이 반경(포인트)으로 블러 처리하며, 디코딩할 때 한 번 적용됩니다 |

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

## 애니메이션 이미지

애니메이션 GIF, WebP, APNG 파일은 에셋이든 URL이든 자동으로 재생됩니다. 같은 스타일을 받으며 `objectFit`도 포함됩니다. 틴트가 적용된 애니메이션 이미지는 iOS에서 첫 프레임만 표시됩니다.

<a id="load-events"></a>

## 로드 이벤트

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | 로드 시작 |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }`(바이트 단위, 알 수 없으면 `total`은 0) | 다운로드 중이며 최대 100 ms마다 |
| `onLoad` | `.on_load(..)` | `{ size }` | 이미지가 준비됨. 소스의 크기(픽셀, SVG는 포인트 단위이며 [웹에서는 브라우저가 측정한 값](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }`(Rust에서는 `&str`) | 로드 또는 디코딩 실패 |
| `onLoadEnd` | `.on_load_end(..)` | | `onLoad` 또는 `onError` 이후 |

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

load 이벤트는 디코딩된 크기가 아니라 소스 이미지의 크기를 보고합니다.

[픽셀 밀도 변형](#pixel-densities)이 있는 이미지는 파일 중 하나를 로드하며, load 이벤트는 그 파일의 픽셀을 보고합니다. 3× 화면에서 `logo@3x.png`는 192×192이고, `Image.getSize(logo)`는 import한 파일의 64×64로 결정됩니다. 픽셀 비율이 바뀌어 이미지가 다른 변형을 로드하면, 그 로드도 이벤트를 보고합니다. `onLoadStart`, 이어서 새 파일의 크기와 함께 `onLoad`(또는 `onError`), 그다음 `onLoadEnd`입니다.
<a id="an-images-size-and-prefetching"></a>

## 이미지 크기와 프리페치

화면에 없는 이미지도 미리 크기를 측정하고 불러올 수 있습니다. Rust에서는 `image_size(..)`와 `prefetch_image(..)`, TSX에서는 (요소를 렌더링하는 것과 같은 `Image`에서) `Image.getSize`와 `Image.prefetch`을 사용합니다.

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

| Rust | TSX | 반환값 |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | 이미지의 픽셀 단위 크기(SVG는 포인트 단위이며, [웹에서는 브라우저가 측정한 값](#svg-images)). 불러올 수 없으면 오류 |
| `prefetch_image(src)` | `Image.prefetch(src)` | 이미지의 바이트를 불러온 뒤에는 반환값 없음. 불러올 수 없으면 오류 |

TSX에서 `src`은 URL 문자열 또는 가져온(import한) 이미지입니다. [변형](#pixel-densities)이 있는 가져온 이미지의 경우, 두 함수 모두 이 화면에서 뷰가 불러오는 변형을 불러오며, `getSize`은 가져온 파일의 크기를 반환합니다. 두 함수 모두 내려받은 바이트를 이후 해당 이미지를 표시하는 뷰를 위해 보관하므로, 표시되기 전에 프리페치한 이미지는 다운로드 없이 나타납니다.

흔한 사용 예는 원격 이미지의 종횡비에 맞춰 크기를 정하는 것입니다.

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

## 기타 에셋

| 파일 | Rust (`asset!`) | TSX import | 페이지 |
|---|---|---|---|
| `.ttf`, `.otf`, `.woff`, `.woff2` | 패밀리 이름을 가진 `FontAsset` | 폰트의 패밀리 이름 | [폰트](./fonts.md) |
| `.json` 및 기타 파일 | URI를 가진 `FileAsset` | `.json`: 파싱된 값이 스크립트에 번들됩니다 | [프로젝트 구조](./project-structure.md#modules) |

폰트는 두 경우 모두 첫 프레임 전에 등록됩니다.

<a id="reading-a-file-at-run-time"></a>

### 실행 중에 파일 읽기

`fetch` 호출은 앱이 포함해 배포한 파일을 `asset:/` URL로 읽으며, TSX와 Rust 모두에서, 모든 플랫폼에서 동일하게 동작합니다. 가져온 이미지는 자신의 URL(`url`)을 가지고 있고, Rust 크레이트의 파일 URL은 `asset!`(`FileAsset::uri`)과 `assets!()`에서 얻습니다.

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

엔진은 앱의 파일에서 해당 파일을 자신의 스레드 밖에서 읽으며(`nsh run` 중에는 개발 서버에서 읽음), 앱 자신의 파일이므로 별도의 capability가 필요하지 않습니다. 웹 앱은 페이지가 미리 로드하지 않은 파일을 에셋을 제공하는 위치에서 다운로드합니다. 응답은 파일의 바이트를 담은 `200`이며, `Content-Length`와 확장자에 따라 정해지는 `Content-Type`(`image/png`, `application/json` 등)를 가지고, 파일이 어떤 경로로 전달되었든 그 `url`은 `asset:/` URL입니다. 앱이 포함하지 않은 파일은 해당 파일을 명시한 네트워크 오류로 거부됩니다. URL은 앱 파일 내부의 경로로 파일을 지정하며, 요청은 `GET`(또는 `HEAD`)로 파일을 읽습니다. 경로가 앱 파일 밖으로 벗어나는 URL(`..`, 절대 경로)과 다른 메서드를 사용하는 요청도 파일을 읽거나 다운로드하기 전에 같은 방식으로 거부됩니다.

<a id="a-modules-own-url"></a>

### 모듈 자신의 URL

TSX에서 `import.meta.url`은 해당 코드가 작성된 모듈의 URL이므로, `new URL("./data.json", import.meta.url)`은 그 옆에 있는 파일을 가리킵니다. 로컬 또는 패키징된 데스크톱 앱의 모듈은 앱 디렉터리 안의 `file:` URL을 가지며, `fs/promises`은 `${pluginDir}` 권한이 부여된 경우에 이를 읽습니다. 웹 앱의 모듈은 페이지의 URL을 가지고, 패키징된 모바일 앱의 모듈은 가져온 이미지와 같은 `asset:/` URL을 가집니다. 이미지를 앱에 포함하려면 import하세요. 이런 방식으로 만든 URL은 파일을 가리킬 뿐, 패키징하지는 않습니다.

비트맵 이미지는 `draw_image` / `drawImage`([Canvas](./canvas.md))로 캔버스에 그릴 수도 있으며, 그라디언트는 많은 장식용 이미지를 대체할 수 있습니다([스타일링](./styling.md#gradients)).

<a id="related"></a>

## 관련 문서

- [image 요소](../elements/image.md): `getSize`, `prefetch`를 포함한 모든 prop.
- [리스트](./lists.md): 이미지가 많은 긴 리스트는 뷰를 재활용합니다.
