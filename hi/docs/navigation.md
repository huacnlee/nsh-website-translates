---
title: "नेविगेशन"
description: "createNavStack, NavStack और NavPage के साथ नेटिव नेविगेशन स्टैक, हर प्लेटफ़ॉर्म पर हेडर, popOnBack की मदद से उपयोगकर्ता को किसी पेज पर बनाए रखना, डायलॉग, और Android का बैक बटन।"
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# नेविगेशन

`nsh_base` (TSX: `nsh/base`) नेटिव नेविगेशन स्टैक और नेटिव डायलॉग प्रदान करता है। नेविगेशन स्टैक (Rust में `nav_stack()`, TSX में `NavStack`) iOS पर एक UINavigationController है, जिसमें उसका हेडर, स्वाइप बैक और बड़े शीर्षक होते हैं, और Android पर टूलबार वाला स्टैक और predictive back होता है। डेस्कटॉप और वेब पर हर पेज वह हेडर दिखाता है जिसे आपका ऐप खुद बनाता है। आप routes को अपनी state में रखते हैं; स्टैक हर route को एक पेज के रूप में रेंडर करता है और जब तक वह स्टैक में है, उसे उसकी state के साथ mounted रखता है।

Rust में builders को prelude (`use nsh_base::{dialog, nav_page, nav_stack};`; सिस्टम अलर्ट `nsh_base::alert_dialog()` हैं) के साथ नाम से import करें। routes एक signal होते हैं और स्टैक के children उसके पेज होते हैं, हर route के लिए एक, जो key (`each`) से पहचाने जाते हैं: पेज जोड़ने से push होता है और हटाने से pop। TSX में `createNavStack` routes को रखता है और `NavStack` उन्हें रेंडर करता है।

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

## स्टैक की स्थिति

Rust में routes आपका अपना signal होते हैं (`signal(vec![..])`, या पूरे ऐप की पहुँच वाले signal के लिए `global::<Routes>()`), और आप उसे अपडेट करके push, pop और replace करते हैं: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`। हर पेज की key (यहाँ route का `Debug` टेक्स्ट) स्टैक को बताती है कि कौन सा पेज कौन सा है, इसलिए जिन पेजों के route बने रहते हैं वे अपनी state बनाए रखते हैं; जो routes दोहराए जा सकते हैं उन्हें अद्वितीय key दें। हर पेज का `on_dismiss` संभालें: उपयोगकर्ता नेटिव रूप से पीछे गया, और route (उसके ऊपर वाले routes के साथ) आपके signal से हट जाता है।

TSX में `createNavStack(routes)` routes की एक array (नीचे से ऊपर) से स्टैक की state बनाता है। route कोई भी मान हो सकता है (string, object, ऊपर की तरह discriminated union), और हर push अपना अलग पेज होता है, एक ही route को दो बार push करने पर भी। state को एक बार बनाएँ, module स्तर पर या अपने root component में, और जहाँ भी पेज नेविगेट करें वहाँ उसे import करें।

| सदस्य | विवरण |
|---|---|
| `routes()` | Routes, नीचे से ऊपर (reactive)। |
| `push(route)` | एक पेज push करता है। |
| `pop(count?)` | `count` पेज pop करता है (डिफ़ॉल्ट 1); कम से कम एक बना रहता है। |
| `popToRoot()` | पहले पेज तक pop करता है। |
| `replace(route)` | सबसे ऊपर का पेज बदलता है। |
| `setRoutes(routes)` | पेजों को बदलता है, जैसे साइन इन के बाद; जो route बना रहता है (वही मान) वह अपना पेज और अपनी state रखता है। |
| `remove(route)` | `route` का सबसे ऊपरी पेज हटाता है, चाहे वह कहीं भी हो। |

कई पेज गहराई से शुरू करने के लिए अधिक routes दें: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`।

जब उपयोगकर्ता किसी पेज को नेटिव रूप से छोड़ता है (हेडर का बैक बटन, iOS पर स्वाइप बैक, Android का बैक बटन या जेस्चर, डेस्कटॉप की बैक कुंजियाँ और माउस बटन, ब्राउज़र का बैक बटन), तो TSX स्टैक उस route को आपकी state से अपने आप हटा देता है, इसलिए `routes()` हमेशा स्क्रीन पर दिखने वाली चीज़ से मेल खाता है; Rust का पेज इसे `on_dismiss` से रिपोर्ट करता है, जैसा ऊपर बताया गया है।

route वही रखता है जो पेज को चाहिए। गैलरी ऐप्स ऐसे routes push करते हैं जिनमें वह होता है जिससे पेज बनता है, जिससे कई पेज होने पर भी route का type छोटा रहता है:

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

Rust में `nav_stack()` एक view है जिसके children उसके पेज हैं, नीचे से ऊपर; इसे किसी भी view की तरह स्टाइल करें (`.flex_1()`)। TSX में:

| Prop | Type | विवरण |
|---|---|---|
| `state` | `NavStackState<R>` | दिखाने के लिए routes। |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | एक route को रेंडर करता है; उसके हेडर के लिए `<NavPage>` लौटाएँ। |
| `style`, `class` | | स्टैक की अपनी स्टाइल (आमतौर पर `flex: 1`)। |

render function हर route के लिए एक बार चलता है, जब वह push होता है; `route` सादा मान है, `index()` उसकी मौजूदा स्थिति। वह जो लौटाता है वही पेज की सामग्री बनता है। हेडर सेट करने के लिए `<NavPage>` लौटाएँ; बाकी सब कुछ डिफ़ॉल्ट विकल्पों वाले पेज में लपेट दिया जाता है।

जब तक route स्टैक में है, पेज mounted रहते हैं: पीछे जाने पर पिछला पेज ठीक वैसा ही दिखता है जैसा छोड़ा गया था, उसकी scroll position, inputs और signals के साथ। पेज के [`cleanup`](./reactivity.md) handlers तब चलते हैं जब उसका route स्टैक से निकल जाता है।

<a id="navpage-and-the-header"></a>

## NavPage और हेडर

एक पेज (Rust में `nav_page()`, TSX में `NavPage`) पेज की सामग्री को लपेटता है और उसका हेडर रखता है। iOS और Android अपना सिस्टम हेडर दिखाते हैं, जो title और हेडर विकल्पों से सेट होता है। डेस्कटॉप और वेब पेज के सबसे ऊपर पेज का हेडर slot (`.header(..)`, TSX `header`) दिखाते हैं, यानी आपके अपने views: पेज जितना चौड़ा, जितना ऊँचा वह layout में बने, और उसके नीचे सामग्री। जैसा ऊपर के उदाहरण में है, पेज को दोनों दें, तो वह हर जगह स्वाभाविक दिखता है। सभी विकल्प reactive हैं: signal बदलें और हेडर उसके साथ बदल जाता है।

Rust में नीचे का हर prop `nav_page()` की एक method है, snake case में: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`; इसके children इसकी सामग्री हैं।

| Prop | Type | डिफ़ॉल्ट | विवरण |
|---|---|---|---|
| `header` | `JSX.Element` | | डेस्कटॉप और वेब: पेज का हेडर, जिसे ऐप बनाता है (title, बैक बटन, टूलबार बटन)। |
| `title` | `string` | | iOS और Android: सिस्टम हेडर का title। |
| `headerVisible` | `boolean` | `true` | iOS और Android: सिस्टम हेडर दिखता है। |
| `headerTransparent` | `boolean` | `false` | iOS और Android: सामग्री हेडर के नीचे तक फैलती है। |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS और Android: हेडर की पृष्ठभूमि, title का रंग (`color`) और बटनों का रंग (`tintColor`)। |
| `headerClass` | `string` | | classes जैसा ही: `bg-*`, title के लिए `text-*`, बटनों के लिए `tint-*`; `headerStyle` इन पर भारी पड़ता है। |
| `headerBackVisible` | `boolean` | `true` | iOS और Android: बैक बटन दिखता है। |
| `headerLeft` | `JSX.Element` | | iOS और Android: हेडर की शुरुआत में views (वे बैक बटन की जगह लेते हैं)। |
| `headerRight` | `JSX.Element` | | iOS और Android: हेडर के अंत में views। |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: हेडर के अंत में UIKit का अपना bar button, सिस्टम के रूप, symbol या label के साथ, `headerRight` के views की जगह; उस पर प्रेस `headerRight` के पहले pressable view पर प्रेस होता है, इसलिए वहाँ एक रखें। Android `headerRight` को जैसा है वैसा दिखाता है। |
| `ios={{ headerLeftSystemItem }}` | `headerRightSystemItem` के समान | | iOS: वही, हेडर की शुरुआत में, `headerLeft` को दबाने पर। |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: UIKit का अपना bar button जो उस नाम का SF Symbol (`"slider.horizontal.3"`) दिखाता है, `headerRight` के views की जगह; उस पर प्रेस `headerRight` के पहले pressable view पर प्रेस होता है, और VoiceOver उस view का label पढ़ता है। `headerRightSystemItem` इस पर भारी पड़ता है; जो नाम SF Symbols में नहीं है, उस स्थिति में `headerRight` जैसा है वैसा दिखता है। Android `headerRight` को जैसा है वैसा दिखाता है। |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: वही, हेडर की शुरुआत में, `headerLeft` को दबाने पर। |
| `headerTitle` | `JSX.Element` | | iOS और Android: title की जगह लेने वाले views। |
| `headerLargeTitle` | `boolean` | `false` | iOS: बड़ा title जो सामग्री के scroll होने पर bar में सिकुड़ जाता है। |
| `headerBackTitle` | `string` | | उस बैक बटन का label जो इस पेज पर वापस लाता है (iOS; Android का up arrow स्क्रीन रीडर को यही बताता है)। |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | पेज कैसे आता और जाता है। |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS और Android: जब पेज सबसे ऊपर हो तब status bar ([Status bar](../modules/nsh-base.md#status-bar))। |
| `popOnSwipe` | `boolean` | `true` | interactive बैक जेस्चर (iOS स्वाइप बैक, Android predictive back) पेज को pop करता है। बैक बटन दोनों स्थितियों में pop करते हैं। |
| `popOnBack` | `boolean` | `true` | पीछे जाने का हर तरीका पेज को pop करता है: बैक बटन, Android का बैक, डेस्कटॉप की बैक कुंजियाँ, ब्राउज़र का बैक बटन और स्वाइप। |
| `onBackPress` | `() => void` | | उपयोगकर्ता ने पेज पर बैक दबाया, चाहे `popOnBack` ने उसे pop होने दिया हो या नहीं। |
| `onDismiss` | `() => void` | | उपयोगकर्ता ने पेज pop किया; उसका route पहले ही हट चुका है। |
| `style`, `class` | | | पेज का content view। |

हेडर आइटम सामान्य views हैं, इसलिए वे pressable और reactive हो सकते हैं:

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

रंगीन सिस्टम हेडर (Rust में `header_style_with` typed styles लेता है: `bg`, `text_color` और `tint_color`, हेडर के बटनों का रंग; theme रंग appearance के अनुसार बदलते हैं):

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

जो पेज कोई हेडर नहीं दिखाता, उसके चारों ओर फिर भी सिस्टम bars होते हैं; उसकी सामग्री में [safe area](../elements/safe-area.md) insets के अनुसार padding दें:

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

### हेडर के नीचे के Safe area

पेज के अंदर, `env(safe-area-inset-*)` variables और पेज के insets (Rust में `Scope::insets`, TSX में `safeAreaInsets()`) वे हैं जो पेज के भीतर सिस्टम हेडर के नीचे हैं। पारदर्शी हेडर के साथ, सामग्री पेज के सबसे ऊपर से शुरू होती है और ऊपरी inset हेडर की ऊँचाई होती है, इसलिए `env(safe-area-inset-top)` से padding देने पर टेक्स्ट हेडर से दूर रहता है जबकि पृष्ठभूमि की इमेज पूरे पेज को भरती है। बड़े title के साथ, scroll view को सीधे पेज में रखें ताकि scroll करते समय title सिकुड़ सके। डेस्कटॉप और वेब पर सामग्री पेज के हेडर slot के नीचे से शुरू होती है।

<a id="keeping-the-user-on-a-page-poponback"></a>

## उपयोगकर्ता को पेज पर रोकना: popOnBack

बिना सहेजे बदलाव छोड़ने से पहले पूछने के लिए, जब तक कुछ खोने को है तब तक `pop_on_back` (TSX `popOnBack`) को false रखें, बैक प्रेस को संभालें (`.on_back_press(..)`, TSX `onBackPress`), और उपयोगकर्ता की सहमति के बाद pop करें:

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

`pop_on_back(false)` (`popOnBack={false}`) के साथ, पीछे जाने के हर तरीके पर पेज बना रहता है (बैक बटन, Android का बैक बटन और जेस्चर, डेस्कटॉप की बैक कुंजियाँ, ब्राउज़र का बैक बटन, स्वाइप), और बैक प्रेस event आपको बताता है कि उपयोगकर्ता ने कोशिश की। कोड से pop करना (route हटाना, `nav.pop()`) हमेशा की तरह pop करता है।

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` एक prop है, ऐसा callback नहीं जो true या false लौटाए, क्योंकि main thread कभी ऐप कोड का इंतज़ार नहीं करता। जब उपयोगकर्ता स्वाइप शुरू करता है या बैक दबाता है, तो सिस्टम तुरंत पूछता है कि क्या पेज जा सकता है, और NSH अपने पास पहले से मौजूद props से नेटिव रूप से जवाब देता है। जैसे ही कुछ खोने को हो (जैसा ऊपर, टेक्स्ट से), उपयोगकर्ता के जाने की कोशिश से पहले इसे सेट करें।

`pop_on_swipe(false)` (`popOnSwipe={false}`) हल्का विकल्प है: यह केवल interactive जेस्चर बंद करता है (iOS स्वाइप बैक, Android का predictive back animation), और बैक बटन फिर भी pop करते हैं।

<a id="dialogs"></a>

## डायलॉग

एक डायलॉग (Rust में `nsh_base` का `dialog()`, TSX में `Dialog`) अपनी नेटिव window layer में सब कुछ के ऊपर सामग्री प्रस्तुत करता है: iOS पर presented view controller, Android पर dialog window, डेस्कटॉप और वेब पर पूरी window के ऊपर एक layer। इसका रूप आपका अपना होता है। Rust में डायलॉग तब तक प्रस्तुत रहता है जब तक वह view में है (`when` के अंदर) और उसके children उसे भरते हैं: backdrop और popup को views के रूप में बनाएँ। TSX में `class` और `style` उस popup को स्टाइल करते हैं जिसमें उसके children होते हैं, `backdropClass` या `backdropStyle` उसके पीछे backdrop जोड़ते हैं, और `open` उसे नियंत्रित करता है:

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

Escape, Android का बैक बटन, backdrop पर प्रेस (TSX का backdrop, Rust में नेटिव sheet का) और sheet पर नीचे की ओर स्वाइप उसे नेटिव रूप से बंद करते हैं (`close_on_escape`, `close_on_backdrop_press` और `close_on_swipe`, TSX `closeOnEscape`, `closeOnBackdropPress` और `closeOnSwipe`, हर एक डिफ़ॉल्ट रूप से true)। Rust में `on_cancel` हर प्रयास की रिपोर्ट करता है और `on_close` बंद होने की, इसलिए वहाँ डायलॉग को view से बाहर कर दें; आपके ऐप द्वारा बनाया गया backdrop अपने press handler से उसे बंद करता है, जैसा ऊपर है। TSX में `onOpenChange({ open: false, reason })` आपको बताता है, इसलिए वहाँ `open` को `false` पर सेट करें। पहले पुष्टि करने के लिए, एक flag को false करें और cancel event (`on_cancel`, `onCancel`) संभालें, जो हर प्रयास की रिपोर्ट करता है, फिर डायलॉग को खुद बंद करें। iOS पर `.presentation(ModalPresentation::PageSheet)` या `FormSheet` (`presentation="pageSheet"` या `"formSheet"`) एक sheet प्रस्तुत करता है जो पीछे की चीज़ों को दिखाए रखती है।

हर prop के लिए [Dialog](../elements/dialog.md) देखें। डायलॉग के अंदर `env(safe-area-inset-*)` variables और insets डायलॉग के अपने होते हैं। सिस्टम डायलॉग (actions वाला alert, action sheet) के लिए `nsh_base` (TSX: `nsh/base`) से [`AlertDialog`](../modules/nsh-base.md#alertdialog) का उपयोग करें।

<a id="the-android-back-button"></a>

## Android का बैक बटन

Android पर बैक बटन (या जेस्चर) इस क्रम में संभाला जाता है:

1. सबसे ऊपर का डायलॉग: वह cancel रिपोर्ट करता है (`on_cancel`, `onCancel`), और जब तक `close_on_escape` / `closeOnEscape` true है (डिफ़ॉल्ट) तब तक बंद हो जाता है।
2. आपके back listeners (Rust में `on_back_press`, TSX में `nsh/mobile` से `BackHandler`), सबसे हाल में जोड़ा गया पहले।
3. सबसे ऊपर का स्टैक: उसका सबसे ऊपर का पेज बैक प्रेस रिपोर्ट करता है, और जब तक `pop_on_back` / `popOnBack` true है तब तक pop करता है।
4. किसी ने इसे नहीं संभाला: ऐप बंद हो जाता है।

listener प्रेस को संभालने पर `true` लौटाता है, जिससे स्टैक pop नहीं होता। जब तक कोई listener पंजीकृत है, Android का बैक जेस्चर pop का preview नहीं दिखाता (ऐप जेस्चर खत्म होने के बाद ही जवाब देता है), इसलिए listeners तभी जोड़ें जब वे प्रेस ले सकते हों:

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

effect में बनाया गया listener तब तक रहता है जब तक effect फिर से नहीं चलता या उसका component हट नहीं जाता; TSX में `BackHandler.on` जो function लौटाता है वह भी उसे रोक देता है। TSX में `BackHandler.exitApp()` ऐप से बाहर निकलता है; `nsh/mobile` को iOS पर भी import किया जा सकता है, जहाँ `BackHandler` की calls तुरंत लौट आती हैं, इसलिए वही कोड दोनों प्लेटफ़ॉर्म पर चलता है। [Platform-specific code](./platform-specific.md) देखें।

<a id="tabs-and-other-layouts"></a>

## Tabs और अन्य layouts

tab bar आपका अपना UI है, primitives से बना: pressable views की एक row और चुने गए tab को रखने वाला signal; चुने गए tab की सामग्री को [`when` / `<If>`](../elements/control-flow.md) से रेंडर करें (या TSX में function child से)। स्विच करते समय हर tab की state बनाए रखने के लिए, हर tab को उसका अपना स्टैक और routes दें और सभी को mounted रखें, निष्क्रिय वालों को `display: none` से छिपाएँ।

<a id="related"></a>

## संबंधित

- [`nsh/base`](../modules/nsh-base.md): `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage` और `Dialog` का संदर्भ; insets के लिए [Safe area](../elements/safe-area.md)।
- पेजों और डायलॉग का [status bar](../modules/nsh-base.md#status-bar)।
- [`AlertDialog`](../modules/nsh-base.md#alertdialog)।
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`।
