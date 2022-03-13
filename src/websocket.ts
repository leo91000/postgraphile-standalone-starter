import type { Express, Request, Response } from 'express'
import type { Middleware } from 'postgraphile'

export function getWebsocketMiddlewares(
  app: Express,
): Middleware<Request, Response>[] {
  return app.get('websocketMiddlewares')
}

export function installWebsocketMiddlewares(app: Express) {
  const websocketMiddlewares: Middleware<Request, Response>[]
    = []
  app.set('websocketMiddlewares', websocketMiddlewares)
}
