
let audioContext: AudioContext | null = null;

let spinSoundBuffer: AudioBuffer | null = null;
let spinSoundSource: AudioBufferSourceNode | null = null;

let winSoundBuffer: AudioBuffer | null = null;
let winSoundSource: AudioBufferSourceNode | null = null;

let gainNode: GainNode | null = null;

let isLoadingSound = false;
const soundsLoaded = {
  spin: false,
  win: false
};

interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Lädt alle Sounddateien und initialisiert den Audio-Kontext
 * @returns Promise<boolean> True, wenn das Laden erfolgreich war
 */
export async function loadSounds(): Promise<boolean> {
  if (soundsLoaded.spin && soundsLoaded.win && !isLoadingSound) {
    return true;
  }

  isLoadingSound = true;
  
  try {
    if (!audioContext) {
      const win = window as WindowWithAudioContext;
      const AudioContextClass = window.AudioContext || win.webkitAudioContext;
      
      if (!AudioContextClass) {
        console.warn('Web Audio API wird nicht unterstützt');
        isLoadingSound = false;
        return false;
      }
      
      audioContext = new AudioContextClass();
    }
    
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (e) {
        console.warn('Audio-Kontext konnte nicht aktiviert werden:', e);
      }
    }
    
    const loadingPromises = [];
    
    if (!spinSoundBuffer) {
      const spinLoadPromise = fetch('/sound/spin-232536.mp3')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Spin-Sound konnte nicht geladen werden: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext!.decodeAudioData(arrayBuffer))
        .then(buffer => {
          spinSoundBuffer = buffer;
          soundsLoaded.spin = true;
          console.log('Spin-Sound geladen');
        })
        .catch(error => {
          console.error('Fehler beim Laden des Spin-Sounds:', error);
        });
      
      loadingPromises.push(spinLoadPromise);
    } else {
      soundsLoaded.spin = true;
    }
    
    if (!winSoundBuffer) {
      const winLoadPromise = fetch('/sound/win.mp3')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Win-Sound konnte nicht geladen werden: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext!.decodeAudioData(arrayBuffer))
        .then(buffer => {
          winSoundBuffer = buffer;
          soundsLoaded.win = true;
          console.log('Win-Sound geladen');
        })
        .catch(error => {
          console.error('Fehler beim Laden des Win-Sounds:', error);
        });
      
      loadingPromises.push(winLoadPromise);
    } else {
      soundsLoaded.win = true;
    }
    
    await Promise.all(loadingPromises);
    
    isLoadingSound = false;
    return soundsLoaded.spin && soundsLoaded.win;
  } catch (error) {
    console.error('Fehler beim Laden der Sounds:', error);
    isLoadingSound = false;
    return false;
  }
}

/**
 * Spielt den Spin-Sound ab
 * @returns Funktion zum Stoppen des Sounds
 */
export function playSpinSound() {
  const forceInitAudio = async () => {
    try {
      console.log('Versuche Audio zu initialisieren nach Benutzerinteraktion...');
      
      if (!audioContext) {
        const win = window as WindowWithAudioContext;
        const AudioContextClass = window.AudioContext || win.webkitAudioContext;
        
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          console.log('Neuer AudioContext erstellt:', audioContext.state);
        } else {
          console.error('AudioContext wird von diesem Browser nicht unterstützt');
          return false;
        }
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext entsperrt, neuer Status:', audioContext.state);
      }
      
      if (!spinSoundBuffer) {
        console.log('Lade Sounddateien...');
        const loaded = await loadSounds();
        console.log('Sounds geladen:', loaded);
      }
      
      return audioContext.state === 'running' && !!spinSoundBuffer;
    } catch (e) {
      console.error('Audio-Initialisierung fehlgeschlagen:', e);
      return false;
    }
  };

  const playSound = async () => {
    try {
      stopSpinSound();
      
      if (!audioContext || !spinSoundBuffer || audioContext.state !== 'running') {
        const initialized = await forceInitAudio();
        if (!initialized) {
          console.error('Audio konnte nicht initialisiert werden');
          return;
        }
      }

      if (!audioContext || !spinSoundBuffer) return;
      
      spinSoundSource = audioContext.createBufferSource();
      spinSoundSource.buffer = spinSoundBuffer;
      spinSoundSource.loop = true;
      
      gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0; 
      
      spinSoundSource.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      spinSoundSource.start(0);
      console.log('Spin-Sound wird abgespielt!');
    } catch (error) {
      console.error('Fehler beim Abspielen des Sounds:', error);
    }
  };

  playSound();

  return stopSpinSound;
}

async function forceInitAudio(): Promise<boolean> {
  try {
    console.log('Erzwungene Audio-Initialisierung...');
    
    if (!audioContext) {
      const win = window as WindowWithAudioContext;
      const AudioContextClass = window.AudioContext || win.webkitAudioContext;
      
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        console.log('Neuer AudioContext erstellt:', audioContext.state);
      } else {
        console.error('AudioContext wird von diesem Browser nicht unterstützt');
        return false;
      }
    }
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('AudioContext entsperrt, neuer Status:', audioContext.state);
    }
    
    return await loadSounds();
  } catch (e) {
    console.error('Fehler bei Audio-Initialisierung:', e);
    return false;
  }
}

export function stopSpinSound() {
  if (spinSoundSource) {
    try {
      spinSoundSource.stop();
      console.log('Spin-Sound gestoppt');
    } catch { // Catch ohne Parameter, da wir den Fehler nicht verwenden
      // Ignoriere Fehler beim Stoppen (z.B. wenn bereits gestoppt)
    } finally {
      spinSoundSource = null;
    }
  }
}

/**
 * Spielt den Gewinn-Sound ab
 * @param loop Optional: Ob der Sound wiederholt werden soll (default: false)
 * @returns Funktion zum Stoppen des Sounds
 */
export function playWinSound(loop: boolean = false) {
  const initAndPlayWinSound = async () => {
    try {
      if (!audioContext || !winSoundBuffer) {
        const initialized = await forceInitAudio();
        if (!initialized || !winSoundBuffer) {
          console.error('Win-Sound konnte nicht abgespielt werden: Sound nicht geladen');
          return;
        }
      }
      
      stopWinSound();
      
      if (audioContext && winSoundBuffer) {
        winSoundSource = audioContext.createBufferSource();
        winSoundSource.buffer = winSoundBuffer;
        winSoundSource.loop = loop;
        
        const winGainNode = audioContext.createGain();
        winGainNode.gain.value = 1.0; 
        
        winSoundSource.connect(winGainNode);
        winGainNode.connect(audioContext.destination);
        
        winSoundSource.start(0);
        console.log('Win-Sound wird abgespielt!');
      }
    } catch (error) {
      console.error('Fehler beim Abspielen des Win-Sounds:', error);
    }
  };
  
  initAndPlayWinSound();
  
  return stopWinSound;
}

/**
 * Stoppt den aktuell spielenden Win-Sound
 */
export function stopWinSound() {
  if (winSoundSource) {
    try {
      winSoundSource.stop();
      console.log('Win-Sound gestoppt');
    } catch { 
    } finally {
      winSoundSource = null;
    }
  }
}

/**
 * Stoppt alle aktuell spielenden Sounds
 */
export function stopAllSounds() {
  stopSpinSound();
  stopWinSound();
}
