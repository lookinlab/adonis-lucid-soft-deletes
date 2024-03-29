/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../src/types/querybuilder.ts" />

import type { ApplicationService } from '@adonisjs/core/types'
import { extendModelQueryBuilder } from '../src/bindings/model_query_builder.js'

export default class LucidSoftDeletesProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const { ModelQueryBuilder } = await this.app.import('@adonisjs/lucid/orm')
    extendModelQueryBuilder(ModelQueryBuilder)
  }
}
