/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Lucid/Orm' {
  type ModelWithSoftDeletes = LucidModel & {
    $ignoreDeleted: boolean
    disableIgnore(): void
  }

  type ExcludeTypeMethods<Type, Model> = {
    [Method in keyof Type as Model extends ModelWithSoftDeletes ? Method : never]: Type[Method]
  }

  interface SoftDeletesMethods<Model extends LucidModel, Result = InstanceType<Model>> {
    withTrashed(): ModelQueryBuilderContract<Model, Result>
    onlyTrashed(): ModelQueryBuilderContract<Model, Result>
    restore(): Promise<void>
  }

  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>>
    extends ExcludeTypeMethods<SoftDeletesMethods<Model, Result>, Model> {}
}
