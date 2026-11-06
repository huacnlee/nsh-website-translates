---
title: "Tooltip"
description: "Die Tooltip-Komponente: ein Hinweis zu dem Element, in dem sie enthalten ist, der auf Desktop-Plattformen angezeigt wird, wenn der Mauszeiger darauf verweilt, und von der App gestaltet wird."
group: base
demo: el-tooltip
source_hash: bc1733626637e39f
---


# Tooltip

Ein Tooltip ist ein kurzer Hinweis neben dem Element, auf das er sich bezieht: was ein Icon-Button tut oder der vollständige Text eines abgeschnittenen Labels.
Auf Desktops und in Desktop-Browsern erscheint er, sobald der Zeiger `delay` (500 ms) auf seinem Trigger verweilt hat, und verschwindet wieder, wenn der Zeiger den Trigger verlässt oder darauf drückt. Smartphones und Tablets zeigen einen Tooltip nur, wenn die App ihn öffnet
(`open`). Er fängt weder den Zeiger noch Klicks ab, sodass der Trigger genau so funktioniert wie ohne ihn.

`Tooltip` aus [`nsh/base`](../modules/nsh-base.md) wird als Prop `tooltip` übergeben, die jedes Element hat
([Gemeinsame Props](index.md#tooltips)), als GPUIs `.tooltip(..)`: Das Element ist das, worauf der Zeiger verweilt und woran der Tooltip ausgerichtet wird. Der Tooltip selbst ist die Sprechblase: Style sie mit `class` / `style`, und ihre Kinder sind das, was sie sagt.

```rust tabs
use nsh_base::tooltip;
use nsh_core::prelude::*;

fn save_button(on_save: impl Fn() + 'static) -> impl IntoElement {
    view()
        .on_press(on_save)
        .accessibility_label("Save")
        .p_2()
        .child(text("💾"))
        .tooltip(
            tooltip()
                .placement(Placement::Bottom)
                .rounded_md()
                .bg(rgb(0x111827))
                .px_2()
                .py_1()
                .child(text("Save the document").text_color(white())),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Tooltip } from "nsh/base";

function SaveButton(props: { onSave: () => void }) {
  return (
    <View
      onPress={props.onSave}
      accessibilityLabel="Save"
      class="p-2"
      tooltip={
        <Tooltip placement="bottom" class="rounded-md bg-gray-900 px-2 py-1">
          <Text class="text-white">Save the document</Text>
        </Tooltip>
      }
    >
      <Text>💾</Text>
    </View>
  );
}
```

Standardmäßig steht er über seinem Trigger (`placement`), bei zu wenig Platz auf der gegenüberliegenden Seite, und bleibt innerhalb der Safe Area. Mit `open` entscheidet die App, wann er erscheint. Dazu dient `onOpenChange`: Es meldet, wenn der Zeiger auf dem Trigger verweilt oder ihn verlässt, und der Tooltip lässt sich auf jedem Gerät anzeigen.

Er erscheint und verschwindet mit den Transitions: `startingClass` ist sein Aussehen im ersten Frame und `endingClass` sein Aussehen im ausgeblendeten Zustand, das er beibehält, solange die `transition-*`-Klassen seines `class` laufen; danach folgt `onClose`.

```tsx
<Tooltip
  class="rounded-md bg-gray-900 px-2 py-1 transition-opacity duration-100"
  startingClass="opacity-0"
  endingClass="opacity-0"
>
  <Text class="text-white">Save the document</Text>
</Tooltip>
```

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | keiner | Was er sagt. |
| `class`, `style` | `.app_class(..)`, `Styled` Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Aussehen der Sprechblase: der Tooltip selbst. |
| `startingClass`, `startingStyle` | `.starting_class(..)`, `.starting_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Sein Aussehen im ersten Frame: Seine Transitions laufen von dort aus. |
| `endingClass`, `endingStyle` | `.ending_class(..)`, `.ending_style(..)` | `string`, `StyleProp<ViewStyle>` | keiner | Sein Aussehen im ausgeblendeten Zustand: Es bleibt bestehen, solange seine Transitions laufen. |
| `open` | `.open(..)` | `boolean` | keiner | Angezeigt, von der App gesteuert. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Anfangs angezeigt, ohne `open`. |
| `delay` | `.delay(..)` | `number` | `500` | Millisekunden, die der Zeiger auf dem Trigger verweilt, bevor er erscheint; `Infinity`: nie von selbst, nur wenn die App ihn öffnet. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Er wird nie angezeigt. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Die Seite des Triggers, auf der er steht. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"center"` | Wie er sich entlang dieser Seite am Trigger ausrichtet. |
| `offset` | `.offset(..)` | `number` | `4` | Der Abstand zwischen Trigger und Tooltip. |
| `margin` | `.margin(..)` | `number` | `4` | Der Abstand, den er zu den Rändern der Safe Area einhält. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onOpenChange` | `.on_open_change(\|e\| ..)` | Der Zeiger verweilt auf dem Trigger, hat ihn verlassen oder darauf gedrückt (`reason` `"hover"`). |
| `onOpen` | `.on_open(\|\| ..)` | Er wird angezeigt. |
| `onClose` | `.on_close(\|\| ..)` | Er ist verschwunden, nach seiner Exit-Transition; auch wenn die App ihn ausgeblendet hat. |

<a id="accessibility"></a>

## Barrierefreiheit

Ein Tooltip wiederholt gegenüber Screenreadern, was sein Trigger aussagt: Gib dem Trigger zusätzlich `accessibilityLabel`, damit der Hinweis für alle verfügbar ist.
