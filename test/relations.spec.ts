/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { setup, cleanup, setupApplication, getBaseModel } from '../test-helpers'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { column, manyToMany } from '@adonisjs/lucid/build/src/Orm/Decorators'
import { compose } from '@poppinss/utils/build/src/Helpers'
import { LucidModel, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import { SoftDeletes } from '../src/SoftDeletes'
import { DateTime } from 'luxon'

test.group('Relations', (group) => {
  let app: ApplicationContract
  let BaseModel: LucidModel

  group.before(async () => {
    app = await setupApplication()
    BaseModel = getBaseModel(app)
    await setup()
  })
  group.after(async () => cleanup())

  test('querying model relation with soft delete', async (assert) => {
    class User extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public username: string

      @column()
      public email: string

      @column()
      public isAdmin: number

      @column()
      public companyId: number

      @manyToMany(() => Industry)
      public industries: ManyToMany<typeof Industry>

      @manyToMany(() => Industry)
      public supertest: ManyToMany<typeof Industry>
    }
    User.boot()

    class Industry extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      public text: string

      @column()
      public revenue: number

      @manyToMany(() => User)
      public users: ManyToMany<typeof User>
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

  test('querying many to many with preload', async (assert) => {
    class MyBaseModel extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      public id: number

      @column.dateTime({ serializeAs: null })
      public deletedAt: DateTime
    }

    class Book extends MyBaseModel {
      public static table = 'books'

      @column()
      public name: string

      @manyToMany(() => Author)
      public authors: ManyToMany<typeof Author>
    }

    class Author extends MyBaseModel {
      public static table = 'authors'

      @column()
      public name: string

      @manyToMany(() => Book)
      public books: ManyToMany<typeof Book>
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

    const books = await Book.query()
      .select('id', 'name').preload('authors')

    assert.lengthOf(books, 1)
    assert.lengthOf(books[0].authors, 1)
  })
})
