// Copyright 2021 Philipp Naderer-Puiu

import * as Hapi from "@hapi/hapi";
import * as HapiPino from "hapi-pino";
import Boom from "@hapi/boom";

import {
    SkillRequestSignatureVerifier,
    TimestampVerifier,
} from "ask-sdk-express-adapter";

import config from "./config";

import {getLogger} from "./logging";
const log = getLogger();

import {skill as SeestadtBotSkill} from "./alexa-skills/seestadtbot";
import {RequestEnvelope} from "ask-sdk-model";

const init = async () => {
    const server = new Hapi.Server({
        port: config.get("port"),
    });

    // Use pino for logging.
    await server.register({
        plugin: HapiPino,
        options: {
            prettyPrint: config.get("env") !== "production",
            redact: ["req.headers.authorization"],
        },
    });

    // Display at least something on the default route.
    server.route({
        method: "GET",
        path: "/",
        handler: (request) => {
            return "Hello Voice-World!";
        },
    });

    // Setup for incoming webhooks.
    const webhooksToken = config.get("webhooks.token");
    server.log(["debug", "api"], `Setting up webhooks with token: ${webhooksToken}`);

    server.route({
        method: "POST",
        path: `/${webhooksToken}/seestadtbot`,
        handler: async (request) => {
            const payload = request.payload as Buffer;
            const textBody = payload.toString("utf8");
            try {
                await new SkillRequestSignatureVerifier().verify(textBody, request.raw.req.headers);
                await new TimestampVerifier().verify(textBody);
            } catch (err) {
                log.error(`Invalid request: Could not verify ${textBody}`);
                return Boom.internal(`Could not verify request.`);
            }

            try {
                return SeestadtBotSkill.invoke(JSON.parse(textBody));
            } catch (err) {
                log.error(`Invalid request body: Could not parse JSON from ${textBody}`);
                return Boom.badRequest(`Invalid JSON.`);
            }
        },
        options: {
            payload: {
                parse: false,
                output: "data",
            },
        },
    });

    // App Engine protected action for warm-up requests.
    server.route({
        method: "GET",
        path: "/_ah/warmup",
        handler: (request) => {
            request.log("info", "Warmup request received.");
            return "Done.";
        },
    });

    await server.start();
    server.log("info", `Server running on ${server.info.uri}`);
};

// Catch unhandled promises and log an error.
process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

init();
