# BLEHR-Chrome

Take RR interval data via Bluetooth Low Energy directly into Chrome. 

Report current HR, HRV (SDRR, configurable window) and give a graph of history of HRV. After configurable number of intervals, export RRI sequence to file. 

based originally on https://github.com/WebBluetoothCG/demos.git


## Running locally

1. enable bluetooth support in Chrome at `chrome://flags/#enable-web-bluetooth`
2. run `python -m SimpleHTTPServer 6900`
3. go to `localhost:6900` in Chrome

