---
title: "Dock"
description: "DockArea: uno spazio di lavoro ancorabile composto da divisioni, gruppi di schede e dock sui bordi sinistro, destro e inferiore, il cui layout è un dato di proprietà dell'app. L'area gestisce il trascinamento e il rilascio delle schede, il ridimensionamento, i dock, lo zoom e il blocco, mantiene il contenuto di ogni pannello mentre questo viene spostato e si adatta ai telefoni; l'aspetto e il contenuto dei pannelli sono responsabilità dell'app."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

Un'area dock è uno spazio di lavoro che l'utente organizza: pannelli in gruppi di schede, gruppi affiancati o impilati, e dock sui bordi sinistro, destro e inferiore che si aprono, si chiudono e si ridimensionano. Una scheda trascinata su un altro gruppo vi si unisce, trascinata sul bordo di un gruppo lo divide, e ogni pannello conserva ciò che contiene mentre si sposta. `DockArea` gestisce il comportamento: il trascinamento e il rilascio delle schede, che avvengono in modo nativo fotogramma per fotogramma, il ridimensionamento di divisioni e dock, l'apertura e la chiusura dei dock, lo zoom e il blocco. L'aspetto è dell'app: le schede, le barre delle schede, le maniglie, l'indicatore di rilascio e il contenuto di ogni pannello sono ciò che l'app renderizza e stila, e l'area non disegna nulla di suo.

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

`DockArea` e i valori che accetta provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust
(`nsh_base::dock_area()`, i valori in `nsh_base::dock`). In Rust, `dock_area()` lo crea, con un setter per
ogni prop, un listener per ogni evento e i metodi di stile tipizzati; `DockLayout` descrive un layout tramite le chiavi dei pannelli
(`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## Il layout

Il layout è un valore, `DockAreaLayout`: il centro e un dock su ciascuno dei bordi sinistro, destro e inferiore, ognuno
opzionale. Ogni regione è un albero con due tipi di nodo:

| Nodo | Contiene | Campi |
|---|---|---|
| `{ type: "split" }` | Altri nodi, affiancati (`axis: "horizontal"`) o impilati (`"vertical"`) | `children` e `sizes`: la lunghezza di ciascun figlio lungo l'asse in punti, `null` per dividere lo spazio restante |
| `{ type: "tabs" }` | Pannelli, per chiave, uno visibile alla volta | `panels` (le chiavi, nell'ordine delle schede), `activeIndex` (quello visibile, predefinito 0) |

Un pannello vive sempre in un gruppo di schede: una regione con un solo pannello è un gruppo di schede con una sola scheda. La chiave di un pannello è la stringa che l'app usa per identificarlo (`"files"`, l'id di un documento), e una chiave compare una sola volta in tutto il layout. Un dock (`DockRegion`) è il suo albero
(`layout`), la sua dimensione trasversale rispetto al bordo (`size`, predefinito 200, minimo 100), il fatto che sia aperto (`open`, predefinito `true`)
e il fatto che trascinarne il bordo sotto la dimensione minima lo chiuda (`collapsible`, predefinito `true`).

Ogni nodo ha un `id`. Un layout scritto dall'app può omettere gli id: l'area li assegna, e ogni layout che segnala li include. Passare di nuovo un layout segnalato mantiene l'identità di ogni gruppo, con cui i metodi del ref identificano i gruppi. L'area inoltre riordina ciò che riceve: un gruppo o una divisione vuoti vengono eliminati, una divisione con un solo figlio diventa quel figlio, una divisione dentro una divisione con lo stesso asse si unisce al genitore, `activeIndex` rimane nell'intervallo valido, una chiave elencata due volte mantiene la prima posizione. I layout che segnala hanno sempre quell'unica forma canonica.

Il layout appartiene all'app (`layout`): ogni modifica fatta dall'utente (una scheda selezionata, trascinata o chiusa, una divisione o un dock ridimensionati, un dock aperto o chiuso) viene segnalata come l'intero nuovo layout (`onLayoutChange`), e l'area mostra il layout che l'app le restituisce. L'app modifica il layout passando un nuovo valore: un layout salvato ripristinato, un comando che riorganizza lo spazio di lavoro. Un'area senza `layout` mantiene il proprio layout, a partire da `defaultLayout`, e segnala comunque ogni modifica.

<a id="panels-content"></a>

## Il contenuto dei pannelli

Ciò che un pannello mostra è dell'app: `renderPanel` lo renderizza a partire dalla chiave del pannello (`panel.id`). Ogni pannello di un gruppo viene posizionato e solo quello visualizzato viene mostrato, quindi cambiare scheda conserva il contenuto di ciascun pannello; e quando un pannello si sposta (in un altro gruppo, in un dock, in uno zoom e ritorno), lo stesso contenuto si sposta con lui: i signal che ha creato, il testo di un input, una posizione di scorrimento, la pagina di una web view restano tutti. L'area renderizza un pannello una sola volta, quando compare per la prima volta, e ne rilascia il contenuto quando il pannello esce dal layout (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` imposta ciò che ogni pannello consente, per chiave; un pannello non elencato consente tutto:

| Campo | Predefinito | Descrizione |
|---|---|---|
| `id` | | La chiave del pannello. |
| `closable` | `true` | Può essere chiuso. |
| `zoomable` | `true` | Il suo gruppo può andare in zoom mentre è visualizzato. |
| `visible` | `true` | Viene mostrato. Un pannello nascosto mantiene il proprio posto e vi ritorna; un gruppo o una divisione i cui pannelli sono tutti nascosti non occupa spazio. |

<a id="tabs"></a>

## Schede

Ogni gruppo ha una barra delle schede con una scheda per ogni pannello visibile, nell'ordine di `panels`. `renderTab` renderizza ciò che una scheda mostra (il titolo, un'icona, un pulsante di chiusura dell'app); senza di esso una scheda mostra la chiave del pannello. L'area la rende una scheda a tutti gli effetti: una pressione la seleziona, un trascinamento sposta il suo pannello, gli screen reader la annunciano come scheda con il suo stato di selezione, e le classi `selected:` di `tabClass` stilano quella visualizzata. Il valore di una scheda indica ciò che serve all'app per disegnarla:

| Campo | Tipo | Descrizione |
|---|---|---|
| `panel` | `string` | La chiave del pannello. |
| `group` | `number` | L'id del gruppo di schede in cui si trova. |
| `index` | `number` | La sua posizione tra le schede visibili del gruppo. |
| `active` | `boolean` | È la scheda visualizzata del gruppo. |
| `closable` | `boolean` | L'area la chiuderebbe: è chiudibile, l'area non è bloccata e il suo gruppo può cederla. |
| `zoomed` | `boolean` | Il suo gruppo è in zoom. |

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

<a id="drag-and-drop"></a>

## Trascinamento e rilascio

Una scheda trascinata su un gruppo mostra dove atterrerebbe, e il rilascio la colloca lì:

| Rilasciata su | Il pannello |
|---|---|
| Una barra delle schede | Si unisce a quel gruppo, tra le schede accanto a cui viene rilasciato |
| Il centro del contenuto di un gruppo | Si unisce a quel gruppo |
| Un bordo del contenuto di un gruppo (il 35% esterno su ogni lato) | Divide quel gruppo: un nuovo gruppo tutto suo su quel lato |

Durante il passaggio del trascinamento, l'area mostra l'indicatore di rilascio sulla parte del gruppo che il pannello occuperebbe (tutto il contenuto per unirsi, metà per dividere): una parte che l'app stila (`dropIndicatorClass`), con un contenuto proprio se l'app ne renderizza uno (`renderDropIndicator`, a cui vengono passati `group`, il `side` che separa o la barra delle schede `index`). Si sposta verso ogni nuova posizione in modo nativo, con un'animazione di transizione e una dissolvenza in entrata su un altro gruppo mentre quello precedente svanisce (immediatamente quando l'utente chiede meno movimento). Anche ciò che segue il puntatore o il dito è dell'app (`renderDragPreview`). Un rilascio è una singola modifica del layout, segnalata una sola volta; un rilascio che non cambierebbe nulla non cambia nulla.

Un'area bloccata, un'area in zoom e l'ultimo pannello di un gruppo quando accanto al gruppo non c'è nulla non permettono alcun trascinamento.

<a id="docks"></a>

## Dock

Un dock si apre e si chiude senza perdere i suoi pannelli né la sua dimensione: chiuderlo ne conserva l'albero, e aprirlo mostra gli stessi gruppi con la stessa dimensione. Il bordo tra un dock e il centro è una maniglia che l'utente trascina per ridimensionare il dock; la sua dimensione resta di almeno 100 punti e il centro mantiene almeno 100 punti, e un dock comprimibile rilasciato sotto i 50 punti si chiude e conserva la propria dimensione per quando verrà riaperto. L'area si adatta sempre ai propri limiti: un dock viene mostrato con il suo `size` entro lo spazio che l'area gli lascia, e quando nemmeno questo basta, i dock si riducono insieme al resto e le dimensioni minime delle divisioni cedono. `renderDock` disegna il chrome proprio del dock prima del suo layout (una striscia del titolo, un pulsante di riduzione), ricevendo `placement`, `open`, `size` e `collapsible`; `dockClass` ne stila il riquadro.

Apri, chiudi e ridimensiona i dock dall'app tramite il ref (`toggleDock`, `setDockOpen`, `setDockSize`), che funzionano
in entrambe le presentazioni, oppure scrivendo `open` e `size` del dock nel layout che passi (`open` appartiene alla presentazione completa). `onDockOpenChange` segnala
ogni volta che un dock viene mostrato o nascosto, misurato rispetto al `open` del layout (un'area che è compatta fin dall'inizio segnala come nascosto
ogni dock aperto nel layout), così un interruttore che parte dal `open` del layout e segue `onDockOpenChange` mostra sempre
lo stato del dock:

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

Un gruppo in zoom riempie l'intera area finché non viene riportato a dimensione normale o esce dal layout (`area.toggleZoom(group)`, e `area.toggleZoom()` per annullare lo zoom), e `onZoomChange` segnala il pannello che visualizza, oppure `null`. Lo zoom appartiene al gruppo, quindi resta in zoom quando il pannello visualizzato si chiude e subentra il successivo. Un pannello con `zoomable: false` impedisce al proprio gruppo di andare in zoom mentre è visualizzato.

<a id="locking"></a>

## Blocco

`locked` mantiene la disposizione così com'è: nessun trascinamento di schede, nessun rilascio, nessuna chiusura. La selezione delle schede, il ridimensionamento e l'apertura e chiusura dei dock continuano a funzionare, quindi uno spazio di lavoro bloccato resta comunque uno spazio di lavoro utilizzabile.

<a id="methods"></a>

## Metodi

`ref={area}` fornisce i metodi dell'area (`DockAreaRef`), per i comandi, le scorciatoie e i menu dell'app. Ogni modifica viene segnalata con `onLayoutChange` come quelle dell'utente. Un metodo a cui viene passato un pannello, un gruppo, un indice di scheda o un dock che il layout non ha lascia il layout com'è e registra un avviso con il nome del metodo e il valore.

| Metodo | Descrizione |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: il layout mostrato. |
| `addPanel(panel, placement?, size?)` | Aggiunge un pannello a una regione (`"center"`, il valore predefinito, `"left"`, `"right"`, `"bottom"`), nel suo primo gruppo di schede, visualizzato; un dock mancante viene creato, largo `size` in trasversale. Un pannello che l'area già contiene viene spostato lì. |
| `removePanel(panel)` | Rimuove un pannello, qualunque cosa dicano le sue opzioni. |
| `closePanel(panel)` | Chiude un pannello come farebbe la sua scheda: a meno che l'area non sia bloccata, il pannello non sia chiudibile, o sia l'ultimo pannello di un gruppo senza nulla accanto. |
| `movePanel(panel, target)` | Sposta un pannello in `target`: `{ group, side?, index?, activate?, size? }`, nel gruppo di schede `group` (in `index`) o in un nuovo gruppo sul suo `side` (`size` punti lungo la nuova divisione). |
| `splitAt(group, panel, side)` | Colloca un pannello in un nuovo gruppo di schede su un lato (`"left"`, `"right"`, `"top"`, `"bottom"`) di un contenitore. |
| `selectPanel(panel)` | Visualizza un pannello nel suo gruppo. |
| `selectTab(group, index)` | Visualizza una scheda di un gruppo. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | Apre o chiude un dock. |
| `setDockSize(placement, size)` | Imposta la dimensione di un dock trasversalmente al suo bordo (almeno 100). |
| `toggleZoom(group?)` | Porta un gruppo in zoom, o lo riporta a dimensione normale se è già in zoom; senza `group`, annulla lo zoom del gruppo in zoom. |
| `zoomedGroup()` | `Promise<number \| null>`: l'id del gruppo in zoom. |
| `groupOf(panel)` | `Promise<number \| null>`: l'id del gruppo di schede che contiene un pannello. |

In Rust, `component_ref::<DockArea>()` e `.component_ref(&r)` sull'area forniscono un ref il cui `r.api::<DockAreaApi>()` ha
gli stessi metodi in snake case.

<a id="saving-and-restoring"></a>

## Salvataggio e ripristino

Un layout segnalato è semplice dato, quindi salvarlo significa `JSON.stringify(layout)` nello [storage](../modules/nsh.md#storage),
e ripristinarlo significa passare il valore analizzato come `layout`. `onLayoutChange` segnala ogni modifica, compresi un ridimensionamento e una selezione di scheda, quindi scrivi nello storage solo quando le modifiche si sono assestate (un breve timer riavviato a ogni segnalazione).

In Rust, `DockAreaLayout::to_state` e `from_state` leggono e scrivono `DockAreaState`, il formato di file di layout
che usa anche il dock di `gpui-base`.

<a id="phones-and-narrow-windows"></a>

## Telefoni e finestre strette

Il dock si adatta alla propria larghezza. Un'area larga 600 punti o più (in una finestra su desktop, sul web, su un tablet, su un iPad a schermo intero, su un foldable aperto) è l'intero spazio di lavoro: divisioni, gruppi e dock affiancati, come nelle app multi-pannello dei tablet. Con un dito su un telefono o un tablet, il trascinamento di una scheda inizia con una pressione prolungata, come nel drag and drop di iPadOS, così una barra delle schede continua a scorrere con uno swipe, e le maniglie hanno un'area di tocco più ampia con lo stesso aspetto.

Un'area più stretta di 600 punti (su un telefono, su un iPad in Slide Over, in una finestra di desktop o browser stretta, o in una colonna stretta di una più larga) presenta lo stesso layout per un solo schermo, come le split view dell'iPad comprimono le loro colonne e il supporting pane di Material Design diventa un bottom sheet:

- Il centro mostra un gruppo alla volta, a dimensione piena. La sua barra delle schede elenca ogni pannello visibile del centro, e selezionare un pannello di un altro gruppo rende quel gruppo quello mostrato.
- I dock sinistro e destro sono drawer sopra il centro a partire dal loro bordo, larghi quanto il dock, e il dock inferiore è un
  sheet alto quanto il dock. Ne viene mostrato uno alla volta, quando l'app lo presenta (`toggleDock`, `setDockOpen`, che
  chiudono l'altro); scorre dentro e fuori, e una pressione sul suo sfondo, Escape o indietro lo chiudono. L'ingresso nella presentazione compatta non ne mostra alcuno.
- Una scheda trascinata (un dito dopo una pressione prolungata, un puntatore subito) si sposta all'interno della barra delle schede per riordinarla.

Ogni pannello resta posizionato in entrambe le presentazioni, quindi il passaggio ne conserva il contenuto. Il drawer o lo sheet mostrato è proprio della presentazione compatta: il `open` del layout appartiene alla presentazione completa, e presentare o chiudere un drawer non segnala alcun `onLayoutChange`, quindi un'area che torna ad allargarsi mostra i dock esattamente com'erano.
`onDockOpenChange` segnala entrambi: un dock il cui `open` del layout cambia nella presentazione completa, un drawer o uno sheet mostrato o chiuso in quella compatta, e ogni dock il cui stato di visualizzazione cambia quando la presentazione cambia. In
`renderDock`, `open` indica se il dock è mostrato nella presentazione corrente. Anche il layout resta lo stesso valore, quindi un'area che attraversa i 600 punti (un foldable che si apre, un iPad che entra in Split View, una finestra o una colonna ridimensionata) mantiene ogni pannello dov'era, e l'app salva un solo layout. La larghezza dell'area decide una volta che è stata disposta (prima di allora vale la larghezza della finestra), e `compact` sceglie la presentazione al posto della larghezza. I
drawer, lo sheet e lo sfondo sono parti che l'app stila (`drawerClass`, `sheetClass`, `backdropClass`), come il resto dell'area.

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

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | nessuno | Il layout mostrato (controllato): restituisci ciò che riporta `onLayoutChange`. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | un centro vuoto | Il layout iniziale, quando `layout` non è impostato; da quel momento l'area mantiene il proprio. |
| `locked` | `.locked(..)` | `boolean` | `false` | Nessun trascinamento, rilascio o chiusura di tab. |
| `compact` | `.compact(..)` | `boolean` | in base alla larghezza | La presentazione per telefono (`true`) o quella completa (`false`); se non è impostata, compatta finché l'area è più stretta di 600 punti. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | Ciò che ogni pannello consente, per chiave: `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | nessuno | Il contenuto di un pannello, in base alla sua chiave (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | la chiave | Ciò che mostra una tab. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | nessuno | Ciò che c'è dentro l'indicatore di rilascio: `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | nessuno | Il chrome proprio di un dock, prima del suo layout: `placement`, `open` (mostrato nella presentazione corrente), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | nessuno | Ciò che mostra un centro vuoto. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | nessuno | Ciò che segue il puntatore o il dito mentre si trascina una tab. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il riquadro di ogni gruppo di tab. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni barra delle tab (`flex-row` per una riga). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Ogni tab; `selected:` per quella visualizzata. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il riquadro del contenuto di ogni gruppo, dove compaiono i suoi pannelli. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore di rilascio. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore di ogni maniglia, tra i gruppi di uno split e al bordo di ogni dock; `group-hover:` e `group-active:` seguono la maniglia. Misura 1 punto in larghezza rispetto alla maniglia e ne percorre l'intera lunghezza, a meno che non sia specificato diversamente, quindi `bg-border` è una linea sottilissima in entrambi i casi; `w-[3px]` / `h-[3px]` la ispessiscono. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il thumb di ogni maniglia: una presa centrata sulla linea, disegnata in verticale come su una linea verticale e ruotata di un quarto di giro su una orizzontale, così una sola classe serve entrambi gli assi. Resta la stessa vista mentre la maniglia è in hover, premuta e trascinata, quindi le classi `group-hover:` e `group-active:` ne gestiscono la transizione (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il riquadro di ogni dock. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Compatto: i drawer dei dock laterali. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Compatto: lo sheet del dock inferiore. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Compatto: lo sfondo dietro un drawer o uno sheet aperto, la cui pressione lo chiude. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader annunciano per ogni maniglia, tra i gruppi di uno split e al bordo di ogni dock. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | I [metodi](#methods) dell'area. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | L'area stessa: la sua dimensione nel genitore (`flex-1`), il suo sfondo. Resta entro i propri limiti e non ricava alcuna dimensione minima dal contenuto. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | Il layout è cambiato (un trascinamento, una selezione, un ridimensionamento, un dock aperto o chiuso, un metodo): `{ layout }`, l'intero nuovo layout, con tutti i suoi id. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: un pannello è diventato, o ha smesso di essere, la tab visualizzata del suo gruppo (un dock chiuso non ne visualizza nessuna). Una volta per ogni cambiamento; a un pannello che se ne va non viene comunicato `false`: `onPanelRemove` è la sua fine. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: un pannello ha lasciato l'area definitivamente: chiuso, rimosso o assente da un nuovo layout. Un pannello che si sposta non lo riceve mai. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | Un gruppo è stato ingrandito o ripristinato: `{ panel }`, il pannello che visualizza, oppure `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: un dock è stato mostrato o nascosto: il `open` del suo layout è cambiato nella presentazione completa, il suo drawer o sheet è stato mostrato o chiuso in quella compatta, oppure la presentazione è cambiata. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| L'area | | `class`, `style` | |
| Un gruppo di tab | una regione | `groupClass`, `groupStyle` | |
| Una barra delle tab | un gruppo | `tabBarClass`, `tabBarStyle` | |
| Una tab | una barra delle tab | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| Il contenuto di un gruppo | un gruppo | `contentClass`, `contentStyle`; `renderPanel` | |
| L'indicatore di una maniglia | tra i gruppi di uno split, al bordo di un dock | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| Il thumb di una maniglia | centrato sulla linea di una maniglia | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (premuto fino alla fine del trascinamento) |
| Un dock | un bordo | `dockClass`, `dockStyle`; `renderDock` | |
| L'indicatore di rilascio | sopra un gruppo durante un trascinamento | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| L'anteprima di trascinamento | sotto il puntatore o il dito | `renderDragPreview` | |
| Il centro vuoto | il centro | `renderEmpty` | |
| Un drawer, lo sheet, lo sfondo | sopra il centro, compatto | `drawerClass`, `sheetClass`, `backdropClass` (e i loro stili) | |

<a id="accessibility"></a>

## Accessibilità

- Ogni tab è una tab con il proprio stato di selezione per gli screen reader, come lo è [`Tab`](./tabs.md), e attivarla la seleziona. La sua etichetta è il testo disegnato da `renderTab`.
- Ogni maniglia, tra i gruppi di uno split e al bordo di ogni dock, è un elemento regolabile con etichetta
  `handleAccessibilityLabel`. Le maniglie tra i gruppi di uno split sono quelle di [Resizable](./resizable.md): uno screen reader
  le sposta di 10 punti alla volta, annunciati con `onLayoutChange`.
- Nella presentazione compatta, Escape e indietro chiudono il drawer o lo sheet mostrato.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Un puntatore (un mouse, un trackpad, una penna sospesa sullo schermo) trascina una tab dopo essersi spostato di 4 punti con il pulsante
  premuto, su ogni piattaforma: un iPad con trackpad e una finestra stretta del browser usata con il mouse si comportano
  come un desktop. Su macOS, Windows, Linux e GPUI ogni pressione conta come quella di un puntatore, compreso il dito
  su un laptop con touchscreen.
- Un dito su iOS, iPadOS e Android trascina una tab dopo una pressione prolungata, come fa il drag and drop di iPadOS, quindi uno swipe sulla
  barra delle tab la fa scorrere.
- Desktop e web: le maniglie mostrano il cursore di ridimensionamento del loro asse.
- Telefoni e aree strette: la presentazione compatta, con drawer e uno sheet inferiore.
- Ogni piattaforma disegna ciò che l'app stilizza: tab, barre delle tab, maniglie, indicatore di rilascio, dock, drawer e sheet.
