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
import {
  firebaseOwnerEmail,
  getFirebaseServices,
  googleOAuthClientId,
  type FirebaseServices,
} from "./firebase-client";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: "popup";
        use_fedcm_for_button?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: {
        theme: "outline";
        size: "medium";
        text: "signin_with";
        shape: "rectangular";
        logo_alignment: "left";
        locale: "ko";
      }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

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
  authReady: boolean;
  user: User | null;
  status: SyncStatus;
  error: string;
  updateChecklist: (items: string[]) => void;
  updateScheduleItem: (key: string, patch: Partial<ScheduleState[string]>) => void;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
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
  const [authReady, setAuthReady] = useState(false);
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
        setAuthReady(true);
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
              setError("");
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
        setAuthReady(false);
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

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    try {
      setStatus("connecting");
      setError("");
      const services = servicesRef.current ?? await getFirebaseServices();
      servicesRef.current = services;
      const credential = services.authApi.GoogleAuthProvider.credential(idToken);
      await services.authApi.signInWithCredential(services.auth, credential);
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
      setStatus("error");
      setError(code ? `Google 로그인에 실패했습니다. (${code})` : "Google 로그인에 실패했습니다.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const services = servicesRef.current ?? await getFirebaseServices();
    await services.authApi.signOut(services.auth);
  }, []);

  const contextValue = useMemo<TripSyncContextValue>(() => ({
    state,
    ready,
    authReady,
    user,
    status,
    error,
    updateChecklist,
    updateScheduleItem,
    signInWithGoogleIdToken,
    signOut,
  }), [authReady, error, ready, signInWithGoogleIdToken, signOut, state, status, updateChecklist, updateScheduleItem, user]);

  return <TripSyncContext.Provider value={contextValue}>{children}</TripSyncContext.Provider>;
}

export function useTripSync() {
  const context = useContext(TripSyncContext);
  if (!context) throw new Error("useTripSync는 FirebaseSyncProvider 안에서 사용해야 합니다.");
  return context;
}

export function FirebaseSyncStatus() {
  const { authReady, user, error, signInWithGoogleIdToken, signOut } = useTripSync();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleButtonError, setGoogleButtonError] = useState("");

  useEffect(() => {
    if (!authReady || user || !googleButtonRef.current) return;

    let active = true;
    const scriptId = "google-identity-services";
    const renderGoogleButton = () => {
      if (!active || !window.google || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleOAuthClientId,
        callback: (response) => {
          if (response.credential) void signInWithGoogleIdToken(response.credential);
        },
        ux_mode: "popup",
        use_fedcm_for_button: true,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "medium",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        locale: "ko",
      });
      setGoogleButtonError("");
    };
    const handleLoadError = () => {
      if (active) setGoogleButtonError("Google 로그인 버튼을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
    };

    if (window.google) {
      renderGoogleButton();
      return () => {
        active = false;
      };
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client?hl=ko";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderGoogleButton);
    script.addEventListener("error", handleLoadError);

    return () => {
      active = false;
      script?.removeEventListener("load", renderGoogleButton);
      script?.removeEventListener("error", handleLoadError);
    };
  }, [authReady, signInWithGoogleIdToken, user]);

  return (
    <div
      className="firebase-sync"
      aria-live="polite"
      title={error || undefined}
    >
      {user ? (
        <button type="button" onClick={() => void signOut()}>로그아웃</button>
      ) : (
        <div className="google-signin-slot" ref={googleButtonRef} aria-label="Google 로그인">
          {!authReady && <span>로그인 준비 중</span>}
        </div>
      )}
      {(error || googleButtonError) && (
        <small className="firebase-sync-error" role="alert">{error || googleButtonError}</small>
      )}
    </div>
  );
}
