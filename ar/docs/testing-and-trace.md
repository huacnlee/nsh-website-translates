---
title: "الاختبار"
description: "اختبر التطبيقات بدون واجهة رسومية (headless)، في Rust باستخدام cargo test وnsh_testing أو في TypeScript باستخدام nsh test: افتح التطبيق، واضغط، واكتب، ومرّر، وانتظر كما يفعل المستخدم، واستبدل الشبكة والتخزين ببدائل وهمية (stubs)، واقرأ عمليات العرض الأصلية (native view operations) والتوقيتات التي يطبعها --trace؛ استخدم testID لاختبارات واجهة المستخدم."
order: 61
group: tools
source_hash: c0e7414002b92551
---

# الاختبار

يشغّل NSH التطبيقات **بدون واجهة (headless)**: المحرك الحقيقي نفسه (الرسم البياني التفاعلي نفسه، والمُصيِّر، والمكونات، والتخطيط، وvirtualization القوائم كما على الجهاز، مع QuickJS لـ TSX)، وبإطارات عرض بمعدل 60 هرتز، لكن بلا محاكٍ ولا جهاز ولا نافذة. يعمل في أي مكان يعمل فيه Cargo أو CLI، بما في ذلك أجهزة CI على Linux، ويؤدي مهمتين:

- يشغّل الاختبارات: يفتح كل اختبار التطبيق، وينفذ الخطوات التي يتخذها المستخدم (ضغط، كتابة، تمرير)، ويتحقق مما هو معروض على الشاشة. اختبارات تطبيق Rust مكتوبة بلغة Rust وتُشغَّل بواسطة `cargo test` مع حزمة `nsh-testing`؛ أما الاختبارات المكتوبة بـ TypeScript فتُشغَّل بواسطة `nsh test`، لتطبيقات TSX وتطبيقات Rust على حد سواء؛
- مع `--trace`، يطبع كل عملية يرسلها وقت التشغيل إلى الواجهات الأصلية، مع التوقيتات: كلفة الإطار الأول، أو النقرة، أو إطار من التمرير.

<a id="writing-tests"></a>

## كتابة الاختبارات

الاختبار نفسه بلغتي Rust وTypeScript: يفتح التطبيق بقائمة مهام فارغة في وحدة التخزين الخاصة به، ثم يكتب ويضغط ويتحقق مما تعرضه الشاشة.

```rust tabs
// tests/app/main.rs
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, MemoryStorage};

#[test]
fn adds_a_todo() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.storage = Some(MemoryStorage::new([("todos".to_owned(), "[]".to_owned())]));
    let mut app = Headless::start(config).unwrap();
    app.type_text("id:new-todo", "Buy milk").unwrap();
    app.press("text:Add").unwrap();
    app.wait_for("text:Buy milk").unwrap();
    assert!(app.screen().texts().contains(&"1 item left"));
}
```

```tsx tabs
// App.test.tsx
import { expect, open, test } from "nsh/test";

test("adds a todo", async () => {
  const app = await open("./App.tsx", { storage: { todos: "[]" } });
  await app.type("id:new-todo", "Buy milk");
  await app.press("text:Add");
  await app.waitFor("text:Buy milk");
  expect(app.texts()).toContain("1 item left");
});
```

<a id="tests-in-rust-with-cargo-test"></a>

## اختبارات Rust باستخدام cargo test

اختبارات تطبيق Rust هي اختبارات تكامل (integration tests) لحزمته، مع `nsh-engine` و`nsh-testing` (بميزاتها الافتراضية، بدون QuickJS) كاعتماديات تطوير (dev-dependencies):

```toml
[dev-dependencies]
nsh-engine = "0.1"
nsh-testing = "0.1"
```

```sh
cargo test                    # every test of the crate
cargo test adds_a_todo        # the tests whose name contains "adds_a_todo"
```

`EngineConfig::new(root)` هو محرك بحجم الهاتف (390×844 نقطة) دون أي إعداد آخر؛ وحقوله تضبط ما تضبطه خيارات `open` الواردة أدناه: `storage` (`MemoryStorage::new(entries)`)، `network` (`StubNetwork`، أدناه)، `viewport`، `environment` (المظهر، واللغة المحلية، وتقليل الحركة)، `clock` (`Clock::manual(time)`، أدناه). يبدأ `nsh_testing::Headless::start(config)` تشغيل التطبيق ويحتفظ بنموذج للواجهات التي يعرضها. خطواته هي خطوات `nsh test` الواردة أدناه، بالمحددات (selectors) نفسها، في Rust: `press`، `long_press`، `clear`، `type_text`، `submit`، `scroll(selector, px(3000.0))`، `back`، `wait`، `wait_for`، `wait_for_gone`، `wait_until`، `run_for`، `fast_forward`، `set_system_time`، `set_viewport`، `set_clipboard` و`on_dialog`؛ أما `app.shows(text)` و`app.screen()` (`texts()`، `count(selector)`، `enabled(selector)`، `dialogs()`، `clipboard()`، `commands()`) فتقرأ ما هو معروض على الشاشة. تُرجِع الخطوة خطأً يتضمن النصوص المعروضة على الشاشة إذا تعذّر تنفيذها.

يفتح `nsh_testing::tsx(entry, sets)` (الميزة `bundle`) نقطة دخول TSX الخاصة بالتطبيق بالطريقة نفسها، مبنيةً مقابل مجموعات واجهة المستخدم الخاصة بـ NSH وبالحزمة ([البناء باستخدام Rust](./rust.md#testing)). يختبر `examples/gallery-rs` جذره المكتوب بـ Rust بهذه الطريقة، بمعدل وحدة (module) لكل عرض توضيحي؛ ويختبر `examples/rust-exports` نقطة دخول TSX الخاصة به من Rust.

يشغّل `nsh test` هذه الاختبارات أيضًا: فعند إعطائه مجلد تطبيق يحتوي على حزم Rust (`nsh.json` `"rust"`)، يشغّل `cargo test` لكل حزمة فيه قبل ملفات الاختبار، ويعرض اختبارات Rust ويحسبها مع اختبارات TypeScript (`✓ src/lib.rs › tests::adds`)، في ملخصه وفي تقرير `--junit`. وهكذا يكون `nsh test` الأمر الواحد لتطبيق Rust، ولتطبيق TSX مع حزمة، ولتطبيق TSX وحده، ويشغّل `nsh check` كذلك `cargo check --all-targets` على الحزم قبل أن يفحص أنواع TypeScript.

<a id="tests-with-nsh-test"></a>

## الاختبارات باستخدام nsh test

ملف الاختبار هو ملف `*.test.tsx` أو `*.test.ts` بجوار شيفرتك. يستورد `nsh/test`، كما يفعل `App.test.tsx` أعلاه:

```sh
nsh test                      # every test file of the app in the current directory
nsh test App.test.tsx         # one file
nsh test --filter "adds"      # the tests whose name contains "adds"
```

```text
✓ App.test.tsx › adds a todo (84ms)
✗ App.test.tsx › keeps todos after a restart (312ms)
    expected ["Todos","0 items left"] to contain "1 item left"
    at <anonymous> (App.test.tsx:21:22)
    on screen: "Todos", "0 items left"
error 2 tests: 1 passed, 1 failed (0.9s)
```

يعرض الاختبار الفاشل ما أُلقي من أخطاء، ومكانه في ملف الاختبار، والنصوص المعروضة على شاشة التطبيق الذي فتحه. وأي فشل يجعل `nsh test` ينتهي برمز غير صفري. ينشئ `nsh init` الملف `App.test.tsx` مع التطبيق، ويفحص `nsh check` أنواع ملفات الاختبار مع بقية الملفات (`.nsh/types` يصرّح عن `nsh/test`).

يعمل كل ملف اختبار على محرك خاص به، وتعمل اختباراته واحدًا تلو الآخر بالترتيب. يبدأ `open` التطبيق على محرك آخر، جديد في كل مرة، فلا تتشارك الاختبارات أي حالة؛ وتُغلَق التطبيقات التي فتحها الاختبار عند انتهائه. يفشل الاختبار عندما يُلقي خطأً، أو عندما يُرفض الـ promise الذي يُرجِعه، وبعد انتهاء مهلته: 30 ثانية، أو عدد الميلي ثانية الذي يحدده الوسيط الثالث لـ `test` (`test("syncs", body, 60_000)`). أما التطبيق الذي يحتوي على حزم Rust خاصة به (`nsh.json` `"rust"`) فتعمل اختباراته في مشغّل headless يبنيه NSH معها، بالطريقة نفسها؛ وفي تطبيق Rust (`nsh.json` `"root"`، [البناء باستخدام Rust](./rust.md))، يبدأ `open(".")` المكوّن الجذر الخاص به.

<a id="grouping-tests-and-setting-them-up"></a>

### تجميع الاختبارات وإعدادها

تعمل `describe` والخطافات (hooks) وأشكال `test` كما في Jest:

```tsx
import { beforeEach, describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";

describe("the cart", () => {
  let app: App;
  beforeEach(async () => {
    app = await open("./App.tsx", { storage: { cart: "[]" } });
    await app.press("Cart");
  });

  test("starts empty", () => {
    expect(app.texts()).toContain("No items");
  });

  test.todo("applies a coupon");
});
```

| الدالة | الوصف |
|---|---|
| `describe(name, body)` | تجمّع الاختبارات والكتل التي يعلنها `body` (دفعة واحدة، عند تحميل الملف): تبدأ أسماؤها بـ `name` (`the cart › starts empty`)، ولا تعمل الخطافات التي يعلنها إلا حولها. يمكن تداخل الكتل. |
| `beforeEach(fn, timeout?)`، `afterEach(fn, timeout?)` | تشغّل `fn` قبل / بعد كل اختبار من الكتلة التي أُعلنت فيها (الملف، أو `describe`): `beforeEach` للكتل الخارجية أولًا، و`afterEach` للكتل الداخلية أولًا. `beforeEach` الذي يفشل يُفشل الاختبار؛ ويعمل `afterEach` في الحالتين. |
| `beforeAll(fn, timeout?)`، `afterAll(fn, timeout?)` | تشغّل `fn` مرة واحدة قبل أول اختبار وبعد آخر اختبار في كتلتها، عند تشغيل أحد اختباراتها. `beforeAll` الذي يفشل يُفشل اختبارات الكتلة؛ أما `afterAll` الذي يفشل فيُبلَّغ عنه على أنه `<block> › afterAll` فاشل. يبقى التطبيق الذي يفتحه `beforeAll` مفتوحًا لاختبارات الكتلة، ويُغلَق بعد `afterAll`. |
| `test.skip(name, body, timeout?)`، `describe.skip(name, body)` | تعلن اختبارًا، أو كتلة، لا تعمل اختباراتها: يُبلَّغ عنها على أنها متخطّاة. |
| `test.only(name, body, timeout?)`، `describe.only(name, body)` | ما دام في ملف الاختبار واحد منها، لا تعمل إلا تلك الاختبارات والكتل؛ ويُبلَّغ عن بقية اختبارات الملف على أنها متخطّاة. |
| `test.todo(name)` | اختبار لم يُكتب بعد، ويُبلَّغ عنه على هذا الأساس. |

قد يكون الخطاف `async`؛ وتبلغ `timeout` الخاصة به 30 ثانية ما لم تُحدَّد. تُعلَن الاختبارات والخطافات عند تحميل الملف: أي اختبار يُعلَن داخل اختبار أو خطاف يُلقي خطأً.

<a id="opening-the-app"></a>

### فتح التطبيق

يبني `open(entry, options?)` التطبيق الموجود في `entry` (نسبةً إلى ملف الاختبار؛ وتُبنى كل نقطة دخول مرة واحدة في كل تشغيل)، ويشغّله على viewport بحجم 390×844، ويُنجَز (resolve) بعد أن يُعرَض ويهدأ. مع `--target`، يعمل التطبيق بالخيارات كما يحددها الاختبار: أي خيار لا تستطيع منصة الهدف احترامه يجعل `open` يُرفَض بـ `ERR_NSH_TEST_UNSUPPORTED`، مع تسميته (انظر [على منصة حقيقية](#on-a-real-platform)).

| الخيار | القيمة الافتراضية | الوصف |
|---|---|---|
| `storage` | فارغ | ما يحتويه `Storage` عند البداية: `{ todos: "[]" }`. |
| `network` | لا شيء | ما تحصل عليه طلبات التطبيق، حسب المسار: انظر [محاكاة الشبكة](#stubbing-the-network). `"live"`: الشبكة الحقيقية، لطلباته وsockets وWebSockets. |
| `width`، `height` | 390، 844 | الـ viewport بالنقاط: في وضع headless، ونافذة أنظمة سطح المكتب، وصفحة الويب. على iOS وAndroid يملأ التطبيق شاشة الجهاز. |
| `safeArea` | 0 | هوامش المنطقة الآمنة بالنقاط: `{ top: 47, bottom: 34 }`. |
| `clipboard` | فارغ | النص الموجود في الحافظة عند البداية. |
| `colorScheme` | `"light"` | مظهر النظام: `"light"` أو `"dark"` (فئات `colorScheme()`، `dark:`). |
| `locale` | `"en-US"` | اللغة المحلية للجهاز، وسم BCP 47 (`locale()`، القيمة الافتراضية لـ `Intl`). |
| `reducedMotion` | `false` | طلب المستخدم حركة أقل (`reduceMotion()`). |
| `platform` | `"ios"` | المنصة التي يعمل عليها التطبيق في وضع headless: `"ios"`، `"android"`، أو منصة سطح مكتب، `"macos"`، `"windows"`، `"linux"`، أو `"web"` بأسلوب سطح المكتب (`platform.os`، خصائص `ios={{…}}` / `android={{…}}` / `desktop={{…}}`، واختصارات لوحة المفاتيح). مع `--target`، يعمل التطبيق على منصة الهدف: `platform` لسطح المكتب على أي سطح مكتب وعلى الويب، دائمًا بوصفه سطح مكتب (في المتصفح بأسلوب سطح المكتب عند أي عرض، مع بقاء `platform.os` على `"web"`)، أما `"ios"` و`"android"` فعلى منصتيهما. |
| `clock` | ساعة النظام | ساعة يدوية، لا يتحرك وقتها إلا بما يحرّكه الاختبار: `{}`، أو `{ time }` للبدء عند `Date` (أو بالميلي ثانية منذ حقبة Unix). انظر [التحكم بالوقت](#controlling-time). |
| `host` | لا شيء | دور التطبيق المضيف، الذي يؤديه الاختبار: `{ params, handlers }`. انظر [أداء دور التطبيق المضيف](#playing-the-host-app). |

<a id="playing-the-host-app"></a>

### أداء دور التطبيق المضيف

يتحدث التطبيق المضمَّن في تطبيق أصلي إليه عبر [`host`](../modules/nsh.md#host). وفي الاختبار، يؤدي الاختبار دور التطبيق المضيف: يعطي `host.params` معاملات الإطلاق التي يقرؤها التطبيق عند البدء، ويجيب `host.handlers` عن `host.call` التي يرسلها التطبيق ويستمع إلى `host.post`، بالاسم. المعالج (handler) إما قيمة تجيب عن كل استدعاء، أو دالة في بيانات الاستدعاء تُرجِع الإجابة (أو promise بها). وما تُلقيه الدالة من أخطاء يرفض الاستدعاء، كما يفعل خطأ التطبيق المضيف. أما استدعاء اسم لا يدرجه `handlers` فيفشل، كما يحدث في تطبيق مضيف لا يعالج أي شيء.

```tsx
const app = await open("./App.tsx", {
  host: {
    params: { conversation: "c-42" },
    handlers: {
      "user.profile": async ({ id }) => ({ id, name: "Ada" }),
      "feature.flags": { search: true },
      analytics: null,
    },
  },
});
await app.press("Profile");
expect(app.host.calls()).toEqual([{ name: "user.profile", data: { id: 7 } }]);
expect(app.host.posts()).toEqual([{ name: "analytics", data: { screen: "profile" } }]);
// The app's `host.on("conversation.open", …)` hears it.
await app.host.send("conversation.open", { id: "c-43" });
expect(app.shows("Conversation c-43")).toBe(true);
```

يرسل `app.host.send(name, data)` حدثًا، ثم ينتظر حتى يهدأ التطبيق. ويسرد `app.host.calls()` و`app.host.posts()` ما تلقّته المعالجات، بالترتيب: `name` و`data`.

تُسجَّل عناوين URL التي يفتحها التطبيق ([`openUrl`](../modules/nsh.md#openurl)، وروابط `TextView` مع `links="open"`) ويُبلَّغ التطبيق بأنها فُتحت، ولا يُفتح شيء على هذا الجهاز. ويسردها `app.openedUrls()`:

```tsx
await app.press("Contact us");
expect(app.openedUrls()).toEqual(["mailto:help@example.com"]);
```

<a id="stubbing-the-network"></a>

### محاكاة الشبكة

يسرد `network` المسارات حسب `"<METHOD> <URL>"` (عنوان URL مجرد يُعدّ `GET`؛ ويطابق `*` أي نص). الطلب الذي لا يطابقه أي مسار يفشل، فلا تصل الاختبارات إلى الشبكة دون طلب صريح. المسار إما استجابة، أو دالة في الطلب تُرجِع واحدة (أو promise بها)؛ وفي Rust يقبل `StubNetwork::new(routes)` المسارات نفسها، كل منها `StubResponse` أو `StubRoute::Handler`:

```rust tabs
use std::sync::Arc;
use nsh_engine::{EngineConfig, Root};
use nsh_testing::{Headless, StubNetwork, StubResponse};

#[test]
fn adds_a_todo_on_the_server() {
    let mut todos = StubResponse::default();
    todos.status = 200;
    todos.headers = vec![("content-type".to_owned(), "application/json".to_owned())];
    todos.body = br#"[{ "id": 1, "title": "Walk" }]"#.to_vec();
    let mut created = StubResponse::default();
    created.status = 201;
    let mut offline = StubResponse::default();
    offline.error = Some("offline".to_owned());
    let network = Arc::new(StubNetwork::new([
        ("GET https://api.example.com/todos".to_owned(), todos),
        ("POST https://api.example.com/todos".to_owned(), created),
        ("GET https://api.example.com/sync".to_owned(), offline),
    ]));
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    config.network = Some(network.clone());
    let mut app = Headless::start(config).unwrap();
    app.press("Add").unwrap();
    let methods: Vec<String> = network.requests().iter().map(|r| r.method.clone()).collect();
    assert_eq!(methods, ["GET", "POST"]);
}
```

```tsx tabs
const app = await open("./App.tsx", {
  network: {
    "GET https://api.example.com/todos": { body: [{ id: 1, title: "Walk" }] },
    "POST https://api.example.com/todos": (request) => ({ status: 201, body: JSON.parse(request.body!) }),
    "GET https://api.example.com/todos/*": { status: 404 },
    "GET https://api.example.com/sync": { error: "offline" },
    "GET https://api.example.com/slow": { body: "done", delay: 2000 },
  },
});
await app.press("Add");
expect(app.requests().map((r) => r.method)).toEqual(["GET", "POST"]);
```

| عضو الاستجابة | القيمة الافتراضية | الوصف |
|---|---|---|
| `status` | 200 | رمز الحالة. |
| `headers` | لا شيء | أسماء الترويسات وقيمها. |
| `body` | فارغ | نص، أو قيمة تُرسَل بصيغة JSON (مع `content-type: application/json` ما لم تحدد `headers` واحدًا). |
| `error` | لا شيء | يفشل الطلب بهذه الرسالة بدلًا من ذلك، كما لو كان الجهاز غير متصل بالإنترنت. |
| `delay` | 0 | المدة التي تستغرقها الاستجابة، بالميلي ثانية؛ لا تنتظرها الخطوة، أما `waitFor` فينتظرها. وعلى الساعة اليدوية، تصل الاستجابة عندما تتجاوز الساعة هذه المدة. |

تتلقى دالة المسار الطلب (`method`، `url`، `headers`، و`body` كنص) وتعمل داخل ملف الاختبار، فيمكنها عدّ الطلبات أو الإجابة بناءً على ما أعدّه الاختبار. والدالة التي تُلقي خطأً تُفشل الطلب والخطوة التي أحدثته. ويسرد `app.requests()` الطلبات التي أجراها التطبيق، بالترتيب، بالطريقة نفسها.

تبقى الاتصالات كذلك داخل الاختبار: لا تفتح sockets التطبيق (`net`) ولا WebSockets (`WebSocket` العام ووحدة `websocket`) أي اتصال ما لم يكن `network` هو `"live"`. وبعد فحوصات القدرات (capability checks) التي يجريها التطبيق نفسه، يُرفَض `net.connect` و`connect` الخاص بوحدة `websocket` بالخطأ `code` `ERR_NSH_TEST_NETWORK`، ويُطلِق `WebSocket` العام الحدث `error`، ثم `close` (1006، غير نظيف)، كما في اتصال رفضته الشبكة. ومع `"live"`، تتصل بالشبكة الحقيقية إلى جانب طلبات التطبيق. وفي Rust، يؤدي `EngineConfig::refuse_connections` الأمر نفسه لتطبيق `Headless`: دالة في الوجهة التي يتصل بها التطبيق (عنوان URL لـ WebSocket، أو `host:port` لـ socket) تُرجِع الخطأ الذي يفشل به استدعاؤه.

<a id="controlling-time"></a>

### التحكم بالوقت

على ساعة النظام، تستغرق مؤقتات التطبيق ورسومه المتحركة الأصلية الوقت نفسه الذي تستغرقه على الجهاز، وكذلك الاختبارات التي تنتظرها. أما مع الساعة اليدوية (`EngineConfig::clock` في Rust، و`clock` الخاص بـ `open` في TypeScript)، فيعمل التطبيق على ساعة لا يتحرك وقتها إلا بما يحرّكه الاختبار، وفورًا، كما في المؤقتات الوهمية في Jest أو `page.clock` في Playwright. `app.clock` هو تلك الساعة، و`null` عندما يعمل التطبيق على ساعة النظام:

```rust tabs
use std::time::{Duration, SystemTime};
use nsh_engine::{Clock, EngineConfig, Root};
use nsh_testing::Headless;

#[test]
fn autosaves() {
    let mut config = EngineConfig::new(Root::of::<my_app::App>());
    // 2026-01-01T09:00:00Z
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_767_258_000));
    let mut app = Headless::start(config).unwrap();
    app.type_text("label:Note", "Milk").unwrap();
    app.run_for(Duration::from_secs(10)).unwrap(); // the autosave, ten seconds later
    assert!(app.shows("Saved at 09:00:10"));
}
```

```tsx tabs
const app = await open("./App.tsx", { clock: { time: new Date("2026-01-01T09:00:00Z") } });
await app.type("label:Note", "Milk");
await app.clock!.runFor(10_000);           // the autosave, ten seconds later
expect(app.texts()).toContain("Saved at 09:00:10");
```

يتبع `StubNetwork` الذي لاستجاباته `delay` ساعةً يدوية مع `.with_clock(clock.clone())`. الخطوات أدناه هي خطوات `nsh test`؛ ولدى `Headless` كل واحدة منها (`run_for`، `fast_forward`، `set_system_time`).

| الخطوة | الوصف |
|---|---|
| `await app.clock.runFor(ms)` | تحرّك الساعة بمقدار `ms` ميلي ثانية، إطار عرض واحدًا في كل مرة. تعمل المؤقتات و`requestAnimationFrame` والرسوم المتحركة الأصلية والاستجابات المتأخرة عند حلول موعدها، بالترتيب، كلٌّ في وقته. تُنجَز (resolve) بعد أن يهدأ التطبيق. |
| `await app.clock.fastForward(ms)` | تحرّك الساعة بمقدار `ms` ميلي ثانية دفعة واحدة، كما يفعل جهاز يستيقظ من السكون: تعمل المؤقتات التي حل موعدها خلال ذلك مرة واحدة لكل منها. |
| `app.clock.setSystemTime(time)` | تضبط وقت الساعة الجدارية (`Date.now()`، `new Date()`) على `Date` أو على ميلي ثانية، دون تحريك أي مؤقت. |

تتبع `Date` و`performance.now()` والتاريخ الافتراضي لـ `Intl` الساعة. تُنهي الخطوات ما يعمل دون انتظاره: وما دام التطبيق يطلب إطارات أو تعمل رسوم متحركة أصلية، تأتي الإطارات واحدًا بعد آخر، كلٌّ بعد زمن إطار (1/60 ثانية) على الساعة. فانتقال مدته 300 ms يستغرق بضع ميلي ثوانٍ، ويعمل المؤقت الذي يحل موعده أثناءه. أما الرسوم المتحركة التي تتكرر إلى ما لا نهاية (كمؤشر الدوران) فتعمل مع الساعة: تدور كلما حرّك الاختبار الساعة. وتحرّك `app.wait(ms)` والضغطة المطوّلة الساعة بمقدار زمنهما. أما المؤقت الذي يحل موعده لاحقًا فلا يعمل إلا عندما يحرّك الاختبار الساعة إلى ذلك الموعد. وتحرّك `waitFor` و`waitUntil` الساعة أثناء انتظارهما، إطار عرض في كل مرة، وتنظران بعد كل إطار، فيظهر ما يعرضه المؤقت أثناء انتظارهما له في لحظات: يحرّك `waitFor("Saved", { timeout: 15_000 })` الساعة بما يصل إلى خمس عشرة ثانية. وتُحتسَب مهلتهما على الساعتين معًا: يحرّك الانتظار ساعة التطبيق بمقدارها كحد أقصى، ويُرفَض عندما يمضي مثلها من الوقت الحقيقي أيضًا، فيحصل ما يأتي من خارج التطبيق (دالة مسار، الشبكة) على الوقت نفسه الذي يحصل عليه على ساعة النظام. وتعمل اختبارات المعرض (gallery) بهذه الطريقة (`examples/gallery/tests`): فاختباراته الاثنا عشر التي تنتظر الرسوم المتحركة تستغرق 6 ثوانٍ بدلًا من 28 ثانية.
<a id="steps"></a>

### الخطوات

تسمّي الخطوات العروض (views) باستخدام **المحددات** (selectors)، وتُكتب كما في Playwright:

| المحدد | ما يطابقه |
|---|---|
| `id:<testID>` | العرض الذي يحمل `testID` هذا. |
| `label:<label>` | العرض الذي يحمل `accessibilityLabel` هذا. |
| `text:<text>` | نص يقرأ ما كُتب (بصرف النظر عن المسافات حوله)، أو مقطع من نص يستقبل الضغطات (`<Text onPress>` متداخل، أو رابط في `TextView`)، أو حقل إدخال يحتوي عليه، أو يحمل هذا النص المؤقت (placeholder) وهو فارغ. |
| `role:<role>`، `role:<role>[<name>]` | عرض بهذا `role` (`role:button`) وبهذا الاسم: تسميته التوضيحية (label)، وإلا النصوص الموجودة فيه (`role:button[Save]`). |
| `view:<id>` | العرض الذي يحمل هذا المعرّف في مخرجات `--trace`. |
| أي شيء آخر | `testID`، وإلا تسمية توضيحية، وإلا نص، كما كُتب. |

الجزء الذي يبدأ بكلمة بأحرف صغيرة يتبعها نقطتان رأسيتان يُعدّ بادئة (`id`، `label`، `role`، `text`، `view`)، ولذلك
يمثّل `tapped: solo` خطأ في الخطوة يسرد هذه البادئات. أما النص أو التسمية التوضيحية أو معرّف الاختبار الذي يبدأ بهذه الصيغة فيأخذ بادئته، وهي
تقرأ الباقي كما كُتب: `text:tapped: solo`، `label:note: draft`، `id:row:2`. تحتفظ المحددات بمعناها
عند إضافة بادئات جديدة.

يقبل `label:` و`text:` واسم الدور (role) تعبيرًا نمطيًا (regex) أيضًا: `text:/^Buy/i`، ويُكتب بصياغة حزمة `regex` في Rust
(فئات JavaScript ومجموعاتها ومرساتها ومكمّماتها، وتُطابَق في زمن خطي؛ والرايات `i` و`m` و`s`). يبحث ` >> `
داخل ما طابقه الجزء السابق (`id:cart >> role:button[Remove]`)، ويُبقي `nth=<n>` على إحدى المطابقات، بدءًا من 0
(`text:Delete >> nth=1`). يجد المحدد العروض التي يراها المستخدم أولًا: في النافذة المنبثقة العليا (modal)، ثم على الشاشة،
وفي حالة مكدس التنقل (navigation stack) الشاشة العليا فقط. ويطابق ما يراه المستخدم: العروض ذات المساحة، خارج `visibility: hidden`، داخل النافذة
والعروض التي تقتطعها (`overflow: hidden`)، أو في أي موضع من محتوى عرض تمرير (scroll view) يستطيع المستخدم تمريره، وهو ما
يجلبه التمرير (`opacity` والتحويلات مستثناة، كما في Playwright). الخطوة التي تؤثر في عرض (`press`، `type`، `clear`، `submit`، `scroll`، `longPress`) تحتاج إلى عرض
واحد بالضبط: المحدد الذي يطابق عدة عروض يُفشل الخطوة، وتوضح رسالة الخطأ كيفية تضييقه.

| الخطوة | الوصف |
|---|---|
| `await app.press(selector)` | يضغط على العرض، أو على أقرب عرض حوله يستقبل الضغطات (الزر الذي يحيط بنص): `onPressDown`، `onPressUp`، `onPress`، داخل إصبع ينزل ثم يرتفع، وتسمعه العروض المحيطة به التي تنصت إلى اللمسات (`onPressOutside` لطبقة علوية). يُضغط على مقطع من نص عند أحرفه (`await app.press("Privacy policy")`)، في وضع headless وعلى iOS وAndroid وأنظمة سطح المكتب. الضغطة الثانية على العرض نفسه خلال 500 مللي ثانية هي نقرته الثانية (`clicks: 2`، ضغطة مزدوجة)، كما تحسبها المنصات. يُرفض عندما يكون العرض معطّلًا. |
| `await app.longPress(selector)` | يُبقي إصبعًا عليه (أو على أقرب عرض حوله يستقبل الضغطات أو اللمسات) طوال `delayLongPress` (500 مللي ثانية): `onPressDown`، `onLongPress`، `onPressUp`؛ ولا يتبعه `onPress`. تسمع معالجات اللمسات الإصبع (تُفتح `ContextMenu` أو `Tooltip`). |
| `await app.clear(selector)` | يفرغ حقل الإدخال، كما يفعل تحديد الكل ثم الحذف. |
| `await app.type(selector, text)` | يكتب في حقل الإدخال (أو أول حقل إدخال داخل العرض؛ ويطابق `text:` أيضًا نص حقل الإدخال أو نصه المؤقت) في نهاية ما يحويه، مفتاحًا بمفتاح: يأخذ التركيز، ثم يكون كل حرف `onKeyPress` و`onChange`، خلال `maxLength`. ويمثّل `\n` في حقل إدخال أحادي السطر مفتاح الإرجاع. |
| `await app.submit(selector)` | مفتاح الإرجاع في حقل الإدخال، كما يحدده `submitBehavior`: `onSubmit` (ويغادر التركيز حقل الإدخال أحادي السطر)، أو فاصل سطر في حقل متعدد الأسطر. |
| `await app.scroll(selector, distance)` | يسحب عرض التمرير أو القائمة (العرض نفسه، أو العرض المحيط به، أو أول عرض بداخله) بمقدار `distance` نقطة على طول محوره، بمعدل 10 نقاط في كل إطار، ضمن محتواه، كما يستطيع المستخدم (`scrollable`). القيمة السالبة تمرّر إلى الخلف. |
| `await app.hover(selector)` | يحرك الفأرة فوق منتصف العرض: تسمع العروض التي تحتها والتي غادرتها `onMouseLeave`، وتلك التي مرّت فوقها `onMouseEnter` وتأخذ أنماط `hover:` الخاصة بها، وتسمع العروض المنصتة `onMouseMove` مع موضع الفأرة ودون ضغط أي زر. في أنظمة سطح المكتب والويب بأي عرض، بما في ذلك المتصفح في نمط الهاتف (في وضع headless: سطح مكتب أو `"web"` `platform`)؛ وليس لهاتف iOS أو Android فأرة: فيُرفض هناك. |
| `await app.rightClick(selector)` | زر الفأرة الثانوي فوق منتصف العرض: يسمع `onContextMenu` العرض نفسه أو أقرب عرض حوله منصت. في أنظمة سطح المكتب والويب (في وضع headless: سطح مكتب `platform`)؛ وليس للهاتف فأرة: فيُرفض هناك. |
| `await app.paste(selector, { text?, html?, files?, uris? })` | يلصق في حقل الإدخال كما يفعل المستخدم بما في الحافظة: يأخذ التركيز ويسمع `onPaste` (`html` المحتوى نفسه مع تنسيقه، و`files` مسارات يحصل على بايتاتها بوصفها `File`، و`uris` `file:` عناوين URL)، ثم يدخل نصه كما يحدده `pasteBehavior`. في وضع headless وعلى macOS وiOS والويب؛ وتبقى حافظة الجهاز كما كانت. |
| `app.menu()` | إجراءات قائمة السياق التي يعرضها التطبيق (`Menu.popup`): `label` (وتأتي إجراءات القائمة الفرعية بعد عنصرها، `"Share > Mail"`)، `disabled`، و`checked` للعنصر القابل للتأشير؛ و`null` عندما لا تكون أي قائمة مفتوحة. |
| `await app.chooseMenuItem(label)` | يختار إجراء قائمة السياق المفتوحة، كما تفعل النقرة عليه: يسمع التطبيق `onMenu` (فيعمل `onSelect` الخاص به)، ثم تُغلق القائمة. يُرفض عندما يكون العنصر معطّلًا أو مفقودًا. |
| `await app.closeMenu()` | يغلق قائمة السياق المفتوحة دون اختيار شيء، كما يفعل Escape. |
| `await app.keyboard.press(keys)` | يضغط مفتاحًا مع معدّلاته، كما يسميه `keymap` (`"mod+k"`، `"shift+/"`، `"escape"`؛ و`mod` هو مفتاح الأوامر الخاص بالمنصة)، على لوحة مفاتيح فعلية، على كل المنصات (للهواتف واللوحيات لوحة مفاتيح أيضًا): يسمعه اختصار التطبيق الخاص به (`keymap.bind`، `onKeyCommand`)، وإلا فعلى macOS والويب ينقل Tab وShift+Tab تركيز لوحة المفاتيح بين حقول الإدخال والعروض التي تستقبل الضغطات (أنماط `onFocus`، `onBlur`، `focus:`) ويضغط Return أو Space العرض الذي عليه التركيز، وإلا يأخذ حقل الإدخال المركَّز عليه حرفًا أو Backspace أو مفتاح الإرجاع، وإلا يعود Escape إلى الخلف. |
| `await app.keyboard.down(keys)` / `up(keys)` | يُبقي مفاتيح التعديل (`"mod"`، `"shift"`، `"alt"`، `"ctrl"`، `"meta"`، تُربط بـ`+`) مضغوطة حتى `up`: وتحملها الضغطات والسحبات والمرور بالفأرة خلال ذلك، كما تفعل نقرة Mod أو سحب Shift. في وضع headless وعلى Linux حاليًا. |
| `await app.dragAndHold(selector, by)` / `app.drop()` | يسحب كما يفعل `drag` ويُبقي الإصبع منخفضًا حتى `drop()`، الذي يرفعه حيث هو: وتنظر الخطوات بينهما إلى الشاشة أثناء السحب (معاينة السحب، خط الإفلات). في وضع headless وعلى Linux حاليًا. |
| `await app.dropFiles(selector, uris)` | يُفلت ملفات محلية (عناوين `file:` URL، كما يسحبها مدير الملفات) على منتصف العرض: يسمع `onFileDrop` العرض نفسه أو أقرب عرض حوله منصت. أنظمة سطح المكتب، ووضع headless، وعلى Linux حاليًا. |
| `await app.drag(selector, { x, y })` | يلمس إصبع منتصف العرض، ويستقر 100 مللي ثانية، ثم يتحرك بمقدار `x`، `y` نقطة، 10 في كل إطار، ثم يرتفع، كما تتلقاه مدخلات المنصة: تتبعه حركة سحب (pan) (`pan={{ x, y }}`، `onPanStart`، `onPanEnd` مع سرعة الإفلات)، وتسمعه العروض المنصتة للمسات (`onTouchStart`، `PanResponder`)، ويتمرر معه عرض التمرير، وإذا سُحب بعيدًا بما يكفي بعد أعلاه فإنه يحدّث المحتوى (`onRefresh`)، وتُلغى أي ضغطة تحته بمجرد ابتعاده. في أنظمة سطح المكتب والويب يكون ذلك بالفأرة. |
| `await app.wait(ms)` | يدع التطبيق يعمل مدة `ms` مللي ثانية: المؤقتات والرسوم المتحركة والطلبات. على ساعة يدوية، يحرّكها بمقدار `ms` (`app.clock.runFor`). |
| `await app.waitFor(selector, options?)` | يُنجَز عندما يطابق عرض ما، أو مع `{ state: "gone" }` عندما لا يطابق أي عرض؛ ويُرفض بعد `timeout` مللي ثانية (5000). على ساعة يدوية، يحرّكها إطار عرض واحدًا في كل مرة أثناء الانتظار، بمقدار `timeout` على الأكثر. |
| `await app.waitUntil(condition, options?)` | يُنجَز عندما يعيد `condition()` القيمة true، ويعيد النظر بعد كل تغيّر في التطبيق: لما لا يقوله أي محدد (`() => app.storage().note === "Milk"`). على ساعة يدوية، يحرّكها إطار عرض واحدًا بين نظرتين، بمقدار `timeout` على الأكثر. |
| `app.shows(selector)` | هل يطابق عرض الآن. |
| `app.count(selector)` | كم عرضًا يطابق الآن. |
| `app.enabled(selector)` | هل يقبل العرض الإدخال: لا هو ولا أي عرض حوله معطّل، وحقل الإدخال ليس `readonly`. |
| `app.texts()` | النصوص الظاهرة على الشاشة الآن، بالترتيب. |
| `app.value(selector)` | نص حقل الإدخال، و`null` عندما لا يطابق أي حقل. |
| `app.spanStyle(selector)` | النمط المحلول لأول حرف مطابق، في وضع headless وعلى كل `--target`: `color`، و`backgroundColor` الاختياري، و`fontSize`، و`fontWeight`، و`italic`، و`underline`، و`lineThrough`. الألوان `#rrggbbaa`؛ والأحجام بالنقاط. |
| `app.storage()` | ما يحويه تخزين التطبيق الآن. |
| `await app.back()` | يعود إلى الخلف كما يفعل المستخدم (زر الرجوع في الترويسة، أو سحب ورقة سفلية للأسفل): يُخرج المكدس الأعمق في أحدث نافذة منبثقة، وإلا في الشاشة، شاشته العليا (`onDismiss`)، أو يسألها (`onBackRequest`) عندما يكون لها `preventBack`؛ وبدونها تطلب أحدث نافذة منبثقة الإغلاق (`onRequestClose`). يُرفض عندما لا يوجد ما يُعاد منه. |
| `app.onDialog(handler)` | يجيب عن مربعات الحوار التي يعرضها التطبيق من الآن فصاعدًا (`Alert.alert`، وأوراق الإجراءات): يتلقى `handler` مربع الحوار (`title`، `message`، `buttons`، `cancelable`، `sheet`) ويعيد نص الزر المراد ضغطه، أو `null` لإغلاقه دون اختيار. |
| `app.dialogs()` | مربعات الحوار التي عرضها التطبيق، بالترتيب. |
| `app.onPick(handler)` | يجيب عن طلبات الاختيار التي يطلبها التطبيق من الآن فصاعدًا (`Picker.pickImages`): يتلقى `handler` ما يطلبه الاختيار (`multiple`، `limit`، `maxDimension`، `quality`، `format`) ويعيد الملفات التي يختارها المستخدم (`{ name, type?, data: Uint8Array }`، وتُعطى للتطبيق كما هي)، أو `null` للإلغاء. وبدون معالج تُلغى طلبات الاختيار. في تشغيلات headless. |
| `app.picks()` | طلبات الاختيار التي طلبها التطبيق، بالترتيب. |
| `app.hear(text)` | يقول المستخدم `text` في جلسة الكلام الجارية (`Speech.start`): ويبلّغ `result` الخاص بها عن `text` بوصفه النص الكامل حتى الآن. في تشغيلات headless. |
| `app.endSpeech(error?)` | ينهي جلسة الكلام الجارية: مع `error` (`"no-speech"`، `"network"`، ...) تفشل، وإلا تأتي نتيجة نهائية أخيرة و`end`، و`no-speech` عندما لا يُسمع شيء. في تشغيلات headless. |
| `app.speechRequests()` | جلسات الكلام التي بدأها التطبيق، بالترتيب: `lang` (`null` للمستخدم) و`interim`. |
| `app.clipboard()` | النص الموجود في الحافظة الآن، و`null` عندما لا تحوي شيئًا. |
| `app.requests()` | الطلبات التي أجراها التطبيق، بالترتيب: `method`، `url`، `headers`، `body`. |
| `await app.host.send(name, data?)` | يرسل حدثًا من التطبيق المضيف إلى التطبيق (`host.on`)، ثم ينتظر حتى يهدأ. انظر [Playing the host app](#playing-the-host-app). |
| `app.host.calls()`، `app.host.posts()` | استدعاءات التطبيق ورسائله التي تلقاها `host.handlers` الخاص بـ`open`، بالترتيب: `name`، `data`. |
| `app.openedUrls()` | عناوين URL التي فتحها التطبيق (`openUrl`)، بالترتيب: تُسجَّل ولا تُفتح أبدًا. |
| `await app.setViewport(width, height)` | يغيّر حجم منفذ العرض (viewport)، كما يفعل تدوير الجهاز أو تغيير حجم نافذة (`windowSize()`). |
| `await app.setColorScheme(scheme)` | يبدّل مظهر النظام إلى `"light"` أو `"dark"`، كما يفعل المستخدم. |
| `await app.setLifecycle(state)` | ينقل التطبيق إلى `"background"` أو `"inactive"` أو `"active"`، كما يفعل النظام عندما يغادره المستخدم، أو ينتقل إلى تطبيق أو نافذة أخرى ثم يعود (`lifecycle()`). في تشغيلات headless فقط. |
| `await app.screenshot(path?)` | صورة لنافذة التطبيق بصيغة PNG (`Uint8Array`)، وتُحفظ أيضًا في `path` على هذا الجهاز عند تحديده (نسبةً إلى المجلد الحالي). لا ترسم التطبيق إلا منصة حقيقية: انظر [On a real platform](#on-a-real-platform). |

تُنجَز الخطوة عندما لا يرسم التطبيق شيئًا مدة 100 مللي ثانية ولا تعمل أي رسوم متحركة أصلية تنتهي من تلقاء نفسها (2 ثانية
على الأكثر، للتطبيقات التي ترسم طوال الوقت؛ وعلى ساعة يدوية، تُحتسب أيضًا 2 ثانية من وقت التطبيق)، فيكون ما غيّرته
على الشاشة عند تشغيل السطر التالي؛ استخدم `waitFor` لما يأتي لاحقًا (استجابة، مؤقت). وعلى ساعة يدوية لا تنتظر الخطوة
تلك الـ100 مللي ثانية: بل تُنجَز بمجرد أن ينفذ التطبيق كل ما استحقّته الخطوة ووقت الساعة
(المؤقتات المستحقة الآن، والوعود (promises)، والاستجابة الوهمية (stubbed) التي تُجاب فورًا) ولا يطلب إطارًا، ما لم يكن طلب ما زال
قيد التنفيذ، ولذلك تعمل الاختبارات على ساعة يدوية دون توقفات بين خطواتها. أما ما يجيب عنه خيط آخر (استدعاء
`nsh/host`، وقراءة ملف، وعمل مهمة Rust على خيط) فيصل بعد إنجاز الخطوة: `waitFor` ما
يعرضه. والرسوم المتحركة التي تتكرر
إلى ما لا نهاية، مثل مؤشر التحميل الدوّار، تواصل العمل في الخلفية بينما تمضي الخطوات و`waitFor`، كما تفعل
رسوم CSS المتحركة اللانهائية في اختبارات المتصفح. وتُرفض الخطوة، فيفشل الاختبار، عندما لا يطابق محددها شيء (يسرد الخطأ النصوص الظاهرة على
الشاشة)، وعندما يطلق التطبيق استثناءً في هذه الأثناء، وعندما يطلب التطبيق ما لا تجيب عنه إلا منصة حقيقية.

تحمل حالات الفشل التي يجوز للاختبار توقعها `code`، وهو يبقى كما هو؛ أما رسائلها فللبشر وقد تتغير، ولذلك
يطابق الاختبار الرمز:

| `code` | الخطوة أو الاستعلام |
|---|---|
| `ERR_NSH_TEST_NOT_FOUND` | لا شيء على الشاشة يطابق المحدد، أو ليس في القائمة المفتوحة مثل هذا العنصر. |
| `ERR_NSH_TEST_DISABLED` | العرض الذي يسميه المحدد معطّل (عرض تمرير لا يستطيع المستخدم تمريره، أو عنصر قائمة معطّل). |
| `ETIMEDOUT` | انتهت مهلة `waitFor` أو `waitUntil`، أو لم يرسم التطبيق شيئًا بعد `open`. |
| `ERR_NSH_TEST_NO_BACK` | لم يجد `back()` شيئًا يُعاد منه. |
| `ERR_NSH_TEST_UNSUPPORTED` | أُعطي `open` مع `--target` خيارًا لا تستطيع منصة الهدف تلبيته: `width` أو `height` على iOS وAndroid، أو `platform` الخاص بهاتف على سطح مكتب أو الويب، أو الخاص بسطح مكتب أو بالهاتف الآخر على iOS أو Android، `host.handlers`. وتسميه الرسالة. |

```tsx
await expect(app.press("Pay")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
```

يقرأ `app.spanStyle("id:guide")` `<Text testID="guide">` متداخلًا؛ ويقرأ `text:word` أول حرف
من تلك المطابقة. حدّد نطاق الاستعلامات بـ`id:note >> text:word` واختر المطابقات المتكررة بـ`>> nth=0`.
يبلّغ الاستعلام عن خطأ عند وجود مقطع مفقود أو ملتبس أو فارغ. ويعيد تحديث `testID` المقطع استخدام تخطيط نصه
ويحافظ على عدد استدعاءات `onTextLayout`.
<a id="what-headless-runs-play-of-the-platform"></a>

### ما الذي تؤديه عمليات التشغيل بدون واجهة (headless) من دور المنصة

تملك عملية التشغيل بدون واجهة بيئة التشغيل الحقيقية ولا تملك منصة. وهي تؤدي دور المنصة الذي يحدده بروتوكول NSH، ولا تؤدي أي شيء لا تستطيع فعله إلا منصة حقيقية:

- **تعمل الرسوم المتحركة الأصلية** إطارًا بإطار حتى نهايتها: تُنفَّذ استدعاءات `start(callback)` ويُنفَّذ معها ما ينتظرها. أما الحلقات التي لا نهاية لها فتعمل حتى يوقفها التطبيق.
- **الرجوع** يُخرج الشاشات ويغلق النوافذ المنبثقة (modals) كما تفعل المنصة (`app.back()`).
- **يُجاب عن مربعات الحوار**: عبر `onDialog` الخاص بالاختبار، وإلا بزر الإلغاء فيها، وإلا تُغلق إن أمكن إغلاقها؛ أما مربع الحوار الذي لا تجيب عنه إلا أزراره الأخرى فيفشل الخطوة التي عرضته إلى أن يحدد الاختبار أي زر يُضغط.
- **تحتفظ الحافظة بالنص**: ما ينسخه التطبيق يُقرأ عند اللصق (`clipboard` للبدء بنص ما).
- **يجيب مضيف الصفحة عن `host`** عندما يسمّي `nsh.json` الخاص بالتطبيق مضيفًا في `web.host` ([مضيف الصفحة](#the-pages-host)).
- **يعمل التطبيق ضمن صلاحياته**: ما يعلنه `nsh.json` في `capabilities` يُفرض كما على الجهاز، فما لم يُعلن عنه يُرفض.
- **تُسجَّل عناوين URL**: ما يفتحه التطبيق يُبلَّغ عنه على أنه فُتح، ويسرده `app.openedUrls()`.
- **يُجاب عن عمليات الاختيار**: بملفات الاختبار (`onPick`)، وإلا تُلغى، فيُحسم `Picker.pickImages` إلى `[]`.
- **الكلام من الاختبار**: يُحسم `Speech.available()` إلى `true`، وتبدأ الجلسة فورًا وتسمع ما يقوله `hear`.
- **تظهر النوافذ المنبثقة فورًا**: يأتي `onShow` عند عرض واحدة منها.
- **لا تُحمَّل الصور**: لا يأتي `onLoad` ولا `onError`، ويُرفض `Image.getSize` و`Image.prefetch`.
- **ما لا تجيب عنه إلا منصة حقيقية يُفشل الخطوة**: صورة أو ملفات في الحافظة.

<a id="the-pages-host"></a>

### مضيف الصفحة

يحصل التطبيق المنشور على الويب على مضيفه من صفحته: `nsh.json` `web.host`، وهي وحدة تصدّر `createHost(player)` ([Web](./web.md#the-hosts-functions)). تحمّل عمليات التشغيل بدون واجهة هذه الوحدة لكل تطبيق يفتحه الاختبار، قبل بدء التطبيق، في سياق JavaScript خاص بها (المؤقّتات و`console`، ولا شيء من المتصفح، ولا استيراد): يجيب `call` الخاص بها عن [`host.call`](../modules/nsh.md#host) الخاص بالتطبيق، ويصل `player.hostEvent` إلى `host.on`، ويكون `host.available()` هو `true`. إذا رمى `call` خطأً، أو رُفض، أو أعاد ما ليس JSON، رُفض استدعاء التطبيق برسالته كما في الصفحة، وتصل الأحداث المرسلة قبل بدء التطبيق إلى مستمعيه في المستوى الأعلى متى بدأ. يسمّي `--web-host <module>` وحدة أخرى. يجب أن يسرد `capabilities.host` الخاص بالتطبيق ما يستدعيه، كما في الصفحة. تعمل مهلة الاستدعاء ومؤقّتات المضيف نفسه على وقت التطبيق، فتحرّكها ساعة يدوية (`app.clock.runFor`). في المتصفح (`--target web`) تشغّل صفحة التطوير `web.host` الخاص بـ`nsh.json` لكل تطبيق كما تفعل الصفحة المنشورة؛ وعلى المنصات الأخرى (`--target`) لا مضيف للتطبيقات: `host.available()` هو `false`.

```tsx
// nsh.json: { "capabilities": { "host": ["echo"] }, "web": { "host": "./host.js" } }
import { open, test } from "nsh/test";

test("calls reach the page's host", async () => {
  const app = await open("./App.tsx");
  await app.press("label:call");
  await app.waitFor('text:{"n":1}');
});
```

يضم `examples/host-echo` تطبيقًا ومضيفه واختباراتهما.

<a id="expectations"></a>

### التوقعات

يفحص `expect(value)` القيم كما يفعل Jest، كما صنعتها JS: `toBe` هو `Object.is`، ويقارن `toEqual` عضوًا بعضو، وتُقارَن `Date` أو `Map` أو `Uint8Array` على حقيقتها. يرمي كل فحص خطأً حين لا يصح. ويعكسها `.not`: `expect(app.texts()).not.toContain("Error")`. إذا أُعطي دالة، يفحص `toThrow` ما يرميه استدعاؤها؛ وإذا أُعطي وعدًا (promise)، أو دالة تعيد وعدًا، يفحص `rejects` و`resolves` ما ينتهي إليه، كما في Jest: `await expect(save()).rejects.toMatchObject({ code: "ERR_ACCESS_DENIED" })`.

| الفحص | يصح عندما |
|---|---|
| `toBe(expected)` | تكون القيمة هي `expected` كما يحدد `Object.is`: القيمة الأولية نفسها (`NaN` هي `NaN`، و`0` ليست `-0`) أو الكائن نفسه. |
| `toEqual(expected)` | تساوي القيمة `expected` عضوًا بعضو، كما يفعل `toEqual` في Jest: الكائنات بخصائصها القابلة للعدّ الخاصة بها (الخاصية التي قيمتها `undefined` تُعدّ مفقودة)، والمصفوفات عنصرًا عنصرًا، والتواريخ بوقتها، والتعابير النمطية بالمصدر والرايات، والخرائط (maps) والمجموعات (sets) بمدخلاتها بأي ترتيب، و`ArrayBuffer` والمصفوفات المصنّفة (typed arrays) ببايتاتها، والأخطاء بالاسم والرسالة؛ `NaN` تساوي `NaN`. نسخة من فئة (class) تساوي كائنًا عاديًا له خصائصها. |
| `toMatchObject(subset)` | تحوي القيمة كل خاصية في `subset`، وكل منها مساوية كما يحدد `toEqual`، وتتطابق الكائنات داخلها بدورها؛ ولا يُنظر إلى الخصائص الأخرى، وتتطابق المصفوفات عنصرًا عنصرًا، بكل عناصرها. |
| `toContain(item)` | تحوي مصفوفة أو `Set` أو مصفوفة مصنّفة أو أي كائن آخر قابل للتكرار `item` (`===`)، أو تحتويه سلسلة نصية. |
| `toContainEqual(item)` | تحوي مصفوفة أو `Set` أو أي كائن آخر قابل للتكرار عنصرًا مساويًا لـ`item` كما يحدد `toEqual`. |
| `toBeTruthy()`، `toBeFalsy()` | تكون القيمة صادقة (truthy) / كاذبة (falsy)، كما تراها JS. |
| `toMatch(pattern)` | تحتوي سلسلة نصية `pattern` (سلسلة نصية)، أو تطابقه (`RegExp` يشغّله محرك JS: تعمل النظرة الخلفية (look-behind) والمراجع الخلفية والمجموعات المسماة كما في JavaScript). |
| `toHaveLength(n)` | يكون `length` الخاص بالقيمة هو `n`: وحدات UTF-16 للسلسلة النصية، أو عناصر المصفوفة أو المصفوفة المصنّفة. |
| `toBeNull()` | تكون القيمة `null`. |
| `toBeUndefined()`، `toBeDefined()` | تكون القيمة `undefined` / أي شيء آخر. |
| `toBeNaN()` | تكون القيمة `NaN`. |
| `toBeGreaterThan(n)`، `toBeGreaterThanOrEqual(n)`، `toBeLessThan(n)`، `toBeLessThanOrEqual(n)` | يقارن الرقم بـ`n` على هذا النحو. |
| `toThrow(expected?)` | `expect(fn)`: استدعاء `fn` يرمي خطأً. وإذا أُعطي `expected` طابقه الخطأ: تحتوي رسالته سلسلة نصية أو تطابق `RegExp`؛ وفئة الخطأ (`TypeError` أو فئة من فئات التطبيق) هي `name` الخاص بالخطأ، ويطابق `Error` كل خطأ؛ أو يكون للخطأ الرسالة نفسها. |
| `rejects.toThrow(expected?)` | `expect(promise)`: يُرفض الوعد بخطأ يطابق `expected` كما يحدد `toThrow`. |
| `rejects.toMatchObject(subset)` | `expect(promise)`: يُرفض الوعد بقيمة تطابق `subset` كما يحدد `toMatchObject`: الخصائص الخاصة بالخطأ (`code`، `permission`، ...) مع `name` و`message`. |
| `resolves.toBe(expected)`، `resolves.toEqual(expected)`، `resolves.toMatchObject(subset)` | `expect(promise)`: يُحسم الوعد إلى قيمة تحقق الفحص. |

يذكر الفحص الفاشل ما حصل عليه وما توقعه، مكتوبًا كما ستكتبه JS: `expected Date(2024-01-02T00:00:00.000Z) to equal Date(2024-01-01T00:00:00.000Z)`.

ولكل من `rejects` و`resolves` أيضًا `.not` خاص به: `await expect(load()).resolves.not.toBe(null)`.

<a id="on-a-real-platform"></a>

### على منصة حقيقية

يشغّل `nsh test --target macos` (أو `linux` أو `windows` أو `gpui` أو `web` أو `ios` أو `android`) الاختبارات نفسها على مضيف التطوير الخاص بالمنصة بدل التشغيل بدون واجهة: يبدأ كل `open` التطبيق في نافذة خاصة به، مع مجلد بيانات جديد، وتعمل الخطوات بإدخال المنصة نفسه على العناصر التي تسميها محدداتها (selectors)، كما يفعل Playwright في المتصفح:

- الضغط نقرة في منتصف العنصر، والضغط المطوّل نقرة مستمرة، و`type` ينقر حقل الإدخال ويكتب مفاتيحه، و`scroll` إيماءة على لوحة التتبع فوق عنصر التمرير، و`back` هو ما يفعله المستخدم (Escape على macOS وLinux، وزر الرجوع في الفأرة على Windows وفي GPUI، وزر الرجوع في المتصفح على الويب، وسحب الورقة السفلية إلى الأسفل، وإيماءة الهروب في VoiceOver أثناء فتح قائمة أو نافذة منبثقة صغيرة أو `Sheet`، وإلا زر الرجوع في الترويسة على iOS، وزر الرجوع على Android)؛
- يُمرَّر العنصر الخارج عن الشاشة إلى مجال الرؤية أولًا، إيماءة بعد أخرى؛ وعلى الشاشة اللمسية يحطّ الإصبع حيث تأخذه الصفحة نفسها، بجانب العناصر التي تتبع السحب (شريط تمرير، ومنطقة رسم)، كما يمرّر المستخدم؛
- ترى المحددات وعمليات الانتظار والاستعلامات النموذج نفسه للتطبيق الذي تراه عمليات التشغيل بدون واجهة، المبني مما يرسمه المضيف، فتجد العناصر نفسها؛
- مربعات الحوار هي مربعات المنصة نفسها: يقرؤها `app.dialogs()`، والإجابة عن أحدها (`onDialog`، أو زر الإلغاء فيه عندما لا يقول الاختبار شيئًا) تضغط زرّه؛
- `app.screenshot(path)` يلتقط صورة للنافذة.

```sh
nsh test --target macos                       # the app's tests in macOS windows
nsh test --target linux                       # in GTK windows (xvfb-run -a … on a machine without a display)
nsh test --target windows                     # in Win32 windows
nsh test --target ios                         # in an iOS simulator
nsh test --target android                     # on the Android device or emulator adb lists first
nsh test --target gpui                        # in GPUI windows (macOS, Windows, Linux)
nsh test --target web                         # in a headless Chrome, Edge or Chromium
nsh test tests/form.test.tsx --target macos   # one file
```

تُفتح النافذة بحجم منفذ العرض (viewport) (390 × 844 ما لم يحدد `open` غير ذلك)، ضمن الشاشة؛ وعلى iOS وAndroid يملأ التطبيق شاشة الجهاز بحجمها. يعمل التطبيق على أنه منصة الهدف (`platform.os`). ويعمل `clock` اليدوي كما يعمل بدون واجهة: `app.clock.runFor` و`fastForward` و`setSystemTime` تحرّك وقت التطبيق فورًا (المؤقّتات، و`requestAnimationFrame` على بُعد إطار واحد، و`Date`)، وكذلك `app.wait(ms)` و`waitFor` و`waitUntil`، وكل إطار تعرضه المنصة يحرّكه إطارًا واحدًا (1/60 ث)، فيمرّ وقت التطبيق أثناء تحريكه. أما الرسوم المتحركة الخاصة بالمنصة، و`delay` الخاص بالمسار (route)، فتستغرق وقتًا حقيقيًا. تصل طلبات التطبيق إلى الاختبار كما تصل بدون واجهة: مسارات `network` تجيب عنها، والطلب الذي لا يطابقه أي مسار يفشل، و`"live"` يمرّرها إلى شبكة المضيف؛ ويسردها `app.requests()` جميعًا. تتصل المقابس (Sockets) وWebSockets بشبكة المضيف مع `"live"`، وتُرفض كما في التشغيل بدون واجهة بخلاف ذلك. `storage` موجود في تخزين التطبيق عند بدئه، و`app.storage()` يقرؤه من التطبيق. `locale` و`reducedMotion` و`safeArea`، عندما يعطيها `open` (بما في ذلك القيمة الافتراضية)، تحمل ما تبلّغ عنه المنصة، وأي `colorScheme` يعطيه يبدّل مظهر النظام (و`"light"` أيضًا)؛ وما يتركه خارجًا فهو للمنصة، وتُخدَّم استدعاءات الحافظة الخاصة بالتطبيق من حافظة الاختبار نفسها (`clipboard` هو نصها في البداية، و`app.clipboard()` يقرؤها)، فتبقى حافظة الجهاز على حالها؛ أما النسخ واللصق في حقل إدخال نصي فيستخدمان حافظة النظام. `host.params` يصل إلى التطبيق، و`app.host.send` يرسل الأحداث، وتُسجَّل عناوين URL التي يفتحها التطبيق من أجل `app.openedUrls()` بدل أن تُفتح. `host.handlers` يعمل بدون واجهة، حيث يجيب الاختبار عن استدعاءات التطبيق. `open` يتحقق من خياراته مقابل الهدف: `width` و`height` على iOS وAndroid، و`platform` لنوع آخر من الأجهزة (هاتف على سطح مكتب أو على الويب، أو سطح مكتب أو الهاتف الآخر على iOS أو Android) و`host.handlers` ترفض بـ`ERR_NSH_TEST_UNSUPPORTED`، فيعمل الاختبار كما كُتب أو يقول ما يحتاجه. `platform` لسطح المكتب (`"macos"` لفأرة سطح المكتب ومفاتيحه) يعمل على كل هدف سطح مكتب وعلى الويب، على أنه منصة ذلك الهدف ودائمًا كسطح مكتب: في المتصفح تبدأ الصفحة بنمط سطح المكتب مهما كان عرضها، بينما بدون `platform` (أو مع `"web"`) تقيس نمطها كما يفعل المتصفح (سطح مكتب من عرض 600 نقطة). يعمل التطبيق الذي له حزم Rust (crates) خاصة به في مضيف تطوير مبني مع حزمه، ويبنيه NSH للمنصة؛ ومضيف تطبيق Rust يشغّل جذره، فيبدؤه `open(".")` هناك كما يفعل بدون واجهة.

على الويب، تعمل التطبيقات في صفحة مضيف التطوير داخل Chrome أو Edge أو Chromium بدون واجهة: المثبّت على هذا الجهاز، أو الملف التنفيذي الذي يسميه `--browser <PATH>` (المتصفح مطلوب: يذكر `nsh test` أين بحث عندما لا يجد شيئًا). يخدم متصفح واحد التشغيل كله، ويحصل كل `open` على صفحة بتخزين خاص بها. والإدخال هو إدخال المتصفح الموثوق، كما للمستخدم: نقرات الفأرة، والتمرير بعجلة الفأرة، والمفاتيح.

على iOS، تعمل التطبيقات في مضيف التطوير داخل محاكي iOS: المحاكي المشغَّل، وإلا أحدث iPhone، الذي يشغّله `nsh test`. الخطوات هي لمسات إصبع وكتابة لوحة المفاتيح البرمجية، كما يتلقاها UIKit من الجهاز. يبدّل `setColorScheme` مظهر المحاكي، ويعيده `nsh test` إلى حاله بعد التطبيق، وتكون للشاشة أبعاد الجهاز المحاكى.

على Android، تعمل التطبيقات في مضيف التطوير على أول جهاز أو محاكٍ يسرده `adb devices`، بتخزين خاص بها. الخطوات هي لمسات إصبع ومفاتيح لوحة مفاتيح، كما تتلقاها عناصر التطبيق من الجهاز؛ و`back` هو زر الرجوع في النظام. يبدّل `setColorScheme` المظهر الداكن للجهاز، ويعيده `nsh test` إلى حاله بعد التطبيق.

<a id="steps-from-standard-input"></a>

### خطوات من الإدخال القياسي

عند إعطائه مدخل التطبيق بدل الاختبارات، يفتح `nsh test` التطبيق على الشبكة الحقيقية، ويتركه يعمل 1.2 ثانية، ثم ينفّذ الخطوات التي يعطيها الإدخال القياسي، مع `app` التطبيق:

```sh
echo 'await app.press("text:+1"); expect(app.texts()).toContain("1");' | nsh test App.tsx
```

تتيح الثواني 1.2 تشغيل جمع المهملات (garbage collection) في وقت الخمول للمحرك قبل الخطوة الأولى، فيظهر ذلك في أي تطبيق يتخلى عما لا يزال يستخدمه: تتوقف معالجاته عن العمل.

للأمثلة اختبارات يمكن البدء منها: `examples/gallery-rs` لتطبيق Rust (`cargo test`، وحدة واحدة لكل عرض توضيحي، و`App.test.tsx`)، و`examples/rust-exports` لتطبيق له حزمة Rust، و`examples/counter` و`examples/gallery/tests` (التخزين، والمدخلات، وقائمة طويلة، والطلبات المستبدلة، والوضع الداكن، وساعة يدوية) لتطبيقات TSX.

<a id="tracing-with---trace"></a>

## التتبع باستخدام --trace

يطبع `--trace` كل دفعة تركيب (mount batch) للتطبيقات التي تفتحها الاختبارات، تحت الخطوة التي جاءت فيها، ووقت كل commit. في Rust يطبع الاختبار الشيء نفسه: يسلّمه `observe` كل دفعة مع خطوتها، ويسجّل `EngineConfig::trace` أسطر `perf` عبر حزمة `log` (الهدف `nsh::perf`؛ ثبّت مسجِّلًا مثل `env_logger` في الاختبار):

```rust
let mut config = EngineConfig::new(Root::of::<my_app::App>());
config.trace = true;
let mut app = Headless::start(config).unwrap();
app.observe(|step, batch| nsh_testing::print_batch(&mut std::io::stdout(), step, batch));
app.press("Add").unwrap();
```

يقبل `nsh test` الخيار `--trace` على ملف اختبار، أو على مدخل التطبيق مع الخطوات في الإدخال القياسي:

```sh
nsh test App.test.tsx --trace
nsh test App.tsx --trace                                   # the first frame, then 1.2 s idle
echo 'await app.press("Add")' | nsh test App.tsx --trace    # and a press
echo 'await app.press("Add")' | nsh test App.tsx --trace --target ios   # the same in an iOS simulator
```

مع `--target` يكون التتبع هو تتبع المنصة: الدفعات التي طبّقها المضيف، تحت الخطوات التي جاءت بها، والتوقيتات التي يقيسها المضيف نفسه لكل commit وحدث، على عتاد الجهاز.

استخدمه من أجل:

- التحقق من أن تطبيقًا (أو عرضًا توضيحيًا) يُبنى ويُقيَّم ويُعرض دون أخطاء؛
- رؤية العناصر الأصلية التي ينشئها تغيير ما أو ينقلها أو يحدّثها بالضبط، وكم عددها؛
- قياس كلفة الإطار الأول، والنقرة، وكل إطار تمرير؛
- اكتشاف التراجعات في CI.
<a id="reading-the-output"></a>

### قراءة المخرجات

فيما يلي مثال العدّاد (counter) مع ضغطة واحدة (`echo 'await app.press("+1")' | nsh test examples/counter/App.tsx
--trace`)، بعد اختصاره:

```text
✓ bundled App.tsx (3255 B in 6.2 ms)
perf commit: 56 ops, 271µs (list js 5µs), 49 mount items, 21 nodes
perf first frame: eval 187µs, total 820µs
── open(App.tsx): 49 items
   LayoutDirection { rtl: false }
   Create { id: 2, kind: View }
   Create { id: 4, kind: Text }
   Insert { parent: 2, child: 4, before: None }
   ...
   Frame { id: 2, x: 0, y: 0, w: 390, h: 844 }
   Frame { id: 4, x: 24, y: 64, w: 342, h: 34 }
   ...
   Text { id: 4, text: "nsh counter", content: 342x34 @ 0,0 }
   Text { id: 14, text: "0", content: 36x77 @ 0,0 }
perf event Press on view 26
perf event js: 413µs
perf commit: 10 ops, 672µs (list js 7µs), 7 mount items, 24 nodes
── press(+1): 7 items
   Create { id: 42, kind: Text }
   Insert { parent: 32, child: 42, before: None }
   Frame { id: 32, x: 24, y: 366, w: 342, h: 43 }
   Frame { id: 42, x: 0, y: 23, w: 342, h: 20 }
   Text { id: 14, text: "1", content: 36x77 @ 0,0 }
   Text { id: 42, text: "• 1", content: 342x20 @ 0,0 }
   Text { id: 34, text: "Recent values: 1", content: 342x17 @ 0,0 }
✓ App.tsx › steps (1.4s)
```

<a id="batches-and-mount-items"></a>

#### الدفعات وعناصر التركيب

تمثّل كل كتلة `── step: N items` **دفعة تركيب** (mount batch) تحت الخطوة التي وردت فيها: وهي كل ما تطبّقه المنصة على الواجهات الأصلية خلال إطار واحد،
في انتقال واحد إلى الخيط الرئيسي. أما الأسطر داخلها فهي **عناصر التركيب** (mount items):

| العنصر | المعنى |
|---|---|
| `Create { id, kind }` | إنشاء واجهة أصلية (`View`، `Text`، `Image`، `Scroll`، ...). |
| `Insert { parent, child, before }` | وضع واجهة داخل الواجهة الأم، قبل واجهة شقيقة (`None`: في النهاية). |
| `Remove` / `Delete` | فصل واجهة عن الواجهة الأم / تحرير الواجهة. |
| `ViewStyle { id, style }` | زخرفة الواجهة: الخلفية، والحدود، ونصف القطر، والظل، والعتامة، والتحويل، ... |
| `ViewProps { id, props }` | إعدادات اللمس وإمكانية الوصول، `testID`. |
| `Events { id, events }` | الأحداث التي تبلّغ عنها الواجهة (`EventMask(1)` تعني الضغط). |
| `Frame { id, x, y, w, h }` | موضعها وحجمها داخل الواجهة الأم، بالنقاط. |
| `Text { id, text, content }` | النص بعد تخطيطه لواجهة نصية. |
| `Image { id, source, ... }` | صورة يجب تحميلها. |

لا يُرسَل إلا ما تغيّر: فالنقرة التي تغيّر رقمًا واحدًا ترسل عنصر `Text` واحدًا؛ ولا تحصل الواجهات على نمط افتراضي ولا على قناع أحداث فارغ؛ ولا تُرسَل الإطارات التي لم يطرأ عليها تغيير. أما إطار التمرير الذي لا يكشف صفًّا جديدًا فلا ينتج **أي دفعة على الإطلاق**.

<a id="the-762-lines"></a>

#### أسطر `perf`

| السطر | المعنى |
|---|---|
| `✓ bundled App.tsx (3255 B in 14.3 ms)` | زمن التجميع (bundling) وحجم الحزمة (إعدادات التطوير). |
| `commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes` | عملية commit واحدة: العمليات التي وضعها JS في الطابور، والزمن الذي قضته النواة (في عرض المكوّنات، والتخطيط، وحساب الفروق)، وزمن JS المستغرق في ربط صفوف القائمة، وعناصر التركيب الناتجة، والعُقد الحية. |
| `turn: 2640µs (timers and tasks 1964µs)` | دورة (turn) انتهت بـ commit: زمنها الكلي، والزمن الذي استغرقته مؤقّتات JS ومهام مكوّنات Rust قبل الـ commit (يُعرَض مكوّن Rust أثناء الـ commit). |
| `first frame: eval 271µs, total 1235µs` | زمن تقييم الحزمة، والزمن من البدء حتى أول دفعة. |
| `event Press on view 20` / `event js: 196µs` | حدث تم إرساله، والزمن الذي استغرقه معالجه (وما تسبّب فيه) في JS. |

> [!NOTE]
> يُقاس النص في الوضع headless بمحرّك نصوص تقريبي، لذا تختلف أحجام النصوص قليلًا عن الجهاز الحقيقي الذي يستخدم
> CoreText أو تخطيط النصوص في Android. أما منطق التخطيط وأعداد الواجهات وأعداد العمليات فهي نفسها.

تعتمد أزمنة التشغيل الواحد اعتمادًا كبيرًا على حالة تردد المعالج (فالجهاز الذي استيقظ للتو من الخمول يكون بطيئًا). قارن بين عمليات التشغيل على
الجهاز نفسه، وانظر إلى الحد الأدنى من عدة عمليات تشغيل، وثق بأعداد العمليات (ops) والعناصر (items) أكثر من الميكروثواني.

<a id="scrolling"></a>

### التمرير

```rust
app.scroll("id:photos", px(3000.0)).unwrap();
```

```sh
echo 'await app.scroll("id:photos", 3000)' | nsh test examples/gallery/Bench.tsx --trace
```

`scroll` يحرّك القائمة 10 نقاط في كل إطار، بمعدل 60 إطارًا في الثانية، وتُطبع دفعة كل إطار:

```text
perf commit: 55 ops, 1667µs (list js 771µs), 46 mount items, 414 nodes
── scroll(id:photos, 3000): 46 items
   Create { id: 792, kind: View }
   Insert { parent: 94, child: 792, before: None }
   ...
```

بالنسبة إلى [القائمة](./lists.md)، يُظهر ذلك عمل المحاكاة الافتراضية (virtualization): أي الإطارات التي تربط صفوفًا جديدة، وكم عملية يكلّفها الصف، وأن الإطارات التي لا تكشف صفًّا جديدًا لا تنتج شيئًا. استخدمه مع إصدار release (`cargo test --release`، أو `./target/release/nsh` في نسخة مستودع) للحصول على أزمنة ذات معنى.

<a id="in-ci"></a>

### في CI

لا تحتاج الاختبارات headless إلى جهاز ولا إلى شاشة، لذا تعمل على مشغّلات Linux: `cargo test` لاختبارات تطبيق Rust، و
`nsh test` الذي لا يحتاج إلى شيء سوى CLI. وأي اختبار فاشل يجعل أيًّا منهما ينتهي برمز خروج غير صفري: اختبار
يفشل، أو تطبيق لا يُبنى أو لا يعرض شيئًا، أو استثناء يرميه التطبيق أثناء إحدى الخطوات.

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test                            # a Rust app's tests
      - run: nsh test --junit test-results.xml     # its TypeScript tests, or a TSX app's
```

(ثبّت CLI الخاص بـ `nsh` على المشغّل بالطريقة نفسها التي تثبّته بها محليًا؛ راجع [التثبيت](./installation.md).)

يكتب `--junit <FILE>` أيضًا النتائج في تقرير JUnit XML، تعرضه خدمات CI (مراسلات اختبارات GitHub Actions،
وGitLab، وJenkins، وAzure Pipelines) لكل اختبار على حدة: عنصر `testsuite` لكل ملف اختبار، وعنصر `testcase` لكل اختبار، مع بيان ما فشل،
وأين، والنصوص الظاهرة على الشاشة.

لحماية الأداء، سجّل أعداد العناصر لبضعة تفاعلات (أسطر `── … : N items` وأرقام `ops` /
`mount items` في `--trace`) وأفشِل البناء عندما تزداد. الأعداد حتمية (deterministic)، أما الأزمنة على أجهزة CI المشتركة
فليست كذلك.

> [!NOTE]
> تعمل الاختبارات ضمن `capabilities` الذي يصرّح به `nsh.json` الخاص بالتطبيق، كما على الجهاز: فما لا يصرّح به التطبيق
> يُرفَض في الاختبار أيضًا.

<a id="784-for-ui-tests"></a>

## `testID` لاختبارات واجهة المستخدم

تتحقق الاختبارات headless مما يعرضه وقت التشغيل، وتجد محدِّدات `id:` فيها الواجهات عبر معرّف الاختبار (test id). ولتشغيل
واجهة المستخدم الأصلية الحقيقية بأدوات الاختبار الخاصة بالمنصة (XCUITest وEspresso / UI Automator وAppium وMaestro)، امنح الواجهات معرّف اختبار:
`.test_id(…)` في Rust، و`testID` في TSX:

```rust tabs
view()
    .test_id("add-to-cart")
    .p_3()
    .on_press(add)
    .child(text(move || format!("{} items", count.get())).test_id("cart-count"))
```

```tsx tabs
<View testID="add-to-cart" onPress={add} style={{ padding: 12 }}>
  <Text testID="cart-count">{`${count()} items`}</Text>
</View>
```

| المنصة | أين يذهب `testID` |
|---|---|
| iOS | `accessibilityIdentifier` الخاص بالواجهة (`app.otherElements["add-to-cart"]` في XCUITest). |
| Android | اسم مورد معرّف الواجهة (view id) في عقدة إمكانية الوصول (`By.res("add-to-cart")` في UI Automator). |

معرّف الاختبار هو دالة (method) في كل عنصر في Rust، بما في ذلك عناصر المكوّنات (`button().test_id("save")`، الذي
يسمّي الجذر الخاص بالمكوّن)، و`testID` خاصية (prop) في كل عنصر وفي كل مكوّن Rust (`Button`، `Dialog`، ...). وهو لا يغيّر ما تقوله قارئات الشاشة؛
استخدم `accessibilityLabel` لذلك (راجع [إمكانية الوصول](./accessibility.md)). وفي مخرجات `--trace` يظهر في
عنصر `ViewProps` الخاص بالواجهة على هيئة `test_id: Some("add-to-cart")`.

<a id="see-also"></a>

## انظر أيضًا

- [الأداء](./performance.md): ما الذي ينبغي البحث عنه في هذه الأرقام
- [خادم التطوير وتصحيح الأخطاء](./dev-server-and-debugging.md)
- [البنية المعمارية](./architecture.md): العمليات (ops) وعمليات الـ commit ودفعات التركيب
