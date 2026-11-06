---
title: "Video"
description: "Video, um player de vídeo nativo (AVPlayer, MediaPlayer), com suas props, eventos e métodos de ref."
order: 2.4
source_hash: 08a403c2bf02574e
---


# Video

`nsh` exporta `Video`: um player de vídeo construído sobre o player da plataforma (`AVPlayer` no iOS e no Mac Catalyst, `MediaPlayer` no Android). A reprodução é controlada por props, então pausar é questão de um sinal.

```ts
import { Video, type VideoProps } from "nsh";
```

Consulte [Web view and video](../docs/web-view-and-video.md) para o guia e [`<Video>`](../elements/video.md) para suas props.

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

`Video` aceita as [props de view](../elements/view.md) (estilo, classes, layout, acessibilidade, `ref`; sem filhos), além de:

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `src` | `string` | (obrigatório) | A URL do vídeo. |
| `paused` | `boolean` | `false` | A reprodução está pausada. |
| `muted` | `boolean` | `false` | Sem som. |
| `volume` | `number` | `1` | De 0 a 1. |
| `rate` | `number` | `1` | A velocidade de reprodução. |
| `repeat` | `boolean` | `false` | Reproduz novamente desde o início ao chegar ao fim. |
| `controls` | `boolean` | `false` | Exibe os controles de reprodução da plataforma. |
| `objectFit` (estilo), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Como o vídeo se ajusta à sua caixa, como o `object-fit` do CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Milissegundos entre eventos `onProgress`. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | O que o som faz com o restante do áudio do dispositivo: veja [Som e outros apps](#sound-and-other-apps). |

<a id="sound-and-other-apps"></a>

### Som e outros apps

O som de um vídeo segue as configurações de áudio do app, que por padrão são as da plataforma para vídeo: no iOS, o modo silencioso do dispositivo o silencia. Um app que reproduz fala, como um audiolivro ou um curso de idiomas, define `audioSession`:

| `audioSession` | No modo silencioso | Áudio de outros apps enquanto ele reproduz |
|---|---|---|
| `"default"` | as configurações de áudio do app decidem | as configurações de áudio do app decidem |
| `"playback"` | o som é reproduzido | é pausado e volta a tocar quando o vídeo é pausado, termina ou vai embora |
| `"mixWithOthers"` | o som é reproduzido | continua tocando |

A configuração entra em vigor enquanto o vídeo é reproduzido. No iOS, o primeiro vídeo desse tipo a ser reproduzido define `AVAudioSession` como a categoria `playback` no modo `spokenAudio` (misturando-se ao áudio de outros apps para `"mixWithOthers"`), e, quando nenhum está sendo reproduzido, a sessão volta ao que era e os apps que ele pausou podem voltar a tocar; `"default"` deixa a sessão como o app, ou o app que incorpora o NSH, a definiu. No Android, o som do player é marcado como fala, e um vídeo `"playback"` mantém o foco de áudio enquanto é reproduzido: ele é pausado quando outro app assume o foco (uma chamada, um aviso de navegação) e continua a tocar quando o foco volta. Alterar `audioSession` no Android abre a fonte novamente. Os desktops e a web reproduzem o som como reproduzem qualquer vídeo.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## Eventos

| Evento | Payload | Quando |
|---|---|---|
| `onLoadStart` | | O vídeo começa a carregar. |
| `onLoad` | `{ duration: number; size: PixelSize }` | Está pronto para ser reproduzido: sua duração em segundos e seu tamanho em pixels. |
| `onProgress` | `{ currentTime: number; duration: number }` | Durante a reprodução, a cada `progressUpdateInterval` ms. Segundos. |
| `onBuffer` | `{ isBuffering: boolean }` | A reprodução aguarda dados ou é retomada. |
| `onEnd` | | A reprodução chegou ao fim. |
| `onError` | `{ message: string }` | Não foi possível carregar ou reproduzir o vídeo. |

<a id="ref-methods"></a>

## Métodos de ref

| Método | Descrição |
|---|---|
| `seek(seconds)` | Salta para `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

Quando seu app declara `capabilities` em `nsh.json`, as fontes de vídeo remotas precisam ser permitidas em `network`, como `fetch`; uma fonte recusada não exibe nada. Consulte [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).
