
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let serviceAccount;
    const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (encodedCredentials) {
        try {
            const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
            if (decodedCredentials) {
                serviceAccount = JSON.parse(decodedCredentials);
            } else {
                console.error('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS decoded to an empty string.');
            }
        } catch (error) {
            console.error('Firebase Admin SDK: Failed to parse GOOGLE_APPLICATION_CREDENTIALS. Ensure it is a valid Base64 encoded JSON.', error);
        }
    } else {
        console.error('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "secureadminpanel.firebasestorage.app"
        });
    } else {
        console.error('Firebase Admin SDK initialization failed. See previous logs for details.');
    }
}

export default admin;
