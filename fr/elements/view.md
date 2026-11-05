---
title: "View"
description: "L'élément conteneur de base : mise en page, arrière-plans, bordures, ombres, gestion des appuis et gestes."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` est la brique de base de chaque écran : un conteneur natif (une UIView sur iOS et Mac Catalyst, un ViewGroup sur
Android) qui dispose ses enfants avec flexbox ou grid, dessine un fond, des bordures, des ombres et des dégradés, et gère
les appuis. Les boutons, les cartes, les lignes et les écrans sont tous des vues. Rust en crée une avec `view()`, TSX avec `<View>` depuis `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

<a id="layout"></a>

## Disposition

Une vue dispose ses enfants avec flexbox, avec ces valeurs par défaut : `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` en Rust) bascule vers CSS grid et
`display: "block"` vers la disposition en bloc. Les tailles sont en points. Voir [layout](../docs/layout.md) et la
[référence des styles](../modules/style-reference.md).

`display: "flex"` suit CSS : dans un style, comme classe `flex` et comme `.flex()` de Rust, c'est une ligne sauf si une direction est
définie (`flexDirection: "column"`, `flex-col`, `.flex_col()`). Une vue qui ne définit pas de display empile ses enfants en colonne.

## Props

`View` a une seule prop qui lui est propre, `selectable` (`.selectable(true)` en Rust) : les textes à l'intérieur de la vue se sélectionnent ensemble, comme une seule sélection ([Sélection de texte](./text-selection.md)). Les autres sont les [props communes](./index.md#common-props) : ses styles (`style`, `class`,
`classList` ; les méthodes `Styled` en Rust), `disabled`, les props d'appui (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), les styles d'état (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, les
props de gestes (`pan`, `pinch`, `rotation` et leurs événements), les props de toucher et de responder, les props d'accessibilité
et `ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## Vues sélectionnables

Avec `selectable`, une sélection traverse les éléments [`Text`](./text.md) et les [`TextView`](./text-view.md) à l'intérieur de
la vue, dans l'ordre de lecture ; les textes avec `selectable={false}` en sont exclus, et une vue sélectionnable placée dans une autre fait partie de
la vue extérieure. Voir [Sélection de texte](./text-selection.md) pour les gestes sur chaque plateforme.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## Retour visuel à l'appui

Une vue pressable est toute vue dotée d'un gestionnaire d'appui. Son retour visuel est défini par l'app : un style appliqué pendant l'appui, de façon native
tant que le doigt est posé, sans aller-retour avec le code de l'app. `hoverStyle`, `focusStyle` et `disabledStyle` font de même
pour les autres états :

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

Sur Android, `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` en Rust) ajoute l'effet de vague
material (`borderless`, `radius` et `foreground` l'ajustent).

`disabled` retire les écouteurs d'appui de la vue native (pas d'appui, pas de retour visuel) et applique les styles désactivés :

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

<a id="events"></a>

## Événements

| Événement | Rust | Données | Quand |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (aucune en Rust) | Un tap s'est terminé à l'intérieur de la vue. |
| `onLongPress` | `.on_long_press` | `PressEvent` (aucune en Rust) | Le doigt est resté posé pendant `delayLongPress` (500 ms). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (aucune en Rust) | Un doigt s'est posé / s'est levé ou a quitté la vue. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | La souris est entrée sur la vue (ou sur une vue à l'intérieur) / l'a quittée ou a quitté la fenêtre ([survol](./index.md#hover)) ; celui de `onMouseLeave` est l'endroit où elle se trouvait en dernier. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | La souris s'est déplacée sur la vue (ou sur une vue à l'intérieur), avec ou sans bouton enfoncé, ou une touche de modification a été pressée ou relâchée alors qu'elle y repose sans bouton enfoncé : `position`, `pagePosition` (`Point`s), `modifiers` et `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` ou `null`) ; au plus une fois par frame. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | Le bouton secondaire a été pressé sur la vue ([menus contextuels](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | aucune | Un glissement de fichiers locaux est entré dans / a quitté la destination desktop active. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | Des fichiers ou dossiers locaux ont été déposés sur la destination desktop. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | Le cadre relatif au parent a changé. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Un glissement lié avec `pan` a commencé / s'est terminé ; `cancelled` vaut true lorsque le système l'annule. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Un pincement lié avec `pinch` a commencé / s'est terminé. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Une rotation liée avec `rotation` a commencé / s'est terminée. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | Une action d'accessibilité personnalisée a été exécutée. |

Pour les événements de toucher et de responder, voir les [props communes](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## Dépôt de fichiers sur desktop

Sur AppKit, GTK, Win32 et GPUI, une vue avec `onFileDrop` reçoit les fichiers et dossiers locaux glissés depuis une autre
application. `onFileDragEnter` et `onFileDragLeave` suivent la destination active ; `onFileDrop` reçoit
`{ uris: string[] }` dans l'ordre de la liste de fichiers native. Chaque entrée est une URL `file:` absolue, avec les espaces et les
caractères non ASCII échappés. Analysez l'URL pour obtenir un chemin du système de fichiers plutôt que de retirer le préfixe à la main.

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

L'ancêtre actif le plus proche qui écoute `onFileDrop` reçoit le dépôt. Une racine modale borne cette recherche. `disabled`
retire les écouteurs de glisser-déposer de fichiers ; la sortie, l'annulation, l'achèvement et le retrait de la destination effacent l'état actif.
L'acceptation utilise l'opération Copy et l'état natif monté. C'est l'app qui décide de lire, d'ouvrir ou de transférer les
fichiers reçus.

<a id="ref-methods"></a>

## Méthodes de ref

La ref d'une vue simple est un `ViewRef` : `focus()`, `blur()` et `measure()`. `ref` (`.element_ref(&handle)` en Rust) vous donne son nœud, par exemple pour le passer à
`setAccessibilityFocus` ([l'API d'accessibilité de `nsh`](../modules/nsh.md#accessibility)), ou pour la mesurer
(`handle.measure()` en Rust).

<a id="views-inside-text"></a>

## Vues dans un texte

Une vue placée dans un texte est une pièce jointe en ligne : elle se place sur la ligne de base, passe à la ligne avec les mots et reçoit
ses propres appuis. Voir [text](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## Notes par plateforme

- `boxShadow` est dessinée sur toutes les plateformes ; `android={{ elevation }}` donne à la place l'ombre material d'Android. Sur Android, une ombre nécessite une
  couleur de fond (une vue au fond transparent n'en projette aucune).
- `filter` sur les vues : iOS prend en charge `opacity()`, `brightness()` jusqu'à 1 et `drop-shadow()` (les images acceptent tous les filtres de couleur
  et `blur()`) ; Android les prend tous en charge à partir de l'API 31, et les filtres de couleur en dessous.
- `backdropFilter: "blur(…)"` est un matériau système sur iOS (une approximation) et nécessite l'API 31 sur Android.
- Android dessine les transformations `translate`, `scale` et `rotate` ; les inclinaisons (`skew()`, `skewX()`, `skewY()`) s'appliquent sur les autres plateformes.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) dessine des coins qui s'adoucissent vers les bords (comme
  les icônes d'app iOS), sur les deux plateformes.
- Le style `cursor` s'applique là où il y a un pointeur (Mac Catalyst, iPad avec pointeur, desktops).
