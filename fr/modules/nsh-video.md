---
title: "Video"
description: "Video, un lecteur vidéo natif (AVPlayer, MediaPlayer), avec ses props, événements et méthodes de ref."
order: 2.4
source_hash: 08a403c2bf02574e
---

# Vidéo

`nsh` exporte `Video` : un lecteur vidéo construit sur le lecteur de la plateforme (`AVPlayer` sur iOS et Mac Catalyst, `MediaPlayer` sur Android). La lecture se pilote par des props : mettre en pause revient donc à changer un signal.

```ts
import { Video, type VideoProps } from "nsh";
```

Voir [Web view et vidéo](../docs/web-view-and-video.md) pour le guide et [`<Video>`](../elements/video.md) pour ses props.

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

`Video` accepte les [props de vue](../elements/view.md) (style, classes, mise en page, accessibilité, `ref` ; pas d'enfants), ainsi que :

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `src` | `string` | (obligatoire) | L'URL de la vidéo. |
| `paused` | `boolean` | `false` | La lecture est en pause. |
| `muted` | `boolean` | `false` | Pas de son. |
| `volume` | `number` | `1` | De 0 à 1. |
| `rate` | `number` | `1` | La vitesse de lecture. |
| `repeat` | `boolean` | `false` | Relance la lecture depuis le début une fois arrivée à la fin. |
| `controls` | `boolean` | `false` | Affiche les contrôles de lecture de la plateforme. |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | La façon dont la vidéo s'ajuste à son cadre, comme le `object-fit` de CSS (`class="object-cover"`). |
| `progressUpdateInterval` | `number` | `250` | Millisecondes entre deux événements `onProgress`. |
| `audioSession` | `"default" \| "playback" \| "mixWithOthers"` | `"default"` | L'effet du son sur le reste de l'audio de l'appareil : voir [Le son et les autres apps](#sound-and-other-apps). |

<a id="sound-and-other-apps"></a>

### Le son et les autres apps

Le son d'une vidéo suit les réglages audio de l'app, qui sont par défaut ceux de la plateforme pour la vidéo : sur iOS, le mode silencieux de l'appareil le coupe. Une app qui diffuse de la parole, comme un livre audio ou un cours de langue, définit `audioSession` :

| `audioSession` | En mode silencieux | Audio des autres apps pendant la lecture |
|---|---|---|
| `"default"` | les réglages audio de l'app décident | les réglages audio de l'app décident |
| `"playback"` | le son est lu | se met en pause, puis reprend lorsque la vidéo est mise en pause, se termine ou s'en va |
| `"mixWithOthers"` | le son est lu | continue de jouer |

Ce réglage prend effet pendant la lecture de la vidéo. Sur iOS, la première vidéo de ce type à être lue fait passer `AVAudioSession` dans la catégorie `playback` avec le mode `spokenAudio` (mélange avec l'audio des autres apps pour `"mixWithOthers"`), et lorsqu'aucune n'est plus en lecture, la session revient à son état antérieur et les apps qu'elle avait mises en pause peuvent reprendre ; `"default"` laisse la session telle que l'app, ou l'app qui intègre NSH, l'a définie. Sur Android, le son du lecteur est marqué comme de la parole, et une vidéo `"playback"` prend le focus audio pendant sa lecture : elle se met en pause lorsqu'une autre app prend le focus (un appel, une consigne de navigation) et reprend lorsqu'il revient. Modifier `audioSession` sur Android rouvre la source. Sur les ordinateurs de bureau et sur le web, le son est lu comme pour n'importe quelle vidéo.

```tsx
<Video src="asset:/greeting.m4a" audioSession="playback" />
```

<a id="events"></a>

## Événements

| Événement | Charge utile | Quand |
|---|---|---|
| `onLoadStart` | | La vidéo commence à se charger. |
| `onLoad` | `{ duration: number; size: PixelSize }` | Elle est prête à être lue : sa durée en secondes et sa taille en pixels. |
| `onProgress` | `{ currentTime: number; duration: number }` | Pendant la lecture, toutes les `progressUpdateInterval` ms. En secondes. |
| `onBuffer` | `{ isBuffering: boolean }` | La lecture attend des données, ou reprend. |
| `onEnd` | | La lecture a atteint la fin. |
| `onError` | `{ message: string }` | La vidéo n'a pas pu être chargée ou lue. |

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Description |
|---|---|
| `seek(seconds)` | Saute à `seconds`. |

```ts
const aspect = signal(16 / 9);

<Video src={url} onLoad={(e) => aspect.set(e.size.width / e.size.height)} style={{ width: "100%", aspectRatio: aspect() }} />;
```

<a id="capabilities"></a>

## Capacités

Lorsque votre app déclare `capabilities` dans `nsh.json`, les sources vidéo distantes doivent être autorisées sous `network`, comme `fetch` ; une source refusée n'affiche rien. Voir [Sandbox et capacités](../docs/sandbox-and-capabilities.md).
