---
title: "ColorPicker"
description: "مكوّن ColorPicker وأجزاؤه: لون يُختار من منطقة التشبّع والسطوع، ومن شرائح تمرير لأي قناة من قنوات RGB أو HSL أو HSB أو OKLCH ولقناة الشفافية (alpha)، أو يُكتب بأي صيغة من صيغ CSS، أو يُحدَّد من عينات الألوان، أو يُلتقط من الشاشة باستخدام أداة قطّارة الألوان، مع دعم مفاتيح WAI-ARIA والعناصر القابلة للتعديل لقارئات الشاشة، ويتولى التطبيق تخطيطه وتنسيقه."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

يحمل منتقي اللون لونًا واحدًا، وتعرضه الأجزاء الموجودة بداخله وتغيّره: `ColorArea` للتشبع والسطوع، و`ColorSlider` لأي قناة من RGB أو HSL أو HSB أو OKLCH وللألفا، و`ColorField` تأخذ اللون كنص أو قناة واحدة كرقم، و`ColorSwatch` للألوان المعدّة مسبقًا، و`ColorEyeDropper` يلتقط لونًا من أي مكان على الشاشة. ينسّق التطبيق الأجزاء بعناصره الخاصة فيما بينها (صف لكل قناة مع حرفها، والفضاء الذي يُختار بـ`Tabs`، والمنتقي داخل `Popover`)، ويتولى تنسيق كلٍّ منها: ترسم الأجزاء ألوان القنوات، أما كل حجم ونصف قطر وحدّ وظل فيعود إلى التطبيق.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker` و`ColorArea` و`ColorSlider` و`ColorField` و`ColorSwatch` و`ColorEyeDropper` تأتي من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` في Rust. في Rust، تُنشئها الدالة `color_picker()` ودوال أجزائها باستخدام دالة ضبط لكل خاصية (`.channel(..)`، `.thumb_style(..)`)، ودالة مستمع لكل حدث (`.on_change(..)`)، ودوال التنسيق المُنمَّطة؛ واللون هو `Hsla`، والفضاءات والقنوات والصيغ هي `ColorSpace` و`ColorChannel` و`ColorFormat`.

<a id="value"></a>

## القيمة

اللون هو لون CSS: hex (`#3b82f6`، `#3b82f680` مع ألفاه)، أو `rgb()` أو `hsl()` أو `hsb()` أو `oklch()` أو اسم CSS؛ وفي Rust هو `Hsla`. يملكه التطبيق باستخدام `value` ويضبط القيمة التي يبلّغ عنها `onChange`، كما في كل عنصر تحكم في `nsh/base`؛ أو يترك اللون للمنتقي باستخدام `defaultValue` ومع ذلك يسمع التغييرات.

- يبلّغ `onChange({ value, formatted })` عن كل لون يطلبه المستخدم: عند كل خطوة من سحب على المنطقة أو شريط التمرير، ولكل ضغطة مفتاح، ولرقم حقل أثناء كتابته، وعند الضغط على عيّنة. `value` هو اللون، و`formatted` هو اللون نفسه مكتوبًا بالصيغة التي يحددها `format` (`"hex"`، `"rgb"`، `"hsl"`، `"hsb"` أو `"oklch"`)، جاهزًا للحفظ أو للضبط كـ token.
- يبلّغ `onChangeEnd({ value, formatted })` عن اللون الذي انتهى عنده التغيير، مرة واحدة: عند رفع المؤشر، وبعد كل مفتاح، وعند مغادرة حقل أو إرساله، وعند الضغط على عيّنة.
- يحتفظ المنتقي باللون في كل فضاء كما ضبطه المستخدم. يحتفظ الرمادي بصبغته وتشبعه، فيبقى شريط الصبغة حيث تركه المستخدم؛ واللون المحرَّر في OKLCH يحتفظ بإضاءته وكرومته وصبغته كما كُتبت، حتى فيما يتجاوز ما يعرضه sRGB (اللون المبلَّغ عنه هو الأقرب إلى ما يعرضه sRGB، و`formatted` في `"oklch"` يحتفظ بالقنوات).
- أي `value` يضبطه التطبيق ولم يبلّغ عنه المنتقي يستبدل اللون في كل الفضاءات.

<a id="spaces-and-channels"></a>

## الفضاءات والقنوات

| `colorSpace` | القنوات (`channel`) | المدى |
|---|---|---|
| `"rgb"` | `"red"`، `"green"`، `"blue"` | من 0 إلى 255 |
| `"hsl"` | `"hue"`، `"saturation"`، `"lightness"` | الصبغة من 0 إلى 360، والبقية من 0 إلى 100 |
| `"hsb"` | `"hue"`، `"saturation"`، `"brightness"` | الصبغة من 0 إلى 360، والبقية من 0 إلى 100 |
| `"oklch"` | `"lightness"`، `"chroma"`، `"hue"` | الإضاءة من 0 إلى 100 (بخطوة 0.1)، والكروما من 0 إلى 0.4 (بخطوة 0.001)، والصبغة من 0 إلى 360 (بخطوة 0.1) |
| أي فضاء | `"alpha"` | من 0 إلى 100 |

يرسم مسار الشريط ألوان قناته مع تثبيت القنوات الأخرى، فيُظهر إلى أين تقود كل قيمة. أما القناة التي لا يملكها الفضاء فتُستبدل بأولى قنوات الفضاء (ويُصدر تحذير بذلك).

<a id="props"></a>

## الخصائص

<a id="colorpicker-1"></a>

### ColorPicker

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | لا شيء | اللون (متحكَّم به). يضبط التطبيق القيمة التي يبلّغ عنها `onChange`. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | اللون الأولي ما دام `value` غير مضبوط؛ ويحتفظ المنتقي حينئذٍ بلونه الخاص. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | الكيفية التي يكتب بها `formatted` اللون. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تغييرات من أي جزء؛ وتُطبَّق فئات `disabled:` على المنتقي وأجزائه. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | الأجزاء وعناصر التطبيق التي بينها. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المنتقي نفسه: العمود (أو الصف) المحيط بأجزائه. |

### ColorArea

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `panelClass`، `panelStyle` | `.panel_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | اللوحة التي تملأ المنطقة: ألوان الصبغة، والتشبع من اليسار إلى اليمين (ومن اليمين إلى اليسار في التخطيط من اليمين إلى اليسار)، والسطوع من الأسفل إلى الأعلى، مقصوصة عند زواياها. |
| `thumbClass`، `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المقبض، متمركز على اللون. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | خلفية المقبض هي اللون. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تغييرات بالمؤشر أو لوحة المفاتيح أو قارئ الشاشة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للمقبض. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المنطقة: حجمها من اختيار التطبيق. |

### ColorSlider

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | فضاء القناة. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | القناة التي يغيّرها: إحدى قنوات الفضاء، أو `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | اتجاه المسار: أصغر قيمة عند البداية (اليسار، واليمين في التخطيط من اليمين إلى اليسار)، أو عند الأسفل. تُقرأ عند إنشاء الشريط. |
| `trackClass`، `trackStyle` | `.track_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المسار: ألوان القناة على امتداده، مقصوصة عند زواياها؛ ويوضع المقبض عليه. |
| `thumbClass`، `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المقبض، متمركز على القيمة. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | خلفية المقبض هي اللون (مع ألفاه في شريط الألفا). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | لا شيء | لون رقعة شطرنج تحت المسار، تظهر من خلال ألوان شريط الألفا. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | ضلع مربعات رقعة الشطرنج. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تغييرات بالمؤشر أو لوحة المفاتيح أو قارئ الشاشة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للمقبض. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الشريط: النطاق المحيط بالمسار الذي يستقبل الضغطات والسحب. |

### ColorField

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | لا شيء | القناة التي يأخذها كرقم. وبدونها يأخذ الحقل اللون كاملًا كنص. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | فضاء `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | الكيفية التي يكتب بها الحقل اللون كاملًا. ويقرأ أي صيغة CSS. |
| `placeholder` | `.placeholder(..)` | `string` | لا شيء | يظهر ما دام الحقل فارغًا. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا كتابة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة للحقل. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<TextStyle>` | لا شيء | الحقل، وهو مُدخل نصي. |

يغيّر حقل القناة اللون أثناء كتابة الرقم، مع تقييده بمدى القناة؛ أما حقل اللون كاملًا فيغيّره عند مغادرة الحقل أو إرساله، إذا كان النص يُقرأ كلونًا. ومغادرة الحقل تعيد كتابة قيمته بصيغته.

### ColorSwatch

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | لا شيء | اللون الذي تعرضه؛ والضغط عليها يختاره في المنتقي المحيط بها. وبدونه تعرض لون المنتقي نفسه: معاينة. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | لا شيء | التنسيق حين تكون بلون المنتقي، على هيئة فئات `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | لا شيء | رقعة شطرنج تحت اللون الشفاف. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | ضلع مربعاتها. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | اللون بصيغة hex | ما تنطق به قارئات الشاشة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | محتوى فوق اللون: علامة صح على العيّنة المحددة (`group-selected:`). |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | العيّنة: حجمها وشكلها وحدّها؛ وتقصّ زواياها اللون. |

### ColorEyeDropper

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات. ويكون معطّلًا أيضًا حيث لا تتوفر قطّارة ألوان في المنصة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | محتواه: أيقونة التطبيق أو تسميته. |
| `class`، `style` | دوال التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | الزر. |

يعرض الضغط قطّارة الألوان الخاصة بالنظام: أداة أخذ العينات اللونية في AppKit على macOS، و`EyeDropper` في المتصفح على الويب (Chrome وEdge). يصبح اللون المختار لون المنتقي (`onChange`، ثم `onChangeEnd`)؛ ولا يختار Escape أي لون. وحيث لا تتوفر قطّارة في المنصة يكون الزر معطّلًا، ويخفيه `disabled:hidden` هناك.

<a id="events"></a>

## الأحداث

| الحدث | على | Rust | الحمولة | المتى |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | غيّر المستخدم اللون. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | انتهى التغيير. مرة واحدة لكل تغيير. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | ضُغطت العيّنة؛ ويعمل أيضًا منفردًا، كرقاقة في لوحة ألوان. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | اختار المستخدم لونًا من الشاشة؛ ويعمل أيضًا منفردًا. |

في Rust، يحمل `ColorPickerEvent::Change(Hsla, SharedString)` و`ColorPickerEvent::ChangeEnd(Hsla, SharedString)` اللون ونصّه بصيغة `formatted`.

<a id="parts"></a>

## الأجزاء

| الجزء | بداخل | يُنسَّق بـ |
|---|---|---|
| `ColorArea` | المنتقي | `class`، `style` |
| لوحة المنطقة | المنطقة، تملؤها | `panelClass`، `panelStyle` |
| مقبض المنطقة | المنطقة، متمركز على اللون | `thumbClass`، `thumbStyle` |
| `ColorSlider` | المنتقي | `class`، `style` |
| مسار الشريط | الشريط | `trackClass`، `trackStyle` |
| مقبض الشريط | الشريط، متمركز على القيمة على المسار | `thumbClass`، `thumbStyle` |
| `ColorField` | المنتقي | `class`، `style` |
| `ColorSwatch` | المنتقي، أو منفردة | `class`، `style`، `selectedStyle` |
| `ColorEyeDropper` | المنتقي، أو منفردة | `class`، `style` |

يتمركز مقبض الشريط على طرفي المسار عند طرفي القناة. وحشوة على الشريط بمقدار نصف عرض المقبض (`h-6 justify-center px-2.5` حول مسار `h-3`) تُبقي المقبض كاملًا داخل الشريط، حيث يستقبل الضغطات عند الطرفين. أما الحالات التي تعرضها الأجزاء فهي: `active:` للمقبض أثناء سحبه و`focus:` عند وجود تركيز لوحة المفاتيح عليه، و`selected:` للعيّنة، و`disabled:` لكل جزء.

<a id="keyboard"></a>

## لوحة المفاتيح

على macOS والويب يكون كل مقبض نقطة توقف لتركيز لوحة المفاتيح (Tab):

| المفتاح | على الشريط | على المنطقة |
|---|---|---|
| السهم الأيمن، السهم الأعلى | خطوة واحدة للأعلى | الأيمن: تشبع أكثر؛ الأعلى: سطوع أكثر |
| السهم الأيسر، السهم الأسفل | خطوة واحدة للأسفل | الأيسر: تشبع أقل؛ الأسفل: سطوع أقل |
| Shift مع سهم | عشر خطوات | عشر خطوات |
| Page Up، Page Down | عشر خطوات | عشر خطوات من السطوع |
| Home، End | طرفا القناة | |

في التخطيط من اليمين إلى اليسار يمتد الشريط الأفقي والمنطقة من اليمين، وتكون أصغر قيمة (أقل تشبع) عند الطرف الأيمن: السهم الأيسر خطوة للأعلى والسهم الأيمن خطوة للأسفل، والضغط أو السحب يختار القيمة تحت المؤشر كما هي مرسومة. أما الشريط العمودي فيُبقي السهم الأيمن والسهم الأعلى خطوةً للأعلى؛ ويُبقي السهمان الأعلى والأسفل على المنطقة السطوع.

تستجيب العيّنة لـ Space وReturn. يبلّغ كل مفتاح عن `onChange` ثم `onChangeEnd`؛ وتتكرر الأسهم أثناء الإبقاء عليها مضغوطة.

<a id="accessibility"></a>

## إمكانية الوصول

- مقبض المنطقة ومقبض كل شريط عنصران قابلان للضبط (`"adjustable"`، وهو slider في المتصفح) مع تسميتهما وقيمتهما ومداهما؛ وتؤدي أوامر الزيادة والنقصان في قارئات الشاشة إلى تحريكهما خطوة خطوة.
- كل حقل هو حقل نصي مع تسميته؛ وكل عيّنة زر، محددة ما دامت لون المنتقي، وتُسمّى بلونها بصيغة hex ما لم يسمّها `accessibilityLabel`. أما قطّارة الألوان فهي زر بتسمية من التطبيق.
- أثناء التعطيل، تذكر قارئات الشاشة أن الأجزاء معتّمة، ولا تقبل أي إجراءات.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإجراءات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- ترسم كل منصة ما ينسّقه التطبيق؛ وألوان المسارات واللوحة هي تدرجات ترسمها المنصة. تُتابَع الضغطات والسحب في النواة، للفأرة أو القلم أو الإصبع، ويقتصر التمرير في عرض التمرير المحيط بالمنتقي على السحب الذي يبدأ في مكان آخر.
- يلتقط `ColorEyeDropper` اللون بأداة أخذ العينات اللونية في AppKit على macOS وبـ`EyeDropper` في المتصفح على الويب؛ ويصل اللون بصيغة sRGB.
