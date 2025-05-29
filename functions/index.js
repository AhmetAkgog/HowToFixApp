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
  const context = request?.context;

  const openai = new OpenAI({ apiKey: openaiApiKey.value() });

  const data = request.data;
  const { base64Image, textDescription } = data;

  if (!base64Image) {
    throw new Error("Image is required");
  }

  // 1️⃣ Problem Understanding
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
        {
          type: "text",
          text: textDescription ||
            "Please identify the object and either the problem OR the project intention. Format output like: Object: <...>\nIssue or Intent: <...>",
        },
      ],
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

  // 4️⃣ Store in Firestore
  try {
    await db.collection("problem_results").add({
      uid: context?.auth?.uid || null,
      object,
      issue,
      likelyCause,
      taskType,
      result: resultText,
      instructions,
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
  };
});
