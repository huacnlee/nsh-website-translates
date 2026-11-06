---
title: "Mise en page"
description: "Flexbox avec une direction en colonne par défaut, CSS grid, tailles et pourcentages, ratio d'aspect, positionnement absolu, mesure avec onLayout, mises en page adaptatives et de droite à gauche, en Rust et TSX."
order: 34
group: ui
demo: guide-layout
source_hash: f4073f703fc9be46
---

# Layout

NSH positionne chaque élément avec [Taffy](https://github.com/DioxusLabs/taffy), une implémentation en Rust des layouts flexbox, grid et block de CSS, configurée pour que les enfants s'empilent verticalement et ne rétrécissent pas par défaut. Le layout s'exécute dans le cœur, après chaque tour de votre code, et seules les frames modifiées sont envoyées aux vues natives. Le texte est mesuré par le moteur de texte de la plateforme sur le même thread : le layout n'attend donc jamais le thread principal.

Les propriétés de layout ci-dessous sont des propriétés de style. En Rust, ce sont des méthodes de style typées (`.flex_row()`, `.gap_4()`, `.grid_cols(3)`, `.absolute().inset_0()`) ; en TSX, ce sont des clés de la prop `style`, et chacune a une classe [Tailwind](./tailwind.md) (`flex-row`, `gap-4`, `grid-cols-3`, `absolute inset-0`, ...). Toutes aboutissent aux mêmes styles natifs.

## Flexbox

Une vue positionne ses enfants avec flexbox. Une vue qui ne définit pas `display` empile ses enfants en colonne ; `display: "flex"` dans un style produit une ligne, sauf si `flexDirection` est défini, exactement comme en CSS et comme la classe Tailwind `flex`. Lorsque rien ne les définit, ces valeurs par défaut s'appliquent :

| Propriété | Défaut NSH | Défaut web |
|---|---|---|
| `flexDirection` | `"column"` (une vue qui ne définit pas `display`) ; `"row"` dès que `display: "flex"` est défini | `row` |
| `flexShrink` | `0` | `1` |
| `alignContent` | `"flex-start"` (grilles : `"normal"`) | `normal` |
| `alignItems` | `"stretch"` | `stretch` |
| `minWidth` / `minHeight` | `0` | `auto` |
| `position` | `"relative"` | `static` |

```rust tabs
view()
    .flex_row()
    .items_center()
    .gap_3()
    .p_4()
    .child(image(avatar).size(px(40.0)).rounded(px(20.0)))
    .child(
        view()
            .flex_1()
            .gap_0p5()
            .child(text(name).font_weight(FontWeight::SEMIBOLD))
            .child(text(message).text_color(rgb(0x6e7781)).number_of_lines(1)),
    )
    .child(text(time).text_color(rgb(0x6e7781)))
```

```tsx tabs
<View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
  <Image src={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} />
  <View style={{ flex: 1, gap: 2 }}>
    <Text style={{ fontWeight: "600" }}>{props.name}</Text>
    <Text style={{ numberOfLines: 1, color: "#6e7781" }}>{props.message}</Text>
  </View>
  <Text style={{ color: "#6e7781" }}>{props.time}</Text>
</View>
```

| Propriété | Valeurs | Rust |
|---|---|---|
| `flexDirection` | `"column"`, `"row"`, `"column-reverse"`, `"row-reverse"` | `.flex_col()`, `.flex_row()`, `.flex_col_reverse()`, `.flex_row_reverse()` |
| `justifyContent` | Axe principal : `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"center"`, `"space-between"`, `"space-around"`, `"space-evenly"`, `"stretch"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` |
| `alignItems` | Axe transversal : `"stretch"`, `"flex-start"`, `"flex-end"`, `"start"`, `"end"`, `"self-start"`, `"self-end"`, `"center"`, `"baseline"` | `.items_stretch()`, `.items_start()`, `.items_center()`, `.items_end()`, `.items_baseline()` |
| `alignSelf` | Alignement d'un enfant sur l'axe transversal ; `"auto"` suit le `alignItems` du parent | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` |
| `alignContent` | Lignes d'un conteneur multiligne | |
| `flexWrap` | `"nowrap"`, `"wrap"`, `"wrap-reverse"` | `.flex_wrap()` |
| `flex` | Une notation abrégée à un seul nombre (voir ci-dessous) | `.flex_1()`, `.flex_auto()`, `.flex_none()` |
| `flexGrow`, `flexShrink`, `flexBasis` | Comme en CSS | `.flex_grow(n)`, `.flex_shrink(n)`, `.flex_shrink_0()`, `.basis(length)` |
| `gap`, `rowGap`, `columnGap` | Espace entre les enfants | `.gap(length)`, `.gap_y(length)`, `.gap_x(length)`, et les paliers `.gap_2()`, `.gap_x_4()`, ... |

`flex-start` et `flex-end` suivent la direction flex ; `start` et `end` suivent la direction d'écriture, comme en CSS (de droite à gauche, `start` désigne le côté droit), et `self-start` / `self-end` celle de l'enfant lui-même.

`flex` est la notation abrégée de CSS, comme le sont les classes Tailwind `flex-*` : un nombre `n` signifie croître de `n`, rétrécir de 1 et partir d'une base de 0, de sorte que des frères `flex: 1` (`.flex_1()` en Rust, `flex-1`) se partagent l'espace à parts égales, quel que soit leur contenu ; `"none"` vaut `0 0 auto` (la vue conserve sa taille), `"auto"` vaut `1 1 auto`, `"initial"` vaut `0 1 auto`, et croissance, rétrécissement et base peuvent être écrits explicitement (`"2 0 50%"`, `"1 1 120px"`). Comme les tailles minimales valent 0 par défaut, `flex: 0` (`0 1 0`) réduit une vue à rien, sauf si `minWidth: "auto"` lui conserve la taille de son contenu.

```rust tabs
view()
    .flex_row()
    .gap_2()
    // One share.
    .child(view().flex_1().h(px(36.0)).bg(rgb(0xc8e1ff)))
    // Two shares.
    .child(view().flex_grow(2.0).flex_shrink(1.0).basis(px(0.0)).h(px(36.0)).bg(rgb(0x79b8ff)))
    // Fixed.
    .child(view().size(px(36.0)).bg(rgb(0x0366d6)))
```

```tsx tabs
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 36, backgroundColor: "#c8e1ff" }} />   {/* one share */}
  <View style={{ flex: 2, height: 36, backgroundColor: "#79b8ff" }} />   {/* two shares */}
  <View style={{ width: 36, height: 36, backgroundColor: "#0366d6" }} /> {/* fixed */}
</View>
```

Comme les tailles minimales valent 0 par défaut, un texte `flex: 1` dans une ligne rétrécit et passe à la ligne au lieu de repousser ses frères hors du conteneur. `minWidth: "auto"` / `minHeight: "auto"` (`min-w-auto` / `min-h-auto`, `.min_w(auto())` en Rust) correspond au minimum automatique de CSS : un élément qui rétrécit s'arrête à la plus petite taille de son contenu, soit le mot le plus long d'un texte, comme sur le web.

> [!NOTE]
> `display: "flex"` signifie une ligne, dans un style, une classe (`flex`) et en Rust (`.flex()`) indifféremment, sauf si une direction est définie : `{ display: "flex", flexDirection: "column" }`, `flex flex-col`, `.flex().flex_col()`. Une vue sans `display` n'a besoin de rien pour être une colonne.

<a id="sizes"></a>

## Tailles

| Propriété | Valeurs | Rust |
|---|---|---|
| `width`, `height` | Des points, un pourcentage du parent (`"50%"`) ou `"auto"` | `.w(px(120.0))`, `.h(relative(0.5))`, `.w_full()`, `.size(px(44.0))`, les paliers `.w_10()`, ... |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Des points ou des pourcentages ; `minWidth` / `minHeight` acceptent aussi `"auto"`, la plus petite taille du contenu | `.min_w(..)`, `.max_w(..)`, `.min_h(..)`, `.max_h(..)` |
| `aspectRatio` | Largeur divisée par hauteur : `1`, `16 / 9` | `.aspect_ratio(16.0 / 9.0)`, `.aspect_square()` |
| `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, ... | Des points ou des pourcentages | `.p(..)`, `.px(..)`, `.py(..)`, `.pt(..)`, ..., et les paliers `.p_4()`, `.px_2()`, ... |
| `margin`, `marginHorizontal`, `marginVertical`, `marginTop`, ... | Des points, des pourcentages ou `"auto"` | `.m(..)`, `.mx(..)`, `.my(..)`, `.mt(..)`, ..., `.mx(auto())` |

En Rust, une longueur est typée : `px(16.0)` vaut 16 points, `relative(0.5)` vaut 50 % du parent, `auto()` vaut `auto`. Les méthodes à paliers suivent l'échelle d'espacement de Tailwind, à 4 points par palier (`.p_4()` vaut 16 points, `.gap_0p5()` 2 points).

Sans taille, une vue a la taille de son contenu (plus le padding), étirée sur l'axe transversal de son parent par le `alignItems: "stretch"` par défaut. Les pourcentages sont relatifs à la taille du parent (pour le padding et la marge, comme en CSS, à sa largeur).

`aspectRatio` dimensionne l'autre dimension à partir de celle qui est connue :

```rust tabs
view().w_full().aspect_ratio(16.0 / 9.0).bg(black())
```

```tsx tabs
<View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000000" }} />
```

Les images des assets de l'application ont une taille naturelle et sont positionnées à cette taille lorsqu'aucune taille n'est donnée ([Images et assets](./images-and-assets.md)). Les images distantes n'ont aucune taille avant d'être chargées : donnez-leur-en une.

## Grid

`display: "grid"` (`.grid()` en Rust) positionne les enfants dans des pistes de grille CSS :

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xd8b9ff)))
    .child(view().h(px(60.0)).bg(rgb(0xb083f0)))
    .child(view().row_span(2).bg(rgb(0x8250df)))
    .child(view().col_start(2).col_end(4).h(px(60.0)).bg(rgb(0x6639ba)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#d8b9ff" }} />
  <View style={{ height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridRow: "span 2", backgroundColor: "#8250df" }} />
  <View style={{ gridColumn: "2 / 4", height: 60, backgroundColor: "#6639ba" }} />
</View>
```

| Propriété | Valeurs | Rust |
|---|---|---|
| `gridTemplateColumns`, `gridTemplateRows` | Listes de pistes CSS : `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, noms de lignes | `.grid_cols(3)`, `.grid_rows(2)`, `.grid_template_columns("200px 1fr")`, `.grid_template_rows(..)` |
| `gridAutoColumns`, `gridAutoRows` | Pistes des colonnes et des lignes créées implicitement | |
| `gridAutoFlow` | `"row"`, `"column"`, `"dense"`, `"row dense"`, `"column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` |
| `gridColumn`, `gridRow` | `"1 / 3"`, `"span 2"`, un numéro ou un nom de ligne : `"content-start / content-end"`, `"2 col"` (la deuxième ligne nommée `col`), `"span col"` (jusqu'à la prochaine ligne nommée `col`) | `.col_span(2)`, `.row_span(2)`, `.col_span_full()` |
| `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd` | Numéros ou noms de lignes | `.col_start(1)`, `.col_end(3)`, `.row_start(..)`, `.row_end(..)` (numéros de lignes) |
| `justifyItems`, `justifySelf` | Position des éléments dans leurs zones le long de la ligne : `"start"`, `"end"`, `"center"`, `"stretch"`, ... | |
| `alignItems`, `alignSelf` | Position des éléments dans leurs zones le long de la colonne | `.items_*()`, `.self_*()` |
| `justifyContent`, `alignContent` | Position des pistes dans la grille le long de la ligne et de la colonne | `.justify_*()` |

Les templates nomment leurs lignes entre crochets, avec un ou plusieurs noms par ligne, et les éléments sont placés grâce à ces noms, comme en CSS (en Rust, par les numéros des lignes) :

```rust tabs
view()
    .grid()
    .grid_template_columns("[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]")
    // content-start / content-end: lines 2 to 3.
    .child(view().col_start(2).col_end(3).h(px(60.0)).bg(rgb(0xb083f0)))
    // full-start / full-end: lines 1 to 4.
    .child(view().col_start(1).col_end(4).h(px(60.0)).bg(rgb(0x8250df)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "[full-start] 16px [content-start] 1fr [content-end] 16px [full-end]" }}>
  <View style={{ gridColumn: "content-start / content-end", height: 60, backgroundColor: "#b083f0" }} />
  <View style={{ gridColumn: "full-start / full-end", height: 60, backgroundColor: "#8250df" }} />
</View>
```

Dans une grille, `justifyContent` et `alignContent` valent par défaut `"normal"`, comme en CSS : les pistes dimensionnées en `auto` s'étirent pour remplir le conteneur, de sorte qu'une grille ayant une hauteur mais aucun template de lignes répartit cette hauteur entre ses lignes. Une valeur définie explicitement (`"start"`, `"center"`, `"space-between"`, ...) place les pistes comme le fait CSS. Les classes d'alignement définissent exactement ce que définit Tailwind CSS : `content-start` (`align-content: flex-start`) et `place-content-start` regroupent les pistes au début, et `content-normal` et `justify-normal` les étirent, comme dans un navigateur.

`display: "block"` utilise le layout block de CSS (enfants empilés, chacun aussi large que le conteneur), et `display: "none"` (`.hidden()`) retire la vue du layout.

<a id="absolute-positioning"></a>

## Positionnement absolu

`position: "absolute"` (`.absolute()`) sort une vue du flux et la place grâce à `top`, `right`, `bottom` et `left`, relativement à son parent :

```rust tabs
view()
    .h(px(200.0))
    .child(image(cover).absolute().inset_0())
    .child(
        view()
            .absolute()
            .left_3()
            .right_3()
            .bottom_3()
            .child(text("Caption").text_color(white()).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<View style={{ height: 200 }}>
  <Image src={cover} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
  <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
    <Text style={{ color: "#ffffff", fontWeight: "700" }}>Caption</Text>
  </View>
</View>
```

Les décalages acceptent des points et des pourcentages (`.top(..)`, `.right(..)`, `.bottom(..)`, `.left(..)`, `.inset(..)` en Rust). Une vue avec `left` et `right` (ou `top` et `bottom`) et sans taille s'étire entre les deux. Les frères suivants sont dessinés au-dessus des précédents ; `zIndex` (`.z_index(n)`) modifie cet ordre.

<a id="measuring"></a>

## Mesure

`onLayout` (`.on_layout(..)`) indique le cadre d'une vue, relatif à son parent, après chaque layout dans lequel il a changé :

```rust tabs
let width = signal(0.0_f32);

view()
    .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
    .child(text(move || format!("{} points wide", width.get())))
```

```tsx tabs
const width = signal(0);

<View onLayout={({ bounds }) => width.set(bounds.size.width)}>
  <Text>{width()} points wide</Text>
</View>
```

Le cadre est exprimé en points : `Bounds<Points>` en Rust, `{ bounds }` en TSX, un `Bounds` (`{ origin: { x, y }, size: { width, height } }`). Pour la fenêtre entière, lisez `window()` en Rust ou `windowSize()` depuis [`nsh`](../modules/nsh.md#device) en TSX ; les deux suivent la rotation et le redimensionnement de la fenêtre, et un style qui les lit évolue avec la fenêtre :

```rust tabs
view().style_when(|| window().width > px(600.0), |s| s.flex_row())
```

```tsx tabs
import { View } from "nsh";
import { windowSize } from "nsh";

<View style={{ flexDirection: windowSize().width > 600 ? "row" : "column" }} />
```

Les breakpoints de Tailwind (`sm:`, `md:`, ...) et `portrait:` / `landscape:` donnent le même résultat sans code.

<a id="safe-areas"></a>

## Zones sûres

La vue racine couvre tout l'écran, sous la barre d'état et l'indicateur d'accueil. Ajoutez un padding correspondant aux marges de la zone sûre avec `env()` de CSS (`paddingTop: "env(safe-area-inset-top)"`, Tailwind `pt-[env(safe-area-inset-top)]`, `.p_safe_area()` en Rust ; voir [Zone sûre](../elements/safe-area.md)), ou lisez les marges avec `safe_area()` en Rust ou `safeArea()` / `safeAreaInsets()` en TSX et appliquez-les vous-même. Les pages d'une [pile de navigation](./navigation.md) se trouvent déjà sous leur en-tête.

<a id="right-to-left"></a>

## De droite à gauche

La direction du layout de l'application suit la langue du système, et le style `direction` d'une vue (`"ltr"`, `"rtl"` ou `"inherit"` ; `.direction(LayoutDirection::Rtl)` en Rust) définit la direction de son sous-arbre. Lorsque l'application est positionnée de droite à gauche :

- les lignes se déroulent à partir de la droite ;
- `left` et `right` conservent leurs côtés, comme dans un navigateur, aussi bien dans les clés de style que dans les classes : `paddingLeft`, `marginLeft`, `left`, `borderLeftWidth`, `borderTopLeftRadius`, `textAlign: "left"` et `pl-4`, `ml-2`, `left-0`, `border-l`, `rounded-tl-lg`, `text-left` restent à gauche ;
- les propriétés logiques suivent la direction, le début de ligne étant le côté droit : `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, `borderEndColor`, `borderTopStartRadius`, ..., `textAlign: "start"` / `"end"` (`ps-4`, `ms-2`, `start-0`, `border-s`, `rounded-ss-lg`, `text-start` en classes ; `.ms(..)`, `.me(..)`, `.ps(..)`, `.pe(..)`, `.border_s(..)`, `.rounded_ss(..)`, ... en Rust) ; `marginHorizontal` et `paddingHorizontal` définissent les deux côtés ;
- le texte avec `textAlign: "auto"` s'aligne à droite, et les contrôles natifs sont inversés.

```rust tabs
view()
    .flex_row()
    .gap_2()
    .child(view().ms_4().rounded_ss(px(12.0)).size(px(44.0)).bg(rgb(0x54aeff)))

let rtl = signal(false);
view()
    .direction(move || if rtl.get() { LayoutDirection::Rtl } else { LayoutDirection::Ltr })
    .on_press(move |_: &()| rtl.set(!rtl.get()))
    .child(text(move || if rtl.get() { "Right to left" } else { "Left to right" }))
```

```tsx tabs
import { signal, Text, View } from "nsh";

const rtl = signal(false);

<View style={{ direction: rtl() ? "rtl" : "ltr" }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <View style={{ marginStart: 16, borderTopStartRadius: 12, width: 44, height: 44, backgroundColor: "#54aeff" }} />
  </View>
  <View onPress={() => rtl.set(!rtl())}>
    <Text>{rtl() ? "Right to left" : "Left to right"}</Text>
  </View>
</View>
```

Les changements de direction, qu'il s'agisse de celle de la langue ou de celle d'une vue, s'appliquent immédiatement, sans redémarrage. Le style `direction` permet aussi de garder une vue et ses enfants dans une direction propre, par exemple un numéro de téléphone de gauche à droite. Sur Android, les applications qui intègrent NSH ont besoin de `android:supportsRtl="true"` dans leur manifeste pour que les contrôles natifs soient inversés.

<a id="related"></a>

## Voir aussi

- [Styling](./styling.md) : comment les styles se combinent.
- [Scrolling](./scrolling.md) et [Lists](./lists.md) : contenu plus grand que l'écran.
- [Style reference](../modules/style-reference.md) : chaque propriété de layout et son type.
