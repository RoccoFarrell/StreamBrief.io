// set variables for environment
var http = require('http');
var express = require('express');
var app = express();
var path = require('path');
var morgan = require('morgan'); // used to see requests

var fs = require('fs');
var file = "twitch.db";
var exists = fs.existsSync(file);

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

var apiCalls = require('./apiCalls.js');

//console.log(exists);

function dbSetup(){
  db.serialize(function() {
      db.run("CREATE TABLE if not exists StreamComments (ID INT PRIMARY KEY NOT NULL,\
        TIMESTAMP INT NOT NULL,\
        USERID INT NOT NULL,\
        COMMENT TEXT)");
    /*
    db.each("SELECT name FROM sqlite_master WHERE type='table'", function(err, row) {
      console.log(row);
    });


    db.each("SELECT rowid AS id, * FROM StreamComments", function(err, row) {
      console.log(row);
    });
    */
  });
}

dbSetup();

function db_insertComment(commentDetails, callback){

  db.serialize(function() {

    var stmt = db.prepare("INSERT OR IGNORE INTO StreamComments(ID, TIMESTAMP, USERID, COMMENT) VALUES(?, ?, ?, ?)");

    stmt.run(commentDetails.ID, commentDetails.TIMESTAMP, commentDetails.USERID, commentDetails.COMMENT);

    stmt.finalize();

  });
  //console.log("commentDetails: " + JSON.stringify(commentDetails, null, 2));
};

function processChatSnippet(chatSnippet, results){
  //console.log("chatSnippet obj: " + JSON.stringify(chatSnippet, null, 2));
  //console.log("chatSnippet: " + JSON.stringify(chatSnippet.data[0], null, 2));
  var snippetList = {
    comments: []
  };

  var snippetLength = 0;
  var snippet_startTime = 0;
  var snippet_endTime = 0;

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

    snippet_startTime = snippetList.comments[0].TIMESTAMP;
    snippet_endTime = snippetList.comments[snippetLength-1].TIMESTAMP;

    db_insertComment(snippetList.comments[key], function(input){
      console.log("Inserting into db");
    });
  }

  results(snippetList, snippet_startTime, snippet_endTime);

  console.log(snippetLength + " messages from " + snippet_startTime + " to " + snippet_endTime);

};

//===============================================//
//--------TESTING API CALLS IN SERVER.JS---------//
//===============================================//

var seagull_chat_url='https://rechat.twitch.tv/rechat-messages?start=1462806932&video_id=v65469361'
var seagull_vid_url='api.twitch.tv'

var streamvid_id = "v65469361";

var vid_options = {
  host: seagull_vid_url,
  path: '/kraken/videos/v65469361',
  method: 'GET',
  headers: {'Client-ID': '57yix1ed0jcmfazsszea1yyfv1xxoyl',
    'Accept': 'application/vnd.twitchtv.v3+json'}
};

var recordedAt;
var vid_endTime;

apiCalls.videoParse(vid_options, function(output){
  console.log("\nVideoParse");
  //console.log(output);
  recordedAt = new Date(output.recorded_at);
  //console.log("recordedAt:" + recordedAt);
  //console.log("start milli:" + recordedAt.getTime());
  endTime = new Date(1462806932000 + (output.length)*1000);
  //console.log("end: " + endTime);
  //console.log("end milli: " + endTime.getTime());
});

var chatSnippet = {};
var chat_options = {
  vid_id: streamvid_id,
  chatParse_startTime: 1462806932
};

var next_startTime;
var counter = 0;


//WORKING HERE ON DAY END 05-26
//WHILE LOOP IS NOT THE WAY TO GO DUE TO ASYNC
while(counter < 10){
  counter+=1;
  console.log("making chat #" + counter +" parse call for time" + chat_options.chatParse_startTime);
  setTimeout(function(){
    apiCalls.chatParse_30s(chat_options, function(output){
      chatSnippet = output;
      processChatSnippet(chatSnippet, function(inputList, snippet_startTime, snippet_endTime){
        //console.log(inputList);
        console.log("snippet start in function: " + snippet_startTime)
        next_startTime = snippet_endTime;
      });
    });
  }, 10000);
  chat_options.chatParse_startTime = next_startTime;

}

function db_printStreamComments(){
  db.serialize(function(){
    db.each("SELECT * FROM StreamComments", function(err, row) {
        console.log("DBrow" + JSON.stringify(row));
    });
  });
};

db_printStreamComments();

//Set up Display
app.set('view engine', 'pug');
app.set('views', __dirname + '/public/views')
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

//var jsonOutput = JSON.stringify(chatSnippet, null, 2);

app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: JSON.stringify(chatSnippet, null, 2)});
});

app.listen(4000);
console.log("server running");
