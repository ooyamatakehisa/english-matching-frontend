"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

export default function Client({ token }: { token: string }) {
  useEffect(() => {
    (async () => {
      const {
        P2PRoom,
        SfuRoom,
        SkyWayContext,
        SkyWayRoom,
        SkyWayStreamFactory,
      } = await import("@skyway-sdk/room");
      const localVideo = document.getElementById(
        "js-local-stream"
      ) as HTMLVideoElement;
      const joinTrigger = document.getElementById("js-join-trigger")!;
      const leaveTrigger = document.getElementById("js-leave-trigger")!;
      const remoteVideos = document.getElementById("js-remote-streams")!;
      const channelName = document.getElementById(
        "js-channel-name"
      ) as HTMLInputElement;
      const roomMode = document.getElementById("js-room-type")!;
      const messages = document.getElementById("js-messages")!;

      const getRoomTypeByHash = () =>
        location.hash === "#sfu" ? "sfu" : "p2p";
      roomMode.textContent = getRoomTypeByHash();
      window.addEventListener("hashchange", () => {
        roomMode.textContent = getRoomTypeByHash();
      });

      const { audio, video } =
        await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

      // Render local stream
      localVideo.muted = true;
      localVideo.playsInline = true;
      video.attach(localVideo);
      await localVideo.play();

      const context = await SkyWayContext.Create(token, {
        log: { level: "warn", format: "object" },
      });

      let room: P2PRoom | SfuRoom;

      // Register join handler
      joinTrigger.addEventListener("click", async () => {
        if (room) {
          return;
        }

        room = await SkyWayRoom.FindOrCreate(context, {
          name: channelName.value,
          type: getRoomTypeByHash(),
        });

        const member = await room.join();
        messages.textContent += "=== You joined ===\n";

        room.onMemberJoined.add((e: any) => {
          messages.textContent += `=== ${e.member.id.slice(0, 5)} joined ===\n`;
        });

        const userVideo: Record<string, HTMLVideoElement> = {};

        member.onPublicationSubscribed.add(
          async ({ stream, subscription }: any) => {
            if (stream.contentType === "data") return;

            const publisherId = subscription.publication.publisher.id;
            if (!userVideo[publisherId]) {
              const newVideo = document.createElement("video");
              newVideo.playsInline = true;
              newVideo.autoplay = true;
              newVideo.setAttribute(
                "data-member-id",
                subscription.publication.publisher.id
              );

              remoteVideos.append(newVideo);
              userVideo[publisherId] = newVideo;
            }
            const newVideo = userVideo[publisherId];
            stream.attach(newVideo);

            if (subscription.contentType === "video" && room.type === "sfu") {
              newVideo.onclick = () => {
                if (subscription.preferredEncoding === "low") {
                  subscription.changePreferredEncoding("high");
                } else {
                  subscription.changePreferredEncoding("low");
                }
              };
            }
          }
        );
        const subscribe = async (publication: any) => {
          if (publication.publisher.id === member.id) return;
          await member.subscribe(publication.id);
        };
        room.onStreamPublished.add((e: any) => subscribe(e.publication));
        room.publications.forEach(subscribe);

        await member.publish(audio);
        if (room.type === "sfu") {
          await member.publish(video, {
            encodings: [
              { maxBitrate: 10_000, id: "low" },
              { maxBitrate: 800_000, id: "high" },
            ],
          });
        } else {
          await member.publish(video);
        }
        const disposeVideoElement = (remoteVideo: HTMLVideoElement) => {
          const stream = remoteVideo.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          remoteVideo.srcObject = null;
          remoteVideo.remove();
        };

        room.onMemberLeft.add((e: any) => {
          if (e.member.id === member.id) return;

          const remoteVideo = remoteVideos.querySelector(
            `[data-member-id="${e.member.id}"]`
          ) as HTMLVideoElement;
          disposeVideoElement(remoteVideo);

          messages.textContent += `=== ${e.member.id.slice(0, 5)} left ===\n`;
        });

        member.onLeft.once(() => {
          Array.from(remoteVideos.children).forEach((element) => {
            disposeVideoElement(element as HTMLVideoElement);
          });
          messages.textContent += "== You left ===\n";
          void room.dispose();
          // room = undefined;
        });

        leaveTrigger.addEventListener("click", () => member.leave(), {
          once: true,
        });
      });
    })();
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="container">
        <h1 className="heading">Room example</h1>
        <p className="note">
          Change Room type (before join in a channel):
          <a href="#">p2p</a> / <a href="#sfu">sfu</a>
        </p>
        <div className="room">
          <div>
            <video id="js-local-stream"></video>
            <span id="js-room-type"></span>:
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="Channel Name"
                id="js-channel-name"
                defaultValue="test"
              />
              <Button id="js-join-trigger">Join</Button>
              <Button id="js-leave-trigger">Leave</Button>
            </div>
          </div>

          <div className="remote-streams" id="js-remote-streams"></div>

          <div>
            <pre className="messages" id="js-messages"></pre>
          </div>
        </div>
      </div>
    </main>
  );
}
