---
title: "原生元件"
description: "在 NSH 應用程式中使用宿主應用程式的 View(地圖、播放器、任何 UIView 或 Android View),並支援 props、事件、命令與尺寸設定。"
order: 18
group: platforms
---

# 原生元件

原生元件是**嵌入應用程式**以名稱註冊的檢視：地圖、相機預覽、圖表程式庫，或是 iOS 上的任何 `UIView`、Android 上的 `android.view.View`、macOS 上的 `NSView`、Linux 上的 `gtk::Widget`，以及 Windows 上的 Direct2D 繪圖或子 `HWND`。NSH 應用程式使用它的方式與其他元素相同：Rust 應用程式以 `nsh_core::prelude` 中的 `native(name)` 建立它，TSX 應用程式則以 [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule) 中的 `nativeComponent()` 宣告它。NSH 會將它與應用程式的其餘部分一起進行版面配置、傳送 props、把它的事件交給處理常式，並轉發來自 `ref` 的命令。

由於 NSH 使用系統自己的檢視進行渲染，原生元件只是同一個階層中的另一個子檢視：不存在分層問題，它的裁切、捲動與接收觸控的行為都和 `<View>` 一樣。

> [!NOTE]
> 原生元件由嵌入 NSH 的應用程式註冊（[iOS](./ios.md)、[Android](./android.md)、[macOS](./macos.md#embedding-in-a-mac-app)、[Linux](./linux.md#embedding-in-a-gtk-app)、[Windows](./windows.md#embedding-in-a-win32-app)）；在 Windows、macOS、Linux 與 iOS 上，也可以由應用程式自己的 Rust crate 註冊，開發主機與封裝後的應用程式（`nsh package`）會註冊該 crate 的元件（[從應用程式的 crate 註冊](#registering-from-the-apps-crate)）。沒有任何東西註冊的名稱會渲染為空檢視（該名稱會以未知名稱記錄一次）。

<a id="how-it-fits-together"></a>

## 運作方式

1. 主應用程式在其 `NshAppView`（iOS）或 `NshView`（Android）上，以名稱（例如 `"embed.badge"`）註冊一個 factory。每個檢視都有自己的註冊表，沒有任何全域的東西。
2. NSH 應用程式為該名稱宣告一個元件，並指定它使用的 props 與事件。
3. 建立元素時，NSH 會建立一個容器檢視（與任何檢視一樣可裝飾、設定框架與進行點擊測試），接著向 factory 要求一個元件，並將元件的檢視放入容器中，填滿容器。
4. 元件在建立後會立即收到每一個 prop，之後每當 prop 變更時，會再次收到該 prop。
5. 元件會發出事件，也可以回報自己的尺寸；應用程式則透過 `ref` 呼叫它的命令。

<a id="using-the-component-in-the-app"></a>

## 在應用程式中使用元件

在 Rust 中，`native(name)` 建立元素：`.prop(name, value)` 為它設定一個 prop（`serde_json::Value`，或其 signal，或回傳該值的閉包，變更時會重新傳送），`.on_native_event(..)` 以 `NativeEvent { name, data }` 接收它的事件，而透過 `.element_ref(&r)` 放到元素上的 `element_ref()` 方法則會傳送它的命令。在 TSX 中，`nativeComponent()` 為該名稱宣告一個元件，並指定它使用的 props 與事件。

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

TSX 版本是 `examples/embedded/App.tsx`，儲存庫中的兩個嵌入範例都會執行它。

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| 參數 | 型別 | 說明 |
|---|---|---|
| `name` | `string` | 主應用程式註冊的名稱。請使用自己的前綴（`"maps.view"`、`"acme.chart"`），讓名稱保持唯一。 |
| `spec.props` | `readonly (keyof P & string)[]` | 元件自己的 props。只有這裡列出的 props 會傳送到原生端。 |
| `spec.events` | `readonly (keyof E & string)[]` | 它發出的事件。選用。 |

型別參數描述 props（`P`）以及每個事件的 payload（`E`）。回傳的元件接受：

- 元件自己的 props `P`；
- 每個事件對應一個處理常式：事件 `tap` 由 `onTap` 處理，`regionChange` 由 `onRegionChange` 處理（首字母大寫並在前面加上 `on`）；
- `<View>` 接受的所有內容（children 除外）：`style`、`class` / `classList`（[Tailwind](./tailwind.md)）、版面配置、無障礙 props、`testID`、`onLayout`、`ref`。這些屬於 NSH 繪製的容器，而不屬於元件。

原生元件是葉節點：不接受 children。

## Props

每個自有 prop 都以 JSON 傳送，因此它的值可以是任何 JSON 值：字串、數字、布林值、`null`、陣列與一般物件。Props 與其他 props 一樣是響應式的：當 Rust prop 的閉包（`.prop("text", move || json!(label.get()))`）或 TSX 的 `text={label()}` 讀取某個 signal 時，新值會在 signal 變更時傳送，而且只在那時傳送。

| 應用程式中發生的事 | 元件收到的內容 |
|---|---|
| 元素被建立 | 在元件建立後立即收到每一個已設定的自有 prop |
| Prop 的值變更 | 該 prop 與其新值 |
| Prop 變為 `undefined` | 該 prop 且沒有值（Swift 中為 `nil`，Java 中為 `null`） |
| 綁定到動畫值的 prop 移動 | `setAnimatedNumber` / `setAnimatedColor`，在它變更的每個影格收到 |

Props 攜帶的是 JSON 值；請讓介面只包含資料（函式與類別實例留在應用程式中）。

<a id="animated-props"></a>

### 動畫 props

Prop 也可以是動畫值：`AnimatedValue`，或由它衍生的節點（`interpolate`、捲動檢視的 `scrollValue` 或 `pullValue`）。此時它不會以 JSON 傳送：NSH 會綁定它，元件會在它變更的每個影格於 UI 執行緒上取得該值，而不經過 JS，因此它可以跟隨拖曳或下拉重新整理。

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

元件以 `setAnimatedNumber(name, value)` 接收數字，以 `setAnimatedColor(name, argb)`（`0xAARRGGBB`）接收顏色；預設情況下兩者都會以該數字呼叫 `setProp`，因此沒有實作它們的元件仍然能取得該值。Rust 元件實作 `set_animated_number` 與 `set_animated_color`，而 Rust 程式碼以 `native(name).bind_animated_prop("progress", &value)` 綁定 prop。再次給予 prop 一般值會解除綁定並傳送該值。Web 沒有已註冊的元件。

<a id="events"></a>

## 事件

元件以名稱發出事件，並可附帶選用的 JSON payload。NSH 會將它傳遞到引擎執行緒，並以該 payload 呼叫對應的處理常式（在 Rust 中，是帶有該事件的 `name` 與 `data` 的那個 `on_native_event` 監聽器）：

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

事件是非同步的：主執行緒絕不會等待應用程式的程式碼。必須當場做出決定的元件（這個手勢是否可以開始、這個區域是否可以變更）必須在原生端根據先前收到的 props 自行決定。

<a id="commands"></a>

## 命令

命令式呼叫（縮放到某個點、開始播放、觸發動畫）透過元素的 ref（Rust 中為 `element_ref()`，TSX 中為 `ref`）進行：

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

`command(name, args)`（TSX：`command(name, args?)`）會將名稱與引數（任何 JSON 值）傳送到元件的 `command` 方法。命令會與在它之前所做的變更依序套用，因此緊接在 prop 變更之後發出的命令會看到新的 prop。

<a id="sizing"></a>

## 尺寸

容器的版面配置方式與 `<View>` 相同：

- 當樣式指定了某個維度（`width`、`height`、`flex: 1`、`alignSelf: "stretch"` 等）時，以該維度為準。
- 當樣式未指定某個維度時，容器會採用元件以 `setSize` 回報的尺寸，就像圖片採用其原始尺寸一樣。從未回報尺寸的元件，在未指定的維度上測得的尺寸為 0。

每當內容變更時，請以點（iOS）或 dp（Android）回報尺寸。上方的徽章每次 `text` 變更時都會測量其標籤，並回報標籤尺寸加上內距，因此 `alignSelf: "flex-start"` 會讓徽章的寬度恰好等於其文字寬度。

<a id="registering-on-ios-swift"></a>

## 在 iOS 上註冊（Swift）

實作 `NshComponent`，並在 `NshAppView` 上註冊 factory：

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

（`UIColor(hex:)` 是範例中的小型輔助函式，不屬於 NativeShell。）

| API | 說明 |
|---|---|
| `NshAppView.register(component:_:)` | 以名稱註冊 factory `(NshComponentContext) -> NshComponent`。從此之後，每建立一個元素就會建立一個元件。再次註冊同一個名稱會取代該 factory。 |
| `protocol NshComponent` | `var view: UIView`（填滿容器）、`setProp(_:_:)`、`command(_:_:)`（選用：預設會忽略命令）。受 main actor 隔離。 |
| `setProp(_ name: String, _ value: Any?)` | 值為 Foundation JSON 物件：`String`、`NSNumber`、`[Any]`、`[String: Any]`、`NSNull`；當 prop 被移除時為 `nil`。 |
| `NshComponentContext.emit(_:_:)` | 發出事件；資料必須是 `JSONSerialization` 接受的內容（或 `nil`）。執行緒安全。 |
| `NshComponentContext.setSize(_:)` | 以點回報元件自己的尺寸。執行緒安全。 |

<a id="registering-on-android-java--kotlin"></a>

## 在 Android 上註冊（Java / Kotlin）

實作 `com.longbridge.nsh.NshComponent`，並在 `NshView` 上註冊 factory：

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

Kotlin 版本相同：

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | 說明 |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | 以名稱註冊 factory；從此之後，每建立一個元素就會建立一個元件（UI 執行緒）。 |
| `interface NshComponent` | `View view()`、`void setProp(String, Object)`、`default void command(String, Object)`、`default void destroy()`（元素已不存在：被移除、其應用程式被 `NshView.destroy()` 停止，或被另一次載入取代；每個元件只呼叫一次）。在 UI 執行緒上呼叫。 |
| `setProp` 值 | `String`、`Number`、`Boolean`、`java.util.List`、`java.util.Map`，或在被移除時為 `null`（或 JSON `null`）。 |
| `NshComponentContext.emit(String event, Object data)` | 發出事件；`data` 使用相同的 Java 型別，或 `null`。任何執行緒皆可。 |
| `NshComponentContext.setSize(float width, float height)` | 以 dp 回報元件自己的尺寸。任何執行緒皆可。 |

<a id="registering-from-rust"></a>

## 從 Rust 註冊

從 Rust 嵌入 iOS 執行階段的應用程式（`nsh-platform-ios`）會在 `AppView` 上註冊 `NativeComponent`：

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

`ComponentContext::emit(name, data)` 傳送事件（`data` 是 `serde_json::Value`），`set_size(width, height)` 回報尺寸；兩者都可以從任何執行緒運作。

<a id="registering-on-macos-rust"></a>

## 在 macOS 上註冊（Rust）

在 macOS 上，元件是 `NSView`，註冊在 `nsh-platform-macos` 的 [`AppView`](./macos.md#embedding-in-a-mac-app) 上：

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

檢視會填滿 NSH 配置出的容器；`ComponentContext::emit` 與 `set_size`（點）可以從任何執行緒運作，與 iOS 相同。請在 `AppView::load` 之前註冊；一個註冊表屬於一個 `AppView`（以及由同一個 `AppOptions` 建立的檢視）。

<a id="registering-on-linux-rust"></a>

## 在 Linux 上註冊（Rust）

在 Linux 上，元件是 GTK widget，註冊在 `nsh-platform-linux` 的 [`AppView`](./linux.md#embedding-in-a-gtk-app) 上：

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

Widget 會填滿 NSH 配置出的容器；`ComponentContext::emit` 與 `set_size`（點）可以從任何執行緒運作，與 iOS 相同。請在 `AppView::load` 之前註冊。一個註冊表屬於一個 `AppView`（以及由同一個 `AppOptions` 建立的檢視，其 `components` 欄位即為該註冊表）。

<a id="registering-on-windows-rust"></a>

## 在 Windows 上註冊（Rust）

在 Windows 上，NSH 以 Direct2D 自行繪製每個檢視，因此元件可以用 Direct2D 繪製到其容器中（`draw`），或自備一個視窗（`window`：地圖控制項、第三方檢視），註冊在 `nsh-platform-windows` 的 [`AppView`](./windows.md#embedding-in-a-win32-app) 上：

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

`draw` 會在視窗的每個影格執行，使用檢視的座標（點），並裁切到其邊界；當它顯示的內容變更時，請呼叫 `ComponentContext::redraw`。繪製式元件與任何檢視一樣會被覆蓋、裁切與變形，並由其容器接收觸控。從 `window` 回傳子視窗的元件會隨其檢視移動、裁切與隱藏，接收自己的輸入，並位於 NSH 繪製的所有內容之上（覆蓋在它上方的 NSH 內容會被隱藏，與 web view 相同）。`ComponentContext::emit`、`set_size`（點）與 `redraw` 可以從任何執行緒運作。請在 `AppView::load` 之前註冊；一個註冊表屬於一個 `AppView`（以及由同一個 `AppOptions` 建立的檢視）。

元件也可以透過 `wheel` 接收其上方的滑鼠滾輪與觸控板捲動（圖片檢視器用它們來縮放）。它收到的 `Wheel` 包含指標位置（`x`、`y`，以元件的點為單位）、以點為單位的距離（`dx`、`dy`，向右與向下為正，與捲動檢視移動其內容的方式相同）、以滾輪刻度為單位的距離（`notches_x`、`notches_y`，精密觸控板與高解析度滾輪會帶有小數）、是否以細微步進送達（`precise`），以及按下的修飾鍵（`shift`、`ctrl`、`alt`）。對於它處理的捲動，它回傳 `true`；其周圍的捲動檢視會與其餘部分一起捲動，預設是全部都會捲動。捲動檢視已開始的捲動會停留在該檢視上。Ctrl + 滾輪也是精密觸控板的捏合手勢，而 Shift + 滾輪則依滾輪送出的方式送達（`dy`，搭配 `shift`）：

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

## 從應用程式的 crate 註冊

擁有自己 Rust crate 的應用程式（`nsh.json` `"rust"`，[Rust](./rust.md)）可以在該 crate 中註冊原生元件，讓它們在 NSH 為該應用程式建置的主機中運作：`nsh run` 與 `nsh test --target` 的開發主機，以及 `nsh package` 產生的應用程式。位於 crate 根目錄、帶有 `#[native_components(<platform>)]` 的函式（`lib.rs`）會將它們註冊到該平台的 `Components` 上，主機在建立每個檢視時都會呼叫它，就像嵌入應用程式在其 `AppView` 上註冊一樣：

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

平台是 `windows`、`macos`、`linux` 或 `ios`，元件則是 `nsh_platform_windows`、`nsh_platform_macos`、`nsh_platform_linux` 或 `nsh_platform_ios` 的元件（見上述各節）。該函式只會在其平台上編譯，因此 crate 為其支援的每個平台各有一個函式，且各自註冊相同的名稱，並僅針對該平台依賴對應平台的 crate，其版本與來源須與其他 NSH crate（`nsh-core` 及其餘）相同（CLI 會檢查它們是否全部一致）：

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

主機會在建立每個檢視時註冊該 crate 的元件，早於持有該檢視的程式碼註冊自己的元件：之後在檢視上註冊的名稱（`AppView::register_component`）會取代該 crate 註冊的同名元件。
<a id="rules-and-limits"></a>

## 規則與限制

- **載入前先註冊。** Factory 只會套用於註冊之後建立的元素。請在 `loadBundle` / `loadAssetBundle` / `run` 之前註冊所有名稱,這樣第一個畫面才能找到它們。
- **容器負責裝飾與觸控。** 背景、邊框、圓角半徑、陰影、不透明度、transform 與 `overflow: "hidden"` 都會套用在 NSH 繪製的容器上。你的 view 會填滿該容器,並接收落在容器內的觸控。
- **Capabilities 不適用。** 已註冊的元件是宿主 app 自己的程式碼;app 所宣告的 [capabilities](./sandbox-and-capabilities.md) 並不會限制它的行為。如果你嵌入了不受信任的 app,請只註冊對它們而言安全可用的元件。
- **介面只傳遞資料。** Props、事件 payload 與命令引數都以 JSON 文字的形式傳遞;每次變更時請傳送識別碼與小型數值,而不是大型 blob。
- **一份 bundle,兩個平台。** 在 iOS 與 Android 上以相同的 props 與事件註冊相同的名稱,這樣一份 bundle 就能在兩個平台上執行。
- **`nsh/` 底下的名稱屬於 NSH。** NSH 自己的元件(`nsh/mobile` 的 `TabBar` 的系統 tab bar)是以 `nsh/` 註冊的;請以你的 app 或公司來命名你的元件(`embed.badge`),若在 `nsh/` 之下註冊,會記錄一則警告,並保留 NSH 的版本。

<a id="see-also"></a>

## 另請參閱

- [`nativeComponent` 參考文件](../modules/nsh.md#nativecomponent-and-nativemodule)
- [嵌入 iOS app](./ios.md) 與[嵌入 Android app](./android.md)
- [Architecture](./architecture.md):props 與事件如何跨執行緒傳遞
