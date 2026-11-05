---
title: "لوحة المفاتيح"
description: "متغير البيئة keyboard-inset-height، والدالة Keyboard.dismiss، وارتفاع لوحة المفاتيح: إبقاء المحتوى فوق لوحة المفاتيح البرمجية وتحريكه معها."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# لوحة المفاتيح

`env(keyboard-inset-height)` هو ارتفاع لوحة المفاتيح البرمجية فوق السطح، وقيمته 0 عندما تكون مخفية. عند استخدامه كحشو (padding) سفلي أو هامش (margin) سفلي للعرض (view)، فإنه يُبقي المحتوى فوق لوحة المفاتيح: عندما تظهر لوحة المفاتيح أو تختفي، يفسح العرض مساحة بمقدار ارتفاعها، ويتحرك التغيير بحركة متزامنة مع لوحة المفاتيح بشكل أصلي. استخدمه للمحتوى الواقع خارج عروض التمرير (scroll views)، مثل شريط الرسائل في أسفل شاشة الدردشة؛ أما حقول الإدخال داخل [عرض تمرير](./scroll.md) أو [List](./list.md) فيتم تمريرها إلى مجال الرؤية بشكل أصلي. ويأتي معه `Keyboard.dismiss()` الذي يخفي لوحة المفاتيح، وارتفاع لوحة المفاتيح، لاستخدامهما في التخطيطات الخاصة بك.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

يناسب ارتفاع لوحة المفاتيح الكامل عرضًا يصل إلى أسفل الشاشة، كما هو الحال مع محتوى الشاشة. وعندما يكون هناك شيء أسفله، مثل شريط علامات التبويب (tab bar)، اطرح ذلك بواسطة طول: `calc(env(keyboard-inset-height) + -49px)` يُبقي العرض فوق شريط علامات تبويب بارتفاع 49 pt، و`calc(env(keyboard-inset-height) + 12px)` يضيف مسافة فوق لوحة المفاتيح. أما الحشو فلا تقل قيمته عن 0.

<a id="padding-or-margin"></a>

## الحشو أو الهامش

| النمط | كيف يفسح المساحة |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (في Tailwind `pb-[env(keyboard-inset-height)]`، وفي Rust `.pb_keyboard()`) | يتقلص المحتوى الذي في الأعلى؛ وتظل الخلفية ممتدة إلى أسفل الشاشة. |
| `marginBottom: "env(keyboard-inset-height)"` (في Tailwind `mb-[env(keyboard-inset-height)]`، وفي Rust `.mb_keyboard()`) | ينتهي العرض بأكمله، بما في ذلك خلفيته، عند أعلى لوحة المفاتيح. |

يُضاف ارتفاع لوحة المفاتيح إلى الطول في التصريح نفسه فقط، لذلك يجمع العرض بينه وبين المسافات الخاصة به في `calc()`. وفي Rust، تضيف `.pb_keyboard_plus(px(..))` و`.mb_keyboard_plus(px(..))` طولًا.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

هنا يغطي شريط علامات التبويب البالغ ارتفاعه 49 pt أسفل العرض جزءًا من ارتفاع لوحة المفاتيح أصلًا. لإيقاف إفساح المساحة، احذف المتغير من النمط، مثلًا بواسطة شرط على إشارة (signal).

<a id="hiding-the-keyboard"></a>

## إخفاء لوحة المفاتيح

`Keyboard.dismiss()` من `nsh` يزيل التركيز عن حقل الإدخال الذي عليه التركيز، مما يخفي لوحة المفاتيح. وإذا لم يكن أي حقل إدخال عليه التركيز، فإنه يترك كل شيء كما هو. تستدعي مكونات Rust الدالة `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> لإخفاء لوحة المفاتيح عندما يسحب المستخدم عرض التمرير، اضبط `keyboardDismissMode="on-drag"` أو `"interactive"` على [عرض التمرير](./scroll.md) أو [List](./list.md).

<a id="the-keyboards-height"></a>

## ارتفاع لوحة المفاتيح

| TSX | Rust | القيمة المُعادة |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`، `keyboard_duration()` | ارتفاع لوحة المفاتيح البرمجية فوق سطح NSH بالنقاط (0 عندما تكون مخفية)، ومدة حركة ظهورها أو اختفائها بالميلي ثانية. |

كلاهما تفاعلي (reactive): أي تأثير (effect) أو تعبير JSX أو دالة نمط (style closure) تقرؤهما يُعاد تشغيلها عندما تظهر لوحة المفاتيح أو تختفي أو يتغير ارتفاعها.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

الارتفاع هو الجزء من لوحة المفاتيح الذي يتداخل مع سطح NSH. وعندما تتقلص النافذة نفسها بسبب لوحة المفاتيح (نشاط Android يغيّر حجمه)، أو عندما يكون NSH مضمّنًا في عرض ينتهي فوق لوحة المفاتيح، يكون الارتفاع 0.

> [!NOTE]
> للإبقاء على المحتوى فوق لوحة المفاتيح، يُعد `env(keyboard-inset-height)` الصيغة الأبسط: فهو يتحرك مع لوحة المفاتيح بشكل أصلي، دون تشغيل أي شيفرة.

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- **iOS**: تتحرك المساحة المفسوحة بمدة لوحة المفاتيح نفسها ومنحنى تسارع وتباطؤ (ease-in-ease-out).
- **Android**: حيثما تتقلص النافذة بسبب لوحة المفاتيح (نشاط يغيّر حجمه)، ينتهي المحتوى أصلًا فوق لوحة المفاتيح ويكون المتغير 0. وحيثما تتداخل لوحة المفاتيح مع العرض، فإنه يفسح المساحة كما في iOS.
- **أنظمة سطح المكتب وMac Catalyst** تعتمد الكتابة بلوحة مفاتيح فعلية: يكون المتغير 0 ويحتفظ العرض بتخطيطه.
- **الويب**: المتغير هو المتغير الخاص بالمتصفح (الخاص بواجهة VirtualKeyboard API).

راجع [النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md) لمعرفة ترتيب التركيز ومفاتيح الإرجاع وملحقات الإدخال، و[المنطقة الآمنة](./safe-area.md) لمتغيرات البيئة الأخرى.
