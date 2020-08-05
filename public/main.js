const local = document.getElementById("local")
const div = document.getElementById("videos")

const call = document.getElementById("call")
const recieve = document.getElementById("recieve")

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
    video : true,
    audio : false
}

function getLocalMedia(){
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        console.log("Got MediaStream:", stream)
        local.srcObject = stream
        localStream = stream
    })
    .catch(err => {
        console.log("Error : ", err)
    })
}

call.onclick = () => {
    call.setAttribute("value", "Calling...")
    socket.emit("request_call")
}

socket.on("request_call", (id) => {

    console.log("Receiving : ", id)

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
        console.log("Connected : ", id)
        makePeerLocal(id)
    }
})

function makePeer(id){
    peer[id] = new RTCPeerConnection(config)

    peer[id].addStream(localStream)

    if(document.getElementById("videos").getElementsByTagName("video").length == 1){
        alert(document.getElementById("videos").getElementsByTagName("video").length)
        document.getElementById("videos").style.gridTemplateColumns = "50% 50%"
    }
    else if(document.getElementById("videos").getElementsByTagName("video").length == 2){
        alert(document.getElementById("videos").getElementsByTagName("video").length)
        document.getElementById("videos").style.gridTemplateColumns = "33% 33% 33%"
    }
    
    var remote = document.createElement("video")
    remote.setAttribute("id", id)
    remote.setAttribute("autoplay", true)
    div.appendChild(remote)

    peer[id].ontrack = (event) => {
        console.log("Getting Remote Stream...")
        remote.srcObject = event.streams[0]
    }

    peer[id].onconnectionstatechange = (event) => {

        if(peer[id].connectionstate === "connected"){
            console.log("Peer connected: ", id)  
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

    console.log("Got ICE Candidate")
    peer[id].addIceCandidate(new RTCIceCandidate(ice))
})

socket.on("delete", (id) => {
    var elem = document.getElementById(id)
    elem.remove()
})