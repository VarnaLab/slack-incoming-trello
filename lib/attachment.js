
module.exports = () => {

  var text = (action) =>
    /createCard/.test(action.type)
    ? action.data.card.desc

    : /updateCard/.test(action.type)
    ? action.data.card[Object.keys(action.data.old)[0]]

    : /commentCard/.test(action.type)
    ? action.data.text

    : /addChecklistToCard/.test(action.type)
    ? action.data.checklist.name

    : /updateChecklist/.test(action.type)
    ? 'from ' + action.data.old.name + ' to ' + action.data.checklist.name

    : /updateCheckItemStateOnCard/.test(action.type)
    ? '_' + action.data.checkItem.state + '_ - ' + [
        action.data.checklist.name,
        action.data.checkItem.name
      ].join(' - ')

    : /addAttachmentToCard/.test(action.type)
    ? ''

    : /addMemberTo(Board|Card)/.test(action.type)
    ? '<https://trello.com/' + action.member.username + '|' +
        action.member.fullName + '>'

    : /updateBoard/.test(action.type)
    ? action.data.board[Object.keys(action.data.old)[0]]

    : ':wow: *' + action.type + '* is not implemented! :phone: @simo'

  var attachment = (action) => ((
    board = action.data.board || {},
    list = action.data.list || {},
    card = action.data.card || {}) => ({

    fallback: 'Trello Board Activity!'
    ,
    color: '#0089d9'
    ,
    pretext: '* ➤ ' + [
      board.name
        ? ('<https://trello.com/b/' + board.shortLink + '|' + board.name + '>')
        : '',
      (list.name || ''),
      card.name
        ? ('<https://trello.com/c/' + card.shortLink + '|' + card.name + '>')
        : ''
    ].filter(Boolean).join(' ➤ ') + '*'
    ,
    author_name: action.memberCreator.fullName
    ,
    author_link: 'https://trello.com/' + action.memberCreator.username
    ,
    author_icon: 'https://trello-avatars.s3.amazonaws.com/' +
      action.memberCreator.avatarHash + '/170.png'
    ,
    text: text(action)
    ,
    image_url: action.type === 'addAttachmentToCard' &&
      /\.(png|jpg)$/.test(action.data.attachment.previewUrl2x) &&
      action.data.attachment.previewUrl2x
    ,
    footer: action.type,
    footer_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/' +
      '2016-05-18/44042585718_0e6a837d5b63fd1cfc07_96.png'
    ,
    ts: new Date(action.date).getTime() / 1000
    ,
    mrkdwn_in: ['pretext', 'text']
    ,
  }))()

  return Object.assign(attachment, text)
}
