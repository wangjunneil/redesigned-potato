import { Schema, model, models } from "mongoose";

const timeLineSchema = new Schema({
    createtime: {
        type: Date,
        default: Date.now,
        require: true
    },
    content: {
        type: String,
        require: true
    },
    status: {
        type: String,
        require: true,
        default: 'ENABLED',
        enum: ['ENABLED', 'DISABLED']
    },
    photos: {
        type: Array,
        set(imgs) {
            return imgs.filter(item => item.status === 'done').map(item => {
                return `https://fla.cdn.bosyun.com/${item.response.key}`
            })
        }
    },
    extends: {
        type: String
    }
}, { timestamps: true });

const TimeLine = model('timeLine', timeLineSchema);
export default TimeLine