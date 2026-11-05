---
title: "Elementi"
description: "Le primitive e i componenti di base con cui è costruita ogni app NSH, in Rust e TSX, insieme alle prop, agli eventi e ai metodi ref che tutti condividono."
order: 1
source_hash: 84e4cb96ec250ab2
---

# Elements

Native Shell costruisce ogni schermata a partire da un piccolo insieme di elementi: le primitive, come `View`, `Text` e `Image`, e i componenti base, come `Button`, `Dialog` e `NavStack`. Ogni primitiva è una view nativa (una sottoclasse di UIView su iOS e Mac Catalyst, un `View` di Android, una view AppKit, GTK o Win32 sui desktop), creata e posizionata dal runtime di NSH. Tutto ciò che un'app mostra è fatto di questi elementi: i pulsanti, le card, le righe e le schermate di un'app sono suoi componenti, disegnati con questi elementi e stilizzati dall'app, quindi l'aspetto dell'app è interamente suo.

Ogni esempio in queste pagine è disponibile in Rust e in TSX: scegli una scheda e tutti gli esempi della pagina la seguono.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

In Rust, le primitive sono funzioni di `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`) e i componenti base provengono dal crate `nsh_base`. Gli stili sono metodi tipizzati (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), gli stili di stato accettano una closure (`.active(|s| s.opacity(0.6))`), i listener sono closure del loro evento (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`) e `.child(..)` aggiunge i figli. Un pezzo di UI è una semplice funzione che restituisce `impl IntoElement`; viene eseguita una sola volta, e i signal che legge nelle closure (`text(move || ..)`, `.bg(move || ..)`) aggiornano ciò a cui sono collegati. Vedi [Building with Rust](../docs/rust.md).

In TSX, ogni tag è in PascalCase e indica un binding presente nello scope: le primitive provengono da `nsh`, i componenti base da `nsh/base`. Solo `<If>` e `<Each>` sono globali e non richiedono import. Un tag in minuscolo come `<view>` è un errore di build, perché TypeScript lo verificherebbe rispetto a un solo tipo globale per nome, e i componenti generici come `List` e `Each` non potrebbero inferire i tipi dei loro elementi. Il compilatore riconosce gli elementi dai loro import e crea le view native sul posto, quindi importarli non costa nulla a runtime. Vedi [JSX e componenti](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

## Primitives

Importate da `nsh` in TSX, da `nsh_core::prelude` in Rust.

| Elemento | Rust | View nativa (iOS / Android) | Pagina |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; con `selectable`, i testi al suo interno si selezionano insieme | [View](./view.md), [Selezione del testo](./text-selection.md) |
| `<Text>` | `text(content)` | view CoreText / view StaticLayout | [Text](./text.md) |
| `<Image>` | `image(src)` | una view con un layer immagine / una image view | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView con celle riciclate | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | una view che riproduce un disegno 2D | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | una view il cui riquadro viene disegnato sulla GPU da un programma WGSL, sotto i suoi figli | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer su una TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | una view sopra la finestra (o il dialog in cui si trova), posizionata rispetto a un'ancora | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | flusso di controllo: gli elementi che scelgono | [Flusso di controllo](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | una barra sopra la tastiera su iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Padding e margin tengono il contenuto lontano dall'interfaccia di sistema con il `env()` di CSS: `env(safe-area-inset-top)` e gli altri bordi ([Safe area](./safe-area.md)) e `env(keyboard-inset-height)` ([Tastiera](./keyboard.md)).

## Base

Importati da `nsh/base` in TSX, dal crate `nsh_base` in Rust. Gestiscono comportamento, stato, focus e accessibilità e prendono il loro aspetto dall'app.

| Componente | Rust | Cosa fa | Pagina |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | L'alert e l'action sheet del sistema | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` e le sue parti | `nsh_base::accordion()`, `accordion_item()`, ... | Sezioni impilate che si espandono e si comprimono sotto le loro intestazioni, una alla volta o più insieme | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | L'immagine di una persona, o un ripiego mentre si carica o in caso di errore, e una riga di avatar che mostra i primi | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Un controllo premibile con i suoi stati e il suo ruolo | [Button](./button.md) |
| `<Carousel>` e le sue parti | `nsh_base::carousel()`, `carousel_content()`, ... | Slide mostrate una alla volta, scorse con lo swipe nativo, con precedente / successivo, una paginazione, i tasti e un ciclo continuo | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Un controllo selezionato, non selezionato o indeterminato con un indicatore | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Una regione il cui contenuto si espande e si comprime | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Una command palette: un campo di ricerca su comandi filtrati nativamente, una lista virtualizzata, i tasti di una palette Cmd+K | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Una tabella di righe e colonne in numero qualsiasi, selezionabile, ordinabile, con colonne ridimensionabili e spostabili | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Presenta i suoi figli sopra tutto il resto | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | Le differenze tra due testi o di una patch, affiancate o unificate | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Uno spazio di lavoro di split, gruppi di tab e dock sui bordi che l'utente dispone | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Un editor di codice con evidenziazione, più cursori, folding e ricerca | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Un'anteprima di ciò a cui punta il suo trigger, mentre il puntatore vi si ferma sopra | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | L'input di testo nativo (UITextField o UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Un bersaglio di pressione che apre una pagina, un sito o una route dell'app | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Menu: popup con sottomenu a cascata sui desktop, sheet sui telefoni | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Navigazione nativa: uno stack di pagine con l'header e i gesti di ritorno della piattaforma | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Un numero digitato in un campo o incrementato con pulsanti e tasti | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Un codice monouso di un numero fisso di cifre, digitato, incollato o compilato automaticamente in celle | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | Le pagine di un insieme: Precedente, le pagine intorno a quella corrente, i puntini di sospensione e Successivo | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Elementi che contengono elementi, espansi e compressi, con uno selezionato: virtualizzato, un'unica tappa del focus da tastiera | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | La cornice di un grafico e i suoi segni, disegnati nativamente a partire dalle righe dell'app | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | Contenuto ancorato a un trigger, sopra tutto il resto | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Una barra di avanzamento: a che punto è un'attività, o che è in corso | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Un'opzione di un insieme tra cui l'utente ne sceglie una, e l'insieme stesso | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Pannelli affiancati o impilati, con maniglie che li ridimensionano | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Una barra di scorrimento con l'aspetto proprio dell'app per una scroll view o una lista | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Un valore scelto da una lista di elementi, con tastiera, ricerca e sezioni | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Un pannello al bordo dello schermo sopra uno sfondo | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Un valore, o un intervallo di due, scelto lungo una traccia | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Un controllo attivo / disattivo con una traccia e un cursore | [Switch](./switch.md) |
| `<Table>` e le sue parti | `nsh_base::table()`, `table_row()`, ... | Una tabella di righe e celle proprie dell'app, con i ruoli di una tabella | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Una scheda di un elenco di schede, e l'elenco | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Mostra un documento Markdown o HTML con testi e view | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | La radice semantica di un toast; toast disposti come layer a partire da un bordo | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Un pulsante che è attivo o disattivo, e una toolbar di essi | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Una barra di pulsanti, toggle e link, un'unica tappa del focus da tastiera | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Un suggerimento accanto al suo trigger, al passaggio del puntatore o con un dito premuto | [Tooltip](./tooltip.md) |

> [!NOTE]
> Una stringa viene disegnata solo all'interno di un `Text`. Una stringa figlia di un `View` non crea alcuna view nativa e non partecipa al layout.

## Common props

Ogni primitiva accetta le prop seguenti (il tipo `CommonProps` in TSX; i trait `Styled`, `Interactive` e `Accessible` in Rust). Le pagine dei singoli elementi elencano solo le proprie prop. La colonna Rust indica il metodo del builder.

### Styling

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `style` | metodi tipizzati `Styled`; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` per `<Text>` e `<Input>`, `ImageStyle` per `<Image>`) | Stile inline, o un array di stili uniti da sinistra a destra (le voci falsy vengono saltate; gli array possono annidarsi, quindi `style={[base, props.style]}` accetta un `props.style` che a sua volta è un array). Ha la precedenza su `class`. Vedi il [riferimento degli stili](../modules/style-reference.md). |
| `class` | metodi tipizzati `Styled` (`.flex_row().gap_2().p_4()`) | `string` | Classi Tailwind, risolte nativamente (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Le classi successive prevalgono su quelle precedenti. Vedi [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Classi applicate finché il loro valore è truthy (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Ignora le pressioni (nemmeno il feedback di pressione), applica gli stili `disabled:`, disabilita controlli come gli input, e gli screen reader dicono che è disabilitato (`accessibilityState.disabled`). |

### Presses and feedback

La gestione delle pressioni avviene nativamente: la piattaforma riconosce la pressione e applica gli stili di pressione dell'app, e il codice dell'app ne viene informato solo in seguito. Risponde solo la view premibile più interna; all'interno delle scroll view un press-in attende circa 130 ms in modo che lo scorrimento possa iniziare per primo.

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Un tap è terminato all'interno della view. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | Il dito è rimasto premuto per `delayLongPress`. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Un dito si è appoggiato sulla view. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | Il dito si è sollevato o è uscito. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Millisecondi prima che una pressione diventi una pressione lunga. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Estende l'area di tocco oltre i limiti, in punti. |

`PressEvent` è `{ position, pagePosition, modifiers, clickCount }`: dove si trovava il puntatore nella view e nella sua view radice (`Point`), i tasti modificatori premuti all'inizio della pressione e i click consecutivi (2 per un doppio click). Dove la piattaforma non riporta alcun puntatore, è l'origine della view senza tasti e con un solo click.

La chiave di stile `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` in Rust, le classi `pointer-events-*`) decide quali tocchi ricevono la view e le view al suo interno: `"none"` nessuna delle due (una view interna che imposta `"auto"` li riceve di nuovo), `"box-none"` solo le view al suo interno, `"box-only"` solo la view stessa ([tocco e gesti](../docs/touch-and-gestures.md#pointerevents)).

Il feedback di pressione è dell'app: `activeStyle` (o le classi `active:`, `.active(..)` in Rust) si applica mentre la view è premuta, nativamente, senza passare dal codice dell'app (vedi sotto).

### State styles

Stili che si applicano mentre la view si trova in uno stato, sopra i suoi stili propri, nativamente. Ognuno è la forma a oggetto di una variante di Tailwind. Gli stati successivi prevalgono (selected, checked e indeterminate, poi hover, focus, active); `disabledStyle` prevale su tutti, e gli altri non si applicano mentre la view è disabilitata. Ognuno accetta lo stile proprio dell'elemento: un `TextStyle` su un `<Text>`, un `InputStyle` su un `<Input>`, un `ImageStyle` su un `<Image>`, un `ViewStyle` altrove.

| Prop | Rust | Variante di classe | Si applica |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Mentre è premuta. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Mentre un puntatore è sopra la view. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Mentre la view ha il focus. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Mentre la view o una view al suo interno ha il focus (il contenuto di un `Overlay` conta come interno alla view in cui si trova). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Mentre `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Mentre `accessibilityState.checked` è `true` (una checkbox, uno switch, un radio; `"mixed"` non è checked). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Mentre `accessibilityState.checked` è `"mixed"` (una checkbox né selezionata né deselezionata). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Mentre `accessibilityState.selected` è `true` (un `Button` selezionato, una tab). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Mentre `accessibilityState.expanded` è `true` (il trigger di un `Popover` o di un `Menu` mentre il suo popup è aperto). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Mentre `accessibilityState.pressed` è `true` (un toggle button attivo; `"mixed"` non è pressed). Non `activeStyle`, una pressione in corso. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

L'app rileva quando il mouse entra su una vista, vi si muove sopra e la lascia: su macOS, Windows, Linux, il backend GPUI e nei browser desktop, con il puntatore di un iPad o il mouse di un Mac su iOS, e con un mouse o uno stilo su Android. Gli stili hover (`hover:`, `.hover(..)`) stilizzano le viste in hover negli stessi casi.

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | Il mouse è entrato sulla vista o su una vista al suo interno (il `mouseenter` del DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | Il mouse si è mosso sulla vista (o su una vista al suo interno), con o senza un pulsante premuto, oppure un tasto modificatore è stato premuto o rilasciato mentre il mouse sta fermo sulla vista senza pulsanti premuti (il `mousemove` del DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | Il mouse ha lasciato la vista e le viste al suo interno, oppure la finestra; `e` è l'ultima posizione in cui si trovava (il `mouseleave` del DOM). |

Come CSS `:hover` e il `mouseenter` del DOM, una vista è considerata in hover finché il mouse si trova su di essa o su qualsiasi elemento al suo interno, quindi anche le viste attorno a quella sotto il mouse ricevono `onMouseEnter` (dall'esterno verso l'interno; `onMouseLeave` dall'interno verso l'esterno). Gli eventi arrivano a posteriori e mai con i tocchi. Una vista rimossa da sotto il mouse riceve `onMouseLeave`, su Linux e Windows al successivo movimento del mouse.

`MouseEvent` indica dove si trova il mouse, come fa il `MouseMoveEvent` di GPUI: `position` nella vista (un `Point` in punti, con le trasformazioni annullate), `pagePosition` nella vista radice in cui si trova, come lo forniscono i tocchi, i `modifiers` premuti (`control`, `alt`, `shift`, `platform`: Command sulle piattaforme Apple, il tasto Windows altrove) e `pressedButton`, il pulsante premuto (`"left"`, `"right"`, `"middle"`, `"back"` o `"forward"`, il `MouseButton` di GPUI) oppure `null`; in Rust `position`, `page_position`, `modifiers` e `pressed_button`. Su desktop e web un trascinamento è anche un tocco (`onTouchMove`, il responder), e i suoi movimenti raggiungono `onMouseMove` con `pressedButton` impostato: il feedback che segue solo l'hover li ignora; su iOS e Android l'hover riporta il puntatore senza pulsanti premuti. I movimenti arrivano al massimo una volta per frame, l'ultimo, e sempre prima del `onMouseLeave` che li segue, quindi un handler può ridisegnare a ogni movimento:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` dà a qualsiasi elemento un suggerimento, mostrato sopra di esso su desktop (macOS, Windows, Linux, il backend GPUI e i browser desktop) dopo che il puntatore si è fermato su di esso per mezzo secondo, fino a quando il puntatore se ne va o lo preme. Telefoni e tablet non ne mostrano. Il suggerimento non cattura mai il puntatore né le pressioni, quindi l'elemento funziona esattamente come senza di esso.

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | Il suggerimento, un elemento che l'app stilizza: un [`Tooltip`](tooltip.md) di `nsh/base` è il tooltip stesso, con il suo posizionamento, ritardo ed eventi; qualsiasi altro elemento viene mostrato così com'è. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

`Tooltip` definisce da sé il proprio aspetto, posizionamento, ritardo ed eventi, come fa il `.tooltip(..)` di GPUI. Un'app con molti tooltip mantiene un piccolo componente proprio che avvolge un testo nel suo `Tooltip`.

<a id="context-menus"></a>

### Menu contestuali

`onContextMenu` segnala a una vista che il pulsante secondario è stato premuto su di essa: un clic destro, Control-clic su macOS, un clic a due dita su un touchpad, il clic secondario del puntatore di un iPad; nei browser anche il tasto menu della tastiera. Qui si apre il menu proprio dell'app; in TSX, [`Menu.popup`](../modules/nsh-desktop.md) mostra quello del sistema:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Il pulsante secondario è stato premuto sulla vista o su una vista al suo interno. |

`ContextMenuEvent` ha `position` nella vista, `pagePosition` nella sua vista radice (dove `Menu.popup` posiziona un menu: `Menu.popup(items, e.pagePosition)`) e i `modifiers`; in Rust `position`, `page_position` e `modifiers`. Lo riceve la vista più vicina che è in ascolto, a partire da quella sotto il puntatore verso l'esterno. Un campo di testo, o un testo selezionabile con un menu di modifica (Windows, il backend GPUI, i browser), più vicino di quella vista mostra invece il proprio menu. La piattaforma lo decide nel momento in cui il pulsante viene premuto, in base a ciò che è montato, quindi l'handler viene informato a posteriori e non c'è nulla da annullare. Una vista `disabled` lascia il clic al più vicino listener abilitato attorno a essa. Sui touchscreen, una pressione prolungata apre i menu: gestisci `onLongPress` con la stessa funzione.

<a id="keyboard-focus"></a>

### Focus da tastiera

Su macOS e sul web, Tab sposta il focus da tastiera tra i suoi punti di sosta nell'ordine dell'albero: i campi di input, le viste che accettano le pressioni e ogni vista `focusable`. Gli stili di focus (`focus:`, `.focus(..)`) stilizzano la vista con il focus, e Invio o Spazio la premono quando accetta le pressioni. Un clic preme una vista senza darle il focus, quindi gli stili di focus compaiono solo per il focus da tastiera.

Focus e pressioni sono separati. Una vista che accetta i tasti mentre ha il focus (un grafico, uno slider, una lista che sposta la selezione con i tasti freccia) imposta `focusable` e associa i propri tasti mentre ha il focus (`onFocus` / `onBlur` con [`keymap`](../modules/nsh.md#keymap)); una pressione su di essa raggiunge comunque un elemento pressabile che la circonda, come una card che apre una pagina.

Il `focus()` di un ref sposta il focus da tastiera su un punto di sosta come fa Tab (i suoi stili di focus compaiono e `onFocus` viene emesso), ad esempio per restituirlo al trigger di un popup che si è chiuso, e `blur()` lo toglie.

Una vista attorno al focus si stilizza con `focus-within:` (`focusWithinStyle`, `.focus_within(..)`) mentre il focus è su di essa o su una qualsiasi vista al suo interno: la cornice di un campo attorno all'input che modifica, una toolbar mentre uno dei suoi pulsanti ha il focus. Il contenuto di un `Overlay` si trova dentro la vista in cui si trova l'overlay, ovunque venga mostrato, quindi un popup conta come parte della vista che contiene il suo trigger. In Rust, un componente rileva il focus che entra in un elemento e che ne esce con i `on_focus_in(..)` e `on_focus_out(..)` del suo ref: spostarsi tra le viste al suo interno non è né l'uno né l'altro.

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` per le viste che accettano le pressioni | Indica se la vista è un punto di sosta di Tab. `true` rende tale qualsiasi vista, che accetti le pressioni o le lasci alle viste che la circondano; `false` lascia un elemento pressabile al solo puntatore (un backdrop che chiude un popover, righe tra cui si spostano i tasti freccia). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (o `focus()`) ha dato alla vista il focus da tastiera. |
| `onBlur` | `.on_blur(..)` | `() => void` | | Il focus da tastiera ha lasciato la vista. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Layout e identità

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` è il frame della vista relativo al suo genitore, `{ origin, size }`, dopo ogni layout che lo modifica. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | Il ref dell'elemento (vedi [metodi dei ref](#ref-methods)): `ViewRef`, o il tipo proprio dell'elemento sopra di esso. `ref={el}` assegna una variabile, `ref={fn}` chiama una funzione. |
| `nativeID` | `.native_id(id)` | `string` | Dà un nome alla vista per gli altri, ad esempio il `InputAccessoryView` a cui fa riferimento un input. |
| `testID` | `.test_id(id)` | `string` | Un identificatore per i test UI (su Android, il resource id della vista). |
| `key` | `.key(key)` | `string` | L'identità dell'elemento tra i suoi fratelli. |

<a id="gestures-driving-animated-values"></a>

### Gesti che guidano valori animati

Queste prop collegano un gesto a [valori animati nativi](../modules/nsh.md#animation) che si muovono sul thread UI, senza alcun lavoro per frame nel codice dell'app. Vedi [tocco e gesti](../docs/touch-and-gestures.md).

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | I trascinamenti guidano questi valori (punti). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Un trascinamento è iniziato. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Un trascinamento è terminato, con la velocità di rilascio (ad esempio per avviare un `decay`). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | I pizzichi a due dita guidano `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Un pizzico è iniziato / terminato. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Le rotazioni a due dita guidano `angle` (gradi). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Una rotazione è iniziata / terminata. |

`PanEvent` è `{ cancelled, translation, velocity, value? }` (in Rust `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`): indica se il sistema ha annullato il trascinamento, la traslazione dall'inizio e la velocità in punti al secondo (`Point`), e i valori collegati in quel momento, `{ x?, y? }` per gli assi che `pan` collega (un trascinamento può afferrare un valore a metà animazione).

<a id="raw-touches-and-the-responder-system"></a>

### Tocchi grezzi e sistema responder

Per i gesti che le prop sopra non coprono, ogni elemento accetta le prop di tocco e responder: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (e le relative forme `…Capture`), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (e `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` e `onResponderTerminationRequest`. Ogni handler riceve un `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Restituire `true` da `onResponderGrant` impedisce alle scroll view native di prendere i tocchi. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) rende la vista il responder solo quando la piattaforma attiva il suo pan, così i trascinamenti dentro le scroll view lasciano ad esse l'altro asse ([Tocco e gesti](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` in [`PanResponder`](../modules/nsh.md#panresponder) si basa su di essi. In Rust, `.on_touch(..)` riceve ogni tocco (`TouchEvent`), `.claim_touches(..)` decide quando la vista li prende, e `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` e gli altri seguono il responder.

<a id="accessibility"></a>

### Accessibilità

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | La vista è un unico elemento per le tecnologie assistive; i suoi figli non sono esposti separatamente. |
| `accessibilityLabel` | `.label(..)` | `string` | Ciò che gli screen reader leggono. Le viste senza etichetta leggono i propri testi. |
| `accessibilityHint` | `.hint(..)` | `string` | Ciò che fa l'attivazione dell'elemento. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | Che cos'è l'elemento (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | Lo stato che le tecnologie assistive riportano (`checked` e `pressed` possono essere `"mixed"`; `current` è `true` o `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | Il livello di un'intestazione (1 il più alto), la profondità di un elemento di un albero (1 in cima). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | Il valore di un elemento di intervallo o testuale. |
| `accessibilityElementsHidden` | | `boolean` | Nasconde la vista e il suo sottoalbero alle tecnologie assistive. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Indica se la vista è esposta. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Azioni personalizzate offerte alle tecnologie assistive. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | L'utente ha invocato una delle `accessibilityActions`. |

Vedi [accessibilità](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Prop specifiche di piattaforma

Le prop che esistono su una sola piattaforma vanno in un oggetto che porta il suo nome in TSX, così le prop condivise restano uguali ovunque. Viene inviato solo l'oggetto della piattaforma corrente; gli altri sono ignorati. I builder Rust le accettano come metodi che si applicano sulla rispettiva piattaforma.

| Prop | Descrizione |
|---|---|
| `ios={{…}}` | iOS e Mac Catalyst. `<Input>`, `Dialog` e `WebView` aggiungono le proprie chiavi. |
| `android={{…}}` | Android. Ogni elemento accetta `ripple`, `elevation` e `accessibilityLiveRegion` (sotto). |
| `desktop={{…}}` | Piattaforme desktop e browser desktop; ignorata su mobile. Ogni elemento accetta `windowDrag` (sotto). |
| `web={{…}}` | Browser; ignorata altrove. |

| Chiave `android` | Rust | Tipo | Descrizione |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | L'effetto ripple material mentre è premuta. |
| `elevation` | `.elevation(px(2.0))` | `number` | L'ombra material (punti), a partire dalla forma della vista. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | Come le modifiche della vista vengono annunciate a TalkBack. |

| Chiave `desktop` | Rust | Tipo | Descrizione |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Premere la vista trascina la finestra, come farebbe la sua barra del titolo; `false` mantiene cliccabile una parte di una vista trascinabile. Vedi [una barra del titolo personalizzata](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

Vedi [codice specifico per piattaforma](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Metodi dei ref

In TSX, `ref` riceve il ref dell'elemento, il cui tipo è quello proprio dell'elemento: `ViewRef` (`focus`, `blur`, `measure`) per
`View`, `Text`, `Image`, `Canvas`, `Overlay` e `Shader`, e un tipo basato su `ViewRef` con i metodi dell'elemento per gli
altri: `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) e `NativeComponentRef` (componenti nativi). In Rust, `element_ref()` crea un handle `ElementRef` che
`.element_ref(&handle)` collega. I loro metodi inviano comandi alla vista nativa, nello stesso ordine delle modifiche effettuate
prima di essi nello stesso turno. Ogni pagina degli elementi indica quali metodi si applicano. Tipizza una variabile ref con il tipo proprio dell'elemento
(`let field!: InputRef` per un `<Input>`): una variabile tipizzata `ViewRef` non è adatta a un elemento il cui ref ha metodi
propri.

| Metodo | Rust | Ref | Descrizione |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Dà il focus a un `<Input>` (mostra la tastiera), oppure dà il focus della tastiera a una vista che gestisce le pressioni / lo toglie. |
| `measure()` | `measure()` | `ViewRef` | [Dove si trova la vista](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Seleziona `start..end` in unità UTF-16; un cursore se manca `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Scorre fino a un offset. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (uno `<Scroll>` con zoom) | Esegue lo zoom a `scale` attorno a un punto del contenuto. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Scorre fino a un offset lungo l'asse della lista. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Scorre fino a rendere visibile un elemento. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Scorre fino alla fine del contenuto. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Controlla la pagina. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Salta a un istante. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Chiama un comando di un componente nativo registrato ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Perché gli handler non bloccano mai la UI

Il thread principale non aspetta mai il codice dell'app. Quando il sistema ha bisogno di una risposta immediata (se questo testo può cambiare, se il
pulsante indietro può rimuovere la schermata, se questo sheet può chiudersi), NSH risponde in modo nativo in base alle prop impostate in precedenza (`maxLength`,
`popOnBack`, `closeOnSwipe`, …), e l'evento raggiunge l'app solo dopo. Per questo motivo tale comportamento
è una prop e non il valore di ritorno di un handler.
