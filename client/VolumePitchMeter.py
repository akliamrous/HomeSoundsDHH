import pyaudio
import numpy as np
import sys

RATE = 44100
CHUNK = int(RATE/20)	# 20 update per second (50ms per update)

p=pyaudio.PyAudio()
stream=p.open(format=pyaudio.paInt16,channels=1,rate=RATE,input=True,
              frames_per_buffer=CHUNK)

while True:
    data = np.fromstring(stream.read(CHUNK),dtype=np.int16)
    peak = np.average(np.abs(data))*2
    bars = 50*peak/2**16
    #bars="#"*int(50*peak/2**16)
    #print("%04d %05d %s"%(i,peak,bars))
    
    data = data * np.hanning(len(data)) # smooth the FFT by windowing data
    fft = abs(np.fft.fft(data).real)
    fft = fft[:int(len(fft)/2)] # keep only first half
    freq = np.fft.fftfreq(CHUNK,1.0/RATE)
    freq = freq[:int(len(freq)/2)] # keep only first half
    freqPeak = freq[np.where(fft==np.max(fft))[0][0]]
    #print("peak frequency: %d Hz"%freqPeak)
    
    print("%s,%d"%(bars, freqPeak))
    	
    sys.stdout.flush()
