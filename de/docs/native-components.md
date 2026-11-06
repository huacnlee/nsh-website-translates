---
title: "Native Components"
description: "Verwenden Sie Views der Host-App (Karten, Player, beliebige UIView oder Android View) innerhalb einer NSH-App, mit Props, Events, Commands und Größenanpassung."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---


# Native Components

Eine native Komponente ist eine View, die die **einbettende App** unter einem Namen registriert: eine Karte, eine Kameravorschau, eine Chart-Bibliothek, beliebige
`UIView` unter iOS, `android.view.View` unter Android, `NSView` unter macOS, `gtk::Widget` unter Linux oder Direct2D-Zeichnung bzw. ein
Child-`HWND` unter Windows. Die NSH-App verwendet sie wie jedes andere Element: Eine Rust-App erzeugt sie mit `native(name)` aus
`nsh_core::prelude`, eine TSX-App deklariert sie mit `nativeComponent()` aus [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). NSH legt sie zusammen mit dem Rest der
App aus, sendet ihr Props, liefert ihre Events an Handler und leitet Befehle von einem `ref` weiter.

Da NSH mit den systemeigenen Views rendert, ist eine native Komponente nur eine weitere Subview in derselben Hierarchie:
Es gibt kein Layering-Problem, sie wird zugeschnitten, scrollt und empfängt Touches wie eine `<View>`.

> [!NOTE]
> Native Komponenten werden von der App registriert, die NSH einbettet ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)), oder unter Windows, macOS, Linux und iOS vom eigenen Rust-Crate der App,
> dessen Komponenten der Development-Host und die paketierte App (`nsh package`) registrieren
> ([Registrierung aus dem Crate der App](#registering-from-the-apps-crate)). Ein Name, den nichts registriert hat, rendert eine leere
> View (der Name wird einmal als unbekannt protokolliert).

<a id="how-it-fits-together"></a>

## Wie alles zusammenspielt

1. Die Host-App registriert eine Factory unter einem Namen, etwa `"embed.badge"`, an ihrer `NshAppView` (iOS) bzw. `NshView`
   (Android). Jede View hat ihre eigene Registry; es gibt nichts Globales.
2. Die NSH-App deklariert eine Komponente für diesen Namen mit den Props und Events, die sie verwendet.
3. Beim Erzeugen des Elements erstellt NSH eine Container-View (dekoriert, mit Frame und Hit-Testing wie jede View),
   fragt dann die Factory nach einer Komponente und setzt die View der Komponente in den Container, den sie ausfüllt.
4. Die Komponente erhält jede Prop direkt nach ihrer Erzeugung, danach jede Prop erneut, wenn sie sich ändert.
5. Die Komponente sendet Events und kann ihre eigene Größe melden; die App ruft ihre Befehle über einen `ref` auf.

<a id="using-the-component-in-the-app"></a>

## Die Komponente in der App verwenden

In Rust erzeugt `native(name)` das Element: `.prop(name, value)` gibt ihm eine Prop (einen `serde_json::Value`, oder ein Signal oder eine
Closure darüber, die bei Änderung erneut gesendet wird), `.on_native_event(..)` hört seine Events als `NativeEvent { name, data }`, und die Methoden eines
`element_ref()`, der mit `.element_ref(&r)` darauf gesetzt wird, senden seine Befehle. In TSX deklariert `nativeComponent()` eine Komponente
für den Namen mit den Props und Events, die sie verwendet.

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

Die TSX-Version ist `examples/embedded/App.tsx`, die beide Embedding-Beispiele im Repository ausführen.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Parameter | Typ | Beschreibung |
|---|---|---|
| `name` | `string` | Der Name, den die Host-App registriert hat. Verwenden Sie ein eigenes Präfix (`"maps.view"`, `"acme.chart"`), damit Namen eindeutig bleiben. |
| `spec.props` | `readonly (keyof P & string)[]` | Die eigenen Props der Komponente. Nur die hier aufgeführten Props werden an die native Seite gesendet. |
| `spec.events` | `readonly (keyof E & string)[]` | Die Events, die sie sendet. Optional. |

Die Typparameter beschreiben die Props (`P`) und die Payload jedes Events (`E`). Die zurückgegebene Komponente akzeptiert:

- die eigenen Props der Komponente `P`;
- einen Handler pro Event: Event `tap` wird von `onTap` behandelt, `regionChange` von `onRegionChange` (der erste Buchstabe wird
  großgeschrieben und `on` vorangestellt);
- alles, was eine `<View>` akzeptiert, außer Children: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), Layout,
  Accessibility-Props, `testID`, `onLayout`, `ref`. Diese gehören zum Container, den NSH zeichnet, nicht zur Komponente.

Eine native Komponente ist ein Blatt (Leaf): Sie nimmt keine Children an.

## Props

Jede eigene Prop wird als JSON gesendet, ihr Wert kann also ein beliebiger JSON-Wert sein: Strings, Zahlen, Booleans, `null`, Arrays und
einfache Objekte. Props sind reaktiv wie alle anderen: Liest die Closure einer Rust-Prop (`.prop("text", move || json!(label.get()))`)
oder ein TSX-`text={label()}` ein Signal, wird der neue Wert gesendet, wenn sich das Signal ändert, und nur dann.

| Was in der App passiert | Was die Komponente erhält |
|---|---|
| Das Element wird erzeugt | Jede gesetzte eigene Prop, direkt nach der Erzeugung der Komponente |
| Der Wert einer Prop ändert sich | Diese Prop mit ihrem neuen Wert |
| Eine Prop wird `undefined` | Diese Prop ohne Wert (`nil` in Swift, `null` in Java) |
| Eine an einen animierten Wert gebundene Prop bewegt sich | `setAnimatedNumber` / `setAnimatedColor`, in den Frames, in denen sie sich ändert |

Props transportieren JSON-Werte; die Schnittstelle sollte auf Daten beschränkt bleiben (Funktionen und Klasseninstanzen bleiben in der App).

<a id="animated-props"></a>

### Animierte Props

Eine Prop kann auch ein animierter Wert sein: ein `AnimatedValue` oder ein davon abgeleiteter Knoten (`interpolate`, `scrollValue` oder
`pullValue` einer Scroll View). Sie wird dann nicht als JSON gesendet: NSH bindet sie, und der Komponente wird der Wert auf dem UI-Thread
in jedem Frame übergeben, in dem er sich ändert, ohne über JS zu laufen, sodass sie einem Drag oder einem Pull-to-Refresh folgen kann.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

Die Komponente erhält Zahlen mit `setAnimatedNumber(name, value)` und Farben mit `setAnimatedColor(name, argb)`
(`0xAARRGGBB`); standardmäßig rufen beide `setProp` mit der Zahl auf, sodass auch eine Komponente, die sie nicht implementiert,
den Wert erhält. Rust-Komponenten implementieren `set_animated_number` und `set_animated_color`, und Rust-Code bindet eine Prop
mit `native(name).bind_animated_prop("progress", &value)`. Wird der Prop wieder ein einfacher Wert gegeben, wird die Bindung aufgehoben und dieser
Wert gesendet. Das Web hat keine registrierten Komponenten.

## Events

Die Komponente sendet ein Event unter einem Namen mit optionaler JSON-Payload. NSH liefert es an den Engine-Thread und ruft den
passenden Handler mit der Payload auf (in Rust den einen `on_native_event`-Listener mit dem `name` und `data` des Events):

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

Events sind asynchron: Der Main-Thread wartet nie auf den Code der App. Eine Komponente, die etwas sofort entscheiden muss (darf
diese Geste starten, darf sich diese Region ändern), muss das nativ entscheiden, anhand von Props, die sie zuvor erhalten hat.

<a id="commands"></a>

## Befehle

Imperative Aufrufe (zu einem Punkt zoomen, Wiedergabe starten, eine Animation pulsieren lassen) laufen über die Ref des Elements (`element_ref()` in Rust, `ref` in TSX):

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

`command(name, args)` (TSX: `command(name, args?)`) sendet den Namen und die Argumente (beliebige JSON-Werte) an die Methode `command` der Komponente. Befehle
werden in Reihenfolge zusammen mit den davor vorgenommenen Änderungen angewendet, sodass ein Befehl unmittelbar nach einer Prop-Änderung die neue Prop sieht.

<a id="sizing"></a>

## Größenbestimmung

Der Container wird wie eine `<View>` ausgelegt:

- Gibt der Style eine Dimension vor (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), gilt diese Dimension.
- Lässt der Style eine Dimension offen, übernimmt der Container die Größe, die die Komponente mit `setSize` gemeldet hat, wie ein
  Image seine natürliche Größe. Eine Komponente, die nie eine Größe meldet, misst entlang offener Dimensionen 0.

Die Größe in Points (iOS) bzw. dp (Android) melden, sobald sich der Inhalt ändert. Das Badge oben misst sein Label bei
jeder Änderung von `text` und meldet die Größe des Labels plus Padding, sodass `alignSelf: "flex-start"` das Badge genau so
breit macht wie seinen Text.

<a id="registering-on-ios-swift"></a>

## Registrierung unter iOS (Swift)

`NshComponent` implementieren und eine Factory an der `NshAppView` registrieren:

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

(`UIColor(hex:)` ist ein kleiner Helper des Beispiels, kein Teil von NativeShell.)

| API | Beschreibung |
|---|---|
| `NshAppView.register(component:_:)` | Registriert eine Factory `(NshComponentContext) -> NshComponent` unter einem Namen. Sie erzeugt ab dann eine Komponente pro erzeugtem Element. Wird ein Name erneut registriert, ersetzt das die Factory. |
| `protocol NshComponent` | `var view: UIView` (füllt den Container), `setProp(_:_:)`, `command(_:_:)` (optional: der Default ignoriert Befehle). Main-Actor-isoliert. |
| `setProp(_ name: String, _ value: Any?)` | Werte sind Foundation-JSON-Objekte: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; `nil`, wenn die Prop entfernt wurde. |
| `NshComponentContext.emit(_:_:)` | Sendet ein Event; die Daten müssen etwas sein, das `JSONSerialization` akzeptiert (oder `nil`). Thread-sicher. |
| `NshComponentContext.setSize(_:)` | Meldet die eigene Größe der Komponente in Points. Thread-sicher. |

<a id="registering-on-android-java--kotlin"></a>

## Registrierung unter Android (Java / Kotlin)

`com.longbridge.nsh.NshComponent` implementieren und eine Factory an der `NshView` registrieren:

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

Dasselbe in Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Beschreibung |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Registriert eine Factory unter einem Namen; sie erzeugt ab dann eine Komponente pro erzeugtem Element (UI-Thread). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (das Element ist weg: entfernt, oder seine App wurde durch `NshView.destroy()` gestoppt oder durch ein anderes Laden ersetzt; wird einmal pro Komponente aufgerufen). Wird auf dem UI-Thread aufgerufen. |
| `setProp`-Werte | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map` oder `null`, wenn entfernt (oder JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | Sendet ein Event; `data` als dieselben Java-Typen oder `null`. Beliebiger Thread. |
| `NshComponentContext.setSize(float width, float height)` | Meldet die eigene Größe der Komponente in dp. Beliebiger Thread. |

<a id="registering-from-rust"></a>

## Registrierung aus Rust

Apps, die die iOS-Runtime aus Rust einbetten (`nsh-platform-ios`), registrieren eine `NativeComponent` an einer `AppView`:

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

`ComponentContext::emit(name, data)` sendet ein Event (`data` ist ein `serde_json::Value`) und `set_size(width, height)`
meldet die Größe; beide funktionieren von jedem Thread aus.

<a id="registering-on-macos-rust"></a>

## Registrierung unter macOS (Rust)

Unter macOS ist die Komponente eine `NSView`, registriert an der [`AppView`](./macos.md#embedding-in-a-mac-app) von
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

Die View füllt den Container, den NSH auslegt; `ComponentContext::emit` und `set_size` (Points) funktionieren von jedem Thread aus, wie
unter iOS. Vor `AppView::load` registrieren; eine Registry gehört zu einem `AppView` (und den aus demselben
`AppOptions` erzeugten Views).

<a id="registering-on-linux-rust"></a>

## Registrierung unter Linux (Rust)

Unter Linux ist die Komponente ein GTK-Widget, registriert an der [`AppView`](./linux.md#embedding-in-a-gtk-app) von
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

Das Widget füllt den Container, den NSH auslegt; `ComponentContext::emit` und `set_size` (Points) funktionieren von jedem Thread aus,
wie unter iOS. Vor `AppView::load` registrieren. Eine Registry gehört zu einem `AppView` (und den aus demselben
`AppOptions` erzeugten Views, dessen `components`-Feld sie ist).

<a id="registering-on-windows-rust"></a>

## Registrierung unter Windows (Rust)

Unter Windows zeichnet NSH jede View selbst mit Direct2D, daher zeichnet eine Komponente entweder mit Direct2D in ihren Container
(`draw`) oder bringt ein eigenes Fenster mit (`window`: ein Map-Control, eine View eines Drittanbieters), registriert an der
[`AppView`](./windows.md#embedding-in-a-win32-app) von `nsh-platform-windows`:

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

`draw` läuft mit jedem Frame des Fensters, in den Koordinaten der View (Points), auf deren Grenzen zugeschnitten; `ComponentContext::redraw`
aufrufen, wenn sich ändert, was sie zeigt. Eine gezeichnete Komponente wird wie jede
View überdeckt, zugeschnitten und transformiert, und ihr Container erhält die Touches. Eine Komponente, die von `window` ein Child-Fenster zurückgibt, wird mit ihrer View verschoben, zugeschnitten und
ausgeblendet, erhält ihre eigene Eingabe und liegt über allem, was NSH zeichnet (NSH-Inhalt darüber wird verdeckt, wie
bei Web Views). `ComponentContext::emit`, `set_size` (Points) und `redraw` funktionieren von jedem Thread aus. Vor
`AppView::load` registrieren; eine Registry gehört zu einem `AppView` (und den aus demselben `AppOptions` erzeugten Views).

Eine Komponente nimmt außerdem Mausrad- und Touchpad-Scrolls über ihr mit `wheel` entgegen (ein Image Viewer zoomt damit). Das
`Wheel`, das sie erhält, enthält den Zeiger (`x`, `y`, in Points der Komponente), die Distanz in Points (`dx`, `dy`, positiv
nach rechts und unten, wie Scroll Views ihren Inhalt bewegen) und in Rad-Rastungen (`notches_x`, `notches_y`, mit
Bruchteilen von Präzisions-Touchpads und hochauflösenden Rädern), ob es in feinen Schritten kam (`precise`) und die
gehaltenen Modifier (`shift`, `ctrl`, `alt`). Sie gibt `true` für ein Scrollen zurück, das sie übernommen hat; die Scroll Views darum herum scrollen mit
dem Rest, standardmäßig mit allen. Ein Scrollen, das eine Scroll View begonnen hat, bleibt bei dieser View. Ctrl + Rad ist auch das Pinch eines
Präzisions-Touchpads, und Shift + Rad kommt an, wie das Rad es gesendet hat (`dy`, mit `shift`):

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

## Registrierung aus dem Crate der App

Eine App mit einem eigenen Rust-Crate (`nsh.json` `"rust"`, [Rust](./rust.md)) registriert native Komponenten in diesem
Crate, damit sie in den Hosts funktionieren, die NSH für die App baut: dem Development-Host von `nsh run` und `nsh test --target` sowie
der App, die `nsh package` erzeugt. Eine Funktion mit `#[native_components(<platform>)]` im Root des Crates (`lib.rs`) registriert
sie an der `Components` dieser Plattform, und der Host ruft sie für jede View auf, die er erzeugt, so wie eine einbettende App an
ihrer `AppView` registriert:

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

Die Plattform ist `windows`, `macos`, `linux` oder `ios`, und die Komponenten sind die von
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` oder `nsh_platform_ios` (die Abschnitte oben). Die
Funktion wird nur auf ihrer Plattform kompiliert, daher hat ein Crate eine pro unterstützter Plattform, die jeweils dieselben Namen registriert,
und hängt vom Crate jeder Plattform nur für diese Plattform ab, in der Version und aus der Quelle seiner anderen NSH-Crates
(`nsh-core` und die übrigen; die CLI prüft, dass alle übereinstimmen):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

Der Host registriert die Komponenten des Crates, wenn er jede View erzeugt, bevor der Code, der die View hält, seine
eigenen registriert: Ein Name, der danach an der View registriert wird (`AppView::register_component`), ersetzt den des Crates.
<a id="rules-and-limits"></a>

## Regeln und Grenzen

- **Vor dem Laden registrieren.** Factories gelten für Elemente, die nach der Registrierung erstellt werden. Registriere jeden Namen vor
  `loadBundle` / `loadAssetBundle` / `run`, damit der erste Frame sie findet.
- **Der Container besitzt Dekoration und Touches.** Hintergrund, Rahmen, Eckenradius, Schatten, Deckkraft, Transformationen und
  `overflow: "hidden"` gelten für den Container, den NSH zeichnet. Deine View füllt ihn aus und empfängt die Touches, die innerhalb landen.
- **Capabilities gelten nicht.** Eine registrierte Komponente ist der eigene Code der Host-App; die
  [Capabilities](./sandbox-and-capabilities.md), die eine App deklariert, schränken nicht ein, was sie tut. Wenn du Apps einbettest, denen du
  nicht vertraust, registriere nur Komponenten, deren Verwendung für sie sicher ist.
- **Beschränke die Schnittstelle auf Daten.** Props, Event-Payloads und Command-Argumente werden als JSON-Text übergeben; sende bei jeder Änderung Bezeichner und
  kleine Werte, keine großen Blobs.
- **Ein Bundle, beide Plattformen.** Registriere dieselben Namen mit denselben Props und Events auf iOS und Android, damit ein
  Bundle auf beiden läuft.
- **Namen unter `nsh/` gehören NSH.** Die eigenen Komponenten von NSH (die System-Tab-Leiste von `nsh/mobile`s `TabBar`) sind
  unter `nsh/` registriert; benenne deine nach deiner App oder deiner Firma (`embed.badge`), und eine Registrierung unter `nsh/` protokolliert
  eine Warnung und behält die von NSH.

<a id="see-also"></a>

## Siehe auch

- [`nativeComponent`-Referenz](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Einbettung in iOS-Apps](./ios.md) und [in Android-Apps](./android.md)
- [Architektur](./architecture.md): wie Props und Events Threads überqueren
