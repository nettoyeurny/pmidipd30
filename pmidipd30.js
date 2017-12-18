sleep_func = function() {
  var time_offset = 0;
  return function(time) {
    var p = new Promise((resolve) => setTimeout(resolve, time_offset));
    time_offset += time;
    return p;
  }
}

post_raw = function(sleep, dev, delay, bytes) {
  sleep(delay).then(() => { dev.send(bytes); });
}

post_byte = function(sleep, dev, delay, b) {
  post_raw(sleep, dev, delay, [0x90, b>>0x04, b&0x0f]);
}

post_seq = function(sleep, dev, delay, seq) {
  seq.forEach(function(b) {
    post_byte(sleep, dev, delay, b);
  });
}

send_preamble = function(sleep, dev) {
  var delay_ms = 250;
  post_raw(sleep, dev, delay_ms, [0x9B, 0x01, 0x02])
  post_raw(sleep, dev, delay_ms, [0x9B, 0x7E, 0x7D])
  post_raw(sleep, dev, delay_ms, [0x9B, 0x01, 0x03])
  post_raw(sleep, dev, delay_ms, [0x9B, 0x00, 0x02])
}

send_scene = function(sleep, dev, idx, ks, fs, bs, bt) {
  var delay_ms = 50;

  // Global MIDI channel.
  post_byte(sleep, dev, delay_ms, 0x00);

  // Label (up to eleven characters).
  post_seq(sleep, dev, delay_ms, [
    0x53, 0x63, 0x65, 0x6E, 0x65, 0x20, 0x31 + idx, 0x00, 0x00, 0x00, 0x00
  ]);

  // Mod buttons 1 & 2.
  post_seq(sleep, dev, delay_ms, [
    0x00, 0x01, 0x00, 0x01, 0x7F,
    0x00, 0x01, 0x00, 0x02, 0x7F
  ]);

  // Mod buttons 3 & 4 plus encoder, but these settings don't seem to do anything.
  post_seq(sleep, dev, delay_ms, [
    0x00, 0x01, 0x00, 0x43, 0x7F,
    0x00, 0x01, 0x00, 0x40, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x0A, 0x7F
  ]);

  // MIDI channels per strip (set to global channel).
  for (var i = 0; i < 9; ++i) {
    post_byte(sleep, dev, delay_ms, idx);
  }
  // MIDI channel of encoder, I think. 0x10 means global channel.
  post_byte(sleep, dev, delay_ms, 0x10);

  // Knobs.
  post_seq(sleep, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    ks, ks + 1, ks + 2, ks + 3, ks + 4, ks + 5, ks + 6, ks + 7, ks + 8,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  // Faders (as well as crossfader, but the crossfader can't be configured).
  post_seq(sleep, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    fs, fs + 1, fs + 2, fs + 3, fs + 4, fs + 5, fs + 6, fs + 7, fs + 8, 0x09,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Buttons.
  post_seq(sleep, dev, delay_ms, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    bs, bs + 1, bs + 2, bs + 3, bs + 4, bs + 5, bs + 6, bs + 7, bs + 8,
    bt, bt, bt, bt, bt, bt, bt, bt, bt,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F
  ]);

  // Filler?
  post_seq(sleep, dev, delay_ms, [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Transport.
  post_seq(sleep, dev, delay_ms, [
    0x10, 0x01, 0x2F, 0x00, 0x7F,
    0x01, 0x01, 0x2D, 0x00, 0x7F,
    0x04, 0x01, 0x30, 0x00, 0x7F,
    0x03, 0x01, 0x31, 0x00, 0x7F,
    0x00, 0x01, 0x2E, 0x00, 0x7F,
    0x02, 0x01, 0x2C, 0x00, 0x7F,
  ]);

  // Terminal byte.
  post_seq(sleep, dev, delay_ms, [
    0x05,
  ]);
}

send_postamble = function(sleep, dev) {
  var delay_ms = 50;

  // Lots of zeros to finish, for some reason.
  for (var i = 0; i < 160; ++i) {
    post_byte(sleep, dev, delay_ms, 0x00);
  }
}

configure_pmidipd30 = function(dev, ks, fs, bs, bt) {
  var sleep = sleep_func();
  sleep(0).then(() => { log_to_page("Transmitting config..."); });
  sleep(0).then(() => { log_to_page("Preamble..."); });
  send_preamble(sleep, dev);
  for (let i = 0; i < 4; ++i) {
    sleep(0).then(() => { log_to_page("Bank " + (i + 1) + "..."); });
    send_scene(sleep, dev, i, ks, fs, bs, bt);
  }
  sleep(0).then(() => { log_to_page("Postamble..."); });
  send_postamble(sleep, dev);
  sleep(0).then(() => { log_to_page("Done!"); });
}

configurePMIDIPD30 = function() {
  var dev_name = document.getElementById("device_name").value;
  var knob_start = parseInt(document.getElementById("knob_start").value);
  var fader_start = parseInt(document.getElementById("fader_start").value);
  var button_start = parseInt(document.getElementById("button_start").value);
  var button_toggle = document.getElementById("button_toggle").checked;
  var dev = findDevByName(midi.outputs, dev_name);
  log_to_page("Found device: " + dev);
  configure_pmidipd30(
    dev, knob_start, fader_start, button_start, button_toggle ? 0x01 : 0x00);
}

log_to_page = function(s) {
  var e = document.createElement("p");
  e.innerHTML =  s;
  document.getElementById("midi_logs").appendChild(e);
}

findDevByName = function(ports, name) {
  for (var entry of ports) {
    var port = entry[1];
    if (port.name === name) return port;
  }
}

onMIDISuccess = function(midiAccess) {
  log_to_page("MIDI ready!");
  midi = midiAccess;  // The midi object is global!
}

onMIDIFailure = function(msg) {
  log_to_page("Failed to get MIDI access: " + msg);
}

navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
