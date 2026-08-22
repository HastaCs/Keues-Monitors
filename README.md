# Keues Monitors

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/HastaCs/Keues-Monitors/main/package.json&query=$.version&label=Version&color=blue)](https://github.com/HastaCs/Keues-Monitors)
[![Status: MVP](https://img.shields.io/badge/status-MVP-yellow)](https://github.com/HastaCs/Keues)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![Mantine](https://img.shields.io/badge/Mantine-9-339AF0)](https://mantine.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> [Español](README.es.md)

TV display screens for the [Keues](https://www.keues.dev) queue management system.

Keues Monitors is the app that runs on the **monitor TVs** of an establishment (butcher shop, fishmonger, supermarket, etc.). It shows customers, in real time, what is happening in the queue: the ticket being called right now, the last counter that became free, the manual call number, and a history of recent calls.

It is **read-only**: it only displays information, it never writes to the backend.

> ⚠️ This project does not work standalone. It requires the [Keues](https://github.com/HastaCs/Keues) backend (REST API + SignalR hub) to connect to and display data.

---

## Screenshots

<table align="center">
  <tr align="center">
    <td>
      <img src="screenshots/monitorTicketMachine.png" alt="TicketMachine panel" width="100%"/>
      <br/><b>TicketMachine</b> — current ticket + history
    </td>
    <td>
      <img src="screenshots/monitorSetFreeCounter.png" alt="SetFree panel" width="100%"/>
      <br/><b>SetFree</b> — counter free
    </td>
  </tr>
  <tr align="center">
    <td>
      <img src="screenshots/monitorManualCall.png" alt="ManualCall panel" width="100%"/>
      <br/><b>ManualCall</b> — manual calls
    </td>
    <td>
      <img src="screenshots/monitorConfiguration.png" alt="Appearance panel" width="100%"/>
      <br/><b>Appearance</b> — panel customization
    </td>
  </tr>
</table>

---

## How it works

Each monitor runs on a screen in the establishment:

1. Choose the **server**, a **location** and a **flow**.
2. Give the screen a **name** to identify the TV.
3. The monitor connects to the backend (SignalR) and renders the panel that matches the flow type.

A monitor is **not tied to a specific counter**: it shows the activity of the whole location/flow.

The flow type determines which panel is displayed:

| Flow type | Panel | What it shows |
|---|---|---|
| `0` — TicketMachine | TicketMachine | Current called ticket (large) + last called tickets with their counter |
| `1` — SetFree | SetFree | Last free counter (large) |
| `2` — ManualCall | ManualCall | Manual call number, e.g. `P-78` (large) + calls from other queues |

---

## Features

### Fully customizable appearance

Each panel can be customized **per flow type** (TicketMachine, SetFree and ManualCall keep their own settings):

- **Colors**: background, cards, main/secondary text, title, and the entire history panel.
- **Background image**: upload your own wallpaper for the screen.
- **Border**: color and width of the main card.
- **Editable texts**: main title, footer text ("Please go to the counter"), history header, and more.
- **History panel**: show or hide it, and customize its colors independently.

### Optional human voice on SetFree

The **SetFree** panel can announce the free counter out loud (optional). You can:

- Enable/disable the voice announcement per screen.
- Choose the voice (Spanish or English) from the built-in neural voices.
- Set a custom text that is read right before the counter code (e.g. *"Please go to the counter"*).
- The announcement is played only when the counter actually appears on screen.

### Real time and reliability

- **Real-time updates** via SignalR with automatic reconnection.
- **Fullscreen** mode for TVs (the on-screen controls hide automatically).
- **Persisted configuration**: the setup is saved locally and restored on every launch.
- **Read-only**: the monitor never calls write endpoints.

---

## Install & run

```bash
pnpm install
pnpm start
```

- `pnpm start` launches Vite (renderer on `http://localhost:11225`) and the Tauri window together.
- On first launch, the configuration screen opens (server URL, location, flow, screen name).

> To build/run Tauri on Linux you need the `-dev` packages (libwebkit2gtk-4.1-dev, libgtk-3-dev, …) and the Rust toolchain.

---

## Build (Windows)

```bash
pnpm dist
```

Builds the renderer and the Tauri (Rust) backend and packages a Windows NSIS installer via `tauri build`.

> **Windows installer:** every [GitHub release](https://github.com/HastaCs/Keues-Monitors/releases) includes a ready-to-install `.exe` for Windows. Download it, run it and follow the installer steps — no build tools required.

---

## Technical summary

### Stack

Tauri 2 · React 19 · Vite 8 · TypeScript 6 · Mantine 9 · @microsoft/signalr.

### API endpoints used (read-only)

| Endpoint | Purpose |
|---|---|
| `GET /api/locations` | List of establishments |
| `GET /api/flows?locationId=X` | List of flows for a location |
| `GET /api/flows/{id}` | Fresh flow JSON |
| `GET /api/counters?locationId=X` | Counters, to resolve counter names in events |
| `GET /api/tickets?locationId=X` | Initial recovery of current tickets (flow type 0) |

### SignalR events

The monitor connects to the hub `/devices?...&type=Monitor`. A single event, `TicketCalled`, drives all three panels; `TicketAttended` removes an attended ticket. `CounterFree` and `ManualCall` are reserved (not emitted yet by the backend).

### Project structure

```
src-tauri/
  src/
    main.rs          # Config store, deviceId UUID, proxy target, TTS commands
    proxy.rs         # Local HTTP+WebSocket reverse proxy (avoids CORS/mixed content)

src/
  main.tsx           # App entry, Mantine provider
  App.tsx            # Loads config → MonitorPanel or ConfigScreen
  api/               # Read-only REST calls + SignalR service + TTS bridge
  components/
    config/          # ConfigScreen (Configuration / Appearance / Updates)
    monitors/        # MonitorPanel + Ticket/SetFree/ManualCall panels
  types/             # Config, models, theme and TTS definitions
```

---

## License

Released under the [MIT License](LICENSE).
