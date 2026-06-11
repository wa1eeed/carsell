import pino from 'pino'

/**
 * Plain pino → stdout (JSON). We intentionally avoid the `pino-pretty` transport:
 * it spawns a worker thread that Next.js cannot bundle, which crashes server
 * components ("Cannot find module .next/server/vendor-chunks/lib/worker.js").
 */
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
})

export default logger
