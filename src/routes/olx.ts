
import { Router, Request, Response, NextFunction } from 'express';
import { collection, getDocs, doc, addDoc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore/lite';
import admin from '../firebase';
import { z, ZodError } from 'zod';
import asyncHandler from '../utils/asyncHandler';

const router = Router();
const db = admin.firestore();

// --- Zod Schemas and Validation Middleware ---

// Schema for creating/updating an OLX item
const olxSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
  price: z.number().positive({ message: "Price must be a positive number" }),
});

// Schema for partial updates (PATCH)
const partialOlxSchema = olxSchema.partial();

// Generic validation middleware
const validate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Validation failed",
        issues: error.flatten(),
      });
    } else {
      // Pass other errors to the centralized error handler
      next(error);
    }
  }
};


// --- OLX CRUD Routes with Zod Validation ---

router.post('/olx', validate(olxSchema), asyncHandler(async (req, res) => {
  const olxCol = db.collection('olx');
  const newDocRef = await olxCol.add(req.body);
  const newDoc = await newDocRef.get();
  const data = newDoc.data();
  const id = newDoc.id;
  res.status(201).json({ ...data, _links: { self: { href: `/api/olx/${id}` }, update: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));

router.get('/olx/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('olx').doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, update: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
}));

router.put('/olx/:id', validate(olxSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('olx').doc(id);
  await docRef.set(req.body);
  const updatedDoc = await docRef.get();
  const data = updatedDoc.data();
  res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));

router.patch('/olx/:id', validate(partialOlxSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('olx').doc(id);
  await docRef.update(req.body);
  const updatedDoc = await docRef.get();
  const data = updatedDoc.data();
  res.json({ ...data, _links: { self: { href: `/api/olx/${id}` }, delete: { href: `/api/olx/${id}` } } });
}));

router.delete('/olx/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await db.collection('olx').doc(id).delete();
  res.status(204).send();
}));

export default router;
