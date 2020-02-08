# public-texting
create a public record of a text convo proxy'd through twilio


## Development

- add a .env file with TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (can be found on the twilio dashboard)

- in one console `yarn start`
- in another `ngrok http 3000`
- update the webhook in twilio to post to the new ngrok endpoint `/messages`

## Todos

- add a database
- add the concept of a conversation (dont hardcode it to luiza and willis)
- create a simple html representation of a conversation
- expose a frontend for creating a new conversation
