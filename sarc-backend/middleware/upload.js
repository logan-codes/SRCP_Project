const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Use raw resource type for pdfs and docx
    let resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
    return {
      folder: 'sarc_uploads',
      resource_type: resourceType,
      public_id: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9)
    };
  },
});

// File filter based on type (images, pdfs, docs)
// File filter based on type
const fileFilter = (req, file, cb) => {
    // strict validation based on field name
    if (file.fieldname === 'profilePhoto') {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type for profile photo. Only JPEG, PNG allowed.'), false);
        }
    } else if (file.fieldname === 'resumeFile') {
        const allowedResumeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedResumeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type for resume. Only PDF and DOC/DOCX allowed.'), false);
        }
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
