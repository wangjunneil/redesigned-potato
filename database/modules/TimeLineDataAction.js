"use server";

import connectMongo from "@/database/mongodb";
import { PAGE_SIZE } from "@/utils";
import TimeLineData from "./TimeLineData";
import { insertTimeLine } from "./timeLineRepository";
import { deleteQiniuFile, extractKeyFromSrc } from "@/lib/qiniu";

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
    // 删除前先清理七牛上的媒体文件（尽力而为，失败不阻断删库）
    const record = await TimeLineData.findById(condition._id);
    if (record?.photos?.length) {
      for (const photo of record.photos) {
        const key = photo?.src ? extractKeyFromSrc(photo.src) : null;
        if (key) {
          try {
            await deleteQiniuFile(key);
          } catch (e) {
            console.error("删除七牛文件失败:", key, e);
          }
        }
      }
    }
    await TimeLineData.deleteOne({ _id: condition._id });
  } catch (error) {
    throw new Error(error.message || "Failed to delete timeline");
  }
}
