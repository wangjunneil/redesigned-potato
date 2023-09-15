"use server";

import connectMongo from "@/database/mongodb";
import User from "./User";

connectMongo();

export async function createUser(data) {
  try {
    const newUser = User(data);

    await newUser.save();

    return { ...newUser._doc, _id: newUser._id.toString() };
  } catch (error) {
    throw new Error(error.message || "Failed to create user");
  }
}
