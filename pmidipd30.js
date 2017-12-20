add_to_sched = (sched, delay, func) => {
  sched.push([func, delay]);
}

execute_sched = (sched, i, on_success, on_failure) => {
  if (sched.length > i) {
    const ev = sched[i];
    try {
      ev[0]();
      setTimeout(() => {
        execute_sched(sched, i + 1, on_success, on_failure);
      }, ev[1]);
    } catch (e) {
      on_failure(e);
    }
  } else {
    on_success();
  }
}

post_raw = (sched, dev, delay, bytes) => {
  add_to_sched(sched, delay, () => { dev.send(bytes); });
}

post_byte = (sched, dev, delay, b) => {
  // Yes, we're really sending a byte by packaging it as a note event, with the
  // high nibble as the note value and the low nibble as the velocity.
  post_raw(sched, dev, delay, [0x90, b >> 0x04, b & 0x0f]);
}

post_seq = (sched, dev, delay, seq) => {
  seq.forEach((b) => {
    post_byte(sched, dev, delay, b);
  });
}

send_preamble = (sched, dev) => {
  const delay_ms = 100;
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x02])
  post_raw(sched, dev, delay_ms, [0x9B, 0x7E, 0x7D])
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x03])
  post_raw(sched, dev, delay_ms, [0x9B, 0x00, 0x02])
}

send_scene = (sched, dev, idx, ks, fs, bs, bt) => {
  const delay_ms = 20;

  // Global MIDI channel.
  post_byte(sched, dev, delay_ms, 0x00);

  // Label (up to eleven characters).
  post_seq(sched, dev, delay_ms, [
    0x53, 0x63, 0x65, 0x6E, 0x65, 0x20, 0x31 + idx, 0x00, 0x00, 0x00, 0x00
  ]);

  // Mod buttons 1 & 2.
  post_seq(sched, dev, delay_ms, [
    0x00, 0x01, 0x00, 0x01, 0x7F,
    0x00, 0x01, 0x00, 0x02, 0x7F
  ]);

  // Mod buttons 3 & 4 plus encoder (can't be changed, apparently).
  post_seq(sched, dev, delay_ms, [
    0x00, 0x01, 0x00, 0x43, 0x7F,
    0x00, 0x01, 0x00, 0x40, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x0A, 0x7F
  ]);

  // MIDI channel per strip.
  for (var i = 0; i < 9; ++i) {
    post_byte(sched, dev, delay_ms, idx);
  }

  // Filler?
  post_byte(sched, dev, delay_ms, 0x00);

  // Knobs.
  post_seq(sched, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    ks, ks + 1, ks + 2, ks + 3, ks + 4, ks + 5, ks + 6, ks + 7, ks + 8,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  // Faders (as well as crossfader, but the crossfader can't be reconfigured).
  post_seq(sched, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    fs, fs + 1, fs + 2, fs + 3, fs + 4, fs + 5, fs + 6, fs + 7, fs + 8, 0x09,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Buttons.
  post_seq(sched, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    bs, bs + 1, bs + 2, bs + 3, bs + 4, bs + 5, bs + 6, bs + 7, bs + 8,
    bt, bt, bt, bt, bt, bt, bt, bt, bt,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F
  ]);

  // Filler?
  post_seq(sched, dev, delay_ms, [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Transport buttons.
  post_seq(sched, dev, delay_ms, [
    0x10, 0x01, 0x2F, 0x00, 0x7F,
    0x01, 0x01, 0x2D, 0x00, 0x7F,
    0x04, 0x01, 0x30, 0x00, 0x7F,
    0x03, 0x01, 0x31, 0x00, 0x7F,
    0x00, 0x01, 0x2E, 0x00, 0x7F,
    0x02, 0x01, 0x2C, 0x00, 0x7F,
  ]);

  // Terminal byte.
  post_seq(sched, dev, delay_ms, [
    0x05,
  ]);
}

send_postamble = (sched, dev) => {
  const delay_ms = 50;

  // Lots of zeros to finish, for some reason.
  for (var i = 0; i < 160; ++i) {
    post_byte(sched, dev, delay_ms, 0x00);
  }
}

ready = true
configure_pmidipd30 = (dev, ks, fs, bs, bt, log_func) => {
  if (ready) {
    ready = false
    const sched = [];
    add_to_sched(sched, 0, () => { log_func("Transmitting Preamble..."); });
    send_preamble(sched, dev);
    for (let i = 0; i < 4; ++i) {
      add_to_sched(
        sched, 0, () => { log_func("Transmitting Bank " + (i + 1) + "..."); });
      send_scene(sched, dev, i, ks, fs, bs, bt);
    }
    add_to_sched(sched, 0, () => { log_func("Transmitting Postamble..."); });
    send_postamble(sched, dev);
    execute_sched(sched, 0, () => {
      ready = true;
      log_func("Success!");
    }, (err) => {
      ready = true;
      log_func("Error! (" + err + ")");
    });
  } else {
    log_func("Busy!");
  }
}

log_to_page = (s) => {
  document.getElementById("midi_logs").innerHTML = s;
}

find_device_by_name = (ports, name) => {
  for (const entry of ports) {
    const port = entry[1];
    if (port.name === name) return port;
  }
}

transmit_button_callback = () => {
  const dev_name = document.getElementById("device_name").value;
  const knob_start = parseInt(document.getElementById("knob_start").value);
  const fader_start = parseInt(document.getElementById("fader_start").value);
  const button_start = parseInt(document.getElementById("button_start").value);
  const button_toggle = document.getElementById("button_toggle").checked;
  const dev = find_device_by_name(midi.outputs, dev_name);
  log_to_page("Found device: " + dev);
  configure_pmidipd30(
    dev, knob_start, fader_start, button_start, button_toggle ? 0x01 : 0x00,
    log_to_page);
}

on_midi_success = (midi_access) => {
  log_to_page("MIDI ready!");
  midi = midi_access;  // The midi object is global!
}

on_midi_failure = (msg) => {
  log_to_page("Failed to get MIDI access: " + msg);
}

navigator.requestMIDIAccess({ sysex: false }).then(
    on_midi_success, on_midi_failure);
