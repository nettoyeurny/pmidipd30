from __future__ import with_statement

from _Framework.ButtonElement import ButtonElement
from _Framework.ControlSurface import ControlSurface
from _Framework.InputControlElement import MIDI_CC_TYPE
from _Framework.SliderElement import SliderElement


class BasicController(ControlSurface):
  
  def __init__(self, c_instance):
    ControlSurface.__init__(self, c_instance)
    self.__slots = self.register_slot_manager()
    with self.component_guard():
      self._setup()

  def disconnect(self):
    ControlSurface.disconnect(self)

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
    pass

