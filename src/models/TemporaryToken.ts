import mongoose from "mongoose";

const TemporaryTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true, // Encrypted token containing email and password
  },
  verificationCode: {
    type: String,
    required: true, // Code sent to the user for verification
  },
  verificationCodeExpiry: {
    type: Date,
    required: true, // Expiry time for the verification code
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation time
    expires: 900, // Automatically delete the document after 15 minutes (900 seconds)
  },
});

const TemporaryToken =
  mongoose.models.TemporaryToken ||
  mongoose.model("TemporaryToken", TemporaryTokenSchema);

export default TemporaryToken;
