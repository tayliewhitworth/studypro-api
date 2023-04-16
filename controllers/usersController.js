const User = require("../model/User");
const Flashcard = require("../model/Flashcard");
const bcrypt = require("bcrypt");

// get all users
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
};

// post request
// create user

const createNewUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // hash password
  const hashedPwd = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashedPwd });
  if (user) {
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res
      .status(400)
      .json({ message: "Invalid user data recieved - end of function" });
  }
};

// Patch request
// update a user
const updateUser = async (req, res) => {
  const { id, username, password } = req.body;
  // confirm data
  if (!id || !username) {
    return res
      .status(400)
      .json({ message: "ID and username required to update" });
  }
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found " });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;

  if (password) {
    // hash password
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
};

// Delete method
// delete a user by id

const deleteUser = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const flaschard = await Flashcard.findOne({ createdBy: id }).lean().exec();
  if (flaschard) {
    return res.status(400).json({ message: "User has assigned Flashcards" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted.`;
  res.json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
