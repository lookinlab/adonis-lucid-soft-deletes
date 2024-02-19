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

  type ExcludeSoftDeletesMethods<Methods, Model> = {
    [Method in keyof Methods]: Model extends ModelWithSoftDeletes ? Methods[Method] : never
  }

  type SoftDeletesMethods<Model extends LucidModel> = {
    withTrashed(): ModelQueryBuilderContract<Model>
    onlyTrashed(): ModelQueryBuilderContract<Model>
    restore(): Promise<void>
  }

  export interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>>
    extends ExcludeSoftDeletesMethods<SoftDeletesMethods<Model>, Model> {}
}
