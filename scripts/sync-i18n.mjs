import { access, readFile, readdir, writeFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { NodeTypes, parse as parseTemplate } from '@vue/compiler-dom'
import { parse as parseSfc } from '@vue/compiler-sfc'
import ts from 'typescript'

const SOURCE_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx'])
export const MANAGED_I18N_FILES = [
  'src/i18n/glossary.json',
  'src/i18n/locales/zh-CN.ts',
  'src/i18n/locales/en-US.ts',
]

function git(projectRoot, ...args) {
  try {
    return execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : ''
    throw new Error(stderr || `Git command failed: git ${args.join(' ')}`)
  }
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/')
}

function normalizeStagedFiles(stagedFiles) {
  if (!stagedFiles) {
    return null
  }

  const entries = stagedFiles instanceof Map ? [...stagedFiles.entries()] : Object.entries(stagedFiles)
  return new Map(entries.map(([relativePath, content]) => [normalizeRelativePath(relativePath), content]))
}

function parseNullSeparated(output) {
  return output
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sortKeys(keys) {
  return [...keys].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
}

function escapeSingleQuotedString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function formatGlossary(keys) {
  return `${JSON.stringify(sortKeys(keys), null, 2)}\n`
}

function formatLocaleSource(variableName, messages) {
  const lines = [
    "import type { FlatLocaleMessages } from '../../types/i18n'",
    '',
    `const ${variableName} = {`,
  ]

  for (const key of sortKeys(Object.keys(messages))) {
    const value = messages[key]
    lines.push(`  '${escapeSingleQuotedString(key)}': '${escapeSingleQuotedString(value)}',`)
  }

  lines.push(`} as const satisfies FlatLocaleMessages`)
  lines.push('')
  lines.push(`export default ${variableName}`)
  lines.push('')

  return lines.join('\n')
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

function unwrapExpression(node) {
  let current = node

  while (
    current
    && (
      ts.isAsExpression(current)
      || ts.isParenthesizedExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isTypeAssertionExpression(current)
      || ts.isNonNullExpression(current)
    )
  ) {
    current = current.expression
  }

  return current
}

function evaluateLiteral(node) {
  const current = unwrapExpression(node)

  if (!current) {
    return undefined
  }

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text
  }

  return undefined
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text
  }

  return undefined
}

function evaluateObjectLiteral(node) {
  const current = unwrapExpression(node)
  const objectValue = new Map()

  if (!current || !ts.isObjectLiteralExpression(current)) {
    return objectValue
  }

  for (const property of current.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue
    }

    const propertyName = getPropertyName(property.name)
    const propertyValue = evaluateLiteral(property.initializer)

    if (propertyName !== undefined && propertyValue !== undefined) {
      objectValue.set(propertyName, propertyValue)
    }
  }

  return objectValue
}

function getScriptKind(fileName) {
  if (fileName.endsWith('.tsx')) {
    return ts.ScriptKind.TSX
  }

  if (fileName.endsWith('.jsx')) {
    return ts.ScriptKind.JSX
  }

  if (fileName.endsWith('.js')) {
    return ts.ScriptKind.JS
  }

  if (fileName.endsWith('.jsx')) {
    return ts.ScriptKind.JSX
  }

  return ts.ScriptKind.TSX
}

function createTypeScriptSourceFile(fileName, content) {
  return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, getScriptKind(fileName))
}

function collectBindingsFromScript(scriptText, fileName) {
  const bindings = new Map()
  const sourceFile = createTypeScriptSourceFile(fileName, scriptText)

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    if ((ts.getCombinedNodeFlags(statement.declarationList) & ts.NodeFlags.Const) === 0) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue
      }

      const stringValue = evaluateLiteral(declaration.initializer)
      if (stringValue !== undefined) {
        bindings.set(declaration.name.text, stringValue)
        continue
      }

      const objectValue = evaluateObjectLiteral(declaration.initializer)
      if (objectValue.size > 0) {
        bindings.set(declaration.name.text, objectValue)
      }
    }
  }

  return bindings
}

function resolveExpression(node, bindings, relativePath, rawTemplate) {
  const current = unwrapExpression(node)

  if (!current) {
    throw new Error(`无法静态解析 ${relativePath} 中的 i18n key: i18n\`${rawTemplate}\``)
  }

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return [current.text]
  }

  if (ts.isIdentifier(current)) {
    const value = bindings.get(current.text)
    if (typeof value === 'string') {
      return [value]
    }
  }

  if (ts.isPropertyAccessExpression(current)) {
    const objectValue = bindings.get(current.expression.getText())
    if (objectValue instanceof Map && objectValue.has(current.name.text)) {
      return [objectValue.get(current.name.text)]
    }
  }

  if (ts.isElementAccessExpression(current)) {
    const objectValue = bindings.get(current.expression.getText())
    if (objectValue instanceof Map && current.argumentExpression) {
      const propertyName = evaluateLiteral(current.argumentExpression)
      if (propertyName !== undefined && objectValue.has(propertyName)) {
        return [objectValue.get(propertyName)]
      }

      const resolvedPropertyName = resolveExpressionToSingleString(current.argumentExpression, bindings)
      if (resolvedPropertyName !== undefined && objectValue.has(resolvedPropertyName)) {
        return [objectValue.get(resolvedPropertyName)]
      }

      return sortKeys(new Set(objectValue.values()))
    }
  }

  throw new Error(`无法静态解析 ${relativePath} 中的 i18n key: i18n\`${rawTemplate}\``)
}

function resolveExpressionToSingleString(node, bindings) {
  const current = unwrapExpression(node)

  if (!current) {
    return undefined
  }

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text
  }

  if (ts.isIdentifier(current)) {
    const value = bindings.get(current.text)
    return typeof value === 'string' ? value : undefined
  }

  return undefined
}

function extractKeysFromTaggedTemplateExpression(node, sourceFile, bindings, relativePath) {
  if (!ts.isIdentifier(node.tag) || node.tag.text !== 'i18n') {
    return []
  }

  if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
    return [node.template.text]
  }

  const rawTemplate = node.template.getText(sourceFile).slice(1, -1)

  if (
    ts.isTemplateExpression(node.template)
    && node.template.head.text === ''
    && node.template.templateSpans.length === 1
    && node.template.templateSpans[0].literal.text === ''
  ) {
    return resolveExpression(node.template.templateSpans[0].expression, bindings, relativePath, rawTemplate)
  }

  throw new Error(`无法静态解析 ${relativePath} 中的复杂 i18n key: i18n\`${rawTemplate}\``)
}

function collectI18nKeysFromAst(sourceFile, bindings, relativePath) {
  const keys = []

  function visit(node) {
    if (ts.isTaggedTemplateExpression(node)) {
      keys.push(...extractKeysFromTaggedTemplateExpression(node, sourceFile, bindings, relativePath))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return keys
}

function extractI18nKeysFromScript(scriptText, fileName, bindings, relativePath) {
  const sourceFile = createTypeScriptSourceFile(fileName, scriptText)
  return collectI18nKeysFromAst(sourceFile, bindings, relativePath)
}

function extractI18nKeysFromExpression(expressionText, fileName, bindings, relativePath) {
  const wrappedSource = `(${expressionText})`
  const sourceFile = createTypeScriptSourceFile(fileName, wrappedSource)
  return collectI18nKeysFromAst(sourceFile, bindings, relativePath)
}

function collectBindingsForVueFile(relativePath, descriptor) {
  const bindings = new Map()
  const scriptBlocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean)

  for (const block of scriptBlocks) {
    const fileName = `${relativePath}.${block.attrs.lang ?? 'ts'}`
    for (const [name, value] of collectBindingsFromScript(block.content, fileName)) {
      bindings.set(name, value)
    }
  }

  return bindings
}

function extractI18nKeysFromVueTemplate(templateContent, bindings, relativePath) {
  const templateAst = parseTemplate(templateContent, {
    comments: true,
  })
  const keys = []

  function visit(node) {
    if (!node || typeof node !== 'object') {
      return
    }

    if (node.type === NodeTypes.INTERPOLATION) {
      keys.push(...extractI18nKeysFromExpression(node.content.content, `${relativePath}.template.ts`, bindings, relativePath))
    }

    if (node.type === NodeTypes.ELEMENT) {
      for (const prop of node.props) {
        if (prop.type !== NodeTypes.DIRECTIVE) {
          continue
        }

        if (prop.exp && prop.exp.type === NodeTypes.SIMPLE_EXPRESSION && prop.exp.content.trim()) {
          keys.push(...extractI18nKeysFromExpression(prop.exp.content, `${relativePath}.template.ts`, bindings, relativePath))
        }

        if (prop.arg && prop.arg.type === NodeTypes.SIMPLE_EXPRESSION && !prop.arg.isStatic && prop.arg.content.trim()) {
          keys.push(...extractI18nKeysFromExpression(prop.arg.content, `${relativePath}.template.ts`, bindings, relativePath))
        }
      }
    }

    if (Array.isArray(node.branches)) {
      for (const branch of node.branches) {
        visit(branch)
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(templateAst)

  return keys
}

function extractI18nKeysFromVueSource(relativePath, content) {
  const { descriptor, errors } = parseSfc(content, {
    filename: relativePath,
  })

  if (errors.length > 0) {
    throw new Error(`无法解析 ${relativePath}: ${errors[0]}`)
  }

  const bindings = collectBindingsForVueFile(relativePath, descriptor)
  const keys = []
  const scriptBlocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean)

  for (const block of scriptBlocks) {
    const fileName = `${relativePath}.${block.attrs.lang ?? 'ts'}`
    keys.push(...extractI18nKeysFromScript(block.content, fileName, bindings, relativePath))
  }

  if (descriptor.template?.content) {
    keys.push(...extractI18nKeysFromVueTemplate(descriptor.template.content, bindings, relativePath))
  }

  return keys
}

export function extractI18nKeysFromSource(relativePath, content) {
  if (relativePath.endsWith('.vue')) {
    return extractI18nKeysFromVueSource(relativePath, content)
  }

  const bindings = collectBindingsFromScript(content, relativePath)
  return extractI18nKeysFromScript(content, relativePath, bindings, relativePath)
}

async function listWorkingTreeSourceFiles(projectRoot) {
  const rootDir = path.join(projectRoot, 'src')
  const files = []

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(absolutePath)
        continue
      }

      const relativePath = normalizeRelativePath(path.relative(projectRoot, absolutePath))
      if (shouldScanSourceFile(relativePath)) {
        files.push(relativePath)
      }
    }
  }

  if (await fileExists(rootDir)) {
    await walk(rootDir)
  }

  return sortKeys(files)
}

function listStagedSourceFiles(projectRoot, stagedFiles = null) {
  if (stagedFiles) {
    return sortKeys([...stagedFiles.keys()].filter((relativePath) => shouldScanSourceFile(relativePath)))
  }

  return sortKeys(
    parseNullSeparated(git(projectRoot, 'ls-files', '-z', '--', 'src')).filter((relativePath) => shouldScanSourceFile(relativePath)),
  )
}

function shouldScanSourceFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath)

  if (!normalized.startsWith('src/')) {
    return false
  }

  if (!SOURCE_EXTENSIONS.has(path.extname(normalized))) {
    return false
  }

  if (normalized === 'src/i18n/glossary.json') {
    return false
  }

  if (normalized.startsWith('src/i18n/locales/')) {
    return false
  }

  return true
}

async function readSourceFile(projectRoot, relativePath, mode, stagedFiles = null) {
  const normalized = normalizeRelativePath(relativePath)

  if (mode === 'staged') {
    if (stagedFiles && stagedFiles.has(normalized)) {
      return stagedFiles.get(normalized)
    }

    return git(projectRoot, 'show', `:${normalized}`)
  }

  return readFile(path.join(projectRoot, normalized), 'utf8')
}

export async function collectProjectI18nKeys({ projectRoot = process.cwd(), mode = 'working-tree', stagedFiles = null } = {}) {
  const normalizedStagedFiles = normalizeStagedFiles(stagedFiles)
  const relativePaths = mode === 'staged'
    ? listStagedSourceFiles(projectRoot, normalizedStagedFiles)
    : await listWorkingTreeSourceFiles(projectRoot)
  const keySet = new Set()

  for (const relativePath of relativePaths) {
    const content = await readSourceFile(projectRoot, relativePath, mode, normalizedStagedFiles)
    for (const key of extractI18nKeysFromSource(relativePath, content)) {
      keySet.add(key)
    }
  }

  return sortKeys(keySet)
}

async function loadDefaultExportFromTypeScript(relativePath, sourceText) {
  const { outputText } = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: relativePath,
  })
  const encoded = Buffer.from(outputText).toString('base64')
  const module = await import(`data:text/javascript;base64,${encoded}`)
  return module.default
}

async function readGlossary(projectRoot) {
  const glossaryPath = path.join(projectRoot, MANAGED_I18N_FILES[0])
  if (!(await fileExists(glossaryPath))) {
    return []
  }

  return JSON.parse(await readFile(glossaryPath, 'utf8'))
}

async function readLocaleMessages(projectRoot, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath)
  if (!(await fileExists(absolutePath))) {
    return {}
  }

  const content = await readFile(absolutePath, 'utf8')
  return loadDefaultExportFromTypeScript(relativePath, content)
}

function buildLocaleMessages(glossaryKeys, existingMessages) {
  return Object.fromEntries(glossaryKeys.map((key) => [key, existingMessages[key] ?? key]))
}

function ensureNoUnstagedManagedChanges(projectRoot, unstagedManagedFiles = null) {
  const files = unstagedManagedFiles ?? git(projectRoot, 'diff', '--name-only', '--', ...MANAGED_I18N_FILES)
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)

  if (files.length > 0) {
    throw new Error(`受管 i18n 文件存在未暂存改动，请先处理后再提交: ${files.join(', ')}`)
  }
}

async function readCurrentManagedContents(projectRoot) {
  const contents = new Map()

  for (const relativePath of MANAGED_I18N_FILES) {
    const absolutePath = path.join(projectRoot, relativePath)
    contents.set(relativePath, (await fileExists(absolutePath)) ? await readFile(absolutePath, 'utf8') : '')
  }

  return contents
}

function getChangedFiles(nextContents, currentContents) {
  return [...nextContents.entries()]
    .filter(([relativePath, nextContent]) => currentContents.get(relativePath) !== nextContent)
    .map(([relativePath]) => relativePath)
}

export async function syncI18n({
  projectRoot = process.cwd(),
  mode = 'working-tree',
  check = false,
  stagedFiles = null,
  unstagedManagedFiles = null,
} = {}) {
  if (mode !== 'working-tree' && mode !== 'staged') {
    throw new Error(`Unsupported sync mode: ${mode}`)
  }

  if (mode === 'staged') {
    const managedFileChanges = unstagedManagedFiles ?? (stagedFiles ? [] : null)
    ensureNoUnstagedManagedChanges(projectRoot, managedFileChanges)
  }

  const extractedKeys = await collectProjectI18nKeys({
    projectRoot,
    mode,
    stagedFiles,
  })
  const glossaryKeys = sortKeys(new Set(extractedKeys))

  await readGlossary(projectRoot)
  const zhCN = await readLocaleMessages(projectRoot, MANAGED_I18N_FILES[1])
  const enUS = await readLocaleMessages(projectRoot, MANAGED_I18N_FILES[2])
  const currentContents = await readCurrentManagedContents(projectRoot)

  const nextContents = new Map([
    [MANAGED_I18N_FILES[0], formatGlossary(glossaryKeys)],
    [MANAGED_I18N_FILES[1], formatLocaleSource('zhCN', buildLocaleMessages(glossaryKeys, zhCN))],
    [MANAGED_I18N_FILES[2], formatLocaleSource('enUS', buildLocaleMessages(glossaryKeys, enUS))],
  ])

  const changedFiles = getChangedFiles(nextContents, currentContents)

  if (check && changedFiles.length > 0) {
    throw new Error(`i18n 词表或语言包需要同步: ${changedFiles.join(', ')}`)
  }

  if (!check) {
    for (const [relativePath, nextContent] of nextContents) {
      if (currentContents.get(relativePath) !== nextContent) {
        await writeFile(path.join(projectRoot, relativePath), nextContent, 'utf8')
      }
    }
  }

  return {
    changedFiles,
    glossaryKeys,
  }
}

function parseArgs(argv) {
  const options = {
    mode: 'working-tree',
    check: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--check') {
      options.check = true
      continue
    }

    if (arg === '--mode') {
      options.mode = argv[index + 1] ?? options.mode
      index += 1
      continue
    }

    if (arg.startsWith('--mode=')) {
      options.mode = arg.slice('--mode='.length)
    }
  }

  return options
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false

if (entryPath) {
  try {
    const result = await syncI18n(parseArgs(process.argv.slice(2)))
    const summary = result.changedFiles.length > 0 ? result.changedFiles.join(', ') : 'no changes'
    console.log(`i18n sync complete: ${summary}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
