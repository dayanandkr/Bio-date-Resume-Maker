import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { templates } from '../themes';
import type { Language } from '../i18n';
import { tr } from '../i18n';
import { TemplateMiniature } from './DocumentPreview';

export default function ThemeGallery({ selected, language, onSelect }: { selected: string; language: Language; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const t = (text: string) => tr(language, text);
  const filtered = templates.filter(theme => (!category || theme.category === category) && `${theme.name} ${theme.description}`.toLowerCase().includes(search.toLowerCase()));
  const shown = expanded ? filtered : templates.slice(0, 5);
  return <section className="templates-section" id="templates" aria-labelledby="templates-title">
    <div className="section-heading"><div><span className="step-number">01</span><h2 id="templates-title">{t('Choose your style')}</h2><span className="section-description">{t('Every theme is free. Always.')}</span></div><span className="free-label">{t('ALL TEMPLATES FREE')}</span></div>
    {expanded && <div className="theme-filters"><label className="theme-search"><Search size={15} /><input aria-label={t('Search themes')} placeholder={t('Search themes')} value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label={t('All styles')} value={category} onChange={event => setCategory(event.target.value)}><option value="">{t('All styles')}</option>{[...new Set(templates.map(theme => theme.category))].map(item => <option key={item}>{item}</option>)}</select></div>}
    <div className={`template-grid ${expanded ? 'all-themes' : ''}`}>{shown.map(template => <button key={template.id} className={`template-card ${selected === template.id ? 'selected' : ''}`} data-theme-id={template.id} data-price={template.price} aria-pressed={selected === template.id} aria-label={`${template.name} template`} onClick={() => onSelect(template.id)} style={{ '--mini-accent': template.color } as CSSProperties}>
      <div className="template-art"><TemplateMiniature id={template.id} />{selected === template.id && <span className="template-check"><Check size={13} strokeWidth={3} /></span>}</div><div className="template-card-caption"><div><strong>{template.name}</strong><span className="theme-free">{t('Free')}</span></div><span>{template.description}</span></div>
    </button>)}</div>
    {!shown.length && <p className="theme-empty">{t('No matching themes.')}</p>}
    <div className="gallery-footer"><span>{templates.length} {t('Free').toLowerCase()} themes · {templates.find(theme => theme.id === selected)?.name}</span><button className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{t(expanded ? 'Show fewer themes' : 'Browse all themes')} ({templates.length})<ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} /></button></div>
  </section>;
}
