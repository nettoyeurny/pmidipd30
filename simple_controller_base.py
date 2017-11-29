from __future__ import with_statement

from ableton.v2.base import Slot
from ableton.v2.control_surface.control_surface import SimpleControlSurface
from ableton.v2.control_surface.input_control_element import \
    InputControlElement, MIDI_CC_TYPE, MIDI_NOTE_TYPE


class SimpleControllerBase(SimpleControlSurface):

  def __init__(self, c_instance):
    super(SimpleControllerBase, self).__init__(c_instance)
    with self.component_guard():
      self._setup()

  def _log_message(self, *msg):
    self._c_instance.log_message(
        '(%s) %s' % (self.__class__.__name__, ' '.join(map(str, msg))))

  def _create_midi_element(self, ctrl, ch = 0, is_cc = True):
    """
    Returns a new MIDI element (either CC or note), e.g., for controlling lights
    on a MIDI device. Typical usage:

    e = self._create_midi_element(60, 0, is_cc = False)  # MIDI note 60, ch 0.
    e.send_value(127, force = True)

    Note that you don't have to set force = True if the element was returned by
    _register_slider or _register_trigger.
    """
    return InputControlElement(
        MIDI_CC_TYPE if is_cc else MIDI_NOTE_TYPE, ch, ctrl)

  def _register_slider(self, callback, ctrl, ch = 0, is_cc = True):
    """
    Creates a new MIDI element (either CC or note) and attaches the given
    callback to it. The callback is invoked when a MIDI event comes in; it
    takes a single argument, a 7-bit MIDI value. Returns the MIDI element.
    """
    element = self._create_midi_element(ctrl, ch, is_cc)
    self.register_slot(element, callback, 'value')
    return element

  def _register_trigger(self, callback, ctrl, ch = 0, is_cc = True):
    """
    Creates a new MIDI element (either CC or note) and attaches a callback to
    it. The callback takes no arguments, and it is invoked when the MIDI element
    emits a nonzero value. This is useful for momentary buttons. Returns the
    MIDI element.
    """
    return self._register_slider(lambda v: v and callback(), ctrl, ch, is_cc)

  def _register_listener(self, callback, obj, prop):
    """
    Attaches a callback that takes no arguments to a property (e.g.,
    'is_playing') of an object in Live (e.g., self.song).
    """
    self.register_slot(Slot(obj, callback, prop))

  def _setup(self):
    raise NotImplementedError('Override _setup to set up controllers.')
