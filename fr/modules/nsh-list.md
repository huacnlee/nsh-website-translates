---
title: "List"
description: "List, une liste virtualisée avec recyclage des éléments, reposant sur une vue de défilement native, avec toutes ses props, ses événements et ses méthodes de ref."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

`nsh` exporte `List` : une liste virtualisée construite sur une scroll view native. Seules les lignes proches de la zone visible existent, et leurs cellules sont réutilisées au fil du défilement. Les lignes qui existent, leur position, les colonnes, les en-têtes collants et la visibilité sont tous calculés nativement. Faire défiler une liste de dix mille éléments n'exécute donc aucun JS, hormis les bindings de ligne qui changent lorsqu'une cellule est réutilisée.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

Voir [Listes](../docs/lists.md) pour le guide et [`<List>`](../elements/list.md) pour les props de l'élément.

<a id="list-1"></a>

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### Les lignes sont recyclées

`children` est une fonction qui rend **une cellule**. Elle s'exécute une fois par cellule, et non une fois par élément : quand une cellule sort de la zone visible, elle est réutilisée pour un autre élément, et `item()` et `index()` (deux accesseurs) changent. Lisez-les dans des expressions JSX (`{item().name}`) afin que la cellule se mette à jour lorsqu'elle est réutilisée.

> [!WARNING]
> Ne conservez pas d'état par élément dans des signaux créés à l'intérieur de la fonction de ligne : la cellule est réutilisée pour d'autres éléments et le signal suivrait la cellule, pas l'élément. Conservez-le dans vos données, indexé par id (par exemple un signal contenant un `Set` d'ids sélectionnés).

## Props

`ListProps<T>` combine les props propres à la liste, les props de défilement partagées avec `<Scroll>` et les props que prend tout
élément, lesquelles sont transmises à la scroll view de la liste.

<a id="data-and-rendering"></a>

### Données et rendu

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `each` | `readonly T[]` | (obligatoire) | Les éléments. Passez la valeur d'un signal (`each={items()}`) pour suivre les changements ; insérer des éléments au-dessus des lignes visibles laisse ces lignes en place. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (obligatoire) | Rend une ligne (voir ci-dessus). |
| `estimatedItemSize` | `number` | `50` | La taille des lignes pas encore mesurées, en points, le long de l'axe de la liste. Des estimations proches rendent l'indicateur de défilement et `scrollToIndex` plus précis. |
| `numColumns` | `number` | `1` | Éléments par ligne (listes verticales) : une grille. |
| `horizontal` | `boolean` | `false` | Défile horizontalement. |
| `inverted` | `boolean` | `false` | Dispose depuis la fin, l'élément 0 en dernier (style chat) ; démarre défilée jusqu'à la fin et conserve sa distance par rapport à la fin lorsque le contenu change. |
| `stickyHeaderIndices` | `number[]` | | Éléments qui restent collés au début une fois dépassés par le défilement (une colonne, non inversée). |
| `header` | `ListSlot` | | Rendu avant les éléments. |
| `footer` | `ListSlot` | | Rendu après les éléments. |
| `empty` | `ListSlot` | | Affiché à la place des éléments tant que `each` est vide. |
| `separator` | `ListSlot` | | Rendu entre les éléments (une colonne). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key`, `item.id` ou l'index | La clé d'un élément dans les jetons de visibilité. |
| `initialScrollIndex` | `number` | | Défile jusqu'à cet élément avant la première image. |
| `contentStyle` | `ListContentStyle` | | Marges intérieures et espacements du contenu : `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap` (nombres). |
| `contentClass` | `string` | | Marges intérieures et espacements du contenu sous forme de classes (`p-*`, `gap-*`) ; `contentStyle` l'emporte sur elles. |
| `style` | `StyleProp<ViewStyle>` | | Le style propre de la liste (donnez-lui une taille : `flex: 1` ou une hauteur). |
| `testID` | `string` | | L'id par lequel les tests d'UI trouvent la scroll view de la liste (`id:` de `nsh test`, XCUITest, UI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | Voir [méthodes de ref](#ref-methods). |

`ListSlot` est un composant (`Header`) ou un élément (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### Chargement, rafraîchissement et visibilité

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `onLoadMore` | `() => void` | | Appelé lorsque la fin arrive à moins de `loadMoreThreshold` zones visibles : charger la suite. |
| `loadMoreThreshold` | `number` | `1` | À quelle distance de la fin (en longueurs de zone visible) `onLoadMore` se déclenche. |
| `onLoadMoreAtStart` | `() => void` | | Appelé lorsque le début arrive à moins de `loadMoreAtStartThreshold` zones visibles après que l'utilisateur ou une commande de défilement a déplacé la liste : charger ce qui précède le premier élément. |
| `loadMoreAtStartThreshold` | `number` | `1` | À quelle distance du début (en longueurs de zone visible) `onLoadMoreAtStart` se déclenche. |
| `refreshing` | `boolean` | | Le spinner de pull-to-refresh s'affiche. |
| `onRefresh` | `() => void` | | Active le pull to refresh ; définissez `refreshing` pendant le chargement. |
| `refreshIndicator` | `{ height: number }` | | L'app dessine son propre indicateur de pull-to-refresh, de hauteur `height`, à la place du spinner. |
| `pullValue` | `AnimatedValue` | | Alimenté avec la distance dont la liste est tirée au-delà de son sommet, pour cet indicateur. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | Éléments devenus visibles ou ayant cessé de l'être. |
| `viewabilityConfig` | `ViewabilityConfig` | | Quand un élément compte comme visible. |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### Défilement

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | L'indicateur de défilement s'affiche : celui de la plateforme, ou la [barre intégrée](../elements/scrollbar.md#built-in-bars) de l'app ; un objet est un thème propre à la vue. |
| `scrollable` | `boolean` | `true` | L'utilisateur peut la faire défiler. |
| `bounces` | `boolean` | `true` | Overscroll au-delà des bords. |
| `pagingEnabled` | `boolean` | `false` | S'arrête à des multiples de la zone visible. |
| `snapToInterval` | `number` | `0` | S'arrête à des multiples de cette longueur (0 : désactivé). |
| `snapToOffsets` | `number[]` | | S'arrête à ces offsets. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | Quel point d'un élément s'aligne sur la zone visible avec `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | Un fling ne dépasse pas un point d'accroche. |
| `decelerationRate` | `"normal" \| "fast" \| number` | plateforme | La vitesse à laquelle un fling ralentit (`0.998` / `0.99`, ou la vélocité conservée par milliseconde). |
| `contentInset` | `Partial<Edges>` | | Espace autour du contenu. |
| `contentOffset` | `{ x?, y? }` | | Point de départ. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Indique si un appui masque le clavier (`"never"` : l'appui ne fait que le masquer). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indique si le glissement masque le clavier. |
| `scrollEventThrottle` | `number` | | Nombre minimal de millisecondes entre les événements `onScroll` (au plus un par image de toute façon). |
| `scrollValue` | `AnimatedValue` | | Une [valeur animée](./nsh.md#animation) alimentée avec l'offset de défilement (axe principal) sur le thread d'UI, pour les effets liés au défilement. |

<a id="scroll-events"></a>

### Événements de défilement

| Événement | Payload | Quand |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | Pendant le défilement. |
| `onScrollDragStart` | `{ offset }` | Un glissement commence. |
| `onScrollDragEnd` | `{ offset }` | Le doigt se lève. |
| `onMomentumStart` | `{ offset }` | Une glissade démarre après le glissement. |
| `onMomentumEnd` | `{ offset }` | La glissade se termine (également lorsqu'un nouveau glissement la rattrape). |
| `onScrollEnd` | `{ offset }` | Le défilement s'est immobilisé. |

Les listes acceptent aussi les props que prend tout élément ([props communes](../elements/index.md)).

<a id="ref-methods"></a>

## Méthodes de ref

Le `ref` d'une liste reçoit un `ListRef`, avec ces méthodes en plus de celles de `ViewRef` :

| Méthode | Description |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Fait défiler l'élément `index` jusqu'à le rendre visible. `viewPosition` le positionne : `0` au début de la zone visible (par défaut), `0.5` au milieu, `1` à la fin ; `viewOffset` le décale davantage. Résolu nativement à partir des tailles de ligne mesurées (ou estimées). |
| `scrollToOffset({ offset, animated? })` | Défile jusqu'à un offset de contenu le long de l'axe de la liste. |
| `scrollToEnd({ animated? })` | Défile jusqu'à la fin du contenu (le début d'une liste inversée). |
| `scrollTo({ x?, y?, animated? })` | Défile jusqu'à un offset. |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## Exemples

Un chat : message le plus récent en bas, messages plus anciens chargés au fur et à mesure que vous remontez.

```tsx
<List
  each={messages()}
  inverted
  estimatedItemSize={44}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 6 }}
  keyboardDismissMode="interactive"
  onLoadMore={loadOlder}
  loadMoreThreshold={0.5}
>
  {(m) => (
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

Pull to refresh :

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

La moitié données et lignes de `ListProps` : ce que vous passez à un composant de votre cru qui dispose lui-même une liste, comme une liste de réglages qui enveloppe `List` avec ses propres marges intérieures et séparateurs.
