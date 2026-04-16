import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firebaseApp } from './firebase';
import type { ChatMessage, ChatSession } from '@/types';

export const db = getFirestore(firebaseApp);

const CHATS = 'chats';

function toISO(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

/** チャットセッション一覧を取得（新しい順）。uid = Firebase Auth の uid */
export async function getChatSessions(uid: string): Promise<ChatSession[]> {
  const q = query(collection(db, CHATS), where('uid', '==', uid));
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? '新しいチャット',
      propertyName: data.propertyName ?? '',
      propertyId: data.propertyId ?? '',
      bqLinkStatus: data.bqLinkStatus ?? 'fallback_api',
      messages: data.messages ?? [],
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } satisfies ChatSession;
  });
  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 単一チャットセッションを取得 */
export async function getChatSession(chatId: string): Promise<ChatSession | null> {
  const snap = await getDoc(doc(db, CHATS, chatId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? '新しいチャット',
    propertyName: data.propertyName ?? '',
    propertyId: data.propertyId ?? '',
    bqLinkStatus: data.bqLinkStatus ?? 'fallback_api',
    messages: data.messages ?? [],
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

/** 新しいチャットセッションを作成 */
export async function createChatSession(params: {
  uid: string;           // Firebase Auth uid
  email: string;
  title: string;
  propertyName: string;
  propertyId: string;
  bqLinkStatus: string;
  messages: ChatMessage[];
}): Promise<string> {
  const ref = await addDoc(collection(db, CHATS), {
    ...params,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** メッセージ更新 */
export async function updateChatSession(
  chatId: string,
  messages: ChatMessage[],
  title?: string,
): Promise<void> {
  const updates: Record<string, unknown> = {
    messages,
    updatedAt: serverTimestamp(),
  };
  if (title !== undefined) updates.title = title;
  await updateDoc(doc(db, CHATS, chatId), updates);
}

/** チャットセッション削除 */
export async function deleteChatSession(chatId: string): Promise<void> {
  await deleteDoc(doc(db, CHATS, chatId));
}

/** タイトル生成（最初のユーザーメッセージから） */
export function generateTitle(message: string): string {
  const trimmed = message.trim().replace(/\n+/g, ' ');
  return trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
}
