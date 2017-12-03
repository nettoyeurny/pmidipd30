function log_to_page(s) {
  var e = document.createElement("p");
  e.innerHTML =  s;
  document.getElementById("midi_logs").appendChild(e);
}

function handleForm() {
  log_to_page("Submit!");
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

function listPorts(ports) {
  for (var entry of ports) {
    var port = entry[1];
    console.log("Port [type:'" + port.type + "'] id:'" + port.id +
      "' manufacturer:'" + port.manufacturer + "' name:'" + port.name +
      "' version:'" + port.version + "'" );
  }
}

function onMIDIMessage( event ) {
  var str = "MIDI_event: ";
  for (var i = 0; i < event.data.length; i++) {
    str += event.data[i].toString(16) + " ";
  }
  console.log(str);
}

navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
