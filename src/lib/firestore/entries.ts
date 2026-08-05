import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Entry, TomorrowPlan } from '@/types/entry';

export async function getEntry(uid: string, logicalDate: string): Promise<Entry | null> {
  const ref = doc(db, 'users', uid, 'entries', logicalDate);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Entry) : null;
}

/** 今日（excludeDate）以外の最新エントリから、スキップされていない tomorrow を返す */
export async function getLatestTomorrow(uid: string, excludeDate: string): Promise<TomorrowPlan | null> {
  const q = query(
    collection(db, 'users', uid, 'entries'),
    orderBy('logicalDate', 'desc'),
    limit(5),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const entry = d.data() as Entry;
    if (entry.logicalDate === excludeDate) continue;
    const t = entry.tomorrow;
    if (t && !t.skipped && t.text) return t;
  }
  return null;
}

export async function upsertEntry(uid: string, entry: Omit<Entry, 'createdAt' | 'updatedAt' | 'submittedAt'>): Promise<void> {
  const ref = doc(db, 'users', uid, 'entries', entry.logicalDate);
  const snap = await getDoc(ref);
  await setDoc(ref, {
    ...entry,
    createdAt:   snap.exists() ? snap.data().createdAt : serverTimestamp(),
    updatedAt:   serverTimestamp(),
    submittedAt: serverTimestamp(),
  }, { merge: true });
}
