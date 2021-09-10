/**
 * Types and definitions around the Wiener Linien real-time API.
 * Note: Weird or inconsistent notations are mostly 1:1 taken from the original API.
 * For more information: https://www.data.gv.at/katalog/dataset/522d3045-0b37-48d0-b868-57c99726b1c4
 */

export enum VehicleType {
    BUS   = "BUS",
    TRAM  = "TRAM",
    UBAHN = "UBAHN",
}

// These are only the supported stations.
// Wiener Linien's network has over 5,300 stations.
export enum StationKey {
    ASP = "ASP",
    HAU = "HAU",
    NOR = "NOR",
    IBS = "IBS",
    KRG = "KRG",
    SEE = "SEE",
    CTS = "CTS",
    MTP = "MTP",
    HAP = "HAP",
    JKG = "JKG",
}

// These are only keys for supported lines.
// The Wiener Linien operate over 160 lines.
export enum LineKey {
    WL_U2  = "U2",
    WL_98A = "98A",
    WL_97A = "97A",
    WL_93A = "93A",
    WL_89A = "89A",
    WL_88A = "88A",
    WL_88B = "88B",
    WL_84A = "84A",
    WL_26A = "26A",
}

export type MultiModalMapping = {
    [key in StationKey]: string[];
}

export type WayTime = {
    [key in StationKey]: number;
}

interface LineRblMapping {
    line: LineKey;
    rbls: string[];
}

export type StationLineMapping = {
    [key in StationKey]: LineRblMapping[];
};

type DepartureTime = {
    timePlanned: string;
    timeReal: string;
    countdown: number;
}

type Vehicle = {
    name: string;
    towards: string;
    direction: string;
    richtungsId: string;
    barrierFree: boolean;
    realtimeSupported: boolean;
    trafficjam: boolean;
    type: string;
    attributes: any;
    linienId: number;
};

type Departure = {
    departureTime: DepartureTime;
    vehicle?: Vehicle;
}

type Line = {
    name: string;
    towards: string;
    direction: string;
    platform: string;
    richtungsId: string;
    barrierFree: boolean;
    realtimeSupported: boolean;
    trafficjam: boolean;
}

export type MonitorLine = Line & {
    departures: {
        departure: Departure[];
    };
}

export interface Monitor {
    locationStop: {
        type: string;
        geometry: {
            type: string;
            coordinates: number[];
        };
        properties: {
            name: string;
            title: string;
            municipality: string;
            municipalityId: number;
            type: string;
            coordName: string;
            gate: string;
            attributes: any;
        };
    };
    lines: MonitorLine[];
}

export interface StationMonitor {
    data: {
        monitors: Monitor[];
    };
    message: {
        value: string;
        messageCode: number;
        serverTime: string;
    };
}

export type ElevatorInfo = {
    title: string;
    description: string;
    status?: string;
    reason?: string;
}
