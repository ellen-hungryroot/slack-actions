const { WebClient } = require('@slack/web-api');
const github = require('@actions/github');
const core = require('@actions/core');

const POST_ACTION = 'post'
const UPDATE_ACTION = 'update'
const REPLY_ACTION = 'reply'
const REACT_ACTION = 'react'


const post = async () => {
  // eslint-disable-next-line no-unused-vars
  const {payload} = github.context
  const channelId = core.getInput('channel-id');
  const botToken = core.getInput('slack-bot-token');

  // eslint-disable-next-line no-eval
  const messages = eval(core.getInput('message'));

  const client = new WebClient(botToken);
  await client.chat.postMessage({ channel: channelId, text: messages })
}


const update = async () => {
    // eslint-disable-next-line no-unused-vars
  const {payload} = github.context
  const channelId = core.getInput('channel-id');
  const botToken = core.getInput('slack-bot-token');

  // eslint-disable-next-line no-eval
  const stringMatcher = eval(core.getInput('string-matcher'));
  // eslint-disable-next-line no-eval
  const messages = eval(core.getInput('message'));

  const client = new WebClient(botToken);
  const conversations = await client.conversations.history({ token: botToken, channel: channelId })
  const message = conversations.messages.find((m)=> m.text.includes(stringMatcher))

  if (message !== undefined){
    await client.chat.update({ token: botToken, channel: channelId , ts: message.ts, text: messages})
  } else {
    await client.chat.postMessage({ channel: channelId, text: messages })
  }
}

const reply = async () => {
  // eslint-disable-next-line no-unused-vars
  const {payload} = github.context
  const channelId = core.getInput('channel-id');
  const botToken = core.getInput('slack-bot-token');
  const stringMatcher = core.getInput('string-matcher');
  // eslint-disable-next-line no-eval
  const messages = eval(core.getInput('message'));

  const client = new WebClient(botToken);
  let message;
  try {
    const conversations = await client.conversations.history({ token: botToken, channel: channelId })
    message = conversations.messages.find((m)=> m.text.includes(stringMatcher))
  } catch (err) {
    core.setFailed(err);
    return;
  }

  if (message !== undefined) {
    try {
      await client.chat.postMessage({ token: botToken, channel: channelId , thread_ts: message.ts, text: messages})
    } catch (err) {
      core.setFailed(err);
      return;
    }
  } else {
    core.setFailed('Message could not be found');
  }
}


const react = async () => {
  // eslint-disable-next-line no-unused-vars
  const {payload} = github.context
  const channelId = core.getInput('channel-id');
  const botToken = core.getInput('slack-bot-token');

  // eslint-disable-next-line no-eval
  const stringMatcher = eval(core.getInput('string-matcher'));
  // eslint-disable-next-line no-eval
  const messages = core.getInput('message');

  const client = new WebClient(botToken);
  const conversations = await client.conversations.history({ token: botToken, channel: channelId })
  const message = conversations.messages.find((m)=> m.text.includes(stringMatcher))

  if (message !== undefined){
    await client.reactions.add({ token: botToken, channel: channelId, name: messages })
  } else {
    core.setFailed('Message could not be found');
  }
}

async function run() {
  const action = core.getInput('action');

  switch(action) {
    case POST_ACTION:
      await post()
      break;
    case UPDATE_ACTION:
      await update()
      break;
    case REPLY_ACTION:
      await reply()
      break;
    case REACT_ACTION:
      await react()
      break;
    default:
      core.setFailed(`Action ${action} does not exist`);
      break;
  }

}

run();
