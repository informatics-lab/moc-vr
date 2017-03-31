/**
 * Created by tom on 31/03/2017.
 */
"use strict";

var AWS = require("aws-sdk");

var accessKeyId = process.env.MOC_VR_AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.MOC_VR_AWS_SECRET_ACCESS_KEY;
AWS.config.update({
    credentials: new AWS.Credentials(accessKeyId, secretAccessKey),
    region: "eu-west-1"
});
var s3 = new AWS.S3({apiVersion: "2006-03-01"});
var ddb = new AWS.DynamoDB({apiVersion: "2012-08-10"});
var table = "moc-vr";
var bucket = "moc-vr";

module.exports = {

    insertFile: function (id, file, name) {
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
    },

    insertRecord: function (record) {
        return new Promise(function (resolve, reject) {
            var data = {
                id: {S: record.id},
                uploaded: {S: new Date().toISOString()},
                dateTime: {S: new Date(record.dt).toISOString()},
                photosphere: {S: record.p},
                lidar: {S: record.l},
                windSpeed: {N: record.ws},
                windDirection: {N: record.wd},
                windGust: {N: record.wg},
                temperature: {N: record.t},
                dewPoint: {N: record.dp},
                visibility: {N: record.v},
                tags: {SS: record.tags}
            };
            if (typeof(record.h) === 'number') {
                data.heading = {N: String(record.h)}
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
    },

    //TODO
    updateRecord: function(record) {

    },

    //TODO
    removeRecordById: function(id) {

    },

    findById: function (id) {
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
    },

    listTags: function() {
        return new Promise(function (resolve, reject) {
            var params = {
                TableName: table,
                Select: "SPECIFIC_ATTRIBUTES",
                ProjectionExpression: "tags"
            };
            ddb.scan(params, function (err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    },

    //TODO
    findByTag: function(tag) {
        return new Promise(function (resolve, reject) {
            var params = {
                TableName: table,
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

};