---
title: "Défilement"
description: "Vues de défilement en Rust et TSX - pagination et ancrage, zoom, tirer pour actualiser, événements de défilement, effets liés au défilement avec scrollValue, le clavier dans les vues de défilement, et défilement depuis le code."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# Défilement

La vue défilante (`scroll()` en Rust, `<Scroll>` en TSX) est la vue défilante propre à la plateforme (UIScrollView sur iOS, un ScrollView sur Android) : les lancers, les rebonds, l'indicateur de défilement et le pull to refresh sont natifs, tout comme l'accrochage. Votre code est informé du défilement par des événements et peut lier le décalage à une [valeur animée](./animation.md#animated-values) pour des effets qui suivent le doigt image par image.

Utilisez une vue défilante pour un contenu de taille connue et modérée : une page de réglages, un formulaire, un article, une rangée de puces. Pour des données longues ou non bornées, utilisez une [liste](./lists.md), qui recycle les lignes et accepte les mêmes props de défilement.

<a id="a-scroll-view"></a>

## Une vue défilante

Une vue défilante est la zone d'affichage ; ses enfants forment le contenu. La zone d'affichage reçoit sa taille de son parent (généralement `flex: 1`, `.flex_1()`), et le contenu est disposé à la largeur de la zone d'affichage (vertical) ou à sa hauteur (horizontal), et aussi long que nécessaire.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

La vue enfant ci-dessus est le conteneur de contenu de la vue défilante ; en TSX, `contentStyle` (ou `contentClass`) en crée un pour vous, en enveloppant les enfants dans une vue avec ce style, qui défile avec eux. `flexGrow: 1` (`.flex_grow(1.0)`) rend le contenu au moins aussi haut que la zone d'affichage, de sorte qu'un contenu court peut être centré et qu'un contenu long défile toujours :

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

Une vue défilante horizontale prend `horizontal` (`.horizontal()`) et une rangée comme enfant :

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

En écriture de droite à gauche (voir [Appareil et environnement](./device-and-environment.md#right-to-left)), une vue défilante horizontale démarre à son extrémité droite et conserve sa distance par rapport à celle-ci.

Les doigts font défiler les vues défilantes. Sur le bureau (macOS, Windows, Linux) et dans le navigateur, la souris défile comme dans les applications de bureau : avec sa molette (Maj + molette défile horizontalement), le pavé tactile, le clavier et l'indicateur de défilement, qui s'affiche quand la souris survole la vue et se manipule comme une barre de défilement ; les glissements de souris sont réservés aux pans, aux responders et à la sélection de texte de l'application. Les écrans tactiles des ordinateurs de bureau font défiler les vues défilantes comme le font les doigts. Les vues horizontales y conservent leur indicateur même avec `scrollbar={false}`, car c'est ainsi qu'une souris sans molette horizontale les déplace.

<a id="behavior-props"></a>

### Props de comportement

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Défile horizontalement. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utilisateur peut le faire défiler. Le défilement depuis le code fonctionne toujours. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Défilement élastique au-delà des bords. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | L'indicateur de défilement s'affiche. Sur le bureau et dans les navigateurs de bureau, une vue horizontale le conserve : c'est la barre de défilement de la souris. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espace autour du contenu, dans lequel on peut défiler. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Position de départ. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | celle de la plateforme | La vitesse à laquelle un lancer ralentit : `"normal"`, `"fast"`, ou la vitesse conservée par milliseconde (`0.998` est normal, `0.99` rapide ; `0` est la valeur par défaut de la plateforme). |

<a id="paging-and-snapping"></a>

## Pagination et accrochage

L'accrochage est décidé nativement au moment où le doigt se lève, à partir du décalage au relâchement, du glissement projeté et de la vitesse ; la vue défilante glisse ensuite vers l'arrêt choisi, sans aucune intervention de votre code.

| Prop | Rust | Type | Description |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | S'arrête aux multiples de la taille de la zone d'affichage. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | S'arrête aux multiples de cette longueur (0 : désactivé). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | S'arrête à ces décalages. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | Avec `snapToInterval` : quel point d'un élément s'aligne avec la zone d'affichage. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | Un lancer avance d'un arrêt au maximum. |

Un pager : des pages aussi larges que la vue défilante, et un indicateur mis à jour à la fin du glissement.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

Un carrousel de cartes qui s'accrochent au centre, une carte par lancer :

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

Les listes acceptent les mêmes props d'accrochage, ce qui en fait le meilleur choix pour un long carrousel.

<a id="scroll-events"></a>

## Événements de défilement

| Prop | Rust | Payload | Quand |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | Le décalage a changé. Au plus une fois par image ; `scrollEventThrottle` espace davantage les événements. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | Nombre minimal de millisecondes entre les événements `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | L'utilisateur a commencé à faire glisser. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | L'utilisateur a levé le doigt. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | Le glissement consécutif à un lancer a commencé. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | Le glissement est terminé (y compris lorsqu'un nouveau geste le rattrape). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | Un défilement de l'utilisateur s'est immobilisé : après le glissement, ou à la fin d'un geste sans glissement. |

`ScrollEvent` contient le décalage (`offset`, un `Point` ; identique en Rust), la taille du contenu, zoom inclus (`contentSize`, un `Size` ; `content_size`), la zone d'affichage (`size`) et `zoomScale` (`zoom_scale`). Les autres événements contiennent le décalage : `{ offset }` avec un `Point` en TSX, un `Point<Points>` en Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` exécute votre code à chaque image d'un défilement (sous réserve de la limitation de fréquence). Pour un effet qui doit seulement *paraître* lié au défilement, comme un en-tête qui s'estompe ou une image en parallaxe, utilisez plutôt [`scrollValue`](#scroll-linked-effects-scrollvalue) : il s'exécute entièrement en natif.

<a id="scroll-linked-effects-scrollvalue"></a>

## Effets liés au défilement : scrollValue

`scrollValue` (`.scroll_value(&value)`) prend une [valeur animée](./animation.md#animated-values) et y écrit nativement le décalage de défilement (selon l'axe principal), dans la même image que celle où le contenu se déplace. Liez cette valeur, ou des nœuds qui en dérivent avec `interpolate`, `diffClamp` (`diff_clamp`) ou de l'arithmétique, à des styles.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

Un en-tête qui disparaît en glissant quand le contenu défile vers le haut et revient dès qu'il défile vers le bas est `diffClamp` du décalage :

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

Par défaut, les interpolations sont bornées en dehors de leur plage d'entrée : tirer au-delà du haut (décalage négatif) maintient donc l'effet à sa valeur finale ; passez `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` en Rust) pour un en-tête extensible qui grandit à mesure que vous tirez.

## Pull to refresh

`refreshing` et `onRefresh` (`.refreshing(..)` et `.on_refresh(..)`) ajoutent le contrôle de pull-to-refresh de la plateforme. Le contrôle s'affiche tant que `refreshing` vaut true ; activez-le dans `onRefresh` et désactivez-le une fois le travail terminé.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

Sur iOS, le contrôle est UIRefreshControl ; dans l'idiome Mac de Mac Catalyst, NSH affiche son propre spinner avec le même comportement. Les listes acceptent les mêmes props. Sur le bureau et dans le navigateur, le geste de tirage est celui d'un écran tactile (ou d'un trackpad macOS, qui tire au-delà du haut), puisque la souris défile sans glisser ; proposez-y un autre moyen d'actualiser, tel qu'un bouton ou un raccourci clavier.

<a id="an-indicator-of-your-own"></a>

### Un indicateur personnalisé

L'apparence du tirage est au choix de l'application. `refreshIndicator={{ height }}` indique que l'application dessine son propre indicateur, `height` points de haut : le spinner de la plateforme est masqué, un tirage déclenche l'actualisation dès qu'il atteint `height`, et pendant l'actualisation `height` restent au-dessus du contenu pour l'indicateur. `pullValue` alimente une valeur animée avec la distance dont le contenu est tiré au-delà du haut : 0 au repos, croissante avec le tirage, et `height` pendant l'actualisation. Dessinez l'indicateur par-dessus le haut de la vue défilante et interpolez ses styles à partir de la valeur : ils suivent le doigt sur le thread UI, sans JS à chaque image.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

Gardez `height` dans la limite de la moitié de la zone d'affichage : au-delà du haut, le contenu résiste d'autant plus au doigt qu'il va loin, et une hauteur trop grande n'est jamais atteinte. Sur iOS, un indicateur propre à l'application remplace UIRefreshControl par le tirage que NSH détecte lui-même, comme dans l'idiome Mac.

<a id="zooming"></a>

## Zoom

Une vue défilante (les listes conservent une échelle de 1) zoome lorsque son échelle de zoom maximale est supérieure à son échelle minimale : le pincement met le contenu à l'échelle, et une fois zoomé, il défile dans les deux sens.

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Le zoom minimal. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Le zoom maximal ; au-dessus du minimum, le pincement zoome. |
| `zoomScale` | `.zoom(scale)` | `number` | | Zoome à cette échelle quand la prop change ; le zoom de l'utilisateur est conservé sinon. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Le pincement peut dépasser les limites, puis revient élastiquement. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | L'utilisateur peut pincer pour zoomer. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Un contenu plus petit que la zone d'affichage (dézoomé) est centré. |

L'événement de défilement indique l'échelle de zoom et la taille du contenu zoomé. Depuis le code, `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` zoome de sorte que le point du contenu (en points non zoomés) se retrouve au milieu de la zone d'affichage ; le double appui pour zoomer est un gestionnaire de pression qui l'appelle :

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

Le texte et les canvas à l'intérieur d'une vue défilante zoomée sont redessinés à la nouvelle résolution à la fin du zoom, et restent ainsi nets sur iOS. Sur Android, NSH zoome avec une vue défilante qui lui est propre : elle met à l'échelle autour du point focal du pincement, se déplace avec n'importe quel nombre de doigts, accepte les lancers et rebondit élastiquement aux bords et aux limites de zoom. Android déclenche un pincement une fois les doigts écartés d'environ 27 mm, comme le fait le détecteur de gestes du système.

<a id="scrolling-from-code"></a>

## Défiler depuis le code

Donnez une ref à la vue défilante (`element_ref()` et `.element_ref(&scroller)` en Rust, un [`ref`](./jsx-and-components.md) en TSX) et appelez ses méthodes. Les commandes s'exécutent après les autres changements de la même mise à jour, de sorte que défiler vers un contenu que vous venez d'ajouter fonctionne.

| Rust | TSX | Description |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Défile vers un décalage. Animé par défaut en TSX. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | Vues défilantes zoomables : zoome à `scale` (borné aux limites), autour du point du contenu ou du milieu. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

Les listes ajoutent `scrollToIndex`, `scrollToOffset` et `scrollToEnd` ; voir [Listes](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## Vues défilantes et clavier

NSH garde de lui-même visible un champ de saisie ayant le focus : lorsque le clavier s'affiche, la vue défilante qui entoure le champ reçoit un inset inférieur de la hauteur du clavier et fait défiler le champ jusqu'à le rendre visible. Cela se fait nativement, sans code dans votre application. Utilisez `env(keyboard-inset-height)` comme padding inférieur ([Contenu en dehors des vues défilantes](./forms-and-keyboard.md#content-outside-scroll-views)) pour le contenu situé en dehors des vues défilantes, comme une barre de message fixée en bas.

Deux props déterminent comment le défilement et les appuis interagissent avec le clavier :

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indique si faire glisser le contenu masque le clavier. `"interactive"` laisse le clavier suivre le doigt vers le bas sur iOS ; sur Android, il se comporte comme `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | Ce que fait un appui lorsque le clavier est affiché. |

`keyboardShouldPersistTaps` :

- `"never"` : un appui en dehors du champ ayant le focus ne fait que masquer le clavier, et les boutons reçoivent l'appui suivant. L'utilisateur appuie une fois pour fermer, puis une autre fois pour presser.
- `"handled"` : un appui sur un élément qui le gère (un bouton) passe à travers et le clavier reste affiché ; un appui sur un espace vide le masque. C'est généralement le bon choix pour les formulaires.
- `"always"` : le clavier reste affiché à travers tous les appuis.

Les deux sont décidés nativement au moment de l'appui ou du glissement, sans attendre votre code. Pour masquer le clavier depuis le code, appelez `dismiss_keyboard()` en Rust ou `Keyboard.dismiss()` depuis [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) en TSX.

<a id="nested-scroll-views"></a>

## Vues défilantes imbriquées

Une vue défilante horizontale à l'intérieur d'une vue verticale fonctionne comme prévu : chacune prend les glissements selon son propre axe. Deux vues défilantes sur le même axe s'imbriquent aussi (la vue interne défile en premier). Les responders qui ont besoin du doigt, comme un canvas de dessin à l'intérieur d'une vue défilante, le retirent aux vues défilantes qui les entourent : `.keep_touches(true)` en Rust, `true` retourné par `onResponderGrant` en TSX ; voir [Toucher et gestes](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## Voir aussi

- [Scroll](../elements/scroll.md) : la référence de l'élément, avec toutes les props et tous les événements.
- [Listes](./lists.md) : listes virtualisées avec les mêmes props de défilement.
- [Animation](./animation.md) : valeurs animées, `interpolate` et `diffClamp` pour les effets liés au défilement.
- [Formulaires et clavier](./forms-and-keyboard.md) : champs de saisie, focus et clavier.
