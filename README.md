# Adonis Lucid Soft Deletes

[![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

This addon adds the functionality to soft deletes Lucid Models
> Works with `@adonisjs/lucid@^15.*.*`

## Introduction

Sometimes you may wish to "no-delete" a model from database.
When models are soft deleted, they are not actually removed from your database.
Instead, a `deleted_at` attribute is set on the model indicating the date
and time at which the model was "deleted".

:point_right: The SoftDeletes mixin will automatically add the `deleted_at` attribute
as Luxon / DateTime instance.

## Installation

Install it using `npm` or `yarn`.

```bash
# npm
npm i adonis-lucid-soft-deletes
node ace configure adonis-lucid-soft-deletes

# yarn
yarn add adonis-lucid-soft-deletes
node ace configure adonis-lucid-soft-deletes
```

## Usage

Make sure to register the provider inside `.adonisrc.json` file.

```json
{
  "providers": [
    "...other packages",
    "adonis-lucid-soft-deletes"
  ] 
}
```

For TypeScript projects add to `tsconfig.json` file:
```json
{
  "compilerOptions": {
    "types": [
      "...other packages",
      "adonis-lucid-soft-deletes"
    ]
  } 
}
```

You should also add the `deleted_at` column to your database tables for models with soft deletes.

```ts
// migrations/1234566666_users.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      // ...
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }
  // ...
}
```

### Applying Soft Deletes to a Model

```ts
import { compose } from '@ioc:Adonis/Core/Helpers'
import { SoftDeletes } from '@ioc:Adonis/Addons/LucidSoftDeletes'

export default class User extends compose(BaseModel, SoftDeletes) {
  // ...columns and props
}
```

Now, when you call the `.delete()` method on the model, the `deleted_at` column
will be set to the current date and time. However, the model's database record will be left in the table.

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  /**
   * Delete user by id
   * DELETE /users/:id
   */
  public async destroy({ params, response }: HttpContextContract) {
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
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  /**
   * Get user by id
   * GET /users/:id
   */
  public async show({ params }: HttpContextContract) {
    const user = await User.withTrashed().where('id', params.id).firstOrFail()
    if (user.trashed) {
      return response.forbidden()
    }
    return user
  }
}
```

### Restoring Soft Deleted Models

To restore a soft deleted model, you may call the `.restore()` method on a model instance.
Also, method `.restore()` exists after methods `.withTrashed()` and `.onlyTrashed()`
The `restore` method will set the model's `deleted_at` column to `null`:

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class TrashUsersController {
  /**
   * Update trashed user by id
   * PUT /trash/users/:id
   */
  public async update({ params }: HttpContextContract) {
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
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  /**
   * Delete user by id
   * DELETE /users/:id
   */
  public async destroy({ params, response }: HttpContextContract) {
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
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  /**
   * Get a list users
   * GET /users?withTrashed=1
   */
  public async index({ request }: HttpContextContract) {
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
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class TrashUsersController {
  /**
   * Get a list trashed users
   * GET /trash/users
   */
  public async index({ request }: HttpContextContract) {
    return User.onlyTrashed().exec()
  }
}
```

### Soft Deletes methods

Methods `.withTrashed()`, `.onlyTrashed()` and `.restore()` also available
in QueryBuilder for models with soft delete, example:

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
