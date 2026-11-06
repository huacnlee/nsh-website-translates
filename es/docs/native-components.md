---
title: "Componentes nativos"
description: "Usa vistas de la aplicación host (mapas, reproductores, cualquier UIView o Android View) dentro de una aplicación NSH, con props, eventos, comandos y dimensionamiento."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---


# Componentes nativos

Un componente nativo es una vista que la **app anfitriona** registra por nombre: un mapa, una vista previa de la cámara, una biblioteca de gráficos, cualquier
`UIView` en iOS, `android.view.View` en Android, `NSView` en macOS, `gtk::Widget` en Linux, o dibujo con Direct2D o un
`HWND` hijo en Windows. La app NSH lo usa como cualquier otro elemento: una app Rust lo crea con `native(name)` de
`nsh_core::prelude`, una app TSX lo declara con `nativeComponent()` de [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). NSH lo distribuye en el layout junto con el resto de la
app, le envía props, entrega sus eventos a los manejadores y reenvía los comandos de un `ref`.

Como NSH renderiza con las vistas propias del sistema, un componente nativo es simplemente una subvista más en la misma jerarquía:
no hay problemas de capas, se recorta, se desplaza y recibe toques como un `<View>`.

> [!NOTE]
> Los componentes nativos los registra la app que incorpora NSH ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)), o, en Windows, macOS, Linux e iOS, el propio crate de Rust de la app,
> cuyos componentes registran el host de desarrollo y la app empaquetada (`nsh package`)
> ([Registro desde el crate de la app](#registering-from-the-apps-crate)). Un nombre que nadie ha registrado produce una vista
> vacía (el nombre se registra una sola vez en el log como desconocido).

<a id="how-it-fits-together"></a>

## Cómo encaja todo

1. La app anfitriona registra una factory bajo un nombre, como `"embed.badge"`, en su `NshAppView` (iOS) o `NshView`
   (Android). Cada vista tiene su propio registro; no hay nada global.
2. La app NSH declara un componente para ese nombre con las props y los eventos que usa.
3. Cuando se crea el elemento, NSH crea una vista contenedora (decorada, con marco y hit-testing como cualquier vista), luego
   pide un componente a la factory y coloca la vista del componente dentro del contenedor, llenándolo.
4. El componente recibe todas las props justo después de crearse y, después, cada prop de nuevo cuando cambia.
5. El componente emite eventos y puede informar de su propio tamaño; la app llama a sus comandos a través de un `ref`.

<a id="using-the-component-in-the-app"></a>

## Uso del componente en la app

En Rust, `native(name)` crea el elemento: `.prop(name, value)` le asigna una prop (un `serde_json::Value`, o una señal o un
closure de uno, que se vuelve a enviar cuando cambia), `.on_native_event(..)` escucha sus eventos como `NativeEvent { name, data }`, y los métodos de un
`element_ref()` colocado en él con `.element_ref(&r)` envían sus comandos. En TSX, `nativeComponent()` declara un componente
para el nombre con las props y los eventos que usa.

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

La versión TSX es `examples/embedded/App.tsx`, que ejecutan las dos muestras de incorporación del repositorio.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `name` | `string` | El nombre que registró la app anfitriona. Usa un prefijo propio (`"maps.view"`, `"acme.chart"`) para que los nombres sean únicos. |
| `spec.props` | `readonly (keyof P & string)[]` | Las props propias del componente. Solo las props listadas aquí se envían al lado nativo. |
| `spec.events` | `readonly (keyof E & string)[]` | Los eventos que emite. Opcional. |

Los parámetros de tipo describen las props (`P`) y la carga útil de cada evento (`E`). El componente devuelto acepta:

- las props propias del componente `P`;
- un manejador por evento: el evento `tap` lo maneja `onTap`, `regionChange` lo maneja `onRegionChange` (la primera letra se
  pone en mayúscula y se antepone `on`);
- todo lo que acepta un `<View>` excepto children: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), layout,
  props de accesibilidad, `testID`, `onLayout`, `ref`. Estas pertenecen al contenedor que dibuja NSH, no al componente.

Un componente nativo es una hoja: no acepta hijos.

## Props

Cada prop propia se envía como JSON, por lo que su valor puede ser cualquier valor JSON: cadenas, números, booleanos, `null`, arrays y
objetos simples. Las props son reactivas como cualquier otra: cuando el closure de una prop de Rust (`.prop("text", move || json!(label.get()))`)
o un `text={label()}` de TSX lee una señal, el nuevo valor se envía cuando la señal cambia, y solo entonces.

| Qué ocurre en la app | Qué recibe el componente |
|---|---|
| Se crea el elemento | Cada prop propia que esté definida, justo después de crearse el componente |
| Cambia el valor de una prop | Esa prop con su nuevo valor |
| Una prop pasa a ser `undefined` | Esa prop sin valor (`nil` en Swift, `null` en Java) |
| Se mueve una prop enlazada a un valor animado | `setAnimatedNumber` / `setAnimatedColor`, en los fotogramas en que cambia |

Las props transportan valores JSON; mantén la interfaz limitada a datos (las funciones y las instancias de clase se quedan en la app).

<a id="animated-props"></a>

### Props animadas

Una prop también puede ser un valor animado: un `AnimatedValue`, o un nodo derivado de uno (`interpolate`, el
`scrollValue` o el `pullValue` de una scroll view). En ese caso no se envía como JSON: NSH la enlaza, y el componente recibe el valor en el hilo
de UI en cada fotograma en que cambia, sin pasar por JS, de modo que puede seguir un arrastre o un pull to refresh.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

El componente recibe los números con `setAnimatedNumber(name, value)` y los colores con `setAnimatedColor(name, argb)`
(`0xAARRGGBB`); por defecto ambos llaman a `setProp` con el número, de modo que un componente que no los implementa sigue
recibiendo el valor. Los componentes Rust implementan `set_animated_number` y `set_animated_color`, y el código Rust enlaza una prop
con `native(name).bind_animated_prop("progress", &value)`. Volver a darle a la prop un valor simple la desenlaza y envía ese
valor. La web no tiene componentes registrados.

<a id="events"></a>

## Eventos

El componente emite un evento por nombre con una carga útil JSON opcional. NSH lo entrega al hilo del motor y llama al
manejador correspondiente con la carga útil (en Rust, el único listener `on_native_event` con el `name` y el `data` del evento):

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

Los eventos son asíncronos: el hilo principal nunca espera al código de la app. Un componente que deba decidir algo en el acto (si
puede empezar este gesto, si puede cambiar esta región) tiene que decidirlo de forma nativa, a partir de las props que recibió antes.

<a id="commands"></a>

## Comandos

Las llamadas imperativas (hacer zoom a un punto, iniciar la reproducción, pulsar una animación) pasan por la ref del elemento (`element_ref()` en Rust, `ref` en TSX):

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

`command(name, args)` (TSX: `command(name, args?)`) envía el nombre y los argumentos (cualquier valor JSON) al método `command` del componente. Los comandos
se aplican en orden junto con los cambios hechos antes de ellos, de modo que un comando emitido justo después de un cambio de prop ve la nueva prop.

<a id="sizing"></a>

## Tamaño

El contenedor se distribuye en el layout como un `<View>`:

- Donde el estilo da una dimensión (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), esa dimensión prevalece.
- Donde el estilo deja una dimensión abierta, el contenedor toma el tamaño que el componente informó con `setSize`, igual que una
  imagen toma su tamaño natural. Un componente que nunca informa de un tamaño mide 0 en las dimensiones abiertas.

Informa del tamaño en puntos (iOS) o dp (Android) cada vez que cambie el contenido. El badge de arriba mide su etiqueta cada
vez que `text` cambia e informa del tamaño de la etiqueta más el padding, de modo que `alignSelf: "flex-start"` hace que el badge tenga exactamente el
ancho de su texto.

<a id="registering-on-ios-swift"></a>

## Registro en iOS (Swift)

Implementa `NshComponent` y registra una factory en el `NshAppView`:

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

(`UIColor(hex:)` es un pequeño helper de la muestra, no forma parte de NativeShell.)

| API | Descripción |
|---|---|
| `NshAppView.register(component:_:)` | Registra una factory `(NshComponentContext) -> NshComponent` bajo un nombre. Crea un componente por cada elemento creado a partir de ese momento. Registrar de nuevo un nombre reemplaza la factory. |
| `protocol NshComponent` | `var view: UIView` (llena el contenedor), `setProp(_:_:)`, `command(_:_:)` (opcional: por defecto ignora los comandos). Aislado al main actor. |
| `setProp(_ name: String, _ value: Any?)` | Los valores son objetos JSON de Foundation: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; `nil` cuando se quitó la prop. |
| `NshComponentContext.emit(_:_:)` | Emite un evento; los datos deben ser algo que `JSONSerialization` acepte (o `nil`). Seguro para hilos. |
| `NshComponentContext.setSize(_:)` | Informa del tamaño propio del componente en puntos. Seguro para hilos. |

<a id="registering-on-android-java--kotlin"></a>

## Registro en Android (Java / Kotlin)

Implementa `com.longbridge.nsh.NshComponent` y registra una factory en el `NshView`:

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

Lo mismo en Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Descripción |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Registra una factory bajo un nombre; crea un componente por cada elemento creado a partir de ese momento (hilo de UI). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (el elemento ya no existe: se quitó, o su app se detuvo con `NshView.destroy()` o fue reemplazada por otra carga; se llama una vez por componente). Se llama en el hilo de UI. |
| Valores de `setProp` | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map`, o `null` cuando se quita (o JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | Emite un evento; `data` con los mismos tipos de Java, o `null`. Cualquier hilo. |
| `NshComponentContext.setSize(float width, float height)` | Informa del tamaño propio del componente en dp. Cualquier hilo. |

<a id="registering-from-rust"></a>

## Registro desde Rust

Las apps que incorporan el runtime de iOS desde Rust (`nsh-platform-ios`) registran un `NativeComponent` en un `AppView`:

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

`ComponentContext::emit(name, data)` envía un evento (`data` es un `serde_json::Value`) y `set_size(width, height)`
informa del tamaño; ambos funcionan desde cualquier hilo.

<a id="registering-on-macos-rust"></a>

## Registro en macOS (Rust)

En macOS el componente es un `NSView`, registrado en el [`AppView`](./macos.md#embedding-in-a-mac-app) de
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

La vista llena el contenedor que NSH distribuye en el layout; `ComponentContext::emit` y `set_size` (puntos) funcionan desde cualquier hilo, como
en iOS. Registra antes de `AppView::load`; un registro pertenece a un `AppView` (y a las vistas creadas a partir del mismo
`AppOptions`).

<a id="registering-on-linux-rust"></a>

## Registro en Linux (Rust)

En Linux el componente es un widget de GTK, registrado en el [`AppView`](./linux.md#embedding-in-a-gtk-app) de
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

El widget llena el contenedor que NSH distribuye en el layout; `ComponentContext::emit` y `set_size` (puntos) funcionan desde cualquier hilo,
como en iOS. Registra antes de `AppView::load`. Un registro pertenece a un `AppView` (y a las vistas creadas a partir del mismo
`AppOptions`, de quien es el campo `components`).

<a id="registering-on-windows-rust"></a>

## Registro en Windows (Rust)

En Windows NSH dibuja cada vista por sí mismo con Direct2D, así que un componente o bien dibuja en su contenedor con Direct2D
(`draw`) o bien aporta una ventana propia (`window`: un control de mapa, una vista de terceros), registrado en el
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

`draw` se ejecuta en cada fotograma de la ventana, en las coordenadas de la vista (puntos), recortado a sus límites; llama a
`ComponentContext::redraw` cuando cambie lo que muestra. Un componente dibujado se cubre, se recorta y se transforma como cualquier
vista, y su contenedor recibe los toques. Un componente que devuelve una ventana hija desde `window` se mueve, se recorta y
se oculta junto con su vista, recibe su propia entrada y queda por encima de todo lo que dibuja NSH (el contenido de NSH sobre ella se oculta, igual
que con las web views). `ComponentContext::emit`, `set_size` (puntos) y `redraw` funcionan desde cualquier hilo. Registra antes de
`AppView::load`; un registro pertenece a un `AppView` (y a las vistas creadas a partir del mismo `AppOptions`).

Un componente también recibe la rueda del ratón y los desplazamientos del touchpad sobre él con `wheel` (un visor de imágenes hace zoom con ellos). El
`Wheel` que recibe contiene el puntero (`x`, `y`, en puntos del componente), la distancia en puntos (`dx`, `dy`, positiva
hacia la derecha y hacia abajo, como las scroll views mueven su contenido) y en muescas de rueda (`notches_x`, `notches_y`, con
fracciones de los touchpads de precisión y las ruedas de alta resolución), si llegó en pasos finos (`precise`) y los
modificadores pulsados (`shift`, `ctrl`, `alt`). Devuelve `true` para un desplazamiento que consumió; las scroll views que lo rodean se desplazan con
el resto, y por defecto con todos. Un desplazamiento que una scroll view ya ha iniciado se queda en esa vista. Ctrl + rueda también es el pellizco de un
touchpad de precisión, y Shift + rueda llega tal como lo envió la rueda (`dy`, con `shift`):

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

## Registro desde el crate de la app

Una app con un crate de Rust propio (`nsh.json` `"rust"`, [Rust](./rust.md)) registra los componentes nativos en ese
crate, de modo que funcionen en los hosts que NSH construye para la app: el host de desarrollo de `nsh run` y `nsh test --target`, y
la app que `nsh package` genera. Una función con `#[native_components(<platform>)]` en la raíz del crate (`lib.rs`) los registra
en el `Components` de esa plataforma, y el host la llama para cada vista que crea, igual que una app anfitriona registra en
su `AppView`:

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

La plataforma es `windows`, `macos`, `linux` o `ios`, y los componentes son los de
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` o `nsh_platform_ios` (las secciones anteriores). La
función solo compila en su plataforma, así que un crate tiene una por cada plataforma que soporta, cada una registrando los mismos nombres,
y depende del crate de cada plataforma solo para esa plataforma, en la versión y desde la fuente de sus otros crates de NSH
(`nsh-core` y el resto; la CLI comprueba que todos coincidan):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

El host registra los componentes del crate cuando crea cada vista, antes de que el código que posee la vista registre los
suyos: un nombre registrado en la vista después de eso (`AppView::register_component`) reemplaza el del crate.
<a id="rules-and-limits"></a>

## Reglas y límites

- **Registra antes de cargar.** Las factories se aplican a los elementos creados después del registro. Registra cada nombre antes de
  `loadBundle` / `loadAssetBundle` / `run`, para que el primer frame los encuentre.
- **El contenedor es dueño de la decoración y de los toques.** El fondo, los bordes, el radio de las esquinas, las sombras, la opacidad, las transformaciones y
  `overflow: "hidden"` se aplican al contenedor que dibuja NSH. Tu vista lo llena y recibe los toques que caen dentro de él.
- **Las capabilities no se aplican.** Un componente registrado es código propio de la app anfitriona; las
  [capabilities](./sandbox-and-capabilities.md) que declara una app no restringen lo que este hace. Si incrustas apps en las que
  no confías, registra solo componentes que sean seguros para ellas.
- **Limita la interfaz a datos.** Las props, los payloads de eventos y los argumentos de comandos cruzan como texto JSON; envía identificadores y
  valores pequeños, no blobs grandes, en cada cambio.
- **Un bundle, ambas plataformas.** Registra los mismos nombres con las mismas props y eventos en iOS y Android, de modo que un
  bundle se ejecute en ambas.
- **Los nombres bajo `nsh/` pertenecen a NSH.** Los componentes propios de NSH (la barra de pestañas del sistema de `nsh/mobile` en `TabBar`) se
  registran bajo `nsh/`; nombra los tuyos según tu app o empresa (`embed.badge`), y un registro bajo `nsh/` genera
  una advertencia y conserva el de NSH.

<a id="see-also"></a>

## Véase también

- [Referencia de `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Incrustación en apps de iOS](./ios.md) y [en apps de Android](./android.md)
- [Arquitectura](./architecture.md): cómo cruzan las props y los eventos entre hilos
