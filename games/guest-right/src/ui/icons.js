// Inline icons, drawn on a 24 unit grid in one 1.5 px stroke style. No emoji anywhere in the UI.

const P = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ring: '<circle cx="12" cy="12" r="6.5"/>',
  dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  diamond: '<path d="M12 4.5l7.5 7.5-7.5 7.5L4.5 12z"/>',
  diamondFill: '<path d="M12 5l7 7-7 7-7-7z" fill="currentColor"/>',
  energy: '<circle cx="12" cy="12" r="8.5"/><path d="M13 6.8l-4 6h3.4l-1.4 4.4 4-6h-3.4z" stroke-linejoin="round"/>',
  sprig: '<path d="M7 19c3-3 5.5-7 10-13"/><path d="M10.4 14.6c-2.6.3-4.4-1.2-4.8-3.6 2.5-.3 4.4 1 4.8 3.6zM13.6 10.4c-.6-2.5.6-4.6 3-5.4.6 2.5-.6 4.6-3 5.4zM12.5 12.5c2.4-1 4.7-.4 6 1.6-2.4 1-4.7.4-6-1.6z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  thread: '<path d="M12 4.5l7.5 7.5-7.5 7.5L4.5 12z"/><path d="M12 9l3 3-3 3-3-3z" fill="currentColor" stroke="none"/>',
  person: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 19.5c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/>',
  place: '<path d="M5.5 19.5V11a6.5 6.5 0 0113 0v8.5"/><path d="M3.5 19.5h17M9.5 19.5v-6h5v6"/>',
  talk: '<path d="M5 6.5h14v9H11l-4 3.5v-3.5H5z" stroke-linejoin="round"/>',
  hand: '<path d="M8.5 12.5V6.8a1.4 1.4 0 012.8 0v4.7M11.3 11V5.3a1.4 1.4 0 012.8 0V11M14.1 11.2V6.6a1.4 1.4 0 012.8 0v7.2c0 3.5-2.2 6-5.4 6-2.3 0-3.6-1-4.9-3l-2.1-3.4a1.4 1.4 0 012.2-1.6l1.8 1.9"/>',
  book: '<path d="M12 7.2C10.2 5.8 7.6 5.3 4.5 5.5v12.5c3.1-.2 5.7.3 7.5 1.7 1.8-1.4 4.4-1.9 7.5-1.7V5.5c-3.1-.2-5.7.3-7.5 1.7zM12 7.2v12.5"/>',
  map: '<path d="M4.5 6.5l5-2 5 2 5-2v13l-5 2-5-2-5 2zM9.5 4.5v13M14.5 6.5v13"/>',
  camera: '<path d="M4.5 8.5h3l1.5-2h6l1.5 2h3v10h-15z" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2"/>',
  jump: '<path d="M7 11.5l5-5 5 5M7 17l5-5 5 5"/>',
  run: '<path d="M6 7l5 5-5 5M12.5 7l5 5-5 5"/>',
  menu: '<path d="M5 7.5h14M5 12h14M5 16.5h14"/>',
  plumb: '<path d="M12 3.5v7"/><path d="M12 10.5l3.5 4.2L12 20l-3.5-5.3z" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chevDown: '<path d="M7 10l5 5 5-5"/>',
  chevLeft: '<path d="M14.5 6.5L9 12l5.5 5.5"/>',
  chevRight: '<path d="M9.5 6.5L15 12l-5.5 5.5"/>',
  chevUp: '<path d="M7 14l5-5 5 5"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  minus: '<path d="M6 12h12"/>',
  target: '<circle cx="12" cy="12" r="5.5"/><path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/>',
  flip: '<path d="M6.5 9.5a6 6 0 0110.6-2.3M17.5 14.5a6 6 0 01-10.6 2.3"/><path d="M17.5 4v3.5H14M6.5 20v-3.5H10"/>',
  send: '<path d="M4 6.5h16v11H4z"/><path d="M4.5 7l7.5 6 7.5-6"/>',
  eye: '<path d="M3 12c2.2-3.8 5.2-5.7 9-5.7s6.8 1.9 9 5.7c-2.2 3.8-5.2 5.7-9 5.7S5.2 15.8 3 12z"/><circle cx="12" cy="12" r="2.6"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
  aperture: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5l3.2 7.3M20.4 10.6l-7.6 1.6M16.8 19l-5-6M7.2 19l2.2-7.5M3.6 10.6l7.6 1.6"/>',
  lens: '<path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/>',
  arrow: '<path d="M12 4l6 15-6-3.6L6 19z" stroke-linejoin="round"/>',
  door: '<path d="M7 20V4.5h10V20M4.5 20h15"/><path d="M14 12.5v.5"/>',
  bowl: '<path d="M4 11.5h16c0 4.2-3.6 7-8 7s-8-2.8-8-7z"/><path d="M8.5 11.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5M12 8V6.5"/>',
  headphones: '<path d="M4.5 15.5V13a7.5 7.5 0 0115 0v2.5"/><path d="M4.5 14.5h2.2c.6 0 1 .4 1 1v3c0 .6-.4 1-1 1H5.5c-.6 0-1-.4-1-1zM19.5 14.5h-2.2c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h1.2c.6 0 1-.4 1-1z"/>',
  quill:'<path d="M18.5 4.5c-6 1-9.5 5-11 11.5l-1.5 3.5M9 14.5c3 0 6.5-2.5 8.5-6.5"/>',
};

export function icon(name, cls) {
  const body = P[name] || P.dot;
  return '<svg class="gr-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
}

export function iconEl(name, cls) {
  const s = document.createElement('span');
  s.className = 'gr-icowrap' + (cls ? ' ' + cls : '');
  s.innerHTML = icon(name);
  return s;
}
