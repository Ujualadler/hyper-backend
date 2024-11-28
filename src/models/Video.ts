import mongoose, { mongo, Schema } from 'mongoose';

interface IChapter {
  title: string;
  startTime: number;
  endTime: number;
  image?: string;
}

interface IVideo {
    id: string;
    url: string;
    chapters: IChapter[];
}

export type VideoDocument = Document & {
    id: string;
    url: string;
    chapters: IChapter[];
    name: string;
}

const VideoSchema = new Schema<VideoDocument>({
    id: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    chapters: [{
        title: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        image: { type: String, required: false },
    }]
}, { collection: 'Video' });

const Video = mongoose.model<VideoDocument>("Video", VideoSchema);

export default Video;