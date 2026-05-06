import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { useToast } from '../context/ToastContext'

const FAQS = [
  {
    q: '¿Cómo funciona la inspección auto-gestionable?',
    a: 'Recibes un enlace seguro en tu móvil, capturas las fotos guiadas con IA y la plataforma valida automáticamente la calidad y completitud antes de enviarla al perito.',
  },
  {
    q: '¿Qué documentos necesito para emitir una póliza?',
    a: 'Cédula de identidad o RIF (para personas jurídicas) y el carnet de circulación. El sistema extrae los datos por OCR.',
  },
  {
    q: '¿Cómo se valida el estado de las piezas?',
    a: 'Cada pieza se clasifica como Bueno (B), Regular (R), Malo (M) o No existe (N/E) tanto manualmente como con asistencia de IA.',
  },
  {
    q: '¿Puedo usar mi seguro solo cuando lo necesito?',
    a: 'Sí, con la modalidad “Cobertura por Días” pagas únicamente por los días que utilizas el vehículo. Activa cuando manejes y pausa cuando no.',
  },
  {
    q: '¿Qué hago si la inspección es rechazada?',
    a: 'Recibirás una notificación con el motivo. Puedes recapturar las fotos faltantes o solicitar asistencia por videollamada.',
  },
  {
    q: '¿En cuánto tiempo se aprueba un siniestro?',
    a: 'El reporte inicial se atiende en menos de 30 minutos. La resolución final depende de la complejidad: 24h para casos simples, hasta 7 días para peritajes especializados.',
  },
]

const QUICK_ACTIONS = [
  {
    icon: 'phone_in_talk',
    title: 'Atención 24/7',
    body: '0800-LAMUNDIAL',
    cta: 'Llamar ahora',
    action: 'phone',
  },
  {
    icon: 'forum',
    title: 'Chat en vivo',
    body: '≈ 2 min de respuesta',
    cta: 'Iniciar chat',
    action: 'chat',
  },
  {
    icon: 'videocam',
    title: 'Videollamada perito',
    body: 'Resuelve dudas con un experto',
    cta: 'Solicitar',
    action: 'video',
  },
]

export default function HelpPage() {
  const [open, setOpen] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const toast = useToast()

  const handleQuickAction = (id) => {
    if (id === 'phone') {
      window.location.href = 'tel:0800526864342'
      toast.info('Iniciando llamada a 0800-LAMUNDIAL', { title: 'Llamada' })
    } else if (id === 'chat') {
      setChatOpen(true)
    } else if (id === 'video') {
      setVideoOpen(true)
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Ayuda' }]}
        title="Centro de Ayuda"
        subtitle="Resolvemos tus dudas para que aproveches al máximo Auto Casco."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q.action}
            onClick={() => handleQuickAction(q.action)}
            className="card p-4 sm:p-5 flex flex-col items-start hover:-translate-y-0.5 transition-all hover:shadow-elev-2 cursor-pointer min-w-0 text-left active:scale-[0.99] group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-brand-soft text-on-primary flex items-center justify-center mb-3 shadow-elev-primary group-hover:scale-110 transition">
              <Icon name={q.icon} className="text-[22px]" filled />
            </div>
            <h4 className="text-headline-md mb-1 truncate w-full">{q.title}</h4>
            <p className="text-caption sm:text-body-md text-on-surface-variant mb-3">
              {q.body}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-label-md text-primary font-bold group-hover:gap-2 transition-all">
              {q.cta} <Icon name="arrow_forward" className="text-[16px]" />
            </span>
          </button>
        ))}
      </div>

      <div className="card p-4 sm:p-5 mb-4">
        <h3 className="text-headline-md text-on-surface mb-3">
          Preguntas frecuentes
        </h3>
        <div className="flex flex-col divide-y divide-outline-variant/40">
          {FAQS.map((f, i) => (
            <button
              key={i}
              onClick={() => setOpen(open === i ? -1 : i)}
              className="text-left py-3 group"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-on-surface flex-1 pr-2">{f.q}</p>
                <Icon
                  name={open === i ? 'remove' : 'add'}
                  className="text-primary shrink-0"
                />
              </div>
              {open === i && (
                <p className="text-body-md text-on-surface-variant mt-2 animate-fade-in">
                  {f.a}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="text-headline-md text-on-surface mb-1">
          ¿No encuentras lo que buscas?
        </h3>
        <p className="text-body-md text-on-surface-variant mb-3">
          Envíanos un mensaje y te respondemos en menos de 1 hora hábil.
        </p>
        <ContactForm />
      </div>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
      <VideoCallModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  )
}

function ContactForm() {
  const toast = useToast()
  const [form, setForm] = useState({ asunto: '', mensaje: '' })
  const [sending, setSending] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!form.asunto || !form.mensaje) {
      toast.error('Completa el asunto y el mensaje.')
      return
    }
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setForm({ asunto: '', mensaje: '' })
      toast.success('Tu mensaje fue enviado al equipo de soporte.', {
        title: '¡Recibido!',
      })
    }, 900)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="label">Asunto</label>
        <input
          className="input"
          placeholder="¿Sobre qué necesitas ayuda?"
          value={form.asunto}
          onChange={(e) => setForm({ ...form, asunto: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Mensaje</label>
        <textarea
          className="input min-h-[120px] resize-none"
          placeholder="Cuéntanos con detalle…"
          value={form.mensaje}
          onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="btn-primary sm:col-span-2 sm:max-w-xs"
      >
        {sending ? (
          <>
            <Icon name="progress_activity" className="animate-spin" /> Enviando…
          </>
        ) : (
          <>
            <Icon name="send" /> Enviar mensaje
          </>
        )}
      </button>
    </form>
  )
}

const QUICK_REPLIES = [
  '¿Cómo activo mi cobertura?',
  '¿Cómo reporto un siniestro?',
  'Quiero cambiar mi plan',
  'Tengo dudas con la inspección',
]

function ChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      from: 'agent',
      name: 'Sofía · Asistente',
      text: '¡Hola! 👋 Soy Sofía. ¿En qué puedo ayudarte hoy?',
      time: now(),
    },
  ])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = (text) => {
    const t = (text ?? draft).trim()
    if (!t) return
    setMessages((prev) => [...prev, { from: 'user', text: t, time: now() }])
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          from: 'agent',
          name: 'Sofía · Asistente',
          text: agentReply(t),
          time: now(),
        },
      ])
    }, 1100 + Math.random() * 600)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chat con La Mundial"
      subtitle="Atención inmediata · Respuesta promedio 2 min"
      icon="forum"
      size="md"
    >
      <div
        ref={scrollRef}
        className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              'flex items-end gap-2',
              m.from === 'user' && 'justify-end',
            )}
          >
            {m.from === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-gradient-brand-soft text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                SF
              </div>
            )}
            <div
              className={clsx(
                'max-w-[75%] px-3 py-2 rounded-2xl',
                m.from === 'user'
                  ? 'bg-gradient-brand-soft text-on-primary rounded-br-sm'
                  : 'bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/40',
              )}
            >
              <p className="text-caption sm:text-body-md leading-snug whitespace-pre-line">
                {m.text}
              </p>
              <p
                className={clsx(
                  'text-[10px] mt-0.5',
                  m.from === 'user' ? 'opacity-70' : 'text-on-surface-variant',
                )}
              >
                {m.time}
              </p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-brand-soft text-white flex items-center justify-center text-[12px] font-bold shrink-0">
              SF
            </div>
            <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-pulse-soft"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap mt-3">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="px-3 py-1 rounded-full text-caption font-semibold border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
        className="flex gap-2 mt-3"
      >
        <input
          className="input flex-1"
          placeholder="Escribe un mensaje…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary px-3 shrink-0"
          aria-label="Enviar"
          disabled={!draft.trim()}
        >
          <Icon name="send" />
        </button>
      </form>
    </Modal>
  )
}

function VideoCallModal({ open, onClose }) {
  const [scheduled, setScheduled] = useState(null)
  const [form, setForm] = useState({
    fecha: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    hora: '10:00',
    motivo: 'inspeccion',
  })
  const toast = useToast()

  const submit = () => {
    setScheduled({ ...form, perito: 'Miguel Azualde' })
    toast.success('Tu videollamada fue agendada. Te enviamos confirmación al correo.', {
      title: '¡Listo!',
    })
  }

  const close = () => {
    setScheduled(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Videollamada con perito"
      subtitle="Te conectamos con un experto en menos de 24h."
      icon="videocam"
      size="md"
      footer={
        scheduled ? (
          <button onClick={close} className="btn-primary">
            <Icon name="check" /> Cerrar
          </button>
        ) : (
          <>
            <button onClick={close} className="btn-soft">
              Cancelar
            </button>
            <button onClick={submit} className="btn-primary">
              <Icon name="event" /> Agendar
            </button>
          </>
        )
      }
    >
      {scheduled ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-success-container text-on-success-container flex items-center justify-center mx-auto mb-3">
            <Icon name="event_available" className="text-[32px]" filled />
          </div>
          <h4 className="text-headline-md text-on-surface mb-1">
            Videollamada confirmada
          </h4>
          <p className="text-body-md text-on-surface-variant mb-3">
            Te conectaremos con <strong>{scheduled.perito}</strong> el{' '}
            <strong>{scheduled.fecha}</strong> a las <strong>{scheduled.hora}</strong>.
          </p>
          <div className="card p-3 bg-primary-fixed/40 text-left">
            <p className="text-caption text-on-surface-variant uppercase tracking-wider">
              Enlace de la sala
            </p>
            <p className="font-mono text-primary truncate">
              meet.lamundial.com/{Math.random().toString(36).slice(2, 9)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Motivo de la videollamada</label>
            <select
              className="input"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            >
              <option value="inspeccion">Asistencia con inspección</option>
              <option value="poliza">Dudas sobre mi póliza</option>
              <option value="siniestro">Reporte de siniestro</option>
              <option value="cobertura">Activar cobertura</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={form.fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Hora</label>
            <input
              type="time"
              className="input"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg bg-primary-fixed/30 border border-primary/20 flex items-start gap-2">
            <Icon name="info" className="text-primary text-[20px] mt-0.5 shrink-0" filled />
            <p className="text-caption text-on-primary-fixed-variant leading-snug">
              Recibirás un correo y un push 15 minutos antes con el enlace de la
              sala. Asegúrate de tener buena conexión y permisos de cámara.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

function now() {
  return new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function agentReply(text) {
  const lower = text.toLowerCase()
  if (lower.includes('cobertura') || lower.includes('activ')) {
    return 'Para activar cobertura ve a Cobertura → elige el plan y los días → confirma con tu saldo o tarjeta. ¿Quieres que te lleve a esa pantalla?'
  }
  if (lower.includes('siniestro') || lower.includes('choque') || lower.includes('reportar')) {
    return 'Lamento mucho lo ocurrido. Puedes reportar el siniestro desde Siniestros → "Reportar Siniestro". Un perito te llamará en menos de 30 min.'
  }
  if (lower.includes('plan') || lower.includes('cambiar')) {
    return 'Tenemos 3 planes (Básico, Estándar y Premium). Te paso el comparador en la sección de Cobertura — ¿cuál te interesa más?'
  }
  if (lower.includes('inspecci')) {
    return 'La inspección lleva 5 pasos: documentos, ubicación, fotos guiadas, daños y revisión. Tarda ~8 minutos. ¿Te ayudo a iniciar una?'
  }
  if (lower.includes('hola') || lower.includes('buenas') || lower.length < 6) {
    return '¡Hola! Cuéntame, ¿en qué puedo ayudarte hoy? Estoy aquí para todo lo relacionado con tu Auto Casco.'
  }
  return 'Entendido. Voy a transferir tu consulta a un agente humano. Mientras tanto, ¿puedes contarme más detalles?'
}
