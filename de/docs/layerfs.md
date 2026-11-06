---
title: "Lokale Entwicklung mit LayerFS"
description: "Verwende den Linux-LayerFS-Test im Native Shell Checkout, um Cargo-Build-Ausgaben zu erfassen, einen Workspace zu forken und die Wiederverwendung von Snapshots zu überprüfen."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Das Repository von Native Shell enthält einen lokalen LayerFS-Workflow, um wiederverwendbare Build-Workspaces zu testen. Er importiert einen committeten Quellbaum, führt Cargo in einer Linux Sandbox aus, speichert die entstandenen Dateien und führt die Tests erneut aus einem Fork dieses gespeicherten Zustands aus. Das Bearbeiten des Quellcodes und die Git-Commits erfolgen weiterhin in deinem bestehenden NSH-Checkout.

> [!IMPORTANT]
> Dieser Workflow erfordert Docker Engine und Linux FUSE. Docker führt den Control-Prozess und die Sandbox aus; FUSE mountet
> den Workspace in der Sandbox. Unter macOS bereitet der Entwicklungsbefehl dieses Linux-Deployment über
> eine lokale Docker-Engine wie OrbStack vor.

<a id="what-the-snapshot-saves"></a>

## Was der Snapshot speichert

LayerFS speichert einen Dateisystembaum: Quelldateien, Git-Metadaten, ignorierte Dateien und die Build-Ausgaben, die im
Workspace erzeugt wurden. Ein Fork startet von einem gespeicherten Baum und zeichnet seine eigenen Änderungen auf. So können mehrere Aufgaben vom selben
gebauten Zustand aus starten, während ihre Änderungen voneinander getrennt bleiben.

Im lokalen Test von NSH führt der erste Branch die Tests von `nsh-package` aus und speichert `target/` sowie eine ignorierte Probe-Datei.
Der zweite Branch startet von diesem Commit, prüft diese Dateien und wiederholt die Tests offline. Ein dritter Branch startet
vom ursprünglichen Quellzustand und verifiziert die Isolation.

| Phase | Was passiert |
| --- | --- |
| Init | Einen Export des `HEAD`-Commits des Checkouts und ein frisches `.git`-Verzeichnis importieren |
| Build | Einen Workspace forken und `cargo +1.98.1 test --locked -p nsh-package` ausführen |
| Commit | Das erzeugte `target/` und die Probe-Datei in der LayerFS-Historie speichern |
| Reuse | Den gespeicherten Branch forken, mounten und die Tests mit `--offline` wiederholen |
| Verify | Die Commit-Historie lesen und prüfen, dass der ursprüngliche Quell-Branch unverändert bleibt |

Jeder Aufruf erstellt einen frischen Store und führt diese vollständige Sequenz aus. Die Wiederverwendung von Snapshots findet zwischen den
Branches dieses Aufrufs statt. Der Nutzen, den der Test misst, sind die Kosten, um einen weiteren nutzbaren, getesteten Workspace zu erreichen,
einschließlich der Zeit für Mount, Commit und Unmount.

<a id="prepare-the-development-environment"></a>

## Die Entwicklungsumgebung vorbereiten

Verwende einen Checkout des [NSH-Repositorys](https://github.com/longbridge/nsh) mit:

- Einer lokalen Linux-Docker-Engine mit ext4, XFS oder Btrfs für ihr Store-Volume, die unter Linux oder in einer macOS-Umgebung
  wie OrbStack läuft.
- Einer Docker Engine, die API 1.54 oder neuer bereitstellt; die verifizierte lokale Konfiguration verwendet Engine 29.7.2.
- `/dev/fuse`, wobei Docker erlaubt sein muss, dieses Gerät und `CAP_SYS_ADMIN` der Sandbox bereitzustellen.
- Git und Python 3.12 oder neuer; unter Linux zusätzlich rustup und einen C/C++-Compiler.
- Netzwerkzugriff, um den gepinnten LayerFS-Quellcode, die Cargo-Abhängigkeiten und das Runtime-Image abzurufen.

Der Test baut LayerFS **1.0.0**, gepinnt auf den Quell-Commit
`2aaf2552ce21154928b9f9c83582e41a637f5910`. Sein Runtime-Image stellt Rust 1.98.1, Node und clang für die Linux-Prozesse bereit. Der [Upstream-SDK-Leitfaden](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md)
beschreibt den Lebenszyklus von Store und Sandbox.

Führe diese Befehle im Stammverzeichnis des NSH-Checkouts aus:

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

Die ausführbare Datei wählt Python 3.12 oder neuer aus, einschließlich der Homebrew-Installation unter macOS, und ermittelt den Socket
aus dem aktiven Docker-Kontext. Verwende `--docker-socket PATH`, um einen lokalen Socket explizit auszuwählen.

`prepare` prüft die Docker-API, installiert Rust 1.85.1 und baut den gepinnten Daemon, das Node-Addon und das Runtime-Image.
Unter macOS erfolgt dies in einem temporären Linux-Build-Container. Es verwendet die üblichen Cargo-Registry und `target/` wieder,
einschließlich einer vorhandenen `CARGO_TARGET_DIR`-Einstellung. Die exakte Runtime-Image-ID und der Daemon-Pfad werden in
`.nsh/layerfs/deployment.json` festgehalten. `status` prüft die gespeicherten Build-Ausgaben und das Image und zeigt das neueste Validierungsergebnis an.

`smoke` erstellt `.nsh/layerfs/nsh-<id>/input` aus dem **committeten `HEAD`** des Checkouts und importiert diese Eingabe dann in
einen neuen Store. Um Quelländerungen einzubeziehen, committe sie vor der Ausführung in deinen Topic-Branch. Die erzeugte Eingabe beginnt
mit einem frischen Git-Repository und erzeugt ihre Build-Ausgaben innerhalb der Sandbox.

Der Control-Prozess öffnet den Store in einem benannten lokalen Docker-Volume. Der Sandbox-Daemon öffnet denselben Store und
mountet die Dateisystemansicht des Branches; Cargo wird in diesem gemounteten Workspace ausgeführt. Dein normaler Checkout bleibt
der Ort, an dem du Quelländerungen bearbeitest und committest.

<a id="read-the-result"></a>

## Das Ergebnis lesen

Der Befehl gibt das Receipt-Verzeichnis und den Namen des Store-Volumes aus. Öffne das erzeugte `result.json`, um
`"ok": true` und die verstrichene Zeit jeder Phase zu prüfen. Dasselbe Verzeichnis enthält `settings.json`, das den
Quell-Commit und das Image identifiziert, sowie `trace.jsonl`, das die SDK-Aufrufe aufzeichnet.

Die lokale Validierung führte in der Build- und in der Reuse-Phase jeweils 22 Paket-Tests aus. Die anfängliche Build-/Test-Phase
umfasste das Herunterladen von Abhängigkeiten; die Offline-Phase verwendete das gespeicherte `target/` und die Cargo-Registry derselben Sandbox.
Vergleiche den vollständigen Zyklus mit gewöhnlichen Cargo-Builds deiner Workload, um seinen Wert zu beurteilen.

Verwende beim Wiederverwenden eines gebauten Zustands übereinstimmende Betriebssysteme, Architekturen, Toolchains und Abhängigkeiten. Die
Workload dieses Leitfadens ist die Linux-Testsuite `nsh-package`; UI-Prüfungen der Plattformen verwenden ihre jeweiligen Plattformumgebungen
([Testing](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## Nützliche Arbeit behalten und den Store verwalten

Behalte Quelländerungen in Git und reiche sie über Pull Requests ein. Der Test verwendet das **Disposable**-Store-Profil von LayerFS
für neu erzeugbare Workspace-Historie. Bewahre nützliche Receipts separat auf, wenn du Messungen festhältst.

Die erzeugte Eingabe deaktiviert die automatische Git-Wartung während ihres ersten Commits, damit die Objektdatenbank
stabil bleibt, während LayerFS sie importiert. Git-Statusprüfungen im Test verwenden `--no-optional-locks`, sodass das Lesen des Status
den ursprünglichen Index erhält. Beende bei eigenen Skripten Hintergrund-Schreibvorgänge, bevor du einen Baum importierst oder committest.

Erfolgreich ungemountete Sandboxes werden nach dem Idle-Timeout von LayerFS beendet. Jeder Test behält sein Store-Volume; verwalte dieses
Volume und seine Container anhand der Bezeichner im Receipt. Eine fehlgeschlagene Operation behält ihren aufgezeichneten Zustand
zur Diagnose. Die [Maintainer-Referenz](../../docs/dev/layerfs.md) behandelt die Skripte, Receipts und das Aufräumen von Ressourcen.
