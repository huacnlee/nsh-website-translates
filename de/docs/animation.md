---
title: "Animation"
description: "Motions (vorgefertigte Eingangs- und Ausgangsanimationen, Aufmerksamkeitseffekte und Loops oder eigene Keyframes), Style-Transitions und Keyframe-Animationen, animierte Werte mit Timing, Spring, Decay und Keyframes, Interpolation, zusammengesetzte Animationen, Easing, Layout-Animationen und was auf dem UI-Thread läuft, in Rust und TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---


# Animation

Jede Animation in NSH läuft auf dem UI-Thread. Du beschreibst sie einmal, in Rust oder TSX, und die Plattform spielt sie Bild für Bild ab (Core Animation und ein Display Link unter iOS, der UI-Thread-Animator unter Android), ohne in deinen Code zurückzurufen. Ein ausgelasteter Engine-Thread kann eine Animation nicht ruckeln lassen, und eine Animation verbraucht während der Wiedergabe keinen Code von dir.

Es gibt sechs Werkzeuge, vom einfachsten bis zum flexibelsten:

| Werkzeug | Einsatzzweck |
|---|---|
| [Motion](#motion) | Eine View, die erscheint, verschwindet, Aufmerksamkeit erregt oder sich wiederholt: vorgefertigte Motions (`fadeInUp`, `shake`, `pulse`, ...) oder eigene Keyframes für Opacity und Transform. |
| [Transitions](#transitions) | Eine Stiländerung, die animiert statt zu springen: eine Farbe, eine Opacity, ein Transform. |
| [Keyframe-Animationen](#keyframe-animations) | Ein Spinner, ein pulsierender Platzhalter, ein hüpfender Hinweis. |
| [Keyframes](#keyframes) | Jeder animierte Wert über Keyframes, so wie CSS sie abspielt: Offsets, eine Easing-Funktion pro Segment, Iterationen und eine Richtung. |
| [Animierte Werte](#animated-values) | Alles, was über die Zeit von einem Wert gesteuert wird: Springs, Gesten, Scroll-Position, Sequenzen. |
| [Layout-Animationen](#layoutanimation) | Änderungen von Größe und Position nach einem Update: eingefügte, entfernte oder umsortierte Elemente, ein aufklappendes Panel. |

## Motion

Eine Motion bewegt die Opacity und den Transform einer View über Keyframes, nativ. Erstelle sie in der Komponente, der die View gehört (`motion()` in Rust, `createMotion()` aus `nsh` in TSX), binde sie an die View und spiele darauf eine vorgefertigte oder eine eigene Motion ab. `enter` setzt die View an den Startpunkt einer Motion und spielt sie sofort ab, sodass die View ab dem ersten Frame hereinkommt.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

Eine Motion hat pro Kanal einen animierten Wert: `opacity` (0..1), `translateX` und `translateY` (Punkte), `rotate`, `rotateX` und `rotateY` (Grad), `scale`, `scaleX` und `scaleY`. Sie beginnen im Ruhezustand (Opacity und Skalierungen 1, der Rest 0) und werden in dieser Reihenfolge angewendet: Translationen, dann Rotationen, dann Skalierungen, jeweils um den Transform-Ursprung der View. Eine Motion hat kein eigenes Aussehen: Sie bewegt, was du gestaltet hast.

Eine Motion bewegt nur Opacity und Transform. Wenn du `m.style` per Spread übergibst, setzt das `opacity` und `transform` der View; um eine eigene Opacity beizubehalten, binde nur die Schritte (`transform: m.transform`). Farben bewegst du mit einem animierten Wert und [`interpolate`](#interpolation).

| TSX | Rust | Beschreibung |
|---|---|---|
| `createMotion(options?)` | `motion()` | Eine Motion, bei der jeder Kanal im Ruhezustand ist. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Gibt an, wo Kanäle starten; die übrigen starten im Ruhezustand. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Startet dort, wo `enter` startet, und spielt es sofort ab; die übrigen Optionen ändern das Timing. `enter` legt die Kanäle fest, die sie bewegt, über `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Bindet die Kanäle: `m.style` ist `{ opacity, transform }`, dessen `transform` eine Liste von sieben Schritten ist (`scale` wird in `scaleX` und `scaleY` aufgeteilt). Sie werden nach `translate`, `rotate` und `scale` der View angewendet; eine Perspektive davor verleiht einem 3D-Flip seine Tiefe: `transform: [{ perspective: 800 }, ...m.transform]`. In Rust wird der Transform der Motion nach dem eigenen Transform der View angewendet. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | Der animierte Wert eines Kanals, zum Interpolieren oder zum manuellen Steuern. |
| `m.play(motion, options?)` | `m.play(spec)` | Spielt ein Preset oder eine eigene Motion ab; eine neue unterbricht die laufende. Wird mit `{ finished }`, `true` aufgelöst, wenn sie beendet ist (`AnimationEnd` in Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | Dieselbe Motion als [zusammengesetzte Animation](#composite-animations), nicht gestartet, um sie mit anderen zu sequenzieren, zu staffeln oder zu wiederholen. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | Spielt sie auch dann ab, wenn der Nutzer weniger Bewegung wünscht. |
| `m.stop()` | `m.stop()` | Hält sie an der aktuellen Stelle an. |
| `m.reset()` | `m.reset()` | Hält sie an und setzt jeden Kanal in den Ruhezustand zurück. |

### Presets

Die vorgefertigten Motions sind Daten: `motions` aus `nsh` (`motions.fadeInUp` ist das, was `play("fadeInUp")` abspielt) und `MotionPreset` in Rust (`MotionPreset::FadeInUp.spec()`). Distanzen sind in Punkten angegeben und auf Controls und Karten abgestimmt; skaliere bei größeren Views die Werte einer Motion oder schreibe eigene Keyframes. `swing` und die anderen Rotationen drehen um den Transform-Ursprung der View: Gib einem schwingenden Schild `transformOrigin: "top"` (`.origin_top()`).

**Eintritt**: Sie starten unsichtbar oder entfernt und enden im Ruhezustand.

| TSX | Rust | Dauer | Beschreibung |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | Blendet ein. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | Blendet ein und steigt an seine Position auf. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | Blendet ein und fällt an seine Position. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | Blendet ein und kommt von links. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | Blendet ein und kommt von rechts. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | Blendet ein und wächst von 90 % an. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | Poppt auf: wächst von der halben Größe über die eigene hinaus und setzt sich. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | Springt herein und schwingt zweimal über. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | Gleitet von unten herein, ohne Einblenden (Sheets, Toasts). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | Gleitet von oben herunter, ohne Einblenden. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | Kippt um die horizontale Achse herein. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | Kippt um die vertikale Achse herein. |

**Austritt**: Sie starten im Ruhezustand und enden unsichtbar oder entfernt.

| TSX | Rust | Dauer | Beschreibung |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | Blendet aus. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | Blendet aus und steigt davon. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | Blendet aus und fällt davon. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | Blendet nach links aus. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | Blendet nach rechts aus. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | Blendet aus und schrumpft auf 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | Poppt aus: bläht sich kurz auf und schrumpft dann weg. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | Gleitet nach unten aus dem Sichtfeld, ohne Ausblenden. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | Gleitet nach oben aus dem Sichtfeld, ohne Ausblenden. |

**Aufmerksamkeit**: Sie starten und enden im Ruhezustand.

| TSX | Rust | Dauer | Beschreibung |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | Schüttelt sich seitlich: ein falsches Passwort, ein ungültiges Feld. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | Schüttelt den Kopf: ein sanfteres Nein. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | Wackelt um sein Zentrum: etwas, das auffallen soll. |
| `swing` | `MotionPreset::Swing` | 900 ms | Schwingt von der Oberkante aus, wie ein Schild. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | Wächst ein wenig und schrumpft zurück: eine sanfte Betonung. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | Schlägt zweimal, wie ein Herz: ein Like, ein Favorit. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | Staucht und streckt sich wie Gummi. |
| `jello` | `MotionPreset::Jello` | 800 ms | Wabbelt wie Wackelpudding. |
| `tada` | `MotionPreset::Tada` | 900 ms | Schrumpft und wächst dann mit einem Wackeln: eine Belohnung. |
| `jump` | `MotionPreset::Jump` | 700 ms | Springt und landet mit einer Stauchung. |
| `flash` | `MotionPreset::Flash` | 800 ms | Blinkt zweimal aus und ein. |

**Schleife**: Sie wiederholen sich, bis sie gestoppt werden.

| TSX | Rust | Dauer | Beschreibung |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | Dreht sich einmal, endlos. |
| `float` | `MotionPreset::Float` | 1500 ms | Schwebt auf und ab, endlos. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | Atmet: wächst und verblasst ein wenig, endlos. |
| `sway` | `MotionPreset::Sway` | 1600 ms | Wiegt sich um sein Zentrum, endlos. |
| `bob` | `MotionPreset::Bob` | 1000 ms | Hüpft wie ein springender Ball, endlos. |
| `glow` | `MotionPreset::Glow` | 2000 ms | Glüht auf und ab, endlos. |

`play` übernimmt die Timing-Optionen eines Presets (`m.play("shake", { duration: 300 })`), und ein Preset lässt sich per Spread in eine eigene Motion übernehmen (`m.play({ ...motions.fadeInUp, duration: 600 })`). Ändere in Rust die Spec eines Presets: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Eigene Motions

Eine eigene Motion besteht aus Keyframes pro Kanal und einem Timing (den Optionen der [Keyframes](#keyframes)). Schreibe in TSX die Keyframes jedes Kanals (`{ opacity: [0, 1] }`) oder eine Liste von Frames, wie die Web Animations API sie schreibt (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), jeweils mit `offset` und `easing`. In einer Liste von Frames sitzt ein Frame ohne Offset dort, wo seine Position in der Liste ihn hinsetzt, und ein Kanal folgt den Frames, die ihn nennen. Winkel können Strings sein (`"45deg"`, `"0.5turn"`). Baue in Rust eine `MotionSpec`.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### Einblendungen und gestaffelte Listen

Gib jeder Zeile eine Eintritts-Motion mit einer Verzögerung, die mit ihrem Index wächst: Zeilen, die gemeinsam erscheinen, kommen nacheinander herein. Begrenze die Verzögerung, damit eine weit unten in der Liste hinzugefügte Zeile nicht warten muss.

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

Motions lassen sich auch kombinieren: `m.animation(..)` ist eine Motion als [zusammengesetzte Animation](#composite-animations), nicht gestartet, sodass `Animated.stagger` eine Gruppe davon nativ ausführt, gezählt vom ersten Element, vom letzten, von der Mitte oder von einem beliebigen Index. Gib ihnen ein unsichtbares `initial` (oder lass sie dort starten, wo die Motion startet), damit vor ihrem Einsatz nichts zu sehen ist.

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### Ausblendungen

Spiele den Austritt ab, warte darauf und entferne dann die View. Eine [Layout-Animation](#layoutanimation) lässt die umliegenden Views die Lücke schließen.

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

Motions folgen von selbst der Einstellung [Bewegung reduzieren](#reduced-motion) des Nutzers: Wenn der Nutzer weniger Bewegung wünscht, landet eine Motion sofort an ihrem Endpunkt, ohne sich zu bewegen.

## Transitions

Benenne, was animiert werden soll und wie lange (`.transition_all().duration(400.0)` in Rust, `transitionProperty` und `transitionDuration` in TSX), und spätere Änderungen an diesen Eigenschaften werden nativ vom aktuell angezeigten Wert zum neuen Wert animiert.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| Style | Rust | Typ | Beschreibung |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | Was animiert wird, kommagetrennt: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Millisekunden als Zahl oder eine CSS-Zeitangabe. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Vor dem Start. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | Die Kurve. |

Eigenschaften, die per Transition animiert werden, nach Gruppen: **Farben** (Hintergrund-, Rahmen-, Outline-, Schatten- und Textfarben, Verlaufsstopps), **Opacity**, **Transform**, **Schatten** (`box-shadow`) und **Form** (Eckenradius und Breite). Sowohl CSS-Namen als auch ihre camelCase-Formen funktionieren (`background-color`, `backgroundColor`, `transform`, `scale`, ...). Layoutänderungen werden mit [Layout-Animationen](#layoutanimation) animiert.

Mit Tailwind sieht dasselbe so aus: `transition` (Farben, Opacity, Schatten und Transforms), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, mit `duration-*`, `delay-*` und `ease-*`. In Kombination mit dem Pressed-Zustand (`.active(..)`, `active:`) ergibt das animierte Pressed-Zustände:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

Eine Transition startet vom aktuell angezeigten Wert, sodass eine erneute Änderung des Ziels mittendrin eine weiche Wendung ergibt.

<a id="keyframe-animations"></a>

## Keyframe-Animationen

Vier eingebaute Keyframe-Animationen laufen nativ, standardmäßig endlos: `spin` (eine Drehung im Uhrzeigersinn), `ping` (skaliert auf das Doppelte und blendet aus), `pulse` (blendet auf halbe Opacity und zurück) und `bounce` (springt um ein Viertel der eigenen Höhe nach oben und landet).

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| Style | Rust | Typ | Beschreibung |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` oder `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | Die Animation. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Eine Iteration. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Vor dem Start. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | wie `transitionTimingFunction` | Die Kurve. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | Standard ist `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Animierte Werte

Ein animierter Wert ist eine Zahl, die auf dem UI-Thread lebt. Erstelle einen (`animated_value(..)` in Rust, `createAnimatedValue` aus `nsh` in TSX), binde ihn an Styles und animiere ihn; die gebundenen Views folgen ihm in jedem Frame ohne Update.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**Was sich binden lässt:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (jede Seite) und der `color` eines Texts (der gesamte Text), über eine Interpolation zu Farben (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, ein Wert pro Achse), `rotate` (Grad) und `scale` (`[x, y]` pro Achse oder ein Wert für beide); und die Schritte einer `transform`-Liste: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` und `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` in Grad, `.bind_transform(kind, ..)` in Rust). Schatten ändern sich mit [Transitions](#transitions). Ein Fokusring oder ein Preis, der grün aufblitzt, ist eine Farbinterpolation, die an die Rahmen- oder Textfarbe gebunden ist:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

Animierte Werte steuern auch [Canvas-Zeichnungen](./canvas.md#driving-drawings-with-animated-values), empfangen Scroll-Offsets ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) und Gesten ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

Der Wert wird von den daran gebundenen Views und von der Komponente, die ihn erstellt hat, am Leben gehalten, sodass eine Bindung verbunden bleibt, egal wie deine Variablen kommen und gehen. Erstelle animierte Werte in der Komponente, der sie gehören (nicht auf Modulebene, wenn jede Instanz ihren eigenen braucht).
<a id="animatedvalue-methods"></a>

### AnimatedValue-Methoden

| TSX | Rust | Beschreibung |
|---|---|---|
| `set(value)` | `set(value)` | Springt zu `value` und stoppt dabei jede Animation. |
| `stop()` | `stop()` | Stoppt die laufende Animation an der aktuellen Stelle; in TSX wird mit `{ value }` aufgelöst, dem Wert an dieser Stelle. |
| `getValue()` | `value()` | Der aktuelle Wert, gelesen auf dem UI-Thread, wo er sich bewegt (er beruhigt sich innerhalb eines Frames): in TSX ein Promise, in Rust eine awaitbare Antwort. |
| `setOffset(offset)` | `set_offset(offset)` | Addiert `offset` zu dem, was der Wert anzeigt: Bindings sehen Wert + Offset, während `set`, Animationen und Drags den Wert bewegen. |
| `flattenOffset()` | `flatten_offset()` | Addiert den Offset zum Wert und setzt den Offset auf 0. |
| `extractOffset()` | `extract_offset()` | Verschiebt den Wert in den Offset und setzt den Wert auf 0: Ein Drag beginnt dann bei 0, aufbauend auf der Stelle, an der der letzte endete. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Animiert zu `to` über `duration` ms (Standard 300, Easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Federt zu `to` (Standardwerte: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Läuft mit `velocity` (Einheiten pro Sekunde) aus und wird langsamer (Standard: deceleration 0.998 pro ms). Mit einem Clamp von `[min, max]` stoppt er an einer Grenze oder prallt davon ab und behält dabei `bounce` (0..1) seiner Geschwindigkeit. |

Jede Animation liefert eine Antwort, die Sie abwarten können und die angibt, ob sie beendet wurde: `true`, wenn sie bis zum Ende gespielt wurde, `false`, wenn sie gestoppt wurde (`stop()`, `set()` oder eine neue Animation auf demselben Wert). In TSX ist das ein `Promise<{ finished: boolean }>`, in Rust ein `AnimationEnd`, das ein Task für das `bool` abwartet. Beim Start einer neuen Animation auf einem bewegten Wert wird die alte sanft unterbrochen: Eine Feder oder ein Decay ohne Geschwindigkeitsangabe setzt mit der aktuellen Geschwindigkeit des Werts fort.

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

### Keyframes

`keyframes` spielt einen Wert durch Keyframes ab, so wie CSS-Keyframes abgespielt werden: `value.keyframes(frames, options)` in TSX, `value.keyframes(frames, KeyframeTiming)` in Rust (`Animated.keyframes(value, { keyframes, ... })` und `Animation::keyframes(..)` als Schritt einer [zusammengesetzten Animation](#composite-animations)). Ein Keyframe ist eine Zahl (oder ein Winkel-String wie `"90deg"`), gleichmäßig auf die übrigen verteilt, oder `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` in Rust).

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| Option | Rust (`KeyframeTiming`) | Standard | Beschreibung |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Eine Iteration, in Millisekunden. |
| `delay` | `.delay(ms)` | 0 | Vor der ersten Iteration. |
| `easing` | `.easing(easing)` | CSS `ease` | Die Kurve jedes Segments ohne eigenes Easing. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Wie viele Iterationen, oder `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` oder `"alternate-reverse"`. |

Sie werden wie in CSS und der Web Animations API abgespielt:

- Ein Easing formt jedes Segment, nicht das Ganze: Das `easing` eines Keyframes formt das Segment, das bei ihm beginnt, und das `easing` des Timings jedes andere Segment.
- Keyframes ohne Offset werden gleichmäßig zwischen ihren Nachbarn verteilt; der erste hat standardmäßig 0 und der letzte 1.
- Jede Iteration beginnt mit einem Sprung zu ihrem ersten Keyframe. Ohne Keyframe bei Offset 0 geht der Wert von seiner aktuellen Stelle aus.
- Während eines `delay` hält der Wert bereits den ersten Keyframe (CSS `animation-fill-mode: backwards`), sodass ein verzögerter Auftritt seinen ersten Frame zeigt statt der View im Ruhezustand. Das gilt auch für Motions.
- `reverse` und die Rückwärts-Iterationen von `alternate` spielen die Segmente rückwärts ab, jedes mit umgekehrter Kurve.
- Der Wert bleibt dort, wo die letzte Iteration ihn zurücklässt. Die Antwort gibt an, ob sie beendet wurden: `true`, wenn ja, `false`, wenn sie gestoppt wurden.

### Interpolation

`interpolate` bildet einen Wert über stückweise lineare Segmente auf Zahlen, Farben oder Winkel ab und gibt einen neuen Knoten zurück, den Sie binden können. Ein Wert kann viele Properties steuern. In Rust bildet `interpolate(&input, &output)` auf Zahlen ab, `interpolate_colors(&input, &colors)` auf Farben, und `interpolate_with(&input, output, Interpolation { .. })` nimmt die Extrapolation und das Easing entgegen; in TSX nimmt `value.interpolate({ inputRange, outputRange })` alle entgegen.

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| Option | Rust | Beschreibung |
|---|---|---|
| `inputRange` | der Eingabe-Slice | Aufsteigende Eingabe-Stützstellen. |
| `outputRange` | der Ausgabe-Slice oder `AnimationOutput` | Eine Ausgabe pro Stützstelle: Zahlen, Farben (`"#rrggbb"`, `"rgba(…)"`, benannt) oder Winkel (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | Außerhalb des Eingabebereichs: `"clamp"` (Standard), `"extend"` (die Endsegmente fortsetzen) oder `"identity"` (die Eingabe durchreichen). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | Dasselbe, für eine Seite. |
| `easing` | `easing` | Formt jedes Segment. |

> [!IMPORTANT]
> Interpolationen **begrenzen** (Clamp) standardmäßig: Außerhalb des Eingabebereichs bleibt die Ausgabe am nächstgelegenen Ende. Wird eine Scroll-View über ihren oberen Rand hinausgezogen, bleibt ein scrollgekoppelter Header daher in seinem Endzustand. Übergeben Sie `extrapolate: "extend"` (`Extrapolate::Extend`), wenn die Linie weiterlaufen soll.

<a id="arithmetic-and-diffclamp"></a>

### Arithmetik und diffClamp

Knoten lassen sich mit Arithmetik kombinieren, ebenfalls nativ: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` in Rust; für ein positives `b` nie negativ, z. B. Winkel in 0..360), wobei `b` ein Knoten oder eine Zahl ist. In TSX sind `Animated.add`, `subtract`, `multiply`, `divide` und `modulo` dasselbe als Funktionen.

`diffClamp(min, max)` (`diff_clamp`) folgt den *Änderungen* des Knotens und bleibt dabei innerhalb von `min..max`. Auf einen Scroll-Offset angewendet, ergibt das einen Header, der sich ausblendet, während der Inhalt nach oben scrollt, und sofort wiederkommt, sobald nach unten gescrollt wird:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

Mit `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`) vollendet ein Header, der beim Stoppen des Scrollens teilweise sichtbar geblieben ist, die Bewegung: Er rastet vollständig sichtbar oder vollständig verborgen ein, je nachdem, was näher liegt, in 200 ms auf dem UI-Thread. Er blendet sich erst aus, wenn die Seite mindestens um seine Höhe gescrollt wurde; eine weniger weit gescrollte Seite zeigt den ganzen Header. Wird während der Bewegung erneut gescrollt, übernimmt das Scrollen von der Stelle, an der sich der Header befindet.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## Zusammengesetzte Animationen

Animationen werden aus Schritten aufgebaut (`Animation` in Rust, `Animated` aus `nsh` in TSX), und der gesamte Baum läuft nativ: Jeder Schritt startet auf dem UI-Thread in dem Moment, in dem der vorherige endet, ohne Lücke und ohne dass Ihr Code dazwischen läuft.

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | Beschreibung |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Ein Timing-Schritt. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Ein Spring-Schritt. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Ein Decay-Schritt. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | Nacheinander. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Alle gleichzeitig. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Alle gleichzeitig, wobei jede `ms` nach der vorherigen startet, gezählt ab `from`: `"first"` (Standard), `"last"`, `"center"` (eine Welle von der Mitte nach außen) oder ein Index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Ein Schritt aus [Keyframes](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Wartet. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Wiederholt (standardmäßig endlos; `None` in Rust). |

Eine zusammengesetzte Animation hat `start()` (in TSX auch mit einem Callback und einem Promise, die beide `{ finished }` erhalten; in Rust ein awaitbares `bool`; ein erneuter Aufruf startet sie erneut), `stop()` (stoppt an der aktuellen Stelle) und `reset()` (stoppt und setzt ihre Werte auf den Stand zurück, den sie beim Start hatten). Der Callback läuft einmal für den gesamten Baum.

Eine laufende Animation hält ihre Werte nicht am Leben: Wenn die Komponente, die sie besitzt (ihre Views und Variablen), verschwindet, endet mit ihr auch eine Endlosschleife, und ihre Antwort lautet, dass sie nicht beendet wurde (`false`).

## Easing

Easing-Kurven sind Daten, die nativ ausgewertet werden: `Easing` aus `nsh` in TSX, das Enum `Easing` in Rust.

| TSX | Rust | Beschreibung |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Konstante Geschwindigkeit; CSS-`ease`. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Sinusförmig, kreisförmig, exponentiell. |
| `Easing.back(s?)` | `Curve::Back(s)` | Holt aus, bevor es losgeht (Overshoot `s`, standardmäßig 1.70158). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Federndes Überschwingen. |
| `Easing.bounce` | `Curve::Bounce` | Springt am Ende auf und ab. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Eine kubische Bézier-Kurve, wie in CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Springt zwischen `count` Stufen, statt sich zu bewegen, wie CSS-`steps()`: ein Frame-für-Frame-Sprite, ein tickender Zeiger. `position` ist `"jump-end"` (Standard, auch `"end"`), `"jump-start"` (`"start"`), `"jump-none"` oder `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | Die Kurven sind „In"-Kurven; `out` und `inOut` drehen sie um. |

In TSX können Sie überall dort, wo ein Easing akzeptiert wird, auch einen Namen (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) oder ein Bézier-Array `[x1, y1, x2, y2]` übergeben; in Rust sind `Easing::EaseIn`, `Easing::EaseOut` und `Easing::EaseInOut` die CSS-Kurven.

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)` (`sample_easing` in Rust) liefert die Kurve an `count` gleichmäßig verteilten Punkten von 0 bis 1, und `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) die Werte, durch die eine Feder oder ein Decay läuft, einen pro Frame (standardmäßig 60 pro Sekunde), ab `config.from` (0) bis zu ihrem Ende. Sie werden vom selben nativen Code berechnet, den die Animationen ausführen, sodass ein Diagramm einer Kurve genau zeigt, was die Animation tut:

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

Eine Layout-Animation animiert die Frame-Änderungen des **nächsten** Updates nativ: Views, die sich bewegen oder ihre Größe ändern, gleiten in ihre neuen Frames, neue Views blenden ein (oder skalieren ein), entfernte Views blenden aus. Rufen Sie sie unmittelbar vor der Zustandsänderung auf: `animate_layout(..)` in Rust, `LayoutAnimation.configureNext(config)` in TSX.

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | Beschreibung |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Animiert die Änderungen des nächsten Commits; in TSX läuft `onEnd` nach Abschluss. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Eine Config mit einer Kurve für alle drei Phasen. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Vorgefertigte Configs. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` mit einem Preset | `configureNext` mit einem Preset. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Die Namen, zum Aufbau von Configs. |

Eine Config ist `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` in Rust): `create` für eingefügte Views, `update` für verschobene oder in der Größe geänderte, `delete` für entfernte. Jede Phase ist `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), wobei `type` `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` oder `"keyboard"` ist (die eigene Kurve der Software-Tastatur, getaktet ab dem Moment, in dem sich die Tastatur zu bewegen begann, sodass sich mit ihr bewegt, was ihr Platz macht; `LayoutCurve::Keyboard`), `property` ist das, was erscheinende und verschwindende Views animieren (`"opacity"`, `"scaleXY"`, `"scale"`), und `springDamping` (0..1, standardmäßig 0.7; `LayoutCurve::Spring { damping }`) legt das Überschwingen der Feder fest.

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

Eine Layout-Animation erfasst jeden Frame, den das Update ändert, an beliebiger Stelle des Bildschirms: Eine Liste, die sich aktualisiert, oder Live-Daten, die im selben Update eintreffen, bewegen sich mit. In einer Rust-Komponente animieren Sie mit `ElementRef::animate_layout(transition)` nur das, was sich durch die Änderung eines einzelnen Elements bewegt: den eigenen Frame des Elements und den seines Inhalts sowie die Frames der Views, die seine Größe mitschiebt (seine Geschwister und deren Geschwister, bis hinauf zum Bildschirm). Die übrigen Frames des Updates ändern sich sofort. So legen `nsh/base`s `Collapsible` und `AccordionPanel` ihren Inhalt offen.

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## Was wo läuft

| | Läuft auf | Ihr Code pro Frame |
|---|---|---|
| Transitions, Keyframe-Animationen | UI-Thread | keiner |
| Motions, Keyframes, `timing` / `spring` / `decay`, zusammengesetzte Animationen | UI-Thread | keiner; Ihr Code erfährt, wann sie enden |
| `interpolate`, Arithmetik, `diffClamp` | UI-Thread | keiner |
| `scrollValue`, `pan` / `pinch` / `rotation` | UI-Thread | keiner; Ihr Code erfährt Start und Ende |
| Layout-Animationen | UI-Thread | keiner |
| `requestAnimationFrame`-Schleifen (`request_animation_frame` in Rust), `onScroll`-Handler, `PanResponder` | Ihr Code, dann ein Update | jeden Frame |

Greifen Sie zu `requestAnimationFrame` (in TSX ein Global, das dem Display folgt) nur für das, was sich nicht im Voraus beschreiben lässt, etwa eine Physiksimulation in Ihrem Code. Alles, was ein animierter Wert sein kann, sollte einer sein.

<a id="reduced-motion"></a>

## Reduzierte Bewegung

Wenn der Nutzer weniger Bewegung wünscht (iOS „Bewegung reduzieren", Android „Animationen entfernen"), sind `reduce_motion()` in Rust und `reduceMotion()` aus `nsh` in TSX `true`, und die Tailwind-Varianten `motion-reduce:` / `motion-safe:` greifen.

[Motions](#motion) folgen der Einstellung von selbst: `play` und `enter` landen sofort dort, wo die Motion endet, ohne sich zu bewegen, und die Antwort lautet, dass sie beendet wurde (`true`), genau wie bei einer Motion, die abgespielt wurde. Ein Austritt endet weiterhin verborgen, ein Auftritt weiterhin im Ruhezustand. Übergeben Sie `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` in Rust) für eine Motion, die eine Bedeutung trägt, die der Nutzer braucht, etwa ein Fortschritts-Spinner.

Transitions, Keyframe-Animationen, animierte Werte, Keyframes und zusammengesetzte Animationen werden wie geschrieben abgespielt; nutzen Sie diese, um eine ruhigere Alternative zu wählen:

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

Siehe [Accessibility](./accessibility.md#reduced-motion).

<a id="related"></a>

## Siehe auch

- [Animations-API von `nsh`](../modules/nsh.md#animation): die TSX-Referenz.
- [Touch und Gesten](./touch-and-gestures.md): animierte Werte mit dem Finger steuern.
- [Scrolling](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): animierte Werte in Zeichnungen.
- [Style-Referenz](../modules/style-reference.md): die Schlüssel `transition*` und `animation*`.
