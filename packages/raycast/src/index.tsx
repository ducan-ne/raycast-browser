import { ActionPanel, Detail, List, Action, useNavigation } from '@raycast/api'
import { usePromise } from '@raycast/utils'
import { browser } from 'raycast-browser/node'
import { useState } from 'react'

export default function Command() {
  const { push } = useNavigation()
  const tabs = usePromise(
    () => browser.tabs.query({})
  )
  const [isLoading, setIsLoading] = useState(false)
  const cookies = usePromise(
    () => browser.cookies.getAll({
      url: 'https://www.facebook.com'
    })
  )
  // cookies.data[0].

  return (
    <List isLoading={tabs.isLoading || isLoading}>
      {tabs.data?.map(tab => {
        const actions = (
          <ActionPanel>
            <Action
              title="Show Details"
              onAction={async () => {
                setIsLoading(true)
                push(
                  <Detail
                    markdown={`
# document.title: ${await browser.executeScript(tab.id!, () => document.title)}
# github title: ${await browser.executeScript(tab.id!, () => document.querySelector('[class="f4 color-fg-muted col-md-6 mx-auto"]')?.textContent)}
                    `.trim()}
                  />
                )
                setIsLoading(false)
              }}
            />
            <Action
              title="Set background to red color"
              onAction={async () => {
                await browser.executeScript(tab.id!, () => {
                  document.body.style.background = 'red'
                })
              }}
            />
          </ActionPanel>
        )

        return (
          <List.Item
            icon={tab.favIconUrl}
            key={tab.id}
            title={tab.title || '-'}
            actions={actions}
          />
        )
      })}
    </List>
  )
}
