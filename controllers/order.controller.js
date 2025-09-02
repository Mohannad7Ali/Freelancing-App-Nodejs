import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";

export const getOrders = async (req, res, next) => {
  try {
    const query = req.isSeller 
      ? { sellerId: req.userId }
      : { buyerId: req.userId };
      console.log(query)
    const orders = await Order.find(query);

    if (!orders || orders.length === 0) {
      return res.status(200).send({
        success: true,
        message: "لا توجد طلبات متاحة"
      });
    }

    res.status(200).send({
      success: true,
      data: orders,
      count: orders.length
    });

  } catch (err) {
    console.error(`Error fetching orders: ${err.message}`);
    next(createError(500, "حدث خطأ أثناء جلب الطلبات"));
  }
};

export const intent = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "الخدمة غير موجودة"
      });
    }

    // التحقق من الصلاحيات
    if (gig.userId.toString() === req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "لا يمكن شراء خدمتك الخاصة"
      });
    }

    if (req.isSeller) {
      return res.status(403).json({
        success: false,
        message: "حسابك بائع لا يمكنك شراء الخدمات"
      });
    }

    // البحث عن طلب موجود
    const existingOrder = await Order.findOne({
      gigId: gig._id,
      buyerId: req.userId,
      isCompleted: false
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "لديك طلب قيد التنفيذ لهذه الخدمة بالفعل",
        existingOrderId: existingOrder._id,
        existingPaymentIntent: existingOrder.payment_intent
      });
    }

    // إنشاء نية دفع وهمية
    const mockPaymentIntent = {
      id: `mock_pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      client_secret: `mock_cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      amount: gig.price * 100,
      currency: "usd",
      status: "requires_payment_method"
    };

    // إنشاء طلب جديد
    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      buyerId: req.userId,
      sellerId: gig.userId,
      price: gig.price,
      payment_intent: mockPaymentIntent.id,
      isCompleted: false
    });

    await newOrder.save();

    // إرجاع البيانات مع تأكيد الحفظ
    return res.status(201).json({
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      payment_intent: mockPaymentIntent.id,
      amount: gig.price,
      currency: "USD",
      mockPayment: true,
      orderId: newOrder._id,
      message: "تم إنشاء طلب الدفع بنجاح"
    });

  } catch (err) {
    console.error(`خطأ في إنشاء نية الدفع: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء نية الدفع",
      error: err.message
    });
  }
};

export const confirm = async (req, res, next) => {
  try {
    // 1. التحقق من وجود payment_intent
    if (!req.body.payment_intent) {
      return res.status(400).json({
        success: false,
        message: "معرف عملية الدفع مطلوب",
        errorCode: "MISSING_PAYMENT_INTENT"
      });
    }

    // 2. البحث والتحديث في عملية واحدة
    const order = await Order.findOneAndUpdate(
      { 
        payment_intent: req.body.payment_intent,
        isCompleted: false // التأكد من تحديث الطلبات غير المكتملة فقط
      },
      { 
        $set: { 
          isCompleted: true,
          completedAt: new Date() // إضافة وقت الإكمال
        } 
      },
      { 
        new: true, // إرجاع النسخة المحدثة
        runValidators: true // تشغيل عمليات التحقق
      }
    );

    // 3. إذا لم يتم العثور على الطلب
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على طلب قيد التنفيذ بهذا المعرف",
        errorCode: "ORDER_NOT_FOUND",
        payment_intent: req.body.payment_intent
      });
    }

    // 4. إرجاع النجاح مع بيانات كاملة
    res.status(200).json({
      success: true,
      message: "تم تأكيد الطلب بنجاح",
      orderId: order._id,
      isCompleted: order.isCompleted,
      completedAt: order.completedAt,
      orderDetails: {
        title: order.title,
        price: order.price,
        sellerId: order.sellerId
      }
    });

  } catch (err) {
    console.error(`خطأ في تأكيد الطلب: ${err.message}`, {
      payment_intent: req.body?.payment_intent,
      stack: err.stack
    });
    
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تأكيد الطلب",
      error: err.message,
      errorCode: "SERVER_ERROR"
    });
  }
};