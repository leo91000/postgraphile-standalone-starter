import type { JobHelpers } from 'graphile-worker'
import type { SendEmailPayload } from './send_email'

interface UserSendAccountDeletionEmailPayload {
  /**
   * email address
   */
  email: string

  /**
   * secret token
   */
  token: string
}

export default async function user__send_delete_account_email(payload: unknown, { addJob }: JobHelpers): Promise<void> {
  const { email, token } = payload as UserSendAccountDeletionEmailPayload
  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: 'Confirmation required: really delete account?',
    },
    template: 'delete_account.mjml',
    variables: {
      token,
      deleteAccountLink: `${
        process.env.ROOT_URL
      }/settings/delete?token=${encodeURIComponent(token)}`,
    },
  }
  await addJob('send_email', sendEmailPayload)
}
