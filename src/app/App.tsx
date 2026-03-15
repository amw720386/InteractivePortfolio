import { PixelGame } from './components/PixelGame'

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000',
      margin: 0,
      padding: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <PixelGame />
    </div>
  )
}