---
title: "WebView"
description: "WebView, एक नेटिव वेब पेज व्यू (WKWebView, android.webkit.WebView), इसके props, events और ref मेथड्स के साथ।"
order: 2.35
source_hash: 6ccdea7b98264f70
---

# WebView

`nsh` `WebView` को एक्सपोर्ट करता है: एक वेब पेज जिसे प्लेटफ़ॉर्म का अपना ब्राउज़र इंजन दिखाता है (iOS और Mac Catalyst पर `WKWebView`, Android पर `android.webkit.WebView`)। यह एक नेटिव व्यू है जिसका लेआउट किसी भी अन्य व्यू की तरह होता है, इसलिए यह स्क्रॉल, क्लिप और अन्य व्यू के साथ ओवरलैप सही ढंग से करता है।

```ts
import { WebView, type WebViewNavigation, type WebViewProps } from "nsh";
```

गाइड के लिए [Web view and video](../docs/web-view-and-video.md) और इसके props के लिए [`<WebView>`](../elements/web-view.md) देखें।

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

## Props

`WebView` [view props](../elements/view.md) (style, classes, layout, accessibility, `ref`; कोई children नहीं) लेता है, साथ ही:

| Prop | Type | Default | विवरण |
|---|---|---|---|
| `src` | `string` | | दिखाए जाने वाले पेज का URL। |
| `html` | `string` | | इनलाइन HTML, जो `src` की जगह दिखाया जाता है। |
| `baseUrl` | `string` | | `html` के रिलेटिव लिंक किसके आधार पर resolve होते हैं। |
| `injectedJavaScript` | `string` | | हर पेज लोड होने के बाद चलता है। |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | हर पेज की अपनी स्क्रिप्ट से पहले चलता है। |
| `userAgent` | `string` | प्लेटफ़ॉर्म का | user agent स्ट्रिंग। |
| `scrollable` | `boolean` | `true` | उपयोगकर्ता पेज को स्क्रॉल कर सकता है। |
| `javaScriptEnabled` | `boolean` | `true` | पेज स्क्रिप्ट चलाते हैं। |
| `ios` | `{ allowsBackForwardNavigationGestures?: boolean }` | | केवल iOS: पीछे और आगे जाने के लिए किनारों से स्वाइप करें। |
| `desktop` | `{ allowsBackForwardNavigationGestures?: boolean }` | | macOS: दो-उंगली ट्रैकपैड स्वाइप से पीछे और आगे जाया जाता है; Windows: टचस्क्रीन स्वाइप; Linux: टचपैड स्वाइप। |

## Events

| Event | Payload | कब |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | कोई पेज लोड होना शुरू होता है। |
| `onLoad` | `WebViewNavigation` | कोई पेज लोड होना पूरा करता है। |
| `onError` | `{ message: string }` | कोई पेज लोड होने में विफल रहता है। |
| `onNavigationStateChange` | `WebViewNavigation` | URL, शीर्षक, लोडिंग स्थिति या हिस्ट्री बदल गई। |
| `onMessage` | `{ data: string }` | पेज ने `window.nsh.postMessage(data)` को कॉल किया। |

```ts
interface WebViewNavigation {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}
```

## Ref methods

| Method | विवरण |
|---|---|
| `reload()` | पेज को रीलोड करता है। |
| `goBack()` | हिस्ट्री में पीछे जाता है। |
| `goForward()` | हिस्ट्री में आगे जाता है। |
| `stopLoading()` | लोडिंग रोक देता है। |
| `injectJavaScript(script)` | पेज में `script` चलाता है। |
| `postMessage(data)` | पेज को `data` (एक स्ट्रिंग) भेजता है: `window` पर एक `message` event, जिसमें `data` `event.data` के रूप में होता है। |

<a id="talking-to-the-page"></a>

## पेज से संवाद

पेज `window.nsh.postMessage(…)` के साथ ऐप को स्ट्रिंग भेजता है; ऐप `ref.postMessage(…)` के साथ पेज को स्ट्रिंग भेजता है। संरचित डेटा के लिए JSON भेजें।

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

## Capabilities

जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तो एक web view केवल `webview` के अंतर्गत सूचीबद्ध होस्ट ही दिखा सकता है और उन्हीं पर नेविगेट कर सकता है; अन्य top-level नेविगेशन नेटिव स्तर पर अस्वीकार कर दिए जाते हैं। जिस ऐप में `capabilities` key नहीं है, वह कुछ भी दिखा सकता है। [Sandbox and capabilities](../docs/sandbox-and-capabilities.md) देखें।

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```
