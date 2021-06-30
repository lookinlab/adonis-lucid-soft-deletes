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
}
