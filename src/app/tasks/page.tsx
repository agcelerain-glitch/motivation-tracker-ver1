'use client';
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
  status: 'active' | 'done' | 'abandoned';
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading } = useAuthState();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ title: '', why: '', deadline: '' });
  const [adding, setAdding] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
  };

  useEffect(() => { if (user) fetchTasks(); }, [user]);

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
    await fetchTasks();
    setAdding(false);
  };

  const handleStatus = async (id: string, status: Task['status']) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { status });
    await fetchTasks();
  };

  if (loading) {
    return <div style={{ minHeight: '100dvh', background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: COLORS.muted }}>読み込み中…</span></div>;
  }
  if (!user) { router.replace('/'); return null; }

  const activeTasks = tasks.filter(t => t.status === 'active');

  return (
    <div style={{ minHeight: '100dvh', background: COLORS.ink, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 22, cursor: 'pointer' }}>←</button>
        <h1 style={{ color: COLORS.chalk, fontSize: 20, fontFamily: 'Shippori Mincho', margin: 0 }}>タスク・目標</h1>
      </header>

      <section style={{ background: COLORS.inkRaised, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ color: COLORS.muted, fontSize: 13, margin: 0, fontFamily: 'Zen Kaku Gothic New' }}>新しい目標を追加</p>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="目標のタイトル" style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.chalk, padding: '10px 12px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }} />
        <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} placeholder="なぜやるのか（モチベーションになります）" style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.chalk, padding: '10px 12px', fontSize: 14, fontFamily: 'Zen Kaku Gothic New', outline: 'none' }} />
        <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={{ background: '#2A2D45', border: 'none', borderRadius: 8, color: COLORS.muted, padding: '10px 12px', fontSize: 14, fontFamily: 'Roboto Mono', outline: 'none' }} />
        <button onClick={handleAdd} disabled={adding || !form.title.trim()} style={{ background: COLORS.sprout, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New', fontWeight: 700, opacity: adding || !form.title.trim() ? 0.6 : 1 }}>
          追加
        </button>
      </section>

      {activeTasks.length > 0 && (
        <section>
          <h2 style={{ color: COLORS.chalk, fontSize: 15, fontFamily: 'Shippori Mincho', marginBottom: 10 }}>進行中</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeTasks.map(t => {
              const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={t.id} style={{ background: COLORS.inkRaised, borderRadius: 10, padding: '14px 14px 10px' }}>
                  <p style={{ color: COLORS.chalk, fontSize: 15, margin: '0 0 4px', fontFamily: 'Zen Kaku Gothic New' }}>{t.title}</p>
                  {t.why && <p style={{ color: COLORS.muted, fontSize: 12, margin: '0 0 8px', fontFamily: 'Zen Kaku Gothic New' }}>なぜ: {t.why}</p>}
                  {daysLeft !== null && <p style={{ color: daysLeft < 3 ? COLORS.alert : COLORS.muted, fontSize: 11, margin: '0 0 8px', fontFamily: 'Roboto Mono' }}>残り {daysLeft} 日</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleStatus(t.id, 'done')} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.sprout}`, color: COLORS.sprout, borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>達成</button>
                    <button onClick={() => handleStatus(t.id, 'abandoned')} style={{ flex: 1, background: 'transparent', border: '1px solid #3A3D55', color: COLORS.muted, borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', fontFamily: 'Zen Kaku Gothic New' }}>中断</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
