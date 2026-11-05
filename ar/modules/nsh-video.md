---
title: "Video"
description: "Video، مشغّل فيديو أصلي (AVPlayer، MediaPlayer)، مع خصائصه (props) وأحداثه (events) ودوال المرجع (ref methods)."
order: 2.4
source_hash: 08a403c2bf02574e
---

# الفيديو

يصدّر `nsh` المكوّن `Video`: مشغّل فيديو مبني على مشغّل المنصة (`AVPlayer` على iOS وMac Catalyst، و`MediaPlayer` على Android). يتم التحكم في التشغيل عبر الخصائص (props)، لذا فإيقاف التشغيل مؤقتًا لا يتطلب سوى تغيير إشارة.

```ts
import { Video, type VideoProps } from "nsh";
```

راجع [عرض الويب والفيديو](../docs/web-view-and-video.md) للاطلاع على الدليل، و[`<Video>`](../elements/video.md) للاطلاع على خصائصه.

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

<a id="props"></a>

## الخصائص

يقبل `Video` [خصائص العرض](../elements/view.md) (النمط، والفئات، والتخطيط، وإمكانية الوصول، و`ref`؛ دون عناصر فرعية)، بالإضافة إلى ما يلي:

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `src` | `string` | (مطلوبة) | عنوان URL الخاص بالفيديو. |
| `paused` | `boolean` | `false` | التشغيل متوقف مؤقتًا. |
| `muted` | `boolean` | `false` | بلا صوت. |
| `volume` | `number` | `1` | من 0 إلى 1. |
| `rate` | `number` | `1` | سرعة التشغيل. |
| `repeat` | `boolean` | `false` | يعيد التشغيل من البداية عند الوصول إلى النهاية. |
| `controls` | `boolean` | `false` | يعرض عناصر التحكم في التشغيل الخاصة بالمنصة. |
| `objectFit` (النمط)، `object-*` الفئات | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | كيفية احتواء الفيديو داخل مربعه، مثل `object-fit` في CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | عدد الميلي ثانية بين أحداث `onProgress`. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | تأثير الصوت في بقية الصوتيات على الجهاز: راجع [الصوت والتطبيقات الأخرى](#sound-and-other-apps). |

<a id="sound-and-other-apps"></a>

### الصوت والتطبيقات الأخرى

يتبع صوت الفيديو إعدادات الصوت في التطبيق، وهي افتراضيًا إعدادات المنصة للفيديو: ففي iOS يؤدي الوضع الصامت في الجهاز إلى كتم الصوت. أما التطبيق الذي يشغّل الكلام، مثل الكتب الصوتية أو دورات تعلّم اللغات، فيضبط `audioSession`:

| `audioSession` | في الوضع الصامت | صوتيات التطبيقات الأخرى أثناء تشغيله |
|---|---|---|
| `"default"` | تقرر إعدادات الصوت في التطبيق | تقرر إعدادات الصوت في التطبيق |
| `"playback"` | يُشغَّل الصوت | تتوقف مؤقتًا، ثم تستأنف عند إيقاف الفيديو مؤقتًا أو انتهائه أو زواله |
| `"mixWithOthers"` | يُشغَّل الصوت | تستمر في التشغيل |

يسري الإعداد أثناء تشغيل الفيديو. في iOS، يضبط أول فيديو من هذا النوع يبدأ التشغيل `AVAudioSession` على الفئة `playback` في الوضع `spokenAudio` (مع المزج مع صوتيات التطبيقات الأخرى في `"mixWithOthers"`)، وبمجرد ألا يبقى أي فيديو قيد التشغيل تعود الجلسة إلى حالتها السابقة، ويمكن للتطبيقات التي أوقفها أن تستأنف التشغيل؛ أما `"default"` فيترك الجلسة كما ضبطها التطبيق، أو التطبيق الذي يضمّن NSH. في Android يُصنَّف صوت المشغّل كلامًا، ويحتفظ فيديو `"playback"` بتركيز الصوت (audio focus) أثناء تشغيله: فيتوقف مؤقتًا عندما يستحوذ تطبيق آخر على التركيز (مكالمة، أو تنبيه ملاحة) ويستأنف التشغيل عند عودته. يؤدي تغيير `audioSession` في Android إلى فتح المصدر من جديد. أما على أنظمة سطح المكتب والويب فيُشغَّل الصوت كما يُشغَّل في أي فيديو.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## الأحداث

| الحدث | البيانات المرافقة | متى يقع |
|---|---|---|
| `onLoadStart` | | يبدأ تحميل الفيديو. |
| `onLoad` | `{ duration: number; size: PixelSize }` | يصبح جاهزًا للتشغيل: مدته بالثواني وحجمه بالبكسل. |
| `onProgress` | `{ currentTime: number; duration: number }` | أثناء التشغيل، كل `progressUpdateInterval` ميلي ثانية. بالثواني. |
| `onBuffer` | `{ isBuffering: boolean }` | ينتظر التشغيل وصول البيانات، أو يستأنف. |
| `onEnd` | | وصل التشغيل إلى النهاية. |
| `onError` | `{ message: string }` | تعذّر تحميل الفيديو أو تشغيله. |

<a id="ref-methods"></a>

## دوال المرجع (Ref)

| الدالة | الوصف |
|---|---|
| `seek(seconds)` | ينتقل إلى `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

<a id="capabilities"></a>

## الإمكانات (Capabilities)

عندما يعلن تطبيقك عن `capabilities` في `nsh.json`، يجب السماح بمصادر الفيديو البعيدة ضمن `network`، مثل `fetch`؛ أما المصدر المرفوض فلا يعرض شيئًا. راجع [العزل والإمكانات](../docs/sandbox-and-capabilities.md).
