---
title: "Abwärtskompatibilität"
description: "Wie Native Shell Apps über Releases hinweg lauffähig hält: was ein kompatibles Release garantiert, das Protokoll in nsh-compat, das jede Änderung daran festhält, den Release-Ablauf und wie man eine API hinzufügt, umbenennt oder ändert."
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---


# Abwärtskompatibilität

Host-Apps laden NSH-Apps als [signierte Pakete](./signed-packages.md) herunter und führen sie als Plugins aus. Eine ausgelieferte App wird womöglich nie wieder gebaut: Ihr Team ist weitergezogen, ihr Quellcode liegt in einem Geschäftsprozess, und die Host-App hat NSH nach eigenem Zeitplan aktualisiert. Deshalb gibt Native Shell jeder App ein Versprechen: **Eine App, die für ein kompatibles Release gebaut wurde, läuft unverändert auf jedem späteren Release.** Eine App, die nach einem NSH-Update nicht mehr funktioniert, ist ein Fehler in NSH.

Diese Seite beschreibt das Versprechen, wie es durchgesetzt wird und wie sich NSH innerhalb dieses Versprechens ändern lässt.

<a id="what-an-app-can-rely-on"></a>

## Worauf sich eine App verlassen kann

Das Versprechen umfasst alles, womit eine gebaute App in Berührung kommt:

| Teil | Warum es wichtig ist |
| --- | --- |
| Die Exporte jedes Moduls (`nsh`, `nsh/*`, `nsh/base`, die Standardmodule) und ihre Member | Ein Bundle importiert sie über ihren Namen: Fehlt ein Name, startet die App nicht. |
| `nsh:rt`, die Funktionen, die kompiliertes JSX aufruft | Jedes Bundle enthält die Ausgabe des Compilers, der es gebaut hat. |
| Die Globals (Timer, `fetch`, `console`, ...) und ihre Member | Apps rufen sie über ihren Namen auf. |
| Element-Props, Events und ihre Payloads, Style-Keys und ihre Werte | Apps übergeben sie über ihren Namen; eine umbenannte Prop wird ignoriert, sodass die App falsch läuft. |
| Tailwind-Utilities und -Varianten | Klassen werden zur Laufzeit aus den Strings im Bundle aufgelöst. |
| Verhalten: Standardwerte, Einheiten, Payloads, die Reihenfolge von Callbacks | Eine App verlässt sich auf das, was sie beim Schreiben beobachtet hat. |
| Die TypeScript-Deklarationen (`.nsh/types`) | Der Quellcode einer alten App besteht die Typprüfung weiterhin, wenn ihr Team einen Fehler behebt. |
| Das Paketformat und seine Signaturen | Ein für ein früheres Release signiertes Paket wird weiterhin erfolgreich verifiziert. |

Die Regeln, die das sicherstellen:

1. **Was ein Release ausgeliefert hat, bleibt.** Kein Modul, Export, Member, keine Prop, kein Event, Payload-Key, Style-Key oder -Wert, keine Tailwind-Utility, kein Global und keine `nsh:rt`-Funktion verschwindet.
2. **Eine Umbenennung behält den alten Namen** dauerhaft als Alias derselben Implementierung bei, markiert mit `@deprecated` und dem neuen Namen. Wird ein Export in ein anderes Modul verschoben, bleibt er zusätzlich im alten erhalten.
3. **Typen werden nur erweitert.** Eine Union erhält zusätzliche Alternativen, eine Funktion erhält Überladungen oder nachgestellte optionale Parameter, ein Parameter wird optional; was Apps übergeben (Props, Styles, Optionen), erhält ausschließlich optionale Member. Die Werte, die eine App liest, wachsen auf dieselbe Weise: `platform.os` erhält eine Plattform, ein Zustand oder ein Grund erhält einen weiteren Fall. Ein Fall, den die App kannte, behält seinen Wert, und die App behandelt einen Wert, den sie nicht kennt, mit dem `default` eines `switch`:

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
4. **Verhalten bleibt erhalten.** Neues Verhalten ist Opt-in, über eine neue Prop, Option oder einen neuen Wert.
5. **`nsh:rt` wächst nur**, wobei jede Funktion ihre Signatur und Bedeutung behält.
6. **Formate werden für immer gelesen.** Pakete, Zertifikate, Sperrlisten und `app.json` früherer Releases werden von späteren gelesen; ein Paket nennt die niedrigste Laufzeitumgebung, die es benötigt (`nsh publish --min-runtime`).
7. **Sicherheit ist die einzige Ausnahme.** Eine Fähigkeit, die sich nicht sicher aufrechterhalten lässt, wird geschlossen, mit Begründung aufgelistet und in den Release Notes genannt.

Das Versprechen beginnt mit dem ersten als kompatibel verzeichneten Release und gilt dauerhaft, unabhängig von der Versionsnummer. Zwischen Releases darf sich eine API, die nur `main` hat, noch ändern.

<a id="how-it-is-enforced"></a>

## Wie es durchgesetzt wird

Was Releases eingefroren haben, liegt in einem eigenen Repository, [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat), getrennt vom Code von NSH. Eine Änderung an NSH wird dagegen geprüft und kann es nicht bearbeiten: Ein Pull Request, der eine API umbenennt, kann nicht zugleich den Eintrag zu dieser API umschreiben.

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

Jeder Pull Request an NSH führt die Prüfungen von `nsh-compat` gegen seinen Checkout aus (der **Compat**-Workflow oder lokal `cargo xtask compat`):

| Prüfung | Wann sie besteht |
| --- | --- |
| `checkout_apps_run` | Die Apps von `tests/compat/`, gebaut von diesem Checkout, tun, was ihre Skripte vorgeben, und jeder Teil der API, dessen Prüfung ein Skript behauptet, wird tatsächlich geprüft. |
| `nothing_released_is_removed` | Alles, was jedes verzeichnete Release angeboten hat (Exporte, Member und ihre Arten, Deklarationen, Tailwind-Klassen und was sie setzen), wird weiterhin angeboten, unverändert oder erweitert. |
| `released_apps_run` | Die Apps, die jedes verzeichnete Release gebaut hat, so wie sein Compiler sie gebaut hat, starten auf dieser Laufzeitumgebung und tun, was ihre Skripte vorgeben. |

Die erste Prüfung testet die API, die gerade entsteht; die anderen beiden gelten für jedes Release, das verzeichnet wurde. Die Umbenennung einer veröffentlichten API schlägt so fehl:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` wird von den Maintainern von NSH geprüft, und seine eigene CI führt es gegen `main` von NSH aus.

<a id="the-release-flow"></a>

## Der Release-Ablauf

1. **Entwickeln.** Eine API landet auf `main` zusammen mit einem Fall in `tests/compat/`, dessen Skript sie prüft. Solange kein Release sie verzeichnet hat, darf sie umbenannt oder umgestaltet werden; der Fall ändert sich mit.
2. **Verzeichnen.** Bei einem Release schreibt `cargo xtask compat record <version>` `releases/v<version>/` in einen Checkout von `nsh-compat`: die Oberfläche, die das Release anbietet, und jede App von `tests/compat/`, gebaut von seinem Compiler, mit ihren Skripten. Verzeichnet wird nur eine API, deren Teile alle von einem Skript geprüft werden.
3. **Einfrieren.** Der Eintrag wird über einen Pull Request von `nsh-compat` gemergt. Ab dann wird jede Änderung an NSH daran gemessen, zusammen mit jedem früheren Eintrag.

<a id="developing-within-the-promise"></a>

## Entwickeln innerhalb des Versprechens

<a id="adding-an-api"></a>

### Eine API hinzufügen

Jeder neue Export, jedes neue Global, jede neue Prop, jedes neue Event und jeder neue Style-Key kommt mit einem Fall:

1. Schreiben Sie ein Modul `tests/compat/cases/<domain>/<case>.tsx`, dessen Default-Export eine Komponente ist, die die API verwendet und ihr Ergebnis anzeigt. Die Domänen sind `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` und `web`, dazu `android`, `macos` und `browser` für das, was eine Plattform oder eine `nsh.json`-Einstellung bestimmt.
2. Fügen Sie es dem `App.tsx` der Domäne hinzu, das jeweils einen Fall anzeigt.
3. Hängen Sie die Schritte an das `script.txt` der Domäne an: `tap id:case-<case>`, dann die Schritte, die prüfen, was die API tut, und für jeden Teil, den sie hinzufügt, einen `covers <item>`-Schritt.
4. Führen Sie `cargo xtask compat` aus (`NSH_COMPAT_APP=<domain>` führt eine Domäne aus).

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

Ein `covers`-Schritt wird verifiziert: Die App muss das Element verwenden, und bei einer Prop, einem Event oder einem Style-Key muss das Entfernen aus der gebauten App dazu führen, dass ein Schritt des Skripts fehlschlägt. Elemente werden benannt als `[<module>] <export>`, `[globals] <name>`, `[props] <name>`, `[events] <name>`, `[styles] <name>`, die eigenen einer Komponente als `[props] <Component>.<name>` und die Props einer Plattform als `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>`.

<a id="renaming-or-moving-an-api"></a>

### Eine API umbenennen oder verschieben

Fügen Sie den neuen Namen hinzu und behalten Sie den alten als Alias derselben Implementierung bei, deklariert als `@deprecated` mit dem neuen Namen. Aktualisieren Sie den Fall und sein Skript auf den neuen Namen. Eine API, die noch kein Release verzeichnet hat, wird einfach umbenannt.

<a id="changing-a-type"></a>

### Einen Typ ändern

Erweitern Sie ihn: mehr Alternativen in einer Union, mehr Überladungen, nachgestellte optionale Parameter, optionale neue Member dessen, was Apps übergeben. Eine Union, die Apps lesen, erhält Member auf dieselbe Weise, jeweils einen neuen Member für einen neuen Fall. Parameternamen dürfen sich ändern; ihre Anzahl, Optionalität und Typen bleiben.

<a id="changing-behavior"></a>

### Verhalten ändern

Behalten Sie das alte Verhalten bei und fügen Sie das neue hinter einer neuen Prop, Option oder einem neuen Wert hinzu. Auch eine Fehlerbehebung, die ändert, was eine funktionierende App sieht, ist eine Verhaltensänderung: Legen Sie sie hinter ein Opt-in, oder stellen Sie sicher, dass keine App sich auf das alte Ergebnis verlassen kann. Geben Sie dem Verhalten einen Schritt in einem Fall, damit es so bleibt, wie es ist.

<a id="changing-the-compiler"></a>

### Den Compiler ändern

Nichts Zusätzliches: Die Apps jedes Releases bleiben so, wie der Compiler dieses Releases sie gebaut hat, und die Fälle werden frisch von Ihrem gebaut. Die Funktionen, die er in Bundles ausgibt (`nsh:rt`), wachsen nur.

<a id="closing-an-api-for-security"></a>

### Eine API aus Sicherheitsgründen schließen

Ein Pull Request von `nsh-compat` fügt den Eintrag zu seiner `closed.txt` mit der Begründung hinzu (`<entry> -- <reason>`, der Eintrag so, wie die Prüfung ihn meldet) und landet zuerst; die NSH-Änderung, die die API entfernt, besteht danach. Die Release Notes nennen den Grund.

<a id="scripts"></a>

## Skripte

Ein `script.txt` besteht aus einem Schritt pro Zeile. Schritte, die etwas ausführen: `tap <selector>`, `type <selector> <text>`, `key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`. Schritte, die prüfen: `expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`, `style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`. Die ersten Zeilen können den Bildschirm festlegen: `viewport <w> <h>`, `platform <os> [desktop]`, `fontscale <scale>`. Ein Selektor ist `id:<testID>`, `label:<label>`, `text:<text>` oder `span:<text>`; Props und Styles werden so geschrieben, wie Apps sie schreiben (`style id:card backgroundColor #3366ffff`). `NSH_COMPAT_DUMP=1` gibt aus, was jeder Schritt zum Bildschirm hinzufügt und von ihm entfernt, als Hilfe beim Schreiben eines Skripts.

<a id="commands"></a>

## Befehle

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` hält einen Checkout von `nsh-compat` in `target/nsh-compat/` und aktualisiert ihn bei jedem Lauf; ein Checkout mit eigenen Änderungen wird unverändert verwendet, sodass sich eine Änderung an den Prüfungen gegen NSH ausprobieren lässt, bevor ihr Pull Request existiert.
