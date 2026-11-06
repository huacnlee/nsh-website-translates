---
title: "Resizable"
description: "ResizablePanelGroup und ResizablePanel: Panels nebeneinander oder gestapelt, mit einem Handle zwischen je zwei Panels, das der Nutzer zieht, um den verfügbaren Platz aufzuteilen. Die Gruppe verwaltet das Ziehen, die Grenzen der Panels, den Resize-Cursor und die Rolle der Handles für Screenreader; die Größen, das Aussehen der Handles und der Inhalt der Panels liegen bei der App."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---


# Resizable

Eine Resizable Group ordnet Panels nebeneinander oder untereinander an, mit einem Handle an jeder Grenze zwischen zwei Panels: eine Seitenleiste neben einem Dokument, ein Editor über seiner Konsole, eine Liste neben ihrer Detailansicht. Der Nutzer zieht ein Handle, um die Grenze zu verschieben, und jedes Panel bleibt innerhalb der Größen, die die App ihm erlaubt. `ResizablePanelGroup` übernimmt das Verhalten: das Ziehen, das nativ Frame für Frame abläuft, die Aufteilung des Platzes, den Resize-Cursor und eine größere Touch-Fläche für den Finger. Das Aussehen liegt bei der App: Ein Handle ist ein Band ohne eigene Linie, Farbe oder eigenen Griff, und was es zeichnet, ist der Indikator der App; die Panels sind die Views der App.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` und `ResizablePanel` stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust. Die Panels sind die direkten Kinder der Gruppe. In Rust erzeugen `h_resizable()` und `v_resizable()` jeweils eine Gruppe entlang einer Achse (`resizable_panel_group().axis(..)` nimmt die Achse als Wert) und `resizable_panel()` ein Panel, mit einem Setter pro Prop, einem Listener pro Ereignis, den typisierten Style-Methoden und `.child(..)` für ihren Inhalt; `.size_range(min..max)` setzt beide Grenzen auf einmal.

<a id="sizes"></a>

## Größen

Die `size` eines Panels ist die Größe, die es haben möchte, innerhalb von `minSize` und `maxSize`. Panels ohne diese Angabe teilen sich den verbleibenden Platz gleichmäßig auf, unabhängig von ihrem Inhalt; hat jedes Panel eine Größe, wird der übrige Platz im Verhältnis dazu verteilt. Während der Nutzer ein Handle zieht, verschiebt die Gruppe den Platz zwischen den Panels im Core, ohne JS auf dem Weg:

- Wächst das Panel vor dem Handle, nimmt es Platz von den Panels dahinter, das nächstgelegene zuerst, jedes bis hinunter zu seinem `minSize`, wobei `fixed`-Panels übersprungen werden.
- Verkleinert man es unter sein `minSize`, nimmt es Platz von den Panels davor.
- Kein Panel wächst über sein `maxSize` hinaus, und die Panels ergeben zusammen nie mehr als die Gruppe.

Endet ein Ziehen mit geänderten Größen, meldet die Gruppe die Größe jedes sichtbaren Panels in der Reihenfolge ihrer Anordnung (`onResize` an der Gruppe), und jedes Panel, dessen Größe sich geändert hat, meldet seine eigene (`onResize` am Panel). Die Panels, die ein Ziehen verschoben hat, behalten die Größen des Nutzers, bis die App ein neues `size` übergibt; die App bewahrt sie über die Lebensdauer der Gruppe hinaus, indem sie die gemeldeten Größen als `size` zurückgibt, sodass ein Layout, das sie aus dem [Speicher](../modules/nsh.md#storage) wiederherstellt, mit den Größen öffnet, die der Nutzer hinterlassen hat. Nur Ziehen und die Schritte von Screenreadern melden: Eine Größenänderung des Fensters oder das Ein- oder Ausblenden eines Panels meldet nichts.

Wächst oder schrumpft die Gruppe (das Fenster wird in der Größe geändert), behalten die Panels mit Größe diese, und die Panels ohne Größe nehmen die Differenz auf. Ist die Gruppe für die Größen zu klein, schrumpfen die Panels, mit Ausnahme der `fixed`-Panels (eine Seitenleiste, ein Inspektor), und sie kehren zu ihren Größen zurück, sobald wieder Platz da ist. Ein Panel mit `visible={false}` beansprucht keinen Platz: Die anderen teilen sich seinen Raum, und es kehrt mit seiner Größe zurück, wenn es wieder angezeigt wird.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

## Handles

An jeder Grenze zwischen zwei sichtbaren Panels gibt es ein Handle: ein Band, 9 Punkte dick quer zur Achse, zentriert auf der Grenze, mit dem Resize-Cursor seiner Achse. Auf Touchscreens reicht seine Touch-Fläche auf jeder Seite 10 Punkte weiter, sodass auch eine einen Punkt dünne Linie leicht zu greifen ist. Das Handle ist ein `group`: Was es zeichnet, ist der Indikator der App, gestaltet mit `handleClass` / `handleStyle`: 1 Punkt quer zur Achse und die volle Länge der Grenze, sodass `bg-border` allein auf beiden Achsen eine Haarlinie ergibt, `w-[3px]` oder `h-[3px]` sie verdickt und seine Klassen `group-hover:` und `group-active:` dem Zeiger über dem Band sowie dem Drücken oder Ziehen folgen. Für mehr als eine Linie (ein Griff aus Punkten, ein Icon) rendert `renderHandle` den Inhalt des Indikators und bekommt `index`, `axis` und `state` des Handles mitgeteilt; er wird bei einer Zustandsänderung neu gezeichnet, einige Male pro Ziehen, nie bei jeder Bewegung. Ein Griff, der animiert wird, ist der Thumb des Handles (`handleThumbClass` / `handleThumbStyle`): eine View, zentriert auf der Linie, aufrecht gezeichnet und auf einer horizontalen Linie um eine Vierteldrehung gedreht, sodass eine Klasse beide Achsen bedient; die Klassen `group-hover:` und `group-active:` zeigen und animieren ihn; das Handle bleibt während des gesamten Ziehens gedrückt, wohin auch immer der Zeiger geht.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` hält jedes Handle an seinem Platz (ein gesperrtes Layout).

## Props

### ResizablePanelGroup

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Nebeneinander (die Handles werden nach links und rechts gezogen) oder untereinander (nach oben und unten). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Kein Ziehen: Die Handles bleiben, wo sie sind. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator jedes Handles, auf der Grenze im Band des Handles: 1 Punkt quer zur Achse und die volle Länge der Grenze, sofern nichts anderes angegeben ist (`w-[3px]`, `h-[3px]`); `group-hover:` und `group-active:` folgen dem Band. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Thumb jedes Handles: ein auf der Linie zentrierter Griff, aufrecht gezeichnet wie auf einer vertikalen Linie und auf einer horizontalen um eine Vierteldrehung gedreht, sodass eine Klasse beide Achsen bedient. Er bleibt dieselbe View, während das Handle überfahren, gedrückt und gezogen wird, daher animieren die Klassen `group-hover:` und `group-active:` ihn (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | keiner | Was sich in jedem Indikator befindet; wird neu gezeichnet, wenn sich `state` des Handles ändert. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | keiner | Was Screenreader für jedes Handle sagen: was es in der Größe ändert. Sie verstellen es in Schritten von 10 Punkten. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Die `ResizablePanel`, seine direkten Kinder. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | `size-full` | Die Gruppe selbst; sie füllt ihr Elternelement, sofern ihre Klasse nichts anderes vorgibt. |

### ResizablePanel

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | keine | Die gewünschte Länge entlang der Achse der Gruppe, in Punkten, innerhalb von `minSize` und `maxSize`; ein neuer Wert ändert die Größe. Ohne Wert teilt es sich den verbleibenden Platz. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | Die kleinste Größe, die es erhält. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | keine Begrenzung | Die größte Größe, die es erhält. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | Behält seine Größe, wenn die Gruppe für die Panels zu klein ist; das Ziehen an seinem eigenen Handle ändert sie dennoch. Es nimmt einen `size` entgegen. |
| `visible` | `.visible(..)` | `boolean` | `true` | Ausgeblendet beansprucht es keinen Platz, und die anderen teilen sich seinen Raum. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Sein Inhalt. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keine | Die eigene Fläche des Panels. Seine Größe entlang der Achse bestimmt die Gruppe. |

### ResizeHandleContext

| Feld | Typ | Beschreibung |
|---|---|---|
| `index` | `number` | Die Grenze nach dem `index`-ten sichtbaren Panel. |
| `axis` | `"horizontal" \| "vertical"` | Die Achse, entlang der es die Größe ändert. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | Wie weit sich der Zeiger oder Finger mit ihm bewegt hat. |

<a id="events"></a>

## Ereignisse

| Ereignis | Rust | Beschreibung |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | Ein Ziehen wurde beendet und hat ein Handle bewegt, oder ein Screenreader hat eines verstellt: `sizes`, die Größe jedes sichtbaren Panels in der Reihenfolge ihrer Anordnung (von links nach rechts, von oben nach unten). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | Ein Ziehen wurde beendet und hat die Größe dieses Panels geändert: `size`, die neue, die als sein `size` zurückgegeben wird. |

<a id="parts"></a>

## Teile

| Teil | Enthalten in | Gestaltet mit | Zustände |
|---|---|---|---|
| Die Gruppe | | `ResizablePanelGroup` mit `class`, `style` | |
| Ein Panel | der Gruppe | `ResizablePanel` mit `class`, `style` | |
| Der Indikator eines Handles | dem Band des Handles, auf einer Grenze | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` unter einem Zeiger, `group-active:` beim Drücken oder Ziehen; `state` in `renderHandle` |
| Der Thumb eines Handles | zentriert auf der Linie eines Handles | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (gedrückt, bis das Ziehen endet) |

<a id="accessibility"></a>

## Barrierefreiheit

- Jedes Handle ist für Screenreader ein verstellbares Element mit `handleAccessibilityLabel` als Label. Sein Wert
  ist die Größe des Panels davor, innerhalb von `minSize` und `maxSize` dieses Panels.
- Ein Wischen nach oben oder unten auf einem Handle mit VoiceOver oder die Lautstärketasten von TalkBack verschieben es um 10 Punkte, wie ein Ziehen es täte; die
  Gruppe meldet es mit `onResize`. Die Handles einer `disabled`-Gruppe bleiben, wo sie sind.
- Der Inhalt der Panels gehört der App und wird wie überall sonst vorgelesen.

Siehe [Barrierefreiheit](../docs/accessibility.md) für Labels, Rollen und Ansagen im Allgemeinen.

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Desktops (macOS, Windows, Linux, GPUI) und das Web: Der Zeiger über einem Handle zeigt den Spalten- bzw. Zeilen-Resize-Cursor,
  und ein Ziehen mit der Maus oder einem Touchpad verschiebt die Grenze.
- iOS, Android und Mac Catalyst: Ein Finger zieht das Handle, innerhalb einer Touch-Fläche, die auf jeder Seite 10 Punkte breiter ist als
  das Band.
- In Right-to-left-Layouts folgen die Panels und ihre Größen der Reihenfolge des Layouts.
- Jede Plattform zeichnet, was die App gestaltet: die Indikatoren und die Panels.
- Die Splits von [Dock](./dock.md) sind Resizable Groups: Ihre Größe wird auf dieselbe Weise geändert.
