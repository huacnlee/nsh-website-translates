---
title: "Video"
description: "Video — нативный видеоплеер (AVPlayer, MediaPlayer): его свойства (props), события и методы ref."
order: 2.4
source_hash: 08a403c2bf02574e
---

# Video

`nsh` экспортирует `Video`: видеоплеер на базе платформенного плеера (`AVPlayer` на iOS и Mac Catalyst, `MediaPlayer` на Android). Воспроизведением управляют через props, поэтому поставить паузу можно одним сигналом.

```ts
import { Video, type VideoProps } from "nsh";
```

Руководство см. в разделе [Web view and video](../docs/web-view-and-video.md), а props — в [`<Video>`](../elements/video.md).

<a id="video-1"></a>

## Video

```ts
const Video: (props: VideoProps) => JSX.Element;

interface VideoProps extends Omit<ViewProps, "children">, VideoHostProps {
  src: string;
}
```

```tsx
import { mount, signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  const paused = signal(true);
  const time = signal("");
  let video!: VideoRef;
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Video
        ref={video}
        src="https://example.com/clip.mp4"
        paused={paused()}
        muted
        repeat
        class="object-cover"
        style={{ height: 220, borderRadius: 8, overflow: "hidden", backgroundColor: "#000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
      />
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Text onPress={() => paused.update((p) => !p)}>{paused() ? "Play" : "Pause"}</Text>
        <Text onPress={() => video.seek(0)}>Restart</Text>
        <Text>{time()}</Text>
      </View>
    </View>
  );
}

mount(Player);
```

## Props

`Video` принимает [props представления](../elements/view.md) (style, classes, layout, accessibility, `ref`; без дочерних элементов), а также:

| Prop | Тип | По умолчанию | Описание |
|---|---|---|---|
| `src` | `string` | (обязательный) | URL видео. |
| `paused` | `boolean` | `false` | Воспроизведение приостановлено. |
| `muted` | `boolean` | `false` | Без звука. |
| `volume` | `number` | `1` | От 0 до 1. |
| `rate` | `number` | `1` | Скорость воспроизведения. |
| `repeat` | `boolean` | `false` | В конце начинает воспроизведение заново. |
| `controls` | `boolean` | `false` | Показывает платформенные элементы управления воспроизведением. |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Как видео вписывается в свой блок, аналогично `object-fit` в CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Интервал в миллисекундах между событиями `onProgress`. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | Как звук влияет на остальное аудио устройства: см. [Звук и другие приложения](#sound-and-other-apps). |

### Sound and other apps

Звук видео подчиняется аудионастройкам приложения, которые по умолчанию совпадают с платформенными настройками для видео: на iOS его отключает беззвучный режим устройства. Приложение, воспроизводящее речь, например аудиокнига или языковой курс, задаёт `audioSession`:

| `audioSession` | В беззвучном режиме | Аудио других приложений во время воспроизведения |
|---|---|---|
| `"default"` | решают аудионастройки приложения | решают аудионастройки приложения |
| `"playback"` | звук воспроизводится | приостанавливается и возобновляется, когда видео ставится на паузу, заканчивается или уходит |
| `"mixWithOthers"` | звук воспроизводится | продолжает воспроизводиться |

Настройка действует, пока видео воспроизводится. На iOS первое такое видео, начавшее воспроизведение, переключает `AVAudioSession` на категорию `playback` в режиме `spokenAudio` (со смешиванием с аудио других приложений для `"mixWithOthers"`), а когда ни одно видео не воспроизводится, сессия возвращается в прежнее состояние, и приостановленные ею приложения могут снова воспроизводить звук; `"default"` оставляет сессию такой, какой её задало приложение или приложение, встраивающее NSH. На Android звук плеера помечается как речь, а видео с `"playback"` удерживает аудиофокус во время воспроизведения: оно приостанавливается, когда фокус забирает другое приложение (звонок, голосовая подсказка навигации), и продолжается, когда фокус возвращается. Изменение `audioSession` на Android заново открывает источник. На десктопных платформах и в вебе звук воспроизводится так же, как у любого видео.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| Событие | Payload | Когда |
|---|---|---|
| `onLoadStart` | | Видео начинает загружаться. |
| `onLoad` | `{ duration: number; size: PixelSize }` | Видео готово к воспроизведению: его длительность в секундах и размер в пикселях. |
| `onProgress` | `{ currentTime: number; duration: number }` | Во время воспроизведения, каждые `progressUpdateInterval` мс. Секунды. |
| `onBuffer` | `{ isBuffering: boolean }` | Воспроизведение ожидает данные или возобновляется. |
| `onEnd` | | Воспроизведение дошло до конца. |
| `onError` | `{ message: string }` | Не удалось загрузить или воспроизвести видео. |

## Ref methods

| Метод | Описание |
|---|---|
| `seek(seconds)` | Переходит к `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

Если ваше приложение объявляет `capabilities` в `nsh.json`, удалённые источники видео должны быть разрешены в `network`, например `fetch`; отклонённый источник ничего не показывает. См. [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).
