import axios from "axios";
import config from "../config";
import {getLogger} from "../logging";
import {
    ElevatorInfo,
    LineKey,
    MonitorLine,
    StationMonitor,
} from "../types/wienerlinien";

const log = getLogger();

const WL_API_ENDPOINT_REALTIME = config.get("wienerlinien.monitor");
const WL_API_ENDPOINT_ELEVATOR = config.get("wienerlinien.elevator");

/**
 * @ignore
 */
async function _get<T>(url: string): Promise<T|null> {
    try {
        const response = await axios.get(url, {
            timeout: config.get("wienerlinien.timeout"),
        });

        if (response.status === 200) {
            return response.data as T;
        }
    } catch (e) {
        log.error(`Could not read from URL ${url}: ${e}`);
    }

    return null;
}

/**
 * Calls the Wiener Linien Open Data API for the given RBLs.
 * Please note that API keys are not longer required.
 * @param rbls
 * @see https://www.data.gv.at/katalog/dataset/wiener-linien-echtzeitdaten-via-datendrehscheibe-wien
 */
async function getRealTimeInfo(rbls: string[]): Promise<StationMonitor|null> {
    const url = WL_API_ENDPOINT_REALTIME + "?rbl=" + rbls.map(rbl => encodeURIComponent(rbl)).join("&rbl=");
    const stationMonitor = await _get<StationMonitor>(url);

    if (Array.isArray(stationMonitor?.data?.monitors)) {
        return stationMonitor;
    } else {
        return null;
    }
}

/**
 * @ignore helper function.
 */
function getMonitorLines(obj: any) {
    return obj?.data?.monitors?.map((monitor: any) => {
        return monitor.lines;
    }).flat() || [];
}

/**
 * Maps the Wiener Linien API's line name to the correct line key.
 * @param lineName the line name received in the API response
 */
export function getLineForLineName(lineName: string): LineKey | null {
    switch (lineName) {
        case "U2":
            return LineKey.WL_U2;
        case "26A":
            return LineKey.WL_26A;
        case "84A":
            return LineKey.WL_84A;
        case "88A":
            return LineKey.WL_88A;
        case "88B":
            return LineKey.WL_88B;
        case "89A":
            return LineKey.WL_89A;
        case "93A":
            return LineKey.WL_93A;
        case "97A":
            return LineKey.WL_97A;
        case "98A":
            return LineKey.WL_98A;
    }

    return null;
}

/**
 * Queries the Wiener Linien real-time API for the given RBLs.
 * RBLs are more or less station IDs (Rechnergesteuertes Betriebsleitsystem).
 * @param rbls array of RBL station ids.
 * @see https://www.data.gv.at/katalog/dataset/wiener-linien-echtzeitdaten-via-datendrehscheibe-wien
 */
export async function getStationInfo(rbls: string[]): Promise<Map<LineKey, MonitorLine[]> | null> {
    try {
        const realtimeResponse = await getRealTimeInfo(rbls);
        const monitorLines = getMonitorLines(realtimeResponse).filter((line: any) => {
            // filters nonsense lines which should never land in the public API
            return !line.towards.toLowerCase().includes("nicht einsteigen");
        });

        // Merge lines in different directions together
        const lineMap = new Map<LineKey, MonitorLine[]>();
        for (const monitorLine of monitorLines) {
            const lineKey = getLineForLineName(monitorLine.name);
            if (lineKey === null) {
                log.error(`Could not map Wiener Linien line ${monitorLine.name} to an internal lineKey!`);
                continue;
            }

            const lineBuffer = lineMap.get(lineKey);
            if(lineBuffer !== undefined) {
                lineBuffer.push(monitorLine);
            } else {
                lineMap.set(lineKey, [monitorLine]);
            }
        }
        return lineMap;
    } catch (e) {
        log.error(`Error in Wiener Linien realtime response: ${e}`);
        return null;
    }
}

/**
 * Generates an elevator status text for the given RBLs.
 * RBLs are more or less station IDs (Rechnergesteuertes Betriebsleitsystem).
 * @param rbls array of RBLs
 */
export async function getElevatorInfoText(rbls: string[]): Promise<ElevatorInfo[]> {
    const elevatorInfos = [];

    const infos = await _get(
        WL_API_ENDPOINT_ELEVATOR + "&relatedStop=" + rbls.map(rbl => encodeURIComponent(rbl)).join("&relatedStop="),
    ) as any;

    if (Array.isArray(infos?.data?.trafficInfos) && infos.data.trafficInfos.length > 0) {
        for (const trafficInfo of infos.data.trafficInfos) {
            const info = {
                title: trafficInfo.title || "",
                description: trafficInfo.description || ""
            } as ElevatorInfo;

            if (trafficInfo.attributes) {
                if (typeof trafficInfo.attributes.status === "string") {
                    info.status = trafficInfo.attributes.status;
                }

                if (typeof trafficInfo.attributes.reason === "string") {
                    info.status = trafficInfo.attributes.reason;
                }
            }

            elevatorInfos.push(info);
        }
    }

    return elevatorInfos;
}

/**
 * Prevents weird output because of marketing texts included in the Wiener Linien API responses.
 * @param str the original `towards` API string
 * @see https://twitter.com/botic/status/1133286469630668801
 */
export function improveTowards(str: string): string {
    return str.replace(/ S?U$/, "")
        .replace(/ÖFFIS +NÜTZEN,/, "Karlsplatz")
        .replace(/KLIMA +SCHÜTZEN/, "Karlsplatz")
        .replace("KARLSPLATZ", "Karlsplatz")
        .replace("SEESTADT", "Seestadt")
        .replace("NÄCHSTER ZUG", "Nächster Zug")
        .replace(/ MIN$/, " min")
        .replace(/\s+/g, " ");
}
