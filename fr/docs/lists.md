---
title: "Listes"
description: "Listes longues et infinies en Rust et TSX : recyclage, identité des lignes, colonnes, en-têtes fixes, listes de chat inversées, listes horizontales, listes dans une page, chargement de données supplémentaires, visibilité et défilement vers un élément."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# Listes

Une liste (`virtual_list(..)` en Rust, `List` de `nsh` en TSX) affiche de longues données dans une vue de défilement native en ne créant que les lignes proches de l'écran. Quelles lignes existent, où elles se placent, les colonnes, les en-têtes collants et les éléments visibles sont tous calculés côté natif ; votre code ne fait que remplir les cellules avec du contenu quand le côté natif en demande une. Une liste d'un million d'éléments coûte à peu près autant qu'une liste de trente.

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

En Rust, `virtual_list(count, row)` prend le nombre de lignes (une valeur, un signal ou une closure) et une fonction qui construit une ligne à partir de sa position (`at.index()`) ; les lignes lisent vos données grâce à cet index. En TSX, `each` prend les éléments et la fonction de ligne reçoit l'élément. Comme une [vue de défilement](./scrolling.md), la liste est le viewport et a besoin d'une taille de la part de son parent (`.flex_1()`, `flex: 1` ou une hauteur).

<a id="how-recycling-works"></a>

## Fonctionnement du recyclage

La fonction de ligne n'est pas appelée une fois par élément. Elle est appelée **une fois par cellule**, et les cellules sont réutilisées : lorsqu'une ligne défile loin hors de l'écran, sa cellule est attribuée à une autre ligne, et sa position (`at.index()` en Rust, `item()` et `index()` en TSX) change. Tout ce qui, dans la ligne, la lit se met à jour sur place, comme pour tout autre [signal](./reactivity.md).

Deux règles en découlent :

**Lisez la position là où vous l'utilisez.** Une valeur copiée en haut de la fonction de ligne appartient à la ligne que la cellule a affichée en premier.

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**Gardez l'état propre à chaque élément dans vos données, pas dans la ligne.** Un signal créé dans la ligne appartient à la cellule et la suit vers l'élément suivant. Stockez « cette ligne est dépliée / sélectionnée / aimée » dans les éléments ou dans un ensemble indexé par identifiant :

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

Les lignes peuvent avoir des hauteurs différentes. Tant qu'une ligne n'a pas été mesurée, la liste suppose la taille d'élément estimée (50 points par défaut) ; fournissez une valeur proche de votre ligne typique pour que l'indicateur de défilement et les sauts vers des éléments éloignés soient précis dès le départ.

<a id="changing-the-data"></a>

## Modifier les données

En Rust, fournissez le nombre de lignes sous forme de signal ou de closure (`move || posts.with(Vec::len)`) : la liste grandit et rétrécit sur place. Les lignes ajoutées ou retirées à la fin ne demandent rien de plus ; lorsque des lignes apparaissent et disparaissent ailleurs, indiquez leurs identités avec `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`, et la liste conserve le début et la fin communs et traite ce qui se trouve entre les deux comme retiré puis inséré.

En TSX, passez un nouveau tableau pour changer les éléments : `posts.set([...posts(), ...more])`. La liste compare l'ancien et le nouveau tableau **par identité d'élément** (`===`), conserve le début et la fin communs, et traite ce qui se trouve entre les deux comme retiré puis inséré.

Dans les deux cas, les mesures restent attachées à leurs lignes, et lorsque des lignes sont insérées au-dessus de celles qui sont à l'écran, les lignes visibles restent à leur place au lieu de sauter.

- En TSX, mettez à jour de façon immuable : un nouveau tableau, en réutilisant les objets d'éléments inchangés. Une modification du tableau sur place (`push`) n'est pas détectée.
- Un élément modifié doit être un nouvel objet (`{ ...post, title }`), afin que sa ligne reflète le changement.
- Ajouter en tête (nouveaux messages, flux actualisé) préserve la position de l'utilisateur.

`keyExtractor` nomme les éléments dans les jetons de visibilité (ci-dessous) ; par défaut, la clé est `item.key`, puis `item.id`, puis l'index. Elle n'a pas d'effet sur la façon dont les changements sont appariés en TSX, qui se fait toujours par identité.

## Props

Une liste accepte toutes les props de défilement de la vue de défilement qui ont un sens pour une liste (`pagingEnabled`, `snapToInterval`, `snapToOffsets`, `snapToAlignment`, `decelerationRate`, `disableIntervalMomentum`, `bounces`, `scrollable`, `contentInset`, `contentOffset`, `keyboardShouldPersistTaps`, `keyboardDismissMode`, `scrollEventThrottle`, `onScroll`, `onScrollDragStart`, `onScrollDragEnd`, `onMomentumStart`, `onMomentumEnd`, `onScrollEnd`, `scrollValue`, `pullValue` ; en Rust, les mêmes méthodes que celles d'une vue de défilement), décrites dans [Défilement](./scrolling.md). Les listes gardent une échelle de 1. Leurs props propres :

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | Les éléments ; en Rust, le nombre de lignes. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | Affiche une cellule ; appelée une fois par cellule, voir [recyclage](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | La taille des lignes pas encore mesurées, en points. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | Défile horizontalement. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"` : la liste défile dans sa propre vue de défilement. `"parent"` : elle s'étend sur toute sa longueur dans la vue de défilement qui l'entoure, qui la fait défiler avec le reste de la page (voir [listes dans une page](#lists-in-a-page-viewportparent)). Choisi à la création de la liste. |
| `numColumns` | `.columns(n)` | `number` | `1` | Éléments par ligne (listes verticales). |
| `inverted` | `.inverted()` | `boolean` | `false` | L'élément 0 en bas (chat) ; démarre à la fin et conserve sa distance à la fin. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | Une liste non inversée reste à la fin tant qu'elle se trouve à moins de ce nombre de points de celle-ci, lorsque le contenu grandit (voir ci-dessous). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | Éléments qui restent collés en haut une fois dépassés par le défilement (une colonne, non inversée). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`, `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | À quelle distance sous le haut les éléments collants se fixent, comme le `top` de CSS `position: sticky` ; le contenu continue de défiler sous l'espace situé au-dessus d'eux. Une valeur animée les déplace à chaque frame. |
| `contentStyle` | `.content_padding(..)`, `.content_padding_x(..)`, ..., `.row_gap(..)`, `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | Marges intérieures et espacements du contenu, nombres uniquement. |
| `contentClass` | | `string` | | Les mêmes réglages sous forme de classes (`p-*`, `gap-*`) ; `contentStyle` l'emporte sur elles. |
| `header` | `.header(..)` | composant ou élément | | Avant les éléments. |
| `footer` | `.footer(..)` | composant ou élément | | Après les éléments. |
| `empty` | `.empty(..)` | composant ou élément | | Affiché à la place des éléments tant qu'il n'y en a aucun. |
| `separator` | `.separator(\|\| ..)` | composant ou élément | | Entre les éléments (une colonne). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | Défile jusqu'à cet élément avant la première frame. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | La fin est proche (voir ci-dessous). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | À quelle distance de la fin, en viewports, `onLoadMore` se déclenche. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | Le début est proche, après un défilement (voir ci-dessous). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | À quelle distance du début, en viewports, `onLoadMoreAtStart` se déclenche. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | Des éléments sont devenus visibles ou ont cessé de l'être. |
| `viewabilityConfig` | `.viewability(..)`, `.minimum_view_time(..)` | `ViewabilityConfig` | | Quand les éléments comptent comme visibles. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | La clé dans les jetons de visibilité ; en Rust, les identités des lignes. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | Tirer pour actualiser. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | L'indicateur de tirer pour actualiser propre à l'app, à la place du spinner de la plateforme (voir [Défilement](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | Affichage de l'indicateur de défilement : celui de la plateforme, ou la [barre intégrée](../elements/scrollbar.md#built-in-bars) de l'app dès qu'elle a défini un thème ; un objet est un thème propre à la vue. Sur desktop et dans les navigateurs de bureau, une vue horizontale le conserve : c'est la barre de défilement de la souris. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`, `scrollToOffset`, `scrollToEnd`, `scrollTo`. |

Les slots d'en-tête, de pied et de vide acceptent un élément (en TSX aussi un composant : `header={Header}`). Ce sont des cellules à part entière, jamais recyclées, et elles sont réactives comme n'importe quel autre élément.

<a id="columns-and-grids"></a>

## Colonnes et grilles

`numColumns` (`.columns(n)`) dispose les éléments en lignes de ce nombre de colonnes ; la marge intérieure du contenu entoure le contenu, avec des espacements entre les lignes et les colonnes. Les lignes d'une grille peuvent avoir des hauteurs différentes : chaque ligne est aussi haute que son élément le plus haut.

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## En-têtes collants

`stickyHeaderIndices` liste les éléments qui restent collés en haut du viewport pendant que le contenu défile devant eux, jusqu'à ce que l'élément collant suivant les repousse. Les sections forment une seule liste d'éléments d'en-tête et de lignes ; ce sont les indices des en-têtes qui restent collés. L'épinglage est effectué côté natif à chaque frame de défilement.

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

Comme une cellule peut afficher un en-tête à un moment puis un nom à un autre, la ligne décide de ce qu'elle affiche avec [`when` / `<If>`](../elements/control-flow.md), qui bascule lorsque la ligne change. Les en-têtes collants nécessitent une seule colonne et une liste non inversée.

`stickyHeaderOffset` (`.sticky_header_offset(..)` en Rust) fait coller les en-têtes à ce nombre de points sous le haut, comme le `top` de CSS `position: sticky` : sous une barre translucide de 56 points de haut, `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) garde chaque en-tête sous la barre pendant que les lignes continuent de défiler dessous, et l'en-tête suivant le repousse à partir de là. Un décalage négatif laisse une partie d'un en-tête hors de la vue.

Le décalage peut être une [valeur animée](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` en Rust) : les en-têtes la suivent à chaque frame sur le thread UI, et restent donc sous une barre qui se déplace. Avec une barre qui se masque lorsque le contenu défile vers le bas et revient lorsqu'il défile vers le haut ([`diffClamp`](./animation.md#arithmetic-and-diffclamp)), les en-têtes se collent à son bord inférieur où qu'il soit :

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## Chat : listes inversées

`inverted` dispose la liste à partir de la fin : l'élément 0 est en bas, la liste démarre défilée jusqu'à la fin, et elle conserve sa distance à la fin lorsque les éléments changent. Gardez le message le plus récent en premier ; ajoutez en tête pour en ajouter un, ajoutez en queue pour charger les plus anciens avec `onLoadMore` (la « fin » d'une liste inversée est le haut). Un chat ouvert sur un ancien message charge les plus récents avec [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart) ; avec cette prop, la liste conserve sa distance au bas tant qu'elle y est, et garde en place les messages à l'écran lorsqu'on remonte.

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
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
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

`scroll_to_end(..)` / `scrollToEnd()` sur une liste inversée défile jusqu'à son début : le message le plus récent.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### Suivre la fin d'une liste non inversée

Une liste dans l'ordre de lecture (les plus anciens d'abord) peut aussi suivre sa fin : avec `.follow_end(px(40.0))` en Rust ou `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` en TSX, tant que l'utilisateur est à la fin (ou à moins de 40 points de celle-ci), la liste reste à la fin lorsque le contenu grandit : une réponse qui arrive en flux dans le dernier élément, un nouveau message ajouté, le clavier qui réduit la liste. Plus haut dans la liste, le contenu visible reste où il est et le nouveau contenu grandit en dessous. Les éléments insérés au-dessus des éléments visibles ne les déplacent jamais, avec ou sans l'option.

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## Listes horizontales

`horizontal` met la liste à l'horizontale ; les cellules sont disposées à la hauteur de la liste. Combinée à l'accrochage (snapping), elle donne un carrousel de n'importe quelle longueur :

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

En écriture de droite à gauche, les listes horizontales commencent à droite et vont vers la gauche.

<a id="lists-in-a-page-viewportparent"></a>

## Listes dans une page : viewport="parent"

Une page défile souvent d'un seul bloc : un en-tête, quelques cartes, puis une longue liste, et peut-être une autre liste en dessous. Donnez à la liste `viewport="parent"` (`.viewport(ListViewport::Parent)` en Rust) et placez-la dans un `Scroll` avec le reste de la page : la liste s'étend dans la page sur toute sa longueur, et la vue de défilement de la page la fait défiler avec tout le reste. Elle ne crée toujours que les lignes proches du viewport de la page et recycle leurs cellules, si bien qu'une seule page peut contenir plusieurs longues listes.

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- La liste a la longueur de ses lignes : sa hauteur (sa largeur, en horizontal) provient de son contenu, comme pour une vue, et sa marge intérieure, sa bordure et ses marges fonctionnent comme sur une vue.
- Ses lignes suivent la vue de défilement la plus proche qui l'entoure selon son axe, ou l'écran sur lequel elle se trouve.
- La page conserve en place ce que vous lisez, comme le fait un navigateur : les lignes dont la taille change entièrement au-dessus du haut du viewport déplacent la page d'autant ; tant que le début de la liste est visible, les lignes qui grandissent repoussent vers le bas ce qui se trouve en dessous.
- `scrollToIndex`, `scrollToEnd` et `initialScrollIndex` font défiler la page jusqu'aux lignes de la liste, dans les limites du contenu de la page ; `onLoadMore` se déclenche lorsque la fin de la liste approche du viewport, et `onViewableItemsChange` rapporte les lignes présentes dans le viewport de la page.
- `stickyHeaderIndices` et `stickyHeaderOffset` collent des lignes en haut de la page : un en-tête de section reste en haut pendant que ses lignes défilent dessous, jusqu'à ce que le suivant le repousse, et le dernier part avec la fin de sa liste.
- La façon dont la page défile dépend de sa vue de défilement : définissez `onScroll` et les autres événements de défilement, `scrollValue`, `refreshing` / `onRefresh`, la pagination et l'accrochage, `contentInset`, `scrollbar`, `scrollable` et `keyboardDismissMode` sur le `Scroll`. Les listes inversées et `maintainVisibleContentPosition` sont des fonctionnalités d'une liste dotée de son propre viewport (`viewport="own"`, la valeur par défaut).
- Le viewport est choisi à la création de la liste : pour en changer, affichez une nouvelle liste.

<a id="loading-more-onloadmore"></a>

## Charger la suite : onLoadMore

`onLoadMore` (`.on_load_more(..)`) se déclenche lorsque le viewport arrive à moins de `loadMoreThreshold` viewports de la fin (1 par défaut : un écran d'avance). Ajoutez la page suivante ; la liste se déclenche de nouveau lorsque la nouvelle fin approche.

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

Protégez-vous des chargements qui se chevauchent comme ci-dessus : la fin peut être signalée de nouveau pendant qu'une page est en cours de chargement.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## Chargement au début : onLoadMoreAtStart

Une liste peut aussi s'ouvrir au milieu de ses données : un chat ouvert sur un ancien message (résultat de recherche, citation d'une réponse) affiche une page autour de ce message, avec des messages plus récents encore à charger. `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) se déclenche lorsque la zone visible arrive à moins de `loadMoreAtStartThreshold` zones visibles du début (1 par défaut), c'est-à-dire du côté de l'élément 0 : le haut d'une liste, le bas d'une liste inversée. Ajoutez la page au début : les lignes à l'écran gardent leur place pendant que la page arrive avant elles (y compris pour une liste inversée, une fois éloignée de son bas), et la liste se redéclenche à la prochaine approche, ou immédiatement si la page l'a laissée encore près du début.

Elle se déclenche lorsque l'utilisateur fait défiler jusque-là ou qu'une commande de défilement y amène la liste (`initialScrollIndex` inclus) : une liste qui s'ouvre sur son élément le plus récent ne demande donc rien, et une liste ouverte avec `initialScrollIndex` près de son début demande aussitôt la page qui précède.

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

Une fois le message le plus récent chargé, arrêtez le chargement : les nouveaux messages arrivent alors au début, comme dans n'importe quel chat.

<a id="viewability"></a>

## Visibilité

`onViewableItemsChange` (`.on_viewable_items_change(..)`) signale quels éléments sont à l'écran, pour des analyses, la lecture automatique de la vidéo visible ou le marquage de messages comme lus. En TSX, elle reçoit `{ viewableItems, changed }`, des tableaux de jetons `{ item, key, index, isViewable }` ; en Rust, `ViewableItems` avec la première et la dernière ligne visibles (`viewable`) et les lignes dont l'état a changé (`changed()`). La visibilité est calculée côté natif ; votre code n'est informé que des changements.

| `viewabilityConfig` | Rust | Description |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | Part d'un élément qui doit être visible, de 0 à 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | Part de la zone visible qu'un élément doit couvrir, de 0 à 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | Millisecondes pendant lesquelles un élément doit rester visible avant d'être signalé. |

Sans seuil, tout pixel visible compte.

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## Défilement depuis le code

Donnez une ref à la liste (`element_ref()` et `.element_ref(&list)` en Rust, `ref` en TSX) :

| Rust | TSX | Description |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | Fait défiler jusqu'à rendre l'élément `index` visible. La position dans la vue le place : 0 au début de la zone visible (par défaut), 0.5 au milieu, 1 à la fin ; le décalage de vue le déplace encore. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | Fait défiler jusqu'à un décalage du contenu le long de l'axe de la liste. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | Fait défiler jusqu'à la fin du contenu (le début d'une liste inversée). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | Fait défiler jusqu'à un décalage, comme sur une scroll view. |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

Le défilement vers un index (et vers la fin) est résolu côté natif avec les tailles connues à cet instant : les lignes mesurées là où elles l'ont été, la taille estimée ailleurs. La liste suit ensuite sa cible pendant que les lignes alentour sont mesurées, de sorte qu'elle atterrit exactement, jusqu'à ce que l'utilisateur fasse défiler ou que les éléments changent. Pour ouvrir une liste sur un élément, utilisez `initialScrollIndex` (`.initial_scroll_index(..)`) plutôt que de faire défiler après la première frame.

<a id="a-settings-style-list"></a>

## Une liste de style réglages

L'apparence d'une liste appartient à l'application : la liste place et recycle les lignes, tandis que les lignes, les séparateurs et les surfaces sont vos vues. Une liste groupée de style réglages est une liste avec un padding, un séparateur et des première et dernière lignes aux coins arrondis. Faites-en un composant à vous et utilisez-le partout où l'application affiche des réglages :

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## Notes sur les performances

- Chaque cellule est mise en page séparément : le défilement ne recalcule donc que la mise en page des cellules modifiées. Gardez des lignes peu profondes et évitez de lire des signals dans les lignes qui changent à chaque frame.
- Le côté natif demande les cellules par lots, jusqu'à plusieurs tours par frame, fusionnés en une seule mise à jour ; un fling rapide lie de nombreuses cellules en une frame sans appel à votre code par cellule. Les lignes Rust sont liées dans le cœur lui-même, au sein du commit qui en a besoin.
- Utilisez [`nsh test --trace` avec un pas `scroll`](./testing-and-trace.md#scrolling) pour mesurer le coût par frame de vos lignes.

<a id="related"></a>

## Voir aussi

- [Élément `List`](../elements/list.md) : la référence.
- [Défilement](./scrolling.md) : les props de défilement que les listes partagent avec les scroll views.
- [Réactivité](./reactivity.md) : pourquoi les lignes lisent leur position dans des bindings.
- [Performances](./performance.md) : mesurer les listes.
