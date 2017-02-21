var accessKeyId = process.env.AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

var AWS = require("aws-sdk");
AWS.config.update({
    credentials: new AWS.Credentials(accessKeyId, secretAccessKey),
    region: "eu-west-1"
});
var s3 = new AWS.S3({apiVersion: "2006-03-01"});
var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});

var uuid = require("node-uuid");
var express = require("express"),
    fileUpload = require("../lib/index.js"),
    app = express();

var table = "moc-vr";
var bucket = "moc-vr";


app.use(fileUpload());

app.use(express.static(__dirname + "/public"));

app.get("/tag/:tag", function (req, res) {
    var tag = req.params.tag.trim().toLowerCase();

    function findByTag(tag, limit) {
        limit = limit || 5;
        return new Promise(function (resolve, reject) {
            var params = {
                TableName: table,
                Limit: limit,
                Select: "ALL_ATTRIBUTES",
                ExpressionAttributeValues: {
                    ":tag": {
                        S: tag
                    }
                },
                FilterExpression: "contains(tags, :tag)"
            };
            ddb.scan(params, function (err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });

        });
    }

    findByTag(tag)
        .then(function (data) {
            res.status(200).send(data);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });


});

app.get("/id/:id", function (req, res) {

    var id = req.params.id;

    function findById(id) {
        return new Promise(function (resolve, reject) {
            var params = {
                TableName: table,
                Limit: 1,
                Select: "ALL_ATTRIBUTES",
                ExpressionAttributeValues: {
                    ":id": {
                        S: id
                    }
                },
                KeyConditionExpression: "id = :id"
            };
            ddb.query(params, function (err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });

        });
    }

    findById(id)
        .then(function (data) {
            res.status(200).send(data);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        })

});

// inserts a full entry into our system
app.post("/post", function (req, res) {

    // validation
    function validateReq(req) {
        return new Promise(function (resolve, reject) {

            if (!req.files.p) {
                reject("missing photosphere");
            }

            if (!req.files.cbh) {
                reject("missing cloud base height");
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

            if (!req.body.wg) {
                reject("missing wind gust")
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

            resolve(req);
        });


    }

    // Get the image heading (direction)
    function getHeading(img_upload) {
        try {
            var headding_match = String(img_upload.data).match(/PoseHeadingDegrees[ ]?=[ ]?"([0-9][0-9]?[0-9]?)"/);
            var headding = Number(headding_match[1]);
            return headding;
        } catch (err) {
            return null;
        }
    }

    // upload file to s3
    function uploadFile(id, file, name) {
        return new Promise(function (resolve, reject) {
            var params = {
                Bucket: bucket,
                Key: "obs/" + id + "/" + name,
                Body: file.data,
                ContentType: file.mimetype
            };
            s3.upload(params, function (err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    }

    // add entry to ddb
    function insert(obj) {
        return new Promise(function (resolve, reject) {
            var data = {
                id: {S: obj.id},
                uploaded: {S: new Date().toISOString()},
                dateTime: {S: new Date(obj.dt).toISOString()},
                photosphere: {S: obj.p},
                lidar: {S: obj.l},
                windSpeed: {N: obj.ws},
                windDirection: {N: obj.wd},
                windGust: {N: obj.wg},
                temperature: {N: obj.t},
                dewPoint: {N: obj.dp},
                visibility: {N: obj.v},
                tags: {SS: obj.tags}
            };
            if (typeof(obj.h) === 'number') {
                data.heading = {N: String(obj.h)}
            }
            var params = {
                Item: data,
                TableName: table
            };

            ddb.putItem(params, function (err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });

        });
    }

    // workflow
    validateReq(req)
        .then(function (req) {
            var id = uuid.v4();

            Promise.all([uploadFile(id, req.files.p, "photosphere"), uploadFile(id, req.files.cbh, "lidar")])
                .then(function (resultArray) {
                    var obj = Object.assign({
                        id: id,
                        p: resultArray[0].Location,
                        l: resultArray[1].Location,
                        h: getHeading(req.files.p)
                    }, req.body);
                    return insert(obj);
                })
                .then(function () {
                    // redirect back to index ??
                    res.writeHead(301, {Location: "/index.html?id=" + id});
                    res.end();
                    // res.status(201).location("/index.html?id="+id);
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

app.listen(3000, function () {
    console.log("Express server listening on port 3000");
});
