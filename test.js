var https = require('https');

var seagull_chat_url='https://rechat.twitch.tv/rechat-messages?start=1462806932&video_id=v65469361'
var seagull_vid_url='api.twitch.tv'

var vid_options = {
  host: seagull_vid_url,
  path: '/kraken/videos/v65469361',
  method: 'GET',
  headers: {'Client-ID': '57yix1ed0jcmfazsszea1yyfv1xxoyl',
    'Accept': 'application/vnd.twitchtv.v3+json'}
};

console.log("VideoParse");

function videoParse(videoSearchOptions, videoData){
  var req1 = https.request(videoSearchOptions, (res) => {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);

  var responseString = '';

  res.on('data', data => {
    responseString+=data;
  });

  res.on('end', function() {
      //console.log(responseString);
      var responseObject = JSON.parse(responseString);
      console.log(responseObject);
      videoData(responseObject);
      //success(responseObject);
    });

}).on('error', (e) => {
  console.error(e);
});
req1.end();
};

console.log("ChatParse");
function chatParse(){
  https.get(seagull_chat_url, (res) => {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);

  var responseString = '';

  res.on('data', data => {
    responseString+=data;
  });

  res.on('end', function() {
      //console.log(responseString);
      var responseObject = JSON.parse(responseString);
      console.log(responseObject);
      //success(responseObject);
    });

}).on('error', (e) => {
  console.error(e);
});
};

videoParse(vid_options, function(output){
  console.log(output);
});
