// IntuitAssistPage.tsx — Intuit Assist floating bubble + drawer chat interface
import { useState, useRef, useCallback } from 'react'
import { Drawer, DrawerHeader, DrawerContent } from '@ids-ts/drawer'
import '@ids-ts/drawer/dist/main.css'
import { AccessPointButton } from '@genux-ds/access-point-button'
import '@genux-ds/access-point-button/dist/main.css'
import { SchemaGreeting } from '@genux-ds/greeting'
import '@genux-ds/greeting/dist/main.css'
import { AnimatedBrand } from '@genux-ds/animated-brand'
import '@genux-ds/animated-brand/dist/main.css'
import { StarterPrompt, StarterPromptGroup } from '@genux-ds/starter-prompt'
import '@genux-ds/starter-prompt/dist/main.css'
import { Chat, MessageSenderType } from '@genux-ds/chat'
import type { ChatMessage, MessageSender } from '@genux-ds/chat'
import '@genux-ds/chat/dist/main.css'
import { SuggestionChip, SuggestionChipGroup } from '@genux-ds/suggestion-chip'
import '@genux-ds/suggestion-chip/dist/main.css'
import { Badge } from '@genux-ds/badge'
import '@genux-ds/badge/dist/main.css'
import { RichTextInput } from '@genux-ds/rich-text-input'
import type { InputHandle } from '@genux-ds/rich-text-input'
import '@genux-ds/rich-text-input/dist/main.css'
import styles from '../styles/IntuitAssistPage.module.css'

const ASSISTANT_SENDER: MessageSender = {
  id: 'intuit-assist',
  type: MessageSenderType.ASSISTANT,
  name: 'Intuit Assist',
}

const USER_SENDER: MessageSender = {
  id: 'user',
  type: MessageSenderType.USER,
  name: 'You',
}

const GREETING_SCHEMA = [
  { label: 'Hi, I\u2019m', ramp: 'D4' },
  { label: 'Intuit Assist', ramp: 'D4', weight: 'demi' },
]

const STARTER_PROMPTS = [
  'How do I create an invoice?',
  'Show me my cash flow',
  'Help me categorize expenses',
  'What tax deductions can I claim?',
]

const SUGGESTION_CHIPS = [
  'Tell me more about invoicing',
  'How do I track mileage?',
  'Explain my profit & loss',
]

function makeDemoReply(userText: string): string {
  return `Great question! Let me help you with \u201c${userText.toLowerCase()}\u201d. This is a demo response \u2014 in a real integration, Intuit Assist would provide a detailed answer here.`
}

export default function IntuitAssistBubble() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: ASSISTANT_SENDER,
      message:
        'I\u2019m Intuit Assist, your AI-powered financial assistant. I can help you manage invoices, track expenses, understand your cash flow, and more. What would you like to do?',
    },
  ])
  const [showGreeting, setShowGreeting] = useState(true)
  const inputRef = useRef<InputHandle>(null)

  const addExchange = useCallback((userText: string) => {
    setShowGreeting(false)
    const now = Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${now}`,
        sender: USER_SENDER,
        message: userText,
      },
      {
        id: `assist-${now}`,
        sender: ASSISTANT_SENDER,
        message: makeDemoReply(userText),
      },
    ])
  }, [])

  const handleSend = useCallback(
    (editor: { getText: () => string }) => {
      const text = editor.getText().trim()
      if (!text) return
      addExchange(text)
      inputRef.current?.clearContent()
    },
    [addExchange],
  )

  return (
    <>
      <div className={styles.fab}>
        <AccessPointButton mode="diy" active={open} onClick={() => setOpen(true)}>
          Intuit Assist
        </AccessPointButton>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} size="medium" backdrop>
        <DrawerHeader title="Intuit Assist" onClose={() => setOpen(false)} />
        <DrawerContent>
          <div className={styles.drawerBody}>
            <div className={styles.chatArea}>
              {showGreeting && (
                <div className={styles.greetingSection}>
                  <div className={styles.brandWrapper}>
                    <AnimatedBrand animationType="intuitAssistWorking" size={64} />
                  </div>
                  <SchemaGreeting schema={GREETING_SCHEMA} animate />
                  <p className={styles.subtitle}>Your AI-powered financial assistant</p>
                  <StarterPromptGroup layout="wrap" disappearOnSelection animate>
                    {STARTER_PROMPTS.map((text) => (
                      <StarterPrompt key={text} onClick={() => addExchange(text)}>
                        {text}
                      </StarterPrompt>
                    ))}
                  </StarterPromptGroup>
                </div>
              )}

              <div className={styles.messages}>
                <Chat messages={messages} showAvatar animateLastMessage />
              </div>

              {messages.length > 1 && (
                <div className={styles.suggestionChips}>
                  <SuggestionChipGroup layout="row" alignment="center" animate>
                    {SUGGESTION_CHIPS.map((chip) => (
                      <SuggestionChip key={chip} onClick={() => addExchange(chip)}>
                        {chip}
                      </SuggestionChip>
                    ))}
                  </SuggestionChipGroup>
                </div>
              )}
            </div>

            <div className={styles.inputArea}>
              <Badge label="Intuit Assist" />
              <RichTextInput
                ref={inputRef}
                onSend={handleSend}
                placeholder="Ask Intuit Assist anything..."
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
