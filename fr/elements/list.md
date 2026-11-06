---
title: "List"
description: "La liste virtualisée à recyclage : lignes, colonnes, en-têtes fixes, listes de discussion inversées, visibilité des éléments et défilement jusqu'à un élément."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# List

`List` affiche des données longues ou non bornées. Seules les lignes proches de la zone visible existent : lorsque l'utilisateur fait défiler, les lignes qui sortent sont recyclées pour celles qui entrent. Les lignes qui existent, leurs positions, les colonnes, les en-têtes collants et la visibilité sont tous calculés nativement, si bien que faire défiler une liste de milliers d'éléments coûte autant qu'une liste de vingt. Rust en crée une avec `virtual_list(count, |at| row)`, TSX avec `<List>` depuis `nsh`.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

En TSX, `List` est générique : `List<T>` vérifie que `each` et la fonction de ligne s'accordent sur le type des éléments, que TypeScript infère à partir de `each` (voir l'[API List](../modules/nsh-list.md)). En Rust, `virtual_list` prend le nombre de lignes (une valeur, un signal ou une closure : la liste grandit et rétrécit sur place) et la fonction qui construit la ligne à un `Position` donné ; les lignes lisent les données du composant par `at.index()`.

Pour une liste courte dont toutes les lignes doivent exister (une page de réglages, un formulaire), un [`Each`](./control-flow.md) dans une [scroll view](./scroll.md) est plus simple. Pour une liste stylée comme un tableau groupé, voir [une liste de style réglages](../docs/lists.md#a-settings-style-list). Le [guide des listes](../docs/lists.md) couvre les patterns : chargement infini, chat, sections.

<a id="rows-are-recycled"></a>

## Les lignes sont recyclées

La fonction de ligne s'exécute une fois par cellule, et non une fois par élément. Lorsqu'une cellule est réutilisée pour un autre élément, sa position change (TSX : les accesseurs `item()` et `index()` ; Rust : `at.index()`) et tout ce qui la lit est mis à jour :

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

Conservez donc l'état de chaque élément dans vos données (indexé par id), et non dans des signaux créés à l'intérieur de la fonction de ligne : un tel signal reste attaché à la cellule et apparaît sur un autre élément.

Les cellules qui attendent leur prochain élément sont masquées une fois leur ligne disparue ou affichée par une autre cellule, de sorte que les lecteurs d'écran, les touches et les tests d'UI rencontrent chaque ligne une seule fois.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Les éléments. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | Rend une ligne. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | La taille des éléments pas encore mesurés, en points. Des estimations proches stabilisent la barre de défilement. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Défile horizontalement. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"` : la liste défile dans une scroll view qui lui est propre. `"parent"` : elle s'étend sur toute sa longueur dans la mise en page de son parent et rend les lignes proches de la zone visible de la scroll view qui l'entoure, laquelle la fait défiler avec le reste de la page (voir [les listes dans une page](../docs/lists.md#lists-in-a-page-viewportparent)). Choisi à la création de la liste. |
| `numColumns` | `.columns(n)` | `number` | `1` | Éléments par ligne (listes verticales). |
| `inverted` | `.inverted()` | `boolean` | `false` | Disposée à partir de la fin, l'élément 0 en dernier (style chat) : elle démarre défilée jusqu'à la fin et conserve sa distance à la fin lorsque le contenu change. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | Pour les listes non inversées : à la fin du contenu, ou à moins de ce nombre de points de celle-ci, la liste reste à la fin lorsque le contenu grandit ou que la zone visible rétrécit ; si elle est défilée plus haut, le contenu visible reste en place. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | Éléments qui restent collés au début une fois dépassés par le défilement (une colonne, non inversée). |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, `.row_gap(..)`, `.column_gap(..)`, … | `ListContentStyle` | | Marges intérieures et espacements du contenu, en points : `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`. |
| `contentClass` | | `string` | | Marges intérieures et espacements du contenu sous forme de classes (`p-*`, `gap-*`) ; `contentStyle` l'emporte sur elles. |
| `header` | `.header(el)` | `ListSlot` | | Avant les éléments : un composant (`Header`) ou un élément (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | Après les éléments. |
| `empty` | `.empty(el)` | `ListSlot` | | Affiché à la place des éléments tant que `each` est vide. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | Entre les éléments (une colonne). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Défile jusqu'à cet élément avant la première image. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key`, `item.id` ou l'index | La clé d'un élément dans les jetons de visibilité. En Rust, l'identité des lignes, afin que les lignes conservent leurs cellules et leurs tailles lorsque des lignes apparaissent ou disparaissent avant elles. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | La fin est proche : charger davantage. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | À quelle distance de la fin (en zones visibles) `onLoadMore` se déclenche. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Le début est proche, après que l'utilisateur ou une commande de défilement a déplacé la liste : charger ce qui précède le premier élément. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | À quelle distance du début (en zones visibles) `onLoadMoreAtStart` se déclenche. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Des éléments sont devenus visibles ou ont cessé de l'être. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quand les éléments comptent comme visibles (ci-dessous). |
| `refreshing` | `.refreshing(..)` | `boolean` | | Le spinner de pull-to-refresh s'affiche. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | L'utilisateur a tiré pour rafraîchir. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | L'app dessine son propre indicateur, de `height` points de haut : le spinner de la plateforme est masqué, un tirage rafraîchit dès qu'il atteint `height`, et pendant le rafraîchissement `height` est conservé au-dessus du contenu. Une hauteur de 0 ou moins signifie aucun. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | Une valeur animée alimentée par la distance dont la liste est tirée au-delà de son sommet (0 au repos, croissante avec le tirage ; l'espace conservé au-dessus du contenu pendant le rafraîchissement : `height` avec `refreshIndicator`), pour l'indicateur de l'app. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | L'indicateur de défilement s'affiche : celui de la plateforme, ou la [barre intégrée](./scrollbar.md#built-in-bars) de l'app dès qu'elle a défini un thème ; un objet est un thème propre à la vue. Sur le bureau et dans les navigateurs de bureau, une vue horizontale le conserve : c'est la barre de défilement de la souris. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Une valeur animée alimentée par le décalage de défilement, pour les animations liées au défilement. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indique si le glissement ferme le clavier. |
| `style` | méthodes `Styled` | `StyleProp<ViewStyle>` | | Le style propre de la liste (elle a besoin d'une taille bornée : `flex: 1` ou une hauteur). |
| `testID` | `.test_id(id)` | `string` | | L'id par lequel les tests d'UI trouvent la scroll view de la liste (`id:` de `nsh test`, XCUITest, UI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | La ref de la liste (voir les [méthodes de ref](#ref-methods)). |

Les listes acceptent aussi les props de défilement de [`Scroll`](./scroll.md#scrolling) (les méthodes `Scrollable` en Rust) :
`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `disableIntervalMomentum`, `decelerationRate`,
`bounces`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `scrollEventThrottle` et `scrollable`.
Les listes conservent leur échelle.

Les props que tout élément accepte ([props communes](./index.md#common-props)) sont transmises telles quelles à la scroll view de la liste :
`testID`, `accessibilityLabel` et les autres props d'accessibilité, les styles, `onLayout`, ainsi que les props de touch et de responder.
Les tests d'UI trouvent une liste par son `testID` comme n'importe quelle vue.

`ViewabilityConfig` (Rust : `Viewability { item_visible_threshold, view_area_coverage_threshold }` et `.minimum_view_time(..)`) :

| Champ | Type | Description |
|---|---|---|
| `itemVisibleThreshold` | `number` | La part d'un élément qui doit être visible, de 0 à 1. |
| `viewAreaCoverageThreshold` | `number` | La part de la zone visible qu'un élément doit couvrir, de 0 à 1. Sans l'un ou l'autre seuil, tout pixel visible compte. |
| `minimumViewTime` | `number` | Millisecondes pendant lesquelles les éléments doivent rester visibles avant d'être signalés. |

`ViewToken<T>` est `{ item, key, index, isViewable }`. Le listener Rust reçoit `ViewableItems` : `indices()` est la plage des lignes visibles, `changed()` les lignes arrivées ou parties.

<a id="events"></a>

## Événements

| Événement | Rust | Payload | Quand |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | Le décalage a changé. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | Le glissement a commencé / s'est arrêté. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Une glisse a commencé / s'est arrêtée. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Le défilement s'est immobilisé. |
| `onLoadMore` | `.on_load_more` | aucun | À moins de `loadMoreThreshold` zones visibles de la fin. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | aucun | À moins de `loadMoreAtStartThreshold` zones visibles du début, une fois par approche après un défilement. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | La visibilité a changé. |
| `onRefresh` | `.on_refresh` | aucun | Tiré pour rafraîchir. |

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | Fait défiler l'élément `index` jusqu'à le rendre visible. `viewPosition` le place : 0 au début de la zone visible (par défaut), 0,5 au milieu, 1 à la fin ; `viewOffset` le décale davantage. Résolu nativement avec les tailles d'éléments actuelles (mesurées ou estimées). |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | Défile jusqu'à un décalage le long de l'axe de la liste. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | Défile jusqu'à la fin du contenu (le début d'une liste inversée). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | Défile jusqu'à un décalage. |

<a id="examples"></a>

## Exemples

Une grille avec un en-tête et la visibilité :

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

Un chat :

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

L'élément 0 est le message le plus récent, dessiné en bas ; les nouveaux messages ajoutés au début des éléments apparaissent sans déplacer ce que l'utilisateur est en train de lire.

<a id="platform-notes"></a>

## Notes sur les plateformes

- Insérer des éléments au-dessus des lignes visibles garde les lignes visibles en place sur les deux plateformes.
- Les listes horizontales dans les mises en page de droite à gauche sont inversées nativement.
- Les en-têtes collants sont épinglés nativement à chaque image de défilement.
