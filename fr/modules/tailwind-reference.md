---
title: "Référence Tailwind"
description: "Toutes les classes utilitaires et variantes Tailwind que NSH résout nativement, la syntaxe des valeurs arbitraires et la manière d'étendre le thème dans nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---

# Référence Tailwind

Chaque élément accepte des classes Tailwind CSS dans sa prop `class` (et des classes conditionnelles dans `classList`). NSH les résout en Rust par rapport au thème par défaut de Tailwind 4 : JS ne transmet que la chaîne, chaque chaîne distincte est analysée une seule fois puis mise en cache, et les variantes comme `dark:` ou `active:` sont réévaluées nativement lorsque l'apparence, la taille de la fenêtre ou l'état d'appui change, sans exécuter de JS.

Chaque utilitaire définit exactement ce que Tailwind CSS 4 génère pour lui, avec la même signification que dans un navigateur. Cette page liste ce qui est pris en charge. Pour une introduction, voir [Tailwind](../docs/tailwind.md) ; pour les clés de style que les utilitaires définissent, voir la [référence des styles](./style-reference.md).

Les composants Rust n'acceptent pas de chaînes de classes : ils stylent les éléments avec les méthodes typées de `Styled` (`nsh_core::prelude`), nommées d'après ces utilitaires et résolues vers les mêmes valeurs, échelles par défaut de Tailwind comprises (`px-4` est `.px_4()`, `rounded-2xl` `.rounded_2xl()`, `shadow-md` `.shadow_md()`, `bg-linear-to-br` `.bg_linear_to_br()`). Les couleurs sont des valeurs : couleurs du thème, ou palette de Tailwind sous la forme `nsh_core::element::palette` (`ZINC.shade(800)` vaut `zinc-800`). Les variantes sont des méthodes qui prennent une closure de styles : `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)`, et `.style_when(condition, …)` pour le reste. La [référence des styles](./style-reference.md) nomme la méthode de chaque clé de style.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Comment les classes se combinent

- **La dernière l'emporte.** Parmi les utilitaires d'un même niveau de variante, celui qui se trouve le plus loin dans la chaîne l'emporte : `"p-4 p-2"` donne `p-2`. Un composant peut accepter une prop `class` et l'ajouter à ses propres classes sans `tailwind-merge`.
- **Les variantes s'appliquent après les utilitaires simples**, dans l'ordre des variantes de Tailwind : `group-*:` (par leur état, puis par nom de groupe), `selection:`, `placeholder:`, position (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (par nom), mouvement, points de rupture `max-*:` du plus large au plus étroit, puis points de rupture croissants, orientation, direction, `dark:`, puis plateforme. La variante la plus haute d'une classe décide, puis la suivante, et une variante supplémentaire vient plus tard (`dark:hover:` après `dark:`), comme Tailwind les trie. Ainsi `"active:bg-red-500 bg-blue-500"` est rouge pendant l'appui.
- **`style` l'emporte sur les classes.** Le `style` en ligne est appliqué par-dessus les classes résolues. Une clé de style est la propriété CSS de même nom, celle que définissent les utilitaires : elle remplace donc cette propriété et rien d'autre : `style={{ paddingLeft: 8 }}` l'emporte sur `pl-4` et conserve `pr-4`. Un utilitaire important (`!p-4` ou `p-4!`) l'emporte aussi sur le style en ligne.
- **Les styles de texte sont hérités.** Les utilitaires de texte sur une vue (`text-white`, `font-bold`, `text-center`, ...) se transmettent aux éléments `<Text>` et `<Input>` qu'elle contient, comme en CSS.
- **Display suit CSS.** `flex` et `inline-flex` produisent une ligne, sauf si un utilitaire de direction dit autre chose, où qu'il se trouve dans la chaîne (`flex-col flex` est une colonne). Le `display: "flex"` d'un style est une ligne de la même façon ; les vues qui ne définissent aucun display conservent la colonne par défaut de NSH.

<a id="units-and-the-theme"></a>

## Unités et thème

Les longueurs sont en points (`1` = un point sur iOS, un dp sur Android). Le `1rem` de Tailwind vaut 16 points, de sorte que le thème correspond à celui du web à densité égale : un pas d'espacement vaut 4 points (`p-4` = 16 points), `text-base` vaut 16 points.

<a id="spacing-values"></a>

### Valeurs d'espacement

Les utilitaires qui prennent une valeur d'espacement (padding, margin, gap, inset, largeur, hauteur, `basis`, `translate`, `leading`) acceptent :

| Valeur | Exemple | Résultat |
|---|---|---|
| Pas (quarts de pas autorisés) | `p-4`, `gap-1.5`, `m-0.25` | pas × 4 points |
| `px` | `p-px`, `-mt-px` | 1 point |
| `0` | `m-0` | 0 |
| Fraction (inset, largeur, hauteur, `basis`, `translate`) | `w-1/2`, `left-1/3` | pourcentage du parent |
| `full` (identique) | `w-full`, `inset-full` | 100 % |
| `auto` (margin, inset, largeur, hauteur, basis) | `mx-auto`, `w-auto` | `"auto"` |
| Arbitraire | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | la longueur donnée |

Les marges, les insets, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, les lignes de grille et les angles de dégradé acceptent un `-` initial pour les valeurs négatives : `-mt-2`, `-translate-x-1/2`, `-rotate-6`. Tailwind n'a pas de forme négative pour les autres (`-p-4`, `-gap-2`, `-w-4`), et NSH non plus.

<a id="colors"></a>

### Couleurs

La palette complète de Tailwind 4 est intégrée : `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, chacune en nuances `50`, `100`–`900`, `950` ; plus `black`, `white` et `transparent`. Vos propres couleurs viennent de `nsh.json` (voir [Personnalisation du thème](#theme-customization)).

Chaque utilitaire de couleur accepte :

| Forme | Exemple |
|---|---|
| Une couleur du thème | `bg-sky-500`, `text-brand` |
| Un modificateur d'opacité (pourcentage) | `bg-black/50`, `ring-black/5` |
| Une opacité arbitraire | `text-black/[0.35]` |
| Une couleur arbitraire | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Une couleur arbitraire avec un modificateur | `bg-[rgb(0_0_255)]/25` |

`currentColor` et `inherit` ne sont pas des valeurs de couleur. Comme dans un navigateur, une bordure, un contour (outline) ou un anneau (ring) sans classe de couleur est dessiné dans la couleur de texte de l'élément, la sienne ou celle dont il hérite (`<View class="text-white"><View class="border ring-2" /></View>` dessine les deux en blanc), et il en va de même pour une bordure dont la prop `style` définit l'épaisseur sans couleur.

<a id="arbitrary-values"></a>

## Valeurs arbitraires

Les crochets transmettent une valeur que le thème ne contient pas : `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` représente une espace (`grid-cols-[1fr_2fr]`) ; écrivez `\_` pour un tiret bas littéral.
- Longueurs : un nombre seul ou `px` (points), `pt` (4/3 de point, comme en CSS), `rem` (16 points), et `%` là où les pourcentages ont un sens.
- Angles (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`) : `deg`, `rad`, `grad`, `turn`.
- Durées (`duration-[...]`, `delay-[...]`) : `ms` ou `s` ; un nombre seul est en millisecondes.
- Les indications de type lèvent l'ambiguïté des valeurs : `text-[length:22px]` est une taille, `text-[color:#333]` une couleur ; `border-[length:3px]` de même.

Les propriétés CSS arbitraires (`[mask-type:luminance]`) ne sont pas prises en charge.

<a id="layout"></a>

## Mise en page

| Classe | Définit |
|---|---|
| `flex`, `inline-flex` | `display: "flex"`, et une ligne sauf si un utilitaire de direction est présent |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | une mise en page en bloc ou un contexte de formatage de bloc indépendant |
| `box-border`, `box-content` | les dimensions incluent les bordures et le padding, ou le contenu seul |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | tailles intrinsèques de Taffy : `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"` : ce qu'un navigateur calcule pour eux dans un parent flex ou grid |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"` : dans le flux, ses insets sont ignorés ; les descendants absolus utilisent leur ancêtre positionné le plus proche |
| `sticky` | `position: "sticky"` : dans le flux, il reste collé `top` (`left` dans une vue à défilement horizontal) à l'intérieur de la vue à défilement qui l'entoure tant que son parent est visible |
| `fixed` | `position: "fixed"` : un élément disposé dans la boîte de sa vue racine (la fenêtre ou sa modale) au-dessus des enfants de cette vue racine, en place pendant que ce qui l'entoure défile |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | le décalage correspondant |
| `start-<n>`, `end-<n>` | `start` / `end` (selon la direction) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` vaut 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (conserve son espace) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, none) |

Le défilement est un élément, pas une classe : `overflow-auto` et `overflow-scroll` ne sont pas pris en charge ; utilisez [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox et grid

| Classe | Définit |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1, shrink 1, basis 0 |
| `flex-<n>` | grow n, shrink 1, basis 0 |
| `flex-auto` | grow 1, shrink 1, basis auto |
| `flex-initial` | grow 0, shrink 1, basis auto |
| `flex-none` | grow 0, shrink 0, basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | le raccourci CSS : `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (seul : 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (seul : 1) |
| `basis-<n>` | `flexBasis` (espacement, fraction, `full`, `auto`, arbitraire) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` et `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` et `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` et `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (et négatif) | une marge sur chaque enfant sauf le dernier : la marge de fin (`space-x`) ou celle du bas (`space-y`), sous les marges propres de l'enfant, comme dans Tailwind CSS ; elle s'ajoute à un `gap` |
| `space-x-reverse`, `space-y-reverse` | la marge du côté début / haut à la place (enfants en ordre inverse) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (et `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (et `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Espacement

| Classe | Définit |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (selon la direction) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (selon la direction) |

<a id="sizing"></a>

## Dimensionnement

| Classe | Définit |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (espacement, fraction, `full`, `auto`, arbitraire) |
| `size-<n>` | `width` et `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | la limite correspondante |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | la largeur de la fenêtre (aussi sur `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | la hauteur de la fenêtre (aussi sur `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (dimensionné selon le contenu) |
| `max-w-none`, `max-h-none` | aucune limite |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | une largeur de conteneur (ci-dessous) |

Largeurs de conteneur (en points) : `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280 ; `prose` vaut 65 fois la largeur du `0` de la police de l'élément (le `65ch` de CSS), comme dans Tailwind CSS.

<a id="typography"></a>

## Typographie

<a id="font"></a>

### Police

| Classe | Définit |
|---|---|
| `font-sans` | la police système |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | une graisse numérique, sinon une famille : `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (ils se combinent ; `normal-nums` réinitialise les formes de chiffres) |

<a id="size-color-and-line-height"></a>

### Taille, couleur et interligne

`text-<size>` définit la taille de police et l'interligne correspondant de Tailwind, qu'une classe `leading-*` remplace où qu'elle se trouve dans la chaîne et quelle que soit sa variante (`leading-tight md:text-lg` conserve l'interligne serré) :

| Classe | Taille | Interligne |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Classe | Définit |
|---|---|
| `text-<size>/<leading>` | taille et interligne : `text-sm/6` (24 points), `text-lg/tight` |
| `text-[<length>]` | `fontSize` : `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1,25), `leading-snug` (1,375), `leading-normal` (1,5), `leading-relaxed` (1,625), `leading-loose` (2) | `lineHeight` comme multiple de la taille de police |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` en points (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` comme multiple de la taille de police (`leading-[1.5]`), hérité sous forme de ce multiplicateur ; `em` et `%` calculent une longueur à la taille de police de l'élément avant l'héritage |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` relatif à la taille de police |
| `tracking-[<value>]` | `letterSpacing` : `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Alignement, casse et retour à la ligne

| Classe | Définit |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"` : le début ou la fin de la ligne dans le sens de la mise en page |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (vues et images à l'intérieur d'un texte) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | une seule ligne, points de suspension en fin, pas de retour à la ligne, `overflow: hidden` (sur une vue : ses textes ne passent pas à la ligne) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` affiche toutes les lignes) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | les lignes ne passent jamais à la ligne suivante ; sur une vue, les lignes des textes qu'elle contient (hérité, comme le `white-space` de CSS) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | les lignes passent à la ligne suivante (l'équilibrage n'est pas effectué) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"` ; sur une vue, des textes qu'elle contient qui n'en définissent aucun |
| `select-auto` | `userSelect: "auto"` : la vue qui l'entoure décide, comme le `user-select: auto` de CSS (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Décoration et ombre

| Classe | Définit |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg` ; `/<alpha>` | une ombre de texte issue du thème (une seule couche : la plus large de celles du thème) ; le modificateur est l'alpha des couches : `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | sa couleur, à l'alpha de la taille |
| `text-shadow-none` | la supprime |

Les ombres de texte de Tailwind comportent plusieurs couches ; en natif, une seule ombre est dessinée, la couche la plus large.

<a id="inputs"></a>

### Champs de saisie

| Classe | Définit |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (la surbrillance de la sélection d'un champ de saisie ou d'un texte sélectionnable, ainsi que de ceux qu'il contient) |
| `caret-<color>` | la couleur du curseur |

<a id="backgrounds"></a>

## Arrière-plans

| Classe | Définit |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage` : `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | un dégradé linéaire vers un côté ou un coin (`bg-gradient-to-*` est le nom en v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | un dégradé linéaire selon un angle : `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | un dégradé radial depuis le centre |
| `bg-conic`, `bg-conic-<angle>` | un dégradé conique, démarrant éventuellement à un angle |
| `from-<color>`, `via-<color>`, `to-<color>` | les arrêts du dégradé (transparents par défaut aux extrémités) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | positions des arrêts : `via-40%`, `from-[15%]` |
| `bg-none` | supprime le dégradé |

Les utilitaires de dégradé mélangent leurs couleurs en Oklab, comme Tailwind CSS les écrit (`in oklab`) ; à une position arbitraire (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`), ils suivent le comportement par défaut de CSS : Oklab avec les couleurs de la palette, et sRGB lorsque tous les arrêts sont des couleurs hexadécimales, `rgb()`, `hsl()` ou nommées.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Bordures

| Classe | Définit |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (seul : 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (avec `-<n>` ou seul) | les largeurs des côtés correspondants |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` et les couleurs par côté |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"` : aucune bordure, quelles que soient les classes de largeur, dans n'importe quel ordre (`md:border-solid` la réaffiche) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (seul : `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | les coins correspondants |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | coins de début / de fin (selon la direction) : `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (seul : 1), plein sauf si une classe de style figure n'importe où dans la chaîne (`outline-dashed outline-2` est en tirets, `outline-none outline-2` ne dessine rien) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle` ; un style seul correspond à la largeur medium de CSS, soit 3 points |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Tailles de rayon (en points) : `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Anneaux

Les anneaux sont des ombres de boîte avec une propagation, dessinées à l'extérieur de la bordure sans occuper d'espace.

| Classe | Définit |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | un anneau de cette largeur (seul : 1) |
| `ring-<color>` | sa couleur (par défaut, la couleur de texte de l'élément) |
| `ring-inset` | dessine l'anneau à l'intérieur |
| `ring-offset-<n>`, `ring-offset-<color>` | un espace entre l'élément et l'anneau (blanc par défaut) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | un anneau intérieur |

<a id="effects"></a>

## Effets

| Classe | Définit |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` ; `/<alpha>` | `boxShadow` issue du thème ; le modificateur est l'alpha des couches : `shadow-xl/20` |
| `shadow-[<box-shadow>]` | une ombre arbitraire : `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | recolore les couches d'ombre, à l'alpha de la taille : `shadow-indigo-500/40` |
| `shadow-none` | aucune ombre |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | une ombre intérieure |
| `opacity-<n>`, `opacity-[<value>]` | `opacity` : `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode` : `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Les ombres, les anneaux et les ombres intérieures se combinent en une seule liste `boxShadow`, comme en CSS. Une couleur d'ombre remplace la couleur de chaque couche, alpha compris, comme le `--tw-shadow-color` de Tailwind : `shadow-md shadow-red-500` donne une ombre rouge opaque, `shadow-md/20 shadow-red-500` une ombre à 20 %.

<a id="filters"></a>

## Filtres

| Classe | Définit |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | facteurs en pourcentage : `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | seul : 100 % |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none` ; `drop-shadow-<color>`, `drop-shadow-current` ; `/<alpha>` sur l'un ou l'autre | un `drop-shadow()` par couche, après les autres filtres ; une couleur remplace celles des couches, à l'alpha de la taille ; le web, Linux, Windows et GPUI dessinent chaque couche, iOS, macOS et Android la plus large |
| `drop-shadow-none` | le supprime |
| `filter-none` | supprime tous les filtres |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | floute ce qui se trouve derrière la vue |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | filtres d'arrière-plan |
| `backdrop-filter-none` | les supprime |

> [!WARNING]
> iOS n'applique que `opacity`, `brightness` jusqu'à 1 et `drop-shadow` aux vues ; `<Image>` accepte tous les filtres de couleur et `blur`. Android requiert l'API 31 pour `blur`, `drop-shadow` et le flou d'arrière-plan. Voir la [référence des styles](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Transformations

| Classe | Définit |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (espacement, `full`, fractions de la taille propre de l'élément : `-translate-x-1/2`, arbitraire) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | rotation 3D (en `transform`, après la translation, la rotation et l'échelle) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale` : `scale-95` = 0.95, `-scale-x-100` inverse |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | inclinaison, en `transform` (non disponible sur Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | profondeur pour les rotations 3D des enfants de l'élément, vue depuis son centre (le `perspective` de CSS : `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | efface les rotations 3D et les inclinaisons (le `transform: none` de CSS) |
| `translate-none`, `rotate-none`, `scale-none` | efface la translation, la rotation, l'échelle |

Les utilitaires de transformation se composent comme en CSS : `translate-*`, `rotate-*` et `scale-*` définissent les propriétés `translate`, `rotate` et `scale` et se combinent quel que soit l'ordre, puis `transform` s'applique (`rotate-x-*`, `skew-*`). Les clés de même nom de la prop `style` ne remplacent que leur propre propriété : `style={{ scale: 1.1 }}` remplace `scale-95` et conserve `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` et `transform-flat` sont acceptés et sans effet : NSH compose toutes les transformations de la même façon, à plat. Les translations d'une fraction de la taille sont résolues par rapport au cadre de l'élément et le suivent lorsqu'il est redimensionné.

<a id="transitions-and-animation"></a>

## Transitions et animation

| Classe | Définit |
|---|---|
| `transition` | couleurs, opacité, ombre et transformation ; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | les propriétés animées |
| `transition-none` | aucune transition |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration` : `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | une animation native par images clés, répétée indéfiniment |
| `animate-none` | l'arrête |

Les transitions s'exécutent sur le thread d'interface lorsqu'une valeur change, y compris lorsqu'une variante commence ou cesse de correspondre ; `transition active:scale-95` anime donc l'appui sans JS. Encapsulez les animations dans `motion-safe:` pour respecter le réglage de réduction des animations.

<a id="interactivity"></a>

## Interactivité

| Classe | Définit |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"` : indique si la vue est une cible pour les touchers et le pointeur, hérité comme en CSS : à l'intérieur d'une vue `pointer-events-none`, une vue `pointer-events-auto` redevient une cible |
| `cursor-<name>`, `cursor-[<name>]` | `cursor` : `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (tous les mots-clés de curseur CSS) |
| `select-none`, `select-text`, `select-auto` | sélection de texte (voir Typographie) |

## SVG

| Classe | Définit |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` est `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

## Images

| Classe | Définit |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` étire, `none` conserve la taille naturelle, placée à `objectPosition`, `scale-down` est identique, mais réduit pour s'adapter lorsque l'image est plus grande) ; images et vidéos |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... sont identiques à `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (recolore les images modèles) |

<a id="accepted-without-effect"></a>

## Acceptés sans effet

Ces utilitaires sont des indications de rendu, ou correspondent à ce que toute vue native est déjà ; ils sont analysés sans avertissement et ne changent rien : `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. Le défilement, l'accrochage et le défilement excédentaire sont des props de [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## Non pris en charge

Les variantes `peer-*`, les pseudo-éléments (`before:`, `after:`), les propriétés arbitraires (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, les requêtes de conteneur, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, les contraintes min/max intrinsèques (comme `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` et `isolate` sont des classes inconnues. `nsh build` et `nsh dev` signalent par un avertissement les classes inconnues qu'ils trouvent dans votre code source (`file:line:col: unknown class '...'`), et le runtime journalise chaque classe inconnue une seule fois.

<a id="variants"></a>

## Variantes

Les variantes rendent un utilitaire conditionnel : `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Elles s'empilent (`dark:active:bg-zinc-700`) et sont évaluées nativement chaque fois que ce dont elles dépendent change.

<a id="appearance-and-environment"></a>

### Apparence et environnement

| Variante | S'applique quand | Rust |
|---|---|---|
| `dark:` | l'apparence est sombre | `.dark(\|s\| …)` |
| `ios:` | l'exécution a lieu sur iOS ou Mac Catalyst | `.when(os() == Os::Ios, …)` |
| `android:` | l'exécution a lieu sur Android | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | la fenêtre est plus haute que large / plus large que haute | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | la direction de mise en page | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | l'utilisateur n'a pas demandé / a demandé une réduction des animations | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### Points de rupture

Les points de rupture comparent la largeur de la fenêtre en points.

| Variante | Largeur min. |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Forme | Exemple | S'applique quand |
|---|---|---|
| `<bp>:` | `md:p-8` | largeur ≥ point de rupture |
| `max-<bp>:` | `max-md:p-1` | largeur < point de rupture |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | largeur ≥ la longueur |
| `max-[<length>]:` | `max-[400px]:text-sm` | largeur < la longueur |

Un téléphone en mode portrait (390 points de large) ne correspond à aucun des points de rupture par défaut ; une tablette ou un téléphone en mode paysage en satisfait plusieurs. En Rust, un point de rupture est une condition sur la fenêtre : `.style_when(move || window().width >= px(768.0), |s| s.p_8())` équivaut à `md:p-8`.

<a id="interaction-states"></a>

### États d'interaction

Les états ne sont suivis par la plateforme que pour les éléments dont les classes les utilisent, et les changements s'appliquent nativement, sans aller-retour avec JS.

| Variante | S'applique quand | Rust |
|---|---|---|
| `active:` | l'élément est pressé | `.active(\|s\| …)` |
| `hover:` | un pointeur le survole (pointeur iPad, Mac Catalyst, souris Android) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | le champ de saisie a le focus | `.focus(\|s\| …)` |
| `focus-within:` | l'élément ou un descendant a le focus (le contenu d'un `Overlay` est un descendant de l'élément dans lequel il se trouve) | `.focus_within(…)` |
| `disabled:` | l'élément possède la prop `disabled` | `.disabled_style(\|s\| …)` |
| `enabled:` | l'élément ne possède pas la prop `disabled` |  |
| `selected:` | l'élément est sélectionné : le `selected` d'un `Button`, ou `accessibilityState.selected` |  |
| `checked:` | l'élément est coché : `accessibilityState.checked` vaut `true` (`"mixed"` n'est pas coché) |  |
| `indeterminate:` | l'élément est indéterminé : `accessibilityState.checked` vaut `"mixed"` |  |
| `aria-expanded:` | l'élément est déployé : `accessibilityState.expanded` vaut `true` (le déclencheur d'un `Popover` ou d'un `Menu` tant que sa fenêtre contextuelle est ouverte) |  |
| `aria-pressed:` | l'élément est un bouton à bascule activé : `accessibilityState.pressed` vaut `true` (`"mixed"` n'est pas pressé ; différent de `active:`, un appui en cours) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | l'élément est occupé : `accessibilityState.busy` vaut `true` |  |
| `aria-checked:` | l'élément est coché : `accessibilityState.checked` vaut `true`, comme `checked:` |  |
| `aria-selected:` | l'élément est sélectionné : `accessibilityState.selected` vaut `true`, comme `selected:` |  |
| `data-<name>:` | l'élément possède l'attribut booléen `data-*` `name` (le `&[data-<name>]` de Tailwind ; noms composés de lettres minuscules, de chiffres et de `-`) : ce qu'une partie d'un composant affiche au-delà de ses états, par exemple le jour d'un calendrier au début d'une plage `data-range-start` | `Interactive::project_data(name, …)` en définit un |

Les mêmes états sous forme d'objets de style sont les props `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` et `pressedStyle` de chaque élément (et le `selectedStyle` d'un `Button`) ; elles prennent le pas sur le style et les classes de l'élément.

`disabled` fonctionne sur n'importe quel élément : il applique `disabled:` et supprime les gestionnaires d'appui de l'élément, qui n'affiche donc aucun retour visuel à l'appui non plus.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Groupes

Marquez un ancêtre avec `group` et stylez les descendants selon son état avec `group-<state>:`. Nommez les groupes pour les imbriquer : `group/card` et `group-hover/card:`.

| Variante | S'applique quand le groupe est | Rust |
|---|---|---|
| `group-active:` | pressé | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | survolé | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | ayant le focus |  |
| `group-focus-within:` | ayant le focus ou contenant le focus | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | désactivé |  |
| `group-selected:` | sélectionné |  |
| `group-checked:` | coché |  |
| `group-indeterminate:` | indéterminé |  |
| `group-aria-expanded:` | développé |  |
| `group-aria-pressed:` | un bouton bascule activé |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | occupé, coché, sélectionné |  |
| `group-data-<name>:` | affichant l'attribut `data-*` `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Position parmi les éléments frères

| Variante | S'applique à |
|---|---|
| `first:` | le premier enfant |
| `last:` | le dernier enfant |
| `only:` | l'enfant unique |
| `odd:` | le 1er, 3e, ... enfant |
| `even:` | le 2e, 4e, ... enfant |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Placeholder et sélection

`placeholder:` s'applique au placeholder d'un `<Input>` et n'accepte qu'une couleur de texte : `placeholder:text-zinc-400` (la clé de style `placeholderColor`). `selection:` s'applique à la sélection d'un `<Input>` ou d'un `<Text>` sélectionnable, et, sur n'importe quel élément, à ce qu'il contient (le `& *::selection` de Tailwind ; celui de l'élément le plus proche l'emporte), et accepte son arrière-plan, la surbrillance : `selection:bg-violet-200` (la clé de style `selectionColor`, qui teinte aussi le curseur d'un champ de saisie là où la plateforme le dessine d'une seule couleur).

### Important

Placer `!` avant ou après un utilitaire (`!p-4`, `p-4!`) le fait l'emporter sur toutes les autres classes et sur le `style` en ligne.

<a id="theme-customization"></a>

## Personnalisation du thème

Étendez le thème dans l'objet `"tailwind"` du `nsh.json` de votre app. Les entrées avec un nouveau nom sont ajoutées ; celles dont le nom existe déjà remplacent la valeur par défaut. Les longueurs sont en points. Le thème est vérifié lors du bundling de l'app : une clé inconnue ou une valeur invalide provoque une erreur de build.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

Avec ce thème, `bg-brand-500`, `bg-brand` (la teinte `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` et `max-w-content` fonctionnent tous.

| Clé | Valeur | Utilisé par |
|---|---|---|
| `colors` | `{ name: color }` ou `{ name: { shade: color } }` ; `DEFAULT` nomme la couleur nue. Toute syntaxe de couleur CSS. | tous les utilitaires de couleur |
| `spacing` | points par pas (4 par défaut) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | points par `rem` (16 par défaut) | |
| `breakpoints` | `{ name: width }` | variantes de point d'arrêt (triées par largeur) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (une famille système ou le nom d'une police embarquée) | `font-*` |
| `fontSize` | `{ name: size }` ou `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Le thème Tailwind ne façonne que les classes de votre app. Les design tokens de l'app (les couleurs de shadcn/ui, `radius`, les polices et ceux propres à l'app) constituent son thème, la clé `"theme"` de `nsh.json`, avec lequel les composants Rust dessinent ; voir [Rust](../docs/rust.md#theme). Les classes désignent ces tokens par des noms Tailwind, comme des variables `@theme` (`bg-primary`, `bg-up/30`, `rounded-(--radius)`) : voir [Tokens de thème](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## Voir aussi

- [Tailwind](../docs/tailwind.md) : le guide.
- [Mise en forme](../docs/styling.md) : `class`, `classList`, `style` et comment ils se combinent.
- [Référence des styles](./style-reference.md) : les clés de style que définissent les utilitaires.
