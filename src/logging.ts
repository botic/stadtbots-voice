import pino, {LoggerOptions} from "pino";
import config from "./config";

/**
 * Returns a new pino logger.
 * @param opts Logger options.
 * @see https://getpino.io/#/docs/api?id=options-object
 */
export function getLogger(opts?: LoggerOptions) {
    return pino(Object.assign({}, config.get("logging"), opts));
}
