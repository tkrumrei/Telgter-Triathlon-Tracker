// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import "ol/ol.css";
import Map from "ol/Map";
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

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

interface Participant {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

// --- ROUTEN & PUNKTE KONFIG ---
const ROUTES_CONFIG = [
    { url: "routes/Strecke_Schwimmen.json", color: "#5485f4", width: 4, label: "Schwimmen" },
    { url: "routes/Strecke_Fahrrad_Volks.json", color: "#f06c00", width: 4, label: "Rad Volks" },
    { url: "routes/Strecke_Laufen_Volks.json", color: "#f153d5", width: 4, label: "Lauf Volks" },
    { url: "routes/Strecke_Fahrrad_Olymp.json", color: "#f06c00", width: 4, label: "Rad Olymp" },
    { url: "routes/Strecke_Laufen_Olymp.json", color: "#f153d5", width: 4, label: "Lauf Olymp" }
];

const POINTS_CONFIG = [
    { url: "points/start_point.json", label: "START", color: "#049c04", textColor: "#ffffff", radius: 10 },
    { url: "points/end_point.json", label: "ZIEL", color: "#000000", textColor: "#ffffff", radius: 10 }
];

export function AppUI() {
    const [isAuthenticated, setIsAuthenticated] = useState(!EVENT_CODE);
    const [inputCode, setInputCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const mapRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef(new Map<string, Feature>());

    const handleLogin = () => {
        if (inputCode === EVENT_CODE) {
            setIsAuthenticated(true);
            setErrorMsg("");
        } else {
            setErrorMsg("❌ Ungültiger Code");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleLogin();
    };

    // --- KARTEN-LOGIK (Startet erst, wenn isAuthenticated = true) ---
    useEffect(() => {
        if (!isAuthenticated || !mapRef.current || !supabase) return;

        // 1. Participant Layer
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

        // 2. Route Layers
        const routeLayers = ROUTES_CONFIG.map(config => {
            return new VectorLayer({
                source: new VectorSource({
                    url: config.url,
                    format: new GeoJSON({ featureProjection: "EPSG:3857" })
                }),
                style: new Style({
                    stroke: new Stroke({ color: config.color, width: config.width })
                }),
                zIndex: 1
            });
        });

        // 3. Point Layers
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

        // 4. Map Init
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                ...routeLayers,
                ...pointLayers,
                participantLayer
            ],
            controls: defaultControls({ zoom: false }),
            view: new View({
                center: fromLonLat([7.785, 51.981]),
                zoom: 14,
            }),
        });

        // 5. Data Fetching
        const fetchInitialData = async () => {
            const { data } = await supabase.from("participants").select("*");
            if (data) {
                data.forEach(p => updateOrAddMarker(p as unknown as Participant, participantSource));
            }
        };
        fetchInitialData();

        const channel = supabase
            .channel("tracking")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "participants" },
                (payload) => updateOrAddMarker(payload.new as Participant, participantSource)
            )
            .subscribe();

        return () => {
            map.setTarget(undefined);
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated]); // WICHTIG: Effect hängt jetzt vom Login-Status ab

    const updateOrAddMarker = (p: Participant, source: VectorSource) => {
        if (!p.latitude) return;
        const coords = fromLonLat([p.longitude, p.latitude]);
        const existing = featuresRef.current.get(p.id);

        if (existing) {
            (existing.getGeometry() as Point).setCoordinates(coords);
        } else {
            const feature = new Feature({ geometry: new Point(coords), name: p.name });
            source.addFeature(feature);
            featuresRef.current.set(p.id, feature);
        }
    };

    // --- RENDER ANSICHT 1: LOGIN SCREEN (Ohne Karte) ---
    if (!isAuthenticated) {
        return (
            <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", background: "#f4f6f8", fontFamily: "sans-serif" }}>

                {/* 1. Die Überschriftsleiste */}
                <div style={{
                    background: "#003366", // Dunkelblaues Triathlon-Feeling
                    color: "white",
                    padding: "1.5rem",
                    textAlign: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                }}>
                    <h1 style={{ margin: 0, fontSize: "24px" }}>🏊🚴🏃 Triathlon Tracker Telgte</h1>
                </div>

                {/* 2. Der zentrierte Content */}
                <div style={{
                    flex: 1, // Füllt den Rest der Höhe
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        background: "white",
                        padding: "2.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        width: "90%",
                        maxWidth: "400px",
                        textAlign: "center"
                    }}>
                        <h2 style={{ marginTop: 0, color: "#333" }}>Event Zugang</h2>
                        <p style={{ color: "#666", marginBottom: "20px" }}>Bitte gib den Code ein, um das Live-Tracking zu starten.</p>

                        <input
                            type="text"
                            placeholder="Code eingeben..."
                            value={inputCode}
                            onChange={e => setInputCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "18px",
                                textAlign: "center",
                                borderRadius: "8px",
                                border: "2px solid #ddd",
                                marginBottom: "15px",
                                boxSizing: "border-box",
                                outline: "none"
                            }}
                        />

                        <button
                            onClick={handleLogin}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                background: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "background 0.2s"
                            }}
                        >
                            Starten
                        </button>

                        {errorMsg && (
                            <p style={{ color: "red", marginTop: "15px", fontWeight: "bold" }}>{errorMsg}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER ANSICHT 2: KARTE (Nur wenn eingeloggt) ---
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* Legende */}
            <div style={{
                position: "absolute", bottom: 20, right: 10,
                background: "rgba(255,255,255,0.9)", padding: "12px", borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)", fontSize: "12px", fontFamily: "sans-serif",
                zIndex: 1000
            }}>
                <div style={{marginBottom: 6, fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4}}>Strecken & Punkte:</div>

                {ROUTES_CONFIG.map(r => (
                    <div key={r.label} style={{display: "flex", alignItems: "center", marginTop: 4}}>
                        <span style={{width: 12, height: 4, background: r.color, marginRight: 8, borderRadius: 2}}></span>
                        {r.label}
                    </div>
                ))}

                <div style={{height: 1, background: "#eee", margin: "8px 0"}}></div>

                {POINTS_CONFIG.map(p => (
                    <div key={p.label} style={{display: "flex", alignItems: "center", marginTop: 4}}>
                        <span style={{width: 10, height: 10, background: p.color, marginRight: 8, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)"}}></span>
                        {p.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
