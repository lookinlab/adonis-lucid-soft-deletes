/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'
import { LucidModel, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import { Exception } from '@poppinss/utils'
import {
  column,
  beforeFind,
  beforeFetch,
  beforePaginate,
} from '@adonisjs/lucid/build/src/Orm/Decorators'

export function SoftDeletes<T extends NormalizeConstructor<LucidModel>> (superclass: T) {
  class ModelWithSoftDeletes extends superclass {
    @beforeFind()
    @beforeFetch()
    public static ignoreDeleted (query: ModelQueryBuilderContract<T, InstanceType<T>>): void {
      if (query['ignoreDeleted'] === false) {
        return
      }
      query.whereNull(`${query.model.table}.deleted_at`)
    }

    @beforePaginate()
    public static ignoreDeletedPaginate ([countQuery, query]): void {
      countQuery['ignoreDeleted'] = query['ignoreDeleted']
      this.ignoreDeleted(countQuery)
    }

    public static disableIgnore<Model extends typeof ModelWithSoftDeletes>(
      query: ModelQueryBuilderContract<Model>
    ): ModelQueryBuilderContract<Model> {
      if (query['ignoreDeleted'] === false) {
        return query
      }
      query['ignoreDeleted'] = false
      return query
    }

    /**
     * Fetch all models without filter by deleted_at
     */
    public static withTrashed<Model extends typeof ModelWithSoftDeletes>(
      this: Model
    ): ModelQueryBuilderContract<T, InstanceType<T>> {
      return this.disableIgnore(this.query())
    }

    /**
     * Fetch models only with deleted_at
     */
    public static onlyTrashed<Model extends typeof ModelWithSoftDeletes>(
      this: Model
    ): ModelQueryBuilderContract<Model, InstanceType<Model>> {
      return this.disableIgnore(this.query()).whereNotNull('deleted_at')
    }

    /**
     * Force delete instance property
     */
    public $forceDelete = false

    /**
     * Soft deleted property
     */
    @column.dateTime()
    public deletedAt: DateTime | null

    /**
     * Computed trashed property
     */
    public get trashed (): boolean {
      return this.deletedAt !== null
    }

    /**
     * Override default $getQueryFor method
     */
    public $getQueryFor (
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
    public async delete (): Promise<void> {
      await super.delete()
      this.$isDeleted = this.$forceDelete
    }

    /**
     * Restore model
     */
    public async restore (): Promise<this> {
      if (this.$isDeleted) {
        throw new Exception('Cannot restore a model instance is was force deleted', 500, 'E_MODEL_FORCE_DELETED')
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
    public async forceDelete (): Promise<void> {
      this.$forceDelete = true
      await this.delete()
    }
  }
  return ModelWithSoftDeletes
}
