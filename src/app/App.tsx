import { useEffect } from 'react';
import { PixelGame } from './components/PixelGame';
import { setFavicon } from './components/pixel-game/ui/favicon';

export default function App() {
  useEffect(() => { setFavicon(); }, []);
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <PixelGame />
    </div>
  );
}
