---
title: "Video"
description: "عنصر Video: تشغيل الفيديو الأصلي مع عناصر تحكم خاصة بك أو عناصر تحكم النظام."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# Video

يشغّل عنصر العرض Video ملف فيديو أو بثًّا باستخدام مشغّل المنصة: AVPlayer على iOS وMac Catalyst، وMediaPlayer على Android. يتم التحكم في التشغيل عبر الخصائص (`paused`، `muted`، `rate`، …)، فيتبع المشغّل حالة تطبيقك مثل أي عنصر عرض آخر. في Rust يُنشأ باستخدام `video(url)`، وفي TSX باستخدام `<Video>` من `nsh`.

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

في TSX يكون `src` مطلوبًا (راجع [Video API](../modules/nsh-video.md)). راجع [دليل web view وvideo](../docs/web-view-and-video.md).

<a id="props"></a>

## الخصائص

يقبل عنصر Video خصائص [العرض](./view.md) (وليس له عناصر فرعية) بالإضافة إلى ما يلي:

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | عنوان URL للفيديو (في Rust يمكن أيضًا استخدام `uri` لأحد الأصول: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | التشغيل متوقف مؤقتًا. |
| `muted` | `.muted(..)` | `boolean` | `false` | بدون صوت. |
| `volume` | `.volume(..)` | `number` | `1` | من 0 إلى 1. |
| `rate` | `.rate(..)` | `number` | `1` | سرعة التشغيل. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | يعيد التشغيل من البداية عند الوصول إلى النهاية. |
| `controls` | `.controls(..)` | `boolean` | `false` | يعرض عناصر التحكم في التشغيل الخاصة بالمنصة. |
| `objectFit` (نمط)، `object-*` فئات | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | كيفية احتواء الفيديو ضمن مربعه، مثل `object-fit` في CSS (`class="object-cover"`). تشغّل iOS وmacOS وAndroid كلًّا من `"none"` و`"scale-down"` على أنه `"contain"`، وتشغّل Linux كليهما على أنه `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | المللي ثانية بين أحداث `onProgress`. |

حدّد حجم الفيديو من خلال أنماطه؛ فحجمه هو الحجم الذي تحدده أنماطه. استخدم الحجم الذي يبلّغ عنه `onLoad` لضبط نسبة العرض إلى الارتفاع عندما تريد أن يحتفظ الفيديو بأبعاده الأصلية.

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات المرسلة | متى يحدث |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | لا شيء | بدأ التحميل. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`، `size`) | الفيديو جاهز: مدته بالثواني وحجمه بالبكسل. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`، `duration`) | كل `progressUpdateInterval` أثناء التشغيل (بالثواني). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | توقف التشغيل بانتظار البيانات / استؤنف. |
| `onEnd` | `.on_end` | لا شيء | وصل التشغيل إلى النهاية (ومع `repeat`، عند نهاية كل دورة). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`، الرسالة) | فشل التحميل أو التشغيل؛ وتكون قيمة `code` هي `"ERR_ACCESS_DENIED"` عندما يكون المصدر غير ممنوح بموجب قدرات التطبيق. |

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

## دوال المرجع

| الدالة | Rust | الوصف |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | ينتقل إلى وقت محدد. |

<a id="capabilities"></a>

## القدرات

عندما يعلن التطبيق عن [القدرات](../docs/sandbox-and-capabilities.md)، تُحمَّل مصادر الفيديو من المضيفين الذين يسمح بهم `network`؛ أما المصدر على مضيف آخر فيعرض عنصر عرض فارغًا ويبلّغ عن `onError` مع `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- ترسم iOS الفيديو داخل `AVPlayerLayer`، أو في عنصر عرض المشغّل الخاص بالنظام عند استخدام `controls`؛ ويتم تحميل AVFoundation عند إنشاء أول فيديو.
- تشغّل Android الفيديو باستخدام MediaPlayer على TextureView، مع MediaController لـ `controls`.
