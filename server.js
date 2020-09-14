const express = require("express")
const app = express()
let http = require("http").Server(app)
const port = process.env.PORT || 3000
let io = require("socket.io")(http)

app.use(express.static("public"))

const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users")
const formatMessage = require("./utils/messages.js")
const { log } = require("console")

http.listen(port, () => {
  console.log("Listening on Port:",port)
  console.log("http://localhost:3000")
})

io.on("connection", (socket) => {

    socket.on("joinRoom", ({ username, room_name }) => {
        const user = userJoin(socket.id, username, room_name)
        socket.join(user.room)

        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        })

        socket.emit("message", formatMessage("WebRTC BOT", 'Welcome!'))

        console.log("-----CLIENT CONNECTED: " + socket.id + " TO ROOM: " + room_name)
    })

    socket.on("request_call", () => {
        const user = getCurrentUser(socket.id)

        console.log("-----REQUESTING: "+ socket.id)
        socket.to(user.room).emit("request_call", socket.id)
    })

    socket.on("response_call", (id) => {
        console.log(socket.id +" -----RESPONSING----- " + id) 
        socket.to(id).emit("response_call", socket.id)
    })
    
    socket .on("offer", (id, offer) => {
        console.log(socket.id +" -----OFFERING----- " + id) 
        socket.to(id).emit("offer", socket.id, offer)
    })

    socket.on("answer", (id, answer) => {
        console.log(socket.id +" -----ANSWERING----- " + id) 
        socket.to(id).emit("answer", socket.id, answer)
    })

    socket.on("ice", (id, ice) => {
        console.log(socket.id +" -----ICING----- " + id) 
        socket.to(id).emit("ice", socket.id, ice)
    })

    socket.on("chatMessage", msg => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    })

    socket.on("disconnect", () => {
        const user = userLeave(socket.id)
        if(user){
            io.to(user.room).emit("delete", {
                id: socket.id,
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }

        console.log("-----CLIENT DISCONNECTED: " + socket.id)
    })
})