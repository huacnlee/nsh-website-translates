---
title: "nsh"
description: "Le module principal : signaux, effets, contexte, montage, jetons de conception, animation, environnement, gestes, presse-papiers, stockage, canal hôte, raccourcis clavier, accessibilité et types d'éléments et de styles."
order: 2
source_hash: 0264c3f02c420628
---

# nsh

`nsh` est le module principal : l'API réactive (signaux, valeurs calculées, effets, contexte), `mount`, `token`, les éléments hôtes `View`, `Text`, `Scroll` et `Overlay`, les [vues sélectionnables](#selectable-views), [la safe area et le clavier](#safe-area-and-keyboard), [l'animation](#animation), [l'appareil et son environnement](#device), [`PanResponder`](#panresponder), le [presse-papiers](#clipboard), le [sélecteur de photos](#picker), la [reconnaissance vocale](#speech), le [stockage](#storage), le [canal hôte](#host), les [raccourcis clavier](#keymap), les [composants et modules natifs](#nativecomponent-and-nativemodule), l'[accessibilité](#accessibility), ainsi que les types TypeScript des éléments, des styles et des événements. Le graphe réactif lui-même s'exécute nativement en Rust ; lire un signal est un appel dans le runtime qui coûte quelques nanosecondes, et seules vos propres closures s'exécutent dans l'interpréteur JavaScript.

```ts
import { batch, cleanup, computed, context, effect, ErrorBoundary, mount, Overlay, Scroll, signal, split, Text, token, untracked, View } from "nsh";
import { Input } from "nsh/base";
```

La réactivité de NSH suit le même modèle que SolidJS : une fonction de composant s'exécute **une seule fois**, et les parties de l'interface qui lisent des signaux sont mises à jour sur place quand ces signaux changent. Il n'y a ni nouveau rendu du composant ni DOM virtuel. Voir [Réactivité](../docs/reactivity.md) pour le guide.

## signal

```ts
function signal<T>(value: T, options?: SignalOptions<T>): Signal<T>;
function signal<T = undefined>(): Signal<T | undefined>;

interface Signal<T> {
  (): T;                              // read (tracked)
  set(value: T): void;                // write
  update(fn: (value: T) => T): void;  // write from the current value
}

interface SignalOptions<T> {
  /** When a new value counts as a change (default `===`); `false`: always. */
  equals?: false | ((previous: T, next: T) => boolean);
}
```

Un signal contient une valeur. L'appeler lit la valeur et, dans un scope de suivi (expressions JSX, `computed`, `effect`), y abonne ce scope. `set` et `update` l'écrivent ; tout ce qui l'a lu est mis à jour.

```tsx
import { mount, signal, Text, View } from "nsh";

function Counter() {
  const count = signal(0);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Count: {count()}</Text>
      <Text onPress={() => count.update((n) => n + 1)}>Add one</Text>
    </View>
  );
}

mount(Counter);
```

Par défaut, une écriture `===` à la valeur courante ne fait rien. Passez `equals: false` pour notifier à chaque écriture (utile quand vous modifiez un objet sur place puis réaffectez ce même objet), ou fournissez votre propre comparaison :

```ts
const items = signal<string[]>([], { equals: false });
const point = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

## computed

```ts
function computed<T>(fn: (previous: T | undefined) => T, options?: SignalOptions<T>): Accessor<T>;

interface Accessor<T> {
  (): T;
}
```

Une valeur dérivée de signaux. `fn` s'exécute de nouveau quand un signal qu'elle a lu change ; les lecteurs de la valeur calculée ne sont mis à jour que lorsque son résultat change (selon `equals`, `===` par défaut). `fn` reçoit le résultat précédent.

```ts
const first = signal("Ada");
const last = signal("Lovelace");
const full = computed(() => `${first()} ${last()}`);
full(); // "Ada Lovelace"
```

Utilisez `computed` quand une dérivation est coûteuse ou lue à plusieurs endroits. Pour une expression peu coûteuse, une simple fonction (`const full = () => first() + " " + last()`) est tout aussi réactive.

## effect

```ts
function effect(fn: () => void): void;
```

Exécute `fn` après le rendu, puis à nouveau chaque fois qu'un signal qu'il a lu change. Utilisez les effets pour les effets de bord : journalisation, minuteurs, communication avec les modules natifs. Un effet appartient au composant (ou à l'effet) dans lequel il a été créé et est libéré avec lui.

```ts
const query = signal("");
effect(() => {
  console.log("query is now", query());
});
```

Pour annuler quelque chose avant que l'effet ne s'exécute de nouveau (ou quand son composant disparaît), appelez [`cleanup`](#cleanup) à l'intérieur.

## batch

```ts
function batch<T>(fn: () => T): T;
```

Exécute `fn` et applique toutes ses écritures ensemble à la fin, de sorte que les lecteurs sont mis à jour une seule fois au lieu d'une fois par écriture. Renvoie ce que renvoie `fn`.

```ts
batch(() => {
  first.set("Grace");
  last.set("Hopper");
}); // `full` recomputes once
```

## untracked

```ts
function untracked<T>(fn: () => T): T;
```

Exécute `fn` sans abonner le scope courant à ce qu'elle lit. Utilisez-le pour lire un signal dans un effet ou une expression JSX sans en dépendre.

```ts
effect(() => {
  // Runs again when `query` changes, not when `page` changes.
  search(query(), untracked(() => page()));
});
```

## cleanup

```ts
function cleanup(fn: () => void): void;
```

Enregistre `fn` pour qu'elle s'exécute avant que l'effet courant ne s'exécute de nouveau, ou quand le composant ou l'effet courant disparaît.

```tsx
function Clock() {
  const now = signal(new Date());
  const timer = setInterval(() => now.set(new Date()), 1000);
  cleanup(() => clearInterval(timer));
  return <Text>{now().toLocaleTimeString()}</Text>;
}
```

## context

```ts
function context<T>(defaultValue: T): Context<T>;

interface Context<T> extends Accessor<T> {
  Provider: (props: { value: T; children?: JSX.Element }) => JSX.Element;
}
```

Une valeur qu'un composant fournit à tout ce qu'il affiche, quelle que soit la profondeur. Appeler le contexte (`Theme()`) lit la valeur du fournisseur le plus proche, ou `defaultValue` s'il n'y en a pas.

```tsx
import { context, mount, signal, Text, View } from "nsh";

const Theme = context<"light" | "dark">("light");

function Label(props: { text: string }) {
  return <Text style={{ color: Theme() === "dark" ? "#fff" : "#000" }}>{props.text}</Text>;
}

function App() {
  const dark = signal(false);
  return (
    <Theme.Provider value={dark() ? "dark" : "light"}>
      <View style={{ flex: 1, padding: 24, backgroundColor: dark() ? "#000" : "#fff" }}>
        <Label text="Hello" />
        <Text onPress={() => dark.update((d) => !d)}>Toggle</Text>
      </View>
    </Theme.Provider>
  );
}

mount(App);
```

## mount

```ts
function mount<P extends object>(app: Component<P>, props?: P): () => void;
```

Affiche `app` dans la surface (la fenêtre, ou le `NshAppView` / `NshView` dans lequel l'application est intégrée) et renvoie une fonction qui le retire. Le fichier d'entrée de chaque application se termine par `mount(App)`.

```tsx
mount(App);
```

## split

```ts
function split<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  keys: K,
): [Pick<T, K[number]>, Omit<T, K[number]>];
```

Sépare un objet de props en les props nommées dans `keys` et le reste. Les deux moitiés restent réactives : les props dont la valeur change sont des getters, et `split` les conserve comme getters. Utilisez-le dans un composant qui gère certaines props lui-même et transmet les autres. Déstructurer les props (`const { label } = props`) les lirait une seule fois et perdrait les mises à jour.

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function LabeledInput(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input {...rest} />
    </View>
  );
}
```

## ErrorBoundary

```ts
function ErrorBoundary(props: {
  fallback: JSX.Element | ((error: unknown, reset: () => void) => JSX.Element);
  children?: JSX.Element;
}): JSX.Element;
```

Affiche ses enfants, ou `fallback` dès que quelque chose en dessous lève une erreur : le corps d'un composant, une liaison, un effet ou un gestionnaire d'événement. La partie qui a échoué est retirée et le fallback s'affiche à sa place. Une fonction `fallback` est appelée comme `fallback(error, reset)` avec la valeur levée et `reset`, qui affiche à nouveau les enfants, quels que soient les paramètres qu'elle déclare ; un élément `fallback` est affiché tel quel. Une erreur remonte à la boundary la plus proche au-dessus, et une erreur dans un fallback à la boundary située encore au-dessus. Les composants Rust utilisent `catch_error` ([Error boundaries](../docs/reactivity.md#error-boundaries)).

```tsx
import { ErrorBoundary, Text, View } from "nsh";

function Feed() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>{error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Posts />
    </ErrorBoundary>
  );
}
```

## token

```ts
function token<K extends keyof Tokens>(name: K): Tokens[K];
```

Le design token `name` du thème de l'application (`"theme"` dans `nsh.json`, au-dessus des tokens de shadcn/ui) dans l'apparence affichée :
une couleur sous forme de `#rrggbbaa`, une longueur sous forme de nombre de points, une police sous forme du nom de sa famille. Les noms sont les variables CSS du thème
sans `--` (`primary`, `muted-foreground`, `radius`, `font-mono`, et ceux propres à l'application, comme `up`). Sa lecture est
réactive : un composant, un memo ou un effet qui lit un token s'exécute de nouveau quand le thème ou l'apparence change.
`Tokens` liste les tokens de l'application avec leurs types ; NSH l'écrit dans `.nsh/types/nsh/tokens.d.ts` à partir du thème. Pour
les classes, nommez directement les tokens (`bg-primary`, `rounded-(--radius)`) : [Tokens de thème](../docs/tailwind.md#theme-tokens).

```tsx
import { effect, token } from "nsh";

effect(() => console.log("primary is", token("primary"), "radius", token("radius")));
```

## View, Text, Scroll, Overlay

```ts
function View(props: ViewProps): JSX.Element;
function Text(props: TextProps): JSX.Element;
function Scroll(props: ScrollProps): JSX.Element;
function Overlay(props: OverlayProps): JSX.Element;
```

Les éléments hôtes qu'exporte `nsh`, écrits comme des balises : `<View>`, `<Text>`, `<Scroll>`, `<Overlay>` (ses
enfants au-dessus de la fenêtre, placés par rapport à une ancre : [Overlay](../elements/overlay.md)). Le compilateur crée la
vue native sur place pour une balise qui en désigne une via son import (y compris sous un alias), si bien qu'importer ces éléments ne coûte
rien à l'exécution. Ce sont des composants comme les autres, ils peuvent donc aussi être transmis (`const Tag = inline ? Text : View`).
`nsh` exporte les autres primitives de la même façon : [`List`](./nsh-list.md), [`Image`](./nsh-image.md),
[`Canvas`](./nsh-canvas.md), [`WebView`](./nsh-webview.md) et [`Video`](./nsh-video.md), chacune avec sa propre page de
référence. Leurs props sont documentées sous [Éléments](../elements/index.md). Le champ de saisie de texte, `Input`, provient de
[`nsh/base`](./nsh-base.md#input).

<a id="safe-area-and-keyboard"></a>

## Safe area et clavier

Les variables d'environnement de CSS maintiennent le contenu à l'écart de l'interface système, dans le padding et la marge de n'importe quelle vue
(`padding`, `paddingTop`, ..., les mêmes clés `margin` ; les valeurs arbitraires `p*` / `m*` de Tailwind ; les méthodes `Styled`
`.p_safe_area()`, `.pt_safe_area_plus(..)`, `.pb_keyboard()`, ... en Rust). Leurs valeurs sont des `EnvValue` :
`env(name)`, `env(name, <length>)`, `calc(env(name) + <length>)` et `calc(<length> + env(name))`.

| Variable | Valeur |
|---|---|
| `safe-area-inset-top`, `-right`, `-bottom`, `-left` | Les marges de la vue racine dans laquelle le nœud s'affiche : celles de la page la plus proche (sous son en-tête), du dialogue le plus proche, ou sinon la safe area de la surface. Voir [Safe area](../elements/safe-area.md). |
| `keyboard-inset-height` | La hauteur du clavier logiciel au-dessus de la surface, 0 tant qu'il est masqué ; les changements s'animent nativement avec le clavier. Voir [Clavier](../elements/keyboard.md). |

```tsx
<View style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(keyboard-inset-height)" }}>…</View>
```

<a id="safearea-and-safeareainsets"></a>

### safeArea et safeAreaInsets

`safeArea()` est la safe area de la surface (`safe_area()` en Rust) ; `safeAreaInsets()` les marges à l'endroit où un composant
s'affiche (`cx.insets()` en Rust), c'est-à-dire les valeurs des variables `safe-area-inset-*`. Les deux sont des `Edges`
réactifs (`{ top, right, bottom, left }` en points). Voir
[safeArea et safeAreaInsets](../elements/safe-area.md#safearea-and-safeareainsets).

<a id="keyboard-and-keyboardframe"></a>

### Keyboard et keyboardFrame

`Keyboard.dismiss()` masque le clavier logiciel (`dismiss_keyboard()` en Rust) et `keyboardFrame()` indique quelle
part de l'écran il recouvre (`keyboard_height()` et `keyboard_duration()` en Rust). Voir
[Masquer le clavier](../elements/keyboard.md#hiding-the-keyboard) et
[La hauteur du clavier](../elements/keyboard.md#the-keyboards-height).

<a id="selectable-views"></a>

## Vues sélectionnables

`<View selectable>` (`view().selectable(true)` en Rust) fait en sorte que les textes qu'il contient se sélectionnent ensemble, comme ceux d'une page web : une seule sélection traverse les vues, les éléments `Text` et les `TextView`, dans l'ordre de lecture. Voir
[Sélection de texte](../elements/text-selection.md).

## Animation

L'API d'animation anime sur le thread d'interface. Vous créez une **valeur animée**, vous la liez (ou des valeurs qui en dérivent) à une propriété de style, puis vous lancez une animation ; à partir de là, chaque image est calculée nativement, sans exécuter le code de l'application. Un moteur ou un thread JS occupé ne peut pas faire saccader l'animation, et une animation ne coûte à l'application aucun travail par image. Le code Rust utilise `animated_value()`, `motion()`, `Animation`, `Spring`, `Timing`, `KeyframeTiming`, `MotionPreset` et `Easing` de `nsh_core::prelude` et lie les valeurs avec les méthodes `.bind_*` des éléments ; TSX les importe depuis `nsh`.

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*}; // animated_value, motion, Animation, Spring, Timing, Keyframe, KeyframeTiming, MotionPreset, MotionSpec, Easing, animate_layout
```

```tsx tabs
import { Animated, createAnimatedValue, createMotion, motions, Easing, LayoutAnimation, AnimatedNode, AnimatedValue } from "nsh";
```

Voir [Animation](../docs/animation.md) pour le guide.

<a id="what-an-animated-value-can-drive"></a>

### Ce qu'une valeur animée peut piloter

| Où | Rust | TSX |
|---|---|---|
| `opacity` | `.bind_opacity(&value)` | `style={{ opacity: value }}` |
| `backgroundColor` | `.bind_background(&value.interpolate_colors(&[0.0, 1.0], &[white(), black()]))` | `style={{ backgroundColor: value.interpolate({ inputRange: [0, 1], outputRange: ["#fff", "#000"] }) }}` |
| `borderColor`, `color` | `.bind_border_color(&node)`, `.bind_color(&node)` | Idem : un nœud de couleurs. `borderColor` colore chaque côté ; le `color` d'un `Text` colore tout le texte |
| `transform` | `.bind_translate_x(&value)`, `.bind_translate_y`, `.bind_scale`, `.bind_rotate` (degrés) | `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX`, `rotateY`, `rotateZ` étapes : `transform: [{ translateX: value }]` |
| Position de défilement | `.scroll_value(&value)` sur une vue défilante ou une liste | `<Scroll scrollValue={value}>` et `<List scrollValue={value}>` y écrivent le décalage de défilement à chaque image |
| Gestes | `.pan_values(Some(&x), Some(&y))`, `.pinch_value(&scale)`, `.rotation_value(&angle)` | `pan={{ x, y }}`, `pinch={{ scale }}`, `rotation={{ angle }}` sur n'importe quel élément : le geste écrit directement les valeurs (voir [Toucher et gestes](../docs/touch-and-gestures.md)) |
| Où les vues s'accrochent | `.sticky().bind_sticky_top(&value)` (`.bind_sticky_left` dans une vue défilante horizontale), `.bind_sticky_header_offset(&value)` sur une liste | `style={{ position: "sticky", top: value }}`, `<List stickyHeaderOffset={value}>` : les vues et en-têtes sticky s'accrochent à cette distance du début de la zone visible, en suivant la valeur à chaque image |
| Canvas | un argument animé d'un appel de painter | Tout argument numérique ou de couleur d'un appel de dessin de [canvas](./nsh-canvas.md) |
| Shader | `.uniform(name, &value)` | Un membre du `struct Uniforms` d'un [shader](../elements/shader.md) : `uniforms={{ name: value }}` (des nombres, ou un nœud de couleurs pour un `vec3f` / `vec4f`) |

Les autres propriétés de style acceptent des valeurs simples ; pour animer la mise en page elle-même (tailles, positions dans le flux), utilisez [`LayoutAnimation`](#layoutanimation).

### createAnimatedValue

```ts
function createAnimatedValue(value?: number): AnimatedValue;
```

Crée une valeur animée qui démarre à `value` (par défaut `0`). Rust : `animated_value(value)`, un handle `Copy` conservé par le composant qui l'a créé.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let right = stored(false);
    let toggle = move || {
        let to_right = !right.get();
        right.replace(to_right);
        let _ = x.spring(if to_right { 200.0 } else { 0.0 }, Spring::default());
    };
    view()
        .flex_1()
        .p_6()
        .pt_12()
        .gap_4()
        .child(view().size(px(60.0)).rounded(px(12.0)).bg(rgb(0x6366f1)).bind_translate_x(&x))
        .child(text("Move").on_press(toggle))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  let right = false;
  const toggle = () => {
    right = !right;
    x.spring(right ? 200 : 0);
  };
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48, gap: 16 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#6366f1", transform: [{ translateX: x }] }} />
      <Text onPress={toggle}>Move</Text>
    </View>
  );
}

mount(App);
```

> [!NOTE]
> Une valeur animée vit sur le thread d'interface et y change à chaque image ; l'application la lit donc de façon asynchrone : `await value.getValue()` (ou le `{ value }` avec lequel `stop()` se résout) donne la valeur à cet instant, et en Rust `value.value().await` dans une tâche. Conservez la cible dans une variable ou un signal quand votre code en a besoin immédiatement, comme ci-dessus. Les événements de geste rapportent les valeurs à leur fin (`PanEvent.value`).

### AnimatedValue

```ts
class AnimatedValue extends AnimatedNode {
  constructor(value: number);
  set(value: number): void;
  stop(): Promise<{ value: number }>;
  getValue(): Promise<number>;
  setOffset(offset: number): void;
  flattenOffset(): void;
  extractOffset(): void;
  timing(to: number, options?: { duration?: number; easing?: Easing; delay?: number }): Promise<{ finished: boolean }>;
  spring(to: number, options?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): Promise<{ finished: boolean }>;
  decay(options?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): Promise<{ finished: boolean }>;
  keyframes(keyframes: KeyframeValue[], options?: KeyframeTiming): Promise<{ finished: boolean }>;
}
```

| Méthode | Rust | Description |
|---|---|---|
| `set(value)` | `set(value)` | Saute à `value`, en arrêtant toute animation en cours. |
| `stop()` | `stop()`, puis `value().await` | Arrête l'animation en cours là où elle en est ; se résout avec `{ value }`, la valeur à cet endroit. |
| `getValue()` | `value().await` | Se résout avec la valeur courante (avec son offset), lue sur le thread d'interface. |
| `setOffset(offset)` | `set_offset(offset)` | Un offset ajouté à la valeur : les liaisons voient valeur + offset ; `set`, les animations et les glissements déplacent la valeur. |
| `flattenOffset()` | `flatten_offset()` | Ajoute l'offset à la valeur et le remet à 0. |
| `extractOffset()` | `extract_offset()` | Déplace la valeur dans l'offset et remet la valeur à 0 (un glissement repart alors de là où le précédent s'est terminé). |
| `timing(to, options)` | `timing(to, ms, easing)`, `timing_with(to, Timing { … })` | Anime vers `to` le long d'une courbe d'easing. `duration` en ms (300 par défaut), `easing` (`"easeInOut"` par défaut), `delay` en ms (0 par défaut). |
| `spring(to, options)` | `spring(to, Spring { … })` | Rebondit élastiquement vers `to`. `stiffness` (170 par défaut), `damping` (26 par défaut), `mass` (1 par défaut), `velocity` (vitesse initiale, en unités par seconde). |
| `decay(options)` | `decay(velocity, deceleration)`, `decay_within(velocity, deceleration, (min, max), bounce)` | Glisse à partir de `velocity` (unités par seconde) et ralentit de `deceleration` par milliseconde (0,998 par défaut). À utiliser après un fling, avec la vitesse issue de `onPanEnd`. Avec `clamp: [min, max]`, il s'arrête à une borne, ou rebondit dessus en conservant `bounce` (0..1, 0 par défaut) de sa vitesse. |
| `keyframes(frames, options)` | `keyframes(frames, KeyframeTiming)` | Joue des [keyframes](#keyframes) comme jouent les keyframes CSS : un easing par segment, `iterations` fois dans `direction`. |

Chaque méthode d'animation renvoie une promesse qui se résout avec `{ finished }` : `true` quand l'animation s'est terminée, `false` quand elle a été arrêtée (par `stop`, `set` ou une autre animation de la même valeur). En Rust, elle renvoie un `AnimationEnd`, qu'une tâche attend pour obtenir le même `bool`.

```rust tabs
let opacity = animated_value(1.0);
spawn(async move {
    if opacity.timing(0.0, 200.0, Easing::EaseInOut).await {
        visible.set(false);
    }
});
```

```tsx tabs
const opacity = createAnimatedValue(1);
const { finished } = await opacity.timing(0, { duration: 200 });
if (finished) visible.set(false);
```

### AnimatedNode

```ts
class AnimatedNode {
  interpolate(config: {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: Extrapolation;
    extrapolateLeft?: Extrapolation;
    extrapolateRight?: Extrapolation;
    easing?: Easing;
  }): AnimatedNode;
  diffClamp(min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  add(b: AnimatedNode | number): AnimatedNode;
  sub(b: AnimatedNode | number): AnimatedNode;
  mul(b: AnimatedNode | number): AnimatedNode;
  div(b: AnimatedNode | number): AnimatedNode;
  mod(b: AnimatedNode | number): AnimatedNode;
}

type Extrapolation = "extend" | "clamp" | "identity";
```

Un nœud du graphe d'animation natif : un `AnimatedValue`, ou une valeur dérivée d'autres. Les nœuds dérivés sont évalués sur le thread d'interface chaque fois que leurs entrées changent.

| Méthode | Rust | Description |
|---|---|---|
| `interpolate(config)` | `interpolate(&input, &output)`, `interpolate_colors(&input, &colors)`, `interpolate_with(&input, output, Interpolation { … })` | Fait correspondre l'entrée à des plages par morceaux. `outputRange` contient des nombres, des couleurs (`"#ff0000"`, `"rgba(…)"`) ou des angles (`"45deg"`, `"1rad"`). En dehors de `inputRange`, la valeur est bornée par défaut ; `extrapolate` (ou `extrapolateLeft` / `extrapolateRight`) peut valoir `"extend"` (prolonger la droite), `"clamp"` ou `"identity"` (laisser passer l'entrée telle quelle). `easing` façonne chaque segment. Rust accepte des nombres, des couleurs de thème (qui suivent l'apparence) et des angles en degrés pour `bind_rotate`. |
| `diffClamp(min, max, options?)` | `diff_clamp(min, max)`, `diff_clamp_with(min, max, DiffClamp::snapping())` | Suit les changements de l'entrée mais garde le résultat dans `min..max` : un en-tête qui se cache quand le contenu défile vers le haut et revient dès qu'il défile vers le bas. `snap: true` le cale à la borne la plus proche en 200 ms quand sa vue défilante s'immobilise, à `max` seulement une fois que l'entrée a atteint `max`. |
| `add`, `sub`, `mul`, `div` | `add`, `sub`, `mul`, `div` | Arithmétique avec un autre nœud ou une constante. |
| `mod(b)` | `modulo(b)` | Modulo, jamais négatif pour un `b` positif (ce qui garde les angles dans 0..360). |

```rust tabs
let scroll_y = animated_value(0.0);
let header = scroll_y.diff_clamp(0.0, 44.0);

view()
    .flex_1()
    .child(scroll().scroll_value(&scroll_y).flex_1() /* rows */)
    .child(view().h(px(44.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 44);

<Scroll scrollValue={scroll} style={{ flex: 1 }}>{/* rows */}</Scroll>
<View style={{ height: 44, transform: [{ translateY: header.mul(-1) }] }} />
```

```rust tabs
let progress = animated_value(0.0);
let rotate = progress.interpolate(&[0.0, 1.0], &[0.0, 360.0]); // degrees, for bind_rotate
let color = progress.interpolate_colors(&[0.0, 0.5, 1.0], &[rgb(0x22c55e), rgb(0xeab308), rgb(0xef4444)]);
```

```tsx tabs
const progress = createAnimatedValue(0);
const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
const color = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["#22c55e", "#eab308", "#ef4444"] });
```
### Keyframes

```ts
interface Keyframe {
  offset?: number;          // 0..1 of an iteration; missing offsets spread evenly
  value: number | string;   // a number, or an angle ("45deg", "0.5turn") in degrees
  easing?: Easing;          // the segment that starts here
}
type KeyframeValue = number | string | Keyframe;

interface KeyframeTiming {
  duration?: number;        // one iteration, ms (300)
  delay?: number;           // before the first iteration, ms (0)
  easing?: Easing;          // segments without their own (CSS "ease")
  iterations?: number | "infinite";   // 1
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}
```

`value.keyframes(frames, options)` fait parcourir à une valeur des keyframes et se résout avec `{ finished }`, selon qu'elles sont allées à leur terme ; `Animated.keyframes(value, { keyframes, ...options })` est identique à une étape d'une composite. Rust : `value.keyframes(frames, KeyframeTiming)` et `Animation::keyframes(&value, frames, KeyframeTiming)`, avec `Keyframe::new(value)` (réparties uniformément), `Keyframe::at(offset, value)` et `.ease(easing)`, et `KeyframeTiming::new(ms)` avec `.delay(ms)`, `.easing(e)`, `.iterations(Some(n))`, `.infinite()` et `.direction(PlaybackDirection::…)`.

Elles se jouent comme les keyframes CSS : un easing façonne un segment (celui d'une keyframe vaut pour le segment qui part d'elle, celui du timing pour tous les autres) ; les offsets absents des keyframes sont répartis uniformément, le premier à 0 et le dernier à 1 ; chaque itération commence par un saut vers sa première keyframe, et sans keyframe à 0 la valeur part de là où elle se trouve ; pendant un `delay` la valeur reste sur la première keyframe (CSS `animation-fill-mode: backwards`) ; les itérations en sens inverse parcourent les segments à rebours, avec leurs courbes inversées ; la valeur reste là où la dernière itération la laisse.

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).iterations(Some(3)),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, iterations: 3 });
```

### createMotion

```ts
function createMotion(options?: MotionOptions): Motion;

interface MotionOptions extends MotionPlayOptions {
  initial?: { [C in MotionChannel]?: number };   // where channels start (the others at rest)
  enter?: MotionName | MotionSpec;   // start where it starts and play it at once
}

interface MotionPlayOptions extends KeyframeTiming {
  ignoreReduceMotion?: boolean;      // play even when the user asks for less motion
}

interface Motion {
  readonly opacity: AnimatedValue;
  readonly translateX: AnimatedValue;
  readonly translateY: AnimatedValue;
  readonly rotate: AnimatedValue;    // degrees
  readonly rotateX: AnimatedValue;
  readonly rotateY: AnimatedValue;
  readonly scale: AnimatedValue;
  readonly scaleX: AnimatedValue;
  readonly scaleY: AnimatedValue;
  readonly style: { opacity: AnimatedValue; transform: MotionTransform };
  readonly transform: MotionTransform;
  play(motion: MotionName | MotionSpec, options?: MotionPlayOptions): Promise<{ finished: boolean }>;
  animation(motion: MotionName | MotionSpec, options?: MotionPlayOptions): CompositeAnimation;
  stop(): void;
  reset(): void;
}
```

Crée un motion : une valeur animée pour chaque canal de l'opacité et de la transformation d'une vue, au repos (opacité et échelles à 1, les autres à 0), ainsi que des motions à jouer dessus nativement. Liez-le avec `style={motion.style}`, ou étalez `motion.style` ou `motion.transform` dans un style ; la transformation applique ses translations, puis ses rotations, puis ses échelles, avec `scale` intégré à `scaleX` et `scaleY` : 7 des 8 étapes de transformation d'une vue, ce qui en laisse une pour les vôtres (`[{ perspective: 600 }, ...motion.transform]` pour les retournements 3D). `initial` définit où les canaux démarrent (`{ opacity: 0 }` ; les autres démarrent au repos). Avec `enter`, les canaux qu'il anime démarrent là où ce motion démarre (sur `initial`) et il se joue aussitôt, les autres options servant de timing (`delay`, `duration`, ...). Un motion n'anime que l'opacité et la transformation : étaler `motion.style` définit le `opacity` de la vue, donc ne liez que `motion.transform` pour garder une opacité à vous, et animez les couleurs avec une valeur animée et `interpolate`. Rust : `motion()`, un handle `Copy` conservé par le composant qui l'a créé, lié avec `.bind_motion(&m)` ; `motion().entering(spec)` joue l'entrée.

| Membre | Rust (`Motion`) | Description |
|---|---|---|
| `opacity`, `translateX`, ... `scaleY` | `value(MotionChannel::Opacity)`, ... | Les valeurs animées des canaux. |
| `style`, `transform` | `.bind_motion(&m)` sur l'élément | Les liaisons. |
| `play(motion, options?)` | `play(spec)`, `play_ignoring_reduce_motion(spec)` | Joue un preset par son nom ou un [`MotionSpec`](#motions) sur les canaux ; un nouveau interrompt celui en cours. `options` modifient son timing. Se résout avec `{ finished }` : `true` s'il est allé à son terme, `false` si quelque chose l'a arrêté (`AnimationEnd` en Rust). |
| `animation(motion, options?)` | `animation(spec)` | Le même motion sous forme de [`CompositeAnimation`](#animated), non démarré, à composer : `Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" })` (Rust : `Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(\|m\| m.animation(MotionPreset::FadeInUp)))`). Le mouvement réduit est déterminé à sa création. |
| `stop()` | `stop()` | L'arrête là où il en est. |
| `reset()` | `reset()` | L'arrête et remet chaque canal au repos. |

Lorsque l'utilisateur demande moins de mouvement (`reduceMotion()`), `play`, `animation` et `enter` arrivent aussitôt là où le motion se termine, sans bouger, sauf si `ignoreReduceMotion` est défini (sur les options ou sur le motion).

```rust tabs
let card = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(80.0)));
view().size(px(120.0)).rounded(px(16.0)).bg(rgb(0x0969da)).bind_motion(&card).on_press(move || {
    card.play(MotionPreset::Pulse);
})
```

```tsx tabs
const card = createMotion({ enter: "fadeInUp", delay: 80 });
<View onPress={() => card.play("pulse")} style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }} />
```

### motions

```ts
const motions: Readonly<Record<MotionName, MotionPreset>>;

type MotionChannel = "opacity" | "translateX" | "translateY" | "rotate" | "rotateX" | "rotateY" | "scale" | "scaleX" | "scaleY";

interface MotionSpec extends KeyframeTiming {
  keyframes: { [C in MotionChannel]?: KeyframeValue[] } | MotionFrame[];
  ignoreReduceMotion?: boolean;
}
type MotionFrame = { [C in MotionChannel]?: number | string } & { offset?: number; easing?: Easing };

interface MotionPreset extends MotionSpec {
  kind: "enter" | "exit" | "attention" | "loop";
}
```

Les motions prêts à l'emploi, sous forme de données : `motion.play("shake")` joue `motions.shake`. `MotionName` est l'un de `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `popIn`, `bounceIn`, `slideInUp`, `slideInDown`, `flipInX`, `flipInY` (entrée) ; `fadeOut`, `fadeOutUp`, `fadeOutDown`, `fadeOutLeft`, `fadeOutRight`, `zoomOut`, `popOut`, `slideOutDown`, `slideOutUp` (sortie) ; `shake`, `headShake`, `wiggle`, `swing`, `pulse`, `heartbeat`, `rubberBand`, `jello`, `tada`, `jump`, `flash` (attention) ; `spin`, `float`, `breathe`, `sway`, `bob`, `glow` (boucle). [Animation](../docs/animation.md#presets) décrit chacun d'eux. Étalez un preset pour le modifier : `motion.play({ ...motions.fadeInUp, duration: 600 })`.

Un `MotionSpec` est un motion qui vous est propre : les keyframes de chaque canal (`{ opacity: [0, 1], translateY: [24, 0] }`), ou une liste de frames telle que l'écrit la Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`, une frame sans offset étant placée selon sa position dans la liste), avec le [timing des keyframes](#keyframes). Rust : `MotionSpec::new(KeyframeTiming)` avec `.values(channel, values)` (réparties uniformément), `.track(channel, keyframes)` et `.timing(|t| …)` ; `MotionPreset::FadeInUp` (ou `.spec()`) est un preset, et `MotionChannel` nomme les canaux.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(MotionChannel::TranslateY, [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)]);
card.play(rise);
```

```tsx tabs
card.play({ duration: 400, keyframes: [{ opacity: 0, translateY: 24, easing: "easeOut" }, { opacity: 1, translateY: 0 }] });
```

### Animated

```ts
const Animated: {
  timing(value: AnimatedValue, config: { toValue: number; duration?: number; easing?: Easing; delay?: number }): CompositeAnimation;
  spring(value: AnimatedValue, config: { toValue: number; stiffness?: number; damping?: number; mass?: number; velocity?: number }): CompositeAnimation;
  decay(value: AnimatedValue, config?: { velocity?: number; deceleration?: number; clamp?: [number, number]; bounce?: number }): CompositeAnimation;
  sequence(list: CompositeAnimation[]): CompositeAnimation;
  parallel(list: CompositeAnimation[], config?: { stopTogether?: boolean }): CompositeAnimation;
  stagger(ms: number, list: CompositeAnimation[], config?: { from?: "first" | "last" | "center" | number }): CompositeAnimation;
  delay(ms: number): CompositeAnimation;
  loop(animation: CompositeAnimation, config?: { iterations?: number; resetBeforeIteration?: boolean }): CompositeAnimation;
  keyframes(value: AnimatedValue, config: KeyframeTiming & { keyframes: KeyframeValue[] }): CompositeAnimation;
  add(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  subtract(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  multiply(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  divide(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  modulo(a: AnimatedNode, b: AnimatedNode | number): AnimatedNode;
  diffClamp(a: AnimatedNode, min: number, max: number, options?: { snap?: boolean }): AnimatedNode;
  sampleSpring(config: SpringConfig & { from?: number }, fps?: number): number[];
  sampleDecay(config: DecayConfig & { from?: number }, fps?: number): number[];
};

interface CompositeAnimation {
  start(callback?: (result: { finished: boolean }) => void): Promise<{ finished: boolean }>;
  stop(): void;
  reset(): void;
}
```

`Animated` construit des animations à partir d'étapes (`timing`, `spring`, `decay`, `sequence`, `parallel`, ...). Rien ne s'exécute avant `start()` ; ensuite l'arbre entier s'exécute nativement, et chaque étape démarre sur le thread d'UI à l'instant exact où la précédente se termine (aucun écart d'une frame, aucun aller-retour vers le code de l'app entre les étapes). Rust construit le même arbre avec `Animation`.

| Fonction | Rust | Description |
|---|---|---|
| `timing`, `spring`, `decay` | `Animation::timing(&value, to, Timing)`, `Animation::spring(&value, to, Spring)`, `Animation::decay(&value, velocity, deceleration)` | Une animation d'une valeur ; mêmes options et valeurs par défaut que les méthodes de [`AnimatedValue`](#animatedvalue), avec la cible en `toValue`. |
| `sequence(list)` | `Animation::sequence(list)` | Exécute les animations l'une après l'autre. |
| `parallel(list, { stopTogether })` | `Animation::parallel(list).stop_together(…)` | Les exécute en même temps. Avec `stopTogether` (par défaut `true`), en arrêter une les arrête toutes. |
| `stagger(ms, list, { from })` | `Animation::stagger(ms, list)`, `Animation::stagger_from(ms, StaggerFrom::Center, list)` | Les exécute en parallèle, chacune démarrant `ms` après la précédente, à compter de `from` : `"first"` (par défaut), `"last"`, `"center"` (celle du milieu démarre aussitôt, les autres s'échelonnent à partir d'elle ; avec un nombre pair, les deux éléments centraux démarrent aussitôt) ou un index (`StaggerFrom::First`, `Last`, `Center`, `Index(i)`). |
| `keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | Une valeur à travers des [keyframes](#keyframes). |
| `delay(ms)` | `Animation::delay(ms)` | Attend ; utile dans `sequence`. |
| `loop(animation, { iterations, resetBeforeIteration })` | `animation.looped(iterations).reset_before_iteration(…)` | Répète `animation` `iterations` fois (indéfiniment par défaut), en remettant ses valeurs en place avant chaque exécution sauf si `resetBeforeIteration` vaut `false`. |
| `add`, `subtract`, `multiply`, `divide`, `modulo`, `diffClamp` | les méthodes du nœud | Les mêmes que les méthodes de [`AnimatedNode`](#animatednode), sous forme de fonctions. |
| `sampleSpring`, `sampleDecay` | `nsh_core::element::sample_spring`, `sample_decay` | Les valeurs d'un spring ou d'un decay, une par frame (voir [Easing](#easing)). |

`CompositeAnimation` :

| Méthode | Rust (`Animation`) | Description |
|---|---|---|
| `start(callback?)` | `start()`, un `AnimationEnd` à attendre | L'exécute (à nouveau). Se résout, et appelle `callback`, une seule fois pour tout l'arbre avec `{ finished }` : indique s'il est allé à son terme plutôt que d'avoir été arrêté. |
| `stop()` | `stop()` | L'arrête là où il en est. |
| `reset()` | `reset()` | L'arrête et remet ses valeurs là où elles étaient au démarrage. |

```rust tabs
let ys: Vec<AnimatedValue> = (0..4).map(|_| animated_value(0.0)).collect();
let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -36.0, Timing::new(220.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);
let run = hop.start();
spawn(async move { log::info!("{}", if run.await { "done" } else { "stopped" }) });
```

```tsx tabs
const ys = [0, 1, 2, 3].map(() => createAnimatedValue(0));
const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -36, duration: 220, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);
hop.start(({ finished }) => console.log(finished ? "done" : "stopped"));
```

### Easing

```ts
type Easing =
  | "linear" | "ease" | "easeIn" | "easeOut" | "easeInOut"
  | [number, number, number, number]   // cubic Bézier x1, y1, x2, y2
  | EasingCurve
  | EasingSteps;                     // Easing.steps(…)

const Easing: {
  linear: Easing;
  ease: Easing;
  bezier(x1: number, y1: number, x2: number, y2: number): Easing;
  steps(count: number, position?: "jump-start" | "jump-end" | "jump-none" | "jump-both" | "start" | "end"): EasingSteps;
  in(e: Easing): Easing;
  out(e: Easing): Easing;
  inOut(e: Easing): Easing;
  sample(easing: Easing, count: number): number[];
  quad: EasingCurve;
  cubic: EasingCurve;
  poly(n?: number): EasingCurve;
  sin: EasingCurve;
  circle: EasingCurve;
  exp: EasingCurve;
  elastic(bounciness?: number): EasingCurve;
  back(s?: number): EasingCurve;
  bounce: EasingCurve;
};
```

Un easing est une donnée, et non une fonction de l'app : le runtime l'évalue nativement. En Rust, c'est l'enum `Easing` : `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bezier(x1, y1, x2, y2)`, `Steps(count, StepPosition)` et `Curve(curve, mode)`, avec un `Curve` (`Quad`, `Cubic`, `Poly(n)`, `Sin`, `Circle`, `Exp`, `Elastic(bounciness)`, `Back(s)`, `Bounce`) et un `EaseMode` (`In`, `Out`, `InOut`). Pour en tracer un, `Easing.sample(easing, count)` (Rust : `nsh_core::element::sample_easing`) donne ses valeurs en `count` points régulièrement espacés de 0 à 1 ; `Animated.sampleSpring` et `Animated.sampleDecay` (`sample_spring`, `sample_decay`) donnent les valeurs d'un spring ou d'un decay, une par frame (à `fps`, 60 par défaut) à partir de `from` (0) jusqu'à sa fin. Les trois proviennent du code natif qu'exécutent les animations. Partout où un `Easing` est accepté en TSX, vous pouvez passer un nom (`"easeOut"`), une courbe de Bézier cubique sous forme de quatre nombres, ou une courbe de l'objet `Easing`.

| Courbe | Rust | Forme |
|---|---|---|
| `quad` | `Curve::Quad` | `t²` |
| `cubic` | `Curve::Cubic` | `t³` |
| `poly(n)` | `Curve::Poly(n)` | `tⁿ` (`n` vaut 2 par défaut) |
| `sin` | `Curve::Sin` | Sinusoïdale |
| `circle` | `Curve::Circle` | Circulaire |
| `exp` | `Curve::Exp` | Exponentielle |
| `elastic(bounciness)` | `Curve::Elastic(bounciness)` | Dépassement élastique (`bounciness` vaut 1 par défaut) |
| `back(s)` | `Curve::Back(s)` | Recule avant de partir ; `s` est le dépassement (1.70158 par défaut) |
| `bounce` | `Curve::Bounce` | Rebondit à la fin |

`Easing.steps(count, position)` est le `steps()` de CSS : la valeur saute entre `count` niveaux au lieu de se déplacer (un sprite image par image, une aiguille qui tictaque). `position` indique où tombent les sauts : `"jump-end"` (par défaut, aussi `"end"`), `"jump-start"` (`"start"`), `"jump-none"` ou `"jump-both"` ; Rust : `Easing::Steps(count, StepPosition::JumpEnd)`, `JumpStart`, `JumpNone`, `JumpBoth`.

Les courbes sont sous leur forme « in » (lentes au début). `Easing.out(curve)` en inverse une, `Easing.inOut(curve)` la rend symétrique, `Easing.in(curve)` la conserve telle quelle ; en Rust, c'est le `EaseMode` de `Easing::Curve`.

```rust tabs
let _ = value.timing(1.0, 600.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
let _ = value.timing_with(1.0, Timing { easing: Easing::Bezier(0.2, 0.0, 0.0, 1.0), ..Timing::default() });
let _ = value.timing_with(1.0, Timing { easing: Easing::EaseOut, ..Timing::default() });
```

```tsx tabs
value.timing(1, { duration: 600, easing: Easing.out(Easing.back()) });
value.timing(1, { easing: Easing.bezier(0.2, 0, 0, 1) });
value.timing(1, { easing: "easeOut" });
```

### LayoutAnimation

```ts
const LayoutAnimation: {
  configureNext(config: LayoutAnimationConfig, onEnd?: () => void): void;
  create(duration: number, type?: LayoutAnimationType, property?: LayoutAnimationProperty): LayoutAnimationConfig;
  Types: { easeInEaseOut; spring; linear; easeIn; easeOut; keyboard };
  Properties: { opacity; scaleXY };
  Presets: { easeInEaseOut: LayoutAnimationConfig; linear: LayoutAnimationConfig; spring: LayoutAnimationConfig };
  easeInEaseOut(onEnd?: () => void): void;
  linear(onEnd?: () => void): void;
  spring(onEnd?: () => void): void;
};

interface LayoutAnimationConfig {
  duration: number;                // ms
  create?: LayoutAnimationAnimation;    // views inserted
  update?: LayoutAnimationAnimation;    // views moved or resized
  delete?: LayoutAnimationAnimation;    // views removed
}

interface LayoutAnimationAnimation {
  type?: "easeInEaseOut" | "spring" | "linear" | "easeIn" | "easeOut" | "keyboard";
  property?: "opacity" | "scaleXY" | "scale";
  duration?: number;
  delay?: number;
  springDamping?: number;          // 0..1, default 0.7
}
```

`LayoutAnimation.configureNext(config)` anime nativement les changements de mise en page du prochain commit : les vues qui se déplacent ou se redimensionnent glissent vers leurs nouveaux cadres, les nouvelles vues apparaissent (en fondu ou en zoom avant, selon `property`) et les vues supprimées disparaissent. Appelez-le juste avant le changement d'état qui modifie la mise en page. Rust : `animate_layout(LayoutAnimation)`, avec les presets de `nsh_core::element::LayoutAnimation` ou ses transitions `create`, `update` et `delete`.

| Membre | Rust | Description |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | Anime les changements du prochain commit ; `onEnd` s'exécute à la fin. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, duration))` | Une config utilisant la même courbe pour les trois phases. |
| `Presets.easeInEaseOut` | `LayoutAnimation::EASE_IN_EASE_OUT` | 300 ms, les vues apparaissent et disparaissent en fondu. |
| `Presets.linear` | `LayoutAnimation::LINEAR` | 500 ms à vitesse constante. |
| `Presets.spring` | `LayoutAnimation::SPRING` | 700 ms ; les cadres rebondissent comme un ressort (amortissement 0.4), les vues se fondent linéairement. |
| `easeInEaseOut(onEnd?)`, `linear(onEnd?)`, `spring(onEnd?)` | `animate_layout(LayoutAnimation::…)` | Raccourcis pour `configureNext(Presets.…)`. |
| `Types`, `Properties` | `LayoutCurve`, `LayoutProperty` | Les noms, sous forme de constantes. |

```rust tabs
let open = signal(false);
let toggle = move || {
    animate_layout(LayoutAnimation::SPRING);
    open.update(|o| *o = !*o);
};

view()
    .child(text("Details").on_press(toggle))
    .child(when(move || open.get(), || text("Shown with a spring.")))
```

```tsx tabs
const open = signal(false);
const toggle = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  open.update((o) => !o);
};

<View>
  <Text onPress={toggle}>Details</Text>
  <If when={open()}>
    <Text>Shown with a spring.</Text>
  </If>
</View>
```

## Device

L'API Device renseigne l'app sur l'appareil et son environnement. Le code Rust appelle les fonctions de `nsh_core::prelude` (`window()`, `dark()`, `font_scale()`, `locale()`, `lifecycle()`, `os()`, `idiom()`, `pixel_ratio()`, `set_color_scheme()`, ...) ; TSX les importe depuis `nsh`. La taille de la fenêtre, le jeu de couleurs, l'échelle de police, le ratio de pixels, la locale et l'état de l'app sont réactifs : lisez-les dans une liaison (une closure passée à un élément en Rust, du JSX en TSX), `computed` ou `effect`, et ce qui les lit se met à jour lorsque la plateforme signale un changement (rotation, redimensionnement de la fenêtre, passage en mode sombre, changement de la taille du texte ou de la langue, passage à un écran d'une autre densité, sortie de l'app puis retour).

```rust tabs
use nsh_core::{
    platform::{Appearance, Idiom, Lifecycle, Os},
    prelude::*, // window, dark, font_scale, locale, lifecycle, os, idiom, pixel_ratio, set_color_scheme, ...
};
```

```tsx tabs
import { colorScheme, fontScale, lifecycle, locale, openUrl, pixelRatio, platform, setColorScheme, windowSize } from "nsh";
```

Voir [Appareil et environnement](../docs/device-and-environment.md) pour le guide.

### windowSize

```ts
const windowSize: Accessor<Size>;
```

La taille de la surface en points : la fenêtre, ou le `NshAppView` / `NshView` intégré. Réactif. Rust : `window() -> Size<Points>`.

```rust tabs
let wide = move || window().width >= px(600.0);

view().style_when(wide, |s| s.flex_row())
```

```tsx tabs
const wide = () => windowSize().width >= 600;

<View style={{ flexDirection: wide() ? "row" : "column" }}>{/* ... */}</View>
```

### colorScheme

```ts
const colorScheme: Accessor<"light" | "dark">;
```

L'apparence affichée : celle du système, sauf si l'app a défini la sienne (`nsh.json` `"appearance"`, [`setColorScheme`](#setcolorscheme)). Réactif. Rust : `dark() -> bool` ; les couleurs du thème (`AdaptiveColor`) et la variante de style `.dark(…)` la suivent sans la lire. La variante `dark:` de Tailwind la suit aussi (voir [Tailwind](../docs/tailwind.md)).

```rust tabs
view().flex_1().bg(move || if dark() { black() } else { white() })
```

```tsx tabs
const dark = () => colorScheme() === "dark";

<View style={{ flex: 1, backgroundColor: dark() ? "#000" : "#fff" }} />
```

### fontScale

```ts
const fontScale: Accessor<number>;
```

La taille de texte préférée de l'utilisateur par rapport à celle par défaut (`1` est la taille par défaut ; Dynamic Type sur iOS, taille de police sur Android), ou la taille de texte que définit à la place l'app hôte. Réactif. Rust : `font_scale() -> f32`. Le texte s'y adapte déjà sauf si `allowFontScaling={false}` ; lisez-la lorsque d'autres tailles doivent suivre, comme des icônes à côté du texte.

### locale

```ts
const locale: Accessor<string>;
```

La locale de l'utilisateur sous forme de balise BCP 47 (`"en-US"`, `"zh-Hans-CN"`), ou la locale que définit à la place l'app hôte. Réactif. Rust : `locale() -> Locale` (`locale().as_str()` est la balise). `Intl` formate selon elle par défaut ; lisez-la pour choisir les chaînes de vos propres traductions ([Appareil et environnement](../docs/device-and-environment.md#language-and-region)).

### lifecycle

```ts
const lifecycle: Accessor<"active" | "inactive" | "background">;
```

Indique si l'app est utilisée, dans les termes de `AppState` de React Native : `"active"` au premier plan et recevant les entrées, `"inactive"` lorsqu'elle est visible sans le focus (une autre app ou fenêtre l'a, ou le système affiche quelque chose par-dessus, comme le sélecteur d'apps ou un appel entrant), `"background"` lorsqu'elle n'est pas visible (en arrière-plan, réduite, un onglet de navigateur masqué). Une app affichée dans une app native suit l'état de cette dernière. Réactif. Rust : `lifecycle() -> Lifecycle` (`Lifecycle::Active`, `Inactive`, `Background`).

Lisez-le dans un effet pour mettre en pause le travail que personne ne voit et le reprendre au retour de l'app :

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

### setColorScheme

```ts
function setColorScheme(scheme: "light" | "dark" | "system"): void;
```

Affiche aussitôt l'app en `scheme` quelle que soit l'apparence du système : `colorScheme()`, les classes `dark:`, le thème des composants et les contrôles de la plateforme (alertes, style par défaut de la barre d'état) la suivent ; `"system"` suit de nouveau le système. `nsh.json` `"appearance"` la définit dès le départ. Rust : `set_color_scheme(Appearance::Dark)` (`Appearance::Light`, `Appearance::System`).
### platform

```ts
const platform: Platform;

interface Platform {
  readonly os: "ios" | "android" | "macos" | "windows" | "linux" | "web";
  readonly version: string;
  readonly idiom: "phone" | "pad" | "mac" | "tv" | "desktop";
  readonly desktop: boolean;
  readonly catalyst: boolean;
  select<T>(spec: PlatformSelectSpec<T>): T | undefined;
}
```

La plateforme sur laquelle l'app s'exécute, constante pendant son exécution.

| Membre | Rust | Description |
|---|---|---|
| `os` | `os() -> Os` (`os().name()` est la chaîne TS) | Le système d'exploitation. iOS, le simulateur iOS et Mac Catalyst renvoient `"ios"`, les navigateurs `"web"`. |
| `version` | `os_version() -> (u16, u16)` | iOS et bureaux : la version de l'OS (`"17.5"`) ; Android : le niveau d'API (`"35"`) ; le web : `"0.0"`. Rust donne les versions majeure et mineure, ou le niveau d'API et 0 sur Android. |
| `idiom` | `idiom() -> Idiom` | Le type d'appareil : `"desktop"` exactement là où `desktop` vaut `true` ; ailleurs `"phone"`, `"pad"` (un iPad, une tablette Android, Mac Catalyst en idiome iPad), `"mac"` (Mac Catalyst en idiome Mac d'UIKit, un idiome mobile) ou `"tv"` (Apple TV, Android TV). |
| `desktop` | `is_desktop() -> bool` | Le comportement de bureau s'applique : macOS, Windows, Linux, et les navigateurs avec une souris et une fenêtre large. Les props `desktop={{…}}`, `select({ desktop })` et `idiom` `"desktop"` le suivent toutes. Mac Catalyst exécute le backend iOS, il est donc mobile : les props `ios={{…}}` s'y appliquent. Le `isAvailable` de [`nsh/desktop`](./nsh-desktop.md#isavailable) est la vérification plus étroite pour ses API de fenêtre et de menu, que possèdent macOS, Windows et Linux. |
| `catalyst` | `is_catalyst() -> bool` | L'app s'exécute sous Mac Catalyst, dans l'idiome Mac ou iPad (`os` vaut `"ios"`). |
| `select(spec)` | `match os() { … }` | La valeur pour cette plateforme (voir ci-dessous). |

```rust tabs
let columns = if is_desktop() { 3 } else { 1 };
```

```tsx tabs
const columns = platform.desktop ? 3 : 1;
```

#### platform.select

```ts
interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  macos?: T;
  windows?: T;
  linux?: T;
  web?: T;
  mobile?: T;   // platform.desktop false: iOS (Mac Catalyst included), Android, phone and tablet browsers
  desktop?: T;  // platform.desktop true: macOS, Windows, Linux, desktop browsers
  native?: T;   // every platform but the web
  default?: T;
}
```

Renvoie la valeur pour l'OS courant (`ios`, `android`, `web`, ...), sinon `desktop` ou `mobile` (selon `platform.desktop`), sinon `native` (toutes les plateformes sauf le web), sinon `default`, sinon `undefined`. Le code Rust utilise un `match` sur `os()` (et `is_desktop()` pour `mobile` / `desktop`).

```rust tabs
use nsh_core::platform::Os;

let card = view().p_4();
let card = match os() {
    Os::Ios => card.shadow([BoxShadow {
        offset_y: px(2.0),
        blur: px(8.0),
        color: rgba(0x00000026).into(),
        ..BoxShadow::default()
    }]),
    Os::Android => card.elevation(px(4.0)),
    _ => card,
};
```

```tsx tabs
const shadow = platform.select({
  ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.15)" },
  android: { elevation: 4 },
});
```

> [!TIP]
> Pour les props qu'une seule plateforme possède, préférez les props `ios={{…}}` / `android={{…}}` des éléments et composants TSX à un branchement sur `platform` (voir [Code spécifique à une plateforme](../docs/platform-specific.md)).

### pixelRatio

```ts
const pixelRatio: Accessor<number>;
```

Pixels de l'appareil par point (par ex. `3` sur la plupart des iPhone). Réactif : il change quand la fenêtre passe sur un écran d'une autre densité (sur Mac Catalyst, les bureaux, ou un écran externe) et quand le réglage de taille d'affichage d'Android change la densité. Rust : `pixel_ratio() -> f32`, et `round_to_nearest_pixel(points)` pour une longueur en pixels entiers de l'appareil ; en TSX, cette longueur est `Math.round(x * pixelRatio()) / pixelRatio()`.

```rust tabs
let hairline = move || px(1.0 / pixel_ratio());
```

```tsx tabs
const hairline = () => 1 / pixelRatio();
```

### openUrl

```ts
function openUrl(url: string): Promise<OpenUrlResult>;

interface OpenUrlResult {
  opened: boolean;
}
```

Ouvre `url` en dehors de l'app : une page web dans le navigateur, un lien `mailto:` dans l'app de messagerie, un lien `tel:` dans l'app téléphone, et tout schéma qu'une autre app a enregistré (`maps:`, les liens `lb://` propres à une app hôte). Elle se résout avec `{ opened }`, selon qu'une app l'a ouvert ou non : `false` quand aucune app ne gère le schéma. Rust : `open_url(url)` de `nsh_core::prelude`, une réponse à attendre dans une tâche (ou à abandonner), le même `bool`.

```rust tabs
button()
    .child(text("Contact us"))
    .on_press(|| {
        spawn(async {
            if !open_url("mailto:help@example.com").await {
                log::warn!("no mail app");
            }
        });
    })
```

```tsx tabs
<Button
  onPress={async () => {
    const { opened } = await openUrl("mailto:help@example.com");
    if (!opened) {
      console.warn("no mail app");
    }
  }}
>
  <Text>Contact us</Text>
</Button>
```

- L'URL est absolue (elle a un schéma). Les URL qui exécuteraient du code ou atteindraient les données propres de l'app, `javascript:`, `data:`, `blob:`, `file:`, `about:` et `asset:`, rejettent la promesse avec une `TypeError`, de même que les adresses relatives. `openUrl` ne lève jamais d'exception : tout échec rejette la promesse.
- Une app qui déclare des capabilities a besoin de `openUrl` : `"openUrl": true` pour tous les schémas, ou `"openUrl": { "schemes": ["https", "mailto"] }` pour ceux listés ; les autres URL rejettent avec une `Error` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission` `"openUrl"` et `resource` l'URL (voir [Sandbox et capabilities](../docs/sandbox-and-capabilities.md)). En Rust, `open_url` répond `false` dans ces cas et journalise la raison.
- L'app hôte qui embarque voit l'URL en premier et peut la router à la place via son propre routeur (Swift `NshAppView.onOpenURL`, Java `NshView.setOpenUrlHandler`, Rust `AppView::host().handle_open_url` ; voir [iOS](../docs/ios.md#links-the-app-opens) et [Android](../docs/android.md#links-the-app-opens)). `opened` vaut alors `true`.
- Chaque plateforme l'ouvre avec son propre ouvreur : `UIApplication.open` sur iOS (l'application de l'app hôte lorsqu'elle est embarquée), une intention `ACTION_VIEW` sur Android, `NSWorkspace` sur macOS, `ShellExecuteW` sur Windows, `GtkUriLauncher` sur Linux, `open_url` de GPUI, un nouvel onglet sur le web. `nsh test` enregistre les URL au lieu de les ouvrir.
- Un [`TextView`](../elements/text-view.md) ouvre ses liens de cette façon avec `links="open"`.

<a id="layout-direction"></a>

### Direction de mise en page

La direction de mise en page suit la langue de l'utilisateur : dans une langue s'écrivant de droite à gauche (arabe, hébreu, ...), l'app se met en page de droite à gauche, les lignes partent de la droite, et les propriétés de style `left` / `right` (`marginLeft`, `paddingRight`, ...) désignent le début et la fin. Les changements s'appliquent immédiatement, sans redémarrage.

Le style `direction` d'une vue (`"ltr"`, `"rtl"` ou `"inherit"`, la valeur par défaut) définit la direction de son propre sous-arbre ; en Rust, `.direction(LayoutDirection::..)`.

```rust tabs
view().direction(LayoutDirection::Rtl).flex_row().gap_2().child(text("First")).child(text("Second"))
```

```tsx tabs
<View style={{ direction: "rtl", flexDirection: "row", gap: 8 }}>
  <Text>First</Text>
  <Text>Second</Text>
</View>
```

<a id="related"></a>

### Voir aussi

- Les safe area insets (Rust `safe_area()` ; TSX `safeArea()`, `safeAreaInsets()`) et le clavier logiciel (Rust `keyboard_height()` ; TSX `keyboardFrame()`) sont décrits dans [Safe area et clavier](#safe-area-and-keyboard).
- Les réglages de lecteur d'écran et de réduction des animations sont décrits dans [Accessibilité](#accessibility).

## PanResponder

Les pan responders sont des gestes de glissement construits sur le système de gesture responder : l'élément revendique les touches d'un geste, puis les entend seul avec l'état du geste, qui suit pour vous le centroïde des touches, la distance parcourue et la vitesse. Le code Rust les revendique avec `.claim_touches(TouchClaim::…)` et les entend avec des listeners `.on_responder_*` dont `ResponderEvent` porte un `PanGesture`, le tout dans `nsh_core::prelude` ; TSX importe `PanResponder` depuis `nsh`, dont les callbacks `onPanResponder…` reçoivent l'événement tactile et l'état du geste.

```rust tabs
use nsh_core::prelude::*; // TouchClaim, ClaimRequest, ResponderEvent, PanGesture
```

```tsx tabs
import { PanResponder, type PanResponderGestureState } from "nsh";
```

> [!TIP]
> Un pan responder transmet chaque déplacement au code de l'app, il convient donc aux gestes qui modifient l'état de l'app (réorganisation, décisions de balayage pour supprimer). Pour déplacer une vue avec le doigt, les valeurs de geste natives sont plus rapides : `.pan_values(x, y)`, `.pinch_value(scale)` et `.rotation_value(angle)` en Rust, les props `pan={{ x, y }}`, `pinch` et `rotation` en TSX. Le glissement écrit des [valeurs animées](#animation) sur le thread UI et l'app n'est informée qu'au début et à la fin (`on_pan_start` / `on_pan_end`, `onPanStart` / `onPanEnd`). Voir [Touch et gestes](../docs/touch-and-gestures.md).

### PanResponder.create

```ts
const PanResponder: { create(config: PanResponderCallbacks): PanResponderInstance };

interface PanResponderInstance {
  panHandlers: TouchProps;
}
```

Crée un pan responder. Propagez son `panHandlers` sur la vue qui doit recevoir le geste. En Rust, la vue revendique les touches et écoute elle-même :

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view().flex_1().child(
        view()
            .size(px(64.0))
            .rounded(px(32.0))
            .bg(rgb(0x6366f1))
            .style_with(move |s| {
                let (x, y) = pos.get();
                s.translate_x(px(x)).translate_y(px(y))
            })
            .claim_touches(TouchClaim::on_start())
            .on_responder_grant(move |_: &ResponderEvent| {
                start.replace(pos.get_untracked());
            })
            .on_responder_move(move |e: &ResponderEvent| {
                let (x, y) = start.get();
                pos.set((x + e.gesture.delta.x.0, y + e.gesture.delta.y.0));
            })
            .on_responder_release(move |e: &ResponderEvent| {
                log::info!("released at {:.0} pt/s", e.gesture.vx);
            }),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function App() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => (start = pos()),
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log(`released at ${g.vx.toFixed(0)} pt/s`),
  });
  return (
    <View style={{ flex: 1 }}>
      <View
        {...pan.panHandlers}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#6366f1",
          transform: [{ translateX: pos().x }, { translateY: pos().y }],
        }}
      />
    </View>
  );
}

mount(App);
```

### Callbacks

Chaque callback reçoit l'événement tactile (`GestureResponderEvent`, de [`nsh`](#types)) et l'état du geste. En Rust, une revendication décide avec `.ask(|request: &ClaimRequest| …)`, en appelant `request.claim()` pour prendre les touches (sans `ask`, elle les prend toujours), et chaque listener reçoit un `ResponderEvent` dont `gesture` est l'état.

```ts
type PanHandler<R = void> = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => R;
```

| Callback | Rust | Renvoie | Appelé quand |
|---|---|---|---|
| `onStartShouldSetPanResponder` | `.claim_touches(TouchClaim::on_start())` | `boolean` | Un doigt se pose : renvoyez `true` pour devenir le responder. Demandé depuis la vue touchée vers l'extérieur. |
| `onStartShouldSetPanResponderCapture` | `TouchClaim::on_start().capture()` | `boolean` | Idem, mais demandé de l'extérieur vers l'intérieur avant la phase de remontée (un parent qui prend le geste à ses enfants). |
| `onMoveShouldSetPanResponder` | `TouchClaim::on_move().ask(…)` | `boolean` | Un doigt bouge : renvoyez `true` pour devenir le responder (par ex. seulement une fois `Math.abs(g.dx) > 10`). |
| `onMoveShouldSetPanResponderCapture` | `TouchClaim::on_move().capture()` | `boolean` | Idem, phase de capture. |
| `onPanResponderGrant` | `.on_responder_grant(…)` | | Cette vue est désormais le responder : le geste commence. |
| `onPanResponderReject` | `.on_responder_reject(…)` | | Une autre vue est le responder et ne veut pas le céder. |
| `onPanResponderStart` | `.on_responder_start(…)` | | Un doigt s'est posé pendant que la vue répond. |
| `onPanResponderMove` | `.on_responder_move(…)` | | Les doigts ont bougé. |
| `onPanResponderEnd` | `.on_responder_end(…)` | | Un doigt s'est levé pendant que la vue répond. |
| `onPanResponderRelease` | `.on_responder_release(…)` | | Le dernier doigt s'est levé : le geste est terminé. |
| `onPanResponderTerminate` | `.on_responder_terminate(…)` | | Une autre vue (ou un geste natif, comme une scroll view) a pris les touches. |
| `onPanResponderTerminationRequest` | `.keep_touches(true)` les garde | `boolean` | Une autre vue veut les touches : renvoyez `false` pour les garder (par défaut `true`). |
| `onShouldBlockNativeResponder` | `TouchClaim::block_native(…)` | `boolean` | Indique s'il faut empêcher les scroll views natives de prendre les touches pendant que la vue répond (par défaut `true`). |

### PanResponderGestureState

```ts
interface PanResponderGestureState {
  stateID: number;
  moveX: number;               // latest centroid of the touches (surface points)
  moveY: number;
  x0: number;                  // the centroid when the responder was granted
  y0: number;
  dx: number;                  // distance moved since the grant
  dy: number;
  vx: number;                  // velocity, points per second
  vy: number;
  numberActiveTouches: number;
}
```

Rust : `PanGesture`, avec des points sous forme de `Point<Points>`.

| Champ | Rust | Description |
|---|---|---|
| `stateID` |  | Identifie le geste. |
| `moveX`, `moveY` | `position` | Dernière position du centroïde des touches, en points de la surface. |
| `x0`, `y0` | `origin` | Position du centroïde au moment où le responder a été accordé. |
| `dx`, `dy` | `delta` | Distance parcourue depuis l'octroi. |
| `vx`, `vy` | `vx`, `vy` | Vitesse en points par seconde. |
| `numberActiveTouches` | `active_touches` | Doigts posés. |

<a id="inside-scroll-views"></a>

### Dans les scroll views

Tant qu'un pan responder est le responder, les scroll views natives qui l'entourent ne défilent pas (`onShouldBlockNativeResponder` vaut par défaut `true`). Pour faire coexister un balayage horizontal avec un défilement vertical, ne devenez le responder que lors des déplacements horizontaux :

```rust tabs
view()
    .claim_touches(TouchClaim::on_move().ask(|request: &ClaimRequest| {
        let d = request.event.gesture.delta;
        if d.x.0.abs() > 10.0 && d.x.0.abs() > d.y.0.abs() {
            request.claim();
        }
    }))
    .on_responder_move(move |e: &ResponderEvent| offset.set(e.gesture.delta.x.0))
    .on_responder_release(move |e: &ResponderEvent| {
        if e.gesture.delta.x.0.abs() > 120.0 { remove() } else { offset.set(0.0) }
    })
    .on_responder_terminate(move |_: &ResponderEvent| offset.set(0.0))
```

```tsx tabs
const swipe = PanResponder.create({
  onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
  onPanResponderMove: (_, g) => offset.set(g.dx),
  onPanResponderRelease: (_, g) => (Math.abs(g.dx) > 120 ? remove() : offset.set(0)),
  onPanResponderTerminate: () => offset.set(0),
});
```

Pour un glissement que la plateforme reconnaît, `TouchClaim::on_pan(PanActivation::horizontal(10.0, 10.0))` décide sur le thread principal pendant que les doigts bougent. Les props de responder sous-jacentes (`onStartShouldSetResponder`, `onResponderGrant`, `onTouchStart`, ...) peuvent aussi être utilisées directement sur n'importe quel élément ; voir [Éléments](../elements/index.md).

## Clipboard

L'API Clipboard lit et écrit le presse-papiers du système : du texte partout (`UIPasteboard` sur iOS, `ClipboardManager` sur Android, `NSPasteboard`, GDK et le presse-papiers Win32 sur les bureaux, `navigator.clipboard` sur le web), des images sur iOS, les bureaux et le web, et les fichiers copiés dans un gestionnaire de fichiers sur les bureaux et Mac Catalyst. Le code Rust appelle les fonctions de `nsh_core::prelude` (`set_clipboard`, `clipboard_string`, ...) ; TSX importe `Clipboard` depuis `nsh`.

```rust tabs
use nsh_core::prelude::*; // set_clipboard, clipboard_string, clipboard_image, ...
use nsh_core::element::ClipboardImage;
```

```tsx tabs
import { Clipboard } from "nsh";
```

```ts
const Clipboard: {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
  hasText(): Promise<boolean>;
  writeImage(src: string): Promise<void>;
  readImage(): Promise<ClipboardImage | null>;
  hasImage(): Promise<boolean>;
  readFiles(): Promise<string[]>;
};

interface ClipboardImage {
  url: string; // a URL that Image shows and fetch reads
  size: PixelSize; // in pixels
}
```

| TS | Rust (`nsh_core::prelude`) |
|---|---|
| `await Clipboard.writeText(text)` | `set_clipboard(text)` |
| `await Clipboard.readText()` | `clipboard_string().await -> String` |
| `await Clipboard.hasText()` | `clipboard_has_string().await -> bool` |
| `await Clipboard.writeImage(src)` | `set_clipboard_image(src)` |
| `await Clipboard.readImage()` | `clipboard_image().await -> Option<ClipboardImage>` |
| `await Clipboard.hasImage()` | `clipboard_has_image().await -> bool` |
| `await Clipboard.readFiles()` | `clipboard_files().await -> Vec<String>` |

Les lectures Rust renvoient des réponses à attendre dans une tâche (`spawn`, ou une fonction de module `async`) ; `ClipboardImage` est `nsh_core::element::ClipboardImage`, avec `url` et `size` (un `Size<DevicePixels>`).

Les images passent par le presse-papiers sur iOS, les bureaux et le web. Sur Android, le presse-papiers transporte du texte : `writeImage` et
`readImage` rejettent avec une `Error` dont `code` vaut `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`, et `hasImage` se résout avec
`false`. En Rust, `set_clipboard_image` laisse le presse-papiers en l'état sur cette plateforme et `clipboard_image` répond `None`.

L'utilisateur peut aussi copier lui-même depuis un [texte sélectionnable](../elements/text.md) ; l'API Clipboard sert à copier depuis le code, par exemple pour un bouton Copier.

### Clipboard.writeText

```ts
writeText(text: string): Promise<void>;
```

Place `text` dans le presse-papiers, en remplaçant son contenu. Rust : `set_clipboard(text)`.

```rust tabs
use nsh_core::prelude::*;

fn copy_button(code: Signal<String>) -> impl IntoElement {
    let copied = signal(false);
    view()
        .role(AccessibilityRole::Button)
        .on_press(move || {
            set_clipboard(code.get());
            copied.set(true);
        })
        .child(text(move || if copied.get() { "Copied" } else { "Copy" }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Clipboard } from "nsh";

const copied = signal(false);

<View
  onPress={async () => {
    await Clipboard.writeText(code());
    copied.set(true);
  }}
>
  <Text>{copied() ? "Copied" : "Copy"}</Text>
</View>;
```

### Clipboard.readText

```ts
readText(): Promise<string>;
```

Se résout avec le texte du presse-papiers, ou `""` s'il n'en contient pas. Rust : `clipboard_string()`. Sur iOS, la lecture du presse-papiers peut afficher l'avis de collage du système (« L'app a collé depuis … »), et sur Android 10 et versions ultérieures, seule l'app au premier plan peut le lire. Lisez-le quand l'utilisateur demande de coller, pas à chaque écran.

```rust tabs
spawn(async move {
    let pasted = clipboard_string().await;
    if !pasted.is_empty() {
        code.set(pasted.trim().to_string());
    }
});
```

```tsx tabs
const pasted = await Clipboard.readText();
if (pasted) code.set(pasted.trim());
```

### Clipboard.hasText

```ts
hasText(): Promise<boolean>;
```

Se résout avec un booléen indiquant si le presse-papiers contient du texte, sans le lire : pas d'avis de collage sur iOS. Rust : `clipboard_has_string()`. Utilisez-le pour décider d'afficher ou non un bouton Coller. Sur le web, les navigateurs ne le savent qu'en lisant, ce qui peut donc demander une autorisation à l'utilisateur.

```rust tabs
let can_paste = signal(false);
spawn(async move { can_paste.set(clipboard_has_string().await) });
```

```tsx tabs
const canPaste = signal(false);
Clipboard.hasText().then((has) => canPaste.set(has));
```

### Clipboard.readImage

```ts
readImage(): Promise<ClipboardImage | null>;
```

Se résout avec l'image du presse-papiers, ou `null` s'il n'en contient pas : une capture d'écran collée, ou une image copiée dans un navigateur
ou un éditeur d'images. Rust : `clipboard_image()`, `None` s'il n'en contient pas. `url` est une URL de l'image (PNG, ou le
JPEG, GIF, WebP ou BMP propre au presse-papiers) qu'une [`Image`](../elements/image.md) affiche comme son `src` et que `fetch` lit :
`fetch(url)` donne ses octets, pour un envoi. `size` (`width` et `height`) est sa taille en pixels, une fois décodée. Comme pour
`readText`, lisez-le quand l'utilisateur demande de coller. Les images jusqu'à 48 Mo (encodées) sont lues, afin que l'image tienne dans la
mémoire de l'app ; une image plus grande rejette avec une `Error` dont `code` vaut `"ERR_NSH_QUOTA_EXCEEDED"` (son message indique la taille de
l'image et la limite), tandis que `hasImage` se résout avec `true`. Rust : `clipboard_image()` répond `None` dans ce cas.

```rust tabs
use base64::Engine as _;
use nsh_core::{element::ClipboardImage, prelude::*};

fn attachments() -> impl IntoElement {
    let attachments = signal(Vec::<ClipboardImage>::new());
    let paste = move || {
        spawn(async move {
            if let Some(image) = clipboard_image().await {
                attachments.update(|list| list.push(image));
            }
        });
    };
    view()
        .flex_row()
        .gap_2()
        .child(text("Paste").on_press(paste))
        .child(each(
            attachments,
            |shot: &ClipboardImage| shot.url.clone(),
            |shot, _| image(move || shot.with(|s| s.url.clone())).size(px(64.0)).rounded(px(8.0)),
        ))
}

async fn upload(image: &ClipboardImage) -> Result<HttpResponse, String> {
    let (_, data) = image.url.split_once(',').ok_or("not a data: URL")?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| e.to_string())?;
    let request = HttpRequest::post("https://example.com/upload", bytes).header("Content-Type", "image/png");
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, View } from "nsh";
import { Clipboard, type ClipboardImage } from "nsh";

const attachments = signal<ClipboardImage[]>([]);

async function paste() {
  const image = await Clipboard.readImage();
  if (image) attachments.set([...attachments(), image]);
}

async function upload(image: ClipboardImage) {
  const body = new FormData();
  body.append("file", await (await fetch(image.url)).blob(), "screenshot.png");
  await fetch("https://example.com/upload", { method: "POST", body });
}

<View class="flex-row gap-2">
  <Each of={attachments()}>
    {(image) => <Image src={image().url} style={{ width: 64, height: 64, borderRadius: 8 }} />}
  </Each>
</View>;
```

Une app de type messagerie où les utilisateurs collent des captures d'écran dans une zone de saisie lie le raccourci de collage tant que son champ a le focus
et prend l'image s'il y en a une :

```rust tabs
use nsh_core::keymap::When;

on_key_with("mod+v", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| {
    spawn(async move {
        if clipboard_has_image().await {
            paste().await;
        } else {
            insert_text(&clipboard_string().await);
        }
    });
});
```

```tsx tabs
import { keymap } from "nsh";

keymap.bind("mod+v", async () => {
  if (await Clipboard.hasImage()) return paste();
  insertText(await Clipboard.readText());
}, { when: "always" });
```

### Clipboard.hasImage

```ts
hasImage(): Promise<boolean>;
```

Se résout avec un booléen indiquant si le presse-papiers contient une image, sans la lire : pas d'avis de collage sur iOS. Rust :
`clipboard_has_image()`. Sur Android, elle se résout avec `false`.

### Clipboard.writeImage

```ts
writeImage(src: string): Promise<void>;
```

Place dans le presse-papiers l'image de `src`, une URL `data:` en base64 ou le `url` que `readImage` a donné, en remplaçant son contenu.
Rust : `set_clipboard_image(src)`. Sous Windows, elle accepte un PNG, le format que lisent les navigateurs, Office et l'Outil Capture d'écran. Sur
Android, elle rejette avec `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.

```rust tabs
set_clipboard_image(image.url.clone());
```

```tsx tabs
await Clipboard.writeImage(image.url);
```

### Clipboard.readFiles

```ts
readFiles(): Promise<string[]>;
```

Se résout avec les URL `file:` des fichiers et dossiers copiés dans un gestionnaire de fichiers (Finder, Explorer, Files), dans leur
ordre, ou `[]` : ce sont les mêmes URL que fournit un [dépôt de fichiers](../elements/view.md#desktop-file-drops). Rust : `clipboard_files()`.
Analysez une URL pour obtenir son chemin.

```rust tabs
let paths: Vec<std::path::PathBuf> = clipboard_files()
    .await
    .iter()
    .filter_map(|file| url::Url::parse(file).ok()?.to_file_path().ok())
    .collect();
```

```tsx tabs
const files = await Clipboard.readFiles();
const names = files.map((url) => decodeURIComponent(new URL(url).pathname.split("/").pop()!));
```

> [!NOTE]
> Lorsque votre app déclare `capabilities` dans `nsh.json`, le presse-papiers doit être autorisé avec `"clipboard": true`. Sans cela, chaque fonction de `Clipboard` rejette avec une `Error` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission` `"clipboard"` et `resource` `""`, et rien n'atteint le presse-papiers du système. En Rust, les écritures laissent le presse-papiers en l'état et les lectures répondent comme le ferait un presse-papiers vide (`""`, `None`, une liste vide, `false`), et le refus est journalisé. Voir [Sandbox et capabilities](../docs/sandbox-and-capabilities.md).
>
> ```tsx
> try {
>   await Clipboard.writeText(code());
> } catch (error) {
>   if (error.code === "ERR_ACCESS_DENIED") showHint("Copying is turned off for this app");
>   else throw error;
> }
> ```
## Picker

L'API picker affiche le sélecteur de photos du système et remet à l'app les images que l'utilisateur choisit : le sélecteur Photos sur
iOS (`PHPickerViewController`), le Photo Picker sur Android, un panneau d'ouverture ou une boîte de dialogue de fichiers sur les ordinateurs de bureau et un champ
de fichier (file input) dans un navigateur. Sur iOS et Android, le sélecteur s'exécute en dehors de l'app et ne transmet que ce que l'utilisateur choisit ; il
ne requiert donc aucune autorisation d'accès à la photothèque. Chaque image choisie arrive sous la forme d'un `File` (TSX) ou d'un `PickedFile` (Rust) dont les octets restent natifs :
affichez-la avec `URL.createObjectURL(file)` dans un [`Image`](../elements/image.md), envoyez-la avec `fetch` et
`FormData`. Le code Rust appelle `pick_images` de `nsh_core::prelude` ; TSX importe `Picker` depuis `nsh`.

```rust tabs
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*; // pick_images
```

```tsx tabs
import { Picker, type PickedImage } from "nsh";
```

```ts
const Picker: {
  pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
};

interface PickImagesOptions {
  multiple?: boolean; // let the user pick several (false: one)
  limit?: number; // at most this many when multiple (up to 100)
  maxDimension?: number; // scale images whose longer side is longer, in pixels
  quality?: number; // JPEG quality from 0 to 1 (0.9)
  format?: "compatible" | "current"; // "compatible": HEIC and the like as JPEG
}

interface PickedImage {
  file: File; // name, type, size in bytes and the bytes
  size: PixelSize; // upright
}
```

| TS | Rust |
|---|---|
| `await Picker.pickImages(options)` | `pick_images(request).await -> Vec<PickedFile>` |
| `multiple`, `limit` | `PickRequest::new(multiple, limit)` (`limit` : 0 pour jusqu'à 100) |
| `maxDimension` | `request.max_dimension = Some(DevicePixels(2048))` |
| `quality` | `request.quality = Some(Percentage(0.8))` |
| `format` | `request.format = PickFormat::Current` |
| `image.file.name`, `.type`, `.size` | `file.name`, `file.mime`, `file.data.len()` |
| `image.size` | `file.size` (`Size<DevicePixels>`) |

### Picker.pickImages

```ts
pickImages(options?: PickImagesOptions): Promise<PickedImage[]>;
```

Affiche le sélecteur et se résout avec les images choisies par l'utilisateur, dans l'ordre du choix, ou avec `[]` lorsque l'utilisateur annule.
Rust : `pick_images(request)`, une réponse à attendre dans une tâche (`spawn`, ou une fonction de module `async`). `pickImages`
ne lève jamais d'exception : des options hors limites (`limit: 0`, un `quality` hors de 0 à 1) rejettent la promesse avec une `RangeError`, et un
choix que les capacités de l'app n'autorisent pas la rejette avec `ERR_ACCESS_DENIED` (ci-dessous). Une annulation est une réponse de l'utilisateur, pas un
échec : la promesse se résout avec `[]`.

Les images arrivent prêtes à être envoyées :

- **Des formats que tous les navigateurs et serveurs acceptent.** JPEG, PNG, GIF et WebP arrivent tels quels ; une photo stockée dans un autre
  format (HEIC sur iPhone, HEIF, TIFF) arrive en JPEG. `format: "current"` conserve le format stocké.
- **Réduites nativement.** Avec `maxDimension`, une image dont le grand côté est plus long est réduite pour tenir dans cette limite, redressée,
  puis réencodée : un PNG en PNG, tout le reste en JPEG de `quality`. Les photos de téléphone font de 12 à 48 mégapixels ; les réduire
  à 2048 pixels avant un envoi les ramène à quelques centaines de kilo-octets. Un `quality` réencode aussi les JPEG.
- **Ce qu'elle affiche.** `size` est la taille de l'image en pixels telle qu'elle s'affiche, son orientation d'appareil photo appliquée. Une image que NSH
  réencode ne porte aucune métadonnée (pas de localisation) ; une image qui arrive telle quelle conserve les siennes.

Sous Windows, sous Linux et dans les fenêtres GPUI, la boîte de dialogue propose les formats que la requête accepte (avec `"compatible"` : JPEG, PNG,
GIF et WebP) et les fichiers arrivent tels qu'ils sont stockés, à leur taille d'origine.

Un champ de saisie de messagerie joint une photo, l'affiche pendant la rédaction du message et l'envoie lorsque le message part :

```rust tabs
use nsh_core::geometry::{DevicePixels, Percentage};
use nsh_core::picker::{PickRequest, PickedFile};
use nsh_core::prelude::*;

fn attach_button(attached: Signal<Option<PickedFile>>) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .accessibility_label("Choose a photo")
        .on_press(move || {
            let mut request = PickRequest::new(false, 1);
            request.max_dimension = Some(DevicePixels(2048));
            request.quality = Some(Percentage(0.85));
            let picked = pick_images(request);
            spawn(async move {
                if let Some(file) = picked.await.into_iter().next() {
                    attached.set(Some(file));
                }
            });
        })
        .child(text("Photo"))
}

async fn upload(file: &PickedFile) -> Result<HttpResponse, String> {
    let request = HttpRequest::post("https://example.com/upload", file.data.to_vec())
        .header("Content-Type", file.mime.as_str());
    fetch(request).await
}
```

```tsx tabs
import { Image, signal, Text, View } from "nsh";
import { Picker } from "nsh";

const attached = signal<{ file: File; src: string } | null>(null);

async function choosePhoto() {
  const [picked] = await Picker.pickImages({ maxDimension: 2048, quality: 0.85 });
  if (picked) attached.set({ file: picked.file, src: URL.createObjectURL(picked.file) });
}

async function send(text: string) {
  const body = new FormData();
  body.append("text", text);
  if (attached()) body.append("photo", attached()!.file);
  await fetch("https://example.com/messages", { method: "POST", body });
  if (attached()) URL.revokeObjectURL(attached()!.src);
  attached.set(null);
}

<View class="flex-row items-center gap-2">
  <View role="button" accessibilityLabel="Choose a photo" onPress={choosePhoto}>
    <Text>Photo</Text>
  </View>
  <If when={attached()}>
    <Image src={attached()!.src} style={{ width: 48, height: 48, borderRadius: 8 }} />
  </If>
</View>;
```

Plusieurs photos à la fois :

```rust tabs
let picked = pick_images(PickRequest::new(true, 9));
spawn(async move {
    let files = picked.await;
    photos.update(|list| list.extend(files));
});
```

```tsx tabs
const images = await Picker.pickImages({ multiple: true, limit: 9, maxDimension: 2048 });
photos.set([...photos(), ...images.map((image) => URL.createObjectURL(image.file))]);
```

<a id="embedding-apps"></a>

### Apps intégratrices

Une app qui intègre NSH et dispose de son propre sélecteur (avec ses propres albums, par exemple) répond elle-même aux choix : en
Rust, un `PickerBackend` (`nsh_core::picker`) remis au moteur (`EngineConfig::picker`, ou `AppView::set_picker` dans
les apps GPUI et GPUI Kit) reçoit le `PickRequest` de chaque choix et renvoie les fichiers, et le sélecteur du système n'est pas
affiché. Les fichiers qu'il renvoie sont complétés comme ceux de la plateforme : limités au maximum de la requête, leurs tailles, types et
extensions lus à partir de leurs octets.

### Tests

`nsh test` répond aux choix dans les exécutions headless : `app.onPick(handler)` renvoie les fichiers que l'utilisateur choisit (`{ name, type, data }`),
et sans handler un choix est annulé. Voir [Tests](../docs/testing-and-trace.md).

> [!NOTE]
> Lorsque votre app déclare `capabilities` dans `nsh.json`, le sélecteur doit être autorisé avec `"picker": true`. Sans cela,
> `pickImages` n'affiche rien et rejette avec une `Error` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission`
> `"picker"` et `resource` `""`. En Rust, `pick_images` répond sans fichier et le refus est journalisé. Voir
> [Sandbox et capacités](../docs/sandbox-and-capabilities.md).

## Speech

L'API speech transforme ce que dit l'utilisateur en texte (dictée) : l'app démarre une session, la plateforme écoute le
microphone, et la transcription arrive au fur et à mesure qu'elle s'allonge. macOS et iOS utilisent le framework Speech du système ; le
système demande une seule fois à l'utilisateur l'accès au microphone et à la reconnaissance vocale. Sur les autres plateformes, une session se termine aussitôt
avec l'erreur `"unavailable"` ; vérifiez donc `Speech.available()` avant d'afficher un bouton de microphone. Le code Rust appelle
`recognize_speech` de `nsh_core::prelude` ; TSX importe `Speech` depuis `nsh`.

```rust tabs
use nsh_core::speech::{SpeechEvent, SpeechRequest};
```

```tsx tabs
import { Speech, type SpeechSession } from "nsh";
```

```ts
const Speech: {
  available(): Promise<boolean>;
  start(options?: SpeechOptions): SpeechSession;
};

interface SpeechOptions {
  /** The language spoken, a BCP 47 tag ("en-US", "zh-CN"); the user's when left out. */
  lang?: string;
  /** Results while the user speaks (true, the default), or only the final one. */
  interim?: boolean;
}

interface SpeechSession {
  on(event: "start", listener: () => void): () => void;
  on(event: "result", listener: (result: SpeechResult) => void): () => void;
  on(event: "end", listener: (end: SpeechEnd) => void): () => void;
  /** The whole transcript so far. */
  readonly text: string;
  readonly ended: boolean;
  stop(): void;
  abort(): void;
}

interface SpeechResult { text: string; isFinal: boolean }
interface SpeechEnd { text: string; error?: SpeechErrorCode }

type SpeechErrorCode =
  | "not-allowed" | "no-speech" | "audio-capture" | "network"
  | "language-not-supported" | "unavailable" | "failed";
```

| TSX | Rust |
|---|---|
| `await Speech.available()` | `speech_available().await -> bool` |
| `Speech.start(options)` | `recognize_speech(request) -> SpeechRecognition` |
| `session.on("result", ...)` | `recognition.next().await -> Option<SpeechEvent>` |
| `session.stop()` / `abort()` | `recognition.stop()` / `abort()` (le supprimer interrompt la session) |

### Speech.start

Démarre une session et la renvoie aussitôt. Une session signale, dans cet ordre : `start` lorsque le microphone est actif et que le moteur de reconnaissance écoute, `result` chaque fois que la transcription change (`text` est toujours la transcription entière jusqu'ici, l'app l'affiche donc telle quelle), et un seul `end`, après quoi plus rien n'arrive. `stop()` arrête l'écoute et laisse le moteur de reconnaissance terminer ce qu'il a entendu : un dernier résultat avec `isFinal: true`, puis `end`. `abort()` met fin à la session aussitôt, sans erreur, et abandonne ce qui n'a pas été signalé. Une seule session s'exécute à la fois : en démarrer une autre interrompt celle en cours.

`end` porte la dernière transcription et, lorsque la session a échoué, `error`, nommé comme dans la Web Speech API :

| `error` | Quand |
|---|---|
| `"not-allowed"` | L'utilisateur ou le système n'autorise pas le microphone ou la reconnaissance vocale. |
| `"no-speech"` | Rien n'a été dit. |
| `"audio-capture"` | Le microphone n'a pas pu être utilisé. |
| `"network"` | Le moteur de reconnaissance a besoin du réseau et n'a pas pu l'atteindre. |
| `"language-not-supported"` | Le moteur de reconnaissance ne connaît pas `lang`. |
| `"unavailable"` | Cette plateforme ne reconnaît pas la parole, ou pas pour l'instant. |
| `"failed"` | Le moteur de reconnaissance a échoué pour une autre raison. |

`start` lève une `TypeError` pour des options de types incorrects et une `RangeError` pour un `lang` qui n'est pas une balise de langue.

```tsx
import { signal, Speech, type SpeechSession } from "nsh";

const transcript = signal("");
let session: SpeechSession | null = null;

function toggle() {
  if (session && !session.ended) {
    session.stop();
    return;
  }
  session = Speech.start({ lang: "en-US" });
  session.on("result", ({ text }) => transcript.set(text));
  session.on("end", ({ text, error }) => {
    if (error) console.warn("dictation ended:", error);
    else transcript.set(text);
  });
}
```

```rust
use nsh_core::prelude::*;
use nsh_core::speech::{SpeechEvent, SpeechRequest};

async fn dictate() -> String {
    let mut recognition = recognize_speech(SpeechRequest::default());
    let mut text = String::new();
    while let Some(event) = recognition.next().await {
        match event {
            SpeechEvent::Result { text: heard, .. } => text = heard,
            SpeechEvent::End { .. } => break,
            _ => {}
        }
    }
    text
}
```

### Speech.available

Se résout avec `true` là où une session peut s'exécuter : sur macOS et iOS, et partout où l'app intégratrice assure elle-même la reconnaissance vocale.

### Info.plist

Sur macOS et iOS, le système indique pourquoi l'app veut accéder au microphone et à la reconnaissance vocale. `nsh package` et
`nsh run` écrivent `NSMicrophoneUsageDescription` et `NSSpeechRecognitionUsageDescription` dans l'Info.plist de l'app
lorsque celle-ci peut utiliser la parole (son autorisation `capabilities` `speech`, ou elle n'en déclare aucune).

<a id="embedding-apps-1"></a>

### Apps intégratrices

Une app qui intègre NSH et reconnaît la parole à sa façon (son propre moteur ou service) répond elle-même aux sessions : en
Rust, un `SpeechBackend` (`nsh_core::speech`) remis au moteur (`EngineConfig::speech`) reçoit le `SpeechRequest` de chaque session et un `SpeechSink` auquel il peut faire ses signalements depuis n'importe quel thread, et renvoie le `SpeechControl` avec lequel le cœur arrête et
interrompt la session. Le moteur de reconnaissance de la plateforme n'est alors pas utilisé.

### Tests

`nsh test` exécute les sessions sur un moteur de reconnaissance factice dans les exécutions headless : une session démarre aussitôt, `app.hear(text)` signale
`text` comme transcription jusqu'ici, `app.endSpeech(error?)` y met fin, et `app.speechRequests()` liste les sessions que l'app a démarrées. Voir [Tests](../docs/testing-and-trace.md).

> [!NOTE]
> Lorsque votre app déclare `capabilities` dans `nsh.json`, la parole doit être autorisée avec `"speech": true`. Sans cela,
> `Speech.start` lève une `Error` dont `code` vaut `"ERR_ACCESS_DENIED"`, `permission` `"speech"` et `resource` `""`.
> En Rust, la session se termine avec `not-allowed` et le refus est journalisé. Voir
> [Sandbox et capacités](../docs/sandbox-and-capabilities.md).

## Storage

L'API storage conserve les données de l'app sur l'appareil : des chaînes associées à des clés de type chaîne, toujours présentes au prochain démarrage de l'app. Utilisez-la pour les réglages, les brouillons, le dernier onglet ouvert par l'utilisateur, un cache de ce que le serveur a envoyé — tout état qui doit survivre au processus de l'app. Le code Rust utilise `nsh_core::storage::Storage`, TSX importe `Storage` depuis `nsh` ; les deux lisent et écrivent les mêmes entrées, de sorte qu'une app avec une entrée Rust et une entrée TSX voit un seul ensemble de données.

```rust tabs
use nsh_core::storage::Storage;
```

```tsx tabs
import { Storage } from "nsh";
```

```ts
const Storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
};
```

| TS | Rust (`nsh_core::storage::Storage`) |
|---|---|
| `await Storage.getItem(key)` | `Storage::get_item(key) -> Option<String>` |
| `await Storage.setItem(key, value)` | `Storage::set_item(key, value) -> Result<(), StorageFull>` |
| `await Storage.removeItem(key)` | `Storage::remove_item(key)` |
| `await Storage.keys()` | `Storage::get_all_keys() -> Vec<String>` |
| `await Storage.clear()` | `Storage::clear()` |

Les fonctions Rust sont synchrones, car les entrées sont en mémoire : appelez-les là où s'exécutent les composants (leurs corps, handlers et tâches).

Chaque app dispose de son propre stockage, jusqu'à 5 Mo de clés et de valeurs. Les appels s'exécutent dans l'ordre où l'app les fait, de sorte qu'un `getItem` après un `setItem` voit la nouvelle valeur sans attendre l'écriture. Les lectures viennent de la mémoire ; les écritures atteignent le disque en arrière-plan, quelques-unes à la fois.

| Plateforme | Emplacement des données |
|---|---|
| iOS | `Library/Application Support/nsh/<app id>/storage.json` dans le conteneur de l'app |
| Android | `files/nsh/<app id>/storage.json` dans le répertoire privé de l'app |
| macOS | `~/Library/Application Support/<app id>/storage.json` |
| Windows | `%APPDATA%\<app id>\storage.json` |
| Linux | `$XDG_DATA_HOME/<app id>/storage.json` (`~/.local/share/…`) |
| Web | Le `localStorage` du navigateur, sous des clés nommées d'après l'identifiant de l'app (`nsh:com.example.todo:…`) |

Un `storage.json` endommagé est conservé sous le nom `storage.json.corrupt` à côté, et l'app démarre avec un stockage vide ; un fichier illisible laisse les modifications de l'app en mémoire, de sorte que le fichier n'est jamais remplacé.

L'identifiant de l'app est le `id` dans `nsh.json`, et il voyage avec l'app : `nsh build` et `nsh package` l'écrivent à côté du bundle, le serveur de développement l'envoie, et un paquet signé porte celui que le certificat de sa clé de release garantit. Ainsi chaque app garde ses propres données sans aucun réglage, où qu'elle s'exécute ; une app sans identifiant les garde sous `default`. Une app intégratrice peut choisir un autre emplacement (voir [Intégration sur iOS](../docs/ios.md) et [Intégration sur Android](../docs/android.md)).

### Storage.getItem

```ts
getItem(key: string): Promise<string | null>;
```

Se résout avec la valeur de `key`, ou avec `null` si elle n'en a pas. Rust : `Storage::get_item(key)`, `None` si elle n'en a pas.

```rust tabs
let theme = Storage::get_item("theme").unwrap_or_else(|| "system".into());
```

```tsx tabs
const theme = (await Storage.getItem("theme")) ?? "system";
```

### Storage.setItem

```ts
setItem(key: string, value: string): Promise<void>;
```

Définit `key` à `value`, en remplaçant ce qu'elle contenait. Rejette avec une `Error` dont `code` vaut `"ERR_NSH_QUOTA_EXCEEDED"` lorsque le stockage dépasserait 5 Mo ; la valeur n'est alors pas conservée. Rust : `Storage::set_item(key, value)`, qui renvoie alors `Err(StorageFull)`. Les valeurs sont des chaînes : conservez les données structurées en JSON (`serde_json::to_string` en Rust, `JSON.stringify` en TSX) et relisez-les (`serde_json::from_str`, `JSON.parse`).

```rust tabs
let draft = serde_json::json!({ "title": title.get(), "body": body.get() });
if let Err(full) = Storage::set_item("draft", draft.to_string()) {
    log::warn!("{full}");
}
```

```tsx tabs
Storage.setItem("draft", JSON.stringify({ title: title(), body: body() }));
```

### Storage.removeItem

```ts
removeItem(key: string): Promise<void>;
```

Supprime `key` et sa valeur. Supprimer une clé qui n'a pas de valeur ne fait rien. Rust : `Storage::remove_item(key)`.

### Storage.keys

```ts
keys(): Promise<string[]>;
```

Se résout avec toutes les clés, dans l'ordre. Rust : `Storage::get_all_keys()`.

### Storage.clear

```ts
clear(): Promise<void>;
```

Supprime toutes les clés de l'app, par exemple lorsque l'utilisateur se déconnecte. Rust : `Storage::clear()`.

<a id="keeping-a-signal-on-the-device"></a>

### Conserver un signal sur l'appareil

Lisez la valeur stockée au démarrage de l'app, puis réécrivez-la chaque fois que le signal change :

```rust tabs
use nsh_core::{storage::Storage, prelude::*};

#[component]
pub fn App() -> impl IntoElement {
    let saved = Storage::get_item("count").and_then(|n| n.parse().ok());
    let count = signal(saved.unwrap_or(0_u32));
    effect(move || {
        if let Err(full) = Storage::set_item("count", count.get().to_string()) {
            log::warn!("{full}");
        }
    });
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Pressed {} times", count.get())))
}
```

```tsx tabs
import { effect, mount, signal, Text, View } from "nsh";
import { Storage } from "nsh";

const count = signal(0);
const loaded = signal(false);
Storage.getItem("count").then((saved) => {
  count.set(Number(saved ?? 0));
  loaded.set(true);
});
effect(() => {
  if (loaded()) Storage.setItem("count", String(count()));
});

mount(() => (
  <View onPress={() => count.update((n) => n + 1)}>
    <Text>Pressed {count()} times</Text>
  </View>
));
```

## host

`host` atteint l'app qui intègre NSH : l'app native autour d'un `NshAppView` / `NshView`, ou, sur le web, la page qui exécute le player. L'app appelle les fonctions de l'hôte par leur nom avec des arguments JSON et écoute les événements que l'hôte envoie.

```ts
import { host } from "nsh";
```

```ts
const host: {
  readonly params: { readonly [key: string]: unknown };
  post(name: string, data?: unknown): void;
  available(): boolean;
  call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
  on(event: string, listener: (payload: unknown) => void): () => void;
};
```

### host.available

```ts
available(): boolean;
```

Indique si la plateforme a un hôte qui répond aux appels. Sur le web, la valeur est `true` lorsque la page fournit un hôte au player ([L'hôte sur le web](#the-host-on-the-web)).

```tsx
import { Text } from "nsh";
import { host } from "nsh";

<Text>{host.available() ? "Embedded" : "Standalone"}</Text>;
```

### host.call

```ts
call(name: string, args?: unknown, options?: { timeout?: number }): Promise<unknown>;
```

Appelle la fonction `name` de l'hôte avec `args` (n'importe quelle valeur JSON ; `null` s'il n'y en a pas) et se résout avec ce qu'elle renvoie. `host.call` ne lève jamais d'exception : chaque échec rejette la promesse, avec une `Error` dont `code` dit ce qui s'est passé (le message est destiné aux humains et peut changer) :

| `code` | Quand |
|---|---|
| `ERR_NSH_HOST_ERROR` | La fonction de l'hôte a échoué, ou l'hôte n'a pas de fonction `name` ; le message est celui de l'hôte |
| `ERR_ACCESS_DENIED` | `name` ne figure pas dans la [capacité `host`](#capability) de l'app ; `permission` vaut `"host"`, `resource` le nom |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | La plateforme n'a pas d'hôte : `host.available()` vaut `false` |
| `ETIMEDOUT` | L'hôte n'a pas répondu à temps |
| `ERR_NSH_QUOTA_EXCEEDED` | 1024 appels attendent déjà les réponses de l'app intégratrice |

Un nom invalide (de 1 à 128 caractères parmi `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:`, `-`, sans `..`) rejette avec une `TypeError`.

Un appel attend 30 secondes la réponse de l'hôte, puis rejette avec `ETIMEDOUT` ; une réponse qui arrive plus tard est ignorée. `options.timeout` fixe l'attente en millisecondes, `0` pour aucune limite ; un délai si grand que l'horloge n'y parvient jamais (environ 1e22 ms) attend aussi sans limite, et un délai négatif, `NaN` ou infini rejette l'appel avec une `RangeError`. Le temps est celui de l'app, comme celui de ses minuteurs : dans `nsh test` avec une horloge manuelle, il avance avec l'horloge.

```ts
const user = (await host.call("getUserInfo")) as { name: string };
const quote = await host.call("quote.refresh", { symbol: "AAPL" }, { timeout: 5000 }).catch((error) => {
  if (error.code === "ETIMEDOUT" || error.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") return null;
  throw error;
});
```

### host.on

```ts
on(event: string, listener: (payload: unknown) => void): () => void;
```

Les événements de la plateforme appellent `listener` avec la charge utile de chaque `event` que l'hôte envoie, jusqu'à ce que la fonction renvoyée par `host.on` soit appelée ; un écouteur ajouté pendant le rendu d'un composant s'arrête avec le composant. Les événements que l'hôte envoie avant le démarrage de l'app arrivent dès qu'elle démarre, de sorte que les écouteurs enregistrés au niveau supérieur de l'app les reçoivent ; un événement envoyé avant l'enregistrement d'un écouteur ne lui est pas rejoué. Lisez l'état avec lequel l'app démarre via `host.call`, et suivez ses changements avec `host.on`.

```ts
const stop = host.on("loginChanged", (payload) => console.log(payload));
// later
stop();
```
<a id="capability"></a>

### Capacité

Chaque fonction que l'app appelle doit figurer dans le champ `capabilities.host` de `nsh.json` : noms exacts ou préfixes se terminant par `*`, ou `true` pour toutes. Cela vaut pour toute app, même celle sans autre `capabilities` : les fonctions de l'hôte ne sont jamais accordées par défaut. Un appel non accordé est rejeté avec `ERR_ACCESS_DENIED` et est journalisé, un `host.post` d'un tel nom vers une app d'intégration lève la même erreur, et la compilation d'une app qui importe `host` depuis `nsh` sans `capabilities.host` émet un avertissement. Les événements n'ont pas besoin d'autorisation. Voir [Bac à sable et capacités](../docs/sandbox-and-capabilities.md#host).

```json
{ "capabilities": { "host": ["getUserInfo", "bridge.*"] } }
```

<a id="the-host-on-the-web"></a>

### L'hôte sur le web

Sur le web, la page est l'hôte. L'option `host` de `createPlayer` répond aux appels, et `player.hostEvent(event, payload)` envoie des événements :

```js
const player = await createPlayer(container, {
  wasm: "./nsh.wasm",
  host: { call: (name, args) => (name === "getUserInfo" ? { name: "Ada" } : Promise.reject(new Error(name))) },
});
player.hostEvent("loginChanged", { signedIn: true });
```

Une app publiée nomme son hôte dans `nsh.json` : `web.host` est un module JS du répertoire de l'app, relatif à `nsh.json`, qui exporte `createHost(player)`, lequel renvoie l'objet avec `call`. `nsh package --target web` l'embarque avec le site, `nsh run --target web` l'exécute sur la page de développement, et `nsh test` l'exécute pour les apps que ses tests ouvrent. `web.connect` liste les hôtes que les requêtes propres à l'hôte atteignent, que la Content-Security-Policy de la page autorise en plus du `capabilities.network` de l'app. Voir [Web](../docs/web.md#the-hosts-functions).

```json
{ "web": { "host": "./host.js", "connect": ["api.example.com"] } }
```

### host.params

Les paramètres que l'app d'intégration a définis avant de démarrer votre app, lus de façon synchrone dès la première ligne de votre code ; `{}` quand elle n'en a défini aucun. Ils restent identiques tant que votre app s'exécute : les demandes ultérieures arrivent sous forme d'événements.

```tsx
const conversation = host.params.conversation as string | undefined;
mount(() => (conversation ? <Conversation id={conversation} /> : <Inbox />));
```


<a id="native-sdk-channel"></a>

### Canal Native SDK

Le `send` du Native SDK conserve les événements jusqu'à ce que l'app écoute, jusqu'à 256. Quand le dernier écouteur s'arrête pendant la livraison, les événements restants continuent d'attendre dans l'ordre ; les événements envoyés pendant l'arrêt attendent la prochaine app chargée. `host.post(name, data)` livre les données au gestionnaire du Native SDK, dont `isPost` distingue les posts des appels.

<a id="the-embedding-apps-side"></a>

### Côté de l'app d'intégration

Chaque vue conserve un canal pour toutes les apps qu'elle charge. Définissez les paramètres avant le chargement, envoyez des événements à tout moment depuis n'importe quel thread, et enregistrez les gestionnaires par nom. Les appels et les posts exigent l'autorisation `capabilities.host` de l'app. Les gestionnaires répondent une seule fois, tout de suite ou plus tard ; une réponse qui n'arrive jamais fait échouer l'appel.

```rust tabs
// Any platform's AppView (GPUI, macOS, Windows, Linux, iOS): its HostChannel.
use serde_json::json;

let host = view.host();
let mut params = serde_json::Map::new();
params.insert("conversation".into(), json!("42"));
host.set_params(params);
// Runs on the engine thread: answer at once, or move the call and answer later from any thread.
host.handle("user.profile", |call| {
    let id = call.data()["id"].clone();
    call.resolve(json!({ "id": id, "name": "Ada" }));
});
host.send("conversation.open", json!({ "id": "43" })).unwrap();
```

```swift tabs
appView.params = ["conversation": "42"]
try appView.loadBundle(at: bundleURL)

// On the main thread; return the answer, or throw to reject the call.
appView.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"]
    return ["id": id ?? NSNull(), "name": try await profiles.name(of: id)]
}
appView.handle("analytics") { data, _ in analytics.log(data) }
appView.send("conversation.open", ["id": "43"])
```

```java tabs
nsh.setParams(Map.of("conversation", "42"));
nsh.loadAssetBundle("nsh");

// On the UI thread; answer now or later, from any thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    profiles.load(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});
nsh.send("conversation.open", Map.of("id", "43"));
```

Voir [Intégration sur iOS](../docs/ios.md#talking-to-the-app), [Intégration sur Android](../docs/android.md#talking-to-the-app) et [GPUI](../docs/gpui.md).

> [!NOTE]
> Les appels et les posts du Native SDK utilisent la même [capacité `host`](../docs/sandbox-and-capabilities.md#host) que les appels de plateforme. Une app Rust atteint directement le Rust de l'app d'intégration, via les fonctions qu'elle enregistre ([`nativeModule`](#nativemodule) et imports Rust).

## keymap

Le keymap lie les raccourcis clavier de l'app : une frappe comme `"mod+k"` et la fonction qu'elle exécute. Le code Rust appelle `on_key`, `on_key_with` et `key_label` depuis `nsh_core::prelude` ; TSX importe `keymap` depuis `nsh`. Les deux acceptent les mêmes frappes et suivent les mêmes règles.

```rust tabs
use nsh_core::prelude::*; // on_key, on_key_with, KeyOptions, key_label
```

```tsx tabs
import { keymap } from "nsh";
```

```ts
const keymap: {
  bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
  bind(bindings: Record<string, (e: { keystroke: string }) => void>, options?: KeyBindingOptions): () => void;
  label(keystroke: string): string;
};

interface KeyBindingOptions {
  when?: "always" | "notEditing";
  repeat?: boolean;
}
```

| TS | Rust |
|---|---|
| `keymap.bind(keystroke, handler)` | `on_key(keystroke, handler)` |
| `keymap.bind(keystroke, handler, { when, repeat })` | `on_key_with(keystroke, KeyOptions { when, repeat }, handler)` ; `when` vaut `nsh_core::keymap::When` (`Auto`, `Always`, `NotEditing`) |
| `keymap.bind({ … })` | un `on_key` par frappe |
| `keymap.label(keystroke)` | `key_label(keystroke)` |

Une liaison Rust vit aussi longtemps que le composant (le propriétaire) qui l'a créée ; le gestionnaire reçoit la frappe telle qu'elle est écrite.

Les raccourcis fonctionnent sur macOS, Windows, Linux et dans les navigateurs (les touches propres au navigateur, comme Ctrl+T ou Cmd+W, n'atteignent jamais la page), ainsi que sur iOS et Android avec un clavier matériel : celui d'un iPad, d'un Mac qui exécute une app iPad, d'une tablette ou d'un Chromebook, du simulateur et de l'émulateur. Le même code s'exécute partout ; sans clavier, aucune touche ne déclenche les liaisons.

### keymap.bind

```ts
bind(keystroke: string, handler: (e: { keystroke: string }) => void, options?: KeyBindingOptions): () => void;
```

Exécute `handler` lorsque `keystroke` est pressé et renvoie une fonction qui supprime la liaison. Le gestionnaire reçoit `{ keystroke }` : la frappe telle que vous l'avez écrite, avec sa casse. Rust : `on_key(keystroke, handler)`, dont le gestionnaire reçoit la frappe elle-même.

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let open = signal(false);
    on_key("mod+k", move |_| open.set(true));
    on_key("escape", move |_| open.set(false));
    text(move || if open.get() { "Search…" } else { "Press ⌘K" })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(true));
keymap.bind("escape", () => open.set(false));

mount(() => <Text>{open() ? "Search…" : "Press ⌘K"}</Text>);
```

Passez un objet pour lier plusieurs frappes à la fois ; la fonction renvoyée les supprime toutes. En Rust, chaque frappe est un `on_key` :

```rust tabs
on_key("mod+s", move |_| save());
on_key("mod+shift+p", move |_| open_palette());
on_key("f5", move |_| refresh());
```

```tsx tabs
const unbind = keymap.bind({
  "mod+s": save,
  "mod+shift+p": openPalette,
  f5: refresh,
});
```

Une liaison créée pendant le rendu d'un composant est supprimée avec le composant, de sorte que les raccourcis d'un écran vivent aussi longtemps que l'écran :

```rust tabs
#[component]
fn Editor() -> impl IntoElement {
    on_key("mod+enter", move |_| send());
    input().multiline(true)
}
```

```tsx tabs
function Editor() {
  keymap.bind("mod+enter", send);
  return <Input multiline />;
}
```

Avec le serveur de développement, modifier un module supprime les liaisons créées par son code de niveau supérieur avant qu'il ne soit réexécuté, si bien que le rechargement à chaud ne laisse jamais de raccourcis obsolètes.

### keymap.label

```ts
label(keystroke: string): string;
```

Renvoie `keystroke` tel que les menus et les indications l'affichent là où l'app s'exécute : `"⇧⌘L"` sur macOS et iOS (et dans un navigateur sur Mac, iPhone ou iPad), `"Ctrl+Shift+L"` sur Windows, Linux et les autres navigateurs, pour `"mod+shift+l"`. Rust : `key_label(keystroke)`. Utilisez-le pour afficher les raccourcis d'une app avec les touches qui fonctionnent :

```rust tabs
text(format!("Search {}", key_label("mod+k")))
```

```tsx tabs
<Text>Search {keymap.label("mod+k")}</Text>
```

Elle lève `TypeError` pour une frappe invalide, comme `bind` ; `key_label` et `on_key` paniquent avec le même message.

<a id="keystrokes"></a>

### Frappes

Une frappe se compose de modificateurs et d'une touche joints par `+` : `"mod+k"`, `"ctrl+shift+p"`, `"alt+enter"`, `"escape"`, `"f5"`, `"cmd+-"` (Command et moins).

| Modificateur | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (aussi `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (aussi `command`, `meta`, `super`, `win`) | Command (⌘) | touche Windows | Super |
| `ctrl` (aussi `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (aussi `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

iOS suit macOS (`mod` correspond à Command) et Android suit Windows et Linux (`mod` correspond à Ctrl, `cmd` à la touche Meta). Dans un navigateur, les touches suivent la plateforme sur laquelle le navigateur s'exécute : `mod` correspond à Command sur un Mac, un iPhone ou un iPad, et à Ctrl ailleurs.

Utilisez `mod` pour les raccourcis propres à une app : c'est la touche que les apps de chaque plateforme emploient pour cela (⌘K sur macOS, Ctrl+K sur Windows et Linux), donc une seule graphie convient partout. La touche Windows et Super appartiennent surtout au système, donc `cmd` est rarement un bon choix en dehors de macOS.

La touche est une lettre, un chiffre ou un signe de ponctuation, écrit comme le caractère qu'il produit sur un clavier US sans Shift (`k`, `1`, `,`, `/`, `[` ; `"shift+/"` pour `?`, `"shift+k"` pour Shift+K), ou un nom : `plus` (la touche `=` / `+`, aussi écrite `=`), `minus` (aussi `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, les flèches `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1` à `f24`. La casse n'a pas d'importance : `"Mod+Shift+K"` équivaut à `"mod+shift+k"`, et une lettre majuscule est la même touche, pas Shift (`"mod+K"` équivaut à `"mod+k"`). Les minuscules sont le style recommandé, celui que ces pages utilisent. `"mod-k"` et `"mod++"` sont des erreurs dont les messages donnent la bonne graphie. Les raccourcis de menu dans `nsh/desktop` acceptent les mêmes frappes.

Les raccourcis fonctionnent avec n'importe quelle disposition de clavier : sur une disposition cyrillique ou grecque, `mod+k` est la touche qui tape K sur une disposition US, comme pour les raccourcis de menu.

`bind` lève `TypeError` qui indique ce qui ne va pas dans une frappe invalide (`keymap.bind: invalid keystroke "cmd+kk": unknown key "kk"`), et refuse les frappes que le système se réserve, afin qu'une app ne puisse jamais les neutraliser :

| Plateforme | Réservé |
|---|---|
| macOS, iOS | Cmd+Q (quitter), Cmd+H (masquer), Option+Cmd+H (masquer les autres), Cmd+M (réduire), Ctrl+Cmd+F (plein écran) |
| Linux, Windows, Android | Ctrl+Q (quitter), Alt+F4 (fermer), F11 (plein écran) |
| Web | Aucune (le navigateur garde ses propres touches) |

<a id="while-typing"></a>

### Pendant la saisie

Un champ de saisie de texte qui a le focus clavier a besoin de ses touches : saisie, déplacement du curseur, suppression, ainsi que tout sélectionner, couper, copier, coller, annuler et rétablir. Par défaut, une liaison ne se déclenche donc pas quand un champ de texte (ou une web view) a le focus si sa frappe en fait partie : les touches simples et les touches avec seulement Shift ou Option, les flèches, Home, End, Page Up / Down, Return, Tab, Escape, Backspace, Delete, et `mod+a`, `mod+c`, `mod+v`, `mod+x`, `mod+z`. Les autres frappes avec Command ou Control, et les touches de fonction, se déclenchent quel que soit le focus.

`when` modifie ce comportement (Rust : `KeyOptions { when: When::Always, .. }`) :

| `when` | Se déclenche |
|---|---|
| (par défaut) | Comme ci-dessus |
| `"always"` | Aussi dans les champs de texte, avant que le champ ne voie la touche |
| `"notEditing"` | Jamais pendant qu'un champ de texte a le focus |

```rust tabs
use nsh_core::keymap::When;

// Sends from the message field too.
on_key_with("mod+enter", KeyOptions { when: When::Always, ..KeyOptions::default() }, move |_| send());
// Only when the user is not typing.
on_key_with("mod+e", KeyOptions { when: When::NotEditing, ..KeyOptions::default() }, move |_| archive());
```

```tsx tabs
// Sends from the message field too.
keymap.bind("mod+enter", send, { when: "always" });
// Only when the user is not typing.
keymap.bind("mod+e", archive, { when: "notEditing" });
```

Sur iOS et Android, une touche avec laquelle une méthode de saisie compose (choix d'un candidat, validation) reste à la méthode de saisie. Sur le backend GPUI, un composant natif qui a le focus clavier compte comme un champ de texte, puisque ce peut être un éditeur de texte. Il voit chaque touche en premier : une touche qu'il gère lui-même n'atteint jamais les liaisons, et les liaisons qui se déclenchent pendant l'édition du texte reçoivent les touches qu'il laisse passer.

<a id="which-binding-runs"></a>

### Quelle liaison s'exécute

Une touche qui déclenche une liaison est consommée : elle n'est pas saisie, le système n'émet pas de bip, et les touches propres à NSH ne la voient pas (Escape pour revenir en arrière, Tab pour déplacer le focus, les flèches pour faire défiler). Quand plusieurs liaisons ont la même frappe, la plus récente qui peut se déclencher s'exécute, de sorte qu'une boîte de dialogue peut lier Escape par-dessus la liaison de l'écran, et celle de l'écran revient quand celle de la boîte de dialogue disparaît. Les liaisons sont vérifiées nativement à l'instant où la touche est pressée ; le gestionnaire s'exécute juste après, sur le thread du moteur (Rust) ou le thread JS (TSX).

Maintenir une touche enfoncée déclenche sa liaison une seule fois, jusqu'à ce que la touche soit relâchée ; avec `repeat: true`, elle se redéclenche à chaque répétition automatique (pour parcourir une liste, par exemple) :

```rust tabs
on_key_with("alt+down", KeyOptions { repeat: true, ..KeyOptions::default() }, move |_| next_item());
```

```tsx tabs
keymap.bind("alt+down", nextItem, { repeat: true });
```

Les raccourcis de menu cèdent la place à une liaison de même frappe : ceux du menu de l'application ([`nsh/desktop`](./nsh-desktop)) sur tous les ordinateurs de bureau, et sur macOS ceux des menus intégrés également (Cmd+W, Cmd+C, ...). Pendant que vous développez avec `nsh run`, Cmd+R / Ctrl+R recharge toujours l'app, même si elle lie `mod+r` ; une app empaquetée peut la lier.

<a id="nativecomponent-and-nativemodule"></a>

## nativeComponent et nativeModule

`nativeComponent` et `nativeModule` connectent votre app à ce que l'app hôte fournit, par nom, à l'exécution. Une app iOS ou Android qui embarque NSH peut enregistrer ses propres vues (une carte, un graphique, un aperçu de caméra) par nom ; `nativeComponent` vous donne un composant typé pour l'une d'elles. Comme NSH effectue le rendu avec de vraies vues natives, un tel composant se place dans la hiérarchie de vues comme n'importe quelle autre vue : il est mis en page par NSH, il est rogné et défile avec ses parents, et il se superpose correctement. Une app qui embarque NSH depuis Rust peut aussi enregistrer des fonctions, des classes et des composants Rust ; `nativeModule` vous les donne sous la forme d'un seul objet typé. Dans les deux cas, votre app se compile avec le `nsh build` standard : l'hôte connecte ce qu'il fournit quand il exécute l'app. Le code Rust place une vue enregistrée avec `native(name)` depuis `nsh_core::prelude`, définit ses props avec `.prop(name, value)` (une valeur JSON, ou un signal ou une closure qui en produit une) ou en lie une à une valeur animée avec `.bind_prop(name, &value)`, écoute ses événements avec `.on_native_event(…)` et appelle ses commandes via un `ElementRef` ; TSX importe `nsh`.

```rust tabs
use nsh_core::prelude::*; // native, NativeEvent, element_ref
```

```tsx tabs
import { nativeComponent, nativeModule } from "nsh";
```

Voir [Composants natifs](../docs/native-components.md) pour l'enregistrement du côté natif, et [Intégration sur iOS](../docs/ios.md) / [Intégration sur Android](../docs/android.md).

### nativeComponent

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;

interface NativeComponentSpec<P, E> {
  /** Its own props: sent to the component (any JSON value), each when it changes. */
  props: readonly (keyof P & string)[];
  /** The events it emits. */
  events?: readonly (keyof E & string)[];
}
```

Renvoie un composant pour le composant natif que l'app d'intégration a enregistré sous `name` (Swift `NshAppView.register(component:)`, Java `NshView.registerComponent`). Rust : `native(name)`, une vue dont les props sont des valeurs JSON (`.prop("text", json!(…))`) et dont les événements arrivent sous forme de `NativeEvent { name, data }`.

- `P` est le type de ses propres props. Chaque prop listée dans `spec.props` est envoyée au côté natif en JSON quand elle change ; la définir à `undefined` la supprime.
- `E` associe les noms d'événements à leurs charges utiles. Un événement `regionChange` devient la prop de gestionnaire `onRegionChange`.
- Le composant accepte aussi toutes les [props de vue](../elements/view.md) sauf `children` : `style`, `class`, la mise en page, l'accessibilité, les gestionnaires tactiles et `ref`.

```ts
type NativeComponentProps<P, E> = Omit<ViewProps, "children"> & P & NativeEventHandlers<E>;
type NativeEventHandlers<E> = { [K in keyof E & string as `on${Capitalize<K>}`]?: (data: E[K]) => void };
```

<a id="size"></a>

#### Taille

Le composant est mis en page comme une vue, à la taille que lui donne son style. Quand le style laisse une dimension ouverte, il utilise la taille que le composant natif signale (comme une image utilise sa taille naturelle).

<a id="commands"></a>

#### Commandes

Son `ref` reçoit un `NativeComponentRef` ; `ref.command(name, args)` appelle la commande `name` du composant natif avec `args` (n'importe quelle valeur JSON). Rust : `ElementRef::command(name, args)`.

```rust tabs
map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
map.command("zoomTo", { level: 3 });
```

<a id="when-nothing-is-registered"></a>

#### Quand rien n'est enregistré

Quand rien n'est enregistré sous `name` (une autre app hôte, l'hôte de développement, le navigateur), le composant affiche une vue vide et un avertissement est journalisé une seule fois. Gardez l'app utilisable sans lui, ou vérifiez votre hôte avant de l'utiliser.

<a id="example"></a>

### Exemple

Le badge ici est une vue native de l'app hôte, enregistrée sous `embed.badge`. NSH la met en page, lui envoie `text` et `color`, reçoit ses événements `tap`, et appelle sa commande `pulse` :

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p_5()
        .gap_4()
        .child(
            native("embed.badge")
                .prop("text", json!("Tap the native badge"))
                .prop("color", json!("#8250df"))
                .element_ref(&badge)
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Tapped {}×", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, View } from "nsh";
import { nativeComponent } from "nsh";

const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", gap: 16 }}>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color="#8250df"
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
    </View>
  );
}

mount(App);
```
### nativeModule

```ts
function nativeModule<T extends object>(specifier: string): T;
```

Renvoie, sous la forme d'un seul objet, les exports de l'ensemble que l'app hôte a enregistré sous `specifier` : ses modules, classes, fonctions et composants Rust. L'app écrit elle-même le type `T`, donc rien concernant l'hôte n'est nécessaire à sa compilation. Le code Rust compilé avec la crate de l'hôte appelle ces fonctions comme du Rust ; `nativeModule` est le moyen par lequel TSX y accède.

```ts
import { nativeModule, signal } from "nsh";

interface TradingApi {
  quote(symbol: string): number;
  placeOrder(symbol: string, quantity: number, side: "Buy" | "Sell"): Promise<Order>;
  on(event: "change", listener: (desk: Desk) => void): () => void;
}

const { Trading } = nativeModule<{ Trading: TradingApi }>("host/trading");

const price = Trading.quote("AAPL");

const desk = signal<Desk | null>(null);
Trading.on("change", (d) => desk.set(d));
```

- Les appels fonctionnent comme avec l'import d'un ensemble : une fonction Rust simple renvoie sa valeur immédiatement, une fonction `async` renvoie une promesse, et une fonction que vous passez est un callback que Rust peut appeler plus tard. Rust vérifie chaque argument et lève une `TypeError` en cas d'argument invalide.
- Chaque appel avec le même `specifier` renvoie le même objet.
- Si rien n'est enregistré sous `specifier`, `nativeModule` lève une `ReferenceError` qui le nomme. Appelez-la à un endroit où l'app peut gérer ce cas, ou uniquement dans l'hôte pour lequel elle est conçue.

L'hôte enregistre l'ensemble depuis Rust, avec le `set_ui_sets` de la crate de la plateforme (à côté des ensembles propres à NSH) avant de démarrer ses vues, ou avec `EngineConfig::ui_sets` :

```rust
use std::{cell::RefCell, rc::Rc};

use nsh_core::prelude::*;

pub struct Trading;

#[module]
impl Trading {
    /// A sample price.
    pub fn quote(symbol: String) -> Result<f64, String> { /* ... */ }

    /// Calls `listener` with the desk now and after every change
    /// (`change`, the one event), until the returned function is called
    /// or what called `on` goes.
    pub fn on(event: String, listener: Callback<Desk>, cx: CallCx<'_>) -> Result<Stop, String> {
        if event != "change" {
            return Err(format!("no Trading event `{event}`"));
        }
        let listener = Rc::new(RefCell::new(Some(listener)));
        let held = listener.clone();
        cx.start(async move {
            let mut desk = DESK.subscribe(); // a tokio watch channel the host keeps
            loop {
                let Some(listener) = held.borrow().clone() else { return };
                listener.post(desk.borrow_and_update().clone());
                if desk.changed().await.is_err() {
                    return;
                }
            }
        });
        Ok(Stop::new(move || drop(listener.take())))
    }
}

let mut trading = Registry::ui_set("host/trading");
trading.module::<Trading>();
nsh_platform_gpui::set_ui_sets(vec![nsh_base::registry(), trading]);
```

`on` permet à l'hôte de garder chaque app synchronisée avec ses propres données : la tâche qu'il démarre attend les changements de l'hôte et envoie chacun d'eux à l'app, de sorte qu'un changement effectué par l'hôte, ou par n'importe quelle app via une autre fonction, atteint toutes les apps qui écoutent. Le `Stop` qu'elle renvoie est la fonction que `Trading.on` renvoie en TSX : elle s'exécute une seule fois, quand l'app l'appelle ou quand ce qui a appelé `on` disparaît (un composant, ou l'exécution du module lors d'un hot reload), et ici elle supprime l'écouteur, ce qui met fin à la tâche.

> [!NOTE]
> Les props, les événements et les arguments de commande passent du côté natif en JSON. Les composants et fonctions enregistrés sont le code propre de l'app hôte : les [limites et capacités du sandbox](../docs/sandbox-and-capabilities.md) de NSH ne s'appliquent pas à ce qu'ils font.

<a id="accessibility"></a>

## Accessibilité

L'API d'accessibilité lit les réglages d'accessibilité de l'utilisateur (un lecteur d'écran est-il actif, a-t-il demandé moins de mouvement) et communique avec le lecteur d'écran. Le code Rust appelle `screen_reader()`, `reduce_motion()` et `announce_for_accessibility()` depuis `nsh_core::prelude` et déplace le focus avec un `ElementRef` ; TSX importe `screenReaderEnabled()`, `reduceMotion()`, `announce()` et `setAccessibilityFocus()` depuis `nsh`. Les réglages sont réactifs : lisez-les dans un binding, `computed` ou `effect`, et ce qui les lit se met à jour quand l'utilisateur les modifie. Les props d'accessibilité des éléments (`accessibilityLabel`, `role`, ...) sont documentées dans [Éléments](../elements/index.md) ; le guide est [Accessibilité](../docs/accessibility.md).

```rust tabs
use nsh_core::prelude::*; // screen_reader, reduce_motion, announce_for_accessibility, element_ref
```

```tsx tabs
import { announce, reduceMotion, screenReaderEnabled, setAccessibilityFocus } from "nsh";
```

### screenReaderEnabled

```ts
const screenReaderEnabled: Accessor<boolean>;
```

Indique si un lecteur d'écran (VoiceOver, TalkBack) est actif. Réactif : ce qui le lit se met à jour quand l'utilisateur active ou désactive le lecteur d'écran. Rust : `screen_reader() -> bool`, réactif de la même manière.

```rust tabs
when(move || !screen_reader(), || text("Swipe for the next photo"))
    .otherwise(move || text("Next photo").on_press(next))
```

```tsx tabs
<If when={!screenReaderEnabled()} else={<Text onPress={next}>Next photo</Text>}>
  <Text>Swipe for the next photo</Text>
</If>
```

### reduceMotion

```ts
const reduceMotion: Accessor<boolean>;
```

Indique si l'utilisateur a demandé moins de mouvement (Reduce Motion sur iOS, Remove animations sur Android). Réactif. Rust : `reduce_motion() -> bool`. Les classes Tailwind le suivent aussi grâce à la variante `motion-reduce:`.

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        let _ = panel.spring(0.0, Spring::default());
    }
};
```

```tsx tabs
const open = () => {
  if (reduceMotion()) panel.set(0);
  else panel.spring(0);
};
```

### announce

```ts
function announce(message: string): void;
```

Le lecteur d'écran lit `message` (une annonce VoiceOver, TalkBack). Utilisez-la pour les résultats qui apparaissent sans déplacement du focus, comme « Enregistré ». Rust : `announce_for_accessibility(message)`.

### setAccessibilityFocus

```ts
function setAccessibilityFocus(node: ViewRef): void;
```

Déplace le focus du lecteur d'écran vers `node` (le `ref` d'un élément). Rust : `ElementRef::set_accessibility_focus()`.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Saved() -> impl IntoElement {
    let note = element_ref();
    let save = move || {
        announce_for_accessibility("Saved");
        note.set_accessibility_focus();
    };
    // Runs again when the setting changes, until the component goes.
    effect(|| log::info!("screen reader {}", screen_reader()));
    view()
        .gap_2()
        .child(text("Save").role(AccessibilityRole::Button).on_press(save))
        .child(text("Your changes are kept on this device.").element_ref(&note))
}
```

```tsx tabs
import { effect, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Saved() {
  let note!: ViewRef;
  const save = () => {
    announce("Saved");
    setAccessibilityFocus(note);
  };
  // Runs again when the setting changes, until the component goes.
  effect(() => console.log("screen reader", screenReaderEnabled()));
  return (
    <View style={{ gap: 8 }}>
      <Text onPress={save} role="button">Save</Text>
      <Text ref={note}>Your changes are kept on this device.</Text>
    </View>
  );
}
```

## Types

`nsh` exporte aussi les types de l'API réactive et des éléments hôtes. Les plus utilisés :

| Type | Description |
|---|---|
| `Accessor<T>` | Une valeur lisible : `() => T` |
| `Signal<T>` | Un `Accessor<T>` avec `set` et `update` |
| `SignalOptions<T>` | Options de `signal` et `computed` (`equals`) |
| `Context<T>` | Ce que renvoie `context` |
| `Component<P>` | `(props: P) => JSX.Element` |
| `JSX` | Le namespace JSX (`JSX.Element`) |
| `ViewRef`, `InputRef`, `ScrollRef`, `ListRef`, `WebViewRef`, `VideoRef`, `NativeComponentRef` | Ce que reçoit un `ref`, le type propre à chaque élément (`ViewRef` et les types qui s'appuient dessus) : focus, défilement et autres commandes. `ViewRef` est aussi ce qu'est un élément (`JSX.Element`). Voir les [méthodes de ref](../elements/index.md#ref-methods) |
| `ViewProps`, `TextProps`, `ImageProps`, `ScrollProps`, `CommonProps`, `TouchProps` | Props des éléments hôtes |
| `ViewStyle`, `TextStyle`, `InputStyle`, `ImageStyle`, `LayoutStyle`, `StyleProp<T>` | Objets de style ; voir la [référence des styles](./style-reference.md) |
| `ColorValue`, `DimensionValue`, `LengthValue`, `TransformStep` | Valeurs à l'intérieur des styles |
| `GestureResponderEvent`, `MouseEvent`, `MouseButton`, `ContextMenuEvent`, `PressEvent`, `ScrollEvent`, `PanEvent`, `TouchPoint` | Payloads d'événements |
| `Point`, `Size`, `Bounds`, `Edges`, `Modifiers` | Les formes dont sont faits les payloads et les props, avec les champs de GPUI (`nsh_core::geometry`) |
| `PixelSize` | La taille propre d'une image ou d'une vidéo en pixels (`onLoad`, `Image.getSize`, les images du presse-papiers et du sélecteur), alors que `Size` est en points |
| `ImageAsset` | Ce que donne l'import d'un fichier image (`{ url, size: Size, scales? }` ; `scales` liste ses [variantes de densité de pixels](../docs/images-and-assets.md#pixel-densities)) |
| `OS` | `"ios" \| "android" \| "macos" \| "windows" \| "linux" \| "web"` |
| `AccessibilityRole`, `AccessibilityState` | Props d'accessibilité |

```tsx
import { type GestureResponderEvent, type InputRef, signal } from "nsh";

let field: InputRef | undefined;
const onPress = (e: GestureResponderEvent) => field?.focus();
```

`StyleProp<T>` accepte un style ou une liste fusionnée de gauche à droite, en ignorant les entrées falsy :

```tsx
<View style={[styles.card, selected() && styles.selected]} />
```
