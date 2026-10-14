/**
 * Fork test entry point: every upstream suite the built-in deployment can run.
 *
 * `node --test test/*.test.mjs` would also pick up the suites below, which
 * belong to the upstream package's own release pipeline and cannot pass here:
 * they need the upstream dev dependencies that a built-in fork does not install,
 * or they assert the npm self-update flow this fork replaced with the built-in
 * "ships with the app" policy. They stay in the tree, untouched, so a future
 * upstream refresh keeps them; the fork's own coverage lives in the suites that
 * do run (client UI, localization, channels, Feishu registration, package).
 */
import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/** Suites the built-in fork does not run, with the reason. */
const EXCLUDED = new Map([
  ['host.test.mjs', 'imports the upstream Host dev dependencies (@deepseek-ai/cordis …); the packaged Host smoke is verify-profile-boot.mjs in dsh-plugin-desktop'],
  ['update-service.test.mjs', 'asserts the upstream npm self-update service, which the built-in fork replaces with the "ships with the app" policy'],
  ['update-ui.test.mjs', 'asserts the upstream npm self-update UI, which the built-in fork replaces with the "ships with the app" policy'],
])

const testDirectory = new URL('../test/', import.meta.url)
const suites = readdirSync(testDirectory)
  .filter((name) => name.endsWith('.test.mjs') && !EXCLUDED.has(name))
  .sort()
  .map((name) => fileURLToPath(new URL(name, testDirectory)))

if (suites.length === 0) {
  process.stderr.write('dsh-plugin-im: no test suites selected\n')
  process.exit(1)
}
process.stdout.write(`dsh-plugin-im: running ${suites.length} suites, skipping ${EXCLUDED.size}\n`)
for (const [name, reason] of EXCLUDED) process.stdout.write(`  skipped ${name} — ${reason}\n`)

const result = spawnSync(process.execPath, ['--test', ...suites], { stdio: 'inherit' })
process.exit(result.status ?? 1)
