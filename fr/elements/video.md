---
title: "Vidéo"
description: "L'élément Video : lecture vidéo native avec vos propres contrôles ou ceux du système."
order: 90
group: primitives
demo: el-video
source_hash: 7225c650d2f91cce
---

# Vidéo

Une vue vidéo lit un fichier ou un flux vidéo avec le lecteur de la plateforme : AVPlayer sur iOS et Mac Catalyst, MediaPlayer sur
Android. La lecture est contrôlée par des props (`paused`, `muted`, `rate`, …), de sorte que le lecteur suit votre état comme n'importe quelle
autre vue. Rust en crée une avec `video(url)`, TSX avec `<Video>` depuis `nsh`.

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

En TSX, `src` est requis (voir l'[API Video](../modules/nsh-video.md)). Voir le
[guide de la vue web et de la vidéo](../docs/web-view-and-video.md).

## Props

Une vidéo accepte les props d'une [vue](./view.md) (elle n'a pas d'enfants) ainsi que :

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `src` | `video(url)` | `string` | | L'URL de la vidéo (en Rust, le `uri` d'un asset convient aussi : `video(CLIP.uri)`). |
| `paused` | `.paused(..)` | `boolean` | `false` | La lecture est en pause. |
| `muted` | `.muted(..)` | `boolean` | `false` | Aucun son. |
| `volume` | `.volume(..)` | `number` | `1` | De 0 à 1. |
| `rate` | `.rate(..)` | `number` | `1` | La vitesse de lecture. |
| `repeat` | `.repeat(..)` | `boolean` | `false` | Relit depuis le début à la fin de la vidéo. |
| `controls` | `.controls(..)` | `boolean` | `false` | Affiche les contrôles de lecture de la plateforme. |
| `objectFit` (style), classes `object-*` | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Comment la vidéo s'adapte à sa boîte, comme le `object-fit` de CSS (`class="object-cover"`). iOS, macOS et Android lisent `"none"` et `"scale-down"` comme `"contain"`, Linux les deux comme `"scale-down"`. |
| `progressUpdateInterval` | `.progress_interval(ms)` | `number` | `250` | Millisecondes entre les événements `onProgress`. |

Donnez une taille à la vidéo via ses styles ; sa taille est celle que ses styles lui donnent. Utilisez la taille que `onLoad` indique pour définir
un rapport d'aspect lorsque vous voulez conserver les proportions propres à la vidéo.

<a id="events"></a>

## Événements

| Événement | Rust | Charge utile | Quand |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | aucune | Le chargement a commencé. |
| `onLoad` | `.on_load` | `{ duration, size }` (`VideoInfo` : `duration`, `size`) | La vidéo est prête : sa durée en secondes et sa taille en pixels. |
| `onProgress` | `.on_progress` | `{ currentTime, duration }` (`VideoProgress` : `current_time`, `duration`) | Tous les `progressUpdateInterval` pendant la lecture (en secondes). |
| `onBuffer` | `.on_buffer` | `{ isBuffering }` (`bool`) | La lecture est interrompue faute de données / a repris. |
| `onEnd` | `.on_end` | aucune | La lecture a atteint la fin (avec `repeat`, à la fin de chaque boucle). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, le message) | Le chargement ou la lecture a échoué ; `code` vaut `"ERR_ACCESS_DENIED"` pour une source que les capabilities de l'app n'autorisent pas. |

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

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `seek(seconds)` | `seek(seconds)` | Saute à un instant donné. |

## Capabilities

Lorsque l'app déclare des [capabilities](../docs/sandbox-and-capabilities.md), les sources vidéo se chargent depuis les hôtes que `network`
autorise ; une source sur un autre hôte affiche une vue vide et signale `onError` avec `code` `"ERR_ACCESS_DENIED"`.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS dessine la vidéo dans un `AVPlayerLayer`, ou dans la vue de lecteur système avec `controls` ; AVFoundation est chargé à la
  première création d'une vidéo.
- Android lit avec MediaPlayer sur une TextureView, avec un MediaController pour `controls`.
