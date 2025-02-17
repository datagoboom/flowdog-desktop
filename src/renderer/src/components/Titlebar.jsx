import { Minus, Square, X } from 'lucide-react'
import logoSm from '../assets/logo_sm.png'

export function Titlebar() {
  const handleMinimize = () => {
    window.electron.ipcRenderer.send('minimize-window')
  }

  const handleMaximize = () => {
    window.electron.ipcRenderer.send('maximize-window')
  }

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-window')
  }

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <img src={logoSm} alt="FlowDog Logo" className="titlebar-logo" />
        <span className="titlebar-text">FLOWDOG</span>
      </div>
      <div className="window-controls">
        <button onClick={handleMinimize} className="window-control-btn">
          <Minus size={16} />
        </button>
        <button onClick={handleMaximize} className="window-control-btn">
          <Square size={16} />
        </button>
        <button onClick={handleClose} className="window-control-btn">
          <X size={16} />
        </button>
      </div>
    </div>
  )
} 