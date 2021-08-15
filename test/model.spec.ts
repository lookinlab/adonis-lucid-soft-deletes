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
import { ModelQueryBuilder } from '@adonisjs/lucid/build/src/Orm/QueryBuilder'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { column } from '@adonisjs/lucid/build/src/Orm/Decorators'
import { compose } from '@poppinss/utils/build/src/Helpers'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import { SoftDeletes } from '../src/SoftDeletes'

test.group('BaseModelWithSoftDeletes', (group) => {
  let app: ApplicationContract
  let BaseModel: LucidModel

  group.before(async () => {
    app = await setupApplication()
    BaseModel = getBaseModel(app)
    await setup()
  })
  group.after(async () => cleanup())

  test('exists methods `withTrashed` and `onlyTrashed`', (assert) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    assert.isFunction(TestModel.withTrashed)
    assert.isFunction(TestModel.onlyTrashed)
    assert.instanceOf(TestModel.withTrashed(), ModelQueryBuilder)
    assert.instanceOf(TestModel.onlyTrashed(), ModelQueryBuilder)
  })

  test('not exists methods `withTrashed` and `onlyTrashed` of model without SoftDeletes', (assert) => {
    class TestModel extends BaseModel {}
    TestModel.boot()

    assert.notProperty(TestModel, 'withTrashed')
    assert.notProperty(TestModel, 'onlyTrashed')
  })

  test('exists methods `restore` and `forceDelete` of model instance', (assert) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    const model = new TestModel()

    assert.property(model, 'restore')
    assert.property(model, 'forceDelete')
    assert.isFunction(model.restore)
    assert.isFunction(model.forceDelete)
  })

  test('exists `deletedAt` of model', (assert) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    assert.equal(TestModel.$hasColumn('deletedAt'), true)
  })

  test('exists `$ignoreDeleted` property and is true by default', (assert) => {
    class TestModel extends compose(BaseModel, SoftDeletes) {}
    TestModel.boot()

    assert.property(TestModel, '$ignoreDeleted')
    assert.equal(TestModel.$ignoreDeleted, true)
  })

  test('correct name and table name of model', (assert) => {
    class User extends compose(BaseModel, SoftDeletes) {}
    User.boot()

    class Industry extends compose(BaseModel, SoftDeletes) {}
    Industry.boot()

    assert.equal(User.table, 'users')
    assert.equal(User.name, 'User')
    assert.equal(Industry.table, 'industries')
    assert.equal(Industry.name, 'Industry')
  })

  test('querying models without trashed models', async (assert) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1, deletedAt: null })
    await user1.save()

    const user2 = new User()
    user2.fill({ username: 'Adonis', email: 'test@test.ru', isAdmin: 0, companyId: 2 })
    await user2.save()
    await user2.delete()

    const users = await User.all()
    assert.lengthOf(users, 1)
    assert.deepStrictEqual(users[0].toJSON(), user1.toJSON())

    const usersWithPaginate = await User.query().paginate(1, 10)
    assert.equal(usersWithPaginate.total, 1)

    await User.truncate()
  })

  test('querying all models with trashed models', async (assert) => {
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

  test('querying only trashed models', async (assert) => {
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
    }
    User.boot()

    const user1 = new User()
    user1.fill({ username: 'Tony', email: 'tony@test.ru', isAdmin: 1, companyId: 1 })
    await user1.save()
    await user1.delete()

    const user2 = new User()
    user2.fill({ username: 'Adonis', email: 'test@test.ru', isAdmin: 0, companyId: 2 })
    await user2.save()

    const users = await User.onlyTrashed().exec()
    assert.lengthOf(users, 1)
    assert.equal(users[0].id, user1.id)

    await User.truncate()
  })

  test('`restore` model after soft delete', async (assert) => {
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
    assert.deepStrictEqual(user!.toJSON(), user1.toJSON())

    await User.truncate()
  })

  test('`forceDelete` model and throw error when `restore`', async (assert) => {
    assert.plan(2)

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
      assert.equal(message, 'E_MODEL_FORCE_DELETED: Cannot restore a model instance is was force deleted')
    }

    await User.truncate()
  })
})
