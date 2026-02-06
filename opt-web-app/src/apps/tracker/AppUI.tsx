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

// Timeout Einstellung
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
    { url: "points/end_point.json", label: "ZIEL", color: "#000000", textColor: "#ffffff", radius: 10 }
];

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

    // Wir nutzen das hier nur noch für den Cleanup-Intervall
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
        const participantLayer = new VectorLayer({
            source: participantSource,
            zIndex: 100,
            style: (feature) => new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: "white" }),
                    stroke: new Stroke({ color: "blue", width: 3 }),
                }),
                text: new Text({
                    text: feature.get("name"),
                    offsetY: -18,
                    font: "bold 14px Roboto, sans-serif",
                    fill: new Fill({ color: "#000" }),
                    stroke: new Stroke({ color: "#fff", width: 3 }),
                })
            })
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

            // 2. FIX: Wir fragen direkt die Karte nach dem Feature via ID!
            // Das verhindert das "Ghosting" Problem
            const existingFeature = participantSource.getFeatureById(p.id);

            // A. Löschen (wenn zu alt)
            if (isTooOld) {
                if (existingFeature) {
                    participantSource.removeFeature(existingFeature as Feature);
                }
                // Aus Ref löschen damit Cleanup sauber bleibt
                featuresRef.current.delete(p.id);
                return;
            }

            const coords = fromLonLat([p.longitude, p.latitude]);

            // B. Updaten (wenn vorhanden)
            if (existingFeature) {
                // Wir nutzen direkt das Feature von der Karte -> Sofortiges Update!
                (existingFeature.getGeometry() as Point).setCoordinates(coords);
                existingFeature.set("last_updated_ts", lastUpdate);

                // Ref synchron halten
                featuresRef.current.set(p.id, existingFeature as Feature);
            } else {
                // C. Neu erstellen
                const feature = new Feature({
                    geometry: new Point(coords),
                    name: p.name
                });

                // 3. FIX: ID setzen ist PFLICHT, damit getFeatureById oben funktioniert!
                feature.setId(p.id);
                feature.set("last_updated_ts", lastUpdate);

                participantSource.addFeature(feature);
                featuresRef.current.set(p.id, feature);
            }
        };

        // E. Data Fetching (Initial)
        const fetchInitialData = async () => {
            const { data } = await supabase.from("participants").select("*");
            if (data) {
                data.forEach(p => updateOrAddMarker(p as unknown as Participant));
            }
        };
        fetchInitialData();

        // F. Realtime Subscription
        const channel = supabase
            .channel("tracking")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "participants" },
                (payload) => updateOrAddMarker(payload.new as Participant)
            )
            .subscribe();

        // G. INTERVAL
        const cleanupInterval = setInterval(() => {
            const now = Date.now();

            featuresRef.current.forEach((_, id) => {
                // Wir holen uns das Feature sicherheitshalber direkt von der Source
                const feature = participantSource.getFeatureById(id);
                if (feature) {
                    const ts = feature.get("last_updated_ts");
                    if (ts && (now - ts > MARKER_TIMEOUT)) {
                        participantSource.removeFeature(feature as Feature);
                        featuresRef.current.delete(id);
                        console.log(`Teilnehmer ${id} ausgeblendet.`);
                    }
                } else {
                    // Falls es in Ref ist aber nicht mehr auf der Karte
                    featuresRef.current.delete(id);
                }
            });
        }, 60000);

        return () => {
            clearInterval(cleanupInterval);
            map.setTarget(undefined);
            supabase.removeChannel(channel);
            routeLayersRef.current = [];
            // 4. FIX: Gedächtnis löschen für Dev-Mode
            featuresRef.current.clear();
        };
    }, [isAuthenticated]);


    // --- EFFECT 2: FILTER LOGIK ---
    useEffect(() => {
        routeLayersRef.current.forEach(layer => {
            const category = layer.get("category");

            if (category === "common") {
                layer.setOpacity(1);
            } else if (activeFilter === "all") {
                layer.setOpacity(1);
            } else if (activeFilter === category) {
                layer.setOpacity(1);
            } else {
                layer.setOpacity(0.25);
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
                        <p style={{ color: "#666", marginBottom: "20px" }}>Bitte gib den Code ein.</p>
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
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(255,255,255,0.95)", padding: "10px", borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.2)", fontSize: "11px", fontFamily: "sans-serif",
                    zIndex: 1000, maxWidth: "140px",
                    display: "flex", flexDirection: "column", gap: "8px"
                }}>
                    <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                        <div style={{fontWeight: "bold", marginBottom: 2}}>Distanz wählen:</div>
                        <div style={{display: "flex", gap: "2px"}}>
                            <button onClick={() => setActiveFilter("all")} style={{ flex: 1, padding: "4px", fontSize: "10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", background: activeFilter === "all" ? "#003366" : "white", color: activeFilter === "all" ? "white" : "black" }}>Alle</button>
                            <button onClick={() => setActiveFilter("volks")} style={{ flex: 1, padding: "4px", fontSize: "10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", background: activeFilter === "volks" ? "#003366" : "white", color: activeFilter === "volks" ? "white" : "black" }}>Volks</button>
                            <button onClick={() => setActiveFilter("olymp")} style={{ flex: 1, padding: "4px", fontSize: "10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", background: activeFilter === "olymp" ? "#003366" : "white", color: activeFilter === "olymp" ? "white" : "black" }}>Olymp</button>
                        </div>
                    </div>

                    <div style={{height: 1, background: "#ddd"}}></div>

                    <div>
                        <div style={{marginBottom: 4, fontWeight: "bold"}}>Disziplinen:</div>
                        {LEGEND_ITEMS.map(item => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", marginTop: 3 }}>
                                <span style={{width: 10, height: 3, background: item.color, marginRight: 6, borderRadius: 2}}></span>
                                {item.label}
                            </div>
                        ))}
                    </div>

                    <div style={{height: 1, background: "#ddd"}}></div>

                    <div>
                        {POINTS_CONFIG.map(p => (
                            <div key={p.label} style={{display: "flex", alignItems: "center", marginTop: 3}}>
                                <span style={{width: 8, height: 8, background: p.color, marginRight: 6, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)"}}></span>
                                {p.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
