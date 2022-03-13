import ConnectPgSimple from 'connect-pg-simple'
import ConnectRedis from 'connect-redis'
import type { Express, RequestHandler } from 'express'
import session from 'express-session'
import { createClient } from 'redis'

import { getWebsocketMiddlewares } from '../websocket'
import { getRootPgPool } from './installDatabasePools'

const RedisStore = ConnectRedis(session)
const PgStore = ConnectPgSimple(session)

const MILLISECOND = 1
const SECOND = 1000 * MILLISECOND
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const { SECRET } = process.env
if (!SECRET)
  throw new Error('Server misconfigured (missing SECRET env var)')

const MAXIMUM_SESSION_DURATION_IN_MILLISECONDS
  = parseInt(process.env.MAXIMUM_SESSION_DURATION_IN_MILLISECONDS || '', 10)
  || 3 * DAY

export default async(app: Express) => {
  const rootPgPool = getRootPgPool(app)

  let store
  if (process.env.REDIS_URL) {
    const client = createClient({
      url: process.env.REDIS_URL,
      legacyMode: true,
    })

    await client.connect()

    store = new RedisStore({
      // @ts-expect-error Type definition for connect-redis is only for redis v3, however the package supports also redis v4
      client,
    })
  }
  else {
    store = new PgStore({
      /*
       * Note even though "connect-pg-simple" lists "pg@7.x" as a dependency,
       * it doesn't `require("pg")` if we pass it a pool. It's usage of the pg
       * API is small; so it's compatible with pg@8.x.
       */
      pool: rootPgPool,
      schemaName: 'app_private',
      tableName: 'connect_pg_simple_sessions',
    })
  }

  const sessionMiddleware = session({
    rolling: true,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: MAXIMUM_SESSION_DURATION_IN_MILLISECONDS,
      httpOnly: true, // default
      sameSite: 'lax', // Cannot be 'strict' otherwise OAuth won't work.
      secure: 'auto', // May need to app.set('trust proxy') for this to work.
    },
    store,
    secret: SECRET,
  })

  /**
   * For security reasons we only enable sessions for requests within the our
   * own website; external URLs that need to issue requests to us must use a
   * different authentication method such as bearer tokens.
   */
  const wrappedSessionMiddleware: RequestHandler = (req, res, next) => {
    const allowedOriginRegex = process.env.ALLOWED_ORIGINS
    if (allowedOriginRegex && req.get('origin')?.match(allowedOriginRegex))
      sessionMiddleware(req, res, next)
    else
      next()
  }

  app.use(wrappedSessionMiddleware)
  getWebsocketMiddlewares(app).push(wrappedSessionMiddleware)
}
