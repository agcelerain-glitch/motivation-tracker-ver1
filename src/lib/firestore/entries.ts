import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Entry } from '@/types/entry';

export async function getEntry(uid: string, logicalDate: string): Promise<Entry | null> {
  const ref = doc(db, 'users', uid, 'entries', logicalDate);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Entry) : null;
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
