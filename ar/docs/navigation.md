---
title: "التنقل"
description: "مكدسات التنقل الأصلية باستخدام createNavStack وNavStack وNavPage، والترويسات على كل منصة، وإبقاء المستخدم في صفحة معينة باستخدام popOnBack، والنوافذ الحوارية، وزر الرجوع في Android."
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# التنقل

يوفّر `nsh_base` (في TSX: `nsh/base`) مكدس تنقل أصليًا وحوارات أصلية. مكدس التنقل (`nav_stack()` في Rust و`NavStack` في TSX) هو UINavigationController على iOS، مع ترويسته والسحب للرجوع والعناوين الكبيرة، ومكدس مع شريط أدوات ورجوع تنبؤي على Android؛ أما على أنظمة سطح المكتب والويب فتعرض كل صفحة الترويسة التي يرسمها تطبيقك. تحتفظ بالمسارات في حالة تطبيقك؛ ويعرض المكدس كل مسار كصفحة ويُبقيها مركّبة، مع حالتها، ما دامت في المكدس.

في Rust، استورد المُنشئات بأسمائها بجانب prelude (`use nsh_base::{dialog, nav_page, nav_stack};`؛ وتنبيهات النظام هي `nsh_base::alert_dialog()`). المسارات هي signal، وأبناء المكدس هم صفحاته، صفحة لكل مسار، وتُحدَّد بالمفتاح (`each`): تُضاف الصفحة لدفعها وتُزال لإخراجها. في TSX، يحمل `createNavStack` المسارات ويعرضها `NavStack`.

```rust tabs
use nsh_base::{nav_page, nav_stack};
use nsh_core::prelude::*;

#[derive(Debug, Clone, PartialEq)]
enum Route {
    Inbox,
    Message(u32),
}

/// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
fn header(routes: Signal<Vec<Route>>, title: &'static str) -> impl IntoElement {
    view()
        .h(px(48.0))
        .flex_row()
        .items_center()
        .gap_3()
        .border_b_1()
        .border_color(rgb(0xe5e7eb))
        .px_4()
        .child(when(
            move || routes.with(|r| r.len() > 1),
            move || {
                text("Back")
                    .role(AccessibilityRole::Button)
                    .on_press(move || routes.update(|r| { r.pop(); }))
                    .text_color(rgb(0x2563eb))
                    .active(|s| s.opacity(0.6))
            },
        ))
        .child(text(title).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
}

fn inbox(routes: Signal<Vec<Route>>) -> Screen {
    nav_page()
        .title("Inbox")
        .header(header(routes, "Inbox"))
        .child(scroll().flex_1().children((1..=5).map(move |id| {
            view()
                .on_press(move || routes.update(|r| r.push(Route::Message(id))))
                .p_4()
                .active(|s| s.bg(rgb(0xf3f4f6)))
                .child(text(format!("Message {id}")))
        })))
}

fn message(routes: Signal<Vec<Route>>, id: u32) -> Screen {
    nav_page()
        .title(format!("Message {id}"))
        .header(header(routes, "Message"))
        .child(view().flex_1().p(px(16.0)).child(text(format!("The body of message {id}."))))
}

#[component]
pub fn App() -> impl IntoElement {
    let routes = signal(vec![Route::Inbox]);
    nav_stack().flex_1().child(each(
        move || routes.get(),
        |route: &Route| format!("{route:?}"),
        move |route, index| {
            let page = match route.get_untracked() {
                Route::Inbox => inbox(routes),
                Route::Message(id) => message(routes, id),
            };
            // The user went back natively: drop the route (and those above it).
            page.on_dismiss(move || routes.update(|r| r.truncate(index.get_untracked())))
        },
    ))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "inbox" } | { name: "message"; id: number };

const nav = createNavStack<Route>([{ name: "inbox" }]);

// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
function Header(props: { title: string }) {
  return (
    <View class="h-12 flex-row items-center gap-3 border-b border-gray-200 px-4">
      <If when={nav.routes().length > 1}>
        <Text role="button" onPress={() => nav.pop()} class="text-blue-600 active:opacity-60">
          Back
        </Text>
      </If>
      <Text style={{ fontSize: 17, fontWeight: "600" }}>{props.title}</Text>
    </View>
  );
}

function Inbox() {
  return (
    <NavPage title="Inbox" header={<Header title="Inbox" />}>
      <Scroll style={{ flex: 1 }}>
        <Each of={[1, 2, 3, 4, 5]}>
          {(id) => (
            <View onPress={() => nav.push({ name: "message", id: id() })} class="p-4 active:bg-gray-100">
              <Text>Message {id()}</Text>
            </View>
          )}
        </Each>
      </Scroll>
    </NavPage>
  );
}

function Message(props: { id: number }) {
  return (
    <NavPage title={`Message ${props.id}`} header={<Header title={`Message ${props.id}`} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The body of message {props.id}.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => {
        switch (route.name) {
          case "inbox":
            return <Inbox />;
          case "message":
            return <Message id={route.id} />;
        }
      }}
    </NavStack>
  );
}

mount(App);
```

<a id="the-stacks-state"></a>

## حالة المكدس

في Rust، المسارات هي signal خاص بك (`signal(vec![..])`، أو `global::<Routes>()` لما يصل إليه التطبيق كله)، وتقوم بالدفع والإخراج والاستبدال بتحديثه: `routes.update(|r| r.push(route))` و`r.pop()` و`r.truncate(1)` و`routes.set(..)`. يخبر مفتاح كل صفحة (هنا نص `Debug` الخاص بالمسار) المكدس أي صفحة هي أي، فتحتفظ الصفحات التي يبقى مسارها بحالتها؛ أعطِ المسارات التي قد تتكرر مفتاحًا فريدًا. تعامل مع `on_dismiss` لكل صفحة: لقد رجع المستخدم أصليًا، ويغادر المسار (مع ما فوقه) signal الخاص بك.

في TSX، يُنشئ `createNavStack(routes)` حالة المكدس من مصفوفة مسارات، من الأسفل إلى الأعلى. المسار قيمة من اختيارك (نص، أو كائن، أو اتحاد مميَّز كما في الأعلى)، وكل دفع هو صفحة مستقلة، بما في ذلك دفع المسار نفسه مرتين. أنشئ الحالة مرة واحدة، على مستوى الوحدة أو في المكوّن الجذري، واستوردها أينما تنتقل الصفحات.

| العضو | الوصف |
|---|---|
| `routes()` | المسارات، من الأسفل إلى الأعلى (تفاعلية). |
| `push(route)` | يدفع صفحة. |
| `pop(count?)` | يُخرج `count` من الصفحات (الافتراضي 1)؛ وتبقى صفحة واحدة على الأقل. |
| `popToRoot()` | يرجع إلى الصفحة الأولى. |
| `replace(route)` | يستبدل الصفحة العليا. |
| `setRoutes(routes)` | يستبدل الصفحات، مثلًا بعد تسجيل الدخول؛ والمسار الذي يبقى (القيمة نفسها) يحتفظ بصفحته وحالتها. |
| `remove(route)` | يزيل أعلى صفحة من `route`، أينما كانت. |

للبدء بعدة صفحات في العمق، مرّر مسارات أكثر: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

عندما يغادر المستخدم صفحة أصليًا (زر الرجوع في الترويسة، أو السحب للرجوع على iOS، أو زر الرجوع أو إيماءته في Android، أو مفاتيح الرجوع وزر الفأرة في أنظمة سطح المكتب، أو زر الرجوع في المتصفح)، يزيل مكدس TSX ذلك المسار من حالته نيابةً عنك، فيطابق `routes()` دائمًا ما هو على الشاشة؛ أما صفحة Rust فتبلّغ عن ذلك عبر `on_dismiss`، كما في الأعلى.

يحمل المسار ما تحتاجه الصفحة. تدفع تطبيقات المعرض مسارات تحمل ما يكوّن الصفحة، وهذا يُبقي نوع المسار صغيرًا عندما تكثر الصفحات:

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

/// A pushed page: its key (unique in the stack) and what makes it.
#[derive(Clone)]
pub struct Route {
    pub key: SharedString,
    pub page: Rc<dyn Fn() -> Screen>,
}

impl PartialEq for Route {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

/// The pushed pages, bottom to top: one signal for the whole app.
#[derive(Default, Clone)]
pub struct Routes(pub Vec<Route>);

pub fn routes() -> Signal<Routes> {
    global::<Routes>()
}

// Elsewhere: routes().update(|r| r.0.push(Route { key: "settings".into(), page: Rc::new(settings) }));
```

```ts tabs
import { type JSX } from "nsh";
import { createNavStack } from "nsh/base";

export type Route = { name: "home" } | { name: "page"; page: () => JSX.Element };
export const nav = createNavStack<Route>([{ name: "home" }]);

// Elsewhere: nav.push({ name: "page", page: Settings });
```

## NavStack

في Rust، `nav_stack()` هو view أبناؤه صفحاته، من الأسفل إلى الأعلى؛ نسّقه كأي view (`.flex_1()`). في TSX:

| الخاصية | النوع | الوصف |
|---|---|---|
| `state` | `NavStackState<R>` | المسارات المراد عرضها. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | يعرض مسارًا؛ أعد `<NavPage>` لترويسته. |
| `style`، `class` | | نمط المكدس نفسه (عادةً `flex: 1`). |

تُنفَّذ دالة العرض مرة واحدة لكل مسار، عند دفعه؛ `route` هي القيمة العادية، و`index()` موضعه الحالي. ما تعيده يصبح محتوى الصفحة. أعد `<NavPage>` لضبط الترويسة؛ وأي شيء آخر يُغلَّف في صفحة بخيارات افتراضية.

تبقى الصفحات مركّبة ما دام مساراتها في المكدس: الرجوع يعرض الصفحة السابقة تمامًا كما تُركت، بموضع تمريرها ومدخلاتها وsignals الخاصة بها. تُنفَّذ معالجات [`cleanup`](./reactivity.md) الخاصة بالصفحة عندما يغادر مسارها المكدس.

<a id="navpage-and-the-header"></a>

## NavPage والترويسة

تغلّف الصفحة (`nav_page()` في Rust، `NavPage` في TSX) محتوى الصفحة وتحمل ترويستها. يعرض iOS وAndroid ترويسة النظام، التي تُضبط بالعنوان وخيارات الترويسة. أما أنظمة سطح المكتب والويب فتعرض خانة ترويسة الصفحة (`.header(..)`، وفي TSX `header`)، وهي views من تصميمك، في أعلى الصفحة: بعرض الصفحة وبالارتفاع الذي تتخذه في التخطيط، والمحتوى تحتها. أعطِ الصفحة الاثنين، كما يفعل المثال أعلاه، فتبدو مألوفة في كل مكان. جميع الخيارات تفاعلية: غيّر signal فتتبعه الترويسة.

في Rust، كل خاصية أدناه هي دالة في `nav_page()` بصيغة snake case: `.title(..)`، `.header(..)`، `.header_visible(..)`، `.header_transparent(..)`، `.header_style_with(..)`، `.header_style(..)`، `.header_back_visible(..)`، `.header_left(..)`، `.header_right(..)`، `.header_title(..)`، `.header_large_title(..)`، `.header_back_title(..)`، `.animation(ScreenAnimation::Fade)`، `.status_bar(..)`، `.pop_on_swipe(..)`، `.pop_on_back(..)`، `.on_back_press(..)`، `.on_dismiss(..)`؛ وأبناؤها هم محتواها.

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `header` | `JSX.Element` | | أنظمة سطح المكتب والويب: ترويسة الصفحة، يرسمها التطبيق (عنوان، وزر رجوع، وأزرار شريط الأدوات). |
| `title` | `string` | | iOS وAndroid: عنوان ترويسة النظام. |
| `headerVisible` | `boolean` | `true` | iOS وAndroid: تظهر ترويسة النظام. |
| `headerTransparent` | `boolean` | `false` | iOS وAndroid: يمتد المحتوى تحت الترويسة. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS وAndroid: خلفية الترويسة، ولون العنوان (`color`) ولون الأزرار (`tintColor`). |
| `headerClass` | `string` | | مثل classes: `bg-*`، و`text-*` للعنوان، و`tint-*` للأزرار؛ ويتغلب `headerStyle` عليها. |
| `headerBackVisible` | `boolean` | `true` | iOS وAndroid: يظهر زر الرجوع. |
| `headerLeft` | `JSX.Element` | | iOS وAndroid: views في بداية الترويسة (تحل محل زر الرجوع). |
| `headerRight` | `JSX.Element` | | iOS وAndroid: views في نهاية الترويسة. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: زر شريط UIKit الأصلي في نهاية الترويسة، بمظهر النظام ورمزه أو تسميته، بدلًا من views الخاصة بـ`headerRight`؛ والضغط عليه هو ضغط على أول view قابل للضغط في `headerRight`، فأبقِ واحدًا هناك. يعرض Android `headerRight` كما هو. |
| `ios={{ headerLeftSystemItem }}` | مثل `headerRightSystemItem` | | iOS: الأمر نفسه، في بداية الترويسة، ويضغط `headerLeft`. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: زر شريط UIKit الأصلي يعرض رمز SF Symbol بذلك الاسم (`"slider.horizontal.3"`) بدلًا من views الخاصة بـ`headerRight`؛ والضغط عليه هو ضغط على أول view قابل للضغط في `headerRight`، ويقرأ VoiceOver تسمية ذلك الـview. يتغلب `headerRightSystemItem` عليه؛ والاسم الذي لا تملكه SF Symbols يعرض `headerRight` كما هو. يعرض Android `headerRight` كما هو. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: الأمر نفسه، في بداية الترويسة، ويضغط `headerLeft`. |
| `headerTitle` | `JSX.Element` | | iOS وAndroid: views تحل محل العنوان. |
| `headerLargeTitle` | `boolean` | `false` | iOS: عنوان كبير ينكمش داخل الشريط عند تمرير المحتوى. |
| `headerBackTitle` | `string` | | تسمية زر الرجوع الذي يعود إلى هذه الصفحة (iOS؛ ويُسمعها سهم الأعلى في Android لقارئات الشاشة). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | كيف تدخل الصفحة وتغادر. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS وAndroid: شريط الحالة عندما تكون الصفحة في الأعلى ([شريط الحالة](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | تُخرج إيماءة الرجوع التفاعلية (السحب للرجوع في iOS، والرجوع التنبؤي في Android) الصفحة. وتُخرجها أزرار الرجوع في الحالتين. |
| `popOnBack` | `boolean` | `true` | كل طريقة للرجوع تُخرج الصفحة: أزرار الرجوع، ورجوع Android، ومفاتيح الرجوع في أنظمة سطح المكتب، وزر الرجوع في المتصفح، والسحب. |
| `onBackPress` | `() => void` | | ضغط المستخدم على الرجوع في الصفحة، سواء سمح `popOnBack` بإخراجها أم لا. |
| `onDismiss` | `() => void` | | أخرج المستخدم الصفحة؛ وقد أُزيل مسارها بالفعل. |
| `style`، `class` | | | عرض محتوى الصفحة. |

عناصر الترويسة هي views عادية، فيمكن أن تكون قابلة للضغط وتفاعلية:

```rust tabs
fn compose(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let cancel = move || {
        text("Cancel")
            .on_press(move || routes.update(|r| { r.pop(); }))
            .text_size(px(17.0))
            .text_color(rgb(0x0969da))
    };
    let send_button = move || {
        text("Send")
            .on_press(move || send(draft.get()))
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(move || if draft.with(String::is_empty) { rgb(0x8c959f) } else { rgb(0x0969da) })
    };
    nav_page()
        .title("New message")
        .header_left(cancel())
        .header_right(send_button())
        .header(
            view()
                .h(px(48.0))
                .flex_row()
                .items_center()
                .justify_between()
                .px_4()
                .child(cancel())
                .child(text("New message").text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
                .child(send_button()),
        )
        .child(
            input()
                .multiline(true)
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .flex_1()
                .p(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
function Compose() {
  const text = signal("");
  const cancel = () => (
    <Text onPress={() => nav.pop()} style={{ fontSize: 17, color: "#0969da" }}>
      Cancel
    </Text>
  );
  const sendButton = () => (
    <Text
      onPress={() => send(text())}
      style={{ fontSize: 17, fontWeight: "600", color: text() ? "#0969da" : "#8c959f" }}
    >
      Send
    </Text>
  );
  return (
    <NavPage
      title="New message"
      headerLeft={cancel()}
      headerRight={sendButton()}
      header={
        <View class="h-12 flex-row items-center justify-between px-4">
          {cancel()}
          <Text style={{ fontSize: 17, fontWeight: "600" }}>New message</Text>
          {sendButton()}
        </View>
      }
    >
      <Input multiline value={text()} onChange={({ value }) => text.set(value)} style={{ flex: 1, padding: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

ترويسة نظام ملوّنة (في Rust، يأخذ `header_style_with` أنماطًا مُنوَّعة الأنواع: `bg` و`text_color` و`tint_color`، وهو لون أزرار الترويسة؛ وألوان السمة تتبع المظهر):

```rust tabs
nav_page()
    .title("Profile")
    .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(rgb(0xffffff)).tint_color(rgb(0xffffff)))
```

```tsx tabs
<NavPage title="Profile" headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}>
  …
</NavPage>
```

الصفحة التي لا تُظهر ترويسة ما زالت تحيط بها أشرطة النظام؛ فأضف حشوة لمحتواها بحسب هوامش [المنطقة الآمنة](../elements/safe-area.md):

```rust tabs
use nsh_base::nav_page;

nav_page()
    .header_visible(false)
    .child(view().flex_1().p_safe_area() /* … */)
```

```tsx tabs
<NavPage headerVisible={false}>
  <View class="flex-1 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)] px-4">…</View>
</NavPage>
```

<a id="safe-areas-under-the-header"></a>

### المناطق الآمنة تحت الترويسة

داخل الصفحة، المتغيرات `env(safe-area-inset-*)` وهوامش الصفحة (`Scope::insets` في Rust، `safeAreaInsets()` في TSX) هي التي تقع تحت ترويسة النظام، داخل الصفحة. مع ترويسة شفافة، يبدأ المحتوى من أعلى الصفحة ويكون الهامش العلوي هو ارتفاع الترويسة، فالحشوة بمقدار `env(safe-area-inset-top)` تُبقي النص بعيدًا عنها بينما تملأ صورة الخلفية الصفحة كلها. مع عنوان كبير، ضع scroll view مباشرة في الصفحة ليتمكن العنوان من الانطواء عند التمرير. على أنظمة سطح المكتب والويب، يبدأ المحتوى تحت خانة ترويسة الصفحة.

<a id="keeping-the-user-on-a-page-poponback"></a>

## إبقاء المستخدم في الصفحة: popOnBack

لسؤال المستخدم قبل التخلي عن تغييرات غير محفوظة، اضبط `pop_on_back` (في TSX `popOnBack`) على false ما دام هناك ما قد يضيع، وتعامل مع ضغطة الرجوع (`.on_back_press(..)`، وفي TSX `onBackPress`)، وأخرج الصفحة عندما يوافق المستخدم:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| { r.pop(); });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || draft.with(String::is_empty))
        .on_back_press(move || {
            if !draft.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .placeholder("A note")
                .m(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const dirty = () => text().length > 0;
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={!dirty()} onBackPress={() => dirty() && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" style={{ margin: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

مع `pop_on_back(false)` (`popOnBack={false}`)، تبقى الصفحة عند كل طريقة للرجوع (أزرار الرجوع، وزر Android وإيماءته، ومفاتيح الرجوع في أنظمة سطح المكتب، وزر الرجوع في المتصفح، والسحب)، ويخبرك حدث ضغطة الرجوع بأن المستخدم حاول. أما الإخراج من الشيفرة (بإزالة المسار، `nav.pop()`) فيُخرج الصفحة كالمعتاد.

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` خاصية وليست دالة استدعاء تعيد true أو false، لأن الخيط الرئيسي لا ينتظر شيفرة التطبيق أبدًا. عندما يبدأ المستخدم سحبة أو يضغط على الرجوع، يسأل النظام فورًا هل يجوز للصفحة أن تذهب، ويجيب NSH أصليًا من الخصائص التي لديه بالفعل. اضبطها بمجرد وجود ما قد يضيع (كما في الأعلى، من النص)، قبل أن يحاول المستخدم المغادرة.

`pop_on_swipe(false)` (`popOnSwipe={false}`) هو الخيار الأخف: يعطّل الإيماءة التفاعلية فقط (السحب للرجوع في iOS، ورسوم الرجوع التنبؤي في Android)، وتبقى أزرار الرجوع تُخرج الصفحة.

<a id="dialogs"></a>

## الحوارات

يعرض الحوار (`dialog()` من `nsh_base` في Rust، `Dialog` في TSX) المحتوى فوق كل شيء آخر، في طبقة نافذة أصلية خاصة به: view controller معروض على iOS، ونافذة حوار على Android، وطبقة فوق النافذة كلها على أنظمة سطح المكتب والويب. مظهره من تصميمك. في Rust، يُعرض الحوار ما دام في الـview (داخل `when`) ويملؤه أبناؤه: ارسم الخلفية الخلفية والنافذة المنبثقة كـviews. في TSX، يُنسّق `class` و`style` النافذة المنبثقة التي تحمل أبناءه، ويضيف `backdropClass` أو `backdropStyle` خلفية خلفها، ويتحكم `open` فيه:

```rust tabs
use nsh_base::dialog;
use nsh_core::prelude::*;

pub fn files() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .child(view().on_press(move || open.set(true)).p(px(16.0)).child(text("Delete the file")))
        .child(when(
            move || open.get(),
            move || {
                dialog()
                    .animation(ModalAnimation::Fade)
                    // Escape, Android's back button, a swipe down on a sheet.
                    .on_cancel(move || open.set(false))
                    .child(
                        // The backdrop and the popup are the app's views.
                        view()
                            .flex_1()
                            .bg(rgba(0x00000066))
                            .items_center()
                            .justify_center()
                            .on_press(move || open.set(false))
                            .child(
                                view()
                                    .w(px(320.0))
                                    .gap_3()
                                    .rounded_2xl()
                                    .bg(white())
                                    .p_5()
                                    .on_press(|| {})
                                    .child(text("Delete the file?").text_size(px(20.0)).font_weight(FontWeight::BOLD))
                                    .child(
                                        view()
                                            .on_press(move || open.set(false))
                                            .child(text("Delete").text_color(rgb(0xcf222e))),
                                    ),
                            ),
                    )
            },
        ))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Dialog } from "nsh/base";

function Files() {
  const open = signal(false);
  return (
    <View style={{ flex: 1 }}>
      <View onPress={() => open.set(true)} style={{ padding: 16 }}>
        <Text>Delete the file</Text>
      </View>
      <Dialog
        open={open()}
        animation="fade"
        onOpenChange={(e) => open.set(e.open)}
        backdropClass="bg-black/40"
        class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete the file?</Text>
        <View onPress={() => open.set(false)}>
          <Text style={{ color: "#cf222e" }}>Delete</Text>
        </View>
      </Dialog>
    </View>
  );
}
```

يغلقه أصليًا كل من Escape وزر Android للرجوع والضغط على الخلفية (خلفية TSX، أو خلفية الورقة الأصلية في Rust) والسحب للأسفل على الورقة (`close_on_escape` و`close_on_backdrop_press` و`close_on_swipe`، وفي TSX `closeOnEscape` و`closeOnBackdropPress` و`closeOnSwipe`، وكلها true افتراضيًا). في Rust، يبلّغ `on_cancel` عن كل محاولة ويبلّغ `on_close` عن الإغلاق، فاترك الحوار خارج الـview هناك؛ والخلفية التي يرسمها تطبيقك تغلقه بمعالج الضغط الخاص بها، كما في الأعلى. في TSX، يخبرك `onOpenChange({ open: false, reason })` بذلك، فاضبط `open` على `false` هناك. للتأكيد أولًا، اضبط علَمًا على false وتعامل مع حدث الإلغاء (`on_cancel`، `onCancel`)، الذي يبلّغ عن كل محاولة، ثم أغلق الحوار بنفسك. على iOS، يعرض `.presentation(ModalPresentation::PageSheet)` أو `FormSheet` (`presentation="pageSheet"` أو `"formSheet"`) ورقة تُبقي ما خلفها مرئيًا.

راجع [Dialog](../elements/dialog.md) لكل الخصائص. داخل الحوار، المتغيرات `env(safe-area-inset-*)` والهوامش هي الخاصة بالحوار نفسه. للحوارات النظامية (تنبيه بإجراءات، أو ورقة إجراءات) استخدم [`AlertDialog`](../modules/nsh-base.md#alertdialog) من `nsh_base` (في TSX: `nsh/base`).

<a id="the-android-back-button"></a>

## زر الرجوع في Android

على Android، يُعالَج زر الرجوع (أو إيماءته) بهذا الترتيب:

1. الحوار الأعلى: يبلّغ عن الإلغاء (`on_cancel`، `onCancel`)، ويُغلق ما دام `close_on_escape` / `closeOnEscape` هو true (الافتراضي).
2. مستمعو الرجوع لديك (`on_back_press` في Rust، `BackHandler` من `nsh/mobile` في TSX)، الأحدث إضافةً أولًا.
3. المكدس الأعلى: تبلّغ صفحته العليا عن ضغطة الرجوع، وتُخرَج ما دام `pop_on_back` / `popOnBack` هو true.
4. إن لم يعالجه أحد: يخرج التطبيق.

يعيد المستمع `true` عندما يعالج الضغطة، وهذا يمنع المكدس من الإخراج. وما دام هناك مستمع مسجَّل، لا تعرض إيماءة الرجوع في Android معاينة للإخراج (يجيب التطبيق فقط عند انتهاء الإيماءة)، فأضف المستمعين فقط
عندما يكون لهم أن يأخذوا الضغطة:

```rust tabs
use nsh_core::prelude::*;

pub fn editor() -> impl IntoElement {
    let selecting = signal(false);
    // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
    effect(move || {
        if selecting.get() {
            on_back_press(move || {
                selecting.set(false);
                true
            });
        }
    });
    // …
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { BackHandler } from "nsh/mobile";

function Editor() {
  const selecting = signal(false);
  // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
  effect(() => {
    if (selecting()) {
      BackHandler.on("press", () => {
        selecting.set(false);
        return true;
      });
    }
  });
  // …
}
```

يستمر المستمع المنشأ في effect حتى يُنفَّذ الـeffect مجددًا أو يزول مكوّنه؛ وفي TSX، توقفه أيضًا الدالة
التي يعيدها `BackHandler.on`. في TSX، يُخرج `BackHandler.exitApp()` المستخدم من التطبيق؛ ويمكن استيراد `nsh/mobile` على iOS أيضًا، حيث تعود استدعاءات `BackHandler` فورًا، فتعمل الشيفرة نفسها على المنصتين. راجع [الشيفرة الخاصة بكل منصة](./platform-specific.md).

<a id="tabs-and-other-layouts"></a>

## علامات التبويب وتخطيطات أخرى

شريط علامات التبويب هو واجهتك الخاصة، مرسومة من العناصر الأساسية: صف من views قابلة للضغط وsignal يحمل علامة التبويب المحددة؛ اعرض محتوى علامة التبويب المحددة بـ[`when` / `<If>`](../elements/control-flow.md) (أو بابن دالة في TSX). للاحتفاظ بحالة كل علامة تبويب عند التبديل، أعطِ كل علامة مكدسها ومساراتها الخاصة وأبقِها كلها مركّبة، مع إخفاء غير النشطة بـ`display: none`.

<a id="related"></a>

## ذو صلة

- [`nsh/base`](../modules/nsh-base.md): مرجع `nav_stack` و`nav_page` و`dialog` و`createNavStack` و`NavStack` و`NavPage` و`Dialog`؛ و[المنطقة الآمنة](../elements/safe-area.md) للهوامش.
- [شريط الحالة](../modules/nsh-base.md#status-bar) للصفحات والحوارات.
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
