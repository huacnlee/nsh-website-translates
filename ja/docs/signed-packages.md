---
title: "署名付きパッケージ"
description: "ホストアプリがダウンロードして検証するアプリコードの配布方法:鍵、証明書、nsh publish、再署名、検証、失効、ロールバック保護。"
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# 署名付きパッケージ

署名付きパッケージ (`.nshpkg`) は、ホストアプリが同梱していない NSH コードを実行するための仕組みです。たとえば、ホストアプリ自身の NSH 画面のアップデートや、サードパーティ製のミニアプリがこれにあたります。`nsh publish` がアプリをビルドして署名し、ホストアプリは何かを実行する前に、署名、証明書チェーン、失効情報、ビルド番号を検証します。

パッケージに含まれるのは TSX です。ホストアプリの Rust コード (Rust で書かれたアプリ、そのクレートのコンポーネント、モジュール、クラス) はホストアプリ自体の一部としてアプリとともに配布され、パッケージの TSX は、他の TSX と同様に、そのスペシファイアを使ってそれらをインポートします ([Rust でのビルド](./rust.md#extending-a-rust-app-with-tsx))。このため、Rust アプリはコア部分を Rust で保ち、頻繁に変わる画面を署名付きパッケージとして配信できます。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH はパッケージを検証して実行しますが、配信は行いません。パッケージの入手元 (アップデートサーバー、CDN、ミニアプリのストアなど) や、アプリがいつダウンロードするかは、ホストアプリ側で決めます。

<a id="why-packages-are-signed"></a>

## パッケージに署名する理由

ホストアプリが実行する JS は、アプリが[許可](./sandbox-and-capabilities.md)したすべてのものにアクセスできます。そのため、アプリが信頼する相手から提供されたものでなければなりません。もう一つ理由があります。NSH はアプリを QuickJS バイトコードとして出荷します。バイトコードはソースより高速にロードできますが、QuickJS はバイトコードを検証せず、細工されたバイトコードはメモリを破壊する可能性があります。そのため NSH がバイトコードをロードするのは、アプリ自身の (システム署名された) リソース、開発者が接続した開発サーバー、検証済みのパッケージに限られます。それ以外は JS ソースでなければなりません。

<a id="keys-two-levels"></a>

## 鍵: 2 つの階層

- **ルート鍵**はオフラインで保管します。ホストアプリはその公開鍵を信頼します。複数のルートを信頼することもでき、これによってルートをローテーションできます。
- ルートは**リリース鍵を認証**します。証明書には、リリース鍵、署名してよいアプリ ID、有効期間が記されます。
- **パッケージはリリース鍵で署名**され、その証明書を伴います。そのため、ホストアプリを更新しなくてもリリース鍵をローテーション (または失効) できます。ホストアプリが知っているのはルートだけです。

すべての鍵には、公開鍵から導出される ID (SHA-256 の先頭 8 バイトを 16 進数にしたもの) があり、どのコマンドでも表示されます。

<a id="create-the-keys"></a>

### 鍵を作成する

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

各鍵は 2 つのファイルから成ります。所有者のみ読み取り可能な `<name>.secret` と、`<name>.pub` で、どちらも base64 の 1 行です。`nsh keygen` は既存の鍵を上書きしません。

> [!CAUTION]
> `root.secret` はオフラインで保管してください。たとえば、金庫の中の暗号化されたドライブに置きます。これを持つ人は、そのルートを信頼するすべてのホストアプリが受け入れる鍵を認証できてしまいます。リリース鍵は、ビルドマシンか CI のシークレットに置きます。

<a id="certify-a-release-key"></a>

### リリース鍵を認証する

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| フラグ | 説明 |
|---|---|
| `--root <file>` | ルートの秘密鍵。 |
| `--key <file>` | リリース鍵の公開鍵。 |
| `--apps <pattern>` | 署名してよいアプリ ID: `*` (すべて)、`com.example.*` (`com.example.` 以下の ID)、または完全一致する ID。複数指定できます。 |
| `--days <n>` | 現在から数えて、署名できる期間。デフォルトは 365。 |
| `-o, --out <file>` | 書き出す証明書。 |

証明書は小さな JSON ファイルで、秘密ではありません。

<a id="publish-a-package"></a>

## パッケージを公開する

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` は、アプリをリリースモードでビルドして署名します。アプリ ID、名前、バージョン、ビルドは、エントリの隣にある `nsh.json` から取得され、フラグで上書きできます。

| フラグ | 説明 |
|---|---|
| `--key <file>` | リリース鍵の秘密鍵。 |
| `--cert <file>` | その証明書。 |
| `-o, --out <file>` | 書き出すパッケージ。デフォルトは `.nsh/out/<id>-<build>.nshpkg`。 |
| `--id <id>` | アプリ ID。例: `com.example.app`。 |
| `--app-version <version>` | バージョン。例: `1.2.0`。 |
| `--build <n>` | ビルド番号。必須です (ここか `nsh.json` で指定)。リリースのたびに増やす必要があります。 |
| `--source-map <where>` | `package` (デフォルト): パッケージに含めます。`file`: パッケージには含めず、その隣の `<package>.map` に置きます。`none`: 含めません。[公開済みパッケージのエラー](#errors-from-published-packages)を参照してください。 |
| `--strip-debug` | バイトコードから行・列テーブルを省きます。パッケージは小さくなりますが、エラースタックに位置情報が含まれなくなります。 |
| `--min-runtime <version>` | パッケージを実行できる最小のランタイム。例: `0.2.0` (`nsh.json` `minRuntime`)。デフォルトはこの CLI のバージョンです。[パッケージを実行できるランタイム](#which-runtimes-run-a-package)を参照してください。 |

`nsh publish` は、デバイスが拒否するようなものには署名しません。証明書がアプリ ID と現在時刻をカバーしている必要があります。

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### パッケージを実行できるランタイム

パッケージは、それを実行できる最も古い NSH ランタイムを明示します。それより古いランタイムを持つホストアプリは、何かを実行する前にそのパッケージを拒否します。

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

デフォルトでは、これはパッケージをビルドした CLI のバージョンです。バンドルはその CLI のモジュールに対してコンパイルされるため、そのランタイムが実行できることが確実だからです。現場のホストアプリがより古いランタイムを持ち、アプリがそのランタイムにある機能だけを使っている場合は、`--min-runtime` (または `nsh.json` の `minRuntime`) で、そのランタイム向けに公開します。

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

バージョンは `MAJOR.MINOR.PATCH` の形式です。プレリリースのサフィックス (`0.2.0-beta.1`) は、それを除いたバージョンとして扱われます。CLI より新しいバージョンは指定できません。アップロードする前に、そのランタイムを持つホストアプリでパッケージを試してください。古いランタイムにないインポートや関数は、モジュールのロード時に失敗します。

<a id="what-a-package-holds"></a>

### パッケージの内容

パッケージは 1 つのファイルです。JSON ヘッダー (アプリ ID、名前、バージョン、ビルド、宣言された capability、バイトコードのバージョン、最小ランタイム、署名時刻、リリース鍵の証明書、SHA-256 付きのファイルテーブル)、続いてファイル群、最後にそれより前のすべてに対するリリース鍵の Ed25519 署名が並びます。ファイルは次のとおりです。

- アプリの JS ソース (常に含まれます)
- そのバイトコード。デバイスのランタイムのバイトコードバージョンが同じ場合にのみ使われます (それ以外ではソースが実行されるため、パッケージはより新しいランタイムでも動作し続けます)
- ソースマップ (`--source-map file` または `none` で公開した場合を除く)
- インポートされるアセット (画像、フォント)

失効に使われるパッケージの識別子は、ファイル全体の SHA-256 です。

<a id="packages-from-newer-versions-of-nsh"></a>

### より新しいバージョンの NSH によるパッケージ

ホストアプリは、より新しい `nsh publish` が署名したパッケージも、そのランタイムがパッケージの[最小ランタイム](#which-runtimes-run-a-package)以上である限り実行します。新しいバージョンが追加したもののうち、ホストのランタイムが知らないものは無視され、パッケージに許される範囲が広がることはありません。

- 知らないヘッダーフィールドやファイルは無視されます (署名とハッシュの対象には含まれたままです)。ただし、パッケージがあるフィールドを「ランタイムが理解しなければならないもの」として印付けしている場合は、古いランタイムはそのパッケージを拒否します。
- 知らない [capability](./sandbox-and-capabilities.md) は付与されません。また、知らないキーを持つ capability や `http` の許可は、そのキーが制限を表している可能性があるため、全体が破棄されます。

無視された内容は、パッケージのロード時にログに記録されます。

<a id="sign-a-package-again"></a>

## パッケージに再署名する

複数のアプリのパッケージを配信するプラットフォームは、独自の 1 つの鍵ですべてに署名できます。CI が各パッケージをビルドしてテスト用アプリが信頼する鍵で署名し、プラットフォームがそれを本番アプリが信頼する鍵で再署名します。

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| フラグ | 説明 |
|---|---|
| `--key <file>` | リリース鍵の秘密鍵。 |
| `--cert <file>` | その証明書。 |
| `-o, --out <file>` | 書き出すパッケージ。読み込んだパッケージと同じでも構いません。デフォルト: `.nsh/out/<id>-<build>.nshpkg`。 |

パッケージには、CI が入れたものがすべてそのまま残ります。ファイル、アプリ ID、バージョン、ビルド、宣言された capability、[最小ランタイム](#which-runtimes-run-a-package)、そして[より新しいバージョンの NSH](#packages-from-newer-versions-of-nsh) が書き込んだ内容です。証明書、署名時刻、署名は新しい鍵のものになるため、パッケージは固有の SHA-256 を持つことになり、それが[失効](#revoke-keys-and-packages)に使う値になります。

署名する前に、`nsh publish` はパッケージが無傷であること (証明書が示す鍵で署名されていること、ファイルテーブルがデータをカバーしていること、すべてのファイルがハッシュと一致していること) と、新しい証明書がアプリ ID と現在時刻をカバーしていることを確認します。以降は新しい署名が、バイトコードを含むパッケージを保証します。そのため、プラットフォームは自社のビルドが作ったパッケージに再署名します。Rust ツールは `nsh_package::resign(&bytes, &key, &certificate)` で再署名します。

<a id="verify-a-package"></a>

## パッケージを検証する

`nsh verify` は、指定されたルートを信頼するホストアプリとまったく同じようにパッケージを検査します。

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| フラグ | 説明 |
|---|---|
| `--root <file>` | 信頼するルートの公開鍵。複数指定できます。指定しない場合は、パッケージ自身の署名だけが検査されます。 |
| `--revocations <file>` | 最初に適用する失効リスト。 |

デバイスは次の順で検査します。

1. 信頼されたルートによる証明書の署名
2. リリース鍵が失効していないこと
3. リリース鍵によるパッケージの署名
4. 証明書がアプリ ID と署名時刻をカバーしていること
5. パッケージが必要とする最小ランタイム
6. ファイルテーブルがデータを過不足なくカバーし、各ファイルがそのハッシュと一致すること
7. パッケージ自体が失効していないこと
8. ビルドが、そのアプリでこれまでに受け入れた最大のビルドより古くないこと (ロールバック保護)

拒否されたパッケージは、どの検査が失敗したかを示すエラーを発生させます。それまで実行されていたアプリは実行され続けます。

<a id="revoke-keys-and-packages"></a>

## 鍵とパッケージを失効させる

ルートは**失効リスト**に署名します。これは、もうロードしてはならないリリース鍵とパッケージを列挙したものです。

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| フラグ | 説明 |
|---|---|
| `--root <file>` | ルートの秘密鍵。 |
| `--extend <file>` | このリストのエントリを引き継ぎます (最後に公開されたもの)。 |
| `--sequence <n>` | リストの番号。それまでに公開されたどの番号よりも大きくします。`--extend` を指定した場合のデフォルトは、そのリストの番号に 1 を足した値です。 |
| `--key <id>` | 失効させるリリース鍵の ID。複数指定できます。 |
| `--package <sha256>` | 失効させるパッケージの SHA-256 (`nsh verify` が表示するもの)。複数指定できます。 |
| `-o, --out <file>` | 書き出すリスト。 |

トラストストアは、すでに持っているものより大きいシーケンス番号のリストしか受け入れません。そのため、古いリストを再送して失効を取り消すことはできません。最新のリストを、アプリが取得する場所に公開し、パッケージを開く前に `updateRevocations` で適用してください。

<a id="rollback-protection"></a>

## ロールバック保護

ホストアプリがパッケージを受け入れると、トラストストアはそのアプリ ID のビルド番号を記録し、以降はそれより古いビルドを拒否します。既知の脆弱性を持つ古い署名付きパッケージを入手した攻撃者でも、アプリにそれを実行させることはできません。記録はストアの状態ディレクトリ (`nsh-trust.json`) に永続化されるため、再起動後も保持されます。GPUI では、新しいパッケージが正常に動作したと確認できてから、ホストアプリが記録を行うこともできます (`verify_package`、続いて `accept_package`。以下を参照)。

<a id="loading-packages-in-a-host-app"></a>

## ホストアプリでパッケージをロードする

検証ではパッケージ全体のハッシュを計算し、そのアセットを (パッケージごとに 1 回、トラストストアのディレクトリ内に) 展開します。そのため UI スレッドの外で実行され、結果の実行は UI スレッド上で行われます。

**GPUI (Rust)**。ホストアプリは、パッケージが正常に動作したと確認できた後で初めて受け入れることもできます。

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

パッケージが受け入れられるまでは、その前に受け入れられたビルドも引き続き検証を通ります。そのため、新しいパッケージが失敗したホストアプリは、それまで実行していたものに戻れます (`AppView::on_error` の致命的エラーや、受け入れ前のクラッシュがその合図です)。受け入れ済みのビルドより古いビルドは引き続き拒否され、その間に失効したパッケージは受け入れられません。`load_package` は検証と受け入れを一度に行います。iOS と Android では `openPackage` が同じ動作をします。

パッケージが宣言した [capability](./sandbox-and-capabilities.md) はパッケージとともに渡されます。パッケージにできるのは、宣言したことのうち、ホストアプリがさらに許可したことだけです。

完全な API: [GPUI](./gpui.md#embedding-in-a-gpui-app)、[iOS アプリへの組み込み](./ios.md#signed-packages)、[Android アプリへの組み込み](./android.md#signed-packages)。

<a id="errors-from-published-packages"></a>

## 公開済みパッケージのエラー

パッケージのバイトコードは行・列テーブルを保持しているため、そのエラーには位置情報が含まれます。ランタイムは、エラーをホストアプリのエラーハンドラーに渡す前に、パッケージのソースマップを使ってその位置をあなたのソースにマッピングします。

```text
Error: boom
    at n (App.tsx:5:3)
```

ソースマップにはアプリの元のソースが含まれ、パッケージ内で最大のファイルになることがよくあります。ギャラリーの例では 2.6 MB のおよそ半分を占めます。ソースマップを公開したくない場合は、パッケージに含めず、その隣に置いて公開します。

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

この場合、デバイスはバンドルの位置 (`at n (bundle.js:1:80)`) を報告します。マップは、それが属するパッケージと一緒に保管し、ホストアプリが報告した内容を `nsh symbolicate` でマッピングしてください。

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` は、エラーテキストをファイルまたは標準入力から読み込み、マップファイル、またはマップを含むパッケージを受け取ります。行テーブルはバイトコードを約 5 分の 1 増やします (マップ込みのパッケージでは 3〜5%)。`--strip-debug` はそれらを省きます。その場合、スタックは `at n (<null>:0:1)` と表示され、マッピングするものはありません。

<a id="trying-a-package-in-development"></a>

## 開発中にパッケージを試す

`nsh run` がインストールする開発用ホストは、組み込みアプリと同じ方法でパッケージを実行できます。

iOS では、ホスト実行ファイルは `--package <file>` と 1 つ以上の `--root <root.pub>` を受け取ります。`nsh run` がシミュレーターにホストをインストールした後 (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Android では、開発用ホスト (`DevActivity`。`nsh run --target android` がインストールします) が、エクストラ `package` (デバイス上のパス) と `root` (カンマ区切りの base64 公開鍵) を受け取ります。

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

これらのトラスト状態は、一時ディレクトリ (iOS) またはキャッシュディレクトリ (Android) にあります。そのため、受け入れたものより古いビルドは、そこでも拒否されます。
<a id="a-release-checklist"></a>

## リリースチェックリスト

1. ルートキーはオフラインで保管し、チームまたはアプリファミリーごとにリリースキーを certify してください。有効期間は1年以内にします。
2. リリースのたびに `nsh.json` の `build` を引き上げてください。`nsh publish` は、これがないパッケージを拒否します。
3. アップロードする前に、パッケージに対して `nsh verify --root root.pub` を実行してください。
4. `root.pub` はホストアプリ内に同梱してください。失効リストは別途配布すると、アプリを更新せずに失効できます。
5. リリースキーが漏洩した場合は、そのキーを失効させ(`nsh revoke --extend … --key <id>`)、新しいキーを certify して、再度公開してください。
6. アプリに対して署名を行うプラットフォームを使う場合は、CI 専用のルートを用意してテスト用アプリだけがそれを信頼するようにし、本番アプリにはプラットフォームのルートを同梱してください。プラットフォームが CI のパッケージに再署名します(`nsh publish <package>`)。

<a id="see-also"></a>

## 関連項目

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
