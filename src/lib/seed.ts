import { db } from './db'
import { TEMPLATES_CONFIG } from './certificate-engine'
import { hashPassword } from './auth'
import { generateVerificationToken } from './auth'

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

const SAMPLE_RECIPIENTS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@vsb.edu.in', department: 'CSE', role: 'Participant', registrationId: 'REG-2026-001' },
  { name: 'Priya Patel', email: 'priya.patel@vsb.edu.in', department: 'IT', role: 'Participant', registrationId: 'REG-2026-002' },
  { name: 'Rohan Verma', email: 'rohan.verma@vsb.edu.in', department: 'ECE', role: 'Speaker', registrationId: 'REG-2026-003' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@vsb.edu.in', department: 'CSE', role: 'Organizer', registrationId: 'REG-2026-004' },
  { name: 'Karthik Nair', email: 'karthik.nair@vsb.edu.in', department: 'MECH', role: 'Participant', registrationId: 'REG-2026-005' },
  { name: 'Diya Reddy', email: 'diya.reddy@vsb.edu.in', department: 'CIVIL', role: 'Participant', registrationId: 'REG-2026-006' },
  { name: 'Vikram Singh', email: 'vikram.singh@vsb.edu.in', department: 'EEE', role: 'Participant', registrationId: 'REG-2026-007' },
  { name: 'Sneha Gupta', email: 'sneha.gupta@vsb.edu.in', department: 'CSE', role: 'Participant', registrationId: 'REG-2026-008' },
  { name: 'Arjun Mehta', email: 'arjun.mehta@vsb.edu.in', department: 'IT', role: 'Mentor', registrationId: 'REG-2026-009' },
  { name: 'Kavya Rao', email: 'kavya.rao@vsb.edu.in', department: 'ECE', role: 'Participant', registrationId: 'REG-2026-010' },
  { name: 'Aditya Jain', email: 'aditya.jain@vsb.edu.in', department: 'CSE', role: 'Participant', registrationId: 'REG-2026-011' },
  { name: 'Ishita Bose', email: 'ishita.bose@vsb.edu.in', department: 'BIOTECH', role: 'Participant', registrationId: 'REG-2026-012' },
]

export async function seedDatabase() {
  // Check if already seeded
  const userCount = await db.user.count()
  if (userCount > 0) return false

  const admin = await db.user.create({
    data: {
      email: 'admin@bulkcert.io',
      name: 'Demo Admin',
      password: hashPassword('admin123'),
      role: 'ADMIN',
    },
  })
  const staff = await db.user.create({
    data: {
      email: 'staff@bulkcert.io',
      name: 'Demo Staff',
      password: hashPassword('staff123'),
      role: 'STAFF',
    },
  })

  // Organization
  await db.organization.create({
    data: {
      name: 'V.S.B Engineering College',
      address: 'Coimbatore, Tamil Nadu, India',
      website: 'https://vsb.edu.in',
      email: 'info@vsb.edu.in',
      phone: '+91 422 123 4567',
    },
  })

  // Templates
  for (const t of SAMPLE_TEMPLATES) {
    await db.template.create({ data: t as any })
  }

  // Recipients
  for (const r of SAMPLE_RECIPIENTS) {
    await db.recipient.create({
      data: { ...r, institution: 'V.S.B Engineering College', event: 'AI & Innovation Workshop 2026', userId: admin.id },
    })
  }

  // Sample job - completed
  const classicTemplate = await db.template.findFirst({ where: { slug: 'classic-blue' } })
  if (!classicTemplate) throw new Error('Classic template missing')

  const completedRecipients = SAMPLE_RECIPIENTS.slice(0, 8).map((r) => ({ name: r.name, email: r.email, department: r.department, role: r.role, registrationId: r.registrationId }))

  const completedJob = await db.generationJob.create({
    data: {
      jobId: 'JOB-2026-00001',
      userId: admin.id,
      eventName: 'AI & Innovation Workshop 2026',
      organizationName: 'V.S.B Engineering College',
      certificateTitle: 'Certificate of Participation',
      description: '3-day hands-on workshop on AI, ML and Innovation.',
      eventDate: '2026-01-15',
      signatoryName: 'Dr. R. Krishnan',
      signatoryDesignation: 'Dean of Innovation',
      venue: 'Innovation Hub, Block C',
      duration: '3 days',
      templateId: classicTemplate.id,
      totalRecipients: 8,
      processedCount: 8,
      successfulCount: 8,
      failedCount: 0,
      progressPercentage: 100,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 30),
      completedAt: new Date(Date.now() - 1000 * 60 * 25),
      settings: JSON.stringify({ format: 'pdf', paperSize: 'A4', orientation: 'landscape', certificateIdPrefix: 'VSB-AI-2026', generateZip: true, includeCsvReport: true, sendEmailNotification: false, generateQrCode: true, fileNamingPattern: '{certificate_id}_{recipient_name}.pdf' }),
      recipientsSnapshot: JSON.stringify(completedRecipients),
    },
  })

  // create sample certificates for the completed job
  for (let i = 0; i < completedRecipients.length; i++) {
    const r = completedRecipients[i]
    const seq = i + 1
    const token = generateVerificationToken()
    const certId = `VSB-AI-2026-${String(seq).padStart(4, '0')}`
    await db.certificate.create({
      data: {
        certificateId: certId,
        jobId: completedJob.id,
        templateId: classicTemplate.id,
        userId: admin.id,
        recipientName: r.name,
        recipientEmail: r.email,
        department: r.department,
        registrationId: r.registrationId,
        eventName: completedJob.eventName,
        organizationName: completedJob.organizationName,
        certificateTitle: completedJob.certificateTitle,
        eventDate: completedJob.eventDate,
        signatoryName: completedJob.signatoryName,
        signatoryDesignation: completedJob.signatoryDesignation,
        filePath: `storage/certificates/${completedJob.id}/${certId}_${r.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')}.pdf`,
        fileName: `${certId}_${r.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')}.pdf`,
        status: 'GENERATED',
        verificationToken: token,
        generatedAt: new Date(Date.now() - 1000 * 60 * 25),
      },
    })
  }

  // partial job (some failures)
  const partialRecipients = [
    { name: 'Maya Krishnan', email: 'maya.k@vsb.edu.in', department: 'CSE' },
    { name: 'Rahul Bose', email: 'rahul.b@vsb.edu.in', department: 'IT' },
    { name: 'Lakshmi Menon', email: 'lakshmi.m@vsb.edu.in', department: 'ECE' },
    { name: 'Sai Prasad', email: 'sai.p@vsb.edu.in', department: 'MECH' },
    { name: 'Invalid User', email: 'bad-email', department: 'CSE' },
  ]
  await db.generationJob.create({
    data: {
      jobId: 'JOB-2026-00002',
      userId: admin.id,
      eventName: 'Hackathon Genesis 2026',
      organizationName: 'V.S.B Engineering College',
      certificateTitle: 'Certificate of Achievement',
      eventDate: '2026-02-20',
      signatoryName: 'Dr. Anitha R',
      signatoryDesignation: 'HoD, CSE',
      duration: '48 hours',
      templateId: classicTemplate.id,
      totalRecipients: 5,
      processedCount: 5,
      successfulCount: 4,
      failedCount: 1,
      progressPercentage: 100,
      status: 'PARTIALLY_COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      settings: JSON.stringify({ format: 'pdf', paperSize: 'A4', orientation: 'landscape', certificateIdPrefix: 'VSB-HK-2026' }),
      recipientsSnapshot: JSON.stringify(partialRecipients),
    },
  })

  // pending job
  await db.generationJob.create({
    data: {
      jobId: 'JOB-2026-00003',
      userId: admin.id,
      eventName: 'Robotics Symposium 2026',
      organizationName: 'V.S.B Engineering College',
      certificateTitle: 'Certificate of Participation',
      eventDate: '2026-03-10',
      signatoryName: 'Dr. Suresh Kumar',
      signatoryDesignation: 'Robotics Club Chair',
      templateId: classicTemplate.id,
      totalRecipients: 0,
      processedCount: 0,
      successfulCount: 0,
      failedCount: 0,
      progressPercentage: 0,
      status: 'PENDING',
      settings: JSON.stringify({ format: 'pdf', paperSize: 'A4', orientation: 'landscape', certificateIdPrefix: 'VSB-RS-2026' }),
      recipientsSnapshot: JSON.stringify([]),
    },
  })

  // activity logs
  const actions = [
    { action: 'USER_LOGIN', userName: 'Demo Admin', status: 'SUCCESS' as const },
    { action: 'TEMPLATE_CREATED', userName: 'System', status: 'INFO' as const, resource: 'Template', resourceId: 'classic-blue' },
    { action: 'RECIPIENT_IMPORTED', userName: 'Demo Admin', status: 'SUCCESS' as const, resource: 'Recipient', details: JSON.stringify({ count: 12 }) },
    { action: 'GENERATION_STARTED', userName: 'Demo Admin', status: 'INFO' as const, resource: 'Job', resourceId: 'JOB-2026-00001' },
    { action: 'GENERATION_COMPLETED', userName: 'Demo Admin', status: 'SUCCESS' as const, resource: 'Job', resourceId: 'JOB-2026-00001', details: JSON.stringify({ total: 8, successful: 8 }) },
    { action: 'CERTIFICATE_DOWNLOADED', userName: 'Demo Admin', status: 'INFO' as const, resource: 'Certificate', resourceId: 'VSB-AI-2026-0001' },
    { action: 'GENERATION_COMPLETED', userName: 'Demo Admin', status: 'WARNING' as const, resource: 'Job', resourceId: 'JOB-2026-00002', details: JSON.stringify({ total: 5, successful: 4, failed: 1 }) },
    { action: 'SETTINGS_CHANGED', userName: 'Demo Admin', status: 'INFO' as const, resource: 'Settings' },
  ]
  for (const a of actions) {
    await db.activityLog.create({
      data: {
        userId: admin.id,
        userName: a.userName,
        action: a.action,
        resource: (a as any).resource ?? null,
        resourceId: (a as any).resourceId ?? null,
        status: a.status,
        details: (a as any).details ?? null,
        ipAddress: '192.168.1.10',
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 6),
      },
    })
  }

  // notifications
  await db.notification.create({
    data: {
      userId: admin.id,
      type: 'SUCCESS',
      title: 'Generation Complete',
      message: '8 certificates generated for "AI & Innovation Workshop 2026".',
      link: 'view=progress&jobId=',
    },
  })
  await db.notification.create({
    data: {
      userId: admin.id,
      type: 'WARNING',
      title: 'Generation Completed with Errors',
      message: '4 succeeded, 1 failed for "Hackathon Genesis 2026".',
    },
  })
  await db.notification.create({
    data: {
      userId: admin.id,
      type: 'INFO',
      title: 'Recipients imported',
      message: '12 new recipients were added to your library.',
    },
  })

  // settings
  const settings: Record<string, string> = {
    'defaultTemplateId': classicTemplate.id,
    'defaultPaperSize': 'A4',
    'defaultOrientation': 'landscape',
    'defaultPrefix': 'VSB',
    'notifyGenerationComplete': 'true',
    'notifyGenerationFailed': 'true',
    'notifyEmail': 'false',
    'theme': 'light',
    'language': 'en',
    'timezone': 'Asia/Shanghai',
  }
  for (const [k, v] of Object.entries(settings)) {
    await db.setting.create({ data: { key: k, value: v } })
  }

  return true
}
