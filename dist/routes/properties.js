"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = __importDefault(require("../firebase"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const router = (0, express_1.Router)();
const db = firebase_1.default.firestore();
// Route to list all properties from Firestore
router.get('/properties', (0, asyncHandler_1.default)(async (req, res) => {
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
exports.default = router;
//# sourceMappingURL=properties.js.map