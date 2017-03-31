/**
 * Created by tom on 31/03/2017.
 */
"use strict";

module.exports = {

    insertFile: function (id, file, name) {
        console.log("insertFile", id, file, name);
    },

    insertRecord: function (record) {
        console.log("insertRecord", record);
    },

    updateRecord: function (record) {
        console.log("updateRecord", record);
    },

    removeRecordById: function (id) {
        console.log("removeRecordById", id);
    },

    findById: function (id) {
        console.log("findById",id);
    },

    listTags: function () {
        console.log("listTags");
    },

    findByTag: function (tag) {
        console.log("findByTag",tag);
    }
};