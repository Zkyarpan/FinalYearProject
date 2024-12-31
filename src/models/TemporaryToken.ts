import mongoose from "mongoose";

const TemporaryTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true, 
  },
  token: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  verificationCodeExpiry: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, 
  },
});


const TemporaryToken =
  mongoose.models.TemporaryToken ||
  mongoose.model("TemporaryToken", TemporaryTokenSchema);

export default TemporaryToken;
