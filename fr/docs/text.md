---
title: "Texte"
description: "Affichage de texte avec l'élément text en Rust et TSX : spans imbriqués et liens, vues en ligne, polices et décorations, troncature, taille de texte système, sélection et onTextLayout."
order: 35
group: ui
source_hash: 9d528fcdc65c1a8c
---

# Texte

Tout texte est affiché par des éléments text : `text(..)` en Rust, `<Text>` en TSX. Un élément text est un paragraphe, composé par le moteur de texte de la plateforme (CoreText sur les plateformes Apple, `StaticLayout` sur Android) sur le thread du moteur lors de la mise en page, puis dessiné uniquement sur le thread principal. Les éléments text imbriqués sont des spans du même paragraphe, et non des vues distinctes.

```rust tabs
text("By continuing you agree to the ")
    .text_size(px(16.0))
    .line_height(px(24.0))
    .text_color(rgb(0x1f2328))
    .child(
        text("Terms of service")
            .text_color(rgb(0x0969da))
            .underline()
            .on_press(open_terms),
    )
    .child(".")
```

```tsx tabs
<Text style={{ fontSize: 16, lineHeight: 24, color: "#1f2328" }}>
  By continuing you agree to the{" "}
  <Text style={{ color: "#0969da", textDecorationLine: "underline" }} onPress={openTerms}>
    Terms of service
  </Text>
  .
</Text>
```

> [!IMPORTANT]
> Les chaînes sont affichées par des éléments text. En TSX, une chaîne placée directement dans un `<View>` n'est pas affichée : encadrez-la avec `<Text>`.

L'élément lui-même est documenté sur [text](../elements/text.md) ; cette page explique comment l'utiliser.

<a id="strings-and-whitespace"></a>

## Chaînes et espaces

En Rust, le contenu d'un texte est une chaîne, affichée telle qu'elle est écrite : `\n` provoque un saut de ligne. Un contenu qui lit des signaux est une closure, et le texte se met à jour lorsqu'ils changent. En TSX, le texte JSX suit les mêmes règles qu'en React : chaque ligne est rognée, les lignes constituées uniquement d'espaces sont supprimées, et les lignes restantes sont jointes par une seule espace. Les espaces à l'intérieur d'une même ligne sont conservées, donc `{first} {last}` garde son espace. Utilisez `{" "}` pour une espace en début ou en fin de ligne, et `{"\n"}` pour un saut de ligne :

```rust tabs
text(move || format!("Hello, {}!\nWelcome back.", name.get()))
```

```tsx tabs
<Text>
  Hello,
  {name()}!{"\n"}
  Welcome back.
</Text>
```

Les expressions dans le texte suivent ce qu'elles lisent : `text(move || format!("{} items", count.get()))` et `<Text>{count()} items</Text>` se mettent à jour lorsque `count` change.

<a id="spans-and-inheritance"></a>

## Spans et héritage

Un texte dans un texte est un span. Il hérite du style de texte de son parent et remplace ce qu'il définit :

```rust tabs
text("")
    .text_size(px(17.0))
    .text_color(rgb(0x1f2328))
    .child(text("Light ").font_weight(FontWeight::LIGHT))
    .child(text("Bold ").font_weight(FontWeight::BOLD))
    .child(text("Italic ").italic())
    .child(text("Spaced").letter_spacing(px(4.0)))
```

```tsx tabs
<Text style={{ fontSize: 17, color: "#1f2328" }}>
  <Text style={{ fontWeight: "300" }}>Light </Text>
  <Text style={{ fontWeight: "700" }}>Bold </Text>
  <Text style={{ fontStyle: "italic" }}>Italic </Text>
  <Text style={{ letterSpacing: 4 }}>Spaced</Text>
</Text>
```

Les styles de texte se transmettent aussi depuis les vues, comme en CSS : `view().text_color(white()).text_sm()` en Rust et `<View class="text-white text-sm">` en TSX stylisent les éléments text et input qu'elles contiennent.

<a id="links"></a>

### Liens

Un span avec un gestionnaire d'appui (`.on_press(..)` ou `.on_long_press(..)` ; `onPress` ou `onLongPress`) est un lien : un appui sur ses caractères va au span, un appui ailleurs va au paragraphe. Les liens dans des spans imbriqués fonctionnent aussi.

```rust tabs
text("Read the ")
    .on_press(move || tapped.set("the sentence"))
    .child(text("terms").text_color(rgb(0x0969da)).on_press(move || tapped.set("terms")))
    .child(" first.")
```

```tsx tabs
<Text onPress={() => log("the sentence")}>
  Read the <Text style={{ color: "#0969da" }} onPress={() => open(termsUrl)}>terms</Text> first.
</Text>
```

<a id="backgrounds-of-spans"></a>

### Arrière-plans des spans

La couleur d'arrière-plan et le rayon de coin d'un span peignent un rectangle derrière ses caractères sur chaque ligne qu'il occupe, de la hauteur de sa police ; le texte est mis en page de la même façon et se copie en entier, donc le code en ligne est un span
([Élément text](../elements/text.md#span-backgrounds)) :

```rust tabs
text("Run ")
    .child(text(" npm test ").font_family("ui-monospace").bg(rgb(0xeff1f3)).rounded(px(4.0)))
    .child(" first.")
```

```tsx tabs
<Text>
  Run <Text style={{ fontFamily: "ui-monospace", backgroundColor: "#eff1f3", borderRadius: 4 }}> npm test </Text> first.
</Text>
```

<a id="views-and-images-inside-text"></a>

### Vues et images dans le texte

Tout élément autre qu'un text placé dans un text est disposé en ligne, sur la ligne de base, et passe à la ligne avec les mots. Il peut recevoir ses propres appuis :

```rust tabs
text("Made with ")
    .text_size(px(16.0))
    .line_height(px(26.0))
    .child(image(LOGO).size(px(18.0)))
    .child(" nsh. Status ")
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
  Made with <Image src={logo} style={{ width: 18, height: 18 }} /> nsh. Status{" "}
  <View style={{ backgroundColor: "#1a7f37", borderRadius: 9, paddingHorizontal: 7, height: 18, justifyContent: "center" }}>
    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>LIVE</Text>
  </View>
</Text>
```

Les éléments en ligne coupés par `numberOfLines` ou par une ellipse sont masqués ; la copie du texte les omet. Le texte à l'intérieur d'un
élément en ligne prend la couleur du texte qui l'entoure, comme `color` en CSS atteint un inline-block, sauf s'il définit la sienne
(c'est le cas du badge `LIVE` ci-dessus) ; sa police et sa hauteur de ligne restent les siennes.

La clé de style `verticalAlign` place un élément en ligne dans sa ligne, comme `vertical-align` place une image :
`"baseline"` (par défaut) pose son bas sur la ligne de base, `"text-top"` et `"text-bottom"` placent son haut ou son bas
en haut ou en bas de la police du texte, et `"middle"` le centre à la moitié de la hauteur d'x de la police au-dessus de la ligne de base. La
ligne s'agrandit pour contenir l'élément partout où il dépasse de la police, y compris avec un `lineHeight` fixe. Une icône en début de paragraphe qui doit
s'aligner sur le bas du texte, comme la dessine `ImageSpan` d'Android, prend `"text-bottom"`. Les classes sont
`align-baseline`, `align-text-top`, `align-text-bottom` et `align-middle` ; en Rust, `.align_text_bottom()` et les
autres du même nom.

```tsx
<Text style={{ fontSize: 16 }}>
  <Image src={badge} style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} /> Verified seller
</Text>
```

<a id="text-styles"></a>

## Styles de texte

| Propriété | Valeurs | Rust |
|---|---|---|
| `color` | Une [couleur](./styling.md#colors). Noir par défaut | `.text_color(..)` |
| `fontSize` | Points. 14 par défaut | `.text_size(px(..))`, `.text_sm()`, `.text_lg()`, ... |
| `fontWeight` | `"normal"` (400), `"bold"` (700), ou `100`–`900` (nombre ou chaîne) | `.font_weight(FontWeight::BOLD)` |
| `fontStyle` | `"normal"`, `"italic"` : les emoji en couleur restent droits | `.italic()` |
| `fontFamily` | Une famille système, une famille générique ou une [police importée](./fonts.md) | `.font_family(..)` |
| `lineHeight` | Points | `.line_height(px(..))` |
| `letterSpacing` | Points | `.letter_spacing(px(..))` |
| `textAlign` | `"auto"`, `"left"`, `"center"`, `"right"`, `"justify"`, `"start"`, `"end"` : `left` et `right` gardent leurs côtés de droite à gauche, `start` et `end` suivent la direction | `.text_left()`, `.text_center()`, `.text_right()`, `.text_justify()` |
| `textAlignVertical` | `"auto"`, `"top"`, `"center"`, `"bottom"` : l'emplacement d'un texte plus court que sa boîte | |
| `textTransform` | `"none"`, `"uppercase"`, `"lowercase"`, `"capitalize"` | `.normal_case()`, `.uppercase()`, `.lowercase()`, `.capitalize()` |
| `textDecorationLine` | `"none"`, `"underline"`, `"line-through"`, `"underline line-through"` | `.no_underline()`, `.underline()`, `.line_through()` |
| `textDecorationColor`, `textDecorationStyle` | Couleur ; `"solid"`, `"double"`, `"dotted"`, `"dashed"`, `"wavy"` | `.text_decoration_color(..)`, `.text_decoration_wavy()`, ... |
| `textDecorationThickness`, `textUnderlineOffset` | Points, ou `"auto"` (l'épaisseur aussi `"from-font"`) | `.text_decoration_thickness(px(..))`, `.underline_offset(px(..))` |
| `textShadow` | `text-shadow` de CSS, une ombre derrière les glyphes : `"2px 2px 4px rgb(0 0 0 / 0.6)"` (décalages, flou, couleur), ou ses couches sous forme de nombres, `[{ x: 2, y: 2, blur: 4, color: "#00000099" }]` ; plusieurs couches se dessinent comme la plus large | `.text_shadow([TextShadow { .. }])`, `.text_shadow_sm()`, ..., `.text_shadow_color(..)` |
| `fontVariant` | Fonctionnalités OpenType : `["tabular-nums"]`, `"small-caps"`, `"oldstyle-nums"`, `"lining-nums"`, `"proportional-nums"` | `.tabular_nums()`, `.small_caps()`, `.oldstyle_nums()`, `.lining_nums()`, `.proportional_nums()` |
| `writingDirection` | `"auto"`, `"ltr"`, `"rtl"` : la direction de base du paragraphe | `.writing_direction(WritingDirection::Rtl)` |

Un élément text est aussi une vue : il accepte les arrière-plans, bordures, coins, marges intérieures et les autres [styles de vue](./styling.md).

```rust tabs
text(move || format!("{:.2}", price.get())).text_size(px(18.0)).tabular_nums()
text("Typo").underline().text_decoration_wavy().text_decoration_color(rgb(0xcf222e))
text("Shadow")
    .text_size(px(26.0))
    .font_weight(FontWeight::EXTRA_BOLD)
    .text_color(white())
    .text_shadow([TextShadow {
        offset_x: px(2.0),
        offset_y: px(2.0),
        radius: px(4.0),
        color: rgba(0x00000099).into(),
    }])
```

```tsx tabs
<Text style={{ fontSize: 18, fontVariant: ["tabular-nums"] }}>{price().toFixed(2)}</Text>
<Text style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "#cf222e" }}>Typo</Text>
<Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>
  Shadow
</Text>
```

`tabular-nums` donne à chaque chiffre la même largeur, ce qui évite que les compteurs et les prix ne vacillent lorsqu'ils changent.

<a id="truncation"></a>

## Troncature

```rust tabs
text(long_description).number_of_lines(2)
text(file_path).number_of_lines(1).text_overflow(EllipsizeMode::Middle)
```

```tsx tabs
<Text style={{ numberOfLines: 2 }}>{longDescription}</Text>
<Text style={{ numberOfLines: 1, textOverflow: "ellipsis-middle" }}>{filePath}</Text>
```

| Clé de style / prop | Rust | Description |
|---|---|---|
| `numberOfLines` (style) | `.number_of_lines(n)` | Le nombre maximal de lignes affichées ; `0` (par défaut) les affiche toutes |
| `textOverflow` (style) | `.text_overflow(EllipsizeMode::Middle)` | Comment le texte qui ne tient pas est coupé : une ellipse à la fin (`"ellipsis"`, par défaut), au début (`"ellipsis-start"`) ou au milieu (`"ellipsis-middle"`), ou `"clip"` |
| `adjustsFontSizeToFit` | `.shrink_to_fit(min_scale)` | Réduit la police jusqu'à ce que le texte tienne dans ses lignes et sa boîte |
| `minimumFontScale` | | Jusqu'où `adjustsFontSizeToFit` peut réduire (0–1) |

```rust tabs
text(move || total.get())
    .number_of_lines(1)
    .shrink_to_fit(0.5)
    .text_size(px(48.0))
    .w(px(200.0))
```

```tsx tabs
<Text adjustsFontSizeToFit minimumFontScale={0.5} style={{ numberOfLines: 1, fontSize: 48, width: 200 }}>
  {total()}
</Text>
```

Les classes Tailwind `line-clamp-*`, `text-ellipsis` et `text-clip` définissent les mêmes clés, et `truncate` (`.truncate()`) est une ligne unique coupée par une ellipse ; en tant que clés de style, elles acceptent aussi les styles d'état et les variantes.

<a id="system-text-size"></a>

## Taille de texte du système

Par défaut, le texte suit le réglage de taille de texte de l'utilisateur (Dynamic Type sur iOS, taille de police sur Android).

| Prop | Rust | Description |
|---|---|---|
| `allowFontScaling` | `.allow_font_scaling(false)` | `false` garde la taille fixe. `true` par défaut |
| `maxFontSizeMultiplier` | `.max_font_size_multiplier(1.5)` | L'échelle maximale appliquée, p. ex. `1.5`. `0` signifie aucune limite |

`font_scale()` en Rust et `fontScale()` depuis [`nsh`](../modules/nsh.md#device) en TSX donnent l'échelle courante, et changent lorsque l'utilisateur modifie le réglage. Les champs de saisie acceptent aussi `allowFontScaling` et `maxFontSizeMultiplier`.

```rust tabs
text("Tab label").max_font_size_multiplier(1.3).text_size(px(13.0))
```

```tsx tabs
<Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13 }}>Tab label</Text>
```

Préférez limiter l'échelle plutôt que la désactiver : le texte agrandi est un réglage d'accessibilité sur lequel s'appuient de nombreuses personnes.

<a id="selection"></a>

## Sélection

La clé de style `userSelect: "text"` (`.select_text()`, la classe `select-text`) permet à l'utilisateur de sélectionner et de copier le texte, comme dans les vues de texte du système : un appui long sélectionne le mot sous le doigt, les poignées déplacent les extrémités de la sélection, et le menu d'édition propose Copier et Tout sélectionner (iOS ajoute Rechercher, Traduire et Partager ; Android, Partager). Une sélection reste à l'intérieur d'un seul bloc de texte. La clé de style `selectionColor` (`.selection_color(..)`, `selection:text-*`) colore la surbrillance et les poignées. `userSelect` défini sur une vue atteint les textes qu'elle contient qui n'en définissent aucun.

Dans les navigateurs de bureau, le texte est sélectionnable par défaut, comme sur une page web, sauf à l'intérieur des éléments interactifs (vues avec gestionnaires d'appui ou de toucher, comme les boutons et les lignes pressables) ; `userSelect: "none"` (`.select_none()`, la classe `select-none`) y garde un texte non sélectionnable. Les navigateurs de téléphone et de tablette suivent la règle native.

```rust tabs
text(order_number).select_text().selection_color(rgb(0x7c3aed))
```

```tsx tabs
<Text style={{ userSelect: "text", selectionColor: "#7c3aed" }}>{orderNumber}</Text>
```

Pour copier depuis le code (un bouton Copier), utilisez `set_clipboard(..)` en Rust ou [`Clipboard`](../modules/nsh.md#clipboard) en TSX.

## onTextLayout

`onTextLayout` (l'événement `TextLayout` en Rust) signale les lignes mises en page après chaque mise en page, dans la boîte de contenu du texte :

```rust tabs
text(move || body.get()).on(EventKind::TextLayout, move |e: &EventPayload| {
    if let EventPayload::TextLayout(laid_out) = e {
        lines.set(laid_out.len());
    }
})
```

```tsx tabs
<Text
  onTextLayout={(e) => {
    lines.set(e.lines.length);
    console.log(e.lines.map((l) => `${l.text} (${l.bounds.size.width.toFixed(0)}pt)`));
  }}
>
  {body()}
</Text>
```

Chaque ligne a `text`, `x`, `y`, `width`, `height`, `ascender`, `descender`, `capHeight` et `xHeight` (`cap_height` et `x_height` en Rust). Utilisez-le pour afficher un bouton « Lire la suite » uniquement lorsque le texte a été coupé, ou pour aligner d'autres contenus sur une ligne de base.

<a id="accessibility"></a>

## Accessibilité

Un élément text est lu par les lecteurs d'écran comme son contenu. Donnez un rôle aux textes qui font office de titre (`.role(AccessibilityRole::Header)`, `role="header"`) et aux liens (`AccessibilityRole::Link`, `role="link"`). Voir [Accessibilité](./accessibility.md).

<a id="related"></a>

## Voir aussi

- [Polices](./fonts.md) : polices personnalisées et graisses.
- [Élément text](../elements/text.md) : toutes les props.
- [Formulaires et clavier](./forms-and-keyboard.md) : saisie de texte.
