"use server";

import connectMongo from "@/database/mongodb";
import { PAGE_SIZE } from "@/utils";
import TimeLineData from "./TimeLineData";

export async function createTimeLine(data) {
  await connectMongo();
  try {
    if (!data || !data.content || !data.year || !data.month || !data.day) {
      throw new Error("Missing required fields: content, year, month, day");
    }
    const newTimeLine = TimeLineData(data);

    await newTimeLine.save();

    return { ...newTimeLine._doc, _id: newTimeLine._id.toString() };
  } catch (error) {
    throw new Error(error.message || "Failed to create timeline");
  }
}

export async function queryTimeLineAll({ status, year, lastId = null, limit = PAGE_SIZE } = {}) {
  await connectMongo();
  try {
    const query = {};
    if (status) query.status = status;
    if (year) query.year = year;
    if (lastId) query._id = { $lt: lastId };
    const timelines = await TimeLineData.find(query).sort({ _id: -1 }).limit(limit);

    const newData = timelines.map((post) => ({ ...post._doc, _id: post._doc._id.toString() }));

    return newData;
  } catch (error) {
    throw new Error(error.message || "Failed to query timeline");
  }
}

export async function enumTimeLineYear() {
  await connectMongo();
  try {
    const years = await TimeLineData.distinct("year");
    years.sort((a, b) => b - a);
    return years.map((year) => {
      return {
        label: year,
        value: year,
      };
    });
  } catch (error) {
    throw new Error(error.message || "Failed to query enumTimeLineYear");
  }
}

export async function deleteTimeLine(condition) {
  await connectMongo();
  try {
    if (!condition?._id) throw new Error("Missing _id for delete");
    await TimeLineData.deleteOne({ _id: condition._id });
  } catch (error) {
    throw new Error(error.message || "Failed to delete timeline");
  }
}
