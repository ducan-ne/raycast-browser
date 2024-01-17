import { createBrowserAPI } from './base.js'
import PusherClient from 'pusher-js'

export const browser = createBrowserAPI(PusherClient)