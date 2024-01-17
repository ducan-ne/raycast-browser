import { hop as HopClient } from '@onehop/client'
import {
  HOP_CHANNEL_EVENT,
  HOP_CHANNEL_RESPONSE_EVENT,
  HOP_CHANNEL_TOKEN, HOP_PROJECT_ID,
  HOP_PROJECT_TOKEN
} from 'browser-api/config.js'
import { Hop } from '@onehop/js'
import { Request, Response } from 'browser-api'

const hop = new Hop({
  authentication: HOP_PROJECT_TOKEN
})
const client = HopClient.init({
  projectId: HOP_PROJECT_ID,
  token: HOP_CHANNEL_TOKEN,
})

// @ts-ignore
chrome.userScripts.getScripts().then(console.log)

// @ts-expect-error - a hack to get around the fact that the types are wrong
chrome.userScripts.configureWorld({
  csp: 'script-src \'self\' \'unsafe-eval\'',
  messaging: true,
})

// @ts-expect-error - a hack to get around the fact that the types are wrong
chrome.userScripts.register([{
  id: '1',
  runAt: 'document_start',
  matches: ['<all_urls>'],
  js: [{
    code: 'chrome.runtime.onMessage.addListener(fn);' +
      function fn(msg, sender, sendResponse) {
        if (msg.code) {
          sendResponse(eval(msg.code))
        }
      },
  }],
}])

const listener = async (message: any) => {
  const request = message as Request
  let method
  for (const path of request.path) {
    method = method ? method[path] : chrome[path as keyof typeof chrome] as any
  }
  if (!method) {
    return hop.channels.tokens.publishDirectMessage(HOP_CHANNEL_TOKEN, HOP_CHANNEL_RESPONSE_EVENT, {
      requestId: request.requestId,
      error: 'Unknown error, method could not be found'
    } satisfies Response)
  }
  try {
    const refinedArgs = request.args.map(arg => {
      // scripting api
      if (typeof arg === 'object' && 'func' in arg!) {
        const myFunc = (func: any) => {
          const script = document.createElement('script')
          script.src = `data:text/javascript;base64,${btoa(`(${func.toString()})()`)}`
          document.documentElement.appendChild(script)
        }
        return {
          ...arg,
          func: myFunc,
          args: [arg.func]
        }
      }
      return arg
    })
    const data = await method(...refinedArgs)
    await hop.channels.tokens.publishDirectMessage(HOP_CHANNEL_TOKEN, HOP_CHANNEL_RESPONSE_EVENT, {
      requestId: request.requestId,
      data,
    } satisfies Response)
  } catch (e: any) {
    await hop.channels.tokens.publishDirectMessage(HOP_CHANNEL_TOKEN, HOP_CHANNEL_RESPONSE_EVENT, {
      requestId: request.requestId,
      error: e.message,
    } satisfies Response)
  }
}

client.getDirectMessageListeners().set(HOP_CHANNEL_EVENT, new Set([listener]))
