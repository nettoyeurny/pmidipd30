# pmidipd30 --- Ableton Live remote controller script for Pyle Audio PMIDIPD30

I recently added a [Pyle Audio PMIDIPD30](https://www.pyleaudio.com/sku/PMIDIPD30) to my setup, mostly because it's cheap and it comes with a crossfader. Sadly, it didn't come with a remote controller script for Ableton Live, MIDI maps in Live didn't quite seem to do what I want, and the generic user remote script doesn't seem to support crossfaders.

So, it appears that the Live's (mostly undocumented) [Python API](https://github.com/gluon/AbletonLive9_RemoteScripts) is the way to go. It took a little effort to figure this out (hat tip to [Julien Bayle](https://github.com/gluon) and [Hanz Petrov](http://remotescripts.blogspot.de/) for getting me started). Specifically, the Live API comes with a number of high-level classes for things like transport control that do lots of complex stuff that I didn't need, while obscuring the basic functionality that I wanted.

In the end, I found a solution that bypasses most of the complexity of the remote script API while giving access to the (nicely documented) [Live Object Model](https://docs.cycling74.com/max5/refpages/m4l-ref/m4l_live_object_model.html). The result is a simple base class (SimpleControllerBase.py) that I believe will be useful in other settings, plus a device-specific sublass (PMIDIPD30Ctrl.py) that shows how to use it.

## Installation

Simply clone this repository into your Live remote MIDI script folder (on my Mac, that's /Applications/Ableton Live 9 Suite.app/Contents/App-Resources/MIDI Remote Scripts). Restart Live, open the MIDI preferences, and select pmidipd30 from the drop-down menu. Select the appropriate input port and make sure to check "Track" and "Remote" on the port.

## A note on tracking changes in Live

I haven't yet worked out a good way to package this, but here's the basic idea.

```python
from ableton.v2.base import listens
from SimpleControllerBase import SimpleControllerBase

class QNCtrl(SimpleControllerBase):
  def __init__(self, c_instance):
    super(QNCtrl, self).__init__(c_instance)
    self.__listener.subject = self.song
    self.__listener()

  @listens('is_playing')
  def __listener(self):
    self._log_message('is_playing', self.song.is_playing)
```
