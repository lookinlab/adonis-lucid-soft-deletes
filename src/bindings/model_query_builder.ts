/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../types/querybuilder.ts" />

import type {
  LucidModel,
  ModelQueryBuilderContract,
  ModelWithSoftDeletes,
} from '@adonisjs/lucid/types/model'

import { Exception } from '@poppinss/utils'

/**
 * Raises exception when model not with soft delete
 */
function ensureModelWithSoftDeletes(model: LucidModel) {
  if (!('ignoreDeleted' in model && 'ignoreDeletedPaginate' in model)) {
    throw new Exception(`${model.name} model don't support Soft Deletes`, {
      code: 'E_MODEL_SOFT_DELETE',
      status: 500,
    })
  }
}

/**
 * Define SoftDeletes binding to ModelQueryBuilder
 */
export function extendModelQueryBuilder(builder: any) {
  builder.macro('restore', async function (this: ModelQueryBuilderContract<LucidModel>) {
    ensureModelWithSoftDeletes(this.model)

    const deletedAtColumn = this.model.$getColumn('deletedAt')?.columnName
    if (!deletedAtColumn) return

    await this.update({ [deletedAtColumn]: null })
  })

  builder.macro('withTrashed', function (this: ModelQueryBuilderContract<ModelWithSoftDeletes>) {
    ensureModelWithSoftDeletes(this.model)
    return this.model.disableIgnore(this)
  })

  builder.macro('onlyTrashed', function (this: ModelQueryBuilderContract<ModelWithSoftDeletes>) {
    ensureModelWithSoftDeletes(this.model)

    const deletedAtColumn = this.model.$getColumn('deletedAt')?.columnName
    return this.model.disableIgnore(this).whereNotNull(`${this.model.table}.${deletedAtColumn}`)
  })
}
