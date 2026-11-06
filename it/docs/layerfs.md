---
title: "Sviluppo locale con LayerFS"
description: "Usa la prova di LayerFS per Linux inclusa nel checkout di Native Shell per acquisire gli output di build di Cargo, creare un fork di un workspace e verificare il riutilizzo degli snapshot."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Il repository di Native Shell include un workflow locale di LayerFS per testare workspace di build riutilizzabili. Importa un albero dei sorgenti di cui è stato fatto il commit, esegue Cargo all'interno di una Sandbox Linux, salva i file risultanti ed esegue di nuovo i test a partire da un fork di quello stato salvato. La modifica dei sorgenti e i commit Git avvengono nel tuo checkout NSH esistente.

> [!IMPORTANT]
> Questo workflow richiede Docker Engine e FUSE su Linux. Docker esegue il processo di controllo e la Sandbox; FUSE monta
> il workspace all'interno della Sandbox. Su macOS, il comando di sviluppo prepara questo deployment Linux tramite
> un engine Docker locale come OrbStack.

<a id="what-the-snapshot-saves"></a>

## Cosa salva lo snapshot

LayerFS salva un albero del filesystem: file sorgente, metadati Git, file ignorati e output di build creati all'interno del
workspace. Un fork parte da un albero salvato e registra le proprie modifiche. Questo permette a più attività di partire dallo stesso
stato già compilato mantenendo separate le proprie modifiche.

Nella prova locale di NSH, il primo branch esegue i test di `nsh-package` e salva `target/` più un file di probe ignorato.
Il secondo branch parte da quel commit, verifica quei file e ripete i test offline. Un terzo branch parte
dallo stato originale dei sorgenti e verifica l'isolamento.

| Fase | Cosa accade |
| --- | --- |
| Init | Importa un export del commit `HEAD` del checkout e una directory `.git` nuova |
| Build | Esegue il fork di un workspace ed esegue `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | Salva `target/` generato e il file di probe nella cronologia di LayerFS |
| Reuse | Esegue il fork del branch salvato, lo monta e ripete i test con `--offline` |
| Verify | Legge la cronologia dei commit e verifica che il branch sorgente originale resti pulito |

Ogni invocazione crea uno Store nuovo ed esegue questa sequenza completa. Il riutilizzo dello snapshot avviene tra i
branch di quella invocazione. Il vantaggio della prova da misurare è il costo per ottenere un altro workspace utilizzabile e testato,
compresi i tempi di mount, commit e unmount.

<a id="prepare-the-development-environment"></a>

## Preparare l'ambiente di sviluppo

Usa un checkout del [repository NSH](https://github.com/longbridge/nsh) con:

- Un engine Docker Linux locale con ext4, XFS o Btrfs per il suo volume Store, in esecuzione su Linux o tramite un ambiente macOS
  come OrbStack.
- Docker Engine che serve l'API 1.54 o successiva; la configurazione locale verificata usa Engine 29.7.2.
- `/dev/fuse`, con Docker autorizzato a esporre quel dispositivo e `CAP_SYS_ADMIN` alla Sandbox.
- Git e Python 3.12 o successivo; su Linux, rustup e un compilatore C/C++.
- Accesso di rete per scaricare il sorgente di LayerFS con versione fissata, le dipendenze Cargo e l'immagine di runtime.

La prova compila LayerFS **1.0.0**, fissato al commit sorgente
`2aaf2552ce21154928b9f9c83582e41a637f5910`. La sua immagine di runtime fornisce Rust 1.98.1, Node e clang per i
processi Linux. La [guida SDK upstream](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md)
descrive il ciclo di vita di Store e Sandbox.

Esegui questi comandi dalla radice del checkout NSH:

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

L'eseguibile seleziona Python 3.12 o successivo, compresa l'installazione di Homebrew su macOS, e individua il socket
dal contesto Docker attivo. Usa `--docker-socket PATH` per selezionare esplicitamente un socket locale.

`prepare` controlla l'API di Docker, installa Rust 1.85.1 e compila il daemon con versione fissata, l'addon Node e l'immagine di runtime.
Su macOS li prepara in un container di build Linux temporaneo. Riutilizza il consueto registro Cargo e `target/`,
compresa un'eventuale impostazione `CARGO_TARGET_DIR` esistente. L'ID esatto dell'immagine di runtime e il percorso del daemon vengono registrati in
`.nsh/layerfs/deployment.json`. `status` controlla gli output di build e l'immagine salvati e mostra l'ultimo risultato di validazione.

`smoke` crea `.nsh/layerfs/nsh-<id>/input` a partire dal **`HEAD` di cui è stato fatto il commit** nel checkout, quindi importa quell'input in
un nuovo Store. Per includere modifiche ai sorgenti, fai il commit sul tuo topic branch prima di eseguirlo. L'input generato parte
da un repository Git nuovo e ottiene i propri output di build all'interno della Sandbox.

Il processo di controllo apre lo Store in un volume Docker locale con nome. Il daemon della Sandbox apre lo stesso Store e
monta la vista del filesystem del branch; Cargo viene eseguito in quel workspace montato. Il tuo checkout normale resta il
luogo in cui modifichi e fai il commit delle modifiche ai sorgenti.

<a id="read-the-result"></a>

## Leggere il risultato

Il comando stampa la directory della ricevuta e il nome del volume Store. Apri `result.json` generato per controllare
`"ok": true` e il tempo trascorso per ogni fase. La stessa directory contiene `settings.json`, che identifica il
commit sorgente e l'immagine, e `trace.jsonl`, che registra le chiamate all'SDK.

La validazione locale ha eseguito 22 test di pacchetto in ciascuna delle fasi di build e reuse. La fase iniziale di build/test
includeva il download delle dipendenze; la fase offline ha usato `target/` salvato e il registro Cargo della stessa Sandbox.
Confronta il ciclo completo con le normali build Cargo sul tuo carico di lavoro per valutarne il valore.

Usa sistemi operativi, architetture, toolchain e dipendenze corrispondenti quando riutilizzi uno stato già compilato. Il carico di lavoro
di questa guida è la suite di test Linux `nsh-package`; i controlli della UI di piattaforma usano i rispettivi ambienti di piattaforma
([Testing](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## Conservare il lavoro utile e gestire lo Store

Mantieni le modifiche ai sorgenti in Git e inviale tramite pull request. La prova usa il profilo di Store **Disposable** di LayerFS
per la cronologia di workspace ricostruibile. Conserva separatamente le ricevute utili quando registri le misurazioni.

L'input generato disabilita la manutenzione automatica di Git durante il commit iniziale, mantenendo stabile
il database degli oggetti mentre LayerFS lo importa. I controlli dello stato Git all'interno della prova usano `--no-optional-locks`, in modo che la lettura dello stato
preservi l'indice originale. Per script personalizzati, termina i writer in background prima di importare o fare il commit di un albero.

Le Sandbox smontate con successo si fermano dopo il timeout di inattività di LayerFS. Ogni prova conserva il proprio volume Store; gestisci quello
specifico volume e i suoi container in base agli identificativi presenti nella ricevuta. Un'operazione fallita conserva il proprio stato registrato
per la diagnosi. Il [riferimento per i maintainer](../../docs/dev/layerfs.md) tratta script, ricevute e pulizia delle risorse.
