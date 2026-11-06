---
title: "Text"
description: "L'élément qui affiche du texte : spans imbriqués, liens, limites de lignes, mise à l'échelle des polices, vues en ligne et événements de mise en page du texte."
order: 20
group: primitives
demo: el-text
source_hash: 85fcf31a847a72cd
---

# Text

`Text` dessine un paragraphe. C'est l'élément qui affiche des chaînes : une chaîne enfant d'un `View` ne dessine rien. Le paragraphe est composé nativement (CoreText sur iOS et Mac Catalyst, `StaticLayout` sur Android) et mesuré sur le thread du moteur, de sorte que le thread principal ne fait que le dessiner. Rust en crée un avec `text(content)`, TSX avec `<Text>` depuis `nsh`.

```rust tabs
use nsh_core::prelude::*;

text("Read the ")
    .text_base()
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(text("terms").font_weight(FontWeight::BOLD))
    .child(" before you continue.")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  Read the <Text style={{ fontWeight: "700" }}>terms</Text> before you continue.
</Text>
```

`text(..)` accepte une chaîne, un `SharedString`, un signal ou une closure (`text(move || format!("{} items", count.get()))`) : une closure ou un signal met à jour le texte sur place lorsque ce qu'il lit change.

## Spans

Un texte à l'intérieur d'un texte est un span du même paragraphe, et non une vue distincte. Les spans héritent des styles de texte du paragraphe (`color`, `fontSize`, `fontWeight`, …) et remplacent ceux qu'ils définissent. Le bloc entier est une seule vue native. En Rust, `text(..)` affiche son contenu puis ses enfants : `.child(text(..))` ajoute un span, `.child("…")` un segment de texte brut.

```rust tabs
text("")
    .text_size(px(17.0))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic").italic().text_color(rgb(0x8250df)))
```

```tsx tabs
<Text style={{ fontSize: 17 }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "bold" }}>Bold </Text>
  <Text style={{ fontStyle: "italic", color: "#8250df" }}>Italic</Text>
</Text>
```

### Span backgrounds

Un span avec un arrière-plan remplit la boîte de ses caractères, derrière eux : aussi haute que sa police (l'ascendante au-dessus de la ligne de base et la descendante en dessous, quelle que soit la hauteur de ligne), et sur chaque ligne où il passe à la ligne, la partie de chaque ligne formant une boîte distincte avec le rayon de coin du span. Les spans qu'il contient partagent son arrière-plan, sauf s'ils définissent le leur. Il s'agit uniquement de dessin : le texte est mis en page comme s'il n'y en avait pas, et un texte sélectionnable copie les caractères du span avec le reste. Le code en ligne est un span :

```rust tabs
text("Run ")
    .text_size(px(15.0))
    .line_height(px(22.0))
    .select_text()
    .child(
        text(" cargo test ")
            .font_family("ui-monospace")
            .text_size(px(13.0))
            .bg(rgb(0xeff1f3))
            .rounded(px(4.0)),
    )
    .child(" before you commit.")
```

```tsx tabs
<Text style={{ userSelect: "text", fontSize: 15, lineHeight: 22 }}>
  {"Run "}
  <Text style={{ fontFamily: "ui-monospace", fontSize: 13, backgroundColor: "#eff1f3", borderRadius: 4 }}>
    {" cargo test "}
  </Text>
  {" before you commit."}
</Text>
```

Les classes Tailwind fonctionnent de la même manière : `<Text class="bg-gray-100 rounded">`. Le padding et les bordures sont des styles de boîte et n'affectent pas les spans ; des espaces à l'intérieur du span donnent de la place à la boîte sur ses côtés.

### Links

Un span avec un gestionnaire de pression est un lien : une pression sur ses caractères va au span, une pression ailleurs au paragraphe.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(15.0))
    .on_press(move || log("the sentence"))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(move || open("terms")),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 15 }} onPress={() => log("the sentence")}>
  {"By continuing you agree to the "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={() => open("terms")}>
    Terms of service
  </Text>
  .
</Text>
```

### Inline views and images

Tout autre élément à l'intérieur d'un texte (une vue, une image, même à l'intérieur de spans) est une pièce jointe en ligne : elle est mise en page à sa propre taille, se place sur la ligne de base (ou là où son style `verticalAlign` la place : `"text-top"`, `"text-bottom"`, `"middle"`, comme en CSS ; la ligne s'agrandit pour la contenir) et passe à la ligne avec les mots. Elle reçoit ses propres pressions.

```rust tabs
text("Made with ")
    .text_base()
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)).rounded(px(4.0)))
    .child(" NSH. Status ")
    .child(
        view()
            .bg(rgb(0x1a7f37))
            .rounded(px(9.0))
            .px(px(7.0))
            .h(px(18.0))
            .justify_center()
            .child(text("LIVE").text_color(white()).text_size(px(11.0)).font_weight(FontWeight::BOLD)),
    )
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 26 }}>
  {"Made with "}
  <Image src={logo} style={{ width: 18, height: 18, borderRadius: 4 }} />
  {" NSH. Status "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Les pièces jointes coupées par `numberOfLines` ou par une ellipse sont masquées. La copie d'un texte sélectionnable les omet.

### Whitespace

Le texte JSX suit les règles de React : les lignes sont rognées sauf aux extrémités du texte, les lignes ne contenant que des espaces sont supprimées et les lignes restantes sont jointes par une seule espace. Les espaces sur une même ligne sont conservées (`{a} {b}` garde son espace). Écrivez `{" "}` ou une expression de chaîne lorsqu'un span a besoin d'une espace au début ou à la fin. Les chaînes Rust sont dessinées telles qu'elles sont écrites.

## Props

En plus des [props communes](./index.md#common-props) (avec `style` typé comme `TextStyle`) :

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)`, `.truncate()` | `number` | `0` | Le nombre maximal de lignes affichées ; `0` les affiche toutes. |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | `"ellipsis" \| "clip" \| "ellipsis-start" \| "ellipsis-middle"` | `"ellipsis"` | La façon dont le texte qui ne tient pas dans `numberOfLines` est coupé : une ellipse à sa fin, à son début ou en son milieu, ou un rognage. |
| `allowFontScaling` | `.allow_font_scaling(..)` | `boolean` | `true` | Suit le réglage de taille de texte du système. |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(..)` | `number` | `0` | La borne supérieure de l'échelle du système ; `0` signifie aucune. |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | `boolean` | `false` | Réduit la police jusqu'à ce que le texte tienne dans ses lignes (`numberOfLines`) et dans sa boîte. |
| `minimumFontScale` | `.shrink_to_fit(min_scale)` | `number` | | Jusqu'où `adjustsFontSizeToFit` peut réduire au maximum (0..1 ; au moins 0.1). |
| `userSelect` (style) | `.select_text()`, `.select_none()` | `"auto" \| "none" \| "text"` | `"auto"` | `"text"` : l'utilisateur peut sélectionner des plages du texte : un appui long sélectionne un mot, des poignées l'étendent, le menu d'édition le copie. `"auto"` reprend le réglage des vues autour du texte ; si aucun n'est défini, le texte n'est pas sélectionnable, sauf dans les navigateurs de bureau, où il l'est à moins qu'il ne se trouve dans un élément interactif ; `"none"` le rend là aussi non sélectionnable. |
| `selectionColor` (style) | `.selection_color(..)` | `ColorValue` | la couleur d'accent de la plateforme | La surbrillance et les poignées de la sélection. |
| `onTextLayout` | | `(e: { lines: TextLayoutLine[] }) => void` | | Les lignes mises en page après chaque mise en page. |

Les classes Tailwind `select-text`, `select-none` et `select-auto` définissent `userSelect`, `line-clamp-*` définit `numberOfLines`, `text-ellipsis` et `text-clip` définissent `textOverflow`, et `truncate` donne une seule ligne coupée par une ellipse. La surbrillance et les poignées de la sélection utilisent la clé de style `selectionColor` (`selection:text-*`), la couleur d'accent de la plateforme par défaut.

## Text styles

`TextStyle` s'ajoute aux styles de vue : `color`, `fontSize`, `fontWeight` (`"normal"`, `"bold"` ou 100–900), `fontStyle`, `fontFamily`, `lineHeight`, `letterSpacing`, `textAlign`, `textAlignVertical`, `textTransform`, `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`, `textDecorationThickness`, `textUnderlineOffset`, `textShadow` (le `text-shadow` de CSS), `fontVariant`, `writingDirection`, `numberOfLines` et `textOverflow`. En Rust, ce sont des méthodes de `Styled` : `.text_color(..)`, `.text_size(..)` (ou `.text_sm()`, `.text_lg()`, …), `.font_weight(FontWeight::SEMIBOLD)`, `.italic()`, `.font_family(..)`, `.line_height(..)`, `.letter_spacing(..)`, `.text_center()`, `.uppercase()`, `.underline()`, `.line_through()`, `.tabular_nums()`, `.number_of_lines(..)` et les autres. Voir la [référence des styles](../modules/style-reference.md#textstyle) et [text](../docs/text.md).

La famille de police est une famille système ou un fichier de police de l'application :

```rust tabs
// assets/fonts/Inter-Regular.ttf, shipped by the registry (`registry.assets(assets!())`).
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Inter").font_family(INTER.family).text_size(px(17.0))
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";

<Text style={{ fontFamily: Inter, fontSize: 17 }}>Inter</Text>;
```

La police est enregistrée avant la première frame. Voir [fonts](../docs/fonts.md).

## Events

| Event | Rust | Payload | Quand |
|---|---|---|---|
| `onTextLayout` | | `{ lines: TextLayoutLine[] }` | Après chaque mise en page du paragraphe. |
| `onPress`, `onLongPress`, … | `.on_press`, `.on_long_press`, … | `PressEvent` (aucun en Rust) | Comme sur [view](./view.md#events) ; sur un span, les pressions sur ses caractères. |
| `onLayout` | `.on_layout` | `{ bounds }` | Le cadre du bloc a changé. |

`TextLayoutLine` vaut `{ text, x, y, width, height, ascender, descender, capHeight, xHeight }`, dans la boîte de contenu du texte :

```tsx
const lines = signal(0);
<Text onTextLayout={(e) => lines.set(e.lines.length)}>{article}</Text>;
```

Rust mesure une chaîne avant sa mise en page avec `measure_text(..)`.

## Ref methods

Aucune qui lui soit propre.

## Platform notes

- La sélection reste à l'intérieur d'un seul bloc de texte (un texte et ses spans). iOS affiche son menu d'édition (Copy, Select All, Look Up, Translate, Share), Android une barre d'outils flottante (Copy, Select all, Share).
- Les décorations de texte autres qu'une ligne simple continue (`double`, `dotted`, `dashed`, `wavy`) sont dessinées par NSH sur iOS.
- Les textes iOS dessinent des arrière-plans pleins et des ombres extérieures.
- `fontScale()` de [`nsh`](../modules/nsh.md#device) (`font_scale()` en Rust) renvoie l'échelle de texte actuelle du système.
