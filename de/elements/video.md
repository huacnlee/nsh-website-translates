---
title: "Video"
description: "Das Video-Element: native Videowiedergabe mit eigenen oder den System-Steuerelementen."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---


# Video

Ein Video-View spielt eine Videodatei oder einen Stream mit dem Player der Plattform ab: AVPlayer unter iOS und Mac Catalyst, MediaPlayer unter Android. Die Wiedergabe wird über Props gesteuert (`paused`, `muted`, `rate`, …), sodass der Player wie jede andere View deinem State folgt. In Rust erzeugst du einen mit `video(url)`, in TSX mit `<Video>` aus `nsh`.

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

In TSX ist `src` erforderlich (siehe die [Video API](../modules/nsh-video.md)). Siehe auch den [Leitfaden zu Web View und Video](../docs/web-view-and-video.md).

## Props

Ein Video übernimmt die Props einer [View](./view.md) (es hat keine Kinder) sowie:

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | Die URL des Videos (in Rust auch der `uri` eines Assets: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | Die Wiedergabe ist pausiert. |
| `muted` | `.muted(..)` | `boolean` | `false` | Kein Ton. |
| `volume` | `.volume(..)` | `number` | `1` | 0..1. |
| `rate` | `.rate(..)` | `number` | `1` | Die Wiedergabegeschwindigkeit. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | Spielt am Ende erneut von vorn ab. |
| `controls` | `.controls(..)` | `boolean` | `false` | Zeigt die Wiedergabesteuerung der Plattform an. |
| `objectFit` (Style), `object-*` Klassen | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Wie das Video in seine Box passt, wie `object-fit` in CSS (`class="object-cover"`). iOS, macOS und Android spielen `"none"` und `"scale-down"` als `"contain"` ab, Linux beide als `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Millisekunden zwischen `onProgress`-Events. |

Gib dem Video seine Größe über seine Styles vor; seine Größe ist die, die seine Styles ihm geben. Nutze die von `onLoad` gemeldete Größe, um ein Seitenverhältnis festzulegen, wenn du die eigenen Proportionen des Videos verwenden möchtest.

## Events

| Event | Rust | Payload | Wann |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | keine | Das Laden hat begonnen. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | Das Video ist bereit: seine Dauer in Sekunden und seine Größe in Pixeln. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | Alle `progressUpdateInterval` während der Wiedergabe (Sekunden). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | Die Wiedergabe stockt wegen fehlender Daten / wird fortgesetzt. |
| `onEnd` | `.on_end` | keine | Die Wiedergabe hat das Ende erreicht (mit `repeat` am Ende jeder Schleife). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, die Meldung) | Laden oder Wiedergabe ist fehlgeschlagen; `code` ist `"ERR_ACCESS_DENIED"` bei einer Quelle, die die Capabilities der App nicht erlauben. |

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

## Ref-Methoden

| Methode | Rust | Beschreibung |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Springt zu einer Zeitposition. |

## Capabilities

Wenn die App [Capabilities](../docs/sandbox-and-capabilities.md) deklariert, werden Videoquellen von den Hosts geladen, die `network` erlaubt; eine Quelle auf einem anderen Host zeigt eine leere View und meldet `onError` mit `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS zeichnet das Video in einem `AVPlayerLayer` oder mit `controls` in der System-Player-View; AVFoundation wird beim ersten Erstellen eines Videos geladen.
- Android spielt mit MediaPlayer auf einer TextureView ab, mit einem MediaController für `controls`.
