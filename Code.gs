function checkNewYoutube() {
  var mySpreadsheetID = "1AddLP0zpuRBsJBFskFFO7Dsdf9KqlM6BrhE5c7Eiuqc";
  var myRange = "YoutubeTracking!A:D";
  var rewindHours = 25

  function ISODateString(d){
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'
  }
  
  function posttoWebHook(title, videoURL, thumbnailURL, webhook_URL){

    txtTitle = decodeURIComponent(title);
    content = "<"+videoURL+"|"+txtTitle+">";
    var data = {
	    "text": content,
	    "accessory": {
		    "type": "image",
		    "image_url": thumbnailURL,
		    "alt_text": txtTitle
	    }
    };
    var payload = JSON.stringify(data);
    Logger.log ("payload: "+payload);
    var options = {
      "method": "POST",
      "contentType": "application/json",
      "payload": payload
    };
    Logger.log("options: "+options);
    var r = UrlFetchApp.fetch (webhook_URL, options);
    Logger.log("UrlFetchApp response: "+r);
    return r;

  };

  function getPastDate (rewindHours){
    var y = new Date();
    y.setHours(y.getHours() - rewindHours)
    return y
  }

  function getChannels (spreadsheetID, range){
    var c = Sheets.Spreadsheets.Values.get(spreadsheetID,range).values;
    return c;
  }

  function searchYoutube (channelID, channelFilter, pastDate){
      var v = {channelId: channelID,
      publishedAfter: pastDate,
      q: channelFilter,
      type: 'video',
      maxResults: 5,
      order: 'date',
      safeSearch: 'none'};

      Logger.log (v);
      var r = YouTube.Search.list ('id, snippet', v);

    return r;
  };

  //Main Workflow

    var myChannels = getChannels(mySpreadsheetID, myRange);
    Logger.log ("myChannels: "+myChannels);
    var myPastDate = ISODateString(getPastDate(rewindHours));
    Logger.log ("myPastDate: "+myPastDate);

    for (var i = 0, l = myChannels.length; i < l; i++){
      //source spreadsheet uses following fields.  No header row.
      var searchName = myChannels[i][0]; //friendly name used when pushing message to webhook
      var myChannelID = myChannels[i][1]; //found by selecting channel homepage, https://www.youtube.com/channel/[myChannelID]
      var myChannelFilter = myChannels[i][2]; //text filter. If blank, then 5 newest videos on channel in past rewindHours will be returned.
      var myWebHook = myChannels[i][3]; //webhook address.  Can be different for each channel
      Logger.log ("searchName: "+searchName+"; myChannelID: "+myChannelID+"; myChannelFilter: "+myChannelFilter);
    //if (myChannelID == "UCpa-Zb0ZcQjTCPP1Dx_1M8Q") { //channel screen to protect quota during testing begin

      var myResults = searchYoutube(myChannelID, myChannelFilter, myPastDate);
      Logger.log ("Youtube search results: "+ myResults);
      for (var ii = 0, ll = myResults.items.length; ii < ll; ii++){
        if (myResults.items[ii].snippet.title.includes(myChannelFilter)||myChannelFilter == undefined ){
          var vTitle = "New "+ searchName;
          var vURL = "https://www.youtube.com/watch?v="+myResults.items[ii].id.videoId;
          var vThumbnail = myResults.items[ii].snippet.thumbnails.default.url;
          Logger.log ("vTitle: "+vTitle+"; vURL: "+vURL+"; vThumbnail: "+vThumbnail);
          response = posttoWebHook(vTitle,vURL,vThumbnail,myWebHook);
          Logger.log ("posttoWebHook response: "+response);
        };
      };
    //} //channel screen
    //else { //channel screen
    //  Logger.log("Channel skipped to protect quota during testing");//channel screen
    //};//channel screen to protect quota during testing end
      
  };
};