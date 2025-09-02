import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";

export const verifyToken = (req, res, next) => {
    //  محاولة الحصول على التوكن من مصدرين
  const token = req.cookies?.accessToken || 
                req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return next(createError(401,"You are not authenticated!"))


  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {   // check token validity 
    if (err) {
      let errorMessage = "توكن غير صالح";
      
      if (err.name === "TokenExpiredError") {
        errorMessage = "انتهت صلاحية التوكن، يلزم تسجيل الدخول مجدداً";
      } else if (err.name === "JsonWebTokenError") {
        errorMessage = "توكن مصادقة غير صحيح";
      }
      
      return next(createError(403, errorMessage));
    }
      //payload is useful information stored in token we extract it and use it
    req.userId = payload.id;      // if token is valid extracd payload from it and custmize your request to enable it go across middleware
    req.isSeller = payload.isSeller;
    req.body.userId = payload.id;
    next()
  });
};
