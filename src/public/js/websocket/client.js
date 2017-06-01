"use strict";

AFRAME.registerComponent('websocket-client', {
    schema: {},
    init: function () {
        var self = this;
        var code;

        if (!code) {
            code = prompt("Enter session code:");
            console.log(code);
        }

        var socket = io();
        socket.emit("register", {type: "client", code: code});

        socket.on("display", displayPhotosphere);

        socket.on("sync-client", function (msg) {
            //do something with rotation info here
            console.log(msg);
            var rot = msg.rotation;
            var pos = msg.position;

            var serverCamera = document.getElementById('serverCamera');
            serverCamera.setAttribute('rotation', rot);
            serverCamera.setAttribute('position', pos);
            console.log(msg);
        });

    }
});
