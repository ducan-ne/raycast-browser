import * as fs from 'node:fs'
import { fetchToken, WebstoreApi, DownloadCrx } from 'typed-chrome-webstore-api'

const token = await fetchToken('989715661397-24urbjt3uvqa910o04i5521it170j6qa.apps.googleusercontent.com', process.env.SECRET as string, process.env.REFRESH_TOKEN as string)

const api = new WebstoreApi(token)

const readStream = await DownloadCrx.downloadCrx(
  'ijglpelkinnpklhgcejdildhomaglhag',
  '83.0.4103.116',
  ['crx3'],
)

fs.createWriteStream('chrome.crx').write(readStream)