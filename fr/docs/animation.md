---
title: "Animation"
description: "Motions (entrées, sorties, effets d'attention et boucles prêts à l'emploi, ou vos propres keyframes), transitions de style et animations par keyframes, valeurs animées avec timing, spring, decay et keyframes, interpolation, animations composites, easing, animations de mise en page, et ce qui s'exécute sur le thread d'interface, en Rust et en TSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# Animation

Toute animation dans NSH s'exécute sur le thread UI. Vous la décrivez une seule fois, en Rust ou en TSX, et la plateforme la joue image par image (Core Animation et un display link sur iOS, l'animateur du thread UI sur Android) sans jamais rappeler votre code. Un thread moteur occupé ne peut pas faire saccader une animation, et une animation ne consomme aucun de vos cycles de code pendant qu'elle s'exécute.

Il existe six outils, du plus prêt à l'emploi au plus flexible :

| Outil | À utiliser pour |
|---|---|
| [Motion](#motion) | Une vue qui entre, sort, attire l'œil ou boucle : des motions prêtes à l'emploi (`fadeInUp`, `shake`, `pulse`, ...) ou vos propres keyframes, sur son opacité et sa transformation. |
| [Transitions](#transitions) | Un changement de style qui doit s'animer au lieu de sauter : une couleur, une opacité, une transformation. |
| [Animations par keyframes](#keyframe-animations) | Un spinner, un placeholder qui pulse, un indice qui rebondit. |
| [Keyframes](#keyframes) | Toute valeur animée par keyframes, comme CSS les joue : offsets, un easing par segment, itérations et direction. |
| [Valeurs animées](#animated-values) | Tout ce qui est piloté par une valeur dans le temps : springs, gestes, position de défilement, séquences. |
| [Animations de layout](#layoutanimation) | Les changements de taille et de position après une mise à jour : éléments insérés, supprimés, réordonnés, panneau qui se déploie. |

## Motion

Un motion anime l'opacité et la transformation d'une vue par keyframes, en natif. Créez-en un dans le composant qui possède la vue (`motion()` en Rust, `createMotion()` depuis `nsh` en TSX), liez-le à la vue, puis jouez dessus un motion prêt à l'emploi ou le vôtre. `enter` place la vue là où un motion commence et le joue aussitôt, de sorte que la vue arrive dès sa première image.

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

Un motion possède une valeur animée par canal : `opacity` (0..1), `translateX` et `translateY` (points), `rotate`, `rotateX` et `rotateY` (degrés), `scale`, `scaleX` et `scaleY`. Ils démarrent au repos (opacité et échelles à 1, le reste à 0) et s'appliquent dans cet ordre : translations, puis rotations, puis échelles, autour de l'origine de transformation de la vue. Un motion n'a pas d'apparence propre : il anime ce que vous avez stylé.

Un motion n'anime que l'opacité et la transformation. Étaler `m.style` définit les propriétés `opacity` et `transform` de la vue ; pour conserver votre propre opacité, ne liez que les étapes (`transform: m.transform`). Les couleurs s'animent avec une valeur animée et [`interpolate`](#interpolation).

| TSX | Rust | Description |
|---|---|---|
| `createMotion(options?)` | `motion()` | Un motion dont tous les canaux sont au repos. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | Définit où les canaux démarrent ; les autres démarrent au repos. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | Démarre là où `enter` démarre et le joue aussitôt ; les autres options modifient son timing. `enter` définit les canaux qu'il anime, sur `initial`. |
| `style={m.style}`, `m.transform` | `.bind_motion(&m)` | Lie les canaux : `m.style` vaut `{ opacity, transform }`, son `transform` est une liste de sept étapes (`scale` est intégré à `scaleX` et `scaleY`). Elles s'appliquent après les propriétés `translate`, `rotate` et `scale` de la vue ; une perspective placée avant elles donne sa profondeur à un flip 3D : `transform: [{ perspective: 800 }, ...m.transform]`. En Rust, la transformation du motion s'applique après celle de la vue. |
| `m.opacity`, `m.translateX`, ... | `m.value(MotionChannel::Opacity)`, ... | La valeur animée d'un canal, à interpoler ou à piloter à la main. |
| `m.play(motion, options?)` | `m.play(spec)` | Joue un preset ou un motion à vous ; un nouveau motion interrompt celui en cours. Se résout avec `{ finished }`, `true` à la fin (`AnimationEnd` en Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | Le même motion sous forme d'[animation composite](#composite-animations), non démarrée, à séquencer, décaler ou mettre en boucle avec d'autres. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | Le joue même lorsque l'utilisateur demande moins de mouvement. |
| `m.stop()` | `m.stop()` | L'arrête là où il en est. |
| `m.reset()` | `m.reset()` | L'arrête et remet chaque canal au repos. |

### Presets

Les motions prêts à l'emploi sont des données : `motions` depuis `nsh` (`motions.fadeInUp` est ce que `play("fadeInUp")` joue) et `MotionPreset` en Rust (`MotionPreset::FadeInUp.spec()`). Les distances sont en points, dimensionnées pour des contrôles et des cartes ; pour de plus grandes vues, mettez à l'échelle les valeurs d'un motion ou écrivez vos propres keyframes. `swing` et les autres rotations tournent autour de l'origine de transformation de la vue : donnez à une enseigne oscillante `transformOrigin: "top"` (`.origin_top()`).

**Entrée** : ils démarrent masqués ou éloignés et finissent au repos.

| TSX | Rust | Durée | Description |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | Apparaît en fondu. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | Apparaît en fondu, en montant à sa place. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | Apparaît en fondu, en descendant à sa place. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | Apparaît en fondu, en venant de la gauche. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | Apparaît en fondu, en venant de la droite. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | Apparaît en fondu, en grandissant à partir de 90 %. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | Surgit : part de la moitié de sa taille, dépasse la sienne puis se stabilise. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | Entre en rebondissant, en dépassant deux fois sa taille finale. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | Glisse depuis le bas, sans fondu (feuilles, toasts). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | Glisse depuis le haut, sans fondu. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | Entre en se retournant autour de son axe horizontal. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | Entre en se retournant autour de son axe vertical. |

**Sortie** : ils démarrent au repos et finissent masqués ou éloignés.

| TSX | Rust | Durée | Description |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | Disparaît en fondu. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | Disparaît en fondu, en s'élevant. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | Disparaît en fondu, en descendant. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | Disparaît en fondu vers la gauche. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | Disparaît en fondu vers la droite. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | Disparaît en fondu, en rétrécissant à 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | Disparaît en éclatant : gonfle un peu, puis rétrécit jusqu'à disparaître. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | Glisse vers le bas hors de la vue, sans fondu. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | Glisse vers le haut hors de la vue, sans fondu. |

**Attention** : ils démarrent et finissent au repos.

| TSX | Rust | Durée | Description |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | Secoue de côté : un mot de passe incorrect, un champ invalide. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | Secoue la tête : un « non » plus doux. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | Se trémousse autour de son centre : quelque chose à remarquer. |
| `swing` | `MotionPreset::Swing` | 900 ms | Se balance depuis son bord supérieur, comme une enseigne. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | Grossit un peu puis revient : une emphase discrète. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | Bat deux fois, comme un cœur : un like, un favori. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | Se comprime et s'étire comme du caoutchouc. |
| `jello` | `MotionPreset::Jello` | 800 ms | Tremble comme de la gelée. |
| `tada` | `MotionPreset::Tada` | 900 ms | Rétrécit, puis grandit en se trémoussant : une récompense. |
| `jump` | `MotionPreset::Jump` | 700 ms | Saute et retombe en s'écrasant. |
| `flash` | `MotionPreset::Flash` | 800 ms | Clignote deux fois. |

**Boucle** : ils se répètent jusqu'à leur arrêt.

| TSX | Rust | Durée | Description |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | Fait un tour, sans fin. |
| `float` | `MotionPreset::Float` | 1500 ms | Flotte de haut en bas, sans fin. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | Respire : grossit et s'estompe un peu, sans fin. |
| `sway` | `MotionPreset::Sway` | 1600 ms | Se balance autour de son centre, sans fin. |
| `bob` | `MotionPreset::Bob` | 1000 ms | Rebondit comme une balle, sans fin. |
| `glow` | `MotionPreset::Glow` | 2000 ms | S'illumine et s'éteint, sans fin. |

`play` accepte par-dessus un preset ses options de timing (`m.play("shake", { duration: 300 })`), et un preset peut être étalé dans un motion à vous (`m.play({ ...motions.fadeInUp, duration: 600 })`). En Rust, modifiez la spec d'un preset : `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### Vos propres motions

Un motion à vous se compose de keyframes par canal et d'un seul timing (les options des [keyframes](#keyframes)). En TSX, écrivez les keyframes de chaque canal (`{ opacity: [0, 1] }`), ou une liste de frames comme l'écrit la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`), chaque frame avec son `offset` et son `easing`. Dans une liste de frames, une frame sans offset se place là où sa position dans la liste la met, et un canal suit les frames qui le nomment. Les angles peuvent être des chaînes (`"45deg"`, `"0.5turn"`). En Rust, construisez un `MotionSpec`.

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

### Entrées et listes décalées

Donnez à chaque ligne un motion d'entrée, avec un délai qui croît avec son index : les lignes qui apparaissent ensemble arrivent les unes après les autres. Plafonnez le délai pour qu'une ligne ajoutée loin dans la liste n'attende pas.

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

Les motions se composent aussi : `m.animation(..)` est un motion sous forme d'[animation composite](#composite-animations), non démarrée, si bien que `Animated.stagger` en exécute un groupe en natif, en comptant depuis le premier élément, le dernier, le centre ou n'importe quel index. Donnez-leur un `initial` masqué (ou démarrez-les là où le motion commence) pour que rien ne s'affiche avant son tour.

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

### Sorties

Jouez la sortie, attendez-la, puis retirez la vue. Une [animation de layout](#layoutanimation) laisse les vues voisines combler le vide.

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

Les motions respectent d'eux-mêmes le réglage de [réduction des animations](#reduced-motion) de l'utilisateur : lorsque l'utilisateur demande moins de mouvement, un motion atteint immédiatement son état final, sans mouvement.

## Transitions

Nommez ce qui doit s'animer et pour combien de temps (`.transition_all().duration(400.0)` en Rust, `transitionProperty` et `transitionDuration` en TSX), et les changements ultérieurs de ces propriétés s'animent en natif, de ce qui est à l'écran vers la nouvelle valeur.

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

| Style | Rust | Type | Description |
|---|---|---|---|
| `transitionProperty` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` | `string` | Ce qui s'anime, séparé par des virgules : `"all"`, `"colors"`, `"opacity"`, `"transform"`, `"box-shadow"`, `"border-radius"`, ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | Des millisecondes sous forme de nombre, ou une durée CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | Avant le démarrage. |
| `transitionTimingFunction` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | La courbe. |

Les propriétés qui font l'objet d'une transition, par groupe : **couleurs** (couleurs de fond, de bordure, de contour, d'ombre et de texte, stops de dégradé), **opacité**, **transformation**, **ombres** (`box-shadow`) et **forme** (rayon et largeur de bordure). Les noms CSS et leurs formes en camel-case fonctionnent tous deux (`background-color`, `backgroundColor`, `transform`, `scale`, ...). Les changements de layout s'animent avec les [animations de layout](#layoutanimation).

Avec Tailwind, cela donne `transition` (couleurs, opacité, ombres et transformations), `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`, `transition-shadow`, avec `duration-*`, `delay-*` et `ease-*`. Combiné à l'état pressé (`.active(..)`, `active:`), il produit des états pressés animés :

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

Une transition part de la valeur actuellement à l'écran : changer à nouveau la cible en cours de route produit donc un virage fluide.

<a id="keyframe-animations"></a>

## Animations par keyframes

Quatre animations par keyframes intégrées s'exécutent en natif, sans fin par défaut : `spin` (un tour dans le sens horaire), `ping` (grossit jusqu'à 2× et disparaît en fondu), `pulse` (s'estompe à la moitié de l'opacité et revient) et `bounce` (saute d'un quart de sa hauteur et retombe).

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

| Style | Rust | Type | Description |
|---|---|---|---|
| `animationName` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` ou `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | L'animation. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | Une itération. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | Avant le démarrage. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | comme `transitionTimingFunction` | La courbe. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | Par défaut `"infinite"`. |

Tailwind : `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`.

<a id="animated-values"></a>

## Valeurs animées

Une valeur animée est un nombre qui vit sur le thread UI. Créez-en une (`animated_value(..)` en Rust, `createAnimatedValue` depuis `nsh` en TSX), liez-la à des styles, puis animez-la ; les vues liées la suivent à chaque image sans mise à jour.

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

**Ce qui peut être lié :** `opacity` (`.bind_opacity(..)`) ; `backgroundColor`, `borderColor` (tous les côtés) et le `color` d'un texte (le texte entier), via une interpolation vers des couleurs (`.bind_background(..)`, `.bind_border_color(..)`, `.bind_color(..)`) ; `translate` (`[x, y]`, une valeur par axe), `rotate` (degrés) et `scale` (`[x, y]` par axe, ou une seule valeur pour les deux) ; et les étapes d'une liste `transform` : `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY` et `rotateZ` (`.bind_translate_x(..)`, `.bind_translate_y(..)`, `.bind_scale(..)`, `.bind_rotate(..)` en degrés, `.bind_transform(kind, ..)` en Rust). Les ombres changent avec les [transitions](#transitions). Un anneau de focus ou un prix qui clignote en vert est une interpolation de couleur liée à la couleur de bordure ou de texte :

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

Les valeurs animées pilotent aussi les [dessins canvas](./canvas.md#driving-drawings-with-animated-values), reçoivent les offsets de défilement ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) et les gestes ([`pan`, `pinch`, `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

La valeur est maintenue en vie par les vues qui lui sont liées et par le composant qui l'a créée : une liaison reste donc connectée quelles que soient les variables qui apparaissent et disparaissent. Créez les valeurs animées dans le composant qui les possède (et non au niveau du module lorsque chaque instance a besoin des siennes).
<a id="animatedvalue-methods"></a>

### Méthodes d'AnimatedValue

| TSX | Rust | Description |
|---|---|---|
| `set(value)` | `set(value)` | Saute à `value` en arrêtant toute animation. |
| `stop()` | `stop()` | Arrête l'animation en cours là où elle en est ; en TSX, se résout avec `{ value }`, la valeur à cet instant. |
| `getValue()` | `value()` | La valeur actuelle, lue sur le thread UI là où elle évolue (elle se stabilise en une frame) : une promesse en TSX, une réponse attendable en Rust. |
| `setOffset(offset)` | `set_offset(offset)` | Ajoute `offset` à ce que la valeur affiche : les bindings voient valeur + offset, tandis que `set`, les animations et les glissements déplacent la valeur. |
| `flattenOffset()` | `flatten_offset()` | Ajoute l'offset à la valeur et remet l'offset à 0. |
| `extractOffset()` | `extract_offset()` | Déplace la valeur dans l'offset et remet la valeur à 0 : un glissement repart alors de 0, par-dessus l'endroit où le précédent s'est arrêté. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`, `timing_with(to, Timing { .. })` | Anime vers `to` en `duration` ms (300 par défaut, easing `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | Passe en mode ressort vers `to` (valeurs par défaut : stiffness 170, damping 26, mass 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Poursuit son élan depuis `velocity` (unités par seconde) et ralentit (décélération de 0,998 par ms par défaut). Avec un clamp de `[min, max]`, elle s'arrête à une borne, ou rebondit dessus en conservant `bounce` (0..1) de sa vitesse. |

Chaque animation fournit une réponse que vous pouvez attendre et qui indique si elle est allée au bout : `true` si elle a joué jusqu'à la fin, `false` si quelque chose l'a arrêtée (`stop()`, `set()`, ou une nouvelle animation sur la même valeur). C'est une `Promise<{ finished: boolean }>` en TSX et une `AnimationEnd` en Rust, qu'une tâche attend pour le `bool`. Lancer une nouvelle animation sur une valeur en mouvement interrompt l'ancienne en douceur : un ressort ou une décélération sans vélocité continue avec la vélocité actuelle de la valeur.

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

`keyframes` fait jouer une valeur à travers des keyframes, comme le font les keyframes CSS : `value.keyframes(frames, options)` en TSX, `value.keyframes(frames, KeyframeTiming)` en Rust (`Animated.keyframes(value, { keyframes, ... })` et `Animation::keyframes(..)` comme étape d'une [animation composite](#composite-animations)). Une keyframe est un nombre (ou une chaîne d'angle telle que `"90deg"`), réparti uniformément avec les autres, ou `{ offset, value, easing }` (`Keyframe::new(value)`, `Keyframe::at(offset, value)`, `.ease(easing)` en Rust).

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

| Option | Rust (`KeyframeTiming`) | Par défaut | Description |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | Une itération, en millisecondes. |
| `delay` | `.delay(ms)` | 0 | Avant la première itération. |
| `easing` | `.easing(easing)` | `ease` de CSS | La courbe de chaque segment sans easing propre. |
| `iterations` | `.iterations(Some(n))`, `.infinite()` | 1 | Le nombre d'itérations, ou `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`, `"reverse"`, `"alternate"` ou `"alternate-reverse"`. |

Elles se jouent comme en CSS et dans la Web Animations API :

- Un easing façonne chaque segment, non l'ensemble : le `easing` d'une keyframe façonne le segment qui commence à elle, et le `easing` du timing tous les autres segments.
- Les keyframes sans offset se répartissent uniformément entre leurs voisines ; la première vaut 0 par défaut et la dernière 1.
- Chaque itération commence par un saut vers sa première keyframe. Sans keyframe à l'offset 0, la valeur part de là où elle se trouve.
- Pendant un `delay`, la valeur détient déjà la première keyframe (`animation-fill-mode: backwards` en CSS), de sorte qu'une entrée différée montre sa première image plutôt que la vue au repos. Cela vaut aussi pour les motions.
- `reverse` et les itérations en sens inverse de `alternate` jouent les segments à rebours, chacun avec sa courbe inversée.
- La valeur reste là où la dernière itération la laisse. La réponse indique si elles sont allées au bout : `true` si c'est le cas, `false` si quelque chose les a arrêtées.

### Interpolation

`interpolate` fait correspondre une valeur à des nombres, des couleurs ou des angles par segments linéaires, et renvoie un nouveau nœud que vous pouvez lier. Une seule valeur peut piloter de nombreuses propriétés. En Rust, `interpolate(&input, &output)` produit des nombres, `interpolate_colors(&input, &colors)` des couleurs, et `interpolate_with(&input, output, Interpolation { .. })` accepte l'extrapolation et l'easing ; en TSX, `value.interpolate({ inputRange, outputRange })` les accepte tous.

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

| Option | Rust | Description |
|---|---|---|
| `inputRange` | la slice d'entrée | Points d'entrée croissants. |
| `outputRange` | la slice de sortie, ou `AnimationOutput` | Une sortie par point : nombres, couleurs (`"#rrggbb"`, `"rgba(…)"`, nommées) ou angles (`"45deg"`, `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | En dehors de la plage d'entrée : `"clamp"` (par défaut), `"extend"` (prolonge les segments des extrémités) ou `"identity"` (renvoie l'entrée telle quelle). |
| `extrapolateLeft`, `extrapolateRight` | `extrapolate_left`, `extrapolate_right` | Idem, pour un seul côté. |
| `easing` | `easing` | Façonne chaque segment. |

> [!IMPORTANT]
> Les interpolations **bornent** par défaut : en dehors de la plage d'entrée, la sortie reste à l'extrémité la plus proche. Tirer une scroll view au-delà de son sommet laisse donc un en-tête lié au défilement dans son état final. Passez `extrapolate: "extend"` (`Extrapolate::Extend`) lorsque vous voulez que la droite se prolonge.

<a id="arithmetic-and-diffclamp"></a>

### Arithmétique et diffClamp

Les nœuds se combinent par arithmétique, également en natif : `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)` (`a.modulo(b)` en Rust ; jamais négatif pour un `b` positif, par exemple des angles dans 0..360), où `b` est un nœud ou un nombre. En TSX, `Animated.add`, `subtract`, `multiply`, `divide` et `modulo` sont les mêmes opérations sous forme de fonctions.

`diffClamp(min, max)` (`diff_clamp`) suit les *variations* du nœud tout en restant dans `min..max`. Appliqué à un offset de défilement, il produit un en-tête qui se masque quand le contenu défile vers le haut et revient dès qu'il défile vers le bas :

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

Avec `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`), un en-tête laissé partiellement visible à l'arrêt du défilement termine le mouvement : il se stabilise entièrement visible ou entièrement masqué, selon le plus proche, en 200 ms sur le thread UI. Il ne se masque que lorsque la page a défilé d'au moins sa hauteur, de sorte qu'une page défilée de moins que cela montre l'en-tête en entier. Si l'on défile à nouveau pendant le mouvement, celui-ci reprend depuis la position de l'en-tête.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## Animations composites

Les animations se construisent à partir d'étapes (`Animation` en Rust, `Animated` depuis `nsh` en TSX) et l'arbre entier s'exécute en natif : chaque étape démarre sur le thread UI à l'instant où la précédente se termine, sans délai et sans aucun code de votre part entre les deux.

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

| TSX | Rust | Description |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | Une étape de timing. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | Une étape de ressort. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`, `Animation::decay_within(..)` | Une étape de décélération. |
| `Animated.sequence(list)` | `Animation::sequence(list)` | L'une après l'autre. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`, `.stop_together(..)` | Toutes en même temps. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Toutes en même temps, chacune démarrant `ms` après la précédente, à compter de `from` : `"first"` (par défaut), `"last"`, `"center"` (une onde qui part du milieu) ou un index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Une étape de [keyframes](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | Attend. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`, `.reset_before_iteration(..)` | Répète (indéfiniment par défaut ; `None` en Rust). |

Une animation composite dispose de `start()` (en TSX aussi avec un callback et une promesse, qui reçoivent tous deux `{ finished }` ; en Rust une `bool` attendable ; l'appeler à nouveau la relance), de `stop()` (s'arrête là où elle en est) et de `reset()` (s'arrête et remet ses valeurs là où elles étaient au démarrage). Le callback s'exécute une seule fois pour l'arbre entier.

Une animation en cours ne maintient pas ses valeurs en vie : lorsque le composant qui les possède disparaît (ses vues et ses variables), une boucle infinie s'arrête avec lui, et sa réponse indique qu'elle n'est pas allée au bout (`false`).

## Easing

Les courbes d'easing sont des données, évaluées en natif : `Easing` depuis `nsh` en TSX, l'enum `Easing` en Rust.

| TSX | Rust | Description |
|---|---|---|
| `Easing.linear`, `Easing.ease` | `Easing::Linear`, `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | Vitesse constante ; le `ease` de CSS. |
| `Easing.quad`, `Easing.cubic`, `Easing.poly(n)` | `Curve::Quad`, `Curve::Cubic`, `Curve::Poly(n)` | `t²`, `t³`, `tⁿ`. |
| `Easing.sin`, `Easing.circle`, `Easing.exp` | `Curve::Sin`, `Curve::Circle`, `Curve::Exp` | Sinusoïdale, circulaire, exponentielle. |
| `Easing.back(s?)` | `Curve::Back(s)` | Recule avant de partir (dépassement `s`, 1,70158 par défaut). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | Dépassement élastique. |
| `Easing.bounce` | `Curve::Bounce` | Rebondit à la fin. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | Une courbe de Bézier cubique, comme en CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | Saute entre `count` niveaux au lieu de se déplacer, comme le `steps()` de CSS : un sprite image par image, une aiguille qui tictaque. `position` vaut `"jump-end"` (par défaut, aussi `"end"`), `"jump-start"` (`"start"`), `"jump-none"` ou `"jump-both"`. |
| `Easing.in(e)`, `Easing.out(e)`, `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`, `EaseMode::Out`, `EaseMode::InOut` | Ces courbes sont des courbes « in » ; `out` et `inOut` les inversent. |

En TSX, partout où un easing est accepté, vous pouvez aussi passer un nom (`"linear"`, `"ease"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`) ou un tableau de Bézier `[x1, y1, x2, y2]` ; en Rust, `Easing::EaseIn`, `Easing::EaseOut` et `Easing::EaseInOut` sont les courbes CSS.

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

`Easing.sample(easing, count)` (`sample_easing` en Rust) renvoie la courbe en `count` points régulièrement espacés de 0 à 1, et `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`, `sample_decay`) les valeurs que traverse un ressort ou une décélération, une par frame (60 par seconde par défaut) depuis `config.from` (0) jusqu'à sa fin. Elles sont calculées par le même code natif que celui qui exécute les animations, si bien que le tracé d'une courbe montre exactement ce que fait l'animation :

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

Une layout animation anime en natif les changements de frame de la **prochaine** mise à jour : les vues qui se déplacent ou se redimensionnent glissent vers leurs nouvelles frames, les nouvelles vues apparaissent en fondu (ou en échelle), les vues supprimées disparaissent en fondu. Appelez-la juste avant le changement d'état : `animate_layout(..)` en Rust, `LayoutAnimation.configureNext(config)` en TSX.

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

| TSX | Rust | Description |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anime les changements du prochain commit ; en TSX, `onEnd` s'exécute à la fin. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | Une config avec une seule courbe pour les trois phases. |
| `Presets.easeInEaseOut`, `Presets.linear`, `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`, `LINEAR`, `SPRING` | Configs prêtes à l'emploi. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout` avec un preset | `configureNext` avec un preset. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Les noms, pour construire des configs. |

Une config est `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` en Rust) : `create` pour les vues insérées, `update` pour celles déplacées ou redimensionnées, `delete` pour celles supprimées. Chaque phase est `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`), où `type` vaut `"easeInEaseOut"`, `"spring"`, `"linear"`, `"easeIn"`, `"easeOut"` ou `"keyboard"` (la courbe propre au clavier logiciel, chronométrée depuis le moment où le clavier a commencé à bouger, afin que ce qui lui fait de la place bouge avec lui ; `LayoutCurve::Keyboard`), `property` est ce qui s'anime quand des vues apparaissent et disparaissent (`"opacity"`, `"scaleXY"`, `"scale"`), et `springDamping` (0..1, 0,7 par défaut ; `LayoutCurve::Spring { damping }`) règle le dépassement du ressort.

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

Une layout animation couvre toutes les frames que la mise à jour modifie, où qu'elles se trouvent à l'écran : une liste qui se rafraîchit ou des données en direct qui arrivent dans la même mise à jour bougent avec elle. Dans un composant Rust, n'animez que ce que le changement d'un seul élément déplace avec `ElementRef::animate_layout(transition)` : la frame de l'élément lui-même et celles de son contenu, ainsi que celles des vues que sa taille pousse (ses frères et leurs contenus, jusqu'à l'écran). Les autres frames de la mise à jour changent d'un coup. C'est ainsi que `nsh/base` révèle son contenu avec `Collapsible` et `AccordionPanel`.

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

## Ce qui s'exécute où

| | S'exécute sur | Votre code à chaque frame |
|---|---|---|
| Transitions, animations par keyframes | Thread UI | aucun |
| Motions, keyframes, `timing` / `spring` / `decay`, composites | Thread UI | aucun ; votre code est averti de leur fin |
| `interpolate`, arithmétique, `diffClamp` | Thread UI | aucun |
| `scrollValue`, `pan` / `pinch` / `rotation` | Thread UI | aucun ; votre code est averti du début et de la fin |
| Layout animations | Thread UI | aucun |
| Boucles `requestAnimationFrame` (`request_animation_frame` en Rust), handlers `onScroll`, `PanResponder` | votre code, puis une mise à jour | à chaque frame |

N'utilisez `requestAnimationFrame` (un global en TSX, qui suit l'affichage) que pour ce qui ne peut pas être décrit à l'avance, comme une simulation physique dans votre code. Tout ce qui peut être une valeur animée devrait l'être.

<a id="reduced-motion"></a>

## Mouvement réduit

Lorsque l'utilisateur demande moins de mouvement (« Réduire les animations » sur iOS, « Supprimer les animations » sur Android), `reduce_motion()` en Rust et `reduceMotion()` depuis `nsh` en TSX valent `true`, et les variantes Tailwind `motion-reduce:` / `motion-safe:` s'appliquent.

Les [motions](#motion) suivent ce réglage d'elles-mêmes : `play` et `enter` atterrissent aussitôt là où la motion se termine, sans bouger, et la réponse indique qu'elle est allée au bout (`true`), comme pour une motion qui a joué. Une sortie finit toujours masquée, une entrée finit toujours au repos. Passez `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` en Rust) pour une motion qui porte un sens dont l'utilisateur a besoin, comme un indicateur de progression qui tourne.

Les transitions, animations par keyframes, valeurs animées, keyframes et composites se jouent telles qu'elles sont écrites ; utilisez-les pour choisir une alternative plus calme :

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

Voir [Accessibilité](./accessibility.md#reduced-motion).

<a id="related"></a>

## Voir aussi

- [L'API d'animation de `nsh`](../modules/nsh.md#animation) : la référence TSX.
- [Toucher et gestes](./touch-and-gestures.md) : piloter des valeurs animées avec le doigt.
- [Défilement](./scrolling.md#scroll-linked-effects-scrollvalue) : `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values) : valeurs animées dans les dessins.
- [Référence des styles](../modules/style-reference.md) : les clés `transition*` et `animation*`.
