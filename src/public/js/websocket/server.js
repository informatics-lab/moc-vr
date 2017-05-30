var serverCode = null;

function genServerCode() {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);
}

(function () {
    console.log("loading");
    serverCode = genServerCode();

    var socket = io();
    socket.emit("register", {type: "server", code: serverCode});

    document.getElementById("sid").innerHTML = serverCode;

    document.getElementById("serve").addEventListener("click", function () {
        var pid = document.getElementById("pid").value;
        console.log("serving %s", pid);
        socket.emit("serve", {id: pid});
    });

})();