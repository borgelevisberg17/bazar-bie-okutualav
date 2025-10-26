const admin = require("firebase-admin");

/**
 * Indicates whether the Firebase credentials are present in the environment variables.
 * @type {boolean}
 */
const hasCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

// Inicializa o Firebase Admin SDK apenas se não estiver no modo de teste
// e se as credenciais estiverem presentes.
if (process.env.NODE_ENV !== "test" && hasCredentials) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                    /\\n/g,
                    "\n"
                )
            })
        });
        console.log("Firebase Admin SDK inicializado com sucesso.");
    } catch (error) {
        console.error(
            "Falha ao inicializar o Firebase Admin SDK:",
            error.message
        );
    }
} else if (process.env.NODE_ENV !== "test") {
    console.warn(
        "Credenciais do Firebase não encontradas. O Admin SDK não foi inicializado."
    );
}

/**
 * The initialized Firebase Admin SDK instance.
 * @type {import('firebase-admin')}
 */
module.exports = admin;
