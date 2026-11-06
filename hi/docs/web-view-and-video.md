---
title: "वेब व्यू और वीडियो"
description: "WebView के साथ वेब पेज दिखाना और Video के साथ वीडियो चलाना - सोर्स, पेज और ऐप के बीच मैसेजिंग, नेविगेशन, प्लेबैक कंट्रोल, refs और capabilities।"
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# Web view और video

Web view और video player प्लैटफ़ॉर्म के अपने web engine और media player को सामान्य views के रूप में embed करते हैं: Rust में `web_view` और `video` (`nsh_core::prelude`), TSX में `nsh` से `WebView` और `Video`। NSH native views से render करता है, इसलिए ये आपके layout में किसी भी अन्य element की तरह रहते हैं: ये अपने parent के साथ scroll होते हैं, rounded corners और clipping स्वीकार करते हैं, और अन्य views layering की समस्या के बिना इन पर overlap हो सकते हैं।

| Component | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | WebKitGTK 6.0 का `WebKitWebView` | WebView2, एक child window में |
| `Video` | AVPlayerLayer; `controls` के साथ AVPlayerViewController | TextureView पर MediaPlayer; `controls` के साथ MediaController | AVPlayerLayer; `controls` के साथ AVKit का AVPlayerView | `GtkPicture` में GTK का media stream (GStreamer); `controls` के साथ `GtkVideo` | Media Foundation का media engine, frames Direct2D से बनाए जाते हैं; `controls` के साथ NSH का अपना control bar |

इनके पीछे के frameworks (WebKit, AVFoundation) तब लोड होते हैं जब कोई app पहली बार इनका उपयोग करता है, इसलिए जो apps कभी web page या video नहीं दिखाते, उन्हें launch पर इनकी कोई कीमत नहीं चुकानी पड़ती।

[macOS](./macos.md) पर web view का अपना कोई scroll view नहीं होता: `scrollable={false}` के साथ माउस व्हील और ट्रैकपैड पेज के बजाय उसके आसपास के app के scroll views को scroll करते हैं; पेज स्वयं अब भी अपने कीबोर्ड और अपनी scripts से scroll होता है।

[Linux](./linux.md) पर web view एक WebKitGTK पेज है जो अपने view के भीतर बनाया जाता है: उसके ऊपर NSH की सामग्री (dialog, sheet) उसे ढक लेती है, और उसके parents उसे clip करते हैं। `webview` capability वहाँ frames के navigations पर भी लागू होती है (जिस host को अनुमति नहीं है, उसका `iframe` खाली रहता है), और `scrollable: false` पेज को स्वयं scroll होने से रोकता है (उसके भीतर के elements फिर भी scroll होते हैं)। Apps के लिए WebKitGTK 6.0 इंस्टॉल होना आवश्यक है; उसके बिना बना runtime एक सादा placeholder दिखाता है। Videos वे formats चलाते हैं जिन्हें इंस्टॉल किए गए GStreamer plugins decode करते हैं; `rate` समर्थित नहीं है (वे 1× पर चलते हैं), और `onEnd` केवल उन videos के लिए आता है जो loop नहीं होते।

[Windows](./windows.md) पर web view एक child window में WebView2 control होता है जो अपने view का अनुसरण करता है: उसे उसके parents और rounded corners से clip किया जाता है, पर उसके ऊपर बनी NSH की सामग्री (dialog, sheet) उसके नीचे ही रहती है। इसके लिए WebView2 Runtime आवश्यक है (Windows 11 का हिस्सा; Windows 10 पर Edge के साथ इंस्टॉल होता है), अन्यथा यह एक placeholder दिखाता है; HTML के लिए `baseUrl`, `scrollable` और `allowsBackForwardNavigationGestures` समर्थित नहीं हैं। Videos सामान्य सामग्री हैं (किसी भी view की तरह clip, transform और cover किए जाते हैं) और वे formats चलाते हैं जिन्हें इंस्टॉल किए गए Media Foundation codecs decode करते हैं; `rate` काम करता है, कोई poster नहीं है, और `controls` चालू होने पर control bar हमेशा दिखता है।

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

### स्रोत

Web view `src` और `html` में से एक दिखाता है:

| Props | क्या दिखाता है |
|---|---|
| `src="https://…"` | एक web page। |
| `html="<!doctype html>…"` | एक string से HTML, जो `src` के बजाय दिखाया जाता है। |
| `baseUrl="https://example.com/"` के साथ `html` | ऐसा HTML जिसके relative URLs `baseUrl` के विरुद्ध resolve होते हैं। |

Rust में, `web_view(url)` एक page दिखाता है और `web_view_html(html, base_url)` HTML दिखाता है (`base_url` एक `Option<&str>`); URL और HTML एक signal या closure हो सकते हैं, जो उसके पढ़े गए मान बदलने पर page को फिर से load करता है। `src` या `html` बदलने से नया page load होता है।

### Props

Rust में हर prop snake case में एक builder method है (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injectedJavaScriptBeforeContentLoaded` के लिए `injected_java_script_before_content`, iOS के `allowsBackForwardNavigationGestures` के लिए `back_forward_gestures`) और हर event एक `on_…` method है (`on_navigation_state_change`) जिसका listener एक `WebNavigation` पाता है (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) या, `on_error` और `on_message` के लिए, एक `&str`।

| Prop | Type | Default | विवरण |
|---|---|---|---|
| `src` | `string` | | दिखाए जाने वाले page का URL। |
| `html` | `string` | | Inline HTML, जो `src` के बजाय दिखाया जाता है। |
| `baseUrl` | `string` | | `html` के relative URLs किसके विरुद्ध resolve होते हैं। |
| `injectedJavaScript` | `string` | | हर page के load होने के बाद चलता है। |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | हर page की अपनी scripts से पहले चलता है। |
| `javaScriptEnabled` | `boolean` | `true` | Pages scripts चलाते हैं। |
| `scrollable` | `boolean` | `true` | उपयोगकर्ता page को scroll कर सकता है। |
| `userAgent` | `string` | | Browser की user agent string। |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: page history में swipe करके पीछे और आगे जाएँ। |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: पीछे और आगे जाने के लिए trackpad पर दो उँगलियों से swipe करें; Windows: touchscreen पर swipe करें; Linux: touchpad पर swipe करें। |

Events:

| Event | Payload | कब |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | एक page का loading शुरू हुआ। |
| `onLoad` | `WebViewNavigation` | एक page का loading पूरा हुआ। |
| `onError` | `{ message }` | Loading विफल हुआ। |
| `onNavigationStateChange` | `WebViewNavigation` | URL, title, loading state या history बदली। |
| `onMessage` | `{ data: string }` | Page ने एक message post किया (नीचे)। |

`WebViewNavigation` `{ url, title, loading, canGoBack, canGoForward }` है।

<a id="a-browser-with-back-and-forward"></a>

### Back और forward वाला browser

Web view का ref (Rust में `.element_ref(&web)` से उस पर लगाया गया `element_ref()`, TSX में `ref`) में `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` और `send_input` / `sendInput(input)` हैं ([नीचे](#input-as-the-users-own)):

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

### Page और app के बीच messaging

Pages `window.nsh.postMessage(string)` से app से बात करते हैं, जो `on_message` (`onMessage`) के रूप में पहुँचता है। App ref के `post_message` (`postMessage(string)`) से page से बात करता है, जो page में `window` पर `message` event के रूप में पहुँचता है। Messages strings होते हैं; संरचित डेटा के लिए JSON भेजें।

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

Ref का `inject_java_script` (`injectJavaScript(script)`) किसी भी समय मौजूदा page में code चलाता है; `injected_java_script` और `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) हर page load पर, page की अपनी scripts से पहले या बाद में, चलते हैं, जो hooks इंस्टॉल करने की जगह है:

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

### उपयोगकर्ता के अपने input के रूप में input

`injectJavaScript` केवल synthetic events बना सकता है, जिन्हें page untrusted मानता है (`event.isTrusted` `false` होता है) और कुछ widgets उन्हें अनदेखा कर देते हैं। Ref का `send_input` (`sendInput(input)`) page को वैसा input देता है जैसा उपयोगकर्ता के अपने हाथ देते, इसलिए उसके events trusted होते हैं:

- `{ type: "click", x, y }` viewport के एक बिंदु पर click करता है, CSS pixels में (जो `getBoundingClientRect()` बताता है)।
- `{ type: "text", text }` page के focus वाले element में text टाइप करता है, एक बार में एक key: हर अक्षर US layout की उसकी key से, line break Enter के रूप में, और जो कोई US key टाइप नहीं करती (`é`, CJK, emoji) वह किसी key के बिना (`code` `"Unidentified"` होता है)।
- `{ type: "key", key }` `Enter`, `Tab`, `Escape` या `Backspace` दबाता है।

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

Rust में ये `WebInput::Click { x, y }`, `WebInput::Text(text)` और `WebInput::Key(WebKey::Enter)` हैं।

Trusted input में user activation होती है (यह windows खोल सकता है, clipboard में लिख सकता है, system का file panel खोल सकता है या किसी page का confirm बटन दबा सकता है), इसलिए यह अपने आप में एक अलग capability है: app को `nsh.json` के `capabilities` में `"webview": { "input": true }` चाहिए ([`webview`](./sandbox-and-capabilities.md#webview)), तब भी जब वह कोई capability घोषित नहीं करता, अन्यथा core call को छोड़ देता है।

Click की तरह, `sendInput` keyboard focus को app के अपने `Input` से हटाकर web view को दे देता है। Page input को अपनी गति से संभालता है: जब अगला call शुरू होता है तब भी किसी click के events रास्ते में हो सकते हैं, इसलिए उसके बाद टाइप करने से पहले click को थमने दें (लगभग एक frame)। macOS input पहुँचाता है; अन्य platforms अभी इसे अनदेखा करते हैं।

इस पर निर्भर कुछ भी देने से पहले पूछें कि क्या यह यहाँ काम करता है: `web_input_available()` (`WebView.inputAvailable()`) केवल वहीं `true` resolve होता है जहाँ platform input पहुँचाता है और app के पास `webview.input` है, इसलिए जो platforms call को अनदेखा करते हैं और जिन apps के पास grant नहीं है, उन पर यह `false` होता है।

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

### Web view कौन-सी sites दिखा सकता है

यदि आपका `nsh.json` `"capabilities"` घोषित करता है, तो web view केवल `webview` के अंतर्गत सूचीबद्ध hosts को दिखा सकता है और उन पर navigate कर सकता है:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

यह जाँच web view के `src` और page द्वारा किए गए हर top-level navigation (links, redirects, `location` बदलाव) को कवर करती है; इसका निर्णय native स्तर पर तब होता है जब platform पूछता है कि क्या navigation आगे बढ़ सकता है। Page के अपने subresources (scripts, images, frames) web content का अपना मामला हैं और उनकी जाँच नहीं की जाती। `*.example.com` केवल subdomains से मेल खाता है; bare domain के लिए `example.com` भी सूचीबद्ध करें। जिस app में `"capabilities"` key नहीं है वह कोई भी page दिखा सकता है। देखें [Sandbox and capabilities](./sandbox-and-capabilities.md)।

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

Playback props से नियंत्रित होता है: `paused`, `muted`, `volume` और `rate` को signals से सेट करें और player उनका अनुसरण करता है। Ref में `seek(seconds)` है।

Rust में, `video(url)` player बनाता है (URL एक मान, signal या closure) और हर prop snake case में एक builder method है (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (`objectFit` style), `progressUpdateInterval` के लिए `progress_interval`); `on_load` को एक `VideoInfo` मिलता है (`duration`, `size`), `on_progress` को एक `VideoProgress` (`current_time`, `duration`) और `on_buffer` को एक `bool`।

| Prop | Type | Default | विवरण |
|---|---|---|---|
| `src` | `string` | | Video का URL। |
| `paused` | `boolean` | `false` | Playback रुका हुआ है। |
| `muted` | `boolean` | `false` | कोई आवाज़ नहीं। |
| `volume` | `number` | `1` | 0..1। |
| `rate` | `number` | `1` | Playback की गति। |
| `repeat` | `boolean` | `false` | अंत पर शुरू से फिर चलता है। |
| `objectFit` (style), `object-*` classes | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | चित्र view में कैसे fit होता है, CSS के `object-fit` की तरह (`class="object-cover"`)। |
| `controls` | `boolean` | `false` | Platform के playback controls। |
| `progressUpdateInterval` | `number` | `250` | `onProgress` events के बीच मिलीसेकंड। |

| Event | Payload | कब |
|---|---|---|
| `onLoadStart` | | Loading शुरू हुआ। |
| `onLoad` | `{ duration, size }` | Video तैयार है: सेकंड में उसकी लंबाई और उसका आकार। |
| `onProgress` | `{ currentTime, duration }` | चलते समय, हर `progressUpdateInterval` ms पर। |
| `onBuffer` | `{ isBuffering }` | Playback डेटा की प्रतीक्षा में रुका, या फिर शुरू हुआ। |
| `onEnd` | | Playback अंत तक पहुँचा। |
| `onError` | `{ message }` | Loading या playback विफल हुआ। |

`controls` के साथ, platform अपना play बटन, scrubber और full-screen बटन खुद बनाता है। इसके बिना, video के ऊपर या नीचे views से अपने बनाएँ; चूँकि video आपके layout में एक native view है, overlays स्वाभाविक रूप से काम करते हैं:

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

Video sources network requests हैं: घोषित capabilities के साथ, video का host `nsh.json` में `network` के अंतर्गत अनुमत होना चाहिए, जैसा `fetch` और remote images के लिए होता है। अस्वीकृत source कुछ नहीं दिखाता, और अस्वीकृति एक बार log की जाती है, साथ में जोड़ने वाली key भी।

<a id="related"></a>

## संबंधित

- [`WebView`](../elements/web-view.md) और [`Video`](../elements/video.md): element references।
- [Sandbox and capabilities](./sandbox-and-capabilities.md): `webview` और `network` grants।
- [Native components](./native-components.md): आपके host app द्वारा दिए गए अन्य native views को embed करना।
