---
title: "WebView"
description: "WebView एलिमेंट: ऐप के अंदर वेब पेज और इनलाइन HTML दिखाने के लिए, दोनों दिशाओं में मैसेजिंग के साथ।"
order: 80
group: primitives
demo: el-web-view
source_hash: 455bf8f5d2ba5a4c
---

# WebView

वेब व्यू ऐप के अंदर कोई वेब पेज या आपके द्वारा दिया गया HTML दिखाता है: iOS और Mac Catalyst पर WKWebView, और Android पर `android.webkit.WebView`। क्योंकि NSH नेटिव व्यू के साथ रेंडर करता है, इसलिए वेब व्यू लेआउट में किसी भी अन्य व्यू की तरह अपने आसपास के व्यू के क्रम में रहता है। Rust में इसे `web_view(url)` या `web_view_html(html, base_url)` से बनाया जाता है, और TSX में `nsh` से `<WebView>` द्वारा।

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

TSX में वेब व्यू `src` और `html` में से एक लेता है (देखें [WebView API](../modules/nsh-webview.md))। [वेब व्यू और वीडियो गाइड](../docs/web-view-and-video.md) में मैसेजिंग पैटर्न और कैपेबिलिटी की जानकारी है।

## Props

वेब व्यू एक [व्यू](./view.md) के props लेता है (इसमें कोई चाइल्ड नहीं होता) और साथ में ये भी:

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `src` | `web_view(url)` | `string` | | दिखाए जाने वाले पेज का URL। |
| `html` | `web_view_html(html, base_url)`, `.html(html, base_url)` | `string` | | इनलाइन HTML, जो `src` की जगह दिखाया जाता है। |
| `baseUrl` | `web_view_html` / `.html` का `base_url` | `string` | | वह आधार जिसके विरुद्ध `html` के रिलेटिव लिंक हल किए जाते हैं। |
| `injectedJavaScript` | `.injected_java_script(..)` | `string` | | हर पेज लोड होने के बाद चलता है। |
| `injectedJavaScriptBeforeContentLoaded` | `.injected_java_script_before_content(..)` | `string` | | हर पेज की अपनी स्क्रिप्ट से पहले चलता है। |
| `userAgent` | `.user_agent(..)` | `string` | | ब्राउज़र की user agent स्ट्रिंग। |
| `javaScriptEnabled` | `.java_script_enabled(..)` | `boolean` | `true` | पेज स्क्रिप्ट चलाते हैं। |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | उपयोगकर्ता पेज को स्क्रॉल कर सकता है। |

| `ios` key | Rust | Type | विवरण |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | पीछे और आगे जाने के लिए किनारों से स्वाइप करें। |

| `desktop` key | Rust | Type | विवरण |
|---|---|---|---|
| `allowsBackForwardNavigationGestures` | `.back_forward_gestures(..)` | `boolean` | macOS: पीछे और आगे जाने के लिए ट्रैकपैड पर दो उंगलियों से स्वाइप करें; Windows: टचस्क्रीन पर स्वाइप करें; Linux: टचपैड पर स्वाइप करें। |

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | `WebViewNavigation` | कोई पेज लोड होना शुरू हुआ। |
| `onLoad` | `.on_load` | `WebViewNavigation` | कोई पेज लोड होना पूरा हुआ। |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, संदेश) | लोडिंग विफल रही; किसी पेज के लिए `code` का मान `"ERR_ACCESS_DENIED"` होता है, या `html` जिसकी अनुमति ऐप की कैपेबिलिटी नहीं देतीं। |
| `onNavigationStateChange` | `.on_navigation_state_change` | `WebViewNavigation` | URL, शीर्षक, लोडिंग की स्थिति या हिस्ट्री बदली। |
| `onMessage` | `.on_message` | `{ data: string }` (`&str`) | पेज ने `window.nsh.postMessage(data)` को कॉल किया। |
| `onDownload` | | `WebViewDownload` | कोई डाउनलोड शुरू हुआ, पूरा हुआ या विफल रहा (macOS)। |

`WebViewNavigation` का मान `{ url, title, loading, canGoBack, canGoForward }` है; Rust में `WebNavigation` के साथ `url`, `title`, `loading`, `can_go_back` और `can_go_forward` होते हैं।

`WebViewDownload` का मान `{ state, id, url, filename, path, bytes?, message? }` है: `state` का मान `"started"`, `"finished"` (फ़ाइल के `bytes` के साथ) या `"failed"` (इसके `message` के साथ) होता है। `onDownload` लिसनर होने पर, पेज जो कुछ डाउनलोड करता है (अटैचमेंट, ऐसा टाइप जिसे वेब व्यू नहीं दिखाता, या `download` लिंक) वह ऐप की डेटा डायरेक्टरी में `downloads/<id>/<filename>` के रूप में सहेजा जाता है, जहाँ `path` इंगित करता है, और ऐप उसे `fs/promises` से पढ़ता है।

macOS पर, लिसनर जोड़ने से `webview` कैपेबिलिटी द्वारा अनुमत कोई भी लोड किया गया पेज डाउनलोड अपने-आप सहेज सकता है। स्टोरेज बजट की ज़िम्मेदारी ऐप की है, और पूरी हो चुकी फ़ाइलों का उपयोग समाप्त होने पर उन्हें `downloads/` से हटाने की भी। वेब व्यू हटाने पर चल रहे डाउनलोड रद्द हो जाते हैं और उनकी अधूरी डायरेक्टरी हटा दी जाती हैं। डाउनलोड `onDownload` के माध्यम से रिपोर्ट होते हैं; किसी नेविगेशन को डाउनलोड में बदलने पर `onError` केवल वास्तविक नेविगेशन विफलताओं के लिए रखा जाता है। फ़ाइल नामों से कंट्रोल कैरेक्टर और द्विदिशीय फ़ॉर्मैटिंग कंट्रोल हटा दिए जाते हैं, और लंबे नाम 200 बाइट तक छोटे कर दिए जाते हैं, साथ ही जो एक्सटेंशन समा सके उसे सुरक्षित रखा जाता है।

## Ref methods

| Method | Rust | विवरण |
|---|---|---|
| `reload()` | `reload()` | पेज को रीलोड करता है। |
| `goBack()` / `goForward()` | `go_back()` / `go_forward()` | पेज की हिस्ट्री में आगे-पीछे जाता है। |
| `stopLoading()` | `stop_loading()` | लोडिंग रोकता है। |
| `injectJavaScript(script)` | `inject_java_script(script)` | पेज में JavaScript चलाता है। |
| `postMessage(data)` | `post_message(data)` | पेज को एक स्ट्रिंग भेजता है, जिसे `window` पर `message` इवेंट के रूप में प्राप्त होती है। |

## Messaging

ऐप और पेज स्ट्रिंग का आदान-प्रदान करते हैं। पेज `window.nsh.postMessage(data)` से पोस्ट करता है; ऐप ref के `postMessage(data)` (Rust में `post_message(..)`) से पोस्ट करता है। संरचित डेटा के लिए JSON भेजें।

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

## Capabilities

जब ऐप `nsh.json` में [कैपेबिलिटी](../docs/sandbox-and-capabilities.md) घोषित करता है, तो वेब व्यू `webview` के अंतर्गत सूचीबद्ध होस्ट ही दिखाता है और उन्हीं पर नेविगेट करता है। किसी अन्य होस्ट पर `src`, या `webview` के बिना ऐप में `html`, खाली व्यू दिखाता है; किसी अन्य होस्ट पर टॉप-लेवल नेविगेशन (उपयोगकर्ता द्वारा टैप किया गया लिंक) नेटिव स्तर पर रद्द कर दिया जाता है। हर स्थिति `code` `"ERR_ACCESS_DENIED"` के साथ `onError` रिपोर्ट करती है।

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

## Platform notes

- iOS पहली बार वेब व्यू बनने पर WebKit लोड करता है, इसलिए ऐप को इसकी कीमत तभी चुकानी पड़ती है जब वह वेब व्यू दिखाए।
- macOS पर `onDownload` डाउनलोड को WebKit के `WKDownload` से सहेजता है।
- Android पर पेज की `postMessage` कॉल बैकग्राउंड थ्रेड पर आती हैं और क्रम से ऐप को फ़ॉरवर्ड की जाती हैं।
- वेब व्यू के कोने गोल करने के लिए उसे कॉर्नर रेडियस और `overflow: "hidden"` (`.overflow_hidden()`) दें।
