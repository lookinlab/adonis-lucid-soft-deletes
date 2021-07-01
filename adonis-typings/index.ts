/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/LucidSoftDeletes' {
  import { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'
  import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
  import { DateTime } from 'luxon'
  import { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
  import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'

  export interface SoftDeletesMixin {
    <T extends NormalizeConstructor<LucidModel>>(superclass: T): {
      new (...args: any[]): {
        $forceDelete: boolean
        deletedAt: DateTime | null
        readonly trashed: boolean
        /**
         * Override default $getQueryFor for soft delete
         */
        $getQueryFor(
          action: 'insert',
          client: QueryClientContract
        ): ReturnType<QueryClientContract['insertQuery']>
        $getQueryFor(
          action: 'update' | 'delete' | 'refresh',
          client: QueryClientContract
        ): ModelQueryBuilderContract<T>
        /**
         * Override default delete method with save hooks
         */
        delete(): Promise<void>
        /**
         * Restore model
         */
        restore(): Promise<any>
        /**
         * Force delete model
         */
        forceDelete(): Promise<void>
      }
      boot(): void
      $ignoreDeleted: boolean
      disableIgnore(): void
      /**
       * Fetch all models without filter by deleted_at
       */
      withTrashed<
        Model extends LucidModel & T,
        Result = InstanceType<Model>
      >(this: Model): ModelQueryBuilderContract<Model, Result>;
      /**
       * Fetch models only with deleted_at
       */
      onlyTrashed<
        Model extends LucidModel & T
      >(this: Model): ModelQueryBuilderContract<Model, InstanceType<Model>>;
    } & T
  }
  export const SoftDeletes: SoftDeletesMixin
}

