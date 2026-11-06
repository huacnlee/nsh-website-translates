---
title: "Video"
description: "Video，原生影片播放器（AVPlayer、MediaPlayer），附其屬性、事件及 ref 方法。"
order: 2.4
source_hash: 08a403c2bf02574e
---


# Video

`nsh` 匯出 `Video`：以平台播放器建構的影片播放器（iOS 和 Mac Catalyst 使用 `AVPlayer`，Android 使用 `MediaPlayer`）。播放由屬性控制，所以暫停只需一個 signal 即可。

```ts
import { Video, type VideoProps } from "nsh";
```

指南請參閱 [Web view 與影片](../docs/web-view-and-video.md)，其屬性請參閱 [`<Video>`](../elements/video.md)。

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

<a id="props"></a>

## 屬性

`Video` 接受 [view props](../elements/view.md)（style、class、版面配置、無障礙、`ref`；不可有子元素），另外還有：

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `src` | `string` | （必填） | 影片的 URL。 |
| `paused` | `boolean` | `false` | 是否暫停播放。 |
| `muted` | `boolean` | `false` | 是否靜音。 |
| `volume` | `number` | `1` | 0..1。 |
| `rate` | `number` | `1` | 播放速度。 |
| `repeat` | `boolean` | `false` | 播放至結尾時從頭重新播放。 |
| `controls` | `boolean` | `false` | 顯示平台的播放控制項。 |
| `objectFit`（style）、`object-*` class | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | 影片如何配合其框的大小，與 CSS 的 `object-fit`（`class="object-cover"`）相同。 |
| `progressUpdateInterval` | `number` | `250` | `onProgress` 事件之間相隔的毫秒數。 |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | 聲音對裝置上其餘音訊的影響：請參閱[聲音與其他應用程式](#sound-and-other-apps)。 |

<a id="sound-and-other-apps"></a>

### 聲音與其他應用程式

影片的聲音依從應用程式的音訊設定，預設為平台對影片的設定：在 iOS 上，裝置的靜音模式會令影片沒有聲音。播放語音的應用程式（例如有聲書或語言課程）可設定 `audioSession`：

| `audioSession` | 在靜音模式下 | 播放期間其他應用程式的音訊 |
|---|---|---|
| `"default"` | 由應用程式的音訊設定決定 | 由應用程式的音訊設定決定 |
| `"playback"` | 播放聲音 | 暫停，待影片暫停、結束或消失後再繼續播放 |
| `"mixWithOthers"` | 播放聲音 | 繼續播放 |

此設定在影片播放期間生效。在 iOS 上，第一個這類影片開始播放時，會把 `AVAudioSession` 設為 `playback` 類別及 `spokenAudio` 模式（並以 `"mixWithOthers"` 與其他應用程式的音訊混合），待沒有此類影片播放時，工作階段便恢復原狀，被暫停的應用程式亦可再次播放；`"default"` 則保持工作階段為應用程式或嵌入 NSH 的應用程式所設定的狀態。在 Android 上，播放器的聲音會標記為語音，而 `"playback"` 影片在播放期間會持有音訊焦點：當其他應用程式取得焦點（來電、導航提示）時會暫停，焦點返回後便繼續播放。在 Android 上更改 `audioSession` 會重新開啟來源。桌面平台和網頁則按一般影片的方式播放聲音。

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## 事件

| 事件 | 資料 | 時機 |
|---|---|---|
| `onLoadStart` | | 影片開始載入。 |
| `onLoad` | `{ duration: number; size: PixelSize }` | 影片已可播放：提供其長度（秒）和尺寸（像素）。 |
| `onProgress` | `{ currentTime: number; duration: number }` | 播放期間每隔 `progressUpdateInterval` 毫秒觸發一次。單位為秒。 |
| `onBuffer` | `{ isBuffering: boolean }` | 播放正在等待資料，或已恢復。 |
| `onEnd` | | 播放已到達結尾。 |
| `onError` | `{ message: string }` | 影片無法載入或播放。 |

<a id="ref-methods"></a>

## Ref 方法

| 方法 | 說明 |
|---|---|
| `seek(seconds)` | 跳至 `seconds`。 |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

<a id="capabilities"></a>

## 權限

當你的應用程式在 `nsh.json` 中宣告 `capabilities` 時，遠端影片來源必須在 `network` 下獲得允許，例如 `fetch`；被拒絕的來源不會顯示任何內容。請參閱[沙盒與權限](../docs/sandbox-and-capabilities.md)。
