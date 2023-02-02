import mongoose from "mongoose";
import app from './app.js'
import config from "./config/index";

(async() => {
    try {
        await mongoose.connect(config.MONGODB_URL);
        console.log("DB Connected");

        app.on('error', (err) => {
            console.log("Error: ", err);
            throw err;
        })

        const onListening = () => console.log(`Listening on port ${config.PORT}`);

        app.listen(config.PORT, onListening);
    } catch (err) {
        console.log("Error: ", err);
        throw err;
    }
})()