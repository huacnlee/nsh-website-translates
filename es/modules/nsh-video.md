---
title: "Video"
description: "Video, un reproductor de video nativo (AVPlayer, MediaPlayer), con sus props, eventos y métodos de ref."
order: 2.4
source_hash: 08a403c2bf02574e
---


# Video

`nsh` exporta `Video`: un reproductor de video construido sobre el reproductor de la plataforma (`AVPlayer` en iOS y Mac Catalyst, `MediaPlayer` en Android). La reproducción se controla con props, así que pausar es cuestión de una señal.

```ts
import { Video, type VideoProps } from "nsh";
```

Consulta [Web view y video](../docs/web-view-and-video.md) para ver la guía y [`<Video>`](../elements/video.md) para ver sus props.

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

`Video` acepta las [props de vista](../elements/view.md) (estilo, clases, layout, accesibilidad, `ref`; sin hijos), además de:

| Prop | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `src` | `string` | (obligatoria) | La URL del video. |
| `paused` | `boolean` | `false` | La reproducción está en pausa. |
| `muted` | `boolean` | `false` | Sin sonido. |
| `volume` | `number` | `1` | De 0 a 1. |
| `rate` | `number` | `1` | La velocidad de reproducción. |
| `repeat` | `boolean` | `false` | Al llegar al final, vuelve a reproducirse desde el principio. |
| `controls` | `boolean` | `false` | Muestra los controles de reproducción de la plataforma. |
| `objectFit` (style), clases `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Cómo se ajusta el video a su caja, igual que `object-fit` de CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Milisegundos entre eventos `onProgress`. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | Qué efecto tiene el sonido sobre el resto del audio del dispositivo: consulta [Sonido y otras apps](#sound-and-other-apps). |

<a id="sound-and-other-apps"></a>

### Sonido y otras apps

El sonido de un video sigue la configuración de audio de la app, que por defecto es la de la plataforma para video: en iOS, el modo silencio del dispositivo lo silencia. Una app que reproduce voz, como un audiolibro o un curso de idiomas, establece `audioSession`:

| `audioSession` | En modo silencio | Audio de otras apps mientras se reproduce |
|---|---|---|
| `"default"` | decide la configuración de audio de la app | decide la configuración de audio de la app |
| `"playback"` | el sonido se reproduce | se pausa, y se reanuda cuando el video se pausa, termina o desaparece |
| `"mixWithOthers"` | el sonido se reproduce | sigue reproduciéndose |

El ajuste surte efecto mientras el video se reproduce. En iOS, el primer video de este tipo que se reproduce establece `AVAudioSession` en la categoría `playback` con el modo `spokenAudio` (mezclándose con el audio de otras apps para `"mixWithOthers"`), y cuando ya no se reproduce ninguno, la sesión vuelve a su estado anterior y las apps que se habían pausado pueden reanudarse; `"default"` deja la sesión tal como la configuró la app, o la app que incrusta NSH. En Android, el sonido del reproductor se marca como voz, y un video `"playback"` mantiene el foco de audio mientras se reproduce: se pausa cuando otra app toma el foco (una llamada, un aviso de navegación) y continúa cuando este vuelve. Cambiar `audioSession` en Android vuelve a abrir la fuente. En los escritorios y en la web, el sonido se reproduce como el de cualquier otro video.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## Eventos

| Evento | Payload | Cuándo |
|---|---|---|
| `onLoadStart` | | El video empieza a cargarse. |
| `onLoad` | `{ duration: number; size: PixelSize }` | Está listo para reproducirse: su duración en segundos y su tamaño en píxeles. |
| `onProgress` | `{ currentTime: number; duration: number }` | Durante la reproducción, cada `progressUpdateInterval` ms. Segundos. |
| `onBuffer` | `{ isBuffering: boolean }` | La reproducción espera datos o se reanuda. |
| `onEnd` | | La reproducción llegó al final. |
| `onError` | `{ message: string }` | No se pudo cargar o reproducir el video. |

<a id="ref-methods"></a>

## Métodos del ref

| Método | Descripción |
|---|---|
| `seek(seconds)` | Salta a `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

<a id="capabilities"></a>

## Capacidades

Cuando tu app declara `capabilities` en `nsh.json`, las fuentes de video remotas deben estar permitidas en `network`, como `fetch`; una fuente rechazada no muestra nada. Consulta [Sandbox y capacidades](../docs/sandbox-and-capabilities.md).
