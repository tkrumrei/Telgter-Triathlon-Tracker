# 🏊🚴🏃 Telgter Triathlon - Live Tracker

Willkommen im Repository des Live-Tracking-Systems für den Telgter Triathlon.
Dieses Projekt ermöglicht es Zuschauern, die Positionen der Athleten in Echtzeit auf einer interaktiven Karte zu verfolgen, Filter zu nutzen und den Wettkampfverlauf live zu beobachten.

![Status](https://img.shields.io/badge/Status-Live-success) ![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20OpenLayers-blue)

## Architektur & Funktionsweise

Das System besteht aus drei Hauptkomponenten, die nahtlos zusammenarbeiten:

1.  **📱 Die Athleten (Data Source):**
    Die Teilnehmer nutzen die App **Traccar Client** auf ihrem Smartphone. Diese sendet in regelmäßigen Abständen GPS-Daten an unser Backend.
2.  **☁️ Das Backend (Supabase):**
    Eine PostgreSQL-Datenbank speichert die Positionen und nutzt **Supabase Realtime**, um Änderungen sofort ("gepusht") an die Web-App weiterzuleiten.
3.  **🗺️ Die Web-App (Frontend):**
    Eine React-Anwendung zeigt die Karte an. Sie empfängt die Live-Updates, filtert nach Distanzen (Volks/Olympisch) und bereinigt veraltete Marker automatisch.