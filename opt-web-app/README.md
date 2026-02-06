# 🏊🚴🏃 Telgter Triathlon - Live Web-App

Dies ist die Zuschauer-Webanwendung für den 3. Telgter Triathlon. Sie basiert auf **React**, **OpenLayers** und **Supabase** und ermöglicht es Zuschauern, die Positionen der Athleten in Echtzeit auf einer Karte zu verfolgen.

## ✨ Features

* **📡 Echtzeit-Tracking:** Positionen aktualisieren sich live via Supabase Realtime (kein Neuladen nötig).
* **🗺️ Interaktive Karte:** Basierend auf OpenStreetMap und OpenLayers.
* **🔍 Smarte Filter:** Zuschauer können nach Distanz filtern:
    * *Volksdistanz* (⚪ Weiße Punkte)
    * *Olympische Distanz* (⚫ Schwarze Punkte)
* **🧹 Auto-Cleanup:** Teilnehmer, die länger als 30 Minuten kein Signal gesendet haben (z.B. im Ziel), werden automatisch von der Karte entfernt.
* **📱 Mobile-First UI:** Vergrößerte Bedienelemente für einfache Nutzung auf Smartphones.

## 🚀 Quick Start

Stelle sicher, dass du [Node.js](https://nodejs.org/) und [pnpm](https://pnpm.io/) installiert hast.

1.  **In den Ordner wechseln:**
    ```bash
    cd opt-web-app
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    pnpm install
    ```

3.  **Entwicklungsserver starten:**
    ```bash
    pnpm dev
    ```
    Die App läuft dann meist unter `http://localhost:5173`.

## ⚙️ Konfiguration

### Umgebungsvariablen (.env)
Erstelle eine Datei namens `.env.local` im Hauptverzeichnis von `opt-web-app`, falls noch nicht vorhanden. Sie muss folgende Schlüssel enthalten:

```env
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_KEY=dein_supabase_anon_key
VITE_EVENT_CODE=dein_zugangscode
