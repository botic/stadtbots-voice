import {improveTowards} from "./services/wienerlinien";
import {DualResponse} from "./types/skill-responses";
import {
    getStationName,
    SUPPORTED_LINES,
} from "./services/wienerlinien-seestadt";
import {
    LineKey,
    MonitorLine,
    StationKey,
} from "./types/wienerlinien";
import {OpeningHours} from "@stadtkatalog/openinghours";
import {WeekdayFormat} from "@stadtkatalog/openinghours/lib/types";
import {EntryData} from "@stadtkatalog/stadtkatalog/lib/types";
import {escapeXml} from "./utils";

/**
 * Transforms a Wiener Linien real time response into a speakable text.
 * @param station the station's key
 * @param stationInfo real-time API information for the given station
 */
export function generateStationInfo(station: StationKey, stationInfo: Map<LineKey, MonitorLine[]>): DualResponse {
    const singleLineStation = stationInfo.size === 1;
    const textLines = [];
    const cardLines = [];

    if (!singleLineStation) {
        textLines.push(`Station ${getStationName(station)}`);
    }

    for (const [line, monitor] of stationInfo.entries()) {
        if (!SUPPORTED_LINES.includes(line)) {
            continue;
        }

        if (monitor.length === 0) {
            textLines.push(`Für die Linie ${line} sind keine Daten verfügbar.`);
            cardLines.push(`Für die Linie ${line} sind keine Daten verfügbar.`);
        } else {
            const lineName = monitor[0]?.name;
            const lineAnnouncements = [];
            for (const monitorEntry of monitor) {
                if (monitorEntry?.departures?.departure?.length > 0) {
                    const towards = improveTowards(monitorEntry.towards);
                    const departures = monitorEntry.departures.departure
                        .slice(0, 2)
                        .map(departure => departure?.departureTime?.countdown)
                        .filter(countdown => Number.isInteger(countdown) && countdown >= 0)
                        .map(countdown => countdown === 0
                            ? "jetzt"
                            : countdown === 1
                                ? "in einer Minute"
                                : `in ${countdown} Minuten`
                        );

                    lineAnnouncements.push(
                        (singleLineStation ? "" : `Linie ${lineName} `) +
                        `Richtung ${escapeXml(towards)} fährt ${departures.join(" und ")}.`
                    );
                }
            }

            const lineText = (singleLineStation ? `Linie ${lineName} ${getStationName(station)} ` : "") + lineAnnouncements.join(" ");
            textLines.push(lineText);
            cardLines.push(lineText);
        }
    }

    return {
        text: textLines.join(" "),
        card: {
            title: `${getStationName(station)}`,
            content: cardLines.join("\n\n"),
        }
    }
}

/**
 * Transforms a StadtKatalog entry's opening hours into a speakable string.
 * @param entryData
 * @see https://www.npmjs.com/package/@stadtkatalog/openinghours
 */
export function generateOpeningHours(entryData: EntryData): string {
    const texts = [];
    const hours = new OpeningHours(entryData.hours, "Europe/Vienna");
    if (hours.isUnknown()) {
        if (entryData.hoursRemark !== "") {
            texts.push(`${escapeXml(entryData.name)} hat folgenden Hinweis zu den Öffnungezeiten: ${escapeXml(entryData.hoursRemark)}`);
        } else {
            texts.push(`Es sind keine Öffnungszeiten für ${escapeXml(entryData.name)} hinterlegt.`);
        }
    } else {
        const foldedHours = hours
            .fold({
                closedPlaceholder: "geschlossen",
                delimiter: " und von ",
                holidayPrefix: "Feiertags",
                hyphen: " bis ",
                locale: "de-AT",
                timeFrameDelimiter: " und ",
                timeFrameFormat: "von {start} bis {end}",
                weekdayFormat: WeekdayFormat.long
            })
            .replace(/: /g, " ")
            .replace(/\n/g, ". ")
        ;

        texts.push(`Öffnungszeiten für ${escapeXml(entryData.name)}: ${escapeXml(foldedHours)}.`);
        if(entryData.hoursRemark !== "") {
            texts.push(`Hinweis: ${escapeXml(entryData.hoursRemark)}`);
        }
    }

    return texts.join(" ");
}
