---
title: "Desenvolvimento local com LayerFS"
description: "Use o teste do LayerFS para Linux no checkout do Native Shell para capturar saídas de build do Cargo, criar um fork de um workspace e verificar a reutilização de snapshots."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

O repositório do Native Shell inclui um fluxo de trabalho local com LayerFS para testar workspaces de build reutilizáveis. Ele importa uma árvore de código-fonte commitada, executa o Cargo dentro de um Linux Sandbox, salva os arquivos resultantes e executa os testes novamente a partir de um fork desse estado salvo. A edição do código-fonte e os commits do Git acontecem no seu checkout existente do NSH.

> [!IMPORTANT]
> Este fluxo de trabalho requer Docker Engine e Linux FUSE. O Docker executa o processo de controle e o Sandbox; o FUSE monta o workspace dentro do Sandbox. No macOS, o comando de desenvolvimento prepara esse deployment Linux por meio de um engine Docker local, como o OrbStack.

<a id="what-the-snapshot-saves"></a>

## O que o snapshot salva

O LayerFS salva uma árvore de sistema de arquivos: arquivos de código-fonte, metadados do Git, arquivos ignorados e as saídas de build criadas dentro do workspace. Um fork começa a partir de uma árvore salva e registra suas próprias alterações. Isso permite que várias tarefas partam do mesmo estado já compilado, mantendo suas alterações separadas.

No teste local do NSH, o primeiro branch executa os testes de `nsh-package` e salva `target/` mais um arquivo de sondagem ignorado. O segundo branch parte desse commit, verifica esses arquivos e repete os testes offline. Um terceiro branch parte do estado original do código-fonte e verifica o isolamento.

| Fase | O que acontece |
| --- | --- |
| Init | Importa uma exportação do commit `HEAD` do checkout e um diretório `.git` novo |
| Build | Faz o fork de um workspace e executa `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | Salva o `target/` gerado e o arquivo de sondagem no histórico do LayerFS |
| Reuse | Faz o fork do branch salvo, monta-o e repete os testes com `--offline` |
| Verify | Lê o histórico de commits e verifica se o branch original do código-fonte permanece limpo |

Cada invocação cria um Store novo e executa essa sequência completa. A reutilização do snapshot acontece entre os branches dessa invocação. O benefício do teste a ser medido é o custo de chegar a outro workspace utilizável e testado, incluindo o tempo de montagem, de commit e de desmontagem.

<a id="prepare-the-development-environment"></a>

## Prepare o ambiente de desenvolvimento

Use um checkout do [repositório do NSH](https://github.com/longbridge/nsh) com:

- Um engine Docker Linux local com ext4, XFS ou Btrfs para o volume do Store, executando no Linux ou por meio de um ambiente macOS como o OrbStack.
- Docker Engine com API 1.54 ou mais recente; a configuração local verificada usa o Engine 29.7.2.
- `/dev/fuse`, com o Docker autorizado a expor esse dispositivo e `CAP_SYS_ADMIN` ao Sandbox.
- Git e Python 3.12 ou mais recente; no Linux, rustup e um compilador C/C++.
- Acesso à rede para baixar o código-fonte fixado do LayerFS, as dependências do Cargo e a imagem de runtime.

O teste compila o LayerFS **1.0.0**, fixado no commit de código-fonte `2aaf2552ce21154928b9f9c83582e41a637f5910`. Sua imagem de runtime fornece Rust 1.98.1, Node e clang para os processos Linux. O [guia do SDK upstream](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md) descreve o ciclo de vida do Store e do Sandbox.

Execute estes comandos a partir da raiz do checkout do NSH:

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

O executável seleciona o Python 3.12 ou mais recente, incluindo a instalação do Homebrew no macOS, e descobre o socket a partir do contexto Docker ativo. Use `--docker-socket PATH` para selecionar explicitamente um socket local.

`prepare` verifica a API do Docker, instala o Rust 1.85.1 e compila o daemon fixado, o addon do Node e a imagem de runtime. No macOS, prepara esses itens em um contêiner Linux de build temporário. Ele reutiliza o registro usual do Cargo e `target/`, incluindo uma configuração `CARGO_TARGET_DIR` existente. O ID exato da imagem de runtime e o caminho do daemon são registrados em `.nsh/layerfs/deployment.json`. `status` verifica as saídas de build e a imagem salvas e mostra o resultado de validação mais recente.

`smoke` cria `.nsh/layerfs/nsh-<id>/input` a partir do **`HEAD` commitado** do checkout e, em seguida, importa essa entrada em um novo Store. Para incluir edições de código-fonte, faça o commit delas no seu topic branch antes de executá-lo. A entrada gerada começa com um repositório Git novo e obtém suas saídas de build dentro do Sandbox.

O processo de controle abre o Store em um volume Docker local nomeado. O daemon do Sandbox abre o mesmo Store e monta a visão do sistema de arquivos do branch; o Cargo é executado nesse workspace montado. Seu checkout normal continua sendo o lugar onde você edita e faz commit das alterações de código-fonte.

<a id="read-the-result"></a>

## Leia o resultado

O comando imprime o diretório de recibos e o nome do volume do Store. Abra o `result.json` gerado para verificar `"ok": true` e o tempo decorrido em cada fase. O mesmo diretório contém `settings.json`, que identifica o commit de código-fonte e a imagem, e `trace.jsonl`, que registra as chamadas ao SDK.

A validação local executou 22 testes de pacote em cada uma das fases de build e de reutilização. A fase inicial de build/teste incluiu o download de dependências; a fase offline usou o `target/` salvo e o registro do Cargo do mesmo Sandbox. Compare o ciclo completo com builds comuns do Cargo na sua carga de trabalho ao avaliar seu valor.

Use sistemas operacionais, arquiteturas, toolchains e dependências compatíveis ao reutilizar um estado já compilado. A carga de trabalho deste guia é a suíte de testes `nsh-package` do Linux; as verificações de UI das plataformas usam seus respectivos ambientes de plataforma ([Testing](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## Preserve o trabalho útil e gerencie o Store

Mantenha as alterações de código-fonte no Git e envie-as por meio de pull requests. O teste usa o perfil de Store **Disposable** do LayerFS para históricos de workspace que podem ser recriados. Guarde os recibos úteis separadamente ao registrar medições.

A entrada gerada desativa a manutenção automática do Git durante seu commit inicial, mantendo o banco de objetos estável enquanto o LayerFS o importa. As verificações de status do Git dentro do teste usam `--no-optional-locks`, de modo que a leitura do status preserve o índice original. Em scripts personalizados, finalize os processos de escrita em segundo plano antes de importar ou fazer commit de uma árvore.

Sandboxes desmontados com sucesso são encerrados após o timeout de inatividade do LayerFS. Cada teste mantém seu volume do Store; gerencie esse volume específico e seus contêineres pelos identificadores presentes no recibo. Uma operação com falha mantém seu estado registrado para diagnóstico. A [referência do mantenedor](../../docs/dev/layerfs.md) aborda os scripts, os recibos e a limpeza de recursos.
