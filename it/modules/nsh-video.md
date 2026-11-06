---
title: "Video"
description: "Video, un lettore video nativo (AVPlayer, MediaPlayer), con le sue props, i suoi eventi e i metodi del ref."
order: 2.4
source_hash: 08a403c2bf02574e
---

# Video

`nsh` esporta `Video`: un video player basato sul player della piattaforma (`AVPlayer` su iOS e Mac Catalyst, `MediaPlayer` su Android). La riproduzione è controllata tramite props, quindi mettere in pausa è questione di un semplice segnale.

```ts
import { Video, type VideoProps } from "nsh";
```

Consulta [Web view e video](../docs/web-view-and-video.md) per la guida e [`<Video>`](../elements/video.md) per le sue props.

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

`Video` accetta le [props delle view](../elements/view.md) (style, classes, layout, accessibilità, `ref`; nessun figlio), più:

| Prop | Tipo | Default | Descrizione |
|---|---|---|---|
| `src` | `string` | (obbligatoria) | L'URL del video. |
| `paused` | `boolean` | `false` | La riproduzione è in pausa. |
| `muted` | `boolean` | `false` | Nessun suono. |
| `volume` | `number` | `1` | Da 0 a 1. |
| `rate` | `number` | `1` | La velocità di riproduzione. |
| `repeat` | `boolean` | `false` | Alla fine riparte dall'inizio. |
| `controls` | `boolean` | `false` | Mostra i controlli di riproduzione della piattaforma. |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Come il video si adatta al suo riquadro, come `object-fit` di CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Millisecondi tra un evento `onProgress` e l'altro. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | Cosa fa il suono con il resto dell'audio del dispositivo: vedi [Suono e altre app](#sound-and-other-apps). |

<a id="sound-and-other-apps"></a>

### Suono e altre app

Il suono di un video segue le impostazioni audio dell'app, che per impostazione predefinita sono quelle della piattaforma per i video: su iOS la modalità silenziosa del dispositivo lo disattiva. Un'app che riproduce parlato, come un audiolibro o un corso di lingue, imposta `audioSession`:

| `audioSession` | In modalità silenziosa | Audio delle altre app durante la riproduzione |
|---|---|---|
| `"default"` | decidono le impostazioni audio dell'app | decidono le impostazioni audio dell'app |
| `"playback"` | il suono viene riprodotto | viene messo in pausa e riprende quando il video va in pausa, termina o se ne va |
| `"mixWithOthers"` | il suono viene riprodotto | continua a essere riprodotto |

L'impostazione ha effetto mentre il video è in riproduzione. Su iOS, il primo video di questo tipo che viene riprodotto imposta `AVAudioSession` sulla categoria `playback` nella modalità `spokenAudio` (mixando con l'audio delle altre app per `"mixWithOthers"`), e quando nessuno è più in riproduzione la sessione torna a com'era e le app che aveva messo in pausa possono riprendere; `"default"` lascia la sessione come l'ha impostata l'app, o l'app che incorpora NSH. Su Android il suono del player è contrassegnato come parlato, e un video `"playback"` mantiene l'audio focus durante la riproduzione: va in pausa quando un'altra app prende il focus (una chiamata, un'indicazione di navigazione) e riprende quando il focus torna. Modificare `audioSession` su Android riapre la sorgente. Sui desktop e sul web il suono viene riprodotto come per qualsiasi altro video.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## Eventi

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | | Il video inizia a caricarsi. |
| `onLoad` | `{ duration: number; size: PixelSize }` | È pronto per la riproduzione: la sua durata in secondi e le sue dimensioni in pixel. |
| `onProgress` | `{ currentTime: number; duration: number }` | Durante la riproduzione, ogni `progressUpdateInterval` ms. Secondi. |
| `onBuffer` | `{ isBuffering: boolean }` | La riproduzione è in attesa di dati, oppure riprende. |
| `onEnd` | | La riproduzione ha raggiunto la fine. |
| `onError` | `{ message: string }` | Non è stato possibile caricare o riprodurre il video. |

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Descrizione |
|---|---|
| `seek(seconds)` | Salta a `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

<a id="capabilities"></a>

## Capability

Quando la tua app dichiara `capabilities` in `nsh.json`, le sorgenti video remote devono essere consentite in `network`, come `fetch`; una sorgente rifiutata non mostra nulla. Vedi [Sandbox e capability](../docs/sandbox-and-capabilities.md).
