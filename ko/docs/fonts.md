---
title: "글꼴"
description: "시스템 글꼴과 제네릭 패밀리, 폴백 목록, Rust 크레이트의 assets 또는 TSX import로 .ttf, .otf, .woff, .woff2 파일 배포하기, 여러 굵기와 이탤릭을 가진 패밀리, 그리고 타입이 지정된 스타일과 Tailwind 클래스에서의 글꼴 사용을 다룹니다."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# 글꼴

텍스트는 글꼴 패밀리를 지정하지 않으면 시스템 글꼴(iOS는 San Francisco, Android는 Roboto)을 사용합니다(Rust에서는 `.font_family(..)`, TSX에서는 `fontFamily`). 패밀리로는 제네릭 패밀리, 기기에 설치된 글꼴, 앱과 함께 배포하는 글꼴 파일을 지정할 수 있습니다.

<a id="system-and-generic-families"></a>

## 시스템 및 제네릭 패밀리

| `fontFamily` | 글꼴 |
|---|---|
| (없음), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | 시스템 글꼴 |
| `"serif"`, `"ui-serif"` | 시스템 세리프 글꼴(iOS는 New York, Android는 Noto Serif) |
| `"monospace"`, `"ui-monospace"` | 시스템 고정폭 글꼴(iOS는 SF Mono) |
| `"ui-rounded"` | 둥근 시스템 글꼴(SF Pro Rounded), iOS 전용 |

시스템 글꼴은 100부터 900까지 모든 굵기를 지원합니다. Tailwind의 `font-sans`, `font-serif`, `font-mono`은 처음 세 행에 대응하고, `font-sans`과 `font-mono`은 테마에 글꼴이 설정되어 있으면 해당 글꼴에 대응합니다([앱의 기본 글꼴](#a-default-font-for-the-app)).

기기에 설치된 패밀리는 이름으로 직접 지정할 수 있습니다(`"Georgia"`, iOS의 `"Avenir Next"`). 설치된 글꼴은 플랫폼과 버전에 따라 다르므로, 디자인이 의존하는 글꼴은 직접 배포하세요. iOS에서는 존재하지 않는 패밀리를 지정하면 로그에 경고(`font family 'X' is not available`)를 남기고 시스템 글꼴로 대체됩니다. 대체 글꼴을 직접 정하려면 목록을 지정하세요([대체 목록](#fallback-lists)).

<a id="shipping-a-font"></a>

## 글꼴 배포하기

Rust 크레이트는 `assets/` 디렉터리의 파일을 배포합니다. `#[native_module]` 함수에서 `registry.assets(assets!())`를 사용하면 모든 파일이 배포되며, `asset!("fonts/Pacifico-Regular.ttf")`는 `FontAsset`이고 그 `family`는 크레이트를 컴파일할 때 파일에서 읽어 온 글꼴의 패밀리 이름입니다. TSX에서는 `.ttf`, `.otf`, `.woff`, `.woff2` 파일을 import하면 해당 import는 글꼴의 패밀리 이름으로 평가됩니다. 어느 쪽이든 글꼴은 첫 프레임 이전에 등록되므로 텍스트가 처음 렌더링될 때 바로 사용할 수 있습니다. WOFF와 WOFF2 파일은 압축된 TrueType 또는 OpenType 글꼴입니다(WOFF2 파일은 TrueType 파일의 절반 정도 크기인 경우가 많아 앱 패키지와 웹 다운로드 용량을 줄여 줍니다). NSH는 모든 플랫폼에서 이 파일들을 그 안에 담긴 글꼴로 읽습니다.

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family`와 TSX import인 `Pacifico`은 문자열 `"Pacifico"`입니다. 이는 파일 이름이 아니라 글꼴 파일에 저장된 패밀리 이름(타이포그래픽 패밀리 이름, 없으면 패밀리 이름)입니다. 이름을 직접 쓰는 대신 에셋의 값을 사용하면 두 값이 항상 일치하며, 파일이 없거나 손상되면 Rust 빌드가 실패하고, import한 파일은 반드시 번들에 포함됩니다.

이 파일들은 다른 [에셋](./images-and-assets.md)과 마찬가지로 앱과 함께 배포됩니다. 글꼴은 앱 프로세스에서만 등록되며 기기에 설치되지는 않습니다.

> [!WARNING]
> TSX에서 값을 사용하지 않는 import는 TypeScript의 import elision으로 제거되며, 글꼴도 함께 사라집니다. (예를 들어 Tailwind 테마에서) 패밀리를 이름으로만 참조한다면 부수 효과를 위해 파일을 import하세요: `import "./fonts/Inter-Bold.ttf";`. Rust 크레이트는 `assets!()`를 통해 `assets/`의 모든 파일을 배포합니다.

<a id="fallback-lists"></a>

## 대체 목록

`fontFamily`는 CSS처럼 목록을 받습니다. 패밀리를 쉼표로 구분하고 선호하는 순서대로 나열하며, 공백이 있는 이름은 따옴표로 감싸도 되고 감싸지 않아도 됩니다(`"Brand, 'Noto Sans SC', sans-serif"`). 따옴표로 감싼 이름은 쉼표를 그대로 유지합니다(`'ACME, Inc'`). 텍스트는 플랫폼이 가진 첫 번째 패밀리로 표시되고, 그 패밀리에 없는 문자(다른 문자 체계, 기호)는 목록에서 해당 문자를 가진 다음 패밀리에서 가져오며, 그래도 없으면 시스템의 대체 글꼴에서 가져옵니다. 목록을 사용하면 라틴 문자만 지원하는 브랜드 글꼴과 어울리는 글꼴로 중국어를 표시하거나, 앱이 다운로드하는 글꼴이 도착하기 전까지 표시할 시스템 글꼴을 함께 지정할 수 있습니다.

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

각 플랫폼은 자체 글꼴 처리 방식으로 목록의 순서를 유지합니다. iOS와 macOS는 캐스케이드 목록, Windows는 글꼴 폴백(단락당 하나, 첫 번째 스타일의 목록), Linux는 Pango 패밀리 목록, 웹은 브라우저의 방식, GPUI는 GPUI의 폴백을 사용합니다. Android에서는 텍스트가 가진 첫 번째 패밀리로 표시되며, 그 패밀리가 앱이 등록한 글꼴이면 목록에서 그 뒤에 오는 등록된 글꼴이 대체 글꼴이 됩니다(Android 10 이상).

<a id="weights-and-italics"></a>

## 굵기와 이탤릭

하나의 패밀리는 보통 굵기와 스타일마다 하나씩 여러 파일로 구성됩니다. 사용하는 파일을 각각 배포하세요(Rust에서는 `assets/`에 넣고, TSX에서는 각각 import합니다). 이 파일들은 같은 패밀리 이름으로 등록되며, 굵기와 스타일에 따라 글꼴 면이 선택됩니다.

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

요청한 굵기와 정확히 일치하는 등록된 글꼴 면이 없으면 가장 가까운 면이 사용됩니다. 글꼴 면이 없을 때의 동작은 플랫폼마다 다릅니다.

| | iOS | Android |
|---|---|---|
| 글꼴 면이 없는 굵기 | 가장 가까운 등록된 면 | 가장 가까운 면, 해당되는 경우 Android의 합성 볼드 적용 |
| 이탤릭 면이 없는 이탤릭 | 직립 면(기울임 없음) | 직립 면을 기울인 버전 |

두 플랫폼에서 같은 결과를 얻으려면 사용하는 글꼴 면을 모두 배포하세요.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## 타입 스타일과 Tailwind 클래스에서의 글꼴

Rust에서 `.font_family(..)`는 스타일이 들어가는 모든 곳에서 에셋의 패밀리를 받으며, 굵기 메서드(`.font_weight(FontWeight::SEMIBOLD)`)가 글꼴 면을 선택합니다. 클래스를 사용하려면 `nsh.json`의 Tailwind 테마에 패밀리 이름을 지정하여 `font-*` 클래스로 사용하세요.

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

테마 항목이 없어도 임의의 패밀리를 사용할 수 있습니다: `font-[Pacifico]`. 굵기 클래스(`font-light`, `font-semibold`, `font-bold` 등)는 `fontWeight`와 마찬가지로 글꼴 면을 선택합니다. 뷰의 텍스트 스타일은 그 안의 텍스트에 전달되므로, 뷰에 `.font_family(INTER.family)` 또는 `<View class="font-body">`를 지정하면 화면 전체의 패밀리가 설정됩니다.

<a id="a-default-font-for-the-app"></a>

## 앱의 기본 글꼴

테마의 `font-sans`는 앱의 글꼴입니다. 자체 패밀리를 지정하지 않은 모든 텍스트는, 웹 페이지가 Tailwind의 `--font-sans`를 사용하는 것처럼, Rust 컴포넌트와 TSX 모두에서 이 글꼴로 그려집니다. `font-mono`는 `font-mono` 클래스와 `TextView` 안의 코드에 쓰이는 고정폭 글꼴입니다. 앱의 테마(`nsh.json`의 `"theme"`, [Rust](./rust.md#theme))에서 설정하고 위에서 설명한 대로 글꼴 파일을 배포하세요.

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

목록에서 제네릭이 아닌 첫 번째 패밀리가 글꼴이 되며, 첫 번째 패밀리가 제네릭(`system-ui`, `sans-serif`)이면 시스템 글꼴이 사용됩니다. 글꼴은 컨테이너에도 설정할 수 있으며, 그 안의 텍스트가 이를 상속합니다.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## 글꼴 기능

`fontVariant`는 글꼴의 OpenType 기능을 켭니다: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"`, `"small-caps"`(Rust에서는 `.tabular_nums()`, `.small_caps()` 등, [Text](./text.md#text-styles)). 글꼴에 해당 기능이 들어 있어야 하며, 시스템 글꼴에는 들어 있습니다.

<a id="related"></a>

## 관련 문서

- [Text](./text.md): 텍스트 스타일, 크기, 시스템 텍스트 크기 설정.
- [Tailwind](./tailwind.md#theme): 테마 키.
- [Images and assets](./images-and-assets.md): 앱의 파일이 배포되는 방식.
