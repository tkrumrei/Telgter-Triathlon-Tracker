# 🏊🚴🏃 Telgter Triathlon - Live Web-App

Dies ist die technische Dokumentation der Zuschauer-Webanwendung für den Telgter
Triathlon. Die Anwendung basiert auf **React**, **Supabase**, **OpenLayers** und dem
**Open Pioneer Trails Framework**.

## ✨ Funktionen der Kartenanwendung

- **📡 Echtzeit-Tracking:** Positionen werden live über Supabase Realtime aktualisiert.
- **🗺️ Interaktive Karte:** Darstellung auf OpenStreetMap mit OpenLayers.
- **🔍 Distanz-Filter:** Umschalten zwischen Volksdistanz, olympischer Distanz und "alle".
- **🔐 Login-Seite mit Event-Zugangscode:** Zugriff auf die Live-Ansicht erst nach Code-Eingabe.
- **👤 Aktive Athlet:innen folgen:** Athlet:innen im Panel auswählen und Karte automatisch nachführen.
- **ℹ️ Info-Panel:** Renninfos, Distanzen und Finisher-Ansicht direkt in der Web-App.
- **🧹 Auto-Cleanup:** Veraltete Marker werden nach einem Timeout automatisch entfernt.
- **💻📱 Plattformübergreifend:** Bedienelemente und Panels funktionieren auf Smartphone und Desktop.

## 🚀 Quick Start

Voraussetzungen:

- [Node.js](https://nodejs.org/) `>= 20`
- [pnpm](https://pnpm.io/) `>= 10`

1. In den Ordner wechseln:

```bash
cd opt-web-app
```

2. Abhängigkeiten installieren:

```bash
pnpm install
```

3. Entwicklungsserver starten:

```bash
pnpm dev
```

Die App läuft danach in der Regel unter `http://localhost:5173`.

## ⚙️ Konfiguration

### Umgebungsvariablen

Lege eine Datei `opt-web-app/.env.local` an (falls sie noch nicht existiert):

```env
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_KEY=dein_supabase_anon_key
VITE_EVENT_CODE=dein_zugangscode
```

- `VITE_SUPABASE_URL`: URL deines Supabase-Projekts
- `VITE_SUPABASE_KEY`: anonymer Public Key der Web-App
- `VITE_EVENT_CODE`: Zugangscode fuer die Event-Freigabe in der UI

## Weitere Doku im Repository

- Event-Ueberblick: `../README.md`
- Athlet:innen-Einrichtung (Traccar Client): `../mobile-app/README.md`
