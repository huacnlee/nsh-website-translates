---
title: "Toast"
description: "Toast, ToastStack e ToastManager: toasts sem estilo como os do gpui-base, uma raiz semântica com status de transição, uma pilha que organiza os toasts em camadas e o ciclo de vida headless deles."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---


# Toast

Toasts são mensagens curtas exibidas por um tempo sobre o app: "Copiado", "Rascunho excluído · Desfazer", "Não foi possível enviar".
`nsh/base` fornece o comportamento deles em três peças sem estilo, assim como o `gpui-base` do GPUI Kit:

- **`ToastManager`** mantém os toasts em ordem com seu ciclo de vida: cada um está `"starting"`, depois `"present"` assim que a duração do movimento passa, faz a contagem regressiva do seu timeout enquanto está presente e não pausado, e permanece `"ending"` pela duração da saída antes de ser removido.
- **`ToastStack`** mede seus toasts e os organiza a partir de uma borda, com o mais novo mais próximo dela: camadas sobrepostas quando recolhida, uma lista quando expandida (com o ponteiro sobre ela, ou um dedo pressionado sobre ela), movidos com springs.
- **`Toast`** é a raiz de cada toast: o papel `alert`, seu `transitionStatus` para os estilos do app, um gesto de deslizar que pede para dispensá-lo, e o leitor de tela lendo seu rótulo quando ele aparece.

A aparência e o conteúdo são do app, e também a conveniência de mostrar um toast de qualquer lugar: um app cria seu próprio `toast(...)` sobre essas peças, como faz a galeria (`examples/gallery/toast.tsx`) e como as notificações do GPUI Kit são criadas sobre os toasts de `gpui-base`.

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

`Toast`, `ToastStack` e `ToastManager` vêm de [`nsh/base`](../modules/nsh-base.md). Em Rust, são `toast`, `toast_stack` e `ToastManager` de `nsh_base`.

## ToastManager

O manager é headless: não renderiza nada e não executa nenhum timer. O app adiciona toasts, renderiza os que `visible(limit)` retorna com seu status e chama `advance` em um timer enquanto houver algum montado, passando `paused` enquanto a pilha está expandida. Em Rust é `ToastManager<I, T>` sobre os ids e valores do app, com um `Instant` para cada chamada; em TS é uma classe sobre ids string e qualquer valor JSON, no relógio do engine (incluindo o relógio manual de um teste).

- `push(id, value, options)` adiciona o toast mais novo, substituindo um com o mesmo id (cujo valor ele retorna); `options.timeout` é seu tempo de exibição em milissegundos (nenhum: ele permanece até ser dispensado).
- `dismiss(id)` inicia a saída de um toast; `dismissAll()` a de todos, retornando seus ids.
- `advance(paused)` avança o ciclo de vida e informa o que mudou: `presented`, `ending` (seu timeout se esgotou), `removed` (com seus valores) e `changed`.
- `visible(limit)` são os `limit` toasts mais novos que não estão encerrando mais os que estão encerrando, do mais antigo ao mais novo; `entries()` (Rust `iter()`) todos eles; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` guarda os tokens de ambos: `duration` (400 ms: o prazo da entrada e a resposta do spring da pilha), `exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0.05) e `collapsedVisible` (3), os do Sonner (`ToastMotion::sonner()` em Rust; campos omitidos em TS mantêm esses valores).

## ToastStack

Os filhos da pilha são seus toasts, do mais antigo ao mais novo. A partir da sua borda `placement` (`"topRight"` por padrão; as âncoras inferiores organizam para cima), os toasts recolhidos se sobrepõem com `collapsedPeek` de distância, cada um adicional mais estreito em `collapsedScaleStep`, e apenas `collapsedVisible` aparecem; expandidos, formam uma lista com `expandedGap` de espaçamento. Toasts que chegam ou saem, e a expansão, são movidos com springs criticamente amortecidos. Ela fica expandida enquanto o ponteiro está sobre ela ou um dedo está pressionado sobre ela (`onExpandedChange({ expanded })`; Rust `ToastStackState`, que `is_expanded()` lê), de modo que o app pausa os timeouts enquanto o usuário lê ou toca nos toasts.

O app posiciona a pilha: em um [Overlay](./overlay.md) na borda, dentro da safe area. Seus `class` e `style` definem sua largura. Enquanto contém toasts, ela escuta Escape e o botão voltar do Android (`onCancel`; `closeOnEscape={false}` os deixa para o restante do app): dispensar o mais novo.

## Toast

Um toast é o papel `alert` ao redor do conteúdo do app. Seu `transitionStatus` é o do manager, e suas classes de estado o acompanham por meio de `class`: `startingClass` em seu primeiro frame enquanto `"starting"`, para que suas classes `transition` animem a partir dele (`starting:` do Tailwind, `@starting-style` do CSS); `endingClass` enquanto `"ending"`, pela duração da saída; `swipingClass` enquanto um ponteiro o desliza (`transition-none` o mantém sob o dedo).

Um dedo ou o mouse arrastado em direção a `swipeDirection` (`"right"` por padrão; `null` desativa o deslizar) o move, depois que o ponteiro se moveu, para que seus botões continuem sendo botões; ao soltar além de `swipeThreshold` pontos (50) ou com um arremesso, ele sai por completo e pede para ser dispensado (`onDismissRequest`); antes disso, ele volta. O leitor de tela lê seu `accessibilityLabel` quando ele aparece.

<a id="toast-props"></a>

## Props de Toast

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | Sua fase do ciclo de vida. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | nenhum | Suas classes no primeiro frame, durante o encerramento e durante o deslize. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | A direção em que ele é deslizado para fora. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | Quanto um deslize vai antes que soltar peça para dispensá-lo. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que o leitor de tela lê quando ele aparece. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | nenhum | O usuário o deslizou para fora. |

<a id="toaststack-props"></a>

## Props de ToastStack

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | os do Sonner | Seus tokens de movimento. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | A borda a partir da qual ela organiza. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Ela escuta Escape e voltar enquanto contém toasts. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | nenhum | A interação a expandiu ou recolheu. |
| `onCancel` | `.on_cancel(..)` | `() => void` | nenhum | Escape ou voltar: dispensar o mais novo. |
