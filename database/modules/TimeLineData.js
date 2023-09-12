import { Schema, model, models } from "mongoose";

const timeLineDataSchema = new Schema(
  {
    year: {
      type: String,
      require: true,
    },
    month: {
      type: String,
      require: true,
    },
    day: {
      type: String,
      require: true,
    },
    week: {
      type: String,
      require: true,
    },
    weather: {
      type: Schema.Types.Mixed,
    },
    content: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      require: true,
      default: "ENABLED",
      enum: ["ENABLED", "DISABLED"],
    },
    photos: {
      type: Array,
      set(imgs) {
        return imgs
          .filter((item) => item.status === "done")
          .map((item) => {
            return {
              src: `${process.env.CDN_DOMAIN}/${item.response.key}`,
              width: 1,
              height: 1,
            };
          });
      },
    },
    creator: {
      type: String,
    },
    video: {
      type: String,
    },
    tags: {
      type: Array,
    },
    extends: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const TimeLineData =
  models.timeLineData || model("timeLineData", timeLineDataSchema);
export default TimeLineData;
