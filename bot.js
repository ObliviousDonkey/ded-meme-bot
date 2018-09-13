const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("request");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("!r <subreddit>");
});
var error;
client.on("message", msg => {
  var args = msg.content.split(" ");
  if (args == null) {
    msg.reply("Error");
  }
  if (args[0] == "!r") {
    if (args[1] != null) {
      var memes = [];
      var subreddit = args[1];
      memes = scrapeSubreddit(subreddit, function (scrapedMemes) {
        memes = scrapedMemes;
        if (memes == null) {
          msg.channel.send("Error");
        } else {
          if (memes[0] == null) {
            msg.reply("oops something went wrong, try a different subreddit.");
          } else {
            var ranIndex = Math.floor(Math.random() * memes.length);
            var meme = memes[ranIndex];

            //check description length
            if (meme.description != null && meme.description.length > 2000) {
              meme.description = meme.description.substring(0, 2000);
              meme.description += " ... **(for more click the link above).**";
            }
            const embed = new Discord.RichEmbed()
              .setTitle(meme.title)
              .setURL("https://reddit.com" + meme.redditUrl)
              .setAuthor(meme.author)
              .setDescription(meme.description)
              .setColor(0x00ae86)
              .setFooter("👍" + meme.upvotes)
              .setImage(meme.imgUrl)
              .setTimestamp(meme.timestamp);

            msg.channel.send({
              embed
            });
            console.log(
              "Message send: " +
              meme.title +
              " | " +
              meme.imgUrl +
              " | " +
              meme.redditUrl
            );
          }
        }
      });
    } else {
      msg.reply("Usage: !r <subreddit>");
    }
  } else if (args[0] == "!mc") {
    var server;
    if (args[1] == null) {
      msg.reply("!mc <minecraft-server>");
      return;
    }
    server = args[1];
    checkMCServerStatus(server, function (response, motd) {
      var color;
      var text;
      if (response == "offline") {
        var color = 0xf20000;
        var text = "Offline.";
        var description = "";
      } else {
        var color = 0x10ff00;
        var text = response;
        var description = motd.replace(/§[a-fk-r1-8]/g, '');
      }

      const embed = new Discord.RichEmbed()
        .setAuthor(server + " Server Status")
        .setTitle(text)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      msg.channel.send({
        embed
      });
    });
  }
});

function checkMCServerStatus(server, callback) {
  request("https://mcapi.us/server/status?ip=" + server, function (
    error,
    response,
    body
  ) {
    // console.log(body);

    var jsonResponse = JSON.parse(body);
    console.log(jsonResponse);
    if (jsonResponse["status"] == "success") {
      if (jsonResponse["online"] == true) {
        callback(
          "Online (" +
          jsonResponse.players["now"] +
          "/" +
          jsonResponse.players["max"] +
          ")",
          jsonResponse["motd"]
        );
      } else {
        callback("offline");
      }
    } else {
      callback("offline");
    }
  });
}

function scrapeSubreddit(subreddit, callback) {
  request("https://reddit.com/r/" + subreddit + "/top/.json?limit=50", function (
    error,
    response,
    body
  ) {
    var jsonResponse = JSON.parse(body);
    var memes = [];
    if (jsonResponse["error"] == null) {
      jsonResponse.data.children.forEach(entry => {
        //Nsfw
        //if (entry.data.over_18 == true) {
        //  return;
        //}
        // Video
        if (entry.data.is_video == true) {
          return;
        }
        //Mod Thread
        if (entry.data.distinguished != null) {
          return;
        }

        var date = new Date(entry.data.created * 1000);
        var formattedTime = date.toISOString();
        var imgUrl = entry.data.url;
        if (
          imgUrl.includes("png") == false &&
          imgUrl.includes("jpg") == false &&
          imgUrl.includes("gif") == false &&
          imgUrl.includes("gifv") == false &&
          imgUrl.includes("youtube.com") == false &&
          imgUrl.includes("gfycat.com") == false
        ) {
          imgUrl = imgUrl + ".png";
        }

        if (imgUrl.includes(".gifv")) {
          imgUrl = imgUrl.replace("gifv", "gif");
        }

        if (imgUrl.includes("gfycat.com")) {
          imgUrl = imgUrl + ".gif";
        }
        var tempMeme = {
          title: entry.data.title,
          author: entry.data.author,
          imgUrl: imgUrl,
          description: entry.data.selftext,
          redditUrl: entry.data.permalink,
          upvotes: entry.data.score,
          timestamp: formattedTime
        };
        memes.push(tempMeme);
      });
    }
    var scrapedMemes = memes;
    callback(scrapedMemes);
  });
}

client.login(process.env.BOT_TOKEN);
