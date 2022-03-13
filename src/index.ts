/* eslint-disable no-console */
import { createServer } from 'http'
import chalk from 'chalk'
import { getShutdownActions, makeApp } from './app'

async function main() {
  const httpServer = createServer()

  const app = await makeApp({ httpServer })
  httpServer.addListener('request', app)

  const PORT = parseInt(process.env.PORT || '', 10) || 3000

  httpServer.listen(PORT, () => {
    const address = httpServer.address()
    const actualPort: string = typeof address === 'string' ? address : address && address.port ? String(address.port) : String(PORT)

    console.log()
    console.log(
      chalk.green(
        `${chalk.bold('api')} listening on port ${chalk.bold(actualPort)}`,
      ),
    )
    console.log()
    console.log(
      `  Site:     ${chalk.bold.underline(`http://localhost:${actualPort}`)}`,
    )
    console.log(
      `  GraphiQL: ${chalk.bold.underline(
        `http://localhost:${actualPort}/graphiql`,
      )}`,
    )
    console.log()

    const shutdownActions = getShutdownActions(app)

    shutdownActions.push(() => {
      httpServer.close()
    })
  })
}

main().catch((e) => {
  console.error('Fatal error occurred starting server!')
  console.error(e)
  process.exit(101)
})
