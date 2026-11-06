---
title: "Sandbox e Capabilities"
description: "I limiti entro cui viene eseguita ogni app NSH (memoria, tempo, nodi), l'hardening del linguaggio nelle build di release e le capabilities dichiarate in nsh.json e concesse dalle app host."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# Sandbox e Capabilities

Un'app scritta in Rust è codice nativo compilato nell'app che la distribuisce, come il resto di quell'app, e viene eseguita con la sua stessa fiducia; le sue chiamate ai servizi di NSH (`fetch`, immagini, web view, status bar) passano per gli stessi controlli nativi di quelle del TSX, entro ciò che un host concede. Il TSX e il JavaScript eseguiti da un'app, propri o provenienti da un [pacchetto firmato](./signed-packages.md) che scarica, girano in una VM QuickJS per ogni view, e tutto ciò che possono fare al di fuori di quella VM passa per il runtime nativo di NSH. Questo permette di eseguire codice che non hai scritto tu, come mini app di terze parti o aggiornamenti scaricati, secondo regole controllate dall'app host:

- I **limiti** (Limits) circoscrivono la memoria, il tempo e le risorse native che un'app può usare.
- L'**hardening** rimuove nelle build di release i modi per trasformare stringhe in codice.
- Le **capabilities** elencano ciò che un'app può raggiungere: da quali host può eseguire fetch, quali pagine può mostrare una web view, se può modificare la status bar. Le dichiara l'app; un'app host può concederne meno.

Un bundle contiene soltanto il codice dell'app: il grafo reattivo, il renderer e ogni modulo che l'app importa sono nativi. Quindi nulla in JS è considerato fidato, e ogni limite e controllo è applicato in Rust; non esiste codice JS che un'app possa modificare per aggirarli.

<a id="limits"></a>

## Limiti

I limiti circoscrivono una VM: si applicano a TSX e JavaScript. Un'app incorporata in un'altra app viene eseguita entro limiti decisi dalla sua app host. Un'app autonoma (pacchettizzata con
`nsh package`, web incluso, o eseguita con `nsh run`) è codice tuo, come lo è un'app nativa: usa la memoria e il tempo che il dispositivo le mette a disposizione, e il suo stack dell'interprete di 4096 KB trasforma la ricorsione profonda in un `RangeError` che l'app può intercettare.

Un'app incorporata ha questi limiti:

| Limite | Predefinito | Quando viene raggiunto |
|---|---|---|
| Heap JS | 256 MB | La VM si ferma. |
| Stack dell'interprete | 4096 KB (anche il massimo) | La ricorsione profonda lancia un `RangeError`, che l'app può intercettare. |
| Tempo per valutare il bundle | 10 s | La valutazione viene interrotta. |
| Tempo di qualsiasi altra chiamata in JS | 2 s | La chiamata viene interrotta; l'app prosegue. |
| Nodi conservati | 200 000 | La VM si ferma. |
| Modifiche simultanee (operazioni in coda) | 8 000 000 di valori | La VM si ferma. |
| Operazioni in un singolo disegno canvas | 1 000 000 | La VM si ferma. |

**Il tempo è calcolato per chiamata, non per app.** Una "chiamata" è una singola cosa che il runtime chiede a JS di fare: gestire un evento (incluso il rendering che provoca), associare una riga di una lista, eseguire un timer, eseguire i callback `requestAnimationFrame` di un frame, svuotare la coda delle microtask. Un'app che resta in esecuzione a lungo non accumula mai tempo verso un limite; viene interrotta solo la singola chiamata che non termina in tempo. Le chiamate annidate in un'altra condividono il budget della chiamata esterna.

Una chiamata interrotta termina con un'eccezione che nessun `catch` può inghiottire, e l'errore viene segnalato insieme al budget superato:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

La VM continua a funzionare: il successivo evento, timer o frame viene eseguito normalmente.

**Esaurire la memoria o superare una quota ferma la VM.** L'errore viene segnalato una sola volta (al gestore degli errori dell'app host e, nelle build di sviluppo, sopra l'app), dopo di che non viene eseguito più alcun JS e le view restano com'erano. Le quote sui nodi e sulle operazioni esistono perché le view native e le modifiche in coda risiedono nella memoria nativa, che il limite dell'heap JS non copre: senza di esse, un'app potrebbe esaurire la memoria del dispositivo attraverso la UI.

> [!TIP]
> Questi limiti sono generosi per le app normali. Se raggiungi il budget di 2 s per chiamata, il lavoro è comunque troppo lungo per un singolo evento: bloccherebbe per tutto quel tempo gli aggiornamenti dell'app. Suddividilo con `setTimeout`, oppure spostalo fuori dal gestore dell'evento.

Le app host impostano i limiti per ogni view: `NshAppView.limits` su [iOS](./ios.md#limits), `NshView.setLimits` su [Android](./android.md#limits), `AppOptions::limits` / `AppView::set_limits` in una [app GPUI](./gpui.md#embedding-in-a-gpui-app). Si applicano a partire dal caricamento successivo.

Per vedere in sviluppo cosa fa un'app TSX entro i limiti di un'app host, eseguila con [`--limits`](./cli.md#nsh-run): `nsh run App.tsx --limits` usa i valori predefiniti indicati sopra, e `nsh run --limits memory=128MB,call=500ms` imposta questi due come farebbe un'app host, mentre gli altri mantengono i valori predefiniti.

## Hardening

Le build di release (tutto ciò che non viene caricato da un server di sviluppo) vengono rese più sicure (hardened) al momento del caricamento:

- `eval` viene rimosso, e i costruttori `Function`, `AsyncFunction`, `GeneratorFunction` e `AsyncGeneratorFunction` lanciano un'eccezione. NSH non esegue codice creato a partire da stringhe:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- I prototipi condivisi da tutti i moduli (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, i typed array e il resto) sono congelati, così un modulo (o una libreria) non può modificare `Array.prototype` per tutti gli altri. `Error.prototype` resta scrivibile, in modo che le sottoclassi di errore possano impostare `this.name`.

Congelare i prototipi romperebbe normalmente uno schema comune, il cosiddetto "override mistake": assegnare `Sub.prototype.constructor = Sub` o `obj.toString = …` lancia un'eccezione quando la proprietà ereditata è congelata. NSH trasforma i membri più comunemente sovrascritti (`constructor`, `toString`, `valueOf`, `toJSON`, ...) in accessor il cui setter definisce la proprietà sull'oggetto a cui si assegna, così tale codice (e librerie come axios che lo usano) continua a funzionare.

I bundle serviti da `nsh dev` / `nsh run` (con o senza `--release`) non sono sottoposti a hardening, quindi puoi fare il debug con `eval`. Prova il comportamento della release con `nsh test` (che applica l'hardening) o con una build pacchettizzata prima di distribuire codice che si basa sul codice dinamico.

## Capabilities

Un'app dichiara ciò che può raggiungere al di fuori della sua VM in `nsh.json`:

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**Un'app senza `"capabilities"` può fare tutto**: un'app autonoma appartiene al suo sviluppatore e nulla è limitato. I socket TCP raw sono concessi per nome in ogni app, tramite `network.sockets`, e le funzioni dell'host tramite `host`. **Un'app con `"capabilities"` può fare solo ciò che elenca**: tutto il resto è negato. Le chiavi sconosciute sono errori di build, così un refuso viene individuato durante la compilazione invece di diventare un permesso mancante a runtime. Un [pacchetto firmato](./signed-packages.md#packages-from-newer-versions-of-nsh) proveniente da una versione più recente di NSH può dichiarare capabilities che un runtime più vecchio non conosce: lì non vengono concesse.

### `network`

Copre `fetch` (inclusi tutti i redirect), i WebSocket, le immagini remote (`<Image>`, `placeholder`, immagini canvas, `Image.getSize` / `Image.prefetch`), le sorgenti video e i socket TCP raw (`net.connect`).

| Chiave | Tipo | Descrizione |
|---|---|---|
| `hosts` | `string[]` | Host che l'app può raggiungere con qualsiasi metodo e schema (`http`, `https`, `ws`, `wss`). |
| `http` | `object[]` | Concessioni più precise: un host, ristretto da una qualsiasi delle chiavi seguenti. |
| `http[].host` | `string` | L'host o il pattern di host (obbligatorio). |
| `http[].methods` | `string[]` | Metodi consentiti, ad esempio `["GET", "HEAD"]`. Se assente: qualsiasi. |
| `http[].schemes` | `string[]` | Schemi consentiti (`scheme`: uno solo, come stringa). Se assente: uno qualsiasi tra `http`, `https`, `ws`, `wss`. |
| `http[].port` | `number` | La porta; un URL che ne è privo usa quella predefinita del suo schema (443 per `https`). Se assente: qualsiasi. |
| `http[].paths` | `string[]` | Percorsi esatti, come `["/v1/quote"]` (la query non fa parte del percorso). |
| `http[].pathPrefixes` | `string[]` | Prefissi di percorso che coprono segmenti interi: `/v1` copre `/v1` e `/v1/quote`, `/v1/` ciò che lo segue. `pathPrefix` (uno solo, come stringa) e `path_prefixes` si leggono allo stesso modo. |
| `sockets` | `string[]` | Destinazioni TCP raw per [`net.connect`](../modules/standard-modules.md), ciascuna un `"host:port"` esatto (`"[::1]:9000"` per IPv6). |

Una regola `http` copre ogni percorso quando non elenca né `paths` né `pathPrefixes`, e, con entrambi, un percorso che corrisponda all'uno o all'altro.

I pattern di host sono `*` (qualsiasi host), `*.example.com` (qualsiasi sottodominio di `example.com`, non `example.com` stesso) oppure un nome host esatto. Il confronto ignora maiuscole e minuscole e la porta. L'host viene preso dopo l'ultimo `@`, quindi `https://api.example.com@evil.io/` viene controllato come `evil.io`.

Un handshake WebSocket è una GET HTTP: `ws://` viene controllato come `http://` e `wss://` come `https://`, quindi gli host e le concessioni `http` che consentono una GET dell'URL consentono il WebSocket. Un socket raw supera ogni regola HTTP, quindi `sockets` elenca ogni host e porta in modo esatto, e solo `sockets` li concede.

Gli URI `asset:` (i file dell'app stessa) sono sempre consentiti; immagini e video possono usare anche URI `data:` e percorsi relativi.

### `webview`

| Chiave | Tipo | Descrizione |
|---|---|---|
| `hosts` | `string[]` | Host che una [web view](./web-view-and-video.md) può mostrare e verso cui può navigare (`http` e `https`). Senza `webview`, l'app non può mostrare pagine web. |
| `input` | `boolean` | Il ref di una web view può fornire alla sua pagina input fidato ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). Mai concesso se non dichiarato, anche per un'app senza `"capabilities"`. |

Anche le navigazioni di primo livello all'interno della web view vengono controllate, dal navigation delegate della piattaforma, prima del caricamento. I sottorisorse della pagina stessa (i suoi script, immagini, XHR) sono affare del contenuto web e non vengono controllati. `about:blank` e l'HTML inline (`html`) richiedono solo che le web view siano concesse: `"webview": { "hosts": [] }` li consente senza consentire alcuna pagina remota.

`input` è separato da `hosts` perché l'input fidato porta con sé l'attivazione utente, che `injectJavaScript` non ottiene mai: la pagina può quindi aprire finestre, scrivere negli appunti, aprire il pannello dei file del sistema, avviare WebAuthn o richieste di permessi e premere qualsiasi pulsante che controlli `isTrusted`. Senza di esso il core scarta `sendInput` e registra nel log quale chiave aggiungere.

### `statusBar`

`"statusBar": true` consente all'app di modificare la status bar (il `statusBar` di pagine e dialog in [`nsh/base`](../modules/nsh-base.md#status-bar), e il valore predefinito `"statusBar"` di `nsh.json`).

### `clipboard`

`"clipboard": true` consente all'app di leggere e scrivere gli appunti di sistema ([`Clipboard`](../modules/nsh.md#clipboard)). Copiare dal menu di modifica di un testo selezionabile è un'azione dell'utente stesso e non richiede alcuna capability.

### `picker`

`"picker": true` consente all'app di mostrare il selettore di foto del sistema ([`Picker`](../modules/nsh.md#picker)): l'utente sceglie ciò che raggiunge l'app.

### `speech`

`"speech": true` consente all'app di riconoscere ciò che l'utente dice ([`Speech`](../modules/nsh.md#speech)): il microfono e il riconoscitore vocale di sistema, la cui trascrizione raggiunge l'app. Il sistema chiede comunque all'utente una volta.

### `openUrl`

Consente all'app di aprire URL all'esterno di essa ([`openUrl`](../modules/nsh.md#openurl), i link di un `TextView` con `links="open"`): `"openUrl": true` per ogni schema, `"openUrl": { "schemes": ["https", "mailto"] }` per gli schemi elencati. Un URL il cui schema non è concesso viene rifiutato con `ERR_ACCESS_DENIED` (`permission` `"openUrl"`, `resource` l'URL). Gli URL che eseguirebbero codice o raggiungerebbero i dati dell'app stessa (`javascript:`, `data:`, `file:`, ...) non vengono mai aperti, qualunque sia la capability.

### Storage

Ogni app può conservare i propri dati sul dispositivo con [`Storage`](../modules/nsh.md#storage), senza alcuna capability: lo storage contiene solo i dati di quell'app, e l'app che la incorpora decide dove vengono conservati.

### `host`

`host` elenca le funzioni dell'app che incorpora NSH che il `host.call(name, args)` di `nsh` può chiamare: nomi esatti (`"getUserInfo"`) o prefissi che terminano con `*` (`"bridge.*"` corrisponde a `bridge.call` e `bridge.share`). `"host": true` consente ogni funzione. Una funzione non elencata viene rifiutata, anche in un'app senza `"capabilities"`: le funzioni dell'host non sono mai concesse per impostazione predefinita, e compilare un'app che importa `host` da `nsh` senza `host` produce un avviso che ogni chiamata verrà rifiutata. I nomi hanno da 1 a 128 caratteri tra `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` e `-`, senza `..`; la chiamata di qualsiasi altro nome viene rifiutata prima che le concessioni vengano lette. Termina un prefisso con un separatore (`"bridge.*"`): `"bridge*"` corrisponde anche a `bridgeAdmin`. Gli eventi dell'host (`host.on(event, listener)`) raggiungono i listener dell'app così come l'host li invia.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` è true sulle piattaforme che incorporano un host; altrove `host.call` viene rifiutato con `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"`.
<a id="what-a-refusal-looks-like"></a>

### Come appare un rifiuto

| Richiesta | Risultato |
|---|---|
| `fetch` | La promise viene rifiutata con un `TypeError`, come ogni richiesta fallita, il cui `code` è `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` l'URL (quello della richiesta o del redirect); la richiesta non raggiunge mai la rete. |
| `Image.getSize`, `Image.prefetch` | La promise viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` l'URL; l'immagine non viene mai richiesta. |
| Immagine remota, sorgente video, sorgente web view o `html` | Non viene mostrato nulla, e `onError` dell'elemento lo segnala con `code` `"ERR_ACCESS_DENIED"`. La navigazione di una web view verso un host non autorizzato viene annullata e segnalata allo stesso modo. |
| Modifica della status bar, immagine canvas | Nulla cambia e nulla viene disegnato; il rifiuto viene registrato nel log. |
| Clipboard | Ogni funzione di `Clipboard` viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"clipboard"` e `resource` `""`; la clipboard di sistema non viene mai toccata. |
| Picker | `pickImages` non mostra nulla e viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"picker"` e `resource` `""`. |
| Speech | `Speech.start` genera `ERR_ACCESS_DENIED`, `permission` `"speech"` e `resource` `""`; il microfono resta spento. |
| `openUrl` | La promise viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"openUrl"` e `resource` l'URL; non si apre nulla. |
| Chiamata all'host | `host.call` viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"host"` e `resource` il nome della funzione (`host.post` lo genera); la chiamata non raggiunge mai l'host. |
| File (`fs/promises`) | La promise viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"fs"` e `resource` il percorso; il disco non viene mai toccato. |
| Processi (`process`) | `run` viene rifiutata, e `spawn` e `exit` generano, con `ERR_ACCESS_DENIED`, `permission` `"process"` e `resource` il comando (`"exit"` per `exit`); nessun processo figlio viene avviato. |
| Socket TCP (`net.connect`) | La promise viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` `"host:port"`, prima di qualsiasi risoluzione DNS. |
| WebSocket | La `connect` del modulo `websocket` viene rifiutata con `ERR_ACCESS_DENIED`, `permission` `"network"` e `resource` l'URL; il `WebSocket` globale emette `error` e poi `close` (codice 1006), come fa una connessione che fallisce. |

Gli errori dei [moduli standard](../modules/standard-modules.md#failures) riportano `code` `"ERR_ACCESS_DENIED"`, così un'app distingue un rifiuto da un'operazione fallita, e i loro `permission` e `resource` indicano la capability e ciò che è stato richiesto. I moduli di [`nsh`](../modules/nsh.md) rifiutano allo stesso modo: le loro promise vengono rifiutate con `ERR_ACCESS_DENIED`, `permission` e `resource` (`fetch` con un `TypeError`, la classe di ogni richiesta fallita).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

I componenti Rust ricevono gli stessi rifiuti nei termini di Rust: una lettura della clipboard rifiutata risponde come una clipboard vuota, una selezione rifiutata nessun file, un `open_url` `false` rifiutato e un `fetch` rifiutato un `Err` con il messaggio.

Ogni rifiuto viene registrato una sola volta, indicando quale chiave aggiungere:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

I redirect sono seguiti da NSH, non dallo stack HTTP della piattaforma, quindi ogni passaggio viene verificato rispetto alle capability. (Un corpo di richiesta in streaming non viene inviato due volte, quindi un redirect `307` / `308` di un upload in streaming fallisce.)

<a id="where-capabilities-travel"></a>

### Dove viaggiano le capability

La dichiarazione accompagna l'app ovunque vada:

- `nsh build` e `nsh package` la scrivono accanto al bundle come `capabilities.json`;
- `nsh publish` la inserisce nell'intestazione del [pacchetto firmato](./signed-packages.md), coperta dalla firma;
- `nsh dev` la invia a ogni build, così lo sviluppo applica le stesse regole. Modificare `capabilities` ricarica l'app
  invece di applicare un hot-patch.

<a id="grants-what-a-host-app-allows"></a>

## Concessioni: cosa consente un'app host

Un'app host che incorpora NSH può concedere **al massimo** alcune capability, nella stessa forma JSON:

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

Una richiesta deve essere consentita **sia** dalla dichiarazione dell'app **sia** dalla concessione dell'host. Con la concessione qui sopra, un'app che dichiara `"hosts": ["*"]` può comunque raggiungere solo `api.example.com`, e non può mostrare pagine web né modificare la status bar.
Senza concessione (`nil` / `null`, il default), vale ciò che ogni app dichiara.

Le concessioni si applicano dal caricamento successivo. Una configurazione tipica per mini app di terze parti: concedere a ciascuna solo il proprio host API, eseguirla da un [pacchetto firmato](./signed-packages.md) la cui dichiarazione hai verificato, e mantenere i limiti predefiniti o abbassarli.

> [!WARNING]
> I [componenti nativi](./native-components.md) registrati dall'app host sono codice dell'host stesso: le capability non si applicano a essi. Registra solo componenti sicuri per ogni app che la view può eseguire.

<a id="summary"></a>

## Riepilogo

| Livello | Applicato da | Impostato da |
|---|---|---|
| Limiti (heap, stack, tempo, nodi) | il runtime, per VM | l'app host per view (app incorporate) |
| Hardening | il runtime, al caricamento | sempre attivo fuori dallo sviluppo |
| Capability | il runtime (fetch, immagini, video, web view, status bar, file, processi, socket) | l'app (`nsh.json`) e l'app host (concessione) |
| Integrità del codice | verifica della firma | `nsh publish`; le root attendibili dell'app host |

<a id="see-also"></a>

## Vedi anche

- [Pacchetti firmati](./signed-packages.md)
- [Networking](./networking.md)
- [Incorporare in app iOS](./ios.md), [Incorporare in app Android](./android.md)
