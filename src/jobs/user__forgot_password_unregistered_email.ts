import type { JobHelpers } from 'graphile-worker'
import config from '../config'
import type { SendEmailPayload } from './send_email'

interface UserForgotPasswordUnregisteredEmailPayload {
  email: string
}

export default async function user__forgot_password_unregistered_email(rawPayload: unknown, { addJob }: JobHelpers): Promise<void> {
  const payload: UserForgotPasswordUnregisteredEmailPayload = rawPayload as any
  const { email } = payload

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: `Password reset request failed: you don't have a ${config.projectName} account`,
    },
    template: 'password_reset_unregistered.mjml',
    variables: {
      url: process.env.ROOT_URL,
    },
  }
  await addJob('send_email', sendEmailPayload)
}
