
export const SOUNDS = {
  CARD_PLAY: 'https://www.soundjay.com/misc/sounds/card-flip-1.mp3',
  TRICK_WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Loud 'Yes!'
  DEAL: 'https://www.soundjay.com/misc/sounds/shuffling-cards-1.mp3',
  GAME_START: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  ROUND_WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  BGM: 'https://assets.mixkit.co/music/preview/mixkit-soft-ambient-624.mp3', 
};

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private bgm: HTMLAudioElement | null = null;
  private isBGMMuted: boolean = localStorage.getItem('omi_bgm_muted') === 'true';
  private isSFXMuted: boolean = localStorage.getItem('omi_sfx_muted') === 'true';
  private bgmVolume: number = 0.05;

  play(key: keyof typeof SOUNDS) {
    if (this.isSFXMuted) return;
    try {
      if (!this.sounds[key]) {
        this.sounds[key] = new Audio(SOUNDS[key]);
      }
      const sound = this.sounds[key];
      sound.volume = (key === 'TRICK_WIN' || key === 'ROUND_WIN') ? 0.3 : 0.15; 
      sound.currentTime = 0;
      sound.play().catch(e => {
        if (e.name !== 'NotAllowedError') console.warn('SFX play failed:', e.message);
      });
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  startBGM() {
    if (this.bgm || this.isBGMMuted) return;
    try {
      this.bgm = new Audio(SOUNDS.BGM); 
      this.bgm.loop = true;
      this.bgm.volume = this.bgmVolume;
      this.bgm.play().catch(e => {
        if (e.name !== 'NotAllowedError') console.warn('BGM play failed:', e.message);
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

  setBGMVolume(val: number) {
    this.bgmVolume = val;
    if (this.bgm) this.bgm.volume = val;
  }

  toggleBGMMute() {
    this.isBGMMuted = !this.isBGMMuted;
    localStorage.setItem('omi_bgm_muted', String(this.isBGMMuted));
    if (this.isBGMMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isBGMMuted;
  }

  toggleSFXMute() {
    this.isSFXMuted = !this.isSFXMuted;
    localStorage.setItem('omi_sfx_muted', String(this.isSFXMuted));
    return this.isSFXMuted;
  }

  isSoundMuted() {
    return this.isSFXMuted && this.isBGMMuted;
  }

  getBGMState() { return this.isBGMMuted; }
  getSFXState() { return this.isSFXMuted; }
}

export const soundManager = new SoundManager();
