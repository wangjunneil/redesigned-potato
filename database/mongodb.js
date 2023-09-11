import mongoose from "mongoose";
import { getSecretValue } from "@/utils";


async function connectMongo() {
    // if (mongoose.connections[0].readyState) {
    //     console.info('MongoDB is already connected');
    //     return
    // }


    const MONGODB_URL = await getSecretValue('MONGODB_URL');
    console.info('MONGODB_URL', MONGODB_URL);

    mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.info('MongoDB connected')
    }).catch(error => {
        console.errore(error);
    })
}

export default connectMongo;