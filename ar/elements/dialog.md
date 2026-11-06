---
title: "Dialog"
description: "مكوّن Dialog: سطح مشروط (Modal) يظهر فوق كل ما عداه، ويُستخدم لتدفقات الشاشة الكاملة والأوراق السفلية (sheets) ومربعات الحوار التي يتولى التطبيق تنسيقها."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

يعرض الـ dialog المحتوى فوق بقية التطبيق في طبقة نافذة أصلية خاصة به: view controller معروض على iOS وMac Catalyst، وDialog على Android، وطبقة فوق النافذة كاملةً على أنظمة سطح المكتب والويب. يُستخدم في التدفقات بملء الشاشة وفي الـ sheets والـ dialogs. تعمل إيماءات النظام نفسها (سحب الـ sheet للأسفل، وزر الرجوع في Android، ومفتاح Escape)، ويُبتّ فيها أصلياً. يُنشئه Rust بواسطة `nsh_base::dialog()`، وTSX بواسطة `<Dialog>` من `nsh/base`.

يملك الـ dialog سلوكه ويترك مظهره للتطبيق: تنسّق أنماطه الـ popup (الـ view الذي يحتوي العناصر الفرعية)، وفي TSX تضيف `backdropClass` / `backdropStyle` خلفية (backdrop) خلفه.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

في TSX، يُعرض الـ dialog ما دامت `open` ليست `false` ويُغلق عندما تصبح `false`. وفي Rust، يُعرض ما دام موجوداً في الـ view ويُغلق عندما يغادره، ولذلك يحتفظ به `when`. وفي الحالتين يمرّر إلى محتواه هوامش المنطقة الآمنة (safe-area insets) الخاصة بالـ dialog، وتقرؤها المتغيرات [`env(safe-area-inset-*)`](./safe-area.md) و`safeAreaInsets()` (`cx.insets()` في مكوّن Rust) داخله. أما [`Button`](./button.md)، وهو أيضاً من `nsh/base`، فهو هدف ضغط ينسّقه التطبيق.

يملك `nsh_core::prelude` أيضاً دالة `dialog` أقدم وهي مهجورة: استورد `nsh_base::dialog` بالاسم، كما في الأعلى، ويحلّ الاستيراد الصريح محلها. أما لعرض alert أو action sheet الخاص بالنظام، فاستخدم [`AlertDialog`](./alert-dialog.md).

## Props

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `open` | في الـ view ما دام مفتوحاً (`when(open, ..)`) | `boolean` | `true` | يُعرض ما دامت القيمة true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | كيفية ظهوره واختفائه. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | لا شيء | يظهر ويختفي عبر WGSL shader بدلاً من `animation`: يقرأ `shade(uv)` ما خلفه بوصفه `sample_from` والـ dialog بوصفه `sample_to` بينما يتدرج `nsh.progress` من 0 إلى 1 خلال `duration` ميلي ثانية (350 افتراضياً)، ومن 1 إلى 0 عند الإغلاق. وعندما يطلب النظام حركة أقل، يستخدم `animation` الخاص به. انظر [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | شكله على iOS: يغطي `fullScreen` الشاشة بخلفية شفافة؛ أما `pageSheet` و`formSheet` فهما sheets من النظام تُبقي ما خلفها ظاهراً (`formSheet` هو sheet أصغر في المنتصف على الشاشات الكبيرة). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | يغلقه مفتاح Escape وزر الرجوع في Android أصلياً. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | يغلقه الضغط على الخلفية (backdrop). |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | يغلقه سحب الـ sheet للأسفل (على iOS ومتصفحات الهواتف) أصلياً. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | لا شيء | على iOS وAndroid: شريط الحالة ما دام الـ dialog مفتوحاً، ويتغلب على شريط حالة الصفحات ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | انتهى ظهوره. |
| `onClose` | `.on_close(..)` | `() => void` | | اختفى: أغلقه المستخدم، أو أزاله التطبيق. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | حاول المستخدم إغلاقه (Escape، أو الرجوع، أو الضغط على الخلفية، أو السحب للأسفل)، سواء سمح له بذلك أحد أعلام `closeOn*` أم لا. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | أغلقه المستخدم: أبقِ `open` متزامناً هنا. في Rust، تزيل `on_cancel` الـ dialog من الـ view. |
| `class`، `style` | دوال `Styled` | `string`، `StyleProp<ViewStyle>` | | الـ popup: الـ view الذي يحتوي العناصر الفرعية. |
| `backdropClass`، `backdropStyle` | view فرعي يملأ الـ dialog | `string`، `StyleProp<ViewStyle>` | | خلفية (backdrop) تملأ الـ dialog خلف الـ popup، وتوجد عند ضبط أي منهما. |
| `children` | `.child(..)` | `JSX.Element` | | المحتوى. |

| مفتاح `ios` | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | قيمة الـ presenter | الاتجاهات التي يسمح بها الـ dialog. |

| مفتاح `android` | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | يمتد المحتوى تحت شريط الحالة؛ وإلا فيبدأ أسفله. |

<a id="opening-and-closing"></a>

## الفتح والإغلاق

حالة الـ dialog يملكها التطبيق. عندما يغلق المستخدم الـ dialog (Escape، أو زر الرجوع في Android، أو الضغط على الخلفية، أو سحب الـ sheet للأسفل)، يُغلق أصلياً ويُبلغ التطبيق، فيضبط التطبيق حالته لتطابق ذلك: `onOpenChange({ open: false, reason })` في TSX، و`on_cancel` في Rust. في TSX، ما دامت `open` تبقى `true` يبقى الـ dialog مغلقاً، ويُفتح مجدداً عندما تتحول `open` من `false` إلى `true`.

يُقرأ كل علم `closeOn*` أصلياً عند تصرف المستخدم، لأن الخيط الرئيسي لا ينتظر شيفرة التطبيق أبداً. وللتأكيد قبل الإغلاق، اضبط الأعلام على `false`: عندها تستدعي المحاولة `onCancel`، ويغلق التطبيق الـ dialog بنفسه (في TSX بضبط `open` على `false`، وفي Rust بإخراجه من الـ view):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

يُستدعى `onCancel` في كل محاولة، سواء سمحت الأعلام للـ dialog بالإغلاق أم لا.

<a id="a-dialog-with-a-backdrop"></a>

## dialog مع خلفية (backdrop)

يعرض الـ dialog ذو العرض الافتراضي `fullScreen` ما يرسمه التطبيق: هنا خلفية معتمة وبطاقة في منتصفها. ويغلقه الضغط على الخلفية:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

لعرض alert أو action sheet الخاص بالنظام، استخدم [`AlertDialog`](./alert-dialog.md) من `nsh/base`.

<a id="ref-methods"></a>

## دوال Ref

لا شيء.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وMac Catalyst: يحدد `presentation` الشكل. يُعرض `fullScreen` فوق الشاشة كاملةً بخلفية شفافة؛ أما `pageSheet` و`formSheet` فهما sheets من النظام بخلفية النظام، وتتبعان الإصبع عند سحبهما للأسفل (`closeOnSwipe`).
- Android: يملأ الـ dialog النافذة ويعرض popup التطبيق وخلفيته. يذهب زر الرجوع إلى الـ dialog الأعلى أولاً، قبل الـ stacks ومستمعي `BackHandler`.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الـ dialog طبقة شفافة فوق النافذة كاملةً تعرض popup التطبيق وخلفيته. ويُعدّ Escape محاولة إغلاق.
- `supportedOrientations` خاص بـ iOS؛ و`statusBarTranslucent` خاص بـ Android. يبدأ محتوى الـ dialog على Android أسفل شريط الحالة ما لم يُضبط `statusBarTranslucent`.
