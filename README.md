# 🏊🚴🏃 Telgter Triathlon - Live Tracker

Willkommen im Repository des Live-Tracking-Systems für den Telgter Triathlon.
Damit können Zuschauer den Wettkampf live auf einer Karte verfolgen und Athlet:innen
in Echtzeit beobachten.

![Status](https://img.shields.io/badge/Status-Live-success)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20OpenLayers-blue)

## Was ist das?

Dieses Projekt zeigt die Positionen der Teilnehmenden nahezu in Echtzeit auf einer
interaktiven Karte. Die Daten kommen direkt von den Smartphones der Athlet:innen.
So können Familie, Freunde und Fans den Rennverlauf live mitverfolgen.

Technische Basis der Web-App ist das **Open Pioneer Trails Framework**.

## So funktioniert das Live-Tracking

Das System besteht aus drei Teilen, die zusammenarbeiten:

1. **📱 Athlet:innen senden GPS-Daten**
   Die App **Traccar Client** auf dem Smartphone sendet regelmäßig Standortdaten.
2. **☁️ Supabase verarbeitet Live-Daten**
   Die Positionen werden gespeichert und per **Supabase Realtime** sofort weitergegeben.
3. **🗺️ Die Web-App zeigt alles live an**
   Zuschauer sehen die Marker auf der Karte inklusive automatischer Aktualisierung.

## Features für Zuschauer

- **Echtzeit-Ansicht:** Positionen aktualisieren sich ohne Neuladen.
- **Interaktive Karte:** Übersichtliche Darstellung mit OpenLayers/OpenStreetMap.
- **Distanz-Filter:** Umschalten zwischen Volksdistanz und olympischer Distanz.
- **Login mit Event-Zugangscode:** Zugriff auf die Live-Karte nur mit gültigem Event-Code.
- **Aktive Athlet:innen folgen:** Athlet:innen auswählen und auf der Karte automatisch mitverfolgen.
- **Info-Panel in der App:** Renninfos, Distanzen und Finisher-Ansicht direkt im Interface.
- **Auto-Cleanup:** Veraltete Positionen werden nach einer Zeit automatisch entfernt.
- **Auf allen Geräten nutzbar:** Optimierte Bedienung auf Smartphone und Desktop.

## Für Athlet:innen

Die komplette Schritt-für-Schritt-Anleitung zur Einrichtung von Traccar Client findest du hier:

- `mobile-app/README.md`

## Für technische Details

Details zur Zuschauer-Web-App und zur Funktionsweise der Kartenanwendung stehen hier:

- `opt-web-app/README.md`

## Hinweis

Diese Root-README ist bewusst event-orientiert gehalten.
Technische Implementierungsdetails sind in den jeweiligen Teilprojekten dokumentiert.
