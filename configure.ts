/*
 * adonis-lucid-soft-deletes
 *
 * (c) Lookin Anton <alsd@lookinlab.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  await codemods.updateRcFile((rcFile) => {
    // rcFile.addCommand('adonis-lucid-filter/commands')
  })
}
