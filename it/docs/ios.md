---
title: "iOS"
description: "Esegui app NSH in Rust e TSX su iOS con viste UIKit, nel simulatore o su dispositivi, impacchettale come .app e .ipa e incorporale in un'app iOS esistente con AppView o con NshAppView di NativeShell.xcframework."
order: 11
group: platforms
source_hash: d33e715d25f83ce4
---

# iOS

Le app NSH girano su iOS con view UIKit e testo CoreText, su dispositivi e nel simulatore, da iOS 15.0. Le app complete vengono eseguite e impacchettate come sulle altre piattaforme, e un'app esistente può mostrare app NSH nelle proprie view, sia con una radice Rust che collega sia con TSX che carica, inclusi i pacchetti firmati che scarica, entro limiti e capability che stabilisce. Su iOS, `os()` è `Os::Ios` (`platform.os` è `"ios"` in TSX) e si applicano le prop `ios={{…}}` di TSX.

<a id="requirements"></a>

## Requisiti

- **Xcode** su un Mac, con un runtime del simulatore iOS (`xcodebuild -downloadPlatform iOS` ne installa uno). Vedi
  [Installazione](./installation.md#ios-and-mac-catalyst).
- Le app richiedono **iOS 15.0** o successivo, su iPhone e iPad.

<a id="running-an-app"></a>

## Eseguire un'app

Un'app Rust si esegue dalla propria directory, un'app TSX indica il proprio entry:

```sh
nsh run --target ios                                  # a Rust app
nsh run --target ios --device "iPhone 16 Pro"
nsh run App.tsx --target ios                          # a TSX app
```

`nsh` usa un simulatore già avviato, oppure avvia l'iPhone più recente. Per un'app Rust compila il runner dell'app con il tuo crate, lo installa e mostra i log nel terminale; una modifica al codice Rust del crate lo compila di nuovo e riavvia l'app. Per un'app TSX installa l'host di sviluppo e mantiene l'app aggiornata a ogni salvataggio, con i log nel terminale. `--device` sceglie un simulatore per nome o UDID. Per un ciclo più rapido senza simulatore, `nsh run --target catalyst` su un Mac apre lo stesso backend UIKit in una finestra [Mac Catalyst](./getting-started.md#mac-catalyst) delle dimensioni di un iPhone.

## Packaging

```sh
nsh package --target ios-simulator --run      # .nsh/out/<Name>.app, installed and launched in the simulator
nsh package --target ios --sign "Apple Distribution: Example Inc (ABCDE12345)" --profile AppStore.mobileprovision
```

Dalla directory di un'app Rust, l'app è il runner iOS compilato con il tuo crate; un'app TSX indica il proprio entry (`nsh package App.tsx --target ios-simulator --run`).

`--target ios` scrive un `.ipa` firmato per dispositivi, TestFlight o App Store. Identità di firma, provisioning profile e icone: [Packaging](./packaging.md#ios-devices).

<a id="embedding-in-an-ios-app"></a>

## Integrazione in un'app iOS

Un'app iOS esistente può mostrare app NSH all'interno della propria UI. Un'app iOS con codice Rust collega il tuo crate e il crate `nsh-platform-ios` e mostra la tua radice in un `AppView` ([Integrare un'app Rust](#embedding-a-rust-app)). Un'app Swift collega `NativeShell.xcframework`, un framework con un modulo Swift: crei un `NshAppView` (un `UIView`), lo aggiungi in qualsiasi punto della gerarchia di view e vi carichi un'app TSX o un pacchetto firmato. Le tue schermate native, la navigazione e l'app NSH convivono in un'unica gerarchia UIKit.

Ogni view è un engine indipendente; non ci sono singleton globali, quindi un'app può mostrare più app NSH contemporaneamente, per esempio una per ogni tab.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two NshAppView regions: each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="embedding-a-rust-app"></a>

## Integrare un'app Rust

`nsh_platform_ios::AppView` è un engine come `UIView` per un'app iOS scritta in Rust: monta il componente radice del tuo crate, senza alcuna VM JavaScript coinvolta.

```rust
use nsh_platform_ios::{set_ui_sets, AppView, Root, SurfaceOptions};
use objc2::MainThreadMarker;
use objc2_ui_kit::UIView;

fn show(container: &UIView) -> AppView {
    // Once, before the first view: the UI sets the apps import (NSH's and your crate's).
    set_ui_sets(vec![nsh_base::registry(), my_app::registry()]);
    let mtm = MainThreadMarker::new().expect("main thread");
    let app = AppView::new(mtm, container.bounds(), SurfaceOptions::default());
    container.addSubview(app.view());
    app.run(Root::of::<my_app::App>());
    // Keep the AppView: dropping it stops the app.
    app
}
```

La view si ridimensiona insieme alla sua superview. `AppView::run` sostituisce ciò che era in esecuzione; `AppView::load` esegue invece un bundle TSX (`Bundle::source`, oppure `unsafe { Bundle::bytecode(bytes) }` per un `bundle.nshc` nel bundle dell'app). `SurfaceOptions` contiene i limiti, le capability concesse, la directory dei dati e i componenti nativi, come i membri di `NshAppView` più sotto; `AppView::set_locale`, `set_font_scale` e `set_error_handler` corrispondono a `locale`, `fontScale` e `onError`. `nsh package --target ios` compila per te questo tipo di app, con la tua radice montata.

<a id="get-the-framework"></a>

## Ottenere il framework

La distribuzione contiene entrambe le varianti:

```text
dist/nsh/embed/ios/NativeShell.xcframework      release: bundles and signed packages
dist/nsh/embed/ios/NativeShellDev.xcframework   also connects to a `nsh dev` server
```

Da un checkout di NSH puoi compilare solo i framework:

```sh
cargo xtask ios-embed    # writes dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework
```

La build predefinita produce framework statici. Per compilare framework dinamici, usa:

```sh
cargo xtask ios-embed --dynamic
```

I framework dinamici danno al runtime una propria immagine di libreria e una propria unwind table, supportando le app host che collegano già altri runtime Rust. Scegli l'impostazione di embedding di Xcode indicata sotto in base al framework che compili.

Per impostazione predefinita, ogni XCFramework ha tre slice arm64: dispositivi iOS, simulatore iOS (Apple silicon) e Mac Catalyst. Il deployment target minimo è iOS 15.0. Il modulo Swift è compilato con library evolution, quindi le app compilate con altre versioni del compilatore Swift possono importarlo, e il framework collega tutto ciò di cui ha bisogno: non devi aggiungere altro.

<a id="add-it-to-an-xcode-project"></a>

## Aggiungerlo a un progetto Xcode

1. Trascina `NativeShell.xcframework` (o `NativeShellDev.xcframework` per le build di sviluppo) in **Frameworks, Libraries, and Embedded Content** del target dell'app. Scegli **Do Not Embed** per i framework statici predefiniti, oppure **Embed & Sign** per i framework dinamici compilati con `--dynamic`.
2. In Swift, `import NativeShell`.
3. Nel `Info.plist` dell'app, imposta `CADisableMinimumFrameDurationOnPhone` su `YES`: sugli iPhone ProMotion le animazioni dell'app si muovono quindi a 120 Hz, come lo scorrimento (le app compilate da `nsh package` lo hanno).

> [!TIP]
> Collega `NativeShellDev.xcframework` nella configurazione Debug e `NativeShell.xcframework` in Release, così che solo le build di sviluppo possano connettersi a un dev server.

<a id="ship-a-bundle-with-the-app"></a>

## Includere un bundle nell'app

Un'app Swift distribuisce le app TSX come bundle. Compila l'app NSH in una cartella e aggiungi quella cartella alle risorse dell'app come folder reference chiamata `nsh`:

```sh
nsh build App.tsx --release --out MyApp/nsh
```

`nsh build` scrive:

| File | Contenuto |
|---|---|
| `bundle.nshc` | L'app compilata in bytecode: il caricamento più rapido. |
| `bundle.js` | La stessa app come sorgente JS. |
| `bundle.js.map` | La sua source map (gli stack trace puntano ai tuoi file `.tsx`). |
| `capabilities.json` | Le [capability](./sandbox-and-capabilities.md) dichiarate dall'app, quando `nsh.json` ne ha. |
| `assets/` | Immagini e font importati dall'app, nei loro percorsi relativi all'entry. |

<a id="show-the-app"></a>

## Mostrare l'app

```swift
import NativeShell
import UIKit

final class EmbedController: UIViewController {
    private let app = NshAppView()

    override func viewDidLoad() {
        super.viewDidLoad()
        app.translatesAutoresizingMaskIntoConstraints = false
        app.onError = { message in print("nsh error: \(message)") }
        view.addSubview(app)
        NSLayoutConstraint.activate([
            app.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            app.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            app.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            app.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        guard let url = Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh") else { return }
        do {
            try app.loadBundle(at: url)
        } catch {
            print("cannot load: \(error)")
        }
    }

    // Let the embedded app's pages and dialogs decide the status bar.
    override var preferredStatusBarStyle: UIStatusBarStyle { NshAppView.preferredStatusBarStyle }
    override var prefersStatusBarHidden: Bool { NshAppView.prefersStatusBarHidden }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
        NshAppView.preferredStatusBarUpdateAnimation
    }
}
```

La dimensione della view è la finestra dell'app: NSH dispone l'app nei limiti della view e di nuovo ogni volta che cambiano. Caricare di nuovo sostituisce l'app in esecuzione; l'app si ferma quando la view viene deallocata.

L'esempio completo, un'app UIKit che mostra un'app NSH sotto il proprio header nativo, è `examples/embed-ios/main.swift`.

## `NshAppView`

`NshAppView` è una sottoclasse di `UIView` isolata sul main actor.

| Membro | Descrizione |
|---|---|
| `init(frame: CGRect = .zero, trace: Bool = false)` | Crea la view. `trace` registra nei log il tempo di ogni commit. `init?(coder:)` supporta storyboard e nib. |
| `onError: ((String) -> Void)?` | Riceve gli errori fatali dell'app (un bundle che non si carica, eccezioni JS non gestite, una VM fermata da un limite) sul main thread. Gli errori vengono sempre registrati nei log; le build di sviluppo li mostrano anche sopra l'app. |
| `limits: NshLimits` | I limiti della VM delle app caricate da ora in poi. |
| `grantCapabilities(_ json: String?) throws` | Il massimo che le app caricate da ora in poi possono fare, come JSON nella forma di `capabilities` di `nsh.json`; `nil` concede ciò che ogni app dichiara. Genera `NshError` per JSON non valido. |
| `locale: Locale?` | La lingua e la regione dell'app al posto di quelle dell'utente: `Intl`, `locale()` e i componenti le seguono subito, e le app caricate dopo partono con esse. `nil` segue quelle del sistema. |
| `fontScale: CGFloat?` | La dimensione del testo al posto di quella di Dynamic Type (1 è il valore predefinito): testi e input vengono disposti di nuovo con essa e `fontScale()` la legge, subito e per le app caricate dopo; le lunghezze mantengono la propria dimensione. `nil` segue quella del sistema. |
| `setThemeOverrides(_ json: String?) throws` | Il brand dell'host sopra il [tema](./tailwind.md#theme-tokens) dell'app: un file di tema nel formato di `"theme"` di `nsh.json`. I suoi token prevalgono su quelli dell'app con gli stessi nomi, in modalità chiara e scura, mentre gli altri token dell'app restano. Si applica subito e alle app caricate dopo; `nil` restituisce all'app il proprio tema. Genera `NshError` per un file che non viene analizzato. |
| `storageDirectory: URL?` | Dove le app caricate da ora in poi conservano il proprio [storage](../modules/nsh.md#storage); `nil`: `Library/Application Support/nsh/<app id>`, in base all'id proprio dell'app. |
| `cacheOptions: NshCacheOptions` | Dove le app caricate da ora in poi conservano le proprie cache, le [immagini che scaricano](./images-and-assets.md#kept-on-disk), e quanto ne conserva ciascuna: `location` `.system` (`Library/Caches/nsh`, ogni app in `<app id>`), `.directory(URL)` o `.off`; `images` `.default` (256 MB), `.maxSize(megabytes:)` o `.off`. |
| `loadBundle(at url: URL) throws` | Esegue un bundle scritto da `nsh build`. Gli asset provengono da `assets/` accanto ad esso; vengono letti anche `bundle.js.map` e `capabilities.json` accanto ad esso. |
| `run(_ package: NshPackage)` | Esegue un pacchetto firmato verificato (vedi sotto). Un pacchetto viene eseguito una sola volta. |
| `loadPackage(at:trust:) async throws -> NshPackage.Info` | Verifica il pacchetto a un URL fuori dal main thread, poi lo esegue. Genera un errore che ne spiega il rifiuto; l'app in esecuzione resta. |
| `connectDevServer(_ url: URL) throws` | Sviluppo: carica da un server `nsh dev` e ricarica a ogni modifica. Genera un errore con `NativeShell.xcframework`, che non ha supporto per lo sviluppo. |
| `register(component:_:)` | Registra un [componente nativo](./native-components.md). |
| `params: [String: Any]` | I parametri di avvio delle app caricate da ora in poi: l'app li legge all'avvio come `host.params` ([`host`](../modules/nsh.md#host)). |
| `send(_ name: String, _ data: Any? = nil)` | Invia un evento all'app (`host.on(name, …)`); conservato finché l'app non lo ascolta, o per l'app successiva se non ne è in esecuzione nessuna. |
| `handle(_ name: String, _ handler:)` | Gestisce le chiamate (`host.call`) e i post (`host.post`) dell'app di `name` sul main thread: `{ data, reply in … }`, oppure una funzione `async throws` `{ data in … }` il cui risultato risponde alla chiamata. |
| `removeHandler(_ name: String)` | Rimuove il gestore di `name`: le chiamate dell'app a esso falliscono subito. |
| `static preferredStatusBarStyle`, `prefersStatusBarHidden`, `preferredStatusBarUpdateAnimation` | Ciò che le app in esecuzione hanno richiesto (`statusBar` delle loro pagine e dialog, il valore predefinito di `nsh.json`): restituiscili dagli override del view controller ospitante. |

> [!IMPORTANT]
> `bundle.nshc` (bytecode) si carica solo dall'interno del bundle dell'app. QuickJS non convalida il bytecode, quindi il bytecode proveniente da qualsiasi altro luogo potrebbe corrompere la memoria: per un file esterno al bundle dell'app, carica `bundle.js` (sorgente JS), o meglio ancora un [pacchetto firmato](./signed-packages.md).

`limits`, `grantCapabilities`, `storageDirectory` e `cacheOptions` si applicano dal caricamento successivo: impostali prima di `loadBundle` / `run`.

Ogni app conserva il proprio storage sotto il proprio id senza alcuna impostazione: un pacchetto firmato sotto l'id garantito dal certificato della sua release key, un bundle sotto il `id` del suo `nsh.json` (`app.json` accanto ad esso, scritto da `nsh build`). Imposta `storageDirectory` per conservare i dati di un'app in un luogo scelto dall'host:

```swift
app.storageDirectory = FileManager.default
    .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("nsh/com.example.orders")
try app.loadBundle(at: url)
```

<a id="talking-to-the-app"></a>

## Comunicare con l'app

La view e l'app che esegue comunicano attraverso un canale dedicato ([`host`](../modules/nsh.md#host)): parametri di avvio che l'app legge all'inizio, eventi dall'app host, e chiamate e post dall'app, con dati JSON (oggetti Foundation da questo lato). Non richiede alcuna view nell'app né alcun componente nativo.

```swift
// Before loading: what the app opens first (`host.params` in TSX).
app.params = ["conversation": notification.conversationID]
try app.loadBundle(at: url)

// The app's `await host.call("user.profile", { id })`: return the answer, or throw to reject it.
app.handle("user.profile") { data in
    let id = (data as? [String: Any])?["id"] as? Int ?? 0
    let profile = try await api.profile(id: id)
    return ["id": id, "name": profile.name]
}

// A handler that answers later, from any thread, with its reply.
app.handle("photo.pick") { _, reply in
    picker.present { url in
        if let url { reply.resolve(url.absoluteString) } else { reply.reject("cancelled") }
    }
}

// The app's `host.post("analytics", …)`: no answer.
app.handle("analytics") { data, _ in analytics.log(data) }

// Later: the app hears `host.on("conversation.open", …)`.
app.send("conversation.open", ["id": tapped.conversationID])
```

I gestori vengono eseguiti sul main thread; una chiamata attende la propria risposta nell'app senza bloccare nessuno dei due lati. Una risposta rilasciata senza risposta fa fallire la chiamata, e la chiamata di un nome senza gestore fallisce subito. Gli eventi con nomi che l'app non ascolta ancora vengono conservati finché non li ascolta, e gli eventi inviati mentre nessuna app è in esecuzione (prima di `loadBundle`, durante un reload) vanno all'app successiva, così una notifica toccata mentre l'app si avvia la raggiunge comunque.

<a id="theme-overrides"></a>

## Override del tema

Un'app integrata in più app host con brand diversi assume il brand di ciascun host: l'host fornisce i token che il suo brand cambia, come file di tema nel formato di `"theme"` di `nsh.json` (`cssVars` di shadcn/ui, con valori scritti come in CSS). Prevalgono sui token dell'app con gli stessi nomi; gli altri token dell'app restano. Assegna a un token il suo valore per la modalità scura sotto `dark` (un solo valore sotto `light` o `theme` indica quel colore in entrambe le modalità):

```swift
try app.setThemeOverrides("""
{ "cssVars": {
    "theme": { "radius": "0.75rem" },
    "light": { "primary": "#e11d48", "primary-foreground": "#ffffff" },
    "dark": { "primary": "#fb7185", "primary-foreground": "#1c1917" }
} }
""")
try app.loadBundle(at: url)
```

Chiamalo prima o dopo il caricamento: classi come `bg-primary` e `rounded-(--radius)` cambiano stile subito, e ogni app caricata dopo parte con gli override già nel primo frame. `setThemeOverrides(nil)` restituisce all'app il proprio tema.

<a id="links-the-app-opens"></a>

## Link aperti dall'app

Gli URL aperti dall'app ([`openUrl`](../modules/nsh.md#openurl), i link di un `TextView` con `links="open"`) raggiungono prima `onOpenURL`, sul main thread: restituisci `true` quando l'app host ha gestito l'URL, per esempio instradandolo attraverso il proprio router, e `false` perché il sistema lo apra con `UIApplication.open`. Senza `onOpenURL` il sistema apre ogni URL. Gli URL lo raggiungono dopo che la capability `openUrl` dell'app li ha consentiti.

```swift
app.onOpenURL = { url in
    // The host app's own links open in the host app.
    if url.scheme == "lb" || url.host == "longbridge.com" {
        router.open(url)
        return true
    }
    return false
}
```

<a id="limits"></a>

## Limiti

```swift
app.limits = NshLimits(memoryMB: 128, callBudget: 1, maxNodes: 50_000)
```

| Campo di `NshLimits` | Predefinito | Significato |
|---|---|---|
| `memoryMB: UInt32?` | 256 | Heap JS in MB. Esaurirlo ferma l'app. |
| `stackKB: UInt32?` | 4096 (anche il massimo) | Stack dell'interprete in KB. Una ricorsione più profonda genera un `RangeError`. |
| `loadBudget: TimeInterval?` | 10 s | Tempo per valutare il bundle. |
| `callBudget: TimeInterval?` | 2 s | Tempo di qualsiasi altra chiamata in JS (un evento, un timer, un frame). Una chiamata che supera il tempo viene interrotta. |
| `maxNodes: UInt32?` | 200 000 | Nodi che l'app può mantenere. |

`nil` mantiene il valore predefinito. Cosa fa ciascun limite quando viene raggiunto: [Sandbox e capability](./sandbox-and-capabilities.md).

<a id="capabilities"></a>

## Capability

Un'app dichiara ciò a cui può accedere nel proprio `nsh.json`; l'app che la integra può concederne meno. Una richiesta deve essere consentita da entrambi:

```swift
try app.grantCapabilities("""
{
  "network": { "hosts": ["api.example.com", "*.cdn.example.com"] },
  "webview": { "hosts": ["help.example.com"] }
}
""")
try app.loadBundle(at: url)
```

Qui l'app non può impostare la status bar (nessun `statusBar`), anche se il suo `nsh.json` lo richiede. Dettagli: [Sandbox e capability](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Pacchetti firmati

Per eseguire codice che l'app scarica (aggiornamenti, mini app di terze parti), usa i [pacchetti firmati](./signed-packages.md): `nsh publish` scrive un `.nshpkg` firmato da una release key certificata dalla tua root key, e l'app lo verifica prima di eseguirlo.

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of root.pub from `nsh keygen`

Task {
    do {
        let info = try await app.loadPackage(at: downloadedFile, trust: trust)
        print("running \(info.id) \(info.version) (build \(info.build))")
    } catch {
        print("refused: \(error)")   // the running app stays
    }
}
```

Per verificare prima ed eseguire dopo, separa i due passaggi:

```swift
let package = try await trust.openPackage(at: downloadedFile)   // verifies off the main thread
// ... decide, ask the user, ...
app.run(package)
```

| API | Descrizione |
|---|---|
| `NshTrust(stateDirectory: URL) throws` | Apre o crea il trust store. Il suo stato (l'elenco di revoche più recente, la build più alta accettata per ogni app) persiste lì, e gli asset dei pacchetti vengono estratti al suo interno. Non si fida di alcuna chiave finché non si usa `addRoot`. Thread-safe. |
| `addRoot(_ publicKey: String) throws` | Considera attendibile una root public key (base64, il contenuto di un file `.pub`). Possono essere considerate attendibili più root. |
| `updateRevocations(_ json: String) throws` | Applica un elenco di revoche scritto da `nsh revoke`, firmato da una root attendibile e più recente di quello che lo store possiede. |
| `openPackage(at: URL) async throws -> NshPackage` | Verifica, estrae gli asset e accetta il pacchetto (le build più vecchie di quell'app vengono rifiutate da quel momento). |
| `NshPackage.info` | `id`, `name`, `version`, `build` dell'app al suo interno. |
| `NshError` | L'errore generato da ogni chiamata che può generare errori; `message` ne spiega il motivo. |
<a id="development"></a>

## Sviluppo

Con `NativeShellDev.xcframework`, punta la view a un dev server invece che a un bundle:

```swift
#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)
#else
try app.loadBundle(at: bundledURL)
#endif
```

Esegui `nsh dev App.tsx` sul tuo Mac. Il simulatore condivide la rete del Mac, quindi `127.0.0.1` raggiunge il server; un
dispositivo usa l'indirizzo LAN che `nsh dev` stampa (`devices on this network: ws://192.168.1.20:8790/ws`). Ogni salvataggio
aggiorna l'app sul posto, i log compaiono nel terminale `nsh dev` e gli errori vengono mostrati sopra l'app. Vedi
[Dev server e debugging](./dev-server-and-debugging.md).

> [!NOTE]
> Su un dispositivo, la connessione al tuo Mac è normale traffico di rete locale su `ws://` semplice e `http://` (asset).
> iOS può chiedere all'utente l'accesso alla rete locale, e le impostazioni di App Transport Security dell'app devono consentirlo.

<a id="notes"></a>

## Note

- **Thread.** `NshAppView` è isolato sul main actor. `NshTrust`, `NshPackage` e `NshComponentContext` sono thread-safe.
  Il motore JS viene eseguito sul proprio thread; il thread principale non lo attende mai.
- **Barra di stato.** Le pagine e i dialoghi dell'app incorporata (`statusBar`) modificano ciò che `NshAppView.preferredStatusBarStyle` e i metodi affini restituiscono;
  il view controller che ospita l'app deve inoltrarli, come nell'esempio sopra.
- **Safe area.** Le app usano `safe_area()` in Rust, e `env(safe-area-inset-*)` nel padding o
  `safeAreaInsets()` da [`nsh`](../modules/nsh.md#safe-area-and-keyboard) in TSX, come di consueto. Un `NshAppView` posizionato sotto il tuo header riceve gli inset che si applicano a lui, non quelli della finestra.
- **Mac Catalyst.** Lo stesso framework funziona nelle app Catalyst.

<a id="see-also"></a>

## Vedi anche

- [Building with Rust](./rust.md)
- [Embedding in Android apps](./android.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Sandbox and capabilities](./sandbox-and-capabilities.md)
