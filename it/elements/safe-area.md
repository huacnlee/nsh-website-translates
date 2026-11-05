---
title: "Area sicura"
description: "Le variabili d'ambiente safe-area-inset e gli accessori safeArea e safeAreaInsets: contenuto mantenuto libero da notch, barra di stato, indicatore home e intestazioni."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# Area sicura

L'area sicura mantiene il contenuto lontano dal notch o dalla Dynamic Island, dalla barra di stato, dall'indicatore home, da un'intestazione di navigazione e dalla barra del titolo di Mac Catalyst. Qualsiasi view può applicare questo spazio come padding con `env()` di CSS:
`env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)` e
`env(safe-area-inset-left)`, nel suo padding o margin. Sono gli inset della root view in cui il nodo viene renderizzato:
dentro una [NavPage](./nav-stack.md) gli inset sotto l'intestazione della pagina, dentro un [Dialog](./dialog.md) gli inset del dialog, e altrove l'area sicura della superficie. In un browser la pagina è la root e le variabili sono quelle del browser stesso.

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

Il colore di sfondo riempie l'intera area, compresa quella dietro la barra di stato, e il contenuto inizia sotto di essa. I valori seguono gli inset: in caso di rotazione, in un'altra pagina o in un altro dialog, il padding si aggiorna in modo nativo.

<a id="values"></a>

## Valori

| Valore | Esempio | Significato |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | L'inset. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | L'inset; la lunghezza sostituisce un nome sconosciuto, come in CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | L'inset più una lunghezza, per il contenuto che mantiene una propria spaziatura. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | Lo stesso. |

Si applicano a `padding`, `paddingHorizontal`, `paddingVertical`, `paddingTop`, `paddingRight`, `paddingBottom`,
`paddingLeft` e alle stesse chiavi `margin`. In Tailwind sono valori arbitrari delle utility `p`, `px`, `py`, `pt`, `pr`, `pb`,
`pl` e `m` (gli spazi possono essere omessi): `pt-[env(safe-area-inset-top)]`,
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. Il tipo TypeScript di questi valori è `EnvValue`. Vedi
[il riferimento degli stili](../modules/style-reference.md).

In Rust i metodi di `Styled` li impostano: `.p_safe_area()`, `.px_safe_area()`, `.py_safe_area()`, `.pt_safe_area()`,
`.pr_safe_area()`, `.pb_safe_area()`, `.pl_safe_area()`, gli stessi metodi di `m`, e `.pt_safe_area_plus(px(16.0))`
(e `pr`, `pb`, `pl`, `mt`, `mr`, `mb`, `ml`) per un inset più una lunghezza.

<a id="choosing-the-edges"></a>

## Scegliere i bordi

Applica il padding solo ai bordi che ne hanno bisogno, per esempio quando una tab bar o una barra inferiore personalizzata gestisce l'inset inferiore:

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

## Quando usarla

Una [NavPage](./nav-stack.md) con un'intestazione visibile e opaca posiziona già il proprio contenuto sotto l'intestazione, quindi l'inset superiore è 0. Gli inset dell'area sicura servono per:

- la root di un'app senza stack di navigazione,
- una pagina con `headerVisible={false}` o `headerTransparent`,
- il contenuto di un [Dialog](./dialog.md) a schermo intero,
- barre personalizzate ai bordi dello schermo.

<a id="safearea-and-safeareainsets"></a>

## safeArea e safeAreaInsets

Quando ti servono i valori numerici nel codice, leggili direttamente. Entrambi gli accessor TSX provengono da `nsh`, restituiscono un oggetto `Edges`
(`{ top, right, bottom, left }` in punti) e sono reattivi: il codice che li legge viene eseguito di nuovo quando cambiano, per esempio in caso di rotazione.

| TSX | Rust | Restituisce |
|---|---|---|
| `safeArea()` | `safe_area()` | L'area sicura della superficie: le parti libere dall'interfaccia di sistema (notch, indicatore home, barra del titolo). |
| `safeAreaInsets()` | `cx.insets()` | Gli inset nel punto in cui il componente viene renderizzato: quelli della pagina più vicina (sotto la sua intestazione), del dialog più vicino, oppure l'area sicura della superficie. Sono i valori delle variabili `safe-area-inset-*`. In TSX, chiamala in un componente; restituisce un accessor. Un componente Rust del tuo crate li legge con `cx.insets()`. |

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

Per applicare come padding l'inset stesso, `env()` è la forma più semplice: si aggiorna in modo nativo, senza eseguire codice.

<a id="platform-notes"></a>

## Note sulle piattaforme

- **iOS**: gli inset provengono dall'area sicura di UIKit: la barra di stato, il notch o la Dynamic Island e l'indicatore home.
- **Android**: NSH riporta le parti delle barre di sistema e del display cutout che si sovrappongono alla view di NSH. Quando NSH è [incorporato](../docs/android.md) sotto una toolbar nativa, l'inset superiore della view è 0.
- **Mac Catalyst**: l'inset superiore è la barra del titolo della finestra.
- **Desktop (macOS, Windows, Linux, GPUI) e web**: il contenuto di una pagina inizia sotto il suo `header`, e un dialog fornisce al proprio contenuto inset propri, come sui telefoni.

<a id="related"></a>

## Correlati

- [Tastiera](./keyboard.md): `env(keyboard-inset-height)`, contenuto mantenuto sopra la tastiera software.
- [Dispositivo e ambiente](../docs/device-and-environment.md): l'area sicura tra gli altri valori del dispositivo.
