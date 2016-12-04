/* global heartRateSensor */

var canvas = document.querySelector('canvas')
var statusText = document.querySelector('#statusText')
var variabilityText = document.querySelector('#variabilityText')
var heartRates = []
var rrIntervals = []
var variability = []
const STD_WINDOW_SIZE = 30

//export settings
exportOn = true
exportFilename = 'web_bluetooth2.rri'
rrExported = false

//misc settings
const RRI_MAX = 300
const VARIABILITY_MAX = 300

statusText.addEventListener('click', function () {
  statusText.className = ''
  statusText.textContent = 'Connecting...'
  heartRates = []
  variability = []
  heartRateSensor.connect()
  .then(() => heartRateSensor.startNotificationsHeartRateMeasurement().then(handleHeartRateMeasurement))
  .catch(error => {
    statusText.textContent = error
  })
})

function handleHeartRateMeasurement (heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var heartRateMeasurement = heartRateSensor.parseHeartRate(event.target.value)
    // statusText.innerHTML = heartRateMeasurement.heartRate + ' &#x2764;' //print heart rate measurement to status
    statusText.innerHTML = heartRateMeasurement.rrIntervals.toString() + ' &#x2764;' //print latest collected RR intervals to status
    console.log(rrIntervals) //print all intervals to console
    // heartRates.push(heartRateMeasurement.heartRate) //keep track of heart rates
    rrIntervals.push.apply(rrIntervals, heartRateMeasurement.rrIntervals)
    while (rrIntervals.length > RRI_MAX) { rrIntervals.shift() } 

    //for exporting (turn on with exportOn flag)
    if (exportOn && rrIntervals.length > RRI_MAX - 1 && !rrExported) {
      exportRRIData()
      rrExported = true
    }
 
    //calc HRV and manage HRV history
    let v = 0
    v = standardDeviation(rrIntervals.slice(rrIntervals.length - STD_WINDOW_SIZE))
    variabilityText.innerHTML = v
    variability.push(v)
    while (variability.length > VARIABILITY_MAX) { variability.shift() } 

    drawWaves()
  })
}

canvas.addEventListener('click', event => {
  drawWaves()
})

function average (data) {
  var sum = data.reduce(function (sum, value) {
    return sum + value
  }, 0)
  return sum / data.length
}

function standardDeviation (data) {
  const avg = average(data)
  const squareDiffs = data.map(function (value) {
    var diff = value - avg
    return diff * diff
  })
  const avgSquareDiff = average(squareDiffs)
  return Math.sqrt(avgSquareDiff)
}

function drawWaves () {
  const MAX_HEIGHT = 140
  window.requestAnimationFrame(() => {
    canvas.width = parseInt(window.getComputedStyle(canvas).width.slice(0, -2)) * window.devicePixelRatio
    canvas.height = parseInt(window.getComputedStyle(canvas).height.slice(0, -2)) * window.devicePixelRatio

    var context = canvas.getContext('2d')
    var margin = 2
    var max = Math.max(0, Math.round(canvas.width / 11))
    var offset = Math.max(0, variability.length - max)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#FF0000'
    for (let i = 0; i < Math.max(variability.length, max); i++) {
      var barHeight = Math.round(variability[i + offset] * canvas.height / MAX_HEIGHT)
      context.rect(11 * i + margin, canvas.height - barHeight, margin, Math.max(0, barHeight - margin))
      context.stroke()
    }
  })
}

window.onresize = drawWaves

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    drawWaves()
  }
})

//from http://stackoverflow.com/a/7160827/695804
function exportRRIData () {
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
    fs.root.getFile(exportFilename, {create: true}, function(fileEntry) { // test.bin is filename
      fileEntry.createWriter(function(fileWriter) {
        var blob = new Blob([rrIntervals]);

        fileWriter.addEventListener("writeend", function() {
          // navigate to file, will download
          location.href = fileEntry.toURL();
        }, false);

        fileWriter.write(blob);
      }, function() {});
    }, function() {});
  }, function() {});
}


