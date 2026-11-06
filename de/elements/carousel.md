---
title: "Carousel"
description: "Carousel und seine Teile: Slides, von denen jeweils nur eine an derselben Stelle angezeigt wird. Sie werden per Wischen, Mausrad und Touchpad über das plattformeigene Scrollen, über Zurück- und Weiter-Steuerelemente, eine Paginierung und die Tastatur bewegt, an den Enden nahtlos in einer Schleife. Das Carousel verwaltet, welche Slide angezeigt wird, das Einrasten, das Endlosschleifen, die Tastenbefehle und die Barrierefreiheit; das Erscheinungsbild und jede Beschriftung liegen bei der App."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---


# Carousel

Ein Carousel zeigt Slides jeweils an einer Stelle: die Fotos eines Produkts, die Schritte eines Onboardings, ein Banner, das von selbst weiterläuft, eine Reihe von Karten. `Carousel` besitzt das Verhalten: welcher Slide angezeigt wird, das Wischen dazwischen, die Steuerelemente für Zurück und Weiter, eine Pagination, die Pfeiltasten, das Umlaufen an den Enden und was Screenreader vorlesen. Seine Teile finden es über den Context, sodass die App sie frei in ihrem eigenen Layout anordnen kann. Das Aussehen gehört der App: keine eigenen Farben, Größen, Pfeile, Punkte oder Beschriftungen.

Der Inhalt ist eine native Scroll-View. Ein Finger, das Mausrad und das Touchpad bewegen die Slides auf dem Main-Thread der Plattform, im selben Frame wie der Zeiger, und beim Loslassen rastet der Inhalt auf dem nächsten Slide ein, ein Slide pro Wischgeste. Kommt er zur Ruhe, meldet das Carousel den Slide mit `onChange`. Die Steuerelemente, die Pagination, die Tasten und der `index` der App scrollen den Inhalt nativ und animiert zum Slide.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` und seine Teile stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Der angezeigte Slide ist der `index` der App: Ein Wisch, ein Steuerelement oder eine Taste meldet den nächsten mit `onChange`, und das Carousel scrollt zu dem `index`, den die App zurückgibt. Der Slide, auf dem ein Wisch zur Ruhe kommt, bleibt sichtbar, bis die App seinen `onChange` beantwortet hat: Er bleibt, wenn die App ihn als `index` zurückgibt, und der Inhalt federt animiert zum Slide der App zurück, wenn die App den bisherigen `index` beibehält. Ohne `index` behält das Carousel seinen eigenen, ausgehend von `defaultIndex`. In Rust erzeugen `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` und `carousel_pagination_item()` die Teile, mit einem Setter pro Prop (`.index(..)`), einem Listener pro Event (`.on_change(..)`), den typisierten Style-Methoden und `.child(..)` für ihren Inhalt.

## Props

### Carousel

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | keiner | Der angezeigte Slide, ab 0 gezählt und auf die vorhandenen Slides begrenzt. Die App besitzt ihn: Änderungen werden mit `onChange` gemeldet, und ein neuer `index` scrollt animiert dorthin. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | Der zunächst angezeigte Slide, solange `index` nicht gesetzt ist. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Die Richtung, in der die Slides aufeinanderfolgen; wird gelesen, wenn das Carousel erzeugt wird. Bei einem vertikalen Carousel sind die Pfeiltasten Oben und Unten. |
| `looping` | `.looping(..)` | `boolean` | `false` | Die Slides laufen im Kreis: Nach dem letzten kommt der erste und vor dem ersten der letzte, nahtlos, für Wischen, Zurück, Weiter, die Tasten und den `index` der App gleichermaßen ([Endlosschleife](#looping)). Wird gelesen, wenn das Carousel erzeugt wird. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader das Carousel nennen, eine Region: was seine Slides sind (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der `CarouselContent`, die Steuerelemente und alles, was die App um sie herum anordnet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Layout des Carousels: wohin der Inhalt und die Steuerelemente kommen. |

### CarouselContent

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | keiner | Die `CarouselItem`s, jeweils ein Child des Inhalts. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Die Größe des Viewports und die Spur, die die Slides darin bilden: ein `gap` dazwischen, ein Padding, das einen Ausschnitt der Slides neben dem sichtbaren zeigt. |

### CarouselItem

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader den Slide nennen, eine Gruppe: seine Position unter den anderen und was er zeigt (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt des Slides. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Seine Größe entlang der Achse (`w-full` für einen Slide pro Ansicht, `basis-1/3` für drei) und sein Aussehen. In einem Carousel mit Endlosschleife gehört seine Translation dem Carousel: Setze ein `transform` auf eine View darin. |

### CarouselPrevious, CarouselNext

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Der Name des Steuerelements, wenn seine Children keinen Text enthalten, der ihn nennt (ein Pfeil-Icon). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Das Icon oder die Beschriftung der App. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Sein Aussehen und seine Position: neben dem Inhalt oder `absolute` über seinem Rand. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | keiner | Sein Style, solange es gedrückt, mit dem Zeiger überfahren, fokussiert oder an einem Ende deaktiviert ist, als `<state>:`-Klassen. |

### CarouselPagination

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Wie Screenreader die Gruppe der Pagination-Items nennen (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | keiner | Die Tailwind-Klassen des Indikators, einer View auf dem Item des angezeigten Slides (eine Pill hinter den Punkten, eine Unterstreichung): sein Aussehen und seine Position quer zur Reihe (`inset-y-0`, `bottom-0 h-0.5`). Entlang der Reihe umfasst er dieses Item und federt nativ zum nächsten. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Der Style des Indikators, über `indicatorClass`. Ohne beides hat die Pagination keinen Indikator. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die `CarouselPaginationItem`s und alles, was die App dazwischen anordnet. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Das Layout der Reihe (`flex-row gap-2`). |

### CarouselPaginationItem

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | erforderlich | Der Slide, den es zeigt, ab 0 gezählt. Ein Index hinter dem letzten Slide ist deaktiviert. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | keiner | Sein Style, solange sein Slide angezeigt wird, als `selected:`-Klassen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Welchen Slide es zeigt (`"Slide 3"`), wenn seine Children keinen Text enthalten, der ihn nennt (ein Punkt). |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Punkt, das Vorschaubild oder die Nummer der App. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Sein Aussehen; `group-selected:`-Klassen darin folgen ihm unter `group`. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | Der Nutzer ist zu einem anderen Slide gewechselt: Ein Wisch, das Mausrad oder das Touchpad ist darauf zur Ruhe gekommen, oder ein Steuerelement, ein Pagination-Item oder eine Taste hat ihn angefordert. `{ index }` ist dieser Slide. Ein neuer `index` von der App meldet nichts. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | Der Nutzer hat begonnen, den Inhalt zu ziehen (ein Finger, das Touchpad). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | Der vom Nutzer gezogene Inhalt ist zur Ruhe gekommen. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | Der Tastaturfokus ist in das Carousel gelangt: auf seine eigene View, sein Zurück- oder Weiter-Steuerelement, ein Pagination-Item oder eine fokussierbare View in einem Slide. Der Wechsel zwischen diesen meldet nichts. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | Der Tastaturfokus hat das Carousel verlassen: seine eigene View, seine Steuerelemente, seine Pagination-Items und den Inhalt der Slides. |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Das Carousel | | `Carousel`: `class`, `style` | `focus:` |
| Der Inhalt | das Carousel | `CarouselContent`: `class`, `style` | |
| Ein Slide | der Inhalt | `CarouselItem`: `class`, `style` | |
| Zurück, Weiter | das Carousel | ihre `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| Die Pagination | das Carousel | `CarouselPagination`: `class`, `style` | |
| Der Indikator | die Pagination | `indicatorClass`, `indicatorStyle` | |
| Ein Pagination-Item | die Pagination | seine `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Mehrere Slides pro Ansicht

Die Breite eines Slides kommt aus seiner eigenen Klasse, eine Reihe von Karten sind also mehrere Slides im Viewport. Jeder Slide ist an seinem Anfang ein Einrastpunkt: Der Inhalt kommt so zur Ruhe, dass dieser Slide dort steht, wo der erste steht, ein Padding vor dem ersten bleibt also vor jedem erhalten. Am Ende des Bereichs kommen die Slides, die diese Stelle nicht erreichen können, mit dem letzten zur Ruhe, und Weiter hält dort an. `index` nennt den Slide an erster Stelle; die Slides, die mit dem letzten zur Ruhe kommen, zeigen dieselbe Stelle, und ein Wisch dort meldet den ersten von ihnen:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` in der Breite eines Telefons oder `basis-[85%]` zeigt einen Ausschnitt der nächsten Karte. Ein vertikales Carousel (`axis="vertical"`) bemisst seine Slides nach ihrer Höhe.

<a id="looping"></a>

## Endlosschleife

Mit `looping` laufen die Slides nahtlos im Kreis: Nach dem letzten kommt der erste, ob per Wisch, mit Weiter, mit den Tasten oder durch den `index` der App, ohne Rücklauf über die dazwischenliegenden Slides. Der Inhalt hält Platz für eine ganze Runde Slides davor und danach vor und zeichnet jeden Slide dort, wo er der Mitte der Ansicht am nächsten ist; die Animation führt das auf den eigenen Frames der Plattform zusammen mit dem Scrollen aus. Jeder Slide ist nur einmal vorhanden: Screenreader und die Pagination sehen ihn nur einmal.

Die Schleife ist nahtlos, solange die Slides den Viewport und einen weiteren Slide überspannen (drei Slides in voller Breite oder fünf mit je einem Drittel). Bei weniger laufen Zurück, Weiter und die Tasten weiterhin im Kreis, scrollen aber über die Slides zurück.

<a id="slides-that-move-on-by-themselves"></a>

## Slides, die von selbst weiterlaufen

Ein Banner, das weiterrollt, ist Sache der App: ein Timer, der `index` setzt. Das Carousel meldet, wann der Nutzer damit interagiert, sodass der Timer dann wartet, wie es das [WAI-ARIA-Carousel-Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) verlangt: `onDragStart` / `onDragEnd` rund um ein Ziehen, `onFocus` / `onBlur` solange der Tastaturfokus im Carousel ist (darauf, auf seinen Steuerelementen, seiner Pagination oder dem Inhalt der Slides) und der Zeiger über einer View darum herum. Lass es bei reduzierter Bewegung ausgeschaltet und gib den Nutzern eine Schaltfläche, die es anhält (das Steuerelement für die Rotation):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Das Lesen von `index()` im Effect startet nach jeder Änderung, auch der des Nutzers, ein ganzes Intervall neu. Mit `looping` bewegt sich der Wechsel vom letzten zum ersten Slide vorwärts über die Naht.

<a id="accessibility"></a>

## Barrierefreiheit

- Das Carousel ist eine Region, benannt durch `accessibilityLabel`; jeder Slide ist eine Gruppe, benannt durch seinen eigenen (seine Position unter den anderen und was er zeigt).
- Zurück und Weiter sind Buttons, an den Enden deaktiviert, sofern das Carousel nicht im Kreis läuft; jedes Pagination-Item ist ein Button, der ausgewählt ist, solange sein Slide angezeigt wird.
- Jede Beschriftung gehört der App, in der Sprache der App.
- Die Slides eines Carousels mit Endlosschleife sind jeweils nur einmal vorhanden, egal wo sie gezeichnet werden.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Beschriftungen, Rollen und Ansagen im Allgemeinen.

<a id="keyboard"></a>

## Tastatur

Unter macOS und im Web, wo Tab die Views erreicht, die Eingaben annehmen, ist das Carousel ein Haltepunkt des Tastaturfokus, ebenso seine Steuerelemente und Pagination-Items. Solange eines davon den Fokus hat:

| Taste | Wirkung |
|---|---|
| Pfeil links, Pfeil rechts (Pfeil hoch, Pfeil runter bei vertikaler Ausrichtung) | Wechselt zum vorherigen oder zum nächsten Slide, bei Endlosschleife um die Enden herum. |
| Home, End | Wechselt zum ersten oder zum letzten Slide. |
| Leertaste, Return | Betätigt das fokussierte Steuerelement oder Pagination-Item. |

In einem Right-to-left-Layout laufen die Slides eines horizontalen Carousels von rechts, sodass Pfeil links zum nächsten Slide wechselt und Pfeil rechts zum vorherigen; ein vertikales Carousel behält Pfeil hoch und Pfeil runter. Ein Steuerelement, das deaktiviert wird, während es den Fokus hat (Weiter auf dem letzten Slide), gibt den Fokus an das Carousel ab, sodass die Tasten dort weiter funktionieren. Fokussierbare Views der App in den Slides behalten ihre eigenen Tasten: Die Pfeiltasten eines Eingabefelds bewegen dessen Caret.

<a id="motion"></a>

## Bewegung

- Ein Wisch, das Mausrad und das Touchpad bewegen die Slides mit dem Zeiger im selben Frame: Die Plattform scrollt sie.
- Beim Loslassen gleitet der Inhalt zum nächsten Slide, ein Slide pro Wischgeste, so wie die Plattform einrastet.
- Zurück, Weiter, ein Pagination-Item, eine Taste und der `index` der App scrollen den Inhalt animiert zum Slide; bei reduzierter Bewegung sofort.
- Der Indikator der Pagination federt zum Item des angezeigten Slides; bei reduzierter Bewegung bewegt er sich sofort.
- `looping` geht vom letzten zum ersten Slide einen Schritt vorwärts, über die Naht; sobald der Inhalt zur Ruhe kommt, springt er ohne Animation um eine ganze Runde zurück, was auf dem Bildschirm nichts verändert.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- iOS, Android und Mac Catalyst: Ein Finger wischt die Slides; ein Tippen betätigt ein Steuerelement.
- Desktops (macOS, Windows, Linux, GPUI) und das Web: Das Mausrad und das Touchpad scrollen die Slides, und ein Klick betätigt ein Steuerelement. Ein Ziehen mit der Maus über den Inhalt ist Sache der App, wie bei jeder Scroll-View dort.
- Jede Plattform zeichnet, was die App gestaltet: die Slides, die Steuerelemente, die Pagination und ihren Indikator.
