"use client";

import { IoCheckmark, IoNotificationsOutline } from "react-icons/io5";
import { useMockSession, useMockSubscriptions } from "@/lib/mockSession";

// Subscribe to a comic: the reader is told when a new episode drops. Signed out, it flips the mock
// sign-in first, like the library and like buttons. (Subscriber counts need the live API.)
export function SubscribeButton({ uuid, title, className = "" }: { uuid: string; title: string; className?: string }) {
  const { user, signIn } = useMockSession();
  const subscriptions = useMockSubscriptions();
  const subscribed = subscriptions.has(uuid);

  return (
    <button
      type="button"
      onClick={() => {
        if (!user) signIn();
        subscriptions.toggle(uuid);
      }}
      aria-pressed={subscribed}
      aria-label={subscribed ? `Unsubscribe from ${title}` : `Subscribe to ${title}`}
      title={subscribed ? "You'll hear about every new episode" : "Get told when a new episode drops"}
      className={`btn gap-2 px-6 py-3 text-base ${subscribed ? "border-mint text-mint hover:bg-mint hover:text-ink" : "btn-ghost"} ${className}`}
    >
      {subscribed ? <IoCheckmark className="text-lg" /> : <IoNotificationsOutline className="text-lg" />}
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
