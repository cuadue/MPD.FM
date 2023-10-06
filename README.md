# MPD.FM
A MPD web server and client to listen to your favorite online radio stations.
It's great for a Raspberry Pi home audio system.

This is a rewrite of <https://github.com/florianheinemann/MPD.FM> using
async/await, Typescript, React, and GraphQL. Many thanks to the original
author.

## Features
- Allows quick switching between your favorite radio stations
- Simple and nicely designed
- Responsive web client - ready for your phone
- Progressive web app ("add to homescreen")

<img src="https://raw.githubusercontent.com/florianheinemann/florianheinemann.github.io/master/MPD.FM.png" width=300>

## Requirements
MPD.fm has been tested on [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) Stretch Lite. Required are:
- Current version of [Node.js](nodejs.org)
- Installed and configured [MPD](www.musicpd.org/)
- [Git](https://git-scm.com/) (optional to easily keep MPD.fm up-to-date)

## Installation
### Raspbian
First, install NodeJS version 20: <https://github.com/nodesource/distributions>. This requires
Raspberry Pi OS `bullseye` or later.

Do the following as **root**:
```
# Install MPD if not yet done - configure as needed
# MPD.FM typically works with an out-of-the-box MPD
apt-get update
apt-get install mpd

# Install Git if not yet done
apt-get install git

# Create a user to have the server not as root
useradd -mrU srv-mpd-fm

# Sign into the new user
su srv-mpd-fm
cd /home/srv-mpd-fm

# Download MPD.fm using Git
git clone https://github.com/cuadue/MPD.FM.git

# Install dependencies
cd MPD.FM
./setup

# Back to root
exit

# Copy systemd service file
cp /home/srv-mpd-fm/MPD.FM/service/MPD.FM.service /etc/systemd/system/

# Ensure MPD.FM starts with boot and run
systemctl enable MPD.FM
systemctl start MPD.FM

# Check status
systemctl status MPD.FM
```

To update MPD.FM just do the following as root:
```
# Sign into the dedicated user
su srv-mpd-fm
cd /home/srv-mpd-fm/MPD.FM

# Update
git pull
npm install

# Back to root
exit

# Restart MPD.FM
systemctl restart MPD.FM

# Check status
systemctl status MPD.FM
```

## Play!
- Point your browser to \[IP of your server\]:4200 (e.g., http://192.168.1.2:4200)
- On iOS you can display MPD.FM app-like by pressing *Share / Add to Home Screen* in Safari
- Several clients can use MPD.FM simultaneously

## Configuration
### Basic settings
Ports, etc. can be defined by editing the environment variables in `MPD.FM.service` (typically in /etc/systemd/system):
```
# Set to log detailed debug messages
# Environment=DEBUG=mpd.fm:*

# Details of MPD server (Default: localhost:6600)
Environment=MPD_HOST=localhost
Environment=MPD_PORT=6600

# Port to serve HTTP (the user needs special permission to serve on 80; default: 4200)
Environment=PORT=4200
```
