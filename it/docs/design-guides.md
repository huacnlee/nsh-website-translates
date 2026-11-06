---
title: "Guide di design"
description: "Linee guida di design di prodotto e di interazione per le app create con Native Shell: gerarchia, colore e token, spaziatura, densità, componenti, stati di interazione, overlay, movimento, viste ricche di dati, testi dell'interfaccia e adattamento alla piattaforma."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---

# Linee guida di design

Usa questa guida prima di scegliere i componenti o scrivere il codice di layout per un'app costruita con Native Shell. Raccoglie il giudizio di prodotto che GPUI Kit ha accumulato in anni di lavoro sul desktop, portato in NSH: un'interfaccia dovrebbe risultare nativa, sobria, precisa e comprensibile senza bisogno di indovinare.

Questa guida è normativa. **Deve** indica un vincolo di correttezza o di ecosistema, **dovrebbe** indica il comportamento predefinito che richiede una ragione concreta per essere ignorato, **può** indica una tecnica facoltativa. Le pagine [Elements](../elements/index.md) e [API](../modules/index.md) restano l'autorità per le singole prop e i singoli metodi.

Le regole si basano sul comportamento di `nsh/base` (`nsh_base` in Rust), sul tema e sui suoi token, e sulle interazioni che gli utenti di ciascuna piattaforma già conoscono. NSH esegue il rendering con la UI nativa di ciascuna piattaforma e lascia l'aspetto all'app: i componenti di `nsh/base` portano comportamento, stato, focus e accessibilità, mentre ogni colore, dimensione, raggio e spaziatura proviene dai componenti propri dell'app, quindi queste regole guidano il design system dell'app. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> offre metodi utili (codice aperto, composizione e valori predefiniti affidabili) ma non determina l'aspetto di un'app NSH. Quando le influenze entrano in conflitto, preserva il comportamento della piattaforma e l'interazione che le persone già comprendono.

<a id="design-thesis"></a>

## Tesi di design

Costruisci interfacce che risultino native, quiete e precise. Lascia che siano i contenuti, la gerarchia e l'interazione a portare l'esperienza; la decorazione deve supportarli, non competere con loro.

1. **Chiarezza prima della personalità.** Rendi chiari il compito principale e l'azione successiva prima di aggiungere espressione di marca.
2. **Composizione prima dell'invenzione.** Parti da componenti consolidati e componili in flussi di lavoro specifici del prodotto. Crea un nuovo primitivo solo quando il suo comportamento è davvero nuovo.
3. **Token prima dei valori.** Colori, raggi, tipografia e spaziatura dovrebbero formare un sistema. Evita valori letterali isolati che non possono rispondere ai temi. Vedi [Styling](./styling.md), [Tailwind](./tailwind.md) e [il tema](./rust.md#theme).
4. **Piattaforma prima della convenzione web.** Preserva l'accesso da tastiera, il chrome delle finestre, i menu, le viste dati dense, le aree ridimensionabili e la navigazione persistente sui desktop, e le intestazioni di sistema, il gesto di ritorno, gli alert e le aree di tocco sui telefoni e sui tablet, dove il compito ne trae vantaggio.
5. **Lo stato deve essere visibile.** Hover, pressione, focus, selezione, disabilitazione, caricamento, validazione e stati distruttivi richiedono un trattamento distinto e coerente.
6. **La geometria spiega il contenimento.** Raggi, margini interni e confini dovrebbero descrivere un'unica gerarchia coerente, anche dove le superfici si sovrappongono.
7. **Il feedback riflette la realtà.** Caricamento, tooltip e movimento dovrebbero chiarire uno stato o una transizione reali, non aggiungere cerimonia a un'azione immediata.

<a id="learning-from-shadcn"></a>

## Imparare da Shadcn

Il contributo più utile di Shadcn non è un particolare colore di bordo. È un modo di costruire un sistema:

- possedere il livello superiore dell'interfaccia invece di combattere contro un'astrazione sigillata;
- comporre parti piccole e prevedibili in componenti specifici del prodotto;
- fornire valori predefiniti che formino già un unico linguaggio visivo;
- mantenere codice e composizione leggibili sia per le persone sia per l'IA;
- separare i primitivi di comportamento dal livello stilizzato.

NSH applica queste idee attraverso la separazione tra i primitivi di `nsh`, i componenti base non stilizzati di `nsh/base` e il livello stilizzato, che appartiene all'app ([Three layers](./architecture.md#three-layers)). Le applicazioni costruiscono i propri componenti su `nsh/base`, in TSX o nel crate Rust dell'app; il comportamento riutilizzabile appartiene a `nsh/base`, mentre la politica visiva resta al di sopra.

Non copiare alla cieca queste assunzioni del web:

| Abitudine del web | Predefinito in NSH |
| --- | --- |
| Cursore a mano puntata su ogni pulsante | Cursore predefinito; mano puntata (`cursor-pointer`) per i link |
| La navigazione tra pagine come struttura principale | Finestre, pannelli, barre laterali, schede e menu persistenti sui desktop; un `NavStack` con il ritorno di sistema sui telefoni |
| Focus e scorrimento del browser come ripiego | Proprietà esplicita del focus e scorrimento gestito dalla regione (`Scroll`, `List`) |
| Colonna singola mobile-first | Una colonna sui telefoni, una shell ridimensionabile con una dimensione minima di finestra definita sui desktop |
| Azioni critiche rivelate dall'hover | Azioni raggiungibili da tastiera, tocco e puntatore che non dipendono dall'hover |
| Una riga di pulsanti con sole icone visibili all'hover | Un'azione primaria visibile più `Menu` o `ContextMenu` per i comandi secondari |
| Testo in stile link per i comandi dell'applicazione | Un `Button` nello stile predefinito, outline o ghost dell'app; stile link solo per URL, risorse web o indirizzi email |
| Alta densità di tocco ovunque | Aree di tocco adatte ai touch screen; densità media con un puntatore, compatta solo dove il lavoro sull'informazione ne trae vantaggio |
| Un'intestazione disegnata e una card di alert su ogni piattaforma | L'intestazione di sistema e `AlertDialog` su iOS e Android; lo slot `header` della pagina sui desktop e sul web |
| Override CSS sui discendenti | I componenti dell'app, le loro parti e i token del tema |

<a id="start-from-the-task"></a>

## Partire dal compito

Prima di disegnare una schermata, scrivi:

- il compito principale dell'utente;
- l'oggetto che viene visualizzato o modificato;
- le azioni che devono restare immediatamente disponibili;
- le informazioni necessarie per prendere una decisione;
- gli stati vuoto, caricamento, errore, offline, sola lettura e permesso negato;
- il percorso da tastiera, tocco e screen reader attraverso il flusso di lavoro;
- dove viene mostrata l'app: da sola, oppure all'interno di un'app host.

Organizza la schermata attorno a queste risposte. Non iniziare con una griglia di dashboard o un catalogo di componenti. Una buona interfaccia espone il modello mentale dell'utente: documenti, account, progetti, messaggi, impostazioni o un altro oggetto stabile, non l'architettura interna dei servizi.

Progetta il compito principale prima di distribuire i controlli. Il suo peso visivo, la sua posizione e la profondità delle informazioni dovrebbero corrispondere alla sua importanza per il prodotto. Un risultato centrale non deve essere ridotto a un piccolo conteggio, a un'icona in un angolo o a una debole azione a piè di pagina mentre il contenuto secondario occupa la pagina. Quando un insieme di risultati è il valore principale del prodotto, valuta una regione di riepilogo o una card che mostri il conteggio, risultati rappresentativi, uno stato significativo e un chiaro passo successivo.

Per ogni azione proposta, indica il suo oggetto visibile, lo stato corrente, l'ambito e il risultato. Se l'interfaccia non mostra o non lascia chiaramente intendere queste cose, l'azione è prematura. Non esporre una capacità solo perché il backend la possiede; prima progetta come l'oggetto entra nel modello mentale dell'utente.

<a id="visual-language"></a>

## Linguaggio visivo

<a id="hierarchy"></a>

### Gerarchia

Preferisci un numero ridotto di livelli chiari:

- il **titolo della finestra o della pagina** identifica l'oggetto o lo spazio di lavoro corrente;
- il **titolo di sezione** separa le regioni significative (`role="header"`, così gli screen reader possono saltare tra di esse);
- il **testo del corpo** porta il lavoro;
- il **testo attenuato** fornisce metadati secondari e aiuto;
- le **etichette** identificano controlli e valori.

Usa dimensione, peso, spaziatura e separatori prima di aggiungere colore o contenitori. Evita di annidare card dentro card: la maggior parte delle regioni ha bisogno solo di uno sfondo, di un confine sottilissimo e di una spaziatura intenzionale.

Valuta la gerarchia sull'intera funzionalità, non componente per componente. Nascondi colore d'accento e decorazione durante la revisione: il compito principale, la selezione corrente, il riepilogo dei risultati e l'azione successiva dovrebbero restare evidenti dalla sola struttura. Una schermata che contiene controlli singolarmente plausibili può comunque fallire quando questi non formano un unico ordine di lettura e un unico percorso decisionale.

Tratta l'enfasi come un budget limitato. Una superficie locale ha bisogno di un solo punto focale chiaro, non di un campo di evidenziazioni in competizione. Se tutto è colorato, con badge, in grassetto, incorniciato o promosso ad alert, nulla appare importante. Stabilisci la priorità prima con struttura e prossimità; spendi colori e componenti più forti solo dove una distinzione cambia ciò che l'utente nota o fa.

<a id="color-and-themes"></a>

### Colore e temi

Leggi i colori dal tema (`theme()` in Rust, classi di token in TSX) e usali secondo il ruolo semantico:

- `background` e `foreground` per la superficie e il testo principali;
- `card`, `popover`, `sidebar` e i relativi token di foreground per le superfici che nominano;
- `muted` e `muted-foreground` per le informazioni di supporto;
- `primary` per l'azione principale o l'enfasi di selezione, `secondary` e `accent` per un'enfasi più discreta e per le righe in hover o con focus;
- `destructive` solo per le azioni distruttive e gli errori, e i colori di stato che l'app aggiunge al proprio tema (`success`, `warning`) solo per i loro significati;
- da `chart-1` a `chart-5` per le serie di dati;
- `border`, `input` e `ring` per struttura e interazione.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

Non usare un colore di stato semantico come decorazione. Non codificare il significato con il solo colore. Verifica ogni superficie personalizzata nei temi chiaro e scuro e con valori di tema personalizzati, incluso il tema di un'app host che incorpora la tua; non dare mai per scontato che il foreground sia nero e lo sfondo bianco.

Usa un badge per uno stato breve, un conteggio o una classificazione che trae vantaggio da una scansione rapida, non per ogni etichetta, valore di metadati, filtro o titolo di sezione. Mantieni neutri la maggior parte dei badge; riserva i colori semantici agli stati che portano davvero un significato di successo, avviso, distruzione o informazione. Una riga di badge multicolore indica di solito una decisione mancata di gerarchia o di raggruppamento.

La UI dell'applicazione non dovrebbe contenere colori esadecimali grezzi, `rgb()`/`rgba()` o `hsl()`, né classi di palette come `bg-zinc-100`. Risolvi i colori dal tema in base al ruolo semantico. Se il ruolo richiesto non esiste, definiscilo nel file del tema dell'app ([Theme tokens](./tailwind.md#theme-tokens): `"up": "#16a34a"` nel suo `light` e `dark` genera `text-up`, `bg-up/30`, `token("up")` in TSX e `theme().color("up")` in Rust) invece di incorporare un valore di palette nel punto di chiamata. I colori grezzi appartengono solo alle definizioni del tema o a contenuti di dati/raster verificati il cui colore è esso stesso il dato.

<a id="radius-spacing-and-density"></a>

### Raggio, spaziatura e densità

Usa una scala finita di raggi, come per la tipografia e le dimensioni dei controlli. Scegli tra i `radius` del tema (per controlli e superfici allo stesso modo, `rounded-(--radius)`), i raggi che l'app aggiunge al proprio tema e i `rounded-sm` … `rounded-2xl` di Tailwind tra di essi) invece di inventare un raggio per ogni elemento. I contenitori grandi possono usare un livello più morbido dei controlli che contengono; i controlli compatti e gli overlay usano livelli più stretti. Per un normale rettangolo, il raggio dovrebbe restare visibilmente inferiore a metà del suo lato più corto. Usa `rounded-full` (`.rounded_full()`) solo per cerchi e pillole intenzionali; un tooltip non deve diventare una capsula per caso.

Le superfici annidate dovrebbero apparire come forme concentriche. Usa `inner radius ≈ max(0, outer radius − gap)` per scegliere il raggio adatto più vicino; la fascia visibile dovrebbe restare uniforme lungo la curva. Aggiungi un token con nome al tema (`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`) se una composizione ripetuta richiede un valore intermedio. Un controllo segmentato è una sola sagoma: i segmenti finali seguono gli angoli interni del contenitore, i segmenti centrali restano squadrati e ogni confine ha un solo divisore di spessore uniforme.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

Un raggio deve governare l'intera superficie visibile, non solo il suo bordo. Gli angoli esposti restano trasparenti rispetto alla superficie sottostante; anche gli sfondi dei figli, i riempimenti di selezione e il contenuto scorrevole devono seguire il confine. Dai alle superfici interne il loro raggio, oppure ritaglia il contenitore con `overflow-hidden` (`.overflow_hidden()`), poi ispeziona la composizione su uno sfondo contrastante in entrambi i temi. Preserva gli anelli di focus esterni quando scegli un ritaglio.

Usa una scala di spaziatura compatta e ripetila. Le coppie etichetta/controllo correlate dovrebbero essere più vicine dei gruppi separati; i gruppi separati dovrebbero essere più vicini delle sezioni separate. Preferisci le dimensioni dei componenti dell'app (piccola, media predefinita, grande) alle altezze una tantum. Usa le varianti compatte per le barre degli strumenti e le schermate dense di dati, non per comprimere in meno spazio un layout poco chiaro.

La scala semantica condivisa è volutamente piccola: la spaziatura procede approssimativamente attraverso 2, 4, 8, 12, 16, 24 e 32 punti, mentre la tipografia resta intorno a 12, 14, 16, 18 e 20 punti. Considerali relazioni, non il permesso di disseminare i loro valori attuali nel codice delle funzionalità. La scala di spaziatura di Tailwind li fornisce: un passo vale 4 punti (`p-4` è 16pt), sia nelle classi sia nei metodi Rust tipizzati; `"spacing"` nel `"tailwind"` di `nsh.json` cambia il passo delle classi, mentre i metodi tipizzati mantengono la scala predefinita di Tailwind. Un'applicazione che ha bisogno di una scala diversa la possiede nei propri componenti o nei propri token di tema (`p-(--gap-card)`) e la usa in modo coerente.
<a id="spatial-grammar"></a>

### Grammatica spaziale

La spaziatura esprime la relazione. Scegli uno spazio dalla scala semantica chiedendoti che significato abbiano l'uno per l'altro i due elementi:

| Relazione | Classe tipica | Scala attuale | Esempi |
| --- | --- | --- | --- |
| Correzione ottica | `gap-0.5` | 2 pt | baseline di un'icona, separatore compatto |
| Parti di un singolo controllo | `gap-1` | 4 pt | icona/etichetta di un menu, titolo/descrizione |
| Controlli strettamente correlati | `gap-2` | 8 pt | icona/etichetta di un pulsante, azioni di un dialog |
| Un gruppo di contenuto | `gap-3` | 12 pt | colonne di una notifica, righe compatte di un form |
| Gruppi distinti in una sezione | `gap-4` | 16 pt | padding di un pannello, gruppi di un form |
| Sezioni distinte | `gap-6` | 24 pt | blocchi principali di una pagina o di un inspector |
| Confine di una regione principale | `gap-8` | 32 pt | respiro di un empty state, fasce di una pagina |

Questi valori descrivono la scala predefinita, non valori letterali da ripetere. Usa le classi di spaziatura e i metodi tipizzati (`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) oppure i token del tema. Una scala specifica del prodotto deve preservare l'ordine e
le relazioni e deve passare attraverso i componenti dell'applicazione, invece di essere scritta in ogni punto di chiamata.

Usa queste regole per risolvere lo spazio orizzontale e verticale:

1. **Prima l'interno, poi l'esterno.** Il padding di un componente appartiene al componente; lo spazio tra componenti appartiene
   al loro genitore.
2. **Il ritmo verticale mostra il raggruppamento.** Lo spazio tra un titolo e la sua descrizione è minore dello spazio tra quella
   descrizione e la sezione successiva. Spazi uguali implicano relazioni uguali.
3. **Lo spazio orizzontale favorisce la scansione.** Le righe ripetute mantengono icone, etichette, valori, badge e azioni finali
   su colonne stabili.
4. **Leading e trailing sono semantici.** Ragiona in termini di bordi nell'ordine di lettura e scrivili come start ed end (`ps-*`,
   `me-*`, `.ps_4()`), così il layout si specchia da destra a sinistra.
5. **Non raddoppiare il padding.** Una card posta in un pannello che ha già un padding non deve aggiungere automaticamente un altro
   inset completo del pannello.
6. **Usa l'allineamento ottico con parsimonia.** Una correzione di uno o due punti è valida per la geometria di icone o glifi, ma
   documenta perché differisce dalla scala.

Alcune composizioni comuni illustrano le relazioni:

- il contenuto dei pulsanti usa 4 pt nelle dimensioni piccole e 8 pt in quelle normali;
- le intestazioni e i piè di pagina dei dialog usano uno spazio interno di 8 pt;
- le righe compatte di liste e menu usano 4 pt di padding verticale e 8–12 pt di padding orizzontale;
- le intestazioni degli sheet usano circa 16 pt di spazio leading e 12 pt di spazio trailing, lasciando posto a un elemento di chiusura, mentre i piè di pagina
  usano 16 pt orizzontali e 12 pt verticali;
- le notifiche usano 16 pt di padding orizzontale e 12 pt di spazio tra le colonne, perché icona, messaggio e azione sono gruppi
  distinti.

Non considerare queste composizioni come ricette da copiare e incollare per ogni superficie. Rivelano il sistema: i controlli sono più compatti
al loro interno, le righe ottimizzano la scansione e i contenitori dedicano più spazio al proprio confine che tra i propri contenuti.

<a id="proportion-and-layer-hierarchy"></a>

### Proporzioni e gerarchia dei livelli

Parti dai requisiti del contenuto, poi definisci le proporzioni. Evita metà arbitrarie quando un pannello ha un ruolo chiaramente diverso.

- Una sidebar di navigazione deve essere abbastanza larga per etichette stabili, ma visibilmente subordinata all'area di lavoro. Assegnale una
  larghezza minima, preferita e massima (`min-w-*`, `w-*`, `max-w-*`) invece di una sola percentuale.
- Nei layout master–detail, lascia che la collezione resti facile da scorrere e assegna l'eccedenza al pannello di dettaglio. Un punto di partenza di circa
  un terzo/due terzi è spesso utile, ma i vincoli del contenuto hanno l'ultima parola. Su un telefono i due
  diventano due pagine di un `NavStack`.
- Gli inspector e gli sheet ausiliari non devono coprire per impostazione predefinita l'oggetto principale. Devono essere ridimensionabili o
  chiudibili quando il loro contenuto cresce; un [`Sheet`](../elements/sheet.md) si chiude con il suo backdrop, con Escape e con il tasto indietro.
- La larghezza di un dialog deriva dalla decisione da prendere: un `AlertDialog` per una breve conferma, un form di dimensioni medie oppure una
  finestra/pagina dedicata per i lavori complessi. Non allargare un dialog solo per creare spazio vuoto.
- Riserva l'elevazione più forte al livello decisionale più alto. All'interno di un livello, usa lo sfondo e le hairline, non
  ombre via via più grandi, per mostrare la gerarchia.

Definisci tre vincoli di dimensione per ogni regione principale: il minimo a cui il suo compito funziona ancora, un valore predefinito confortevole e
il modo in cui assorbe l'eccedenza. Rendi persistenti le suddivisioni controllate dall'utente quando rappresentano una preferenza di flusso di lavoro, e
limita i valori ripristinati in base alla finestra corrente.

<a id="alignment-details"></a>

### Dettagli di allineamento

L'allineamento è un sistema strutturale, non una rifinitura finale. Stabilisci un piccolo insieme di assi di allineamento per ogni superficie:
bordi leading e trailing condivisi, baseline del testo, linee centrali e corsie funzionali fisse. Gli elementi dello stesso livello
devono agganciarsi allo stesso asse dall'alto in basso o da leading a trailing, anche quando sono tipi di componente diversi.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

Le linee rosse verticali affiancano i bordi condivisi o i centri dei controlli per contenuto, stato, ora e azioni finali.
Le linee orizzontali stanno sotto le baseline del testo o attraversano il centro di una riga per mostrare l'allineamento inferiore e quello al centro verticale.
Il confronto compatto isola una deriva di un pixel renderizzato che va corretta nel suo proprietario strutturale.

- Dai alle regioni sorelle un inset del contenuto condiviso. Un'intestazione, una toolbar, una riga di lista, un empty state e un piè di pagina che descrivono lo
  stesso livello non devono inventare ciascuno un bordo leading leggermente diverso.
- Ripeti la geometria delle colonne in tutta la regione. Intestazioni, righe, riepiloghi, stati di caricamento ed editor inline devono riservare le stesse
  corsie per identità, metadati, stato, numeri e azioni.
- Allinea i controlli correlati tra righe e sezioni. Etichette, campi, descrizioni e messaggi di validazione di un form devono
  rivelare una griglia verticale stabile quando la pagina viene scorsa dall'alto in basso.
- Mantieni coerenti le fasce orizzontali. Gli elementi che condividono una toolbar, un'intestazione, una status bar o una riga devono usare un'unica baseline o
  linea centrale invece di scostamenti regolati individualmente.
- Introduci l'indentazione solo per una reale gerarchia, contenimento o disclosure. L'indentazione decorativa fa sembrare subordinati gli elementi sorelle
  e spezza la linea di lettura della superficie.
- Quando un livello annidato termina, torna esattamente all'asse del genitore. Non lasciare che il padding accumulato derivi attraverso i contenitori
  annidati.
- Preserva l'asse anche in presenza di contenuto opzionale. Icone, badge, descrizioni o azioni finali mancanti non devono spostare le etichette
  rimanenti; usa slot o corsie intenzionali quando il confronto tra righe è importante.
- Allinea le regioni principali tra loro quando la loro gerarchia coincide. Intestazioni della sidebar, titoli del contenuto, split pane,
  toolbar e barre inferiori non devono condividere ogni coordinata, ma i livelli coincidenti devono formare linee continue visibili.

Non tutti i bordi devono allinearsi. Un figlio può essere indentato, un valore primario può precedere i metadati di supporto e una decisione
distruttiva può guadagnare separazione. Tali eccezioni devono comunicare gerarchia o significato; non devono derivare da
padding di componenti non coordinati. Parti dall'asse condiviso, poi rendi esplicita l'eccezione.

Tratta l'allineamento esatto e gli spazi ripetuti come invarianti di qualità. Quando due bordi o due spazi devono essere uguali, una differenza di
un pixel renderizzato è un difetto, non un'approssimazione ottica accettabile. Ispeziona i bounds risolti con uno strumento di misura a
dimensioni di finestra, dimensioni del testo e fattori di scala del display rappresentativi. Confronta coordinate e
distanze; non approvare l'allineamento solo da uno screenshot occasionale.

La tolleranza in pixel renderizzati è una regola di verifica, non un permesso di rattoppare il codice con scostamenti grezzi in punti. Le relazioni
uguali devono risolversi dalla stessa classe o metodo di spaziatura, token, definizione di griglia o inset condiviso di un componente.
Correggi il proprietario comune quando differiscono. Tieni conto del layout frazionario e dell'arrotondamento del dispositivo (telefoni 2× e 3×, scale
frazionarie su desktop) in modo che gli assi previsti cadano sullo stesso pixel fisico invece di derivare a determinate scale.

- Allinea il testo per baseline, non per centri dei bounding box, quando dimensioni miste condividono una riga.
- Centra le icone in uno slot fisso, così le etichette non si spostano quando le icone hanno larghezze intrinseche diverse.
- Allinea i numeri confrontabili alla fine e usa cifre tabulari (`tabular-nums`); allinea prosa e identificatori
  all'inizio, a meno che la locale non richieda diversamente.
- Mantieni le azioni finali di riga e gli indicatori di disclosure in corsie a larghezza fissa.
- Allinea i controlli di un form in base al loro frame interattivo, non al testo di aiuto sottostante.
- Usa `justify-between` (`.justify_between()`) solo quando i due lati possiedono davvero bordi opposti; non deve
  mascherare una struttura mancante nel mezzo.
- Le hairline appartengono al proprietario del confine. Due regioni adiacenti non devono disegnare entrambe lo stesso separatore.
- Una scrollbar appartiene alla regione che scorre e si posiziona contro il bordo trailing di quel pannello, editor o finestra.
  Il padding del contenuto può far rientrare testo e righe; non deve spingere la scrollbar nel mezzo della superficie. Applica il padding al
  contenuto della scroll view, non alla scroll view.

<a id="density-tiers"></a>

### Livelli di densità

Medium è il valore predefinito. Cambia la densità per l'intero contesto locale, non per un singolo controllo isolato:

- **confortevole / large:** onboarding, form radi, decisioni in primo piano;
- **standard / medium:** la maggior parte del chrome applicativo e dei flussi di lavoro, e ogni touch screen;
- **compatta / small:** toolbar desktop, menu, tabelle e dati professionali ripetuti;
- **extra compatta / xsmall:** utility eccezionali ad altissima densità, mai la scelta automatica per un'intera applicazione.

Usa una scala limitata invece di dimensioni arbitrarie. Sui touch screen ogni target premibile è di almeno 44 × 44 punti
([Target tattili](./accessibility.md#touch-targets)). Con un puntatore, i pulsanti passano comunemente per frame di circa 24, 28
e 32 pt, gli input arrivano a circa 40 pt nella dimensione large e le righe di tabella usano circa 28, 32 e 40 pt. Dai
ai componenti dell'app una dimensione che cambi insieme tipografia, icona, padding e hit target; un'altezza personalizzata che modifica
solo il riquadro esterno è di solito incompleta.

<a id="text-size-base-font-and-points"></a>

### Dimensione del testo, font di base e punti

Una scala ben progettata preserva la gerarchia mentre il testo cresce. Un testo più grande funziona quando la relazione tra
titolo e corpo, controllo e icona, spaziatura interna ed esterna, regioni primarie e secondarie resta la stessa a ogni
dimensione, non semplicemente quando ogni oggetto diventa più grande.

Le lunghezze di NSH sono in punti, e la dimensione del testo dell'utente (Dynamic Type su iOS, dimensione del font su Android, il ridimensionamento del testo dei
desktop, l'impostazione propria di un'app host) scala il testo: ogni testo e input che consente la scala del font cresce, mentre spaziatura,
raggi, bordi e immagini mantengono la propria dimensione ([Dimensione del testo](./device-and-environment.md#text-size)). La dimensione di base del testo
dell'app (`text-base` di Tailwind, 16 punti) è la dimensione del corpo attorno a cui si articola la scala tipografica.

Progetta in rapporti:

- i passi tipografici mantengono la stessa gerarchia attorno alla dimensione base del corpo;
- i passi di spaziatura mantengono le stesse relazioni di raggruppamento attorno al testo;
- i frame dei controlli e gli hit target crescono con le loro etichette: dimensionali in base al contenuto e a un minimo (`min-h-11`), non a
  un'altezza fissa;
- i minimi dei pannelli e le larghezze confortevoli tengono conto di un testo più grande;
- i raggi degli angoli e il trattamento del focus restano otticamente coerenti con il frame del controllo.

Poiché il testo cresce da solo, un frame fisso attorno ad esso si rompe: un'etichetta più grande dentro un pulsante ad altezza fissa, un documento
più grande dentro minimi di pannello fissi o righe più grandi dentro un'altezza di riga fissa distruggono il ritmo originale e possono tagliare
il contenuto. Lascia che le righe vadano a capo o passino a una colonna quando il testo diventa grande (`fontScale()`, `font_scale()`), e limita la scala
del testo già grande, come un titolo da 34pt (`maxFontSizeMultiplier`).

Di norma il layout dell'applicazione non deve scrivere valori letterali in punti (`p-[13px]`, `px(13.0)`). Usa la scala di spaziatura
(`p-2`, `gap-3`, `w-64`, `text-sm` e i relativi metodi tipizzati) oppure le dimensioni dei componenti dell'app. Usa punti letterali solo quando
il valore rappresenta un confine fisico o raster: una hairline, un inset di finestra della piattaforma, la dimensione di una bitmap, una tolleranza minima di
hit-test o una geometria che deve corrispondere a una superficie esterna. Queste sono eccezioni verificate e documentate. Spaziatura,
tipografia, dimensione delle icone e geometria ordinaria dei controlli di prodotto restano sulla scala.

Testa a più dimensioni del testo, non solo a quella predefinita. Verifica gerarchia, a capo automatico, troncamento, dimensione minima della finestra, ridimensionamento dei
pannelli, margine dell'anello di focus, posizionamento dei popup e misurazione delle righe di lista.
<a id="surfaces-and-elevation"></a>

### Superfici ed elevazione

Usa l'elevazione per spiegare la sovrapposizione, non l'importanza. La superficie di base è piatta; separatori e contrasto di sfondo definiscono le sue regioni. Popover, menu, sheet, dialog e notifiche possono usare ombre progressivamente più marcate perché si trovano sopra altri contenuti. Non mettere un'ombra su ogni card.

Tutte le superfici dello stesso tipo dovrebbero condividere un unico trattamento. Dai alle famiglie di popup una sola superficie tematizzata (i token `popover`, il bordo, `radius` e un'unica ombra) in modo che `Popover`, `Menu`, `ContextMenu` e `Tooltip` non si discostino tra loro.
Quando un'applicazione introduce un'altra superficie ancorata, riutilizza quel trattamento invece di approssimarlo con valori letterali di bordo e ombra non correlati.

<a id="typography-and-icons"></a>

### Tipografia e icone

Usa il font UI della piattaforma per il testo dell'interfaccia e il monospazio solo per codice, identificatori, scorciatoie e dati numerici allineati. Mantieni il testo del corpo leggibile ed evita maiuscole o spaziatura tra le lettere eccessive, soprattutto per il testo CJK.

Usa una sola famiglia di icone in un prodotto. Le icone integrano le etichette; non dovrebbero sostituire azioni poco familiari lasciando all'utente il compito di indovinare. I pulsanti con sola icona hanno sempre bisogno di un nome accessibile (`accessibilityLabel`). La loro spiegazione visiva segue la policy dei tooltip descritta più avanti. Usa icone piene o colorate per comunicare uno stato, non semplicemente per rendere vivace una toolbar.

<a id="layout-patterns"></a>

## Pattern di layout

<a id="choose-a-stable-shell"></a>

### Scegliere una shell stabile

La maggior parte delle applicazioni dovrebbe usare una di queste shell:

- **workspace singolo:** un header o una toolbar sopra una vista primaria;
- **stack di navigazione:** pagine inserite ed estratte (`NavStack`), con il gesto indietro del sistema sui telefoni;
- **workspace con sidebar:** navigazione persistente accanto a una vista di dettaglio che cambia;
- **master–detail:** pannelli ridimensionabili per la collezione e il dettaglio, due pagine su un telefono;
- **workspace di documenti:** schede per più oggetti di lunga durata;
- **finestra di utilità:** un'attività mirata con un percorso di azioni breve e fisso.

Mantieni stabile la navigazione globale mentre il contenuto cambia. Assegna all'area di lavoro principale lo spazio rimanente con `flex-1` (`.flex_1()`) e `min-w-0` / `min-h-0` dove i figli in overflow devono restringersi. Usa `Scroll` e `List` per il comportamento per cui sono pensati, invece di ricostruire scorrimento o virtualizzazione a partire da viste annidate.

Sui desktop, una barra del titolo propria dell'app ([`nsh/desktop`](../modules/nsh-desktop.md)) è prima di tutto cromatura della finestra. Preserva la sua regione di trascinamento (`.window_drag(true)`) ed evita di associare i normali clic sul titolo a comandi di modifica poco frequenti. La rinomina appartiene a un comando esplicito sull'oggetto, con un percorso da tastiera dove appropriato.

<a id="responsive-windows"></a>

### Finestre responsive

Una finestra può avere qualsiasi dimensione: la decide l'utente, una vista divisa o l'app host. Decidi cosa succede quando una finestra si restringe:

1. preserva l'attività primaria;
2. consenti alle regioni ridimensionabili di raggiungere un minimo documentato;
3. comprimi le etichette secondarie o gli inspector;
4. sposta le azioni poco frequenti in un menu;
5. fai scorrere solo la regione il cui contenuto va effettivamente in overflow.

Non nascondere un'azione senza fornire un altro percorso per raggiungerla. Evita di far scorrere l'intera finestra quando dovrebbe scorrere solo una lista o il corpo di un documento. I breakpoint (`md:`, `lg:`) e `windowSize()` (`window()` in Rust) seguono la superficie in cui NSH esegue il rendering.

Il layout flex di NSH ha la stessa pressione dimensionale intrinseca presente in altri sistemi di layout: un figlio `flex-1` può comunque rifiutarsi di restringersi attorno a contenuti lunghi. Design e implementazione devono concordare su quali pannelli possono restringersi, troncare, andare a capo o scorrere. Una regione ritagliata ritaglia anche un anello di focus esterno; non sacrificare mai la visibilità della tastiera solo per semplificare l'overflow.

<a id="forms-and-settings"></a>

### Form e impostazioni

Usa un'etichetta visibile per ogni campo e posiziona aiuto o validazione accanto al campo che descrivono. Allinea i campi correlati, ma non forzare etichette lunghe in una colonna fissa stretta. Usa il controllo appropriato: `Checkbox` per scelte indipendenti, un [`RadioGroup`](../elements/radio.md) di `Radio` per un piccolo insieme visibile, un `Menu` di scelte per un insieme più lungo e [`Switch`](../elements/switch.md) per un'impostazione che ha effetto immediato. Le loro parti (la traccia e il cursore dello switch, l'indicatore del checkbox) spettano all'app per lo stile, con classi `checked:`, `indeterminate:` e `disabled:` che seguono il controllo:

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

Un checkbox "seleziona tutto" mostra una selezione parziale con il suo stato indeterminato:

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

Disabilita l'invio mentre un'operazione è in corso, conserva l'input dell'utente e mostra il risultato vicino all'azione. Mantieni gli input sopra la tastiera software (`env(keyboard-inset-height)`). Riserva i dialog a decisioni brevi e mirate; usa una pagina intera o uno sheet per i flussi che richiedono esplorazione o molti campi.

Un trattamento di caricamento deve rappresentare un'attesa reale. Il passaggio tra pannelli di impostazioni il cui contenuto è già disponibile dovrebbe essere immediato; uno skeleton è appropriato solo mentre il contenuto è davvero in caricamento e la sua forma è nota.

<a id="components-and-composition"></a>

## Componenti e composizione

Segui il principio di Shadcn secondo cui i componenti sono materiale da costruzione e non un design system sigillato. `nsh/base` fornisce il comportamento; l'app fornisce valori predefiniti coerenti nei propri componenti e possiede composizione e semantica di prodotto.

- Usa le varianti dei componenti in base al significato. Primary è riservata al commit predefinito esplicito in un'area decisionale, normalmente l'azione invocata da Invio sui desktop. Un'azione isolata, frequente o desiderabile non è automaticamente primary. Un comando `Add` in una toolbar di gestione usa normalmente un pulsante default; il commit `Create` predefinito di un form può usare primary. Usa destructive per l'impegno distruttivo e ghost per le azioni discrete della toolbar.
- Preferisci parti e slot espliciti allo stile di discendenti arbitrari.
- Mantieni coerente un pattern ripetuto in tutto il prodotto. Racchiudilo in un componente applicativo quando porta con sé linguaggio o policy di dominio.
- Usa il componente standard per il suo ruolo semantico. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog` e `AlertDialog` non sono riquadri intercambiabili; ciascuno possiede contratti diversi di selezione, focus, tastiera, chiusura e layout, e assume una forma propria su ogni dispositivo.
- Preserva la geometria della famiglia di componenti. Le righe dei menu condividono padding verticale e orizzontale, altezza, slot per icona e segno di spunta, separatori, raggio e trattamento degli stati. Non imitare un menu con un popup personalizzato la cui spaziatura si limita ad approssimare quella del sistema.
- Non incapsulare un componente solo per rinominare ogni prop o congelare tutte le sue capacità.
- Sposta il comportamento riutilizzabile privo di stile di prodotto in `nsh/base`, o in un crate condiviso dai prodotti dell'app; mantieni la presentazione tematizzata e con opinioni precise nei componenti dell'applicazione.

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## Stati di interazione

<a id="make-the-result-understandable-before-the-click"></a>

### Rendere comprensibile il risultato prima del clic

Un controllo dovrebbe prevedere il proprio risultato. Usa controlli e posizionamenti familiari della piattaforma in modo che le persone possano agire senza dover prima imparare l'interfaccia. La sua etichetta nomina l'azione e l'oggetto, il suo stato mostra la disponibilità e il suo feedback conferma lo stesso esito.

Non etichettare un Button `Save` se apre un flusso di configurazione, né `Delete` se rimuove soltanto un elemento da un gruppo. Indica l'ambito quando il contesto non lo chiarisce. Rispondi immediatamente all'attivazione, impedisci l'invio duplicato durante le operazioni più lunghe e mostra il risultato vicino all'oggetto che è cambiato. Aggiungi un messaggio di successo solo quando il risultato stesso non è visibile.

Ogni controllo interattivo dovrebbe essere progettato per:

| Stato | NSH | Requisito di design |
| --- | --- | --- |
| Riposo | | Affordance chiara senza rumore visivo |
| Hover | `hover:` | Feedback sottile del puntatore, mai l'unico indizio |
| Premuto | `active:` | Feedback immediato alla pressione, con stile definito dall'app |
| Aperto / premuto | `open` del popup | Feedback persistente mentre un popup associato è aperto |
| Focus visibile | `focus-visible:` | Anello di focus da tastiera ad alto contrasto |
| Selezionato / spuntato | `selected:`, `checked:` | Stato persistente distinto dall'hover |
| Disabilitato | `disabled:` | Enfasi ridotta e nessuna risposta fuorviante di hover/pressione |
| Caricamento | | Preserva il contesto, impedisci azioni duplicate, spiega le attese lunghe |
| Errore | | Indica cosa è successo e come recuperare |

Associa i comandi che devono funzionare da tastiera con [`keymap`](../modules/nsh.md#keymap) sui desktop e sul web. Rispetta le scorciatoie di piattaforma più familiari (`"mod+k"` è Command su macOS, Control altrove), mostra le scorciatoie nei menu o nei tooltip e mantieni il focus in una posizione logica dopo l'apertura o la chiusura di un overlay.

La selezione è parte del modello informativo, non una rifinitura opzionale. Schede, scelte segmentate, righe selezionabili, filtri e destinazioni di navigazione devono mostrare uno stato selezionato persistente (`selected`, che gli screen reader annunciano). Un pulsante che possiede un menu deve restare visibilmente premuto o aperto finché il popup non si chiude; il solo hover non può spiegare la relazione tra trigger e superficie.

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

In un controllo segmentato, il riempimento selezionato e la superficie non selezionata devono condividere la silhouette del contenitore. Nessuno dei due può squadrare un angolo di estremità o far apparire un confine più pesante degli altri.

Mostra un elemento di navigazione, una riga di lista o una scheda selezionati attraverso la superficie dell'elemento stesso: un riempimento di selezione, un primo piano più forte o un peso maggiore. Non aggiungere una barra sul bordo iniziale o un bordo su un solo lato come indicatore di selezione. È un'abitudine dei template web, non una convenzione nativa; spezza la silhouette arrotondata dell'elemento e aggiunge un secondo bordo concorrente a una colonna che è già allineata sul proprio testo.

Per le azioni distruttive, distingui tra lavoro reversibile e irreversibile. Preferisci l'annullamento o una notifica temporanea per le modifiche reversibili. Usa un [`AlertDialog`](../elements/alert-dialog.md) quando la conseguenza è grave e non può essere annullata; indica nel testo di conferma l'oggetto e la conseguenza specifici.

<a id="pointer-conventions"></a>

### Convenzioni del puntatore

Usa il cursore predefinito per pulsanti, checkbox, voci di menu, schede e altri controlli. Usa una mano che indica (`cursor-pointer`) per i link e per i contenuti che si comportano come link. Usa i cursori di testo, ridimensionamento, afferra e divieto solo quando descrivono la manipolazione in corso. Un cursore rafforza un'affordance; non sostituisce lo stato visibile o il ruolo accessibile del controllo.

Mantieni modesti gli effetti hover perché le interazioni touch, da tastiera e di accessibilità non hanno hover. Non rivelare al passaggio del mouse l'unica copia di un'azione distruttiva o essenziale. Le azioni contestuali di riga possono diventare più discrete a riposo se gli stessi comandi restano disponibili tramite selezione, tastiera o menu contestuale.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### Preferire le superfici di comando alle toolbar al passaggio del mouse

Usa la frequenza e l'ambito dei comandi per scegliere dove risiede un'azione:

- mantieni visibile l'azione primaria o frequente come pulsante con etichetta o controllo familiare della toolbar;
- metti le azioni secondarie per la regione corrente dietro un trigger [`Menu`](../elements/menu.md) visibile;
- metti i comandi che agiscono sull'oggetto sotto il puntatore o il dito in un `ContextMenu`: un clic destro sui desktop, una pressione prolungata del dito sui touch screen;
- esponi lo stesso comando importante tramite una scorciatoia da tastiera ([`keymap`](../modules/nsh.md#keymap)) quando ha una forma naturale da tastiera, e nel menu dell'applicazione (`Menu.setApplicationMenu` da [`nsh/desktop`](../modules/nsh-desktop.md));
- usa un'icona rivelata al passaggio del mouse solo come scorciatoia verso un comando che resta raggiungibile altrove.

Non è solo una preferenza visiva. I menu di `nsh/base` gestiscono già il posizionamento sul trigger, i sottomenu a cascata sui desktop e uno sheet con sottomenu in loco sui telefoni, la chiusura tramite scelta di una voce, pressione all'esterno, Escape o indietro, e i ruoli menu e menu item per gli screen reader. Una striscia personalizzata di pulsanti hover deve ricostruire questi comportamenti ed è invisibile ai flussi di lavoro touch, solo da tastiera e a molte tecnologie assistive.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

Scegli `Menu` quando gli utenti hanno bisogno di un'indicazione visibile che esistono altri comandi, per esempio l'overflow di una toolbar, le azioni del documento o un menu dell'account. Scegli `ContextMenu` per i comandi legati a una selezione o a un oggetto, come rinomina, duplica, mostra o rimuovi. Il menu contestuale non deve essere l'unico modo per eseguire un comando essenziale; fornisci un percorso tramite barra dei menu, toolbar, tastiera o vista di dettaglio, a seconda dei casi.

Non mettere ogni azione in un menu solo per far sembrare minimale una schermata. Scoperta e velocità contano: l'azione principale resta visibile, le voci pericolose restano chiaramente etichettate e separate, e una voce di menu dovrebbe usare lo stesso verbo, la stessa icona, la stessa scorciatoia, lo stesso stato di abilitazione e lo stesso risultato ovunque compaia.
<a id="button-means-application-action-link-means-external-resource"></a>

### Button indica un'azione dell'applicazione; Link indica una risorsa esterna

Usa un `Button` quando l'attivazione cambia lo stato dell'applicazione, conferma una decisione, apre uno strumento, invia dati o esegue un comando. Scegli il trattamento in base alla gerarchia locale:

- pulsante primario per l'unico impegno da enfatizzare in un'area di decisione;
- pulsante predefinito per le azioni visibili ordinarie;
- pulsante outline quando un'azione ha bisogno di un confine chiaro con minore enfasi;
- pulsante ghost per le azioni familiari e a bassa enfasi nelle barre degli strumenti e inline;
- pulsante con icona solo per un simbolo ben noto, con un nome accessibile e un tooltip quando il significato o l'ambito non sono chiari.

Non assegnare il livello primario perché un pulsante è l'unica azione sullo schermo, perché si trova in alto a destra o perché il team vuole più clic. Il livello primario comunica l'impegno predefinito e il comportamento da tastiera. Se l'attivazione è semplicemente un comando ordinario, come aggiungere un elemento, aprire uno strumento o aggiornare una vista, usa un pulsante predefinito, outline o ghost in base alla sua gerarchia locale.

Usa un link sottolineato (`role="link"`) solo per la destinazione di una risorsa esterna: un URL, una pagina web, la documentazione online o un indirizzo email. Usa il cursore a mano che punta perché il suo contratto è lasciare il contesto corrente dell'applicazione per raggiungere quella risorsa. Non usare lo stile del link per far sembrare discreto un comando funzionale. Un'azione Elimina, Salva, Aggiorna, Aggiungi, Apri menu o di navigazione interna con l'aspetto di un link nasconde l'affordance del controllo ed espone il ruolo di accessibilità sbagliato.

«Visualizza» non rende un link una destinazione interna all'app. Un report completo, un'analisi, un pannello di dettagli o un record locale si aprono comunque tramite un pulsante, una riga, una card, una scheda o un controllo di disclosure. Usa etichette concise e dipendenti dal contesto, come `Full analysis`, quando la card che le contiene stabilisce già che cosa si apre; riserva la sottolineatura a una risorsa che si apre davvero in un browser o in un client di posta.

Tutta la navigazione interna (righe della barra laterale, schede, breadcrumb, elementi di elenco, apertura di una vista locale o cambio di workspace) deve usare il navigation stack, un `Button` o il componente corrispondente. L'enfasi visiva si sceglie tramite la variante del pulsante o lo stato selezionato del componente di navigazione, mai travisando la semantica.

<a id="feedback-and-overlays"></a>

## Feedback e overlay

Scegli la superficie più piccola adatta alla decisione:

- tooltip: una breve spiegazione o una scorciatoia ([`Tooltip`](../elements/tooltip.md), o il `tooltip` di qualsiasi elemento);
- popover: controlli contestuali che non interrompono l'attività ([`Popover`](../elements/popover.md));
- menu: un elenco compatto di azioni ([`Menu`](../elements/menu.md));
- notifica: stato asincrono che non richiede una decisione;
- dialog: una decisione mirata o un breve modulo ([`Dialog`](../elements/dialog.md));
- alert dialog: conferma esplicita di un'azione con conseguenze rilevanti ([`AlertDialog`](../elements/alert-dialog.md));
- sheet: lavoro supplementare che beneficia di uno spazio più persistente ([`Sheet`](../elements/sheet.md)).

Ciascuno assume la forma che il dispositivo si aspetta, a partire da un'unica struttura stilizzata dall'app (`popupClass`, `backdropClass`):

| | Desktop | Telefoni e tablet |
| --- | --- | --- |
| `Tooltip` | dopo che il puntatore si ferma sull'elemento | solo quando l'app lo apre |
| `Popover` | ancorato; una pressione all'esterno lo chiude e prosegue | ancorato; una pressione all'esterno si limita a chiuderlo |
| `Menu` | un popup sul trigger, con sottomenu a cascata | uno sheet in basso; un sottomenu prende il posto delle sue voci |
| `ContextMenu` | il pulsante secondario, in corrispondenza del puntatore | un dito tenuto premuto apre lo sheet |
| `Sheet` | un pannello laterale sopra un backdrop | lo stesso |
| `AlertDialog` | un alert nello stile di dialog della piattaforma | l'alert o l'action sheet di sistema |

Un tooltip fornisce un significato mancante; non ripete un'azione ovvia. Riservalo a un simbolo poco familiare, a un ambito ambiguo o a una scorciatoia utile che altrimenti resterebbe nascosta. Comandi ripetuti e riconoscibili, come Copia e Scarica nel piè di pagina di un messaggio, richiedono nomi accessibili e accesso da tastiera, ma le loro etichette al passaggio del mouse aggiungono interruzione anziché chiarezza. I telefoni mostrano un tooltip solo quando l'app lo apre, quindi un tooltip non deve mai contenere ciò che serve a un utente touch.

Un alert interrompe la gerarchia visiva anche quando non apre un modale. Usalo per informazioni importanti ed eccezionali che richiedono attenzione nell'attività corrente, non come contenitore decorato per descrizioni ordinarie, suggerimenti o spazio vuoto. Preferisci un aiuto inline, un testo attenuato o una normale sezione quando il contenuto non richiede attenzione o azione immediata.

Evita di sovrapporre gli overlay. Escape e il pulsante Indietro di Android chiudono il livello chiudibile più in alto; mantieni sincronizzato lo stato dell'app tramite `onOpenChange`e riporta il focus sul trigger o sul successivo bersaglio logico.

Un'azione di un overlay deve riferirsi a un oggetto o a uno stato che l'overlay mostra davvero. Per esempio, esponi `Clear history` solo quando è visibile una sezione distinta di cronologia recente che contiene voci. Risultati di ricerca, elementi recenti e preferiti sono raccolte diverse: etichettali e separali invece di fonderli in un unico elenco privo di spiegazioni. Nascondi un'azione non applicabile oppure disabilitala con una motivazione utile; non lasciare un'ambigua icona del cestino parcheggiata in un piè di pagina.

Lo spazio del piè di pagina non è un contenitore per le funzionalità che non hanno trovato posto nel design. Un piè di pagina può presentare scorciatoie, stato o azioni che si applicano all'intera superficie, ma ogni elemento deve rispondere a queste domande: qual è il suo oggetto, perché è disponibile adesso, quale ambito influenza e quale stato visibile cambia dopo l'attivazione?

<a id="motion"></a>

## Movimento

Il movimento spiega il cambiamento; non è una decorazione d'ambiente. Usa transizioni brevi per comparsa, chiusura, espansione e continuità spaziale. Evita di animare grandi cambiamenti di layout quando opacità o trasformazione comunicano la stessa relazione. Rispetta le preferenze di movimento ridotto (`motion-reduce:`, `reduceMotion()`), non richiedere mai un'animazione per comprendere lo stato e non aggiungere un'animazione predefinita a ogni componente.

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

La politica del movimento appartiene al livello applicativo. `nsh/base` possiede il meccanismo del ciclo di vita o la geometria necessari a una transizione, ma non decide che ogni prodotto debba dissolversi o scorrere. Dai un'identità stabile ai valori animati in modo indipendente e fai in modo che l'interruzione si inverta in modo fluido a partire dal valore attualmente campionato, anziché ripartire da un vecchio estremo.

Il movimento segue la continuità dell'interazione. Mentre un puntatore o una posizione di scorrimento si spostano tra bersagli correlati, mantieni stabile la superficie di anteprima e aggiorna il suo contenuto o la sua posizione sul posto. Chiudila solo al termine dell'interazione; ripetute dissolvenze in uscita e rientri a ogni aggiornamento vengono percepiti come sfarfallio.

<a id="designing-data-heavy-interfaces"></a>

## Progettare interfacce ricche di dati

Denso non significa affollato. In tabelle, alberi, elenchi lunghi ed editor:

- mantieni visivamente stabili le intestazioni e l'identità primaria delle righe;
- allinea i valori confrontabili e usa numeri tabulari dove appropriato;
- distingui focus, hover, riga attiva e selezione multipla;
- mantieni l'ordinamento e il filtraggio visibili e reversibili;
- conserva la selezione in base all'identità di dominio durante filtraggio e riordinamento;
- virtualizza le raccolte di grandi dimensioni (`List`) senza cambiare la semantica da tastiera;
- usa la progressive disclosure per colonne secondarie e inspector;
- fornisci uno stato vuoto utile che spieghi la prossima azione.

Scegli una tabella per il confronto tra campi coerenti, un elenco per scorrere elementi eterogenei e un albero per una gerarchia reale. Non usare un layout di dati complesso come stile visivo.

<a id="interface-language"></a>

## Linguaggio dell'interfaccia

Le parole fanno parte dell'architettura dell'interfaccia. Scrivi il vocabolario di una funzionalità come un sistema (destinazioni, oggetti, comandi, stati ed esiti) e non come traduzioni isolate di funzionalità implementative. Preferisci la formulazione più breve che resti accurata nel suo contesto reale.

<a id="let-context-carry-context"></a>

### Lascia che sia il contesto a portare il contesto

Non ripetere informazioni che la superficie circostante stabilisce già. Una destinazione della barra laterale è di solito l'oggetto o il dominio stesso: usa `Users`, non `User Management`; `Shortcuts`, non `Shortcut Configuration Management`. Una colonna le cui righe contengono già azioni può omettere un'intestazione generica `Operation`. Un dialog intitolato `Delete “Roadmap”?` non ha bisogno di un testo che ponga di nuovo la stessa domanda.

Questa è economia del contesto, non cancellazione fine a sé stessa. Aggiungi testo quando cambia la decisione: identifica l'ambito interessato, una conseguenza irreversibile, un prerequisito insolito o un modo per recuperare. Ogni parola in più deve rispondere a una domanda a cui il layout attuale non risponde già.

Usa nomi per destinazioni e oggetti (`Users`, `Appearance`, `Orders`), verbi per i comandi (`Save`, `Duplicate`, `Export`) e aggettivi o brevi locuzioni per gli stati (`Offline`, `Up to date`, `Pending review`). Evita wrapper come `Management`, `Module`, `Page`, `Function`, `Operation` e `System`, a meno che la parola non distingua un vero concetto di dominio.

<a id="write-each-language-do-not-translate-its-shape"></a>

### Scrivi ogni lingua, non tradurne la forma

Parti da intento, gerarchia e terminologia condivisi, poi componi ogni locale come linguaggio d'interfaccia naturale. Non conservare l'ordine delle parole, il numero di parole, i riempitivi di cortesia o la categoria grammaticale della lingua di partenza. L'inglese `Users` può esprimere in cinese un concetto di funzionalità che alla lettera si espanderebbe in «gestione utenti»; la fedeltà significa preservare lo scopo, non i token.

Rimuovi le parole fornite dall'architettura informativa circostante. All'interno di una superficie `Settings`, una destinazione è spesso semplicemente `Account`, non `Account Settings` e mai il singolare innaturale `Account Setting`. L'etichetta inglese corretta si sceglie in base al suo ruolo e alle etichette vicine, non in base alla frase di partenza considerata da sola.

Mantieni un piccolo lessico di prodotto per oggetti, comandi e stati ricorrenti. Usa lo stesso termine nella barra degli strumenti, nel menu, nel menu contestuale, nel dialog, nella ricerca delle scorciatoie e nella documentazione, a meno che il contesto non ne cambi davvero il significato. Rivedi i testi nella superficie renderizzata: le etichette vicine rivelano spesso ripetizioni o ambiti incoerenti che un file di localizzazione non mostra.

Nella scrittura tecnica localizzata, conserva un termine di framework consolidato quando una traduzione sarebbe meno precisa. Mantieni gli identificatori delle API nella loro forma originale e formattali come codice. Non conservare parole straniere ordinarie solo per sembrare tecnici. Spiega un termine conservato al primo utilizzo, se necessario, poi usa la stessa forma in tutta l'interfaccia, nella documentazione e negli esempi di API.

Nella documentazione, usa il nome inglese esatto di un'API, di un componente, di un file sorgente o di una guida con nome nel testo del link, anche nelle pagine localizzate. Per esempio, scrivi `View`, `Button`, `Menu` e `Text` anziché tradurne i nomi o aggiungere un prefisso `NSH` ridondante. Mantieni le spiegazioni circostanti nella lingua della pagina. Collega solo la destinazione con nome; collocare parole come «sorgente» fuori dal link quando descrivono perché viene citata.

In una tabella di confronto tecnico condivisa tra più locale, mantieni nella loro forma inglese consolidata i nomi delle capacità, dei framework, delle API e dei modelli. Traduci la spiegazione intorno alla tabella, non le sue etichette tecniche. Le comuni parole d'interfaccia che hanno un nome locale consolidato possono comunque essere localizzate fuori da quel contesto di confronto.
<a id="buttons-and-confirmation-dialogs"></a>

### Pulsanti e finestre di dialogo di conferma

Per impostazione predefinita le etichette dei pulsanti sono brevi, di solito una o due parole, e descrivono il risultato, non il gesto o il componente.
Preferisci `Save`, `Move` o `Delete` a `Click to save`, `Perform move` o `Confirm deletion`. Usa `Cancel` in modo coerente
per l'azione che esce senza confermare. Riserva `OK` alla presa d'atto di contenuti puramente informativi.

Breve è un'impostazione predefinita, non un limite di caratteri. Un'etichetta volutamente più lunga è preferibile quando le sue parole espongono una conseguenza
o distinguono scelte che altrimenti gli utenti potrebbero confondere, ad esempio `Delete from this group` rispetto a `Delete
everywhere`, or `Restart without saving`. La lunghezza deve fornire informazioni decisive per la scelta; non deve ripetere il
titolo o il corpo del dialogo.

Quando possibile, usa come etichetta di conferma il risultato conciso più specifico:

| Contesto | Debole | Preferito |
| --- | --- | --- |
| Dialogo di eliminazione | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| Modifiche non salvate | `Confirm`, `Yes` | `Discard changes` |
| Semplice presa d'atto | `Confirm operation` | `OK` o `Done` |
| Consenso complesso il cui risultato non ha un verbo chiaro | `Yes` | `Confirm` |

`Confirm` è un'alternativa utile quando il dialogo circostante nomina per intero un impegno complesso e nessun verbo di risultato più breve è accurato. Non deve sostituire un comando chiaro. `Sure` è colloquiale e non è un comando inglese stabile, ed è
troppo ambiguo per il vocabolario standard.

Un dialogo di conferma dovrebbe formare un'unica decisione compatta:

- titolo: la decisione o la condizione, ad esempio `Delete “Roadmap”?`;
- corpo: solo informazioni nuove su ambito, conseguenze o recupero;
- azioni: `Cancel` e il risultato, ad esempio `Delete`;
- stile distruttivo: applicato al risultato distruttivo (un'azione `AlertDialog` con il ruolo `destructive`), senza
  sostituire una formulazione precisa.

Evita titoli generici come `Notice`, `Warning`, `Error` e `Confirmation` quando è possibile nominare la condizione effettiva.
Evita le formule rituali come “Are you sure you want to…”, “Would you like to…”, “Please note that…” e
“successfully” quando la struttura o lo stato le comunicano già. La cortesia deve derivare da un tono calmo e rispettoso,
non da `please` ripetuto.

<a id="capitalization-punctuation-and-symbols"></a>

### Maiuscole, punteggiatura e simboli

Usa per impostazione predefinita lo sentence case per la UI in inglese: `Reset layout`, non `Reset Layout` né `RESET LAYOUT`. Preserva i nomi
propri e gli acronimi consolidati. Segui una convenzione di piattaforma, come il title case per i comandi dei menu nativi, solo quando
l'integrazione con la piattaforma ne trae beneficio, e applicala in modo coerente all'interno della classe di componenti.

Il TUTTO MAIUSCOLO può fornire un'enfasi tipografica misurata per etichette di sezione molto brevi, eyebrow, stati, acronimi
consolidati e identificatori simili al codice. La sua forma compatta e la spaziatura misurata possono formare un livello simile al
grassetto, ma non appartiene a pulsanti, titoli lunghi, frasi o elenchi densi. Non combinare maiuscolo, colore intenso e
grassetto nella stessa area e non trasformare automaticamente ogni stringa: i nomi di prodotto, gli acronimi e i
contenuti localizzati devono preservare la capitalizzazione prevista.

Etichette, pulsanti, voci di menu, schede, titoli, segnaposto e stati brevi non hanno il punto finale. Le frasi complete di
spiegazione, avviso ed errore lo hanno. Evita i punti esclamativi nei messaggi di successo e di errore di routine. In
cinese, usa la punteggiatura a larghezza piena nelle frasi e ometti la punteggiatura finale nelle brevi etichette dei controlli secondo la stessa
regola semantica.

Usa il carattere di ellissi singolo (`…`), non tre punti. Aggiungilo a ogni pulsante o voce di menu che apre un dialogo,
un foglio o una finestra separata, e a un comando che richiede ulteriori input o scelte prima di poter essere completato, come
`Settings…` o `Export…`. Un comando eseguito immediatamente non ha i puntini di sospensione. Usa un indicatore di avanzamento
indeterminato, non puntini decorativi, per comunicare un'attività in corso.

Gli errori dovrebbero dire cosa è successo e, quando utile, la successiva azione di recupero. Il feedback di successo dovrebbe nominare lo stato risultante
solo quando tale stato non è già visibile. Preferisci `Couldn’t save. Check your connection and try again.` a un
codice tecnico o a una lunga scusa; ometti un toast `Saved successfully` quando il documento risulta visibilmente salvato.

<a id="internationalization-and-platform-fit"></a>

## Internazionalizzazione e adattamento alla piattaforma

I nomi e le etichette di accessibilità (A11y) possono restare in inglese; la localizzazione non è necessaria per queste stringhe. Mantieni
l'etichetta propria dell'elemento quando nomini un controllo che agisce su di esso, anche se tale etichetta è localizzata. Questa eccezione non
si applica ai testi visibili della UI.

Il testo deve sopravvivere all'espansione, alla tipografia CJK, alle scritture da destra a sinistra e a diverse notazioni delle scorciatoie. Non dimensionare un
controllo in base a una sola etichetta inglese. Tieni il testo fuori dalle risorse raster, evita di concatenare frammenti tradotti e lascia che le
etichette vadano a capo o vengano troncate solo dove il prodotto definisce un percorso di recupero, come un tooltip.

Rispetta le differenze di piattaforma che hanno un significato: Command rispetto a Control, decorazioni native delle finestre, aspetto
di sistema, comportamento delle barre di scorrimento, menu, capacità di notifica e, sui telefoni, l'intestazione di sistema, il gesto indietro e gli
avvisi. Mantieni stabile l'architettura dell'informazione del prodotto tra le piattaforme, ma non cancellare il comportamento familiare
della piattaforma per un'uguaglianza superficiale dei pixel.

Le app NSH vengono eseguite su telefoni, tablet, desktop e web, e spesso all'interno di un'app host. Progetta per ciascuno:

- **La UI di sistema mantiene l'aspetto della piattaforma.** Su iOS e Android l'intestazione di una pagina è quella del sistema (`NavPage` con `title` e
  le opzioni di intestazione); i desktop e il web mostrano lo slot `header` della pagina, che viene disegnato dall'app. Fornisci entrambi per ogni pagina
  ([Navigazione](./navigation.md#navpage-and-the-header)). Le conferme usano `AlertDialog`; la barra di stato segue la
  pagina o il dialogo in primo piano (`statusBar`).
- **Il tema dell'host.** A un'app incorporata può essere assegnato il tema del suo host; le classi e i binding Rust che leggono i token
  lo seguono in modo nativo ([Token del tema](./tailwind.md#theme-tokens)).
- **Aree sicure e tastiera.** Mantieni il contenuto all'interno dell'area sicura (`env(safe-area-inset-*)`, `safeAreaInsets()`) e gli input
  sopra la tastiera software (`env(keyboard-inset-height)`) ([Dispositivo e ambiente](./device-and-environment.md)).
- **Aspetto, dimensione del testo e movimento.** Ogni superficie funziona in modalità chiara e scura (`dark:`, `colorScheme()`), con la
  dimensione del testo scelta dall'utente e con movimento ridotto (`motion-reduce:`, `reduceMotion()`).
- **Da destra a sinistra.** La direzione del layout segue la lingua del locale e lo stile `direction` la imposta per una vista e il suo
  sottoalbero; le proprietà start ed end si specchiano ([Da destra a sinistra](./layout.md#right-to-left)).
- **Tocco e puntatore.** Le aree di tocco sono almeno 44 × 44 punti; hover e tooltip esistono solo con un puntatore.

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## Linee guida per le interfacce generate dall'IA

Un'IA che modifica un'interfaccia NSH dovrebbe prima ispezionare la funzionalità più vicina, i componenti e i token del tema dell'app e
la documentazione e le dichiarazioni dei componenti (`.nsh/types`). Prima di generare codice dovrebbe indicare l'attività principale, il proprietario dello stato, la composizione dei componenti e i percorsi da tastiera e touch. Non deve dedurre un'API dagli esempi di React, React Native
o Shadcn né inventare una prop o un metodo NSH perché il nome sembra plausibile; `nsh check` e il controllo delle classi della build segnalano ciò che non esiste.

L'output dell'IA è incompleto finché una persona non è in grado di spiegare perché la gerarchia, la densità, la scelta dei componenti e i
valori letterali eccezionali appartengono a questo prodotto. Uno screenshot visivamente plausibile non è una prova: il comportamento da tastiera e touch,
il focus, i contenuti dinamici, i temi, il ridimensionamento, la dimensione del testo e gli stati di errore fanno parte del design.

<a id="accessibility-checklist"></a>

## Checklist di accessibilità

Prima di considerare completa una schermata, verifica che:

- ogni azione sia raggiungibile e utilizzabile tramite tastiera, tocco e screen reader;
- l'ordine del focus segua l'ordine visivo e quello dell'attività;
- il focus rimanga visibile e venga ripristinato dopo gli overlay;
- i controlli abbiano nomi accessibili; i controlli solo icona usino tooltip quando il loro significato, ambito o scorciatoia richiede
  una spiegazione;
- il testo e i confini significativi abbiano un contrasto sufficiente;
- lo stato non sia comunicato solo tramite il colore;
- gli stati disabilitato e sola lettura siano distinguibili;
- etichette, errori e descrizioni restino vicini ai relativi controlli;
- il contenuto resti utilizzabile con traduzioni più lunghe, da destra a sinistra e con testo più grande;
- le aree di tocco siano almeno 44 × 44 punti e le aree del puntatore abbiano dimensioni confortevoli anche in un layout denso.

<a id="design-review-checklist"></a>

## Checklist di revisione del design

Una revisione non fa l'inventario dei componenti; valuta se l'interfaccia ha preso le decisioni giuste. Chiediti, in ordine:

1. **L'attività è chiara?** Un nuovo utente riconosce lo scopo, l'azione principale e il passo successivo senza imparare,
   indovinare o sperimentare?
2. **Ogni azione mantiene la sua promessa?** Etichetta, controllo, stato, ambito, feedback e risultato descrivono un unico
   esito coerente?
3. **La gerarchia è decisa e misurata?** La funzionalità centrale riceve lo spazio che merita mentre colore intenso,
   grassetto, badge, avvisi e pulsanti primari restano rari?
4. **L'interfaccia potrebbe fare meno, ma meglio?** Un punto di ingresso, un'opzione o uno stato può essere rimosso, combinato o rinviato
   senza indebolire l'attività completa?
5. **La struttura è esatta?** I pari condividono le stesse linee di allineamento, gli spazi uguali restano uguali fino al pixel renderizzato e
   le barre di scorrimento si trovano al bordo della loro effettiva area di scorrimento?
6. **Segue il sistema di componenti?** I controlli standard mantengono geometria, stati, comportamento da tastiera e
   modello di chiusura, con l'aspetto fornito dai token di tema e di scala?
7. **Resta utilizzabile in ogni stato e vincolo?** Verifica il comportamento di tastiera, tocco e focus,
   gli stati vuoto/caricamento/errore/permessi, le traduzioni più lunghe, il testo più grande, da destra a sinistra, entrambi gli aspetti,
   la dimensione minima della finestra e il movimento ridotto.
8. **È stata testata su piattaforme reali?** Completa l'attività con componenti reali, testi reali e contenuti rappresentativi
   su ogni piattaforma di destinazione (`nsh run --target …`, `nsh test --target …`), non solo con uno screenshot ideale.
