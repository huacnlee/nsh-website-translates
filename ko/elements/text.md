---
title: "Text"
description: "텍스트를 그리는 요소입니다: 중첩 span, 링크, 줄 수 제한, 글꼴 크기 조정, 인라인 뷰, 텍스트 레이아웃 이벤트를 다룹니다."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Text

`Text`는 단락을 그립니다. 문자열을 보여주는 요소이며, `View`의 자식으로 넣은 문자열은 아무것도 그리지 않습니다. 단락은 네이티브로 조판되고(iOS와 Mac Catalyst에서는 CoreText, Android에서는 `StaticLayout`) 엔진 스레드에서 측정되므로, 메인 스레드는 그리기만 합니다. Rust에서는 `text(content)`로, TSX에서는 `nsh`의 `<Text>`로 만듭니다.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)`는 문자열, `SharedString`, 시그널 또는 클로저(`text(move || format!("{} items", count.get()))`)를 받습니다. 클로저나 시그널을 쓰면 읽고 있는 값이 바뀔 때 텍스트가 제자리에서 갱신됩니다.

## Spans

text 안의 text는 별도의 뷰가 아니라 같은 단락의 스팬입니다. 스팬은 단락의 텍스트 스타일(`color`, `fontSize`, `fontWeight` 등)을 상속하고, 스팬에서 지정한 값은 덮어씁니다. 블록 전체가 하나의 네이티브 뷰입니다. Rust에서 `text(..)`는 자신의 content를 먼저 보여주고 그다음 자식을 보여줍니다. `.child(text(..))`는 스팬을 추가하고, `.child("…")`는 일반 run을 추가합니다.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

### Span backgrounds

배경이 있는 스팬은 글자 뒤에 글자들의 박스를 채웁니다. 박스의 높이는 줄 높이와 상관없이 폰트의 높이(baseline 위의 ascent와 아래의 descent)와 같습니다. 스팬이 여러 줄로 줄바꿈되면 각 줄에 해당하는 부분이 스팬의 corner radius를 가진 별개의 박스가 됩니다. 스팬 안의 스팬은 자체 배경을 지정하지 않으면 바깥 스팬의 배경을 공유합니다. 배경은 그리기에만 영향을 줍니다. 텍스트 레이아웃은 배경이 없을 때와 같고, 선택 가능한 텍스트는 스팬의 글자를 나머지와 함께 복사합니다. 인라인 코드는 스팬입니다.

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Tailwind 클래스도 같은 방식으로 동작합니다: `<Text class="bg-gray-100 rounded">`. 패딩과 테두리는 박스 스타일이므로 스팬에는 적용되지 않습니다. 스팬 양옆에 여백이 필요하면 스팬 안에 공백을 넣으세요.

### Links

press 핸들러가 있는 스팬은 링크입니다. 스팬의 글자를 누르면 스팬이, 그 밖의 곳을 누르면 단락이 press를 받습니다.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

### Inline views and images

text 안의 다른 모든 요소(뷰, 이미지, 스팬 안에 있는 것도 포함)는 인라인 attachment입니다. attachment는 자신의 크기대로 배치되고, baseline에 놓이거나(또는 `verticalAlign` 스타일이 지정한 위치에 놓입니다: CSS처럼 `"text-top"`, `"text-bottom"`, `"middle"`; 줄은 attachment를 담도록 늘어납니다) 단어와 함께 줄바꿈됩니다. attachment는 자체적으로 press를 받습니다.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` 또는 말줄임표로 잘린 attachment는 숨겨집니다. 선택 가능한 텍스트를 복사할 때 attachment는 제외됩니다.

### Whitespace

JSX 텍스트는 React의 규칙을 따릅니다. 텍스트의 양 끝을 제외하고 각 줄은 앞뒤 공백이 제거되고, 공백만 있는 줄은 버려지며, 남은 줄은 공백 하나로 이어 붙여집니다. 한 줄 안의 공백은 유지됩니다(`{a} {b}`은 공백을 유지합니다). 스팬 앞이나 뒤에 공백이 필요하면 `{" "}` 또는 문자열 표현식을 쓰세요. Rust 문자열은 작성한 그대로 그려집니다.

## Props

[공통 props](./index.md#common-props)(`style`는 `TextStyle` 타입) 외에 다음이 있습니다.

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | 표시할 최대 줄 수. `0`은 모든 줄을 표시합니다. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | `numberOfLines`에 맞지 않는 텍스트를 자르는 방식. 끝, 시작 또는 중간에 말줄임표를 넣거나, 그냥 잘라냅니다. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | 시스템 텍스트 크기 설정을 따릅니다. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | 시스템 배율의 상한. `0`은 상한이 없음을 뜻합니다. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | 텍스트가 지정한 줄 수(`numberOfLines`)와 박스에 맞을 때까지 폰트를 줄입니다. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | `adjustsFontSizeToFit`이 줄일 수 있는 최대 정도(0..1, 최소 0.1). |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"`: 사용자가 텍스트의 범위를 선택할 수 있습니다. 길게 누르면 단어가 선택되고, 핸들로 범위를 넓히며, 편집 메뉴로 복사합니다. `"auto"`는 텍스트를 둘러싼 뷰들의 설정을 따릅니다. 아무 설정도 없으면 텍스트는 선택할 수 없습니다. 단, 데스크톱 브라우저에서는 인터랙티브 요소 안에 있지 않은 한 선택할 수 있으며, `"none"`은 그곳에서도 선택할 수 없게 유지합니다. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | 플랫폼의 accent | 선택 영역의 하이라이트와 핸들. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | 매 레이아웃 후 배치된 줄들. |

Tailwind 클래스 `select-text`, `select-none`, `select-auto`는 `userSelect`을, `line-clamp-*`는 `numberOfLines`를, `text-ellipsis`과 `text-clip`은 `textOverflow`을 설정하며, `truncate`는 말줄임표로 잘리는 한 줄입니다. 선택 영역의 하이라이트와 핸들은 스타일 키 `selectionColor`(`selection:text-*`)을 사용하며, 기본값은 플랫폼의 accent입니다.

## Text styles

`TextStyle`는 뷰 스타일에 다음을 추가합니다: `color`, `fontSize`, `fontWeight`(`"normal"`, `"bold"` 또는 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow`(CSS의 `text-shadow`), `fontVariant`, `writingDirection`, `numberOfLines`, `textOverflow`. Rust에서는 `Styled` 메서드입니다: `.text_color(..)`, `.text_size(..)`(또는 `.text_sm()`, `.text_lg()` 등), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` 및 나머지. [style reference](../modules/style-reference.md#textstyle)와 [text](../docs/text.md)를 참고하세요.

폰트 패밀리는 시스템 패밀리이거나 앱의 폰트 파일입니다.

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

폰트는 첫 프레임 전에 등록됩니다. [fonts](../docs/fonts.md)를 참고하세요.

## Events

| Event | Rust | Payload | When |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | 단락이 레이아웃될 때마다. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (Rust에서는 없음) | [view](./view.md#events)와 같습니다. 스팬에서는 스팬의 글자에 대한 press입니다. |
| `onLayout` | `.on_layout` | `{ bounds }` | 블록의 frame이 바뀌었을 때. |

`TextLayoutLine`는 텍스트의 content box 안에서의 `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`입니다.

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust는 `measure_text(..)`로 레이아웃하기 전에 문자열을 측정합니다.

## Ref methods

자체 메서드는 없습니다.

## Platform notes

- 선택은 하나의 텍스트 블록(하나의 text와 그 스팬들) 안에서만 유지됩니다. iOS는 편집 메뉴(복사, 모두 선택, 찾아보기, 번역, 공유)를, Android는 플로팅 툴바(복사, 모두 선택, 공유)를 표시합니다.
- 실선 한 줄이 아닌 텍스트 장식(`double`, `dotted`, `dashed`, `wavy`)은 iOS에서 NSH가 직접 그립니다.
- iOS의 텍스트는 단색 배경과 바깥쪽 그림자를 그립니다.
- [`nsh`](../modules/nsh.md#device)의 `fontScale()`(Rust에서는 `font_scale()`)는 현재 시스템 텍스트 배율을 알려줍니다.
