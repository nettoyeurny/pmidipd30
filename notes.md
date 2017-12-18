Reverse engineering process for PMIDIPD30:
  * Couldn't find editor software on Pyle website.
  * Noticed that the bank change sysex message matches Korg Nanokontrol.
  * Found the Nanokontrol MIDI implementation chart, tried other sysex messages,
    without luck.
  * Contacted Pyle Support, got Chinese factory email address after two weeks.
  * Emailed factory, no response so far.
  * Factory email address was @worlde.com.cn, remembered that identical hardware
    is also sold as Worlde EasyControl.9.
  * Found pointer to editor software on Worlde website. Worlde website was down
    at the time, but Wayback Machine had saved a copy.
  * Mac version of software got stuck when trying to upload a new config to
    device.
  * Looked at saved configs, no sign of sysex content.
  * Recorded a memory dump of editor software, no sign of sysex content.
  * Tried Windows version via wine. Saw MIDI messages go by, but update still
    failed.
  * Had a hunch that the software doesn't like USB hubs. Tried Mac version
    again, with the device plugged in directly, and now the update succeeded.
  * Sort of. The device was updated, but the config was broken (transport
    buttons didn't work, etc.).
  * Turns out that updates aren't done with sysex but with a strangely indirect
    protocol piggybacking on MIDI note messages.
  * Looking at the messages and the nature of the misconfiguration, noticed that
    some of the data seemed misaligned by one byte.
  * Added a filler byte in what seemed like the right place, sent the corrected
    config to the device (via WebMIDI), and it worked. Whew...
  * Once I had a working config and a way to upload it, the rest of the format
    was straightforward to reverse engineer (see pmidipd30.js).

Device issues:
  * Encoder counts 0, 2, 3, ... going up, but ..., 3, 2, 1, 0 going down.
  * The encoder channel is the channel of whichever controller was used just
    before it, i.e., the encoder is pretty much useless when using multiple
    MIDI channels.
  * By default, faders 7 and 8 map to CC 9 and 10, just like crossfader and
    encoder, so they're useless unless reconfigured (that was the main
    motivation for figuring out the configuration protocol).
  * Device update seems to be rather slow and sensitive to timing.
