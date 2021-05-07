const mongoose = require('mongoose')
const validator = require('validator')

const reminderSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
        trim : true,
        maxlength : 20
    },
    description : {
        type : String,
        default : 'No Description',
        trim : true,
        maxlength : 200
    },
    tags : [{type : String,trim : true}],
    scheduled_date: {
        type : Date,
        required :true,
        validate(value){
            let today = new Date()
            if (value.getTime() < (today.getTime()-120000)){
                throw new Error("Invalid Date.")
            }
        }
    },
    recurring_type:{
        type : String,
        trim : true,
        enum : ['daily', 'weekly', 'monthly', 'none'],
        default : 'none'
    },
    sent_status :{
        type : Boolean,
        default : false
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'users'
    }

},{
    timestamps : true
})

const Reminder = mongoose.model('reminders', reminderSchema)

module.exports.Reminder = Reminder