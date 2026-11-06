---
title: "Código específico de plataforma"
description: "Escrevendo um único app para celulares, desktops e navegadores - props exclusivas de plataforma em ios={{}} / android={{}} / desktop={{}} / web={{}}, os módulos nsh/mobile e nsh/desktop, platform.os e platform.select, e variantes de Tailwind por plataforma."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---


# Código específico de plataforma

Um único bundle NSH roda em iOS, Android, macOS, Windows e Linux (e no Mac Catalyst), e em navegadores por meio do [runtime web](./web.md). A maior parte de um app não precisa de nenhuma verificação de plataforma: elementos, estilos, layout e módulos se comportam da mesma forma em todo lugar, e os componentes que você cria a partir deles têm a mesma aparência em todo lugar. Quando algo realmente é específico de uma plataforma, o NSH oferece um lugar claro para isso, de modo que o código de plataforma fique visível e contido:

| Rust | TSX | Para |
|---|---|---|
| [Métodos builder (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Props que só uma plataforma tem. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | APIs que só as plataformas mobile ou só os desktops têm. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Escolha de valores ou de código por plataforma. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [classes `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Estilos por plataforma. |

<a id="desktop-and-mobile"></a>

## Desktop e mobile

Toda plataforma é desktop ou mobile, segundo uma única regra. Desktop é macOS, Windows, Linux e navegadores no idioma desktop (mouse e uma janela larga, [a web](./web.md)). Mobile é iOS, Android e navegadores no idioma de celular ou tablet; o Mac Catalyst executa o backend do iOS, então também é mobile, com props `ios={{…}}`. As props `desktop={{…}}`, `platform.select({ desktop, mobile })`, `platform.desktop` e `platform.idiom === "desktop"` seguem essa regra, assim como os componentes de `nsh/base` (um menu é um popup nos desktops e uma sheet no mobile) e, em Rust, `is_desktop()`.

O `isAvailable` de `nsh/desktop` responde a uma pergunta mais restrita: se as APIs de janela e de menu desse módulo funcionam, o que acontece no macOS, no Windows e no Linux. Condicione layout, densidade e entrada a `platform.desktop`, e chamadas de `Window` e `Menu` a `isAvailable`.

<a id="platform-only-props"></a>

## Props exclusivas de plataforma

Em Rust, uma prop que só uma plataforma tem é um método builder como outro qualquer (`.ripple(..)`, `.elevation(..)` para Android, `.input_accessory(..)` para iOS, `.window_drag(..)` para os desktops); as outras plataformas a ignoram. Em TSX, as props que existem em apenas uma plataforma ficam agrupadas em um objeto com o nome dela. Cada elemento aceita `ios`, `android`, `desktop` (macOS, Windows, Linux e navegadores no idioma desktop) e `web` (navegadores); nas outras plataformas o objeto é ignorado, e na plataforma correspondente apenas as suas chaves são aplicadas. Um navegador desktop aplica `desktop` e `web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

Os objetos TSX são reativos como qualquer prop; uma chave removida do objeto é limpa.

O que existe hoje:

| Rust | TSX | Em | Descrição |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | todos os elementos | O ripple do material enquanto pressionado: cor, sem borda, raio, primeiro plano. |
| `.elevation(..)` | `android={{ elevation }}` | todos os elementos | A sombra do material, em pontos, a partir da forma da view. |
| | `android={{ accessibilityLiveRegion }}` | todos os elementos | `"none"`, `"polite"` ou `"assertive"`: o TalkBack anuncia as mudanças da view. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | O conteúdo do diálogo se estende por baixo da barra de status. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | O `InputAccessoryView` exibido sobre o teclado. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | Os nomes do iOS para os tipos de preenchimento automático (o `AutoFill` do Rust cobre as duas plataformas). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | As orientações que ele permite. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Deslizar para voltar e avançar no histórico de páginas. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | O botão de barra nativo do UIKit no fim do cabeçalho, que ao ser pressionado aciona `headerRight`. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | O botão de barra nativo do UIKit no início do cabeçalho, que ao ser pressionado aciona `headerLeft`. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | O botão de barra nativo do UIKit exibindo um SF Symbol no fim do cabeçalho, que ao ser pressionado aciona `headerRight`. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | O botão de barra nativo do UIKit exibindo um SF Symbol no início do cabeçalho, que ao ser pressionado aciona `headerLeft`. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: deslizes de dois dedos no trackpad voltam e avançam no histórico de páginas; Windows: deslizes na tela sensível ao toque; Linux: deslizes no touchpad. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | todos os elementos | Pressioná-lo arrasta a janela, como faria a barra de título do sistema (veja [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

Em TSX, `desktop={{…}}` e `web={{…}}` são aceitos em qualquer lugar. Os tipos (`IOSProps`, `AndroidProps`, `DesktopProps` e suas formas por elemento) informam ao seu editor o que cada elemento aceita.

O que um elemento significa em todas as plataformas é uma prop de nível superior (em Rust, um método com o mesmo nome), aplicada onde faz sentido: `title`, `headerStyle`, `headerLargeTitle` e `headerBackTitle` de `NavPage` configuram o cabeçalho do sistema no iOS e no Android, o slot `header` dele é o cabeçalho dos desktops e da web, e `presentation` de `Dialog` escolhe as sheets do iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` e o restante de `AlertDialog.show` funcionam em todas as plataformas. Um recurso de sistema próprio de uma plataforma vai no objeto dela e, quando várias plataformas o têm, no de cada uma delas com o mesmo nome: `allowsBackForwardNavigationGestures` de `WebView`, os deslizes do sistema pelo histórico de páginas, está em `ios={{…}}` e `desktop={{…}}`.

<a id="platform-modules"></a>

## Módulos de plataforma

Em Rust, as APIs que só uma plataforma tem são funções de `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) e de `nsh_core::element::desktop` (a janela: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; menus: `set_application_menu`, `popup_menu`); nas outras plataformas elas não fazem nada. Em TSX, `nsh/mobile` reúne as APIs do iOS e do Android (algumas de apenas uma das plataformas) e `nsh/desktop` as dos desktops. Ambos podem ser importados em qualquer plataforma, então um único bundle roda em todo lugar: nas outras plataformas, suas funções retornam imediatamente e seus componentes não ocupam espaço. Cada um exporta `isAvailable`, que é `true` nas suas próprias plataformas; `platform.os` distingue um do outro.

### nsh/mobile

`isAvailable` é `true` no iOS (com Mac Catalyst) e no Android. Ambas as plataformas têm [`TabBar`](../modules/nsh-mobile.md#tabbar), a barra de abas do sistema.

#### BackHandler (Android)

| Rust | TSX | Descrição |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Escuta o botão voltar depois dos diálogos e antes das pilhas; retorne `true` quando tratado. O listener acompanha o componente (ou effect) que o adicionou; em TSX, a chamada também retorna uma função que o interrompe antes. |
| | `BackHandler.exitApp()` | Sai do app. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

O botão voltar é tratado primeiro pelo diálogo do topo, depois pelos listeners de voltar (do mais recente ao mais antigo), depois pela pilha de navegação do topo, e o app é encerrado quando nada o tratou. Veja [Navegação](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Descrição |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Uma barra sobre o teclado dos inputs que citam o seu id nativo (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

Veja [Formulários e o teclado](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Apps Rust desenham suas próprias barras de título com `nsh_core::element::desktop` ([Building with Rust](./rust.md#desktop-title-bars)). O módulo do TSX:

| Export | Descrição |
|---|---|
| `Window` | A janela: `setTitle`, `setTitleBar({ style: "hidden" })` para uma barra de título própria do app, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | A altura da barra de título oculta e o espaço ocupado pelos controles de janela do sistema (reativo). |
| `Menu` | `setApplicationMenu(items)` (a barra de menus, com atalhos) e `popup(items, at?)` (menus de contexto). |
| `isAvailable` | `true` onde as APIs de janela e de menu funcionam: macOS, Windows e Linux. Navegadores desktop têm `platform.desktop` e mantêm a janela e os menus do navegador. |

Veja [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### A barra de status

Em ambas as plataformas, a barra de status pertence à página ou ao diálogo do topo, como no UIKit, onde o view controller mais acima decide isso: [`NavPage` e `Dialog` aceitam `statusBar`](../modules/nsh-base.md#status-bar) (em Rust, `.status_bar(StatusBarStyle::Light)`, ou um `StatusBarSetting` para os demais campos) com `foreground` (`"auto"`, `"light"` para fundos escuros, `"dark"` para fundos claros), `hidden` e `animated`. Vence a página ou o diálogo exibido mais recentemente, campo a campo, e o que está abaixo dele volta a valer quando ele sai. `"statusBar"` de `nsh.json` é o padrão do app por baixo deles.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

Em um app embutido em um app nativo, o view controller do app host decide a barra de status no iOS. Um app que declara `"capabilities"` em `nsh.json` precisa de `"statusBar": true` para alterá-la.

<a id="platformos-and-platformselect"></a>

## platform.os e platform.select

`os()` em Rust e a constante `platform` de `nsh` em TSX informam onde o app está rodando: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` ou `Os::Web`, e `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` ou `"web"` (o Mac Catalyst é `"ios"`, com `platform.catalyst` em qualquer um dos seus idiomas; o [backend macOS](./macos.md) é `"macos"`, o [backend Linux](./linux.md) é `"linux"` e o [backend Windows](./windows.md) é `"windows"`, e seus elementos aplicam suas props `desktop`; os [navegadores](./web.md) são `"web"` e também aplicam props `desktop` quando `platform.desktop` é `true`). Veja [Dispositivo e ambiente](./device-and-environment.md#the-platform) para a versão, o idioma e o restante.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

Em Rust, um `match os()` escolhe o valor, com `is_desktop()` para os desktops. Em TSX, `platform.select(spec)` retorna o valor para esta plataforma. Ele procura a chave do próprio SO, depois `desktop` ou `mobile` conforme [a regra acima](#desktop-and-mobile) (`platform.desktop`), depois `native` (todas as plataformas, exceto a web) e, por fim, `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

Ele retorna `undefined` quando nada corresponde e não há `default`.

<a id="rendering-different-components"></a>

### Renderizando componentes diferentes

Escolha componentes da mesma forma, no nível do módulo (TSX) quando a escolha nunca muda:

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

ou inline com [`when` / `<If>`](../elements/control-flow.md):

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Variantes de plataforma no Tailwind

Em Rust, estilize por plataforma com `.when(os() == Os::Ios, |v| ..)`; em TSX, as variantes `ios:`, `android:` e `web:` aplicam classes em uma única plataforma:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## Prefira comportamento compartilhado

Antes de recorrer a uma verificação de plataforma, considere se a diferença importa para os seus usuários. Elementos e estilos já mapeiam para o comportamento nativo de cada plataforma onde ele deve diferir (física de rolagem, renderização de texto, teclados, acessibilidade), e permanecem iguais onde os usuários esperam consistência (a aparência própria do seu app). As verificações de plataforma são mais bem reservadas para convenções que os usuários esperam: o botão voltar e os toasts do Android, as sheets e os títulos grandes do iOS, os nomes de preenchimento automático, o ripple do Android.

<a id="related"></a>

## Relacionados

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) e [`BackHandler`](../modules/nsh-mobile.md#backhandler): as referências.
- [API de dispositivo de `nsh`](../modules/nsh.md#device): `platform`.
- [Componentes nativos](./native-components.md): uso de views fornecidas pelo seu app host em cada plataforma.
- [Tailwind](./tailwind.md): todas as variantes.
