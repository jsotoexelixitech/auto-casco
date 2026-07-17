import { useState } from 'react'
import Icon from '../ui/Icon'
import Modal from '../ui/Modal'
import { PIEZA_TONES } from '../../theme/tokens'
import { getActiveSequences } from '../../utils/sequencesConfig'

const ESTADO_STYLE = {
  B:  { label: 'Buena',     ...PIEZA_TONES.B,  icon: 'check_circle'  },
  R:  { label: 'Regular',   ...PIEZA_TONES.R,  icon: 'warning'       },
  M:  { label: 'Mala',      ...PIEZA_TONES.M,  icon: 'cancel'        },
  NE: { label: 'No existe', ...PIEZA_TONES.NE, icon: 'remove_circle' },
}

export function buildZonasAnalizadas(photos) {
  return getActiveSequences()
    .filter((s) => photos?.[s.id]?.analyzed)
    .map((s) => {
      const ph = photos[s.id]
      const todasLasPiezas = [...s.piezas, ...(s.piezasOpcionales || [])]
      const piezasResult = todasLasPiezas.map((nombre) => ({
        nombre,
        ...(ph.piezas?.[nombre] ?? { estado: 'B', comentario: '' }),
      }))
      const counts = { B: 0, R: 0, M: 0, NE: 0 }
      piezasResult.forEach((p) => {
        if (counts[p.estado] !== undefined) counts[p.estado]++
      })
      return { seq: s, ph, piezasResult, counts }
    })
}

export default function DetalleZonaFotografica({ photos }) {
  const [expandedZone, setExpandedZone] = useState(null)
  const [preview, setPreview] = useState(null) // { src, title }
  const zonasAnalizadas = buildZonasAnalizadas(photos)

  if (zonasAnalizadas.length === 0) return null

  return (
    <>
      <div className="card p-4 sm:p-5" style={{ borderTop: '3px solid #0F1A5A' }}>
        <h3 className="text-headline-md text-on-surface mb-1 flex items-center gap-2">
          <Icon name="photo_library" className="text-primary text-[22px]" filled />
          Fotos y detalle por zona
        </h3>
        <p className="text-caption text-on-surface-variant mb-4">
          Toca una zona para ver sus piezas. En la miniatura puedes ampliar la foto.
        </p>
        <div className="flex flex-col gap-2">
          {zonasAnalizadas.map(({ seq, ph, piezasResult, counts }) => {
            const expanded = expandedZone === seq.id
            const hasDamage = counts.R > 0 || counts.M > 0
            const imgSrc = ph.thumbnail || ph.url || ph.preview
            return (
              <div key={seq.id} className="rounded-xl border border-outline-variant/50 overflow-hidden">
                <div className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors">
                  {imgSrc ? (
                    <button
                      type="button"
                      className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container border border-outline-variant/40 group"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreview({ src: imgSrc, title: seq.nombre })
                      }}
                      aria-label={`Ampliar foto de ${seq.nombre}`}
                    >
                      <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="zoom_in" className="text-white text-[18px]" />
                      </span>
                    </button>
                  ) : (
                    <div className="w-14 h-10 rounded-lg shrink-0 bg-surface-container" />
                  )}

                  <button
                    type="button"
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    onClick={() => setExpandedZone(expanded ? null : seq.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface text-label-md">{seq.nombre}</p>
                        {hasDamage && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            ⚠ Daños detectados
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-green-700 font-semibold">{counts.B} buenas</span>
                        {counts.R > 0 && (
                          <span className="text-[11px] text-amber-700 font-semibold">{counts.R} regulares</span>
                        )}
                        {counts.M > 0 && (
                          <span className="text-[11px] text-red-700 font-semibold">{counts.M} malas</span>
                        )}
                        {counts.NE > 0 && (
                          <span className="text-[11px] text-slate-500 font-semibold">{counts.NE} no existen</span>
                        )}
                        <span className="text-[11px] text-on-surface-variant">· {piezasResult.length} piezas</span>
                      </div>
                    </div>
                    <Icon
                      name={expanded ? 'expand_less' : 'expand_more'}
                      className="text-[22px] text-on-surface-variant shrink-0"
                    />
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-outline-variant/30 px-3 pb-3 pt-2 bg-surface-container-low/30">
                    {imgSrc && (
                      <button
                        type="button"
                        onClick={() => setPreview({ src: imgSrc, title: seq.nombre })}
                        className="w-full mb-3 rounded-xl overflow-hidden border border-outline-variant/40 relative group"
                      >
                        <img
                          src={imgSrc}
                          alt={seq.nombre}
                          className="w-full max-h-44 object-cover bg-surface-container"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-white bg-primary/90 px-3 py-1.5 rounded-full">
                            <Icon name="zoom_in" className="text-[14px]" />
                            Ampliar
                          </span>
                        </span>
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {piezasResult.map((pieza) => {
                        const s = ESTADO_STYLE[pieza.estado] ?? ESTADO_STYLE.B
                        return (
                          <div
                            key={pieza.nombre}
                            className="flex items-start gap-2 p-2 rounded-lg"
                            style={{ backgroundColor: s.bg }}
                          >
                            <Icon
                              name={s.icon}
                              className="text-[16px] shrink-0 mt-0.5"
                              style={{ color: s.fg }}
                              filled
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[12px] font-bold text-on-surface">{pieza.nombre}</span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: s.fg }}
                                >
                                  {s.label}
                                </span>
                                {pieza.confianza !== undefined && (
                                  <span className="text-[10px] text-on-surface-variant">
                                    {Math.round(pieza.confianza * 100)}% confianza
                                  </span>
                                )}
                              </div>
                              {pieza.comentario && (
                                <p className="text-[11px] mt-0.5" style={{ color: s.fg }}>
                                  {pieza.comentario}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title || 'Vista previa'}
        icon="image"
        size="lg"
        headerSize="compact"
      >
        <div className="flex items-center justify-center bg-surface-container/20 rounded-xl p-2 sm:p-4">
          {preview?.src && (
            <img
              src={preview.src}
              alt={preview.title}
              className="w-full max-h-[min(70dvh,720px)] object-contain rounded-lg"
            />
          )}
        </div>
      </Modal>
    </>
  )
}
