// set variables for environment
var http = require('http');
var express = require('express');
var app = express();
var path = require('path');
var mysql      = require('mysql');

var fs = require('fs');
var file = "twitch.db";
var exists = fs.existsSync(file);

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

var apiCalls = require('./apiCalls.js');

//console.log(exists);

db.serialize(function() {

    db.run("CREATE TABLE if not exists Stuff (thing TEXT)");
    db.run("CREATE TABLE if not exists StreamComments (ID INT PRIMARY KEY NOT NULL,\
      TIMESTAMP INT NOT NULL,\
      USERID INT NOT NULL,\
      COMMENT TEXT)");

  db.each("SELECT name FROM sqlite_master WHERE type='table'", function(err, row) {
    console.log(row);
  });


  db.each("SELECT rowid AS id, * FROM StreamComments", function(err, row) {
    console.log(row);
  });
});

function db_insertComment(commentDetails, callback){

  db.serialize(function() {

    var stmt = db.prepare("INSERT OR IGNORE INTO StreamComments(ID, TIMESTAMP, USERID, COMMENT) VALUES(?, ?, ?, ?)");

    stmt.run(commentDetails.ID, commentDetails.TIMESTAMP, commentDetails.USERID, commentDetails.COMMENT);

    stmt.finalize();

  });
  console.log("commentDetails: " + JSON.stringify(commentDetails, null, 2));
};


/*
db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE Stuff (thing TEXT)");
  }

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
      console.log(row.id + ": " + row.info);
  });
});

db.close();
*/

//--------TESTING API CALLS IN SERVER.JS---------//

var seagull_chat_url='https://rechat.twitch.tv/rechat-messages?start=1462806932&video_id=v65469361'
var seagull_vid_url='api.twitch.tv'

var vid_options = {
  host: seagull_vid_url,
  path: '/kraken/videos/v65469361',
  method: 'GET',
  headers: {'Client-ID': '57yix1ed0jcmfazsszea1yyfv1xxoyl',
    'Accept': 'application/vnd.twitchtv.v3+json'}
};

/*
apiCalls.videoParse(vid_options, function(output){
  //console.log("\nVideoParse");
  //console.log(output);
});
*/
var chatSnippet = {};

function processChatSnippet(chatSnippet, results){
  //console.log("chatSnippet obj: " + JSON.stringify(chatSnippet, null, 2));
  //console.log("chatSnippet: " + JSON.stringify(chatSnippet.data[0], null, 2));
  var snippetList = {
    comments: []
  };

  var snippetLength = 0;

  for (var key in chatSnippet.data){
    //console.log(key);
    //console.log(chatSnippet.data[key].id);
    snippetLength += 1;
    var chatAttr = chatSnippet.data[key].attributes;
    //console.log(chatAttr.from + ": " + chatAttr.message + " @: " + chatAttr.timestamp);

    snippetList.comments.push({
      "ID": chatSnippet.data[key].id,
      "TIMESTAMP": chatAttr.timestamp,
      "USERID": chatAttr.from,
      "COMMENT": chatAttr.message
    });

    db_insertComment(snippetList.comments[key], function(input){
      console.log("Inserting into db");
    });
  }

  results(snippetList);

  console.log(snippetLength);

};

apiCalls.chatParse_30s(seagull_chat_url, function(output){
  //console.log("\nchatParse_30s");
  chatSnippet = output;
  //console.log(output.data[0]);
  processChatSnippet(chatSnippet, function(inputList){
    //console.log(inputList);
  });
});

function db_printStreamComments(){
  db.serialize(function(){
    db.each("SELECT * FROM StreamComments", function(err, row) {
        console.log("DBRow: " + row);
    });
  });
};

var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end(JSON.stringify(chatSnippet, null, 2));
});

//server.listen(4000);
console.log("server running");
