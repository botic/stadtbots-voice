import {createHash} from "crypto";
import axios from "axios";
import config from "./config";

import {
    MatomoCustomVariable,
    MatomoCustomVariableScope, MatomoService,
    MatomoTrackingEvent,
} from "./types/matomo";

import {getLogger} from "./logging";
const log = getLogger();

/* @ignore */
interface MatomoClientOptions {
    rec: number;
    apiv: string;
}

/**
 * A simple client to send tracking requests to a Matomo (formerly known as Piwik) instance.
 * @see https://matomo.org/
 */
export class MatomoTracker {
    #siteId: number;
    #trackerUrl: string;
    #defaultOption: MatomoClientOptions;

    /**
     * Creates a new client instance.
     * @param siteId the unique website / product id where each event will be added
     * @param trackerUrl the full tracker URL including the PHP script
     * @param options additional default options to use as query parameters in tracking requests
     */
    constructor(siteId: number, trackerUrl: string, options?: MatomoClientOptions) {
        this.#siteId = siteId;
        this.#trackerUrl = trackerUrl;
        this.#defaultOption = Object.assign({}, {
            rec: 1,
            apiv: "1",
        }, options);
    }

    /**
     * Takes a custom variable array and serializes it into the form required by Matomo.
     * Matomo can only track five variables per scope per tracking event.
     * If the array contains more than five variables of the same scope, overflowing variables will be dropped.
     * @param customVariables an array of custom variables
     * @param scope which variables should be serialized, since array can contain page or visit variables
     * @see https://matomo.org/docs/custom-variables/
     */
    static serializeCustomVariables(customVariables: MatomoCustomVariable[], scope: MatomoCustomVariableScope): object {
        const reducedVariables = customVariables
            .filter(rawVar => rawVar.scope === scope)
            .slice(0, 5)
            .map((rawVar) => [
                rawVar.name,
                rawVar.value,
            ]) as [[string, string]];

        let cvarCount = 1;
        const cvar = {} as {[key: string]: [string, string]};
        for (const variable of reducedVariables) {
            cvar[`${cvarCount}`] = variable;
            cvarCount++;
        }

        return cvar;
    };

    /**
     * Creates a sha256 hashed UID for the given context.
     */
    static hashUserId(service: MatomoService, userId: string, asHex=false): string {
        return createHash("sha256")
            .update(
                config.get(`matomo.salt`) +
                service +
                userId,
                "utf8",
            ).digest(asHex ? "hex" : "base64");
    }

    /**
     * Sends a tracking request to the Matomo instance.
     * @param params tracking parameters which will be serialized in the query string
     * @see https://developer.matomo.org/api-reference/tracking-api
     */
    private async track(params: object): Promise<boolean> {
        try {
            const requestParams = Object.assign({}, params, {
                idsite: this.#siteId,
            });
            await axios.get(this.#trackerUrl, {
                params: requestParams,
            });
            return true;
        } catch (e) {
            log.warn(`Could not track to Matomo: ${e}`);
        }

        return false;
    }

    /**
     * Tracks an event to Matomo.
     * @param service the voice service used by the user
     * @param userId a unique user id
     * @param event the event data, `category` and `action` properties are required
     */
    async trackEvent(service: MatomoService, userId: string, event: MatomoTrackingEvent): Promise<boolean> {
        if (!event.category || !event.action) {
            throw TypeError("Invalid event: 'category' and 'action' are required.");
        }

        // re-format custom events into Matomo's data structure
        const _cvar = MatomoTracker.serializeCustomVariables(event.customVariables, MatomoCustomVariableScope.visit);
        const cvar = MatomoTracker.serializeCustomVariables(event.customVariables, MatomoCustomVariableScope.page);

        const params = Object.assign({}, this.#defaultOption, {
            ua: service,
            cvar: JSON.stringify(cvar),
            _cvar: JSON.stringify(_cvar),
            uid: MatomoTracker.hashUserId(service, userId, false),
            _id: MatomoTracker.hashUserId(service, userId, true).substr(0, 16),
            e_c: event.category,
            e_a: event.action,
            ...event.name && { e_n: event.name },
            ...event.value && { e_v: event.value },
        });
        return this.track(params);
    }
}
