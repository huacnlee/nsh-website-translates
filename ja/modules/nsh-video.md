---
title: "Video"
description: "Video は、ネイティブのビデオプレーヤー(AVPlayer、MediaPlayer)で、props、イベント、ref メソッドを備えています。"
order: 2.4
source_hash: 08a403c2bf02574e
---

# Video

`nsh` は `Video` をエクスポートします。これはプラットフォーム標準のプレーヤー(iOS と Mac Catalyst では `AVPlayer`、Android では `MediaPlayer`)上に構築されたビデオプレーヤーです。再生は props で制御するため、一時停止も signal を切り替えるだけで行えます。

```ts
import { Video, type VideoProps } from "nsh";
```

ガイドは [Web view and video](../docs/web-view-and-video.md)、props については [`<Video>`](../elements/video.md) を参照してください。

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

`Video` は [view props](../elements/view.md)(style、classes、layout、accessibility、`ref`。children は不可)に加えて、次の props を受け取ります。

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | (必須) | ビデオの URL。 |
| `paused` | `boolean` | `false` | 再生を一時停止します。 |
| `muted` | `boolean` | `false` | 音を出しません。 |
| `volume` | `number` | `1` | 0..1。 |
| `rate` | `number` | `1` | 再生速度。 |
| `repeat` | `boolean` | `false` | 終了時に最初から再び再生します。 |
| `controls` | `boolean` | `false` | プラットフォームの再生コントロールを表示します。 |
| `objectFit`(style)、`object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | CSS の `object-fit`(`class="object-cover"`)と同様に、ビデオをボックスにどのように収めるかを指定します。 |
| `progressUpdateInterval` | `number` | `250` | `onProgress` イベントの間隔(ミリ秒)。 |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | 音がデバイス上の他のオーディオに与える影響。[Sound and other apps](#sound-and-other-apps) を参照してください。 |

### Sound and other apps

ビデオの音はアプリのオーディオ設定に従います。既定ではビデオ用のプラットフォーム標準の設定が使われ、iOS ではデバイスのサイレントモードで音が消えます。オーディオブックや語学講座のように音声を再生するアプリでは、`audioSession` を設定します。

| `audioSession` | サイレントモード時 | 再生中の他のアプリのオーディオ |
|---|---|---|
| `"default"` | アプリのオーディオ設定に従う | アプリのオーディオ設定に従う |
| `"playback"` | 音が再生される | 一時停止し、ビデオが一時停止・終了・解除されると再び再生される |
| `"mixWithOthers"` | 音が再生される | 再生を続ける |

この設定は、ビデオの再生中に有効になります。iOS では、このようなビデオのうち最初に再生されるものが `AVAudioSession` を `spokenAudio` モードの `playback` カテゴリに設定します(`"mixWithOthers"` の場合は他のアプリのオーディオとミックスされます)。再生中のビデオがなくなると、セッションは元の状態に戻り、一時停止されていたアプリは再び再生できるようになります。`"default"` の場合、セッションはアプリ、または NSH を組み込んだアプリが設定した状態のままになります。Android ではプレーヤーの音が音声(speech)として扱われ、`"playback"` のビデオは再生中にオーディオフォーカスを保持します。他のアプリ(通話やナビゲーションの案内など)がフォーカスを取得すると一時停止し、フォーカスが戻ると再生を再開します。Android で `audioSession` を変更すると、ソースが開き直されます。デスクトップと Web では、通常のビデオと同じように音が再生されます。

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| Event | Payload | When |
|---|---|---|
| `onLoadStart` | | ビデオの読み込みを開始したとき。 |
| `onLoad` | `{ duration: number; size: PixelSize }` | 再生の準備ができたとき。長さ(秒)とサイズ(ピクセル)が渡されます。 |
| `onProgress` | `{ currentTime: number; duration: number }` | 再生中、`progressUpdateInterval` ms ごと。単位は秒。 |
| `onBuffer` | `{ isBuffering: boolean }` | 再生がデータを待っているとき、または再開したとき。 |
| `onEnd` | | 再生が最後まで到達したとき。 |
| `onError` | `{ message: string }` | ビデオを読み込めなかった、または再生できなかったとき。 |

## Ref methods

| Method | Description |
|---|---|
| `seek(seconds)` | `seconds` にジャンプします。 |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

アプリが `nsh.json` で `capabilities` を宣言している場合、リモートのビデオソースは `fetch` のように `network` で許可されている必要があります。拒否されたソースは何も表示されません。[Sandbox and capabilities](../docs/sandbox-and-capabilities.md) を参照してください。
