const pg = require('pg')

if (process.env.IN_TESTS !== '1')
  process.exit(0)

async function main() {
  const connectionString = process.env.GM_DBURL
  if (!connectionString)
    throw new Error('GM_DBURL not set!')

  const pgPool = new pg.Pool({ connectionString })
  try {
    await pgPool.query('delete from graphile_worker.jobs;')
  }
  finally {
    await pgPool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
