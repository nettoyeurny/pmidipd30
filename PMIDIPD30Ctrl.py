from SimpleControllerBase import SimpleControllerBase


class PMIDIPD30Ctrl(SimpleControllerBase):
  __module__ = __name__
  __doc__ = "PMIDIPD30Ctrl controller script"
  
  def __init__(self, c_instance):
    SimpleControllerBase.__init__(self, c_instance)

  def _setup(self):
    self._register_button(self.__record, 44)
    self._register_button(self.song().start_playing, 45)
    self._register_button(self.song().stop_playing, 46)
    self._register_button(self.song().jump_to_prev_cue, 47)
    self._register_button(self.song().jump_to_next_cue, 48)
    self._register_button(self.song().set_or_delete_cue, 49)
    self._register_slider(self.__set_crossfader, 9)
    self._register_button(lambda: self.__set_crossfader(0), 1)
    self._register_button(lambda: self.__set_crossfader(127), 2)

  def __record(self):
    self.song().record_mode = not self.song().record_mode

  def __set_crossfader(self, value):
    self.song().master_track.mixer_device.crossfader.value = max(
        -1.0, (value - 64) / 63.0)

