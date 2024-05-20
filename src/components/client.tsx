'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export default function Client({ token }: { token: string }) {
    const [context, setContext] = useState<any>(null);
    const [room, setRoom] = useState<(import('@skyway-sdk/room').P2PRoom | import('@skyway-sdk/room').SfuRoom | null)>(null);
    const [audioVideoStream, setAudioVideoStream] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const { SkyWayContext, SkyWayStreamFactory } = await import(
                '@skyway-sdk/room'
            );

            const localVideo = document.getElementById(
                'js-local-stream',
            ) as HTMLVideoElement;

            const roomMode = document.getElementById('js-room-type')!;

            roomMode.textContent = getRoomTypeByHash();
            window.addEventListener('hashchange', () => {
                roomMode.textContent = getRoomTypeByHash();
            });

            const { audio, video } =
                await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

            // Render local stream
            localVideo.muted = true;
            localVideo.playsInline = true;
            video.attach(localVideo);
            await localVideo.play();
            setAudioVideoStream({ audio, video });

            const context = await SkyWayContext.Create(token, {
                log: { level: 'warn', format: 'object' },
            });
            setContext(context);
        })();
    }, [token]);

    const onClick = async () => {
        const { SkyWayRoom } = await import('@skyway-sdk/room');

        const leaveTrigger = document.getElementById('js-leave-trigger')!;
        const remoteVideos = document.getElementById('js-remote-streams')!;
        const channelName = document.getElementById(
            'js-channel-name',
        ) as HTMLInputElement;
        const messages = document.getElementById('js-messages')!;

        if (room) {
            return;
        }
        const newRoom = await SkyWayRoom.FindOrCreate(context, {
            name: channelName.value,
            type: getRoomTypeByHash(),
        });
        setRoom(newRoom);

        const member = await newRoom.join();
        messages.textContent += '=== You joined ===\n';

        newRoom.onMemberJoined.add((e: any) => {
            messages.textContent += `=== ${e.member.id.slice(0, 5)} joined ===\n`;
        });

        member.onPublicationSubscribed.add(onPublicationSubscribed(remoteVideos, newRoom));
        const subscribe = async (publication: any) => {
            if (publication.publisher.id === member.id) return;
            await member.subscribe(publication.id);
        };
        newRoom.onStreamPublished.add((e: any) => subscribe(e.publication));
        newRoom.publications.forEach(subscribe);

        await member.publish(audioVideoStream.audio);
        if (newRoom.type === 'sfu') {
            await member.publish(audioVideoStream.video, {
                encodings: [
                    { maxBitrate: 10_000, id: 'low' },
                    { maxBitrate: 800_000, id: 'high' },
                ],
            });
        } else {
            await member.publish(audioVideoStream.video);
        }
        const disposeVideoElement = (remoteVideo: HTMLVideoElement) => {
            const stream = remoteVideo.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            remoteVideo.srcObject = null;
            remoteVideo.remove();
        };

        newRoom.onMemberLeft.add((e: any) => {
            if (e.member.id === member.id) return;

            const remoteVideo = remoteVideos.querySelector(
                `[data-member-id="${e.member.id}"]`,
            ) as HTMLVideoElement;
            disposeVideoElement(remoteVideo);

            messages.textContent += `=== ${e.member.id.slice(0, 5)} left ===\n`;
        });

        member.onLeft.once(() => {
            Array.from(remoteVideos.children).forEach((element) => {
                disposeVideoElement(element as HTMLVideoElement);
            });
            messages.textContent += '== You left ===\n';
            void newRoom.dispose();
            setRoom(null);
        });

        leaveTrigger.addEventListener('click', () => member.leave(), {
            once: true,
        });
    };
    const getRoomTypeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'p2p');

    const onPublicationSubscribed = (removeVideos: HTMLElement, room: any) => async ({ stream, subscription }: any) => {
        const userVideo: Record<string, HTMLVideoElement> = {};
        if (stream.contentType === 'data') return;

        const publisherId = subscription.publication.publisher.id;
        if (!userVideo[publisherId]) {
            const newVideo = document.createElement('video');
            newVideo.playsInline = true;
            newVideo.autoplay = true;
            newVideo.setAttribute(
                'data-member-id',
                subscription.publication.publisher.id,
            );

            removeVideos.append(newVideo);
            userVideo[publisherId] = newVideo;
        }
        const newVideo = userVideo[publisherId];
        stream.attach(newVideo);

        if (subscription.contentType === 'video' && room.type === 'sfu') {
            newVideo.onclick = () => {
                if (subscription.preferredEncoding === 'low') {
                    subscription.changePreferredEncoding('high');
                } else {
                    subscription.changePreferredEncoding('low');
                }
            };
        }
    }

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
                            <Button id="js-join-trigger" onClick={onClick}>
                                Join
                            </Button>
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
