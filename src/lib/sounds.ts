
export const SOUNDS = {
  CARD_PLAY: 'https://www.soundjay.com/misc/sounds/card-flip-1.mp3', // Reliable flip
  TRICK_WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Distinctive 'Yes!' / Cheering
  DEAL: 'https://www.soundjay.com/misc/sounds/shuffling-cards-1.mp3', // Detailed shuffle
  GAME_START: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Gentle chime
  BGM: 'https://assets.mixkit.co/music/preview/mixkit-soft-ambient-624.mp3', // Ambient
};

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  play(key: keyof typeof SOUNDS) {
    if (this.isMuted) return;
    try {
      if (!this.sounds[key]) {
        this.sounds[key] = new Audio(SOUNDS[key]);
        this.sounds[key].addEventListener('error', (e) => {
          console.warn(`Failed to load sound: ${key}`, e);
        });
      }
      const sound = this.sounds[key];
      sound.volume = (key === 'TRICK_WIN') ? 0.3 : 0.15; 
      sound.currentTime = 0;
      sound.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          console.warn('Audio play failed:', e.message);
        }
      });
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  startBGM() {
    if (this.bgm || this.isMuted) return;
    try {
      this.bgm = new Audio(SOUNDS.BGM); 
      this.bgm.loop = true;
      this.bgm.volume = 0.05;
      this.bgm.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          console.warn('BGM play failed:', e.message);
        }
      });
    } catch (e) {
      console.error('BGM error:', e);
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
