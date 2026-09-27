import { formatBirthDate, languages, tr } from './i18n';
import type { Language } from './i18n';
import { templates } from './themes';
import type { TemplateId } from './themes';
import { createPresentation, parsePresentation } from './presentation';
import type { Presentation } from './presentation';
export { templates } from './themes';
export type { TemplateId } from './themes';

export const sections = [
  { id: 'personal', title: 'Personal details', subtitle: 'Let’s start with a little about you.', short: 'Personal' },
  { id: 'family', title: 'Family details', subtitle: 'Introduce the people closest to you.', short: 'Family' },
  { id: 'contact', title: 'Contact details', subtitle: 'Choose how you’d like to be contacted.', short: 'Contact' },
  { id: 'about', title: 'A little more about you', subtitle: 'The little things that make you, you.', short: 'About you' },
] as const;

export type SectionId = typeof sections[number]['id'];
export type Field = { key: string; label: string; placeholder?: string; type?: 'date' | 'time' | 'email' | 'tel' | 'textarea'; full?: boolean; maxLength?: number };

export const fields: Record<SectionId, Field[]> = {
  personal: [
    { key: 'fullName', label: 'Full name', placeholder: 'Your full name', full: true, maxLength: 80 },
    { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { key: 'height', label: 'Height', placeholder: 'e.g. 5 ft 6 in' },
    { key: 'timeOfBirth', label: 'Time of birth', type: 'time' },
    { key: 'placeOfBirth', label: 'Place of birth', placeholder: 'City, state' },
    { key: 'religion', label: 'Religion', placeholder: 'e.g. Hindu' },
    { key: 'motherTongue', label: 'Mother tongue', placeholder: 'e.g. Hindi' },
    { key: 'caste', label: 'Community / caste', placeholder: 'Optional' },
    { key: 'subCaste', label: 'Sub-community', placeholder: 'Optional' },
    { key: 'education', label: 'Education', placeholder: 'e.g. B.Tech in Computer Science', full: true },
    { key: 'profession', label: 'Profession', placeholder: 'e.g. Software engineer' },
    { key: 'company', label: 'Company', placeholder: 'Where you work' },
    { key: 'income', label: 'Annual income', placeholder: 'Optional' },
    { key: 'location', label: 'Current city', placeholder: 'e.g. Bengaluru' },
  ],
  family: [
    { key: 'fatherName', label: 'Father’s name', placeholder: 'Full name' },
    { key: 'fatherOccupation', label: 'Father’s occupation', placeholder: 'Occupation' },
    { key: 'motherName', label: 'Mother’s name', placeholder: 'Full name' },
    { key: 'motherOccupation', label: 'Mother’s occupation', placeholder: 'Occupation' },
    { key: 'brothers', label: 'Brothers', placeholder: 'e.g. One elder brother' },
    { key: 'sisters', label: 'Sisters', placeholder: 'e.g. One younger sister' },
    { key: 'familyDetails', label: 'About your family', type: 'textarea', placeholder: 'Your family background, values, and a little about home…', full: true },
  ],
  contact: [
    { key: 'contactPerson', label: 'Contact person', placeholder: 'Your name or a family member', full: true },
    { key: 'phone', label: 'Mobile number', type: 'tel', placeholder: 'e.g. +91 98765 43210' },
    { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Share only as much as you’re comfortable with.', full: true },
  ],
  about: [
    { key: 'aboutMe', label: 'About me', type: 'textarea', placeholder: 'Your personality, values, and what matters to you…', full: true },
    { key: 'hobbies', label: 'Interests & hobbies', placeholder: 'e.g. Reading, travel, music', full: true },
    { key: 'expectations', label: 'Partner expectations', type: 'textarea', placeholder: 'What are you hoping to find in a partner?', full: true },
    { key: 'horoscope', label: 'Horoscope details', type: 'textarea', placeholder: 'Rashi, nakshatra, gotra, or other details (optional)', full: true },
  ],
};

export type Biodata = Record<string, string>;
export type Settings = { template: TemplateId; color: string; font: 'serif' | 'sans'; hiddenSections: SectionId[]; showPhoto: boolean; language: Language };
export type EditableField = { key: string; label?: string; multiline?: boolean };
export type FieldLayout = Record<SectionId, EditableField[]>;
export type Draft = { version: 3; documentType: 'biodata'; data: Biodata; settings: Settings; photo: string; fieldLayout: FieldLayout; presentation: Presentation };
export const allFields = Object.values(fields).flat();
export const emptyData: Biodata = Object.fromEntries(allFields.map(field => [field.key, '']));
export const defaultSettings: Settings = { template: 'modern', color: '#214f43', font: 'serif', hiddenSections: [], showPhoto: true, language: 'en' };
// Keep the original key so existing browser drafts migrate in place.
export const storageKey = 'bioresume.draft.v1';
export const createFieldLayout = (): FieldLayout => Object.fromEntries(sections.map(section => [section.id, fields[section.id].map(field => ({ key: field.key }))])) as FieldLayout;
export const createDraft = (): Draft => ({ version: 3, documentType: 'biodata', data: { ...emptyData }, settings: { ...defaultSettings, hiddenSections: [] }, photo: '', fieldLayout: createFieldLayout(), presentation: createPresentation() });
export const isCustom = (key: string) => key.startsWith('custom_');
export function resolveField(item: EditableField, language: Language): Field {
  const original = allFields.find(field => field.key === item.key);
  return original ? { ...original, label: item.label ?? tr(language, original.label), placeholder: language === 'en' ? original.placeholder : tr(language, 'Enter details') }
    : { key: item.key, label: item.label ?? '', full: true, type: item.multiline ? 'textarea' : undefined, placeholder: tr(language, 'Enter details') };
}

export function moveField(draft: Draft, key: string, destination: SectionId, offset?: number): Draft {
  if (key === 'fullName') return draft;
  const source = sections.find(section => draft.fieldLayout[section.id].some(field => field.key === key))?.id;
  if (!source) return draft;
  const layout = Object.fromEntries(sections.map(section => [section.id, [...draft.fieldLayout[section.id]]])) as FieldLayout;
  const index = layout[source].findIndex(field => field.key === key);
  if (source === destination && offset === undefined) return draft;
  const target = offset !== undefined ? index + offset : layout[destination].length;
  if (target < (destination === 'personal' ? 1 : 0) || (offset !== undefined && target >= layout[destination].length)) return draft;
  const [field] = layout[source].splice(index, 1);
  layout[destination].splice(target, 0, field);
  return { ...draft, fieldLayout: layout };
}

export function visibleKeys(draft: Draft): Set<string> {
  return new Set(sections.filter(section => !draft.settings.hiddenSections.includes(section.id)).flatMap(section => draft.fieldLayout[section.id].map(field => field.key)));
}

export const sampleData: Biodata = {
  ...emptyData,
  fullName: 'Ananya Sharma', dateOfBirth: '1998-05-14', height: '5 ft 6 in',
  religion: 'Hindu', motherTongue: 'Hindi', education: 'M.Tech, Computer Science',
  profession: 'Software Engineer', location: 'Bengaluru, Karnataka',
  fatherName: 'Rajesh Sharma', fatherOccupation: 'Business owner',
  motherName: 'Sunita Sharma', motherOccupation: 'Teacher', brothers: 'One elder brother',
  aboutMe: 'A warm-hearted optimist who finds joy in simple moments. I value kindness, meaningful conversations, and a good balance of tradition and new experiences.',
  hobbies: 'Reading, travelling & classical music',
  contactPerson: 'Parents', email: 'family@example.com',
};

export function parseDraft(raw: string): Draft {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('This is not a BioResume draft.');
  const draft = value as Omit<Partial<Draft>, 'version'> & { version?: number };
  if (![1, 2, 3].includes(draft.version ?? 0) || draft.documentType !== 'biodata' || !draft.data || typeof draft.data !== 'object' || !draft.settings) throw new Error('This draft format is not supported.');
  const normalized = createDraft();
  for (const field of allFields) {
    const text = draft.data[field.key];
    if (typeof text !== 'string' || text.length > (field.maxLength ?? (field.type === 'textarea' ? 1200 : 120))) throw new Error('The draft contains invalid or oversized fields.');
    normalized.data[field.key] = text;
  }
  const settings = draft.settings;
  if (!templates.some(item => item.id === settings.template) || !/^#[0-9a-f]{6}$/i.test(settings.color)
      || !['serif', 'sans'].includes(settings.font) || typeof settings.showPhoto !== 'boolean'
      || !Array.isArray(settings.hiddenSections) || !settings.hiddenSections.every(id => sections.some(section => section.id === id))) throw new Error('The draft contains invalid design settings.');
  if (typeof draft.photo !== 'string' || draft.photo.length > 1_500_000 || (draft.photo && !/^data:image\/(jpeg|png);base64,[a-zA-Z0-9+/=]+$/.test(draft.photo))) throw new Error('The draft contains an unsupported photo.');
  if (draft.version !== 1 && !languages.some(language => language.id === settings.language)) throw new Error('The draft contains an unsupported language.');
  normalized.settings = { template: settings.template, color: settings.color, font: settings.font, hiddenSections: [...settings.hiddenSections], showPhoto: settings.showPhoto, language: draft.version === 1 ? 'en' : settings.language };
  if (draft.version !== 1) {
    if (!draft.fieldLayout || typeof draft.fieldLayout !== 'object') throw new Error('The draft has an invalid field layout.');
    const seen = new Set<string>();
    let customCount = 0;
    for (const section of sections) {
      const entries = draft.fieldLayout[section.id];
      if (!Array.isArray(entries) || entries.length > allFields.length + 40) throw new Error('The draft has too many fields.');
      normalized.fieldLayout[section.id] = entries.map(entry => {
        if (!entry || typeof entry.key !== 'string' || seen.has(entry.key)) throw new Error('The draft contains invalid or duplicate fields.');
        seen.add(entry.key);
        const custom = /^custom_[a-zA-Z0-9_-]{1,70}$/.test(entry.key);
        if (!custom && !allFields.some(field => field.key === entry.key)) throw new Error('The draft contains an unknown field.');
        if (entry.label !== undefined && (typeof entry.label !== 'string' || !entry.label.trim() || entry.label.length > 60)) throw new Error('A field label is invalid.');
        if (entry.multiline !== undefined && typeof entry.multiline !== 'boolean') throw new Error('A field type is invalid.');
        if (custom) {
          customCount++;
          const text = draft.data![entry.key];
          if (!entry.label || typeof text !== 'string' || text.length > (entry.multiline ? 1200 : 120)) throw new Error('A custom field is invalid or oversized.');
          normalized.data[entry.key] = text;
        }
        return { key: entry.key, ...(entry.label ? { label: entry.label.trim() } : {}), ...(custom ? { multiline: !!entry.multiline } : {}) };
      });
    }
    if (customCount > 40 || normalized.fieldLayout.personal[0]?.key !== 'fullName') throw new Error('The draft needs a name field and at most 40 custom fields.');
    for (const field of allFields) if (!seen.has(field.key)) normalized.data[field.key] = '';
  }
  normalized.photo = draft.photo;
  if (draft.version === 3) normalized.presentation = parsePresentation(draft.presentation);
  return normalized;
}

export function validateData(data: Biodata): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.fullName.trim()) errors.fullName = 'Enter your full name to download your biodata.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.phone && !/^\+?[\d\s().-]{7,24}$/.test(data.phone)) errors.phone = 'Enter a valid phone number, including country code if needed.';
  if (data.dateOfBirth) {
    const date = new Date(`${data.dateOfBirth}T00:00:00`);
    const local = Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (local !== data.dateOfBirth || date > new Date() || date.getFullYear() < 1900) errors.dateOfBirth = 'Enter a valid birth date between 1900 and today.';
  }
  return errors;
}

export type DocItem = { id: string; section: SectionId; kind: 'heading' | 'row' | 'paragraph'; label: string; value: string; continuationLabel?: string };

export function getDocumentItems(data: Biodata, settings: Settings, fieldLayout: FieldLayout = createFieldLayout()): DocItem[] {
  const items: DocItem[] = [];
  for (const section of sections) {
    if (settings.hiddenSections.includes(section.id)) continue;
    const filled = fieldLayout[section.id].map(field => resolveField(field, settings.language)).filter(field => field.key !== 'fullName' && data[field.key]?.trim());
    if (!filled.length) continue;
    const heading = tr(settings.language, section.id === 'about' ? 'About me & interests' : section.title);
    const continued = tr(settings.language, 'continued');
    items.push({ id: section.id, section: section.id, kind: 'heading', label: heading, continuationLabel: `${heading} (${continued})`, value: '' });
    for (const field of filled) {
      let value = data[field.key].trim();
      if (field.type === 'date') value = formatBirthDate(value, settings.language);
      // Bound paragraphs into natural word chunks so no single item can exceed a page.
      const chunks = field.type === 'textarea' ? value.match(/[\s\S]{1,320}(?:\s|$)|[\s\S]{1,320}/g) ?? [value] : [value];
      chunks.forEach((chunk, index) => items.push({ id: `${field.key}-${index}`, section: section.id, kind: field.type === 'textarea' ? 'paragraph' : 'row', label: index ? `${field.label} (${continued})` : field.label, value: chunk.trim() }));
    }
  }
  return items;
}

export function paginate(items: DocItem[], heights: Record<string, number>, capacity: number): DocItem[][] {
  const pages: DocItem[][] = [[]];
  let used = 0;
  const headings = new Map(items.filter(item => item.kind === 'heading').map(item => [item.section, item]));
  items.forEach((item, index) => {
    const height = heights[item.id] ?? 40;
    const next = items[index + 1];
    const required = height + (item.kind === 'heading' && next ? heights[next.id] ?? 40 : 0);
    if (used + required > capacity && pages[pages.length - 1].length) {
      pages.push([]);
      used = 0;
      if (item.kind !== 'heading') {
        const heading = headings.get(item.section);
        if (heading) {
          pages[pages.length - 1].push({ ...heading, id: `${heading.id}-continued-${pages.length}`, label: heading.continuationLabel ?? `${heading.label} (continued)` });
          used += heights[heading.id] ?? 40;
        }
      }
    }
    pages[pages.length - 1].push(item);
    used += height;
  });
  return pages;
}
