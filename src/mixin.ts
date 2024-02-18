/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'
import { Exception } from '@poppinss/utils'
import { column, beforeFind, beforeFetch, beforePaginate, BaseModel } from '@adonisjs/lucid/orm'

type ModelQueryBuilderContractWithIgnoreDeleted<
  T extends LucidModel,
  R = InstanceType<T>,
> = ModelQueryBuilderContract<T, R> & {
  ignoreDeleted: boolean
}

export function SoftDeletes<T extends NormalizeConstructor<typeof BaseModel>>(superclass: T) {
  class ModelWithSoftDeletes extends superclass {
    @beforeFind()
    @beforeFetch()
    static ignoreDeleted<Model extends typeof ModelWithSoftDeletes>(
      query: ModelQueryBuilderContractWithIgnoreDeleted<Model, InstanceType<Model>>
    ): void {
      if (query['ignoreDeleted'] === false) {
        return
      }
      const isGroupLimitQuery = query.clone().toQuery().includes('adonis_group_limit_counter')
      const deletedAtColumn = query.model.$getColumn('deletedAt')?.columnName

      const queryIgnoreDeleted = isGroupLimitQuery ? (query.knexQuery as any)['_single'].table : query

      queryIgnoreDeleted.whereNull(`${query.model.table}.${deletedAtColumn}`)
    }

    @beforePaginate()
    static ignoreDeletedPaginate<Model extends typeof ModelWithSoftDeletes>([countQuery, query]: [
      ModelQueryBuilderContractWithIgnoreDeleted<Model, InstanceType<Model>>,
      ModelQueryBuilderContractWithIgnoreDeleted<Model, InstanceType<Model>>,
    ]): void {
      countQuery['ignoreDeleted'] = query['ignoreDeleted']
      this.ignoreDeleted(countQuery)
    }

    static disableIgnore<Model extends typeof ModelWithSoftDeletes, Result = InstanceType<Model>>(
      this: Model,
      query: ModelQueryBuilderContractWithIgnoreDeleted<Model, Result>
    ): ModelQueryBuilderContractWithIgnoreDeleted<Model, Result> {
      if (query['ignoreDeleted'] === false) {
        return query
      }
      query['ignoreDeleted'] = false
      return query
    }

    /**
     * Fetch all models without filter by deleted_at
     */
    static withTrashed<Model extends typeof ModelWithSoftDeletes>(
      this: Model
    ): ModelQueryBuilderContractWithIgnoreDeleted<Model, InstanceType<T>> {
      const query = this.query() as ModelQueryBuilderContractWithIgnoreDeleted<
        Model,
        InstanceType<Model>
      >
      return this.disableIgnore(query)
    }

    /**
     * Fetch models only with deleted_at
     */
    static onlyTrashed<Model extends typeof ModelWithSoftDeletes>(
      this: Model
    ): ModelQueryBuilderContractWithIgnoreDeleted<Model, InstanceType<Model>> {
      const query = this.query() as ModelQueryBuilderContractWithIgnoreDeleted<
        Model,
        InstanceType<Model>
      >

      const deletedAtColumn = query.model.$getColumn('deletedAt')?.columnName
      return this.disableIgnore(query).whereNotNull(`${query.model.table}.${deletedAtColumn}`)
    }

    /**
     * Force delete instance property
     */
    $forceDelete = false

    /**
     * Soft deleted property
     */
    @column.dateTime()
    declare deletedAt?: DateTime | null

    /**
     * Computed trashed property
     */
    get trashed(): boolean {
      return this.deletedAt !== null
    }

    /**
     * Override default $getQueryFor method
     */
    $getQueryFor(
      action: 'insert' | 'update' | 'delete' | 'refresh',
      client: QueryClientContract
    ): any {
      /**
       * Soft Delete
       */
      const softDelete = async (): Promise<void> => {
        this.deletedAt = DateTime.local()
        await this.save()
      }

      if (action === 'delete' && !this.$forceDelete) {
        return { del: softDelete, delete: softDelete }
      }
      if (action === 'insert') {
        return super.$getQueryFor(action, client)
      }
      return super.$getQueryFor(action, client)
    }

    /**
     * Override default delete method
     */
    async delete(): Promise<void> {
      await super.delete()
      this.$isDeleted = this.$forceDelete
    }

    /**
     * Restore model
     */
    async restore(): Promise<this> {
      if (this.$isDeleted) {
        throw new Exception('Cannot restore a model instance is was force deleted', {
          code: 'E_MODEL_FORCE_DELETED',
          status: 500,
        })
      }
      if (!this.trashed) {
        return this
      }
      this.deletedAt = null
      await this.save()

      return this
    }

    /**
     * Force delete model
     */
    async forceDelete(): Promise<void> {
      this.$forceDelete = true
      await this.delete()
    }
  }
  return ModelWithSoftDeletes
}
