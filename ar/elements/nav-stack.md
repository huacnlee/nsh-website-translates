---
title: "NavStack"
description: "مكدسات التنقل الأصلية: NavStack وNavPage وcreateNavStack، ودفع الصفحات وإزالتها، ومنافذ الترويسة، ومغادرة الصفحة، وكيف تعرض كل منصة المكدس."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

يعرض مكدس التنقل صفحة واحدة في كل مرة ويحتفظ بالصفحات التي تحتها: `UINavigationController` على iOS وMac Catalyst، مع رأس النظام والسحب للرجوع، ومكدس من الصفحات مع شريط أدوات والرجوع التنبؤي على Android.
في أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) وعلى الويب، تعرض كل صفحة رأس التطبيق الخاص بها في أعلاها، وتُخرج مفاتيح الرجوع وزر الرجوع في المتصفح الصفحة من المكدس. `NavStack` هو المكدس، و`NavPage` إحدى صفحاته.

يملك المكدس سلوك التنقل (الانتقالات، وإيماءات الرجوع وأزراره، وحالة الصفحات أثناء تغطيتها)؛ أما محتوى الصفحات ورأس سطح المكتب فيعودان إلى التطبيق.

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

على iOS وAndroid تعرض الصفحة رأس النظام مع `title` وزر رجوع؛ وعلى أنظمة سطح المكتب والويب تعرض `header`. التطبيق الذي يستهدف الهواتف فقط يستغني عن `header`؛ والذي يستهدف أنظمة سطح المكتب فقط يستغني عن خيارات رأس النظام. يشرح [دليل التنقل](../docs/navigation.md) تنقل تطبيق كامل: حالة المكدس، والحوارات، وزر الرجوع في Android، وعلامات التبويب.

<a id="how-a-stack-works"></a>

## كيف يعمل المكدس

- صفحات المكدس هي **المسارات** (routes): قيم تختارها أنت، من أسفل المكدس إلى أعلاه. يسمّي المسار عادةً الصفحة ويحمل معاملاتها.
- في TSX تعيش المسارات في الحالة التي ينشئها `createNavStack`. يستدعي `NavStack` دالة الابن مرة لكل عملية دفع ويعرض النتيجة صفحةً. ويحتفظ بتلك الصفحة ما دام مسارها في المكدس، فتحتفظ الصفحة بحالتها (الإشارات، وموضع التمرير، والمدخلات) بينما تغطيها صفحات أخرى.
- في Rust أبناء المكدس هم صفحاته: `nav_page()` الموضوعة في `nav_stack()` تُدفع، وما يُحذف منها يُخرج من المكدس. احتفظ بالمسارات في إشارة (signal) وارسم الصفحات باستخدام `each(..)`، مع تعريفها بمفتاح المسار، لتحتفظ الصفحات السفلية بحالتها.
- كل عملية دفع هي صفحة مستقلة، بما في ذلك دفع قيمة المسار نفسها مرتين.
- عندما يغادر المستخدم صفحة بالطريقة الأصلية (زر الرجوع، أو السحب للرجوع، أو رجوع Android، أو مفاتيح الرجوع في أنظمة سطح المكتب، أو رجوع المتصفح)، تُزال الصفحة. في TSX يزيل المكدس مسارها من الحالة، فيطابق `nav.routes()` دائمًا ما يراه المستخدم. في Rust تُبلّغ الصفحة عن `on_dismiss`، وهناك تحذف مسارها (والمسارات التي فوقه).
- في TSX، تحصل دالة الابن التي تُرجع شيئًا غير `<NavPage>` على صفحة بخيارات افتراضية. أرجع `<NavPage>` لتعيين رأسها وخياراتها الأخرى.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

ينشئ حالة مكدس يبدأ بـ `routes`، من الأسفل إلى الأعلى. أنشئه مرة واحدة، مثلًا على مستوى الوحدة (module)، ومرّره إلى `<NavStack state>`. يمكن لأي شيفرة استيراده للتنقل.

| العضو | الوصف |
|---|---|
| `routes: Accessor<readonly R[]>` | المسارات، من الأسفل إلى الأعلى. تفاعلي. |
| `push(route: R): void` | يدفع صفحة. |
| `pop(count?: number): void` | يُخرج `count` من الصفحات (الافتراضي 1). تبقى صفحة واحدة على الأقل دائمًا. |
| `popToRoot(): void` | يرجع إلى الصفحة الأولى. |
| `replace(route: R): void` | يستبدل الصفحة العليا. |
| `setRoutes(routes: R[]): void` | يستبدل الصفحات؛ المسار الذي يبقى (القيمة نفسها) يحتفظ بصفحته وحالتها. |
| `remove(route: R): void` | يزيل أعلى صفحة من `route` (بالمقارنة مع `===`)، أينما كانت في المكدس. |

في Rust تكون العمليات نفسها تغييرات على إشارة المسارات لديك: `routes.update(|r| r.push(route))` يدفع، و`r.pop()` يُخرج، و`r.truncate(1)` يرجع إلى أول صفحة تبقيها فيها، و`routes.set(..)` يستبدل الصفحات.

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

<a id="navstack-props"></a>

## خصائص NavStack

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `state` | الصفحات هي أبناؤه | `NavStackState<R>` | الحالة التي تحتفظ بالمسارات (`createNavStack`). مطلوبة. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | يرسم مسارًا. أرجع `<NavPage>` لتعيين خياراته. مطلوبة. |
| `style`، `class` | دوال التنسيق | | تنسيق المكدس؛ وهو عادةً `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | يجد المكدس في الاختبارات و`nsh test --trace`. |

تتلقى دالة الابن في TSX قيمة المسار نفسها ودالة وصول (accessor) إلى موضعه في المكدس.

<a id="navpage-props"></a>

## خصائص NavPage

`NavPage` هي صفحة واحدة من المكدس. تحتوي محتوى الصفحة، و`header` في أنظمة سطح المكتب والويب، وخيارات رأس النظام على iOS وAndroid. في Rust تُرجع `nav_page()` الصفحة، وتكون دوال البناء فيها بأسماء الخصائص نفسها بصيغة snake-case.

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | لا شيء | أنظمة سطح المكتب والويب: رأس الصفحة، يوضع في أعلاها، بعرض الصفحة وبالارتفاع الذي يحدده تخطيطه، ويكون المحتوى تحته. |
| `title` | `.title(..)` | `string` | لا شيء | iOS وAndroid: عنوان رأس النظام. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS وAndroid: يظهر رأس النظام. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS وAndroid: يمتد المحتوى تحت رأس النظام الشفاف. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: يغادر شريط تبويب النظام بينما تكون هذه الصفحة في الأعلى، ويتحرك أثناء الانتقال — بالحركة نفسها التي تتحرك بها الصفحة، ولا يُعاد بناء الشريط أبدًا؛ ويعود عند إخراج الصفحة. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: عنوان كبير ينكمش داخل الشريط عند تمرير المحتوى؛ ويتمرر المحتوى تحت الرأس. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | لا شيء | iOS وAndroid: تسمية زر الرجوع الذي يقود إلى هذه الصفحة (وفي Android هي وصفه لقارئات الشاشة). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS وAndroid: يظهر زر الرجوع. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | لا شيء | iOS وAndroid: محتوى عند الحافة الأمامية لرأس النظام، بدلًا من زر الرجوع. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | لا شيء | iOS وAndroid: محتوى عند الحافة الخلفية لرأس النظام. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | لا شيء | iOS وAndroid: محتوى يحل محل العنوان. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | المنصة | iOS وAndroid: ألوان رأس النظام: خلفيته، ولون العنوان (`color`)، ولون الأزرار (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | لا شيء | الألوان نفسها على شكل فئات (classes): `bg-*`، و`text-*` للعنوان، و`tint-*` للأزرار (في Rust `.bg(..)` و`.text_color(..)` و`.tint_color(..)`، وهي ألوان السمة التي تتبع المظهر). و`headerStyle` له الأولوية عليها. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | أزرار الرجوع والسحب للرجوع تُخرج الصفحة. انظر [مغادرة صفحة](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | إيماءة الرجوع التفاعلية تُخرج الصفحة: السحب للرجوع في iOS، والرجوع التنبؤي في Android الذي يتبع الإصبع. وتُخرج أزرار الرجوع الصفحة في الحالتين. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | كيف تدخل الصفحة وكيف تغادر. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | لا شيء | تدخل الصفحة وتغادر عبر مظلل WGSL بدلًا من `animation`: يقرأ `shade(uv)` الصفحة التي تحتها بوصفها `sample_from` وهذه الصفحة بوصفها `sample_to` بينما يمتد `nsh.progress` من 0 إلى 1 خلال `duration` من الميلي ثانية (350 افتراضيًا)، ومن 1 إلى 0 عند مغادرة الصفحة. وعندما يطلب النظام حركة أقل، تعتمد الصفحة `animation` الخاص بها. انظر [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | لا شيء | iOS وAndroid: شريط الحالة بينما تكون الصفحة في الأعلى. انظر [شريط الحالة](../modules/nsh-base.md#status-bar). |
| `style`، `class` | دوال التنسيق | | لا شيء | تنسيق الصفحة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى. |
| `testID` | `.test_id(..)` | `string` | لا شيء | يجد الصفحة في الاختبارات و`nsh test --trace`. |

<a id="navpage-events"></a>

## أحداث NavPage

| الحدث | Rust | الوصف |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | ضغط المستخدم على الرجوع في الصفحة (زر الرجوع في الرأس، أو رجوع Android، أو Escape، أو Alt+Left، أو زر الرجوع في الفأرة على أنظمة سطح المكتب، أو رجوع المتصفح)، سواء سمح `popOnBack` بإخراج الصفحة أم لا. |
| `onDismiss` | `.on_dismiss(..)` | أخرج المستخدم الصفحة (زر الرجوع، السحب)؛ ويكون مسارها قد أُزيل في TSX، ويحذفه Rust هنا. |

<a id="header-slots"></a>

## فتحات الرأس

`header` و`headerLeft` و`headerRight` و`headerTitle` فتحات (slots): عناصر عادية تقرأ الإشارات وتعالج الضغطات وتتحدث أثناء عرض الصفحة. `header` هو رأس التطبيق بأكمله على أنظمة سطح المكتب والويب؛ أما الثلاثة الأخرى فتدخل في رأس النظام على iOS وAndroid.

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

يبدأ محتوى الصفحة تحت الرأس: تحت رأس النظام المعتم على iOS وAndroid، وتحت `header` على أنظمة سطح المكتب والويب. ومع `headerTransparent` أو `headerLargeTitle` أو `headerVisible={false}` يبدأ في أعلى الصفحة على iOS وAndroid؛ استخدم [`env(safe-area-inset-top)`](./safe-area.md) أو `safeAreaInsets()` لإبقائه بعيدًا عن الرأس وشريط الحالة.

على iOS، يُبقي `headerVisible={false}` السحب للرجوع مفعّلًا ما دام `popOnSwipe` و`popOnBack` صحيحين.
تنهي إيماءة الرجوع التفاعلية المقبولة التحرير مع بدء الانتقال، فيُغلق لوحة المفاتيح أثناء السحب. وإلغاء الانتقال يعيد التركيز إلى المحرر نفسه ما لم يأخذه عنصر تحكم آخر.

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

## مغادرة صفحة

`popOnBack={false}` يبقي المستخدم في الصفحة، مثلًا بينما يحتوي نموذج على تغييرات غير محفوظة. وما دام false، يكون السحب للرجوع معطلًا وتستدعي أزرار الرجوع ومفاتيحه `onBackPress` دون إخراج الصفحة. اسأل المستخدم، ثم أخرج الصفحة بنفسك:

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
> يسأل النظام عمّا إذا كان يحق للمستخدم الرجوع على الخيط الرئيسي (main thread)، لحظة تنفيذ المستخدم للإجراء، ولا ينتظر الخيط الرئيسي JS ولا شيفرة Rust أبدًا. لذلك يجيب NSH من قيمة `popOnBack` المركّبة بالفعل. عيّن `popOnBack={false}` بمجرد أن يوجد ما يمكن فقدانه، قبل أن يرجع المستخدم.

يُستدعى `onBackPress` عند كل ضغطة رجوع، وكذلك عند إخراج الصفحة، فيخبرك أيضًا بأن المستخدم رجع.
لتعطيل إيماءة السحب فقط مع إبقاء أزرار الرجوع، استخدم `popOnSwipe={false}`. أما التأكيد نفسه فهو [AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## ملاحظات المنصات

- **iOS**: `UINavigationController` مع رأس النظام وزر الرجوع والسحب للرجوع؛ و`headerLargeTitle` هو العنوان الكبير في UIKit. تُطبَّق تغييرات المكدس التي تصل أثناء انتقال جارٍ عند انتهائه.
- **Android**: مكدس مع شريط أدوات. يُخرج زر الرجوع في النظام الصفحة العليا، مع الرجوع التنبؤي في إصدارات Android التي تدعمه؛ ووصف سهم الصعود لقارئات الشاشة هو `headerBackTitle` الخاص بالصفحة السفلية، أو وصف النظام. انظر `BackHandler` في [`BackHandler`](../modules/nsh-mobile.md#backhandler) لمعالجة زر الرجوع بنفسك.
- **Mac Catalyst**: كما في iOS.
- **أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب**: تعرض كل صفحة `header` الخاص بها في الأعلى ومحتواها تحته. تؤدي Escape وAlt+Left وزر الرجوع في الفأرة إلى الرجوع على أنظمة سطح المكتب، وزر الرجوع في المتصفح على الويب.

للمحتوى المعروض فوق المكدس ورأسه، مثل ورقة (sheet) أو تدفق بملء الشاشة، استخدم [Dialog](./dialog.md).
