---
title: "Video"
description: "O elemento Video: reprodução de vídeo nativa com controles próprios ou do sistema."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---


# Video

A video view reproduz um arquivo ou stream de vídeo com o player da plataforma: AVPlayer no iOS e no Mac Catalyst, MediaPlayer no Android. A reprodução é controlada por props (`paused`, `muted`, `rate`, …), de modo que o player acompanha o seu estado como qualquer outra view. Em Rust, cria-se uma com `video(url)`; em TSX, com `<Video>` de `nsh`.

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

Em TSX, `src` é obrigatório (veja a [Video API](../modules/nsh-video.md)). Veja o [guia de web view e vídeo](../docs/web-view-and-video.md).

## Props

Um vídeo recebe as props de uma [view](./view.md) (ele não tem filhos) mais:

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | A URL do vídeo (em Rust, também o `uri` de um asset: `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | A reprodução está pausada. |
| `muted` | `.muted(..)` | `boolean` | `false` | Sem som. |
| `volume` | `.volume(..)` | `number` | `1` | 0..1. |
| `rate` | `.rate(..)` | `number` | `1` | A velocidade de reprodução. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | Reproduz novamente desde o início ao chegar ao fim. |
| `controls` | `.controls(..)` | `boolean` | `false` | Exibe os controles de reprodução da plataforma. |
| `objectFit` (style), classes `object-*` | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Como o vídeo se ajusta à sua caixa, como o `object-fit` do CSS (`class="object-cover"`). iOS, macOS e Android reproduzem `"none"` e `"scale-down"` como `"contain"`, e o Linux reproduz ambos como `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Milissegundos entre eventos `onProgress`. |

Defina o tamanho do vídeo por meio dos seus estilos; o tamanho dele é o que os estilos determinam. Use o tamanho informado por `onLoad` para definir uma proporção (aspect ratio) quando quiser as proporções originais do vídeo.

<a id="events"></a>

## Eventos

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | nenhum | O carregamento começou. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo`: `duration`, `size`) | O vídeo está pronto: sua duração em segundos e seu tamanho em pixels. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress`: `current_time`, `duration`) | A cada `progressUpdateInterval` durante a reprodução (em segundos). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | A reprodução parou por falta de dados / foi retomada. |
| `onEnd` | `.on_end` | nenhum | A reprodução chegou ao fim (com `repeat`, ao fim de cada repetição). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, a mensagem) | O carregamento ou a reprodução falhou; `code` é `"ERR_ACCESS_DENIED"` para uma fonte que as capabilities do app não permitem. |

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

| Método | Rust | Descrição |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Salta para um instante. |

## Capabilities

Quando o app declara [capabilities](../docs/sandbox-and-capabilities.md), as fontes de vídeo são carregadas dos hosts que `network` permite; uma fonte em outro host exibe uma view vazia e reporta `onError` com `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Notas por plataforma

- O iOS desenha o vídeo em um `AVPlayerLayer`, ou na view de player do sistema com `controls`; o AVFoundation é carregado na primeira vez que um vídeo é criado.
- O Android reproduz com MediaPlayer em uma TextureView, com um MediaController para `controls`.
