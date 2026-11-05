---
title: "Video"
description: "Video, एक नेटिव वीडियो प्लेयर (AVPlayer, MediaPlayer), इसके props, events और ref methods के साथ।"
order: 2.4
source_hash: 08a403c2bf02574e
---

# वीडियो

`nsh` `Video` एक्सपोर्ट करता है: प्लेटफ़ॉर्म के प्लेयर पर बना एक वीडियो प्लेयर (iOS और Mac Catalyst पर `AVPlayer`, Android पर `MediaPlayer`)। प्लेबैक को props से नियंत्रित किया जाता है, इसलिए वीडियो को रोकना बस एक सिग्नल की दूरी पर है।

```ts
import { Video, type VideoProps } from "nsh";
```

गाइड के लिए [Web view और वीडियो](../docs/web-view-and-video.md) देखें और इसके props के लिए [`<Video>`](../elements/video.md) देखें।

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

`Video` [view props](../elements/view.md) (style, classes, layout, accessibility, `ref`; कोई children नहीं) लेता है, साथ ही:

| Prop | Type | Default | विवरण |
|---|---|---|---|
| `src` | `string` | (आवश्यक) | वीडियो का URL। |
| `paused` | `boolean` | `false` | प्लेबैक रुका हुआ है। |
| `muted` | `boolean` | `false` | कोई आवाज़ नहीं। |
| `volume` | `number` | `1` | 0..1। |
| `rate` | `number` | `1` | प्लेबैक की गति। |
| `repeat` | `boolean` | `false` | अंत में शुरुआत से दोबारा चलता है। |
| `controls` | `boolean` | `false` | प्लेटफ़ॉर्म के प्लेबैक कंट्रोल दिखाता है। |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | वीडियो अपने बॉक्स में कैसे फ़िट होता है, CSS के `object-fit` (`class="object-cover"`) की तरह। |
| `progressUpdateInterval` | `number` | `250` | `onProgress` इवेंट के बीच मिलीसेकंड। |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | आवाज़ डिवाइस की बाकी ऑडियो पर क्या असर डालती है: [आवाज़ और अन्य ऐप्स](#sound-and-other-apps) देखें। |

<a id="sound-and-other-apps"></a>

### आवाज़ और अन्य ऐप्स

वीडियो की आवाज़ ऐप की ऑडियो सेटिंग का पालन करती है, जो डिफ़ॉल्ट रूप से वीडियो के लिए प्लेटफ़ॉर्म की सेटिंग होती है: iOS पर डिवाइस का साइलेंट मोड उसे म्यूट कर देता है। जो ऐप बोली हुई सामग्री चलाता है, जैसे ऑडियोबुक या भाषा सिखाने वाला कोर्स, वह `audioSession` सेट करता है:

| `audioSession` | साइलेंट मोड में | चलते समय अन्य ऐप्स की ऑडियो |
|---|---|---|
| `"default"` | ऐप की ऑडियो सेटिंग तय करती हैं | ऐप की ऑडियो सेटिंग तय करती हैं |
| `"playback"` | आवाज़ चलती है | रुक जाती है, और वीडियो के रुकने, खत्म होने या हटने के बाद दोबारा चलती है |
| `"mixWithOthers"` | आवाज़ चलती है | चलती रहती है |

यह सेटिंग वीडियो चलने के दौरान प्रभावी रहती है। iOS पर, ऐसा पहला वीडियो चलने पर `AVAudioSession` को `spokenAudio` मोड में `playback` श्रेणी पर सेट करता है (`"mixWithOthers"` के लिए अन्य ऐप्स की ऑडियो के साथ मिक्स होकर), और जब कोई भी वीडियो नहीं चल रहा होता, तो सेशन अपनी पिछली स्थिति में लौट आता है और जिन ऐप्स को रोका गया था वे दोबारा चल सकते हैं; `"default"` सेशन को वैसा ही छोड़ देता है जैसा ऐप ने, या NSH को एम्बेड करने वाले ऐप ने, सेट किया था। Android पर प्लेयर की आवाज़ को स्पीच के रूप में चिह्नित किया जाता है, और `"playback"` वीडियो चलते समय ऑडियो फ़ोकस अपने पास रखता है: जब कोई अन्य ऐप फ़ोकस ले लेता है (कॉल, नेविगेशन प्रॉम्प्ट) तो वह रुक जाता है और फ़ोकस लौटने पर आगे चलता है। Android पर `audioSession` बदलने से सोर्स दोबारा खुलता है। डेस्कटॉप और वेब पर आवाज़ वैसे ही चलती है जैसे किसी भी वीडियो की चलती है।

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| Event | Payload | कब |
|---|---|---|
| `onLoadStart` | | वीडियो लोड होना शुरू होता है। |
| `onLoad` | `{ duration: number; size: PixelSize }` | यह चलने के लिए तैयार है: इसकी अवधि सेकंड में और आकार पिक्सेल में। |
| `onProgress` | `{ currentTime: number; duration: number }` | चलते समय, हर `progressUpdateInterval` ms पर। सेकंड में। |
| `onBuffer` | `{ isBuffering: boolean }` | प्लेबैक डेटा का इंतज़ार करता है, या फिर से शुरू होता है। |
| `onEnd` | | प्लेबैक अंत तक पहुँच गया। |
| `onError` | `{ message: string }` | वीडियो लोड या प्ले नहीं हो सका। |

## Ref methods

| Method | विवरण |
|---|---|
| `seek(seconds)` | `seconds` पर जाता है। |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तो रिमोट वीडियो सोर्स को `network` के अंतर्गत अनुमति देनी होगी, जैसे `fetch`; अस्वीकृत सोर्स कुछ नहीं दिखाता। [Sandbox और capabilities](../docs/sandbox-and-capabilities.md) देखें।
