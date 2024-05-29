import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function GettingStarted() {
    return (
        <div className="flex w-full flex-col items-center">
                <Image src="/matching.svg" alt="Matching" width={500} height={500} />
                <Button>
                    <Link href="/join">マッチングを開始</Link>
                </Button>
        </div>
    );
}
