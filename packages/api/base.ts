import Pusher from 'pusher'
import type PusherClient from 'pusher-js/worker'
import { EventEmitter, on } from 'events'
import { randomUUID } from 'crypto'

type ProxyCallbackOptions = {
  path: string[];
  args: unknown[];
}

export type Request = ProxyCallbackOptions & {
  requestId: string
}
export type Response = {
  requestId: string
  data?: unknown
  error?: string
}


function createRecursiveProxy(callback: (opts: ProxyCallbackOptions) => unknown, path: string[]) {
  const proxy = new Proxy(
    () => {
    },
    {
      get(_, key) {
        if (typeof key !== 'string') return undefined
        return createRecursiveProxy(callback, [...path, key])
      },
      apply(_, __, args) {
        return callback({
          path,
          args,
        })
      },
    },
  ) as unknown

  return proxy
}

const ee = new EventEmitter()

export function createBrowserAPI(Client: typeof PusherClient) {
  // @ts-expect-error invalid type
  const client = new Client('app-key', {
    cluster: '',
    httpHost: '127.0.0.1',
    httpPort: 6001,
    wsHost: '127.0.0.1',
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
  })
  const pusher = new Pusher({
    port: '6001',
    host: 'localhost',
    appId: 'app-id',
    key: 'app-key',
    secret: 'app-secret',
    cluster: ''
  })

  const listener = (message: any) => {
    ee.emit('responses', message)
  }
  client.connect()
  client.connection.bind('connected', () => {
    client.subscribe('raycast-browser').bind('responses', listener)
  })

  type BrowserAPI = typeof chrome & {
    executeScript<F extends () => unknown>(
      tabId: number,
      func: F,
      args: unknown[]
    ): Promise<ReturnType<F>>
    executeScriptCurrentTab<F extends () => unknown>(
      func: F,
      args: unknown[]
    ): Promise<ReturnType<F>>
    // TODO
    executeScriptInBackground(
      func: () => unknown
    ): unknown
  }

  const browser = createRecursiveProxy(async (opts) => {
    const send = async (opts: ProxyCallbackOptions) => {
      const requestId = randomUUID()
      await pusher.trigger('raycast-browser', 'commands', {
        requestId,
        path: opts.path,
        args: opts.args,
      } satisfies Request)
      for await (const [event] of on(ee, 'responses')) {
        const res = event as Response
        if (res.requestId === requestId) {
          if (res.error) throw new Error(res.error)
          return res.data
        }
      }
      throw new Error('No response')
    }
    if (opts.path[0] === 'executeScript') {
      const [tabId, func, args] = opts.args as Parameters<BrowserAPI['executeScript']>
      return send({
        path: ['tabs', 'sendMessage'],
        args: [tabId, { code: `(${func.toString()})(...${JSON.stringify(args)})` }],
      })
    }
    if (opts.path[0] === 'executeScriptCurrentTab') {
      const [func, args] = opts.args as Parameters<BrowserAPI['executeScriptCurrentTab']>
      const [tab] = await send({
        path: ['tabs', 'query'],
        args: [{ active: true }],
      }) as Awaited<ReturnType<BrowserAPI['tabs']['query']>>
      return send({
        path: ['tabs', 'sendMessage'],
        args: [tab.id, { code: `(${func.toString()})(...${JSON.stringify(args)})` }],
      })
    }
    return send(opts)
  }, []) as BrowserAPI
  return browser
}