---
title: "Dock"
description: "DockArea: ein andockbarer Arbeitsbereich aus Splits, Tab-Gruppen und Docks am linken, rechten und unteren Rand, dessen Layout aus Daten besteht, die der App gehören. Die Area übernimmt Tab-Drags und -Drops, Größenänderung, Docks, Zoom und die Sperre, behält den Inhalt jedes Panels beim Verschieben bei und passt sich an Smartphones an; das Erscheinungsbild und der Inhalt der Panels liegen bei der App."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---


# Dock

Ein Dock-Bereich ist ein vom Nutzer anordenbarer Arbeitsbereich: Panels in Tab-Gruppen, Gruppen nebeneinander oder untereinander geteilt, und Docks am linken, rechten und unteren Rand, die sich öffnen, schließen und in der Größe ändern lassen. Ein Tab, der auf eine andere Gruppe gezogen wird, tritt ihr bei; wird er an den Rand einer Gruppe gezogen, teilt er sie, und jedes Panel behält beim Verschieben, was es enthält. `DockArea` besitzt das Verhalten: Tab-Drag-and-Drop, das nativ Frame für Frame läuft, die Größenänderung von Splits und Docks, das Öffnen und Schließen von Docks, Zoom und die Sperre. Das Aussehen gehört der App: Die Tabs, die Tab-Leisten, die Griffe, der Drop-Indikator und der Inhalt jedes Panels werden von der App gerendert und gestaltet, und der Bereich zeichnet selbst nichts.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` und die Werte, die es annimmt, stammen aus [`nsh/base`](../modules/nsh-base.md), dem `nsh-base`-Crate in Rust
(`nsh_base::dock_area()`, die Werte in `nsh_base::dock`). In Rust erzeugt `dock_area()` es, mit einem Setter pro
Prop, einem Listener pro Event und den typisierten Style-Methoden; `DockLayout` beschreibt ein Layout anhand der Schlüssel der Panels
(`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## Das Layout

Das Layout ist ein Wert, `DockAreaLayout`: die Mitte und je ein Dock am linken, rechten und unteren Rand, jeweils
optional. Jede Region ist ein Baum aus zwei Arten von Knoten:

| Knoten | Enthält | Felder |
|---|---|---|
| `{ type: "split" }` | Andere Knoten, nebeneinander (`axis: "horizontal"`) oder untereinander (`"vertical"`) | `children` und `sizes`: die Länge jedes Kindes entlang der Achse in Punkten, `null`, um den Rest aufzuteilen |
| `{ type: "tabs" }` | Panels, nach Schlüssel, jeweils eines sichtbar | `panels` (die Schlüssel in Tab-Reihenfolge), `activeIndex` (das angezeigte, Standard 0) |

Ein Panel liegt immer in einer Tab-Gruppe: Eine Region mit einem Panel ist eine Tab-Gruppe mit einem Element. Der Schlüssel eines Panels ist der String, den die App dafür vergibt
(`"files"`, die ID eines Dokuments), und ein Schlüssel kommt im gesamten Layout nur einmal vor. Ein Dock (`DockRegion`) besteht aus seinem Baum
(`layout`), seiner Größe quer zu seinem Rand (`size`, Standard 200, mindestens 100), der Angabe, ob es geöffnet ist (`open`, Standard `true`),
und der Angabe, ob das Ziehen seines Rands unter seine Mindestgröße es schließt (`collapsible`, Standard `true`).

Jeder Knoten hat eine `id`. Ein Layout, das die App schreibt, darf IDs weglassen: Der Bereich vergibt sie, und jedes Layout, das er meldet,
enthält sie. Wird ein gemeldetes Layout zurückgegeben, bleibt die Identität jeder Gruppe erhalten, nach der die Methoden des Refs Gruppen benennen. Der
Bereich bereinigt außerdem, was er erhält: Eine leere Gruppe oder ein leerer Split verschwindet, ein Split mit einem Kind wird zu diesem Kind,
ein Split innerhalb eines Splits derselben Achse wird in seinen Elternknoten aufgenommen, `activeIndex` bleibt im gültigen Bereich, und ein doppelt aufgeführter Schlüssel behält seine erste
Position. Die Layouts, die er meldet, haben immer genau diese kanonische Form.

Das Layout gehört der App (`layout`): Jede Änderung des Nutzers (ein Tab ausgewählt, gezogen oder geschlossen, ein Split oder Dock
in der Größe geändert, ein Dock geöffnet oder geschlossen) wird als gesamtes neues Layout gemeldet (`onLayoutChange`), und der Bereich zeigt das
Layout, das die App zurückgibt. Die App ändert das Layout selbst, indem sie einen neuen Wert übergibt: ein gespeichertes Layout wird wiederhergestellt, ein
Befehl ordnet den Arbeitsbereich neu an. Ein Bereich ohne `layout` verwaltet sein eigenes, beginnend mit `defaultLayout`, und
meldet weiterhin jede Änderung.

<a id="panels-content"></a>

## Inhalt der Panels

Was ein Panel zeigt, bestimmt die App: `renderPanel` rendert es anhand des Schlüssels des Panels (`panel.id`). Jedes Panel einer Gruppe wird
platziert, und nur das angezeigte ist sichtbar, sodass beim Wechsel der Tabs der Inhalt jedes Panels erhalten bleibt; und wenn ein Panel verschoben wird (in eine
andere Gruppe, in ein Dock, in einen Zoom und zurück), wandert derselbe Inhalt mit: die Signals, die es erzeugt hat, der Text eines Eingabefelds, eine Scrollposition, die Seite einer Web View bleiben alle erhalten. Der Bereich rendert ein Panel einmal, wenn es zum ersten Mal erscheint, und gibt seinen
Inhalt frei, wenn das Panel das Layout verlässt (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` legt nach Schlüssel fest, was jedes Panel erlaubt; ein nicht aufgeführtes Panel erlaubt alles:

| Feld | Standard | Beschreibung |
|---|---|---|
| `id` | | Der Schlüssel des Panels. |
| `closable` | `true` | Es darf geschlossen werden. |
| `zoomable` | `true` | Seine Gruppe darf zoomen, solange es angezeigt wird. |
| `visible` | `true` | Es wird angezeigt. Ein verborgenes Panel behält seinen Platz und kehrt dorthin zurück; eine Gruppe oder ein Split, dessen Panels alle verborgen sind, beansprucht keinen Platz. |

## Tabs

Jede Gruppe hat eine Tab-Leiste mit einem Tab pro sichtbarem Panel, in der Reihenfolge ihres `panels`. `renderTab` rendert, was ein Tab
zeigt (seinen Titel, ein Icon, einen Schließen-Button der App); ohne es zeigt ein Tab den Schlüssel des Panels. Der Bereich macht es zum
Tab: Ein Druck wählt ihn aus, ein Ziehen verschiebt sein Panel, Screenreader erkennen ihn als Tab mit seinem Auswahlzustand, und
die `selected:`-Klassen von `tabClass` gestalten den angezeigten. Der Wert eines Tabs gibt an, was die App zum Zeichnen braucht:

| Feld | Typ | Beschreibung |
|---|---|---|
| `panel` | `string` | Der Schlüssel des Panels. |
| `group` | `number` | Die ID der Tab-Gruppe, in der er liegt. |
| `index` | `number` | Seine Position unter den sichtbaren Tabs der Gruppe. |
| `active` | `boolean` | Er ist der angezeigte Tab der Gruppe. |
| `closable` | `boolean` | Der Bereich würde ihn schließen: Er ist schließbar, der Bereich ist nicht gesperrt, und seine Gruppe darf ihn abgeben. |
| `zoomed` | `boolean` | Seine Gruppe ist gezoomt. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

## Drag and Drop

Ein Tab, der über eine Gruppe gezogen wird, zeigt, wo er landen würde, und das Ablegen setzt ihn dorthin:

| Abgelegt auf | Das Panel |
|---|---|
| Eine Tab-Leiste | Tritt dieser Gruppe bei, zwischen den Tabs, neben denen es abgelegt wird |
| Die Mitte des Inhalts einer Gruppe | Tritt dieser Gruppe bei |
| Einen Rand des Inhalts einer Gruppe (die äußeren 35 % auf jeder Seite) | Teilt diese Gruppe: eine neue eigene Gruppe auf dieser Seite |

Solange ein Ziehen darüber schwebt, zeigt der Bereich den Drop-Indikator über dem Teil der Gruppe, den das Panel einnehmen würde (den gesamten
Inhalt zum Beitreten, die Hälfte davon zum Teilen): ein Teil, den die App
gestaltet (`dropIndicatorClass`), mit eigenem Inhalt, falls die App welchen rendert (`renderDropIndicator`, übergeben werden
`group`, die `side`, die er abspaltet, oder die Tab-Leiste `index`). Er bewegt sich nativ zu jeder neuen Position, gleitet dorthin und blendet bei einer anderen Gruppe ein, während der letzte ausgeblendet wird (sofort, wenn der Nutzer weniger Bewegung wünscht). Was dem Zeiger oder Finger folgt, bestimmt ebenfalls die App
(`renderDragPreview`). Ein Drop ist eine einzige Änderung des Layouts und wird einmal gemeldet; ein Drop, der nichts ändern würde, ändert nichts.

Ein gesperrter Bereich, ein gezoomter Bereich und das letzte Panel einer Gruppe, neben der sonst nichts liegt, lassen kein Ziehen zu.

## Docks

Ein Dock öffnet und schließt sich, ohne seine Panels oder seine Größe zu verlieren: Beim Schließen bleibt sein Baum erhalten, und beim Öffnen zeigt es dieselben
Gruppen in derselben Größe. Der Rand zwischen einem Dock und der Mitte ist ein Griff, den der Nutzer zieht, um die Größe des Docks zu ändern;
das Dock bleibt mindestens 100 Punkte groß, und die Mitte behält mindestens 100 Punkte, und ein einklappbares Dock, das unter 50 Punkten losgelassen wird,
schließt sich und behält seine Größe für das nächste Öffnen. Der Bereich passt immer in seine Grenzen: Ein Dock wird in seiner `size` angezeigt, soweit der
Bereich ihm Platz lässt, und wenn selbst das nicht passt, schrumpfen die Docks mit dem Rest, und die Mindestgrößen der Splits
geben nach. `renderDock` zeichnet das eigene Chrome eines Docks vor seinem Layout (eine Titelleiste, einen Einklappen-Button) und erhält dessen
`placement`, `open`, `size` und `collapsible`; `dockClass` gestaltet seinen Rahmen.

Docks lassen sich aus der App über den Ref öffnen, schließen und in der Größe ändern (`toggleDock`, `setDockOpen`, `setDockSize`), was
in beiden Darstellungen funktioniert, oder indem man `open` und `size` des Docks im übergebenen Layout schreibt (`open` gehört zur vollständigen
Darstellung). `onDockOpenChange` meldet
jedes Mal, wenn ein Dock angezeigt oder verborgen wird, gemessen an `open` des Layouts (ein Bereich, der von Anfang an kompakt ist, meldet
jedes im Layout geöffnete Dock als verborgen), sodass ein Umschalter, der vom `open` des Layouts ausgeht und `onDockOpenChange` folgt, stets
den Zustand des Docks zeigt:

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

## Zoom

Eine gezoomte Gruppe füllt den gesamten Bereich, bis sie herausgezoomt wird oder das Layout verlässt (`area.toggleZoom(group)`, und `area.toggleZoom()` zum Herauszoomen),
und `onZoomChange` meldet das Panel, das sie anzeigt, oder `null`. Der Zoom gehört der Gruppe, sodass sie gezoomt bleibt,
wenn ihr angezeigtes Panel geschlossen wird und das nächste übernimmt. Ein Panel mit `zoomable: false` verhindert, dass seine Gruppe
zoomt, solange es angezeigt wird.

<a id="locking"></a>

## Sperren

`locked` hält die Anordnung unverändert: kein Ziehen von Tabs, keine Drops, kein Schließen. Das Auswählen von Tabs, das Ändern der Größe und das Öffnen und
Schließen von Docks funktionieren weiterhin, sodass ein gesperrter Arbeitsbereich weiterhin ein nutzbarer Arbeitsbereich ist.

<a id="methods"></a>

## Methoden

`ref={area}` stellt die Methoden des Bereichs bereit (`DockAreaRef`), für Befehle, Tastenkürzel und Menüs der App. Jede Änderung wird
mit `onLayoutChange` gemeldet, ebenso wie die des Nutzers. Eine Methode, der ein Panel, eine Gruppe, ein Tab-Index oder ein Dock übergeben wird, das das Layout
nicht hat, lässt das Layout unverändert und protokolliert eine Warnung mit dem Namen der Methode und dem Wert.

| Methode | Beschreibung |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: das angezeigte Layout. |
| `addPanel(panel, placement?, size?)` | Fügt ein Panel zu einer Region hinzu (`"center"`, der Standard, `"left"`, `"right"`, `"bottom"`), in deren erste Tab-Gruppe, angezeigt; ein fehlendes Dock wird erstellt, `size` quer. Ein Panel, das der Bereich bereits hält, wird dorthin verschoben. |
| `removePanel(panel)` | Entfernt ein Panel, unabhängig von seinen Optionen. |
| `closePanel(panel)` | Schließt ein Panel so, wie es sein Tab täte: außer wenn der Bereich gesperrt ist, das Panel nicht schließbar ist oder es das letzte Panel einer Gruppe ist, neben der nichts liegt. |
| `movePanel(panel, target)` | Verschiebt ein Panel nach `target`: `{ group, side?, index?, activate?, size? }`, in die Tab-Gruppe `group` (an `index`) oder in eine neue Gruppe an ihrer `side` (`size` Punkte entlang des neuen Splits). |
| `splitAt(group, panel, side)` | Setzt ein Panel in eine neue Tab-Gruppe auf einer Seite (`"left"`, `"right"`, `"top"`, `"bottom"`) eines Containers. |
| `selectPanel(panel)` | Zeigt ein Panel in seiner Gruppe an. |
| `selectTab(group, index)` | Zeigt einen Tab einer Gruppe an. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | Öffnet oder schließt ein Dock. |
| `setDockSize(placement, size)` | Legt die Größe eines Docks quer zu seinem Rand fest (mindestens 100). |
| `toggleZoom(group?)` | Zoomt eine Gruppe hinein, oder heraus, wenn sie gezoomt ist; ohne `group` wird die gezoomte Gruppe herausgezoomt. |
| `zoomedGroup()` | `Promise<number \| null>`: die ID der gezoomten Gruppe. |
| `groupOf(panel)` | `Promise<number \| null>`: die ID der Tab-Gruppe, die ein Panel enthält. |

In Rust liefern `component_ref::<DockArea>()` und `.component_ref(&r)` am Bereich einen Ref, dessen `r.api::<DockAreaApi>()`
dieselben Methoden in Snake Case hat.

<a id="saving-and-restoring"></a>

## Speichern und Wiederherstellen

Ein gemeldetes Layout besteht aus reinen Daten, daher bedeutet Speichern `JSON.stringify(layout)` in den [Speicher](../modules/nsh.md#storage),
und Wiederherstellen bedeutet, den geparsten Wert als `layout` zu übergeben. `onLayoutChange` meldet jede Änderung, auch eine Größenänderung und eine Tab-Auswahl,
daher sollte erst in den Speicher geschrieben werden, wenn sich die Änderungen beruhigt haben (ein kurzer Timer, der bei jeder Meldung zurückgesetzt wird).

In Rust lesen und schreiben `DockAreaLayout::to_state` und `from_state` `DockAreaState`, das Layout-Dateiformat,
das auch das Dock von `gpui-base` verwendet.

<a id="phones-and-narrow-windows"></a>

## Smartphones und schmale Fenster

Das Dock passt sich seiner eigenen Breite an. Ein Bereich ab 600 Punkten Breite (in einem Fenster auf dem Desktop, im Web, auf einem Tablet, einem
iPad im Vollbild, einem aufgeklappten Foldable) ist der vollständige Arbeitsbereich: Splits, Gruppen und Docks nebeneinander, wie bei den
Multi-Pane-Apps eines Tablets. Mit dem Finger auf einem Smartphone oder Tablet beginnt ein Tab-Drag mit einem langen Druck, wie bei Drag and Drop in iPadOS, sodass eine Tab-Leiste
weiterhin unter einer Wischgeste scrollt, und Griffe erhalten einen breiteren Touch-Bereich bei gleichem Aussehen.

Ein Bereich, der schmaler als 600 Punkte ist (auf einem Smartphone, einem iPad in Slide Over, in einem schmalen Desktop- oder Browserfenster oder in einer
schmalen Spalte eines breiten), stellt dasselbe Layout für einen Bildschirm dar, so wie die Split Views des iPad ihre Spalten einklappen und das Supporting
Pane von Material Design zu einem Bottom Sheet wird:

- Die Mitte zeigt jeweils eine Gruppe in voller Größe. Ihre Tab-Leiste listet jedes sichtbare Panel der Mitte auf, und die Auswahl
  eines Panels einer anderen Gruppe macht diese Gruppe zur angezeigten.
- Das linke und das rechte Dock sind Drawer über der Mitte, die von ihrem Rand hereingleiten und so breit sind wie das Dock, und das untere Dock ist ein
  Sheet, das so hoch ist wie das Dock. Es wird jeweils nur eines angezeigt, wenn die App es darstellt (`toggleDock`, `setDockOpen`, die
  das andere schließen); es gleitet hinein und hinaus, und ein Druck auf seinen Backdrop, Escape oder Zurück schließt es. Beim Wechsel in die
  kompakte Darstellung wird keines angezeigt.
- Ein gezogener Tab (ein Finger nach einem langen Druck, ein Zeiger sofort) bewegt sich innerhalb der Tab-Leiste, um sie umzusortieren.

Jedes Panel bleibt in beiden Darstellungen platziert, sodass beim Wechsel sein Inhalt erhalten bleibt. Der angezeigte Drawer oder das angezeigte Sheet gehört
der kompakten Darstellung: `open` des Layouts gehört zur vollständigen Darstellung, und das Anzeigen oder Schließen eines
Drawers meldet kein `onLayoutChange`, sodass ein Bereich, der wieder breiter wird, die Docks genau so zeigt, wie sie waren.
`onDockOpenChange` meldet beides: ein Dock, dessen Layout-`open` sich in der vollständigen Darstellung ändert, einen Drawer oder ein Sheet, das in der kompakten
angezeigt oder geschlossen wird, und jedes Dock, dessen angezeigter Zustand sich beim Wechsel der Darstellung ändert. In
`renderDock` gibt `open` an, ob das Dock in der aktuellen Darstellung angezeigt wird. Auch das Layout bleibt derselbe Wert,
sodass ein Bereich, der die 600 Punkte überschreitet (ein Foldable, das sich öffnet, ein iPad, das Split View beitritt, ein Fenster oder eine Spalte, deren Größe geändert wird),
jedes Panel an seiner Stelle belässt und die App ein einziges Layout speichert. Die Breite des Bereichs entscheidet, sobald er gelayoutet ist (davor
dient die Breite des Fensters als Ersatz), und `compact` wählt die Darstellung anstelle der Breite. Die
Drawer, das Sheet und der Backdrop sind Teile, die die App gestaltet (`drawerClass`, `sheetClass`, `backdropClass`), wie der
Rest des Bereichs.

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | keiner | Das angezeigte Layout (kontrolliert): Reichen Sie zurück, was `onLayoutChange` meldet. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | ein leerer Mittelbereich | Das anfängliche Layout, wenn `layout` nicht gesetzt ist; danach verwaltet der Bereich sein Layout selbst. |
| `locked` | `.locked(..)` | `boolean` | `false` | Tabs lassen sich nicht ziehen, ablegen oder schließen. |
| `compact` | `.compact(..)` | `boolean` | nach Breite | Die Smartphone-Darstellung (`true`) oder die vollständige (`false`); ohne Angabe kompakt, solange der Bereich schmaler als 600 Punkte ist. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | Was jedes Panel erlaubt, nach Schlüssel: `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | keiner | Der Inhalt eines Panels, nach seinem Schlüssel (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | der Schlüssel | Was ein Tab anzeigt. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | keiner | Was sich im Drop-Indikator befindet: `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | keiner | Das eigene Chrome eines Docks, vor seinem Layout: `placement`, `open` (in der aktuellen Darstellung angezeigt), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | keiner | Was ein leerer Mittelbereich anzeigt. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | keiner | Was dem Zeiger oder Finger folgt, während ein Tab gezogen wird. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Rahmen jeder Tab-Gruppe. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jede Tab-Leiste (`flex-row` für eine Zeile). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Jeder Tab; `selected:` für den angezeigten. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Inhaltsrahmen jeder Gruppe, in dem ihre Panels angezeigt werden. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Drop-Indikator. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Indikator jedes Handles, zwischen den Gruppen eines Splits und am Rand jedes Docks; `group-hover:` und `group-active:` folgen dem Handle. Er ist quer zum Handle 1 Punkt breit und verläuft über die gesamte Länge, sofern nichts anderes angegeben ist, sodass `bg-border` in beiden Fällen eine Haarlinie ist; `w-[3px]` / `h-[3px]` machen ihn dicker. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Thumb jedes Handles: ein Griff, zentriert auf der Linie, aufrecht gezeichnet wie auf einer vertikalen Linie und auf einer horizontalen um eine Vierteldrehung gedreht, sodass eine Klasse beide Achsen bedient. Er bleibt dieselbe View, während das Handle überfahren, gedrückt und gezogen wird, sodass die Klassen `group-hover:` und `group-active:` ihn mit einem Übergang versehen (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Der Rahmen jedes Docks. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Kompakt: die Drawer der seitlichen Docks. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Kompakt: das Sheet des unteren Docks. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | keiner | Kompakt: der Hintergrund hinter einem geöffneten Drawer oder Sheet; ein Druck darauf schließt es. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | keiner | Was Screenreader für jedes Handle ansagen, zwischen den Gruppen eines Splits und am Rand jedes Docks. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | Die [Methoden](#methods) des Bereichs. |
| `class`, `style` | Style-Methoden | `string`, `StyleProp<ViewStyle>` | keiner | Der Bereich selbst: seine Größe im übergeordneten Element (`flex-1`), sein Hintergrund. Er bleibt innerhalb seiner Grenzen und übernimmt keine Mindestgröße von seinem Inhalt. |

## Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | Das Layout hat sich geändert (ein Drag, eine Auswahl, eine Größenänderung, ein geöffnetes oder geschlossenes Dock, eine Methode): `{ layout }`, das gesamte neue Layout mit jeder darin enthaltenen ID. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: Ein Panel ist der angezeigte Tab seiner Gruppe geworden oder hat aufgehört, es zu sein (ein geschlossenes Dock zeigt keinen an). Einmal pro Änderung; einem Panel, das verschwindet, wird `false` nicht mitgeteilt: `onPanelRemove` ist sein Ende. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: Ein Panel hat den Bereich endgültig verlassen: geschlossen, entfernt oder in einem neuen Layout nicht mehr enthalten. Ein Panel, das verschoben wird, erfährt davon nie. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | Eine Gruppe wurde herein- oder herausgezoomt: `{ panel }`, das Panel, das sie anzeigt, oder `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: Ein Dock wurde ein- oder ausgeblendet: In der vollständigen Darstellung hat sich sein Layout `open` geändert, in der kompakten wurde sein Drawer oder Sheet angezeigt oder geschlossen, oder die Darstellung wurde gewechselt. |

## Parts

| Teil | Innerhalb | Gestaltet mit | Zustände |
|---|---|---|---|
| Der Bereich | | `class`, `style` | |
| Eine Tab-Gruppe | eine Region | `groupClass`, `groupStyle` | |
| Eine Tab-Leiste | eine Gruppe | `tabBarClass`, `tabBarStyle` | |
| Ein Tab | eine Tab-Leiste | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| Der Inhalt einer Gruppe | eine Gruppe | `contentClass`, `contentStyle`; `renderPanel` | |
| Der Indikator eines Handles | zwischen den Gruppen eines Splits, am Rand eines Docks | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| Der Thumb eines Handles | zentriert auf der Linie eines Handles | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (gedrückt, bis der Drag endet) |
| Ein Dock | eine Kante | `dockClass`, `dockStyle`; `renderDock` | |
| Der Drop-Indikator | über einer Gruppe während eines Drags | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| Die Drag-Vorschau | unter dem Zeiger oder Finger | `renderDragPreview` | |
| Der leere Mittelbereich | der Mittelbereich | `renderEmpty` | |
| Ein Drawer, das Sheet, der Hintergrund | über dem Mittelbereich, kompakt | `drawerClass`, `sheetClass`, `backdropClass` (und ihre Styles) | |

<a id="accessibility"></a>

## Barrierefreiheit

- Für Screenreader ist jeder Tab ein Tab mit seinem Auswahlzustand, wie bei [`Tab`](./tabs.md), und seine Aktivierung wählt ihn aus. Seine Beschriftung ist der Text, den `renderTab` zeichnet.
- Jedes Handle, zwischen den Gruppen eines Splits und am Rand jedes Docks, ist ein einstellbares Element mit der Beschriftung `handleAccessibilityLabel`. Die Handles zwischen den Gruppen eines Splits sind die von [Resizable](./resizable.md): Ein Screenreader verschiebt sie jeweils um 10 Punkte, gemeldet mit `onLayoutChange`.
- In der kompakten Darstellung schließen Escape und Zurück den angezeigten Drawer bzw. das angezeigte Sheet.

Allgemeines zu Beschriftungen, Rollen und Ansagen finden Sie unter [Barrierefreiheit](../docs/accessibility.md).

<a id="platform-notes"></a>

## Hinweise zu Plattformen

- Ein Zeiger (eine Maus, ein Trackpad, ein über dem Bildschirm schwebender Stift) zieht einen Tab, sobald er sich bei gedrückter Taste um 4 Punkte bewegt, auf jeder Plattform: Ein iPad mit Trackpad und ein schmales Browserfenster, das mit der Maus bedient wird, verhalten sich dabei wie ein Desktop. Unter macOS, Windows, Linux und GPUI gilt jeder Druck als Zeiger-Druck, auch der eines Fingers auf dem Touchscreen eines Laptops.
- Ein Finger zieht auf iOS, iPadOS und Android einen Tab nach einem langen Druck, wie bei Drag and Drop unter iPadOS, sodass ein Wischen über die Tab-Leiste diese scrollt.
- Desktops und das Web: Handles zeigen den Größenänderungs-Cursor ihrer Achse.
- Smartphones und schmale Bereiche: die kompakte Darstellung, mit Drawern und einem unteren Sheet.
- Jede Plattform zeichnet, was die App gestaltet: Tabs, Tab-Leisten, Handles, den Drop-Indikator, Docks, Drawer und das Sheet.
