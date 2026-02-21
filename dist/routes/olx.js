"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = __importDefault(require("../firebase"));
const zod_1 = require("zod");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = (0, express_1.Router)();
const db = firebase_1.default.firestore();
// --- Zod Schemas and Validation Middleware ---
// Schema for creating/updating an OLX item
const olxSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, { message: "Title must be at least 3 characters long" }),
    price: zod_1.z.number().positive({ message: "Price must be a positive number" }),
});
// Schema for partial updates (PATCH)
const partialOlxSchema = olxSchema.partial();
// Generic validation middleware
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: "Validation failed",
                issues: error.flatten(),
            });
        }
        else {
            // Pass other errors to the centralized error handler
            next(error);
        }
    }
};
// --- OLX CRUD Routes with Zod Validation ---
router.post('/olx', validate(olxSchema), (0, asyncHandler_1.default)(async (req, res) => {
    const olxCol = db.collection('olx');
    const newDocRef = await olxCol.add(req.body);
    const newDoc = await newDocRef.get();
    const data = newDoc.data();
    const id = newDoc.id;
    res.status(201).json({ ...data, _links: { self: { href: `/api/olx/${id}` }, update: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));
router.get('/olx/:id', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const docRef = db.collection('olx').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        const data = docSnap.data();
        res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, update: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
    }
    else {
        res.status(404).json({ error: 'Document not found' });
    }
}));
router.put('/olx/:id', validate(olxSchema), (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const docRef = db.collection('olx').doc(id);
    await docRef.set(req.body);
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));
router.patch('/olx/:id', validate(partialOlxSchema), (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const docRef = db.collection('olx').doc(id);
    await docRef.update(req.body);
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));
router.delete('/olx/:id', (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    await db.collection('olx').doc(id).delete();
    res.status(204).send();
}));
exports.default = router;
//# sourceMappingURL=olx.js.map