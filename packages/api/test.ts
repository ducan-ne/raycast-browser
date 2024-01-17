import { browser } from './index'

// console.log(await browser.tabs.getCurrent())
// console.log(await browser.cookies.set({
//   name: '123',
//   value: '123',
//   httpOnly: true,
//   url: 'https://www.google.com',
// }))

// console.log(await browser.tabs.query({ active: true }))

// console.log('result', await browser.cookies.getAll({url: 'https://www.facebook.com'}))

const [tab] = await browser.tabs.query({ active: true })

// await browser.scripting.insertCSS({
//   target: { tabId: tab.id! },
//   css: `body { background-color: red !important; }`
// })

// await browser.scripting
//   .executeScript({
//     target: { tabId: tab.id!, allFrames: true },
//     func: `document.title`,
//   })
//   .then(injectionResults => {
//     for (const { frameId, result } of injectionResults) {
//       console.log(`Frame ${frameId} result:`, result)
//     }
//   })

console.log(await browser.tabs.sendMessage(tab.id!, { code: `document.title` }))
console.log(await browser.executeScript(tab.id!, () => {
  document.body.style.backgroundColor = 'red'
}))
console.log(await browser.executeScriptCurrentTab(() => document.title))

process.exit()