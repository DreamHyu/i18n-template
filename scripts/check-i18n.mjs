import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

import { collectProjectI18nKeys } from './sync-i18n.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const glossaryPath = path.join(projectRoot, 'src/i18n/glossary.json')

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sortKeys(keys) {
  return [...keys].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
}

async function loadTsDefaultExport(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath)
  const source = await readFile(absolutePath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: absolutePath,
  })

  const encoded = Buffer.from(outputText).toString('base64')
  const moduleUrl = `data:text/javascript;base64,${encoded}`
  const module = await import(moduleUrl)
  return module.default
}

function assertFlatLocale(localeName, messages, glossary) {
  assert.equal(typeof messages, 'object', `${localeName} should export an object`)
  assert.notEqual(messages, null, `${localeName} should not be null`)

  const keys = sortKeys(Object.keys(messages))
  assert.deepEqual(keys, glossary, `${localeName} keys should match glossary.json exactly`)

  for (const [key, value] of Object.entries(messages)) {
    assert.equal(typeof value, 'string', `${localeName}.${key} should be a string value`)
    assert.equal(key.includes('.'), false, `${localeName}.${key} should not contain dot notation`)
    assert.match(key, /[\u4e00-\u9fff]/, `${localeName}.${key} should be a Chinese key`)
  }
}

async function assertFileContains(relativePath, expectedFragments) {
  const content = await readFile(path.join(projectRoot, relativePath), 'utf8')

  for (const fragment of expectedFragments) {
    assert.match(content, new RegExp(escapeForRegex(fragment)), `${relativePath} should contain ${fragment}`)
  }
}

async function assertExplicitI18nUsage(relativePath, importPath) {
  const content = await readFile(path.join(projectRoot, relativePath), 'utf8')

  assert.match(
    content,
    new RegExp(`import\\s+\\{[^}]*\\bi18n\\b[^}]*\\}\\s+from\\s+['\"]${escapeForRegex(importPath)}['\"]`),
    `${relativePath} should explicitly import i18n from ${importPath}`,
  )
  assert.doesNotMatch(content, /\$t\(/, `${relativePath} should not use $t anymore`)
  assert.match(content, /i18n`/, `${relativePath} should use the tagged-template i18n helper`)
}

const discoveredKeys = await collectProjectI18nKeys({ projectRoot, mode: 'working-tree' })
const glossary = JSON.parse(await readFile(glossaryPath, 'utf8'))
const zhCN = await loadTsDefaultExport('src/i18n/locales/zh-CN.ts')
const enUS = await loadTsDefaultExport('src/i18n/locales/en-US.ts')
const i18nIndexContent = await readFile(path.join(projectRoot, 'src/i18n/index.ts'), 'utf8')
const mainContent = await readFile(path.join(projectRoot, 'src/main.ts'), 'utf8')

assert.ok(Array.isArray(glossary), 'glossary.json should export an array')
assert.deepEqual(glossary, sortKeys(new Set(glossary)), 'glossary.json should be sorted and deduplicated')
assert.deepEqual(glossary, discoveredKeys, 'glossary.json should match the keys discovered from source usage')
assert.ok(glossary.length > 0, 'glossary.json should not be empty')

assertFlatLocale('zh-CN', zhCN, glossary)
assertFlatLocale('en-US', enUS, glossary)

assert.match(i18nIndexContent, /export\s+const\s+i18nPlugin\s*=\s*createI18n/, 'src/i18n/index.ts should export i18nPlugin')
assert.match(i18nIndexContent, /export\s+function\s+i18n\s*\(/, 'src/i18n/index.ts should export the i18n helper')
assert.doesNotMatch(i18nIndexContent, /globalInjection:\s*true/, 'src/i18n/index.ts should not use implicit global injection')
assert.match(mainContent, /app\.use\(i18nPlugin\)/, 'src/main.ts should install i18nPlugin explicitly')

await assertFileContains('src/App.vue', ['应用眉标', '应用标题', '应用副标题', '应用主导航', '导航-首页', '导航-关于模板'])
await assertFileContains('src/components/LanguageSwitcher.vue', ['语言切换-标签', '语言切换-提示', '语言名称-简体中文', '语言名称-英文'])
await assertFileContains('src/views/HomeView.vue', ['首页-标题', '首页-描述', '通用-当前语言', '通用-回退语言', '首页-功能-回退机制'])
await assertFileContains('src/views/AboutView.vue', ['关于页-标题', '关于页-描述', '关于页-状态仓库语言标签', '关于页-国际化实例语言标签', '关于页-仅中文回退文案', '关于页-目录结构标题'])

await assertExplicitI18nUsage('src/App.vue', './i18n')
await assertExplicitI18nUsage('src/components/LanguageSwitcher.vue', '../i18n')
await assertExplicitI18nUsage('src/views/HomeView.vue', '../i18n')
await assertExplicitI18nUsage('src/views/AboutView.vue', '../i18n')

console.log('i18n verification passed')