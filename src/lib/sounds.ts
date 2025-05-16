let audioContext: AudioContext | null = null;
let spinSoundBuffer: AudioBuffer | null = null;
let spinSoundSource: AudioBufferSourceNode | null = null;

interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export async function loadSounds() {
  try {
    // Audio Context erstellen (nur im Browser)
    const win = window as WindowWithAudioContext;
    const AudioContextClass = window.AudioContext || win.webkitAudioContext;
    
    if (!AudioContextClass) {
      console.warn('Web Audio API wird nicht unterstützt');
      return;
    }
    
    audioContext = new AudioContextClass();
    
    // Sound-Datei laden
    const response = await fetch('/sound/spin-232536.mp3');
    const arrayBuffer = await response.arrayBuffer();
    spinSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Fehler beim Laden der Sounds:', error);
  }
}

export function playSpinSound() {
  if (!audioContext || !spinSoundBuffer) {
    console.warn('Audio nicht geladen');
    return () => {};
  }

  // Bestehenden Sound stoppen, falls vorhanden
  stopSpinSound();

  // Neuen Sound erstellen
  spinSoundSource = audioContext.createBufferSource();
  spinSoundSource.buffer = spinSoundBuffer;
  spinSoundSource.loop = true;
  spinSoundSource.connect(audioContext.destination);
  spinSoundSource.start();

  // Funktion zum Stoppen zurückgeben
  return stopSpinSound;
}

export function stopSpinSound() {
  if (spinSoundSource) {
    try {
      spinSoundSource.stop();
      spinSoundSource.disconnect();
    } catch (e) {
      console.warn('Konnte Sound nicht stoppen:', e);
    }
    spinSoundSource = null;
  }
}
