---
title: "Plot"
description: "Le composant Plot de nsh/base/plot, ses marques Line, Area, Bar, Rule, Dot, Cell, Grid, Pie, Arc, RadialLine, RadialGrid, Sankey et Treemap, ainsi que ses composants PlotAxis et PlotLabel : des graphiques dessinés nativement à partir des lignes de l'app, avec les échelles des axes et leurs libellés, des textes sur les points de données, la ligne, la cellule ou la part sous le pointeur, le mouvement, et aucun style propre."
group: base
demo: el-plot
source_hash: 2aca4d23862b455b
---

# Plot

Un Plot est le cadre d'un graphique : les lignes de données qu'il affiche, les échelles de ses axes x et y, le pointeur qui le survole et son mouvement. Ses marques dessinent ce qu'il contient : un `Line` à travers une série, une `Area` entre une série et une ligne de base, un `Bar`
par ligne dans les bandes d'une échelle à bandes, un `Rule` par ligne d'un début à une fin (la mèche d'une bougie), un `Dot` par ligne là où deux de ses valeurs se rencontrent (les points d'un nuage de points, les bulles d'un graphique à bulles), un `Cell` par ligne dans les bandes de deux catégories, coloré selon sa valeur (une carte de chaleur), un `Grid` de lignes transversales, un `Pie` des parts des lignes (un anneau avec un trou), un
`Arc` entre deux angles, et un `RadialLine` autour du centre avec les anneaux et les rayons d'une `RadialGrid` derrière lui (un
radar), un `Sankey` de flux entre les lignes, et un `Treemap` de rectangles imbriqués, l'aire de chaque feuille valant sa valeur (une carte de marché) ; un `PlotAxis` légende un bord avec les graduations de son échelle, et un `PlotLabel` écrit des textes en
des points des échelles. Chaque marque est un canvas qui remplit le Plot, dessiné nativement à partir des lignes : les lignes de l'app sont lues une seule fois,
lorsqu'elle les définit, puis mises à l'échelle, enregistrées et dessinées en Rust, de sorte qu'un graphique de mille points n'exécute aucun JS par point. Le pointeur
est lui aussi suivi en Rust : la ligne de repère, les points et l'infobulle du survol se déplacent et s'estompent sur l'animateur de la plateforme, et l'app
n'est informée que d'une nouvelle ligne, rien de plus. L'apparence revient à l'app : les marques se peignent avec les propriétés de peinture CSS des formes SVG
(`stroke-*`, `fill-*`), `currentColor` lorsqu'aucune n'est définie ; une aire ou une barre affiche un arrière-plan (un dégradé,
`bg-linear-*`) à l'intérieur de sa forme, et les éléments du survol (dont le point de chaque marque) ainsi que les étiquettes, les graduations et
les lignes des axes sont à styliser et à remplir par l'app.

```rust tabs
use nsh_base::{
    plot::{area, grid, line, plot},
    theme,
};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn week(visitors: Vec<f64>, hovered: Signal<Option<u32>>) -> impl IntoElement {
    let rows = Rows::from_columns(visitors.len(), [("visitors".into(), visitors)]);
    plot()
        .data(rows)
        .y(RowAccessor::key("visitors"))
        .accessibility_label("Visitors per day")
        .h(px(160.0))
        .on_hover_change(move |index: &Option<u32>| hovered.set(*index))
        .child(grid().y(vec![0.0, 1500.0, 3000.0]).stroke_color(move || theme().border))
        .child(area().fill_color(move || theme().chart_1.opacity(0.2)))
        .child(line().stroke_color(move || theme().chart_1).stroke_width(px(2.0)))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

function App() {
  const hovered = signal<number | null>(null);
  return (
    <View class="gap-2 p-4">
      <Text class="text-sm text-muted-foreground tabular-nums">
        {hovered() == null ? "Visitors" : `${rows[hovered()!].day}: ${rows[hovered()!].visitors}`}
      </Text>
      <Plot
        data={rows}
        y="visitors"
        yScale={{ type: "linear", domain: [0, 3000] }}
        accessibilityLabel="Visitors per day, highest on Thursday"
        onHoverChange={({ index }) => hovered.set(index)}
        crossLineClass="w-px h-full bg-border"
        dotClass="size-2.5 rounded-full border-2 border-background bg-chart-1"
        class="h-40"
      >
        <Grid y={[0, 1500, 3000]} class="stroke-border" />
        <Area class="fill-chart-1/20" />
        <Line class="stroke-chart-1 stroke-2" />
      </Plot>
    </View>
  );
}

mount(App);
```

`Plot`, `Line`, `Area`, `Bar`, `Rule`, `Dot`, `Cell`, `Grid`, `Pie`, `Arc`, `RadialLine`, `RadialGrid`, `Sankey`, `Treemap`, `PlotAxis` et `PlotLabel` proviennent de `nsh/base/plot`, un module de [`nsh/base`](../modules/nsh-base.md) qui leur est
propre (en Rust, `nsh_base::plot`). En TypeScript, les props d'un Plot sont génériques sur le type de ses lignes : les noms de champs
sont vérifiés par rapport à elles, et une fonction d'une ligne reçoit le type de la ligne. En Rust, `plot()` en construit un avec un setter par prop,
les lignes sont un `Rows` (des colonnes de nombres par clé), les valeurs un `RowAccessor` (une clé ou une fonction de l'index de la ligne), et
les marques utilisent les méthodes de peinture typées (`.stroke_color(..)`, `.fill_color(..)`, `.stroke_width(..)`).

<a id="plot-1"></a>

## Plot

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `data` | `.data(..)` | `T[]` | (obligatoire) | Les lignes, un objet par point. Les marques lisent leurs valeurs une seule fois, quand l'app définit les lignes ; une ligne sans valeur (un champ qui n'est pas un nombre, `null`) est ignorée. |
| `x` | `.x(..)` | `keyof T \| (d: T, index: number) => number` | l'index de la ligne | Ce qui place une ligne le long de l'axe x sur une échelle x `linear`. Une échelle `point` place les lignes dans l'ordre. |
| `y` | `.y(..)` | `keyof T \| (d: T, index: number) => number` | aucun | Ce que dessinent les marques, sauf si elles indiquent leur propre valeur. |
| `xScale` | `.x_scale(..)` | `Scale` | `{ type: "point" }` | Comment l'axe x place les lignes : `point` (dans l'ordre, régulièrement du bord gauche au bord droit ; une seule ligne au milieu), `linear` avec un `domain` facultatif, ou `band` (une bande par ligne, pour les barres, [Bar](#bar) ; ou une bande par catégorie, pour les cellules, [Cell](#cell)). Avec une échelle y `band`, la valeur par défaut est `linear`, pour des barres horizontales. `reverse: true` la fait partir du bord droit ([Échelles inversées](#reversed-scales)). |
| `yScale` | `.y_scale(..)` | `Scale` | `{ type: "linear" }` | Comment l'axe y place les valeurs : la plus petite valeur du domaine au bord inférieur, la plus grande au bord supérieur. Sans `domain`, l'étendue de ce que dessinent les marques. `band` dispose une bande par ligne à partir du bord supérieur vers le bas, pour des barres horizontales. `reverse: true` la fait courir dans l'autre sens : la plus petite valeur au bord supérieur, les lignes du bord inférieur vers le haut ([Échelles inversées](#reversed-scales)). |
| `y2Scale` | `.y2_scale(..)` | `LinearScale` | aucun | Une seconde échelle y, `{ type: "linear", domain?, reverse? }`, pour les marques qui la nomment (`scale="y2"`) : l'échelle de droite d'un graphique à double axe ([Axes doubles](#dual-axes)). Sans `domain`, l'étendue des valeurs qui s'y trouvent. |
| `alignTicks` | `.align_ticks(..)` | `boolean` | `true` | Tant qu'aucune des deux échelles y ne nomme de domaine et que des marques sont sur les deux, elles sont élargies selon les mêmes pas arrondis afin que leurs graduations tombent sur les mêmes lignes ([Axes doubles](#dual-axes)). `false` conserve pour chacune l'étendue de ses valeurs. |
| `interactive` | `.interactive(..)` | `boolean` | `true` | Le Plot suit le pointeur et le clavier : il signale la ligne qui se trouve dessous et affiche les éléments du survol, et il constitue un arrêt de Tab dont les flèches déplacent le survol ([Clavier](#keyboard)). `false` ne dessine que les marques (une sparkline dans une liste), et les appuis sur lui sont transmis aux vues qui l'entourent. Le fait que le Plot offre ou non le clavier est déterminé à sa création. |
| `motion` | `.motion(..)` | `PlotMotion` | aucun | Le timing de l'apparition, le fondu entrant et sortant du survol, et le ressort sur lequel le survol glisse quand les touches le déplacent (ci-dessous). |
| `appearGeneration` | `.appear_generation(..)` | `number \| string` | aucun | Active l'apparition : les marques se dessinent progressivement quand le Plot est affiché pour la première fois, puis à chaque changement de cette valeur (un autre symbole, une autre période). À l'intérieur d'un [`PlotAppearScope`](#plotappearscope), une génération qui s'y est terminée s'affiche d'un coup en entier. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran disent du graphique : ce qu'il montre et ce qui ressort. |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | aucun | Ce que les lecteurs d'écran entendent comme sa valeur : les mots de l'app pour la ligne sous le pointeur. |
| `crossLineClass`, `crossLineStyle` | `.cross_line_class(..)`, `.cross_line_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La ligne de repère : une vue aussi haute que le Plot, centrée sur la ligne sous le pointeur. Sur une échelle à bandes, elle se place dans la bande de la ligne, aussi large que la bande (sur toute la largeur du Plot sur une échelle y à bandes). |
| `dotClass`, `dotStyle` | `.dot_class(..)`, `.dot_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Les points du survol : une vue par `Line`, `Area` et `RadialLine`, centrée sur son point à la ligne sous le pointeur, et celle d'un `Dot` aussi grande que son point sous le pointeur. Les `hoverDotClass` / `hoverDotStyle` d'une marque les remplacent pour son propre point. |
| `tooltipContent` | `.tooltip_content(..)` | `JSX.Element` | aucun | L'infobulle de l'app, placée par `tooltipPlacement` et déplacée et estompée avec la ligne de repère. |
| `tooltipPlacement` | `.tooltip_placement(..)` | `"top" \| "pointer"` | `"top"` | L'emplacement de l'infobulle : en haut du Plot, centrée sur la ligne de repère ; ou à côté du pointeur, du côté de la ligne de repère tourné vers le milieu du Plot, en dessous du pointeur dans la moitié supérieure, au-dessus dans la moitié inférieure. En haut, elle reste entre les bords gauche et droit du Plot (son décalage par rapport au bord supérieur dépend de l'app : une étiquette sous le Plot prend la hauteur du Plot et davantage) ; à côté du pointeur, elle reste à l'intérieur du Plot. Avec le clavier, elle se place à côté du point de la première ligne ou aire à cette ligne (le milieu de la bande d'une barre, le milieu de la tranche d'un camembert). |
| `tooltipOffset` | `.tooltip_offset(..)` | `number` | `0` | La distance entre l'infobulle et ce qui la place : le bord supérieur pour `"top"`, la ligne de repère et le pointeur pour `"pointer"`. |
| `colorScale` | `.color_scale(..)` | `ColorScale` | aucun | Les couleurs des marques : des catégories que lit leur `color`, comme le `scaleOrdinal` de d3 (`{ type: "ordinal", domain?, range, unknown? }`, [Couleurs par catégorie](#colors-by-category)), ou des nombres que lit le `value` d'un `Cell` le long d'une rampe, comme le `scaleSequential` et le `scaleDiverging` de d3 (`{ type: "sequential" \| "diverging", … }`, [Couleurs le long d'une rampe](#colors-along-a-ramp)). |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les marques, dessinées dans l'ordre les unes sur les autres, et tout ce que l'app pose par-dessus. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La taille et l'apparence du Plot ; les marques héritent de ses propriétés de peinture, comme CSS les fait hériter. Les classes `focus:` / `focus-visible:` et `focusStyle` dessinent son anneau de focus. |

| Événement | Rust | Charge utile | Quand |
|---|---|---|---|
| `onHoverChange` | `.on_hover_change(..)` | `{ index: number \| null }` | Le pointeur est passé sur une autre ligne : l'index de la ligne la plus proche de lui le long de l'axe x (le long de l'axe y quand seul celui-ci a des bandes), de la tranche du [pie](#pie-and-arc) sous lui, du [dot](#dot) dont le centre est le plus proche de lui, de la [cell](#cell) sous lui (dans l'espace entre deux cellules, la plus proche), ou de la ligne d'une [radial line](#radialline-and-radialgrid) la plus proche de lui par l'angle ; `null` dès qu'il quitte le Plot (sur un pie, ses tranches ; sur une radial line, son rayon extérieur). |

`Scale` est `{ type: "point"; reverse? } | { type: "linear"; domain?: [number, number]; reverse? } | { type: "band";
domain?: string[]; paddingInner?; paddingOuter?; maxBandWidth?; bandCount?; groupPadding?; reverse? }`. A `linear`
 : le `domain` de cette échelle est l'étendue de ses deux valeurs, dans un ordre ou dans l'autre ; un domaine d'une seule valeur la place au milieu. Le
`domain` d'une échelle `band` correspond aux catégories de ses bandes, dans l'ordre ([Cell](#cell)) ; ses autres options se trouvent dans [Bar](#bar).

Une fonction d'une ligne (`y={(d) => d.high - d.low}`) est appelée une fois par ligne quand les lignes ou la fonction changent, au
tour suivant, jamais pendant que le Plot se dessine ou suit le pointeur : elle doit rester pure (même ligne, même nombre). Un nom
de champ est lu sans aucun JS.

<a id="reversed-scales"></a>

### Échelles inversées

`reverse: true` fait partir une échelle de son autre bord, comme les échelles de visx acceptent `reverse` et celles de d3 une plage écrite
à l'envers. Sur l'axe x, la première ligne, ou la plus petite valeur du domaine, se trouve au bord droit ; sur l'axe y, la
plus petite valeur du domaine se trouve au bord supérieur et les lignes vont du bord inférieur vers le haut. Tout ce qui est placé sur l'échelle
la suit : les marques, la base des barres et leur sens de croissance, la ligne de base d'une aire, les lignes de grille, les graduations de `PlotAxis`,
la ligne que trouve le survol, les flèches du clavier ([Clavier](#keyboard)) et les passages à un nouveau domaine. Les barres pendent du bord supérieur
sur une échelle y `linear` inversée, et les barres horizontales croissent vers la gauche à partir du bord droit sur une échelle x `linear`
inversée :

```tsx
<Plot
  data={depths}
  y="depth"
  xScale={{ type: "band", paddingInner: 0.2 }}
  yScale={{ type: "linear", domain: [0, 40], reverse: true }}
  class="h-32"
>
  <Bar class="fill-chart-2" cornerRadii={{ bottomLeft: 3, bottomRight: 3 }} />
</Plot>
```

Avec l'apparition du Plot, les lignes et les aires se dessinent à partir du bord où commence l'échelle x, le bord droit
lorsqu'elle est inversée.

<a id="dual-axes"></a>

### Axes doubles

<!-- demo: el-plot-dual -->

Un Plot dispose d'une seconde échelle y pour des valeurs d'autres unités : des volumes à côté d'un prix, un chiffre d'affaires à côté d'une marge. Chaque élément
qui place des valeurs le long de y accepte `scale` : `"y"` (la valeur par défaut, le `yScale` du Plot) ou `"y2"` (son `y2Scale`). Un
`PlotAxis` à droite avec `scale="y2"` le légende :

```tsx
<Plot data={days} xScale={{ type: "band", paddingInner: 0.3 }} class="mx-10 mb-6 h-44">
  <Grid class="stroke-border" />
  <Bar value="volume" class="fill-chart-2/50" />
  <Line y="close" scale="y2" class="stroke-chart-1 stroke-2" />
  <PlotAxis placement="left" format={(v) => `${v}M`} labelClass="pr-2 text-xs text-muted-foreground" />
  <PlotAxis placement="right" scale="y2" labelClass="pl-2 text-xs text-muted-foreground" />
</Plot>
```

Le domaine de chaque échelle lui est propre : le `domain` de l'app, ou l'étendue des valeurs qui s'y trouvent, et chacune passe à un nouveau domaine
avec `motion.update`. Tant qu'aucune des deux échelles ne nomme de domaine, le Plot dispose les deux selon le même nombre de pas arrondis (1,
2 ou 5 fois une puissance de dix, un pas pour environ 32 points de hauteur) : quand les deux contiennent zéro, zéro tombe sur la même
ligne sur les deux ; sinon, une échelle qui commence à zéro (les volumes) gagne ses pas supplémentaires vers le haut et une autre (un prix) des deux côtés. Les graduations des axes sont ces pas, et un `Grid` sans `x` ni `y` trace ses lignes à ces endroits, de sorte qu'une seule
grille sert les deux axes. `alignTicks={false}` désactive ce comportement ; un `domain` que l'app nomme laisse les deux échelles telles quelles.

Le survol trouve une seule ligne ; le point de chaque marque se place sur sa propre échelle, et la lecture est celle de l'app, qui lit les deux valeurs
de la ligne que signale `onHoverChange`. Les barres sur les deux échelles se tiennent côte à côte dans chaque bande, et un `stack` n'empile que les
barres de son échelle. `y2Scale` est linéaire : un Plot dont l'axe y a des bandes n'a pas de seconde échelle y.
<a id="line-area-and-grid"></a>

## Line, Area et Grid

| Marque | Prop | Type | Défaut | Description |
|---|---|---|---|---|
| `Line` | `y` | `string \| (d, index) => number` | `y` du plot | Ce qu'elle dessine : un point par ligne ayant une valeur, les lignes sans valeur étant ignorées. |
| `Line`, `Area` | `data`, `x` | `T[]`, `string \| (d, index) => number` | les lignes du plot | Lignes d'une série qui lui est propre (d'autres valeurs x), placées sur les échelles du plot par son propre `x` (l'indice de la ligne à défaut). |
| `Line`, `Area` | `curve` | `"natural" \| "linear" \| "stepAfter"` | `"natural"` | Comment elle relie ses points : une courbe lisse, des segments droits, ou des paliers qui maintiennent chaque valeur jusqu'à la ligne suivante. Le bord inférieur d'une aire suit la même courbe. |
| `Line` | `dot`, `dotClass`, `dotStyle` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un point sur chaque donnée : une vue centrée dessus, dont la taille, l'arrière-plan et la bordure sont ceux de l'app. |
| `Line`, `Area` | `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` du plot | Son point de survol, placé sur son point à la ligne située sous le pointeur : le point de chaque série dans sa propre couleur. Chacun remplace celui du plot pour cette marque (la couleur de la marque l'emporte sur la taille et l'anneau du plot) ; `hidden` n'en affiche aucun. |
| `Area` | `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | aucun | Son arrière-plan : une boîte autour de sa forme (de son premier point à son dernier, de son point le plus haut à sa ligne de base, ou au point le plus bas de son bord inférieur sur une bande) dont l'arrière-plan (`bg-*`, `bg-linear-to-b from-… to-…`, `backgroundImage`) n'apparaît qu'à l'intérieur de la forme, sous son `fill`. Avec un arrière-plan, `fill` vaut `none` lorsqu'aucun n'est défini. |
| `Area` | `y1` | `string \| (d, index) => number` | `y` du plot | Ce qui forme son bord supérieur. |
| `Area` | `y0` | `number \| string \| (d, index) => number` | le bord inférieur de l'échelle y | Son bord inférieur : un nombre est une ligne de base sur l'échelle y ; un champ ou une fonction donne à chaque ligne sa propre valeur inférieure, ce qui fait de l'aire une bande (du minimum au maximum d'une journée, la fourchette d'une prévision). Sans cette prop, l'aire se ferme sur le bord où se trouvent les plus petites valeurs de l'échelle y : le bord inférieur, ou le bord supérieur sur une échelle inversée (une aire suspendue en haut). Une ligne sans valeur sur l'un ou l'autre bord est ignorée. |
| `Line`, `Area`, `Grid` | `scale` | `"y" \| "y2"` | `"y"` | L'échelle y le long de laquelle vont ses valeurs : `yScale` du plot ou sa seconde échelle, `y2Scale` ([Axes doubles](#dual-axes)). |
| `Grid` | `x` | `number[]` | aucun | L'emplacement de ses lignes verticales, en valeurs de l'échelle x (indices de ligne sur une échelle `point`). |
| `Grid` | `y` | `number[]` | aucun | L'emplacement de ses lignes horizontales, en valeurs de l'échelle y. Sans `x` ni `y`, les lignes suivent les graduations de son échelle, là où les place un `PlotAxis` sans `ticks` (le long de x pour des barres horizontales). |
| `Grid` | `ticks` | `number` | la valeur par défaut de l'axe | Le nombre approximatif de lignes tracées sans `x` ni `y`, comme le `ticks` d'un `PlotAxis`. |
| `Line`, `Area` | `color` | `string \| (d, index) => string` | aucun | La catégorie de ses lignes, dont la couleur vient du `colorScale` du plot : la catégorie de sa première ligne donne le `stroke` du trait (le `fill` de l'aire) lorsque rien d'autre n'en définit un ([Couleurs par catégorie](#colors-by-category)). |

Chaque marque remplit le plot et se peint avec ses [propriétés de peinture SVG](../modules/style-reference.md#svg-paint), les siennes l'emportant sur celles du plot, comme CSS les hérite :

| Marque | Se peint avec | Si aucune n'est définie |
|---|---|---|
| `Line` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 d'épaisseur, plein |
| `Area` | `fill` (sur sa partie `background`) ; son bord supérieur `stroke`, `strokeWidth`, `strokeDasharray` | `fill` `currentColor` (`none` à côté d'un arrière-plan) ; pas de trait |
| `Grid` | `stroke`, `strokeWidth`, `strokeDasharray` | `currentColor`, 1 d'épaisseur, plein ; chaque ligne sur des pixels d'appareil entiers, de sorte qu'une ligne fine reste nette |

Les valeurs que dessine un `Line` ou un `Area`, ainsi que le `y0` d'une aire (sa ligne de base, ou la valeur inférieure de chaque ligne), forment le domaine de l'échelle y lorsque le plot n'en a pas ; celles d'une grille n'y contribuent pas. Une marque ne se redessine que lorsque ce qu'elle dessine change (ses lignes, ses valeurs, sa courbe, la taille ou les échelles du plot, sa peinture) ; le pointeur déplace les éléments du survol et ne redessine jamais une marque.

Une bande est un `Area` dont le `y0` lit les lignes : son bord supérieur passe par `y1`, son bord inférieur revient par `y0`, tous deux avec le `curve` de l'aire, et l'appear les dessine progressivement depuis le bord d'attaque. Son point de survol se place sur le bord supérieur ; un `Line` au-dessus marque la valeur médiane :

```tsx
<Plot data={days} y="close">
  <Area y1="high" y0="low" class="fill-chart-1/15" hoverDotClass="hidden" />
  <Line class="stroke-chart-1 stroke-2" />
</Plot>
```

`fill` est celui de CSS, comme dans un navigateur : une couleur. Un dégradé sous une ligne est l'arrière-plan d'une aire, de la même façon qu'une page affiche un dégradé dans une forme (un `background-image` de boîte sous `clip-path`) : `backgroundClass="bg-linear-to-b from-chart-1/20
to-transparent"` estompe depuis le point le plus haut de l'aire jusqu'à sa ligne de base, avec les tokens du thème et les couleurs de l'apparence comme pour l'arrière-plan de n'importe quelle vue.

## Bar

Un `Bar` dessine une barre par ligne dans la bande de la ligne sur une échelle `band` : verticale sur une échelle x de type band, horizontale sur une échelle y de type band (l'échelle x étant alors `linear`). Chaque barre va de `base` à la valeur de la ligne sur l'autre échelle ; une valeur négative l'étend donc dans l'autre sens, et une ligne sans valeur n'a pas de barre. Sur une échelle de valeurs inversée, les barres croissent vers le bas depuis le bord supérieur ou vers la gauche depuis le bord droit, et une échelle band inversée place la bande de la première ligne à droite ou en bas ([Échelles inversées](#reversed-scales)).

```tsx
import { Bar, Grid, Plot } from "nsh/base/plot";

const sales = [
  { month: "Jan", online: 42, store: 31 },
  { month: "Feb", online: 51, store: 28 },
  { month: "Mar", online: 48, store: 36 },
];

<Plot
  data={sales}
  xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, groupPadding: 0.1 }}
  yScale={{ type: "linear", domain: [0, 60] }}
  class="h-40"
>
  <Grid y={[20, 40, 60]} class="stroke-border" />
  <Bar value="online" class="fill-chart-1" cornerRadii={{ topLeft: 4, topRight: 4 }} />
  <Bar value="store" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} />
</Plot>
```

Les barres hors d'une pile se tiennent côte à côte dans chaque bande, dans l'ordre des marques ; les barres ayant le même `stack` s'empilent, la barre de chaque ligne commençant là où finit la précédente dans la pile :

```tsx
<Bar value="online" stack="sales" class="fill-chart-1" />
<Bar value="store" stack="sales" class="fill-chart-2" cornerRadii={{ topLeft: 4, topRight: 4 }} label={(d) => `${d.online + d.store}`} />
```

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` du plot | Ce que montre chaque barre. |
| `base` | `number \| string \| (d, index) => number` | `0` | La valeur d'où croissent ses barres, sur l'échelle de valeurs : une pour toutes les lignes, ou un champ ou une fonction donnant à chaque ligne la sienne, de sorte que chaque barre couvre de la base de sa ligne à sa valeur (une ligne sans base n'a pas de barre). Elle compte dans le domaine. Une pile croît à partir de la base de sa première barre, ligne par ligne. |
| `stack` | `string` | aucun | La pile qu'elle rejoint : les barres ayant le même `stack` s'empilent dans l'ordre (une ligne sans valeur n'ajoute rien). |
| `scale` | `"y" \| "y2"` | `"y"` | L'échelle y le long de laquelle vont les valeurs de ses barres verticales ([Axes doubles](#dual-axes)) ; les barres des deux échelles se tiennent côte à côte, et une pile n'empile que les barres de son échelle. |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Le rayon de chaque coin de ses barres ; `{ topLeft: 4, topRight: 4 }` arrondit l'extrémité des barres verticales. Un rayon supérieur à la moitié d'une barre est ajusté à celle-ci. |
| `stagger` | `number` | `0` | Avec l'appear du plot, les barres démarrent l'une après l'autre, ligne par ligne, sur cette part de l'animation (de 0 à 0,95), chacune croissant pendant le reste ; 0 les fait croître ensemble. |
| `inactiveOpacity` | `number` | aucun | L'opacité de ses barres autres que celle de la ligne sous le pointeur tant que celui-ci est sur le plot, afin que cette ligne ressorte : elle apparaît et disparaît en fondu avec le survol et passe de barre en barre avec lui. |
| `label` | `string \| (d, index) => string` | aucun | Le texte à l'extrémité de valeur de chaque barre : un champ (son texte ou son nombre) ou une fonction renvoyant le texte formaté par l'app. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | aucun | La partie `label` : un texte centré sur la barre, au-dessus de l'extrémité d'une barre verticale (en dessous pour une barre qui croît vers le bas), après une barre horizontale (avant une barre qui croît vers l'arrière). Son padding est sa distance à la barre. |
| `backgroundClass`, `backgroundStyle` | `string`, `StyleProp<ViewStyle>` | aucun | Son arrière-plan : la boîte de chaque barre, dont l'arrière-plan (`bg-linear-to-t from-… to-…`, du bas de la barre à son sommet) n'apparaît qu'à l'intérieur de la barre, sous son `fill`. Avec un arrière-plan, `fill` vaut `none` lorsqu'aucun n'est défini. |
| `color` | `string \| (d, index) => string` | aucun | La catégorie de chaque barre, dont la couleur vient du `colorScale` du plot : le `fill` de la barre lorsque rien d'autre n'en définit un ([Couleurs par catégorie](#colors-by-category)). |

L'échelle band dispose une bande par ligne du plot, dans l'ordre, ou une bande par catégorie de son `domain`, comme le fait `scaleBand` de d3 :

| Option | Défaut | Description |
|---|---|---|
| `domain` | aucun | Les catégories de ses bandes, dans l'ordre (`scaleBand().domain()` de d3) : un [`Cell`](#cell) va dans la bande de la catégorie de sa ligne, et un `PlotAxis` écrit la catégorie de chaque bande ; une catégorie écrite deux fois conserve sa première place. Sans cette option, les bandes sont les lignes, ou, sur des cellules, les catégories que nomment les cellules le long de l'axe, dans l'ordre où les lignes les apportent. |
| `paddingInner` | `0` | L'écart entre les bandes voisines, en part du pas de chaque bande (de 0 à 1). |
| `paddingOuter` | `0` | L'écart avant la première bande et après la dernière, en part d'un pas. La moitié de `paddingInner` place le milieu des bandes à pas égaux sur le plot. |
| `maxBandWidth` | aucun | La largeur maximale d'une bande, en points : quelques bandes sur un plot large restent étroites, chacune au milieu de sa place. |
| `bandCount` | les lignes | Les bandes pour lesquelles l'axe est disposé quand elles sont plus nombreuses que les lignes : les lignes prennent les premières et gardent leur largeur et leur place à mesure qu'elles arrivent. |
| `groupPadding` | `0` | L'écart entre les barres côte à côte dans une bande, en part de la place de chaque barre. |
| `reverse` | `false` | Les bandes partent de l'autre bord : celle de la première ligne à droite de l'axe x, en bas de l'axe y ; les barres côte à côte dans une bande gardent leur ordre. |

Une barre se peint avec son `fill` (`fill-*` ; hérité du plot comme CSS l'hérite), `currentColor` lorsqu'aucun n'est défini (la couleur de sa catégorie avec `color`), et n'affiche aucun point de survol. Sur une échelle band, le survol trouve la bande sous le pointeur, et la ligne de croisement du plot se place dans cette bande, aussi large qu'elle : `crossLineClass="w-full h-full bg-foreground/5"` teinte la bande, `w-px` garde une ligne en son milieu. Les valeurs et la base des barres forment le domaine de l'échelle de valeurs lorsque le plot n'en a pas. Avec l'appear du plot, chaque barre croît depuis la base de sa pile ; le mouvement, le fondu et le glissement s'exécutent sur l'animator de la plateforme, et le pointeur ne redessine aucune barre.

### Ranges

<!-- demo: el-plot-ranges -->

Avec `base` comme champ ou fonction, chaque barre couvre deux valeurs de sa ligne : l'étape d'une cascade, du cumul précédent au cumul suivant, le corps d'une bougie, de son ouverture à sa clôture, une tâche, de son début à sa fin. Une barre croît depuis sa propre base lors de son apparition, et son étiquette se place à son extrémité de valeur, au-dessus d'une barre qui monte et en dessous d'une barre qui descend.

```tsx
const bridge = [
  { step: "Revenue", from: 0, to: 120, kind: "total" },
  { step: "Costs", from: 120, to: 72, kind: "down" },
  { step: "Other", from: 72, to: 81, kind: "up" },
  { step: "Profit", from: 0, to: 81, kind: "total" },
];

<Plot
  data={bridge}
  xScale={{ type: "band", paddingInner: 0.3 }}
  colorScale={{ type: "ordinal", domain: ["total", "up", "down"], range: ["#64748b", "#16a34a", "#dc2626"] }}
  class="h-40"
>
  <Bar value="to" base="from" color="kind" label={(d) => `${d.to - d.from}`} labelClass="text-xs pb-1" />
</Plot>
```

Un entonnoir est fait de barres horizontales centrées : `base={(d) => -d.users / 2}` et `value={(d) => d.users / 2}` sur une échelle y de type band.

## Rule

Un `Rule` dessine une droite par ligne le long de l'axe des valeurs, de `base` à la valeur de la ligne : au milieu de la bande de la ligne sur une échelle band (sur toute la largeur du plot sur une échelle y de type band), à la place de la ligne le long de l'axe x sur une échelle point ou linear. La mèche d'une bougie, la moustache d'un box plot, une barre d'erreur et la tige d'un lollipop sont des rules ; un chandelier est un `Bar` au-dessus d'un `Rule` :

```tsx
import { Bar, Plot, Rule } from "nsh/base/plot";

<Plot
  data={days}
  xScale={{ type: "band", paddingInner: 0.4 }}
  colorScale={{ type: "ordinal", domain: ["up", "down"], range: ["#16a34a", "#dc2626"] }}
  class="h-48"
>
  <Rule value="high" base="low" color={(d) => (d.close >= d.open ? "up" : "down")} />
  <Bar value="close" base="open" color={(d) => (d.close >= d.open ? "up" : "down")} />
</Plot>
```

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` du plot | Où se termine chaque ligne. Une ligne sans valeur n'a pas de trait. |
| `base` | `number \| string \| (d, index) => number` | `0` | Où commence chaque trait : une valeur pour toutes les lignes (la tige d'un lollipop à partir de la ligne zéro), ou un champ ou une fonction donnant à chaque ligne la sienne (le minimum d'une bougie). Elle compte dans le domaine. |
| `scale` | `"y" \| "y2"` | `"y"` | L'échelle y le long de laquelle vont ses valeurs ([Axes doubles](#dual-axes)). |
| `stagger` | `number` | `0` | Avec l'appear du plot, les traits démarrent l'un après l'autre, ligne par ligne, sur cette part de l'animation (de 0 à 0,95), chacun croissant depuis son début pendant le reste. |
| `inactiveOpacity` | `number` | aucun | L'opacité de ses traits autres que celui de la ligne sous le pointeur tant que celui-ci est sur le plot, comme celle de `Bar`. |
| `color` | `string \| (d, index) => string` | aucun | La catégorie de chaque trait, dont la couleur vient du `colorScale` du plot : le `stroke` du trait lorsque rien d'autre n'en définit un. |

Un rule se trace avec son `stroke` (`stroke-*`, `strokeWidth`, `strokeDasharray` ; hérités du plot comme CSS les hérite), `currentColor` lorsqu'aucun n'est défini, et n'affiche aucun point de survol. Ses valeurs et sa base forment le domaine de l'échelle de valeurs lorsque le plot n'en a pas ; il croît depuis son début avec l'appear du plot et suit les domaines des échelles, sur l'animator de la plateforme.
## Dot

<!-- demo: el-plot-dots -->

Un `Dot` dessine un point par ligne là où deux valeurs de la ligne se rejoignent : son `x` le long d'une échelle x `linear` et son `value` sur l'axe y forment un nuage de points ; sur une échelle x en bandes, chaque point se place au milieu de la bande de sa ligne ; sur une échelle y en bandes (l'échelle x `linear`), sa valeur court le long de x et la bande de sa ligne descend le long du graphique : c'est un dot plot. Son rayon `r` est un nombre unique pour tous les points, ou une valeur de chaque ligne que `rScale` transforme en rayon : c'est un graphique à bulles. Une ligne sans valeur n'a pas de point.

```tsx
import { Dot, Grid, Plot } from "nsh/base/plot";
import { token } from "nsh";

const sessions = [
  { minutes: 12, trades: 5, platform: "iOS" },
  { minutes: 8, trades: 3, platform: "Android" },
  { minutes: 26, trades: 11, platform: "Web" },
  { minutes: 17, trades: 8, platform: "iOS" },
];

<Plot
  data={sessions}
  x="minutes"
  xScale={{ type: "linear", domain: [0, 40] }}
  yScale={{ type: "linear", domain: [0, 20] }}
  colorScale={{ type: "ordinal", domain: ["iOS", "Android", "Web"], range: [token("chart-1"), token("chart-2"), token("chart-3")] }}
  class="h-48"
>
  <Grid x={[10, 20, 30]} y={[5, 10, 15]} class="stroke-border" />
  <Dot
    value="trades"
    r={4}
    color="platform"
    inactiveOpacity={0.3}
    class="stroke-card stroke-2"
    hoverDotClass="rounded-full outline-2 outline-offset-1 outline-foreground"
  />
</Plot>
```

Avec `r` un champ ou une fonction, la valeur de chaque ligne détermine la taille de son point. `rScale={{ type: "sqrt", range: [min, max] }}` associe les racines carrées des valeurs à des rayons en points, comme le `scaleSqrt` de d3, de sorte qu'avec une plage à partir de 0, l'aire d'une bulle est proportionnelle à sa valeur ; une plage à partir d'une valeur supérieure à 0 garde les plus petites bulles visibles. Le domaine va de 0 à la plus grande valeur, sauf si l'échelle en nomme un. Les plus gros points se dessinent en premier, afin que les plus petits restent visibles par-dessus :

```tsx
<Plot
  data={countries}
  x="gdp"
  xScale={{ type: "linear", domain: [-10, 95] }}
  yScale={{ type: "linear", domain: [48, 90] }}
  colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3"), token("chart-4")] }}
  class="h-56"
>
  <Dot value="life" r="population" rScale={{ type: "sqrt", range: [3, 24] }} color="region" class="stroke-card" />
</Plot>
```

Les valeurs d'un point forment le domaine de l'échelle des valeurs quand le graphique n'en a pas, sans chercher à atteindre 0, de sorte que les axes d'un nuage de points s'ajustent à ses points. Donnez au graphique des `domain` avec de la marge autour des valeurs quand les points sont gros : une bulle au bord du domaine est dessinée par-dessus le bord du graphique.

Deux marks dans les mêmes bandes forment les graphiques qui comparent deux valeurs d'une ligne : un lollipop est un `Rule` partant de 0 sous un `Dot` à sa valeur, et un dumbbell est un `Rule` d'une valeur à l'autre avec un `Dot` à chaque extrémité, sur une échelle y en bandes :

```tsx
<Plot data={stocks} yScale={{ type: "band", paddingInner: 0.3 }} xScale={{ type: "linear", domain: [-50, 80] }} class="h-48">
  <Rule value="high" base="low" class="stroke-border stroke-2" />
  <Dot value="before" r={3.5} class="fill-card stroke-muted-foreground" hoverDotClass="hidden" />
  <Dot value="now" r={5} class="fill-chart-1 stroke-card stroke-2" hitRadius={24} />
</Plot>
```

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `value` | `string \| (d, index) => number` | `y` du graphique | L'endroit où va chaque point le long de l'axe des valeurs : sur l'axe y, ou le long de x sur une échelle y en bandes. Une ligne sans valeur n'a pas de point. |
| `r` | `number \| string \| (d, index) => number` | `3` | Le rayon des points en points, ou un champ ou une fonction donnant à chaque ligne une valeur que `rScale` transforme en rayon (sans lui, la valeur est le rayon). Une ligne dont la valeur est manquante n'a pas de point. |
| `rScale` | `{ type: "sqrt"; domain?: [number, number]; range: [number, number] }` | aucun | La façon dont les valeurs de `r` deviennent des rayons : leurs racines carrées sur le `domain` (de 0 à la plus grande valeur s'il n'y en a pas) vers le `range` des rayons, de sorte qu'une plage à partir de 0 rend l'aire de chaque point proportionnelle à sa valeur. Les valeurs hors du domaine prennent les extrémités de la plage. |
| `stagger` | `number` | `0` | Avec l'appear du graphique, les points commencent à grandir les uns après les autres, ligne par ligne, sur cette part de l'animation (de 0 à 0,95) ; 0 les fait grandir ensemble. |
| `inactiveOpacity` | `number` | aucun | L'opacité de ses autres points tant qu'un point est sous le pointeur ou sélectionné au clavier : ils s'estompent et reviennent avec le survol. |
| `color` | `string \| (d, index) => string` | aucun | La catégorie de chaque point, sa couleur tirée du `colorScale` du graphique : le `fill` du point quand rien d'autre n'en définit un ([Couleurs par catégorie](#colors-by-category)). |
| `hitRadius` | `number` | `8` | La distance au-delà du bord d'un point à laquelle le pointeur le trouve encore : parmi les points situés à cette distance, le pointeur trouve celui dont le centre est le plus proche (cellules de Voronoi), de sorte qu'une petite bulle sur une grande est trouvée autour de son propre centre. La ligne d'un dot plot est trouvée de n'importe où le long d'elle avec un rayon aussi grand qu'une ligne. |
| `scale` | `"y" \| "y2"` | `"y"` | L'échelle y le long de laquelle vont ses valeurs ([Axes doubles](#dual-axes)) ; les points sur une échelle y en bandes placent leurs valeurs le long de x. |
| `hoverDotClass`, `hoverDotStyle` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` du graphique | La part `hoverDot` : une vue aussi large et haute que le point sous le pointeur, centrée sur lui. `rounded-full outline-2 outline-offset-1` l'entoure d'un anneau ; `hidden` n'en montre aucune pour ce mark. |

Un point se remplit avec son `fill` (`fill-*` ; hérité du graphique comme CSS l'hérite), `currentColor` quand aucun n'est défini (la couleur de sa catégorie avec `color`), et se contourne avec son `stroke` quand il y en a un (`stroke-*`, `strokeWidth`) : un anneau de la couleur de la carte sépare les points qui se chevauchent. Sur un graphique avec des points, le graphique signale la ligne du point dont le centre est le plus proche du pointeur (`null` loin de tous les points), les touches parcourent les lignes dans leur ordre (triez les lignes par x, et les touches parcourent les points de gauche à droite), et la part `hoverDot` marque le point. Avec l'appear du graphique, les points grandissent à partir de rien ; avec `motion.update`, ils se déplacent vers leurs nouvelles valeurs et tailles, le point d'une nouvelle ligne apparaît en grandissant et celui d'une ligne disparue rétrécit jusqu'à disparaître ; le tout sur l'animator de la plateforme, sans qu'aucun mark soit redessiné.

## Cell

<!-- demo: el-plot-cells -->

Un `Cell` dessine un rectangle par ligne dans deux bandes à la fois : la bande de sa catégorie `x` le long d'une échelle x `band` et la bande de sa catégorie `y` le long d'une échelle y `band`, de sorte que les lignes forment une grille, une heatmap. Une matrice de corrélation, un calendrier de rendements mensuels et une semaine de transactions par heure sont des cells. Chaque cell remplit ses deux bandes, donc `paddingInner` et `paddingOuter` des échelles sont les espaces entre les cells et autour d'elles. Sa couleur est sa `value` le long du `colorScale` du graphique, une rampe de couleurs ([Couleurs le long d'une rampe](#colors-along-a-ramp)), ou celle de sa catégorie `color` à travers une rampe ordinale. Les cells reposent sur les échelles x et y du graphique.

```tsx
import { Cell, Plot, PlotAxis } from "nsh/base/plot";
import { token } from "nsh";

const months = [
  { year: "2025", month: "Jan", ret: 2.7 },
  { year: "2025", month: "Feb", ret: -1.4 },
  { year: "2025", month: "Mar", ret: -5.8 },
  { year: "2026", month: "Jan", ret: 1.9 },
  { year: "2026", month: "Feb", ret: 3.2 },
];

<Plot
  data={months}
  xScale={{ type: "band", domain: ["Jan", "Feb", "Mar"], paddingInner: 0.08 }}
  yScale={{ type: "band", paddingInner: 0.08 }}
  colorScale={{ type: "diverging", range: [token("destructive"), token("muted"), token("chart-1")] }}
  class="ml-10 mt-6 h-24"
>
  <Cell
    x="month"
    y="year"
    value="ret"
    cornerRadii={3}
    inactiveOpacity={0.4}
    label={(d) => d.ret.toFixed(1)}
    labelClass="text-xs tabular-nums text-black/70 data-dark:text-white"
    hoverCellClass="rounded-sm outline-2 outline-offset-1 outline-foreground"
  />
  <PlotAxis placement="top" labelClass="pb-1.5 text-xs text-muted-foreground" />
  <PlotAxis placement="left" labelClass="w-10 pr-2 text-right text-xs text-muted-foreground" />
</Plot>
```

Le `domain` d'une échelle en bandes nomme les catégories de ses bandes dans l'ordre, comme le `scaleBand().domain()` de d3 : les mois d'un calendrier de janvier à décembre, chacun avec sa bande que ses lignes soient arrivées ou non, de sorte que mars 2026 ci-dessus est un espace vide dans la grille. Sans domaine, les bandes sont les catégories que les cells nomment le long de l'axe, dans l'ordre où les lignes les apportent (2025 au-dessus de 2026). Un `PlotAxis` le long d'une échelle en bandes de catégories écrit la catégorie de chaque bande, sans `format`.

Une matrice de corrélation nomme les mêmes positions sur les deux axes, son `domain` couvrant toute la plage des coefficients, de sorte qu'un coefficient de 0 prend le milieu de la rampe quelles que soient les positions :

```tsx
const tickers = ["NVDA", "AMD", "MSFT", "GLD"];

<Plot
  data={pairs}
  xScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  yScale={{ type: "band", domain: tickers, paddingInner: 0.06 }}
  colorScale={{ type: "diverging", domain: [-1, 1], range: [token("chart-2"), token("muted"), token("chart-1")] }}
  class="aspect-square"
>
  <Cell x="b" y="a" value="r" label={(d) => d.r.toFixed(2)} labelClass="text-xs text-black/70 data-dark:text-white" />
</Plot>
```

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `x` | `string \| (d, index) => string` | aucun | La colonne de chaque ligne : un champ (son texte ou son nombre) ou une fonction renvoyant la catégorie. La cell de la ligne va dans la bande de cette catégorie sur l'échelle x ; une ligne sans catégorie n'a pas de cell. |
| `y` | `string \| (d, index) => string` | aucun | La rangée de chaque ligne, comme `x` le long de l'échelle y. |
| `value` | `string \| (d, index) => number` | aucun | Le nombre de chaque cell, qu'un `sequential` ou `diverging` `colorScale` transforme en couleur. Une ligne sans nombre prend la couleur `unknown` de l'échelle, et sans celle-ci n'a pas de cell. |
| `color` | `string \| (d, index) => string` | aucun | La catégorie de chaque cell, sa couleur tirée d'un `ordinal` `colorScale` ([Couleurs par catégorie](#colors-by-category)). |
| `cornerRadii` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | `0` | Le rayon de chaque coin de ses cells. |
| `stagger` | `number` | `0` | Avec l'appear du graphique, les cells commencent à grandir les unes après les autres, ligne par ligne, sur cette part de l'animation (de 0 à 0,95), chacune à partir de son milieu pour le reste ; 0 les fait grandir ensemble. |
| `inactiveOpacity` | `number` | aucun | L'opacité de ses autres cells et de leurs labels tant qu'une cell est sous le pointeur ou sélectionnée au clavier : elles s'estompent et reviennent avec le survol. |
| `label` | `string \| (d, index) => string` | aucun | La part `label` : un texte au milieu de chaque cell, un champ (son texte ou son nombre) ou une fonction renvoyant le texte que l'app met en forme. Chaque label s'affiche là où sa taille une fois mise en page tient dans sa cell, de sorte qu'un graphique étroit n'affiche que les couleurs. |
| `labelClass`, `labelStyle` | `string`, `StyleProp<TextStyle>` | aucun | La police, la taille et la couleur des labels. Un label sur une cell dont la couleur `colorScale` est sombre a l'attribut `data-dark` (là où un texte clair se lit mieux), de sorte que `data-dark:text-white` l'écrit en clair à cet endroit. |
| `hoverCellClass`, `hoverCellStyle` | `string`, `StyleProp<ViewStyle>` | aucun | La part `hoverCell` : une vue aussi grande que la cell sous le pointeur ou sélectionnée au clavier, par-dessus elle ; `rounded-sm outline-2 outline-foreground` l'entoure d'un anneau. Elle suit le pointeur dans la même image et glisse sur le ressort `pointer` quand les touches la déplacent. |

Une cell se remplit avec sa couleur du `colorScale` du graphique quand l'app ne définit pas de `fill` (les classes et styles `fill-*` passent en premier, hérités du graphique comme CSS les hérite), `currentColor` quand rien n'en définit un, et se contourne avec son `stroke` quand il y en a un. Sur un graphique avec des cells, le graphique signale la ligne de la cell sous le pointeur, et dans l'espace entre deux cells la plus proche ; les touches fléchées parcourent la grille telle qu'elle apparaît à l'écran ([Clavier](#keyboard)), et les lecteurs d'écran parcourent les lignes dans leur ordre. Avec l'appear du graphique, les cells grandissent à partir de leur milieu ; avec `motion.update`, la couleur d'une cell glisse vers la nouvelle, la cell d'une nouvelle ligne apparaît en grandissant, celle d'une ligne disparue rétrécit jusqu'à disparaître, et les cells se déplacent vers leurs nouvelles bandes ; le tout sur l'animator de la plateforme, sans qu'aucun mark soit redessiné.
<a id="pie-and-arc"></a>

## Pie et Arc

Un `Pie` découpe un tour en une tranche par ligne, chacune proportionnelle à la valeur de sa ligne, dans le sens horaire à partir de 12 heures, dans l'ordre des lignes, autour du centre du graphique. Un `innerRadius` en fait un donut. Chaque tranche est un canvas à part entière, la partie `slice`, et se peint donc avec ses propres classes : `sliceClass` désigne les mêmes classes sur chaque tranche, ou une fonction de la ligne de la tranche qui donne à chacune les siennes. Sur un pie, le graphique signale la ligne de la tranche située sous le pointeur (aucune dans le trou ou en dehors de l'anneau), son infobulle suit le pointeur, et cette tranche grandit de `hoverLift` tandis que les autres s'estompent de `hoverDim`, sur l'animator de la plateforme avec le `motion` du graphique. Un `Arc` dessine un secteur entre deux angles : la piste et la valeur d'une jauge, ou un anneau derrière un pie.

<!-- demo: el-plot-pie -->

```tsx
import { signal, Text, View } from "nsh";
import { Pie, Plot } from "nsh/base/plot";

type Plan = { name: string; seats: number };

const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];
const KEYS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];

export function Seats(props: { plans: Plan[] }) {
  const hovered = signal<number | null>(null);
  const total = () => props.plans.reduce((sum, p) => sum + p.seats, 0);
  const shown = () => (hovered() == null ? undefined : props.plans[hovered()!]);
  const share = (n: number) => `${((n / total()) * 100).toFixed(1)}%`;
  return (
    <View class="flex-row items-center gap-6 rounded-xl border border-border bg-card p-4">
      <Plot
        data={props.plans}
        accessibilityLabel={`Seats by plan, ${total()} in all`}
        accessibilityValue={{ text: shown() && `${shown()!.name}, ${shown()!.seats} seats, ${share(shown()!.seats)}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 900, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 400, damping: 32 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-44"
      >
        {/* A donut with 2-point gaps (0.025 of a turn at its 80-point rim). */}
        <Pie
          value="seats"
          innerRadius="62%"
          padAngle={0.025}
          sliceClass={(_, i) => FILLS[i % FILLS.length]}
          hoverLift={6}
          hoverDim={0.64}
        />
        {/* The hovered plan, or the total, in the hole. */}
        <View class="absolute inset-0 items-center justify-center gap-1">
          <Text class="text-xs text-muted-foreground">{shown()?.name ?? "Total"}</Text>
          <Text class="text-2xl font-semibold tabular-nums text-foreground">{shown()?.seats ?? total()}</Text>
        </View>
      </Plot>
      {/* The legend: a key in each slice's color, the value and the share at the end. */}
      <View class="flex-1 gap-1">
        {props.plans.map((plan, i) => (
          <View class="flex-row items-center gap-3 rounded-md px-2 py-1.5" style={{ opacity: hovered() == null || hovered() === i ? 1 : 0.45 }}>
            <View class={`size-2 rounded-sm ${KEYS[i % KEYS.length]}`} />
            <Text class="flex-1 text-sm text-foreground">{plan.name}</Text>
            <Text class="text-right text-sm tabular-nums text-foreground">{plan.seats}</Text>
            <Text class="w-14 text-right text-sm tabular-nums text-muted-foreground">{share(plan.seats)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

```rust
use nsh_base::plot::{SliceClass, pie, plot};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn seats(seats: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(seats.len(), [("seats".into(), seats)]);
    plot()
        .data(rows)
        .accessibility_label("Seats by plan")
        .w(px(176.0))
        .h(px(176.0))
        .child(
            pie()
                .value(RowAccessor::key("seats"))
                .inner_radius(relative(0.62))
                .slice_class(SliceClass::from_fn(|i| format!("fill-chart-{}", i % 4 + 1).into())),
        )
}
```

| Mark | Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|---|
| `Pie` | `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | le `y` du graphique | Ce que vaut chaque ligne. Une ligne qui ne vaut rien, moins que rien ou qui n'a pas de nombre n'a pas de tranche. |
| `Pie`, `Arc` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radians) | `0`, `2 * Math.PI` | Où commence la première tranche et où finit la dernière (les extrémités d'un arc) : en radians depuis 12 heures, dans le sens horaire. Un `endAngle` inférieur à `startAngle` dispose les tranches d'un pie dans l'autre sens. |
| `Pie` | `padAngle` | `.pad_angle(..)` | `number` (radians) | `0` | L'angle entre deux tranches voisines au bord extérieur. Chaque espace garde cette largeur (environ `padAngle * outerRadius` points) à tous les rayons, ses côtés restant parallèles : il est donc aussi large au centre ou au trou qu'au bord ; une tranche trop étroite pour atteindre le centre se termine là où ses côtés se rejoignent. Un pie d'une seule tranche n'en a pas. |
| `Pie`, `Arc` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | Les rayons du trou et du bord extérieur : en points, ou en pourcentage du plus grand cercle que contient le graphique (la moitié de son plus petit côté). |
| `Pie`, `Arc` | `cornerRadius` | `.corner_radius(..)` | `number` | `0` | Le rayon des coins de chaque tranche (d'un arc), en points, comme le `arc.cornerRadius` de d3 : chaque coin est un cercle tangent au côté et au bord extérieur ou au trou, y compris aux côtés parallèles des espaces. Il vaut au plus la moitié de l'épaisseur de l'anneau, ce qui donne à un arc des extrémités arrondies ; sur une tranche trop étroite pour deux coins entiers, les coins se rejoignent en son milieu. Un anneau complet ne garde que ses bords arrondis. |
| `Pie` | `sliceClass` | `.slice_class(..)` | `string \| (d: T, index: number) => string` | aucun | Les classes de chaque tranche (`fill-*`, `stroke-*`) : les mêmes sur chaque tranche, ou une fonction de la ligne de la tranche et de son index, appelée une fois par ligne quand les lignes ou la fonction changent. |
| `Pie` | `sliceStyle` | `.slice_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de chaque tranche, par-dessus ses classes (`fill`, `stroke`, `strokeWidth`). |
| `Pie` | `hoverLift` | `.hover_lift(..)` | `number` | `0` | De combien la tranche sous le pointeur dépasse les autres, en points : sur le ressort `pointer` du graphique, avec un fondu à l'entrée et à la sortie du survol. |
| `Pie` | `hoverDim` | `.hover_dim(..)` | `number` (0 à 1) | `0` | De combien les autres tranches s'estompent pendant qu'une est sous le pointeur, en part de leur opacité, avec le fondu du survol. |
| `Pie` | `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | aucun | La catégorie de chaque tranche, dont la couleur vient du `colorScale` du graphique : le `fill` de la tranche quand rien n'en définit une ([Couleurs par catégorie](#colors-by-category)). |
| `Pie` | `label` | `.label(..)` | `string \| (d: T, index: number) => string` | aucun | Le texte à côté de chaque tranche : un champ (son nombre) ou une fonction renvoyant le texte que l'app formate. Une ligne dont le texte est vide, ou une tranche de moins d'un demi-degré, n'en a pas. |
| `Pie` | `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | La partie `label` : un texte à l'extérieur de l'anneau, au bout de sa ligne de repère, centré sur celle-ci, placé après elle sur la moitié droite du pie et avant elle sur la gauche. Son padding est sa distance à l'extrémité de la ligne. |
| `Pie` | `labelGap` | `.label_gap(..)` | `number` | `15` | À quelle distance au-delà du bord extérieur se placent les labels, en points. |
| `Pie` | `labelLineClass`, `labelLineStyle` | `.label_line_class(..)`, `.label_line_style(..)` | `string \| (d: T, index: number) => string`, `StyleProp<ViewStyle>` | aucun | La partie `labelLine` : la ligne de repère de chaque label, du bord extérieur au milieu de la tranche jusqu'au rayon du label, puis en travers jusqu'au texte. Son `stroke` (`currentColor` quand aucun n'est défini), son `strokeWidth` et son `strokeDasharray`, identiques sur chaque ligne ou fonction de la ligne de la tranche ; affichée dès qu'elle est stylée. |

Une tranche et un arc se remplissent avec `fill` (`currentColor` quand aucun n'est défini, la couleur de la catégorie de la tranche avec `color`) et tracent leurs bords avec `stroke` (aucun quand aucun n'est défini), les leurs primant sur ceux du pie et du graphique, tels que CSS les hérite : un trait de la couleur de la surface (`stroke-card stroke-2`) découpe aussi des espaces entre les tranches. Leurs valeurs ne participent pas aux échelles du graphique. Les tranches d'un pie ne sont redessinées que lorsque les lignes, leurs valeurs, les angles, les rayons ou la taille du graphique changent ; le pointeur déplace le soulèvement et le fondu sur l'animator.

Les graphiques avec un pie placent généralement l'infobulle près du pointeur (`tooltipPlacement="pointer"`), puisque les lignes d'un pie n'ont pas de place le long d'un axe : la ligne croisée et l'infobulle suivent le pointeur au-dessus de lui, et il n'affiche aucun point de survol. Le centre d'un donut est un élément propre à l'app posé sur le graphique (la valeur de la tranche survolée, ou le total), et sa légende aussi, chaque clé ayant la couleur de sa tranche.

Les labels d'un pie nomment ses tranches à l'extérieur de l'anneau : chaque texte se place à `labelGap` au-delà du bord extérieur vers le milieu de sa tranche (le centroïde de la tranche à ce rayon), puis en travers jusqu'à ce rayon du côté de la tranche dans le pie, et une ligne de repère stylée le relie au bord extérieur. Les labels se déploient avec leurs tranches à l'apparition du graphique et apparaissent en fondu à la fin de celle-ci, se déplacent avec elles sur `motion.update`, et se soulèvent avec la tranche survolée ; tout cela s'exécute sur l'animator de la plateforme. Laissez au graphique la place nécessaire : un `outerRadius` inférieur à `"100%"`, ou de l'espace autour du graphique. Un contenu propre à l'app placé sur une tranche est un élément posé sur le graphique, comme le centre d'un donut.

```tsx
<Pie
  value="seats"
  outerRadius="64%"
  sliceClass={(_, i) => FILLS[i % FILLS.length]}
  label={(d) => share(d.seats)}
  labelGap={12}
  labelClass="px-1 text-xs tabular-nums text-muted-foreground"
  labelLineClass="stroke-border"
/>
```

<a id="colors-by-category"></a>

## Couleurs par catégorie

Le `colorScale` d'un graphique donne leurs couleurs aux catégories, comme le `scaleOrdinal` de d3, et le `color` d'une mark nomme la catégorie de chaque ligne : un champ (son texte, ou son nombre) ou une fonction de la ligne. Les catégories du `domain` prennent dans l'ordre les couleurs du `range`, et la plage repart de sa première couleur quand le domaine est plus long. Une catégorie hors du domaine prend `unknown` ; sans lui, elle rejoint le domaine la première fois qu'une mark la rencontre (les marks dans l'ordre, chacune avec ses lignes dans l'ordre) et prend la couleur suivante, de sorte que sans aucun `domain` les catégories prennent les couleurs dans l'ordre où les lignes les amènent. Les couleurs sont celles de l'app : des couleurs CSS, dont les tokens du thème.

```tsx
import { Pie, Plot } from "nsh/base/plot";
import { token } from "nsh";

const regions = [
  { name: "North America", revenue: 482 },
  { name: "EMEA", revenue: 312 },
  { name: "APAC", revenue: 268 },
];

<Plot data={regions} colorScale={{ type: "ordinal", range: [token("chart-1"), token("chart-2"), token("chart-3")] }} class="size-44">
  <Pie value="revenue" color="name" innerRadius="62%" />
</Plot>
```

Une tranche, une barre et un point prennent la couleur de leur ligne ; un `Line` et un `Area` forment chacun une seule série et prennent celle de leur première ligne, de sorte qu'une ligne composée de lignes qui lui sont propres (`data`) est de la couleur de ses lignes, et qu'une seule échelle garde la couleur d'une catégorie identique entre un pie, des barres et des lignes. La couleur est le `fill` de la mark (le `stroke` d'une ligne) quand rien n'en définit une, à la place de `currentColor` : les classes et les styles de l'app passent en premier, puis ceux de la partie (`sliceClass`, `sliceStyle`), ceux de la mark et ceux qu'elle hérite du graphique, de sorte que `sliceClass={(d) => (d.name === "Other" ? "fill-muted" : "")}` distingue une tranche tandis que l'échelle colore les autres. À côté d'une partie `background`, le `fill` d'une barre et d'une aire reste `none`.

| `OrdinalScale` | Type | Défaut | Description |
|---|---|---|---|
| `type` | `"ordinal"` | (requis) | Le type d'échelle. |
| `domain` | `string[]` | aucun | Les catégories, dans l'ordre. Une catégorie écrite deux fois garde sa première place. |
| `range` | `string[]` | (requis) | Les couleurs, dans l'ordre (couleurs CSS) ; la catégorie `i` prend la couleur `i % range.length`. |
| `unknown` | `string` | aucun | La couleur de chaque catégorie hors du domaine ; sans elle, chacune prend la couleur suivante. |

<a id="colors-along-a-ramp"></a>

### Couleurs le long d'une rampe

Un `colorScale` de `type: "sequential"` ou `"diverging"` donne leurs couleurs aux nombres le long d'une rampe, comme le font `scaleSequential` et `scaleDiverging` de d3, pour le `value` d'un [`Cell`](#cell). Son `range` comporte au moins deux couleurs réparties uniformément le long de la rampe, de son extrémité basse à son extrémité haute, et mélangées en OKLab entre elles : les paliers paraissent réguliers à l'œil, et deux teintes se rejoignent par leur propre mélange. Une valeur au-delà du `domain` prend la couleur de l'extrémité de la rampe, et une ligne sans valeur prend `unknown`.

`sequential` étale son `domain` sur toute la rampe, le domaine étant l'étendue des valeurs des cellules à moins que l'app n'en nomme un : comptages, volumes, activité. `diverging` place son `pivot` (0 par défaut) à la couleur médiane de la rampe, les valeurs inférieures le long de la première moitié et les supérieures le long de la seconde : les pertes dans une teinte, les gains dans une autre, un mois stable dans le neutre du milieu. À moins que l'app ne nomme un domaine, celui-ci est l'étendue des valeurs rendue symétrique de part et d'autre du pivot (`symmetric` d'Observable Plot), de sorte qu'une perte et un gain de même ampleur ont la même intensité ; une matrice de corrélation nomme `domain: [-1, 1]`.

```tsx
colorScale={{ type: "sequential", range: [token("muted"), token("chart-1")] }}
colorScale={{ type: "diverging", pivot: 0, range: [token("destructive"), token("muted"), token("chart-1")] }}
```

| `SequentialScale`, `DivergingScale` | Type | Défaut | Description |
|---|---|---|---|
| `type` | `"sequential" \| "diverging"` | (requis) | Le type de rampe. |
| `domain` | `[number, number]` | l'étendue des valeurs (rendue symétrique autour du pivot pour `diverging`) | Les valeurs des deux extrémités de la rampe. |
| `pivot` | `number` | `0` | `diverging` uniquement : la valeur de la couleur médiane de la rampe. |
| `range` | `string[]` | (requis) | Les couleurs le long de la rampe, de l'extrémité basse à l'extrémité haute (couleurs CSS), mélangées en OKLab entre elles. |
| `unknown` | `string` | aucun | La couleur d'une ligne sans valeur ; sans elle, cette ligne n'a pas de cellule. |
<a id="radialline-and-radialgrid"></a>

## RadialLine et RadialGrid

Un `RadialLine` dessine une série autour du centre du graphique : le polygone d'un radar, ou une ligne autour d'un cadran. Chaque ligne qui a une valeur est un point à l'angle de la ligne, aussi loin du centre que l'échelle y du graphique place sa valeur, de `innerRadius` (la plus petite valeur du domaine) à `outerRadius` (la plus grande). Sans `angle`, les lignes se répartissent uniformément sur le tour, à partir de 12 heures, dans le sens horaire et dans l'ordre : six lignes forment donc un hexagone. `closed` relie le dernier point au premier. Une ligne trace le contour de ses points et remplit son aire jusqu'à `innerRadius` (le centre par défaut) : une seule marque donne donc le contour du radar et son lavis. Un `RadialGrid` dessine derrière elle la grille du radar : `rings` à des valeurs de l'échelle y, des polygones passant par les angles des lignes ou `circular`, et `spokes` jusqu'à chaque ligne. Au-dessus d'une radial line, le graphique signale la ligne dont l'angle est le plus proche de celui du pointeur, dans le rayon extérieur de la ligne, et le point de survol de chaque ligne se place sur son point de cette ligne.

```tsx
import { signal, Text, View } from "nsh";
import { Plot, RadialGrid, RadialLine } from "nsh/base/plot";

type Metric = { name: string; ours: number; theirs: number };

export function Compare(props: { metrics: Metric[] }) {
  const hovered = signal<number | null>(null);
  const shown = () => (hovered() == null ? undefined : props.metrics[hovered()!]);
  return (
    <View class="items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Text class="text-sm tabular-nums text-muted-foreground">
        {shown() ? `${shown()!.name}: ${shown()!.ours} against ${shown()!.theirs}` : "Ours against theirs"}
      </Text>
      <Plot
        data={props.metrics}
        yScale={{ type: "linear", domain: [0, 100] }}
        accessibilityLabel="Ours against theirs on six metrics"
        accessibilityValue={{ text: shown() && `${shown()!.name}: ours ${shown()!.ours}, theirs ${shown()!.theirs}` }}
        appearGeneration={1}
        motion={{ appear: { duration: 700, easing: "easeOut" }, update: { duration: 400, easing: "easeInOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 380, damping: 34 } }}
        onHoverChange={({ index }) => hovered.set(index)}
        class="size-56"
      >
        <RadialGrid rings={[25, 50, 75, 100]} spokes outerRadius="80%" class="stroke-border" />
        <RadialLine radius="theirs" closed outerRadius="80%" class="fill-chart-2/15 stroke-chart-2" hoverDotClass="size-2 rounded-full border-2 border-card bg-chart-2" />
        <RadialLine radius="ours" closed outerRadius="80%" class="fill-chart-1/25 stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* Each metric's name past the rim at its row's angle, growing away from the center. */}
        {props.metrics.map((m, i) => {
          const angle = (2 * Math.PI * i) / props.metrics.length;
          const away = (v: number) => (v > 0.01 ? "flex-start" : v < -0.01 ? "flex-end" : "center");
          const align = (v: number) => (v > 0.01 ? "left" : v < -0.01 ? "right" : "center");
          return (
            <View
              class="absolute size-0"
              style={{
                left: `${50 + 44 * Math.sin(angle)}%`,
                top: `${50 - 44 * Math.cos(angle)}%`,
                alignItems: away(Math.sin(angle)),
                justifyContent: away(-Math.cos(angle)),
                pointerEvents: "none",
              }}
            >
              <Text class="w-24 text-xs text-muted-foreground" style={{ textAlign: align(Math.sin(angle)) }}>{m.name}</Text>
            </View>
          );
        })}
      </Plot>
    </View>
  );
}
```

| Marque | Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|---|
| `RadialLine` | `radius` | `.radius(..)` | `keyof T \| (d: T, index: number) => number` | `y` du graphique | Ce qui place chaque ligne à distance du centre : une valeur de l'échelle y, de `innerRadius` pour la plus petite valeur du domaine à `outerRadius` pour la plus grande. Une ligne sans valeur est ignorée. |
| `RadialLine` | `angle` | `.angle(..)` | `keyof T \| (d: T, index: number) => number` | les lignes réparties uniformément sur le tour | L'endroit où chaque ligne se place autour du centre : des radians à partir de 12 heures, dans le sens horaire. |
| `RadialLine`, `RadialGrid` | `startAngle`, `endAngle` | `.start_angle(..)`, `.end_angle(..)` | `number` (radians) | `0`, `2 * Math.PI` | L'endroit où se placent les lignes sans `angle` : à partir de `startAngle`, uniformément. Sur un tour complet, elles sont espacées d'un pas égal à `1 / rows` de tour, la dernière un pas avant la première ; sur une partie de tour, la première est sur `startAngle` et la dernière sur `endAngle`. |
| `RadialLine`, `RadialGrid` | `innerRadius`, `outerRadius` | `.inner_radius(..)`, `.outer_radius(..)` | ``number \| `${number}%` `` | `0`, `"100%"` | L'endroit où vont la plus petite et la plus grande valeur du domaine y : des points, ou un pourcentage du plus grand cercle que contient le graphique (la moitié de son plus petit côté), comme les rayons d'un camembert. L'aire d'une ligne se remplit jusqu'à `innerRadius` ; les rayons d'une grille s'étendent entre les deux. |
| `RadialLine` | `curve` | `.curve(..)` | `"linear" \| "natural" \| "stepAfter"` | `"linear"` | La façon dont elle relie ses points : des segments droits, une courbe lisse (fermée, une boucle lisse) ou des marches. |
| `RadialLine` | `closed` | `.closed(..)` | `boolean` | `false` | Elle se poursuit de son dernier point jusqu'au premier : le polygone d'un radar. Ouverte, son aire se referme sur le centre (ou le long de son bord intérieur). |
| `RadialLine` | `dot`, `dotClass`, `dotStyle` | `.dot(..)`, `.dot_class(..)`, `.dot_style(..)` | `boolean`, `string`, `StyleProp<ViewStyle>` | `false` | Un point sur chaque point de la ligne : une vue centrée sur lui, dont la taille, l'arrière-plan et la bordure sont ceux de l'application. Les points s'écartent et se déplacent avec la ligne. |
| `RadialLine` | `backgroundClass`, `backgroundStyle` | `.background_class(..)`, `.background_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Son arrière-plan : une boîte autour de son cercle extérieur dont l'arrière-plan (`bg-*`, un dégradé) n'apparaît qu'à l'intérieur de son aire, sous son `fill`, comme pour une aire. |
| `RadialLine` | `hoverDotClass`, `hoverDotStyle` | `.hover_dot_class(..)`, `.hover_dot_style(..)` | `string`, `StyleProp<ViewStyle>` | `dotClass`, `dotStyle` du graphique | Son point de survol, sur son point de la ligne sous le pointeur, le pointeur étant dans le même repère et glissant vers la ligne suivante selon le ressort `pointer` du graphique quand les touches font avancer la sélection ; `hidden` n'en affiche aucun. |
| `RadialGrid` | `rings` | `.rings(..)` | `number[]` | aucun | L'endroit où se placent ses anneaux, en valeurs de l'échelle y : chacun aussi loin qu'une radial line place cette valeur. |
| `RadialGrid` | `spokes` | `.spokes(..)` | `boolean` | `false` | Une ligne de `innerRadius` à `outerRadius` à l'angle de chaque ligne. |
| `RadialGrid` | `circular` | `.circular(..)` | `boolean` | `false` | Ses anneaux sont des cercles (des arcs sur une partie de tour). Par défaut, ce sont des polygones passant par les angles des lignes, et des cercles tant que le graphique compte moins de trois lignes. |

Une radial line trace son contour avec `stroke`, `strokeWidth` et `strokeDasharray` (`currentColor`, d'épaisseur 1 et pleine si rien n'est défini) et remplit son aire avec `fill` (aucun si rien n'est défini) ; une radial grid trace son contour comme le fait une grille. Leur peinture est héritée du graphique. Les valeurs d'une ligne, avec 0, forment le domaine de l'échelle y quand le graphique n'en a pas : un radar de valeurs positives part donc de son centre ; ce n'est pas le cas des anneaux d'une grille. Donnez au graphique un `domain` y pour garder fixes les anneaux et l'échelle du radar pendant que les valeurs changent.

Les étiquettes autour d'un radar sont des éléments de l'application superposés au graphique, comme le centre d'un donut. Sans `angle`, la ligne `i` sur `n` se place à `a = 2π·i / n` à partir de 12 heures : dans un graphique carré, une boîte sans taille à `left: 50% + r·sin(a)`, `top: 50% − r·cos(a)` (`r` étant un pourcentage du côté du graphique un peu supérieur à la moitié de la part du rayon extérieur) marque l'endroit au-delà du bord, et le nom s'étend à partir de là en s'éloignant du centre : à droite de la boîte sur la moitié droite, à gauche sur la moitié gauche, au-dessus en haut et en dessous en bas, comme ci-dessus.

```rust
use nsh_base::plot::{plot, radial_grid, radial_line};
use nsh_core::{element::{RowAccessor, Rows}, prelude::*};

fn compare(ours: Vec<f64>, theirs: Vec<f64>) -> impl IntoElement {
    let rows = Rows::from_columns(ours.len(), [("ours".into(), ours), ("theirs".into(), theirs)]);
    plot()
        .data(rows)
        .accessibility_label("Ours against theirs")
        .w(px(224.0))
        .h(px(224.0))
        .child(radial_grid().rings(vec![25.0, 50.0, 75.0, 100.0]).spokes(true))
        .child(radial_line().radius(RowAccessor::key("theirs")).closed(true))
        .child(radial_line().radius(RowAccessor::key("ours")).closed(true))
}
```

## Sankey

Un `Sankey` dessine des flux entre les lignes du graphique : chaque ligne est un nœud et `links` nomme les flux entre eux, `{
source, target, value }` with the indices of two rows in the plot's `data`. Il les dispose comme le fait d3-sankey, dans la taille du graphique : les nœuds en colonnes (`nodeAlign`), chacun aussi haut que le plus grand flux qui y entre ou en sort, les nœuds d'une colonne espacés de `nodePadding`, relâchés vers leurs flux en `iterations` passes ; et un ruban par lien, du bord droit de sa source au bord gauche de sa cible, aussi large à chaque extrémité que sa part du côté de ce nœud, de sorte que les deux côtés de chaque nœud sont couverts même quand ses flux entrants et sortants diffèrent. Chaque colonne est centrée dans le graphique, et une série de colonnes d'un seul nœud égales est légèrement décalée pour que les rubans entre elles se courbent. `valueScale="sqrt"` dimensionne selon la racine carrée des valeurs, afin qu'un flux dominant n'écrase pas les petits.

Chaque nœud et chaque ruban est un canevas à part entière, les parties `node` et `link`, et chacun se peint donc avec ses propres classes : `nodeClass` désigne les mêmes classes sur chaque nœud ou une fonction de la ligne du nœud, et `linkClass` les mêmes sur chaque ruban ou une fonction du lien. La partie `linkBackground` affiche un arrière-plan à l'intérieur de chaque ruban, une boîte de sa source à sa cible : une fonction du lien donne à chaque ruban un dégradé de la couleur de sa source à celle de sa cible. Les rubans se dessinent sous les nœuds, et les deux apparaissent depuis le bord d'attaque avec l'apparition (appear) du graphique.

Au-dessus d'un sankey, le graphique signale le nœud sous le pointeur (`onHoverChange`, la ligne du nœud ; aucun au-dessus d'un ruban), son infobulle suit le pointeur, et les liens non rattachés à ce nœud s'estompent de `hoverDim`, sur l'animateur de la plateforme avec le `motion` du graphique. Les touches parcourent les nœuds dans l'ordre des lignes, l'infobulle se plaçant à côté du milieu de chaque nœud. `nodeLabel` nomme chaque nœud et `valueLabel` donne sa valeur, la valeur au-dessus du nom quand les deux sont définis : à gauche d'un nœud de la première colonne, à droite d'un nœud de la dernière, centrée au-dessus d'un nœud intermédiaire, comme le placent les graphiques de `gpui-component` ; une étiquette à côté d'un nœud reste entre le haut et le bas du graphique, et une étiquette au-delà du bord du graphique se place dans l'espace que l'application laisse autour (sa marge). Le remplissage de la partie `nodeLabel` est l'écart avec son nœud et ses classes définissent son texte (`max-w-20 truncate` coupe un nom trop long) ; les étiquettes apparaissent en fondu avec l'apparition (appear). Quand l'application modifie les flux, chaque nœud et chaque ruban passe de son ancienne place à la nouvelle avec le `motion.update` du graphique, son étiquette avec lui : un nœud nouveau dans les flux grandit depuis son milieu, un lien nouveau depuis sa largeur minimale, et ceux qui disparaissent partent aussitôt ; un changement pendant le mouvement reprend là où ils sont dessinés. Les liens se distinguent par leur source et leur cible : réordonner `links` ne déplace donc rien.

```tsx
import { signal } from "nsh";
import { Plot, Sankey } from "nsh/base/plot";

type Step = { name: string };

const steps: Step[] = [{ name: "Visits" }, { name: "Sign-ups" }, { name: "Bounced" }, { name: "Trials" }, { name: "Paid" }, { name: "Churned" }];
const flows = [
  { source: 0, target: 1, value: 4200 },
  { source: 0, target: 2, value: 5800 },
  { source: 1, target: 3, value: 2600 },
  { source: 3, target: 4, value: 1100 },
  { source: 3, target: 5, value: 1500 },
];
// Each step's color: its node's fill, and its ribbons' gradient ends.
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-muted", "fill-chart-3", "fill-chart-4", "fill-muted"];
const FROM = ["from-chart-1/40", "from-chart-2/40", "from-muted/40", "from-chart-3/40", "from-chart-4/40", "from-muted/40"];
const TO = ["to-chart-1/40", "to-chart-2/40", "to-muted/40", "to-chart-3/40", "to-chart-4/40", "to-muted/40"];

export function Funnel() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={steps}
      accessibilityLabel="Visits to paid: 10,000 visits, 1,100 paid"
      accessibilityValue={{ text: hovered() == null ? undefined : steps[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 900, easing: "easeOut" }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="mx-20 h-64"
    >
      <Sankey
        links={flows}
        nodeWidth={8}
        nodePadding={16}
        nodeCornerRadius={2}
        nodeClass={(_, i) => FILLS[i]}
        linkBackgroundClass={(link) => `bg-linear-to-r ${FROM[link.source]} ${TO[link.target]}`}
        hoverDim={0.7}
        nodeLabel={(d: Step) => d.name}
        valueLabel={(_: Step, value: number) => value.toLocaleString("en-US")}
        nodeLabelClass="px-2 py-1 text-xs text-muted-foreground"
        valueLabelClass="font-medium text-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{RowClass, SankeyLinkClass, SankeyLinks, plot, sankey};
use nsh_core::{element::Rows, prelude::*};

fn funnel() -> impl IntoElement {
    plot()
        .data(Rows::from_columns(4, []))
        .accessibility_label("Visits to paid")
        .h(px(256.0))
        .child(
            sankey()
                .links(SankeyLinks::new([(0, 1, 4200.0), (1, 2, 2600.0), (2, 3, 1100.0)]))
                .node_width(px(8.0))
                .node_class(RowClass::from_fn(|i| format!("fill-chart-{}", i + 1).into()))
                .link_class(SankeyLinkClass::from("fill-foreground/10")),
        )
}
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `links` | `.links(..)` | `SankeyLink[]` (`{ source: number; target: number; value: number }`) | requis | Les flux : de la ligne `source` à la ligne `target` (leurs indices dans les `data` du graphique), `value` étant leur taille. Une valeur qui n'est pas un nombre ou qui est inférieure à zéro ne transporte rien et ne dessine aucun ruban. |
| `nodeWidth` | `.node_width(..)` | `number` | `24` | La largeur de chaque nœud, en points. |
| `nodePadding` | `.node_padding(..)` | `number` | `8` | L'écart entre les nœuds d'une colonne, en points ; moindre dans une colonne trop chargée pour le permettre. |
| `nodeAlign` | `.node_align(..)` | `"justify" \| "left" \| "right" \| "center"` | `"justify"` | La colonne où va chaque nœud, comme dans d3-sankey : sa profondeur depuis la première colonne (`"left"`), aussi loin à droite que ses flux le permettent (`"right"`), sa profondeur avec un nœud qui ne fait que démarrer des flux placé près de ses cibles (`"center"`), ou sa profondeur avec les nœuds qui terminent des flux placés dans la dernière colonne (`"justify"`). |
| `iterations` | `.iterations(..)` | `number` | `6` | Le nombre de passes qui relâchent les nœuds vers leurs flux. |
| `valueScale` | `.value_scale(..)` | `"linear" \| "sqrt"` | `"linear"` | Hauteurs et largeurs proportionnelles aux valeurs, ou à leurs racines carrées. |
| `minLinkWidth` | `.min_link_width(..)` | `number` | `1` | La largeur minimale d'un ruban, en points, pour qu'un petit flux reste visible. |
| `nodeCornerRadius` | `.node_corner_radius(..)` | `number` | `0` | Le rayon des coins de chaque nœud, en points. |
| `nodeClass` | `.node_class(..)` | `string \| (d: T, index: number) => string` | aucun | Les classes de chaque nœud (`fill-*`, `stroke-*`) : les mêmes sur chaque nœud, ou une fonction de la ligne du nœud et de son indice, appelée une fois par ligne quand les lignes ou la fonction changent. |
| `nodeStyle` | `.node_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de chaque nœud, par-dessus ses classes. |
| `linkClass` | `.link_class(..)` | `string \| (link: SankeyLink, index: number) => string` | aucun | Les classes de chaque ruban : les mêmes sur chaque ruban, ou une fonction du lien et de son indice dans `links`. |
| `linkStyle` | `.link_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de chaque ruban, par-dessus ses classes. |
| `linkBackgroundClass` | `.link_background_class(..)` | `string \| (link: SankeyLink, index: number) => string` | aucun | Les classes de l'arrière-plan de chaque ruban (`bg-*`, un dégradé : `bg-linear-to-r from-… to-…`), affiché à l'intérieur du ruban sur une boîte de sa source à sa cible, sous son `fill`. Avec un arrière-plan, le `fill` d'un ruban vaut `none` si rien n'est défini. |
| `linkBackgroundStyle` | `.link_background_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de l'arrière-plan de chaque ruban, par-dessus ses classes. |
| `hoverDim` | `.hover_dim(..)` | `number` (0 à 1) | `0` | De combien les liens non rattachés au nœud sous le pointeur s'estompent, en part de leur opacité, sur le ressort `pointer` du graphique et avec le fondu du survol. |
| `nodeLabel` | `.node_label(..)` | `keyof T \| (d: T, index: number) => string` | aucun | Le nom à côté de chaque nœud : un champ, ou une fonction de la ligne du nœud et de son indice. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | aucun | La valeur à côté de chaque nœud, au-dessus de son nom : une fonction de sa ligne et du plus grand flux qui y entre ou en sort (dans les valeurs des liens, quel que soit `valueScale`). |
| `nodeLabelClass` | `.node_label_class(..)` | `string` | aucun | Les classes de chaque étiquette, la partie `nodeLabel` : son remplissage est l'écart avec son nœud, ses styles de texte s'appliquent aux deux lignes. |
| `nodeLabelStyle` | `.node_label_style(..)` | `StyleProp<TextStyle>` | aucun | Le style de chaque étiquette, par-dessus ses classes. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | aucun | Les classes de la ligne de valeur, la partie `valueLabel`, par-dessus celles de l'étiquette. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | aucun | Le style de la ligne de valeur, par-dessus ses classes. |

Un nœud et un ruban se remplissent avec `fill` (`currentColor` si rien n'est défini) et sont tracés avec `stroke` (aucun si rien n'est défini), leurs propres valeurs primant sur celles du sankey et du graphique, comme CSS les hérite. Un nœud que rien ne traverse mesure un point de haut. La disposition n'est recalculée que lorsque les liens, les options ou la taille du graphique changent, jamais pour le pointeur ou l'apparition (appear) ; un changement de taille du graphique ne déplace rien. Les liens qui forment un cycle, ou qui nomment une ligne que le graphique n'a pas, ne dessinent rien et consignent un avertissement. Ses valeurs n'entrent pas dans les échelles du graphique.
## Treemap

Un `Treemap` dessine les lignes du plot comme une hiérarchie de rectangles imbriqués : chaque ligne est un nœud, son `id` et le `parent` qu'il nomme forment l'arbre (`stratify` de d3), l'aire de chaque feuille est proportionnelle à son `value`, et chaque groupe est la boîte de ce qu'il contient, sa valeur étant la somme de celles de ses feuilles (quoi que contienne sa propre ligne). Une ligne sans `parent`, ou dont le parent ne désigne aucune ligne, est un nœud de premier niveau ; sans `id`, l'id d'une ligne est son index, de sorte que `parent` peut aussi désigner une ligne par son index. Un arbre sous la forme imbriquée qu'écrit gpt-vis (`{ name, value, children }`) se transforme en lignes en quelques lignes de code de l'app ; le nombre de niveaux n'est pas limité.

Les tuiles sont « squarifiées », comme les produit `treemapSquarify` de d3 : les nœuds de chaque niveau sont classés par valeur, le plus grand en premier à partir du haut à gauche (`sort="value"`), au plus près du rapport d'aspect `ratio` (le nombre d'or) ; `sort="data"` conserve l'ordre des lignes, de sorte que les nœuds gardent leur place quand leurs valeurs changent. `paddingInner` est l'écart entre frères, absent le long du bord extérieur de leur parent ; `paddingOuter` est l'espace à l'intérieur d'un groupe autour de ses enfants ; `paddingTop` est une bande en haut de chaque groupe, où s'écrit son `groupLabel`. Chacun accepte un nombre pour tous les niveaux ou un nombre par niveau à partir du premier (`[3, 1]` : 3 entre les nœuds de premier niveau, 1 en dessous). La bande d'un niveau s'applique à tous les frères d'un parent ou à aucun, omise dès que l'un d'eux est trop petit pour elle, afin que les groupes d'un niveau se lisent de la même façon.

Une feuille dont la valeur est 0, négative ou qui n'est pas un nombre n'occupe aucune aire : elle n'est pas dessinée, n'a pas d'étiquette et n'est pas trouvée par le pointeur, de même qu'un groupe dont toutes les feuilles sont dans ce cas.
Les aires d'un treemap sont des parts d'un tout, l'app indique donc avec ses propres mots ce qui est laissé de côté (une note sous la carte).
Les nombres négatifs sont réservés aux couleurs : la variation du jour d'une carte de marché.

La couleur d'un nœud est celle de sa ligne selon le `colorScale` du plot : `colorValue` est un nombre sur une rampe (`sequential`, `diverging` : pertes en rouge, gains en vert, valeur stable en neutre, sur l'étendue des valeurs en l'absence de `domain`), `color` une catégorie (`ordinal` : `"parent"` colore de la même façon les feuilles d'un groupe). Les feuilles forment la partie `leaf` (`leafClass`, `leafStyle`) et les groupes la partie `group` (`groupClass`, `groupStyle`), dessinée seulement avec une classe ou un style : un rectangle sous ses enfants, visible dans les écarts, son padding et sa bande. Chaque partie est identique sur tous les nœuds ou fonction de la ligne du nœud. `cornerRadii` arrondit chaque rectangle.

`label` écrit le nom de chaque feuille et `valueLabel` sa valeur en dessous, en fonction de la ligne et de sa valeur (celle d'un groupe est la somme de ses feuilles) : en haut à gauche (`labelPlacement="start"`) ou au milieu (`"center"`). La partie `label` est une boîte aussi grande que sa feuille : son padding est l'espace depuis les bords de la feuille et son texte style les lignes. Le nom est coupé par une ellipse lorsque la feuille est plus étroite et n'est affiché que s'il tient ; la valeur est affichée en entier ou pas du tout. Une étiquette dont la feuille a une couleur sombre porte l'attribut `data-dark`, de sorte que `data-dark:text-white` la garde lisible sur un rouge profond.

Au-dessus d'un treemap, le plot signale le nœud sous le pointeur (`onHoverChange`, la ligne du nœud) : une feuille, ou un groupe dans sa bande ou son padding ; au passage d'un écart entre frères, l'un d'eux, afin que le survol ne clignote pas. Les autres s'estompent jusqu'à `inactiveOpacity` (une feuille conserve ses groupes, un groupe ce qu'il contient), et la partie `hover`, une vue aussi grande que le nœud, le met en contour. Les touches fléchées passent à la feuille voisine à l'écran, Début et Fin à la première et à la dernière. À l'apparition du plot, les nœuds de premier niveau grandissent depuis leur milieu, les uns après les autres avec `stagger` ; quand les lignes changent, chaque nœud se déplace vers sa nouvelle boîte et sa nouvelle couleur avec `motion.update`, reconnu par son `id` : un nœud nouveau dans les lignes grandit depuis son milieu et un nœud disparu rétrécit vers le sien. Les échelles x et y du plot ne sont pas utilisées.

<!-- demo: el-plot-treemap -->

```tsx
import { signal } from "nsh";
import { Plot, Treemap } from "nsh/base/plot";

type Row = { id: string; parent?: string; name: string; cap?: number; chg?: number };

const rows: Row[] = [
  { id: "tech", name: "Technology" },
  { id: "fin", name: "Financials" },
  { id: "NVDA", parent: "tech", name: "NVIDIA", cap: 4300, chg: 2.4 },
  { id: "MSFT", parent: "tech", name: "Microsoft", cap: 3700, chg: -0.6 },
  { id: "AVGO", parent: "tech", name: "Broadcom", cap: 1600, chg: 3.1 },
  { id: "JPM", parent: "fin", name: "JPMorgan", cap: 830, chg: 1.3 },
  { id: "V", parent: "fin", name: "Visa", cap: 670, chg: -0.3 },
];

export function MarketMap() {
  const hovered = signal<number | null>(null);
  return (
    <Plot
      data={rows}
      colorScale={{ type: "diverging", domain: [-3, 3], range: ["#dc2626", "#e5e5e5", "#16a34a"] }}
      accessibilityLabel="Market map of 5 stocks in 2 sectors"
      accessibilityValue={{ text: hovered() == null ? undefined : rows[hovered()!].name }}
      onHoverChange={({ index }) => hovered.set(index)}
      appearGeneration={1}
      motion={{ appear: { duration: 800 }, update: { duration: 500 }, enter: { duration: 120 }, exit: { duration: 160 } }}
      class="h-72"
    >
      <Treemap
        id="id"
        parent="parent"
        value="cap"
        colorValue="chg"
        paddingInner={[3, 1]}
        paddingTop={18}
        cornerRadii={2}
        inactiveOpacity={0.35}
        label="id"
        valueLabel={(d: Row) => `${d.chg! > 0 ? "+" : ""}${d.chg}%`}
        labelPlacement="center"
        labelClass="p-1 text-xs font-semibold text-foreground data-dark:text-white"
        groupLabel="name"
        groupLabelClass="px-1 text-xs text-muted-foreground"
        hoverClass="rounded-xs outline-2 outline-foreground"
      />
    </Plot>
  );
}
```

```rust
use nsh_base::plot::{ColorScale, DivergingScale, TreemapPadding, plot, treemap};
use nsh_core::{element::{RowAccessor, RowText, Rows}, prelude::*};

const IDS: [&str; 5] = ["tech", "fin", "NVDA", "MSFT", "JPM"];
const PARENTS: [&str; 5] = ["", "", "tech", "tech", "fin"];

fn market_map() -> impl IntoElement {
    let rows = Rows::from_columns(
        5,
        [
            ("cap".into(), vec![0.0, 0.0, 4300.0, 3700.0, 830.0]),
            ("chg".into(), vec![0.0, 0.0, 2.4, -0.6, 1.3]),
        ],
    );
    plot()
        .data(rows)
        .color_scale(ColorScale::from(
            DivergingScale::new([rgb(0xdc2626), rgb(0xe5e5e5), rgb(0x16a34a)]).domain([-3.0, 3.0]),
        ))
        .accessibility_label("Market map")
        .h(px(288.0))
        .child(
            treemap()
                .id(RowText::from_fn(|i| IDS[i].into()))
                .parent(RowText::from_fn(|i| PARENTS[i].into()))
                .value(RowAccessor::key("cap"))
                .color_value(RowAccessor::key("chg"))
                .padding_inner(TreemapPadding::from([px(3.0), px(1.0)]))
                .padding_top(TreemapPadding::from(px(18.0)))
                .label(RowText::from_fn(|i| IDS[i].into())),
        )
}
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `id` | `.id(..)` | `keyof T \| (d: T, index: number) => string` | l'index de la ligne | L'id du nœud de chaque ligne : ce que désigne `parent`, et ce par quoi un nœud est reconnu quand les lignes changent. |
| `parent` | `.parent(..)` | `keyof T \| (d: T, index: number) => string` | aucun : chaque ligne est un nœud de premier niveau | L'id du parent de chaque ligne ; vide, ou id d'aucune ligne, pour un nœud de premier niveau. |
| `value` | `.value(..)` | `keyof T \| (d: T, index: number) => number` | obligatoire | La taille de chaque feuille ; celle d'un groupe est la somme de celles de ses enfants. Une feuille à 0, négative ou qui n'est pas un nombre n'occupe aucune aire. |
| `sort` | `.sort(..)` | `"value" \| "data"` | `"value"` | Les frères du plus grand au plus petit à partir du haut à gauche, ou dans l'ordre des lignes. |
| `ratio` | `.ratio(..)` | `number` | le nombre d'or | Le rapport d'aspect dont les tuiles s'approchent, au moins 1. |
| `paddingInner` | `.padding_inner(..)` | `number \| number[]` | `0` | L'écart entre frères, en points, par niveau à partir du premier (le dernier pour ceux en dessous). |
| `paddingOuter` | `.padding_outer(..)` | `number \| number[]` | `0` | L'espace à l'intérieur de chaque groupe autour de ses enfants, par niveau. |
| `paddingTop` | `.padding_top(..)` | `number \| number[]` | `0` | La bande en haut de chaque groupe, pour son `groupLabel`, par niveau ; sur tous les frères d'un parent ou sur aucun. |
| `cornerRadii` | `.corner_radii(..)` | `number \| { topLeft?, topRight?, bottomRight?, bottomLeft? }` | angles droits | Le rayon de chaque coin de ses rectangles. |
| `color` | `.color(..)` | `keyof T \| (d: T, index: number) => string` | aucun | La catégorie de chaque nœud, à laquelle un `ordinal` `colorScale` donne une couleur. |
| `colorValue` | `.color_value(..)` | `keyof T \| (d: T, index: number) => number` | aucun | Le nombre de chaque nœud, dont un `sequential` ou `diverging` `colorScale` fait sa couleur. |
| `leafClass` | `.leaf_class(..)` | `string \| (d: T, index: number) => string` | aucun | Les classes de chaque feuille (`fill-*`, `stroke-*`), identiques sur toutes les feuilles ou fonction de leur ligne. |
| `leafStyle` | `.leaf_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de chaque feuille, par-dessus ses classes. |
| `groupClass` | `.group_class(..)` | `string \| (d: T, index: number) => string` | aucun | Les classes de chaque groupe, un rectangle sous ses enfants ; les groupes ne sont dessinés qu'avec une classe ou un style. |
| `groupStyle` | `.group_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de chaque groupe, par-dessus ses classes. |
| `inactiveOpacity` | `.inactive_opacity(..)` | `number` (0 à 1) | aucun | L'opacité des nœuds éloignés du nœud survolé, et de leurs étiquettes, avec le fondu du survol. |
| `label` | `.label(..)` | `keyof T \| (d: T, index: number) => string` | aucun | Le nom dans chaque feuille, sur une ligne, coupé par une ellipse. |
| `valueLabel` | `.value_label(..)` | `(d: T, value: number, index: number) => string` | aucun | La valeur dans chaque feuille, sous son nom, affichée seulement là où elle tient en entier. |
| `labelPlacement` | `.label_placement(..)` | `"start" \| "center"` | `"start"` | Les étiquettes en haut à gauche de leurs feuilles, ou en leur milieu. |
| `labelClass` | `.label_class(..)` | `string` | aucun | Les classes de l'étiquette de chaque feuille, une boîte aussi grande que la feuille : son padding et les styles de texte ; `data-dark:` sur les feuilles sombres. |
| `labelStyle` | `.label_style(..)` | `StyleProp<TextStyle>` | aucun | Le style de l'étiquette de chaque feuille, par-dessus ses classes. |
| `valueLabelClass` | `.value_label_class(..)` | `string` | aucun | Les classes de la ligne de valeur, par-dessus celles de l'étiquette. |
| `valueLabelStyle` | `.value_label_style(..)` | `StyleProp<TextStyle>` | aucun | Le style de la ligne de valeur, par-dessus ses classes. |
| `groupLabel` | `.group_label(..)` | `keyof T \| (d: T, index: number) => string` | aucun | Le nom de chaque groupe, dans sa bande, coupé par une ellipse. |
| `groupLabelClass` | `.group_label_class(..)` | `string` | aucun | Les classes de l'étiquette de chaque groupe, une boîte aussi grande que la bande. |
| `groupLabelStyle` | `.group_label_style(..)` | `StyleProp<TextStyle>` | aucun | Le style de l'étiquette de chaque groupe, par-dessus ses classes. |
| `stagger` | `.stagger(..)` | `number` (0 à 0.95) | `0` | La façon dont les nœuds de premier niveau apparaissent l'un après l'autre : la part de l'apparition sur laquelle ils démarrent. |
| `hoverClass` | `.hover_class(..)` | `string` | aucun | Les classes de la partie `hover`, une vue aussi grande que le nœud survolé, placée par-dessus (`rounded-xs outline-2 outline-foreground`). |
| `hoverStyle` | `.hover_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de la partie de survol, par-dessus ses classes. |

Un rectangle se remplit avec `fill` (la couleur du `colorScale`, sinon `currentColor`, lorsqu'aucune n'est définie) et se trace avec `stroke` (aucun trait lorsqu'aucun n'est défini), la sienne primant sur celle du treemap et du plot, telles que CSS les hérite. La disposition n'est recalculée que lorsque les lignes, les options ou la taille du plot changent, jamais pour le pointeur ou l'apparition ; un changement de la taille du plot ne déplace rien. Un `id` répété, un `parent` qui ne désigne aucune ligne et une ligne qui est son propre ancêtre consignent un avertissement une seule fois : la première ligne garde l'id, l'orpheline est un nœud de premier niveau, le cycle n'est pas dessiné.

## PlotAxis

Un `PlotAxis` étiquette un bord du plot avec les graduations de l'échelle que porte ce bord : les bords bas et haut celles de l'échelle x, les bords gauche et droit celles de l'échelle y, comme `axisBottom`, `axisTop`, `axisLeft` et `axisRight` de d3. Ses graduations viennent de l'échelle : des valeurs rondes sur une échelle `linear` (1, 2 ou 5 fois une puissance de dix, à l'intérieur du domaine), des lignes sur une échelle `point` ou `band`. Ses étiquettes sont des textes que la disposition du plot place, de sorte que l'app dit ce qu'elles indiquent et à quoi elles ressemblent, et que la disposition les met en place : chaque étiquette est centrée sur sa graduation le long du bord. Le long des bords bas et haut, la première et la dernière se décalent vers l'intérieur juste autant qu'il le faut pour rester dans les extrémités du plot ; à côté des bords gauche et droit, chaque étiquette reste sur sa graduation, de sorte qu'elle se lit comme celle de sa ligne de grille, et lorsqu'une étiquette proche d'une extrémité dépasserait le bord haut ou bas du plot, les échelles y linéaires du plot commencent d'autant plus loin de ce bord (la moitié de la hauteur de l'étiquette pour une graduation située à l'extrémité), de sorte que chaque étiquette reste dans le plot, sur sa ligne de grille.

```tsx
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mb-6 ml-10 h-40">
  <Grid y={[0, 1000, 2000, 3000]} class="stroke-border" />
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* 0, 1,000, 2,000 and 3,000 left of the plot; a day under each row. */}
  <PlotAxis placement="left" ticks={3} labelClass="pr-2 text-xs tabular-nums text-muted-foreground" />
  <PlotAxis
    format={(i) => rows[i].day}
    labelClass="pt-2 text-xs text-muted-foreground"
    tickClass="h-1 w-px bg-border"
    lineClass="h-px bg-border"
  />
</Plot>
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `placement` | `.placement(..)` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` | Le bord le long duquel il s'étend : les bords bas et haut portent les graduations de l'échelle x, les bords gauche et droit celles de l'échelle y. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | L'échelle y qu'étiquette un axe gauche ou droit : le `yScale` du plot ou son second, `y2Scale` ([Dual axes](#dual-axes)). |
| `labelPlacement` | `.label_placement(..)` | `"outside" \| "inside"` | `"outside"` | L'emplacement de ses étiquettes : au-delà du bord, dans l'espace que l'app laisse autour du plot, où elles restent à l'écart des marques ; ou par-dessus le plot le long du bord, de sorte que le plot garde toute sa taille (à côté d'un bord gauche ou droit, chaque étiquette se place du côté supérieur de sa ligne de grille). |
| `ticks` | `.ticks(..)` | `number` | `10` sur une échelle `linear` (chaque pas des échelles alignées), chaque ligne sur les autres | À peu près combien de graduations il prend : sur une échelle `linear`, des valeurs rondes à l'intérieur du domaine, à peu près ce nombre ; sur une échelle `point` ou `band`, ce nombre de lignes réparties uniformément de la première à la dernière. |
| `tickValues` | `.tick_values(..)` | `number[]` | aucun | Les valeurs de ses graduations, à la place de `ticks` : des valeurs de l'échelle, des index de lignes sur une échelle `point` ou `band` (`[0, 3, 6]` étiquette une ligne sur trois). Les valeurs à l'intérieur du domaine obtiennent chacune une graduation. |
| `format` | `.format(..)` | `(value: number, index: number) => string` | la catégorie d'une bande sur une échelle de bandes de catégories, sinon la valeur, avec les décimales que nécessite le pas entre graduations, milliers groupés | Le texte de chaque graduation : la fonction de l'app appliquée à sa valeur (l'index d'une ligne sur une échelle `point` ou `band`) et à son index parmi les graduations de l'axe. |
| `labelClass`, `labelStyle` | `.label_class(..)`, `.label_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | La partie `label` : un texte par graduation, dont la police, la couleur et le padding sont ceux de l'app ; son padding vers le plot est sa distance au bord (`pt-2` sous un axe bas). |
| `tickClass`, `tickStyle` | `.tick_class(..)`, `.tick_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La partie `tick` : une vue par graduation sur le bord, centrée sur sa graduation et s'étendant vers les étiquettes (`h-1 w-px bg-border` sous un axe bas) ; affichée dès qu'elle est stylée. |
| `lineClass`, `lineStyle` | `.line_class(..)`, `.line_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La partie `line` : une vue le long de tout le bord, du côté des étiquettes (`h-px bg-border` sous un axe bas) ; affichée dès qu'elle est stylée. |

À l'extérieur, les étiquettes se placent dans la marge du plot, comme les axes de d3 se placent dans les marges d'un graphique : le plot garde la taille que lui donne l'app, et l'app lui donne une marge du côté de l'axe aussi profonde que les étiquettes (`mb-6` pour des étiquettes `pt-2 text-xs` en dessous), ou son padding parent à cet endroit. Deux axes sur un même bord étiquettent chacun leurs propres valeurs, dans leur propre style : les extrémités d'une plage en léger et son milieu plus marqué.

`format` est appelé une fois par graduation lorsque les graduations ou la fonction changent, au tour suivant, jamais pendant que le plot se dessine ou suit le pointeur : gardez-le pur (même valeur, même texte). Sans lui, une graduation se lit comme d3 l'écrit : `1,500`, `0.25`, `−2`. En Rust, `plot_axis()` crée un axe, dont `format` est un `TickFormat::from_fn(|value, index| ..)`.
Un axe ne prend aucun pointeur, et les lecteurs d'écran entendent le plot plutôt que ses étiquettes.
## PlotLabel

Un `PlotLabel` écrit des textes en des points du tracé : une légende au-dessus d'un pic, une étiquette au dernier point d'une courbe, une note au bout d'une ligne de grille. Chacun de ses `texts` désigne son point par des valeurs des échelles du tracé, comme le font les marques : l'indice d'une rangée sur une échelle `point` ou `band` (le milieu de la bande de la rangée), une valeur sur une échelle `linear`. Le bord supérieur du texte se place sur le point, et son `align` le fait commencer à cet endroit, le centre dessus ou le fait finir là. La mise en page du tracé place les textes, qui suivent donc la taille du tracé ; ils glissent avec les domaines des échelles (`motion.update`) et apparaissent en fondu avec l'animation d'apparition.

```tsx
import { Area, Line, Plot, PlotLabel } from "nsh/base/plot";

const rows = [
  { day: "Mon", visitors: 1820 },
  { day: "Tue", visitors: 2140 },
  { day: "Wed", visitors: 1960 },
  { day: "Thu", visitors: 2480 },
  { day: "Fri", visitors: 2310 },
];
const [peak, last] = [3, rows.length - 1];

<Plot data={rows} y="visitors" yScale={{ type: "linear", domain: [0, 3000] }} class="mr-12 h-40">
  <Area class="fill-chart-1/20" />
  <Line class="stroke-chart-1 stroke-2" />
  {/* The peak's value over it, and a tag right of the last point, its middle at the point's height. */}
  <PlotLabel
    class="text-xs tabular-nums text-muted-foreground"
    texts={[
      { text: `High ${rows[peak].visitors}`, x: peak, y: rows[peak].visitors, align: "center", class: "-translate-y-full pb-1" },
      { text: `${rows[last].visitors}`, x: last, y: rows[last].visitors, class: "-translate-y-1/2 ml-2 rounded bg-chart-1 px-1.5 text-white" },
    ]}
  />
</Plot>
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `texts` | `.texts(..)` | `PlotText[]` | `[]` | Les textes qu'il écrit, chacun à son propre point. |
| `scale` | `.scale(..)` | `"y" \| "y2"` | `"y"` | L'échelle y dont les `y` de ses textes sont des valeurs ([Dual axes](#dual-axes)). |

Chaque texte est un `PlotText` :

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `text` | `string` | | Ce qu'il lit. |
| `x` | `number` | | Où il se place sur l'axe x : une valeur de l'échelle x, ou l'indice d'une rangée sur une échelle `point` ou `band` (`0.5` se trouve à mi-chemin entre les deux premières rangées). |
| `y` | `number` | | Où se place son bord supérieur sur l'axe y : une valeur de l'échelle y. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Comment il se place sur x par rapport à son point : commençant au point, centré sur lui, ou finissant à lui. |
| `class`, `style` | `string`, `StyleProp<TextStyle>` | aucun | Les classes et le style propres du texte, appliqués par-dessus ce qu'il hérite du label : sa boîte (l'arrière-plan et le padding d'une étiquette) et sa distance au point. |

L'apparence est celle de l'app : le `class` du label donne à chaque texte les styles de texte qu'il hérite (police, taille, couleur), et les `class` et le style propres d'un texte le stylent à lui seul (`style`). Un texte se place au-dessus de son point avec `-translate-y-full`, et son padding est son écart au point (`pb-1`) ; une étiquette à côté du dernier point d'une courbe se place dans la marge que l'app laisse de ce côté (`mr-12`), comme le font les libellés d'un axe. En Rust, `plot_label()` crée un label, chaque texte étant un `PlotText::new(text, x, y)` avec `.align(PlotTextAlign::Center)`, `.class(..)` et `.style(..)`. Le pointeur traverse les textes jusqu'au tracé, et les lecteurs d'écran lisent le tracé, dont le `accessibilityLabel` dit ce que les textes mettent en évidence.

## Motion

Le mouvement est celui de l'app, et il est désactivé par défaut : tout s'affiche d'un coup. `motion` accepte les timings de [`nsh`](../modules/nsh.md#animation) (`{ duration, easing, delay }` et `{ stiffness, damping, mass }`) :

| Clé | Type | Ce qui bouge |
|---|---|---|
| `appear` | timing | Les marques se dessinent, avec un `appearGeneration` : courbes et aires depuis le bord d'attaque, barres qui poussent depuis leur base (l'une après l'autre avec le `stagger` d'une barre) ; points qui grandissent à partir de rien (l'un après l'autre avec le `stagger` d'un point) ; cellules qui grandissent depuis leur milieu (l'une après l'autre avec le `stagger` d'une cellule) ; l'anneau d'un pie et d'un arc se déploie dans le sens horaire depuis son début ; une courbe radiale pousse depuis son rayon intérieur, ses points avec elle ; les nœuds et les rubans d'un sankey depuis le bord d'attaque, ses libellés apparaissant en fondu. |
| `update` | timing | Les marques passent à la nouvelle forme quand l'app la change : les points vers leurs nouvelles valeurs et tailles, le point d'une nouvelle rangée grandissant et celui d'une rangée disparue rétrécissant ; les cellules vers leurs nouvelles couleurs (mélangées en OKLab) et bandes, la cellule d'une nouvelle rangée grandissant et celle d'une rangée disparue rétrécissant ; les rayons d'un pie et d'un arc, si bien que le trou d'un donut s'ouvre et se ferme, et leurs angles, si bien qu'une jauge ou une part balaie jusqu'à sa nouvelle valeur (`arcTween` de d3 : ce sont les angles qui bougent, pas le contour ; une nouvelle part s'ouvre à partir de la fin de la précédente ; un changement pendant un mouvement repart de là où le dessin se trouve) ; les points d'une courbe radiale vers leurs nouvelles valeurs, angles et rayons (une nouvelle rangée poussant depuis le rayon intérieur), les anneaux d'une grille radiale avec eux ; et le domaine d'une échelle linéaire, le `domain` de l'app ou l'étendue des valeurs des marques à mesure que les rangées arrivent, qui glisse de l'ancien vers le nouveau, entraînant les marques, les lignes de grille, les `PlotAxis` et les `PlotLabel` ; et les nœuds, les rubans et les libellés d'un sankey, de la disposition des anciens flux vers la nouvelle, un changement pendant leur mouvement repartant de là où ils sont dessinés. |
| `enter` | timing | Les éléments du survol apparaissent en fondu quand le pointeur arrive sur le tracé. |
| `exit` | timing | Ils disparaissent en fondu après son départ. |
| `pointer` | spring | Ils glissent d'une rangée à la suivante quand les touches ou un lecteur d'écran déplacent le survol ; la part d'un pie se soulève à cette occasion. |

Les éléments du survol suivent le pointeur dans la même frame : quand il bouge, la ligne en croix, les points et l'infobulle sont aussitôt sur la rangée qu'il survole, et suivent ainsi la main, tandis que leur fondu d'entrée et de sortie (`enter`, `exit`) reste animé.

Le mouvement s'exécute sur l'animateur de la plateforme, sans JS à chaque frame, et se termine immédiatement pour les personnes qui demandent une réduction des animations. Un tracé qu'une liste recrée pour une rangée qui revient se redessine, sauf si un [`PlotAppearScope`](#plotappearscope) autour de la liste a vu son apparition se terminer.

Un domaine bouge comme d3 fait la transition du domaine d'une échelle : l'échelle intermédiaire place chaque valeur, de sorte que les marques gardent leurs formes, que les lignes de grille et les éléments du survol se déplacent avec elles, que les barres gardent leurs coins, et qu'une rangée qui arrive avec le nouveau domaine bouge avec les autres. Un graphique en direct qui ajuste son échelle y à ses rangées de temps à autre (avec une marge, pour que la grille reste immobile entre deux ajustements) glisse vers chaque nouvel ajustement avec un timing `update`. Quand la taille du tracé change, les marques prennent la nouvelle taille immédiatement.

C'est le mouvement propre au tracé, les timings de ce que bouge un graphique : le clip de ses marques et les éléments de son survol. Les entrées, les sorties et les animations d'attention d'une vue relèvent des presets et des keyframes de [`createMotion`](../modules/nsh.md#createmotion), que l'app peut toujours jouer sur la vue du tracé ou sur les éléments qui l'entourent.

## PlotAppearScope

Une liste recrée le tracé d'une rangée chaque fois que la rangée revient dans la vue, de sorte qu'un sparkline avec une animation d'apparition se redessine chaque fois que la liste défile jusqu'à lui. Un `PlotAppearScope` autour de la liste mémorise les apparitions qui y sont terminées : un tracé recréé à cet endroit et dont le `appearGeneration` est terminé affiche ses marques entières d'un coup. Un tracé est mémorisé par sa génération, donc le tracé de chaque rangée reçoit la sienne, la clé de la rangée avec ce qui doit la rejouer (`` `${symbol} ${period}` ``).

```tsx
import { List } from "nsh";
import { Line, Plot, PlotAppearScope } from "nsh/base/plot";

<PlotAppearScope id={watchlist().id} class="flex-1">
  <List each={watchlist().rows} keyExtractor={(row) => row.symbol} estimatedItemSize={48} class="flex-1">
    {(row) => (
      <Plot
        data={row().closes}
        y="close"
        interactive={false}
        appearGeneration={`${row().symbol} ${period()}`}
        motion={{ appear: { duration: 400, easing: "easeOut" } }}
        class="h-8 w-24"
      >
        <Line class="stroke-chart-1 stroke-[1.5]" />
      </Plot>
    )}
  </List>
</PlotAppearScope>
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `id` | `.id(..)` | `number \| string` | aucun | Ce pour quoi le scope mémorise : quand cela change, le scope oublie et ses tracés se redessinent à neuf, là où ils sont. Nommez-le d'après le contenu, comme une watchlist ou une conversation ; sans nom, le scope mémorise aussi longtemps qu'il est affiché. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce qu'il contient : la liste, ou tout ce qui recrée ses tracés à mesure qu'ils vont et viennent. |

Une nouvelle génération redessine quand même le tracé, tout comme un tracé retiré avant la fin de son apparition, depuis le début. Une fois qu'un tracé a terminé une nouvelle génération, son scope oublie la précédente, si bien que revenir à une période antérieure redessine le tracé. La mémoire disparaît avec le scope : un scope qui n'est plus affiché, ou un scope avec un nouveau `id`, redessine ses tracés à neuf, et un tracé mémorise dans le scope le plus proche qui l'entoure. Son apparence est celle de l'app : `class` et `style` le disposent comme n'importe quelle vue (`flex-1` autour d'une liste qui remplit l'écran). En Rust, `plot_appear_scope()` en crée un.

## Keyboard

Un tracé interactif est un arrêt de Tab (macOS, le web), et tant qu'il a le focus clavier, ses touches déplacent le même survol que le pointeur : la ligne en croix, les points et l'infobulle glissent avec le spring `pointer`, la part d'un pie se soulève, `onHoverChange` signale la rangée, et les lecteurs d'écran lisent le `accessibilityValue` que l'app fournit pour elle. Son anneau de focus est celui de l'app : une classe `focus-visible:` ou un `focusStyle` (`focus-visible:outline-2 focus-visible:outline-ring`).

| Touches | Effet |
|---|---|
| Droite, Gauche | Aller à la rangée de ce côté : la suivante ou la précédente, dans l'autre sens sur une échelle x inversée, dont la première rangée est à droite (sur un pie, ses parts dans l'ordre des rangées ; sur un sankey, ses nœuds ; sur un treemap, la feuille voisine à l'écran, comme le font Haut et Bas) ; sans rangée survolée, Droite commence à la rangée de l'extrémité gauche et Gauche à celle de l'extrémité droite (sur un pie, la première et la dernière part). |
| Début, Fin | Aller à la première ou à la dernière rangée. |
| Haut, Bas | Sur des cellules : aller à la cellule au-dessus ou en dessous dans la même colonne. Sur des cellules, les touches suivent la grille à l'écran (la data grid de WAI-ARIA) : Droite et Gauche vont à la cellule suivante le long de la ligne, Début et Fin à la première et à la dernière cellule de la ligne ; sans cellule survolée, la première touche commence à la cellule en haut à gauche (Gauche, Haut et Fin à celle en bas à droite). À un bord, le survol reste en place. |
| Échap | Efface le survol. |

Le tracé répond à ses touches tant qu'il a le focus, et à Échap tant qu'une rangée est survolée ; le reste du temps, elles vont à l'app et aux vues qui l'entourent. Retirer le focus efface un survol provoqué par les touches. Le tracé ne prend aucun appui, de sorte qu'un tracé placé dans une carte pressable laisse ses appuis à la carte. Les lecteurs d'écran parcourent aussi les rangées : le balayage vers le haut et vers le bas de VoiceOver, le défilement avant et arrière de TalkBack, et tout lecteur d'écran qui propose les actions `increment` et `decrement` d'un élément passent à la rangée suivante et à la précédente, dans l'ordre des rangées, y compris sur une échelle inversée.

## Building charts

Un graphique est un tracé, ses marques, ses axes et les propres éléments de l'app autour d'eux. Donnez à l'échelle y un `domain` et à son axe les valeurs de la grille (`tickValues`) : chaque libellé se place alors sur sa ligne de grille. La ligne en croix, les points et l'infobulle du survol sont des éléments du tracé, stylés et remplis par l'app ; les valeurs de la rangée vont là où l'app les affiche.

Les grilles se lisent mieux en filets pleins avec une ligne de base plus marquée, ce qui laisse la ligne en pointillés signifier une valeur de référence (le cours d'ouverture ci-dessous). Une aire se lit mieux comme un lavis qui s'estompe vers sa ligne de base que comme un aplat. Le point de survol de chaque série prend la couleur de sa série, et la couleur de la surface sur laquelle repose le graphique pour son anneau, de sorte qu'il se détache de sa courbe, et l'infobulle se place en haut du tracé, à l'intérieur de ses bords pour la première et la dernière rangée : un `domain` avec de la place au-dessus de la valeur la plus haute l'éloigne de la courbe.

```tsx
import { signal, Text, View } from "nsh";
import { Area, Grid, Line, Plot, PlotAxis } from "nsh/base/plot";

type Row = { time: string; price: number };

export function PriceChart(props: { rows: Row[]; low: number; high: number }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const middle = () => (props.low + props.high) / 2;
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      {/* The value of the row under the pointer, or the last one. */}
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().time}</Text>
        <Text class="text-right text-xl font-semibold tabular-nums text-foreground">{shown().price.toFixed(2)}</Text>
      </View>
      <Plot
        data={props.rows}
        y="price"
        yScale={{ type: "linear", domain: [props.low, props.high] }}
        accessibilityLabel={`Price, from ${props.rows[0].price} to ${props.rows[props.rows.length - 1].price}`}
        accessibilityValue={{ text: `${shown().time}, ${shown().price.toFixed(2)}` }}
        appearGeneration={props.rows.length}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 120 }, exit: { duration: 160 }, pointer: { stiffness: 300, damping: 30 } }}
        crossLineClass="w-px h-full bg-muted-foreground/50"
        tooltipOffset={4}
        tooltipContent={
          <View class="flex-row items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-md">
            <View class="h-0.5 w-2.5 rounded-full bg-chart-1" />
            <Text class="text-xs tabular-nums text-popover-foreground">{shown().price.toFixed(2)}</Text>
          </View>
        }
        onHoverChange={({ index }) => hovered.set(index)}
        class="mr-10 mb-6 h-48"
      >
        <Grid y={[middle(), props.high]} class="stroke-border" />
        {/* A wash that fades out toward the baseline. */}
        <Area backgroundClass="bg-linear-to-b from-chart-1/20 to-transparent" />
        <Grid y={[props.low]} class="stroke-muted-foreground/40" />
        <Grid y={[props.rows[0].price]} class="stroke-muted-foreground" style={{ strokeDasharray: "3 3" }} />
        <Line class="stroke-chart-1 stroke-2" hoverDotClass="size-2.5 rounded-full border-2 border-card bg-chart-1" />
        {/* The grid's values right of the plot, and the first and last times under it. */}
        <PlotAxis
          placement="right"
          tickValues={[props.low, middle(), props.high]}
          format={(v) => v.toFixed(0)}
          labelClass="pl-2 text-xs tabular-nums text-muted-foreground"
        />
        <PlotAxis
          tickValues={[0, props.rows.length - 1]}
          format={(i) => props.rows[i].time}
          labelClass="pt-2 text-xs text-muted-foreground"
        />
      </Plot>
    </View>
  );
}
```

Un graphique en barres se lit mieux avec le sommet des barres arrondi et leur base carrée (`cornerRadii={{ topLeft: 4,
topRight: 4 }}`; in a stack only on its top bar), a hair of room between the bars of a band (`groupPadding`), les barres des autres rangées atténuées pendant qu'une est survolée (`inactiveOpacity`) et sa bande teintée (`crossLineClass`), et les valeurs en petits chiffres tabulaires au-dessus des barres, avec le total au-dessus d'un empilement. Avec `paddingOuter` égal à la moitié de `paddingInner`, les milieux des bandes tombent à intervalles réguliers, et un `PlotAxis` centre chaque mois sous sa bande ; un `maxBandWidth` garde quelques barres étroites dans une large carte.

```tsx
import { signal, Text, View } from "nsh";
import { Bar, Grid, Plot, PlotAxis } from "nsh/base/plot";

type Sale = { month: string; online: number; store: number };

export function SalesChart(props: { rows: Sale[]; stacked: boolean }) {
  const hovered = signal<number | null>(null);
  const shown = () => props.rows[hovered() ?? props.rows.length - 1];
  const tip = { topLeft: 4, topRight: 4 };
  return (
    <View class="gap-3 rounded-xl border border-border bg-card p-4">
      <View class="flex-row items-baseline">
        <Text class="flex-1 text-sm text-muted-foreground">{shown().month}</Text>
        <Text class="text-right text-sm tabular-nums text-foreground">{`${shown().online + shown().store}k`}</Text>
      </View>
      <Plot
        data={props.rows}
        xScale={{ type: "band", paddingInner: 0.3, paddingOuter: 0.15, maxBandWidth: 56, groupPadding: 0.1 }}
        yScale={{ type: "linear", domain: [0, 130] }}
        accessibilityLabel="Sales per month, online and in store"
        appearGeneration={props.stacked ? 1 : 0}
        motion={{ appear: { duration: 600, easing: "easeOut" }, enter: { duration: 150 }, exit: { duration: 150 }, pointer: { stiffness: 320, damping: 32 } }}
        crossLineClass="w-full h-full bg-foreground/5"
        onHoverChange={({ index }) => hovered.set(index)}
        class="mb-6 h-44"
      >
        <Grid y={[40, 80, 120]} class="stroke-border" />
        <Bar
          value="online"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={props.stacked ? 0 : tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? undefined : "online"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-1"
        />
        <Bar
          value="store"
          stack={props.stacked ? "sales" : undefined}
          cornerRadii={tip}
          stagger={0.4}
          inactiveOpacity={0.45}
          label={props.stacked ? (d) => String(d.online + d.store) : "store"}
          labelClass="pb-1 text-[11px] tabular-nums text-muted-foreground"
          class="fill-chart-2"
        />
        {/* A month centered under each band. */}
        <PlotAxis format={(i) => props.rows[i].month} labelClass="pt-2 text-xs text-muted-foreground" />
      </Plot>
    </View>
  );
}
```

Un sparkline dans une rangée de liste est un tracé avec `interactive={false}` : il dessine ses marques et ne suit aucun pointeur.

## Accessibility

- Un tracé est un seul élément pour les lecteurs d'écran, avec le rôle image et le `accessibilityLabel` de l'app ; ses marques, les libellés de ses axes, ses `PlotLabel` et les éléments du survol en font partie et ne disent rien eux-mêmes. Indiquez dans le libellé ce que montre le graphique et ce qui ressort (l'étendue, la valeur la plus haute), et donnez à `accessibilityValue` les mots pour la rangée sous le pointeur, afin qu'un lecteur d'écran annonce la valeur quand elle change.
- La rangée sous le pointeur est signalée avec `onHoverChange` sur les plateformes dotées d'un pointeur (ordinateurs, le web, un iPad avec un trackpad). Les écrans tactiles ne signalent aucun survol : affichez les valeurs dont un utilisateur tactile a besoin dans les propres éléments de l'app, ou proposez les rangées sous forme de texte ou de liste là où les chiffres comptent.
- Sur un pie, la rangée signalée est celle de la part sous le pointeur : donnez à `accessibilityValue` son nom, sa valeur et sa proportion (`"Team, 340 seats, 34.0%"`), et indiquez le total et la plus grande proportion dans le libellé. Sur un radar, c'est l'axe le plus proche du pointeur : donnez-lui le nom de l'axe et la valeur de chaque série à cet endroit.
- Un tracé interactif est un arrêt du focus clavier dont les flèches déplacent le survol ([Keyboard](#keyboard)), et il propose aux lecteurs d'écran `increment` et `decrement` pour parcourir les rangées (VoiceOver le lit comme ajustable) ; un tracé avec `interactive={false}` n'est ni l'un ni l'autre, et il ne prend aucun appui dans les deux cas.

Voir [Accessibility](../docs/accessibility.md) pour les libellés et les rôles en général.
<a id="platform-notes"></a>

## Notes sur les plateformes

- Toutes les plateformes dessinent les marques de la même façon, à partir d'un dessin par marque enregistré en Rust ; un changement des lignes redessine en un seul lot les marques qui les lisent, et un changement de classe de peinture (l'apparence, `dark:`) renvoie le dessin sans l'enregistrer de nouveau.
- L'apparition découpe les lignes et les aires, et fait croître les barres, avec des valeurs que l'animateur de la plateforme fait évoluer ; l'estompage d'une barre à distance de la ligne survolée est une opacité que l'animateur calcule à partir de la position du survol ; les parties du survol sont des vues que l'animateur déplace et fait apparaître en fondu, et il maintient l'infobulle à l'intérieur du graphique à partir de la taille du graphique et de celle de l'infobulle.
- L'arrière-plan d'une aire est dessiné dans son propre canevas, découpé selon la forme de l'aire, avec le même dégradé que celui que la plateforme dessine pour le `bg-linear-*` d'une vue ; un changement de ses classes (l'apparence, `dark:`) renvoie le dessin sans l'enregistrer de nouveau.
- Un graphique en secteurs dessine chaque part dans son propre canevas ; la part située sous le pointeur est trouvée en Rust à partir des angles et des rayons des parts, son soulèvement est un rayon et l'estompage des autres une opacité que l'animateur fait évoluer, et le balayage de l'apparition fait évoluer les angles des parts de la même manière, de sorte qu'aucun des deux n'enregistre de nouveau un dessin.
- La ligne d'un graphique radial située sous le pointeur est trouvée en Rust à partir des angles de ses points ; son point de survol est une vue que l'animateur place sur la ligne située sous le pointeur (en glissant sur le ressort `pointer` à mesure que les clés avancent), et pendant qu'elle apparaît ou évolue vers de nouvelles valeurs, ses points sont des nombres que l'animateur fait évoluer depuis leur position précédente, de sorte que la courbe n'est enregistrée qu'une seule fois par changement.
- Une marque de points est dessinée dans un seul canevas ; le point situé sous le pointeur est trouvé en Rust à partir des centres et des rayons des points, et son point de survol est une vue que l'animateur place sur lui, de la même taille que lui ; la croissance de l'apparition, les déplacements d'un changement et le fondu du survol sont des valeurs que l'animateur fait évoluer, de sorte que les points ne sont enregistrés qu'une seule fois par changement.
- Une marque de cellules est dessinée dans un seul canevas ; la cellule située sous le pointeur est trouvée en Rust à partir des boîtes des cellules, et sa cellule de survol est une vue que l'animateur place sur elle ; la croissance, les couleurs et les déplacements d'un changement et le fondu du survol sont des valeurs que l'animateur fait évoluer, de sorte que les cellules ne sont enregistrées qu'une seule fois par changement. Chaque étiquette est un texte de la plateforme, affiché là où sa taille calculée par la mise en page tient dans sa cellule.
- Les étiquettes, les graduations et la ligne d'un axe sont des textes et des vues propres à la plateforme, placés par la mise en page en Rust à partir de la taille et des échelles du graphique : ils se déplacent avec les marques lorsque la taille du graphique change, et un nouveau domaine réécrit les étiquettes.
