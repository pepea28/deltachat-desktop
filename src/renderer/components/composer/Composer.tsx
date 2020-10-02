import React, { useRef, useState, useEffect, forwardRef } from 'react'
import { Button } from '@blueprintjs/core'

import { SettingsContext, useTranslationFunction } from '../../contexts'
import ComposerMessageInput from './ComposerMessageInput'
import { getLogger } from '../../../shared/logger'
import { EmojiAndStickerPicker } from './EmojiAndStickerPicker'
import { useChatStore } from '../../stores/chat'
import { EmojiData, BaseEmoji } from 'emoji-mart'
import { replaceColonsSafe } from '../conversations/emoji'
const { remote } = window.electron_functions

const log = getLogger('renderer/composer')

const insideBoundingRect = (
  mouseX: number,
  mouseY: number,
  boundingRect: DOMRect,
  margin = 0
) => {
  return (
    mouseX >= boundingRect.x - margin &&
    mouseX <= boundingRect.x + boundingRect.width + margin &&
    mouseY >= boundingRect.y - margin &&
    mouseY <= boundingRect.y + boundingRect.height + margin
  )
}

const Composer = forwardRef<
  any,
  {
    isDisabled: boolean
    disabledReason: string
    chatId: number
    draft: string
    setComposerSize: (size: number) => void
  }
>((props, ref) => {
  const { isDisabled, disabledReason, chatId, draft } = props
  const chatStoreDispatch = useChatStore()[1]
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const messageInputRef = useRef<ComposerMessageInput>()
  const emojiAndStickerRef = useRef<HTMLDivElement>()
  const pickerButtonRef = useRef()

  const sendMessage = () => {
    const message = messageInputRef.current.getText()
    if (message.match(/^\s*$/)) {
      log.debug(`Empty message: don't send it...`)
      return
    }
    chatStoreDispatch({
      type: 'SEND_MESSAGE',
      payload: [chatId, replaceColonsSafe(message), null],
    })

    messageInputRef.current.clearText()
    messageInputRef.current.focus()
  }

  const addFilename = () => {
    remote.dialog
      .showOpenDialog(remote.getCurrentWindow(), { properties: ['openFile'] })
      .then(returnValue => {
        const filenames = returnValue.filePaths
        if (filenames && filenames[0]) {
          chatStoreDispatch({
            type: 'SEND_MESSAGE',
            payload: [chatId, '', filenames[0]],
          })
        }
      })
  }

  const onEmojiIconClick = () => setShowEmojiPicker(!showEmojiPicker)

  const onEmojiSelect = (emoji: EmojiData) => {
    log.debug(`EmojiPicker: Selected ${emoji.id}`)
    messageInputRef.current.insertStringAtCursorPosition(
      (emoji as BaseEmoji).native
    )
  }

  useEffect(() => {
    if (!showEmojiPicker) return
    const onClick = ({
      clientX,
      clientY,
    }: {
      clientX: number
      clientY: number
    }) => {
      if (!emojiAndStickerRef.current) return
      const boundingRect = emojiAndStickerRef.current.getBoundingClientRect()
      const clickIsOutSideEmojiPicker = !insideBoundingRect(
        clientX,
        clientY,
        boundingRect,
        2
      )
      if (clickIsOutSideEmojiPicker) setShowEmojiPicker(false)
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [showEmojiPicker, emojiAndStickerRef])

  const tx = useTranslationFunction()

  if (isDisabled) {
    if (disabledReason) {
      return (
        <div ref={ref} className='composer composer--disabled-message-input'>
          {tx(disabledReason)}
        </div>
      )
    } else {
      return <span />
    }
  } else {
    return (
      <div className='composer' ref={ref}>
        <div className='composer__attachment-button'>
          <Button
            minimal
            icon='paperclip'
            onClick={addFilename.bind(this)}
            aria-label={tx('attachment')}
          />
        </div>
        <SettingsContext.Consumer>
          {({ desktopSettings }) => (
            <ComposerMessageInput
              ref={messageInputRef}
              enterKeySends={desktopSettings.enterKeySends}
              sendMessage={sendMessage}
              setComposerSize={props.setComposerSize}
              chatId={chatId}
              draft={draft}
            />
          )}
        </SettingsContext.Consumer>
        <div
          className='composer__emoji-button'
          ref={pickerButtonRef}
          onClick={onEmojiIconClick}
          aria-label={tx('emoji')}
        >
          <span />
        </div>
        {showEmojiPicker && (
          <EmojiAndStickerPicker
            chatId={chatId}
            ref={emojiAndStickerRef}
            onEmojiSelect={onEmojiSelect}
            setShowEmojiPicker={setShowEmojiPicker}
          />
        )}
        <div className='composer__send-button-wrapper' onClick={sendMessage}>
          <button aria-label={tx('menu_send')} />
        </div>
      </div>
    )
  }
})

export default Composer
