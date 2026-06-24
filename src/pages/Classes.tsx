import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Plus, Users } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { classApi } from '@/api'
import { toast } from '@/lib/utils'
import { SUBJECT_LABELS } from '@shared/constants'
import type { ClassInfo, Subject } from '@shared/types'

interface CreateClassForm {
  name: string
  subject: Subject
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message || fallback
  }
  return fallback
}

export default function Classes() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClassForm>({
    name: '',
    subject: 'english'
  })
  const [creating, setCreating] = useState(false)

  const loadClasses = useCallback(async () => {
    try {
      const res = await classApi.myList()
      if (res.data) {
        setClasses(res.data)
      }
    } catch (e) {
      toast.error(getErrorMessage(e, '加载班级列表失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      toast.error('请输入6位班级码')
      return
    }
    setJoining(true)
    try {
      await classApi.join(joinCode.trim())
      toast.success('加入班级成功')
      setJoinCode('')
      await loadClasses()
    } catch (e) {
      toast.error(getErrorMessage(e, '加入班级失败'))
    } finally {
      setJoining(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('请输入班级名称')
      return
    }
    setCreating(true)
    try {
      await classApi.create(createForm.name.trim(), createForm.subject)
      toast.success('班级创建成功')
      setShowCreateModal(false)
      setCreateForm({ name: '', subject: 'english' })
      await loadClasses()
    } catch (e) {
      toast.error(getErrorMessage(e, '创建班级失败'))
    } finally {
      setCreating(false)
    }
  }

  const handleDismiss = async (cls: ClassInfo) => {
    if (window.confirm(`确定要解散班级「${cls.name}」吗？此操作不可恢复。`)) {
      try {
        await classApi.dismiss(cls.id)
        toast.success('班级已解散')
        await loadClasses()
      } catch (e) {
        toast.error(getErrorMessage(e, '解散班级失败'))
      }
    }
  }

  const handleLeave = async (cls: ClassInfo) => {
    if (window.confirm(`确定要退出班级「${cls.name}」吗？`)) {
      try {
        await classApi.leave(cls.id)
        toast.success('已退出班级')
        await loadClasses()
      } catch (e) {
        toast.error(getErrorMessage(e, '退出班级失败'))
      }
    }
  }

  return (
    <Layout activeTab="classes" title="班级共享">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="card space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="输入6位班级码"
              className="input flex-1"
              maxLength={6}
            />
            <button
              onClick={handleJoin}
              disabled={joining || joinCode.length !== 6}
              className="btn-primary"
            >
              {joining ? '加入中...' : '加入'}
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建班级
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : classes.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Users className="w-16 h-16" />}
              title="还没有加入任何班级"
              description="输入班级码加入同学的班级，或者创建一个新班级"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="card cursor-pointer hover:shadow-card transition-shadow active:scale-[0.99]"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{cls.name}</h3>
                      {cls.isCreator && (
                        <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge bg-primary-50 text-primary-600">
                        {SUBJECT_LABELS[cls.subject]}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600">
                        {cls.memberCount}人
                      </span>
                      {cls.isCreator && (
                        <span className="badge bg-yellow-50 text-yellow-600">
                          我创建的
                        </span>
                      )}
                    </div>
                    <div className="inline-flex items-center px-3 py-2 rounded-lg bg-primary-50">
                      <span className="text-xs text-gray-500 mr-2">班级码</span>
                      <span className="font-mono text-xl font-bold text-primary-700 tracking-widest">
                        {cls.code}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {cls.isCreator ? (
                      <button
                        onClick={() => handleDismiss(cls)}
                        className="text-sm text-danger-500 hover:text-danger-600 font-medium px-3 py-2"
                      >
                        解散
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeave(cls)}
                        className="text-sm text-gray-500 hover:text-danger-500 font-medium px-3 py-2"
                      >
                        退出
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ name: '', subject: 'english' })
        }}
        title="创建班级"
        onConfirm={handleCreate}
        footer={
          <>
            <button
              onClick={() => {
                setShowCreateModal(false)
                setCreateForm({ name: '', subject: 'english' })
              }}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !createForm.name.trim()}
              className="btn-primary flex-1"
            >
              {creating ? '创建中...' : '确定'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">班级名称</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：三年级2班"
              className="input"
              maxLength={30}
            />
          </div>
          <div>
            <label className="label">学科</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                createForm.subject === 'english'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="subject"
                  value="english"
                  checked={createForm.subject === 'english'}
                  onChange={() => setCreateForm(prev => ({ ...prev, subject: 'english' }))}
                  className="hidden"
                />
                <span className="font-medium">英语</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                createForm.subject === 'chinese'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="subject"
                  value="chinese"
                  checked={createForm.subject === 'chinese'}
                  onChange={() => setCreateForm(prev => ({ ...prev, subject: 'chinese' }))}
                  className="hidden"
                />
                <span className="font-medium">语文</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
