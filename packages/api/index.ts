import { Hop } from '@onehop/js'
import {
  HOP_CHANNEL_EVENT,
  HOP_CHANNEL_ID,
  HOP_CHANNEL_RESPONSE_EVENT, HOP_CHANNEL_TOKEN,
  HOP_PROJECT_ID,
  HOP_PROJECT_TOKEN
} from './config'
import { EventEmitter, on } from 'events'
import { randomUUID } from 'crypto'
import { hop as HopClient } from '@onehop/client'

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

export const hop = new Hop({
  authentication: HOP_PROJECT_TOKEN
})

const client = HopClient.init({
  projectId: HOP_PROJECT_ID,
  token: HOP_CHANNEL_TOKEN,
})

const listener = (message: any) => {
  ee.emit('response', message)
}

client.getDirectMessageListeners().set(HOP_CHANNEL_RESPONSE_EVENT, new Set([listener]))

type BrowserAPI = typeof chrome & {
  executeScript(
    tabId: number,
    func: () => unknown
  ): unknown
  executeScriptCurrentTab(
    func: () => unknown
  ): unknown
}

export const browser = createRecursiveProxy(async (opts) => {
  const send = async (opts: ProxyCallbackOptions) => {
    const requestId = randomUUID()
    await hop.channels.tokens.publishDirectMessage(HOP_CHANNEL_TOKEN, HOP_CHANNEL_EVENT, {
      requestId,
      path: opts.path,
      args: opts.args,
    } satisfies Request)
    for await (const [event] of on(ee, 'response')) {
      const res = event as Response
      if (res.requestId === requestId) {
        if (res.error) throw new Error(res.error)
        return res.data
      }
    }
    throw new Error('No response')
  }
  if (opts.path[0] === 'executeScript') {
    const [tabId, func] = opts.args as Parameters<BrowserAPI['executeScript']>
    return send({
      path: ['tabs', 'sendMessage'],
      args: [tabId, { code: `(${func.toString()})()` }],
    })
  }
  if (opts.path[0] === 'executeScriptCurrentTab') {
    const [func] = opts.args as Parameters<BrowserAPI['executeScriptCurrentTab']>
    const [tab] = await send({
      path: ['tabs', 'query'],
      args: [{ active: true }],
    }) as Awaited<ReturnType<BrowserAPI['tabs']['query']>>
    return send({
      path: ['tabs', 'sendMessage'],
      args: [tab.id, { code: `(${func.toString()})()` }],
    })
  }
  return send(opts)
}, []) as BrowserAPI