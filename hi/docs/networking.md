---
title: "नेटवर्किंग"
description: "fetch के साथ HTTP - JSON, हेडर, FormData के साथ अपलोड, स्ट्रीमिंग रिस्पॉन्स और रिक्वेस्ट बॉडी, AbortController से रद्द करना, एरर, और वे नेटवर्क क्षमताएँ जिन्हें कोई ऐप घोषित करता है।"
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# नेटवर्किंग

NSH ऐप्स `fetch` से HTTP अनुरोध करते हैं: Rust में `nsh_core::prelude` का फ़ंक्शन, जिसे किसी task में await किया जाता है, और TSX में मानक ग्लोबल। दोनों प्लेटफ़ॉर्म के नेटवर्क स्टैक पर चलते हैं (iOS पर NSURLSession, Android पर HttpURLConnection, ब्राउज़र का [वेब पर](./web.md#apps-with-rust-components)), इसलिए अनुरोध सिस्टम के TLS, प्रॉक्सी और HTTP/2 का उपयोग करते हैं, और दोनों एक ही [capability जाँचों](#capabilities-which-hosts-an-app-may-reach) से गुज़रते हैं। Rust का `fetch` एक URL या `HttpRequest` लेता है और पूरा response देता है (`HttpResponse`: `status()`, `ok()`, `header(name)`, `text()`, `body`)। TSX का दोनों दिशाओं में स्ट्रीम करता है: response body स्ट्रीम के रूप में आती है, जैसे-जैसे नेटवर्क स्टैक उसे देता है, और request body भी स्ट्रीम हो सकती है, जो आपके बनाते ही भेजी जाती है। TSX में Fetch API के सहयोगी भी हैं: `Headers`, `Request`, `Response`, `AbortController`, `FormData`, `Blob`, `File`, `URL`, `URLSearchParams`, `TextEncoder` / `TextDecoder` और Web Streams।

<a id="getting-json"></a>

## JSON प्राप्त करना

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Post {
    id: u64,
    title: String,
}

fn parse(body: &str) -> Result<Vec<Post>, String> {
    let posts: Vec<serde_json::Value> = serde_json::from_str(body).map_err(|e| e.to_string())?;
    Ok(posts
        .iter()
        .map(|p| Post {
            id: p["id"].as_u64().unwrap_or_default(),
            title: p["title"].as_str().unwrap_or_default().to_owned(),
        })
        .collect())
}

#[component]
fn App() -> impl IntoElement {
    let posts = resource(
        || Some(()),
        |(), _| async move {
            let response = fetch("https://jsonplaceholder.typicode.com/posts?_limit=5").await?;
            if !response.ok() {
                return Err(format!("HTTP {}", response.status()));
            }
            parse(&response.text())
        },
    );
    scroll().flex_1().child(
        view()
            .p_4()
            .pt(px(60.0))
            .gap_2()
            .child(
                text(move || {
                    if posts.loading() { "loading…".to_owned() } else { posts.error().unwrap_or_default() }
                })
                .text_color(rgb(0x57606a)),
            )
            .child(each(
                move || posts.get().unwrap_or_default(),
                |post| post.id,
                |post, _| text(move || post.with(|p| p.title.clone())).number_of_lines(1),
            )),
    )
}
```

```tsx tabs
import { mount, resource, Scroll, Text, View } from "nsh";

type Post = { id: number; title: string };

function App() {
  const posts = resource(async ({ signal }) => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5", { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as Post[];
  });

  return (
    <Scroll style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingTop: 60, gap: 8 }}>
        <Text style={{ color: "#57606a" }}>{posts.loading() ? "loading…" : String(posts.error() ?? "")}</Text>
        <Each of={posts() ?? []}>{(post) => <Text style={{ numberOfLines: 1 }}>{post().title}</Text>}</Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

[`resource`](./reactivity.md#resource) मान, त्रुटि और यह स्थिति रखता है कि लोड चल रहा है या नहीं; बदलने वाले स्रोत से (या `refetch()` पर) दोबारा लोड करता है; और उस लोड को रद्द कर देता है जिसकी अब ज़रूरत नहीं (कॉम्पोनेंट हट गया, या नया लोड शुरू हुआ): Rust में लोड के task को drop करके, जिससे उसका अनुरोध रद्द हो जाता है, और TSX में उस `signal` के ज़रिए जो वह आगे देता है। Rust का `fetch` absolute URL लेता है; JSON को `serde_json` जैसे crate से parse किया जाता है।

TSX में, `Response` अपनी body एक बार पढ़ता है, `json()`, `text()`, `arrayBuffer()`, `bytes()`, `blob()` या `formData()` के रूप में, या `body` स्ट्रीम के रूप में। 2xx स्टेटस के लिए `response.ok` true होता है; ब्राउज़रों की तरह, HTTP त्रुटि स्टेटस promise को reject नहीं करता।

<a id="sending-data"></a>

## डेटा भेजना

```rust tabs
use nsh_core::prelude::*;

// JSON
let body = serde_json::json!({ "title": "Groceries", "items": ["milk", "eggs"] });
let created = fetch(
    HttpRequest::post("https://api.example.com/notes", body.to_string())
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {token}")),
)
.await?;

// A form, URL-encoded
fetch(
    HttpRequest::post("https://api.example.com/login", "user=ada&password=…")
        .header("Content-Type", "application/x-www-form-urlencoded"),
)
.await?;

// Other methods
fetch(HttpRequest::new("DELETE", "https://api.example.com/notes/1")).await?;
```

```tsx tabs
// JSON
const created = await fetch("https://api.example.com/notes", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ title: "Groceries", items: ["milk", "eggs"] }),
});

// A form, URL-encoded
await fetch("https://api.example.com/login", {
  method: "POST",
  body: new URLSearchParams({ user: "ada", password: "…" }),
});

// Query strings
const url = new URL("https://api.example.com/search");
url.searchParams.set("q", "native shell");
url.searchParams.set("page", "2");
const results = await (await fetch(url)).json();
```

`HttpRequest::new(method, url)`, `get` और `post` अनुरोध बनाते हैं, `.header(..)` और `.body(..)` उसे पूरा करते हैं। TSX में `body` एक string, `URLSearchParams`, `FormData`, एक `Blob` या `File`, एक `ArrayBuffer` या typed array, या एक `ReadableStream` स्वीकार करता है।

<a id="uploading-files-with-formdata"></a>

### FormData से फ़ाइलें अपलोड करना

TSX में, `FormData` body को उसकी boundary के साथ `multipart/form-data` के रूप में भेजा जाता है। NSH `FormData` body के लिए हमेशा यही content type सेट करता है, भले ही कोई लाइब्रेरी पहले डिफ़ॉल्ट `Content-Type` सेट कर दे, क्योंकि boundary के बिना सर्वर उसे parse नहीं कर सकता।

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### उपयोगकर्ता की चुनी हुई फ़ोटो अपलोड करना

[`Picker`](../modules/nsh.md#picker) उपयोगकर्ता की चुनी हुई फ़ोटो को फ़ाइलों के रूप में देता है, जिनके बाइट्स native रहते हैं, छोटे किए हुए और ऐसे फ़ॉर्मैट में जिसे सर्वर स्वीकार करते हैं; Rust उनके बाइट्स भेजता है, TSX `File` को `FormData` में जोड़ता है:

```rust tabs
use nsh_core::geometry::DevicePixels;
use nsh_core::picker::PickRequest;
use nsh_core::prelude::*;

let mut request = PickRequest::new(false, 1);
request.max_dimension = Some(DevicePixels(2048));
let picked = pick_images(request);
spawn(async move {
    if let Some(photo) = picked.await.into_iter().next() {
        let upload = HttpRequest::post("https://api.example.com/photos", photo.data.to_vec())
            .header("Content-Type", photo.mime.as_str());
        let _ = fetch(upload).await;
    }
});
```

```tsx tabs
import { Picker } from "nsh";

const [photo] = await Picker.pickImages({ maxDimension: 2048 });
if (photo) {
  const form = new FormData();
  form.append("photo", photo.file);
  await fetch("https://api.example.com/photos", { method: "POST", body: form });
}
```

<a id="streaming"></a>

## स्ट्रीमिंग

TSX का `fetch` responses और request bodies को स्ट्रीम करता है; Rust का पूरी body response के साथ देता है।

<a id="reading-a-response-as-it-arrives"></a>

### Response को आते-आते पढ़ना

`response.body` एक `ReadableStream<Uint8Array>` है जो नेटवर्क से बाइट्स आने के साथ भरता जाता है। प्रगति दिखाने या server-sent लाइनों को आते ही प्रोसेस करने के लिए उसे chunk-दर-chunk पढ़ें:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

टेक्स्ट स्ट्रीम `TextDecoderStream` से decode होती हैं, और `TransformStream` उन्हें लाइनों में बाँटता है:

```ts
const response = await fetch("https://api.example.com/events", { headers: { Accept: "text/event-stream" } });
let rest = "";
const lines = response
  .body!.pipeThrough(new TextDecoderStream())
  .pipeThrough(
    new TransformStream<string, string>({
      transform(chunk, controller) {
        const parts = (rest + chunk).split("\n");
        rest = parts.pop() ?? "";
        for (const line of parts) controller.enqueue(line);
      },
    }),
  );

for await (const line of lines) {
  if (line.startsWith("data: ")) messages.update((m) => [...m, line.slice(6)]);
}
```

Back pressure शुरू से अंत तक काम करता है: जब तक response का 1 MiB से अधिक हिस्सा बिना पढ़े पड़ा रहता है, अनुरोध नेटवर्क स्तर पर रुका रहता है, जब तक आपका कोड उसे पकड़ नहीं लेता।

<a id="streaming-a-request-body"></a>

### Request body को स्ट्रीम करना

`ReadableStream` body को chunk-दर-chunk भेजा जाता है, जैसे-जैसे नेटवर्क स्टैक माँगता है (chunked transfer)। Fetch मानक की आवश्यकता के अनुसार `duplex: "half"` पास करें:

```ts
const encoder = new TextEncoder();
const body = new ReadableStream<Uint8Array>({
  async start(controller) {
    for (const line of logLines) controller.enqueue(encoder.encode(line + "\n"));
    controller.close();
  },
});

await fetch("https://api.example.com/logs", { method: "POST", body, duplex: "half" });
```

स्ट्रीम की गई body को दो बार नहीं भेजा जा सकता, इसलिए स्ट्रीम किए गए अनुरोध का 307 या 308 redirect विफल हो जाता है।

<a id="cancelling-and-timeouts"></a>

## रद्द करना और टाइमआउट

Rust में अनुरोध एक task में चलता है और उसी के साथ रद्द होता है: जब task का कॉम्पोनेंट हट जाता है, या `spawn` जो task लौटाता है उस पर `cancel()` के साथ। TSX में, अनुरोध रद्द करने के लिए एक `AbortSignal` पास करें; promise signal के कारण के साथ reject होता है (डिफ़ॉल्ट रूप से एक `AbortError` `DOMException`), और जो body पढ़ी जा रही हो वह रुक जाती है।

```rust tabs
let task = spawn(async move {
    if let Ok(response) = fetch(format!("https://api.example.com/search?q={query}")).await {
        results.set(response.text());
    }
});

// Typing again: cancel the previous search.
task.cancel();
```

```tsx tabs
const controller = new AbortController();
const request = fetch("https://api.example.com/search?q=" + encodeURIComponent(query), { signal: controller.signal });

// Typing again: cancel the previous search.
controller.abort();
```

TSX में, `AbortSignal.timeout(ms)` ऐसा signal बनाता है जो देरी के बाद abort हो जाता है, और `AbortSignal.any([...])` signals को जोड़ता है:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

डेटा लोड करने वाले कॉम्पोनेंट को हटते समय रद्द करना चाहिए: Rust का task यह अपने आप करता है, और TSX [`cleanup`](./reactivity.md) में abort करता है:

```rust tabs
use nsh_core::prelude::*;

fn weather(city: String) -> impl IntoElement {
    let data = signal(String::new());
    // The task, and its request, end when the component goes away.
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/weather?city={city}")).await {
            data.set(response.text());
        }
    });
    text(move || data.get())
}
```

```tsx tabs
import { cleanup, signal, Text } from "nsh";

function Weather(props: { city: string }) {
  const data = signal<unknown>(null);
  const controller = new AbortController();
  cleanup(() => controller.abort());
  fetch(`https://api.example.com/weather?city=${encodeURIComponent(props.city)}`, { signal: controller.signal })
    .then((r) => r.json())
    .then((d) => data.set(d))
    .catch(() => {});
  return <Text>{JSON.stringify(data())}</Text>;
}
```

<a id="errors"></a>

## त्रुटियाँ

जो अनुरोध HTTP response नहीं देता वह विफल होता है: Rust का `fetch` संदेश के साथ एक `Err` देता है, TSX का एक `TypeError` के साथ reject होता है जिसका संदेश `Network request failed:` से शुरू होता है। ऐसा तब होता है जब कनेक्शन न हो, DNS या TLS विफल हो, URL scheme समर्थित न हो, या ऐसा अनुरोध हो जिसकी आपके ऐप की capabilities अनुमति नहीं देतीं। HTTP त्रुटियों के लिए `ok()` / `status()` (TSX: `response.ok`, `response.status`) जाँचें।

```rust tabs
match fetch(url).await {
    Ok(response) if response.ok() => items.set(response.text()),
    Ok(response) => error.set(format!("Server answered {}", response.status())),
    Err(message) => error.set(message), // no response, or not granted
}
```

```tsx tabs
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server answered ${response.status}`);
  return await response.json();
} catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") return; // cancelled
  showError(String(e));
}
```

<a id="from-rust-components"></a>

## Rust कॉम्पोनेंट्स से

Rust कॉम्पोनेंट्स, `#[module]` फ़ंक्शन और `#[class]` सदस्य किसी task से `fetch` कॉल करते हैं: कॉम्पोनेंट में `spawn`, UI में दिखाए जाने वाले मान के लिए `resource`, या TSX को एक्सपोर्ट किया गया `async fn`, जिसे TSX Promise के रूप में await करता है। अनुरोध एक URL या `HttpRequest` (`HttpRequest::get(url)`, `HttpRequest::post(url, body)`, `.header(name, value)`) होता है, और उसका response पूरा एक साथ आता है। Task अनुरोध का स्वामी है: उसे drop करने से, या उसे शुरू करने वाले कॉम्पोनेंट के हट जाने से, अनुरोध रद्द हो जाता है। यह हर प्लेटफ़ॉर्म पर और ब्राउज़र में, TSX जैसे ही नेटवर्क स्टैक और capability जाँचों का उपयोग करता है।

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## Capabilities: ऐप किन होस्ट तक पहुँच सकता है

ऐप `nsh.json` में घोषित कर सकता है कि वह किन होस्ट से बात करता है। `"capabilities"` मौजूद होते ही, जो सूचीबद्ध नहीं है वह सब अस्वीकृत हो जाता है:

```json
{
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [
        { "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }
      ]
    }
  }
}
```

| Key | विवरण |
|---|---|
| `network.hosts` | वे होस्ट जो किसी भी method से पहुँच योग्य हैं: `"*"` (कोई भी होस्ट), `"*.example.com"` (उसके सबडोमेन, `example.com` स्वयं नहीं) या कोई होस्ट नाम। |
| `network.http` | बारीक अनुमतियाँ: एक `host`, वैकल्पिक रूप से `methods`, `schemes`, एक `port`, सटीक `paths` और `pathPrefixes` तक सीमित। |

जाँचें NSH के runtime में, आपके ऐप के कोड के बाहर, अनुरोध के नेटवर्क तक पहुँचने से पहले लागू की जाती हैं:

- अस्वीकृत `fetch` विफल होता है (TSX में `TypeError` के साथ, जैसा हर विफल अनुरोध में होता है) और संदेश में वह key बताई जाती है जिसे जोड़ना है, जैसे ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``। TSX में त्रुटि का `code` `"ERR_ACCESS_DENIED"` होता है, उसका `permission` `"network"` और उसका `resource` वह URL जो अस्वीकृत हुआ (अनुरोध का, या किसी redirect का), ताकि ऐप अस्वीकृति को टूटे कनेक्शन से अलग पहचान सके:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **हर redirect की दोबारा जाँच होती है।** NSH redirects को प्लेटफ़ॉर्म पर छोड़ने के बजाय स्वयं फ़ॉलो करता है (अधिकतम 20), इसलिए अनुमति प्राप्त होस्ट आपके ऐप को किसी ऐसे होस्ट पर redirect नहीं कर सकता जिसे अनुमति नहीं है।
- वही `network` अनुमतियाँ दूरस्थ इमेज (canvases और `Image.getSize` / `prefetch` में भी) और वीडियो स्रोतों पर लागू होती हैं। आपके अपने bundle के `asset:` URI हमेशा अनुमत हैं।
- होस्ट अंतिम `@` के बाद से लिया जाता है, इसलिए `https://ok.com@evil.io` को `evil.io` माना जाता है।

`"capabilities"` के बिना ऐप हर होस्ट तक पहुँच सकता है: स्टैंडअलोन ऐप उसके डेवलपर का अपना होता है। होस्ट ऐप में एम्बेड किए गए या [signed packages](./signed-packages.md) के रूप में वितरित ऐप्स को इन्हें घोषित करना चाहिए; होस्ट ऐप ऐप की घोषणा से कम अनुमति दे सकता है, और अनुरोध को दोनों की अनुमति मिलनी चाहिए। `nsh dev` / `nsh run` के साथ डेवलपमेंट में भी वही capabilities लागू होती हैं। देखें [Sandbox और capabilities](./sandbox-and-capabilities.md)।

<a id="differences-from-browsers"></a>

## ब्राउज़रों से अंतर

TSX का `fetch` Fetch मानक का पालन करता है, उन अंतरों के साथ जो वेब पेज के बजाय ऐप के लिए उचित हैं:

- **CORS नहीं।** ऐप अपनी capabilities द्वारा अनुमत किसी भी होस्ट से बात करता है; कोई preflight अनुरोध और कोई opaque response नहीं होते।
- **कोई forbidden headers नहीं।** ऐप `Cookie`, `User-Agent`, `Origin` और अन्य सेट कर सकता है।
- **`redirect: "manual"`** opaque redirect के बजाय 3xx response स्वयं देता है (उसके `Location` header के साथ)। `redirect: "error"` redirect पर reject होता है।
- **`data:` और `blob:` URLs** का उत्तर स्थानीय रूप से दिया जाता है। `URL.createObjectURL(blob)` एक `blob:` URL बनाता है जिसे `fetch` तब तक पढ़ सकता है जब तक आप उसे revoke न करें।
- **`asset:/` URLs** वे फ़ाइलें हैं जो ऐप के साथ आती हैं, जिन्हें ऐप की अपनी फ़ाइलों से पढ़ा जाता है और किसी capability की आवश्यकता नहीं होती ([रन टाइम पर फ़ाइल पढ़ना](./images-and-assets.md#reading-a-file-at-run-time))।
- केवल-ब्राउज़र विकल्प (`mode`, `credentials`, `cache`, `referrer`, `integrity`, `keepalive`, `priority`) लाइब्रेरियों के साथ संगतता के लिए स्वीकार किए जाते हैं।

`fetch` पर बनी लाइब्रेरियाँ (और `AbortController`, `FormData` और स्ट्रीम्स पर बनी भी) आमतौर पर बिना बदलाव के काम करती हैं। कोई `XMLHttpRequest` नहीं है; native होस्ट ग्लोबल `WebSocket` और [`websocket` मॉड्यूल](../modules/standard-modules.md) देते हैं, जिन्हें `fetch` जैसी ही अनुमतियों के विरुद्ध जाँचा जाता है।

<a id="related"></a>

## संबंधित

- [Global APIs](../modules/globals.md): हर ग्लोबल, अपने सदस्यों के साथ।
- [Sandbox और capabilities](./sandbox-and-capabilities.md): capabilities, सीमाएँ और एम्बेड करने वाला ऐप उन्हें कैसे देता है।
- [इमेज और assets](./images-and-assets.md): दूरस्थ इमेज।
- [Lists](./lists.md#loading-more-onloadmore): किसी API से पेज-दर-पेज डेटा लेना।
