import type { Server } from 'http'
import type { Express } from 'express'
import express from 'express'

export function getHttpServer(app: Express): Server | void {
  return app.get('httpServer')
}

export function getShutdownActions(app: Express): ShutdownActions[] {
  return app.get('shutdownActions')
}

export async function makeApp({ httpServer }: { httpServer?: Server } = {}): Promise<Express> {
  const isTest = process.env.NODE_ENV === 'test'
  const isDev = process.env.NODE_ENV === 'development'

  const shutdownActions = makeShutdownActions()

  const app = express()

  app.set('httpServer', httpServer)

  app.set('shutdownActions', shutdownActions)

  await middleware.installDatabasePools(app)
  await middleware.installHelmet(app)
  await middleware.installSameOrigin(app)
  await middleware.installSession(app)
  await middleware.installPassport(app)
  await middleware.installLogging(app)
  await middleware.installPostgraphile(app)

  await middleware.installErrorHandler(app)

  return app
}
