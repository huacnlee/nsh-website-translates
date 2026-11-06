---
title: "서명된 패키지"
description: "호스트 앱이 다운로드하고 검증하는 앱 코드를 배포하세요: 키, 인증서, nsh publish, 재서명, 검증, 폐기 및 롤백 방지."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# 서명된 패키지

서명된 패키지(`.nshpkg`)는 호스트 앱이 함께 배포되지 않은 NSH 코드를 실행하는 방법입니다. 호스트 앱 자체 NSH 화면의 업데이트나 서드파티 미니 앱이 그 예입니다. `nsh publish` 명령이 앱을 빌드하고 서명하면, 호스트 앱은 아무것도 실행하기 전에 서명, 인증서 체인, 폐기 여부, 빌드 번호를 검증합니다.

패키지에는 TSX가 들어 있습니다. 호스트 앱의 Rust 코드(Rust로 작성된 앱, 그 crate의 컴포넌트, 모듈, 클래스)는 호스트 앱 자체의 일부로 앱과 함께 배포되며, 패키지의 TSX는 다른 TSX와 마찬가지로 해당 지정자(specifier)로 이를 import합니다([Rust로 빌드하기](./rust.md#extending-a-rust-app-with-tsx)). 따라서 Rust 앱은 핵심을 Rust로 유지하고, 자주 바뀌는 화면은 서명된 패키지로 전달할 수 있습니다.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH는 패키지를 검증하고 실행할 뿐, 전달하지는 않습니다. 패키지를 어디에서 가져올지(업데이트 서버, CDN, 미니 앱 스토어)와 앱이 언제 다운로드할지는 호스트 앱이 결정합니다.

<a id="why-packages-are-signed"></a>

## 패키지에 서명하는 이유

호스트 앱이 실행하는 JS는 앱이 [부여한](./sandbox-and-capabilities.md) 모든 것에 접근할 수 있으므로, 앱이 신뢰하는 주체가 제공한 것이어야 합니다. 두 번째 이유도 있습니다. NSH는 앱을 QuickJS 바이트코드로 배포하는데, 이는 소스보다 빠르게 로드되지만 QuickJS가 바이트코드를 검증하지 않아 조작된 바이트코드는 메모리를 손상시킬 수 있습니다. 그래서 NSH는 앱 자체의(시스템 서명된) 리소스, 개발자가 연결한 개발 서버, 검증된 패키지에서만 바이트코드를 로드합니다. 그 외에는 반드시 JS 소스여야 합니다.

<a id="keys-two-levels"></a>

## 키: 두 단계

- **루트 키**는 오프라인으로 보관합니다. 호스트 앱은 루트 키의 공개 키를 신뢰하며, 여러 루트를 신뢰할 수도 있습니다. 이것이 루트를 교체하는 방법입니다.
- 루트는 **릴리스 키를 인증**합니다. 인증서에는 릴리스 키, 그 키로 서명할 수 있는 앱 id, 유효 기간이 명시됩니다.
- **패키지는 릴리스 키로 서명**되며 해당 키의 인증서를 포함합니다. 따라서 호스트 앱은 루트만 알고 있으므로, 호스트 앱을 업데이트하지 않고도 릴리스 키를 교체(또는 폐기)할 수 있습니다.

모든 키에는 공개 키에서 파생된 id(SHA-256의 처음 8바이트를 16진수로 표기)가 있으며, 모든 명령이 이를 출력합니다.

<a id="create-the-keys"></a>

### 키 만들기

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

각 키는 두 개의 파일로 구성됩니다. `<name>.secret`(소유자만 읽을 수 있음)와 `<name>.pub`이며, 둘 다 base64 한 줄입니다. `nsh
keygen`은 기존 키를 덮어쓰지 않습니다.

> [!CAUTION]
> `root.secret`은(는) 오프라인으로 보관하세요. 예를 들어 금고 안의 암호화된 드라이브에 두는 방법이 있습니다. 이 키를 가진 사람은 해당 루트를 신뢰하는 모든 호스트 앱이 받아들이는 키를 인증할 수 있습니다. 릴리스 키는 빌드 머신이나 CI 시크릿에 두세요.

<a id="certify-a-release-key"></a>

### 릴리스 키 인증하기

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| 플래그 | 설명 |
|---|---|
| `--root <file>` | 루트의 비밀 키입니다. |
| `--key <file>` | 릴리스 키의 공개 키입니다. |
| `--apps <pattern>` | 서명할 수 있는 앱 id: `*`(모든 id), `com.example.*`(`com.example.` 아래의 id) 또는 정확한 id입니다. 여러 번 지정할 수 있습니다. |
| `--days <n>` | 지금부터 서명할 수 있는 기간입니다. 기본값은 365입니다. |
| `-o, --out <file>` | 작성할 인증서입니다. |

인증서는 작은 JSON 파일이며 비밀이 아닙니다.

<a id="publish-a-package"></a>

## 패키지 게시하기

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish`은(는) 앱을 릴리스 모드로 빌드하고 서명합니다. 앱 id, 이름, 버전, 빌드는 엔트리 옆의 `nsh.json`에서 가져오며, 플래그로 덮어쓸 수 있습니다.

| 플래그 | 설명 |
|---|---|
| `--key <file>` | 릴리스 키의 비밀 키입니다. |
| `--cert <file>` | 해당 인증서입니다. |
| `-o, --out <file>` | 작성할 패키지입니다. 기본값은 `.nsh/out/<id>-<build>.nshpkg`입니다. |
| `--id <id>` | 앱 id입니다. 예: `com.example.app`. |
| `--app-version <version>` | 버전입니다. 예: `1.2.0`. |
| `--build <n>` | 빌드 번호입니다. 필수이며(여기 또는 `nsh.json`에서 지정), 릴리스마다 증가해야 합니다. |
| `--source-map <where>` | `package`(기본값): 패키지 안에 포함합니다. `file`: 패키지 옆의 `<package>.map`에 두고 패키지에는 포함하지 않습니다. `none`: 제외합니다. [게시된 패키지의 오류](#errors-from-published-packages)를 참고하세요. |
| `--strip-debug` | 바이트코드에서 행/열 테이블을 제외합니다. 패키지가 더 작아지지만 오류 스택에 위치 정보가 없습니다. |
| `--min-runtime <version>` | 패키지를 실행할 수 있는 최저 런타임입니다. 예: `0.2.0`(`nsh.json` `minRuntime`). 기본값은 이 CLI의 버전입니다. [패키지를 실행하는 런타임](#which-runtimes-run-a-package)을 참고하세요. |

`nsh publish`은(는) 기기가 거부할 패키지에는 서명하지 않습니다. 인증서가 앱 id와 현재 시각을 포함해야 합니다.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### 패키지를 실행하는 런타임

패키지는 자신을 실행할 수 있는 최저 NSH 런타임을 명시하며, 더 오래된 런타임을 가진 호스트 앱은 아무것도 실행하기 전에 해당 패키지를 거부합니다.

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

기본값은 패키지를 빌드한 CLI의 버전입니다. 번들이 해당 CLI의 모듈을 기준으로 컴파일되므로, 그 런타임이 패키지를 실행할 수 있다고 알려진 런타임이기 때문입니다. 현장의 호스트 앱이 더 오래된 런타임을 쓰고 앱이 그 런타임이 가진 기능만 사용한다면, `--min-runtime`(또는 `nsh.json`의 `minRuntime`)로 해당 런타임을 대상으로 게시하세요.

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

버전은 `MAJOR.MINOR.PATCH` 형식이며, 프리릴리스 접미사(`0.2.0-beta.1`)는 접미사를 뗀 버전으로 간주됩니다. CLI보다 새로운 버전은 지정할 수 없습니다. 업로드하기 전에 해당 런타임을 가진 호스트 앱에서 패키지를 시험해 보세요. 오래된 런타임에 없는 import나 함수는 모듈이 로드될 때 실패합니다.

<a id="what-a-package-holds"></a>

### 패키지의 구성

패키지는 하나의 파일입니다. JSON 헤더(앱 id, 이름, 버전, 빌드, 선언된 capability, 바이트코드 버전, 최소 런타임, 서명 시각, 릴리스 키의 인증서, 각 파일의 SHA-256을 담은 파일 테이블), 그다음 파일들, 그리고 그 앞의 모든 내용에 대한 릴리스 키의 Ed25519 서명으로 이루어집니다. 파일은 다음과 같습니다.

- 앱의 JS 소스(항상 포함),
- 바이트코드. 기기의 런타임이 같은 바이트코드 버전일 때만 사용되며(그렇지 않으면 소스가 실행되므로 패키지는 더 새로운 런타임에서도 계속 동작합니다),
- 소스 맵(`--source-map file` 또는 `none`로 게시한 경우 제외),
- 패키지가 import하는 에셋(이미지, 폰트).

폐기에 사용되는 패키지의 식별자는 파일 전체의 SHA-256입니다.

<a id="packages-from-newer-versions-of-nsh"></a>

### 더 새로운 버전의 NSH로 만든 패키지

호스트 앱은 더 새로운 `nsh publish`이(가) 서명한 패키지도, 호스트의 런타임이 패키지의 [최소 런타임](#which-runtimes-run-a-package) 이상이기만 하면 실행합니다. 새 버전이 추가했지만 호스트의 런타임이 모르는 항목은 제외되며, 패키지가 할 수 있는 일을 넓히지 않습니다.

- 모르는 헤더 필드와 파일은 무시됩니다(서명과 해시에는 여전히 포함됩니다). 단, 패키지가 어떤 필드를 런타임이 반드시 이해해야 하는 필드로 표시한 경우에는 더 오래된 런타임이 해당 패키지를 거부합니다.
- 모르는 [capability](./sandbox-and-capabilities.md)는 부여되지 않으며, 모르는 키를 가진 capability 또는 `http` 부여는 그 키가 제한을 의미할 수 있으므로 통째로 제외됩니다.

제외된 항목은 패키지가 로드될 때 로그에 기록됩니다.

<a id="sign-a-package-again"></a>

## 패키지에 다시 서명하기

여러 앱의 패키지를 배포하는 플랫폼은 자체 키 하나로 모든 패키지에 서명할 수 있습니다. CI가 각 패키지를 빌드해 테스트 앱이 신뢰하는 키로 서명하면, 플랫폼이 프로덕션 앱이 신뢰하는 키로 다시 서명합니다.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| 플래그 | 설명 |
|---|---|
| `--key <file>` | 릴리스 키의 비밀 키입니다. |
| `--cert <file>` | 해당 인증서입니다. |
| `-o, --out <file>` | 작성할 패키지입니다. 읽은 패키지와 같아도 됩니다. 기본값: `.nsh/out/<id>-<build>.nshpkg`. |

패키지는 CI가 넣은 모든 것을 그대로 유지합니다. 파일, 앱 id, 버전과 빌드, 선언된 capability, [최소 런타임](#which-runtimes-run-a-package), 그리고 [더 새로운 버전의 NSH](#packages-from-newer-versions-of-nsh)가 기록한 내용입니다. 인증서, 서명 시각, 서명은 새 키의 것으로 바뀌므로 패키지는 고유한 SHA-256을 갖게 되며, 이것이 패키지를 [폐기](#revoke-keys-and-packages)할 때 사용하는 값입니다.

서명하기 전에 `nsh publish`은(는) 패키지가 온전한지(인증서에 명시된 키로 서명되었는지, 파일 테이블이 데이터를 모두 포함하는지, 모든 파일이 해시와 일치하는지)와 새 인증서가 앱 id와 현재 시각을 포함하는지 확인합니다. 이후로는 새 서명이 바이트코드를 포함한 패키지를 보증하므로, 플랫폼은 자체 빌드로 만든 패키지에 다시 서명합니다. Rust 도구는 `nsh_package::resign(&bytes, &key, &certificate)`로 다시 서명합니다.

<a id="verify-a-package"></a>

## 패키지 검증하기

`nsh verify`은(는) 주어진 루트를 신뢰하는 호스트 앱과 똑같이 패키지를 검사합니다.

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| 플래그 | 설명 |
|---|---|
| `--root <file>` | 신뢰하는 루트의 공개 키입니다. 여러 번 지정할 수 있습니다. 지정하지 않으면 패키지 자체의 서명만 검사합니다. |
| `--revocations <file>` | 먼저 적용할 폐기 목록입니다. |

기기는 다음을 순서대로 검사합니다.

1. 신뢰하는 루트가 한 인증서의 서명
2. 릴리스 키가 폐기되지 않았는지
3. 릴리스 키가 한 패키지의 서명
4. 인증서가 앱 id와 서명 시각을 포함하는지
5. 패키지가 필요로 하는 최소 런타임
6. 파일 테이블이 데이터를 정확히 포함하고 각 파일이 해시와 일치하는지
7. 패키지 자체가 폐기되지 않았는지
8. 빌드가 이전에 허용된 해당 앱의 최고 빌드보다 오래되지 않았는지(롤백 방지)

거부된 패키지는 어떤 검사가 실패했는지 알려 주는 오류를 발생시키며, 실행 중이던 앱은 계속 실행됩니다.

<a id="revoke-keys-and-packages"></a>

## 키와 패키지 폐기하기

루트는 더 이상 로드되면 안 되는 릴리스 키와 패키지를 담은 **폐기 목록**에 서명합니다.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| 플래그 | 설명 |
|---|---|
| `--root <file>` | 루트의 비밀 키입니다. |
| `--extend <file>` | 이 목록(마지막으로 게시된 목록)의 항목을 유지합니다. |
| `--sequence <n>` | 목록의 번호이며, 이전에 게시된 어떤 번호보다 커야 합니다. `--extend`와 함께 사용하면 기본값은 해당 목록의 번호에 1을 더한 값입니다. |
| `--key <id>` | 폐기할 릴리스 키 id입니다. 여러 번 지정할 수 있습니다. |
| `--package <sha256>` | 폐기할 패키지의 SHA-256입니다(`nsh verify`이(가) 출력하는 값). 여러 번 지정할 수 있습니다. |
| `-o, --out <file>` | 작성할 목록입니다. |

트러스트 스토어는 현재 보유한 목록보다 시퀀스 번호가 높은 목록만 받아들이므로, 오래된 목록을 재전송해 폐기를 되돌릴 수 없습니다. 가장 최신 목록을 앱이 가져가는 곳에 게시하고, 패키지를 열기 전에 `updateRevocations`로 적용하세요.

<a id="rollback-protection"></a>

## 롤백 방지

호스트 앱이 패키지를 받아들이면 트러스트 스토어는 해당 앱 id의 빌드 번호를 기록하고, 그 이후로는 더 오래된 빌드를 거부합니다. 알려진 취약점이 있는 오래된 서명 패키지를 입수한 공격자도 앱이 그것을 실행하게 만들 수 없습니다. 이 기록은 스토어의 상태 디렉터리(`nsh-trust.json`)에 유지되므로 재시작 후에도 남아 있습니다. GPUI에서는 새 패키지가 정상임이 확인된 뒤에 호스트 앱이 기록을 나중에 수행할 수 있습니다(`verify_package`, 그다음 `accept_package`. 아래를 참고하세요).

<a id="loading-packages-in-a-host-app"></a>

## 호스트 앱에서 패키지 로드하기

검증은 패키지 전체를 해시하고 에셋을 추출하므로(패키지당 한 번, 트러스트 스토어의 디렉터리 아래), UI 스레드 밖에서 실행됩니다. 결과를 실행하는 것은 UI 스레드에서 이루어집니다.

**GPUI (Rust)**: 호스트 앱이 패키지가 정상임이 확인된 뒤에만 받아들일 수도 있습니다.

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

패키지가 받아들여지기 전까지는 이전에 받아들여진 빌드도 계속 검증을 통과하므로, 새 패키지가 실패한 호스트 앱은 실행하던 패키지로 돌아갈 수 있습니다(`AppView::on_error`의 치명적 오류나 받아들이기 전의 크래시가 그 신호입니다). 받아들여진 빌드보다 오래된 빌드는 계속 거부되며, 그 사이에 폐기된 패키지는 받아들여지지 않습니다. `load_package`은(는) 검증과 수락을 한 번에 수행하며, iOS와 Android에서는 `openPackage`이(가) 그렇게 합니다.

패키지에 선언된 [capability](./sandbox-and-capabilities.md)는 패키지와 함께 전달됩니다. 패키지는 자신이 선언한 것, 그리고 호스트 앱이 추가로 부여한 것만 할 수 있습니다.

전체 API: [GPUI](./gpui.md#embedding-in-a-gpui-app), [iOS 앱에 임베딩하기](./ios.md#signed-packages), [Android 앱에 임베딩하기](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## 게시된 패키지의 오류

패키지의 바이트코드는 행/열 테이블을 유지하므로 오류에 위치 정보가 있으며, 런타임은 오류를 호스트 앱의 오류 핸들러에 넘기기 전에 패키지의 소스 맵으로 이를 사용자의 소스에 매핑합니다.

```text
Error: boom
    at n (App.tsx:5:3)
```

소스 맵에는 앱의 원본 소스가 들어 있어 패키지에서 가장 큰 파일인 경우가 많습니다. gallery 예제의 2.6 MB 중 약 절반을 차지합니다. 소스 맵을 공개하고 싶지 않다면 패키지 옆에 따로 게시하세요.

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

그러면 기기는 번들의 위치(`at n (bundle.js:1:80)`)를 보고합니다. 맵은 해당하는 패키지와 함께 보관하고, 호스트 앱이 보고한 내용은 `nsh symbolicate`로 매핑하세요.

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate`은(는) 파일 또는 표준 입력에서 오류 텍스트를 읽으며, 맵 파일이나 맵을 포함한 패키지를 받습니다. 행 테이블은 바이트코드에 약 5분의 1을 더합니다(맵을 포함한 패키지에서는 3~5%). `--strip-debug`은(는) 이를 제외하며, 그러면 스택에는 `at n (<null>:0:1)`이(가) 표시되고 매핑할 대상이 없습니다.

<a id="trying-a-package-in-development"></a>

## 개발 중에 패키지 시험하기

`nsh run`이(가) 설치하는 개발용 호스트는 임베딩 앱과 같은 방식으로 패키지를 실행할 수 있습니다.

iOS에서 호스트 실행 파일은 `--package <file>`과 하나 이상의 `--root <root.pub>`을 받습니다. `nsh run`이(가) 시뮬레이터에 호스트를 설치한 뒤(`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Android에서 개발용 호스트(`nsh run --target android`이(가) 설치하는 `DevActivity`)는 extra인 `package`(기기의 경로)과 `root`(쉼표로 구분한 base64 공개 키)을 받습니다.

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

이들의 트러스트 상태는 임시(iOS) 또는 캐시(Android) 디렉터리에 저장되므로, 이미 받아들인 빌드보다 오래된 빌드는 여기서도 거부됩니다.
<a id="a-release-checklist"></a>

## 릴리스 체크리스트

1. 루트 키는 오프라인으로 보관하고, 팀 또는 앱 패밀리별로 릴리스 키를 인증하되 유효 기간은 1년 이하로 하세요.
2. 모든 릴리스마다 `nsh.json`에서 `build`을(를) 올리세요. `nsh publish`은(는) 이것이 없는 패키지를 거부합니다.
3. 패키지를 업로드하기 전에 `nsh verify --root root.pub`을(를) 실행하세요.
4. `root.pub`은(는) 호스트 앱 안에 포함해 배포하고, 폐기 목록은 별도로 배포하세요. 그러면 앱 업데이트 없이 키를 폐기할 수 있습니다.
5. 릴리스 키가 유출되면 해당 키를 폐기하고(`nsh revoke --extend … --key <id>`), 새 키를 인증한 다음 다시 게시하세요.
6. 앱에 대신 서명해 주는 플랫폼을 사용하는 경우, CI에는 테스트 앱만 신뢰하는 별도의 루트를 부여하고, 프로덕션 앱에는 플랫폼의 루트를 포함해 배포하세요. 플랫폼이 CI의 패키지에 다시 서명합니다(`nsh publish <package>`).

<a id="see-also"></a>

## 관련 문서

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
