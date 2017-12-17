function log_to_page(s) {
  var e = document.createElement("p");
  e.innerHTML =  s;
  document.getElementById("midi_logs").appendChild(e);
}

function configurePMIDIPD30() {
  var dev_name = document.getElementById("device_name").value;
  var knob_start = parseInt(document.getElementById("knob_start").value);
  var fader_start = parseInt(document.getElementById("fader_start").value);
  var button_start = parseInt(document.getElementById("button_start").value);
  log_to_page(
    "Button clicked! device: " + dev_name +
    ", knob_start: " +   knob_start +
    ", fader_start: " +  fader_start +
    ", button_start: " + button_start
  );
}

function onMIDISuccess(midiAccess) {
  log_to_page("MIDI ready!");

  console.log("Input ports")
  listPorts(midiAccess.inputs)
  console.log("Output ports")
  listPorts(midiAccess.outputs)

  midiAccess.inputs.forEach(
    function(entry) { entry.onmidimessage = onMIDIMessage; });
}

function onMIDIFailure(msg) {
  log_to_page("Failed to get MIDI access: " + msg);
}

function findDevByName(ports, name) {
  for (var entry of ports) {
    var port = entry[1];
    if (port.name === name) return port;
  }
}

function listPorts(ports) {
  for (var entry of ports) {
    console.log(entry);
    var port = entry[1];
    console.log("Port [type:'" + port.type + "'] manufacturer:'" +
      port.manufacturer + "' name:'" + port.name + "'");
  }
}

function onMIDIMessage( event ) {
  var str = "MIDI_event: ";
  for (var i = 0; i < event.data.length; i++) {
    str += event.data[i].toString(16) + " ";
  }
  log_to_page.log(str);
}

navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
