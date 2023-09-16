// "use server";

// import connectMongo from '@/database/mongodb'
// import TimeLineData from './TimeLineData'

// connectMongo()

// export async function createTimeLine(data) {
//     try {
//         const newTimeLine = TimeLineData(data);

//         await newTimeLine.save();

//         return { ...newTimeLine._doc, _id: newTimeLine._id.toString()  };
//     } catch (error) {
//         throw new Error(error.message || 'Failed to create timeline')
//     }
// }

// export async function queryTimeLineAll(condition = null) {
//     try {
//         const timelines = await TimeLineData.find(condition).sort({_id: -1}).limit(30);

//         // id 转字符串
//         const newData = timelines.map(post => (
//             {
//                 ...post._doc,
//                 _id: post._doc._id.toString()
//             }
//         ));

//         return newData;
//     } catch (error) {
//         throw new Error(error.message || 'Failed to query timeline')
//     }
// }

// export async function enumTimeLineYear() {
//     try {
//         const years = await TimeLineData.distinct('year');
//         return years.map(year => {
//             return {
//                 label: year,
//                 value: year
//             }
//         });
//     } catch (error) {
//         throw new Error(error.message || 'Failed to query enumTimeLineYear')
//     }
// }

// export async function deleteTimeLine(condition) {
//     try {
//         await TimeLineData.deleteOne(condition);
//     } catch (error) {
//         throw new Error(error.message || 'Failed to delete timeline')
//     }
// }

// export async function updateTimeLine(condition, data) {
//     try {
//         await TimeLineData.updateOne(condition, data);
//     } catch (error) {
//         throw new Error(error.message || 'Failed to update timeline')
//     }
// }
