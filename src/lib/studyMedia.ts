// Video/audio elements are created once and never removed or re-parented in the DOM.
// Moving a playing <video>/<audio> node between containers (appendChild) can briefly
// detach it from the document, which pauses playback — exactly the bug that made
// lessons stop when navigating away or switching audio/video mode. Instead, these
// elements live permanently in document.body and are only repositioned via fixed
// CSS coordinates ("docked") on top of a placeholder in StudyPlayer, or moved
// off-screen when not visible. Playback is never interrupted by this.
class StudyMediaManager {
  public video: HTMLVideoElement;
  public audio: HTMLAudioElement;

  constructor() {
    this.video = document.createElement('video');
    this.audio = document.createElement('audio');

    this.video.className = "object-contain bg-black";
    this.video.controls = true;
    this.applyFixedStyle(this.video);

    this.audio.className = "accent-accent";
    this.audio.controls = true;
    this.applyFixedStyle(this.audio);

    if (typeof document !== 'undefined') {
      document.body.appendChild(this.video);
      document.body.appendChild(this.audio);
    }
  }

  private applyFixedStyle(el: HTMLMediaElement) {
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.zIndex = '40';
    el.style.margin = '0';
  }

  // Position an element to exactly overlay `rect`, or move it off-screen when rect is null.
  // Never touches the DOM tree — only CSS position, so playback keeps going either way.
  dock(el: HTMLMediaElement, rect: DOMRect | null) {
    if (rect && rect.width > 0 && rect.height > 0) {
      el.style.top = `${rect.top}px`;
      el.style.left = `${rect.left}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    } else {
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      el.style.width = '1px';
      el.style.height = '1px';
    }
  }

  hideAll() {
    this.dock(this.video, null);
    this.dock(this.audio, null);
  }
}

export const studyMedia = new StudyMediaManager();
