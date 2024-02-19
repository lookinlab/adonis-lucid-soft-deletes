# Adonis Lucid Soft Deletes
> WIP for Adonis v6

[![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

This addon adds the functionality to soft deletes Lucid Models
> Works with `@adonisjs/lucid@^20.1.*`

## Introduction

Sometimes you may wish to "no-delete" a model from database.
When models are soft deleted, they are not actually removed from your database.
Instead, a `deleted_at` attribute is set on the model indicating the date
and time at which the model was "deleted".

:point_right: The SoftDeletes mixin will automatically add the `deleted_at` attribute
as Luxon / DateTime instance.

## Installation

Install it using `npm`, `yarn` or `pnpm`.

```bash
# npm
npm i adonis-lucid-soft-deletes

# yarn
yarn add adonis-lucid-soft-deletes

# pnpm
pnpm add adonis-lucid-soft-deletes
```

After install call `configure`:

```bash
node ace configure adonis-lucid-soft-deletes
```

## Usage

Make sure to register the provider inside `adonisrc.ts` file.

```ts
providers: [
  // ...
  () => import('adonis-lucid-soft-deletes/provider'),
]
```

You should add the `deleted_at` column to your database tables for models with soft deletes.

```ts
// migrations/1234566666_users.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // ...
      table.timestamp('deleted_at').nullable()
    })
  }
  // ...
}
```

### Applying Soft Deletes to a Model

```ts
import { compose } from '@adonisjs/core/helpers'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'

export default class User extends compose(BaseModel, SoftDeletes) {
  // ...columns and props
}
```

Now, when you call the `.delete()` method on the model, the `deleted_at` (`customDeletedAtColumn`) column
will be set to the current date and time. However, the model's database record will be left in the table.

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  /**
   * Delete user by id
   * DELETE /users/:id
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    
    return user // or response.noContent()
  }
}
```

> :boom: Soft delete only works for model instances. `await User.query().delete()` as before
will delete models from database

:point_right: When querying a model that uses soft deletes, the soft deleted models
will automatically be excluded from all query results.

To determine if a given model instance has been soft deleted, you may use the `.trashed` getter:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  /**
   * Get user by id
   * GET /users/:id
   */
  async show({ params }: HttpContext) {
    const user = await User.withTrashed().where('id', params.id).firstOrFail()
    if (user.trashed) {
      return response.forbidden()
    }
    return user
  }
}
```

### Set custom column name for `deletedAt`

```ts
import { compose } from '@adonisjs/core/helpers'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'

export default class User extends compose(BaseModel, SoftDeletes) {
  // ...columns and props

  @column.dateTime({ columnName: 'customDeletedAtColumn' })
  declare deletedAt: DateTime | null
}
```

### Restoring Soft Deleted Models

To restore a soft deleted model, you may call the `.restore()` method on a model instance.
Also, method `.restore()` exists after methods `.withTrashed()` and `.onlyTrashed()`
The `restore` method will set the model's `deleted_at` column to `null`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class TrashUsersController {
  /**
   * Update trashed user by id
   * PUT /trash/users/:id
   */
  async update({ params }: HttpContext) {
    const user = await User.withTrashed().where('id', params.id).firstOrFail()
    await user.restore()
    
    return user
    
    // or

    await User.withTrashed().where('id', params.id).restore()
    await User.query().withTrashed().where('id', params.id).restore()
  }
}
```

### Permanently Deleting Models

Sometimes you may need to truly remove a model from your database.
You may use the `.forceDelete()` method to permanently remove a soft deleted model from the database table:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  /**
   * Delete user by id
   * DELETE /users/:id
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.forceDelete()
    
    return response.noContent()
  }
}
```

### Including Soft Deleted Models

As noted above, soft deleted models will automatically be excluded from query results.
However, you may force soft deleted models to be included in a query's results
by calling the `.withTrashed()` method on the model:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  /**
   * Get a list users
   * GET /users?withTrashed=1
   */
  async index({ request }: HttpContext) {
    const usersQuery = request.input('withTrashed')
      ? User.withTrashed()
      : User.query()

    return usersQuery.exec()

    // or

    return User.query().if(request.input('withTrashed'), (query) => {
      query.withTrashed()
    }).exec()
  }
}
```

### Retrieving only Soft Deleted Models

The `.onlyTrashed()` method will retrieve **only** soft deleted models:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class TrashUsersController {
  /**
   * Get a list trashed users
   * GET /trash/users
   */
  async index({ request }: HttpContext) {
    return User.onlyTrashed().exec()
  }
}
```

### Soft Deletes methods

Methods `.withTrashed()`, `.onlyTrashed()` and `.restore()` also available
in ModelQueryBuilder for models with soft delete, example:

```ts
await User.query().withTrashed().exec()
await User.query().onlyTrashed().restore()
```

[npm-image]: https://img.shields.io/npm/v/adonis-lucid-soft-deletes?logo=npm&style=for-the-badge
[npm-url]: https://www.npmjs.com/package/adonis-lucid-soft-deletes

[license-image]: https://img.shields.io/npm/l/adonis-lucid-soft-deletes?style=for-the-badge&color=blueviolet
[license-url]: https://github.com/lookinlab/adonis-lucid-soft-deletes/blob/develop/LICENSE.md

[typescript-image]: https://img.shields.io/npm/types/adonis-lucid-soft-deletes?color=294E80&label=%20&logo=typescript&style=for-the-badge
[typescript-url]: https://github.com/lookinlab
