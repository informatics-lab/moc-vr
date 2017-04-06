"use strict";

var express = require("express"),
    fileUpload = require("../lib/index.js"),
    app = express();
var engine = require("express-dot-engine");
var proxy = require('express-http-proxy');
var path = require("path");
var uuid = require("node-uuid");
var dataService = require("./mocvr-data-service");
var users = require("./users");

//set doT to render our view templates
app.engine('dot', engine.__express);
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'dot');
app.use(fileUpload());
app.use(express.static(__dirname + "/public"));
app.use('/img/', proxy('moc-vr.s3-eu-west-1.amazonaws.com/', {
    decorateRequest: function (proxyReq, originalReq) {
        proxyReq.headers["Authorization"] = "";
        proxyReq.headers["Cookie"] = "";
        proxyReq.headers["Access-Control-Request-Method"] = "GET";
        proxyReq.method = "GET";
        return proxyReq;
    }
}));


//view endpoints
app.get("/", function (req, res) {

    dataService.listTags()
        .then(function (data) {
            var allTags = [];
            data.Items.forEach(function (item) {
                item.tags.SS.forEach(function (tag) {
                    allTags.push(tag);
                })
            });
            var tags = {};
            for (var i = 0, j = allTags.length; i < j; i++) {
                tags[allTags[i]] = (tags[allTags[i]] || 0) + 1;
            }
            return tags;
        })
        .then(function (tags) {
            res.render('index', {tags: Object.keys(tags)})
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });

});

app.get("/edit/:id", users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (!res.locals.user.admin) {
        res.redirect("/view/"+id);
        return;
    }
    dataService.findById(id)
        .then(function (response) {
            var result = response.Items[0];
            var img_url = "/img" + decodeURIComponent(result.photosphere.S).split("amazonaws.com")[1];
            var model = {
                id: result.id.S,
                uploadDateTime: new Date(result.uploaded.S).toDateString(),
                dateTime: result.dateTime.S,
                photosphere: img_url,
                photosphere_original: decodeURIComponent(result.photosphere.S),
                tags: result.tags.SS,
                visibility: result.visibility.N,
                temperature: result.temperature.N,
                dewPoint: result.dewPoint.N,
                windDirection: result.windDirection.N,
                windSpeed: result.windSpeed.N,
            };
            if (result.lidar) {
                model.lidar = decodeURIComponent(result.lidar.S);
            }
            if (result.windGust) {
                model.windGust = result.windGust.N;
            }
            if (result.heading) {
                model.heading = result.heading.N;
            }
            return model;
        })
        .then(function (model) {
            res.render("edit", model);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });

});

app.get("/upload", function (req, res) {
    res.render("upload");
});

app.get("/view/:id", users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (id && id != "") {
        dataService.findById(id)
            .then(function (response) {
                var result = response.Items[0];
                var img_url = convertS3URL(result.photosphere.S);
                var lidar_url = (result.lidar) ? convertS3URL(result.lidar.S) : "";
                var model = {
                    admin: res.locals.user.admin,
                    id: result.id.S,
                    dateTime: new Date(result.dateTime.S).toDateString(),
                    photosphere: img_url,
                    lidar: lidar_url,
                    tags: result.tags.SS,
                    visibility: result.visibility.N,
                    temperature: result.temperature.N,
                    dewPoint: result.dewPoint.N,
                    windDirection: result.windDirection.N,
                    windSpeed: result.windSpeed.N
                };
                return model;
            })
            .then(function (model) {
                res.render("view", model);
            })
            .catch(function (err) {
                console.error(err);
                res.status(500).send(err);
            });
    }
});

// If you are `searching`` for no tags then redirect to home
app.get(/^\/tag\/?$/, function (req, res) {
    res.redirect('/');
});

app.get(/\/tag\/([- _a-z%A-Z0-9\/]*)\/?$/, function (req, res) {
    var tags = req.params[0].replace(/\/\s*$/, "").split('/');
    dataService.findByTags(tags)
        .then(function (response) {
            var results = response.Items;
            var model = {
                tags: tags,
                matchingObs: [],
                relatedTags: [],
                currentUrl: decodeURI(req.path)
            };
            results.forEach(function (result) {
                var img_url = convertS3URL(result.photosphere.S);
                var ob = {
                    id: result.id.S,
                    dateTime: new Date(result.dateTime.S).toDateString(),
                    photosphere: img_url,
                    tags: result.tags.SS
                };
                ob.tags.forEach(function (t) {
                    if (!model.relatedTags.includes(t)) {
                        model.relatedTags.push(t);
                    }
                });
                model.matchingObs.push(ob);
            });
            if (model.matchingObs.length === 1) {
                delete model.relatedTags;
            }
            return model;
        })
        .then(function (model) {
            res.render('tag', model);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });
});


//API endpoints - should really use 'put' and 'delete' http methods but not supported by html forms.
app.post("/create", function (req, res) {

    // validation
    function validateReq(req) {
        return new Promise(function (resolve, reject) {

            if (!req.files.p) {
                reject("missing photosphere");
            }

            if (!req.body.dt) {
                reject("missing date time");
            }

            if (!req.body.ws) {
                reject("missing wind speed");
            }

            if (!req.body.wd) {
                reject("missing wind direction");
            }

            if (!req.body.t) {
                reject("missing temperature");
            }

            if (!req.body.dp) {
                reject("missing dew point");
            }

            if (!req.body.v) {
                reject("missing visibility")
            }

            var tags = [];
            req.body.tags.split(",").forEach(function (tag) {
                tags.push(tag.trim().toLowerCase());
            });
            req.body.tags = tags;

            // optional wind gust
            if (req.body.wg.trim() === "") {
                delete req.body.wg;
            }

            resolve(req);
        });

    }

    // Get the image heading (direction)
    function getHeading(img_upload) {
        try {
            var headding_match = String(img_upload.data).match(/PoseHeadingDegrees[ ]?=[ ]?"([0-9.-]+)"/);
            var headding = Number(headding_match[1]);
            return headding;
        } catch (err) {
            return null;
        }
    }

    // workflow
    validateReq(req)
        .then(function (req) {
            var id = uuid.v4();

            Promise.all([dataService.insertFile(id, req.files.p, "photosphere"), dataService.insertFile(id, req.files.l, "lidar")])
                .then(function (resultArray) {
                    var obj = Object.assign({
                        id: id,
                        p: resultArray[0].Location
                    }, req.body);
                    if (resultArray[1]) {
                        obj.l = resultArray[1].Location
                    }
                    var heading = getHeading(req.files.p);
                    if (heading) {
                        obj.h = heading;
                    }
                    return dataService.insertRecord(obj);
                })
                .then(function () {
                    //TODO return created response and redirect to new resource
                    res.writeHead(301, {Location: "/view/" + id});
                    res.end();
                })
                .catch(function (err) {
                    console.error(err);
                    res.status(500).send("upload failed");
                });

        })
        .catch(function (err) {
            res.status(400).send(err);
        });

});

app.post("/update/:id", users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if(!res.locals.user.admin) {
        res.redirect("/view/"+id);
        return;
    }

    // validation
    function validateReq(req) {
        return new Promise(function (resolve, reject) {

            if (!req.body.p) {
                reject("missing photosphere");
            }

            if (!req.body.dt) {
                reject("missing date time");
            }

            if (!req.body.ws) {
                reject("missing wind speed");
            }

            if (!req.body.wd) {
                reject("missing wind direction");
            }

            if (!req.body.t) {
                reject("missing temperature");
            }

            if (!req.body.dp) {
                reject("missing dew point");
            }

            if (!req.body.v) {
                reject("missing visibility")
            }

            var tags = [];
            req.body.tags.split(",").forEach(function (tag) {
                tags.push(tag.trim().toLowerCase());
            });
            req.body.tags = tags;

            // optional lidar
            if (req.body.l.trim() == "") {
                delete req.body.l;
            }

            // optional wind gust
            if (req.body.wg.trim() == "") {
                delete req.body.l;
            }

            // optional heading
            if (req.body.h.trim() == "") {
                delete req.body.h;
            }

            resolve(req);
        });
    }

    // workflow
    validateReq(req)
        .then(function (req) {
            var obj = Object.assign({
                id: id
            }, req.body);
            return dataService.updateRecord(obj);
        })
        .then(function () {
            res.writeHead(301, {Location: "/view/" + id});
            res.end();
            // res.status(201).location("/index.html?id="+id);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });

});

app.get("/delete/:id", users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if(!res.locals.user.admin) {
        res.redirect("/view/"+id);
        return;
    }

    dataService.removeRecordById(id)
        .then(function () {
            res.writeHead(301, {Location: "/"});
            res.end();
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });
});

//server init
app.listen(3000, function () {
    console.log("Express server listening on port 3000");
});

function convertS3URL(url) {
    return "/img" + decodeURIComponent(url).split("amazonaws.com")[1];
}
