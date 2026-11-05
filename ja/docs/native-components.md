---
title: "ネイティブコンポーネント"
description: "ホストアプリのビュー(マップ、プレーヤー、任意の UIView や Android View)を、props、イベント、コマンド、サイズ指定とともに NSH アプリ内で使用します。"
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# ネイティブコンポーネント

ネイティブコンポーネントとは、**埋め込み先のアプリ**が名前で登録するビューです。地図、カメラプレビュー、チャートライブラリなどが該当し、iOS では `UIView`、Android では `android.view.View`、macOS では `NSView`、Linux では `gtk::Widget`、Windows では Direct2D による描画または子 `HWND` を使えます。NSH アプリでは他の要素と同じように使えます。Rust アプリは `nsh_core::prelude` の `native(name)` で作成し、TSX アプリは [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule) の `nativeComponent()` で宣言します。NSH はこのコンポーネントをアプリの他の部分と一緒にレイアウトし、props を送り、イベントをハンドラーに届け、`ref` からのコマンドを転送します。

NSH はシステム標準のビューで描画するため、ネイティブコンポーネントは同じ階層にあるもう 1 つのサブビューにすぎません。レイヤーの問題は起きず、`<View>` と同じようにクリップ、スクロール、タッチの受け取りができます。

> [!NOTE]
> ネイティブコンポーネントは、NSH を埋め込むアプリが登録します ([iOS](./ios.md)、[Android](./android.md)、[macOS](./macos.md#embedding-in-a-mac-app)、[Linux](./linux.md#embedding-in-a-gtk-app)、[Windows](./windows.md#embedding-in-a-win32-app))。Windows、macOS、Linux、iOS では、アプリ自身の Rust クレートが登録することもでき、そのコンポーネントは開発ホストとパッケージ済みアプリ (`nsh package`) が登録します ([アプリのクレートからの登録](#registering-from-the-apps-crate))。何も登録されていない名前は空のビューとして描画されます (その名前は未知のものとして 1 度だけログに出力されます)。

<a id="how-it-fits-together"></a>

## 全体の仕組み

1. ホストアプリは、`NshAppView` (iOS) または `NshView` (Android) に、`"embed.badge"` などの名前でファクトリーを登録します。ビューごとに独自のレジストリがあり、グローバルなものはありません。
2. NSH アプリは、その名前に対応するコンポーネントを、使用する props とイベントとともに宣言します。
3. 要素が作成されると、NSH はコンテナービュー (他のビューと同様に装飾、フレーム設定、ヒットテストが行われます) を作成し、ファクトリーにコンポーネントを要求して、そのコンポーネントのビューをコンテナーの中に、全体を埋めるように配置します。
4. コンポーネントは、作成された直後にすべての prop を受け取り、その後は prop が変わるたびに再度受け取ります。
5. コンポーネントはイベントを発行し、自身のサイズを報告することもできます。アプリは `ref` を通じてコマンドを呼び出します。

<a id="using-the-component-in-the-app"></a>

## アプリでコンポーネントを使う

Rust では、`native(name)` が要素を作成します。`.prop(name, value)` は prop を設定し (`serde_json::Value`、またはシグナルやそのクロージャーで、変更されると再送されます)、`.on_native_event(..)` はそのイベントを `NativeEvent { name, data }` として受け取り、`.element_ref(&r)` で要素に付けた `element_ref()` のメソッドがコマンドを送ります。TSX では、`nativeComponent()` が、使用する props とイベントを指定して、その名前のコンポーネントを宣言します。

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

TSX 版は `examples/embedded/App.tsx` で、リポジトリ内の 2 つの埋め込みサンプルがどちらもこれを実行します。

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| パラメータ | 型 | 説明 |
|---|---|---|
| `name` | `string` | ホストアプリが登録した名前です。名前が重複しないよう、独自のプレフィックス (`"maps.view"`、`"acme.chart"`) を付けてください。 |
| `spec.props` | `readonly (keyof P & string)[]` | コンポーネント独自の props です。ここに列挙された props だけがネイティブ側に送られます。 |
| `spec.events` | `readonly (keyof E & string)[]` | コンポーネントが発行するイベントです。省略可能です。 |

型パラメータは、props (`P`) と各イベントのペイロード (`E`) を表します。返されるコンポーネントは次のものを受け付けます。

- コンポーネント独自の props `P`
- イベントごとのハンドラー。イベント `tap` は `onTap`、`regionChange` は `onRegionChange` で処理されます (先頭を大文字にし、前に `on` を付けます)。
- children を除く `<View>` が受け取るすべてのもの: `style`、`class` / `classList` ([Tailwind](./tailwind.md))、レイアウト、アクセシビリティ props、`testID`、`onLayout`、`ref`。これらは、コンポーネント自体ではなく、NSH が描画するコンテナーに対するものです。

ネイティブコンポーネントはリーフであり、children を受け取りません。

## Props

各 prop は JSON として送られるため、値には任意の JSON 値 (文字列、数値、真偽値、`null`、配列、プレーンオブジェクト) を使えます。props は他のものと同様にリアクティブです。Rust の prop のクロージャー (`.prop("text", move || json!(label.get()))`) や TSX の `text={label()}` がシグナルを読み取る場合、シグナルが変化したときにのみ、新しい値が送られます。

| アプリで起きること | コンポーネントが受け取るもの |
|---|---|
| 要素が作成される | 設定されているすべての独自 prop。コンポーネントが作成された直後に届きます |
| prop の値が変わる | その prop と新しい値 |
| prop が `undefined` になる | 値のないその prop (Swift では `nil`、Java では `null`) |
| アニメーション値にバインドされた prop が動く | `setAnimatedNumber` / `setAnimatedColor`。値が変化するフレームごとに届きます |

props は JSON 値を運びます。インターフェイスはデータにとどめてください (関数やクラスのインスタンスはアプリ側に残ります)。

<a id="animated-props"></a>

### アニメーション props

prop はアニメーション値にすることもできます。`AnimatedValue`、またはそこから派生したノード (`interpolate`、スクロールビューの `scrollValue` や `pullValue`) です。この場合、値は JSON としては送られません。NSH がバインドし、値が変化するフレームごとに、JS を経由せず UI スレッド上でコンポーネントに値が渡されるため、ドラッグやプルトゥリフレッシュに追従できます。

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

コンポーネントは、数値を `setAnimatedNumber(name, value)` で、色を `setAnimatedColor(name, argb)` (`0xAARRGGBB`) で受け取ります。デフォルトでは、どちらも数値を引数に `setProp` を呼び出すため、これらを実装していないコンポーネントでも値を受け取れます。Rust のコンポーネントは `set_animated_number` と `set_animated_color` を実装し、Rust のコードは `native(name).bind_animated_prop("progress", &value)` で prop をバインドします。その prop に再び通常の値を与えるとバインドが解除され、その値が送られます。Web には登録されたコンポーネントはありません。

<a id="events"></a>

## イベント

コンポーネントは、名前と任意の JSON ペイロードを指定してイベントを発行します。NSH はそれをエンジンスレッドに届け、対応するハンドラーをペイロードとともに呼び出します (Rust では、イベントの `name` と `data` を持つ `on_native_event` リスナーです)。

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

イベントは非同期であり、メインスレッドがアプリのコードを待つことはありません。その場で判断が必要なコンポーネント (このジェスチャーを開始してよいか、この領域を変更してよいかなど) は、以前に受け取った props をもとに、ネイティブ側で判断する必要があります。

<a id="commands"></a>

## コマンド

命令的な呼び出し (ポイントへのズーム、再生の開始、アニメーションのパルスなど) は、要素の ref (Rust では `element_ref()`、TSX では `ref`) を通じて行います。

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

`command(name, args)` (TSX では `command(name, args?)`) は、名前と引数 (任意の JSON 値) をコンポーネントの `command` メソッドに送ります。コマンドは、それ以前に行われた変更とともに順番に適用されるため、prop の変更の直後に発行したコマンドは新しい prop を参照します。

<a id="sizing"></a>

## サイズ

コンテナーは `<View>` と同じようにレイアウトされます。

- スタイルで寸法が指定されている場合 (`width`、`height`、`flex: 1`、`alignSelf: "stretch"` など)、その寸法が優先されます。
- スタイルで寸法が指定されていない場合、コンテナーは、画像が本来のサイズを取るのと同じように、コンポーネントが `setSize` で報告したサイズを取ります。サイズを一度も報告しないコンポーネントは、未指定の寸法方向では 0 として計測されます。

コンテンツが変わるたびに、サイズをポイント (iOS) または dp (Android) で報告してください。上のバッジは、`text` が変わるたびにラベルを計測し、ラベルのサイズにパディングを加えたものを報告します。そのため、`alignSelf: "flex-start"` により、バッジはテキストとちょうど同じ幅になります。

<a id="registering-on-ios-swift"></a>

## iOS での登録 (Swift)

`NshComponent` を実装し、`NshAppView` にファクトリーを登録します。

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

(`UIColor(hex:)` はサンプルの小さなヘルパーであり、NativeShell の一部ではありません。)

| API | 説明 |
|---|---|
| `NshAppView.register(component:_:)` | ファクトリー `(NshComponentContext) -> NshComponent` を名前で登録します。それ以降に作成される要素ごとに、コンポーネントを 1 つ作成します。同じ名前を再度登録すると、ファクトリーが置き換えられます。 |
| `protocol NshComponent` | `var view: UIView` (コンテナーを埋めます)、`setProp(_:_:)`、`command(_:_:)` (省略可能。デフォルトではコマンドを無視します)。メインアクター上で実行されます。 |
| `setProp(_ name: String, _ value: Any?)` | 値は Foundation の JSON オブジェクト (`String`、`NSNumber`、`[Any]`、`[String: Any]`、`NSNull`) です。prop が削除された場合は `nil` です。 |
| `NshComponentContext.emit(_:_:)` | イベントを発行します。データは `JSONSerialization` が受け付けるもの (または `nil`) である必要があります。スレッドセーフです。 |
| `NshComponentContext.setSize(_:)` | コンポーネント自身のサイズをポイントで報告します。スレッドセーフです。 |

<a id="registering-on-android-java--kotlin"></a>

## Android での登録 (Java / Kotlin)

`com.longbridge.nsh.NshComponent` を実装し、`NshView` にファクトリーを登録します。

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

Kotlin では次のとおりです。

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | 説明 |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | ファクトリーを名前で登録します。それ以降に作成される要素ごとに、コンポーネントを 1 つ作成します (UI スレッド)。 |
| `interface NshComponent` | `View view()`、`void setProp(String, Object)`、`default void command(String, Object)`、`default void destroy()` (要素がなくなったことを示します。削除された場合、そのアプリが `NshView.destroy()` で停止された場合、または別の読み込みに置き換えられた場合で、コンポーネントごとに 1 度だけ呼ばれます)。UI スレッドで呼ばれます。 |
| `setProp` の値 | `String`、`Number`、`Boolean`、`java.util.List`、`java.util.Map`、または削除時の `null` (または JSON の `null`) です。 |
| `NshComponentContext.emit(String event, Object data)` | イベントを発行します。`data` は同じ Java 型、または `null` です。任意のスレッドから呼べます。 |
| `NshComponentContext.setSize(float width, float height)` | コンポーネント自身のサイズを dp で報告します。任意のスレッドから呼べます。 |

<a id="registering-from-rust"></a>

## Rust からの登録

Rust から iOS ランタイムを埋め込むアプリ (`nsh-platform-ios`) は、`AppView` に `NativeComponent` を登録します。

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

`ComponentContext::emit(name, data)` はイベントを送信し (`data` は `serde_json::Value` です)、`set_size(width, height)` はサイズを報告します。どちらも任意のスレッドから動作します。

<a id="registering-on-macos-rust"></a>

## macOS での登録 (Rust)

macOS では、コンポーネントは `NSView` であり、`nsh-platform-macos` の [`AppView`](./macos.md#embedding-in-a-mac-app) に登録します。

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

ビューは、NSH がレイアウトするコンテナーを埋めます。`ComponentContext::emit` と `set_size` (ポイント) は、iOS と同様に任意のスレッドから動作します。`AppView::load` の前に登録してください。レジストリは 1 つの `AppView` (および同じ `AppOptions` から作られるビュー) に属します。

<a id="registering-on-linux-rust"></a>

## Linux での登録 (Rust)

Linux では、コンポーネントは GTK ウィジェットであり、`nsh-platform-linux` の [`AppView`](./linux.md#embedding-in-a-gtk-app) に登録します。

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

ウィジェットは、NSH がレイアウトするコンテナーを埋めます。`ComponentContext::emit` と `set_size` (ポイント) は、iOS と同様に任意のスレッドから動作します。`AppView::load` の前に登録してください。レジストリは 1 つの `AppView` (および同じ `AppOptions` から作られるビュー。`components` はそのフィールドです) に属します。

<a id="registering-on-windows-rust"></a>

## Windows での登録 (Rust)

Windows では、NSH がすべてのビューを Direct2D で自前で描画します。そのため、コンポーネントは Direct2D でコンテナーに描画する (`draw`) か、独自のウィンドウ (`window`: 地図コントロールやサードパーティのビューなど) を持ち込みます。登録は `nsh-platform-windows` の [`AppView`](./windows.md#embedding-in-a-win32-app) に行います。

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

`draw` は、ウィンドウの各フレームごとに、ビューの座標系 (ポイント) で、ビューの境界でクリップされた状態で実行されます。表示内容が変わったら `ComponentContext::redraw` を呼び出してください。描画型のコンポーネントは、他のビューと同様に、覆われ、クリップされ、変形され、タッチはコンテナーが受け取ります。`window` から子ウィンドウを返すコンポーネントは、ビューと一緒に移動、クリップ、非表示になり、独自の入力を受け取り、NSH が描画するすべてのものの上に表示されます (その上にある NSH のコンテンツは、Web ビューの場合と同様に隠れます)。`ComponentContext::emit`、`set_size` (ポイント)、`redraw` は任意のスレッドから動作します。`AppView::load` の前に登録してください。レジストリは 1 つの `AppView` (および同じ `AppOptions` から作られるビュー) に属します。

コンポーネントは、`wheel` により、その上でのマウスホイールやタッチパッドのスクロールも受け取れます (画像ビューアーはこれでズームします)。受け取る `Wheel` には、ポインター位置 (`x`、`y`。コンポーネントのポイント)、ポイント単位の距離 (`dx`、`dy`。スクロールビューがコンテンツを動かすのと同様に、右と下が正)、ホイールのノッチ単位の距離 (`notches_x`、`notches_y`。高精度タッチパッドや高解像度ホイールでは端数を含みます)、細かいステップで届いたかどうか (`precise`)、押されている修飾キー (`shift`、`ctrl`、`alt`) が含まれます。受け取ったスクロールには `true` を返します。その周囲のスクロールビューは、残りのスクロールで動き、デフォルトではすべてのスクロールで動きます。スクロールビューが開始したスクロールは、そのビューに留まります。Ctrl + ホイールは高精度タッチパッドのピンチでもあり、Shift + ホイールはホイールが送ったとおりに届きます (`dy`、`shift` 付き)。

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

## アプリのクレートからの登録

独自の Rust クレート (`nsh.json` `"rust"`、[Rust](./rust.md)) を持つアプリは、そのクレート内でネイティブコンポーネントを登録します。これにより、NSH がアプリ用に構築するホスト、つまり `nsh run` と `nsh test --target` の開発ホスト、および `nsh package` が作成するアプリで動作します。クレートのルートにある `#[native_components(<platform>)]` 付きの関数 (`lib.rs`) が、そのプラットフォームの `Components` にコンポーネントを登録し、ホストは、埋め込みアプリが自身の `AppView` に登録するのと同様に、作成するビューごとにこの関数を呼び出します。

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

プラットフォームは `windows`、`macos`、`linux`、`ios` のいずれかで、コンポーネントは `nsh_platform_windows`、`nsh_platform_macos`、`nsh_platform_linux`、`nsh_platform_ios` のもの (上のセクションを参照) です。この関数は対応するプラットフォームでのみコンパイルされるため、クレートはサポートするプラットフォームごとに 1 つずつ関数を持ち、それぞれが同じ名前を登録します。また、各プラットフォームのクレートには、そのプラットフォーム向けにのみ、クレートの他の NSH クレート (`nsh-core` など。CLI がすべて一致していることを確認します) と同じバージョン、同じソースで依存します。

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

ホストは、各ビューを作成する際に、そのビューを保持するコードが自身のコンポーネントを登録するより前に、クレートのコンポーネントを登録します。そのため、その後にビューに登録された名前 (`AppView::register_component`) は、クレートのものを置き換えます。
<a id="rules-and-limits"></a>

## ルールと制限

- **読み込み前に登録する。** ファクトリは、登録後に作成された要素にのみ適用されます。最初のフレームで見つかるように、すべての名前を
  `loadBundle` / `loadAssetBundle` / `run` の前に登録してください。
- **コンテナが装飾とタッチを担う。** 背景、枠線、角丸、シャドウ、不透明度、トランスフォーム、
  `overflow: "hidden"` は、NSH が描画するコンテナに適用されます。ビューはそのコンテナを埋め、内側に届いたタッチを受け取ります。
- **Capabilities は適用されない。** 登録されたコンポーネントはホストアプリ自身のコードです。アプリが宣言する
  [capabilities](./sandbox-and-capabilities.md) は、そのコンポーネントの動作を制限しません。信頼できないアプリを埋め込む場合は、それらのアプリが安全に使えるコンポーネントのみを登録してください。
- **インターフェースはデータに限定する。** props、イベントのペイロード、コマンドの引数は JSON テキストとして受け渡されます。変更のたびに、大きなブロブではなく、識別子や小さな値を送ってください。
- **1 つのバンドルで両プラットフォームに対応する。** iOS と Android で、同じ名前を同じ props とイベントで登録すれば、1 つのバンドルが両方で動作します。
- **`nsh/` 配下の名前は NSH 用。** NSH 自身のコンポーネント(`nsh/mobile` の `TabBar` に用いられるシステムのタブバー)は `nsh/` の下に登録されています。自分のコンポーネントには、アプリや会社にちなんだ名前(`embed.badge`)を付けてください。`nsh/` 配下への登録は警告をログに出力し、NSH のものが維持されます。

<a id="see-also"></a>

## 関連項目

- [`nativeComponent` リファレンス](../modules/nsh.md#nativecomponent-and-nativemodule)
- [iOS アプリへの組み込み](./ios.md)と [Android アプリへの組み込み](./android.md)
- [アーキテクチャ](./architecture.md): props とイベントがスレッド間をどのように渡るか
