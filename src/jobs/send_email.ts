/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import type { JobHelpers } from 'graphile-worker'
import { template as lodashTemplate } from 'lodash'
import { htmlToText } from 'html-to-text'
import mjml2html from 'mjml'
import nodemailer from 'nodemailer'
import chalk from 'chalk'
import getTransport from '../services/emailTransport'
import config from '../config'

declare namespace global {
  let TEST_EMAILS: any[]
}

export interface SendEmailPayload {
  options: {
    from?: string
    to: string | string[]
    subject: string
  }
  template: string
  variables: Record<string, any>
}

const isTest = process.env.NODE_ENV === 'test'
const isDev = process.env.NODE_ENV !== 'production'

export default async function send_email(payload: unknown, _helpers: JobHelpers): Promise<void> {
  const transport = await getTransport()
  const { options: inOptions, template, variables } = payload as SendEmailPayload
  const options = {
    from: config.fromEmail,
    ...inOptions,
  }
  if (template) {
    const templateFn = await loadTemplate(template)
    const html = await templateFn(variables)
    const html2textableHtml = html.replace(/(<\/?)div/g, '$1p')
    const text = htmlToText(html2textableHtml, {
      wordwrap: 120,
    }).replace(/\n\s+\n/g, '\n\n')
    Object.assign(options, { html, text })
  }
  const info = await transport.sendMail(options)
  if (isTest) {
    global.TEST_EMAILS.push(info)
  }
  else if (isDev) {
    const url = nodemailer.getTestMessageUrl(info)
    if (url)
      console.log(`Development email preview: ${chalk.blue.underline(url)}`)
  }
}

const templatePromises = {}
function loadTemplate(template: string) {
  if (isDev || !templatePromises[template]) {
    templatePromises[template] = (async() => {
      if (!template.match(/^[a-zA-Z0-9_.-]+$/))
        throw new Error(`Disallowed template name '${template}'`)

      const templateString = await readFile(
        resolve(__dirname, '..', '..', 'templates', template),
        'utf8',
      )
      const templateFn = lodashTemplate(templateString, {
        escape: /\[\[([\s\S]+?)\]\]/g,
      })
      return (variables: Record<string, any>) => {
        const mjml = templateFn({
          projectName: config.projectName,
          legalText: config.legalText,
          ...variables,
        })
        const { html, errors } = mjml2html(mjml)
        if (errors && errors.length)
          console.error(errors)

        return html
      }
    })()
  }
  return templatePromises[template]
}
