const MAX_INPUT_BYTES = 2 * 1024 * 1024
const OUTPUT_SIZE = 256

/** Redimensionne une image locale en data URL JPEG (léger, stockable côté client). */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisissez un fichier image (JPG, PNG, WebP…).')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image trop lourde (max. 2 Mo).')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    const side = OUTPUT_SIZE
    canvas.width = side
    canvas.height = side
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de traiter l’image.')

    const scale = Math.max(side / img.width, side / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    if (dataUrl.length > 120_000) {
      throw new Error('Image trop grande après compression — essayez une photo plus petite.')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Fichier image illisible.'))
    img.src = src
  })
}
