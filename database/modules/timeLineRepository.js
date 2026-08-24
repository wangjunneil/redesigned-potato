import connectMongo from "@/database/mongodb";
import TimeLineData from "./TimeLineData";

export async function insertTimeLine(data) {
  await connectMongo();
  if (!data || !data.content || !data.year || !data.month || !data.day) {
    throw new Error("Missing required fields: content, year, month, day");
  }
  const newTimeLine = TimeLineData(data);
  await newTimeLine.save();
  return { ...newTimeLine._doc, _id: newTimeLine._id.toString() };
}
