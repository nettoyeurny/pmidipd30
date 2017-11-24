#-----------------------------------------------
#                        
#  Adapted from Keith McMillen's QuNexus.
#                        
#-----------------------------------------------

from __future__ import with_statement

import Live

from _Framework.ButtonElement import ButtonElement
from _Framework.ButtonSliderElement import ButtonSliderElement
from _Framework.ControlSurface import ControlSurface
from _Framework.InputControlElement import MIDI_CC_TYPE, MIDI_INVALID_TYPE
from _Framework.MixerComponent import MixerComponent
from _Framework.SliderElement import SliderElement
from _Framework.SubjectSlot import SlotManager

class TransportControl(SliderElement, SlotManager):

  def __init__(self, owner,
      start_button = None, stop_button = None, record_button = None):
    SliderElement.__init__(self, MIDI_INVALID_TYPE, 0, 0)
    self._owner = owner
    self._slots = self.register_slot_manager()
    if start_button:
      self._slots.register_slot(start_button, self._start, 'value')
    if stop_button:
      self._slots.register_slot(stop_button, self._stop, 'value')
    if record_button:
      self._slots.register_slot(record_button, self._record, 'value')

  def disconnect(self):
    SliderElement.disconnect(self)

  def _start(self, value):
    if not value: return
    self._owner.song().start_playing()

  def _stop(self, value):
    if not value: return
    self._owner.song().stop_playing()

  def _record(self, value):
    if not value: return
    self._owner.song().record_mode = not self._owner.song().record_mode


class PMIDIPD30Ctrl(ControlSurface):
  __module__ = __name__
  __doc__ = "PMIDIPD30Ctrl controller script"
  
  def __init__(self, c_instance):
    ControlSurface.__init__(self, c_instance)
    with self.component_guard():
      self._setup_transport_control()
      self._setup_mixer_control()
    self.log_message("Created PMIDIPD30Ctrl.")

  def _setup_transport_control(self):
    self._transport = TransportControl(self,
        ButtonElement(True, MIDI_CC_TYPE, 0, 45),
        ButtonElement(True, MIDI_CC_TYPE, 0, 46),
        ButtonElement(True, MIDI_CC_TYPE, 0, 44))

  def _setup_mixer_control(self):
    self._mixer = MixerComponent()
    self._mixer.set_crossfader_control(SliderElement(MIDI_CC_TYPE, 0, 9))
    self._secondary_mixer = MixerComponent()
    self._secondary_mixer.set_crossfader_control(ButtonSliderElement(
       (ButtonElement(True, MIDI_CC_TYPE, 0, 1),
        ButtonElement(True, MIDI_CC_TYPE, 0, 2))
    ))

  def disconnect(self):
    ControlSurface.disconnect(self)
    self.log_message("Closed PMIDIPD30Ctrl.")
