
import { Router } from 'express';
import admin from '../firebase';
import asyncHandler from '../utils/asyncHandler';

const router = Router();
const db = admin.firestore();

// Route to list all properties from Firestore
router.get('/properties', asyncHandler(async (req, res) => {
  const propertiesCol = db.collection('properties');
  const propertiesSnapshot = await propertiesCol.get();
  const propertiesList = propertiesSnapshot.docs.map(doc => {
    const data = doc.data();
    const id = doc.id;
    return {
      ...data,
      _links: {
        self: {
          href: `/api/properties/${id}`
        }
      }
    };
  });

  res.json({
    _links: {
      self: {
        href: '/api/properties'
      }
    },
    _embedded: {
      properties: propertiesList
    }
  });
}));

export default router;
