---
title: "स्टैंडर्ड मॉड्यूल"
description: "ग्यारह Node-शैली के स्टैंडर्ड मॉड्यूल: पिन की गई LLRT यूटिलिटी और कैपेबिलिटी-चेक की गई फ़ाइलें, प्रोसेस और नेटवर्किंग।"
order: 14.5
source_hash: d38790f1ea17287e
---

Native Shell, TSX के लिए ग्यारह मानक मॉड्यूल देता है, जिन्हें उनके सीधे नामों से import किया जाता है (Rust कोड Rust की अपनी लाइब्रेरी इस्तेमाल करता है: [Rust से](#from-rust))। ये gpui-shell के साथ संगत Node-जैसे APIs हैं, जो ऐप के VM में NSH के नेटिव रनटाइम पर चलते हैं और जिनकी क्षमताएँ (capabilities) Rust में जाँची जाती हैं। `.nsh/types` में इनकी TypeScript declarations उन्हीं specs से बनती हैं जिनसे मॉड्यूल बनते हैं, इसलिए types जो दिखाते हैं, रनटाइम वही export करता है।

| मॉड्यूल | Exports |
|---|---|
| `buffer` | `Buffer`, `atob`, `btoa`, `constants`, default (LLRT); `Buffer` ग्लोबल भी है |
| `crypto` | `createHash`, `createHmac`, `randomBytes`, `randomFill`, `randomFillSync`, `randomInt`, `randomUUID`, `getRandomValues`, `webcrypto`, `crypto`, `Crc32`, `Crc32c`, `Md5`, `Sha1`, `Sha256`, `Sha384`, `Sha512`, default (LLRT); `crypto` ग्लोबल भी है |
| `path` | `basename`, `delimiter`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `sep`, default (LLRT) |
| `url` | `URL`, `URLSearchParams`, `domainToASCII`, `domainToUnicode`, `fileURLToPath`, `format`, `pathToFileURL`, `urlToHttpOptions`, default; `URL` और `URLSearchParams` NSH की ग्लोबल क्लासें हैं |
| `zlib` | `deflate`, `deflateRaw`, `inflate`, `inflateRaw`, `gzip`, `gunzip`, `brotliCompress`, `brotliDecompress`, `zstdCompress`, `zstdDecompress`, हर एक अपने `Sync` रूप के साथ, default (LLRT) |
| `os` | `platform()`, `arch()`, `homedir()`, `EOL`, default |
| `console` | default: VM का `console` (`log`, `info`, `debug`, `warn`, `error`) |
| `fs/promises` | `readFile`, `writeFile`, `readdir`, `exists`, `mkdir`, `rename`, `unlink`, `rmdir`, `stat`, `lstat`, `readlink`, default |
| `process` | `run`, `spawn`, `exit`, `platform`, `arch`, `nextTick`, `ChildProcess`, default; default ऑब्जेक्ट में `env` और `dataDir` भी हैं और यही ग्लोबल `process` है |
| `net` | `connect`, `Socket`, default |
| `websocket` | `connect(url, options?)` जो एक `WebSocketConnection` (`read`, `write`, `close(code?, reason?)`, `closeCode`, `closeReason`) देता है, `WebSocketConnection`, default; नेटिव होस्ट पर ग्लोबल `WebSocket` कंस्ट्रक्टर |

<a id="from-rust"></a>

## Rust से

Rust कोड यही काम Rust की standard library और crates.io से करता है, ऐप के अपने नेटिव कोड में: ब्लॉकिंग कॉल रनटाइम के थ्रेड पर `blocking(…)` के साथ और async कॉल `background(…)` (`nsh_core::prelude`) के साथ चलते हैं, और उनके नतीजे एक task में कंपोनेंट तक लौटते हैं। `nsh.json` के `capabilities` ऐप के TSX और NSH की सेवाओं (`fetch`, क्लिपबोर्ड) को नियंत्रित करते हैं; ऐप का अपना Rust कोड ऐप की प्रोसेस की अनुमतियों के साथ चलता है। ब्राउज़र ऐप्स में Rust कोड नेटवर्क तक `fetch` से पहुँचता है और डेटा `nsh_core::storage::Storage` में रखता है।

| मॉड्यूल | Rust |
|---|---|
| `buffer` | `Vec<u8>`, `&[u8]`, `base64` crate |
| `crypto` | `sha2`, `hmac`, `rand` और `uuid` जैसे crates |
| `path` | `std::path` |
| `url` | `url` crate |
| `zlib` | `flate2`, `brotli` और `zstd` जैसे crates |
| `os` | `std::env::consts`, `os()` |
| `console` | `log` crate |
| `fs/promises` | `blocking(…)` में `std::fs`; key-value डेटा के लिए `Storage` |
| `process` | `blocking(…)` में `std::process::Command` |
| `net` | `blocking(…)` में `std::net::TcpStream`, या `background(…)` में `tokio::net` |
| `websocket` | `background(…)` में `tokio-tungstenite` जैसा कोई crate |

<a id="imports-and-generated-types"></a>

## Imports और generated types

हर मॉड्यूल ठीक उसी नाम से import किया जाता है जो तालिका में है: `import { join } from "path"`, `import fs from "fs/promises"`। bundler इन imports को बनाए रखता है और रनटाइम इन्हें नेटिव रूप से उपलब्ध कराता है; कैटलॉग में केवल ये ग्यारह नाम हैं। `buffer`, `crypto`, `path`, `url` और `zlib` LLRT के implementations हैं, जो `d9fd873e793c6551c5d92b2e31480f3279e3cd8d` पर pinned हैं, और उनकी declarations उस revision से रनटाइम के export किए हुए हिस्सों पर प्रोजेक्ट की गई हैं। बाकी NSH के अपने हैं। NSH अपनी URL, Blob, stream और event क्लासों की पहचान बनाए रखता है।

सभी ग्यारह मॉड्यूल नेटिव होस्ट और ब्राउज़र ऐप्स दोनों में लोड होते हैं। WebAssembly में `Buffer`, hashing, crypto और compression वही portable Rust implementation इस्तेमाल करते हैं, synchronous APIs समेत; random values ब्राउज़र की cryptographic entropy से आते हैं। ब्राउज़र में `path` ऑपरेशन POSIX paths और वर्चुअल `/` working directory इस्तेमाल करते हैं। ब्राउज़र की फ़ाइलें ऐप-निजी स्थायी स्टोरेज में रहती हैं, और WebSockets ब्राउज़र के transport का इस्तेमाल करते हैं। प्रोसेस चलाना और raw TCP कॉल ब्राउज़र में `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` के साथ विफल होते हैं।

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## Node.js और gpui-shell से तुलना

मॉड्यूल जो उपसमूह export करते हैं उसके लिए Node के नामों और आकारों का, और जहाँ gpui-shell कोई व्यवहार तय करता है वहाँ उसके व्यवहार का पालन करते हैं। NSH के अपने चुनाव:

- `fs/promises` का `exists` उस symlink के लिए `true` है जिसका लक्ष्य मौजूद नहीं है, और `unlink`, `rename`, `rmdir`, `lstat` और `readlink` symlink पर ही काम करते हैं।
- `Stats` और `Dirent` के फ़ील्ड (`size`, `mtimeMs`, `name`, ...) Node की तरह अपनी properties हैं, और `isFile()`, `isDirectory()` और `isSymbolicLink()` उनके prototype पर हैं।
- `ChildProcess` listener को इवेंट का payload मिलता है: आउटपुट टेक्स्ट, या exit का `{ code, signal }` (`error` और `errorCode` के साथ जब रनटाइम ने child को समाप्त किया हो)। `on` child लौटाता है। `run` `{ code, signal, stdout, stderr }` के साथ resolve होता है: gpui-shell का आउटपुट, साथ में वह signal जिसने child को समाप्त किया।
- child का environment होस्ट से लिया गया एक छोटा सेट और ऐप को दिए गए नाम होते हैं, और वह ऐप की data directory में या `fs.write` root के भीतर किसी `cwd` में चलता है ([Processes](#processes))।
- `process.platform`, `process.arch`, `os.platform()` और `os.arch()` Rust के `std::env::consts` नाम देते हैं, जैसा gpui-shell के करते हैं: `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`; `"aarch64"`, `"x86_64"` ([OS metadata](#os-metadata-and-logging))।
- जब होस्ट के पास data directory नहीं होती तब `process.dataDir` `null` होता है; `process.exit` होस्ट से ऐप सतह बंद करने को कहता है।
- सीमाएँ हर API का हिस्सा हैं: आकार, संख्याएँ और timeouts नीचे हर मॉड्यूल के साथ सूचीबद्ध हैं।

<a id="failures"></a>

## विफलताएँ

जो फ़ंक्शन promise लौटाता है वह हर विफलता को promise reject करके बताता है, जैसे Node का `fs/promises` करता है: गलत argument, ऐसा path या होस्ट जिसकी ऐप को अनुमति नहीं है, खत्म हो चुकी सीमा और I/O त्रुटि, सब इसी तरह, इसलिए एक `catch` (या `.catch`) सबको संभाल लेता है। synchronous फ़ंक्शन (`process.spawn`, `process.exit`, `os.homedir`, `ChildProcess.write`, ग्लोबल `WebSocket` का कंस्ट्रक्टर और `send`) throw करता है। गलत उपयोग (गलत type का argument, सीमा से बाहर का option) `TypeError` या `RangeError` होता है। ऐप जिस भी विफलता को संभाल सकता है, उसमें एक `code` होता है जो एक release से दूसरे में वही रहता है; संदेश लोगों के लिए लिखा जाता है और बदल सकता है, इसलिए ऐप `code` पर branch करें:

| `code` | इसका अर्थ |
|---|---|
| `ERR_ACCESS_DENIED` | ऐप के `capabilities` कॉल की अनुमति नहीं देते। त्रुटि में `permission` होता है, यानी `nsh.json` में capability की key (`"fs"`, `"process"`, `"network"`), और `resource`, यानी जो माँगा गया था: path, कमांड (`process.exit` के लिए `"exit"`), socket का `"host:port"` या WebSocket का URL |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | कॉल दूसरे प्लेटफ़ॉर्म का है: फ़ाइलें डेस्कटॉप और ब्राउज़र में चलती हैं, प्रोसेस डेस्कटॉप पर, TCP sockets नेटिव होस्ट पर, `os.homedir()` उन होस्ट पर जो home directory कॉन्फ़िगर करते हैं |
| `ERR_NSH_QUOTA_EXCEEDED` | रनटाइम की कोई सीमा खत्म हो गई: चालू ऑपरेशन या डेटा, children, sockets, WebSockets, भेजे जाने के इंतज़ार में बाइट्स, listeners |
| `ETIMEDOUT` | कॉल का समय समाप्त हो गया: `run` का `timeoutMs`, कनेक्शन, WebSocket handshake, write या close |
| `ENOENT`, `EEXIST`, `EACCES`, `ECONNREFUSED`, ... | ऑपरेटिंग सिस्टम का उत्तर, Node के कोड के साथ; `EACCES` और `EPERM` में OS ऐप की capabilities से अलग किसी फ़ाइल को मना करता है |
| `ERR_OUT_OF_RANGE`, `ERR_FS_FILE_TOO_LARGE`, `ERR_SOCKET_CLOSED`, `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | सीमा से बड़े आकार, बंद कनेक्शन और `run` के capture से ज़्यादा आउटपुट के लिए Node के कोड |

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

होस्ट ऐप ऐप की घोषणा से कम अनुमति दे सकता है ([Sandbox and Capabilities](../docs/sandbox-and-capabilities.md)), इसलिए ऐप `ERR_ACCESS_DENIED` को उसी तरह संभाले जैसे किसी विफल अनुरोध को।

<a id="os-metadata-and-logging"></a>

## OS metadata और logging

`os.platform(): string` और `os.arch(): string` वास्तविक नेटिव होस्ट OS और architecture बताते हैं, और `process.platform` तथा `process.arch` में वही मान होते हैं। ये Rust के `std::env::consts::OS` और `ARCH` के नाम हैं, जैसा gpui-shell के हैं: OS के लिए `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`, architecture के लिए `"aarch64"`, `"x86_64"`, इसलिए ऐप सीधे इनसे तुलना करते हैं (`process.platform === "macos"`)। `os.EOL: string` होस्ट का line separator है। `os.homedir(): string` कॉन्फ़िगर किया गया absolute होस्ट home path लौटाता है; जहाँ कोई कॉन्फ़िगर नहीं है वहाँ यह `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` वाली त्रुटि throw करता है। Directory paths केवल metadata हैं: फ़ाइल ऑपरेशनों के लिए अब भी `fs.read` / `fs.write` grants चाहिए।

ब्राउज़र ऐप्स को खाली `process.env` ऑब्जेक्ट मिलता है, और वहाँ `os.homedir()` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` throw करता है, क्योंकि home paths और environment variables नेटिव होस्ट के हैं।

`import console from "console"` VM के ग्लोबल `console` ऑब्जेक्ट को साझा करता है। मॉड्यूल में केवल default export है, जो `log`, `info`, `debug`, `warn`, `error` को सपोर्ट करता है, हर एक का signature `(...values: unknown[]): void` है। यह NSH की logger formatting इस्तेमाल करता है।

## Compression

`zlib` LLRT का है, एक सीमा के साथ जो NSH जोड़ता है: हर decompression (`inflate`, `inflateRaw`, `gunzip`, `brotliDecompress`, `zstdDecompress` और उनके `Sync` रूप) अधिकतम 64 MiB पैदा करता है, या VM की heap सीमा, यदि वह छोटी हो। इससे लंबा आउटपुट `RangeError` throw करता है, जैसा Node.js `maxOutputLength` के लिए करता है; ऐप का अपना `maxOutputLength` एक कॉल के लिए इससे कम सीमा तय करता है। `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` और `crypto.randomBytes` VM की heap सीमा से बड़े आकार पर (या उसके बिना 1 GiB से बड़े पर) `RangeError` (`code` `ERR_OUT_OF_RANGE`) throw करते हैं; `allocUnsafe` zeroed मेमोरी लौटाता है।

## Files

`fs/promises` डेस्कटॉप होस्ट (macOS, Windows और Linux) पर नेटिव फ़ाइलें पढ़ता और लिखता है, और ब्राउज़र में Origin Private File System (OPFS) के ज़रिए ऐप-निजी फ़ाइलें। ऑपरेशन शुरू होने से पहले हर path को `capabilities.fs` के विरुद्ध जाँचा जाता है: `readFile`, `readdir`, `stat`, `lstat`, `readlink` और `exists` के लिए `read` roots, `writeFile`, `mkdir`, `rename`, `unlink` और `rmdir` के लिए `write` roots। हर विफलता promise को reject करती है: grants से बाहर का path `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` वह path जैसा ऐप ने लिखा था) के साथ, किसी भी डिस्क काम से पहले।

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

Roots absolute paths होते हैं, `${dataDir}` (इस ऐप की data directory, जिसे होस्ट चुनता है), `${pluginDir}` (ऐप की directory), `${homeDir}`, या ऐप की directory के सापेक्ष paths। कॉल में दिया गया relative path हर granted root में बारी-बारी से resolve किया जाता है। embedding होस्ट grants को और सीमित कर सकता है। हर ऑपरेशन अपने granted root के भीतर रहता है, symlinks समेत; absolute path को जैसा लिखा गया है वैसा ही जाँचा जाता है, इसलिए root तक उसके अपने path (या उसके resolved path) से पहुँचा जाता है, उसके बाहर के किसी link से नहीं। `lstat`, `readlink`, `exists`, `unlink`, `rename` और `rmdir` symlink पर ही काम करते हैं: `exists` उस symlink के लिए `true` है जिसका लक्ष्य मौजूद नहीं है, और `unlink` link को हटाता है और उसका लक्ष्य रखता है।

विफलताओं में Node की error properties होती हैं: `code` (`ENOENT`, `EEXIST`, `ENOTDIR`, `EISDIR`, `ENOTEMPTY`, `ELOOP`, `EACCES`, `EPERM`, ...; जो टेक्स्ट UTF-8 नहीं है उसके लिए `EILSEQ`, पढ़ने की सीमा से ज़्यादा के लिए `ERR_FS_FILE_TOO_LARGE`), `syscall` और `path`, इसलिए `error.code === "ENOENT"` गायब फ़ाइल को अलग पहचान लेता है। grants से बाहर का path `ERR_ACCESS_DENIED` के साथ reject होता है, iOS या Android पर कॉल (जिनके ऐप [`Storage`](./nsh.md#storage) से डेटा रखते हैं) `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` के साथ, और गलत argument (अज्ञात encoding या option) `TypeError` के साथ।

`readFile` एक `Uint8Array` लौटाता है, या `"utf8"` के साथ एक string, और 64 MiB तक की फ़ाइलें पढ़ता है। `writeFile` अधिकतम 8 MiB की string या `Uint8Array` लिखता है, एक regular फ़ाइल बनाकर या बदलकर। `readdir` अधिकतम 10 000 नाम सूचीबद्ध करता है (उनमें से 1 MiB; इससे बड़ी directory `RangeError`, `code` `ERR_OUT_OF_RANGE` के साथ reject होती है), क्रमबद्ध, या `{ withFileTypes: true }` के साथ `Dirent`s (`name`, `isDirectory()`)। `stat` और `lstat` एक `Stats` resolve करते हैं जिसमें `size`, `mode`, `mtimeMs` / `atimeMs` / `birthtimeMs`, `mtime` / `atime` / `birthtime` `Date`s के रूप में, और `isFile()`, `isDirectory()` और `isSymbolicLink()` होते हैं। `rmdir` एक खाली directory हटाता है। एक VM एक समय में अधिकतम 1024 ऑपरेशन चलाता है और अधिकतम 64 MiB फ़ाइल डेटा चालू स्थिति में रखता है (`writeFile` को दिया गया डेटा जब तक लिखा न जाए, पढ़ा गया डेटा जब तक उसका promise settle न हो); इन सीमाओं से आगे का कॉल `ERR_NSH_QUOTA_EXCEEDED` के साथ reject होता है, और 8 MiB से बड़ा `writeFile` `RangeError` (`code` `ERR_OUT_OF_RANGE`) के साथ।

ब्राउज़र स्टोरेज पेज के origin और ऐप के अपने namespace तक सीमित है, उन्हीं file grants और आकार-सीमाओं के साथ जिन्हें Rust में जाँचा जाता है। OPFS के लिए secure context चाहिए, जैसे HTTPS या localhost। फ़ाइल modification times ब्राउज़र metadata से आते हैं; अज्ञात access/birth times और modes शून्य होते हैं। `rename` ब्राउज़र के atomic handle move का इस्तेमाल करता है और जब ब्राउज़र यह उपलब्ध नहीं कराता तब `ENOTSUP` बताता है। ब्राउज़र की entries regular फ़ाइलें या directories होती हैं, और `readlink` `EINVAL` बताता है।
<a id="processes"></a>

## प्रोसेस

`process.spawn` और `process.run` डेस्कटॉप होस्ट (macOS, Windows और Linux) पर कमांड लॉन्च करते हैं। रनटाइम प्रोग्राम को सीधे आर्गुमेंट ऐरे के साथ चलाता है, बिना किसी शेल के, और उसके पाइप का स्वामी होता है; stdout और stderr क्रमिक (incremental) UTF-8 के रूप में आते हैं।

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

कमांड `process.execute` से बिल्कुल मेल खानी चाहिए: `git` और `/usr/bin/git` अलग-अलग grant हैं। बिना पाथ वाली कमांड होस्ट के `PATH` की absolute डायरेक्टरी के माध्यम से resolve होती हैं; Windows पर ऐसी कमांड वहाँ `<name>.com` और `<name>.exe` भी ढूँढ लेती है। बैच फ़ाइल (`.cmd`, `.bat`) `cmd.exe` के माध्यम से चलती है: उसका absolute पाथ (`C:\Windows\System32\cmd.exe`) grant करें और `/d`, `/c` तथा स्क्रिप्ट को आर्गुमेंट के रूप में दें। चाइल्ड का एनवायरनमेंट होस्ट से `PATH`, `HOME`, `USERPROFILE`, `SystemRoot`, `TEMP`, `TMP`, `TMPDIR`, `LANG` और `LC_*` है, साथ ही वे नाम जो `process.env` grant करता है (सटीक मिलान; अक्षर-भेद केवल Windows पर अनदेखा किया जाता है, क्योंकि उसका एनवायरनमेंट ऐसा ही करता है)। चाइल्ड ऐप की डेटा डायरेक्टरी में चलता है (न होने पर बनाई जाती है), या `cwd` में, जो `fs.write` रूट के भीतर कोई मौजूदा डायरेक्टरी होनी चाहिए, क्योंकि चाइल्ड जहाँ चलता है वहाँ लिख सकता है। एम्बेड करने वाला होस्ट grant को सीमित कर सकता है।

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

`run` किसी भी exit status के लिए `{ code, signal, stdout, stderr }` resolve करता है: `code` exit status है और `signal` `null` है, या, जब किसी सिग्नल ने चाइल्ड को समाप्त किया हो, तो `code` `null` होता है और `signal` उसका नाम (`"SIGTERM"`) होता है। यह हर विफलता पर reject होता है। `spawn` तुरंत एक चाइल्ड लौटाता है; `stdin: "pipe"` `write` और `end` सक्षम करता है, और `lines: true` पूरी पंक्तियाँ देता है। `on(event, handler)` चाइल्ड लौटाता है, और हैंडलर को इवेंट का payload मिलता है: टेक्स्ट, या अंतिम आउटपुट के बाद एक बार `{ code, signal }` (`error` के साथ, जब रनटाइम ने चाइल्ड को समाप्त किया हो: टाइमआउट, बहुत लंबी पंक्ति) (बाद में जोड़े गए listener को तुरंत)। `pid` चाइल्ड की process id है। `spawn` वही throw करता है जिससे `run` reject होता है, चाइल्ड शुरू होने से पहले: जो कमांड `process.execute` grant नहीं करता वह `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` कमांड) के साथ विफल होती है, `fs.write` grant के बाहर का `cwd` `ERR_ACCESS_DENIED` (`permission` `"fs"`, `resource` `cwd`) के साथ, डेस्कटॉप के अलावा कहीं और से किया गया कॉल `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` के साथ, और चाइल्ड की सीमा से अधिक का कॉल `ERR_NSH_QUOTA_EXCEEDED` के साथ; लॉन्च विफलता में `code` (`ENOENT` अनुपस्थित executable के लिए, `EACCES` ऐसे executable के लिए जिसे OS चला नहीं सकता), `syscall` (`spawn <command>`) और `path` होते हैं। `run` अपनी समय-सीमा पर `ETIMEDOUT` के साथ reject होता है, और अपनी capture सीमा से अधिक आउटपुट पर `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) के साथ; spawn किए गए चाइल्ड का exit वही संदेश `error` में और उसका कोड `errorCode` में रखता है। जब होस्ट के पास डेटा डायरेक्टरी नहीं होती, तब `process.dataDir` का मान `null` होता है। `kill`, टाइमआउट, reactive owner की cleanup और VM का teardown पूरे प्रोसेस ट्री को समाप्त कर देते हैं: Unix पर उसके process group को SIGTERM मिलता है और 250 ms बाद SIGKILL (teardown के समय तुरंत SIGKILL)।

| सीमा | मान |
|---|---|
| `timeoutMs` | अधिकतम 4,294,967,295 ms; `run` का डिफ़ॉल्ट 30 सेकंड है, `spawn` exit तक चलता है |
| `run` का capture | प्रति स्ट्रीम 8 MiB |
| `lines: true` के साथ एक पंक्ति | 8 MiB |
| प्रति VM चाइल्ड | 32 |
| प्रति VM प्रगति में आउटपुट | 8 MiB; रीडर तब तक प्रतीक्षा करते हैं जब तक JS उसे ले न ले |
| प्रति चाइल्ड लंबित stdin | 1 MiB; इससे अधिक होने पर `write` `ERR_NSH_QUOTA_EXCEEDED` throw करता है |
| Listener | प्रति चाइल्ड प्रति इवेंट 64 |

`process.exit(code?)` होस्ट से इस ऐप surface को बंद करने का अनुरोध करता है। इसे `capabilities.process` में `"exit": true` के साथ grant करें; इंजन अनुरोध को प्लेटफ़ॉर्म की app-exit कमांड के माध्यम से आगे भेजता है। जिस कॉल को grant कवर नहीं करता वह `ERR_ACCESS_DENIED` (`permission` `"process"`, `resource` `"exit"`) throw करता है। होस्ट exit अनुरोध उस exit handler के माध्यम से लेते हैं जिसे वे इंस्टॉल करते हैं; अन्यत्र कॉल `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` throw करता है। macOS पर यह surface की विंडो बंद करता है। ब्राउज़र में यह ऐप को रोक देता है और उसकी surface साफ़ कर देता है, जबकि होस्ट पेज खुला रहता है। एम्बेड करने वाला होस्ट तय करता है कि उसकी surface अनुरोध को कैसे संभालती है। Gallery इस capability को अस्वीकार करता है, ताकि उसका **Request host exit** एक्शन अनुमति-हैंडलिंग का प्रदर्शन करे और डेमो खुला रहे।

<a id="network-permissions-and-boundaries"></a>

## नेटवर्क अनुमतियाँ और सीमाएँ

Global `fetch` NSH का streaming HTTP implementation बनाए रखता है, और अनुरोधों तथा redirect hops के लिए `network.hosts` या `network.http` जाँचता है। WebSocket `ws:` / `wss:`, टेक्स्ट और बाइनरी संदेश, इवेंट listener और closing handshake का समर्थन करता है। WebSocket handshake एक HTTP GET है, इसलिए global `WebSocket` और `websocket` मॉड्यूल का `connect` दोनों HTTP grant का उपयोग करते हैं: `ws` को `http` के रूप में और `wss` को `https` के रूप में जाँचा जाता है, GET का उपयोग करते हुए (कोई नियम `schemes` में `ws` / `wss` भी सूचीबद्ध कर सकता है)। NSH कनेक्शन शुरू करने से पहले प्रारंभिक normalized URL जाँचता है। native handshake उसी URL से जुड़ता है और redirect अस्वीकार करता है; ब्राउज़र WebSocket के redirect और कनेक्शन नीति ब्राउज़र नियंत्रित करता है। दोनों API credentials या fragment वाले URL को अस्वीकार करते हैं। प्रत्येक VM दोनों API को मिलाकर अधिकतम 32 WebSocket रखता है, और दोनों में संदेश अधिकतम 8 MiB के होते हैं।

जिस URL का ऐप को grant नहीं मिला है, उसे कोई भी कनेक्शन शुरू होने से पहले अस्वीकार कर दिया जाता है। Global `WebSocket` इसे वैसे ही रिपोर्ट करता है जैसे ब्राउज़र विफल होते कनेक्शन को रिपोर्ट करता है: constructor socket लौटाता है, जो फिर `error` और `close` (कोड 1006, `wasClean` `false`) फ़ायर करता है, ताकि constructor के तुरंत बाद ऐप द्वारा सेट किए गए हैंडलर उन्हें सुन सकें। मॉड्यूल का `connect` `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` URL) के साथ reject होता है। 33वाँ WebSocket `ERR_NSH_QUOTA_EXCEEDED` के साथ throw करता है (constructor) या reject होता है (`connect`), और गलत रूप वाला URL `SyntaxError` (constructor) या `TypeError` (`connect`) होता है।

Global `WebSocket` भेजने के लिए अधिकतम आठ संदेश कतार में रखता है, अधिकतम 8 MiB बफ़र किए हुए (`bufferedAmount`); दोनों में से किसी से अधिक होने पर `send()` `ERR_NSH_QUOTA_EXCEEDED` throw करता है, और socket के बंद होते समय `send()` अपना डेटा त्याग देता है, जैसा ब्राउज़र का करता है। इसका handshake और प्रत्येक write 30 सेकंड के बाद टाइमआउट हो जाते हैं, और बंद करते समय यह peer के close frame के लिए अधिकतम 5 सेकंड प्रतीक्षा करता है। संदेश आते ही `message` इवेंट के रूप में दिए जाते हैं।

`websocket` मॉड्यूल का `WebSocketConnection` अधिकतम आठ लंबित ऑपरेशन (read, write, close) और अधिकतम 8 MiB के अभी तक न भेजे गए write रखता है; दोनों में से किसी से अधिक होने पर `write()` `ERR_NSH_QUOTA_EXCEEDED` के साथ reject होता है, और 8 MiB से बड़ा संदेश `RangeError` (`code` `ERR_OUT_OF_RANGE`) के साथ। एक समय में केवल एक `read()` प्रतीक्षा कर सकता है; दूसरा `TypeError` के साथ reject होता है। पढ़े जाने से पहले आने वाले संदेश ऐप की प्रतीक्षा करते हैं, और उनका प्रवाह उसके reads का अनुसरण करता है: जब तक आठ संदेश या 8 MiB बिना पढ़े प्रतीक्षा में हैं, कनेक्शन नेटवर्क से पढ़ना रोक देता है, इसलिए peer का भेजना भी रुक जाता है, और ऐप के पढ़ने पर reading फिर शुरू हो जाती है। Resolve करना, कनेक्ट करना और handshake मिलाकर, प्रत्येक write और बंद करना 30 सेकंड के बाद टाइमआउट हो जाते हैं।

`read()` संदेशों को आगमन के क्रम में resolve करता है। जब कनेक्शन सफलतापूर्वक बंद हो चुका हो (peer ने उसे बंद किया, या ऐप ने `close()` कॉल किया) और उससे पहले आए सभी संदेश पढ़ लिए गए हों, तो `read()` `null` resolve करता है, जैसा `net` socket का EOF पर करता है; `closeCode` और `closeReason` तब close frame का कोड और कारण रखते हैं (कनेक्शन खुला रहने पर `null`; बिना कोड वाले close frame के लिए 1005; बिना closing handshake के समाप्त हुए कनेक्शन के लिए 1006)। `read()` केवल विफलता पर reject होता है, अपने से पहले आए संदेशों के बाद, अपने `code` के साथ: बिना closing handshake के समाप्त हुए कनेक्शन के लिए `ERR_SOCKET_CLOSED`, socket त्रुटि के लिए OS का कोड `ETIMEDOUT`, या protocol त्रुटि के लिए `EPROTO` (अस्वीकृत handshake के HTTP `status` के साथ)। `close(code?, reason?)` अपना कोड (1000, डिफ़ॉल्ट, या 3000 से 4999) और कारण (अधिकतम 123 UTF-8 बाइट) close frame में भेजता है, जैसा global `WebSocket` का `close()` करता है; इनसे बाहर का कोड या कारण `RangeError` (`code` `ERR_OUT_OF_RANGE`) के साथ reject होता है। यह अभी तक न पढ़े गए संदेशों को त्याग देता है और peer के closing handshake का उत्तर देने पर resolve होता है।

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

`net.connect({ host, port })` केवल `network.sockets` का उपयोग करता है, जो ठीक `"host:port"` गंतव्यों की सूची है (IPv6 के लिए `"[::1]:9000"`), जिसे DNS lookup से पहले जाँचा जाता है। प्रत्येक प्रविष्टि एक होस्ट पर एक पोर्ट grant करती है; होस्ट पैटर्न, `network.hosts` और HTTP grant केवल HTTP ट्रैफ़िक को कवर करते हैं, और `"capabilities"` के बिना ऐप अपने socket भी सूचीबद्ध करता है। लौटाया गया `Socket` `read(size?)`, `write(text)` और `close()` प्रदान करता है; reads `Uint8Array` लौटाते हैं, या EOF पर `null`। हर विफलता reject होती है: grant न किया गया गंतव्य `ERR_ACCESS_DENIED` (`permission` `"network"`, `resource` `"host:port"`) के साथ, 33वाँ socket और प्रतीक्षा में रह सकने वाले 4 MiB से अधिक के writes `ERR_NSH_QUOTA_EXCEEDED` के साथ, 1 MiB से अधिक का read या write `RangeError` (`code` `ERR_OUT_OF_RANGE`) के साथ; कनेक्शन और I/O विफलताएँ Node के `code` (`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET`, ...) और `syscall` के साथ reject होती हैं, कनेक्शन की विफलता `address` और `port` के साथ भी, और बंद socket पर write `ERR_SOCKET_CLOSED` के साथ (वहाँ read `null` लौटाता है)। कनेक्शन और I/O के लिए 30 सेकंड का टाइमआउट है, प्रत्येक read/write 1 MiB तक सीमित है, भेजे जाने की प्रतीक्षा में अधिकतम 4 MiB के writes रह सकते हैं, और `close()` लंबित reads और writes को तुरंत समाप्त कर देता है। प्रत्येक VM अधिकतम 32 socket खुले या कनेक्ट होते हुए रखता है। यह promise-आधारित क्लाइंट socket इंटरफ़ेस है।

Raw TCP native होस्ट का उपयोग करता है। वेब ऐप्स में दोनों WebSocket इंटरफ़ेस ब्राउज़र transport का उपयोग करते हैं, और Rust capability जाँच तथा ऊपर की सीमाएँ बनी रहती हैं। कस्टम ब्राउज़र handshake हेडर स्पष्ट unsupported-option त्रुटि देते हैं। ब्राउज़र की कनेक्शन नीतियाँ भी लागू होती हैं। एम्बेडिंग grant ऐप की capability घोषणा से intersect होते हैं।

<a id="websocket-grant-example"></a>

## WebSocket grant का उदाहरण

यह `nsh.json` अंश इस `wss` URL के लिए GET handshake की अनुमति देता है, और उसका पाथ तथा HTTPS scope बनाए रखता है:

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

## TCP grant का उदाहरण

TCP एक socket grant का उपयोग करता है: वह सटीक होस्ट और पोर्ट जिससे ऐप कनेक्ट होता है।

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

फ़ाइल ऑपरेशन, चाइल्ड प्रोसेस, TCP और दोनों WebSocket इंटरफ़ेस चलाने, तथा होस्ट मेटाडेटा और कतार में लगे जॉब देखने के लिए `examples/gallery` में **Standard APIs** खोलें। utilities एक्शन buffers, hashing, compression और file URL का प्रदर्शन करता है। प्रत्येक एक्शन अपना परिणाम या त्रुटि दिखाता है। फ़ाइलें gallery की अपनी डेटा डायरेक्टरी के अंतर्गत एक अस्थायी डायरेक्टरी में रहती हैं और एक्शन के बाद हटा दी जाती हैं। TCP और WebSocket एक्शन पोर्ट 9876 और 9877 पर लोकल echo सर्वर से कनेक्ट होते हैं। वेब पर, फ़ाइल एक्शन OPFS का उपयोग करते हैं, utilities WebAssembly में चलती हैं, और दोनों WebSocket एक्शन ब्राउज़र कनेक्शन का उपयोग करते हैं; process और TCP एक्शन होस्ट की typed प्लेटफ़ॉर्म त्रुटियाँ दिखाते हैं।

Gallery का **AI Chat** डेस्कटॉप पर लोकल रूप से इंस्टॉल किए गए Claude या Codex CLI के माध्यम से चैट करने के लिए `process.spawn` का उपयोग करता है। टर्मिनल में CLI के माध्यम से साइन इन करें, फिर composer में provider चुनें। उत्तर बातचीत को संदर्भ के रूप में उपयोग करते हैं; Stop और स्क्रीन छोड़ना चाइल्ड प्रोसेस को समाप्त कर देते हैं। वेब और मोबाइल पर स्क्रिप्टेड streaming बातचीत चलती है, जिनमें reasoning, tool card और त्रुटि-पुनर्प्राप्ति शामिल हैं।
