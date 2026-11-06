---
title: "Video"
description: "Video 要素: 独自のコントロールまたはシステム標準のコントロールを使用したネイティブ動画再生。"
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# ビデオ

ビデオビューは、プラットフォームのプレイヤーを使ってビデオファイルまたはストリームを再生します。iOS と Mac Catalyst では AVPlayer、Android では MediaPlayer を使用します。再生は props(`paused`、`muted`、`rate` など)で制御するため、プレイヤーは他のビューと同じようにあなたの state に追従します。Rust では `video(url)` で、TSX では `nsh` の `<Video>` で作成します。

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

TSX では `src` が必須です([Video API](../modules/nsh-video.md) を参照)。[web view and video guide](../docs/web-view-and-video.md) も参照してください。

## Props

ビデオは [view](./view.md) の props(子要素は持ちません)に加えて、次の props を取ります。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | ビデオの URL(Rust では、アセットの `uri` も指定できます: `video(CLIP.uri)`)。 |
| `paused` | `.paused(..)` | `boolean` | `false` | 再生を一時停止します。 |
| `muted` | `.muted(..)` | `boolean` | `false` | 音声を出力しません。 |
| `volume` | `.volume(..)` | `number` | `1` | 0 から 1 の範囲です。 |
| `rate` | `.rate(..)` | `number` | `1` | 再生速度です。 |
| `repeat` | `.repeat(..)` | `boolean` | `false` | 終了時に最初から再び再生します。 |
| `controls` | `.controls(..)` | `boolean` | `false` | プラットフォームの再生コントロールを表示します。 |
| `objectFit`(スタイル)、`object-*` クラス | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | CSS の `object-fit` と同様に、ビデオをボックスにどう収めるかを指定します(`class="object-cover"`)。iOS、macOS、Android では `"none"` と `"scale-down"` を `"contain"` として再生し、Linux ではどちらも `"scale-down"` として再生します。 |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | `onProgress` イベントの間隔(ミリ秒)です。 |

ビデオのサイズはスタイルで指定します。サイズはスタイルで指定された値になります。ビデオ本来の縦横比を使いたい場合は、`onLoad` が報告するサイズを使ってアスペクト比を設定してください。

<a id="events"></a>

## イベント

| イベント | Rust | ペイロード | 発生タイミング |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | なし | 読み込みが開始されました。 |
| `onLoad` | `.on_load` | `{ duration, size }`(`VideoInfo`: `duration`、`size`) | ビデオの準備ができました。再生時間(秒)とサイズ(ピクセル)が渡されます。 |
| `onProgress` | `.on_progress` | `{ currentTime, duration }`(`VideoProgress`: `current_time`、`duration`) | 再生中、`progressUpdateInterval` ごとに発生します(秒)。 |
| `onBuffer` | `.on_buffer` | `{ isBuffering }`(`bool`) | データ待ちで再生が停止した、または再開しました。 |
| `onEnd` | `.on_end` | なし | 再生が終端に達しました(`repeat` が有効な場合は、各ループの終端で発生します)。 |
| `onError` | `.on_error` | `{ message, code? }`(`&str`、メッセージ) | 読み込みまたは再生に失敗しました。アプリの capabilities で許可されていないソースの場合、`code` は `"ERR_ACCESS_DENIED"` になります。 |

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

## Ref メソッド

| メソッド | Rust | 説明 |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | 指定した時間へジャンプします。 |

## Capabilities

アプリが [capabilities](../docs/sandbox-and-capabilities.md) を宣言している場合、ビデオのソースは `network` で許可されたホストから読み込まれます。それ以外のホストのソースは空のビューを表示し、`code` に `"ERR_ACCESS_DENIED"` を指定して `onError` を報告します。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- iOS では、ビデオを `AVPlayerLayer` 内に描画します。`controls` を使う場合はシステムのプレイヤービューに描画します。AVFoundation は、最初にビデオが作成されたときに読み込まれます。
- Android では、TextureView 上で MediaPlayer を使って再生し、`controls` には MediaController を使用します。
