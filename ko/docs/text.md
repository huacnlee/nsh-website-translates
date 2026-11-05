---
title: "텍스트"
description: "Rust와 TSX에서 text 요소로 텍스트 표시하기 - 중첩된 span과 링크, 인라인 뷰, 글꼴과 장식, 말줄임 처리, 시스템 텍스트 크기, 선택 및 onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# 텍스트

모든 텍스트는 text 엘리먼트가 표시합니다. Rust에서는 `text(..)`, TSX에서는 `<Text>`를 사용합니다. text 엘리먼트는 하나의 단락입니다. 레이아웃될 때 엔진 스레드에서 플랫폼의 텍스트 엔진(Apple 플랫폼에서는 CoreText, Android에서는 `StaticLayout`)이 조판하고, 그리기는 메인 스레드에서만 수행됩니다. 중첩된 text 엘리먼트는 별도의 뷰가 아니라 같은 단락의 span입니다.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> 문자열은 text 엘리먼트가 표시합니다. TSX에서는 `<View>` 안에 문자열을 직접 두면 표시되지 않습니다. `<Text>`로 감싸세요.

엘리먼트 자체는 [text](../elements/text.md)에 문서화되어 있으며, 이 페이지는 사용 방법을 다룹니다.

<a id="strings-and-whitespace"></a>

## 문자열과 공백

Rust에서 text의 내용은 문자열이며 작성한 그대로 표시됩니다. `\n`은 줄을 바꿉니다. 시그널을 읽는 내용은 클로저로 전달하며, 시그널이 변경되면 텍스트가 업데이트됩니다. TSX에서 JSX 텍스트는 React와 같은 규칙을 따릅니다. 각 줄의 앞뒤 공백은 제거되고, 공백만 있는 줄은 버려지며, 나머지 줄은 공백 하나로 연결됩니다. 한 줄 안의 공백은 유지되므로 `{first} {last}`의 공백은 그대로 남습니다. 줄의 시작이나 끝에 공백이 필요하면 `{" "}`를, 줄바꿈이 필요하면 `{"\n"}`을 사용하세요.

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

텍스트 안의 표현식은 읽는 값을 따라갑니다. `text(move || format!("{} items", count.get()))`와 `<Text>{count()} items</Text>`는 `count`가 변경되면 업데이트됩니다.

<a id="spans-and-inheritance"></a>

## Span과 상속

text 안의 text는 span입니다. span은 부모의 텍스트 스타일을 상속하고, 직접 지정한 값만 덮어씁니다.

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

텍스트 스타일은 CSS처럼 뷰에서도 아래로 전달됩니다. Rust의 `view().text_color(white()).text_sm()`과 TSX의 `<View class="text-white text-sm">`은 그 안에 있는 text와 input 엘리먼트의 스타일을 지정합니다.

<a id="links"></a>

### 링크

press 핸들러(`.on_press(..)` 또는 `.on_long_press(..)`, `onPress` 또는 `onLongPress`)가 있는 span은 링크입니다. 글자 위를 누르면 span이 이벤트를 받고, 그 밖의 곳을 누르면 단락이 받습니다. 중첩된 span의 링크도 동작합니다.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Span의 배경

span의 배경색과 모서리 반경은 span이 걸쳐 있는 각 줄에서 글자 뒤에 폰트 높이만큼의 박스를 그립니다. 텍스트 레이아웃은 달라지지 않고 복사도 통째로 이루어지므로, 인라인 코드는 span으로 만듭니다([Text element](../elements/text.md#span-backgrounds)).

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### 텍스트 안의 뷰와 이미지

text 안에 있는 text 이외의 모든 엘리먼트는 베이스라인에 맞춰 인라인으로 배치되며 단어와 함께 줄바꿈됩니다. 자체 press도 받을 수 있습니다.

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

`numberOfLines` 또는 말줄임표로 잘린 인라인 엘리먼트는 숨겨지며, 텍스트를 복사할 때도 제외됩니다. 인라인 엘리먼트 안의 텍스트는 CSS의 `color`가 인라인 블록에 적용되는 것처럼 주변 텍스트의 색상을 따릅니다. 단, 자체 색상을 지정한 경우(위의 `LIVE` 배지)는 제외입니다. 폰트와 줄 높이는 엘리먼트 자체의 값을 유지합니다.

스타일 키 `verticalAlign`은 CSS의 `vertical-align`이 이미지를 배치하는 것처럼 인라인 엘리먼트를 줄 안에 배치합니다. `"baseline"`(기본값)은 엘리먼트의 아래쪽을 베이스라인에 맞추고, `"text-top"`와 `"text-bottom"`은 엘리먼트의 위쪽 또는 아래쪽을 텍스트 폰트의 위쪽 또는 아래쪽에 맞추며, `"middle"`은 베이스라인에서 폰트 x 높이의 절반만큼 위에 가운데 정렬합니다. 엘리먼트가 폰트 범위를 벗어나는 경우 줄이 그만큼 늘어나며, `lineHeight`가 고정된 경우에도 마찬가지입니다. Android의 `ImageSpan`처럼 단락 시작 부분의 아이콘을 텍스트 아래쪽에 맞추려면 `"text-bottom"`를 사용합니다. 클래스는 `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle`이며, Rust에서는 `.align_text_bottom()` 및 같은 이름의 나머지 함수를 사용합니다.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## 텍스트 스타일

| 속성 | 값 | Rust |
|---|---|---|
| `color` | [색상](./styling.md#colors). 기본값은 검정 | `.text_color(..)` |
| `fontSize` | 포인트. 기본값 14 | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"`(400), `"bold"`(700) 또는 `100`–`900`(숫자 또는 문자열) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"`: 컬러 이모지는 기울어지지 않고 똑바로 유지됩니다 | `.italic()` |
| `fontFamily` | 시스템 폰트 패밀리, 제네릭 패밀리 또는 [가져온 폰트](./fonts.md) | `.font_family(..)` |
| `lineHeight` | 포인트 | `.line_height(px(..))` |
| `letterSpacing` | 포인트 | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"`: `left` 및 `right`은 오른쪽에서 왼쪽 방향에서도 각자의 쪽을 유지하고, `start` 및 `end`은 텍스트 방향을 따릅니다 | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"`: 박스보다 짧은 텍스트가 놓이는 위치 | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | 색상; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | 포인트 또는 `"auto"`(두께는 `"from-font"`도 가능) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | CSS의 `text-shadow`, 글리프 뒤에 그려지는 그림자: `"2px 2px 4px rgb(0 0 0 / 0.6)"`(오프셋, 블러, 색상) 또는 숫자로 된 레이어 `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]`. 레이어가 여러 개이면 가장 넓은 것으로 그려집니다 | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | OpenType 기능: `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"`: 단락의 기본 방향 | `.writing_direction(WritingDirection::Rtl)` |

text 엘리먼트는 뷰이기도 하므로 배경, 테두리, 모서리, 패딩 및 기타 [뷰 스타일](./styling.md)을 사용할 수 있습니다.

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums`은 모든 숫자의 너비를 동일하게 만들어, 카운터나 가격이 바뀔 때 흔들리지 않게 합니다.

<a id="truncation"></a>

## 잘라내기

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| 스타일 키 / prop | Rust | 설명 |
|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)` | 표시할 최대 줄 수. `0`(기본값)은 모든 줄을 표시합니다 |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | 들어가지 않는 텍스트를 자르는 방식: 끝에 말줄임표(`"ellipsis"`, 기본값), 시작에 말줄임표(`"ellipsis-start"`), 가운데에 말줄임표(`"ellipsis-middle"`) 또는 `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | 텍스트가 줄 수와 박스에 맞을 때까지 폰트를 줄입니다 |
| `minimumFontScale` | | `adjustsFontSizeToFit`이 줄일 수 있는 한계(0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Tailwind 클래스 `line-clamp-*`, `text-ellipsis`, `text-clip`는 같은 키를 설정하며, `truncate`(`.truncate()`)는 말줄임표로 잘리는 한 줄입니다. 스타일 키로 사용할 때는 상태 스타일과 variant도 지원합니다.

<a id="system-text-size"></a>

## 시스템 텍스트 크기

텍스트는 기본적으로 사용자의 텍스트 크기 설정(iOS의 Dynamic Type, Android의 글꼴 크기)을 따릅니다.

| Prop | Rust | 설명 |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false`는 크기를 고정합니다. 기본값 `true` |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | 적용되는 최대 배율. 예: `1.5`. `0`는 제한 없음 |

Rust의 `font_scale()`와 TSX의 [`nsh`](../modules/nsh.md#device)에서 가져오는 `fontScale()`는 현재 배율이며, 사용자가 설정을 변경하면 함께 바뀝니다. input도 `allowFontScaling`와 `maxFontSizeMultiplier`를 받습니다.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

배율을 끄는 것보다 제한하는 쪽을 권장합니다. 큰 텍스트는 많은 사람이 의지하는 접근성 설정입니다.

<a id="selection"></a>

## 선택

스타일 키 `userSelect: "text"`(`.select_text()`, 클래스 `select-text`)은 시스템 자체 텍스트 뷰처럼 사용자가 텍스트를 선택하고 복사할 수 있게 합니다. 길게 누르면 손가락 아래의 단어가 선택되고, 핸들로 선택 범위의 양 끝을 옮기며, 편집 메뉴에서 복사와 모두 선택을 사용할 수 있습니다(iOS는 조회, 번역, 공유가 추가되고 Android는 공유가 추가됩니다). 선택은 하나의 텍스트 블록 안에 머뭅니다. 스타일 키 `selectionColor`(`.selection_color(..)`, `selection:text-*`)은 강조 표시와 핸들의 색상을 지정합니다. 뷰에 설정한 `userSelect`은 그 안에서 값을 지정하지 않은 텍스트에 적용됩니다.

데스크톱 브라우저에서는 웹 페이지처럼 텍스트가 기본적으로 선택 가능합니다. 단, 버튼이나 누를 수 있는 행처럼 press 또는 touch 핸들러가 있는 뷰와 같은 상호작용 엘리먼트 안에서는 제외입니다. 그런 곳에서도 텍스트를 선택할 수 없게 하려면 `userSelect: "none"`(`.select_none()`, 클래스 `select-none`)을 사용하세요. 휴대폰과 태블릿 브라우저는 네이티브 규칙을 따릅니다.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

코드에서 복사하려면(복사 버튼 등) Rust에서는 `set_clipboard(..)`을, TSX에서는 [`Clipboard`](../modules/nsh.md#clipboard)을 사용하세요.

## onTextLayout

`onTextLayout`(Rust에서는 `TextLayout` 이벤트)은 레이아웃이 끝날 때마다 text의 콘텐츠 박스를 기준으로 배치된 줄 정보를 전달합니다.

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

각 줄에는 `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight`, `xHeight`가 있습니다(Rust에서는 `cap_height`과 `x_height`). 텍스트가 잘렸을 때만 "더 보기" 버튼을 표시하거나 다른 콘텐츠를 베이스라인에 맞출 때 사용하세요.

<a id="accessibility"></a>

## 접근성

text 엘리먼트는 스크린 리더가 그 내용을 그대로 읽습니다. 제목 역할을 하는 텍스트(`.role(AccessibilityRole::Header)`, `role="header"`)와 링크(`AccessibilityRole::Link`, `role="link"`)에는 role을 지정하세요. [접근성](./accessibility.md)을 참고하세요.

<a id="related"></a>

## 관련 문서

- [폰트](./fonts.md): 사용자 지정 폰트와 굵기.
- [text 엘리먼트](../elements/text.md): 모든 prop.
- [폼과 키보드](./forms-and-keyboard.md): 텍스트 입력.
