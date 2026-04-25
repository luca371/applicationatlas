import React, { useState, useEffect, useRef } from 'react';
import FirstScreen  from './screens/FirstScreen';
import SecondScreen from './screens/SecondScreen';
import ThirdScreen  from './screens/ThirdScreen';
import FourthScreen from './screens/FourthScreen';
import FifthScreen  from './screens/FifthScreen';
import SixthScreen  from './screens/SixthScreen';
import './App.css';

const App = () => {
  const [scene, setScene] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio('/dont-stop-believin.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleMusicStart = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleFifthComplete = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setScene(6);
  };

  return (
    <div className="App">
      {scene === 1 && <FirstScreen  onComplete={() => setScene(2)} onMusicStart={handleMusicStart} />}
      {scene === 2 && <SecondScreen onComplete={() => setScene(3)} />}
      {scene === 3 && <ThirdScreen  onComplete={() => setScene(4)} />}
      {scene === 4 && <FourthScreen onComplete={() => setScene(5)} />}
      {scene === 5 && <FifthScreen  onComplete={handleFifthComplete} />}
      {scene === 6 && <SixthScreen />}
    </div>
  );
};

export default App;