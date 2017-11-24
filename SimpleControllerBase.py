from __future__ import with_statement

from ableton.v2.control_surface.control_surface import SimpleControlSurface
from ableton.v2.control_surface.elements.button import ButtonElement
from ableton.v2.control_surface.elements.slider import SliderElement
from ableton.v2.control_surface.input_control_element import MIDI_CC_TYPE


class SimpleControllerBase(SimpleControlSurface):
  
  def __init__(self, c_instance):
    super(SimpleControllerBase, self).__init__(c_instance)
    with self.component_guard():
      self._setup()

  def _register_button(
      self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE, is_momentary = True):
    if is_momentary:
      cb = lambda v: v and callback()
    else:
      cb = callback
    self.register_slot(
      ButtonElement(is_momentary, tp, ch, ctrl), cb, 'value')

  def _register_slider(self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE):
    self.register_slot(
        SliderElement(tp, ch, ctrl), callback, 'value')

  def _setup(self):
    raise NotImplementedError("Override _setup to set up controllers.")

