import {
    LineKey,
    MultiModalMapping,
    StationKey,
    StationLineMapping,
    VehicleType,
    WayTime,
} from "../types/wienerlinien";
import {Slot} from "ask-sdk-model";

import {getLogger} from "../logging";
const log = getLogger();

/**
 * Public transport mappings for Aspern Seestadt.
 * These are used to look up station metadata and generate outputs.
 */

// Available U-Bahn lines in Aspern Seestadt.
export const UBAHN_LINES = [
    LineKey.WL_U2,
];

// There are no tramlines yet.
export const TRAM_LINES = [];

// Available bus lines in Aspern Seestadt.
export const BUS_LINES = [
    LineKey.WL_26A,
    LineKey.WL_84A,
    LineKey.WL_88A,
    LineKey.WL_88B,
    LineKey.WL_89A,
    LineKey.WL_93A,
    LineKey.WL_97A,
    LineKey.WL_98A,
];

export const SUPPORTED_LINES = [
    ...UBAHN_LINES,
    ...TRAM_LINES,
    ...BUS_LINES,
];

export const SUPPORTED_STATIONS = [
    StationKey.ASP,
    StationKey.HAU,
    StationKey.NOR,
    StationKey.SEE,
    StationKey.CTS,
    StationKey.MTP,
    StationKey.HAP,
    StationKey.JKG,
];

export const ELEVATOR_STATIONS = [
    StationKey.SEE,
    StationKey.NOR,
    StationKey.HAU,
    StationKey.ASP,
];

export const WALKING_DISTANCE_STATIONS = [
    StationKey.JKG,
    StationKey.HAP,
    StationKey.MTP,
];

export const STATION_TO_FLOTTE = {} as MultiModalMapping;
STATION_TO_FLOTTE[StationKey.JKG] = ["10007"];
STATION_TO_FLOTTE[StationKey.HAP] = ["10003"];
STATION_TO_FLOTTE[StationKey.SEE] = ["10000"];

export const STATION_TO_LINES = {} as StationLineMapping;
STATION_TO_LINES[StationKey.ASP] = [
    { line: LineKey.WL_U2 , rbls: ["4251", "4272"] },
    { line: LineKey.WL_93A, rbls: ["8054", "8054"] },
    { line: LineKey.WL_84A, rbls: ["8682"] },
    { line: LineKey.WL_88A, rbls: ["8683", "8683"] },
    { line: LineKey.WL_26A, rbls: ["1024", "1052"] },
    { line: LineKey.WL_97A, rbls: ["8055", "8055"] },
    { line: LineKey.WL_98A, rbls: ["8682", "8682", "2823"] },
    { line: LineKey.WL_89A, rbls: ["8685", "8685"] },
];
STATION_TO_LINES[StationKey.HAU] = [
    { line: LineKey.WL_U2 , rbls: ["4279", "4274"] },
];
STATION_TO_LINES[StationKey.NOR] = [
    { line: LineKey.WL_U2 , rbls: ["4278", "4275"] },
];
STATION_TO_LINES[StationKey.SEE] = [
    { line: LineKey.WL_U2 , rbls: ["4277", "4276"] },
    { line: LineKey.WL_88A, rbls: ["3319"] },
    { line: LineKey.WL_88B, rbls: ["3319"] },
    { line: LineKey.WL_84A, rbls: ["3365"] },
];
STATION_TO_LINES[StationKey.CTS] = [
    { line: LineKey.WL_88A, rbls: ["3320", "3323"] },
    { line: LineKey.WL_88B, rbls: ["3320", "3323"] },
];
STATION_TO_LINES[StationKey.MTP] = [
    { line: LineKey.WL_84A, rbls: ["3358", "3364"] },
];
STATION_TO_LINES[StationKey.HAP] = [
    { line: LineKey.WL_84A, rbls: ["3359", "3363"] },
];
STATION_TO_LINES[StationKey.JKG] = [
    { line: LineKey.WL_84A, rbls: ["3360", "3362"] },
];

// Travel time for passengers using the line 84A to the U2 platform.
export const BUS_RIDE_TO_SEESTADT = {} as WayTime;
BUS_RIDE_TO_SEESTADT[StationKey.JKG] = 7;
BUS_RIDE_TO_SEESTADT[StationKey.HAP] = 6;
BUS_RIDE_TO_SEESTADT[StationKey.MTP] = 3;

// Walking time from a bus station to the U2 platform.
export const WALKING_TIME_TO_SEESTADT = {} as WayTime;
WALKING_TIME_TO_SEESTADT[StationKey.JKG] = 12;
WALKING_TIME_TO_SEESTADT[StationKey.HAP] = 9;
WALKING_TIME_TO_SEESTADT[StationKey.MTP] = 5;

// Travel time ("penalty") for the round trip U2 Seestadt => Aspern Nord => Hausfeldstrasse => Aspernstrasse
export const U2_CIRCLE_PENALTY_TIME = 4;

/**
 * Returns the RBLs (~ station IDs) for a given station. A station can have multiple RBLs,
 * e.g. one RBL for a line at a station. If only some RBLs should be selected,
 * an optional line filter can be provided.
 * @param station station to look up
 * @param lines optional filter to return only RBLs for the given lines
 * @see https://www.data.gv.at/katalog/dataset/522d3045-0b37-48d0-b868-57c99726b1c4
 */
export function getRblsForStation(station: StationKey, lines?: LineKey[]): string[] {
    const stationLines = STATION_TO_LINES[station];

    if (!stationLines) {
        throw Error(`Station '${station}' has no mapping to lines.`);
    }

    const rbls = [];
    for (const lineInfo of stationLines) {
        if (lines && !lines.includes(lineInfo.line)) {
            continue;
        }

        rbls.push(...lineInfo.rbls);
    }

    return rbls;
}

/**
 * Returns a speakable station name.
 * @param station key of the station
 */
export function getStationName(station: StationKey) {
    switch (station) {
        case StationKey.ASP: return "Aspernstraße";
        case StationKey.HAU: return "Hausfeldstraße";
        case StationKey.NOR: return "Aspern Nord";
        case StationKey.SEE: return "Seestadt";
        case StationKey.CTS: return "Christine-Touaillon-Straße";
        case StationKey.MTP: return "Maria-Trapp-Platz";
        case StationKey.HAP: return "Hannah-Arendt-Platz";
        case StationKey.JKG: return "Johann-Kutschera-Gasse";
    }
}

/**
 * Extract a station key in a given string. Since NLU might be not accurate,
 * also variants and flawed recognitions will be tried.
 */
function extractStation(text: string, enableSeestadt= true): StationKey|null {
    if (/^aspernstra(ss|ß)e$/i.test(text)) {
        return StationKey.ASP;
    } else if (/^hausfeldstra(ss|ß)e$/i.test(text)) {
        return StationKey.HAU;
    } else if (/^(aspern )?nord$/i.test(text)) {
        return StationKey.NOR;
    } else if (/^hann?ah?[ -]ah?ren(d|dt|t|tt)([ -]platz)?$/i.test(text)) {
        return StationKey.HAP;
    } else if (/^johann[- ]?kutschera([- ]?(gasse|stra(ss|ß)e))?$/i.test(text)) {
        return StationKey.JKG;
    } else if (/^maria[- ]?trapp([- ]?platz)?$/i.test(text)) {
        return StationKey.MTP;
    } else if (/^christine[- ]?touaillon([- ]?(gasse|stra(ss|ß)e))?$/i.test(text)) {
        return StationKey.CTS;
    } else if (enableSeestadt && /^seestadt$/i.test(text)) {
        return StationKey.SEE;
    }

    // looser matching with real names
    if (/^hann?ah?[ -]/i.test(text)) {
        return StationKey.HAP;
    } else if (/^johann[ -]/i.test(text)) {
        return StationKey.JKG;
    } else if (/^christine[- ]?/i.test(text)) {
        return StationKey.CTS;
    } else if (/^haus[ -]?felds/i.test(text)) {
        return StationKey.HAU;
    }

    // try weird Alexa NLU words
    if (/(q terrasse|gute radar|küche radar|foodora das|butter gast|gottschalk|code straße)/i) {
        return StationKey.JKG;
    }

    log.info(`Could not extract a station in string '${text}'`);
    return null;
}

/**
 * Extracts a station key in the "stationName" slot.
 * @param slot
 * @param enableSeestadt adds end station "Seestadt" to the possible values
 */
export function slotToStation(slot: Slot, enableSeestadt = true): StationKey|null {
    // First check any Alexa-provided resolutions.
    if (slot.resolutions) {
        const resolution = slot.resolutions.resolutionsPerAuthority?.find(resolution => {
           return resolution.status.code === "ER_SUCCESS_MATCH" && resolution.values.length === 1;
        });

        if (resolution) {
            const slotValue = resolution.values[0]?.value?.id;
            if (slotValue?.length === 3) {
                switch (slotValue) {
                    case "ASP": return StationKey.ASP;
                    case "HAU": return StationKey.HAU;
                    case "NOR": return StationKey.NOR;
                    case "SEE": return StationKey.SEE;
                    case "CTS": return StationKey.CTS;
                    case "MTP": return StationKey.MTP;
                    case "HAP": return StationKey.HAP;
                    case "JKG": return StationKey.JKG;
                }
            }
        }
    }

    return slot.value ? extractStation(slot.value, enableSeestadt) : null;
}

/**
 * Maps a slot value to a vehicle type (bus, tram, U-Bahn).
 * @param slot
 */
export function slotToVehicleType(slot: Slot): VehicleType|null {
    if (slot.resolutions) {
        const resolution = slot.resolutions.resolutionsPerAuthority?.find(resolution => {
            return resolution.status.code === "ER_SUCCESS_MATCH" && resolution.values.length === 1;
        });

        if (resolution) {
            const slotValue = resolution.values[0]?.value?.id;
            switch (slotValue) {
                case "BUS": return VehicleType.BUS;
                case "TRAM": return VehicleType.TRAM;
                case "UBAHN": return VehicleType.UBAHN;
            }
        }
    }

    return null;
}
