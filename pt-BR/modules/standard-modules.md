---
title: "Módulos padrão"
description: "Onze módulos padrão no formato do Node: utilitários LLRT fixados e arquivos, processos e rede com verificação de capacidades."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell fornece onze módulos padrão para TSX, importados pelos seus nomes simples (o código Rust usa as bibliotecas do próprio Rust: [A partir do Rust](#from-rust)): APIs no formato do Node, compatíveis com as do gpui-shell, executadas na VM do app sobre o runtime nativo do NSH, com suas capacidades verificadas em Rust. As declarações TypeScript em `.nsh/types` são geradas a partir das mesmas especificações dos módulos, então o que os tipos mostram é o que o runtime exporta.

| Módulo | Exportações |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, padrão (LLRT); `Buffer` também é global |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, padrão (LLRT); `crypto` também é global |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, padrão (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, padrão; `URL` e `URLSearchParams` são classes globais do NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, cada uma com sua forma `Sync`, padrão (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, padrão |
| `console` | padrão: o `console` da VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, padrão |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, padrão; o objeto padrão também tem `env` e `dataDir` e é o `process` global |
| `net` | `connect`, `Socket`, padrão |
| `websocket` | `connect(url, options?)` que resolve um `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, padrão; o construtor `WebSocket` global em hosts nativos |

<a id="from-rust"></a>

## A partir do Rust

O código Rust faz o mesmo trabalho com a biblioteca padrão do Rust e o crates.io, no código nativo do próprio app: chamadas bloqueantes são executadas nas threads do runtime com `blocking(…)` e as assíncronas com `background(…)` (`nsh_core::prelude`), e seus resultados voltam ao componente em uma task. Os `capabilities` de `nsh.json` regem o TSX do app e os serviços do NSH (`fetch`, a área de transferência); o código Rust do próprio app é executado com as permissões do processo do app. Em apps de navegador, o código Rust acessa a rede com `fetch` e mantém dados com `nsh_core::storage::Storage`.

| Módulo | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, o crate `base64` |
| `crypto` | crates como `sha2`, `hmac`, `rand` e `uuid` |
| `path` | `std::path` |
| `url` | o crate `url` |
| `zlib` | crates como `flate2`, `brotli` e `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | o crate `log` |
| `fs/promises` | `std::fs` em `blocking(…)`; `Storage` para dados chave-valor |
| `process` | `std::process::Command` em `blocking(…)` |
| `net` | `std::net::TcpStream` em `blocking(…)`, ou `tokio::net` em `background(…)` |
| `websocket` | um crate como `tokio-tungstenite` em `background(…)` |

<a id="imports-and-generated-types"></a>

## Importações e tipos gerados

Cada módulo é importado exatamente pelo nome da tabela: `import { join } from "path"`, `import fs from "fs/promises"`. O bundler mantém essas importações e o runtime as atende nativamente; o catálogo é composto por esses onze nomes. `buffer`, `crypto`, `path`, `url` e `zlib` são implementações do LLRT, fixadas em `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, com declarações projetadas a partir dessa revisão sobre as exportações que o runtime possui. Os demais são do próprio NSH. O NSH mantém a identidade de suas classes URL, Blob, stream e event.

Os onze módulos carregam em hosts nativos e em apps de navegador. `Buffer`, hashing, crypto e compressão usam a mesma implementação portável em Rust em WebAssembly, incluindo APIs síncronas; valores aleatórios usam a entropia criptográfica do navegador. As operações de `path` no navegador usam caminhos POSIX e um diretório de trabalho virtual `/`. Os arquivos no navegador usam armazenamento persistente privado do app, e os WebSockets usam o transporte do navegador. A execução de processos e as chamadas TCP brutas falham com `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` nos navegadores.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Comparação com Node.js e gpui-shell

Os módulos seguem os nomes e formatos do Node para o subconjunto que exportam, e o comportamento do gpui-shell onde ele define um. Escolhas próprias do NSH:

- O `exists` de `fs/promises` é `true` para um symlink cujo destino não existe, e `unlink`, `rename`, `rmdir`, `lstat` e `readlink` agem sobre o próprio symlink.
- `Stats` e `Dirent` têm seus campos (`size`, `mtimeMs`, `name`, ...) como propriedades próprias, como as do Node, e `isFile()`, `isDirectory()` e `isSymbolicLink()` no protótipo.
- Um listener de `ChildProcess` recebe o payload do evento: o texto da saída, ou o `{ code, signal }` da saída (com `error` e `errorCode` quando o runtime encerrou o processo filho). `on` retorna o processo filho. `run` resolve `{ code, signal, stdout, stderr }`: a saída do gpui-shell com o sinal que encerrou o processo filho.
- O ambiente de um processo filho é um pequeno conjunto vindo do host mais os nomes concedidos ao app, e ele é executado no diretório de dados do app ou em um `cwd` dentro de uma raiz `fs.write` ([Processos](#processes)).
- `process.platform`, `process.arch`, `os.platform()` e `os.arch()` fornecem os nomes de `std::env::consts` do Rust, como os do gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([Metadados do SO](#os-metadata-and-logging)).
- `process.dataDir` é `null` quando o host não tem diretório de dados; `process.exit` pede ao host que feche a superfície do app.
- Os limites fazem parte de cada API: tamanhos, contagens e timeouts estão listados em cada módulo abaixo.

<a id="failures"></a>

## Falhas

Uma função que retorna uma promise reporta toda falha rejeitando-a, como o `fs/promises` do Node: um argumento incorreto, um caminho ou host que não foi concedido ao app, um limite esgotado e um erro de E/S, todos da mesma forma, de modo que um único `catch` (ou `.catch`) trata todos eles. Uma função síncrona (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, o construtor do `WebSocket` global e `send`) lança uma exceção. Um uso incorreto (um argumento do tipo errado, uma opção fora do intervalo) é um `TypeError` ou `RangeError`. Toda falha que um app pode tratar traz um `code`, que permanece o mesmo de uma versão para outra; a mensagem é escrita para pessoas e pode mudar, então os apps devem se basear em `code`:

| `code` | O que significa |
|---|---|
| `ERR_ACCESS_DENIED` | Os `capabilities` do app não concedem a chamada. O erro tem `permission`, a chave da capacidade em `nsh.json` (`"fs"`, `"process"`, `"network"`), e `resource`, o que foi solicitado: o caminho, o comando (`"exit"` para `process.exit`), o `"host:port"` de um socket ou a URL do WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | A chamada pertence a outras plataformas: arquivos funcionam em desktops e em navegadores, processos em desktops, sockets TCP em hosts nativos, `os.homedir()` em hosts que configuram um diretório home |
| `ERR_NSH_QUOTA_EXCEEDED` | Um limite do runtime foi esgotado: operações ou dados em andamento, processos filhos, sockets, WebSockets, bytes aguardando envio, listeners |
| `ETIMEDOUT` | A chamada excedeu o tempo: o `timeoutMs` de `run`, uma conexão, um handshake, escrita ou fechamento de WebSocket |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | A resposta do sistema operacional, com os códigos do Node; `EACCES` e `EPERM` são o SO recusando um arquivo, independentemente das capacidades do app |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Códigos do Node para um tamanho acima de um limite, uma conexão fechada e uma saída além da captura de `run` |

```tsx
import fs from "fs/promises";

async function loadSettings(): Promise<string> {
  try {
    return await fs.readFile("${dataDir}/settings.json", "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "{}";
    if (error.code === "ERR_ACCESS_DENIED") console.warn(`not granted: ${error.permission} ${error.resource}`);
    throw error;
  }
}
```

Um app host pode conceder menos do que o app declara ([Sandbox e capacidades](../docs/sandbox-and-capabilities.md)), então um app trata `ERR_ACCESS_DENIED` como trata uma requisição que falhou.

<a id="os-metadata-and-logging"></a>

## Metadados do SO e logging

`os.platform(): string` e `os.arch(): string` informam o SO e a arquitetura reais do host nativo, e `process.platform` e `process.arch` contêm os mesmos valores. São os nomes de `std::env::consts::OS` e `ARCH` do Rust, como os do gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` para o SO, `"aarch64"`, `"x86_64"` para a arquitetura, de modo que os apps comparam diretamente com eles (`process.platform === "macos"`). `os.EOL: string` é o separador de linha do host. `os.homedir(): string` retorna um caminho home absoluto do host, se configurado; onde nenhum está configurado, lança um erro com `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Os caminhos de diretório são metadados: as operações de arquivo ainda exigem concessões de `fs.read` / `fs.write`.

Apps de navegador leem um objeto `process.env` vazio, e `os.homedir()` lança `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` ali, pois caminhos home e variáveis de ambiente pertencem aos hosts nativos.

`import console from "console"` compartilha o objeto global `console` da VM. O módulo tem apenas uma exportação padrão, com suporte a `log`, `info`, `debug`, `warn`, `error`, cada um com a assinatura `(...values: unknown[]): void`. Ele usa a formatação do logger do NSH.

<a id="compression"></a>

## Compressão

`zlib` é do LLRT, com um limite que o NSH acrescenta: cada descompressão (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` e suas formas `Sync`) produz no máximo 64 MiB, ou o limite de heap da VM quando este for menor. Uma saída maior lança um `RangeError`, como o Node.js faz para `maxOutputLength`; o `maxOutputLength` do próprio app define um limite menor para uma chamada. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` e `crypto.randomBytes` lançam um `RangeError` (`code` `ERR_OUT_OF_RANGE`) para um tamanho acima do limite de heap da VM, ou 1 GiB se não houver limite; `allocUnsafe` retorna memória zerada.

<a id="files"></a>

## Arquivos

`fs/promises` lê e escreve arquivos nativos em hosts desktop (macOS, Windows e Linux) e arquivos privados do app no navegador por meio do Origin Private File System (OPFS). Todo caminho é verificado em `capabilities.fs` antes de a operação começar: raízes `read` para `readFile`, `readdir`, `stat`, `lstat`, `readlink` e `exists`, raízes `write` para `writeFile`, `mkdir`, `rename`, `unlink` e `rmdir`. Toda falha rejeita a promise: um caminho fora das concessões com `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` o caminho como o app o escreveu), antes de qualquer trabalho em disco.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

As raízes são caminhos absolutos, `${dataDir}` (o diretório de dados deste app, escolhido pelo host), `${pluginDir}` (o diretório do app), `${homeDir}`, ou caminhos relativos ao diretório do app. Um caminho relativo em uma chamada é resolvido em cada raiz concedida, em sequência. Um host de incorporação pode restringir ainda mais as concessões. Toda operação permanece dentro da raiz concedida, symlinks incluídos; um caminho absoluto é verificado como foi escrito, então uma raiz é alcançada pelo seu próprio caminho (ou pelo caminho resolvido), e não por um link de fora dela. `lstat`, `readlink`, `exists`, `unlink`, `rename` e `rmdir` agem sobre o próprio symlink: `exists` é `true` para um symlink cujo destino não existe, e `unlink` remove o link e mantém o destino.

As falhas trazem as propriedades de erro do Node: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; `EILSEQ` para texto que não é UTF-8, `ERR_FS_FILE_TOO_LARGE` além do limite de leitura), `syscall` e `path`, de modo que `error.code === "ENOENT"` distingue um arquivo ausente. Um caminho fora das concessões rejeita com `ERR_ACCESS_DENIED`, uma chamada em iOS ou Android (cujos apps mantêm dados com [`Storage`](./nsh.md#storage)) com `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, e um argumento incorreto (uma codificação ou opção desconhecida) com um `TypeError`.

`readFile` retorna um `Uint8Array`, ou uma string com `"utf8"`, e lê arquivos de até 64 MiB. `writeFile` escreve uma string ou `Uint8Array` de até 8 MiB, criando ou substituindo um arquivo regular. `readdir` lista até 10 000 nomes (1 MiB deles; um diretório maior rejeita com um `RangeError`, `code` `ERR_OUT_OF_RANGE`), ordenados, ou `Dirent`s (`name`, `isDirectory()`) com `{ withFileTypes: true }`. `stat` e `lstat` resolvem um `Stats` com `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` como `Date`s, e `isFile()`, `isDirectory()` e `isSymbolicLink()`. `rmdir` remove um diretório vazio. Uma VM executa até 1024 operações por vez e mantém até 64 MiB de dados de arquivo em andamento (dados entregues a `writeFile` até serem escritos, dados lidos até a promise ser resolvida); uma chamada além desses limites rejeita com `ERR_NSH_QUOTA_EXCEEDED`, e um `writeFile` acima de 8 MiB com um `RangeError` (`code` `ERR_OUT_OF_RANGE`).

O armazenamento no navegador é limitado à origem da página e ao namespace próprio do app, com as mesmas concessões de arquivo e limites de tamanho verificados em Rust. O OPFS exige um contexto seguro, como HTTPS ou localhost. Os horários de modificação dos arquivos vêm dos metadados do navegador; horários de acesso/criação e modos desconhecidos são zero. `rename` usa uma movimentação atômica de handle do navegador e informa `ENOTSUP` quando o navegador não a oferece. As entradas no navegador são arquivos regulares ou diretórios, e `readlink` informa `EINVAL`.
<a id="processes"></a>

## Processos

`process.spawn` e `process.run` iniciam comandos em hosts desktop (macOS, Windows e Linux). O runtime executa o programa diretamente com um array de argumentos, sem shell, e é dono dos seus pipes; stdout e stderr chegam como UTF-8 incremental.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

Os comandos correspondem a `process.execute` exatamente: `git` e `/usr/bin/git` são concessões separadas. Comandos simples são resolvidos pelos diretórios absolutos do `PATH` do host; no Windows, um comando simples também encontra `<name>.com` e `<name>.exe` ali. Um arquivo batch (`.cmd`, `.bat`) é executado por meio de `cmd.exe`: conceda seu caminho absoluto (`C:\Windows\System32\cmd.exe`) e passe `/d`, `/c` e o script como argumentos. O ambiente de um processo filho é composto por `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` e `LC_*` do host, mais os nomes que `process.env` concede (comparados exatamente, ignorando maiúsculas e minúsculas apenas no Windows, cujo ambiente faz o mesmo). Um filho é executado no diretório de dados do app (criado se não existir), ou em `cwd`, um diretório existente dentro de uma raiz `fs.write`, já que o filho pode gravar onde é executado. Um host embarcador pode restringir as concessões.

```rust tabs
use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
};

spawn(async move {
    // `run`: the whole output once the command exits.
    if let Ok(Ok(output)) = blocking(|| Command::new("git").args(["status", "--short"]).output()).await {
        log::info!("{} {}", output.status, String::from_utf8_lossy(&output.stdout));
    }
    // `spawn` with `lines: true`: each line as it comes.
    let _ = blocking(|| -> std::io::Result<()> {
        let mut child = Command::new("git").args(["log", "--oneline"]).stdout(Stdio::piped()).spawn()?;
        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines() {
                log::info!("{}", line?);
            }
        }
        log::info!("done {}", child.wait()?);
        Ok(())
    })
    .await;
});
```

```tsx tabs
import process from "process";

const { code, stdout } = await process.run("git", ["status", "--short"]);
const child = process.spawn("git", ["log", "--oneline"], { lines: true });
child.on("stdout", (line) => console.log(line));
child.on("exit", ({ code, signal }) => console.log("done", code, signal));
```

`run` resolve `{ code, signal, stdout, stderr }` para qualquer status de saída: `code` é o status de saída e `signal` `null`, ou, quando um sinal encerrou o filho, `code` é `null` e `signal` é o nome do sinal (`"SIGTERM"`). Ele rejeita em toda falha. `spawn` retorna um filho imediatamente; `stdin: "pipe"` habilita `write` e `end`, e `lines: true` entrega linhas completas. `on(event, handler)` retorna o filho, e um handler recebe o payload do evento: o texto, ou `{ code, signal }` uma vez, após a saída final (com `error` quando o runtime encerrou o filho: um timeout, uma linha longa demais) (imediatamente, para um listener adicionado depois). `pid` é o id de processo do filho. `spawn` lança o que `run` rejeita, antes de o filho iniciar: um comando que `process.execute` não concede falha com `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` o comando), um `cwd` fora das concessões de `fs.write` falha com `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` o `cwd`), uma chamada fora dos desktops falha com `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, e uma chamada além do limite de filhos falha com `ERR_NSH_QUOTA_EXCEEDED`; uma falha de inicialização carrega `code` (`ENOENT` para um executável ausente, `EACCES` para um que o SO não consegue executar), `syscall` (`spawn <command>`) e `path`. `run` rejeita com `ETIMEDOUT` no prazo limite e com um `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) para saída além da sua captura; a saída de um filho iniciado carrega a mesma mensagem em `error` e seu código em `errorCode`. `process.dataDir` é `null` quando o host não tem diretório de dados. `kill`, um timeout, a limpeza do owner reativo e o teardown da VM encerram toda a árvore de processos: no Unix, seu grupo de processos recebe SIGTERM e, depois, SIGKILL após 250 ms (no teardown, SIGKILL imediatamente).

| Limite | Valor |
|---|---|
| `timeoutMs` | Até 4.294.967.295 ms; `run` tem padrão de 30 segundos, `spawn` executa até a saída |
| Captura de `run` | 8 MiB por stream |
| Uma linha com `lines: true` | 8 MiB |
| Filhos por VM | 32 |
| Saída em trânsito por VM | 8 MiB; os leitores esperam o JS consumi-la |
| stdin pendente por filho | 1 MiB; `write` lança `ERR_NSH_QUOTA_EXCEEDED` além disso |
| Listeners | 64 por evento por filho |

`process.exit(code?)` solicita que o host feche esta superfície do app. Conceda-o com `"exit": true` em `capabilities.process`; o engine encaminha a solicitação pelo comando de saída de app da plataforma. Uma chamada que a concessão não cobre lança `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Os hosts tratam solicitações de saída por meio de um handler de saída que instalam; fora disso, a chamada lança `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. No macOS, isso fecha a janela da superfície. Em um navegador, interrompe o app e limpa sua superfície, mantendo a página do host aberta. Um host embarcador controla como sua superfície trata a solicitação. O Gallery nega essa capacidade, de modo que sua ação **Request host exit** demonstra o tratamento de permissões e mantém a demonstração aberta.

<a id="network-permissions-and-boundaries"></a>

## Permissões e limites de rede

O `fetch` global mantém a implementação de HTTP com streaming do NSH, verificando `network.hosts` ou `network.http` para requisições e saltos de redirecionamento. O WebSocket oferece suporte a `ws:` / `wss:`, mensagens de texto e binárias, listeners de eventos e handshakes de fechamento. Um handshake de WebSocket é um GET HTTP, portanto o `WebSocket` global e o `connect` do módulo `websocket` usam as concessões HTTP: `ws` é verificado como `http` e `wss` como `https`, usando GET (uma regra também pode listar `ws` / `wss` em `schemes`). O NSH verifica a URL normalizada inicial antes de iniciar a conexão. O handshake nativo conecta a essa URL e rejeita redirecionamentos; os redirecionamentos e a política de conexão de WebSocket no navegador são controlados pelo navegador. Ambas as APIs recusam uma URL com credenciais ou fragmento. Cada VM mantém no máximo 32 WebSockets somando as duas APIs, e as mensagens têm no máximo 8 MiB em ambas.

Uma URL não concedida ao app é recusada antes de qualquer conexão ser iniciada. O `WebSocket` global a reporta como um navegador reporta uma conexão que falha: o construtor retorna o socket, que então dispara `error` e `close` (código 1006, `wasClean` `false`), de modo que os handlers que o app define logo após o construtor os recebem. O `connect` do módulo rejeita com `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` a URL). O 33º WebSocket lança (o construtor) ou rejeita (`connect`) com `ERR_NSH_QUOTA_EXCEEDED`, e uma URL malformada gera um `SyntaxError` (o construtor) ou um `TypeError` (`connect`).

O `WebSocket` global enfileira no máximo oito mensagens para envio, com no máximo 8 MiB em buffer (`bufferedAmount`); `send()` além de qualquer um dos limites lança `ERR_NSH_QUOTA_EXCEEDED`, e, quando o socket está em fechamento, `send()` descarta seus dados, como o de um navegador. Seu handshake e cada escrita expiram após 30 segundos, e o fechamento aguarda até 5 segundos pelo frame de fechamento do peer. As mensagens são entregues como eventos `message` à medida que chegam.

O `WebSocketConnection` do módulo `websocket` mantém no máximo oito operações pendentes (leituras, escritas, fechamento) e no máximo 8 MiB de escritas ainda não enviadas; um `write()` além de qualquer um dos limites rejeita com `ERR_NSH_QUOTA_EXCEEDED`, e uma mensagem acima de 8 MiB, com um `RangeError` (`code` `ERR_OUT_OF_RANGE`). Apenas um `read()` pode aguardar por vez; um segundo rejeita com um `TypeError`. As mensagens que chegam antes de serem lidas aguardam o app, e seu fluxo acompanha as leituras dele: enquanto oito mensagens ou 8 MiB aguardam sem leitura, a conexão para de ler da rede, de modo que o envio do peer também espera, e a leitura é retomada conforme o app lê. Resolução, conexão e handshake, somados, cada escrita e o fechamento expiram após 30 segundos.

`read()` resolve as mensagens em ordem de chegada. Quando a conexão foi encerrada de forma limpa (o peer a fechou, ou o app chamou `close()`) e todas as mensagens anteriores foram lidas, `read()` resolve `null`, como o de um socket `net` no EOF; `closeCode` e `closeReason` passam então a conter o código e o motivo do frame de fechamento (`null` enquanto a conexão está aberta; 1005 para um frame de fechamento sem código, 1006 para uma conexão que terminou sem handshake de fechamento). `read()` rejeita apenas em caso de falha, depois das mensagens que vieram antes dela, com seu `code`: `ERR_SOCKET_CLOSED` para uma conexão que terminou sem handshake de fechamento, `ETIMEDOUT`, o código do SO para um erro de socket, ou `EPROTO` para um erro de protocolo (com o `status` HTTP de um handshake recusado). `close(code?, reason?)` envia seu código (1000, o padrão, ou de 3000 a 4999) e o motivo (no máximo 123 bytes UTF-8) no frame de fechamento, como faz o `close()` do `WebSocket` global; um código ou motivo fora desses limites rejeita com um `RangeError` (`code` `ERR_OUT_OF_RANGE`). Ele descarta as mensagens ainda não lidas e resolve quando o peer responde ao handshake de fechamento.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` usa apenas `network.sockets`, uma lista de destinos `"host:port"` exatos (`"[::1]:9000"` para IPv6), verificados antes da consulta DNS. Cada entrada concede uma porta em um host; padrões de host, `network.hosts` e concessões HTTP cobrem apenas tráfego HTTP, e um app sem `"capabilities"` lista seus sockets também. O `Socket` retornado oferece `read(size?)`, `write(text)` e `close()`; as leituras retornam `Uint8Array`, ou `null` no EOF. Toda falha rejeita: um destino não concedido com `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), o 33º socket e escritas além dos 4 MiB que podem aguardar com `ERR_NSH_QUOTA_EXCEEDED`, uma leitura ou escrita acima de 1 MiB com um `RangeError` (`code` `ERR_OUT_OF_RANGE`); falhas de conexão e de E/S rejeitam com o `code` do Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) e `syscall`, a de uma conexão também com `address` e `port`, e uma escrita em um socket fechado com `ERR_SOCKET_CLOSED` (uma leitura nele retorna `null`). Conexões e E/S têm timeouts de 30 segundos, cada leitura/escrita é limitada a 1 MiB, no máximo 4 MiB de escritas podem aguardar envio, e `close()` encerra imediatamente leituras e escritas pendentes. Cada VM mantém no máximo 32 sockets abertos ou em conexão. Esta é uma interface de socket cliente baseada em promises.

O TCP bruto usa hosts nativos. Ambas as interfaces de WebSocket usam o transporte do navegador em apps web, mantendo as verificações de capacidade em Rust e os limites acima. Cabeçalhos de handshake personalizados no navegador reportam um erro explícito de opção não suportada. As políticas de conexão do navegador também se aplicam. As concessões do host embarcador são intersectadas com a declaração de capacidades do app.

<a id="websocket-grant-example"></a>

## Exemplo de concessão de WebSocket

Este fragmento de `nsh.json` permite o handshake GET para esta URL de `wss`, mantendo seu caminho e escopo HTTPS:

```json
{
  "capabilities": {
    "network": {
      "http": [{
        "host": "chat.example.com",
        "methods": ["GET"],
        "schemes": ["https"],
        "pathPrefix": "/socket"
      }]
    }
  }
}
```

```rust tabs
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::Message};

spawn(async move {
    let _ = background(async {
        let (mut socket, _) = connect_async("wss://chat.example.com/socket").await?;
        socket.send(Message::text("hello")).await?;
        while let Some(message) = socket.next().await {
            log::info!("{}", message?);
        }
        Ok::<_, tokio_tungstenite::tungstenite::Error>(())
    })
    .await;
});
```

```tsx tabs
const socket = new WebSocket("wss://chat.example.com/socket");
socket.addEventListener("open", () => socket.send("hello"));
socket.addEventListener("message", (event) => console.log(event.data));
```

<a id="tcp-grant-example"></a>

## Exemplo de concessão de TCP

O TCP usa uma concessão de socket: o host e a porta exatos aos quais o app se conecta.

```json
{
  "capabilities": {
    "network": { "sockets": ["tcp.example.com:9000"] }
  }
}
```

```rust tabs
use std::{
    io::{Read, Write},
    net::TcpStream,
};

spawn(async move {
    let reply = blocking(|| -> std::io::Result<String> {
        let mut socket = TcpStream::connect(("tcp.example.com", 9000))?;
        socket.write_all(b"hello\n")?;
        let mut bytes = [0; 1024];
        let n = socket.read(&mut bytes)?;
        Ok(String::from_utf8_lossy(&bytes[..n]).into_owned())
    })
    .await;
    if let Ok(Ok(reply)) = reply {
        log::info!("{reply}");
    }
});
```

```tsx tabs
import { connect } from "net";

const socket = await connect({ host: "tcp.example.com", port: 9000 });
try {
  await socket.write("hello\n");
  const bytes = await socket.read(1024);
  if (bytes) console.log(new TextDecoder().decode(bytes));
} finally {
  socket.close();
}
```

## Gallery

Abra **Standard APIs** em `examples/gallery` para executar operações de arquivo, processos filhos, TCP e ambas as interfaces de WebSocket, e inspecionar metadados do host e jobs enfileirados. A ação de utilitários demonstra buffers, hashing, compressão e URLs de arquivo. Cada ação exibe seu resultado ou erro. Os arquivos ficam em um diretório temporário dentro do diretório de dados do próprio Gallery e são removidos após a ação. As ações de TCP e WebSocket se conectam a servidores de eco locais nas portas 9876 e 9877. Na web, as ações de arquivo exercitam o OPFS, os utilitários rodam em WebAssembly e ambas as ações de WebSocket usam conexões do navegador; as ações de processo e TCP exibem os erros de plataforma tipados do host.

O **AI Chat** do Gallery usa `process.spawn` para conversar, no desktop, por meio de um CLI do Claude ou do Codex instalado localmente. Faça login pelo CLI em um terminal e, em seguida, escolha o provedor no compositor. As respostas usam a conversa como contexto; Stop e sair da tela encerram o processo filho. Web e mobile executam conversas com streaming roteirizado, incluindo raciocínio, cards de ferramentas e recuperação de erros.
