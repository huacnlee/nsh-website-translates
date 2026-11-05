---
title: "Menu"
description: "MenuItem, MenuSeparator और Submenu के साथ Menu और ContextMenu: डेस्कटॉप पर कैस्केडिंग सबमेनू वाला पॉपअप, फ़ोन पर सबमेनू को उसी जगह दिखाने वाली शीट, जिसे ऐप स्टाइल करता है।"
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

Menu कार्रवाइयों की एक सूची है, जिसे उसका trigger खोलता है। एक ही संरचना हर डिवाइस पर काम करती है और हर डिवाइस की अपेक्षा के अनुसार दिखाई जाती है:

- डेस्कटॉप और डेस्कटॉप ब्राउज़र पर, trigger के पास एक popup दिखता है। `Submenu` अपने आइटम के बगल में cascade होता है, जब pointer उस पर आता है या उसे दबाता है।
- फ़ोन और टैबलेट पर, स्क्रीन के नीचे backdrop के ऊपर एक sheet दिखती है। `Submenu` अपने आइटम menu के आइटम की जगह sheet में दिखाता है, और आपकी एक पंक्ति वापस ले जाती है।

कोई आइटम चुनने, बाहर दबाने, Escape, Android के back बटन और VoiceOver के escape gesture से menu बंद हो जाता है। `ContextMenu` वही menu है, जो secondary बटन (right click) से pointer पर खुलता है, या टच स्क्रीन पर उसके trigger पर उँगली दबाए रखने से खुलता है।

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

पाँचों [`nsh/base`](../modules/nsh-base.md) से आते हैं। आइटम अपने menu तक अपने आप पहुँच जाते हैं, इसलिए आप उन्हें अपनी मर्ज़ी से व्यवस्थित कर सकते हैं: views में समूह, लेबल, और `If` से आने-जाने वाले आइटम। `popupClass` डेस्कटॉप पर popup और फ़ोन पर sheet को स्टाइल करता है। जिस स्टाइल को दोनों पर अलग दिखना हो, वह `platform.idiom` (`nsh`) की तुलना `"desktop"` से कर सकता है।

## Menu bars

जिन menus के trigger एक ही `Toolbar` के आइटम हैं, वे मिलकर menu bar बनाते हैं। इनमें से एक menu खुला होने पर, किसी दूसरे menu के trigger पर pointer ले जाने से वह menu उसकी जगह खुल जाता है, और arrow keys से triggers के बीच जाया जा सकता है।

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

डेस्कटॉप पर secondary बटन इसे वहाँ खोलता है जहाँ pointer है। टच स्क्रीन पर trigger पर उँगली दबाए रखने से यह sheet के रूप में खुलता है। trigger के अपने press और आसपास के scroll views काम करते रहते हैं, और उँगली हिलाने से दबाए रखना रद्द हो जाता है।

## Checkable items

`checked` किसी आइटम को checkable बनाता है। यह menu में दिखने वाली एक सेटिंग ("Show sidebar") हो सकती है, या `role="menuitemradio"` के साथ किसी समूह ("Sort by") का एक विकल्प। मान आपका है: आइटम चुनने पर `onSelect` चलता है, आप अगला मान सेट करते हैं, और आइटम उसे दिखाता है। जब तक वह checked है, उसकी `checked:` classes और `checkedStyle` लागू रहते हैं, और उसके indicator की भी: यानी उसकी सामग्री से पहले का वह भाग (`indicatorClass`, `indicatorStyle`) जो आपके दिए निशान (`indicator`) को घेरता है। निशान एक बार बनता है और बना रहता है। indicator की `checked:` classes उसे दिखाती और छिपाती हैं, या `indicatorClass` में `group` के साथ निशान की अपनी `group-checked:` classes ऐसा करती हैं। `closeOnSelect={false}` menu को खुला रखता है, ताकि सेटिंग का नया मान तुरंत दिखे।

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

पिछले किनारे पर निशान चाहिए तो वह सामग्री में जाता है, और उसे आइटम पर `group` के अंतर्गत `group-checked:` classes से स्टाइल किया जाता है।

## Entrance and exit

डेस्कटॉप पर popup आपके transitions के साथ आता-जाता है, ठीक [Popover](./popover.md#entrance-and-exit) की तरह: `popupStartingClass` उसका पहले frame का रूप है, `popupEndingClass` बंद होने के बाद का रूप है, जो `popupClass` की `transition-*` classes चलने तक बना रहता है, और उसके बाद `onClose` आता है। Submenus यही रूप लेते हैं और अपने menu के साथ बंद होते हैं। फ़ोन की sheet अपने आप स्लाइड होकर आती और जाती है।

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

`open` के बिना, menu अपनी state खुद रखता है (`Menu` के लिए `defaultOpen` से)। `open` के साथ, state ऐप की होती है और वह उसे `onOpenChange({ open, reason })` में बदलता है: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` या `"longPress"`।

## Props

<a id="menu-1"></a>

### Menu

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | कोई नहीं | खुला है या नहीं, ऐप द्वारा नियंत्रित। |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | शुरू में खुला, `open` के बिना। |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | डेस्कटॉप: trigger की किस ओर यह जाता है। |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | डेस्कटॉप: यह trigger के साथ कैसे संरेखित होता है। |
| `offset` | `.offset(..)` | `number` | `0` | डेस्कटॉप: trigger और popup के बीच की दूरी। |
| `margin` | `.margin(..)` | `number` | `0` | डेस्कटॉप: safe area के किनारों से यह जितनी दूरी रखता है। |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | popup (डेस्कटॉप) या sheet (फ़ोन), और submenus के popups। |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | डेस्कटॉप: popups का पहले frame का रूप, उनके अपने रूप के ऊपर। |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | डेस्कटॉप: बंद होने के बाद popups का रूप, जो उनके transitions चलने तक बना रहता है। |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | फ़ोन: sheet के पीछे का backdrop। |
| `trigger` | `.trigger(..)` | `JSX.Element` | कोई नहीं | जो दबाने पर इसे खोलता है। menu खुला रहने तक उसकी `aria-expanded:` classes और `expandedStyle` लागू रहते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | आइटम, जो हर बार खुलने पर बनते हैं। |

### ContextMenu

`open`, `popupClass` / `popupStyle`, शुरुआती और अंतिम रूप, `backdropClass` / `backdropStyle`, `trigger` और `children` वैसे ही हैं जैसे `Menu` के लिए, और:

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | secondary बटन और दबाए रखी गई उँगलियाँ कुछ नहीं करतीं। |
| `offset` | `.offset(..)` | `number` | `0` | डेस्कटॉप: pointer और popup के बीच की दूरी। |
| `margin` | `.margin(..)` | `number` | `0` | डेस्कटॉप: safe area के किनारों से यह जितनी दूरी रखता है। |

### MenuItem

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | चुना नहीं जा सकता; `disabled:` स्टाइल लागू होते हैं। |
| `checked` | `.checked(..)` | `boolean` | कोई नहीं | checked है या नहीं, जिससे यह checkable आइटम बनता है; ऐप के स्वामित्व में। |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | checked रहते हुए इसकी स्टाइल, `checked:` classes के रूप में। |
| `role` | `.role(..)` | `AccessibilityRole` | `checked` के साथ `"menuitemcheckbox"`, अन्यथा `"menuitem"` | screen readers के लिए यह क्या है; समूह के एक विकल्प के लिए `"menuitemradio"`। |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | indicator, यानी सामग्री से पहले का भाग; उसकी `checked:` और `disabled:` classes आइटम का अनुसरण करती हैं। |
| `indicator` | `.indicator(..)` | `JSX.Element` | कोई नहीं | indicator के भीतर का निशान। |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | इसे चुनने पर menu बंद हो जाता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | जब सामग्री पर्याप्त न हो, तब screen readers क्या बोलें। |
| `children`, `class`, `style` | `.child(..)`, स्टाइल मेथड | | कोई नहीं | इसकी सामग्री और रूप, `hover:`, `active:` और `checked:` states के साथ। |

### Submenu

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | कोई नहीं | वह आइटम जो इसे खोलता है। |
| `back` | `.back(..)` | `JSX.Element` | कोई नहीं | फ़ोन: इसके आइटम के ऊपर की वह पंक्ति जो आसपास के आइटम पर वापस ले जाती है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | यह नहीं खुलता। |
| `offset` | `.offset(..)` | `number` | `0` | डेस्कटॉप: इसके आसपास के menu और इसके popup के बीच की दूरी। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | इसके आइटम। |

`MenuSeparator` एक view है जिसे आप स्टाइल करते हैं (`class`, `style`), और जो अपने स्तर के आइटम के साथ दिखाई देता है।

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | यह खुला या बंद हुआ, कारण के साथ। |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | यह दिखाया गया है; sheet के रूप में, अंदर आ जाने के बाद। |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | यह हट गया है: sheet के रूप में जाने के बाद, popup के रूप में अपने exit के बाद। ऐप द्वारा बंद किए जाने पर भी। |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | डेस्कटॉप: popup को रखा गया: `placement` (वह ओर जहाँ यह गया), `bounds`, `available`। |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | उपयोगकर्ता ने कुछ चुने बिना इसे बंद करने की कोशिश की (Escape या back, बाहर या backdrop पर दबाना)। |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | आइटम चुना गया; checkable आइटम अपना दूसरा मान माँगता है। |

## Accessibility

screen readers के लिए popup या sheet एक menu है और उसके आइटम menu items हैं; trigger बताता है कि menu expanded है या नहीं। checkable आइटम एक checkbox या radio menu item होता है, जिसे checked या not checked पढ़ा जाता है; उसका indicator आइटम का हिस्सा है। TSX में trigger वह element है जो आप देते हैं, यानी एक `Button` या आपका अपना view: वह press और expanded state खुद सँभालता है, इसलिए दबे रहने के दौरान उसकी अपनी `active:` classes और `activeStyle` दिखते हैं, और उसका अपना `onPress` भी चलता है। स्क्रीन पर केवल दिखाए गए स्तर के आइटम होते हैं, इसलिए screen readers वही पढ़ते हैं जो वहाँ मौजूद है।
