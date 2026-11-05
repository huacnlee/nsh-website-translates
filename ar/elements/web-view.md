---
title: "WebView"
description: "عنصر WebView: عرض صفحات الويب وشيفرة HTML المضمّنة داخل التطبيق، مع إمكانية تبادل الرسائل في الاتجاهين."
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

يعرض WebView صفحة ويب، أو HTML تمرّره أنت، داخل التطبيق: WKWebView على iOS وMac Catalyst،
و`android.webkit.WebView` على Android. ولأن NSH يعرض الواجهة باستخدام عناصر عرض أصلية، فإن WebView يوضع في التخطيط مثل أي عنصر عرض آخر،
بالترتيب نفسه مع العناصر المحيطة به. في Rust يمكنك إنشاؤه باستخدام `web_view(url)` أو `web_view_html(html, base_url)`، وفي TSX
باستخدام `<WebView>` من `nsh`.

```rust tabs
use nsh_core::prelude::*;

fn browser() -> impl IntoElement {
    let title = signal(SharedString::from("Loading…"));
    view()
        .flex_1()
        .child(text(title).number_of_lines(1))
        .child(
            web_view("https://example.com")
                .flex_1()
                .on_navigation_state_change(move |e: &WebNavigation| title.set(e.title.clone().into())),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewNavigation } from "nsh";

function Browser() {
  const nav = signal<WebViewNavigation | null>(null);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ numberOfLines: 1 }}>{nav()?.title ?? "Loading…"}</Text>
      <WebView
        src="https://example.com"
        style={{ flex: 1 }}
        onNavigationStateChange={(e) => nav.set(e)}
      />
    </View>
  );
}
```

في TSX يقبل WebView واحدة من الخاصيتين `src` و`html` (راجع [WebView API](../modules/nsh-webview.md)). ويتناول
[دليل WebView والفيديو](../docs/web-view-and-video.md) أنماط تبادل الرسائل والإمكانات.

<a id="props"></a>

## الخصائص

يقبل WebView خصائص [العرض](./view.md) (وليس له عناصر فرعية) بالإضافة إلى ما يلي:

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | عنوان URL للصفحة المراد عرضها. |
| `html` | `web_view_html(html, base_url)`، `.html(html, base_url)` | `string` | | HTML مضمّن، يُعرض بدلاً من `src`. |
| `baseUrl` | `base_url` من `web_view_html` / `.html` | `string` | | الأساس الذي تُحلّ الروابط النسبية في `html` بالنسبة إليه. |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | يُنفَّذ بعد تحميل كل صفحة. |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | يُنفَّذ قبل سكربتات كل صفحة الخاصة. |
| `userAgent` | `.user_agent(..)` | `string` | | سلسلة وكيل المستخدم (user agent) الخاصة بالمتصفح. |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | تشغّل الصفحات السكربتات. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | يمكن للمستخدم تمرير الصفحة. |

| المفتاح `ios` | Rust | النوع | الوصف |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | اسحب من الحواف للرجوع والتقدم. |

| المفتاح `desktop` | Rust | النوع | الوصف |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: اسحب بإصبعين على لوحة التتبع للرجوع والتقدم؛ Windows: اسحب على شاشة اللمس؛ Linux: اسحب على لوحة اللمس. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات المرافقة | متى يقع |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | بدأ تحميل صفحة. |
| `onLoad` | `.on_load` | `WebViewNavigation` | انتهى تحميل صفحة. |
| `onError` | `.on_error` | `{ message, code? }` (`&str`، الرسالة) | فشل التحميل؛ تكون قيمة `code` هي `"ERR_ACCESS_DENIED"` لصفحة أو `html` لا تمنحها إمكانات التطبيق. |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | تغيّر عنوان URL أو العنوان أو حالة التحميل أو السجل. |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | استدعت الصفحة `window.nsh.postMessage(data)`. |
| `onDownload` | | `WebViewDownload` | بدأ تنزيل أو انتهى أو فشل (macOS). |

`WebViewNavigation` هو `{ url, title, loading, canGoBack, canGoForward }`؛ وفي Rust `WebNavigation` مع `url` و`title`
و`loading` و`can_go_back` و`can_go_forward`.

`WebViewDownload` هو `{ state, id, url, filename, path, bytes?, message? }`: `state` هو `"started"` أو `"finished"`
(مع `bytes` الخاص بالملف) أو `"failed"` (مع `message` الخاص به). عند وجود مستمع `onDownload`، فإن ما تنزّله الصفحة
(مرفق، أو نوع لا يعرضه WebView، أو رابط `download`) يُحفظ في دليل بيانات التطبيق بالاسم
`downloads/<id>/<filename>`، حيث يشير `path`، ويقرؤه التطبيق باستخدام `fs/promises`.

على macOS، تتيح إضافة المستمع لأي صفحة محمّلة تسمح بها إمكانية `webview` أن تحفظ التنزيلات
تلقائيًا. ويتحمّل التطبيق مسؤولية ميزانية التخزين الخاصة به وحذف الملفات المكتملة من `downloads/`
عند انتهائه من استخدامها. وتؤدي إزالة WebView إلى إلغاء التنزيلات الجارية وحذف
أدلتها الجزئية. وتُبلَّغ التنزيلات عبر `onDownload`؛ أما تحويل عملية تنقّل إلى تنزيل فيُبقي على `onError`
لحالات فشل التنقّل الفعلية. وتُزال من أسماء الملفات محارف التحكم ومحارف التنسيق ثنائية الاتجاه،
وتُقصَّر الأسماء الطويلة إلى 200 بايت مع الحفاظ على الامتداد إن كان يتسع.

<a id="ref-methods"></a>

## دوال المرجع (Ref)

| الدالة | Rust | الوصف |
|---|---|---|
| `reload()` | `reload()` | تعيد تحميل الصفحة. |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | تتنقل في سجل الصفحة. |
| `stopLoading()` | `stop_loading()` | توقف التحميل. |
| `injectJavaScript(script)` | `inject_java_script(script)` | تنفّذ JavaScript في الصفحة. |
| `postMessage(data)` | `post_message(data)` | ترسل سلسلة نصية إلى الصفحة، فتستقبل حدث `message` على `window`. |

<a id="messaging"></a>

## تبادل الرسائل

يتبادل التطبيق والصفحة سلاسل نصية. تُرسل الصفحة باستخدام `window.nsh.postMessage(data)`، ويُرسل التطبيق
باستخدام `postMessage(data)` الخاصة بالمرجع (`post_message(..)` في Rust). أرسل JSON للبيانات المنظَّمة.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>"#;

fn bridge() -> impl IntoElement {
    let message = signal(String::new());
    let web = element_ref();
    view()
        .gap_3()
        .child(
            web_view_html(PAGE.to_string(), None)
                .element_ref(&web)
                .h(px(200.0))
                .on_message(move |data: &str| message.set(data.to_string())),
        )
        .child(
            text(move || format!("Post to the page · got: {}", message.get()))
                .on_press(move || web.post_message("hi from the app")),
        )
}
```

```tsx tabs
import { signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<meta name="viewport" content="width=device-width">
<button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
<p id="got"></p>
<script>
  window.addEventListener("message", (e) => { document.getElementById("got").textContent = e.data; });
</script>`;

function Bridge() {
  const message = signal("");
  let web!: WebViewRef;
  return (
    <View style={{ gap: 12 }}>
      <WebView ref={web} html={page} style={{ height: 200 }} onMessage={(e) => message.set(e.data)} />
      <Text onPress={() => web.postMessage("hi from the app")}>Post to the page · got: {message()}</Text>
    </View>
  );
}
```

<a id="capabilities"></a>

## الإمكانات

عندما يصرّح التطبيق عن [الإمكانات](../docs/sandbox-and-capabilities.md) في `nsh.json`، فإن WebView يعرض المضيفين المدرجين ضمن `webview`
ويتنقّل إليهم. أما `src` على مضيف آخر، أو `html` في تطبيق بلا `webview`، فيُظهر
عرضًا فارغًا؛ ويُلغى أصلاً التنقّل من المستوى الأعلى إلى مضيف آخر (رابط ينقر عليه المستخدم). ويبلّغ كلٌّ منها
عن `onError` مع `code` `"ERR_ACCESS_DENIED"`.

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- يحمّل iOS مكتبة WebKit عند إنشاء أول WebView، لذا لا يتكلّف التطبيق شيئًا إلا عندما يعرض واحدًا.
- على macOS يحفظ `onDownload` التنزيلات باستخدام `WKDownload` الخاص بـ WebKit.
- على Android تصل استدعاءات `postMessage` من الصفحة على خيط في الخلفية وتُمرَّر إلى التطبيق بالترتيب.
- لتدوير زوايا WebView، امنحه نصف قطر زاوية و`overflow: "hidden"` (`.overflow_hidden()`).
