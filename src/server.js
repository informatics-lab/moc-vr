"use strict";

var express = require("express"),
    fileUpload = require("../lib/index.js"),
    app = express(),
    http = require("http").Server(app),
    io = require("socket.io")(http);
var engine = require("express-dot-engine");
var proxy = require("express-http-proxy");
var path = require("path");
var uuid = require("node-uuid");
var dataService = require("./mocvr-data-service");
var users = require("./users");
var passport = require("passport");
var session = require("express-session");
var GitHubStrategy = require("passport-github").Strategy;
var domainWhitelist = ["informaticslab.co.uk", "metoffice.gov.uk"];

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

//   Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
        clientID: process.env.MOC_VR_OAUTH_CLIENT_ID,
        clientSecret: process.env.MOC_VR_OAUTH_CLIENT_SECRET,
        callbackURL: "http://" + process.env.DOMAIN + "/auth/github/callback",
        scope: "user:email"
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            var domains = profile.emails.map(x => x.value.split("@")[1])
            function isValidDomain(element, index, array) {
                return domainWhitelist.includes(element);
            }
            if(domains.some(isValidDomain)) {
                return done(null, profile);
            } else {
                return done(new Error("Invalid user domain"));
            }

        });
    }
));

//set doT to render our view templates
app.engine("dot", engine.__express);
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "dot");
app.use(fileUpload());
app.use(express.static(__dirname + "/public", { maxage: 31536000 }));
app.use("/img/", proxy("moc-vr.s3-eu-west-1.amazonaws.com/", {
    decorateRequest: function (proxyReq, originalReq) {
        proxyReq.headers["Authorization"] = "";
        proxyReq.headers["Cookie"] = "";
        proxyReq.headers["Access-Control-Request-Method"] = "GET";
        proxyReq.method = "GET";
        return proxyReq;
    }
}));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login")
}

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get("/auth/github",
    passport.authenticate("github", { scope: [ "user:email" ] }),
    function(req, res){
        // The request will be redirected to GitHub for authentication, so this
        // function will not be called.
    });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get("/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect("/");
    });

//view endpoints
app.get("/", ensureAuthenticated, function (req, res) {

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
            res.render("index", {tags: Object.keys(tags).sort()})
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });

});

app.get("/login", function(req, res) {
    res.render("login", { user: req.user });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/edit/:id", ensureAuthenticated, users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (!res.locals.user.admin) {
        res.redirect("/view/" + id);
        return;
    }
    dataService.findById(id)
        .then(function (response) {
            var model =   toModel(response, res);
            var result = response.Items[0];
            model.photosphere_original = result.photosphere.S;
            if(result.lidar.S) {
                model.lidar_original = result.lidar.S;
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

app.get("/upload", ensureAuthenticated, function (req, res) {
    res.render("upload");
});

app.get("/view/:id", ensureAuthenticated, users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (id && id != "") {
        dataService.findById(id)
            .then(function(response){
                return toModel(response, res);
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

// If you are `searching` for no tags then redirect to home
app.get(/^\/tag\/?$/, ensureAuthenticated, function (req, res) {
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
                    tags: result.tags.SS.sort()
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
app.post("/create", ensureAuthenticated, function (req, res) {

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

app.post("/update/:id", ensureAuthenticated, users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (!res.locals.user.admin) {
        res.redirect("/view/" + id);
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

app.get("/delete/:id", ensureAuthenticated, users.isAdmin, function (req, res) {
    var id = req.params.id.trim();
    if (!res.locals.user.admin) {
        res.redirect("/view/" + id);
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

app.get("/sync", function(req, res) {
    res.render("sync");
});

app.get("/sync/client", function (req, res) {
    res.render("client");
});

app.get("/sync/server", ensureAuthenticated, function (req, res) {
    res.render("server");
});

io.on("connection", function (socket) {

    var self = this;

    socket.on("register", function(msg) {
        self.code = msg.code;
        console.log("%s joined %s", msg.type, self.code);
        socket.join(self.code);
    });

    socket.on("serve", function(msg) {
        var id = msg.id.trim().toLowerCase();
        console.log("serving %s to %s", id, self.code);
        if (id && id != "") {
            dataService.findById(id)
                .then(function(response){
                    return toModel(response);
                })
                .then(function (model) {
                    io.in(self.code).emit("display", model);
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
    });

    socket.on("sync-server", function(msg) {
        socket.volatile.to(self.code).emit("sync-client", msg);
    });

    socket.on("disconnect", function () {
        socket.leave(self.code);
    });
});

//server init
http.listen(3000, function () {
    console.log("Express server listening on port 3000");
});

function convertS3URL(url) {
    return "/img" + decodeURIComponent(url).split("amazonaws.com")[1];
}

function toModel(response, res){
    var result = response.Items[0];
    var img_url = convertS3URL(result.photosphere.S);
    var lidar_url = (result.lidar) ? convertS3URL(result.lidar.S) : "";
    var dateTime = new Date(result.dateTime.S);
    var timeStr = dateTime.toTimeString().split(':')[0] + ':' + dateTime.toTimeString().split(':')[1]+ 'Z';
    var model = {
        admin: (res)? res.locals.user.admin : false,
        id: result.id.S,
        date: dateTime.toDateString(),
        time: timeStr,
        photosphere: img_url,
        lidar: lidar_url,
        tags: result.tags.SS.sort(),
        visibility: result.visibility.N,
        temperature: result.temperature.N,
        dewPoint: result.dewPoint.N,
        windDirection: result.windDirection.N,
        windSpeed: result.windSpeed.N,
        uploadDate: new Date(result.uploaded.S).toDateString()
    };

    if (result.windGust) {
        model.windGust = result.windGust.N;
    }
    if (result.heading) {
        model.heading = result.heading.N;
    }
    return model;
}
