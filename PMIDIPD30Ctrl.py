from __future__ import with_statement

from _Framework.ButtonElement import ButtonElement
from _Framework.ControlSurface import ControlSurface
from _Framework.InputControlElement import MIDI_CC_TYPE
from _Framework.SliderElement import SliderElement


class PMIDIPD30Ctrl(ControlSurface):
  __module__ = __name__
  __doc__ = "PMIDIPD30Ctrl controller script"
  
  def __init__(self, c_instance):
    ControlSurface.__init__(self, c_instance)
    self.__slots = self.register_slot_manager()
    with self.component_guard():
      self._setup()
    self.log_message("Created PMIDIPD30Ctrl.")

  def disconnect(self):
    ControlSurface.disconnect(self)
    self.log_message("Closed PMIDIPD30Ctrl.")

  def _register_button(
      self, callback, ctrl, ch = 0, is_momentary = True, tp = MIDI_CC_TYPE):
    if is_momentary:
      cb = lambda v: v and callback()
    else:
      cb = callback
    self.__slots.register_slot(
      ButtonElement(is_momentary, tp, ch, ctrl), cb, 'value')

  def _register_slider(self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE):
    self.__slots.register_slot(
        SliderElement(tp, ch, ctrl), callback, 'value')

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

