---
title: "Toast"
description: "Toast, ToastStack et ToastManager : des toasts sans style comme ceux de gpui-base, une racine sémantique avec un statut de transition, une pile qui dispose les toasts en couches, et leur cycle de vie headless."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

Les toasts sont de courts messages affichés pendant un moment au-dessus de l'app : « Copied », « Draft deleted · Undo », « Could not send ».
`nsh/base` fournit leur comportement en trois éléments sans style, comme le `gpui-base` de GPUI Kit :

- **`ToastManager`** garde les toasts en ordre avec leur cycle de vie : chacun est `"starting"`, puis `"present"` une fois que
  la durée de l'animation est écoulée, décompte son délai tant qu'il est présent et non en pause, et reste `"ending"` pendant
  la durée de la sortie avant d'être retiré.
- **`ToastStack`** mesure ses toasts et les dispose à partir d'un bord, le plus récent au plus près : des couches qui se chevauchent
  à l'état replié, une liste à l'état déployé (le pointeur dessus, ou un doigt posé dessus), animés par des ressorts.
- **`Toast`** est la racine de chaque toast : le rôle `alert`, son `transitionStatus` pour les styles de l'app, un balayage qui demande
  à le fermer, et le lecteur d'écran qui lit son libellé à l'affichage.

L'apparence et le contenu relèvent de l'app, tout comme la commodité d'afficher un toast depuis n'importe où : une app construit
son propre `toast(...)` sur ces éléments, comme le fait la galerie (`examples/gallery/toast.tsx`) et comme les notifications de GPUI Kit sont
construites sur les toasts de `gpui-base`.

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`, `ToastStack` et `ToastManager` proviennent de [`nsh/base`](../modules/nsh-base.md). En Rust, ce sont
`nsh_base` : `toast`, `toast_stack` et `ToastManager`.

## ToastManager

Le manager est headless : il ne rend rien et n'exécute aucun minuteur. L'app y ajoute des toasts, rend ceux que
`visible(limit)` renvoie avec leur statut, et appelle `advance` sur un minuteur tant qu'un toast est monté, en passant `paused`
lorsque la pile est déployée. En Rust, c'est `ToastManager<I, T>` sur les ids et valeurs de l'app, avec un `Instant` pour
chaque appel ; en TS, c'est une classe sur des ids de type chaîne et n'importe quelle valeur JSON, sur l'horloge du moteur (y compris l'horloge
manuelle d'un test).

- `push(id, value, options)` ajoute le toast le plus récent, en remplaçant celui qui a le même id (dont il renvoie la valeur) ;
  `options.timeout` est sa durée de présence en millisecondes (aucune : il reste jusqu'à ce qu'on le ferme).
- `dismiss(id)` lance la sortie d'un toast ; `dismissAll()` celle de tous les toasts, en renvoyant leurs ids.
- `advance(paused)` fait avancer le cycle de vie et indique ce qui a changé : `presented`, `ending` (leur délai est écoulé),
  `removed` (avec leurs valeurs), et `changed`.
- `visible(limit)` correspond aux `limit` toasts les plus récents qui ne sont pas en sortie, plus ceux en sortie, du plus ancien au plus récent ; `entries()`
  (Rust `iter()`) tous les toasts ; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` contient les tokens des deux : `duration` (400 ms : l'échéance de l'entrée et le temps de réponse du ressort de la pile),
`exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0,05) et
`collapsedVisible` (3), ceux de Sonner (`ToastMotion::sonner()` en Rust ; les champs omis en TS conservent ces valeurs).

## ToastStack

Les enfants de la pile sont ses toasts, du plus ancien au plus récent. À partir de son bord `placement` (`"topRight"` par défaut ; les ancrages
du bas disposent vers le haut), les toasts repliés se chevauchent avec `collapsedPeek` d'écart, chacun plus étroit que le précédent de
`collapsedScaleStep`, et seuls `collapsedVisible` sont visibles ; une fois déployés, ils forment une liste espacée de `expandedGap`. Les toasts qui
arrivent ou partent, ainsi que le déploiement, les déplacent avec des ressorts à amortissement critique. Elle est déployée tant que le pointeur est dessus
ou qu'un doigt est posé dessus (`onExpandedChange({ expanded })` ; en Rust `ToastStackState`, que `is_expanded()` lit), de sorte que
l'app met les délais en pause pendant que l'utilisateur lit ou touche les toasts.

L'app place la pile : dans un [Overlay](./overlay.md) au bord, à l'intérieur de la zone sûre. Ses `class` et `style`
déterminent sa largeur. Tant qu'elle contient des toasts, elle écoute Échap et le bouton retour d'Android (`onCancel` ; `closeOnEscape={false}`
les laisse au reste de l'app) : elle ferme le plus récent.

<a id="toast-1"></a>

## Toast

Un toast est le rôle `alert` autour du contenu de l'app. Son `transitionStatus` est celui du manager, et ses classes d'état
le suivent via son `class` : `startingClass` dans sa première frame pendant `"starting"`, afin que ses classes `transition` s'animent
à partir de celui-ci (`starting:` de Tailwind, `@starting-style` de CSS) ; `endingClass` pendant `"ending"`, pour la durée de la sortie ;
`swipingClass` pendant qu'un pointeur le balaie (`transition-none` le garde sous le doigt).

Un doigt ou la souris glissé vers `swipeDirection` (`"right"` par défaut ; `null` désactive le balayage) le déplace, une fois
que le pointeur a bougé, de sorte que ses boutons restent des boutons ; relâché au-delà de `swipeThreshold` points (50) ou d'un geste rapide, il part
complètement et demande à être fermé (`onDismissRequest`) ; en deçà, il revient. Le lecteur d'écran lit son
`accessibilityLabel` à l'affichage.

<a id="toast-props"></a>

## Props de Toast

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | Sa phase du cycle de vie. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | aucun | Ses classes dans sa première frame, pendant la sortie, pendant le balayage. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | La direction dans laquelle on le balaie pour l'écarter. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | La distance d'un balayage avant qu'un relâchement demande à le fermer. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que le lecteur d'écran lit à l'affichage. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | aucun | L'utilisateur l'a écarté par balayage. |

<a id="toaststack-props"></a>

## Props de ToastStack

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Ceux de Sonner | Ses tokens de mouvement. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | Le bord à partir duquel elle dispose les toasts. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Elle écoute Échap et retour tant qu'elle contient des toasts. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | aucun | L'interaction l'a déployée ou repliée. |
| `onCancel` | `.on_cancel(..)` | `() => void` | aucun | Échap ou retour : ferme le plus récent. |
