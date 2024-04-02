# MPD.FM
There are some really great radio stations all over the globe with real, live
human DJs selecting music from unique, curated catalogs around the clock free of
charge. This project is an app that helps you bring the singular experience of
live radio to your Linux-based home audio system with a progressive web app so
friends and family on your WiFi network can change stations and adjust volume
from their own phones. It is sort of like AirPlay, except that it doesn't
require you to keep your phone turned on, and the notifications from the
phone stay on the phone rather than get played over the big speakers.

This is a rewrite of <https://github.com/florianheinemann/MPD.FM> using
async/await, Typescript, React, and GraphQL. Many thanks to the original
author.

<img width="523" alt="image" src="https://github.com/cuadue/MPD.FM/assets/455847/698f24c2-63f1-497e-a516-9ea63e706764">


## Requirements
- NodeJS >= 20. On Raspberry PI OS (requires `bullseye` or later) it might
  not be available via `apt`, in which case see
  <https://github.com/nodesource/distributions>.
- One or more instances of [MPD](www.musicpd.org/) accessible on the network
  (this can be `localhost`).

```
sudo apt-get update
sudo apt-get install mpd git
```

## Installation
```
# Run the server with least privilege
sudo useradd -mrU srv-mpd-fm
cd /home/srv-mpd-fm
sudo su srv-mpd-fm -c '
	git clone https://github.com/cuadue/MPD.FM.git
	cd MPD.FM
	./setup
'

# Copy systemd service file
sudo cp {MPD.FM/backend/service,/etc/systemd/system}/MPD.FM.service

sudo systemctl enable --now MPD.FM
```

## Play!
- Point your browser to the IP address or hostname of your server
  (e.g. `http://192.168.1.2` or `http://livingroom.local`)
- On iOS you can add MPD.FM as a progressive web app by pressing *Share > Add to
  Home Screen* in Safari

## Configuration
One instance of MPD.FM can control multiple instances of MPD. Change the
`MPD_INSTANCES` environment variable to a semicolon-delimited
list of `$LABEL=$HOST:$PORT` tuples (the `$LABEL=` part is optional).
For example, if you have a Raspberry PI in both living room and kitchen:
```
Environment=MPD_INSTANCES="Living Room=livingroom.local:6600;Kitchen=kitchen.local:6600"
```

### MPD Config
To play sound through the right interface, edit `/etc/mpd.conf`. When done, restart
the MPD service with `systemctl restart --now mpd`.

In the `audio_output` block, it's better to use the device name from `aplay -L`
rather than `aplay -l`.  For example:

```
audio_output {
	type 		"alsa"
	name		"UA25EX"
	device 		"plughw:CARD=UA25EX,DEV=0"
	mixer_type 	"software"
}
``
