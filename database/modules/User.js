import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
    },
    jwt: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

const User = models.user || model("user", userSchema);
export default User;
