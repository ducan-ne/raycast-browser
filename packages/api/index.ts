import { createBrowserAPI } from './base.js'
import PusherClient from 'pusher-js/worker'

export const browser = createBrowserAPI(PusherClient)