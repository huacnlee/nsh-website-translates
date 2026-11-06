---
title: "Dispositivo e ambiente"
description: "Como ler o tamanho da janela, o esquema de cores, a escala da fonte, as áreas seguras, a plataforma, a densidade de pixels e a direção do layout, e como reagir quando esses valores mudam."
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---


# Dispositivo e ambiente

O ambiente em que um app roda muda enquanto ele roda: a janela é redimensionada (rotação, tela dividida, uma janela do Mac), o usuário muda para o modo escuro ou para um tamanho de texto maior, o teclado aparece e some. O NSH expõe cada um desses casos como um **accessor reativo**: chame-o como um signal, e o que o leu (um estilo, um texto, um valor computado) é atualizado quando ele muda. Não há listeners para adicionar ou remover.

Em Rust, os accessors são funções de `nsh_core::prelude`; em TSX, vêm dos módulos listados.

| Rust | TSX | Valor |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | Largura e altura da superfície, em pontos. |
| `dark()` | `colorScheme()` (`nsh`) | Escuro ou claro: o do sistema, ou o próprio do app (`set_color_scheme`, `setColorScheme`). |
| `font_scale()` | `fontScale()` (`nsh`) | O tamanho de texto preferido do usuário em relação ao padrão (1 é o padrão). |
| `safe_area()` | `safeArea()` (`nsh`) | Insets da superfície não cobertos pela UI do sistema: superior, direito, inferior, esquerdo. |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | Os insets de onde o componente que chama é renderizado (uma página, um diálogo). |
| `keyboard_height()`, `keyboard_duration()` | `keyboardFrame()` (`nsh`) | A altura e a duração da animação do teclado virtual. |
| `locale()` | `locale()` (`nsh`) | O locale do usuário como tag BCP 47 (`"en-US"`, `"zh-Hans-CN"`): o formato que `Intl` usa por padrão. |
| `lifecycle()` | `lifecycle()` (`nsh`) | Se o app está em uso: `active`, `inactive` (visível sem o foco) ou `background` ([Em segundo plano](#in-the-background)). |
| `reduce_motion()`, `screen_reader()` | `reduceMotion()`, `screenReaderEnabled()` (`nsh`) | Veja [Acessibilidade](./accessibility.md). |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## Tamanho da janela e layout responsivo

`window()` (TSX: `windowSize()`) é o tamanho da superfície em que o NSH renderiza: a tela em um celular, a janela em um iPad com tela dividida ou em um Mac, a view hospedeira quando o NSH está incorporado. Use-o para mudar o layout, não apenas os tamanhos:

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

Muitas vezes flexbox, porcentagens e `aspect_ratio` (`aspectRatio`) resolvem sem precisar ler o tamanho; veja [Layout](./layout.md). O `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` do Rust troca estilos conforme a largura; em TSX com Tailwind, as variantes de breakpoint (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`, `max-*:`, `min-[…]:`) e `portrait:` / `landscape:` também acompanham a janela: `class="grid grid-cols-2 md:grid-cols-4"`.

<a id="dark-mode"></a>

## Modo escuro

A aparência segue o sistema, a menos que o app defina a sua própria. Em Rust, a forma mais simples de oferecer suporte ao modo escuro é uma cor com um valor claro e um escuro, `AdaptiveColor::rgb(light, dark)`: ela muda nativamente quando a aparência muda, sem nada para executar. Em TSX, é a variante `dark:` do Tailwind, que se aplica quando `colorScheme()` é `"dark"`:

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

Para todo o resto, leia `dark()` (TSX: `colorScheme()`) em um closure ou em um valor computado; em TSX, para mais do que algumas cores, derive uma paleta uma só vez:

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Os componentes Rust também tiram suas cores do tema, que tem valores claros e escuros (`nsh.json` `"theme"`, veja [Criando com Rust](./rust.md)), então eles também acompanham o sistema. Para combinar a barra de status com o seu fundo, dê às suas páginas e diálogos um [`statusBar`](../modules/nsh-base.md#status-bar), ou dê um ao app em `nsh.json`.

<a id="an-app-with-its-own-appearance"></a>

### Um app com aparência própria

Um app que é sempre escuro (ou sempre claro) declara isso em `nsh.json`, e `dark()` e `colorScheme()`, as cores adaptativas, as classes `dark:`, o tema, o estilo padrão da barra de status e os alertas o seguem desde o primeiro frame (apps empacotados também são iniciados nele):

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)` (TSX: `setColorScheme` de `nsh`) o altera em tempo de execução, para uma configuração de aparência dentro do app; `Appearance::System` (`"system"`) volta a seguir o sistema:

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> Teste as duas aparências durante o desenvolvimento: `xcrun simctl ui booted appearance dark` alterna um simulador de iOS, e o Android tem um botão de tema escuro nas Configurações rápidas. A mudança chega ao seu app imediatamente, sem recarregar.

<a id="text-size"></a>

## Tamanho do texto

`font_scale()` (TSX: `fontScale()`) é a configuração de tamanho de texto do usuário (Dynamic Type no iOS, tamanho da fonte no Android) em relação ao padrão. Textos e inputs a seguem por conta própria: `fontSize: 16` é renderizado maior quando o usuário pediu um texto maior. Por elemento, você pode desativar isso ou limitar o valor:

| Rust (em `text` e `input`) | TSX (em `<Text>` e `<Input>`) | Padrão | Descrição |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | Segue o tamanho de texto do sistema. |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0` (nenhum) | A maior escala aplicada a este texto. |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

Leia `font_scale()` para adaptar o layout que não acompanha o texto automaticamente, como trocar uma linha por uma coluna quando o texto fica grande: `.style_when(|| font_scale() > 1.3, |s| s.flex_col())` em Rust, `flexDirection: fontScale() > 1.3 ? "column" : "row"` em TSX.

O tamanho do texto escala texto: todo texto e input que permite escala de fonte, além dos alertas e toasts da plataforma. Os comprimentos mantêm o tamanho: espaçamentos, larguras e alturas, raios de canto, bordas e imagens, em pontos ou em classes (`p-4`, `rounded-lg`, `w-[2rem]`). Caixas dimensionadas pelo conteúdo crescem junto com o texto.

<a id="language-and-region"></a>

## Idioma e região

`locale()` é o locale do usuário, como uma tag BCP 47 (`locale().as_str()` em Rust). Em TSX, `Intl` formata números e datas para ele por padrão, de modo que `new Intl.NumberFormat().format(1234.5)` resulta em `1,234.5` em `en-US` e `1.234,5` em `de-DE`. Leia `locale()` para escolher as strings das suas próprias traduções: os textos que o leem são atualizados quando ele muda.

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## Em um app hospedeiro

Um app exibido dentro de um app nativo segue as configurações do próprio app hospedeiro quando ele as define: o locale e o tamanho de texto das APIs de incorporação (`AppView::set_locale` e `set_font_scale` em Rust no [GPUI](./gpui.md), [macOS](./macos.md), [Linux](./linux.md) e [Windows](./windows.md), `locale` e `fontScale` em Swift no [iOS](./ios.md), `setLocale` e `setFontScale` em Java no [Android](./android.md)) substituem o idioma e o tamanho de texto do sistema. `locale()`, `Intl`, `fontScale()` e o texto os seguem imediatamente, como seguem uma mudança do sistema, e os valores do sistema voltam quando o app hospedeiro os limpa. Use-os quando o app nativo deixa seus usuários escolherem um idioma ou um tamanho de texto próprios.

<a id="in-the-background"></a>

## Em segundo plano

`lifecycle()` (o mesmo em TSX) diz se o usuário está usando o app. É `active` em primeiro plano, `inactive` enquanto o app ainda está visível mas outro app ou janela tem o foco (ou o sistema mostra algo sobre ele: o seletor de apps, uma chamada recebida), e `background` enquanto ele não está visível: em segundo plano em um celular, minimizado em um desktop, uma aba oculta na web. Como todo accessor, ele atualiza o que o leu, então um effect pausa um feed ao vivo, um polling ou um vídeo em segundo plano e os retoma quando o usuário volta:

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

Use `background` para pausar trabalho e salve o que o usuário altera conforme ele altera: o sistema pode suspender um app segundos depois de ele ir para segundo plano, antes que um effect que lê a mudança tenha sido executado. Um app exibido dentro de um app nativo segue o estado desse app, e, onde um app tem várias janelas (um iPad, um desktop), uma view segue a janela em que está. Em testes, `app.setLifecycle("background")` de `nsh/test` leva o app para esse estado ([Testes](./testing-and-trace.md#steps)).

<a id="safe-areas"></a>

## Áreas seguras

Notches, o indicador de início, a barra de status, a barra de navegação do Android e a barra de título do Mac Catalyst cobrem partes da superfície. Os apps NSH desenham de ponta a ponta em todas as plataformas e recebem as partes cobertas como insets.

- `safe_area()` (TSX: `safeArea()`) fornece os insets da superfície.
- O `cx.insets()` de um componente (TSX: `safeAreaInsets()`) fornece os insets **de onde o componente é renderizado**: dentro de uma [página](./navigation.md#safe-areas-under-the-header) de navegação, eles são medidos abaixo do cabeçalho; dentro de um [diálogo](../elements/dialog.md), são os do diálogo. Prefira-o em componentes que podem ser exibidos em vários lugares.
- `env(safe-area-inset-top)`, `-right`, `-bottom` e `-left` do CSS aplicam padding ou espaçamento a qualquer view conforme os insets de onde ela é renderizada, em `padding*` e `margin*` (`calc(env(safe-area-inset-bottom) + 8px)` soma um comprimento; Tailwind `pt-[env(safe-area-inset-top)]`; Rust `.p_safe_area()`, `.pt_safe_area()`, `.pb_safe_area_plus(px(8.0))`, ...). O padding é atualizado nativamente quando os insets mudam ([Área segura](../elements/safe-area.md)).

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

No Android, uma view incorporada abaixo de uma toolbar recebe apenas as partes das barras do sistema que se sobrepõem a ela, como a área segura do UIKit: nenhum inset superior se ela não alcança a barra de status.

<a id="the-platform"></a>

## A plataforma

`os()`, `os_version()`, `idiom()`, `is_desktop()` e `is_catalyst()` em Rust, e a constante `platform` de `nsh` em TSX, descrevem onde o app roda. Eles permanecem os mesmos enquanto o app roda.

| Rust | TSX | Descrição |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` ou `Os::Web` (`os().name()` é a string do TSX). Mac Catalyst é iOS. |
| `os_version()` | `platform.version` | Maior e menor; no Android, o nível da API e 0. |
| `idiom()` | `platform.idiom` | `Idiom::Phone`, `Pad`, `Mac`, `Tv` ou `Desktop`; `Desktop` exatamente onde `is_desktop()` vale. |
| `is_desktop()` | `platform.desktop` | macOS, Windows ou Linux, ou um navegador desktop ([Desktop e mobile](./platform-specific.md#desktop-and-mobile)). |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst, em qualquer um de seus idioms. |

`platform` do TSX, completo:

| Membro | Descrição |
|---|---|
| `platform.os` | `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` ou `"web"`. O Mac Catalyst informa `"ios"`. |
| `platform.version` | Uma string: no iOS e nos desktops, a versão do SO (`"17.5"`); no Android, o nível da API (`"35"`); na web, `"0.0"`. |
| `platform.idiom` | `"phone"`, `"pad"`, `"mac"`, `"tv"` ou `"desktop"`. `"desktop"` exatamente onde `platform.desktop` é `true`. `"mac"` é o idiom Mac do UIKit sob o Mac Catalyst, um idiom mobile. |
| `platform.desktop` | O comportamento de desktop se aplica: macOS, Windows, Linux e navegadores desktop. As props `desktop={{…}}` e `platform.select({ desktop })` o seguem. |
| `platform.catalyst` | O app roda sob o Mac Catalyst (`os` `"ios"`), no idiom Mac ou iPad. |
| `platform.select(spec)` | O valor para esta plataforma; veja [Código específico de plataforma](./platform-specific.md#platformselect). |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` roda headless como iOS.

No [Linux](./linux.md), `platform.os` é `"linux"`, o idiom é `"desktop"` e `platform.version` é a versão maior e menor do kernel (`"6.12"`): as distribuições numeram suas versões de formas que não podem ser comparadas. Lá, a área segura e a altura do teclado são 0, `colorScheme()` segue ao vivo a configuração do desktop (o portal de configurações XDG), `fontScale()` segue o escalonamento de texto do desktop e `pixelRatio()` segue a escala da tela, inclusive as fracionárias.

No [macOS](./macos.md) (o backend AppKit), `platform.os` é `"macos"`, o idiom é `"desktop"` e `platform.version` é a versão do macOS. A área segura e a altura do teclado são 0, `colorScheme()` segue ao vivo a aparência do sistema, `fontScale()` é 1 e `pixelRatio()` é a escala de backing da tela.

No [Windows](./windows.md), `platform.os` é `"windows"`, o idiom é `"desktop"` e `platform.version` é `"10.0"`, também no Windows 11 (o Windows manteve o número da versão). A área segura e a altura do teclado são 0, `colorScheme()` segue ao vivo Configurações > Personalização > Cores, `fontScale()` segue a configuração Tamanho do texto (1 a 2,25), `reduceMotion()` segue a configuração de efeitos de animação, `pixelRatio()` segue a escala do monitor e `Intl` formata no formato regional do usuário.

Em um navegador ([o runtime web](./web.md)), `platform.os` é `"web"` e `platform.version` é `"0.0"`. O idiom é `"desktop"` com um mouse e uma janela de pelo menos 600 pontos de largura, `"pad"` em um tablet e `"phone"` em um celular, decidido quando o app é iniciado. O locale, `reduceMotion()`, `fontScale()` (o tamanho de texto do navegador), `pixelRatio()`, a área segura e a altura do teclado vêm do navegador e o acompanham ao vivo.

<a id="pixel-density"></a>

## Densidade de pixels

`pixel_ratio()` e `round_to_nearest_pixel(points)` em Rust, e `pixelRatio()` de `nsh` em TSX, convertem entre pontos e pixels do dispositivo.

| Rust | TSX | Descrição |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | Pixels do dispositivo por ponto (2 ou 3 na maioria dos celulares), reativo. |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | Pontos arredondados para o pixel do dispositivo mais próximo. |

Uma linha fina, com a altura de um pixel do dispositivo:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` e `pixelRatio()` são reativos, então uma linha fina acompanha uma janela movida para uma tela com outra densidade.

<a id="right-to-left"></a>

## Da direita para a esquerda

Quando o idioma do dispositivo é escrito da direita para a esquerda (árabe, hebraico, persa, ...), o NSH organiza o app da direita para a esquerda: as linhas começam pela direita, as propriedades de estilo lógicas assumem seus lados da direita para a esquerda, o texto se alinha à direita e os widgets nativos são espelhados. A direção do layout segue o idioma do usuário por conta própria. O estilo `direction` de uma view (`"ltr"`, `"rtl"` ou `"inherit"`; `.direction(LayoutDirection::..)` em Rust) define a direção da sua subárvore; na view raiz, define a do app.

As mudanças são aplicadas imediatamente, sem reiniciar o app; a demonstração desta página alterna o estilo `direction`.

Escreva layouts que funcionem nos dois sentidos com as propriedades lógicas: em Rust `ms` / `me` e `ps` / `pe` (os nomes do Tailwind), em TSX `marginStart` / `marginEnd`, `paddingStart` / `paddingEnd`, `start` / `end`, `borderTopStartRadius`, `textAlign: "start"` e assim por diante, que significam esquerda e direita em layouts da esquerda para a direita e o inverso da direita para a esquerda. `left` e `right` (`marginLeft`, `paddingRight`, `left`, `textAlign: "left"`, ...) mantêm seus lados nos dois, como no CSS. O estilo `direction` (`"inherit"`, `"ltr"`, `"rtl"`) sobrescreve a direção de uma subárvore, por exemplo para manter um número de telefone ou os controles de um player de mídia da esquerda para a direita. As variantes `rtl:` e `ltr:` do Tailwind se aplicam por direção.

Views de rolagem horizontal e listas começam na extremidade direita em layouts da direita para a esquerda. No Android, o app hospedeiro deve declarar `android:supportsRtl="true"` no manifest para que os widgets nativos sejam espelhados.

<a id="related"></a>

## Relacionado

- [API de dispositivo do `nsh`](../modules/nsh.md#device): a referência.
- [Código específico de plataforma](./platform-specific.md): `platform.select`, props e módulos de plataforma.
- [Acessibilidade](./accessibility.md): leitores de tela e movimento reduzido.
- [Área segura](../elements/safe-area.md), [Teclado](../elements/keyboard.md) e [a barra de status](../modules/nsh-base.md#status-bar).
- [Tailwind](./tailwind.md): `dark:`, variantes de breakpoint e de orientação.
