import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOyoKjqoGMCh844L5GlpI5QG4aTgIl1Jw",
  authDomain: "makyks.firebaseapp.com",
  databaseURL: "https://makyks-default-rtdb.firebaseio.com",
  projectId: "makyks",
  storageBucket: "makyks.firebasestorage.app",
  messagingSenderId: "1040735509032",
  appId: "1:1040735509032:web:8feed4d95722fe412cb31d",
};

// Only Realtime Database is used (Storage is paid and not needed here).
const app = initializeApp(firebaseConfig);
export const rtDb = getDatabase(app);
export const fbAuth = getAuth(app);

/** RTDB rules require a signed-in user; anonymous auth is enough for layout saves.
 *  If the project has anonymous sign-in disabled, stop retrying and use the API fallback. */
let authUnavailable = false;
export async function ensureFbAuth() {
  if (authUnavailable) return null;
  if (!fbAuth.currentUser) {
    try { await signInAnonymously(fbAuth); }
    catch { authUnavailable = true; return null; }
  }
  return fbAuth.currentUser;
}
