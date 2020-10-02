import React from 'react'
import { Card, Elevation, H5, Button } from '@blueprintjs/core'
import { SettingsButton } from './Settings'
import { ipcMain, OpenDialogOptions } from 'electron'
import { DeltaBackend } from '../../delta-remote'
import { confirmationDialogLegacy as confirmationDialog } from './ConfirmationDialog'
import { ipcBackend } from '../../ipc'

const { remote } = window.electron_functions

function onKeysImport() {
  const tx = window.static_translate

  const opts: OpenDialogOptions = {
    title: tx('pref_managekeys_import_secret_keys'),
    defaultPath: remote.app.getPath('downloads'),
    properties: ['openDirectory'],
  }

  remote.dialog
    .showOpenDialog(remote.getCurrentWindow(), opts)
    .then(returnValue => {
      const filenames = returnValue.filePaths

      if (!filenames || !filenames.length) return

      const title = tx('pref_managekeys_import_explain', filenames[0])
      confirmationDialog(title, (response: todo) => {
        if (!response) return
        const text = tx(
          'pref_managekeys_secret_keys_imported_from_x',
          filenames[0]
        )
        ipcBackend.on('DC_EVENT_IMEX_PROGRESS', (_event, progress) => {
          if (progress !== 1000) return
          this.props.userFeedback({ type: 'success', text })
        })
        DeltaBackend.call('settings.keysImport', filenames[0])
      })
    })
}

function onKeysExport() {
  // TODO: ask for the user's password and check it using
  // var matches = ipcRenderer.sendSync('dispatchSync', 'checkPassword', password)
  const tx = window.static_translate

  const opts: OpenDialogOptions = {
    title: tx('pref_managekeys_export_secret_keys'),
    defaultPath: remote.app.getPath('downloads'),
    properties: ['openDirectory'],
  }

  remote.dialog.showOpenDialog(remote.getCurrentWindow()).then(returnValue => {
    const filenames = returnValue.filePaths

    if (!filenames || !filenames.length) return
    const title = tx('pref_managekeys_export_explain').replace(
      '%1$s',
      filenames[0]
    )
    confirmationDialog(title, (response: todo) => {
      if (!response || !filenames || !filenames.length) return
      ipcBackend.once('DC_EVENT_IMEX_FILE_WRITTEN', (_event, filename) => {
        this.props.userFeedback({
          type: 'success',
          text: tx('pref_managekeys_secret_keys_exported_to_x', filename),
        })
      })

      DeltaBackend.call('settings.keysExport', filenames[0])
    })
  })
}

export default function SettingsManageKeys() {
  const tx = window.static_translate
  return (
    <>
      <Card elevation={Elevation.ONE}>
        <H5>{tx('pref_managekeys_menu_title')}</H5>
        <SettingsButton onClick={onKeysExport}>
          {tx('pref_managekeys_export_secret_keys')}...
        </SettingsButton>
        <SettingsButton onClick={onKeysImport}>
          {tx('pref_managekeys_import_secret_keys')}...
        </SettingsButton>
      </Card>
    </>
  )
}
