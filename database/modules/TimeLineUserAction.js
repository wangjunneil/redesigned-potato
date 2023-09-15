// "use server";

// import connectMongo from "@/database/mongodb";
// import TimeLineUser from "./TimeLineUser";

// // connectMongo();

// export async function insertOne(data) {
//   try {
//     const newUser = User(data);

//     await newUser.save();

//     return { ...newUser._doc, _id: newUser._id.toString() };
//   } catch (error) {
//     throw new Error(error.message || "Failed to create user");
//   }
// }

// export async function findOne(condition) {
//   try {
//     return await TimeLineUser.findOne(condition);
//   } catch (error) {
//     throw new Error(error.message || "Failed to query user");
//   }
// }
