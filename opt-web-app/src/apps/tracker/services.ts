// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    MapConfigProvider,
    type MapConfig,
    type MapConfigProviderOptions,
    SimpleLayer
} from "@open-pioneer/map";
import GeoJSON from "ol/format/GeoJSON";
import GPX from "ol/format/GPX";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import MultiLineString from "ol/geom/MultiLineString";
import Point from "ol/geom/Point";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import {
    ARROW_CONFIG,
    ARROW_OFFSET_METERS,
    MAP_ID,
    PARTICIPANT_LAYER_ID,
    POINTS_CONFIG,
    ROUTES_CONFIG
} from "./trackerConfig";

function createArrowFeatures(
    coordinates: [number, number][],
    spacing: number,
    offsetM: number
): Feature<Point>[] {
    const arrows: Feature<Point>[] = [];
    let accumulatedDistance = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const prev = coordinates[i];
        const curr = coordinates[i + 1];

        if (!prev || !curr) {
            continue;
        }

        const dx = curr[0] - prev[0];
        const dy = curr[1] - prev[1];
        const segDist = Math.sqrt(dx * dx + dy * dy);

        if (segDist === 0) {
            accumulatedDistance += segDist;
            continue;
        }

        while (accumulatedDistance + segDist >= spacing) {
            const needed = spacing - accumulatedDistance;
            const t = needed / segDist;

            const x = prev[0] + dx * t;
            const y = prev[1] + dy * t;

            const bearing = Math.atan2(dy, dx);
            const offBearing = bearing + Math.PI / 2;
            const offX = x + Math.cos(offBearing) * offsetM;
            const offY = y + Math.sin(offBearing) * offsetM;

            const arrowFeature = new Feature<Point>({
                geometry: new Point([offX, offY]),
                bearing: bearing
            });
            arrows.push(arrowFeature);

            accumulatedDistance = accumulatedDistance + segDist - spacing;
        }

        accumulatedDistance += segDist;
    }

    return arrows;
}

function extractCoordinates(geom: LineString | MultiLineString): [number, number][] {
    if (geom instanceof LineString) {
        return geom
            .getCoordinates()
            .map((raw) => [raw[0], raw[1]] as [number, number]);
    }

    return geom
        .getLineStrings()
        .flatMap((lineString) =>
            lineString.getCoordinates().map((raw) => [raw[0], raw[1]] as [number, number])
        );
}

function processGeometry(
    geom: LineString | MultiLineString,
    arrowSpacing: number,
    offsetM: number,
    allArrows: Feature<Point>[]
): void {
    const coordinates = extractCoordinates(geom);

    if (coordinates.length >= 2) {
        const arrows = createArrowFeatures(coordinates, arrowSpacing, offsetM);
        allArrows.push(...arrows);
    }
}

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            projection: "EPSG:3857",
            initialView: {
                kind: "position",
                center: {
                    x: 866500,
                    y: 6796200
                },
                zoom: 14.3
            },
            layers: [
                layerFactory.create({
                    type: SimpleLayer,
                    id: "osm-base",
                    title: "OpenStreetMap",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                ...ROUTES_CONFIG.flatMap((config) => {
                    const isGpx = config.url.endsWith(".gpx");
                    const styleFn = new Style({
                        stroke: new Stroke({
                            color: config.color,
                            width: config.width,
                            lineDash: config.title.includes("Laufen") ? [12, 12] : undefined
                        })
                    });
                    let source: VectorSource;
                    if (isGpx) {
                        source = new VectorSource({
                            format: new GPX(),
                            url: config.url
                        });
                    } else {
                        source = new VectorSource({
                            url: config.url,
                            format: new GeoJSON({
                                featureProjection: "EPSG:3857"
                            })
                        });
                    }

                    let arrowLayer: SimpleLayer | undefined;

                    const arrowSpacing = ARROW_CONFIG[config.id];
                    if (isGpx && arrowSpacing !== undefined) {
                        const arrowSrc = new VectorSource();
                        arrowLayer = layerFactory.create({
                            type: SimpleLayer,
                            id: `${config.id}-arrows`,
                            title: `${config.title} Richtungspfeile`,
                            olLayer: new VectorLayer({
                                source: arrowSrc,
                                style: (feature) => {
                                    const bearing = feature.get("bearing") as number | undefined;
                                    return new Style({
                                        text: new Text({
                                            text: "➔",
                                            font: "bold 16px sans-serif",
                                            rotation: -(bearing ?? 0),
                                            rotateWithView: true,
                                            fill: new Fill({ color: config.color }),
                                            stroke: new Stroke({ color: "#ffffff", width: 2 })
                                        })
                                    });
                                },
                                zIndex: 200
                            })
                        });

                        source.once("addfeature", () => {
                            // GPX lädt typischerweise alle Features sehr schnell;
                            // 500ms warten, um sicherzustellen, dass alles geladen ist.
                            setTimeout(() => {
                                const gpXFeatures = source.getFeatures();
                                const allArrows: Feature<Point>[] = [];
                                for (const feature of gpXFeatures) {
                                    const geom = feature.getGeometry();
                                    if (geom instanceof LineString || geom instanceof MultiLineString) {
                                        processGeometry(
                                            geom,
                                            arrowSpacing,
                                            ARROW_OFFSET_METERS,
                                            allArrows
                                        );
                                    }
                                }
                                if (allArrows.length > 0) {
                                    arrowSrc.addFeatures(allArrows);
                                }
                            }, 500);
                        });
                    }

                    const layers = [
                        layerFactory.create({
                            type: SimpleLayer,
                            id: config.id,
                            title: config.title,
                            attributes: {
                                category: config.category
                            },
                            olLayer: new VectorLayer({
                                source,
                                style: styleFn,
                                zIndex: 20
                            })
                        })
                    ];

                    if (arrowLayer) {
                        layers.push(arrowLayer);
                    }

                    return layers;
                }),
                ...POINTS_CONFIG.map((config) => {
                    return layerFactory.create({
                        type: SimpleLayer,
                        id: config.id,
                        title: config.title,
                        olLayer: new VectorLayer({
                            source: new VectorSource({
                                url: config.url,
                                format: new GeoJSON({
                                    featureProjection: "EPSG:3857"
                                })
                            }),
                            style: new Style({
                                image: new CircleStyle({
                                    radius: config.radius,
                                    fill: new Fill({ color: config.color }),
                                    stroke: new Stroke({ color: "white", width: 3 })
                                }),
                                text: new Text({
                                    text: config.label,
                                    offsetY: 0,
                                    font: "bold 10px sans-serif",
                                    fill: new Fill({ color: config.textColor }),
                                    stroke: new Stroke({ color: config.color, width: 2 })
                                })
                            }),
                            zIndex: 250
                        })
                    });
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: PARTICIPANT_LAYER_ID,
                    title: "Teilnehmer",
                    olLayer: new VectorLayer({
                        source: new VectorSource(),
                        zIndex: 300
                    })
                })
            ]
        };
    }
}
