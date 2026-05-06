/**
 * Generates a minimal one-page PDF as a Blob from plain text lines.
 * No external dependencies — handcrafted PDF byte stream.
 *
 * Used for demo "Descargar póliza" / "Descargar reporte" flows.
 */
function escapePdfText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

export function buildPdfBlob({ title = 'Documento', lines = [] }) {
  const PAGE_W = 612 // letter
  const PAGE_H = 792
  const fontSize = 11
  const lineHeight = 16
  const startY = PAGE_H - 90
  const startX = 54

  const allLines = [
    `BT /F2 22 Tf ${startX} ${PAGE_H - 60} Td (${escapePdfText(title)}) Tj ET`,
    `BT /F1 9 Tf ${startX} ${PAGE_H - 78} Td (La Mundial de Seguros · 52 anos contigo) Tj ET`,
  ]
  lines.forEach((ln, i) => {
    if (ln === '') return
    const y = startY - i * lineHeight
    if (y < 50) return
    allLines.push(
      `BT /F1 ${fontSize} Tf ${startX} ${y} Td (${escapePdfText(ln)}) Tj ET`,
    )
  })

  const stream = allLines.join('\n')
  const objects = []
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`)
  objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`)
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
  )
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`)
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`)
  objects.push(
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  )

  let body = '%PDF-1.4\n%\xC4\xCD\n'
  const offsets = [0]
  objects.forEach((o, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xrefStart = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  return new Blob([body], { type: 'application/pdf' })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadPdf({ title, lines, filename }) {
  const blob = buildPdfBlob({ title, lines })
  downloadBlob(blob, filename)
}
