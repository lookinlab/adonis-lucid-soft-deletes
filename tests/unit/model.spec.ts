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
import { column, BaseModel, ModelQueryBuilder } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { createDatabase, createTables } from '../helpers.js'
import { SoftDeletes } from '../../src/mixin.js'
import { extendModelQueryBuilder } from '../../src/bindings/model_query_builder.js'

test.group('BaseModelWithSoftDeletes', (group) => {
  group.setup(() => extendModelQueryBuilder(ModelQueryBuilder))

  test('exists methods `withTrashed` and `onlyTrashed`', async ({ assert }) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    assert.isFunction(TestModel.withTrashed)
    assert.isFunction(TestModel.onlyTrashed)
    // assert.instanceOf(TestModel.withTrashed(), ModelQueryBuilder)
    // assert.instanceOf(TestModel.onlyTrashed(), ModelQueryBuilder)
  })

  test('not exists methods `withTrashed` and `onlyTrashed` of model without SoftDeletes', ({
    assert,
  }) => {
    class TestModel extends BaseModel {}
    TestModel.boot()

    assert.notProperty(TestModel, 'withTrashed')
    assert.notProperty(TestModel, 'onlyTrashed')
    // assert.fail(TestModel.query().withTrashed)
    // assert.fail(TestModel.query().onlyTrashed)
  })

  test('exists methods `restore` and `forceDelete` of model instance', ({ assert }) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    const model = new TestModel()

    assert.property(model, 'restore')
    assert.property(model, 'forceDelete')
    assert.isFunction(model.restore)
    assert.isFunction(model.forceDelete)
  })

  test('exists `deletedAt` of model', ({ assert }) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    assert.equal(TestModel.$hasColumn('deletedAt'), true)
  })

  test('custom column name for deletedAt of model', ({ assert }) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {
      @column.dateTime({ columnName: 'deletedAt' })
      declare deletedAt?: DateTime | null
    }
    TestModel.boot()

    assert.equal(TestModel.$hasColumn('deletedAt'), true)
    assert.equal(TestModel.$getColumn('deletedAt')?.columnName, 'deletedAt')
  })

  test('correct name and table name of model', ({ assert }) => {
    class User extends compose(BaseModel, SoftDeletes) {}
    User.boot()

    class Industry extends compose(BaseModel, SoftDeletes) {}
    Industry.boot()

    assert.equal(User.table, 'users')
    assert.equal(User.name, 'User')
    assert.equal(Industry.table, 'industries')
    assert.equal(Industry.name, 'Industry')
  })

  test('querying models without trashed models', async ({ assert }) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({
      username: 'Tony',
      email: 'tony@test.ru',
      isAdmin: 1,
      companyId: 1,
      deletedAt: null,
    })
    await user1.save()

    const user2 = new User()
    user2.fill({ username: 'Adonis', email: 'test@test.ru', isAdmin: 0, companyId: 2 })
    await user2.save()
    await user2.delete()

    const users = await User.all()
    assert.lengthOf(users, 1)
    assert.deepEqual(users[0].toJSON(), user1.toJSON())

    const usersWithPaginate = await User.query().paginate(1, 10)
    assert.lengthOf(usersWithPaginate.all(), 1)
    assert.equal(usersWithPaginate.total, 1)

    await User.truncate()
  })

  test('querying all models with trashed models', async ({ assert }) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1 })
    await user1.save()
    await user1.delete()

    const user2 = new User()
    user2.fill({ username: 'Adonis', email: 'test@test.ru', isAdmin: 0, companyId: 2 })
    await user2.save()

    const user3 = new User()
    user3.fill({ username: 'Lucid', email: 'lucid@test.ru', isAdmin: 0, companyId: 1 })
    await user3.save()

    const users = await User.withTrashed().exec()
    assert.lengthOf(users, 3)

    const usersWithPagination = await User.onlyTrashed().paginate(1, 5)
    assert.lengthOf(usersWithPagination.all(), 1)
    assert.equal(usersWithPagination.total, 1)

    await User.truncate()
  })

  test('querying only trashed models', async ({ assert }) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1 })
    await user1.save()
    await user1.delete()

    const user2 = new User()
    user2.fill({ username: 'Adonis', email: 'test@test.ru', isAdmin: 0, companyId: 2 })
    await user2.save()

    const users = await User.query().onlyTrashed().exec()
    assert.lengthOf(users, 1)
    assert.equal(users[0].id, user1.id)

    await User.truncate()
  })

  test('`restore` model after soft delete', async ({ assert }) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1 })
    await user1.save()
    await user1.delete()

    const users = await User.onlyTrashed().exec()
    assert.lengthOf(users, 1)
    assert.equal(users[0].id, user1.id)

    await user1.restore()

    const user = await User.query().first()
    assert.deepEqual(user!.toJSON(), user1.toJSON())

    await User.truncate()
  })

  test('`forceDelete` model and throw error when `restore`', async ({ assert }) => {
    assert.plan(2)

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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1 })
    await user1.save()
    await user1.forceDelete()

    const users = await User.withTrashed().exec()
    assert.lengthOf(users, 0)

    try {
      await user1.restore()
    } catch ({ message }) {
      assert.equal(message, 'Cannot restore a model instance is was force deleted')
    }

    await User.truncate()
  })

  test('querying models with custom deletedAt column', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class Post extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column.dateTime({ columnName: 'deletedAt' })
      declare deletedAt?: DateTime | null
    }
    Post.boot()

    const post1 = new Post()
    post1.fill({ title: 'New post 1', deletedAt: null })
    await post1.save()

    const post2 = new Post()
    post2.fill({ title: 'Adonis the best' })
    await post2.save()
    await post2.delete()

    const posts = await Post.all()
    assert.lengthOf(posts, 1)
    assert.deepEqual(posts[0].toJSON(), post1.toJSON())

    const postsWithPaginate = await Post.query().paginate(1, 10)
    assert.lengthOf(postsWithPaginate.all(), 1)
    assert.equal(postsWithPaginate.total, 1)

    await Post.truncate()
  })

  test('querying only trashed models with custom deletedAt column', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class Post extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column.dateTime({ columnName: 'deletedAt' })
      declare deletedAt?: DateTime | null
    }
    Post.boot()

    const post1 = new Post()
    post1.fill({ title: 'New post 1', deletedAt: null })
    await post1.save()
    await post1.delete()

    const post2 = new Post()
    post2.fill({ title: 'Adonis the best' })
    await post2.save()

    const posts = await Post.onlyTrashed().exec()
    assert.lengthOf(posts, 1)
    assert.equal(posts[0].id, post1.id)

    await Post.truncate()
  })

  test('`restore` model after soft delete with custom deletedAt column', async ({ assert }) => {
    const db = await createDatabase()
    await createTables(db)

    class Post extends compose(BaseModel, SoftDeletes) {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column.dateTime({ columnName: 'deletedAt' })
      declare deletedAt?: DateTime | null
    }
    Post.boot()

    const post1 = new Post()
    post1.fill({ title: 'New post 1', deletedAt: null })
    await post1.save()
    await post1.delete()

    const posts = await Post.onlyTrashed().exec()
    assert.lengthOf(posts, 1)
    assert.equal(posts[0].id, post1.id)

    await post1.restore()

    const user = await Post.query().first()
    assert.deepEqual(user!.toJSON(), post1.toJSON())

    await Post.truncate()
  })
})
