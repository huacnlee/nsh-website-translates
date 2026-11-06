---
title: "Menu"
description: "Menu e ContextMenu con MenuItem, MenuSeparator e Submenu: un popup con sottomenu a cascata sui desktop, un foglio con sottomenu sul posto sui telefoni, con stile definito dall'app."
group: base
demo: el-menu
source_hash: 31bd57113d599fac
---

# Menu

Un menu è un elenco di azioni che il suo trigger apre. Una sola struttura serve ogni dispositivo, presentata nel modo che ciascuno si aspetta:

- Su desktop e nei browser desktop, un popup in corrispondenza del trigger; un `Submenu` si apre a cascata accanto al proprio elemento quando il puntatore vi passa sopra o lo preme.
- Su telefoni e tablet, uno sheet nella parte inferiore dello schermo sopra un backdrop; un `Submenu` mostra i propri elementi nello sheet al posto di quelli del menu, con una tua riga che riporta indietro.

La scelta di un elemento, una pressione all'esterno, Escape, il pulsante indietro di Android e il gesto di uscita di VoiceOver lo chiudono. `ContextMenu` è lo stesso menu aperto dal pulsante secondario (un clic destro) in corrispondenza del puntatore, oppure, sui touchscreen, da un dito tenuto premuto sul suo trigger.

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

Tutti e cinque provengono da [`nsh/base`](../modules/nsh-base.md). Gli elementi raggiungono il loro menu da soli, quindi puoi disporli liberamente: gruppi in view, etichette, elementi che compaiono e scompaiono con `If`. `popupClass` applica lo stile al popup su desktop e allo sheet su telefono; uno stile che differisce tra i due può confrontare `platform.idiom` (`nsh`) con `"desktop"`.

<a id="menu-bars"></a>

## Menu bar

I menu i cui trigger sono elementi di un unico `Toolbar` formano una menu bar: con uno dei suoi menu aperto, il puntatore sopra il trigger di un altro menu apre quest'ultimo al posto del primo, e i tasti freccia si spostano tra i trigger.

```tsx
<Toolbar accessibilityLabel="Menu bar">
  <Menu trigger={<View><Text>File</Text></View>}>{/* … */}</Menu>
  <Menu trigger={<View><Text>Edit</Text></View>}>{/* … */}</Menu>
</Toolbar>
```

<a id="context-menus"></a>

## Menu contestuali

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

Su desktop il pulsante secondario lo apre dove si trova il puntatore. Sui touchscreen un dito tenuto premuto sul trigger lo apre come sheet; le pressioni proprie del trigger e le scroll view circostanti continuano a funzionare, e spostare il dito annulla la pressione prolungata.

<a id="checkable-items"></a>

## Elementi selezionabili

`checked` rende un elemento selezionabile: un'impostazione che il menu mostra ("Show sidebar") oppure, con `role="menuitemradio"`, una scelta all'interno di un gruppo ("Sort by"). Il valore è tuo: la scelta dell'elemento chiama `onSelect`, tu imposti il valore successivo e l'elemento lo mostra. Finché è selezionato, si applicano le sue classi `checked:` e `checkedStyle`, così come quelle del suo indicatore: la parte che precede il contenuto (`indicatorClass`, `indicatorStyle`) attorno al segno che gli assegni (`indicator`). Il segno viene creato una sola volta e conservato; le classi `checked:` dell'indicatore lo mostrano e lo nascondono, oppure lo fanno le classi `group-checked:` del segno stesso con `group` in `indicatorClass`. `closeOnSelect={false}` mantiene aperto il menu, così un'impostazione mostra subito il nuovo valore.

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

Un segno sul bordo finale va invece nel contenuto, con stile definito dalle classi `group-checked:` sotto `group` sull'elemento.

<a id="entrance-and-exit"></a>

## Ingresso e uscita

Su desktop il popup compare e scompare con le tue transizioni, come quello di un [Popover](./popover.md#entrance-and-exit): `popupStartingClass` è il suo aspetto nel primo frame, `popupEndingClass` il suo aspetto una volta chiuso, che mantiene mentre le classi `transition-*` di `popupClass` sono in esecuzione, e `onClose` segue. I sottomenu assumono gli stessi aspetti e si chiudono insieme al proprio menu. Lo sheet dei telefoni scorre dentro e fuori da solo.

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

<a id="open-state"></a>

## Stato di apertura

Senza `open`, un menu mantiene il proprio stato (da `defaultOpen` per `Menu`). Con `open`, lo stato appartiene all'app, che lo modifica in `onOpenChange({ open, reason })`: `"triggerPress"`, `"select"`, `"pressOutside"`, `"backdropPress"`, `"cancel"`, `"contextMenu"` o `"longPress"`.

## Props

<a id="menu-1"></a>

### Menu

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | nessuno | Aperto, controllato dall'app. |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Aperto all'inizio, senza `open`. |
| `placement` | `.placement(..)` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Desktop: il lato del trigger su cui si posiziona. |
| `align` | `.align(..)` | `"start" \| "center" \| "end"` | `"start"` | Desktop: come si allinea al trigger. |
| `offset` | `.offset(..)` | `number` | `0` | Desktop: lo spazio tra il trigger e il popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktop: la distanza che mantiene dai bordi della safe area. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il popup (desktop) o lo sheet (telefoni), e i popup dei sottomenu. |
| `popupStartingClass`, `popupStartingStyle` | `.popup_starting_class(..)`, `.popup_starting_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Desktop: l'aspetto dei popup nel primo frame, sopra il loro. |
| `popupEndingClass`, `popupEndingStyle` | `.popup_ending_class(..)`, `.popup_ending_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Desktop: l'aspetto dei popup una volta chiusi, mantenuto mentre le loro transizioni sono in esecuzione. |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Telefoni: il backdrop dietro lo sheet. |
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | Ciò che lo apre quando viene premuto. Finché il menu è aperto, si applicano le sue classi `aria-expanded:` e `expandedStyle`. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Gli elementi, creati a ogni apertura. |

### ContextMenu

`open`, `popupClass` / `popupStyle`, gli aspetti iniziale e finale, `backdropClass` / `backdropStyle`, `trigger` e `children` come per `Menu`, e:

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il pulsante secondario e i diti tenuti premuti non fanno nulla. |
| `offset` | `.offset(..)` | `number` | `0` | Desktop: lo spazio tra il puntatore e il popup. |
| `margin` | `.margin(..)` | `number` | `0` | Desktop: la distanza che mantiene dai bordi della safe area. |

### MenuItem

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Non selezionabile con la scelta; si applicano gli stili `disabled:`. |
| `checked` | `.checked(..)` | `boolean` | nessuno | Selezionato o no, il che lo rende un elemento selezionabile; appartiene all'app. |
| `checkedStyle` | `.checked_style(..)` | `StyleProp<ViewStyle>` | nessuno | Il suo stile mentre è selezionato, come classi `checked:`. |
| `role` | `.role(..)` | `AccessibilityRole` | `"menuitemcheckbox"` con `checked`, altrimenti `"menuitem"` | Ciò che rappresenta per gli screen reader; `"menuitemradio"` per una scelta all'interno di un gruppo. |
| `indicatorClass`, `indicatorStyle` | `.indicator_class(..)`, `.indicator_style(..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore, la parte che precede il contenuto; le sue classi `checked:` e `disabled:` seguono l'elemento. |
| `indicator` | `.indicator(..)` | `JSX.Element` | nessuno | Il segno all'interno dell'indicatore. |
| `closeOnSelect` | `.close_on_select(..)` | `boolean` | `true` | Sceglierlo chiude il menu. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader, quando il contenuto non basta. |
| `children`, `class`, `style` | `.child(..)`, metodi di stile | | nessuno | Il suo contenuto e il suo aspetto, con gli stati `hover:`, `active:` e `checked:`. |

### Submenu

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `trigger` | `.trigger(..)` | `JSX.Element` | nessuno | L'elemento che lo apre. |
| `back` | `.back(..)` | `JSX.Element` | nessuno | Telefoni: la riga sopra i suoi elementi che riporta agli elementi circostanti. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Non si apre. |
| `offset` | `.offset(..)` | `number` | `0` | Desktop: lo spazio tra il menu che lo contiene e il suo popup. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | I suoi elementi. |

`MenuSeparator` è una view a cui applichi uno stile (`class`, `style`), mostrata insieme agli elementi del suo livello.

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onOpenChange` (`Menu`, `ContextMenu`) | `.on_open_change(\|e\| ..)` | Si è aperto o chiuso, con il motivo. |
| `onOpen` (`Menu`, `ContextMenu`) | `.on_open(\|\| ..)` | È visibile; come sheet, dopo essere entrato. |
| `onClose` (`Menu`, `ContextMenu`) | `.on_close(\|\| ..)` | Non c'è più: come sheet dopo essere uscito, come popup dopo la sua uscita. Anche quando l'app lo ha chiuso. |
| `onPosition` (`Menu`, `ContextMenu`) | `.on_position(\|e\| ..)` | Desktop: il popup è stato posizionato: `placement` (il lato su cui è andato), `bounds`, `available`. |
| `onCancel` (`Menu`, `ContextMenu`) | `.on_cancel(\|\| ..)` | L'utente ha provato a chiuderlo senza scegliere (Escape o indietro, una pressione all'esterno o sul backdrop). |
| `onSelect` (`MenuItem`) | `.on_select(\|\| ..)` | L'elemento è stato scelto; un elemento selezionabile richiede il suo altro valore. |

<a id="accessibility"></a>

## Accessibilità

Il popup o lo sheet è un menu e i suoi elementi sono elementi di menu per gli screen reader; il trigger indica se il menu è espanso. Un elemento selezionabile è un elemento di menu di tipo checkbox o radio, letto come selezionato o non selezionato; il suo indicatore fa parte dell'elemento. In TSX il trigger è l'elemento che passi, un `Button` o una view tua: riceve da sé le pressioni e lo stato di espansione, quindi le sue classi `active:` e `activeStyle` si applicano mentre è premuto, e viene eseguito anche il suo `onPress`. Sono a schermo solo gli elementi del livello mostrato, quindi gli screen reader leggono ciò che è presente.
