import convict from "convict";
import covict_validator from "convict-format-with-validator";
convict.addFormat(covict_validator.ipaddress);
convict.addFormat(covict_validator.email);
convict.addFormat(covict_validator.url);

// Schema for Matomo Trackers.
convict.addFormat({
    "name": "matomo-tracker",
    validate: function check(val) {
        if (typeof val.siteId !== "number") {
            throw new TypeError(`matomo.siteId '${val.siteId}' is not a number`);
        }
        if (typeof val.trackerUrl !== "string") {
            throw new TypeError(`matomo.trackerUrl missing`);
        }
        if (typeof val.salt !== "string" || val.salt.length < 10) {
            throw new TypeError(`matomo.salt must be a string and at least 10 characters long!`);
        }
    },
});


// The full stadtbots configuration schema.
const config = convict({
    env: {
        doc: "The application environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV",
    },
    ip: {
        doc: "The IP address to bind.",
        format: "ipaddress",
        default: "127.0.0.1",
        env: "IP_ADDRESS",
    },
    port: {
        doc: "The port to bind.",
        format: "port",
        default: 8080,
        env: "PORT",
        arg: "port",
    },
    logging: {
        level: {
            doc: "The log level for the logger.",
            format: String,
            default: "info",
            env: "LOG_LEVEL",
            arg: "log_level",
        },
        prettyPrint: {
            doc: "Use a pretty output instead of JSON.",
            format: Boolean,
            default: false,
            env: "LOG_PRETTY_PRINT",
            arg: "log_pretty_pring",
        },
    },
    webhooks: {
        token: {
            doc: "A secret token for the webhooks",
            format: String,
            default: "super-secret-token",
            env: "WEBHOOKS_TOKEN",
            arg: "webhooks_token",
            sensitive: true,
        },
        baseUrl: {
            doc: "Base URL for all webhooks.",
            format: "url",
            default: "https://localhost",
            env: "WEBHOOKS_BASE_URL",
            arg: "webhooks_base_url",
        },
    },
    skills: {
        seestadtbot: {
            skillId: {
                doc: "The skill id of Seestadt.bot",
                format: String,
                default: "amzn1.ask.skill.inserit-id-here",
                env: "SEESTADTBOT_SKILL_ID",
                arg: "seestadtbot_skill_id",
                sensitive: true,
            },
        }
    },
    wienerlinien: {
        timeout: {
            doc: "The default timeout to wait for an API response.",
            format: "nat",
            default: 7500,
            env: "WIENERLINIEN_TIMEOUT",
            arg: "wienerlinien_timeout",
        },
        monitor: {
            doc: "The Wiener Linien real-time monitor endpoint.",
            format: "url",
            default: "https://www.wienerlinien.at/ogd_realtime/monitor",
            env: "WIENERLINIEN_MONITOR",
            arg: "wienerlinien_monitor",
        },
        elevator: {
            doc: "The Wiener Linien elevator info endpoint.",
            format: "url",
            default: "https://www.wienerlinien.at/ogd_realtime/trafficInfoList?name=aufzugsinfo",
            env: "WIENERLINIEN_ELEVATOR",
            arg: "wienerlinien_elevator",
        }
    },
    stadtkatalog: {
        blacklist: {
            doc: "IDs of StadtKatalog entries to filter from Voice-based results.",
            format: Array,
            default: [],
        },
        vagueTerms: {
            doc: "Too vague terms which should not be used for search queries.",
            format: Array,
            default: ["seestadt", "aspern"],
        },
    },
    matomo: {
        doc: "Tracking configuration for Matomo.",
        format: "matomo-tracker",
        default: {},
    },
});

// Load the current environment configuration.
const env = config.get("env");
config.loadFile(`${__dirname}/../config/${env}.json`);
config.validate({allowed: "strict"});

export default config;
