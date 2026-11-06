---
title: "Desarrollo local con LayerFS"
description: "Usa la prueba de LayerFS para Linux del checkout de Native Shell para capturar las salidas de compilación de Cargo, bifurcar un espacio de trabajo y verificar la reutilización de instantáneas."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Native Shell incluye en su repositorio un flujo de trabajo local con LayerFS para probar espacios de trabajo de compilación reutilizables. Importa un árbol de código fuente confirmado, ejecuta Cargo dentro de un Sandbox de Linux, guarda los archivos resultantes y vuelve a ejecutar las pruebas desde un fork de ese estado guardado. La edición del código fuente y los commits de Git se hacen en tu checkout existente de NSH.

> [!IMPORTANT]
> Este flujo de trabajo requiere Docker Engine y FUSE de Linux. Docker ejecuta el proceso de control y el Sandbox; FUSE monta el espacio de trabajo dentro del Sandbox. En macOS, el comando de desarrollo prepara este despliegue de Linux mediante un motor Docker local como OrbStack.

<a id="what-the-snapshot-saves"></a>

## Qué guarda el snapshot

LayerFS guarda un árbol del sistema de archivos: archivos fuente, metadatos de Git, archivos ignorados y los resultados de compilación creados dentro del espacio de trabajo. Un fork parte de un árbol guardado y registra sus propios cambios. Esto permite que varias tareas comiencen desde el mismo estado compilado manteniendo sus cambios separados.

En la prueba local de NSH, la primera rama ejecuta las pruebas de `nsh-package` y guarda `target/` junto con un archivo de sondeo ignorado. La segunda rama parte de ese commit, comprueba esos archivos y repite las pruebas sin conexión. Una tercera rama parte del estado original del código fuente y verifica el aislamiento.

| Fase | Qué sucede |
| --- | --- |
| Init | Importa una exportación del commit `HEAD` del checkout y un directorio `.git` nuevo |
| Build | Hace un fork de un espacio de trabajo y ejecuta `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | Guarda el `target/` generado y el archivo de sondeo en el historial de LayerFS |
| Reuse | Hace un fork de la rama guardada, la monta y repite las pruebas con `--offline` |
| Verify | Lee el historial de commits y comprueba que la rama original del código fuente sigue limpia |

Cada invocación crea un Store nuevo y realiza esta secuencia completa. La reutilización del snapshot ocurre entre las ramas de esa invocación. El beneficio que se mide en la prueba es el costo de llegar a otro espacio de trabajo utilizable y probado, incluyendo el tiempo de montaje, de commit y de desmontaje.

<a id="prepare-the-development-environment"></a>

## Prepara el entorno de desarrollo

Usa un checkout del [repositorio de NSH](https://github.com/longbridge/nsh) con:

- Un motor Docker local de Linux con ext4, XFS o Btrfs para su volumen del Store, ejecutándose en Linux o a través de un entorno macOS como OrbStack.
- Docker Engine que sirva la API 1.54 o posterior; la configuración local verificada usa Engine 29.7.2.
- `/dev/fuse`, con Docker autorizado para exponer ese dispositivo y `CAP_SYS_ADMIN` al Sandbox.
- Git y Python 3.12 o posterior; en Linux, rustup y un compilador de C/C++.
- Acceso a la red para obtener el código fuente fijado de LayerFS, las dependencias de Cargo y la imagen de ejecución.

La prueba compila LayerFS **1.0.0**, fijado al commit de código fuente `2aaf2552ce21154928b9f9c83582e41a637f5910`. Su imagen de ejecución proporciona Rust 1.98.1, Node y clang para los procesos de Linux. La [guía del SDK upstream](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md) describe el ciclo de vida del Store y del Sandbox.

Ejecuta estos comandos desde la raíz del checkout de NSH:

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

El ejecutable selecciona Python 3.12 o posterior, incluida la instalación de Homebrew en macOS, y descubre el socket a partir del contexto activo de Docker. Usa `--docker-socket PATH` para seleccionar explícitamente un socket local.

`prepare` comprueba la API de Docker, instala Rust 1.85.1 y compila el daemon fijado, el addon de Node y la imagen de ejecución. En macOS los prepara en un contenedor de compilación temporal de Linux. Reutiliza el registro habitual de Cargo y `target/`, incluyendo una configuración existente de `CARGO_TARGET_DIR`. El ID exacto de la imagen de ejecución y la ruta del daemon se registran en `.nsh/layerfs/deployment.json`. `status` comprueba los resultados de compilación y la imagen guardados y muestra el resultado de la última validación.

`smoke` crea `.nsh/layerfs/nsh-<id>/input` a partir del **`HEAD` confirmado** del checkout y luego importa esa entrada en un nuevo Store. Para incluir ediciones del código fuente, confírmalas en tu rama de tema antes de ejecutarlo. La entrada generada comienza con un repositorio Git nuevo y obtiene sus resultados de compilación dentro del Sandbox.

El proceso de control abre el Store en un volumen local de Docker con nombre. El daemon del Sandbox abre el mismo Store y monta la vista del sistema de archivos de la rama; Cargo se ejecuta en ese espacio de trabajo montado. Tu checkout habitual sigue siendo el lugar donde editas y confirmas los cambios del código fuente.

<a id="read-the-result"></a>

## Lee el resultado

El comando imprime el directorio de recibos y el nombre del volumen del Store. Abre el `result.json` generado para comprobar `"ok": true` y el tiempo transcurrido de cada fase. El mismo directorio contiene `settings.json`, que identifica el commit del código fuente y la imagen, y `trace.jsonl`, que registra las llamadas al SDK.

La validación local ejecutó 22 pruebas de paquete en cada una de las fases de compilación y de reutilización. La fase inicial de compilación y pruebas incluyó descargas de dependencias; la fase sin conexión usó el `target/` guardado y el registro de Cargo del mismo Sandbox. Al evaluar su valor, compara el ciclo completo con las compilaciones habituales de Cargo en tu carga de trabajo.

Usa sistemas operativos, arquitecturas, toolchains y dependencias equivalentes al reutilizar un estado compilado. La carga de trabajo de esta guía es la suite de pruebas de Linux `nsh-package`; las comprobaciones de la UI de cada plataforma usan sus respectivos entornos de plataforma ([Testing](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## Conserva el trabajo útil y administra el Store

Mantén los cambios del código fuente en Git y envíalos mediante pull requests. La prueba usa el perfil de Store **Disposable** de LayerFS para historiales de espacios de trabajo reconstruibles. Conserva por separado los recibos útiles cuando registres mediciones.

La entrada generada desactiva el mantenimiento automático de Git durante su commit inicial, manteniendo estable la base de datos de objetos mientras LayerFS la importa. Las comprobaciones de estado de Git dentro de la prueba usan `--no-optional-locks` para que la lectura del estado preserve el índice original. En scripts personalizados, finaliza los procesos que escriben en segundo plano antes de importar o confirmar un árbol.

Los Sandbox desmontados correctamente se detienen tras el tiempo de inactividad de LayerFS. Cada prueba conserva su volumen del Store; administra ese volumen específico y sus contenedores mediante los identificadores del recibo. Una operación fallida conserva su estado registrado para el diagnóstico. La [referencia para mantenedores](../../docs/dev/layerfs.md) cubre los scripts, los recibos y la limpieza de recursos.
