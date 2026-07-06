const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');

// Get all workflows for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(workflows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a workflow
router.post('/', async (req, res) => {
  try {
    const workflow = new Workflow(req.body);
    await workflow.save();
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a workflow
router.put('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    await Workflow.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
