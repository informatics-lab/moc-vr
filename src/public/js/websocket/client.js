// Or inline before the <a-scene>.
AFRAME.registerComponent('websocket-client', {
    schema: {
    },
    init: function () {
        var data = this.data;
        var el = this.el;
        var code = serverCode;
        if(!code) {
            code = prompt("Enter session code:");
            console.log(code);
        }

        var socket = io();
        socket.emit("register", {type:"client", code:code});

        socket.on("display", function(msg) {
            console.log("display",msg);
            document.getElementById("psky").setAttribute("src", msg.photosphere);
        });

    }
});