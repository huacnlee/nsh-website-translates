---
title: "Toast"
description: "Toast, ToastStack, ToastManager: gpui-base의 토스트와 같은 스타일 없는 토스트, 전환 상태를 가진 시맨틱 루트, 토스트를 레이어로 배치하는 스택, 그리고 헤드리스 수명 주기."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

토스트는 앱 위에 잠시 표시되는 짧은 메시지입니다: "Copied", "Draft deleted · Undo", "Could not send".
동작은 스타일이 없는 세 부분으로 `nsh/base`에서 제공하며, GPUI Kit의 `gpui-base` 구성과 같습니다.

- **`ToastManager`**: 토스트를 순서대로 유지하며 수명 주기를 관리합니다. 각 토스트는 처음에 `"starting"` 상태이고, 모션 지속 시간이 지나면 `"present"` 상태가 되며, 표시되어 있고 일시 중지되지 않은 동안 타임아웃이 줄어들고, 제거되기 전 exit 지속 시간 동안 `"ending"` 상태로 남습니다.
- **`ToastStack`**: 토스트를 측정하여 가장자리에서부터 배치하며, 가장 새로운 토스트가 가장자리에 가장 가깝습니다. 접힌 상태에서는 레이어가 겹치고, 펼친 상태(포인터가 위에 있거나 손가락이 닿아 있을 때)에서는 목록으로 배치되며, 스프링으로 움직입니다.
- **`Toast`**: 각 토스트의 루트입니다. `alert` 역할, 앱 스타일을 위한 `transitionStatus`, 닫기를 요청하는 스와이프, 그리고 토스트가 표시될 때 레이블을 읽어 주는 스크린 리더를 제공합니다.

모양과 콘텐츠는 앱의 몫이며, 어디서든 토스트를 표시하는 편의 기능도 마찬가지입니다. 앱은 이를 기반으로 직접 만듭니다(`toast(...)`). 갤러리가 그렇게 했고(`examples/gallery/toast.tsx`), GPUI Kit의 notifications도 `gpui-base`의 토스트 위에 구축되어 있습니다.

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`, `ToastStack`, `ToastManager` 모두 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. Rust에서는 `nsh_base`의 `toast`, `toast_stack`, `ToastManager`입니다.

## ToastManager

매니저는 헤드리스입니다. 아무것도 렌더링하지 않고 타이머도 실행하지 않습니다. 앱이 토스트를 push하고, `visible(limit)`의 반환값인 토스트를 상태와 함께 렌더링하며, 토스트가 하나라도 마운트되어 있는 동안 타이머로 `advance` 호출을 반복하고, 스택이 펼쳐져 있는 동안에는 `paused` 값을 전달합니다. Rust에서는 앱의 id와 값에 걸친 `ToastManager<I, T>` 형태로 제공되며 호출마다 `Instant` 하나가 함께 쓰입니다. TS에서는 문자열 id와 임의의 JSON 값에 대한 클래스이며, 엔진의 시계(테스트의 수동 시계 포함)를 사용합니다.

- `push(id, value, options)`: 가장 새로운 토스트를 추가하며, 같은 id가 있으면 교체합니다(교체된 토스트의 값을 반환). 표시 시간은 `options.timeout`(밀리초 단위)이고, 지정하지 않으면 닫을 때까지 남습니다.
- `dismiss(id)`: 토스트의 exit를 시작합니다. `dismissAll()`: 모든 토스트의 exit를 시작하고 그 id를 반환합니다.
- `advance(paused)`: 수명 주기를 진행하고 변경된 내용을 보고합니다: `presented`, `ending`(타임아웃이 끝난 것), `removed`(값 포함), `changed`.
- `visible(limit)`: 종료 중이 아닌 토스트 중 가장 최근 `limit`개와 종료 중인 토스트를 오래된 순으로 반환합니다. `entries()`(Rust `iter()`): 전체 토스트를 반환합니다. `get(id)`, `len()`, `isEmpty()`도 있습니다.

`ToastMotion`에는 둘 모두의 토큰이 들어 있습니다: `duration`(400 ms: enter의 마감 시간이자 스택의 스프링 응답), `exitDuration`(200 ms), `collapsedPeek`(14), `expandedGap`(14), `collapsedScaleStep`(0.05), `collapsedVisible`(3). 기본값은 Sonner의 값입니다(Rust에서는 `ToastMotion::sonner()`이고, TS에서 생략한 필드는 이 값을 유지합니다).

## ToastStack

스택의 자식은 토스트이며 오래된 것부터 나열합니다. `placement` 가장자리(기본값 `"topRight"`, 아래쪽 앵커는 위쪽으로 배치)에서부터, 접힌 토스트는 `collapsedPeek` 간격으로 겹치고, 뒤의 토스트일수록 `collapsedScaleStep`만큼 좁아지며, `collapsedVisible`만 표시됩니다. 펼치면 `expandedGap` 간격의 목록이 됩니다. 토스트가 도착하거나 사라질 때와 펼침은 임계 감쇠 스프링으로 움직입니다. 포인터가 스택 위에 있거나 손가락이 닿아 있는 동안(`onExpandedChange({ expanded })`; Rust `ToastStackState`, 이를 읽는 것은 `is_expanded()`) 펼쳐지므로, 앱은 사용자가 토스트를 읽거나 만지는 동안 타임아웃을 일시 중지합니다.

스택의 배치는 앱이 정합니다. 안전 영역 안쪽 가장자리의 [Overlay](./overlay.md)에 둡니다. `class` 및 `style` 값이 너비를 정합니다. 토스트를 가지고 있는 동안 Escape와 Android 뒤로 가기 버튼을 처리합니다(`onCancel`; `closeOnEscape={false}` 설정 시에는 앱의 나머지 부분에 맡김). 처리하면 가장 새로운 토스트를 닫습니다.

<a id="toast-1"></a>

## Toast

토스트는 앱의 콘텐츠를 감싸는 `alert` 역할입니다. 토스트의 `transitionStatus` 값은 매니저가 정하며, 상태 클래스는 `class` 위에서 이 값을 따릅니다. 첫 프레임에서 `"starting"`인 동안 `startingClass` 클래스가 적용되어, `transition` 클래스가 그 상태에서 애니메이션됩니다(Tailwind의 `starting:`, CSS의 `@starting-style`). `"ending"`인 동안에는 exit 지속 시간만큼 `endingClass` 클래스가 적용되고, 포인터로 스와이프하는 동안에는 `swipingClass` 클래스가 적용됩니다(손가락 아래에 유지하는 것은 `transition-none`).

손가락이나 마우스로 `swipeDirection` 방향(기본값 `"right"`, `null` 지정 시 스와이프 끔)으로 끌면 토스트가 움직입니다. 포인터가 실제로 움직인 뒤에야 움직이므로 토스트 안의 버튼은 계속 버튼으로 동작합니다. `swipeThreshold` 포인트(50)를 넘겨서 놓거나 플릭하면 밖으로 마저 나가며 닫기를 요청하고(`onDismissRequest`), 거기에 못 미치면 제자리로 돌아갑니다. 스크린 리더는 표시될 때 `accessibilityLabel` 값을 읽습니다.

## Toast props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | 수명 주기 단계입니다. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | 없음 | 첫 프레임, 종료 중, 스와이프 중일 때의 클래스입니다. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | 스와이프해서 치우는 방향입니다. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | 놓았을 때 닫기를 요청하기까지 스와이프해야 하는 거리입니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 표시될 때 스크린 리더가 읽는 내용입니다. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | 없음 | 사용자가 스와이프로 치웠습니다. |

## ToastStack props

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Sonner 값 | 모션 토큰입니다. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | 배치 기준이 되는 가장자리입니다. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | 토스트를 가지고 있는 동안 Escape와 뒤로 가기를 처리합니다. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | 없음 | 상호작용으로 펼쳐지거나 접혔습니다. |
| `onCancel` | `.on_cancel(..)` | `() => void` | 없음 | Escape 또는 뒤로 가기: 가장 새로운 토스트를 닫습니다. |
