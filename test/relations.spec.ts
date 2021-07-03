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
})
