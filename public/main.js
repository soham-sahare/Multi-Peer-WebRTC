const local = document.getElementById("local")
const div = document.getElementById("videos")

const call = document.getElementById("call")
const recieve = document.getElementById("recieve")
const mute = document.getElementById("mute")
const unmute = document.getElementById("unmute")

var localStream = null
var peer = []

const socket = io.connect(location.origin)

const config = {
    "iceServers": [
        {'urls' : "stun:stun.stunprotocol.org:3478"},
        {'urls' : "stun:stun.l.google.com:19302"}
    ]
}

const constraints = {
    video : {
        width: 300,
        height: 200,
        frameRate: { max: 60 }
    },
    audio: {
        sampleRate: 48000,
        channelCount: 2,
        volume: 1.0,
        echoCancellation: true
    }
}

function getLocalMedia(){
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        local.srcObject = stream
        localStream = stream
    })
    .catch(err => {
        console.log("Error : ", err)
    })
    mute.style.display = "block"
}

call.onclick = () => {
    call.setAttribute("value", "Calling...")
    socket.emit("request_call")
}

socket.on("request_call", (id) => {

    receive.removeAttribute("disabled")
    receive.setAttribute("value", "Receiving Call")

    receive.onclick = () => {
        receive.setAttribute("value", "Connecting...")
        socket.emit("response_call", id)
        makePeer(id)
    }
})

socket.on("response_call", (id) => {

    if(peer[id] == null){
        makePeerLocal(id)
    }
})

function makePeer(id){
    peer[id] = new RTCPeerConnection(config)

    peer[id].addStream(localStream)

    var remote = document.createElement("video")
    remote.setAttribute("id", id)
    remote.setAttribute("autoplay", true)
    div.appendChild(remote)

    peer[id].ontrack = (event) => {
        remote.srcObject = event.streams[0]
    }

    peer[id].onconnectionstatechange = (event) => {

        if(peer[id].connectionstate === "connected"){
            console.log("WebRTC Connection Successfull")  
        }
        call.setAttribute("hidden", true)
        receive.setAttribute("value", "Connected")
    }
}

async function makePeerLocal(id){
    makePeer(id)

    const offer = await peer[id].createOffer()
    await peer[id].setLocalDescription(offer)

    socket.emit("offer", id, offer)

    peer[id].onicecandidate = (event) => {

        if(event.candidate){
            socket.emit("ice", id, event.candidate)
        }
    }
}

socket.on("offer", async function(id, offer){

    if(peer[id] != null){
        await peer[id].setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peer[id].createAnswer()
        await peer[id].setLocalDescription(answer)
        socket.emit("answer", id, answer)        
    }
})

socket.on("answer", (id, answer) => {

    if(peer[id] != null){
        peer[id].setRemoteDescription(new RTCSessionDescription(answer))
    }
})

socket.on("ice", (id, ice) => {
    peer[id].addIceCandidate(new RTCIceCandidate(ice))
})

socket.on("delete", (id) => {
    var elem = document.getElementById(id)
    elem.remove()
})

socket.on("full", (id) => {
    alert("Full")
})

mute.onclick = () => {
    mute.style.display = "none"
    unmute.style.display = "block"
    socket.emit("mute")
}

unmute.onclick = () => {
    unmute.style.display = "none"
    mute.style.display = "block"
    socket.emit("unmute")
}

socket.on("mute", (id) => {
    localStream.getAudioTracks()[0].enabled = false
})

socket.on("unmute", (id) => {
    localStream.getAudioTracks()[0].enabled = true
})