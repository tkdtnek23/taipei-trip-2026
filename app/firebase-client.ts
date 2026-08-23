import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export const firebaseOwnerEmail = "tkdtnek23@gmail.com";
export const googleOAuthClientId = "632795375764-8rm5o8fa0kkb1nefcs0qbbg09l6p0n2h.apps.googleusercontent.com";

const firebaseConfig = {
  apiKey: "AIzaSyCxQhRDz-AuEFuzzROyLCZClTv0eIe_My8",
  authDomain: "taipei-trip-2026-tkdtnek23.firebaseapp.com",
  projectId: "taipei-trip-2026-tkdtnek23",
  storageBucket: "taipei-trip-2026-tkdtnek23.firebasestorage.app",
  messagingSenderId: "632795375764",
  appId: "1:632795375764:web:f9d5f41bbd59b9dd792c81",
};

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  authApi: typeof import("firebase/auth");
  firestoreApi: typeof import("firebase/firestore");
};

let servicesPromise: Promise<FirebaseServices> | null = null;

export function getFirebaseServices() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firebase는 브라우저에서만 연결할 수 있습니다."));
  }

  if (!servicesPromise) {
    servicesPromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]).then(([appApi, authApi, firestoreApi]) => {
      const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(firebaseConfig);
      const auth = authApi.getAuth(app);
      auth.useDeviceLanguage();
      let db: Firestore;

      try {
        db = firestoreApi.initializeFirestore(app, {
          localCache: firestoreApi.persistentLocalCache({
            tabManager: firestoreApi.persistentMultipleTabManager(),
          }),
        });
      } catch {
        db = firestoreApi.getFirestore(app);
      }

      return {
        app,
        auth,
        db,
        authApi,
        firestoreApi,
      };
    });
  }

  return servicesPromise;
}
