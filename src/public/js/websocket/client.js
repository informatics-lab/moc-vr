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
            document.getElementById("camera").setAttribute("rotation", msg);
        });

    }
});