import { PEN_PRESETS, type PenType } from '@/data/pens'
export default function PenPicker({
  value,
  onChange,
}: {
  value: PenType
  onChange: (value: PenType) => void
}) {
  return (
    <label>
      Tipo de caneta{' '}
      <select
        aria-label="Tipo de caneta"
        value={value}
        onChange={(e) => onChange(e.target.value as PenType)}
      >
        {PEN_PRESETS.map((pen) => (
          <option key={pen.id} value={pen.id}>
            {pen.label}
          </option>
        ))}
      </select>
      <small style={{ display: 'block' }}>
        {value === 'flex' || value === 'ultra-flex'
          ? 'Pressione levemente para afinar e com mais força para engrossar. Requer caneta com pressão; mouse e dedo usam traço constante.'
          : 'Espessura aproximada na tela; pode variar conforme o aparelho e o zoom.'}
      </small>
    </label>
  )
}
