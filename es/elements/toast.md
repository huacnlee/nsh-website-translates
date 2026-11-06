---
title: "Toast"
description: "Toast, ToastStack y ToastManager: toasts sin estilos como los de gpui-base, una raíz semántica con un estado de transición, una pila que dispone los toasts como capas y su ciclo de vida headless."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---


# Toast

Los toasts son mensajes breves que se muestran durante un tiempo sobre la app: "Copied", "Draft deleted · Undo", "Could not send".
`nsh/base` ofrece su comportamiento en tres piezas sin estilos, igual que el `gpui-base` de GPUI Kit:

- **`ToastManager`** mantiene los toasts en orden con su ciclo de vida: cada uno está `"starting"`, luego `"present"` una vez
  transcurrida la duración del movimiento, cuenta atrás su tiempo de espera mientras está presente y no en pausa, y permanece `"ending"` durante
  la duración de la salida antes de ser eliminado.
- **`ToastStack`** mide sus toasts y los distribuye desde un borde, con el más reciente más cerca de él: capas superpuestas mientras
  está contraído, una lista mientras está expandido (con el puntero sobre él, o un dedo apoyado sobre él), movidos con resortes.
- **`Toast`** es la raíz de cada toast: el rol `alert`, su `transitionStatus` para los estilos de la app, un gesto de deslizamiento que solicita
  descartarlo, y el lector de pantalla que lee su etiqueta al mostrarse.

El aspecto y el contenido son de la app, y también lo es la comodidad de mostrar un toast desde cualquier lugar: una app construye su
propio `toast(...)` sobre estas piezas, como hace la galería (`examples/gallery/toast.tsx`) y como las notificaciones de GPUI Kit están
construidas sobre los toasts de `gpui-base`.

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

`Toast`, `ToastStack` y `ToastManager` provienen de [`nsh/base`](../modules/nsh-base.md). En Rust son
`nsh_base` de `toast`, `toast_stack` y `ToastManager`.

## ToastManager

El manager no tiene interfaz: no renderiza nada ni ejecuta ningún temporizador. La app añade toasts, renderiza los que
devuelve `visible(limit)` junto con su estado, y llama a `advance` con un temporizador mientras haya alguno montado, pasando `paused`
mientras la pila está expandida. En Rust es `ToastManager<I, T>` sobre los ids y valores de la app, con un `Instant` para
cada llamada; en TS es una clase sobre ids de tipo string y cualquier valor JSON, con el reloj del motor (incluido el reloj
manual de una prueba).

- `push(id, value, options)` añade el toast más reciente, reemplazando uno con el mismo id (cuyo valor devuelve);
  `options.timeout` es su tiempo de presencia en milisegundos (ninguno: permanece hasta que se descarte).
- `dismiss(id)` inicia la salida de un toast; `dismissAll()` la de todos, devolviendo sus ids.
- `advance(paused)` hace avanzar el ciclo de vida e informa de lo que cambió: `presented`, `ending` (su tiempo de espera se agotó),
  `removed` (con sus valores) y `changed`.
- `visible(limit)` son los `limit` toasts más recientes que no están terminando más los que están terminando, del más antiguo al más reciente; `entries()`
  (en Rust `iter()`) todos ellos; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` contiene los tokens de ambos: `duration` (400 ms: el plazo de la entrada y la respuesta del resorte de la pila),
`exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0.05) y
`collapsedVisible` (3), los de Sonner (`ToastMotion::sonner()` en Rust; los campos omitidos en TS conservan estos valores).

## ToastStack

Los hijos de la pila son sus toasts, del más antiguo al más reciente. Desde su borde `placement` (`"topRight"` por defecto; los anclajes
inferiores distribuyen hacia arriba), los toasts contraídos se superponen separados por `collapsedPeek`, cada uno más estrecho que el anterior en
`collapsedScaleStep`, y solo se muestran `collapsedVisible`; expandidos, forman una lista separada por `expandedGap`. Los toasts que
llegan o se van, y la expansión, se mueven con resortes críticamente amortiguados. Está expandida mientras el puntero está sobre ella
o hay un dedo apoyado sobre ella (`onExpandedChange({ expanded })`; en Rust `ToastStackState`, que lee `is_expanded()`), de modo que
la app pausa los tiempos de espera mientras el usuario lee o toca los toasts.

La app coloca la pila: en un [Overlay](./overlay.md) en el borde, dentro del área segura. Su `class` y su `style`
determinan su anchura. Mientras contiene toasts, escucha Escape y el botón atrás de Android (`onCancel`; `closeOnEscape={false}`
los deja para el resto de la app): descartar el más reciente.

## Toast

Un toast es el rol `alert` alrededor del contenido de la app. Su `transitionStatus` es el del manager, y sus clases de estado
lo siguen a través de su `class`: `startingClass` en su primer fotograma mientras `"starting"`, de modo que sus clases `transition` se animan
desde él (`starting:` de Tailwind, `@starting-style` de CSS); `endingClass` mientras `"ending"`, durante la duración de la salida;
`swipingClass` mientras un puntero lo desliza (`transition-none` lo mantiene bajo el dedo).

Un dedo o el ratón arrastrado hacia `swipeDirection` (`"right"` por defecto; `null` desactiva el deslizamiento) lo mueve, una vez
que el puntero se ha movido, de modo que sus botones siguen siendo botones; si se suelta más allá de `swipeThreshold` puntos (50) o con un gesto rápido, sigue
hasta salir y solicita ser descartado (`onDismissRequest`); si no llega a ese punto, vuelve. El lector de pantalla lee su
`accessibilityLabel` al mostrarse.

<a id="toast-props"></a>

## Props de Toast

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | Su fase del ciclo de vida. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | ninguno | Sus clases en su primer fotograma, mientras termina, mientras se desliza. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | La dirección en la que se desliza para descartarlo. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | Cuánto avanza un deslizamiento antes de que soltarlo solicite descartarlo. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | ninguno | Lo que lee el lector de pantalla al mostrarse. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | ninguno | El usuario lo deslizó para descartarlo. |

<a id="toaststack-props"></a>

## Props de ToastStack

| Prop | Rust | Tipo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Los de Sonner | Sus tokens de movimiento. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | El borde desde el que distribuye. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escucha Escape y atrás mientras contiene toasts. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | ninguno | La interacción lo expandió o lo contrajo. |
| `onCancel` | `.on_cancel(..)` | `() => void` | ninguno | Escape o atrás: descartar el más reciente. |
