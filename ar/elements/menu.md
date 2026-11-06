---
title: "Menu"
description: "Menu وContextMenu مع MenuItem وMenuSeparator وSubmenu: نافذة منبثقة مع قوائم فرعية متتالية على أجهزة سطح المكتب، وورقة (sheet) مع قوائم فرعية في مكانها على الهواتف، بتنسيق يحدده التطبيق."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

القائمة هي لائحة من الإجراءات يفتحها مشغّلها. بنية واحدة تخدم كل الأجهزة، وتُعرض كما يتوقعها كل جهاز:

- على أجهزة سطح المكتب ومتصفحاتها، نافذة منبثقة عند المشغّل؛ وتتفرع `Submenu` بجانب عنصرها عندما يمر المؤشر فوقه أو يضغط عليه.
- على الهواتف واللوحيات، ورقة سفلية في أسفل الشاشة فوق خلفية معتمة؛ وتعرض `Submenu` عناصرها في الورقة بدلاً من عناصر القائمة، مع صف من عندك يعيد المستخدم إلى الخلف.

يغلق القائمةَ اختيارُ عنصر، أو ضغطة خارجها، أو Escape، أو زر الرجوع في Android، أو إيماءة الخروج في VoiceOver. و`ContextMenu` هي القائمة نفسها تُفتح بالزر الثانوي (النقر بالزر الأيمن) عند المؤشر، أو بإصبع مضغوط على مشغّلها في الشاشات اللمسية.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, submenu};
use nsh_core::prelude::*;

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded_md()
        .child(text(label))
}

fn file_menu() -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .trigger(view().px_3().py_2().child(text("File")))
        .child(item("New", || log::info!("new")))
        .child(item("Open…", || log::info!("open")))
        .child(menu_separator().h(px(1.0)).my_1().bg(rgb(0xe5e7eb)))
        .child(
            submenu()
                .trigger(view().px_3().py_2().child(text("Share ›")))
                .back(view().px_3().py_2().child(text("‹ Back")))
                .child(item("Mail", || log::info!("mail")))
                .child(item("Copy link", || log::info!("link"))),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator, Submenu } from "nsh/base";

function Item(props: { label: string; onSelect: () => void }) {
  return (
    <MenuItem onSelect={props.onSelect} class="rounded-md px-3 py-2 hover:bg-gray-100 active:bg-gray-200">
      <Text>{props.label}</Text>
    </MenuItem>
  );
}

function FileMenu() {
  return (
    <Menu
      offset={4}
      popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg"
      backdropClass="bg-black/40"
      trigger={<View class="px-3 py-2"><Text>File</Text></View>}
    >
      <Item label="New" onSelect={newFile} />
      <Item label="Open…" onSelect={openFile} />
      <MenuSeparator class="my-1 h-px bg-gray-200" />
      <Submenu
        trigger={<View class="px-3 py-2"><Text>Share ›</Text></View>}
        back={<View class="px-3 py-2"><Text>‹ Back</Text></View>}
      >
        <Item label="Mail" onSelect={mail} />
        <Item label="Copy link" onSelect={copyLink} />
      </Submenu>
    </Menu>
  );
}
```

تأتي كلها الخمسة من [`nsh/base`](../modules/nsh-base.md). تصل العناصر إلى قائمتها من تلقاء نفسها، لذا يمكنك ترتيبها بحرية: مجموعات داخل views، وعناوين، وعناصر تظهر وتختفي باستخدام `If`. يتولى `popupClass` تنسيق النافذة المنبثقة على أجهزة سطح المكتب والورقة السفلية على الهواتف؛ وإذا اختلف التنسيق بينهما فيمكنه مقارنة `platform.idiom` (`nsh`) مع `"desktop"`.

## Menu bars

القوائم التي تكون مشغّلاتها عناصر في `Toolbar` واحد تشكّل شريط قوائم: فعندما تكون إحدى قوائمه مفتوحة، يؤدي مرور المؤشر فوق مشغّل قائمة أخرى إلى فتح تلك القائمة بدلاً منها، وتنقل مفاتيح الأسهم بين المشغّلات.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

## Context menus

```tsx
import { ContextMenu, MenuItem } from "nsh/base";

<ContextMenu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg"
  backdropClass="bg-black/40"
  trigger={<PhotoTile photo={photo} />}
>
  <MenuItem onSelect={() => share(photo)}><Text>Share</Text></MenuItem>
  <MenuItem onSelect={() => remove(photo)}><Text>Delete</Text></MenuItem>
</ContextMenu>
```

على أجهزة سطح المكتب يفتحها الزر الثانوي عند موضع المؤشر. وفي الشاشات اللمسية يفتحها إصبع مضغوط على المشغّل كورقة سفلية؛ وتبقى ضغطات المشغّل نفسه وشاشات التمرير المحيطة به تعمل، ويلغي تحريكُ الإصبع الضغطَ المطوّل.

## Checkable items

`checked` يجعل العنصر قابلاً للتحديد: إما إعداداً تعرضه القائمة ("إظهار الشريط الجانبي")، أو، مع `role="menuitemradio"`، خياراً واحداً من مجموعة ("الترتيب حسب"). القيمة بيدك: اختيار العنصر يستدعي `onSelect`، فتضبط أنت القيمة التالية، ويعرضها العنصر. وما دام محدداً تُطبَّق فئات `checked:` و`checkedStyle` الخاصة به، وكذلك فئات مؤشره: الجزء الذي يسبق محتواه (`indicatorClass`، `indicatorStyle`) المحيط بالعلامة التي تقدمها له (`indicator`). تُنشأ العلامة مرة واحدة وتبقى؛ وتُظهرها فئات `checked:` الخاصة بالمؤشر وتُخفيها، أو فئات `group-checked:` الخاصة بالعلامة نفسها مع `group` في `indicatorClass`. و`closeOnSelect={false}` يُبقي القائمة مفتوحة، فيظهر الإعداد بقيمته الجديدة فوراً.

```rust tabs
use nsh_base::{menu, menu_item};
use nsh_core::{element::StyleRefinement, prelude::*};

fn view_menu(sidebar: Signal<bool>, sort: Signal<&'static str>) -> impl IntoElement {
    // The indicator part shows the mark while the item is checked.
    let part = |s: StyleRefinement| s.w(px(16.0)).opacity(0.0).checked(|s| s.opacity(1.0));
    let by = move |label: &'static str| {
        menu_item()
            .role(AccessibilityRole::MenuItemRadio)
            .checked(move || Some(sort.get() == label))
            .indicator_style(part)
            .indicator(text("✓"))
            .on_select(move || sort.set(label))
            .flex_row()
            .gap_2()
            .px_3()
            .py_2()
            .child(text(label))
    };
    menu()
        .trigger(view().px_3().py_2().child(text("View")))
        .child(
            menu_item()
                .checked(move || Some(sidebar.get()))
                .close_on_select(false)
                .indicator_style(part)
                .indicator(text("✓"))
                .on_select(move || sidebar.set(!sidebar.get_untracked()))
                .flex_row()
                .gap_2()
                .px_3()
                .py_2()
                .child(text("Show sidebar")),
        )
        .child(by("Name"))
        .child(by("Date modified"))
}
```

```tsx tabs
import { Text, View, signal } from "nsh";
import { Menu, MenuItem } from "nsh/base";

// The indicator part shows the mark while the item is checked.
const part = "w-4 opacity-0 transition-opacity checked:opacity-100";

function ViewMenu() {
  const sidebar = signal(true);
  const sort = signal("Name");
  return (
    <Menu popupClass="min-w-48 rounded-lg bg-white p-1 shadow-lg" trigger={<View class="px-3 py-2"><Text>View</Text></View>}>
      <MenuItem
        checked={sidebar()}
        closeOnSelect={false}
        indicatorClass={part}
        indicator={<Text>✓</Text>}
        onSelect={() => sidebar.set(!sidebar())}
        class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
      >
        <Text>Show sidebar</Text>
      </MenuItem>
      <Each of={["Name", "Date modified", "Size"]}>
        {(by) => (
          <MenuItem
            role="menuitemradio"
            checked={sort() === by()}
            indicatorClass={part}
            indicator={<Text>✓</Text>}
            onSelect={() => sort.set(by())}
            class="flex-row gap-2 rounded-md px-3 py-2 hover:bg-gray-100 checked:font-semibold"
          >
            <Text>{by()}</Text>
          </MenuItem>
        )}
      </Each>
    </Menu>
  );
}
```

أما العلامة عند الحافة اللاحقة فتوضع في المحتوى بدلاً من ذلك، وتُنسَّق بفئات `group-checked:` تحت `group` على العنصر.

## Entrance and exit

على أجهزة سطح المكتب تظهر النافذة المنبثقة وتختفي بانتقالاتك، كما في [Popover](./popover.md#entrance-and-exit): `popupStartingClass` هو مظهرها في الإطار الأول، و`popupEndingClass` مظهرها بعد الإغلاق، وتحتفظ به أثناء تشغيل فئات `transition-*` الخاصة بـ`popupClass`، ثم يتبعه `onClose`. تأخذ القوائم الفرعية المظاهر نفسها وتُغلق مع قائمتها. أما ورقة الهواتف فتنزلق داخلة وخارجة من تلقاء نفسها.

```tsx
<Menu
  popupClass="min-w-40 rounded-lg bg-white p-1 shadow-lg transition-all duration-100"
  popupStartingClass="opacity-0 -translate-y-1"
  popupEndingClass="opacity-0"
  trigger={<Text>File</Text>}
>
  <MenuItem onSelect={newFile}><Text>New</Text></MenuItem>
</Menu>
```

## Open state

بدون `open`، تحتفظ القائمة بحالتها الخاصة (من `defaultOpen` لـ`Menu`). ومع `open`، يملك التطبيق الحالة ويغيّرها في `onOpenChange({ open, reason })`: `"triggerPress"`، `"select"`، `"pressOutside"`، `"backdropPress"`، `"cancel"`، `"contextMenu"` أو `"longPress"`.

## Props

<a id="menu-1"></a>

### Menu

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | لا شيء | مفتوحة، ويتحكم بها التطبيق. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | مفتوحة في البداية، بدون `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | أجهزة سطح المكتب: الجهة من المشغّل التي توضع فيها. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | أجهزة سطح المكتب: كيفية محاذاتها مع المشغّل. |
| `offset` | `.offset(..)` | `number` | `0` | أجهزة سطح المكتب: الفجوة بين المشغّل والنافذة المنبثقة. |
| `margin` | `.margin(..)` | `number` | `0` | أجهزة سطح المكتب: المسافة التي تحافظ عليها من حواف المنطقة الآمنة. |
| `popupClass`، `popupStyle` | `.popup_class(..)`، `.popup_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | النافذة المنبثقة (أجهزة سطح المكتب) أو الورقة السفلية (الهواتف)، ونوافذ القوائم الفرعية المنبثقة. |
| `popupStartingClass`، `popupStartingStyle` | `.popup_starting_class(..)`، `.popup_starting_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | أجهزة سطح المكتب: مظهر النوافذ المنبثقة في إطارها الأول، فوق مظهرها الخاص. |
| `popupEndingClass`، `popupEndingStyle` | `.popup_ending_class(..)`، `.popup_ending_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | أجهزة سطح المكتب: مظهر النوافذ المنبثقة بعد الإغلاق، ويبقى أثناء تشغيل انتقالاتها. |
| `backdropClass`، `backdropStyle` | `.backdrop_class(..)`، `.backdrop_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | الهواتف: الخلفية المعتمة خلف الورقة السفلية. |
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | ما يفتحها عند الضغط عليه. وما دامت القائمة مفتوحة تُطبَّق فئات `aria-expanded:` و`expandedStyle` الخاصة به. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | العناصر، وتُنشأ في كل مرة تُفتح فيها. |

### ContextMenu

`open`، `popupClass` / `popupStyle`، ومظهرا البداية والنهاية، و`backdropClass` / `backdropStyle`، و`trigger` و`children` كما في `Menu`، بالإضافة إلى:

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا يفعل الزر الثانوي ولا الأصابع المضغوطة شيئاً. |
| `offset` | `.offset(..)` | `number` | `0` | أجهزة سطح المكتب: الفجوة بين المؤشر والنافذة المنبثقة. |
| `margin` | `.margin(..)` | `number` | `0` | أجهزة سطح المكتب: المسافة التي تحافظ عليها من حواف المنطقة الآمنة. |

### MenuItem

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا يمكن اختياره؛ وتُطبَّق أنماط `disabled:`. |
| `checked` | `.checked(..)` | `boolean` | لا شيء | محدد أو غير محدد، مما يجعله عنصراً قابلاً للتحديد؛ ويملكه التطبيق. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمطه أثناء التحديد، بفئات `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` مع `checked`، وإلا `"menuitem"` | ما يكونه لقارئات الشاشة؛ و`"menuitemradio"` لخيار واحد من مجموعة. |
| `indicatorClass`، `indicatorStyle` | `.indicator_class(..)`، `.indicator_style(..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المؤشر، وهو الجزء الذي يسبق المحتوى؛ وتتبع فئات `checked:` و`disabled:` الخاصة به العنصر. |
| `indicator` | `.indicator(..)` | `JSX.Element` | لا شيء | العلامة داخل المؤشر. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | اختياره يغلق القائمة. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة، عندما لا يكفي المحتوى. |
| `children`، `class`، `style` | `.child(..)`، دوال التنسيق | | لا شيء | محتواه ومظهره، مع حالات `hover:` و`active:` و`checked:`. |

### Submenu

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | لا شيء | العنصر الذي يفتحها. |
| `back` | `.back(..)` | `JSX.Element` | لا شيء | الهواتف: الصف الذي يعلو عناصرها ويعيد إلى العناصر المحيطة بها. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا تُفتح. |
| `offset` | `.offset(..)` | `number` | `0` | أجهزة سطح المكتب: الفجوة بين القائمة المحيطة بها ونافذتها المنبثقة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | عناصرها. |

`MenuSeparator` هو view تنسّقه أنت (`class`، `style`)، ويُعرض مع عناصر مستواه.

## Events

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpenChange` (`Menu`، `ContextMenu`) | `.on_open_change(\|e\| ..)` | فُتحت أو أُغلقت، مع السبب. |
| `onOpen` (`Menu`، `ContextMenu`) | `.on_open(\|\| ..)` | ظهرت؛ وكورقة سفلية، بعد أن دخلت. |
| `onClose` (`Menu`، `ContextMenu`) | `.on_close(\|\| ..)` | اختفت: كورقة سفلية بعد أن خرجت، وكنافذة منبثقة بعد خروجها. وأيضاً عندما أغلقها التطبيق. |
| `onPosition` (`Menu`، `ContextMenu`) | `.on_position(\|e\| ..)` | أجهزة سطح المكتب: وُضعت النافذة المنبثقة: `placement` (الجهة التي وُضعت فيها)، `bounds`، `available`. |
| `onCancel` (`Menu`، `ContextMenu`) | `.on_cancel(\|\| ..)` | حاول المستخدم إغلاقها دون اختيار (Escape أو الرجوع، أو ضغطة خارجها أو على الخلفية المعتمة). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | اختير العنصر؛ ويطلب العنصر القابل للتحديد قيمته الأخرى. |

## Accessibility

تُعد النافذة المنبثقة أو الورقة السفلية قائمة، وعناصرها عناصر قائمة لدى قارئات الشاشة؛ ويُعلِم المشغّل ما إذا كانت القائمة موسّعة. والعنصر القابل للتحديد عنصر قائمة من نوع خانة اختيار أو زر راديو، ويُقرأ كمحدد أو غير محدد؛ ومؤشره جزء من العنصر. في TSX يكون المشغّل هو العنصر الذي تمرره، أي `Button` أو view من عندك: فهو يتولى الضغطات وحالة التوسيع بنفسه، لذا تظهر فئات `active:` و`activeStyle` الخاصة به أثناء الضغط عليه، ويعمل `onPress` الخاص به أيضاً. لا يظهر على الشاشة سوى عناصر المستوى المعروض، فتقرأ قارئات الشاشة ما هو موجود فيه.
