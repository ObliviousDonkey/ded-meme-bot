const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("request");

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
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
                        const embed = new Discord.RichEmbed()
                            .setTitle(meme.title)
                            .setURL("https://reddit.com" + meme.redditUrl)
                            .setAuthor(meme.author)
                            .setDescription(meme.description)
                            .setColor(0x00ae86)
                            .setFooter("👍" + meme.upvotes)
                            .setImage(meme.imgUrl)

                        msg.channel.send({
                            embed
                        });
                    }
                }
            });
        } else {
            msg.reply("Usage: !r <subreddit>");
        }
    }
});

function scrapeSubreddit(subreddit, callback) {
    request("https://reddit.com/r/" + subreddit + "/hot/.json", function (
        error,
        response,
        body
    ) {
        var jsonResponse = JSON.parse(body);
        var memes = [];
        if (jsonResponse['error'] == null) {
            jsonResponse.data.children.forEach(entry => {
                var date = new Date(entry.data.created * 1000);
                var formattedTime = date.toISOString();
                var imgUrl = entry.data.url;
                if (
                    imgUrl.includes("png") == false &&
                    imgUrl.includes("jpg") == false &&
                    imgUrl.includes("gif") == false
                ) {
                    imgUrl = imgUrl + ".png";
                }
                var tempMeme = {
                    title: entry.data.title,
                    author: entry.data.author,
                    imgUrl: imgUrl,
                    description: entry.data.selftext,
                    redditUrl: entry.data.permalink,
                    upvotes: entry.data.score,
                    timestamp: formattedTime,
                    nsfw: entry.over_18
                };

                memes.push(tempMeme);
            });
        }
        var scrapedMemes = memes;
        callback(scrapedMemes);
    });
}
client.login(process.env.BOT_TOKEN);
