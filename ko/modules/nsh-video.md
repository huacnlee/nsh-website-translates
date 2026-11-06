---
title: "Video"
description: "Video, 네이티브 비디오 플레이어(AVPlayer, MediaPlayer)와 해당 props, 이벤트, ref 메서드를 설명합니다."
order: 2.4
source_hash: 08a403c2bf02574e
---

# Video

`nsh`는 `Video`를 export합니다. 플랫폼의 플레이어(iOS와 Mac Catalyst에서는 `AVPlayer`, Android에서는 `MediaPlayer`)를 기반으로 한 비디오 플레이어입니다. 재생은 props로 제어하므로, 일시 정지는 신호 하나면 됩니다.

```ts
import { Video, type VideoProps } from "nsh";
```

가이드는 [Web view and video](../docs/web-view-and-video.md)를, props는 [`<Video>`](../elements/video.md)를 참고하세요.

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

`Video`는 [view props](../elements/view.md)(style, classes, layout, accessibility, `ref`; children 없음)와 함께 다음 props를 받습니다.

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | (필수) | 비디오의 URL입니다. |
| `paused` | `boolean` | `false` | 재생이 일시 정지됩니다. |
| `muted` | `boolean` | `false` | 소리가 나지 않습니다. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | 재생 속도입니다. |
| `repeat` | `boolean` | `false` | 끝에 도달하면 처음부터 다시 재생합니다. |
| `controls` | `boolean` | `false` | 플랫폼의 재생 컨트롤을 표시합니다. |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | CSS의 `object-fit`(`class="object-cover"`)처럼 비디오가 자신의 박스에 맞춰지는 방식입니다. |
| `progressUpdateInterval` | `number` | `250` | `onProgress` 이벤트 사이의 간격(밀리초)입니다. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | 소리가 기기의 나머지 오디오에 미치는 영향입니다. [Sound and other apps](#sound-and-other-apps)를 참고하세요. |

### Sound and other apps

비디오의 소리는 앱의 오디오 설정을 따르며, 기본값은 비디오에 대한 플랫폼의 설정입니다. iOS에서는 기기의 무음 모드가 소리를 끕니다. 오디오북이나 어학 강좌처럼 음성을 재생하는 앱은 `audioSession`를 설정합니다.

| `audioSession` | 무음 모드에서 | 재생 중 다른 앱의 오디오 |
|---|---|---|
| `"default"` | 앱의 오디오 설정에 따름 | 앱의 오디오 설정에 따름 |
| `"playback"` | 소리가 재생됨 | 일시 정지되며, 비디오가 일시 정지되거나 끝나거나 사라지면 다시 재생됨 |
| `"mixWithOthers"` | 소리가 재생됨 | 계속 재생됨 |

이 설정은 비디오가 재생되는 동안 적용됩니다. iOS에서는 이러한 비디오 중 처음 재생되는 비디오가 `AVAudioSession`를 `spokenAudio` 모드의 `playback` 카테고리로 설정하고(`"mixWithOthers"`를 위해 다른 앱의 오디오와 믹싱), 재생 중인 비디오가 없어지면 세션은 원래 상태로 돌아가며 일시 정지되었던 앱이 다시 재생될 수 있습니다. `"default"`는 세션을 앱 또는 NSH를 임베드한 앱이 설정한 그대로 둡니다. Android에서는 플레이어의 소리가 음성으로 표시되며, `"playback"` 비디오는 재생되는 동안 오디오 포커스를 유지합니다. 다른 앱(전화, 내비게이션 안내)이 포커스를 가져가면 일시 정지되고, 포커스가 돌아오면 이어서 재생됩니다. Android에서 `audioSession`를 변경하면 소스를 다시 엽니다. 데스크톱과 웹은 다른 비디오와 마찬가지로 소리를 재생합니다.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| Event | Payload | When |
|---|---|---|
| `onLoadStart` | | 비디오 로딩이 시작될 때입니다. |
| `onLoad` | `{ duration: number; size: PixelSize }` | 재생할 준비가 되었을 때입니다. 길이(초)와 크기(픽셀)가 전달됩니다. |
| `onProgress` | `{ currentTime: number; duration: number }` | 재생 중 `progressUpdateInterval`ms마다 발생합니다. 단위는 초입니다. |
| `onBuffer` | `{ isBuffering: boolean }` | 재생이 데이터를 기다리거나 다시 시작될 때입니다. |
| `onEnd` | | 재생이 끝에 도달했을 때입니다. |
| `onError` | `{ message: string }` | 비디오를 로드하거나 재생할 수 없을 때입니다. |

## Ref methods

| Method | Description |
|---|---|
| `seek(seconds)` | `seconds`로 이동합니다. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

앱이 `nsh.json`에서 `capabilities`를 선언하면, 원격 비디오 소스는 `fetch`처럼 `network`에서 허용되어야 합니다. 거부된 소스는 아무것도 표시하지 않습니다. [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)를 참고하세요.
