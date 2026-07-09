import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'mock-api-key';

let app;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization failed, falling back to mock mode:', error);
}

export { db, auth };
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    // Return a simulated user session for local/demo mode
    return {
      uid: 'guest-admin-uid',
      email: 'lathikaaids23@sasurie.com',
      displayName: 'Guest Admin',
      role: 'admin' as const,
    };
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Determine role based on email or default to receptionist/guest,
    // let's make the user's email an admin
    const isAdmin = user.email === 'lathikaaids23@sasurie.com';
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Staff Member',
      role: isAdmin ? ('admin' as const) : ('receptionist' as const),
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function loginAnonymously() {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign-In Error:', error);
    return null;
  }
}
