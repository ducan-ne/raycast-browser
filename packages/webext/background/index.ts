import { Request, Response } from 'packages/api/base.js'
import PusherClient from 'pusher-js/worker'
import Pusher from 'pusher'
// @ts-ignore
const client = new PusherClient('app-key', {
  cluster: "",
  httpHost: "127.0.0.1",
  httpPort: 6001,
  wsHost: "127.0.0.1",
  wsPort: 6001,
  wssPort: 6001,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
})
const pusher = new Pusher({
  port: '6001',
  host: 'localhost',
  appId: "app-id",
  key: "app-key",
  secret: "app-secret",
  cluster: ''
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
    return pusher.trigger('raycast-browser', 'responses', {
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
    await pusher.trigger('raycast-browser', 'responses', {
      requestId: request.requestId,
      data,
    } satisfies Response)
  } catch (e: any) {
    await pusher.trigger('raycast-browser', 'responses', {
      requestId: request.requestId,
      data: e.message,
    } satisfies Response)
  }
}
client.connect()
client.subscribe('raycast-browser').bind('commands', listener)

