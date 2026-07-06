const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { verifyToken } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiService');
const Document = require('../models/Document');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'));
    }
  }
});

// Protect all document routes
router.use(verifyToken);

// Get all documents for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.uid }).sort({ updatedAt: -1 });
    res.status(200).json(docs);
  } catch (error) {
    console.error('[Document Error] GET /user/:userId:', error.stack || error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload and analyze a document
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[Multer Error] POST /upload:', err);
      return res.status(400).json({ error: 'File upload failed due to stream error.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    let extractedText = '';

    // Extract text based on file type
    if (originalName.endsWith('.pdf')) {
      try {
        const parser = new PDFParse({ data: fileBuffer });
        const pdfData = await parser.getText({ pageJoiner: '' });
        extractedText = pdfData.text;
      } catch (pdfErr) {
        console.error('[Document Error] Failed to parse PDF:', pdfErr);
        return res.status(400).json({ error: 'Failed to parse PDF. The file may be invalid, empty, or corrupted.' });
      }
    } else if (originalName.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } catch (docxErr) {
        console.error('[Document Error] Failed to parse DOCX:', docxErr);
        return res.status(400).json({ error: 'Failed to parse DOCX. The file may be invalid or corrupted.' });
      }
    } else if (originalName.endsWith('.txt')) {
      extractedText = fileBuffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the document.' });
    }

    // Limit text size to prevent exceeding token limits (rough approximation)
    const MAX_CHARS = 100000; 
    const textToAnalyze = extractedText.substring(0, MAX_CHARS);

    // Call Gemini to analyze the text
    const prompt = `
      Analyze the following document text and return a JSON object with exactly these three keys:
      1. "summary": A well-written, comprehensive paragraph summarizing the main ideas.
      2. "keyPoints": An array of strings, where each string is a distinct key point from the text.
      3. "actionItems": An array of strings, where each string is an actionable task or next step found in the text. If none exist, return an empty array.

      Document Text:
      ${textToAnalyze}
    `;

    const result = await geminiService.generateAIResponse(prompt, null, { jsonMode: true });
    let analysis;
    
    try {
      analysis = JSON.parse(result); // Safe because _extractJSON was applied
    } catch {
      console.error("[Document Error] Failed to parse Gemini response as JSON:", result);
      return res.status(500).json({ error: 'Failed to process document analysis.' });
    }

    // Save to MongoDB
    const doc = new Document({
      userId: req.user.uid,
      title: originalName,
      content: extractedText,
      summary: analysis.summary || '',
      keyPoints: analysis.keyPoints || [],
      actionItems: analysis.actionItems || []
    });
    const savedDoc = await doc.save();

    await Activity.create({
      userId: req.user.uid,
      action: 'Document analyzed',
      details: `Analyzed document: ${originalName}`
    });

    await Notification.create({
      userId: req.user.uid,
      title: 'Document Analyzed',
      message: `Successfully analyzed ${originalName}`,
      type: 'success',
      link: '/dashboard/documents'
    });

    res.status(200).json({
      document: savedDoc,
      analysis: {
        title: originalName,
        content: extractedText,
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        actionItems: analysis.actionItems
      }
    });

  } catch (error) {
    console.error('[Document Error] POST /upload:', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'An error occurred during upload.' });
  }
});

// Update a document
router.put('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json(doc);
  } catch (error) {
    console.error('[Document Error] PUT /:id:', error.stack || error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('[Document Error] DELETE /:id:', error.stack || error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
