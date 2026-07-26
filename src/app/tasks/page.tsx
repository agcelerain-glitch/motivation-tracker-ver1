'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/hooks/useAuthState';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/config/design';

interface Task {
  id: string;
  title: string;
  why: string;
  deadline: string | null;
  status: 'active' | 'done' | 'paused';
  daysLeft: number | null;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  active: '継続中',
  paused: '一時停止中',
  done:   '達成',
};

const STATUS_COLOR: Record<Task['status'], string> = {
  active: '#5FB49C',
  paused: '#D4B840',
  done:   '#4A8FD4',
};

const STATUS_BG: Record<Task['status'], string> = {
  active: '#1A2D28',
  paused: '#2A2415',
  done:   '#1A2030',
};

export default function TasksPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ title: '', why: '', deadline: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', why: '', deadline: '' });

  const loadTasks = (uid: string) => {
    const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
    getDocs(q).then(snap => {
      const now = Date.now();
      setTasks(snap.docs.map(d => {
        const data = d.data() as Omit<Task, 'id' | 'daysLeft'>;
        return {
          id: d.id,
          ...data,
          daysLeft: data.deadline
            ? Math.ceil((new Date(data.deadline).getTime() - now) / 86400000)
            : null,
        };
      }));
    });
  };

  useEffect(() => {
    if (!user) return;
    loadTasks(user.uid);
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.title.trim()) return;
    setAdding(true);
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: form.title.trim(),
      why: form.why.trim(),
      deadline: form.deadline || null,
      status: 'active',
      createdAt: serverTimestamp(),
    });
    setForm({ title: '', why: '', deadline: '' });
    loadTasks(user.uid);
    setAdding(false);
  };

  const handleStatus = async (id: string, status: Task['status']) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { status });
    loadTasks(user.uid);
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditForm({ title: t.title, why: t.why ?? '', deadline: t.deadline ?? '' });
  };

  const handleSaveEdit = async () => {
    if (!user || !editingId || !editForm.title.trim()) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', editingId), {
      title: editForm.title.trim(),
      why: editForm.why.trim(),
      deadline: editForm.deadline || null,
    });
    setEditingId(null);
    loadTasks(user.uid);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: COLORS.muted }}>読み込み中…</span>
      </div>
    );
  }
  if (!user) { router.replace('/'); return null; }

  const activeTasks = tasks.filter(t => t.status === 'active');
  const pausedTasks = tasks.filter(t => t.status === 'paused');
  const doneTasks   = tasks.filter(t => t.status === 'done');

  const renderTaskCard = (t: Task) => {
    const isEditing = editingId === t.id;
    const color = STATUS_COLOR[t.status];
    const bg    = STATUS_BG[t.status];

    return (
      <div key={t.id} style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '14px 14px 10px', border: `1px solid ${color}30` }}>

        {/* ステータスバッジ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            background: bg, color: color, fontSize: 11,
            fontFamily: 'Zen Kaku Gothic New', padding: '2px 10px', borderRadius: 4,
            border: `1px solid ${color}60`,
          }}>
            {STATUS_LABEL[t.status]}
          </span>
          {!isEditing && (
            <button
              onClick={() => startEdit(t)}
              style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', padding: '2px 6px' }}
            >
              編集
            </button>
          )}
        </div>

        {isEditing ? (
          /* 編集フォーム */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              placeholder="目標のタイトル"
              style={{ background: '#2A2D45', border: `1px solid ${COLORS.sprout}`, borderRadius: 8, color: COLORS.chalk, padding: '8px 10px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }}
            />
            <input
              value={editForm.why}
              onChange={e => setEditForm(f => ({ ...f, why: e.target.value }))}
              placeholder="なぜやるのか"
              style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.chalk, padding: '8px 10px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }}
            />
            <input
              type="date"
              value={editForm.deadline}
              onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
              style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.muted, padding: '8px 10px', fontSize: 14, fontFamily: 'Roboto Mono', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.title.trim()}
                style={{ flex: 1, background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, opacity: !editForm.title.trim() ? 0.5 : 1 }}
              >
                保存
              </button>
              <button
                onClick={() => setEditingId(null)}
                style={{ flex: 1, background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted, borderRadius: 6, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          /* 通常表示 */
          <>
            <p style={{ color: COLORS.chalk, fontSize: 15, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>{t.title}</p>
            {t.why && (
              <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 6px', fontFamily: 'Zen Kaku Gothic New', lineHeight: 1.5 }}>
                なぜ: {t.why}
              </p>
            )}
            {t.deadline && (
              <p style={{ color: t.daysLeft !== null && t.daysLeft < 3 ? COLORS.alert : COLORS.muted, fontSize: 11, margin: '0 0 8px', fontFamily: 'Roboto Mono' }}>
                期限: {t.deadline}
                {t.daysLeft !== null && (
                  <span style={{ marginLeft: 8 }}>
                    {t.status !== 'done'
                      ? `残り ${t.daysLeft} 日`
                      : t.daysLeft < 0 ? `（期限 ${Math.abs(t.daysLeft)} 日前に達成）` : '（期限内に達成）'}
                  </span>
                )}
              </p>
            )}

            {/* アクション */}
            {t.status === 'active' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => handleStatus(t.id, 'done')}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${STATUS_COLOR.done}`, color: STATUS_COLOR.done, borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
                  達成
                </button>
                <button onClick={() => handleStatus(t.id, 'paused')}
                  style={{ flex: 1, background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted, borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>
                  一時停止
                </button>
              </div>
            )}
            {t.status === 'paused' && (
              <button onClick={() => handleStatus(t.id, 'active')}
                style={{ background: 'transparent', border: `1px solid ${COLORS.sprout}`, color: COLORS.sprout, borderRadius: 6, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', marginTop: 4 }}>
                再開
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>タスク・目標</h1>
      </header>

      {/* 新規追加フォーム */}
      <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ color: COLORS.muted, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>新しい目標を追加</p>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="目標のタイトル"
          style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.chalk, padding: '10px 12px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }}
        />
        <input
          value={form.why}
          onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
          placeholder="なぜやるのか（モチベーションになります）"
          style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.chalk, padding: '10px 12px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }}
        />
        <input
          type="date"
          value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.muted, padding: '10px 12px', fontSize: 14, fontFamily: 'Roboto Mono', outline: 'none' }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !form.title.trim()}
          style={{ background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, opacity: adding || !form.title.trim() ? 0.6 : 1 }}
        >
          追加
        </button>
      </section>

      {/* 継続中 */}
      {activeTasks.length > 0 && (
        <section>
          <h2 style={{ color: STATUS_COLOR.active, fontSize: 14, fontFamily: 'Shippori Mincho', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR.active, display: 'inline-block' }} />
            継続中
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeTasks.map(renderTaskCard)}
          </div>
        </section>
      )}

      {/* 一時停止中 */}
      {pausedTasks.length > 0 && (
        <section>
          <h2 style={{ color: STATUS_COLOR.paused, fontSize: 14, fontFamily: 'Shippori Mincho', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR.paused, display: 'inline-block' }} />
            一時停止中
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pausedTasks.map(renderTaskCard)}
          </div>
        </section>
      )}

      {/* 達成 */}
      {doneTasks.length > 0 && (
        <section>
          <h2 style={{ color: STATUS_COLOR.done, fontSize: 14, fontFamily: 'Shippori Mincho', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR.done, display: 'inline-block' }} />
            達成
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {doneTasks.map(renderTaskCard)}
          </div>
        </section>
      )}
    </div>
  );
}
