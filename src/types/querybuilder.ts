/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@adonisjs/lucid/types/model' {
  export type ModelWithSoftDeletes = LucidModel & {
    ignoreDeleted(query: any): void
    ignoreDeletedPaginate([countQuery, query]: [any, any]): void
    disableIgnore(query: any): any
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
