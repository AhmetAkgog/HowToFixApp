const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();
const db = admin.firestore();

// 🔐 Define OpenAI secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

exports.extractProblemMultimodalV2 = onCall({ secrets: [openaiApiKey] }, async (request) => {
  const context = request.auth;

  const openai = new OpenAI({ apiKey: openaiApiKey.value() });

  const data = request.data || {};
  const { base64Image, textDescription, textOnlyMode } = data;

  if (!base64Image && (!textDescription || textDescription.trim() === '')) {
    throw new HttpsError('invalid-argument', 'At least an image or text description is required.');
  }

  const messageContent = [];

  if (textDescription && textDescription.trim().length > 0) {
    messageContent.push({
      type: "text",
      text: `User's description: ${textDescription}\n\nPlease identify the object and the issue or intent based on the user's input above. Respond in this format:\nObject: <...>\nIssue or Intent: <...>`,
    });
  }

  if (!textOnlyMode && base64Image) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
      },
    });
  }

  const messages = [
    {
      role: "user",
      content: messageContent,
    },
  ];




  let resultText;
  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });
    resultText = chatResponse.choices[0].message.content;
  } catch (err) {
    logger.error("❌ OpenAI understanding failed:", err);
    throw new Error("AI error: " + err.message);
  }

  // 🔍 Parse object and issue
  const objectMatch = resultText.match(/Object:\s*(.*)/i);
  const issueMatch = resultText.match(/Issue(?: or Intent)?:\s*(.*)/i);
  const object = objectMatch?.[1]?.trim() || "Unknown object";
  const issue = issueMatch?.[1]?.trim() || "Unknown issue";

  // 🔧 Get Likely Cause
  let likelyCause = "";
  try {
    const causePrompt = `You are a repair diagnosis assistant.\n\nGiven:\n- Object: ${object}\n- Issue: ${issue}\n\nInfer the most likely technical or physical cause of the issue.\nReturn it as a 1–2 sentence explanation.\nBe specific and practical.`;
    const causeResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: causePrompt }],
    });
    likelyCause = causeResp.choices[0].message.content;
  } catch (err) {
    logger.warn("⚠️ Cause matcher failed:", err);
  }

  // 2️⃣ Classify Task Type
  const taskTypePrompt = `Is this task a repair issue or a DIY project intent?\n\nTask: ${issue}\n\nRespond with 'repair' or 'DIY'.`;
  let taskType = "unknown";
  try {
    const classifyResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: taskTypePrompt }],
    });
    taskType = classifyResp.choices[0].message.content.trim().toLowerCase();
  } catch (err) {
    logger.warn("⚠️ Classification failed:", err);
  }

  // 3️⃣ Generate Instructions
  let instructionPrompt;
  if (taskType === "repair") {
    instructionPrompt = `You are a step-by-step repair guide generator.\n\nObject: ${object}\nIssue: ${issue}\n\nGenerate clear repair instructions. Include:\n- Step-by-step process\n- Required tools or materials\n- Estimated difficulty (Easy, Moderate, Hard)\n- Estimated repair time (in minutes)`;
  } else {
    instructionPrompt = `You are a repair assistant.\n\nObject: ${object}\nIssue: ${issue}\n\nGenerate basic, clear, step-by-step instructions on how to fix the problem. Do not include tools or time estimates.`;
  }

  let instructions = "";
  try {
    const instructionResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: instructionPrompt }],
    });
    instructions = instructionResp.choices[0].message.content;
  } catch (err) {
    logger.warn("⚠️ Instruction writer failed:", err);
  }

  // 🛠️ 4️⃣ Tool Recommendation
  let toolSuggestions = "";
  try {
    const toolPrompt = `
  You are a helpful product recommendation assistant for DIY and repair projects.

  Only recommend products the user may not already have.
  Avoid suggesting common household tools like screwdrivers, scissors, duct tape, tape measure, or pliers.

  Project Context: ${issue}

  Instructions: ${instructions}

  Return a product suggestion for each specific tool or part needed, in this format:
  - [Tool Name]: [Suggested product or link]
  `;

    const toolResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: toolPrompt }],
    });

    toolSuggestions = toolResp.choices[0].message.content;
  } catch (err) {
    logger.warn("⚠️ Tool recommender failed:", err);
  }


  // 4️⃣ Store in Firestore
  try {
    await db.collection("problem_results").add({
      uid: context?.uid || null,
      object,
      issue,
      likelyCause,
      taskType,
      result: resultText,
      instructions,
      toolSuggestions,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.error("❌ Firestore write failed:", err);
  }

  return {
    success: true,
    object,
    issue,
    likelyCause,
    taskType,
    result: resultText,
    instructions,
    toolSuggestions,
  };
});
