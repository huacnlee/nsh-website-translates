---
title: "الشبكات"
description: "HTTP باستخدام fetch - JSON، والترويسات، ورفع الملفات باستخدام FormData، وبث الاستجابات ومحتوى الطلبات، والإلغاء باستخدام AbortController، والأخطاء، وإمكانات الشبكة التي يعلنها التطبيق."
order: 46
group: ui
source_hash: 98ed5881a270c365
---

# الشبكات

تُجري تطبيقات NSH طلبات HTTP باستخدام `fetch`: في Rust عبر الدالة `nsh_core::prelude` التي يُنتظر ناتجها داخل مهمة (task)، وفي TSX عبر الدالة العامة القياسية. يعمل كلاهما فوق حزمة الشبكة الخاصة بالمنصة (NSURLSession على iOS، وHttpURLConnection على Android، وما يوفره المتصفح [على الويب](./web.md#apps-with-rust-components))، لذلك تستخدم الطلبات TLS والوكلاء (proxies) وHTTP/2 الخاصة بالنظام، ويمر كلاهما عبر [فحوصات القدرات](#capabilities-which-hosts-an-app-may-reach) نفسها. تقبل `fetch` في Rust عنوان URL أو `HttpRequest` وتعيد الاستجابة كاملة (`HttpResponse`: `status()`، `ok()`، `header(name)`، `text()`، `body`). أما في TSX فالبث يعمل في الاتجاهين: يصل جسم الاستجابة كتدفق (stream) كما تسلّمه حزمة الشبكة، ويمكن أن يكون جسم الطلب تدفقًا يُرسل أثناء إنتاجه. ويوفر TSX أيضًا ما يرافق Fetch API: `Headers`، `Request`، `Response`، `AbortController`، `FormData`، `Blob`، `File`، `URL`، `URLSearchParams`، `TextEncoder` / `TextDecoder` وWeb Streams.

<a id="getting-json"></a>

## الحصول على JSON

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

يحتفظ [`resource`](./reactivity.md#resource) بالقيمة والخطأ وحالة تشغيل التحميل، ويعيد التحميل عندما يتغير المصدر (أو عند `refetch()`)، ويلغي أي تحميل لم يعد مطلوبًا (عند زوال المكوّن أو بدء تحميل أحدث): في Rust بإسقاط مهمة التحميل مما يلغي طلبها، وفي TSX عبر `signal` الذي يمرّره. تقبل `fetch` في Rust عناوين URL مطلقة فقط؛ ويُحلَّل JSON بواسطة crate مثل `serde_json`.

في TSX، يقرأ `Response` جسمه مرة واحدة فقط، على هيئة `json()` أو `text()` أو `arrayBuffer()` أو `bytes()` أو `blob()` أو `formData()`، أو كتدفق `body`. تكون `response.ok` صحيحة (true) لحالات 2xx؛ وكما في المتصفحات، لا تؤدي حالة خطأ HTTP إلى رفض الـ promise.

<a id="sending-data"></a>

## إرسال البيانات

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

`HttpRequest::new(method, url)` و`get` و`post` تُنشئ طلبًا، و`.header(..)` و`.body(..)` تُكمله. في TSX، يقبل `body` سلسلة نصية أو `URLSearchParams` أو `FormData` أو `Blob` أو `File` أو `ArrayBuffer` أو مصفوفة مطبّعة (typed array) أو `ReadableStream`.

<a id="uploading-files-with-formdata"></a>

### رفع الملفات باستخدام FormData

في TSX، يُرسل جسم `FormData` بنوع `multipart/form-data` مع الحدّ الفاصل (boundary). يضبط NSH نوع المحتوى هذا دائمًا لجسم `FormData`، حتى لو ضبطت مكتبة `Content-Type` افتراضيًا أولًا، لأن الخادم لا يستطيع تحليل الجسم بدون الحدّ الفاصل.

```ts
const form = new FormData();
form.append("title", "Sunset");
form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "sunset.jpg");

const response = await fetch("https://api.example.com/photos", { method: "POST", body: form });
```

<a id="uploading-a-photo-the-user-picks"></a>

### رفع صورة يختارها المستخدم

يوفر [`Picker`](../modules/nsh.md#picker) الصور التي يختارها المستخدم كملفات تبقى بياناتها في الجانب الأصلي (native)، مصغّرة
وبصيغة تقبلها الخوادم؛ يرسل Rust بايتاتها، ويضيف TSX الكائن `File` إلى `FormData`:

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

## البث

يبث `fetch` في TSX الاستجابات وأجسام الطلبات؛ أما في Rust فيُعاد الجسم كاملًا مع الاستجابة.

<a id="reading-a-response-as-it-arrives"></a>

### قراءة الاستجابة أثناء وصولها

`response.body` هو `ReadableStream<Uint8Array>` يمتلئ كلما سلّمت الشبكة بايتات. اقرأه قطعة قطعة لعرض التقدم أو لمعالجة الأسطر المرسلة من الخادم (server-sent) فور وصولها:

```ts
const response = await fetch("https://api.example.com/large.csv");
const total = Number(response.headers.get("Content-Length") ?? 0);
let received = 0;

for await (const chunk of response.body!) {
  received += chunk.length;
  progress.set(total ? received / total : 0);
}
```

تُفكّ ترميز تدفقات النص باستخدام `TextDecoderStream`، ويقسمها `TransformStream` إلى أسطر:

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

يعمل الضغط العكسي (back pressure) من البداية إلى النهاية: عندما ينتظر أكثر من 1 MiB من الاستجابة دون قراءة، يُوقف الطلب مؤقتًا على مستوى الشبكة حتى يلحق الكود الخاص بك بالقراءة.

<a id="streaming-a-request-body"></a>

### بث جسم الطلب

يُرسل جسم `ReadableStream` قطعة قطعة كلما طلبته حزمة الشبكة (النقل المجزّأ، chunked transfer). مرّر `duplex: "half"` كما يشترط معيار Fetch:

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

لا يمكن إرسال جسم مبثوث مرتين، لذلك يفشل تحويل 307 أو 308 لطلب مبثوث.

<a id="cancelling-and-timeouts"></a>

## الإلغاء ومهلات الانتظار

في Rust، يعمل الطلب داخل مهمة ويُلغى معها: عند زوال مكوّن المهمة، أو باستخدام `cancel()` على المهمة التي تعيدها `spawn`. في TSX، مرّر `AbortSignal` لإلغاء الطلب؛ يُرفض الـ promise بسبب الإشارة (`AbortError` من نوع `DOMException` افتراضيًا)، ويتوقف أي جسم تجري قراءته.

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

في TSX، ينشئ `AbortSignal.timeout(ms)` إشارة تُجهض بعد مهلة، ويجمع `AbortSignal.any([...])` بين عدة إشارات:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
```

ينبغي للمكوّن الذي يحمّل بيانات أن يلغي عند زواله: مهمة Rust تفعل ذلك تلقائيًا، أما TSX فيُجهض في [`cleanup`](./reactivity.md):

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

## الأخطاء

يفشل الطلب الذي لا ينتج استجابة HTTP: تعيد `fetch` في Rust `Err` مع الرسالة، وفي TSX يُرفض الـ promise بـ `TypeError` تبدأ رسالته بـ `Network request failed:`. يحدث ذلك عند انعدام الاتصال، أو فشل DNS أو TLS، أو استخدام مخطط URL غير مدعوم، أو طلب لا تسمح به قدرات تطبيقك. تحقق من `ok()` / `status()` (في TSX: `response.ok`، `response.status`) لمعرفة أخطاء HTTP.

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

## من مكونات Rust

تستدعي مكونات Rust ودوال `#[module]` وأعضاء `#[class]` الدالة `fetch` من داخل مهمة: `spawn` في المكوّن، أو `resource` لقيمة تعرضها الواجهة، أو `async fn` مصدَّرة إلى TSX ينتظرها TSX كـ Promise. الطلب عبارة عن عنوان URL أو `HttpRequest` (`HttpRequest::get(url)`، `HttpRequest::post(url, body)`، `.header(name, value)`)، وتصل استجابته كاملة. تمتلك المهمة الطلب: إسقاطها، أو زوال المكوّن الذي أطلقها، يلغي الطلب. وتستخدم حزمة الشبكة وفحوصات القدرات نفسها المستخدمة في TSX، على كل المنصات وفي المتصفح.

<a id="capabilities-which-hosts-an-app-may-reach"></a>

## القدرات: المضيفات التي يجوز للتطبيق الوصول إليها

يمكن للتطبيق أن يصرّح في `nsh.json` بالمضيفات التي يتواصل معها. بمجرد وجود `"capabilities"`، يُرفض كل ما لم يُدرج:

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

| المفتاح | الوصف |
|---|---|
| `network.hosts` | المضيفات التي يمكن الوصول إليها بأي طريقة: `"*"` (أي مضيف)، أو `"*.example.com"` (نطاقاتها الفرعية، دون `example.com` نفسه) أو اسم مضيف. |
| `network.http` | منح أدق: `host`، ويمكن تقييده بـ `methods` و`schemes` و`port` و`paths` المطابق و`pathPrefixes`. |

تُفرض الفحوصات في بيئة تشغيل NSH، خارج كود تطبيقك، قبل أن يصل الطلب إلى الشبكة:

- يفشل `fetch` المرفوض (في TSX بـ `TypeError`، كأي طلب فاشل) مع رسالة تذكر المفتاح الذي يجب إضافته، مثل ``Network request failed: fetch GET https://evil.io/ is not granted: add `evil.io` to capabilities.network in nsh.json``. في TSX تكون قيمة `code` في الخطأ `"ERR_ACCESS_DENIED"`، وقيمة `permission` هي `"network"`، وقيمة `resource` هي عنوان URL المرفوض (عنوان الطلب أو عنوان تحويل)، فيستطيع التطبيق التمييز بين الرفض وانقطاع الاتصال:

  ```ts
  try {
    await fetch(url);
  } catch (error) {
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.resource}`);
    else throw error;
  }
  ```
- **يُفحص كل تحويل (redirect) من جديد.** يتبع NSH التحويلات بنفسه (حتى 20 تحويلًا) بدل ترك ذلك للمنصة، لذلك لا يستطيع مضيف مسموح أن يحوّل تطبيقك إلى مضيف غير مسموح.
- تغطي منح `network` نفسها الصور البعيدة (بما في ذلك داخل canvases و`Image.getSize` / `prefetch`) ومصادر الفيديو. أما عناوين `asset:` الخاصة بحزمة تطبيقك فهي مسموحة دائمًا.
- يُؤخذ المضيف بعد آخر `@`، لذلك يُحتسب `https://ok.com@evil.io` على أنه `evil.io`.

يمكن للتطبيق الذي لا يملك `"capabilities"` الوصول إلى كل المضيفات: فالتطبيق المستقل ملك مطوّره. أما التطبيقات المضمّنة في تطبيق مضيف أو الموزّعة كـ [حزم موقّعة](./signed-packages.md) فينبغي أن تصرّح بها؛ ويمكن للتطبيق المضيف أن يمنح أقل مما يصرّح به التطبيق، ويجب أن يسمح الطرفان بالطلب. ويفرض التطوير باستخدام `nsh dev` / `nsh run` القدرات نفسها. راجع [صندوق الحماية والقدرات](./sandbox-and-capabilities.md).

<a id="differences-from-browsers"></a>

## الاختلافات عن المتصفحات

يتبع `fetch` في TSX معيار Fetch مع الاختلافات المنطقية لتطبيق وليس لصفحة ويب:

- **لا CORS.** يتواصل التطبيق مع أي مضيف تسمح به قدراته؛ لا توجد طلبات تمهيدية (preflight) ولا استجابات معتمة (opaque).
- **لا ترويسات محظورة.** يمكن للتطبيق ضبط `Cookie` و`User-Agent` و`Origin` وغيرها.
- **`redirect: "manual"`** تعيد استجابة 3xx نفسها (مع ترويسة `Location`) بدل تحويل معتم. ويرفض `redirect: "error"` عند حدوث تحويل.
- **عناوين `data:` و`blob:`** تُجاب محليًا. ينشئ `URL.createObjectURL(blob)` عنوان `blob:` يستطيع `fetch` قراءته إلى أن تلغيه.
- **عناوين `asset:/`** هي الملفات التي يشحنها التطبيق، وتُقرأ من ملفات التطبيق نفسه دون الحاجة إلى أي قدرة ([قراءة ملف أثناء التشغيل](./images-and-assets.md#reading-a-file-at-run-time)).
- الخيارات الخاصة بالمتصفح فقط (`mode`، `credentials`، `cache`، `referrer`، `integrity`، `keepalive`، `priority`) مقبولة للتوافق مع المكتبات.

المكتبات المبنية على `fetch` (وعلى `AbortController` و`FormData` والتدفقات) تعمل عمومًا دون تعديل. لا يوجد `XMLHttpRequest`؛ فالمضيفات الأصلية توفر الدالة العامة `WebSocket` و[وحدة `websocket`](../modules/standard-modules.md)، وتُفحص وفق المنح نفسها المطبقة على `fetch`.

<a id="related"></a>

## ذات صلة

- [واجهات API العامة](../modules/globals.md): كل الدوال والكائنات العامة مع أعضائها.
- [صندوق الحماية والقدرات](./sandbox-and-capabilities.md): القدرات والحدود وكيف يمنحها التطبيق المضمِّن.
- [الصور والأصول](./images-and-assets.md): الصور البعيدة.
- [القوائم](./lists.md#loading-more-onloadmore): التنقل بين صفحات API.
