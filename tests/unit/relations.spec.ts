/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import { column, BaseModel, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { compose } from '@adonisjs/core/helpers'
import { createDatabase, createTables } from '../helpers.js'
import { SoftDeletes } from '../../src/mixin.js'

test.group('Relations', () => {
  test('querying model relation with soft delete', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class User extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare username: string

      @column()
      declare email: string

      @column()
      declare isAdmin: number

      @column()
      declare companyId: number

      @manyToMany(() => Industry)
      declare industries: ManyToMany<typeof Industry>

      @manyToMany(() => Industry)
      declare supertest: ManyToMany<typeof Industry>
    }
    User.boot()

    class Industry extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      declare text: string

      @column()
      declare revenue: number

      @manyToMany(() => User)
      declare users: ManyToMany<typeof User>
    }
    Industry.boot()

    await Industry.query()

    const user = new User()
    user.fill({ username: 'Lookin', email: 'lookin@test.ru', isAdmin: 1, companyId: 1 })
    await user.save()

    const industry1 = new Industry()
    industry1.fill({ title: 'Industry 1', text: 'Industry by Lookin' })
    await industry1.save()

    const industry2 = new Industry()
    industry2.fill({ title: 'Industry 2', text: 'Industry by Lookin' })
    await industry2.save()

    const industry3 = new Industry()
    industry3.fill({ title: 'Industry 3', text: 'Industry by Lookin' })
    await industry3.save()

    await user.related('industries').attach([industry1.id, industry2.id, industry3.id])
    await industry1.delete()
    await industry2.delete()

    const industries = await user.related('industries').query().exec()
    assert.lengthOf(industries, 1)

    await Promise.all([User.truncate(), Industry.truncate()])
  })

  test('querying many to many with preload', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class MyBaseModel extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column.dateTime({ serializeAs: null })
      declare deletedAt: DateTime
    }

    class Book extends MyBaseModel {
      @column()
      declare name: string

      @manyToMany(() => Author)
      declare authors: ManyToMany<typeof Author>
    }

    class Author extends MyBaseModel {
      @column()
      declare name: string

      @manyToMany(() => Book)
      declare books: ManyToMany<typeof Book>
    }

    const book1 = new Book()
    book1.fill({ name: 'Introduction AdonisJs' })
    await book1.save()

    const book2 = new Book()
    book2.fill({ name: 'Introduction Javascript' })
    await book2.save()

    const author1 = new Author()
    author1.fill({ name: 'John' })
    await author1.save()

    const author2 = new Author()
    author2.fill({ name: 'Mary' })
    await author2.save()

    const author3 = new Author()
    author3.fill({ name: 'Paul' })
    await author3.save()

    await book1.related('authors').attach([author1.id, author2.id, author3.id])

    await book2.delete()
    await author1.delete()
    await author2.delete()

    const books = await Book.query().select('id', 'name').preload('authors').exec()

    assert.lengthOf(books, 1)
    assert.lengthOf(books[0].authors, 1)

    await book1.related('authors').detach()
    await Promise.all([Book.truncate(), Author.truncate()])
  })

  test('querying many to many with preload and group limit', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class Book extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare name: string

      @manyToMany(() => Author)
      declare authors: ManyToMany<typeof Author>
    }

    class Author extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare name: string

      @column.dateTime()
      declare deletedAt: DateTime

      @manyToMany(() => Book)
      declare books: ManyToMany<typeof Book>
    }

    const book1 = new Book()
    book1.fill({ name: 'Introduction AdonisJs' })
    await book1.save()

    const book2 = new Book()
    book2.fill({ name: 'Introduction Javascript' })
    await book2.save()

    const author1 = new Author()
    author1.fill({ name: 'John' })
    await author1.save()

    const author2 = new Author()
    author2.fill({ name: 'Mary' })
    await author2.save()

    const author3 = new Author()
    author3.fill({ name: 'Paul' })
    await author3.save()

    await book1.related('authors').attach([author1.id, author2.id, author3.id])
    await book2.related('authors').attach([author2.id, author3.id])
    await author1.delete()

    const authorsLimit1 = await Book.query()
      .preload('authors', (authors) => authors.groupLimit(1))
      .paginate(1, 10)

    assert.lengthOf(authorsLimit1, 2)
    assert.lengthOf(authorsLimit1[0].authors, 1)
    assert.lengthOf(authorsLimit1[1].authors, 1)

    const authorsLimit2 = await Book.query()
      .preload('authors', (authors) => authors.groupLimit(2))
      .paginate(1, 10)

    assert.lengthOf(authorsLimit2, 2)
    assert.lengthOf(authorsLimit2[0].authors, 2)
    assert.lengthOf(authorsLimit2[1].authors, 2)

    const authorsJohns = await Book.query()
      .preload('authors', (authors) => authors.where('name', 'Mary'))
      .paginate(1, 10)

    assert.lengthOf(authorsJohns, 2)
    assert.lengthOf(authorsJohns[0].authors, 1)

    await Promise.all([Book.truncate(), Author.truncate()])
  })
})
