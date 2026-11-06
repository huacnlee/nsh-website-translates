---
title: "nsh/desktop"
description: "APIs nur für Desktop: das Fenster (Titel, Titelleiste, Maximieren, Vollbild), eine eigene Titelleiste der App mit verschiebbaren Bereichen, das Anwendungsmenü, Kontextmenüs und Tastenkürzel."
order: 12.5
source_hash: 460c34aa14353d38
---


# nsh/desktop

`nsh/desktop` enthält, was es nur auf Desktops gibt: das Fenster und seine Titelleiste, das Anwendungsmenü und Kontextmenüs. Es funktioniert unter macOS, Windows und Linux. Rust-Code findet dasselbe in `nsh_core::element::desktop`: die Funktionen des Fensters (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), das Anwendungsmenü und Kontextmenüs (`set_application_menu`, `popup_menu`, aufgebaut aus `MenuItem`-Objekten) und markiert ziehbare Views mit `.window_drag(true)`; TSX importiert `nsh/desktop`. Das Modul lässt sich auf jeder Plattform importieren, sodass ein Bundle überall läuft: Unter iOS und Android tun seine Funktionen nichts, und `isAvailable` zeigt an, ob Fenster und Menüs vorhanden sind.

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true`, wo die Fenster- und Menü-APIs dieses Moduls funktionieren: unter macOS, Windows und Linux; anderswo `false`. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) ist die umfassendere Prüfung auf Desktop-Verhalten (`desktop={{…}}`-Props, `platform.select({ desktop })`): Sie gilt auch in Browsern im Desktop-Idiom, die im eigenen Fenster des Browsers laufen. Machen Sie Desktop-Layout, Dichte und Eingabe von `platform.desktop` abhängig und Aufrufe von `Window` und `Menu` von `isAvailable`.

<a id="window"></a>

## Fenster

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

Die Rust-Spalte nennt die Funktionen von `nsh_core::element::desktop`.

| Element | Rust | Beschreibung |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | Der Titel des Fensters: die Titelleiste, die Taskleiste oder das Dock, der Fensterwechsler. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` entfernt die Titelleiste des Systems: Die App füllt das Fenster bis zu seinem oberen Rand und zeichnet eine eigene Titelleiste. Die Fenstersteuerung des Systems bleibt erhalten (die Ampel-Buttons unter macOS, die Buttons zum Minimieren, Maximieren und Schließen unter Windows, die Fensterbuttons von GTK). `height` ist die Höhe Ihrer Leiste in Punkten: Die Steuerelemente werden darin zentriert (die Caption-Buttons unter Windows füllen sie aus; unter macOS wählt `height` kompaktes Chrome bis 44 Punkte und reguläres Chrome darüber; richten Sie Ihre Leiste nach der tatsächlichen Höhe aus `titleBar().height` aus, und AppKit positioniert die Ampel-Buttons beim Live-Resizing. Die vorhandene Toolbar einer einbettenden App behält ihren eigenen Stil und ihre eigene Höhe); ohne diesen Wert übernehmen sie die Höhe der Plattform. `style: "default"` bringt die Titelleiste des Systems zurück (Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | Unter Windows und Linux in GPUI-Apps, in denen das Fenster das Anwendungsmenü als Leiste über der App zeichnet: `"shown"` (der Standard) zeigt sie immer an; `"autoHide"` zeigt sie, nachdem Alt allein gedrückt und losgelassen wurde, bis Alt allein sie wieder ausblendet, wie in Windows- und GNOME-Apps. F10 und Alt mit dem Anfangsbuchstaben eines Menüs öffnen in beiden Fällen ein Menü, und die Leiste bleibt sichtbar, solange es geöffnet ist. Die Menüleiste von macOS gehört dem System. |
| `minimize()` | `minimize()` | Minimiert das Fenster. |
| `toggleMaximize()` | `toggle_maximize()` | Maximiert das Fenster oder stellt es wieder her, wenn es maximiert ist. |
| `toggleFullScreen()` | `toggle_full_screen()` | Wechselt in den Vollbildmodus oder verlässt ihn. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Verschiebt das Fenster und legt seine Größe in Punkten fest; ausgelassene Felder behalten ihre Werte. Unter macOS und Windows schließt `size` (`width`, `height`) die Fensterdekoration ein; unter Linux legt es die Standardfenstergröße von GTK fest. `origin` (`x`, `y`) ist die obere linke Ecke des Fensters, gemessen von der oberen linken Ecke des primären Bildschirms (unter macOS der mit der Menüleiste), wobei `y` nach unten wächst, auf jeder Plattform gleich; ein `height` ohne `y` behält den oberen Rand bei, sodass das Fenster an seinem unteren Rand wächst und schrumpft. `animated: true` aktiviert die Resize-Animation von macOS (Standard: false). |
| `setLevel(level)` | `set_level(level)` | Unter macOS und Windows hält `"floating"` das Fenster über normalen Fenstern, und `"normal"` stellt die normale Ebene wieder her. `"desktopIcon"` wählt unter macOS die Ebene der Desktop-Symbole (das Fenster liegt außerdem auf jedem Space, außerhalb von Mission Control und Cmd+`); unter Windows verschiebt es das Fenster an das Ende der aktuellen Z-Reihenfolge, wo eine spätere Aktivierung es wieder nach oben holen kann. |
| `orderFront()` | `order_front()` | Bringt das Fenster innerhalb seiner Ebene in den Vordergrund und gibt ihm den Fokus (die App wird aktiviert; macOS hebt die Minimierung auf, Windows stellt minimierte Fenster wieder her und setzt den Vordergrund, GTK präsentiert das Fenster). Das Fenster behält seine Ebene. Unter macOS bleiben Oberflächen auf Desktop-Ebene hinter anderen Fenstern. GPUI aktiviert sein Fenster; unter Linux steuert der Fenstermanager Anfragen zum Vordergrund. |
| `close()` | `close_window()` | Schließt das Fenster; die App endet damit. |

Die Fenstergröße wird unter macOS, Windows und Linux unterstützt; Positionierung und Ebenen unter macOS und Windows. Unter Linux steuert der Fenstermanager Platzierung und Stapelreihenfolge. In GPUI-Apps legt `setFrame` die Größe des Fensters fest, und die Plattform platziert es; der Host von GPUI wählt Position und Ebene, wenn er das Fenster öffnet.

Wenn Sie ein Fenster anhand von Inhalt dimensionieren, der mit `onLayout` gemessen wurde, planen Sie unter macOS und Windows Platz für die Fensterdekoration ein. `width` und `height` akzeptieren positive endliche Zahlen; `x` und `y` akzeptieren endliche Zahlen. Ungültige Felder behalten ihre vorherigen Werte.

<a id="a-title-bar-of-your-own"></a>

## Eine eigene Titelleiste

Bei ausgeblendeter Titelleiste zeichnet die App ihre eigene Leiste und legt mit `.window_drag(true)` in Rust und `desktop={{ windowDrag: true }}` in TSX fest, welche Teile davon das Fenster verschieben:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

Ein Druck auf eine View mit `windowDrag` zieht das Fenster so, wie es die Titelleiste des Systems täte: Ein Doppelklick maximiert es (oder bewirkt, was der Benutzer eingestellt hat: unter macOS „Doppelklick auf die Titelleiste eines Fensters“), und unter Windows und Linux öffnet ein Rechtsklick das Fenstermenü.

- Die nächstliegende View, die `windowDrag` setzt, entscheidet: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) hält einen Teil einer ziehbaren View anklickbar.
- Textfelder und Views mit Press- oder Touch-Handlern (`onPress`, `onTouch*`, Responder) innerhalb einer ziehbaren View bleiben auch ohne dieses Attribut anklickbar: Das Suchfeld und alle Buttons im obigen Beispiel funktionieren wie gewohnt.
- `windowDrag` funktioniert auch mit der Titelleiste des Systems: Eine Seitenleiste oder Toolbar kann das Fenster ebenfalls verschieben.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

Der Bereich der ausgeblendeten Titelleiste in Punkten (reaktiv): ihre `height` sowie die Breiten, die die Fenstersteuerung des Systems an ihrem `left`- und `right`-Ende einnimmt. Richten Sie Ihre Leiste daran aus, damit nichts unter die Steuerelemente gerät. Alle drei Werte sind 0, solange das System seine Titelleiste anzeigt (sowie im Vollbildmodus und außerhalb von Desktops). Rust: `title_bar() -> Edges<Points>`, dessen `top` die Höhe ist und dessen `left` und `right` die Breiten der Steuerelemente sind; das Lesen abonniert Änderungen.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, sonst die der Titelleiste (28 oder 32, je nach macOS-Version) | Die Breite der Ampel-Buttons | 0 |
| Windows | `height`, sonst 32 | 0 | Die drei Caption-Buttons (138) |
| Linux | `height`, sonst die der Header Bar | Die Fensterbuttons am Anfang (das Button-Layout des Desktops) | Die Fensterbuttons am Ende |

Unter Windows werden die Caption-Buttons von NSH im Stil von Windows 11 gezeichnet und folgen dem Erscheinungsbild der App; beim Überfahren des Maximieren-Buttons erscheinen die Snap-Layouts von Windows 11. Das Fenster behält auf jeder Plattform seine Resize-Ränder, seinen Schatten und seine abgerundeten Ecken.

<a id="menu"></a>

## Menü

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Element | Beschreibung |
|---|---|
| `setApplicationMenu(items)` | Legt das Anwendungsmenü fest: ein Untermenü pro Eintrag der obersten Ebene (`File`, `Edit`, ...). Unter macOS ist es die Menüleiste, deren erstes Menü das App-Menü ist (AppKit betitelt es mit dem Namen der App). Unter Windows und Linux ist es die Menüleiste des Fensters, die nicht angezeigt wird, solange die Titelleiste ausgeblendet ist; ihre Tastenkürzel funktionieren weiterhin, und eine eigene Titelleiste der App kann ihre Menüs mit `Menu.popup` öffnen. `null` stellt das Standardmenü der Plattform wieder her. |
| `popup(items, at?)` | Zeigt ein Kontextmenü mit seiner oberen linken Ecke bei `at` (den Koordinaten des Fensters in Punkten: das `e.pagePosition` eines `onContextMenu`) oder am Mauszeiger. Das Promise wird aufgelöst, sobald das Menü schließt, unabhängig davon, ob ein Eintrag gewählt wurde: Ein Button, der es geöffnet hat, kann bis dahin gedrückt bleiben. |

In Rust nimmt `set_application_menu(items)` ein `Vec<MenuItem>` entgegen (`None` stellt das Standardmenü der Plattform wieder her), und `popup_menu(items)` (am Mauszeiger) und `popup_menu_at(items, at)` geben ein `Answer<()>` zurück, das eintrifft, sobald das Menü schließt (darauf zu warten ist optional). Der Handler eines Eintrags läuft unter dem Owner, der das Menü festgelegt hat, solange dieser Owner lebt.

Rufen Sie `setApplicationMenu` erneut auf, um das Menü zu ändern. Innerhalb eines `effect` folgt es den Signals, die es liest: Ein Häkchen oder ein deaktivierter Zustand, der vom App-Zustand abhängt, bleibt aktuell.

<a id="menu-items"></a>

### Menüeinträge

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| Feld | Beschreibung |
|---|---|
| `label` | Was der Eintrag anzeigt. Der Eintrag einer Rolle hat ohne dieses Feld eine eigene Beschriftung. |
| `onSelect` | Wird aufgerufen, wenn der Eintrag gewählt wird, per Klick oder per Tastenkürzel. |
| `shortcut` | Sein Tastenkürzel: Modifikatoren und eine Taste, verbunden durch `+`, etwa `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` oder `"f11"`. Die Modifikatoren stehen in der Tabelle unten. Tasten sind Buchstaben, Ziffern und Satzzeichen, geschrieben als das Zeichen, das die Taste auf einer US-Tastatur ohne Shift tippt (`,`, `/`; `"shift+/"` für `?`), oder ein Name: `plus` (die Taste `=` / `+`, auch `=`), `minus` (auch `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, die Pfeile `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. Groß- und Kleinschreibung spielt keine Rolle (`"Mod+Shift+N"` ist `"mod+shift+n"`; ein Großbuchstabe ist dieselbe Taste, nicht Shift), und Kleinschreibung ist der empfohlene Stil. Ein ungültiges Tastenkürzel (`"mod-n"`, `"mod++"`, `"mod+?"`) löst einen Fehler aus, der die richtige Schreibweise nennt. `keymap` akzeptiert dieselben Tastenanschläge. Menüs zeigen es im eigenen Stil der Plattform an (`⇧⌘N` unter macOS, `Ctrl+Shift+N` unter Windows). |
| `when` | Legt fest, wann das Tastenkürzel den Eintrag wählt, während ein Textfeld den Tastaturfokus hat, im GPUI-Backend: `"always"` (der Standard), `"auto"` (außer das Feld verwendet die Taste selbst: Tasten, die tippen, den Cursor bewegen oder löschen, sowie die Bearbeitungskürzel, wie bei den Bindings von [`keymap`](./nsh.md#keymap)) oder `"notEditing"`. Eine Taste, die der Eintrag übrig lässt, geht an das Feld. |
| `disabled` | `true` graut den Eintrag aus (Standard `false`). |
| `checked` | Setzen Sie es (auf `true` oder `false`) für einen Eintrag mit Häkchen. |
| `submenu` | Macht den Eintrag zu einem Untermenü (es benötigt ein `label`). |
| `role` | Ein Standardeintrag, den die Plattform ausführt (siehe unten). |

Einträge vom Typ `null`, `undefined` und `false` werden ausgelassen, sodass `cond && { … }` in einer Liste funktioniert.

In Rust ist ein Eintrag `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` oder `MenuItem::submenu(label, items)`, wobei die Felder als Methoden vorliegen: `.shortcut("mod+n")` (bei einem ungültigen Tastenkürzel löst es einen Panic aus, mit der richtigen Schreibweise), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)` und `.label(..)` für den Eintrag einer Rolle.

Modifikatoren:

| Modifikator | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (auch `cmdorctrl`) | Command (⌘) | Strg | Strg |
| `cmd` (auch `command`, `meta`, `super`, `win`) | Command (⌘) | Windows-Taste | Super |
| `ctrl` (auch `control`) | Control (⌃) | Strg | Strg |
| `alt` (auch `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Umschalt | Umschalt |

Verwenden Sie `mod` für eigene Tastenkürzel einer App: Es ist die Taste, die die Apps jeder Plattform dafür nutzen (⌘N unter macOS, Strg+N unter Windows und Linux), sodass eine Schreibweise überall passt. Die Windows-Taste und Super gehören größtenteils dem System (Win+E, die GNOME-Übersicht), daher ist `cmd` außerhalb von macOS selten die richtige Wahl.

Rollen:

| Rolle | Funktion | Plattformen |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Die Standardeinträge des App-Menüs | macOS (anderswo ausgelassen) |
| `quit` | Beendet die App | Alle |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Bearbeiten das fokussierte Textfeld (dessen eigene Tastenkürzel bleiben seine eigenen) | Alle |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | Das Fenster | Alle |

Der Eintrag einer Rolle hat die Beschriftung und das Tastenkürzel der Plattform, sofern er keine eigenen setzt (macOS ergänzt bei `about`, `hide` und `quit` den Namen der App).

Menü-Tastenkürzel haben Vorrang, wie in nativen Apps: Eine Taste, die ein Eintrag belegt, erreicht weder das fokussierte Textfeld noch die eigenen Tasten von NSH. Nur ein Binding von [`keymap`](./nsh.md#keymap) mit demselben Tastenanschlag kommt vor ihnen. Geben Sie die Bearbeitungskürzel (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) daher nur den Bearbeiten-Rollen, die sie an das Textfeld weiterreichen, und vermeiden Sie Tasten ohne Modifikator (`escape`, die Pfeile, Buchstaben), die sie Textfeldern und der Zurück-Navigation wegnehmen würden. Im GPUI-Backend lässt `when: "auto"` einen Eintrag eine Taste mit Textfeldern teilen: `delete` oder `mod+z` wählen den Eintrag, solange kein Feld den Fokus hat, und bearbeiten den Text, solange eines ihn hat.

Im GPUI-Backend sieht eine native Komponente mit Tastaturfokus jede Taste zuerst. Eine Taste, die sie selbst verarbeitet, erreicht weder die Keymap noch das Menü. Eine Taste, die sie durchlässt, erreicht die Keymap, als hätte ein Textfeld den Fokus, und danach das Menü.

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

Ein Kontextmenü, ausgelöst durch den Druck auf einen Button:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> Menüs sind die des Systems (NSMenu, Win32-Menüs, GTK-Popover-Menüs): Sie sehen aus und verhalten sich wie die jeder anderen App, folgen dem Erscheinungsbild des Systems (oder der App) und sind per Tastatur bedienbar. `examples/desktop` ist eine App mit eigener Titelleiste, einem Anwendungsmenü und Kontextmenüs.
