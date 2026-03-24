import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { MANAGED_I18N_FILES, syncI18n } from './sync-i18n.mjs'

function sortKeys(keys) {
  return [...keys].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
}

async function createProjectFixture() {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'sync-i18n-'))

  await mkdir(path.join(rootDir, 'src/components'), { recursive: true })
  await mkdir(path.join(rootDir, 'src/i18n/locales'), { recursive: true })
  await mkdir(path.join(rootDir, 'src/types'), { recursive: true })

  await writeFile(
    path.join(rootDir, 'src/components/Example.vue'),
    `<script setup lang="ts">
const localeLabelKeys = {
  'zh-CN': '语言名称-简体中文',
  'en-US': '语言名称-英文',
}

const currentLabel = '新增词条'
</script>

<template>
  <div :aria-label="i18n\`模板提示\`">
    {{ i18n\`语言名称-简体中文\` }}
    {{ i18n\`\${localeLabelKeys['en-US']}\` }}
    {{ i18n\`\${currentLabel}\` }}
    <!-- {{ i18n\`注释词条\` }} -->
    <span>i18n\`纯文本词条\`</span>
  </div>
</template>
`,
    'utf8',
  )

  await writeFile(
    path.join(rootDir, MANAGED_I18N_FILES[0]),
    `${JSON.stringify(['冗余词条', '语言名称-简体中文'], null, 2)}\n`,
    'utf8',
  )

  await writeFile(
    path.join(rootDir, MANAGED_I18N_FILES[1]),
    `import type { FlatLocaleMessages } from '../../types/i18n'

const zhCN = {
  '冗余词条': '旧值',
  '语言名称-简体中文': '简体中文',
} as const satisfies FlatLocaleMessages

export default zhCN
`,
    'utf8',
  )

  await writeFile(
    path.join(rootDir, MANAGED_I18N_FILES[2]),
    `import type { FlatLocaleMessages } from '../../types/i18n'

const enUS = {
  '冗余词条': 'old value',
  '语言名称-简体中文': 'Simplified Chinese',
} as const satisfies FlatLocaleMessages

export default enUS
`,
    'utf8',
  )

  await writeFile(
    path.join(rootDir, 'src/types/i18n.ts'),
    `export type FlatLocaleMessages = Readonly<Record<string, string>>
`,
    'utf8',
  )

  return rootDir
}

test('syncI18n scans template expressions without collecting comment or plain-text false positives', async () => {
  const projectRoot = await createProjectFixture()

  await syncI18n({
    projectRoot,
    mode: 'working-tree',
  })

  const glossary = JSON.parse(await readFile(path.join(projectRoot, MANAGED_I18N_FILES[0]), 'utf8'))
  assert.deepEqual(glossary, sortKeys(['模板提示', '新增词条', '语言名称-简体中文', '语言名称-英文']))
  assert.equal(glossary.includes('注释词条'), false)
  assert.equal(glossary.includes('纯文本词条'), false)

  const zhCN = await readFile(path.join(projectRoot, MANAGED_I18N_FILES[1]), 'utf8')
  assert.match(zhCN, /'模板提示': '模板提示'/)
  assert.match(zhCN, /'新增词条': '新增词条'/)
  assert.match(zhCN, /'语言名称-简体中文': '简体中文'/)
  assert.doesNotMatch(zhCN, /冗余词条/)
  assert.doesNotMatch(zhCN, /注释词条/)
  assert.doesNotMatch(zhCN, /纯文本词条/)

  const enUS = await readFile(path.join(projectRoot, MANAGED_I18N_FILES[2]), 'utf8')
  assert.match(enUS, /'模板提示': '模板提示'/)
  assert.match(enUS, /'新增词条': '新增词条'/)
  assert.match(enUS, /'语言名称-简体中文': 'Simplified Chinese'/)
  assert.doesNotMatch(enUS, /冗余词条/)
  assert.doesNotMatch(enUS, /注释词条/)
  assert.doesNotMatch(enUS, /纯文本词条/)
})

test('syncI18n rejects complex dynamic keys that cannot be statically resolved', async () => {
  const projectRoot = await createProjectFixture()

  await writeFile(
    path.join(projectRoot, 'src/components/Example.vue'),
    `<script setup lang="ts">
const prefix = '语言'
</script>

<template>
  <div>{{ i18n\`\${prefix}-名称\` }}</div>
</template>
`,
    'utf8',
  )

  await assert.rejects(
    () =>
      syncI18n({
        projectRoot,
        mode: 'working-tree',
      }),
    /无法静态解析|statically resolve/i,
  )
})

test('syncI18n staged mode reads staged source and ignores unstaged source edits', async () => {
  const projectRoot = await createProjectFixture()
  const stagedFiles = {
    'src/components/Example.vue': await readFile(path.join(projectRoot, 'src/components/Example.vue'), 'utf8'),
  }

  await writeFile(
    path.join(projectRoot, 'src/components/Example.vue'),
    `<script setup lang="ts">
const currentLabel = '未暂存词条'
</script>

<template>
  <div>{{ i18n\`\${currentLabel}\` }}</div>
</template>
`,
    'utf8',
  )

  await syncI18n({
    projectRoot,
    mode: 'staged',
    stagedFiles,
  })

  const glossary = JSON.parse(await readFile(path.join(projectRoot, MANAGED_I18N_FILES[0]), 'utf8'))
  assert.deepEqual(glossary, sortKeys(['模板提示', '新增词条', '语言名称-简体中文', '语言名称-英文']))
})

test('syncI18n staged mode fails when managed files have unstaged changes', async () => {
  const projectRoot = await createProjectFixture()
  const stagedFiles = {
    'src/components/Example.vue': await readFile(path.join(projectRoot, 'src/components/Example.vue'), 'utf8'),
  }

  await writeFile(
    path.join(projectRoot, MANAGED_I18N_FILES[0]),
    `${JSON.stringify(['手工改动'], null, 2)}\n`,
    'utf8',
  )

  await assert.rejects(
    () =>
      syncI18n({
        projectRoot,
        mode: 'staged',
        stagedFiles,
        unstagedManagedFiles: [MANAGED_I18N_FILES[0]],
      }),
    /未暂存|unstaged/i,
  )
})

test('syncI18n check mode reports pending changes without writing files', async () => {
  const projectRoot = await createProjectFixture()
  const before = await readFile(path.join(projectRoot, MANAGED_I18N_FILES[0]), 'utf8')

  await assert.rejects(
    () =>
      syncI18n({
        projectRoot,
        mode: 'working-tree',
        check: true,
      }),
    /需要同步|out of date/i,
  )

  const after = await readFile(path.join(projectRoot, MANAGED_I18N_FILES[0]), 'utf8')
  assert.equal(after, before)
})
