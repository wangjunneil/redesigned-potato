"use server";

import connectMongo from '@/database/mongodb'
import TimeLineData from './TimeLineData'

connectMongo()

export async function createTimeLine(data) {
    try {
        const newTimeLine = TimeLineData(data);

        await newTimeLine.save();

        return { ...newTimeLine._doc, _id: newTimeLine._id.toString()  };
    } catch (error) {
        throw new Error(error.message || 'Failed to create timeline')
    }
}