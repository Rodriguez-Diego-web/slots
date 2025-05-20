// Sound-Status und -Ressourcen
let audioContext: AudioContext | null = null;

// Spin Sound
let spinSoundBuffer: AudioBuffer | null = null;
let spinSoundSource: AudioBufferSourceNode | null = null;

// Win Sound
let winSoundBuffer: AudioBuffer | null = null;
let winSoundSource: AudioBufferSourceNode | null = null;

// Audio-Steuerung
let gainNode: GainNode | null = null;

// Flags, um zu verfolgen, ob Sound-Ladevorgänge laufen
let isLoadingSound = false;
const soundsLoaded = { // 'const' statt 'let' da es ein Objekt ist, das nie neu zugewiesen wird
  spin: false,
  win: false
};


// Typdefinition für Browser-Kompatibilität
interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Lädt alle Sounddateien und initialisiert den Audio-Kontext
 * @returns Promise<boolean> True, wenn das Laden erfolgreich war
 */
export async function loadSounds(): Promise<boolean> {
  // Wenn alle Sounds bereits geladen sind, nicht erneut laden
  if (soundsLoaded.spin && soundsLoaded.win && !isLoadingSound) {
    return true;
  }

  isLoadingSound = true;
  
  try {
    // 1. Audio-Kontext erstellen oder wiederverwenden
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
    
    // 2. Audio-Kontext aktivieren, wenn er suspendiert ist
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (e) {
        console.warn('Audio-Kontext konnte nicht aktiviert werden:', e);
      }
    }
    
    // 3. Sound-Dateien laden
    const loadingPromises = [];
    
    // Spin-Sound laden
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
    
    // Win-Sound laden
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
    
    // Warten, bis alle Sounds geladen sind
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
  // Direkte Benutzerinteraktion - versuche, den AudioContext zu erstellen oder zu entsperren
  const forceInitAudio = async () => {
    try {
      console.log('Versuche Audio zu initialisieren nach Benutzerinteraktion...');
      
      // Erstelle AudioContext falls nötig
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
      
      // Versuche, den AudioContext zu entsperren (erfordert Benutzerinteraktion)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext entsperrt, neuer Status:', audioContext.state);
      }
      
      // Lade Sounds, falls noch nicht geschehen
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

  // Haupt-Funktion zum Abspielen des Sounds
  const playSound = async () => {
    try {
      // 1. Bestehenden Sound stoppen
      stopSpinSound();
      
      // 2. Prüfen, ob AudioContext und Sound bereit sind
      if (!audioContext || !spinSoundBuffer || audioContext.state !== 'running') {
        const initialized = await forceInitAudio();
        if (!initialized) {
          console.error('Audio konnte nicht initialisiert werden');
          return;
        }
      }

      // 3. Neuen Sound erstellen mit Lautstärkekontrolle
      // Nach der vorherigen Prüfung und Initialisierung sollte audioContext nicht null sein
      if (!audioContext || !spinSoundBuffer) return; // Sicherheitsprüfung
      
      spinSoundSource = audioContext.createBufferSource();
      spinSoundSource.buffer = spinSoundBuffer;
      spinSoundSource.loop = true;
      
      // Lautstärkeregler mit höherer Lautstärke
      gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0; // 100% Lautstärke
      
      spinSoundSource.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 4. Sound starten
      spinSoundSource.start(0);
      console.log('Spin-Sound wird abgespielt!');
    } catch (error) {
      console.error('Fehler beim Abspielen des Sounds:', error);
    }
  };

  // Starte den Sound sofort
  playSound();
  
  // Funktion zum Stoppen zurückgeben
  return stopSpinSound;
}

/**
 * Erzwinge die Initialisierung des Audio-Kontexts und lade Sounds
 */
async function forceInitAudio(): Promise<boolean> {
  try {
    console.log('Erzwungene Audio-Initialisierung...');
    
    // Erstelle AudioContext falls nötig
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
    
    // Versuche, den AudioContext zu entsperren
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('AudioContext entsperrt, neuer Status:', audioContext.state);
    }
    
    // Lade Sounds
    return await loadSounds();
  } catch (e) {
    console.error('Fehler bei Audio-Initialisierung:', e);
    return false;
  }
}

/**
 * Stoppt den aktuell spielenden Spin-Sound
 */
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
  // Sound-Initialisierung bei Benutzerinteraktion
  const initAndPlayWinSound = async () => {
    try {
      // 1. Sicherstellen, dass der AudioContext und Win-Sound geladen sind
      if (!audioContext || !winSoundBuffer) {
        const initialized = await forceInitAudio();
        if (!initialized || !winSoundBuffer) {
          console.error('Win-Sound konnte nicht abgespielt werden: Sound nicht geladen');
          return;
        }
      }
      
      // 2. Stoppe bestehenden Win-Sound
      stopWinSound();
      
      // 3. Neuen Sound erstellen
      if (audioContext && winSoundBuffer) { // Typensicherheit
        winSoundSource = audioContext.createBufferSource();
        winSoundSource.buffer = winSoundBuffer;
        winSoundSource.loop = loop;
        
        // Lautstärkeregler
        const winGainNode = audioContext.createGain();
        winGainNode.gain.value = 1.0; // 100% Lautstärke
        
        winSoundSource.connect(winGainNode);
        winGainNode.connect(audioContext.destination);
        
        // Sound starten
        winSoundSource.start(0);
        console.log('Win-Sound wird abgespielt!');
      }
    } catch (error) {
      console.error('Fehler beim Abspielen des Win-Sounds:', error);
    }
  };
  
  // Starte den Sound
  initAndPlayWinSound();
  
  // Funktion zum Stoppen zurückgeben
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
    } catch { // Catch ohne Parameter, da wir den Fehler nicht verwenden
      // Ignoriere Fehler beim Stoppen
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
