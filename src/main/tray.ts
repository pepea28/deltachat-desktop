import { app as rawApp, ipcMain, Menu, Tray } from 'electron'
import { globalShortcut } from 'electron'
import path from 'path'
import * as mainWindow from './windows/main'
import { ExtendedAppMainProcess } from './types'
import { getLogger } from '../shared/logger'
import { appIcon } from './application-constants'

let tray: Tray = null
let contextMenu: Menu = null

const app = rawApp as ExtendedAppMainProcess
const log = getLogger('main/tray')

ipcMain.on('updateTrayIcon', updateTrayIcon)

export function updateTrayIcon() {
  const tx = app.translate

  const IsMac = process.platform === 'darwin'
  if (IsMac) return

  if (app.state.saved.minimizeToTray !== true) {
    // User doesn't want tray icon => destroy it
    if (tray != null) {
      log.info('destroy icon tray')
      tray.destroy()
    }
  } else {
    // Add tray icon
    log.info('add icon tray')
    tray = new Tray(appIcon())
    const win = mainWindow.window
    contextMenu = Menu.buildFromTemplate([
      {
        id: 'open_windows',
        label: tx('global_menu_file_open_desktop'),
        type: 'normal',
        click() {
          win.show()
        },
      },
      {
        id: 'reduce_window',
        label: tx('global_menu_file_reduce_desktop'),
        type: 'normal',
        accelerator: 'Escape',
        click() {
          win.close()
        },
      },
      {
        id: 'quit_app',
        label: tx('global_menu_file_quit_desktop'),
        type: 'normal',
        click() {
          globalShortcut.unregisterAll()
          if (process.platform !== 'darwin') {
            app.quit()
          }
        },
      },
    ])
    tray.setToolTip('Delta Chat')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', (event, bounds) => {
      mainWindow.show()
    })
    tray.on('click', (event, bounds) => {
      mainWindow.show()
    })
  }

  updateTrayMenu()
}

export function updateTrayMenu() {
  if (contextMenu !== null) {
    contextMenu.getMenuItemById(
      'reduce_window'
    ).enabled = mainWindow.window.isVisible()

    // Called to update menu on Linux
    if (tray !== null && !tray.isDestroyed()) {
      tray.setContextMenu(contextMenu)
    }
  }
}
