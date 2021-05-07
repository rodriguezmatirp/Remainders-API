const mongoose = require('mongoose')

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log('Connected to MongoDb Server')
}).catch((e) => {
    console.log('Error while attempting to connecting to mongodb')
    console.log(e)
})

module.exports = {
    mongoose
}