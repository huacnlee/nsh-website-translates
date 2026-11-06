---
title: "Dialog"
description: "Le composant Dialog : une surface modale placée au-dessus de tout le reste, pour les flux en plein écran, les feuilles et les boîtes de dialogue stylisées par l'application."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Un dialog présente du contenu par-dessus le reste de l'app dans sa propre couche de fenêtre native : un view controller présenté sur iOS et Mac Catalyst, un Dialog sur Android, une couche au-dessus de toute la fenêtre sur les desktops et le web. Il sert aux parcours plein écran, aux sheets et aux boîtes de dialogue. Les gestes propres au système (glisser une sheet vers le bas, le bouton retour d'Android, Escape) fonctionnent et sont gérés nativement. En Rust, on en crée un avec `nsh_base::dialog()`, en TSX avec `<Dialog>` depuis `nsh/base`.

Le dialog gère son comportement et laisse son apparence à l'app : ses styles stylent la popup (la vue qui contient les enfants), et en TSX `backdropClass` / `backdropStyle` ajoutent un fond derrière elle.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

En TSX, le dialog est affiché tant que `open` n'est pas `false` et fermé lorsqu'il devient `false`. En Rust, il est présenté tant qu'il est dans la vue et retiré lorsqu'il la quitte, c'est pourquoi `when` le conserve. Dans les deux cas, il transmet à son contenu les insets de zone sûre du dialog, que lisent les variables [`env(safe-area-inset-*)`](./safe-area.md) et `safeAreaInsets()` (`cx.insets()` dans un composant Rust) à l'intérieur. [`Button`](./button.md), également issu de `nsh/base`, est une cible de pression stylée par l'app.

`nsh_core::prelude` possède aussi une ancienne fonction `dialog`, dépréciée : importez `nsh_base::dialog` par son nom, comme ci-dessus, et l'import explicite prend sa place. Pour l'alerte ou l'action sheet du système, utilisez [`AlertDialog`](./alert-dialog.md).

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | dans la vue tant qu'il est ouvert (`when(open, ..)`) | `boolean` | `true` | Affiché tant que la valeur est true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | La manière dont il entre et sort. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | aucun | Il entre et sort via un shader WGSL à la place de son `animation` : `shade(uv)` lit ce qui est derrière sous le nom `sample_from` et le dialog sous le nom `sample_to` pendant que `nsh.progress` va de 0 à 1 sur `duration` millisecondes (350 par défaut), puis de 1 à 0 à la fermeture. Lorsque le système demande moins de mouvement, il utilise son propre `animation`. Voir [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | Sa forme sur iOS : `fullScreen` couvre l'écran avec un fond transparent ; `pageSheet` et `formSheet` sont des sheets système qui laissent visible ce qui est derrière (`formSheet` est une sheet centrée plus petite sur les grands écrans). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape et le bouton retour d'Android le ferment nativement. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Un appui sur le fond le ferme. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Glisser une sheet vers le bas (iOS, navigateurs sur téléphone) la ferme nativement. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | aucun | iOS et Android : la barre d'état tant que le dialog est ouvert, par-dessus celle des pages ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Il a fini d'apparaître. |
| `onClose` | `.on_close(..)` | `() => void` | | Il a disparu : l'utilisateur l'a fermé, ou l'app l'a retiré. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | L'utilisateur a tenté de le fermer (Escape, retour, un appui sur le fond, un glissement vers le bas), que l'indicateur `closeOn*` l'ait autorisé ou non. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | L'utilisateur l'a fermé : gardez `open` synchronisé ici. En Rust, `on_cancel` retire le dialog de la vue. |
| `class`, `style` | méthodes `Styled` | `string`, `StyleProp<ViewStyle>` | | La popup : la vue qui contient les enfants. |
| `backdropClass`, `backdropStyle` | une vue enfant remplissant le dialog | `string`, `StyleProp<ViewStyle>` | | Un fond qui remplit le dialog derrière la popup, présent dès que l'un des deux est défini. |
| `children` | `.child(..)` | `JSX.Element` | | Le contenu. |

| Clé `ios` | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | celles du présentateur | Les orientations que le dialog autorise. |

| Clé `android` | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | Le contenu passe sous la barre d'état ; sinon il commence en dessous. |

<a id="opening-and-closing"></a>

## Ouverture et fermeture

L'état du dialog appartient à l'app. Lorsque l'utilisateur ferme le dialog (Escape, le bouton retour d'Android, un appui sur le fond, une sheet glissée vers le bas), celui-ci se ferme nativement et en informe l'app, qui met son état à jour en conséquence : `onOpenChange({ open: false, reason })` en TSX, `on_cancel` en Rust. En TSX, tant que `open` reste `true`, le dialog reste fermé, et il se rouvre lorsque `open` passe de `false` à `true`.

Chaque indicateur `closeOn*` est lu nativement au moment de l'action de l'utilisateur, car le thread principal n'attend jamais le code de l'app. Pour demander une confirmation avant la fermeture, mettez les indicateurs à `false` : la tentative appelle alors `onCancel`, et l'app ferme elle-même le dialog (en TSX en passant `open` à `false`, en Rust en le retirant de la vue) :

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` est appelé à chaque tentative, que les indicateurs autorisent la fermeture du dialog ou non.

<a id="a-dialog-with-a-backdrop"></a>

## Un dialog avec un fond

Un dialog avec la présentation `fullScreen` par défaut affiche ce que l'app dessine : ici un fond assombri et une carte centrée par-dessus. Un appui sur le fond le ferme :

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

Pour l'alerte ou l'action sheet du système, utilisez [`AlertDialog`](./alert-dialog.md) depuis `nsh/base`.

<a id="ref-methods"></a>

## Méthodes de ref

Aucune.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS et Mac Catalyst : `presentation` choisit la forme. `fullScreen` présente sur tout l'écran avec un fond transparent ; `pageSheet` et `formSheet` sont des sheets système avec le fond du système, qui suivent le doigt lorsqu'on les glisse vers le bas (`closeOnSwipe`).
- Android : le dialog remplit la fenêtre et affiche la popup et le fond de l'app. Le bouton retour s'adresse d'abord au dialog le plus haut, avant les stacks et les listeners `BackHandler`.
- Desktops (macOS, Windows, Linux, GPUI) et web : le dialog est une couche transparente au-dessus de toute la fenêtre, qui affiche la popup et le fond de l'app. Escape constitue une tentative de fermeture.
- `supportedOrientations` est propre à iOS ; `statusBarTranslucent` est propre à Android. Le contenu d'un dialog Android commence sous la barre d'état, sauf si `statusBarTranslucent` est défini.
