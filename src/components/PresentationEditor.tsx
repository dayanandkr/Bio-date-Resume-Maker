import { useRef } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Check, Download, ImagePlus, ImageOff, Palette, X } from 'lucide-react';
import type { Draft } from '../model';
import { tr } from '../i18n';
import { backgrounds, devotionalImages, devotionalSource } from '../presentation';
import type { Presentation } from '../presentation';
import { preparePhoto } from '../lib/photo';

type Props = { draft: Draft; setDraft: Dispatch<SetStateAction<Draft>>; onWorking: (value: boolean) => void; onNotice: (message: string) => void };

function usePresentation({ draft, setDraft, onWorking, onNotice }: Props) {
  const t = (text: string) => tr(draft.settings.language, text);
  const update = (patch: Partial<Presentation>) => setDraft(previous => ({ ...previous, presentation: { ...previous.presentation, ...patch } }));
  async function upload(event: ChangeEvent<HTMLInputElement>, kind: 'god' | 'background') {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onWorking(true);
    try {
      const image = await preparePhoto(file, kind === 'god'
        ? { preserveTransparency: true, maxEdge: 500, maxDataLength: 1_000_000 }
        : { maxEdge: 1400, maxDataLength: 1_500_000 });
      update(kind === 'god' ? { customDevotionalImage: image, devotionalImage: 'custom' } : { customBackground: image, background: 'custom' });
      onNotice(t('Image added. It stays on your device.'));
    } catch (error) { onNotice(error instanceof Error ? error.message : t('This image could not be opened.')); }
    finally { onWorking(false); }
  }
  return { t, update, upload, value: draft.presentation };
}

export function HeadingEditor(props: Props) {
  const { t, update, upload, value } = usePresentation(props);
  const dialog = useRef<HTMLDialogElement>(null);
  const source = devotionalSource(value);
  const name = value.devotionalImage === 'custom' ? 'Your image' : devotionalImages.find(item => item.id === value.devotionalImage)!.name;
  return <section className="heading-editor" aria-labelledby="biodata-heading-label">
    <div className="presentation-heading"><h3 id="biodata-heading-label">{t('Biodata heading')}</h3><span className="theme-free">{t('Free')}</span></div>
    <div className="field"><label htmlFor="biodata-title">{t('Biodata Title')}</label><input id="biodata-title" maxLength={80} value={value.title} placeholder={t('Marriage biodata')} onChange={event => update({ title: event.target.value })} /></div>
    <div className="selected-god"><div className="selected-god-image">{source ? <img src={source} alt={t(name)} /> : <ImageOff size={23} strokeWidth={1.2} />}</div><div><span>{t('Selected God')}</span><strong>{t(name)}</strong><button className="text-button" onClick={() => dialog.current?.showModal()}><ImagePlus size={14} />{t('Change God Photo')}</button></div>{source && <button className="icon-button" aria-label={t('Remove God photo')} onClick={() => update({ devotionalImage: 'none' })}><X size={17} /></button>}</div>
    <div className="field"><label htmlFor="god-name">{t('God Name / blessing')}</label><input id="god-name" maxLength={120} value={value.godName} placeholder="॥ श्री गणेशाय नमः ॥" onChange={event => update({ godName: event.target.value })} /></div>
    {source && <label className="presentation-slider" htmlFor="god-image-size"><span>{t('God image size')}<output>{value.godImageSize} px</output></span><input id="god-image-size" type="range" min={40} max={112} step={4} value={value.godImageSize} onChange={event => update({ godImageSize: Number(event.target.value) })} /></label>}
    {value.devotionalImage !== 'none' && value.devotionalImage !== 'custom' && <button className="text-button blessing-suggestion" onClick={() => update({ godName: devotionalImages.find(item => item.id === value.devotionalImage)!.blessing })}>{t('Use suggested blessing')}</button>}
    <dialog ref={dialog} className="modal artwork-modal" aria-labelledby="god-picker-title">
      <button className="modal-close icon-button" aria-label={t('Close')} onClick={() => dialog.current?.close()}><X size={19} /></button>
      <span className="eyebrow">{t('All artwork is free')}</span><h2 id="god-picker-title">{t('Change God Photo')}</h2><p>{t('Choose an image or upload your own. The blessing is editable.')}</p>
      <div className="god-options">{devotionalImages.map(item => <button key={item.id} className="god-option" aria-pressed={value.devotionalImage === item.id} onClick={() => { update({ devotionalImage: item.id }); dialog.current?.close(); }}>
        <span className="god-option-art">{item.src ? <img loading="lazy" src={item.src} alt="" /> : <ImageOff size={32} strokeWidth={1} />}{value.devotionalImage === item.id && <i><Check size={13} /></i>}</span><strong>{t(item.name)}</strong><span>{t('Free')}</span>
      </button>)}{value.customDevotionalImage && <button className="god-option" aria-pressed={value.devotionalImage === 'custom'} onClick={() => { update({ devotionalImage: 'custom' }); dialog.current?.close(); }}><span className="god-option-art"><img src={value.customDevotionalImage} alt="" /></span><strong>{t('Your image')}</strong></button>}</div>
      <label className="artwork-upload"><ImagePlus size={18} /><span>{t('Upload God photo')}<small>JPG, PNG, WebP · {t('Up to 5 MB')}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t('Upload God photo')} onChange={async event => { await upload(event, 'god'); dialog.current?.close(); }} /></label>
      {value.customDevotionalImage && <button className="text-button danger-text" onClick={() => update({ customDevotionalImage: '', devotionalImage: value.devotionalImage === 'custom' ? 'none' : value.devotionalImage })}>{t('Delete uploaded God photo')}</button>}
      {source && <a className="text-button artwork-download" href={source} download={`bioresume-${value.devotionalImage}.png`}><Download size={14} />{t('Download selected artwork')}</a>}
      <button className="button button-primary button-small" onClick={() => dialog.current?.close()}>{t('Done')}</button>
    </dialog>
  </section>;
}

export function BackgroundPicker(props: Props) {
  const { t, update, upload, value } = usePresentation(props);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = backgrounds.find(item => item.id === value.background);
  return <div className="background-bar">
    <span><Palette size={14} /><span>{t('Background')}<strong>{t(selected?.name ?? 'Your background')}</strong></span></span>
    <button className="text-button" onClick={() => dialog.current?.showModal()}>{t('Change background')}</button>
    <dialog ref={dialog} className="modal artwork-modal background-modal" aria-labelledby="background-picker-title">
      <button className="modal-close icon-button" aria-label={t('Close')} onClick={() => dialog.current?.close()}><X size={19} /></button>
      <span className="eyebrow">{t('All backgrounds are free')}</span><h2 id="background-picker-title">{t('Choose your background')}</h2><p>{t('Mix any background with any template.')}</p>
      <div className="background-options">{backgrounds.map(item => <button key={item.id} className="background-option" aria-pressed={value.background === item.id} onClick={() => update({ background: item.id })}>
        <span className={`background-swatch ${item.panel ? 'has-paper-panel' : ''}`} style={{ background: item.css }}>{item.image && <img src={item.image} alt="" loading="lazy" />}<span className="swatch-lines"><i /><i /><i /></span>{value.background === item.id && <b><Check size={14} /></b>}</span><strong>{t(item.name)}</strong>
      </button>)}{value.customBackground && <button className="background-option" aria-pressed={value.background === 'custom'} onClick={() => update({ background: 'custom' })}><span className="background-swatch"><img src={value.customBackground} alt="" /></span><strong>{t('Your background')}</strong></button>}</div>
      {value.background !== 'original' && <label className="presentation-slider" htmlFor="background-strength"><span>{t('Background intensity')}<output>{value.backgroundStrength}%</output></span><input id="background-strength" type="range" min={10} max={100} step={5} value={value.backgroundStrength} onChange={event => update({ backgroundStrength: Number(event.target.value) })} /></label>}
      <label className="artwork-upload"><ImagePlus size={18} /><span>{t('Upload background')}<small>JPG, PNG, WebP · {t('Up to 5 MB')}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t('Upload background')} onChange={event => upload(event, 'background')} /></label>
      {value.customBackground && <button className="text-button danger-text" onClick={() => update({ customBackground: '', background: value.background === 'custom' ? 'original' : value.background })}>{t('Delete uploaded background')}</button>}
      <div className="background-modal-footer"><button className="text-button" onClick={() => update({ background: 'original', backgroundStrength: 100 })}>{t('Use template original')}</button><button className="button button-primary button-small" onClick={() => dialog.current?.close()}>{t('Done')}</button></div>
    </dialog>
  </div>;
}

export function PageLayoutEditor(props: Props) {
  const { t, update, value } = usePresentation(props);
  const mode = value.pageMode === 'auto' ? 'auto' : value.targetPages === 1 ? 'single' : 'target';
  return <details className="page-layout-editor">
    <summary>{t('Page layout')}<span>{t(value.pageMode === 'auto' ? 'Automatic pages' : value.targetPages === 1 ? 'Fit to one page' : 'Target page count')}</span></summary>
    <div className="page-layout-controls"><div><label htmlFor="page-mode">{t('Arrange content')}</label><select id="page-mode" value={mode} onChange={event => update(event.target.value === 'auto' ? { pageMode: 'auto' } : { pageMode: 'fit', targetPages: event.target.value === 'single' ? 1 : Math.max(2, value.targetPages) })}>
      <option value="auto">{t('Automatic pages')}</option><option value="single">{t('Fit to one page')}</option><option value="target">{t('Target page count')}</option>
    </select></div>
    {mode === 'target' && <div><label htmlFor="target-pages">{t('Maximum pages')}</label><select id="target-pages" value={value.targetPages} onChange={event => update({ targetPages: Number(event.target.value) })}>{Array.from({ length: 9 }, (_, index) => index + 2).map(count => <option key={count} value={count}>{count}</option>)}</select></div>}
    </div>
    <label className="presentation-slider" htmlFor="content-size"><span>{t('Content size')}<output>{value.contentSize}%</output></span><input id="content-size" type="range" min={70} max={110} step={5} value={value.contentSize} onChange={event => update({ contentSize: Number(event.target.value) })} /></label>
    <p>{t(value.pageMode === 'fit' ? 'Content shrinks only as needed. Short biodata may use fewer pages.' : 'Text flows onto more pages when needed.')}</p>
  </details>;
}
