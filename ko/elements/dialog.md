---
title: "Dialog"
description: "Dialog 컴포넌트: 다른 모든 요소 위에 표시되는 모달 표면으로, 전체 화면 플로우, 시트, 앱에서 직접 스타일을 지정하는 다이얼로그에 사용합니다."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Dialog는 앱의 나머지 부분 위에 자체 네이티브 윈도우 레이어로 콘텐츠를 표시합니다. iOS와 Mac Catalyst에서는 presented view controller, Android에서는 Dialog, 데스크톱과 웹에서는 전체 윈도우 위의 레이어입니다. 전체 화면 플로우, 시트, 대화상자에 사용합니다. 시스템 고유의 제스처(시트를 아래로 스와이프, Android 뒤로 가기 버튼, Escape)가 동작하며, 이는 네이티브에서 결정됩니다. Rust에서는 `nsh_base::dialog()`로, TSX에서는 `nsh/base`의 `<Dialog>`로 만듭니다.

Dialog는 동작을 직접 관리하고 모양은 앱에 맡깁니다. Dialog의 스타일은 팝업(자식을 담는 뷰)에 적용되며, TSX에서는 `backdropClass` / `backdropStyle`로 그 뒤에 백드롭을 추가할 수 있습니다.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

TSX에서 Dialog는 `open`이(가) `false`이(가) 아닐 때 표시되고 `false`이(가) 되면 닫힙니다. Rust에서는 뷰에 있는 동안 표시되고 뷰에서 사라지면 닫히므로, `when`이(가) 이를 보유합니다. 어느 쪽이든 Dialog는 자신의 safe-area 인셋을 콘텐츠에 전달하며, 그 안에서 [`env(safe-area-inset-*)`](./safe-area.md) 변수와 `safeAreaInsets()`(Rust 컴포넌트에서는 `cx.insets()`)이 이를 읽습니다. 역시 `nsh/base`에서 가져오는 [`Button`](./button.md)은 앱이 스타일을 지정하는 프레스 타깃입니다.

`nsh_core::prelude`에는 더 오래된, 지원 중단된 `dialog` 함수도 있습니다. 위와 같이 `nsh_base::dialog`을(를) 이름으로 import하면 명시적 import가 그것을 대체합니다. 시스템의 알림 또는 액션 시트가 필요하면 [`AlertDialog`](./alert-dialog.md)을 사용하세요.

## Props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `open` | 열려 있는 동안 뷰에 존재(`when(open, ..)`) | `boolean` | `true` | true인 동안 표시됩니다. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | 나타나고 사라지는 방식입니다. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 없음 | `animation` 대신 WGSL 셰이더를 통해 나타나고 사라집니다. `nsh.progress`이(가) `duration`밀리초(기본값 350) 동안 0에서 1까지 진행되는 동안 `shade(uv)`은(는) 뒤에 있는 내용을 `sample_from`로, Dialog를 `sample_to`로 읽으며, 닫힐 때는 1에서 0으로 돌아갑니다. 시스템이 모션 감소를 요청하면 자체 `animation`을(를) 사용합니다. [Shader](./shader.md)를 참고하세요. |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | iOS에서의 형태입니다. `fullScreen`은(는) 투명한 배경으로 화면을 덮고, `pageSheet`와(과) `formSheet`은(는) 뒤에 있는 내용이 계속 보이는 시스템 시트입니다(`formSheet`은(는) 큰 화면에서 가운데에 표시되는 더 작은 시트입니다). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape와 Android 뒤로 가기 버튼이 네이티브에서 Dialog를 닫습니다. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | 백드롭을 누르면 닫힙니다. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | 시트를 아래로 스와이프하면(iOS, 휴대폰 브라우저) 네이티브에서 닫힙니다. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | 없음 | iOS와 Android에서 Dialog가 열려 있는 동안의 상태 표시줄이며, 페이지의 상태 표시줄보다 우선합니다([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | 나타나는 동작이 끝났습니다. |
| `onClose` | `.on_close(..)` | `() => void` | | 사라졌습니다. 사용자가 닫았거나 앱이 제거했습니다. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | 사용자가 닫으려고 시도했습니다(Escape, 뒤로 가기, 백드롭 누르기, 아래로 스와이프). `closeOn*` 플래그가 닫기를 허용했는지와 관계없이 호출됩니다. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | 사용자가 닫았습니다. 여기서 `open`을(를) 동기화하세요. Rust에서는 `on_cancel`이(가) Dialog를 뷰에서 제거합니다. |
| `class`, `style` | `Styled` 메서드 | `string`, `StyleProp<ViewStyle>` | | 팝업, 즉 자식을 담는 뷰입니다. |
| `backdropClass`, `backdropStyle` | Dialog를 채우는 자식 뷰 | `string`, `StyleProp<ViewStyle>` | | 팝업 뒤에서 Dialog를 채우는 백드롭이며, 둘 중 하나라도 설정되면 존재합니다. |
| `children` | `.child(..)` | `JSX.Element` | | 콘텐츠입니다. |

| `ios` 키 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | 프레젠터의 값 | Dialog가 허용하는 방향입니다. |

| `android` 키 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | 콘텐츠가 상태 표시줄 아래까지 확장됩니다. 그렇지 않으면 그 아래에서 시작합니다. |

<a id="opening-and-closing"></a>

## 열기와 닫기

Dialog의 상태는 앱이 소유합니다. 사용자가 Dialog를 닫으면(Escape, Android 뒤로 가기 버튼, 백드롭 누르기, 시트 아래로 스와이프) Dialog는 네이티브에서 닫히고 앱에 알리며, 앱은 그에 맞게 상태를 설정합니다. TSX에서는 `onOpenChange({ open: false, reason })`, Rust에서는 `on_cancel`입니다. TSX에서 `open`이(가) `true`인 동안 Dialog는 닫힌 상태로 유지되고, `open`이(가) `false`에서 `true`(으)로 바뀌면 다시 열립니다.

각 `closeOn*` 플래그는 사용자가 동작할 때 네이티브에서 읽습니다. 메인 스레드는 앱 코드를 기다리지 않기 때문입니다. 닫기 전에 확인하려면 플래그를 `false`(으)로 설정하세요. 그러면 닫기 시도가 `onCancel`을(를) 호출하고, 앱이 직접 Dialog를 닫습니다(TSX에서는 `open`을(를) `false`(으)로 설정하고, Rust에서는 뷰에서 제거합니다).

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel`은(는) 플래그가 Dialog를 닫도록 허용했는지와 관계없이 모든 시도마다 호출됩니다.

<a id="a-dialog-with-a-backdrop"></a>

## 백드롭이 있는 Dialog

기본 `fullScreen` 프레젠테이션의 Dialog는 앱이 그린 것을 표시합니다. 여기서는 어두워진 백드롭과 그 위 가운데에 놓인 카드입니다. 백드롭을 누르면 닫힙니다.

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

시스템의 알림 또는 액션 시트가 필요하면 `nsh/base`의 [`AlertDialog`](./alert-dialog.md)을 사용하세요.

<a id="ref-methods"></a>

## Ref 메서드

없음.

<a id="platform-notes"></a>

## 플랫폼 참고

- iOS와 Mac Catalyst: `presentation`이(가) 형태를 결정합니다. `fullScreen`은(는) 투명한 배경으로 전체 화면 위에 표시되고, `pageSheet`와(과) `formSheet`은(는) 시스템 배경을 가진 시스템 시트이며 아래로 스와이프할 때 손가락을 따라갑니다(`closeOnSwipe`).
- Android: Dialog가 윈도우를 채우고 앱의 팝업과 백드롭을 표시합니다. 뒤로 가기 버튼은 스택과 `BackHandler` 리스너보다 먼저 가장 위의 Dialog로 전달됩니다.
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: Dialog는 전체 윈도우 위의 투명한 레이어이며 앱의 팝업과 백드롭을 표시합니다. Escape는 닫기 시도입니다.
- `supportedOrientations`은(는) iOS용이고, `statusBarTranslucent`은(는) Android용입니다. Android Dialog의 콘텐츠는 `statusBarTranslucent`이(가) 설정되지 않으면 상태 표시줄 아래에서 시작합니다.
