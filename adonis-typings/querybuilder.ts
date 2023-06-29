/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Lucid/Orm' {
  import type { LucidModel } from '@ioc:Adonis/Lucid/Orm'

  type ModelWithSoftDeletes = LucidModel & {
    ignoreDeleted(query): void,
    ignoreDeletedPaginate([countQuery, query]): void
  }

  type ExcludeMethods<Type, Model> = {
    [Method in keyof Type]: Model extends ModelWithSoftDeletes ? Type[Method] : never
  }

  interface SoftDeletesMethods<Model extends LucidModel, Result = InstanceType<Model>> {
    withTrashed(): ModelQueryBuilderContract<Model, Result>
    onlyTrashed(): ModelQueryBuilderContract<Model, Result>
    restore(): Promise<void>
  }

  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>>
    extends ExcludeMethods<SoftDeletesMethods<Model, Result>, Model> {}
}
