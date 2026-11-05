---
title: "Componenti nativi"
description: "Usa le view dell'app host (mappe, player, qualsiasi UIView o Android View) all'interno di un'app NSH, con props, eventi, comandi e dimensionamento."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# Componenti nativi

Un componente nativo è una vista che l'**app host** registra con un nome: una mappa, un'anteprima della fotocamera, una libreria di grafici, qualsiasi
`UIView` su iOS, `android.view.View` su Android, `NSView` su macOS, `gtk::Widget` su Linux, oppure un disegno Direct2D o una
`HWND` figlia su Windows. L'app NSH lo usa come qualsiasi altro elemento: un'app Rust lo crea con `native(name)` di
`nsh_core::prelude`, un'app TSX lo dichiara con `nativeComponent()` di [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). NSH lo dispone insieme al resto dell'app, gli invia le prop, consegna i suoi eventi agli handler e inoltra i comandi da un `ref`.

Poiché NSH esegue il rendering con le viste proprie del sistema, un componente nativo è semplicemente una sottovista in più nella stessa gerarchia:
non esiste alcun problema di sovrapposizione dei livelli, e il componente viene ritagliato, scorre e riceve i tocchi come un `<View>`.

> [!NOTE]
> I componenti nativi sono registrati dall'app che incorpora NSH ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)), oppure, su Windows, macOS, Linux e iOS, dal crate Rust dell'app stessa,
> i cui componenti vengono registrati dall'host di sviluppo e dall'app pacchettizzata (`nsh package`)
> ([Registrazione dal crate dell'app](#registering-from-the-apps-crate)). Un nome che nessuno ha registrato produce una
> vista vuota (il nome viene registrato nel log una sola volta come sconosciuto).

<a id="how-it-fits-together"></a>

## Come si integra

1. L'app host registra una factory con un nome, ad esempio `"embed.badge"`, sul proprio `NshAppView` (iOS) o `NshView`
   (Android). Ogni vista ha il proprio registro; non esiste nulla di globale.
2. L'app NSH dichiara un componente per quel nome con le prop e gli eventi che usa.
3. Quando l'elemento viene creato, NSH crea una vista contenitore (decorata, dimensionata e sottoposta a hit-testing come qualsiasi vista), poi
   chiede alla factory un componente e inserisce la vista del componente nel contenitore, riempiendolo.
4. Il componente riceve ogni prop subito dopo la sua creazione, poi riceve di nuovo ciascuna prop quando cambia.
5. Il componente emette eventi e può comunicare la propria dimensione; l'app chiama i suoi comandi tramite un `ref`.

<a id="using-the-component-in-the-app"></a>

## Usare il componente nell'app

In Rust, `native(name)` crea l'elemento: `.prop(name, value)` gli assegna una prop (un `serde_json::Value`, oppure un signal o una
closure che ne restituisce uno, inviata di nuovo quando cambia), `.on_native_event(..)` ascolta i suoi eventi come `NativeEvent { name, data }`, e i metodi di un
`element_ref()` applicato con `.element_ref(&r)` inviano i suoi comandi. In TSX, `nativeComponent()` dichiara un componente
per il nome con le prop e gli eventi che usa.

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

La versione TSX è `examples/embedded/App.tsx`, che viene eseguita da entrambi gli esempi di integrazione nel repository.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Parametro | Tipo | Descrizione |
|---|---|---|
| `name` | `string` | Il nome registrato dall'app host. Usa un prefisso tuo (`"maps.view"`, `"acme.chart"`) in modo che i nomi restino univoci. |
| `spec.props` | `readonly (keyof P & string)[]` | Le prop del componente. Solo le prop elencate qui vengono inviate al lato nativo. |
| `spec.events` | `readonly (keyof E & string)[]` | Gli eventi che emette. Facoltativo. |

I parametri di tipo descrivono le prop (`P`) e il payload di ciascun evento (`E`). Il componente restituito accetta:

- le prop del componente `P`;
- un handler per evento: l'evento `tap` è gestito da `onTap`, `regionChange` da `onRegionChange` (la prima lettera viene
  messa in maiuscolo e viene anteposto `on`);
- tutto ciò che accetta un `<View>` tranne i children: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), layout,
  prop di accessibilità, `testID`, `onLayout`, `ref`. Queste appartengono al contenitore che NSH disegna, non al componente.

Un componente nativo è una foglia: non accetta children.

<a id="props"></a>

## Prop

Ogni prop propria viene inviata come JSON, quindi il suo valore può essere qualsiasi valore JSON: stringhe, numeri, booleani, `null`, array e
oggetti semplici. Le prop sono reattive come tutte le altre: quando la closure di una prop Rust (`.prop("text", move || json!(label.get()))`)
o un `text={label()}` TSX legge un signal, il nuovo valore viene inviato quando il signal cambia, e solo allora.

| Cosa succede nell'app | Cosa riceve il componente |
|---|---|
| L'elemento viene creato | Ogni prop propria impostata, subito dopo la creazione del componente |
| Il valore di una prop cambia | Quella prop con il nuovo valore |
| Una prop diventa `undefined` | Quella prop senza valore (`nil` in Swift, `null` in Java) |
| Una prop collegata a un valore animato si muove | `setAnimatedNumber` / `setAnimatedColor`, nei frame in cui cambia |

Le prop trasportano valori JSON; mantieni l'interfaccia limitata ai dati (le funzioni e le istanze di classe restano nell'app).

<a id="animated-props"></a>

### Prop animate

Una prop può anche essere un valore animato: un `AnimatedValue`, oppure un nodo derivato da uno di essi (`interpolate`, il
`scrollValue` o il `pullValue` di una scroll view). In tal caso non viene inviata come JSON: NSH la collega, e al componente il valore viene consegnato sul thread
UI a ogni frame in cui cambia, senza passare da JS, così può seguire un trascinamento o un pull to refresh.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

Il componente riceve i numeri con `setAnimatedNumber(name, value)` e i colori con `setAnimatedColor(name, argb)`
(`0xAARRGGBB`); per impostazione predefinita entrambi chiamano `setProp` con il numero, quindi un componente che non li implementa
riceve comunque il valore. I componenti Rust implementano `set_animated_number` e `set_animated_color`, e il codice Rust collega una prop
con `native(name).bind_animated_prop("progress", &value)`. Assegnare di nuovo alla prop un valore semplice la scollega e invia
quel valore. Il web non ha componenti registrati.

<a id="events"></a>

## Eventi

Il componente emette un evento per nome con un payload JSON facoltativo. NSH lo consegna al thread del motore e chiama l'handler
corrispondente con il payload (in Rust, l'unico listener `on_native_event` con il `name` e il `data` dell'evento):

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

Gli eventi sono asincroni: il thread principale non attende mai il codice dell'app. Un componente che deve decidere qualcosa sul momento (se
questo gesto può iniziare, se questa regione può cambiare) deve deciderlo in modo nativo, a partire dalle prop ricevute in precedenza.

<a id="commands"></a>

## Comandi

Le chiamate imperative (zoom su un punto, avvio della riproduzione, impulso di un'animazione) passano dal ref dell'elemento (`element_ref()` in Rust, `ref` in TSX):

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

`command(name, args)` (TSX: `command(name, args?)`) invia il nome e gli argomenti (qualsiasi valore JSON) al metodo `command` del componente. I comandi
vengono applicati in ordine insieme alle modifiche effettuate prima di essi, quindi un comando emesso subito dopo una modifica di prop vede la nuova prop.

<a id="sizing"></a>

## Dimensionamento

Il contenitore viene disposto come un `<View>`:

- Dove lo stile specifica una dimensione (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), vince quella dimensione.
- Dove lo stile lascia aperta una dimensione, il contenitore assume la dimensione comunicata dal componente con `setSize`, come un'immagine
  assume la propria dimensione naturale. Un componente che non comunica mai una dimensione misura 0 lungo le dimensioni aperte.

Comunica la dimensione in punti (iOS) o dp (Android) ogni volta che il contenuto cambia. Il badge qui sopra misura la propria etichetta ogni
volta che `text` cambia e comunica la dimensione dell'etichetta più il padding, quindi `alignSelf: "flex-start"` rende il badge largo esattamente
quanto il suo testo.

<a id="registering-on-ios-swift"></a>

## Registrazione su iOS (Swift)

Implementa `NshComponent` e registra una factory sul `NshAppView`:

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

(`UIColor(hex:)` è un piccolo helper dell'esempio, non fa parte di NativeShell.)

| API | Descrizione |
|---|---|
| `NshAppView.register(component:_:)` | Registra una factory `(NshComponentContext) -> NshComponent` con un nome. Crea un componente per ogni elemento creato da quel momento in poi. Registrare di nuovo un nome sostituisce la factory. |
| `protocol NshComponent` | `var view: UIView` (riempie il contenitore), `setProp(_:_:)`, `command(_:_:)` (facoltativo: l'implementazione predefinita ignora i comandi). Isolato sul main actor. |
| `setProp(_ name: String, _ value: Any?)` | I valori sono oggetti JSON di Foundation: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; `nil` quando la prop è stata rimossa. |
| `NshComponentContext.emit(_:_:)` | Emette un evento; i dati devono essere qualcosa che `JSONSerialization` accetta (oppure `nil`). Thread-safe. |
| `NshComponentContext.setSize(_:)` | Comunica la dimensione propria del componente in punti. Thread-safe. |

<a id="registering-on-android-java--kotlin"></a>

## Registrazione su Android (Java / Kotlin)

Implementa `com.longbridge.nsh.NshComponent` e registra una factory sul `NshView`:

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

Lo stesso in Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Descrizione |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Registra una factory con un nome; crea un componente per ogni elemento creato da quel momento in poi (thread UI). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (l'elemento non esiste più: è stato rimosso, oppure la sua app è stata fermata da `NshView.destroy()` o sostituita da un altro caricamento; chiamato una volta per componente). Chiamato sul thread UI. |
| Valori di `setProp` | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map`, oppure `null` quando rimossa (o JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | Emette un evento; `data` con gli stessi tipi Java, oppure `null`. Qualsiasi thread. |
| `NshComponentContext.setSize(float width, float height)` | Comunica la dimensione propria del componente in dp. Qualsiasi thread. |

<a id="registering-from-rust"></a>

## Registrazione da Rust

Le app che incorporano il runtime iOS da Rust (`nsh-platform-ios`) registrano un `NativeComponent` su un `AppView`:

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

`ComponentContext::emit(name, data)` invia un evento (`data` è un `serde_json::Value`) e `set_size(width, height)`
comunica la dimensione; entrambi funzionano da qualsiasi thread.

<a id="registering-on-macos-rust"></a>

## Registrazione su macOS (Rust)

Su macOS il componente è un `NSView`, registrato sul [`AppView`](./macos.md#embedding-in-a-mac-app) di
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

La vista riempie il contenitore che NSH dispone; `ComponentContext::emit` e `set_size` (punti) funzionano da qualsiasi thread, come
su iOS. Registra prima di `AppView::load`; un registro appartiene a un solo `AppView` (e alle viste create dallo stesso
`AppOptions`).

<a id="registering-on-linux-rust"></a>

## Registrazione su Linux (Rust)

Su Linux il componente è un widget GTK, registrato sul [`AppView`](./linux.md#embedding-in-a-gtk-app) di
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

Il widget riempie il contenitore che NSH dispone; `ComponentContext::emit` e `set_size` (punti) funzionano da qualsiasi thread,
come su iOS. Registra prima di `AppView::load`. Un registro appartiene a un solo `AppView` (e alle viste create dallo stesso
`AppOptions`, di cui è il campo `components`).

<a id="registering-on-windows-rust"></a>

## Registrazione su Windows (Rust)

Su Windows NSH disegna ogni vista da sé con Direct2D, quindi un componente o disegna nel proprio contenitore con Direct2D
(`draw`) oppure porta una finestra propria (`window`: un controllo mappa, una vista di terze parti), registrata sul
[`AppView`](./windows.md#embedding-in-a-win32-app) di `nsh-platform-windows`:

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

`draw` viene eseguito a ogni frame della finestra, nelle coordinate della vista (punti), ritagliato sui suoi limiti; chiama
`ComponentContext::redraw` quando ciò che mostra cambia. Un componente disegnato viene coperto, ritagliato e trasformato come qualsiasi
vista, e il suo contenitore riceve i tocchi. Un componente che restituisce una finestra figlia da `window` viene spostato, ritagliato e
nascosto insieme alla sua vista, riceve il proprio input e si trova sopra a tutto ciò che NSH disegna (il contenuto NSH sovrapposto viene nascosto, come
con le web view). `ComponentContext::emit`, `set_size` (punti) e `redraw` funzionano da qualsiasi thread. Registra prima di
`AppView::load`; un registro appartiene a un solo `AppView` (e alle viste create dallo stesso `AppOptions`).

Un componente riceve anche la rotellina del mouse e gli scroll del touchpad su di esso con `wheel` (un visualizzatore di immagini li usa per lo zoom). Il
`Wheel` che riceve contiene il puntatore (`x`, `y`, in punti del componente), la distanza in punti (`dx`, `dy`, positiva
verso destra e verso il basso, come le scroll view spostano il proprio contenuto) e in tacche della rotellina (`notches_x`, `notches_y`, con
frazioni dai touchpad di precisione e dalle rotelle ad alta risoluzione), se è arrivato a passi fini (`precise`) e i
modificatori premuti (`shift`, `ctrl`, `alt`). Restituisce `true` per uno scroll che ha gestito; le scroll view attorno ad esso scorrono con
il resto, e per impostazione predefinita con tutte. Uno scroll che una scroll view ha iniziato resta su quella vista. Ctrl + rotellina è anche il pinch di un
touchpad di precisione, e Shift + rotellina arriva così come l'ha inviato la rotellina (`dy`, con `shift`):

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

## Registrazione dal crate dell'app

Un'app con un crate Rust proprio (`nsh.json` `"rust"`, [Rust](./rust.md)) registra i componenti nativi in quel
crate, così funzionano negli host che NSH costruisce per l'app: l'host di sviluppo di `nsh run` e `nsh test --target`, e
l'app `nsh package` che produce. Una funzione con `#[native_components(<platform>)]` nella radice del crate (`lib.rs`) li registra
sul `Components` di quella piattaforma, e l'host la chiama per ogni vista che crea, come un'app host si registra sul
proprio `AppView`:

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

La piattaforma è `windows`, `macos`, `linux` o `ios`, e i componenti sono quelli di
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` o `nsh_platform_ios` (le sezioni precedenti). La
funzione viene compilata solo sulla propria piattaforma, quindi un crate ne ha una per ogni piattaforma supportata, ciascuna che registra gli stessi nomi,
e dipende dal crate di ciascuna piattaforma solo per quella piattaforma, alla versione e dalla sorgente degli altri crate NSH
(`nsh-core` e gli altri; la CLI verifica che coincidano tutti):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

L'host registra i componenti del crate quando crea ciascuna vista, prima del codice che detiene la vista e registra i
propri: un nome registrato sulla vista dopo di ciò (`AppView::register_component`) sostituisce quello del crate.
<a id="rules-and-limits"></a>

## Regole e limiti

- **Registra prima di caricare.** Le factory si applicano agli elementi creati dopo la registrazione. Registra ogni nome prima di
  `loadBundle` / `loadAssetBundle` / `run`, in modo che il primo frame li trovi.
- **Il container gestisce decorazione e tocchi.** Sfondo, bordi, raggio degli angoli, ombre, opacità, trasformazioni e
  `overflow: "hidden"` si applicano al container che NSH disegna. La tua view lo riempie e riceve i tocchi che cadono al suo interno.
- **Le capabilities non si applicano.** Un componente registrato è codice della app host; le
  [capabilities](./sandbox-and-capabilities.md) dichiarate da una app non limitano ciò che questo fa. Se incorpori app di cui
  non ti fidi, registra solo componenti che siano sicuri da usare per loro.
- **Limita l'interfaccia ai dati.** Props, payload degli eventi e argomenti dei comandi attraversano il confine come testo JSON; invia identificatori e
  piccoli valori, non grandi blob, a ogni modifica.
- **Un solo bundle, entrambe le piattaforme.** Registra gli stessi nomi con le stesse props ed eventi su iOS e Android, così un solo
  bundle funziona su entrambe.
- **I nomi sotto `nsh/` appartengono a NSH.** I componenti di NSH (la tab bar di sistema del `TabBar` di `nsh/mobile`) sono
  registrati sotto `nsh/`; dai ai tuoi un nome basato sulla tua app o azienda (`embed.badge`), perché una registrazione sotto `nsh/` registra
  un avviso nel log e mantiene quella di NSH.

<a id="see-also"></a>

## Vedi anche

- [Riferimento di `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Incorporare in app iOS](./ios.md) e [in app Android](./android.md)
- [Architettura](./architecture.md): come props ed eventi attraversano i thread
