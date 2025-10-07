import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const databaseId = process.env.FIREBASE_DATABASE_ID || "(default)";

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Faltan variables FIREBASE_* para inicializar Firebase Admin");
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
      projectId,
    });

export const db = getFirestore(app, databaseId);

export function getFirebaseDebugInfo() {
  return {
    projectId,
    databaseId,
    clientEmailMasked: clientEmail ? clientEmail.replace(/^[^@]+/, "***") : undefined,
  };
}


