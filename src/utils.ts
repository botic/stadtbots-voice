import config from "./config";

import {getLogger} from "./logging";
const log = getLogger();

import {MatomoTracker} from "./matomo";
import {MatomoCustomVariableScope, MatomoService} from "./types/matomo";

const matomo = new MatomoTracker(config.get("matomo.siteId"), config.get("matomo.trackerUrl"));

/**
 * Escapes a string for SSML responses.
 * @param unsafe an unsafe non-escaped string
 */
export function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c: string): string => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return "";
        }
    });
}

/**
 * Tracks an incoming Alexa skill request.
 * @param userId
 * @param category type of tracking event
 * @param action specific action that is taken
 * @param name name of the action being interacted with
 * @param value numeric value such as costs or progress
 */
export function trackAlexa(userId: string, category: string, action: string, name = "", value?: number) {
    matomo.trackEvent(
        MatomoService.Alexa,
        userId,
        {
            category,
            action,
            ...name && {name},
            ...value && {value: `${value}`},
            customVariables: [
                {
                    name: "Voice Platform",
                    value: MatomoService.Alexa,
                    scope: MatomoCustomVariableScope.visit,
                }
            ],
        }
    ).then(() => {
        log.debug(`Tracked Alexa request: ${category} - ${action} - ${name} - ${value}`);
    });
}
