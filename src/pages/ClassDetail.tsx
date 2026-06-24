import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Crown, Share2, X, Users, Plus, BookOpen } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { classApi, unitApi } from '@/api'
import { useUserStore } from '@/store/userStore'
import { toast, formatDate } from '@/lib/utils'
import { SUBJECT_LABELS } from '@shared/constants'
import type { ClassInfo, SharedUnitInfo, Unit } from '@shared/types'

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message || fallback
  }
  return fallback
}

export default function ClassDetail() {
  const { id: classId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [cls, setCls] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [myUnits, setMyUnits] = useState<Unit[]>([])
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [sharing, setSharing] = useState(false)

  const loadClassDetail = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    try {
      const res = await classApi.detail(classId)
      if (res.data) {
        setCls(res.data)
      }
    } catch (e) {
      toast.error(getErrorMessage(e, '加载班级详情失败'))
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    loadClassDetail()
  }, [loadClassDetail])

  const loadMyUnits = useCallback(async () => {
    setLoadingUnits(true)
    try {
      const res = await unitApi.list()
      if (res.data) {
        setMyUnits(res.data)
      }
    } catch (e) {
      toast.error(getErrorMessage(e, '加载单元列表失败'))
    } finally {
      setLoadingUnits(false)
    }
  }, [])

  const handleOpenShareModal = useCallback(() => {
    setShowShareModal(true)
    setSelectedUnitIds(new Set())
    loadMyUnits()
  }, [loadMyUnits])

  const toggleUnitSelection = useCallback((unitId: string) => {
    setSelectedUnitIds(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }, [])

  const handleShare = async () => {
    if (!classId || selectedUnitIds.size === 0) {
      toast.error('请选择要共享的单元')
      return
    }
    setSharing(true)
    try {
      const promises = Array.from(selectedUnitIds).map(unitId =>
        classApi.share(classId, unitId)
      )
      await Promise.all(promises)
      toast.success('共享成功')
      setShowShareModal(false)
      setSelectedUnitIds(new Set())
      await loadClassDetail()
    } catch (e) {
      toast.error(getErrorMessage(e, '共享失败'))
    } finally {
      setSharing(false)
    }
  }

  const handleCopyCode = async () => {
    if (!cls) return
    try {
      await navigator.clipboard.writeText(cls.code)
      toast.success('班级码已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleUnshare = async (unitId: string) => {
    if (!classId) return
    if (window.confirm('确定要取消共享该单元吗？')) {
      try {
        await classApi.unshare(classId, unitId)
        toast.success('已取消共享')
        await loadClassDetail()
      } catch (e) {
        toast.error(getErrorMessage(e, '取消共享失败'))
      }
    }
  }

  const canUnshare = (sharedUnit: SharedUnitInfo): boolean => {
    if (!cls || !user) return false
    if (cls.isCreator) return true
    const unit = myUnits.find(u => u.id === sharedUnit.id)
    return unit?.createdBy === user.id
  }

  if (loading) {
    return (
      <Layout activeTab="classes" showBack title="班级详情">
        <Loading fullScreen />
      </Layout>
    )
  }

  if (!cls) {
    return (
      <Layout activeTab="classes" showBack title="班级详情">
        <div className="p-4">
          <EmptyState title="班级不存在" description="该班级可能已被解散" />
        </div>
      </Layout>
    )
  }

  const sharedUnits = cls.sharedUnits || []
  const availableUnits = myUnits.filter(u => !sharedUnits.some(su => su.id === u.id))

  return (
    <Layout activeTab="classes" showBack title={cls.name}>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h2>
              <div className="flex items-center gap-2">
                <span className="badge bg-primary-50 text-primary-600">
                  {SUBJECT_LABELS[cls.subject]}
                </span>
                <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {cls.memberCount}人
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary-50 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">班级码</p>
                <p className="font-mono text-3xl font-bold text-primary-700 tracking-widest">
                  {cls.code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            创建时间：{formatDate(cls.createdAt)}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              共享词库
            </h3>
            <button
              onClick={handleOpenShareModal}
              className="btn-ghost btn-sm flex items-center gap-1 text-primary-600"
            >
              <Plus className="w-4 h-4" />
              共享我的单元
            </button>
          </div>

          {sharedUnits.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="暂无共享单元"
                description="点击「共享我的单元」与班级同学分享词库"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {sharedUnits.map(unit => (
                <div
                  key={unit.id}
                  className="card flex items-center justify-between cursor-pointer hover:shadow-card transition-shadow active:scale-[0.99]"
                  onClick={() => navigate(`/units/${unit.id}/words`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{unit.name}</p>
                      <p className="text-xs text-gray-500">{unit.wordCount}个单词</p>
                    </div>
                  </div>
                  {(cls.isCreator || canUnshare(unit)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnshare(unit.id)
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary-600" />
            班级成员
          </h3>
          <div className="card">
            <div className="divide-y divide-gray-100">
              <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {cls.creatorName || '创建者'}
                  </p>
                  <p className="text-xs text-yellow-600">班长</p>
                </div>
              </div>
              {cls.members.filter(m => m !== cls.createdBy).map(memberId => (
                <div key={memberId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">同学</p>
                    <p className="text-xs text-gray-400">{memberId.slice(0, 8)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showShareModal}
        onClose={() => {
          setShowShareModal(false)
          setSelectedUnitIds(new Set())
        }}
        title="共享我的单元"
        footer={
          <>
            <button
              onClick={() => {
                setShowShareModal(false)
                setSelectedUnitIds(new Set())
              }}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleShare}
              disabled={sharing || selectedUnitIds.size === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? '共享中...' : `共享(${selectedUnitIds.size})`}
            </button>
          </>
        }
      >
        {loadingUnits ? (
          <Loading />
        ) : availableUnits.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="没有可共享的单元"
            description="你创建的所有单元都已共享，或者还没有创建单元"
          />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableUnits.map(unit => {
              const isSelected = selectedUnitIds.has(unit.id)
              return (
                <label
                  key={unit.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleUnitSelection(unit.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{unit.name}</p>
                    <p className="text-xs text-gray-500">
                      {SUBJECT_LABELS[unit.subject]} · {unit.wordCount}个单词
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
