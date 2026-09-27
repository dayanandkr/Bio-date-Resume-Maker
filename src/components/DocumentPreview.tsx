import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { Flower2, UserRound } from 'lucide-react';
import { getDocumentItems, paginate, templates, visibleKeys } from '../model';
import type { DocItem, Draft } from '../model';
import { tr } from '../i18n';
import ThemeArtwork from './ThemeArtwork';
import { backgrounds, devotionalSource } from '../presentation';

function DocumentHeader({ draft }: { draft: Draft }) {
  const { data, photo, settings, presentation } = draft;
  const godImage = devotionalSource(presentation);
  const included = visibleKeys(draft);
  const subtitle = ['profession', 'location'].filter(key => included.has(key)).map(key => data[key]).filter(Boolean).join(' · ');
  return <header className="document-header">
    {(godImage || presentation.godName.trim()) && <div className="document-invocation">
      {godImage && <img className="document-god-image" src={godImage} alt={tr(settings.language, 'Selected God')} style={{ width: presentation.godImageSize, height: presentation.godImageSize }} />}
      {presentation.godName.trim() && <p className="document-blessing">{presentation.godName}</p>}
    </div>}
    <div className="document-identity">
    <div className="document-heading">
      <div className="document-eyebrow"><Flower2 size={19} strokeWidth={1.2} /><span>{presentation.title.trim() || tr(settings.language, 'Marriage biodata')}</span></div>
      <h2>{data.fullName.trim() || tr(settings.language, 'Your name')}</h2>
      {subtitle && <p className="document-subtitle">{subtitle}</p>}
    </div>
    {settings.showPhoto && photo && <img className="document-photo" src={photo} alt="Profile photograph" />}
    </div>
  </header>;
}

function DocumentBackground({ draft }: { draft: Draft }) {
  const value = draft.presentation;
  if (value.background === 'original') return null;
  const background = backgrounds.find(item => item.id === value.background);
  const source = value.background === 'custom' ? value.customBackground : background?.image;
  return <div className="document-background" data-background={value.background} aria-hidden="true">
    <div className="document-paper" style={{ background: background?.css ?? '#ffffff', opacity: value.backgroundStrength / 100 }}>{source && <img src={source} alt="" />}</div>
    {(background?.panel || source) && <div className={`document-paper-panel ${background?.panel ? 'solid-paper-panel' : ''}`} />}
  </div>;
}

function DocumentItem({ item }: { item: DocItem }) {
  if (item.kind === 'heading') return <h3 className="doc-item document-section-title" data-item-id={item.id}>{item.label}</h3>;
  return <div className={`doc-item document-${item.kind}`} data-item-id={item.id}>
    <span className="document-label">{item.label}</span>
    <span className="document-value">{item.value}</span>
  </div>;
}

export function TemplateMiniature({ id }: { id: string }) {
  const theme = templates.find(template => template.id === id)!;
  return <div className={`template-miniature miniature-${theme.layout}`} aria-hidden="true">
    <ThemeArtwork motif={theme.motif} />
    <div className="mini-heading"><span className="mini-flower">✧</span><span className="mini-name" /><span className="mini-subtitle" /></div>
    {theme.layout === 'portrait' && <div className="mini-photo"><UserRound size={19} strokeWidth={1.2} /></div>}
    {[0, 1].map(section => <div className="mini-section" key={section}><span className="mini-section-title" />{[0, 1, 2].map(row => <div className="mini-row" key={row}><i /><b /></div>)}</div>)}
  </div>;
}

export default function DocumentPreview({ draft, rootRef, onReady }: { draft: Draft; rootRef: RefObject<HTMLDivElement | null>; onReady: (ready: boolean) => void }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);
  const [pages, setPages] = useState<DocItem[][]>([[]]);
  const [contentScale, setContentScale] = useState(1);
  const items = useMemo(() => getDocumentItems(draft.data, draft.settings, draft.fieldLayout), [draft.data, draft.settings, draft.fieldLayout]);
  const theme = templates.find(template => template.id === draft.settings.template)!;
  const t = (text: string) => tr(draft.settings.language, text);
  const documentStyle = { '--document-accent': draft.settings.color } as CSSProperties;
  const className = `document-page document-${theme.layout} document-${theme.id} font-${draft.settings.font}`;

  useLayoutEffect(() => {
    const node = widthRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(entry.contentRect.width / 794, 1)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    onReady(false);
  }, [draft, onReady]);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const node = measureRef.current;
      if (!node || cancelled) return;
      const header = node.querySelector('.document-header')!;
      const heights = Object.fromEntries(Array.from(node.querySelectorAll<HTMLElement>('[data-item-id]')).map(item => {
        const style = getComputedStyle(item);
        return [item.dataset.itemId!, Math.ceil(item.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom))];
      }));
      const headerHeight = Math.ceil(header.getBoundingClientRect().height);
      const available = 1123 - 116 - 8;
      const paginateAt = (size: number) => paginate(items, heights, available / size - headerHeight);
      let size = draft.presentation.contentSize / 100;
      let result = paginateAt(size);
      // Leave one measured pixel of slack so rounding at an exact page boundary
      // cannot move the final field onto an extra page.
      const singlePageSize = available / (headerHeight + Object.values(heights).reduce((sum, height) => sum + height, 0) + 1);
      if (draft.presentation.pageMode === 'fit' && draft.presentation.targetPages === 1) {
        size = Math.min(size, singlePageSize);
        result = [items];
      } else if (draft.presentation.pageMode === 'fit' && result.length > draft.presentation.targetPages) {
        // Find the largest content size that fits the requested page limit.
        // Measuring at the original text width preserves line breaks and shaping.
        let low = Math.min(size, singlePageSize);
        let high = size;
        for (let step = 0; step < 20; step++) {
          const middle = (low + high) / 2;
          if (paginateAt(middle).length <= draft.presentation.targetPages) low = middle;
          else high = middle;
        }
        size = low;
        result = paginateAt(size);
      }
      setContentScale(size);
      setPages(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
      // Give React time to commit the measured pages before export is enabled.
      requestAnimationFrame(() => { if (!cancelled) onReady(true); });
    };
    document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      observer = new ResizeObserver(measure);
      if (measureRef.current) observer.observe(measureRef.current);
    });
    return () => { cancelled = true; observer?.disconnect(); };
  }, [draft, items, onReady]);

  return <>
    <div className="measurement-host" aria-hidden="true">
      <div ref={measureRef} className={`${className} measurement-page`} style={documentStyle} lang={draft.settings.language}>
        <DocumentHeader draft={draft} />
        {items.map(item => <DocumentItem key={item.id} item={item} />)}
      </div>
    </div>
    <div className="document-pages" ref={widthRef}>
      <div ref={rootRef}>
        {pages.map((page, index) => <div className="page-viewport" key={index} style={{ height: 1123 * scale }}>
          <article className={className} lang={draft.settings.language} data-pdf-page style={{ ...documentStyle, transform: `scale(${scale})` }} aria-label={`Biodata page ${index + 1}`}>
            <DocumentBackground draft={draft} />
            <ThemeArtwork motif={theme.motif} />
            <div className="document-flow" style={{ transform: `scale(${contentScale})`, marginLeft: `${(1 - contentScale) * 50}%` }}>
            <DocumentHeader draft={draft} />
            <div className="document-content">{page.map(item => <DocumentItem key={item.id} item={item} />)}</div>
            {!items.length && <p className="document-empty">{t('A new chapter starts here.')}<br /><span>{t('Your details will appear as you fill in the form.')}</span></p>}
            </div>
            <footer className="document-footer"><span>{draft.data.fullName}</span><span>{index + 1} / {pages.length}</span></footer>
          </article>
        </div>)}
      </div>
    </div>
    <div className="page-count">A4 · {pages.length} {t(pages.length === 1 ? 'page' : 'pages')} · {t('Ready for print')}</div>
    {contentScale < .7 && <p className="page-fit-notice" role="status">{t('Text is small at this page count. Allow more pages or shorten the content for easier reading.')} ({Math.round(contentScale * 100)}%)</p>}
  </>;
}
