// Util ekspor data tanpa dependency berat (DEVELOPMENT_RULES #8).
// - XLS: tabel HTML dengan MIME ms-excel (terbuka di Excel/WPS).
// - PDF: generator PDF minimal (teks + garis tabel) berbasis pure JS.

function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Netralkan formula injection (OWASP): awalan = + - @ pada sel. */
function safeCell(v: unknown): unknown {
  const s = String(v ?? '');
  if (/^[=+\-@]/.test(s.trimStart())) return "'" + s;
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export interface ExportColumn {
  header: string;
  /** Ambil nilai dari baris. */
  get: (row: any) => unknown;
  /** Lebar kolom untuk layout PDF. */
  width?: number;
}

/** Stempel tanggal lokal YYYY-MM-DD untuk nama berkas ekspor. */
export function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Unduh data sebagai .xls (HTML/MS-Excel) dengan judul & header. */
export function exportXLS(filename: string, title: string, columns: ExportColumn[], rows: any[]) {
  const bom = '\ufeff'; // agar UTF-8 terbaca benar di Excel
  const thead = columns
    .map((c) => `<th style="border:1px solid #222;padding:5px;background:#064e3b;color:#fff;font-weight:bold">${escapeHtml(c.header)}</th>`)
    .join('');
  const tbody = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td style="border:1px solid #999;padding:5px">${escapeHtml(safeCell(c.get(r)))}</td>`).join('')}</tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h2>${escapeHtml(title)}</h2><table border="1" style="border-collapse:collapse;font-size:12px"><thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`;
  downloadBlob(new Blob([bom + html], { type: 'application/vnd.ms-excel;charset=utf-8' }), filename);
}

/* ------------------------------------------------------------------ */
/* PDF generator minimal (A4 portrait)                                 */
/* ------------------------------------------------------------------ */

function escPdf(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, () => '?');
}

/** Layout sebuah tabel menjadi fragmen %-halaman. */
function layoutTable(columns: ExportColumn[], rows: any[]) {
  const pageW = 595;
  const pageH = 842;
  const margin = 40;
  const headerH = 22;
  const headerY = 96;
  const lineH = 12;

  const colW = columns.map((c) => c.width ?? 100);
  const totalW = colW.reduce((a, b) => a + b, 0);
  const scale = Math.min(1, (pageW - margin * 2) / totalW);
  const widths = colW.map((w) => w * scale);
  const colX: number[] = [];
  let x = margin;
  for (const w of widths) {
    colX.push(x);
    x += w;
  }

  const wrap = (text: unknown, width: number): string[] => {
    const maxChars = Math.max(4, Math.floor(width / 4.6));
    const words = String(text == null ? '' : text).split(/\s+/);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > maxChars) {
        out.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + ' ' + w : w;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  };

  interface RowFrag {
    top: number;
    height: number;
    cellLines: string[][];
  }

  const pages: RowFrag[][] = [];
  let current: RowFrag[] = [];
  let y = headerY + headerH;

  const flush = () => {
    if (current.length) pages.push(current);
    current = [];
    y = headerY + headerH;
  };

  for (const r of rows) {
    const cellLines = columns.map((c, i) => wrap(c.get(r), widths[i]));
    const height = Math.max(...cellLines.map((ls) => ls.length * lineH), 16);
    if (y + height > pageH - margin) flush();
    current.push({ top: y, height, cellLines });
    y += height;
  }
  if (current.length) pages.push(current);
  if (!pages.length) pages.push([{ top: headerY + headerH, height: 24, cellLines: columns.map(() => ['Tidak ada data.']) }]);

  return { pageW, pageH, margin, headerH, headerY, lineH, colX, widths, pages };
}

export function exportPDF(filename: string, title: string, subtitle: string, columns: ExportColumn[], rows: any[]) {
  const { pageW, pageH, margin, headerH, headerY, lineH, colX, widths, pages } = layoutTable(columns, rows);
  const esc = escPdf;

  const headerStream = (() => {
    const b: string[] = ['q'];
    b.push('0.5 G 1.4 w');
    b.push(`${margin} ${headerY} ${widths.reduce((a, w) => a + w, 0)} 0 re S`);
    columns.forEach((c, i) => {
      b.push(`${colX[i]} ${headerY} 0 ${headerH} re S`);
      const lines = escPdf(c.header);
      b.push(`BT /F1 9.5 Tf ${colX[i] + 4} ${headerY + 9} Td (${lines}) Tj ET`);
    });
    b.push(`${margin} ${headerY + headerH} ${widths.reduce((a, w) => a + w, 0)} 0 re S`);
    b.push('Q');
    return b.join('\n');
  })();

  const bodyStreams = pages.map((frags) => {
    const b: string[] = ['q'];
    frags.forEach((f) => {
      b.push(`0.5 G 0.8 w`);
      b.push(`${margin} ${f.top} ${widths.reduce((a, w) => a + w, 0)} 0 re S`);
      b.push(`${margin} ${f.top + f.height} ${widths.reduce((a, w) => a + w, 0)} 0 re S`);
      f.cellLines.forEach((ls, ci) => {
        b.push(`${colX[ci]} ${f.top} 0 ${f.height} re S`);
        let ty = f.top + 9;
        ls.forEach((ln) => {
          b.push(`BT /F2 9 Tf ${colX[ci] + 4} ${ty} Td (${esc(ln)}) Tj ET`);
          ty += lineH;
        });
      });
    });
    b.push('Q');
    return b.join('\n');
  });

  const pageStreams = pages.map((_, pi) => {
    const b: string[] = [];
    if (pi === 0) {
      b.push(`BT /F1 16 Tf 40 812 Td (${esc(title)}) Tj ET`);
      b.push(`BT /F2 10 Tf 40 796 Td (${esc(subtitle)}) Tj ET`);
    } else {
      b.push(`BT /F2 9 Tf 500 812 Td (Hal. ${pi + 1}/${pages.length}) Tj ET`);
    }
    b.push(headerStream);
    b.push(bodyStreams[pi]);
    return b.join('\n');
  });

  // Objek 1-2: katalog & halaman. Font di akhir; content pakai /F1 & /F2.
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((_, pi) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 11 0 R /F2 12 0 R >> >> /Contents ${4 + pi * 2} 0 R >>`);
    objects.push(`<< /Length ${pageStreams[pi].length} >>\nstream\n${pageStreams[pi]}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  downloadBlob(new Blob([pdf], { type: 'application/pdf' }), filename);
}