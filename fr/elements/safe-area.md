---
title: "Safe area"
description: "Les variables d'environnement safe-area-inset et les accesseurs safeArea et safeAreaInsets : un contenu qui reste à l'écart de l'encoche, de la barre d'état, de l'indicateur d'accueil et des en-têtes."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# Zone de sécurité

La zone de sécurité (safe area) garde le contenu à l'écart de l'encoche ou de la Dynamic Island, de la barre d'état, de l'indicateur d'accueil, d'un en-tête de navigation et de la barre de titre de Mac Catalyst. Toute vue peut s'en servir pour son remplissage grâce aux `env()` de CSS :
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` et
`env(safe-area-inset-left)`, dans son padding ou sa marge. Ce sont les marges internes (insets) de la vue racine dans laquelle le nœud est rendu :
dans une [NavPage](./nav-stack.md), les insets situés sous l'en-tête de la page ; dans un [Dialog](./dialog.md), les
insets du dialogue ; ailleurs, la zone de sécurité de la surface. Dans un navigateur, la page est la racine, et les variables sont celles du
navigateur lui-même.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

La couleur d'arrière-plan remplit toute la zone, y compris la zone située derrière la barre d'état, et le contenu commence en dessous. Les valeurs suivent les insets : lors d'une rotation, ou dans une autre page ou un autre dialogue, le remplissage est mis à jour nativement.

<a id="values"></a>

## Valeurs

| Valeur | Exemple | Signification |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | L'inset. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | L'inset ; la longueur remplace un nom inconnu, comme en CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | L'inset plus une longueur, pour un contenu qui conserve son propre espacement. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | Identique. |

Elles s'appliquent à `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` et aux mêmes clés `margin`. Dans Tailwind, ce sont des valeurs arbitraires des utilitaires `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` et `m` (les espaces peuvent être omis) : `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. Le type TypeScript de ces valeurs est `EnvValue`. Voir
[la référence des styles](../modules/style-reference.md).

En Rust, les méthodes `Styled` les définissent : `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, les mêmes méthodes `m`, ainsi que `.pt_safe_area_plus(px(16.0))`
(et `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) pour un inset plus une longueur.

<a id="choosing-the-edges"></a>

## Choisir les bords

Ne remplissez que les bords qui en ont besoin, par exemple lorsqu'une barre d'onglets ou une barre inférieure personnalisée gère elle-même l'inset du bas :

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## Quand l'utiliser

Une [NavPage](./nav-stack.md) avec un en-tête visible et opaque place déjà son contenu sous l'en-tête ; l'inset du haut y vaut donc 0. Les insets de la zone de sécurité servent pour :

- la racine d'une application sans pile de navigation,
- une page avec `headerVisible={false}` ou `headerTransparent`,
- le contenu d'un [Dialog](./dialog.md) plein écran,
- vos propres barres situées aux bords de l'écran.

<a id="safearea-and-safeareainsets"></a>

## safeArea et safeAreaInsets

Lorsque vous avez besoin des valeurs numériques dans le code, lisez-les directement. Les deux accesseurs TSX proviennent de `nsh`, renvoient un objet `Edges`
(`{ top, right, bottom, left }` en points) et sont réactifs : le code qui les lit est réexécuté lorsqu'ils changent, par
exemple lors d'une rotation.

| TSX | Rust | Renvoie |
|---|---|---|
| `safeArea()` | `safe_area()` | La zone de sécurité de la surface : les parties dégagées de l'interface système (encoche, indicateur d'accueil, barre de titre). |
| `safeAreaInsets()` | `cx.insets()` | Les insets à l'endroit où le composant est rendu : ceux de la page la plus proche (sous son en-tête), du dialogue le plus proche, ou à défaut la zone de sécurité de la surface. Ce sont les valeurs des variables `safe-area-inset-*`. En TSX, appelez-le dans un composant ; il renvoie un accesseur. Un composant Rust de votre crate les lit avec `cx.insets()`. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

Pour un remplissage selon l'inset lui-même, `env()` est la forme la plus simple : il est mis à jour nativement, sans exécuter de code.

<a id="platform-notes"></a>

## Notes par plateforme

- **iOS** : les insets proviennent de la safe area d'UIKit : la barre d'état, l'encoche ou la Dynamic Island, et l'indicateur d'accueil.
- **Android** : NSH signale les parties des barres système et de la découpe d'écran (display cutout) qui chevauchent la vue NSH. Lorsque NSH est
  [intégré](../docs/android.md) sous une barre d'outils native, l'inset du haut de la vue vaut 0.
- **Mac Catalyst** : l'inset du haut correspond à la barre de titre de la fenêtre.
- **Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web** : le contenu d'une page commence sous son `header`, et un dialogue
  donne à son contenu ses propres insets, comme sur les téléphones.

<a id="related"></a>

## Voir aussi

- [Clavier](./keyboard.md) : `env(keyboard-inset-height)`, contenu maintenu au-dessus du clavier logiciel.
- [Appareil et environnement](../docs/device-and-environment.md) : la zone de sécurité parmi les autres valeurs de l'appareil.
