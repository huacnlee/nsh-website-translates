---
title: "Elements"
description: "As primitivas e os componentes base com os quais todo app NSH é construído, em Rust e TSX, além das props, eventos e métodos de ref que todos eles compartilham."
order: 1
source_hash: 84e4cb96ec250ab2
---


# Elements

Native Shell constrói cada tela a partir de um pequeno conjunto de elementos: primitivos como `View`, `Text` e `Image`, e componentes base como `Button`, `Dialog` e `NavStack`. Cada primitivo é uma view nativa (uma subclasse de UIView no iOS e no Mac Catalyst, um `View` do Android, uma view AppKit, GTK ou Win32 nos desktops), criada e posicionada pelo runtime do NSH. Tudo o que um app exibe é feito com eles: os botões, cards, linhas e telas de um app são componentes do próprio app, desenhados com esses elementos e estilizados por ele, de modo que a aparência do app é inteiramente sua.

Todo exemplo nestas páginas vem em Rust e em TSX: escolha uma aba, e todos os exemplos da página a acompanham.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Em Rust, os primitivos são funções de `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`) e os componentes base vêm do crate `nsh_base`. Os estilos são métodos tipados (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), os estilos de estado recebem uma closure (`.active(|s| s.opacity(0.6))`), os listeners são closures do seu evento (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`) e `.child(..)` adiciona filhos. Um trecho de UI é uma função comum que retorna `impl IntoElement`; ela executa uma única vez, e os signals que lê em closures (`text(move || ..)`, `.bg(move || ..)`) atualizam aquilo a que estão ligados. Veja [Criando com Rust](../docs/rust.md).

Em TSX, toda tag é PascalCase e nomeia um binding em escopo: os primitivos vêm de `nsh`, os componentes base de `nsh/base`. Apenas `<If>` e `<Each>` são globais e dispensam import. Uma tag em minúsculas como `<view>` é um erro de build, porque o TypeScript a verificaria contra um tipo global por nome, e componentes genéricos como `List` e `Each` não conseguiriam inferir os tipos de seus itens. O compilador reconhece os elementos pelos imports e cria as views nativas no próprio local, então importá-los não custa nada em tempo de execução. Veja [JSX e componentes](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## Primitivos

Importados de `nsh` em TSX, de `nsh_core::prelude` em Rust.

| Elemento | Rust | View nativa (iOS / Android) | Página |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; com `selectable`, os textos dentro dele são selecionados juntos | [View](./view.md), [Seleção de texto](./text-selection.md) |
| `<Text>` | `text(content)` | view CoreText / view StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | uma view com uma camada de imagem / uma view de imagem | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView com células recicladas | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | uma view que reproduz um desenho 2D | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | uma view cuja área é desenhada na GPU por um programa WGSL, sob seus filhos | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer sobre uma TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | uma view acima da janela (ou do diálogo em que está), posicionada em relação a uma âncora | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | fluxo de controle: os elementos que eles escolhem | [Fluxo de controle](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | uma barra sobre o teclado no iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Padding e margin mantêm o conteúdo afastado da UI do sistema com o `env()` do CSS: `env(safe-area-inset-top)` e as demais bordas ([Área segura](./safe-area.md)) e `env(keyboard-inset-height)` ([Teclado](./keyboard.md)).

## Base

Importados de `nsh/base` em TSX, do crate `nsh_base` em Rust. Eles cuidam do comportamento, do estado, do foco e da acessibilidade, e recebem a aparência do app.

| Componente | Rust | O que faz | Página |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | O alerta e o action sheet do sistema | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` e suas partes | `nsh_base::accordion()`, `accordion_item()`, ... | Seções empilhadas que se expandem e se recolhem sob seus títulos, uma por vez ou várias | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | A foto de uma pessoa, ou um substituto enquanto ela carrega ou quando falha, e uma fileira de fotos que mostra as primeiras | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Um controle pressionável, com seus estados e seu papel | [Button](./button.md) |
| `<Carousel>` e suas partes | `nsh_base::carousel()`, `carousel_content()`, ... | Slides exibidos um por vez, deslizados nativamente, com anterior / próximo, uma paginação, as teclas e um loop contínuo | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Um controle marcado, desmarcado ou indeterminado, com um indicador | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Uma região cujo conteúdo se expande e se recolhe | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Uma paleta de comandos: um campo de busca sobre comandos filtrados nativamente, uma lista virtualizada e as teclas de uma paleta Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Uma tabela de linhas e colunas em qualquer número, selecionável, ordenável, com colunas redimensionáveis e móveis | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Apresenta seus filhos sobre todo o resto | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | As mudanças entre dois textos ou de um patch, divididas ou unificadas | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Um espaço de trabalho de divisões, grupos de abas e docks de borda que o usuário organiza | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Um editor de código com realce de sintaxe, vários cursores, dobramento e busca | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Uma prévia do que seu gatilho aponta, enquanto o ponteiro repousa sobre ele | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | O campo de texto nativo (UITextField ou UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Um alvo de toque que abre uma página, um site ou uma rota do app | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Menus: popups com submenus em cascata nos desktops, sheets nos celulares | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Navegação nativa: uma pilha de páginas com o cabeçalho e os gestos de voltar da plataforma | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Um número digitado em um campo ou ajustado com botões e teclas | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Um código de uso único com um número fixo de dígitos, digitado, colado ou preenchido automaticamente em células | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | As páginas de um conjunto: Anterior, as páginas ao redor da atual, reticências e Próxima | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Itens que contêm itens, expandidos e recolhidos, com um selecionado: virtualizado, uma única parada do foco do teclado | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | A moldura de um gráfico e suas marcas, desenhadas nativamente a partir das linhas do app | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | Conteúdo ancorado a um gatilho, acima de todo o resto | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Uma barra de progresso: até onde uma tarefa foi, ou que ela está em andamento | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Uma opção de um conjunto do qual o usuário escolhe uma, e o conjunto | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Painéis lado a lado ou empilhados, com alças que os redimensionam | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Uma barra de rolagem com a aparência própria do app para uma scroll view ou uma lista | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Um valor escolhido de uma lista de itens, com teclado, busca e seções | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Um painel na borda da tela sobre um fundo escurecido | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Um valor, ou um intervalo de dois, escolhido ao longo de uma trilha | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Um controle liga / desliga com uma trilha e um polegar | [Switch](./switch.md) |
| `<Table>` e suas partes | `nsh_base::table()`, `table_row()`, ... | Uma tabela com as linhas e células do próprio app, com os papéis de uma tabela | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Uma aba de uma lista de abas, e a lista | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Exibe um documento Markdown ou HTML com textos e views | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | A raiz semântica de um toast; toasts dispostos como camadas a partir de uma borda | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Um botão que fica ligado ou desligado, e uma barra de ferramentas deles | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Uma barra de botões, toggles e links, uma única parada do foco do teclado | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Uma dica ao lado de seu gatilho, ao passar o ponteiro ou ao manter o dedo pressionado | [Tooltip](./tooltip.md) |

> [!NOTE]
> Uma string só é desenhada dentro de um `Text`. Uma string filha de um `View` não cria view nativa e não participa do layout.

<a id="common-props"></a>

## Props comuns

Todo primitivo aceita as props abaixo (o tipo `CommonProps` em TSX; os traits `Styled`, `Interactive` e `Accessible` em Rust). As páginas dos elementos listam apenas as suas próprias props. A coluna Rust indica o método do builder.

<a id="styling"></a>

### Estilização

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `style` | métodos `Styled` tipados; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` para `<Text>` e `<Input>`, `ImageStyle` para `<Image>`) | Estilo inline, ou um array de estilos mesclados da esquerda para a direita (entradas falsy são ignoradas; arrays podem ser aninhados, então `style={[base, props.style]}` aceita um `props.style` que é ele mesmo um array). Prevalece sobre `class`. Veja a [referência de estilos](../modules/style-reference.md). |
| `class` | métodos `Styled` tipados (`.flex_row().gap_2().p_4()`) | `string` | Classes Tailwind, resolvidas nativamente (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Classes posteriores prevalecem sobre as anteriores. Veja [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Classes aplicadas enquanto seu valor for truthy (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Ignora toques (sem feedback de toque também), aplica estilos `disabled:`, desabilita controles como inputs, e os leitores de tela informam que está desabilitado (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### Toques e feedback

O tratamento de toques roda nativamente: a plataforma reconhece o toque e aplica os estilos de toque do app, e o código do app só é avisado depois. Apenas a view pressionável mais interna responde; dentro de scroll views, o início do toque espera cerca de 130 ms para que uma rolagem possa começar primeiro.

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Um toque terminou dentro da view. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | O dedo permaneceu pressionado por `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Um dedo tocou a view. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | O dedo foi levantado ou saiu da view. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Milissegundos até que um toque se torne um toque longo. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Estende a área de toque além dos limites, em pontos. |

`PressEvent` é `{ position, pagePosition, modifiers, clickCount }`: onde o ponteiro estava na view e em sua view raiz (`Point`s), os modificadores pressionados quando o toque começou e os cliques consecutivos (2 para um clique duplo). Quando a plataforma não informa ponteiro, é a origem da view, sem teclas e com um clique.

A chave de estilo `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` em Rust, as classes `pointer-events-*`) decide quais toques a view e as views dentro dela recebem: `"none"` nenhum (uma view interna que defina `"auto"` volta a recebê-los), `"box-none"` somente as views dentro dela, `"box-only"` somente a própria view ([toque e gestos](../docs/touch-and-gestures.md#pointerevents)).

O feedback de toque é do app: `activeStyle` (ou as classes `active:`, `.active(..)` em Rust) se aplica enquanto a view está pressionada, nativamente, sem ida e volta ao código do app (abaixo).

<a id="state-styles"></a>

### Estilos de estado

Estilos que se aplicam enquanto a view está em um estado, por cima de seus próprios estilos, nativamente. Cada um é a forma de objeto de uma variante do Tailwind. Estados posteriores prevalecem (selected, checked e indeterminate, depois hover, focus, active); `disabledStyle` prevalece sobre todos, e os demais não se aplicam enquanto a view está desabilitada. Cada um recebe o estilo próprio do elemento: um `TextStyle` em um `<Text>`, um `InputStyle` em um `<Input>`, um `ImageStyle` em um `<Image>`, um `ViewStyle` nos demais casos.

| Prop | Rust | Variante de classe | Aplica-se |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Enquanto pressionada. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Enquanto um ponteiro está sobre a view. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Enquanto a view tem foco. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Enquanto a view ou uma view dentro dela tem foco (o conteúdo de um `Overlay` conta como dentro da view em que ele está). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Enquanto `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Enquanto `accessibilityState.checked` é `true` (um checkbox, um switch, um radio; `"mixed"` não está marcado). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Enquanto `accessibilityState.checked` é `"mixed"` (um checkbox que não está nem marcado nem desmarcado). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Enquanto `accessibilityState.selected` é `true` (um `Button` selecionado, uma aba). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Enquanto `accessibilityState.expanded` é `true` (o gatilho de um `Popover` ou `Menu` enquanto seu popup está aberto). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Enquanto `accessibilityState.pressed` é `true` (um botão toggle que está ligado; `"mixed"` não está pressionado). Não é `activeStyle`, um toque em andamento. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

O app percebe o mouse entrar sobre uma view, mover-se sobre ela e sair: no macOS, Windows, Linux, no backend GPUI e em navegadores desktop, com o ponteiro de um iPad ou o mouse de um Mac no iOS, e com um mouse ou uma stylus no Android. Os estilos de hover (`hover:`, `.hover(..)`) estilizam as views com hover nos mesmos lugares.

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | O mouse entrou sobre a view ou sobre uma view dentro dela (o `mouseenter` do DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | O mouse se moveu sobre a view (ou sobre uma view dentro dela), com ou sem botão pressionado, ou uma tecla modificadora foi pressionada ou solta enquanto ele está parado ali sem nenhum botão pressionado (o `mousemove` do DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | O mouse saiu da view e das views dentro dela, ou da janela; `e` é onde ele esteve por último (o `mouseleave` do DOM). |

Como o `:hover` do CSS e o `mouseenter` do DOM, uma view conta como com hover enquanto o mouse está sobre ela ou sobre qualquer coisa dentro dela, de modo que as views ao redor daquela que está sob o mouse também recebem `onMouseEnter` (de fora para dentro; `onMouseLeave` de dentro para fora). Os eventos chegam depois do fato e nunca em toques. Uma view removida de sob o mouse recebe `onMouseLeave`, no Linux e no Windows no próximo movimento do mouse.

`MouseEvent` informa onde o mouse está, como o `MouseMoveEvent` do GPUI: `position` na view (um `Point` em pontos, com suas transformações desfeitas), `pagePosition` na view raiz em que ela está, como os toques fornecem, os `modifiers` pressionados (`control`, `alt`, `shift`, `platform`: Command nas plataformas Apple, a tecla Windows nas demais) e `pressedButton`, o botão pressionado (`"left"`, `"right"`, `"middle"`, `"back"` ou `"forward"`, o `MouseButton` do GPUI) ou `null`; em Rust, `position`, `page_position`, `modifiers` e `pressed_button`. Nos desktops e na web, um arrasto também é um toque (`onTouchMove`, o responder), e seus movimentos chegam a `onMouseMove` com `pressedButton` definido: o feedback que apenas acompanha o hover ignora esses movimentos; no iOS e no Android, o hover informa o ponteiro sem botão pressionado. Os movimentos chegam no máximo uma vez por frame, o mais recente, e sempre antes do `onMouseLeave` que vem depois deles, de modo que um handler pode redesenhar a cada movimento:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` dá a qualquer elemento uma dica, exibida acima dele nos desktops (macOS, Windows, Linux, o backend GPUI e navegadores desktop) depois que o ponteiro permanece sobre ele por meio segundo, até o ponteiro sair ou pressioná-lo. Celulares e tablets não exibem nenhuma. A dica nunca captura o ponteiro nem os pressionamentos, então o elemento funciona exatamente como funcionaria sem ela.

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | A dica, um elemento que o app estiliza: um [`Tooltip`](tooltip.md) de `nsh/base` é o próprio tooltip, com seu posicionamento, atraso e eventos; qualquer outro elemento é exibido como está. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

O `Tooltip` define sua própria aparência, posicionamento, atraso e eventos, assim como o `.tooltip(..)` do GPUI recebe um. Um app com muitos tooltips mantém um pequeno componente próprio que envolve um texto em seu `Tooltip`.

<a id="context-menus"></a>

### Menus de contexto

`onContextMenu` avisa a uma view que o botão secundário foi pressionado sobre ela: um clique com o botão direito, Control-clique no macOS, um clique com dois dedos em um touchpad, o clique secundário do ponteiro de um iPad; em navegadores, também a tecla de menu do teclado. Abra ali o menu do próprio app; em TSX, [`Menu.popup`](../modules/nsh-desktop.md) exibe o do sistema:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | O botão secundário foi pressionado sobre a view ou sobre uma view dentro dela. |

`ContextMenuEvent` tem `position` na view, `pagePosition` em sua view raiz (onde `Menu.popup` posiciona um menu: `Menu.popup(items, e.pagePosition)`) e os `modifiers`; em Rust, `position`, `page_position` e `modifiers`. A view mais próxima que escuta, da que está sob o ponteiro para fora, o recebe. Um campo de texto, ou um texto selecionável com menu de edição (Windows, o backend GPUI, navegadores), mais próximo do que essa view, exibe o próprio menu no lugar. A plataforma decide isso no momento em que o botão é pressionado, a partir do que está montado, então o handler é avisado depois do fato e nada precisa ser cancelado. Uma view `disabled` deixa o clique para o listener habilitado mais próximo ao seu redor. Em telas sensíveis ao toque, um toque longo abre menus: trate `onLongPress` com a mesma função.

<a id="keyboard-focus"></a>

### Foco do teclado

No macOS e na web, Tab move o foco do teclado entre suas paradas na ordem da árvore: os campos de texto, as views que recebem pressionamentos e toda view `focusable`. Os estilos de foco (`focus:`, `.focus(..)`) estilizam a view focada, e Return ou Espaço a pressiona quando ela recebe pressionamentos. Um clique pressiona uma view sem focá-la, então os estilos de foco aparecem apenas para o foco do teclado.

Foco e pressionamentos são coisas separadas. Uma view que recebe teclas enquanto tem o foco (um gráfico, um slider, uma lista que move sua seleção com as setas) define `focusable` e associa suas teclas enquanto focada (`onFocus` / `onBlur` com [`keymap`](../modules/nsh.md#keymap)); um pressionamento sobre ela ainda chega a um elemento pressionável ao redor, como um card que abre uma página.

O `focus()` de uma ref move o foco do teclado para uma parada como o Tab faz (seus estilos de foco aparecem e `onFocus` é disparado), por exemplo para devolvê-lo ao gatilho de um popup que foi fechado, e `blur()` o retira.

Uma view ao redor estiliza o foco com `focus-within:` (`focusWithinStyle`, `.focus_within(..)`) enquanto o foco está nela ou em qualquer view dentro dela: a moldura de um campo ao redor do input que edita, uma barra de ferramentas enquanto um de seus botões tem o foco. O conteúdo de um `Overlay` fica dentro da view em que o overlay está, onde quer que seja exibido, então um popup conta como parte da view que contém seu gatilho. Em Rust, um componente percebe o foco entrar em um elemento e sair dele com os `on_focus_in(..)` e `on_focus_out(..)` de sua ref: mover-se entre views dentro dele não é nenhum dos dois.

| Prop | Rust | Tipo | Padrão | Descrição |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` para views que recebem pressionamentos | Se a view é uma parada do Tab. `true` torna qualquer view uma parada, quer ela receba pressionamentos, quer os deixe para as views ao redor; `false` deixa um elemento pressionável apenas para o ponteiro (um backdrop que fecha um popover, linhas entre as quais as setas se movem). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (ou `focus()`) deu à view o foco do teclado. |
| `onBlur` | `.on_blur(..)` | `() => void` | | O foco do teclado saiu da view. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Layout e identidade

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` é o frame da view relativo ao seu pai, `{ origin, size }`, após cada layout que o altera. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | A ref do elemento (veja [métodos de ref](#ref-methods)): `ViewRef`, ou o tipo do próprio elemento sobre ela. `ref={el}` atribui a uma variável, `ref={fn}` chama uma função. |
| `nativeID` | `.native_id(id)` | `string` | Dá nome à view para outros, por exemplo o `InputAccessoryView` a que um input se refere. |
| `testID` | `.test_id(id)` | `string` | Um identificador para testes de UI (no Android, o resource id da view). |
| `key` | `.key(key)` | `string` | A identidade do elemento entre seus irmãos. |

<a id="gestures-driving-animated-values"></a>

### Gestos que controlam valores animados

Essas props vinculam um gesto a [valores animados nativos](../modules/nsh.md#animation) que se movem na thread de UI, sem nenhum trabalho no código do app a cada frame. Veja [toque e gestos](../docs/touch-and-gestures.md).

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Arrastos controlam esses valores (pontos). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Um arrasto começou. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Um arrasto terminou, com a velocidade de soltura (por exemplo, para iniciar um `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | Pinças de dois dedos controlam `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Uma pinça começou / terminou. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Rotações de dois dedos controlam `angle` (graus). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Uma rotação começou / terminou. |

`PanEvent` é `{ cancelled, translation, velocity, value? }` (em Rust, `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`): se o sistema cancelou o arrasto, a translação desde o início e a velocidade em pontos por segundo (`Point`s), e os valores vinculados naquele momento, `{ x?, y? }` para os eixos que `pan` vincula (um arrasto pode capturar um valor no meio de uma animação).

<a id="raw-touches-and-the-responder-system"></a>

### Toques brutos e o sistema responder

Para gestos que as props acima não cobrem, todo elemento aceita as props de toque e de responder: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (e suas formas `…Capture`), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (e `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` e `onResponderTerminationRequest`. Cada handler recebe um `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Retornar `true` de `onResponderGrant` impede que scroll views nativas capturem os toques. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) torna a view o responder somente depois que a plataforma ativa seu pan, de modo que arrastos dentro de scroll views deixam o outro eixo para elas ([Toque e gestos](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` em [`PanResponder`](../modules/nsh.md#panresponder) é construído sobre eles. Em Rust, `.on_touch(..)` escuta todo toque (`TouchEvent`), `.claim_touches(..)` decide quando a view os captura, e `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` e os demais acompanham o responder.

<a id="accessibility"></a>

### Acessibilidade

| Prop | Rust | Tipo | Descrição |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | A view é um único elemento para tecnologias assistivas; seus filhos não são expostos separadamente. |
| `accessibilityLabel` | `.label(..)` | `string` | O que os leitores de tela leem. Views sem label leem seus textos. |
| `accessibilityHint` | `.hint(..)` | `string` | O que a ativação do elemento faz. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | O que o elemento é (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | O estado que as tecnologias assistivas informam (`checked` e `pressed` podem ser `"mixed"`; `current` é `true` ou `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | O nível de um título (1 é o mais alto), a profundidade de um item de árvore (1 no topo). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | O valor de um elemento de intervalo ou textual. |
| `accessibilityElementsHidden` | | `boolean` | Oculta a view e sua subárvore das tecnologias assistivas. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Se a view é exposta. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Ações personalizadas oferecidas às tecnologias assistivas. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | O usuário invocou uma das `accessibilityActions`. |

Veja [acessibilidade](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Props exclusivas de plataforma

As props que existem em apenas uma plataforma ficam em um objeto com o nome dela em TSX, de modo que as props compartilhadas permanecem iguais em todos os lugares. Apenas o objeto da plataforma atual é enviado; os outros são ignorados. Os builders de Rust as recebem como métodos que se aplicam na respectiva plataforma.

| Prop | Descrição |
|---|---|
| `ios={{…}}` | iOS e Mac Catalyst. `<Input>`, `Dialog` e `WebView` adicionam suas próprias chaves. |
| `android={{…}}` | Android. Todo elemento aceita `ripple`, `elevation` e `accessibilityLiveRegion` (abaixo). |
| `desktop={{…}}` | Plataformas desktop e navegadores desktop; ignorado em dispositivos móveis. Todo elemento aceita `windowDrag` (abaixo). |
| `web={{…}}` | Navegadores; ignorado nas demais. |

| Chave de `android` | Rust | Tipo | Descrição |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | O ripple do Material enquanto pressionado. |
| `elevation` | `.elevation(px(2.0))` | `number` | A sombra do Material (pontos), a partir da forma da view. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | Como as mudanças da view são anunciadas ao TalkBack. |

| Chave de `desktop` | Rust | Tipo | Descrição |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Pressionar a view arrasta a janela, como faria sua barra de título; `false` mantém clicável uma parte de uma view arrastável. Veja [uma barra de título própria](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

Veja [código específico de plataforma](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Métodos de ref

Em TSX, `ref` recebe a ref do elemento, cujo tipo é o próprio tipo do elemento: `ViewRef` (`focus`, `blur`, `measure`) para
`View`, `Text`, `Image`, `Canvas`, `Overlay` e `Shader`, e um tipo sobre `ViewRef` com os métodos do elemento para os
demais: `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) e `NativeComponentRef` (componentes nativos). Em Rust, `element_ref()` cria um handle `ElementRef` que
`.element_ref(&handle)` anexa. Os métodos dessas refs enviam comandos para a view nativa, na mesma ordem das alterações feitas
antes deles no mesmo turno. A página de cada elemento informa quais métodos se aplicam a ele. Tipifique uma variável de ref com o tipo
próprio do elemento (`let field!: InputRef` para um `<Input>`): uma variável tipada como `ViewRef` não serve para um elemento cuja ref tem métodos
próprios.

| Método | Rust | Ref | Descrição |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Dá foco a um `<Input>` (exibe o teclado), ou dá o foco do teclado a uma view que recebe toques / remove o foco. |
| `measure()` | `measure()` | `ViewRef` | [Onde a view está](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Seleciona `start..end` em unidades UTF-16; um cursor sem `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Rola até um deslocamento. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (um `<Scroll>` com zoom) | Aplica zoom em `scale` em torno de um ponto do conteúdo. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Rola até um deslocamento ao longo do eixo da lista. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Rola até que um item fique visível. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Rola até o fim do conteúdo. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Controla a página. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Salta para um instante. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Chama um comando de um componente nativo registrado ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Por que os handlers nunca bloqueiam a UI

A thread principal nunca espera pelo código do app. Quando o sistema precisa de uma resposta imediata (este texto pode mudar, o botão
de voltar pode remover a tela, esta sheet pode fechar), o NSH responde nativamente a partir de props definidas antes
(`maxLength`, `popOnBack`, `closeOnSwipe`, …), e o evento chega ao app depois. É por isso que esse comportamento
é uma prop, e não o valor de retorno de um handler.
