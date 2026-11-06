---
title: "Video"
description: "Video 元素:以原生方式播放影片,可使用自訂或系統內建的控制項。"
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---


# Video

視頻檢視（video view）會使用平台的播放器播放視頻檔案或串流：iOS 和 Mac Catalyst 使用 AVPlayer，Android 使用 MediaPlayer。播放透過 props（`paused`、`muted`、`rate` 等）控制，因此播放器會像其他檢視一樣跟隨你的狀態。Rust 使用 `video(url)` 建立，TSX 則從 `nsh` 使用 `<Video>`。

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

在 TSX 中，`src` 為必填（參閱 [Video API](../modules/nsh-video.md)）。另請參閱[網頁檢視與視頻指南](../docs/web-view-and-video.md)。

## Props

視頻具備[檢視](./view.md)的 props（它沒有子元件），另外還有：

| Prop | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | 視頻的 URL（在 Rust 中亦可使用資源的 `uri`：`video(CLIP.uri)`）。 |
| `paused` | `.paused(..)` | `boolean` | `false` | 暫停播放。 |
| `muted` | `.muted(..)` | `boolean` | `false` | 靜音。 |
| `volume` | `.volume(..)` | `number` | `1` | 0..1。 |
| `rate` | `.rate(..)` | `number` | `1` | 播放速度。 |
| `repeat` | `.repeat(..)` | `boolean` | `false` | 播放至結尾時從頭重新播放。 |
| `controls` | `.controls(..)` | `boolean` | `false` | 顯示平台的播放控制項。 |
| `objectFit`（樣式）、`object-*` class | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 視頻如何配合其方框，等同 CSS 的 `object-fit`（`class="object-cover"`）。iOS、macOS 和 Android 會將 `"none"` 和 `"scale-down"` 當作 `"contain"` 播放，Linux 則將兩者都當作 `"scale-down"`。 |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | `onProgress` 事件之間相隔的毫秒數。 |

請透過樣式為視頻設定尺寸；視頻的尺寸即其樣式所指定的尺寸。若想沿用視頻本身的比例，可根據 `onLoad` 回報的尺寸來設定長寬比。

<a id="events"></a>

## 事件

| 事件 | Rust | 負載 | 時機 |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | 無 | 開始載入。 |
| `onLoad` | `.on_load` | `{ duration, size }`（`VideoInfo`：`duration`、`size`） | 視頻已準備就緒：其時長（以秒計）及尺寸（以像素計）。 |
| `onProgress` | `.on_progress` | `{ currentTime, duration }`（`VideoProgress`：`current_time`、`duration`） | 播放期間每隔 `progressUpdateInterval` 觸發一次（以秒計）。 |
| `onBuffer` | `.on_buffer` | `{ isBuffering }`（`bool`） | 播放因等待資料而停頓／已恢復。 |
| `onEnd` | `.on_end` | 無 | 播放已到達結尾（設定 `repeat` 時，會在每次循環結束時觸發）。 |
| `onError` | `.on_error` | `{ message, code? }`（`&str`，即訊息） | 載入或播放失敗；若來源未獲應用程式的 capabilities 授權，`code` 為 `"ERR_ACCESS_DENIED"`。 |

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

## Ref 方法

| 方法 | Rust | 說明 |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | 跳至指定時間。 |

## Capabilities

當應用程式宣告 [capabilities](../docs/sandbox-and-capabilities.md) 時，視頻來源只會從 `network` 允許的主機載入；來自其他主機的來源會顯示空白檢視，並以 `code` `"ERR_ACCESS_DENIED"` 回報 `onError`。

<a id="platform-notes"></a>

## 平台備註

- iOS 會在 `AVPlayerLayer` 中繪製視頻，若使用 `controls` 則在系統播放器檢視中繪製；AVFoundation 會在首次建立視頻時才載入。
- Android 在 TextureView 上使用 MediaPlayer 播放，並以 MediaController 提供 `controls`。
