---
title: "Avatar"
description: "Os componentes Avatar e AvatarGroup: a foto de uma pessoa, ou um fallback enquanto ela carrega, quando falha e quando não existe, com o estado de carregamento executado nativamente; e uma fileira de avatares que mostra os primeiros e representa os demais."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---


# Avatar

Um avatar mostra a foto de uma pessoa: um membro de uma equipe, o autor de um comentário, a conta em um cabeçalho. Enquanto a foto não carregou, quando ela falha e quando não existe, ele mostra um fallback: as iniciais do `name` da pessoa ou o próprio conteúdo do app (um ícone). Ele controla o estado de carregamento da foto, executado nativamente a partir dos eventos de load e error da própria imagem, sem JavaScript, e define o que os leitores de tela recebem: uma imagem rotulada com o nome da pessoa. A aparência é do app: um `Avatar` não tem tamanho, forma, cores nem fonte próprios. Um `AvatarGroup` mostra os primeiros avatares de uma linha e um excedente que representa os demais ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` e `AvatarGroup` vêm de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `avatar()` e `avatar_group()` os criam com um setter por prop (`.src(..)`, `.fallback_delay(..)`), os métodos de estilo tipados para o próprio avatar e `.child(..)` para o que fica sobre a foto.

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | nenhum | A foto, como o `src` de [`<Image>`](./image.md) a recebe: uma URL, uma URI `asset:/` ou `data:`, uma URL `blob:` (uma foto escolhida pelo usuário: `URL.createObjectURL(file)`) ou uma imagem importada. Ela aparece depois de carregada; uma string vazia significa nenhuma foto. |
| `name` | `.name(..)` | `string` | nenhum | O nome da pessoa: o que os leitores de tela dizem e as iniciais que o fallback mostra quando o app não passa `fallback`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | O que os leitores de tela dizem, com prioridade sobre `name`. `""` torna o avatar decorativo, oculto para os leitores de tela. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | Quanto tempo o fallback espera enquanto a foto carrega, para que uma foto que carrega rápido apareça sem o fallback piscar antes. `Infinity`: sem fallback durante o carregamento, apenas quando a foto falha ou não existe. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A foto: seu ajuste, raio e movimento. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | O fallback: seu fundo, cor e tamanho do texto, e como ele alinha o conteúdo. |
| `fallback` | `.fallback(..)` | `JSX.Element` | as iniciais | O conteúdo do fallback no lugar das iniciais: um ícone, um placeholder para alguém sem nome. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O que aparece sobre a foto: um indicador de presença, um badge. Os leitores de tela ouvem o rótulo do avatar, não esses itens (veja [Acessibilidade](#accessibility)). |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | O próprio avatar: seu tamanho e forma. |

| Evento | Rust | Payload | Descrição |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | O status da foto mudou: `"idle"` (sem `src`), `"loading"`, `"loaded"` ou `"error"`. |

<a id="parts"></a>

## Partes

| Parte | Dentro de | Estilizada com |
|---|---|---|
| O avatar | | `class`, `style` |
| O fallback | o avatar, primeiro, do mesmo tamanho dele; presente enquanto a foto carrega (após `fallbackDelay`), falha ou não existe | `fallbackClass`, `fallbackStyle`; seu conteúdo são as iniciais ou `fallback` |
| A foto | o avatar, sobre o fallback, preenchendo-o | `imageClass`, `imageStyle` |
| O conteúdo do app | o avatar, por último | seus próprios elementos (`children`) |

Defina o tamanho do avatar (`class="size-10"`): o fallback e a foto o preenchem, então a saída do fallback não provoca novo layout. A foto recebe o layout desde o início, transparente, e fica opaca assim que carrega; o fallback então sai. Um `transition-opacity` em `imageClass` a exibe com fade (com movimento reduzido, ela aparece de imediato). Arredonde a foto e o fallback (`rounded-full` em cada um) em vez de recortar o avatar, para que um indicador de presença posicionado na borda (`absolute bottom-0 right-0`) permaneça inteiro.

As iniciais são as primeiras letras das duas primeiras palavras do nome, em maiúsculas ("Ada Lovelace" vira "AL"); uma palavra única dá suas duas primeiras letras ("huacnlee" vira "HU"), e um nome em um sistema de escrita sem distinção de maiúsculas e minúsculas dá o primeiro caractere ("王小明" vira "王").

<a id="groups"></a>

## Grupos

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | No máximo esta quantidade de avatares é exibida, os primeiros; os demais não criam views. |
| `total` | `.total(..)` | `number` | o número de filhos | Quantas pessoas o grupo representa, quando o app passa apenas as primeiras delas. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem sobre o grupo. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nenhum | A parte de excedente, depois dos avatares exibidos. |
| `overflow` | `.overflow(..)` | `JSX.Element` | nenhum | O que representa as pessoas não exibidas ("+5", "⋯"), presente enquanto houver no grupo mais pessoas do que avatares exibidos. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem sobre o excedente no lugar do seu conteúdo: "5 pessoas a mais" para um "+5". |
| `children` | `.child(..)` | `JSX.Element` | nenhum | Os avatares, em ordem. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A linha: sua direção (`flex-row`) e espaçamento. |

A sobreposição, os anéis e a forma do excedente são do app: uma margem negativa em cada avatar após o primeiro (`-ml-2`) os empilha, e um anel da cor do fundo os separa. Para uma lista longa, passe apenas as primeiras `limit` pessoas e `total`: somente os avatares exibidos são criados. A contagem que o excedente representa é `total` menos os avatares exibidos, que são o menor valor entre o número de filhos e `limit`: `total={8}` com dois filhos mostra dois avatares e "+6".

<a id="accessibility"></a>

## Acessibilidade

- Um avatar é uma única imagem para os leitores de tela, rotulada com `accessibilityLabel` ou `name`: o nome é dito uma só vez. O fallback e a foto ficam ocultos para eles, então as iniciais não são lidas separadamente. Um avatar sem nenhum dos dois, ou com `accessibilityLabel=""`, é decorativo: oculto para os leitores de tela, como deve ser um avatar ao lado do nome que ele mostra.
- Um grupo é um grupo, rotulado com seu `accessibilityLabel` ("Ada, Grace e outras 5 pessoas"); os avatares exibidos são imagens dentro dele. O excedente é lido como seu conteúdo ("+5"), ou como `overflowAccessibilityLabel` ("5 pessoas a mais") quando o app fornece um: o NSH não escreve nenhum texto próprio.
- Um avatar é um único elemento para os leitores de tela, então o que seus filhos mostram não é lido separadamente e, no iOS, um botão ou um link entre eles não pode ser alcançado de forma alguma. Diga o que um indicador de presença ou um badge significa em `accessibilityLabel` ("Ada Lovelace, online") e coloque o que pode ser pressionado ao lado do avatar, não dentro dele.
- Nenhum dos dois recebe toques nem foco de teclado: coloque um avatar em um `Button` para torná-lo interativo.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- Cada plataforma carrega a foto com seu próprio carregador de imagens e caches (veja [Image](./image.md)); seus eventos de load e error alteram o estado do avatar em Rust, de modo que uma foto em carregamento ou com falha altera a foto e o fallback e nada mais.
- A foto começa a carregar assim que tem um frame, por isso permanece com layout enquanto está transparente.
