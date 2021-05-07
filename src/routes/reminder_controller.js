const express = require("express");
const child_process = require('child_process')
const mongoose = require('mongoose')
const {Reminder} = require("../db/models/reminder");

const {authenticate} = require('../middlewares/auth');

const reminderRoute = new express.Router();

background_process = child_process.fork('./src/background_process/service.js')
background_process.send('start')
background_process.on('message',(message => {
    console.log(message)
}))

reminderRoute.get('/', authenticate, async(req, res)=>{
    try{
        let reminders = await Reminder.find({userId : req.user_id, sent_status : false})
        res.status(200).send(reminders)
    }catch (err){
        console.log(err)
        res.status(404).send({"Message" : err})
    }
})

reminderRoute.get('/:id', authenticate, async (req,res)=>{
    try{
        if(typeof(req.params.id) === typeof(mongoose.Schema.Types.ObjectId)){
            let reminder = await Reminder.findOne({_id : req.params.id, userId : req.user_id})
            res.status(200).send(reminder)
        }else{
            res.status(400).send({"Message" : "Provide valid object id"})
        }
    }catch (err){
        console.log(err)
        res.status(404).send({"Message" : err})
    }
})

reminderRoute.post('/new', authenticate, async(req, res)=>{
    let reminder = req.body
    let newReminder = new Reminder({
        title : reminder.title,
        description : reminder.description,
        tags : reminder.tags,
        scheduled_date : reminder.scheduled_date,
        recurring_type : reminder.recurring_type,
        userId : req.user_id
    })
    await newReminder.save().then(()=>{
        res.status(200).send({"Reminder Name" : newReminder.title, "Scheduled on" : newReminder.scheduled_date ,"Type" : reminder.recurring_type,"Status" : "Saved in DB"})
    }).catch((err)=>{
        return res.status(404).send({"Error" : err})
    })
})

reminderRoute.patch('/modify/:rid', authenticate, async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'tags', 'scheduled_date', 'scheduled_time', 'title', 'recurring_type']
    const isValid = updates.every((update) => allowedUpdates.includes(update))

    if (!isValid) {
        return res.status(400).send({ error: 'Invalid updates !!' })
    }
    try {
        const reminder = await Reminder.findOne({ _id: req.params.rid, userId: req.user_id })
        if (!reminder) {
            res.status(404).send()
        }
        updates.forEach((update) => reminder[update] = req.body[update])
        await reminder.save()
        res.send({"Title" : reminder.title, "Status" : "Updated reminder!"})
    } catch (e) {
        res.status(500).send(e)
    }
})

reminderRoute.delete('/remove/:rid',authenticate,async(req,res)=>{
     try {
        const reminder = await Reminder.findOneAndDelete({ _id: req.params.rid, userId: req.user_id })
        if (!reminder) {
            return res.status(404).send({"Error" : "Provide valid ID"})
        }
        res.send({"Title" : reminder.title, "Status" : "Deleted reminder!"})
    } catch (e) {
        res.status(500).send({"Error" : e})
    }
})

module.exports.reminderRoute = reminderRoute;