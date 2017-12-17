sleep_func = function() {
  var time_offset = 0;
  return function(time) {
    var p = new Promise((resolve) => setTimeout(resolve, time_offset));
    time_offset += time;
    return p;
  }
}

post_raw = function(sleep_func, dev, delay, bytes) {
  sleep_func(delay).then(() => { dev.send(bytes); });
}

post_byte = function(sleep_func, dev, delay, b) {
  post_raw(sleep_func, dev, delay, [0x90,b>>0x04,b&0x0f]);
}

post_seq = function(sleep_func, dev, delay, seq) {
  seq.forEach(function(b) {
    post_byte(sleep_func, dev, delay, b);
  });
}

send_preamble = function(sleep, dev) {
  post_raw(sleep, dev, 250, [0x9B, 0x01, 0x02])
  post_raw(sleep, dev, 250, [0x9B, 0x7E, 0x7D])
  post_raw(sleep, dev, 250, [0x9B, 0x01, 0x03])
  post_raw(sleep, dev, 250, [0x9B, 0x00, 0x02])
}

send_scene = function(sleep, dev, index, ks, fs, bs) {
  // Label
  post_seq(sleep, dev, 50, [
    index ? 0x09 : 0x00, 0x53, 0x63, 0x65, 0x6E, 0x65, 0x20, 0x31 + index,
    0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  // Mod buttons 1 & 2
  post_seq(sleep, dev, 50, [
    0x01, 0x00, 0x01, 0x7F, 0x00,
    0x01, 0x00, 0x02, 0x7F, 0x00,
  ]);

  // Mod buttons 3 & 4 (as well as encoder, ostensibly; doesn't have any effect)
  post_seq(sleep, dev, 50, [
    0x01, 0x00, 0x43, 0x7F, 0x00,
    0x01, 0x00, 0x40, 0x7F, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x0A, 0x7F, 0x00,
  ]);

  // Knobs
  post_seq(sleep, dev, 50, [
    0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10,
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    ks, ks + 1, ks + 2, ks + 3, ks + 4, ks + 5, ks + 6, ks + 7, ks + 8,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  // Faders (as well as crossfader; doesn't have any effect)
  post_seq(sleep, dev, 50, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    fs, fs + 1, fs + 2, fs + 3, fs + 4, fs + 5, fs + 6, fs + 7, fs + 8, 0x09,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Buttons
  post_seq(sleep, dev, 50, [
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
    bs, bs + 1, bs + 2, bs + 3, bs + 4, bs + 5, bs + 6, bs + 7, bs + 8,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F
  ]);

  // Filler?
  post_seq(sleep, dev, 50, [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // Transport
  post_seq(sleep, dev, 50, [
    0x10, 0x01, 0x2F, 0x00, 0x7F,
    0x01, 0x01, 0x2D, 0x00, 0x7F,
    0x04, 0x01, 0x30, 0x00, 0x7F,
    0x03, 0x01, 0x31, 0x00, 0x7F,
    0x00, 0x01, 0x2E, 0x00, 0x7F,
    0x02, 0x01, 0x2C, 0x00, 0x7F,
  ]);

  // Terminal byte?
  post_seq(sleep, dev, 50, [
    0x05,
  ]);
}

send_postamble = function(sleep, dev) {
  // Lots of zeros to finish, for some reason
  for (var i = 0; i < 196; ++i) {
    post_byte(sleep, dev, 50, 0x00);
  }
}

configure_pmidipd30 = function(dev, ks, fs, bs) {
  var sleep = sleep_func();
  send_preamble(sleep, dev);
  send_scene(sleep, dev, 0, ks, fs, bs);
  send_scene(sleep, dev, 1, ks, fs, bs);
  send_scene(sleep, dev, 2, ks, fs, bs);
  send_scene(sleep, dev, 3, ks, fs, bs);
  send_postamble(sleep, dev);
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
  midi = midiAccess;
}

onMIDIFailure = function(msg) {
  log_to_page("Failed to get MIDI access: " + msg);
}

onMIDIMessage = function(event) {
  var str = "MIDI_event: ";
  for (var i = 0; i < event.data.length; i++) {
    str += event.data[i].toString(16) + " ";
  }
  log_to_page(str);
}

configurePMIDIPD30 = function() {
  var dev_name = document.getElementById("device_name").value;
  var knob_start = parseInt(document.getElementById("knob_start").value);
  var fader_start = parseInt(document.getElementById("fader_start").value);
  var button_start = parseInt(document.getElementById("button_start").value);
  var idev = findDevByName(midi.inputs, dev_name);
  var odev = findDevByName(midi.outputs, dev_name);
  log_to_page("Found devices: " + idev + ", " + odev);
  idev.onmidimessage = onMIDIMessage;
  configure_pmidipd30(odev, knob_start, fader_start, button_start);
}

navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
