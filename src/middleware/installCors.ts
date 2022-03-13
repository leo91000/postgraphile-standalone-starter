import type { Express } from 'express'
import cors from 'cors'

export default function installCors(app: Express) {
  if (!process.env.ALLOWED_ORIGINS)
    throw new Error('Invalid server configuration : missing ALLOWED_ORIGINS env var')

  app.use(cors({
    origin: new RegExp(process.env.ALLOWED_ORIGINS),
    methods: 'GET,POST',
  }))
}
