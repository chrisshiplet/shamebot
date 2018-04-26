var Slack = require('slackbots');

var slackbot = new Slack({
  token: process.env.SLACK_TOKEN,
});

var messages = [];

var shameChannelId;

slackbot
  .getChannelId('so-shame')
  .then(channelId => {
    shameChannelId = channelId;
  })
  .catch(err => console.log(err));

slackbot.on('message', data => {
  if (!data.hidden) {
    messages.push(data);
    if (messages.length > 1000) {
      messages.shift();
    }
  }
  if (data.subtype === 'message_changed') {
    slackbot.getUsers().then(users => {
      var i = messages.findIndex(message => message.ts === data.message.ts);
      var user = users.members.find(user => user.id === data.message.edited.user);

      if (i > -1) {
        var params = {
          as_user: true,
          link_names: true,
          attachments: data.previous_message.attachments || [],
        };
        if (data.previous_message.thread_ts) {
          params.thread_ts = data.previous_message.thread_ts;
        }
        var nextMessage = `\`${user.name}\`'s message unexpectedly changed from "${messages[i].text}" to "${
          data.message.text
        }"`;
        messages[i] = data.message;
        return slackbot.postMessage(shameChannelId, nextMessage, params);
      }
    });
  } else if (data.subtype === 'message_deleted') {
    var user = {};
    slackbot
      .getUsers()
      .then(users => {
        user = users.members.find(user => user.id === data.previous_message.user);
      })
      .then(() => {
        var params = {
          as_user: true,
          parse: 'full',
          link_names: true,
        };
        if (data.previous_message.thread_ts) {
          params.thread_ts = data.previous_message.thread_ts;
        }
        return slackbot.postMessage(shameChannelId, `\`${user.name}\` removed their message:`, params);
      })
      .then(() => {
        var params = {
          link_names: true,
          username: user.profile.real_name,
          icon_url: user.profile.image_72,
          attachments: data.previous_message.attachments || [],
        };
        if (data.previous_message.thread_ts) {
          params.thread_ts = data.previous_message.thread_ts;
        }
        return slackbot.postMessage(shameChannelId, data.previous_message.text, params);
      });
  }
});

slackbot.on('start', function() {
  console.log('listening for deleted messages...');
});
