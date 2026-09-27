export async function preparePhoto(file: File, options: { preserveTransparency?: boolean; maxEdge?: number; maxDataLength?: number } = {}): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Please choose a photo smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 25_000_000) throw new Error('Choose a photo smaller than 25 megapixels.');
    const ratio = Math.min(1, (options.maxEdge ?? 900) / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this photo.');
    if (!options.preserveTransparency) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = options.preserveTransparency ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88);
    if (result.length > (options.maxDataLength ?? 1_500_000)) throw new Error('This image is too detailed to save. Please choose a smaller image.');
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
