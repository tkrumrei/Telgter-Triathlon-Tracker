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

// --- ROUTEN KONFIGURATION (JETZT MIT URLs) ---
// Da die Dateien in "public/routes" liegen, ist die URL im Browser einfach "routes/..."
const ROUTES_CONFIG = [
    { url: "routes/Strecke_Schwimmen.json", color: "#5485f4", width: 4, label: "Schwimmen" },
    { url: "routes/Strecke_Fahrrad_Volks.json", color: "#f06c00", width: 4, label: "Rad Volks" },
    { url: "routes/Strecke_Laufen_Volks.json", color: "#f153d5", width: 4, label: "Lauf Volks" },
    { url: "routes/Strecke_Fahrrad_Olymp.json", color: "#f06c00", width: 4, label: "Rad Olymp" },
    { url: "routes/Strecke_Laufen_Olymp.json", color: "#f153d5", width: 4, label: "Lauf Olymp" }
];

export function AppUI() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const mapRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef(new Map<string, Feature>());

    const handleLogin = () => {
        if (inputCode === EVENT_CODE) {
            setIsAuthenticated(true);
        } else {
            setErrorMsg("Falscher Code!");
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !mapRef.current || !supabase) return;

        // A. LAYER FÜR TEILNEHMER
        const participantSource = new VectorSource();
        const participantLayer = new VectorLayer({
            source: participantSource,
            zIndex: 99,
            style: (feature) => new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color: "white" }),
                    stroke: new Stroke({ color: "black", width: 2 }),
                }),
                text: new Text({
                    text: feature.get("name"),
                    offsetY: -16,
                    font: "bold 14px Roboto, sans-serif",
                    fill: new Fill({ color: "#000" }),
                    stroke: new Stroke({ color: "#fff", width: 3 }),
                })
            })
        });

        // B. LAYERS FÜR DIE STRECKEN (Über URL laden)
        const routeLayers = ROUTES_CONFIG.map(config => {
            return new VectorLayer({
                source: new VectorSource({
                    // WICHTIG: Hier sagen wir OpenLayers, wo die Datei liegt
                    url: config.url,
                    // Und sagen dazu, dass es GeoJSON ist
                    format: new GeoJSON()
                }),
                style: new Style({
                    stroke: new Stroke({
                        color: config.color,
                        width: config.width,
                    })
                }),
                zIndex: 1
            });
        });

        // C. KARTE INITIALISIEREN
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                ...routeLayers,
                participantLayer
            ],
            controls: defaultControls({ zoom: false }),
            view: new View({
                center: fromLonLat([7.859806807252341, 51.97351016720559]), // Telgte Zentrum
                zoom: 13.5,
            }),
        });

        // D. DATEN LADEN & LIVE UPDATES
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
    }, [isAuthenticated]);

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

    if (!isAuthenticated) {
        return (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0f0f0", fontFamily: "sans-serif" }}>
                <div style={{ background: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
                    <h2>🏊🚴🏃 Triathlon Tracker</h2>
                    <input
                        type="text"
                        placeholder="Event Code"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        style={{ padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc", margin: "10px 0", width: "200px" }}
                    />
                    <br/>
                    <button onClick={handleLogin} style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}>
                        Starten
                    </button>
                    {errorMsg && <p style={{ color: "red", marginTop: "10px" }}>{errorMsg}</p>}
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            <div style={{
                position: "absolute", bottom: 20, right: 10,
                background: "rgba(255,255,255,0.9)", padding: "10px", borderRadius: "5px",
                boxShadow: "0 0 5px rgba(0,0,0,0.2)", fontSize: "12px", fontFamily: "sans-serif"
            }}>
                <div style={{marginBottom: 4}}><b>Strecken:</b></div>
                {ROUTES_CONFIG.map(r => (
                    <div key={r.label} style={{display: "flex", alignItems: "center", marginTop: 2}}>
                        <span style={{width: 10, height: 10, background: r.color, marginRight: 5, borderRadius: "50%"}}></span>
                        {r.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
