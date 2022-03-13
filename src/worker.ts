import type { Runner } from 'graphile-worker'
import { run } from 'graphile-worker'
import type { Express } from 'express'
import { getRootPgPool } from './middleware/installDatabasePools'
import taskList from './jobs'

export function getRunner(app: Express): Runner {
  return app.get('runner')
}

export default async function startWorker(app: Express) {
  const runner = await run({
    pgPool: getRootPgPool(app),
    concurrency: 5,
    noHandleSignals: false,
    pollInterval: 1000,
    taskList,
  })

  app.set('runner', runner)
}
