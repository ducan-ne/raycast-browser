import { hop } from '@onehop/client'
import { HOP_CHANNEL_EVENT, HOP_CHANNEL_ID } from './config'

const client = hop.init({
  projectId: 'project_MTA2NTQ3MDQ1NTY5MjMzMDA1',
  token: 'leap_token_c19lNjUxOGUxMGJhZWIzNjI0NzEyMjc5YzRmNTkwZTNhYV8yMzE4MDc4Mzc0OTE3MDU5OTE'
})

const listener = (message: any) => {
  console.log(message)
}

client.getDirectMessageListeners().set(HOP_CHANNEL_EVENT, new Set([listener]))
