import {
    ErrorHandler,
    getSlot,
    HandlerInput,
    RequestHandler,
    SkillBuilders,
} from "ask-sdk-core";
import {
    Response,
    SessionEndedRequest,
} from "ask-sdk-model";

import config from "../config";
import {getLogger} from "../logging";

import {
    slotToStation,
    slotToVehicleType,
    BUS_LINES,
    STATION_TO_LINES,
    UBAHN_LINES,
} from "../services/wienerlinien-seestadt";
import {
    StationKey,
    VehicleType,
} from "../types/wienerlinien";
import {getStationInfo} from "../services/wienerlinien";

import {GeoFence} from "../types/stadtkatalog";
import {shopNameSlotToEntryData} from "../services/stadtkatalog";

import {
    generateOpeningHours,
    generateStationInfo,
} from "../voice-generators";
import {trackAlexa} from "../utils";

const log = getLogger();
const PHONEME_SEESTADT_BOT = `Seestadt<phoneme alphabet="ipa" ph="bɒt">.bot</phoneme>`;

const LaunchRequestHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === "LaunchRequest";
    },
    handle(handlerInput : HandlerInput) : Response {
        const help = "Du kannst mich nach den Öffnungszeiten von Geschäften fragen. " +
            "Außerdem kenne ich alle Öffi-Abfahrtszeiten. " +
            "Frag mich einfach, wann der nächste Bus oder die nächste U-Bahn fährt.";

        trackAlexa(
            handlerInput.requestEnvelope.session?.user.userId || "unknown",
            "Lifecycle",
            "Launch",
        );

        return handlerInput.responseBuilder
            .speak(`Hallo vom ${PHONEME_SEESTADT_BOT}! ${help}`)
            .reprompt(`Servus noch einmal! Ich bin der ${PHONEME_SEESTADT_BOT}! ${help}`)
            .withSimpleCard("Seestadt.bot", help)
            .getResponse();
    },
};

const OpeningHoursIntent : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "OpeningHoursIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const entryData = await shopNameSlotToEntryData(
            getSlot(handlerInput.requestEnvelope, "shopName"),
            GeoFence.Seestadt,
        );

        trackAlexa(
            handlerInput.requestEnvelope.session?.user.userId || "unknown",
            "Query",
            "StadtKatalog",
            "Results",
            entryData ? 1 : 0,
        );

        const text = entryData ? generateOpeningHours(entryData) : `Leider konnte ich nichts dazu finden.`;
        return handlerInput.responseBuilder
            .speak(text)
            .withSimpleCard("Öffnungszeiten", text)
            .getResponse();
    }
};

const StationIntentHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "StationIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const vehicleTypeSlot = getSlot(handlerInput.requestEnvelope, "vehicleType");
        const vehicleType = vehicleTypeSlot
            ? (slotToVehicleType(vehicleTypeSlot) || VehicleType.BUS)
            : VehicleType.BUS;

        const fallbackStation = vehicleType === VehicleType.BUS ? StationKey.HAP : StationKey.SEE;

        const stopNameSlot = getSlot(handlerInput.requestEnvelope, "stopName");
        const station = stopNameSlot
            ? (slotToStation(stopNameSlot) || fallbackStation)
            : fallbackStation;

        const rbls = STATION_TO_LINES[station]
            .filter(lineInfo => {
                if (vehicleType === VehicleType.BUS) {
                    return BUS_LINES.includes(lineInfo.line);
                } else if (vehicleType === VehicleType.UBAHN) {
                    return UBAHN_LINES.includes(lineInfo.line);
                } else {
                    return true;
                }
            })
            .map(lineInfo => lineInfo.rbls)
            .flat();

        const stationInfo = await getStationInfo(rbls);

        // Report an error back to the user.
        if (stationInfo === null) {
            trackAlexa(
                handlerInput.requestEnvelope.session?.user.userId || "unknown",
                "Error",
                "Public Transit",
                "No Data Returned",
            );

            return handlerInput.responseBuilder
                .speak("Leider funktioniert der Server der Wiener Linien gerade nicht.")
                .withSimpleCard("Fehler", "Die Wiener Linien antworten nicht.")
                .getResponse();
        } else {
            trackAlexa(
                handlerInput.requestEnvelope.session?.user.userId || "unknown",
                "Query",
                "Public Transit",
                station,
            );

            const answer = generateStationInfo(station, stationInfo);
            return handlerInput.responseBuilder
                .speak(answer.text)
                .withSimpleCard(answer.card.title, answer.card.content)
                .getResponse();
        }
    },
};

const HelpIntentHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent";
    },
    handle(handlerInput : HandlerInput) : Response {
        trackAlexa(
            handlerInput.requestEnvelope.session?.user.userId || "unknown",
            "Lifecycle",
            "Help",
        );

        const speechText = "Du kannst mich nach den Öffnungszeiten eines Geschäfts fragen. " +
            "Ich weiß auch die Abfahrtszeiten der Öffis in der Seestadt. " +
            "Frag mich dazu einfach, wann der nächst Bus oder die nächste U-Bahn fährt.";

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard("Hilfe", speechText)
            .getResponse();
    },
};

const CancelAndStopIntentHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && (handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent"
                || handlerInput.requestEnvelope.request.intent.name === "AMAZON.StopIntent");
    },
    handle(handlerInput : HandlerInput) : Response {
        const isCancel = handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent";

        trackAlexa(
            handlerInput.requestEnvelope.session?.user.userId || "unknown",
            "Lifecycle",
            isCancel ? "Cancel" : "Stop",
        );

        return handlerInput.responseBuilder
            .speak("Tschüss, bis bald!")
            .withSimpleCard("Tschüss!", "Bis bald.")
            .withShouldEndSession(true)
            .getResponse();
    },
};

const ErrorHandler : ErrorHandler = {
    canHandle(handlerInput : HandlerInput, error : Error ) : boolean {
        return true;
    },
    handle(handlerInput : HandlerInput, error : Error) : Response {
        log.error(`Error handled: ${error.message}`);

        trackAlexa(
            handlerInput.requestEnvelope.session?.user.userId || "unknown",
            "Lifecycle",
            "Error",
        );

        return handlerInput.responseBuilder
            .speak("Hoppala! Kannst du das noch einmal sagen?")
            .reprompt("Entschuldige nochmals, aber ich habe dich nicht verstanden. Kannst du das wiederholen?")
            .getResponse();
    },
};

const SessionEndedRequestHandler : RequestHandler = {
    canHandle(handlerInput : HandlerInput) : boolean {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput : HandlerInput) : Response {
        const request = handlerInput.requestEnvelope.request as SessionEndedRequest;
        if (request.error) {
            log.error(`Session ended with reason ${request.reason}: ${request.error.type}, ${request.error.message}`);
        }
        return handlerInput.responseBuilder.getResponse();
    },
};

const skill = SkillBuilders
    .custom()
    .withSkillId(config.get("skills.seestadtbot.skillId"))
    .addRequestHandlers(
        LaunchRequestHandler,
        OpeningHoursIntent,
        StationIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .create();

export { skill };
