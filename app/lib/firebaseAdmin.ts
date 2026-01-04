import admin from "firebase-admin";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function getServiceAccount() {
  // Allow passing full JSON as env var or individual values.
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      return obj;
    } catch (e) {
      // fallthrough
    }
  }

  const project_id = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const client_email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const private_key = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (project_id && client_email && private_key) {
    return { project_id, client_email, private_key };
  }

  return null;
}

const serviceAccount = getServiceAccount();

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
} else if (!serviceAccount) {
  // do not initialize admin; routes that require admin will error with a helpful message
  // console.warn could be used, but avoid noisy logs in production
}

export default admin;
