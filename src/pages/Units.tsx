import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, MoreHorizontal, Share2, Pencil, Trash2, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { unitApi } from '@/api'
import { useUserStore } from '@/store/userStore'
import { toast, cn } from '@/lib/utils'
import { SUBJECTS, SUBJECT_LABELS } from '@shared/constants'
import type { Subject, Unit } from '@shared/types'

export default function Units() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [subject, setSubject] = useState<Subject>(SUBJECTS.ENGLISH)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    textbook: '',
    order: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUnits()
  }, [subject])

  useEffect(() => {
    if (showCreateModal) {
      setFormData({ name: '', grade: '', textbook: '', order: 0 })
      setTimeout(() => nameInputRef.current?.focus(), 300)
    }
  }, [showCreateModal])

  useEffect(() => {
    if (editingUnit) {
      setFormData({
        name: editingUnit.name,
        grade: editingUnit.grade || '',
        textbook: editingUnit.textbook || '',
        order: editingUnit.order || 0
      })
      setTimeout(() => nameInputRef.current?.focus(), 300)
    }
  }, [editingUnit])

  async function loadUnits() {
    setLoading(true)
    try {
      const res = await unitApi.list(subject)
      if (res.data) {
        setUnits(res.data)
      }
    } catch {
      toast.error('加载单元列表失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setShowCreateModal(true)
  }

  function openEditModal(unit: Unit, e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpenId(null)
    setEditingUnit(unit)
  }

  function closeModals() {
    setShowCreateModal(false)
    setEditingUnit(null)
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.warning('请输入单元名称')
      return
    }
    setSubmitting(true)
    try {
      if (editingUnit) {
        await unitApi.update(editingUnit.id, {
          name: formData.name.trim(),
          grade: formData.grade.trim(),
          textbook: formData.textbook.trim(),
          order: formData.order
        })
        toast.success('单元更新成功')
      } else {
        await unitApi.create({
          name: formData.name.trim(),
          subject,
          grade: formData.grade.trim(),
          textbook: formData.textbook.trim(),
          order: formData.order
        })
        toast.success('单元创建成功')
      }
      closeModals()
      loadUnits()
    } catch {
      toast.error(editingUnit ? '更新失败' : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(unit: Unit, e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpenId(null)
    if (!window.confirm(`确定要删除单元「${unit.name}」吗？此操作不可恢复。`)) {
      return
    }
    try {
      await unitApi.remove(unit.id)
      toast.success('删除成功')
      loadUnits()
    } catch {
      toast.error('删除失败')
    }
  }

  function handleCardClick(unitId: string) {
    navigate(`/units/${unitId}/words`)
  }

  function handleGoToWords(unitId: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigate(`/units/${unitId}/words`)
  }

  function toggleMenu(unitId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === unitId ? null : unitId)
  }

  useEffect(() => {
    function handleClickOutside() {
      setMenuOpenId(null)
    }
    if (menuOpenId) {
      setTimeout(() => {
        window.addEventListener('click', handleClickOutside)
      }, 0)
    }
    return () => window.removeEventListener('click', handleClickOutside)
  }, [menuOpenId])

  return (
    <Layout activeTab="units" title="我的词库">
      <div className="px-4 pt-4 pb-24">
        <div className="flex bg-white rounded-xl p-1 shadow-soft mb-4">
          {Object.values(SUBJECTS).map(s => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                subject === s
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading />
        ) : units.length === 0 ? (
          <EmptyState
            title="还没有词库单元"
            description="点击右下角的 + 按钮创建你的第一个词库单元"
            action={
              <button
                onClick={openCreateModal}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                创建单元
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {units.map(unit => (
              <div
                key={unit.id}
                onClick={() => handleCardClick(unit.id)}
                className="card cursor-pointer hover:shadow-card active:scale-[0.99] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{unit.name}</h3>
                      <span className="badge bg-primary-50 text-primary-600 shrink-0">
                        {unit.wordCount} 词
                      </span>
                      {user && unit.createdBy !== user.id && (
                        <span className="badge bg-blue-50 text-blue-600 shrink-0">
                          <Share2 className="w-3 h-3 mr-1" />
                          共享
                        </span>
                      )}
                    </div>
                    {(unit.textbook || unit.grade) && (
                      <p className="text-sm text-gray-500">
                        {[unit.textbook, unit.grade].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleGoToWords(unit.id, e)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(unit.id, e)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                      {menuOpenId === unit.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[120px]"
                        >
                          <button
                            onClick={(e) => openEditModal(unit, e)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-4 h-4" />
                            编辑
                          </button>
                          <button
                            onClick={(e) => handleDelete(unit, e)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-500 hover:bg-gray-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={openCreateModal}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all z-30"
        style={{ marginBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal
        open={showCreateModal || !!editingUnit}
        onClose={closeModals}
        title={editingUnit ? '编辑单元' : '创建单元'}
        footer={
          <>
            <button
              onClick={closeModals}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingUnit ? '更新中...' : '创建中...'}
                </>
              ) : (
                '确定'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">单元名称 <span className="text-danger-500">*</span></label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：Unit 1、第一单元"
              className="input"
            />
          </div>
          <div>
            <label className="label">年级/册次/教材版本（选填）</label>
            <input
              type="text"
              value={formData.grade || formData.textbook ? `${formData.grade || ''} ${formData.textbook || ''}`.trim() : ''}
              onChange={e => {
                const val = e.target.value
                setFormData(prev => ({ ...prev, grade: val, textbook: val }))
              }}
              placeholder="例如：三年级上册 人教版"
              className="input"
            />
          </div>
          <div>
            <label className="label">排序（数字越小越靠前）</label>
            <input
              type="number"
              value={formData.order}
              onChange={e => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="input"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
