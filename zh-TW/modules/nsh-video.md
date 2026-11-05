---
title: "Video"
description: "Video，原生影片播放器（AVPlayer、MediaPlayer），包含其 props、事件與 ref 方法。"
order: 2.4
source_hash: 08a403c2bf02574e
---

# Video

`nsh` 匯出 `Video`：以平台播放器為基礎的影片播放器（iOS 與 Mac Catalyst 上為 `AVPlayer`，Android 上為 `MediaPlayer`）。播放透過 props 控制，因此暫停只需要一個訊號。

```ts
import { Video, type VideoProps } from "nsh";
```

指南請參閱 [Web view and video](../docs/web-view-and-video.md)，其 props 請參閱 [`<Video>`](../elements/video.md)。

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

`Video` 接受 [view props](../elements/view.md)（style、classes、版面配置、無障礙功能、`ref`；無子元素），另外還有：

| Prop | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `src` | `string` | （必填） | 影片的 URL。 |
| `paused` | `boolean` | `false` | 播放已暫停。 |
| `muted` | `boolean` | `false` | 無聲音。 |
| `volume` | `number` | `1` | 0..1。 |
| `rate` | `number` | `1` | 播放速度。 |
| `repeat` | `boolean` | `false` | 播放結束時從頭重新播放。 |
| `controls` | `boolean` | `false` | 顯示平台的播放控制項。 |
| `objectFit`（style）、`object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 影片如何符合其容器大小，與 CSS 的 `object-fit`（`class="object-cover"`）相同。 |
| `progressUpdateInterval` | `number` | `250` | `onProgress` 事件之間的毫秒數。 |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | 聲音對裝置其餘音訊的影響：請參閱 [Sound and other apps](#sound-and-other-apps)。 |

### Sound and other apps

影片的聲音遵循應用程式的音訊設定，預設為平台對影片的設定：在 iOS 上，裝置的靜音模式會使其靜音。播放語音的應用程式（例如有聲書或語言課程）可設定 `audioSession`：

| `audioSession` | 在靜音模式下 | 播放期間其他應用程式的音訊 |
|---|---|---|
| `"default"` | 由應用程式的音訊設定決定 | 由應用程式的音訊設定決定 |
| `"playback"` | 播放聲音 | 暫停，並在影片暫停、結束或消失後再次播放 |
| `"mixWithOthers"` | 播放聲音 | 持續播放 |

此設定在影片播放期間生效。在 iOS 上，第一個播放的此類影片會將 `AVAudioSession` 設為 `playback` 類別、`spokenAudio` 模式（為 `"mixWithOthers"` 與其他應用程式的音訊混合），當沒有此類影片在播放時，工作階段會恢復原狀，被它暫停的應用程式可再次播放；`"default"` 則讓工作階段維持由應用程式或嵌入 NSH 的應用程式所設定的狀態。在 Android 上，播放器的聲音會標記為語音，且 `"playback"` 影片在播放時會持有音訊焦點：當其他應用程式取得焦點（來電、導航提示）時會暫停，焦點返回時繼續播放。在 Android 上變更 `audioSession` 會重新開啟來源。桌面平台與網頁則如同播放任何影片般播放聲音。

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| 事件 | Payload | 時機 |
|---|---|---|
| `onLoadStart` | | 影片開始載入。 |
| `onLoad` | `{ duration: number; size: PixelSize }` | 已可播放：其長度（秒）與大小（像素）。 |
| `onProgress` | `{ currentTime: number; duration: number }` | 播放期間，每 `progressUpdateInterval` 毫秒觸發一次。單位為秒。 |
| `onBuffer` | `{ isBuffering: boolean }` | 播放等待資料，或繼續播放。 |
| `onEnd` | | 播放已到達結尾。 |
| `onError` | `{ message: string }` | 影片無法載入或播放。 |

## Ref methods

| 方法 | 說明 |
|---|---|
| `seek(seconds)` | 跳至 `seconds`。 |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

當你的應用程式在 `nsh.json` 中宣告 `capabilities` 時，遠端影片來源必須在 `network` 下被允許，例如 `fetch`；被拒絕的來源不會顯示任何內容。請參閱 [Sandbox and capabilities](../docs/sandbox-and-capabilities.md)。
