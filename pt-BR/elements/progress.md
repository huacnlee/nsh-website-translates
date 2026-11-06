---
title: "Progress"
description: "O componente Progress: uma barra de progresso linear que é responsável pelo papel, pelo intervalo e pelo valor para leitores de tela, e pela largura do indicador de acordo com o valor, com uma trilha e um indicador que o app estiliza."
group: base
demo: el-progress
source_hash: c9a75dc1aac1177f
---


# Progress

Uma barra de progresso mostra até onde chegou uma tarefa de extensão conhecida (um download, um upload, uma etapa de configuração) ou, enquanto `indeterminate`, que uma tarefa de extensão desconhecida está em andamento. Ela é responsável pelo que os leitores de tela recebem, o papel de barra de progresso com o intervalo de 0 a 100 e o valor, e pela largura do indicador: `value` por cento da largura da trilha. A aparência fica a cargo do app: um `Progress` não tem cores, tamanhos, raios, movimento nem rótulo próprios. Ele é composto por uma trilha com um indicador dentro e, em seguida, seus filhos (um rótulo, o valor como texto), e o app estiliza cada parte.

```rust tabs
use nsh_base::{progress, theme};
use nsh_core::prelude::*;

fn upload(sent: Signal<f32>) -> impl IntoElement {
    progress()
        .value(sent)
        .accessibility_label("Uploading photos")
        .gap_2()
        .track_style(|s| s.h(px(8.0)).rounded_full().overflow_hidden().bg(move || theme().muted))
        .indicator_style(|s| s.h_full().rounded_full().bg(move || theme().primary))
        .child(
            text(move || format!("{:.0}%", sent.get()))
                .text_sm()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Progress } from "nsh/base";

function App() {
  const sent = signal(40);
  return (
    <Progress
      value={sent()}
      accessibilityLabel="Uploading photos"
      class="gap-2"
      trackClass="h-2 overflow-hidden rounded-full bg-muted"
      indicatorClass="h-full rounded-full bg-primary"
    >
      <Text class="text-sm text-muted-foreground">{`${sent()}%`}</Text>
    </Progress>
  );
}

mount(App);
```

`Progress` vem de [`nsh/base`](../modules/nsh-base.md), a crate `nsh-base` em Rust. O valor é do app: a barra de progresso mostra o `value` que o app passa, limitado de 0 a 100. Em Rust, `progress()` cria uma com um setter por prop (`.value(..)`, `.indicator_style(..)`), os métodos de estilo tipados para a própria barra de progresso e `.child(..)` para o seu rótulo.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `value` | `.value(..)` | `number` | `0` | Quanto da tarefa já foi feito, como porcentagem de 0 a 100 (fora do intervalo, vale o extremo mais próximo). O indicador ocupa essa parte da largura da trilha, e os leitores de tela a anunciam. |
| `indeterminate` | `.indeterminate(..)` | `boolean` | `false` | A extensão da tarefa é desconhecida: os leitores de tela ouvem uma barra de progresso sem valor, e a largura do indicador fica a cargo do app (`indicatorClass`). |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem: o que está em andamento, quando os filhos não têm texto que diga isso. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A trilha, a parte que o indicador preenche. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O indicador, dentro da trilha: sua altura, cor e movimento. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo depois da trilha: um rótulo ou o valor como texto, que os leitores de tela anunciam. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A própria barra de progresso: a coluna (ou linha) ao redor da trilha e do rótulo. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| A barra de progresso | | `class`, `style` |
| A trilha | a barra de progresso, primeiro | `trackClass`, `trackStyle` |
| O indicador | a trilha | `indicatorClass`, `indicatorStyle`; sua largura é `value` por cento da largura da trilha |
| O rótulo | a barra de progresso, depois da trilha | seus próprios elementos (`children`) |

O indicador começa na borda inicial da trilha; `overflow-hidden` e um raio na trilha arredondam a extremidade dele junto com a da trilha. Uma classe `w-*` ou um `width` em `indicatorStyle` substitui a largura derivada do valor, que é como uma barra indeterminada ganha a sua própria.

<a id="indeterminate"></a>

## Indeterminada

Enquanto a extensão é desconhecida, defina `indeterminate` e dê ao indicador uma largura e um movimento próprios do app. O movimento é escolha do app, e `motion-reduce:` o mantém parado para quem pede menos movimento:

```tsx
<Progress
  value={0}
  indeterminate={connecting()}
  trackClass="h-2 overflow-hidden rounded-full bg-muted"
  indicatorClass={
    connecting()
      ? "h-full w-1/3 rounded-full bg-primary animate-pulse motion-reduce:animate-none"
      : "h-full rounded-full bg-primary"
  }
/>
```

<a id="accessibility"></a>

## Acessibilidade

- Uma barra de progresso é um único elemento para os leitores de tela, com o papel `"progressbar"`, o intervalo de 0 a 100 e seu valor (o VoiceOver e o TalkBack o anunciam como porcentagem); a trilha e o indicador são partes dela. Seu rótulo é o texto de seus filhos; informe `accessibilityLabel` quando ela não tiver nenhum.
- Enquanto `indeterminate`, ela mantém o papel e o intervalo e não tem valor (no navegador: `aria-valuenow` é omitido, como o ARIA define para uma barra de progresso indeterminada).
- Ela não recebe toques nem foco do teclado: ela apenas informa, e os controles que iniciam ou interrompem a tarefa são do app.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas sobre plataformas

- Todas as plataformas desenham o que o app estiliza; a largura do indicador acompanha `value` imediatamente, e a mudança é animada quando o app a anima.
- Leitores de tela: o VoiceOver (iOS, macOS) ouve o valor como porcentagem e a barra como atualizada com frequência; o TalkBack, o UI Automation (Windows), a acessibilidade do GTK (Linux) e o navegador (`aria-valuenow`) recebem o intervalo e o valor.
