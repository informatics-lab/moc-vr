
// returns the hud canvas dom element
function createHUD(d) {
    console.log("creating HUD");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute("style", "border:black 1px solid");

    var ctx = canvas.getContext("2d");

    // ctx.fillStyle = "#000000";
    // ctx.fillRect(0, 0, width, height);

    drawCentreFocus(ctx);
    drawWindInstruments(ctx, d.windGust, d.windSpeed, d.windDirection);
    drawTempInstruments(ctx, d.temperature, d.dewPoint, d.visibility);

    return canvas;
}

function drawCentreFocus(ctx) {
    ctx.fillStyle = "#B9DC0C";          //mo green
    ctx.strokeStyle = "#B9DC0C";
    ctx.lineWidth = 2;

    //left
    ctx.fillRect(148, 180, 2, 320);     //focus left main spine
    ctx.fillRect(148, 178, 22, 2);      //top bar
    ctx.fillRect(148, 500, 22, 2);      //bottom bar

    //right
    ctx.fillRect(650, 180, 2, 320);     //focus right main spine
    ctx.fillRect(630, 178, 22, 2);      //top bar
    ctx.fillRect(630, 500, 22, 2);      //bottom bar
}

function drawWindInstruments(ctx, wg, ws, wd) {
    ctx.fillStyle = "#B9DC0C";          //mo green
    ctx.strokeStyle = "#B9DC0C";
    ctx.lineWidth = 2;
    ctx.font = "22px Arial";

    // ctx.fillText("WIND", 626, 95);

    //wind scale
    for (var i = 0; i < 20; i++) {
        ctx.fillRect(656, 178 + (i * 16), 2 * (10 - Math.sqrt(i) * 2), 2);
    }

    //wind direction scale
    var x = 653;
    var y = 135;
    var r = 30;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r * Math.cos(((Math.PI * 2) / 12) * 8)), y + (r * Math.sin(((Math.PI * 2) / 12) * 8)));
    ctx.arc(x, y, r, (2 * Math.PI) - ((2 * Math.PI)/12)*4, (2 * Math.PI) - ((2 * Math.PI)/12)*2, false);
    ctx.lineTo(x, y);
    ctx.stroke();

    drawHeading(ctx, x, y, r);
    // drawWindDirectionPointer(ctx, x, y, wd);
}

function drawTempInstruments(ctx, t, dp, v) {
    ctx.fillStyle = "#B9DC0C";          //mo green
    ctx.strokeStyle = "#B9DC0C";
    ctx.lineWidth = 2;
    ctx.font = "12px Arial";

    ctx.beginPath();
    ctx.moveTo(106, 189);    //centre
    ctx.lineTo(106, 179);
    ctx.lineTo(128, 179);
    ctx.lineTo(128, 189);

    ctx.moveTo(128, 491);
    ctx.lineTo(128, 501);
    ctx.lineTo(106, 501);
    ctx.lineTo(106, 491);
    ctx.stroke();

    var tr = getTempRange(179, 501, t, dp);

    var trMinX = 78;
    if (tr.min < 0) {
        trMinX = trMinX - 4;
    }
    ctx.fillText(pad(tr.min), trMinX, 501);
    ctx.fillText(pad(tr.max), 78, 188);

    drawTemp(ctx, tr.t);
    drawDewPoint(ctx, tr.dp);
    drawVisibility(ctx, v);
}

function drawWindDirectionPointer(ctx, cx, cy, wd) {
    var a = ((Math.PI * 2) / 360) * wd;

    var startX = cx + (35 * Math.cos(a));
    var startY = cy + (35 * Math.sin(a));

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    var leftX = startX + (20 * Math.cos(a - (Math.PI / 6)));
    var leftY = startY + (20 * Math.cos(a - (Math.PI / 6)));

    ctx.lineTo(leftX, leftY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    var rightX = startX + (20 * Math.cos(a + (Math.PI / 6)));
    var rightY = startY + (20 * Math.cos(a + (Math.PI / 6)));

    ctx.lineTo(rightX, rightY);
    ctx.stroke();

}

function drawHeading(ctx, x, y, r) {
    var spokeLength = 2;

    // ctx.beginPath();
    // ctx.arc(x, y, r, (2 * Math.PI) - ((2 * Math.PI)/12)*1, (2 * Math.PI) - ((2 * Math.PI)/12)*2, true);
    // ctx.stroke();

    //spokes
    for (var i = 0; i < 12; i++) {
        ctx.beginPath();

        var a = ((Math.PI * 2) / 12) * i;
        var xs = x + ((r - spokeLength) * Math.cos(a));
        var ys = y + ((r - spokeLength) * Math.sin(a));

        var xe = x + ((r + 2) * Math.cos(a));
        var ye = y + ((r + 2) * Math.sin(a));

        ctx.moveTo(xs, ys);    //centre
        ctx.lineTo(xe, ye);
        ctx.stroke();
    }
}

function drawTemp(ctx, t) {
    ctx.strokeStyle = "#E47452";
    ctx.fillStyle = "#E47452";
    ctx.font = "8px Arial";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(121, 500);
    ctx.lineTo(121, t.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(121, t.y, 3, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillText(pad(t.value), 126, t.y);
}

function drawDewPoint(ctx, dp) {
    ctx.strokeStyle = "#E47452";
    ctx.fillStyle = "#E47452";
    ctx.font = "8px Arial";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(113, 500);
    ctx.lineTo(113, dp.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(113, dp.y, 3, 0, 2 * Math.PI, false);
    ctx.fill();

    var xText = 93;
    if (dp.value < 0) {
        xText = xText - 3;
    }
    ctx.fillText(pad(dp.value), xText, dp.y);
}

function drawVisibility(ctx, v) {
    ctx.strokeStyle = "#E47452";
    ctx.fillStyle = "#E47452";
    ctx.font = "19px Arial";
    ctx.lineWidth = 2;

    ctx.fillText(v + "m", 104, 169);
}

function drawWindGust(ctx, wg) {
}

function getTempRange(top, bottom, t, dp) {
    var min, max, bottomValue, topValue;
    max = Math.max(t, dp);
    min = Math.min(t, dp);
    topValue = Math.ceil((Math.ceil(max) + 2) / 10) * 10;
    bottomValue = Math.floor((Math.floor(min) - 2) / 10) * 10;

    function map_range(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

    return {
        t: {
            value: t,
            y: map_range(t, topValue, bottomValue, top, bottom)
        },
        dp: {
            value: dp,
            y: map_range(dp, topValue, bottomValue, top, bottom)
        },
        min: bottomValue,
        max: topValue
    }

}

function pad(n) {
    var r;
    if (n >= 0) {
        r = n > 9 ? "" + n : "0" + n;

    } else {
        r = n < -9 ? "" + n : "-0" + Math.abs(n);
    }
    if (!r.includes(".")) {
        r = r + ".0";
    }
    return r;
}