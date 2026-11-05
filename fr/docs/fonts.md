---
title: "Polices"
description: "La police système et les familles génériques, les listes de repli, l'intégration de fichiers .ttf, .otf, .woff et .woff2 depuis les assets d'un crate Rust ou via des imports TSX, les familles avec plusieurs graisses et italiques, et les polices dans les styles typés et les classes Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# Polices

Le texte utilise la police système (San Francisco sur iOS, Roboto sur Android) sauf si une famille de polices indique autre chose (`.font_family(..)` en Rust, `fontFamily` en TSX). Une famille peut être une famille générique, une police installée sur l'appareil ou un fichier de police livré avec l'application.

<a id="system-and-generic-families"></a>

## Familles système et génériques

| `fontFamily` | Police |
|---|---|
| (aucune), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | La police système |
| `"serif"`, `"ui-serif"` | La police à empattements du système (New York sur iOS, Noto Serif sur Android) |
| `"monospace"`, `"ui-monospace"` | La police à chasse fixe du système (SF Mono sur iOS) |
| `"ui-rounded"` | La police système arrondie (SF Pro Rounded), iOS uniquement |

La police système prend en charge toutes les graisses de 100 à 900. Les classes Tailwind `font-sans`, `font-serif` et `font-mono` correspondent aux trois premières lignes, et `font-sans` et `font-mono` aux polices du thème lorsqu'il en définit ([Une police par défaut pour l'application](#a-default-font-for-the-app)).

Une famille installée sur l'appareil peut être nommée directement (`"Georgia"`, `"Avenir Next"` sur iOS). Les polices installées diffèrent selon les plateformes et les versions : livrez donc les polices dont dépend votre design. Sur iOS, une famille inexistante se replie sur la police système avec un avertissement dans le journal (`font family 'X' is not available`) ; indiquez une liste pour choisir la police de remplacement ([Listes de repli](#fallback-lists)).

<a id="shipping-a-font"></a>

## Livrer une police

Un crate Rust livre les fichiers de son répertoire `assets/` : `registry.assets(assets!())` dans sa fonction `#[native_module]` les livre tous, et `asset!("fonts/Pacifico-Regular.ttf")` est un `FontAsset` dont `family` est le nom de famille de la police, lu dans le fichier lors de la compilation du crate. En TSX, importez un fichier `.ttf`, `.otf`, `.woff` ou `.woff2` : l'import vaut le nom de famille de la police. Dans les deux cas, la police est enregistrée avant la première image, elle est donc prête dès le premier rendu du texte. Les fichiers WOFF et WOFF2 sont des polices TrueType ou OpenType compressées (un fichier WOFF2 fait souvent la moitié de la taille de son équivalent TrueType, ce qui réduit le paquet de l'application et les téléchargements sur le web) : NSH les lit comme les polices qu'ils contiennent, sur toutes les plateformes :

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` et l'import TSX `Pacifico` sont la chaîne `"Pacifico"` : le nom de famille stocké dans le fichier de police (son nom de famille typographique, ou à défaut son nom de famille), et non le nom du fichier. Utiliser la valeur de l'asset plutôt que d'écrire le nom à la main garde les deux synchronisés ; un fichier manquant ou corrompu fait échouer la compilation Rust, et un fichier importé est assuré d'être inclus dans le bundle.

Les fichiers sont livrés avec l'application comme tout autre [asset](./images-and-assets.md). Les polices sont enregistrées uniquement pour le processus de l'application ; elles ne sont pas installées sur l'appareil.

> [!WARNING]
> En TSX, un import dont la valeur n'est jamais utilisée est supprimé par l'élision des imports de TypeScript, et la police avec lui. Si vous ne faites référence à une famille que par son nom (par exemple dans le thème Tailwind), importez le fichier pour son effet de bord : `import "./fonts/Inter-Bold.ttf";`. Un crate Rust livre chaque fichier de `assets/` via `assets!()`.

<a id="fallback-lists"></a>

## Listes de repli

`fontFamily` accepte une liste, comme CSS : des familles séparées par des virgules, la plus préférée en premier, un nom contenant des espaces pouvant être entre guillemets ou non (`"Brand, 'Noto Sans SC', sans-serif"`), un nom entre guillemets conservant ses virgules (`'ACME, Inc'`). Le texte est composé dans la première famille que la plateforme possède, et un caractère qui manque à cette famille (une autre écriture, un symbole) provient de la famille suivante de la liste qui le possède, puis des polices de repli du système. Une liste permet à une police de marque qui ne couvre que le latin d'afficher le chinois dans une police assortie, ou de nommer une police que l'application télécharge en indiquant une police système à afficher jusqu'à son arrivée :

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Chaque plateforme conserve l'ordre de la liste avec sa propre mécanique de polices : une liste de cascade sur iOS et macOS, un repli de police sur Windows (un par paragraphe : la liste de son premier style), une liste de familles Pango sur Linux, celle du navigateur sur le web, les replis de GPUI. Sur Android, le texte est composé dans la première famille disponible ; lorsque celle-ci est une police que l'application enregistre, les polices enregistrées qui la suivent dans la liste sont ses polices de repli (Android 10 et versions ultérieures).

<a id="weights-and-italics"></a>

## Graisses et italiques

Une famille se compose généralement de plusieurs fichiers, un par graisse et par style. Livrez chacun d'eux (placez-les dans `assets/` en Rust, importez chacun en TSX) ; ils sont enregistrés sous le même nom de famille, et la graisse et le style choisissent la face :

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Lorsqu'aucune face enregistrée n'a exactement la graisse demandée, la plus proche est utilisée. Les plateformes diffèrent lorsqu'une face est absente :

| | iOS | Android |
|---|---|---|
| Graisse sans face correspondante | La face enregistrée la plus proche | La face la plus proche, avec le gras synthétique d'Android lorsqu'il s'applique |
| Italique sans face italique | La face droite (sans inclinaison) | Une version inclinée de la face droite |

Livrez les faces que vous utilisez pour obtenir le même résultat sur les deux.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Polices dans les styles typés et les classes Tailwind

En Rust, `.font_family(..)` accepte la famille de l'asset partout où un style est attendu, et les méthodes de graisse (`.font_weight(FontWeight::SEMIBOLD)`) sélectionnent les faces. Pour les classes, nommez vos familles dans le thème Tailwind sous `nsh.json` afin de les utiliser comme classes `font-*` :

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Une famille arbitraire fonctionne sans entrée dans le thème : `font-[Pacifico]`. Les classes de graisse (`font-light`, `font-semibold`, `font-bold`, ...) sélectionnent les faces comme le fait `fontWeight`. Les styles de texte appliqués à une vue se transmettent aux textes qu'elle contient : `.font_family(INTER.family)` sur une vue, ou `<View class="font-body">`, définit donc la famille pour tout un écran.

<a id="a-default-font-for-the-app"></a>

## Une police par défaut pour l'application

Le `font-sans` du thème est la police de l'application : tout texte qui ne définit pas sa propre famille est dessiné avec elle, dans les composants Rust comme en TSX, comme l'est une page web avec le `--font-sans` de Tailwind. `font-mono` est la police à chasse fixe, celle de la classe `font-mono` et du code dans `TextView`. Définissez-les dans le thème de l'application (`"theme"` dans `nsh.json`, [Rust](./rust.md#theme)) et livrez les fichiers de police comme ci-dessus :

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

La première famille de la liste qui n'est pas générique est la police ; une première famille générique (`system-ui`, `sans-serif`) correspond à la police système. La police peut aussi être définie sur un conteneur : les textes qu'il contient en héritent.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Fonctionnalités de police

`fontVariant` active des fonctionnalités OpenType de la police : `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` et `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... en Rust ; [Text](./text.md#text-styles)). La police doit les contenir ; les polices système les contiennent.

<a id="related"></a>

## Voir aussi

- [Text](./text.md) : styles de texte, tailles et réglage de taille de texte du système.
- [Tailwind](./tailwind.md#theme) : les clés du thème.
- [Images et assets](./images-and-assets.md) : comment les fichiers de l'application sont livrés.
