---
title: "Empacotamento"
description: "Crie apps instaláveis em Rust e TSX com nsh package para dispositivos iOS, simulador iOS, Android, macOS, Windows, Linux e web, com metadados do app, ícones e assinatura."
order: 19
group: platforms
source_hash: 74c2991490481926
---


# Empacotamento

`nsh package` transforma um app em algo que você pode instalar: um `.app` para o simulador do iOS, um `.ipa` assinado para dispositivos iOS, um `.apk` assinado para Android, um `.app` com assinatura ad hoc para macOS, um diretório e `.tar.gz` para Linux, um diretório e `.zip` para Windows, ou um site estático para a web. Não precisa de projeto Xcode nem de Gradle.

- **Um app Rust** (`nsh.json` nomeia o seu `"root"`) é empacotado a partir do seu diretório. `nsh` compila o runner do alvo em modo release, com o seu crate compilado junto e a raiz montada, sem QuickJS. São necessários: Cargo, o alvo Rust da plataforma (`rustup target add …`) e, para Android, o NDK.
- **Um app TSX** nomeia a sua entrada. Seu build de release (minificado, compilado para bytecode do QuickJS, exatamente como `nsh build --release` o compila) vai junto com o **runtime pré-compilado** que acompanha o NSH, portanto não precisa de toolchain Rust. Um app com um crate próprio (`"rust"` sem `"root"`) recebe runners compilados com o seu crate.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

A saída vai para `.nsh/out/`, a menos que você passe `--out`. As seções abaixo mostram o comando de cada alvo para um app Rust; um app TSX acrescenta a sua entrada (`nsh package App.tsx --target …`).

> [!NOTE]
> Para colocar o NSH *dentro* de um app nativo existente, veja [Plataformas](./platforms.md#embed-in-a-native-app) e, para um app GPUI ou GPUI Kit, [GPUI](./gpui.md#embedding-in-a-gpui-app). Para distribuir atualizações que os apps baixam e verificam, veja [Pacotes assinados](./signed-packages.md).

<a id="app-metadata-30"></a>

## Metadados do app: `nsh.json`

`nsh package` lê `nsh.json` no diretório do app (ao lado do arquivo de entrada, no caso de um app TSX). `nsh init` cria um:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Chave | Tipo | Padrão | Usado para |
|---|---|---|---|
| `name` | string | o nome do diretório da entrada | O nome exibido sob o ícone (`CFBundleDisplayName`, `android:label` no Android) e o nome do arquivo de saída. |
| `id` | string | obrigatório | O identificador do bundle / nome do pacote Android, no formato DNS reverso sob um domínio que você possui. Também nomeia o local onde o app guarda seu [armazenamento](../modules/nsh.md#storage), de modo que cada app tenha o seu. `nsh package` e `nsh publish` avisam sobre o placeholder `com.example.`. |
| `version` | string | `"1.0.0"` | A versão visível ao usuário (`CFBundleShortVersionString`, `versionName`). |
| `build` | número | `1` | O número do build (`CFBundleVersion`, `versionCode`). Aumente-o a cada release que você enviar. |
| `icon` | string | nenhum | Um PNG quadrado, idealmente de 1024×1024, relativo a `nsh.json`. |

`nsh.json` também contém `rust` e `root` (os crates do app e seu componente raiz, [Desenvolvendo com Rust](./rust.md)), `theme` e `appearance`, `tailwind` (veja [Tailwind](./tailwind.md)) e `capabilities` (veja [Sandbox e capabilities](./sandbox-and-capabilities.md)); [Estrutura do projeto](./project-structure.md#nshjson) lista todas as chaves. Chaves desconhecidas causam erro.

Toda chave acima pode ser sobrescrita na linha de comando, o que é útil em CI:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## Opções

| Flag | Descrição |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | Para o que compilar (obrigatório). |
| `-o, --out <dir>` | Diretório de saída. Padrão: `.nsh/out`. |
| `--name <name>` | Nome exibido. |
| `--id <id>` | Identificador do bundle, como `com.example.app`. |
| `--app-version <version>` | Versão, como `1.2.0`. |
| `--build <n>` | Número do build. |
| `--icon <png>` | Ícone do app: um PNG quadrado, idealmente de 1024×1024. |
| `--sign <identity>` | iOS: a identidade de assinatura de código para dispositivos. |
| `--profile <file>` | iOS: o provisioning profile para dispositivos (`.mobileprovision`). |
| `--keystore <file>` | Android: um keystore de release (padrão: a chave de debug). |
| `--key-alias <alias>` | Android: o alias da chave no keystore. |
| `--keystore-password <password>` | Android: a senha do keystore; também lida de `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android: as ABIs do APK, repetidas ou separadas por vírgulas (padrão: `arm64-v8a` e `armeabi-v7a`). |
| `--run` | Instala e executa em seguida: no simulador do iOS, ou no dispositivo ou emulador Android que `adb` enxerga; apps macOS, Linux e Windows são executados nesta máquina; um site web é servido nesta máquina e aberto no navegador. Não se aplica a `--target ios`. |

<a id="ios-simulator"></a>

## Simulador do iOS

```sh
nsh package --target ios-simulator --run
```

Gera `.nsh/out/<Name>.app`, com assinatura ad hoc (o simulador exige uma assinatura, mas não uma identidade). Com `--run`, ele inicia um simulador se nenhum estiver em execução, instala o app e o executa. Requer o Xcode.

<a id="ios-devices"></a>

## Dispositivos iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Gera `.nsh/out/<Name>.ipa`, pronto para o TestFlight, para as ferramentas de envio à App Store ou para instalação direta (dependendo do profile). O que acontece:

- O provisioning profile é copiado para dentro do app como `embedded.mobileprovision`.
- Os entitlements vêm do profile. O NSH verifica se o application identifier do profile cobre o `id` do app (profiles curinga, como `TEAMID.*` ou `TEAMID.com.example.*`, funcionam) e, caso contrário, para com um erro.
- O app é assinado com `codesign` usando a identidade e depois compactado em um `.ipa` (`Payload/<Name>.app`).

Encontre suas identidades com:

```sh
security find-identity -v -p codesigning
```

Sem `--sign` e `--profile`, o NSH gera um `.nsh/out/<Name>.app` não assinado e avisa você; ele não pode ser instalado em um dispositivo dessa forma.

O app oferece suporte a iPhone e iPad, em retrato e paisagem (retrato de cabeça para baixo apenas no iPad), e exige iOS 15.0 ou mais recente.

## Android

```sh
nsh package --target android --run
```

Gera `.nsh/out/<Name>.apk`. O APK é montado diretamente com as ferramentas de build do SDK (`aapt2`, `zipalign`, `apksigner`), sem Gradle. Requisitos:

- O Android SDK, localizado por meio de `ANDROID_HOME` (ou `ANDROID_SDK_ROOT`, ou `~/Library/Android/sdk`), com build tools e o pacote `platforms;android-35`. O NSH informa o comando `sdkmanager` quando algum está faltando.
- Um JDK, para criar o keystore de debug na primeira vez.
- Para um app Rust, o Android NDK (`sdkmanager "ndk;<version>"` ou `ANDROID_NDK_HOME`), que compila o `libnsh.so` dele.

O app tem como alvo a API 35 e exige a API 28 (Android 9) ou mais recente. Ele contém código nativo para as ABIs de celulares, `arm64-v8a` e `armeabi-v7a`; com `--run`, também a do dispositivo, como o `x86_64` de um emulador. `--abi` escolhe as ABIs por conta própria, por exemplo `--abi arm64-v8a` apenas para celulares de 64 bits, o menor APK:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Assinatura para release

Sem `--keystore`, o APK é assinado com a chave de debug padrão (`~/.android/debug.keystore`, criada se não existir), e o NSH avisa que ele não serve para releases em lojas. Para um release, crie um keystore uma única vez e passe-o:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Prefira a variável de ambiente a `--keystore-password`, para que a senha não fique no histórico do seu shell.

## macOS

```sh
nsh package --target macos --run
```

Gera `.nsh/out/<Name>.app`: o executável em `Contents/MacOS/`, e `nsh/assets/…`, `nsh/app.json` (o título da janela e a aparência do app) e o `nsh/bundle.nshc` de um app TSX em `Contents/Resources/`. O app é assinado ad hoc e exige macOS 14 ou posterior; para distribuí-lo, assine-o com um Developer ID e faça a notarização. Veja [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Gera `.nsh/out/<Name>/` (o executável `<Name>`, `nsh/assets/…`, `nsh/app.json` com o título da janela e o id do aplicativo, o `nsh/bundle.nshc` de um app TSX, `<id>.desktop` e o ícone `<id>.png`) e o mesmo que `.nsh/out/<Name>.tar.gz`. Empacote no Linux: o runner é compilado para a máquina em que é gerado. GTK 4 (4.14 ou posterior), Pango e WebKitGTK 6.0 (para web views) devem estar instalados onde o app for executado. Instalação e entrada de desktop: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Gera `.nsh\out\<Name>\` (o executável `<Name>.exe` com o ícone do app, `nsh\assets\…`, `nsh\app.json` com o título da janela, o id do app, a versão e a aparência, e o `nsh\bundle.nshc` de um app TSX) e o mesmo que `.nsh\out\<Name>.zip`. Um app TSX não precisa de ferramentas; o runner de um app Rust é compilado com o Visual Studio Build Tools. Empacote no Windows: o runner é compilado para a máquina em que é gerado, e somente o Windows consegue incorporar o ícone. O app é executado de onde quer que seu diretório seja copiado; nada é instalado. Veja [Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Gera `.nsh/out/<Name>/`, um site estático: `index.html`, `manifest.webmanifest`, o script da página (`nsh.<digest>.js`) e `nsh.<digest>.wasm` (o engine e o crate de um app Rust; para um app TSX, o runtime, ao lado do módulo ES do app `app.<digest>.js`), seus assets e ícones, cada um nomeado a partir do seu conteúdo para que os hosts possam fazer cache deles indefinidamente. Publique o diretório em qualquer servidor web ou CDN; `--run` o serve em `http://127.0.0.1:4173/` para você abrir. Cabeçalhos de cache e incorporação: [Web](./web.md#publish-an-app).

<a id="icons"></a>

## Ícones

Forneça um PNG quadrado, idealmente de 1024×1024, em `nsh.json` (`"icon": "icon.png"`) ou com `--icon`:

- **iOS:** compilado pelo `actool` do Xcode no catálogo de assets do app (`Assets.car`), que gera todos os tamanhos de que o iOS precisa.
- **Android:** redimensionado para 192×192 e usado como ícone do launcher (`mipmap-xxxhdpi`).
- **macOS:** convertido por `sips` em `AppIcon.icns`.
- **Linux:** copiado como `<id>.png`, que o arquivo `.desktop` indica como seu `Icon`.
- **Windows:** redimensionado para de 16 a 64 pixels e para 256 pixels e incorporado ao executável como seu ícone, que a janela, o Explorer e a barra de tarefas exibem.
- **Web:** redimensionado para 32 pixels (o favicon), 180 (`apple-touch-icon`), 192 e 512 (o web app manifest).

Sem um ícone, o sistema exibe o seu padrão.

<a id="what-is-inside"></a>

## O que há dentro

O pacote de um app Rust é o seu runner, compilado com o seu crate e a raiz montada, mais os assets que seus crates registram (`assets!()`). O pacote de um app TSX contém o seu bytecode, o seu `capabilities.json` (quando declara capabilities) e os assets que ele importa, ao lado do runtime pré-compilado:

| Alvo | Runtime | Um app TSX |
|---|---|---|
| iOS | o executável `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (sem símbolos, armazenadas sem compressão, alinhadas a 16 KB) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | o executável `nsh-macos-app`, renomeado para `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | o executável `nsh-linux-app`, renomeado para `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | o executável `nsh-windows-app.exe`, renomeado para `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Um app empacotado não registra [componentes nativos](./native-components.md); para isso, incorpore o NSH ao seu próprio app.

<a id="finding-the-runtime"></a>

## Localizando o runtime

Um app Rust compila seus próprios runners. Para apps TSX, `nsh package` procura o runtime pré-compilado ao lado da CLI (`bin/../runtime` na distribuição). Em um checkout do NSH, ele usa `target/<triple>/<profile>` e `target/android/<profile>`, com o perfil da própria CLI (uma CLI de debug usa runtimes de debug): compile-os com `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (ou `aarch64-apple-ios` para dispositivos) e `cargo xtask android` (acrescente `--release` para uma CLI de release); `nsh-macos-app` (no macOS), `nsh-linux-app` (no Linux) e `nsh-windows-app` (no Windows) são compilados para esta máquina em `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`); o runtime web é compilado com o perfil `web`, seja qual for o da CLI, em `target/wasm32-unknown-unknown/web/`. A variável de ambiente `NSH_RUNTIME` aponta a CLI para outro diretório organizado como o `runtime/` da distribuição (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## Veja também

- [CLI](./cli.md): todos os comandos
- [Pacotes assinados](./signed-packages.md): atualizações que os apps baixam
- [Estrutura do projeto](./project-structure.md): `nsh.json` e os arquivos de um app
