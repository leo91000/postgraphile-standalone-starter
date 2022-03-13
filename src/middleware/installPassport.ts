import type { Express } from 'express'
import passport from 'passport'

interface DbSession {
  session_id: string
}

declare global {
  namespace Express {
    interface User {
      session_id: string
    }
  }
}

export default async(app: Express) => {
  passport.serializeUser((sessionObject: DbSession, done) => {
    done(null, sessionObject.session_id)
  })

  passport.deserializeUser((session_id: string, done) => {
    done(null, { session_id })
  })

  const passportInitializeMiddleware = passport.initialize()
  app.use(passportInitializeMiddleware)

  const passportSessionMiddleware = passport.session()
  app.use(passportSessionMiddleware)

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })
}
