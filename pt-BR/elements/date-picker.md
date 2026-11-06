---
title: "DatePicker"
description: "O componente DatePicker: uma data, um intervalo de datas ou uma data e hora selecionados em um calendário, exibido em um popup junto ao seu gatilho em desktops e em uma sheet em celulares, com estilo definido pelo app."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---


# DatePicker

Um seletor de data define uma data a partir de um [Calendar](./calendar.md) que abre a partir do gatilho do app: uma data de vencimento, um aniversário, com `range` os dias de uma viagem, com `timePrecision` uma data e um horário. Como o [Select](./select.md), ele abre da forma que cada dispositivo espera:

- Em desktops e em navegadores desktop, um popup junto ao gatilho; ao abri-lo, o teclado vai para os dias.
- Em celulares e tablets, uma sheet na parte inferior da tela, sobre um backdrop.

O seletor cuida do comportamento: o valor (o do app ou o próprio), o estado de abertura, o calendário, o horário, os presets, o teclado e o que os leitores de tela anunciam. A aparência é do app: ele desenha o gatilho (com o valor, um placeholder, um ícone) e estiliza o popup, as partes do calendário, os presets e o campo de horário.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `date_picker()` cria um com um setter por prop (`.value(..)`, `.range(..)`, `.time_precision(..)`) e um listener por evento (`.on_change(..)`). Seu valor é um `DateTime` (`DateTime::Single`, `DateTime::Range`, de datas `chrono` ou de datas e horários); `onChange` fornece um `PickedDate`, o valor com a precisão de horário do seletor.

<a id="value"></a>

## Valor

O valor usa as formas dos inputs HTML: uma data ISO, `"2026-10-28"`, como a de `<input type="date">`; com `range` `[start, end]`; com `timePrecision` uma data e hora, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` em segundos), como a de `<input type="datetime-local">`; `null` é nenhum valor. Com `value`, o app é o dono: o seletor o exibe e informa cada mudança com `onChange({ value })`; o app define `value` para acompanhá-la. Se omitido, o seletor mantém seu próprio valor, a partir de `defaultValue` no início.

- Uma única data: um toque em um dia define o valor e fecha o popup.
- Com `range`, o primeiro toque inicia o intervalo e o segundo o encerra, como em um [calendário](./calendar.md#value); o intervalo completo define o valor e fecha o popup.
- Com `timePrecision` (somente para uma única data), um campo de horário aparece abaixo do calendário e cada edição do horário é informada. Em desktops, escolher um dia mantém o popup aberto para o horário e informa a data com seu horário; um novo toque no dia selecionado fecha o popup. Em celulares e tablets, um toque em um dia o escolhe com seu horário e fecha a sheet, como acontece com uma única data; a sheet abre novamente para o horário. Um dia escolhido antes de qualquer horário recebe `defaultTime` (padrão `00:00`). `hourCycle` define como o campo conta as horas.

`cleanable` adiciona um botão de limpar enquanto houver um valor: um toque o limpa (`onChange({ value: null })`). Ele fica depois do gatilho, não dentro dele, então um toque nele nunca abre o popup; o app o posiciona e o preenche (`clearButton`), como no [botão de limpar de um select](./select.md#value).

## Presets

`presets` são botões ao lado do calendário que definem o valor: "Hoje", "Últimos 7 dias", "Amanhã às 9". Cada um é `{ label, value }`, `value` uma data, um intervalo ou datas e horários, mantidos como foram dados; um toque o aplica e fecha o popup. `contentClass` organiza a coluna de presets e o calendário com o horário (uma linha, `flex-row`); `presetsClass` estiliza a coluna, `presetClass` cada botão.

<a id="the-calendar"></a>

## O calendário

Toda prop do [Calendar](./calendar.md), exceto seu valor, é repassada para o seletor: `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, as partes (`headerClass` a `itemStyle`) e `renderItem`. `calendarClass` e `calendarStyle` estilizam o próprio calendário. Suas visualizações e teclas são as de um calendário.

A linha do horário (`timeClass`, `timeStyle`) contém `timeLabel`, as palavras do app para ele ("Horário"), no início e o campo de horário (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`) no fim: uma linha com seus itens centralizados e espaçados (`flex-row items-center justify-between`, como em `gpui-component`). Os segmentos do campo são os de um [TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | nenhum | O valor, controlado pelo app. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | O valor inicial, sem `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Escolhe um intervalo de datas. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | O estado de abertura, do app ou do próprio seletor. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Permanece fechado e não recebe toques nem foco do teclado. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | Como os leitores de tela o chamam. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` e o horário | Como os leitores de tela anunciam o valor, no formato de `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | nenhum | Edita também o horário, até esta precisão. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Como o campo de horário conta as horas. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | O horário que uma data recebe antes de o usuário definir um. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Um botão de limpar enquanto houver um valor. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Botões no popup que definem o valor. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | como em `Calendar` | como em `Calendar` | como em `Calendar` | Os meses, semanas, datas desabilitadas e anos do calendário. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | como em `Calendar` | `string` | nenhum | O que os leitores de tela dizem para Anterior e Próximo do calendário. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | como em `Select` | `"bottom"`, `"start"`, 0, 0 | Desktops: onde o popup fica em relação ao gatilho. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O popup (desktops) ou a sheet (telas sensíveis ao toque). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O backdrop atrás da sheet. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O conteúdo do popup: os presets ao lado do calendário e o horário. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A coluna de presets. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | O botão de cada preset. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O calendário. |
| `headerClass` … `itemStyle` | como em `Calendar` | como em `Calendar` | nenhum | O cabeçalho, o corpo, os meses, as linhas e os itens do calendário. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | nenhum | Cada item do calendário, desenhado pelo app a partir do que ele é; seus estados são as classes dos itens, como em `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A linha do horário: seu rótulo no início, o campo no fim. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | nenhum | O que a linha do horário exibe antes do campo. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O campo de horário. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o campo de horário. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | como em `TimeField` | como em `TimeField` | nenhum | Os segmentos do campo de horário e `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O botão de limpar (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | nenhum | O conteúdo do botão de limpar. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | nenhum | Como os leitores de tela chamam o botão de limpar. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nenhum | O que abre o popup quando tocado; o popup é posicionado em relação a ele. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A view ao redor do gatilho. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | O valor mudou (um dia, o fim de um intervalo, um preset, o horário, o botão de limpar): `{ value }`. Defina `value` para acompanhá-lo. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | O popup abriu ou fechou, com o motivo (`{ open, reason }`). Defina `open` para acompanhá-lo. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | O popup é exibido ou desaparece. |
| `onCancel` | `.on_cancel(..)` | O usuário fechou o popup sem fazer uma escolha (Escape ou voltar, um toque fora ou no backdrop). |

<a id="parts"></a>

## Partes

| Parte | Onde | Estilizada com |
|---|---|---|
| O gatilho | a view do seletor | o próprio elemento do app (`trigger`) |
| O botão de limpar | a view do seletor, depois do gatilho (`cleanable`, enquanto houver um valor) | `clearButtonClass`, `clearButtonStyle`; seu conteúdo `clearButton` |
| O popup ou a sheet | sobre tudo, junto ao gatilho (desktops) ou na parte inferior (telas sensíveis ao toque) | `popupClass`, `popupStyle` |
| O backdrop | atrás da sheet (telas sensíveis ao toque) | `backdropClass`, `backdropStyle` |
| O conteúdo | o popup | `contentClass`, `contentStyle` |
| Os presets | o conteúdo, primeiro (`presets`) | `presetsClass`, `presetsStyle`; cada um `presetClass`, `presetStyle` |
| O calendário | o conteúdo | `calendarClass`, `calendarStyle`, e as partes do [Calendar](./calendar.md#parts) |
| A linha do horário | abaixo do calendário (`timePrecision`) | `timeClass`, `timeStyle`; seu rótulo `timeLabel` |
| O campo de horário | a linha do horário | `timeFieldClass`, `timeFieldStyle`, e as partes do [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Teclado

| Tecla | Ação |
|---|---|
| Return (no gatilho) | Abre o popup ou o fecha. |
| Delete, Backspace (no gatilho) | Limpa o valor enquanto o popup está fechado. |
| Escape | Fecha o popup sem fazer uma escolha. |

No popup, as teclas do calendário se movem entre os dias e escolhem um (veja [Teclado](./calendar.md#keyboard)) e as do campo de horário editam o horário (veja [Teclado](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Acessibilidade

- O gatilho é um combobox para leitores de tela: seu rótulo é `accessibilityLabel`, seu valor é a data como `dateFormat` a escreve (por padrão `2026/10/28`, com o horário em `timePrecision`), e ele informa se o popup está expandido. `disabled` o esmaece.
- Os dias do calendário são botões nomeados por suas datas ISO (veja [Acessibilidade](./calendar.md#accessibility)); os presets são botões nomeados por seus rótulos; o campo de horário é nomeado por `timeAccessibilityLabel`.
- O botão de limpar é um botão nomeado por `clearButtonAccessibilityLabel`.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, funções e anúncios em geral.
