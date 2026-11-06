---
title: "Accordion"
description: "Accordion과 그 구성 요소: 제목 아래에서 펼쳐지고 접히는 세로 배치 섹션으로, 한 번에 하나 또는 여러 개를 열 수 있으며, 앱이 지정한 값에 따라 열리고, 요청 시 스프링 방식의 높이 전환으로 표시되며, 모든 외형은 앱이 직접 정합니다."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

Accordion은 제목 아래에서 펼쳐지고 접히는 섹션들을 쌓아 놓은 컴포넌트입니다: FAQ의 질문, 설정 페이지의 그룹, 결제 단계 등에 쓸 수 있습니다. 다섯 가지 파트로 이루어지며, 각 파트는 동작의 한 부분만 맡고 모양에는 관여하지 않습니다.

- `Accordion`, 스택: 앱의 `value`, 즉 열린 항목들의 value를 보관하고, 다음 값을 `onChange`로 알립니다. 한 번에 한 항목만 열리며, `multiple`를 쓰면 여러 항목이 열릴 수 있습니다.
- `AccordionItem`, 하나의 섹션: `value`로 식별됩니다. Accordion의 `value`에 포함되어 있는 동안 열려 있습니다.
- `AccordionHeader`, 항목의 제목: 스크린 리더가 읽어 주는 `level`을 가집니다.
- `AccordionTrigger`, 제목 안에서 항목을 펼치고 접는 버튼: 펼쳐져 있는지 여부를 알려 줍니다.
- `AccordionPanel`, 항목의 콘텐츠: 열려 있는 동안 표시됩니다. `reveal`을 쓰면 높이가 스프링처럼 열리고 닫힙니다.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

파트는 Rust의 `nsh-base` 크레이트인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 값은 앱이 소유합니다: 트리거를 누르면 `onChange`로 다음 `value`을 알리고, Accordion은 앱이 다시 전달한 value의 항목들을 엽니다. 각 파트는 자신을 둘러싼 파트를 스스로 찾으므로, 앱은 자유롭게 배치할 수 있습니다: 항목 사이의 구분선, 제목 안의 배지, 제목 앞의 아이콘 등. Rust에서는 `accordion()`, `accordion_item()`, `accordion_header()`, `accordion_trigger()`, `accordion_panel()`가 이들을 만들며, 속성마다 setter가 있고 내부 요소는 `.child(..)`로 지정합니다.

<a id="props"></a>

## 속성

<a id="accordion-1"></a>

### Accordion

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | 열린 항목들의 `value`. 앱이 소유합니다: 트리거를 누르면 `onChange`로 다음 값들을 알리고, Accordion은 앱이 다시 전달한 값의 항목만 열어 둡니다. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | 여러 항목을 동시에 엽니다: 하나를 열어도 나머지는 열린 채로 유지됩니다. 이 속성이 없으면 항목을 열 때 열려 있던 항목이 닫힙니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 모든 항목이 비활성화됩니다: 트리거가 누름을 받지 않으며, 스크린 리더는 각 항목이 흐리게 표시된(dimmed) 상태라고 알립니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 항목들, 그리고 앱이 항목 사이에 배치하는 요소(구분선). |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 스택의 레이아웃과 모양: 항목을 감싸는 카드, 항목 사이의 간격. |

### AccordionItem

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | 필수 | Accordion의 `value`에서 항목을 식별하는 값: 앱 자체의 id이며, 언어에 따라 바뀌는 제목은 절대 쓰지 않습니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 트리거가 누름을 받지 않으며, 스크린 리더는 흐리게 표시된 상태라고 알립니다. 열림/닫힘 상태는 Accordion의 `value`이 정한 대로 유지됩니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 항목의 header와 panel, 그리고 앱이 그 안에 배치하는 그 밖의 요소. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 섹션: 아래쪽 구분선, 둘러싸는 카드. |

### AccordionHeader

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | 스크린 리더를 위한, 페이지의 제목들 가운데 이 제목의 레벨(1이 최상위). |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 항목의 트리거, 그리고 header가 담는 그 밖의 요소(배지, 별도의 액션). |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 제목의 레이아웃. |

### AccordionTrigger

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | 없음 | 항목이 열려 있는 동안의 트리거 스타일로, `aria-expanded:` 클래스로 지정합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 자식에 그 내용을 말해 주는 텍스트가 없을 때 스크린 리더가 읽는 내용. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 제목과 chevron. 안쪽의 `group-aria-expanded:` 클래스는 트리거의 `class`에 `group`을 두면 트리거를 따라갑니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 트리거 자체: 사용자가 누르는 행. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | 없음 | 눌림, 호버, 포커스, 비활성 상태일 때의 트리거 스타일로, `<state>:` 클래스로 지정합니다. |

### AccordionPanel

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | `Collapsible`의 것과 같은 reveal로 열리고 닫힙니다: 패널이 콘텐츠를 클리핑하고, 높이가 0에서 콘텐츠 자체의 높이까지, 그리고 다시 0까지 임계 감쇠(약 265 ms, 오버슈트 없음)로 스프링처럼 움직이며, 뒤따르는 항목들이 함께 이동합니다. 동작 줄이기(reduced motion)가 켜져 있으면 즉시 열리고 닫힙니다. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | 항목이 닫혀 있는 동안에도 콘텐츠가 트리에 남아 있으며, 화면에서도 키보드 포커스에서도 스크린 리더에서도 보이지 않습니다: 비디오는 재생 위치를, 웹 뷰는 페이지를 유지합니다. 이 속성이 없으면 패널이 닫힐 때(reveal이 닫힌 뒤) 콘텐츠가 트리에서 제거되고, 다시 열리면 이전 상태 그대로 돌아옵니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 region을 부르는 이름: 보통 항목의 제목이며, header가 말하는 것과 같습니다. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | region의 레이아웃과 모양. `reveal`을 쓰면 닫힌 패널이 높이 0인 채 레이아웃에 남아 있으므로, 패딩과 테두리는 콘텐츠를 담은 뷰에 지정합니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | 트리거가 눌렸습니다: 탭, 클릭, 트리거에 키보드 포커스가 있을 때의 Space 또는 Return, 혹은 스크린 리더의 활성화. `value`는 적용될 경우의 열린 항목 value들입니다: 열린 항목의 value는 목록에서 빠지고, 닫힌 항목의 value는 끝에 추가되며, `multiple`이 없으면 기존 value를 대체합니다. 아무것도 바뀌기 전에 실행됩니다: 이를 반영하려면 `value`을 설정하세요. |

<a id="parts"></a>

## 구성 요소

| 파트 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 스택 | | `Accordion`의 `class`, `style` | |
| 항목 | 스택 | `AccordionItem`의 `class`, `style` | 앱의 value |
| 제목 | 항목 | `AccordionHeader`의 `class`, `style` | |
| 트리거 | 제목 | `AccordionTrigger`의 `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (또는 `expandedStyle`, `disabledStyle`, ...) |
| 제목 텍스트와 chevron | 트리거 | 각자의 요소(`children`) | `group-aria-expanded:`, `group-disabled:` (트리거의 `class`에 `group`을 지정) |
| 패널 | 항목, 제목 뒤 | `AccordionPanel`의 `class`, `style` | |
| 콘텐츠 | 패널 | 자체 요소(`children`) | |

`reveal`이 없으면 닫힌 패널은 레이아웃에서 빠지고 콘텐츠는 트리에서 제거됩니다. `reveal`이 있으면, 이 변화는 `value`을 바꾸는 커밋의 레이아웃 애니메이션이 됩니다(`LayoutAnimation.configureNext`처럼 네이티브로 실행되므로 움직이는 동안 JavaScript는 실행되지 않습니다). 열리는 패널은 높이가 0에서 콘텐츠의 높이까지 커지고, 닫히는 패널은 다시 줄어들며, 둘 다 같은 스프링을 쓰고 뒤따르는 항목들이 함께 이동합니다. 앱의 transition도 함께 적용됩니다: chevron이 회전합니다(`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## 비활성화

비활성화된 항목의 트리거는 누름을 받지 않고, 스크린 리더는 이를 흐리게 표시된 상태로 알립니다. 트리거의 `disabled:` 클래스와 그 안의 `group-disabled:`가 이를 따릅니다. Accordion의 `disabled`은 모든 항목을 비활성화합니다. 비활성화된 항목도 앱의 `value`이 말하는 대로 표시됩니다: 앱이 이를 열 수 있습니다.

<a id="accessibility"></a>

## 접근성

- 스택은 그룹이고, 각 header는 자신의 `level`을 가진 제목이며, 각 트리거는 그 안에서 항목이 펼쳐져 있는지 알려 주는 버튼입니다. 스크린 리더는 제목에서 제목으로 이동할 수 있습니다.
- 열린 패널은 `accessibilityLabel`으로 이름 붙은 region입니다. 닫힌 패널은 스크린 리더에서 숨겨지며, 유지되는 콘텐츠도 마찬가지입니다.
- 열린 항목의 모양은 앱이 정하며, 색상만으로 구분하게 해서는 안 됩니다: 예제처럼 chevron을 회전시키세요.

레이블, 역할, 안내 메시지에 대한 일반적인 내용은 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="keyboard"></a>

## 키보드

누름을 받는 뷰가 키보드 포커스의 정지 지점인 곳(macOS와 웹)에서는 각 트리거가 페이지 순서대로 정지 지점이 되며, Space와 Return으로 누를 수 있습니다. 비활성화된 트리거는 건너뛰며, 닫힌 패널의 콘텐츠도 건너뜁니다. Tab은 트리거에서 열린 패널의 컨트롤로, 이어서 다음 트리거로 이동합니다.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- 모든 플랫폼에서 열린 항목의 패널은 제목 아래에 표시되고, 닫힌 항목의 패널은 레이아웃에서 제외됩니다(`reveal`이 있으면 높이 0).
- `reveal`이 있으면 모든 플랫폼이 각자의 애니메이터로 패널 높이를 스프링처럼 움직이며(iOS, Android, macOS, Windows, Linux, GPUI, 웹), 시스템이 동작 줄이기를 요청하는 동안에는 즉시 열고 닫습니다.
- 각 플랫폼의 스크린 리더는 제목 읽기 방식에 따라 제목과 그 레벨을 읽고, 그 안의 트리거는 펼침 상태를 가진 버튼으로 읽습니다. iOS에서는 VoiceOver가 트리거 자체를 읽습니다.
- iOS, Android, Mac Catalyst: 트리거의 누름은 탭입니다. 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 클릭이며, macOS와 웹에서는 포커스된 트리거에서 Space 또는 Return도 사용할 수 있습니다.
