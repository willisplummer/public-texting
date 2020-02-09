# public-texting
create a public record of a text convo proxy'd through twilio

## Development

- add a .env file with TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (can be found on the twilio dashboard)

- in one console `yarn start`
- in another `ngrok http 3000`
- update the webhook in twilio to post to the new ngrok endpoint `/messages`

## Deployment

We're using heroku: `git push heroku master`

To access the heroku db:
- `heroku addons` (displays the name of the pg instance)
- `heroku pg:psql INSTANCE_NAME --app public-texting`

To view the logs: `heroku logs --app public-texting`

## Todos

- real time updating
- a way to create new convos w existing users
- images
