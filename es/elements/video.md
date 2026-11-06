---
title: "Video"
description: "El elemento Video: reproducción de vídeo nativa con tus propios controles o los del sistema."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---


# Video

A video view reproduce un archivo o flujo de vídeo con el reproductor de la plataforma: AVPlayer en iOS y Mac Catalyst, MediaPlayer en Android. La reproducción se controla mediante props (`paused`, `muted`, `rate`, …), de modo que el reproductor sigue tu estado como cualquier otra vista. Rust crea una con `video(url)`, TSX con `<Video>` de `nsh`.

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

En TSX, `src` es obligatorio (consulta la [Video API](../modules/nsh-video.md)). Consulta la [guía de web view y video](../docs/web-view-and-video.md).

## Props

Un video acepta las props de una [vista](./view.md) (no tiene hijos) y además:

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | La URL del video (en Rust, también el `uri` de un asset: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | La reproducción está en pausa. |
| `muted` | `.muted(..)` | `boolean` | `false` | Sin sonido. |
| `volume` | `.volume(..)` | `number` | `1` | 0..1. |
| `rate` | `.rate(..)` | `number` | `1` | La velocidad de reproducción. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | Vuelve a reproducirse desde el principio al llegar al final. |
| `controls` | `.controls(..)` | `boolean` | `false` | Muestra los controles de reproducción de la plataforma. |
| `objectFit` (estilo), clases `object-*` | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Cómo se ajusta el video a su caja, igual que `object-fit` de CSS (`class="object-cover"`). iOS, macOS y Android reproducen `"none"` y `"scale-down"` como `"contain"`, y Linux ambos como `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Milisegundos entre eventos `onProgress`. |

Dale un tamaño al video mediante sus estilos; su tamaño es el que le dan sus estilos. Usa el tamaño que informa `onLoad` para establecer una relación de aspecto cuando quieras las proporciones propias del video.

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Cuándo |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | ninguno | Comenzó la carga. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | El video está listo: su duración en segundos y su tamaño en píxeles. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | Cada `progressUpdateInterval` durante la reproducción (segundos). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | La reproducción se detuvo por falta de datos / se reanudó. |
| `onEnd` | `.on_end` | ninguno | La reproducción llegó al final (con `repeat`, al final de cada repetición). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, el mensaje) | Falló la carga o la reproducción; `code` es `"ERR_ACCESS_DENIED"` para una fuente que las capabilities de la app no permiten. |

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

## Métodos de ref

| Método | Rust | Descripción |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Salta a un instante. |

## Capabilities

Cuando la app declara [capabilities](../docs/sandbox-and-capabilities.md), las fuentes de video se cargan desde los hosts que `network` permite; una fuente en otro host muestra una vista vacía y notifica `onError` con `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Notas por plataforma

- iOS dibuja el video en un `AVPlayerLayer`, o en la vista de reproductor del sistema con `controls`; AVFoundation se carga la primera vez que se crea un video.
- Android reproduce con MediaPlayer sobre un TextureView, con un MediaController para `controls`.
