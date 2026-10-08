import { db } from './db'
import { TEMPLATES_CONFIG } from './certificate-config'

const SAMPLE_TEMPLATES = Object.values(TEMPLATES_CONFIG).map((t) => ({
  name: t.name,
  slug: t.slug,
  description: t.description,
  orientation: t.orientation,
  paperSize: t.paperSize,
  accentColor: t.accentColor,
  fontFamily: t.fontFamily,
  config: JSON.stringify(t),
  isDefault: t.slug === 'classic-blue',
  usageCount: 0,
  status: 'ACTIVE' as const,
}))

export async function seedDatabase() {
  // Only seed the 6 predefined templates — no sample users, no sample data.
  // Users create their own accounts via the register page; the first user becomes Admin.
  const templateCount = await db.template.count()
  if (templateCount > 0) return false

  for (const t of SAMPLE_TEMPLATES) {
    await db.template.create({ data: t as any })
  }
  return true
}
