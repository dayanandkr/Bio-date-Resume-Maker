export const devotionalImages = [
  { id: 'none', name: 'No image', src: '', blessing: '' },
  { id: 'ganesha-gold', name: 'Golden Ganesha', src: '/artwork/ganesha-gold.png', blessing: '॥ श्री गणेशाय नमः ॥' },
  { id: 'ganesha-vermilion', name: 'Vermilion Ganesha', src: '/artwork/ganesha-vermilion.png', blessing: '॥ श्री गणेशाय नमः ॥' },
  { id: 'krishna-peacock', name: 'Krishna', src: '/artwork/krishna-peacock.png', blessing: '॥ श्री कृष्णाय नमः ॥' },
] as const;
export type DevotionalImageId = typeof devotionalImages[number]['id'] | 'custom';

export const backgrounds = [
  { id: 'original', name: 'Template original', family: 'Classic', css: '#fffefa', image: '', panel: false },
  { id: 'white', name: 'Pure white', family: 'Classic', css: '#ffffff', image: '', panel: false },
  { id: 'ivory', name: 'Warm ivory', family: 'Classic', css: '#fff9ed', image: '', panel: false },
  { id: 'champagne', name: 'Champagne silk', family: 'Silk', css: 'linear-gradient(135deg,#f2e6cc 0%,#fffdf7 28%,#f7efd9 52%,#fffdf7 78%,#eee0c3 100%)', image: '', panel: false },
  { id: 'blush', name: 'Rose quartz', family: 'Silk', css: 'linear-gradient(145deg,#f7e6e6,#fffdfb 38%,#fff9f7 70%,#f0dada)', image: '', panel: false },
  { id: 'sage', name: 'Sage mist', family: 'Silk', css: 'linear-gradient(135deg,#e7eedf,#fcfef8 38%,#f6f9f1 70%,#e6eedc)', image: '', panel: false },
  { id: 'blue', name: 'Blue porcelain', family: 'Silk', css: 'linear-gradient(135deg,#e2edf2,#fcfdff 36%,#f5f9fe 73%,#e2eaf2)', image: '', panel: false },
  { id: 'lavender', name: 'Lavender pearl', family: 'Silk', css: 'linear-gradient(145deg,#eee6f1,#fffdfd 38%,#fbf7fc 70%,#e9dff0)', image: '', panel: false },
  { id: 'marble', name: 'Ivory marble', family: 'Texture', css: 'repeating-linear-gradient(132deg,transparent 0 155px,#c9b99718 156px,#ffffff70 158px,transparent 164px),linear-gradient(125deg,#f4f0e9,#fffefb 35%,#f7f4ed 70%,#fffdf8)', image: '', panel: false },
  { id: 'parchment', name: 'Heritage parchment', family: 'Texture', css: 'radial-gradient(ellipse at center,#fffdf5 30%,#f3e9d1 100%)', image: '', panel: false },
  { id: 'midnight', name: 'Midnight & gold', family: 'Border', css: 'linear-gradient(145deg,#243e4b,#102831 60%,#334c56)', image: '', panel: true },
  { id: 'floral', name: 'Ivory botanicals', family: 'Artwork', css: '#fffdf7', image: '/artwork/ivory-floral.png', panel: false },
] as const;
export type BackgroundId = typeof backgrounds[number]['id'] | 'custom';
export type Presentation = {
  title: string;
  godName: string;
  devotionalImage: DevotionalImageId;
  customDevotionalImage: string;
  godImageSize: number;
  background: BackgroundId;
  customBackground: string;
  backgroundStrength: number;
  pageMode: 'auto' | 'fit';
  targetPages: number;
  contentSize: number;
};
export const createPresentation = (): Presentation => ({ title: '', godName: '', devotionalImage: 'none', customDevotionalImage: '', godImageSize: 72, background: 'original', customBackground: '', backgroundStrength: 100, pageMode: 'auto', targetPages: 1, contentSize: 100 });

export function devotionalSource(value: Presentation) {
  return value.devotionalImage === 'custom' ? value.customDevotionalImage : devotionalImages.find(image => image.id === value.devotionalImage)?.src ?? '';
}

export function isEmbeddedImage(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength && (!value || /^data:image\/(jpeg|png);base64,[a-zA-Z0-9+/=]+$/.test(value));
}

export function parsePresentation(value: unknown): Presentation {
  if (!value || typeof value !== 'object') throw new Error('The draft has invalid background or heading settings.');
  const data = value as Partial<Presentation>;
  if (typeof data.title !== 'string' || data.title.length > 80 || typeof data.godName !== 'string' || data.godName.length > 120) throw new Error('The biodata title or blessing is too long.');
  if (!devotionalImages.some(image => image.id === data.devotionalImage) && data.devotionalImage !== 'custom') throw new Error('Choose a supported devotional image.');
  if (!backgrounds.some(background => background.id === data.background) && data.background !== 'custom') throw new Error('Choose a supported background.');
  if (!isEmbeddedImage(data.customDevotionalImage, 1_000_000) || !isEmbeddedImage(data.customBackground, 1_500_000)) throw new Error('The draft has an invalid custom image.');
  if ((data.devotionalImage === 'custom' && !data.customDevotionalImage) || (data.background === 'custom' && !data.customBackground)) throw new Error('A custom image is missing from the draft.');
  if (!Number.isInteger(data.godImageSize) || data.godImageSize! < 40 || data.godImageSize! > 112 || !Number.isInteger(data.backgroundStrength) || data.backgroundStrength! < 10 || data.backgroundStrength! > 100) throw new Error('The image size or background intensity is invalid.');
  if (!['auto', 'fit'].includes(data.pageMode!) || !Number.isInteger(data.targetPages) || data.targetPages! < 1 || data.targetPages! > 10 || !Number.isInteger(data.contentSize) || data.contentSize! < 70 || data.contentSize! > 110) throw new Error('The page layout settings are invalid.');
  return { title: data.title, godName: data.godName, devotionalImage: data.devotionalImage!, customDevotionalImage: data.customDevotionalImage, godImageSize: data.godImageSize!, background: data.background!, customBackground: data.customBackground, backgroundStrength: data.backgroundStrength!, pageMode: data.pageMode!, targetPages: data.targetPages!, contentSize: data.contentSize! };
}
