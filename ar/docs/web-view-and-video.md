---
title: "عرض الويب والفيديو"
description: "عرض صفحات الويب باستخدام WebView وتشغيل الفيديو باستخدام Video - المصادر، والمراسلة بين الصفحة والتطبيق، والتنقل، والتحكم في التشغيل، والمراجع (refs) والإمكانات."
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# عرض الويب والفيديو

يضمّن عارض الويب ومشغّل الفيديو محرّك الويب ومشغّل الوسائط الخاصين بالمنصة كعناصر عرض عادية: `web_view` و`video` في Rust (`nsh_core::prelude`)، و`WebView` و`Video` من `nsh` في TSX. ولأن NSH يرسم باستخدام عناصر عرض أصلية، فإنها توضع في تخطيطك مثل أي عنصر آخر: تتمرر مع عنصرها الأب، وتقبل الزوايا المستديرة والقص، ويمكن لعناصر العرض الأخرى أن تتراكب فوقها دون مشاكل في الطبقات.

| المكوّن | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` من WebKitGTK 6.0 | WebView2 في نافذة فرعية |
| `Video` | AVPlayerLayer؛ AVPlayerViewController مع `controls` | MediaPlayer على TextureView؛ MediaController مع `controls` | AVPlayerLayer؛ AVPlayerView من AVKit مع `controls` | GTK's media stream (GStreamer) في `GtkPicture`؛ `GtkVideo` مع `controls` | محرّك الوسائط في Media Foundation، وتُرسم الإطارات بواسطة Direct2D؛ وشريط التحكم الخاص بـ NSH مع `controls` |

تُحمَّل الأطر التي تقف خلفها (WebKit وAVFoundation) عند أول استخدام لأحدها في التطبيق، فلا تتحمل التطبيقات التي لا تعرض صفحة ويب أو فيديو كلفتها عند الإقلاع.

على [macOS](./macos.md) لا يملك عارض الويب عنصر تمرير خاصاً به: مع `scrollable={false}` تمرّر عجلة الفأرة ولوحة اللمس عناصر التمرير في التطبيق المحيطة به بدلاً من الصفحة، التي لا تزال تتمرر بلوحة المفاتيح وبنصوصها البرمجية الخاصة.

على [Linux](./linux.md) يكون عارض الويب صفحة WebKitGTK تُرسم داخل عنصر العرض الخاص بها: أي محتوى NSH فوقها (مثل حوار أو ورقة) يغطيها، وعناصرها الأب تقصّها. وتنطبق الصلاحية `webview` هناك أيضاً على تنقلات الإطارات (يبقى `iframe` لمضيف غير مسموح به فارغاً)، ويمنع `scrollable: false` الصفحة نفسها من التمرير (أما العناصر داخلها فتواصل التمرير). تحتاج التطبيقات إلى WebKitGTK 6.0 مثبّتاً؛ أما بيئة التشغيل المبنية بدونه فتعرض عنصراً نائباً محايداً. تشغّل مقاطع الفيديو الصيغ التي تفك ترميزها إضافات GStreamer المثبّتة؛ و`rate` غير مدعوم (تُشغَّل بسرعة 1×)، و`onEnd` لا يتوفر إلا لمقاطع الفيديو التي لا تتكرر.

على [Windows](./windows.md) يكون عارض الويب عنصر تحكم WebView2 في نافذة فرعية تتبع عنصر العرض الخاص به: يُقصّ بحسب عناصره الأب وزواياه المستديرة، لكن محتوى NSH المرسوم فوقه (مثل حوار أو ورقة) يبقى تحته. ويحتاج إلى WebView2 Runtime (وهو جزء من Windows 11؛ ويُثبَّت مع Edge على Windows 10)، وإلا فإنه يعرض عنصراً نائباً؛ و`baseUrl` لـ HTML و`scrollable` و`allowsBackForwardNavigationGestures` غير مدعومة. أما مقاطع الفيديو فهي محتوى عادي (تُقصّ وتُحوَّل ويُغطّى عليها كأي عنصر عرض) وتشغّل الصيغ التي تفك ترميزها برامج الترميز المثبّتة في Media Foundation؛ و`rate` يعمل، ولا توجد صورة غلاف، ويظهر شريط التحكم دائماً ما دام `controls` مفعّلاً.

## WebView

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    web_view("https://en.m.wikipedia.org/wiki/Swift_(programming_language)").flex_1()
}
```

```tsx tabs
import { mount, WebView } from "nsh";

function App() {
  return <WebView src="https://en.m.wikipedia.org/wiki/Swift_(programming_language)" style={{ flex: 1 }} />;
}

mount(App);
```

<a id="sources"></a>

### المصادر

يعرض عارض الويب أحد `src` و`html`:

| الخصائص | يعرض |
|---|---|
| `src="https://…"` | صفحة ويب. |
| `html="<!doctype html>…"` | HTML من سلسلة نصية، يُعرض بدلاً من `src`. |
| `html` مع `baseUrl="https://example.com/"` | HTML تُحلّ عناوين URL النسبية فيه مقابل `baseUrl`. |

في Rust يعرض `web_view(url)` صفحة ويعرض `web_view_html(html, base_url)` شيفرة HTML (`base_url` قيمة من النوع `Option<&str>`)؛ ويمكن أن يكون عنوان URL وشيفرة HTML إشارة (signal) أو دالة مغلقة (closure)، فتُحمَّل الصفحة من جديد عندما يتغير ما تقرؤه. يؤدي تغيير `src` أو `html` إلى تحميل الصفحة الجديدة.

<a id="props"></a>

### الخصائص

في Rust تكون كل خاصية دالة بناء (builder) بصيغة snake case (`injected_java_script` و`java_script_enabled` و`scrollable` و`user_agent`؛ و`injected_java_script_before_content` لـ `injectedJavaScriptBeforeContentLoaded`، و`back_forward_gestures` لـ `allowsBackForwardNavigationGestures` في iOS) وكل حدث دالة `on_…` (`on_navigation_state_change`) يتلقى مستمعها `WebNavigation` (`url` و`title` و`loading` و`can_go_back` و`can_go_forward`) أو، في حالة `on_error` و`on_message`، `&str`.

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `src` | `string` | | عنوان URL للصفحة المراد عرضها. |
| `html` | `string` | | شيفرة HTML مضمّنة، تُعرض بدلاً من `src`. |
| `baseUrl` | `string` | | ما تُحلّ عناوين URL النسبية في `html` مقابله. |
| `injectedJavaScript` | `string` | | يعمل بعد تحميل كل صفحة. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | يعمل قبل النصوص البرمجية الخاصة بكل صفحة. |
| `javaScriptEnabled` | `boolean` | `true` | تشغّل الصفحات النصوص البرمجية. |
| `scrollable` | `boolean` | `true` | يستطيع المستخدم تمرير الصفحة. |
| `userAgent` | `string` | | سلسلة user agent الخاصة بالمتصفح. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: التمرير بالسحب للخلف وللأمام في سجل الصفحات. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: السحب بإصبعين على لوحة اللمس للرجوع والتقدم؛ Windows: السحب على شاشة اللمس؛ Linux: السحب على لوحة اللمس. |

الأحداث:

| الحدث | البيانات المرسلة | متى |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | بدأت صفحة بالتحميل. |
| `onLoad` | `WebViewNavigation` | انتهت صفحة من التحميل. |
| `onError` | `{ message }` | فشل التحميل. |
| `onNavigationStateChange` | `WebViewNavigation` | تغيّر عنوان URL أو العنوان أو حالة التحميل أو السجل. |
| `onMessage` | `{ data: string }` | أرسلت الصفحة رسالة (أدناه). |

`WebViewNavigation` هو `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### متصفح مع الرجوع والتقدم

يوفّر مرجع عارض الويب (`element_ref()` يوضع عليه بواسطة `.element_ref(&web)` في Rust و`ref` في TSX) الدوال `reload` و`go_back` / `goBack` و`go_forward` / `goForward` و`stop_loading` / `stopLoading` و`inject_java_script` / `injectJavaScript(script)` و`post_message` / `postMessage(data)` و`send_input` / `sendInput(input)` ([أدناه](#input-as-the-users-own)):

```rust tabs
use nsh_core::prelude::*;

pub fn browser() -> impl IntoElement {
    let web = element_ref();
    let nav = signal(None::<WebNavigation>);
    let button = move |label: &'static str, enabled: fn(&WebNavigation) -> bool, action: fn(&ElementRef)| {
        let enabled = move || nav.with(|n| n.as_ref().is_some_and(enabled));
        text(label)
            .p(px(12.0))
            .text_color(move || if enabled() { rgb(0x0969da) } else { rgb(0x8c959f) })
            .disabled(move || !enabled())
            .on_press(move || action(&web))
    };
    view()
        .flex_1()
        .pt(px(50.0))
        .child(
            text(move || {
                nav.with(|n| match n {
                    Some(n) if n.loading => "Loading…".to_owned(),
                    Some(n) => n.title.clone(),
                    None => String::new(),
                })
            })
            .number_of_lines(1)
            .px(px(12.0))
            .text_color(rgb(0x57606a)),
        )
        .child(
            web_view("https://developer.mozilla.org/")
                .element_ref(&web)
                .flex_1()
                .on_navigation_state_change(move |n: &WebNavigation| nav.set(Some(n.clone())))
                .back_forward_gestures(true),
        )
        .child(
            view()
                .flex_row()
                .justify_around()
                .child(button("Back", |n| n.can_go_back, |web| web.go_back()))
                .child(button("Forward", |n| n.can_go_forward, |web| web.go_forward()))
                .child(button("Reload", |_| true, |web| web.reload())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  let web!: WebViewRef;
  const nav = signal<WebViewNavigation | null>(null);
  const button = (label: string, enabled: boolean, action: () => void) => (
    <Text onPress={enabled ? action : undefined} style={{ padding: 12, color: enabled ? "#0969da" : "#8c959f" }}>
      {label}
    </Text>
  );
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ numberOfLines: 1, paddingHorizontal: 12, color: "#57606a" }}>
        {nav()?.loading ? "Loading…" : nav()?.title ?? ""}
      </Text>
      <WebView
        ref={web}
        src="https://developer.mozilla.org/"
        style={{ flex: 1 }}
        onNavigationStateChange={(n) => nav.set(n)}
        ios={{ allowsBackForwardNavigationGestures: true }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {button("Back", !!nav()?.canGoBack, () => web.goBack())}
        {button("Forward", !!nav()?.canGoForward, () => web.goForward())}
        {button("Reload", true, () => web.reload())}
      </View>
    </View>
  );
}

mount(Browser);
```

<a id="messaging-between-the-page-and-the-app"></a>

### تبادل الرسائل بين الصفحة والتطبيق

تتحدث الصفحات إلى التطبيق باستخدام `window.nsh.postMessage(string)`، وتصل على شكل `on_message` (`onMessage`). ويتحدث التطبيق إلى الصفحة باستخدام `post_message` الخاصة بالمرجع (`postMessage(string)`)، وتصل في الصفحة على شكل حدث `message` على `window`. الرسائل سلاسل نصية؛ أرسل JSON للبيانات المنظَّمة.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>"#;

#[component]
pub fn App() -> impl IntoElement {
    let web = element_ref();
    let last = signal(String::new());
    view()
        .flex_1()
        .pt(px(50.0))
        .gap(px(12.0))
        .child(
            web_view_html(PAGE, None)
                .element_ref(&web)
                .h(px(240.0))
                .on_message(move |data: &str| {
                    let message: serde_json::Value = serde_json::from_str(data).unwrap_or_default();
                    last.set(message["type"].as_str().unwrap_or_default().to_owned());
                }),
        )
        .child(
            text("Post to the page")
                .p(px(16.0))
                .text_color(rgb(0x0969da))
                .on_press(move || web.post_message("hi from nsh")),
        )
        .child(text(move || format!("Last message: {}", last.get())).px(px(16.0)))
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>`;

function App() {
  let web!: WebViewRef;
  const last = signal("");
  return (
    <View style={{ flex: 1, paddingTop: 50, gap: 12 }}>
      <WebView
        ref={web}
        html={page}
        style={{ height: 240 }}
        onMessage={(e) => last.set(JSON.parse(e.data).type)}
      />
      <Text onPress={() => web.postMessage("hi from nsh")} style={{ padding: 16, color: "#0969da" }}>
        Post to the page
      </Text>
      <Text style={{ paddingHorizontal: 16 }}>Last message: {last()}</Text>
    </View>
  );
}

mount(App);
```

تشغّل `inject_java_script` الخاصة بالمرجع (`injectJavaScript(script)`) شيفرة في الصفحة الحالية في أي وقت؛ أما `injected_java_script` و`injected_java_script_before_content` (`injectedJavaScript`، `injectedJavaScriptBeforeContentLoaded`) فتعملان مع كل تحميل لصفحة، قبل النصوص البرمجية الخاصة بالصفحة أو بعدها، وهما المكان المناسب لتثبيت الخطافات (hooks):

```rust tabs
web_view("https://example.com")
    .injected_java_script_before_content("window.isNativeApp = true;")
    .injected_java_script("window.nsh.postMessage(document.title);")
    .on_message(|title: &str| log::info!("title {title}"))
```

```tsx tabs
<WebView
  src="https://example.com"
  injectedJavaScriptBeforeContentLoaded={`window.isNativeApp = true;`}
  injectedJavaScript={`window.nsh.postMessage(document.title);`}
  onMessage={(e) => console.log("title", e.data)}
/>
```

<a id="input-as-the-users-own"></a>

### إدخال كأنه من المستخدم نفسه

لا يستطيع `injectJavaScript` سوى إنشاء أحداث اصطناعية، ترى الصفحة أنها غير موثوقة (`event.isTrusted` هو `false`) وتتجاهلها بعض عناصر الواجهة. أما `send_input` الخاصة بالمرجع (`sendInput(input)`) فتمنح الصفحة إدخالاً كما لو كان من يدَي المستخدم نفسه، فتكون أحداثه موثوقة:

- `{ type: "click", x, y }` ينقر على نقطة في إطار العرض، بوحدات بكسل CSS (ما يبلغ عنه `getBoundingClientRect()`).
- `{ type: "text", text }` يكتب النص في العنصر الذي يملك تركيز الصفحة، مفتاحاً بعد مفتاح: كل حرف على مفتاحه في تخطيط US، وفاصل السطر على أنه Enter، وما لا يكتبه أي مفتاح في تخطيط US (`é` وCJK والرموز التعبيرية) دون مفتاح (`code` هو `"Unidentified"`).
- `{ type: "key", key }` يضغط `Enter` أو `Tab` أو `Escape` أو `Backspace`.

```rust tabs
use nsh_core::{WebInput, WebKey, prelude::*};
use std::time::Duration;

fn search(web: &ElementRef) {
    web.send_input(WebInput::Click { x: px(120.0), y: px(40.0) });
    let web = *web;
    set_timeout(Duration::from_millis(50), move || {
        web.send_input(WebInput::Text("espresso".into()));
        web.send_input(WebInput::Key(WebKey::Enter));
    });
}
```

```tsx tabs
web.sendInput({ type: "click", x: 120, y: 40 });
setTimeout(() => {
  web.sendInput({ type: "text", text: "espresso" });
  web.sendInput({ type: "key", key: "Enter" });
}, 50);
```

في Rust هذه هي `WebInput::Click { x, y }` و`WebInput::Text(text)` و`WebInput::Key(WebKey::Enter)`.

يحمل الإدخال الموثوق تفعيل المستخدم (user activation)، أي أنه قد يفتح نوافذ، ويكتب في الحافظة، ويفتح لوحة الملفات في النظام، ويضغط زر التأكيد في صفحة، ولذلك فهو صلاحية قائمة بذاتها: يحتاج التطبيق إلى `"webview": { "input": true }` في `capabilities` ضمن `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview))، حتى عندما لا يعلن عن أي صلاحيات، وإلا أسقطت النواة الاستدعاء.

مثل النقرة، يأخذ `sendInput` تركيز لوحة المفاتيح لعارض الويب، بعيداً عن `Input` الخاص بالتطبيق. وتعالج الصفحة الإدخال وفق جدولها الزمني: قد تكون أحداث نقرة ما زالت في الطريق عندما يبدأ الاستدعاء التالي، لذا اترك النقرة تستقر (إطاراً أو نحو ذلك) قبل الكتابة بعدها. يسلّم macOS الإدخال؛ أما المنصات الأخرى فتتجاهله حالياً.

قبل تقديم أي شيء يعتمد عليه، اسأل هل يعمل هنا: يُرجع `web_input_available()` (`WebView.inputAvailable()`) القيمة `true` فقط حيث تسلّم المنصة الإدخال ويملك التطبيق `webview.input`، فهو `false` على المنصات التي تتجاهل الاستدعاء وفي التطبيقات التي لا تملك هذه الصلاحية.

```rust tabs
use nsh_core::prelude::*;

let input = signal(false);
spawn(async move { input.set(web_input_available().await) });
```

```tsx tabs
import { signal, WebView } from "nsh";

const input = signal(false);
WebView.inputAvailable().then((available) => input.set(available));
```

<a id="which-sites-a-web-view-may-show"></a>

### المواقع التي يجوز لعارض الويب عرضها

إذا أعلن `nsh.json` الخاص بك عن `"capabilities"`، فلا يجوز لعارض الويب أن يعرض أو يتنقل إلا إلى المضيفين المدرجين ضمن `webview`:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

يشمل الفحص `src` الخاص بعارض الويب وكل تنقل من المستوى الأعلى تجريه الصفحة (الروابط وإعادة التوجيه وتغييرات `location`)؛ ويُحسم أصلياً عندما تسأل المنصة هل يجوز للتنقل أن يمضي. أما الموارد الفرعية للصفحة (النصوص البرمجية والصور والإطارات) فهي شأن محتوى الويب ولا تُفحص. يطابق `*.example.com` النطاقات الفرعية فقط؛ أدرج `example.com` أيضاً للنطاق المجرد. أما التطبيق الذي لا يحتوي على مفتاح `"capabilities"` فيجوز له عرض أي صفحة. راجع [العزل والصلاحيات](./sandbox-and-capabilities.md).

## Video

```rust tabs
use nsh_core::prelude::*;

pub fn player() -> impl IntoElement {
    let player = element_ref();
    let paused = signal(true);
    let time = signal(String::new());
    let link = |label: &'static str| text(label).text_color(rgb(0x0969da));
    view()
        .flex_1()
        .justify_center()
        .p(px(16.0))
        .gap(px(12.0))
        .child(
            video("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
                .element_ref(&player)
                .paused(paused)
                .repeat(true)
                .object_fit(ResizeMode::Contain)
                .h(px(220.0))
                .rounded(px(12.0))
                .overflow_hidden()
                .bg(rgb(0x000000))
                .on_progress(move |e: &VideoProgress| {
                    time.set(format!("{:.1} / {:.1} s", e.current_time, e.duration))
                })
                .on_end(move || paused.set(true)),
        )
        .child(
            view()
                .flex_row()
                .gap(px(16.0))
                .items_center()
                .child(
                    text(move || if paused.get() { "Play" } else { "Pause" })
                        .text_color(rgb(0x0969da))
                        .font_weight(FontWeight::SEMIBOLD)
                        .on_press(move || paused.update(|p| *p = !*p)),
                )
                .child(link("Restart").on_press(move || player.seek(0.0)))
                .child(text(move || time.get()).text_color(rgb(0x57606a))),
        )
}
```

```tsx tabs
import { mount, signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  let video!: VideoRef;
  const paused = signal(true);
  const time = signal("");
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 12 }}>
      <Video
        ref={video}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        paused={paused()}
        repeat
        style={{ height: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "#000000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
        onEnd={() => paused.set(true)}
      />
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text onPress={() => paused.set(!paused())} style={{ color: "#0969da", fontWeight: "600" }}>
          {paused() ? "Play" : "Pause"}
        </Text>
        <Text onPress={() => video.seek(0)} style={{ color: "#0969da" }}>
          Restart
        </Text>
        <Text style={{ color: "#57606a" }}>{time()}</Text>
      </View>
    </View>
  );
}

mount(Player);
```

يُتحكَّم في التشغيل بالخصائص: اضبط `paused` و`muted` و`volume` و`rate` من إشارات (signals) فيتبعها المشغّل. ويحتوي المرجع على `seek(seconds)`.

في Rust، ينشئ `video(url)` المشغّل (عنوان URL قيمة أو إشارة أو دالة مغلقة) وكل خاصية دالة بناء بصيغة snake case (`paused` و`repeat(true)` و`object_fit(ResizeMode::Contain)` (نمط `objectFit`) و`progress_interval` لـ `progressUpdateInterval`)؛ ويتلقى `on_load` `VideoInfo` (`duration`، `size`)، ويتلقى `on_progress` `VideoProgress` (`current_time`، `duration`)، ويتلقى `on_buffer` `bool`.

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `src` | `string` | | عنوان URL للفيديو. |
| `paused` | `boolean` | `false` | التشغيل متوقف مؤقتاً. |
| `muted` | `boolean` | `false` | بلا صوت. |
| `volume` | `number` | `1` | من 0 إلى 1. |
| `rate` | `number` | `1` | سرعة التشغيل. |
| `repeat` | `boolean` | `false` | يعيد التشغيل من البداية عند النهاية. |
| `objectFit` (نمط)، وفئات `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | كيفية ملاءمة الصورة لعنصر العرض، مثل `object-fit` في CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | عناصر التحكم في التشغيل الخاصة بالمنصة. |
| `progressUpdateInterval` | `number` | `250` | الميلي ثانية بين أحداث `onProgress`. |

| الحدث | البيانات المرسلة | متى |
|---|---|---|
| `onLoadStart` | | بدأ التحميل. |
| `onLoad` | `{ duration, size }` | أصبح الفيديو جاهزاً: طوله بالثواني وحجمه. |
| `onProgress` | `{ currentTime, duration }` | أثناء التشغيل، كل `progressUpdateInterval` ms. |
| `onBuffer` | `{ isBuffering }` | توقف التشغيل في انتظار البيانات، أو استؤنف. |
| `onEnd` | | وصل التشغيل إلى النهاية. |
| `onError` | `{ message }` | فشل التحميل أو التشغيل. |

مع `controls` ترسم المنصة زر التشغيل وشريط التنقل وزر ملء الشاشة الخاصة بها. وبدونه، ارسم عناصر التحكم الخاصة بك باستخدام عناصر عرض فوق الفيديو أو تحته؛ ولأن الفيديو عنصر عرض أصلي في تخطيطك، تعمل التراكبات بشكل طبيعي:

```rust tabs
view()
    .h(px(220.0))
    .child(video(url).paused(paused).flex_1())
    .child(
        view()
            .absolute()
            .inset_0()
            .items_center()
            .justify_center()
            .on_press(move || paused.update(|p| *p = !*p))
            .child(when(move || paused.get(), || {
                text("▶").text_size(px(48.0)).text_color(rgb(0xffffff))
            })),
    )
```

```tsx tabs
<View style={{ height: 220 }}>
  <Video src={url} paused={paused()} style={{ flex: 1 }} />
  <View
    onPress={() => paused.set(!paused())}
    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
  >
    <If when={paused()}>
      <Text style={{ fontSize: 48, color: "#ffffff" }}>▶</Text>
    </If>
  </View>
</View>
```

مصادر الفيديو هي طلبات شبكة: ومع الصلاحيات المعلنة، يجب السماح بمضيف الفيديو ضمن `network` في `nsh.json`، كما هو الحال مع `fetch` والصور البعيدة. المصدر المرفوض لا يعرض شيئاً، ويُسجَّل الرفض مرة واحدة مع المفتاح الذي ينبغي إضافته.

<a id="related"></a>

## مراجع ذات صلة

- [`WebView`](../elements/web-view.md) و[`Video`](../elements/video.md): مراجع العناصر.
- [العزل والصلاحيات](./sandbox-and-capabilities.md): صلاحيات `webview` و`network`.
- [المكوّنات الأصلية](./native-components.md): تضمين عناصر عرض أصلية أخرى يوفرها تطبيقك المضيف.
