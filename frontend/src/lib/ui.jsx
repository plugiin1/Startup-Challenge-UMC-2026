import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export const brl = (v) =>
  v === null || v === undefined
    ? '-'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`} />
}

export function Empty({ icon: Icon, children }) {
  return (
    <div className="empty">
      {Icon && <Icon />}
      <p>{children}</p>
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass modal"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row spread" style={{ marginBottom: 4 }}>
              <h3>{title}</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: 7 }} onClick={onClose}>
                <X size={16} />
              </button>
            </div>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
}
