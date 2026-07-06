const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiService');
const Task = require('../models/Task');
const Workflow = require('../models/Workflow');
const Email = require('../models/Email');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// Protect all automation routes
router.use(verifyToken);

// 1. Email Generator
router.post('/email', async (req, res) => {
  try {
    const { topic, tone, recipient, keyPoints } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const prompt = `Write a professional email.
      Topic: ${topic}
      Tone: ${tone || 'Professional'}
      Recipient: ${recipient || 'Not specified'}
      Key Points to cover: ${keyPoints || 'None'}
      
      Format the output cleanly in markdown without unnecessary pleasantries outside the email body. Include a Subject line.`;
      
      const result = await geminiService.generateAIResponse(prompt);
      
      const email = new Email({
        userId: req.user.uid,
        topic,
        tone: tone || 'Professional',
        recipient: recipient || 'Not specified',
        keyPoints: keyPoints || 'None',
        content: result
      });
      await email.save();

      await Activity.create({
        userId: req.user.uid,
        action: 'Email generated',
        details: `Generated email about: ${topic}`
      });
      await Notification.create({
        userId: req.user.uid,
        title: 'Email Generated',
        message: `Successfully generated email: ${topic}`,
        type: 'success',
        link: '/dashboard/automation'
      });

    res.status(200).json({ result });
  } catch (error) {
    console.error('[Automation Error] ', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to generate email' });
  }
});

// 2. Meeting Notes Generator
router.post('/meeting-notes', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

    const prompt = `Transform the following raw meeting transcript or notes into structured meeting minutes.
      Include: 
      - Meeting Summary (1 paragraph)
      - Key Discussion Points (bullet points)
      - Action Items (bullet points)
      
      Raw Notes:
      ${transcript}
      
      Format beautifully in Markdown.`;
      
    const result = await geminiService.generateAIResponse(prompt);
    
    await Activity.create({
      userId: req.user.uid,
      action: 'Meeting notes generated',
      details: 'Transformed a raw transcript into structured notes'
    });
    await Notification.create({
      userId: req.user.uid,
      title: 'Notes Generated',
      message: 'Successfully transformed transcript into meeting notes.',
      type: 'success',
      link: '/dashboard/automation'
    });

    res.status(200).json({ result });
  } catch (error) {
    console.error('[Automation Error] ', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to generate meeting notes' });
  }
});

// 3. Task Generator (Returns JSON array of tasks)
router.post('/tasks', async (req, res) => {
  try {
    const { projectDescription, userId } = req.body;
    if (!projectDescription) return res.status(400).json({ error: 'Project description is required' });

    const prompt = `Break down the following project/goal into a list of actionable tasks.
      Return a JSON array of objects, where each object has:
      - "title": A short, clear task title.
      - "description": A slightly longer description of what needs to be done.
      
      Project Description:
      ${projectDescription}`;
      
    const result = await geminiService.generateAIResponse(prompt, null, { jsonMode: true });
    const tasks = JSON.parse(result); // Safe because _extractJSON was applied
    
    // If userId provided, save to DB automatically
    if (userId && Array.isArray(tasks)) {
      const savedTasks = await Promise.all(tasks.map(async (t) => {
        const task = new Task({
          userId,
          title: t.title,
          description: t.description,
          status: 'pending'
        });
        return await task.save();
      }));

      await Activity.create({
        userId: req.user.uid,
        action: 'Tasks created',
        details: `Created ${tasks.length} tasks from project description`
      });
      await Notification.create({
        userId: req.user.uid,
        title: 'Tasks Generated',
        message: `Successfully generated ${tasks.length} tasks.`,
        type: 'success',
        link: '/dashboard/automation'
      });

      return res.status(200).json({ tasks: savedTasks, message: 'Tasks saved to database' });
    }
    
    res.status(200).json({ tasks, message: 'Tasks generated' });
  } catch (error) {
    console.error('[Automation Error] ', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to generate tasks' });
  }
});

// 4. Workflow Generator
router.post('/workflow', async (req, res) => {
  try {
    const { processDescription, userId } = req.body;
    if (!processDescription) return res.status(400).json({ error: 'Process description is required' });

    const prompt = `Design an automation workflow based on the user's description.
      Return a JSON object with:
      - "name": A concise name for the workflow.
      - "trigger": What event starts the workflow.
      - "action": What happens when the workflow is triggered.
      
      Description:
      ${processDescription}`;
      
    const result = await geminiService.generateAIResponse(prompt, null, { jsonMode: true });
    const workflowData = JSON.parse(result); // Safe
    
    if (userId) {
      const workflow = new Workflow({
        userId,
        name: workflowData.name,
        trigger: workflowData.trigger,
        action: workflowData.action,
        isActive: true
      });
      await workflow.save();
      
      await Activity.create({
        userId: req.user.uid,
        action: 'Workflow created',
        details: `Designed workflow: ${workflowData.name}`
      });
      await Notification.create({
        userId: req.user.uid,
        title: 'Workflow Created',
        message: `Successfully designed workflow: ${workflowData.name}`,
        type: 'success',
        link: '/dashboard/automation'
      });

      return res.status(200).json({ workflow, message: 'Workflow saved to database' });
    }
    
    res.status(200).json({ workflow: workflowData, message: 'Workflow generated' });
  } catch (error) {
    console.error('[Automation Error] ', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to generate workflow' });
  }
});

// 5. Document Q&A Stateless Chat
router.post('/document-chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }
    
    const text = await geminiService.generateAIResponse(messages, systemInstruction);
    res.status(200).json({ text });
  } catch (error) {
    console.error('[Automation Error] ', error.stack || error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to communicate with AI.' });
  }
});

// --- History & Management Routes ---

// Emails
router.get('/emails', async (req, res) => {
  try {
    const emails = await Email.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.status(200).json(emails);
  } catch { 
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});
router.delete('/emails/:id', async (req, res) => {
  try {
    await Email.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    res.status(200).json({ message: 'Deleted' });
  } catch { 
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Workflows
router.get('/workflows', async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.status(200).json(workflows);
  } catch { 
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});
router.put('/workflows/:id', async (req, res) => {
  try {
    const wf = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(wf);
  } catch { 
    res.status(500).json({ error: 'Failed to update' });
  }
});
router.delete('/workflows/:id', async (req, res) => {
  try {
    await Workflow.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    res.status(200).json({ message: 'Deleted' });
  } catch { 
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Tasks (For Automation Hub display)
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch { 
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});
router.delete('/tasks/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    res.status(200).json({ message: 'Deleted' });
  } catch { 
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
