// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import "ol/ol.css";
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import { defaults as defaultControls } from "ol/control";
import GeoJSON from "ol/format/GeoJSON";

// --- KONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const EVENT_CODE = import.meta.env.VITE_EVENT_CODE;

const LOGIN_DURATION = 1000 * 60 * 10;
const STORAGE_KEY = "tri_login_timestamp";

// Timeout Einstellung (z.B. 30 Min)
const MARKER_TIMEOUT = 1000 * 60 * 30;

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

interface Participant {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    last_updated: string;
    distanz: string; // NEU: Distanz im Interface
}

const COLORS = {
    swim: "#5485f4",
    bike: "#f06c00",
    run:  "#f153d5"
};

const ROUTES_CONFIG = [
    { url: "routes/Strecke_Schwimmen.json", color: COLORS.swim, width: 4, category: "common" },
    { url: "routes/Strecke_Fahrrad_Volks.json", color: COLORS.bike, width: 4, category: "volks" },
    { url: "routes/Strecke_Laufen_Volks.json", color: COLORS.run, width: 4, category: "volks" },
    { url: "routes/Strecke_Fahrrad_Olymp.json", color: COLORS.bike, width: 4, category: "olymp" },
    { url: "routes/Strecke_Laufen_Olymp.json", color: COLORS.run, width: 4, category: "olymp" }
];

const LEGEND_ITEMS = [
    { label: "Schwimmen", color: COLORS.swim },
    { label: "Radfahren", color: COLORS.bike },
    { label: "Laufen", color: COLORS.run }
];

const POINTS_CONFIG = [
    { url: "points/start_point.json", label: "START", color: "#049c04", textColor: "#ffffff", radius: 10 },
    { url: "points/end_point.json", label: "ZIEL", color: "#e6b800", textColor: "#ffffff", radius: 10 }
];

// --- STYLE HELPER: Bestimmt Farbe nach Distanz ---
const getParticipantStyle = (name: string, distanzRaw: string) => {
    const d = distanzRaw ? distanzRaw.toLowerCase() : "";

    // Logik: Ist es Volksdistanz?
    const isVolks = d.includes("volks") || d === "v";
    
    const fillColor = "#ffffff";
    const strokeColor = isVolks ? "#000000" : "#777777";
    const textColor = isVolks ? "#000000" : "#777777";
    const textStroke = "#ffffff";

    return new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: strokeColor, width: 3 }),
        }),
        text: new Text({
            text: name,
            offsetY: -12,
            font: "bold 12px Roboto, sans-serif",
            fill: new Fill({ color: textColor }),
            stroke: new Stroke({ color: textStroke, width: 2 }),
        })
    });
};

export function AppUI() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (!EVENT_CODE) return true;
        const storedTimestamp = localStorage.getItem(STORAGE_KEY);
        if (storedTimestamp) {
            const lastLogin = parseInt(storedTimestamp, 10);
            const now = Date.now();
            if (now - lastLogin < LOGIN_DURATION) return true;
        }
        return false;
    });

    const [activeFilter, setActiveFilter] = useState<"all" | "volks" | "olymp">("all");
    const [inputCode, setInputCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const mapRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef(new Map<string, Feature>());
    const routeLayersRef = useRef<VectorLayer<VectorSource>[]>([]);

    const handleLogin = () => {
        if (inputCode === EVENT_CODE) {
            setIsAuthenticated(true);
            setErrorMsg("");
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } else {
            setErrorMsg("❌ Ungültiger Code");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleLogin();
    };

    // --- EFFECT 1: KARTEN INITIALISIERUNG ---
    useEffect(() => {
        if (!isAuthenticated || !mapRef.current || !supabase) return;

        localStorage.setItem(STORAGE_KEY, Date.now().toString());

        // A. Participant Layer
        const participantSource = new VectorSource();
        // WICHTIG: Hier keinen globalen Style mehr setzen, da jeder Punkt individuell ist!
        const participantLayer = new VectorLayer({
            source: participantSource,
            zIndex: 100
        });

        // B. Route Layers
        const createdRouteLayers = ROUTES_CONFIG.map(config => {
            const layer = new VectorLayer({
                source: new VectorSource({
                    url: config.url,
                    format: new GeoJSON({ featureProjection: "EPSG:3857" })
                }),
                style: new Style({
                    stroke: new Stroke({ color: config.color, width: config.width })
                }),
                zIndex: 1
            });
            layer.set("category", config.category);
            return layer;
        });

        routeLayersRef.current = createdRouteLayers;

        // C. Point Layers
        const pointLayers = POINTS_CONFIG.map(config => {
            return new VectorLayer({
                source: new VectorSource({
                    url: config.url,
                    format: new GeoJSON({ featureProjection: "EPSG:3857" })
                }),
                style: new Style({
                    image: new CircleStyle({
                        radius: config.radius,
                        fill: new Fill({ color: config.color }),
                        stroke: new Stroke({ color: "white", width: 3 }),
                    }),
                    text: new Text({
                        text: config.label,
                        offsetY: 0,
                        font: "bold 10px sans-serif",
                        fill: new Fill({ color: config.textColor }),
                        stroke: new Stroke({ color: config.color, width: 2 }),
                    })
                }),
                zIndex: 50
            });
        });

        // D. Map Init
        const map = new OlMap({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                ...createdRouteLayers,
                ...pointLayers,
                participantLayer
            ],
            controls: defaultControls({
                zoom: false,
                rotate: false,
                attribution: false
            }),
            view: new View({
                center: fromLonLat([7.785, 51.981]),
                zoom: 14,
            }),
        });

        // --- HILFSFUNKTION: Marker Updaten oder Löschen ---
        const updateOrAddMarker = (p: Participant) => {
            if (!p.latitude || !p.longitude) return;

            const lastUpdate = p.last_updated ? new Date(p.last_updated).getTime() : 0;
            const now = Date.now();
            const isTooOld = (now - lastUpdate) > MARKER_TIMEOUT;

            // FIX: Direkt über Source gehen
            const existingFeature = participantSource.getFeatureById(p.id);

            // A. Löschen
            if (isTooOld) {
                if (existingFeature) {
                    participantSource.removeFeature(existingFeature as Feature);
                }
                featuresRef.current.delete(p.id);
                return;
            }

            const coords = fromLonLat([p.longitude, p.latitude]);

            // STYLE BERECHNEN: Hier holen wir Schwarz oder Weiß
            const style = getParticipantStyle(p.name, p.distanz);

            // B. Update
            if (existingFeature) {
                (existingFeature.getGeometry() as Point).setCoordinates(coords);
                existingFeature.set("last_updated_ts", lastUpdate);

                // WICHTIG: Distanz im Feature speichern für den Filter später!
                existingFeature.set("distanz", p.distanz);

                // Style aktualisieren
                // Hinweis: Der Filter-Effect unten wird dies ggf. sofort wieder unsichtbar machen,
                // falls der Filter aktiv ist. Das ist okay.
                existingFeature.setStyle(style);

                featuresRef.current.set(p.id, existingFeature as Feature);
            } else {
                // C. Neu
                const feature = new Feature({
                    geometry: new Point(coords),
                    name: p.name
                });

                feature.setId(p.id);
                feature.set("last_updated_ts", lastUpdate);

                // WICHTIG: Distanz speichern
                feature.set("distanz", p.distanz);

                feature.setStyle(style);

                participantSource.addFeature(feature);
                featuresRef.current.set(p.id, feature);
            }
        };

        // E. Data Fetching
        const fetchInitialData = async () => {
            const { data } = await supabase.from("participants").select("*");
            if (data) {
                data.forEach(p => updateOrAddMarker(p as unknown as Participant));
            }
        };
        fetchInitialData();

        // F. Realtime
        const channel = supabase
            .channel("tracking")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "participants" },
                (payload) => updateOrAddMarker(payload.new as Participant)
            )
            .subscribe();

        // G. Interval Cleanup
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            featuresRef.current.forEach((_, id) => {
                const feature = participantSource.getFeatureById(id);
                if (feature) {
                    const ts = feature.get("last_updated_ts");
                    if (ts && (now - ts > MARKER_TIMEOUT)) {
                        participantSource.removeFeature(feature as Feature);
                        featuresRef.current.delete(id);
                    }
                } else {
                    featuresRef.current.delete(id);
                }
            });
        }, 60000);

        return () => {
            clearInterval(cleanupInterval);
            map.setTarget(undefined);
            supabase.removeChannel(channel);
            routeLayersRef.current = [];
            featuresRef.current.clear();
        };
    }, [isAuthenticated]);


    // --- EFFECT 2: FILTER LOGIK (Routen UND Teilnehmer) ---
    useEffect(() => {
        // 1. Routen filtern (wie bisher)
        routeLayersRef.current.forEach(layer => {
            const category = layer.get("category");
            if (category === "common") layer.setOpacity(1);
            else if (activeFilter === "all") layer.setOpacity(1);
            else if (activeFilter === category) layer.setOpacity(1);
            else layer.setOpacity(0.25);
        });

        // 2. Teilnehmer filtern (NEU!)
        featuresRef.current.forEach((feature) => {
            // Wir holen uns die gespeicherte Distanz aus dem Feature
            const distRaw = feature.get("distanz");
            const d = distRaw ? distRaw.toLowerCase() : "";
            const name = feature.get("name");

            // Prüfen, ob der Teilnehmer angezeigt werden soll
            let isVisible = false;

            if (activeFilter === "all") {
                isVisible = true;
            } else if (activeFilter === "volks") {
                // Zeigen wenn "volks" oder "v"
                if (d.includes("volks") || d === "v") isVisible = true;
            } else if (activeFilter === "olymp") {
                // Zeigen wenn "olymp" oder "o"
                if (d.includes("olymp") || d === "o") isVisible = true;
            }

            if (isVisible) {
                // Zeigen: Wir setzen den korrekten Style (Schwarz/Grau) wieder
                feature.setStyle(getParticipantStyle(name, distRaw));
            } else {
                // Verstecken: Wir setzen einen leeren Style -> Unsichtbar
                feature.setStyle(new Style({}));
            }
        });

    }, [activeFilter, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", background: "#f4f6f8", fontFamily: "sans-serif" }}>
                <div style={{ background: "#003366", color: "white", padding: "1.5rem", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                    <h1 style={{ margin: 0, fontSize: "24px" }}> Telgter Triathlon Tracker 🏊🚴🏃</h1>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", padding: "2.5rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", width: "90%", maxWidth: "400px", textAlign: "center" }}>
                        <h2 style={{ marginTop: 0, color: "#333" }}>Event Zugang</h2>
                        <input type="text" placeholder="Code..." value={inputCode} onChange={e => setInputCode(e.target.value)} onKeyDown={handleKeyDown} style={{ width: "100%", padding: "12px", fontSize: "18px", textAlign: "center", borderRadius: "8px", border: "2px solid #ddd", marginBottom: "15px", boxSizing: "border-box", outline: "none" }} />
                        <button onClick={handleLogin} style={{ width: "100%", padding: "12px", fontSize: "16px", fontWeight: "bold", background: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Starten</button>
                        {errorMsg && <p style={{ color: "red", marginTop: "15px", fontWeight: "bold" }}>{errorMsg}</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "50px", background: "#003366", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", zIndex: 2000 }}>
                <span style={{ fontSize: "16px", fontWeight: "bold", fontFamily: "sans-serif" }}>3. Telgter Triathlon 🏊🚴🏃</span>
            </div>

            <div style={{ flex: 1, position: "relative" }}>
                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

                <div style={{
                    position: "absolute", bottom: 4, right: 6,
                    background: "rgba(255,255,255,0.6)", padding: "2px 5px", borderRadius: "4px",
                    fontSize: "10px", color: "#555", fontFamily: "sans-serif", pointerEvents: "auto",
                    zIndex: 900
                }}>
                    © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{color: "#333", textDecoration: "none"}}>OpenStreetMap contributors</a>
                </div>

                <div style={{
                    position: "absolute", top: 20, right: 20, // Mehr Abstand zum Rand
                    background: "rgba(255,255,255,0.95)",
                    padding: "16px", // Mehr Innenabstand (war 10px)
                    borderRadius: "12px", // Etwas rundere Ecken
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    fontSize: "14px", // Größere Schrift (war 11px)
                    fontFamily: "sans-serif",
                    zIndex: 1000,
                    width: "200px", // Breiter (war maxWidth 140px)
                    display: "flex", flexDirection: "column", gap: "6px" // Mehr Abstand zwischen den Zeilen
                }}>
                    <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                        <div style={{fontWeight: "bold", fontSize: "15px", marginBottom: 4}}>Distanz wählen:</div>
                        <div style={{display: "flex", gap: "8px"}}> {/* Mehr Lücke zwischen Buttons */}
                            {/* Buttons deutlich vergrößert */}
                            <button onClick={() => setActiveFilter("all")} style={{ flex: 1, padding: "10px 5px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", border: "1px solid #ccc", borderRadius: "6px", background: activeFilter === "all" ? "#003366" : "white", color: activeFilter === "all" ? "white" : "black" }}>Alle</button>
                            <button onClick={() => setActiveFilter("volks")} style={{ flex: 1, padding: "10px 5px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", border: "1px solid #ccc", borderRadius: "6px", background: activeFilter === "volks" ? "#003366" : "white", color: activeFilter === "volks" ? "white" : "black" }}>Volks</button>
                            <button onClick={() => setActiveFilter("olymp")} style={{ flex: 1, padding: "10px 5px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", border: "1px solid #ccc", borderRadius: "6px", background: activeFilter === "olymp" ? "#003366" : "white", color: activeFilter === "olymp" ? "white" : "black" }}>Olymp</button>
                        </div>
                    </div>

                    <div style={{height: 1, background: "#ddd", margin: "4px 0"}}></div>

                    <div>
                        <div style={{marginBottom: 8, fontWeight: "bold", fontSize: "15px"}}>Disziplinen:</div>
                        {LEGEND_ITEMS.map(item => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                                {/* Striche dicker und länger gemacht */}
                                <span style={{width: 24, height: 6, background: item.color, marginRight: 10, borderRadius: 3}}></span>
                                <span style={{fontSize: "14px", fontWeight: "bold"}}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
