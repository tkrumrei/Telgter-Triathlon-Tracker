// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapConfigProvider, type MapConfig, type MapConfigProviderOptions, SimpleLayer } from "@open-pioneer/map";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import { MAP_ID, PARTICIPANT_LAYER_ID, POINTS_CONFIG, ROUTES_CONFIG } from "./trackerConfig";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            projection: "EPSG:3857",
            initialView: {
                kind: "position",
                center: {
                    x: 866653,
                    y: 6793206
                },
                zoom: 14
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
                ...ROUTES_CONFIG.map((config) => {
                    return layerFactory.create({
                        type: SimpleLayer,
                        id: config.id,
                        title: config.title,
                        attributes: {
                            category: config.category
                        },
                        olLayer: new VectorLayer({
                            source: new VectorSource({
                                url: config.url,
                                format: new GeoJSON({
                                    featureProjection: "EPSG:3857"
                                })
                            }),
                            style: new Style({
                                stroke: new Stroke({
                                    color: config.color,
                                    width: config.width
                                })
                            }),
                            zIndex: 1
                        })
                    });
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
                            zIndex: 50
                        })
                    });
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: PARTICIPANT_LAYER_ID,
                    title: "Teilnehmer",
                    olLayer: new VectorLayer({
                        source: new VectorSource(),
                        zIndex: 100
                    })
                })
            ]
        };
    }
}
