"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    let serviceAccount;
    const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (encodedCredentials) {
        try {
            const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
            if (decodedCredentials) {
                serviceAccount = JSON.parse(decodedCredentials);
            }
            else {
                console.error('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS decoded to an empty string.');
            }
        }
        catch (error) {
            console.error('Firebase Admin SDK: Failed to parse GOOGLE_APPLICATION_CREDENTIALS. Ensure it is a valid Base64 encoded JSON.', error);
        }
    }
    else {
        console.error('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    }
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "secureadminpanel.firebasestorage.app"
        });
    }
    else {
        console.error('Firebase Admin SDK initialization failed. See previous logs for details.');
    }
}
exports.default = admin;
//# sourceMappingURL=firebase.js.map