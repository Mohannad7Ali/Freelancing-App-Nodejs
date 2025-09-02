import mongoose from "mongoose";
const { Schema } = mongoose;

const RequestSchema = new Schema(
  {
    projectId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
      userInfo: {
      username: { type: String },
      img: { type: String },
      country: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Request", RequestSchema);
