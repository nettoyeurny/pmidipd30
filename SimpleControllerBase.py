from __future__ import with_statement

from ableton.v2.control_surface.control_surface import SimpleControlSurface
from ableton.v2.control_surface.elements.button import ButtonElement
from ableton.v2.control_surface.elements.slider import SliderElement
from ableton.v2.control_surface.input_control_element import \
    MIDI_CC_TYPE, MIDI_NOTE_TYPE


class SimpleControllerBase(SimpleControlSurface):
  
  def __init__(self, c_instance):
    super(SimpleControllerBase, self).__init__(c_instance)
    with self.component_guard():
      self._setup()

  def _log_message(self, *msg):
    self._c_instance.log_message(
        '(%s) %s' % (self.__class__.__name__, ' '.join(map(str, msg))))

  def _register_slider(self, callback, ctrl, ch = 0, is_cc = True):
    element = SliderElement(MIDI_CC_TYPE, ch, ctrl) if is_cc else \
              ButtonElement(True, MIDI_NOTE_TYPE, ch, ctrl)
    self.register_slot(element, callback, 'value')

  def _register_trigger(self, callback, ctrl, ch = 0, is_cc = True):
    def filtered_callback(value, prev = [0]):
      if value and not prev[0]: callback()
      prev[0] = value
    self._register_slider(filtered_callback, ctrl, ch, is_cc)

  def _setup(self):
    raise NotImplementedError('Override _setup to set up controllers.')
