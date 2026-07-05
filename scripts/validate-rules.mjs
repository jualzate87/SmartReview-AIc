#!/usr/bin/env node

/**
 * Validates .mdc rule files in .cursor/rules/ for structural soundness.
 *
 * Usage:
 *   node scripts/validate-rules.mjs              # validate and print results
 *   node scripts/validate-rules.mjs --report     # also write validate-report.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const RULES_DIR = join(ROOT, '.cursor', 'rules')
const WRITE_REPORT = process.argv.includes('--report')

let totalFiles = 0
let totalErrors = 0
const results = []

function validateFile(filePath) {
  const relPath = relative(ROOT, filePath)
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const errors = []

  const isComponent = filePath.includes('/components/')
  const isToken = filePath.includes('/tokens/')

  // Check 1: Front matter exists and is valid
  if (!content.startsWith('---')) {
    errors.push({ line: 1, message: 'Missing front matter (file should start with ---)' })
  } else {
    const closingFrontMatter = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
    if (closingFrontMatter === -1) {
      errors.push({ line: 1, message: 'Front matter is not closed (missing closing ---)' })
    } else {
      const frontMatterLines = lines.slice(1, closingFrontMatter)
      const hasDescription = frontMatterLines.some(
        l => l.startsWith('description:') && l.replace('description:', '').trim().length > 0
      )
      if (!hasDescription) {
        errors.push({ line: 1, message: 'Front matter missing "description" field or it is empty' })
      }
    }
  }

  // Check 2: Code blocks are closed
  let inCodeBlock = false
  let codeBlockOpenLine = -1
  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockOpenLine = i + 1
      } else {
        inCodeBlock = false
        codeBlockOpenLine = -1
      }
    }
  })
  if (inCodeBlock) {
    errors.push({ line: codeBlockOpenLine, message: 'Unclosed code block (opening ``` without closing ```)' })
  }

  if (isComponent) {
    // Check 3: Required sections
    const hasInstallSection =
      content.includes('## Installation & Import') ||
      content.includes('## Installation') ||
      content.includes('## Import')
    if (!hasInstallSection) {
      errors.push({ line: 0, message: 'Missing "## Installation & Import" section' })
    }

    const hasPropsSection =
      content.includes('## Props API') ||
      content.includes('## Props') ||
      content.includes('## Sub-Components')
    if (!hasPropsSection) {
      errors.push({ line: 0, message: 'Missing "## Props API" section' })
    }

    // Check 4: Props table consistency
    let inPropsSection = false
    let expectedColumns = -1
    lines.forEach((line, i) => {
      const lineNum = i + 1
      if (/^## Props/.test(line)) {
        inPropsSection = true
        expectedColumns = -1
        return
      }
      if (inPropsSection && /^## /.test(line)) {
        inPropsSection = false
        return
      }
      if (inPropsSection && line.startsWith('|')) {
        // Replace | inside backticks with a placeholder so TypeScript union types
        // (e.g. `string | number`) don't get counted as extra columns
        const sanitized = line.replace(/`[^`]*`/g, m => m.replace(/\|/g, '\u0000'))
        const cols = sanitized.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1)

        if (expectedColumns === -1) {
          expectedColumns = cols.length
          return
        }
        // Skip separator rows
        if (cols.every(c => /^[-\s]+$/.test(c))) return

        if (cols.length !== expectedColumns) {
          errors.push({
            line: lineNum,
            message: `Props table row has ${cols.length} column(s), expected ${expectedColumns}`,
          })
        }

        // Check for truncated cell content (outside backticks)
        const outsideBackticks = line.replace(/`[^`]*`/g, '')
        if (/\.\.\.|fa\.\.\.|[a-z]{2,}\.\.\.\s/.test(outsideBackticks)) {
          errors.push({ line: lineNum, message: 'Cell appears truncated (contains "..." mid-content)' })
        }
      }
    })
  }

  if (isToken) {
    // Check 5: Token files should reference at least one token
    if (!content.includes('--')) {
      errors.push({ line: 0, message: 'Token file contains no CSS custom property references (no "--" found)' })
    }
  }

  return { path: relPath, errors }
}

function walkDir(dir) {
  const files = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        files.push(...walkDir(fullPath))
      } else if (entry.endsWith('.mdc')) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable — skip
  }
  return files
}

// Run validation
const allFiles = walkDir(RULES_DIR)
allFiles.sort()

for (const filePath of allFiles) {
  totalFiles++
  const result = validateFile(filePath)
  results.push(result)
  if (result.errors.length > 0) {
    totalErrors += result.errors.length
    console.log(`\nValidating ${result.path} ... FAIL`)
    for (const err of result.errors) {
      const loc = err.line > 0 ? `  Line ${err.line}:` : '         '
      console.log(`${loc} ${err.message}`)
    }
  } else {
    console.log(`Validating ${result.path} ... PASS`)
  }
}

// Summary
console.log(`\n${'─'.repeat(60)}`)
if (totalErrors === 0) {
  console.log(`✓ All ${totalFiles} rule files passed validation.`)
} else {
  const failedFiles = results.filter(r => r.errors.length > 0).length
  console.log(`✗ ${totalErrors} error(s) across ${failedFiles} file(s) out of ${totalFiles} total.`)
}

// Write report if requested
if (WRITE_REPORT) {
  const reportLines = [
    '# MDC Rule Validation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Files checked: ${totalFiles}`,
    `Total errors: ${totalErrors}`,
    '',
    '---',
    '',
  ]

  for (const result of results) {
    if (result.errors.length > 0) {
      reportLines.push(`## \u274C ${result.path}`)
      for (const err of result.errors) {
        const loc = err.line > 0 ? `Line ${err.line}: ` : ''
        reportLines.push(`- ${loc}${err.message}`)
      }
      reportLines.push('')
    }
  }

  if (totalErrors === 0) {
    reportLines.push('## \u2705 All files passed validation.')
  }

  const reportPath = join(ROOT, 'validate-report.md')
  writeFileSync(reportPath, reportLines.join('\n'), 'utf-8')
  console.log(`\nReport written to validate-report.md`)
}

process.exit(totalErrors > 0 ? 1 : 0)
