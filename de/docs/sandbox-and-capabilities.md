---
title: "Sandbox und Capabilities"
description: "Die Grenzen, unter denen jede NSH-App läuft (Speicher, Zeit, Nodes), die Sprachhärtung von Release-Builds sowie Capabilities, die in nsh.json deklariert und von Host-Apps gewährt werden."
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---


# Sandbox und Capabilities

Eine in Rust geschriebene App ist nativer Code, der wie der Rest der App in die ausgelieferte App einkompiliert wird und mit deren Vertrauen läuft. Ihre Aufrufe in die Services von NSH (`fetch`, Bilder, Web Views, die Statusleiste) durchlaufen dieselben nativen Prüfungen wie die von TSX, im Rahmen dessen, was ein Host gewährt. Das TSX und JavaScript, das eine App ausführt, ob eigenes oder aus einem [signierten Paket](./signed-packages.md), das sie herunterlädt, läuft in einer QuickJS-VM pro View, und alles, was davon außerhalb dieser VM geschehen kann, läuft über die native Runtime von NSH. Dadurch lässt sich Code ausführen, den man nicht selbst geschrieben hat, etwa Mini-Apps von Drittanbietern oder heruntergeladene Updates, und zwar unter Regeln, die die Host-App kontrolliert:

- **Limits** begrenzen den Speicher, die Zeit und die nativen Ressourcen, die eine App nutzen darf.
- **Hardening** entfernt in Release-Builds die Möglichkeiten, Strings in Code umzuwandeln.
- **Capabilities** legen fest, was eine App erreichen darf: von welchen Hosts sie laden darf, welche Seiten eine Web View anzeigen darf und ob sie die Statusleiste ändern darf. Die App deklariert sie; eine Host-App darf weniger gewähren.

Ein Bundle enthält nur den Code der App: Der reaktive Graph, der Renderer und jedes Modul, das die App importiert, sind nativ. Deshalb wird nichts in JS als vertrauenswürdig behandelt, und jedes Limit und jede Prüfung wird in Rust durchgesetzt. Es gibt keinen JS-Code, den eine App patchen könnte, um sie zu umgehen.

## Limits

Limits begrenzen eine VM: Sie gelten für TSX und JavaScript. Eine App, die in eine andere App eingebettet ist, läuft innerhalb von Limits, die ihre Host-App festlegt. Eine eigenständige App (verpackt mit `nsh package`, einschließlich Web, oder gestartet mit `nsh run`) ist Ihr eigener Code, genau wie eine native App: Sie nutzt den Speicher und die Zeit, die das Gerät ihr gibt, und ihr Interpreter-Stack von 4096 KB macht aus tiefer Rekursion einen `RangeError`, den die App abfangen kann.

Eine eingebettete App hat diese Limits:

| Limit | Standard | Bei Erreichen |
|---|---|---|
| JS-Heap | 256 MB | Die VM wird angehalten. |
| Interpreter-Stack | 4096 KB (zugleich das Maximum) | Tiefe Rekursion löst einen `RangeError` aus, den die App abfangen kann. |
| Zeit zum Auswerten des Bundles | 10 s | Die Auswertung wird abgebrochen. |
| Zeit jedes weiteren Aufrufs in JS | 2 s | Der Aufruf wird abgebrochen; die App läuft weiter. |
| Gehaltene Nodes | 200 000 | Die VM wird angehalten. |
| Gleichzeitige Änderungen (eingereihte Operationen) | 8 000 000 Werte | Die VM wird angehalten. |
| Operationen in einer Canvas-Zeichnung | 1 000 000 | Die VM wird angehalten. |

**Die Zeit wird pro Aufruf budgetiert, nicht pro App.** Ein „Aufruf“ ist eine Sache, die die Runtime von JS verlangt: ein Event behandeln (einschließlich des dadurch ausgelösten Renderings), eine Listenzeile binden, einen Timer ausführen, die `requestAnimationFrame`-Callbacks eines Frames ausführen, die Microtask-Queue leeren. Eine lang laufende App sammelt nie Zeit in Richtung eines Limits an; nur ein einzelner Aufruf, der nicht rechtzeitig zurückkehrt, wird unterbrochen. Aufrufe, die in einem anderen verschachtelt sind, teilen sich das Budget des äußeren Aufrufs.

Ein unterbrochener Aufruf endet mit einer Exception, die kein `catch` verschlucken kann, und der Fehler wird mit dem überschrittenen Budget gemeldet:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

Die VM läuft weiter: Das nächste Event, der nächste Timer oder der nächste Frame läuft normal.

**Wenn der Speicher ausgeht oder ein Kontingent überschritten wird, wird die VM angehalten.** Der Fehler wird einmal gemeldet (an den Error-Handler der Host-App und in Entwicklungs-Builds über der App), danach läuft kein JS mehr, und die Views bleiben, wie sie waren. Die Kontingente für Nodes und Operationen gibt es, weil native Views und eingereihte Änderungen im nativen Speicher liegen, den das Limit des JS-Heaps nicht abdeckt: Ohne sie könnte eine App über die UI den Speicher des Geräts erschöpfen.

> [!TIP]
> Diese Limits sind für normale Apps großzügig. Wenn Sie das Aufrufbudget von 2 s erreichen, ist die Arbeit ohnehin zu lang für ein einzelnes Event: Sie würde die Aktualisierungen der App so lange einfrieren. Teilen Sie sie mit `setTimeout` auf oder verlagern Sie sie aus dem Event-Handler.

Host-Apps legen die Limits pro View fest: `NshAppView.limits` unter [iOS](./ios.md#limits), `NshView.setLimits` unter [Android](./android.md#limits), `AppOptions::limits` / `AppView::set_limits` in einer [GPUI-App](./gpui.md#embedding-in-a-gpui-app). Sie gelten ab dem nächsten Laden.

Um in der Entwicklung zu sehen, was eine TSX-App innerhalb der Limits einer Host-App tut, führen Sie sie mit [`--limits`](./cli.md#nsh-run) aus: `nsh run App.tsx --limits` verwendet die obigen Standardwerte, und `nsh run --limits memory=128MB,call=500ms` setzt diese beiden so, wie es eine Host-App täte; die übrigen behalten ihre Standardwerte.

## Hardening

Release-Builds (alles, was nicht von einem Dev-Server geladen wird) werden beim Laden gehärtet:

- `eval` wird entfernt, und die Konstruktoren `Function`, `AsyncFunction`, `GeneratorFunction` und `AsyncGeneratorFunction` lösen Exceptions aus. NSH führt keinen Code aus, der aus Strings erzeugt wurde:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- Die Prototypen, die alle Module gemeinsam nutzen (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, Typed Arrays und die übrigen), werden eingefroren, sodass ein Modul (oder eine Bibliothek) `Array.prototype` nicht für alle anderen verändern kann. `Error.prototype` bleibt beschreibbar, damit Error-Subklassen `this.name` setzen können.

Das Einfrieren von Prototypen würde normalerweise ein verbreitetes Muster brechen, den „Override Mistake“: Das Zuweisen von `Sub.prototype.constructor = Sub` oder `obj.toString = …` löst eine Exception aus, wenn die geerbte Property eingefroren ist. NSH wandelt die häufig überschriebenen Member (`constructor`, `toString`, `valueOf`, `toJSON`, ...) in Accessors um, deren Setter die Property auf dem Objekt definiert, dem zugewiesen wird. So funktioniert solcher Code (und Bibliotheken wie axios, die ihn nutzen) weiterhin.

Bundles, die von `nsh dev` / `nsh run` (mit oder ohne `--release`) ausgeliefert werden, werden nicht gehärtet, sodass Sie mit `eval` debuggen können. Testen Sie das Release-Verhalten mit `nsh test` (das härtet) oder einem verpackten Build, bevor Sie Code ausliefern, der sich auf dynamischen Code stützt.

## Capabilities

Eine App deklariert in `nsh.json`, was sie außerhalb ihrer VM erreichen darf:

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

**Eine App ohne `"capabilities"` darf alles**: Eine eigenständige App gehört ihrem Entwickler, und nichts ist eingeschränkt. Raw-TCP-Sockets werden in jeder App namentlich über `network.sockets` gewährt, und die Funktionen des Hosts über `host`. **Eine App mit `"capabilities"` darf nur, was sie auflistet**: Alles andere wird verweigert. Unbekannte Schlüssel sind Build-Fehler, sodass ein Tippfehler beim Build auffällt, statt zur Laufzeit zu einer fehlenden Berechtigung zu werden. Ein [signiertes Paket](./signed-packages.md#packages-from-newer-versions-of-nsh) aus einer neueren NSH-Version kann Capabilities deklarieren, die eine ältere Runtime nicht kennt: Sie werden dort nicht gewährt.

### `network`

Umfasst `fetch` (einschließlich jedes Redirects), WebSockets, entfernte Bilder (`<Image>`, `placeholder`, Canvas-Bilder, `Image.getSize` / `Image.prefetch`), Videoquellen und Raw-TCP-Sockets (`net.connect`).

| Schlüssel | Typ | Beschreibung |
|---|---|---|
| `hosts` | `string[]` | Hosts, die die App mit jeder Methode und jedem Schema erreichen darf (`http`, `https`, `ws`, `wss`). |
| `http` | `object[]` | Feinere Freigaben: ein Host, eingegrenzt durch beliebige der folgenden Schlüssel. |
| `http[].host` | `string` | Der Host oder das Host-Muster (erforderlich). |
| `http[].methods` | `string[]` | Erlaubte Methoden, etwa `["GET", "HEAD"]`. Fehlt: beliebig. |
| `http[].schemes` | `string[]` | Erlaubte Schemas (`scheme`: eines, als String). Fehlt: eines von `http`, `https`, `ws`, `wss`. |
| `http[].port` | `number` | Der Port; bei einer URL ohne Port gilt der Standard ihres Schemas (443 für `https`). Fehlt: beliebig. |
| `http[].paths` | `string[]` | Exakte Pfade, etwa `["/v1/quote"]` (die Query ist nicht Teil des Pfads). |
| `http[].pathPrefixes` | `string[]` | Pfadpräfixe, die ganze Segmente abdecken: `/v1` deckt `/v1` und `/v1/quote` ab, `/v1/` das, was darauf folgt. `pathPrefix` (eines, als String) und `path_prefixes` werden gleich gelesen. |
| `sockets` | `string[]` | Raw-TCP-Ziele für [`net.connect`](../modules/standard-modules.md), jeweils ein exaktes `"host:port"` (`"[::1]:9000"` für IPv6). |

Eine `http`-Regel deckt jeden Pfad ab, wenn sie weder `paths` noch `pathPrefixes` auflistet, und bei beiden einen Pfad, der auf einen von ihnen passt.

Host-Muster sind `*` (jeder Host), `*.example.com` (jede Subdomain von `example.com`, nicht aber `example.com` selbst) oder ein exakter Hostname. Beim Abgleich werden Groß- und Kleinschreibung sowie der Port ignoriert. Der Host wird nach dem letzten `@` genommen, sodass `https://api.example.com@evil.io/` als `evil.io` geprüft wird.

Ein WebSocket-Handshake ist ein HTTP-GET: `ws://` wird als `http://` und `wss://` als `https://` geprüft, sodass die Freigaben für Hosts und `http`, die ein GET auf die URL erlauben, auch den WebSocket erlauben. Ein Raw-Socket reicht an allen HTTP-Regeln vorbei, deshalb listet `sockets` jeden Host und Port exakt auf, und nur `sockets` gewährt sie.

`asset:`-URIs (die eigenen Dateien der App) sind immer erlaubt; Bilder und Videos dürfen außerdem `data:`-URIs und relative Pfade verwenden.

### `webview`

| Schlüssel | Typ | Beschreibung |
|---|---|---|
| `hosts` | `string[]` | Hosts, die eine [Web View](./web-view-and-video.md) anzeigen und zu denen sie navigieren darf (`http` und `https`). Ohne `webview` darf die App überhaupt keine Webseiten anzeigen. |
| `input` | `boolean` | Die Ref einer Web View darf ihrer Seite vertrauenswürdige Eingaben geben ([`sendInput`](./web-view-and-video.md#input-as-the-users-own)). Wird nie gewährt, wenn nicht deklariert, auch nicht für eine App ohne `"capabilities"`. |

Navigationen auf oberster Ebene innerhalb der Web View werden ebenfalls geprüft, und zwar vom Navigation-Delegate der Plattform, bevor sie laden. Die eigenen Subressourcen der Seite (ihre Skripte, Bilder, XHRs) sind Sache des Web-Contents und werden nicht geprüft. `about:blank` und Inline-HTML (`html`) erfordern nur, dass Web Views überhaupt gewährt sind: `"webview": { "hosts": [] }` erlaubt sie, ohne eine entfernte Seite zu erlauben.

`input` ist von `hosts` getrennt, weil vertrauenswürdige Eingaben eine Benutzeraktivierung tragen, die `injectJavaScript` nie erhält: Die Seite darf dann Fenster öffnen, die Zwischenablage beschreiben, den Dateidialog des Systems öffnen, WebAuthn- oder Berechtigungsabfragen starten und jede Schaltfläche betätigen, die `isTrusted` prüft. Ohne sie verwirft der Core `sendInput` und protokolliert, welcher Schlüssel hinzuzufügen ist.

### `statusBar`

`"statusBar": true` erlaubt der App, die Statusleiste zu ändern (das `statusBar` von Seiten und Dialogen in [`nsh/base`](../modules/nsh-base.md#status-bar) sowie den Standard `"statusBar"` von `nsh.json`).

### `clipboard`

`"clipboard": true` erlaubt der App, die System-Zwischenablage zu lesen und zu beschreiben ([`Clipboard`](../modules/nsh.md#clipboard)). Das Kopieren aus dem Bearbeitungsmenü eines auswählbaren Texts ist eine eigene Handlung des Benutzers und erfordert keine Capability.

### `picker`

`"picker": true` erlaubt der App, den System-Picker für Fotos anzuzeigen ([`Picker`](../modules/nsh.md#picker)): Der Benutzer wählt aus, was die App erreicht.

### `speech`

`"speech": true` erlaubt der App zu erkennen, was der Benutzer sagt ([`Speech`](../modules/nsh.md#speech)): das Mikrofon und die Spracherkennung des Systems, deren Transkript die App erreicht. Das System fragt den Benutzer weiterhin einmal.

### `openUrl`

Erlaubt der App, URLs außerhalb von ihr zu öffnen ([`openUrl`](../modules/nsh.md#openurl), die Links eines `TextView` mit `links="open"`): `"openUrl": true` für jedes Schema, `"openUrl": { "schemes": ["https", "mailto"] }` für die aufgelisteten Schemas. Eine URL, deren Schema nicht gewährt ist, wird mit `ERR_ACCESS_DENIED` abgelehnt (`permission` `"openUrl"`, `resource` die URL). URLs, die Code ausführen oder die eigenen Daten der App erreichen würden (`javascript:`, `data:`, `file:`, ...), werden unabhängig von der Capability nie geöffnet.

<a id="storage"></a>

### Speicher

Jede App darf ihre eigenen Daten mit [`Storage`](../modules/nsh.md#storage) auf dem Gerät halten, ohne Capability: Der Speicher enthält nur die Daten dieser App, und die einbettende App entscheidet, wo sie abgelegt werden.

### `host`

`host` listet die Funktionen der App auf, die NSH einbettet und die `host.call(name, args)` von `nsh` aufrufen darf: exakte Namen (`"getUserInfo"`) oder Präfixe, die auf `*` enden (`"bridge.*"` passt auf `bridge.call` und `bridge.share`). `"host": true` erlaubt jede Funktion. Eine nicht aufgelistete Funktion wird abgelehnt, auch in einer App ohne `"capabilities"`: Die Funktionen des Hosts werden nie standardmäßig gewährt, und beim Build einer App, die `host` aus `nsh` ohne `host` importiert, wird gewarnt, dass jeder Aufruf abgelehnt wird. Namen bestehen aus 1 bis 128 Zeichen aus `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` und `-`, ohne `..`; der Aufruf jedes anderen Namens wird abgelehnt, bevor die Freigaben gelesen werden. Beenden Sie ein Präfix mit einem Trennzeichen (`"bridge.*"`): `"bridge*"` passt auch auf `bridgeAdmin`. Die Events des Hosts (`host.on(event, listener)`) erreichen die Listener der App so, wie der Host sie sendet.

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` ist auf Plattformen wahr, die einen Host einbetten; anderswo wird `host.call` mit `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` abgelehnt.
<a id="what-a-refusal-looks-like"></a>

### Wie eine Ablehnung aussieht

| Anfrage | Ergebnis |
|---|---|
| `fetch` | Das Promise wird mit einem `TypeError` abgelehnt, wie jede fehlgeschlagene Anfrage, dessen `code` `ERR_ACCESS_DENIED` lautet, `permission` `"network"` und `resource` die URL (die der Anfrage oder die der Weiterleitung); die Anfrage erreicht nie das Netzwerk. |
| `Image.getSize`, `Image.prefetch` | Das Promise wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"network"` und `resource` die URL; das Bild wird nie angefordert. |
| Remote-Bild, Videoquelle, Web-View-Quelle oder `html` | Es wird nichts angezeigt, und `onError` des Elements meldet dies mit `code` `"ERR_ACCESS_DENIED"`. Die Navigation einer Web View zu einem nicht freigegebenen Host wird abgebrochen und auf dieselbe Weise gemeldet. |
| Änderung der Statusleiste, Canvas-Bild | Es ändert sich nichts bzw. nichts wird gezeichnet; die Ablehnung wird protokolliert. |
| Zwischenablage | Jede Funktion von `Clipboard` wird mit `ERR_ACCESS_DENIED`, `permission` `"clipboard"` und `resource` `""` abgelehnt; die System-Zwischenablage wird nie berührt. |
| Picker | `pickImages` zeigt nichts an und wird mit `ERR_ACCESS_DENIED`, `permission` `"picker"` und `resource` `""` abgelehnt. |
| Sprache | `Speech.start` wirft `ERR_ACCESS_DENIED`, `permission` `"speech"` und `resource` `""`; das Mikrofon bleibt aus. |
| `openUrl` | Das Promise wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"openUrl"` und `resource` die URL; es wird nichts geöffnet. |
| Host-Aufruf | `host.call` wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"host"` und `resource` den Namen der Funktion (`host.post` wirft ihn); der Aufruf erreicht nie den Host. |
| Dateien (`fs/promises`) | Das Promise wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"fs"` und `resource` den Pfad; die Festplatte wird nie berührt. |
| Prozesse (`process`) | `run` wird abgelehnt, und `spawn` und `exit` werfen, mit `ERR_ACCESS_DENIED`, `permission` `"process"` und `resource` den Befehl (`"exit"` für `exit`); es wird kein Kindprozess gestartet. |
| TCP-Socket (`net.connect`) | Das Promise wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"network"` und `resource` den `"host:port"`, noch vor jeder DNS-Abfrage. |
| WebSocket | `connect` des Moduls `websocket` wird mit `ERR_ACCESS_DENIED` abgelehnt, `permission` `"network"` und `resource` die URL; der globale `WebSocket` löst `error` und anschließend `close` (Code 1006) aus, wie bei einer fehlgeschlagenen Verbindung. |

Die Fehler der [Standardmodule](../modules/standard-modules.md#failures) tragen `code` `"ERR_ACCESS_DENIED"`, sodass eine App eine Ablehnung von einer fehlgeschlagenen Operation unterscheiden kann, und ihre `permission` und `resource` benennen die Capability und das, was angefordert wurde. Die Module von [`nsh`](../modules/nsh.md) lehnen auf dieselbe Weise ab: Ihre Promises werden mit `ERR_ACCESS_DENIED`, `permission` und `resource` abgelehnt (`fetch` mit einem `TypeError`, der Klasse jeder fehlgeschlagenen Anfrage).

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Rust-Komponenten erhalten dieselben Ablehnungen in den Begriffen von Rust: Ein abgelehntes Lesen der Zwischenablage liefert, was eine leere Zwischenablage liefert, eine abgelehnte Auswahl keine Dateien, ein abgelehntes `open_url` `false` und ein abgelehntes `fetch` einen `Err` mit der Meldung.

Jede Ablehnung wird einmal protokolliert und nennt den Schlüssel, der hinzuzufügen ist:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

Weiterleitungen werden von NSH verfolgt, nicht vom HTTP-Stack der Plattform, sodass jeder Hop gegen die Capabilities geprüft wird. (Ein gestreamter Request-Body wird nicht zweimal gesendet, daher schlägt eine `307`-/`308`-Weiterleitung eines gestreamten Uploads fehl.)

<a id="where-capabilities-travel"></a>

### Wohin die Capabilities mitreisen

Die Deklaration begleitet die App, wohin sie auch geht:

- `nsh build` und `nsh package` schreiben sie neben das Bundle als `capabilities.json`;
- `nsh publish` legt sie in den Header des [signierten Pakets](./signed-packages.md), abgedeckt von der Signatur;
- `nsh dev` sendet sie mit jedem Build, sodass die Entwicklung dieselben Regeln durchsetzt. Eine Änderung von `capabilities` lädt die App neu, statt sie per Hot-Patch zu aktualisieren.

<a id="grants-what-a-host-app-allows"></a>

## Grants: Was eine Host-App erlaubt

Eine Host-App, die NSH einbettet, kann **höchstens** einige Capabilities gewähren, in derselben JSON-Form:

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

Eine Anfrage muss **sowohl** von der Deklaration der App **als auch** vom Grant des Hosts erlaubt sein. Mit dem obigen Grant kann eine App, die `"hosts": ["*"]` deklariert, dennoch nur `api.example.com` erreichen und weder Webseiten anzeigen noch die Statusleiste ändern. Ohne Grant (`nil` / `null`, der Standard) gilt, was jede App deklariert.

Grants gelten ab dem nächsten Laden. Eine typische Konfiguration für Mini-Apps von Drittanbietern: Jeder App nur ihren eigenen API-Host gewähren, sie aus einem [signierten Paket](./signed-packages.md) ausführen, dessen Deklaration Sie geprüft haben, und die Standardlimits beibehalten oder senken.

> [!WARNING]
> [Native Komponenten](./native-components.md), die die Host-App registriert, sind der eigene Code des Hosts: Capabilities gelten für sie nicht. Registrieren Sie nur Komponenten, die für jede App sicher sind, die die View ausführen darf.

<a id="summary"></a>

## Zusammenfassung

| Ebene | Durchgesetzt von | Festgelegt von |
|---|---|---|
| Limits (Heap, Stack, Zeit, Nodes) | der Runtime, pro VM | der Host-App pro View (eingebettete Apps) |
| Hardening | der Runtime, beim Laden | außerhalb der Entwicklung immer aktiv |
| Capabilities | der Runtime (Fetch, Bilder, Video, Web Views, Statusleiste, Dateien, Prozesse, Sockets) | der App (`nsh.json`) und der Host-App (Grant) |
| Code-Integrität | Signaturprüfung | `nsh publish`; den vertrauenswürdigen Roots der Host-App |

<a id="see-also"></a>

## Siehe auch

- [Signierte Pakete](./signed-packages.md)
- [Networking](./networking.md)
- [Einbettung in iOS-Apps](./ios.md), [Einbettung in Android-Apps](./android.md)
