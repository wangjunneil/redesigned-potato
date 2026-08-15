import { Schema, model, models } from "mongoose";

const timeLineDataSchema = new Schema(
  {
    year: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    week: {
      type: String,
      required: true,
    },
    weather: {
      type: Schema.Types.Mixed,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "ENABLED",
      enum: ["ENABLED", "DISABLED"],
    },
    photos: {
      type: Array,
      set(imgs) {
        return imgs
          .filter((item) => item.status === "done")
          .map((item) => ({ src: `${process.env.CDN_DOMAIN}/${item.response.key}` }));
      },
    },
    creator: {
      type: String,
    },
    video: {
      type: String,
      default: "",
    },
    tags: {
      type: Array,
      default: [],
    },
    extends: {
      // Payload shape varies; `extends.geo` is the only shape currently used.
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const TimeLineData =
  models.timeLineData || model("timeLineData", timeLineDataSchema);
export default TimeLineData;
