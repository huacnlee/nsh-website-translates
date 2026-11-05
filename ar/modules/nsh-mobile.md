---
title: "nsh/mobile"
description: "ما تقدّمه iOS وAndroid: TabBar، وهو شريط التبويب الخاص بالنظام، وInputAccessoryView على iOS، وBackHandler على Android، وisAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

تضم `nsh/mobile` القدرات الخاصة بنظامي iOS وAndroid: شريط التبويب الخاص بالنظام `TabBar` على كليهما، و[`InputAccessoryView`](#inputaccessoryview)، وهو شريط فوق لوحة المفاتيح على iOS، و[`BackHandler`](#backhandler)، أي زر الرجوع، على Android. يستخدم كود Rust `nsh_core::mobile` و`nsh_core::prelude`، بينما يستورد TSX `nsh/mobile`. يمكن استيراد الوحدة على كل المنصات، فتعمل حزمة واحدة في كل مكان: على المنصات الأخرى لا تشغل مكوناتها أي مساحة وتعود استدعاءاتها فورًا، وتخبرك `isAvailable` إن كنت على iOS أو Android (وتحدد `platform.os` من `nsh` أيهما). أما ما تقدمه أنظمة سطح المكتب فموجود في [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## النطاق

تعرض هذه الوحدة قدرات خاصة بمنصات الجوال، مثل شريط التبويب الخاص بالنظام للتنقل في المستوى الأعلى من التطبيق. أما عناصر التحكم المشتركة فمكانها [`nsh/base`](./nsh-base.md): فـ[Switch](../elements/switch.md) فيها مثلًا يتشارك السلوك وواجهة API نفسيهما بين الهواتف وأنظمة سطح المكتب والويب، مع تزويد التطبيق بالمسار والمقبض وأنماط الحالات. تخدم `TabBar` التنقل في تطبيقات الجوال، بينما تخدم `Tabs` المحتوى ذا التبويبات عبر المنصات. لا مكان هنا إلا للقدرات التي لها دلالات تفاعل خاصة بالجوال. فمجرد مظهر النظام أو حجمه أو حركته لا يغيّر الدور المشترك لعنصر التحكم الشائع. ويوجّه هذا التمييز تحديد القدرات التي تنتمي إلى هنا ([الأهداف ومبادئ التصميم](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` على iOS ومحاكي iOS وMac Catalyst وAndroid، و`false` في غير ذلك. في Rust: `matches!(os(), Os::Ios | Os::Android)`.

## TabBar

يتيح شريط التبويب التنقل بين الأقسام العليا في التطبيق: السجلات والإحصاءات، والوارد والإعدادات. `TabBar` هو شريط النظام نفسه، فيبدو ويتصرف كما تفعل تطبيقات النظام: `UITabBar` على iOS وiPadOS (Liquid Glass وتحديده على iOS 26)، وشريط التنقل في Material 3 على Android، بألوان النظام، فاتحة وداكنة. يقدّم التطبيق التبويبات (`items`)، ويحدد أيها المختار (`selectedIndex`)، ويستمع لاختيار المستخدم (`onChange`)، ويضع الشريط عبر `class` و`style`، ويعرض محتوى القسم المختار بنفسه. للتبويبات داخل الصفحة، وعلى كل المنصات، استخدم [Tabs](../elements/tabs.md) من `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

تأتي `TabBar` من `nsh/mobile`، وهي `nsh_core::mobile` في Rust. الاختيار ملك للتطبيق: فالنقر يرسل `onChange` مع فهرس التبويب (`{ index }`)، ويعرض الشريط الاختيار فورًا كما يفعل شريط النظام، ثم يعرض التطبيق ذلك القسم ويعيد الفهرس عبر `selectedIndex`. ارتفاعه هو ارتفاع النظام حيث يتركه النمط مفتوحًا. في Rust، تنشئ `tab_bar()` شريطًا، مع دالة ضبط لكل خاصية (`.items(..)`، `.selected_index(..)`)، ومستمع لكل حدث (`.on_change(..)`)، ودوال الأنماط المطبوعة؛ وتنشئ `TabBarItem::new(title).icon(name)` تبويبًا.

<a id="props"></a>

### الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | التبويبات بالترتيب. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | التبويب المختار بحسب الفهرس؛ والفهرس الأكبر من عدد التبويبات لا يختار أيًّا منها. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: يخفي الشريط دون انتقال. يملك التطبيق هذه القيمة عبر عمليات الدفع (push) والسحب (pop). يظهر الشريط عندما تكون هذه الخاصية وطلب `hidesBottomBarWhenPushed` الخاص بالمكدس المرئي كلاهما false. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | مكان الشريط: موضعه وحجمه. مظهره هو مظهر النظام، مع التبويب المختار بلون `primary` في السمة. |
| `testID` | `.test_id(..)` | `string` | لا شيء | يحدد موقع الشريط في الاختبارات و`nsh test --trace`. |

#### TabBarItem

| الحقل | Rust | النوع | الوصف |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | عنوان التبويب، وهو ما تنطقه قارئات الشاشة. |
| `icon` | `.icon(name)` | `string` | أيقونة التبويب، باسمها في المنصة: [SF Symbol](https://developer.apple.com/sf-symbols/) على iOS (`"house"`)، وملف drawable في التطبيق على Android (`res/drawable/home.xml` هو `"home"`، و`"android:ic_menu_search"` للنظام). تختار `platform.select` واحدة لكل منصة. |

<a id="events"></a>

### الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | اختار المستخدم تبويبًا: `{ index }` هو فهرسه. يعرض الشريط الاختيار فورًا؛ ثم يعرض التطبيق محتوى التبويب ويضبط `selectedIndex`. |

<a id="platform-notes"></a>

### ملاحظات المنصات

- **iOS وMac Catalyst**: `UITabBar`، بمظهر النظام الخاص بإصدار iOS: شريط Liquid Glass العائم وتحديده على iOS 26. الأيقونات هي SF Symbols. و`primary` في السمة هو `tintColor` للشريط، أي لون التبويب المختار؛ أما التبويبات الأخرى فتحتفظ بألوان النظام.
- **Android**: شريط التنقل في Material 3، مبني من عروض (views) المنصة: أيقونة داخل مؤشرها النشط فوق كل تسمية، وتأثير تموّج عند الضغط، وألوان النظام الديناميكية على Android 12 وما بعده وألوان Material الأساسية قبله، فاتحة أو داكنة بحسب مظهر التطبيق. وعند أسفل النافذة يمتد تحت شريط التنقل، فيزداد ارتفاعه بمقدار الإزاحة (inset)، كما في Material. الأيقونات هي ملفات drawable في التطبيق (يلوّنها الشريط). تأخذ أيقونة التبويب المختار وتسميته لون `primary` في السمة، فوق مؤشر نشط منه بشفافية 12%؛ أما التبويبات الأخرى فتحتفظ بألوان النظام.
- **أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب**: تُعرض الأقسام عبر [Tabs](../elements/tabs.md)، بمظهر التطبيق. ولا يشغل `TabBar` أي مساحة هناك، فيتسع تخطيط واحد للحالتين، ويُختار بواسطة `platform.os` ([واجهة الجهاز في `nsh`](./nsh.md#device)).

## InputAccessoryView

على iOS وMac Catalyst؛ أما على Android فهو عرض فارغ مخفي.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

شريط فوق لوحة المفاتيح (`inputAccessoryView` في UIKit)، يظهر أثناء تركيز حقل إدخال تطابق `ios={{ inputAccessoryViewID }}` فيه `nativeID`. في Rust: `input_accessory_view(native_id)`، ويظهر للحقول التي تطابق `.input_accessory(native_id)` فيها. عرضه بعرض النافذة وارتفاعه بارتفاع محتواه، ويتحرك مع لوحة المفاتيح محليًا.

| الخاصية | النوع | Rust | الوصف |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | الحقول التي لها `inputAccessoryViewID` هذا تُظهر الشريط. |
| `style` | `StyleProp<ViewStyle>` | دوال `Styled` (`.bg(…)`) | نمط الشريط (خلفيته مثلًا). |
| `class` | `string` | | فئات Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | محتوى الشريط. |

لا يرسم شيئًا في الموضع الذي يوضع فيه في الشجرة، ولا يرسم شيئًا إطلاقًا على Android، لذا يمكنك وضعه بجانب حقل الإدخال الذي يخصه.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

انظر أيضًا [النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md).

## BackHandler

على Android؛ أما على iOS فتُحفظ المستمعات ولا تُستدعى أبدًا، وتعود `exitApp()` فورًا.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

زر الرجوع في النظام وإيماءة الرجوع. تعالج مربعات الحوار ضغطة الرجوع أولًا (فيُغلق مربع الحوار)؛ ثم تعمل مستمعات `BackHandler`، الأحدث إضافةً أولًا؛ فإذا لم يعالجها أي منها، يُسحب مكدس التنقل العلوي، وإذا لم تبق صفحة للرجوع إليها يخرج التطبيق.

| العضو | Rust | الوصف |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | تعيد `listener` القيمة `true` عندما تعالج الضغطة. وتعيد دالة توقف الاستماع؛ والمستمع المضاف أثناء رسم مكوّن (أو تشغيل effect) يتوقف معه، في Rust وTSX على حد سواء. |
| `exitApp()` | يعيد المستمع `false` | يغادر التطبيق. والمستمع في Rust الذي يعيد `false` يدع الضغطة تتابع، فيرجع المكدس أو يخرج التطبيق. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> يعمل المستمع بعد أن يسلّم النظام الضغطة: فلا ينتظر الخيط الرئيسي كود التطبيق أبدًا. وما دام هناك مستمع واحد على الأقل مسجَّلًا، تتولى NSH ضغطات الرجوع التي تتركها مربعات الحوار، وترجع في المكدس العلوي أو تخرج من التطبيق بنفسها عندما لا يعيد أي مستمع `true`.

يُضبط شريط الحالة بواسطة `statusBar` في [الصفحات ومربعات الحوار](./nsh-base.md#status-bar) من `nsh/base`، على iOS وAndroid على حد سواء.
