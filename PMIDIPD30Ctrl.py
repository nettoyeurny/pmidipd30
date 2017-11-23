#-----------------------------------------------
#                        
#  Adapted from Keith McMillen's QuNexus.
#                        
#-----------------------------------------------

from __future__ import with_statement

import Live

from _Framework.ButtonElement import ButtonElement
from _Framework.ControlSurface import ControlSurface
from _Framework.SliderElement import SliderElement
from _Framework.InputControlElement import MIDI_CC_TYPE
from _Framework.MixerComponent import MixerComponent
from _Framework.TransportComponent import TransportComponent

class PMIDIPD30Ctrl(ControlSurface):
  __module__ = __name__
  __doc__ = "PMIDIPD30Ctrl controller script"
  
  def __init__(self, c_instance):
    ControlSurface.__init__(self, c_instance)
    with self.component_guard():
      self._setup_transport_control()
      self._setup_mixer_control()
    self.log_message("---------- Created PMIDIPD30Ctrl ----------")

  def _setup_transport_control(self):
    channel = 0
    is_momentary = True
    self._transport = TransportComponent(play_toggle_model_transform = None)
    self._transport.set_record_button(ButtonElement(is_momentary,MIDI_CC_TYPE,channel,44))
    self._transport.set_play_button(ButtonElement(is_momentary,MIDI_CC_TYPE,channel,45))

  def _setup_mixer_control(self):
    channel = 0
    self._mixer = MixerComponent()
    self._mixer.set_crossfader_control(SliderElement(MIDI_CC_TYPE, channel, 9))

  def disconnect(self):
    self.log_message("---------- Closed PMIDIPD30Ctrl ----------")
    ControlSurface.disconnect(self)
