---
title: "Compatibilità retroattiva"
description: "Come Native Shell mantiene in funzione le app tra una release e l'altra: cosa promette una release compatibile, il registro in nsh-compat che contiene ogni modifica, il flusso di rilascio e come aggiungere, rinominare o modificare un'API."
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---

# Retrocompatibilità

Le app host scaricano le app NSH come [pacchetti firmati](./signed-packages.md) e le eseguono come plugin. Un'app già rilasciata potrebbe non essere mai più compilata: il suo team è passato ad altro, il suo sorgente si trova in un processo aziendale, l'app host ha aggiornato
NSH con i propri tempi. Per questo Native Shell mantiene una promessa verso ogni app: **un'app compilata per una release compatibile funziona
su ogni release successiva, senza modifiche.** Un'app che smette di funzionare dopo un aggiornamento di NSH è un bug di NSH.

Questa pagina descrive la promessa, come viene fatta rispettare e come modificare NSH senza infrangerla.

<a id="what-an-app-can-rely-on"></a>

## Su cosa può contare un'app

La promessa copre tutto ciò che un'app compilata utilizza:

| Parte | Perché è importante |
| --- | --- |
| Gli export di ogni modulo (`nsh`, `nsh/*`, `nsh/base`, i moduli standard) e i loro membri | Un bundle li importa per nome: se manca un nome, l'app non si avvia. |
| `nsh:rt`, le funzioni chiamate dal JSX compilato | Ogni bundle contiene l'output del compilatore che lo ha compilato. |
| I globali (timer, `fetch`, `console`, ...) e i loro membri | Le app li chiamano per nome. |
| Prop degli elementi, eventi e relativi payload, chiavi di stile e i loro valori | Le app li passano per nome; una prop rinominata viene ignorata, quindi l'app funziona in modo errato. |
| Utility e varianti di Tailwind | Le classi vengono risolte a runtime a partire dalle stringhe presenti nel bundle. |
| Comportamento: valori predefiniti, unità, payload, ordine dei callback | Un'app fa affidamento su ciò che ha osservato quando è stata scritta. |
| Le dichiarazioni TypeScript (`.nsh/types`) | Il sorgente di una vecchia app continua a superare il controllo dei tipi quando il suo team corregge un bug. |
| Il formato dei pacchetti e le loro firme | Un pacchetto firmato per una release precedente continua a essere verificato. |

Le regole che la garantiscono:

1. **Ciò che una release ha distribuito resta.** Nessun modulo, export, membro, prop, evento, chiave di payload, chiave o valore di stile,
   utility Tailwind, globale o funzione di `nsh:rt` viene rimosso.
2. **Una ridenominazione mantiene il vecchio nome** come alias della stessa implementazione, contrassegnato con `@deprecated` insieme al nuovo nome,
   per sempre. Spostare un export in un altro modulo significa mantenerlo anche in quello vecchio.
3. **I tipi si possono solo ampliare.** Un'unione acquisisce alternative, una funzione acquisisce overload o parametri opzionali finali, un
   parametro diventa opzionale; ciò che le app passano (prop, stili, opzioni) acquisisce solo membri opzionali. Anche i valori
   che un'app legge crescono allo stesso modo: `platform.os` acquisisce una piattaforma, uno stato o un motivo acquisisce un caso. Un caso che l'app
   ha già visto mantiene il suo valore, e l'app gestisce un valore che non conosce con il `default` di uno `switch`:

   ```tsx
   switch (platform.os) {
     case "ios":
     case "android":
       return <MobileLayout />;
     default:
       // The desktops, the web, and platforms NSH adds later.
       return <WideLayout />;
   }
   ```
4. **Il comportamento è mantenuto.** Il nuovo comportamento è opt-in, tramite una nuova prop, opzione o valore.
5. **`nsh:rt` cresce soltanto**, e ogni funzione mantiene la propria firma e il proprio significato.
6. **I formati vengono letti per sempre.** Pacchetti, certificati, liste di revoca e `app.json` delle release precedenti vengono letti
   da quelle successive; un pacchetto indica il runtime minimo di cui ha bisogno (`nsh publish --min-runtime`).
7. **La sicurezza è l'unica eccezione.** Una funzionalità che non può essere mantenuta sicura viene chiusa, elencata con il suo motivo e
   indicata nelle note di rilascio.

La promessa parte dalla prima release registrata come compatibile e vale per sempre, qualunque cosa dica il numero di
versione. Tra una release e l'altra, un'API che ha solo `main` può ancora cambiare.

<a id="how-it-is-enforced"></a>

## Come viene fatta rispettare

Ciò che le release hanno congelato si trova in un repository dedicato,
[longbridge/nsh-compat](https://github.com/longbridge/nsh-compat), separato dal codice di NSH. Una modifica a NSH viene eseguita
a fronte di esso e non può modificarlo: una pull request che rinomina un'API non può anche riscrivere la registrazione di quell'API.

```
nsh                                       nsh-compat
├─ crates/          the code              ├─ releases/v<version>/   one per compatible release, never changed
└─ tests/compat/    apps that test the    │  ├─ runtime.txt         every export, global and nsh:rt function
   ├─ cases/        API being written     │  ├─ types/              the declarations apps build against
   └─ examples/                           │  ├─ tailwind.txt        every Tailwind class and what it sets
                                          │  └─ apps/               the test apps as that release built them
                                          ├─ closed.txt             security closures, each with its reason
                                          └─ src/                   the checks
```

Ogni pull request a NSH esegue i controlli di `nsh-compat` sul proprio checkout (il workflow **Compat**, oppure
`cargo xtask compat` in locale):

| Controllo | Cosa lo supera |
| --- | --- |
| `checkout_apps_run` | Le app di `tests/compat/`, compilate da questo checkout, fanno ciò che dicono i loro script, e ogni parte dell'API che uno script dichiara di verificare è davvero verificata. |
| `nothing_released_is_removed` | Tutto ciò che ogni release registrata offriva (export, membri e il loro tipo, dichiarazioni, classi Tailwind e ciò che impostano) è ancora offerto, identico o ampliato. |
| `released_apps_run` | Le app che ogni release registrata ha compilato, così come le ha compilate il suo compilatore, si avviano su questo runtime e fanno ciò che dicono i loro script. |

Il primo controllo verifica l'API in corso di scrittura; gli altri due vincolano ogni release registrata. La ridenominazione di
un'API già rilasciata fallisce in questo modo:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` è rivisto dai maintainer di NSH, e la sua CI lo esegue a fronte di `main` di NSH.

<a id="the-release-flow"></a>

## Il flusso di rilascio

1. **Sviluppo.** Un'API viene integrata in `main` con un caso in `tests/compat/` il cui script la verifica. Finché una release non la
   registra, può essere rinominata o rimodellata; il caso cambia di conseguenza.
2. **Registrazione.** A ogni release, `cargo xtask compat record <version>` scrive `releases/v<version>/` in un checkout di
   `nsh-compat`: la superficie che la release offre e ogni app di `tests/compat/` compilata dal suo compilatore, con i relativi
   script. Registra solo un'API di cui ogni parte è verificata da uno script.
3. **Congelamento.** La registrazione viene integrata tramite una pull request di `nsh-compat`. Da quel momento ogni modifica a NSH è vincolata
   ad essa, insieme a ogni registrazione precedente.

<a id="developing-within-the-promise"></a>

## Sviluppare nel rispetto della promessa

<a id="adding-an-api"></a>

### Aggiungere un'API

Ogni nuovo export, globale, prop, evento o chiave di stile è accompagnato da un caso:

1. Scrivi un modulo `tests/compat/cases/<domain>/<case>.tsx` il cui export predefinito è un componente che usa l'API e
   ne mostra il risultato. I domini sono `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` e `web`, più
   `android`, `macos` e `browser` per ciò che è deciso da una piattaforma o da un'impostazione di `nsh.json`.
2. Aggiungilo a `App.tsx` del dominio, che mostra un caso alla volta.
3. Aggiungi i passi a `script.txt` del dominio: `tap id:case-<case>`, poi i passi che verificano ciò che l'API fa,
   e un passo `covers <item>` per ogni parte che aggiunge.
4. Esegui `cargo xtask compat` (`NSH_COMPAT_APP=<domain>` esegue un solo dominio).

```txt
# props-media-video
tap id:case-props-media-video
prop id:clip src https://example.com/clip.mp4
prop id:clip paused true
tap id:play
prop id:clip paused false
covers [props] src
covers [props] paused
```

Un passo `covers` è verificato: l'app deve usare l'elemento e, per una prop, un evento o una chiave di stile, rimuoverlo dall'app
compilata deve far fallire un passo dello script. Gli elementi sono denominati `[<module>] <export>`, `[globals] <name>`,
`[props] <name>`, `[events] <name>`, `[styles] <name>`, quelli propri di un componente come `[props] <Component>.<name>`, e le prop di una
piattaforma come `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>`.

<a id="renaming-or-moving-an-api"></a>

### Rinominare o spostare un'API

Aggiungi il nuovo nome e mantieni il vecchio come alias della stessa implementazione, dichiarato `@deprecated` con il nuovo
nome. Aggiorna il caso e il suo script con il nuovo nome. Un'API che nessuna release ha ancora registrato viene semplicemente rinominata.

<a id="changing-a-type"></a>

### Modificare un tipo

Ampliarlo: più alternative in un'unione, più overload, parametri opzionali finali, nuovi membri opzionali di ciò che le
app passano. Un'unione che le app leggono acquisisce membri allo stesso modo, ciascun nuovo membro per un nuovo caso. I nomi dei parametri possono cambiare liberamente; il loro numero, la loro opzionalità e i loro tipi restano.

<a id="changing-behavior"></a>

### Modificare il comportamento

Mantieni il vecchio comportamento e aggiungi quello nuovo dietro una nuova prop, opzione o valore. Anche una correzione di bug che cambia ciò che un'app funzionante
vede è una modifica del comportamento: mettila dietro un opt-in, oppure assicurati che nessuna app possa fare affidamento sul vecchio risultato. Dai al
comportamento un passo in un caso, in modo che resti com'è.

<a id="changing-the-compiler"></a>

### Modificare il compilatore

Nulla di aggiuntivo: le app di ogni release restano come le ha compilate il compilatore di quella release, mentre i casi vengono compilati da zero dal
tuo. Le funzioni che emette nei bundle (`nsh:rt`) possono solo crescere.

<a id="closing-an-api-for-security"></a>

### Chiudere un'API per motivi di sicurezza

Una pull request di `nsh-compat` aggiunge la voce al suo `closed.txt` con il motivo (`<entry> -- <reason>`, la voce
così come la riporta il controllo), e viene integrata per prima; la modifica a NSH che rimuove l'API supera poi i controlli. Le note di rilascio spiegano
il perché.

<a id="scripts"></a>

## Script

Uno `script.txt` contiene un passo per riga. Passi che agiscono: `tap <selector>`, `type <selector> <text>`,
`key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`. Passi che verificano:
`expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`,
`style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`. Le prime righe possono impostare lo schermo: `viewport <w> <h>`,
`platform <os> [desktop]`, `fontscale <scale>`. Un selettore è `id:<testID>`, `label:<label>`, `text:<text>` oppure
`span:<text>`; prop e stili si scrivono come le app li scrivono (`style id:card backgroundColor #3366ffff`).
`NSH_COMPAT_DUMP=1` stampa ciò che ogni passo aggiunge allo schermo e ciò che ne rimuove, per aiutare a scrivere uno script.

<a id="commands"></a>

## Comandi

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` mantiene un checkout di `nsh-compat` in `target/nsh-compat/` e lo aggiorna a ogni esecuzione;
uno con modifiche proprie viene usato così com'è, così una modifica ai controlli può essere provata su NSH prima della sua pull
request.
