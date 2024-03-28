import mongoose, { Model, Schema } from "mongoose"

export interface IAIModel extends Document{
    title:string,
    Course:string,
    transcription:string
 }

 const aiSchema = new Schema<IAIModel>({
    title: {
        type:String,
        required:true
    },
    Course:{
        type:String,
        required:true,
    },
    transcription:{
        type:String,
        required:true,
    }
 })
export const AIModel :Model<IAIModel> = mongoose.model("ai",aiSchema,"ai");

