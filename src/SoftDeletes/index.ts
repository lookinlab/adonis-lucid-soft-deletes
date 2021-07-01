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
    public static onlyTrashed<
      Model extends typeof ModelWithSoftDeletes
    >(this: Model): ModelQueryBuilderContract<Model, InstanceType<Model>> {
      this.disableIgnore()
      return this.query().whereNotNull('deleted_at')
    }

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
     * Override default delete method
     */
    public async delete (): Promise<void> {
      const Model = this.constructor as typeof ModelWithSoftDeletes
      const successMessage = 'Soft delete is successful'

      /**
       * Before delete handler
       */
      const beforeDelete = async (model: ModelWithSoftDeletes) => {
        model.deletedAt = DateTime.local()
        await model.save()

        throw successMessage
      }

      try {
        Model.$hooks.add('before', 'delete', beforeDelete)
        await super.delete()
      } catch (error) {
        if (error !== successMessage) {
          throw error
        }
      } finally {
        Model.$hooks.remove('before', 'delete', beforeDelete)
      }
    }

    /**
     * Restore model
     */
    public async restore (): Promise<this> {
      this.deletedAt = null
      await this.save()

      this.$isDeleted = false
      return this
    }

    /**
     * Force delete model
     */
    public async forceDelete (): Promise<void> {
      return super.delete()
    }
  }
  return ModelWithSoftDeletes
}
