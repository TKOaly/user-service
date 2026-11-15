import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import pino from "pino";
import pinoHttp from "pino-http";

/**
 * Application logger.
 *
 * Logs are written to stdout as one JSON object per line so that a log
 * collector (Grafana Alloy / Promtail) can ship them to Loki as-is.
 * For human readable output during development, pipe the output through
 * `pino-pretty` (the `watch` script does this already).
 *
 * Configuration:
 *   LOG_LEVEL  trace | debug | info | warn | error | fatal | silent (default: info, test: silent)
 */

/** Query string / body keys whose values must never end up in the logs. */
const SENSITIVE_KEYS = [
  "password",
  "password1",
  "password2",
  "client_secret",
  "code",
  "token",
  "access_token",
  "id_token",
  "refresh_token",
  "nonce",
  "signature",
  "hash",
  "state",
];

const REDACTED = "[Redacted]";

const defaultLevel = process.env.NODE_ENV === "test" ? "silent" : "info";

export const logger = pino({
  level: process.env.LOG_LEVEL || defaultLevel,
  base: {
    service: "user-service",
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // Emit the level as a string ("level":"info") instead of a number,
    // which makes it usable directly as a Loki label / filter.
    level: label => ({ level: label }),
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "salt",
      "*.salt",
      "hashedPassword",
      "*.hashedPassword",
      "hashed_password",
      "*.hashed_password",
      "password_hash",
      "*.password_hash",
      "client_secret",
      "*.client_secret",
      "secret",
      "*.secret",
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    censor: REDACTED,
  },
});

export type Logger = typeof logger;

/**
 * Returns the URL with values of sensitive query parameters replaced, e.g.
 * `/reset-password?user=1&nonce=abc` -> `/reset-password?user=1&nonce=[Redacted]`.
 */
export const redactUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  const index = url.indexOf("?");
  if (index === -1) return url;

  const params = new URLSearchParams(url.substring(index + 1));

  for (const key of [...params.keys()]) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      params.set(key, "REDACTED");
    }
  }

  return `${url.substring(0, index)}?${params.toString()}`;
};

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[\w-]{1,128}$/;

/**
 * HTTP request logging middleware. Attaches a child logger to `req.log`
 * carrying the request id, so every log line written while handling a
 * request can be correlated in Grafana with `{service="user-service"} | json | reqId="..."`.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  // Top level `reqId` on every line logged through `req.log`, including the completion line.
  customProps: req => ({ reqId: req.id }),
  autoLogging: {
    // Health checks would otherwise flood the logs.
    ignore: req => req.url === "/ping",
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req: pino.SerializedRequest) => ({
      method: req.method,
      url: redactUrl(req.url),
      // Express resolves the client address from X-Forwarded-For ("trust proxy").
      remoteAddress: (req.raw as IncomingMessage & { ip?: string }).ip ?? req.remoteAddress,
      userAgent: req.headers?.["user-agent"],
    }),
    res: (res: pino.SerializedResponse) => ({
      statusCode: res.statusCode,
    }),
  },
  wrapSerializers: true,
});
