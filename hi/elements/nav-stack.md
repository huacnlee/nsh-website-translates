---
title: "NavStack"
description: "नेटिव नेविगेशन स्टैक: NavStack, NavPage और createNavStack, पेज को push और pop करना, हेडर स्लॉट, किसी पेज को छोड़ना और हर प्लेटफ़ॉर्म स्टैक को कैसे दिखाता है।"
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

नेविगेशन स्टैक एक समय में एक पेज दिखाता है और उसके नीचे के पेजों को बनाए रखता है: iOS और Mac Catalyst पर `UINavigationController`, सिस्टम हेडर और swipe back के साथ, और Android पर टूलबार और predictive back वाला पेजों का स्टैक।
डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब पर हर पेज अपने सबसे ऊपर ऐप का अपना हेडर दिखाता है, और
बैक कीज़ तथा ब्राउज़र का बैक बटन पेज को pop करते हैं। `NavStack` स्टैक है और `NavPage` उसका एक पेज।

स्टैक नेविगेशन के व्यवहार (ट्रांज़िशन, बैक जेस्चर और बटन, और ढके होने के दौरान पेजों की स्टेट) का मालिक है;
पेजों का कंटेंट और डेस्कटॉप का हेडर ऐप के अपने होते हैं।

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

iOS और Android पर पेज `title` और बैक बटन के साथ सिस्टम हेडर दिखाता है; डेस्कटॉप और वेब पर यह
`header` दिखाता है। जो ऐप केवल फ़ोन को लक्षित करता है वह `header` को छोड़ देता है; जो केवल डेस्कटॉप को लक्षित करता है वह
सिस्टम हेडर के विकल्प छोड़ देता है। [Navigation गाइड](../docs/navigation.md) पूरे ऐप के नेविगेशन को समझाती है: स्टैक की
स्टेट, डायलॉग, Android का बैक बटन और टैब।

<a id="how-a-stack-works"></a>

## स्टैक कैसे काम करता है

- स्टैक के पेज **routes** होते हैं: आपके चुने हुए मान, स्टैक के सबसे नीचे से सबसे ऊपर तक। एक route आमतौर पर
  पेज का नाम बताता है और उसके पैरामीटर रखता है।
- TSX में routes उस स्टेट में रहते हैं जो `createNavStack` बनाता है। `NavStack` हर push के लिए अपने child function को एक बार कॉल करता है
  और नतीजे को पेज के रूप में दिखाता है। जब तक उसका route स्टैक में है, यह उस पेज को बनाए रखता है, इसलिए दूसरे पेजों के ढकने पर भी
  पेज की स्टेट (signals, स्क्रॉल पोज़िशन, इनपुट) बनी रहती है।
- Rust में स्टैक के children उसके पेज होते हैं: `nav_stack()` में रखा गया `nav_page()` push होता है, और जो छोड़ दिया जाए वह
  pop हो जाता है। routes को एक signal में रखें और पेजों को route के key के साथ `each(..)` से रेंडर करें, ताकि नीचे के पेज
  अपनी स्टेट बनाए रखें।
- हर push अपने आप में एक अलग पेज है, एक ही route मान को दो बार push करने पर भी।
- जब उपयोगकर्ता किसी पेज को नेटिव तरीके से छोड़ता है (बैक बटन, swipe back, Android back, डेस्कटॉप की बैक कीज़,
  ब्राउज़र का बैक), तो वह पेज हट जाता है। TSX में स्टैक उसका route स्टेट से हटा देता है, इसलिए `nav.routes()` हमेशा वही दिखाता है
  जो उपयोगकर्ता देखता है। Rust में पेज `on_dismiss` रिपोर्ट करता है, जहाँ आप उसका route (और उसके ऊपर के routes) हटा देते हैं।
- TSX में, जो child function `<NavPage>` के अलावा कुछ और लौटाता है, उसे डिफ़ॉल्ट विकल्पों वाला पेज मिलता है।
  उसका हेडर और अन्य विकल्प सेट करने के लिए `<NavPage>` लौटाएँ।

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

यह ऐसे स्टैक की स्टेट बनाता है जो `routes` से शुरू होता है, नीचे से ऊपर। इसे एक बार बनाएँ, उदाहरण के लिए मॉड्यूल स्तर पर,
और `<NavStack state>` को दें। नेविगेट करने के लिए कोई भी कोड इसे import कर सकता है।

| सदस्य | विवरण |
|---|---|
| `routes: Accessor<readonly R[]>` | routes, नीचे से ऊपर। Reactive। |
| `push(route: R): void` | एक पेज push करता है। |
| `pop(count?: number): void` | `count` पेज pop करता है (डिफ़ॉल्ट 1)। कम से कम एक पेज हमेशा बना रहता है। |
| `popToRoot(): void` | पहले पेज तक वापस pop करता है। |
| `replace(route: R): void` | सबसे ऊपर के पेज को बदलता है। |
| `setRoutes(routes: R[]): void` | पेजों को बदलता है; जो route बना रहता है (वही मान) उसका पेज और उसकी स्टेट बनी रहती है। |
| `remove(route: R): void` | `route` का सबसे ऊपर वाला पेज हटाता है (`===` से तुलना करके), चाहे वह स्टैक में कहीं भी हो। |

Rust में यही ऑपरेशन आपके routes signal में बदलाव हैं: `routes.update(|r| r.push(route))` push करता है,
`r.pop()` pop करता है, `r.truncate(1)` उसमें रखे पहले पेज तक वापस pop करता है, और `routes.set(..)` पेजों को बदलता है।

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

## NavStack props

| Prop | Rust | प्रकार | विवरण |
|---|---|---|---|
| `state` | पेज इसके children हैं | `NavStackState<R>` | वह स्टेट जो routes रखती है (`createNavStack`)। अनिवार्य। |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | एक route को रेंडर करता है। उसके विकल्पों के लिए `<NavPage>` लौटाएँ। अनिवार्य। |
| `style`, `class` | style methods | | स्टैक की स्टाइल; आमतौर पर `flex: 1`। |
| `testID` | `.test_id(..)` | `string` | टेस्ट और `nsh test --trace` में स्टैक को खोजता है। |

TSX का child function route का मान स्वयं और स्टैक में उसकी स्थिति का एक accessor प्राप्त करता है।

## NavPage props

`NavPage` स्टैक का एक पेज है। यह पेज का कंटेंट, डेस्कटॉप और वेब पर उसका `header`, और iOS तथा Android पर सिस्टम हेडर के विकल्प रखता है। Rust में `nav_page()` पेज लौटाता है और उसके builder मेथड
props के snake-case नाम होते हैं।

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | कोई नहीं | डेस्कटॉप और वेब: पेज का हेडर, जो पेज के सबसे ऊपर रखा जाता है, पेज जितना चौड़ा और अपने लेआउट जितना ऊँचा, और कंटेंट उसके नीचे। |
| `title` | `.title(..)` | `string` | कोई नहीं | iOS और Android: सिस्टम हेडर का शीर्षक। |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS और Android: सिस्टम हेडर दिखता है। |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS और Android: कंटेंट पारदर्शी सिस्टम हेडर के नीचे तक फैलता है। |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: जब तक यह पेज सबसे ऊपर है, सिस्टम टैब बार हट जाता है और ट्रांज़िशन में चलता है — पेज के जैसा ही एनिमेशन, और बार कभी दोबारा नहीं बनाया जाता; पेज के pop होने पर वह वापस आ जाता है। |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: एक बड़ा शीर्षक जो कंटेंट के स्क्रॉल होने पर बार में सिकुड़ जाता है; कंटेंट हेडर के नीचे स्क्रॉल होता है। |
| `headerBackTitle` | `.header_back_title(..)` | `string` | कोई नहीं | iOS और Android: उस बैक बटन का लेबल जो इस पेज पर वापस लाता है (Android पर, स्क्रीन रीडर के लिए उसका विवरण)। |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS और Android: बैक बटन दिखता है। |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | कोई नहीं | iOS और Android: सिस्टम हेडर के आगे वाले किनारे पर कंटेंट, बैक बटन की जगह। |
| `headerRight` | `.header_right(..)` | `JSX.Element` | कोई नहीं | iOS और Android: सिस्टम हेडर के पीछे वाले किनारे पर कंटेंट। |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | कोई नहीं | iOS और Android: वह कंटेंट जो शीर्षक की जगह लेता है। |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | प्लेटफ़ॉर्म का डिफ़ॉल्ट | iOS और Android: सिस्टम हेडर के रंग: उसकी पृष्ठभूमि, शीर्षक (`color`) और बटनों (`tintColor`) के रंग। |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | कोई नहीं | वही रंग classes के रूप में: `bg-*`, शीर्षक के लिए `text-*`, बटनों के लिए `tint-*` (Rust में `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, थीम के रंग जो appearance का पालन करते हैं)। `headerStyle` इन पर प्रभावी रहता है। |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | बैक बटन और swipe back पेज को pop करते हैं। देखें [किसी पेज को छोड़ना](#leaving-a-page)। |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | इंटरैक्टिव बैक जेस्चर पेज को pop करता है: iOS का swipe back, Android का predictive back जो उंगली का अनुसरण करता है। बैक बटन दोनों स्थितियों में pop करते हैं। |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | पेज कैसे आता और जाता है। |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | कोई नहीं | पेज अपने `animation` की जगह WGSL शेडर के ज़रिए आता और जाता है: `shade(uv)` नीचे के पेज को `sample_from` के रूप में और इस पेज को `sample_to` के रूप में पढ़ता है, जबकि `nsh.progress` `duration` मिलीसेकंड (डिफ़ॉल्ट 350) में 0 से 1 तक चलता है, और पेज के जाते समय 1 से वापस 0 तक। जब सिस्टम कम मोशन माँगता है, तो पेज अपना `animation` अपनाता है। देखें [Shader](./shader.md)। |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | कोई नहीं | iOS और Android: जब तक पेज सबसे ऊपर है, तब तक स्टेटस बार। देखें [स्टेटस बार](../modules/nsh-base.md#status-bar)। |
| `style`, `class` | style methods | | कोई नहीं | पेज की स्टाइल। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | कंटेंट। |
| `testID` | `.test_id(..)` | `string` | कोई नहीं | टेस्ट और `nsh test --trace` में पेज को खोजता है। |

## NavPage events

| Event | Rust | विवरण |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | उपयोगकर्ता ने पेज पर बैक दबाया (हेडर का बैक बटन, Android back, डेस्कटॉप पर Escape, Alt+Left या माउस का बैक बटन, ब्राउज़र का बैक), चाहे `popOnBack` ने उसे pop होने दिया हो या नहीं। |
| `onDismiss` | `.on_dismiss(..)` | उपयोगकर्ता ने पेज को pop किया (बैक बटन, swipe); TSX में उसका route हट चुका होता है, और Rust में आप उसे यहाँ हटाते हैं। |

<a id="header-slots"></a>

## हेडर स्लॉट

`header`, `headerLeft`, `headerRight` और `headerTitle` स्लॉट हैं: साधारण एलिमेंट जो signals पढ़ते हैं, प्रेस को हैंडल करते हैं
और पेज के दिखने के दौरान अपडेट होते हैं। डेस्कटॉप और वेब पर `header` ऐप का पूरा हेडर है; बाकी तीन
iOS और Android पर सिस्टम हेडर में जाते हैं।

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

पेज का कंटेंट हेडर के नीचे से शुरू होता है: iOS और Android पर अपारदर्शी सिस्टम हेडर के नीचे, डेस्कटॉप और वेब पर `header` के नीचे। `headerTransparent`, `headerLargeTitle` या `headerVisible={false}` के साथ, यह iOS और Android पर पेज के सबसे ऊपर से शुरू होता है; इसे हेडर और स्टेटस बार से दूर रखने के लिए [`env(safe-area-inset-top)`](./safe-area.md) या `safeAreaInsets()` का उपयोग करें।

iOS पर, `headerVisible={false}` तब तक swipe back को चालू रखता है जब तक `popOnSwipe` और `popOnBack` true हैं।
स्वीकार किया गया इंटरैक्टिव बैक जेस्चर ट्रांज़िशन शुरू होते ही एडिटिंग समाप्त कर देता है, इसलिए ड्रैग के दौरान कीबोर्ड बंद हो जाता है। ट्रांज़िशन रद्द करने पर, अगर किसी दूसरे कंट्रोल ने फ़ोकस नहीं लिया है, तो उसी एडिटर का फ़ोकस बहाल हो जाता है।

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## किसी पेज को छोड़ना

`popOnBack={false}` उपयोगकर्ता को पेज पर रोके रखता है, उदाहरण के लिए जब किसी फ़ॉर्म में बिना सहेजे बदलाव हों। जब यह false होता है, swipe
back बंद रहता है और बैक बटन तथा कीज़ pop किए बिना `onBackPress` को कॉल करते हैं। उपयोगकर्ता से पूछें, फिर खुद pop करें:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
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
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> सिस्टम मुख्य थ्रेड पर, उसी क्षण जब उपयोगकर्ता कार्रवाई करता है, पूछता है कि क्या उपयोगकर्ता वापस जा सकता है, और मुख्य थ्रेड
> कभी JS या आपके Rust कोड का इंतज़ार नहीं करता। इसलिए NSH पहले से माउंट किए गए `popOnBack` मान से जवाब देता है। जैसे ही
> खोने लायक कुछ हो, उपयोगकर्ता के वापस जाने से पहले ही `popOnBack={false}` सेट कर दें।

`onBackPress` हर बैक प्रेस पर कॉल होता है, पेज के pop होने पर भी, इसलिए यह आपको यह भी बताता है कि उपयोगकर्ता वापस गया।
केवल swipe जेस्चर बंद करने और बैक बटन चालू रखने के लिए `popOnSwipe={false}` का उपयोग करें। पुष्टि वाला डायलॉग स्वयं एक
[AlertDialog](./alert-dialog.md) है।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- **iOS**: सिस्टम हेडर, बैक बटन और swipe back के साथ `UINavigationController`; `headerLargeTitle` UIKit का
  बड़ा शीर्षक है। चल रहे ट्रांज़िशन के दौरान आने वाले स्टैक बदलाव उसके समाप्त होने पर लागू होते हैं।
- **Android**: टूलबार वाला स्टैक। सिस्टम का बैक बटन सबसे ऊपर के पेज को pop करता है, और जिन Android
  वर्ज़न में predictive back है उन पर उसके साथ; स्क्रीन रीडर के लिए अप एरो का विवरण नीचे वाले पेज का `headerBackTitle` होता है, या
  सिस्टम का। बैक बटन को खुद हैंडल करने के लिए [`BackHandler`](../modules/nsh-mobile.md#backhandler) में `BackHandler` देखें।
- **Mac Catalyst**: iOS की तरह।
- **डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब**: हर पेज अपने सबसे ऊपर अपना `header` और उसके नीचे अपना कंटेंट
  दिखाता है। डेस्कटॉप पर Escape, Alt+Left और माउस का बैक बटन वापस ले जाते हैं, और वेब पर ब्राउज़र का बैक बटन।

स्टैक और उसके हेडर के ऊपर दिखाए जाने वाले कंटेंट के लिए, जैसे sheet या फ़ुल-स्क्रीन फ़्लो, एक
[Dialog](./dialog.md) का उपयोग करें।
