---
title: "Link"
description: "O componente Link: conteúdo que leva a algum lugar quando pressionado, seja uma página, um site ou uma rota do app, com suporte a toques, ativação por teclado, estado desabilitado e a função de link para leitores de tela, estilizado pelo app."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---


# Link

Um link leva o usuário a algum lugar: uma página web, outro app (`mailto:`, `tel:`) ou uma tela do próprio app. Ele é dono do comportamento: toques, Return e Espaço enquanto tem o foco do teclado, o estado desabilitado e o papel de link para leitores de tela. A aparência é do app: um `Link` não tem cor, sublinhado nem rótulo próprios, e o que aparece são seus filhos. `href` diz para onde ele vai; é um dado para a abertura, nunca um texto na tela.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` vem de [`nsh/base`](../modules/nsh-base.md), o crate `nsh-base` em Rust. Em Rust, `link()` cria um com um setter por prop (`.href(..)`, `.open_with(..)`), um listener por evento (`.on_open(..)`, `.on_press(..)`), os métodos de estilo tipados para o link e `.child(..)` para o seu conteúdo.

<a id="opening"></a>

## Abertura

Um toque, um clique, ou Return ou Espaço no link focado abre seu `href`:

1. `onOpen({ href })` informa para onde ele vai.
2. Com `openWith="system"` (o padrão), uma URL de outro app ou site, ou seja, uma com esquema (`https:`, `mailto:`, `tel:`, um esquema que outro app registrou), abre fora do app, como [`openUrl`](../modules/nsh.md) a abre: primeiro o roteador do app anfitrião a recebe, depois o sistema. Qualquer outro `href`, um caminho do próprio app (`/orders/42`) ou `#anchor`, é informado e permanece com o app.
3. `onPress()` informa o toque.

Com `openWith="app"`, o handler `onOpen` do app é a forma como o link abre: uma rota própria, uma página em uma web view dentro do app, uma confirmação antes.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

Abrir uma URL fora do app exige a capability `openUrl` quando o app declara capabilities em `nsh.json` (`"openUrl": true` ou `{ "schemes": ["https", "mailto"] }`).

## Props

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | nenhum | Para onde o link vai: uma URL ou um caminho do próprio app. Informado com `onOpen`, nunca exibido. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Quem abre `href`: o sistema abre uma URL de outro app ou site; `"app"` deixa a cargo de `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Sem toques, sem feedback de toque, sem foco do teclado; os estilos `disabled:` são aplicados, e os leitores de tela dizem que ele está esmaecido. |
| `current` | `.current(..)` | `boolean` | `false` | O link para a página em que o usuário está, em uma navegação ou em um breadcrumb: os leitores de tela dizem que é a página atual. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nenhum | O que os leitores de tela dizem, quando o conteúdo diz pouco (um ícone). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nenhum | Quão além de seus limites os toques ainda contam, em pontos: um número para todos os lados, ou os lados nomeados. Como o `hitSlop` de uma view. |
| `children` | `.child(..)` | `JSX.Element` | nenhum | O conteúdo: um rótulo, um ícone, qualquer coisa que o app mostre. |
| `class`, `style` | métodos de estilo | `string`, `StyleProp<ViewStyle>` | nenhum | A aparência do link: sua cor, sublinhado, padding; as propriedades de texto são repassadas aos textos dentro dele. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nenhum | O estilo do link enquanto pressionado, com hover, focado ou desabilitado, como as classes `<state>:`. |

<a id="events"></a>

## Eventos

| Evento | Rust | Descrição |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | O link abre `href`: com `openWith="app"` o handler o abre, com `"system"` ele ouve o que o sistema foi solicitado a abrir. Vem antes de `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | O link foi pressionado: um toque, um clique, ou Return ou Espaço enquanto ele tem o foco do teclado. |

Um link desabilitado não informa nada, e um toque nele não chega a nenhuma view pressionável ao redor.

<a id="states"></a>

## Estados

O app estiliza cada estado com classes ou props de estilo:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Um link visitado é responsabilidade do app lembrar: ele guarda os hrefs que abriu e estiliza esses links por seu próprio estado.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## Dentro de texto

Um `Link` dentro de um `<Text>` é uma caixa inline do parágrafo, como toda view dentro de um texto: ele fica na linha, mantém seus próprios estados, foco e papel, e permanece em uma única linha. `align-text-bottom` posiciona um link com uma linha de texto na linha de base do parágrafo:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Um link que quebra junto com as linhas do parágrafo é um `<Text>` aninhado com `role="link"` e `onPress` (veja [Text](./text.md)), como o [TextView](./text-view.md) desenha os links de um documento.

<a id="a-small-target-with-hitslop"></a>

## Um alvo pequeno com hitSlop

Um link pode ser menor que um dedo: um ícone, uma palavra curta. `hitSlop` faz com que toques que caem perto dele contem, em pontos além de cada lado, sem mudar seu layout nem sua aparência: um número para todos os lados, ou os lados nomeados (`{ top: 8, bottom: 8 }`), como o [`hitSlop` de uma view](./index.md#presses-and-feedback) os recebe.

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Acessibilidade

- Um link é um único elemento para leitores de tela, com o papel `"link"`; seu rótulo é o texto de seus filhos, ou `accessibilityLabel`. `href` continua sendo dado: os leitores de tela dizem o rótulo.
- `current` é dito como a página atual (o `aria-current="page"` do ARIA), e `disabled` como a plataforma diz um elemento esmaecido.
- No macOS e na web, um link é uma parada do foco do teclado: Tab chega até ele, Return e Espaço o abrem, e os estilos `focus:` mostram onde está o foco.

Veja [Acessibilidade](../docs/accessibility.md) para rótulos, papéis e anúncios em geral.

<a id="platform-notes"></a>

## Notas de plataforma

- iOS, Android e Mac Catalyst: um toque é um tap que termina no link.
- Desktops (macOS, Windows, Linux, GPUI) e a web: um toque é um clique. No macOS e na web, Return e Espaço também abrem o link que tem o foco do teclado.
- A web renderiza um link como um elemento com `role="link"`.
- Todas as plataformas desenham o que o app estiliza.
