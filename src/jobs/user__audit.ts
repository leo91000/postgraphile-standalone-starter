import type { JobHelpers } from 'graphile-worker'
import config from '../config'
import type { SendEmailPayload } from './send_email'

type UserAuditPayload =
  | {
    type: 'added_email'
    user_id: string
    current_user_id: string

    /** id */
    extra1: string

    /** email */
    extra2: string
  }
  | {
    type: 'removed_email'
    user_id: string
    current_user_id: string

    /** id */
    extra1: string

    /** email */
    extra2: string
  }
  | {
    type: 'linked_account'
    user_id: string
    current_user_id: string

    /** service */
    extra1: string

    /** identifier */
    extra2: string
  }
  | {
    type: 'unlinked_account'
    user_id: string
    current_user_id: string

    /** service */
    extra1: string

    /** identifier */
    extra2: string
  }
  | {
    type: 'reset_password'
    user_id: string
    current_user_id: string
  }
  | {
    type: 'change_password'
    user_id: string
    current_user_id: string
  }

export default async function user__audit(rawPayload: unknown, { withPgClient, addJob, job }: JobHelpers): Promise<void> {
  const payload: UserAuditPayload = rawPayload as any
  let subject: string
  let actionDescription: string
  switch (payload.type) {
    case 'added_email': {
      subject = 'Vous avez ajouté une adresse email à votre compte'
      actionDescription = `Vous avez ajouté l'adresse email '${payload.extra2}' à votre compte.`
      break
    }
    case 'removed_email': {
      subject = 'You removed an email from your account'
      actionDescription = `You removed the email '${payload.extra2}' from your account.`
      break
    }
    case 'linked_account': {
      subject = 'Vous avez lié un compte tierce OAuth à votre compte'
      actionDescription = `Vous avez attaché un compte tierce ('${payload.extra1}') à votre compte.`
      break
    }
    case 'unlinked_account': {
      subject = 'Vous avez supprimé un lien entre votre compte et un compte tierce Oauth'
      actionDescription = `Vous avez supprimé un lien entre votre compte et un compte tierce Oauth ('${payload.extra1}').`
      break
    }
    case 'reset_password': {
      subject = 'Vous avez réinitialisé votre mot de passe'
      actionDescription = 'Votre mot de passe a été réinitialisé.'
      break
    }
    case 'change_password': {
      subject = 'Vous avez changé votre mot de passe'
      actionDescription = 'Vous avez changé votre mot de passe.'
      break
    }
    default: {
      // Ensure we've handled all cases above
      const neverPayload: never = payload
      console.error(
        `Audit action '${(neverPayload as any).type}' not understood; ignoring.`,
      )
      return
    }
  }

  const {
    rows: [user],
  } = await withPgClient(client =>
    client.query<{
      id: string
      created_at: Date
    }>('select * from app_public.users where id = $1', [payload.user_id]),
  )

  if (!user) {
    console.error(
      `User '${payload.user_id}' no longer exists. (Tried to audit: ${actionDescription})`,
    )
    return
  }
  if (Math.abs(+user.created_at - +job.created_at) < 2) {
    console.info(
      `Not sending audit announcement for user '${payload.user_id}' because it occurred immediately after account creation. (Tried to audit: ${actionDescription})`,
    )
    return
  }
  const { rows: userEmails } = await withPgClient(client =>
    client.query<{
      id: string
      user_id: string
      email: string
      is_verified: boolean
      is_primary: boolean
      created_at: Date
      updated_at: Date
    }>(
      'select * from app_public.user_emails where user_id = $1 and is_verified is true order by id asc',
      [payload.user_id],
    ),
  )

  if (userEmails.length === 0)
    throw new Error('Could not find emails for this user')

  const emails = userEmails.map(e => e.email)

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: emails,
      subject: `[${config.projectName}] ${subject}`,
    },
    template: 'account_activity.mjml',
    variables: {
      actionDescription,
    },
  }
  await addJob('send_email', sendEmailPayload)
}
