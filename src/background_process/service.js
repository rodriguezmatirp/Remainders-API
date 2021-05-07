const nodemailer = require('nodemailer')
require('../db/mongoose')
const {User} = require("../db/models/user");
const {Reminder} = require("../db/models/reminder");

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

class ParentHandler{
    constructor () {
        this.timeout = 60000
        this.reminders = []
        this.transporter = undefined
    }

    handler = async()=>{
        this.transporter = nodemailer.createTransport({
            service: "Gmail",
            secure: false,
            auth: {
              user: process.env.ACCOUNT_ADDR,
              pass: process.env.ACCOUNT_PWD,
            },
        });
        while (true){
            try{
                await snooze(this.timeout)
                await this.get_reminders()
            }catch (err) {
                console.log(err)
                break
            }
        }
        console.log('Child process stopped due to error!')
    }

    get_reminders = async()=>{
        let now = new Date()
        this.reminders = await Reminder.find({sent_status : false, scheduled_date : {$lte : now}})
        if(this.reminders){
            await this.send_reminder().catch((err)=>{
                throw new Error(err)
            })
        }
    }

    send_reminder = async()=> {
        console.log('Here')
        console.log(this.reminders)
        for (let reminder of this.reminders) {
            let user = await User.findById(reminder.userId)

            let tags = ''
            for (let tag of reminder.tags)
                tags += ' ' + tag
            if (tags === '')
                tags = 'None'

            let info = await this.transporter.sendMail({
                from: `"Quinch Remainder"<${process.env.ACCOUNT_ADDR}>`,
                to: user.email,
                subject: `Reminder for your task scheduled - ${reminder.title}`,
                html: `<b>Hello ${user.name},</b>
                       <p>Greetings!</p>
                       <p>Just a reminder which is scheduled at - ${reminder.scheduled_date}</p>
                       <b>${reminder.description}</b>
                       <p>Tags : ${tags}</p>`,
            });
            reminder.sent_status = true
            try{
                await reminder.save()
                console.log("Message sent: %s", info.messageId);
                if (reminder.recurring_type !== 'none')
                    await this.schedule_next(reminder)
            }catch (err){
                throw new Error(err)
            }
        }
    }

    schedule_next = async (reminder)=> {
        let next = new Reminder({
            title : reminder.title,
            description : reminder.description,
            tags : reminder.tags,
            recurring_type : reminder.recurring_type,
            userId : reminder.userId
        })
        if(reminder.recurring_type === 'daily')
            next.scheduled_date = reminder.scheduled_date.getTime() + 24*60*60*1000
        else if(reminder.recurring_type === 'weekly')
            next.scheduled_date = reminder.scheduled_date.getTime() + 7*24*60*60*1000
        else if(reminder.recurring_type === 'monthly'){
            let date = reminder.scheduled_date
            next.scheduled_date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
        }
        try{
            await next.save()
            console.log(`Reminder saved - type ${reminder.recurring_type}`)
        }catch (err){
            throw new Error(err)
        }
    }
}

parent_handler = new ParentHandler()

process.on('message',(async (message) => {
    if (message === 'start'){
        await parent_handler.handler()
        process.send('Started')
    }
}))