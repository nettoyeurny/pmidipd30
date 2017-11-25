from functools import partial

from SimpleControllerBase import SimpleControllerBase


class PMIDIPD30Ctrl(SimpleControllerBase):
  
  def __init__(self, c_instance):
    super(PMIDIPD30Ctrl, self).__init__(c_instance)

  def _setup(self):
    # Set up transport.
    self._register_momentary_button(self.__toggle_record, 44)
    self._register_momentary_button(self.song.start_playing, 45)
    self._register_momentary_button(self.song.stop_playing, 46)
    self._register_momentary_button(self.song.jump_to_prev_cue, 47)
    self._register_momentary_button(self.song.jump_to_next_cue, 48)
    self._register_momentary_button(self.song.set_or_delete_cue, 49)
    # Set up crossfader.
    self._register_slider(self.__set_crossfader, 9)
    self._register_momentary_button(partial(self.__set_crossfader, 0), 1)
    self._register_momentary_button(partial(self.__set_crossfader, 127), 2)

  def __toggle_record(self):
    self.song.record_mode = not self.song.record_mode

  def __set_crossfader(self, value):
    self.song.master_track.mixer_device.crossfader.value = max(
        -1.0, (value - 64) / 63.0)
