import type { JobHelpers } from 'graphile-worker'

export default async function user__audit(_payload: unknown, _helpers: JobHelpers): Promise<void> {
  throw new Error('Not implemented')
}
