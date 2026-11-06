---
title: "Acessibilidade"
description: "Como fazer os apps funcionarem com VoiceOver e TalkBack - rótulos, funções, estados, valores, ações personalizadas, agrupamento e ocultação, anúncios e foco, tamanho do texto e redução de movimento."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---


# Acessibilidade

NSH renderiza com views nativas, então as tecnologias assistivas das plataformas (VoiceOver no iOS e no Mac Catalyst, TalkBack no Android, Switch Control, Voice Control, ...) enxergam a hierarquia real de views do seu app. O que você adiciona são as descrições que essas tecnologias não conseguem inferir: o que um elemento é, o que ele diz, em que estado está e o que pode fazer. Todo elemento aceita os métodos (Rust) e as props (TSX) abaixo.

<a id="what-you-get-without-doing-anything"></a>

## O que você ganha sem fazer nada

- **O texto é lido.** Um elemento de texto é um elemento de acessibilidade cujo rótulo é o próprio texto. Uma view sem rótulo é lida como os textos que ela contém.
- **Views pressionáveis são elementos.** Uma view com um handler de pressionar ou de pressionar e segurar (`.on_press`, `onPress`) é, por padrão, um elemento de acessibilidade, e ativá-la (toque duplo com VoiceOver ou TalkBack) a pressiona.
- **Inputs são campos de texto**, com seu placeholder, valor e teclado.
- **O texto acompanha a configuração de tamanho do usuário.** Veja [Tamanho do texto](#text-size).

<a id="labels-hints-and-roles"></a>

## Rótulos, dicas e papéis

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | Tipo | Descrição |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | A view é um único elemento para as tecnologias assistivas; seus filhos não são expostos separadamente. |
| `.label(..)` | `accessibilityLabel` | `string` | O que os leitores de tela leem, no lugar dos textos internos. |
| `.hint(..)` | `accessibilityHint` | `string` | O que a ativação do elemento faz, lido após uma pausa. |
| `.role(..)` | `role` | `AccessibilityRole` | O que o elemento é. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Seu estado: desabilitado, selecionado, marcado, ocupado, expandido, pressionado, atual. `selected` também aplica o estilo de selecionado, `checked` o estilo de marcado quando verdadeiro e o estilo de indeterminado quando `"mixed"`, `pressed` o estilo de pressionado quando verdadeiro. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | O nível de um título (1 é o mais alto), a profundidade de um item de árvore (1 no topo). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | O valor de um elemento de intervalo ou textual. |
| | `accessibilityActions` | `{ name, label? }[]` | Ações oferecidas às tecnologias assistivas. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | Uma ação foi executada (Rust: seu nome). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Oculta a view e sua subárvore das tecnologias assistivas. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Se a view (e sua subárvore) está exposta. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: como as mudanças da view são anunciadas ao TalkBack. |
| `.test_id(..)` | `testID` | `string` | Um identificador para testes de UI (o accessibility identifier no iOS, o resource id no Android); não é lido em voz alta. |

Dê um rótulo a todo controle que tenha apenas ícone: um leitor de tela não consegue ler um glifo ou uma imagem. Mantenha os rótulos curtos e não inclua o papel ("Reproduzir", não "Botão reproduzir"): o papel é anunciado separadamente.

<a id="roles"></a>

### Papéis

O papel (`.role(AccessibilityRole::Header)`, `role="header"`) diz ao usuário que tipo de elemento é e como operá-lo. Em Rust, é uma variante de `AccessibilityRole` (`Button`, `Header`, `Switch`, ...); os valores em TSX são `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` e `"cell"` (os papéis das partes de [`Table`](../elements/table.md)), `"listbox"` e `"option"` (uma lista de opções para escolher, como a lista de [`Select`](../elements/select.md), e suas opções, com a escolhida marcada por `accessibilityState.selected`), `"group"` (elementos relacionados que pertencem ao mesmo conjunto), `"region"` (uma seção que vale ser alcançada por si só, como o painel de um accordion), `"navigation"` (links que navegam pelo app, como uma paginação), `"tree"` e `"treeitem"` (itens que expandem e recolhem, cada um em seu `accessibilityLevel`), `"menuitemcheckbox"` e `"menuitemradio"` (itens de menu que são marcáveis, isolados ou como uma escolha de um grupo).

Os mais úteis:

- `"button"` para qualquer elemento pressionável que não seja um link; `"link"` para navegação até um conteúdo.
- `"header"` para títulos de seção: usuários de leitores de tela pulam entre cabeçalhos para percorrer uma tela. `accessibilityLevel` informa seu nível (1 é o mais alto) onde a plataforma o lê.
- `"button"` com `accessibilityState.pressed` para um botão de alternância, que permanece ligado ou desligado (negrito em uma barra de ferramentas).
- `"navigation"` em volta de links que navegam entre páginas, com o link da página exibida marcado com `accessibilityState.current: "page"`.
- `"switch"`, `"checkbox"`, `"radio"` com `accessibilityState.checked`.
- `"adjustable"` para sliders e steppers, com `accessibilityValue` e as ações `increment` / `decrement`
  (cada thumb de um [`Slider`](../elements/slider.md) é um deles).
- `"spinbutton"` para um campo que guarda um número que o usuário também pode incrementar ou decrementar, com o mesmo valor e as mesmas ações (o
  campo de um [`NumberInput`](../elements/number-input.md)).
- `"image"` para imagens significativas, com um rótulo; imagens decorativas devem ser ocultadas.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### Estados e valores

Para um controle de ligar / desligar em um app, use [`Switch`](../elements/switch.md) de `nsh/base`, que define o papel e o estado por conta própria. O exemplo mostra o que um papel e um estado em uma view fazem.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

O estado é `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` em Rust e `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` em TSX. `pressed` faz de um botão um botão de alternância (o `aria-pressed` do ARIA); `current` marca o item atual de um conjunto (o `aria-current` do ARIA): a página de uma paginação, a etapa de um assistente. `disabled` também é implícito quando a view é desabilitada (`.disabled(..)`, `disabled`). `accessibilityValue` com `min`, `max` e `now` é lido como porcentagem; com `text` é lido como informado ("3 de 10", "Médio").

<a id="actions"></a>

## Ações

Uma view pressionável já suporta ativação. Para qualquer outra, declare ações com `accessibilityActions` e trate-as com `onAccessibilityAction`; um componente Rust recebe o nome da ação executada com `.on_accessibility_action(|name: &str| ..)`:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

Alguns nomes de ação são padronizados e correspondem aos gestos nativos das plataformas:

| Nome | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Toque duplo | Toque duplo (clique) |
| `increment`, `decrement` | Deslizar para cima / baixo; em seguida, o VoiceOver lê o novo valor | Rolar para frente / para trás |
| `longpress` | | Toque duplo e segurar |
| `expand`, `collapse` | | Expandir / recolher |
| `magicTap` | Toque duplo com dois dedos | |
| `escape` | Gesto em Z com dois dedos | |

Um elemento com `increment` ou `decrement` é ajustável, qualquer que seja seu papel: um gráfico mantém o papel `"image"` e percorre seus pontos com os deslizes do VoiceOver e as rolagens do TalkBack, com seu `accessibilityValue` lido após cada passo.

Qualquer outro nome se torna uma ação personalizada, listada no rotor de ações do VoiceOver e no menu de ações do TalkBack com seu `label` (ou seu nome). Ações personalizadas são a forma acessível de deslizar para excluir e gestos semelhantes:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Agrupar e ocultar

Tornar uma view acessível (`.accessible(true)`, `accessible`) faz dela um único elemento: um card com título, subtítulo e preço é lido de uma só vez, em vez de o usuário deslizar por três textos.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

Oculte o que não acrescenta nada: imagens decorativas, divisores, um ícone ao lado de um texto que já diz a mesma coisa.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (o nome no iOS) e `importantForAccessibility="no-hide-descendants"` (o nome no Android) ocultam a subárvore nas duas plataformas; definir ambos é inofensivo.

<a id="the-screen-reader-and-the-users-settings"></a>

## O leitor de tela e as configurações do usuário

Em Rust, o prelude informa as configurações do usuário e se comunica com o leitor de tela: `screen_reader()` e `reduce_motion()` são reativos, `announce_for_accessibility(message)` faz o leitor de tela ler uma mensagem, e o `element_ref()` de um elemento move o foco do leitor de tela para ele com `set_accessibility_focus()`. Em TSX, a API de acessibilidade de `nsh` informa as configurações do usuário e permite que você se comunique com o leitor de tela.

| Membro | Descrição |
|---|---|
| `screenReaderEnabled()` | Se o VoiceOver ou o TalkBack está em execução (reativo). |
| `reduceMotion()` | Se o usuário pediu menos movimento (reativo). |
| `announce(message)` | O leitor de tela lê `message`. |
| `setAccessibilityFocus(ref)` | Move o foco do leitor de tela para uma view. |

As configurações são accessors: leia-as em um binding ou em um effect, e o que as lê é atualizado quando o usuário muda a configuração, sem necessidade de cleanup.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

Anuncie mudanças que o usuário perderia de outra forma: um salvamento em segundo plano que terminou, um erro que aparece longe do foco, um timer que acabou. No Android, `android={{ accessibilityLiveRegion: "polite" }}` em uma view faz o TalkBack anunciar suas mudanças por conta própria.

<a id="text-size"></a>

## Tamanho do texto

Textos e inputs acompanham o tamanho de texto do sistema (Dynamic Type no iOS, tamanho da fonte no Android), a menos que você desative isso (`.allow_font_scaling(false)`, `allowFontScaling={false}`). Em vez de desativar, projete pensando nisso:

- Deixe o texto quebrar linha: evite alturas fixas em views que contêm texto.
- Limite títulos muito grandes com `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` em vez de desativar o escalonamento.
- Troque de layout quando o texto for grande: leia `font_scale()` (Rust) ou `fontScale()` de `nsh` (TSX) (por exemplo, empilhe um rótulo e seu valor na vertical acima de 1,3).

Veja [Dispositivo e ambiente](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Movimento reduzido

`reduce_motion()` (Rust) e `reduceMotion()` (TSX) são `true` quando o usuário ativou o Reduce Motion do iOS ou a configuração de remover animações do Android. Suas animações rodam como você as escreveu; por isso, use essa informação, ou as variantes `motion-reduce:` e `motion-safe:` do Tailwind, para substituir movimentos grandes por um fade ou por uma mudança instantânea:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## Alvos de toque

Faça os elementos pressionáveis terem pelo menos 44 × 44 pontos. Quando um controle precisar parecer menor, amplie sua área de toque com o hit slop (`.hit_slop(..)`, `hitSlop`) em vez de seu tamanho; veja [Toque e gestos](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Verificando seu app

- Ative o VoiceOver (Ajustes do iOS, Acessibilidade, ou clique três vezes no botão lateral, se configurado) ou o TalkBack, e use o app sem olhar: todo controle deve dizer o que é e o que faz.
- Nos simuladores do iOS, o Accessibility Inspector do Xcode mostra o rótulo, os traits e o valor de cada elemento.
- Experimente o maior tamanho de texto e o modo escuro.
- Um test id (`.test_id(..)`, `testID`) dá aos testes de UI uma referência estável que não muda com o idioma do rótulo.

<a id="related"></a>

## Relacionados

- [API de acessibilidade de `nsh`](../modules/nsh.md#accessibility): a referência.
- [`View`](../elements/view.md): todas as props de acessibilidade.
- [Animação](./animation.md#reduced-motion) e [Dispositivo e ambiente](./device-and-environment.md).
