---
title: "Video"
description: "Video, ein nativer Videoplayer (AVPlayer, MediaPlayer), mit seinen Props, Events und Ref-Methoden."
order: 2.4
source_hash: 08a403c2bf02574e
---


# Video

`nsh` exportiert `Video`: einen Videoplayer, der auf dem Player der Plattform aufbaut (`AVPlayer` unter iOS und Mac Catalyst, `MediaPlayer` unter Android). Die Wiedergabe wird über Props gesteuert, sodass ein Pausieren nur ein Signal entfernt ist.

```ts
import { Video, type VideoProps } from "nsh";
```

Siehe [Web view and video](../docs/web-view-and-video.md) für die Anleitung und [`<Video>`](../elements/video.md) für die zugehörigen Props.

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

`Video` akzeptiert die [View-Props](../elements/view.md) (Style, Klassen, Layout, Barrierefreiheit, `ref`; keine Kinder) sowie:

| Prop | Typ | Standard | Beschreibung |
|---|---|---|---|
| `src` | `string` | (erforderlich) | Die URL des Videos. |
| `paused` | `boolean` | `false` | Die Wiedergabe ist pausiert. |
| `muted` | `boolean` | `false` | Kein Ton. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | Die Wiedergabegeschwindigkeit. |
| `repeat` | `boolean` | `false` | Spielt am Ende erneut von vorn ab. |
| `controls` | `boolean` | `false` | Zeigt die Wiedergabesteuerung der Plattform an. |
| `objectFit` (Style), `object-*` Klassen | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Wie das Video in seine Box passt, entsprechend CSS-`object-fit` (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Millisekunden zwischen den `onProgress`-Events. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | Wie sich der Ton auf das übrige Audio des Geräts auswirkt: siehe [Sound and other apps](#sound-and-other-apps). |

### Sound and other apps

Der Ton eines Videos folgt den Audioeinstellungen der App, die standardmäßig denen der Plattform für Video entsprechen: Unter iOS schaltet der Stummmodus des Geräts ihn stumm. Eine App, die Sprache wiedergibt, etwa ein Hörbuch oder ein Sprachkurs, setzt `audioSession`:

| `audioSession` | Im Stummmodus | Audio anderer Apps während der Wiedergabe |
|---|---|---|
| `"default"` | die Audioeinstellungen der App entscheiden | die Audioeinstellungen der App entscheiden |
| `"playback"` | der Ton wird abgespielt | wird pausiert und läuft weiter, sobald das Video pausiert, endet oder geht |
| `"mixWithOthers"` | der Ton wird abgespielt | läuft weiter |

Die Einstellung wirkt, solange das Video abgespielt wird. Unter iOS setzt das erste derartige Video, das abgespielt wird, `AVAudioSession` auf die Kategorie `playback` im Modus `spokenAudio` (Mischen mit dem Audio anderer Apps für `"mixWithOthers"`). Sobald keines mehr abgespielt wird, kehrt die Session in ihren vorherigen Zustand zurück, und die pausierten Apps können wieder abspielen; `"default"` lässt die Session so, wie die App oder die App, die NSH einbettet, sie gesetzt hat. Unter Android wird der Ton des Players als Sprache markiert, und ein `"playback"`-Video hält den Audio-Fokus, solange es abgespielt wird: Es pausiert, wenn eine andere App den Fokus übernimmt (ein Anruf, eine Navigationsansage), und spielt weiter, sobald der Fokus zurückkommt. Eine Änderung von `audioSession` unter Android öffnet die Quelle erneut. Auf den Desktop-Plattformen und im Web wird der Ton wie bei jedem anderen Video abgespielt.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

## Events

| Event | Payload | Wann |
|---|---|---|
| `onLoadStart` | | Das Video beginnt zu laden. |
| `onLoad` | `{ duration: number; size: PixelSize }` | Es ist abspielbereit: seine Länge in Sekunden und seine Größe in Pixeln. |
| `onProgress` | `{ currentTime: number; duration: number }` | Während der Wiedergabe alle `progressUpdateInterval` ms. Sekunden. |
| `onBuffer` | `{ isBuffering: boolean }` | Die Wiedergabe wartet auf Daten oder wird fortgesetzt. |
| `onEnd` | | Die Wiedergabe hat das Ende erreicht. |
| `onError` | `{ message: string }` | Das Video konnte nicht geladen oder abgespielt werden. |

## Ref methods

| Methode | Beschreibung |
|---|---|
| `seek(seconds)` | Springt zu `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

## Capabilities

Wenn Ihre App `capabilities` in `nsh.json` deklariert, müssen entfernte Videoquellen unter `network` zugelassen werden, wie `fetch`; eine abgelehnte Quelle zeigt nichts an. Siehe [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).
