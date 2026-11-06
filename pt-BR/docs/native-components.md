---
title: "Componentes nativos"
description: "Use views do app host (mapas, players, qualquer UIView ou Android View) dentro de um app NSH, com props, eventos, comandos e dimensionamento."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---


# Componentes nativos

Um componente nativo é uma view que o **app hospedeiro** registra por nome: um mapa, uma pré-visualização de câmera, uma biblioteca de gráficos, qualquer
`UIView` no iOS, `android.view.View` no Android, `NSView` no macOS, `gtk::Widget` no Linux, ou um desenho Direct2D ou um
`HWND` filho no Windows. O app NSH o usa como qualquer outro elemento: um app Rust o cria com `native(name)` de
`nsh_core::prelude`, um app TSX o declara com `nativeComponent()` de [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). O NSH o posiciona junto com o restante do
app, envia props para ele, entrega seus eventos aos handlers e encaminha comandos de um `ref`.

Como o NSH renderiza com as próprias views do sistema, um componente nativo é apenas mais uma subview na mesma hierarquia:
não há problema de camadas, ele é recortado, rola e recebe toques como um `<View>`.

> [!NOTE]
> Os componentes nativos são registrados pelo app que incorpora o NSH ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)) ou, no Windows, macOS, Linux e iOS, pelo próprio crate Rust do app,
> cujos componentes o host de desenvolvimento e o app empacotado (`nsh package`) registram
> ([Registrando a partir do crate do app](#registering-from-the-apps-crate)). Um nome que nada registrou renderiza uma
> view vazia (o nome é registrado no log uma vez como desconhecido).

<a id="how-it-fits-together"></a>

## Como tudo se encaixa

1. O app hospedeiro registra uma factory sob um nome, como `"embed.badge"`, em seu `NshAppView` (iOS) ou `NshView`
   (Android). Cada view tem seu próprio registro; não há nada global.
2. O app NSH declara um componente para esse nome com as props e os eventos que usa.
3. Quando o elemento é criado, o NSH cria uma view container (decorada, posicionada e com hit-test como qualquer view), depois
   pede um componente à factory e coloca a view do componente dentro do container, preenchendo-o.
4. O componente recebe todas as props logo depois de ser criado e, em seguida, cada prop novamente quando ela muda.
5. O componente emite eventos e pode informar seu próprio tamanho; o app chama seus comandos por meio de um `ref`.

<a id="using-the-component-in-the-app"></a>

## Usando o componente no app

Em Rust, `native(name)` cria o elemento: `.prop(name, value)` define uma prop (um `serde_json::Value`, ou um signal ou uma
closure de um, enviado novamente quando muda), `.on_native_event(..)` escuta seus eventos como `NativeEvent { name, data }`, e os métodos de um
`element_ref()` colocado nele com `.element_ref(&r)` enviam seus comandos. Em TSX, `nativeComponent()` declara um componente
para o nome com as props e os eventos que usa.

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

const COLORS: [&str; 4] = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p(px(20.0))
        .pt_safe_area_plus(px(20.0))
        .pb_safe_area_plus(px(20.0))
        .gap(px(16.0))
        .bg(rgb(0xf6f8fa))
        .child(text("Rendered by nsh").text_size(px(22.0)).font_weight(FontWeight::BOLD))
        .child(
            // The host app's badge: a label it draws, sized to its text.
            native("embed.badge")
                .element_ref(&badge)
                .prop("text", move || match taps.get() {
                    0 => json!("Tap the native badge"),
                    n => json!(format!("Tapped {n}×")),
                })
                .prop("color", move || json!(COLORS[taps.get() as usize % COLORS.len()]))
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Rust saw {} taps", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, Text, View } from "nsh";
import { nativeComponent } from "nsh";

/** The host app's badge: a label it draws, sized to its text. */
const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

const colors = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)", gap: 16, backgroundColor: "#f6f8fa" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Rendered by nsh</Text>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color={colors[taps() % colors.length]}
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
      <Text>{`JS saw ${taps()} taps`}</Text>
    </View>
  );
}

mount(App);
```

A versão em TSX é `examples/embedded/App.tsx`, que os dois exemplos de incorporação do repositório executam.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `name` | `string` | O nome que o app hospedeiro registrou. Use um prefixo próprio (`"maps.view"`, `"acme.chart"`) para que os nomes continuem únicos. |
| `spec.props` | `readonly (keyof P & string)[]` | As props do próprio componente. Somente as props listadas aqui são enviadas ao lado nativo. |
| `spec.events` | `readonly (keyof E & string)[]` | Os eventos que ele emite. Opcional. |

Os parâmetros de tipo descrevem as props (`P`) e o payload de cada evento (`E`). O componente retornado aceita:

- as props do próprio componente `P`;
- um handler por evento: o evento `tap` é tratado por `onTap`, `regionChange` por `onRegionChange` (a primeira letra é
  maiúscula e `on` é adicionado como prefixo);
- tudo o que um `<View>` aceita, exceto children: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), layout,
  props de acessibilidade, `testID`, `onLayout`, `ref`. Elas pertencem ao container que o NSH desenha, não ao componente.

Um componente nativo é uma folha: não aceita children.

## Props

Cada prop própria é enviada como JSON, então seu valor pode ser qualquer valor JSON: strings, números, booleanos, `null`, arrays e
objetos simples. As props são reativas como quaisquer outras: quando a closure de uma prop em Rust (`.prop("text", move || json!(label.get()))`)
ou um `text={label()}` em TSX lê um signal, o novo valor é enviado quando o signal muda, e somente então.

| O que acontece no app | O que o componente recebe |
|---|---|
| O elemento é criado | Toda prop própria definida, logo depois que o componente é criado |
| O valor de uma prop muda | Essa prop com seu novo valor |
| Uma prop passa a ser `undefined` | Essa prop sem valor (`nil` em Swift, `null` em Java) |
| Uma prop vinculada a um valor animado se move | `setAnimatedNumber` / `setAnimatedColor`, nos frames em que ela muda |

As props carregam valores JSON; mantenha a interface restrita a dados (funções e instâncias de classe ficam no app).

<a id="animated-props"></a>

### Props animadas

Uma prop também pode ser um valor animado: um `AnimatedValue` ou um nó derivado de um (`interpolate`, o
`scrollValue` ou o `pullValue` de uma scroll view). Ela então não é enviada como JSON: o NSH a vincula, e o componente recebe o valor na thread
de UI a cada frame em que ele muda, sem passar pelo JS, de modo que possa acompanhar um arrasto ou um pull to refresh.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

O componente recebe números com `setAnimatedNumber(name, value)` e cores com `setAnimatedColor(name, argb)`
(`0xAARRGGBB`); por padrão, ambos chamam `setProp` com o número, de modo que um componente que não os implementa ainda
recebe o valor. Componentes Rust implementam `set_animated_number` e `set_animated_color`, e o código Rust vincula uma prop
com `native(name).bind_animated_prop("progress", &value)`. Dar à prop um valor simples novamente a desvincula e envia
esse valor. A web não tem componentes registrados.

<a id="events"></a>

## Eventos

O componente emite um evento por nome com um payload JSON opcional. O NSH o entrega à thread do engine e chama o
handler correspondente com o payload (em Rust, o listener `on_native_event` com o `name` e o `data` do evento):

```rust tabs
use serde_json::json;

native("acme.map")
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .on_native_event(move |e: &NativeEvent| match &*e.name {
        "regionChange" => center.set((
            e.data["latitude"].as_f64().unwrap_or_default(),
            e.data["longitude"].as_f64().unwrap_or_default(),
        )),
        "markerPress" => open(e.data["id"].as_str().unwrap_or_default()),
        _ => {}
    })
    .flex_1()
```

```tsx tabs
const MapView = nativeComponent<
  { latitude: number; longitude: number; zoom?: number },
  { regionChange: { latitude: number; longitude: number }; markerPress: { id: string } }
>("acme.map", {
  props: ["latitude", "longitude", "zoom"],
  events: ["regionChange", "markerPress"],
});

<MapView
  latitude={52.52}
  longitude={13.405}
  onRegionChange={(region) => center.set(region)}
  onMarkerPress={({ id }) => open(id)}
  style={{ flex: 1 }}
/>;
```

Os eventos são assíncronos: a thread principal nunca espera pelo código do app. Um componente que precisa decidir algo na hora (se
este gesto pode começar, se esta região pode mudar) tem de decidir isso nativamente, a partir das props que recebeu antes.

<a id="commands"></a>

## Comandos

Chamadas imperativas (dar zoom em um ponto, iniciar a reprodução, pulsar uma animação) passam pela ref do elemento (`element_ref()` em Rust, `ref` em TSX):

```rust tabs
let map = element_ref();

native("acme.map")
    .element_ref(&map)
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .flex_1()

map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
let map: NativeComponentRef | undefined;

<MapView ref={(node) => (map = node)} latitude={52.52} longitude={13.405} style={{ flex: 1 }} />;

map?.command("zoomTo", { level: 3 });
```

`command(name, args)` (TSX: `command(name, args?)`) envia o nome e os argumentos (qualquer valor JSON) ao método `command` do componente. Os comandos
são aplicados em ordem junto com as alterações feitas antes deles, de modo que um comando emitido logo após uma mudança de prop enxerga a nova prop.

<a id="sizing"></a>

## Dimensionamento

O container é posicionado como um `<View>`:

- Onde o estilo define uma dimensão (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), essa dimensão prevalece.
- Onde o estilo deixa uma dimensão em aberto, o container assume o tamanho que o componente informou com `setSize`, como uma
  imagem assume seu tamanho natural. Um componente que nunca informa um tamanho mede 0 nas dimensões em aberto.

Informe o tamanho em points (iOS) ou dp (Android) sempre que o conteúdo mudar. O badge acima mede seu rótulo a cada
vez que `text` muda e informa o tamanho do rótulo mais o padding, de modo que `alignSelf: "flex-start"` deixa o badge exatamente tão
largo quanto seu texto.

<a id="registering-on-ios-swift"></a>

## Registrando no iOS (Swift)

Implemente `NshComponent` e registre uma factory no `NshAppView`:

```swift
import NativeShell
import UIKit

/// `embed.badge`: props `text` and `color`; emits `tap`; command `pulse`.
final class Badge: NshComponent {
    let view = UIView()
    private let label = UILabel()
    private let context: NshComponentContext
    private var taps = 0

    init(_ context: NshComponentContext) {
        self.context = context
        label.textColor = .white
        label.font = .boldSystemFont(ofSize: 17)
        label.textAlignment = .center
        label.frame = view.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
        view.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(tapped)))
    }

    func setProp(_ name: String, _ value: Any?) {
        switch name {
        case "text":
            label.text = value as? String
            let size = label.intrinsicContentSize
            context.setSize(CGSize(width: size.width + 32, height: size.height + 20))
        case "color":
            view.backgroundColor = (value as? String).flatMap(UIColor.init(hex:)) ?? .systemPurple
        default:
            break
        }
    }

    func command(_ name: String, _ args: Any?) {
        guard name == "pulse" else { return }
        view.alpha = 0.3
        UIView.animate(withDuration: 0.6) { self.view.alpha = 1 }
    }

    @objc private func tapped() {
        taps += 1
        context.emit("tap", ["count": taps])
    }
}

// Before loading the bundle:
app.register(component: "embed.badge") { context in Badge(context) }
```

(`UIColor(hex:)` é um pequeno helper do exemplo, não faz parte do NativeShell.)

| API | Descrição |
|---|---|
| `NshAppView.register(component:_:)` | Registra uma factory `(NshComponentContext) -> NshComponent` sob um nome. Ela cria um componente por elemento criado a partir de então. Registrar um nome novamente substitui a factory. |
| `protocol NshComponent` | `var view: UIView` (preenche o container), `setProp(_:_:)`, `command(_:_:)` (opcional: o padrão ignora comandos). Isolado no main actor. |
| `setProp(_ name: String, _ value: Any?)` | Os valores são objetos JSON do Foundation: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; `nil` quando a prop foi removida. |
| `NshComponentContext.emit(_:_:)` | Emite um evento; os dados devem ser algo que `JSONSerialization` aceite (ou `nil`). Thread-safe. |
| `NshComponentContext.setSize(_:)` | Informa o tamanho do próprio componente em points. Thread-safe. |

<a id="registering-on-android-java--kotlin"></a>

## Registrando no Android (Java / Kotlin)

Implemente `com.longbridge.nsh.NshComponent` e registre uma factory no `NshView`:

```java
import com.longbridge.nsh.NshComponent;
import com.longbridge.nsh.NshComponentContext;

final class Badge implements NshComponent {
    private final TextView label;
    private final NshComponentContext context;
    private final float density;
    private int taps;

    Badge(Context app, NshComponentContext context) {
        this.context = context;
        density = app.getResources().getDisplayMetrics().density;
        label = new TextView(app);
        label.setTextColor(Color.WHITE);
        label.setTextSize(17);
        label.setGravity(Gravity.CENTER);
        label.setOnClickListener(v -> context.emit("tap", Collections.singletonMap("count", ++taps)));
    }

    @Override
    public View view() {
        return label;
    }

    @Override
    public void setProp(String name, Object value) {
        if (name.equals("text")) {
            label.setText(value instanceof String ? (String) value : "");
            label.measure(0, 0);
            // Sizes are in dp.
            context.setSize(label.getMeasuredWidth() / density + 32, label.getMeasuredHeight() / density + 12);
        } else if (name.equals("color")) {
            label.setBackgroundColor(value instanceof String ? Color.parseColor((String) value) : 0xff8250df);
        }
    }

    @Override
    public void command(String name, Object args) {
        if (!name.equals("pulse")) return;
        label.setAlpha(0.3f);
        label.animate().alpha(1).setDuration(600).start();
    }
}

// Before loading the bundle:
nsh.registerComponent("embed.badge", context -> new Badge(this, context));
```

O mesmo em Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Descrição |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Registra uma factory sob um nome; ela cria um componente por elemento criado a partir de então (thread de UI). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (o elemento não existe mais: foi removido, ou seu app foi interrompido por `NshView.destroy()` ou substituído por outro carregamento; chamado uma vez por componente). Chamado na thread de UI. |
| Valores de `setProp` | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map` ou `null` quando removida (ou JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | Emite um evento; `data` com os mesmos tipos Java, ou `null`. Qualquer thread. |
| `NshComponentContext.setSize(float width, float height)` | Informa o tamanho do próprio componente em dp. Qualquer thread. |

<a id="registering-from-rust"></a>

## Registrando a partir do Rust

Apps que incorporam o runtime do iOS a partir do Rust (`nsh-platform-ios`) registram um `NativeComponent` em um `AppView`:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_ios::{AppView, ComponentContext, NativeComponent};
use objc2_ui_kit::UIView;

struct Badge {
    view: objc2::rc::Retained<UIView>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> &UIView {
        &self.view
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        // ... update the view, then report its size in points:
        self.context.set_size(120.0, 40.0);
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, make_view: impl Fn() -> objc2::rc::Retained<UIView> + 'static) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { view: make_view(), context })
        }),
    );
}
```

`ComponentContext::emit(name, data)` envia um evento (`data` é um `serde_json::Value`) e `set_size(width, height)`
informa o tamanho; ambos funcionam a partir de qualquer thread.

<a id="registering-on-macos-rust"></a>

## Registrando no macOS (Rust)

No macOS, o componente é um `NSView`, registrado no [`AppView`](./macos.md#embedding-in-a-mac-app) de
`nsh-platform-macos`:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_macos::{
    objc2::{rc::Retained, MainThreadMarker},
    objc2_app_kit::{NSTextField, NSView},
    objc2_foundation::NSString,
    AppView, ComponentContext, NativeComponent,
};

struct Badge {
    label: Retained<NSTextField>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(Retained::into_super(self.label.clone()))
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            let text = value.and_then(|v| v.as_str()).unwrap_or("");
            self.label.setStringValue(&NSString::from_str(text));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, mtm: MainThreadMarker) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: NSTextField::labelWithString(&NSString::new(), mtm), context })
        }),
    );
}
```

A view preenche o container que o NSH posiciona; `ComponentContext::emit` e `set_size` (points) funcionam a partir de qualquer thread, como
no iOS. Registre antes de `AppView::load`; um registro pertence a um `AppView` (e às views criadas a partir do mesmo
`AppOptions`).

<a id="registering-on-linux-rust"></a>

## Registrando no Linux (Rust)

No Linux, o componente é um widget GTK, registrado no [`AppView`](./linux.md#embedding-in-a-gtk-app) de
`nsh-platform-linux`:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_linux::{gtk4 as gtk, AppView, ComponentContext, NativeComponent};
use gtk::prelude::*;

struct Badge {
    label: gtk::Label,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn widget(&self) -> gtk::Widget {
        self.label.clone().upcast()
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            self.label.set_text(value.and_then(|v| v.as_str()).unwrap_or(""));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: gtk::Label::new(None), context })
        }),
    );
}
```

O widget preenche o container que o NSH posiciona; `ComponentContext::emit` e `set_size` (points) funcionam a partir de qualquer thread,
como no iOS. Registre antes de `AppView::load`. Um registro pertence a um `AppView` (e às views criadas a partir do mesmo
`AppOptions`, cujo campo `components` ele é).

<a id="registering-on-windows-rust"></a>

## Registrando no Windows (Rust)

No Windows, o NSH desenha todas as views por conta própria com Direct2D, então um componente ou desenha em seu container com Direct2D
(`draw`) ou traz uma janela própria (`window`: um controle de mapa, uma view de terceiros), registrado no
[`AppView`](./windows.md#embedding-in-a-win32-app) de `nsh-platform-windows`:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_windows::{
    windows::Win32::Graphics::Direct2D::{
        Common::{D2D1_COLOR_F, D2D_RECT_F},
        ID2D1DeviceContext,
    },
    AppView, ComponentContext, NativeComponent,
};

/// A box filled with the color of its `on` prop.
struct Badge {
    on: bool,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn draw(&self, dc: &ID2D1DeviceContext, size: (f32, f32)) {
        let color = if self.on {
            D2D1_COLOR_F { r: 0.2, g: 0.7, b: 0.3, a: 1.0 }
        } else {
            D2D1_COLOR_F { r: 0.6, g: 0.6, b: 0.6, a: 1.0 }
        };
        // SAFETY: Direct2D calls on the context nsh draws with.
        unsafe {
            if let Ok(brush) = dc.CreateSolidColorBrush(&color, None) {
                let rect = D2D_RECT_F { left: 0.0, top: 0.0, right: size.0, bottom: size.1 };
                dc.FillRectangle(&rect, &brush);
            }
        }
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "on" {
            self.on = value.and_then(|v| v.as_bool()).unwrap_or(false);
            self.context.set_size(120.0, 40.0);
            self.context.redraw();
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

`draw` é executado a cada frame da janela, nas coordenadas da view (points), recortado em seus limites; chame
`ComponentContext::redraw` quando o que ele mostra mudar. Um componente desenhado é coberto, recortado e transformado como qualquer
view, e seu container recebe os toques. Um componente que retorna uma janela filha de `window` é movido, recortado e
ocultado junto com sua view, recebe sua própria entrada e fica acima de tudo o que o NSH desenha (o conteúdo do NSH sobre ele fica oculto, como
com web views). `ComponentContext::emit`, `set_size` (points) e `redraw` funcionam a partir de qualquer thread. Registre antes de
`AppView::load`; um registro pertence a um `AppView` (e às views criadas a partir do mesmo `AppOptions`).

Um componente também recebe a roda do mouse e as rolagens do touchpad sobre ele com `wheel` (um visualizador de imagens dá zoom com elas). O
`Wheel` que ele recebe contém o ponteiro (`x`, `y`, em points do componente), a distância em points (`dx`, `dy`, positiva
para a direita e para baixo, como as scroll views movem seu conteúdo) e em cliques da roda (`notches_x`, `notches_y`, com
frações de touchpads de precisão e rodas de alta resolução), se veio em passos finos (`precise`) e os
modificadores pressionados (`shift`, `ctrl`, `alt`). Ele retorna `true` para uma rolagem que tratou; as scroll views ao redor rolam com
o restante e, por padrão, com todas elas. Uma rolagem que uma scroll view iniciou permanece nessa view. Ctrl + roda também é o gesto de pinça de um
touchpad de precisão, e Shift + roda chega como a roda a enviou (`dy`, com `shift`):

```rust
use nsh_platform_windows::Wheel;

impl NativeComponent for ImageView {
    // draw, set_prop, ...

    fn wheel(&mut self, event: &Wheel) -> bool {
        if !event.ctrl {
            return false; // the scroll views around it scroll
        }
        // √2 per notch, about the pointer.
        let factor = 2f32.powf(-event.notches_y / 2.0);
        self.zoom_about(event.x, event.y, factor);
        self.context.redraw();
        true
    }
}
```

<a id="registering-from-the-apps-crate"></a>

## Registrando a partir do crate do app

Um app com um crate Rust próprio (`nsh.json` `"rust"`, [Rust](./rust.md)) registra componentes nativos nesse
crate, de modo que funcionem nos hosts que o NSH constrói para o app: o host de desenvolvimento de `nsh run` e `nsh test --target`, e
o app que `nsh package` gera. Uma função com `#[native_components(<platform>)]` na raiz do crate (`lib.rs`) os registra
no `Components` dessa plataforma, e o host a chama para cada view que cria, assim como um app incorporador registra em
seu `AppView`:

```rust
use std::rc::Rc;
use nsh_core::prelude::*;

#[native_components(windows)]
fn components(components: &nsh_platform_windows::Components) {
    use nsh_platform_windows::{ComponentContext, NativeComponent};
    components.register(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

A plataforma é `windows`, `macos`, `linux` ou `ios`, e os componentes são os de
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` ou `nsh_platform_ios` (as seções acima). A
função é compilada somente em sua plataforma, então um crate tem uma por plataforma que suporta, cada uma registrando os mesmos nomes,
e depende do crate de cada plataforma somente para essa plataforma, na versão e a partir da fonte de seus outros
crates do NSH (`nsh-core` e os demais; a CLI verifica se todos coincidem):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

O host registra os componentes do crate quando cria cada view, antes de o código que mantém a view registrar os
seus: um nome registrado na view depois disso (`AppView::register_component`) substitui o do crate.
<a id="rules-and-limits"></a>

## Regras e limites

- **Registre antes de carregar.** As factories se aplicam aos elementos criados após o registro. Registre todos os nomes antes de
  `loadBundle` / `loadAssetBundle` / `run`, para que o primeiro frame os encontre.
- **O contêiner é dono da decoração e dos toques.** Fundo, bordas, raio dos cantos, sombras, opacidade, transformações e
  `overflow: "hidden"` se aplicam ao contêiner que o NSH desenha. Sua view o preenche e recebe os toques que caem dentro dele.
- **As capabilities não se aplicam.** Um componente registrado é código do próprio app host; as
  [capabilities](./sandbox-and-capabilities.md) que um app declara não restringem o que ele faz. Se você incorpora apps em
  que não confia, registre apenas componentes que sejam seguros para eles.
- **Mantenha a interface restrita a dados.** Props, payloads de eventos e argumentos de comandos atravessam como texto JSON; envie identificadores e
  valores pequenos, não blobs grandes, a cada mudança.
- **Um bundle, as duas plataformas.** Registre os mesmos nomes com as mesmas props e eventos no iOS e no Android, para que um só bundle
  rode em ambas.
- **Nomes sob `nsh/` pertencem ao NSH.** Os componentes próprios do NSH (a barra de abas do sistema do `nsh/mobile` no `TabBar`) são
  registrados sob `nsh/`; dê aos seus o nome do seu app ou da sua empresa (`embed.badge`), e um registro sob `nsh/` gera
  um aviso no log e mantém o do NSH.

<a id="see-also"></a>

## Veja também

- [Referência de `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Incorporação em apps iOS](./ios.md) e [em apps Android](./android.md)
- [Arquitetura](./architecture.md): como props e eventos atravessam threads
