var https = require('https');

//===========Get details of video============//
//console.log("Running...\n");

exports.videoParse = function (videoSearchOptions, videoData){
  var req1 = https.request(videoSearchOptions, (res) => {
  //console.log('statusCode: ', res.statusCode);
  //console.log('headers: ', res.headers);

  var responseString = '';

  res.on('data', data => {
    responseString+=data;
  });

  res.on('end', function() {
      //console.log(responseString);
      var responseObject = JSON.parse(responseString);
      //console.log(responseObject);
      videoData(responseObject);
      //success(responseObject);
    });

  }).on('error', (e) => {
    console.error(e);
  });
  req1.end();
};

//===========Get chat history for 30 second block============//
exports.chatParse_30s = function (chatURL, chatData){
  var responseObject = {};
  https.get(chatURL, (res) => {
  //console.log('statusCode: ', res.statusCode);
  //console.log('headers: ', res.headers);

  var responseString = '';

  res.on('data', data => {
    responseString+=data;
  });

  res.on('end', function() {
      //console.log(responseString);
      responseObject = JSON.parse(responseString);
      chatData(responseObject);
      //success(responseObject);
    });

}).on('error', (e) => {
      console.error(e);
    });


};
