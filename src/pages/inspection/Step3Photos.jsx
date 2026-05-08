import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import {
  ESTADO_PIEZA,
  ESTADO_PIEZA_LABEL,
  PHOTO_SEQUENCES,
} from '../../data/mockData'
import { useToast } from '../../context/ToastContext'

const SAMPLE_IMAGES = {
  'seq-frontal-placa':
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80',
  'seq-frontal-lat-der':
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-placa':
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-lat-der':
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80',
  'seq-frontal-lat-izq':
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=80',
  'seq-trasera-lat-izq':
    'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1400&q=80',
  'seq-serial':
    'https://images.unsplash.com/photo-1597007030739-6d2e7172ee70?auto=format&fit=crop&w=1400&q=80',
  'seq-seguridad':
    'https://images.unsplash.com/photo-1471174466202-bd1bba73a8ec?auto=format&fit=crop&w=1400&q=80',
  'seq-tablero':
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=80',
  'seq-interior':
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=80',
  'seq-repuesto':
    'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&w=1400&q=80',
  'seq-danios':
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1400&q=80',
}

export default function Step3Photos({ state }) {
  const { photos, setPhoto, setPiezaEstado, setPiezaComentario, vehiculo } = state
  const [activeSeq, setActiveSeq] = useState(PHOTO_SEQUENCES[0].id)
  const toast = useToast()
  const railRef = useRef(null)

  const seq = PHOTO_SEQUENCES.find((s) => s.id === activeSeq)
  const photoState = photos[activeSeq]
  const completed = PHOTO_SEQUENCES.filter((s) => photos[s.id].uploaded).length

  // Scroll active pill into view (mobile)
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const idx = PHOTO_SEQUENCES.findIndex((s) => s.id === activeSeq)
    const el = rail.querySelectorAll('[data-seq]')[idx]
    if (el)
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
  }, [activeSeq])

  const handleCapture = () => {
    setPhoto(activeSeq, {
      analyzing: true,
      uploaded: true,
      thumbnail: SAMPLE_IMAGES[activeSeq],
    })
    toast.info('Analizando imagen con IA…', { title: 'Validación' })

    setTimeout(() => {
      let placa = null
      let placaMatch = null
      const issues = []

      if (seq.requierePlaca) {
        const detected = Math.random() > 0.2
        placa = detected ? vehiculo.placa || 'XYZ-1234' : 'XYC-1234'
        placaMatch = placa === (vehiculo.placa || 'XYZ-1234')
        if (!placaMatch) {
          issues.push({
            tone: 'warning',
            text: `La placa detectada (${placa}) no coincide con el carnet (${vehiculo.placa}).`,
          })
        }
      }

      const piezasDetected = seq.piezas.length
      issues.unshift({
        tone: 'success',
        text: `IA detectó ${piezasDetected}/${seq.piezas.length} piezas correctamente.`,
      })

      setPhoto(activeSeq, {
        analyzing: false,
        analyzed: true,
        placa,
        placaMatch,
        issues,
      })

      toast.success('Imagen validada', { title: 'IA · Análisis completado' })
    }, 1600)
  }

  const goNextSeq = () => {
    const idx = PHOTO_SEQUENCES.findIndex((s) => s.id === activeSeq)
    const next = PHOTO_SEQUENCES[idx + 1]
    if (next) setActiveSeq(next.id)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress + horizontal pill rail (replaces sidebar on mobile) */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-headline-md text-on-surface">Secuencias fotográficas</h3>
          <span className="text-caption font-bold bg-gradient-brand-soft text-on-primary px-2.5 py-1 rounded-full">
            {completed} / {PHOTO_SEQUENCES.length}
          </span>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-accent rounded-full transition-all"
            style={{ width: `${(completed / PHOTO_SEQUENCES.length) * 100}%` }}
          />
        </div>
        <div ref={railRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1 snap-x snap-mandatory">
          {PHOTO_SEQUENCES.map((s, i) => {
            const ph = photos[s.id]
            const active = activeSeq === s.id
            return (
              <button
                key={s.id}
                data-seq={s.id}
                onClick={() => setActiveSeq(s.id)}
                className={clsx(
                  'shrink-0 snap-start flex items-center gap-2 px-3 min-h-[44px] py-2.5 rounded-full border-2 transition-all',
                  active
                    ? 'bg-gradient-brand-soft text-on-primary border-primary shadow-elev-primary'
                    : ph.uploaded
                    ? 'bg-success-container/60 text-on-success-container border-success/30'
                    : 'bg-white text-on-surface-variant border-outline-variant/60 hover:border-primary/40',
                )}
              >
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    active && 'bg-white/20 text-white',
                    !active && ph.uploaded && 'bg-success text-white',
                    !active && !ph.uploaded && 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {ph.uploaded ? <Icon name="check" className="text-[14px]" /> : i + 1}
                </span>
                <span className="text-label-md whitespace-nowrap">{s.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active sequence canvas */}
      <div className="card p-3 sm:p-5">
        <div className="flex items-start sm:items-center gap-2 mb-3 sm:mb-4 pb-3 border-b border-outline-variant/50">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-brand-soft text-on-primary flex items-center justify-center shrink-0 shadow-elev-primary">
            <Icon name={seq.icon} className="text-[22px]" filled />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-headline-md text-on-surface truncate">{seq.nombre}</h3>
            <p className="text-caption text-on-surface-variant line-clamp-2">
              {seq.descripcion}
            </p>
          </div>
          {photoState.uploaded && photoState.analyzed && (
            <StatusChip
              tone={photoState.placaMatch === false ? 'warning' : 'success'}
              status={photoState.placaMatch === false ? 'Revisar' : 'Validada'}
              size="sm"
              className="shrink-0"
            />
          )}
        </div>

        <div
          className={clsx(
            'relative rounded-xl overflow-hidden border-2 border-dashed transition-all aspect-[16/10] sm:aspect-[16/9]',
            photoState.uploaded
              ? 'border-success/40'
              : 'border-outline-variant/70 hover:border-primary/60 hover:bg-primary-fixed/10',
          )}
        >
          {photoState.uploaded ? (
            <>
              <img
                src={photoState.thumbnail}
                alt={seq.nombre}
                className="w-full h-full object-cover absolute inset-0"
              />
              {photoState.analyzing && (
                <>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-2">
                      <Icon name="auto_awesome" className="text-[28px] sm:text-[32px] animate-pulse" filled />
                    </div>
                    <p className="font-bold text-body-md sm:text-body-lg">Analizando con IA…</p>
                    <p className="text-caption opacity-80 text-center px-4">
                      Detectando piezas y daños
                    </p>
                    <div className="absolute inset-x-0 top-0 h-1 bg-accent-500 animate-shimmer" />
                  </div>
                </>
              )}
              {photoState.analyzed && photoState.placa && (
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/65 backdrop-blur text-white rounded-lg text-caption font-mono tracking-widest border border-accent-400/40">
                  PLACA · {photoState.placa}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
              <img
                src={SAMPLE_IMAGES[seq.id]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-15"
              />
              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-elev-1 flex items-center justify-center mb-2">
                  <Icon name="add_a_photo" className="text-[26px] sm:text-[28px] text-primary" filled />
                </div>
                <h4 className="text-headline-md text-on-surface mb-1">Captura</h4>
                <p className="text-caption sm:text-body-md text-on-surface-variant mb-3 max-w-xs">
                  Foto al instante (no imágenes guardadas).
                </p>
                <button onClick={handleCapture} className="btn-primary">
                  <Icon name="photo_camera" /> Tomar foto
                </button>
              </div>
            </div>
          )}
        </div>

        {photoState.issues.length > 0 && photoState.analyzed && (
          <div className="mt-3 flex flex-col gap-2 animate-fade-in">
            {photoState.issues.map((iss, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-start gap-2 p-2.5 rounded-lg border',
                  iss.tone === 'success' &&
                    'bg-success-container/50 border-success/30 text-on-success-container',
                  iss.tone === 'warning' &&
                    'bg-warning-container/60 border-warning/30 text-on-warning-container',
                  iss.tone === 'error' &&
                    'bg-error-container border-error/30 text-on-error-container',
                )}
              >
                <Icon
                  name={iss.tone === 'success' ? 'check_circle' : 'warning'}
                  className="text-[20px] mt-0.5 shrink-0"
                  filled
                />
                <p className="text-caption sm:text-body-md flex-1 leading-snug">{iss.text}</p>
              </div>
            ))}
          </div>
        )}

        {photoState.uploaded && (
          <div className="mt-3 grid grid-cols-2 sm:flex sm:gap-2 gap-2">
            <button
              onClick={() => {
                setPhoto(activeSeq, {
                  uploaded: false,
                  analyzed: false,
                  thumbnail: null,
                  placa: null,
                  placaMatch: null,
                  issues: [],
                })
              }}
              className="btn-soft sm:flex-1"
            >
              <Icon name="refresh" /> Recapturar
            </button>
            <button onClick={handleCapture} className="btn-ghost sm:flex-1">
              <Icon name="auto_awesome" /> Re-analizar
            </button>
          </div>
        )}

              {photoState.uploaded && photoState.analyzed && (
          <button onClick={goNextSeq} className="btn-primary w-full mt-2">
            <Icon name="arrow_forward" /> Siguiente secuencia
          </button>
        )}
      </div>

      {/* Pieces classification */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-headline-md text-on-surface">Clasificación</h3>
            <p className="text-caption text-on-surface-variant">
              Marca el estado de cada pieza detectada.
            </p>
          </div>
          <div className="text-caption hidden sm:flex items-center gap-2">
            <span className="font-bold">B</span> Bueno ·{' '}
            <span className="font-bold">R</span> Regular ·{' '}
            <span className="font-bold">M</span> Malo ·{' '}
            <span className="font-bold">N/E</span> No existe
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {seq.piezas.map((pieza) => {
            const data = photoState.piezas[pieza] ?? {
              estado: ESTADO_PIEZA.BUENO,
              comentario: '',
            }
            return (
              <div key={pieza} className="border border-outline-variant/50 rounded-xl p-3 bg-surface-container-low/40">
                <p className="text-label-md text-on-surface mb-2 truncate">{pieza}</p>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { v: ESTADO_PIEZA.BUENO, label: 'B', tone: 'success' },
                    { v: ESTADO_PIEZA.REGULAR, label: 'R', tone: 'warning' },
                    { v: ESTADO_PIEZA.MALO, label: 'M', tone: 'error' },
                    { v: ESTADO_PIEZA.NO_EXISTE, label: 'N/E', tone: 'neutral' },
                  ].map(({ v, label, tone }) => {
                    const active = data.estado === v
                    return (
                      <button
                        key={v}
                        onClick={() => setPiezaEstado(activeSeq, pieza, v)}
                        title={ESTADO_PIEZA_LABEL[v]}
                        className={clsx(
                          'min-h-[44px] py-2 rounded-lg text-label-md font-bold border transition active:scale-95',
                          active && tone === 'success' &&
                            'bg-success text-on-success border-success',
                          active && tone === 'warning' &&
                            'bg-warning text-on-warning border-warning',
                          active && tone === 'error' &&
                            'bg-error text-on-error border-error',
                          active && tone === 'neutral' &&
                            'bg-on-surface text-surface border-on-surface',
                          !active &&
                            'bg-white text-on-surface-variant border-outline-variant hover:border-on-surface',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {data.estado !== ESTADO_PIEZA.BUENO &&
                  data.estado !== ESTADO_PIEZA.NO_EXISTE && (
                    <input
                      value={data.comentario}
                      onChange={(e) =>
                        setPiezaComentario(activeSeq, pieza, e.target.value)
                      }
                      placeholder="Detalle del estado…"
                      className="input mt-2 text-caption"
                    />
                  )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
