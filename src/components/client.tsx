'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uuidV4 } from '@skyway-sdk/token';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Channel = {
    id: string;
    waitId1: string;
    waitId2: string;
};

export default function Client({
    token,
    channel: matchedChannel,
    waitId,
}: {
    token: string;
    channel?: Channel;
    waitId?: string;
}) {
    const [context, setContext] = useState<
        import('@skyway-sdk/room').SkyWayContext | null
    >(null);
    const [room, setRoom] = useState<
        import('@skyway-sdk/room').P2PRoom | import('@skyway-sdk/room').SfuRoom | null
    >(null);
    const [audioVideoStream, setAudioVideoStream] = useState<any>(null);
    const [channel, setChannel] = useState<Channel | undefined>(matchedChannel);

    const [videoOn, setVideoOn] = useState(true);
    const [micOn, setMicOn] = useState(true);

    const localVideo = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        (async () => {
            if (waitId) {
                timer = setInterval(async () => {
                    const query_params = new URLSearchParams({
                        waitId,
                    });
                    const res = await fetch('/api/match?' + query_params);
                    if (res.status !== 404) {
                        const data = await res.json();
                        setChannel(data);
                        clearInterval(timer);
                    }
                }, 1000);
            }

            const { SkyWayContext, SkyWayStreamFactory } = await import(
                '@skyway-sdk/room'
            );
            const roomMode = document.getElementById('js-room-type')!;

            roomMode.textContent = getRoomTypeByHash();
            window.addEventListener('hashchange', () => {
                roomMode.textContent = getRoomTypeByHash();
            });

            const { audio, video } =
                await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

            if (localVideo.current) {
                localVideo.current.muted = true;
                localVideo.current.playsInline = true;
                video.attach(localVideo.current);
                await localVideo.current.play();
            }

            setAudioVideoStream({ audio, video });

            const context = await SkyWayContext.Create(token, {
                log: { level: 'warn', format: 'object' },
            });
            setContext(context);
        })();

        return () => {
            clearInterval(timer);
        };
    }, [token, localVideo, waitId]);

    const onClick = async () => {
        if (!channel) {
            return;
        }

        const { SkyWayRoom } = await import('@skyway-sdk/room');

        const leaveTrigger = document.getElementById('js-leave-trigger')!;
        const remoteVideos = document.getElementById('js-remote-streams')!;
        const messages = document.getElementById('js-messages')!;

        if (room || !context) {
            return;
        }
        const newRoom = await SkyWayRoom.FindOrCreate(context, {
            name: channel.id,
            type: getRoomTypeByHash(),
        });
        setRoom(newRoom);

        const member = await newRoom.join();
        messages.textContent += '=== You joined ===\n';

        newRoom.onMemberJoined.add((e: any) => {
            messages.textContent += `=== ${e.member.id.slice(0, 5)} joined ===\n`;
        });

        member.onPublicationSubscribed.add(
            onPublicationSubscribed(remoteVideos, newRoom),
        );
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

    const onPublicationSubscribed =
        (removeVideos: HTMLElement, room: any) =>
        async ({ stream, subscription }: any) => {
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
        };

    const turnOffVideo = () => {
        setVideoOn((p) => !p);
        const src = localVideo.current!.srcObject! as MediaStream;
        src.getVideoTracks()
            .forEach((track) => {
                track.enabled = !track.enabled;
            });
    };

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
                        <video ref={localVideo}></video>
                        <span id="js-room-type"></span>:
                        {channel ? (
                            <div className="flex w-full max-w-sm items-center space-x-2">
                                <Button
                                    id="js-join-trigger"
                                    onClick={onClick}
                                    disabled={!context}
                                >
                                    Join
                                </Button>
                                <Button id="js-leave-trigger">Leave</Button>
                            </div>
                        ) : (
                            <>マッチング中</>
                        )}
                    </div>

                    <Button variant="outline" size="icon" onClick={turnOffVideo}>
                        {videoOn ? <Video /> : <VideoOff />}
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMicOn((p) => !p)}
                    >
                        {micOn ? <Mic /> : <MicOff />}
                    </Button>

                    <div className="remote-streams" id="js-remote-streams"></div>

                    <div>
                        <pre className="messages" id="js-messages"></pre>
                    </div>
                </div>
            </div>
        </main>
    );
}
<Video strokeWidth={1.5} />;
