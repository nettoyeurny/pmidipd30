"use strict";

const create_scheduler = (() => {
  var busy = false;  // Only active scheduler at a time.

  return () => {
    const sched = [];

    return {
      add(delay, func) { sched.push([func, delay]); },

      execute(on_success, on_failure) {
        if (busy) { throw "Busy!"; }
        busy = true;

        const execute_internal = i => {
          if (sched.length > i) {
            const ev = sched[i];
            try {
              ev[0]();
              setTimeout(() => execute_internal(i + 1), ev[1]);
            } catch (e) {
              busy = false;
              on_failure(e);
            }
          } else {
            busy = false;
            on_success();
          }
        }

        execute_internal(0);
      }
    }
  }
})()

const post_raw = (sched, dev, delay, bytes) => {
  sched.add(delay, () => dev.send(bytes));
}

const post_byte = (sched, dev, delay, b) => {
  // Yes, we're really sending a byte by packaging it as a note event, with the
  // high nibble as the note value and the low nibble as the velocity.
  post_raw(sched, dev, delay, [0x90, b >> 0x04, b & 0x0f]);
}

const post_seq = (sched, dev, delay, seq) => {
  seq.forEach(b => post_byte(sched, dev, delay, b));
}

// This function currently isn't terribly useful because it doesn't capture the
// data returned by the device, but it does document how to make the device
// dump its config.
const dump_config = (sched, dev) => {
  const delay1_ms = 100;
  post_raw(sched, dev, delay1_ms, [0x9B, 0x01, 0x02]);
  post_raw(sched, dev, delay1_ms, [0x9B, 0x7E, 0x7D]);
  // Response (not sure what it means):
  //   9B 01 02
  //   9B 01 32
  post_raw(sched, dev, delay1_ms, [0x9B, 0x01, 0x04]);
  // Response (not sure what it means):
  //   9B 01 04
  //   9B 00 01
  const delay2_ms = 50;
  for (let s = 0; s < 4; ++s) {  // Four scenes.
    for (let b = 0; b < 222; ++b) {  // 222 bytes per scene.
      // This MIDI events polls the device. The response is a single byte 0xpq,
      // packaged as 0x9B 0x0p 0x0q.
      post_raw(sched, dev, delay2_ms, [0x9B, 0x01, 0x06]);
    }
  }
  // This terminates the data dump. We can terminate early if we don't want to
  // dump the entire config. If we keep polling the device after the entire
  // config has been transmitted, the device will keep sending zeros in
  // response.
  post_raw(sched, dev, delay2_ms, [0x9B, 0x01, 0x05]);
}

const send_preamble = (sched, dev) => {
  const delay_ms = 100;
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x02]);
  post_raw(sched, dev, delay_ms, [0x9B, 0x7E, 0x7D]);
  post_raw(sched, dev, delay_ms, [0x9B, 0x01, 0x03]);
  post_raw(sched, dev, delay_ms, [0x9B, 0x00, 0x02]);
}

const send_scene = (sched, dev, idx, ks, fs, bs, bt) => {
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

const send_postamble = (sched, dev) => {
  const delay_ms = 50;

  // Lots of zeros to finish, for some reason.
  for (let i = 0; i < 160; ++i) {
    post_byte(sched, dev, delay_ms, 0x00);
  }
}

const configure_pmidipd30 = (dev, ks, fs, bs, bt) => {
  const sched = create_scheduler();
  sched.add(0, () => set_status("Transmitting Preamble..."));
  send_preamble(sched, dev);
  for (let i = 0; i < 4; ++i) {
    sched.add(0, () => set_status("Transmitting Bank " + (i + 1) + "..."));
    send_scene(sched, dev, i, ks, fs, bs, bt);
  }
  sched.add(0, () => set_status("Transmitting Postamble..."));
  send_postamble(sched, dev);
  sched.execute(
      () => {
        set_status("MIDI ready!");
        window.alert("Success!");
      },
      err => {
        set_status("MIDI ready!");
        window.alert("Error! (" + err + ")");
      });
}

const find_device_by_name = (ports, name) => {
  for (const entry of ports) {
    const port = entry[1];
    if (port.name === name) {
      return port;
    }
  }
}

const set_status = s => {
  document.getElementById("midi_logs").innerHTML = s;
}

// Default callback; will be replaced if MIDI is available.
var transmit_button_callback = () => {
  window.alert("No MIDI access!");
}

navigator.requestMIDIAccess({sysex: false}).then(
    midi_access => {
      transmit_button_callback = () => {
        const dev_name = document.getElementById("device_name").value;
        const knob_start = parseInt(document.getElementById("knob_start").value);
        const fader_start = parseInt(document.getElementById("fader_start").value);
        const b_start = parseInt(document.getElementById("button_start").value);
        const b_toggle = document.getElementById("button_toggle").checked;
        const dev = find_device_by_name(midi_access.outputs, dev_name);
        if (dev === undefined) {
          window.alert("Device not found: " + dev_name);
        } else {
          set_status("Found device: " + dev);
          try {
            configure_pmidipd30(
              dev, knob_start, fader_start, b_start, b_toggle ? 0x01 : 0x00);
          } catch (e) {
            window.alert(e);
          }
        }
      }
      set_status("MIDI ready!");
    }, msg => {
      set_status("MIDI not available.");
      window.alert("Failed to get MIDI access: " + msg);
    });
