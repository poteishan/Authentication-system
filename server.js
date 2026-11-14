import app from "./src/app.js"
// import config from "./src/config/config.js"
import connectDB from "./src/config/db.js";

connectDB();

app.listen(3000, ()=>{
    console.log("Serer running on 3000");
})
