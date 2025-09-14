export interface ElectronAPI {
  // File operations
  saveFile: (data: any) => Promise<{success: boolean, filePath?: string, error?: string}>
  loadFile: (filePath: string) => Promise<{success: boolean, data?: any, error?: string}>

  // Menu events
  onMenuNewProject: (callback: () => void) => void
  onMenuOpenProject: (callback: (event: any, filePath: string) => void) => void
  onMenuSaveProject: (callback: (event: any, filePath?: string) => void) => void
  onMenuImportPDF: (callback: (event: any, filePaths: string[]) => void) => void
  onMenuExportPDF: (callback: () => void) => void
  onMenuExportWord: (callback: () => void) => void

  // Platform info
  platform: string

  // Version info
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}