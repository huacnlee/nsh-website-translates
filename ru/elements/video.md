---
title: "Video"
description: "Элемент Video: нативное воспроизведение видео с вашими собственными или системными элементами управления."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# Video

Video view воспроизводит видеофайл или поток штатным плеером платформы: AVPlayer на iOS и Mac Catalyst, MediaPlayer на Android. Воспроизведением управляют через свойства (`paused`, `muted`, `rate`, …), поэтому плеер следует за вашим состоянием, как и любой другой view. В Rust его создают с помощью `video(url)`, в TSX — с помощью `<Video>` из `nsh`.

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

В TSX `src` обязателен (см. [Video API](../modules/nsh-video.md)). См. также [руководство по web view и video](../docs/web-view-and-video.md).

<a id="props"></a>

## Свойства

Video принимает свойства [view](./view.md) (дочерних элементов у него нет), а также:

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | URL видео (в Rust также `uri` ресурса: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | Воспроизведение приостановлено. |
| `muted` | `.muted(..)` | `boolean` | `false` | Без звука. |
| `volume` | `.volume(..)` | `number` | `1` | От 0 до 1. |
| `rate` | `.rate(..)` | `number` | `1` | Скорость воспроизведения. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | По окончании воспроизводит видео заново с начала. |
| `controls` | `.controls(..)` | `boolean` | `false` | Показывает штатные элементы управления воспроизведением платформы. |
| `objectFit` (стиль), классы `object-*` | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Как видео вписывается в свой блок, аналогично `object-fit` в CSS (`class="object-cover"`). iOS, macOS и Android воспроизводят `"none"` и `"scale-down"` как `"contain"`, Linux — оба как `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Интервал в миллисекундах между событиями `onProgress`. |

Размер видео задаётся через его стили: он равен тому, который указан в стилях. Если нужны собственные пропорции видео, используйте размер, который сообщает `onLoad`, чтобы задать соотношение сторон.

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | нет | Началась загрузка. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | Видео готово: его длительность в секундах и размер в пикселях. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | Каждые `progressUpdateInterval` во время воспроизведения (в секундах). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | Воспроизведение остановилось в ожидании данных / возобновилось. |
| `onEnd` | `.on_end` | нет | Воспроизведение достигло конца (при `repeat` — в конце каждого цикла). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, сообщение) | Не удалось загрузить или воспроизвести видео; `code` равно `"ERR_ACCESS_DENIED"` для источника, который не разрешён возможностями приложения. |

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

## Методы ref

| Метод | Rust | Описание |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Переходит к указанному времени. |

## Capabilities

Если приложение объявляет [capabilities](../docs/sandbox-and-capabilities.md), источники видео загружаются с хостов, которые разрешает `network`; источник на другом хосте отображается как пустой view и сообщает `onError` с `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Особенности платформ

- iOS отображает видео в `AVPlayerLayer` или, при `controls`, в системном представлении плеера; AVFoundation загружается при первом создании видео.
- Android воспроизводит видео с помощью MediaPlayer на TextureView, а для `controls` использует MediaController.
