import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export type UserProfile = {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  onboardingComplete?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const ref = (uid: string) => doc(db, "users", uid);

export async function getUserProfile(uid: string) {
  const snap = await getDoc(ref(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(
    ref(uid),
    { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(ref(uid), { ...data, updatedAt: serverTimestamp() });
}
