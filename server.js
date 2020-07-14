const express = require("express")
const app = express()
let http = require("http").Server(app)
const port = process.env.PORT || 3000
let io = require("socket.io")(http)

app.use(express.static("public"))

http.listen(port, () => {
  console.log("Listening on Port :",port)
  console.log("http://localhost:3000")
})

io.on("connection", (socket) => {

    console.log("Client connected : " + socket.id);

    socket.on("reqCall", ()=> {
        console.log("Requesting : "+ socket.id)            
        socket.broadcast.emit("reqCall", socket.id)
    })

    socket.on("resCall", (id) => {
        console.log(socket.id +": Responsing: to" + id);
        socket.to(id).emit("resCall", socket.id)
    })
    
    socket .on("offer", (id, offer) => {
        console.log(socket.id +": offering: to" + id);
        socket.to(id).emit("offer", socket.id, offer)
    })

    socket.on("answer", (id, answer) => {
        console.log(socket.id +": answering: to" + id);
        socket.to(id).emit("answer", socket.id, answer)
    })

    socket.on("ice", (id, ice) => {
        console.log(socket.id +": icing: to" + id);
        socket.to(id).emit("ice", socket.id, ice)
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected : ", socket.id)
    })
})