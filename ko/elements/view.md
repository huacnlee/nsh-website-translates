---
title: "View"
description: "기본 컨테이너 요소: 레이아웃, 배경, 테두리, 그림자, 누르기 처리 및 제스처를 지원합니다."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View`는 모든 화면의 기본 구성 요소입니다. 네이티브 컨테이너(iOS와 Mac Catalyst에서는 UIView, Android에서는 ViewGroup)로, 자식 요소를 flexbox 또는 grid로 배치하고, 배경, 테두리, 그림자, 그라디언트를 그리며, 누름(press)을 처리합니다. 버튼, 카드, 행, 화면 모두 view입니다. Rust에서는 `view()`로, TSX에서는 `nsh`의 `<View>`로 만듭니다.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

view는 flexbox로 자식 요소를 배치하며, 기본값은 다음과 같습니다: `flexDirection: "column"`, `flexShrink: 0`, `alignContent: "flex-start"`, `position: "relative"`. `display: "grid"`(Rust에서는 `.grid()`)는 CSS grid로 전환하고, `display: "block"`는 block 레이아웃으로 전환합니다. 크기 단위는 포인트입니다. [layout](../docs/layout.md)과 [style reference](../modules/style-reference.md)를 참고하세요.

`display: "flex"`는 CSS를 따릅니다. 스타일, `flex` 클래스, Rust의 `.flex()`에서는 방향(`flexDirection: "column"`, `flex-col`, `.flex_col()`)을 지정하지 않으면 row입니다. display를 지정하지 않은 view는 자식 요소를 column으로 쌓습니다.

## Props

`View`에는 자체 prop이 하나 있습니다. `selectable`(Rust에서는 `.selectable(true)`)로, view 안의 텍스트들이 하나의 선택으로 함께 선택됩니다([Text selection](./text-selection.md)). 나머지는 [common props](./index.md#common-props)입니다. 스타일(`style`, `class`, `classList`, Rust에서는 `Styled` 메서드), `disabled`, press prop(`onPress`, `onLongPress`, `onPressDown`, `onPressUp`, `delayLongPress`, `hitSlop`), 상태 스타일(`activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`, `onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, 제스처 prop(`pan`, `pinch`, `rotation` 및 해당 이벤트), 터치 및 responder prop, 접근성 prop, 그리고 `ios` / `android` / `desktop`가 있습니다.

## Selectable views

`selectable`를 지정하면 view 안의 [`Text`](./text.md) 요소와 [`TextView`](./text-view.md)에 걸쳐 읽기 순서대로 선택이 이어집니다. `selectable={false}`가 지정된 텍스트는 제외되며, 선택 가능한 view 안에 있는 또 다른 선택 가능한 view는 바깥 view의 일부로 취급됩니다. 플랫폼별 제스처는 [Text selection](./text-selection.md)을 참고하세요.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

## Press feedback

누를 수 있는 view는 press 핸들러가 있는 모든 view입니다. 피드백은 앱이 정의합니다. 손가락이 눌려 있는 동안 네이티브에서 적용되는 스타일이며, 앱 코드로의 왕복은 없습니다. `hoverStyle`, `focusStyle`, `disabledStyle`는 다른 상태에 대해 같은 방식으로 동작합니다.

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

Android에서는 `android={{ ripple: { color: "#0000001f" } }}`(Rust에서는 `.ripple(Ripple { .. })`)가 material ripple을 추가합니다(`borderless`, `radius`, `foreground`로 조정할 수 있습니다).

`disabled`는 네이티브 view에서 press 리스너를 제거하고(press도 피드백도 없음) disabled 스타일을 적용합니다.

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

## Events

| Event | Rust | Payload | When |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (Rust에서는 없음) | view 안에서 탭이 끝났습니다. |
| `onLongPress` | `.on_long_press` | `PressEvent` (Rust에서는 없음) | 손가락이 `delayLongPress`(500 ms) 동안 눌린 상태로 유지되었습니다. |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (Rust에서는 없음) | 손가락이 눌렸습니다 / 떼어졌거나 view를 벗어났습니다. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | 마우스가 view(또는 그 안의 view) 위로 들어왔습니다 / view나 창을 벗어났습니다([hover](./index.md#hover)). `onMouseLeave`의 값은 마지막 위치입니다. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | 버튼을 누른 상태이든 아니든 마우스가 view(또는 그 안의 view) 위에서 움직였거나, 마우스가 버튼을 누르지 않은 채 그 위에 머문 상태에서 수정자 키를 누르거나 뗐습니다: `position`, `pagePosition`(`Point`), `modifiers`, `pressedButton`(`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` 또는 `null`). 프레임당 최대 한 번 발생합니다. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | view 위에서 보조 버튼을 눌렀습니다([context menus](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | 없음 | 로컬 파일 드래그가 활성 데스크톱 대상에 들어왔습니다 / 벗어났습니다. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | 로컬 파일 또는 디렉터리가 데스크톱 대상에 드롭되었습니다. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | 부모 기준 프레임이 변경되었습니다. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | `pan`로 바인딩된 드래그가 시작되었습니다 / 종료되었습니다. 시스템이 취소하면 `cancelled`가 true입니다. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | `pinch`로 바인딩된 핀치가 시작되었습니다 / 종료되었습니다. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | `rotation`로 바인딩된 회전이 시작되었습니다 / 종료되었습니다. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | 사용자 지정 접근성 액션이 실행되었습니다. |

터치 및 responder 이벤트는 [common props](./index.md#raw-touches-and-the-responder-system)를 참고하세요.

## Desktop file drops

AppKit, GTK, Win32, GPUI에서 `onFileDrop`가 지정된 view는 다른 애플리케이션에서 드래그한 로컬 파일과 디렉터리를 받습니다. `onFileDragEnter`와 `onFileDragLeave`는 활성 대상을 추적하며, `onFileDrop`는 네이티브 파일 목록 순서대로 `{ uris: string[] }`를 받습니다. 각 항목은 공백과 ASCII가 아닌 문자가 이스케이프된 절대 `file:` URL입니다. 파일 시스템 경로가 필요하면 접두사를 직접 제거하지 말고 URL을 파싱하세요.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

`onFileDrop`를 수신하는 가장 가까운 활성 상위 요소가 드롭을 받습니다. modal 루트는 이 탐색의 경계가 됩니다. `disabled`는 파일 드래그/드롭 리스너를 제거하며, 벗어남, 취소, 완료, 대상 제거 시 활성 상태가 해제됩니다. 수락에는 Copy 작업과 마운트된 네이티브 상태가 사용됩니다. 받은 파일을 읽거나 열거나 전송할지는 앱이 결정합니다.

## Ref methods

일반 view의 ref는 `ViewRef`이며 `focus()`, `blur()`, `measure()`를 제공합니다. `ref`(Rust에서는 `.element_ref(&handle)`)는 해당 노드를 반환하며, 예를 들어 `setAccessibilityFocus`([`nsh`의 접근성 API](../modules/nsh.md#accessibility))에 전달하거나 측정(Rust에서는 `handle.measure()`)하는 데 사용할 수 있습니다.

## Views inside text

텍스트 안에 배치된 view는 인라인 첨부물입니다. 베이스라인에 놓이고 단어와 함께 줄바꿈되며, 자체적으로 press를 받습니다. [text](./text.md#inline-views-and-images)를 참고하세요.

## Platform notes

- `boxShadow`는 모든 플랫폼에서 그려지며, `android={{ elevation }}`는 대신 Android의 material 그림자를 적용합니다. Android에서 그림자에는 배경색이 필요합니다(배경이 투명한 view에는 그림자가 생기지 않습니다).
- view의 `filter`: iOS는 `opacity()`, 최대 1까지의 `brightness()`, `drop-shadow()`를 지원하며(이미지는 모든 컬러 필터와 `blur()`를 지원), Android는 API 31부터 모두 지원하고 그 이전에는 컬러 필터만 지원합니다.
- `backdropFilter: "blur(…)"`는 iOS에서는 시스템 material(근사치)이며, Android에서는 API 31이 필요합니다.
- Android는 `translate`, `scale`, `rotate` 변환을 그리며, 기울이기(`skew()`, `skewX()`, `skewY()`)는 다른 플랫폼에서 적용됩니다.
- `borderCurve: "continuous"`(`.border_curve(BorderCurve::Continuous)`)는 모서리가 가장자리로 부드럽게 이어지도록 그리며(iOS 앱 아이콘처럼), 두 플랫폼 모두에서 동작합니다.
- `cursor` 스타일은 포인터가 있는 환경(Mac Catalyst, 포인터를 사용하는 iPad, 데스크톱)에서 적용됩니다.
