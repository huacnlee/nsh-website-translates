---
title: "ColorPicker"
description: "ColorPicker 컴포넌트와 그 구성 요소: 채도 및 명도 영역에서 색상을 선택하고, RGB, HSL, HSB, OKLCH의 모든 채널과 알파 슬라이더로 조절하며, 모든 CSS 형식으로 직접 입력하거나, 견본(swatch)에서 고르거나, 스포이트(eyedropper)로 화면에서 직접 추출할 수 있습니다. 스크린 리더를 위해 WAI-ARIA의 키 조작과 조정 가능한 요소를 지원하며, 레이아웃과 스타일은 앱에서 지정합니다."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

컬러 피커는 하나의 색을 가지며, 그 안의 파트들이 이를 표시하고 변경합니다. 채도와 밝기를 나타내는 `ColorArea`, RGB, HSL, HSB, OKLCH의 모든 채널과 알파를 조절하는 `ColorSlider`, 색을 텍스트로 받거나 한 채널을 숫자로 받는 `ColorField`, 프리셋 색상의 `ColorSwatch`, 화면 어디서든 색을 고르는 `ColorEyeDropper`가 그 파트입니다. 앱은 파트 사이에 자체 요소를 두어 배치하고(채널마다 글자가 붙은 행, `Tabs`로 고르는 색 공간, `Popover` 안의 피커), 각 파트의 스타일을 지정합니다. 파트는 채널의 색을 그리고, 크기, 반경, 테두리, 그림자는 모두 앱이 정합니다.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch`, `ColorEyeDropper`는 [`nsh/base`](../modules/nsh-base.md), 즉 Rust의 `nsh-base` crate에서 제공됩니다. Rust에서 `color_picker()`와 각 파트의 함수는 prop마다 setter(`.channel(..)`, `.thumb_style(..)`), 이벤트마다 리스너 메서드(`.on_change(..)`), 타입이 지정된 스타일 메서드로 구성됩니다. 색은 `Hsla`이고, 색 공간, 채널, 형식은 각각 `ColorSpace`, `ColorChannel`, `ColorFormat`입니다.

<a id="value"></a>

## 값

색은 CSS 색입니다. 16진수(`#3b82f6`, 알파를 포함한 `#3b82f680`), `rgb()`, `hsl()`, `hsb()`, `oklch()` 또는 CSS 이름을 쓸 수 있으며, Rust에서는 `Hsla`입니다. 앱은 `value`로 색을 소유하고 `onChange`가 보고하는 값을 설정합니다. 이는 `nsh/base`의 모든 컨트롤과 같습니다. 또는 `defaultValue`로 색을 피커에 맡기고도 변경 사항을 수신할 수 있습니다.

- `onChange({ value, formatted })`는 사용자가 요청한 각 색을 보고합니다. 영역이나 슬라이더를 드래그하는 매 단계, 키를 누를 때마다, 필드에 숫자를 입력하는 동안, 스와치를 눌렀을 때입니다. `value`는 색이고, `formatted`는 `format`가 지정한 방식(`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` 또는 `"oklch"`)으로 쓴 같은 색으로, 저장하거나 토큰으로 설정할 수 있는 상태입니다.
- `onChangeEnd({ value, formatted })`는 변경이 끝난 색을 한 번 보고합니다. 포인터를 뗄 때, 키를 누를 때마다, 필드를 벗어나거나 제출할 때, 스와치를 눌렀을 때입니다.
- 피커는 각 색 공간의 색을 사용자가 설정한 그대로 유지합니다. 회색은 색조와 채도를 유지하므로 색조 슬라이더는 사용자가 둔 위치에 그대로 있습니다. OKLCH에서 편집한 색은 입력한 명도, 채도(chroma), 색조를 sRGB가 표시할 수 있는 범위를 넘어서도 유지합니다(보고되는 색은 sRGB가 표시하는 가장 가까운 색이며, `"oklch"`의 `formatted`는 채널을 그대로 유지합니다).
- 앱이 설정한 `value` 중 피커가 보고하지 않은 값은 모든 색 공간의 색을 대체합니다.

<a id="spaces-and-channels"></a>

## 색 공간과 채널

| `colorSpace` | 채널 (`channel`) | 범위 |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0~255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | 색조 0~360, 나머지 0~100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | 색조 0~360, 나머지 0~100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | 명도 0~100 (0.1 단위), 채도(chroma) 0~0.4 (0.001 단위), 색조 0~360 (0.1 단위) |
| 모든 공간 | `"alpha"` | 0~100 |

슬라이더의 트랙은 다른 채널을 고정한 상태에서 해당 채널의 색을 그리므로, 각 값이 어떤 색으로 이어지는지 보여 줍니다. 색 공간에 없는 채널을 지정하면 그 공간의 첫 번째 채널이 사용됩니다(경고가 표시됩니다).

<a id="props"></a>

## 속성

<a id="colorpicker-1"></a>

### ColorPicker

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 없음 | 색(제어 모드). 앱은 `onChange`가 보고하는 값을 설정합니다. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | `value`가 설정되지 않은 동안의 초기 색. 이 경우 피커가 자체적으로 색을 유지합니다. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | `formatted`가 색을 쓰는 방식. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 어떤 파트에서도 변경할 수 없습니다. `disabled:` 클래스가 피커와 그 파트에 적용됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 파트와 그 사이에 있는 앱의 요소. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 피커 자체: 파트를 둘러싼 열(또는 행). |

### ColorArea

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 영역을 채우는 패널. 색조의 색을 표시하며, 채도는 왼쪽에서 오른쪽으로(오른쪽에서 왼쪽 레이아웃에서는 오른쪽에서 왼쪽으로), 밝기는 아래에서 위로 변하고, 모서리에 맞게 잘립니다. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 색의 위치에 중앙 정렬되는 썸. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 썸의 배경이 해당 색이 됩니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 포인터, 키보드, 스크린 리더로 변경할 수 없습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 썸에 대해 스크린 리더가 읽는 내용. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 영역: 크기는 앱이 정합니다. |

### ColorSlider

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | 채널의 색 공간. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | 변경할 채널. 색 공간의 채널 중 하나이거나 `"alpha"`입니다. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | 트랙의 방향. 가장 작은 값이 시작 쪽(왼쪽, 오른쪽에서 왼쪽 레이아웃에서는 오른쪽) 또는 아래쪽에 있습니다. 슬라이더를 만들 때 읽습니다. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트랙: 그 위에 채널의 색이 펼쳐지며 모서리에 맞게 잘립니다. 썸은 트랙 위에 놓입니다. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 값의 위치에 중앙 정렬되는 썸. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | 썸의 배경이 해당 색이 됩니다(알파 슬라이더에서는 알파 포함). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 없음 | 트랙 아래 체커보드의 색. 알파 슬라이더의 색 사이로 비쳐 보입니다. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 체커보드 정사각형 한 변의 길이. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 포인터, 키보드, 스크린 리더로 변경할 수 없습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 썸에 대해 스크린 리더가 읽는 내용. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 슬라이더: 트랙을 둘러싸고 누름과 드래그를 받는 띠. |

### ColorField

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | 없음 | 숫자로 받는 채널. 지정하지 않으면 필드는 색 전체를 텍스트로 받습니다. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | `channel`의 색 공간. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | 필드가 색 전체를 쓰는 방식. 모든 CSS 형식을 읽을 수 있습니다. |
| `placeholder` | `.placeholder(..)` | `string` | 없음 | 필드가 비어 있는 동안 표시됩니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 입력할 수 없습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 필드에 대해 스크린 리더가 읽는 내용. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<TextStyle>` | 없음 | 필드, 즉 텍스트 입력. |

채널 필드는 숫자를 입력하는 동안 색을 변경하며, 값은 채널의 범위로 제한됩니다. 색 전체 필드는 필드를 벗어나거나 제출할 때, 텍스트를 색으로 읽을 수 있으면 색을 변경합니다. 필드를 벗어나면 값이 해당 형식으로 다시 쓰입니다.

### ColorSwatch

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | 없음 | 표시할 색. 누르면 주변 피커에서 이 색이 선택됩니다. 지정하지 않으면 피커 자체의 색을 표시하는 미리보기가 됩니다. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | 없음 | 피커의 색일 때의 스타일. `selected:` 클래스로 지정합니다. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | 없음 | 반투명한 색 아래의 체커보드. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | 정사각형 한 변의 길이. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누를 수 없습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 16진수 색상 | 스크린 리더가 읽는 내용. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 색 위에 표시되는 콘텐츠. 선택된 스와치의 체크 표시(`group-selected:`). |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 스와치: 크기, 모양, 테두리를 정하며, 모서리가 색을 잘라 냅니다. |

### ColorEyeDropper

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | 누를 수 없습니다. 플랫폼에 스포이트가 없는 경우에도 비활성화됩니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 읽는 내용. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 내용: 앱의 아이콘 또는 레이블. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 버튼. |

누르면 시스템의 스포이트가 표시됩니다. macOS에서는 AppKit의 color sampler, 웹에서는 브라우저의 `EyeDropper`(Chrome과 Edge)입니다. 선택한 색이 피커의 색이 되며(`onChange` 다음 `onChangeEnd`), Escape를 누르면 아무 색도 선택되지 않습니다. 플랫폼에 스포이트가 없으면 버튼이 비활성화되고, `disabled:hidden`를 사용하면 해당 플랫폼에서 버튼이 숨겨집니다.

<a id="events"></a>

## 이벤트

| 이벤트 | 대상 | Rust | 페이로드 | 시점 |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 사용자가 색을 변경했을 때. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | 변경이 끝났을 때. 변경당 한 번. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | 스와치를 눌렀을 때. 팔레트의 칩처럼 단독으로도 동작합니다. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | 사용자가 화면에서 색을 선택했을 때. 단독으로도 동작합니다. |

Rust에서 `ColorPickerEvent::Change(Hsla, SharedString)`와 `ColorPickerEvent::ChangeEnd(Hsla, SharedString)`는 색과 그 `formatted` 텍스트를 전달합니다.

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 |
|---|---|---|
| `ColorArea` | 피커 안 | `class`, `style` |
| 영역의 패널 | 영역 안, 영역을 채움 | `panelClass`, `panelStyle` |
| 영역의 썸 | 영역 안, 색의 위치에 중앙 정렬 | `thumbClass`, `thumbStyle` |
| `ColorSlider` | 피커 안 | `class`, `style` |
| 슬라이더의 트랙 | 슬라이더 안 | `trackClass`, `trackStyle` |
| 슬라이더의 썸 | 슬라이더 안, 트랙 위 값의 위치에 중앙 정렬 | `thumbClass`, `thumbStyle` |
| `ColorField` | 피커 안 | `class`, `style` |
| `ColorSwatch` | 피커 안 또는 단독 | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | 피커 안 또는 단독 | `class`, `style` |

슬라이더의 썸은 트랙의 양 끝에 중앙 정렬되므로, 채널의 양 끝 값에서는 썸의 절반이 트랙 밖으로 나갑니다. 슬라이더에 썸 너비의 절반만큼 패딩을 주면(`h-3` 트랙 둘레의 `h-6 justify-center px-2.5`) 썸 전체가 슬라이더 안에 머물며, 양 끝에서도 누름을 받을 수 있습니다. 파트가 나타내는 상태는 다음과 같습니다. 썸은 드래그 중일 때 `active:`, 키보드 포커스가 있을 때 `focus:`, 스와치는 `selected:`, 그리고 모든 파트에 `disabled:`가 있습니다.

<a id="keyboard"></a>

## 키보드

macOS와 웹에서 각 썸은 키보드 포커스(Tab)의 정지 지점입니다.

| 키 | 슬라이더에서 | 영역에서 |
|---|---|---|
| Right, Up | 한 단계 증가 | Right: 채도 증가, Up: 밝기 증가 |
| Left, Down | 한 단계 감소 | Left: 채도 감소, Down: 밝기 감소 |
| Shift와 방향키 | 열 단계 | 열 단계 |
| Page Up, Page Down | 열 단계 | 밝기 열 단계 |
| Home, End | 채널의 양 끝 | |

오른쪽에서 왼쪽 레이아웃에서는 가로 슬라이더와 영역이 오른쪽에서 시작하며, 가장 작은 값(가장 낮은 채도)이 오른쪽 끝에 있습니다. Left는 한 단계 증가, Right는 한 단계 감소이고, 누르거나 드래그하면 그려진 그대로 포인터 아래의 값이 선택됩니다. 세로 슬라이더는 Right와 Up이 계속 한 단계 증가이며, 영역의 Up과 Down은 밝기를 그대로 유지합니다.

스와치는 Space와 Return을 받습니다. 각 키는 `onChange` 다음 `onChangeEnd`를 보고하며, 방향키는 누르고 있는 동안 반복됩니다.

<a id="accessibility"></a>

## 접근성

- 영역의 썸과 각 슬라이더의 썸은 조절 가능한 요소(`"adjustable"`, 브라우저에서는 slider)이며 레이블, 값, 범위를 가집니다. 스크린 리더의 증가와 감소 동작으로 값을 조절할 수 있습니다.
- 각 필드는 레이블이 있는 텍스트 필드이고, 각 스와치는 버튼입니다. 스와치는 피커의 색일 때 선택된 상태가 되며, `accessibilityLabel`로 이름을 지정하지 않으면 16진수 색상이 이름이 됩니다. 스포이트는 앱이 지정한 레이블이 있는 버튼입니다.
- 비활성화되면 스크린 리더는 파트가 흐리게 표시된다고 알리며, 파트는 어떤 동작도 받지 않습니다.

레이블, 역할, 동작에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="platform-notes"></a>

## 플랫폼 참고

- 모든 플랫폼은 앱이 지정한 스타일을 그대로 그립니다. 트랙과 패널의 색은 플랫폼이 그리는 그라디언트입니다. 누름과 드래그는 마우스, 펜, 손가락 모두 코어에서 추적하며, 피커를 둘러싼 스크롤 뷰는 다른 곳에서 시작한 드래그에 대해서만 스크롤을 유지합니다.
- `ColorEyeDropper`는 macOS에서는 AppKit의 color sampler로, 웹에서는 브라우저의 `EyeDropper`로 색을 선택하며, 색은 sRGB로 전달됩니다.
