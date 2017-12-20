"use strict";

var ready = true;  // Global ready flag; only one execution at a time!

function Schedule() {
  this.sched = [];

  this.add = function(delay, func) {
    this.sched.push([func, delay]);
  }

  this.execute = function(on_success, on_failure) {
    if (ready) {
      ready = false;
      this.execute_internal(0, on_success, on_failure);
    } else {
      on_failure("Busy!");
    }
  }

  this.execute_internal = function(i, on_success, on_failure) {
    if (this.sched.length > i) {
      const ev = this.sched[i];
      try {
        ev[0]();
        setTimeout(() => {
          this.execute_internal(i + 1, on_success, on_failure);
        }, ev[1]);
      } catch (e) {
        on_failure(e);
        ready = true;
      }
    } else {
      on_success();
      ready = true;
    }
  }
}

function post_raw(sched, dev, delay, bytes) {
  sched.add(delay, () => { dev.send(bytes); });
}

function post_byte(sched, dev, delay, b) {
  // Yes, we're really sending a byte by packaging it as a note event, with the
  // high nibble as the note value and the low nibble as the velocity.
  post_raw(sched, dev, delay, [0x90, b >> 0x04, b & 0x0f]);
}

function post_seq(sched, dev, delay, seq) {
  seq.forEach((b) => {
    post_byte(sched, dev, delay, b);
  });
}

function send_preamble(sched, dev) {
  const delay_ms = 100;
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x02])
  post_raw(sched, dev, delay_ms, [0x9B, 0x7E, 0x7D])
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x03])
  post_raw(sched, dev, delay_ms, [0x9B, 0x00, 0x02])
}

function send_scene(sched, dev, idx, ks, fs, bs, bt) {
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
  for (let i = 0; i < 9; ++i) {
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

function send_postamble(sched, dev) {
  const delay_ms = 50;

  // Lots of zeros to finish, for some reason.
  for (let i = 0; i < 160; ++i) {
    post_byte(sched, dev, delay_ms, 0x00);
  }
}

function configure_pmidipd30(dev, ks, fs, bs, bt, log_func) {
  const sched = new Schedule();
  sched.add(0, () => { log_func("Transmitting Preamble..."); });
  send_preamble(sched, dev);
  for (let i = 0; i < 4; ++i) {
    sched.add(0, () => { log_func("Transmitting Bank " + (i + 1) + "..."); });
    send_scene(sched, dev, i, ks, fs, bs, bt);
  }
  sched.add(0, () => { log_func("Transmitting Postamble..."); });
  send_postamble(sched, dev);
  sched.execute(
      () => { log_func("Success!"); },
      (err) => { log_func("Error! (" + err + ")"); });
}

function log_to_page(s) {
  document.getElementById("midi_logs").innerHTML = s;
}

function find_device_by_name(ports, name) {
  for (const entry of ports) {
    const port = entry[1];
    if (port.name === name) return port;
  }
}

function transmit_button_callback() {
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

var midi = null;
navigator.requestMIDIAccess({ sysex: false }).then(
    (midi_access) => {
      midi = midi_access;
      log_to_page("MIDI ready!");
    }, (msg) => {
      log_to_page("Failed to get MIDI access: " + msg);
    });
