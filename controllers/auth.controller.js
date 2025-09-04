import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if(user) return next(createError(400, "اسم المستخدم موجود بالفعل"));
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
    return next(createError(400, "البريد الإلكتروني مسجل بالفعل"));
    }
    const hash = bcryptjs.hashSync(req.body.password, 5);
    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save();
    res.status(201).send("User has been created.");
  } catch (err) {
    next(err);
  }

  
};
export const login = async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      return next(createError(400, "يجب إدخال اسم المستخدم وكلمة المرور"));
    }
    const user = await User.findOne({ username: req.body.username });

    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = bcryptjs.compareSync(req.body.password, user.password);
    if (!isCorrect)
      return next(createError(400, "Wrong password or username!"));

    const token = jwt.sign(
      {
        id: user._id,
        isSeller: user.isSeller,
      },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );

    const { password, ...info } = user._doc;
  
    // الإعدادات الصحيحة للكوكيز عبر النطاقات
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true, // مطلوب مع sameSite: "none"
      sameSite: "none", // يسمح بالنطاقات المختلفة
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
      path: "/",
      // لا تستخدم domain property - دع المتصفح يتعامل معها تلقائياً
    }).status(200).send(info);
    
  } catch (err) {
    next(err);
  }
};
export const mobileLogin = async (req , res , next)=>{
  try{
    if (!req.body.username || !req.body.password) {
      return next(createError(400, "يجب إدخال اسم المستخدم وكلمة المرور"));
    }
    const user = await User.findOne({username:req.body.username}) ;
    if(!user) return next(createError(404, "username not found"));
    const validPassword = bcryptjs.compareSync(req.body.password , user.password) ; 
    if(!validPassword) return next(createError(400, "Wrong password or username!"));

    const token = jwt.sign(
      {id:user._id , isSeller:user.isSeller},
      process.env.JWT_KEY,
      { expiresIn: '7d' } 
    );
    console.log(token) ;
    console.log(process.env.JWT_KEY) ;
    const {password , ...info} = user._doc ; 
    info.accessToken = token ; 
    res.status(200).json(info) ;
  
  }catch(err){
    next(err) ;
  }
}
export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out.");
};
export const mobileLogout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(createError(400, "لم يتم تقديم توكن"));
    }

    res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج بنجاح"
    });
    
  } catch (err) {
    next(err);
  }
};