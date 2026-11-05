---
title: "Appareil et environnement"
description: "Lecture de la taille de la fenêtre, du jeu de couleurs, de l'échelle de police, des zones de sécurité, de la plateforme, de la densité de pixels et du sens de mise en page, et réaction lorsqu'ils changent."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# Appareil et environnement

L'environnement dans lequel s'exécute une application change pendant son exécution : la fenêtre est redimensionnée (rotation, vue partagée, fenêtre Mac), l'utilisateur passe en mode sombre ou choisit une taille de texte plus grande, le clavier apparaît et disparaît. NSH expose chacun de ces changements sous forme d'**accesseur réactif** : appelez-le comme un signal, et tout ce qui l'a lu (un style, un texte, une valeur calculée) se met à jour quand il change. Il n'y a aucun écouteur à ajouter ni à retirer.

En Rust, les accesseurs sont des fonctions de `nsh_core::prelude` ; en TSX, ils proviennent des modules indiqués.

| Rust | TSX | Valeur |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | La largeur et la hauteur de la surface, en points. |
| `dark()` | `colorScheme()` (`nsh`) | Sombre ou clair : celui du système, ou celui propre à l'application (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | La taille de texte préférée de l'utilisateur par rapport à la valeur par défaut (1 correspond à la valeur par défaut). |
| `safe_area()` | `safeArea()` (`nsh`) | Les marges de la surface non couvertes par l'interface système : haut, droite, bas, gauche. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Les marges à l'endroit où s'affiche le composant appelant (une page, une boîte de dialogue). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | La hauteur du clavier logiciel et la durée de son animation. |
| `locale()` | `locale()` (`nsh`) | La locale de l'utilisateur sous forme de balise BCP 47 (`"en-US"`, `"zh-Hans-CN"`) : celle pour laquelle `Intl` formate par défaut. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Indique si l'application est utilisée : `active`, `inactive` (visible sans le focus) ou `background` ([En arrière-plan](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | Voir [Accessibilité](./accessibility.md). |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## Taille de la fenêtre et mise en page adaptative

`window()` (TSX : `windowSize()`) est la taille de la surface dans laquelle NSH effectue son rendu : l'écran sur un téléphone, la fenêtre sur un iPad en vue partagée ou sur un Mac, la vue hôte quand NSH est intégré. Utilisez-la pour modifier la mise en page, pas seulement les tailles :

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

Souvent, flexbox, les pourcentages et `aspect_ratio` (`aspectRatio`) suffisent, sans lire la taille du tout ; voir [Mise en page](./layout.md). En Rust, `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` change de style selon la largeur ; en TSX avec Tailwind, les variantes de point de rupture (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) et `portrait:` / `landscape:` suivent aussi la fenêtre : `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## Mode sombre

L'apparence suit celle du système, sauf si l'application définit la sienne. En Rust, la façon la plus simple de prendre en charge le mode sombre est une couleur avec une valeur claire et une valeur sombre, `AdaptiveColor::rgb(light, dark)` : elle bascule nativement quand l'apparence change, sans rien à exécuter. En TSX, il s'agit de la variante Tailwind `dark:`, qui s'applique lorsque `colorScheme()` vaut `"dark"` :

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

Pour tout le reste, lisez `dark()` (TSX : `colorScheme()`) dans une fermeture ou une valeur calculée ; en TSX, au-delà de quelques couleurs, dérivez une palette une seule fois :

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Les composants Rust tirent aussi leurs couleurs du thème, qui possède des valeurs claires et sombres (`nsh.json` `"theme"`, voir [Développer avec Rust](./rust.md)), et changent donc eux aussi avec le système. Pour accorder la barre d'état à votre arrière-plan, donnez à vos pages et boîtes de dialogue un [`statusBar`](../modules/nsh-base.md#status-bar), ou à l'application un dans `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Une application avec sa propre apparence

Une application toujours sombre (ou toujours claire) le déclare dans `nsh.json`, et `dark()` et `colorScheme()`, les couleurs adaptatives, les classes `dark:`, le thème, le style par défaut de la barre d'état et les alertes la suivent dès la première image (les applications packagées se lancent aussi avec cette apparence) :

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX : `setColorScheme` depuis `nsh`) la modifie à l'exécution, pour un réglage d'apparence propre à l'application ; `Appearance::System` (`"system"`) suit de nouveau le système :

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> Testez les deux apparences pendant le développement : `xcrun simctl ui booted appearance dark` bascule un simulateur iOS, et Android propose un bouton de thème sombre dans les Réglages rapides. Le changement parvient immédiatement à votre application, sans rechargement.

<a id="text-size"></a>

## Taille du texte

`font_scale()` (TSX : `fontScale()`) est le réglage de taille de texte de l'utilisateur (Dynamic Type sur iOS, taille de police sur Android) par rapport à la valeur par défaut. Les textes et les champs de saisie le suivent d'eux-mêmes : `fontSize: 16` s'affiche plus grand lorsque l'utilisateur a demandé un texte plus grand. Pour chaque élément, vous pouvez désactiver ce comportement ou le plafonner :

| Rust (sur `text` et `input`) | TSX (sur `<Text>` et `<Input>`) | Défaut | Description |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Suivre la taille de texte du système. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (aucun) | L'échelle maximale appliquée à ce texte. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Lisez `font_scale()` pour adapter une mise en page qui ne suit pas automatiquement le texte, par exemple pour passer d'une ligne à une colonne quand le texte devient grand : `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` en Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` en TSX.

La taille du texte met à l'échelle le texte : tous les textes et champs de saisie qui autorisent la mise à l'échelle de la police, ainsi que les alertes et les toasts de la plateforme. Les longueurs gardent leur taille : espacements, largeurs et hauteurs, rayons de coins, bordures et images, en points ou en classes (`p-4`, `rounded-lg`, `w-[2rem]`). Les boîtes dimensionnées par leur contenu grandissent avec leur texte.

<a id="language-and-region"></a>

## Langue et région

`locale()` est la locale de l'utilisateur, sous forme de balise BCP 47 (`locale().as_str()` en Rust). En TSX, `Intl` formate par défaut les nombres et les dates pour cette locale, de sorte que `new Intl.NumberFormat().format(1234.5)` donne `1,234.5` en `en-US` et `1.234,5` en `de-DE`. Lisez `locale()` pour choisir les chaînes de vos propres traductions : les textes qui la lisent se mettent à jour quand elle change.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## Dans une application hôte

Une application affichée à l'intérieur d'une application native suit les réglages propres à cette dernière lorsqu'elle en définit : la locale et la taille de texte des API d'intégration (`AppView::set_locale` et `set_font_scale` en Rust sur [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) et [Windows](./windows.md), `locale` et `fontScale` en Swift sur [iOS](./ios.md), `setLocale` et `setFontScale` en Java sur [Android](./android.md)) remplacent la langue et la taille de texte du système. `locale()`, `Intl`, `fontScale()` et les textes les suivent immédiatement, comme ils suivent un changement du système, et ceux du système reviennent lorsque l'application hôte les efface. Utilisez-les lorsque l'application native permet à ses utilisateurs de choisir une langue ou une taille de texte qui lui est propre.

<a id="in-the-background"></a>

## En arrière-plan

`lifecycle()` (identique en TSX) indique si l'utilisateur utilise l'application. Elle vaut `active` au premier plan, `inactive` tant que l'application reste visible mais qu'une autre application ou fenêtre a le focus (ou que le système affiche quelque chose par-dessus : le sélecteur d'applications, un appel entrant), et `background` lorsqu'elle n'est pas visible : en arrière-plan sur un téléphone, réduite sur un ordinateur de bureau, onglet masqué sur le web. Comme tout accesseur, elle met à jour ce qui la lit, de sorte qu'un effet met en pause un flux en direct, une interrogation périodique ou une vidéo en arrière-plan, et les reprend quand l'utilisateur revient :

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

Utilisez `background` pour mettre le travail en pause, et enregistrez ce que l'utilisateur modifie au fur et à mesure : le système peut suspendre une application quelques secondes après son passage en arrière-plan, avant qu'un effet lisant ce changement ait pu s'exécuter. Une application affichée à l'intérieur d'une application native suit l'état de celle-ci, et lorsqu'une application possède plusieurs fenêtres (un iPad, un ordinateur de bureau), une vue suit la fenêtre dans laquelle elle se trouve. Dans les tests, `app.setLifecycle("background")` de `nsh/test` y place l'application ([Tests](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## Zones de sécurité

Les encoches, l'indicateur d'accueil, la barre d'état, la barre de navigation d'Android et la barre de titre de Mac Catalyst recouvrent des parties de la surface. Les applications NSH dessinent d'un bord à l'autre sur toutes les plateformes, et obtiennent les parties recouvertes sous forme de marges.

- `safe_area()` (TSX : `safeArea()`) donne les marges de la surface.
- `cx.insets()` d'un composant (TSX : `safeAreaInsets()`) donne les marges **à l'endroit où le composant s'affiche** : à l'intérieur d'une [page](./navigation.md#safe-areas-under-the-header) de navigation, elles sont mesurées sous son en-tête ; à l'intérieur d'une [boîte de dialogue](../elements/dialog.md), ce sont celles de la boîte. Préférez-le dans les composants susceptibles d'être affichés à plusieurs endroits.
- `env(safe-area-inset-top)`, `-right`, `-bottom` et `-left` en CSS ajoutent un remplissage ou un espacement à n'importe quelle vue selon les marges de l'endroit où elle s'affiche, dans `padding*` et `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` ajoute une longueur ; Tailwind `pt-[env(safe-area-inset-top)]` ; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). Le remplissage se met à jour nativement quand les marges changent ([Zone de sécurité](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

Sur Android, une vue intégrée sous une barre d'outils ne reçoit que les parties des barres système qui la recouvrent, comme la zone de sécurité d'UIKit : aucune marge en haut si elle n'atteint pas la barre d'état.

<a id="the-platform"></a>

## La plateforme

`os()`, `os_version()`, `idiom()`, `is_desktop()` et `is_catalyst()` en Rust, ainsi que la constante `platform` de `nsh` en TSX, décrivent l'environnement où s'exécute l'application. Ils restent constants pendant l'exécution.

| Rust | TSX | Description |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` ou `Os::Web` (`os().name()` est la chaîne de TSX). Mac Catalyst est iOS. |
| `os_version()` | `platform.version` | Versions majeure et mineure ; sur Android, le niveau d'API et 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` ou `Desktop` ; `Desktop` exactement là où `is_desktop()` est vrai. |
| `is_desktop()` | `platform.desktop` | macOS, Windows ou Linux, ou un navigateur de bureau ([Bureau et mobile](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, dans l'un ou l'autre de ses idiomes. |

`platform` de TSX en détail :

| Membre | Description |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` ou `"web"`. Mac Catalyst renvoie `"ios"`. |
| `platform.version` | Une chaîne : sur iOS et les ordinateurs de bureau, la version de l'OS (`"17.5"`) ; sur Android, le niveau d'API (`"35"`) ; sur le web, `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` ou `"desktop"`. `"desktop"` exactement là où `platform.desktop` vaut `true`. `"mac"` est l'idiome Mac d'UIKit sous Mac Catalyst, un idiome mobile. |
| `platform.desktop` | Le comportement de bureau s'applique : macOS, Windows, Linux et navigateurs de bureau. Les props `desktop={{…}}` et `platform.select({ desktop })` le suivent. |
| `platform.catalyst` | L'application s'exécute sous Mac Catalyst (`os` `"ios"`), dans l'idiome Mac ou iPad. |
| `platform.select(spec)` | La valeur pour cette plateforme ; voir [Code spécifique à la plateforme](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` s'exécute sans interface graphique en tant qu'iOS.

Sur [Linux](./linux.md), `platform.os` vaut `"linux"`, l'idiome `"desktop"` et `platform.version` les versions majeure et mineure du noyau (`"6.12"`) : les distributions numérotent leurs versions de façons qui ne sont pas comparables. Là, la zone de sécurité et la hauteur du clavier valent 0, `colorScheme()` suit en direct le réglage du bureau (le portail de réglages XDG), `fontScale()` la mise à l'échelle du texte du bureau et `pixelRatio()` l'échelle de l'écran, y compris les échelles fractionnaires.

Sur [macOS](./macos.md) (le backend AppKit), `platform.os` vaut `"macos"`, l'idiome `"desktop"` et `platform.version` la version de macOS. La zone de sécurité et la hauteur du clavier valent 0, `colorScheme()` suit en direct l'apparence du système, `fontScale()` vaut 1 et `pixelRatio()` l'échelle de rendu de l'écran.

Sur [Windows](./windows.md), `platform.os` vaut `"windows"`, l'idiome `"desktop"` et `platform.version` `"10.0"`, y compris sous Windows 11 (Windows a conservé le numéro de version). La zone de sécurité et la hauteur du clavier valent 0, `colorScheme()` suit en direct Paramètres > Personnalisation > Couleurs, `fontScale()` le réglage Taille du texte (de 1 à 2,25), `reduceMotion()` le réglage des effets d'animation, `pixelRatio()` l'échelle du moniteur, et `Intl` formate selon le format régional de l'utilisateur.

Dans un navigateur ([le runtime web](./web.md)), `platform.os` vaut `"web"` et `platform.version` `"0.0"`. L'idiome est `"desktop"` avec une souris et une fenêtre d'au moins 600 points de large, `"pad"` sur une tablette et `"phone"` sur un téléphone, déterminé au démarrage de l'application. La locale, `reduceMotion()`, `fontScale()` (la taille de texte du navigateur), `pixelRatio()`, la zone de sécurité et la hauteur du clavier proviennent du navigateur et le suivent en direct.

<a id="pixel-density"></a>

## Densité de pixels

`pixel_ratio()` et `round_to_nearest_pixel(points)` en Rust, ainsi que `pixelRatio()` de `nsh` en TSX, convertissent entre points et pixels de l'appareil.

| Rust | TSX | Description |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Pixels de l'appareil par point (2 ou 3 sur la plupart des téléphones), réactif. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Points arrondis au pixel de l'appareil le plus proche. |

Un filet fin, d'un pixel de l'appareil de hauteur :

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` et `pixelRatio()` sont réactifs, de sorte qu'un filet fin suit une fenêtre déplacée vers un écran de densité différente.

<a id="right-to-left"></a>

## De droite à gauche

Lorsque la langue de l'appareil s'écrit de droite à gauche (arabe, hébreu, persan, ...), NSH dispose l'application de droite à gauche : les lignes partent de la droite, les propriétés de style logiques prennent leurs côtés de droite à gauche, le texte s'aligne à droite et les widgets natifs sont inversés. La direction de la mise en page suit d'elle-même la langue de l'utilisateur. Le style `direction` d'une vue (`"ltr"`, `"rtl"` ou `"inherit"` ; `.direction(LayoutDirection::..)` en Rust) définit la direction de son sous-arbre ; sur la vue racine, il définit celle de l'application.

Les changements s'appliquent immédiatement, sans redémarrer l'application ; la démo de cette page bascule le style `direction`.

Écrivez des mises en page qui fonctionnent dans les deux sens avec les propriétés logiques : en Rust `ms` / `me` et `ps` / `pe` (les noms de Tailwind), en TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` et ainsi de suite, qui signifient gauche et droite dans les mises en page de gauche à droite, et l'inverse de droite à gauche. `left` et `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) conservent leurs côtés dans les deux cas, comme en CSS. Le style `direction` (`"inherit"`, `"ltr"`, `"rtl"`) remplace la direction pour un sous-arbre, par exemple pour garder un numéro de téléphone ou les commandes d'un lecteur multimédia de gauche à droite. Les variantes Tailwind `rtl:` et `ltr:` s'appliquent selon la direction.

Les vues de défilement horizontal et les listes commencent à l'extrémité droite dans les mises en page de droite à gauche. Sur Android, l'application hôte doit déclarer `android:supportsRtl="true"` dans son manifeste pour que les widgets natifs soient inversés.

<a id="related"></a>

## Voir aussi

- [L'API d'appareil de `nsh`](../modules/nsh.md#device) : la référence.
- [Code spécifique à la plateforme](./platform-specific.md) : `platform.select`, props et modules de plateforme.
- [Accessibilité](./accessibility.md) : lecteurs d'écran et réduction des animations.
- [Zone de sécurité](../elements/safe-area.md), [Clavier](../elements/keyboard.md) et [la barre d'état](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md) : `dark:`, variantes de point de rupture et d'orientation.
