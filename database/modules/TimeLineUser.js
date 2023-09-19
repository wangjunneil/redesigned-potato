import { Schema, model, models } from "mongoose";

const timeLineUserSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
    },
    jwt: {
      type: String,
      require: true,
    },
    extends: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const TimeLineUser =
  models?.timeLineUser || model("timeLineUser", timeLineUserSchema);
export default TimeLineUser;
