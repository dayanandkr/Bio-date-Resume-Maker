import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, RotateCcw, Settings2, Trash2, Undo2, X } from 'lucide-react';
import { allFields, fields, isCustom, moveField, resolveField, sections } from '../model';
import type { Draft, EditableField, SectionId } from '../model';
import { tr } from '../i18n';

type Props = {
  draft: Draft; setDraft: Dispatch<SetStateAction<Draft>>; section: SectionId;
  errors: Record<string, string>; onChange: (key: string, value: string) => void;
};

export default function FieldEditor({ draft, setDraft, section, errors, onChange }: Props) {
  const t = (text: string) => tr(draft.settings.language, text);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [multiline, setMultiline] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const [message, setMessage] = useState('');
  const [removed, setRemoved] = useState<{ field: EditableField; value: string; section: SectionId; index: number } | null>(null);
  const entries = draft.fieldLayout[section];
  const known = new Set(Object.values(draft.fieldLayout).flat().map(field => field.key));
  const missing = allFields.filter(field => !known.has(field.key));

  function add() {
    if (!newLabel.trim()) { setMessage('Enter a field label.'); return; }
    if ([...known].filter(isCustom).length >= 40) { setMessage('Custom field limit reached (40).'); return; }
    const key = `custom_${crypto.randomUUID()}`;
    setDraft(previous => ({ ...previous, data: { ...previous.data, [key]: '' }, fieldLayout: { ...previous.fieldLayout, [section]: [...previous.fieldLayout[section], { key, label: newLabel.trim(), multiline }] } }));
    setAdding(false); setNewLabel(''); setMessage('');
    window.setTimeout(() => document.getElementById(key)?.focus(), 0);
  }

  function remove(field: EditableField, index: number) {
    if (field.key === 'fullName') return;
    setRemoved({ field, value: draft.data[field.key], section, index });
    setDraft(previous => {
      const data = { ...previous.data };
      if (isCustom(field.key)) delete data[field.key]; else data[field.key] = '';
      return { ...previous, data, fieldLayout: { ...previous.fieldLayout, [section]: previous.fieldLayout[section].filter(item => item.key !== field.key) } };
    });
  }

  function undo() {
    if (!removed) return;
    setDraft(previous => {
      if (Object.values(previous.fieldLayout).flat().some(field => field.key === removed.field.key)) return previous;
      if (isCustom(removed.field.key) && Object.values(previous.fieldLayout).flat().filter(field => isCustom(field.key)).length >= 40) return previous;
      const list = [...previous.fieldLayout[removed.section]];
      list.splice(Math.min(removed.index, list.length), 0, removed.field);
      return { ...previous, data: { ...previous.data, [removed.field.key]: removed.value }, fieldLayout: { ...previous.fieldLayout, [removed.section]: list } };
    });
    setRemoved(null);
  }

  function rename(field: EditableField, reset = false) {
    if (!reset && !labelValue.trim()) { setMessage('Enter a field label.'); return; }
    setDraft(previous => ({ ...previous, fieldLayout: { ...previous.fieldLayout, [section]: previous.fieldLayout[section].map(item => item.key === field.key ? { ...item, label: reset ? undefined : labelValue.trim() } : item) } }));
    setEditing(null); setMessage('');
  }

  function restore() {
    setDraft(previous => {
      const present = new Set(Object.values(previous.fieldLayout).flat().map(field => field.key));
      const fieldLayout = { ...previous.fieldLayout };
      for (const item of sections) fieldLayout[item.id] = [...previous.fieldLayout[item.id], ...fields[item.id].filter(field => !present.has(field.key)).map(field => ({ key: field.key }))];
      return { ...previous, fieldLayout };
    });
    setRemoved(null);
  }

  return <>
    <form className="fields-grid editable-fields" noValidate onSubmit={event => event.preventDefault()}>
      {entries.map((item, index) => {
        const field = resolveField(item, draft.settings.language);
        const locked = field.key === 'fullName';
        return <div className={`field ${field.full ? 'field-full' : ''}`} key={field.key} data-field-key={field.key}>
          <div className="field-heading"><label htmlFor={field.key}>{field.label}{locked && <span className="required-star"> *</span>}</label>
            {!locked && <div className="field-tools">
              <button type="button" title={t('Move up')} aria-label={`${t('Move up')}: ${field.label}`} disabled={index === 0 || (section === 'personal' && index === 1)} onClick={() => setDraft(previous => moveField(previous, field.key, section, -1))}><ArrowUp size={13} /></button>
              <button type="button" title={t('Move down')} aria-label={`${t('Move down')}: ${field.label}`} disabled={index === entries.length - 1} onClick={() => setDraft(previous => moveField(previous, field.key, section, 1))}><ArrowDown size={13} /></button>
              <button type="button" title={t('Rename field')} aria-label={`${t('Rename field')}: ${field.label}`} aria-expanded={editing === field.key} onClick={() => { setEditing(editing === field.key ? null : field.key); setLabelValue(field.label); setMessage(''); }}><Settings2 size={13} /></button>
              <button type="button" title={t('Remove field')} aria-label={`${t('Remove field')}: ${field.label}`} onClick={() => remove(item, index)}><Trash2 size={13} /></button>
            </div>}
          </div>
          {editing === field.key && <div className="field-options">
            <label htmlFor={`label-${field.key}`}>{t('Field label')}</label><input id={`label-${field.key}`} value={labelValue} maxLength={60} onChange={event => setLabelValue(event.target.value)} />
            <div className="label-actions"><button type="button" className="text-button" onClick={() => rename(item)}><Check size={13} />{t('Save label')}</button>{!isCustom(item.key) && <button type="button" className="text-button" onClick={() => rename(item, true)}>{t('Restore default label')}</button>}<button type="button" className="icon-button" aria-label={t('Cancel')} onClick={() => setEditing(null)}><X size={14} /></button></div>
            <label htmlFor={`move-${field.key}`}>{t('Move to section')}</label><select id={`move-${field.key}`} value={section} onChange={event => { setDraft(previous => moveField(previous, field.key, event.target.value as SectionId)); setEditing(null); }}>{sections.map(target => <option key={target.id} value={target.id}>{t(target.title)}</option>)}</select>
          </div>}
          {field.type === 'textarea' ? <textarea id={field.key} value={draft.data[field.key] ?? ''} placeholder={field.placeholder} rows={4} maxLength={1200} onChange={event => onChange(field.key, event.target.value)} />
            : <input id={field.key} type={field.type ?? 'text'} value={draft.data[field.key] ?? ''} placeholder={field.placeholder} maxLength={field.maxLength ?? 120} required={locked} autoComplete={locked ? 'name' : field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'off'} min={field.type === 'date' ? '1900-01-01' : undefined} max={field.type === 'date' ? new Date().toLocaleDateString('en-CA') : undefined} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `${field.key}-error` : undefined} onChange={event => onChange(field.key, event.target.value)} />}
          {errors[field.key] && <span className="field-error" id={`${field.key}-error`} role="alert">{t(errors[field.key])}</span>}
        </div>;
      })}
    </form>
    {removed && <div className="removed-notice"><span>{t('Field removed.')}</span><button className="text-button" onClick={undo}><Undo2 size={13} />{t('Undo')}</button></div>}
    {message && <p className="field-error" role="alert">{t(message)}</p>}
    {adding ? <div className="add-field-panel"><label htmlFor="new-field-label">{t('Field label')}</label><input id="new-field-label" value={newLabel} maxLength={60} placeholder={t('Field label')} onChange={event => setNewLabel(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} autoFocus /><label htmlFor="new-field-type">{t('Field type')}</label><select id="new-field-type" value={multiline ? 'long' : 'short'} onChange={event => setMultiline(event.target.value === 'long')}><option value="short">{t('Short text')}</option><option value="long">{t('Long text')}</option></select><div className="add-field-actions"><button className="button button-primary button-small" onClick={add}><Plus size={14} />{t('Add field')}</button><button className="text-button" onClick={() => { setAdding(false); setMessage(''); }}>{t('Cancel')}</button></div></div>
      : <button className="add-field-button" onClick={() => { setAdding(true); setMessage(''); }}><Plus size={16} />{t('Add New Field')}</button>}
    {!!missing.length && <button className="text-button restore-fields" onClick={restore}><RotateCcw size={13} />{t('Restore removed fields')} ({missing.length})</button>}
    <p className="form-hint">{t('Name is required. Other fields can be renamed, moved, or removed.')}</p>
  </>;
}
