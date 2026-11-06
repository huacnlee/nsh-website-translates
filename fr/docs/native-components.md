---
title: "Composants natifs"
description: "Utilisez des vues de l'application hôte (cartes, lecteurs, n'importe quelle UIView ou Android View) dans une application NSH, avec des props, des événements, des commandes et un dimensionnement."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# Composants natifs

Un composant natif est une vue que l'**app hôte** enregistre par nom : une carte, un aperçu de caméra, une bibliothèque de graphiques, n'importe quel
`UIView` sur iOS, `android.view.View` sur Android, `NSView` sur macOS, `gtk::Widget` sur Linux, ou un dessin Direct2D ou une
`HWND` enfant sur Windows. L'app NSH l'utilise comme n'importe quel autre élément : une app Rust le crée avec `native(name)` depuis
`nsh_core::prelude`, une app TSX le déclare avec `nativeComponent()` depuis [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). NSH le dispose avec le reste de
l'app, lui envoie des props, remet ses événements aux gestionnaires et transmet les commandes d'une `ref`.

Comme NSH s'affiche avec les vues propres au système, un composant natif n'est qu'une sous-vue de plus dans la même hiérarchie :
il n'y a aucun problème de superposition, il est rogné, défile et reçoit les touches comme une `<View>`.

> [!NOTE]
> Les composants natifs sont enregistrés par l'app qui embarque NSH ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)), ou, sur Windows, macOS, Linux et iOS, par le crate Rust propre à l'app,
> dont les composants sont enregistrés par l'hôte de développement et par l'app empaquetée (`nsh package`)
> ([Enregistrement depuis le crate de l'app](#registering-from-the-apps-crate)). Un nom que rien n'a enregistré produit une vue
> vide (le nom est journalisé une fois comme inconnu).

<a id="how-it-fits-together"></a>

## Vue d'ensemble

1. L'app hôte enregistre une fabrique sous un nom, par exemple `"embed.badge"`, sur son `NshAppView` (iOS) ou son `NshView`
   (Android). Chaque vue a son propre registre ; rien n'est global.
2. L'app NSH déclare un composant pour ce nom, avec les props et les événements qu'elle utilise.
3. Quand l'élément est créé, NSH crée une vue conteneur (décorée, cadrée et testée pour les touches comme n'importe quelle vue), puis
   demande un composant à la fabrique et place la vue du composant dans le conteneur, qu'elle remplit.
4. Le composant reçoit chaque prop juste après sa création, puis chaque prop de nouveau quand elle change.
5. Le composant émet des événements et peut signaler sa propre taille ; l'app appelle ses commandes via une `ref`.

<a id="using-the-component-in-the-app"></a>

## Utiliser le composant dans l'app

En Rust, `native(name)` crée l'élément : `.prop(name, value)` lui donne une prop (une `serde_json::Value`, ou un signal ou une
closure qui en renvoie une, renvoyée quand elle change), `.on_native_event(..)` écoute ses événements sous forme de `NativeEvent { name, data }`, et les méthodes d'un
`element_ref()` placé dessus avec `.element_ref(&r)` envoient ses commandes. En TSX, `nativeComponent()` déclare un composant
pour le nom, avec les props et les événements qu'il utilise.

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

La version TSX est `examples/embedded/App.tsx`, que les deux exemples d'intégration du dépôt exécutent.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Paramètre | Type | Description |
|---|---|---|
| `name` | `string` | Le nom enregistré par l'app hôte. Utilisez votre propre préfixe (`"maps.view"`, `"acme.chart"`) pour que les noms restent uniques. |
| `spec.props` | `readonly (keyof P & string)[]` | Les props propres au composant. Seules les props listées ici sont envoyées côté natif. |
| `spec.events` | `readonly (keyof E & string)[]` | Les événements qu'il émet. Facultatif. |

Les paramètres de type décrivent les props (`P`) et la charge utile de chaque événement (`E`). Le composant retourné accepte :

- les props propres au composant `P` ;
- un gestionnaire par événement : l'événement `tap` est géré par `onTap`, `regionChange` par `onRegionChange` (la première lettre est
  mise en majuscule et `on` est ajouté devant) ;
- tout ce qu'accepte un `<View>` sauf les enfants : `style`, `class` / `classList` ([Tailwind](./tailwind.md)), la mise en page,
  les props d'accessibilité, `testID`, `onLayout`, `ref`. Elles concernent le conteneur que dessine NSH, pas le composant.

Un composant natif est une feuille : il n'accepte pas d'enfants.

## Props

Chaque prop propre est envoyée en JSON, donc sa valeur peut être n'importe quelle valeur JSON : chaînes, nombres, booléens, `null`, tableaux et
objets simples. Les props sont réactives comme les autres : quand la closure d'une prop Rust (`.prop("text", move || json!(label.get()))`)
ou un `text={label()}` TSX lit un signal, la nouvelle valeur est envoyée quand le signal change, et seulement alors.

| Ce qui se passe dans l'app | Ce que reçoit le composant |
|---|---|
| L'élément est créé | Chaque prop propre définie, juste après la création du composant |
| La valeur d'une prop change | Cette prop avec sa nouvelle valeur |
| Une prop devient `undefined` | Cette prop sans valeur (`nil` en Swift, `null` en Java) |
| Une prop liée à une valeur animée bouge | `setAnimatedNumber` / `setAnimatedColor`, aux images où elle change |

Les props transportent des valeurs JSON ; limitez l'interface aux données (les fonctions et les instances de classe restent dans l'app).

<a id="animated-props"></a>

### Props animées

Une prop peut aussi être une valeur animée : un `AnimatedValue`, ou un nœud dérivé d'un tel objet (`interpolate`, le
`scrollValue` ou le `pullValue` d'une scroll view). Elle n'est alors pas envoyée en JSON : NSH la lie, et le composant reçoit la valeur sur le thread
d'interface à chaque image où elle change, sans passer par JS, ce qui lui permet de suivre un glissement ou un pull to refresh.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

Le composant reçoit les nombres avec `setAnimatedNumber(name, value)` et les couleurs avec `setAnimatedColor(name, argb)`
(`0xAARRGGBB`) ; par défaut, les deux appellent `setProp` avec le nombre, si bien qu'un composant qui ne les implémente pas
reçoit tout de même la valeur. Les composants Rust implémentent `set_animated_number` et `set_animated_color`, et le code Rust lie une prop
avec `native(name).bind_animated_prop("progress", &value)`. Donner de nouveau une valeur simple à la prop la délie et envoie
cette valeur. Le web n'a aucun composant enregistré.

<a id="events"></a>

## Événements

Le composant émet un événement par son nom, avec une charge utile JSON facultative. NSH le remet au thread du moteur et appelle le
gestionnaire correspondant avec la charge utile (en Rust, l'unique écouteur `on_native_event` avec le `name` et le `data` de l'événement) :

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

Les événements sont asynchrones : le thread principal n'attend jamais le code de l'app. Un composant qui doit décider quelque chose sur-le-champ (ce
geste peut-il commencer, cette région peut-elle changer) doit le décider côté natif, à partir des props reçues plus tôt.

<a id="commands"></a>

## Commandes

Les appels impératifs (zoomer sur un point, démarrer la lecture, faire pulser une animation) passent par la ref de l'élément (`element_ref()` en Rust, `ref` en TSX) :

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

`command(name, args)` (TSX : `command(name, args?)`) envoie le nom et les arguments (n'importe quelle valeur JSON) à la méthode `command` du composant. Les commandes
sont appliquées dans l'ordre, avec les changements effectués avant elles : une commande émise juste après un changement de prop voit donc la nouvelle prop.

<a id="sizing"></a>

## Dimensionnement

Le conteneur est disposé comme une `<View>` :

- Lorsque le style donne une dimension (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), cette dimension l'emporte.
- Lorsque le style laisse une dimension ouverte, le conteneur prend la taille que le composant a signalée avec `setSize`, comme une
  image prend sa taille naturelle. Un composant qui ne signale jamais de taille mesure 0 sur les dimensions ouvertes.

Signalez la taille en points (iOS) ou en dp (Android) chaque fois que le contenu change. Le badge ci-dessus mesure son libellé à chaque
changement de `text` et signale la taille du libellé plus le remplissage, si bien que `alignSelf: "flex-start"` rend le badge exactement aussi
large que son texte.

<a id="registering-on-ios-swift"></a>

## Enregistrement sur iOS (Swift)

Implémentez `NshComponent` et enregistrez une fabrique sur le `NshAppView` :

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

(`UIColor(hex:)` est un petit utilitaire de l'exemple, qui ne fait pas partie de NativeShell.)

| API | Description |
|---|---|
| `NshAppView.register(component:_:)` | Enregistre une fabrique `(NshComponentContext) -> NshComponent` sous un nom. Elle crée un composant par élément créé à partir de ce moment. Enregistrer de nouveau un nom remplace la fabrique. |
| `protocol NshComponent` | `var view: UIView` (remplit le conteneur), `setProp(_:_:)`, `command(_:_:)` (facultatif : par défaut, les commandes sont ignorées). Isolé sur le main actor. |
| `setProp(_ name: String, _ value: Any?)` | Les valeurs sont des objets JSON Foundation : `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull` ; `nil` quand la prop a été retirée. |
| `NshComponentContext.emit(_:_:)` | Émet un événement ; les données doivent être quelque chose que `JSONSerialization` accepte (ou `nil`). Thread-safe. |
| `NshComponentContext.setSize(_:)` | Signale la taille propre du composant en points. Thread-safe. |

<a id="registering-on-android-java--kotlin"></a>

## Enregistrement sur Android (Java / Kotlin)

Implémentez `com.longbridge.nsh.NshComponent` et enregistrez une fabrique sur le `NshView` :

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

La même chose en Kotlin :

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Description |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Enregistre une fabrique sous un nom ; elle crée un composant par élément créé à partir de ce moment (thread d'interface). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (l'élément a disparu : retiré, ou son app arrêtée par `NshView.destroy()` ou remplacée par un autre chargement ; appelée une fois par composant). Appelée sur le thread d'interface. |
| Valeurs de `setProp` | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map`, ou `null` quand elle est retirée (ou un `null` JSON). |
| `NshComponentContext.emit(String event, Object data)` | Émet un événement ; `data` avec les mêmes types Java, ou `null`. Depuis n'importe quel thread. |
| `NshComponentContext.setSize(float width, float height)` | Signale la taille propre du composant en dp. Depuis n'importe quel thread. |

<a id="registering-from-rust"></a>

## Enregistrement depuis Rust

Les apps qui embarquent le runtime iOS depuis Rust (`nsh-platform-ios`) enregistrent un `NativeComponent` sur un `AppView` :

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

`ComponentContext::emit(name, data)` envoie un événement (`data` est un `serde_json::Value`) et `set_size(width, height)`
signale la taille ; les deux fonctionnent depuis n'importe quel thread.

<a id="registering-on-macos-rust"></a>

## Enregistrement sur macOS (Rust)

Sur macOS, le composant est un `NSView`, enregistré sur le [`AppView`](./macos.md#embedding-in-a-mac-app) de
`nsh-platform-macos` :

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

La vue remplit le conteneur que NSH dispose ; `ComponentContext::emit` et `set_size` (points) fonctionnent depuis n'importe quel thread, comme
sur iOS. Enregistrez avant `AppView::load` ; un registre appartient à un `AppView` (et aux vues créées à partir du même
`AppOptions`).

<a id="registering-on-linux-rust"></a>

## Enregistrement sur Linux (Rust)

Sur Linux, le composant est un widget GTK, enregistré sur le [`AppView`](./linux.md#embedding-in-a-gtk-app) de
`nsh-platform-linux` :

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

Le widget remplit le conteneur que NSH dispose ; `ComponentContext::emit` et `set_size` (points) fonctionnent depuis n'importe quel thread,
comme sur iOS. Enregistrez avant `AppView::load`. Un registre appartient à un `AppView` (et aux vues créées à partir du même
`AppOptions`, dont c'est le champ `components`).

<a id="registering-on-windows-rust"></a>

## Enregistrement sur Windows (Rust)

Sur Windows, NSH dessine lui-même chaque vue avec Direct2D, donc un composant soit dessine dans son conteneur avec Direct2D
(`draw`), soit apporte sa propre fenêtre (`window` : un contrôle de carte, une vue tierce), enregistrée sur le
[`AppView`](./windows.md#embedding-in-a-win32-app) de `nsh-platform-windows` :

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

`draw` s'exécute à chaque image de la fenêtre, dans les coordonnées de la vue (points), rogné à ses limites ; appelez
`ComponentContext::redraw` quand ce qu'il affiche change. Un composant dessiné est recouvert, rogné et transformé comme n'importe quelle
vue, et c'est son conteneur qui reçoit les touches. Un composant qui retourne une fenêtre enfant depuis `window` est déplacé, rogné et
masqué avec sa vue, reçoit ses propres entrées et se place au-dessus de tout ce que dessine NSH (le contenu NSH qui le recouvre est masqué, comme
avec les web views). `ComponentContext::emit`, `set_size` (points) et `redraw` fonctionnent depuis n'importe quel thread. Enregistrez avant
`AppView::load` ; un registre appartient à un `AppView` (et aux vues créées à partir du même `AppOptions`).

Un composant reçoit aussi la molette de la souris et les défilements du pavé tactile au-dessus de lui avec `wheel` (un visualiseur d'images zoome avec eux). Le
`Wheel` qu'il reçoit contient le pointeur (`x`, `y`, en points du composant), la distance en points (`dx`, `dy`, positive
vers la droite et vers le bas, comme les scroll views déplacent leur contenu) et en crans de molette (`notches_x`, `notches_y`, avec
des fractions pour les pavés tactiles de précision et les molettes haute résolution), si le défilement est arrivé par petits pas (`precise`) et les
modificateurs maintenus (`shift`, `ctrl`, `alt`). Il retourne `true` pour un défilement qu'il a pris en charge ; les scroll views qui l'entourent défilent avec
le reste, et par défaut avec toutes. Un défilement qu'une scroll view a commencé reste sur cette vue. Ctrl + molette est aussi le pincement d'un
pavé tactile de précision, et Maj + molette arrive tel que la molette l'a envoyé (`dy`, avec `shift`) :

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

## Enregistrement depuis le crate de l'app

Une app dotée d'un crate Rust propre (`nsh.json` `"rust"`, [Rust](./rust.md)) enregistre ses composants natifs dans ce
crate, afin qu'ils fonctionnent dans les hôtes que NSH construit pour l'app : l'hôte de développement de `nsh run` et `nsh test --target`, et
l'app que produit `nsh package`. Une fonction avec `#[native_components(<platform>)]` à la racine du crate (`lib.rs`) les enregistre
sur le `Components` de cette plateforme, et l'hôte l'appelle pour chaque vue qu'il crée, comme une app embarquante enregistre sur
son `AppView` :

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

La plateforme est `windows`, `macos`, `linux` ou `ios`, et les composants sont ceux de
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` ou `nsh_platform_ios` (les sections ci-dessus). La
fonction ne compile que sur sa plateforme, donc un crate en a une par plateforme prise en charge, chacune enregistrant les mêmes noms,
et dépend du crate de chaque plateforme pour cette plateforme seulement, à la version et depuis la source de ses autres crates
NSH (`nsh-core` et les autres ; la CLI vérifie qu'ils concordent tous) :

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

L'hôte enregistre les composants du crate quand il crée chaque vue, avant le code qui détient la vue et enregistre les
siens : un nom enregistré ensuite sur la vue (`AppView::register_component`) remplace celui du crate.
<a id="rules-and-limits"></a>

## Règles et limites

- **Enregistrer avant de charger.** Les factories s'appliquent aux éléments créés après l'enregistrement. Enregistrez chaque nom avant
  `loadBundle` / `loadAssetBundle` / `run`, afin que la première frame les trouve.
- **Le conteneur gère la décoration et les touchers.** L'arrière-plan, les bordures, le rayon des coins, les ombres, l'opacité, les transformations et
  `overflow: "hidden"` s'appliquent au conteneur que NSH dessine. Votre vue le remplit et reçoit les touchers qui tombent à l'intérieur.
- **Les capabilities ne s'appliquent pas.** Un composant enregistré est du code propre à l'app hôte ; les
  [capabilities](./sandbox-and-capabilities.md) déclarées par une app ne restreignent pas ce qu'il fait. Si vous intégrez des apps auxquelles vous ne
  faites pas confiance, n'enregistrez que des composants dont l'usage est sûr pour elles.
- **Limitez l'interface aux données.** Les props, les payloads d'événements et les arguments de commandes traversent sous forme de texte JSON ; envoyez des identifiants et
  de petites valeurs, pas de gros blobs, à chaque changement.
- **Un seul bundle, les deux plateformes.** Enregistrez les mêmes noms avec les mêmes props et événements sur iOS et Android, afin qu'un seul
  bundle fonctionne sur les deux.
- **Les noms sous `nsh/` appartiennent à NSH.** Les composants propres à NSH (la barre d'onglets système de `nsh/mobile` de `TabBar`) sont
  enregistrés sous `nsh/` ; nommez les vôtres d'après votre app ou votre entreprise (`embed.badge`), et un enregistrement sous `nsh/` consigne
  un avertissement et conserve celui de NSH.

<a id="see-also"></a>

## Voir aussi

- [Référence de `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Intégration dans les apps iOS](./ios.md) et [dans les apps Android](./android.md)
- [Architecture](./architecture.md) : comment les props et les événements traversent les threads
