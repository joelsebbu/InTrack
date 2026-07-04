const glassHandles = new Map();

const DEFAULT_OPTIONS = {
  radius: 18,
  depth: 12,
  chroma: 0.35,
  blur: 0.8,
  rimLight: 0.5,
  tint: 'rgba(255,255,255,0.06)',
  shadow: '0 8px 30px rgba(0,0,0,0.25)',
};

export async function applyGlassToElement(element, options = {}, key = element) {
  if (!element) return null;

  destroyGlass(key);

  try {
    const { applyGlass } = await import('@tomagranate/liquid-glass');
    await import('@tomagranate/liquid-glass/styles.css');

    const handle = applyGlass(element, { ...DEFAULT_OPTIONS, ...options });
    glassHandles.set(key, handle);
    return handle;
  } catch (err) {
    console.warn('Glass effect unavailable, using CSS fallback', err);
    element.classList.add('glass-fallback');
    return null;
  }
}

export function destroyGlass(key) {
  const handle = glassHandles.get(key);
  if (handle?.destroy) {
    handle.destroy();
  }
  glassHandles.delete(key);
}

export function destroyAllGlass() {
  for (const [key] of glassHandles) {
    destroyGlass(key);
  }
}

export function refreshGlass(key) {
  const handle = glassHandles.get(key);
  if (handle?.refresh) {
    handle.refresh();
  }
}
