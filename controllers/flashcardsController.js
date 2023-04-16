const Flashcard = require("../model/Flashcard");
const Topic = require("../model/Topic");
const User = require("../model/User");
const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);
// Get Flashcard
// route - /flashcard

const getAllFlashcards = async (req, res) => {
  const flashcards = await Flashcard.find().lean();
  if (!flashcards?.length) {
    return res.status(400).json({ message: "No Flashcards found" });
  }
  // add the username and the topic name to each note
  const flashcardsWithTopic = await Promise.all(
    flashcards.map(async (flashcard) => {
      const topic = await Topic.findById(flashcard.topic).lean().exec();
      const createdBy = await User.findById(flashcard.createdBy).lean().exec();
      if (createdBy) {
        return {
          ...flashcard,
          topicName: topic.topicName,
          username: createdBy.username,
        };
      } else {
        return { ...flashcard, topicName: topic.topicName };
      }
    })
  );

  res.json(flashcardsWithTopic);
};

// POST creating a single flashcard
// route /flashcard
const createNewFlashcard = async (req, res) => {
  const { topic, question, answer, createdBy } = req.body;
  if (!topic || !question || !answer) {
    return res
      .status(400)
      .json({ message: "Please enter a topic, question and answer" });
  }

  let newTopic = await Topic.findOne({ topicName: topic });
  if (!newTopic) {
    newTopic = new Topic({ topicName: topic });
    await newTopic.save();
  }
  const flashcard = new Flashcard({ topic: newTopic._id, question, answer });

  newTopic.flashcards.push(flashcard._id);
  await newTopic.save();

  let user = await User.findOne({ username: createdBy });
  if (user) {
    flashcard.createdBy = user._id;
    user.flashcards.push(flashcard._id);
    await user.save();
  }
  await flashcard.save();

  if (flashcard) {
    return res.status(201).json({ message: "Flashcard created" });
  } else {
    return res
      .status(400)
      .json({
        message: "Invalid flashcard note data recieved - end of function error",
      });
  }
};

// creating multiple flashcards at once with AI
const generateFlashcards = async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Please enter a topic" });
  }

  const prompt = `Create 10 random question and answer about ${topic}.`;
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const questionAnswerRegex = /^Question:\s+(.*)\s+Answer:\s+(.*)$/;
  const numberAnswerRegex = /^(\d+)\.\s+(.*)$/;

  const content = response.data.choices[0].message.content;
  const lines = content.split("\n");
  const flashcards = [];

  for (let line of lines) {
    let match = line.match(questionAnswerRegex)
    if(match !== null) {
        const question = match[1]
        const answer = match[2]
        flashcards.push({ question, answer })
        continue
    }

    match = line.match(numberAnswerRegex)
    if (match !== null) {
        const question = match[2]
        const answer = lines[lines.indexOf(line) + 1]
        flashcards.push({ question, answer })
    }

  }

  if (flashcards) {
    return res.json({flashcards});
  } else {
    return res
      .status(400)
      .json({ message: "Something went wrong with the request!" });
  }
};

// updating a flashcard by id
// patch method

const updateFlashcard = async (req, res) => {
  const { id, topic, question, answer, createdBy, reviewDate, interval } = req.body;
  if (!topic || !question || !answer) {
    return res
      .status(400)
      .json({ message: "When updating include topic, question and answer" });
  }

  const duplicate = await Flashcard.findOne({ question }).lean().exec();
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate flashcard question" });
  }

  let topicUpdate = await Topic.findOne({ topicName: topic });
  if (!topicUpdate) {
    topicUpdate = new Topic({ topicName: topic });
    await topicUpdate.save();
  }

  let user = await User.findOne({ username: createdBy })

  const flashcard = await Flashcard.findByIdAndUpdate(
    id,
    { topic: topicUpdate._id, question, answer, createdBy: user._id, reviewDate, interval },
    { new: true }
  );

  topicUpdate.flashcards.push(flashcard._id);
  await topicUpdate.save();

  res.json({ message: `${flashcard.id} updated` });
};

// delete flashcard by id
// delete method

const deleteFlashcard = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Flashcard ID required" });
  }
  const flashcard = await Flashcard.findByIdAndDelete(id);
  const topic = await Topic.findByIdAndUpdate(flashcard.topic, {
    $pull: { flashcards: id },
  });
  res.json({
    message: `${flashcard.question} in topic: ${topic.topicName} deleted`,
  });
};

module.exports = {
  getAllFlashcards,
  createNewFlashcard,
  generateFlashcards,
  updateFlashcard,
  deleteFlashcard,
};
