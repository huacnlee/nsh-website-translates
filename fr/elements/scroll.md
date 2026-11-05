---
title: "Scroll"
description: "La vue de défilement native : défilement vertical et horizontal, pagination et accrochage, tirer pour actualiser, zoom et événements de défilement."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` est une vue de défilement native (UIScrollView sur iOS et Mac Catalyst, un ScrollView sur Android). Elle dispose tous ses enfants comme son contenu et les fait défiler nativement : le défilement, le lancer (fling), le rebond et l'aimantation s'exécutent sur la plateforme, à la fréquence de l'écran. Rust en crée une avec `scroll()`, TSX avec `<Scroll>` depuis `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Une vue de défilement crée tous ses enfants, ce qui convient aux pages de taille modérée. Pour des données longues ou non bornées, utilisez une [liste](./list.md) : elle crée les lignes proches de la zone visible et les recycle.

Une vue de défilement a besoin d'une taille bornée selon son axe : donnez-lui `flex: 1` (`.flex_1()`) ou une hauteur dans un conteneur qui en a une. Son contenu est disposé à la largeur de la vue de défilement (à sa hauteur si elle est horizontale) et aussi haut (large) que nécessaire.

## Props

En plus des [props communes](./index.md#common-props) (avec `style` typé comme `ViewStyle`). En Rust, les props de défilement sont des méthodes du trait `Scrollable`, que les listes partagent.

### Scrolling

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Défile latéralement. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utilisateur peut la faire défiler. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | L'indicateur de défilement s'affiche : celui de la plateforme, ou la [barre intégrée](./scrollbar.md#built-in-bars) de l'app dès qu'elle a défini un thème ; un objet est un thème propre à la vue. Sur le bureau et dans les navigateurs de bureau, une vue horizontale le conserve : c'est la barre de défilement de la souris. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Défilement au-delà des bords (overscroll). |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | S'arrête aux multiples de la zone visible. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | S'arrête aux multiples de cette longueur (0 : désactivé). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | S'arrête à ces décalages. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Quel point d'un élément s'aligne avec la zone visible avec `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Un lancer avance d'un point d'aimantation au plus. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | plateforme | La vitesse à laquelle un lancer ralentit : la vitesse conservée par milliseconde (`normal` 0,998, `fast` 0,99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Espace autour du contenu. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Où elle démarre. |
| `contentStyle` | les styles propres de la vue de contenu | `ViewStyle` | | Le style d'une vue autour des enfants qui défile avec eux ; `flexGrow: 1` la rend au moins aussi haute que la zone visible (un état vide centré). |
| `contentClass` | les styles propres de la vue de contenu | `string` | | Idem avec des classes, p. ex. `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indique si le glissement ferme le clavier. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Indique si un tap ferme le clavier : `never` (le tap ne fait que le fermer), `always` (il reste affiché), `handled` (il reste affiché quand quelque chose gère le tap). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Une valeur animée alimentée par le décalage de défilement (axe principal), pour les animations liées au défilement. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Nombre minimal de millisecondes entre les événements `onScroll` (au plus un par frame de toute façon). |

### Pull to refresh

| Prop | Rust | Type | Description |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | Le spinner d'actualisation s'affiche. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | L'utilisateur a tiré pour actualiser : lancez le chargement et définissez `refreshing` jusqu'à sa fin. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | L'app dessine son propre indicateur, de `height` points de haut : le spinner de la plateforme est masqué, un tirage actualise une fois `height` atteint, et pendant l'actualisation `height` est conservé au-dessus du contenu. Une hauteur de 0 ou moins signifie aucun. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Une valeur animée alimentée par la distance dont la vue est tirée au-delà de son haut (0 au repos, croissant avec le tirage ; l'espace conservé au-dessus du contenu pendant l'actualisation : `height` avec `refreshIndicator`), pour l'indicateur de l'app. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

Définir `maximumZoomScale` au-dessus de `minimumZoomScale` (`.zoom_range(min, max)` en Rust) rend le contenu zoomable par pincement ; une fois zoomé, il défile dans les deux sens. Les listes conservent leur échelle.

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Le zoom minimal. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Le zoom maximal. |
| `zoomScale` | `.zoom(..)` | `number` | | Zoome à cette échelle lorsqu'elle change ; sinon le zoom de l'utilisateur est conservé. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Le pincement peut dépasser les limites et revient en arrière avec un effet de ressort. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | L'utilisateur peut pincer pour zoomer. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Un contenu plus petit que la zone visible (dézoomé) est centré. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## Événements

| Événement | Rust | Payload | Quand |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Le décalage a changé (au plus une fois par frame, et pas plus souvent que `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | L'utilisateur a commencé / arrêté de faire glisser. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Un glissement après le drag a commencé / s'est arrêté. Un glissement interrompu par un nouveau drag se termine tout de même par `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Le défilement s'est immobilisé. |
| `onRefresh` | `.on_refresh` | aucun | Tiré pour actualiser. |

`ScrollEvent` est `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (en Rust `offset`, `content_size`, `size`, `zoom_scale`) : le décalage, la taille du contenu (zoomé), la taille de la zone visible et l'échelle de zoom (1 sauf si la vue zoome).

> [!TIP]
> Pour déplacer quelque chose avec la position de défilement (un en-tête qui rétrécit, une image en parallaxe), liez `scrollValue` à une valeur native et interpolez-la dans un style. Cela s'exécute sur le thread UI à la fréquence de l'écran, alors que `onScroll` est un événement par frame dans le code de l'app. Voir [animation](../docs/animation.md).

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Défile jusqu'à un décalage. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Zoome à `scale` (limité aux bornes) avec le point du contenu (`x`, `y`, points non zoomés) au milieu de la zone visible, ou autour du milieu. P. ex. un double tap qui zoome sur le point touché. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## Clavier

Les champs de saisie à l'intérieur d'une vue de défilement restent dégagés du clavier nativement : la vue de défilement reçoit une marge intérieure en bas et défile d'elle-même jusqu'au champ ayant le focus. Pour le contenu en dehors des vues de défilement, utilisez [`env(keyboard-inset-height)`](./keyboard.md) dans un padding ou une marge du bas. Voir [formulaires et clavier](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## Droite à gauche

Les vues de défilement horizontales démarrent à l'extrémité droite dans les mises en page de droite à gauche et conservent leur distance à celle-ci lorsque le contenu change ; leurs enfants sont inversés.

<a id="platform-notes"></a>

## Notes par plateforme

- Android : l'actualisation par tirage est dessinée par NSH (l'overscroll reste natif), `contentInset` est appliqué comme padding, et `decelerationRate` façonne les glissements d'aimantation.
- Android zoome avec la propre vue de défilement de NSH, qui met le contenu à l'échelle autour de son coin supérieur gauche et défile dans les deux sens. Les pincements démarrent après l'écartement minimal d'Android entre les doigts (environ 27 mm).
- Sur Mac Catalyst (idiome Mac), NSH détecte le tirage et affiche son spinner.
- iOS redessine les textes et les canvas à la résolution zoomée lorsqu'un zoom se termine.
