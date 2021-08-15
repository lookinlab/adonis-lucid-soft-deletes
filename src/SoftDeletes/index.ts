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

export function SoftDeletes<T extends NormalizeConstructor<LucidModel>> (superclass: T) {
  class ModelWithSoftDeletes extends superclass {
    public static $ignoreDeleted = true

    public static boot (): void {
      if (this.booted === true) {
        return
      }
      super.boot()

      /**
       * Add column deleted_at
       */
      this.$addColumn('deletedAt', {})

      /**
       * Ignore deleted handle
       */
      const ignoreDeleted = (query: ModelQueryBuilderContract<T, InstanceType<T>>): void => {
        if (!this.$ignoreDeleted) {
          return
        }
        query.whereNull('deleted_at')
      }
      this.before('find', ignoreDeleted)
      this.before('fetch', ignoreDeleted)
      this.before('paginate', ([countQuery]) => ignoreDeleted(countQuery))

      /**
       * Force enable ignore after every find/fetch
       */
      const enableIgnore = (): void => {
        if (this.$ignoreDeleted) {
          return
        }
        this.$ignoreDeleted = true
      }
      this.after('find', enableIgnore)
      this.after('fetch', enableIgnore)
    }

    public static disableIgnore (): void {
      if (!this.$ignoreDeleted) {
        return
      }
      this.$ignoreDeleted = false
    }

    /**
     * Fetch all models without filter by deleted_at
     */
    public static withTrashed<
      Model extends typeof ModelWithSoftDeletes,
      Result = InstanceType<Model>
    >(this: Model): ModelQueryBuilderContract<Model, Result> {
      this.disableIgnore()
      return this.query()
    }

    /**
     * Fetch models only with deleted_at
     */
    public static onlyTrashed<Model extends typeof ModelWithSoftDeletes>(
      this: Model
    ): ModelQueryBuilderContract<Model, InstanceType<Model>> {
      this.disableIgnore()
      return this.query().whereNotNull('deleted_at')
    }

    /**
     * Force delete instance property
     */
    public $forceDelete = false

    /**
     * Soft deleted property
     */
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
