---
title: "표준 모듈"
description: "Node 형태의 표준 모듈 11개: 고정된 LLRT 유틸리티와 권한 검사를 거치는 파일, 프로세스, 네트워킹."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell은 TSX용 표준 모듈 11개를 제공하며, 모듈은 베어 이름(bare name)으로 import합니다(Rust 코드는 Rust 자체 라이브러리를 사용합니다: [Rust에서 사용하기](#from-rust)). 이 모듈들은 gpui-shell의 모듈과 호환되는 Node 형태의 API로, 앱의 VM 안에서 NSH의 네이티브 런타임 위에서 실행되며 capability 검사는 Rust에서 수행됩니다. `.nsh/types`의 TypeScript 선언은 모듈과 동일한 사양(spec)에서 생성되므로, 타입에 보이는 내용이 곧 런타임이 export하는 내용입니다.

| 모듈 | Export 목록 |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); 전역으로도 제공: `Buffer` |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); 전역으로도 제공: `crypto` |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; NSH의 전역 클래스: `URL`, `URLSearchParams` |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, 각각 `Sync` 형태 제공, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: VM의 `console` (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; default 객체에는 `env`, `dataDir`도 있으며 전역 `process`과 동일한 객체 |
| `net` | `connect`, `Socket`, default |
| `websocket` | `WebSocketConnection`(`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`)로 resolve되는 `connect(url, options?)`, `WebSocketConnection`, default; 네이티브 호스트에서는 전역 `WebSocket` 생성자 |

<a id="from-rust"></a>

## Rust에서 사용하기

Rust 코드는 Rust 표준 라이브러리와 crates.io를 사용해 앱 자체의 네이티브 코드에서 같은 작업을 수행합니다. 블로킹 호출은 런타임의 스레드에서 `blocking(…)`로, 비동기 호출은 `background(…)`(`nsh_core::prelude`)로 실행되며, 결과는 태스크를 통해 컴포넌트로 돌아옵니다. `nsh.json`의 `capabilities`는 앱의 TSX와 NSH의 서비스(`fetch`, 클립보드)를 제어하며, 앱 자체의 Rust 코드는 앱 프로세스의 권한으로 실행됩니다. 브라우저 앱에서 Rust 코드는 `fetch`로 네트워크에 접근하고 `nsh_core::storage::Storage`로 데이터를 보관합니다.

| 모듈 | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, `base64` crate |
| `crypto` | `sha2`, `hmac`, `rand`, `uuid` 등의 crate |
| `path` | `std::path` |
| `url` | `url` crate |
| `zlib` | `flate2`, `brotli`, `zstd` 등의 crate |
| `os` | `std::env::consts`, `os()` |
| `console` | `log` crate |
| `fs/promises` | `blocking(…)`의 `std::fs`; 키-값 데이터에는 `Storage` |
| `process` | `blocking(…)`의 `std::process::Command` |
| `net` | `blocking(…)`의 `std::net::TcpStream` 또는 `background(…)`의 `tokio::net` |
| `websocket` | `background(…)`에서 `tokio-tungstenite` 같은 crate |

<a id="imports-and-generated-types"></a>

## Import와 생성된 타입

각 모듈은 표에 나온 이름 그대로 import합니다: `import { join } from "path"`, `import fs from "fs/promises"`. 번들러는 이 import를 그대로 유지하며 런타임이 네이티브로 제공합니다. 카탈로그는 이 11개 이름이 전부입니다. `buffer`, `crypto`, `path`, `url`, `zlib`은 LLRT의 구현이며 `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`에 고정되어 있고, 선언은 해당 리비전에서 런타임이 가진 export에 맞춰 추출한 것입니다. 나머지는 NSH 자체 구현입니다. NSH는 URL, Blob, stream, event 클래스의 정체성(identity)을 유지합니다.

11개 모듈은 모두 네이티브 호스트와 브라우저 앱에서 로드됩니다. `Buffer`, 해싱, crypto, 압축은 WebAssembly에서 동일한 이식 가능한 Rust 구현을 사용하며, 동기 API도 포함합니다. 난수는 브라우저의 암호학적 엔트로피를 사용합니다. 브라우저의 `path` 작업은 POSIX 경로와 가상 `/` 작업 디렉터리를 사용합니다. 브라우저 파일은 영구적인 앱 전용 저장소를 사용하고, WebSocket은 브라우저 전송 방식을 사용합니다. 프로세스 실행과 raw TCP 호출은 브라우저에서 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`로 실패합니다.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Node.js 및 gpui-shell과의 비교

이 모듈들은 export하는 범위에 한해 Node의 이름과 형태를 따르고, gpui-shell이 동작을 정의한 부분은 gpui-shell의 동작을 따릅니다. NSH 고유의 선택은 다음과 같습니다.

- 대상이 없는 심볼릭 링크일 때 `fs/promises`의 `exists` 값은 `true`이며, `unlink`, `rename`, `rmdir`, `lstat`, `readlink`은 심볼릭 링크 자체에 작동합니다.
- `Stats`, `Dirent` 객체는 Node와 마찬가지로 필드(`size`, `mtimeMs`, `name`, ...)를 자체 속성(own property)으로 가지며, `isFile()`, `isDirectory()`, `isSymbolicLink()`는 프로토타입에 있습니다.
- `ChildProcess` 리스너는 이벤트의 페이로드를 받습니다. 즉 출력 텍스트, 또는 종료 시의 `{ code, signal }`(런타임이 자식 프로세스를 종료한 경우에는 `error`, `errorCode` 포함)입니다. `on`은 자식 프로세스를 반환합니다. `run`은 `{ code, signal, stdout, stderr }`로 resolve되며, 이는 자식 프로세스를 종료시킨 시그널이 포함된 gpui-shell의 출력입니다.
- 자식 프로세스의 환경은 호스트가 제공하는 소수의 변수에 앱에 허용된 이름을 더한 것이며, 앱의 데이터 디렉터리 또는 `fs.write` 루트 안의 `cwd`에서 실행됩니다([프로세스](#processes)).
- `process.platform`, `process.arch`, `os.platform()`, `os.arch()`은 gpui-shell과 마찬가지로 Rust의 `std::env::consts` 이름을 제공합니다: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"`([OS 메타데이터](#os-metadata-and-logging)).
- 호스트에 데이터 디렉터리가 없으면 `process.dataDir`은 `null`입니다. `process.exit`은 호스트에 앱 화면(surface)을 닫도록 요청합니다.
- 각 API에는 제한이 있습니다. 크기, 개수, 타임아웃은 아래 각 모듈에 나열되어 있습니다.

<a id="failures"></a>

## 실패 처리

Promise를 반환하는 함수는 Node의 `fs/promises`처럼 모든 실패를 reject로 보고합니다. 잘못된 인수, 앱에 허용되지 않은 경로나 호스트, 소진된 제한, I/O 오류가 모두 해당하므로 하나의 `catch`(또는 `.catch`)로 모두 처리할 수 있습니다. 동기 함수(`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, 전역 `WebSocket`의 생성자, `send`)는 예외를 던집니다. 잘못된 사용(잘못된 타입의 인수, 범위를 벗어난 옵션)은 `TypeError` 또는 `RangeError`입니다. 앱이 처리할 수 있는 모든 실패에는 릴리스가 바뀌어도 동일하게 유지되는 `code`가 있습니다. 메시지는 사람을 위한 것이며 바뀔 수 있으므로, 앱은 `code`로 분기해야 합니다.

| `code` | 의미 |
|---|---|
| `ERR_ACCESS_DENIED` | 앱의 `capabilities`가 해당 호출을 허용하지 않습니다. 오류에는 `nsh.json`에서의 capability 키인 `permission`(`"fs"`, `"process"`, `"network"`)과 요청된 대상인 `resource`이 들어 있습니다: 경로, 명령(`process.exit`의 경우 `"exit"`), 소켓의 `"host:port"` 또는 WebSocket의 URL |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | 다른 플랫폼용 호출입니다: 파일은 데스크톱과 브라우저에서, 프로세스는 데스크톱에서, TCP 소켓은 네이티브 호스트에서, `os.homedir()`은 홈 디렉터리를 설정한 호스트에서 동작합니다 |
| `ERR_NSH_QUOTA_EXCEEDED` | 런타임의 제한이 소진되었습니다: 진행 중인 작업 또는 데이터, 자식 프로세스, 소켓, WebSocket, 전송 대기 중인 바이트, 리스너 |
| `ETIMEDOUT` | 호출이 시간 초과되었습니다: `run`의 `timeoutMs`, 연결, WebSocket 핸드셰이크, 쓰기 또는 닫기 |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | 운영체제의 응답으로, Node의 코드를 사용합니다. `EACCES`, `EPERM`은 앱의 capability와는 별개로 OS가 파일을 거부한 경우입니다 |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | 크기 제한 초과, 닫힌 연결, `run`의 캡처 한도를 넘는 출력에 대한 Node의 코드 |

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

호스트 앱은 앱이 선언한 것보다 적게 허용할 수 있으므로([샌드박스와 Capability](../docs/sandbox-and-capabilities.md)), 앱은 `ERR_ACCESS_DENIED`를 실패한 요청과 같은 방식으로 처리해야 합니다.

<a id="os-metadata-and-logging"></a>

## OS 메타데이터와 로깅

`os.platform(): string`, `os.arch(): string`은 실제 네이티브 호스트의 OS와 아키텍처를 보고하며, `process.platform`, `process.arch`도 같은 값을 가집니다. 이 값은 gpui-shell과 마찬가지로 Rust의 `std::env::consts::OS`, `ARCH` 이름입니다: OS는 `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`, 아키텍처는 `"aarch64"`, `"x86_64"`이므로 앱은 이 값과 직접 비교할 수 있습니다(`process.platform === "macos"`). `os.EOL: string`은 호스트의 줄 구분자입니다. `os.homedir(): string`은 설정된 절대 호스트 홈 경로를 반환하며, 설정된 것이 없으면 `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 오류를 던집니다. 디렉터리 경로는 메타데이터일 뿐이며, 파일 작업에는 여전히 `fs.read` / `fs.write` 허용이 필요합니다.

브라우저 앱은 빈 `process.env` 객체를 읽습니다. 홈 경로와 환경 변수는 네이티브 호스트에 속하므로 `os.homedir()`은 브라우저에서 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`를 던집니다.

`import console from "console"`은 VM의 전역 `console` 객체를 공유합니다. 이 모듈은 default export만 있으며 `log`, `info`, `debug`, `warn`, `error`를 지원하고, 각각의 시그니처는 `(...values: unknown[]): void`입니다. NSH의 로거 포맷을 사용합니다.

<a id="compression"></a>

## 압축

`zlib`은 LLRT의 것이며 NSH가 한 가지 제한을 추가합니다. 각 압축 해제(`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` 및 해당 `Sync` 형태)는 최대 64 MiB, 또는 VM의 힙 제한이 더 작으면 그 값까지만 생성합니다. 출력이 더 길면 Node.js가 `maxOutputLength`에 대해 그렇게 하듯 `RangeError`을 던지며, 앱 자체의 `maxOutputLength`로 한 번의 호출에 더 낮은 한도를 설정할 수 있습니다. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow`, `crypto.randomBytes`은 VM의 힙 제한(없으면 1 GiB)을 넘는 크기에 대해 `RangeError`(`code` `ERR_OUT_OF_RANGE`)을 던지며, `allocUnsafe`은 0으로 채워진 메모리를 반환합니다.

<a id="files"></a>

## 파일

`fs/promises`은 데스크톱 호스트(macOS, Windows, Linux)의 네이티브 파일을 읽고 쓰며, 브라우저에서는 Origin Private File System(OPFS)을 통해 앱 전용 브라우저 파일을 읽고 씁니다. 모든 경로는 작업이 시작되기 전에 `capabilities.fs`에 대해 검사됩니다: `readFile`, `readdir`, `stat`, `lstat`, `readlink`, `exists`에는 `read` 루트가, `writeFile`, `mkdir`, `rename`, `unlink`, `rmdir`에는 `write` 루트가 필요합니다. 모든 실패는 promise를 reject합니다: 허용 범위를 벗어난 경로는 디스크 작업 전에 `code` `ERR_ACCESS_DENIED`(`permission` `"fs"`, `resource`는 앱이 작성한 그대로의 경로)로 reject됩니다.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

루트는 절대 경로, `${dataDir}`(호스트가 선택한 이 앱의 데이터 디렉터리), `${pluginDir}`(앱의 디렉터리), `${homeDir}`, 또는 앱 디렉터리 기준 상대 경로입니다. 호출에서의 상대 경로는 허용된 각 루트에서 차례로 해석됩니다. 임베딩 호스트는 허용 범위를 더 좁힐 수 있습니다. 모든 작업은 심볼릭 링크를 포함해 허용된 루트 안에 머뭅니다. 절대 경로는 작성된 그대로 검사되므로, 루트는 루트 자신의 경로(또는 해석된 경로)로 접근해야 하며 루트 밖의 링크를 통해서는 접근할 수 없습니다. `lstat`, `readlink`, `exists`, `unlink`, `rename`, `rmdir`은 심볼릭 링크 자체에 작동합니다. 대상이 없는 심볼릭 링크에 대해 `exists`은 `true`이며, `unlink`은 링크를 제거하고 대상은 유지합니다.

실패에는 Node의 오류 속성이 있습니다: `code`(`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; UTF-8이 아닌 텍스트에는 `EILSEQ`, 읽기 제한 초과에는 `ERR_FS_FILE_TOO_LARGE`), `syscall`, `path`이므로 `error.code === "ENOENT"`로 존재하지 않는 파일을 구별할 수 있습니다. 허용 범위를 벗어난 경로는 `ERR_ACCESS_DENIED`로 reject되고, iOS나 Android(앱이 데이터를 [`Storage`](./nsh.md#storage)에 보관함)에서의 호출은 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`로, 잘못된 인수(알 수 없는 인코딩이나 옵션)는 `TypeError`로 reject됩니다.

`readFile`은 `Uint8Array`을 반환하며, `"utf8"`를 지정하면 문자열을 반환하고 최대 64 MiB까지의 파일을 읽습니다. `writeFile`은 최대 8 MiB의 문자열 또는 `Uint8Array`을 쓰며 일반 파일을 생성하거나 교체합니다. `readdir`은 최대 10 000개의 이름(그중 1 MiB까지; 더 큰 디렉터리는 `RangeError`, `code` `ERR_OUT_OF_RANGE`로 reject)을 정렬해서 나열하거나, `{ withFileTypes: true }`를 지정하면 `Dirent`(`name`, `isDirectory()`)을 반환합니다. `stat`, `lstat`은 `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime`(`Date`)와 `isFile()`, `isDirectory()`, `isSymbolicLink()`를 가진 `Stats`로 resolve됩니다. `rmdir`은 비어 있는 디렉터리 하나를 제거합니다. 하나의 VM은 동시에 최대 1024개의 작업을 실행하고 최대 64 MiB의 파일 데이터를 진행 중 상태로 보유합니다(쓰기가 끝날 때까지 `writeFile`에 넘겨진 데이터, promise가 settle될 때까지 읽은 데이터). 이 제한을 넘는 호출은 `ERR_NSH_QUOTA_EXCEEDED`로 reject되고, 8 MiB를 넘는 `writeFile`은 `RangeError`(`code` `ERR_OUT_OF_RANGE`)로 reject됩니다.

브라우저 저장소는 페이지의 origin과 앱 자체 네임스페이스로 범위가 제한되며, 동일한 파일 허용과 크기 제한이 Rust에서 검사됩니다. OPFS에는 HTTPS나 localhost 같은 보안 컨텍스트가 필요합니다. 파일 수정 시간은 브라우저 메타데이터에서 가져오며, 알 수 없는 접근/생성 시간과 모드는 0입니다. `rename`은 브라우저의 원자적 핸들 이동을 사용하며, 브라우저가 이를 제공하지 않으면 `ENOTSUP`을 보고합니다. 브라우저 항목은 일반 파일 또는 디렉터리이며 `readlink`은 `EINVAL`을 보고합니다.
<a id="processes"></a>

## 프로세스

`process.spawn` 및 `process.run` 호출은 데스크톱 호스트(macOS, Windows, Linux)에서 명령을 실행합니다. 런타임은 셸 없이 인자 배열로 프로그램을 직접 실행하며 파이프를 직접 소유합니다. stdout과 stderr는 증분 UTF-8로 도착합니다.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

명령은 `process.execute` 기준으로 정확히 일치해야 합니다. `git` 및 `/usr/bin/git` 권한은 서로 별개입니다. 경로 없는 명령은 호스트의 `PATH`에 포함된 절대 경로 디렉터리를 통해 해석되며, Windows에서는 경로 없는 명령이 해당 위치의 `<name>.com` 및 `<name>.exe`도 찾습니다. 배치 파일(`.cmd`, `.bat`)은 `cmd.exe`를 통해 실행됩니다. 그 절대 경로(`C:\Windows\System32\cmd.exe`)를 허용하고, `/d`, `/c`, 스크립트를 인자로 전달하세요. 자식 프로세스의 환경은 호스트의 `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG`, `LC_*`에 더해 `process.env`에서 허용한 이름으로 구성됩니다(이름은 정확히 일치해야 하며, 환경 변수 이름의 대소문자를 구분하지 않는 Windows에서만 대소문자를 무시합니다). 자식 프로세스는 앱의 데이터 디렉터리(없으면 생성됨)에서 실행되거나 `cwd`에서 실행되며, 이는 `fs.write` 루트 안에 있는 기존 디렉터리여야 합니다. 자식 프로세스가 실행 위치에 쓸 수 있기 때문입니다. 임베딩 호스트는 권한을 더 좁힐 수 있습니다.

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

종료 상태와 관계없이 `run` 호출은 `{ code, signal, stdout, stderr }` 값으로 resolve됩니다. `code` 값은 종료 상태이며 `signal` 값은 `null`입니다. 시그널로 자식 프로세스가 종료된 경우 `code` 값은 `null`입니다. `signal` 값은 시그널 이름(`"SIGTERM"`)입니다. 모든 실패 시 reject됩니다. `spawn` 호출은 자식 프로세스를 즉시 반환합니다. `stdin: "pipe"` 사용 시 `write` 및 `end` 사용이 가능해지고, `lines: true` 사용 시 완전한 줄 단위로 전달됩니다. `on(event, handler)` 호출은 자식 프로세스를 반환하며, 핸들러는 이벤트의 페이로드를 받습니다. 페이로드는 텍스트이거나, 마지막 출력 이후 한 번 전달되는 `{ code, signal }`입니다(런타임이 자식 프로세스를 종료한 경우, 즉 타임아웃이나 지나치게 긴 줄의 경우에는 `error` 값과 함께 전달되며, 나중에 추가한 리스너에는 즉시 전달됩니다). `pid` 값은 자식 프로세스의 프로세스 ID입니다. `spawn` 호출은 자식 프로세스가 시작되기 전에 `run` 호출이 reject하는 것과 동일한 오류를 throw합니다. `process.execute`에서 허용하지 않은 명령은 `ERR_ACCESS_DENIED` 오류로 실패하고(`permission` `"process"`, `resource` 값은 해당 명령), `fs.write` 권한 범위를 벗어난 `cwd` 값은 `ERR_ACCESS_DENIED` 오류로 실패하며(`permission` `"fs"`, `resource` 값은 해당 `cwd`), 데스크톱이 아닌 환경에서의 호출은 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 오류로, 자식 프로세스 한도를 넘긴 호출은 `ERR_NSH_QUOTA_EXCEEDED` 오류로 실패합니다. 실행 실패 시에는 `code` 값(실행 파일이 없으면 `ENOENT`, OS가 실행할 수 없는 파일이면 `EACCES`), `syscall` 값(`spawn <command>`), `path` 값이 함께 전달됩니다. `run` 호출은 제한 시간에 도달하면 `ETIMEDOUT` 오류로, 캡처 한도를 넘는 출력에 대해서는 `RangeError` 오류(`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`)로 reject됩니다. spawn된 자식 프로세스의 종료에는 같은 메시지가 `error`에, 코드가 `errorCode`에 담깁니다. 호스트에 데이터 디렉터리가 없으면 `process.dataDir` 값은 `null`입니다. `kill`, 타임아웃, 리액티브 소유자의 정리(cleanup), VM 해제(teardown)는 전체 프로세스 트리를 종료합니다. Unix에서는 프로세스 그룹에 SIGTERM을 보낸 뒤 250ms 후 SIGKILL을 보냅니다(해제 시에는 즉시 SIGKILL).

| 제한 | 값 |
|---|---|
| `timeoutMs` | 최대 4,294,967,295ms. `run` 기본값은 30초, `spawn` 사용 시 종료될 때까지 실행 |
| `run`의 캡처 | 스트림당 8 MiB |
| `lines: true` 사용 시 한 줄 | 8 MiB |
| VM당 자식 프로세스 수 | 32 |
| VM당 처리 중인 출력 | 8 MiB. JS가 가져갈 때까지 리더가 대기 |
| 자식 프로세스당 대기 중인 stdin | 1 MiB. 초과 시 `write` 호출은 `ERR_NSH_QUOTA_EXCEEDED` 오류를 throw |
| 리스너 | 자식 프로세스당 이벤트별 64개 |

`process.exit(code?)` 호출은 호스트에 이 앱 서피스를 닫도록 요청합니다. `"exit": true` 항목을 `capabilities.process`에 지정해 허용합니다. 엔진은 플랫폼의 앱 종료 명령을 통해 요청을 전달합니다. 권한이 허용하지 않는 호출은 `ERR_ACCESS_DENIED` 오류를 throw합니다(`permission` `"process"`, `resource` `"exit"`). 호스트는 자신이 설치한 종료 핸들러를 통해 종료 요청을 받으며, 그 외의 환경에서는 호출이 `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` 오류를 throw합니다. macOS에서는 서피스 창을 닫습니다. 브라우저에서는 호스트 페이지를 열어 둔 채 앱을 중지하고 서피스를 비웁니다. 임베딩 호스트가 서피스의 요청 처리 방식을 제어합니다. Gallery는 이 기능을 거부하므로 **Request host exit** 동작이 권한 처리를 보여 주고 데모를 열어 둡니다.

<a id="network-permissions-and-boundaries"></a>

## 네트워크 권한과 경계

전역 `fetch` API는 NSH의 스트리밍 HTTP 구현을 유지하며, 요청과 리디렉션 홉마다 `network.hosts` 또는 `network.http` 권한을 확인합니다. WebSocket은 `ws:` / `wss:`, 텍스트 및 바이너리 메시지, 이벤트 리스너, 종료 핸드셰이크를 지원합니다. WebSocket 핸드셰이크는 HTTP GET이므로 전역 `WebSocket` 및 `websocket` 모듈의 `connect` 모두 HTTP 권한을 사용합니다. GET을 사용하며, `ws` 주소는 `http` 요청으로, `wss` 주소는 `https` 요청으로 확인합니다(규칙의 `schemes`에 `ws` / `wss` 값을 함께 나열할 수도 있습니다). NSH는 연결을 시작하기 전에 정규화된 초기 URL을 확인합니다. 네이티브 핸드셰이크는 해당 URL에 연결하며 리디렉션을 거부합니다. 브라우저 WebSocket의 리디렉션과 연결 정책은 브라우저가 제어합니다. 두 API 모두 자격 증명이나 프래그먼트가 포함된 URL을 거부합니다. 각 VM은 두 API를 합쳐 최대 32개의 WebSocket을 보유하며, 메시지는 두 API 모두 최대 8 MiB입니다.

앱에 허용되지 않은 URL은 연결이 시작되기 전에 거부됩니다. 전역 `WebSocket` 객체는 브라우저가 연결 실패를 보고하는 방식으로 이를 보고합니다. 생성자가 소켓을 반환하고, 이 소켓이 `error` 및 `close` 이벤트를 발생시키므로(코드 1006, `wasClean` `false`), 앱이 생성자 직후에 설정한 핸들러가 이를 받습니다. 모듈의 `connect` 호출은 `ERR_ACCESS_DENIED` 오류로 reject됩니다(`permission` `"network"`, `resource` 값은 해당 URL). 33번째 WebSocket은 생성자에서 throw되거나 `connect`에서 reject되며, 오류는 `ERR_NSH_QUOTA_EXCEEDED`입니다. 잘못된 형식의 URL은 `SyntaxError`(생성자) 또는 `TypeError`(`connect`)입니다.

전역 `WebSocket` API는 전송 대기 메시지를 최대 8개까지 큐에 넣으며 버퍼링은 최대 8 MiB입니다(`bufferedAmount`). 어느 한도든 초과한 `send()` 호출은 `ERR_NSH_QUOTA_EXCEEDED` 오류를 throw하고, 소켓이 닫히는 중이면 브라우저와 마찬가지로 `send()` 호출은 데이터를 버립니다. 핸드셰이크와 각 쓰기는 30초 후 타임아웃되며, 닫기는 상대방의 close 프레임을 최대 5초 기다립니다. 메시지는 도착하는 대로 `message` 이벤트로 전달됩니다.

`websocket` 모듈의 `WebSocketConnection` 하나당 대기 중인 작업(읽기, 쓰기, close)은 최대 8개, 아직 전송되지 않은 쓰기는 최대 8 MiB입니다. 어느 한도든 초과한 `write()` 호출은 `ERR_NSH_QUOTA_EXCEEDED` 오류로 reject되고, 8 MiB를 넘는 메시지는 `RangeError` 오류(`code` `ERR_OUT_OF_RANGE`)로 reject됩니다. `read()` 호출은 한 번에 하나만 대기할 수 있으며, 두 번째 호출은 `TypeError` 오류로 reject됩니다. 도착했지만 아직 읽지 않은 메시지는 앱을 기다리며, 흐름은 앱의 읽기를 따릅니다. 읽지 않은 메시지가 8개이거나 8 MiB에 이르면 연결이 네트워크에서 읽기를 중단하여 상대방의 전송도 대기하게 되고, 앱이 읽는 만큼 읽기가 재개됩니다. 주소 확인, 연결, 핸드셰이크를 합친 시간, 각 쓰기, 닫기는 30초 후 타임아웃됩니다.

`read()` 호출은 메시지를 도착 순서대로 resolve합니다. 연결이 정상적으로 닫히고(상대방이 닫았거나 앱에서 `close()` 호출) 그 이전의 모든 메시지를 읽고 나면, `read()` 호출은 `null` 값으로 resolve되며, 이는 EOF에서 `net` 소켓의 읽기 동작과 같습니다. 이때 `closeCode` 및 `closeReason` 값에 close 프레임의 코드와 사유가 담깁니다(연결이 열려 있는 동안은 `null`, 코드 없는 close 프레임은 1005, 닫기 핸드셰이크 없이 끝난 연결은 1006). `read()` 호출은 실패한 경우에만, 그 이전의 메시지를 모두 전달한 뒤 `code` 값과 함께 reject됩니다. 닫기 핸드셰이크 없이 끝난 연결에는 `ERR_SOCKET_CLOSED`, 소켓 오류에는 OS의 코드인 `ETIMEDOUT`, 프로토콜 오류에는 `EPROTO`이 사용됩니다(거부된 핸드셰이크의 경우 HTTP `status` 포함). `close(code?, reason?)` 호출은 코드(기본값 1000 또는 3000~4999)와 사유(UTF-8 최대 123바이트)를 close 프레임에 담아 전송하며, 전역 `WebSocket`의 `close()` 동작과 같습니다. 이 범위를 벗어나는 코드나 사유는 `RangeError` 오류(`code` `ERR_OUT_OF_RANGE`)로 reject됩니다. 아직 읽지 않은 메시지는 버리며, 상대방이 닫기 핸드셰이크에 응답하면 resolve됩니다.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` 호출은 `network.sockets`만 사용합니다. 이는 정확한 `"host:port"` 대상의 목록(IPv6의 경우 `"[::1]:9000"` 형식)으로, DNS 조회 전에 확인됩니다. 각 항목은 한 호스트의 포트 하나를 허용합니다. 호스트 패턴, `network.hosts`, HTTP 권한은 HTTP 트래픽에만 적용되며, `"capabilities"` 없는 앱도 소켓을 나열합니다. 반환된 `Socket` 객체는 `read(size?)`, `write(text)`, `close()` 메서드를 제공합니다. 읽기는 `Uint8Array` 값을, EOF에서는 `null` 값을 반환합니다. 모든 실패는 reject됩니다. 허용되지 않은 대상은 `ERR_ACCESS_DENIED` 오류(`permission` `"network"`, `resource` `"host:port"`), 33번째 소켓과 대기 가능한 4 MiB를 넘는 쓰기는 `ERR_NSH_QUOTA_EXCEEDED` 오류, 1 MiB를 넘는 읽기나 쓰기는 `RangeError` 오류(`code` `ERR_OUT_OF_RANGE`)로 reject됩니다. 연결 및 I/O 실패는 Node의 `code` 값(`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET` 등)과 `syscall` 값으로 reject되며, 연결 실패에는 `address` 및 `port` 값도 포함됩니다. 닫힌 소켓에 대한 쓰기는 `ERR_SOCKET_CLOSED` 오류로 reject됩니다(같은 소켓의 읽기는 `null` 값을 반환). 연결과 I/O에는 30초 타임아웃이 있고, 각 읽기/쓰기는 1 MiB로 제한되며, 전송 대기 중인 쓰기는 최대 4 MiB입니다. `close()` 호출은 대기 중인 읽기와 쓰기를 즉시 종료합니다. 각 VM은 열려 있거나 연결 중인 소켓을 최대 32개까지 유지합니다. 이는 Promise 기반 클라이언트 소켓 인터페이스입니다.

원시 TCP는 네이티브 호스트를 사용합니다. 웹 앱에서는 두 WebSocket 인터페이스 모두 브라우저 전송을 사용하며, Rust 기능 검사와 위의 제한은 그대로 유지됩니다. 사용자 지정 브라우저 핸드셰이크 헤더는 지원되지 않는 옵션이라는 명시적 오류를 보고합니다. 브라우저 연결 정책도 함께 적용됩니다. 임베딩 권한은 앱의 기능 선언과의 교집합으로 적용됩니다.

<a id="websocket-grant-example"></a>

## WebSocket 권한 부여 예시

이 `nsh.json` 조각은 이 `wss` URL에 대한 GET 핸드셰이크를 허용하며, 경로와 HTTPS 범위를 유지합니다.

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

## TCP 권한 부여 예시

TCP는 소켓 권한을 사용합니다. 앱이 연결하는 정확한 호스트와 포트입니다.

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

`examples/gallery`에서 **Standard APIs**를 열어 파일 작업, 자식 프로세스, TCP, 두 WebSocket 인터페이스를 실행하고 호스트 메타데이터와 대기 중인 작업을 확인해 보세요. 유틸리티 동작은 버퍼, 해싱, 압축, 파일 URL을 보여 줍니다. 각 동작은 결과 또는 오류를 표시합니다. 파일은 Gallery 자체 데이터 디렉터리 아래의 임시 디렉터리에 저장되며 동작이 끝나면 삭제됩니다. TCP 및 WebSocket 동작은 포트 9876과 9877의 로컬 에코 서버에 연결합니다. 웹에서는 파일 동작이 OPFS를 사용하고, 유틸리티는 WebAssembly에서 실행되며, 두 WebSocket 동작 모두 브라우저 연결을 사용합니다. 프로세스 및 TCP 동작은 호스트의 타입이 지정된 플랫폼 오류를 표시합니다.

Gallery의 **AI Chat**은 데스크톱에서 로컬에 설치된 Claude 또는 Codex CLI와 대화하기 위해 `process.spawn` 호출을 사용합니다. 터미널에서 CLI로 로그인한 다음 컴포저에서 제공자를 선택하세요. 응답은 대화를 컨텍스트로 사용하며, Stop을 누르거나 화면을 벗어나면 자식 프로세스가 종료됩니다. 웹과 모바일에서는 추론, 도구 카드, 오류 복구를 포함한 스크립트된 스트리밍 대화를 실행합니다.
