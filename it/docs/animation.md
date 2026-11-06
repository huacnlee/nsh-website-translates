---
title: "Animazione"
description: "Motion (entrate, uscite, richiami di attenzione e loop predefiniti, oppure i tuoi keyframe personalizzati), transizioni di stile e animazioni con keyframe, valori animati con timing, spring, decay e keyframe, interpolazione, animazioni composite, easing, animazioni di layout e cosa viene eseguito sul thread della UI, in Rust e TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# Animazione

Ogni animazione in NSH viene eseguita sul thread UI. La descrivi una sola volta, da Rust o TSX, e la piattaforma la riproduce fotogramma per fotogramma (Core Animation e un display link su iOS, l'animator del thread UI su Android) senza richiamare il tuo codice. Un thread del motore occupato non può far scattare un'animazione, e un'animazione non costa nulla al tuo codice mentre è in esecuzione.

Gli strumenti sono sei, dal più pronto all'uso al più flessibile:

| Strumento | Quando usarlo |
|---|---|
| [Motion](#motion) | Una view che entra, esce, attira l'attenzione o va in loop: motion predefiniti (`fadeInUp`, `shake`, `pulse`, ...) o keyframe tuoi, su opacità e transform. |
| [Transizioni](#transitions) | Un cambio di stile che deve essere animato invece di scattare: un colore, un'opacità, un transform. |
| [Animazioni a keyframe](#keyframe-animations) | Uno spinner, un segnaposto che pulsa, un suggerimento che rimbalza. |
| [Keyframes](#keyframes) | Qualsiasi valore animato tramite keyframe, come li riproduce il CSS: offset, un easing per segmento, iterazioni e una direzione. |
| [Valori animati](#animated-values) | Tutto ciò che è guidato da un valore nel tempo: molle, gesti, posizione di scroll, sequenze. |
| [Animazioni di layout](#layoutanimation) | Cambi di dimensione e posizione dopo un aggiornamento: elementi inseriti, rimossi, riordinati, un pannello che si espande. |

## Motion

Un motion muove opacità e transform di una view, tramite keyframe, in modo nativo. Creane uno nel componente che possiede la view (`motion()` in Rust, `createMotion()` da `nsh` in TSX), associalo alla view e riproduci su di esso un motion predefinito o uno tuo. `enter` fa partire la view dove inizia un motion e lo riproduce subito, così la view entra fin dal primo fotogramma.

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

Un motion ha un valore animato per canale: `opacity` (0..1), `translateX` e `translateY` (punti), `rotate`, `rotateX` e `rotateY` (gradi), `scale`, `scaleX` e `scaleY`. Partono a riposo (opacità e scale a 1, il resto a 0) e si applicano in questo ordine: traslazioni, poi rotazioni, poi scale, rispetto all'origine del transform della view. Un motion non ha un aspetto proprio: muove ciò che hai stilizzato.

Un motion muove solo opacità e transform. Lo spread di `m.style` imposta `opacity` e `transform` della view; per mantenere un'opacità tua, associa solo gli step (`transform: m.transform`). I colori si muovono con un valore animato e [`interpolate`](#interpolation).

| TSX | Rust | Descrizione |
|---|---|---|
| `createMotion(options?)` | `motion()` | Un motion con ogni canale a riposo. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Dove partono i canali; gli altri partono a riposo. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Parte da dove parte `enter` e lo riproduce subito; le altre opzioni ne cambiano i tempi. `enter` imposta i canali che muove, su `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Associa i canali: `m.style` è `{ opacity, transform }`, il suo `transform` un elenco di sette step (`scale` è incorporato in `scaleX` e `scaleY`). Si applicano dopo `translate`, `rotate` e `scale` della view; una perspective prima di essi dà profondità a un flip 3D: `transform: [{ perspective: 800 }, ...m.transform]`. In Rust il transform del motion si applica dopo quello proprio della view. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | Il valore animato di un canale, da interpolare o da guidare a mano. |
| `m.play(motion, options?)` | `m.play(spec)` | Riproduce un preset o un motion tuo; uno nuovo interrompe quello in corso. Si risolve con `{ finished }`, `true` al termine (`AnimationEnd` in Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | Lo stesso motion come [animazione composita](#composite-animations), non avviata, da sequenziare, sfalsare o ripetere insieme ad altre. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | La riproduce anche quando l'utente chiede meno movimento. |
| `m.stop()` | `m.stop()` | La ferma dov'è. |
| `m.reset()` | `m.reset()` | La ferma e riporta ogni canale a riposo. |

<a id="presets"></a>

### Preset

I motion predefiniti sono dati: `motions` da `nsh` (`motions.fadeInUp` è ciò che riproduce `play("fadeInUp")`) e `MotionPreset` in Rust (`MotionPreset::FadeInUp.spec()`). Le distanze sono in punti, dimensionate per controlli e card; per view più grandi, scala i valori di un motion o scrivi i tuoi keyframe. `swing` e le altre rotazioni ruotano rispetto all'origine del transform della view: dai a un cartello oscillante `transformOrigin: "top"` (`.origin_top()`).

**Entrata**: partono nascosti o lontani e finiscono a riposo.

| TSX | Rust | Durata | Descrizione |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | Dissolvenza in entrata. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | Dissolvenza in entrata, salendo al suo posto. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | Dissolvenza in entrata, scendendo al suo posto. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | Dissolvenza in entrata, arrivando da sinistra. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | Dissolvenza in entrata, arrivando da destra. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | Dissolvenza in entrata, crescendo dal 90 %. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | Compare di scatto: cresce dalla metà della sua dimensione fino a superare la propria e poi si assesta. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | Entra rimbalzando, con due overshoot. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | Scivola verso l'alto dal basso, senza dissolvenza (sheet, toast). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | Scivola verso il basso dall'alto, senza dissolvenza. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | Entra con un ribaltamento attorno al suo asse orizzontale. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | Entra con un ribaltamento attorno al suo asse verticale. |

**Uscita**: partono a riposo e finiscono nascosti o lontani.

| TSX | Rust | Durata | Descrizione |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | Dissolvenza in uscita. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | Dissolvenza in uscita, salendo via. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | Dissolvenza in uscita, scendendo via. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | Dissolvenza in uscita verso sinistra. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | Dissolvenza in uscita verso destra. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | Dissolvenza in uscita, rimpicciolendosi al 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | Scompare di scatto: si gonfia un poco, poi si rimpicciolisce fino a sparire. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | Scivola verso il basso fuori dalla vista, senza dissolvenza. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | Scivola verso l'alto fuori dalla vista, senza dissolvenza. |

**Attenzione**: partono e finiscono a riposo.

| TSX | Rust | Durata | Descrizione |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | Scuote lateralmente: una password errata, un campo non valido. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | Scuote la testa: un no più gentile. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | Dondola attorno al suo centro: qualcosa da notare. |
| `swing` | `MotionPreset::Swing` | 900 ms | Oscilla dal bordo superiore, come un cartello. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | Cresce un poco e torna indietro: un'enfasi leggera. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | Pulsa due volte, come un cuore: un like, un preferito. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | Si schiaccia e si allunga come la gomma. |
| `jello` | `MotionPreset::Jello` | 800 ms | Ondeggia come la gelatina. |
| `tada` | `MotionPreset::Tada` | 900 ms | Si rimpicciolisce, poi cresce con un dondolio: una ricompensa. |
| `jump` | `MotionPreset::Jump` | 700 ms | Salta e atterra schiacciandosi. |
| `flash` | `MotionPreset::Flash` | 800 ms | Lampeggia, spegnendosi e accendendosi due volte. |

**Loop**: si ripetono finché non vengono fermati.

| TSX | Rust | Durata | Descrizione |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | Compie un giro, all'infinito. |
| `float` | `MotionPreset::Float` | 1500 ms | Fluttua su e giù, all'infinito. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | Respira: cresce e sbiadisce un poco, all'infinito. |
| `sway` | `MotionPreset::Sway` | 1600 ms | Ondeggia attorno al suo centro, all'infinito. |
| `bob` | `MotionPreset::Bob` | 1000 ms | Sobbalza come una palla che rimbalza, all'infinito. |
| `glow` | `MotionPreset::Glow` | 2000 ms | Si illumina e si attenua, all'infinito. |

`play` accetta, sopra un preset, le opzioni di timing di quest'ultimo (`m.play("shake", { duration: 300 })`), e un preset può essere espanso con lo spread in un motion tuo (`m.play({ ...motions.fadeInUp, duration: 600 })`). In Rust, modifica la spec di un preset: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Motion personalizzati

Un motion tuo è fatto di keyframe per canale e di un unico timing (le opzioni dei [keyframe](#keyframes)). In TSX, scrivi i keyframe di ogni canale (`{ opacity: [0, 1] }`), oppure un elenco di frame come li scrive la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), ciascun frame con il proprio `offset` e `easing`. In un elenco di frame, un frame senza offset si trova dove lo pone la sua posizione nell'elenco, e un canale segue i frame che lo nominano. Gli angoli possono essere stringhe (`"45deg"`, `"0.5turn"`). In Rust, costruisci un `MotionSpec`.

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

### Entrate e liste sfalsate

Dai a ogni riga un motion di entrata, con un delay che cresce con il suo indice: le righe che compaiono insieme entrano una dopo l'altra. Limita il delay, così che una riga aggiunta in fondo alla lista non debba aspettare.

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

Anche i motion si compongono: `m.animation(..)` è un motion come [animazione composita](#composite-animations), non avviata, quindi `Animated.stagger` ne esegue un gruppo in modo nativo, contando dal primo elemento, dall'ultimo, dal centro o da un indice qualsiasi. Dai loro un `initial` nascosto (o falli partire da dove parte il motion) in modo che nulla si veda prima del proprio turno.

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

### Uscite

Riproduci l'uscita, attendila, poi rimuovi la view. Un'[animazione di layout](#layoutanimation) permette alle view intorno di chiudere il vuoto.

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

I motion seguono da soli l'impostazione di [movimento ridotto](#reduced-motion) dell'utente: quando l'utente chiede meno movimento, un motion arriva subito dove finisce, senza muoversi.

<a id="transitions"></a>

## Transizioni

Indica cosa animare e per quanto tempo (`.transition_all().duration(400.0)` in Rust, `transitionProperty` e `transitionDuration` in TSX), e le modifiche successive a quelle proprietà vengono animate in modo nativo, da ciò che è a schermo al nuovo valore.

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

| Stile | Rust | Tipo | Descrizione |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | Cosa viene animato, separato da virgole: `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Millisecondi come numero, oppure un tempo CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Prima che parta. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | La curva. |

Le proprietà che supportano le transizioni, per gruppo: **colori** (colori di sfondo, bordo, outline, ombra e testo, gradient stop), **opacità**, **transform**, **ombre** (`box-shadow`) e **forma** (raggio e spessore del bordo). Funzionano sia i nomi CSS sia le rispettive forme camel-case (`background-color`, `backgroundColor`, `transform`, `scale`, ...). I cambi di layout si animano con le [animazioni di layout](#layoutanimation).

Con Tailwind, la stessa cosa si scrive `transition` (colori, opacità, ombre e transform), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, con `duration-*`, `delay-*` e `ease-*`. Combinato con lo stato premuto (`.active(..)`, `active:`) dà stati premuti animati:

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

Una transizione parte dal valore attualmente a schermo, quindi se cambi di nuovo il valore di destinazione a metà strada, l'animazione vira in modo fluido.

<a id="keyframe-animations"></a>

## Animazioni a keyframe

Quattro animazioni a keyframe integrate vengono eseguite in modo nativo, per impostazione predefinita all'infinito: `spin` (un giro in senso orario), `ping` (si ingrandisce fino a 2× e svanisce), `pulse` (sfuma a metà opacità e torna) e `bounce` (salta in alto di un quarto della sua altezza e atterra).

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

| Stile | Rust | Tipo | Descrizione |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` o `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | L'animazione. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Un'iterazione. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Prima che parta. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | come `transitionTimingFunction` | La curva. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | Predefinito `"infinite"`. |

Tailwind: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Valori animati

Un valore animato è un numero che vive sul thread UI. Creane uno (`animated_value(..)` in Rust, `createAnimatedValue` da `nsh` in TSX), associalo agli stili e animalo; le view associate lo seguono a ogni fotogramma senza bisogno di un aggiornamento.

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

**Cosa si può associare:** `opacity` (`.bind_opacity(..)`); `backgroundColor`, `borderColor` (ogni lato) e il `color` di un testo (l'intero testo), tramite un'interpolazione ai colori (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`); `translate` (`[x, y]`, un valore per asse), `rotate` (gradi) e `scale` (`[x, y]` per asse, o un solo valore per entrambi); e gli step di un elenco `transform`: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` e `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` in gradi, `.bind_transform(kind, ..)` in Rust). Le ombre cambiano con le [transizioni](#transitions). Un focus ring o un prezzo che lampeggia di verde è un'interpolazione di colore associata al colore del bordo o del testo:

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

I valori animati guidano anche i [disegni su canvas](./canvas.md#driving-drawings-with-animated-values), ricevono gli offset di scroll ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) e i gesti ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

Il valore è mantenuto in vita dalle view associate e dal componente che lo ha creato, quindi un'associazione resta connessa comunque vadano e vengano le tue variabili. Crea i valori animati nel componente che li possiede (non a livello di modulo quando ogni istanza ne ha bisogno di uno proprio).
<a id="animatedvalue-methods"></a>

### Metodi di AnimatedValue

| TSX | Rust | Descrizione |
|---|---|---|
| `set(value)` | `set(value)` | Salta a `value`, interrompendo qualsiasi animazione. |
| `stop()` | `stop()` | Ferma l'animazione in corso dove si trova; in TSX si risolve con `{ value }`, il valore in quel punto. |
| `getValue()` | `value()` | Il valore corrente, letto sul thread UI dove si muove (si assesta entro un frame): una promise in TSX, una risposta awaitable in Rust. |
| `setOffset(offset)` | `set_offset(offset)` | Aggiunge `offset` a ciò che il valore mostra: i binding vedono valore + offset, mentre `set`, le animazioni e i drag muovono il valore. |
| `flattenOffset()` | `flatten_offset()` | Aggiunge l'offset al valore e porta l'offset a 0. |
| `extractOffset()` | `extract_offset()` | Sposta il valore nell'offset e porta il valore a 0: un drag parte quindi da 0, sopra il punto in cui si era fermato l'ultimo. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Anima verso `to` in `duration` ms (predefinito 300, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Raggiunge `to` con una molla (predefiniti: stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Scorre a partire da `velocity` (unità al secondo) e rallenta (decelerazione predefinita 0,998 per ms). Con un clamp di `[min, max]` si ferma a un limite, oppure rimbalza mantenendo `bounce` (0..1) della sua velocità. |

Ogni animazione restituisce una risposta che puoi attendere e che dice se è terminata: `true` quando è stata eseguita fino in fondo, `false` quando qualcosa l'ha fermata (`stop()`, `set()`, o una nuova animazione sullo stesso valore). È una `Promise<{ finished: boolean }>` in TSX e un `AnimationEnd` in Rust, che un task attende con `bool`. Avviare una nuova animazione su un valore in movimento interrompe quella precedente in modo fluido: una molla o un decay senza velocità proseguono con la velocità corrente del valore.

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

<a id="keyframes"></a>

### Keyframe

`keyframes` riproduce un valore attraverso dei keyframe come avviene per i keyframe CSS: `value.keyframes(frames, options)` in TSX, `value.keyframes(frames, KeyframeTiming)` in Rust (`Animated.keyframes(value, { keyframes, ... })` e `Animation::keyframes(..)` come step di una [animazione composita](#composite-animations)). Un keyframe è un numero (o una stringa di angolo come `"90deg"`), distribuito uniformemente con gli altri, oppure `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` in Rust).

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

| Opzione | Rust (`KeyframeTiming`) | Predefinito | Descrizione |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Una iterazione, in millisecondi. |
| `delay` | `.delay(ms)` | 0 | Prima della prima iterazione. |
| `easing` | `.easing(easing)` | CSS `ease` | La curva di ogni segmento privo di un easing proprio. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Quante iterazioni, oppure `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` o `"alternate-reverse"`. |

Vengono riprodotti come in CSS e nella Web Animations API:

- Un easing modella ogni segmento, non l'insieme: l'`easing` di un keyframe modella il segmento che parte da esso, e l'`easing` del timing ogni altro segmento.
- I keyframe senza offset si distribuiscono uniformemente tra i vicini; il primo ha per default 0 e l'ultimo 1.
- Ogni iterazione parte con un salto al suo primo keyframe. Senza un keyframe all'offset 0, il valore parte da dove si trova.
- Durante un `delay`, il valore contiene già il primo keyframe (CSS `animation-fill-mode: backwards`), così un'entrata ritardata mostra il suo primo frame invece della vista a riposo. Questo vale anche per i motion.
- `reverse` e le iterazioni all'indietro di `alternate` eseguono i segmenti al contrario, ciascuno con la curva invertita.
- Il valore resta dove lo lascia l'ultima iterazione. La risposta dice se sono terminate: `true` quando lo sono, `false` quando qualcosa le ha fermate.

<a id="interpolation"></a>

### Interpolazione

`interpolate` mappa un valore, tramite segmenti lineari a tratti, su numeri, colori o angoli, e restituisce un nuovo nodo che puoi collegare con un binding. Un solo valore può guidare molte proprietà. In Rust, `interpolate(&input, &output)` mappa su numeri, `interpolate_colors(&input, &colors)` su colori, e `interpolate_with(&input, output, Interpolation { .. })` accetta extrapolation ed easing; in TSX, `value.interpolate({ inputRange, outputRange })` accetta tutto.

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

| Opzione | Rust | Descrizione |
|---|---|---|
| `inputRange` | lo slice di input | Punti di input crescenti. |
| `outputRange` | lo slice di output, oppure `AnimationOutput` | Un output per ogni punto: numeri, colori (`"#rrggbb"`, `"rgba(…)"`, con nome) o angoli (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | Fuori dall'intervallo di input: `"clamp"` (predefinito), `"extend"` (prosegue i segmenti finali) o `"identity"` (lascia passare l'input). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | Lo stesso, per un solo lato. |
| `easing` | `easing` | Modella ogni segmento. |

> [!IMPORTANT]
> Le interpolazioni fanno il **clamp** per impostazione predefinita: fuori dall'intervallo di input, l'output resta all'estremo più vicino. Trascinare una scroll view oltre la sua cima mantiene quindi un header legato allo scroll nel suo stato finale. Passa `extrapolate: "extend"` (`Extrapolate::Extend`) quando vuoi che la linea prosegua.

<a id="arithmetic-and-diffclamp"></a>

### Aritmetica e diffClamp

I nodi si combinano con l'aritmetica, anche in modo nativo: `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` in Rust; mai negativo per un `b` positivo, ad esempio angoli in 0..360), dove `b` è un nodo o un numero. In TSX, `Animated.add`, `subtract`, `multiply`, `divide` e `modulo` sono equivalenti, come funzioni.

`diffClamp(min, max)` (`diff_clamp`) segue le *variazioni* del nodo restando entro `min..max`. Applicato a un offset di scroll, produce un header che si nasconde mentre il contenuto scorre verso l'alto e torna visibile non appena scorre verso il basso:

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

Con `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`), un header lasciato parzialmente visibile quando lo scorrimento si ferma completa il movimento: si assesta completamente visibile o completamente nascosto, a seconda di quale sia più vicino, in 200 ms sul thread UI. Si nasconde solo dopo che la pagina è scorsa almeno quanto la sua altezza, quindi una pagina scorsa meno di così mostra l'header per intero. Scorrere di nuovo durante il movimento riprende da dove si trova l'header.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## Animazioni composite

Le animazioni si costruiscono a partire da step (`Animation` in Rust, `Animated` da `nsh` in TSX) e l'intero albero viene eseguito in modo nativo: ogni step parte sul thread UI nell'istante in cui termina il precedente, senza pause e senza che il tuo codice si intrometta.

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

| TSX | Rust | Descrizione |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Uno step di timing. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Uno step di molla. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Uno step di decay. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | Uno dopo l'altro. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Tutti insieme. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Tutti insieme, ciascuno con un ritardo di `ms` rispetto al precedente, contando da `from`: `"first"` (il predefinito), `"last"`, `"center"` (un'onda che si propaga dal centro) o un indice (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Uno step di [keyframe](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Attende. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Ripete (all'infinito per impostazione predefinita; `None` in Rust). |

Un'animazione composita ha `start()` (in TSX anche con una callback e una promise, entrambe ricevono `{ finished }`; in Rust un `bool` awaitable; richiamarla la esegue di nuovo), `stop()` (si ferma dove si trova) e `reset()` (si ferma e riporta i suoi valori a dove erano quando è partita). La callback viene eseguita una sola volta per l'intero albero.

Un'animazione in corso non mantiene in vita i propri valori: quando il componente che li possiede scompare (le sue view e le sue variabili), un ciclo infinito si ferma con loro, e la sua risposta è che non è terminata (`false`).

## Easing

Le curve di easing sono dati, valutati in modo nativo: `Easing` da `nsh` in TSX, l'enum `Easing` in Rust.

| TSX | Rust | Descrizione |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Velocità costante; il `ease` di CSS. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Sinusoidale, circolare, esponenziale. |
| `Easing.back(s?)` | `Curve::Back(s)` | Si ritrae prima di partire (overshoot `s`, 1,70158 per impostazione predefinita). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Overshoot elastico. |
| `Easing.bounce` | `Curve::Bounce` | Rimbalza alla fine. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Una Bézier cubica, come in CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Salta tra `count` livelli invece di muoversi, come il `steps()` di CSS: uno sprite frame per frame, una lancetta che scatta. `position` è `"jump-end"` (il predefinito, anche `"end"`), `"jump-start"` (`"start"`), `"jump-none"` o `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | Le curve sono curve "in"; `out` e `inOut` le rovesciano. |

In TSX, ovunque sia accettato un easing puoi anche passare un nome (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) o un array Bézier `[x1, y1, x2, y2]`; in Rust, `Easing::EaseIn`, `Easing::EaseOut` e `Easing::EaseInOut` sono le curve CSS.

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

`Easing.sample(easing, count)` (`sample_easing` in Rust) restituisce la curva in `count` punti equidistanti da 0 a 1, e `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) i valori che una molla o un decay attraversano, uno per frame (60 al secondo per impostazione predefinita) a partire da `config.from` (0) fino alla fine. Sono calcolati dallo stesso codice nativo che esegue le animazioni, quindi il grafico di una curva mostra esattamente ciò che fa l'animazione:

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

Una layout animation anima in modo nativo le variazioni di frame dell'aggiornamento **successivo**: le view che si spostano o cambiano dimensione scivolano verso i nuovi frame, le nuove view appaiono in dissolvenza (o con una scala), le view rimosse svaniscono. Chiamala subito prima del cambio di stato: `animate_layout(..)` in Rust, `LayoutAnimation.configureNext(config)` in TSX.

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

| TSX | Rust | Descrizione |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anima le modifiche del commit successivo; in TSX, `onEnd` viene eseguito al termine. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Una config con una sola curva per tutte e tre le fasi. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Config già pronte. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` con un preset | `configureNext` con un preset. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | I nomi, per costruire le config. |

Una config è `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` in Rust): `create` per le view inserite, `update` per quelle spostate o ridimensionate, `delete` per quelle rimosse. Ogni fase è `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), dove `type` è `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` o `"keyboard"` (la curva propria della tastiera software, temporizzata a partire da quando la tastiera ha iniziato a muoversi, in modo che ciò che le fa spazio si muova con lei; `LayoutCurve::Keyboard`), `property` è ciò che le view che appaiono e scompaiono animano (`"opacity"`, `"scaleXY"`, `"scale"`), e `springDamping` (0..1, 0,7 per impostazione predefinita; `LayoutCurve::Spring { damping }`) imposta l'overshoot della molla.

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

Una layout animation copre ogni frame che l'aggiornamento modifica, in qualsiasi punto dello schermo: una lista che si aggiorna o dati live che arrivano nello stesso aggiornamento si muovono insieme. In un componente Rust, anima solo ciò con cui si muove la modifica di un singolo elemento tramite `ElementRef::animate_layout(transition)`: il frame dell'elemento stesso e quello del suo contenuto, e quelli delle view che la sua dimensione spinge con sé (i suoi sibling e i loro, fino allo schermo). Gli altri frame dell'aggiornamento cambiano subito. È così che `nsh/base` con `Collapsible` e `AccordionPanel` rivela il proprio contenuto.

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

## Cosa viene eseguito dove

| | Eseguito su | Il tuo codice per frame |
|---|---|---|
| Transizioni, animazioni keyframe | Thread UI | nessuno |
| Motion, keyframe, `timing` / `spring` / `decay`, composite | Thread UI | nessuno; il tuo codice viene avvisato quando terminano |
| `interpolate`, aritmetica, `diffClamp` | Thread UI | nessuno |
| `scrollValue`, `pan` / `pinch` / `rotation` | Thread UI | nessuno; il tuo codice viene avvisato di inizio e fine |
| Layout animation | Thread UI | nessuno |
| Cicli `requestAnimationFrame` (`request_animation_frame` in Rust), handler `onScroll`, `PanResponder` | il tuo codice, poi un aggiornamento | a ogni frame |

Ricorri a `requestAnimationFrame` (un globale in TSX, che segue il display) solo per ciò che non si può descrivere in anticipo, come una simulazione fisica nel tuo codice. Tutto ciò che può essere un valore animato dovrebbe esserlo.

<a id="reduced-motion"></a>

## Movimento ridotto

Quando l'utente chiede meno movimento (iOS "Reduce Motion", Android "Remove animations"), `reduce_motion()` in Rust e `reduceMotion()` da `nsh` in TSX sono `true`, e si applicano le varianti Tailwind `motion-reduce:` / `motion-safe:`.

I [motion](#motion) seguono l'impostazione da soli: `play` e `enter` arrivano subito dove termina il motion, senza muoversi, e la risposta è che è terminato (`true`), come per un motion che è stato riprodotto. Un'uscita termina comunque nascosta, un'entrata termina comunque a riposo. Passa `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` in Rust) per un motion che porta un significato di cui l'utente ha bisogno, come uno spinner di avanzamento.

Transizioni, animazioni keyframe, valori animati, keyframe e composite vengono riprodotti così come scritti; usali per scegliere un'alternativa più sobria:

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

Vedi [Accessibilità](./accessibility.md#reduced-motion).

<a id="related"></a>

## Correlati

- [L'API di animazione di `nsh`](../modules/nsh.md#animation): il riferimento TSX.
- [Tocco e gesti](./touch-and-gestures.md): guidare i valori animati con il dito.
- [Scorrimento](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): valori animati nei disegni.
- [Riferimento degli stili](../modules/style-reference.md): le chiavi `transition*` e `animation*`.
