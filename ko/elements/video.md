---
title: "Video"
description: "Video 요소: 자체 컨트롤 또는 시스템 컨트롤을 사용한 네이티브 비디오 재생."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# Video

Video 뷰는 플랫폼의 플레이어로 비디오 파일이나 스트림을 재생합니다. iOS와 Mac Catalyst에서는 AVPlayer를, Android에서는 MediaPlayer를 사용합니다. 재생은 props(`paused`, `muted`, `rate`, …)로 제어하므로, 플레이어는 다른 뷰와 마찬가지로 상태를 따라갑니다. Rust에서는 `video(url)`로, TSX에서는 `nsh`의 `<Video>`로 만듭니다.

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let paused = signal(true);
    let time = signal(String::new());
    let player = element_ref();
    view()
        .gap_3()
        .child(
            video("https://example.com/clip.mp4")
                .element_ref(&player)
                .paused(paused)
                .repeat(true)
                .object_fit(ResizeMode::Contain)
                .h(px(220.0))
                .bg(black())
                .on_progress(move |p: &VideoProgress| {
                    time.set(format!("{:.1} / {:.1} s", p.current_time, p.duration))
                }),
        )
        .child(
            view()
                .flex_row()
                .gap_4()
                .child(
                    text(move || if paused.get() { "Play" } else { "Pause" })
                        .on_press(move || paused.update(|p| *p = !*p)),
                )
                .child(text("Restart").on_press(move || player.seek(0.0)))
                .child(text(move || time.get())),
        )
}
```

```tsx tabs
import { signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  const paused = signal(true);
  const time = signal("");
  let video!: VideoRef;
  return (
    <View style={{ gap: 12 }}>
      <Video
        ref={video}
        src="https://example.com/clip.mp4"
        paused={paused()}
        repeat
        style={{ height: 220, backgroundColor: "#000000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
      />
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Text onPress={() => paused.set(!paused())}>{paused() ? "Play" : "Pause"}</Text>
        <Text onPress={() => video.seek(0)}>Restart</Text>
        <Text>{time()}</Text>
      </View>
    </View>
  );
}
```

TSX에서는 `src`가 필수입니다([Video API](../modules/nsh-video.md) 참고). [웹 뷰와 비디오 가이드](../docs/web-view-and-video.md)도 참고하세요.

## Props

Video는 [뷰](./view.md)의 props를 모두 받으며(자식은 가질 수 없습니다), 다음 props가 추가됩니다.

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | 비디오의 URL입니다(Rust에서는 에셋의 `uri`도 가능합니다: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | 재생이 일시정지됩니다. |
| `muted` | `.muted(..)` | `boolean` | `false` | 소리가 나지 않습니다. |
| `volume` | `.volume(..)` | `number` | `1` | 0..1. |
| `rate` | `.rate(..)` | `number` | `1` | 재생 속도입니다. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | 끝에 도달하면 처음부터 다시 재생합니다. |
| `controls` | `.controls(..)` | `boolean` | `false` | 플랫폼의 재생 컨트롤을 표시합니다. |
| `objectFit` (스타일), `object-*` 클래스 | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 비디오가 자신의 영역에 맞춰지는 방식으로, CSS의 `object-fit`와 같습니다(`class="object-cover"`). iOS, macOS, Android는 `"none"`와 `"scale-down"`를 `"contain"`로 재생하고, Linux는 둘 다 `"scale-down"`로 재생합니다. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | `onProgress` 이벤트 사이의 간격(밀리초)입니다. |

비디오의 크기는 스타일로 지정하며, 스타일이 지정한 크기가 그대로 적용됩니다. 비디오 고유의 비율을 사용하려면 `onLoad`가 보고하는 크기로 종횡비를 설정하세요.

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 발생 시점 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | 없음 | 로딩이 시작되었습니다. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | 비디오가 준비되었습니다. 길이(초)와 크기(픽셀)를 전달합니다. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | 재생 중 `progressUpdateInterval`마다 발생합니다(초 단위). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | 데이터를 기다리느라 재생이 멈추었거나 다시 시작되었습니다. |
| `onEnd` | `.on_end` | 없음 | 재생이 끝에 도달했습니다(`repeat`와 함께 사용하면 매 반복이 끝날 때마다 발생합니다). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, 메시지) | 로딩 또는 재생에 실패했습니다. 앱의 capabilities가 허용하지 않는 소스인 경우 `code`는 `"ERR_ACCESS_DENIED"`입니다. |

```rust tabs
let ratio = signal(16.0_f32 / 9.0);

video(url)
    .w_full()
    .aspect_ratio(ratio)
    .on_load(move |info: &VideoInfo| {
        ratio.set(info.size.width.0 as f32 / info.size.height.0 as f32)
    })
```

```tsx tabs
const ratio = signal(16 / 9);
<Video src={url} style={{ width: "100%", aspectRatio: ratio() }} onLoad={(e) => ratio.set(e.size.width / e.size.height)} />;
```

<a id="ref-methods"></a>

## Ref 메서드

| 메서드 | Rust | 설명 |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | 지정한 시간으로 이동합니다. |

## Capabilities

앱이 [capabilities](../docs/sandbox-and-capabilities.md)를 선언하면 비디오 소스는 `network`가 허용하는 호스트에서만 로드됩니다. 다른 호스트의 소스는 빈 뷰로 표시되며, `code` `"ERR_ACCESS_DENIED"`와 함께 `onError`를 보고합니다.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS는 비디오를 `AVPlayerLayer`에 그리며, `controls`를 사용하면 시스템 플레이어 뷰에 그립니다. AVFoundation은 비디오가 처음 생성될 때 로드됩니다.
- Android는 TextureView 위에서 MediaPlayer로 재생하며, `controls`에는 MediaController를 사용합니다.
