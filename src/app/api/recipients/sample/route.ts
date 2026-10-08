import { NextRequest, NextResponse } from 'next/server'
import { generateSampleCsv } from '@/lib/parse'

export async function GET(req: NextRequest) {
  const blob = generateSampleCsv()
  const buf = await blob.arrayBuffer()
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8;',
      'Content-Disposition': 'attachment; filename="bulk-certificates-sample.csv"',
    },
  })
}
