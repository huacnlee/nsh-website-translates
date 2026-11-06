---
title: "Code spécifique à la plateforme"
description: "Écrire une seule application pour les téléphones, les ordinateurs de bureau et les navigateurs - props propres à une plateforme dans ios={{}} / android={{}} / desktop={{}} / web={{}}, les modules nsh/mobile et nsh/desktop, platform.os et platform.select, et les variantes Tailwind par plateforme."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# Code spécifique à une plateforme

Un même bundle NSH s'exécute sur iOS, Android, macOS, Windows et Linux (et dans Mac Catalyst), et dans les navigateurs via le [runtime web](./web.md). La plus grande partie d'une application n'a besoin d'aucun test de plateforme : les éléments, les styles, la mise en page et les modules se comportent partout de la même façon, et les composants que vous construisez avec eux ont partout le même aspect. Lorsqu'un besoin est réellement propre à une plateforme, NSH lui donne un emplacement clair, afin que le code spécifique reste visible et circonscrit :

| Rust | TSX | Pour |
|---|---|---|
| [Méthodes de builder (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Les props que possède une seule plateforme. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | Les API propres aux plateformes mobiles ou aux bureaux. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Choisir des valeurs ou du code selon la plateforme. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [Classes `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Des styles par plateforme. |

<a id="desktop-and-mobile"></a>

## Bureau et mobile

Chaque plateforme est soit un bureau, soit un mobile, selon une règle unique. Les bureaux sont macOS, Windows, Linux, et les navigateurs dans l'idiome bureau (une souris et une fenêtre large, voir [le web](./web.md)). Les mobiles sont iOS, Android, et les navigateurs dans l'idiome téléphone ou tablette ; Mac Catalyst utilise le backend iOS, c'est donc aussi un mobile, avec les props `ios={{…}}`. Les props `desktop={{…}}`, `platform.select({ desktop, mobile })`, `platform.desktop` et `platform.idiom === "desktop"` suivent toutes cette règle, de même que les composants de `nsh/base` (un menu est une popup sur les bureaux et une feuille sur mobile) et, en Rust, `is_desktop()`.

Dans `nsh/desktop`, `isAvailable` répond à une question plus étroite : savoir si les API de fenêtre et de menu de ce module fonctionnent, ce qui est le cas sur macOS, Windows et Linux. Conditionnez la mise en page, la densité et la saisie à `platform.desktop`, et les appels de `Window` et de `Menu` à `isAvailable`.

<a id="platform-only-props"></a>

## Props propres à une plateforme

En Rust, une prop que possède une seule plateforme est une méthode de builder comme les autres (`.ripple(..)`, `.elevation(..)` pour Android, `.input_accessory(..)` pour iOS, `.window_drag(..)` pour les bureaux) ; les autres plateformes l'ignorent. En TSX, les props qui n'existent que sur une plateforme sont regroupées dans un objet portant son nom. Chaque élément accepte `ios`, `android`, `desktop` (macOS, Windows, Linux et les navigateurs dans l'idiome bureau) et `web` (les navigateurs) ; sur les autres plateformes l'objet est ignoré, et sur sa propre plateforme seules ses clés sont appliquées. Un navigateur de bureau applique à la fois `desktop` et `web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

Les objets TSX sont réactifs comme n'importe quelle prop ; une clé retirée de l'objet est effacée.

Ce qui existe aujourd'hui :

| Rust | TSX | Sur | Description |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | tout élément | L'effet d'ondulation material pendant l'appui : couleur, sans bordure, rayon, premier plan. |
| `.elevation(..)` | `android={{ elevation }}` | tout élément | L'ombre material, en points, à partir de la forme de la vue. |
| | `android={{ accessibilityLiveRegion }}` | tout élément | `"none"`, `"polite"` ou `"assertive"` : TalkBack annonce les changements de la vue. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | Le contenu de la boîte de dialogue s'étend sous la barre d'état. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | Le `InputAccessoryView` affiché au-dessus du clavier. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | Les noms iOS des types de saisie automatique (le `AutoFill` de Rust couvre les deux plateformes). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | Les orientations qu'il autorise. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Balayer pour reculer et avancer dans l'historique des pages. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | Le bouton de barre natif d'UIKit à la fin de l'en-tête, qui déclenche `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | Le bouton de barre natif d'UIKit au début de l'en-tête, qui déclenche `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | Le bouton de barre natif d'UIKit affichant un SF Symbol à la fin de l'en-tête, qui déclenche `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | Le bouton de barre natif d'UIKit affichant un SF Symbol au début de l'en-tête, qui déclenche `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS : les balayages à deux doigts sur le trackpad reculent et avancent dans l'historique des pages ; Windows : balayages sur écran tactile ; Linux : balayages sur pavé tactile. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | tout élément | Un appui dessus déplace la fenêtre, comme le ferait la barre de titre du système (voir [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

En TSX, `desktop={{…}}` et `web={{…}}` sont acceptés partout. Les types (`IOSProps`, `AndroidProps`, `DesktopProps` et leurs formes propres à chaque élément) indiquent à votre éditeur ce que prend chaque élément.

Ce qu'un élément signifie sur toutes les plateformes est une prop de premier niveau (en Rust, une méthode du même nom), appliquée là où elle a un sens : `NavPage` avec `title`, `headerStyle`, `headerLargeTitle` et `headerBackTitle` configure l'en-tête système d'iOS et d'Android, son emplacement `header` est l'en-tête des bureaux et du web, et `presentation` de `Dialog` choisit les feuilles d'iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` et les autres de `AlertDialog.show` fonctionnent sur toutes les plateformes. Une fonctionnalité système propre à une plateforme va dans son objet, et lorsque plusieurs plateformes la possèdent, dans chacun des leurs sous le même nom : `allowsBackForwardNavigationGestures` de `WebView`, les balayages système dans l'historique des pages, se trouve dans `ios={{…}}` et `desktop={{…}}`.

<a id="platform-modules"></a>

## Modules de plateforme

En Rust, les API que possède une seule plateforme sont des fonctions de `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) et de `nsh_core::element::desktop` (la fenêtre : `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window` ; les menus : `set_application_menu`, `popup_menu`) ; ailleurs, elles ne font rien. En TSX, `nsh/mobile` contient les API d'iOS et d'Android (certaines propres à une seule plateforme), `nsh/desktop` celles des bureaux. Les deux peuvent être importés sur toutes les plateformes, de sorte qu'un seul bundle s'exécute partout : sur les autres plateformes, leurs fonctions retournent immédiatement et leurs composants ne prennent aucune place. Chacun exporte `isAvailable`, qui vaut `true` sur ses propres plateformes ; `platform.os` permet de les distinguer.

### nsh/mobile

`isAvailable` vaut `true` sur iOS (avec Mac Catalyst) et Android. Les deux plateformes disposent de [`TabBar`](../modules/nsh-mobile.md#tabbar), la barre d'onglets du système.

#### BackHandler (Android)

| Rust | TSX | Description |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Écoute le bouton retour après les boîtes de dialogue, avant les piles ; retournez `true` lorsqu'il est traité. L'écouteur disparaît avec le composant (ou l'effet) qui l'a ajouté ; en TSX, l'appel retourne aussi une fonction qui l'arrête plus tôt. |
| | `BackHandler.exitApp()` | Quitte l'application. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

Le bouton retour est traité d'abord par la boîte de dialogue au sommet, puis par les écouteurs de retour (le plus récent en premier), puis par la pile de navigation au sommet, et l'application se ferme si personne ne l'a traité. Voir [Navigation](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Description |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Une barre au-dessus du clavier des champs de saisie qui désignent son identifiant natif (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

Voir [Formulaires et clavier](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Les applications Rust dessinent leurs propres barres de titre avec `nsh_core::element::desktop` ([Building with Rust](./rust.md#desktop-title-bars)). Le module de TSX :

| Export | Description |
|---|---|
| `Window` | La fenêtre : `setTitle`, `setTitleBar({ style: "hidden" })` pour une barre de titre propre à l'application, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | La hauteur de la barre de titre masquée et la place qu'occupent les contrôles de fenêtre du système (réactif). |
| `Menu` | `setApplicationMenu(items)` (la barre de menus, avec raccourcis) et `popup(items, at?)` (menus contextuels). |
| `isAvailable` | `true` là où les API de fenêtre et de menu fonctionnent : macOS, Windows et Linux. Les navigateurs de bureau ont `platform.desktop` et conservent la fenêtre et les menus du navigateur. |

Voir [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### La barre d'état

Sur les deux plateformes, la barre d'état appartient à la page ou à la boîte de dialogue au sommet, comme dans UIKit, où le view controller le plus haut en décide : [`NavPage` et `Dialog` acceptent `statusBar`](../modules/nsh-base.md#status-bar) (en Rust `.status_bar(StatusBarStyle::Light)`, ou un `StatusBarSetting` pour les autres champs) avec `foreground` (`"auto"`, `"light"` pour les fonds sombres, `"dark"` pour les fonds clairs), `hidden` et `animated`. La page ou la boîte de dialogue affichée en dernier l'emporte, champ par champ, et celle du dessous s'applique de nouveau lorsqu'elle disparaît. `"statusBar"` de `nsh.json` est la valeur par défaut de l'application en dessous d'elles.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

Dans une application intégrée à une application native, c'est le view controller de l'application hôte qui décide de la barre d'état sur iOS. Une application qui déclare `"capabilities"` dans `nsh.json` a besoin de `"statusBar": true` pour la modifier.

<a id="platformos-and-platformselect"></a>

## platform.os et platform.select

`os()` en Rust et la constante `platform` de `nsh` en TSX indiquent où l'application s'exécute : `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` ou `Os::Web`, et `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` ou `"web"` (Mac Catalyst est `"ios"`, avec `platform.catalyst` dans l'un ou l'autre de ses idiomes ; le [backend macOS](./macos.md) est `"macos"`, le [backend Linux](./linux.md) `"linux"` et le [backend Windows](./windows.md) `"windows"`, et leurs éléments appliquent leurs props `desktop` ; les [navigateurs](./web.md) sont `"web"`, et appliquent aussi les props `desktop` lorsque `platform.desktop` vaut `true`). Voir [Appareil et environnement](./device-and-environment.md#the-platform) pour la version, l'idiome et le reste.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

En Rust, un `match os()` choisit la valeur, avec `is_desktop()` pour les bureaux. En TSX, `platform.select(spec)` retourne la valeur correspondant à cette plateforme. Il cherche d'abord la clé propre à l'OS, puis `desktop` ou `mobile` selon [la règle ci-dessus](#desktop-and-mobile) (`platform.desktop`), puis `native` (toutes les plateformes sauf le web), puis `default` :

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

Il retourne `undefined` lorsque rien ne correspond et qu'il n'y a pas de `default`.

<a id="rendering-different-components"></a>

### Afficher des composants différents

Choisissez les composants de la même façon, au niveau du module (TSX) lorsque le choix ne change jamais :

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

ou en ligne avec [`when` / `<If>`](../elements/control-flow.md) :

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Variantes de plateforme dans Tailwind

Rust applique des styles par plateforme avec `.when(os() == Os::Ios, |v| ..)` ; en TSX, les variantes `ios:`, `android:` et `web:` appliquent des classes sur une seule plateforme :

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## Privilégier le comportement partagé

Avant de recourir à un test de plateforme, demandez-vous si la différence compte pour vos utilisateurs. Les éléments et les styles correspondent déjà au comportement natif de chaque plateforme là où il doit différer (physique du défilement, rendu du texte, claviers, accessibilité), tout en restant identiques là où les utilisateurs attendent de la cohérence (l'apparence propre à votre application). Réservez les tests de plateforme aux conventions de plateforme sur lesquelles les utilisateurs comptent : le bouton retour et les toasts d'Android, les feuilles et les grands titres d'iOS, les noms de saisie automatique, l'ondulation d'Android.

<a id="related"></a>

## Voir aussi

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) et [`BackHandler`](../modules/nsh-mobile.md#backhandler) : les références.
- [L'API d'appareil de `nsh`](../modules/nsh.md#device) : `platform`.
- [Composants natifs](./native-components.md) : utiliser les vues que votre application hôte fournit sur chaque plateforme.
- [Tailwind](./tailwind.md) : toutes les variantes.
