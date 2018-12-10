var queue = [];
var audio = [];
var mimeCodec = 'video/mp4; codecs="avc3.4d4015"';
var audioCodec = 'audio/mp4; codecs="mp4a.40.2"';
var mediaSource = new MediaSource();
var video = document.querySelector('video');
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', handleSourceOpen.bind(mediaSource));

function handleSourceOpen() {
  var mediaSource = this;
  var vidinit = "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/avc3/512x288p25/IS.mp4";
  var audinit = "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/audio/96kbps/IS.mp4";
  var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
  var audioBuffer = mediaSource.addSourceBuffer(audioCodec);
  for (var i = 1; i <= 150; i++) {
    var vid = "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/avc3/512x288p25/" + ("00000" + i).slice(-6) + ".m4s";
    var aud = "http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/audio/96kbps/" + ("00000" + i).slice(-6) + ".m4s";
    queue.push(vid);
    audio.push(aud);
  }
  function fetchSegmentedMedia(initurl, sourceBuffer, queue) {
    fetchSegmentAndAppend(initurl, sourceBuffer, function() {
      function iter() {
        url = queue.shift();
        if (url === undefined) {
          return;
        }
        fetchSegmentAndAppend(url, sourceBuffer, function(err) {
          if (err) {
            console.error(err);
          } else {
            setTimeout(iter, 200);
          }
        });
      }
      iter();
    });
  }
  fetchSegmentedMedia(vidinit, sourceBuffer, queue);
  fetchSegmentedMedia(audinit, audioBuffer, audio);
}

function fetchSegmentAndAppend(segmentUrl, sourceBuffer, callback) {
  fetchArrayBuffer(segmentUrl, function(buf) {
    sourceBuffer.addEventListener('updateend', function(ev) {
      callback();
    });
    sourceBuffer.addEventListener('error', function(ev) {
      callback(ev);
    });
    function append() {
      if (!sourceBuffer.updating) {
        sourceBuffer.appendBuffer(buf);
      } else {
        setTimeout(append, Math.floor(Math.random() * 200))
      }
    }
    append();
  });
}

function fetchArrayBuffer(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function() {
    callback(xhr.response);
  };
  xhr.send();
}

var player = document.querySelector('.player');
var video = player.querySelector('.player-video');
var toggle = player.querySelector('.toggle-play');
var skippers = player.querySelectorAll('[data-skip]');
var ranges = player.querySelectorAll('.player-slider');

var togglePlay = function() {
  var playState = video.paused ? 'play' : 'pause';
  video[playState]();
}

var toggleMute = function() {
  var muteState = video.muted ? false : true;
  video.muted = muteState;
}

var resetSpeed = function() {
  video.playbackRate = 1;
}

var updateButton = function() {
  var togglePlayBtn = document.querySelector('.toggle-play');

  if (this.paused) {
    togglePlayBtn.innerHTML = '<svg class="" width="16" height="16" viewBox="0 0 16 16"><title>play</title><path d="M3 2l10 6-10 6z"></path></svg>';
  } else {
    togglePlayBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><title>pause</title><path d="M2 2h5v12H2zm7 0h5v12H9z"></path></svg>';
  }
}

var skip = function() {
  video.currentTime += parseFloat(this.dataset.skip);
}

var rangeUpdate = function() {
  video[this.name] = this.value;
}

video.addEventListener('click', togglePlay);
video.addEventListener('play', updateButton);
video.addEventListener('pause', updateButton);
video.addEventListener('click', toggleMute);
video.addEventListener('click', resetSpeed);

toggle.addEventListener('click', togglePlay);
skippers.forEach(function(button) {
  return button.addEventListener('click', skip);
});
ranges.forEach(function(range) {
  return range.addEventListener('change', rangeUpdate);
});
ranges.forEach(function(range) {
  return range.addEventListener('mousemove', rangeUpdate);
});
