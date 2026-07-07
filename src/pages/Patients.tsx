import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Search, Phone, Mail, FileText, Edit2, Trash2, X } from 'lucide-react'
import { usePatientStore } from '@/stores/patientStore'
import { cn } from '@/lib/cn'
import type { Patient } from '@/types'
import { useToastStore } from '@/stores/toastStore'

export default function Patients() {
  const { patients, fetchPatients, addPatient, updatePatient, deletePatient, loading } = usePatientStore()
  const { addToast } = useToastStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '', email: '', phone: '', document: '', birth_date: '', notes: ''
  })

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.document?.includes(searchTerm)
  )

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient)
      setFormData(patient)
    } else {
      setEditingPatient(null)
      setFormData({ name: '', email: '', phone: '', document: '', birth_date: '', notes: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return addToast('Nome é obrigatório', 'error')

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, formData)
        addToast('Paciente atualizado com sucesso', 'success')
      } else {
        await addPatient(formData)
        addToast('Paciente cadastrado com sucesso', 'success')
      }
      setIsModalOpen(false)
    } catch (error) {
      addToast('Erro ao salvar paciente', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este paciente? As tarefas associadas perderão o vínculo.')) {
      try {
        await deletePatient(id)
        addToast('Paciente excluído', 'success')
      } catch (error) {
        addToast('Erro ao excluir paciente', 'error')
      }
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Pacientes</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie as fichas e informações do seu consultório
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
            "bg-gradient-to-r from-accent-primary to-accent-secondary text-white",
            "hover:shadow-lg hover:shadow-accent-primary/25 hover:-translate-y-0.5",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          )}
        >
          <UserPlus size={18} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-text-secondary" />
        </div>
        <input
          type="text"
          placeholder="Buscar pacientes por nome, email ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-3 bg-surface/50 border border-white/10 rounded-2xl",
            "text-text-primary placeholder:text-text-secondary/50",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:bg-surface/80",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Patients List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        {loading && patients.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4">
              <UserPlus size={32} className="text-text-secondary/50" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">Nenhum paciente encontrado</h3>
            <p className="text-sm text-text-secondary">
              {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre seu primeiro paciente clicando no botão acima.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            <AnimatePresence>
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "group relative bg-surface border border-white/5 rounded-2xl p-5",
                    "hover:bg-surface/80 hover:border-white/10 hover:shadow-xl hover:shadow-black/20",
                    "transition-all duration-300 overflow-hidden"
                  )}
                >
                  <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(patient)} className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(patient.id)} className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-1">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center shrink-0 border border-accent-primary/20">
                      <span className="text-lg font-semibold text-accent-primary">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pr-12">
                      <h3 className="text-base font-semibold text-text-primary truncate" title={patient.name}>
                        {patient.name}
                      </h3>
                      {patient.birth_date && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Nasceu em {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {patient.email && (
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <Mail size={14} className="text-accent-primary/70 shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <Phone size={14} className="text-accent-primary/70 shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.document && (
                      <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <FileText size={14} className="text-accent-primary/70 shrink-0" />
                        <span>{patient.document}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal / Slide-over */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#1c1c1e] shadow-2xl z-50 flex flex-col border-l border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-surface/50">
                <h2 className="text-xl font-semibold text-text-primary">
                  {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <form id="patient-form" onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Nome Completo *</label>
                    <input
                      required
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
                      placeholder="Ex: João da Silva"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all"
                      placeholder="joao@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-secondary">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text-secondary">CPF</label>
                      <input
                        type="text"
                        value={formData.document || ''}
                        onChange={e => setFormData({ ...formData, document: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                      style={{ colorScheme: 'dark' }}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">Anotações e Prontuário</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-primary/50 transition-all resize-none custom-scrollbar"
                      placeholder="Informações clínicas, histórico..."
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/10 bg-surface/50 shrink-0">
                <button
                  type="submit"
                  form="patient-form"
                  className={cn(
                    "w-full py-3 rounded-xl font-medium text-white transition-all duration-300",
                    "bg-gradient-to-r from-accent-primary to-accent-secondary",
                    "hover:shadow-lg hover:shadow-accent-primary/25 hover:-translate-y-0.5"
                  )}
                >
                  {editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}