import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { RecipientRow, ValidationIssue, ValidationResult } from './types'
import { isValidEmail } from './format'

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  if (ext === 'csv') {
    return parseCsv(file)
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  }
  if (ext === 'txt') {
    return parseCsv(file)
  }
  throw new Error(`Unsupported file type: .${ext}. Please upload a CSV or XLSX file.`)
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          const fatal = results.errors.find((e) => e.type === 'Delimiter')
          if (fatal) return reject(new Error(`CSV parse error: ${fatal.message}`))
        }
        const headers = results.meta.fields ?? []
        const rows = results.data.filter((r) => Object.values(r).some((v) => v && String(v).trim()))
        resolve({ headers, rows, totalRows: rows.length })
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    })
  })
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('Excel file is empty.')
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  if (json.length === 0) throw new Error('No rows found in the Excel file.')
  const headers = Object.keys(json[0])
  const rows = json.map((r) => {
    const out: Record<string, string> = {}
    headers.forEach((h) => {
      out[h] = r[h] == null ? '' : String(r[h]).trim()
    })
    return out
  })
  return { headers, rows, totalRows: rows.length }
}

export function generateSampleCsv(): Blob {
  const data = [
    {
      Name: 'John Doe',
      Email: 'john.doe@example.com',
      Phone: '+1 555 0100',
      'Registration ID': 'REG-001',
      Department: 'Computer Science',
      Institution: 'V.S.B Engineering College',
      Event: 'AI & Innovation Workshop',
      Role: 'Participant',
      'Custom Field 1': '',
      'Custom Field 2': '',
    },
    {
      Name: 'Priya Kumar',
      Email: 'priya.kumar@example.com',
      Phone: '+1 555 0101',
      'Registration ID': 'REG-002',
      Department: 'Electronics',
      Institution: 'V.S.B Engineering College',
      Event: 'AI & Innovation Workshop',
      Role: 'Participant',
      'Custom Field 1': '',
      'Custom Field 2': '',
    },
    {
      Name: 'Alex Smith',
      Email: 'alex.smith@example.com',
      Phone: '+1 555 0102',
      'Registration ID': 'REG-003',
      Department: 'Mechanical',
      Institution: 'V.S.B Engineering College',
      Event: 'AI & Innovation Workshop',
      Role: 'Organizer',
      'Custom Field 1': '',
      'Custom Field 2': '',
    },
    {
      Name: 'Mei Chen',
      Email: 'mei.chen@example.com',
      Phone: '+1 555 0103',
      'Registration ID': 'REG-004',
      Department: 'Information Technology',
      Institution: 'V.S.B Engineering College',
      Event: 'AI & Innovation Workshop',
      Role: 'Participant',
      'Custom Field 1': '',
      'Custom Field 2': '',
    },
    {
      Name: 'Carlos Rivera',
      Email: 'carlos.rivera@example.com',
      Phone: '+1 555 0104',
      'Registration ID': 'REG-005',
      Department: 'Civil',
      Institution: 'V.S.B Engineering College',
      Event: 'AI & Innovation Workshop',
      Role: 'Speaker',
      'Custom Field 1': '',
      'Custom Field 2': '',
    },
  ]
  const csv = Papa.unparse(data)
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export interface ColumnMapping {
  name: string
  email: string
  phone: string
  registrationId: string
  department: string
  institution: string
  event: string
  role: string
  customField1: string
  customField2: string
}

export const FIELD_OPTIONS: { value: keyof RecipientRow; label: string; required?: boolean }[] = [
  { value: 'name', label: 'Recipient Name', required: true },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'registrationId', label: 'Registration ID' },
  { value: 'department', label: 'Department' },
  { value: 'institution', label: 'Institution' },
  { value: 'event', label: 'Event' },
  { value: 'role', label: 'Role' },
  { value: 'customField1', label: 'Custom Field 1' },
  { value: 'customField2', label: 'Custom Field 2' },
]

export function applyMapping(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): RecipientRow[] {
  return rows.map((r) => ({
    name: r[mapping.name]?.trim() ?? '',
    email: r[mapping.email]?.trim() ?? undefined,
    phone: r[mapping.phone]?.trim() ?? undefined,
    registrationId: r[mapping.registrationId]?.trim() || undefined,
    department: r[mapping.department]?.trim() || undefined,
    institution: r[mapping.institution]?.trim() || undefined,
    event: r[mapping.event]?.trim() || undefined,
    role: r[mapping.role]?.trim() || undefined,
    customField1: r[mapping.customField1]?.trim() || undefined,
    customField2: r[mapping.customField2]?.trim() || undefined,
  }))
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const lc = headers.map((h) => h.toLowerCase().trim())
  const find = (patterns: string[]): string => {
    for (const p of patterns) {
      const idx = lc.findIndex((h) => h.includes(p))
      if (idx >= 0) return headers[idx]
    }
    return ''
  }
  return {
    name: find(['name', 'full name', 'recipient', 'student name']),
    email: find(['email', 'mail', 'e-mail']),
    phone: find(['phone', 'mobile', 'contact']),
    registrationId: find(['registration', 'reg id', 'regid', 'reg no', 'reg']),
    department: find(['department', 'dept', 'branch', 'class']),
    institution: find(['institution', 'college', 'organization', 'university', 'school']),
    event: find(['event']),
    role: find(['role', 'designation', 'position']),
    customField1: find(['custom', 'field1', 'extra']),
    customField2: find(['custom2', 'field2', 'extra2']),
  }
}

export function validateRecipients(rows: RecipientRow[]): ValidationResult {
  const validRows: RecipientRow[] = []
  const invalidRows: (RecipientRow & { issues: ValidationIssue[] })[] = []
  const seenEmails = new Map<string, number>()
  const seenRegIds = new Map<string, number>()
  const duplicateRows: (RecipientRow & { duplicateOf: number })[] = []

  rows.forEach((row, idx) => {
    const issues: ValidationIssue[] = []
    if (!row.name || !row.name.trim()) {
      issues.push({ row: idx + 1, field: 'name', reason: 'Missing recipient name', severity: 'error' })
    } else if (row.name.length > 120) {
      issues.push({ row: idx + 1, field: 'name', reason: 'Name is too long (max 120 chars)', severity: 'error' })
    }
    if (row.email && !isValidEmail(row.email)) {
      issues.push({ row: idx + 1, field: 'email', reason: 'Invalid email format', severity: 'error' })
    }
    // duplicate detection
    let isDup = false
    if (row.email) {
      const key = row.email.toLowerCase()
      if (seenEmails.has(key)) {
        duplicateRows.push({ ...row, duplicateOf: seenEmails.get(key)! })
        isDup = true
      } else {
        seenEmails.set(key, idx)
      }
    }
    if (row.registrationId) {
      if (seenRegIds.has(row.registrationId)) {
        if (!isDup) {
          duplicateRows.push({ ...row, duplicateOf: seenRegIds.get(row.registrationId)! })
          isDup = true
        }
      } else {
        seenRegIds.set(row.registrationId, idx)
      }
    }
    if (issues.length > 0) {
      invalidRows.push({ ...row, issues })
    } else if (!isDup) {
      validRows.push(row)
    }
  })

  return {
    total: rows.length,
    valid: validRows.length,
    invalid: invalidRows.length,
    duplicates: duplicateRows.length,
    validRows,
    invalidRows,
    duplicateRows,
  }
}
