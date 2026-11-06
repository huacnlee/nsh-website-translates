---
title: "Calendar"
description: "O componente Calendar: uma data ou um intervalo de datas escolhido a partir de meses de dias, com visualizações de mês e ano e o teclado, estilizado pelo app."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---


# Calendar

Um calendário escolhe uma data, ou, com `range`, um intervalo de datas, a partir de meses de dias dispostos em semanas: uma data de vencimento em um formulário, as noites de uma estadia, os dias de um relatório. Ele mostra um mês ou vários lado a lado, passa os meses com Anterior e Próximo, e alterna para uma visão dos meses do ano ou para uma página de anos, para ir mais longe. É o calendário do popup do [DatePicker](./date-picker.md), sozinho na página.

O calendário cuida do comportamento: o valor (do app ou o seu próprio), o mês exibido, as visões, os dias que não podem ser escolhidos, o teclado e o que os leitores de tela anunciam. A aparência fica a cargo do app: ele estiliza o cabeçalho, o corpo, cada mês, cada linha e cada item, e desenha o conteúdo dos itens (os nomes dos meses e dos dias da semana, a marca de hoje, a faixa do intervalo). A grade ocupa a largura que recebe, como as colunas de uma tabela: os meses a dividem entre si e os itens de uma linha dividem a linha igualmente. Assim, um calendário em uma sheet de celular ocupa a tela toda, e um em um popup dimensionado pelo conteúdo mantém a largura dos seus itens (`flex-none` em `itemClass` ou `monthClass` mantém um item ou um mês na sua própria largura).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` vem de [`nsh/base`](../modules/nsh-base.md), a crate `nsh-base` em Rust. Em Rust, `calendar()` cria um com um setter por prop (`.value(..)`, `.range(..)`, `.number_of_months(..)`) e um listener por evento (`.on_change(..)`). Seu valor é um `Date` (`Date::Single`, `Date::Range`, a partir de um `chrono::NaiveDate` ou de um par deles), e os dias que ele desabilita são um `Matcher`.

<a id="value"></a>

## Valor

O valor é uma data ISO, `"2026-10-28"`, como a de um `<input type="date">` do HTML; com `range` ele é `[start, end]`, e `null` significa nenhuma data. Com `value`, o app é o dono do valor: o calendário o mostra como selecionado e informa uma escolha com `onChange({ value })`; o app define `value` para acompanhá-la. Se omitido, o calendário mantém o próprio valor, a partir de `defaultValue` no início.

`onChange` informa apenas valores completos, como o `Selected` de `gpui-base`: um dia pressionado, ou o fim de um intervalo.

- Sem `range`, pressionar um dia o escolhe.
- Com `range`, o primeiro toque inicia o intervalo e o segundo o encerra, com os dias entre eles dentro do intervalo (cada um `selected`, incluindo as extremidades, veja [Itens](#items)). Um segundo toque em um dia anterior reinicia o intervalo a partir dele, assim como um toque depois que o intervalo está completo. Um intervalo parcial é exibido até ser completado e só então é informado.

O calendário abre no mês do valor (o início do intervalo) ou, se não houver, no mês de hoje.

<a id="months-and-views"></a>

## Meses e visões

`numberOfMonths` mostra essa quantidade de meses lado a lado, a partir do mês exibido; Anterior e Próximo passam os meses de um em um. `firstDayOfWeek` é o dia em que as semanas começam, de `0` domingo (o padrão) a `6` sábado.

O cabeçalho contém Anterior, dois toggles e Próximo:

- A visão de dias mostra os dias dos meses, cada mês como uma coluna com a linha dos dias da semana e suas semanas; os dias dos meses anterior e posterior completam as semanas (`outside`, `data-outside`).
- O toggle de mês (`monthToggle`) abre a visão de meses: os doze meses, em linhas de três. Escolher um o exibe na visão de dias.
- O toggle de ano (`yearToggle`) abre a visão de anos: uma página de 20 anos, em linhas de cinco, com Anterior e Próximo passando a página. Escolher um mostra esse ano na visão de dias. `yearRange` são os anos que as páginas percorrem, `[start, end)` (padrão: de 50 anos antes deste até 50 depois).

Com vários meses, o cabeçalho mostra o título de cada mês no lugar dos toggles (um item `monthToggle` que não recebe toques), como o de `gpui-base`.

<a id="disabled-dates"></a>

## Datas desabilitadas

`disabledMatcher` são os dias que o usuário não pode escolher, o `Matcher` de `gpui-base`, em uma de quatro formas:

| Forma | Desabilita |
|---|---|
| `[0, 6]` | Esses dias da semana, `0` domingo a `6` sábado. |
| `{ before, after }` | Os dias antes de `before` e depois de `after` (qualquer um pode ser omitido). |
| `{ from, to }` | Os dias de `from` a `to`, inclusive (se um for omitido, o intervalo fica aberto nesse lado). |
| `(date) => boolean` | Os dias para os quais a função retorna `true`, dada a data ISO de cada dia exibido. |

A função é consultada uma vez por dia exibido, no próximo turno do JS, e não é consultada de novo para um dia que já respondeu: passar os meses consulta apenas os dias que eles trazem, portanto a resposta deve ser uma função pura da data. Passar outra função consulta novamente. Um dia desabilitado é `disabled:`: não recebe toques, e Return e Space não o escolhem.

<a id="items"></a>

## Itens

Todo alvo de toque e todo rótulo do calendário é um item: Anterior, os toggles, Próximo, os dias da semana, os dias, os meses e os anos. Cada um é desenhado em uma parte estilizada por `itemClass` e `itemStyle`, cujas variantes seguem o seu estado:

| Variante | O item |
|---|---|
| `selected:` | Está selecionado: a data, cada dia de um intervalo completo (incluindo as extremidades, como o range calendar do React Aria), o início de um intervalo parcial, o mês ou ano exibido, o toggle da visão aberta. Leitores de tela o anunciam como selecionado. |
| `disabled:` | Não recebe toques: uma data desabilitada, um dia da semana, o título de um mês, Anterior e Próximo na visão de meses ou nos limites dos anos. |
| `focus:` | Tem o teclado. |
| `data-range-start:`, `data-range-end:` | É o primeiro ou o último dia de um intervalo completo (um intervalo de um dia é ambos). |
| `data-range-middle:` | É um dia dentro de um intervalo completo, mas não uma extremidade. |
| `data-today:` | É hoje. |
| `data-outside:` | É um dia do mês anterior ou posterior, completando as semanas. |

As variantes `data-*` são as do Tailwind (`data-range-start:` corresponde a `[data-range-start]`), como o calendar do shadcn estiliza seus dias; com `group` em `itemClass`, o conteúdo as acompanha com `group-selected:`, `group-data-range-middle:` e assim por diante. `selected:` significa todos os dias de um intervalo, de modo que as extremidades do intervalo assumem o seu visual por cima dele (as variantes posteriores vencem: `data-*` vem depois de `selected:`), e os dias do meio assumem o seu:

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` desenha o conteúdo de um item a partir do que ele é, um `CalendarEntry`, nunca a partir do seu estado: o desenho é feito uma vez e mantido enquanto o item está selecionado, focado ou dentro de um intervalo, de modo que as teclas, uma escolha e o foco não redesenham nada, e uma passagem de meses desenha uma única vez os dias que ela traz (um dia mantém seu desenho pelo mês e pela data: com vários meses, os meses que continuam visíveis mantêm os seus).

| Campo | Significado |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` ou `"year"`. |
| `value` | Seu número: o dia do mês, o mês (1 a 12), o ano, o dia da semana (`0` domingo a `6`); `0` para Anterior e Próximo. |
| `date` | A data ISO de um dia. |
| `year`, `month` | O ano e o mês a que pertence: o de um dia (o mês cujas semanas o exibem), o de um toggle ou título de mês, o de um mês da visão de meses; o ano do toggle de ano e o de um ano são o seu próprio ano. `0` para Anterior, Próximo e os dias da semana (e `month` para o toggle de ano e os anos). |
| `today` | O dia é hoje. |
| `outside` | O dia é do mês anterior ou posterior. |

Sem `renderItem`, um item mostra o seu número, e Anterior e Próximo mostram `‹` e `›`, como o de `gpui-base`; um dia da semana também mostra o seu número, de `0` a `6`, já que os nomes dos meses e dos dias da semana são palavras do app, no idioma do app.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | nenhum | O valor, controlado pelo app. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | O valor inicial, sem `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Escolhe um intervalo: o primeiro toque o inicia, o segundo o encerra. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Quantos meses são exibidos lado a lado. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | O dia em que as semanas começam, de `0` domingo a `6` sábado. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | nenhum | As datas que não podem ser escolhidas. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 anos para cada lado | Os anos que a visão de anos percorre, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para Anterior. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem para Próximo. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O cabeçalho: Anterior, os toggles (ou os títulos dos meses), Próximo. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O corpo: os meses lado a lado, ou as linhas da visão de meses ou de anos. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada mês da visão de dias. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | nenhum | Cada linha: os dias da semana, uma semana, uma linha de meses ou de anos. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | nenhum | Cada item: `selected:`, `disabled:`, `focus:`; de um dia, `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Itens](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | nenhum | O conteúdo de um item, desenhado pelo app a partir do que o item é; caso contrário, o seu número. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O calendário: o cabeçalho acima do corpo. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | O usuário escolheu um valor completo: `{ value }`, um dia ou um intervalo. Defina `value` para acompanhá-lo. Um `value` passado pelo app nunca é informado. |

<a id="parts"></a>

## Partes

| Parte | Onde | Estilizada com |
|---|---|---|
| O calendário | a raiz | `class`, `style` |
| O cabeçalho | o calendário, primeiro | `headerClass`, `headerStyle` |
| O corpo | o calendário, depois do cabeçalho | `bodyClass`, `bodyStyle` |
| Um mês | o corpo (visão de dias) | `monthClass`, `monthStyle` |
| Uma linha | um mês, ou o corpo (visões de meses e de anos) | `rowClass`, `rowStyle` |
| Um item | o cabeçalho e as linhas | `itemClass`, `itemStyle`, `renderItem` (`group-selected:`, `group-data-range-middle:`, ... dentro, sob `group` em `itemClass`) |

<a id="keyboard"></a>

## Teclado

Os dias formam uma única parada do Tab: ele cai no dia selecionado, senão em hoje, senão no primeiro dia exibido. Em seguida:

| Tecla | Ação |
|---|---|
| Esquerda / Direita | O dia anterior ou posterior. |
| Cima / Baixo | O mesmo dia uma semana antes ou depois. |
| Home / End | O primeiro ou o último dia da semana. |
| Page Up / Page Down | O mesmo dia um mês antes ou depois. |
| Shift+Page Up / Shift+Page Down | O mesmo dia um ano antes ou depois. |
| Return, Space | Escolhe o dia. |

Em um layout da direita para a esquerda, as semanas correm a partir da direita, de modo que Esquerda é o dia posterior e Direita o dia anterior; Cima e Baixo mantêm as semanas. Ir além dos meses exibidos os passa. Anterior, os toggles, Próximo, os meses e os anos recebem toques.
Os dias de `gpui-base` recebem apenas toques; as teclas são as do NSH, seguindo o date picker dialog do WAI-ARIA.

<a id="accessibility"></a>

## Acessibilidade

- Cada dia é um botão nomeado por sua data ISO, selecionado enquanto for a data ou um dia do intervalo (incluindo as extremidades, como o range calendar do React Aria), e esmaecido enquanto estiver desabilitado.
- Anterior e Próximo são botões nomeados por `previousAccessibilityLabel` e `nextAccessibilityLabel`; os toggles, os meses e os anos são botões nomeados pelo que mostram.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.
