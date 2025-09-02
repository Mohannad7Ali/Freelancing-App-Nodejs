import createError from "../utils/createError.js";
import Request from "../models/request.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";

export const createRequest = async (req, res, next) => {
  if (!req.isSeller)
    return next(createError(403, "clients can't create a Request!"));

  try {
    // [1] تأكد إذا فيه طلب سابق لنفس المشروع
    const exists = await Request.findOne({
      projectId: req.body.projectId,
      userId: req.userId,
    });

    if (exists) {
      return next(createError(403, "You already created a Request for this project!"));
    }

    // [2] جيب بيانات المستخدم
    const user = await User.findById(req.userId);

    if (!user) return next(createError(404, "User not found!"));

    // [3] أنشئ الطلب
    const newRequest = new Request({
      userId: req.userId,
      projectId: req.body.projectId,
      desc: req.body.desc,
      budget: req.body.budget,
      userInfo: {
        username: user.username,
        img: user.img,
        country: user.country,
      },
    });

    const savedRequest = await newRequest.save();
    res.status(201).send(savedRequest);
  } catch (err) {
    next(err);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    // ✅ هلا الطلبات ترجع وفيها userId + userInfo
    const requests = await Request.find({ projectId: req.params.projectId });
    res.status(200).send(requests);
  } catch (err) {
    next(err);
  }
};

export const deleteRequest = async (req, res, next) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.status(200).send("request deleted successfully.");
  } catch (err) {
    next(err);
  }
};
