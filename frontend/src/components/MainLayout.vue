<template>
  <div class="container">
    <h1>{{ msg }}</h1>
    <h1>{{ this.roomStatusMessage }}</h1>
    <div class="tools">
      <button @click="jsjointrigger" :class="{active: isJoined, inactive: !isJoined}">{{joinButtonMessage}}</button>
      <button @click="jssendaudio" :class="{active: isSendingAudio, inactive: !isSendingAudio}">{{audioButtonMessage}}</button>  
      <button @click="jssendvideo" :class="{active: isSendingVideo, inactive: !isSendingVideo}">{{videoButtonMessage}}</button>
      <button @click="jssenddisplay" :class="{active: isSendingDisplay, inactive: !isSendingDisplay}">{{displayButtonMessage}}</button>
    </div>

    <h3 class="heading">Local</h3>
    <div class="local-tracks" id="localTracks" ref="localTracks"></div>
    <h3 class="heading">Remote</h3>
    <div class="remote-tracks" id="remoteTracks" ref="remoteTracks"></div>
  </div>
</template>

<script>
import Room from "../lib/room";
export default {
  name: "MainLayout",
  props: {
    msg: String,
  },
  data: function() {
    return {
      isJoined: false,
      roomStatusMessage: 'You are not in a room, click on join to enter a room',
      isInRoom: false,
      isSendingVideo: false,
      isSendingAudio: false,
      isSendingDisplay: false,
      room: null,
      joinButtonMessage: 'Join Room',
      videoButtonMessage: 'Share Video',
      audioButtonMessage: 'Share Audio',
      displayButtonMessage: 'Share Screen'
    };
  },
  mounted: function() {
    const newRoom = (window.room = new Room());
    this.room = newRoom;

    this.room.on("@peerJoined", ({ peerId }) => {
      console.log("new peer joined", peerId);
    });

    this.room.on("@peerClosed", ({ peerId }) => {
      this.removeMediaEl(this.$refs.remoteTracks, "data-peer-id", peerId);
    });

    this.room.on("@consumer", async (consumer) => {
      const {
        id,
        appData: { peerId },
        track,
      } = consumer;
      console.log("receive consumer", consumer);
      const el = this.createMediaEl(track, peerId, id);
      this.$refs.remoteTracks.append(el);
    });

    this.room.on("@consumerClosed", ({ consumerId }) => {
      this.removeMediaEl(this.$refs.remoteTracks, "data-search-id", consumerId);
    });

    this.room.on("@producerClosed", ({ producerId }) => {
      this.removeMediaEl(this.$refs.localTracks, "data-search-id", producerId);
    });
  },

  methods: {
    async jsjointrigger() {
      if (!this.isInRoom){
      this.room.join();
      this.room.once("@open", ({ peers }) => {
        console.log(`${peers.length} peers in this room.`);
        this.isInRoom = true;
      });
      this.roomStatusMessage = "";
      this.isJoined = true;
      this.joinButtonMessage = 'In a room';
      }
    },

    async jssendaudio() {
      if (this.isInRoom && !this.isSendingAudio) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioTrack = stream.getAudioTracks()[0];
        const producer = await this.room.sendAudio(audioTrack);
        console.log("beepboop:" + audioTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(audioTrack, "", producer.id)
        );
        this.isSendingAudio = true;
        this.audioButtonMessage = "Sharing Audio";
      }
    },
    async jssendvideo() {
      if (this.isInRoom && !this.isSendingVideo) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        const producer = await this.room.sendVideo(videoTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(videoTrack, "", producer.id)
        );
        this.isSendingVideo = true;
        this.videoButtonMessage = "Sharing Video";
      }
    },
    async jssenddisplay() {
      if (this.isInRoom && !this.isSendingDisplay) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const displayTrack = stream.getVideoTracks()[0];
        const producer = await this.room.sendVideo(displayTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(displayTrack, "", producer.id)
        );
        this.isSendingDisplay = true;
        this.displayButtonMessage = "Sharing Screen";
      }
    },

    createMediaEl(track, peerId, searchId) {
      const el = document.createElement(track.kind);
      el.srcObject = new MediaStream([track]);
      el.setAttribute("data-peer-id", peerId);
      el.setAttribute("data-search-id", searchId);
      el.playsInline = true;
      el.play().catch(console.error);
      el.height = 288;
      el.width = 512;
      return el;
    },

    removeMediaEl($container, key, id) {
      Array.from($container.children)
        .filter((el) => el.getAttribute(key) === id)
        .forEach((el) => {
          el.srcObject.getTracks().forEach((track) => track.stop());
          el.remove();
        });
    },
  },
};
</script>

<style scoped>
button{
  color: white;
  height: 3em;
  width: 10em;
  margin: 1em;
  font-size: 18px;
}

button.active{
  background-color: green;
}

button.inactive{
  background-color: red;
}
</style>
