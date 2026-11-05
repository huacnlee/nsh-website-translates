---
title: "Video"
description: "Video एलिमेंट: अपने या सिस्टम के कंट्रोल्स के साथ नेटिव वीडियो प्लेबैक।"
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# वीडियो

वीडियो व्यू प्लेटफ़ॉर्म के प्लेयर से वीडियो फ़ाइल या स्ट्रीम चलाता है: iOS और Mac Catalyst पर AVPlayer, Android पर MediaPlayer। प्लेबैक को props (`paused`, `muted`, `rate`, …) से नियंत्रित किया जाता है, इसलिए प्लेयर किसी भी अन्य व्यू की तरह आपकी state का अनुसरण करता है। Rust में इसे `video(url)` से बनाया जाता है, TSX में `nsh` से `<Video>` द्वारा।

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

TSX में `src` आवश्यक है ([Video API](../modules/nsh-video.md) देखें)। [वेब व्यू और वीडियो गाइड](../docs/web-view-and-video.md) भी देखें।

## Props

वीडियो एक [व्यू](./view.md) के props लेता है (इसमें कोई children नहीं होते) और साथ में ये भी:

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | वीडियो का URL (Rust में किसी asset का `uri` भी: `video(CLIP.uri)`)। |
| `paused` | `.paused(..)` | `boolean` | `false` | प्लेबैक रुका हुआ है। |
| `muted` | `.muted(..)` | `boolean` | `false` | कोई ध्वनि नहीं। |
| `volume` | `.volume(..)` | `number` | `1` | 0..1। |
| `rate` | `.rate(..)` | `number` | `1` | प्लेबैक की गति। |
| `repeat` | `.repeat(..)` | `boolean` | `false` | अंत में शुरुआत से दोबारा चलता है। |
| `controls` | `.controls(..)` | `boolean` | `false` | प्लेटफ़ॉर्म के प्लेबैक नियंत्रण दिखाता है। |
| `objectFit` (style), `object-*` classes | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | वीडियो अपने बॉक्स में कैसे समाए, CSS के `object-fit` (`class="object-cover"`) की तरह। iOS, macOS और Android `"none"` और `"scale-down"` को `"contain"` की तरह चलाते हैं, Linux दोनों को `"scale-down"` की तरह। |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | `onProgress` इवेंट के बीच मिलीसेकंड। |

वीडियो को उसकी styles के ज़रिए आकार दें; उसका आकार वही होता है जो उसकी styles तय करती हैं। जब आप वीडियो का अपना अनुपात चाहते हैं, तो `onLoad` द्वारा बताए गए आकार से aspect ratio सेट करें।

<a id="events"></a>

## इवेंट

| इवेंट | Rust | Payload | कब |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | कोई नहीं | लोडिंग शुरू हुई। |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | वीडियो तैयार है: उसकी अवधि सेकंड में और उसका आकार पिक्सेल में। |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | चलते समय हर `progressUpdateInterval` पर (सेकंड में)। |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | डेटा के लिए प्लेबैक रुका / फिर शुरू हुआ। |
| `onEnd` | `.on_end` | कोई नहीं | प्लेबैक अंत तक पहुँचा (`repeat` के साथ, हर लूप के अंत में)। |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, संदेश) | लोडिंग या प्लेबैक विफल रहा; ऐसे स्रोत के लिए `code` का मान `"ERR_ACCESS_DENIED"` होता है जिसकी अनुमति ऐप की capabilities नहीं देतीं। |

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

## Ref मेथड

| मेथड | Rust | विवरण |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | किसी समय पर जाता है। |

## Capabilities

जब ऐप [capabilities](../docs/sandbox-and-capabilities.md) घोषित करता है, तो वीडियो स्रोत उन होस्ट से लोड होते हैं जिन्हें `network` अनुमति देता है; किसी अन्य होस्ट का स्रोत खाली व्यू दिखाता है और `code` `"ERR_ACCESS_DENIED"` के साथ `onError` रिपोर्ट करता है।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS वीडियो को `AVPlayerLayer` में बनाता है, या `controls` के साथ सिस्टम प्लेयर व्यू में; AVFoundation पहली बार वीडियो बनाए जाने पर लोड होता है।
- Android, TextureView पर MediaPlayer से चलाता है, और `controls` के लिए MediaController का उपयोग करता है।
