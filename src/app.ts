import type { Server } from 'http'
import type { Express } from 'express'
import express from 'express'
import type { ShutdownAction } from './shutdownActions'
import { makeShutdownActions } from './shutdownActions'
import middleware from './middleware'

export function getHttpServer(app: Express): Server | void {
  return app.get('httpServer')
}

export function getShutdownActions(app: Express): ShutdownAction[] {
  return app.get('shutdownActions')
}

export async function makeApp({ httpServer }: { httpServer?: Server } = {}): Promise<Express> {
  const shutdownActions = makeShutdownActions()

  const app = express()

  app.set('httpServer', httpServer)

  app.set('shutdownActions', shutdownActions)

  await middleware.installDatabasePools(app)
  await middleware.installHelmet(app)
  await middleware.installCors(app)
  await middleware.installSession(app)
  await middleware.installPassport(app)
  await middleware.installLogging(app)

  await middleware.installErrorHandler(app)

  return app
}
