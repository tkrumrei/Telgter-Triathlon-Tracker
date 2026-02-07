# 📱 Anleitung für Athleten: Live-Tracking einrichten

Damit deine Freunde, Familie und Fans dich während des **3. Telgter Triathlons** live auf der Karte verfolgen können, nutzen wir die kostenlose App **"Traccar Client"**.

Bitte nimm dir 5 Minuten Zeit und richte die App **vor dem Wettkampf** (am besten zu Hause) ein.

---

## 1. App herunterladen

Lade dir die kostenlose App "Traccar Client" herunter:

* 🍎 **iOS (iPhone):** [App Store Link](https://apps.apple.com/us/app/traccar-client/id843156974)
* 🤖 **Android:** [Google Play Link](https://play.google.com/store/apps/details?id=org.traccar.client)

> ⚠️ **Wichtig:** Bitte lade "Traccar Client", NICHT den "Traccar Manager".

---

## 2. App konfigurieren (Exakt so einstellen!)

Öffne die App. Damit das Tracking auch im Startbereich und bei ausgeschaltetem Bildschirm funktioniert, müssen die Einstellungen **genau** wie folgt gesetzt werden:

| Einstellung | Dein Wert | Warum ist das wichtig? |
| :--- | :--- | :--- |
| **Gerätekennung** | `Deine Startnummer` | Damit man weiß, wer du bist. |
| **Server-URL** | `https://wgndegmzlajeiflnxazy.supabase.co/functions/v1/update-position` | **Exakt so kopieren!** (Keine Leerzeichen) |
| **Genauigkeit** | `Hoch` | Für genaues GPS im Gelände. |
| **Frequenz** | `10` | Sendet alle 10 Sekunden. |
| **Distanz** | `10` | Sendet bei 10m Bewegung (verhindert "Klemmen"). |
| **Stillstand-Herzschlag** | **60** | **Wichtig:** Sendet 1x pro Minute, auch wenn du am Start stehst. |
| **Offline-Pufferung** | **AN** (Ein) | Speichert Daten im Funkloch. |
| **Wakelock** | **AN** (Ein) 🚨 | **Pflicht:** Verhindert, dass die App einschläft. |
| **Stopp-Erkennung** | **AUS** (Aus) 🚨 | **Muss AUS sein!** Sonst sendet die App nicht, wenn du kurz wartest. |

---

## 3. Wichtige Handy-Einstellungen (Damit es nicht abbricht)

Damit das Tracking funktioniert, während das Handy in der Trikottasche ist (Bildschirm aus), braucht die App volle Rechte.

### 🤖 Für Android (Samsung, Pixel, etc.)
1.  **Standort:** Wenn gefragt, wähle **"Immer zulassen"** (nicht nur "Bei Nutzung der App").
2.  **Akku-Optimierung ausschalten (Der häufigste Fehler!):**
    * Gehe in die Handy-Einstellungen ➔ Apps ➔ Traccar Client ➔ Akku.
    * Wähle **"Nicht eingeschränkt"** (oder "Keine Optimierung").
    * *Ohne das stoppt das Tracking nach 5 Minuten!*
3.  **Google Genauigkeit:**
    * Gehe in die Handy-Einstellungen ➔ Standort ➔ Google-Standortgenauigkeit.
    * Schalter muss **AN** sein.

### 🍎 Für iOS (iPhone)
1.  **Standort:** Gehe zu Einstellungen ➔ Traccar Client ➔ Standort.
2.  Wähle **"Immer"**.
3.  Aktiviere **"Genauer Standort"**.

---

## 4. Am Wettkampftag: So startest du

1.  **Positionierung:** Pack das Handy in die **Trikottasche am Rücken** oder in einen Laufgürtel/Oberarmband.
    * ❌ *Nicht tief in Rucksäcke oder Satteltaschen (schlechtes GPS-Signal!)*
2.  **Starten:** Schalte den **Dienststatus** in der App erst ein, wenn du **draußen** bist (auf dem Weg zum Start).
    * Der Schalter muss grün leuchten.
3.  **Check:** Nach dem Wettkampf Tracking wieder ausschalten.

**Viel Erfolg und einen tollen Wettkampf!** 🏊🚴🏃
