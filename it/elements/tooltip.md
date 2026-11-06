---
title: "Tooltip"
description: "Il componente Tooltip: un suggerimento sull'elemento in cui è contenuto, mostrato sui desktop quando il puntatore vi si sofferma, con stile definito dall'app."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---

# Tooltip

Un tooltip è un breve suggerimento accanto all'elemento a cui si riferisce: cosa fa un pulsante con icona, il testo completo di un'etichetta troncata.
Sui desktop e nei browser desktop viene mostrato quando il puntatore resta fermo sul suo trigger per `delay` (500 ms), e
si nasconde quando il puntatore esce o preme il trigger. Telefoni e tablet mostrano un tooltip solo quando lo apre l'app
(`open`). Non cattura mai il puntatore né le pressioni, quindi il trigger funziona esattamente come funzionerebbe senza di esso.

`Tooltip` di [`nsh/base`](../modules/nsh-base.md) viene passato come prop `tooltip` che ogni elemento possiede
([Prop comuni](index.md#tooltips)), come `.tooltip(..)` di GPUI: l'elemento è ciò su cui si ferma il puntatore e ciò rispetto a cui
viene posizionato. Il tooltip vero e proprio è il fumetto: puoi stilizzarlo con `class` / `style`, e i suoi figli sono ciò che dice.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

Per impostazione predefinita si posiziona sopra il trigger (`placement`), sull'altro lato quando manca spazio, e resta all'interno della
safe area. Con `open` è l'app a decidere quando mostrarlo: segue `onOpenChange`, che segnala il puntatore fermo sul
trigger o in uscita, e può mostrarlo su qualsiasi dispositivo.

Appare e scompare con le tue transizioni: `startingClass` è il suo aspetto nel primo frame e `endingClass` il suo aspetto
una volta nascosto, che mantiene mentre le classi `transition-*` del suo `class` sono in esecuzione; segue `onClose`.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che dice. |
| `class`, `style` | metodi `.app_class(..)`, `Styled` | `string`, `StyleProp<ViewStyle>` | nessuno | L'aspetto del fumetto: il tooltip stesso. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto nel primo frame: le sue transizioni partono da esso. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto una volta nascosto: lo mantiene mentre le sue transizioni sono in esecuzione. |
| `open` | `.open(..)` | `boolean` | nessuno | Visibile, controllato dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Visibile all'inizio, senza `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Millisecondi di sosta del puntatore sul trigger prima che venga mostrato; `Infinity`: mai da solo, solo quando lo apre l'app. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Non viene mai mostrato. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Il lato del trigger su cui si posiziona. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Come si allinea al trigger lungo quel lato. |
| `offset` | `.offset(..)` | `number` | `4` | Lo spazio tra il trigger e il tooltip. |
| `margin` | `.margin(..)` | `number` | `4` | La distanza che mantiene dai bordi della safe area. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Il puntatore si è fermato sul trigger, oppure lo ha lasciato o premuto (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | È mostrato. |
| `onClose` | `.on_close(\|\| ..)` | È scomparso, dopo la sua uscita; anche quando l'app lo ha nascosto. |

<a id="accessibility"></a>

## Accessibilità

Un tooltip ripete agli screen reader ciò che dice il suo trigger: assegna al trigger anche un `accessibilityLabel`, così il
suggerimento è disponibile per tutti.
