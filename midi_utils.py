# A few MIDI utilities.

def m_to_u(m):
  """7-bit MIDI value to unit range."""
  return m / 127.0

def u_to_m(x):
  """Unit range to 7-bit MIDI value."""
  return int(x * 127)

def m_to_s(m):
  """7-bit MIDI value to signed unit range."""
  return (m - 64) / (63.0 if m >= 64 else 64.0)

def s_to_m(x):
  """Signed unit range to 7-bit MIDI value."""
  return int(64 + x * (63 if x >= 0 else 64))
