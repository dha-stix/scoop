import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { avatars, scenes } from "@/images";

// Dark brand panel shown beside the login form on large screens.
export default function AuthVisual() {
  return (
    <div className="relative hidden min-h-[560px] flex-1 basis-[480px] items-center justify-center overflow-hidden bg-ink px-8 py-14 text-white xl:flex">
      <div className="pointer-events-none absolute -top-24 -right-28 size-[520px] rounded-full bg-violet opacity-50 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 size-[360px] rounded-full bg-lime opacity-25 blur-[140px]" />
      <div className="relative w-full max-w-[460px]">
        <div className="relative h-[300px] overflow-hidden rounded-3xl">
          <Image
            src={scenes.teamCelebrating}
            alt="Two colleagues celebrating a new hire in a bright office"
            fill
            sizes="460px"
            className="object-cover"
            placeholder="blur"
            priority
          />
        </div>
        <div className="relative mx-6 -mt-10 animate-float rounded-[18px] bg-white p-4.5 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <Avatar src={avatars.amara} name="Amara O." size={40} />
            <div className="flex-1">
              <div className="text-sm font-bold">Offer accepted</div>
              <div className="text-xs text-muted">Amara O. · Product Designer</div>
            </div>
            <Badge tone="success">Hired</Badge>
          </div>
        </div>
        <h2 className="mt-10 mb-2.5 text-[32px] leading-tight font-bold">Every step of hiring, finally in one place.</h2>
        <p className="leading-relaxed text-[#b8bdcf]">Post roles, review CVs, interview live and send offers — without leaving Scoop.</p>
      </div>
    </div>
  );
}
