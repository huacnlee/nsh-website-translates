---
title: "TimeField"
description: "O componente TimeField: um horário do dia editado segmento por segmento, horas, minutos e segundos, com o teclado ou com o teclado numérico de um telefone, estilizado pelo app."
group: base
demo: el-date-picker
source_hash: 2c1c4d77c8f324de
---


# TimeField

Um campo de hora edita uma hora do dia, um segmento por vez: a hora, o minuto, com `precision="second"` o segundo, e com `hourCycle="h12"` AM ou PM. A hora de um lembrete, o início de uma reunião, o horário de abertura de uma loja. É a hora que fica sob o calendário do [DatePicker](./date-picker.md) com `timePrecision`, mas sozinha na página.

O campo cuida do comportamento: a hora (a do app ou a própria), qual segmento as teclas editam, a digitação e o incremento de dígitos, e o que os leitores de tela anunciam. A aparência é do app: ele estiliza os segmentos e o `:` entre eles, ou desenha os segmentos por conta própria.

```rust tabs
use chrono::NaiveTime;
use nsh_base::{HourCycle, TimeFieldSegmentEntry, TimeOfDay, time_field};
use nsh_core::prelude::*;

fn reminder_time() -> impl IntoElement {
    let at = signal(TimeOfDay(NaiveTime::from_hms_opt(9, 30, 0).unwrap()));
    time_field()
        .value(move || Some(at.get()))
        .on_change(move |next: &TimeOfDay| at.set(*next))
        .hour_cycle(HourCycle::H12)
        .accessibility_label("Reminder time")
        .segment_class("rounded-sm focus:bg-accent disabled:opacity-50")
        .render_segment(|segment: &TimeFieldSegmentEntry| view().px_1().child(text(segment.label.clone())))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { TimeField } from "nsh/base";

function App() {
  const at = signal("09:30");
  return (
    <TimeField
      value={at()}
      onChange={({ value }) => at.set(value)}
      hourCycle="h12"
      accessibilityLabel="Reminder time"
      class="h-9 w-32 flex-row items-center rounded-md border border-input px-2"
      segmentClass="rounded-sm px-0.5 text-sm tabular-nums focus:bg-accent focus:text-accent-foreground"
      separatorClass="text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`TimeField` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `time_field()` cria um, com um setter por prop (`.value(..)`, `.precision(..)`, `.hour_cycle(..)`) e um listener por evento (`.on_change(..)`). Sua hora é um `TimeOfDay`, um `chrono::NaiveTime`.

<a id="value"></a>

## Valor

O valor é uma hora do dia em relógio de 24 horas, como a de um `<input type="time">` do HTML: `"HH:MM"`, ou `"HH:MM:SS"` com `precision="second"`, conforme o `hourCycle` que o campo mostra. Com `value`, o app é o dono: o campo o exibe e informa cada edição com `onChange({ value })`; o app define `value` para acompanhá-la. Se omitido, o campo mantém sua própria hora, a partir de `defaultValue` no início (padrão `00:00`).

`precision` é a menor unidade que o campo edita, `"minute"` (o padrão) ou `"second"`. `hourCycle` é como ele conta as horas: `"h23"` (o padrão) de 00 a 23, `"h12"` de 12 a 11 com um segmento AM/PM após os números.

<a id="editing"></a>

## Edição

Um segmento fica selecionado; as teclas o editam, como no campo de hora do `gpui-base`:

- Cima e Baixo incrementam o segmento de um em um e voltam ao início (59 para 00) sem propagar para o próximo segmento.
- Os dígitos são digitados no segmento, de dois em dois: um dígito que não pode iniciar um valor maior (um `7` na hora) completa o
  segmento e passa para o próximo.
- `a` e `p` definem AM e PM.
- Backspace e Delete redefinem o segmento.

Um toque em um segmento o seleciona. Um toque no segmento AM/PM selecionado alterna o valor, já que celulares não têm as teclas `a` e `p`. As teclas vão para um campo de texto nativo atrás dos segmentos, transparente, como o de um [OtpInput](./otp-input.md): em celulares e tablets ele abre o teclado numérico.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | nenhum | A hora, controlada pelo app. |
| `defaultValue` | `.default_value(..)` | `string` | `"00:00"` | A hora inicial, sem `value`. |
| `precision` | `.precision(..)` | `"minute" \| "second"` | `"minute"` | A menor unidade que ele edita. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Como ele conta as horas; `"h12"` adiciona um segmento AM/PM. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem foco e sem edição; os estilos de `disabled:` se aplicam ao campo e aos segmentos. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o campo. |
| `segmentClass`, `segmentStyle` | `.segment_class(..)`, `.segment_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | Cada segmento: `focus:` no selecionado enquanto o campo tem o foco, `disabled:` com o campo; com `group`, seu conteúdo os acompanha (`group-focus:`, `group-disabled:`). |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | Cada `:` entre os números. |
| `renderSegment` | `.render_segment(..)` | `(segment: TimeFieldSegmentEntry) => JSX.Element` | nenhum | O conteúdo de um segmento, desenhado pelo app a partir do que ele mostra; caso contrário, seu rótulo. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O campo, ao redor dos segmentos (uma linha). |

`renderSegment` recebe um `TimeFieldSegmentEntry`: `segment` (`"hour"`, `"minute"`, `"second"` ou `"period"`), `value` (a hora no relógio do campo, o minuto ou o segundo; `0` para AM e `1` para PM) e `label` (dois dígitos, ou `AM` / `PM`). Nunca recebe o estado do segmento: o segmento é `focus:` enquanto as teclas o editam e `disabled:` com o campo, e com `group` em `segmentClass` seu conteúdo o acompanha com `group-focus:` e `group-disabled:`. Assim, um segmento só é redesenhado quando seu valor muda; mover-se entre segmentos e o foco entrando e saindo não redesenham nada:

```tsx
<TimeField
  segmentClass="group rounded-sm px-0.5 focus:bg-primary"
  renderSegment={(segment) => <Text class="text-sm tabular-nums text-foreground group-focus:text-primary-foreground">{segment.label}</Text>}
/>
```

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | O usuário alterou a hora: `{ value }`. Defina `value` para acompanhá-la. Um `value` passado pelo app nunca é informado. |

<a id="parts"></a>

## Partes

| Parte | Onde | Estilizado com |
|---|---|---|
| O campo | a raiz, uma linha | `class`, `style` |
| Um segmento | o campo: hora, minuto, segundo, AM/PM | `segmentClass`, `segmentStyle`, `renderSegment` (`group-focus:`, `group-disabled:` dentro, sob `group` em `segmentClass`) |
| Um separador | o campo, entre dois números | `separatorClass`, `separatorStyle` |

<a id="keyboard"></a>

## Teclado

Tab chega ao campo com seu segmento selecionado. Então:

| Tecla | Ação |
|---|---|
| Esquerda / Direita | O segmento anterior ou seguinte. |
| Tab / Shift+Tab | O segmento seguinte ou anterior; Tab a partir do último e Shift+Tab a partir do primeiro saem do campo. |
| Cima / Baixo | Incrementa ou decrementa o segmento de um em um, voltando ao início ao chegar no limite. |
| 0 a 9 | Digita no segmento. |
| A / P | AM ou PM. |
| Backspace, Delete | Redefine o segmento. |

<a id="accessibility"></a>

## Acessibilidade

- O campo é um campo de texto nomeado por `accessibilityLabel`; os leitores de tela leem a hora exibida. `disabled` o esmaece.
- Celulares e tablets mostram o teclado numérico.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.
