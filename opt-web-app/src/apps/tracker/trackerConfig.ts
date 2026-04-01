// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

export const MAP_ID = "tracker-main-map";

export const PARTICIPANT_LAYER_ID = "participants";

export const COLORS = {
    swim: "#5485f4",
    bike: "#f06c00",
    run: "#f153d5"
} as const;

export type DistanceFilter = "all" | "volks" | "olymp";

export type DistanceCategory = Exclude<DistanceFilter, "all">;

export interface ScheduleEntry {
    distanz: DistanceCategory;
    startTime: string;
    bikeArrivalEstimate: string;
    finishArrivalEstimate: string;
}

export interface FinisherEntry {
    name: string;
    distanz: DistanceCategory;
    finishTime: string;
    year: number;
    teilnahmen: number;
}

export type RouteCategory = "common" | "volks" | "olymp";

export const ROUTES_CONFIG: ReadonlyArray<{
    id: string;
    title: string;
    url: string;
    color: string;
    width: number;
    category: RouteCategory;
}> = [
    {
        id: "route-swim",
        title: "Schwimmen",
        url: "routes/Strecke_Schwimmen.json",
        color: COLORS.swim,
        width: 4,
        category: "common"
    },
    {
        id: "route-bike-volks",
        title: "Radfahren Volks",
        url: "routes/Strecke_Fahrrad_Volks.json",
        color: COLORS.bike,
        width: 4,
        category: "volks"
    },
    {
        id: "route-run-volks",
        title: "Laufen Volks",
        url: "routes/Strecke_Laufen_Volks.json",
        color: COLORS.run,
        width: 4,
        category: "volks"
    },
    {
        id: "route-bike-olymp",
        title: "Radfahren Olymp",
        url: "routes/Strecke_Fahrrad_Olymp.json",
        color: COLORS.bike,
        width: 4,
        category: "olymp"
    },
    {
        id: "route-run-olymp",
        title: "Laufen Olymp",
        url: "routes/Strecke_Laufen_Olymp.json",
        color: COLORS.run,
        width: 4,
        category: "olymp"
    }
];

export const LEGEND_ITEMS = [
    { label: "Schwimmen", color: COLORS.swim },
    { label: "Radfahren", color: COLORS.bike },
    { label: "Laufen", color: COLORS.run }
] as const;

export const SCHEDULE_TIMES: ReadonlyArray<ScheduleEntry> = [
    {
        distanz: "volks",
        startTime: "08:30",
        bikeArrivalEstimate: "09:30",
        finishArrivalEstimate: "10:00"
    },
    {
        distanz: "olymp",
        startTime: "08:15",
        bikeArrivalEstimate: "10:00",
        finishArrivalEstimate: "11:00"
    }
];

export const FINISHERS: ReadonlyArray<FinisherEntry> = [
    {
        name: "Renè S.",
        distanz: "olymp",
        finishTime: "",
        year: 2024,
        teilnahmen: 2
    },
    {
        name: "Stian H.",
        distanz: "olymp",
        finishTime: "",
        year: 2024,
        teilnahmen: 1
    },
    {
        name: "Johannes W.",
        distanz: "olymp",
        finishTime: "",
        year: 2024,
        teilnahmen: 1
    },
    {
        name: "Tobias K.",
        distanz: "olymp",
        finishTime: "",
        year: 2024,
        teilnahmen: 1
    },
    {
        name: "Niklas K.",
        distanz: "olymp",
        finishTime: "",
        year: 2025,
        teilnahmen: 1
    },
    {
        name: "Zacharias S.",
        distanz: "olymp",
        finishTime: "",
        year: 2025,
        teilnahmen: 1
    },
    {
        name: "Tim L.",
        distanz: "olymp",
        finishTime: "",
        year: 2025,
        teilnahmen: 1
    },
    {
        name: "Dominic K.",
        distanz: "olymp",
        finishTime: "",
        year: 2024,
        teilnahmen: 1
    }
];

export const POINTS_CONFIG: ReadonlyArray<{
    id: string;
    title: string;
    url: string;
    label: string;
    color: string;
    textColor: string;
    radius: number;
}> = [
    {
        id: "point-start",
        title: "Start",
        url: "points/start_point.json",
        label: "START",
        color: "#049c04",
        textColor: "#ffffff",
        radius: 10
    },
    {
        id: "point-end",
        title: "Ziel",
        url: "points/end_point.json",
        label: "ZIEL",
        color: "#e6b800",
        textColor: "#ffffff",
        radius: 10
    }
];
