import User from "../models/user.model.js";
import createError from "../utils/createError.js";

export const deleteUser = async (req, res, next) => {
  const user = await User.findById(req.userId); // get user that you want to delete


  //to string because id in db is objectid not
  if (req.userId !== user._id.toString()) { // if user try to delete another account not his account prevent him
    return next(createError(403, "You can delete only your account!"));
  }
  await User.findByIdAndDelete(req.userId);
  res.status(200).send("user deleted successfully.");
};

// Update user
export const updateUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "You can update only your account!"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};



export const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if(!user) return next(createError(404 , "user not found"));
  res.status(200).send(user);
};
