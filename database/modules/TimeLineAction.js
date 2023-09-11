import connectMongo from '@/database/mongodb'
import TimeLine from './TimeLine'

connectMongo()

export async function createTimeLine(data) {
    try {
        const newTimeLine = TimeLine(data);

        await newTimeLine.save();

        return { ...newTimeLine._doc, _id: newTimeLine._id.toString()  };
    } catch (error) {
        throw new Error(error.message || 'Failed to create timeline')
    }
}