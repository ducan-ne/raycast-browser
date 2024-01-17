import { ActionPanel, Detail, List, Action, useNavigation } from '@raycast/api'
import { usePromise } from '@raycast/utils'
import { browser } from 'browser-api/node'
import { useState } from 'react'

export default function Command() {
  const {push} = useNavigation()
  const tabs = usePromise(() => browser.tabs.query({}), [])
  const [detail, setDetail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  return (
    <List isLoading={tabs.isLoading || isLoading}>
      {tabs.data?.map(tab => (
        <List.Item
          icon={tab.favIconUrl}
          key={tab.id}
          title={tab.title || '-'}
          actions={
            <ActionPanel>
              <Action
                title="Show Details"
                onAction={async() => {
                  setIsLoading(true)
                  push(
                    <Detail markdown={`# document.title: ${await browser.executeScript(tab.id!, () => document.title)}`} />
                  )
                  setIsLoading(false)
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}
