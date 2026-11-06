---
title: "المكونات الأصلية (Native Components)"
description: "استخدم عروض التطبيق المضيف (الخرائط، المشغلات، أي UIView أو Android View) داخل تطبيق NSH، مع الخصائص (props) والأحداث والأوامر وضبط الأحجام."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# المكوّنات الأصلية

المكوّن الأصلي هو عرض (view) يسجّله **التطبيق المضيف** باسم معيّن: خريطة، أو معاينة كاميرا، أو مكتبة رسوم بيانية، أو أي `UIView` على iOS، أو `android.view.View` على Android، أو `NSView` على macOS، أو `gtk::Widget` على Linux، أو رسم Direct2D أو `HWND` فرعي على Windows. يستخدمه تطبيق NSH مثل أي عنصر آخر: يُنشئه تطبيق Rust باستخدام `native(name)` من `nsh_core::prelude`، ويُصرّح به تطبيق TSX باستخدام `nativeComponent()` من [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). يتولى NSH ترتيبه مع بقية التطبيق، ويرسل إليه الخصائص (props)، ويسلّم أحداثه إلى المعالجات، ويمرّر إليه الأوامر من `ref`.

ولأن NSH يرسم باستخدام عروض النظام نفسه، فإن المكوّن الأصلي ليس سوى عرض فرعي آخر في التسلسل الهرمي نفسه: لا توجد مشكلة في الطبقات، فهو يُقصّ ويتمرّر ويستقبل اللمسات مثل `<View>`.

> [!NOTE]
> تُسجَّل المكوّنات الأصلية بواسطة التطبيق الذي يضمّن NSH ([iOS](./ios.md)، [Android](./android.md)،
> [macOS](./macos.md#embedding-in-a-mac-app)، [Linux](./linux.md#embedding-in-a-gtk-app)،
> [Windows](./windows.md#embedding-in-a-win32-app))، أو على Windows وmacOS وLinux وiOS بواسطة حزمة Rust الخاصة بالتطبيق،
> التي يسجّل مكوّناتها كل من مضيف التطوير والتطبيق المُحزَّم (`nsh package`)
> ([التسجيل من حزمة التطبيق](#registering-from-the-apps-crate)). أما الاسم الذي لم يسجّله أي شيء فيُعرض كعرض
> فارغ (ويُسجَّل الاسم في السجل مرة واحدة على أنه غير معروف).

<a id="how-it-fits-together"></a>

## كيف تتكامل الأجزاء

1. يسجّل التطبيق المضيف مصنعًا (factory) تحت اسم معيّن، مثل `"embed.badge"`، على `NshAppView` (iOS) أو `NshView`
   (Android). لكل عرض سجلّه الخاص؛ ولا يوجد شيء عام.
2. يصرّح تطبيق NSH بمكوّن لذلك الاسم مع الخصائص والأحداث التي يستخدمها.
3. عند إنشاء العنصر، ينشئ NSH عرضًا حاويًا (يُزخرف ويُؤطَّر ويخضع لاختبار اللمس مثل أي عرض)، ثم
   يطلب من المصنع مكوّنًا ويضع عرض المكوّن داخل الحاوية بحيث يملؤها.
4. يتلقى المكوّن كل خاصية فور إنشائه، ثم يتلقى كل خاصية مرة أخرى عندما تتغير.
5. يُصدر المكوّن الأحداث وقد يُبلغ عن حجمه الخاص؛ ويستدعي التطبيق أوامره عبر `ref`.

<a id="using-the-component-in-the-app"></a>

## استخدام المكوّن في التطبيق

في Rust، ينشئ `native(name)` العنصر: يمنحه `.prop(name, value)` خاصية (`serde_json::Value`، أو إشارة (signal) أو دالة
تُرجع واحدة منها، وتُرسل مرة أخرى عند تغيرها)، ويستمع `.on_native_event(..)` إلى أحداثه على هيئة `NativeEvent { name, data }`، وتُرسل
دوال `element_ref()` المضافة إليه عبر `.element_ref(&r)` أوامره. في TSX، يصرّح `nativeComponent()` بمكوّن
للاسم مع الخصائص والأحداث التي يستخدمها.

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

نسخة TSX هي `examples/embedded/App.tsx`، وهي التي يشغّلها نموذجا التضمين في المستودع.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| المعامل | النوع | الوصف |
|---|---|---|
| `name` | `string` | الاسم الذي سجّله التطبيق المضيف. استخدم بادئة خاصة بك (`"maps.view"`، `"acme.chart"`) لتبقى الأسماء فريدة. |
| `spec.props` | `readonly (keyof P & string)[]` | الخصائص الخاصة بالمكوّن. لا تُرسل إلى الجانب الأصلي إلا الخصائص المدرجة هنا. |
| `spec.events` | `readonly (keyof E & string)[]` | الأحداث التي يُصدرها. اختياري. |

تصف معاملات الأنواع الخصائص (`P`) وحمولة كل حدث (`E`). يقبل المكوّن المُرجَع ما يلي:

- الخصائص الخاصة بالمكوّن `P`؛
- معالجًا لكل حدث: يعالج `onTap` الحدث `tap`، ويعالج `onRegionChange` الحدث `regionChange` (يُكتب الحرف الأول
  كبيرًا وتُضاف `on` في البداية)؛
- كل ما يقبله `<View>` باستثناء العناصر الفرعية: `style`، و`class` / `classList` ([Tailwind](./tailwind.md))، والتخطيط،
  وخصائص إمكانية الوصول، و`testID`، و`onLayout`، و`ref`. وهذه تخص الحاوية التي يرسمها NSH، لا المكوّن.

المكوّن الأصلي عنصر طرفي (leaf): لا يقبل عناصر فرعية.

<a id="props"></a>

## الخصائص

تُرسل كل خاصية خاصة بالمكوّن بصيغة JSON، لذا يمكن أن تكون قيمتها أي قيمة JSON: سلاسل نصية، وأرقامًا، وقيمًا منطقية، و`null`، ومصفوفات،
وكائنات بسيطة. والخصائص تفاعلية مثل غيرها: عندما تقرأ دالة خاصية في Rust (`.prop("text", move || json!(label.get()))`)
أو `text={label()}` في TSX إشارة، تُرسل القيمة الجديدة عند تغير الإشارة، وفي ذلك الحين فقط.

| ما يحدث في التطبيق | ما يتلقاه المكوّن |
|---|---|
| إنشاء العنصر | كل خاصية خاصة به مضبوطة، فور إنشاء المكوّن |
| تغير قيمة خاصية | تلك الخاصية بقيمتها الجديدة |
| تصبح الخاصية `undefined` | تلك الخاصية دون قيمة (`nil` في Swift، `null` في Java) |
| تتحرك خاصية مرتبطة بقيمة متحركة | `setAnimatedNumber` / `setAnimatedColor`، في الإطارات التي تتغير فيها |

تحمل الخصائص قيم JSON؛ فاجعل الواجهة مقتصرة على البيانات (تبقى الدوال ونُسخ الأصناف في التطبيق).

<a id="animated-props"></a>

### الخصائص المتحركة

يمكن أن تكون الخاصية أيضًا قيمة متحركة: `AnimatedValue`، أو عقدة مشتقة منها (`interpolate`، أو `scrollValue` أو `pullValue`
الخاصة بعرض التمرير). ولا تُرسل حينئذ بصيغة JSON: يربطها NSH، ويُسلَّم المكوّن القيمة على خيط
واجهة المستخدم في كل إطار تتغير فيه، دون المرور عبر JS، فيستطيع تتبّع سحب أو سحبًا للتحديث.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

يتلقى المكوّن الأرقام عبر `setAnimatedNumber(name, value)` والألوان عبر `setAnimatedColor(name, argb)`
(`0xAARRGGBB`)؛ وبشكل افتراضي يستدعي كلاهما `setProp` مع الرقم، لذا فإن المكوّن الذي لا يطبّقهما
يظل يحصل على القيمة. تطبّق مكوّنات Rust `set_animated_number` و`set_animated_color`، ويربط كود Rust الخاصية
باستخدام `native(name).bind_animated_prop("progress", &value)`. وإعادة منح الخاصية قيمة عادية تفك الربط وترسل تلك
القيمة. ولا توجد مكوّنات مسجّلة على الويب.

<a id="events"></a>

## الأحداث

يُصدر المكوّن حدثًا باسمه مع حمولة JSON اختيارية. يسلّمه NSH إلى خيط المحرك ويستدعي
المعالج المطابق مع الحمولة (في Rust، المستمع الوحيد `on_native_event` مع `name` و`data` الخاصين بالحدث):

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

الأحداث غير متزامنة: فالخيط الرئيسي لا ينتظر كود التطبيق أبدًا. ويجب على المكوّن الذي يحتاج إلى اتخاذ قرار فوري (هل
يجوز أن تبدأ هذه الإيماءة، وهل يجوز أن تتغير هذه المنطقة) أن يقرره أصليًا، اعتمادًا على خصائص تلقاها سابقًا.

<a id="commands"></a>

## الأوامر

تمر الاستدعاءات الأمرية (التكبير إلى نقطة، وبدء التشغيل، ونبض الرسوم المتحركة) عبر المرجع (ref) الخاص بالعنصر (`element_ref()` في Rust، `ref` في TSX):

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

يرسل `command(name, args)` (في TSX: `command(name, args?)`) الاسم والوسائط (أي قيمة JSON) إلى دالة `command` في المكوّن. تُطبَّق الأوامر
بالترتيب مع التغييرات التي سبقتها، لذا فإن الأمر الصادر مباشرة بعد تغيير خاصية يرى الخاصية الجديدة.

<a id="sizing"></a>

## تحديد الحجم

تُرتَّب الحاوية مثل `<View>`:

- حيثما يحدد النمط بُعدًا (`width`، `height`، `flex: 1`، `alignSelf: "stretch"`، ...)، يكون لذلك البعد الأولوية.
- حيثما يترك النمط بُعدًا مفتوحًا، تأخذ الحاوية الحجم الذي أبلغ عنه المكوّن عبر `setSize`، مثلما
  تأخذ الصورة حجمها الطبيعي. والمكوّن الذي لا يبلغ عن حجم أبدًا يُقاس بصفر على الأبعاد المفتوحة.

أبلغ عن الحجم بالنقاط (points) في iOS أو dp في Android كلما تغير المحتوى. تقيس الشارة أعلاه تسميتها
في كل مرة يتغير فيها `text` وتبلغ عن حجم التسمية مضافًا إليه الحشو، لذا يجعل `alignSelf: "flex-start"` الشارة بعرض
نصها تمامًا.

<a id="registering-on-ios-swift"></a>

## التسجيل على iOS (Swift)

طبّق `NshComponent` وسجّل مصنعًا على `NshAppView`:

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

(`UIColor(hex:)` دالة مساعدة صغيرة في النموذج، وليست جزءًا من NativeShell.)

| API | الوصف |
|---|---|
| `NshAppView.register(component:_:)` | يسجّل مصنعًا `(NshComponentContext) -> NshComponent` تحت اسم معيّن. وينشئ مكوّنًا واحدًا لكل عنصر يُنشأ بعد ذلك. تسجيل اسم مرة أخرى يستبدل المصنع. |
| `protocol NshComponent` | `var view: UIView` (يملأ الحاوية)، `setProp(_:_:)`، `command(_:_:)` (اختياري: الافتراضي يتجاهل الأوامر). معزول على الخيط الرئيسي (main actor). |
| `setProp(_ name: String, _ value: Any?)` | القيم كائنات JSON من Foundation: `String`، `NSNumber`، `[Any]`، `[String: Any]`، `NSNull`؛ و`nil` عند إزالة الخاصية. |
| `NshComponentContext.emit(_:_:)` | يُصدر حدثًا؛ ويجب أن تكون البيانات شيئًا يقبله `JSONSerialization` (أو `nil`). آمن للاستخدام عبر الخيوط. |
| `NshComponentContext.setSize(_:)` | يُبلغ عن حجم المكوّن الخاص بالنقاط. آمن للاستخدام عبر الخيوط. |

<a id="registering-on-android-java--kotlin"></a>

## التسجيل على Android (Java / Kotlin)

طبّق `com.longbridge.nsh.NshComponent` وسجّل مصنعًا على `NshView`:

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

والكود نفسه في Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | الوصف |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | يسجّل مصنعًا تحت اسم معيّن؛ وينشئ مكوّنًا واحدًا لكل عنصر يُنشأ بعد ذلك (على خيط واجهة المستخدم). |
| `interface NshComponent` | `View view()`، `void setProp(String, Object)`، `default void command(String, Object)`، `default void destroy()` (العنصر زال: أُزيل، أو أوقفه `NshView.destroy()` تطبيقه، أو استُبدل بتحميل آخر؛ يُستدعى مرة واحدة لكل مكوّن). يُستدعى على خيط واجهة المستخدم. |
| قيم `setProp` | `String`، `Number`، `Boolean`، `java.util.List`، `java.util.Map`، أو `null` عند الإزالة (أو JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | يُصدر حدثًا؛ و`data` بأنواع Java نفسها، أو `null`. من أي خيط. |
| `NshComponentContext.setSize(float width, float height)` | يُبلغ عن حجم المكوّن الخاص بوحدة dp. من أي خيط. |

<a id="registering-from-rust"></a>

## التسجيل من Rust

التطبيقات التي تضمّن بيئة تشغيل iOS من Rust (`nsh-platform-ios`) تسجّل `NativeComponent` على `AppView`:

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

يرسل `ComponentContext::emit(name, data)` حدثًا (`data` هو `serde_json::Value`) ويُبلغ `set_size(width, height)`
عن الحجم؛ وكلاهما يعمل من أي خيط.

<a id="registering-on-macos-rust"></a>

## التسجيل على macOS (Rust)

على macOS يكون المكوّن `NSView`، ويُسجَّل على [`AppView`](./macos.md#embedding-in-a-mac-app) الخاص بـ
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

يملأ العرض الحاوية التي يرتّبها NSH؛ ويعمل `ComponentContext::emit` و`set_size` (بالنقاط) من أي خيط، كما
في iOS. سجّل قبل `AppView::load`؛ فالسجلّ يخص `AppView` واحدًا (والعروض المنشأة من
`AppOptions` نفسه).

<a id="registering-on-linux-rust"></a>

## التسجيل على Linux (Rust)

على Linux يكون المكوّن عنصر واجهة GTK، ويُسجَّل على [`AppView`](./linux.md#embedding-in-a-gtk-app) الخاص بـ
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

يملأ عنصر الواجهة الحاوية التي يرتّبها NSH؛ ويعمل `ComponentContext::emit` و`set_size` (بالنقاط) من أي خيط،
كما في iOS. سجّل قبل `AppView::load`. السجلّ يخص `AppView` واحدًا (والعروض المنشأة من
`AppOptions` نفسه، الذي يكون `components` حقلًا فيه).

<a id="registering-on-windows-rust"></a>

## التسجيل على Windows (Rust)

على Windows يرسم NSH كل عرض بنفسه باستخدام Direct2D، لذا إما أن يرسم المكوّن داخل حاويته باستخدام Direct2D
(`draw`) أو يأتي بنافذة خاصة به (`window`: عنصر تحكم خريطة، أو عرض من جهة خارجية)، ويُسجَّل على
[`AppView`](./windows.md#embedding-in-a-win32-app) الخاص بـ `nsh-platform-windows`:

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

يعمل `draw` مع كل إطار من النافذة، في إحداثيات العرض (بالنقاط)، ومقصوصًا على حدوده؛ استدعِ
`ComponentContext::redraw` عندما يتغير ما يعرضه. يُغطّى المكوّن المرسوم ويُقصّ ويُحوَّل مثل أي
عرض، وتصل اللمسات إلى حاويته. أما المكوّن الذي يعيد نافذة فرعية من `window` فتُنقل وتُقصّ
وتُخفى مع عرضها، وتتلقى مدخلاتها الخاصة، وتظهر فوق كل ما يرسمه NSH (ويُخفى محتوى NSH الذي فوقها، كما
هو الحال مع عروض الويب). ويعمل `ComponentContext::emit` و`set_size` (بالنقاط) و`redraw` من أي خيط. سجّل قبل
`AppView::load`؛ فالسجلّ يخص `AppView` واحدًا (والعروض المنشأة من `AppOptions` نفسه).

ويتلقى المكوّن أيضًا عجلة الفأرة وتمريرات لوحة اللمس فوقه عبر `wheel` (يستخدمها عارض الصور للتكبير). ويحتوي
`Wheel` الذي يصله على المؤشر (`x`، `y`، بنقاط المكوّن)، والمسافة بالنقاط (`dx`، `dy`، موجبة
نحو اليمين والأسفل، كما تحرّك عروض التمرير محتواها) وبفواصل عجلة الفأرة (`notches_x`، `notches_y`، مع
كسور من لوحات اللمس الدقيقة وعجلات الدقة العالية)، وما إذا كان قد جاء بخطوات دقيقة (`precise`) وأزرار
التعديل المضغوطة (`shift`، `ctrl`، `alt`). ويعيد `true` للتمريرة التي أخذها؛ وتتمرر عروض التمرير المحيطة به مع
البقية، وبشكل افتراضي مع جميعها. أما التمريرة التي بدأها عرض تمرير فتبقى على ذلك العرض. وCtrl + العجلة هو أيضًا
قرص لوحة اللمس الدقيقة، ويصل Shift + العجلة كما أرسلته العجلة (`dy`، مع `shift`):

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

## التسجيل من حزمة التطبيق

التطبيق الذي لديه حزمة Rust خاصة به (`nsh.json` `"rust"`، [Rust](./rust.md)) يسجّل المكوّنات الأصلية في تلك
الحزمة، فتعمل في المضيفات التي يبنيها NSH للتطبيق: مضيف التطوير الخاص بـ `nsh run` و`nsh test --target`، و
التطبيق الذي ينشئه `nsh package`. تسجّلها دالة مع `#[native_components(<platform>)]` في جذر الحزمة (`lib.rs`)
على `Components` الخاص بتلك المنصة، ويستدعيها المضيف لكل عرض ينشئه، كما يسجّل التطبيق المضمِّن على
`AppView` الخاص به:

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

المنصة هي `windows` أو `macos` أو `linux` أو `ios`، والمكوّنات هي مكوّنات
`nsh_platform_windows` أو `nsh_platform_macos` أو `nsh_platform_linux` أو `nsh_platform_ios` (الأقسام أعلاه). لا تُترجَم
الدالة إلا على منصتها، لذا يكون في الحزمة واحدة لكل منصة تدعمها، وكل منها تسجّل الأسماء نفسها،
وتعتمد على حزمة كل منصة لتلك المنصة فقط، بالإصدار نفسه ومن المصدر نفسه الخاصين بحزم NSH
الأخرى (`nsh-core` وبقيتها؛ وتتحقق واجهة سطر الأوامر من تطابقها جميعًا):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

يسجّل المضيف مكوّنات الحزمة عند إنشاء كل عرض، قبل أن يسجّل الكود الذي يحتفظ بالعرض
مكوّناته الخاصة: فالاسم المسجَّل على العرض بعد ذلك (`AppView::register_component`) يستبدل اسم الحزمة.
<a id="rules-and-limits"></a>

## القواعد والحدود

- **سجّل قبل التحميل.** تُطبَّق المصانع (Factories) على العناصر التي تُنشأ بعد التسجيل. سجّل كل اسم قبل
  `loadBundle` / `loadAssetBundle` / `run`، حتى يجدها الإطار الأول.
- **الحاوية تملك الزخرفة واللمس.** الخلفية والحدود ونصف قطر الزوايا والظلال والشفافية والتحويلات و
  `overflow: "hidden"` تُطبَّق على الحاوية التي يرسمها NSH. يملأ العرض الخاص بك هذه الحاوية ويستقبل اللمسات التي تقع داخلها.
- **الإمكانات (Capabilities) لا تنطبق.** المكوّن المسجَّل هو شيفرة التطبيق المضيف نفسه؛ و[الإمكانات](./sandbox-and-capabilities.md) التي يعلنها التطبيق لا تقيّد ما يفعله. إذا كنت تضمّن تطبيقات لا تثق بها، فسجّل فقط المكوّنات الآمنة لاستخدامها.
- **أبقِ الواجهة قائمة على البيانات.** تنتقل الخصائص (Props) وحمولات الأحداث ووسائط الأوامر على هيئة نص JSON؛ أرسل المعرّفات والقيم الصغيرة، لا الكتل الكبيرة، مع كل تغيير.
- **حزمة واحدة لكلا المنصتين.** سجّل الأسماء نفسها بالخصائص والأحداث نفسها على iOS وAndroid، لتعمل حزمة واحدة على كليهما.
- **الأسماء تحت `nsh/` تخص NSH.** مكوّنات NSH الخاصة (شريط التبويب الخاص بالنظام في `TabBar` التابع لـ`nsh/mobile`) مسجَّلة تحت `nsh/`؛ فسمِّ مكوّناتك باسم تطبيقك أو شركتك (`embed.badge`)، وأي تسجيل تحت `nsh/` يسجّل تحذيرًا ويُبقي على مكوّن NSH.

<a id="see-also"></a>

## انظر أيضًا

- [مرجع `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [التضمين في تطبيقات iOS](./ios.md) و[في تطبيقات Android](./android.md)
- [البنية المعمارية](./architecture.md): كيف تعبر الخصائص والأحداث بين الخيوط (threads)
