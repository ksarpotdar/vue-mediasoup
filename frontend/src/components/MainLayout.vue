<template>
  <div class="container">
    <h1>{{ msg }}</h1>
    <div class="tools">
      <button @click="jsjointrigger">Join</button>
      <button @click="jssendaudio">Send:audio</button>
      <button @click="jssendvideo">Send:video</button>
      <button @click="jssenddisplay">Send:display</button>
    </div>

    <h3 class="heading">local</h3>
    <div class="local-tracks" id="localTracks" ref="localTracks"></div>
    <h3 class="heading">remote</h3>
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
      isInRoom: false,
      room: null,
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
      console.log("beep: " + consumer);
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
      this.room.join();
      this.room.once("@open", ({ peers }) => {
        console.log(`${peers.length} peers in this room.`);
        this.isInRoom = true;
      });
    },

    async jssendaudio() {
      if (this.isInRoom) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioTrack = stream.getAudioTracks()[0];
        const producer = await this.room.sendAudio(audioTrack);
        console.log("beepboop:" + audioTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(audioTrack, "", producer.id)
        );
      }
    },
    async jssendvideo() {
      if (this.isInRoom) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        const producer = await this.room.sendVideo(videoTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(videoTrack, "", producer.id)
        );
      }
    },
    async jssenddisplay() {
      if (this.isInRoom) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const displayTrack = stream.getVideoTracks()[0];
        const producer = await this.room.sendVideo(displayTrack);
        this.$refs.localTracks.append(
          this.createMediaEl(displayTrack, "", producer.id)
        );
      }
    },

    peerJoined(peerId) {
      console.log("new peer joined", peerId);
    },
    peerClosed(peerId) {
      this.removeMediaEl(this.$refs.remoteTracks, "data-peer-id", peerId);
    },
    consumer(consumer) {
      const {
        id,
        appData: { peerId },
        track,
      } = consumer;
      console.log("receive consumer", consumer);
      const el = this.createMediaEl(track, peerId, id);
      this.$refs.remoteTracks.append(el);
    },
    consumerClosed(consumerId) {
      this.removeMediaEl(this.$refs.remoteTracks, "data-search-id", consumerId);
    },
    producerClosed(producerId) {
      this.removeMediaEl(this.$refs.localTracks, "data-search-id", producerId);
    },

    createMediaEl(track, peerId, searchId) {
      const el = document.createElement(track.kind);
      el.srcObject = new MediaStream([track]);
      el.setAttribute("data-peer-id", peerId);
      el.setAttribute("data-search-id", searchId);
      el.playsInline = true;
      el.play().catch(console.error);
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

<style scoped></style>
