---
title: "nsh/desktop"
description: "API solo per desktop: la finestra (titolo, barra del titolo, ingrandimento, schermo intero), una barra del titolo personalizzata dell'app con aree trascinabili, il menu dell'applicazione, i menu contestuali e le scorciatoie da tastiera."
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` raccoglie ciò che esiste solo sui desktop: la finestra e la sua barra del titolo, il menu dell'applicazione e i menu contestuali. Funziona su macOS, Windows e Linux. Il codice Rust trova le stesse cose in `nsh_core::element::desktop`: le funzioni della finestra (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), il menu dell'applicazione e i menu contestuali (`set_application_menu`, `popup_menu`, composti da `MenuItem`), e contrassegna le view trascinabili con `.window_drag(true)`; TSX importa `nsh/desktop`. Il modulo può essere importato su ogni piattaforma, quindi un solo bundle funziona ovunque: su iOS e Android le sue funzioni non fanno nulla, e `isAvailable` indica se la finestra e i menu sono presenti.

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

`true` dove le API di finestra e menu di questo modulo funzionano: macOS, Windows e Linux; `false` altrove. Rust: `os().is_desktop()`.

[`platform.desktop`](./nsh.md#platform) è il controllo più ampio per il comportamento desktop (proprietà `desktop={{…}}`, `platform.select({ desktop })`): vale anche nei browser nell'idioma desktop, che girano nella finestra del browser stesso. Condiziona layout, densità e input desktop con `platform.desktop`, e le chiamate a `Window` e `Menu` con `isAvailable`.

<a id="window"></a>

## Finestra

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

La colonna Rust indica i nomi delle funzioni di `nsh_core::element::desktop`.

| Membro | Rust | Descrizione |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | Il titolo della finestra: la barra del titolo, la taskbar o il Dock, il selettore di finestre. |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` rimuove la barra del titolo di sistema: l'app riempie la finestra fino al bordo superiore e disegna una propria barra del titolo. I controlli di finestra del sistema restano (i traffic lights di macOS, i pulsanti riduci a icona / ingrandisci / chiudi di Windows, i pulsanti di finestra di GTK). `height` è l'altezza della tua barra in punti: i controlli vi sono centrati (i caption button di Windows la riempiono; su macOS `height` seleziona il chrome compatto fino a 44 punti e il chrome regolare oltre; dimensiona la tua barra usando l'altezza effettiva da `titleBar().height`, e AppKit posiziona i traffic lights durante il ridimensionamento live. La toolbar esistente di un'app che incorpora mantiene il proprio stile e la propria altezza); senza di essa assumono l'altezza della piattaforma. `style: "default"` ripristina la barra del titolo di sistema (Rust: `set_title_bar(TitleBarStyle::Default, None)`). |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | Su Windows e Linux nelle app GPUI, dove la finestra disegna il menu dell'applicazione come barra sopra l'app: `"shown"` (predefinito) la mostra sempre; `"autoHide"` la mostra dopo che Alt viene premuto e rilasciato da solo, finché Alt da solo non la nasconde di nuovo, come nelle app Windows e GNOME. F10 e Alt con l'iniziale di un menu aprono comunque un menu, e la barra resta visibile finché è aperto. La barra dei menu di macOS è quella del sistema. |
| `minimize()` | `minimize()` | Riduce a icona la finestra. |
| `toggleMaximize()` | `toggle_maximize()` | Ingrandisce la finestra, o la ripristina se è già ingrandita. |
| `toggleFullScreen()` | `toggle_full_screen()` | Attiva o disattiva lo schermo intero. |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | Sposta e ridimensiona la finestra in punti; i campi omessi mantengono i loro valori. Su macOS e Windows, `size` (`width`, `height`) include le decorazioni della finestra; su Linux imposta la dimensione predefinita della finestra GTK. `origin` (`x`, `y`) è l'angolo in alto a sinistra della finestra, misurato dall'angolo in alto a sinistra dello schermo principale (su macOS quello con la barra dei menu) con `y` che cresce verso il basso, uguale su ogni piattaforma; un `height` senza `y` mantiene il bordo superiore dov'è, quindi la finestra cresce e si riduce sul bordo inferiore. `animated: true` abilita l'animazione di ridimensionamento di macOS (predefinito: false). |
| `setLevel(level)` | `set_level(level)` | Su macOS e Windows, `"floating"` mantiene la finestra sopra le finestre normali e `"normal"` ripristina il livello normale. `"desktopIcon"` seleziona il livello delle icone del desktop di macOS (la finestra sta anche su ogni spazio, fuori da Mission Control e Cmd+`); su Windows sposta la finestra in fondo allo z-order corrente, dove un'attivazione successiva può riportarla in alto. |
| `orderFront()` | `order_front()` | Porta la finestra davanti al suo livello e le dà il focus (l'app si attiva; macOS ripristina dal Dock, Windows ripristina le finestre ridotte a icona e imposta il primo piano, GTK la presenta). La finestra mantiene il suo livello. Su macOS, le superfici a livello desktop restano dietro le altre finestre. GPUI attiva la sua finestra; su Linux il window manager controlla le richieste di primo piano. |
| `close()` | `close_window()` | Chiude la finestra; con essa termina l'app. |

Il ridimensionamento della finestra è supportato su macOS, Windows e Linux; posizionamento e livelli su macOS e Windows. Il window manager di Linux controlla posizionamento e sovrapposizione. Nelle app GPUI, `setFrame` imposta la dimensione della finestra e la piattaforma la posiziona; l'host di GPUI sceglie posizione e livello all'apertura della finestra.

Quando dimensioni una finestra a partire dal contenuto misurato con `onLayout`, lascia spazio per le decorazioni della finestra su macOS e Windows. `width` e `height` accettano numeri finiti positivi; `x` e `y` accettano numeri finiti. I campi non validi mantengono i valori precedenti.

<a id="a-title-bar-of-your-own"></a>

## Una barra del titolo personalizzata

Con la barra del titolo nascosta, l'app disegna una propria barra e indica quali sue parti spostano la finestra, con `.window_drag(true)` in Rust e `desktop={{ windowDrag: true }}` in TSX:

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

Premere una view con `windowDrag` trascina la finestra come farebbe la barra del titolo di sistema: un doppio clic la ingrandisce (o fa ciò che l'utente ha impostato: su macOS, "Fai doppio clic sulla barra del titolo di una finestra per"), e su Windows e Linux un clic destro apre il menu della finestra.

- La view più vicina che imposta `windowDrag` decide: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) mantiene cliccabile una parte di una view trascinabile.
- I campi di testo e le view con gestori di pressione o tocco (`onPress`, `onTouch*`, responder) dentro una view trascinabile restano cliccabili di per sé: il campo di ricerca e gli eventuali pulsanti nell'esempio sopra funzionano normalmente.
- `windowDrag` funziona anche con la barra del titolo di sistema: anche una sidebar o una toolbar può spostare la finestra.

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

L'area della barra del titolo nascosta, in punti (reattiva): la sua `height`, e le larghezze occupate dai controlli di finestra del sistema alle estremità `left` e `right`. Usala per disporre la tua barra in modo che nulla finisca sotto i controlli. Tutti e tre valgono 0 mentre il sistema mostra la sua barra del titolo (e a schermo intero, e fuori dai desktop). Rust: `title_bar() -> Edges<Points>`, il cui `top` è l'altezza e `left` e `right` le larghezze dei controlli; leggerlo sottoscrive le modifiche.

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, altrimenti quella della barra del titolo (28 o 32, in base alla versione di macOS) | La larghezza dei traffic lights | 0 |
| Windows | `height`, altrimenti 32 | 0 | I tre caption button (138) |
| Linux | `height`, altrimenti quella della header bar | I pulsanti di finestra all'inizio (la disposizione dei pulsanti del desktop) | I pulsanti di finestra alla fine |

Su Windows i caption button sono disegnati da NSH nello stile di Windows 11 e seguono l'aspetto dell'app; passando il mouse sul pulsante di ingrandimento compaiono gli snap layout di Windows 11. La finestra mantiene bordi di ridimensionamento, ombra e angoli arrotondati su ogni piattaforma.

## Menu

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| Membro | Descrizione |
|---|---|
| `setApplicationMenu(items)` | Imposta il menu dell'applicazione: un sottomenu per ogni voce di primo livello (`File`, `Edit`, ...). Su macOS è la barra dei menu, il cui primo menu è il menu dell'app (AppKit lo intitola con il nome dell'app). Su Windows e Linux è la barra dei menu della finestra, che non viene mostrata mentre la barra del titolo è nascosta; le sue scorciatoie funzionano comunque, e una barra del titolo propria dell'app può aprirne i menu con `Menu.popup`. `null` ripristina il menu predefinito della piattaforma. |
| `popup(items, at?)` | Mostra un menu contestuale con l'angolo in alto a sinistra in `at` (coordinate della finestra, in punti: il `e.pagePosition` di un `onContextMenu`), o in corrispondenza del puntatore. La promise si risolve alla chiusura del menu, sia che una voce sia stata scelta o no: un pulsante che l'ha aperto può restare premuto fino ad allora. |

In Rust, `set_application_menu(items)` accetta un `Vec<MenuItem>` (`None` ripristina il menu predefinito della piattaforma), e `popup_menu(items)` (al puntatore) e `popup_menu_at(items, at)` restituiscono un `Answer<()>` che arriva alla chiusura del menu (attenderlo è facoltativo). Il gestore di una voce viene eseguito sotto l'owner che ha impostato il menu, finché quell'owner è vivo.

Chiama di nuovo `setApplicationMenu` per cambiare il menu. Dentro un `effect` segue i signal che legge: un segno di spunta o uno stato disabilitato che dipende dallo stato dell'app resta aggiornato.

<a id="menu-items"></a>

### Voci di menu

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

| Campo | Descrizione |
|---|---|
| `label` | Ciò che la voce mostra. Una voce con ruolo ha un'etichetta propria senza di esso. |
| `onSelect` | Chiamato quando la voce viene scelta, con un clic o con la sua scorciatoia. |
| `shortcut` | La sua scorciatoia da tastiera: modificatori e un tasto uniti da `+`, come `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` o `"f11"`. I modificatori sono nella tabella qui sotto. I tasti sono lettere, cifre e punteggiatura, scritti come il carattere che il tasto digita su una tastiera US senza Shift (`,`, `/`; `"shift+/"` per `?`), oppure un nome: `plus` (il tasto `=` / `+`, anche `=`), `minus` (anche `-`), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, le frecce `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`. Maiuscole e minuscole non contano (`"Mod+Shift+N"` è `"mod+shift+n"`; una lettera maiuscola è lo stesso tasto, non Shift), e il minuscolo è lo stile consigliato. Una scorciatoia non valida (`"mod-n"`, `"mod++"`, `"mod+?"`) genera un errore che indica la grafia corretta. `keymap` accetta gli stessi tasti. I menu la mostrano nello stile della piattaforma (`⇧⌘N` su macOS, `Ctrl+Shift+N` su Windows). |
| `when` | Quando la scorciatoia sceglie la voce mentre un campo di testo ha il focus della tastiera, nel backend GPUI: `"always"` (predefinito), `"auto"` (a meno che il campo non usi il tasto stesso: tasti che scrivono, spostano il cursore o cancellano, e le scorciatoie di modifica, come i binding di [`keymap`](./nsh.md#keymap)) o `"notEditing"`. Un tasto che la voce lascia passa al campo. |
| `disabled` | `true` rende la voce grigia e non selezionabile (predefinito `false`). |
| `checked` | Impostalo (a `true` o `false`) per una voce con segno di spunta. |
| `submenu` | Trasforma la voce in un sottomenu (richiede un `label`). |
| `role` | Una voce standard che la piattaforma esegue (sotto). |

Le voci `null`, `undefined` e `false` vengono omesse, quindi `cond && { … }` funziona in una lista.

In Rust, una voce è `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` o `MenuItem::submenu(label, items)`, con i campi come metodi: `.shortcut("mod+n")` (va in panic con una scorciatoia non valida, indicando la grafia corretta), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)`, e `.label(..)` per la voce di un ruolo.

Modificatori:

| Modificatore | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (anche `cmdorctrl`) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (anche `command`, `meta`, `super`, `win`) | Command (⌘) | Tasto Windows | Super |
| `ctrl` (anche `control`) | Control (⌃) | Ctrl | Ctrl |
| `alt` (anche `option`, `opt`) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

Usa `mod` per le scorciatoie proprie dell'app: è il tasto che le app di ogni piattaforma usano per esse (⌘N su macOS, Ctrl+N su Windows e Linux), quindi un'unica grafia va bene ovunque. Il tasto Windows e Super appartengono per lo più al sistema (Win+E, la panoramica di GNOME), quindi `cmd` è raramente la scelta giusta fuori da macOS.

Ruoli:

| Ruolo | Azione | Piattaforme |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | Le voci standard del menu dell'app | macOS (omesse altrove) |
| `quit` | Esce dall'app | Tutte |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | Modificano il campo di testo con il focus (le sue scorciatoie restano sue) | Tutte |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | La finestra | Tutte |

Una voce con ruolo ha l'etichetta e la scorciatoia della piattaforma a meno che non ne imposti di proprie (macOS aggiunge il nome dell'app a `about`, `hide` e `quit`).

Le scorciatoie di menu hanno la precedenza, come nelle app native: un tasto preso da una voce non raggiunge mai il campo di testo con il focus né i tasti propri di NSH. Solo un binding di [`keymap`](./nsh.md#keymap) con la stessa combinazione ha la precedenza su di esse. Quindi assegna le scorciatoie di modifica (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) solo ai ruoli di modifica, che le passano al campo di testo, ed evita i tasti senza modificatore (`escape`, le frecce, le lettere), che li toglierebbero ai campi di testo e alla navigazione indietro. Nel backend GPUI, `when: "auto"` permette a una voce di condividere un tasto con i campi di testo: `delete` o `mod+z` scelgono la voce quando nessun campo ha il focus e modificano il testo quando ce l'ha uno.

Nel backend GPUI, un componente nativo con il focus della tastiera vede ogni tasto per primo. Un tasto che gestisce da sé non raggiunge mai la keymap né il menu. Un tasto che lascia passare raggiunge la keymap come se un campo di testo avesse il focus, poi il menu.

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

Un menu contestuale, dalla pressione di un pulsante:

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
> I menu sono quelli del sistema (NSMenu, menu Win32, menu popover GTK): hanno l'aspetto e il comportamento di quelli di ogni altra app, seguono l'aspetto del sistema (o dell'app) e sono accessibili da tastiera. `examples/desktop` è un'app con una barra del titolo propria, un menu dell'applicazione e menu contestuali.
