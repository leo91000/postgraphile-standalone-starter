if (parseInt(process.version.split('.')[0], 10) < 10)
  throw new Error('This project requires Node.js >= 10.0.0')

const fsp = require('fs').promises
const { resolve } = require('path')
const { runSync } = require('./lib/run')
const { withDotenvUpdater, readDotenv } = require('./lib/dotenv')
const { safeRandomString } = require('./lib/random')

exports.withDotenvUpdater = withDotenvUpdater
exports.readDotenv = readDotenv
exports.runSync = runSync

exports.updateDotenv = function updateDotenv(add, answers) {
  add(
    'GRAPHILE_LICENSE',
    null,
    '\n'
    + '# If you\'re supporting PostGraphile\'s development via Patreon or Graphile\n'
    + '# Store, add your license key from https://store.graphile.com here so you can\n'
    + '# use the Pro plugin - thanks so much!',
  )

  add(
    'NODE_ENV',
    'development',
    '\n'
    + '# This is a development environment (production wouldn\'t write envvars to a file)',
  )

  add(
    'ROOT_DATABASE_URL',
    null,
    '\n'
    + '# Superuser connection string (to a _different_ database), so databases can be dropped/created (may not be necessary in production)',
  )

  add(
    'DATABASE_HOST',
    null,
    '\n'
    + '# Where\'s the DB, and who owns it?',
  )

  add('DATABASE_NAME')
  add('DATABASE_OWNER', answers.DATABASE_NAME)
  add('DATABASE_OWNER_PASSWORD', safeRandomString(30))

  add(
    'DATABASE_AUTHENTICATOR',
    `${answers.DATABASE_NAME}_authenticator`,
    '\n'
    + '# The PostGraphile database user, which has very limited\n'
    + '# privileges, but can switch into the DATABASE_VISITOR role',
  )

  add('DATABASE_AUTHENTICATOR_PASSWORD', safeRandomString(30))

  add(
    'DATABASE_VISITOR',
    `${answers.DATABASE_NAME}_visitor`,
    '\n'
    + '# Visitor role, cannot be logged into directly',
  )

  add(
    'SECRET',
    safeRandomString(30),
    '\n'
    + '# This secret is used for signing cookies',
  )

  add(
    'JWT_SECRET',
    safeRandomString(48),
    '\n'
    + '# This secret is used for signing JWT tokens (we don\'t use this by default)',
  )

  add(
    'PORT',
    '5678',
    '\n'
    + '# This port is the one you\'ll connect to',
  )

  add(
    'ROOT_URL',
    'http://localhost:5678',
    '\n'
    + '# This is needed any time we use absolute URLs, e.g. for OAuth callback URLs\n'
    + '# IMPORTANT: must NOT end with a slash',
  )

  add(
    'ALLOWED_ORIGINS',
    `${answers.ALLOWED_ORIGINS}`,
    '\n'
    + '# This is used for CORS protection',
  )

  add(
    'GRAPHILE_TURBO',
    '1',
    '\n'
    + '# Set to 1 only if you\'re on Node v12 of higher; enables advanced optimisations:',
  )
}

exports.checkGit = async function checkGit() {
  try {
    const gitStat = await fsp.stat(resolve(__dirname, '..', '.git'))
    if (!gitStat || !gitStat.isDirectory())
      throw new Error('No .git folder found')
  }
  catch (e) {
    console.error()
    console.error()
    console.error()
    console.error(
      'ERROR: must run inside of a git versioned folder. Please run the following:',
    )
    process.exit(1)
  }
}

exports.runMain = (main) => {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

exports.outro = (message) => {
  console.log()
  console.log()
  console.log('____________________________________________________________')
  console.log()
  console.log()
  console.log(message)
  console.log()
  console.log()
  console.log('____________________________________________________________')
  console.log()
}
