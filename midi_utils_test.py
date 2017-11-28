#!/usr/bin/env python

import unittest

from midi_utils import *

class TestMidiUtils(unittest.TestCase):

  def test_m_to_u_0(self):
    assert m_to_u(0) == 0.0

  def test_m_to_u_127(self):
    assert m_to_u(127) == 1.0

  def test_m_to_u_to_m(self):
    for i in xrange(128):
      assert u_to_m(m_to_u(i)) == i

  def test_m_to_s_0(self):
    assert m_to_s(0) == -1.0

  def test_m_to_s_64(self):
    assert m_to_s(64) == 0.0

  def test_m_to_s_127(self):
    assert m_to_s(127) == 1.0

  def test_m_to_s_to_m(self):
    for i in xrange(128):
      assert s_to_m(m_to_s(i)) == i

if __name__ == "__main__":
  unittest.main()
