import pyaudio
import numpy as np
import sys
import ctypes
from ctypes import wintypes

RATE = 44100
CHUNK = int(RATE/20)  # 20 update per second (50ms per update)

p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16, channels=1, rate=RATE, input=True,
                frames_per_buffer=CHUNK)


class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [
        ('ACLineStatus', wintypes.BYTE),
        ('BatteryFlag', wintypes.BYTE),
        ('BatteryLifePercent', wintypes.BYTE),
        ('Reserved1', wintypes.BYTE),
        ('BatteryLifeTime', wintypes.DWORD),
        ('BatteryFullLifeTime', wintypes.DWORD),
    ]


while True:
    SYSTEM_POWER_STATUS_P = ctypes.POINTER(SYSTEM_POWER_STATUS)
    GetSystemPowerStatus = ctypes.windll.kernel32.GetSystemPowerStatus
    GetSystemPowerStatus.argtypes = [SYSTEM_POWER_STATUS_P]
    GetSystemPowerStatus.restype = wintypes.BOOL
    status = SYSTEM_POWER_STATUS()
    GetSystemPowerStatus(ctypes.pointer(status))

    data = np.fromstring(stream.read(CHUNK), dtype=np.int16)

    peak = np.average(np.abs(data))*2
    bars = 50*peak/2**16

    data = data * np.hanning(len(data))  # smooth the FFT by windowing data
    fft = abs(np.fft.fft(data).real)
    fft = fft[:int(len(fft)/2)]  # keep only first half
    freq = np.fft.fftfreq(CHUNK, 1.0/RATE)
    freq = freq[:int(len(freq)/2)]  # keep only first half
    freqPeak = freq[np.where(fft == np.max(fft))[0][0]]

    print("%s,%d, %d" % (bars, freqPeak, status.ACLineStatus))

    sys.stdout.flush()
