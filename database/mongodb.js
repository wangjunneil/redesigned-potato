import mongoose from "mongoose";
// import { getSecretValue } from "@/services";

async function connectMongo() {
  // const MONGODB_URL = await getSecretValue("MONGODB_URL");
  const MONGODB_URL = process.env.MONGODB_URL;

  mongoose
    .connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.info("MongoDB connected");
    })
    .catch((error) => {
      console.error(error);
    });
}

export default connectMongo;
