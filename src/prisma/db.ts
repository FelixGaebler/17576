import 'dotenv/config'
// Prisma's DateTime codecs use the global Temporal API, which Node does not ship yet.
import 'temporal-polyfill/global'
import type { } from 'temporal-polyfill/types/global'
import postgres from '@prisma/orm-postgres/runtime'

import service from '../service'
import type { Contract } from './contract.d'
import contractJson from './contract.json' with { type: 'json' }

let client: ReturnType<typeof postgres<Contract>> | undefined

export function getDb() {
  if (client) return client

  if (process.env.COMPOSER_DB_URL) {
    client = service.load().db.client
    return client
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')

  client = postgres<Contract>({ contractJson, url })
  return client
}
