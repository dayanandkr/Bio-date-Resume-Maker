import type { Draft } from '../model';
import { tr } from '../i18n';
import type { Language } from '../i18n';

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function fileName(name: string) {
  return (name.trim().replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '').replace(/\s+/g, '-').slice(0, 80) || 'my') + '-biodata';
}

export function exportDraft(draft: Draft) {
  downloadFile(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }), `${fileName(draft.data.fullName)}.json`);
}

export async function downloadPdf(root: HTMLElement, name: string, language: Language = 'en', title = '') {
  await document.fonts.ready;
  const [{ jsPDF }, { toCanvas, getFontEmbedCSS }] = await Promise.all([import('jspdf'), import('html-to-image')]);
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-page]'));
  if (!pages.length) throw new Error('The preview is still loading. Please try again.');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `${name.trim()} — ${title.trim() || tr(language, 'Marriage biodata')}`, creator: 'BioResume Maker', subject: tr(language, 'Marriage biodata') });
  const fontEmbedCSS = await getFontEmbedCSS(pages[0]);
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    await Promise.all(Array.from(page.querySelectorAll('img')).map(img => img.decode()));
    const canvas = await toCanvas(page, {
      pixelRatio: 2, width: 794, height: 1123, backgroundColor: '#ffffff', fontEmbedCSS,
      style: { transform: 'none', margin: '0', boxShadow: 'none' },
    });
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    canvas.width = 0;
    canvas.height = 0;
  }
  downloadFile(pdf.output('blob'), `${fileName(name)}.pdf`);
}
