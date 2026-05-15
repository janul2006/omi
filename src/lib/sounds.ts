
export const SOUNDS = {
  CARD_PLAY: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Soft flick
  TRICK_WIN: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Success/Ding
  DEAL: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3', // Quick shuffle
  GAME_START: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3', // Fanfare light
};

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};

  play(key: keyof typeof SOUNDS) {
    try {
      if (!this.sounds[key]) {
        this.sounds[key] = new Audio(SOUNDS[key]);
      }
      const sound = this.sounds[key];
      sound.volume = 0.2; // 20% volume
      sound.currentTime = 0;
      sound.play().catch(e => console.warn('Audio play failed:', e));
    } catch (e) {
      console.error('Sound error:', e);
    }
  }
}

export const soundManager = new SoundManager();
