---
title: "Référence des styles"
description: "Toutes les clés de style acceptées par NSH, regroupées par LayoutStyle, ViewStyle, TextStyle, InputStyle et ImageStyle, avec leur type et leur signification."
order: 16
source_hash: 012ce37fb9fe065c
---

# Référence des styles

Cette page liste chaque clé de la prop `style`, ainsi que la méthode de `Styled` qui la définit en Rust. Les composants Rust stylent les éléments avec des méthodes typées nommées d'après les utilitaires de Tailwind (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`, depuis `nsh_core::prelude`), qui se réduisent aux mêmes clés ; TSX passe des objets `style` (et des classes). La colonne Rust indique la méthode ; la plupart acceptent une valeur, un signal ou une closure, et `.style_when(…)` / `.style_with(…)` rendent n'importe laquelle conditionnelle. Les clés et leurs types proviennent des déclarations générées dans `.nsh/types/nsh/types.d.ts`, si bien que votre éditeur les vérifie pendant la saisie. Une clé de style désigne la propriété CSS du même nom, comme la classe qui la définit : `paddingLeft` correspond à `padding-left` et `pl-4` en CSS, `boxShadow` à `box-shadow` et `shadow-md` ; quelques clés prennent des noms plus simples, ceux qu'écrivent les applications (`paddingHorizontal` pour `padding-inline`, `marginStart` pour `margin-inline-start`, `numberOfLines` pour `line-clamp`). Les nombres sont des points, et les fonctionnalités CSS sont aussi présentes : grille, dégradés, ombres portées, filtres, modes de fusion, contours, transformations, transitions et animations par keyframes.

Pour savoir comment appliquer les styles, les combiner avec des classes et hériter des styles de texte, consultez [Styles](../docs/styling.md). Pour la syntaxe des classes, consultez la [référence Tailwind](./tailwind-reference.md).

<a id="the-five-interfaces"></a>

## Les cinq interfaces

Chaque interface étend la précédente :

| Interface | Étend | Utilisée par |
|---|---|---|
| `LayoutStyle` | | Mise en page de chaque élément (flexbox, grille, tailles, espacements, position) |
| `ViewStyle` | `LayoutStyle` | `<View>`, `<Scroll>`, `<List>`, les contrôles et tous les autres éléments |
| `TextStyle` | `ViewStyle` | `<Text>` et `<Input>` (et les vues, dont les styles de texte passent au texte qu'elles contiennent) |
| `InputStyle` | `TextStyle` | `<Input>` : ajoute `placeholderColor` et `caretColor` |
| `ImageStyle` | `ViewStyle` | `<Image>` |

```rust tabs
use nsh_core::prelude::*;

fn card() -> View {
    view().p_4().rounded(px(12.0)).bg(white()).shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x00000014).into(),
        ..BoxShadow::default()
    }])
}

fn title(label: &str) -> Text {
    text(label.to_string()).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD).text_color(rgb(0x111111))
}

card().child(title("Hello"))
```

```tsx tabs
import type { ViewStyle, TextStyle } from "nsh";
import { Text, View } from "nsh";

const card: ViewStyle = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

const title: TextStyle = { fontSize: 17, fontWeight: "600", color: "#111" };

<View style={card}>
  <Text style={title}>Hello</Text>
</View>;
```

`style` accepte aussi un tableau ; les entrées sont fusionnées de gauche à droite et les entrées falsy sont ignorées, ce qui évite d'utiliser la décomposition (spread) pour les styles conditionnels. En Rust, `.style_when(condition, …)` ajoute des styles tant que la condition est vraie :

```rust tabs
card().style_when(selected, |s| s.border_color(rgb(0x2563eb)).border(px(2.0)))
```

```tsx tabs
<View style={[card, selected() && { borderColor: "#2563eb", borderWidth: 2 }]} />
```

> [!NOTE]
> Le `style` en ligne l'emporte toujours sur `class`. Affecter `null` ou `undefined` à une clé la réinitialise à sa valeur par défaut.

<a id="how-style-keys-read"></a>

## Comment lire les clés de style

Les clés de style suivent le CSS : un style et une classe qui désignent la même propriété produisent le même effet.

- **Direction de la mise en page.** Une vue qui ne définit pas `display` dispose ses enfants en colonne. `display: "flex"` donne une ligne sauf si `flexDirection` est défini, comme en CSS et avec la classe `flex`. `flexShrink` vaut `0` sauf indication contraire.
- **Côtés physiques et logiques.** `left`, `right`, `marginLeft`, `paddingRight`, `borderLeftWidth`, `borderTopLeftRadius` et `textAlign: "left"` conservent leur côté dans les mises en page de droite à gauche. Les clés de début et de fin (`marginStart`, `paddingEnd`, `start`, `end`, `borderStartWidth`, ...), la famille `borderTopStartRadius` et `textAlign: "start" | "end"` suivent la direction : le début en ligne est la gauche dans les mises en page de gauche à droite et la droite dans celles de droite à gauche.
- **Couleurs de bordure.** Une bordure ou un contour dont l'épaisseur est définie mais pas la couleur est dessiné avec la couleur du texte (`currentColor` en CSS).
- **Transformations.** `translate`, `rotate` et `scale` sont des propriétés à part entière, et `transform` accepte la chaîne de fonctions CSS ou une liste d'étapes dont les valeurs peuvent être des valeurs animées. Elles se composent dans cet ordre : `translate`, `rotate`, `scale`, puis `transform`.

<a id="value-types"></a>

## Types de valeurs

| Type | Accepte | Rust |
|---|---|---|
| `number` | Points (indépendants de la densité). `1` vaut un point sur iOS et un dp sur Android. | `Points` : `px(16.0)` |
| `DimensionValue` | `number` (points), `` `${number}%` `` (du parent), ou `"auto"`. | `Length` : `px(…)`, `relative(0.5)`, `auto()` |
| `LengthValue` | `number` (points) ou `` `${number}%` ``. Pas de `"auto"`. | `DefiniteLength` : `px(…)`, `relative(0.5)` |
| `ColorValue` | Une chaîne de couleur CSS : `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`, ou une couleur CSS nommée (`black`, `white`, `transparent`, `rebeccapurple`, ...). | `Hsla` / `AdaptiveColor` : `rgb(0x2563eb)`, `hsla(…)`, couleurs du thème (`theme().primary`) |
| `EnvValue` | Une variable d'environnement dans un padding ou une marge : `env(name)`, `env(name, <length>)` (la longueur remplace un nom inconnu), `calc(env(name) + <length>)` ou `calc(<length> + env(name))`. Les noms sont `safe-area-inset-top`, `-right`, `-bottom`, `-left` ([Zone de sécurité](../elements/safe-area.md)) et `keyboard-inset-height` ([Clavier](../elements/keyboard.md)). Acceptée par les clés physiques de padding et de marge et leurs raccourcis. | `.p_safe_area()`, `.pt_safe_area_plus(px(8.0))`, `.pb_keyboard()`, `.mb_keyboard_plus(…)`, ... |
| `AnimatedNode` | Une valeur animée native ou un nœud qui en dérive (voir [l'API d'animation de `nsh`](./nsh.md#animation)). Acceptée par `opacity`, `backgroundColor`, `borderColor`, `color`, `translate`, `rotate`, `scale`, les étapes d'une liste `transform`, et les `top` / `left` d'une vue sticky ; la valeur s'anime alors sur le thread UI sans JS. | `AnimatedValue` / `AnimatedNode`, liée avec `.bind_opacity(&v)`, `.bind_background(&v)`, `.bind_border_color(&v)`, `.bind_color(&v)`, `.bind_translate_x(&v)`, ... |

Les chaînes à syntaxe CSS (`boxShadow`, `textShadow`, `backgroundImage`, `filter`, `gridTemplateColumns`, ...) acceptent des longueurs en `px` et des nombres sans unité (tous deux en points), en `pt` (4/3 de point, comme en CSS) ou en `rem` (16 points).

## LayoutStyle

La mise en page est calculée en Rust (flexbox et grille CSS). Une vue qui ne définit pas `display` est un conteneur flex dont les enfants s'empilent en colonne ; `display: "flex"` en fait une ligne sauf si `flexDirection` est défini, comme en CSS. Par défaut, les éléments ont `flexShrink: 0`, `alignContent: "flex-start"` (grilles : `"normal"` du CSS), `alignItems: "stretch"`, et aucune taille minimale automatique. Voir [Mise en page](../docs/layout.md).

<a id="display-and-position"></a>

### Affichage et position

| Clé | Type | Rust | Description |
|---|---|---|---|
| `display` | `"flex" \| "grid" \| "block" \| "flow-root" \| "none"` | `.flex()`, `.grid()`, `.hidden()` | La mise en page des enfants. `"flex"` les dispose en ligne sauf si `flexDirection` définit une direction, comme en CSS ; une vue qui ne définit pas display les dispose en colonne. `"none"` retire l'élément de la mise en page et le masque. `"block"` empile les enfants comme le fait la mise en page de bloc CSS. |
| `boxSizing` | `"border-box" \| "content-box"` | | Les dimensions incluent les bordures et le padding, ou uniquement le contenu. Par défaut `"border-box"`. |
| `position` | `"relative" \| "absolute" \| "static" \| "fixed" \| "sticky"` | `.relative()`, `.absolute()` | `"absolute"` sort l'élément du flux et le place avec `top` / `right` / `bottom` / `left` par rapport à son ancêtre positionné le plus proche (son parent, sauf si celui-ci est `"static"`). `"static"` reste dans le flux et ignore les décalages. `"fixed"` préserve le type de l'élément, le met en page et le monte dans sa surface ou sa racine modale, en le gardant en place pendant que le contenu environnant défile. `"sticky"` reste dans le flux et, tant que son parent est visible, se fixe à `top` (`left` dans une vue à défilement horizontal) depuis le début de la zone visible de la vue à défilement qui l'entoure, jusqu'à ce que sa fin rejoigne celle de la boîte de contenu de son parent ; il est dessiné au-dessus de ses frères du même `zIndex`. Par défaut `"relative"`. |
| `top` | `DimensionValue \| AnimatedNode` | `.top(…)`, `.inset(…)`, `.bind_sticky_top(&node)` | Décalage depuis le bord supérieur du parent (absolute) ou depuis la position propre de l'élément (relative). Sur une vue sticky, l'endroit où elle se fixe, qu'une valeur animée déplace à chaque frame. |
| `right` | `DimensionValue` | `.right(…)` | Décalage depuis le bord droit, quelle que soit la direction. |
| `bottom` | `DimensionValue` | `.bottom(…)` | Décalage depuis le bord inférieur. |
| `left` | `DimensionValue \| AnimatedNode` | `.left(…)`, `.bind_sticky_left(&node)` | Décalage depuis le bord gauche, quelle que soit la direction. Sur une vue sticky dans une vue à défilement horizontal, l'endroit où elle se fixe, qu'une valeur animée déplace à chaque frame. |
| `start` | `DimensionValue` | | Décalage depuis le bord de début en ligne : gauche dans les mises en page de gauche à droite, droite dans celles de droite à gauche. |
| `end` | `DimensionValue` | | Décalage depuis le bord de fin en ligne : droite dans les mises en page de gauche à droite, gauche dans celles de droite à gauche. |
| `zIndex` | `number` | `.z_index(z)` | Ordre parmi les frères (stable pour des valeurs égales) ; c'est aussi l'ordre d'empilement natif. |
| `direction` | `"inherit" \| "ltr" \| "rtl"` | | Direction de la mise en page, héritée par défaut. Comme en CSS, les propriétés `left` et `right` conservent leurs côtés de droite à gauche, tandis que celles de début / fin en ligne (`marginStart`, `end`, ...) prennent les côtés que leur donne la direction. |

### Flexbox

| Clé | Type | Rust | Description |
|---|---|---|---|
| `flexDirection` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `.flex_row()`, `.flex_col()`, `.flex_row_reverse()`, `.flex_col_reverse()` | L'axe principal. Par défaut `"column"` pour une vue qui ne définit pas `display`, `"row"` dès que `display: "flex"` est défini. |
| `flexWrap` | `"wrap" \| "nowrap" \| "wrap-reverse"` | `.flex_wrap()` | Indique si les enfants passent à la ligne sur plusieurs lignes. Par défaut `"nowrap"`. |
| `flex` | `number` | `.flex_1()`, `.flex_auto()`, `.flex_none()` | Un seul nombre, pas le raccourci CSS : un nombre positif lui fixe `flexGrow`, `flexShrink: 1` et `flexBasis: 0` ; `0` rend l'élément non flexible ; un nombre négatif le fait rétrécir jusqu'à sa taille minimale. |
| `flexGrow` | `number` | `.flex_grow(f)` | La part de l'espace libre que prend l'élément. Par défaut `0`. |
| `flexShrink` | `number` | `.flex_shrink(f)`, `.flex_shrink_0()` | Le degré de rétrécissement de l'élément lorsque l'espace manque. Par défaut `0`, et non `1` comme en CSS. |
| `flexBasis` | `DimensionValue` | `.basis(…)` | La taille sur l'axe principal avant la répartition de l'espace libre. |
| `justifyContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "space-between" \| "space-around" \| "space-evenly" \| "stretch" \| "normal"` | `.justify_start()`, `.justify_center()`, `.justify_end()`, `.justify_between()`, `.justify_around()`, `.justify_evenly()` | Répartition des enfants le long de l'axe principal. Par défaut `"normal"` : `"flex-start"` dans les conteneurs flex ; dans les grilles, les pistes dimensionnées `auto` s'étirent. |
| `alignItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.items_start()`, `.items_center()`, `.items_end()`, `.items_stretch()`, `.items_baseline()` | Alignement des enfants sur l'axe transversal. Par défaut `"stretch"`. |
| `alignSelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | `.self_start()`, `.self_center()`, `.self_end()`, `.self_stretch()` | Remplace le `alignItems` du parent pour cet élément. |
| `alignContent` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "center" \| "stretch" \| "space-between" \| "space-around" \| "space-evenly" \| "normal"` | `.content_start()`, `.content_center()`, `.content_between()`, … | Répartition des lignes enveloppées (et des pistes de grille) sur l'axe transversal. Par défaut `"flex-start"` dans les conteneurs flex et `"normal"` dans les grilles, où les pistes dimensionnées `auto` s'étirent. `"start"` / `"end"` suivent la direction d'écriture. |
| `gap` | `LengthValue` | `.gap(…)`, `.gap_4()` | Espace entre les lignes et les colonnes d'enfants. |
| `rowGap` | `LengthValue` | `.gap_y(…)` | Espace entre les lignes. |
| `columnGap` | `LengthValue` | `.gap_x(…)` | Espace entre les colonnes. |

<a id="grid"></a>

### Grille

Définissez `display: "grid"` pour disposer les enfants dans une grille CSS. Les listes de pistes utilisent la syntaxe CSS.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `gridTemplateColumns` | `string` | `.grid_template_columns(…)`, `.grid_cols(n)` | Pistes de colonnes : `"repeat(3, 1fr)"`, `"200px 1fr"`, `minmax()`, `auto-fill` / `auto-fit`, noms de lignes (`"[a] 40px [b c] 1fr [d]"`). |
| `gridTemplateRows` | `string` | `.grid_template_rows(…)`, `.grid_rows(n)` | Pistes de lignes, même syntaxe. |
| `gridAutoColumns` | `string` | | Taille des colonnes créées implicitement. |
| `gridAutoRows` | `string` | | Taille des lignes créées implicitement. |
| `gridAutoFlow` | `"row" \| "column" \| "dense" \| "row dense" \| "column dense"` | `.grid_flow_col()`, `.grid_flow_dense()` | Manière dont les éléments sans placement remplissent la grille. |
| `gridColumn` | `number \| string` | `.col_span(n)`, `.col_span_full()` | Placement en colonne : `"1 / 3"`, `"span 2"`, un numéro de ligne ou un nom de ligne (`"content-start / content-end"`, `"2 col"`, `"span col"`). |
| `gridColumnStart` | `number \| string` | `.col_start(…)` | Ligne de colonne de début. |
| `gridColumnEnd` | `number \| string` | `.col_end(…)` | Ligne de colonne de fin. |
| `gridRow` | `number \| string` | `.row_span(n)`, `.row_span_full()` | Placement en ligne, même syntaxe que `gridColumn`. |
| `gridRowStart` | `number \| string` | `.row_start(…)` | Ligne de rangée de début. |
| `gridRowEnd` | `number \| string` | `.row_end(…)` | Ligne de rangée de fin. |
| `justifyItems` | `"flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Manière dont les éléments de grille se placent dans leurs zones le long de la ligne. |
| `justifySelf` | `"auto" \| "flex-start" \| "flex-end" \| "start" \| "end" \| "self-start" \| "self-end" \| "center" \| "stretch" \| "baseline" \| "normal"` | | Remplace `justifyItems` pour cet élément. |

```rust tabs
view()
    .grid()
    .grid_template_columns("repeat(3, 1fr)")
    .gap_2()
    .child(view().col_span(2).h(px(60.0)).bg(rgb(0xc7d2fe)))
    .child(view().h(px(60.0)).bg(rgb(0xa5b4fc)))
```

```tsx tabs
<View style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
  <View style={{ gridColumn: "span 2", height: 60, backgroundColor: "#c7d2fe" }} />
  <View style={{ height: 60, backgroundColor: "#a5b4fc" }} />
</View>
```

<a id="size"></a>

### Taille

| Clé | Type | Rust | Description |
|---|---|---|---|
| `width` | `DimensionValue` | `.w(…)`, `.w_full()`, `.size(…)` | Largeur. |
| `height` | `DimensionValue` | `.h(…)`, `.h_full()` | Hauteur. |
| `minWidth` | `LengthValue` | `.min_w(…)` | Largeur minimale. |
| `minHeight` | `LengthValue` | `.min_h(…)` | Hauteur minimale. |
| `maxWidth` | `LengthValue` | `.max_w(…)` | Largeur maximale. |
| `maxHeight` | `LengthValue` | `.max_h(…)` | Hauteur maximale. |
| `aspectRatio` | `number \| "auto" \| "16 / 9"` | `.aspect_ratio(r)`, `.aspect_square()` | Largeur divisée par hauteur, un nombre (`1.5`) ou le ratio CSS (`"16 / 9"`) ; la dimension manquante est calculée à partir de l'autre. `"auto"` n'en définit aucun. |

<a id="margin"></a>

### Marges

Les marges acceptent `"auto"` (absorbe l'espace libre, comme en flexbox) et les valeurs négatives. Les clés physiques (toutes sauf `marginStart` / `marginEnd`) acceptent aussi un `EnvValue` : `marginBottom: "env(keyboard-inset-height)"` (en Rust `.mb_keyboard()`, `.mt_safe_area()`, ...).

| Clé | Type | Rust | Description |
|---|---|---|---|
| `margin` | `DimensionValue \| EnvValue` | `.m(…)`, `.m_4()` | Les quatre côtés. |
| `marginHorizontal` | `DimensionValue \| EnvValue` | `.mx(…)` | Gauche et droite. |
| `marginVertical` | `DimensionValue \| EnvValue` | `.my(…)` | Haut et bas. |
| `marginTop` | `DimensionValue \| EnvValue` | `.mt(…)` | Haut. |
| `marginRight` | `DimensionValue \| EnvValue` | `.mr(…)` | Droite. |
| `marginBottom` | `DimensionValue \| EnvValue` | `.mb(…)` | Bas. |
| `marginLeft` | `DimensionValue \| EnvValue` | `.ml(…)` | Gauche. |
| `marginStart` | `DimensionValue` | `.ms(…)` | Début en ligne : gauche dans les mises en page de gauche à droite, droite dans celles de droite à gauche. |
| `marginEnd` | `DimensionValue` | `.me(…)` | Fin en ligne : le côté opposé à `marginStart`. |

### Padding

Les clés physiques (toutes sauf `paddingStart` / `paddingEnd`) acceptent aussi un `EnvValue` : `paddingTop: "env(safe-area-inset-top)"`, `paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)"` (en Rust `.pt_safe_area()`, `.pb_safe_area_plus(px(16.0))`, `.pb_keyboard()`, ...). Un padding vaut au minimum 0.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `padding` | `LengthValue \| EnvValue` | `.p(…)`, `.p_4()` | Les quatre côtés. |
| `paddingHorizontal` | `LengthValue \| EnvValue` | `.px(…)` | Gauche et droite. |
| `paddingVertical` | `LengthValue \| EnvValue` | `.py(…)` | Haut et bas. |
| `paddingTop` | `LengthValue \| EnvValue` | `.pt(…)` | Haut. |
| `paddingRight` | `LengthValue \| EnvValue` | `.pr(…)` | Droite. |
| `paddingBottom` | `LengthValue \| EnvValue` | `.pb(…)` | Bas. |
| `paddingLeft` | `LengthValue \| EnvValue` | `.pl(…)` | Gauche. |
| `paddingStart` | `LengthValue` | `.ps(…)` | Début en ligne : gauche dans les mises en page de gauche à droite, droite dans celles de droite à gauche. |
| `paddingEnd` | `LengthValue` | `.pe(…)` | Fin en ligne : le côté opposé à `paddingStart`. |

## ViewStyle

Tout ce qui est dessiné par une vue. Toutes les clés de `LayoutStyle` s'appliquent aussi.

<a id="background"></a>

### Arrière-plan

| Clé | Type | Rust | Description |
|---|---|---|---|
| `backgroundColor` | `ColorValue \| AnimatedNode` | `.bg(color)`, `.bind_background(&node)` | La couleur de remplissage. Accepte une couleur animée native. |
| `backgroundImage` | `string` | `.bg_linear(angle)`, `.bg_radial()`, `.bg_conic()` avec `.gradient_from` / `_via` / `_to` | Dégradés CSS dessinés par-dessus la couleur d'arrière-plan : `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`, plusieurs séparés par des virgules. |

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x6366f1)).gradient_to(rgb(0xec4899))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #6366f1, #ec4899)" }} />
```
<a id="borders"></a>

### Bordures

| Clé | Type | Rust | Description |
|---|---|---|---|
| `borderWidth` | `number` | `.border(w)`, `.border_1()`, `.border_2()` | Épaisseur des quatre côtés. |
| `borderTopWidth` | `number` | `.border_t(w)` | Côté supérieur. |
| `borderRightWidth` | `number` | `.border_r(w)` | Côté droit. |
| `borderBottomWidth` | `number` | `.border_b(w)` | Côté inférieur. |
| `borderLeftWidth` | `number` | `.border_l(w)` | Côté gauche. |
| `borderStartWidth` | `number` | `.border_s(w)` | Côté de début en ligne (gauche dans les mises en page de gauche à droite, droit dans celles de droite à gauche). |
| `borderEndWidth` | `number` | `.border_e(w)` | Côté de fin en ligne. |
| `borderColor` | `ColorValue \| AnimatedNode` | `.border_color(c)`, `.bind_border_color(&node)` | Couleur des quatre côtés. Accepte une couleur animée native. |
| `borderTopColor` | `ColorValue` | `.border_t_color(c)` | Côté supérieur. |
| `borderRightColor` | `ColorValue` | `.border_r_color(c)` | Côté droit. |
| `borderBottomColor` | `ColorValue` | `.border_b_color(c)` | Côté inférieur. |
| `borderLeftColor` | `ColorValue` | `.border_l_color(c)` | Côté gauche. |
| `borderStartColor` | `ColorValue` | `.border_s_color(c)` | Côté de début en ligne. |
| `borderEndColor` | `ColorValue` | `.border_e_color(c)` | Côté de fin en ligne. |
| `borderStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.border_solid()`, `.border_dashed()`, `.border_dotted()`, `.border_none()` | Style de trait. Par défaut `"solid"`. `"none"` et `"hidden"` ne dessinent ni ne réservent aucune bordure dans la mise en page, quelles que soient les épaisseurs, définies avant ou après, comme en CSS. |

Un côté dont l'épaisseur est définie et dont la couleur n'est définie par rien est dessiné avec la couleur du texte, le `currentColor` de CSS : `{ borderWidth: 1, color: "#2563eb" }` dessine une bordure bleue. Les contours prennent la couleur du texte de la même façon.

<a id="corners"></a>

### Coins

| Clé | Type | Rust | Description |
|---|---|---|---|
| `borderRadius` | `number` | `.rounded(r)`, `.rounded_lg()` | Rayon des quatre coins. |
| `borderTopLeftRadius` | `number` | `.rounded_tl(r)` | Coin supérieur gauche. |
| `borderTopRightRadius` | `number` | `.rounded_tr(r)` | Coin supérieur droit. |
| `borderBottomRightRadius` | `number` | `.rounded_br(r)` | Coin inférieur droit. |
| `borderBottomLeftRadius` | `number` | `.rounded_bl(r)` | Coin inférieur gauche. |
| `borderTopStartRadius` | `number` | `.rounded_ss(r)` | Coin supérieur du côté de début en ligne. |
| `borderTopEndRadius` | `number` | `.rounded_se(r)` | Coin supérieur du côté de fin en ligne. |
| `borderBottomStartRadius` | `number` | `.rounded_es(r)` | Coin inférieur du côté de début en ligne. |
| `borderBottomEndRadius` | `number` | `.rounded_ee(r)` | Coin inférieur du côté de fin en ligne. |
| `borderCurve` | `"circular" \| "continuous"` | `.border_curve(curve)` | `"continuous"` : coins dont la courbure se fond progressivement dans les bords, comme les icônes d'app iOS. Lorsque la boîte est trop petite, la courbe redevient circulaire, de sorte que les pilules restent des pilules. Fonctionne sur les deux plateformes. |

<a id="outline"></a>

### Contour

Un contour est dessiné à l'extérieur de la bordure et ne prend aucune place dans la mise en page.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `outlineWidth` | `number` | `.outline(w)` | Épaisseur du trait. |
| `outlineColor` | `ColorValue` | `.outline_color(c)` | Couleur du trait. Par défaut, la couleur du texte. |
| `outlineStyle` | `"solid" \| "dashed" \| "dotted" \| "none" \| "hidden"` | `.outline_dashed()`, `.outline_dotted()`, `.outline_none()` | Style de trait. |
| `outlineOffset` | `number` | `.outline_offset(o)` | Distance depuis le bord de la bordure ; les valeurs négatives le déplacent vers l'intérieur. |

<a id="shadows"></a>

### Ombres

Une vue projette des ombres avec le `boxShadow` de CSS : plusieurs couches, ombres avec étalement et ombres internes. Les transitions l'animent (`transitionProperty: "boxShadow"`).

| Clé | Type | Rust | Description |
|---|---|---|---|
| `boxShadow` | `string \| BoxShadowLayer[]` | `.shadow([BoxShadow { … }])`, `.shadow_md()`, `.shadow_color(c)` | `box-shadow` CSS : décalages, flou, étalement et couleur, plusieurs couches séparées par des virgules, `inset` pour les ombres internes ; ou ses couches sous forme de nombres, `[{ x, y, blur, spread, color, inset }]` (seuls `x` et `y` sont requis) ; une couche sans couleur est dessinée avec la couleur du texte, comme le `currentColor` de CSS. `.shadow_color(c)` recolore les couches d'un préréglage ou de `.shadow(…)`. |

```rust tabs
view().p_4().rounded(px(12.0)).bg(white()).shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x0000000f).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), spread: px(-4.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
```

```tsx tabs
<View style={{ padding: 16, borderRadius: 12, backgroundColor: "#fff",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.12)" }} />
```

> [!NOTE]
> Sur Android, les ombres nécessitent un arrière-plan : une vue à arrière-plan transparent (du texte sans fond, par exemple) ne projette aucune ombre. Pour l'ombre material d'Android, utilisez plutôt la prop `android={{ elevation }}` au lieu d'un style.

<a id="opacity-visibility-and-overflow"></a>

### Opacité, visibilité et débordement

| Clé | Type | Rust | Description |
|---|---|---|---|
| `opacity` | `number \| AnimatedNode` | `.opacity(o)`, `.bind_opacity(&value)` | De 0 (invisible) à 1. Accepte une valeur animée native. |
| `visibility` | `"visible" \| "hidden" \| "collapse"` | | Les vues masquées conservent leur espace dans la mise en page (contrairement à `display: "none"`). |
| `overflow` | `"visible" \| "hidden"` | `.overflow_hidden()` | `"hidden"` rogne les enfants aux limites de la vue (et à ses coins). |
| `backfaceVisibility` | `"visible" \| "hidden"` | `.backface_hidden()`, `.backface_visible()` | `"hidden"` : invisible lorsqu'une rotation 3D la détourne. |
| `verticalAlign` | `"baseline" \| "text-top" \| "text-bottom" \| "middle"` | `.align_baseline()`, `.align_text_top()`, `.align_text_bottom()`, `.align_middle()` | Où une vue ou une image à l'intérieur d'un `<Text>` se place dans sa ligne, comme le `vertical-align` de CSS : son bas sur la ligne de base (par défaut), son haut ou son bas au haut ou au bas de la police du texte, ou son milieu à la moitié de la hauteur d'x au-dessus de la ligne de base. La ligne s'agrandit pour l'accueillir. |

<a id="transforms"></a>

### Transformations

Les transformations sont celles de CSS : les propriétés `translate`, `rotate` et `scale` puis `transform`, composées dans cet ordre. Chacune est une propriété à part entière, donc le `scale` d'un style remplace le `scale-*` d'une classe et conserve son `rotate-*`, et le `transform` d'un style remplace les fonctions de transformation d'une classe (`rotate-x-*`, `skew-*`).

| Clé | Type | Rust | Description |
|---|---|---|---|
| `translate` | `string \| number \| AnimatedNode \| [x, y]` | `.translate_x(…)`, `.translate_y(…)` ; `.bind_translate_x(&v)`, `.bind_translate_y(&v)` | `translate` de CSS : x, puis y (`"10px 20px"` ; pourcentages de la taille propre de la vue, `"-50% 0"`). Un nombre correspond à des points le long de x. `[x, y]` accepte un nombre, une chaîne (`"50%"`, `"10px"`) ou une valeur animée par axe ; une valeur animée seule la déplace le long de x. |
| `rotate` | `string \| number \| AnimatedNode` | `.rotate(deg(…))` ; `.bind_rotate(&v)` | `rotate` de CSS : `"45deg"`, `"0.5turn"`, ou autour d'un axe, `"x 90deg"`. Un nombre, comme une valeur animée, représente des degrés autour de z, dans le sens horaire. |
| `scale` | `string \| number \| AnimatedNode \| [x, y]` | `.scale(f)`, `.scale_x(f)`, `.scale_y(f)` ; `.bind_scale(&v)` | `scale` de CSS : `1.5`, `"150%"`, x et y (`"1 2"`). Une valeur animée met à l'échelle les deux axes ; `[x, y]` accepte un nombre ou une valeur animée par axe. |
| `transform` | `string \| TransformStep[]` | `.rotate_x(…)`, `.rotate_y(…)`, `.skew_x(…)`, `.skew_y(…)`, `.transform_none()` ; étapes animées : `.bind_transform(kind, &v)`, `.bind_motion(&m)` (après toutes les transformations du style) | `transform` de CSS : `"translateX(10px) rotate(45deg) scale(1.5)"`, ou `"none"`. Fonctions : `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`. Les longueurs acceptent `px` (les translations aussi `%`, de la taille propre de la vue), les angles `deg`, `rad` ou `turn`. Ou une liste d'étapes dont les quantités peuvent être des valeurs animées : ce que la chaîne ne peut pas contenir, comme une rotation 3D animée (`[{ perspective: 800 }, { rotateY: angle }]`), et les canaux d'un mouvement (`m.transform`). Le `transform` d'un style prend l'une ou l'autre forme, donc une perspective placée avant des étapes animées est elle-même une étape de la liste. Appliquée après `translate`, `rotate` et `scale`. |
| `transformOrigin` | `string \| (number \| string)[]` | `.transform_origin(…)`, `.origin_top_left()`, ... | Le point autour duquel agissent les transformations : mots-clés, pourcentages et longueurs (`"top left"`, `"50% 0"`, `[10, 20]`). Par défaut, le centre. |

Une `TransformStep` est un objet à une seule clé, appliquée dans l'ordre de la liste :

| Étape | Valeur | Animée nativement |
|---|---|---|
| `translateX`, `translateY` | `number` (points) | oui |
| `scale`, `scaleX`, `scaleY` | `number` (facteur) | oui |
| `rotate`, `rotateZ`, `rotateX`, `rotateY` | `number` (degrés) ou `string` (`"45deg"`, `"0.5rad"`) | oui |
| `skewX`, `skewY` | `number` (degrés) ou `string` | non |
| `perspective` | `number` (points) | non |

```rust tabs
view().perspective(px(600.0)).child(view().rotate_y(deg(20.0)).scale(0.95))
```

```tsx tabs
<View style={{ transform: "perspective(600px) rotateY(20deg) scale(0.95)" }} />
```

Une valeur animée pilote directement `translate`, `rotate` et `scale`, ainsi que les étapes d'une liste `transform` :

```tsx
const x = createAnimatedValue(0);
const angle = createAnimatedValue(0);

<View style={{ translate: [x, 0], rotate: angle }} />
<View style={{ transform: [{ perspective: 800 }, { rotateY: angle }] }} />
```

> [!NOTE]
> Android ne dessine aucune inclinaison : `skew()`, `skewX()` et `skewY()` y laissent la vue non inclinée.

<a id="filters-and-blending"></a>

### Filtres et fusion

| Clé | Type | Rust | Description |
|---|---|---|---|
| `filter` | `string` | `.blur(r)`, `.brightness(…)`, `.contrast(…)`, `.grayscale(…)`, `.hue_rotate(…)`, `.invert(…)`, `.saturate(…)`, `.sepia(…)` | Filtres CSS de la vue et de son contenu : `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()`. |
| `backdropFilter` | `string` | `.backdrop_blur(r)`, `.backdrop_brightness(…)`, ... | Filtres CSS de ce qui se trouve derrière la vue, comme `"blur(10px)"` pour un effet de verre dépoli. |
| `maskImage` | `string` | | Un dégradé CSS dont l'alpha décide de la part de la vue qui est dessinée, entièrement là où il est opaque et pas du tout là où il est transparent : `linear-gradient(...)`, `radial-gradient(...)`, `conic-gradient(...)`. Masque tout ce que la vue dessine, y compris son filtre d'arrière-plan. |
| `glassEffect` | `"none" \| "regular" \| "clear"` | `.glass_effect(GlassEffect::Regular)` | Liquid Glass derrière le contenu de la vue sur iOS 26 et macOS 26 et versions ultérieures. `"regular"` utilise le matériau standard ; `"clear"` prend moins de couleur à l'arrière-plan. `"none"` est la valeur par défaut. À associer à `backdropFilter` pour le flou affiché sur les versions antérieures d'iOS et sur les autres plateformes. |
| `mixBlendMode` | `"normal" \| "multiply" \| "screen" \| "overlay" \| "darken" \| "lighten" \| "color-dodge" \| "color-burn" \| "hard-light" \| "soft-light" \| "difference" \| "exclusion" \| "hue" \| "saturation" \| "color" \| "luminosity" \| "plus-darker" \| "plus-lighter"` | `.mix_blend_mode(mode)` | Comment la vue se fond avec ce qui se trouve derrière elle. |

> [!WARNING]
> Limites selon la plateforme :
> - iOS applique uniquement `opacity()`, `brightness()` jusqu'à 1 et `drop-shadow()` aux vues. `<Image>` accepte tous les filtres de couleur et `blur()`, appliqués pendant le décodage de l'image.
> - Le flou `backdropFilter` sur iOS utilise un matériau système à une fraction, une approximation du rayon exact.
> - Android nécessite l'API 31 pour `blur()`, `drop-shadow()` et `backdropFilter` ; en dessous, seuls les filtres de couleur s'appliquent. Les modes de fusion nécessitent l'API 29.

### Transitions

Lorsqu'une propriété dotée d'une transition change (à partir d'un nouveau style, d'une classe ou d'une variante telle que `active:`), la plateforme l'anime nativement. Aucun JS ne s'exécute pendant l'animation.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `transitionProperty` | `string` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_shadow()`, `.transition_transform()`, `.transition_none()` | Propriétés à animer, séparées par des virgules : `"all"`, `"colors"` (`color`, `backgroundColor`, `borderColor`, ...), `"opacity"`, `"transform"` (toutes les propriétés de transformation), `"boxShadow"`, `"borderRadius"`, `"borderWidth"`, ou `"none"`. |
| `transitionDuration` | `number \| "${number}ms" \| "${number}s"` | `.duration(ms)` | Millisecondes sous forme de nombre, ou `"150ms"` / `"0.2s"`. |
| `transitionDelay` | `number \| "${number}ms" \| "${number}s"` | `.delay(ms)` | Délai avant le début de la transition. |
| `transitionTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(…)` | La courbe d'accélération. |

```rust tabs
view()
    .on_press(move || open.update(|o| *o = !*o))
    .h(move || px(if open.get() { 160.0 } else { 56.0 }))
    .opacity(move || if open.get() { 1.0 } else { 0.8 })
    .transition()
    .duration(200.0)
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{ height: open() ? 160 : 56, opacity: open() ? 1 : 0.8,
    transitionProperty: "opacity, transform", transitionDuration: 200 }}
/>
```

<a id="keyframe-animations"></a>

### Animations par images clés

Animations par images clés intégrées, exécutées nativement (`animate-*` de Tailwind).

| Clé | Type | Rust | Description |
|---|---|---|---|
| `animationName` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | `.animate_spin()`, `.animate_ping()`, `.animate_pulse()`, `.animate_bounce()`, `.animate_none()` | L'animation. |
| `animationDuration` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Durée d'une itération. |
| `animationDelay` | `number \| "${number}ms" \| "${number}s"` | `.animation(KeyframeAnimation { … })` | Délai avant la première itération. |
| `animationTimingFunction` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(...)"` | `.animation(KeyframeAnimation { … })` | La courbe d'accélération. |
| `animationIterationCount` | `number \| "infinite"` | `.animation(KeyframeAnimation { … })` | Nombre d'exécutions. |

Pour les animations pilotées par des valeurs, des gestes ou des ressorts, utilisez plutôt [l'API d'animation de `nsh`](./nsh.md#animation).

<a id="pointer-and-selection"></a>

### Pointeur et sélection

| Clé | Type | Rust | Description |
|---|---|---|---|
| `cursor` | `"auto" \| "default" \| "pointer" \| "text" \| "grab" \| "grabbing" \| "not-allowed" \| ...` (tous les mots-clés de curseur CSS, et `"none"`) | `.cursor(Cursor)`, `.cursor_pointer()` | La forme du pointeur au-dessus de la vue, pour les pointeurs (trackpads d'iPad, Mac Catalyst, ordinateurs de bureau). Les mots-clés de redimensionnement diagonal gardent leur axe : `nwse-resize` / `nw-resize` / `se-resize` (`Cursor::NwseResize`) et `nesw-resize` / `ne-resize` / `sw-resize` (`Cursor::NeswResize`). Windows, Linux, Android, le web et GPUI affichent des curseurs diagonaux ; AppKit les utilise sur macOS 15+, avec une main ouverte sur macOS 14. UIKit utilise des effets de pointeur sur iPad et Mac Catalyst. |
| `pointerEvents` | `"auto" \| "none" \| "box-none" \| "box-only"` | `.pointer_events(PointerEvents::BoxNone)` | Quels contacts tactiles la vue et les vues qu'elle contient reçoivent (`pointer-events-none`, `pointer-events-auto`). `"none"` : aucun, y compris pour les vues qu'elle contient, sauf si l'une d'elles définit `"auto"`, hérité comme en CSS. `"box-none"` : aucun sur la vue elle-même, les vues qu'elle contient reçoivent les leurs ; `"box-only"` : la vue elle-même les reçoit, les vues qu'elle contient n'en reçoivent aucun (les deux sont ceux de React Native, pour la vue seule). Par défaut `"auto"`. Voir [toucher et gestes](../docs/touch-and-gestures.md#pointerevents). |
| `userSelect` | `"auto" \| "none" \| "text"` | `.select_text()`, `.select_none()` | Indique si un `<Text>` peut être sélectionné et copié (`"text"`, `select-text`) ou non (`"none"`, `select-none`) ; la valeur d'une vue s'étend aux textes qu'elle contient qui n'en définissent aucune. `"auto"` (`select-auto`), la valeur par défaut, s'en remet à la vue englobante, sinon à la plateforme. Voir [texte](../elements/text.md). |

<a id="svg-paint"></a>

### Peinture SVG

Les propriétés de peinture CSS des formes SVG, que tout élément accepte et dont héritent les éléments qu'il contient, comme dans un navigateur.
Elles peignent ce que les composants Rust dessinent sur des canevas.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `fill` | `"none" \| "currentColor" \| ColorValue` | `.fill_color(c)`, `.fill_none()`, `.fill_current()` | Ce dont les formes sont remplies ; `currentColor` est la couleur du texte de l'élément. |
| `stroke` | `"none" \| "currentColor" \| ColorValue` | `.stroke_color(c)`, `.stroke_none()`, `.stroke_current()` | Ce avec quoi les contours des formes sont peints. |
| `strokeWidth` | `number \| string` | `.stroke_width(w)` | L'épaisseur de ces contours, une longueur (1 par défaut). |
| `strokeDasharray` | `number \| string` | — | Tirets et espaces le long de ces contours : longueurs séparées par des espaces ou des virgules (`"4 2"`), une liste de longueur impaire est répétée, ou `"none"`. |

## TextStyle

Les styles de texte s'appliquent à `<Text>` et `<Input>`. Ils sont aussi hérités, comme en CSS : les propriétés de texte définies sur une vue passent aux textes et aux champs de saisie qu'elle contient, et les spans `<Text>` imbriqués héritent de leur texte parent. Toutes les clés de `ViewStyle` s'appliquent aussi. Voir [Texte](../docs/text.md).

<a id="font"></a>

### Police

| Clé | Type | Rust | Description |
|---|---|---|---|
| `color` | `ColorValue \| AnimatedNode` | `.text_color(c)`, `.bind_color(&node)` | Couleur du texte. Accepte une couleur animée native. C'est aussi la couleur des bordures et des contours qui n'en définissent aucune. |
| `fontSize` | `number` | `.text_size(s)`, `.text_sm()`, `.text_lg()`, ... | Taille en points. |
| `fontWeight` | `"normal" \| "bold" \| number \| "${number}"` | `.font_weight(FontWeight::SEMIBOLD)` | `"normal"` (400), `"bold"` (700) ou 100–900. |
| `fontFamily` | `string` | `.font_family(name)` | Une famille système, ou le nom auquel s'évalue une police importée (`import Inter from "./Inter.ttf"`), ou une liste de familles, la plus préférée en premier (`"Brand, 'Noto Sans SC', sans-serif"`). Voir [Polices](../docs/fonts.md#fallback-lists). |
| `fontStyle` | `"normal" \| "italic"` | `.italic()` | Italique. |
| `fontVariant` | `FontVariantName[] \| string` | `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.tabular_nums()`, `.proportional_nums()` | Formes OpenType des chiffres et des lettres, une liste (`["tabular-nums"]`) ou les noms CSS séparés par des espaces (`"tabular-nums small-caps"`). `tabular-nums` garde les chiffres à la même largeur, utile pour les compteurs et les minuteurs. |
<a id="spacing-and-alignment"></a>

### Espacement et alignement

| Clé | Type | Rust | Description |
|---|---|---|---|
| `lineHeight` | `number` | `.line_height(h)` | Hauteur de ligne en points. |
| `letterSpacing` | `number` | `.letter_spacing(s)` | Espace supplémentaire entre les caractères, en points. |
| `textAlign` | `"auto" \| "left" \| "center" \| "right" \| "justify" \| "start" \| "end"` | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` | Alignement horizontal. `"left"` et `"right"` conservent leur côté dans les mises en page de droite à gauche ; `"start"` et `"end"` suivent la direction. |
| `writingDirection` | `"auto" \| "ltr" \| "rtl"` | `.writing_direction(d)` | Direction de base du texte ; `"auto"` la déduit du contenu. |
| `textTransform` | `"none" \| "uppercase" \| "lowercase" \| "capitalize"` | `.uppercase()`, `.lowercase()`, `.capitalize()`, `.normal_case()` | Transformation de la casse. |

> [!TIP]
> Les classes `leading-*` et `tracking-*` de Tailwind définissent la hauteur de ligne comme un multiple de la taille de police et l'espacement des lettres en `em`, ce qui les fait évoluer avec les tailles `text-*`.

<a id="lines-and-overflow"></a>

### Lignes et débordement

| Clé | Type | Rust | Description |
|---|---|---|---|
| `numberOfLines` | `number` | `.number_of_lines(n)`, `.truncate()` | Le nombre maximal de lignes qu'affiche un `<Text>` (`line-clamp`, `line-clamp-*` en CSS) ; `0` (`line-clamp-none`), la valeur par défaut, les affiche toutes. `truncate` correspond à une seule ligne coupée par une ellipse. |
| `textOverflow` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `.text_overflow(EllipsizeMode::Middle)` | Façon dont un `<Text>` limité est coupé : une ellipse à la fin (`"ellipsis"`, `text-ellipsis`, valeur par défaut), un rognage (`"clip"`, `text-clip`), ou l'ellipse au début ou au milieu (chemins de fichiers). |

<a id="decoration"></a>

### Décoration

| Clé | Type | Rust | Description |
|---|---|---|---|
| `textDecorationLine` | `"none" \| "underline" \| "line-through" \| "underline line-through"` | `.underline()`, `.line_through()`, `.no_underline()` | Lignes tracées avec le texte. |
| `textDecorationColor` | `ColorValue` | `.text_decoration_color(c)` | Couleur des lignes (par défaut, la couleur du texte). |
| `textDecorationStyle` | `"solid" \| "double" \| "dotted" \| "dashed" \| "wavy"` | `.text_decoration_solid()`, `_double()`, `_dotted()`, `_dashed()`, `_wavy()` | Style de ligne. |
| `textDecorationThickness` | `number \| "auto" \| "from-font"` | `.text_decoration_thickness(t)` | Épaisseur de la ligne. |
| `textUnderlineOffset` | `number \| "auto"` | `.underline_offset(o)` | Distance du soulignement à la ligne de base. |

<a id="placeholder-caret-and-selection"></a>

### Placeholder, curseur et sélection

`placeholderColor` et `caretColor` appartiennent à `InputStyle`, le style de `<Input>` ; `selectionColor` appartient à `TextStyle`, car les textes sélectionnables l'acceptent aussi.

| Clé | Type | Rust | Description |
|---|---|---|---|
| `placeholderColor` | `ColorValue` | `.placeholder_color(c)` d'un input | La couleur du placeholder d'un `<Input>` (`placeholder:text-*`). |
| `textAlignVertical` | `"auto" \| "top" \| "center" \| "bottom"` | | Emplacement d'un texte plus court que sa boîte (un `<Text>` avec une hauteur). |
| `selectionColor` | `ColorValue` | `.selection_color(c)` d'un input ou d'un texte | La surbrillance de sélection et les poignées d'un `<Input>` ou d'un `<Text>` sélectionnable (`selection:bg-*`) ; par défaut, la couleur d'accent de la plateforme. Sur iOS, également le curseur d'un input, sauf si `caretColor` est défini (UIKit teinte les deux avec une seule couleur). |
| `caretColor` | `ColorValue` | `.caret_color(c)` d'un input | Le curseur d'un `<Input>` (`caret-*`) ; la valeur par défaut de la plateforme si non défini. |

<a id="text-shadow"></a>

### Ombre du texte

| Clé | Type | Rust | Description |
|---|---|---|---|
| `textShadow` | `string \| TextShadowLayer[]` | `.text_shadow([TextShadow { … }])`, `.text_shadow_sm()`, `.text_shadow_color(c)` | `text-shadow` de CSS : décalages, flou et couleur (`"0 1px 2px rgb(0 0 0 / 0.3)"`), ou ses couches sous forme de nombres, `[{ x, y, blur, color }]` ; plusieurs couches sont dessinées comme la plus large ; une couche sans couleur est dessinée avec la couleur du texte ; `"none"`. |

```rust tabs
text("Title").text_shadow([TextShadow {
    offset_y: px(1.0),
    radius: px(2.0),
    color: rgba(0x0000004d).into(),
    ..TextShadow::default()
}])
```

```tsx tabs
<Text style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.3)" }}>Title</Text>
```

> [!NOTE]
> iOS ne dessine ni dégradés (`backgroundImage`) ni ombres de boîte internes sur `<Text>`.

## ImageStyle

Toutes les clés de `ViewStyle`, plus :

| Clé | Type | Rust | Description |
|---|---|---|---|
| `tintColor` | `ColorValue` | `.tint_color(c)` d'une image | Recolore une image modèle (chaque pixel opaque prend cette couleur), pour les icônes monochromes. |
| `objectFit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `.object_fit(ResizeMode::Contain)` | `object-fit` de CSS : comment une image ou une vidéo s'adapte à sa boîte. `"cover"` la remplit et rogne, `"contain"` l'ajuste à l'intérieur, `"fill"` l'étire, `"none"` conserve la taille naturelle, `"scale-down"` vaut `"none"` ou `"contain"`, selon la plus petite. Par défaut, les images couvrent leur boîte et les vidéos y sont contenues. |
| `objectPosition` | `string` | `.object_position(p)`, `.object_top()`, ... d'une image | Position de l'image dans sa boîte une fois dimensionnée par `objectFit`, comme `object-position` en CSS : mots-clés, pourcentages et longueurs (`"top"`, `"left bottom"`, `"25% 75%"`, `"right 10px bottom 20%"`). Une image qui couvre sa boîte est rognée autour de cette position. Par défaut, le centre. |

`objectFit` s'applique aussi à `<Video>` ; voir [image](../elements/image.md) et [video](../elements/video.md).

<a id="props-that-look-like-styles"></a>

## Props qui ressemblent à des styles

L'ombre Material d'Android est une prop de plateforme, définie à côté du style :

| Réglage | Prop | Rust | Classe |
|---|---|---|---|
| Ombre Material (Android) | `android={{ elevation }}` | `.elevation(e)` | |

<a id="related"></a>

## Voir aussi

- [Styling](../docs/styling.md) : `style`, `class`, héritage et priorité.
- [Tailwind reference](./tailwind-reference.md) : tous les utilitaires et variantes pris en charge.
- [Layout](../docs/layout.md) : flexbox et grid en pratique.
- [view](../elements/view.md), [text](../elements/text.md), [image](../elements/image.md) : les éléments auxquels ces styles s'appliquent.

`width`, `height` et `flexBasis` acceptent également `"min-content"`, `"max-content"` et `"fit-content"`, calculés par Taffy.
