"use server";

import connectMongo from "@/database/mongodb";
import { PAGE_SIZE } from "@/utils";
import TimeLineData from "./TimeLineData";
import { insertTimeLine } from "./timeLineRepository";

export async function createTimeLine(data) {
  try {
    return await insertTimeLine(data);
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
