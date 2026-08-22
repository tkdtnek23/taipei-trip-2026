"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { firebaseOwnerEmail, getFirebaseServices, type FirebaseServices } from "./firebase-client";

type ScheduleState = Record<string, { done: boolean; memo: string }>;

type TripState = {
  checklist: string[];
  schedule: ScheduleState;
  privateLinks: Record<string, string>;
};

type SyncStatus = "connecting" | "signed-out" | "syncing" | "saving" | "synced" | "error";

type TripSyncContextValue = {
  state: TripState;
  ready: boolean;
  user: User | null;
  status: SyncStatus;
  error: string;
  updateChecklist: (items: string[]) => void;
  updateScheduleItem: (key: string, patch: Partial<ScheduleState[string]>) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const checklistStorageKey = "taipei-trip-prep-checklist-v1";
const doneStoragePrefix = "taipei-trip-schedule-done-v1:";
const memoStoragePrefix = "taipei-trip-schedule-memo-v1:";
const tripDocumentPath = ["trips", "taipei-2026"] as const;
const emptyState: TripState = { checklist: [], schedule: {}, privateLinks: {} };

const TripSyncContext = createContext<TripSyncContextValue | null>(null);

export function getScheduleItemKey(dayId: string, time: string, title: string) {
  return `${dayId}:${time}:${title}`;
}

function readLocalState(): TripState {
  const next: TripState = { checklist: [], schedule: {}, privateLinks: {} };

  try {
    const checklist = window.localStorage.getItem(checklistStorageKey);
    if (checklist) {
      const parsed = JSON.parse(checklist);
      if (Array.isArray(parsed)) next.checklist = parsed.filter((item) => typeof item === "string");
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey) continue;

      const prefix = storageKey.startsWith(doneStoragePrefix)
        ? doneStoragePrefix
        : storageKey.startsWith(memoStoragePrefix)
          ? memoStoragePrefix
          : null;
      if (!prefix) continue;

      const itemKey = storageKey.slice(prefix.length);
      const current = next.schedule[itemKey] ?? { done: false, memo: "" };
      if (prefix === doneStoragePrefix) current.done = window.localStorage.getItem(storageKey) === "true";
      if (prefix === memoStoragePrefix) current.memo = window.localStorage.getItem(storageKey) ?? "";
      next.schedule[itemKey] = current;
    }
  } catch {
    // 브라우저 저장소를 사용할 수 없으면 빈 상태로 시작합니다.
  }

  return next;
}

function normalizeTripState(value: unknown): TripState {
  if (!value || typeof value !== "object") return emptyState;
  const candidate = value as { checklist?: unknown; schedule?: unknown; privateLinks?: unknown };
  const checklist = Array.isArray(candidate.checklist)
    ? candidate.checklist.filter((item): item is string => typeof item === "string")
    : [];
  const schedule: ScheduleState = {};
  const privateLinks: Record<string, string> = {};

  if (candidate.schedule && typeof candidate.schedule === "object") {
    Object.entries(candidate.schedule).forEach(([key, row]) => {
      if (!row || typeof row !== "object") return;
      const item = row as { done?: unknown; memo?: unknown };
      schedule[key] = {
        done: item.done === true,
        memo: typeof item.memo === "string" ? item.memo : "",
      };
    });
  }

  if (candidate.privateLinks && typeof candidate.privateLinks === "object") {
    Object.entries(candidate.privateLinks).forEach(([key, url]) => {
      if (typeof url === "string") privateLinks[key] = url;
    });
  }

  return { checklist, schedule, privateLinks };
}

function writeLocalState(state: TripState) {
  try {
    window.localStorage.setItem(checklistStorageKey, JSON.stringify(state.checklist));
    Object.entries(state.schedule).forEach(([key, row]) => {
      window.localStorage.setItem(`${doneStoragePrefix}${key}`, String(row.done));
      window.localStorage.setItem(`${memoStoragePrefix}${key}`, row.memo);
    });
  } catch {
    // Firebase가 원본이므로 로컬 복사본 저장 실패는 무시합니다.
  }
}

export function FirebaseSyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripState>(emptyState);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>("connecting");
  const [error, setError] = useState("");
  const stateRef = useRef(state);
  const servicesRef = useRef<FirebaseServices | null>(null);
  const ownerSignedInRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const applyState = useCallback((next: TripState) => {
    stateRef.current = next;
    setState(next);
    writeLocalState(next);
  }, []);

  const saveToFirebase = useCallback((next: TripState) => {
    const services = servicesRef.current;
    if (!services || !ownerSignedInRef.current) return;

    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    setStatus("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const document = services.firestoreApi.doc(services.db, ...tripDocumentPath);
        await services.firestoreApi.setDoc(document, {
          checklist: next.checklist,
          schedule: next.schedule,
          privateLinks: next.privateLinks,
          updatedAt: services.firestoreApi.serverTimestamp(),
        });
        setStatus("synced");
        setError("");
      } catch {
        setStatus("error");
        setError("Firebase에 저장하지 못했습니다. 네트워크 연결을 확인해 주세요.");
      }
    }, 450);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeDocument: (() => void) | undefined;

    const localState = readLocalState();
    stateRef.current = localState;
    setState(localState);
    setReady(true);

    void getFirebaseServices()
      .then((services) => {
        if (!active) return;
        servicesRef.current = services;
        unsubscribeAuth = services.authApi.onAuthStateChanged(services.auth, (nextUser) => {
          unsubscribeDocument?.();
          unsubscribeDocument = undefined;

          if (!active) return;
          if (!nextUser) {
            ownerSignedInRef.current = false;
            setUser(null);
            stateRef.current = { ...stateRef.current, privateLinks: {} };
            setState(stateRef.current);
            setStatus("signed-out");
            return;
          }

          if (nextUser.email?.toLowerCase() !== firebaseOwnerEmail) {
            ownerSignedInRef.current = false;
            setError("이 여행 일정의 관리 계정으로 로그인해 주세요.");
            setStatus("error");
            void services.authApi.signOut(services.auth);
            return;
          }

          ownerSignedInRef.current = true;
          setUser(nextUser);
          setStatus("syncing");
          setError("");

          const document = services.firestoreApi.doc(services.db, ...tripDocumentPath);
          unsubscribeDocument = services.firestoreApi.onSnapshot(
            document,
            (snapshot) => {
              if (!active) return;
              if (snapshot.exists()) {
                const data = snapshot.data();
                const remoteState = normalizeTripState(data);
                if (!("checklist" in data) && !("schedule" in data)) {
                  const migratedState = { ...stateRef.current, privateLinks: remoteState.privateLinks };
                  applyState(migratedState);
                  void services.firestoreApi.setDoc(document, {
                    checklist: migratedState.checklist,
                    schedule: migratedState.schedule,
                    privateLinks: migratedState.privateLinks,
                    updatedAt: services.firestoreApi.serverTimestamp(),
                  });
                  return;
                }
                applyState(remoteState);
                setStatus(snapshot.metadata.hasPendingWrites ? "saving" : "synced");
                return;
              }

              void services.firestoreApi.setDoc(document, {
                checklist: stateRef.current.checklist,
                schedule: stateRef.current.schedule,
                privateLinks: stateRef.current.privateLinks,
                updatedAt: services.firestoreApi.serverTimestamp(),
              });
            },
            () => {
              if (!active) return;
              setStatus("error");
              setError("Firebase 데이터를 불러오지 못했습니다.");
            },
          );
        });
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setError("Firebase에 연결하지 못했습니다.");
      });

    return () => {
      active = false;
      unsubscribeDocument?.();
      unsubscribeAuth?.();
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [applyState]);

  const updateChecklist = useCallback((items: string[]) => {
    const next = { ...stateRef.current, checklist: items };
    applyState(next);
    saveToFirebase(next);
  }, [applyState, saveToFirebase]);

  const updateScheduleItem = useCallback((key: string, patch: Partial<ScheduleState[string]>) => {
    const current = stateRef.current.schedule[key] ?? { done: false, memo: "" };
    const next = {
      ...stateRef.current,
      schedule: {
        ...stateRef.current.schedule,
        [key]: { ...current, ...patch },
      },
    };
    applyState(next);
    saveToFirebase(next);
  }, [applyState, saveToFirebase]);

  const signIn = useCallback(async () => {
    try {
      setStatus("connecting");
      setError("");
      const services = servicesRef.current ?? await getFirebaseServices();
      servicesRef.current = services;
      const provider = new services.authApi.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await services.authApi.signInWithPopup(services.auth, provider);
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      if (code === "auth/popup-closed-by-user") {
        setStatus("signed-out");
        return;
      }
      setStatus("error");
      setError("Google 로그인에 실패했습니다.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const services = servicesRef.current ?? await getFirebaseServices();
    await services.authApi.signOut(services.auth);
  }, []);

  const contextValue = useMemo<TripSyncContextValue>(() => ({
    state,
    ready,
    user,
    status,
    error,
    updateChecklist,
    updateScheduleItem,
    signIn,
    signOut,
  }), [error, ready, signIn, signOut, state, status, updateChecklist, updateScheduleItem, user]);

  return <TripSyncContext.Provider value={contextValue}>{children}</TripSyncContext.Provider>;
}

export function useTripSync() {
  const context = useContext(TripSyncContext);
  if (!context) throw new Error("useTripSync는 FirebaseSyncProvider 안에서 사용해야 합니다.");
  return context;
}

export function FirebaseSyncStatus() {
  const { user, status, error, signIn, signOut } = useTripSync();
  const statusLabel = status === "saving"
    ? "저장 중"
    : status === "syncing" || status === "connecting"
      ? "연결 중"
      : status === "synced"
        ? "Firebase 저장됨"
        : status === "error"
          ? "연결 확인"
          : "기기 임시 저장";

  return (
    <div className="firebase-sync" aria-live="polite" title={error || undefined}>
      <span className={`firebase-sync-state is-${status}`}>{statusLabel}</span>
      {user ? (
        <button type="button" onClick={() => void signOut()}>로그아웃</button>
      ) : (
        <button type="button" onClick={() => void signIn()}>Google 로그인</button>
      )}
    </div>
  );
}
