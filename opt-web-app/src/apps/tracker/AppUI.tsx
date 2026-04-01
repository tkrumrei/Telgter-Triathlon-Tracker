// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { createClient } from "@supabase/supabase-js";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style, Text as OlText } from "ol/style";
import "ol/ol.css";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
    type DistanceFilter,
    MAP_ID,
    PARTICIPANT_LAYER_ID,
    ROUTES_CONFIG
} from "./trackerConfig";
import { DistancePanel, LoginScreen, ParticipantsPanel, TrackerHeader } from "./ui";
import type { PanelParticipant } from "./ui/ParticipantsPanel";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const EVENT_CODE = import.meta.env.VITE_EVENT_CODE;

const LOGIN_DURATION = 1000 * 60 * 10;
const STORAGE_KEY = "tri_login_timestamp";
const MARKER_TIMEOUT = 1000 * 60 * 30;
const MARKER_CLEANUP_INTERVAL = 60000;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface Participant {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    last_updated: string;
    distanz: string;
}

type ParticipantFeature = Feature<Point>;
type ParticipantFeatureMap = Map<string, ParticipantFeature>;
type ActiveParticipantMap = Map<string, PanelParticipant & { latitude: number; longitude: number }>;

interface FollowableParticipant extends PanelParticipant {
    latitude: number;
    longitude: number;
}

function getParticipantStyle(name: string, distanzRaw: string): Style {
    const d = distanzRaw ? distanzRaw.toLowerCase() : "";
    const isVolks = d.includes("volks") || d === "v";

    const fillColor = isVolks ? "#ffffff" : "#bedeff";
    const strokeColor = isVolks ? "#000000" : "#203e98";
    const textColor = isVolks ? "#000000" : "#213980";
    const textStroke = isVolks ? "#ffffff" : "#bedeff";

    return new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: strokeColor, width: 3 })
        }),
        text: new OlText({
            text: name,
            offsetY: -12,
            font: "bold 12px Roboto, sans-serif",
            fill: new Fill({ color: textColor }),
            stroke: new Stroke({ color: textStroke, width: 2 })
        })
    });
}

function hasOlLayer(layer: unknown): layer is { olLayer: BaseLayer } {
    if (!layer || typeof layer !== "object") {
        return false;
    }

    return "olLayer" in layer;
}

function matchesDistanceFilter(distanzRaw: string, filter: DistanceFilter): boolean {
    if (filter === "all") {
        return true;
    }

    const normalized = distanzRaw.toLowerCase();
    if (filter === "volks") {
        return normalized.includes("volks") || normalized === "v";
    }

    return normalized.includes("olymp") || normalized === "o";
}

function applyRouteFilter(mapModel: { layers: { getLayerById: (id: string) => unknown } }, filter: DistanceFilter): void {
    ROUTES_CONFIG.forEach((config) => {
        const layer = mapModel.layers.getLayerById(config.id);
        if (!hasOlLayer(layer)) {
            return;
        }

        const shouldHighlight =
            config.category === "common" || filter === "all" || filter === config.category;
        layer.olLayer.setOpacity(shouldHighlight ? 1 : 0.25);
    });
}

function applyParticipantFilter(features: ParticipantFeatureMap, filter: DistanceFilter): void {
    features.forEach((feature) => {
        const distanzRaw = String(feature.get("distanz") ?? "");
        const name = String(feature.get("name") ?? "");
        const isVisible = matchesDistanceFilter(distanzRaw, filter);

        if (isVisible) {
            feature.setStyle(getParticipantStyle(name, distanzRaw));
            return;
        }

        feature.setStyle(new Style({}));
    });
}

function resolveParticipantSource(mapModel: { layers: { getLayerById: (id: string) => unknown } }): VectorSource | null {
    const participantLayer = mapModel.layers.getLayerById(PARTICIPANT_LAYER_ID);
    if (!hasOlLayer(participantLayer)) {
        return null;
    }

    const olLayer = participantLayer.olLayer;
    if (!(olLayer instanceof VectorLayer)) {
        return null;
    }

    const source = olLayer.getSource();
    if (!(source instanceof VectorSource)) {
        return null;
    }

    return source;
}

export function AppUI() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (!EVENT_CODE) {
            return true;
        }

        const storedTimestamp = localStorage.getItem(STORAGE_KEY);
        if (!storedTimestamp) {
            return false;
        }

        const lastLogin = parseInt(storedTimestamp, 10);
        return Date.now() - lastLogin < LOGIN_DURATION;
    });

    const [activeFilter, setActiveFilter] = useState<DistanceFilter>("all");
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] = useState(false);
    const [followedParticipantId, setFollowedParticipantId] = useState<string | null>(null);
    const [activeParticipants, setActiveParticipants] = useState<FollowableParticipant[]>([]);
    const [inputCode, setInputCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const featuresRef = useRef<ParticipantFeatureMap>(new Map<string, ParticipantFeature>());
    const participantDataRef = useRef<ActiveParticipantMap>(new Map<string, FollowableParticipant>());
    const followedParticipantIdRef = useRef<string | null>(null);

    const mapState = useMapModel(MAP_ID);
    const mapModel = mapState.map;

    const handleLogin = () => {
        if (inputCode === EVENT_CODE) {
            setIsAuthenticated(true);
            setErrorMsg("");
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
            return;
        }

        setErrorMsg("❌ Ungültiger Code");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    const centerMapOnParticipant = useCallback(
        (participant: FollowableParticipant, animationDuration = 350) => {
            if (!mapModel) {
                return;
            }

            mapModel.olView.animate({
                center: fromLonLat([participant.longitude, participant.latitude]),
                duration: animationDuration
            });
        },
        [mapModel]
    );

    const handleFollowParticipant = (participantId: string) => {
        const participant = participantDataRef.current.get(participantId);
        if (!participant) {
            return;
        }

        setFollowedParticipantId(participantId);
        centerMapOnParticipant(participant, 450);
    };

    const handleStopFollowing = () => {
        setFollowedParticipantId(null);
    };

    const openDistancePanel = () => {
        setIsParticipantsPanelOpen(false);
        setIsPanelOpen(true);
    };

    const openParticipantsPanel = () => {
        setIsPanelOpen(false);
        setIsParticipantsPanelOpen(true);
    };

    useEffect(() => {
        followedParticipantIdRef.current = followedParticipantId;
    }, [followedParticipantId]);

    useEffect(() => {
        if (!isAuthenticated || !supabase || !mapModel) {
            return;
        }

        const participantSource = resolveParticipantSource(mapModel);
        if (!participantSource) {
            return;
        }
        const features = featuresRef.current;
        const participantData = participantDataRef.current;

        const syncParticipantState = () => {
            const sortedParticipants = Array.from(participantData.values()).sort((left, right) =>
                left.name.localeCompare(right.name, "de")
            );
            setActiveParticipants(sortedParticipants);
        };

        localStorage.setItem(STORAGE_KEY, Date.now().toString());

        const removeParticipantFeature = (participantId: string) => {
            const feature = participantSource.getFeatureById(participantId);
            if (feature) {
                participantSource.removeFeature(feature);
            }
            features.delete(participantId);
            participantData.delete(participantId);
            syncParticipantState();
            setFollowedParticipantId((currentId) => (currentId === participantId ? null : currentId));
        };

        const updateOrAddMarker = (participant: Participant) => {
            const { id, latitude, longitude, last_updated, name, distanz } = participant;

            if (!latitude || !longitude) {
                return;
            }

            const lastUpdate = last_updated ? new Date(last_updated).getTime() : 0;
            const isTooOld = Date.now() - lastUpdate > MARKER_TIMEOUT;
            if (isTooOld) {
                removeParticipantFeature(id);
                return;
            }

            participantData.set(id, {
                id,
                name,
                distanz,
                latitude,
                longitude,
                lastUpdatedTs: lastUpdate
            });
            syncParticipantState();

            if (followedParticipantIdRef.current === id) {
                centerMapOnParticipant(
                    {
                        id,
                        name,
                        distanz,
                        latitude,
                        longitude,
                        lastUpdatedTs: lastUpdate
                    },
                    250
                );
            }

            const existingFeature = participantSource.getFeatureById(id);
            const coords = fromLonLat([longitude, latitude]);
            const style = getParticipantStyle(name, distanz);

            if (existingFeature) {
                const geometry = existingFeature.getGeometry();
                if (geometry instanceof Point) {
                    geometry.setCoordinates(coords);
                }
                existingFeature.set("last_updated_ts", lastUpdate);
                existingFeature.set("distanz", distanz);
                existingFeature.setStyle(style);
                features.set(id, existingFeature as ParticipantFeature);
                return;
            }

            const feature = new Feature<Point>({
                geometry: new Point(coords),
                name
            });
            feature.setId(id);
            feature.set("last_updated_ts", lastUpdate);
            feature.set("distanz", distanz);
            feature.setStyle(style);

            participantSource.addFeature(feature);
            features.set(id, feature);
        };

        const cleanupStaleMarkers = () => {
            const now = Date.now();
            features.forEach((feature, id) => {
                const ts = feature.get("last_updated_ts");
                if (typeof ts !== "number") {
                    return;
                }
                if (now - ts > MARKER_TIMEOUT) {
                    removeParticipantFeature(id);
                }
            });
        };

        const fetchInitialData = async () => {
            const { data } = await supabase.from("participants").select("*");
            if (!data) {
                return;
            }
            data.forEach((entry) => updateOrAddMarker(entry as unknown as Participant));
        };

        void fetchInitialData();

        const channel = supabase
            .channel("tracking")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "participants" },
                (payload) => updateOrAddMarker(payload.new as Participant)
            )
            .subscribe();

        const cleanupInterval = setInterval(cleanupStaleMarkers, MARKER_CLEANUP_INTERVAL);

        return () => {
            clearInterval(cleanupInterval);
            void supabase.removeChannel(channel);
            participantSource.clear();
            features.clear();
            participantData.clear();
            setActiveParticipants([]);
        };
    }, [centerMapOnParticipant, isAuthenticated, mapModel]);

    useEffect(() => {
        if (!isAuthenticated || !mapModel) {
            return;
        }

        applyRouteFilter(mapModel, activeFilter);
        applyParticipantFilter(featuresRef.current, activeFilter);
    }, [activeFilter, isAuthenticated, mapModel]);

    const participantsForPanel = activeParticipants.filter((participant) =>
        matchesDistanceFilter(participant.distanz, activeFilter)
    );

    if (!isAuthenticated) {
        return (
            <LoginScreen
                inputCode={inputCode}
                errorMsg={errorMsg}
                onCodeChange={setInputCode}
                onKeyDown={handleKeyDown}
                onLogin={handleLogin}
            />
        );
    }

    return (
        <Flex className="tracker-main-root" direction="column" w="100%" h="100%">
            <TrackerHeader />

            <Box flex="1" position="relative">
                {mapModel ? (
                    <MapContainer map={mapModel}>
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <VStack align="start" gap="2">
                                <DistancePanel
                                    isOpen={isPanelOpen}
                                    activeFilter={activeFilter}
                                    onOpen={openDistancePanel}
                                    onClose={() => setIsPanelOpen(false)}
                                    onSelectFilter={setActiveFilter}
                                />

                                <ParticipantsPanel
                                    isOpen={isParticipantsPanelOpen}
                                    participants={participantsForPanel}
                                    followedParticipantId={followedParticipantId}
                                    onOpen={openParticipantsPanel}
                                    onClose={() => setIsParticipantsPanelOpen(false)}
                                    onFollowParticipant={handleFollowParticipant}
                                    onStopFollowing={handleStopFollowing}
                                />
                            </VStack>
                        </MapAnchor>
                    </MapContainer>
                ) : (
                    <Flex className="tracker-map-loading" w="100%" h="100%" align="center" justify="center" bg="#eef2f5" color="#234">
                        <Text className="tracker-map-loading-text" fontWeight="bold">Karte wird geladen ...</Text>
                    </Flex>
                )}
            </Box>
        </Flex>
    );
}
