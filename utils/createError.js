const createError = (status, message) => {
  const err = new Error();
  err.status = status || 500 ;
  err.message = message || 'خطأ غير متوقع';

  return err;
};

export default createError;
