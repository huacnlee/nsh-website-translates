---
title: "Tooltip"
description: "O componente Tooltip: uma dica sobre o elemento em que ele está, exibida nos desktops quando o ponteiro permanece sobre ele, estilizada pelo app."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---


# Tooltip

Um tooltip é uma dica curta ao lado daquilo a que se refere: o que um botão de ícone faz, o texto completo de um rótulo truncado.
Em desktops e navegadores desktop, ele aparece depois que o ponteiro fica parado sobre o gatilho por `delay` (500 ms) e
some quando o ponteiro sai ou pressiona o gatilho. Celulares e tablets mostram um tooltip somente quando o app o abre
(`open`). Ele nunca captura o ponteiro nem os toques, então o gatilho funciona exatamente como funcionaria sem ele.

`Tooltip` de [`nsh/base`](../modules/nsh-base.md) é passado como a prop `tooltip` que todo elemento tem
([Props comuns](index.md#tooltips)), como o `.tooltip(..)` do GPUI: o elemento é aquilo sobre o qual o ponteiro fica parado e em relação ao qual
o tooltip é posicionado. O tooltip em si é o balão: estilize-o com `class` / `style`, e seus filhos são o que ele diz.

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

Por padrão, ele fica acima do gatilho (`placement`), do outro lado quando não há espaço, e permanece dentro da área
segura. Com `open`, o app decide quando ele aparece: ele segue `onOpenChange`, que informa quando o ponteiro fica parado sobre o
gatilho ou sai dele, e pode mostrá-lo em qualquer dispositivo.

Ele entra e sai com as suas transições: `startingClass` é a sua aparência no primeiro frame e `endingClass` a sua aparência
depois de oculto, que ele mantém enquanto as classes `transition-*` do seu `class` executam; `onClose` vem em seguida.

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

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que ele diz. |
| `class`, `style` | métodos `.app_class(..)`, `Styled` | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do balão: o próprio tooltip. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Sua aparência no primeiro frame: suas transições partem dela. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Sua aparência depois de oculto: ela permanece enquanto suas transições executam. |
| `open` | `.open(..)` | `boolean` | nenhum | Exibido, controlado pelo app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Exibido inicialmente, sem `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Milissegundos em que o ponteiro fica parado sobre o gatilho antes de o tooltip aparecer; `Infinity`: nunca sozinho, somente quando o app o abre. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nunca é exibido. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | O lado do gatilho em que ele fica. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Como ele se alinha ao gatilho ao longo desse lado. |
| `offset` | `.offset(..)` | `number` | `4` | O espaço entre o gatilho e o tooltip. |
| `margin` | `.margin(..)` | `number` | `4` | A distância que ele mantém das bordas da área segura. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | O ponteiro ficou parado sobre o gatilho, ou saiu dele ou o pressionou (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | Ele está exibido. |
| `onClose` | `.on_close(\|\| ..)` | Ele foi ocultado, após a sua saída; também quando o app o ocultou. |

<a id="accessibility"></a>

## Acessibilidade

Um tooltip repete para os leitores de tela o que o seu gatilho diz: dê ao gatilho também um `accessibilityLabel`, para que a
dica esteja disponível para todos.
