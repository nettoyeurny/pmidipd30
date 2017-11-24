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

  def _register_momentary_button(
      self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE):
    self.register_slot(
      ButtonElement(True, tp, ch, ctrl),
      lambda v: v and callback(), 'value')

  def _register_toggle_button(
      self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE):
    self.register_slot(
      ButtonElement(False, tp, ch, ctrl), callback, 'value')

  def _register_slider(self, callback, ctrl, ch = 0, tp = MIDI_CC_TYPE):
    self.register_slot(
        SliderElement(tp, ch, ctrl), callback, 'value')

  def _setup(self):
    raise NotImplementedError("Override _setup to set up controllers.")
