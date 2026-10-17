// Helper to extract or render signature reference models
// The PDF contains pages:
// Page 2: B4 original (Curta, "Serpa")
// Page 4: A4 original (Completa, "Fellipe Serpa em uma linha")
// Page 6: A5-04 (Completa, "Fellipe Serpa em dois níveis")

export interface SignatureModel {
  id: 'B4' | 'A4' | 'A5-04'
  name: string
  subtitle: string
  typeLabel: 'Curta' | 'Completa'
  description: string
  pageNumber: number
  defaultStatus: 'Pronto' | 'Pendente'
  // SVG or DataURL reference representation
  svgPath?: string
  svgViewBox?: string
}

export const SIGNATURE_MODELS: Record<'B4' | 'A4' | 'A5-04', SignatureModel> = {
  B4: {
    id: 'B4',
    name: 'B4 original',
    subtitle: 'Serpa',
    typeLabel: 'Curta',
    description:
      'Comece por Serpa. Três partes: topo angular, cintura e laço inferior. Letras erpa menores e próximas, terminando com traço inferior longo.',
    pageNumber: 2,
    defaultStatus: 'Pronto',
    // Exact visual representation matching page 2 of Caderno Destro
    svgViewBox: '0 0 600 380',
  },
  A4: {
    id: 'A4',
    name: 'A4 original',
    subtitle: 'Fellipe Serpa em uma linha',
    typeLabel: 'Completa',
    description:
      'Fellipe Serpa em uma linha. Estrutura do F em haste longa com duas barras, ellipe ligado, seguido por S e erpa com acabamento e ponto do i.',
    pageNumber: 4,
    defaultStatus: 'Pronto',
    svgViewBox: '0 0 750 380',
  },
  'A5-04': {
    id: 'A5-04',
    name: 'A5-04',
    subtitle: 'Fellipe Serpa em dois níveis',
    typeLabel: 'Completa',
    description:
      'Fellipe Serpa em dois níveis. Fellipe na parte superior esquerda; Serpa posicionado abaixo começando sob o fim de Fellipe com curva e traço expressivo.',
    pageNumber: 6,
    defaultStatus: 'Pronto',
    svgViewBox: '0 0 650 420',
  },
}
