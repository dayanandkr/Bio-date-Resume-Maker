type Layout = 'traditional' | 'modern' | 'elegant' | 'minimal' | 'portrait';
export type Motif = 'none' | 'wave' | 'frame' | 'grain' | 'shade' | 'flame' | 'flower' | 'velvet' | 'temple' | 'ganesha' | 'lotus' | 'rose' | 'leaf' | 'arch' | 'ribbon' | 'diamond';
type Theme = { id: string; name: string; description: string; color: string; category: string; layout: Layout; motif: Motif; price: 0 };
function theme(id: string, name: string, color: string, layout: Layout, motif: Motif, category: string, description: string): Theme {
  return { id, name, color, layout, motif, category, description, price: 0 };
}

// Original CSS/SVG designs. Every entry uses the same free preview and download flow.
export const templates = [
  theme('traditional', 'Traditional', '#805044', 'traditional', 'none', 'Classic', 'Timeless & graceful'),
  theme('modern', 'Modern', '#214f43', 'modern', 'none', 'Modern', 'Fresh & thoughtful'),
  theme('elegant', 'Elegant', '#755c85', 'elegant', 'none', 'Classic', 'A touch of occasion'),
  theme('minimal', 'Minimal', '#475569', 'minimal', 'none', 'Minimal', 'Simply you'),
  theme('portrait', 'Portrait', '#345c75', 'portrait', 'none', 'Modern', 'Put a face to your story'),
  theme('abstract-orange', 'Abstract Orange', '#b66a32', 'minimal', 'wave', 'Abstract', 'Warm flowing curves'),
  theme('red-velvet', 'Red Velvet', '#8c3444', 'elegant', 'velvet', 'Classic', 'Rich red flourishes'),
  theme('abstract-frame', 'Abstract Frame', '#8a693d', 'minimal', 'frame', 'Abstract', 'Layered geometric lines'),
  theme('abstract-yellow', 'Abstract Yellow', '#977315', 'modern', 'wave', 'Abstract', 'A little golden sunshine'),
  theme('abstract-wood', 'Abstract Wood', '#7d5741', 'traditional', 'grain', 'Abstract', 'Natural wood accents'),
  theme('abstract-shaded', 'Abstract Shaded', '#596b87', 'minimal', 'shade', 'Abstract', 'Soft geometric corners'),
  theme('abstract-flames', 'Abstract Flames', '#a14831', 'modern', 'flame', 'Abstract', 'Graceful amber lines'),
  theme('abstract-flower', 'Abstract Flower', '#9a5870', 'elegant', 'flower', 'Floral', 'Delicate floral corners'),
  theme('blue-velvet', 'Blue Velvet', '#344f83', 'elegant', 'velvet', 'Classic', 'A deep blue occasion'),
  theme('abstract-red', 'Abstract Red', '#ac4545', 'modern', 'ribbon', 'Abstract', 'Bold crimson ribbons'),
  theme('abstract-temple', 'Abstract Temple', '#9b713c', 'traditional', 'temple', 'Traditional', 'Architectural details'),
  theme('abstract-ganesha', 'Abstract Ganesha', '#aa643d', 'traditional', 'ganesha', 'Traditional', 'An auspicious beginning'),
  theme('abstract-lotus', 'Abstract Lotus', '#975b80', 'elegant', 'lotus', 'Floral', 'Lotus in full bloom'),
  theme('abstract-rose', 'Abstract Rose', '#a85965', 'minimal', 'rose', 'Floral', 'Soft rose details'),
  theme('abstract-blue', 'Abstract Blue', '#34769b', 'modern', 'wave', 'Abstract', 'Calm blue movement'),
  theme('abstract-open', 'Abstract Open', '#7d7662', 'minimal', 'frame', 'Minimal', 'An open, airy frame'),
  theme('green-1', 'Green 1', '#4e714d', 'modern', 'leaf', 'Nature', 'Fresh botanical accents'),
  theme('green-2', 'Green 2', '#3c665d', 'minimal', 'arch', 'Nature', 'A garden arch'),
  theme('green-3', 'Green 3', '#71834a', 'portrait', 'leaf', 'Nature', 'Olive branches'),
  theme('classic-1', 'Classic 1', '#655d53', 'traditional', 'diamond', 'Classic', 'A quiet heirloom'),
  theme('classic-2', 'Classic 2', '#9b7e4b', 'elegant', 'frame', 'Classic', 'Fine golden lines'),
  theme('classic-3', 'Classic 3', '#30435e', 'minimal', 'ribbon', 'Classic', 'Navy and ivory'),
  theme('classic-4', 'Classic 4', '#826678', 'elegant', 'arch', 'Classic', 'A graceful silhouette'),
  theme('classic-5', 'Classic 5', '#8e4942', 'traditional', 'velvet', 'Classic', 'Warm heritage details'),
  theme('classic-6', 'Classic 6', '#46675d', 'portrait', 'diamond', 'Classic', 'A personal signature'),
  theme('classic-7', 'Classic 7', '#68647e', 'modern', 'shade', 'Classic', 'Soft slate geometry'),
  theme('classic-8', 'Classic 8', '#786f5d', 'minimal', 'none', 'Minimal', 'Understated and open'),
] as const;
export type TemplateId = typeof templates[number]['id'];
