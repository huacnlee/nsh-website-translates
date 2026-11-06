---
title: "Стандартные модули"
description: "Одиннадцать стандартных модулей в стиле Node: зафиксированные по версии утилиты LLRT, а также файлы, процессы и сеть с проверкой прав доступа."
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell предоставляет одиннадцать стандартных модулей для TSX, которые импортируются по голым именам (код на Rust использует собственные библиотеки Rust: [Из Rust](#from-rust)). Это API в стиле Node, совместимые с API gpui-shell. Они работают в VM приложения на нативной среде выполнения NSH, а их разрешения проверяются в Rust. Объявления TypeScript в `.nsh/types` генерируются из тех же спецификаций, что и сами модули, поэтому типы показывают именно то, что экспортирует среда выполнения.

| Модуль | Экспорты |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); `Buffer` также является глобальным |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); `crypto` также является глобальным |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; `URL` и `URLSearchParams` — глобальные классы NSH |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, каждая со своей формой `Sync`, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: `console` из VM (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; у объекта default также есть `env` и `dataDir`, и он является глобальным `process` |
| `net` | `connect`, `Socket`, default |
| `websocket` | `connect(url, options?)`, возвращающая `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`), `WebSocketConnection`, default; глобальный конструктор `WebSocket` на нативных хостах |

<a id="from-rust"></a>

## Из Rust

Код на Rust выполняет ту же работу средствами стандартной библиотеки Rust и crates.io, в собственном нативном коде приложения. Блокирующие вызовы выполняются в потоках среды выполнения с `blocking(…)`, а асинхронные — с `background(…)` (`nsh_core::prelude`), и их результаты возвращаются в компонент в задаче. `capabilities` из `nsh.json` управляют TSX приложения и сервисами NSH (`fetch`, буфер обмена), а собственный код Rust приложения выполняется с правами процесса приложения. В браузерных приложениях код на Rust обращается к сети через `fetch` и хранит данные через `nsh_core::storage::Storage`.

| Модуль | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, крейт `base64` |
| `crypto` | крейты, такие как `sha2`, `hmac`, `rand` и `uuid` |
| `path` | `std::path` |
| `url` | крейт `url` |
| `zlib` | крейты, такие как `flate2`, `brotli` и `zstd` |
| `os` | `std::env::consts`, `os()` |
| `console` | крейт `log` |
| `fs/promises` | `std::fs` в `blocking(…)`; `Storage` для данных «ключ — значение» |
| `process` | `std::process::Command` в `blocking(…)` |
| `net` | `std::net::TcpStream` в `blocking(…)` или `tokio::net` в `background(…)` |
| `websocket` | крейт, такой как `tokio-tungstenite`, в `background(…)` |

<a id="imports-and-generated-types"></a>

## Импорты и сгенерированные типы

Каждый модуль импортируется ровно под тем именем, которое указано в таблице: `import { join } from "path"`, `import fs from "fs/promises"`. Бандлер сохраняет эти импорты, а среда выполнения обслуживает их нативно; каталог состоит из этих одиннадцати имён. `buffer`, `crypto`, `path`, `url` и `zlib` — это реализации из LLRT, зафиксированные на `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`, с объявлениями, спроецированными из этой ревизии на экспорты, которые есть в среде выполнения. Остальные модули написаны в NSH. NSH сохраняет идентичность своих классов URL, Blob, потоков и событий.

Все одиннадцать модулей загружаются на нативных хостах и в браузерных приложениях. `Buffer`, хеширование, криптография и сжатие используют одну и ту же переносимую реализацию на Rust в WebAssembly, включая синхронные API; случайные значения берутся из криптографической энтропии браузера. Операции `path` в браузере используют пути POSIX и виртуальный рабочий каталог `/`. Файлы в браузере хранятся в постоянном приватном хранилище приложения, а WebSockets используют транспорт браузера. Запуск процессов и вызовы «сырого» TCP в браузерах завершаются ошибкой `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Сравнение с Node.js и gpui-shell

Модули следуют именам и формам Node для того подмножества, которое они экспортируют, и поведению gpui-shell там, где оно определено. Собственные решения NSH:

- У `fs/promises` вызов `exists` возвращает `true` для символической ссылки, цель которой отсутствует, а `unlink`, `rename`, `rmdir`, `lstat` и `readlink` действуют на саму символическую ссылку.
- У `Stats` и `Dirent` поля (`size`, `mtimeMs`, `name`, ...) являются собственными свойствами, как в Node, а `isFile()`, `isDirectory()` и `isSymbolicLink()` находятся в их прототипе.
- Слушатель `ChildProcess` получает полезную нагрузку события: текст вывода или `{ code, signal }` завершения (с `error` и `errorCode`, когда дочерний процесс завершён средой выполнения). `on` возвращает дочерний процесс. `run` разрешается в `{ code, signal, stdout, stderr }`: вывод в формате gpui-shell плюс сигнал, завершивший дочерний процесс.
- Окружение дочернего процесса — небольшой набор от хоста плюс имена, которые разрешены приложению; процесс запускается в каталоге данных приложения или в `cwd` внутри корня `fs.write` ([Процессы](#processes)).
- `process.platform`, `process.arch`, `os.platform()` и `os.arch()` возвращают имена из Rust `std::env::consts`, как и в gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([Метаданные ОС](#os-metadata-and-logging)).
- `process.dataDir` равно `null`, если у хоста нет каталога данных; `process.exit` просит хост закрыть поверхность приложения.
- Ограничения являются частью каждого API: размеры, количества и тайм-ауты перечислены ниже при каждом модуле.

<a id="failures"></a>

## Ошибки

Функция, возвращающая promise, сообщает о любой ошибке отклонением promise, как это делает `fs/promises` в Node: неверный аргумент, путь или хост, которые приложению не разрешены, исчерпанный лимит и ошибка ввода-вывода обрабатываются одинаково, поэтому достаточно одного `catch` (или `.catch`). Синхронная функция (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, конструктор глобального `WebSocket` и `send`) выбрасывает исключение. Неверное использование (аргумент неверного типа, параметр вне допустимого диапазона) — это `TypeError` или `RangeError`. Каждая ошибка, которую приложение может обработать, содержит `code`, который не меняется от релиза к релизу; сообщение написано для людей и может измениться, поэтому приложения должны ветвиться по `code`:

| `code` | Что означает |
|---|---|
| `ERR_ACCESS_DENIED` | `capabilities` приложения не разрешают этот вызов. У ошибки есть `permission` — ключ разрешения в `nsh.json` (`"fs"`, `"process"`, `"network"`) — и `resource` — то, что было запрошено: путь, команда (`"exit"` для `process.exit`), `"host:port"` сокета или URL WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | Вызов относится к другим платформам: файлы работают на настольных системах и в браузерах, процессы — на настольных системах, сокеты TCP — на нативных хостах, `os.homedir()` — на хостах, где настроен домашний каталог |
| `ERR_NSH_QUOTA_EXCEEDED` | Исчерпан лимит среды выполнения: операции или данные в обработке, дочерние процессы, сокеты, WebSockets, байты в очереди на отправку, слушатели |
| `ETIMEDOUT` | Вызов не уложился во время: `run` у `timeoutMs`, соединение, рукопожатие WebSocket, запись или закрытие |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | Ответ операционной системы, с кодами Node; `EACCES` и `EPERM` означают отказ ОС в доступе к файлу независимо от разрешений приложения |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | Коды Node для размера сверх лимита, закрытого соединения и вывода сверх захвата `run` |

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

Хост-приложение может выдать меньше разрешений, чем объявляет приложение ([Песочница и разрешения](../docs/sandbox-and-capabilities.md)), поэтому приложение должно обрабатывать `ERR_ACCESS_DENIED` так же, как неудавшийся запрос.

<a id="os-metadata-and-logging"></a>

## Метаданные ОС и логирование

`os.platform(): string` и `os.arch(): string` сообщают фактическую нативную ОС и архитектуру хоста, а `process.platform` и `process.arch` содержат те же значения. Это имена из Rust `std::env::consts::OS` и `ARCH`, как и в gpui-shell: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"` для ОС, `"aarch64"`, `"x86_64"` для архитектуры, поэтому приложения сравнивают с ними напрямую (`process.platform === "macos"`). `os.EOL: string` — разделитель строк хоста. `os.homedir(): string` возвращает настроенный абсолютный путь к домашнему каталогу хоста; если он не настроен, выбрасывается ошибка с `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. Пути к каталогам — это метаданные: файловые операции по-прежнему требуют разрешений `fs.read` / `fs.write`.

Браузерные приложения получают пустой объект `process.env`, а `os.homedir()` там выбрасывает `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, поскольку домашние пути и переменные окружения относятся к нативным хостам.

`import console from "console"` использует глобальный объект `console` из VM. У модуля есть только экспорт по умолчанию, поддерживающий `log`, `info`, `debug`, `warn`, `error`, каждый с сигнатурой `(...values: unknown[]): void`. Он использует форматирование логгера NSH.

<a id="compression"></a>

## Сжатие

`zlib` взят из LLRT с одним ограничением, добавленным в NSH: каждая распаковка (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` и их формы `Sync`) выдаёт не более 64 MiB или предел кучи VM, если он меньше. Более длинный вывод приводит к исключению `RangeError`, как в Node.js для `maxOutputLength`; собственный `maxOutputLength` приложения задаёт более низкую границу для одного вызова. `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` и `crypto.randomBytes` выбрасывают `RangeError` (`code` `ERR_OUT_OF_RANGE`) для размера, превышающего предел кучи VM, или 1 GiB, если предела нет; `allocUnsafe` возвращает обнулённую память.

<a id="files"></a>

## Файлы

`fs/promises` читает и записывает нативные файлы на настольных хостах (macOS, Windows и Linux) и приватные файлы приложения в браузере через Origin Private File System (OPFS). Каждый путь проверяется по `capabilities.fs` до начала операции: корни `read` для `readFile`, `readdir`, `stat`, `lstat`, `readlink` и `exists`, корни `write` для `writeFile`, `mkdir`, `rename`, `unlink` и `rmdir`. Любая ошибка отклоняет promise: путь вне разрешений отклоняется с `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` — путь в том виде, как его записало приложение) до какой-либо работы с диском.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Корни — это абсолютные пути, `${dataDir}` (каталог данных этого приложения, выбираемый хостом), `${pluginDir}` (каталог приложения), `${homeDir}` или пути относительно каталога приложения. Относительный путь в вызове по очереди разрешается в каждом выданном корне. Встраивающий хост может сузить разрешения ещё сильнее. Каждая операция остаётся внутри выданного корня, включая символические ссылки; абсолютный путь проверяется в том виде, как он записан, поэтому корня достигают по его собственному (или разрешённому) пути, а не через ссылку извне. `lstat`, `readlink`, `exists`, `unlink`, `rename` и `rmdir` действуют на саму символическую ссылку: `exists` возвращает `true` для символической ссылки, цель которой отсутствует, а `unlink` удаляет ссылку и сохраняет её цель.

Ошибки несут свойства ошибок Node: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; `EILSEQ` для текста не в UTF-8, `ERR_FS_FILE_TOO_LARGE` при превышении лимита чтения), `syscall` и `path`, поэтому `error.code === "ENOENT"` позволяет отличить отсутствующий файл. Путь вне разрешений отклоняется с `ERR_ACCESS_DENIED`, вызов на iOS или Android (приложения которых хранят данные через [`Storage`](./nsh.md#storage)) — с `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, а неверный аргумент (неизвестная кодировка или параметр) — с `TypeError`.

`readFile` возвращает `Uint8Array` или строку при указании `"utf8"` и читает файлы размером до 64 MiB. `writeFile` записывает строку или `Uint8Array` размером до 8 MiB, создавая или заменяя обычный файл. `readdir` перечисляет до 10 000 имён (суммарно 1 MiB; больший каталог отклоняется с `RangeError`, `code` `ERR_OUT_OF_RANGE`) в отсортированном виде или `Dirent` (`name`, `isDirectory()`) при указании `{ withFileTypes: true }`. `stat` и `lstat` возвращают `Stats` с `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` в виде `Date`, а также `isFile()`, `isDirectory()` и `isSymbolicLink()`. `rmdir` удаляет один пустой каталог. Одна VM выполняет до 1024 операций одновременно и удерживает до 64 MiB файловых данных в обработке (данные, переданные в `writeFile`, пока они не записаны, и данные, прочитанные до того, как их promise завершится); вызов сверх этих лимитов отклоняется с `ERR_NSH_QUOTA_EXCEEDED`, а `writeFile` сверх 8 MiB — с `RangeError` (`code` `ERR_OUT_OF_RANGE`).

Хранилище браузера ограничено источником (origin) страницы и собственным пространством имён приложения, с теми же разрешениями на файлы и теми же лимитами размера, проверяемыми в Rust. OPFS требует защищённого контекста, например HTTPS или localhost. Время изменения файлов берётся из метаданных браузера; неизвестные время доступа, время создания и режимы равны нулю. `rename` использует атомарное перемещение через дескриптор браузера и сообщает `ENOTSUP`, если браузер его не поддерживает. Элементы в браузере — это обычные файлы или каталоги, а `readlink` сообщает `EINVAL`.
<a id="processes"></a>

## Процессы

`process.spawn` и `process.run` запускают команды на настольных хостах (macOS, Windows и Linux). Рантайм исполняет программу напрямую с массивом аргументов, без оболочки, и владеет своими каналами; stdout и stderr поступают как инкрементальный UTF-8.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

Команды сопоставляются с `process.execute` точно: `git` и `/usr/bin/git` — это отдельные разрешения. Простые команды разрешаются через абсолютные каталоги `PATH` хоста; в Windows простая команда также находит там `<name>.com` и `<name>.exe`. Пакетный файл (`.cmd`, `.bat`) запускается через `cmd.exe`: разрешите его абсолютный путь (`C:\Windows\System32\cmd.exe`) и передайте `/d`, `/c` и скрипт в качестве аргументов. Окружение дочернего процесса состоит из `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` и `LC_*` хоста, а также имён, которые разрешает `process.env` (совпадение точное, без учёта регистра только в Windows, окружение которой регистр не различает). Дочерний процесс запускается в каталоге данных приложения (создаётся, если отсутствует) или в `cwd` — существующем каталоге внутри корня `fs.write`, поскольку дочерний процесс может писать там, где запущен. Встраивающий хост может сузить разрешения.

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

`run` завершается с `{ code, signal, stdout, stderr }` при любом статусе выхода: `code` — статус выхода, а `signal` `null`, либо, если дочерний процесс завершил сигнал, `code` равно `null`, а `signal` — имя сигнала (`"SIGTERM"`). При любом сбое промис отклоняется. `spawn` сразу возвращает дочерний процесс; `stdin: "pipe"` включает `write` и `end`, а `lines: true` доставляет полные строки. `on(event, handler)` возвращает дочерний процесс, а обработчик получает полезную нагрузку события: текст или `{ code, signal }` один раз, после последнего вывода (с `error`, когда рантайм сам завершил дочерний процесс: таймаут, слишком длинная строка) (сразу — для слушателя, добавленного позже). `pid` — идентификатор дочернего процесса. `spawn` выбрасывает то, чем отклоняется `run`, до запуска дочернего процесса: команда, которую `process.execute` не разрешает, завершается с `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` — команда), `cwd` вне разрешений `fs.write` — с `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` — `cwd`), вызов вне настольных хостов — с `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`, а вызов сверх лимита дочерних процессов — с `ERR_NSH_QUOTA_EXCEEDED`; сбой запуска содержит `code` (`ENOENT` для отсутствующего исполняемого файла, `EACCES` для файла, который ОС не может запустить), `syscall` (`spawn <command>`) и `path`. `run` отклоняется с `ETIMEDOUT` по истечении срока и с `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) при выводе сверх лимита захвата; выход запущенного дочернего процесса несёт то же сообщение в `error`, а его код — в `errorCode`. `process.dataDir` равно `null`, если у хоста нет каталога данных. `kill`, таймаут, очистка реактивного владельца и завершение VM останавливают всё дерево процессов: в Unix его группа процессов получает SIGTERM, а затем SIGKILL через 250 мс (при завершении VM — сразу SIGKILL).

| Лимит | Значение |
|---|---|
| `timeoutMs` | До 4 294 967 295 мс; `run` по умолчанию 30 секунд, `spawn` работает до завершения |
| Захват `run` | 8 МиБ на поток |
| Одна строка с `lines: true` | 8 МиБ |
| Дочерних процессов на VM | 32 |
| Вывод «в полёте» на VM | 8 МиБ; читатели ждут, пока JS заберёт его |
| Ожидающий stdin на дочерний процесс | 1 МиБ; при превышении `write` выбрасывает `ERR_NSH_QUOTA_EXCEEDED` |
| Слушатели | 64 на событие на дочерний процесс |

`process.exit(code?)` запрашивает у хоста закрытие этой поверхности приложения. Разрешите его через `"exit": true` в `capabilities.process`; движок пересылает запрос через платформенную команду выхода из приложения. Вызов, не покрытый разрешением, выбрасывает `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`). Хосты принимают запросы на выход через установленный ими обработчик выхода; в остальных случаях вызов выбрасывает `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. В macOS это закрывает окно поверхности. В браузере это останавливает приложение и очищает его поверхность, оставляя страницу хоста открытой. Встраивающий хост сам решает, как его поверхность обрабатывает запрос. Gallery запрещает эту возможность, чтобы действие **Request host exit** демонстрировало обработку разрешений и не закрывало демо.

<a id="network-permissions-and-boundaries"></a>

## Сетевые разрешения и границы

Глобальный `fetch` сохраняет потоковую HTTP-реализацию NSH, проверяя `network.hosts` или `network.http` для запросов и переходов по редиректам. WebSocket поддерживает `ws:` / `wss:`, текстовые и бинарные сообщения, слушатели событий и закрывающее рукопожатие. Рукопожатие WebSocket — это HTTP GET, поэтому и глобальный `WebSocket`, и `connect` модуля `websocket` используют HTTP-разрешения: `ws` проверяется как `http`, а `wss` — как `https`, с методом GET (правило также может перечислять `ws` / `wss` в `schemes`). NSH проверяет исходный нормализованный URL до начала соединения. Нативное рукопожатие подключается к этому URL и отклоняет редиректы; редиректы и политика соединений WebSocket в браузере определяются самим браузером. Оба API отказываются принимать URL с учётными данными или фрагментом. Каждая VM удерживает не более 32 WebSocket на оба API вместе, а сообщения не превышают 8 МиБ в обоих.

URL, не разрешённый приложению, отклоняется до начала любого соединения. Глобальный `WebSocket` сообщает об этом так же, как браузер сообщает о сбое соединения: конструктор возвращает сокет, который затем вызывает `error` и `close` (код 1006, `wasClean` `false`), так что обработчики, которые приложение задаёт сразу после конструктора, их услышат. `connect` модуля отклоняется с `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` — URL). 33-й WebSocket выбрасывает ошибку (конструктор) или отклоняется (`connect`) с `ERR_NSH_QUOTA_EXCEEDED`, а некорректный URL — это `SyntaxError` (конструктор) или `TypeError` (`connect`).

Глобальный `WebSocket` ставит в очередь на отправку не более восьми сообщений, с буфером не более 8 МиБ (`bufferedAmount`); `send()` сверх любого из лимитов выбрасывает `ERR_NSH_QUOTA_EXCEEDED`, а когда сокет закрывается, `send()` отбрасывает свои данные, как это делает браузерный. Его рукопожатие и каждая запись завершаются по таймауту через 30 секунд, а закрытие ждёт close-фрейм от пира до 5 секунд. Сообщения доставляются событиями `message` по мере поступления.

`WebSocketConnection` модуля `websocket` удерживает не более восьми ожидающих операций (чтение, запись, закрытие) и не более 8 МиБ ещё не отправленных записей; `write()` сверх любого из лимитов отклоняется с `ERR_NSH_QUOTA_EXCEEDED`, а сообщение больше 8 МиБ — с `RangeError` (`code` `ERR_OUT_OF_RANGE`). Одновременно может ожидать только один `read()`; второй отклоняется с `TypeError`. Сообщения, пришедшие до прочтения, ждут приложение, а их поток следует за чтением: пока восемь сообщений или 8 МиБ остаются непрочитанными, соединение прекращает чтение из сети, так что отправка пира тоже ждёт, а чтение возобновляется по мере чтения приложением. Разрешение имени, подключение и рукопожатие вместе, каждая запись и закрытие завершаются по таймауту через 30 секунд.

`read()` возвращает сообщения в порядке поступления. Когда соединение закрыто штатно (пир закрыл его или приложение вызвало `close()`) и все предшествующие сообщения прочитаны, `read()` возвращает `null`, как это делает `net`-сокет при EOF; `closeCode` и `closeReason` тогда содержат код и причину из close-фрейма (`null`, пока соединение открыто; 1005 для close-фрейма без кода, 1006 для соединения, завершившегося без закрывающего рукопожатия). `read()` отклоняется только при сбое, после предшествующих сообщений, с его `code`: `ERR_SOCKET_CLOSED` для соединения, завершившегося без закрывающего рукопожатия, `ETIMEDOUT`, код ОС для ошибки сокета, или `EPROTO` для ошибки протокола (с HTTP `status` отклонённого рукопожатия). `close(code?, reason?)` отправляет свой код (1000 по умолчанию или от 3000 до 4999) и причину (не более 123 байт UTF-8) в close-фрейме, как это делает `close()` глобального `WebSocket`; код или причина вне этих рамок отклоняются с `RangeError` (`code` `ERR_OUT_OF_RANGE`). Он отбрасывает ещё не прочитанные сообщения и завершается, когда пир отвечает на закрывающее рукопожатие.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` использует только `network.sockets` — список точных адресов назначения `"host:port"` (`"[::1]:9000"` для IPv6), проверяемых до DNS-запроса. Каждая запись разрешает один порт на одном хосте; шаблоны хостов, `network.hosts` и HTTP-разрешения покрывают только HTTP-трафик, а приложение без `"capabilities"` перечисляет и свои сокеты. Возвращаемый `Socket` предоставляет `read(size?)`, `write(text)` и `close()`; чтение возвращает `Uint8Array` или `null` при EOF. Любой сбой отклоняет промис: неразрешённое назначение — с `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`), 33-й сокет и записи сверх 4 МиБ, которые могут ожидать, — с `ERR_NSH_QUOTA_EXCEEDED`, чтение или запись свыше 1 МиБ — с `RangeError` (`code` `ERR_OUT_OF_RANGE`); сбои соединения и ввода-вывода отклоняются с `code` из Node (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) и `syscall`, сбои соединения — также с `address` и `port`, а запись в закрытый сокет — с `ERR_SOCKET_CLOSED` (чтение там возвращает `null`). У соединений и ввода-вывода таймаут 30 секунд, каждое чтение/запись ограничено 1 МиБ, в ожидании отправки может находиться не более 4 МиБ записей, а `close()` немедленно завершает ожидающие чтения и записи. Каждая VM держит не более 32 сокетов открытыми или в процессе подключения. Это клиентский интерфейс сокетов на основе промисов.

Сырой TCP работает на нативных хостах. Оба интерфейса WebSocket в веб-приложениях используют браузерный транспорт, сохраняя проверки возможностей на Rust и описанные выше лимиты. Пользовательские заголовки рукопожатия в браузере приводят к явной ошибке неподдерживаемой опции. Политики соединений браузера также действуют. Разрешения встраивающего хоста пересекаются с декларацией возможностей приложения.

<a id="websocket-grant-example"></a>

## Пример разрешения для WebSocket

Этот фрагмент `nsh.json` разрешает GET-рукопожатие для данного URL `wss`, сохраняя его путь и область HTTPS:

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

## Пример разрешения для TCP

TCP использует разрешение для сокета: точный хост и порт, к которым подключается приложение.

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

Откройте **Standard APIs** в `examples/gallery`, чтобы запустить файловые операции, дочерние процессы, TCP и оба интерфейса WebSocket, а также просмотреть метаданные хоста и задачи в очереди. Действие utilities демонстрирует буферы, хеширование, сжатие и файловые URL. Каждое действие показывает свой результат или ошибку. Файлы остаются во временном каталоге внутри собственного каталога данных Gallery и удаляются после действия. Действия TCP и WebSocket подключаются к локальным эхо-серверам на портах 9876 и 9877. В вебе файловые действия работают с OPFS, utilities выполняются в WebAssembly, а оба действия WebSocket используют браузерные соединения; действия с процессами и TCP показывают типизированные платформенные ошибки хоста.

**AI Chat** в Gallery использует `process.spawn` для чата через локально установленный Claude или Codex CLI на десктопе. Войдите через CLI в терминале, затем выберите провайдера в поле ввода. Ответы используют разговор как контекст; Stop и уход с экрана завершают дочерний процесс. В вебе и на мобильных запускаются сценарные потоковые разговоры, включая рассуждения, карточки инструментов и восстановление после ошибок.
