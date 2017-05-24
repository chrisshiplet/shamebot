var Slack = require('slackbots');

var slackbot = new Slack({
  token: process.env.SLACK_TOKEN,
});

slackbot.on('message', data => {
  if (data.subtype === 'message_deleted') {
    var user = {};
    slackbot.getUsers()
      .then(users => {
        user = users.members.find(user => user.id === data.previous_message.user);
      })
      .then(() => {
        return slackbot.postMessage(data.channel, `@${user.name}: you appear to have accidentally removed this...`, {
          as_user: true,
          parse: 'full',
          link_names: true,
        });
      })
      .then(() => {
        return slackbot.postMessage(data.channel, data.previous_message.text, {
          link_names: true,
          username: user.profile.real_name,
          icon_url: user.profile.image_72,
        });
      });
    console.log(data);
  }
});

slackbot.on('start', function() {
  console.log('listening for deleted messages...');
});
