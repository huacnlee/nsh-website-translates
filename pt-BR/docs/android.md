---
title: "Android"
description: "Execute apps NSH em Rust e TSX no Android com views do Android, em um emulador ou dispositivo, empacote-os como um .apk e incorpore-os em um app Android existente com nsh.aar e NshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---


# Android

Os apps NSH rodam no Android com views Android comuns e texto `StaticLayout`, a partir do Android 9 (API 28), em `arm64-v8a`, `armeabi-v7a` e `x86_64`. Apps inteiros escritos em Rust e em TSX rodam e são empacotados como nas outras plataformas, e um app existente pode incorporar módulos em um `NshView` e carregar pacotes assinados que ele baixa, sob limites e capabilities que ele define. No Android, `os()` é `Os::Android` (`platform.os` é `"android"` em TSX) e as props `android={{…}}` do TSX se aplicam.

<a id="requirements"></a>

## Requisitos

- **O Android SDK** (com `platforms;android-35`, build tools e `platform-tools`) e **um JDK**, em macOS, Windows ou Linux. Veja [Instalação](./installation.md#android).
- Um emulador, ou um dispositivo conectado via `adb`.

<a id="running-an-app"></a>

## Executando um app

Um app Rust roda a partir do seu diretório; um app TSX informa o seu ponto de entrada:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Inicie um emulador ou conecte um dispositivo antes (`adb devices` lista os disponíveis; o NSH usa o primeiro). Para um app Rust, `nsh` compila o `libnsh.so` do app com o seu crate, instala o APK e o inicia; uma alteração no código Rust do crate compila e instala novamente. Para um app TSX, ele instala um APK host de desenvolvimento (recompilado apenas quando o runtime muda) e encaminha a porta do servidor de desenvolvimento com `adb reverse`, de modo que funciona por USB sem uma rede compartilhada; o app é atualizado conforme você salva, com os logs no terminal.

<a id="packaging"></a>

## Empacotamento

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

O APK de um app Rust contém o seu próprio `libnsh.so`, compilado com o seu crate, cuja activity monta a raiz.

O APK é compilado com as build tools do SDK, sem Gradle, e assinado com a chave de debug, a menos que você informe um keystore de release. Assinatura de release e ícones: [Empacotamento](./packaging.md#android).

O NSH compila `libnsh.so` com alinhamento ELF de 16 KB e empacota as bibliotecas nativas sem compressão em limites ZIP de 16 KB. Um APK de release inclui `libnsh.so` sem as tabelas de símbolos e as informações de debug. A biblioteca completa fica ao lado do runtime em `symbols/<abi>/libnsh.so` (a de um app Rust em `.nsh/rust/android-rust-release/symbols/<abi>/`): entregue-a ao `ndk-stack` ou envie-a ao Play Console como símbolos de debug nativos para ler os stacks de crashes nativos.

<a id="embedding-in-an-android-app"></a>

## Incorporando em um app Android

Um app Android existente pode exibir apps NSH dentro da sua própria UI. O runtime é distribuído como uma biblioteca Android, `nsh.aar`: você cria uma `com.longbridge.nsh.NshView` (uma `FrameLayout`), a adiciona a qualquer layout e carrega nela um app TSX ou um pacote assinado. Um app escrito em Rust é distribuído no Android como o APK que `nsh package --target android` compila. O app NSH é renderizado com views Android comuns ao lado das suas.

Cada `NshView` é um engine independente, com a sua própria VM JS; não há singletons globais, então vários podem rodar ao mesmo tempo.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Obtendo a biblioteca

A distribuição contém as duas variantes:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

O AAR contém o runtime Java e `libnsh.so` para `arm64-v8a`, `armeabi-v7a` e `x86_64`, com seus símbolos: o build Gradle do app os remove ao empacotar o app e mantém os símbolos para os seus relatórios de crash. Ele declara a permissão `INTERNET` e exige **API 28** (Android 9) ou mais recente. Ele traz as suas regras do R8 (`proguard.txt`), que um build minificado aplica por conta própria: a biblioteca nativa encontra as classes do runtime pelo nome, então `com.longbridge.nsh` permanece como está.

Adicione-o ao módulo do app, por exemplo a partir de uma pasta `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Distribuindo um bundle com o app

Compile o app TSX para dentro dos assets do app:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Isso gera `bundle.nshc` (bytecode), `bundle.js` (código-fonte), `bundle.js.map`, `capabilities.json` (quando `nsh.json` declara [capabilities](./sandbox-and-capabilities.md)) e `assets/` (as imagens e fontes que o app importa).

<a id="show-the-app"></a>

## Exibindo o app

```java
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import com.longbridge.nsh.NshView;

public final class MainActivity extends Activity {
    private NshView nsh;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        nsh = new NshView(this);
        nsh.setErrorListener(message -> Log.e("nsh", message));
        setContentView(nsh);
        nsh.loadAssetBundle("nsh");   // runs assets/nsh/bundle.nshc
    }

    @Override
    protected void onDestroy() {
        nsh.destroy();
        super.onDestroy();
    }
}
```

Em Kotlin:

```kotlin
class MainActivity : Activity() {
    private lateinit var nsh: NshView

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        nsh = NshView(this)
        nsh.setErrorListener { message -> Log.e("nsh", message) }
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    override fun onDestroy() {
        nsh.destroy()
        super.onDestroy()
    }
}
```

`NshView` também pode ficar dentro de qualquer layout, abaixo da sua própria toolbar, por exemplo:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

O tamanho da view é a janela do app: o NSH faz o layout do app no tamanho da view e de novo sempre que ele muda. Carregar novamente substitui o app em execução. O exemplo completo está em `examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Método | Descrição |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Cria uma view vazia. `trace` registra no log o tempo de cada commit. |
| `setErrorListener(ErrorListener listener)` | Recebe os erros fatais do app (falhas de carregamento, exceções JS não tratadas, uma VM interrompida por um limite) na thread de UI. Eles são sempre registrados no log. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | Limites de VM dos apps carregados a seguir; 0 mantém o padrão. |
| `setGrantedCapabilities(String json)` | O máximo que os apps carregados a seguir podem fazer, como JSON no formato de `nsh.json` em `capabilities`; `null` concede o que cada app declara. Retorna `false` (e é ignorado) para uma concessão inválida. |
| `setLocale(Locale locale)` | O idioma e a região do app no lugar dos do usuário: `Intl`, `locale()` e os componentes o seguem imediatamente, e os apps carregados depois já começam com ele. `null` segue o do sistema. |
| `setFontScale(float scale)` | O tamanho do texto no lugar do tamanho de fonte do sistema (1 é o padrão): textos e inputs têm o layout refeito com ele e `fontScale()` o lê, imediatamente e para os apps carregados depois; os comprimentos mantêm o seu tamanho. `0` segue o do sistema. |
| `setThemeOverrides(String json)` | A marca do host sobre o [tema](./tailwind.md#theme-tokens) do app: um arquivo de tema no formato de `"theme"` em `nsh.json`. Os seus tokens prevalecem sobre os do app com os mesmos nomes, nos modos claro e escuro, e os demais tokens do app permanecem. Aplica-se imediatamente e aos apps carregados depois; `null` devolve ao app o seu próprio tema. Lança `IllegalArgumentException` para um arquivo que não pode ser interpretado. |
| `setStorageDirectory(File dir)` | Onde os apps carregados a seguir guardam o seu [storage](../modules/nsh.md#storage); `null`: `files/nsh/<app id>` no diretório privado do app, pelo id do próprio app. |
| `setCacheOptions(NshCacheOptions options)` | Onde os apps carregados a seguir guardam os seus caches, as [imagens que baixam](./images-and-assets.md#kept-on-disk), e quanto cada um mantém. Crie um com `NshCacheOptions.builder()`: `location(File)`, `systemLocation()` (o padrão: `nsh` no diretório de cache, cada app em `<app id>`) ou `noDiskCache()`; `imagesMaxMegabytes(int)` (256 por padrão) ou `imagesOff()`. |
| `loadAssetBundle(String dir)` | Executa `dir/bundle.nshc` a partir dos assets do APK; os assets do app vêm de `dir/assets/`. Retorna `false` se não puder ser lido (também informado ao error listener). |
| `loadBundleFile(File file)` | Executa um arquivo `bundle.js`; os assets vêm de `assets/` ao lado dele. Recusa arquivos `.nshc`. |
| `runPackage(NshPackage pkg)` | Executa um pacote assinado verificado, substituindo o app em execução. Um pacote roda uma única vez. |
| `registerComponent(String name, NshComponent.Factory factory)` | Registra um [componente nativo](./native-components.md). |
| `setParams(Object params)` | Os parâmetros de inicialização dos apps carregados a seguir (um `Map` ou `JSONObject`): o app os lê ao iniciar como `host.params` ([`host`](../modules/nsh.md#host)). Retorna `false` quando não são um objeto JSON. |
| `send(String name, Object data)` | Envia um evento ao app (`host.on(name, …)`); é mantido até que ele o escute, ou para o próximo app enquanto nenhum estiver rodando. Qualquer thread; retorna `false` após `destroy()`. |
| `handle(String name, HostHandler handler)` | Trata as chamadas (`host.call`) e os posts (`host.post`) do app para `name` na thread de UI; `null` remove o handler. O handler responde por meio do seu `NshHostReply`, uma única vez, a partir de qualquer thread. |
| `connectDevServer(String url)` | Desenvolvimento: carrega de um servidor `nsh dev` e recarrega a cada alteração. Retorna `false` com o AAR de release. |
| `handleBack()` | Permite que o app trate um pressionar de voltar (fecha diálogos, remove páginas, executa listeners de `BackHandler`); retorna se ele o tratou. |
| `destroy()` | Para o app e chama `destroy()` em cada um dos seus componentes nativos. A view não pode mais ser usada. |

> [!IMPORTANT]
> O bytecode compilado (`.nshc`) só é carregado dos assets do próprio APK ou de um pacote assinado. Arquivos no armazenamento podem ser substituídos, e o QuickJS não valida bytecode, por isso `loadBundleFile` aceita apenas código-fonte JS. O código que o app baixa deve chegar como um [pacote assinado](./signed-packages.md).

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` e `setCacheOptions` valem a partir do próximo carregamento: chame-os antes de `loadAssetBundle` e afins.

Cada app mantém o seu storage sob o seu próprio id, sem nenhuma configuração: um pacote assinado sob o id que o certificado da sua chave de release garante, um bundle sob o `id` do seu `nsh.json` (`nsh/app.json` entre os assets do APK, escrito por `nsh package`). Chame `setStorageDirectory` para manter os dados de um app em um local escolhido pelo host:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Conversando com o app

A view e o app que ela executa conversam por um canal próprio ([`host`](../modules/nsh.md#host)): parâmetros de inicialização que o app lê ao iniciar, eventos do app host, e chamadas e posts do app, com dados JSON (maps, listas, strings, números e booleanos deste lado). Não precisa de nenhuma view no app nem de nenhum componente nativo.

```java
// Before loading: what the app opens first (`host.params` in TSX).
nsh.setParams(Map.of("conversation", intent.getStringExtra("conversation")));
nsh.loadAssetBundle("nsh");

// The app's `await host.call("user.profile", { id })`, on the UI thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    api.profile(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});

// The app's `host.post("analytics", …)`: no answer.
nsh.handle("analytics", (data, reply) -> analytics.log(data));

// Later: the app hears `host.on("conversation.open", …)`.
nsh.send("conversation.open", Map.of("id", tappedConversation));
```

Em Kotlin:

```kotlin
nsh.handle("user.profile") { data, reply ->
    val id = (data as Map<*, *>)["id"]
    lifecycleScope.launch {
        runCatching { api.profile(id) }
            .onSuccess { reply.resolve(mapOf("id" to id, "name" to it.name)) }
            .onFailure { reply.reject(it.message ?: "failed") }
    }
}
```

Os handlers rodam na thread de UI; uma chamada espera pela sua resposta no app sem bloquear nenhum dos lados. Uma resposta que nunca é dada faz a chamada falhar quando for coletada, e uma chamada de um nome sem handler falha imediatamente. Eventos de nomes que o app ainda não escuta são mantidos até que ele os escute, e eventos enviados enquanto nenhum app está rodando (antes de `loadAssetBundle`, durante um reload) vão para o próximo.

<a id="theme-overrides"></a>

## Sobrescrita de tema

Um app incorporado em vários apps host com marcas diferentes assume a marca de cada host: o host informa os tokens que a sua marca altera, como um arquivo de tema no formato de `"theme"` em `nsh.json` (`cssVars` do shadcn/ui, com valores como o CSS os escreve). Eles prevalecem sobre os tokens do app com os mesmos nomes; os demais tokens do app permanecem. Dê a um token o seu valor para o modo escuro em `dark` (um token definido apenas em `light` ou `theme` tem aquela cor nos dois modos):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Chame antes ou depois de carregar: classes como `bg-primary` e `rounded-(--radius)` mudam de estilo imediatamente, e todo app carregado depois já começa com as sobrescritas no primeiro frame. `setThemeOverrides(null)` devolve ao app o seu próprio tema.

<a id="links-the-app-opens"></a>

## Links que o app abre

As URLs que o app abre ([`openUrl`](../modules/nsh.md#openurl), os links de um `TextView` com `links="open"`) chegam primeiro ao `OpenUrlHandler` da view, na thread de UI: retorne `true` quando o app host tratou a URL, por exemplo roteando-a pelo seu próprio router, e `false` para que o sistema a abra com um intent `ACTION_VIEW`. Sem um handler, o sistema abre todas as URLs. As URLs chegam a ele depois que a capability `openUrl` do app as permitiu.

```java
nsh.setOpenUrlHandler(url -> {
    Uri uri = Uri.parse(url);
    // The host app's own links open in the host app.
    if ("lb".equals(uri.getScheme()) || "longbridge.com".equals(uri.getHost())) {
        router.open(uri);
        return true;
    }
    return false;
});
```

<a id="limits"></a>

## Limites

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

Os padrões são 256 MB de heap, 4096 KB de stack, 10 s para carregar, 2 s por chamada e 200 000 nós. O que cada limite faz quando é atingido: [Sandbox e capabilities](./sandbox-and-capabilities.md).

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Uma requisição precisa ser permitida tanto pelo que o app declara em seu `nsh.json` quanto pela concessão. Veja [Sandbox e capabilities](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Pacotes assinados

Verifique os pacotes baixados fora da thread de UI e execute-os nela:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);   // the contents of root.pub from `nsh keygen`

executor.execute(() -> {
    try {
        NshPackage pkg = trust.openPackage(downloadedFile);
        runOnUiThread(() -> nsh.runPackage(pkg));
    } catch (NshPackage.RefusedException e) {
        Log.w("nsh", "refused: " + e.getMessage());   // the running app stays
    }
});
```

| API | Descrição |
|---|---|
| `new NshTrust(File stateDir)` | Abre ou cria o trust store. O seu estado (a lista de revogação mais recente, o maior build aceito por app) persiste ali, e os assets dos pacotes são extraídos sob ele. Não confia em nenhuma chave até `addRoot`. Pode ser usado de qualquer thread; `close()` quando concluído. |
| `boolean addRoot(String publicKey)` | Confia em uma chave pública raiz (base64, o conteúdo de um arquivo `.pub`). `false` para uma chave inválida. |
| `boolean updateRevocations(String json)` | Aplica uma lista de revogação de `nsh revoke`, assinada por uma raiz confiável e mais nova que a do store. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Verifica, extrai os assets e aceita o pacote (builds mais antigos do app são recusados a partir de então). Lento para pacotes grandes: chame fora da thread de UI. |
| `NshPackage` | `appId`, `appName`, `version`, `build`; `close()` se ele não puder ser executado. |

Como funcionam chaves, certificados e revogação: [Pacotes assinados](./signed-packages.md).

<a id="development"></a>

## Desenvolvimento

Com `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Execute `nsh dev App.tsx` no seu computador. Para um emulador ou um dispositivo USB, encaminhe a porta para que o `127.0.0.1` do próprio dispositivo alcance o servidor:

```sh
adb reverse tcp:8790 tcp:8790
```

Caso contrário, use o endereço de LAN que `nsh dev` imprime. Os assets vêm do servidor de desenvolvimento por HTTP simples, então `nsh-dev.aar` declara `android:usesCleartextTraffic="true"`, que o manifest merger aplica ao app (uma network security config do app pode sobrescrevê-lo). O `nsh.aar` de release não faz isso.

<a id="activity-setup"></a>

## Configuração da activity

- **Botão voltar.** `NshView` recebe os pressionamentos de voltar por conta própria enquanto o app os quer (um diálogo aberto, uma página empilhada, um listener de `BackHandler`), e os deixa para a activity caso contrário. Com `android:enableOnBackInvokedCallback="true"` no Android 13 e mais recentes, ele registra um `OnBackInvokedCallback`; nas demais versões (Android 12 e anteriores, ou com o atributo desligado), ele captura a tecla voltar antes do `onBackPressed` da activity, ou seja, antes do `OnBackPressedDispatcher` do AndroidX e dos callbacks dos fragments. Nenhum encaminhamento é necessário, em uma activity ou em um fragment. Um host que já encaminha os pressionamentos para `handleBack()` continua funcionando: cada pressionamento chega ao app uma única vez.

  Para o predictive back no Android 13+, defina `android:enableOnBackInvokedCallback="true"` no `<application>`, como fazem os apps NSH empacotados.
- **Teclado.** `NshView` rola os inputs com foco para fora do alcance do teclado por conta própria. Deixe `android:windowSoftInputMode` sem definir ou use `adjustResize`; com `adjustPan`, o sistema move a janela inteira.
- **Safe area.** A view informa como insets apenas as partes das barras do sistema e do teclado que a sobrepõem, então um `NshView` abaixo de uma toolbar não recebe inset superior. Para conteúdo edge-to-edge, desenhe atrás das barras do sistema e deixe o app usar o padding `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` em Rust).
- **Mudanças de configuração.** Uma activity recriada em uma rotação ou mudança de tema destrói a view, e o app começa do zero novamente. Para mantê-lo em execução, declare as mudanças que a activity trata por conta própria; os apps NSH empacotados usam:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` acompanha por conta própria o novo tamanho, esquema de cores, escala de fonte, densidade de tela e direção de layout; o app mantém o seu estado. As posições de rolagem são restauradas em coordenadas lógicas dentro dos novos limites do conteúdo. As views sticky e as janelas modais abertas também acompanham a nova densidade.
- **Ciclo de vida.** Chame `destroy()` quando a activity ou o fragment host for encerrado.
<a id="see-also"></a>

## Veja também

- [Building with Rust](./rust.md)
- [Embedding in iOS apps](./ios.md)
- [Native components](./native-components.md)
- [Signed packages](./signed-packages.md)
- [Packaging](./packaging.md): um APK standalone sem escrever nenhum código Java
