import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown, CircleHelp, FileDown, FileHeart, FolderOpen, Heart, ImagePlus, LoaderCircle, LockKeyhole, Palette, Printer, RotateCcw, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import DocumentPreview from './components/DocumentPreview';
import FieldEditor from './components/FieldEditor';
import ThemeGallery from './components/ThemeGallery';
import { BackgroundPicker, HeadingEditor, PageLayoutEditor } from './components/PresentationEditor';
import { createDraft, parseDraft, sampleData, sections, storageKey, templates, validateData, visibleKeys } from './model';
import type { Draft, SectionId } from './model';
import { languages, tr } from './i18n';
import { downloadPdf, exportDraft } from './lib/pdf';
import { preparePhoto } from './lib/photo';

function loadInitial() {
  try {
    const saved = localStorage.getItem(storageKey);
    return { draft: saved ? parseDraft(saved) : createDraft(), saved: !!saved, warning: '' };
  } catch {
    return { draft: createDraft(), saved: false, warning: 'Your saved draft could not be loaded. You can still create a new biodata.' };
  }
}

export default function App() {
  const [initial] = useState(loadInitial);
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [activeSection, setActiveSection] = useState<SectionId>('personal');
  const [saveLocal, setSaveLocal] = useState(initial.saved);
  const [saveStatus, setSaveStatus] = useState(initial.saved ? 'Saved on this device' : 'Your details stay in this tab');
  const [notice, setNotice] = useState(initial.warning);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDialogElement>(null);
  const resetRef = useRef<HTMLDialogElement>(null);
  const hasDetails = Object.values(draft.data).some(value => value.trim()) || !!draft.photo;
  const previewDraft = useMemo(() => hasDetails ? draft : { ...draft, data: sampleData }, [draft, hasDetails]);
  const selectedTemplate = templates.find(template => template.id === draft.settings.template)!;
  const currentIndex = sections.findIndex(section => section.id === activeSection);
  const currentSection = sections[currentIndex];
  const working = busy || photoLoading;
  const language = draft.settings.language;
  const t = (text: string) => tr(language, text);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  useEffect(() => {
    if (!saveLocal) return;
    setSaveStatus('Saving…');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        setSaveStatus('Saved on this device');
      } catch {
        setSaveStatus('Could not save on this device');
        setNotice('Browser storage is unavailable or full. Download a draft file to keep your work.');
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft, saveLocal]);

  // Flush a pending autosave if the user closes or reloads before the debounce completes.
  useEffect(() => {
    const flush = () => { if (saveLocal) { try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* The visible save state reports storage failures. */ } } };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [draft, saveLocal]);

  function updateField(key: string, value: string) {
    setDraft(previous => ({ ...previous, data: { ...previous.data, [key]: value } }));
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
  }

  function selectSection(id: SectionId) {
    setActiveSection(id);
  }

  function validate() {
    const included = visibleKeys(draft);
    const found = validateData(Object.fromEntries(Object.entries(draft.data).map(([key, value]) => [key, key === 'fullName' || included.has(key) ? value : ''])));
    setErrors(found);
    if (Object.keys(found).length) {
      const section = sections.find(item => draft.fieldLayout[item.id].some(field => found[field.key]))!;
      setActiveSection(section.id);
      setNotice('Please check the highlighted fields before downloading.');
      window.setTimeout(() => document.getElementById(Object.keys(found)[0])?.focus(), 0);
      return false;
    }
    return true;
  }

  async function handleDownload() {
    if (working || !pdfReady || !previewRef.current || !validate()) return;
    setBusy(true);
    setNotice('Preparing your PDF. This may take a few seconds…');
    try {
      await downloadPdf(previewRef.current, draft.data.fullName, language, draft.presentation.title);
      setNotice('Your PDF is ready. Check your browser’s downloads.');
    } catch (error) {
      setNotice(`${error instanceof Error ? error.message : 'The PDF could not be created.'} You can also use Print / Save as PDF.`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoLoading(true);
    try {
      const photo = await preparePhoto(file);
      setDraft(previous => ({ ...previous, photo }));
      setNotice('Photo added. It stays on your device.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That photo could not be opened. Try another image.');
    } finally { setPhotoLoading(false); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Choose a BioResume draft smaller than 5 MB.');
      const incoming = parseDraft(await file.text());
      setDraft(incoming);
      setEditorEpoch(previous => previous + 1);
      setErrors({});
      setNotice('Your draft is open. Continue editing below.');
      setActiveSection('personal');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'This draft could not be opened.'); }
  }

  function toggleSave(enabled: boolean) {
    try {
      if (enabled) localStorage.setItem(storageKey, JSON.stringify(draft));
      else localStorage.removeItem(storageKey);
      setSaveLocal(enabled);
      setSaveStatus(enabled ? 'Saved on this device' : 'Your details stay in this tab');
    } catch { setNotice('Your browser could not update saved data. Check its storage settings or download a draft file.'); }
  }

  function reset() {
    try { localStorage.removeItem(storageKey); }
    catch { setNotice('Browser storage could not be cleared. Please clear this site’s data in your browser settings.'); return; }
    setSaveLocal(false);
    setDraft(createDraft());
    setEditorEpoch(previous => previous + 1);
    setErrors({});
    setActiveSection('personal');
    setSaveStatus('Your details stay in this tab');
    setNotice('Your details and saved browser draft have been cleared.');
    resetRef.current?.close();
  }

  function fillSample() {
    if (hasDetails) return;
    setDraft(previous => ({ ...previous, data: { ...sampleData } }));
    setNotice('Example details loaded. Replace them with your own before sharing.');
  }

  return <>
    <a className="skip-link" href="#editor">Skip to biodata editor</a>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="BioResume home"><span className="brand-icon"><FileHeart size={23} strokeWidth={1.6} /></span><span>Bio<span className="brand-light">Resume</span><span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a className="nav-active" href="#editor">Biodata maker</a><a href="#templates">Templates <span className="nav-count">{templates.length}</span></a><button className="nav-link" onClick={() => helpRef.current?.showModal()}>How it works</button></nav>
      <span className="header-free"><span className="status-dot" />Always free to create</span>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span />FOR YOUR NEXT CHAPTER</div><h1>Your story.<br className="mobile-break" /> <em>Beautifully presented.</em></h1><p>Create a marriage biodata that feels like you.<br className="mobile-break" /> Thoughtful templates. A beautiful PDF. All free.</p>
          <div className="hero-benefits"><span><Check size={14} />No signup</span><span><Check size={14} />No watermark</span><span><LockKeyhole size={13} />Private by design</span></div>
        </div>
        <div className="hero-note"><span className="note-star">✳</span><span>A little introduction.<br /><em>A meaningful beginning.</em></span><span className="note-line" /></div>
      </section>

      {notice && <div className="notice"><span role="status">{notice}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={17} /></button></div>}

      <fieldset className="workspace-fieldset" disabled={working}>
        <legend className="sr-only">Biodata builder</legend>
        <section className="language-bar" aria-labelledby="language-title"><div><h2 id="language-title">{t('Biodata language')}</h2><p>{t('Labels change with the language. Your entered text stays as you wrote it.')}</p></div><div className="language-options" role="group" aria-label="Biodata language">{languages.map(item => <button key={item.id} lang={item.id} aria-pressed={language === item.id} onClick={() => setDraft(previous => ({ ...previous, settings: { ...previous.settings, language: item.id } }))}>{item.name}</button>)}</div></section>
        <ThemeGallery selected={draft.settings.template} language={language} onSelect={id => { const template = templates.find(item => item.id === id)!; setDraft(previous => ({ ...previous, settings: { ...previous.settings, template: id, color: template.color } })); }} />

        <section className="builder-section" id="editor" aria-labelledby="editor-title">
          <div className="section-heading editor-heading"><div><span className="step-number">02</span><h2 id="editor-title">{t('Make it your own')}</h2><span className="section-description">{t('Your details, your story.')}</span></div><span className="privacy-hint"><ShieldCheck size={15} />{t('Your information stays with you')}</span></div>
          <div className="editor-grid">
            <div className="form-column">
              <HeadingEditor key={`heading-${editorEpoch}`} draft={draft} setDraft={setDraft} onWorking={setPhotoLoading} onNotice={setNotice} />
              <div className="form-card">
                <div className="form-tabs" role="tablist" aria-label="Biodata sections">{sections.map((section, index) => <button key={section.id} role="tab" id={`tab-${section.id}`} aria-controls={`panel-${section.id}`} aria-selected={activeSection === section.id} tabIndex={activeSection === section.id ? 0 : -1} onKeyDown={event => {
                  let next = index;
                  if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
                  else if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
                  else if (event.key === 'Home') next = 0;
                  else if (event.key === 'End') next = sections.length - 1;
                  else return;
                  event.preventDefault(); selectSection(sections[next].id); document.getElementById(`tab-${sections[next].id}`)?.focus();
                }} onClick={() => selectSection(section.id)}><span className="tab-number">{String(index + 1).padStart(2, '0')}</span>{t(section.short)}</button>)}</div>
                <div className="form-body" role="tabpanel" id={`panel-${activeSection}`} aria-labelledby={`tab-${activeSection}`}>
                  <div className="form-title"><div><h3>{t(currentSection.title)}</h3><p>{t(currentSection.subtitle)}</p></div><span>{currentIndex + 1} / 4</span></div>
                  {activeSection === 'personal' && <div className="photo-upload">
                    <label className={`photo-target ${draft.photo ? 'has-photo' : ''}`}>
                      {draft.photo ? <img src={draft.photo} alt="Your selected photo" /> : <ImagePlus size={25} strokeWidth={1.4} />}
                      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" onChange={handlePhoto} />
                    </label>
                    <div><strong>{t(photoLoading ? 'Preparing your photo…' : draft.photo ? 'Looking like you' : 'Add your photograph')}</strong><p>JPG, PNG or WebP · Up to 5 MB</p>{draft.photo ? <button className="text-button danger-text" onClick={() => setDraft(previous => ({ ...previous, photo: '' }))}><Trash2 size={12} />{t('Remove photo')}</button> : <span className="optional-note">{t('Optional, but a lovely personal touch')}</span>}</div>
                  </div>}
                  <FieldEditor key={`${editorEpoch}-${activeSection}`} draft={draft} setDraft={setDraft} section={activeSection} errors={errors} onChange={updateField} />
                  <div className="form-bottom"><button className="text-button" disabled={!currentIndex} onClick={() => selectSection(sections[currentIndex - 1].id)}><ArrowLeft size={15} />{t('Back')}</button>{currentIndex < 3 ? <button className="button button-primary button-small" onClick={() => selectSection(sections[currentIndex + 1].id)}>{t('Next')}: {t(sections[currentIndex + 1].short)}<ArrowRight size={15} /></button> : <button className="button button-primary button-small" disabled={!pdfReady} onClick={handleDownload}><ArrowDownToLine size={15} />{t('Download PDF')}</button>}</div>
                </div>
              </div>

              <div className="draft-card">
                <div className="save-toggle-row"><label className="save-label" htmlFor="save-local"><FolderOpen size={19} /><span><strong>{t('Save on this device')}</strong><small>{t(saveStatus)}</small></span></label><input className="switch" id="save-local" type="checkbox" role="switch" checked={saveLocal} onChange={event => toggleSave(event.target.checked)} /></div>
                <p className="draft-explainer">{t('Turn on to keep a draft in this browser, including your photo. Use a draft file to continue on another device.')}</p>
                <div className="draft-actions"><button className="text-button" onClick={() => exportDraft(draft)}><FileDown size={15} />{t('Download draft')}</button><button className="text-button" onClick={() => importRef.current?.click()}><FolderOpen size={15} />{t('Open draft')}</button><button className="text-button reset-button" onClick={() => resetRef.current?.showModal()}><RotateCcw size={14} />{t('Reset')}</button></div>
                <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Open draft file" onChange={importFile} />
              </div>
            </div>

            <aside className="preview-column" aria-label="Document preview">
              <div className="preview-toolbar"><div className="preview-label"><span className="status-dot" /><strong>{t('Live preview')}</strong><span className="preview-template">{selectedTemplate.name}</span></div><button className={`text-button design-trigger ${designOpen ? 'is-open' : ''}`} aria-expanded={designOpen} aria-controls="design-settings" onClick={() => setDesignOpen(!designOpen)}><Palette size={15} />{t('Customize')}<ChevronDown size={13} /></button></div>
              {designOpen && <div className="design-panel" id="design-settings">
                <div className="design-top"><label>{t('Accent color')}<input type="color" value={draft.settings.color} onChange={event => setDraft(previous => ({ ...previous, settings: { ...previous.settings, color: event.target.value } }))} /></label><label>{t('Heading font')}<select value={draft.settings.font} onChange={event => setDraft(previous => ({ ...previous, settings: { ...previous.settings, font: event.target.value as 'serif' | 'sans' } }))}><option value="serif">{t('Classic serif')}</option><option value="sans">{t('Clean sans')}</option></select></label></div>
                <span className="design-label">{t('Include in your biodata')}</span><div className="visibility-options">{sections.map(section => <label key={section.id}><input type="checkbox" checked={!draft.settings.hiddenSections.includes(section.id)} onChange={event => setDraft(previous => ({ ...previous, settings: { ...previous.settings, hiddenSections: event.target.checked ? previous.settings.hiddenSections.filter(id => id !== section.id) : [...previous.settings.hiddenSections, section.id] } }))} />{t(section.short)}</label>)}<label><input type="checkbox" checked={draft.settings.showPhoto} onChange={event => setDraft(previous => ({ ...previous, settings: { ...previous.settings, showPhoto: event.target.checked } }))} />{t('Photo')}</label></div>
              </div>}
              {!hasDetails && <div className="example-banner"><Sparkles size={14} /><span>{t('Example preview · Your details will replace this')}</span><button onClick={fillSample}>{t('Try example')}<ArrowRight size={12} /></button></div>}
              <BackgroundPicker key={`background-${editorEpoch}`} draft={draft} setDraft={setDraft} onWorking={setPhotoLoading} onNotice={setNotice} />
              <PageLayoutEditor draft={draft} setDraft={setDraft} onWorking={setPhotoLoading} onNotice={setNotice} />
              <div className="preview-canvas"><DocumentPreview draft={previewDraft} rootRef={previewRef} onReady={setPdfReady} /></div>
              <div className="download-panel"><div><h3>{t('A new chapter, ready to share.')}</h3><p>{t('High-resolution A4 PDF. No watermark. Yours to keep.')}</p></div><button className="button button-primary download-button" onClick={handleDownload} disabled={working || !pdfReady}>{busy ? <LoaderCircle size={18} className="spin" /> : <ArrowDownToLine size={18} />}{t(busy ? 'Creating your PDF…' : 'Download PDF')}</button><div className="download-meta"><span><CheckCheck size={13} />{t('Free, every time')}</span><button className="text-button" disabled={!pdfReady} onClick={() => { if (validate()) window.print(); }}><Printer size={13} />{t('Print / Save as PDF')}</button></div></div>
            </aside>
          </div>
        </section>
      </fieldset>

      <section className="reassurance"><div className="reassurance-icon"><ShieldCheck size={24} strokeWidth={1.4} /></div><div><h3>Personal details should stay personal.</h3><p>Your biodata is created on your device. We don’t upload your details or photos.<br />No account, no subscriptions, just a thoughtful introduction.</p></div><Heart className="reassurance-heart" size={30} strokeWidth={1} /></section>
    </main>

    <footer className="site-footer"><span className="footer-brand">BioResume<span>.</span></span><p>Made for meaningful beginnings.</p><button className="text-button" onClick={() => helpRef.current?.showModal()}><CircleHelp size={14} />Help & privacy</button></footer>

    <dialog ref={helpRef} className="modal"><button className="icon-button modal-close" aria-label="Close help" onClick={() => helpRef.current?.close()}><X size={20} /></button><span className="modal-symbol"><FileHeart size={25} /></span><h2>A thoughtful introduction,<br />in a few simple steps.</h2><ol className="how-steps"><li><strong>Find your style.</strong> Choose any of the {templates.length} free themes.</li><li><strong>Choose your language.</strong> English, Hindi, Marathi, Gujarati, or Nepali. Standard labels change; your entered text stays as written. Dates use the Gregorian calendar.</li><li><strong>Make it personal.</strong> Fill in your details and optionally add a photo. Add new fields, rename them, move them up/down or between sections, and remove fields you don’t need. The name field is required.</li><li><strong>Download & share.</strong> Save your A4 PDF or use your browser’s print dialog.</li></ol><div className="help-privacy"><h3>Your privacy</h3><p>Details and photos are processed on your device. “Save on this device” stores your draft in this browser until you turn it off or reset. Draft files include personal details, custom fields, their order, language, and your photo. Share them only when intended.</p><p>Direct downloads preserve your design as high-resolution images in a PDF. Use Print / Save as PDF for the browser’s text-based output. All five supported languages use locally bundled fonts.</p></div><button className="button button-primary" onClick={() => helpRef.current?.close()}>Let’s get started<ArrowRight size={16} /></button></dialog>
    <dialog ref={resetRef} className="modal reset-modal"><h2>Start a fresh chapter?</h2><p>This clears the current form, photo, and saved draft in this browser. Downloaded files will stay on your device.</p><div className="modal-actions"><button className="button button-secondary" onClick={() => resetRef.current?.close()}>Keep editing</button><button className="button button-danger" onClick={reset}>Clear & start fresh</button></div></dialog>
  </>;
}
