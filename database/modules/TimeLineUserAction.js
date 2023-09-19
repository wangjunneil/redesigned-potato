"use server";

import connectMongo from "@/database/mongodb";
import TimeLineUser from "./TimeLineUser";

connectMongo();

export async function findTimeUser(data) {
  try {
    return await TimeLineUser.findOne(data);
  } catch (error) {
    throw new Error(error.message || "Failed to create timeline user");
  }
}
