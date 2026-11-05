---
title: "الوحدات القياسية"
description: "إحدى عشرة وحدة قياسية على نمط Node: أدوات LLRT مثبّتة الإصدار، وملفات وعمليات وشبكات تخضع للتحقق من الصلاحيات."
order: 14.5
source_hash: d38790f1ea17287e
---

يوفّر Native Shell إحدى عشرة وحدة قياسية لـ TSX، تُستورد بأسمائها المجرّدة (تستخدم شيفرة Rust مكتبات Rust نفسها: [من Rust](#from-rust)): واجهات برمجية بشكل Node متوافقة مع واجهات gpui-shell، تعمل في آلة VM الخاصة بالتطبيق على بيئة NSH الأصلية، مع التحقق من صلاحياتها في Rust. تُولَّد تصريحات TypeScript الخاصة بها في `.nsh/types` من المواصفات نفسها التي تُولَّد منها الوحدات، لذا فما تعرضه الأنواع هو ما يصدّره وقت التشغيل.

| الوحدة | الصادرات |
|---|---|
| `buffer` | `Buffer`، `atob`، `btoa`، `constants`، والتصدير الافتراضي (LLRT)؛ و`Buffer` متاح أيضًا كمتغيّر عام |
| `crypto` | `createHash`، `createHmac`، `randomBytes`، `randomFill`، `randomFillSync`، `randomInt`، `randomUUID`، `getRandomValues`، `webcrypto`، `crypto`، `Crc32`، `Crc32c`، `Md5`، `Sha1`، `Sha256`، `Sha384`، `Sha512`، والتصدير الافتراضي (LLRT)؛ و`crypto` متاح أيضًا كمتغيّر عام |
| `path` | `basename`، `delimiter`، `dirname`، `extname`، `format`، `isAbsolute`، `join`، `normalize`، `parse`، `relative`، `resolve`، `sep`، والتصدير الافتراضي (LLRT) |
| `url` | `URL`، `URLSearchParams`، `domainToASCII`، `domainToUnicode`، `fileURLToPath`، `format`، `pathToFileURL`، `urlToHttpOptions`، والتصدير الافتراضي؛ و`URL` و`URLSearchParams` صنفان عامّان في NSH |
| `zlib` | `deflate`، `deflateRaw`، `inflate`، `inflateRaw`، `gzip`، `gunzip`، `brotliCompress`، `brotliDecompress`، `zstdCompress`، `zstdDecompress`، ولكلٍّ منها صيغة `Sync`، والتصدير الافتراضي (LLRT) |
| `os` | `platform()`، `arch()`، `homedir()`، `EOL`، والتصدير الافتراضي |
| `console` | التصدير الافتراضي: كائن `console` الخاص بالـ VM (`log`، `info`، `debug`، `warn`، `error`) |
| `fs/promises` | `readFile`، `writeFile`، `readdir`، `exists`، `mkdir`، `rename`، `unlink`، `rmdir`، `stat`، `lstat`، `readlink`، والتصدير الافتراضي |
| `process` | `run`، `spawn`، `exit`، `platform`، `arch`، `nextTick`، `ChildProcess`، والتصدير الافتراضي؛ ولكائن التصدير الافتراضي أيضًا `env` و`dataDir`، وهو المتغيّر العام `process` |
| `net` | `connect`، `Socket`، والتصدير الافتراضي |
| `websocket` | `connect(url, options?)` الذي يُحلّ إلى `WebSocketConnection` (`read`، `write`، `close(code?, reason?)`، `closeCode`، `closeReason`)، و`WebSocketConnection`، والتصدير الافتراضي؛ والباني العام `WebSocket` على المضيفات الأصلية |

<a id="from-rust"></a>

## من Rust

تؤدي شيفرة Rust العمل نفسه باستخدام المكتبة القياسية لـ Rust وcrates.io، ضمن الشيفرة الأصلية للتطبيق نفسه: تعمل الاستدعاءات الحاجبة على خيوط وقت التشغيل باستخدام `blocking(…)`، وغير المتزامنة باستخدام `background(…)` (`nsh_core::prelude`)، وتعود نتائجها إلى المكوّن ضمن مهمة. تحكم `capabilities` الخاصة بـ `nsh.json` شيفرة TSX الخاصة بالتطبيق وخدمات NSH (`fetch`، والحافظة)؛ أما شيفرة Rust الخاصة بالتطبيق فتعمل بأذونات عملية التطبيق. في تطبيقات المتصفح، تصل شيفرة Rust إلى الشبكة عبر `fetch` وتحفظ البيانات عبر `nsh_core::storage::Storage`.

| الوحدة | Rust |
|---|---|
| `buffer` | `Vec<u8>`، `&[u8]`، وcrate `base64` |
| `crypto` | crates مثل `sha2` و`hmac` و`rand` و`uuid` |
| `path` | `std::path` |
| `url` | crate `url` |
| `zlib` | crates مثل `flate2` و`brotli` و`zstd` |
| `os` | `std::env::consts`، `os()` |
| `console` | crate `log` |
| `fs/promises` | `std::fs` في `blocking(…)`؛ و`Storage` لبيانات المفتاح والقيمة |
| `process` | `std::process::Command` في `blocking(…)` |
| `net` | `std::net::TcpStream` في `blocking(…)`، أو `tokio::net` في `background(…)` |
| `websocket` | crate مثل `tokio-tungstenite` في `background(…)` |

<a id="imports-and-generated-types"></a>

## الاستيراد والأنواع المولَّدة

تُستورد كل وحدة بالاسم الوارد في الجدول تمامًا: `import { join } from "path"`، `import fs from "fs/promises"`. يُبقي المُجمِّع (bundler) هذه الاستيرادات كما هي، ويقدّمها وقت التشغيل أصليًا؛ والفهرس هو هذه الأسماء الأحد عشر. `buffer` و`crypto` و`path` و`url` و`zlib` هي تنفيذات LLRT، مثبّتة على `d9fd873e793c6551c5d92b2e31480f3279e3cd8d`، مع تصريحات مُسقَطة من تلك المراجعة على الصادرات الموجودة في وقت التشغيل. أما البقية فهي من تنفيذ NSH نفسها. وتحتفظ NSH بهوية أصناف URL وBlob والتدفقات والأحداث الخاصة بها.

تُحمَّل الوحدات الإحدى عشرة جميعها على المضيفات الأصلية وفي تطبيقات المتصفح. تستخدم `Buffer` والتجزئة والتشفير والضغط التنفيذ المحمول نفسه المكتوب بـ Rust في WebAssembly، بما فيها الواجهات المتزامنة؛ وتستخدم القيم العشوائية إنتروبيا التشفير في المتصفح. تستخدم عمليات `path` في المتصفح مسارات POSIX ودليل عمل افتراضيًا `/`. تستخدم ملفات المتصفح تخزينًا دائمًا خاصًا بالتطبيق، وتستخدم WebSockets ناقل المتصفح. يفشل تنفيذ العمليات واستدعاءات TCP الخام بالخطأ `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` في المتصفحات.

<a id="how-they-compare-with-nodejs-and-gpui-shell"></a>

## مقارنتها بـ Node.js وgpui-shell

تتبع الوحدات أسماء Node وأشكاله للمجموعة الجزئية التي تصدّرها، وسلوك gpui-shell حيثما يحدّد سلوكًا. أما اختيارات NSH الخاصة فهي:

- تكون `exists` في `fs/promises` هي `true` عندما يكون هدف الرابط الرمزي مفقودًا، وتعمل `unlink` و`rename` و`rmdir` و`lstat` و`readlink` على الرابط الرمزي نفسه.
- في `Stats` و`Dirent` تكون حقولهما (`size`، `mtimeMs`، `name`، ...) خصائص خاصة بالكائن نفسه كما في Node، بينما توجد `isFile()` و`isDirectory()` و`isSymbolicLink()` على النموذج الأولي (prototype).
- يتلقى مستمع `ChildProcess` حمولة الحدث: نص المخرجات، أو `{ code, signal }` الخاص بالخروج (مع `error` و`errorCode` عندما ينهي وقت التشغيل العملية الابن). تُرجع `on` العملية الابن. وتُحلّ `run` إلى `{ code, signal, stdout, stderr }`: مخرجات gpui-shell مع الإشارة التي أنهت العملية الابن.
- تتكوّن بيئة العملية الابن من مجموعة صغيرة من المضيف إضافة إلى الأسماء الممنوحة للتطبيق، وتعمل في دليل بيانات التطبيق أو في `cwd` ضمن جذر `fs.write` ([العمليات](#processes)).
- تعطي `process.platform` و`process.arch` و`os.platform()` و`os.arch()` أسماء `std::env::consts` في Rust، كما تفعل نظيراتها في gpui-shell: `"macos"`، `"windows"`، `"linux"`، `"ios"`، `"android"`؛ `"aarch64"`، `"x86_64"` ([بيانات نظام التشغيل الوصفية](#os-metadata-and-logging)).
- تكون `process.dataDir` هي `null` عندما لا يكون للمضيف دليل بيانات؛ وتطلب `process.exit` من المضيف إغلاق واجهة التطبيق.
- الحدود جزء من كل واجهة برمجية: تُدرج الأحجام والأعداد ومهلات الانتظار مع كل وحدة أدناه.

<a id="failures"></a>

## حالات الفشل

تُبلغ الدالة التي تُرجع وعدًا (promise) عن كل فشل برفضه، كما تفعل `fs/promises` في Node: الوسيط الخاطئ، والمسار أو المضيف غير الممنوح للتطبيق، والحد المستنفد، وخطأ الإدخال/الإخراج على حد سواء، ولذا يكفي `catch` واحد (أو `.catch`) للتعامل معها كلها. أما الدالة المتزامنة (`process.spawn`، `process.exit`، `os.homedir`، `ChildProcess.write`، وباني `WebSocket` العام و`send`) فتُطلق استثناءً. الاستخدام الخاطئ (وسيط من نوع خاطئ، أو خيار خارج نطاقه) هو `TypeError` أو `RangeError`. يحمل كل فشل يستطيع التطبيق معالجته `code`، يبقى ثابتًا من إصدار إلى آخر؛ أما الرسالة فهي مكتوبة للبشر وقد تتغير، لذا تتفرّع التطبيقات بحسب `code`:

| `code` | المعنى |
|---|---|
| `ERR_ACCESS_DENIED` | لا تمنح `capabilities` الخاصة بالتطبيق هذا الاستدعاء. يحتوي الخطأ على `permission`، وهو مفتاح الصلاحية في `nsh.json` (`"fs"`، `"process"`، `"network"`)، وعلى `resource`، أي ما طُلب: المسار، أو الأمر (`"exit"` لـ `process.exit`)، أو `"host:port"` الخاص بمقبس، أو عنوان URL الخاص بـ WebSocket |
| `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` | الاستدعاء يخص منصات أخرى: الملفات تعمل على أجهزة سطح المكتب وفي المتصفحات، والعمليات على سطح المكتب، ومقابس TCP على المضيفات الأصلية، و`os.homedir()` على المضيفات التي تضبط دليلًا رئيسيًا |
| `ERR_NSH_QUOTA_EXCEEDED` | استُنفد أحد حدود وقت التشغيل: العمليات أو البيانات الجارية، أو العمليات الأبناء، أو المقابس، أو WebSockets، أو البايتات المنتظرة للإرسال، أو المستمعون |
| `ETIMEDOUT` | انتهت مهلة الاستدعاء: `timeoutMs` الخاص بـ `run`، أو اتصال، أو مصافحة WebSocket، أو كتابة، أو إغلاق |
| `ENOENT`، `EEXIST`، `EACCES`، `ECONNREFUSED`، ... | ردّ نظام التشغيل، برموز Node؛ و`EACCES` و`EPERM` هما رفض نظام التشغيل لملف، بمعزل عن صلاحيات التطبيق |
| `ERR_OUT_OF_RANGE`، `ERR_FS_FILE_TOO_LARGE`، `ERR_SOCKET_CLOSED`، `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` | رموز Node لحجم يتجاوز حدًا، واتصال مغلق، ومخرجات تتجاوز التقاط `run` |

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

قد يمنح التطبيق المضيف أقل مما يعلنه التطبيق ([البيئة المعزولة والصلاحيات](../docs/sandbox-and-capabilities.md))، لذا يعالج التطبيق `ERR_ACCESS_DENIED` كما يعالج أي طلب فاشل.

<a id="os-metadata-and-logging"></a>

## بيانات نظام التشغيل الوصفية والتسجيل

تُبلغ `os.platform(): string` و`os.arch(): string` عن نظام التشغيل والمعمارية الفعليين للمضيف الأصلي، وتحمل `process.platform` و`process.arch` القيم نفسها. وهي أسماء `std::env::consts::OS` و`ARCH` في Rust، كما هي في gpui-shell: `"macos"`، `"windows"`، `"linux"`، `"ios"`، `"android"` لنظام التشغيل، و`"aarch64"`، `"x86_64"` للمعمارية، ولذا تقارن التطبيقات بها مباشرة (`process.platform === "macos"`). `os.EOL: string` هو فاصل الأسطر الخاص بالمضيف. تُرجع `os.homedir(): string` مسارًا مطلقًا مضبوطًا للدليل الرئيسي للمضيف؛ وعند عدم ضبط أي مسار تُطلق خطأً يحمل `code` `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. مسارات الأدلة بيانات وصفية: فما زالت عمليات الملفات تتطلب صلاحيات `fs.read` / `fs.write`.

تقرأ تطبيقات المتصفح كائن `process.env` فارغًا، وتُطلق `os.homedir()` هناك `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`، لأن المسارات الرئيسية ومتغيرات البيئة تخص المضيفات الأصلية.

تشترك `import console from "console"` في كائن `console` العام الخاص بالـ VM. للوحدة تصدير افتراضي فقط، يدعم `log` و`info` و`debug` و`warn` و`error`، ولكلٍّ منها التوقيع `(...values: unknown[]): void`. وهي تستخدم تنسيق المسجِّل (logger) الخاص بـ NSH.

<a id="compression"></a>

## الضغط

`zlib` هي من LLRT، مع حدّ واحد تضيفه NSH: ينتج كل فك ضغط (`inflate`، `inflateRaw`، `gunzip`، `brotliDecompress`، `zstdDecompress` وصيغ `Sync` الخاصة بها) ما لا يزيد على 64 MiB، أو حدّ كومة الذاكرة (heap) الخاص بالـ VM إن كان أصغر. تُطلق المخرجات الأطول `RangeError`، كما يفعل Node.js مع `maxOutputLength`؛ ويضبط `maxOutputLength` الخاص بالتطبيق حدًا أقل لاستدعاء واحد. تُطلق `Buffer.alloc` و`Buffer.allocUnsafe` و`Buffer.allocUnsafeSlow` و`crypto.randomBytes` `RangeError` (`code` `ERR_OUT_OF_RANGE`) عند طلب حجم يتجاوز حدّ كومة الذاكرة في الـ VM، أو 1 GiB إن لم يوجد حدّ؛ وتُرجع `allocUnsafe` ذاكرة مصفّرة.

<a id="files"></a>

## الملفات

تقرأ `fs/promises` الملفات الأصلية وتكتبها على مضيفات سطح المكتب (macOS وWindows وLinux)، وتتعامل مع ملفات المتصفح الخاصة بالتطبيق عبر نظام الملفات الخاص بالأصل (Origin Private File System, OPFS). يُتحقق من كل مسار مقابل `capabilities.fs` قبل بدء العملية: جذور `read` لـ `readFile` و`readdir` و`stat` و`lstat` و`readlink` و`exists`، وجذور `write` لـ `writeFile` و`mkdir` و`rename` و`unlink` و`rmdir`. يرفض كل فشل الوعد: فالمسار الواقع خارج الصلاحيات يُرفض بـ `code` `ERR_ACCESS_DENIED` (`permission` `"fs"`، و`resource` هو المسار كما كتبه التطبيق)، قبل أي عمل على القرص.

```json
{
  "capabilities": {
    "fs": { "read": ["${dataDir}"], "write": ["${dataDir}"] }
  }
}
```

الجذور مسارات مطلقة، أو `${dataDir}` (دليل بيانات هذا التطبيق، يختاره المضيف)، أو `${pluginDir}` (دليل التطبيق)، أو `${homeDir}`، أو مسارات نسبية إلى دليل التطبيق. يُحلّ المسار النسبي في الاستدعاء داخل كل جذر ممنوح بالتتابع. وقد يضيّق المضيف المضمِّن (embedding host) الصلاحيات أكثر. تبقى كل عملية داخل جذرها الممنوح، بما في ذلك الروابط الرمزية؛ ويُتحقق من المسار المطلق كما كُتب، لذا يُوصل إلى الجذر بمساره نفسه (أو بمساره المحلول)، لا عبر رابط من خارجه. تعمل `lstat` و`readlink` و`exists` و`unlink` و`rename` و`rmdir` على الرابط الرمزي نفسه: تكون `exists` هي `true` لرابط رمزي هدفه مفقود، وتزيل `unlink` الرابط وتُبقي هدفه.

تحمل حالات الفشل خصائص أخطاء Node: `code` (`ENOENT`، `EEXIST`، `ENOTDIR`، `EISDIR`، `ENOTEMPTY`، `ELOOP`، `EACCES`، `EPERM`، ...؛ و`EILSEQ` للنص غير المشفّر بـ UTF-8، و`ERR_FS_FILE_TOO_LARGE` عند تجاوز حدّ القراءة)، و`syscall` و`path`، لذا يميّز `error.code === "ENOENT"` الملف المفقود. يُرفض المسار الواقع خارج الصلاحيات بـ `ERR_ACCESS_DENIED`، والاستدعاء على iOS أو Android (التي تحفظ تطبيقاتهما البيانات عبر [`Storage`](./nsh.md#storage)) بـ `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`، والوسيط الخاطئ (ترميز أو خيار غير معروف) بـ `TypeError`.

تُرجع `readFile` كائن `Uint8Array`، أو سلسلة نصية عند استخدام `"utf8"`، وتقرأ ملفات حتى 64 MiB. تكتب `writeFile` سلسلة نصية أو `Uint8Array` حتى 8 MiB، فتنشئ ملفًا عاديًا أو تستبدله. تسرد `readdir` حتى 10 000 اسم (بحجم 1 MiB منها؛ ويُرفض الدليل الأكبر بـ `RangeError`، `code` `ERR_OUT_OF_RANGE`)، مرتبة، أو كائنات `Dirent` (`name`، `isDirectory()`) عند استخدام `{ withFileTypes: true }`. تُحلّ `stat` و`lstat` إلى `Stats` يتضمن `size`، `mode`، `mtimeMs` / `atimeMs` / `birthtimeMs`، `mtime` / `atime` / `birthtime` بوصفها `Date`، و`isFile()` و`isDirectory()` و`isSymbolicLink()`. تزيل `rmdir` دليلًا فارغًا واحدًا. تشغّل الـ VM الواحدة حتى 1024 عملية في آن واحد وتحتفظ بما يصل إلى 64 MiB من بيانات الملفات قيد التنفيذ (البيانات المسلَّمة إلى `writeFile` حتى تُكتب، والبيانات المقروءة حتى يستقر وعدها)؛ ويُرفض الاستدعاء الذي يتجاوز هذه الحدود بـ `ERR_NSH_QUOTA_EXCEEDED`، و`writeFile` يتجاوز 8 MiB بـ `RangeError` (`code` `ERR_OUT_OF_RANGE`).

يقتصر تخزين المتصفح على أصل الصفحة ومساحة الأسماء الخاصة بالتطبيق، مع صلاحيات الملفات وحدود الأحجام نفسها التي يُتحقق منها في Rust. يتطلب OPFS سياقًا آمنًا، مثل HTTPS أو localhost. تأتي أوقات تعديل الملفات من البيانات الوصفية للمتصفح؛ وتكون أوقات الوصول/الإنشاء والأذونات (modes) غير المعروفة صفرًا. تستخدم `rename` نقلًا ذريًا لمقبض المتصفح وتُبلغ عن `ENOTSUP` عندما لا يوفّره المتصفح. مدخلات المتصفح هي ملفات عادية أو أدلة، وتُبلغ `readlink` عن `EINVAL`.
<a id="processes"></a>

## العمليات (Processes)

`process.spawn` و`process.run` تشغّلان الأوامر على المضيفات المكتبية (macOS وWindows وLinux). ينفّذ وقت التشغيل البرنامج مباشرة مع مصفوفة وسائط ودون shell، ويمتلك أنابيبه؛ ويصل stdout وstderr كنص UTF-8 تدريجي.

```json
{
  "capabilities": {
    "process": { "execute": ["git"], "env": ["GIT_AUTHOR_NAME"] },
    "fs": { "write": ["${dataDir}"] }
  }
}
```

تطابق الأوامر `process.execute` تطابقًا تامًا: `git` و`/usr/bin/git` منحتان منفصلتان. تُحلّ الأوامر المجرّدة عبر المسارات المطلقة في `PATH` الخاص بالمضيف؛ وعلى Windows يجد الأمر المجرّد أيضًا `<name>.com` و`<name>.exe` هناك. يعمل ملف الدُفعات (`.cmd`، `.bat`) عبر `cmd.exe`: امنح مساره المطلق (`C:\Windows\System32\cmd.exe`) ومرّر `/d` و`/c` والسكربت كوسائط. بيئة العملية الابن هي `PATH` و`HOME` و`USERPROFILE` و`SystemRoot` و`TEMP` و`TMP` و`TMPDIR` و`LANG` و`LC_*` من المضيف، إضافةً إلى الأسماء التي يمنحها `process.env` (تُطابَق تطابقًا تامًا، مع تجاهل حالة الأحرف على Windows فقط، لأن بيئتها كذلك). تعمل العملية الابن في دليل بيانات التطبيق (يُنشأ إن لم يكن موجودًا)، أو في `cwd`، وهو دليل موجود ضمن جذر `fs.write`، لأن العملية الابن قد تكتب في المكان الذي تعمل فيه. يمكن للمضيف المُضمِّن تضييق المنح.

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

يُحقّق `run` الوعد `{ code, signal, stdout, stderr }` لأي حالة خروج: `code` هي حالة الخروج و`signal` `null`، أو، عندما تنهي إشارةٌ العملية الابن، تكون `code` هي `null` و`signal` اسم الإشارة (`"SIGTERM"`). ويُرفض عند كل فشل. يُرجع `spawn` العملية الابن فورًا؛ ويفعّل `stdin: "pipe"` `write` و`end`، ويسلّم `lines: true` أسطرًا كاملة. يُرجع `on(event, handler)` العملية الابن، ويتلقى المعالج حمولة الحدث: النص، أو `{ code, signal }` مرة واحدة بعد المخرجات الأخيرة (مع `error` عندما ينهي وقت التشغيل العملية الابن: انتهاء المهلة، أو سطر أطول من المسموح) (وفورًا للمستمع المضاف لاحقًا). `pid` هو معرّف عملية الابن. يرمي `spawn` ما يُرفض به `run`، قبل بدء العملية الابن: أمر لا يمنحه `process.execute` يفشل بالخطأ `ERR_ACCESS_DENIED` (`permission` `"process"`، و`resource` هو الأمر)، و`cwd` خارج منح `fs.write` يفشل بالخطأ `ERR_ACCESS_DENIED` (`permission` `"fs"`، و`resource` هو `cwd`)، واستدعاء خارج المضيفات المكتبية يفشل بالخطأ `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`، واستدعاء يتجاوز حد العمليات الابن يفشل بالخطأ `ERR_NSH_QUOTA_EXCEEDED`؛ ويحمل فشل التشغيل `code` (`ENOENT` لملف تنفيذي مفقود، و`EACCES` لملف لا يستطيع نظام التشغيل تشغيله)، و`syscall` (`spawn <command>`) و`path`. يُرفض `run` بالخطأ `ETIMEDOUT` عند حلول مهلته وبالخطأ `RangeError` (`code` `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`) للمخرجات التي تتجاوز حد التقاطه؛ ويحمل خروج عملية ابن مُشغَّلة الرسالة نفسها في `error` ورمزها في `errorCode`. يكون `process.dataDir` هو `null` عندما لا يملك المضيف دليل بيانات. ينهي `kill` وانتهاء المهلة وتنظيف المالك التفاعلي وإنهاء VM شجرة العمليات بأكملها: على Unix تتلقى مجموعة العمليات الخاصة بها SIGTERM ثم SIGKILL بعد 250 ms (وعند الإنهاء، SIGKILL فورًا).

| الحد | القيمة |
|---|---|
| `timeoutMs` | حتى 4,294,967,295 ms؛ القيمة الافتراضية لـ `run` هي 30 ثانية، و`spawn` يعمل حتى الخروج |
| حد التقاط `run` | 8 MiB لكل تدفق |
| سطر واحد مع `lines: true` | 8 MiB |
| العمليات الابن لكل VM | 32 |
| المخرجات قيد النقل لكل VM | 8 MiB؛ تنتظر القارئات حتى تأخذها JS |
| stdin المعلّق لكل عملية ابن | 1 MiB؛ يرمي `write` الخطأ `ERR_NSH_QUOTA_EXCEEDED` عند تجاوزه |
| المستمعون | 64 لكل حدث لكل عملية ابن |

يطلب `process.exit(code?)` من المضيف إغلاق سطح التطبيق هذا. امنحه عبر `"exit": true` في `capabilities.process`؛ يمرّر المحرك الطلب عبر أمر الخروج من التطبيق الخاص بالمنصة. الاستدعاء الذي لا تغطيه المنحة يرمي `ERR_ACCESS_DENIED` (`permission` `"process"`، `resource` `"exit"`). تستقبل المضيفات طلبات الخروج عبر معالج خروج تثبّته؛ وفي غير ذلك يرمي الاستدعاء `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM`. على macOS يُغلق هذا نافذة السطح. وفي المتصفح يوقف التطبيق ويمسح سطحه مع إبقاء صفحة المضيف مفتوحة. يتحكم المضيف المُضمِّن في كيفية تعامل سطحه مع الطلب. يرفض Gallery هذه الصلاحية لكي يوضّح إجراء **Request host exit** الخاص به معالجة الأذونات ويُبقي العرض التوضيحي مفتوحًا.

<a id="network-permissions-and-boundaries"></a>

## أذونات الشبكة وحدودها

يحتفظ `fetch` العام بتنفيذ NSH لـ HTTP المتدفق، ويتحقق من `network.hosts` أو `network.http` للطلبات ولقفزات إعادة التوجيه. يدعم WebSocket كلًّا من `ws:` / `wss:`، والرسائل النصية والثنائية، ومستمعي الأحداث، ومصافحات الإغلاق. مصافحة WebSocket هي طلب HTTP GET، لذا يستخدم كل من `WebSocket` العام و`connect` الخاص بوحدة `websocket` منح HTTP: يُفحص `ws` بوصفه `http` و`wss` بوصفه `https`، باستخدام GET (ويجوز لقاعدة أن تدرج أيضًا `ws` / `wss` في `schemes`). يفحص NSH عنوان URL الأولي المُطبَّع قبل بدء الاتصال. تتصل المصافحة الأصلية بذلك العنوان وترفض إعادة التوجيه؛ أما إعادة توجيه WebSocket في المتصفح وسياسة الاتصال فيتحكم بهما المتصفح. ترفض كلتا الواجهتين عنوان URL يحتوي على بيانات اعتماد أو جزء (fragment). يحتفظ كل VM بحد أقصى 32 اتصال WebSocket عبر الواجهتين معًا، وتبلغ الرسائل حدًّا أقصى 8 MiB في كلتيهما.

يُرفض أي عنوان URL غير ممنوح للتطبيق قبل بدء أي اتصال. يبلّغ `WebSocket` العام عنه كما يبلّغ المتصفح عن اتصال فاشل: يُرجع المُنشئ المقبس، الذي يطلق بعد ذلك `error` و`close` (الرمز 1006، `wasClean` `false`)، فتسمعهما المعالجات التي يضبطها التطبيق مباشرة بعد المُنشئ. أما `connect` الخاص بالوحدة فيُرفض بالخطأ `ERR_ACCESS_DENIED` (`permission` `"network"`، و`resource` هو عنوان URL). يرمي WebSocket رقم 33 خطأً (في المُنشئ) أو يُرفض (`connect`) بالخطأ `ERR_NSH_QUOTA_EXCEEDED`، ويُعدّ عنوان URL المشوّه `SyntaxError` (في المُنشئ) أو `TypeError` (`connect`).

يُدرج `WebSocket` العام في الطابور ما لا يزيد على ثماني رسائل للإرسال، مع تخزين مؤقت بحد أقصى 8 MiB (`bufferedAmount`)؛ ويرمي `send()` الذي يتجاوز أيًّا منهما `ERR_NSH_QUOTA_EXCEEDED`، وعندما يكون المقبس في طور الإغلاق يتجاهل `send()` بياناته، كما يفعل في المتصفح. تنتهي مهلة مصافحته وكل عملية كتابة بعد 30 ثانية، وينتظر الإغلاق حتى 5 ثوانٍ لإطار الإغلاق من النظير. تُسلَّم الرسائل كأحداث `message` فور وصولها.

يحتفظ `WebSocketConnection` الخاص بوحدة `websocket` بما لا يزيد على ثماني عمليات معلّقة (قراءات وكتابات وإغلاق) وما لا يزيد على 8 MiB من الكتابات التي لم تُرسل بعد؛ ويُرفض `write()` الذي يتجاوز أيًّا منهما بالخطأ `ERR_NSH_QUOTA_EXCEEDED`، وتُرفض الرسالة التي تتجاوز 8 MiB بالخطأ `RangeError` (`code` `ERR_OUT_OF_RANGE`). يجوز أن ينتظر `read()` واحد في كل مرة؛ ويُرفض الثاني بالخطأ `TypeError`. تنتظر الرسائل التي تصل قبل قراءتها التطبيق، ويتبع تدفقها قراءاته: فما دامت ثماني رسائل أو 8 MiB تنتظر دون قراءة، يتوقف الاتصال عن القراءة من الشبكة، فينتظر إرسال النظير أيضًا، وتُستأنف القراءة عندما يقرأ التطبيق. تنتهي مهلة التحليل والاتصال والمصافحة معًا، وكل كتابة، والإغلاق، بعد 30 ثانية.

يحقّق `read()` الرسائل بترتيب وصولها. وبمجرد إغلاق الاتصال بشكل سليم (أغلقه النظير، أو استدعى التطبيق `close()`) وقراءة كل الرسائل التي سبقت ذلك، يُحقَّق `read()` بالقيمة `null`، كما يفعل مقبس `net` عند EOF؛ ثم يحمل `closeCode` و`closeReason` رمز إطار الإغلاق وسببه (`null` أثناء بقاء الاتصال مفتوحًا؛ و1005 لإطار إغلاق بلا رمز، و1006 لاتصال انتهى دون مصافحة إغلاق). يُرفض `read()` عند الفشل فقط، بعد الرسائل التي سبقته، مع `code` الخاص به: `ERR_SOCKET_CLOSED` لاتصال انتهى دون مصافحة إغلاق، و`ETIMEDOUT`، وهو رمز نظام التشغيل لخطأ في المقبس، أو `EPROTO` لخطأ في البروتوكول (مع `status` الخاص بـ HTTP لمصافحة مرفوضة). يرسل `close(code?, reason?)` رمزه (1000، وهو الافتراضي، أو من 3000 إلى 4999) وسببه (بحد أقصى 123 بايت UTF-8) في إطار الإغلاق، كما يفعل `close()` الخاص بـ `WebSocket` العام؛ ويُرفض أي رمز أو سبب خارج هذه الحدود بالخطأ `RangeError` (`code` `ERR_OUT_OF_RANGE`). ويتجاهل الرسائل التي لم تُقرأ بعد ويُحقَّق عندما يردّ النظير على مصافحة الإغلاق.

```tsx
import { connect } from "websocket";

const socket = await connect("wss://chat.example.com/socket");
await socket.write("hello");
for (let message; (message = await socket.read()) !== null; ) {
  console.log(message);
}
console.log(`closed: ${socket.closeCode} ${socket.closeReason}`);
```

يستخدم `net.connect({ host, port })` فقط `network.sockets`، وهي قائمة بوجهات `"host:port"` المطابقة تمامًا (`"[::1]:9000"` لـ IPv6)، وتُفحص قبل استعلام DNS. يمنح كل إدخال منفذًا واحدًا على مضيف واحد؛ أما أنماط المضيفات و`network.hosts` ومنح HTTP فتغطي حركة HTTP فقط، والتطبيق الذي لا يملك `"capabilities"` يسرد مقابسه كذلك. يوفّر `Socket` المُرجَع `read(size?)` و`write(text)` و`close()`؛ وتُرجع القراءات `Uint8Array`، أو `null` عند EOF. كل فشل يُرفض: وجهة غير ممنوحة تُرفض بالخطأ `ERR_ACCESS_DENIED` (`permission` `"network"`، `resource` `"host:port"`)، والمقبس رقم 33 والكتابات التي تتجاوز 4 MiB المسموح بانتظارها تُرفض بالخطأ `ERR_NSH_QUOTA_EXCEEDED`، وقراءة أو كتابة تتجاوز 1 MiB تُرفض بالخطأ `RangeError` (`code` `ERR_OUT_OF_RANGE`)؛ وتُرفض إخفاقات الاتصال والإدخال/الإخراج مع `code` الخاص بـ Node (`ECONNREFUSED` و`ENOTFOUND` و`ETIMEDOUT` و`ECONNRESET` وغيرها) و`syscall`، ويحمل إخفاق الاتصال أيضًا `address` و`port`، وتُرفض الكتابة على مقبس مغلق بالخطأ `ERR_SOCKET_CLOSED` (وتُرجع القراءة هناك `null`). للاتصالات والإدخال/الإخراج مهلات مدتها 30 ثانية، وكل قراءة/كتابة محدودة بـ 1 MiB، ويمكن أن تنتظر ما لا يزيد على 4 MiB من الكتابات قبل إرسالها، ويُنهي `close()` القراءات والكتابات المعلّقة فورًا. يُبقي كل VM ما لا يزيد على 32 مقبسًا مفتوحًا أو قيد الاتصال. هذه واجهة مقبس عميل قائمة على الوعود (promises).

يعمل TCP الخام على المضيفات الأصلية. تستخدم واجهتا WebSocket كلتاهما نقل المتصفح في تطبيقات الويب، مع الإبقاء على فحوص الصلاحيات في Rust والحدود المذكورة أعلاه. وتُبلّغ ترويسات المصافحة المخصصة في المتصفح عن خطأ صريح بعدم دعم الخيار. كما تسري سياسات اتصال المتصفح. وتتقاطع منح المُضمِّن مع إعلان صلاحيات التطبيق.

<a id="websocket-grant-example"></a>

## مثال على منحة WebSocket

يسمح هذا المقطع من `nsh.json` بمصافحة GET لعنوان `wss` هذا، مع الإبقاء على مساره ونطاق HTTPS:

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

## مثال على منحة TCP

يستخدم TCP منحة مقبس: المضيف والمنفذ المحددان تمامًا اللذان يتصل بهما التطبيق.

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

افتح **Standard APIs** في `examples/gallery` لتشغيل عمليات الملفات والعمليات الابن وTCP وواجهتي WebSocket، وللاطلاع على بيانات المضيف الوصفية والمهام المصطفّة. يوضّح إجراء الأدوات المساعدة المخازن المؤقتة والتجزئة والضغط وعناوين URL للملفات. يعرض كل إجراء نتيجته أو خطأه. تبقى الملفات في دليل مؤقت ضمن دليل بيانات Gallery نفسه وتُزال بعد الإجراء. تتصل إجراءات TCP وWebSocket بخوادم echo محلية على المنفذين 9876 و9877. على الويب، تستخدم إجراءات الملفات OPFS، وتعمل الأدوات المساعدة في WebAssembly، وتستخدم إجراءا WebSocket كلاهما اتصالات المتصفح؛ أما إجراءات العمليات وTCP فتعرض أخطاء المنصة المصنّفة الخاصة بالمضيف.

يستخدم **AI Chat** في Gallery `process.spawn` للدردشة عبر Claude أو Codex CLI المثبّت محليًا على سطح المكتب. سجّل الدخول عبر CLI في الطرفية، ثم اختر المزوّد في حقل الإدخال. تستخدم الردود المحادثة سياقًا؛ ويؤدي Stop ومغادرة الشاشة إلى إنهاء العملية الابن. تشغّل منصتا الويب والجوال محادثات متدفقة مكتوبة مسبقًا، تشمل الاستدلال وبطاقات الأدوات والتعافي من الأخطاء.
