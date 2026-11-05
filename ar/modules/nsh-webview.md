---
title: "WebView"
description: "WebView، عرض صفحات ويب أصلي (WKWebView، android.webkit.WebView)، مع خصائصه (props) وأحداثه (events) وطرق المرجع (ref methods)."
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

تصدّر `nsh` المكوّن `WebView`: صفحة ويب يعرضها محرك المتصفح الأصلي للمنصة (`WKWebView` على iOS وMac Catalyst، و`android.webkit.WebView` على Android). وهو عنصر عرض أصلي يخضع للتخطيط مثل أي عنصر آخر، لذلك يتمرر ويقتطع المحتوى ويتداخل مع العناصر الأخرى بشكل صحيح.

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

راجع [عرض الويب والفيديو](../docs/web-view-and-video.md) للاطلاع على الدليل، وراجع [`<WebView>`](../elements/web-view.md) لمعرفة خصائصه.

<a id="webview-1"></a>

## WebView

```ts
const WebView: (props: WebViewProps) => JSX.Element;

interface WebViewProps extends Omit<ViewProps, "children" | "ios" | "desktop">, WebViewHostProps {
  ios?: IOSWebViewHostProps;
  desktop?: DesktopWebViewHostProps;
}
```

```tsx
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  const nav = signal<WebViewNavigation | null>(null);
  let web!: WebViewRef;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", gap: 16, padding: 12 }}>
        <Text onPress={() => web.goBack()} style={{ opacity: nav()?.canGoBack ? 1 : 0.4 }}>Back</Text>
        <Text onPress={() => web.reload()}>Reload</Text>
        <Text style={{ numberOfLines: 1, flex: 1 }}>{nav()?.title ?? ""}</Text>
      </View>
      <WebView ref={web} src="https://example.com" style={{ flex: 1 }} onNavigationStateChange={(n) => nav.set(n)} />
    </View>
  );
}

mount(Browser);
```

<a id="props"></a>

## الخصائص

يقبل `WebView` [خصائص العرض](../elements/view.md) (النمط، والفئات، والتخطيط، وإمكانية الوصول، و`ref`؛ دون عناصر فرعية)، بالإضافة إلى ما يلي:

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `src` | `string` | | عنوان URL للصفحة المراد عرضها. |
| `html` | `string` | | شيفرة HTML مضمّنة تُعرض بدلاً من `src`. |
| `baseUrl` | `string` | | الأساس الذي تُحلّ الروابط النسبية في `html` بالنسبة إليه. |
| `injectedJavaScript` | `string` | | يعمل بعد تحميل كل صفحة. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | يعمل قبل تشغيل سكربتات كل صفحة. |
| `userAgent` | `string` | الافتراضي للمنصة | سلسلة وكيل المستخدم (user agent). |
| `scrollable` | `boolean` | `true` | يمكن للمستخدم تمرير الصفحة. |
| `javaScriptEnabled` | `boolean` | `true` | تشغّل الصفحات السكربتات. |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | على iOS فقط: السحب من الحواف للرجوع والتقدم. |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | على macOS: السحب بإصبعين على لوحة اللمس للرجوع والتقدم؛ وعلى Windows: السحب على شاشة اللمس؛ وعلى Linux: السحب على لوحة اللمس. |

<a id="events"></a>

## الأحداث

| الحدث | الحمولة | الوقت |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | تبدأ صفحة بالتحميل. |
| `onLoad` | `WebViewNavigation` | انتهى تحميل صفحة. |
| `onError` | `{ message: string }` | فشل تحميل صفحة. |
| `onNavigationStateChange` | `WebViewNavigation` | تغيّر عنوان URL أو العنوان أو حالة التحميل أو السجل. |
| `onMessage` | `{ data: string }` | استدعت الصفحة `window.nsh.postMessage(data)`. |

```ts
interface WebViewNavigation {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}
```

<a id="ref-methods"></a>

## دوال المرجع

| الدالة | الوصف |
|---|---|
| `reload()` | يعيد تحميل الصفحة. |
| `goBack()` | يرجع خطوة في سجلها. |
| `goForward()` | يتقدم خطوة في سجلها. |
| `stopLoading()` | يوقف التحميل. |
| `injectJavaScript(script)` | يشغّل `script` داخل الصفحة. |
| `postMessage(data)` | يرسل `data` (سلسلة نصية) إلى الصفحة: حدث `message` على `window`، مع `data` بوصفه `event.data`. |

<a id="talking-to-the-page"></a>

## التواصل مع الصفحة

ترسل الصفحة سلاسل نصية إلى التطبيق باستخدام `window.nsh.postMessage(…)`؛ ويرسل التطبيق سلاسل نصية إلى الصفحة باستخدام `ref.postMessage(…)`. أرسل JSON للبيانات المنظمة.

```tsx
const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width"></head>
<body>
  <button onclick="window.nsh.postMessage('hello from the page')">Post to the app</button>
  <p id="got"></p>
  <script>
    window.addEventListener('message', (e) => { document.getElementById('got').textContent = e.data; });
  </script>
</body></html>`;

let web!: WebViewRef;
const message = signal("");

<WebView ref={web} html={page} style={{ height: 200 }} onMessage={(e) => message.set(e.data)} />
<Text onPress={() => web.postMessage("hi from the app")}>Post to the page</Text>
```

<a id="capabilities"></a>

## القدرات

عندما يعلن تطبيقك عن `capabilities` في `nsh.json`، لا يجوز لعارض الويب أن يعرض أو ينتقل إلا إلى المضيفين المدرجين ضمن `webview`؛ أما عمليات الانتقال الأخرى على المستوى الأعلى فتُرفض أصلياً. أما التطبيق الذي لا يحتوي على المفتاح `capabilities` فيجوز له عرض أي شيء. راجع [العزل والقدرات](../docs/sandbox-and-capabilities.md).

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
