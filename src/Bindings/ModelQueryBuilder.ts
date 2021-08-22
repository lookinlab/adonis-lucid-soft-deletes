/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import { Exception } from '@poppinss/utils'

/**
 * Raises exception when model not with soft delete
 */
function ensureModelWithSoftDeletes (model: LucidModel) {
  if (!('ignoreDeleted' in model && 'ignoreDeletedPaginate' in model)) {
    throw new Exception(`${model.name} model don't support Soft Deletes`, 500, 'E_MODEL_SOFT_DELETE')
  }
}

/**
 * Define SoftDeletes binding to ModelQueryBuilder
 */
export function extendModelQueryBuilder (builder: DatabaseContract['ModelQueryBuilder']) {
  builder.macro('restore', async function () {
    ensureModelWithSoftDeletes(this.model)
    await this.update({ deleted_at: null })
  })

  builder.macro('withTrashed', function () {
    ensureModelWithSoftDeletes(this.model)
    return this.model.disableIgnore(this)
  })

  builder.macro('onlyTrashed', function () {
    ensureModelWithSoftDeletes(this.model)
    return this.model.disableIgnore(this).whereNotNull('deleted_at')
  })
}
