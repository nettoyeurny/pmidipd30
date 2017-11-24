from __future__ import with_statement

import Live

from _Framework.ButtonElement import ButtonElement
from _Framework.ButtonSliderElement import ButtonSliderElement
from _Framework.ControlSurface import ControlSurface
from _Framework.InputControlElement import MIDI_CC_TYPE
from _Framework.MixerComponent import MixerComponent
from _Framework.SliderElement import SliderElement


class PMIDIPD30Ctrl(ControlSurface):
  __module__ = __name__
  __doc__ = "PMIDIPD30Ctrl controller script"
  
  def __init__(self, c_instance):
    ControlSurface.__init__(self, c_instance)
    self.__slots = self.register_slot_manager()
    with self.component_guard():
      self.__setup_transport_control()
      self.__setup_mixer_control()
    self.log_message("Created PMIDIPD30Ctrl.")

  def disconnect(self):
    ControlSurface.disconnect(self)
    self.log_message("Closed PMIDIPD30Ctrl.")

  def __register_button(self, ctrl, callback):
    self.__slots.register_slot(
        ButtonElement(True, MIDI_CC_TYPE, 0, ctrl), callback, 'value')

  def __setup_transport_control(self):
    self.__register_button(44, self.__record)
    self.__register_button(45, self.__start)
    self.__register_button(46, self.__stop)
    self.__register_button(47, self.__prev_cue)
    self.__register_button(48, self.__next_cue)
    self.__register_button(49, self.__toggle_cue)

  def __setup_mixer_control(self):
    self._mixer = MixerComponent()
    self._mixer.set_crossfader_control(SliderElement(MIDI_CC_TYPE, 0, 9))
    self._secondary_mixer = MixerComponent()
    self._secondary_mixer.set_crossfader_control(ButtonSliderElement(
       (ButtonElement(True, MIDI_CC_TYPE, 0, 1),
        ButtonElement(True, MIDI_CC_TYPE, 0, 2))
    ))

  def __start(self, value):
    if not value: return
    self.song().start_playing()

  def __stop(self, value):
    if not value: return
    self.song().stop_playing()

  def __record(self, value):
    if not value: return
    self.song().record_mode = not self.song().record_mode

  def __prev_cue(self, value):
    if not value: return
    self.song().jump_to_prev_cue()

  def __next_cue(self, value):
    if not value: return
    self.song().jump_to_next_cue()

  def __toggle_cue(self, value):
    if not value: return
    self.song().set_or_delete_cue()

