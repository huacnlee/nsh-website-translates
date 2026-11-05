---
title: "Video"
description: "L'elemento Video: riproduzione video nativa con controlli personalizzati o di sistema."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# Video

Una video view riproduce un file video o uno stream con il player della piattaforma: AVPlayer su iOS e Mac Catalyst, MediaPlayer su Android. La riproduzione si controlla tramite props (`paused`, `muted`, `rate`, …), quindi il player segue il tuo stato come qualsiasi altra view. Rust ne crea una con `video(url)`, TSX con `<Video>` da `nsh`.

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

In TSX `src` è obbligatorio (vedi la [Video API](../modules/nsh-video.md)). Vedi la [guida a web view e video](../docs/web-view-and-video.md).

## Props

Un video accetta le props di una [view](./view.md) (non ha figli) più:

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | L'URL del video (in Rust anche il `uri` di un asset: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | La riproduzione è in pausa. |
| `muted` | `.muted(..)` | `boolean` | `false` | Nessun audio. |
| `volume` | `.volume(..)` | `number` | `1` | Da 0 a 1. |
| `rate` | `.rate(..)` | `number` | `1` | La velocità di riproduzione. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | Alla fine riparte dall'inizio. |
| `controls` | `.controls(..)` | `boolean` | `false` | Mostra i controlli di riproduzione della piattaforma. |
| `objectFit` (style), classi `object-*` | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Come il video si adatta al suo riquadro, come `object-fit` di CSS (`class="object-cover"`). iOS, macOS e Android riproducono `"none"` e `"scale-down"` come `"contain"`, Linux entrambi come `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Millisecondi tra gli eventi `onProgress`. |

Dai al video una dimensione tramite i suoi stili; la sua dimensione è quella che gli stili gli assegnano. Usa la dimensione riportata da `onLoad` per impostare un rapporto d'aspetto quando vuoi le proporzioni originali del video.

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | nessuno | Il caricamento è iniziato. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | Il video è pronto: la sua durata in secondi e la sua dimensione in pixel. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | A ogni `progressUpdateInterval` durante la riproduzione (secondi). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | La riproduzione si è bloccata in attesa di dati / è ripresa. |
| `onEnd` | `.on_end` | nessuno | La riproduzione ha raggiunto la fine (con `repeat`, alla fine di ogni ciclo). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, il messaggio) | Il caricamento o la riproduzione sono falliti; `code` è `"ERR_ACCESS_DENIED"` per una sorgente che le capabilities dell'app non consentono. |

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

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Salta a un istante. |

## Capabilities

Quando l'app dichiara le [capabilities](../docs/sandbox-and-capabilities.md), le sorgenti video vengono caricate dagli host che `network` consente; una sorgente su un altro host mostra una view vuota e segnala `onError` con `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS disegna il video in un `AVPlayerLayer`, oppure nella vista del player di sistema con `controls`; AVFoundation viene caricato la prima volta che viene creato un video.
- Android riproduce con MediaPlayer su un TextureView, con un MediaController per `controls`.
