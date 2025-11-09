import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function saveTournamentToFirestore(t: {
  id: string;
  title: string;
  description?: string;
  locationTag?: string;
  creatorName: string;
  creatorEmail: string;
}) {
  const ref = doc(db, "tournaments", t.id);
  await setDoc(ref, {
    title: t.title,
    description: t.description ?? "",
    locationTag: t.locationTag ?? "",
    creatorName: t.creatorName,
    creatorEmail: t.creatorEmail,
    createdAt: serverTimestamp(),
    participants: [t.creatorEmail], // 생성자 본인 이메일을 첫 참여자로
  });
}
