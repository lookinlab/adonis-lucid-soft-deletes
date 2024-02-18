/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { getActiveTest } from '@japa/runner'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { AppFactory } from '@adonisjs/core/factories/app'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { Emitter } from '@adonisjs/core/events'
import { Database } from '@adonisjs/lucid/database'
import { BaseModel } from '@adonisjs/lucid/orm'

/**
 * Creates an instance of the database class for making queries
 */
export async function createDatabase() {
  const test = getActiveTest()
  if (!test) throw new Error('Cannot use "createDatabase" outside of a Japa test')

  await mkdir(test.context.fs.basePath)

  const app = new AppFactory().create(test.context.fs.baseUrl, () => {})
  const logger = new LoggerFactory().create()
  const emitter = new Emitter(app)
  const db = new Database(
    {
      connection: process.env.DB || 'sqlite',
      connections: {
        sqlite: {
          client: 'sqlite3',
          connection: {
            filename: join(test.context.fs.basePath, 'db.sqlite3'),
          },
        },
      },
    },
    logger,
    emitter
  )

  test.cleanup(() => db.manager.closeAll())
  BaseModel.useAdapter(db.modelAdapter())
  return db
}

export async function createTables(db: Database) {
  const test = getActiveTest()
  if (!test) throw new Error('Cannot use "createTables" outside of a Japa test')

  test.cleanup(async () => {
    await db.connection().schema.dropTableIfExists('users')
    await db.connection().schema.dropTableIfExists('industries')
    await db.connection().schema.dropTableIfExists('books')
    await db.connection().schema.dropTableIfExists('authors')
    await db.connection().schema.dropTableIfExists('roles')
    await db.connection().schema.dropTableIfExists('industry_user')
    await db.connection().schema.dropTableIfExists('author_book')
    await db.connection().schema.dropTableIfExists('posts')
  })

  await db.connection().schema.createTable('users', (table) => {
    table.increments()
    table.string('username').unique()
    table.string('email').unique()
    table.boolean('is_admin')
    table.string('password')
    table.integer('company_id')
    table.timestamps()
    table.timestamp('deleted_at', { useTz: true })
  })

  await db.connection().schema.createTable('industries', (table) => {
    table.increments()
    table.string('title')
    table.string('text')
    table.integer('revenue')
    table.timestamps()
    table.timestamp('deleted_at', { useTz: true })
  })

  await db.connection().schema.createTable('books', (table) => {
    table.increments().primary()
    table.string('name').unique()
    table.timestamps()
    table.timestamp('deleted_at', { useTz: true })
  })

  await db.connection().schema.createTable('authors', (table) => {
    table.increments().primary()
    table.string('name')
    table.timestamps()
    table.timestamp('deleted_at', { useTz: true })
  })

  await db.connection().schema.createTable('roles', (table) => {
    table.increments()
    table.string('title')
    table.timestamps()
  })

  await db.connection().schema.createTable('industry_user', (table) => {
    table.increments()
    table.integer('user_id')
    table.integer('industry_id')
  })

  await db.connection().schema.createTable('author_book', (table) => {
    table.increments().primary()
    table.integer('book_id')
    table.integer('author_id')
    table.foreign('book_id').references('books.id')
    table.foreign('author_id').references('authors.id')
    table.timestamp('deleted_at', { useTz: true })
  })

  await db.connection().schema.createTable('posts', (table) => {
    table.increments().primary()
    table.string('title')
    table.timestamp('deletedAt', { useTz: true })
  })
}
