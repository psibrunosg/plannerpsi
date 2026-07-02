class StudyMediaManager {
  public video: HTMLVideoElement;
  public audio: HTMLAudioElement;

  constructor() {
    this.video = document.createElement('video');
    this.audio = document.createElement('audio');

    // Default styles for when they are injected into StudyPlayer
    this.video.className = "h-full w-full object-contain bg-black";
    this.video.controls = true;
    this.video.style.display = 'none';
    
    this.audio.className = "w-full max-w-md accent-accent";
    this.audio.controls = true;
    this.audio.style.display = 'none';

    // Mount to body so they persist across routes
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.video);
      document.body.appendChild(this.audio);
    }
  }

  hideAndDock() {
    this.video.style.display = 'none';
    this.audio.style.display = 'none';
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.video);
      document.body.appendChild(this.audio);
    }
  }
}

export const studyMedia = new StudyMediaManager();
