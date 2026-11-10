// Settings, saving, and the clock.
import { clamp, pad2, Events } from './util.js';

// Storage that never throws: localStorage when it works, memory when it does not (private windows, previews).
export class Save {
  constructor(key = 'guest-right') { this.key = key; this.mem = {}; this.ok = false; try { const k = '__gr_probe'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); this.ok = true; } catch (e) { this.ok = false; } }
  get(name, fallback) {
    try { const raw = this.ok ? window.localStorage.getItem(this.key + ':' + name) : this.mem[name]; if (raw === null || raw === undefined) return fallback; return JSON.parse(raw); } catch (e) { return fallback; }
  }
  set(name, value) { const raw = JSON.stringify(value); this.mem[name] = raw; if (this.ok) { try { window.localStorage.setItem(this.key + ':' + name, raw); } catch (e) { this.ok = false; } } }
  remove(name) { delete this.mem[name]; if (this.ok) { try { window.localStorage.removeItem(this.key + ':' + name); } catch (e) { /* ignore */ } } }
}

const DEFAULTS = {
  quality: 'high', renderScale: 1, fov: 75, sensitivity: 1, invertY: false, headBob: true, subtitles: 'small',
  volMaster: 0.9, volMusic: 0.7, volSfx: 0.9, volVoice: 0.8, volAmbience: 0.8, daySpeed: 48,
};
export class Settings {
  constructor(save, events) { this.save = save; this.events = events; this.v = Object.assign({}, DEFAULTS, save.get('settings', {})); }
  get(k) { return this.v[k]; }
  set(k, value) { if (this.v[k] === value) return; this.v[k] = value; this.save.set('settings', this.v); this.events.emit('settings', { key: k, value }); }
  all() { return Object.assign({}, this.v); }
}

// The drum's day. minutes run 0..1440; day counts from 1 (the Thursday you arrive).
export const DAY_NAMES = ['', 'Thursday', 'the Quiet', 'Booking Day', 'the fourth morning'];
export class Clock {
  constructor(game) { this.game = game; this.day = 1; this.minutes = 9 * 60 + 40; this.paused = false; this.rate = 1; }
  get hours() { return this.minutes / 60; }
  // real seconds -> game minutes. daySpeed is real minutes per game day.
  update(dt) {
    if (this.paused) return;
    const perDay = (this.game.settings ? this.game.settings.get('daySpeed') : 48) * 60;
    this.minutes += dt * 1440 / perDay * this.rate;
    while (this.minutes >= 1440) { this.minutes -= 1440; this.day++; this.game.events.emit('clock:day', this.day); }
  }
  label() { const m = Math.floor(this.minutes); return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
  dayName() { return DAY_NAMES[Math.min(this.day, 4)] || 'another day'; }
  set(day, hour) { this.day = day; this.minutes = hour * 60; this.game.events.emit('clock:jump'); }
  // advance to the next time the clock reads `hour` (0..24)
  skipTo(hour) { const target = hour * 60; if (target <= this.minutes + 0.5) { this.day++; this.game.events.emit('clock:day', this.day); } this.minutes = target; this.game.events.emit('clock:jump'); }
  // 0..1 home and street lamps: ramp from 06:30 over 20 minutes, fade from 23:00 over 30
  lamps() { const h = this.hours; if (h < 6.5) return 0.22; if (h < 6.8333) return 0.22 + 0.78 * (h - 6.5) / 0.3333; if (h < 23) return 1; if (h < 23.5) return 1 - 0.78 * (h - 23) / 0.5; return 0.22; }
  // 0..1 the sunline: dawn 06:00-09:00, full sun to 15:00, dusk to 18:00 (linear ramps, as the docs take them)
  sun() { const h = this.hours; if (h < 6) return 0; if (h < 9) return (h - 6) / 3; if (h < 15) return 1; if (h < 18) return 1 - (h - 15) / 3; return 0; }
  night() { return clamp(1 - this.sun() * 4, 0, 1); }
  part() { const h = this.hours; return h < 5 ? 'night' : h < 11 ? 'morning' : h < 15 ? 'midday' : h < 22 ? 'evening' : 'night'; }
}

export function makeEvents() { return new Events(); }
