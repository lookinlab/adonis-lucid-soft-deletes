/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <lookin@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { SoftDeletes } from '../src/SoftDeletes'
import { Exception } from '@poppinss/utils'

/**
 * Provider to register lucid soft deletes
 */
export default class LucidSoftDeletesProvider {
  public static needsApplication = true
  constructor (protected app: ApplicationContract) {}

  public register (): void {
    this.app.container.singleton('Adonis/Addons/LucidSoftDeletes', () => {
      return { SoftDeletes }
    })
  }

  public boot (): void {
    const { ModelQueryBuilder } = this.app.container.use('Adonis/Lucid/Database')

    ModelQueryBuilder.macro('restore', async function () {
      if (!('$ignoreDeleted' in this.model)) {
        throw new Exception(`${this.model.name} model don't support Soft Deletes`, 500, 'E_MODEL_SOFT_DELETE')
      }
      await this.update({ deleted_at: null })
    })
  }
}
