const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const keepAlive = require('./server')

 
const { YTSearcher } = require('ytsearcher');

//youtube search 
const searcher = new YTSearcher({
    key: "process.env.YT",
    revealed: true
});
 
const client = new Discord.Client();
 
const queue = new Map();

//ready_the_bot
client.on("ready", () => {
    console.log("I am online!")
})

//triggered an action when someone message
client.on("message", async(message) => {
    const prefix = '!';
 
    const serverQueue = queue.get(message.guild.id);
    
    //clear the data
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    //make sure caps lock is not a problemn
    const command = args.shift().toLowerCase();
 
    switch(command){
        case 'p':
            execute(message, serverQueue);
            break;
        case 's':
            stop(message, serverQueue);
            break;
        case 'sk':
            skip(message, serverQueue);
            break;
    }
 
    async function execute(message, serverQueue){
        //make sure use are connected in voice channel
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("beyaddob! -_- voice chat e add ho");
        }else{
            //get result from youtube
            let result = await searcher.search(args.join(" "), { type: "video" })
            //get info using ytdl
            const songInfo = await ytdl.getInfo(result.first.url)
            //save the details
            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };
            //server details check if song is already playing in vc if it is add it on list
            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };
                queue.set(message.guild.id, queueConstructor);
 
                queueConstructor.songs.push(song);
 
                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                }catch (err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`bug! amar code e eto bug ken -_- ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send(`add kore disi ${song.url}`);
            }
        }
    }
    
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`ladies and gentlmen, I present to you the ${serverQueue.songs[0].title} ${serverQueue.songs[0].url}`)
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("vc te join ho -_-!")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("vc te join ho -_-!");
        if(!serverQueue)
            return message.channel.send("matha thik ase? :|!");
        serverQueue.connection.dispatcher.end();
    }
})
keepAlive();

client.login(process.env.DISCORD)