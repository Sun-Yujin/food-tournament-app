// src/lib/users.ts
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";

export async function saveUser(uid: string, name: string, email: string) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      name,
      email,
      spoons: 0, // ✅ 새 필드 추가 (최초 0개)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUser(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ✅ 숟가락 개수 증가 함수
export async function addSpoons(uid: string, amount: number) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    spoons: increment(amount),
    updatedAt: serverTimestamp(),
  });
}