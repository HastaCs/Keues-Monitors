# AGENTS.md

Contexto del proyecto para agentes y colaboradores. Léelo antes de tocar código.

## Idioma

Todos los textos y labels visibles de la UI deben estar en **inglés**. El código nuevo, los comentarios y los nombres de variables también en inglés donde sea razonable.

## Qué es

**Keues-Monitors** es el frontend de las **pantallas de monitor** (TVs de sala) del sistema de gestión de colas **Keues**. Cada monitor se ejecuta en una TV de un establecimiento (carnicería, pescadería, etc.) y muestra en tiempo real lo que ocurre según el tipo de flujo:

- **TicketMachine** (flowType 0): el turno que se está llamando ahora en grande, más un histórico de últimos llamados con su puesto.
- **SetFree** (flowType 1): el último puesto que ha quedado libre, en grande.
- **ManualCall** (flowType 2): el número manual que se está llamando ahora, en grande.

Un monitor **no se asigna a un puesto concreto**: muestra la actividad de toda la ubicación/flujo elegida. La configuración incluye un **nombre de pantalla** para identificar cada TV.

Es una app **Tauri 2 + React + Vite** (backend Rust en `src-tauri/`) conectada al backend ASP.NET de Keues vía REST (solo lectura) y SignalR (tiempo real). **El monitor es solo lectura: no llama a ningún endpoint de escritura.**

**Nota:** los eventos del hub de monitor aún no existen en el backend. Esperar que no lleguen eventos o que la conexión falle es el comportamiento esperado, no un bug.

## Stack y scripts

- Tauri 2 (backend Rust en `src-tauri/`), React 19, Vite 8, TypeScript 6, Mantine 9 (UI) + @tabler/icons-react, @emotion/react, @microsoft/signalr, @tauri-apps/api, @tauri-apps/plugin-updater.

Scripts (`package.json`):
- `pnpm dev` → solo Vite (renderer en `http://localhost:11225`).
- `pnpm start` → `tauri dev` (arranca Vite + la app Tauri). **Es el comando normal del usuario.**
- `pnpm build` → build del renderer (`dist/`).
- `pnpm dist` → `tauri build` → compila todo y genera el instalador **NSIS**.

Verificación obligatoria tras tocar código (sin errores):
- `pnpm exec tsc -b`
- `pnpm exec eslint .`
- `pnpm exec vite build`
- `cargo check` y `cargo clippy` en `src-tauri/`

## Arquitectura

```
src-tauri/
  src/
    main.rs        # comandos load_config/save_config (JSON + deviceId UUID),
                   # get_proxy_base/set_proxy_target, y TTS (tts_list_voices/
                   # tts_speak/tts_stop); registra plugin updater y estado
    proxy.rs       # reverse-proxy local HTTP+WebSocket (evita CORS/mixed content)
  tauri.conf.json  # ventana 1280x800, CSP, NSIS, bundle.resources (tts), updater
  capabilities/default.json  # core:default + updater:default
  Cargo.toml / build.rs / icons/

src/
  main.tsx       # MantineProvider forceColorScheme="light"
  App.tsx        # carga config → MonitorPanel si hay config válida, si no ConfigScreen
  index.css      # margin/padding 0, overflow hidden

  types/
    config.ts       # MonitorConfiguration (server, locationId, flowId, flowType, theme, ...)
    models.ts       # Location, Counter, Flow, FlowNode, Ticket
    theme.ts        # MonitorTheme, DEFAULT_THEMES, resolveTheme
    tts.ts          # TTSVoice
    layout.ts       # MonitorLayoutDefinition

  api/
    appBridge.ts      # invoke save_config/load_config + updater (tauri-plugin-updater)
    net.ts            # isTauri, proxyBase, serverBase, configureTarget
    keuesApi.ts       # getLocations, getFlows, getFlow, getCounters, getTickets, getFlowQueueIds
    signalRService.ts # connect/disconnect, subscribeStatus, onTicketCalled/Attended/CounterFree/ManualCall
    ttsService.ts     # ttsListVoices/ttsSpeak/ttsStop vía invoke + Web Audio
    soundService.ts   # playBeep (beep de turno desde public/sounds/beep.wav + Web Audio)

  constants/app.ts     # APP_VERSION desde package.json

  components/
    Brand.tsx                    # wordmark "KEUES" (icono + texto), usado en carga y ConfigScreen
    VersionBadge.tsx             # badge v{APP_VERSION} fijo abajo-derecha (solo ConfigScreen)
    config/
      ConfigScreen.tsx           # pestañas Configuration / Appearance / Updates
      UpdatePanel.tsx            # pestaña Updates (autoupdater)
      themePresets.ts            # getPresetsForFlow(flowType) (paletas solo de color), COLOR_SWATCHES
      PresetPicker.tsx           # fila de tarjetas de preset; onSelect aplica colors via updateTheme
      ThemePreviewModal.tsx      # modal fullScreen: renderiza el panel real en un "stage"
                                 # del tamaño del viewport escalado con transform: scale()
    monitors/
      MonitorPanel.tsx           # despachador por flowType + conexión SignalR + estado de eventos
      TicketMonitorPanel.tsx     # flowType 0
      SetFreeMonitorPanel.tsx    # flowType 1
      ManualCallMonitorPanel.tsx # flowType 2
      layouts/                   # SpotlightLayout, BoardLayout, elementos compartidos
```

### Tipo `CalledTicket` (definido y exportado en MonitorPanel.tsx)

```ts
interface CalledTicket {
    ticketId: string;
    ticketCode: string;
    counterCode?: string;
    calledAt: number; // Date.now() al recibir el evento
}
```

## Configuración (persistencia local)

- La config se guarda en **`app_config_dir()/config.json`** (en Linux `~/.config/com.keues.monitors/config.json`), como JSON directo (sin clave envolvente), vía los comandos Rust `load_config`/`save_config`.
- `deviceId` UUID v4 se genera/valida en Rust y se conserva en escrituras posteriores.
- **Migración automática del formato Electron**: si no hay config nueva, se lee `~/.config/keues-monitors/config.json` (clave `config`) y se importa una vez.
- El frontend usa `appBridge.ts` (`saveConfiguration`/`loadConfiguration` → `invoke("save_config"/"load_config")`).

### Pantalla de configuración (ConfigScreen)

- Pestañas: **Configuration** (server + location + flow + nombre de pantalla), **Appearance** (temas) y **Updates** (autoupdater).
- La edición de apariencia es **por flowType**: hay tabs TicketMachine/SetFree/ManualCall y cada una edita el `MonitorTheme` de ese tipo. Se persisten los tres.
- En Appearance hay **presets de paleta** (`getPresetsForFlow`) que solo tocan colores (no pisan textos, layout, voz ni `showHistory`), un botón **Preview** que abre `ThemePreviewModal` (preview WYSIWYG del panel real), y los inputs avanzados agrupados en un **Accordion** (Colors / Background / Titles & text / Layout / Border / Voice / History). Los ColorInput usan la paleta `COLOR_SWATCHES`.
- El wordmark **KEUES** (Brand) aparece arriba en ConfigScreen y en la pantalla de carga inicial.
- Antes de cada fetch (conectar, cambiar ubicación/flujo, precarga) se llama `configureTarget(server)` para apuntar el proxy local.

## Dominio y contrato API

Todas las listas vienen envueltas en `{ data: [...] }`; usar `json.data`.

- `GET /api/locations` → `{data: [Location]}`
- `GET /api/flows?locationId=X` → `{data: [Flow]}`
- `GET /api/flows/{id}` → objeto directo (sin `{data}`).
- `GET /api/counters?locationId=X` → `{data: [Counter]}` (resolver códigos de puesto en eventos).
- `GET /api/tickets?locationId=X` → `{data: [Ticket]}` (`status`: 1 = en curso, 2 = atendido). Solo se consulta para la recuperación inicial de flowType 0.

`getFlowQueueIds(flow)` extrae los `queueId` de los nodos `ticket` del `flowJson`.

### FlowType

- `0` = **TicketMachine** · `1` = **SetFree** · `2` = **ManualCall**

## Red / proxy

- El frontend **no** llama directo al servidor: apunta al reverse-proxy local de Rust (`http://127.0.0.1:<puerto>`, ver `src/api/net.ts`), que reenvía HTTP + WebSocket a la IP real (`configureTarget`).
- Esto evita mixed content/CORS cuando el servidor está en otra IP; funciona igual en Linux y Windows.
- `serverBase(server)` devuelve la base del proxy (una vez resuelta) o el `server` crudo en modo navegador (no Tauri).

## Eventos SignalR

Conexión al hub `/devices?deviceId=...&name=...&locationId=...&flowId=...&type=Monitor` (a través del proxy) con reconexión automática infinita (5s).

**El backend emite un único evento `TicketCalled` para todos los flujos.** El MonitorPanel rutea según `flowType`:
- 0 → turno actual + histórico con `ticketCode` y `counterCode`.
- 1 → muestra `counterCode` como puesto libre.
- 2 → muestra `counterCode-ticketCode` (p. ej. `P-78`).

- **TicketCalled**: `{ ticketId?, ticketCode, counterCode? }`
- **TicketAttended**: `{ ticketId }` → elimina el ticket del actual y del histórico.
- **CounterFree** y **ManualCall**: listeners reservados; de momento el backend no los emite.

El servicio expone `connect(config)` / `disconnect()`, `subscribeStatus(listener)` → `"connecting" | "connected" | "reconnecting" | "disconnected"` y `onTicketCalled` / `onTicketAttended` / `onCounterFree` / `onManualCall`.

## Text-to-speech (TTS)

- Comandos Rust en `src-tauri/src/main.rs`: `tts_list_voices`, `tts_speak` (spawn de `piper`, devuelve el WAV como bytes), `tts_stop` (mata el proceso).
- El frontend los consume en `src/api/ttsService.ts` vía `invoke` y reproduce el WAV con Web Audio.
- **Rutas**: en dev se usa `../resources/tts` (desde `CARGO_MANIFEST_DIR`); empaquetado usa `resource_dir()/tts` (bundleado vía `bundle.resources` en `tauri.conf.json`).
- Binarios: Windows → `piper-win/piper.exe`, Linux → `piper-linux/piper`. En Linux se fija `LD_LIBRARY_PATH` a `piper-linux`.
- Voces: modelos `models/*.onnx` con prefijo `es_`/`en_`; los hablantes salen del `speaker_id_map` del `.json` del modelo (si está vacío, una voz por modelo).
- El default `voiceId` del tema es el nombre de modelo (`es_ES-sharvard-medium.onnx`); ConfigScreen lo resuelve al primer hablante de ese modelo.
- **Beep de aviso**: `soundService.playBeep()` reproduce `public/sounds/beep.wav` si `theme.beepEnabled` está activo (Appearance → Alert sound, por flowType, desactivado por defecto). Si hay beep y voz, la síntesis TTS se lanza en paralelo con el beep pero el audio espera a que este termine: orden garantizado beep → voz sin hueco extra.

## Diseño visual de los paneles

Los paneles son lo que ven los clientes en sala: deben ser **visuales y atractivos**, legibles desde 3-4 m y responsive por tamaño de monitor.

### Principios generales

- Fondo claro (`#f8f9fa`) para salas bien iluminadas; datos importantes en colores oscuros de alto contraste.
- **Escalado con el monitor**: `clamp(min, min(vw, vh), max)` para los números protagonistas (escala con ambas dimensiones y evita desbordes verticales) y `clamp(min, vw, max)` para el resto. Evitar techos bajos que impidan crecer en monitores grandes.
- Animación de entrada sutil al cambiar el turno (fade + scale ~350-400 ms) y glow pulsante en la card durante ~2.5 s.
- Layout a pantalla completa sin scrollbars (`overflow: hidden`); cards blancas con sombra suave.

### Sistema de temas

Todos los colores de los paneles salen de un `MonitorTheme` resuelto con `resolveTheme(flowType, overrides)` (`src/types/theme.ts`). Los defaults (`DEFAULT_THEMES`) dependen del flowType y son editables por el usuario en ConfigScreen → Appearance (una config por tipo de flow). Los paneles también derivan bordes tenues y texto atenuado con `color-mix()` a partir de `secondaryTextColor`.

Paleta por defecto:

| Uso | Color |
|---|---|
| Fondo principal | `#f8f9fa` |
| Fondo cards | `#ffffff` |
| Acento TicketMachine (turno actual) | `#1a1a2e` (azul muy oscuro) |
| Texto secundario / puesto que atiende | `#374151` |
| Acento SetFree (puesto libre) | `#1a6b3a` (verde oscuro) |
| Acento ManualCall (número manual) | `#92400e` (ámbar oscuro) |
| Labels / texto secundario | `#6b7280` |
| Texto de estado vacío | `#d1d5db` |
| Bordes / separadores | `#e5e7eb` |

### Paneles

- **TicketMonitorPanel (0)**: fila con el turno actual a la izquierda (`flex: 1`, card centrada con borde `borderColor`) e histórico a la derecha (ancho `clamp(280px, 32vw, 45rem)`). Histórico de hasta 10 entradas, deduplicado por `ticketCode` y con opacidad decreciente por antigüedad. Números protagonistas `fw=900`.
- **SetFreeMonitorPanel (1)**: puesto libre en grande (nombre + subtexto `labelFooter`); el tamaño de fuente se calcula dinámicamente para que el código quepa en una línea. Histórico de puestos libres a la derecha.
- **ManualCallMonitorPanel (2)**: muestra `counterCode-code` en grande (p. ej. `P-78`) + histórico de otras colas (1 entrada por `counterCode` distinto).

### Elementos comunes (MonitorPanel / ConfigScreen)

| Elemento | Posición | Detalle |
|---|---|---|
| Botones "Fullscreen" y "Settings" | Fijo arriba, centrados (monitor) | `variant="filled"` xs, color dark. **Se ocultan en fullscreen** (salir con `Esc`) |
| Badge de conexión SignalR | Fijo abajo-izquierda (monitor) | `size="md" variant="light"`, verde/rojo/naranja/amarillo según estado. **Se oculta en fullscreen** |
| Nombre de pantalla (TV) | Fijo abajo-izquierda (solo ConfigScreen) | Badge `variant="outline"` gris |
| VersionBadge | Fijo abajo-derecha (solo ConfigScreen) | `v{APP_VERSION}`, badge outline gris |

## Autoupdater (tauri-plugin-updater)

- `plugins.updater` en `tauri.conf.json`: `pubkey` (clave pública de firma) + `endpoints` apuntando a `https://github.com/HastaCs/Keues-Monitors/releases/latest/download/latest.json`.
- `createUpdaterArtifacts: true` y `bundle.targets: ["nsis"]` para Windows.
- Claves de firma: `~/.tauri/keues-monitors.key` (privada) + `.key.pub` (pública). Generadas con `tauri signer generate`.
- Frontend: `src/api/appBridge.ts` (`checkForUpdates`/`downloadUpdate`/`installUpdate` con `@tauri-apps/plugin-updater`); `UpdatePanel.tsx` muestra el estado.
- `APP_VERSION` (frontend) sale de `package.json`; la versión del instalador/updater sale de `src-tauri/tauri.conf.json` (`version: "../package.json"`). `Cargo.toml` tiene su propia `version` (cosmética para el updater).
- **Releases**: Release Please (`release-please-config.json` + `.release-please-manifest.json`) + workflows `.github/workflows/release-please.yml` (PR de changelog) y `.github/workflows/publish.yml` (tauri-action, NSIS firmado). Secreto `TAURI_SIGNING_PRIVATE_KEY` (contenido de `~/.tauri/keues-monitors.key`) en GitHub.
- En dev no hay releases: "Could not check for updates" es esperado hasta publicar la primera versión.

## Entorno / gotchas

- Para compilar/ejecutar Tauri en Linux se requieren los paquetes `-dev` (libwebkit2gtk-4.1-dev, libgtk-3-dev, etc.) y la toolchain de Rust.
- Vite usa el puerto **11225** (no cambiarlo). En dev Tauri lanza `pnpm dev` (`beforeDevCommand`) y carga `http://localhost:11225`.
- Los recursos TTS (`resources/tts`, ~167 MB) se bundlean vía `bundle.resources` en `tauri.conf.json`; el binario `piper` de Linux debe conservar el bit ejecutable.
- `Grid` de Mantine 9 no acepta la prop `gutter` en el componente raíz; usar `gap`.
- La ConfigScreen reduce los tamaños de fuente Mantine sobrescribiendo las variables CSS `--mantine-font-size-*` y `--mantine-h*-font-size` en su contenedor raíz; los paneles de monitor no se ven afectados.

## Verifiación de lectura
- Para verificar que estas leyendo este fichero, empieza las frases siempre, repito, SIEMPRE, con la frase "mucho muchacho"
