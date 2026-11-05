---
title: "Style"
description: "Méthodes de style typées en Rust et prop style en TSX - flexbox, grid et effets CSS - couleurs, bordures, coins, ombres, dégradés, filtres, transformations et transitions, avec les différences entre plateformes."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---

# Styles

Chaque élément est stylé avec les mêmes styles natifs, écrits de deux façons. En Rust, les styles sont des méthodes typées chaînées sur l'élément (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`) ; en TSX, une prop `style` de propriétés en camelCase, ou des [classes Tailwind](./tailwind.md). Les deux incluent des fonctionnalités CSS comme les ombres de boîte, les dégradés, les filtres, les contours, les transitions et la grille, et seules les propriétés modifiées sont envoyées à la vue native.

Les trois façons écrivent un seul ensemble de propriétés et signifient la même chose. Leurs noms sont ceux de CSS (quelques-uns prennent les noms plus simples qu'utilisent les applications, comme `paddingHorizontal`, `marginStart` et `numberOfLines`). Les valeurs CSS (couleurs, dégradés, filtres, ombres, transformations, mots-clés d'alignement) et les utilitaires Tailwind signifient ce qu'ils signifient sur le web, chaque méthode Rust et chaque utilitaire définissant ce que Tailwind CSS 4 génère pour lui, de sorte que ce que vous connaissez du web se transpose : `paddingLeft` vaut `padding-left` et `pl-4`, `boxShadow` vaut `box-shadow`, `display: "flex"` donne une ligne, comme la classe `flex`. Le reste est conçu pour les applications natives : les longueurs sont en points (`16`, `"50%"`, `"auto"` ; les classes acceptent `rem` et les autres unités de CSS), les valeurs par défaut sont celles de la mise en page native (listées ci-dessous), une valeur qui change prend des nombres plutôt qu'une chaîne (`translate: [x, 0]`, les couches d'une ombre), et ce que les plateformes proposent au-delà de CSS dispose de ses propres [extensions](#extensions).

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

Cette page couvre la combinaison des styles et les propriétés visuelles. Les propriétés de mise en page (flexbox, grille, tailles, positions) se trouvent sur [Mise en page](./layout.md), les propriétés de texte sur [Texte](./text.md), et chaque propriété avec son type est listée dans la [référence des styles](../modules/style-reference.md).

<a id="combining-styles"></a>

## Combiner les styles

En Rust, les styles partagés sont des fonctions qui prennent un élément et le renvoient stylé, et les conditions sont du Rust ordinaire : `.when(condition, |v| ..)` pour ce qui est connu à la création de l'élément, `.style_when(signal, |s| ..)` pour les styles qui changent pendant l'exécution de l'application. En TSX, `style` prend un objet, ou un tableau d'objets fusionnés de gauche à droite ; les entrées falsy (`false`, `null`, `undefined`) sont ignorées, ce qui rend les styles conditionnels concis :

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

En TSX, définissez les styles partagés comme des constantes en dehors des composants (avec `as const`, afin que TypeScript conserve les types littéraux tels que `"row"`). Un simple objet suffit : les styles sont analysés en Rust à chaque fois qu'ils sont appliqués, à partir d'objets qu'il n'est pas nécessaire d'enregistrer.

Un style qui lit des signals les suit : en Rust, donnez à la méthode une closure (`.bg(move || ..)`), et seule cette propriété est de nouveau appliquée lorsque les signals changent ; en TSX, une expression de style qui lit des signals est reconstruite, et NSH n'envoie que les propriétés dont les valeurs diffèrent :

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Lorsqu'un élément TSX possède les deux, `style` l'emporte sur `class` : les classes sont appliquées en premier, puis le style en ligne par-dessus. Une clé définie à `undefined` ne définit rien (`backgroundColor: active ? accent : undefined` conserve la couleur de la classe lorsqu'il est inactif) ; `null` rétablit la valeur par défaut. En Rust, une méthode appelée plus tard l'emporte sur une méthode antérieure pour la même propriété.

Au sein d'un même style (un objet, ou un tableau fusionné en un seul), l'ordre des clés n'a aucune importance : une propriété plus spécifique l'emporte sur sa propriété raccourcie, `borderTopWidth` sur `borderWidth`, `borderLeftColor` sur `borderColor`, `marginTop` sur `marginVertical` sur `margin` (de même pour le padding), `rowGap` sur `gap`, `flexGrow` sur `flex`, `gridColumnStart` sur `gridColumn`. Une propriété spécifique définie à `null` dans ce cas laisse apparaître la valeur de la propriété raccourcie.

<a id="units-and-values"></a>

## Unités et valeurs

- **Les longueurs sont en points** (pixels indépendants de la densité) : `px(100.0)` en Rust et `width: 100` en TSX valent 100pt, soit 200 ou 300 pixels physiques sur un écran 2× ou 3×.
- **Les pourcentages** (`relative(0.5)` en Rust, `"50%"` en TSX) sont relatifs au parent, pour les tailles, les positions, les marges et les paddings ([Mise en page](./layout.md)).
- **Les angles** s'écrivent `deg(45.0)`, `radians(0.5)` ou `turn(0.25)` en Rust, et en degrés sous forme de nombres ou de chaînes avec une unité en TSX : `45`, `"45deg"`, `"0.5rad"` ; les `rotate` et `transform` de CSS acceptent aussi `"0.25turn"`, et dans une chaîne `transform` chaque angle porte son unité.
- **Les durées** sont en millisecondes : `.duration(150.0)` en Rust, des nombres ou des chaînes (`"150ms"`, `"0.2s"`) en TSX.

<a id="defaults"></a>

## Valeurs par défaut

Lorsque rien ne définit une propriété, les valeurs par défaut de NSH s'appliquent :

| | Défaut |
|---|---|
| Disposition des enfants d'une vue | une colonne (un conteneur flex avec `flexDirection: "column"`) ; `display: "flex"` donne une ligne sauf si `flexDirection` est défini, comme en CSS |
| `flexShrink` | `0` (les enfants ne rétrécissent pas sauf demande contraire) |
| `alignContent` | `"flex-start"` (dans les grilles, le `"normal"` de CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | transparent |
| Texte | noir, 14pt, graisse 400 |
| Couleur de bordure et de contour | la couleur du texte (le `currentColor` de CSS) |

Les nouvelles vues ne portent aucun style tant que vous ne leur en donnez pas, de sorte que les conteneurs non stylés ne coûtent rien côté natif.

<a id="colors"></a>

## Couleurs

En Rust, les couleurs sont des valeurs typées : `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()`, et la palette de Tailwind sous la forme `nsh_core::element::palette` (`BLUE.shade(500)`). Les méthodes de couleur prennent un `AdaptiveColor`, une valeur claire et une valeur sombre : `AdaptiveColor::rgb(0xffffff, 0x0d1117)` bascule nativement avec l'apparence du système, sans nouveau rendu. Les couleurs du thème de l'application (`theme().primary` issu de `nsh_base`) sont elles aussi adaptatives ([Rust](./rust.md#theme)).

En TSX, les propriétés de couleur acceptent des chaînes de couleur CSS :

| Forme | Exemple |
|---|---|
| Hexadécimal | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Nommées | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"` : la couleur du texte, y compris dans un dégradé, une ombre, un `drop-shadow()` ou un `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`) ; les classes l'écrivent `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Pour le mode sombre en TSX, lisez [`colorScheme()`](../modules/nsh.md#device) depuis `nsh`, un accesseur qui suit l'apparence du système, ou utilisez la variante `dark:` de Tailwind :

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Pour les styles autres que les couleurs, `.dark(|s| ..)` en Rust applique des styles en apparence sombre, et `dark()` lit l'apparence. La couleur de texte par défaut est le noir dans les deux apparences : définissez les couleurs explicitement dans les applications qui prennent en charge le mode sombre.

<a id="borders-and-corners"></a>

## Bordures et coins

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Épaisseurs et couleurs** par côté : `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., qui conservent leur côté quelle que soit la direction ; et `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, qui suivent la [direction de mise en page](./layout.md#right-to-left) (`.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ... en Rust).
- **La couleur** d'un côté dont l'épaisseur est définie mais pas la couleur est la couleur du texte, comme le `currentColor` de CSS : `{ borderWidth: 1, color: "#0969da" }` dessine une bordure bleue.
- **Les rayons** par coin : `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`, et `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (haut début, haut fin, bas début, bas fin), qui suivent la [direction de mise en page](./layout.md#right-to-left) (`.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` en Rust, et les préréglages `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) dessine des coins dont la courbure se fond progressivement dans les bords, comme les icônes d'applications iOS, sur les deux plateformes. Une pilule (`borderRadius` égal à la moitié de la hauteur) reste une pilule.
- **`overflow: "hidden"`** (`.overflow_hidden()`) découpe les enfants selon la forme arrondie. Ce qui est découpé l'est aussi dans la mise en page : cela n'atteint pas la taille du contenu d'une vue défilante englobante, de sorte qu'une boîte qui place un enfant plus large qu'elle et le réduit avec un `transform` (les transformations n'affectent pas la mise en page) laisse la vue défilante tranquille.

Les rayons supérieurs à la moitié du côté sont limités, de sorte que `borderRadius: 9999` (`.rounded_full()`) produit un cercle ou une pilule.

<a id="shadows"></a>

## Ombres

Les vues projettent le `boxShadow` de CSS, et Android ajoute son élévation material :

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` suit CSS : `offsetX offsetY blur spread color`, `inset` pour les ombres internes. Il accepte aussi ses couches sous forme de nombres, la forme à privilégier pour les valeurs qui changent, qui ne construit aucune chaîne : `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (seuls `x` et `y` sont requis ; une couche sans couleur prend la couleur du texte). Rust prend les couches, `.shadow([BoxShadow { .. }])`. Les ombres suivent la forme arrondie de la vue, et une transition les anime (`transitionProperty: "boxShadow"`, `.transition_shadow()`). Les préréglages de Tailwind sont `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... en Rust, et `.shadow_color(..)` recolore leurs couches. Une ombre qui suit le contenu d'une vue transparente (les glyphes d'une icône, par exemple) est un `filter: "drop-shadow(...)"` ([Filtres](#filters-and-blending)) ; le texte dispose de `textShadow` ([Texte](./text.md)).

> [!NOTE]
> Sur Android, les ombres nécessitent un arrière-plan : une vue dont l'arrière-plan est transparent (un texte sans arrière-plan, par exemple) ne projette aucune ombre.

<a id="gradients"></a>

## Dégradés

`backgroundImage` accepte les dégradés CSS, dessinés par-dessus la couleur d'arrière-plan ; en Rust, `.bg_linear(angle)`, `.bg_radial()` et `.bg_conic(angle)` avec les étapes `.gradient_from(..)`, `.gradient_via(..)` et `.gradient_to(..)`, comme le `bg-linear-*` de Tailwind avec `from-*`, `via-*` et `to-*`. En TSX, plusieurs dégradés sont séparés par des virgules.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Les arrêts de couleur sont placés par des pourcentages ou des longueurs (`px`, `pt`, `rem` ; les nombres seuls sont des points) le long d'un dégradé linéaire ou radial, et par des pourcentages ou des angles (`deg`, `turn`, `rad`, `grad`) autour d'un dégradé conique. Un arrêt à deux positions (`#8250df 0 12px`) est une bande d'une seule couleur, tout comme deux arrêts à la même position. Les longueurs sont mesurées le long de la ligne du dégradé à la taille actuelle de la vue, de sorte qu'une bande de 12px reste large de 12px quand la vue est redimensionnée.

Les couleurs se mélangent entre les arrêts comme en CSS : dans l'espace que nomme un dégradé (`linear-gradient(in oklab, …)` ; aussi `srgb`, `srgb-linear`, `xyz`, `oklch` avec une méthode de teinte telle que `longer hue`, et `hsl`), et sinon en sRGB lorsque toutes les couleurs sont hexadécimales, `rgb()`, `hsl()` ou nommées, et en Oklab lorsque l'une est `oklch()`, `oklab()`, `lab()`, `lch()` ou `color()`.

Les éléments de texte ne dessinent pas de dégradés sur iOS.

<a id="filters-and-blending"></a>

## Filtres et fusion

| Propriété | Valeur | Rust |
|---|---|---|
| `filter` | Filtres CSS de la vue et de son contenu : `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (sans couleur, dans la couleur du texte, comme en CSS) ; plusieurs séparés par des espaces | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Filtres de ce qui se trouve derrière la vue : `"blur(10px)"` (verre dépoli) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` ou `"clear"` pour le Liquid Glass d'Apple sur iOS 26 et macOS 26 et versions ultérieures ; `"none"` (la valeur par défaut) utilise `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Comment la vue se fond avec ce qui se trouve derrière elle : `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

La prise en charge diffère selon les plateformes :

| | iOS | Android |
|---|---|---|
| `filter` sur les vues | `opacity`, `brightness` jusqu'à 1 et `drop-shadow` uniquement | Tous, à partir d'Android 12 (API 31) ; filtres de couleur uniquement en dessous |
| `filter` sur les images | Tous les filtres de couleur et `blur` | Comme les vues |
| `backdropFilter` | Un matériau de flou système, qui approxime le rayon | À partir d'Android 12 (API 31) |
| `mixBlendMode` | Oui | À partir d'Android 10 (API 29) |

Le web, Windows et Linux appliquent tous les filtres aux vues, macOS comme iOS ; GPUI dessine les filtres de couleur et `drop-shadow()`. Le filtre d'arrière-plan est un flou sur iOS, macOS et Android, et tous les filtres sur le web et Windows ; Linux et GPUI n'en dessinent aucun, et GPUI dessine les vues en mode de fusion normal. Parmi un `filter` comportant plusieurs `drop-shadow()`, iOS, macOS et Android dessinent le dernier. `mixBlendMode` fond la vue avec tout ce qui est dessiné derrière elle.

Sur iOS, `ios={{ backdropMaterial: "regular" }}` sélectionne le matériau système utilisé par un flou `backdropFilter`. Les valeurs sont `"ultraThin"` (la valeur par défaut), `"thin"`, `"regular"`, `"thick"` et `"chrome"`. Associez la prop à un rayon de flou positif pour afficher le matériau. Rust utilise `.backdrop_material(BackdropMaterial::Regular)` avec `.backdrop_blur(px(30.0))`. Le rayon approxime l'intensité du matériau : NSH applique une fraction du matériau choisi, atteignant sa pleine intensité à 30 points. La variante claire ou sombre suit la couleur d'arrière-plan de la vue. Ces choix correspondent aux [matériaux de flou système](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) d'Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` dessine du Liquid Glass derrière le contenu d'une vue sur iOS 26 et macOS 26 et versions ultérieures. `"regular"` utilise le matériau standard ; `"clear"` reprend moins de couleur de l'arrière-plan. Associez-le à `backdropFilter` pour obtenir le flou affiché sur les versions antérieures d'iOS et sur les autres plateformes. Le verre suit la taille et les coins arrondis de la vue.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Contours, opacité et visibilité

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`) : une ligne à l'extérieur de la bordure qui ne prend aucune place (les décalages négatifs dessinent à l'intérieur). `outlineStyle: "none"` (ou `"hidden"`, `.outline_none()`) masque le contour quelle que soit son épaisseur, comme en CSS.
- `opacity` (`.opacity(n)`) : de 0 à 1, appliqué à la vue et à ses enfants.
- `visibility: "hidden"` (`.invisible()` en Rust) : la vue n'est pas dessinée mais conserve son espace, et les lecteurs d'écran l'ignorent ainsi que son sous-arbre, comme dans un navigateur. `display: "none"` (`.hidden()`) la retire de la mise en page.
- `zIndex` (`.z_index(n)`) : l'ordre parmi les éléments frères, aussi l'ordre d'empilement natif (stable pour des valeurs égales).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`) : la forme du pointeur au-dessus de la vue, pour les pointeurs et les ordinateurs de bureau.
<a id="transforms"></a>

## Transformations

Les transformations sont celles de CSS. En TSX, `translate`, `rotate` et `scale` sont des propriétés à part entière et `transform` accepte la chaîne de fonctions de CSS ou une liste d'étapes ; elles se composent dans l'ordre de CSS, `translate`, puis `rotate`, puis `scale`, puis `transform`, quel que soit l'ordre des clés. En Rust, les transformations sont des méthodes (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...) composées dans le même ordre :

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Propriété | Valeur |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (pourcentages de la taille propre de la vue), un nombre (points le long de x), ou `[x, y]` avec un nombre, une chaîne ou une valeur animée par axe |
| `rotate` | `"45deg"`, `"0.25turn"`, autour d'un axe `"x 90deg"`, un nombre (degrés) ou une valeur animée (degrés) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x et y), une valeur animée (les deux axes) ou `[x, y]` |
| `transform` | Fonctions de CSS : `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()` ; longueurs en `px` (translations aussi `%`), angles en `deg`, `rad` ou `turn` ; `"none"` ; ou une liste d'étapes (`[{ perspective: 800 }, { rotateY: angle }]`) dont les quantités peuvent être des valeurs animées |

Chacune est une propriété à part entière, comme pour les classes : le `scale` d'un style remplace une classe `scale-95` et conserve son `rotate-3`. Les valeurs animées déplacent `translate`, `rotate` et `scale` nativement ; pour ce que la chaîne de CSS ne peut pas contenir avec une quantité animée, comme une rotation 3D, donnez à `transform` une liste d'étapes : `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` et `perspective` ([Animation](./animation.md)). Le `transform` d'un style est l'une ou l'autre forme ; une perspective placée avant des étapes animées est donc une étape de la liste.

Le `.perspective(..)` de Rust correspond à la propriété `perspective` de CSS, comme `perspective-*` de Tailwind : il donne de la profondeur aux enfants de la vue, tandis que la fonction `perspective()` d'un `transform` s'applique à la propre transformation de la vue. `transformOrigin` accepte des mots-clés, des pourcentages et des longueurs (`"top left"`, `"50% 0"`, `[10, 20]` ; `.origin_top_left()`, `.transform_origin(..)` en Rust) ; la valeur par défaut est le centre. Les transformations n'affectent pas la mise en page : les vues voisines sont placées comme si la vue n'était pas transformée.

Android ne prend pas en charge les transformations d'inclinaison (skew).

## Transitions

Une vue anime les changements de son propre style lorsque vous indiquez ce qui doit être animé. L'animation s'exécute nativement ; aucun de vos codes ne s'exécute à chaque image.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Propriété | Valeur | Rust |
|---|---|---|
| `transitionProperty` | Ce qui est animé : `"all"`, ou des noms séparés par des virgules : couleurs (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (toutes les propriétés de transformation), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Comme pour la durée | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Les tailles et les positions relèvent de la mise en page, et non du style, et ne font pas l'objet de transitions ; animez les changements de mise en page avec `LayoutAnimation` ou pilotez des valeurs avec des animations natives ([Animation](./animation.md)).

<a id="keyframe-animations"></a>

### Animations par images clés

`animationName` exécute nativement l'une des animations par images clés intégrées de Tailwind : `"spin"`, `"ping"`, `"pulse"` ou `"bounce"`, avec `animationDuration`, `animationDelay`, `animationTimingFunction` et `animationIterationCount` (un nombre ou `"infinite"`), dans n'importe quel ordre. En Rust, `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` et `.animate_bounce()` les exécutent avec le timing de Tailwind, et `.animation(KeyframeAnimation::new(..))` avec le vôtre :

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

<a id="press-feedback"></a>

## Retour d'appui

Le retour d'appui correspond aux styles de l'application pour l'état pressé, appliqués nativement sans aller-retour avec votre code ; les états survolé, focalisé et désactivé acceptent des styles de la même manière (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` en Rust ; `hoverStyle`, `focusStyle` et `disabledStyle`, ou `hover:`, `focus:`, `disabled:`, en TSX) :

| Rust | TSX | Effet pendant l'appui |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | La vue passe en fondu à cette opacité |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | L'arrière-plan prend cette couleur |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | L'effet d'ondulation (ripple) Material d'Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | N'importe quel style |

Voir [Toucher et gestes](./touch-and-gestures.md).

## Extensions

Ces clés et classes couvrent ce que font les plateformes natives au-delà de CSS :

| Clé | Classe | Ce que cela fait |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | La couleur du texte d'invite d'un `<Input>` |
| `selectionColor` | `selection:bg-*` | La surbrillance de sélection d'un `<Input>` ou d'un `<Text>` sélectionnable |
| `tintColor` | `tint-*` | Recolore les pixels opaques d'un `<Image>` (images modèles, icônes) |
| `borderCurve` | | `"continuous"` : des coins qui se fondent dans les bords, comme ceux du système (coins continus d'Apple) |
| `glassEffect` | | Le Liquid Glass d'Apple derrière la vue sur iOS 26 et macOS 26, le `backdropFilter` ailleurs |
| `writingDirection` | | La direction de base d'un texte, `"auto"` (par défaut : déduite de son contenu, comme le font les vues de texte des plateformes), `"ltr"` ou `"rtl"` ; `direction` définit celle de la mise en page |
| `textAlignVertical` | | L'endroit où se place un texte plus court que sa boîte `<Text>` : `"top"` (par défaut), `"center"` ou `"bottom"` |
| `textAlign: "auto"` | | Le côté naturel du texte, selon sa direction (par défaut) |
| `selectedStyle` | `selected:` | Le style lorsque `accessibilityState.selected` vaut `true` (un `Button` sélectionné, un onglet) |
| | `ios:`, `android:`, `web:` | Classes propres à une plateforme (`ios:pt-2`) |

Les valeurs qui changent acceptent aussi des nombres là où CSS attend une chaîne : `transform` sous forme de liste d'étapes, `translate` et `scale` sous forme de `[x, y]`, `boxShadow` et `textShadow` sous forme de couches.

<a id="related"></a>

## Voir aussi

- [Tailwind](./tailwind.md) : les mêmes styles sous forme de classes, avec des variantes pour le mode sombre, les états pressés et les points de rupture, ainsi que leurs équivalents typés.
- [Mise en page](./layout.md) et [Texte](./text.md).
- [Référence des styles](../modules/style-reference.md) : chaque propriété de style et son type.
