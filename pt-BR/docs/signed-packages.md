---
title: "Pacotes Assinados"
description: "Distribua código de aplicativo que os aplicativos host baixam e verificam: chaves, certificados, nsh publish, nova assinatura, verificação, revogação e proteção contra rollback."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---


# Pacotes Assinados

Um pacote assinado (`.nshpkg`) é a forma como um app host executa código NSH que não veio com ele: uma atualização das próprias telas NSH do app ou um mini app de terceiros. `nsh publish` compila o app e o assina; o app host verifica a assinatura, a cadeia de certificados, as revogações e o número de build antes de executar qualquer coisa.

Um pacote contém TSX. O código Rust do app host (um app escrito em Rust, os componentes, módulos e classes de seus crates) faz parte do próprio app host e é entregue junto com ele, e o TSX de um pacote o importa pelos seus specifiers, como qualquer TSX ([Desenvolvendo com Rust](./rust.md#extending-a-rust-app-with-tsx)). Assim, um app Rust mantém seu núcleo em Rust e entrega como pacotes assinados as telas que mudam com frequência.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> O NSH verifica e executa pacotes; ele não os entrega. De onde os pacotes vêm (seu servidor de atualização, uma CDN, uma loja de mini apps) e quando o app os baixa fica a cargo do app host.

<a id="why-packages-are-signed"></a>

## Por que os pacotes são assinados

O JS que um app host executa pode alcançar tudo o que o app [concede](./sandbox-and-capabilities.md), então ele deve vir de alguém em quem o app confia. Há um segundo motivo: o NSH distribui apps como bytecode QuickJS, que carrega mais rápido que o código-fonte, mas o QuickJS não valida o bytecode, e um bytecode forjado pode corromper a memória. Por isso, o NSH só carrega bytecode dos recursos do próprio app (assinados pelo sistema), do servidor de desenvolvimento ao qual o desenvolvedor se conectou e de pacotes verificados. Qualquer outra coisa deve ser código-fonte JS.

<a id="keys-two-levels"></a>

## Chaves: dois níveis

- Uma **chave raiz** fica offline. Os apps host confiam em sua chave pública; podem confiar em várias raízes, e é assim que uma raiz é rotacionada.
- Uma raiz **certifica chaves de release**: um certificado nomeia a chave de release, os ids de app para os quais ela pode assinar e uma janela de tempo.
- **Os pacotes são assinados por uma chave de release** e carregam o certificado dela. Assim, as chaves de release podem ser rotacionadas (ou revogadas) sem atualizar os apps host, que só conhecem a raiz.

Toda chave tem um id derivado de sua chave pública (os primeiros 8 bytes do SHA-256, em hexadecimal), exibido por todos os comandos.

<a id="create-the-keys"></a>

### Criar as chaves

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Cada chave são dois arquivos: `<name>.secret` (legível apenas pelo proprietário) e `<name>.pub`, ambos com uma linha em base64. `nsh keygen` nunca sobrescreve uma chave existente.

> [!CAUTION]
> Mantenha `root.secret` offline, por exemplo em um drive criptografado em um cofre. Quem a possuir pode certificar chaves que todo app host que confia na raiz aceita. As chaves de release pertencem à máquina de build ou aos segredos do CI.

<a id="certify-a-release-key"></a>

### Certificar uma chave de release

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Flag | Descrição |
|---|---|
| `--root <file>` | A chave secreta da raiz. |
| `--key <file>` | A chave pública da chave de release. |
| `--apps <pattern>` | Ids de app para os quais ela pode assinar: `*` (qualquer um), `com.example.*` (ids sob `com.example.`) ou um id exato. Repetível. |
| `--days <n>` | Por quanto tempo ela pode assinar, a partir de agora. Padrão: 365. |
| `-o, --out <file>` | O certificado a ser gravado. |

O certificado é um pequeno arquivo JSON; ele não é secreto.

<a id="publish-a-package"></a>

## Publicar um pacote

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` compila o app em modo release e o assina. O id do app, o nome, a versão e o build vêm de `nsh.json` ao lado da entrada, e podem ser sobrescritos pelas flags:

| Flag | Descrição |
|---|---|
| `--key <file>` | A chave secreta da chave de release. |
| `--cert <file>` | O certificado dela. |
| `-o, --out <file>` | O pacote a ser gravado. Padrão: `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | Id do app, como `com.example.app`. |
| `--app-version <version>` | Versão, como `1.2.0`. |
| `--build <n>` | Número de build. Obrigatório (aqui ou em `nsh.json`); deve crescer a cada release. |
| `--source-map <where>` | `package` (o padrão): dentro do pacote. `file`: em `<package>.map` ao lado dele, fora do pacote. `none`: omitido. Veja [Erros de pacotes publicados](#errors-from-published-packages). |
| `--strip-debug` | Omite as tabelas de linha e coluna do bytecode: um pacote menor cujas pilhas de erro não têm posições. |
| `--min-runtime <version>` | O runtime mais antigo que executa o pacote, como `0.2.0` (`nsh.json` `minRuntime`). Padrão: a versão desta CLI. Veja [Quais runtimes executam um pacote](#which-runtimes-run-a-package). |

`nsh publish` se recusa a assinar o que um dispositivo recusaria: o certificado deve cobrir o id do app e o horário atual.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Quais runtimes executam um pacote

Um pacote nomeia o runtime NSH mais antigo que o executa, e os apps host com um runtime mais antigo o recusam antes que qualquer coisa seja executada:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

Por padrão, essa é a versão da CLI que compilou o pacote: o bundle é compilado contra os módulos dessa CLI, então esse runtime é o que sabidamente o executa. Quando os apps host em campo têm um runtime mais antigo e o app usa apenas o que esse runtime oferece, publique para ele com `--min-runtime` (ou `minRuntime` em `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

A versão é `MAJOR.MINOR.PATCH`; um sufixo de pré-release (`0.2.0-beta.1`) conta como a versão sem ele. Ela não pode ser mais nova que a CLI. Teste o pacote em um app host com esse runtime antes de enviá-lo: um import ou uma função que o runtime mais antigo não possui falha quando o módulo é carregado.

<a id="what-a-package-holds"></a>

### O que um pacote contém

Um pacote é um único arquivo: um cabeçalho JSON (id do app, nome, versão, build, as capabilities declaradas, a versão do bytecode, o runtime mínimo, o horário da assinatura, o certificado da chave de release e uma tabela de arquivos com seus SHA-256), depois os arquivos e, por fim, a assinatura Ed25519 da chave de release sobre tudo o que vem antes. Os arquivos são:

- o código-fonte JS do app (sempre),
- seu bytecode, usado apenas quando o runtime do dispositivo tem a mesma versão de bytecode (caso contrário, o código-fonte é executado, de modo que um pacote continua funcionando em runtimes mais novos),
- seu source map (a menos que tenha sido publicado com `--source-map file` ou `none`),
- os assets que ele importa (imagens, fontes).

A identidade do pacote, usada para revogação, é o SHA-256 do arquivo inteiro.

<a id="packages-from-newer-versions-of-nsh"></a>

### Pacotes de versões mais novas do NSH

Um app host executa pacotes assinados por um `nsh publish` mais novo, desde que seu runtime seja pelo menos o [runtime mínimo](#which-runtimes-run-a-package) do pacote. O que uma versão mais nova adiciona e o runtime do host não conhece é deixado de fora, e nunca amplia o que o pacote pode fazer:

- campos de cabeçalho e arquivos que ele não conhece são ignorados (continuam cobertos pela assinatura e por seus hashes), a menos que o pacote marque um campo como algo que seu runtime deve entender: nesse caso, os runtimes mais antigos o recusam;
- [capabilities](./sandbox-and-capabilities.md) que ele não conhece não são concedidas, e uma capability ou concessão de `http` com uma chave que ele não conhece é descartada por inteiro, já que essa chave pode restringi-la.

O que foi deixado de fora é registrado no log quando o pacote é carregado.

<a id="sign-a-package-again"></a>

## Assinar um pacote novamente

Uma plataforma que distribui os pacotes de vários apps pode assinar todos com uma chave própria: o CI compila cada pacote e o assina com uma chave em que seus apps de teste confiam, e a plataforma o assina novamente com a chave em que os apps de produção confiam.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Flag | Descrição |
|---|---|
| `--key <file>` | A chave secreta da chave de release. |
| `--cert <file>` | O certificado dela. |
| `-o, --out <file>` | O pacote a ser gravado. Pode ser o próprio pacote lido. Padrão: `.nsh/out/<id>-<build>.nshpkg`. |

O pacote mantém tudo o que o CI colocou nele: os arquivos, o id do app, a versão e o build, as capabilities declaradas, o [runtime mínimo](#which-runtimes-run-a-package) e o que uma [versão mais nova do NSH](#packages-from-newer-versions-of-nsh) gravou. O certificado, o horário da assinatura e a assinatura passam a ser os da nova chave, de modo que o pacote tem um SHA-256 próprio, o que serve para [revogá-lo](#revoke-keys-and-packages).

Antes de assinar, `nsh publish` verifica que o pacote está íntegro (assinado pela chave que seu certificado nomeia, com sua tabela de arquivos cobrindo os dados e cada arquivo correspondendo ao seu hash) e que o novo certificado cobre o id do app e o horário atual. A partir daí, a nova assinatura garante o pacote, incluindo seu bytecode, de modo que uma plataforma assina novamente os pacotes que seus próprios builds geraram. Ferramentas Rust assinam novamente com `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## Verificar um pacote

`nsh verify` verifica um pacote exatamente como um app host que confia nas raízes indicadas faria:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Flag | Descrição |
|---|---|
| `--root <file>` | A chave pública de uma raiz confiável. Repetível. Sem nenhuma, apenas a assinatura do próprio pacote é verificada. |
| `--revocations <file>` | Uma lista de revogação a aplicar primeiro. |

Um dispositivo verifica, em ordem:

1. a assinatura do certificado por uma raiz confiável;
2. que a chave de release não está revogada;
3. a assinatura do pacote pela chave de release;
4. que o certificado cobre o id do app e o horário da assinatura;
5. o runtime mínimo de que o pacote precisa;
6. que a tabela de arquivos cobre exatamente os dados e que cada arquivo corresponde ao seu hash;
7. que o próprio pacote não está revogado;
8. que seu build não é mais antigo que o maior build desse app aceito anteriormente (proteção contra rollback).

Um pacote recusado gera um erro que diz qual verificação falhou; o app que estava em execução continua em execução.

<a id="revoke-keys-and-packages"></a>

## Revogar chaves e pacotes

Uma raiz assina **listas de revogação**: chaves de release e pacotes que não devem mais ser carregados.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Flag | Descrição |
|---|---|
| `--root <file>` | A chave secreta da raiz. |
| `--extend <file>` | Mantém as entradas desta lista (a última publicada). |
| `--sequence <n>` | O número da lista, maior que o de qualquer uma publicada antes. Com `--extend`, o padrão é o número daquela lista mais um. |
| `--key <id>` | O id de uma chave de release a revogar. Repetível. |
| `--package <sha256>` | O SHA-256 de um pacote (como `nsh verify` o exibe) a revogar. Repetível. |
| `-o, --out <file>` | A lista a ser gravada. |

Um trust store só aceita uma lista com um número de sequência maior que o da que ele já tem, de modo que uma lista antiga não pode ser reenviada para desfazer uma revogação. Publique a lista mais recente onde seus apps a buscam e aplique-a com `updateRevocations` antes de abrir pacotes.

<a id="rollback-protection"></a>

## Proteção contra rollback

Quando um app host aceita um pacote, seu trust store registra o número de build para aquele id de app e, daí em diante, recusa builds mais antigos. Um atacante que obtivesse um pacote assinado mais antigo, com uma vulnerabilidade conhecida, não consegue fazer o app executá-lo. O registro persiste no diretório de estado do store (`nsh-trust.json`), portanto sobrevive a reinicializações. No GPUI, um app host pode registrá-lo mais tarde, depois que o novo pacote se provar saudável (`verify_package`, depois `accept_package`; veja abaixo).

<a id="loading-packages-in-a-host-app"></a>

## Carregar pacotes em um app host

A verificação calcula o hash do pacote inteiro e extrai seus assets (uma vez por pacote, sob o diretório do trust store), portanto é executada fora da thread de UI; a execução do resultado acontece nela.

**GPUI (Rust)**, onde o app host também pode aceitar um pacote somente depois que ele se provar saudável:

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

Até que um pacote seja aceito, o build aceito anteriormente ainda é verificado, de modo que um app host cujo novo pacote falhe pode voltar ao que executava (os erros fatais de `AppView::on_error`, ou uma falha antes da aceitação, são os sinais). Builds mais antigos que o aceito continuam recusados, e um pacote revogado nesse meio-tempo não é aceito. `load_package` verifica e aceita de uma só vez, como `openPackage` faz no iOS e no Android.

As [capabilities](./sandbox-and-capabilities.md) declaradas do pacote viajam com ele: um pacote só pode fazer o que declara, e apenas o que o app host concede além disso.

API completa: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Incorporação em apps iOS](./ios.md#signed-packages), [Incorporação em apps Android](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Erros de pacotes publicados

O bytecode de um pacote mantém suas tabelas de linha e coluna, de modo que seus erros têm posições, e o runtime as mapeia para os seus códigos-fonte com o source map do pacote antes de entregá-los ao tratador de erros do app host:

```text
Error: boom
    at n (App.tsx:5:3)
```

O source map contém os códigos-fonte originais do seu app e costuma ser o maior arquivo de um pacote: cerca de metade dos 2,6 MB do exemplo gallery. Para mantê-lo só para você, publique-o ao lado do pacote:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

Os dispositivos então relatam as posições do bundle (`at n (bundle.js:1:80)`). Guarde o mapa junto com o pacote a que ele pertence e mapeie o que o app host relatou com `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` lê o texto do erro de um arquivo ou da entrada padrão e aceita um arquivo de mapa ou um pacote que contenha um. As tabelas de linha adicionam cerca de um quinto ao bytecode (3–5% de um pacote com seu mapa); `--strip-debug` as omite, e as pilhas passam a mostrar `at n (<null>:0:1)`, sem nada a mapear.

<a id="trying-a-package-in-development"></a>

## Testar um pacote em desenvolvimento

Os hosts de desenvolvimento que `nsh run` instala podem executar um pacote da maneira como um app de incorporação o faria.

No iOS, o executável do host aceita `--package <file>` e um ou mais `--root <root.pub>`. Depois que `nsh run` instalou o host no simulador (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

No Android, o host de desenvolvimento (`DevActivity`, instalado por `nsh run --target android`) aceita os extras `package` (um caminho no dispositivo) e `root` (chaves públicas em base64, separadas por vírgula):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

O estado de confiança deles fica no diretório temporário (iOS) ou de cache (Android), portanto builds mais antigos que um já aceito também são recusados ali.
<a id="a-release-checklist"></a>

## Uma checklist de release

1. Mantenha a chave raiz offline; certifique uma chave de release por equipe ou por família de apps, com validade de um ano ou menos.
2. Incremente `build` em `nsh.json` a cada release; `nsh publish` recusa um pacote que não tenha esse incremento.
3. Execute `nsh verify --root root.pub` no pacote antes de enviá-lo.
4. Inclua `root.pub` dentro do app host; distribua as listas de revogação separadamente, para que seja possível revogar sem uma atualização do app.
5. Se uma chave de release vazar, revogue-a (`nsh revoke --extend … --key <id>`), certifique uma nova e publique novamente.
6. Com uma plataforma que assina para seus apps, dê ao CI uma raiz própria em que apenas os apps de teste confiem, e inclua a raiz da plataforma nos apps de produção; a plataforma assina novamente os pacotes do CI (`nsh publish <package>`).

<a id="see-also"></a>

## Veja também

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
